// ═══════════════════════════════════════════════════════
// roadTrip — avtomobil səfərində namaz vaxtları (components/prayer/RoadTripPrayer.jsx) — saf hesab
//
// Model: marşrutlaşdırma xidməti YOXDUR (CSP connect-src-də router yoxdur, yeni xarici host əlavə olunmur).
// Yol — başlanğıcdan təyinata böyük dairə (utils/flightPrayer → greatCircle), sürət sabit.
// Məsafə: istifadəçi naviqatordakı yol məsafəsini yazıbsa — o, yoxdursa düz xətt (həmişə real yoldan qısadır).
// Müddət = məsafə / orta sürət (+ istəyə görə dayanacaqların ümumi müddəti — bərabər paylanmış sayılır).
// Namaz anları utils/flightPrayer → flightEvents ilə — saytın namaz hesabının EYNİ tərifləri
// (utils/prayCalc → CALC_METHODS; əsr — istifadəçinin məzhəb seçimi, utils/madhab).
// Hər hadisə üçün: başlanğıcdan təxmini km (yol məsafəsi üzrə nisbət), ən yaxın böyük şəhər (≤ 300 km).
// tests/unit/roadTrip.test.js
// ═══════════════════════════════════════════════════════
import { flightEvents, distanceKm } from './flightPrayer'
import { nearestCity } from './prayerLocation'
import { CALC_METHODS } from './prayCalc'

const MIN = 60000
export const SPEED_MIN = 10
export const SPEED_MAX = 200
export const DEFAULT_SPEED = 80
export const MAX_TRIP_MIN = 72 * 60
export const NEAR_KM = 300

/** Mətn → müsbət ədəd (vergül də olar); boş və ya yararsız → null */
export function parseNum(s) {
  const t = String(s ?? '').trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Səfərin parametrləri → { ok, error?, straightKm, km, durMin, arriveMs }
 * error: 'speed' | 'road' | 'long' | 'same'
 */
export function planTrip({ from, to, depMs, speedKmh = DEFAULT_SPEED, roadKm = null, stopMin = 0 }) {
  const straightKm = distanceKm(from, to)
  if (straightKm < 1) return { ok: false, error: 'same', straightKm }
  if (!(speedKmh >= SPEED_MIN && speedKmh <= SPEED_MAX)) return { ok: false, error: 'speed', straightKm }
  // Yol məsafəsi düz xətdən qısa ola bilməz (5% yuvarlaqlaşdırma payı)
  if (roadKm != null && roadKm < straightKm * 0.95) return { ok: false, error: 'road', straightKm }
  const km = roadKm ?? straightKm
  const durMin = Math.round((km / speedKmh) * 60 + Math.max(0, stopMin || 0))
  if (durMin > MAX_TRIP_MIN) return { ok: false, error: 'long', straightKm }
  return { ok: true, straightKm, km, durMin: Math.max(1, durMin), arriveMs: depMs + Math.max(1, durMin) * MIN }
}

/** Səfər boyu namaz anları: flightEvents + km və ən yaxın şəhər */
export function tripEvents({ from, to, depMs, durMin, km, method = CALC_METHODS.abubakr, asrFactor }) {
  const stepMin = durMin > 24 * 60 ? 2 : 1
  return flightEvents({ from, to, depMs, durMin, method, asrFactor, stepMin }).map(e => {
    const n = nearestCity(e.lat, e.lng)
    return { ...e, km: Math.round(e.f * km), near: n && n.km <= NEAR_KM ? { city: n.city, km: n.km } : null }
  })
}

/**
 * Verilmiş yerdə və anda hansı vaxt gedir: son hadisə (sübh, günəşin çıxması, zöhr, əsr, məğrib, işa).
 * Yerində duran "səfər" kimi 26 saat geriyə baxılır. Yoxdursa (qütb gecəsi və s.) — null.
 */
export function periodAt(place, ms, method = CALC_METHODS.abubakr, asrFactor) {
  const back = 26 * 60
  const ev = flightEvents({ from: place, to: place, depMs: ms - back * MIN, durMin: back, method, asrFactor, stepMin: 2 })
  let last = null
  for (const e of ev) if (e.ms <= ms) last = e
  return last ? { kind: last.kind, ms: last.ms } : null
}

/** Zaman xəttində yer (0..1) */
export const fracOf = (ms, depMs, durMin) => Math.max(0, Math.min(1, (ms - depMs) / (durMin * MIN)))
