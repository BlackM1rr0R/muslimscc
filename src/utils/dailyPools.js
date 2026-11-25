// ═══════════════════════════════════════════════════════
// "Günün xatırlatmaları" zolağının hovuzları (DailyReminderBar.jsx)
//
// PERFORMANS: bu funksiyalar BUILD ZAMANI (vite.config.js → dailyPoolsPlugin)
// Node-da işləyir və nəticə "virtual:daily-pools/<dil>" modulları kimi brauzerə gedir.
// Əvvəl DailyReminderBar bütöv QUOTES (400 element, ~56 KB gzip) və DUAS_DATA
// (~16 KB gzip) fayllarını ana səhifədə yükləyirdi — zolaq isə onlardan yalnız
// 3 hovuz və hər elementin 3–4 sahəsini istifadə edir (~38 KB gzip, 4 dil birlikdə).
// 2026-11-25: hər dil üçün ayrıca modul (localizeDailyPools) — brauzerə yalnız cari
// dilin tərcüməsi gedir: az/en/ru/tr ~15–17 KB, ar ~8 KB gzip (ölçülüb).
// Seçim qaydası DƏYİŞMƏYİB: eyni filtr, eyni sıra, eyni qısalıq həddi (bütün 4 dilin
// mətninə görə) — o gün hər dildə eyni element seçilir.
//
// Bu fayl React-dan və brauzerdən asılı deyil.
// ═══════════════════════════════════════════════════════

export const TEXT_LANGS = ['az', 'en', 'ru', 'tr']
/** Ayrıca hovuz modulu olan dillər (əlavə dillərin interfeysi "en"-dir — src/utils/uiText.js) */
export const POOL_LANGS = [...TEXT_LANGS, 'ar']

// Bütün dillərdə ən uzun tərcümə — seçim dildən asılı olmasın deyə
const maxLen = (texts) => Math.max(0, ...TEXT_LANGS.map(l => (texts?.[l] || '').length))

/** Qısa mətnlərə üstünlük ver; heç biri uyğun gəlmirsə bütün siyahı */
function preferShort(list, getTexts, limit) {
  const short = list.filter(x => maxLen(getTexts(x)) <= limit)
  return short.length ? short : list
}

/** Obyektdən yalnız verilən sahələr (olmayanlar yazılmır). */
const pickFields = (obj, keys) => {
  const out = {}
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}

/**
 * Hovuzlar (sıra data faylındakı kimidir).
 * @param {Array} QUOTES     src/data/quotes.js
 * @param {Array} DUAS_DATA  src/data/duas.js
 * @returns {{ AYAH_POOL: Array, HADITH_POOL: Array, DUA_POOL: Array }}
 *   yalnız zolağın oxuduğu sahələr: quote → ar, text, source; dua → ar, source, az/en/ru/tr
 */
export function buildDailyPools(QUOTES, DUAS_DATA) {
  const AYAH_POOL = preferShort(QUOTES.filter(q => q.cat === 'quran' && q.ar && q.source), q => q.text, 140)
  const HADITH_POOL = preferShort(QUOTES.filter(q => q.cat === 'hadith' && q.ar && q.source), q => q.text, 100)
  const DUA_POOL = preferShort(DUAS_DATA.filter(d => d.ar && d.source), d => d, 140)
  const Q_FIELDS = ['ar', 'text', 'source']
  const D_FIELDS = ['ar', 'source', ...TEXT_LANGS]
  return {
    AYAH_POOL: AYAH_POOL.map(q => pickFields(q, Q_FIELDS)),
    HADITH_POOL: HADITH_POOL.map(q => pickFields(q, Q_FIELDS)),
    DUA_POOL: DUA_POOL.map(d => pickFields(d, D_FIELDS)),
  }
}

/**
 * Hovuzların BİR dil üçün surəti (vite.config.js → "virtual:daily-pools/<dil>").
 * Element: { ar, source, t? } — sıra və say buildDailyPools-dakı kimidir.
 *   t — zolağın göstərdiyi tərcümə; əvvəl brauzerdə pickUi(text, lang, 'en') ilə
 *       seçilirdi: text[lang] || text.en (dua: d[lang] || d.en). Ərəb dilində
 *       tərcümə göstərilmir — t yazılmır. Əlavə dilin lüğəti (uiText → txt) əvvəlki
 *       kimi brauzerdə tətbiq olunur (DailyReminderBar → buildDailyItems).
 * @param {{ AYAH_POOL: Array, HADITH_POOL: Array, DUA_POOL: Array }} pools — buildDailyPools()
 * @param {string} lang — POOL_LANGS
 */
export function localizeDailyPools(pools, lang) {
  const withT = lang !== 'ar'
  const one = (x, texts) => {
    const o = { ar: x.ar, source: x.source }
    if (withT) {
      const t = texts ? (texts[lang] || texts.en) : undefined
      if (t !== undefined) o.t = t
    }
    return o
  }
  return {
    AYAH_POOL: pools.AYAH_POOL.map(q => one(q, q.text)),
    HADITH_POOL: pools.HADITH_POOL.map(q => one(q, q.text)),
    DUA_POOL: pools.DUA_POOL.map(d => one(d, d)),
  }
}
