// ═══════════════════════════════════════════════════════════
// K mərhələsi — klient: açıq profil (server/publicProfile.js), ailə dua siyahısı (familyDua.js),
// dua divarı (duaWall.js), məscid nümayəndəsi + məscid ekranı (mosqueRep.js), həftəlik hesabat (weekly.js).
// Girişli sorğular — authFetch (cookie + X-Requested-With); admin — apiFetch({ admin: true }).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'
import { apiFetch } from './http'

export { AuthError }

// ── K1. Açıq profil ──
export const getPublicProfileSettings = () => authFetch('/api/profile/public')
export const savePublicProfile = (body, consent) => authFetch('/api/profile/public', { method: 'PUT', body: { ...body, ...(consent ? { consent: true } : {}) } })
export const deletePublicProfile = () => authFetch('/api/profile/public', { method: 'DELETE' })
export const checkHandle = (h) => authFetch(`/api/profile/handle?h=${encodeURIComponent(h)}`)
export const getPublicProfile = (handle) => authFetch(`/api/u/${encodeURIComponent(handle)}`)
export const reportProfile = (handle, reason) => authFetch(`/api/u/${encodeURIComponent(handle)}/report`, { method: 'POST', body: { reason } })
export const HANDLE_RE = /^[a-z0-9_]{3,24}$/

// ── K2. Ailə dua siyahısı ──
export const getFamilyDuas = () => authFetch('/api/family/duas')
export const postFamilyDua = (body) => authFetch('/api/family/duas', { method: 'POST', body: { body } })
export const prayFamilyDua = (id) => authFetch(`/api/family/duas/${encodeURIComponent(id)}/pray`, { method: 'POST', body: {} })
export const answerFamilyDua = (id, answered) => authFetch(`/api/family/duas/${encodeURIComponent(id)}/answered`, { method: 'POST', body: { answered } })
export const reportFamilyDua = (id) => authFetch(`/api/family/duas/${encodeURIComponent(id)}/report`, { method: 'POST', body: {} })
export const deleteFamilyDua = (id) => authFetch(`/api/family/duas/${encodeURIComponent(id)}`, { method: 'DELETE' })

// ── K3. Dua divarı ──
export const getDuaWall = ({ lang = '', before = null } = {}) => {
  const q = new URLSearchParams()
  if (lang) q.set('lang', lang)
  if (before) q.set('before', String(before))
  const s = q.toString()
  return authFetch(`/api/dua-wall${s ? `?${s}` : ''}`)
}
export const getMyDuaRequests = () => authFetch('/api/dua-wall/mine')
export const submitDuaRequest = (body) => authFetch('/api/dua-wall', { method: 'POST', body })
export const deleteDuaRequest = (id) => authFetch(`/api/dua-wall/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const prayDuaRequest = (id) => authFetch(`/api/dua-wall/${encodeURIComponent(id)}/pray`, { method: 'POST', body: {} })
export const reportDuaRequest = (id, reason) => authFetch(`/api/dua-wall/${encodeURIComponent(id)}/report`, { method: 'POST', body: { reason } })

// "Dua etdim" — bu cihazda hansı istəklərə toxunulub (server də təkrarı saymır)
const PRAYED_KEY = 'mcc_dua_wall_prayed'
const ls = () => { try { return globalThis.localStorage } catch { return null } }
export function readPrayed() {
  try { const v = JSON.parse(ls()?.getItem(PRAYED_KEY) || '[]'); return new Set(Array.isArray(v) ? v.filter(Number.isInteger) : []) } catch { return new Set() }
}
export function markPrayed(id) {
  const s = readPrayed()
  s.add(id)
  try { ls()?.setItem(PRAYED_KEY, JSON.stringify([...s].slice(-500))) } catch { /* yaddaş dolu */ }
  return s
}

// ── K4. Məscid nümayəndəsi ──
export const getMosqueRep = () => authFetch('/api/mosque-rep')
export const saveMosqueRep = (body) => authFetch('/api/mosque-rep', { method: 'PUT', body })
export const addMosqueAnnouncement = (body, expiresOn) => authFetch('/api/mosque-rep/announcements', { method: 'POST', body: { body, expiresOn } })
export const deleteMosqueAnnouncement = (id) => authFetch(`/api/mosque-rep/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' })
/** Təsdiqlənmiş nümayəndəsi olan məscidlər (axtarış nəticələri üçün, ≤60 id) → { [id]: info } */
export async function verifiedMosques(ids) {
  const list = [...new Set(ids)].filter((x) => /^[A-Za-z0-9_-]{1,64}$/.test(x)).slice(0, 60)
  if (!list.length) return {}
  const r = await fetch(`/api/mosques/verified?ids=${encodeURIComponent(list.join(','))}`, { headers: { Accept: 'application/json' } })
  if (!r.ok) return {}
  const j = await r.json().catch(() => null)
  return (j && j.mosques) || {}
}

// ── K5. Həftəlik hesabat ──
export const getWeekly = () => authFetch('/api/weekly')
export const saveWeeklyPrefs = (body, consent) => authFetch('/api/weekly/prefs', { method: 'PUT', body: { ...body, ...(consent ? { consent: true } : {}) } })
export const putWeeklyStats = (body) => authFetch('/api/weekly/stats', { method: 'PUT', body })
export const deleteWeekly = () => authFetch('/api/weekly', { method: 'DELETE' })

// ── Admin paneli: moderasiya (editor+) ──
const adm = (path, opts = {}) => apiFetch(path, { admin: true, ...opts })
export const adminDuaWall = (status = 'pending', page = 1) => adm(`/api/admin/dua-wall?status=${encodeURIComponent(status)}&page=${page}`)
export const adminDecideDua = (id, action, reason) => adm(`/api/admin/dua-wall/${encodeURIComponent(id)}`, { method: 'POST', body: { action, ...(reason ? { reason } : {}) } })
export const adminBannedWords = () => adm('/api/admin/dua-wall/banned')
export const adminAddBanned = (word) => adm('/api/admin/dua-wall/banned', { method: 'POST', body: { word } })
export const adminRemoveBanned = (word) => adm(`/api/admin/dua-wall/banned/${encodeURIComponent(word)}`, { method: 'DELETE' })
export const adminProfileReports = () => adm('/api/admin/moderation/profiles')
export const adminModerateProfile = (handle, action) => adm(`/api/admin/moderation/profiles/${encodeURIComponent(handle)}`, { method: 'POST', body: { action } })
export const adminMosques = () => adm('/api/admin/mosques')
export const adminDeleteMosque = (id) => adm(`/api/admin/mosques/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const adminDeleteMosqueAnnouncement = (id, aid) => adm(`/api/admin/mosques/${encodeURIComponent(id)}/announcements/${encodeURIComponent(aid)}`, { method: 'DELETE' })
