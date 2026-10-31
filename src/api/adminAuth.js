// ═══════════════════════════════════════════════════════════
// ADMIN GİRİŞİ — öz serverimiz (server/auth.js), Firebase Auth-suz
//
// • POST /api/admin/login (e-poçt + şifrə) → HttpOnly cookie sessiyası
//   (__Host-mcc_admin, 30 gün). Token JS-ə HEÇ VAXT görünmür.
// • GET /api/admin/me → 200 admin | 401 daxil olunmayıb.
// • Müvəqqəti şifrə (server/scripts/admin-user.js create / set-password):
//   me → mustChangePassword:true; panel yalnız "Şifrəni dəyiş" formasını
//   göstərir, server isə digər admin API-lərini 403 (must_change) ilə bağlayır.
// • "Şifrəni unutdum": e-poçt xidməti yoxdur — şifrə serverdə
//   `admin-user.js set-password` ilə dəyişdirilir (docs/FIREBASE-EXIT.md).
// ═══════════════════════════════════════════════════════════
import { apiFetch, ApiError } from './http'

const meState = () => apiFetch('/api/admin/me', { admin: true })

/**
 * Admin vəziyyətini izlə: cb({ status, email, mustChangePassword })
 *   status: 'loading' | 'admin' | 'signedOut' | 'unavailable'
 * Qaytarır: dayandıran funksiya. (İmza köhnə src/firebase/auth.js ilə eynidir.)
 */
export function watchAdmin(cb) {
  let stopped = false
  cb({ status: 'loading', email: '', mustChangePassword: false })
  meState().then((me) => {
    if (stopped) return
    cb({ status: 'admin', email: me?.email || '', mustChangePassword: Boolean(me?.mustChangePassword) })
  }).catch((e) => {
    if (stopped) return
    const signedOut = e instanceof ApiError && (e.status === 401 || e.status === 403)
    cb({ status: signedOut ? 'signedOut' : 'unavailable', email: '', mustChangePassword: false })
  })
  return () => { stopped = true }
}

/**
 * E-poçt + şifrə ilə giriş. Uğurlu: { ok:true, admin:true, mustChangePassword }.
 * Alınmasa { ok:false, code }: 'creds' | 'many' | 'net' | 'unknown'.
 */
export async function signInAdmin(email, password) {
  try {
    const r = await apiFetch('/api/admin/login', { method: 'POST', admin: true, body: { email: String(email || '').trim(), password } })
    return { ok: true, admin: true, mustChangePassword: Boolean(r?.mustChangePassword) }
  } catch (e) {
    if (!(e instanceof ApiError)) return { ok: false, code: 'net' }
    if (e.status === 401 || e.status === 400) return { ok: false, code: 'creds' }
    if (e.status === 429) return { ok: false, code: 'many' }
    return { ok: false, code: 'unknown' }
  }
}

export async function signOutAdmin() {
  await apiFetch('/api/admin/logout', { method: 'POST', admin: true }).catch(() => {})
}

/**
 * Şifrəni dəyiş. Uğurlu: { ok:true }. Alınmasa { ok:false, code }:
 *   'wrong' (cari şifrə səhv) | 'weak' (qısa) | 'same' | 'many' | 'session' | 'net' | 'unknown'
 */
export async function changeAdminPassword(currentPassword, newPassword) {
  try {
    await apiFetch('/api/admin/password', { method: 'POST', admin: true, body: { currentPassword, newPassword } })
    return { ok: true }
  } catch (e) {
    if (!(e instanceof ApiError)) return { ok: false, code: 'net' }
    if (e.code === 'wrong' || e.code === 'weak' || e.code === 'same') return { ok: false, code: e.code }
    if (e.status === 429) return { ok: false, code: 'many' }
    if (e.status === 401 || e.status === 403) return { ok: false, code: 'session' }
    return { ok: false, code: 'unknown' }
  }
}

/** Serverin tələb etdiyi minimum şifrə uzunluğu (server/auth.js → MIN_PASSWORD). */
export const MIN_ADMIN_PASSWORD = 12
