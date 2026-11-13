#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// public/widget.js qurucusu — node scripts/build-widget.mjs
//
// Mənbə: src/widget/widget.src.js (oxunaqlı). Azərbaycan şəhərlərinin
// koordinatları src/data/prayerCities.js-dəki PRAYER_CITIES-dən götürülür
// (country === 'AZ') və yığcam yazılır: 'Ad' + enlik*1e4 + uzunluq*1e4
// (hər biri base36, 4 simvol), ayırıcısız. esbuild (Vite ilə gəlir) sıxır.
// Ölçü 6 KB-dan çoxdursa xəta ilə çıxır.
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'esbuild'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src/widget/widget.src.js')
const OUT = path.join(ROOT, 'public/widget.js')
const LIMIT = 6 * 1024

// prayerLocation.js React/brand importları olduğu üçün birbaşa import edilmir —
// AZ sətirləri mətn kimi oxunur (format sabitdir: { id:'…', country:'AZ', lat:…, lng:… })
const locSrc = fs.readFileSync(path.join(ROOT, 'src/data/prayerCities.js'), 'utf8')
const re = /\{ id:'([^']+)', country:'AZ', lat:(-?[\d.]+), lng:(-?[\d.]+)/g
const enc = (v) => {
  const n = Math.round(Number(v) * 1e4)
  const s = n.toString(36)
  if (n < 0 || s.length !== 4) throw new Error(`koordinat 4 simvola sığmır: ${v}`)
  return s
}
const cities = []
for (const m of locSrc.matchAll(re)) {
  // Vidcet cədvəli böyük hərflərə görə bölür: id = bir böyük hərf + kiçik hərflər
  if (!/^[A-Z][a-z]+$/.test(m[1])) throw new Error(`id formatı uyğun deyil: ${m[1]}`)
  cities.push(m[1] + enc(m[2]) + enc(m[3]))
}
if (cities.length < 50) throw new Error(`AZ şəhərləri tapılmadı (${cities.length})`)

const src = fs.readFileSync(SRC, 'utf8').replace("'@@CITIES@@'", JSON.stringify(cities.join('')))
const { code } = await transform(src, { minify: true, target: 'es2017', charset: 'utf8', legalComments: 'none' })
const banner = '/*! muslims.cc/widget · src/widget/widget.src.js */\n'
const out = banner + code
const size = Buffer.byteLength(out)
fs.writeFileSync(OUT, out)
console.log(`public/widget.js: ${size} bayt, ${cities.length} AZ şəhəri`)
if (size > LIMIT) {
  console.error(`✗ ${LIMIT} baytdan böyükdür`)
  process.exit(1)
}
