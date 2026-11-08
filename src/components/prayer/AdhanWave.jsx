// ═══════════════════════════════════════════════════════
// AdhanWave — "Azan heç vaxt susmur": dünyada indi harada azan oxunur (/prayer)
//
//   <AdhanWave lang="az" />
//
// • Xəritə (d3-geo Equal Earth + world-atlas quru): gecə (günəş üfüqdən aşağı) və
//   dərin gecə (−18°-dən aşağı) — günəşə qarşı nöqtə ətrafında dairələr (geoCircle).
//   Bu dairələrin kənarı = məğrib/günəş çıxması və işa/sübh xətləri; zöhr — günəşin
//   meridianı. Hamısı günəşlə birlikdə yer kürəsi boyunca hərəkət edir.
// • Şəhərlər (data/worldCities): hazırda (±3 dəq) azan oxunanlar nəbz vurur (utils/solar.adhanAt).
// • "24 saatı oynat" — günün bütün azanları ~12 saniyədə (bir dəfəlik), sonra canlıya qayıdır.
// • v5.7: "Qlobus" rejimi — ortoqrafik proyeksiya, məğrib xətti (günəşin 90° şərqi)
//   həmişə öndə: qlobus günəşlə birlikdə fırlanır; barmaqla/siçanla çevirmək olur.
// • Canlı rejimdə hər 30 saniyədə yenilənir. Stillər: src/styles/AdhanWave.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoEqualEarth, geoOrthographic, geoPath, geoCircle, geoGraticule10, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from '../Icon'
import { worldPoints } from '../../data/worldCities'
import { antisolar, subsolar, adhanAt } from '../../utils/solar'
import '../../styles/AdhanWave.css'
import { pickUi } from '../../utils/uiText'

const W = 960, H = 470
const T = {
  az: { title: 'Azan heç vaxt susmur', lead: 'Günəş yer kürəsi boyunca hərəkət etdikcə hər an haradasa azan oxunur. Parlayan nöqtələr — indi azan oxunan şəhərlər.', play: '24 saatı oynat', live: 'Canlı', now: (n) => `İndi ${n} şəhərdə azan`, names: { fajr: 'Sübh', dhuhr: 'Zöhr', maghrib: 'Məğrib', isha: 'İşa' }, legend: { night: 'gecə', deep: 'sübhdən əvvəl / işadan sonra', noon: 'zöhr xətti' }, utc: 'UTC', map: 'Xəritə', globe: 'Qlobus', view: 'Görünüş' },
  en: { title: 'The adhan never falls silent', lead: 'As the sun moves across the globe, the adhan is being called somewhere every moment. Glowing dots are cities where the adhan is being called now.', play: 'Play 24 hours', live: 'Live', now: (n) => `Adhan in ${n} cities now`, names: { fajr: 'Fajr', dhuhr: 'Dhuhr', maghrib: 'Maghrib', isha: 'Isha' }, legend: { night: 'night', deep: 'before Fajr / after Isha', noon: 'Dhuhr line' }, utc: 'UTC', map: 'Map', globe: 'Globe', view: 'View' },
  ru: { title: 'Азан никогда не умолкает', lead: 'Солнце движется вокруг Земли — и каждое мгновение где-то звучит азан. Светящиеся точки — города, где азан звучит сейчас.', play: 'Проиграть сутки', live: 'Сейчас', now: (n) => `Азан сейчас в ${n} городах`, names: { fajr: 'Фаджр', dhuhr: 'Зухр', maghrib: 'Магриб', isha: 'Иша' }, legend: { night: 'ночь', deep: 'до Фаджра / после Иша', noon: 'линия Зухра' }, utc: 'UTC', map: 'Карта', globe: 'Глобус', view: 'Вид' },
  tr: { title: 'Ezan hiç susmaz', lead: 'Güneş dünyanın üzerinde ilerledikçe her an bir yerde ezan okunur. Parlayan noktalar — şu an ezan okunan şehirler.', play: '24 saati oynat', live: 'Canlı', now: (n) => `Şu an ${n} şehirde ezan`, names: { fajr: 'Sabah', dhuhr: 'Öğle', maghrib: 'Akşam', isha: 'Yatsı' }, legend: { night: 'gece', deep: 'sabahtan önce / yatsıdan sonra', noon: 'öğle hattı' }, utc: 'UTC', map: 'Harita', globe: 'Küre', view: 'Görünüm' },
  ar: { title: 'الأذان لا يسكت أبدًا', lead: 'مع سير الشمس حول الأرض يُرفع الأذان في مكان ما في كل لحظة. النقاط المضيئة مدن يُرفع فيها الأذان الآن.', play: 'شغّل 24 ساعة', live: 'مباشر', now: (n) => `الأذان الآن في ${n} مدينة`, names: { fajr: 'الفجر', dhuhr: 'الظهر', maghrib: 'المغرب', isha: 'العشاء' }, legend: { night: 'الليل', deep: 'قبل الفجر / بعد العشاء', noon: 'خط الظهر' }, utc: 'UTC', map: 'خريطة', globe: 'كرة أرضية', view: 'العرض' },
}
const MODE_KEY = 'aw_mode_v1'
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

export default function AdhanWave({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [land, setLand] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
  const points = useMemo(() => worldPoints(), [])
  const [mode, setMode] = useState(() => { try { return localStorage.getItem(MODE_KEY) === 'globe' ? 'globe' : 'map' } catch { return 'map' } })
  const [drag, setDrag] = useState([0, 0]) // istifadəçinin çevirdiyi bucaq (uzunluq, enlik)
  const dragRef = useRef(null)
  const flat = useMemo(() => geoEqualEarth().fitExtent([[8, 8], [W - 8, H - 8]], { type: 'Sphere' }), [])
  const [sl0] = subsolar(now)
  const center = [sl0 + 90 + drag[0], Math.max(-60, Math.min(60, 18 + drag[1]))] // məğrib xətti öndə
  const globe = geoOrthographic().fitExtent([[(W - H) / 2 + 10, 10], [(W + H) / 2 - 10, H - 10]], { type: 'Sphere' }).rotate([-center[0], -center[1]])
  const isGlobe = mode === 'globe'
  const proj = isGlobe ? globe : flat
  const path = geoPath(proj)
  // Qlobusda arxa tərəfdəki nöqtələr görünmür
  const vis = (lng, lat) => !isGlobe || geoDistance([lng, lat], center) < Math.PI / 2 - 0.02
  const pick = (m) => { setMode(m); setDrag([0, 0]); try { localStorage.setItem(MODE_KEY, m) } catch { /* */ } }
  const onDown = (e) => { if (!isGlobe) return; dragRef.current = { x: e.clientX, y: e.clientY, d: drag }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const onMove = (e) => {
    const st = dragRef.current
    if (!st) return
    const k = 180 / (e.currentTarget.getBoundingClientRect().height || H)
    setDrag([st.d[0] - (e.clientX - st.x) * k, st.d[1] + (e.clientY - st.y) * k])
  }
  const onUp = () => { dragRef.current = null }

  useEffect(() => { loadLand().then(setLand).catch(() => {}) }, [])
  // Canlı: hər 30 s
  useEffect(() => {
    if (playing) return undefined
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [playing])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const play = () => {
    if (playing) return
    const start = Date.now(), t0 = performance.now(), dur = reduced() ? 0 : 12000
    if (!dur) return
    setPlaying(true)
    const step = (n) => {
      const k = Math.min(1, (n - t0) / dur)
      setNow(start + k * 86400000)
      if (k < 1) raf.current = requestAnimationFrame(step)
      else setPlaying(false)
    }
    raf.current = requestAnimationFrame(step)
  }

  const night = geoCircle().center(antisolar(now)).radius(90)()
  const deep = geoCircle().center(antisolar(now)).radius(72)()
  const [sl, sd] = subsolar(now)
  const noon = { type: 'LineString', coordinates: Array.from({ length: 37 }, (_, i) => [sl, -90 + i * 5]) }
  const sunXY = vis(sl, sd) ? proj([sl, sd]) : null
  const calling = points.map(p => ({ ...p, a: adhanAt(now, p.lat, p.lng) })).filter(p => p.a)
  const time = new Date(now).toISOString().slice(11, 16)

  return (
    <figure className="ui-card aw" data-testid="adhan-wave">
      <figcaption className="aw__head">
        <span className="aw__title">{t.title}</span>
        <span className="aw__lead">{t.lead}</span>
      </figcaption>
      <div className="aw__modes" role="group" aria-label={t.view}>
        {['map', 'globe'].map(m => (
          <button key={m} type="button" className={`aw__mode${mode === m ? ' is-on' : ''}`} aria-pressed={mode === m} onClick={() => pick(m)} data-testid={`aw-${m}`}>
            <Icon name={m === 'map' ? 'pin' : 'globe'} size={14} /> {t[m]}
          </button>
        ))}
      </div>
      <svg className={`aw__svg${isGlobe ? ' aw__svg--globe' : ''}`} viewBox={`0 0 ${W} ${H}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} role="img" aria-label={`${t.now(calling.length)} · ${time} ${t.utc}`}>
        {isGlobe && (
          <defs>
            <radialGradient id="aw-shade" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#fff" stopOpacity=".18" />
              <stop offset="60%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity=".35" />
            </radialGradient>
          </defs>
        )}
        {isGlobe && <circle className="aw__halo" cx={W / 2} cy={H / 2} r={H / 2 - 4} />}
        <path className="aw__sphere" d={path({ type: 'Sphere' })} />
        <path className="aw__grat" d={path(geoGraticule10())} />
        {land && <path className="aw__land" d={path(land)} />}
        <path className="aw__night" d={path(night)} />
        <path className="aw__deep" d={path(deep)} />
        <path className="aw__noon" d={path(noon)} />
        {isGlobe && <path className="aw__shade" d={path({ type: 'Sphere' })} fill="url(#aw-shade)" />}
        {sunXY && <circle className="aw__sun" cx={sunXY[0]} cy={sunXY[1]} r="9" />}
        {points.map(p => {
          const xy = vis(p.lng, p.lat) ? proj([p.lng, p.lat]) : null
          return xy ? <circle key={p.name} className="aw__city" cx={xy[0]} cy={xy[1]} r="2.2" /> : null
        })}
        {calling.map(p => {
          const xy = vis(p.lng, p.lat) ? proj([p.lng, p.lat]) : null
          return xy ? (
            <g key={`c-${p.name}`} className={`aw__call aw__call--${p.a}`} transform={`translate(${xy[0].toFixed(1)} ${xy[1].toFixed(1)})`}>
              <circle className="aw__ring" r="14" />
              <circle className="aw__dot" r="4.5" />
              <title>{`${p.name} — ${t.names[p.a]}`}</title>
            </g>
          ) : null
        })}
      </svg>
      <div className="aw__bar">
        <span className="aw__clock ui-num">{playing ? '' : <span className="aw__live">{t.live}</span>} {time} {t.utc}</span>
        <span className="aw__now" aria-live="polite">{t.now(calling.length)}
          {calling.length > 0 && <>: {calling.slice(0, 4).map(c => `${c.name} (${t.names[c.a]})`).join(', ')}{calling.length > 4 ? '…' : ''}</>}
        </span>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={play} disabled={playing} data-testid="adhan-play">
          <Icon name="play" className="ui-btn__icon" /> {t.play}
        </button>
      </div>
      <ul className="aw__legend">
        <li><i className="aw__sw aw__sw--night" /> {t.legend.night}</li>
        <li><i className="aw__sw aw__sw--deep" /> {t.legend.deep}</li>
        <li><i className="aw__sw aw__sw--noon" /> {t.legend.noon}</li>
        {Object.entries(t.names).map(([k, v]) => <li key={k}><i className={`aw__sw aw__sw--${k}`} /> {v}</li>)}
      </ul>
    </figure>
  )
}
