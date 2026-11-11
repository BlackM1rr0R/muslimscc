#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Hisnul-Müslim duaları üçün səs xəritəsi — node scripts/build-hisn-audio.mjs
//
// Mənbə: hisnmuslim.com açıq API-si (/api/ar/husn_ar.json, /api/ar/<fəsil>.json) — hər zikrin
// öz səs faylı var (AUDIO: /audio/ar/<id>.mp3). Səslər KOPYALANMIR: sayt onları birbaşa həmin
// serverdən oxudur (mənbə göstərilir). Bu skript yalnız bizim duanı onların zikrinə bağlayır.
// Uyğunluq — ƏRƏB MƏTNİ ilə (fəsil nömrəsinə güvənilmir): hərəkəsiz, normallaşdırılmış mətn
// tam bərabər və ya biri digərinin başlanğıcıdırsa (≥ 25 hərf). Tapılmayan dua səssiz qalır.
// Çıxış: public/data/hisn/audio.json  { "<fəsil id>:<sıra>": <səs id>, "d:<dua id>": <səs id> }
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://www.hisnmuslim.com/api/ar'
const UA = 'Mozilla/5.0 (compatible; muslims.cc build script; +https://muslims.cc)'
const norm = (s) => String(s || '').replace(/^﻿/, '')
  .replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[^ء-ي]/g, '')
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function getJSON(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: { 'user-agent': UA } }); if (r.ok) return JSON.parse((await r.text()).replace(/^﻿/, '')) } catch { /* təkrar */ }
    await sleep(1500)
  }
  throw new Error(`fetch failed: ${url}`)
}

const index = await getJSON(`${API}/husn_ar.json`)
const chapters = Object.values(index)[0]
const theirs = []
for (const ch of chapters) {
  const d = await getJSON(`${API}/${ch.ID}.json`)
  for (const it of Object.values(d)[0] || []) {
    const m = String(it.AUDIO || '').match(/\/audio\/ar\/(\d+)\.mp3$/)
    if (m) theirs.push({ id: Number(m[1]), t: norm(it.ARABIC_TEXT) })
  }
  await sleep(250)
}
const ours = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/hisn/ar.json'), 'utf8'))
const out = {}
let total = 0
for (const ch of ours.chapters) {
  ch.items.forEach((it, i) => {
    total++
    const t = norm(it.ar)
    if (t.length < 6) return
    const hit = theirs.find(x => x.t === t) || theirs.find(x => (x.t.length >= 25 && t.length >= 25) && (x.t.startsWith(t.slice(0, Math.min(t.length, 60))) || t.startsWith(x.t.slice(0, Math.min(x.t.length, 60)))))
    if (hit) out[`${ch.id}:${i}`] = hit.id
  })
}
// Dualar səhifəsi (src/data/duas.js) — eyni qayda ilə, açar "d:<id>"
const { DUAS_DATA } = await import('../src/data/duas.js')
let dTotal = 0, dHit = 0
for (const d of DUAS_DATA) {
  dTotal++
  const t = norm(d.ar)
  if (t.length < 6) continue
  const hit = theirs.find(x => x.t === t) || theirs.find(x => (x.t.length >= 25 && t.length >= 25) && (x.t.startsWith(t.slice(0, Math.min(t.length, 60))) || t.startsWith(x.t.slice(0, Math.min(x.t.length, 60)))))
  if (hit) { out[`d:${d.id}`] = hit.id; dHit++ }
}
fs.writeFileSync(path.join(ROOT, 'public/data/hisn/audio.json'), JSON.stringify(out))
console.log(`✓ Hisnul-Müslim: ${Object.keys(out).length - dHit}/${total}, Dualar: ${dHit}/${dTotal} duaya səs tapıldı (onların ${theirs.length} zikri)`)
