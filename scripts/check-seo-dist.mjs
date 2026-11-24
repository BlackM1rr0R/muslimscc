// ═══════════════════════════════════════════════════════
// Build-dən sonra SEO yoxlaması (CI, build job-u; ~bir neçə saniyə) — dist-in nümunəsi üzərində:
//   • JSON-LD: sintaksis + hər @type üçün tələb olunan sahələr (Google rich result qaydaları),
//     saxta reytinq/rəy (aggregateRating, review) QADAĞAN.
//   • canonical: tək, mütləq https://muslims.cc/…, routes.js qaydası ilə eyni (əlavə dildəki
//     əsas-məzmunlu detal → /en, src/seo/routes.js → canonicalLang).
//   • hreflang: öz dilinə özünə istinad (self-reference), x-default = az ünvanı, hər hədəf faylı
//     dist-də var və hədəfin hreflang dəsti EYNİDİR (reciprocity). noindex səhifədə hreflang/sxem yoxdur.
//   • robots: indekslənən səhifə "index", noindex açarı "noindex"; 404.html — noindex, canonical yox.
// İşə salma: node scripts/check-seo-dist.mjs [dist]   (lead/CI build-dən sonra)
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE, LANGS, DEFAULT_LANG, PAGES, DETAILS, pathFor, detailParams, langsFor, seoLangsFor, canonicalLang,
} from '../src/seo/routes.js'

// ── HTML-dən çıxarış ──
const attr = (tag, name) => (new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag) || [])[1]
export function parseHead(html) {
  const links = [...html.matchAll(/<link\s[^>]*>/gi)].map(m => m[0])
  const canon = links.filter(l => /rel="canonical"/i.test(l)).map(l => attr(l, 'href'))
  const alts = links.filter(l => /rel="alternate"/i.test(l) && /hreflang=/i.test(l))
    .map(l => ({ lang: attr(l, 'hreflang'), href: attr(l, 'href') }))
  const robots = (/<meta\s+name="robots"\s+content="([^"]*)"/i.exec(html) || [])[1] || ''
  const title = (/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || ''
  const desc = (/<meta\s+name="description"\s+content="([^"]*)"/i.exec(html) || [])[1] || ''
  const jsonld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  return { canon, alts, robots, title, desc, jsonld }
}

// ── JSON-LD ──
const isUrl = (v) => typeof v === 'string' && /^https:\/\/muslims\.cc(\/|$)/.test(v)
const has = (o, k) => o[k] != null && o[k] !== '' && !(Array.isArray(o[k]) && !o[k].length)
const REQUIRED = {
  WebPage: ['name', 'url', 'inLanguage'],
  WebSite: ['name', 'url'],
  Organization: ['name', 'url', 'logo'],
  WebApplication: ['name', 'url', 'applicationCategory'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position', 'name', 'item'],
  Chapter: ['name', 'position'],
  Book: ['name'],
  Quotation: ['text', 'citation'],
  DefinedTerm: ['name'],
  DefinedTermSet: ['name'],
  Person: ['name'],
  Place: ['name'],
  GeoCoordinates: ['latitude', 'longitude'],
  LearningResource: ['name'],
  PostalAddress: ['addressCountry'],
  Offer: ['price', 'priceCurrency'],
}
const FORBIDDEN = ['aggregateRating', 'review', 'reviewRating']

/** Bir JSON-LD mətni → xəta siyahısı. */
export function checkJsonLd(text) {
  const errs = []
  let data
  try { data = JSON.parse(text) } catch (e) { return [`JSON-LD sintaksis xətası: ${e.message}`] }
  if (data['@context'] !== 'https://schema.org') errs.push('JSON-LD: @context https://schema.org deyil')
  const walk = (o, where) => {
    if (Array.isArray(o)) { o.forEach((x, i) => walk(x, `${where}[${i}]`)); return }
    if (!o || typeof o !== 'object') return
    for (const k of FORBIDDEN) if (k in o) errs.push(`JSON-LD ${where}: ${k} qadağandır (saxta reytinq/rəy)`)
    const t = o['@type']
    // isPartOf: { @type: WebSite, @id, name, url } — qısa istinad da name/url daşıyır
    if (t && REQUIRED[t]) {
      for (const k of REQUIRED[t]) if (!has(o, k)) errs.push(`JSON-LD ${where} (${t}): "${k}" yoxdur`)
    }
    if (t === 'BreadcrumbList') {
      const items = o.itemListElement || []
      if (items.length < 2) errs.push(`JSON-LD ${where}: BreadcrumbList-də ən azı 2 ListItem olmalıdır`)
      items.forEach((it, i) => {
        if (it.position !== i + 1) errs.push(`JSON-LD ${where}: ListItem position ${it.position} ≠ ${i + 1}`)
        if (it.item != null && !isUrl(it.item)) errs.push(`JSON-LD ${where}: ListItem item mütləq URL deyil: ${it.item}`)
      })
    }
    if (t === 'GeoCoordinates' && (typeof o.latitude !== 'number' || typeof o.longitude !== 'number')) errs.push(`JSON-LD ${where}: koordinat rəqəm deyil`)
    if (o.url != null && typeof o.url === 'string' && !isUrl(o.url)) errs.push(`JSON-LD ${where}: url mütləq https://muslims.cc deyil: ${o.url}`)
    for (const [k, v] of Object.entries(o)) if (k !== '@type' && typeof v === 'object') walk(v, `${where}.${k}`)
  }
  walk(data, '$')
  return errs
}

// ── Gözlənilən dəyərlər (routes.js) ──
export function expected(key, lang, param = null) {
  const p = param ?? undefined
  const page = PAGES.find(x => x.key === key)
  const noindex = Boolean(page?.noindex)
  return {
    noindex,
    canonical: SITE + pathFor(key, canonicalLang(key, lang, param), p),
    hreflang: noindex ? [] : [...seoLangsFor(key, param), 'x-default'],
    hrefOf: (l) => SITE + pathFor(key, l === 'x-default' ? DEFAULT_LANG : l, p),
  }
}

/** Bir səhifə → xəta siyahısı (hreflang hədəflərinin qarşılıqlılığı ayrıca — checkReciprocity). */
export function checkPage(html, key, lang, param = null) {
  const errs = []
  const h = parseHead(html)
  const e = expected(key, lang, param)
  if (!h.title.trim()) errs.push('title boşdur')
  // Öz head-ini yazan qabıq (/u — src/seo/profileSeo.js): canonical/hreflang/sxem YOXDUR, robots qərarını səhifə verir
  if (param == null && DETAILS[key]?.selfSeo) {
    if (h.canon.length || h.alts.length || h.jsonld.length) errs.push('selfSeo qabığında canonical/hreflang/sxem olmamalıdır')
    return errs
  }
  if (!h.desc.trim()) errs.push('description boşdur')
  if (h.canon.length !== 1) errs.push(`canonical sayı ${h.canon.length}`)
  else if (h.canon[0] !== e.canonical) errs.push(`canonical ${h.canon[0]} ≠ ${e.canonical}`)
  if (e.noindex) {
    if (!/noindex/.test(h.robots)) errs.push('noindex səhifədə robots noindex yoxdur')
    if (h.alts.length) errs.push(`noindex səhifədə ${h.alts.length} hreflang var`)
    if (h.jsonld.length) errs.push('noindex səhifədə JSON-LD var')
    return errs
  }
  if (!/(^|,\s*)index/.test(h.robots) || /noindex/.test(h.robots)) errs.push(`robots "${h.robots}" — indekslənməlidir`)
  const got = h.alts.map(a => a.lang).sort()
  const want = [...e.hreflang].sort()
  if (got.join() !== want.join()) errs.push(`hreflang dəsti fərqlidir: ${got.length} vs gözlənilən ${want.length}`)
  const dup = got.filter((l, i) => got.indexOf(l) !== i)
  if (dup.length) errs.push(`təkrar hreflang: ${dup.join(',')}`)
  for (const a of h.alts) if (a.href !== e.hrefOf(a.lang)) errs.push(`hreflang ${a.lang} → ${a.href} ≠ ${e.hrefOf(a.lang)}`)
  // Özünə istinad: kanonik səhifə öz dilini hreflang-da göstərməlidir
  const selfCanon = h.canon[0] === SITE + pathFor(key, lang, param ?? undefined)
  if (selfCanon && !h.alts.some(a => a.lang === lang && a.href === h.canon[0])) errs.push(`hreflang-da özünə istinad (${lang}) yoxdur`)
  if (!h.jsonld.length) errs.push('JSON-LD yoxdur')
  for (const j of h.jsonld) errs.push(...checkJsonLd(j))
  return errs
}

/** href → dist faylı */
export function fileFor(dist, href) {
  const p = href.replace(SITE, '') || '/'
  return p === '/' ? path.join(dist, 'index.html') : path.join(dist, p.replace(/^\//, ''), 'index.html')
}

/** Nümunə: [key, lang, param] — hər açar × nümunə dillər; hər detal növündən ilk 2 + son. */
export function sample({ langs = ['az', 'en', 'ru', 'ar', 'tr', 'id', 'fr', 'ur', 'zh'] } = {}) {
  const out = []
  for (const p of PAGES) for (const l of langsFor(p.key)) if (langs.includes(l)) out.push([p.key, l, null])
  for (const key of Object.keys(DETAILS)) {
    if (DETAILS[key].noindex) continue
    const ps = detailParams(key)
    const pick = [...new Set([ps[0], ps[1], ps[ps.length - 1]])].filter(v => v != null)
    for (const param of pick) {
      for (const l of (DETAILS[key].coreOnly ? LANGS : langsFor(key))) if (langs.includes(l)) out.push([key, l, param])
    }
  }
  return out
}

export function run(dist) {
  const cache = new Map()
  const read = (f) => { if (!cache.has(f)) cache.set(f, fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null); return cache.get(f) }
  const errors = []
  const list = sample()
  for (const [key, lang, param] of list) {
    const url = SITE + pathFor(key, lang, param ?? undefined)
    const html = read(fileFor(dist, url))
    if (html == null) { errors.push(`${url}: dist faylı yoxdur`); continue }
    for (const e of checkPage(html, key, lang, param)) errors.push(`${url}: ${e}`)
    // Qarşılıqlılıq: hər hreflang hədəfi mövcuddur və eyni dəsti göstərir
    const mine = parseHead(html).alts.map(a => `${a.lang}=${a.href}`).sort().join('|')
    for (const a of parseHead(html).alts) {
      const t = read(fileFor(dist, a.href))
      if (t == null) { errors.push(`${url}: hreflang ${a.lang} hədəfi dist-də yoxdur (${a.href})`); continue }
      const theirs = parseHead(t).alts.map(x => `${x.lang}=${x.href}`).sort().join('|')
      if (theirs !== mine) errors.push(`${url}: hreflang qarşılıqlı deyil — ${a.href} başqa dəst göstərir`)
    }
  }
  // 404 qabığı: noindex, canonical/hreflang/sxem yoxdur
  const nf = read(path.join(dist, '404.html'))
  if (nf == null) errors.push('404.html yoxdur')
  else {
    const h = parseHead(nf)
    if (!/noindex/.test(h.robots) || h.canon.length || h.alts.length || h.jsonld.length) errors.push('404.html: noindex olmalı, canonical/hreflang/sxem olmamalıdır')
  }
  // llms.txt / llms-full.txt / IndexNow açarı
  for (const f of ['llms.txt', 'llms-full.txt', 'seo-manifest.json']) if (!fs.existsSync(path.join(dist, f))) errors.push(`${f} yoxdur`)
  return { errors, checked: list.length, files: cache.size }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv[2] || 'dist')
  const t0 = Date.now()
  const { errors, checked, files } = run(dist)
  const uniq = [...new Set(errors)]
  for (const e of uniq.slice(0, 200)) console.error('✗ ' + e)
  if (uniq.length > 200) console.error(`… və daha ${uniq.length - 200} xəta`)
  console.log(`SEO dist yoxlaması: ${checked} səhifə, ${files} fayl oxundu, ${uniq.length} xəta, ${((Date.now() - t0) / 1000).toFixed(1)} san.`)
  process.exit(uniq.length ? 1 : 0)
}
