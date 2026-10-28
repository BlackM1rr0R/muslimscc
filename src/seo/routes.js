// ═══════════════════════════════════════════════════════
// Muslims.cc — Marşrut & SEO meta reyestri
//
// Bu fayl saytın YEGANƏ həqiqət mənbəyidir:
//   • App.jsx marşrutlaşdırma üçün oxuyur
//   • Seo.jsx <head> qurmaq üçün oxuyur
//   • scripts/prerender.js statik HTML + sitemap.xml üçün oxuyur
// Yeni səhifə əlavə edərkən yalnız burada bir sətir yaz.
// ═══════════════════════════════════════════════════════

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
  { key: 'quiz',         path: 'quiz',         priority: 0.80, changefreq: 'monthly' },
  { key: 'qurangame',    path: 'qurangame',    priority: 0.75, changefreq: 'monthly' },
  { key: 'glossary',     path: 'glossary',     priority: 0.75, changefreq: 'monthly' },
  { key: 'history',      path: 'history',      priority: 0.85, changefreq: 'monthly' },
  { key: 'sahaba',       path: 'sahaba',       priority: 0.85, changefreq: 'monthly' },
  { key: 'holyplaces',   path: 'holyplaces',   priority: 0.75, changefreq: 'monthly' },
  { key: 'mosques',      path: 'mosques',      priority: 0.80, changefreq: 'weekly'  },
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

  // Admin — indekslənmir, sitemap-a düşmür
  { key: 'adminlogin',   path: 'adminlogin',   noindex: true },
  { key: 'admin',        path: 'admin',        noindex: true },
]

export const INDEXABLE = PAGES.filter(p => !p.noindex)

// ── URL yardımçıları ─────────────────────────────────

/** Səhifə + dil → tam yol. az = prefiksiz (kanonik kök). */
export function pathFor(key, lang = DEFAULT_LANG) {
  const page = PAGES.find(p => p.key === key)
  const slug = page ? page.path : ''
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`
  if (!slug) return prefix || '/'
  return `${prefix}/${slug}`
}

/** Səhifə + dil → tam mütləq URL (canonical / sitemap üçün). */
export function urlFor(key, lang = DEFAULT_LANG) {
  return SITE + pathFor(key, lang)
}

/**
 * Brauzer yolunu ayrış: '/ru/quran' → { lang:'ru', key:'quran' }
 * Tanınmayan yol üçün home qaytarır (404 əvəzinə — SPA davranışı saxlanılır).
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
  return { lang, key: page ? page.key : 'home', known: Boolean(page) || slug === '' }
}
