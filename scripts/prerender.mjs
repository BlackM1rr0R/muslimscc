// ═══════════════════════════════════════════════════════
// Build sonrası statik HTML + sitemap generatoru
//
// Vite tək bir dist/index.html verir. Bu skript hər marşrut və hər dil
// üçün ayrıca dist/<yol>/index.html yazır — <head>-i həmin səhifəyə
// uyğun doldurulmuş halda. Üstəlik dist/404.html: server naməlum ünvana
// onu HTTP 404 statusu ilə qaytarır (noindex, canonical-sız SPA qabığı).
//
// NİYƏ: Googlebot JS icra etsə də bunu gecikmə ilə edir, Bing və Yandex
// isə praktik olaraq etmir. Statik fayl olmadan bütün URL-lər eyni
// başlıq və təsviri qaytarır — yəni duplicate content.
//
// Bu SSR deyil: <body>-ni SPA doldurur. Fərq odur ki, hər URL özünə xas
// <title>, description, canonical, hreflang, Open Graph və JSON-LD ilə
// cavab verir; robotlar üçün əsas olan budur.
//
// DETAL SƏHİFƏLƏRİ: hər surə (/quran/<n>-<slug>), hər ad (/names/<n>-<slug>)
// və hər səhabə (/sahaba/<slug>) 5 dildə ayrıca HTML alır — öz meta-sı və
// <div id="root"> içində HƏQİQİ statik məzmunla (scripts/seo-body.mjs):
// surənin ərəbcə mətni + tərcüməsi, adın mənası, səhabənin həyatı. Siyahı
// səhifələri (/quran, /names, /sahaba) bütün detallara linkləri alır.
// React yüklənəndə bu blok tətbiqin öz görünüşü ilə əvəzlənir.
//
// SITEMAP: sitemap.xml — indeks (robots.txt və Search Console onu göstərir),
// altında sitemap-pages.xml, sitemap-quran.xml, sitemap-names.xml, sitemap-sahaba.xml,
// sitemap-scholars.xml (Sələf alimləri — /scholars/<slug>),
// sitemap-glossary.xml (lüğət terminləri — /glossary/<id>).
//
// İşə düşür: npm run build (bax package.json)
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

import { SITE, LANGS, LOCALES, DEFAULT_LANG, PAGES, INDEXABLE, DETAILS, pathFor, detailParams, langsFor, seoLangsFor, canonicalLang, uiLang, dirOf } from '../src/seo/routes.js'
import { titleFor, descFor, fitDesc, shortName, UI, ogImageFor, OG_ALT } from '../src/seo/meta.js'
import { brandName, siteJsonLd } from '../src/config/brand.js'
import { detailMeta, titleForDetail, detailJsonLd } from '../src/seo/detail.js'
import { staticBodyFor, staticPreloadFor, hasQuranData } from './seo-body.mjs'
import { setUiDict } from '../src/utils/uiText.js'
import { buildLlmsTxt } from './llms-txt.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Çıxış qovluğu: susmaya görə dist/. `--out <qovluq>` (və ya PRERENDER_DIST
// mühit dəyişəni) ilə başqa qovluq verilə bilər — məs. `vite build --outDir X`
// ilə ayrıca yığılmış nüsxəni yoxlamaq üçün, işlək dist/-ə toxunmadan.
const outArg = process.argv.indexOf('--out')
const DIST = path.resolve(ROOT,
  outArg > -1 && process.argv[outArg + 1] ? process.argv[outArg + 1]
  : process.env.PRERENDER_DIST || 'dist')

// Sayt sxemi (schema.org WebSite + Organization) hansı səhifələrdə yazılır —
// src/seo/Seo.jsx-dəki SITE_JSONLD_PAGES ilə EYNİ olmalıdır. Yalnız ana
// səhifədə: Google sayt adını və loqosunu kök URL-dən götürür. index.html-dəki
// statik WebSite bloku eyni @id-ni (…/#website) daşıyır — bir obyekt sayılır.
const SITE_JSONLD_PAGES = ['home']

// Tanınmayan ünvan (404) — App.jsx parsePath(...).known === false olanda
// məhz bu açarla NotFoundPage göstərir, Seo.jsx də eyni açarı yoxlayır.
// PAGES-də yoxdur: sitemap-a düşmür, yalnız dist/404.html kimi yazılır.
const NOT_FOUND = 'notfound'

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;') // replaceMeta-nın regex-i content-də ' görməsin

/** Mövcud <meta ...content="..."> dəyərini əvəz et; teq yoxdursa toxunma. */
function replaceMeta(html, attr, key, value) {
  const re = new RegExp(
    `(<meta\\s+[^>]*${attr}=["']${key}["'][^>]*content=["'])([^"']*)(["'])`,
    'i',
  )
  if (re.test(html)) return html.replace(re, `$1${esc(value)}$3`)
  const re2 = new RegExp(
    `(<meta\\s+[^>]*content=["'])([^"']*)(["'][^>]*${attr}=["']${key}["'])`,
    'i',
  )
  if (re2.test(html)) return html.replace(re2, `$1${esc(value)}$3`)
  return html
}

/**
 * Səhifənin izi (breadcrumb): Ana səhifə → səhifə. src/seo/Seo.jsx ilə EYNİ
 * quruluş — JS-li və JS-siz robot eyni sxemi görür.
 */
function breadcrumbFor(key, lang, title) {
  const brand = brandName(lang)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: brand, item: SITE + pathFor('home', lang) },
      ...(key === 'home'
        ? []
        : [{ '@type': 'ListItem', position: 2, name: title.split(' | ')[0], item: SITE + pathFor(key, lang) }]),
    ],
  }
}

/** Səhifənin title/description-u (detal səhifəsində — src/seo/detail.js). */
function textsFor(key, lang, param) {
  if (param != null) return { title: titleForDetail(key, lang, param), desc: fitDesc(detailMeta(key, lang, param).d) }
  return { title: titleFor(key, lang), desc: descFor(key, lang) }
}

/** Bir səhifə + dil (+ detal parametri) üçün <head> parçası. */
function headFor(key, lang, param = null) {
  const p = param ?? undefined
  // Əlavə dildə əsas-məzmunlu detal (dərs, lüğət, …) — kanonik ingilis səhifəsidir (routes.js → canonicalLang)
  const canonical = SITE + pathFor(key, canonicalLang(key, lang, param), p)
  const alts = [
    // Səhifənin SEO dilləri (Quran — bütün dillər; dərs/lüğət detalı — 5 əsas dil; src/seo/routes.js)
    ...seoLangsFor(key, param).map(l => `    <link rel="alternate" hreflang="${l}" href="${SITE + pathFor(key, l, p)}" data-seo="alt" />`),
    `    <link rel="alternate" hreflang="x-default" href="${SITE + pathFor(key, DEFAULT_LANG, p)}" data-seo="alt" />`,
  ].join('\n')

  const { title, desc } = textsFor(key, lang, param)

  // Detal: WebPage + breadcrumb (3 addım) + mainEntity (Chapter / DefinedTerm / Person)
  const jsonld = param != null ? detailJsonLd(key, lang, param) : {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url: canonical,
    inLanguage: lang,
    // @id siteJsonLd()-dəki WebSite ilə eynidir — Google onları birləşdirir
    isPartOf: { '@type': 'WebSite', '@id': SITE + '/#website', name: brandName(lang), url: SITE + '/' },
    breadcrumb: breadcrumbFor(key, lang, title),
  }

  return [
    `    <link rel="canonical" href="${canonical}" data-seo="canonical" />`,
    alts,
    `    <script type="application/ld+json" data-seo="page-jsonld">${JSON.stringify(jsonld)}</script>`,
    // Sayt sxemi (WebSite + Organization) — yalnız ana səhifədə, həmin dildə
    ...(SITE_JSONLD_PAGES.includes(key)
      ? [`    <script type="application/ld+json" data-seo="site-jsonld">${JSON.stringify(siteJsonLd(lang))}</script>`]
      : []),
  ].join('\n')
}

/**
 * Səhifəyə xas <noscript> məzmunu.
 *
 * Əvvəl bütün URL-lərdə eyni siyahı dururdu — JS-siz robot üçün 152 səhifə
 * eyni mətn deməkdir. İndi hər səhifə öz h1/təsvirini alır, altındakı naviqasiya
 * isə daxili linklərin krawl oluna bilən qrafını verir (anchor mətni = həmin
 * səhifənin adı), üstəlik dil variantlarına keçidlə.
 */
function noscriptFor(key, lang, withBody = false) {
  const ui = UI[uiLang(lang)] || UI.az
  const links = INDEXABLE
    .filter(p => p.key !== key)
    .map(p => `<li><a href="${pathFor(p.key, lang)}">${esc(shortName(p.key, lang))}</a></li>`)
    .join('')

  // 404 səhifəsinin dil variantı yoxdur — pathFor onu ana səhifəyə
  // çevirərdi, hreflang isə yanlış "bu səhifənin tərcüməsi" deyərdi
  const langLinks = key === NOT_FOUND ? '' : langsFor(key)
    .filter(l => l !== lang)
    .map(l => `<a href="${pathFor(key, l)}" hreflang="${l}">${l.toUpperCase()}</a>`)
    .join(' · ')

  // Statik <body> bloku olan səhifədə h1/təsvir onsuz da görünür — burada
  // yalnız bölmələrin naviqasiyası qalır (ikinci h1 olmasın)
  if (withBody) {
    return `<noscript>
      <div style="font-family:system-ui,sans-serif;max-width:820px;margin:40px auto;padding:20px;line-height:1.7">
        <h2>${esc(ui.nav)}</h2>
        <ul>${links}</ul>
        <p><em>${esc(ui.js)}</em></p>
      </div>
    </noscript>`
  }

  return `<noscript>
      <div style="font-family:system-ui,sans-serif;max-width:820px;margin:40px auto;padding:20px;line-height:1.7">
        <h1>${esc(shortName(key, lang))}</h1>
        <p>${esc(descFor(key, lang))}</p>${langLinks ? `
        <p>${langLinks}</p>` : ''}
        <h2>${esc(ui.nav)}</h2>
        <ul>${links}</ul>
        <p><em>${esc(ui.js)}</em></p>
      </div>
    </noscript>`
}

const UI_DICTS = new Map()
function uiDictFor(lang) {
  if (!UI_DICTS.has(lang)) {
    const f = path.join(ROOT, 'src', 'i18n', `${lang}.json`)
    UI_DICTS.set(lang, /^[a-z]{2}$/.test(lang) && fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null)
  }
  return UI_DICTS.get(lang)
}

/**
 * Şablon HTML-i konkret səhifəyə uyğunlaşdır.
 *
 * key === NOT_FOUND (dist/404.html): canonical, hreflang, səhifə sxemi və
 * og:url YAZILMIR — bu faylı server istənilən naməlum ünvana 404 statusu ilə
 * qaytarır, ona görə o heç bir konkret URL-i "özüm" deyə göstərməməlidir
 * (Seo.jsx brauzerdə canonical/hreflang/sxem üçün eyni qaydanı tətbiq edir).
 * Həmişə noindex.
 */
function renderPage(template, key, lang, noindex = false, param = null) {
  // Əlavə dilin interfeys lüğəti (src/i18n/<dil>.json) — title/description və
  // noscript naviqasiyası tərcümə olunsun (brauzerdə main.jsx eyni lüğəti yükləyir)
  setUiDict(lang, uiDictFor(lang))
  const notFound = key === NOT_FOUND
  const { title, desc } = notFound ? { title: titleFor(key, lang), desc: descFor(key, lang) } : textsFor(key, lang, param)
  const canonical = SITE + pathFor(key, lang, param ?? undefined)
  // Statik HTML səhifənin öz dilindədir (urdu/fars/puştu — rtl); React
  // yüklənəndə interfeys dili (LangContext) istiqaməti yenidən qoyur
  const dir = dirOf(lang)

  let html = template

  html = notFound
    ? html.replace(/[ \t]*<!--SEO:HEAD-->[ \t]*\r?\n?/, '')
    : html.replace('<!--SEO:HEAD-->', () => headFor(key, lang, param))
  // Səhifə chunk-ı + şrift preload-ları (yuxarıdakı PERFORMANS bölməsi)
  // + Quran səhifələrində alquran.cloud məlumat preload-ları (seo-body.mjs → staticPreloadFor)
  html = html.replace(/[ \t]*<!--PERF:PRELOAD-->/, () => preloadFor(key, lang) + (notFound || noindex ? '' : staticPreloadFor(key, lang, param)))
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
  html = html.replace(/<html([^>]*)\slang="[^"]*"/i, '<html$1')
  html = html.replace(/<html([^>]*)>/i, `<html$1 lang="${lang}" dir="${dir}">`)

  html = replaceMeta(html, 'name', 'description', desc)
  html = replaceMeta(html, 'property', 'og:title', title)
  html = replaceMeta(html, 'property', 'og:description', desc)
  html = notFound
    ? html.replace(/[ \t]*<meta\s+[^>]*property=["']og:url["'][^>]*>[ \t]*\r?\n?/i, '')
    : replaceMeta(html, 'property', 'og:url', canonical)
  html = replaceMeta(html, 'property', 'og:locale', LOCALES[lang] || LOCALES.az)
  // Sayt adı da səhifənin dilində (BRAND.name hər dil üçün ayrıca verilir)
  html = replaceMeta(html, 'property', 'og:site_name', brandName(lang))
  // og:locale:alternate — cari dildən BAŞQA dörd dil (şablondakı sabit siyahı
  // /en/ səhifəsində en_US-u özünə alternativ göstərir, az_AZ-ı buraxırdı)
  html = html.replace(
    /(\s*<meta\s+property="og:locale:alternate"[^>]*>)+/i,
    (notFound ? LANGS : langsFor(key)).filter(l => l !== lang)
      .map(l => `\n    <meta property="og:locale:alternate" content="${LOCALES[l]}" />`)
      .join(''),
  )
  // Paylaşım kartı səhifənin dilində (og-image-<dil>.png, az = og-image.png)
  const ogAlt = OG_ALT[uiLang(lang)] || OG_ALT.az
  // v5.9: surə və Allahın adlarının öz kartı (public/og/, scripts/gen-og-pages.py) — dildən asılı deyil
  const ogPage = (key === 'quran' || key === 'names') && Number.isInteger(param) && fs.existsSync(path.join(ROOT, 'public', 'og', `${key}-${param}.png`))
  const ogImg = ogPage ? `${ogImageFor(lang).replace(/\/[^/]+$/, '')}/og/${key}-${param}.png` : ogImageFor(lang)
  html = replaceMeta(html, 'property', 'og:image', ogImg)
  html = replaceMeta(html, 'property', 'og:image:alt', ogAlt)
  html = replaceMeta(html, 'name', 'twitter:title', title)
  html = replaceMeta(html, 'name', 'twitter:description', desc)
  html = replaceMeta(html, 'name', 'twitter:image', ogImg)
  html = replaceMeta(html, 'name', 'twitter:image:alt', ogAlt)

  // Statik məzmun (detal və siyahı səhifələri) — <div id="root"> içinə;
  // React (main.jsx → createRoot) yüklənəndə onu tətbiqlə əvəz edir
  const body = notFound || noindex ? '' : staticBodyFor(key, lang, param)
  if (body) html = html.replace('<div id="root"></div>', () => `<div id="root">${body}</div>`)

  // Statik noscript blokunu səhifəyə uyğun olanı ilə əvəz et
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, () => noscriptFor(key, lang, Boolean(body)))

  if (noindex || notFound) {
    html = replaceMeta(html, 'name', 'robots', 'noindex, nofollow')
    html = replaceMeta(html, 'name', 'googlebot', 'noindex, nofollow')
  }

  return html
}

// ═══════════════════════════════════════════════════════
// PERFORMANS: səhifəyə xas preload-lar (<!--PERF:PRELOAD-->)
//
// NƏ: hər statik HTML-ə həmin marşrutun səhifə chunk-ı (+ onun statik
// asılılıqları) üçün <link rel="modulepreload"> və CSS-i üçün
// <link rel="preload" as="style">, üstəlik cari dilin əsas şrift faylları
// üçün <link rel="preload" as="font"> yazılır.
// NİYƏ: səhifələr React.lazy ilə ayrıca chunk-dır (App.jsx). Preload olmadan
// zəncir belə idi: HTML → index.js → (icra) → import('QuranPage') → onun CSS-i
// — yəni 2 əlavə gediş-gəliş (mobil 4G-də hər biri ~150+ ms). İndi brauzer
// səhifə chunk-ını index.js ilə PARALEL yükləyir; Vite-in preload köməkçisi
// mövcud <link href>-i görüb təkrar yükləmir. Şriftlər isə adətən CSS + JS
// render olunandan sonra kəşf olunur — preload onları da paralel başladır.
// Manifest (vite build → .vite/manifest.json) yoxdursa — heç nə yazılmır.
// ═══════════════════════════════════════════════════════

/** App.jsx-dən: səhifə açarı → src/pages/X.jsx (yalnız React.lazy olanlar). */
function pageModules() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8')
  const lazyMap = {}
  // lazy(...) və ya lazyPage(...) (App.jsx — preload-lu variant, məs. HomePage)
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*lazy(?:Page)?\(\s*\(\)\s*=>\s*import\(\s*['"]\.\/pages\/(\w+)['"]/g)) {
    lazyMap[m[1]] = `src/pages/${m[2]}.jsx`
  }
  const byKey = {}
  for (const m of src.matchAll(/case\s+'(\w+)':\s*return\s*<(\w+)/g)) {
    if (lazyMap[m[2]]) byKey[m[1]] = lazyMap[m[2]]
  }
  return byKey
}

function readManifest() {
  const p = path.join(DIST, '.vite', 'manifest.json')
  if (!fs.existsSync(p)) return null
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

/** Manifest girişinin statik asılılıq qapanışı: { js:Set, css:Set } (giriş özü daxil). */
function closure(manifest, key, acc = { js: new Set(), css: new Set() }) {
  const e = manifest[key]
  if (!e || acc.js.has(e.file)) return acc
  acc.js.add(e.file)
  for (const c of e.css || []) acc.css.add(c)
  for (const i of e.imports || []) closure(manifest, i, acc)
  return acc
}

// Dil → ilk ekranda mütləq lazım olan şrift faylları (src/assets/fonts/fonts.css).
// Yalnız əsas mətn şrifti (Ubuntu Sans / ərəbcə IBM Plex): başlıq (Ubuntu Sans Mono) və
// Quran (Amiri) şriftləri səhifədən asılıdır — preload olunsa, istifadə
// olunmayan səhifədə boş yerə bant genişliyi yeyərdi.
const FONT_PRELOAD = {
  az: ['inter-latin-var', 'inter-az-var'],
  tr: ['inter-latin-var', 'inter-az-var'],
  en: ['inter-latin-var'],
  ru: ['inter-latin-var', 'inter-cyrillic-var'],
  ar: ['ibm-plex-sans-arabic-arabic-400'],
  // Əlavə dillər (src/seo/langs.js): ərəb əlifbalı — ərəbcə şrift, kiril — kiril dəsti
  ur: ['ibm-plex-sans-arabic-arabic-400'],
  fa: ['ibm-plex-sans-arabic-arabic-400'],
  ps: ['ibm-plex-sans-arabic-arabic-400'],
  uz: ['inter-latin-var', 'inter-cyrillic-var'],
  ku: ['ibm-plex-sans-arabic-arabic-400'],
  ug: ['ibm-plex-sans-arabic-arabic-400'],
  ky: ['inter-latin-var', 'inter-cyrillic-var'],
  tg: ['inter-latin-var', 'inter-cyrillic-var'],
  sr: ['inter-latin-var', 'inter-cyrillic-var'],
}

function makePreloader() {
  const manifest = readManifest()
  if (!manifest) return () => ''
  const entryKey = Object.keys(manifest).find(k => manifest[k].isEntry)
  const entry = entryKey ? closure(manifest, entryKey) : { js: new Set(), css: new Set() }
  const modules = pageModules()
  const assets = fs.existsSync(path.join(DIST, 'assets')) ? fs.readdirSync(path.join(DIST, 'assets')) : []
  // Vite adı: <ad>-<8 simvollu hash>.woff2 ("inter-latin-var-…" ≠ "inter-latin-ext-var-…")
  const fontFile = (base) => assets.find(f => f.startsWith(base + '-') && f.endsWith('.woff2') &&
    /^[\w-]{8}$/.test(f.slice(base.length + 1, -'.woff2'.length)))

  // Manifest açarı adətən mənbə yoludur (src/pages/X.jsx), amma bəzən Vite
  // dinamik chunk-ı "_X-<hash>.js" adı ilə yazır (src sahəsi olmadan, məs.
  // HomePage) — onda chunk adı ilə axtarılır
  const manifestKey = (src) => {
    if (!src) return null
    if (manifest[src]) return src
    const name = path.basename(src).replace(/\.\w+$/, '')
    return Object.keys(manifest).find(k => manifest[k].isDynamicEntry && manifest[k].name === name &&
      manifest[k].file.endsWith('.js')) || null
  }

  return (key, lang) => {
    const lines = []
    // Siyahıda olmayan əlavə dil (latın əlifbalı) — ingiliscənin latın dəsti
    for (const base of FONT_PRELOAD[lang] || FONT_PRELOAD.en) {
      const f = fontFile(base)
      if (f) lines.push(`<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`)
    }
    const mod = manifestKey(modules[key])
    if (mod) {
      const { js, css } = closure(manifest, mod)
      for (const f of js) if (!entry.js.has(f)) lines.push(`<link rel="modulepreload" crossorigin href="/${f}" />`)
      // crossorigin VAR: Vite-in köməkçisi CSS <link>-ini də crossorigin ilə
      // yaradır — rejim uyğun gəlməsə, preload istifadə olunmur (Chrome:
      // "credentials mode does not match") və fayl iki dəfə yüklənir (yoxlanılıb)
      for (const f of css) if (!entry.css.has(f)) lines.push(`<link rel="preload" as="style" crossorigin href="/${f}" />`)
    }
    // PERFORMANS: /hadith — cari dilin hədis modulu (vite.config.js →
    // "virtual:hadiths/<dil>", chunk "hadiths-<dil>") HadithPage chunk-ı ilə
    // PARALEL yüklənsin; yoxsa chunk → məlumat ardıcıl iki gediş-gəliş olardı.
    if (key === 'hadith') {
      const hk = `virtual:hadiths/${lang}.js`
      if (manifest[hk]) lines.push(`<link rel="modulepreload" crossorigin href="/${manifest[hk].file}" />`)
    }
    // PERFORMANS: əlavə dilin interfeys lüğəti (src/i18n/<dil>.json, ~130 KB gzip)
    // main.jsx-də İLK RENDER-DƏN ƏVVƏL gözlənilir — əsas paketlə PARALEL yüklənsin
    // (əks halda əvvəl main.js, sonra lüğət: ardıcıl iki gediş-gəliş)
    const dk = `src/i18n/${lang}.json`
    if (manifest[dk]) lines.push(`<link rel="modulepreload" crossorigin href="/${manifest[dk].file}" />`)
    return lines.map(l => '    ' + l).join('\n')
  }
}

const preloadFor = makePreloader()

/** dist içində URL yoluna uyğun index.html yaz. */
function writeRoute(html, urlPath) {
  const dir = urlPath === '/' ? DIST : path.join(DIST, urlPath.replace(/^\//, ''))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
}

// Detal səhifələrinin sitemap parametrləri (siyahı səhifəsindən bir az aşağı)
const DETAIL_SITEMAP = {
  quran:  { file: 'sitemap-quran.xml',  priority: 0.8,  changefreq: 'monthly' },
  names:  { file: 'sitemap-names.xml',  priority: 0.7,  changefreq: 'monthly' },
  sahaba: { file: 'sitemap-sahaba.xml', priority: 0.7,  changefreq: 'monthly' },
  scholars: { file: 'sitemap-scholars.xml', priority: 0.7, changefreq: 'monthly' },
  learn:  { file: 'sitemap-learn.xml',  priority: 0.75, changefreq: 'monthly' },
  glossary: { file: 'sitemap-glossary.xml', priority: 0.7, changefreq: 'monthly' },
  prayer: { file: 'sitemap-prayer.xml', priority: 0.9, changefreq: 'daily' },
  hadith: { file: 'sitemap-hadith.xml', priority: 0.7, changefreq: 'monthly' },
}

/**
 * Bir URL girişi — yalnız <loc> (2026-11-13).
 * hreflang alternativləri sitemap-da YOXDUR: hər səhifənin HTML-ində artıq var (<link rel="alternate">,
 * ~51 ədəd — tests/e2e/seo-detail.spec.js). Google iki üsuldan birini istəyir; ikisi birlikdə hər URL-ə
 * ~5 KB əlavə edirdi (sitemap-quran.xml 20 MB) və Search Console sitemap-ı aylarla "Getirilemedi"
 * vəziyyətində saxlayırdı. lastmod (hər build-də bu gün), changefreq, priority — Google onları nəzərə
 * almır / etibarsız sayır, ona görə yazılmır.
 */
function urlEntry(key, lang, param) {
  return `  <url><loc>${SITE + pathFor(key, lang, param ?? undefined)}</loc></url>`
}

function writeUrlset(file, urls) {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- Avtomatik yaradılır: scripts/prerender.mjs. Əl ilə redaktə etmə. -->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') + `\n</urlset>\n`
  fs.writeFileSync(path.join(DIST, file), xml, 'utf8')
}

// Google: bir sitemap ≤ 50 MB (sıxılmamış) və ≤ 50 000 URL. Bölmə ≤ SITEMAP_CHUNK URL-lik
// hissələrə bölünür: birinci hissə köhnə adı saxlayır (sitemap-quran.xml), qalanları
// sitemap-quran-2.xml, -3 … (indi hər URL ~70 bayt — fayllar 0.3 MB-dan kiçikdir).
const SITEMAP_CHUNK = 4000
function writeUrlsetChunks(file, urls) {
  const out = []
  for (let i = 0; i * SITEMAP_CHUNK < urls.length || i === 0; i++) {
    const name = i === 0 ? file : file.replace(/\.xml$/, `-${i + 1}.xml`)
    writeUrlset(name, urls.slice(i * SITEMAP_CHUNK, (i + 1) * SITEMAP_CHUNK))
    out.push(name)
  }
  return out
}

/**
 * sitemap.xml — sitemap İNDEKSİ (robots.txt "Sitemap:" sətri və Search Console
 * onu göstərir), altında bölmələr üzrə ayrıca fayllar: oxunaqlıdır və hər
 * bölmənin indekslənməsi Search Console-da ayrıca görünür.
 */
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const files = []
  let total = 0

  const pages = []
  for (const p of INDEXABLE) {
    for (const lang of langsFor(p.key)) pages.push(urlEntry(p.key, lang, null))
  }
  files.push(...writeUrlsetChunks('sitemap-pages.xml', pages))
  total += pages.length

  for (const key of Object.keys(DETAILS)) {
    const cfg = DETAIL_SITEMAP[key]
    // İndekslənməyən detallar (qrup otaqları və s.) sitemap-a düşmür
    if (!cfg || DETAILS[key].noindex) continue
    const urls = []
    for (const param of detailParams(key)) {
      // Sitemap-a yalnız kanonik variantlar (əlavə dildəki dərs/lüğət detalı — ingilis səhifəsinin surəti)
      for (const lang of seoLangsFor(key, param)) urls.push(urlEntry(key, lang, param))
    }
    files.push(...writeUrlsetChunks(cfg.file, urls))
    total += urls.length
  }

  const index =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- Avtomatik yaradılır: scripts/prerender.mjs. Əl ilə redaktə etmə. -->\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    files.map(f => `  <sitemap>\n    <loc>${SITE}/${f}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`).join('\n') +
    `\n</sitemapindex>\n`
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), index, 'utf8')
  return { total, files }
}

// ── İcra ─────────────────────────────────────────────

const templatePath = path.join(DIST, 'index.html')
if (!fs.existsSync(templatePath)) {
  console.error('✗ dist/index.html tapılmadı — əvvəlcə `vite build` işlət.')
  process.exit(1)
}

const template = fs.readFileSync(templatePath, 'utf8')
if (!template.includes('<!--SEO:HEAD-->')) {
  console.error('✗ index.html-də <!--SEO:HEAD--> yer tutucusu yoxdur (vite build-i yenidən işlət).')
  process.exit(1)
}

if (!hasQuranData()) {
  console.error('✗ seo-data/quran/ yoxdur — node scripts/fetch-quran-seo.mjs işlət (məlumat repoya commit olunur).')
  process.exit(1)
}

const t0 = Date.now()
let count = 0
for (const p of PAGES) {
  // Admin marşrutları da HƏR DİLDƏ statik yazılır: server artıq naməlum
  // ünvana həqiqi 404 qaytarır (bax: infra/nginx/muslims.cc.conf),
  // tətbiq isə interfeys ingiliscə olanda admini /en/admin ünvanında açır.
  // noindex olduqları üçün sitemap-a düşmürlər.
  for (const lang of langsFor(p.key)) {
    writeRoute(renderPage(template, p.key, lang, Boolean(p.noindex)), pathFor(p.key, lang))
    count++
  }
}

// ── Detal səhifələri: surələr, 99 ad, səhabələr × 5 dil ──
let detailCount = 0
for (const key of Object.keys(DETAILS)) {
  for (const param of detailParams(key)) {
    for (const lang of (DETAILS[key].coreOnly ? LANGS : langsFor(key))) {
      writeRoute(renderPage(template, key, lang, false, param), pathFor(key, lang, param))
      detailCount++
    }
  }
}
count += detailCount

// ── 404 səhifəsi ──
// nginx: error_page 404 /404.html · Apache: ErrorDocument 404 /404.html.
// Tanınmayan ünvan (/nope, /ru/nope) HTTP 404 statusu ilə bu SPA qabığını
// alır; brauzerdə App.jsx həmin yolu 'notfound' kimi, URL-in dilində göstərir.
// Əvvəl belə ünvanlar 200 + ana səhifə qaytarırdı ("soft-404").
fs.writeFileSync(path.join(DIST, '404.html'), renderPage(template, NOT_FOUND, DEFAULT_LANG), 'utf8')
count++

const sitemap = buildSitemap()
// llms.txt — AI axtarış sistemləri üçün saytın xəritəsi (scripts/llms-txt.mjs)
fs.writeFileSync(path.join(DIST, 'llms.txt'), buildLlmsTxt(), 'utf8')
console.log(`✓ Prerender: ${count} statik HTML (404.html daxil; ${detailCount} detal səhifəsi), ${((Date.now() - t0) / 1000).toFixed(1)} san.`)
console.log(`✓ Sitemap: sitemap.xml (indeks) → ${sitemap.files.join(', ')} — cəmi ${sitemap.total} URL`)

// ── Əvvəlcədən sıxılma (nginx gzip_static) ──
// NƏ: dist-dəki hər mətn faylının yanına maksimum səviyyəli (9) .gz surəti.
// NİYƏ: nginx (infra/nginx/muslims.cc.conf → gzip_static on) hazır .gz-ni
// verir — hər sorğuda yenidən sıxmır (CPU və TTFB), həm də səviyyə 6 əvəzinə
// 9 (bir neçə % kiçik). Brotli üçün nginx-unprivileged image-ində modul
// yoxdur; ziyarətçiyə brotli/zstd-ni onsuz da Cloudflare özü verir.
// nginx-in gzip_min_length (1024) həddindən kiçik və ya sıxılanda
// kiçilməyən fayllar üçün .gz yazılmır.
// HTML ÜÇÜN YAZILMIR: 25 000+ səhifənin .gz surəti (~270 MB, artıq sıxılmış —
// tar.gz-də kiçilmir) web image-ini ~550 MB-a çıxarıb serverin 400 MB yükləmə
// həddini (infra/ci-gate.sh) aşırdı → 2026-11-07 deploy kəsik arxivlə düşdü.
// HTML-i nginx dinamik gzip (səviyyə 6) sıxır; ziyarətçiyə Cloudflare verir.
const COMPRESSIBLE = /\.(js|css|svg|json|xml|txt|webmanifest)$/
function precompress(dir) {
  let n = 0
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) { if (!ent.name.startsWith('.')) n += precompress(p); continue }
    if (!COMPRESSIBLE.test(ent.name)) continue
    const buf = fs.readFileSync(p)
    if (buf.length < 1024) continue
    const gz = zlib.gzipSync(buf, { level: 9 })
    if (gz.length < buf.length * 0.95) { fs.writeFileSync(p + '.gz', gz); n++ }
  }
  return n
}
console.log(`✓ Əvvəlcədən sıxılma: ${precompress(DIST)} .gz faylı`)
