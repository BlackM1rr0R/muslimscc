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

import { LANGS, EXTRA_LANGS, EXTRA_CODES, EXTRA_PAGES, dirOf, pathFor, detailParams } from '../src/seo/routes.js'
import { localDigits } from '../src/seo/intl.js'
import { shortName, descFor } from '../src/seo/meta.js'
import { FULL_T, narratorLine, hasFull } from '../src/utils/hadithFull.js'
import {
  BODY_UI, SECTION_LABEL, detailMeta, crumbsFor, surahInfo, nameInfo, sahabaInfo, sentencesOf,
  termInfo, GLOSSARY_CAT_LABEL, hadithInfo, hadithGradeText, HADITH_T, hisnInfo, HISN_AR, HISN_BOOK } from '../src/seo/detailData.js'
import { GLOSSARY, GLOSSARY_CATS, GLOSSARY_BY_ID } from '../src/data/glossary.js'
import { setGlossarySource } from '../src/seo/glossarySource.js'
import { LESSON_SLUGS } from '../src/seo/detailSlugs.js'
import { SAHABA, slugOf } from '../src/data/sahaba.js'
import { SCHOLARS, ERAS, ERA_LABEL, ERA_SPAN, dateText, lifeSpan } from '../src/data/scholars.js'
import { LESSONS, LESSON_CATS, CAT_BY_KEY } from '../src/data/lessons/index.js'
import { localizeSource } from '../src/utils/sourceNames.js'
import { BASMALA_DISPLAY, displayAyah, hasSeparateBasmala, stripTranslationNotes } from '../src/utils/quranText.js'
import { PRAYER_CITIES } from '../src/data/prayerCities.js'
import { prayerCity, cityName, citySlug, monthTable, isAzCity, WORLD_PAGE_CITIES, PRAYER_KEYS, PRAYER_LABELS, PRAYER_CITY_T } from '../src/seo/prayerCity.js'
import { G_MONTHS } from '../src/utils/hijri.js'
import { BABY_NAMES, nameIn } from '../src/data/babyNames.js'
import { HADITH_IDS } from '../src/seo/hadithIds.js'
import { HISN_DUA_IDS } from '../src/seo/hisnIds.js'
import { QIBLA_GUIDE, QIBLA_GUIDE_TXT, QIBLA_SOURCES } from '../src/data/guides/QiblaPage.js'
import { MOSQUE_GUIDE, MOSQUE_GUIDE_TXT, MOSQUE_SOURCES } from '../src/data/guides/MosqueFinderPage.js'
import { CAL_MONTHS_GUIDE, CAL_SOURCES } from '../src/data/guides/CalendarPage.js'
import { CHARITY_GUIDE } from '../src/data/pageGuides/CharityPage.js'
import { DONATE_GUIDE } from '../src/data/pageGuides/DonatePage.js'
import { DUA_GUIDE } from '../src/data/pageGuides/DuaJournalPage.js'
import { HERO_T } from '../src/components/home/heroText.js'
import { PRAYER_NAMES as HOME_PRAYER_NAMES } from '../src/data/prayerTrackerText.js'
import { BRAND, DEFAULT_PRAYER_LOCATION, brandName, tr as brandTr } from '../src/config/brand.js'
import { SEERAH_EVENTS, SEERAH_PLACES, periodOf } from '../src/data/seerah.js'
import { SEERAH_T, yearText } from '../src/components/seerah/seerahText.js'
import { REV_SURAHS, REVELATION_SEQ, placeCounts } from '../src/components/quran/revelation/revelationOrder.js'
import { REV_T } from '../src/components/quran/revelation/revelationText.js'
import { QH_SCENES, QH_CITIES, parseQhSource, bukhariLinks } from '../src/data/quranCompilation.js'
import { QH_T } from '../src/components/quranhistory/quranHistoryText.js'
import { QURAN_PROPHETS } from '../src/data/quranProphets.js'
import { QP_T } from '../src/components/quranprophets/quranProphetsText.js'
import { decodeLocations } from '../src/utils/quranRoots.js'
import { getSurahLocal } from '../src/data/surahNamesAz.js'
import { ayahCountText } from '../src/utils/quranText.js'
import { RABBANA_ITEMS } from '../src/data/rabbanaSpans.gen.js'
import { RB_T, RB_WHO } from '../src/components/rabbana/rabbanaText.js'
import { refLabel as rabbanaRef } from '../src/components/rabbana/rabbanaJar.js'

// detail.js lüğəti glossarySource.js-dən oxuyur (prerender: meta + statik blok)
setGlossarySource(GLOSSARY_BY_ID)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const QURAN_DIR = path.join(ROOT, 'seo-data', 'quran')

// Hər dilin tərcümə nəşri — QuranPage.jsx → EDITION_MAP ilə eyni
// (ərəbcədə ar.muyassar təfsiridir)
// + əlavə dillər (src/seo/langs.js) — rəsmi nəşr, yalnız Quran səhifələri
const EDITION = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', ar: 'ar.muyassar', tr: 'tr.diyanet',
  // QuranEnc dilləri (qe) — seo-data/quran/qe.<açar>.json (scripts/fetch-quran-seo.mjs)
  ...Object.fromEntries(EXTRA_CODES.map(c => [c, EXTRA_LANGS[c].quran || `qe.${EXTRA_LANGS[c].qe}`])) }
/** Nəşrin ayə mətni (fars nəşrində [[…]] lüğət qeydləri ayrılır — QuranPage.jsx ilə eyni). */
const trAyah = (text, lang) => (EXTRA_LANGS[lang]?.notes ? stripTranslationNotes(text) : (text || ''))

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
  const tr = edition(EDITION[lang]).ayahs[n - 1].map(t => trAyah(t, lang))
  const extra = EXTRA_LANGS[lang]
  const trName = extra ? extra.by : lang === 'en' ? edition(EDITION[lang]).edition.englishName : edition(EDITION[lang]).edition.name
  // Tərcümə abzasının dili/istiqaməti (əlavə dildə interfeys yazıları ilə eyni dildir)
  const trAttr = extra ? ` lang="${lang}" dir="${dirOf(lang)}"` : ''
  // Bəsmələnin mənası: əlavə dildə həmin nəşrin öz tərcüməsi (Fatihə 1:1)
  const basmalahTr = extra ? extra.basmala : L.basmalah
  const num = (v) => localDigits(v, lang)

  const ayahs = ar.map((text, i) =>
    `<li id="ayah-${i + 1}"><p class="seo-static__ayah ui-arabic" lang="ar" dir="rtl">` +
    `<span class="seo-static__n" dir="ltr">${n}:${i + 1}</span> ${esc(displayAyah(text, n, i))}</p>` +
    (tr[i] ? `<p class="seo-static__tr"${trAttr}>${esc(tr[i])}</p>` : '') + `</li>`).join('')

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
    facts([[L.number, num(n)], [L.ayahs, num(s.ayahs)], [L.place, s.medinan ? L.medina : L.mecca], [L.meaning, s.meaning]]) +
    `</header>` +
    (hasSeparateBasmala(n)
      ? `<p class="seo-static__basmala ui-arabic" lang="ar" dir="rtl">${BASMALA_DISPLAY}</p>` +
        (basmalahTr ? `<p class="seo-static__basmala-tr"${trAttr}>${esc(basmalahTr)}</p>` : '')
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

const pick = (obj, lang) => (obj && (typeof obj === 'string' ? obj : (obj[lang] || obj.en))) || ''
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

// ═══ Dərs ═══
// Dərsin bütün mətni (bölmələr, ayə/hədis/sitat, mənbələr) — LessonsPage.jsx
// ilə eyni məlumat. Mətnlər Node-da birbaşa import olunur (Vite-siz).
const LESSON_BODY = Object.fromEntries(await Promise.all(LESSONS.map(async (l) =>
  [l.slug, (await import(`../src/data/lessons/${l.slug}.js`)).default])))

function lessonBlock(b, lang) {
  const p = (o) => esc(pick(o, lang))
  const ar = (t) => (t ? `<p class="ui-arabic" lang="ar" dir="rtl">${esc(t)}</p>` : '')
  const tr = (o, hasAr) => (lang === 'ar' && hasAr ? '' : `<p>${p(o)}</p>`)
  switch (b.t) {
    case 'p': return `<p>${p(b.text)}</p>`
    case 'list': { const t = b.ordered ? 'ol' : 'ul'; return `<${t}>${b.items.map(i => `<li>${p(i)}</li>`).join('')}</${t}>` }
    case 'steps': return `<ol>${b.items.map(i => `<li>${i.title ? `<strong>${p(i.title)}</strong> ` : ''}${i.text ? p(i.text) : ''}</li>`).join('')}</ol>`
    case 'ayah': return `<blockquote class="seo-static__quote">${ar(b.ar)}${tr(b.text, b.ar)}<cite>— ${esc(b.ref)}</cite></blockquote>`
    case 'hadith': return `<blockquote class="seo-static__quote">${ar(b.ar)}${tr(b.text, b.ar)}<cite>— ${p(b.src)}${b.grade ? ` · ${p(b.grade)}` : ''}</cite></blockquote>`
    case 'quote': return `<blockquote class="seo-static__quote">${ar(b.ar)}${tr(b.text, b.ar)}<cite>— ${p(b.by)}${b.ref ? `, ${p(b.ref)}` : ''}</cite></blockquote>`
    case 'dua': return `<blockquote class="seo-static__quote">${ar(b.ar)}${lang === 'ar' ? '' : `<p>${p(b.text)}</p>`}${b.src ? `<cite>— ${p(b.src)}</cite>` : ''}</blockquote>`
    case 'note': return `<p><strong>※</strong> ${p(b.text)}</p>`
    case 'table': return `<table>${b.head ? `<thead><tr>${b.head.map(h => `<th>${p(h)}</th>`).join('')}</tr></thead>` : ''}<tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${p(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    case 'qa': return b.items.map(i => `<h3>${p(i.q)}</h3><p>${p(i.a)}</p>${i.ref ? `<p><cite>${p(i.ref)}</cite></p>` : ''}`).join('')
    // Vizual bloklar (dizayn v3) — robot üçün mətn şəklində
    case 'stats': return `${b.title ? `<p><strong>${p(b.title)}</strong></p>` : ''}<ul>${b.items.map(i => `<li><strong>${esc(String(i.value))}${i.unit ? ' ' + p(i.unit) : ''}</strong> — ${p(i.label)}${i.hint ? ` (${p(i.hint)})` : ''}</li>`).join('')}</ul>${b.note ? `<p><small>${p(b.note)}</small></p>` : ''}`
    case 'chart': return `<p><strong>${p(b.title)}</strong>${b.sub ? ` — ${p(b.sub)}` : ''}</p><ul>${b.data.map(d => `<li>${p(d.label)}: ${d.display ? p(d.display) : esc(String(d.value))}${b.unit ? ' ' + p(b.unit) : ''}</li>`).join('')}</ul>${b.note ? `<p><small>${p(b.note)}</small></p>` : ''}`
    case 'timeline': return `<ol>${b.items.map(i => `<li><strong>${typeof i.when === 'object' ? p(i.when) : esc(String(i.when))}</strong> — ${p(i.title)}${i.text ? `: ${p(i.text)}` : ''}</li>`).join('')}</ol>`
    case 'links': return `<ul>${b.items.map(i => `<li><a href="${esc(i.href || pathFor(i.page, lang, i.param) + (i.hash ? '#' + i.hash : ''))}">${p(i.title)}</a>${i.text ? ` — ${p(i.text)}` : ''}</li>`).join('')}</ul>`
    default: return ''
  }
}

function lessonBody(lang, slug) {
  const L = ui(lang)
  const m = LESSONS.find(l => l.slug === slug)
  const body = LESSON_BODY[slug]
  const idx = LESSONS.indexOf(m)
  const near = (y, label) => y && { href: pathFor('learn', lang, y.slug), label, name: pick(y.title, lang) }
  const same = LESSONS.filter(y => y !== m && y.cat === m.cat)
  return shell(lang,
    detailCrumbs('learn', lang, slug) +
    `<header>` +
    `<p class="seo-static__eyebrow">${esc(pick(CAT_BY_KEY[m.cat]?.label, lang))}</p>` +
    `<h1>${esc(pick(m.title, lang))}</h1>` +
    (lang === 'ar' || !m.arTitle ? '' : `<p class="seo-static__ar ui-arabic" lang="ar" dir="rtl">${esc(m.arTitle)}</p>`) +
    `<p class="seo-static__lead">${esc(pick(m.summary, lang))}</p>` +
    `</header>` +
    body.sections.map(sec => `<h2>${esc(pick(sec.title, lang))}</h2>${sec.blocks.map(b => lessonBlock(b, lang)).join('')}`).join('') +
    (body.sources?.length ? `<h2>${esc(L.sources)}</h2><ul>${body.sources.map(r => `<li>${r.url ? `<a href="${esc(r.url)}" rel="noopener nofollow">${esc(r.label)}</a>` : esc(r.label)}</li>`).join('')}</ul>` : '') +
    (same.length ? `<h2>${esc(L.sameLesson)}</h2><ul>${same.map(y => `<li><a href="${pathFor('learn', lang, y.slug)}">${esc(pick(y.title, lang))}</a></li>`).join('')}</ul>` : '') +
    pager(near(LESSONS[idx - 1], L.prevLesson), near(LESSONS[idx + 1], L.nextLesson)) +
    `<p><a href="${pathFor('learn', lang)}">${esc(L.allLessons)}</a></p>`,
  )
}

/** Siyahı: kateqoriyalar üzrə qruplar (h3 + hər dərsə link). */
function lessonsListBody(lang) {
  const L = ui(lang)
  const groups = LESSON_CATS.map(c => {
    const items = LESSONS.filter(l => l.cat === c.key).map(l =>
      `<li><a href="${pathFor('learn', lang, l.slug)}">${esc(pick(l.title, lang))}</a> — ${esc(pick(l.summary, lang))}</li>`).join('')
    return items ? `<h3>${esc(pick(c.label, lang))}</h3><p>${esc(pick(c.desc, lang))}</p><ul>${items}</ul>` : ''
  }).join('')
  return shell(lang,
    crumbs(lang, [
      { name: brandName(lang), href: pathFor('home', lang) },
      { name: SECTION_LABEL.learn[lang] || SECTION_LABEL.learn.az },
    ]) +
    `<header><h1>${esc(shortName('learn', lang))}</h1><p class="seo-static__lead">${esc(descFor('learn', lang))}</p></header>` +
    `<h2>${esc(L.lessonList)}</h2>${groups}`,
  )
}

// ═══ Lüğət termini ═══
// Termin: ərəbcə yazılış, ad, tərif, bölmə; əlaqəli terminlər, dərs, eyni
// bölmədən terminlər (daxili linklər — krawl yolu) və əvvəlki/növbəti.

function termBody(lang, id) {
  const L = ui(lang)
  const m = detailMeta('glossary', lang, id)
  const x = termInfo(id, lang)
  const idx = GLOSSARY.findIndex(y => y.id === id)
  const link = (y) => `<a href="${pathFor('glossary', lang, y.id)}">${esc(termInfo(y.id, lang).name)}</a>`
  const near = (y, label) => y && { href: pathFor('glossary', lang, y.id), label, name: termInfo(y.id, lang).name }
  const rel = (x.rel || []).map(r => GLOSSARY.find(y => y.id === r)).filter(Boolean)
  const same = GLOSSARY.filter(y => y.cat === x.cat && y.id !== id && !(x.rel || []).includes(y.id))
  // Eyni bölmədən — terminin ətrafındakı 12 termin (hər səhifədə fərqli dəst)
  const start = Math.max(0, Math.min(same.length - 12, same.findIndex(y => GLOSSARY.indexOf(y) > idx) - 6))
  const sameSlice = same.slice(start, start + 12)
  const lessonOk = x.lesson && LESSON_SLUGS.includes(x.lesson)
  return shell(lang,
    detailCrumbs('glossary', lang, id) +
    `<header>` +
    `<p class="seo-static__eyebrow">${esc(pick(GLOSSARY_CAT_LABEL[x.cat], lang))}</p>` +
    (lang === 'ar' ? '' : `<p class="seo-static__ar ui-arabic" lang="ar" dir="rtl">${esc(x.ar)}</p>`) +
    `<h1>${esc(m.h1)}</h1>` +
    `<p class="seo-static__lead">${esc(x.definition)}</p>` +
    facts([[L.arabic, lang === 'ar' ? '' : x.ar], [L.translit, x.translit], [L.category, pick(GLOSSARY_CAT_LABEL[x.cat], lang)]]) +
    `</header>` +
    (rel.length ? `<h2>${esc(L.termRelated)}</h2><ul>${rel.map(y => `<li>${link(y)} — ${esc(clip(termInfo(y.id, lang).definition))}</li>`).join('')}</ul>` : '') +
    (lessonOk ? `<p><a href="${pathFor('learn', lang, x.lesson)}">${esc(L.termLesson)}</a></p>` : '') +
    (sameSlice.length ? `<h2>${esc(L.sameCat)}</h2><ul>${sameSlice.map(y => `<li>${link(y)}</li>`).join('')}</ul>` : '') +
    pager(near(GLOSSARY[idx - 1], L.prevTerm), near(GLOSSARY[idx + 1], L.nextTerm)) +
    `<p><a href="${pathFor('glossary', lang)}">${esc(L.allTerms)}</a></p>`,
  )
}

/** Tərifin ilk cümləsi (əlaqəli terminlərin siyahısında qısa izah). */
function clip(text, max = 140) {
  const t = String(text || '')
  const first = t.split(/(?<=[.!?。])\s/)[0]
  if (first.length <= max) return first
  const cut = first.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 60 ? cut.lastIndexOf(' ') : max).replace(/[\s,;:—–-]+$/, '')}…`
}

/** Lüğətin siyahısı: bölmələr üzrə bütün terminlərə link (krawl yolu). */
function glossaryListBody(lang) {
  const L = ui(lang)
  const groups = GLOSSARY_CATS.map(c => {
    const items = GLOSSARY.filter(y => y.cat === c).map(y => {
      const t = termInfo(y.id, lang)
      return `<li><a href="${pathFor('glossary', lang, y.id)}">${esc(t.name)}</a>` +
        (lang === 'ar' ? '' : ` <span class="ui-arabic" lang="ar" dir="rtl">${esc(y.ar)}</span>`) + `</li>`
    }).join('')
    return items ? `<h3>${esc(pick(GLOSSARY_CAT_LABEL[c], lang))}</h3><ul>${items}</ul>` : ''
  }).join('')
  return shell(lang,
    crumbs(lang, [
      { name: brandName(lang), href: pathFor('home', lang) },
      { name: SECTION_LABEL.glossary[lang] || SECTION_LABEL.glossary.az },
    ]) +
    `<header><h1>${esc(shortName('glossary', lang))}</h1><p class="seo-static__lead">${esc(descFor('glossary', lang))}</p></header>` +
    `<h2>${esc(L.termList)}</h2>${groups}`,
  )
}

// ── Siyahı səhifəsi: h1 + təsvir + bütün detallara linklər (krawl yolu) ──
// ═══ Namaz vaxtları: şəhər səhifəsi (/prayer/<şəhər>) və şəhərlər siyahısı (/prayer) ═══
// Statik cədvəl — build ayı (Bakı vaxtı ilə); tətbiq yüklənəndə canlı vaxtlar göstərilir.
const AZ_CITIES = PRAYER_CITIES.filter(c => c.country === 'AZ')
const BUILD_YM = (() => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: 'numeric' })
    .formatToParts(new Date()).map(x => [x.type, x.value]))
  return { y: Number(p.year), m: Number(p.month) }
})()
const cityLinks = (lang, except, list = AZ_CITIES) => list.filter(c => c !== except)
  .map(c => `<li><a href="${pathFor('prayer', lang, citySlug(c))}">${esc(cityName(c, lang))}</a></li>`).join('')

function prayerCityBody(lang, slug) {
  const c = prayerCity(slug)
  const m = detailMeta('prayer', lang, slug)
  const T = PRAYER_CITY_T[lang] || PRAYER_CITY_T.az
  const { y, m: mo } = BUILD_YM
  const months = G_MONTHS[lang] || G_MONTHS.en
  const head = `<tr><th scope="col">${esc(T.day)}</th>${PRAYER_KEYS.map(k => `<th scope="col" data-k="${k}">${esc(PRAYER_LABELS[k][lang] || PRAYER_LABELS[k].en)}</th>`).join('')}</tr>`
  const rows = monthTable(c, y, mo).map(r => `<tr><th scope="row">${r.d}</th>${PRAYER_KEYS.map(k => `<td>${r[k]}</td>`).join('')}</tr>`).join('')
  return shell(lang,
    detailCrumbs('prayer', lang, slug) +
    `<header><h1>${esc(m.h1)}</h1><p class="seo-static__lead">${esc(m.intro)}</p><p>${esc(T.live)}</p></header>` +
    `<h2>${esc(T.month)}: ${esc(months[mo - 1])} ${y}</h2>` +
    // data-city / data-ym: brauzerdə Hənəfi seçilibsə əsr sütunu yenidən hesablanır (src/seo/staticPrayerAsr.js)
    `<table class="seo-static__table" data-city="${esc(citySlug(c))}" data-ym="${y}-${mo}"><thead>${head}</thead><tbody>${rows}</tbody></table>` +
    (isAzCity(c)
      ? `<h2>${esc(T.others)}</h2><ul class="seo-static__list">${cityLinks(lang, c)}</ul>`
      : `<h2>${esc(T.world)}</h2><ul class="seo-static__list">${cityLinks(lang, c, WORLD_PAGE_CITIES)}</ul>`) +
    `<p><a href="${pathFor('prayer', lang)}">${esc(T.all)}</a></p>`,
  )
}

function prayerListBody(lang) {
  const T = PRAYER_CITY_T[lang] || PRAYER_CITY_T.az
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: SECTION_LABEL.prayer[lang] || SECTION_LABEL.prayer.az }]) +
    `<header><h1>${esc(shortName('prayer', lang))}</h1><p class="seo-static__lead">${esc(descFor('prayer', lang))}</p></header>` +
    `<h2>${esc(T.azList)}</h2><ul class="seo-static__list">${cityLinks(lang, null)}</ul>` +
    `<h2>${esc(T.world)}</h2><ul class="seo-static__list">${cityLinks(lang, null, WORLD_PAGE_CITIES)}</ul>`,
  )
}

// /muslim-baby-names (v6.6): oğlan və qız adları — ərəbcə, həmin dildə yazılış, məna, Quranda sayı
const BABY_LBL = {
  az: { m: 'Oğlan adları', f: 'Qız adları', q: n => `Quranda ${n} dəfə` },
  en: { m: 'Boys’ names', f: 'Girls’ names', q: n => `${n} times in the Quran` },
  ru: { m: 'Имена для мальчиков', f: 'Имена для девочек', q: n => `В Коране ${n} раз` },
  ar: { m: 'أسماء الأولاد', f: 'أسماء البنات', q: n => `ورد في القرآن ${n} مرة` },
  tr: { m: 'Erkek isimleri', f: 'Kız isimleri', q: n => `Kur’an’da ${n} kez` },
}
function babyNamesBody(lang) {
  const L = BABY_LBL[lang] || BABY_LBL.az
  const item = (n) => {
    const extra = [n.meaning ? (n.meaning[lang] || n.meaning.en) : '', n.quran ? L.q(n.quran.count) : ''].filter(Boolean).join(' · ')
    return `<li><b>${esc(nameIn(n, lang))}</b>${lang === 'ar' ? '' : ` <span lang="ar">${esc(n.ar)}</span>`}${extra ? ` — ${esc(extra)}` : ''}</li>`
  }
  const sec = (g) => `<h2>${esc(L[g])}</h2><ul class="seo-static__list">${BABY_NAMES.filter(n => n.gender === g).map(item).join('')}</ul>`
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName('babynames', lang) }]) +
    `<header><h1>${esc(shortName('babynames', lang))}</h1><p class="seo-static__lead">${esc(descFor('babynames', lang))}</p></header>` +
    sec('m') + sec('f'),
  )
}

// ═══ Hədis (/hadith/<id>, v6.8) — yalnız saytın yoxlanmış datası: ərəbcə mətn, tərcümə, mənbə, dərəcə ═══
// v6.9: tam mətn (isnadla ərəbcə + tam tərcümə) — public/data/hadith-full/<id>.json,
// hadith-api nəşrindən olduğu kimi (scripts/build-hadith-full.mjs)
function hadithFullBlock(lang, id) {
  if (!hasFull(id)) return ''
  let d
  try { d = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'hadith-full', `${id}.json`), 'utf8')) } catch { return '' }
  const u = FULL_T[lang] || FULL_T.en
  const order = lang === 'ru' ? ['ru', 'en'] : (lang === 'tr' || lang === 'az') ? ['tr', 'en'] : ['en']
  const he = lang === 'az' && d.he?.az ? d.he : null
  const k = lang === 'ar' || he ? null : order.find(x => d[x])
  return `<section><h2>${esc(u.title)}</h2>` +
    `<h3>${esc(u.arH)}</h3><p lang="ar" dir="rtl" class="seo-static__ar">${esc(d.ar)}</p>` +
    (he ? `<h3>${esc(u.trH)}</h3><p lang="az">${esc(he.az)}</p>` + (he.x ? `<h3>${esc(u.expl)}</h3><p lang="az">${esc(he.x)}</p>` : '') : '') +
    (k ? `<h3>${esc(u.trH)}</h3><p lang="${k}">${esc(d[k])}</p>` : '') +
    `<p><small>${esc(he ? u.heNote : u.note)}</small></p></section>`
}

function hadithBody(lang, id) {
  const h = hadithInfo(id, lang)
  if (!h) return ''
  const m = detailMeta('hadith', lang, id)
  const T = HADITH_T[lang] || HADITH_T.az
  const i = HADITH_IDS.indexOf(String(id))
  const near = (j, label) => (j >= 0 && j < HADITH_IDS.length ? { href: pathFor('hadith', lang, HADITH_IDS[j]), label, name: detailMeta('hadith', lang, HADITH_IDS[j])?.crumb || '' } : null)
  return shell(lang,
    detailCrumbs('hadith', lang, id) +
    `<header><h1>${esc(m.h1)}</h1></header>` +
    (h.arText ? `<blockquote lang="ar" dir="rtl" class="seo-static__ar">${esc(h.arText)}</blockquote>` : '') +
    (lang !== 'ar' ? `<p class="seo-static__lead">${esc(h.text)}</p>` : '') +
    facts([[T.src, h.src], [T.gradeL, hadithGradeText(h.grade, lang)],
      ...(narratorLine(id, lang) ? [[(FULL_T[lang] || FULL_T.en).narr, narratorLine(id, lang)]] : [])]) +
    hadithFullBlock(lang, id) +
    pager(near(i - 1, T.prev), near(i + 1, T.next)) +
    `<p><a href="${pathFor('hadith', lang)}">${esc(T.all)}</a></p>`,
  )
}

// ═══ Alət səhifələrinin bələdçisi (GEO, 2026-11-24) ═══
// Qiblə, zəkat, təqvim, məscid, sədəqə… səhifələrinin <body>-si boş idi — JS icra etməyən robot
// (Bing, OAI-SearchBot, PerplexityBot) yalnız h1 + description görürdü. İndi səhifənin ÖZ bələdçisi
// (src/data/guides, src/data/pageGuides — səhifədə göstərilən eyni bloklar, mənbələri ilə) statik
// yazılır: "cavab əvvəl" mətn, ayə/hədis istinadı, fətva linkləri. Heç bir yeni dini mətn yoxdur.
// Zəkat: səhifənin ayrıca bələdçisi yoxdur — "Fiqh sualları" dərsinin zəkat bölməsi (fətva nömrələri ilə).
const lessonSection = (slug, id) => LESSON_BODY[slug]?.sections?.find(x => x.id === id)
const GUIDES = {
  qibla: () => ({ title: QIBLA_GUIDE_TXT.title, lead: QIBLA_GUIDE_TXT.lead, sections: QIBLA_GUIDE, sources: QIBLA_SOURCES }),
  mosques: () => ({ title: MOSQUE_GUIDE_TXT.title, lead: MOSQUE_GUIDE_TXT.lead, sections: MOSQUE_GUIDE, sources: MOSQUE_SOURCES }),
  calendar: () => ({ sections: CAL_MONTHS_GUIDE, sources: CAL_SOURCES }),
  charity: () => ({ sections: CHARITY_GUIDE }),
  donate: () => ({ sections: DONATE_GUIDE }),
  duajournal: () => ({ sections: DUA_GUIDE }),
  zakat: () => {
    const sec = lessonSection('fiqh-faq', 'zakat')
    return sec ? { sections: [sec], lesson: 'fiqh-faq' } : null
  },
}
export const GUIDE_KEYS = Object.keys(GUIDES)

function guideBody(key, lang) {
  const g = GUIDES[key]()
  if (!g || !g.sections?.length) return ''
  const L = ui(lang)
  const lesson = g.lesson && LESSONS.find(l => l.slug === g.lesson)
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName(key, lang) }]) +
    `<header><h1>${esc(shortName(key, lang))}</h1><p class="seo-static__lead">${esc(descFor(key, lang))}</p></header>` +
    (g.title ? `<h2>${esc(pick(g.title, lang))}</h2>` : '') +
    (g.lead ? `<p>${esc(pick(g.lead, lang))}</p>` : '') +
    g.sections.map(sec => `<section>${sec.title ? `<h2>${esc(pick(sec.title, lang))}</h2>` : ''}${(sec.blocks || []).map(b => lessonBlock(b, lang)).join('')}</section>`).join('') +
    (g.sources?.length ? `<h2>${esc(L.sources)}</h2><ul>${g.sources.map(r => `<li>${r.url ? `<a href="${esc(r.url)}" rel="noopener nofollow">${esc(pick(r.label, lang))}</a>` : esc(pick(r.label, lang))}</li>`).join('')}</ul>` : '') +
    (lesson ? `<p><a href="${pathFor('learn', lang, lesson.slug)}">${esc(pick(lesson.title, lang))}</a></p>` : ''),
  )
}

// ═══ Siyər (/seerah, 2026-11-27) — hadisələrin tam siyahısı (il, yer, mətn, mənbə) ═══
// Səhifənin özündə göstərilən eyni mətn (src/data/seerah.js); Quran istinadı oxuyucuya link.
// Hər hadisənin id-si (#ev-<id>) JSON-LD ItemList-in linkləri ilə eynidir (seerahItemList).
function seerahBody(lang) {
  const t = SEERAH_T[lang] || SEERAH_T.en
  const src = (s) => {
    const m = /^Quran (\d{1,3}):(\d{1,3})/.exec(s)
    const label = esc(localizeSource(s, lang))
    return m ? `<a href="${pathFor('quran', lang, Number(m[1]))}?a=${m[2]}">${label}</a>` : label
  }
  const item = (e) => {
    const y = yearText(e, t)
    return `<li id="ev-${e.id}"><h3>${esc(pick(e.title, lang))}</h3>` +
      `<p><strong>${esc(y.hijri)} · ${esc(y.ce)}</strong> — ${esc(pick(SEERAH_PLACES[e.place].name, lang))}${e.differ ? ` (${esc(t.differ)})` : ''}</p>` +
      `<p>${esc(pick(e.text, lang))}</p>` +
      `<p><small>${esc(t.source)}: ${e.src.map(src).join(' · ')}</small></p></li>`
  }
  const mk = SEERAH_EVENTS.filter(e => periodOf(e) === 'makkah')
  const md = SEERAH_EVENTS.filter(e => periodOf(e) === 'madinah')
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName('seerah', lang) }]) +
    `<header><h1>${esc(t.title)}</h1><p class="seo-static__lead">${esc(t.lead)}</p></header>` +
    `<section><h2>${esc(t.makkahPeriod)}</h2><ol>${mk.map(item).join('')}</ol></section>` +
    `<section><h2>${esc(t.madinahPeriod)}</h2><ol start="${mk.length + 1}">${md.map(item).join('')}</ol></section>` +
    `<p>${esc(t.note)}</p>` +
    `<p><a href="${pathFor('history', lang)}">${esc(shortName('history', lang))}</a> · <a href="${pathFor('holyplaces', lang)}">${esc(shortName('holyplaces', lang))}</a></p>`,
  )
}

/** JSON-LD: hadisələrin ItemList-i (WebPage.mainEntity) — yalnız prerender (scripts/prerender.mjs). */
export function seerahItemList(lang, canonical) {
  return {
    '@type': 'ItemList',
    name: (SEERAH_T[lang] || SEERAH_T.en).title,
    numberOfItems: SEERAH_EVENTS.length,
    itemListElement: SEERAH_EVENTS.map((e, i) => ({
      '@type': 'ListItem', position: i + 1, name: pick(e.title, lang), item: `${canonical}#ev-${e.id}`,
    })),
  }
}

// ═══ Nazil olma sırası (/quran-revelation-order, 2026-11-28) — 114 surə nazil olma sırası ilə ═══
// Səhifədəki eyni məlumat (data/surahRevelation.js — Quran.com cədvəli); hər surə oxuyucuya link.
function revelationOrderBody(lang) {
  const t = REV_T[lang] || REV_T.en
  const { meccan, medinan } = placeCounts()
  const item = (n) => {
    const s = REV_SURAHS[n - 1]
    const name = lang === 'ar' ? '' : (getSurahLocal(n, lang)?.name || s.latin)
    return `<li><a href="${pathFor('quran', lang, n)}"><span lang="ar" dir="rtl">${esc(s.ar)}</span>${name ? ` — ${esc(name)}` : ''}</a>` +
      ` (${n} · ${esc(ayahCountText(s.ayahs, lang))})</li>`
  }
  const mk = REVELATION_SEQ.filter(n => !REV_SURAHS[n - 1].medinan)
  const md = REVELATION_SEQ.filter(n => REV_SURAHS[n - 1].medinan)
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName('quran', lang), href: pathFor('quran', lang) }, { name: shortName('revelationorder', lang) }]) +
    `<header><h1>${esc(t.title)}</h1><p class="seo-static__lead">${esc(t.lead)}</p></header>` +
    `<p>${esc(t.tlSummary(meccan, medinan))}</p>` +
    `<section><h2>${esc(t.makkahPeriod)} — ${esc(t.nMeccan(mk.length))}</h2><ol>${mk.map(item).join('')}</ol></section>` +
    `<section><h2>${esc(t.madinahPeriod)} — ${esc(t.nMedinan(md.length))}</h2><ol start="${mk.length + 1}">${md.map(item).join('')}</ol></section>` +
    `<p>${esc(t.note)}</p><p><small>${esc(t.source)}</small></p>` +
    `<p><a href="${pathFor('quran', lang)}">${esc(shortName('quran', lang))}</a> · <a href="${pathFor('mushaf', lang)}">${esc(shortName('mushaf', lang))}</a></p>`,
  )
}

// ═══ Quran necə toplandı (/quran-history, 2026-11-28) — 6 mərhələ, sitatlar və mənbələr ═══
// Səhifədəki eyni mətn (src/data/quranCompilation.js); #step-<id> səhifədəki lövbərlərlə eynidir.
function quranHistoryBody(lang) {
  const t = QH_T[lang] || QH_T.en
  const src = (s) => {
    const r = parseQhSource(s)
    const label = esc(localizeSource(s, lang))
    if (r?.kind === 'quran') return `<a href="${pathFor('quran', lang, r.s)}?a=${r.a}">${label}</a>`
    if (r?.kind === 'bukhari') return `<a href="${bukhariLinks(r.n).sunnah}" rel="noopener">${label}</a>`
    return label
  }
  const quote = (q) => `<blockquote><p lang="ar" dir="rtl">«${esc(q.ar)}»</p><p><small>${esc(t.bukhari)} ${esc(String(parseQhSource(q.src)?.n || ''))}</small></p></blockquote>`
  const item = (s, i) => {
    let h = `<li id="step-${s.id}"><h2>${esc(t.stepOf(i + 1, QH_SCENES.length))}: ${esc(pick(s.title, lang))}</h2>`
    if (s.when) h += `<p><strong>${esc(pick(s.when, lang))}</strong></p>`
    h += `<p>${esc(pick(s.text, lang))}</p>`
    if (s.ayahs) h += `<blockquote><p lang="ar" dir="rtl">${s.ayahs.map(a => `${esc(a.ar)} ﴿${'٠١٢٣٤٥٦٧٨٩'[a.n]}﴾`).join(' ')}</p><p><small>${esc(t.quran)} 96:1–5</small></p></blockquote>`
    if (s.quotes) h += s.quotes.map(quote).join('')
    if (s.cities) h += `<p>${esc(t.cities)}: ${s.cities.map(c => esc(pick(QH_CITIES[c].name, lang))).join(', ')}. <small>${esc(t.citiesNote)}</small></p>`
    if (s.verse) h += `<blockquote><p lang="ar" dir="rtl">${esc(s.verse.ar)}</p>${lang !== 'ar' && s.verse.text[lang] ? `<p>${esc(s.verse.text[lang])}</p>` : ''}<p><small>${esc(t.quran)} ${esc(s.verse.ref)}</small></p></blockquote>`
    return h + `<p><small>${esc(t.source)}: ${s.src.map(src).join(' · ')}</small></p></li>`
  }
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName('quran', lang), href: pathFor('quran', lang) }, { name: shortName('quranhistory', lang) }]) +
    `<header><h1>${esc(t.title)}</h1><p class="seo-static__lead">${esc(t.lead)}</p></header>` +
    `<ol>${QH_SCENES.map(item).join('')}</ol>` +
    `<p>${esc(t.note)}</p>` +
    `<p><a href="${pathFor('quran', lang)}">${esc(shortName('quran', lang))}</a> · <a href="${pathFor('mushaf', lang)}">${esc(shortName('mushaf', lang))}</a> · <a href="${pathFor('seerah', lang)}">${esc(shortName('seerah', lang))}</a></p>`,
  )
}

// ═══ Quranda peyğəmbərlər (/quran-prophets, 2026-11-28) — 25 ad, say və ayə linkləri ═══
// Səhifədəki eyni məlumat (data/quranProphets.js — generator, Quranic Arabic Corpus); #<id> səhifədə seçimi açır.
function quranProphetsBody(lang) {
  const t = QP_T[lang] || QP_T.en
  const refs = (enc) => {
    const seen = new Set()
    return decodeLocations(enc).filter(([s, a]) => !seen.has(`${s}:${a}`) && seen.add(`${s}:${a}`))
      .map(([s, a]) => `<a href="${pathFor('quran', lang, s)}?a=${a}">${s}:${a}</a>`).join(' ')
  }
  const total = QURAN_PROPHETS.reduce((n, p) => n + p.count, 0)
  const item = (p) => {
    let h = `<li id="${p.id}"><h2><span lang="ar" dir="rtl">${esc(p.ar)}</span> — <a href="${pathFor('quranprophets', lang)}#${p.id}">${esc(pick(p.name, lang))}</a>: ${esc(t.mentioned(p.count))}</h2>`
    if (t.notes[p.id]) h += `<p><small>${esc(t.notes[p.id])}</small></p>`
    h += `<p>${refs(p.locs)}</p>`
    for (const v of p.variants || []) h += `<p><span lang="ar" dir="rtl">${esc(v.ar)}</span> — ${esc(t.names[v.id])}: ${esc(t.mentioned(v.count))}. ${refs(v.locs)}</p>`
    return h + '</li>'
  }
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName('quran', lang), href: pathFor('quran', lang) }, { name: shortName('quranprophets', lang) }]) +
    `<header><h1>${esc(t.title)}</h1><p class="seo-static__lead">${esc(t.lead)}</p></header>` +
    `<p>${esc(t.total(total))}</p>` +
    `<ol>${[...QURAN_PROPHETS].sort((a, b) => a.num - b.num).map(item).join('')}</ol>` +
    `<p><small>${esc(t.source)}</small></p><p><small>${esc(t.rule)}</small></p><p>${esc(t.note)}</p>` +
    `<p><a href="${pathFor('quran', lang)}">${esc(shortName('quran', lang))}</a> · <a href="${pathFor('quranroots', lang)}">${esc(shortName('quranroots', lang))}</a> · <a href="${pathFor('history', lang)}">${esc(shortName('history', lang))}</a></p>`,
  )
}

// ═══ Rabbanā duaları (/rabbana-duas, 2026-11-28) — səhifədəki eyni dualar ═══
// Ərəbcə hissə ayənin öz mətnindən (rabbanaSpans.gen.js), tərcümə — səhifədəki nəşr (bütün ayə);
// ərəbcədə tərcümə yoxdur. Hər dua Quran oxuyucusunda həmin ayəyə link; #d-<s>-<a> səhifədəki lövbərdir.
function rabbanaBody(lang) {
  const t = RB_T[lang] || RB_T.en
  const ed = lang !== 'ar' && EDITION[lang] ? edition(EDITION[lang]) : null
  const item = (it) => {
    const href = `${pathFor('quran', lang, it.s)}?a=${it.a}`
    const who = it.who && RB_WHO[it.who] ? (RB_WHO[it.who][lang] || RB_WHO[it.who].en) : ''
    const tr = ed ? trAyah(ed.ayahs[it.s - 1][it.a - 1], lang) : ''
    return `<li id="d-${it.s}-${it.a}"><p lang="ar" dir="rtl">${esc(it.ayah.slice(it.start, it.end))}</p>` +
      (who ? `<p><strong>${esc(t.who)}:</strong> ${esc(who)}</p>` : '') +
      (tr ? `<p>${esc(tr)}</p>` : '') +
      `<p><a href="${href}">${esc(rabbanaRef(it, lang))}</a></p></li>`
  }
  const by = ed ? (ed.edition?.name || ed.edition?.englishName || '') : ''
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName('duas', lang), href: pathFor('duas', lang) }, { name: shortName('rabbana', lang) }]) +
    `<header><h1>${esc(t.title)}</h1><p class="seo-static__lead">${esc(t.lead)}</p></header>` +
    `<section><h2>${esc(t.listTitle)} — ${esc(t.nDuas(RABBANA_ITEMS.length))}</h2>` +
    (by ? `<p><small>${esc(t.trOf(by))}</small></p>` : '') +
    `<ol>${RABBANA_ITEMS.map(item).join('')}</ol></section>` +
    `<p>${esc(t.note)}</p><p><small>${esc(t.source)}</small></p>` +
    `<p><a href="${pathFor('duas', lang)}">${esc(shortName('duas', lang))}</a> · <a href="${pathFor('hisn', lang)}">${esc(shortName('hisn', lang))}</a> · <a href="${pathFor('quran', lang)}">${esc(shortName('quran', lang))}</a></p>`,
  )
}

// ═══ Hədis siyahısı (/hadith) — hər /hadith/<id> səhifəsinə link (2026-11-24) ═══
// Əvvəl hədis səhifələrinə yalnız əvvəlki/növbəti zənciri və sitemap aparırdı (krawl dərinliyi ~1100).
function hadithListBody(lang) {
  const T = HADITH_T[lang] || HADITH_T.az
  const items = HADITH_IDS.map((id) => {
    const m = detailMeta('hadith', lang, id)
    return m ? `<li><a href="${pathFor('hadith', lang, id)}">${esc(m.crumb)}</a></li>` : ''
  }).join('')
  return shell(lang,
    crumbs(lang, [{ name: brandName(lang), href: pathFor('home', lang) }, { name: shortName('hadith', lang) }]) +
    `<header><h1>${esc(shortName('hadith', lang))}</h1><p class="seo-static__lead">${esc(descFor('hadith', lang))}</p></header>` +
    `<h2>${esc(T.all)}</h2><ol class="seo-static__list">${items}</ol>`,
  )
}

// ═══ Hisnul-Müslim zikri (/ar/hisnul-muslim/<fəsil>-<bənd>, 2026-11-24) — YALNIZ ərəbcə ═══
// Ərəb mətni, təkrar sayı və təxric public/data/hisn/ar.json-dan olduğu kimi; tərcümə YOXDUR (sahibin qərarı).
function hisnDuaBody(id) {
  const x = hisnInfo(id)
  if (!x) return ''
  const m = detailMeta('hisn', 'ar', id)
  const T = HISN_AR
  const i = HISN_DUA_IDS.indexOf(String(id))
  const near = (j, label) => (j >= 0 && j < HISN_DUA_IDS.length ? { href: pathFor('hisn', 'ar', HISN_DUA_IDS[j]), label, name: detailMeta('hisn', 'ar', HISN_DUA_IDS[j])?.crumb || '' } : null)
  return shell('ar',
    detailCrumbs('hisn', 'ar', id) +
    `<header><h1>${esc(m.h1)}</h1></header>` +
    `<blockquote lang="ar" dir="rtl" class="seo-static__ar">${esc(x.ar)}</blockquote>` +
    facts([[T.repeat, x.repeat > 1 ? T.times(x.repeat) : ''], [T.src, x.src]]) +
    `<p>${esc(T.book(HISN_BOOK))} <a href="${pathFor('hisn', 'ar')}#hs-${x.chapter}">${esc(T.chapter)}: ${esc(x.chapterTitle)}</a></p>` +
    pager(near(i - 1, T.prev), near(i + 1, T.next)) +
    `<p><a href="${pathFor('hisn', 'ar')}">${esc(T.all)}</a></p>`,
  )
}

// Ərəbcə /ar/hisnul-muslim siyahısı — hər zikr səhifəsinə link, fəsillər üzrə (digər dillərdə statik blok yoxdur)
function hisnListBody() {
  const byCh = new Map()
  for (const id of HISN_DUA_IDS) {
    const x = hisnInfo(id)
    if (!x) continue
    if (!byCh.has(x.chapter)) byCh.set(x.chapter, { title: x.chapterTitle, items: [] })
    byCh.get(x.chapter).items.push(`<li><a href="${pathFor('hisn', 'ar', id)}">${esc(detailMeta('hisn', 'ar', id).crumb)}</a></li>`)
  }
  return shell('ar',
    crumbs('ar', [{ name: brandName('ar'), href: pathFor('home', 'ar') }, { name: shortName('hisn', 'ar') }]) +
    `<header><h1>${esc(shortName('hisn', 'ar'))}</h1><p class="seo-static__lead">${esc(descFor('hisn', 'ar'))}</p></header>` +
    [...byCh].map(([c, g]) => `<section id="hs-${c}"><h2>${esc(g.title)}</h2><ol class="seo-static__list">${g.items.join('')}</ol></section>`).join(''),
  )
}

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
// ═══ Ana səhifə — statik ilk ekran (Hero A, 2026-11-24) ═══
// NİYƏ: ana səhifənin #root-u boş idi — ilk boyama (FCP) JS-i gözləyirdi (orta telefonda ~3.5 s).
// İndi HTML-in özündə React-in İLK görünüşünün surəti var: başlıq zolağı (loqo), günün
// xatırlatmaları zolağının yer tutucusu, hero (nişan, "Muslims.cc", şüar, iki düymə, üç üstünlük)
// və namaz kartının yüklənmə halı (pages/HomePage.jsx → PrayerWidget, skeleton). Sinif adları və
// ardıcıllıq HomePage.jsx ilə EYNİDİR; bu blokun kritik CSS-i prerender-də inline yazılır
// (prerender.mjs → homeCriticalFor) — React bloku əvəz edəndə heç nə yerindən oynamır. Hero-nun CSS
// animasiyaları burada başlayır; React onları kəsmədən davam etdirir (HomePage.jsx → staticHero).
// Mətnlər src/components/home/heroText.js-dəndir (React ilə ortaq). Yalnız 5 əsas dil — əlavə
// dillərdə interfeys lüğətlə tərcümə olunur, statik surət onunla hərfbəhərf üst-üstə düşməzdi.
// İkonlar Icon.jsx-in ÖZ yollarından oxunur (tək mənbə).
let iconSrc = null
function iconSvg(name, size = 20, sw = 1.75, cls = '') {
  if (iconSrc == null) iconSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'Icon.jsx'), 'utf8')
  const line = iconSrc.split(/\r?\n/).find(l => l.startsWith(`  ${name}: `))
  if (!line) throw new Error(`Icon.jsx: "${name}" ikonu tapılmadı (seo-body homeBody)`)
  const body = line.slice(`  ${name}: `.length).replace(/,\s*$/, '').replace(/<\/?>/g, '').replace(/strokeWidth=/g, 'stroke-width=')
  return `<svg${cls ? ` class="${cls}"` : ''} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`
}
// components/Icon.jsx → BrandMark ilə eyni
const BRAND_MARK = '<svg class="qm-mark " width="34" height="34" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect class="qm-mark-tile" width="32" height="32" rx="9"/><path class="qm-mark-star" d="M9.4 9.4h13.2v13.2H9.4zM16 6.7 25.3 16 16 25.3 6.7 16z"/><circle class="qm-mark-dot" cx="16" cy="16" r="2.1"/></svg>'
// Nur xatəmi (HeroOrnament) statik blokda YOXDUR — React gələndən sonra özünü çəkir (main thread-də
// rəngləmə tələb edir; JS yüklənərkən CPU-nu yeməsin)
const HOME_PRAYER_ICON = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }

export function homeBody(lang) {
  if (!LANGS.includes(lang)) return ''
  const t = HERO_T[lang] || HERO_T.en
  const brand = brandName(lang).trim()
  const dot = brand.lastIndexOf('.')
  const first = dot > 0 ? brand.slice(0, dot) : brand
  const last = dot > 0 ? brand.slice(dot) : ''
  const names = HOME_PRAYER_NAMES[lang] || HOME_PRAYER_NAMES.en
  const city = DEFAULT_PRAYER_LOCATION.city[lang] || DEFAULT_PRAYER_LOCATION.city.en
  const home = pathFor('home', lang)
  const prayer = pathFor('prayer', lang)
  const chars = [...first].map((ch, i) => `<span class="hp-ht-ch" style="--ci:${i}">${esc(ch)}</span>`).join('')
  const rows = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(k =>
    `<li class="hp-pr hp-pr--skel"><span class="hp-pr-dot" aria-hidden="true"></span>` +
    `<span class="hp-pr-ic" aria-hidden="true">${iconSvg(HOME_PRAYER_ICON[k], 18)}</span>` +
    `<span class="hp-pr-nm"><span>${esc(names[k])}</span></span>` +
    `<span class="hp-pr-tm"><span class="hp-skel skeleton" aria-hidden="true"></span></span>` +
    `<span class="hp-pr-chk" aria-hidden="true"></span></li>`).join('')
  return `<div class="qm-home-first" data-seo-static="" data-home-static="">` +
    `<header class="header"><div class="header-inner"><div class="header-left">` +
    `<a class="logo" href="${home}"><span class="logo-icon" aria-hidden="true">${BRAND_MARK}</span>` +
    `<span class="logo-text-wrap"><span class="logo-main">${esc(first)}</span>${last ? `<span class="logo-dot">${esc(last)}</span>` : ''}</span></a>` +
    `</div></div></header>` +
    `<div class="qm-shell"><div class="qm-shell-main"><main style="min-height:calc(100vh - var(--header-h, 64px))">` +
    `<div class="hp-root"><div class="hp-top">` +
    `<div class="drb-wrap" aria-hidden="true"><div class="drb drb--skeleton"></div></div>` +
    `<section class="hp-hero"><div class="hp-hero-bg" aria-hidden="true"><div class="ui-pattern ui-pattern--fade hp-hero-pattern"></div><div class="hp-wx"></div></div>` +
    `<div class="hp-hero-inner"><div class="hp-hero-content">` +
    `<span class="ui-eyebrow hp-badge">${esc(t.badge)}</span>` +
    `<h1 class="hp-hero-title hp-shine" aria-label="${esc(brand)}"><span class="hp-ht-row" aria-hidden="true"><span class="hp-ht-1">${chars}</span>${last ? `<span class="hp-ht-2">${esc(last)}</span>` : ''}</span></h1>` +
    `<p class="hp-hero-sub">${esc(brandTr(BRAND.tagline, lang))}</p>` +
    `<div class="hp-hero-btns">` +
    `<a class="ui-btn ui-btn--primary ui-btn--lg" href="${prayer}">${iconSvg('prayer', 20, 1.75, 'ui-btn__icon')} ${esc(t.btnTimes)}</a>` +
    `<a class="ui-btn ui-btn--secondary ui-btn--lg" href="${pathFor('quran', lang)}">${iconSvg('quran', 20, 1.75, 'ui-btn__icon')} ${esc(t.btnQuran)}</a>` +
    `</div>` +
    `<ul class="hp-hero-trust" aria-label="${esc(t.heroTrust)}"><li>${iconSvg('check', 16)} ${esc(t.noSignup)}</li><li>${iconSvg('shield', 16)} ${esc(t.adFree)}</li><li>${iconSvg('globe', 16)} ${esc(t.langs)}</li></ul>` +
    `</div><div class="hp-hero-visual">` +
    `<section class="hp-pc" aria-labelledby="hp-pc-ttl-s"><div class="hp-pc-hdr"><div class="hp-pc-hdr-l">` +
    `<h2 id="hp-pc-ttl-s" class="hp-pc-ttl">${esc(t.pcTitle)}</h2>` +
    `<span class="hp-pc-sub">${iconSvg('pin', 14)} <span class="cp-trigger cp-trigger--inline hp-pc-city"><span class="cp-trigger__name">${esc(city)}</span>${iconSvg('chevronDown', 14, 1.75, 'cp-trigger__chev')}</span> · ${esc(t.calc)}</span>` +
    `</div><span class="hp-pc-ic ui-icon-tile ui-icon-tile--sm" aria-hidden="true">${iconSvg('prayer', 18)}</span></div>` +
    `<ol class="hp-pr-list" aria-busy="true" aria-label="${esc(t.loading)}">${rows}</ol>` +
    `<p class="hp-pc-note">${esc(t.calcNote(city))}</p>` +
    `<a class="hp-pc-more ui-btn ui-btn--secondary ui-btn--block" href="${prayer}">${esc(t.allTimes)}</a>` +
    `</section></div></div></section></div></div>` +
    `</main></div></div></div>`
}

export function staticBodyFor(key, lang, param = null) {
  // Əlavə dildə yalnız mövcud bölmələr (Quran) — src/seo/langs.js
  // Əlavə dildə statik blok yalnız öz məzmunu olan bölmədə (Quran); qalan
  // səhifələri React çəkir (interfeys lüğətlə, məzmun ingiliscə)
  if (!LANGS.includes(lang) && !(EXTRA_LANGS[lang] && EXTRA_PAGES.includes(key))) return ''
  if (key === 'home') return param == null ? homeBody(lang) : ''
  if (key === 'quran') return param ? surahBody(lang, param) : quranListBody(lang)
  if (key === 'names') return param ? nameBody(lang, param) : namesListBody(lang)
  if (key === 'sahaba') return param ? sahabaBody(lang, param) : sahabaListBody(lang)
  if (key === 'scholars') return param ? scholarBody(lang, param) : scholarsListBody(lang)
  if (key === 'learn') return param ? lessonBody(lang, param) : lessonsListBody(lang)
  if (key === 'glossary') return param ? termBody(lang, param) : glossaryListBody(lang)
  if (key === 'prayer') return param ? prayerCityBody(lang, param) : prayerListBody(lang)
  if (key === 'babynames') return babyNamesBody(lang)
  if (key === 'seerah') return param == null ? seerahBody(lang) : ''
  if (key === 'revelationorder') return param == null ? revelationOrderBody(lang) : ''
  if (key === 'quranhistory') return param == null ? quranHistoryBody(lang) : ''
  if (key === 'quranprophets') return param == null ? quranProphetsBody(lang) : ''
  if (key === 'rabbana') return param == null ? rabbanaBody(lang) : ''
  if (key === 'hadith') return param ? hadithBody(lang, param) : hadithListBody(lang)
  // Hisnul-Müslim: zikr səhifəsi və siyahının statik bloku yalnız ərəbcə (routes.js → DETAILS.hisn.langs)
  if (key === 'hisn') return lang !== 'ar' ? '' : param ? hisnDuaBody(param) : hisnListBody()
  if (param == null && GUIDES[key]) return guideBody(key, lang)
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
  if (key !== 'quran' || !EDITION[lang]) return ''
  const api = 'https://api.alquran.cloud/v1'
  const links = [`<link rel="preconnect" href="https://api.alquran.cloud" crossorigin />`]
  // QuranEnc dilində oxuyucu ərəb mətnini ar.alafasy,en.asad ilə, tərcüməni QuranEnc-dən alır (QuranPage.jsx)
  const qe = EXTRA_LANGS[lang]?.qe
  if (param) links.push(`<link rel="preload" as="fetch" crossorigin="anonymous" href="${api}/surah/${param}/editions/ar.alafasy,${qe ? 'en.asad' : EDITION[lang]}" />`)
  if (param && qe) links.push(`<link rel="preload" as="fetch" crossorigin="anonymous" href="https://quranenc.com/api/v1/translation/sura/${qe}/${param}" />`)
  links.push(`<link rel="preload" as="fetch" crossorigin="anonymous" href="${api}/surah" />`)
  return links.map(l => '\n    ' + l).join('')
}
