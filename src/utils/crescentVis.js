// ═══════════════════════════════════════════════════════
// Hilalın görünmə xəritəsi (v6.2) — components/CrescentVisibilityMap.jsx (/calendar)
//
// Meyar: Muhammad Şövkət Odeh, "New Criterion for Lunar Crescent Visibility",
//   Experimental Astronomy 18 (2004) 39–64.
//   • "Ən yaxşı vaxt": Tb = gün batımı + 4/9 × (ay batımı − gün batımı)  (Yallop)
//   • ARCV — Ay ilə Günəşin hündürlük fərqi (toposentrik, havasız), W — hilalın eni (′)
//   • V = ARCV − (−0.1018W³ + 0.7319W² − 6.3226W + 7.1651)
//     V ≥ 5.65 → A: gözlə görünür · 2 ≤ V < 5.65 → B: cihazla, bəlkə gözlə ·
//     −0.96 ≤ V < 2 → C: yalnız cihazla · V < −0.96 → D: görünmür
//   • Ay Günəşdən əvvəl batırsa və ya gün batanda hələ birləşmə olmayıbsa — D.
// Bu ASTRONOMİK PROQNOZDUR — ru’yəti (hökmü) əvəz etmir; elanı yerli qurum verir.
// tests/unit/crescent-vis.test.js
// ═══════════════════════════════════════════════════════
import { moonEcliptic, sunEcliptic, toEquatorial, gmst, nextConjunction } from './lunar'

const RAD = Math.PI / 180
const MIN = 60000, HOUR = 3600000, DAY = 86400000
const SIDEREAL = 360.98564736629 // °/gün
const sinD = (x) => Math.sin(x * RAD), cosD = (x) => Math.cos(x * RAD)
const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180

export const ZONES = ['A', 'B', 'C', 'D']
export function odehV(arcv, w) { return arcv - (-0.1018 * w ** 3 + 0.7319 * w ** 2 - 6.3226 * w + 7.1651) }
export function zoneOfV(v) { return v >= 5.65 ? 'A' : v >= 2 ? 'B' : v >= -0.96 ? 'C' : 'D' }

/** [t0, t1] aralığında 10 dəqiqəlik cədvəl + xətti interpolyasiya (Ay: ra, dec, dist; Günəş: ra, dec) */
export function makeEphemeris(t0, t1, step = 10 * MIN) {
  const n = Math.ceil((t1 - t0) / step) + 1
  const mra = new Float64Array(n), mdec = new Float64Array(n), mdist = new Float64Array(n), sra = new Float64Array(n), sdec = new Float64Array(n)
  let pm = null, ps = null
  for (let i = 0; i < n; i++) {
    const t = t0 + i * step
    const m = moonEcliptic(t), me = toEquatorial(m.lon, m.lat, t)
    const s = sunEcliptic(t), se = toEquatorial(s.lon, 0, t)
    // RA-nı "açırıq" ki, 360→0 keçidində interpolyasiya pozulmasın
    mra[i] = pm == null ? me.ra : pm + wrap180(me.ra - pm); pm = mra[i]
    sra[i] = ps == null ? se.ra : ps + wrap180(se.ra - ps); ps = sra[i]
    mdec[i] = me.dec; mdist[i] = m.dist; sdec[i] = se.dec
  }
  const at = (arr, t) => {
    const x = Math.max(0, Math.min(n - 1.000001, (t - t0) / step)), i = Math.floor(x), f = x - i
    return arr[i] + (arr[i + 1] - arr[i]) * f
  }
  return {
    t0, t1,
    moon: (t) => ({ ra: at(mra, t), dec: at(mdec, t), dist: at(mdist, t) }),
    sun: (t) => ({ ra: at(sra, t), dec: at(sdec, t) }),
  }
}

function altAz(ra, dec, t, lat, lng) {
  const H = gmst(t) + lng - ra
  const alt = Math.asin(sinD(lat) * sinD(dec) + cosD(lat) * cosD(dec) * cosD(H)) / RAD
  const az = Math.atan2(sinD(H), cosD(H) * sinD(lat) - Math.tan(dec * RAD) * cosD(lat)) / RAD + 180
  return { alt, az }
}

/** Ayın toposentrik (havasız) hündürlüyü, azimutu, paralaksı (°) */
function moonTopo(eph, t, lat, lng) {
  const m = eph.moon(t)
  const { alt, az } = altAz(m.ra, m.dec, t, lat, lng)
  const par = Math.asin(6378.14 / m.dist) / RAD
  return { alt: alt - par * cosD(alt), az, par }
}

/** Yerli gün batımı (epoch ms) — `dayStart` UTC günü üçün; qütb günü/gecəsi → null */
export function sunsetOn(eph, dayStart, lat, lng) {
  let t = dayStart + (12 - lng / 15) * HOUR
  for (let k = 0; k < 4; k++) {
    const s = eph.sun(t)
    const c = (sinD(-0.833) - sinD(lat) * sinD(s.dec)) / (cosD(lat) * cosD(s.dec))
    if (c < -1 || c > 1) return null
    const H0 = Math.acos(c) / RAD
    const H = wrap180(gmst(t) + lng - s.ra)
    t += ((H0 - H) / SIDEREAL) * DAY
  }
  return t
}

/**
 * Bir nöqtə üçün hilal hesabı — { zone, v, sunset, moonset, lag (dəq), age (saat), arcl, arcv, w, why }
 * why: 'before' — gün batanda birləşmə olmayıb · 'set' — Ay Günəşdən əvvəl batır · 'polar' · null
 */
export function crescentAt(eph, conj, dayStart, lat, lng) {
  const ts = sunsetOn(eph, dayStart, lat, lng)
  if (ts == null) return { zone: 'D', why: 'polar' }
  const age = (ts - conj) / HOUR
  if (moonTopo(eph, ts, lat, lng).alt < -0.833) return { zone: 'D', why: 'set', sunset: ts, age }
  // Ay batımı: 4 dəqiqəlik addımlarla, sonra dəqiqləşdirmə
  let tm = ts, step = 4 * MIN
  while (tm - ts < 5 * HOUR && moonTopo(eph, tm + step, lat, lng).alt >= -0.833) tm += step
  for (let k = 0; k < 3; k++) { step /= 4; while (moonTopo(eph, tm + step, lat, lng).alt >= -0.833) tm += step }
  const lag = (tm - ts) / MIN
  const tb = ts + (4 / 9) * (tm - ts)
  const s = eph.sun(tb), sun = altAz(s.ra, s.dec, tb, lat, lng)
  const mo = moonTopo(eph, tb, lat, lng)
  const arcv = mo.alt - sun.alt
  // Toposentrik elonqasiya — üfüqi koordinatlarda iki nöqtə arası bucaq
  const cosL = sinD(mo.alt) * sinD(sun.alt) + cosD(mo.alt) * cosD(sun.alt) * cosD(mo.az - sun.az)
  const arcl = Math.acos(Math.max(-1, Math.min(1, cosL))) / RAD
  const sd = 0.27245 * mo.par * 60 * (1 + sinD(Math.max(0, mo.alt)) * sinD(mo.par))   // ′
  const w = sd * (1 - cosD(arcl))
  const v = odehV(arcv, w)
  const zone = age < 0 ? 'D' : zoneOfV(v)
  return { zone, v, sunset: ts, moonset: tm, lag, age, arcl, arcv, w, why: age < 0 ? 'before' : null }
}

/** Gün (UTC) başlanğıcı — epoch ms */
export const utcDay = (ms) => Math.floor(ms / DAY) * DAY

/**
 * Göstəriləcək ay: indidən 3 gün əvvəldən sonrakı ilk birləşmə və ondan sonrakı 3 axşam.
 * → { conj, days: [dayStart, dayStart+1, dayStart+2] }
 */
export function crescentEvenings(now = Date.now()) {
  const conj = nextConjunction(now - 3 * DAY)
  if (conj == null) return null
  const d0 = utcDay(conj)
  return { conj, days: [d0, d0 + DAY, d0 + 2 * DAY] }
}

/** Xəritə şəbəkəsi: step° addımla, lat [−60, 64] — zona kodları (0=A … 3=D), sətir-sətir şimaldan */
export function crescentGrid(conj, dayStart, step = 2, latMin = -60, latMax = 64) {
  const eph = makeEphemeris(dayStart - 2 * HOUR, dayStart + 38 * HOUR)
  const rows = Math.floor((latMax - latMin) / step) + 1, cols = Math.round(360 / step)
  const codes = new Uint8Array(rows * cols)
  for (let r = 0; r < rows; r++) {
    const lat = latMax - r * step
    for (let c = 0; c < cols; c++) {
      const lng = -180 + c * step + step / 2
      codes[r * cols + c] = ZONES.indexOf(crescentAt(eph, conj, dayStart, lat, lng).zone)
    }
  }
  return { codes, rows, cols, step, latMax, latMin, eph }
}
