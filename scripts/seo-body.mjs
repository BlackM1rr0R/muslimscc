// ═══════════════════════════════════════════════════════
// Statik <body> məzmunu — scripts/prerender.mjs üçün
//
// NƏ: detal səhifələrinin (/quran/<n>-<slug>, /names/<n>-<slug>,
// /sahaba/<slug>, /scholars/<slug>) və siyahı səhifələrinin (/quran, /names,
// /sahaba, /scholars)
// prerender HTML-ində <div id="root"> içinə HƏQİQİ mətn: h1, giriş, əsas
// məzmun, iz (breadcrumb) və əlaqəli linklər.
//
// NİYƏ: əvvəl <body> boş idi — JS icra etməyən robot (Bing, Yandex, Google-un
// ilk dalğası) heç bir məzmun görmürdü. React yüklənəndə createRoot bu bloku
// tətbiqin öz görünüşü ilə əvəz edir (bax: globals.css → .seo-static).
//
// Məlumat: Quran — seo-data/quran/*.json (scripts/fetch-quran-seo.mjs bir dəfə
// çəkib), ad və səhabə — src/data. Mətnə heç nə əlavə edilmir, heç nə
// dəyişdirilmir; Bəsmələ qaydası QuranPage.jsx ilə eynidir (utils/quranText.js).
// Interfeys yazıları src/seo/detail.js → BODY_UI (check-lang yoxlayır).
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { LANGS, pathFor, detailParams } from '../src/seo/routes.js'
import { shortName, descFor } from '../src/seo/meta.js'
import { brandName } from '../src/config/brand.js'
import {
  BODY_UI, SECTION_LABEL, detailMeta, crumbsFor, surahInfo, nameInfo, sahabaInfo, sentencesOf,
} from '../src/seo/detail.js'
import { SAHABA, slugOf } from '../src/data/sahaba.js'
import { SCHOLARS, ERAS, ERA_LABEL, ERA_SPAN, dateText, lifeSpan } from '../src/data/scholars.js'
import { localizeSource } from '../src/utils/sourceNames.js'
import { BASMALA_DISPLAY, displayAyah, hasSeparateBasmala } from '../src/utils/quranText.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const QURAN_DIR = path.join(ROOT, 'seo-data', 'quran')

// Hər dilin tərcümə nəşri — QuranPage.jsx → EDITION_MAP ilə eyni
// (ərəbcədə ar.muyassar təfsiridir)
const EDITION = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', ar: 'ar.muyassar', tr: 'tr.diyanet' }

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

// ── Quran məlumatı (tənbəl, bir dəfə oxunur) ──
const cache = new Map()
function edition(id) {
  if (!cache.has(id)) {
    const file = path.join(QURAN_DIR, `${id}.json`)
    if (!fs.existsSync(file)) throw new Error(`${file} yoxdur — node scripts/fetch-quran-seo.mjs işlət`)
    cache.set(id, JSON.parse(fs.readFileSync(file, 'utf8')))
  }
  return cache.get(id)
}
/** Statik bloku yazmaq mümkündürmü (seo-data mövcuddur)? */
export const hasQuranData = () => fs.existsSync(path.join(QURAN_DIR, 'quran-uthmani.json'))

const ui = (lang) => BODY_UI[lang] || BODY_UI.az

// ── Ortaq hissələr ──
function shell(lang, inner) {
  return `<div class="seo-static" data-seo-static="">` +
    `<div class="seo-static__top"><a class="seo-static__brand" href="${pathFor('home', lang)}">${esc(brandName(lang))}</a></div>` +
    `<main class="seo-static__main">${inner}</main></div>`
}

function crumbs(lang, items) {
  const li = items.map((c, i) => i === items.length - 1
    ? `<li aria-current="page">${esc(c.name)}</li>`
    : `<li><a href="${esc(c.href)}">${esc(c.name)}</a></li>`).join('')
  return `<nav class="seo-static__crumbs" aria-label="${esc(ui(lang).crumbs)}"><ol>${li}</ol></nav>`
}

/** Detalın izi: Ana səhifə → bölmə → detal (src/seo/detail.js → crumbsFor). */
function detailCrumbs(key, lang, param) {
  return crumbs(lang, crumbsFor(key, lang, param).map(c => ({ name: c.name, href: c.url.replace(/^https?:\/\/[^/]+/, '') || '/' })))
}

const facts = (rows) => `<dl class="seo-static__facts">${rows.filter(r => r[1] !== '' && r[1] != null)
  .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`

function pager(prev, next) {
  return `<nav class="seo-static__pager">` +
    (prev ? `<a rel="prev" href="${esc(prev.href)}">← ${esc(prev.label)}: ${esc(prev.name)}</a>` : '<span></span>') +
    (next ? `<a rel="next" href="${esc(next.href)}">${esc(next.label)}: ${esc(next.name)} →</a>` : '<span></span>') +
    `</nav>`
}

// ═══ Surə ═══

function surahBody(lang, n) {
  const L = ui(lang)
  const m = detailMeta('quran', lang, n)
  const s = surahInfo(n, lang)
  const ar = edition('quran-uthmani').ayahs[n - 1]
  const tr = edition(EDITION[lang]).ayahs[n - 1]
  const trName = lang === 'en' ? edition(EDITION[lang]).edition.englishName : edition(EDITION[lang]).edition.name

  const ayahs = ar.map((text, i) =>
    `<li id="ayah-${i + 1}"><p class="seo-static__ayah ui-arabic" lang="ar" dir="rtl">` +
    `<span class="seo-static__n" dir="ltr">${n}:${i + 1}</span> ${esc(displayAyah(text, n, i))}</p>` +
    (tr[i] ? `<p class="seo-static__tr">${esc(tr[i])}</p>` : '') + `</li>`).join('')

  const near = (k, label) => {
    const x = surahInfo(k, lang)
    return x && { href: pathFor('quran', lang, k), label, name: lang === 'ar' ? x.arName : x.name }
  }

  return shell(lang,
    detailCrumbs('quran', lang, n) +
    `<header>` +
    (lang === 'ar' ? '' : `<p class="seo-static__ar ui-arabic" lang="ar" dir="rtl">${esc(s.arFull)}</p>`) +
    `<h1>${esc(m.h1)}</h1>` +
    `<p class="seo-static__lead">${esc(m.intro)}</p>` +
    facts([[L.number, n], [L.ayahs, s.ayahs], [L.place, s.medinan ? L.medina : L.mecca], [L.meaning, s.meaning]]) +
    `</header>` +
    (hasSeparateBasmala(n)
      ? `<p class="seo-static__basmala ui-arabic" lang="ar" dir="rtl">${BASMALA_DISPLAY}</p>` +
        (L.basmalah ? `<p class="seo-static__basmala-tr">${esc(L.basmalah)}</p>` : '')
      : '') +
    // PERFORMANS: uzun surədə (Bəqərə — 286 ayə) ekrandan kənar ayələrin
    // üslub/düzülüş hesabı brauzer görənədək təxirə salınır (content-visibility).
    // Mətn HTML-də tam qalır — robotlar, axtarış (Ctrl+F) və ekran oxuyucusu
    // onu görür. Qayda statik blokla birgə silinir (React onu əvəz edəndə);
    // .seo-static üslubu globals.css-dədir, bu yalnız surə siyahısına aiddir.
    `<style>.seo-static__list>li{content-visibility:auto;contain-intrinsic-block-size:auto 300px}</style>` +
    `<ol class="seo-static__list">${ayahs}</ol>` +
    // Ərəbcədə nəşrin adı onsuz da "التفسير الميسر" yazısıdır — təkrar edilmir
    `<p class="seo-static__src">${esc(L.textSource)} ${lang === 'ar' ? '' : `${esc(L.translation)}: ${esc(trName)}. `}` +
    `<a href="${pathFor('licenses', lang)}">${esc(L.licenses)}</a></p>` +
    pager(n > 1 && near(n - 1, L.prevSurah), n < 114 && near(n + 1, L.nextSurah)) +
    `<p><a href="${pathFor('quran', lang)}">${esc(L.allSurahs)}</a></p>`,
  )
}

function quranListBody(lang) {
  const L = ui(lang)
  const items = detailParams('quran').map(n => {
    const s = surahInfo(n, lang)
    const m = detailMeta('quran', lang, n)
    return `<li><a href="${pathFor('quran', lang, n)}">${n}. ${esc(m.h1)}</a>` +
      (lang === 'ar' ? '' : ` <span class="ui-arabic" lang="ar" dir="rtl">${esc(s.arFull)}</span>`) +
      (s.meaning ? ` — ${esc(s.meaning)}` : '') + `</li>`
  }).join('')
  return listShell('quran', lang, L.surahList, items)
}

// ═══ 99 ad ═══

function nameBody(lang, n) {
  const L = ui(lang)
  const m = detailMeta('names', lang, n)
  const x = nameInfo(n, lang)
  const near = (k, label) => {
    const y = nameInfo(((k - 1 + 99) % 99) + 1, lang)
    return { href: pathFor('names', lang, y.n), label, name: lang === 'ar' ? y.ar : y.translit }
  }
  return shell(lang,
    detailCrumbs('names', lang, n) +
    `<header>` +
    `<p class="seo-static__ar ui-arabic" lang="ar" dir="rtl">${esc(x.ar)}</p>` +
    `<h1>${esc(m.h1)}</h1>` +
    `<p class="seo-static__lead">${esc(m.intro)}</p>` +
    facts([[L.number, `${n} / 99`], [L.translit, x.translit], [L.meaning, x.meaning]]) +
    `</header>` +
    pager(near(n - 1, L.prevName), near(n + 1, L.nextName)) +
    `<p><a href="${pathFor('names', lang)}">${esc(L.allNames)}</a></p>`,
  )
}

function namesListBody(lang) {
  const L = ui(lang)
  const items = detailParams('names').map(n => {
    const x = nameInfo(n, lang)
    return `<li><a href="${pathFor('names', lang, n)}">${n}. ${esc(lang === 'ar' ? x.ar : x.translit)}</a>` +
      (lang === 'ar' ? '' : ` <span class="ui-arabic" lang="ar" dir="rtl">${esc(x.ar)}</span>`) +
      (x.meaning ? ` — ${esc(x.meaning)}` : '') + `</li>`
  }).join('')
  return listShell('names', lang, L.nameList, items)
}

// ═══ Səhabə ═══

const pick = (obj, lang) => (obj && (obj[lang] || obj.en)) || ''
// Kateqoriyalar — SahabePage.jsx → FILTERS ilə eyni (yalnız məlumatdan)
const isCaliph = (s) => s.id <= 4
const isWoman = (s) => /\bbint\b/i.test(s.name.en)
const isNarrator = (s) => s.facts.some(f => /Narrated (over )?([\d,]+) hadiths/i.test(f.en || ''))
const CATEGORIES = [isCaliph, isWoman, isNarrator]
const sourceText = (h, lang) => (typeof h.source === 'object' ? pick(h.source, lang) : localizeSource(h.source, lang))

/** Eyni kateqoriyadan digər səhabələr (yoxdursa — qonşular). */
function relatedOf(s) {
  const cat = CATEGORIES.find(c => c(s))
  const same = cat ? SAHABA.filter(x => x !== s && cat(x)) : []
  if (same.length) return same.slice(0, 6)
  const i = SAHABA.indexOf(s)
  return SAHABA.filter((x, j) => x !== s && Math.abs(j - i) <= 3).slice(0, 6)
}

function sahabaBody(lang, slug) {
  const L = ui(lang)
  const s = sahabaInfo(slug)
  const name = pick(s.name, lang)
  const sentences = sentencesOf(pick(s.bio, lang))
  const paras = []
  for (let i = 0; i < sentences.length; i += 2) paras.push(sentences.slice(i, i + 2).join(' '))
  const idx = SAHABA.indexOf(s)
  const near = (x, label) => x && { href: pathFor('sahaba', lang, slugOf(x)), label, name: pick(x.name, lang) }

  const hadiths = s.hadiths.map(h =>
    `<blockquote class="seo-static__quote"><p class="ui-arabic" lang="ar" dir="rtl">${esc(h.ar)}</p>` +
    (lang === 'ar' ? '' : `<p>${esc(pick(h, lang))}</p>`) +
    `<cite>— ${esc(sourceText(h, lang))}</cite></blockquote>`).join('')

  const related = relatedOf(s).map(x =>
    `<li><a href="${pathFor('sahaba', lang, slugOf(x))}">${esc(pick(x.name, lang))}</a> — ${esc(pick(x.title, lang))}</li>`).join('')

  return shell(lang,
    detailCrumbs('sahaba', lang, slug) +
    `<header>` +
    `<p class="seo-static__eyebrow">${esc(pick(s.title, lang))}</p>` +
    `<h1>${esc(name)}</h1>` +
    (lang === 'ar' ? '' : `<p class="seo-static__ar ui-arabic" lang="ar" dir="rtl">${esc(s.name.ar)}</p>`) +
    `</header>` +
    `<h2>${esc(L.bio)}</h2>${paras.map(p => `<p>${esc(p)}</p>`).join('')}` +
    `<h2>${esc(L.facts)}</h2><ol>${s.facts.map(f => `<li>${esc(pick(f, lang))}</li>`).join('')}</ol>` +
    `<h2>${esc(L.hadiths)}</h2>${hadiths}` +
    `<h2>${esc(L.related)}</h2><ul>${related}</ul>` +
    pager(near(SAHABA[idx - 1], L.prevSahaba), near(SAHABA[idx + 1], L.nextSahaba)) +
    `<p><a href="${pathFor('sahaba', lang)}">${esc(L.allSahaba)}</a></p>`,
  )
}

function sahabaListBody(lang) {
  const L = ui(lang)
  const items = SAHABA.map(s =>
    `<li><a href="${pathFor('sahaba', lang, slugOf(s))}">${esc(pick(s.name, lang))}</a>` +
    (lang === 'ar' ? '' : ` <span class="ui-arabic" lang="ar" dir="rtl">${esc(s.name.ar)}</span>`) +
    ` — ${esc(pick(s.title, lang))}</li>`).join('')
  return listShell('sahaba', lang, L.sahabaList, items)
}

// ═══ Sələf alimi ═══
// Profilin bütün mətni (həyatı, töhfəsi, müəllim/tələbə, əsərlər, sitatlar,
// qeyd, mənbə linkləri) — ScholarsPage.jsx-in göstərdiyi ilə eyni məlumat.

const names = (list, lang) => (list || []).map(x => pick(x, lang)).filter(Boolean)

function scholarBody(lang, slug) {
  const L = ui(lang)
  const x = SCHOLARS.find(s => s.slug === slug)
  const name = pick(x.name, lang)
  const idx = SCHOLARS.indexOf(x)
  const near = (y, label) => y && { href: pathFor('scholars', lang, y.slug), label, name: pick(y.name, lang) }
  const sameEra = SCHOLARS.filter(y => y !== x && y.era === x.era)
  const list = (title, items) => (items.length ? `<h2>${esc(title)}</h2><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : '')

  const praise = (x.praise || []).map(q =>
    `<blockquote class="seo-static__quote"><p class="ui-arabic" lang="ar" dir="rtl">${esc(q.ar)}</p>` +
    (lang === 'ar' ? '' : `<p>${esc(pick(q, lang))}</p>`) +
    `<cite>— ${esc(pick(q.by, lang))}, ${esc(pick(q.ref, lang))}</cite></blockquote>`).join('')

  return shell(lang,
    detailCrumbs('scholars', lang, slug) +
    `<header>` +
    `<p class="seo-static__eyebrow">${esc(pick(ERA_LABEL[x.era], lang))} · ${esc(pick(x.title, lang))}</p>` +
    `<h1>${esc(name)}</h1>` +
    (lang === 'ar' ? '' : `<p class="seo-static__ar ui-arabic" lang="ar" dir="rtl">${esc(x.name.ar)}</p>`) +
    `<p class="seo-static__lead">${esc(pick(x.summary, lang))}</p>` +
    facts([
      [L.fullName, pick(x.fullName, lang)],
      [L.born, dateText(x.born, lang)],
      [L.died, dateText(x.died, lang)],
      [L.birthplace, x.birthplace ? pick(x.birthplace, lang) : ''],
      [L.city, pick(x.city, lang)],
      [L.era, `${pick(ERA_LABEL[x.era], lang)} (${pick(ERA_SPAN[x.era], lang)})`],
    ]) +
    `</header>` +
    `<h2>${esc(L.life)}</h2>${(x.bio[lang] || x.bio.en).map(t => `<p>${esc(t)}</p>`).join('')}` +
    `<h2>${esc(L.contribution)}</h2><p>${esc(pick(x.contribution, lang))}</p>` +
    list(L.teachers, names(x.teachers, lang)) +
    list(L.students, names(x.students, lang)) +
    list(L.works, names(x.works, lang)) +
    (praise ? `<h2>${esc(L.praise)}</h2>${praise}` : '') +
    (x.note ? `<h2>${esc(L.note)}</h2><p>${esc(pick(x.note, lang))}</p>` : '') +
    `<h2>${esc(L.sources)}</h2><ul>${x.sources.map(r => `<li><a href="${esc(r.url)}" rel="noopener nofollow">${esc(r.label)}</a></li>`).join('')}</ul>` +
    (sameEra.length ? `<h2>${esc(L.sameEra)}</h2><ul>${sameEra.map(y =>
      `<li><a href="${pathFor('scholars', lang, y.slug)}">${esc(pick(y.name, lang))}</a> — ${esc(lifeSpan(y, lang))}</li>`).join('')}</ul>` : '') +
    pager(near(SCHOLARS[idx - 1], L.prevScholar), near(SCHOLARS[idx + 1], L.nextScholar)) +
    `<p><a href="${pathFor('scholars', lang)}">${esc(L.allScholars)}</a></p>`,
  )
}

/** Siyahı: dövr üzrə qruplar (h2 + hər alimə link). */
function scholarsListBody(lang) {
  const L = ui(lang)
  const groups = ERAS.map(era => {
    const items = SCHOLARS.filter(x => x.era === era).map(x =>
      `<li><a href="${pathFor('scholars', lang, x.slug)}">${esc(pick(x.name, lang))}</a>` +
      (lang === 'ar' ? '' : ` <span class="ui-arabic" lang="ar" dir="rtl">${esc(x.name.ar)}</span>`) +
      ` — ${esc(lifeSpan(x, lang))}</li>`).join('')
    return items ? `<h3>${esc(pick(ERA_LABEL[era], lang))} (${esc(pick(ERA_SPAN[era], lang))})</h3><ul>${items}</ul>` : ''
  }).join('')
  return shell(lang,
    crumbs(lang, [
      { name: brandName(lang), href: pathFor('home', lang) },
      { name: SECTION_LABEL.scholars[lang] || SECTION_LABEL.scholars.az },
    ]) +
    `<header><h1>${esc(shortName('scholars', lang))}</h1><p class="seo-static__lead">${esc(descFor('scholars', lang))}</p></header>` +
    `<h2>${esc(L.scholarList)}</h2>${groups}`,
  )
}

// ── Siyahı səhifəsi: h1 + təsvir + bütün detallara linklər (krawl yolu) ──
function listShell(key, lang, heading, items) {
  return shell(lang,
    crumbs(lang, [
      { name: brandName(lang), href: pathFor('home', lang) },
      { name: SECTION_LABEL[key][lang] || SECTION_LABEL[key].az },
    ]) +
    `<header><h1>${esc(shortName(key, lang))}</h1><p class="seo-static__lead">${esc(descFor(key, lang))}</p></header>` +
    `<h2>${esc(heading)}</h2><ol class="seo-static__list">${items}</ol>`,
  )
}

/**
 * Səhifənin statik bloku (HTML) və ya '' (statik blok yazılmayan səhifə).
 * param — detal parametri (surə/ad nömrəsi, səhabə/alim slug-u) və ya null.
 */
export function staticBodyFor(key, lang, param = null) {
  if (!LANGS.includes(lang)) return ''
  if (key === 'quran') return param ? surahBody(lang, param) : quranListBody(lang)
  if (key === 'names') return param ? nameBody(lang, param) : namesListBody(lang)
  if (key === 'sahaba') return param ? sahabaBody(lang, param) : sahabaListBody(lang)
  if (key === 'scholars') return param ? scholarBody(lang, param) : scholarsListBody(lang)
  return ''
}

/**
 * <head> üçün məlumat preload-ları (scripts/prerender.mjs → PERF:PRELOAD).
 *
 * PERFORMANS (LCP): Quran səhifəsi (QuranPage.jsx → useQuranList / useSurah)
 * alquran.cloud sorğularını JS yüklənəndən SONRA göndərirdi; preload onları
 * HTML oxunan kimi başladır — oxuyucu surəni daha tez göstərir. URL-lər
 * fetch-dəkilərlə hərfbəhərf eyni olmalıdır (nəşrlər: QuranPage.jsx →
 * EDITION_MAP; ərəbcədə ikinci nəşr ar.muyassar — EDITION.ar ilə eyni).
 * crossorigin="anonymous" — fetch()-in cors / same-origin rejimi ilə uyğun.
 * <head>-də olmalıdır: <body>-dəki statik blokda olanda React bloku silir
 * və preload istifadə olunmurdu (sorğu iki dəfə gedirdi — yoxlanılıb).
 */
export function staticPreloadFor(key, lang, param = null) {
  if (key !== 'quran' || !LANGS.includes(lang)) return ''
  const api = 'https://api.alquran.cloud/v1'
  const links = [`<link rel="preconnect" href="https://api.alquran.cloud" crossorigin />`]
  if (param) links.push(`<link rel="preload" as="fetch" crossorigin="anonymous" href="${api}/surah/${param}/editions/ar.alafasy,${EDITION[lang]}" />`)
  links.push(`<link rel="preload" as="fetch" crossorigin="anonymous" href="${api}/surah" />`)
  return links.map(l => '\n    ' + l).join('')
}
