// ═══════════════════════════════════════════════════════
// Ulduzlarla qiblə (v6.6) — hazırda və bu gecə hansı parlaq ulduz qiblə istiqamətindədir.
//
// • Ulduzlar: data/brightStars.js (J2000) → presessiya (Meeus, 21.2-21.4) → tarixin
//   ekvatorial koordinatı → üfüqi (utils/lunar.horizontal) + atmosfer refraksiyası (Bennett).
// • Qiblə: böyük dairə istiqaməti (utils/rasdQibla.bearing) — kompasın göstərdiyi bucaqla eyni.
// • Ulduz qiblə tərəfdə — onun azimutu qiblə bucağına bərabərdir: onun altındakı üfüq nöqtəsi
//   qiblədir. Ulduz hündürdə olanda (≳60°) istiqaməti seçmək çətinləşir — belələri tövsiyə olunmur.
// • Qaranlıq: Günəş −12°-dən aşağı (dəniz alaqaranlığının sonu) — parlaq ulduzlar aydın görünür.
// Saf funksiyalar, şəbəkə yoxdur — internetsiz işləyir. tests/unit/star-qibla.test.js
// ═══════════════════════════════════════════════════════
import { BRIGHT_STARS } from '../data/brightStars.js'
import { horizontal, jdOf } from './lunar.js'
import { bearing, sunHorizontal, KAABA } from './rasdQibla.js'

const RAD = Math.PI / 180
const MIN = 60000
export const MIN_ALT = 8       // üfüqə çox yaxın ulduz dumanda görünmür
export const MAX_ALT = 60      // çox hündür ulduzun istiqaməti qeyri-müəyyəndir
export const DARK_SUN = -12    // Günəş bundan aşağı — qaranlıq
const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180

/** J2000 → tarixin ekvinoksu (Meeus 21.4, ciddi üsul): { ra, dec } (°) */
export function precess(ra0, dec0, ms) {
  const T = (jdOf(ms) - 2451545) / 36525
  const as = (x) => (x / 3600) * RAD
  const zeta = as(2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3)
  const z = as(2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3)
  const th = as(2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3)
  const a = ra0 * RAD, d = dec0 * RAD
  const A = Math.cos(d) * Math.sin(a + zeta)
  const B = Math.cos(th) * Math.cos(d) * Math.cos(a + zeta) - Math.sin(th) * Math.sin(d)
  const C = Math.sin(th) * Math.cos(d) * Math.cos(a + zeta) + Math.cos(th) * Math.sin(d)
  const ra = (Math.atan2(A, B) + z) / RAD
  const dec = (Math.abs(C) > 0.99 ? Math.acos(Math.hypot(A, B)) * Math.sign(C) : Math.asin(C)) / RAD
  return { ra: ((ra % 360) + 360) % 360, dec }
}

/** Görünən hündürlük: həndəsi + refraksiya (Bennett, °) */
export const refract = (alt) => (alt < -1 ? alt : alt + (1.02 / Math.tan((alt + 10.3 / (alt + 5.11)) * RAD)) / 60)

/** Ulduzun üfüqi mövqeyi: { alt, az } (°) */
export function starHorizontal(star, ms, lat, lng) {
  const e = precess(star.ra, star.dec, ms)
  const h = horizontal(e.ra, e.dec, ms, lat, lng)
  return { alt: refract(h.alt), az: h.az }
}

export const qiblaBearing = (lat, lng) => bearing({ lat, lng }, KAABA)
export const isDark = (ms, lat, lng) => sunHorizontal(ms, lat, lng).alt < DARK_SUN

/**
 * Bu an səma: hər ulduz üçün { star, alt, az, off } — off: qiblədən fərq (−180…180°, + sağda).
 * Yalnız üfüqdən yuxarıdakılar (alt > 0).
 */
export function skyNow(ms, lat, lng) {
  const q = qiblaBearing(lat, lng)
  return BRIGHT_STARS.map(star => {
    const p = starHorizontal(star, ms, lat, lng)
    return { star, ...p, off: wrap180(p.az - q) }
  }).filter(s => s.alt > 0)
}

const usable = (s) => s.alt >= MIN_ALT && s.alt <= MAX_ALT

/**
 * Hazırda qiblə istiqamətinə ən yaxın istifadəyə yararlı ulduz (±maxOff° daxilində): { star, alt, az, off } və ya null.
 * Bərabər yaxınlıqda parlağı üstündür (1 ulduz ölçüsü ≈ 2°).
 */
export function bestNow(ms, lat, lng, maxOff = 20) {
  const c = skyNow(ms, lat, lng).filter(s => usable(s) && Math.abs(s.off) <= maxOff)
  c.sort((a, b) => (Math.abs(a.off) + Math.max(0, a.star.mag) * 2) - (Math.abs(b.off) + Math.max(0, b.star.mag) * 2))
  return c[0] || null
}

/**
 * [from, from + hours) aralığında ulduzların qiblə istiqamətindən DÜZ keçdiyi anlar (qaranlıqda,
 * yararlı hündürlükdə): [{ star, ms, alt }] — vaxt sırası ilə. Addım 4 dəq, kəsişmə xətti interpolyasiya ilə.
 */
export function crossings(from, lat, lng, hours = 14) {
  const q = qiblaBearing(lat, lng)
  const step = 4 * MIN, end = from + hours * 3600000
  const out = []
  for (const star of BRIGHT_STARS) {
    let prev = null
    for (let t = from; t <= end; t += step) {
      const p = starHorizontal(star, t, lat, lng)
      const off = wrap180(p.az - q)
      if (prev && Math.sign(off) !== Math.sign(prev.off) && Math.abs(off - prev.off) < 90) {
        const k = prev.off / (prev.off - off)
        const ms = Math.round(prev.t + k * step)
        const at = starHorizontal(star, ms, lat, lng)
        if (usable(at) && isDark(ms, lat, lng)) out.push({ star, ms, alt: at.alt })
      }
      prev = { t, off }
    }
  }
  return out.sort((a, b) => a.ms - b.ms)
}

/**
 * Qütb ulduzu ilə qiblə. Qiblə Qütb ulduzu tərəfdədirsə (fərq ≤ 90°) — ulduza üz tutub dönmək,
 * əks halda — ulduzu ARXAYA alıb dönmək (qədim üsul; dönmə bucağı kiçik qalır).
 * → { visible, alt, face: 'front'|'back', turn: 'right'|'left'|'none', deg } (deg 0…90)
 */
export function polarisTurn(ms, lat, lng) {
  const polaris = BRIGHT_STARS.find(s => s.id === 'polaris')
  const p = starHorizontal(polaris, ms, lat, lng)
  const q = qiblaBearing(lat, lng)
  const front = wrap180(q - p.az)
  const face = Math.abs(front) <= 90 ? 'front' : 'back'
  const off = face === 'front' ? front : wrap180(q - p.az - 180)
  const deg = Math.round(Math.abs(off))
  return { visible: p.alt >= 3, alt: p.alt, face, turn: deg === 0 ? 'none' : off > 0 ? 'right' : 'left', deg }
}

/** Səma qübbəsi proyeksiyası (qiblə yuxarıda): zenit mərkəzdə, üfüq r radiusda → { x, y } */
export function domeXY(alt, az, q, r) {
  const rr = r * (1 - Math.max(0, alt) / 90)
  const a = (az - q) * RAD
  return { x: rr * Math.sin(a), y: -rr * Math.cos(a) }
}
