// ═══════════════════════════════════════════════════════════
// "Əmanət qutusu" — klient (server/trustBox.js). Serverə YALNIZ { salt, blob, linkHash?, ifVersion? } gedir:
// şifrələmə brauzerdədir (utils/trustBoxCrypto). Girişli sorğular — authFetch (cookie + X-Requested-With).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'

export { AuthError }

export const getTrustBox = () => authFetch('/api/trust-box')

/** sealed: { salt, blob } — sealBox()-un nəticəsi; linkHash: undefined (dəyişmir) | null (ləğv) | hex64 */
export function saveTrustBox({ salt, blob }, { linkHash, ifVersion } = {}) {
  const body = { salt, blob }
  if (linkHash !== undefined) body.linkHash = linkHash
  if (Number.isInteger(ifVersion)) body.ifVersion = ifVersion
  return authFetch('/api/trust-box', { method: 'PUT', body })
}
export const revokeTrustLink = () => authFetch('/api/trust-box/link', { method: 'DELETE' })
export const deleteTrustBox = () => authFetch('/api/trust-box', { method: 'DELETE' })

/** Girişsiz: keçid tokeni → { salt, blob, updatedAt } (token gövdədə — URL-də/loqda yox) */
export async function openTrustLink(token) {
  const res = await fetch('/api/trust-box/open', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: JSON.stringify({ token }), credentials: 'omit', cache: 'no-store',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new AuthError(res.status, data, Number(res.headers.get('Retry-After')) || 0)
  return data
}
