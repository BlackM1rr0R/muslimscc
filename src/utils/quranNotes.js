// ═══════════════════════════════════════════════════════
// Ayə qeydləri və rəngli vurğu (Quran oxuyucusu → sözə uzun basma → "Qeyd et";
// siyahı — "Saxlanılanlar" bölməsində "Qeydlərim"). SAF modul + localStorage.
//
// Açar: quran_notes_v1 → { "2:255": { c: 'gold', t: 'mətn', u: 1731…, d: 1731…, h: [{ t, u }], w: 'كلمة', p: 3 } }
//   c — rəng (NOTE_COLORS, boş ola bilər), t — qeyd (≤ 2000 simvol), u — dəyişmə vaxtı (ms),
//   d — ilk yazılma vaxtı (ms; avtomatik), h — əvvəlki versiyalar (ən yenisi əvvəldə, ≤ 3,
//   cəmi ≤ 2000 simvol — sinxronizasiya blokunun ölçüsü üçün), w/p — qeydin aid olduğu söz.
// Cihazlar arası sinxronizasiya və ehtiyat nüsxə bu açarı avtomatik götürür
// (utils/userBackup.js — qadağan siyahısı yanaşması; keş deyil).
// tests/unit/quranNotes.test.js
// ═══════════════════════════════════════════════════════

export const NOTES_KEY = 'quran_notes_v1'
export const NOTES_EVENT = 'quran-notes-change'
export const NOTE_COLORS = ['gold', 'green', 'blue', 'rose', 'violet']
export const NOTE_MAX = 2000
export const HISTORY_MAX = 3
const HISTORY_CHARS = 2000

export const noteKey = (s, a) => `${s}:${a}`
const KEY_RE = /^(\d{1,3}):(\d{1,3})$/
export function parseNoteKey(k) {
  const m = KEY_RE.exec(String(k))
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2])
  return s >= 1 && s <= 114 && a >= 1 && a <= 286 ? { s, a } : null
}

/** Əvvəlki versiyalar: [{ t, u }] — ən yenisi əvvəldə, ≤ HISTORY_MAX, cəmi ≤ HISTORY_CHARS simvol */
function cleanHistory(h) {
  if (!Array.isArray(h)) return []
  const out = []
  let chars = 0
  for (const x of h) {
    if (!x || typeof x.t !== 'string' || !x.t.trim() || !Number.isFinite(x.u)) continue
    const t = x.t.slice(0, NOTE_MAX)
    if (chars + t.length > HISTORY_CHARS || out.length >= HISTORY_MAX) break
    chars += t.length
    out.push({ t, u: x.u })
  }
  return out
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
    if (Number.isFinite(v.d) && v.d > 0) n.d = n.u ? Math.min(v.d, n.u) : v.d
    const h = cleanHistory(v.h)
    if (h.length) n.h = h
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

/**
 * Qeydi yaz (yeni xəritə qaytarır). Rəng də, mətn də boşdursa — silinir.
 * İlk yazılma vaxtı (d) saxlanır; mətn dəyişəndə köhnə mətn tarixçəyə (h) düşür.
 */
export function setNote(map, key, { c = '', t = '', w, p } = {}, now = Date.now()) {
  if (!parseNoteKey(key)) return map
  const next = { ...map }
  const prev = map?.[key]
  let h = prev?.h || []
  if (prev?.t && prev.t.trim() && prev.t !== String(t ?? '').slice(0, NOTE_MAX)) h = [{ t: prev.t, u: prev.u || now }, ...h]
  const clean = sanitizeNotes({ [key]: { c, t, w, p, u: now, d: prev ? (prev.d || prev.u || now) : now, h } })[key]
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
 * sort: 'date' (ən yeni əvvəldə) | 'surah' (Quran sırası ilə)
 */
export function listNotes(map, { color = '', q = '', nameOf, sort = 'date' } = {}) {
  const query = fold(q).trim()
  const bySurah = (x, y) => (x.s - y.s) || (x.a - y.a)
  return Object.entries(map || {})
    .map(([key, v]) => ({ key, ...parseNoteKey(key), ...v }))
    .filter(n => n.s && (!color || n.c === color))
    .filter(n => !query || fold(`${n.t} ${n.w || ''} ${n.key} ${nameOf ? nameOf(n.s) : ''}`).includes(query))
    .sort(sort === 'surah' ? bySurah : (x, y) => (y.u - x.u) || bySurah(x, y))
}

export const noteDay = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

/**
 * Dəftəri fayl kimi ixrac: format 'md' (Markdown) | 'txt'.
 * list — listNotes nəticəsi; o: { title, labelOf(s, a), colorName(c), wrote, edited } (tərcümə olunmuş)
 */
export function exportNotes(list, format = 'md', o = {}) {
  const md = format === 'md'
  const lines = [md ? `# ${o.title || 'Quran'}` : (o.title || 'Quran'), '']
  for (const n of list || []) {
    const head = `${o.labelOf ? o.labelOf(n.s, n.a) : n.key} (${n.key})`
    lines.push(md ? `## ${head}` : head)
    const meta = []
    if (n.c) meta.push(o.colorName ? o.colorName(n.c) : n.c)
    if (n.d) meta.push(`${o.wrote || 'Written'}: ${noteDay(n.d)}`)
    if (n.u && (!n.d || noteDay(n.u) !== noteDay(n.d))) meta.push(`${o.edited || 'Edited'}: ${noteDay(n.u)}`)
    if (meta.length) lines.push(md ? `*${meta.join(' · ')}*` : meta.join(' · '))
    if (n.w) lines.push(md ? `> ${n.w}` : `« ${n.w} »`)
    if (n.t) lines.push('', n.t)
    lines.push('', md ? '---' : '----------', '')
  }
  return lines.join('\n')
}

export function notesFileName(format = 'md', now = new Date()) {
  return `muslims-cc-quran-notes-${noteDay(now.getTime())}.${format === 'md' ? 'md' : 'txt'}`
}

/** Tarixçədən bərpa: əvvəlki mətn cari olur (cari mətn tarixçəyə düşür) */
export function restoreVersion(map, key, idx, now = Date.now()) {
  const n = map?.[key]
  const v = n?.h?.[idx]
  if (!v) return map
  return setNote({ ...map, [key]: { ...n, h: n.h.filter((_, i) => i !== idx) } }, key, { c: n.c, t: v.t, w: n.w, p: n.p }, now)
}

/** Hər rəngdə neçə qeyd var: { gold: 2, … } */
export function countByColor(map) {
  const out = Object.fromEntries(NOTE_COLORS.map(c => [c, 0]))
  for (const v of Object.values(map || {})) if (v.c && v.c in out) out[v.c]++
  return out
}
