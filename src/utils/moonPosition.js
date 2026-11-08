// ═══════════════════════════════════════════════════════
// Ayın səmadakı yeri (v5.8) — Hilal AR (components/HilalAR)
//
//   moonPosition(date, lat, lng) → { az, alt, dist }   az — şimaldan saat istiqamətində (°),
//                                                        alt — üfüqdən hündürlük (°, refraksiya ilə)
// • Meeus-un sadələşdirilmiş Ay nəzəriyyəsi (SunCalc kitabxanasındakı kimi, açıq alqoritm):
//   dəqiqlik ~1° — Ayı səmada tapmaq üçün kifayətdir; ru’yət (hökm) üçün DEYİL.
// ═══════════════════════════════════════════════════════
const RAD = Math.PI / 180
const DAY_MS = 86400000, J1970 = 2440588, J2000 = 2451545
const E = RAD * 23.4397

const toDays = (date) => date.valueOf() / DAY_MS - 0.5 + J1970 - J2000
const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l))
const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l))
const siderealTime = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw
const azimuthS = (H, phi, dec) => Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi))
const altitude = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H))
function refraction(h) { const hh = h < 0 ? 0 : h; return 0.0002967 / Math.tan(hh + 0.00312536 / (hh + 0.08901179)) }

function moonCoords(d) {
  const L = RAD * (218.316 + 13.176396 * d)
  const M = RAD * (134.963 + 13.064993 * d)
  const F = RAD * (93.272 + 13.229350 * d)
  const l = L + RAD * 6.289 * Math.sin(M)
  const b = RAD * 5.128 * Math.sin(F)
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: 385001 - 20905 * Math.cos(M) }
}

export function moonPosition(date, lat, lng) {
  const lw = RAD * -lng, phi = RAD * lat, d = toDays(date)
  const c = moonCoords(d)
  const H = siderealTime(d, lw) - c.ra
  let h = altitude(H, phi, c.dec)
  h += refraction(h)
  const az = (azimuthS(H, phi, c.dec) / RAD + 180 + 360) % 360
  return { az, alt: h / RAD, dist: c.dist }
}
