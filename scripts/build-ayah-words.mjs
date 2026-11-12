// Hər ayənin söz sayı → src/data/ayahWords.js (QuranMosaic, v6.4)
// Mənbə: Tanzil «quran-simple-clean» mətni (api.alquran.cloud/v1/quran/quran-simple-clean).
// Söz = boşluqla ayrılan və ən azı bir hərfi olan hissə (vəqf işarələri sayılmır).
// API surələrin 1-ci ayəsinin əvvəlinə bəsmələ qoşur
// (Fatihə və Tövbədən başqa) — o, ayənin özü deyil, ona görə çıxarılır.
// Quran mətni fayla yazılmır — yalnız rəqəmlər.
import { writeFileSync } from 'node:fs'

const BASMALA = 'بسم الله الرحمن الرحيم'
const res = await fetch('https://api.alquran.cloud/v1/quran/quran-simple-clean')
const { data } = await res.json()
const counts = []
for (const s of data.surahs) {
  for (const a of s.ayahs) {
    let text = a.text.replace(/^﻿/, '').trim()
    if (a.numberInSurah === 1 && s.number !== 1 && s.number !== 9 && text.startsWith(BASMALA)) text = text.slice(BASMALA.length).trim()
    counts.push(text.split(/\s+/).filter(w => /[ء-يٱ-ۓ]/.test(w)).length)
  }
}
if (counts.length !== 6236) throw new Error(`ayə sayı ${counts.length}`)
const out = `// AVTOMATİK — scripts/build-ayah-words.mjs. Hər ayənin söz sayı (6236 rəqəm, oxu sırası ilə).
// Mənbə: Tanzil «quran-simple-clean» (api.alquran.cloud); söz = boşluqla ayrılan, hərfi olan hissə (vəqf işarələri yox);
// surə əvvəlindəki bəsmələ sayılmır (Fatihədə ayədir — sayılır).
export const AYAH_WORDS = '${counts.join(',')}'.split(',').map(Number)
`
writeFileSync('src/data/ayahWords.js', out)
console.log('ok', counts.length, Math.max(...counts), counts.reduce((x, y) => x + y))
