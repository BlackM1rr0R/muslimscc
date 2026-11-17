// ═══════════════════════════════════════════════════════════
// "Məni yoxla" hifz keçidi — klient (server/hifzTest.js)
// Sahib: girişli (yarat, siyahı, sil). Yoxlayan: girişsiz — token GÖVDƏDƏ (URL fraqmentindən oxunur).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'

export { AuthError }
const b = '/api/hifz-tests'
export const MAX_NAME = 40
export const createCheck = ({ surah, from, to, name }) => authFetch(b, { method: 'POST', body: { surah, from, to, name } })
export const listChecks = () => authFetch(b)
export const deleteCheck = (id) => authFetch(`${b}/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const openCheck = (token) => authFetch(`${b}/open`, { method: 'POST', body: { token } })
export const submitCheck = (token, marks) => authFetch(`${b}/submit`, { method: 'POST', body: { token, marks } })

/** Keçid: /hifz-test#t=<token> (fraqment serverə və nginx loguna getmir) */
export const checkLink = (origin, path, token) => `${origin}${path}#t=${token}`
export function readCheckToken(hash) {
  const m = /(?:^#|&)t=([A-Za-z0-9_-]{43})(?:&|$)/.exec(String(hash || ''))
  return m ? m[1] : null
}
