// ═══════════════════════════════════════════════════════════
// "Birlikdə Quran oxu" — klient (server/readTogether.js)
// Yaratma girişlidir (cookie); qoşulma, bilet, əməliyyatlar — iştirakçı sirri ilə (hesabsız da).
// Server → klient: EventSource (SSE). Sirr URL-ə qoyulmur: əvvəlcə POST …/ticket (birdəfəlik bilet).
// Bu cihazdakı iştirak (room → { pid, secret, invite? }) — localStorage "mcc_rt_sessions"
// (ehtiyat nüsxəyə / sinxronizasiyaya düşmür — utils/userBackup → EXCLUDE_KEYS).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError, safeStorage } from './userSession'

export { AuthError }
export const SESSIONS_KEY = 'mcc_rt_sessions'
export const MAX_NAME = 40
export const MAX_TITLE = 60

const base = '/api/read-together'
export const createRoom = ({ page, title, anyoneTurns, name }) => authFetch(`${base}/rooms`, { method: 'POST', body: { page, title, anyoneTurns, name } })
export const myRooms = () => authFetch(`${base}/mine`)
export const reclaimRoom = (id) => authFetch(`${base}/rooms/${encodeURIComponent(id)}/reclaim`, { method: 'POST', body: {} })
export const joinRoom = (invite, name) => authFetch(`${base}/join`, { method: 'POST', body: { invite, name } })
export const getTicket = (room, me) => authFetch(`${base}/${encodeURIComponent(room)}/ticket`, { method: 'POST', body: { pid: me.pid, secret: me.secret } }).then((r) => r.ticket)
export const roomAction = (room, me, body) => authFetch(`${base}/${encodeURIComponent(room)}/action`, { method: 'POST', body: { pid: me.pid, secret: me.secret, ...body } })
export const eventsUrl = (room, ticket) => `${base}/${encodeURIComponent(room)}/events?t=${encodeURIComponent(ticket)}`

// ── Bu cihazdakı iştiraklar ──
function readAll() {
  try { const v = JSON.parse(safeStorage()?.getItem(SESSIONS_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {} } catch { return {} }
}
export const loadSession = (room) => { const s = readAll()[room]; return s && typeof s.pid === 'string' && typeof s.secret === 'string' ? s : null }
export function saveSession(room, s) {
  const all = readAll()
  all[room] = { ...s, at: Date.now() }
  // köhnələr (2 gündən çox) silinir — otaqlar 24 saat boş qalanda bağlanır
  for (const [k, v] of Object.entries(all)) if (!v || Date.now() - (v.at || 0) > 2 * 86400e3) delete all[k]
  try { safeStorage()?.setItem(SESSIONS_KEY, JSON.stringify(all)) } catch { /* yaddaş bağlıdır */ }
}
export function dropSession(room) {
  const all = readAll()
  delete all[room]
  try { safeStorage()?.setItem(SESSIONS_KEY, JSON.stringify(all)) } catch { /* */ }
}

/** Dəvət keçidi: /read-together#j=<invite> (fraqment serverə və Referer-ə getmir) */
export const inviteLink = (origin, path, invite) => `${origin}${path}#j=${invite}`
export function readInvite(hash) {
  const m = /(?:^#|&)j=([A-Za-z0-9_-]{22})(?:&|$)/.exec(String(hash || ''))
  return m ? m[1] : null
}
export function readRoomParam(hash) {
  const m = /(?:^#|&)r=([a-z0-9]{10})(?:&|$)/.exec(String(hash || ''))
  return m ? m[1] : null
}
