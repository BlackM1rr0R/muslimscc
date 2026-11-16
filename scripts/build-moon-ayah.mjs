// Ay mənzilləri (v7.1): Yasin 36:39 → public/data/moon-ayah/<dil>.json
// Mənbə: seo-data/quran — Osmani mətni və hər dilin saytda işlənən rəsmi tərcüməsi (QuranPage ilə eyni nəşr).
// Mətnlər hərfi-hərfinə köçürülür (build-star-ayahs.mjs ilə eyni qayda).
import fs from 'node:fs'
import path from 'node:path'
import { EXTRA_LANGS, EXTRA_CODES } from '../src/seo/routes.js'
import { stripTranslationNotes } from '../src/utils/quranText.js'
import { MOON_AYAH } from '../src/data/lunarMansions.js'

const Q = 'seo-data/quran', OUT = 'public/data/moon-ayah'
const EDITION = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet',
  ...Object.fromEntries(EXTRA_CODES.map(c => [c, EXTRA_LANGS[c].quran || `qe.${EXTRA_LANGS[c].qe}`])) }
const read = (ed) => JSON.parse(fs.readFileSync(path.join(Q, `${ed}.json`), 'utf8'))
const { surah: s, ayah: a } = MOON_AYAH
const at = (data) => data.ayahs[s - 1][a - 1]
const ar = at(read('quran-uthmani'))
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'ar.json'), JSON.stringify({ ar }))
let n = 1
for (const [lang, ed] of Object.entries(EDITION)) {
  if (!fs.existsSync(path.join(Q, `${ed}.json`))) { console.warn('yoxdur:', lang, ed); continue }
  const d = read(ed)
  const tr = EXTRA_LANGS[lang]?.notes ? stripTranslationNotes(at(d)) : at(d)
  const by = d.edition?.name || d.edition?.englishName || ed
  fs.writeFileSync(path.join(OUT, `${lang}.json`), JSON.stringify({ by, ar, tr }))
  n++
}
console.log('ok', n, 'fayl')
