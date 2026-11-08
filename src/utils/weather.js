// ═══════════════════════════════════════════════════════
// Hava (v5.7) — Open-Meteo (pulsuz, açarsız; api.open-meteo.com — CSP connect-src)
//
//   weatherKind({ code, wind })  → 'thunder' | 'rain' | 'snow' | 'wind' | null   (saf)
//   loadWeather(lat, lng)        → { kind, code, wind, temp, at } | null
//
// • Yalnız indiki vəziyyət (current=weather_code,wind_speed_10m,temperature_2m).
// • 30 dəqiqə sessionStorage keşi (koordinata görə) — hər səhifədə sorğu getmir.
// • Test üçün: ?weather=rain|snow|thunder|wind — sorğu getmir.
// • WMO kodları: 51–67, 80–82 yağış; 71–77, 85–86 qar; 95–99 ildırım.
// ═══════════════════════════════════════════════════════

const KEY = 'qm_weather_v1'
const TTL = 30 * 60 * 1000
const WIND_KMH = 35

export function weatherKind({ code, wind } = {}) {
  const c = Number(code)
  if (c >= 95 && c <= 99) return 'thunder'
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain'
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow'
  if (Number(wind) >= WIND_KMH) return 'wind'
  return null
}

export async function loadWeather(lat, lng) {
  if (typeof window === 'undefined' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  try {
    const forced = new URLSearchParams(window.location.search).get('weather')
    if (['rain', 'snow', 'thunder', 'wind'].includes(forced)) return { kind: forced, code: 0, wind: 0, temp: null, at: Date.now() }
  } catch { /* */ }
  const pos = `${lat.toFixed(2)},${lng.toFixed(2)}`
  try {
    const c = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (c && c.pos === pos && Date.now() - c.at < TTL) return c
  } catch { /* */ }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=weather_code,wind_speed_10m,temperature_2m&wind_speed_unit=kmh`
    const ctrl = new AbortController()
    const tm = setTimeout(() => ctrl.abort(), 8000)
    const r = await fetch(url, { signal: ctrl.signal })
    clearTimeout(tm)
    if (!r.ok) return null
    const j = await r.json()
    const cur = j?.current || {}
    const out = { pos, code: cur.weather_code, wind: cur.wind_speed_10m, temp: cur.temperature_2m, at: Date.now() }
    out.kind = weatherKind(out)
    try { sessionStorage.setItem(KEY, JSON.stringify(out)) } catch { /* */ }
    return out
  } catch { return null }
}
