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
}
