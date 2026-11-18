// ═══════════════════════════════════════════════════════════
// I mərhələsi — klient: qrup çağırışları (server/challenges.js), müəllim sinfi (server/classes.js),
// ailə Ramazan lövhəsi (server/familyRamadan.js), şəxsi təqvim axını (server/calFeed.js).
// Hamısı girişli (cookie + X-Requested-With). Dəvət tokenləri URL FRAQMENTİNDƏDİR (#cj=…, #kj=…) —
// serverə gövdədə gedir, nginx loguna düşmür.
// ═══════════════════════════════════════════════════════════
import { authFetch, AuthError } from './userSession'

export { AuthError }
const enc = encodeURIComponent
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } }
export const browserTz = tz

// ── Qrup çağırışları ──
const C = '/api/challenges'
export const listChallenges = () => authFetch(C)
export const createChallenge = (body) => authFetch(C, { method: 'POST', body: { ...body, tz: tz(), consent: true } })
export const getChallenge = (id) => authFetch(`${C}/${enc(id)}`)
export const deleteChallenge = (id) => authFetch(`${C}/${enc(id)}`, { method: 'DELETE' })
export const newChallengeInvite = (id) => authFetch(`${C}/${enc(id)}/invite`, { method: 'POST', body: {} })
export const previewChallenge = (token) => authFetch(`${C}/join/preview`, { method: 'POST', body: { token } })
export const joinChallenge = (token) => authFetch(`${C}/join`, { method: 'POST', body: { token, tz: tz(), consent: true } })
export const tickChallenge = (id, day, done) => authFetch(`${C}/${enc(id)}/tick`, { method: 'POST', body: { day, done } })
export const juzChallenge = (id, juz, action) => authFetch(`${C}/${enc(id)}/juz`, { method: 'POST', body: { juz, action } })
export const setChallengeReminder = (id, remindAt) => authFetch(`${C}/${enc(id)}/me`, { method: 'PATCH', body: { remindAt, tz: tz() } })
export const leaveChallenge = (id) => authFetch(`${C}/${enc(id)}/me`, { method: 'DELETE' })

// ── Müəllim sinfi ──
const K = '/api/classes'
export const listClasses = () => authFetch(K)
export const createClass = (name) => authFetch(K, { method: 'POST', body: { name } })
export const getClass = (id) => authFetch(`${K}/${enc(id)}`)
export const updateClass = (id, body) => authFetch(`${K}/${enc(id)}`, { method: 'PATCH', body })
export const deleteClass = (id) => authFetch(`${K}/${enc(id)}`, { method: 'DELETE' })
export const newClassInvite = (id) => authFetch(`${K}/${enc(id)}/invite`, { method: 'POST', body: {} })
export const previewClass = (token) => authFetch(`${K}/join/preview`, { method: 'POST', body: { token } })
export const joinClass = (token, consent) => authFetch(`${K}/join`, { method: 'POST', body: { token, consent: Boolean(consent) } })
export const leaveClass = (id) => authFetch(`${K}/${enc(id)}/me`, { method: 'DELETE' })
export const removeStudent = (id, uid) => authFetch(`${K}/${enc(id)}/students/${enc(uid)}`, { method: 'DELETE' })
export const addAssignment = (id, body) => authFetch(`${K}/${enc(id)}/assignments`, { method: 'POST', body })
export const deleteAssignment = (id, aid) => authFetch(`${K}/${enc(id)}/assignments/${enc(aid)}`, { method: 'DELETE' })
export const markAssignment = (id, aid, done) => authFetch(`${K}/${enc(id)}/assignments/${enc(aid)}/done`, { method: 'POST', body: { done } })
export const shareWithTeacher = (id, stats, consent) => authFetch(`${K}/${enc(id)}/share`, { method: 'PUT', body: { stats, ...(consent ? { consent: true } : {}) } })
export const stopSharingWithTeacher = (id) => authFetch(`${K}/${enc(id)}/share`, { method: 'DELETE' })
export const createClassTest = (id, body) => authFetch(`${K}/${enc(id)}/tests`, { method: 'POST', body })

// ── Ailə Ramazan lövhəsi ──
const R = '/api/family/ramadan'
export const getRamadanBoard = () => authFetch(R)
export const shareRamadan = (fasts, pages, consent) => authFetch(`${R}/share`, { method: 'PUT', body: { fasts, pages, ...(consent ? { consent: true } : {}) } })
export const hideRamadan = () => authFetch(`${R}/share`, { method: 'DELETE' })
export const ramadanJuz = (juz, action) => authFetch(`${R}/juz`, { method: 'POST', body: { juz, action } })
export const ramadanIftar = (day, on) => authFetch(`${R}/iftar`, { method: 'POST', body: { day, on } })
export const ramadanQadr = (night, on) => authFetch(`${R}/qadr`, { method: 'POST', body: { night, on } })

// ── Şəxsi təqvim axını ──
const F = '/api/cal-feed'
export const getCalFeed = () => authFetch(F)
export const createCalFeed = (cats, lang, consent) => authFetch(F, { method: 'POST', body: { cats, lang, ...(consent ? { consent: true } : {}) } })
export const updateCalFeed = (body) => authFetch(F, { method: 'PATCH', body })
export const revokeCalFeed = () => authFetch(F, { method: 'DELETE' })
/** Axın ünvanları: https (Google "URL ilə əlavə et") və webcal (Apple / Outlook birbaşa abunə) */
export function feedUrls(origin, token) {
  const https = `${origin}/api/cal/${token}.ics`
  return { https, webcal: https.replace(/^https?:\/\//, 'webcal://') }
}

// ── Keçidlər: /together#cj=<token> (çağırışa qoşul), #kj=<token> (sinfə qoşul); oxu — pages/TogetherPage.jsx ──
export const challengeJoinLink = (origin, path, token) => `${origin}${path}#cj=${token}`
export const classJoinLink = (origin, path, token) => `${origin}${path}#kj=${token}`
/** Yerli bu gün (YYYY-MM-DD) */
export function localToday(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
