// Məscid-i Nəbəvi həyətinin çətirləri (components/NabawiUmbrellas.jsx) — saf hesab
// (tests/unit/nabawiUmbrellas.test.js)
//
// • Mədinənin (24.4672, 39.6111) günəşinin çıxışı/batışı — saytın astronomiyası:
//   asrShadow.asrDay → rasdQibla.sunHorizontal → lunar.js (Meeus), −0.833° (refraksiya + disk).
// • Mədinə vaxtı — Asia/Riyadh = UTC+3 (Səudiyyə Ərəbistanında yay vaxtı yoxdur).
// • Açılma payı: günəş çıxandan sonra ~20 dəqiqədə açılır, batana qədərki ~20 dəqiqədə
//   yığılır. Bu, illüstrasiyadır — həqiqi iş saatları mövsümə və havaya görə dəyişir.
import { asrDay } from './asrShadow'
import { sunHorizontal } from './rasdQibla'

export const MEDINA = { lat: 24.4672, lng: 39.6111, tz: 'Asia/Riyadh' }
export const MEDINA_UTC_OFFSET_H = 3
const MIN = 60000
const OFF = MEDINA_UTC_OFFSET_H * 3600000
export const OPEN_MIN = 20    // açılma müddəti (dəq), günəş çıxandan sonra
export const CLOSE_MIN = 20   // yığılma müddəti (dəq), günəş batana qədər

/** Mədinə tarixi { y, m, d } (m: 1–12) — epoch ms üçün */
export function medinaDate(ms) {
  const d = new Date(ms + OFF)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }
}
/** Mədinədə həmin tarixin yerli gecəyarısı (epoch ms) */
export const medinaMidnight = ({ y, m, d }) => Date.UTC(y, m - 1, d) - OFF
/** Mədinə gecəyarısından keçən dəqiqə (0…1440) */
export const medinaMinutes = (ms) => ((((ms + OFF) % 86400000) + 86400000) % 86400000) / MIN
/** "YYYY-MM-DD" ↔ { y, m, d } */
export const dateKey = ({ y, m, d }) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
export function parseDateKey(s) {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return r ? { y: +r[1], m: +r[2], d: +r[3] } : null
}
/** Dəqiqə → "HH:MM" */
export function fmtHM(min) {
  const t = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** Mədinənin günü: { midnight, sunrise, sunset, noon } (epoch ms) və onların Mədinə dəqiqələri */
export function medinaSunDay(date) {
  const midnight = medinaMidnight(date)
  const day = asrDay(Date.UTC(date.y, date.m - 1, date.d), MEDINA.lat, MEDINA.lng)
  const toMin = (t) => (t == null ? null : (t - midnight) / MIN)
  return {
    midnight, sunrise: day.sunrise, sunset: day.sunset, noon: day.noon,
    riseMin: toMin(day.sunrise), setMin: toMin(day.sunset), noonMin: toMin(day.noon),
  }
}

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t) }

/** Çətirlərin açılma payı 0…1 (Mədinə dəqiqəsi + həmin günün çıxış/batışı) */
export function openFraction(min, day) {
  if (day.riseMin == null || day.setMin == null) return 0
  const up = smooth((min - day.riseMin) / OPEN_MIN)
  const down = smooth((day.setMin - min) / CLOSE_MIN)
  return Math.min(up, down)
}
/** Vəziyyət: 'closed' | 'opening' | 'open' | 'closing' */
export function phaseOf(min, day) {
  const f = openFraction(min, day)
  if (f <= 0.001) return 'closed'
  if (f >= 0.999) return 'open'
  return min < day.noonMin ? 'opening' : 'closing'
}

/**
 * Günəşin Mədinədəki yeri: { alt, az } (°, az şimaldan saat əqrəbi ilə) və səhnə vektoru
 * (three.js: x — şərq, y — yuxarı, z — cənub; vahid uzunluq).
 */
export function sunAt(ms) {
  const { alt, az } = sunHorizontal(ms, MEDINA.lat, MEDINA.lng)
  const a = alt * Math.PI / 180, z = az * Math.PI / 180
  return { alt, az, vec: [Math.cos(a) * Math.sin(z), Math.sin(a), -Math.cos(a) * Math.cos(z)] }
}

// Göyün rəngi Günəşin hündürlüyünə görə (gecə → alaqaranlıq → şəfəq → gündüz)
const SKY = [
  [-18, [10, 16, 38]], [-8, [34, 40, 82]], [-2, [120, 92, 128]], [1, [238, 156, 104]],
  [6, [246, 200, 150]], [14, [150, 196, 232]], [35, [104, 168, 226]], [90, [86, 154, 218]],
]
const hex = (c) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
/** Göyün rəngi (#rrggbb) */
export function skyColor(alt) {
  if (alt <= SKY[0][0]) return hex(SKY[0][1])
  for (let i = 1; i < SKY.length; i++) {
    if (alt <= SKY[i][0]) {
      const [a0, c0] = SKY[i - 1], [a1, c1] = SKY[i]
      const t = (alt - a0) / (a1 - a0)
      return hex(c0.map((v, k) => v + (c1[k] - v) * t))
    }
  }
  return hex(SKY[SKY.length - 1][1])
}
/** İşıq gücləri: { sun, ambient } — günəş üfüqdən aşağıdadırsa sun = 0 */
export function lightLevels(alt) {
  return {
    sun: alt <= 0 ? 0 : 2.6 * smooth(alt / 12),
    ambient: 0.25 + 1.15 * smooth((alt + 12) / 30),
  }
}

/** Çətirlərin yerləri: rows × cols, aralarındakı məsafə `step`, mərkəz (0, 0) — [{ x, z }] */
export function umbrellaGrid(rows, cols, step) {
  const out = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push({ x: (c - (cols - 1) / 2) * step, z: (r - (rows - 1) / 2) * step })
  }
  return out
}

/**
 * Çətir qabırğasının şaquli bucağı (radian, aşağı istiqamətdən): yığılı — sütun boyunca sallanır,
 * açıq — kənarlara bir az əyilmiş düz örtük.
 */
export function ribAngle(open) {
  const closed = 5 * Math.PI / 180, opened = 82 * Math.PI / 180
  return closed + (opened - closed) * clamp01(open)
}

/**
 * Çətir örtüyünün nöqtələri (mərkəz — sütunun başı, (0,0,0)). Planda kvadrat (yarım tərəf `half`),
 * 8 qabırğa (4-ü künclərə, 4-ü tərəflərin ortasına); qabırğalar arasında örtük açıqkən azca
 * içəri/aşağı sallanır, yığılanda büzülür. Halqa sayı S, hər panel üçün A bölmə.
 * Qaytarır: Float32Array (1 + S·M nöqtə, M = 8·A) — sıra: mərkəz, sonra halqalar.
 */
export function canopyPositions(open, half, S = 6, A = 3, out = null) {
  const N = 8, M = N * A, o = clamp01(open), th = ribAngle(o)
  const sh = Math.sin(th), ch = Math.cos(th)
  const pos = out || new Float32Array((1 + S * M) * 3)
  pos[0] = 0; pos[1] = 0; pos[2] = 0
  let i = 3
  for (let j = 1; j <= S; j++) {
    const s = j / S
    for (let k = 0; k < M; k++) {
      const phi = (k / M) * Math.PI * 2, f = (k % A) / A
      const bulge = Math.sin(Math.PI * f)
      const L = half / Math.max(Math.abs(Math.cos(phi)), Math.abs(Math.sin(phi)))
      const rr = s * L * (1 - 0.05 * bulge * s * s * o)
      const pleat = 1 - 0.55 * bulge * (1 - o)
      const hr = rr * sh * pleat
      pos[i++] = hr * Math.cos(phi)
      pos[i++] = -rr * ch - 0.35 * bulge * Math.sin(Math.PI * s) * o
      pos[i++] = hr * Math.sin(phi)
    }
  }
  return pos
}
/** canopyPositions üçün üçbucaq indeksləri */
export function canopyIndex(S = 6, A = 3) {
  const M = 8 * A, idx = []
  const v = (j, k) => 1 + (j - 1) * M + (k % M)
  for (let k = 0; k < M; k++) idx.push(0, v(1, k + 1), v(1, k))
  for (let j = 1; j < S; j++) {
    for (let k = 0; k < M; k++) {
      const a = v(j, k), b = v(j, k + 1), c = v(j + 1, k), d = v(j + 1, k + 1)
      idx.push(a, b, d, a, d, c)
    }
  }
  return idx
}
