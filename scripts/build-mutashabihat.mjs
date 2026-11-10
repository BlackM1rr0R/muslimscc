#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// ƏKİZ AYƏLƏR (mutəşabihat, söz-söz) — node scripts/build-mutashabihat.mjs
//
// Mənbə: seo-data/quran/quran-uthmani.json (Tanzil Uthmani mətni, repoda; scripts/fetch-quran-seo.mjs).
// Üsul — yalnız mətnin özündən, heç bir şərh/iddia yoxdur:
//   • hər ayə sözlərə bölünür, sözlər normallaşdırılır (utils/hifzSrs → normalizeArabic);
//   • iki ayənin oxşarlığı = ən uzun ortaq söz ardıcıllığı (LCS) / uzun ayənin söz sayı;
//   • ≥ 0.5 (SIM=…) və tam eyni OLMAYAN (ən azı bir söz fərqli) cütlər saxlanır — hafizin qarışdırdığı
//     "demək olar eyni" ayələr; ən azı 4 söz; hər ayəyə ən oxşar 4 cüt.
// Çıxış: public/data/mutashabihat.json  { meta, text: { "s:a": "mətn" }, pairs: { "s:a": [["s:a", oxşarlıq%], …] } }
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeArabic } from '../src/utils/hifzSrs.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo-data/quran/quran-uthmani.json'), 'utf8'))
const MIN_WORDS = 4, MIN_SIM = Number(process.env.SIM || 0.5), TOP = 4

// Bəsmələ (1-ci ayənin əvvəlində, Fatihə və Tövbədən başqa) — müqayisədən çıxarılır
const BASMALA = normalizeArabic('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')
const ayahs = []
src.ayahs.forEach((list, si) => list.forEach((txt, ai) => {
  const s = si + 1, a = ai + 1
  let text = String(txt).replace(/^﻿/, '')
  let words = text.split(/\s+/).map(normalizeArabic).filter(Boolean)
  if (a === 1 && s !== 1 && s !== 9 && words.slice(0, 4).join(' ') === BASMALA) {
    words = words.slice(4); text = text.split(/\s+/).slice(4).join(' ')
  }
  ayahs.push({ k: `${s}:${a}`, s, a, text, words })
}))

const freq = new Map()
for (const x of ayahs) for (const w of new Set(x.words)) freq.set(w, (freq.get(w) || 0) + 1)
// Namizəd seçimi üçün çox işlənən sözlər (و، من، الله…) sayılmır
const COMMON = new Set([...freq].filter(([, n]) => n > 400).map(([w]) => w))
const index = new Map()
ayahs.forEach((x, i) => { for (const w of new Set(x.words)) if (!COMMON.has(w)) { if (!index.has(w)) index.set(w, []); index.get(w).push(i) } })

function lcs(a, b) {
  const m = a.length, n = b.length, dp = new Uint16Array((m + 1) * (n + 1))
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i * (n + 1) + j] = a[i - 1] === b[j - 1] ? dp[(i - 1) * (n + 1) + j - 1] + 1 : Math.max(dp[(i - 1) * (n + 1) + j], dp[i * (n + 1) + j - 1])
  }
  return dp[m * (n + 1) + n]
}

const pairs = {}
let total = 0
ayahs.forEach((x, i) => {
  if (x.words.length < MIN_WORDS) return
  const rare = [...new Set(x.words)].filter(w => !COMMON.has(w))
  if (!rare.length) return
  const cnt = new Map()
  for (const w of rare) for (const j of index.get(w) || []) if (j !== i) cnt.set(j, (cnt.get(j) || 0) + 1)
  const found = []
  for (const [j, c] of cnt) {
    if (c / rare.length < 0.5) continue
    const y = ayahs[j]
    if (y.words.length < MIN_WORDS) continue
    if (Math.min(x.words.length, y.words.length) / Math.max(x.words.length, y.words.length) < MIN_SIM) continue
    const sim = lcs(x.words, y.words) / Math.max(x.words.length, y.words.length)
    if (sim >= MIN_SIM && sim < 1) found.push([y.k, Math.round(sim * 100)])
  }
  if (found.length) {
    found.sort((p, q) => q[1] - p[1])
    pairs[x.k] = found.slice(0, TOP)
    total++
  }
})
const need = new Set(Object.keys(pairs)); Object.values(pairs).forEach(l => l.forEach(([k]) => need.add(k)))
const text = {}
for (const x of ayahs) if (need.has(x.k)) text[x.k] = x.text
const out = {
  meta: {
    source: 'Tanzil Uthmani (quran-uthmani), seo-data/quran',
    method: `LCS of normalised words / longer ayah; >= ${MIN_SIM * 100}% and not identical; >= ${MIN_WORDS} words; top ${TOP}`,
    ayahs: total,
  },
  text, pairs,
}
const file = path.join(ROOT, 'public/data/mutashabihat.json')
fs.writeFileSync(file, JSON.stringify(out))
console.log(`✓ ${total} ayənin əkizi var · ${Object.keys(text).length} ayə mətni · ${(fs.statSync(file).size / 1024).toFixed(0)} KB`)
