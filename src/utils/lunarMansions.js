// ═══════════════════════════════════════════════════════
// Ay mənzilləri — saf hesab (components/LunarMansions.jsx; testlər: tests/unit/lunar-mansions.test.js)
//
// • Üsul: ekliptika 28 BƏRABƏR hissəyə bölünür (360/28 = 12°51′26″) — orta əsr cədvəllərindəki kimi.
//   Bölgü ulduzlara bağlıdır (sideral): 1-ci mənzil (əş-Şərətan) β Arietis-in tarixə gətirilmiş
//   ekliptik uzunluğundan başlayır, ona görə mənzillər bu gün də öz ulduzlarının üstündə qalır.
// • β Ari, J2000: α = 1h54m38.41s, δ = +20°48′28.9″ (Hipparcos) → λ = 33.970°, β = +8.487°
//   (ε₀ = 23.4392911°). Presessiya (uzunluqda ümumi): 5029.0966″/əsr ≈ 50.29″/il (IAU 2006).
// • Ay və Günəş: utils/lunar.js (Meeus) — orta tarix bərabərgecəsinə nəzərən uzunluq.
// ═══════════════════════════════════════════════════════
import { jdOf, moonEcliptic, sunEcliptic } from './lunar'

const RAD = Math.PI / 180
const norm = (x) => ((x % 360) + 360) % 360

export const MANSION_COUNT = 28
export const MANSION_SPAN = 360 / MANSION_COUNT            // 12.857142…°
export const BETA_ARI_LON_J2000 = 33.970                   // °
export const PRECESSION_PER_CENTURY = 5029.0966 / 3600     // ° / Yuli əsri
const EPS_J2000 = 23.4392911

const centuries = (ms) => (jdOf(ms) - 2451545) / 36525

/** J2000 ekliptik uzunluğunu `ms` tarixinin bərabərgecəsinə gətir (yalnız uzunluqda presessiya) */
export const precessLon = (lon2000, ms) => norm(lon2000 + PRECESSION_PER_CENTURY * centuries(ms))

/** 1-ci mənzilin başlanğıcı (β Ari-nin tarixdəki uzunluğu), ° */
export const anchorLon = (ms) => precessLon(BETA_ARI_LON_J2000, ms)

/** Ekvatorial J2000 (ra, dec °) → ekliptik uzunluq J2000 (°) */
export function eclLonJ2000(ra, dec) {
  const e = EPS_J2000 * RAD
  return norm(Math.atan2(Math.sin(ra * RAD) * Math.cos(e) + Math.tan(dec * RAD) * Math.sin(e), Math.cos(ra * RAD)) / RAD)
}

/** Uzunluq → { index 0..27, progress 0..1 } */
export function mansionAt(lon, ms) {
  const rel = norm(lon - anchorLon(ms))
  const f = rel / MANSION_SPAN
  const index = Math.min(MANSION_COUNT - 1, Math.floor(f))
  return { index, progress: f - index }
}

/** İndeksi 0..27 aralığına sal (mənfi də olar) */
export const wrapIndex = (i) => ((Math.round(i) % MANSION_COUNT) + MANSION_COUNT) % MANSION_COUNT

/** i-ci mənzilin başlanğıc uzunluğu (tarixə görə), ° */
export const mansionStartLon = (i, ms) => norm(anchorLon(ms) + wrapIndex(i) * MANSION_SPAN)

/** Ay: uzunluq, en, mənzil, faza (işıqlanma 0..1), böyüyən/kiçilən */
export function moonState(ms) {
  const m = moonEcliptic(ms), s = sunEcliptic(ms)
  // Ay–Günəş bucaq məsafəsi (elongasiya) ψ; faza bucağı ≈ 180° − ψ (Meeus 48.2 sadələşdirilmiş)
  const cosPsi = Math.cos(m.lat * RAD) * Math.cos((m.lon - s.lon) * RAD)
  const illum = (1 - cosPsi) / 2
  const waxing = norm(m.lon - s.lon) < 180
  return { lon: m.lon, lat: m.lat, sunLon: s.lon, illum, waxing, ...mansionAt(m.lon, ms), sun: mansionAt(s.lon, ms) }
}

/**
 * Ayın `ms`-dən sonra NÖVBƏTİ mənzilə girdiyi an (epoch ms). Ay ekliptikada geri getmir
 * (~11–15°/gün), bir mənzil ≤ ~28 saat: 2 saatlıq addım + ikiyə bölmə (~1 dəq).
 */
export function nextMansionEntry(ms) {
  const STEP = 2 * 3600000
  const i0 = mansionAt(moonEcliptic(ms).lon, ms).index
  let a = ms
  for (let k = 0; k < 40; k++) {
    const b = a + STEP
    if (mansionAt(moonEcliptic(b).lon, b).index !== i0) {
      let lo = a, hi = b
      for (let j = 0; j < 20; j++) {
        const mid = (lo + hi) / 2
        if (mansionAt(moonEcliptic(mid).lon, mid).index === i0) lo = mid; else hi = mid
      }
      return Math.round(hi)
    }
    a = b
  }
  return null
}
