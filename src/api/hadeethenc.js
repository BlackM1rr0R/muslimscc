// ═══════════════════════════════════════════════════════════
// HadeethEnc.com API (v1) — Hədis ensiklopediyası bölməsi üçün
//
// Rəsmi layihə (IslamHouse ilə eyni qurum). Sənəd: https://hadeethenc.com/api/v1/
// Brauzerdən birbaşa çağırılır — server "Access-Control-Allow-Origin: *" qaytarır.
//   /languages
//   /categories/roots/?language=xx         — 7 əsas bölmə
//   /categories/list/?language=xx          — bütün bölmələr (parent_id ilə ağac)
//   /hadeeths/list/?language=xx&category_id=N&page=P&per_page=K
//        → { data: [{ id, title, translations }], meta: { current_page, last_page, total_items, per_page } }
//   /hadeeths/one/?language=xx&id=N        — tam hədis (yoxdursa 404)
//
// İstifadə şərtləri (saytdakı "Terms and Policies"): məzmunu dəyişməmək,
// mənbəni (HadeethEnc.com) aydın göstərmək, son versiyanı işlətmək.
// Ona görə mətn heç vaxt dəyişdirilmir — yalnız sətir sonlarındakı boşluq
// (\r) atılır; keş qısa müddətlidir (sessiya), həmişə canlı API-dən gəlir.
//
// Keş: sessionStorage ("he1:<yol>"), yaddaş bağlıdırsa — yalnız yaddaşda.
// Eyni anda eyni sorğu təkrar göndərilmir (inflight xəritəsi).
// ═══════════════════════════════════════════════════════════

export const HE_BASE = 'https://hadeethenc.com/api/v1'
export const HE_SITE = 'https://hadeethenc.com'
/** Saytımızın 5 dili HadeethEnc-də var (2026-11 yoxlanıb). */
export const HE_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
/** Əlavə dillər (src/seo/langs.js) — 20-sinin hamısı HadeethEnc-də var (2026-11-06, /api/v1/languages). */
export const HE_EXTRA_LANGS = ['id', 'ur', 'bn', 'fa', 'ms', 'fr', 'de', 'es', 'pt', 'hi', 'uz', 'sw', 'ha', 'so', 'ps', 'bs', 'sq', 'it', 'nl', 'zh',
  // 2026-11-07 — QuranEnc dilləri; HadeethEnc-də hamısı var
  'ta', 'ml', 'te', 'kn', 'gu', 'pa', 'as', 'am', 'om', 'yo', 'ff', 'rw', 'ku', 'ky', 'tg', 'ug', 'th', 'vi', 'tl', 'km', 'ja', 'sv', 'ro', 'sr', 'si']
export const HE_ALL_LANGS = [...HE_LANGS, ...HE_EXTRA_LANGS]

const PREFIX = 'he1:'
const mem = new Map()
const inflight = new Map()

export class HeError extends Error {
  constructor(status, msg) {
    super(msg || `HTTP ${status}`)
    this.name = 'HeError'
    this.status = status
  }
}

function readCache(key) {
  if (mem.has(key)) return mem.get(key)
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (raw) { const v = JSON.parse(raw); mem.set(key, v); return v }
  } catch { /* yaddaş bağlıdır */ }
  return undefined
}
function writeCache(key, value) {
  mem.set(key, value)
  try { sessionStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* dolu və ya bağlı */ }
}

async function getJSON(path, { signal } = {}) {
  const hit = readCache(path)
  if (hit !== undefined) return hit
  if (inflight.has(path)) return inflight.get(path)
  const p = (async () => {
    const res = await fetch(HE_BASE + path, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new HeError(res.status)
    const data = await res.json()
    writeCache(path, data)
    return data
  })()
  inflight.set(path, p)
  try { return await p } finally { inflight.delete(path) }
}

const enc = encodeURIComponent

/** Bütün bölmələr: [{ id, title, count, parent }] — rəqəmlər ədədə çevrilir. */
export async function fetchCategories(lang, opts) {
  const list = await getJSON(`/categories/list/?language=${enc(lang)}`, opts)
  return (Array.isArray(list) ? list : []).map(c => ({
    id: String(c.id),
    title: String(c.title ?? ''),
    count: Number(c.hadeeths_count) || 0,
    parent: c.parent_id == null ? null : String(c.parent_id),
  }))
}

/** Bölmədəki hədislər (alt bölmələr daxil). */
export async function fetchHadeethList(lang, categoryId, page = 1, perPage = 24, opts) {
  const d = await getJSON(`/hadeeths/list/?language=${enc(lang)}&category_id=${enc(categoryId)}&page=${enc(page)}&per_page=${enc(perPage)}`, opts)
  const items = (Array.isArray(d?.data) ? d.data : []).map(h => ({ id: String(h.id), title: String(h.title ?? '') }))
  const m = d?.meta || {}
  return {
    items,
    page: Number(m.current_page) || page,
    lastPage: Number(m.last_page) || page,
    total: Number(m.total_items) || items.length,
  }
}

const clean = (s) => (s == null ? '' : String(s).replace(/\s+$/, ''))
const cleanList = (a) => (Array.isArray(a) ? a.map(clean).filter(Boolean) : [])
const cleanWords = (a) => (Array.isArray(a)
  ? a.filter(w => w && (w.word || w.meaning)).map(w => ({ word: clean(w.word).trim(), meaning: clean(w.meaning).trim() }))
  : [])

/**
 * Tək hədis. API "language=ar" olanda əsas sahələr ərəbcədir; digər dillərdə
 * tərcümə sahələri + "_ar" sonluqlu ərəbcə əsli gəlir. Burada vahid formaya salınır.
 * Hədis bu dildə yoxdursa HeError(404) atır.
 */
export async function fetchHadeeth(lang, id, opts) {
  const d = await getJSON(`/hadeeths/one/?language=${enc(lang)}&id=${enc(id)}`, opts)
  if (!d || typeof d !== 'object' || !d.id) throw new HeError(404)
  const isAr = lang === 'ar'
  return {
    id: String(d.id),
    lang,
    title: clean(d.title),
    text: clean(d.hadeeth),
    attribution: clean(d.attribution),
    grade: clean(d.grade),
    explanation: clean(d.explanation),
    hints: cleanList(d.hints),
    words: cleanWords(d.words_meanings),
    ar: {
      text: clean(isAr ? d.hadeeth : d.hadeeth_ar),
      attribution: clean(isAr ? d.attribution : d.attribution_ar),
      grade: clean(isAr ? d.grade : d.grade_ar),
      explanation: clean(isAr ? d.explanation : d.explanation_ar),
      hints: cleanList(isAr ? d.hints : d.hints_ar),
      words: cleanWords(isAr ? d.words_meanings : d.words_meanings_ar),
    },
    categories: Array.isArray(d.categories) ? d.categories.map(String) : [],
    translations: Array.isArray(d.translations) ? d.translations.map(String) : [],
  }
}

/** Keşdə olan hədis (kartda dərəcə çipi üçün) — şəbəkəyə getmir. */
export function cachedHadeeth(lang, id) {
  const d = readCache(`/hadeeths/one/?language=${enc(lang)}&id=${enc(id)}`)
  return d && d.id ? { grade: clean(d.grade) } : null
}

/** Hədisin HadeethEnc.com-dakı səhifəsi. */
export const hadeethUrl = (lang, id) => `${HE_SITE}/${encodeURIComponent(lang)}/browse/hadith/${encodeURIComponent(id)}`
