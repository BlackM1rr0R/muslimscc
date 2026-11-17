// ═══════════════════════════════════════════════════════
// Ay qlobusu üçün saf hesablar (components/MoonCraters.jsx)
//
// • Ortoqrafik proyeksiya: selenoqrafik (enlik, uzunluq; +Şərq, IAU) → görünüş
//   koordinatları. +x — sağa (Böhranlar dənizi tərəfi, IAU şərqi), +y — şimala,
//   +z — baxana doğru (z > 0 — görünən yarımkürə).
// • Günəş işığı: Ayın elonqasiyasından (utils/lunar.js → elongLon) subsolyar
//   uzunluq ≈ 180° − E. Librasiya (±8°) və Günəşin selenoqrafik enliyi (±1.5°)
//   nəzərə alınmır — "hansı krater indi işıqdadır" üçün kifayətdir.
// • Gecə bölgəsi: terminator (böyük dairə) və Ay diskinin kənarı (limb) iki
//   böyük dairədir; kəsişmə nöqtələri ±w, gecə sahəsi = terminatorun görünən
//   yarısı + limb-in gecə tərəfdəki yarısı.
// ═══════════════════════════════════════════════════════
import { elongLon } from './lunar'

const RAD = Math.PI / 180
export const MOON_RADIUS_KM = 1737.4
const norm360 = (x) => ((x % 360) + 360) % 360
export const wrap180 = (x) => norm360(x + 180) - 180

/** Selenoqrafik nöqtə → vahid sferada görünüş vektoru [x, y, z] (mərkəz lat0, lon0) */
export function toView(lat, lon, lon0, lat0 = 0) {
  const p = lat * RAD, l = (lon - lon0) * RAD, p0 = lat0 * RAD
  const cp = Math.cos(p)
  return [
    cp * Math.sin(l),
    Math.cos(p0) * Math.sin(p) - Math.sin(p0) * cp * Math.cos(l),
    Math.sin(p0) * Math.sin(p) + Math.cos(p0) * cp * Math.cos(l),
  ]
}

/** Ortoqrafik proyeksiya: { x, y, visible }, x/y — vahid disk (y yuxarı müsbət) */
export function project(lat, lon, lon0, lat0 = 0) {
  const [x, y, z] = toView(lat, lon, lon0, lat0)
  return { x, y, z, visible: z > 0 }
}

/** Subsolyar nöqtənin selenoqrafik uzunluğu (°, −180…180) — Ayın fazasından */
export function subsolarLon(ms) {
  const E = norm360(elongLon(ms)) // 0 — təzə ay, 180 — bədr
  return wrap180(180 - E)
}

/** Ayın işıqlı hissəsi (0…1) və elonqasiya (0…360°) */
export function moonPhase(ms) {
  const E = norm360(elongLon(ms))
  return { elong: E, fraction: (1 - Math.cos(E * RAD)) / 2, waxing: E < 180 }
}

/** Nöqtə günəş işığındadırmı (Günəşin enliyi 0 qəbul olunur) */
export function isLit(lat, lon, ssLon, ssLat = 0) {
  return toView(lat, lon, ssLon, ssLat)[2] > 0
}

/** Günəşin hündürlüyü (°) krater mərkəzində — terminatora yaxınlıq üçün */
export function sunAltitude(lat, lon, ssLon, ssLat = 0) {
  const z = toView(lat, lon, ssLon, ssLat)[2]
  return Math.asin(Math.max(-1, Math.min(1, z))) / RAD
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a) => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n] }

/**
 * Görünən diskdə gecə sahəsinin SVG yolu (radius R, mərkəz 0,0; SVG y aşağı).
 * Qaytarır: '' — hamısı işıqlı, 'full' — hamısı qaranlıq, yaxud path string.
 */
export function nightPath(ssLon, lon0, lat0 = 0, R = 1, ssLat = 0, steps = 48) {
  const s = toView(ssLat, ssLon, lon0, lat0)
  const sxy = Math.hypot(s[0], s[1])
  if (sxy < 1e-4) return s[2] > 0 ? '' : 'full'
  const w = unit([s[1], -s[0], 0])           // terminator ∩ limb
  let q = unit(cross(s, w)); if (q[2] < 0) q = q.map(v => -v)
  let n = [-w[1], w[0], 0]; if (dot(n, s) > 0) n = n.map(v => -v)
  const pts = []
  for (let i = 0; i <= steps; i++) {        // terminator: w → q → −w
    const t = (i / steps) * Math.PI, c = Math.cos(t), si = Math.sin(t)
    pts.push([c * w[0] + si * q[0], c * w[1] + si * q[1]])
  }
  for (let i = 1; i < steps; i++) {         // limb: −w → n → w
    const t = (i / steps) * Math.PI, c = Math.cos(t), si = Math.sin(t)
    pts.push([-c * w[0] + si * n[0], -c * w[1] + si * n[1]])
  }
  return pts.map((p, i) => `${i ? 'L' : 'M'}${(p[0] * R).toFixed(2)} ${(-p[1] * R).toFixed(2)}`).join('') + 'Z'
}

/**
 * Sferada dairə (mərkəz lat/lon, bucaq radiusu ρ°) — proyeksiya olunmuş SVG yolu,
 * yalnız görünən hissə (arxa tərəfdəki nöqtələr limb-ə sıxılır).
 */
export function circlePath(lat, lon, radiusDeg, lon0, lat0 = 0, R = 1, steps = 40) {
  const c = toView(lat, lon, lon0, lat0)
  // mərkəzə perpendikulyar iki vektor
  const a = unit(Math.abs(c[2]) < 0.9 ? cross(c, [0, 0, 1]) : cross(c, [1, 0, 0]))
  const b = cross(c, a)
  const r = radiusDeg * RAD, cr = Math.cos(r), sr = Math.sin(r)
  let any = false
  const pts = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI, ct = Math.cos(t), st = Math.sin(t)
    let p = [cr * c[0] + sr * (ct * a[0] + st * b[0]), cr * c[1] + sr * (ct * a[1] + st * b[1]), cr * c[2] + sr * (ct * a[2] + st * b[2])]
    if (p[2] > 0) any = true
    else { const h = Math.hypot(p[0], p[1]) || 1; p = [p[0] / h, p[1] / h, 0] }
    pts.push(p)
  }
  if (!any) return ''
  return pts.map((p, i) => `${i ? 'L' : 'M'}${(p[0] * R).toFixed(2)} ${(-p[1] * R).toFixed(2)}`).join('') + 'Z'
}

/** Krater diametri (km) → bucaq radiusu (°) */
export const kmToDeg = (km) => (km / 2 / MOON_RADIUS_KM) / RAD

/** Kraterlər ön (Yerə baxan) tərəfdədirmi: |lon| ≤ 90 */
export const isNearSide = (lon) => Math.abs(wrap180(lon)) <= 90

/** Koordinat yazısı: 15.91° N, 71.83° E */
export function fmtCoord(lat, lon) {
  const ns = lat >= 0 ? 'N' : 'S', ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`
}

/**
 * Sadə yazı yerləşdirmə (üst-üstə düşməsin): items — { id, x, y, w, h }, prioritet sırası ilə.
 * Hər yazı üçün 4 mövqe yoxlanır (sağ-üst, sol-üst, sağ-alt, sol-alt); sığmayan yazı atlanır.
 * Qaytarır: { [id]: { x, y, anchor: 'start'|'end' } } (y — mətnin baza xətti).
 */
export function placeLabels(items, bound = Infinity, gap = 6) {
  const boxes = items.map(i => [i.x - 3, i.y - 3, i.x + 3, i.y + 3]) // nöqtələrin özü
  const out = {}
  const hit = (b) => boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])
  for (const it of items) {
    const cands = [[1, -1], [-1, -1], [1, 1], [-1, 1]]
    if (it.x > 0) cands.sort((a, b) => a[0] - b[0]) // sağ kənarda — əvvəlcə sola
    for (const [sx, sy] of cands) {
      const x0 = sx > 0 ? it.x + gap : it.x - gap - it.w
      const yb = sy < 0 ? it.y - gap : it.y + gap + it.h
      const box = [x0, yb - it.h, x0 + it.w, yb + 2]
      if (box[0] < -bound || box[2] > bound || box[1] < -bound || box[3] > bound) continue
      if (hit(box)) continue
      boxes.push(box)
      out[it.id] = { x: sx > 0 ? x0 : x0 + it.w, y: yb, anchor: sx > 0 ? 'start' : 'end' }
      break
    }
  }
  return out
}
