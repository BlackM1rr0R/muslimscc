import { useEffect } from 'react'
import { SITE, LANGS, LOCALES, DEFAULT_LANG, urlFor, pathFor } from './routes'
import { titleFor, descFor } from './meta'
import { brandName, mosqueJsonLd } from '../config/mosque'

// ═══════════════════════════════════════════════════════
// <head>-i cari səhifəyə uyğun yeniləyir.
//
// SPA olduğu üçün index.html-dəki statik meta bütün marşrutlarda
// eyni qalırdı — Google bunu duplicate content kimi görürdü.
// Bu komponent hər naviqasiyada title, description, canonical,
// hreflang, Open Graph və JSON-LD-ni yenidən yazır.
//
// react-helmet əvəzinə birbaşa DOM: əlavə asılılıq yoxdur və
// prerender edilmiş statik HTML-dəki teqləri elə yerindəcə əvəzləyir.
// ═══════════════════════════════════════════════════════

// schema.org/Mosque hansı səhifələrdə yazılır — scripts/prerender.mjs-dəki
// MOSQUE_JSONLD_PAGES ilə EYNİ olmalıdır (o, JSX faylını import edə bilmir)
const MOSQUE_JSONLD_PAGES = ['home', 'mosque']

/**
 * Məscid obyekti + sabit @id: iki səhifədəki blok Google üçün EYNİ məscid
 * kimi birləşir (iki ayrı "Mosque" yox). Sahələr yenə yalnız mosqueJsonLd-dən
 * gəlir — orada boş sahələr qəsdən buraxılır.
 */
function mosqueEntity(lang) {
  return { ...mosqueJsonLd(lang), '@id': `${SITE}/#mosque` }
}

/** name/property atributuna görə <meta> tap və ya yarat, sonra content yaz. */
function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** og:locale:alternate — cari dildən başqa dillər (bütün köhnələri əvəz edir). */
function setLocaleAlternates(lang) {
  document.head
    .querySelectorAll('meta[property="og:locale:alternate"]')
    .forEach(el => el.remove())
  for (const l of LANGS) {
    if (l === lang) continue
    const el = document.createElement('meta')
    el.setAttribute('property', 'og:locale:alternate')
    el.setAttribute('content', LOCALES[l])
    document.head.appendChild(el)
  }
}

/** data-seo ilə işarələnmiş <link> qrupunu tamamilə əvəz et. */
function setLinks(group, links) {
  document.head
    .querySelectorAll(`link[data-seo="${group}"]`)
    .forEach(el => el.remove())
  for (const attrs of links) {
    const el = document.createElement('link')
    el.setAttribute('data-seo', group)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    document.head.appendChild(el)
  }
}

/** Səhifəyə xas JSON-LD blokunu əvəz et (index.html-dəki qlobal sxemlərə toxunmur). */
function setJsonLd(data, group = 'page-jsonld') {
  document.head
    .querySelectorAll(`script[data-seo="${group}"]`)
    .forEach(el => el.remove())
  if (!data) return
  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.setAttribute('data-seo', group)
  el.textContent = JSON.stringify(data)
  document.head.appendChild(el)
}

export default function Seo({ page, lang }) {
  useEffect(() => {
    const title = titleFor(page, lang)
    const desc = descFor(page, lang)
    const canonical = urlFor(page, lang)
    // Tanınmayan ünvan (404): indekslənmir, canonical/hreflang/sxem yazılmır —
    // əks halda Google onu ana səhifənin dublikatı ("soft-404") sayardı
    const isNotFound = page === 'notfound'

    document.title = title
    setMeta('name', 'description', desc)
    setMeta('name', 'robots',
      page === 'adminlogin' || page === 'admin' || isNotFound
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1')

    // Open Graph + Twitter — paylaşım kartları da səhifəyə uyğun olsun
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    // 404-də kanonik URL yoxdur — og:url ana səhifəni göstərməsin, faktiki ünvan yazılsın
    setMeta('property', 'og:url', isNotFound ? window.location.href : canonical)
    setMeta('property', 'og:locale', LOCALES[lang] || LOCALES.az)
    setMeta('property', 'og:site_name', brandName(lang))
    setLocaleAlternates(lang)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', desc)

    // canonical + hreflang — hər dil variantı bir-birini göstərir
    setLinks('canonical', isNotFound ? [] : [{ rel: 'canonical', href: canonical }])
    setLinks('alt', isNotFound ? [] : [
      ...LANGS.map(l => ({
        rel: 'alternate',
        hreflang: l,
        href: SITE + pathFor(page, l),
      })),
      { rel: 'alternate', hreflang: 'x-default', href: SITE + pathFor(page, DEFAULT_LANG) },
    ])

    // Səhifə səviyyəli sxem — Google-a bu URL-in nə olduğunu deyir
    const brand = brandName(lang)
    setJsonLd(isNotFound ? null : {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: desc,
      url: canonical,
      inLanguage: lang,
      isPartOf: { '@type': 'WebSite', name: brand, url: SITE + '/' },
      breadcrumb: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: brand, item: SITE + pathFor('home', lang) },
          ...(page === 'home'
            ? []
            : [{ '@type': 'ListItem', position: 2, name: title.split(' | ')[0], item: canonical }]),
        ],
      },
    })

    // Məscid sxemi (schema.org/Mosque) — ana səhifədə və "Məscid haqqında"
    // səhifəsində; digərlərində silinir. index.html-də statik Mosque bloku
    // yoxdur, ona görə heç bir səhifədə iki Mosque obyekti yaranmır.
    setJsonLd(MOSQUE_JSONLD_PAGES.includes(page) ? mosqueEntity(lang) : null, 'mosque-jsonld')
  }, [page, lang])

  return null
}
