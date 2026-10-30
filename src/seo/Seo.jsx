import { useEffect } from 'react'
import { SITE, LANGS, LOCALES, DEFAULT_LANG, urlFor, pathFor } from './routes'
import { titleFor, descFor, ogImageFor, OG_ALT } from './meta'
import { brandName, siteJsonLd } from '../config/brand'

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
//
// Detal səhifələri (/quran/2-al-baqara, /names/1-allah, /sahaba/<slug>):
// mətnlər və sxem ./detail.js-dən gəlir — o modul (surə, ad və səhabə
// məlumatı ilə) yalnız detal səhifəsində TƏNBƏL yüklənir, əsas paketə düşmür.
// ═══════════════════════════════════════════════════════

// Sayt sxemi (schema.org WebSite + Organization) hansı səhifələrdə yazılır —
// scripts/prerender.mjs-dəki SITE_JSONLD_PAGES ilə EYNİ olmalıdır (o, JSX
// faylını import edə bilmir). Yalnız ana səhifədə: Google sayt adını və
// loqosunu kök URL-dən götürür, hər səhifədə təkrar lazım deyil.
const SITE_JSONLD_PAGES = ['home']

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

export default function Seo({ page, lang, param = null }) {
  useEffect(() => {
    if (param == null) { applySeo(page, lang, null, null); return undefined }
    let cancelled = false
    import('./detail.js')
      .then((detail) => { if (!cancelled) applySeo(page, lang, param, detail) })
      // Chunk yüklənmədi — heç olmasa canonical/hreflang düzgün olsun
      .catch(() => { if (!cancelled) applySeo(page, lang, param, null) })
    return () => { cancelled = true }
  }, [page, lang, param])

  return null
}

/** <head>-i səhifəyə uyğun yaz. detail — ./detail.js modulu (detal səhifəsində). */
function applySeo(page, lang, param, detail) {
  const meta = detail ? detail.detailMeta(page, lang, param) : null
  const title = meta ? detail.titleForDetail(page, lang, param) : titleFor(page, lang)
  const desc = meta ? meta.d : descFor(page, lang)
  const canonical = urlFor(page, lang, param ?? undefined)
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
  // Paylaşım kartının şəkli və alt mətni də cari dildə
  setMeta('property', 'og:image', ogImageFor(lang))
  setMeta('property', 'og:image:alt', OG_ALT[lang] || OG_ALT.az)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', desc)
  setMeta('name', 'twitter:image', ogImageFor(lang))
  setMeta('name', 'twitter:image:alt', OG_ALT[lang] || OG_ALT.az)

  // canonical + hreflang — hər dil variantı bir-birini göstərir
  setLinks('canonical', isNotFound ? [] : [{ rel: 'canonical', href: canonical }])
  setLinks('alt', isNotFound ? [] : [
    ...LANGS.map(l => ({
      rel: 'alternate',
      hreflang: l,
      href: SITE + pathFor(page, l, param ?? undefined),
    })),
    { rel: 'alternate', hreflang: 'x-default', href: SITE + pathFor(page, DEFAULT_LANG, param ?? undefined) },
  ])

  // Səhifə səviyyəli sxem — Google-a bu URL-in nə olduğunu deyir
  const brand = brandName(lang)
  setJsonLd(isNotFound ? null : meta ? detail.detailJsonLd(page, lang, param) : {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url: canonical,
    inLanguage: lang,
    // @id siteJsonLd()-dəki WebSite ilə eynidir — Google onları birləşdirir
    isPartOf: { '@type': 'WebSite', '@id': SITE + '/#website', name: brand, url: SITE + '/' },
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

  // Sayt sxemi (WebSite + Organization) — yalnız ana səhifədə, cari dildə;
  // digərlərində silinir. index.html-dəki statik WebSite bloku eyni @id
  // (https://muslims.cc/#website) daşıyır, Google ikisini bir obyekt sayır.
  setJsonLd(SITE_JSONLD_PAGES.includes(page) ? siteJsonLd(lang) : null, 'site-jsonld')
}
