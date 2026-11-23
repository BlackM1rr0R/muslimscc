// Kəbənin tarixi (components/media/KaabaHistory.jsx): Bəqərə 2:127 — İbrahim və İsmail Evin bünövrəsini qaldırır
// → public/data/kaaba-ayah/<dil>.json. Mənbə: seo-data/quran — Osmani mətni və hər dilin saytda işlənən
// tərcüməsi (QuranPage ilə eyni nəşr). Mətn hərfi-hərfinə köçürülür (build-sky-ayahs.mjs ilə eyni qayda).
import fs from 'node:fs'
import path from 'node:path'
import { EXTRA_LANGS, EXTRA_CODES } from '../src/seo/routes.js'
import { stripTranslationNotes } from '../src/utils/quranText.js'

const Q = 'seo-data/quran', OUT = 'public/data/kaaba-ayah'
const REFS = ['2:127']
const EDITION = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet',
  ...Object.fromEntries(EXTRA_CODES.map(c => [c, EXTRA_LANGS[c].quran || `qe.${EXTRA_LANGS[c].qe}`])) }
const read = (ed) => JSON.parse(fs.readFileSync(path.join(Q, `${ed}.json`), 'utf8'))
const at = (data, ref) => { const [s, a] = ref.split(':').map(Number); return data.ayahs[s - 1][a - 1] }
const uth = read('quran-uthmani')
const ar = Object.fromEntries(REFS.map(r => [r, at(uth, r)]))
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'ar.json'), JSON.stringify({ ar }))
let n = 1
for (const [lang, ed] of Object.entries(EDITION)) {
  if (!fs.existsSync(path.join(Q, `${ed}.json`))) { console.warn('yoxdur:', lang, ed); continue }
  const d = read(ed)
  const tr = Object.fromEntries(REFS.map(r => [r, EXTRA_LANGS[lang]?.notes ? stripTranslationNotes(at(d, r)) : at(d, r)]))
  const by = d.edition?.name || d.edition?.englishName || ed
  fs.writeFileSync(path.join(OUT, `${lang}.json`), JSON.stringify({ by, ar, tr }))
  n++
}
console.log('ok', n, 'fayl,', REFS.length, 'ayə')
