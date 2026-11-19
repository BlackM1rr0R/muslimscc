#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Hisnul-Müslim mənbə (təxric) yoxlaması — public/data/hisn/{ar,en,az,ru,tr}.json
//
//   node scripts/check-hisn-sources.mjs
//
// NƏ YOXLANIR:
//  1. 5 fayl eyni fəsilləri və hər fəsildə eyni sayda bəndi daşıyır.
//  2. Hər bəndin istinad rəqəmləri (cild/səhifə, hədis nömrəsi) 5 dildə eynidir —
//     tərcümə zamanı istinad başqa bəndə keçməyib.
//  3. Sürüşmə əlaməti: ərəb mətnində istinadsız haşiyə (rəqəmsiz src — "… الحديث",
//     "وإذا أمسى قال …") — adətən öz istinadı növbəti bəndə düşüb, hər şey bir bənd sürüşüb
//     (fəsil 29-da belə idi: Müslimə aid olmayan hədis "Müslim 4/2085" göstərirdi).
//     "*" ilə başlayan söz izahları (fəsil 2) istisnadır.
// KNOWN — bilinən istisnalar: "fəsil" və ya "fəsil:bənd" açarı (xəbərdarlıq kimi çap olunur, xəta deyil).
// Mənbə: build-hisn.mjs (yenidən qurulsa, fəsil 29 düzəlişi itə bilər — bu skript tutur).
// tests/unit/hisn-sources.test.js
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const LANGS = ['ar', 'en', 'az', 'ru', 'tr']

// Fəsil 28 (səhər/axşam zikrləri) düzəldilib: axşam variantları ayrıca "src" bəndi kimi düşmüşdü,
// istinadlar 4-cü bənddən sonra sürüşmüşdü — indi hər haşiyə öz bəndindədir (ərəb faylı əsasında).
// 17–25-ci bəndlərin istinadı əvvəl faylda yox idi; indi kitabın eyni nəşrindən hərfi əlavə olunub
// (bənd 1–17 ilə eyni mətn: github.com/rn0x/hisn_almuslim_json, haşiyə 25–34; müəllifin islamhouse
// PDF nəşri ilə tutuşdurulub). 19-cu bənd iki haşiyə daşıyır: "on dəfə" və "tənbəllikdə bir dəfə".
// MISSING_REF — istinadı faylda olmayan bəndlər ({ fəsil: [bənd, …] }); hazırda boşdur.
// Belə bəndə istinad düşsə (sürüşmə) xəta verilir; mənbə uydurulmur.
export const KNOWN = {}
export const MISSING_REF = {}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
// İstinad imzası: "6/ 214", "6/‌214", "2892" → "6/214,2892"
export function refSig(src) {
  const s = String(src || '').replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
  return (s.match(/\d+(?:[\s​-‏]*\/[\s​-‏]*\d+)?/g) || [])
    .map((x) => x.replace(/[^\d/]/g, '')).join(',')
}

export function loadHisn(root = ROOT) {
  const out = {}
  for (const l of LANGS) out[l] = JSON.parse(fs.readFileSync(path.join(root, 'public', 'data', 'hisn', `${l}.json`), 'utf8'))
  return out
}

export function checkHisn(data, { known: knownMap = KNOWN, missingRef = MISSING_REF } = {}) {
  const errors = []
  const warnings = []
  const ar = data.ar.chapters
  for (const l of LANGS.slice(1)) {
    const ids = data[l].chapters.map((c) => c.id).join(',')
    if (ids !== ar.map((c) => c.id).join(',')) errors.push(`${l}: fəsil siyahısı ərəb faylı ilə eyni deyil`)
  }
  for (const c of ar) {
    c.items.forEach((it, i) => {
      const known = knownMap[`${c.id}:${i + 1}`] || knownMap[c.id]
      const report = (msg) => (known ? warnings : errors).push(`fəsil ${c.id}: ${msg}`)
      const sig = refSig(it.src)
      for (const l of LANGS.slice(1)) {
        const lc = data[l].chapters.find((x) => x.id === c.id)
        if (!lc || lc.items.length !== c.items.length) {
          if (i === 0) errors.push(`fəsil ${c.id}: ${l} bənd sayı ${lc ? lc.items.length : 0} ≠ ${c.items.length}`)
          continue
        }
        const ls = refSig(lc.items[i].src)
        if (ls !== sig) errors.push(`fəsil ${c.id} bənd ${i + 1}: ${l} istinadı "${ls}" ≠ ərəb "${sig}"`)
      }
      // MISSING_REF bəndinə istinad düşübsə — ya sürüşmə qayıdıb, ya sahibi mənbə əlavə edib (siyahını yenilə)
      if ((missingRef[c.id] || []).includes(i + 1) && sig) errors.push(`fəsil ${c.id} bənd ${i + 1}: MISSING_REF-dədir, amma istinad "${sig}" var`)
      const src = String(it.src || '').trim()
      if (src && !sig && !src.startsWith('*')) report(`bənd ${i + 1}: istinadsız haşiyə — sürüşmə ehtimalı ("${src.slice(0, 50)}…")`)
    })
  }
  return { errors, warnings }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { errors, warnings } = checkHisn(loadHisn())
  for (const w of warnings) console.warn('⚠ ' + w)
  for (const e of errors) console.error('✗ ' + e)
  if (errors.length) process.exit(1)
  console.log(`✓ Hisn mənbələri: 5 dil uyğundur${warnings.length ? ` (${warnings.length} bilinən xəbərdarlıq, KNOWN)` : ''}`)
}
