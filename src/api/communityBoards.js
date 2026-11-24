// ═══════════════════════════════════════════════════════════
// İcma lövhələri — klient: namaz otaqları (server/prayerRooms.js), cənazə elanı (server/janaza.js),
// məscid könüllüləri (server/volunteers.js). Girişli və CSRF tələb edən sorğular — authFetch
// (cookie + X-Requested-With: fetch); admin paneli — apiFetch({ admin: true }).
// ═══════════════════════════════════════════════════════════
import { authFetch } from './userSession'
import { apiFetch } from './http'

const enc = encodeURIComponent
const qs = (o) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v) q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}

// ── Namaz otaqları ──
export const PRAYER_ROOM_TYPES = ['airport', 'mall', 'university', 'hospital', 'office', 'station', 'other']
export const getPrayerRooms = ({ city = '', type = '' } = {}) => authFetch(`/api/prayer-rooms${qs({ city, type })}`)
export const getMyPrayerRooms = () => authFetch('/api/prayer-rooms/mine')
export const submitPrayerRoom = (body) => authFetch('/api/prayer-rooms', { method: 'POST', body })
export const deletePrayerRoom = (id) => authFetch(`/api/prayer-rooms/${enc(id)}`, { method: 'DELETE' })
export const reportPrayerRoom = (id, kind, note = '') => authFetch(`/api/prayer-rooms/${enc(id)}/report`, { method: 'POST', body: { kind, note } })

// ── Cənazə elanı ── (gizli keçid: /janaza#n=<token> — token yalnız POST gövdəsində serverə gedir)
export const JANAZA_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
/** '#n=<token>' → token | null */
export const parseJanazaHash = (h) => {
  const m = /(?:^#|&)n=([A-Za-z0-9_-]{43})(?:&|$)/.exec(String(h || ''))
  return m ? m[1] : null
}
export const getPublicJanaza = () => authFetch('/api/janaza/public')
export const viewJanaza = (token) => authFetch('/api/janaza/view', { method: 'POST', body: { token } })
export const janazaDua = (ref) => authFetch('/api/janaza/dua', { method: 'POST', body: typeof ref === 'string' ? { token: ref } : { id: ref } })
export const getMyJanaza = () => authFetch('/api/janaza/mine')
export const createJanaza = (body) => authFetch('/api/janaza', { method: 'POST', body: { ...body, consent: true } })
export const newJanazaLink = (id) => authFetch(`/api/janaza/${enc(id)}/link`, { method: 'POST', body: {} })
export const setJanazaPublic = (id, value) => authFetch(`/api/janaza/${enc(id)}/public`, { method: 'PUT', body: { public: value } })
export const deleteJanaza = (id) => authFetch(`/api/janaza/${enc(id)}`, { method: 'DELETE' })
export const reportJanaza = (id, reason) => authFetch(`/api/janaza/${enc(id)}/report`, { method: 'POST', body: { reason } })

// "Dua etdim" — bu cihazda hansı elanlara toxunulub (server də təkrarı saymır). Açar: 'id:<n>' və ya token-in ilk 12 simvolu
const JANAZA_DUA_KEY = 'mcc_janaza_dua'
const ls = () => { try { return globalThis.localStorage } catch { return null } }
export function readJanazaDuas() {
  try { const v = JSON.parse(ls()?.getItem(JANAZA_DUA_KEY) || '[]'); return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []) } catch { return new Set() }
}
export function markJanazaDua(key) {
  const s = readJanazaDuas()
  s.add(key)
  try { ls()?.setItem(JANAZA_DUA_KEY, JSON.stringify([...s].slice(-200))) } catch { /* yaddaş dolu */ }
  return s
}
export const janazaDuaKey = (ref) => (typeof ref === 'string' ? `t:${ref.slice(0, 12)}` : `id:${ref}`)

// ── Məscid könüllüləri ──
export const getVolunteerNeeds = (mosque = '') => authFetch(`/api/volunteers${qs({ mosque })}`)
export const getMyVolunteering = () => authFetch('/api/volunteers/mine')
export const getVolunteerManage = () => authFetch('/api/volunteers/manage')
export const createVolunteerNeed = (body) => authFetch('/api/volunteers', { method: 'POST', body })
export const deleteVolunteerNeed = (id) => authFetch(`/api/volunteers/${enc(id)}`, { method: 'DELETE' })
export const volunteerSignup = (id, body = {}) => authFetch(`/api/volunteers/${enc(id)}/signup`, { method: 'POST', body })
export const volunteerCancel = (id) => authFetch(`/api/volunteers/${enc(id)}/signup`, { method: 'DELETE' })

// ── Admin paneli (editor+) ──
const adm = (path, opts = {}) => apiFetch(path, { admin: true, ...opts })
export const adminPrayerRooms = (status = 'pending') => adm(`/api/admin/prayer-rooms?status=${enc(status)}`)
export const adminDecidePrayerRoom = (id, action, reason) => adm(`/api/admin/prayer-rooms/${enc(id)}`, { method: 'POST', body: { action, ...(reason ? { reason } : {}) } })
export const adminJanaza = (status = 'pending') => adm(`/api/admin/janaza?status=${enc(status)}`)
export const adminDecideJanaza = (id, action, reason) => adm(`/api/admin/janaza/${enc(id)}`, { method: 'POST', body: { action, ...(reason ? { reason } : {}) } })
export const adminVolunteers = () => adm('/api/admin/volunteers')
export const adminDeleteVolunteerNeed = (id) => adm(`/api/admin/volunteers/${enc(id)}`, { method: 'DELETE' })
