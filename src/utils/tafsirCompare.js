// ═══════════════════════════════════════════════════════
// Təfsirlərin müqayisəsi (components/quran/TafsirCompare.jsx) — saf köməkçilər.
//
// MƏNBƏ: yalnız utils/tafsir.js kataloqu (Quran.com API v4 — api.quran.com,
// CSP connect-src-də artıq var). Mətn fetchTafsir ilə gəlir: API-nin mətni
// SÖZBƏSÖZ, yalnız sanitizer HTML teqlərini təmizləyir; heç nə qısaldılmır,
// tərcümə və ya süni intellektlə yaradılmır.
// Saytın öz azərbaycanca əl-Müyəssəri (local: true) QƏSDƏN çıxarılıb —
// o, ərəb əslindən süni intellekt köməyi ilə tərcümədir, müqayisə isə yalnız
// nəşr olunmuş mətnləri yan-yana qoyur.
//
// Seçim cihaz tərcihidir (quran_tafsir seçimi kimi): localStorage
// "quran_tafsir_compare" = { az: [14, 91, 16], … } — dil üzrə, sinxron deyil.
// ═══════════════════════════════════════════════════════
import { TAFSIRS, getTafsir } from './tafsir'
import { SURAH_TABLE } from '../data/mushafIndex'

export const COMPARE_MAX = 3
export const COMPARE_TAFSIRS = TAFSIRS.filter(t => !t.local)
const COMPARE_IDS = new Set(COMPARE_TAFSIRS.map(t => t.id))
export const isComparable = id => COMPARE_IDS.has(Number(id))

// Susmaya görə: İbn Kəsir, əs-Sədi, əl-Müyəssər — istifadəçinin dilində olanı varsa o
export const DEFAULT_COMPARE = {
  az: [14, 91, 16],
  en: [169, 91, 16],
  ru: [170, 14, 16],
  ar: [14, 91, 16],
  tr: [169, 91, 16],
}
export const defaultCompare = lang => [...(DEFAULT_COMPARE[lang] || DEFAULT_COMPARE.en)]

/** Etibarlı, təkrarsız, ən çox 3 id; boş qalarsa — null */
export function cleanCompareIds(v) {
  if (!Array.isArray(v)) return null
  const out = []
  for (const x of v) {
    const id = Number(x)
    if (isComparable(id) && !out.includes(id)) out.push(id)
    if (out.length === COMPARE_MAX) break
  }
  return out.length ? out : null
}

const KEY = 'quran_tafsir_compare'
function readAll() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
}
export function readCompareChoice(lang) {
  return cleanCompareIds(readAll()[lang]) || defaultCompare(lang)
}
export function saveCompareChoice(lang, ids) {
  const clean = cleanCompareIds(ids)
  if (!clean) return
  try { localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [lang]: clean })) } catch { /* yaddaş bağlıdır */ }
}

/** Seçimi dəyiş: varsa çıxar (sonuncunu yox), yoxdursa əlavə et (3-dən çox yox) */
export function toggleCompareId(ids, id) {
  const n = Number(id)
  if (!isComparable(n)) return ids
  if (ids.includes(n)) return ids.length > 1 ? ids.filter(x => x !== n) : ids
  return ids.length < COMPARE_MAX ? [...ids, n] : ids
}

// ── Ayə naviqasiyası (surə sərhədindən keçir: 1:7 → 2:1) ──
export const ayahCount = s => SURAH_TABLE[Number(s) - 1]?.[2] || 0
export const isValidAyah = (s, a) => Number.isInteger(+s) && Number.isInteger(+a) && a >= 1 && a <= ayahCount(s)

/** dir = -1 | 1 → { s, a } və ya null (1:1-dən əvvəl, 114:6-dan sonra) */
export function neighbourAyah(s, a, dir) {
  s = Number(s); a = Number(a)
  if (!isValidAyah(s, a)) return null
  if (dir > 0) {
    if (a < ayahCount(s)) return { s, a: a + 1 }
    return s < 114 ? { s: s + 1, a: 1 } : null
  }
  if (a > 1) return { s, a: a - 1 }
  return s > 1 ? { s: s - 1, a: ayahCount(s - 1) } : null
}

/** Surənin adı: ərəbcə interfeysdə ərəb adı, qalanlarında API-nin latın adı */
export const surahLabel = (s, lang) => {
  const row = SURAH_TABLE[Number(s) - 1]
  return row ? (lang === 'ar' ? row[4] : row[5]) : ''
}

/** Mənbə: quran.com-dakı həmin ayənin həmin təfsir səhifəsi + nəşr id-si */
export function compareSource(id, s, a) {
  const t = getTafsir(id)
  if (!t) return null
  return { url: `https://quran.com/${s}:${a}/tafsirs/${t.slug}`, edition: `Quran.com API v4 · #${t.id} · ${t.slug}` }
}
