// ═══════════════════════════════════════════════════════
// Muslims.cc — Marşrut & SEO meta reyestri
//
// Bu fayl saytın YEGANƏ həqiqət mənbəyidir:
//   • App.jsx marşrutlaşdırma üçün oxuyur
//   • Seo.jsx <head> qurmaq üçün oxuyur
//   • scripts/prerender.js statik HTML + sitemap.xml üçün oxuyur
// Yeni səhifə əlavə edərkən yalnız burada bir sətir yaz.
// ═══════════════════════════════════════════════════════

import { SURAH_SLUGS } from './surahSlugs.js'
import { NAME_SLUGS, REMOVED_NAME_SLUGS, SAHABA_SLUGS, SCHOLAR_SLUGS } from './detailSlugs.js'

export const SITE = 'https://muslims.cc'

export const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
export const DEFAULT_LANG = 'az'

// hreflang üçün tam locale kodları
export const LOCALES = {
  az: 'az_AZ', en: 'en_US', ru: 'ru_RU', ar: 'ar_SA', tr: 'tr_TR',
}

// ── Səhifələr ────────────────────────────────────────
// key      — App.jsx-dəki daxili ad (setPage(key) API-si dəyişmir)
// path     — dil prefiksindən sonrakı URL hissəsi ('' = ana səhifə)
// priority / changefreq — sitemap üçün
// noindex  — sitemap-dan və indeksləmədən kənar (admin səhifələri)
export const PAGES = [
  { key: 'home',         path: '',             priority: 1.0,  changefreq: 'daily'   },
  // Camaat/cümə, elanlar, xeyriyyə — ümumi platforma bölmələri.
  // Məscid dövründəki /mosque səhifəsi silindi: server (nginx, .htaccess)
  // /mosque və /<dil>/mosque ünvanlarını eyni dildə /about-a 301 ilə
  // yönləndirir ki, Google köhnə URL-i düzgün köçürsün.
  { key: 'jamaat',        path: 'jamaat',        priority: 0.95, changefreq: 'daily'   },
  { key: 'announcements', path: 'announcements', priority: 0.90, changefreq: 'daily'   },
  { key: 'donate',        path: 'donate',        priority: 0.70, changefreq: 'monthly' },
  { key: 'quran',        path: 'quran',        priority: 0.95, changefreq: 'weekly'  },
  { key: 'prayer',       path: 'prayer',       priority: 0.95, changefreq: 'daily'   },
  { key: 'ramadan',      path: 'ramadan',      priority: 0.8,  changefreq: 'daily'   },
  { key: 'hadith',       path: 'hadith',       priority: 0.90, changefreq: 'weekly'  },
  { key: 'duas',         path: 'duas',         priority: 0.90, changefreq: 'weekly'  },
  { key: 'dhikr',        path: 'dhikr',        priority: 0.85, changefreq: 'monthly' },
  { key: 'names',        path: 'names',        priority: 0.85, changefreq: 'monthly' },
  { key: 'zakat',        path: 'zakat',        priority: 0.85, changefreq: 'monthly' },
  { key: 'qibla',        path: 'qibla',        priority: 0.85, changefreq: 'monthly' },
  { key: 'calendar',     path: 'calendar',     priority: 0.85, changefreq: 'daily'   },
  { key: 'prayerguide',  path: 'prayerguide',  priority: 0.85, changefreq: 'monthly' },
  { key: 'hajjguide',    path: 'hajjguide',    priority: 0.85, changefreq: 'monthly' },
  { key: 'hifz',         path: 'hifz',         priority: 0.80, changefreq: 'monthly' },
  { key: 'arabic',       path: 'learn-arabic', priority: 0.80, changefreq: 'monthly' },
  { key: 'quiz',         path: 'quiz',         priority: 0.80, changefreq: 'monthly' },
  { key: 'qurangame',    path: 'qurangame',    priority: 0.75, changefreq: 'monthly' },
  { key: 'glossary',     path: 'glossary',     priority: 0.75, changefreq: 'monthly' },
  { key: 'history',      path: 'history',      priority: 0.85, changefreq: 'monthly' },
  { key: 'sahaba',       path: 'sahaba',       priority: 0.85, changefreq: 'monthly' },
  { key: 'scholars',     path: 'scholars',     priority: 0.85, changefreq: 'monthly' },
  { key: 'holyplaces',   path: 'holyplaces',   priority: 0.75, changefreq: 'monthly' },
  { key: 'mosques',      path: 'mosques',      priority: 0.80, changefreq: 'weekly'  },
  { key: 'tracker',      path: 'prayer-tracker', priority: 0.80, changefreq: 'daily' },
  { key: 'dailytracker', path: 'dailytracker', priority: 0.80, changefreq: 'daily'   },
  { key: 'charity',      path: 'charity',      priority: 0.75, changefreq: 'weekly'  },
  { key: 'duajournal',   path: 'duajournal',   priority: 0.75, changefreq: 'weekly'  },
  { key: 'quotes',       path: 'quotes',       priority: 0.70, changefreq: 'weekly'  },
  { key: 'analytics',    path: 'analytics',    priority: 0.65, changefreq: 'weekly'  },
  { key: 'videos',       path: 'videos',       priority: 0.85, changefreq: 'weekly'  },
  { key: 'books',        path: 'books',        priority: 0.85, changefreq: 'weekly'  },
  { key: 'aichat',       path: 'aichat',       priority: 0.75, changefreq: 'monthly' },
  { key: 'kids',         path: 'kids',         priority: 0.70, changefreq: 'monthly' },
  { key: 'about',        path: 'about',        priority: 0.50, changefreq: 'monthly' },
  { key: 'privacy',      path: 'privacy',      priority: 0.30, changefreq: 'yearly'  },
  { key: 'terms',        path: 'terms',        priority: 0.30, changefreq: 'yearly'  },
  { key: 'licenses',     path: 'licenses',     priority: 0.30, changefreq: 'yearly'  },

  // Admin — indekslənmir, sitemap-a düşmür
  { key: 'adminlogin',   path: 'adminlogin',   noindex: true },
  { key: 'admin',        path: 'admin',        noindex: true },
]

export const INDEXABLE = PAGES.filter(p => !p.noindex)

// ── Detal səhifələri ─────────────────────────────────
// Siyahı səhifəsinin altında hər element üçün ayrıca, indekslənən URL:
//   /quran/<n>-<slug>    — 114 surə     (param: surənin nömrəsi, 1–114)
//   /names/<n>-<slug>    — 99 ad        (param: adın nömrəsi, 1–99)
//   /sahaba/<slug>       — səhabələr    (param: slug)
//   /scholars/<slug>     — Sələf alimləri (param: slug)
// Rəqəmli növlərdə NÖMRƏ həqiqət mənbəyidir: slug səhv yazılsa belə
// (/quran/2-bilmirem) səhifə surə 2-ni açır, canonical isə düzgün slug-u
// göstərir. Naməlum nömrə / slug → known:false (404).
// İSTİSNA — 99 ad (slugs): siyahı İbn Useyminin "əl-Qavaid əl-Musla"
// siyahısı ilə əvəz olunanda nömrələr dəyişdi. Köhnə ünvanlar (Google indeksi,
// kənar linklər) itməsin deyə burada tanınan SLUG nömrədən üstündür:
// /names/20-al-alim (köhnə nömrə) → əl-Əlim-in yeni nömrəsi (44), App.jsx
// kanonik ünvana replace edir. Köhnə siyahıdan çıxarılmış adın slug-ı
// (removed) → parsePath { removed: true }, App.jsx /names siyahısına keçirir.
// Hər dildə eyni slug (ASCII, kiçik hərf, defislə).
export const DETAILS = {
  quran:  { kind: 'number', count: 114, slug: (n) => SURAH_SLUGS[n - 1] },
  names:  { kind: 'number', count: 99,  slug: (n) => NAME_SLUGS[n - 1], slugs: NAME_SLUGS, removed: REMOVED_NAME_SLUGS },
  sahaba: { kind: 'slug',   slugs: SAHABA_SLUGS },
  scholars: { kind: 'slug', slugs: SCHOLAR_SLUGS },
}

/** Detal parametri düzgündürmü (surə 1–114, ad 1–99, mövcud səhabə slug-u)? */
export function isDetailParam(key, param) {
  const d = DETAILS[key]
  if (!d || param == null || param === '') return false
  if (d.kind === 'number') return Number.isInteger(param) && param >= 1 && param <= d.count
  return d.slugs.includes(param)
}

/** Detalın URL seqmenti: (quran, 2) → '2-al-baqara'; düzgün deyilsə null. */
export function detailSegment(key, param) {
  if (!isDetailParam(key, param)) return null
  const d = DETAILS[key]
  return d.kind === 'number' ? `${param}-${d.slug(param)}` : param
}

/** URL seqmentindən parametr: '2-al-baqara' / '2' / '2-sehv' → 2; tanınmırsa null. */
export function parseDetailSegment(key, seg) {
  const d = DETAILS[key]
  if (!d || !seg) return null
  let s = seg
  try { s = decodeURIComponent(seg) } catch { /* pozuq % — olduğu kimi */ }
  if (d.kind === 'number') {
    const m = /^(\d{1,3})(?:-(.*))?$/.exec(s)
    if (!m) return null
    if (d.slugs && m[2]) {
      const slug = m[2].toLowerCase()
      // Tanınan slug nömrədən üstündür (köhnə nömrəli ünvan düzgün ada düşsün)
      const i = d.slugs.indexOf(slug)
      if (i >= 0) return i + 1
      // Siyahıdan çıxarılmış ad nömrəyə düşmür — o nömrə indi başqa addır
      if (d.removed && d.removed.includes(slug)) return null
    }
    const n = Number(m[1])
    return isDetailParam(key, n) ? n : null
  }
  const slug = s.toLowerCase()
  return isDetailParam(key, slug) ? slug : null
}

/**
 * Seqment köhnə siyahıdan çıxarılmış detala aiddirmi? ('23-al-khafid' → true).
 * Belə ünvan bölmənin siyahısına yönləndirilir (App.jsx, replace).
 */
export function isRemovedDetailSegment(key, seg) {
  const d = DETAILS[key]
  if (!d || !d.removed || !seg) return false
  let s = seg
  try { s = decodeURIComponent(seg) } catch { /* pozuq % — olduğu kimi */ }
  const m = /^\d{1,3}-(.+)$/.exec(s)
  return !!m && d.removed.includes(m[1].toLowerCase())
}

/**
 * Köhnə query ünvanından detal parametri: /quran?s=2 → 2, /sahaba?id=<slug|id> → slug.
 * Tanınmırsa null (səhifə siyahı kimi açılır).
 */
export function legacyDetailParam(key, params) {
  if (key === 'quran') {
    const s = Number(params.get('s'))
    return isDetailParam('quran', s) ? s : null
  }
  if (key === 'sahaba') {
    const v = String(params.get('id') || '').toLowerCase()
    if (!v) return null
    if (isDetailParam('sahaba', v)) return v
    const n = Number(v)
    return Number.isInteger(n) && SAHABA_SLUGS[n - 1] ? SAHABA_SLUGS[n - 1] : null
  }
  return null
}

/** Bütün detal parametrləri (prerender və sitemap üçün). */
export function detailParams(key) {
  const d = DETAILS[key]
  if (!d) return []
  return d.kind === 'number' ? Array.from({ length: d.count }, (_, i) => i + 1) : [...d.slugs]
}

// ── URL yardımçıları ─────────────────────────────────

/**
 * Səhifə + dil (+ detal parametri) → tam yol. az = prefiksiz (kanonik kök).
 * param verilməyibsə və ya düzgün deyilsə — siyahı səhifəsinin yolu.
 */
export function pathFor(key, lang = DEFAULT_LANG, param) {
  const page = PAGES.find(p => p.key === key)
  const slug = page ? page.path : ''
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`
  if (!slug) return prefix || '/'
  const seg = param == null ? null : detailSegment(key, param)
  return seg ? `${prefix}/${slug}/${seg}` : `${prefix}/${slug}`
}

/** Səhifə + dil (+ param) → tam mütləq URL (canonical / sitemap üçün). */
export function urlFor(key, lang = DEFAULT_LANG, param) {
  return SITE + pathFor(key, lang, param)
}

/**
 * Brauzer yolunu ayrış: '/ru/quran' → { lang:'ru', key:'quran', known:true, param:null }
 * '/en/quran/36-yaseen' → { …, key:'quran', param:36 }
 * Tanınmayan yol üçün key 'home', known:false (App.jsx onu 404 göstərir).
 * Detal səhifəsi olmayan bölmələrdə əlavə seqment əvvəlki kimi nəzərə alınmır.
 */
export function parsePath(pathname) {
  const parts = String(pathname || '/').split('/').filter(Boolean)
  let lang = DEFAULT_LANG
  if (parts.length && LANGS.includes(parts[0]) && parts[0] !== DEFAULT_LANG) {
    lang = parts.shift()
  } else if (parts[0] === DEFAULT_LANG) {
    parts.shift() // /az/... da qəbul edilir, kanonik forma prefiksizdir
  }
  const slug = parts[0] || ''
  const page = PAGES.find(p => p.path === slug)
  if (!page) return { lang, key: 'home', known: slug === '', param: null }
  const rest = parts.slice(1)
  if (!DETAILS[page.key] || rest.length === 0) return { lang, key: page.key, known: true, param: null }
  // Detal: düz bir seqment olmalıdır (/quran/2-al-baqara); qalanı 404
  const param = rest.length === 1 ? parseDetailSegment(page.key, rest[0]) : null
  // Köhnə siyahıdan çıxarılmış ad (/names/23-al-khafid) — siyahıya yönləndirilir
  if (param == null && rest.length === 1 && isRemovedDetailSegment(page.key, rest[0])) {
    return { lang, key: page.key, known: true, param: null, removed: true }
  }
  return { lang, key: page.key, known: param != null, param }
}
