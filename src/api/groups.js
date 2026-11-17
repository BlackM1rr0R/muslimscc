// ═══════════════════════════════════════════════════════════
// Qrup xətmi və ortaq hədəflər — klient (server/groups.js)
//
// Hesab yoxdur: otağı yaradanın adminKey-i, cüz/iştirak tokenləri və
// istifadəçinin yazdığı ad YALNIZ bu brauzerin localStorage-ındadır.
// ═══════════════════════════════════════════════════════════
import { apiFetch } from './http'

const STORE = 'mcc_groups_v1'
const NAME_KEY = 'mcc_group_name'
export const GROUP_ID_RE = /^[a-z0-9]{10}$/

const enc = (id) => encodeURIComponent(id)

export const createGroup = (body) => apiFetch('/api/groups', { method: 'POST', body })
export const getGroup = (id, signal) => apiFetch(`/api/groups/${enc(id)}`, { signal, headers: { 'Cache-Control': 'no-cache' } })
export const claimJuz = (id, juz, name) => apiFetch(`/api/groups/${enc(id)}/claim`, { method: 'PATCH', body: { juz, name } })
export const markDone = (id, juz, token, done = true) => apiFetch(`/api/groups/${enc(id)}/done`, { method: 'POST', body: { juz, token, done } })
export const releaseJuz = (id, juz, token) => apiFetch(`/api/groups/${enc(id)}/release`, { method: 'POST', body: { juz, token } })
export const joinGoal = (id, name) => apiFetch(`/api/groups/${enc(id)}/join`, { method: 'POST', body: { name } })
export const tickDay = (id, pid, token, date, on = true) => apiFetch(`/api/groups/${enc(id)}/tick`, { method: 'POST', body: { pid, token, date, on } })
export const leaveGoal = (id, pid, token) => apiFetch(`/api/groups/${enc(id)}/leave`, { method: 'POST', body: { pid, token } })
// Ailə dua lövhəsi
export const addDua = (id, name, text) => apiFetch(`/api/groups/${enc(id)}/dua`, { method: 'POST', body: { name, text } })
export const prayDua = (id, did, device) => apiFetch(`/api/groups/${enc(id)}/dua/${enc(did)}/pray`, { method: 'POST', body: { device } })
export const answerDua = (id, did, token, on = true) => apiFetch(`/api/groups/${enc(id)}/dua/${enc(did)}/answered`, { method: 'POST', body: { token, on } })
export const removeDua = (id, did, token) => apiFetch(`/api/groups/${enc(id)}/dua/${enc(did)}/remove`, { method: 'POST', body: { token } })
export const adminAction = (id, adminKey, action, extra = {}) => apiFetch(`/api/groups/${enc(id)}/admin`, { method: 'POST', body: { adminKey, action, ...extra } })

// ── Yerli yaddaş ──
function readAll() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
}
function writeAll(v) {
  try { localStorage.setItem(STORE, JSON.stringify(v)) } catch { /* dolu / qadağan */ }
}

/** Bu brauzerdə otaq haqqında saxlanan məlumat: { adminKey?, claims:{[juz]:token}, member?:{pid,token}, duas?:{[did]:token}, prayed?:{[did]:YYYY-MM-DD}, title, type } */
export function localRoom(id) {
  const r = readAll()[id] || {}
  return { claims: {}, ...r }
}
export function saveLocalRoom(id, patch) {
  const all = readAll()
  all[id] = { claims: {}, ...(all[id] || {}), ...patch, seenAt: Date.now() }
  writeAll(all)
}
export function forgetLocalRoom(id) {
  const all = readAll()
  delete all[id]
  writeAll(all)
}
/** Son açılan otaqlar (yeni → köhnə) */
export function localRooms() {
  return Object.entries(readAll())
    .filter(([id]) => GROUP_ID_RE.test(id))
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => (b.seenAt || 0) - (a.seenAt || 0))
}

const DEVICE_KEY = 'mcc_group_device'
/** "Dua etdim" üçün anonim cihaz tokeni — yalnız bu brauzerdə; server onu saxlamır */
export function deviceToken() {
  try {
    let t = localStorage.getItem(DEVICE_KEY)
    if (!t || !/^[A-Za-z0-9_-]{16,64}$/.test(t)) {
      const b = new Uint8Array(18)
      crypto.getRandomValues(b)
      t = Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(DEVICE_KEY, t)
    }
    return t
  } catch {
    return 'tmp' + Math.random().toString(36).slice(2).padEnd(16, '0')
  }
}

export function savedName() {
  try { return localStorage.getItem(NAME_KEY) || '' } catch { return '' }
}
export function saveName(n) {
  try { localStorage.setItem(NAME_KEY, n) } catch { /* */ }
}

// ── Tarix köməkçiləri (yerli tarix, YYYY-MM-DD) ──
export function localDate(d = new Date(), offsetDays = 0) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetDays)
  const p = (n) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`
}

/** Ardıcıl günlər: bu gün (və ya bu gün hələ işarələnməyibsə dünən) geriyə doğru */
export function streakOf(ticks, today = new Date()) {
  const set = new Set(ticks || [])
  let off = set.has(localDate(today)) ? 0 : -1
  let n = 0
  while (set.has(localDate(today, off))) { n++; off-- }
  return n
}
