// ═══════════════════════════════════════════════════════
// Dünyada oruc müddəti (v6.3) — components/FastingWorldMap.jsx (/ramadan)
//
// Oruc: sübhdən (Günəş üfüqdən 18° aşağı — Dünya İslam Liqası bucağı) məğribə (gün batımı,
// −0.833°). Hesab Günəşin həmin gündəki meylinə görədir (utils/solar.js, ~1 dəq).
// Yüksək enliklərdə yay gecəsi Günəş 18°-yə enmir — "sübh əlaməti yoxdur" (ayrıca rəng);
// orada yerli alimlərin fətvasına (yaxın şəhər, orta vaxt və s.) əməl olunur — biz hesablamırıq.
// tests/unit/fasting-map.test.js
// ═══════════════════════════════════════════════════════
import { sunParams } from './solar'
import { gregorianToHijri, hijriToGregorian, hijriMonthLength, utcNoon } from './hijri'

const RAD = Math.PI / 180
const hourAngle = (h0, lat, dec) => {
  const c = (Math.sin(h0 * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD))
  return c < -1 ? 'always' : c > 1 ? 'never' : Math.acos(c) / RAD
}

/**
 * Bir yer və gün üçün oruc müddəti.
 * → { hours } | { kind: 'noFajr' } (ağ gecə — sübh əlaməti yox) | { kind: 'polarDay' } | { kind: 'polarNight' }
 */
export function fastLength(dayStart, lat, lng) {
  const { decl } = sunParams(dayStart + (12 - lng / 15) * 3600000)
  const ss = hourAngle(-0.833, lat, decl)
  if (ss === 'always') return { kind: 'polarDay' }
  if (ss === 'never') return { kind: 'polarNight' }
  const fj = hourAngle(-18, lat, decl)
  if (fj === 'always') return { kind: 'noFajr' }
  return { hours: (ss + fj) / 15 }
}

/** Şəbəkə: step° — Float32Array saat (NaN = xüsusi hal), kinds: 0 normal, 1 sübh yox, 2 qütb günü, 3 qütb gecəsi */
export function fastingGrid(dayStart, step = 2, latMin = -60, latMax = 66) {
  const rows = Math.floor((latMax - latMin) / step) + 1, cols = Math.round(360 / step)
  const hours = new Float32Array(rows * cols), kinds = new Uint8Array(rows * cols)
  const KIND = { noFajr: 1, polarDay: 2, polarNight: 3 }
  for (let r = 0; r < rows; r++) {
    const lat = latMax - r * step
    for (let c = 0; c < cols; c++) {
      const f = fastLength(dayStart, lat, -180 + c * step + step / 2)
      hours[r * cols + c] = f.hours ?? NaN
      kinds[r * cols + c] = f.kind ? KIND[f.kind] : 0
    }
  }
  return { hours, kinds, rows, cols, step, latMin, latMax }
}

/** Cari (və ya keçibsə — növbəti) Ramazanın günləri: [{ day, dayStart (UTC gün başlanğıcı ms) }] */
export function ramadanDays(now = new Date()) {
  const h = gregorianToHijri({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
  const year = h.month > 9 ? h.year + 1 : h.year
  const len = hijriMonthLength(year, 9)
  const out = []
  for (let d = 1; d <= len; d++) {
    const g = hijriToGregorian({ year, month: 9, day: d })
    out.push({ day: d, dayStart: utcNoon(g.year, g.month, g.day).getTime() - 12 * 3600000 })
  }
  return { year, days: out }
}
