// Quranın yazı tarixi qat-qat (ScriptLayers): Fatihə 1:1–7, İxlas 112:1–4 → public/data/script-layers.json
// Mənbə: seo-data/quran/quran-uthmani.json — saytın oxuyucusunun işlətdiyi Osmani mətni.
// Mətn hərfi-hərfinə köçürülür; yalnız saytın öz göstərmə qaydası (utils/quranText.js → displayAyah:
// Fatihə 1:1-dəki BOM atılır, 112:1-də təkrar Bəsmələ gizlənir) tətbiq olunur — QuranPage ilə eyni.
import fs from 'node:fs'
import path from 'node:path'
import { displayAyah } from '../src/utils/quranText.js'

const SRC = 'seo-data/quran/quran-uthmani.json', OUT = 'public/data/script-layers.json'
const PICK = [{ surah: 1, from: 1, to: 7 }, { surah: 112, from: 1, to: 4 }]
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'))
const ayahs = []
for (const { surah, from, to } of PICK) {
  for (let a = from; a <= to; a++) {
    const raw = data.ayahs[surah - 1][a - 1]
    if (!raw) throw new Error(`yoxdur: ${surah}:${a}`)
    ayahs.push({ ref: `${surah}:${a}`, surah, ayah: a, text: displayAyah(raw, surah, a - 1) })
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify({ edition: data.edition?.identifier || 'quran-uthmani', ayahs }))
console.log('ok', ayahs.length, 'ayə →', OUT)
