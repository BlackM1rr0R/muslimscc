// ═══════════════════════════════════════════════════════
// QiblaLines — "Bütün ümmət bir nöqtəyə": dünyanın şəhərlərindən Kəbəyə qövslər (/qibla)
//
//   <QiblaLines from={{ lat, lng, name }} lang="az" />
//
// • Hər şəhərdən Kəbəyə ən qısa yol (böyük dairə — d3-geo LineString özü belə çəkir).
// • Xətlər bir-bir çəkilir (stroke-dashoffset, bir dəfəlik), sonra Kəbə nəbz vurur.
// • Sizin yeriniz (from) — qızılı, qalın xətt; şəhər adları yalnız toxunuşda (title).
// Xəritə: Equal Earth, mərkəzi Məkkəyə yaxın (40° şərq). Stillər: src/styles/QiblaLines.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { geoEqualEarth, geoPath, geoGraticule10, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import { worldPoints } from '../data/worldCities'
import '../styles/QiblaLines.css'

export const KAABA = [39.8262, 21.4225] // [lng, lat]
const W = 960, H = 470
const T = {
  az: { title: 'Bütün ümmət bir nöqtəyə yönəlir', lead: (n) => `${n} şəhərdən Kəbəyə ən qısa yol. Qızılı xətt — sizin Qibləniz.`, you: 'Siz', km: (k) => `${k} km` },
  en: { title: 'The whole ummah turns to one point', lead: (n) => `The shortest path to the Kaaba from ${n} cities. The golden line is your qibla.`, you: 'You', km: (k) => `${k} km` },
  ru: { title: 'Вся умма обращена к одной точке', lead: (n) => `Кратчайший путь к Каабе из ${n} городов. Золотая линия — ваша кибла.`, you: 'Вы', km: (k) => `${k} км` },
  tr: { title: 'Bütün ümmet tek bir noktaya yönelir', lead: (n) => `${n} şehirden Kâbe’ye en kısa yol. Altın çizgi — sizin kıbleniz.`, you: 'Siz', km: (k) => `${k} km` },
  ar: { title: 'الأمة كلها تتجه إلى نقطة واحدة', lead: (n) => `أقصر طريق إلى الكعبة من ${n} مدينة. الخط الذهبي قبلتك.`, you: 'أنت', km: (k) => `${k} كم` },
}
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))

export default function QiblaLines({ from, lang = 'az' }) {
  const t = T[lang] || T.az
  const [land, setLand] = useState(null)
  useEffect(() => { loadLand().then(setLand).catch(() => {}) }, [])
  const proj = useMemo(() => geoEqualEarth().rotate([-40, 0]).fitExtent([[8, 8], [W - 8, H - 8]], { type: 'Sphere' }), [])
  const path = useMemo(() => geoPath(proj), [proj])
  const lines = useMemo(() => worldPoints()
    .filter(p => geoDistance([p.lng, p.lat], KAABA) > 0.005)
    .sort((a, b) => geoDistance([b.lng, b.lat], KAABA) - geoDistance([a.lng, a.lat], KAABA))
    .map((p, i) => ({ ...p, i, d: path({ type: 'LineString', coordinates: [[p.lng, p.lat], KAABA] }) })), [path])
  const me = from && Number.isFinite(from.lat) ? {
    d: path({ type: 'LineString', coordinates: [[from.lng, from.lat], KAABA] }),
    xy: proj([from.lng, from.lat]),
    km: Math.round(geoDistance([from.lng, from.lat], KAABA) * 6371),
  } : null
  const k = proj(KAABA)

  return (
    <figure className="ui-card ql" data-testid="qibla-lines" data-reveal="fade">
      <figcaption className="ql__head">
        <span className="ql__title">{t.title}</span>
        <span className="ql__lead">{t.lead(lines.length)}{me ? ` · ${t.you}: ${t.km(me.km.toLocaleString(lang === 'ar' ? 'ar-u-nu-latn' : lang))}` : ''}</span>
      </figcaption>
      <svg className="ql__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.lead(lines.length)}>
        <path className="ql__sphere" d={path({ type: 'Sphere' })} />
        <path className="ql__grat" d={path(geoGraticule10())} />
        {land && <path className="ql__land" d={path(land)} />}
        <g className="ql__lines">
          {lines.map(l => (
            <path key={l.name} className="ql__line" d={l.d} pathLength="1" style={{ '--i': l.i }}><title>{l.name}</title></path>
          ))}
        </g>
        {me?.d && <path className="ql__me" d={me.d} pathLength="1" style={{ '--i': lines.length }} />}
        {me?.xy && <circle className="ql__me-dot" cx={me.xy[0]} cy={me.xy[1]} r="4.5" />}
        {k && (
          <g className="ql__kaaba" transform={`translate(${k[0].toFixed(1)} ${k[1].toFixed(1)})`} style={{ '--n': lines.length }}>
            <circle className="ql__halo" r="16" />
            <rect x="-5" y="-5" width="10" height="10" rx="1.2" className="ql__cube" />
          </g>
        )}
      </svg>
    </figure>
  )
}
