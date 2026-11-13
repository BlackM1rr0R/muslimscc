// Uşaq adları (v6.6): Quranda XÜSUSİ AD kimi keçən adların sayı və ilk ayəsi → src/data/nameQuran.js
// Mənbə: seo-data/quran/quran-uthmani.json (saytın Osmani mətni). Hərəkələr çıxarılır, ٰ → ا, həmzəli əliflər → ا;
// kiçik ya (ۦ ۧ) → ي; sözün əvvəlindəki və/fə + bi/li/kə/yə (müraciət) ön ekləri ayrılır; tənvinli təsirlik (نوحًا) da sayılır.
// Yalnız aşağıdakı adlar (peyğəmbərlər, Məryəm, Muhəmməd/Əhməd, Ramazan ayı) — sifət kimi işlənən adlar
// (Saleh, Əli, Kərim …) sayılmır, çünki Quranda onlar ad deyil, sözdür.
import fs from 'node:fs'
import { SAHABA } from '../src/data/sahaba.js'
import { SAHABA_SLUGS } from '../src/seo/detailSlugs.js'
import { NAMES } from '../src/data/arabicNames.js'

const PROPER = ['محمد', 'أحمد', 'إبراهيم', 'يوسف', 'إسماعيل', 'إسحاق', 'يعقوب', 'موسى', 'عيسى', 'هارون', 'داود', 'سليمان', 'يونس', 'إلياس', 'إدريس', 'نوح', 'آدم', 'زكريا', 'يحيى', 'أيوب', 'شعيب', 'لقمان', 'عمران', 'مريم', 'رمضان']
export const norm = (w) => w.replace(/[ۦۧ]/g, 'ي').replace(/[ً-ٟۖ-ۭـ]/g, '').replace(/ٰ/g, 'ا').replace(/[ٱإأآ]/g, 'ا').replace(/^ءا/, 'ا').replace(/ء(?=ا)/g, '')
const uth = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
// Eyni yazılışlı FELLƏR (ad deyil): يَحْيَىٰ — "yaşayır" (8:42, 20:74, 87:13), يُحْيِىَ — "diriltmək" (46:33, 75:40)
const NOT_NAME = { 'يحيى': ['8:42', '20:74', '87:13', '46:33', '75:40'] }
const PRE = /^(?:[وف])?(?:يا|[بلك])?/
const out = {}
for (const name of PROPER) {
  const n = norm(name)
  let count = 0, first = null
  uth.ayahs.forEach((ayahs, si) => ayahs.forEach((txt, ai) => {
    for (const raw of txt.split(/\s+/)) {
      const w = norm(raw)
      const m = w.match(PRE)[0]
      const rest = [w, w.slice(m.length)]
      if (rest.some(r => r === n || r === n + 'ا') && !NOT_NAME[name]?.includes(`${si + 1}:${ai + 1}`)) { count++; first ??= `${si + 1}:${ai + 1}` }
    }
  }))
  out[name] = [count, first]
}
// Bu adı daşıyan səhabələr (saytın /sahaba bölməsindən): adın ilk sözü eyni olanlar → [slug, …]
const sah = {}
for (const [ar] of NAMES) {
  const hits = SAHABA.filter(x => norm(x.name.ar.split(' ')[0]) === norm(ar)).map(x => SAHABA_SLUGS[x.id - 1]).filter(Boolean)
  if (hits.length) sah[ar] = hits
}
console.log('səhabə:', Object.keys(sah).length, sah)
const sahBody = Object.entries(sah).map(([k, v]) => `  '${k}': [${v.map(x => `'${x}'`).join(', ')}],`).join(String.fromCharCode(10))
const body = Object.entries(out).map(([k, [c, f]]) => `  '${k}': [${c}, '${f}'],`).join('\n')
fs.writeFileSync('src/data/nameQuran.js', `// Avtomatik yaradılır: scripts/build-name-quran.mjs (seo-data/quran/quran-uthmani.json). Əl ilə redaktə etmə.
// Ad → [Quranda xüsusi ad kimi neçə dəfə keçir, ilk ayə]
export const NAME_QURAN = {
${body}
}

// Ad → bu adı daşıyan səhabələrin /sahaba/<slug> ünvanları
export const NAME_SAHABA = {
${sahBody}
}
`)
console.log(out)
