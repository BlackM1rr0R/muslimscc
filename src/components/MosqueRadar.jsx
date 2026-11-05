// ═══════════════════════════════════════════════════════
// MosqueRadar — ətrafdakı məscidlər radarda (/mosques)
//
//   <MosqueRadar origin={{ lat, lon }} mosques={[{ id, name, lat, lon, distance }]} lang="az"
//     nextPrayer={{ name: 'Zöhr', inMin: 34 }} />
//
// • Mərkəz — siz; şimal yuxarıda. Məsafə kök şkalası ilə (yaxındakılar sıxılmasın):
//   halqalar 1 · 3 · 10 km. Ən yaxın məscid qızıl, radar şüası bir dəfə dövr edir.
// • Piyada vaxtı: məsafə × 1.25 (küçə əyriliyi) ÷ 4.8 km/saat — təxminidir.
// • Növbəti namaza qədər çatırsınızsa — "çatırsınız" nişanı (yalnız təxmin).
// Stillər: src/styles/MosqueRadar.css
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import '../styles/MosqueRadar.css'

const R_KM = 10
const T = {
  az: { title: 'Məscid radarı', you: 'Siz', walk: (m) => `piyada ≈ ${m} dəq`, make: (p) => `${p} namazına çatırsınız`, late: (p) => `${p} namazına tələsin`, north: 'Ş', near: 'Ən yaxın', sum: (n) => `10 km radiusda ${n} məscid`, pick: 'Nöqtəyə toxunun' },
  en: { title: 'Mosque radar', you: 'You', walk: (m) => `≈ ${m} min walk`, make: (p) => `You can make ${p}`, late: (p) => `Hurry for ${p}`, north: 'N', near: 'Nearest', sum: (n) => `${n} mosques within 10 km`, pick: 'Tap a dot' },
  ru: { title: 'Радар мечетей', you: 'Вы', walk: (m) => `пешком ≈ ${m} мин`, make: (p) => `Успеете к намазу ${p}`, late: (p) => `Поспешите к намазу ${p}`, north: 'С', near: 'Ближайшая', sum: (n) => `мечетей в радиусе 10 км: ${n}`, pick: 'Коснитесь точки' },
  tr: { title: 'Cami radarı', you: 'Siz', walk: (m) => `yürüyerek ≈ ${m} dk`, make: (p) => `${p} namazına yetişirsiniz`, late: (p) => `${p} namazı için acele edin`, north: 'K', near: 'En yakın', sum: (n) => `10 km içinde ${n} cami`, pick: 'Bir noktaya dokunun' },
  ar: { title: 'رادار المساجد', you: 'أنت', walk: (m) => `≈ ${m} دقيقة مشيًا`, make: (p) => `ستدرك صلاة ${p}`, late: (p) => `أسرع لصلاة ${p}`, north: 'ش', near: 'الأقرب', sum: (n) => `${n} مسجدًا ضمن 10 كم`, pick: 'المس نقطة' },
}

export const walkMinutes = (km) => Math.max(1, Math.round((km * 1.25 / 4.8) * 60))

/** Başlanğıcdan nöqtəyə kompas bucağı (dərəcə) */
export function bearing(a, b) {
  const r = Math.PI / 180
  const y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r)
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r)
  return ((Math.atan2(y, x) / r) + 360) % 360
}

/** Radar koordinatı (viewBox −100…100): kök şkalası */
export function radarPoint(km, deg) {
  const rr = Math.sqrt(Math.min(km, R_KM) / R_KM) * 92
  const a = (deg - 90) * Math.PI / 180
  return { x: Math.cos(a) * rr, y: Math.sin(a) * rr }
}

export default function MosqueRadar({ origin, mosques, lang = 'az', nextPrayer, unknown = '?' }) {
  const t = T[lang] || T.az
  const [sel, setSel] = useState(0)
  if (!origin || !mosques?.length) return null
  const list = mosques.slice(0, 60)
  const cur = list[sel] || list[0]
  const wm = walkMinutes(cur.distance)
  const ring = (km) => Math.sqrt(km / R_KM) * 92

  return (
    <figure className="ui-card mr" data-testid="mosque-radar" data-reveal="fade">
      <figcaption className="mr__title">{t.title} <span className="mr__sum">{t.sum(mosques.length)}</span></figcaption>
      <div className="mr__body">
        <svg className="mr__svg" viewBox="-100 -100 200 200" role="img" aria-label={t.sum(mosques.length)}>
          <defs>
            <radialGradient id="mr-bg"><stop offset="0" stopColor="#14513f" /><stop offset="1" stopColor="#082a20" /></radialGradient>
            <linearGradient id="mr-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7fe0b8" stopOpacity="0" /><stop offset="1" stopColor="#7fe0b8" stopOpacity=".45" /></linearGradient>
          </defs>
          <circle r="98" fill="url(#mr-bg)" />
          {[1, 3, 10].map(km => (
            <g key={km}>
              <circle r={ring(km)} className="mr__ring" />
              <text x={ring(km) * 0.71 + 2} y={-ring(km) * 0.71 - 2} className="mr__rl">{km} km</text>
            </g>
          ))}
          <line x1="0" y1="-96" x2="0" y2="96" className="mr__axis" /><line x1="-96" y1="0" x2="96" y2="0" className="mr__axis" />
          <text y="-86" textAnchor="middle" className="mr__n">{t.north}</text>
          <path className="mr__sweep" d="M0,0 L0,-96 A96,96 0 0 1 67.9,-67.9 Z" fill="url(#mr-sweep)" />
          {list.map((m, i) => {
            const p = radarPoint(m.distance, bearing(origin, m))
            return (
              <g key={m.id} className={`mr__dot${i === 0 ? ' is-near' : ''}${i === sel ? ' is-sel' : ''}`} style={{ '--i': i }}
                onClick={() => setSel(i)}>
                <circle cx={p.x} cy={p.y} r="9" fill="transparent" />
                <circle cx={p.x} cy={p.y} r={i === sel ? 4.6 : 3.2} />
              </g>
            )
          })}
          <circle r="4" className="mr__you" />
        </svg>
        <div className="mr__info" aria-live="polite">
          {sel === 0 && <span className="mr__tag">{t.near}</span>}
          <b className="mr__name">{cur.name || unknown}</b>
          <span className="mr__walk ui-num">{cur.distance < 1 ? `${Math.round(cur.distance * 1000)} m` : `${cur.distance.toFixed(1)} km`} · {t.walk(wm)}</span>
          {nextPrayer && Number.isFinite(nextPrayer.inMin) && (
            <span className={`mr__pray${wm <= nextPrayer.inMin ? ' is-ok' : ' is-late'}`}>
              {wm <= nextPrayer.inMin ? t.make(nextPrayer.name) : t.late(nextPrayer.name)}
            </span>
          )}
          <span className="mr__hint">{t.pick}</span>
        </div>
      </div>
    </figure>
  )
}
