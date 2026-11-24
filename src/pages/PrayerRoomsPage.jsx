// ═══════════════════════════════════════════════════════
// /prayer-rooms — namaz otaqları (server/prayerRooms.js). noindex (istifadəçi məzmunu).
// • İctimai siyahı (təsdiqlənmiş yerlər): şəhər / növ süzgəci; "Yaxınımdakılar" — brauzerin geolokasiyası
//   YALNIZ klientdə (məsafə burada hesablanır, serverə getmir); 10 km-dəki yerlər məscid radarında
//   (components/MosqueRadar — məscid səhifəsinin xəritə komponenti, kafel xəritəsi yoxdur).
// • Girişli istifadəçi yer təklif edir: koordinat "Hazırkı yerimi götür" (geolokasiya) və ya əl ilə;
//   nöqtəni OpenStreetMap-də yoxlamaq üçün keçid (yalnız istifadəçi toxunanda açılır).
// • Şikayət ("bağlanıb / səhvdir") — girişli. Bütün mətnlər React ilə escape olunur (HTML yoxdur).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import MosqueRadar from '../components/MosqueRadar'
import { haversine, formatDistance } from '../utils/osmQuery'
import { useAuthUser, refreshMe } from '../api/userSession'
import { apiErrCode } from '../components/account/communityText'
import VerifyEmailNote from '../components/account/VerifyEmailNote'
import { Msg, Confirm } from '../components/community/CommunityUi'
import { PR, ROOM_TYPES, osmLink } from '../components/boards/boardsText'
import {
  PRAYER_ROOM_TYPES, getPrayerRooms, getMyPrayerRooms, submitPrayerRoom, deletePrayerRoom, reportPrayerRoom,
} from '../api/communityBoards'
import '../styles/ReadTogether.css'
import '../styles/Account.css'
import '../styles/Community.css'
import '../styles/CommunityBoards.css'

const geo = () => new Promise((resolve, reject) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) { reject(new Error('no geolocation')); return }
  navigator.geolocation.getCurrentPosition((p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }), reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
})

export default function PrayerRoomsPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(PR, lang, 'en')
  const types = pickUi(ROOM_TYPES, lang, 'en')
  const { status } = useAuthUser()
  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])
  const signedIn = status === 'user'

  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [data, setData] = useState(null)      // { items, cities }
  const [failed, setFailed] = useState(false)
  const [origin, setOrigin] = useState(null)  // { lat, lon } — yalnız yaddaşda
  const [geoState, setGeoState] = useState('idle')
  const [mine, setMine] = useState(null)

  const load = useCallback(() => {
    setFailed(false)
    getPrayerRooms({ city, type }).then((r) => setData(r)).catch(() => { setFailed(true); setData((d) => d || { items: [], cities: [] }) })
  }, [city, type])
  useEffect(() => { load() }, [load])
  const loadMine = useCallback(() => getMyPrayerRooms().then(setMine).catch(() => setMine(null)), [])
  useEffect(() => { if (signedIn) loadMine() }, [signedIn, loadMine])

  const onNear = async () => {
    if (origin) { setOrigin(null); return }
    setGeoState('busy')
    try { setOrigin(await geo()); setGeoState('idle') } catch { setGeoState('error') }
  }

  const items = useMemo(() => {
    const list = (data?.items || []).map((r) => ({ ...r, distance: origin ? haversine(origin.lat, origin.lon, r.lat, r.lng) : null }))
    if (origin) list.sort((a, b) => a.distance - b.distance)
    return list
  }, [data, origin])
  const radar = useMemo(() => (origin ? items.filter((r) => r.distance <= 10).map((r) => ({ id: r.id, name: r.name, lat: r.lat, lon: r.lng, distance: r.distance })) : []), [items, origin])

  const loginHref = `${pathFor('login', siteLang)}?next=${encodeURIComponent(pathFor('prayerrooms', siteLang))}`
  return (
    <div className="acc-account cb-page" data-testid="prayer-rooms-page">
      <section className="ui-page-hero">
        <div className="ui-container">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          <p className="ui-lead ui-lead--full">{t.lead}</p>
        </div>
      </section>
      <div className="ui-container cb-layout">
        <section className="cb-main" aria-labelledby="pr-list-title">
          <div className="ui-card cb-filters" role="search">
            <label className="ui-field cb-filters__city">
              <span className="ui-field__label">{t.city}</span>
              <select className="ui-select" value={city} onChange={(e) => setCity(e.target.value)} data-testid="pr-city">
                <option value="">{t.allCities}</option>
                {(data?.cities || []).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <div className="cb-chips" role="group" aria-label={t.type}>
              <button type="button" className="ui-chip" aria-pressed={type === ''} onClick={() => setType('')}>{t.allTypes}</button>
              {PRAYER_ROOM_TYPES.map((k) => (
                <button key={k} type="button" className="ui-chip" aria-pressed={type === k} onClick={() => setType(k)} data-testid={`pr-type-${k}`}>{types[k]}</button>
              ))}
            </div>
            <div className="rt-row">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onNear} disabled={geoState === 'busy'} aria-pressed={Boolean(origin)} data-testid="pr-near">
                <Icon name="pin" className="ui-btn__icon" /> {geoState === 'busy' ? t.nearBusy : origin ? t.nearOff : t.near}
              </button>
            </div>
            {geoState === 'error' && <p className="rt-note" role="status">{t.nearErr}</p>}
            <p className="cb-hint">{t.nearNote}</p>
          </div>

          {origin && radar.length > 0 && (
            <MosqueRadar origin={origin} mosques={radar} lang={lang} testId="pr-radar" text={{ title: t.radarTitle, sum: t.radarSum }} />
          )}

          <div className="rt-row cb-listhead">
            <h2 className="acc-section__title" id="pr-list-title">{t.list}</h2>
            {data && <span className="rt-note ui-num" data-testid="pr-count">{t.count(items.length)}</span>}
          </div>
          {!data && <p className="rt-note">{t.loading}</p>}
          {failed && (
            <div className="rt-row"><p className="rt-note">{t.loadErr}</p><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={load}>{t.retry}</button></div>
          )}
          {data && !failed && items.length === 0 && (
            <div className="ui-card dw-empty" data-testid="pr-empty">
              <span className="dw-empty__icon" aria-hidden="true"><Icon name="prayerrooms" size={28} /></span>
              <p className="dw-empty__text">{t.empty}</p>
            </div>
          )}
          {items.length > 0 && (
            <ul className="cb-grid" data-testid="pr-list">
              {items.map((r) => <RoomCard key={r.id} r={r} t={t} types={types} lang={lang} signedIn={signedIn} loginHref={loginHref} />)}
            </ul>
          )}
        </section>

        <aside className="acc-sections cb-side">
          <section className="ui-card acc-section" aria-labelledby="pr-form-title" data-testid="pr-form-section">
            <h2 className="acc-section__title" id="pr-form-title"><Icon name="plus" size={18} /> {t.formTitle}</h2>
            <p className="rt-note">{t.rules}</p>
            {signedIn ? <SubmitForm t={t} types={types} lang={lang} onSent={loadMine} /> : (
              <div className="rt-row">
                <p className="rt-note">{t.login}</p>
                <a className="ui-btn ui-btn--primary ui-btn--sm" href={loginHref}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.loginBtn}</a>
              </div>
            )}
          </section>
          {signedIn && mine && mine.items.length > 0 && (
            <section className="ui-card acc-section" aria-labelledby="pr-mine-title" data-testid="pr-mine">
              <h2 className="acc-section__title" id="pr-mine-title">{t.mine}</h2>
              <ul className="rt-list">
                {mine.items.map((m) => (
                  <li key={m.id} className="rt-list__item">
                    <span>
                      <bdi className="cb-strong">{m.name}</bdi> · <bdi>{m.city}</bdi><br />
                      <span className="rt-badge" data-testid="pr-mine-status">{t.status[m.status] || m.status}</span>
                      {m.status === 'rejected' && m.reason && <span className="rt-note"> — {t.reasons[m.reason] || m.reason}</span>}
                    </span>
                    <Confirm t={{ confirm: t.delConfirm, yes: t.yes, cancel: t.cancel }} label={t.del} icon="trash" onYes={() => deletePrayerRoom(m.id).then(loadMine).catch(() => {})} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function RoomCard({ r, t, types, lang, signedIn, loginHref }) {
  const uid = useId()
  const [reporting, setReporting] = useState(false)
  const [kind, setKind] = useState('closed')
  const [note, setNote] = useState('')
  const [state, setState] = useState(null) // 'done' | 'verify' | 'error'
  const send = async () => {
    try { await reportPrayerRoom(r.id, kind, note.trim()); setState('done'); setReporting(false) } catch (err) {
      setReporting(false)
      setState(apiErrCode(err) === 'verify_email' ? 'verify' : 'error')
    }
  }
  return (
    <li className="ui-card cb-card" data-testid="pr-card">
      <div className="cb-card__head">
        <span className="ui-icon-tile" aria-hidden="true"><Icon name="prayerrooms" size={20} /></span>
        <div>
          <h3 className="cb-card__title" dir="auto">{r.name}</h3>
          <p className="cb-card__meta"><span className="rt-badge">{types[r.type] || r.type}</span> <bdi>{r.city}</bdi>{r.address ? <> · <bdi>{r.address}</bdi></> : null}</p>
        </div>
      </div>
      {r.floor && <p className="cb-card__line"><b>{t.floor}:</b> <bdi>{r.floor}</bdi></p>}
      {r.notes && <p className="cb-card__line cm-pre" dir="auto">{r.notes}</p>}
      {(r.wudu || r.women) && (
        <ul className="cb-tags">
          {r.wudu && <li><Icon name="check" size={14} /> {t.wudu}</li>}
          {r.women && <li><Icon name="check" size={14} /> {t.women}</li>}
        </ul>
      )}
      <div className="cb-card__row">
        <a className="ui-btn ui-btn--ghost ui-btn--sm" href={osmLink(r.lat, r.lng)} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={14} /> {t.openMap}</a>
        {r.distance != null && <span className="rt-note ui-num" data-testid="pr-distance">{t.fromYou(formatDistance(r.distance))}</span>}
      </div>
      {state === 'verify' ? <VerifyEmailNote lang={lang} testId="pr-report-verify" /> : state === 'done' ? <p className="rt-note" role="status">{t.reported}</p> : reporting ? (
        <div className="cb-report">
          <label className="ui-field" htmlFor={`${uid}-k`}>
            <span className="ui-field__label">{t.report}</span>
            <select id={`${uid}-k`} className="ui-select" value={kind} onChange={(e) => setKind(e.target.value)} data-testid="pr-report-kind">
              {Object.keys(t.reportKinds).map((k) => <option key={k} value={k}>{t.reportKinds[k]}</option>)}
            </select>
          </label>
          <label className="ui-field" htmlFor={`${uid}-n`}>
            <span className="ui-field__label">{t.reportNote}</span>
            <input id={`${uid}-n`} className="ui-input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="rt-row">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={send} data-testid="pr-report-send">{t.reportSend}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setReporting(false)}>{t.cancel}</button>
          </div>
        </div>
      ) : signedIn ? (
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm cb-card__report" onClick={() => setReporting(true)} data-testid="pr-report"><Icon name="alert" size={14} /> {t.report}</button>
      ) : (
        <a className="ui-btn ui-btn--ghost ui-btn--sm cb-card__report" href={loginHref}><Icon name="alert" size={14} /> {t.report}</a>
      )}
      {state === 'error' && <p className="rt-note">{t.err.generic}</p>}
    </li>
  )
}

const num = (s) => { const v = Number(String(s).replace(',', '.').trim()); return String(s).trim() !== '' && Number.isFinite(v) ? v : null }

function SubmitForm({ t, types, lang, onSent }) {
  const uid = useId()
  const empty = { name: '', type: '', city: '', address: '', floor: '', notes: '', lat: '', lng: '', wudu: false, women: false }
  const [f, setF] = useState(empty)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loc, setLoc] = useState('idle')
  const [needVerify, setNeedVerify] = useState(false)
  const set = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setF((x) => ({ ...x, [k]: v })) }
  const lat = num(f.lat), lng = num(f.lng)
  const coordsOk = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  const ready = f.name.trim().length >= 2 && f.city.trim() && f.type && coordsOk

  const useLoc = async () => {
    setLoc('busy')
    try { const p = await geo(); setF((x) => ({ ...x, lat: p.lat.toFixed(5), lng: p.lon.toFixed(5) })); setLoc('idle') } catch { setLoc('error') }
  }
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true); setMsg(null); setNeedVerify(false)
    try {
      await submitPrayerRoom({ name: f.name.trim(), type: f.type, city: f.city.trim(), address: f.address.trim(), floor: f.floor.trim(), notes: f.notes.trim(), lat, lng, wudu: f.wudu, women: f.women })
      setF(empty)
      setMsg({ tone: 'ok', text: t.sent })
      onSent()
    } catch (err) {
      const c = apiErrCode(err)
      if (c === 'verify_email') setNeedVerify(true)
      else setMsg({ tone: 'bad', text: t.err[c] || t.err.generic })
    } finally { setBusy(false) }
  }
  return (
    <form className="prf-form" onSubmit={onSubmit} noValidate data-testid="pr-form">
      <label className="ui-field" htmlFor={`${uid}-name`}>
        <span className="ui-field__label">{t.name}</span>
        <input id={`${uid}-name`} className="ui-input" value={f.name} maxLength={80} onChange={set('name')} aria-describedby={`${uid}-nh`} data-testid="pr-name" />
        <span className="ui-field__hint" id={`${uid}-nh`}>{t.nameHint}</span>
      </label>
      <label className="ui-field" htmlFor={`${uid}-type`}>
        <span className="ui-field__label">{t.type}</span>
        <select id={`${uid}-type`} className="ui-select" value={f.type} onChange={set('type')} data-testid="pr-form-type">
          <option value="">—</option>
          {PRAYER_ROOM_TYPES.map((k) => <option key={k} value={k}>{types[k]}</option>)}
        </select>
      </label>
      <label className="ui-field" htmlFor={`${uid}-city`}>
        <span className="ui-field__label">{t.city}</span>
        <input id={`${uid}-city`} className="ui-input" value={f.city} maxLength={60} autoComplete="address-level2" onChange={set('city')} data-testid="pr-form-city" />
      </label>
      <label className="ui-field" htmlFor={`${uid}-addr`}>
        <span className="ui-field__label">{t.address}</span>
        <input id={`${uid}-addr`} className="ui-input" value={f.address} maxLength={160} onChange={set('address')} />
      </label>
      <fieldset className="cb-coords">
        <legend className="ui-field__label">{t.coords}</legend>
        <div className="cb-coords__row">
          <label className="ui-field" htmlFor={`${uid}-lat`}>
            <span className="ui-field__label">{t.lat}</span>
            <input id={`${uid}-lat`} className="ui-input ui-num" inputMode="decimal" dir="ltr" value={f.lat} onChange={set('lat')} data-testid="pr-lat" />
          </label>
          <label className="ui-field" htmlFor={`${uid}-lng`}>
            <span className="ui-field__label">{t.lng}</span>
            <input id={`${uid}-lng`} className="ui-input ui-num" inputMode="decimal" dir="ltr" value={f.lng} onChange={set('lng')} data-testid="pr-lng" />
          </label>
        </div>
        <div className="rt-row">
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={useLoc} disabled={loc === 'busy'} data-testid="pr-use-loc"><Icon name="pin" className="ui-btn__icon" /> {loc === 'busy' ? t.locBusy : t.useLoc}</button>
          {coordsOk && <a className="ui-btn ui-btn--ghost ui-btn--sm" href={osmLink(lat, lng)} target="_blank" rel="noopener noreferrer">{t.checkMap}</a>}
        </div>
        {loc === 'error' && <p className="rt-note" role="status">{t.nearErr}</p>}
        <p className="cb-hint">{t.coordsHint}</p>
      </fieldset>
      <label className="ui-field" htmlFor={`${uid}-floor`}>
        <span className="ui-field__label">{t.floor}</span>
        <input id={`${uid}-floor`} className="ui-input" value={f.floor} maxLength={40} onChange={set('floor')} />
      </label>
      <label className="ui-field" htmlFor={`${uid}-notes`}>
        <span className="ui-field__label">{t.notes}</span>
        <textarea id={`${uid}-notes`} className="ui-input" rows={3} maxLength={300} value={f.notes} onChange={set('notes')} />
      </label>
      <label className="cb-check"><input type="checkbox" checked={f.wudu} onChange={set('wudu')} data-testid="pr-wudu" /> <span>{t.wudu}</span></label>
      <label className="cb-check"><input type="checkbox" checked={f.women} onChange={set('women')} data-testid="pr-women" /> <span>{t.women}</span></label>
      <div className="rt-row">
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !ready} data-testid="pr-submit"><Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {t.submit}</button>
      </div>
      {needVerify && <VerifyEmailNote lang={lang} testId="pr-verify" />}
      <Msg msg={msg} testId="pr-msg" />
    </form>
  )
}
