// ═══════════════════════════════════════════════════════
// Mənim kitabxanam (H3) — rəflər ("oxuyuram", "oxudum", "oxumaq istəyirəm"), qaldığım səhifə və
// qısa şəxsi qeyd. Saf məntiq + localStorage (React-sız). Profilə aiddir (PROFILE_KEYS),
// hesabla şifrəli sinxronlanır (utils/syncMergers → books_shelf_v1).
//
// Kitablar saytda oxunmur — xarici PDF linki açılır (pages/BooksPage). Ona görə "qaldığım səhifə"
// istifadəçinin özünün yazdığı rəqəmdir. "Oxuyuram" rəfindəki kitablar "Davam et" siyahısına
// düşür (utils/continueItems → key 'book'); ad yalnız göstərmək üçün yadda saxlanır (kitab
// serverdən silinsə də siyahı sınmasın).
//
//   books_shelf_v1 = { v: 1, b: { <kitab id>: { s: 'reading'|'read'|'want', p?: səhifə, n?: qeyd, t?: ad, at: ms } } }
// tests/unit/book-shelf.test.js
// ═══════════════════════════════════════════════════════

export const SHELF_KEY = 'books_shelf_v1'
export const SHELF_EVENT = 'mcc-bookshelf'
export const SHELVES = ['reading', 'want', 'read']
export const NOTE_MAX = 500
export const TITLE_MAX = 120
export const MAX_BOOKS = 300
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

const cleanText = (v, max) => (typeof v === 'string'
  ? [...v.normalize('NFC').replace(/[\p{Cc}‪-‮⁦-⁩]/gu, (c) => (c === '\n' ? c : '')).trim()].slice(0, max).join('')
  : '')

export const validBookId = (id) => typeof id === 'string' && ID_RE.test(id)

export function cleanEntry(e) {
  if (!isObj(e) || !SHELVES.includes(e.s)) return null
  const out = { s: e.s, at: Number.isFinite(Number(e.at)) && Number(e.at) > 0 ? Math.round(Number(e.at)) : 0 }
  const p = Math.round(Number(e.p))
  if (Number.isFinite(p) && p >= 1 && p <= 20000) out.p = p
  const n = cleanText(e.n, NOTE_MAX)
  if (n) out.n = n
  const t = cleanText(e.t, TITLE_MAX).replace(/\s+/g, ' ')
  if (t) out.t = t
  return out
}

export function sanitizeShelf(raw) {
  let o = raw
  if (typeof raw === 'string') { try { o = JSON.parse(raw) } catch { o = null } }
  const b = {}
  const src = isObj(o?.b) ? o.b : {}
  const ids = Object.keys(src).filter(validBookId)
    .sort((x, y) => (Number(src[y]?.at) || 0) - (Number(src[x]?.at) || 0)).slice(0, MAX_BOOKS)
  for (const id of ids) { const e = cleanEntry(src[id]); if (e) b[id] = e }
  return { v: 1, b }
}

/** Kitabın qeydini dəyiş (patch: { s?, p?, n?, t? }); s: null — rəfdən çıxar (qeyd də silinir) */
export function setEntry(shelf, id, patch, now = Date.now()) {
  if (!validBookId(id)) return shelf
  const b = { ...shelf.b }
  if (patch && patch.s === null) { delete b[id]; return { v: 1, b } }
  const cur = b[id] || { s: 'want' }
  const e = cleanEntry({ ...cur, ...patch, at: now })
  if (e) b[id] = e
  return sanitizeShelf({ v: 1, b })
}

/** Rəf üzrə siyahı (ən təzə əvvəl) */
export function onShelf(shelf, s) {
  return Object.entries(shelf.b).filter(([, e]) => e.s === s)
    .sort((a, b) => b[1].at - a[1].at).map(([id, e]) => ({ id, ...e }))
}
export function shelfCounts(shelf) {
  const c = { reading: 0, want: 0, read: 0 }
  for (const e of Object.values(shelf.b)) c[e.s]++
  return c
}

/** "Davam et" üçün — "oxuyuram" rəfindəki ən təzə kitab | null */
export function currentBook(shelf) {
  return onShelf(shelf, 'reading')[0] || null
}

const ls = () => { try { return globalThis.localStorage } catch { return null } }
export function readShelf(storage = ls()) {
  try { return sanitizeShelf(storage?.getItem(SHELF_KEY)) } catch { return sanitizeShelf(null) }
}
export function saveShelf(shelf, storage = ls()) {
  const c = sanitizeShelf(shelf)
  try {
    if (!Object.keys(c.b).length) storage?.removeItem(SHELF_KEY)
    else storage?.setItem(SHELF_KEY, JSON.stringify(c))
  } catch { /* yaddaş bağlıdır */ }
  try { window.dispatchEvent(new CustomEvent(SHELF_EVENT)) } catch { /* SSR */ }
  return c
}

/** Sinxronizasiya: kitab üzrə 3 tərəfli; hər iki cihaz dəyişibsə — daha təzə (at) qalib gəlir */
export function mergeShelf(L, R, B) {
  const l = sanitizeShelf(L).b, r = sanitizeShelf(R).b, b = B === undefined ? {} : sanitizeShelf(B).b
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y)
  const out = {}
  for (const id of new Set([...Object.keys(l), ...Object.keys(r), ...Object.keys(b)])) {
    const x = l[id], y = r[id], o = b[id]
    let v
    if (same(x, y)) v = x
    else if (same(x, o)) v = y
    else if (same(y, o)) v = x
    else if (!x || !y) v = x || y
    else v = (y.at > x.at ? y : x)
    if (v) out[id] = v
  }
  return sanitizeShelf({ v: 1, b: out })
}
