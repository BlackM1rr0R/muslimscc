// ═══════════════════════════════════════════════════════
// Dəqiq Ay və Günəş mövqeyi (v6.2) — hilalın görünmə xəritəsi (utils/crescentVis.js)
//
// • Ay: Jean Meeus, "Astronomical Algorithms" (2-ci nəşr), 47-ci fəsil — əsas 32 uzunluq/məsafə
//   və 20 en terminli kəsilmiş ELP-2000/82 (dəqiqlik ~10″, hilal üçün kifayət).
// • Günəş: Meeus, 25-ci fəsil (aşağı dəqiqlik, ~0.01°).
// • Vaxt: TT = UT + 69 s (2020-lərin ΔT-si; hilal hesabında təsiri < 1′).
// tests/unit/lunar.test.js — Meeus-un 47.a və 49.a nümunələri ilə yoxlanılır.
// ═══════════════════════════════════════════════════════
const RAD = Math.PI / 180
const DT_SEC = 69
const sinD = (x) => Math.sin(x * RAD), cosD = (x) => Math.cos(x * RAD)
const norm = (x) => ((x % 360) + 360) % 360

export const jdOf = (ms) => ms / 86400000 + 2440587.5
export const msOfJd = (jd) => (jd - 2440587.5) * 86400000
const centuriesTT = (ms) => (jdOf(ms + DT_SEC * 1000) - 2451545) / 36525

// [D, M, M', F, Σl (1e-6°), Σr (1e-3 km)] — Meeus cədvəl 47.A (ən böyük terminlər)
const LR = [
  [0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111], [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925], [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138], [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586], [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321], [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661], [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208], [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379], [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650], [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003], [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056],
  [1, 0, 1, 0, -2348, 6322], [2, -2, 0, 0, 2236, -9884],
]
// [D, M, M', F, Σb (1e-6°)] — cədvəl 47.B
const B = [
  [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463], [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870], [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794],
]

/** Ayın geosentrik ekliptik koordinatları: { lon, lat } (°), dist (km) */
export function moonEcliptic(ms) {
  const T = centuriesTT(ms)
  const Lp = norm(218.3164477 + 481267.88123421 * T)
  const D = norm(297.8501921 + 445267.1114034 * T)
  const M = norm(357.5291092 + 35999.0502909 * T)
  const Mp = norm(134.9633964 + 477198.8675055 * T)
  const F = norm(93.2720950 + 483202.0175233 * T)
  const E = 1 - 0.002516 * T - 0.0000074 * T * T
  const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T, A3 = 313.45 + 481266.484 * T
  let sl = 0, sr = 0, sb = 0
  for (const [d, m, mp, f, l, r] of LR) {
    const arg = d * D + m * M + mp * Mp + f * F, e = m ? E ** Math.abs(m) : 1
    sl += l * e * sinD(arg); sr += r * e * cosD(arg)
  }
  for (const [d, m, mp, f, b] of B) {
    const e = m ? E ** Math.abs(m) : 1
    sb += b * e * sinD(d * D + m * M + mp * Mp + f * F)
  }
  sl += 3958 * sinD(A1) + 1962 * sinD(Lp - F) + 318 * sinD(A2)
  sb += -2235 * sinD(Lp) + 382 * sinD(A3) + 175 * sinD(A1 - F) + 175 * sinD(A1 + F) + 127 * sinD(Lp - Mp) - 115 * sinD(Lp + Mp)
  return { lon: norm(Lp + sl / 1e6), lat: sb / 1e6, dist: 385000.56 + sr / 1000 }
}

/** Günəşin görünən ekliptik uzunluğu (°) və məsafəsi (AB) */
export function sunEcliptic(ms) {
  const T = centuriesTT(ms)
  const L0 = 280.46646 + 36000.76983 * T
  const M = 357.52911 + 35999.05029 * T
  const e = 0.016708634 - 0.000042037 * T
  const C = (1.914602 - 0.004817 * T) * sinD(M) + (0.019993 - 0.000101 * T) * sinD(2 * M) + 0.000289 * sinD(3 * M)
  const v = M + C
  const R = (1.000001018 * (1 - e * e)) / (1 + e * cosD(v))
  const lon = norm(L0 + C - 0.00569 - 0.00478 * sinD(125.04 - 1934.136 * T))
  return { lon, lat: 0, dist: R }
}

const obliquity = (ms) => 23.439291 - 0.0130042 * centuriesTT(ms)

/** Ekliptik → ekvatorial: { ra, dec } (°) */
export function toEquatorial(lon, lat, ms) {
  const e = obliquity(ms)
  const ra = Math.atan2(sinD(lon) * cosD(e) - Math.tan(lat * RAD) * sinD(e), cosD(lon)) / RAD
  const dec = Math.asin(sinD(lat) * cosD(e) + cosD(lat) * sinD(e) * sinD(lon)) / RAD
  return { ra: norm(ra), dec }
}

/** Qrinviç orta ulduz vaxtı (°) */
export function gmst(ms) {
  const d = jdOf(ms) - 2451545, T = d / 36525
  return norm(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T)
}

/** Ekvatorial → üfüqi (havasız, geosentrik): { alt, az } (°), az — şimaldan saat istiqamətində */
export function horizontal(ra, dec, ms, lat, lng) {
  const H = gmst(ms) + lng - ra
  const alt = Math.asin(sinD(lat) * sinD(dec) + cosD(lat) * cosD(dec) * cosD(H)) / RAD
  const az = Math.atan2(sinD(H), cosD(H) * sinD(lat) - Math.tan(dec * RAD) * cosD(lat)) / RAD + 180
  return { alt, az: norm(az) }
}

/** İki nöqtə arası bucaq məsafəsi (°) */
export function angSep(ra1, dec1, ra2, dec2) {
  const c = sinD(dec1) * sinD(dec2) + cosD(dec1) * cosD(dec2) * cosD(ra1 - ra2)
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD
}

/** Ay–Günəş uzunluq fərqi (−180…180°): 0 — birləşmə (təzə ay) */
export function elongLon(ms) {
  const d = moonEcliptic(ms).lon - sunEcliptic(ms).lon
  return ((d + 540) % 360) - 180
}

/**
 * `ms`-dən sonrakı ilk birləşmə (ictima', astronomik təzə ay) — epoch ms.
 * Uzunluq fərqinin mənfidən müsbətə keçdiyi an, ikiyə bölmə ilə (~1 san).
 */
export function nextConjunction(ms) {
  const STEP = 6 * 3600000
  let a = ms, fa = elongLon(a)
  for (let i = 0; i < 140; i++) {
    const b = a + STEP, fb = elongLon(b)
    if (fa < 0 && fb >= 0 && fb - fa < 90) {
      let lo = a, hi = b
      for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (elongLon(mid) < 0) lo = mid; else hi = mid }
      return Math.round((lo + hi) / 2)
    }
    a = b; fa = fb
  }
  return null
}
