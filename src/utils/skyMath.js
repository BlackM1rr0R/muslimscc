// ═══════════════════════════════════════════════════════
// Planetari riyaziyyatı (v6.9) — saf funksiyalar (tests/unit/sky-math.test.js)
//
// • Planetlər: JPL "Approximate Positions of the Planets" (E. M. Standish),
//   1800–2050 üçün Kepler elementləri — dəqiqlik dəqiqə-bucaq səviyyəsindədir.
// • Ay və Günəş: utils/lunar.js (Meeus). Üfüqi koordinat: lunar.horizontal.
// • Proyeksiya: stereoqrafik, baxış istiqaməti (az0, alt0) mərkəzdə.
// ═══════════════════════════════════════════════════════
import { jdOf, toEquatorial, moonEcliptic, sunEcliptic, horizontal } from './lunar.js'

const RAD = Math.PI / 180
const norm = (x) => ((x % 360) + 360) % 360

// [a, e, I, L, ϖ, Ω] və əsr başına dəyişmə
const EL = {
  mercury: [[0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
  venus: [[0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418]],
  earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  mars: [[1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  jupiter: [[5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
}
export const PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn']

/** Heliosentrik ekliptik düzbucaqlı koordinat (AU) */
function helio(name, T) {
  const [b, r] = EL[name]
  const [a, e, I, L, w, O] = b.map((v, i) => v + r[i] * T)
  const M = norm(L - w) * RAD
  let E = M + e * Math.sin(M)
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  const xp = a * (Math.cos(E) - e)
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E)
  const om = (w - O) * RAD, Or = O * RAD, Ir = I * RAD
  const co = Math.cos(om), so = Math.sin(om), cO = Math.cos(Or), sO = Math.sin(Or), cI = Math.cos(Ir), sI = Math.sin(Ir)
  return [
    (co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp,
    (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp,
    (so * sI) * xp + (co * sI) * yp,
  ]
}

/** Planetin geosentrik ekvatorial koordinatı: { ra, dec } (°) */
export function planetEquatorial(name, ms) {
  const T = (jdOf(ms) - 2451545) / 36525
  const p = helio(name, T), g = helio('earth', T)
  const x = p[0] - g[0], y = p[1] - g[1], z = p[2] - g[2]
  const lon = norm(Math.atan2(y, x) / RAD)
  const lat = Math.atan2(z, Math.hypot(x, y)) / RAD
  return toEquatorial(lon, lat, ms)
}

/** Bütün göy cisimləri (Günəş, Ay, planetlər) üfüqi koordinatda */
export function bodiesNow(ms, lat, lng) {
  const out = []
  const s = sunEcliptic(ms)
  const se = toEquatorial(s.lon, s.lat, ms)
  out.push({ id: 'sun', ...horizontal(se.ra, se.dec, ms, lat, lng) })
  const m = moonEcliptic(ms)
  const me = toEquatorial(m.lon, m.lat, ms)
  out.push({ id: 'moon', ...horizontal(me.ra, me.dec, ms, lat, lng) })
  for (const p of PLANETS) {
    const e = planetEquatorial(p, ms)
    out.push({ id: p, ...horizontal(e.ra, e.dec, ms, lat, lng) })
  }
  return out
}

/** Qalaktika ekvatoru (Süd Yolu, b = 0) — J2000 ekvatorial nöqtələri [ra, dec] (°) */
export function galacticEquator(step = 4) {
  // Şimal qalaktika qütbü: α = 192.85948°, δ = 27.12825°; l(NCP) = 122.93192°
  const aP = 192.85948, dP = 27.12825 * RAD, lN = 122.93192
  const pts = []
  for (let l = 0; l < 360; l += step) {
    const d = (lN - l) * RAD
    const dec = Math.asin(Math.cos(dP) * Math.cos(d)) / RAD
    const ra = norm(aP + Math.atan2(Math.sin(d), -Math.sin(dP) * Math.cos(d)) / RAD)
    pts.push([ra, dec])
  }
  return pts
}

/** Üfüqi → ekran (stereoqrafik). view: { az, alt, fov } (°); null — arxada */
export function project(alt, az, view, w, h) {
  const a = alt * RAD, z = az * RAD, a0 = view.alt * RAD, z0 = view.az * RAD
  const v = [Math.sin(z) * Math.cos(a), Math.cos(z) * Math.cos(a), Math.sin(a)]
  const f = [Math.sin(z0) * Math.cos(a0), Math.cos(z0) * Math.cos(a0), Math.sin(a0)]
  const r = [Math.cos(z0), -Math.sin(z0), 0]
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]
  const X = v[0] * r[0] + v[1] * r[1] + v[2] * r[2]
  const Y = v[0] * u[0] + v[1] * u[1] + v[2] * u[2]
  const Z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2]
  if (Z < -0.35) return null
  const s = (Math.min(w, h) / 2) / (2 * Math.tan((view.fov * RAD) / 4))
  return [w / 2 + (s * 2 * X) / (1 + Z), h / 2 - (s * 2 * Y) / (1 + Z)]
}
