// ═══════════════════════════════════════════════════════
// əl-Təfsir əl-Müyəssər — azərbaycanca tərcümənin fayllara yığılması
//
// Giriş: <dir>/muyassar.json (ərəb əsli, quran.com API 16: { surə: { ayə: mətn } })
//        <dir>/out/c*.json   (tərcümə: { "surə:ayə": "mətn" })
// Çıxış: public/tafsir/az-muyassar/<surə>.json → { "1": "mətn", "67": 66 }
//   rəqəm — ayə əvvəlki ayə ilə birlikdə izah olunub (ərəb əslində qrup kimi).
// İstifadə: node scripts/build-tafsir-az.mjs <dir>
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
if (!dir) { console.error('istifadə: node scripts/build-tafsir-az.mjs <dir>'); process.exit(1) }
const COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]

const arabic = JSON.parse(fs.readFileSync(path.join(dir, 'muyassar.json'), 'utf8'))
const tr = {}
for (const f of fs.readdirSync(path.join(dir, 'out')).filter(f => /^c\d+\.json$/.test(f))) {
  Object.assign(tr, JSON.parse(fs.readFileSync(path.join(dir, 'out', f), 'utf8')))
}

const outDir = path.resolve('public/tafsir/az-muyassar')
fs.mkdirSync(outDir, { recursive: true })
const missing = []
let total = 0
for (let s = 1; s <= 114; s++) {
  const file = {}
  let base = null
  for (let a = 1; a <= COUNTS[s - 1]; a++) {
    if (arabic[s][a] !== undefined) {
      const t = String(tr[`${s}:${a}`] || '').replace(/\s+/g, ' ').trim()
      if (!t) missing.push(`${s}:${a}`)
      file[a] = t
      base = a
      total++
    } else if (base) {
      file[a] = base
    }
  }
  fs.writeFileSync(path.join(outDir, `${s}.json`), JSON.stringify(file))
}
console.log(`yazıldı: ${total} izah, 114 fayl → ${path.relative(process.cwd(), outDir)}`)
if (missing.length) { console.error(`TƏRCÜMƏSİZ: ${missing.length} — ${missing.slice(0, 20).join(' ')}`); process.exit(2) }
