#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Instagram avtoposterinin 3-cü yuvası (dua / Allahın adı) üçün siyahı — server/instagram-data.js yaradır
//
//   node scripts/build-instagram-data.mjs
//
// Serverin Docker obrazına src/ düşmür (server/Dockerfile: COPY *.js), ona görə saytın məlumatı serverə
// ayrıca JS kimi yazılır (scripts/build-daily-hadith.mjs ilə eyni yanaşma). Mətnlər saytdakı ilə EYNİDİR
// (dəyişdirilmir, uydurulmur), mənbə adı localizeSource ilə:
//   • duas  — src/data/duas.js (DUAS_DATA: Quran ayələri və səhih/həsən hədislərdəki dualar), /duas;
//             dərəcə: yalnız Buxari / Müslim → "Səhih" (utils/hadithGrade.js → gradeOf, 1-ci qayda);
//             digərlərində yalnız mənbə (Sünən hökmləri hədis id-sinə bağlıdır, dua id-sinə yox — uydurulmur).
//   • names — src/data/names99.js (İbn Useyminin siyahısı) + dəlil (proof), /names/<n>-<slug>.
// tests/unit/server-instagram.test.js faylın mənbə ilə eyni qaldığını yoxlayır.
//
// İkinci fayl — server/instagram-ramadan-data.js (Ramazan geri sayımı story-si, server/instagramRamadan.js):
//   saytın /road-to-ramadan hesabı OLDUĞU KİMİ — hər hicri il üçün Ramazanın başlanğıcı / sonu (utils/ramadanRange, Ümmül-Qura)
//   və 90 günlük yolun addımları (utils/ramadanPrep → roadPlan), addımların başlıq / mətni (components/ramadanPrep/prepText.js →
//   STEP_TEXT; "g:<bölmə>" — Ramazan bələdçisinin başlığı ilə, səhifədəki stepView kimi), "N gün qaldı" ifadələri (T.daysLeft,
//   bütöv cümlə), gözlənilən başlanğıc (T.startsOn), hicri ayların adları. src/ uzantısız import işlədir → esbuild ilə yığılır
//   (scripts/server-lib/ramadan-entry.mjs). tests/unit/server-instagram-ramadan.test.js sinxronluğu yoxlayır.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DUAS_DATA } from '../src/data/duas.js'
import { NAMES_99 } from '../src/data/names99.js'
import { NAME_SLUGS } from '../src/seo/detailSlugs.js'
import { gradeOf } from '../src/utils/hadithGrade.js'
import { localizeSource, QURAN_WORD } from '../src/utils/sourceNames.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

export function buildInstagramData() {
  const duas = []
  for (const d of DUAS_DATA) {
    if (!d || !d.ar || !d.source) continue
    const t = {}
    for (const l of ['az', 'en', 'ru', 'tr']) if (typeof d[l] === 'string' && d[l].trim()) t[l] = d[l].trim()
    if (!t.az || !t.en) continue
    const src = Object.fromEntries(LANGS.map((l) => [l, localizeSource(d.source, l)]))
    const g = gradeOf({ source: d.source }, {})
    duas.push({ id: d.id, ar: d.ar.trim(), t, src, sahih: g.g === 's' && (g.gb === 'bukhari' || g.gb === 'muslim') })
  }
  const names = []
  for (const n of NAMES_99) {
    const slug = NAME_SLUGS[n.n - 1]
    if (!n.ar || !slug || !n.proof) continue
    const m = { az: n.az, en: n.en, ru: n.ru, tr: n.tr_meaning }
    if (!m.az || !m.en) continue
    const proof = Object.fromEntries(LANGS.map((l) => [l, n.proof.q
      ? `${QURAN_WORD[l] || QURAN_WORD.en} ${n.proof.q}`
      : localizeSource(String(n.proof.s || ''), l)]))
    if (!proof.az) continue
    names.push({ n: n.n, slug, ar: n.ar, tl: n.tr, m, proof })
  }
  return { duas, names }
}

// ── Ramazan geri sayımı (server/instagram-ramadan-data.js) ──
export const RAMADAN_FIRST_YEAR = 1446
export const RAMADAN_LAST_YEAR = 1480

/** src modulları (scripts/server-lib/ramadan-entry.mjs-in ixracları) → serverin məlumat faylı */
export function buildRamadanData(src) {
  const { ramadanRange, roadPlan, ROAD_DAYS, STEP_KINDS, T, STEP_TEXT, RAMADAN_GUIDE, HIJRI_MONTHS, HIJRI_SUFFIX, formatGregorian, parseGKey } = src
  const pick = (obj, l) => (obj && (obj[l] ?? obj.en))
  const kinds = STEP_KINDS.slice()
  const steps = {}
  for (const kind of kinds) {
    const t = {}, x = {}
    for (const l of LANGS) {
      if (kind.startsWith('g:')) {
        const sec = RAMADAN_GUIDE.find((g) => g.id === kind.slice(2))
        if (!sec) throw new Error(`Ramazan bələdçisində bölmə yoxdur: ${kind}`)
        t[l] = pick(T, l).guideStep(pick(sec.title, l))
        x[l] = pick(T, l).guideText
      } else {
        const s = STEP_TEXT[kind]
        if (!s) throw new Error(`STEP_TEXT-də addım yoxdur: ${kind}`)
        t[l] = pick(s.title, l)
        x[l] = pick(s.text, l)
      }
    }
    steps[kind] = { title: t, text: x }
  }
  const daysLeft = {}, labels = {}
  for (const l of LANGS) {
    const t = pick(T, l)
    daysLeft[l] = Array.from({ length: ROAD_DAYS }, (_, i) => t.daysLeft(i + 1))
    labels[l] = { road: t.road, today: t.today, calc: t.calc }
  }
  const years = []
  for (let y = RAMADAN_FIRST_YEAR; y <= RAMADAN_LAST_YEAR; y++) {
    const r = ramadanRange(y)
    if (!r) throw new Error(`Ramazan aralığı hesablanmadı: ${y}`)
    const plan = roadPlan(y)
    if (plan.length !== ROAD_DAYS || plan[0].n !== ROAD_DAYS) throw new Error(`yolun planı gözlənilən deyil: ${y}`)
    const g = parseGKey(r.s)
    years.push({
      y, s: r.s, e: r.e,
      plan: plan.map((p) => { const i = kinds.indexOf(p.kind); if (i < 0) throw new Error(`naməlum addım: ${p.kind}`); return i }),
      startsOn: Object.fromEntries(LANGS.map((l) => [l, pick(T, l).startsOn(formatGregorian(g, l))])),
    })
  }
  const hijriMonths = Object.fromEntries(LANGS.map((l) => [l, pick(HIJRI_MONTHS, l).slice()]))
  const hijriSuffix = Object.fromEntries(LANGS.map((l) => [l, pick(HIJRI_SUFFIX, l)]))
  return { roadDays: ROAD_DAYS, kinds, steps, daysLeft, labels, hijriMonths, hijriSuffix, years }
}

/** Saytın modullarını esbuild ilə yaddaşda yığıb açır (node uzantısız importları həll etmir). */
export async function loadRamadanSources() {
  const { buildSync } = await import('esbuild')
  const out = buildSync({
    entryPoints: [path.join(ROOT, 'scripts', 'server-lib', 'ramadan-entry.mjs')],
    bundle: true, platform: 'node', format: 'esm', target: 'node20', write: false, logLevel: 'warning',
  })
  const code = out.outputFiles[0].text
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const data = buildInstagramData()
  const header = `// AVTOMATİK YARADILIB — scripts/build-instagram-data.mjs (əl ilə dəyişməyin)
// Instagram avtoposterinin 3-cü yuvası: dualar (src/data/duas.js) və Allahın 99 adı (src/data/names99.js).
// Mətnlər saytdakı ilə eynidir. Oxuyan: server/instagram.js
'use strict'
`
  fs.writeFileSync(path.join(ROOT, 'server', 'instagram-data.js'), header + 'module.exports = ' + JSON.stringify(data) + '\n')
  console.log(`instagram-data.js: ${data.duas.length} dua, ${data.names.length} ad`)
  const rd = buildRamadanData(await loadRamadanSources())
  const rh = `// AVTOMATİK YARADILIB — scripts/build-instagram-data.mjs (əl ilə dəyişməyin)
// Ramazan geri sayımı story-si (server/instagramRamadan.js): saytın /road-to-ramadan hesabı və mətnləri olduğu kimi —
// Ramazanın tarixləri (utils/ramadanRange, Ümmül-Qura), 90 günlük yolun addımları (utils/ramadanPrep), prepText.js.
'use strict'
`
  fs.writeFileSync(path.join(ROOT, 'server', 'instagram-ramadan-data.js'), rh + 'module.exports = ' + JSON.stringify(rd) + '\n')
  console.log(`instagram-ramadan-data.js: ${rd.years.length} hicri il (${rd.years[0].y}–${rd.years[rd.years.length - 1].y}), ${rd.kinds.length} addım növü`)
}
