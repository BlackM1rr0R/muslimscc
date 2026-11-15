#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// "Günün hədisi" push siyahısı — server/daily-hadith-data.js yaradır
//
//   node scripts/build-daily-hadith.mjs
//
// Serverin Docker obrazına src/ düşmür (server/Dockerfile: COPY *.js), ona görə
// siyahı serverə ayrıca JS kimi yazılır. Seçim: yalnız SƏHİH (Buxari / Muslim —
// utils/hadithGrade.js → gradeOf), saytda öz səhifəsi olan (/hadith/<id>,
// seo/hadithIds.js) və bildirişə sığan (az mətn ≤ 200 simvol) hədislər.
// Mətnlər saytdakı ilə eynidir (data/hadiths.js), mənbə adı localizeSource ilə.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HADITHS } from '../src/data/hadiths.js'
import { HADITH_IDS } from '../src/seo/hadithIds.js'
import { gradeOf } from '../src/utils/hadithGrade.js'
import { localizeSource } from '../src/utils/sourceNames.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const ids = new Set(HADITH_IDS.map(String))
const by = Object.fromEntries(LANGS.map(l => [l, new Map(HADITHS[l].map(h => [String(h.id), h]))]))

const out = []
for (const h of HADITHS.az) {
  const id = String(h.id)
  if (!ids.has(id) || gradeOf(h).g !== 's') continue
  if (!h.text || h.text.length > 200) continue
  const t = {}, src = {}
  let ok = true
  for (const l of LANGS) {
    const x = by[l].get(id)
    const text = l === 'ar' ? (x?.ar || h.ar) : x?.text
    if (!text) { ok = false; break }
    t[l] = text.trim()
    src[l] = localizeSource(h.source, l)
  }
  if (ok) out.push({ id: Number(id), t, src })
}

const header = `// AVTOMATİK YARADILIB — scripts/build-daily-hadith.mjs (əl ilə dəyişməyin)
// "Günün hədisi" push siyahısı: yalnız səhih (Buxari / Muslim), saytda səhifəsi olan hədislər.
// Mətnlər saytdakı ilə eynidir (src/data/hadiths.js). Oxuyan: server/daily-hadith.js
'use strict'
`
fs.writeFileSync(path.join(ROOT, 'server', 'daily-hadith-data.js'),
  header + 'module.exports = ' + JSON.stringify(out) + '\n')
console.log(`daily-hadith-data.js: ${out.length} hədis`)
