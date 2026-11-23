// ═══════════════════════════════════════════════════════
// Xəstəni ziyarət (/visiting-the-sick) — şəxsi "ziyarət xatırlatması" siyahısı (React-sız).
// YALNIZ bu cihazda, profilə aid (PROFILE_KEYS); hesabın E2E şifrəli sinxronizasiyası və ehtiyat
// nüsxə onu özü daşıyır — serverə açıq heç nə getmir.
//   sick_visits_v1  { v: 1, l: [{ id, n, d, no?, x?, u }] }
//     n  — kimi ziyarət edəcəyəm (≤ 60), d — gün 'YYYY-MM-DD', no — qeyd (≤ 300, istəyə bağlı)
//     x  — ziyarət edildi (true), u — son dəyişiklik anı (ms): eyni qeyd iki cihazda dəyişibsə təzəsi qalır
// Birləşdirici: utils/syncMergers → MERGERS[SICK_KEY]. tests/unit/sick-visits.test.js
// ═══════════════════════════════════════════════════════
import { cleanText as _clean } from './mosqueVisits'
import { isObj, safeStorage, parse, validDay, localDay } from './journeyStore'

export const SICK_KEY = 'sick_visits_v1'
export const SICK_EVENT = 'mcc-sick-visits'
export const NAME_MAX = 60
export const NOTE_MAX = 300
export const SICK_MAX = 100
const ID_RE = /^s[a-z0-9]{4,23}$/

export { safeStorage, localDay }
const cleanText = (s, max) => [..._clean(s, 10 * max)].slice(0, max).join('')
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(SICK_EVENT)) } catch { /* */ } }

/** Bir qeyd → təmiz forma və ya null */
export function sanitizeVisit(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !ID_RE.test(x.id)) return null
  if (!validDay(x.d)) return null
  const n = cleanText(x.n, NAME_MAX)
  if (!n) return null
  const out = { id: x.id, n, d: x.d }
  const no = cleanText(x.no, NOTE_MAX)
  if (no) out.no = no
  if (x.x === true) out.x = true
  const u = Number(x.u)
  out.u = Number.isFinite(u) && u > 0 ? Math.round(u) : 0
  return out
}

/** Bütün dəyər → { v: 1, l } (təkrarsız, ən çox SICK_MAX) */
export function sanitizeVisits(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) { const e = sanitizeVisit(x); if (e && !seen.has(e.id)) { seen.add(e.id); l.push(e) } }
  return { v: 1, l: l.slice(-SICK_MAX) }
}

export const readVisits = (storage = safeStorage()) => sanitizeVisits(parse(storage, SICK_KEY, null))

function writeVisits(data, storage) {
  const v = sanitizeVisits(data)
  try { if (v.l.length) storage?.setItem(SICK_KEY, JSON.stringify(v)); else storage?.removeItem(SICK_KEY) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

export const newVisitId = (now = Date.now(), rnd = Math.random) => `s${now.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`.slice(0, 24)

/** Əlavə et və ya (id varsa) yenilə → { ok, data, item?, full? } */
export function saveVisit(entry, storage = safeStorage(), now = Date.now()) {
  const cur = readVisits(storage)
  const item = sanitizeVisit({ ...entry, id: entry?.id || newVisitId(now), u: now })
  if (!item) return { ok: false, data: cur }
  const exists = cur.l.some((x) => x.id === item.id)
  if (!exists && cur.l.length >= SICK_MAX) return { ok: false, full: true, data: cur }
  return { ok: true, data: writeVisits({ l: exists ? cur.l.map((x) => (x.id === item.id ? item : x)) : [...cur.l, item] }, storage), item }
}

/** "Ziyarət etdim" işarəsi */
export function setVisited(id, on, storage = safeStorage(), now = Date.now()) {
  const cur = readVisits(storage)
  const it = cur.l.find((x) => x.id === id)
  if (!it) return cur
  const next = { ...it, u: now }
  if (on) next.x = true
  else delete next.x
  return writeVisits({ l: cur.l.map((x) => (x.id === id ? next : x)) }, storage)
}

export function removeVisit(id, storage = safeStorage()) {
  const cur = readVisits(storage)
  return writeVisits({ l: cur.l.filter((x) => x.id !== id) }, storage)
}

/** Göstərmə sırası: gözləyənlər (tarixə görə, yaxını əvvəl), sonra ziyarət edilənlər (təzəsi əvvəl) */
export function sortVisits(list) {
  const open = list.filter((x) => !x.x).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
  const done = list.filter((x) => x.x).sort((a, b) => (a.d > b.d ? -1 : a.d < b.d ? 1 : 0))
  return [...open, ...done]
}

/** Qeydin vəziyyəti: 'today' | 'soon' (≤ 7 gün) | 'later' | 'past' | 'done' */
export function visitState(v, today = localDay()) {
  if (v.x) return 'done'
  if (v.d === today) return 'today'
  if (v.d < today) return 'past'
  const diff = Math.round((Date.parse(`${v.d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
  return diff <= 7 ? 'soon' : 'later'
}
