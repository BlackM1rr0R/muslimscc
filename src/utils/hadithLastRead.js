// ═══════════════════════════════════════════════════════
// Hədis — son oxunan yer ("Davam et" kartı: components/ContinueCard)
//
// localStorage "muslim_cc_hadith_last" — ehtiyat nüsxəyə və hesab sinxronizasiyasına DÜŞÜR
// (utils/userBackup — qadağan siyahısında deyil):
//   { src: 'lib',  book: 'bukhari', sec: 3, n: 25, lang: 'az', at }   — /hadith-library#bukhari/3/25
//   { src: 'site', id: 412, lang: 'en', at }                         — /hadith/412
// Yazı yüngüldür (bir kiçik açar) və eyni hədis təkrar yazılmır; ardıcıl açılışlarda (oxu
// pəncərəsində "növbəti" basdıqca) yalnız sonuncu, qısa gecikmə ilə yazılır.
// ═══════════════════════════════════════════════════════

export const HADITH_LAST_KEY = 'muslim_cc_hadith_last'
const DEBOUNCE_MS = 700

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const BOOK_RE = /^[a-z0-9_-]{2,24}$/
const NUM_RE = /^[0-9]{1,6}[a-z]?$/
const LANG_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/

/** Yoxlanmış yazı və ya null (pozuq / yad məlumat göstərilmir) */
export function cleanHadithEntry(v) {
  if (!v || typeof v !== 'object') return null
  const lang = typeof v.lang === 'string' && LANG_RE.test(v.lang) ? v.lang : null
  const at = Number.isFinite(v.at) && v.at > 0 ? v.at : 0
  if (v.src === 'lib') {
    const sec = Number(v.sec)
    if (!BOOK_RE.test(String(v.book || '')) || !Number.isInteger(sec) || sec < 0 || sec > 100000 || !NUM_RE.test(String(v.n ?? ''))) return null
    const n = /^\d+$/.test(String(v.n)) ? Number(v.n) : String(v.n)
    return { src: 'lib', book: v.book, sec, n, lang, at }
  }
  if (v.src === 'site') {
    if (!NUM_RE.test(String(v.id ?? ''))) return null
    const id = /^\d+$/.test(String(v.id)) ? Number(v.id) : String(v.id)
    return { src: 'site', id, lang, at }
  }
  return null
}

export function readHadithLast(storage = safeStorage()) {
  try { return cleanHadithEntry(JSON.parse(storage?.getItem(HADITH_LAST_KEY) || 'null')) } catch { return null }
}

let timer = 0
let pending = null
let lastSig = ''

function flush(storage) {
  const e = pending
  pending = null
  timer = 0
  if (!e) return false
  try { storage?.setItem(HADITH_LAST_KEY, JSON.stringify(e)); return true } catch { return false }
}

/**
 * Hədisin açıldığını qeyd et. entry: { src, book, sec, n } | { src, id } + lang.
 * opts.immediate — gecikməsiz (testlər). → true (yazıldı / növbəyə düşdü) | false (səhv / eynidir)
 */
export function recordHadithRead(entry, { now = Date.now(), storage = safeStorage(), immediate = false } = {}) {
  const e = cleanHadithEntry({ ...entry, at: now })
  if (!e) return false
  const sig = e.src === 'lib' ? `lib/${e.book}/${e.sec}/${e.n}/${e.lang}` : `site/${e.id}/${e.lang}`
  if (sig === lastSig && !pending) return false
  lastSig = sig
  pending = e
  if (immediate || typeof setTimeout !== 'function') { if (timer) clearTimeout(timer); return flush(storage) }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => flush(storage), DEBOUNCE_MS)
  return true
}

/** testlər üçün */
export function _resetHadithLast() { if (timer) clearTimeout(timer); timer = 0; pending = null; lastSig = '' }
