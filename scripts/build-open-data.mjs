#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// AÇIQ MƏLUMAT — node scripts/build-open-data.mjs (vite build-dən SONRA)
//
// dist/open-data/ qovluğuna statik JSON faylları yazır:
//   index.json                — fayl siyahısı, lisenziya, atribusiya
//   hadiths-<dil>.json        — təkrarsız hədislər, yalnız ərəb mətni + istinad (src/utils/uniqueHadiths.js →
//                               buildHadithLangData, vite.config.js-dəki ilə EYNİ)
//   duas-<dil>.json           — dualar (src/data/duas.js)
//   names99.json              — Allahın 99 adı (src/data/names99.js, İbn Useymin siyahısı)
//   nawawi40.json             — Nəvəvinin 42 hədisi (src/data/nawawi40.js; en mətni YOXDUR — aşağıya bax)
//   lessons-index.json        — dərslərin siyahısı (src/data/lessons/index.js; yalnız meta)
//
// DAXİL EDİLMƏYƏNLƏR (ehtiyatla — yenidən yaymaq hüququmuz təsdiqlənməyib):
//   • Quran tərcümələri (Məmmədəliyev–Bünyadov, Əsəd, Quliyev, Diyanət, Saheeh
//     International) — müəllif hüquqları tərcüməçilərə/naşirlərə məxsusdur.
//   • Təfsirlər (Quran.com API), qiraət səsləri, fotolar, xəritə məlumatları.
//   • nawawi40 İNGİLİSCƏ mətni — sunnah.com / hadith-api-dəki müəllif hüquqlu
//     tərcüməyə (eng-nawawi) çox yaxındır; ərəbcə, az, ru, tr və faydalar daxildir.
//   • tadabbur.js — ayə tərcümələri üçüncü tərəfindir.
//   • Hədis tərcümələri — istifadə şərtlərinə görə hüquqları sahiblərinə məxsusdur.
//
// LİSENZİYA: SITE_LICENSE sabiti sayt sahibinin seçimidir — dəyişsəniz,
// src/pages/OpenDataPage.jsx-dəki mətni də yeniləyin.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'dist', 'open-data')
const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const SITE = 'https://muslims.cc'
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href)

export const SITE_LICENSE = {
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
}
const ATTRIBUTION = 'Muslims.cc — https://muslims.cc/open-data'

function header(dataset, extra = {}) {
  return {
    dataset,
    publisher: 'Muslims.cc',
    homepage: `${SITE}/open-data`,
    license: SITE_LICENSE,
    attribution: ATTRIBUTION,
    generated: new Date().toISOString(),
    ...extra,
  }
}

function write(name, data) {
  const file = path.join(OUT, name)
  const json = JSON.stringify(data)
  fs.writeFileSync(file, json)
  return { file: name, bytes: Buffer.byteLength(json), count: Array.isArray(data.items) ? data.items.length : undefined }
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, 'dist'))) {
    console.error('dist/ yoxdur — əvvəlcə "vite build" işlədin.')
    process.exit(1)
  }
  fs.mkdirSync(OUT, { recursive: true })

  const [{ HADITHS }, uniq, { DUAS_DATA }, { NAMES_99 }, nawawi, lessons, { pathFor }, { localizeSource }] = await Promise.all([
    load('src/data/hadiths.js'),
    load('src/utils/uniqueHadiths.js'),
    load('src/data/duas.js'),
    load('src/data/names99.js'),
    load('src/data/nawawi40.js'),
    load('src/data/lessons/index.js'),
    load('src/seo/routes.js'),
    load('src/utils/sourceNames.js'),
  ])

  const files = []

  // ── Hədislər: build-dəki təkrarsızlaşdırma ilə eyni ──
  for (const lang of LANGS) {
    const { list } = uniq.reviveHadithLangData(uniq.buildHadithLangData(HADITHS, lang))
    const items = list.map(h => ({
      id: h.id,
      category: h.cat,
      source: localizeSource(h.source, lang),
      arabic: h.ar || '',
      // Tərcümə QƏSDƏN yoxdur: istifadə şərtlərinə görə hədis tərcümələrinin
      // hüququ müvafiq sahiblərinə məxsusdur — yalnız ərəb mətni və istinad
      url: `${SITE}${pathFor('hadith', lang)}`,
    }))
    files.push(write(`hadiths-${lang}.json`, header(`hadiths-${lang}`, {
      language: lang,
      description: 'Authentic hadith: Arabic text, source reference (localised) and topic; duplicates removed (same ids in every file). Translations are NOT included — their rights belong to their respective holders.',
      fields: { id: 'stable id (same across languages)', category: 'topic key', source: 'collection + number', arabic: 'Arabic text (may be the key phrase of a longer hadith)', url: 'page on the site' },
      items,
    })))
  }

  // ── Dualar ──
  for (const lang of LANGS) {
    const items = DUAS_DATA.map(d => ({
      id: d.id,
      category: d.cat,
      arabic: d.ar,
      transliteration: d.translit || '',
      ...(lang === 'ar' ? {} : { text: d[lang] || '' }),
      source: d.source ? localizeSource(d.source, lang) : '',
    }))
    files.push(write(`duas-${lang}.json`, header(`duas-${lang}`, {
      language: lang,
      description: 'Supplications from the Quran and authentic Sunnah with transliteration and source. Translations by Muslims.cc.',
      fields: { id: 'stable id', category: 'occasion key', arabic: 'Arabic text', transliteration: 'Latin transliteration', text: 'translation (absent in the Arabic file)', source: 'Quran surah:ayah or hadith reference' },
      items,
    })))
  }

  // ── 99 ad ──
  files.push(write('names99.json', header('names99', {
    description: 'The 99 Names of Allah as compiled by Shaykh Muhammad ibn Salih al-Uthaymin in al-Qawa‘id al-Muthla (81 from the Quran, 18 from the Sunnah), in his order, with the place each name is established.',
    fields: { n: 'order in the list', arabic: 'name in Arabic', transliteration: 'Latin transliteration', meaning: 'meaning in az/en/ru/tr', proof: 'q = Quran surah:ayah, s = hadith reference' },
    items: NAMES_99.map(x => ({
      n: x.n,
      arabic: x.ar,
      transliteration: x.tr,
      meaning: { az: x.az, en: x.en, ru: x.ru, tr: x.tr_meaning },
      proof: x.proof || null,
    })),
  })))

  // ── Nəvəvinin 40 hədisi (en mətni xaric) ──
  files.push(write('nawawi40.json', header('nawawi40', {
    description: 'Imam an-Nawawi’s Forty (42) Hadith: Arabic text, translations (az, ru, tr), source references and benefits drawn from the classical explanations. The English hadith text is NOT included because it closely follows a copyrighted translation.',
    intro: nawawi.NAWAWI_INTRO,
    sources: nawawi.NAWAWI_SOURCES,
    fields: { n: 'number', title: 'title per language', arabic: 'Arabic text', text: 'translation (az, ru, tr)', source: 'references per language', benefits: 'lessons per language' },
    items: nawawi.NAWAWI_40.map(h => ({
      n: h.n,
      title: h.title,
      arabic: h.ar,
      text: { az: h.text?.az || '', ru: h.text?.ru || '', tr: h.text?.tr || '' },
      source: h.src,
      ...(h.grade ? { grade: h.grade } : {}),
      benefits: h.benefits || {},
    })),
  })))

  // ── Dərslərin siyahısı (yalnız meta; mətnlər saytda) ──
  files.push(write('lessons-index.json', header('lessons-index', {
    description: 'Index of the lessons on the site (titles, summaries, authors/sources, reading time and links). The lesson texts themselves are not included.',
    categories: lessons.LESSON_CATS.map(c => ({ key: c.key, label: c.label, description: c.desc })),
    fields: { slug: 'stable id', category: 'category key', title: 'per language', arabicTitle: 'Arabic title', summary: 'per language', author: 'author / sources per language', minutes: 'reading time', url: 'page per language' },
    items: lessons.LESSONS.map(l => ({
      slug: l.slug,
      category: l.cat,
      title: l.title,
      arabicTitle: l.arTitle || '',
      summary: l.summary,
      author: l.author,
      minutes: l.minutes,
      url: Object.fromEntries(LANGS.map(lg => [lg, SITE + pathFor('learn', lg, l.slug)])),
    })),
  })))

  // ── Siyahı ──
  const index = header('index', {
    description: 'Muslims.cc open data: static JSON files, free to reuse with attribution.',
    files: files.map(f => ({ ...f, url: `${SITE}/open-data/${f.file}` })),
    notIncluded: [
      'Quran translations (copyright of their translators/publishers)',
      'Tafsir texts loaded from Quran.com',
      'Recitation audio, photographs, map data',
      'English text of the Nawawi forty hadith',
    ],
  })
  write('index.json', index)

  const total = files.reduce((s, f) => s + f.bytes, 0)
  console.log(`open-data: ${files.length + 1} fayl, ${(total / 1024).toFixed(0)} KB → dist/open-data/`)
}

main().catch((e) => { console.error(e); process.exit(1) })
