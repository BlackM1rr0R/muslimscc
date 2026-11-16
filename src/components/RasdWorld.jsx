// ═══════════════════════════════════════════════════════
// RasdWorld — "Günəş Kəbənin üstündə" anında dünyada kölgələr (RasdQibla-nın içində, /qibla)
//
// • Xəritədə şəhərlər: o an Günəş görünürsə — çubuğun kölgəsinin istiqaməti (ox).
//   "over" anında kölgə qiblənin əksinə, "under" anında qibləyə yönəlir — hamısı
//   eyni nöqtəyə (Kəbəyə / onun əks nöqtəsinə) "baxır". Günəş batıbsa — boz nöqtə.
// • "Təqvimə əlavə et" — .ics (10 dəq əvvəl xəbərdarlıq): telefon təqvimi sayt bağlı olsa da xatırladır.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { shadowAt, KAABA } from '../utils/rasdQibla'
import { eventIcs } from '../utils/eventIcs'
import { saveBlob } from '../utils/quoteCard'

const W = 640, H = 330
const CITIES = [
  ['Bakı', 40.41, 49.87], ['İstanbul', 41.01, 28.98], ['Qahirə', 30.04, 31.24], ['London', 51.51, -0.13], ['Moskva', 55.76, 37.62],
  ['Tehran', 35.69, 51.39], ['Dehli', 28.61, 77.21], ['Cakarta', -6.21, 106.85], ['Lagos', 6.52, 3.38], ['Nayrobi', -1.29, 36.82],
  ['Kazan', 55.79, 49.12], ['Daşkənd', 41.3, 69.24], ['Kəraçi', 24.86, 67.0], ['Kuala-Lumpur', 3.14, 101.69], ['Nyu-York', 40.71, -74.01],
  ['Rabat', 34.02, -6.84], ['Pekin', 39.9, 116.4], ['Sidney', -33.87, 151.21], ['San-Paulu', -23.55, -46.63], ['Keyptaun', -33.92, 18.42],
] // lang-ok: şəhər adları (xəritə nişanları)

const T = {
  az: { title: 'O anda dünyada kölgələr', lead: 'Günəşi görən hər şəhərdə çubuğun kölgəsi — hamısı eyni nöqtəyə yönəlir.', night: 'Günəş batıb', cal: 'Təqvimə əlavə et', calHint: 'Telefon təqvimi 10 dəqiqə əvvəl xatırladacaq — sayt bağlı olsa da.', ev: 'Günəş Kəbənin üstündə — qibləni yoxla', evU: 'Kölgə qibləni göstərir — qibləni yoxla' },
  en: { title: 'Shadows around the world at that moment', lead: 'In every city that sees the sun, a stick’s shadow — all of them point toward the same spot.', night: 'Sun has set', cal: 'Add to calendar', calHint: 'Your phone’s calendar will remind you 10 minutes before — even with the site closed.', ev: 'Sun over the Kaaba — check your qiblah', evU: 'The shadow points to the qiblah — check your qiblah' },
  ru: { title: 'Тени по всему миру в этот момент', lead: 'В каждом городе, где видно Солнце, тень шеста — и все они указывают в одну точку.', night: 'Солнце село', cal: 'Добавить в календарь', calHint: 'Календарь телефона напомнит за 10 минут — даже если сайт закрыт.', ev: 'Солнце над Каабой — проверьте киблу', evU: 'Тень указывает на киблу — проверьте киблу' },
  tr: { title: 'O anda dünyada gölgeler', lead: 'Güneş’i gören her şehirde çubuğun gölgesi — hepsi aynı noktaya yönelir.', night: 'Güneş battı', cal: 'Takvime ekle', calHint: 'Telefonunuzun takvimi 10 dakika önce hatırlatır — site kapalı olsa da.', ev: 'Güneş Kâbe’nin üstünde — kıbleyi kontrol et', evU: 'Gölge kıbleyi gösteriyor — kıbleyi kontrol et' },
  ar: { title: 'الظلال حول العالم في تلك اللحظة', lead: 'في كل مدينة ترى الشمس، ظل العصا — وكلها تتجه نحو النقطة نفسها.', night: 'غربت الشمس', cal: 'أضف إلى التقويم', calHint: 'سيذكّرك تقويم هاتفك قبل ١٠ دقائق — حتى لو كان الموقع مغلقًا.', ev: 'الشمس فوق الكعبة — تحقّق من القبلة', evU: 'الظل يشير إلى القبلة — تحقّق من القبلة' },
}

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then((r) => r.json()).then((topo) => feature(topo, topo.objects.land)))

export default function RasdWorld({ ev, lang = 'az' }) {
  const t = pickUi(T, lang, 'en')
  const [land, setLand] = useState(null)
  useEffect(() => { let live = true; loadLand().then((l) => { if (live) setLand(l) }).catch(() => {}); return () => { live = false } }, [])
  const proj = useMemo(() => geoEquirectangular().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' }), [])
  const path = useMemo(() => geoPath(proj), [proj])

  const marks = useMemo(() => CITIES.map(([name, lat, lng]) => {
    const [x, y] = proj([lng, lat])
    const s = shadowAt(ev.ms, lat, lng)
    return { name, x, y, s }
  }), [ev.ms, proj])
  const [kx, ky] = proj([ev.kind === 'over' ? KAABA.lng : KAABA.lng - 180, ev.kind === 'over' ? KAABA.lat : -KAABA.lat])

  const addCal = () => {
    const ics = eventIcs({ uid: `rasd-${ev.ms}`, start: ev.ms, title: ev.kind === 'over' ? t.ev : t.evU, description: 'https://muslims.cc/qibla' })
    saveBlob(new Blob([ics], { type: 'text/calendar' }), `muslims-cc-rasd-${new Date(ev.ms).toISOString().slice(0, 10)}.ics`)
  }

  return (
    <div className="rqw" data-testid="rasd-world">
      <h3 className="rqb__h3">{t.title}</h3>
      <p className="rqw__lead">{t.lead}</p>
      <svg className="rqw__map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.title}>
        {land && <path d={path(land)} className="rqw__land" />}
        <circle cx={kx} cy={ky} r="6" className="rqw__target" />
        {marks.map((m) => {
          if (!m.s) return <circle key={m.name} cx={m.x} cy={m.y} r="2.6" className="rqw__night"><title>{`${m.name} — ${t.night}`}</title></circle>
          const a = (m.s.dir - 90) * Math.PI / 180, L = 16
          const x2 = m.x + Math.cos(a) * L, y2 = m.y + Math.sin(a) * L
          return (
            <g key={m.name} className="rqw__city" data-city={m.name}>
              <title>{m.name}</title>
              <line x1={m.x} y1={m.y} x2={x2} y2={y2} className="rqw__shadow" markerEnd="url(#rqw-arrow)" />
              <circle cx={m.x} cy={m.y} r="3" className="rqw__stick" />
            </g>
          )
        })}
        <defs><marker id="rqw-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L6 3L0 6z" className="rqw__head" /></marker></defs>
      </svg>
      <div className="rqw__cal">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={addCal} data-testid="rasd-cal"><Icon name="bell" className="ui-btn__icon" /> {t.cal}</button>
        <small>{t.calHint}</small>
      </div>
    </div>
  )
}
