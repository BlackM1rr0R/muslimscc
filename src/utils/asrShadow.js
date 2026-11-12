// Əsr vaxtı və kölgə (components/prayer/AsrShadow.jsx, v6.4) — saf hesab (tests/unit/asr-shadow.test.js)
//
// Cəbrail hədisi (Əbu Davud 393, Tirmizi 149; əl-Albani: həsən səhih): birinci gün əsr
// "hər şeyin kölgəsi özü qədər" olanda, ikinci gün "iki misli" olanda qılındı.
// Hesab qaydası (namaz vaxtı hesablayıcılarında ümumi): kölgə = günorta kölgəsi + k × boy;
// k = 1 (Şafii, Maliki, Hənbəli — saytın cədvəli belədir), k = 2 (Hənəfi).
// Günəşin yeri — Meeus (utils/lunar.js → rasdQibla.js), refraksiyasız hündürlük.
import { sunHorizontal, solarNoon } from './rasdQibla'

const RAD = Math.PI / 180
const H = 3600000

export const altAt = (ms, lat, lng) => sunHorizontal(ms, lat, lng).alt

/** Kölgənin uzunluğu (çubuğun boyu = 1); Günəş üfüqdən aşağıdadırsa null */
export function shadowLen(ms, lat, lng) {
  const a = altAt(ms, lat, lng)
  return a > 0.3 ? 1 / Math.tan(a * RAD) : null
}

/** Kölgə vektoru (şimal yuxarı, şərq sağda; SVG: y aşağı) — { x, y, len, az, alt } */
export function shadowVec(ms, lat, lng) {
  const s = sunHorizontal(ms, lat, lng)
  if (s.alt <= 0.3) return null
  const len = 1 / Math.tan(s.alt * RAD), dir = (s.az + 180) * RAD
  return { x: len * Math.sin(dir), y: -len * Math.cos(dir), len, az: s.az, alt: s.alt }
}

// [t1, t2] aralığında hündürlüyün `target`-ə bərabər olduğu an (aralıqda monoton)
function solve(t1, t2, lat, lng, target) {
  let a1 = altAt(t1, lat, lng) - target, a2 = altAt(t2, lat, lng) - target
  if (a1 * a2 > 0) return null
  for (let i = 0; i < 40; i++) {
    const m = (t1 + t2) / 2, am = altAt(m, lat, lng) - target
    if (am * a1 <= 0) { t2 = m; a2 = am } else { t1 = m; a1 = am }
  }
  return Math.round((t1 + t2) / 2)
}

/** UTC günün başlanğıcı (ms) — həmin şəhərin yerli tarixinə görə */
export function localDayStart(ms, tz) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(ms)).map(x => [x.type, x.value]))
    return Date.UTC(+p.year, +p.month - 1, +p.day)
  } catch { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) }
}

/**
 * Günün əsas anları: günəşin doğuşu/batışı (−0.833°), həqiqi günorta, günorta kölgəsi L0,
 * əsr 1× (kölgə = L0 + 1) və 2× (L0 + 2). Qütb günü/gecəsində uyğun sahələr null.
 */
export function asrDay(dayStart, lat, lng) {
  const noon = solarNoon(dayStart, lng)
  const altNoon = altAt(noon, lat, lng)
  if (altNoon <= 0.3) return { noon, altNoon, L0: null, asr1: null, asr2: null, sunrise: null, sunset: null }
  const L0 = 1 / Math.tan(altNoon * RAD)
  const target = (k) => Math.atan(1 / (L0 + k)) / RAD
  return {
    noon, altNoon, L0,
    asr1: solve(noon, noon + 12 * H, lat, lng, target(1)),
    asr2: solve(noon, noon + 12 * H, lat, lng, target(2)),
    sunrise: solve(noon - 12 * H, noon, lat, lng, -0.833),
    sunset: solve(noon, noon + 12 * H, lat, lng, -0.833),
  }
}

/** Kölgə ucunun gün boyu izi (kölgə ≤ maxLen olan anlar), addım — dəqiqə */
export function tipPath(day, lat, lng, maxLen = 4.5, stepMin = 6) {
  if (!day.sunrise || !day.sunset) return []
  const out = []
  for (let t = day.sunrise; t <= day.sunset; t += stepMin * 60000) {
    const v = shadowVec(t, lat, lng)
    if (v && v.len <= maxLen) out.push({ t, x: v.x, y: v.y })
  }
  return out
}
