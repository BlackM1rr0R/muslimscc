// ═══════════════════════════════════════════════════════════
// Şəxsi xatırlatmalar — klient (server/personal.js, docs/USER-ACCOUNTS.md → "Şəxsi xatırlatmalar")
// Gələcəyə məktub, sevdiklərim üçün dua (hər Cümə / ayda bir, ailə ilə paylaşma), zəkat ili.
// Bu məlumat SERVERDƏ ŞİFRƏSİZ saxlanır (vaxtında göndərmək üçün) — UI ilk istifadədə açıq razılıq alır.
// Yüngül: yalnız userSession-in authFetch-i (cookie + X-Requested-With).
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'

export { AuthError }

export const MAX_LETTER = 4000
export const MAX_NAME = 80
export const MAX_RELATION = 40
export const MAX_NOTE = 500
export const PUSH_ENDPOINT_KEY = 'muslim_cc_push_endpoint'   // src/api/push.js → ENDPOINT_KEY

/** Brauzerin IANA saat qurşağı (server yoxlayır) */
export function browserTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

const send = (path, method, body) => authFetch(path, { method, body: body === undefined ? undefined : body })
const ctx = (lang, consent) => ({ tz: browserTz(), lang, ...(consent ? { consent: true } : {}) })

// ── Məktublar ──
export const listLetters = () => authFetch('/api/personal/letters')
export const createLetter = ({ body, deliverOn, kind, lang, consent }) =>
  send('/api/personal/letters', 'POST', { body, deliverOn, kind, ...ctx(lang, consent) }).then((r) => r.letter)
export const updateLetter = (id, patch) => send(`/api/personal/letters/${encodeURIComponent(id)}`, 'PATCH', patch).then((r) => r.letter)
export const deleteLetter = (id) => send(`/api/personal/letters/${encodeURIComponent(id)}`, 'DELETE')

// ── Sevdiklərim üçün dua ──
export const listLoved = () => authFetch('/api/personal/loved')
export const createLoved = (item, { lang, consent }) => send('/api/personal/loved', 'POST', { ...item, ...ctx(lang, consent) }).then((r) => r.item)
export const updateLoved = (id, patch) => send(`/api/personal/loved/${encodeURIComponent(id)}`, 'PATCH', patch).then((r) => r.item)
export const deleteLoved = (id) => send(`/api/personal/loved/${encodeURIComponent(id)}`, 'DELETE')
export const createShare = () => send('/api/personal/loved/share', 'POST', {}).then((r) => r.token)
export const revokeShare = () => send('/api/personal/loved/share', 'DELETE')
export const removeFollower = (id) => send(`/api/personal/loved/followers/${encodeURIComponent(id)}`, 'DELETE')
export const previewFollow = (token) => send('/api/personal/follow/preview', 'POST', { token })
export const follow = (token, { lang, consent }) => send('/api/personal/follow', 'POST', { token, ...ctx(lang, consent) })
export const unfollow = (ownerId) => send(`/api/personal/follow/${encodeURIComponent(ownerId)}`, 'DELETE')
export const setLovedEmail = (on) => send('/api/personal/prefs', 'PATCH', { lovedEmail: Boolean(on) })

// ── Zəkat ili ──
export const getZakatReminder = () => authFetch('/api/personal/zakat')
export const setZakatReminder = ({ hawlStart, storeAmount, amount, currency, lang, consent }) =>
  send('/api/personal/zakat', 'PUT', { hawlStart, storeAmount: Boolean(storeAmount), ...(storeAmount ? { amount, currency } : {}), ...ctx(lang, consent) })
    .then((r) => r.reminder)
export const deleteZakatReminder = () => send('/api/personal/zakat', 'DELETE')

// ── Push (bu cihaz) və hamısını sil ──
export function thisDeviceEndpoint() {
  try { return globalThis.localStorage?.getItem(PUSH_ENDPOINT_KEY) || '' } catch { return '' }
}
export const pushLinkStatus = (endpoint) => send('/api/personal/push-link/status', 'POST', { endpoint }).then((r) => Boolean(r.linked))
export const setPushLink = (endpoint, on) => send('/api/personal/push-link', 'POST', { endpoint, on }).then((r) => Boolean(r.linked))
export const wipePersonal = () => send('/api/personal', 'DELETE')

/** Paylaşma keçidi: token hash-dadır (serverə/loga URL ilə getmir) */
export const followLink = (origin, accountPath, token) => `${origin}${accountPath}#follow=${token}`
export function readFollowToken(hash) {
  const m = /(?:^#|&)follow=([A-Za-z0-9_-]{43})(?:&|$)/.exec(String(hash || ''))
  return m ? m[1] : ''
}

/** Server xəta kodu → mətn açarı (personalText.js → err) */
export function personalErrorKey(e) {
  if (!(e instanceof AuthError)) return 'net'
  if (e.status === 401) return 'session'
  if (e.status === 429) return 'many'
  return {
    consent_required: 'consent', too_many: 'tooMany', bad_date: 'date', bad_body: 'body', bad_name: 'name',
    invalid_token: 'token', self: 'self', not_pending: 'notPending', bad_tz: 'tz',
  }[e.code] || 'unknown'
}
