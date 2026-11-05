#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Lüğət terminləri → Quran kökü (src/data/glossaryRoots.js)
//
// Termin ərəbcə yazılışı (ar) Quran morfologiya indeksindəki lemmalarla
// tutuşdurulur (public/data/quran-roots.json): hərəkələr, tətvil, artikl (ال)
// atılır, əlif növləri birləşdirilir. Uyğun gələn lemmanın kökü və kökün
// Quranda neçə dəfə keçdiyi yazılır. Uyğun gəlməyən termin (məs. "التوحيد" —
// Quranda lemma kimi yoxdur) və çoxsözlü birləşmələr siyahıya düşmür — təxmin edilmir.
//
// İstifadə: node scripts/build-glossary-roots.mjs   (məlumat dəyişəndə)
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import { GLOSSARY } from '../src/data/glossary.js'
import { decodeLocations } from '../src/utils/quranRoots.js'

const { roots } = JSON.parse(fs.readFileSync('public/data/quran-roots.json', 'utf8'))

const norm = (s) => String(s || '')
  .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/\s+/g, ' ').trim()
const bare = (w) => norm(w).replace(/^ال/, '').replace(/ة$/, 'ه')

// lemma (normallaşdırılmış) → [{ root, count }]
const lemmaRoot = new Map()
const rootTotal = {}
for (const [root, entries] of Object.entries(roots)) {
  let total = 0
  for (const [lemma, , , enc] of entries) {
    const n = decodeLocations(enc).length
    total += n
    const k = bare(lemma)
    if (!lemmaRoot.has(k)) lemmaRoot.set(k, [])
    lemmaRoot.get(k).push({ root, n })
  }
  rootTotal[root] = total
}

const out = {}
let hit = 0
for (const g of GLOSSARY) {
  if (!g.ar || !g.id) continue
  // Yalnız tək söz: birləşmələrdə əsas söz həmişə birinci deyil ("ليلة القدر" → قدر, ليل yox)
  if (norm(g.ar).includes(' ')) continue
  const cands = [bare(g.ar)]
  let best = null
  for (const c of cands) {
    const list = lemmaRoot.get(c)
    if (list) { best = list.slice().sort((a, b) => b.n - a.n)[0]; break }
  }
  if (!best) continue
  hit++
  out[g.id] = [best.root, rootTotal[best.root]]
}

const body = `// AVTOMATİK YARADILIR: scripts/build-glossary-roots.mjs — əl ilə redaktə etmə.
// Lüğət termini (id) → [Quran kökü, kökün Quranda işlənmə sayı]. Mənbə: public/data/quran-roots.json
// (Quranic Arabic Corpus morfologiyası). Yalnız lemması Quranda olan terminlər.
export const GLOSSARY_ROOTS = ${JSON.stringify(out, null, 0).replace(/\],"/g, '],\n  "').replace(/^\{/, '{\n  ').replace(/\}$/, '\n}')}
`
fs.writeFileSync('src/data/glossaryRoots.js', body)
console.log(`✓ ${hit} / ${GLOSSARY.length} termin Quran köküylə tutuşdu`)
