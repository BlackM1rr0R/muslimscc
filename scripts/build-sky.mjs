#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Planetari məlumatı — public/data/sky/sky.json
//
//   node scripts/build-sky.mjs
//
// Mənbə: d3-celestial (BSD-3) data/stars.6.json — HYG ulduz bazası (CC BY-SA),
// və data/constellations.lines.json (bürc xətləri). Saxlanılır: mag ≤ 5.2
// ulduzlar [ra°, dec°, mag, B−V] və bürc xətləri. Ad/ərəb adı saytın öz
// siyahısındandır (src/data/brightStars.js, src/data/starNamesAr.js).
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data'
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'sky')

async function get(name) {
  const f = path.join(CACHE, name)
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  const r = await fetch(`${BASE}/${name}`)
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`)
  const t = await r.text()
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(f, t)
  return JSON.parse(t)
}

const ra = (x) => +(((x % 360) + 360) % 360).toFixed(3)
const stars = (await get('stars.6.json')).features
  .filter(f => f.properties.mag <= 5.2)
  .map(f => [ra(f.geometry.coordinates[0]), +f.geometry.coordinates[1].toFixed(3), +f.properties.mag.toFixed(2), +(Number(f.properties.bv) || 0.6).toFixed(2)])
  .sort((a, b) => a[2] - b[2])
const lines = (await get('constellations.lines.json')).features
  .flatMap(f => f.geometry.coordinates.map(l => l.map(([x, y]) => [ra(x), +y.toFixed(2)])))

const out = { src: 'HYG database (CC BY-SA) via d3-celestial (BSD-3)', stars, lines }
fs.mkdirSync(path.join(ROOT, 'public', 'data', 'sky'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'public', 'data', 'sky', 'sky.json'), JSON.stringify(out))
console.log(`sky.json: ${stars.length} ulduz, ${lines.length} xətt`)
