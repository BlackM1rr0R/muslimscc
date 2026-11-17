// ═══════════════════════════════════════════════════════
// Hilal müşahidələri — klient (server/sightings.js)
//   hrEnabled()                 — yalnız muslims.cc-də və ya ?sightings=1 ilə
//   hrCell(lat, lng)            — 1°-lik xana (klientdə də yuvarlaqlaşır, dəqiq yer getmir)
//   hrEvening(ms, lng)          — müşahidə axşamının tarixi (serverdəki ilə eyni qayda)
//   hrTotals(cells)             — { seen, notSeen, cells }
//   fetchSightings(date)        — GET /api/sightings?date=…
//   sendSighting({ lat, lng, seen, method }) — POST; → 'ok' | 'once' | 'error'
//   hrSentFor() / hrMarkSent(d) — bu axşam artıq göndərilibmi (localStorage, yalnız tarix)
// ═══════════════════════════════════════════════════════
export const HR_METHODS = ['eye', 'binoculars', 'telescope', 'camera']
export const HR_SENT_KEY = 'muslim_cc_hr_sent'

export function hrEnabled(loc = typeof window === 'undefined' ? null : window.location) {
  if (!loc) return false
  return /^(www\.)?muslims\.cc$/.test(loc.hostname || '') || /[?&]sightings=1\b/.test(loc.search || '')
}

export function hrCell(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat: Math.max(-90, Math.min(90, Math.round(lat))), lng: ((Math.round(lng) + 540) % 360) - 180 }
}

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)
/** Yerli günəş vaxtı ilə günortadan günortaya — həmin günün axşamı */
export const hrEvening = (ms, lng) => dayOf(ms + (Number(lng) || 0) * 240000 - 12 * 3600000)

export function hrTotals(cells) {
  let seen = 0, notSeen = 0
  for (const c of cells || []) { seen += Number(c.seen) || 0; notSeen += Number(c.notSeen) || 0 }
  return { seen, notSeen, cells: (cells || []).length }
}

export async function fetchSightings(date) {
  const r = await fetch(`/api/sightings?date=${encodeURIComponent(date)}`)
  if (!r.ok) throw new Error(String(r.status))
  const d = await r.json()
  return Array.isArray(d?.cells) ? d.cells.filter(c => Number.isFinite(c?.lat) && Number.isFinite(c?.lng)) : []
}

export async function sendSighting({ lat, lng, seen, method }) {
  const c = hrCell(lat, lng)
  if (!c || !HR_METHODS.includes(method)) return 'error'
  try {
    const r = await fetch('/api/sightings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...c, seen: !!seen, method }) })
    if (r.status === 429) return 'once'
    return r.ok ? 'ok' : 'error'
  } catch { return 'error' }
}

export function hrSentFor() {
  try { return localStorage.getItem(HR_SENT_KEY) || '' } catch { return '' }
}
export function hrMarkSent(date) {
  try { localStorage.setItem(HR_SENT_KEY, date) } catch { /* */ }
}
