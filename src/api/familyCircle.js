// ═══════════════════════════════════════════════════════════
// Ailə dairəsi — klient (server/family.js). Hamısı girişli (cookie + X-Requested-With).
// Serverə yalnız istifadəçinin seçdiyi XÜLASƏ rəqəmləri gedir (utils/familyStats).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'

export { AuthError }
const b = '/api/family'
export const getFamily = () => authFetch(b)
export const createCircle = () => authFetch(b, { method: 'POST', body: {} })
export const leaveOrDelete = () => authFetch(b, { method: 'DELETE' })
export const createInvite = () => authFetch(`${b}/invites`, { method: 'POST', body: {} })
export const revokeInvite = (id) => authFetch(`${b}/invites/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const previewJoin = (token) => authFetch(`${b}/join/preview`, { method: 'POST', body: { token } })
export const joinCircle = (token) => authFetch(`${b}/join`, { method: 'POST', body: { token } })
export const removeMember = (id) => authFetch(`${b}/members/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const putShare = (payload, consent) => authFetch(`${b}/share`, { method: 'PUT', body: { ...payload, ...(consent ? { consent: true } : {}) } })
export const stopShare = () => authFetch(`${b}/share`, { method: 'DELETE' })
export const sendCard = (to, template, n) => authFetch(`${b}/cards`, { method: 'POST', body: { to, template, ...(n ? { n } : {}) } })
export const markSeen = (ids) => authFetch(`${b}/cards/seen`, { method: 'POST', body: { ids } })
export const deleteCard = (id) => authFetch(`${b}/cards/${encodeURIComponent(id)}`, { method: 'DELETE' })

/** Dəvət keçidi: /account#family=<token> */
export const familyLink = (origin, accountPath, token) => `${origin}${accountPath}#family=${token}`
export function readFamilyToken(hash) {
  const m = /(?:^#|&)family=([A-Za-z0-9_-]{43})(?:&|$)/.exec(String(hash || ''))
  return m ? m[1] : null
}
