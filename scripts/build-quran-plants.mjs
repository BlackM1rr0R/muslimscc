// Quran bitkiləri bağı (v7.1): ayə mətnləri və tərcümələri → public/data/quran-plants/<dil>.json
// Mənbə və dillər build-quran-animals.mjs ilə EYNİDİR: seo-data/quran — Osmani mətni və hər dilin saytda
// işlənən rəsmi tərcüməsi (QuranPage ilə eyni nəşr). Mətnlər hərfi-hərfinə köçürülür.
// Hər ayədə bitkinin adı ayrıca söz kimi yoxlanılır — yoxdursa skript dayanır (səhv ayə yayımlanmasın).
import fs from 'node:fs'
import path from 'node:path'
import { EXTRA_LANGS, EXTRA_CODES } from '../src/seo/routes.js'
import { stripTranslationNotes } from '../src/utils/quranText.js'
import { QURAN_PLANTS, plantInAyah, plainAr } from '../src/data/quranPlants.js'

const Q = 'seo-data/quran', OUT = 'public/data/quran-plants'
const EDITION = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet',
  ...Object.fromEntries(EXTRA_CODES.map(c => [c, EXTRA_LANGS[c].quran || `qe.${EXTRA_LANGS[c].qe}`])) }
const read = (ed) => JSON.parse(fs.readFileSync(path.join(Q, `${ed}.json`), 'utf8'))
const refs = [...new Set(QURAN_PLANTS.flatMap(p => p.refs))]
const at = (data, ref) => { const [s, a] = ref.split(':').map(Number); return data.ayahs[s - 1][a - 1] }

const uth = read('quran-uthmani')
const bad = []
for (const p of QURAN_PLANTS) for (const r of p.refs) {
  const txt = at(uth, r)
  if (!txt || !plantInAyah(p, txt)) bad.push(`${p.id} ${r}`)
}
if (bad.length) { console.error('✗ Bitkinin adı ayədə tapılmadı:', bad.join(', ')); process.exit(1) }

// Surənin 1-ci ayəsinin əvvəlinə bəsmələ qoşulub (Fatihədən başqa) — 4 sözü çıxarılır (95:1-də «بِّسْمِ» şəddəlidir, ona görə hərəkəsiz müqayisə)
const stripBasmala = (text, ref) => (ref.endsWith(':1') && !ref.startsWith('1:') && plainAr(text.split(' ')[0]) === 'بسم' ? text.split(' ').slice(4).join(' ') : text)
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
