#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Tərcümə hissələrini lüğətə birləşdir (əlavə 44 dil)
//   node scripts/merge-i18n-parts.mjs <qovluq>
//   <qovluq>/in/<dil>.json   — ingiliscə yazılar (massiv, extract-ui-strings --missing)
//   <qovluq>/out/<dil>.partN.json — { ingiliscə: tərcümə }
// Yoxlamalar (keçməyən yazı ATILIR, səbəbi çap olunur):
//   açar giriş siyahısındadır; dəyər boş olmayan sətirdir; {0} {1}… yer tutucuları eynidir;
//   ﷺ və ərəb hərfli hissələr itməyib. Mövcud tərcümələrə toxunulmur (yalnız yeni açarlar).
// Lüğət sıralanır (açara görə) — src/i18n/<dil>.json formatı: bir boşluq girinti.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const JOB = process.argv[2]
if (!JOB) { console.error('qovluq lazımdır'); process.exit(1) }

const ph = (s) => (s.match(/\{\d+\}/g) || []).sort().join(',')
// İlk ərəb sözü — çoxsözlü ifadədə (ذَا ٱلْكِفْلِ) birləşdirilmiş sətir boşluq üzündən heç vaxt tapılmırdı
const firstArabic = (s) => (s.match(/[؀-ۿﭐ-﷿ﹰ-﻿]+/) || [''])[0]
const arabic = (s) => (s.match(/[؀-ۿﭐ-﷿ﹰ-﻿]+/g) || []).join('')

let total = 0
for (const f of fs.readdirSync(path.join(JOB, 'in'))) {
  const lang = f.replace(/\.json$/, '')
  const want = new Set(JSON.parse(fs.readFileSync(path.join(JOB, 'in', f), 'utf8')))
  const parts = fs.readdirSync(path.join(JOB, 'out')).filter((p) => p.startsWith(`${lang}.part`) && p.endsWith('.json'))
  const got = {}
  const bad = []
  for (const p of parts) {
    let obj
    try { obj = JSON.parse(fs.readFileSync(path.join(JOB, 'out', p), 'utf8')) } catch (e) { bad.push(`${p}: JSON xətası ${e.message}`); continue }
    for (const [k, v] of Object.entries(obj)) {
      if (!want.has(k)) { bad.push(`naməlum açar: ${k.slice(0, 50)}`); continue }
      // Dil kodları (en-GB) və yalnız yer tutucudan ibarət açarlar ({a} / {b}) lüğətə düşmür — tarix lokalı pozulmasın
      if (/^[a-z]{2,3}(-[A-Za-z]{2,4})*$/.test(k) || !k.replace(/\{[^}]*\}/g, '').replace(/[\s/·:.,–-]/g, '')) continue
      if (typeof v !== 'string' || !v.trim()) { bad.push(`boş: ${k.slice(0, 50)}`); continue }
      if (ph(k) !== ph(v)) { bad.push(`yer tutucu: ${k.slice(0, 50)}`); continue }
      if (k.includes('ﷺ') && !v.includes('ﷺ')) { bad.push(`ﷺ itib: ${k.slice(0, 50)}`); continue }
      if (arabic(k) && !v.includes(firstArabic(k).slice(0, 4))) { bad.push(`ərəb mətni itib: ${k.slice(0, 50)}`); continue }
      got[k] = v
    }
  }
  const dictPath = path.join(ROOT, 'src/i18n', `${lang}.json`)
  const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'))
  let added = 0
  for (const [k, v] of Object.entries(got)) if (!(k in dict)) { dict[k] = v; added++ }
  const sorted = Object.fromEntries(Object.keys(dict).sort().map((k) => [k, dict[k]]))
  fs.writeFileSync(dictPath, JSON.stringify(sorted, null, 1) + '\n')
  total += added
  console.log(`${lang}: +${added} / ${want.size} (hissə: ${parts.length}${bad.length ? `, atıldı: ${bad.length}` : ''})`)
  for (const b of bad.slice(0, 3)) console.log('   ·', b)
}
console.log(`cəmi +${total}`)
