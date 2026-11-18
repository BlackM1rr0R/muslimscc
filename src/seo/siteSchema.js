// ═══════════════════════════════════════════════════════
// Ana səhifənin sayt sxemi (schema.org) — YEGANƏ #website node-u.
//
// siteJsonLd(lang) (src/config/brand.js: WebSite + Organization) + bütün 50 dil
// (inLanguage) + WebApplication (PWA). Əvvəl index.html-də hər səhifəyə statik
// ikinci WebSite (köhnəlmiş "5 dildə" təsviri və Google-un ləğv etdiyi SearchAction ilə)
// və WebApplication bloku düşürdü: 45k səhifədə ~3 KB, ana səhifədə isə iki fərqli
// təsvirli WebSite. İndi yalnız ana səhifədə, cari dildə — scripts/prerender.mjs və
// src/seo/Seo.jsx (SITE_JSONLD_PAGES) eyni funksiyanı çağırır.
// brand.js mobil tətbiqlə sinxron saxlanılır (check-config-sync) — ona görə burada genişlənir.
// ═══════════════════════════════════════════════════════

import { BRAND, brandName, siteJsonLd, tr } from '../config/brand.js'
import { ALL_LANGS } from './routes.js'

export function siteSchema(lang = 'az') {
  const base = siteJsonLd(lang)
  const graph = base['@graph'].map(n => (n['@type'] === 'WebSite' ? { ...n, inLanguage: ALL_LANGS } : n))
  graph.push({
    '@type': 'WebApplication',
    '@id': BRAND.url + '/#app',
    name: brandName(lang),
    url: BRAND.url + '/',
    description: tr(BRAND.description, lang),
    applicationCategory: 'ReligiousApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    inLanguage: ALL_LANGS,
    screenshot: BRAND.url + '/og-image.png',
    publisher: { '@id': BRAND.url + '/#org' },
  })
  return { ...base, '@graph': graph }
}
