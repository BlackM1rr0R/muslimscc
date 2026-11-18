// ═══════════════════════════════════════════════════════
// Mənəvi səyahətin yerli açarları (J3, J5, J6, J8) — yüngül modul (birləşdiricilər də işlədir)
// Hesab: utils/journey.js. tests/unit/journey.test.js
//   muslim_cc_kunya_v1     { p: 'abu'|'umm', n: ad, t }            — hesab səviyyəsində
//   muslim_cc_birthday_v1  { m, d, y?, t }                          — profilə aid (hər profil bir insan)
//   life_milestones_v1     { v: 1, l: [{ id, d, k, ti, no, u }] }   — profilə aid, gizli
//   mcc_celebrate_v1       { a: il, b: il }                         — ildönümü / ad günü kartı göstərilib
// ═══════════════════════════════════════════════════════
import { cleanText as _clean } from './mosqueVisits'

export const KUNYA_KEY = 'muslim_cc_kunya_v1'
export const BIRTHDAY_KEY = 'muslim_cc_birthday_v1'
export const MILESTONES_KEY = 'life_milestones_v1'
export const CELEBRATE_KEY = 'mcc_celebrate_v1'
export const JOURNEY_EVENT = 'mcc-journey'
export const NOTE_MAX = 200
export const TITLE_MAX = 60
export const KUNYA_NAME_MAX = 24
export const MILESTONES_MAX = 200
export const MILESTONE_KINDS = ['hajj', 'umrah', 'other']

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
/** Həqiqi təqvim günü (2025-13-01, 2025-02-30 — yox) */
export const validDay = (d) => {
  if (typeof d !== 'string' || !DATE_RE.test(d)) return false
  const [y, m, dd] = d.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, dd))
  return y >= 1900 && y <= 2100 && t.getUTCMonth() === m - 1 && t.getUTCDate() === dd
}
export const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
export const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
export const parse = (storage, k, fb) => { try { const v = JSON.parse(storage?.getItem(k) || 'null'); return v ?? fb } catch { return fb } }
const pad = (n) => String(n).padStart(2, '0')
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(JOURNEY_EVENT)) } catch { /* */ } }
const cleanText = (s, max) => [..._clean(s, 10 * max)].slice(0, max).join('')

// ── Tarix tetikləyiciləri ──
/** Ay-günün bu il üçün "qeyd günü": 29 fevral uzun olmayan ildə 28 fevral */
export function observedDay(year, m, d) {
  if (m === 2 && d === 29 && !isLeap(year)) return `${year}-02-28`
  return `${year}-${pad(m)}-${pad(d)}`
}

/** Hesab yaradılma anı (ms) → bu gün ildönümüdürsə { years, since:'YYYY-MM-DD' }, yoxsa null */
export function anniversaryOf(createdAt, today = localDay()) {
  const ms = Number(createdAt)
  if (!Number.isFinite(ms) || ms <= 0 || !DATE_RE.test(today)) return null
  const c = localDay(new Date(ms))
  const [cy, cm, cd] = c.split('-').map(Number)
  const ty = Number(today.slice(0, 4))
  const years = ty - cy
  if (years < 1 || observedDay(ty, cm, cd) !== today) return null
  return { years, created: c, since: observedDay(ty - 1, cm, cd) }
}

export function sanitizeBirthday(raw) {
  if (!isObj(raw)) return null
  const m = Number(raw.m), d = Number(raw.d)
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1) return null
  const maxD = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
  if (d > maxD) return null
  const out = { m, d }
  const y = Number(raw.y)
  if (Number.isInteger(y) && y >= 1900 && y <= 2100 && !(m === 2 && d === 29 && !isLeap(y))) out.y = y
  out.t = Number.isFinite(Number(raw.t)) ? Math.max(0, Math.round(Number(raw.t))) : 0
  return out
}

/** Bu gün ad günüdürsə { since } (son 12 ayın başlanğıcı), yoxsa null */
export function birthdayToday(bday, today = localDay()) {
  const b = sanitizeBirthday(bday)
  if (!b || !DATE_RE.test(today)) return null
  const ty = Number(today.slice(0, 4))
  if (b.y && b.y >= ty) return null
  if (observedDay(ty, b.m, b.d) !== today) return null
  return { since: observedDay(ty - 1, b.m, b.d), age: b.y ? ty - b.y : null }
}

// ── "Göstərildi" qeydi (ildönümü / ad günü — il üzrə bir dəfə) ──
export function readCelebrate(storage = safeStorage()) {
  const v = parse(storage, CELEBRATE_KEY, {})
  const out = {}
  for (const k of ['a', 'b']) { const n = Number(v?.[k]); if (Number.isInteger(n) && n > 1900 && n < 3000) out[k] = n }
  return out
}
export function markCelebrated(kind, year, storage = safeStorage()) {
  const v = readCelebrate(storage)
  v[kind] = Math.max(v[kind] || 0, Number(year))
  try { storage?.setItem(CELEBRATE_KEY, JSON.stringify(v)) } catch { /* */ }
  emit()
  return v
}

// ── Ad günü ──
export const readBirthday = (storage = safeStorage()) => sanitizeBirthday(parse(storage, BIRTHDAY_KEY, null))
export function writeBirthday(b, storage = safeStorage(), now = Date.now()) {
  const v = b ? sanitizeBirthday({ ...b, t: now }) : null
  try { if (v) storage?.setItem(BIRTHDAY_KEY, JSON.stringify(v)); else storage?.removeItem(BIRTHDAY_KEY) } catch { /* */ }
  emit()
  return v
}

// ── Kunya ──
export function sanitizeKunya(raw) {
  if (!isObj(raw) || (raw.p !== 'abu' && raw.p !== 'umm')) return null
  const n = cleanText(raw.n, KUNYA_NAME_MAX)
  if (!n) return null
  return { p: raw.p, n, t: Number.isFinite(Number(raw.t)) ? Math.max(0, Math.round(Number(raw.t))) : 0 }
}
export const readKunya = (storage = safeStorage()) => sanitizeKunya(parse(storage, KUNYA_KEY, null))
export function writeKunya(k, storage = safeStorage(), now = Date.now()) {
  const v = k ? sanitizeKunya({ ...k, t: now }) : null
  try { if (v) storage?.setItem(KUNYA_KEY, JSON.stringify(v)); else storage?.removeItem(KUNYA_KEY) } catch { /* */ }
  emit()
  return v
}
/** Kunyanın yazılışı (dilə görə ön söz + ad) */
const KUNYA_PREFIX = {
  az: { abu: 'Əbu', umm: 'Ümmü' }, en: { abu: 'Abu', umm: 'Umm' }, ru: { abu: 'Абу', umm: 'Умм' },
  ar: { abu: 'أبو', umm: 'أم' }, tr: { abu: 'Ebu', umm: 'Ümmü' },
}
export function kunyaText(k, lang = 'az') {
  const v = sanitizeKunya(k)
  if (!v) return ''
  const p = (KUNYA_PREFIX[lang] || KUNYA_PREFIX.en)[v.p]
  return `${p} ${v.n}`
}

// ── Öz mərhələlər ──
export function sanitizeMilestone(m) {
  if (!isObj(m) || !validDay(m.d)) return null
  const id = typeof m.id === 'string' && /^[a-z0-9]{4,24}$/.test(m.id) ? m.id : null
  if (!id) return null
  const k = MILESTONE_KINDS.includes(m.k) ? m.k : 'other'
  const ti = cleanText(m.ti, TITLE_MAX)
  if (k === 'other' && !ti) return null
  const out = { id, d: m.d, k }
  if (ti) out.ti = ti
  const no = cleanText(m.no, NOTE_MAX)
  if (no) out.no = no
  out.u = Number.isFinite(Number(m.u)) ? Math.max(0, Math.round(Number(m.u))) : 0
  return out
}
export function sanitizeMilestones(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) { const m = sanitizeMilestone(x); if (m && !seen.has(m.id)) { seen.add(m.id); l.push(m) } }
  l.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
  return { v: 1, l: l.slice(-MILESTONES_MAX) }
}
export const readMilestones = (storage = safeStorage()) => sanitizeMilestones(parse(storage, MILESTONES_KEY, null))
function writeMilestones(data, storage) {
  const v = sanitizeMilestones(data)
  try { if (v.l.length) storage?.setItem(MILESTONES_KEY, JSON.stringify(v)); else storage?.removeItem(MILESTONES_KEY) } catch { /* */ }
  emit()
  return v
}
export const newMilestoneId = (now = Date.now(), rnd = Math.random) => `m${now.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`.slice(0, 24)
export function addMilestone(m, storage = safeStorage(), now = Date.now()) {
  const cur = readMilestones(storage)
  const item = sanitizeMilestone({ ...m, id: m.id || newMilestoneId(now), u: now })
  if (!item) return { ok: false, data: cur }
  return { ok: true, data: writeMilestones({ l: [...cur.l.filter((x) => x.id !== item.id), item] }, storage), item }
}
export function removeMilestone(id, storage = safeStorage()) {
  const cur = readMilestones(storage)
  return writeMilestones({ l: cur.l.filter((x) => x.id !== id) }, storage)
}

