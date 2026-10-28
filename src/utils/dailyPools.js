// ═══════════════════════════════════════════════════════
// "Günün xatırlatmaları" zolağının hovuzları (DailyReminderBar.jsx)
//
// PERFORMANS: bu funksiyalar BUILD ZAMANI (vite.config.js → dailyPoolsPlugin)
// Node-da işləyir və nəticə "virtual:daily-pools" modulu kimi brauzerə gedir.
// Əvvəl DailyReminderBar bütöv QUOTES (400 element, ~56 KB gzip) və DUAS_DATA
// (~16 KB gzip) fayllarını ana səhifədə yükləyirdi — zolaq isə onlardan yalnız
// 3 hovuz və hər elementin 3–4 sahəsini istifadə edir (~40 KB gzip).
// Seçim qaydası DƏYİŞMƏYİB: eyni filtr, eyni sıra, eyni qısalıq həddi.
//
// Bu fayl React-dan və brauzerdən asılı deyil.
// ═══════════════════════════════════════════════════════

export const TEXT_LANGS = ['az', 'en', 'ru', 'tr']

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
