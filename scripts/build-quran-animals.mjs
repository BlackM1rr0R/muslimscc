// Quranda heyvanlar (v6.5): ayə mətnləri və tərcümələri → public/data/quran-animals/<dil>.json
// Mənbə: seo-data/quran — Osmani mətni və hər dilin saytda işlənən rəsmi tərcüməsi (QuranPage ilə eyni nəşr).
// Mətnlər hərfi-hərfinə köçürülür. Ərəbcə interfeys üçün yalnız Osmani mətni (ar.muyassar təfsirdir — götürülmür).
import fs from 'node:fs'
import path from 'node:path'
import { EXTRA_LANGS, EXTRA_CODES } from '../src/seo/routes.js'
import { stripTranslationNotes } from '../src/utils/quranText.js'
import { QURAN_ANIMALS } from '../src/data/quranAnimals.js'

const Q = 'seo-data/quran', OUT = 'public/data/quran-animals'
const EDITION = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet',
  ...Object.fromEntries(EXTRA_CODES.map(c => [c, EXTRA_LANGS[c].quran || `qe.${EXTRA_LANGS[c].qe}`])) }
const read = (ed) => JSON.parse(fs.readFileSync(path.join(Q, `${ed}.json`), 'utf8'))
const refs = [...new Set(QURAN_ANIMALS.map(a => a.ref))]
const at = (data, ref) => { const [s, a] = ref.split(':').map(Number); return data.ayahs[s - 1][a - 1] }

const uth = read('quran-uthmani')
// Surənin 1-ci ayəsinin əvvəlinə bəsmələ qoşulub (Fatihədən başqa) — 4 sözü çıxarılır (kod nöqtələri
// nəşrdə fərqli ola bilər, ona görə sabit mətnlə yox, söz sayı ilə)
const stripBasmala = (text, ref) => (ref.endsWith(':1') && !ref.startsWith('1:') && text.startsWith('بِسْمِ') ? text.split(' ').slice(4).join(' ') : text)
const ar = Object.fromEntries(refs.map(r => [r, stripBasmala(at(uth, r), r)]))
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'ar.json'), JSON.stringify({ ar }))
let n = 1
for (const [lang, ed] of Object.entries(EDITION)) {
  if (!fs.existsSync(path.join(Q, `${ed}.json`))) { console.warn('yoxdur:', lang, ed); continue }
  const d = read(ed)
  const tr = Object.fromEntries(refs.map(r => [r, EXTRA_LANGS[lang]?.notes ? stripTranslationNotes(at(d, r)) : at(d, r)]))
  const by = d.edition?.name || d.edition?.englishName || ed
  fs.writeFileSync(path.join(OUT, `${lang}.json`), JSON.stringify({ by, ar, tr }))
  n++
}
console.log('ok', n, 'fayl,', refs.length, 'ayə')
