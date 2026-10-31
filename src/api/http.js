// ═══════════════════════════════════════════════════════════
// Öz serverimizə (server/server.js) sorğular — Firebase-in əvəzi
// (docs/FIREBASE-EXIT.md, 2-ci mərhələ).
//
// • Ünvan nisbidir (/api/...): saytda nginx /api-ni API konteynerinə ötürür,
//   lokal dev-də isə vite.config.js-dəki proksi. Admin cookie-si
//   (__Host-mcc_admin, SameSite=Strict) yalnız EYNİ origin-də işləyir.
// • Admin yazıları: credentials 'include' + "X-Requested-With: fetch" —
//   server/auth.js-dəki CSRF qaydası bu başlığı tələb edir.
// ═══════════════════════════════════════════════════════════

export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.error) || `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = (body && body.code) || ''
    this.body = body || {}
  }
}

/**
 * JSON sorğusu. opts.admin — cookie + CSRF başlığı; opts.body — obyekt (JSON-a çevrilir).
 * Uğursuz statusda ApiError atır (status, code). Şəbəkə xətası — TypeError.
 */
export async function apiFetch(path, { method = 'GET', body, admin = false, headers = {}, signal } = {}) {
  const h = { Accept: 'application/json', ...headers }
  if (body !== undefined) h['Content-Type'] = 'application/json'
  if (admin) h['X-Requested-With'] = 'fetch'
  const res = await fetch(path, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: admin ? 'include' : 'same-origin',
    cache: admin ? 'no-store' : 'default',
    signal,
  })
  let data = null
  if (res.status !== 204 && res.status !== 304) data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}
