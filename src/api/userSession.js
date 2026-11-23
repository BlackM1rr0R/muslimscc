// ═══════════════════════════════════════════════════════════
// Saytın İSTİFADƏÇİ hesabı — yüngül sessiya modulu (başlıq düyməsi bunu idxal edir)
// Server: server/users.js · sənəd: docs/USER-ACCOUNTS.md
//
// • Sessiya cookie-si (__Host-mcc_user) HttpOnly-dir — JS onu görmür. Ona görə
//   localStorage-da kiçik İPUCU saxlanır: "mcc_logged_in" = '1' (giriş/qeydiyyatdan
//   sonra yazılır, çıxışda və ya /me → 401 olanda silinir). İpucu yoxdursa (anonim
//   ziyarətçilərin demək olar hamısı) /api/auth/me ÜMUMİYYƏTLƏ çağırılmır.
// • İpucu sirr deyil: yalnız "bəlkə daxil olub" deməkdir; həqiqət /me cavabıdır.
// • Ağır hissə (formalar, passkey, Google, hesab idarəsi) — src/api/userAuth.js,
//   yalnız /login, /signup, /account səhifələrində tənbəl yüklənir.
// ═══════════════════════════════════════════════════════════
import { useSyncExternalStore } from 'react'

export const HINT_KEY = 'mcc_logged_in'

/** localStorage — özəl rejimdə / bloklanmış yaddaşda müraciətin özü xəta atır. */
export const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

export function hasLoginHint() {
  try { return safeStorage()?.getItem(HINT_KEY) === '1' } catch { return false }
}

function setLoginHint(on) {
  try {
    const s = safeStorage()
    if (!s) return
    if (on) s.setItem(HINT_KEY, '1')
    else s.removeItem(HINT_KEY)
  } catch { /* yaddaş bağlıdır və ya doludur */ }
}

/**
 * Bu cihazın sinxronizasiyası hesaba bağlıdırmı (utils/userSync → muslim_cc_sync.acct)?
 * Çıxışda "məlumat bu cihazda qalsın?" dialoqu yalnız bu halda göstərilir. Yüngül — başlıq üçün.
 */
export function syncLinkedHere() {
  try { return Boolean(JSON.parse(safeStorage()?.getItem('muslim_cc_sync') || 'null')?.acct) } catch { return false }
}

/** Server səhvi: status, code ('invalid_credentials', 'weak_password', …), retryAfter (san). */
export class AuthError extends Error {
  constructor(status, body, retryAfter = 0) {
    super((body && body.error) || `HTTP ${status}`)
    this.name = 'AuthError'
    this.status = status
    this.code = (body && typeof body.code === 'string' && body.code) || ''
    this.body = body || {}
    this.retryAfter = retryAfter
  }
}

/**
 * /api/auth/* və /api/admin/* üçün JSON sorğusu: həmişə eyni origin cookie-si,
 * CSRF başlığı (X-Requested-With) və JSON. Uğursuz statusda AuthError atır;
 * şəbəkə xətası — TypeError (fetch-in özü).
 */
export async function authFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json', 'X-Requested-With': 'fetch' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  let data = null
  if (res.status !== 204) data = await res.json().catch(() => null)
  if (!res.ok) {
    const ra = Number(res.headers.get('Retry-After')) || 0
    throw new AuthError(res.status, data, ra)
  }
  return data
}

// ── Cari istifadəçi (modul səviyyəsində tək mənbə; Provider lazım deyil) ──
//   status: 'anon'    — daxil olmayıb (ipucu yoxdur və ya /me → 401)
//           'unknown' — ipucu var, /me hələ yoxlanmayıb (başlıq ümumi ikon göstərir)
//           'user'    — user obyekti var
let state = null
const subs = new Set()
const initial = () => ({ status: hasLoginHint() ? 'unknown' : 'anon', user: null })
const getState = () => (state || (state = initial()))
const ANON = { status: 'anon', user: null }

function emit(next) {
  state = next
  for (const fn of subs) fn()
}

export function getAuthState() { return getState() }

export function subscribeAuth(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

/** Giriş/qeydiyyat/passkey/Google cavabındakı user (və ya null — çıxış). */
export function setCurrentUser(user) {
  setLoginHint(Boolean(user))
  emit(user ? { status: 'user', user } : { status: 'anon', user: null })
}

let mePromise = null
/**
 * GET /api/auth/me — cari istifadəçini yenilə. 401 → anonim (ipucu silinir).
 * Şəbəkə xətası vəziyyəti dəyişmir (oflayn ziyarətçi "çıxmış" görünməsin).
 * Eyni anda bir neçə çağırış tək sorğu ilə gedir.
 */
export function refreshMe() {
  if (mePromise) return mePromise
  // Saytın aktiv dili (server/welcome.js saxlayır — xoş gəldin məktubu həmin dildə gedir)
  let lang = ''
  try { lang = globalThis.document?.documentElement?.lang || '' } catch { /* prerender */ }
  mePromise = authFetch('/api/auth/me' + (/^[a-z]{2,3}$/.test(lang) ? `?lang=${lang}` : ''))
    .then((u) => { setCurrentUser(u); return u })
    .catch((e) => {
      if (e instanceof AuthError && e.status === 401) { setCurrentUser(null); return null }
      throw e
    })
    .finally(() => { mePromise = null })
  return mePromise
}

/** Çıxış: server sessiyanı silir; klientdə ipucu da silinir (şəbəkə alınmasa belə). */
export async function logoutUser() {
  try { await authFetch('/api/auth/logout', { method: 'POST' }) } finally { setCurrentUser(null) }
}

/** React: cari { status, user }. Prerender/server — həmişə anonim. */
export function useAuthUser() {
  return useSyncExternalStore(subscribeAuth, getAuthState, () => ANON)
}

/** Başlıqdakı avatarın hərfi: ad, yoxdursa e-poçtun ilk hərfi. */
export function initialOf(user) {
  const s = String(user?.displayName || user?.email || '').trim()
  const ch = [...s][0] || ''
  return ch.toLocaleUpperCase()
}
