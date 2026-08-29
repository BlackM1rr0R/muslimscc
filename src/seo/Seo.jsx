import { useEffect } from 'react'
import { SITE, LANGS, LOCALES, DEFAULT_LANG, urlFor, pathFor } from './routes'
import { titleFor, descFor } from './meta'

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
function setJsonLd(data) {
  document.head
    .querySelectorAll('script[data-seo="page-jsonld"]')
    .forEach(el => el.remove())
  if (!data) return
  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.setAttribute('data-seo', 'page-jsonld')
  el.textContent = JSON.stringify(data)
  document.head.appendChild(el)
}

export default function Seo({ page, lang }) {
  useEffect(() => {
    const title = titleFor(page, lang)
    const desc = descFor(page, lang)
    const canonical = urlFor(page, lang)

    document.title = title
    setMeta('name', 'description', desc)
    setMeta('name', 'robots',
      page === 'adminlogin' || page === 'admin'
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1')

    // Open Graph + Twitter — paylaşım kartları da səhifəyə uyğun olsun
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:locale', LOCALES[lang] || LOCALES.az)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', desc)

    // canonical + hreflang — hər dil variantı bir-birini göstərir
    setLinks('canonical', [{ rel: 'canonical', href: canonical }])
    setLinks('alt', [
      ...LANGS.map(l => ({
        rel: 'alternate',
        hreflang: l,
        href: SITE + pathFor(page, l),
      })),
      { rel: 'alternate', hreflang: 'x-default', href: SITE + pathFor(page, DEFAULT_LANG) },
    ])

    // Səhifə səviyyəli sxem — Google-a bu URL-in nə olduğunu deyir
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: desc,
      url: canonical,
      inLanguage: lang,
      isPartOf: { '@type': 'WebSite', name: 'Muslims.cc', url: SITE + '/' },
      breadcrumb: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Muslims.cc', item: SITE + pathFor('home', lang) },
          ...(page === 'home'
            ? []
            : [{ '@type': 'ListItem', position: 2, name: title.split(' | ')[0], item: canonical }]),
        ],
      },
    })
  }, [page, lang])

  return null
}
