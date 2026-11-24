// ═══════════════════════════════════════════════════════
// <head> yazıcısı — src/seo/Seo.jsx bu modulu TƏNBƏL yükləyir.
//
// PERFORMANS (2026-11-24): meta.js (bütün səhifələrin 5 dildə title/description
// mətnləri, ~112 KB xam) + sxem qurucuları əvvəl əsas paketdə (index.js) idi.
// Prerender olunmuş səhifənin İLK açılışında <head> serverdən düzgün gəlir və
// heç nə yazılmır (Seo.jsx → prerenderedHead) — bu kod yalnız SPA naviqasiyasında,
// 404 qabığında və öz head-ini idarə edən detalda (/u/<ləqəb>) lazımdır.
// Seo.jsx onu boş vaxtda əvvəlcədən yükləyir — naviqasiyada gecikmə olmur.
// Məntiq Seo.jsx-dəki əvvəlki applySeo/applySelfSeo ilə EYNİDİR.
// ═══════════════════════════════════════════════════════
import { SITE, LANGS, LOCALES, DETAILS, NOINDEX_KEYS, urlFor, pathFor, seoLangsFor, canonicalLang, xDefaultLang, uiLang } from './routes'
import { titleFor, descFor, fitDesc, ogImageFor, OG_ALT } from './meta'
import { brandName } from '../config/brand'
import { siteSchema } from './siteSchema'
import { pageJsonLd } from './pageJsonLd'
import { ROBOTS_NOINDEX } from './profileSeo'

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

/** og:locale:alternate — cari dildən başqa 5 əsas dil (bütün köhnələri əvəz edir; prerender.mjs ilə eyni). */
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

/**
 * Öz head-ini idarə edən detal (/u/<ləqəb>). s — Seo.jsx-in selfState-i (bu səhifə üçündürsə), yoxsa null:
 * səhifə hələ yazmayıbsa — noindex, canonical/hreflang/sxem yoxdur.
 */
export function applySelfSeo(page, lang, s) {
  const title = s?.title || titleFor(page, lang)
  const desc = s?.desc || descFor(page, lang)
  document.title = title
  setMeta('name', 'description', desc)
  setMeta('name', 'robots', s?.robots || ROBOTS_NOINDEX)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:url', s?.canonical || window.location.href)
  setMeta('property', 'og:locale', LOCALES[lang] || LOCALES.az)
  setMeta('property', 'og:site_name', brandName(lang))
  setLocaleAlternates(lang)
  const ogAlt = OG_ALT[uiLang(lang)] || OG_ALT.az
  setMeta('property', 'og:image', ogImageFor(lang))
  setMeta('property', 'og:image:alt', ogAlt)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', desc)
  setMeta('name', 'twitter:image', ogImageFor(lang))
  setMeta('name', 'twitter:image:alt', ogAlt)
  // hreflang yoxdur (istifadəçi məzmunu, dil variantları eyni canonical-ı göstərir)
  setLinks('canonical', s?.canonical ? [{ rel: 'canonical', href: s.canonical }] : [])
  setLinks('alt', [])
  setJsonLd(s?.jsonLd || null)
  setJsonLd(null, 'site-jsonld')
}

/**
 * <head>-i səhifəyə uyğun yaz. detail — ./detail.js modulu (detal səhifəsində).
 * bootNotFound — server bu URL-ə 404 qabığı verib və hələ həmin URL-dəyik (Seo.jsx hesablayır).
 */
export function applySeo(page, lang, param, detail, bootNotFound = false) {
  const meta = detail ? detail.detailMeta(page, lang, param) : null
  const title = meta ? detail.titleForDetail(page, lang, param) : titleFor(page, lang)
  const desc = meta ? fitDesc(meta.d) : descFor(page, lang)
  const canonical = urlFor(page, canonicalLang(page, lang, param), DETAILS[page]?.noindex ? undefined : (param ?? undefined))
  // Tanınmayan ünvan (404): indekslənmir, canonical/hreflang/sxem yazılmır —
  // əks halda Google onu ana səhifənin dublikatı ("soft-404") sayardı
  // Server bu URL-ə 404 qabığı verib (məs. /de/hadith/1 — hədis yalnız 5 dildə prerender olunur):
  // SPA məzmunu göstərsə də head 404 kimi qalır (noindex, canonical/hreflang/sxem yox)
  const isNotFound = page === 'notfound' || bootNotFound
  // İstifadəçi məzmunu (qrup otağı və s.) — indekslənmir, kanonik siyahı səhifəsidir
  const isPrivateDetail = param != null && DETAILS[page]?.noindex

  document.title = title
  setMeta('name', 'description', desc)
  setMeta('name', 'robots',
    NOINDEX_KEYS.has(page) || isNotFound || isPrivateDetail
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
  // Paylaşım kartının şəkli və alt mətni də cari dildə (əlavə dildə — ingiliscə kart)
  const ogAlt = OG_ALT[uiLang(lang)] || OG_ALT.az
  setMeta('property', 'og:image', ogImageFor(lang))
  setMeta('property', 'og:image:alt', ogAlt)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', desc)
  setMeta('name', 'twitter:image', ogImageFor(lang))
  setMeta('name', 'twitter:image:alt', ogAlt)

  // canonical + hreflang — hər dil variantı bir-birini göstərir (Quran — 25 dil).
  // İndekslənməyən səhifədə (NOINDEX_KEYS) hreflang və sxem yoxdur — prerender.mjs (headFor) ilə eyni
  const isNoindexPage = NOINDEX_KEYS.has(page) || isPrivateDetail
  setLinks('canonical', isNotFound ? [] : [{ rel: 'canonical', href: canonical }])
  setLinks('alt', isNotFound || isNoindexPage ? [] : [
    ...seoLangsFor(page, param).map(l => ({
      rel: 'alternate',
      hreflang: l,
      href: SITE + pathFor(page, l, param ?? undefined),
    })),
    // tək dilli detalda (Hisnul-Müslim zikri — yalnız ar) x-default həmin dilin ünvanıdır
    { rel: 'alternate', hreflang: 'x-default', href: SITE + pathFor(page, xDefaultLang(page, param), param ?? undefined) },
  ])

  // Səhifə səviyyəli sxem — Google-a bu URL-in nə olduğunu deyir (src/seo/pageJsonLd.js)
  setJsonLd(isNotFound ? null : meta ? detail.detailJsonLd(page, lang, param)
    : pageJsonLd({ key: page, lang, title, desc, canonical, noindex: isNoindexPage }))

  // Sayt sxemi (WebSite + Organization + WebApplication; src/seo/siteSchema.js) — yalnız
  // ana səhifədə, cari dildə; digərlərində silinir. Saytın yeganə #website node-udur.
  setJsonLd(SITE_JSONLD_PAGES.includes(page) ? siteSchema(lang) : null, 'site-jsonld')
}
