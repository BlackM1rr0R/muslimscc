import { useEffect } from 'react'
import { SITE, LANGS, LOCALES, DEFAULT_LANG, DETAILS, NOINDEX_KEYS, urlFor, pathFor, seoLangsFor, canonicalLang, uiLang } from './routes'
import { titleFor, descFor, fitDesc, ogImageFor, OG_ALT } from './meta'
import { brandName } from '../config/brand'
import { siteSchema } from './siteSchema'
import { pageJsonLd } from './pageJsonLd'
import { useLang } from '../contexts/LangContext'
import { ROBOTS_NOINDEX } from './profileSeo'
import { loadDetail } from './detailLoaders'

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

// ── Serverin verdiyi HTML (modul yüklənəndə, React <head>-ə toxunmamış oxunur) ──
// • Prerender olunmuş səhifə: <head> artıq bu URL üçün düzgündür (title, canonical, hreflang,
//   sxem, hətta surənin öz og:image-i). İlk açılışda yenidən yazılmır — detail.js və onun
//   məlumatı (hədis, alim…) yalnız SPA naviqasiyasında yüklənir (mobil TBT, 2026-11-18 auditi).
// • 404 qabığı (dist/404.html: canonical yox + noindex): server bu URL-ə 404 verib — SPA səhifəni
//   göstərsə də (məs. /de/hadith/1) robotlara "index" deməsin (ziddiyyətli siqnal olmasın).
const BOOT = typeof document === 'undefined' ? null : (() => {
  const canonical = document.head.querySelector('link[data-seo="canonical"]')?.getAttribute('href') || null
  const robots = document.head.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
  return {
    path: window.location.pathname,
    lang: document.documentElement.getAttribute('lang'),
    canonical,
    notFound: !canonical && /noindex/i.test(robots),
  }
})()
let bootLeft = false
/** Hələ server HTML-inin URL-indəyikmi? Bir dəfə başqa ünvana keçəndən sonra (Geri ilə qayıtsa da) — yox. */
function atBootUrl() {
  if (!BOOT || bootLeft) return false
  if (window.location.pathname !== BOOT.path) bootLeft = true
  return !bootLeft
}
/** Server bu URL üçün hazır <head> veribmi (prerender) — onda yenidən yazmağa ehtiyac yoxdur. */
function prerenderedHead(page, lang, param) {
  if (page === 'notfound' || !atBootUrl() || !BOOT.canonical || BOOT.lang !== lang) return false
  // Ünvan bu səhifənin öz yoludur (SPA fallback-ın ana səhifə qabığı naməlum ünvanda "uyğun" görünməsin)
  if (pathFor(page, lang, param ?? undefined) !== BOOT.path) return false
  return BOOT.canonical === urlFor(page, canonicalLang(page, lang, param), DETAILS[page]?.noindex ? undefined : (param ?? undefined))
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

// ── Öz head-ini idarə edən detal (DETAILS[key].selfSeo — /u/<ləqəb>) ──
// Məlumat serverdən gəlir (profil, icazə) — səhifə hazır olanda setSelfSeo() çağırır.
// Seo.jsx və səhifə EYNİ vəziyyəti yazır: hansı effekt sonra işləsə də (dil lüğəti
// gec yüklənəndə Seo yenidən işləyir) nəticə eynidir. Səhifə hələ yazmayıbsa — noindex,
// canonical/hreflang/sxem yoxdur.
let selfState = null   // { page, param, lang, robots, title, desc, canonical, jsonLd }

/** state = null — sıfırla; əks halda { page, param, lang, robots, title, desc, canonical?, jsonLd? } */
export function setSelfSeo(state) {
  selfState = state || null
  if (selfState) applySelfSeo(selfState.page, selfState.lang, selfState.param)
}

function applySelfSeo(page, lang, param) {
  const s = selfState && selfState.page === page && selfState.param === param ? selfState : null
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

export default function Seo({ page, lang, param = null }) {
  // Əlavə dilin lüğəti dil dəyişəndən sonra yüklənir — başlıq onda yenilənsin
  const { dictLang } = useLang() || {}
  useEffect(() => {
    if (DETAILS[page]?.selfSeo && param != null) { applySelfSeo(page, lang, param); return undefined }
    // Prerender olunmuş səhifənin ilk açılışı — <head> serverdən düzgün gəlib
    if (prerenderedHead(page, lang, param)) return undefined
    if (param == null) { applySeo(page, lang, null, null); return undefined }
    let cancelled = false
    // detail.js + yalnız bu növün məlumatı (hədis səhifəsində hədislər və s.) — detailLoaders.js
    loadDetail(page)
      .then((detail) => { if (!cancelled) applySeo(page, lang, param, detail) })
      // Chunk yüklənmədi — heç olmasa canonical/hreflang düzgün olsun
      .catch(() => { if (!cancelled) applySeo(page, lang, param, null) })
    return () => { cancelled = true }
  }, [page, lang, param, dictLang])

  return null
}

/** <head>-i səhifəyə uyğun yaz. detail — ./detail.js modulu (detal səhifəsində). */
function applySeo(page, lang, param, detail) {
  const meta = detail ? detail.detailMeta(page, lang, param) : null
  const title = meta ? detail.titleForDetail(page, lang, param) : titleFor(page, lang)
  const desc = meta ? fitDesc(meta.d) : descFor(page, lang)
  const canonical = urlFor(page, canonicalLang(page, lang, param), DETAILS[page]?.noindex ? undefined : (param ?? undefined))
  // Tanınmayan ünvan (404): indekslənmir, canonical/hreflang/sxem yazılmır —
  // əks halda Google onu ana səhifənin dublikatı ("soft-404") sayardı
  // Server bu URL-ə 404 qabığı verib (məs. /de/hadith/1 — hədis yalnız 5 dildə prerender olunur):
  // SPA məzmunu göstərsə də head 404 kimi qalır (noindex, canonical/hreflang/sxem yox)
  const isNotFound = page === 'notfound' || (atBootUrl() && BOOT.notFound)
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
    { rel: 'alternate', hreflang: 'x-default', href: SITE + pathFor(page, DEFAULT_LANG, param ?? undefined) },
  ])

  // Səhifə səviyyəli sxem — Google-a bu URL-in nə olduğunu deyir (src/seo/pageJsonLd.js)
  setJsonLd(isNotFound ? null : meta ? detail.detailJsonLd(page, lang, param)
    : pageJsonLd({ key: page, lang, title, desc, canonical, noindex: isNoindexPage }))

  // Sayt sxemi (WebSite + Organization + WebApplication; src/seo/siteSchema.js) — yalnız
  // ana səhifədə, cari dildə; digərlərində silinir. Saytın yeganə #website node-udur.
  setJsonLd(SITE_JSONLD_PAGES.includes(page) ? siteSchema(lang) : null, 'site-jsonld')
}
