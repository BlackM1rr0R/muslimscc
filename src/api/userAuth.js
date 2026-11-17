// ═══════════════════════════════════════════════════════════
// İstifadəçi hesabı — bütün endpoint-lər və saf köməkçilər (server/users.js,
// docs/USER-ACCOUNTS.md). YALNIZ /login, /signup, /account* səhifələri və admin
// panelinin "İstifadəçilər" bölməsi idxal edir — ilk yüklənmə paketinə düşmür.
// @simplewebauthn/browser da burada, yalnız passkey düyməsinə basılanda yüklənir.
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError, setCurrentUser, refreshMe, logoutUser } from './userSession'

export { authFetch, AuthError, setCurrentUser, refreshMe, logoutUser }

/** Serverin şifrə həddi (server/users.js → MIN_PASSWORD, MAX_PASSWORD). */
export const MIN_PASSWORD = 10
export const MAX_PASSWORD = 1024
/** Ad həddi (server/users.js → MAX_NAME). */
export const MAX_NAME = 60

export const ROLES = ['user', 'mosque_rep', 'editor', 'admin', 'superadmin']
export const roleRank = (r) => ROLES.indexOf(r)
/** Admin paneli rolları (server/users.js → ADMIN_PANEL_ROLES) — panelə keçid göstərilir. */
export const isPanelRole = (r) => roleRank(r) >= roleRank('editor')

/**
 * Admin bu istifadəçiyə hansı rolları verə bilər (server/users.js → roleChangeError ilə eyni qayda):
 * superadmin HEÇ VAXT təklif olunmur (yalnız skriptlə); admin — yalnız superadmin-ə.
 */
export function assignableRoles(actorRole) {
  const base = ['user', 'mosque_rep', 'editor']
  return actorRole === 'superadmin' ? [...base, 'admin'] : base
}

/** Məscid ID-si (server/users.js → MOSQUE_RE). */
export const validMosqueId = (s) => /^[A-Za-z0-9_-]{1,64}$/.test(String(s || ''))

/** Sadə e-poçt yoxlaması (server/auth.js → EMAIL_RE ilə eyni). */
export const validEmail = (e) => {
  const s = String(e || '').trim()
  return s.length <= 254 && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/.test(s)
}

/**
 * Xəta → səhifələrdəki mətn açarı. Şəbəkə xətası (TypeError) → 'errNet'.
 * Səhifələr açarı öz 5 dilli LABELS-ində tapır; tanınmayan — 'errUnknown'.
 */
const CODE_KEY = {
  invalid_credentials: 'errCreds',
  weak_password: 'errWeak',
  invalid_token: 'errToken',
  wrong_password: 'errWrongPw',
  same_password: 'errSamePw',
  confirm_required: 'errConfirm',
  link_requires_verification: 'errLinkVerify',
  google_disabled: 'errGoogleOff',
  google_unavailable: 'errGoogleOff',
  google_invalid: 'errGoogle',
  passkey_failed: 'errPasskey',
  passkey_exists: 'errPasskeyExists',
  too_many_passkeys: 'errTooManyPk',
  last_method: 'errLastMethod',
  // admin
  script_only: 'errScriptOnly',
  superadmin_required: 'errSuperOnly',
  self: 'errSelf',
  session_required: 'errSessionReq',
  bad_role: 'errBadRole',
  forbidden: 'errForbidden',
  not_found: 'errNotFound',
  bad_request: 'errBad',
}
export function errorKey(e) {
  if (!(e instanceof AuthError)) {
    // Brauzerin WebAuthn dialoqu bağlandı / vaxt bitdi — xəta deyil, istifadəçi imtina etdi
    if (e && (e.name === 'NotAllowedError' || e.name === 'AbortError')) return 'cancelled'
    if (e && e.name === 'InvalidStateError') return 'errPasskeyExists'
    if (e && e.name === 'NotSupportedError') return 'errPasskeyUnsupported'
    if (e && /WebAuthn/i.test(String(e.name || ''))) return 'errPasskey'
    return 'errNet'
  }
  if (CODE_KEY[e.code]) return CODE_KEY[e.code]
  if (e.status === 429) return 'errMany'
  if (e.status === 401) return 'errSession'
  return 'errUnknown'
}

/**
 * Şifrə gücü ipucu (0–4) — server qaydasının (weakPassword) sadə əksi + uzunluq/çeşid.
 * { score, short } — short: MIN_PASSWORD-dan qısadır (server qəbul etməyəcək).
 */
export function passwordStrength(pw, email = '') {
  const s = String(pw || '')
  if (!s) return { score: 0, short: true }
  const short = [...s].length < MIN_PASSWORD
  const low = s.toLowerCase()
  const local = String(email || '').trim().toLowerCase().split('@')[0]
  const uniq = new Set(low).size
  if (short || uniq < 4 || /^\d+$/.test(s) || (local && low === local)) return { score: short ? 0 : 1, short }
  let score = 1
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(s)).length
  if (s.length >= 12) score++
  if (s.length >= 16) score++
  if (classes >= 3 || (classes >= 2 && s.length >= 14)) score++
  return { score: Math.min(4, score), short }
}

/** E-poçt keçidindəki token: "#token=…" (server/users.js → TOKEN_RE, 43 simvol). */
export function readHashToken(hash) {
  const m = /(?:^#|&)token=([A-Za-z0-9_-]{20,128})(?:&|$)/.exec(String(hash || ''))
  return m ? m[1] : ''
}

/** Girişdən sonra hara: yalnız saytın öz nisbi yolu ("/account", "/en/quran?x"), "//evil" yox. */
export function safeNext(next, fallback) {
  const s = String(next || '')
  if (!s.startsWith('/') || s.startsWith('//') || s.startsWith('/\\') || /[\r\n]/.test(s)) return fallback
  return s
}

const post = (path, body) => authFetch(path, { method: 'POST', body: body === undefined ? {} : body })

// ── Giriş / qeydiyyat ──
export async function login(email, password) {
  const r = await post('/api/auth/login', { email: String(email || '').trim(), password })
  setCurrentUser(r.user)
  return r.user
}

/** 201 → { user, verificationSent }; 202 (e-poçt artıq var — açılmır) → { checkEmail: true }. */
export async function register({ email, password, displayName, lang }) {
  const body = { email: String(email || '').trim(), password, lang }
  const name = String(displayName || '').trim()
  if (name) body.displayName = name
  const r = await post('/api/auth/register', body)
  if (r && r.checkEmail) return { checkEmail: true }
  setCurrentUser(r.user)
  return { user: r.user, verificationSent: Boolean(r.verificationSent) }
}

export const forgotPassword = (email, lang) => post('/api/auth/forgot', { email: String(email || '').trim(), lang })
export const verifyEmail = (token) => post('/api/auth/verify', { token })
export const resetPassword = (token, password) => post('/api/auth/reset', { token, password })
export const resendVerification = (lang) => post('/api/auth/verify/resend', { lang })

export async function googleLogin(credential) {
  const r = await post('/api/auth/google', { credential })
  setCurrentUser(r.user)
  return { user: r.user, created: Boolean(r.created) }
}

// ── Hesab idarəsi ──
export async function updateProfile(displayName) {
  const u = await authFetch('/api/auth/profile', { method: 'PATCH', body: { displayName } })
  setCurrentUser(u)
  return u
}
export const changePassword = (current, next) => post('/api/auth/password', current ? { current, next } : { next })
export const listSessions = () => authFetch('/api/auth/sessions').then((r) => (r && Array.isArray(r.sessions) ? r.sessions : []))
export const revokeSession = (id) => post('/api/auth/sessions/revoke', { id })
export const revokeOtherSessions = () => post('/api/auth/sessions/revoke', { all: true })
export async function deleteAccount({ password, confirm }) {
  await post('/api/auth/delete', password ? { password } : { confirm })
  setCurrentUser(null)
}

// ── Passkey (WebAuthn) ──
export const passkeySupported = () => typeof globalThis.PublicKeyCredential === 'function'

const webauthn = () => import('@simplewebauthn/browser')

// ── PRF (WebAuthn "prf" genişlənməsi) — hesaba bağlı sinxronizasiyanın açarı (utils/accountSync) ──
// Sabit giriş (utils/syncWrap → PRF_INPUT ilə eyni). Brauzer/autentifikator dəstəkləmirsə
// genişlənmə səssizcə nəzərə alınmır. PRF ÇIXIŞI SERVERƏ GETMİR: cavabdan çıxarılıb silinir.
const PRF_INPUT = new TextEncoder().encode('muslims.cc/sync-prf/v1')
const withPrf = (options) => ({ ...options, extensions: { ...(options && options.extensions), prf: { eval: { first: PRF_INPUT } } } })
/** Cavabdan PRF çıxışını götür və cavabdan SİL (serverə yalnız { enabled } qala bilər). */
export function takePrf(response) {
  const ext = response && response.clientExtensionResults
  const prf = ext && ext.prf
  if (!prf) return null
  const first = prf.results && prf.results.first
  delete prf.results
  if (!first) return null
  const bytes = first instanceof ArrayBuffer ? new Uint8Array(first.slice(0)) : ArrayBuffer.isView(first) ? new Uint8Array(first.buffer.slice(first.byteOffset, first.byteOffset + first.byteLength)) : null
  return bytes && bytes.length >= 16 ? { credId: response.id, bytes } : null
}

/**
 * Passkey ilə giriş (usernameless). autofill: true — e-poçt sahəsinin avtomatik
 * doldurma siyahısında təklif (autocomplete="username webauthn"); səssizcə gözləyir.
 */
export async function passkeyLogin({ autofill = false, onPrf } = {}) {
  const { startAuthentication } = await webauthn()
  const { challengeId, options } = await post('/api/auth/passkey/login/options')
  const response = await startAuthentication({ optionsJSON: withPrf(options), useBrowserAutofill: autofill })
  const prf = takePrf(response)
  const r = await post('/api/auth/passkey/login/verify', { challengeId, response })
  setCurrentUser(r.user)
  if (prf && typeof onPrf === 'function') onPrf(prf, r.user)
  return r.user
}

/**
 * Bu passkey-in PRF çıxışı (hesab səhifəsi: "passkey ilə kilidi aç"). Server seçimləri yalnız
 * rpId və birdəfəlik challenge üçün alınır; cavab serverə GÖNDƏRİLMİR (PRF çıxışı cihazda qalır).
 * → { credId, bytes } | null (dəstəklənmir)
 */
export async function passkeyPrf(credId) {
  const { startAuthentication } = await webauthn()
  const { options } = await post('/api/auth/passkey/login/options')
  const optionsJSON = withPrf({ ...options, allowCredentials: credId ? [{ id: credId, type: 'public-key' }] : [] })
  return takePrf(await startAuthentication({ optionsJSON }))
}

/** Avtomatik doldurma ilə passkey: brauzer dəstəkləyirmi? */
export async function passkeyAutofillAvailable() {
  try {
    const PKC = globalThis.PublicKeyCredential
    return Boolean(PKC && typeof PKC.isConditionalMediationAvailable === 'function' && await PKC.isConditionalMediationAvailable())
  } catch { return false }
}

/** Yeni passkey (daxil olmuş istifadəçi) → serverin yeni siyahısı. */
export async function addPasskey(name, { onPrf } = {}) {
  const { startRegistration } = await webauthn()
  const { challengeId, options } = await post('/api/auth/passkey/register/options')
  const response = await startRegistration({ optionsJSON: withPrf(options) })
  const prf = takePrf(response)
  const prfEnabled = Boolean(response.clientExtensionResults && response.clientExtensionResults.prf && response.clientExtensionResults.prf.enabled)
  const body = { challengeId, response }
  const n = String(name || '').trim()
  if (n) body.name = n
  const r = await post('/api/auth/passkey/register/verify', body)
  if (typeof onPrf === 'function') onPrf(prf, { credId: response.id, enabled: prfEnabled || Boolean(prf) })
  return Array.isArray(r.passkeys) ? r.passkeys : []
}
export const removePasskey = (id) => post('/api/auth/passkey/remove', { id }).then((r) => (Array.isArray(r.passkeys) ? r.passkeys : []))

// ── Admin paneli: istifadəçilər (admin / superadmin) ──
export function adminListUsers({ q = '', page = 1 } = {}) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  p.set('page', String(page))
  return authFetch(`/api/admin/users?${p}`)
}
export const adminSetRole = (id, role, mosqueId) =>
  post(`/api/admin/users/${encodeURIComponent(id)}/role`, role === 'mosque_rep' ? { role, mosqueId } : { role })
export const adminSetDisabled = (id, disabled) => post(`/api/admin/users/${encodeURIComponent(id)}/disable`, { disabled })
export const adminRoleAudit = (page = 1) => authFetch(`/api/admin/role-audit?page=${encodeURIComponent(page)}`)
