// ═══════════════════════════════════════════════════════════
// "Ümmətin Canlı Xətmi" — klient (server/globalKhatm.js)
// İctimai toplu məlumat (state, stats, rounds, live SSE) — girişsiz; götür / oxudum / burax / me — hesabla
// (cookie + X-Requested-With: api/userSession → authFetch).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'
import { apiFetch } from './http'

export { AuthError }
export const KHATM_TOTAL = 604
export const LIVE_URL = '/api/khatm/live'
export const MAX_DEDICATION = 40
const base = '/api/khatm'

export const khatmState = () => apiFetch(`${base}/state`)
export const khatmStats = () => apiFetch(`${base}/stats`)
export const khatmRounds = (page = 1) => apiFetch(`${base}/rounds?page=${encodeURIComponent(page)}`)
export const khatmMe = () => authFetch(`${base}/me`)
export const khatmClaim = ({ dedication, cell } = {}) => authFetch(`${base}/claim`, { method: 'POST', body: { ...(dedication ? { dedication } : {}), ...(cell ? { cell } : {}) } })
export const khatmComplete = (page) => authFetch(`${base}/complete`, { method: 'POST', body: { page } })
export const khatmRelease = () => authFetch(`${base}/release`, { method: 'POST', body: {} })
export const deleteDedication = (id) => authFetch(`${base}/dedications/${encodeURIComponent(id)}`, { method: 'DELETE' })

/** base64 (76 bayt) → Uint8Array; səhifə p → bit p-1 */
export function decodeBits(b64) {
  const out = new Uint8Array(Math.ceil(KHATM_TOTAL / 8))
  if (typeof b64 !== 'string' || !b64) return out
  try {
    const raw = atob(b64)
    for (let i = 0; i < Math.min(raw.length, out.length); i++) out[i] = raw.charCodeAt(i) & 255
  } catch { /* pozuq */ }
  return out
}
export const hasPage = (bits, p) => ((bits[(p - 1) >> 3] >> ((p - 1) & 7)) & 1) === 1
export function withPage(bits, p) {
  const b = bits.slice()
  if (p >= 1 && p <= KHATM_TOTAL) b[(p - 1) >> 3] |= 1 << ((p - 1) & 7)
  return b
}
export function countPages(bits) { let n = 0; for (let p = 1; p <= KHATM_TOTAL; p++) if (hasPage(bits, p)) n++; return n }
