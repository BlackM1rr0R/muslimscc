// ═══════════════════════════════════════════════════════
// Siyahı/alət səhifəsinin sxemi (schema.org WebPage + BreadcrumbList) —
// scripts/prerender.mjs (statik HTML) və src/seo/Seo.jsx (SPA naviqasiyası) EYNİ funksiyanı çağırır.
//
// • Ana səhifədə breadcrumb YOXDUR: tək elementli BreadcrumbList Google-un rich result
//   yoxlamasında xəbərdarlıq verir ("ən azı iki ListItem") və heç nə demir.
// • İndekslənməyən səhifədə (noindex — hesab, şəxsi dəftərlər, paylaşma hədəfi) sxem
//   yazılmır: robotlar onu onsuz da nəzərə almır, 45k səhifəlik image-də boş baytdır.
// ═══════════════════════════════════════════════════════
import { SITE, pathFor } from './routes.js'
import { brandName } from '../config/brand.js'

/** { key, lang, title, desc, canonical, noindex } → JSON-LD obyekti və ya null. */
export function pageJsonLd({ key, lang, title, desc, canonical, noindex = false }) {
  if (noindex) return null
  const brand = brandName(lang)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url: canonical,
    inLanguage: lang,
    // @id siteSchema()-dakı WebSite ilə eynidir — Google onları birləşdirir
    isPartOf: { '@type': 'WebSite', '@id': SITE + '/#website', name: brand, url: SITE + '/' },
    ...(key === 'home' ? {} : {
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: brand, item: SITE + pathFor('home', lang) },
          { '@type': 'ListItem', position: 2, name: String(title).split(' | ')[0], item: canonical },
        ],
      },
    }),
  }
}
