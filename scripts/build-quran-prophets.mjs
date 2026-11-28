#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// QURANDA PEYĞƏMBƏRLƏR — node scripts/build-quran-prophets.mjs [--input <quran-morphology.txt>]
//
// Mənbə: mustafa0x/quran-morphology (Quranic Arabic Corpus v0.4 morfologiyası, GPL v3) —
// /quran-roots indeksi ilə eyni fayl (scripts/build-quran-roots.mjs). Say qaydaları:
// scripts/quran-prophets-lib.mjs (başlıqda). Hər yer Osmani mətni ilə yoxlanılır; uyğunsuzluq
// olsa skript dayanır (heç nə yazılmır).
//
// Çıxış:
//   src/data/quranProphets.js — 25 peyğəmbər: ad (5 dil, data/islamicHistory.js-dən), say, yerlər
//   tests/unit/fixtures/quran-prophets-morphology.txt — yalnız lazım olan sətirlər (unit test eyni
//   məntiqi bu çıxarış üzərində yenidən işlədib sayları yoxlayır)
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { encodeLocations } from '../src/utils/quranRoots.js'
import { PROPHETS } from '../src/data/islamicHistory.js'
import {
  MORPHOLOGY_URL, PROPHET_RULES, parseMorphology, computeProphets, hudExcluded, locMatchesText, textCount, nfc,
} from './quran-prophets-lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src/data/quranProphets.js')
const FIXTURE = path.join(ROOT, 'tests/unit/fixtures/quran-prophets-morphology.txt')

const argv = process.argv.slice(2)
const inputIdx = argv.indexOf('--input')
let text
if (inputIdx >= 0) text = fs.readFileSync(argv[inputIdx + 1], 'utf8')
else {
  const res = await fetch(MORPHOLOGY_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${MORPHOLOGY_URL}`)
  text = await res.text()
}
const sha256 = crypto.createHash('sha256').update(text).digest('hex')
const { words, lines } = parseMorphology(text)
if (lines < 100000) throw new Error(`gözləniləndən az sətir: ${lines}`)

const uthmani = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo-data/quran/quran-uthmani.json'), 'utf8'))
const prophets = computeProphets(words)

// ── Yoxlama: hər yer mətndə həmin sözdür; mətnlə sayıla bilənlərdə saylar bərabərdir ──
const errors = []
for (const p of prophets) {
  const rule = PROPHET_RULES.find(r => r.id === p.id)
  if (!p.count) errors.push(`${p.id}: say 0`)
  for (const l of p.locs) if (!locMatchesText(uthmani, rule, l)) errors.push(`${p.id}: ${l.join(':')} mətndə tapılmadı`)
  if (rule.textCount) {
    const n = textCount(uthmani, rule)
    if (n !== p.count) errors.push(`${p.id}: korpus ${p.count} ≠ mətn ${n}`)
  }
  for (const v of p.variants) {
    const vr = rule.variants.find(x => x.id === v.id)
    if (!v.count) errors.push(`${p.id}/${v.id}: say 0`)
    for (const l of v.locs) if (!locMatchesText(uthmani, vr, l)) errors.push(`${p.id}/${v.id}: ${l.join(':')} mətndə tapılmadı`)
  }
  if (!PROPHETS.some(x => x.num === p.num)) errors.push(`${p.id}: PROPHETS-də num ${p.num} yoxdur`)
}
const excluded = hudExcluded(words)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }

// ── src/data/quranProphets.js ──
const nameOf = (num) => PROPHETS.find(x => x.num === num).name
const rows = prophets.map(p => {
  const v = p.variants.length
    ? `,\n    variants: [${p.variants.map(x => `{ id: '${x.id}', ar: '${x.ar}', count: ${x.count}, locs: '${encodeLocations(x.locs)}' }`).join(', ')}]`
    : ''
  const nm = Object.entries(nameOf(p.num)).map(([k, s]) => `${k}: ${JSON.stringify(s)}`).join(', ')
  return `  { id: '${p.id}', num: ${p.num}, ar: '${p.ar}', count: ${p.count},\n    name: { ${nm} },\n    locs: '${encodeLocations(p.locs)}'${v} },`
})
const js = `// ═══════════════════════════════════════════════════════
// AVTOMATİK YARADILIB — node scripts/build-quran-prophets.mjs (əl ilə dəyişməyin)
// Quranda adı çəkilən 25 peyğəmbər: adın neçə dəfə keçdiyi və yerləri (surə:ayə:söz).
// Mənbə: Quranic Arabic Corpus morfologiyası (mustafa0x/quran-morphology, GPL v3).
// Say qaydaları: scripts/quran-prophets-lib.mjs. Adlar: data/islamicHistory.js PROPHETS.
// locs: "s:a:w" vergüllə, surə əvvəlkinə bərabərdirsə "a:w" (utils/quranRoots.js decodeLocations).
// ═══════════════════════════════════════════════════════

export const QURAN_PROPHETS_META = {
  dataset: 'Quranic Arabic Corpus morphology v0.4 (University of Leeds), via mustafa0x/quran-morphology',
  sourceUrl: 'https://github.com/mustafa0x/quran-morphology',
  corpusUrl: 'https://corpus.quran.com',
  license: 'GNU General Public License v3.0',
  sha256: '${sha256}',
  generated: '${new Date().toISOString().slice(0, 10)}',
  // Hud: «yəhudilər» mənasında هُودًا أَوْ نَصَٰرَىٰ — sayılmır
  hudExcluded: '${encodeLocations(excluded)}',
}

export const QURAN_PROPHETS = [
${rows.join('\n')}
]
`
fs.writeFileSync(OUT, js)

// ── Test çıxarışı: qaydaların baxdığı sözlər və qonşuları ──
const lemmas = new Set(PROPHET_RULES.flatMap(r => [r.lemma, ...(r.variants || []).map(v => v.lemma)]).filter(Boolean).map(nfc))
lemmas.add(nfc('كِفْل'))
const keep = new Set()
for (const [key, segs] of words) {
  if (!segs.some(g => lemmas.has(g.lem))) continue
  keep.add(key)
  // Qonşu sözlər yalnız Hud (أَو + نَصْرانِيّ) və Zül-Kifl (ذُو) qaydalarına lazımdır
  if (!segs.some(g => g.lem === nfc('هُود') || g.lem === nfc('كِفْل'))) continue
  const [s, a, w] = key.split(':').map(Number)
  for (let d = -1; d <= 2; d++) keep.add(`${s}:${a}:${w + d}`)
}
const fixture = text.split(/\r?\n/).filter(l => {
  const m = /^(\d+:\d+:\d+):\d+\t/.exec(l)
  return m && keep.has(m[1])
})
fs.mkdirSync(path.dirname(FIXTURE), { recursive: true })
fs.writeFileSync(FIXTURE, [
  '# Çıxarış: Quranic Arabic Corpus morphology v0.4 (University of Leeds, corpus.quran.com),',
  '# via https://github.com/mustafa0x/quran-morphology — GNU GPL v3.',
  `# Yaradan: scripts/build-quran-prophets.mjs (tam faylın sha256: ${sha256}). Əl ilə dəyişməyin.`,
  ...fixture, '',
].join('\n'))

console.log(prophets.map(p => `${p.id} ${p.count}${p.variants.map(v => ` (+${v.id} ${v.count})`).join('')}`).join('\n'))
console.log(`hud excluded: ${encodeLocations(excluded)}`)
console.log(`yazıldı: ${path.relative(ROOT, OUT)}, ${path.relative(ROOT, FIXTURE)} (${fixture.length} sətir)`)
