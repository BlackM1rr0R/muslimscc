import { useEffect } from 'react'
import { DETAILS, urlFor, pathFor, canonicalLang } from './routes'
import { useLang } from '../contexts/LangContext'
import { loadDetail } from './detailLoaders'
import { whenIdle } from '../utils/idle'

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
//
// PERFORMANS (2026-11-24): <head>-i YAZAN kod (meta.js-in bütün səhifə mətnləri, sxem
// qurucuları — ~112 KB xam) ./seoApply.js-dədir və TƏNBƏL yüklənir: prerender olunmuş
// səhifənin ilk açılışında lazım deyil (aşağıdakı BOOT). Boş vaxtda əvvəlcədən yüklənir —
// SPA naviqasiyasında başlıq gecikmədən dəyişir.
// ═══════════════════════════════════════════════════════

let applyPromise = null
/** ./seoApply.js (bir dəfə; uğursuz olsa növbəti çağırış yenidən cəhd edir). */
function loadApply() {
  if (!applyPromise) {
    applyPromise = import('./seoApply.js')
    applyPromise.catch(() => { applyPromise = null })
  }
  return applyPromise
}
if (typeof window !== 'undefined') whenIdle({ delay: 3000 }).then(() => loadApply()).catch(() => {})

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

// ── Öz head-ini idarə edən detal (DETAILS[key].selfSeo — /u/<ləqəb>) ──
// Məlumat serverdən gəlir (profil, icazə) — səhifə hazır olanda setSelfSeo() çağırır.
// Seo.jsx və səhifə EYNİ vəziyyəti yazır: hansı effekt sonra işləsə də (dil lüğəti
// gec yüklənəndə Seo yenidən işləyir) nəticə eynidir. Səhifə hələ yazmayıbsa — noindex,
// canonical/hreflang/sxem yoxdur.
let selfState = null   // { page, param, lang, robots, title, desc, canonical, jsonLd }

/** state = null — sıfırla; əks halda { page, param, lang, robots, title, desc, canonical?, jsonLd? } */
export function setSelfSeo(state) {
  selfState = state || null
  if (selfState) applySelf(selfState.page, selfState.lang, selfState.param)
}

/** Öz head-ini idarə edən detal — yazılan anda cari selfState (bu səhifə üçündürsə) ilə. */
function applySelf(page, lang, param) {
  loadApply().then((m) => {
    const s = selfState && selfState.page === page && selfState.param === param ? selfState : null
    m.applySelfSeo(page, lang, s)
  }).catch(() => { /* chunk yüklənmədi — serverin noindex head-i qalır */ })
}

export default function Seo({ page, lang, param = null }) {
  // Əlavə dilin lüğəti dil dəyişəndən sonra yüklənir — başlıq onda yenilənsin
  const { dictLang } = useLang() || {}
  useEffect(() => {
    if (DETAILS[page]?.selfSeo && param != null) { applySelf(page, lang, param); return undefined }
    // Prerender olunmuş səhifənin ilk açılışı — <head> serverdən düzgün gəlib
    if (prerenderedHead(page, lang, param)) return undefined
    // 404 qabığı — effekt anında yoxlanılır (atBootUrl() ünvandan çıxışı bir dəfəlik qeyd edir)
    const bootNotFound = atBootUrl() && BOOT.notFound
    let cancelled = false
    // detail.js + yalnız bu növün məlumatı (hədis səhifəsində hədislər və s.) — detailLoaders.js.
    // Chunk yüklənmədisə (null) — heç olmasa canonical/hreflang düzgün olsun
    const detail = param == null ? Promise.resolve(null) : loadDetail(page).catch(() => null)
    Promise.all([loadApply(), detail])
      .then(([m, d]) => { if (!cancelled) m.applySeo(page, lang, param, d, bootNotFound) })
      .catch(() => { /* seoApply chunk-ı yüklənmədi — əvvəlki head qalır */ })
    return () => { cancelled = true }
  }, [page, lang, param, dictLang])

  return null
}
