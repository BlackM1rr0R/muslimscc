// Ay tutulmasının şəhərdən görünməsi (components/LunarEclipses.jsx, v6.5) — saf hesab
// (tests/unit/eclipse-vis.test.js). Vaxtlar — data/lunarEclipses.js (NASA); Ayın yeri — Meeus (utils/lunar.js).
import { moonEcliptic, toEquatorial, horizontal } from './lunar'
import { LUNAR_ECLIPSES } from '../data/lunarEclipses'

const MIN = 60000
// TD → UT: ΔT ≈ 69 s (2026), ildə ~0.3 s artır (IERS proqnozu) — dəqiqə dəqiqliyi üçün kifayətdir
export const deltaT = (year) => 69 + 0.3 * (year - 2026)

/** Tutulmanın anları (UT, ms): U1/U4 — kölgə fazasının başı/sonu, U2/U3 — tam fazanın başı/sonu, max */
export function phases(e) {
  const [y, m, d] = e.d.split('-').map(Number)
  const [hh, mm, ss] = e.td.split(':').map(Number)
  const max = Date.UTC(y, m - 1, d, hh, mm, ss) - deltaT(y) * 1000
  return {
    max,
    u1: max - (e.par / 2) * MIN, u4: max + (e.par / 2) * MIN,
    u2: e.tot ? max - (e.tot / 2) * MIN : null, u3: e.tot ? max + (e.tot / 2) * MIN : null,
  }
}

/** Ayın hündürlüyü (°, geosentrik, refraksiyasız) */
export function moonAlt(ms, lat, lng) {
  const m = moonEcliptic(ms), q = toEquatorial(m.lon, m.lat, ms)
  return horizontal(q.ra, q.dec, ms, lat, lng).alt
}

/**
 * Şəhərdən görünmə: kölgə fazasının neçə faizində Ay üfüqdən yuxarıdadır (2 dəq addımla).
 * kind: 'full' — bütün faza görünür, 'part' — Ay faza ərzində doğur/batır, 'none' — görünmür.
 */
export function visibility(e, lat, lng) {
  const p = phases(e)
  let up = 0, n = 0
  for (let t = p.u1; t <= p.u4; t += 2 * MIN, n++) if (moonAlt(t, lat, lng) > 0) up++
  const frac = n ? up / n : 0
  const altMax = moonAlt(p.max, lat, lng)
  const totalSeen = p.u2 ? moonAlt(p.u2, lat, lng) > 0 || moonAlt(p.u3, lat, lng) > 0 : null
  return { ...p, frac, altMax, totalSeen, kind: frac >= 0.999 ? 'full' : frac > 0 ? 'part' : 'none' }
}

/** Gələcək tutulmalar (indidən sonra bitənlər) */
export const upcoming = (now = Date.now()) => LUNAR_ECLIPSES.filter(e => phases(e).u4 > now)
