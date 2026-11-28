// Rabbanā duaları (/rabbana-duas, pages/RabbanaPage.jsx)
//   1) src/data/rabbanaSpans.gen.js — daxil edilən ayələrin Osmani mətni + dua hissəsinin yeri
//   2) public/data/rabbana/<dil>.json — hər dilin saytda işlənən nəşri ilə BÜTÜN ayənin tərcüməsi
//      (QuranPage / build-kaaba-ayah.mjs ilə eyni nəşrlər; ərəbcədə tərcümə yoxdur).
// Mənbə: seo-data/quran. Qərarlar: src/data/rabbanaDuas.js. Problem varsa yazmır, exit 1.
//   node scripts/build-rabbana.mjs           — yarat
//   node scripts/build-rabbana.mjs --table   — qərar cədvəlini çap et (content-review üçün)
import fs from 'node:fs'
import path from 'node:path'
import { EXTRA_LANGS, EXTRA_CODES } from '../src/seo/routes.js'
import { stripTranslationNotes } from '../src/utils/quranText.js'
import { RABBANA_DECISIONS } from '../src/data/rabbanaDuas.js'
import { buildRabbana, genModule } from './rabbana-lib.mjs'

const Q = 'seo-data/quran', OUT = 'public/data/rabbana', GEN = 'src/data/rabbanaSpans.gen.js'
const EDITION = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet',
  ...Object.fromEntries(EXTRA_CODES.map(c => [c, EXTRA_LANGS[c].quran || `qe.${EXTRA_LANGS[c].qe}`])) }
const read = (ed) => JSON.parse(fs.readFileSync(path.join(Q, `${ed}.json`), 'utf8'))
const at = (data, s, a) => data.ayahs[s - 1][a - 1]

const uth = read('quran-uthmani').ayahs
const { items, problems } = buildRabbana(uth, RABBANA_DECISIONS)
if (problems.length) {
  console.error('Problemlər:\n  ' + problems.join('\n  '))
  process.exit(1)
}

if (process.argv.includes('--table')) {
  const span = new Map(items.map(it => [it.ref, it.ayah.slice(it.start, it.end)]))
  for (const d of RABBANA_DECISIONS) {
    console.log(`| ${d.ref} | ${d.status} | ${d.who || ''} | ${d.reason} | ${span.get(d.ref) || ''} |`)
  }
  process.exit(0)
}

const incl = items.filter(it => it.status === 'include')
fs.writeFileSync(GEN, genModule(items))
fs.mkdirSync(OUT, { recursive: true })
let n = 0
for (const [lang, ed] of Object.entries(EDITION)) {
  if (!fs.existsSync(path.join(Q, `${ed}.json`))) { console.warn('yoxdur:', lang, ed); continue }
  const d = read(ed)
  const tr = Object.fromEntries(incl.map(it => {
    const t = at(d, it.s, it.a)
    return [it.ref, EXTRA_LANGS[lang]?.notes ? stripTranslationNotes(t) : t]
  }))
  const by = d.edition?.name || d.edition?.englishName || ed
  fs.writeFileSync(path.join(OUT, `${lang}.json`), JSON.stringify({ by, tr }))
  n++
}
console.log('ok:', incl.length, 'dua,', n, 'tərcümə faylı')
