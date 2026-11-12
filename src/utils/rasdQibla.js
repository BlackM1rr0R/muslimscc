// ═══════════════════════════════════════════════════════
// Rəsdül-qiblə (v6.3) — components/RasdQibla.jsx (/qibla)
//
// Günəş ildə iki dəfə Kəbənin düz üstündən keçir (meyli Kəbənin eninə bərabər olanda,
// Məkkədə günorta): o an Günəşi görən hər yerdə dik çubuğun kölgəsi QİBLƏNİN ƏKSİNƏ düşür
// (üz Günəşə — qibləyə). Kəbənin əks nöqtəsində (antipod) Günəş başın üstündə olanda isə
// kölgə QİBLƏYƏ tərəf düşür. Hamısı astronomik hesabdır (utils/lunar.js — Meeus, ~1′).
// tests/unit/rasd-qibla.test.js
// ═══════════════════════════════════════════════════════
import { sunEcliptic, toEquatorial, horizontal, gmst } from './lunar'

export const KAABA = { lat: 21.4225, lng: 39.8262 }
export const ANTIPODE = { lat: -KAABA.lat, lng: KAABA.lng - 180 }
const RAD = Math.PI / 180
const DAY = 86400000
const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180

export function sunEq(ms) { const s = sunEcliptic(ms); return toEquatorial(s.lon, 0, ms) }
/** Günəşin üfüqi koordinatları (havasız): { alt, az } */
export function sunHorizontal(ms, lat, lng) { const e = sunEq(ms); return horizontal(e.ra, e.dec, ms, lat, lng) }

/** Yerin həmin UTC günündəki həqiqi günortası (Günəş meridianda) — epoch ms */
export function solarNoon(dayStart, lng) {
  let t = dayStart + (12 - lng / 15) * 3600000
  for (let k = 0; k < 3; k++) {
    const e = sunEq(t)
    const H = wrap180(gmst(t) + lng - e.ra)
    t -= (H / 360.98564736629) * DAY
  }
  return t
}

/**
 * Günəşin nöqtənin (Kəbə və ya antipod) düz üstündən keçdiyi anlar, [from, from + days) aralığında.
 * Hər gün üçün həmin yerin günortasında hündürlük hesablanır; 89.4°-dən yuxarı yerli maksimumlar.
 * → [{ ms, alt }]
 */
export function zenithPassages(place, from, days = 400) {
  const d0 = Math.floor(from / DAY) * DAY
  const rows = []
  for (let i = -1; i <= days + 1; i++) {
    const t = solarNoon(d0 + i * DAY, place.lng)
    rows.push({ ms: t, alt: sunHorizontal(t, place.lat, place.lng).alt })
  }
  const out = []
  for (let i = 1; i < rows.length - 1; i++) {
    const r = rows[i]
    if (r.alt > 89.4 && r.alt >= rows[i - 1].alt && r.alt > rows[i + 1].alt && r.ms >= from) out.push(r)
  }
  return out
}

/** Növbəti hadisələr (Kəbə: kind 'over' — kölgə qiblənin əksinə; antipod: 'under' — kölgə qibləyə) */
export function rasdEvents(now = Date.now(), days = 400) {
  return [
    ...zenithPassages(KAABA, now, days).map(e => ({ ...e, kind: 'over' })),
    ...zenithPassages(ANTIPODE, now, days).map(e => ({ ...e, kind: 'under' })),
  ].sort((a, b) => a.ms - b.ms)
}

/** A → B böyük dairə istiqaməti (şimaldan saat istiqamətində, °) */
export function bearing(a, b) {
  const φ1 = a.lat * RAD, φ2 = b.lat * RAD, Δ = (b.lng - a.lng) * RAD
  const y = Math.sin(Δ) * Math.cos(φ2), x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δ)
  return ((Math.atan2(y, x) / RAD) + 360) % 360
}

/** Kölgənin istiqaməti (°) və nisbi uzunluğu (çubuğun hündürlüyünə görə); Günəş batıbsa null */
export function shadowAt(ms, lat, lng) {
  const s = sunHorizontal(ms, lat, lng)
  if (s.alt <= 0.5) return null
  return { dir: (s.az + 180) % 360, len: 1 / Math.tan(s.alt * RAD), alt: s.alt, az: s.az }
}
