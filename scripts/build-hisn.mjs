// ═══════════════════════════════════════════════════════
// Hisnul-Müslim — tərcümə fayllarından sayt məlumatı
//
// Giriş: <dir>/out/h*.json — fəsillər: { id, title:{ar,az,en,ru,tr},
//        items:[{ ar, repeat, text:{az,en,ru,tr}, src:{ar,az,en,ru,tr} }] }
//        (ərəb mətni və təxric: "Hisnul-Müslim", Səid əl-Qəhtani)
// Çıxış: public/data/hisn/<dil>.json → { chapters:[{ id, title, titleAr,
//        items:[{ ar, text, src, repeat }] }] } — səhifə yalnız öz dilini yükləyir.
// İstifadə: node scripts/build-hisn.mjs <dir>
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
if (!dir) { console.error('istifadə: node scripts/build-hisn.mjs <dir>'); process.exit(1) }
const LANGS = ['az', 'en', 'ru', 'ar', 'tr']

const files = fs.readdirSync(path.join(dir, 'out')).filter(f => /^h\d+\.json$/.test(f)).sort()
const chapters = files.flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, 'out', f), 'utf8')))
  .sort((a, b) => a.id - b.id)
  // 0 — müəllifin müqəddiməsi: zikr deyil, siyahıdan kənarda qalır
  .filter(c => c.id !== 0)

const outDir = path.resolve('public/data/hisn')
fs.mkdirSync(outDir, { recursive: true })
for (const lang of LANGS) {
  const data = {
    chapters: chapters.map(c => ({
      id: c.id,
      title: lang === 'ar' ? c.title.ar : c.title[lang],
      titleAr: c.title.ar,
      items: c.items.map(it => ({
        ar: it.ar.trim(),
        ...(lang === 'ar' ? {} : { text: String(it.text[lang] || '').trim() }),
        src: String((lang === 'ar' ? it.src.ar : it.src[lang]) || '').trim(),
        ...(it.repeat > 1 ? { repeat: it.repeat } : {}),
      })),
    })),
  }
  const empty = data.chapters.flatMap(c => [c.title, ...c.items.map(i => i.text ?? 'x')]).filter(v => !v).length
  if (empty) { console.error(`${lang}: ${empty} boş sahə`); process.exit(2) }
  fs.writeFileSync(path.join(outDir, `${lang}.json`), JSON.stringify(data))
}
const n = chapters.reduce((a, c) => a + c.items.length, 0)
console.log(`${chapters.length} fəsil, ${n} zikr → public/data/hisn/{${LANGS.join(',')}}.json`)
