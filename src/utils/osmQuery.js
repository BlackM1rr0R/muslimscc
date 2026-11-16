// ═══════════════════════════════════════════════════════
// OpenStreetMap Overpass — ortaq sorğu (məscid axtarışı, halal yerlər)
// Əsas server cavab verməsə (yüklənmə, 406/429) ehtiyat güzgü.
// ═══════════════════════════════════════════════════════
export const OVERPASS_URLS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
const TIMEOUT_MS = 15000

/** Sorğunu növbə ilə serverlərə göndər; ilk uğurlu JSON cavabı qaytar. */
export async function overpass(query, { signal } = {}) {
  let lastErr = null
  for (const url of OVERPASS_URLS) {
    const ctrl = new AbortController()
    const onAbort = () => ctrl.abort()
    signal?.addEventListener('abort', onAbort)
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${url}?data=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      lastErr = e
      if (signal?.aborted) break
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  }
  throw lastErr || new Error('overpass')
}

/** İki nöqtə arası məsafə (km), haversine */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)

/** Elementin koordinatı (node: lat/lon; way/relation: "out center") */
export const elementPoint = (el) => ({ lat: el.lat ?? el.center?.lat, lon: el.lon ?? el.center?.lon })

/** OSM obyektinin səhifəsi */
export const osmUrl = (el) => `https://www.openstreetmap.org/${({ n: 'node', w: 'way', r: 'relation' })[String(el.type || 'n')[0]] || 'node'}/${el.id}`
