// ═══════════════════════════════════════════════════════════
// P3 — klient: gizli dua dostu (server/duaFriend.js) və Həcc ailə izləyicisi (server/hajjJourney.js).
// Girişli sorğular — authFetch (cookie + X-Requested-With). Canlı baxış — polling + ETag (If-None-Match → 304).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'

export { AuthError }

// ── Gizli dua dostu ──
export const getDuaFriend = () => authFetch('/api/dua-friend')
export const joinDuaFriend = ({ lang, tz }) => authFetch('/api/dua-friend/join', { method: 'POST', body: { consent: true, lang, tz } })
export const prayDuaFriend = () => authFetch('/api/dua-friend/pray', { method: 'POST', body: {} })
export const seenDuaFriend = () => authFetch('/api/dua-friend/seen', { method: 'POST', body: {} })
export const leaveDuaFriend = () => authFetch('/api/dua-friend', { method: 'DELETE' })

// Bu cihazda "qoşulub" ipucu — ümumi bildiriş (DuaFriendNotice) yalnız onda serverə soruşur
export const DUA_FRIEND_HINT = 'mcc_dua_friend'
export function setDuaFriendHint(on) {
  try { if (on) globalThis.localStorage?.setItem(DUA_FRIEND_HINT, '1'); else globalThis.localStorage?.removeItem(DUA_FRIEND_HINT) } catch { /* yaddaş bağlıdır */ }
}
export function hasDuaFriendHint() {
  try { return globalThis.localStorage?.getItem(DUA_FRIEND_HINT) === '1' } catch { return false }
}

// ── Həcc ailə izləyicisi ──
export const getHajjJourney = () => authFetch('/api/hajj-journey')
export const startHajjJourney = ({ kind, name, family }) => authFetch('/api/hajj-journey', { method: 'POST', body: { kind, name, family, consent: true } })
export const setHajjStage = (stage) => authFetch('/api/hajj-journey/stage', { method: 'PUT', body: { stage } })
export const setHajjShare = (body) => authFetch('/api/hajj-journey/share', { method: 'PUT', body })
export const createHajjLink = () => authFetch('/api/hajj-journey/link', { method: 'POST', body: {} })
export const revokeHajjLink = () => authFetch('/api/hajj-journey/link', { method: 'DELETE' })
export const stopHajjJourney = () => authFetch('/api/hajj-journey', { method: 'DELETE' })

/** ETag ilə sorğu → { notModified: true } | { data, etag }. Uğursuz statusda AuthError. */
async function tagged(path, { method = 'GET', body, etag = '', signal } = {}) {
  const headers = { Accept: 'application/json', 'X-Requested-With': 'fetch' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (etag) headers['If-None-Match'] = etag
  const res = await fetch(path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin', cache: 'no-store', signal,
  })
  if (res.status === 304) return { notModified: true }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new AuthError(res.status, data, Number(res.headers.get('Retry-After')) || 0)
  return { data, etag: res.headers.get('ETag') || '' }
}
export const pollHajjFamily = (etag, signal) => tagged('/api/hajj-journey/family', { etag, signal })
export const pollHajjLink = (token, etag, signal) => tagged('/api/hajj-journey/view', { method: 'POST', body: { token }, etag, signal })
