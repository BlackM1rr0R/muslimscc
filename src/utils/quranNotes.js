// ═══════════════════════════════════════════════════════
// Ayə qeydləri və rəngli vurğu (Quran oxuyucusu → sözə uzun basma → "Qeyd et";
// siyahı — "Saxlanılanlar" bölməsində "Qeydlərim"). SAF modul + localStorage.
//
// Açar: quran_notes_v1 → { "2:255": { c: 'gold', t: 'mətn', u: 1731…, w: 'كلمة', p: 3 } }
//   c — rəng (NOTE_COLORS, boş ola bilər), t — qeyd (≤ 2000 simvol), u — dəyişmə vaxtı (ms),
//   w/p — qeydin aid olduğu söz (könüllü).
// Cihazlar arası sinxronizasiya və ehtiyat nüsxə bu açarı avtomatik götürür
// (utils/userBackup.js — qadağan siyahısı yanaşması; keş deyil).
// tests/unit/quranNotes.test.js
// ═══════════════════════════════════════════════════════

export const NOTES_KEY = 'quran_notes_v1'
export const NOTES_EVENT = 'quran-notes-change'
export const NOTE_COLORS = ['gold', 'green', 'blue', 'rose', 'violet']
export const NOTE_MAX = 2000

export const noteKey = (s, a) => `${s}:${a}`
const KEY_RE = /^(\d{1,3}):(\d{1,3})$/
export function parseNoteKey(k) {
  const m = KEY_RE.exec(String(k))
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2])
  return s >= 1 && s <= 114 && a >= 1 && a <= 286 ? { s, a } : null
}

/** Yaddaşdan gələn hər şeyi təmiz xəritəyə çevir (pozuq yazılar atılır) */
export function sanitizeNotes(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [k, v] of Object.entries(raw)) {
    if (!parseNoteKey(k) || !v || typeof v !== 'object') continue
    const c = NOTE_COLORS.includes(v.c) ? v.c : ''
    const t = typeof v.t === 'string' ? v.t.slice(0, NOTE_MAX) : ''
    if (!c && !t.trim()) continue
    const n = { c, t, u: Number.isFinite(v.u) ? v.u : 0 }
    if (typeof v.w === 'string' && v.w) n.w = v.w.slice(0, 60)
    if (Number.isInteger(v.p) && v.p > 0) n.p = v.p
    out[k] = n
  }
  return out
}

export function readNotes(storage = globalThis.localStorage) {
  try { return sanitizeNotes(JSON.parse(storage?.getItem(NOTES_KEY) || 'null')) } catch { return {} }
}

export function writeNotes(map, storage = globalThis.localStorage) {
  try {
    if (Object.keys(map).length) storage?.setItem(NOTES_KEY, JSON.stringify(map))
    else storage?.removeItem(NOTES_KEY)
  } catch { /* yaddaş bağlıdır */ }
  try { globalThis.dispatchEvent?.(new CustomEvent(NOTES_EVENT)) } catch { /* köhnə brauzer */ }
}

/** Qeydi yaz (yeni xəritə qaytarır). Rəng də, mətn də boşdursa — silinir */
export function setNote(map, key, { c = '', t = '', w, p } = {}, now = Date.now()) {
  if (!parseNoteKey(key)) return map
  const next = { ...map }
  const clean = sanitizeNotes({ [key]: { c, t, w, p, u: now } })[key]
  if (clean) next[key] = clean
  else delete next[key]
  return next
}

export function removeNote(map, key) {
  if (!(key in map)) return map
  const next = { ...map }
  delete next[key]
  return next
}

const fold = s => String(s || '').toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036F\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '').replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')

/**
 * Siyahı: [{ key, s, a, c, t, u, w, p }] — ən yeni əvvəldə.
 * color — yalnız bu rəng ('' — hamısı); q — mətndə/sözdə/«2:255»-də axtarış
 * (böyük-kiçik hərf və hərəkələr nəzərə alınmır). nameOf(s) — surə adı (axtarışa daxil).
 */
export function listNotes(map, { color = '', q = '', nameOf } = {}) {
  const query = fold(q).trim()
  return Object.entries(map || {})
    .map(([key, v]) => ({ key, ...parseNoteKey(key), ...v }))
    .filter(n => n.s && (!color || n.c === color))
    .filter(n => !query || fold(`${n.t} ${n.w || ''} ${n.key} ${nameOf ? nameOf(n.s) : ''}`).includes(query))
    .sort((x, y) => (y.u - x.u) || (x.s - y.s) || (x.a - y.a))
}

/** Hər rəngdə neçə qeyd var: { gold: 2, … } */
export function countByColor(map) {
  const out = Object.fromEntries(NOTE_COLORS.map(c => [c, 0]))
  for (const v of Object.values(map || {})) if (v.c && v.c in out) out[v.c]++
  return out
}
