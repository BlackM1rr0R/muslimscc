// ═══════════════════════════════════════════════════════
// Build sonrası statik HTML + sitemap generatoru
//
// Vite tək bir dist/index.html verir. Bu skript hər marşrut və hər dil
// üçün ayrıca dist/<yol>/index.html yazır — <head>-i həmin səhifəyə
// uyğun doldurulmuş halda.
//
// NİYƏ: Googlebot JS icra etsə də bunu gecikmə ilə edir, Bing və Yandex
// isə praktik olaraq etmir. Statik fayl olmadan bütün URL-lər eyni
// başlıq və təsviri qaytarır — yəni duplicate content.
//
// Bu SSR deyil: <body> hələ də SPA tərəfindən doldurulur. Fərq odur ki,
// hər URL indi özünə xas <title>, description, canonical, hreflang,
// Open Graph və JSON-LD ilə cavab verir; robotlar üçün əsas olan budur.
//
// İşə düşür: npm run build (bax package.json)
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE, LANGS, LOCALES, DEFAULT_LANG, PAGES, INDEXABLE, pathFor } from '../src/seo/routes.js'
import { titleFor, descFor, shortName, UI } from '../src/seo/meta.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const OG_IMAGE = `${SITE}/og-image.png`

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

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

/** Bir səhifə + dil üçün <head> parçası. */
function headFor(key, lang) {
  const canonical = SITE + pathFor(key, lang)
  const alts = [
    ...LANGS.map(l => `    <link rel="alternate" hreflang="${l}" href="${SITE + pathFor(key, l)}" data-seo="alt" />`),
    `    <link rel="alternate" hreflang="x-default" href="${SITE + pathFor(key, DEFAULT_LANG)}" data-seo="alt" />`,
  ].join('\n')

  const title = titleFor(key, lang)
  const desc = descFor(key, lang)

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url: canonical,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', name: 'Muslims.cc', url: SITE + '/' },
  }

  return [
    `    <link rel="canonical" href="${canonical}" data-seo="canonical" />`,
    alts,
    `    <script type="application/ld+json" data-seo="page-jsonld">${JSON.stringify(jsonld)}</script>`,
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
function noscriptFor(key, lang) {
  const ui = UI[lang] || UI.az
  const links = INDEXABLE
    .filter(p => p.key !== key)
    .map(p => `<li><a href="${pathFor(p.key, lang)}">${esc(shortName(p.key, lang))}</a></li>`)
    .join('')

  const langLinks = LANGS
    .filter(l => l !== lang)
    .map(l => `<a href="${pathFor(key, l)}" hreflang="${l}">${l.toUpperCase()}</a>`)
    .join(' · ')

  return `<noscript>
      <div style="font-family:system-ui,sans-serif;max-width:820px;margin:40px auto;padding:20px;line-height:1.7">
        <h1>${esc(shortName(key, lang))}</h1>
        <p>${esc(descFor(key, lang))}</p>
        <p>${langLinks}</p>
        <h2>${esc(ui.nav)}</h2>
        <ul>${links}</ul>
        <p><em>${esc(ui.js)}</em></p>
      </div>
    </noscript>`
}

/** Şablon HTML-i konkret səhifəyə uyğunlaşdır. */
function renderPage(template, key, lang, noindex = false) {
  const title = titleFor(key, lang)
  const desc = descFor(key, lang)
  const canonical = SITE + pathFor(key, lang)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  let html = template

  html = html.replace('<!--SEO:HEAD-->', headFor(key, lang))
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
  html = html.replace(/<html([^>]*)\slang="[^"]*"/i, '<html$1')
  html = html.replace(/<html([^>]*)>/i, `<html$1 lang="${lang}" dir="${dir}">`)

  html = replaceMeta(html, 'name', 'description', desc)
  html = replaceMeta(html, 'property', 'og:title', title)
  html = replaceMeta(html, 'property', 'og:description', desc)
  html = replaceMeta(html, 'property', 'og:url', canonical)
  html = replaceMeta(html, 'property', 'og:locale', LOCALES[lang] || LOCALES.az)
  html = replaceMeta(html, 'property', 'og:image', OG_IMAGE)
  html = replaceMeta(html, 'name', 'twitter:title', title)
  html = replaceMeta(html, 'name', 'twitter:description', desc)
  html = replaceMeta(html, 'name', 'twitter:image', OG_IMAGE)

  // Statik noscript blokunu səhifəyə uyğun olanı ilə əvəz et
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, () => noscriptFor(key, lang))

  if (noindex) {
    html = replaceMeta(html, 'name', 'robots', 'noindex, nofollow')
    html = replaceMeta(html, 'name', 'googlebot', 'noindex, nofollow')
  }

  return html
}

/** dist içində URL yoluna uyğun index.html yaz. */
function writeRoute(html, urlPath) {
  const dir = urlPath === '/' ? DIST : path.join(DIST, urlPath.replace(/^\//, ''))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = []

  for (const p of INDEXABLE) {
    for (const lang of LANGS) {
      const loc = SITE + pathFor(p.key, lang)
      const alts = [
        ...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE + pathFor(p.key, l)}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + pathFor(p.key, DEFAULT_LANG)}"/>`,
      ].join('\n')
      urls.push(
        `  <url>\n` +
        `    <loc>${loc}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${p.changefreq}</changefreq>\n` +
        `    <priority>${p.priority.toFixed(2)}</priority>\n` +
        `${alts}\n` +
        `  </url>`,
      )
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- Avtomatik yaradılır: scripts/prerender.js. Əl ilə redaktə etmə. -->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.join('\n') + `\n</urlset>\n`

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml, 'utf8')
  return urls.length
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

let count = 0
for (const p of PAGES) {
  // Admin marşrutları da statik yazılır ki, birbaşa açılanda 404 olmasın —
  // amma noindex olduqları üçün sitemap-a düşmürlər.
  const langs = p.noindex ? [DEFAULT_LANG] : LANGS
  for (const lang of langs) {
    writeRoute(renderPage(template, p.key, lang, Boolean(p.noindex)), pathFor(p.key, lang))
    count++
  }
}

const sitemapUrls = buildSitemap()
console.log(`✓ Prerender: ${count} statik HTML, sitemap.xml-də ${sitemapUrls} URL`)
