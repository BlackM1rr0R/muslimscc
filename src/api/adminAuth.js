// ═══════════════════════════════════════════════════════════
// ADMIN GİRİŞİ — öz serverimiz (server/auth.js), sessiya cookie-si
//
// • POST /api/admin/login (e-poçt + şifrə) → HttpOnly cookie sessiyası
//   (__Host-mcc_admin, 30 gün). Token JS-ə HEÇ VAXT görünmür.
// • GET /api/admin/me → 200 admin | 401 daxil olunmayıb.
// • Müvəqqəti şifrə (server/scripts/admin-user.js create / set-password):
//   me → mustChangePassword:true; panel yalnız "Şifrəni dəyiş" formasını
//   göstərir, server isə digər admin API-lərini 403 (must_change) ilə bağlayır.
// • "Şifrəni unutdum": e-poçt xidməti yoxdur — şifrə serverdə
//   `admin-user.js set-password` ilə dəyişdirilir (docs/ADMIN-SECURITY.md).
// ═══════════════════════════════════════════════════════════
import { apiFetch, ApiError } from './http'

const meState = () => apiFetch('/api/admin/me', { admin: true })

/**
 * Admin vəziyyətini izlə: cb({ status, email, mustChangePassword, role, twoFactor })
 *   twoFactor: iki addımlı yoxlama açıqdırmı (server/security.js → admin_totp; köhnə server — undefined)
 *   role: panel rolu — 'editor' | 'admin' | 'superadmin' (server/users.js → admin_roles; köhnə server — 'admin')
 *   status: 'loading' | 'admin' | 'signedOut' | 'unavailable'
 * Qaytarır: dayandıran funksiya.
 */
export function watchAdmin(cb) {
  let stopped = false
  cb({ status: 'loading', email: '', mustChangePassword: false, role: '' })
  meState().then((me) => {
    if (stopped) return
    cb({ status: 'admin', email: me?.email || '', mustChangePassword: Boolean(me?.mustChangePassword), role: typeof me?.role === 'string' ? me.role : 'admin', twoFactor: typeof me?.twoFactor === 'boolean' ? me.twoFactor : undefined })
  }).catch((e) => {
    if (stopped) return
    const signedOut = e instanceof ApiError && (e.status === 401 || e.status === 403)
    cb({ status: signedOut ? 'signedOut' : 'unavailable', email: '', mustChangePassword: false, role: '' })
  })
  return () => { stopped = true }
}

/**
 * E-poçt + şifrə ilə giriş. Uğurlu: { ok:true, admin:true, mustChangePassword }.
 * 2FA açıqdırsa: { ok:true, twoFactor:true, ticket } — sessiya hələ yoxdur (verifyAdminTwoFactor).
 * Alınmasa { ok:false, code }: 'creds' | 'many' | 'net' | 'unknown'.
 */
export async function signInAdmin(email, password, lang) {
  try {
    const r = await apiFetch('/api/admin/login', { method: 'POST', admin: true, body: { email: String(email || '').trim(), password, ...(lang ? { lang } : {}) } })
    if (r && r.twoFactor) return { ok: true, twoFactor: true, ticket: r.ticket }
    return { ok: true, admin: true, mustChangePassword: Boolean(r?.mustChangePassword) }
  } catch (e) {
    if (!(e instanceof ApiError)) return { ok: false, code: 'net' }
    if (e.status === 401 || e.status === 400) return { ok: false, code: 'creds' }
    if (e.status === 429) return { ok: false, code: 'many' }
    return { ok: false, code: 'unknown' }
  }
}

/**
 * Girişin ikinci addımı: { code } və ya { backupCode }. Uğurlu: { ok:true }.
 * Alınmasa { ok:false, code }: 'code' (yanlış kod) | 'ticket' (vaxt bitdi / cəhdlər tükəndi) | 'many' | 'net' | 'unknown'
 */
export async function verifyAdminTwoFactor(ticket, { code, backupCode }, lang) {
  try {
    await apiFetch('/api/admin/2fa', { method: 'POST', admin: true, body: { ticket, ...(backupCode ? { backupCode: String(backupCode).trim() } : { code: String(code || '').replace(/\s+/g, '') }), ...(lang ? { lang } : {}) } })
    return { ok: true }
  } catch (e) {
    if (!(e instanceof ApiError)) return { ok: false, code: 'net' }
    if (e.status === 429) return { ok: false, code: 'many' }
    if (e.code === 'invalid_code') return { ok: false, code: 'code' }
    if (e.status === 401 || e.status === 400) return { ok: false, code: 'ticket' }
    return { ok: false, code: 'unknown' }
  }
}

/** Admin 2FA idarəsi (server/auth.js → /api/admin/2fa/*). Xəta — ApiError (status, code). */
export const adminTwoFactorSetup = (password) => apiFetch('/api/admin/2fa/setup', { method: 'POST', admin: true, body: { password } })
export const adminTwoFactorEnable = (code) => apiFetch('/api/admin/2fa/enable', { method: 'POST', admin: true, body: { code: String(code || '').replace(/\s+/g, '') } })
  .then((r) => (r && Array.isArray(r.backupCodes) ? r.backupCodes : []))
/** reauth: { password } | { code } | { backupCode } */
export const adminTwoFactorDisable = (reauth) => apiFetch('/api/admin/2fa/disable', { method: 'POST', admin: true, body: reauth })

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
