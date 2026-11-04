// ═══════════════════════════════════════════════════════
// PrayerSky — namaz vaxtına görə canlı səma (dekor, aria-hidden)
//
//   <PrayerSky times={{ fajr:'05:38', sunrise:'07:10', dhuhr, asr, maghrib, isha }} nowMin={1034} />
//
// • Gün 7 dövrə bölünür: gecə · sübh (fajr→günəş) · səhər · günorta (zöhr→əsr)
//   · əsr · qürub (məğribdən 40 dəq əvvəl → məğrib+20) · şəfəq (→ işa).
//   Hər dövrün öz qradiyent qatı var; aktiv qat yumşaq (3 san) keçidlə görünür.
// • Günəş gündüz qövsü üzrə real mövqedədir (günəş çıxanda solda, məğribdə
//   sağda; RTL-də güzgü); gecə — ay və sayrışan ulduzlar.
// • Açıq rejimdə tonlar pasteldir (üstündəki tünd mətn oxunaqlı qalır),
//   tünd rejimdə dərin. Valideyn: position:relative + isolation (z-index −1).
// • Vaxtlar yoxdursa (yüklənir/xəta) — heç nə çəkilmir.
// Stillər: src/styles/PrayerSky.css
// ═══════════════════════════════════════════════════════
import { memo } from 'react'
import { hmToMin } from '../PrayerDayline'
import '../../styles/PrayerSky.css'

export const SKY_PERIODS = ['night', 'dawn', 'morning', 'noon', 'afternoon', 'sunset', 'dusk']

/** Cari dövr və göy cisimlərinin mövqeyi (saf funksiya — test olunur) */
export function skyState(times, nowMin) {
  const t = {}
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) t[k] = hmToMin(times?.[k])
  if (Object.values(t).some(v => v == null) || !Number.isFinite(nowMin)) return null
  const n = ((nowMin % 1440) + 1440) % 1440
  const sunsetStart = t.maghrib - 40
  let period
  if (n >= t.isha || n < t.fajr) period = 'night'
  else if (n < t.sunrise) period = 'dawn'
  else if (n < t.dhuhr) period = 'morning'
  else if (n < t.asr) period = 'noon'
  else if (n < sunsetStart) period = 'afternoon'
  else if (n < t.maghrib + 20) period = 'sunset'
  else period = 'dusk'

  // Günəş: günəş çıxandan məğribə qədər 0 → 1
  const dayLen = t.maghrib - t.sunrise
  const sunP = dayLen > 0 ? (n - t.sunrise) / dayLen : -1
  // Ay: işadan sübhə qədər 0 → 1 (gecə yarısını keçir)
  const nightLen = (t.fajr - t.isha + 1440) % 1440
  const moonP = nightLen > 0 ? (((n - t.isha + 1440) % 1440) / nightLen) : -1
  const sunUp = sunP > -0.04 && sunP < 1.04
  const moonUp = period === 'night'
  return { period, sunP: Math.max(-0.04, Math.min(1.04, sunP)), moonP: Math.max(0, Math.min(1, moonP)), sunUp, moonUp }
}

// Qövs: x 8%→92%, hündürlük sin(πp) — üfüqdə alçaq, ortada yüksək
const arcPos = (p) => ({ x: 8 + p * 84, y: 86 - Math.sin(Math.PI * Math.max(0, Math.min(1, p))) * 70 })

// Ulduzlar — sabit yerlərdə (hər render-də eyni)
const STARS = Array.from({ length: 34 }, (_, i) => {
  const r = (s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x) }
  return { x: (r(1) * 100).toFixed(2), y: (r(2) * 70).toFixed(2), s: (1 + r(3) * 2).toFixed(1), d: (r(4) * 4).toFixed(2) }
})

function PrayerSky({ times, nowMin, className = '' }) {
  const st = skyState(times, nowMin)
  if (!st) return null
  const sun = arcPos(st.sunP)
  const moon = arcPos(st.moonP)
  return (
    <div className={`psky ${className}`} data-period={st.period} aria-hidden="true">
      {SKY_PERIODS.map(p => <div key={p} className={`psky__layer psky__layer--${p}`} />)}
      <div className="psky__stars">
        {STARS.map((s, i) => (
          <i key={i} style={{ insetInlineStart: `${s.x}%`, top: `${s.y}%`, width: `${s.s}px`, height: `${s.s}px`, animationDelay: `${s.d}s` }} />
        ))}
      </div>
      {st.sunUp && <div className="psky__sun" style={{ insetInlineStart: `${sun.x}%`, top: `${sun.y}%` }} />}
      {st.moonUp && <div className="psky__moon" style={{ insetInlineStart: `${moon.x}%`, top: `${moon.y}%` }} />}
      <div className="psky__haze" />
    </div>
  )
}

export default memo(PrayerSky)
