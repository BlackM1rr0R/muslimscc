// ═══════════════════════════════════════════════════════
// ScholarRoutes (v6.1) — "Elm yolları": alimlərin şəhərləri xəritədə, əsrlər boyu (/scholars)
//
//   <ScholarRoutes scholars={SCHOLARS} lang="az" nameOf={s => …} hrefOf={s => …} onOpen={(s, e) => …} />
//
// • Yerlər — kartın öz birthplace / city sahəsi (data/scholarPlaces.js → koordinat).
//   Qırıq xətt: doğulduğu yerdən yaşadığı şəhərə. Qızılı qövs: müəllim → tələbə
//   (utils/scholarChain → buildChain, yalnız kartlardakı müəllim/tələbə siyahısı).
// • İl sürüşdürücüsü (m. 600 → bu gün): həmin ilə qədər doğulan alimlər görünür, sağ olanlar parlayır.
//   "Oynat" — 14 saniyədə 14 əsr; hərəkət azaldılıbsa avtomatik oynatma yoxdur.
// • Xəritə: Natural Earth 110m (world-atlas) + d3-geo Merkator — ProphetPlacesMap ilə eyni.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { buildChain } from '../utils/scholarChain'
import { PLACE_AT, PLACE_ALSO } from '../data/scholarPlaces'
import '../styles/ScholarRoutes.css'

const T = {
  az: { ey: 'Elm yolları', title: 'Elm şəhərdən şəhərə necə yayıldı', lead: 'Alimlərin doğulduğu və yaşadığı şəhərlər, müəllimdən tələbəyə gedən yollar. İli sürüşdürün — 14 əsr bir xəritədə.', play: 'Oynat', pause: 'Dayandır', year: 'İl', alive: 'Bu ildə sağ olan alimlər', none: 'Bu ildə kartlarımızdakı alimlərdən heç biri sağ deyil — sürüşdürün.', born: 'doğulduğu yer', city: 'yaşadığı şəhər', chain: 'müəllim → tələbə', approx: '~ yeri təxminidir', all: 'Hamısı', place: 'Yer', src: 'Yerlər və müəllimlər — alimlərin öz kartlarından.', ah: 'h.' },
  en: { ey: 'Paths of knowledge', title: 'How knowledge travelled from city to city', lead: 'Where the scholars were born and lived, and the paths from teacher to student. Drag the year — 14 centuries on one map.', play: 'Play', pause: 'Pause', year: 'Year', alive: 'Scholars living in this year', none: 'None of the scholars on our cards is alive in this year — drag on.', born: 'birthplace', city: 'city where he lived', chain: 'teacher → student', approx: '~ location approximate', all: 'All', place: 'Place', src: 'Places and teachers come from the scholars’ own cards.', ah: 'AH' },
  ru: { ey: 'Пути знания', title: 'Как знание шло из города в город', lead: 'Города, где родились и жили учёные, и пути от учителя к ученику. Двигайте год — 14 веков на одной карте.', play: 'Пуск', pause: 'Пауза', year: 'Год', alive: 'Учёные, жившие в этом году', none: 'В этом году никто из учёных наших карточек не жил — двигайте дальше.', born: 'место рождения', city: 'город, где жил', chain: 'учитель → ученик', approx: '~ место приблизительно', all: 'Все', place: 'Место', src: 'Места и учителя взяты из карточек самих учёных.', ah: 'г. х.' },
  ar: { ey: 'طرق العلم', title: 'كيف انتقل العلم من مدينة إلى مدينة', lead: 'مدن مولد العلماء وإقامتهم، وطرق العلم من الشيخ إلى التلميذ. حرّك السنة — أربعة عشر قرنًا في خريطة واحدة.', play: 'تشغيل', pause: 'إيقاف', year: 'السنة', alive: 'العلماء الأحياء في هذه السنة', none: 'لا أحد من علماء بطاقاتنا حيّ في هذه السنة — واصل التحريك.', born: 'مكان المولد', city: 'مدينة الإقامة', chain: 'شيخ ← تلميذ', approx: '~ الموضع تقريبي', all: 'الكل', place: 'المكان', src: 'الأماكن والشيوخ من بطاقات العلماء أنفسهم.', ah: 'هـ' },
  tr: { ey: 'İlim yolları', title: 'İlim şehirden şehre nasıl yayıldı', lead: 'Âlimlerin doğduğu ve yaşadığı şehirler, hocadan talebeye giden yollar. Yılı kaydırın — 14 asır tek haritada.', play: 'Oynat', pause: 'Durdur', year: 'Yıl', alive: 'Bu yılda hayatta olan âlimler', none: 'Bu yılda kartlarımızdaki âlimlerden hiçbiri hayatta değil — kaydırmaya devam edin.', born: 'doğduğu yer', city: 'yaşadığı şehir', chain: 'hoca → talebe', approx: '~ yeri yaklaşıktır', all: 'Hepsi', place: 'Yer', src: 'Yerler ve hocalar âlimlerin kendi kartlarından.', ah: 'h.' },
}
const W = 900, H = 520
const Y0 = 600, Y1 = new Date().getFullYear()
const ERA_C = { salaf: '#e2b857', classical: '#5fc3a8', revival: '#7fa8ff', contemporary: '#f08a6c' }
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)).catch(e => { landCache = null; throw e }))
const motionOk = () => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('a11y-reduce-motion') } catch { return false } }
const hijri = (g) => Math.max(1, Math.round((g - 622) * 1.0307))
const born = (s) => s.born?.g ?? (s.died?.g ? s.died.g - 70 : 9999)
const died = (s) => s.died?.g ?? null
const pkey = ([la, lo]) => `${la.toFixed(1)},${lo.toFixed(1)}`

function arc([x1, y1], [x2, y2], bend = 0.22) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1
  const cx = mx - dy * bend, cy = my + dx * bend
  return { d: `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, len: Math.round(len * 1.15) }
}

export default function ScholarRoutes({ scholars, lang = 'az', nameOf, hrefOf, onOpen }) {
  const t = pickUi(T, lang)
  const [land, setLand] = useState(null)
  const [year, setYear] = useState(870)
  const [playing, setPlaying] = useState(false)
  const [place, setPlace] = useState(null)
  const raf = useRef(0)
  useEffect(() => { loadLand().then(setLand).catch(() => {}) }, [])

  const proj = useMemo(() => geoMercator().fitExtent([[16, 16], [W - 16, H - 16]], { type: 'MultiPoint', coordinates: [[-14, 15], [69, 44]] }), [])
  const path = useMemo(() => geoPath(proj), [proj])
  const xy = (at) => proj([at[1], at[0]])

  // Alim → { b: doğulduğu yerin koordinatı, c: şəhər(lər) }
  const people = useMemo(() => scholars.map(s => {
    const bn = s.birthplace?.en, cn = s.city?.en
    const b = bn && PLACE_AT[bn] ? PLACE_AT[bn] : null
    const cs = [cn && PLACE_AT[cn], cn && PLACE_ALSO[cn]].filter(Boolean)
    return { s, b, cs, bName: s.birthplace, cName: s.city, from: born(s), to: died(s) }
  }).filter(p => p.b || p.cs.length), [scholars])
  const bySlug = useMemo(() => Object.fromEntries(people.map(p => [p.s.slug, p])), [people])
  const chain = useMemo(() => buildChain(scholars).edges.filter(e => bySlug[e.from]?.cs[0] && bySlug[e.to]?.cs[0]), [scholars, bySlug])

  // Yerlər: eyni koordinat — bir nöqtə (adı ilk kartdakı yazıdan)
  const places = useMemo(() => {
    const m = new Map()
    const add = (at, nameObj, p, kind) => {
      const k = pkey(at)
      if (!m.has(k)) m.set(k, { k, at, name: nameObj, approx: Boolean(at[2]), list: [] })
      m.get(k).list.push({ p, kind })
    }
    for (const p of people) {
      if (p.b) add(p.b, p.bName, p, 'b')
      p.cs.forEach((c, i) => { if (!p.b || pkey(c) !== pkey(p.b)) add(c, i ? null : p.cName, p, 'c') })
    }
    for (const v of m.values()) if (!v.name) v.name = v.list.find(x => x.kind === 'c' && x.p.cName)?.p.cName || v.list[0].p.bName
    return [...m.values()]
  }, [people])

  const seen = (p) => p.from <= year
  const alive = (p) => p.from <= year && (p.to == null ? year <= Y1 : year <= p.to)
  const aliveList = people.filter(alive).filter(p => !place || [p.b, ...p.cs].some(a => a && pkey(a) === place))

  // Oynat: 600 → bu gün, ~14 s
  useEffect(() => {
    if (!playing) return undefined
    let last = performance.now()
    const tick = (now) => {
      const dt = now - last; last = now
      let done = false
      setYear(y => { const n = Math.min(Y1, y + dt * ((Y1 - Y0) / 14000)); if (n >= Y1) done = true; return n })
      if (done) { setPlaying(false); return }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing])
  const toggle = () => {
    if (playing) { setPlaying(false); return }
    if (!motionOk()) { setYear(Y1); return }
    if (year >= Y1 - 1) setYear(Y0)
    setPlace(null); setPlaying(true)
  }
  const y = Math.round(year)

  return (
    <section className="ui-section srt" aria-labelledby="srt-title" data-testid="scholar-routes">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="srt-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <div className="srt__grid">
          <div className="srt__map">
            <svg viewBox={`0 0 ${W} ${H}`} className="srt__svg" role="img" aria-label={`${t.title} — ${t.year} ${y}`} style={{ direction: 'ltr' }}>
              <rect width={W} height={H} className="srt__sea" />
              {land && <path d={path(land)} className="srt__land" />}
              {people.filter(seen).map(p => p.b && p.cs.map((c, i) => {
                if (pkey(c) === pkey(p.b)) return null
                const a = arc(xy(p.b), xy(c), 0.12)
                return <path key={`${p.s.slug}-j${i}`} d={a.d} className={`srt__journey${alive(p) ? ' is-alive' : ''}`} style={{ '--len': a.len, stroke: ERA_C[p.s.era] }} />
              }))}
              {chain.filter(e => seen(bySlug[e.to])).map(e => {
                const A = xy(bySlug[e.from].cs[0]), B = xy(bySlug[e.to].cs[0])
                if (Math.hypot(A[0] - B[0], A[1] - B[1]) < 3) return null
                const a = arc(A, B)
                return <path key={`${e.from}>${e.to}`} d={a.d} className={`srt__chain${alive(bySlug[e.to]) ? ' is-alive' : ''}`} style={{ '--len': a.len }} />
              })}
              {places.map(pl => {
                const vis = pl.list.filter(x => seen(x.p))
                if (!vis.length) return null
                const live = vis.some(x => alive(x.p))
                const [px, py] = xy(pl.at)
                const era = vis[vis.length - 1].p.s.era
                const r = 3.5 + Math.min(5, vis.length * 1.3)
                return (
                  <g key={pl.k} className={`srt__pt${live ? ' is-alive' : ''}${place === pl.k ? ' is-sel' : ''}`} transform={`translate(${px.toFixed(1)} ${py.toFixed(1)})`}
                    onClick={() => setPlace(c => (c === pl.k ? null : pl.k))} data-testid="srt-pt">
                    <circle r={r + 9} className="srt__halo" style={{ fill: ERA_C[era] }} />
                    <circle r={r} className="srt__dot" style={{ fill: ERA_C[era] }} />
                    {(live || place === pl.k) && <text y={-r - 6} textAnchor="middle" className="srt__label">{pickUi(pl.name, lang)}{pl.approx ? ' ~' : ''}</text>}
                  </g>
                )
              })}
            </svg>
            <div className="srt__year" aria-hidden="true"><b className="ui-num">{y}</b><span className="ui-num">≈ {hijri(y)} {t.ah}</span></div>
          </div>
          <div className="ui-card srt__panel">
            <div className="srt__ctl">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={toggle} aria-pressed={playing} data-testid="srt-play">
                <Icon name={playing ? 'pause' : 'play'} className="ui-btn__icon" />{playing ? t.pause : t.play}
              </button>
              <label className="srt__range">
                <span>{t.year} <b className="ui-num">{y}</b></span>
                <input type="range" min={Y0} max={Y1} step="1" value={y} onChange={(e) => { setPlaying(false); setYear(Number(e.target.value)) }} data-testid="srt-year" />
              </label>
            </div>
            <ul className="srt__legend">
              <li><span className="srt__k is-j" /> {t.born} → {t.city}</li>
              <li><span className="srt__k is-c" /> {t.chain}</li>
              <li>{t.approx}</li>
            </ul>
            <p className="srt__h">
              {t.alive} <span className="ui-num">({aliveList.length})</span>
              {place && <button type="button" className="ui-chip srt__all" onClick={() => setPlace(null)}>{t.all}</button>}
            </p>
            <ul className="srt__list" aria-live="polite" data-testid="srt-list">
              {aliveList.length ? aliveList.map(p => (
                <li key={p.s.slug}>
                  <i style={{ background: ERA_C[p.s.era] }} aria-hidden="true" />
                  <a className="ui-link" href={hrefOf(p.s)} onClick={(e) => onOpen?.(p.s, e)}>{nameOf(p.s)}</a>
                  <small>{[p.bName && pickUi(p.bName, lang), p.cName && pickUi(p.cName, lang)].filter((v, i, a) => v && a.indexOf(v) === i).join(' → ')}</small>
                </li>
              )) : <li className="srt__none">{t.none}</li>}
            </ul>
            <p className="srt__src">{t.src}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
