#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// QURAN KÖKLƏRİ İNDEKSİ — node scripts/build-quran-roots.mjs [--input <fayl>]
//
// Mənbə: mustafa0x/quran-morphology (quran-morphology.txt) — Quranic Arabic
// Corpus v0.4 morfologiyasının (Leeds Universiteti, corpus.quran.com) düzəlişli
// forku. Lisenziya: GNU GPL v3 (Corpus-un lisenziyası; fork-da ayrıca lisenziya
// yoxdur, ona görə əsl lisenziya keçərlidir). Yaranan JSON da GPL v3 altındadır
// — faylın "meta" hissəsində və /quran-roots səhifəsində mənbə göstərilir.
//
// Çıxış: public/data/quran-roots.json
//   {
//     meta:  { source, license, … },
//     roots: { "رحم": [ [lemma, kateqoriya, feil_babı, "yerlər"], … ], … }
//   }
//   kateqoriya: V (feil) · N (isim) · ADJ (sifət) · PN (xüsusi ad)
//               AP (fail ismi) · PP (məful ismi) · VN (məsdər)
//   yerlər: vergüllə ayrılmış "s:a:w"; surə əvvəlkinə bərabərdirsə "a:w"
//           (decodeLocations — src/utils/quranRoots.js). w = ayədə sözün sırası
//           (Quran.com API-dəki words[].position ilə eynidir — yoxlanılıb).
// Quran mətni (ayə) faylda YOXDUR: yalnız lüğət forması (lemma) və yerlər.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { encodeLocations } from '../src/utils/quranRoots.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/data/quran-roots.json')
const URL = 'https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt'

const argv = process.argv.slice(2)
const inputIdx = argv.indexOf('--input')
let text
if (inputIdx >= 0) {
  text = fs.readFileSync(argv[inputIdx + 1], 'utf8')
} else {
  const res = await fetch(URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${URL}`)
  text = await res.text()
}

function category(tag, feats) {
  if (tag === 'V') return 'V'
  if (feats.includes('PN')) return 'PN'
  if (feats.includes('ACT_PCPL')) return 'AP'
  if (feats.includes('PASS_PCPL')) return 'PP'
  if (feats.includes('VN')) return 'VN'
  if (feats.includes('ADJ')) return 'ADJ'
  return 'N'
}

// root → lemma → { cats: Map, vf: Map, locs: Set }
const roots = new Map()
const seenWord = new Set()
let lines = 0
for (const line of text.split(/\r?\n/)) {
  if (!line.trim()) continue
  const [loc, , tag, featStr = ''] = line.split('\t')
  const m = /^(\d+):(\d+):(\d+):\d+$/.exec(loc || '')
  if (!m) continue
  lines++
  const feats = featStr.split('|')
  const rootF = feats.find(f => f.startsWith('ROOT:'))
  if (!rootF) continue
  const root = rootF.slice(5)
  const lemma = (feats.find(f => f.startsWith('LEM:')) || 'LEM:').slice(4) || root
  const vfF = feats.find(f => f.startsWith('VF:'))
  const wordKey = `${m[1]}:${m[2]}:${m[3]}`
  // Bir sözdə yalnız bir kök sayılır (nadir hallarda iki seqmentdə kök olur)
  if (seenWord.has(wordKey)) continue
  seenWord.add(wordKey)
  if (!roots.has(root)) roots.set(root, new Map())
  const lemmas = roots.get(root)
  if (!lemmas.has(lemma)) lemmas.set(lemma, { cats: new Map(), vf: new Map(), locs: [] })
  const e = lemmas.get(lemma)
  const cat = category(tag, feats)
  e.cats.set(cat, (e.cats.get(cat) || 0) + 1)
  if (vfF) e.vf.set(vfF.slice(3), (e.vf.get(vfF.slice(3)) || 0) + 1)
  e.locs.push([+m[1], +m[2], +m[3]])
}
if (lines < 100000) throw new Error(`gözləniləndən az sətir: ${lines}`)

const top = map => [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
const out = {}
let words = 0
const sortedRoots = [...roots.keys()].sort((a, b) => a.localeCompare(b, 'ar'))
for (const root of sortedRoots) {
  const lemmas = [...roots.get(root).entries()]
    .map(([lemma, e]) => {
      e.locs.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2])
      words += e.locs.length
      return [lemma, top(e.cats), Number(top(e.vf) || 0), encodeLocations(e.locs), e.locs.length]
    })
    .sort((a, b) => b[4] - a[4])
    .map(r => r.slice(0, 4))
  out[root] = lemmas
}

const data = {
  meta: {
    title: 'Quran roots index (root → lemmas → word locations s:a:w)',
    source: 'mustafa0x/quran-morphology — fork of the Quranic Arabic Corpus morphology v0.4 (University of Leeds, corpus.quran.com)',
    sourceUrl: 'https://github.com/mustafa0x/quran-morphology',
    corpusUrl: 'https://corpus.quran.com',
    license: 'GNU General Public License v3.0 (inherited from the Quranic Arabic Corpus)',
    licenseUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    changes: 'Converted by Muslims.cc (scripts/build-quran-roots.mjs): only root, lemma, part of speech, verb form and word locations are kept.',
    generated: new Date().toISOString().slice(0, 10),
    roots: sortedRoots.length,
    words,
  },
  roots: out,
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
const json = JSON.stringify(data)
fs.writeFileSync(OUT, json)
console.log(`yazıldı: ${path.relative(ROOT, OUT)} — ${sortedRoots.length} kök, ${words} söz, ${(Buffer.byteLength(json) / 1024).toFixed(0)} KB`)
