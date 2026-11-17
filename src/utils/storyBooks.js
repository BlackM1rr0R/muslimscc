// ═══════════════════════════════════════════════════════
// Şəkilli hekayə kitabları (components/StoryBooks.jsx) — saf məntiq
//
// • Mətn uşaq bölməsinin hekayələrindən (data/pageGuides/KidsPage.js → STORIES)
//   OLDUĞU KİMİ götürülür: heç bir söz dəyişmir, əlavə olunmur. Yalnız cümlə
//   sərhədlərində səhifələrə bölünür — bütün səhifələrin birləşməsi orijinal
//   mətnin özüdür (tests/unit/story-books.test.js bunu hər dil üçün yoxlayır).
// • Cümlə sərhədi: . ! ? … ؟ (+ bağlayan dırnaq), sonra boşluq və kiçik hərflə
//   ya tire ilə başlamayan davam. Dırnaq («…», “…”) içində bölmək olmaz.
// • Çox uzun cümlə (ərəbcə mətn adətən 1–3 cümlədir) dırnaqdan kənardakı
//   «،» / «;» / «؛» işarəsində bölünə bilər — yenə də söz dəyişmir.
// • Səhnə seçimi: səhifənin ortası mətnin hansı hissəsinə düşür (0…1) —
//   bütün dillərdə hekayə eyni ardıcıllıqla danışıldığı üçün şəkil uyğun gəlir.
// • Son səhifə yaddaşı: localStorage "muslim_cc_storybooks" (yalnız try içində).
// ═══════════════════════════════════════════════════════

export const STORAGE_KEY = 'muslim_cc_storybooks'

const END = new Set(['.', '!', '?', '…', '؟'])
const OPEN_Q = new Set(['«', '“', '„', '‹'])
const CLOSE_Q = new Set(['»', '”', '›'])
const TRAIL = new Set(['»', '”', '›', ')', '"', '’'])
const CLAUSE = new Set(['،', ';', '؛'])
const LOWER = /\p{Ll}/u
const DASH = /[—–-]/

/**
 * Mətni cümlələrə böl. Hər hissə öz sonundakı boşluqla birlikdədir, ona görə
 * splitSentences(t).join('') === t həmişə doğrudur.
 */
export function splitSentences(text) {
  const s = String(text ?? '')
  const out = []
  let start = 0
  let depth = 0
  let straight = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (OPEN_Q.has(c)) { depth++; continue }
    if (CLOSE_Q.has(c)) { depth = Math.max(0, depth - 1); continue }
    if (c === '"') { straight = !straight; continue }
    if (!END.has(c)) continue
    // sona yapışan nöqtələr və bağlayan dırnaqlar («…!» , “…?”)
    let j = i + 1
    let d = depth, st = straight
    while (j < s.length && (END.has(s[j]) || TRAIL.has(s[j]))) {
      if (CLOSE_Q.has(s[j])) d = Math.max(0, d - 1)
      else if (s[j] === '"') st = !st
      j++
    }
    depth = d
    straight = st
    if (depth > 0 || straight) { i = j - 1; continue }          // dırnaq hələ açıqdır
    let k = j
    while (k < s.length && /\s/.test(s[k])) k++
    if (k === j && k < s.length) { i = j - 1; continue }      // boşluq yoxdur: "3.5", "a.b"
    if (k < s.length && (LOWER.test(s[k]) || DASH.test(s[k]))) { i = k - 1; continue } // «…!» — dedi / “…!” dedi
    out.push(s.slice(start, k))
    start = k
    i = k - 1
  }
  if (start < s.length) out.push(s.slice(start))
  return out
}

/** Uzun cümləni dırnaqdan kənardakı ، ; ؛ işarələrində hissələrə böl (birləşməsi = orijinal). */
export function splitClauses(sentence) {
  const s = String(sentence ?? '')
  const out = []
  let start = 0
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (OPEN_Q.has(c)) depth++
    else if (CLOSE_Q.has(c)) depth = Math.max(0, depth - 1)
    else if (CLAUSE.has(c) && depth === 0) {
      let k = i + 1
      while (k < s.length && /\s/.test(s[k])) k++
      if (k < s.length) { out.push(s.slice(start, k)); start = k }
      i = k - 1
    }
  }
  if (start < s.length) out.push(s.slice(start))
  return out
}

/**
 * Səhifələr: cümlələri ardıcıl yığır, səhifə maxChars-dan uzun olmasın
 * (tək cümlə uzundursa, öz səhifəsini tutur). Hər səhifə { text, from, to } —
 * from/to orijinal mətndəki simvol mövqeləridir.
 */
export function paginate(text, { maxChars = 125, clauseOver = 125 } = {}) {
  const s = String(text ?? '')
  if (!s) return []
  const units = []
  for (const sen of splitSentences(s)) {
    if (sen.trim().length > clauseOver) units.push(...splitClauses(sen))
    else units.push(sen)
  }
  const pages = []
  let cur = ''
  let from = 0
  let pos = 0
  for (const u of units) {
    if (cur && (cur + u).trim().length > maxChars) {
      pages.push({ text: cur, from, to: pos })
      cur = ''
      from = pos
    }
    cur += u
    pos += u.length
  }
  if (cur) pages.push({ text: cur, from, to: pos })
  // çox qısa son səhifə (məs. «— dedi.») əvvəlkinə qoşulur
  if (pages.length > 1 && pages[pages.length - 1].text.trim().length < 28) {
    const last = pages.pop()
    const prev = pages[pages.length - 1]
    pages[pages.length - 1] = { text: prev.text + last.text, from: prev.from, to: last.to }
  }
  return pages
}

/** Səhifənin ortası mətnin hansı nisbətinə düşür (0…1) */
export function pageFraction(page, total) {
  if (!page || !total) return 0
  return Math.min(1, Math.max(0, (page.from + page.to) / 2 / total))
}

/** Nisbətə görə səhnə "addımı": beats = [{ at: 0 }, { at: .3 }, …] (artan) */
export function beatAt(beats, frac) {
  let idx = 0
  for (let i = 0; i < beats.length; i++) if (frac >= beats[i].at) idx = i
  return idx
}

/** "Nuh (Noah)" → "nuh", "Ibrahim and Ismail" → "ibrahim-and-ismail" */
export function bookId(story) {
  const n = String(story?.name?.en || story?.name?.az || '')
  return n.replace(/\(.*?\)/g, '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'book'
}

/** "2:30-37" → { s: 2, a: 30, to: 37 }; yanlışdırsa null */
export function parseRef(ref) {
  const m = /^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(String(ref ?? '').trim())
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2]), to = m[3] ? Number(m[3]) : a
  if (s < 1 || s > 114 || a < 1 || to < a) return null
  return { s, a, to }
}

// ── Yaddaş: { [bookId]: pageIndex, __last: bookId } — __last: "Davam et" kartı üçün son açılan kitab ──
export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out = {}
    for (const [k, v] of Object.entries(raw)) if (Number.isInteger(v) && v >= 0 && v < 200) out[k] = v
    return out
  } catch { return {} }
}

export function saveProgress(id, page) {
  try {
    const cur = loadProgress()
    cur[id] = Math.max(0, Math.floor(page) || 0)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, __last: id }))
    return cur
  } catch { return null }
}

/** Kiçik deterministik "təsadüf" (səhnədəki ulduz, çiçək yerləri üçün) */
export function rng(seed = 1) {
  let x = (seed * 2654435761) >>> 0 || 1
  return () => {
    x ^= x << 13; x >>>= 0
    x ^= x >>> 17
    x ^= x << 5; x >>>= 0
    return x / 4294967296
  }
}
