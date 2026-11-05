// Günəşin yer üzərindəki mövqeyi və azan anları — vizual xəritələr üçün (saf; tests/unit/solar.test.js)
// Astronomik düsturlar: NOAA / Meeus (sadələşdirilmiş, ~1 dəq dəqiqlik — xəritə üçün kifayətdir).
const RAD = Math.PI / 180

/** Günəşin meyli (dərəcə) və zaman tənliyi (dəqiqə) — UTC epoch ms üçün */
export function sunParams(ms) {
  const d = ms / 86400000 - 10957.5           // J2000-dən günlər
  const g = (357.529 + 0.98560028 * d) * RAD   // orta anomaliya
  const q = 280.459 + 0.98564736 * d           // orta uzunluq
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const e = (23.439 - 0.00000036 * d) * RAD
  const decl = Math.asin(Math.sin(e) * Math.sin(L)) / RAD
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD
  let eqt = (((q - ra) % 360) + 540) % 360 - 180 // dərəcə
  return { decl, eqtMin: eqt * 4 }
}

/** Günəşin başımızın üstündə olduğu nöqtə [lng, lat] */
export function subsolar(ms) {
  const { decl, eqtMin } = sunParams(ms)
  const utcMin = (ms / 60000) % 1440
  const lng = -((utcMin + eqtMin) / 4 - 180)
  return [((lng + 540) % 360) - 180, decl]
}
export const antisolar = (ms) => { const [lng, lat] = subsolar(ms); return [lng > 0 ? lng - 180 : lng + 180, -lat] }

/** Nöqtədə günəşin üfüqdən hündürlüyü (dərəcə) */
export function sunAltitude(ms, lat, lng) {
  const [sl, sd] = subsolar(ms)
  const c = Math.sin(lat * RAD) * Math.sin(sd * RAD) + Math.cos(lat * RAD) * Math.cos(sd * RAD) * Math.cos((lng - sl) * RAD)
  return Math.asin(Math.max(-1, Math.min(1, c))) / RAD
}

/**
 * Hazırda hansı azan oxunur (±win dəq): 'fajr' | 'dhuhr' | 'maghrib' | 'isha' | null
 * Sübh: günəş −18°-dən yuxarı keçir; məğrib: −0.833°-dən aşağı; işa: −17°-dən aşağı;
 * zöhr: günəş meridiandan keçəndən sonra. (Əsr kölgəyə görədir — xəritədə göstərilmir.)
 */
export function adhanAt(ms, lat, lng, win = 3) {
  const a0 = sunAltitude(ms - win * 60000, lat, lng), a1 = sunAltitude(ms + win * 60000, lat, lng)
  const up = (h) => a0 < h && a1 >= h, down = (h) => a0 >= h && a1 < h
  if (up(-18)) return 'fajr'
  if (down(-0.833)) return 'maghrib'
  if (down(-17)) return 'isha'
  // Zöhr: hündürlük artmaqdan azalmağa keçir (günorta) — ±win daxilində maksimum
  const am = sunAltitude(ms, lat, lng)
  if (am > a0 && am > a1 && am > 0) return 'dhuhr'
  return null
}
