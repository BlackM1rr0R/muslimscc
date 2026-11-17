// ═══════════════════════════════════════════════════════
// MosqueCollection — "Məscid kolleksiyam" (/mosques, /account)
//
//   <MosqueCollection lang="az" compact moreHref onMore />
//
// • Məlumat: utils/mosqueVisits (mosque_visits_v1) — şəxsi, hesabla uçdan-uca şifrəli sinxron.
// • "Buradayam": cihazın yeri → OpenStreetMap Overpass (utils/osmQuery — məscid axtarışı ilə eyni
//   xidmət, yeni xarici xidmət / CSP yoxdur) → ən yaxın məscidlər → seçin + qısa qeyd.
//   Heç nə tapılmasa — adını yazıb bu yeri əlavə etmək olar.
// • Xəritə: world-atlas ölkə sərhədləri (saytın öz faylı, d3-geo) — ziyarət olunan ölkələr rənglənir,
//   məscidlər nöqtədir. Xəritə şəkildir (role="img"); eyni məlumat aşağıdakı siyahıdadır.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { formatGregorian, parseGKey } from '../../utils/hijri'
import { makeFormat } from '../viz/format.js'
import { overpass, haversine, formatDistance } from '../../utils/osmQuery'
import { readVisits, writeVisits, removeVisit, setNote, visitStats, VISITS_EVENT, VISITS_KEY, NOTE_MAX, NAME_MAX } from '../../utils/mosqueVisits'
import { loadCountries, checkInMosque } from '../../utils/mosqueCountry'
import { MC_TXT } from './mosqueText'
import '../../styles/MosqueCollection.css'

const W = 720, LAT_TOP = 84, LAT_BOT = -58
const K = W / (2 * Math.PI)
const H = Math.round(K * ((LAT_TOP - LAT_BOT) * Math.PI) / 180)
const NEAR_M = 300

const dayLabel = (d, lang) => { const g = parseGKey(d); return g ? formatGregorian(g, lang) : d }

function useVisits() {
  const [data, setData] = useState(() => (typeof window === 'undefined' ? { v: 1, l: [] } : readVisits()))
  useEffect(() => {
    const re = () => setData(readVisits())
    const onStorage = (e) => { if (!e.key || e.key === VISITS_KEY) re() }
    window.addEventListener(VISITS_EVENT, re)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(VISITS_EVENT, re); window.removeEventListener('storage', onStorage) }
  }, [])
  return data
}

function WorldMap({ visits, label }) {
  const [countries, setCountries] = useState(null)
  useEffect(() => {
    let off = false
    loadCountries().then((fs) => { if (!off) setCountries(fs) }).catch(() => { if (!off) setCountries([]) })
    return () => { off = true }
  }, [])
  const proj = useMemo(() => geoEquirectangular().scale(K).translate([W / 2, (K * LAT_TOP * Math.PI) / 180]).clipExtent([[0, 0], [W, H]]), [])
  const paths = useMemo(() => {
    if (!countries) return null
    const gp = geoPath(proj)
    return countries.map((f, i) => ({ id: f.id != null ? String(f.id).padStart(3, '0') : `x${i}`, d: gp(f) || '' }))
  }, [countries, proj])
  const visited = useMemo(() => new Set(visits.map((v) => v.cc).filter(Boolean)), [visits])
  const pts = useMemo(() => visits.map((v) => ({ i: v.i, p: proj([v.lo, v.la]) })).filter((x) => x.p && x.p[1] >= 0 && x.p[1] <= H), [visits, proj])
  return (
    <svg className="mc__map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} data-testid="mc-map" data-points={pts.length}>
      <rect width={W} height={H} rx="12" className="mc__sea" />
      {paths ? paths.map((c) => <path key={c.id} d={c.d} className={`mc__land${visited.has(c.id) ? ' is-visited' : ''}`} />)
        : <text x={W / 2} y={H / 2} textAnchor="middle" className="mc__loading">…</text>}
      {pts.map((x) => (
        <g key={x.i} className="mc__pt">
          <circle cx={x.p[0]} cy={x.p[1]} r="7" className="mc__pt-halo" />
          <circle cx={x.p[0]} cy={x.p[1]} r="3.6" className="mc__pt-dot" />
        </g>
      ))}
    </svg>
  )
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('geo')); return }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 })
  })
}

function CheckIn({ t, lang, onDone }) {
  const [st, setSt] = useState('locating')      // locating | searching | pick | none | geo | api
  const [pos, setPos] = useState(null)
  const [list, setList] = useState([])
  const [choice, setChoice] = useState('')
  const [note, setNoteText] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const headRef = useRef(null)
  const ctrl = useRef(null)

  useEffect(() => {
    let off = false
    ctrl.current = new AbortController()
    ;(async () => {
      let lat, lon
      try {
        const p = await getPosition()
        lat = p.coords.latitude; lon = p.coords.longitude
      } catch { if (!off) setSt('geo'); return }
      if (off) return
      setPos({ lat, lon })
      setSt('searching')
      try {
        const q = `[out:json][timeout:20];nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${NEAR_M},${lat},${lon});out center;`
        const data = await overpass(q, { signal: ctrl.current.signal })
        if (off) return
        const res = (data.elements || []).map((el) => {
          const la = el.lat ?? el.center?.lat, lo = el.lon ?? el.center?.lon
          return {
            id: `${String(el.type || 'n')[0]}${el.id}`,
            name: el.tags?.[`name:${lang}`] || el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:ar'] || '',
            la, lo, dist: Number.isFinite(la) && Number.isFinite(lo) ? haversine(lat, lon, la, lo) : NaN,
          }
        }).filter((m) => Number.isFinite(m.dist)).sort((a, b) => a.dist - b.dist).slice(0, 8)
        setList(res)
        setChoice(res[0]?.id || '')
        setSt(res.length ? 'pick' : 'none')
      } catch { if (!off) setSt('api') }
    })()
    return () => { off = true; ctrl.current?.abort() }
  }, [lang])
  useEffect(() => { if (st === 'pick' || st === 'none' || st === 'geo' || st === 'api') headRef.current?.focus({ preventScroll: true }) }, [st])

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    let m = null
    if (st === 'pick') {
      const x = list.find((y) => y.id === choice)
      if (x) m = { osm: x.id, n: x.name, la: x.la, lo: x.lo, no: note }
    } else if (st === 'none' && pos && name.trim()) m = { n: name, la: pos.lat, lo: pos.lon, no: note }
    if (!m) return
    setBusy(true)
    try { const r = await checkInMosque(m); onDone(r.added ? t.added : t.again) } finally { setBusy(false) }
  }

  if (st === 'locating' || st === 'searching') {
    return <p className="mc__status" role="status"><span className="mc__spin" aria-hidden="true" /> {st === 'locating' ? t.locating : t.searching}</p>
  }
  if (st === 'geo' || st === 'api') {
    return (
      <div className="mc__err" role="alert">
        <p ref={headRef} tabIndex={-1}>{st === 'geo' ? t.geoErr : t.apiErr}</p>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onDone('')}>{t.cancel}</button>
      </div>
    )
  }
  return (
    <form className="mc__form" onSubmit={submit} data-testid="mc-form">
      {st === 'pick' ? (
        <fieldset className="mc__pick">
          <legend ref={headRef} tabIndex={-1}>{t.pick}</legend>
          {list.map((x) => (
            <label key={x.id} className="mc__opt">
              <input type="radio" name="mc-pick" value={x.id} checked={choice === x.id} onChange={() => setChoice(x.id)} />
              <span className="mc__opt-name">{x.name || t.unnamed}</span>
              <bdi className="mc__opt-dist ui-num">{formatDistance(x.dist)}</bdi>
            </label>
          ))}
        </fieldset>
      ) : (
        <>
          <p ref={headRef} tabIndex={-1} className="mc__muted">{t.none}</p>
          <label className="ui-field" htmlFor="mc-name">
            <span className="ui-field__label">{t.manualName}</span>
            <input id="mc-name" className="ui-input" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} required />
          </label>
        </>
      )}
      <label className="ui-field" htmlFor="mc-note">
        <span className="ui-field__label">{t.note}</span>
        <textarea id="mc-note" className="ui-input mc__note-in" rows={2} maxLength={NOTE_MAX} value={note} onChange={(e) => setNoteText(e.target.value)}
          aria-describedby="mc-note-n" />
        <span id="mc-note-n" className="mc__count ui-num">{note.length}/{NOTE_MAX}</span>
      </label>
      <div className="mc__row">
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || (st === 'none' && !name.trim())} data-testid="mc-add">
          <Icon name="plus" className="ui-btn__icon" /> {st === 'pick' ? t.add : t.addHere}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onDone('')}>{t.cancel}</button>
      </div>
      <p className="mc__src">{t.source}</p>
    </form>
  )
}

function VisitItem({ v, t, lang, fmt }) {
  const [edit, setEdit] = useState(false)
  const [val, setVal] = useState(v.no || '')
  const name = v.n || t.unnamed
  const save = (e) => {
    e.preventDefault()
    writeVisits(setNote(readVisits(), v.i, val))
    setEdit(false)
  }
  const del = () => {
    if (!window.confirm(t.delAsk)) return
    writeVisits(removeVisit(readVisits(), v.i))
  }
  return (
    <li className="mc__item" data-testid="mc-item" data-id={v.i}>
      <span className="ui-icon-tile mc__ic" aria-hidden="true"><Icon name="mosques" size={18} /></span>
      <div className="mc__body">
        <strong className="mc__name">{name}</strong>
        <span className="mc__meta">
          {t.first}: {dayLabel(v.d, lang)}{v.c > 1 && <> · <span className="ui-num">{t.times(fmt.num(v.c))}</span></>}
        </span>
        {edit ? (
          <form className="mc__edit" onSubmit={save}>
            <label className="ui-sr-only" htmlFor={`mc-n-${v.i}`}>{t.noteFor(name)}</label>
            <textarea id={`mc-n-${v.i}`} className="ui-input" rows={2} maxLength={NOTE_MAX} value={val} onChange={(e) => setVal(e.target.value)} />
            <div className="mc__row">
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm">{t.save}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setEdit(false); setVal(v.no || '') }}>{t.cancel}</button>
            </div>
          </form>
        ) : v.no ? <p className="mc__note">{v.no}</p> : null}
      </div>
      {!edit && (
        <div className="mc__acts">
          <button type="button" className="ui-icon-btn" onClick={() => setEdit(true)} aria-label={`${t.editNote}: ${name}`} title={t.editNote}><Icon name="edit" size={16} /></button>
          <button type="button" className="ui-icon-btn" onClick={del} aria-label={`${t.del}: ${name}`} title={t.del}><Icon name="trash" size={16} /></button>
        </div>
      )}
    </li>
  )
}

export default function MosqueCollection({ lang = 'az', compact = false, moreHref, onMore }) {
  const t = pickUi(MC_TXT, lang, 'en')
  const fmt = useMemo(() => makeFormat(lang), [lang])
  const data = useVisits()
  const [checking, setChecking] = useState(false)
  const [msg, setMsg] = useState('')
  const stats = visitStats(data)
  const list = useMemo(() => data.l.slice().sort((a, b) => (a.ld < b.ld ? 1 : a.ld > b.ld ? -1 : 0)), [data])
  const mapLabel = t.map(stats.mosques, stats.countries)

  return (
    <section className={`ui-card mc${compact ? ' mc--compact' : ''}`} {...(compact ? { 'aria-label': t.title } : { 'aria-labelledby': 'mc-title' })}
      data-testid="mosque-collection" data-count={stats.mosques} data-countries={stats.countries}>
      {!compact && <>
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 className="mc__title" id="mc-title">{t.title}</h2>
        <p className="mc__lead">{t.lead}</p>
      </>}

      <dl className="mc__stats">
        <div><dt>{t.mosques}</dt><dd className="ui-num" data-testid="mc-n">{fmt.num(stats.mosques)}</dd></div>
        <div><dt>{t.countries}</dt><dd className="ui-num">{fmt.num(stats.countries)}</dd></div>
        <div><dt>{t.visits}</dt><dd className="ui-num">{fmt.num(stats.visits)}</dd></div>
      </dl>

      {(stats.mosques > 0 || !compact) && <WorldMap visits={data.l} label={mapLabel} />}

      {!compact && (checking
        ? <CheckIn t={t} lang={lang} onDone={(m) => { setChecking(false); setMsg(m) }} />
        : (
          <div className="mc__row">
            <button type="button" className="ui-btn ui-btn--primary" onClick={() => { setMsg(''); setChecking(true) }} data-testid="mc-here">
              <Icon name="pin" className="ui-btn__icon" /> {t.here}
            </button>
          </div>
        ))}
      <p className="mc__status" role="status">{msg}</p>

      {list.length ? (
        <>
          <h3 className="mc__h3">{t.listTitle}</h3>
          <ul className="mc__list">
            {list.map((v) => <VisitItem key={v.i} v={v} t={t} lang={lang} fmt={fmt} />)}
          </ul>
        </>
      ) : <p className="mc__muted">{t.empty}</p>}

      {moreHref && (
        <a className="ui-link mc__more" href={moreHref} onClick={(e) => { if (onMore && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); onMore() } }}>
          {t.more} <Icon name="arrow" size={14} className="ui-flip-rtl" />
        </a>
      )}
      <p className="mc__privacy"><Icon name="lock" size={14} /> {t.privacy}</p>
    </section>
  )
}
