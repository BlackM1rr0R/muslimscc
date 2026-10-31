// ═══════════════════════════════════════════════════════
// Quran kökləri — saf köməkçilər + indeksin yüklənməsi
//
// İndeks: public/data/quran-roots.json (scripts/build-quran-roots.mjs qurur;
// mənbə Quranic Arabic Corpus morfologiyası, GPL v3). Formatı:
//   roots: { "رحم": [ [lemma, kateqoriya, feil_babı, "1:1:3,3:1,…"], … ] }
// Yerlər sıxılıb: surə əvvəlki yerdəkinə bərabərdirsə yalnız "ayə:söz".
// Ayə mətni faylda yoxdur — səhifə onu Quran.com API-dən yükləyir.
// ═══════════════════════════════════════════════════════

export const ROOTS_URL = '/data/quran-roots.json'

/** [[s,a,w], …] (sıralı) → "1:1:3,3:1,2:255:3" */
export function encodeLocations(locs) {
  let prev = 0
  const parts = []
  for (const [s, a, w] of locs) {
    parts.push(s === prev ? `${a}:${w}` : `${s}:${a}:${w}`)
    prev = s
  }
  return parts.join(',')
}

/** "1:1:3,3:1,2:255:3" → [[1,1,3],[1,3,1],[2,255,3]] */
export function decodeLocations(str) {
  const out = []
  let s = 0
  for (const part of String(str || '').split(',')) {
    if (!part) continue
    const n = part.split(':').map(Number)
    if (n.length === 3) { s = n[0]; out.push([n[0], n[1], n[2]]) }
    else if (n.length === 2 && s) out.push([s, n[0], n[1]])
  }
  return out
}

// ── Giriş normallaşdırması ──
// Hərəkələr, tətvil, Quran işarələri, boşluq, tire, vergül atılır; ٱ → ا
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g
const SEPARATORS = /[\s\-_.,،؛;:/\\·]+/g
const SEPARATOR = /[\s\-_.,،؛;:/\\·]/

// Buckwalter transliterasiyası (corpus.quran.com-dakı kök yazılışı: rHm, Elm, qwl)
const BUCKWALTER = {
  A: 'ا', b: 'ب', t: 'ت', v: 'ث', j: 'ج', H: 'ح', x: 'خ', d: 'د', '*': 'ذ', r: 'ر', z: 'ز',
  s: 'س', $: 'ش', S: 'ص', D: 'ض', T: 'ط', Z: 'ظ', E: 'ع', g: 'غ', f: 'ف', q: 'ق', k: 'ك',
  l: 'ل', m: 'م', n: 'ن', h: 'ه', w: 'و', y: 'ي', "'": 'ء', '>': 'أ', '<': 'إ', '&': 'ؤ',
  '}': 'ئ', Y: 'ى', p: 'ة', '|': 'آ', '{': 'ا',
}
const isLatin = s => /[A-Za-z$*'><&}|{]/.test(s) && !/[؀-ۿ]/.test(s)

export function buckwalterToArabic(input) {
  let out = ''
  for (const ch of String(input || '')) {
    if (BUCKWALTER[ch]) out += BUCKWALTER[ch]
    else if (!SEPARATOR.test(ch)) return null   // naməlum latın hərfi — Buckwalter deyil
  }
  return out
}

/** İstifadəçinin yazdığı kök: "ر ح م", "رَحِمَ", "rHm" → "رحم" (alınmasa "") */
export function normalizeRootInput(input) {
  let s = String(input || '').trim()
  if (!s) return ''
  if (isLatin(s)) s = buckwalterToArabic(s.replace(SEPARATORS, '')) || ''
  return s.replace(MARKS, '').replace(SEPARATORS, '').replace(/ٱ/g, 'ا')
}

/** Həmzə/əlif fərqlərini nəzərə almayan açar: أله ≈ اله, سأل ≈ سال */
export function looseKey(root) {
  return String(root || '')
    .replace(/[أإآٱء]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/[ئى]/g, 'ي')
    .replace(/ة/g, 'ه')
}

/**
 * Kökü indeksdə tap. Qaytarır: { root, candidates } — root dəqiq (və ya
 * həmzəsiz tək uyğun) kökdür; bir neçə uyğun varsa candidates siyahısıdır.
 */
export function findRoot(roots, input) {
  const q = normalizeRootInput(input)
  if (!q || !roots) return { root: null, candidates: [] }
  if (Object.prototype.hasOwnProperty.call(roots, q)) return { root: q, candidates: [] }
  const lk = looseKey(q)
  const candidates = Object.keys(roots).filter(r => looseKey(r) === lk)
  if (candidates.length === 1) return { root: candidates[0], candidates: [] }
  return { root: null, candidates }
}

/**
 * Kökün xülasəsi: { total, forms: [{ lemma, cat, vf, count, locs }], locations }
 * locations — bütün formaların yerləri (surə/ayə/söz sırası ilə, ayə başına bir dəfə yox:
 * eyni ayədə iki söz varsa ikisi də qalır; ayə siyahısı üçün groupByAyah işlət).
 */
export function rootDetails(entries) {
  const forms = (entries || []).map(([lemma, cat, vf, enc]) => {
    const locs = decodeLocations(enc)
    return { lemma, cat, vf: Number(vf) || 0, count: locs.length, locs }
  })
  const locations = forms.flatMap(f => f.locs.map(l => [...l, f.lemma]))
    .sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2])
  return { total: locations.length, forms, locations }
}

/** Yerləri ayəyə görə qruplaşdır: [{ key:'2:255', s, a, words:[3,7], lemmas:[…] }] */
export function groupByAyah(locations) {
  const out = []
  let cur = null
  for (const [s, a, w, lemma] of locations) {
    const key = `${s}:${a}`
    if (!cur || cur.key !== key) { cur = { key, s, a, words: [], lemmas: [] }; out.push(cur) }
    if (!cur.words.includes(w)) cur.words.push(w)
    if (lemma && !cur.lemmas.includes(lemma)) cur.lemmas.push(lemma)
  }
  return out
}

/** Söz yeri → { root, lemma, cat } (mushafda "söz-söz" pəncərəsi üçün) */
export function buildWordIndex(roots) {
  const map = new Map()
  for (const [root, entries] of Object.entries(roots || {})) {
    for (const [lemma, cat, vf, enc] of entries) {
      for (const [s, a, w] of decodeLocations(enc)) map.set(`${s}:${a}:${w}`, { root, lemma, cat, vf: Number(vf) || 0 })
    }
  }
  return map
}

/** Kökün hərflərini ayır: "رحم" → "ر ح م" */
export const spacedRoot = root => [...String(root || '')].join(' ')

// ── Yükləmə (bir dəfə; xətada təkrar cəhd mümkündür) ──
let indexPromise = null
let wordIndex = null
export function loadRootsIndex(fetchImpl = globalThis.fetch) {
  if (!indexPromise) {
    indexPromise = (async () => {
      const res = await fetchImpl(ROOTS_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data || typeof data.roots !== 'object') throw new Error('bad-response')
      return data
    })()
    indexPromise.catch(() => { indexPromise = null })
  }
  return indexPromise
}
export async function loadWordIndex(fetchImpl) {
  if (wordIndex) return wordIndex
  const data = await loadRootsIndex(fetchImpl)
  wordIndex = wordIndex || buildWordIndex(data.roots)
  return wordIndex
}

// ── Nitq hissəsi və feil babı (Quranic Arabic Corpus kateqoriyaları) ──
export const ROOT_CAT_LABELS = {
  az: { V: 'feil', N: 'isim', ADJ: 'sifət', PN: 'xüsusi ad', AP: 'fail ismi', PP: 'məful ismi', VN: 'məsdər' },
  en: { V: 'verb', N: 'noun', ADJ: 'adjective', PN: 'proper noun', AP: 'active participle', PP: 'passive participle', VN: 'verbal noun' },
  ru: { V: 'глагол', N: 'имя', ADJ: 'прилагательное', PN: 'имя собственное', AP: 'действительное причастие', PP: 'страдательное причастие', VN: 'отглагольное имя' },
  ar: { V: 'فعل', N: 'اسم', ADJ: 'صفة', PN: 'اسم علم', AP: 'اسم فاعل', PP: 'اسم مفعول', VN: 'مصدر' },
  tr: { V: 'fiil', N: 'isim', ADJ: 'sıfat', PN: 'özel isim', AP: 'ism-i fâil', PP: 'ism-i mef’ûl', VN: 'mastar' },
}
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
// Ərəbcədə bab ölçü ilə adlanır
const AR_FORMS = ['', 'فَعَلَ', 'فَعَّلَ', 'فاعَلَ', 'أَفْعَلَ', 'تَفَعَّلَ', 'تَفاعَلَ', 'اِنْفَعَلَ', 'اِفْتَعَلَ', 'اِفْعَلَّ', 'اِسْتَفْعَلَ', 'اِفْعالَّ', 'اِفْعَوْعَلَ']
/** Feil babının adı: (2, 'az') → "II bab"; ərəbcədə ölçü: فَعَّلَ */
export function verbFormLabel(vf, lang) {
  const n = Number(vf)
  if (!Number.isInteger(n) || n < 1 || n >= ROMAN.length) return ''
  switch (lang) {
    case 'ar': return AR_FORMS[n]
    case 'ru': return `${ROMAN[n]} порода`
    case 'tr': return `${ROMAN[n]}. bab`
    case 'en': return `form ${ROMAN[n]}`
    default: return `${ROMAN[n]} bab`
  }
}

// ── Ayənin sözləri (Quran.com API v4) — kök səhifəsində vurğulamaq üçün ──
export const VERSE_API = 'https://api.quran.com/api/v4/verses/by_key'
const verseCache = new Map()
/** '2:255' → Promise<[{ p, text, type }]> (type: 'word' | 'end'); xəta: Error('offline'|'network'|'bad-response') */
export function fetchAyahWords(key, { fetchImpl } = {}) {
  if (!/^\d{1,3}:\d{1,3}$/.test(String(key))) return Promise.reject(new Error('bad-key'))
  if (verseCache.has(key)) return verseCache.get(key)
  const doFetch = fetchImpl || globalThis.fetch
  const p = (async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline')
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = setTimeout(() => ctrl?.abort(), 15000)
    let res
    try {
      res = await doFetch(`${VERSE_API}/${key}?words=true&word_fields=text_uthmani,char_type_name&fields=text_uthmani`, ctrl ? { signal: ctrl.signal } : undefined)
    } catch { throw new Error('network') } finally { clearTimeout(timer) }
    if (!res.ok) throw new Error('network')
    let data
    try { data = await res.json() } catch { throw new Error('bad-response') }
    const words = (data?.verse?.words || [])
      .filter(w => w.char_type_name === 'word' || w.char_type_name === 'end')
      .map(w => ({ p: Number(w.position), text: String(w.text_uthmani || w.text || ''), type: w.char_type_name }))
    if (!words.length) throw new Error('bad-response')
    return words
  })()
  verseCache.set(key, p)
  p.catch(() => verseCache.delete(key))
  return p
}
