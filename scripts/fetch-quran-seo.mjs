// ═══════════════════════════════════════════════════════
// Quran mətnini statik SEO səhifələri üçün BİR DƏFƏ çəkir
//
// NƏ: alquran.cloud-dan (Tanzil mətni + tərcümələr) bütün Quranı nəşr-nəşr
// çəkib seo-data/quran/ altında yığcam JSON kimi saxlayır:
//   meta.json          — 114 surənin ərəbcə adı, ingiliscə adı/mənası,
//                        nazil olma yeri, ayə sayı (/v1/surah)
//   <nəşr>.json        — { edition, ayahs: [[surə 1-in ayələri], …] }
// Üstəlik src/seo/surahSlugs.js — URL slug-ları (ingiliscə addan; tətbiq
// bandlına düşür, cəmi ~1.5 KB).
//
// NİYƏ: scripts/prerender.mjs hər surə səhifəsinin <body>-sinə ərəbcə mətni
// və tərcüməni yazır. Build hər dəfə şəbəkədən asılı olmasın (CI) — məlumat
// repoya commit olunur. Bu fayllar src/-dən import OLUNMUR: klient bandlına
// düşmür, yalnız Node prerender oxuyur.
//
// Mətnə HEÇ BİR dəyişiklik edilmir (yalnız JSON-a yazılır). Bəsmələ və BOM
// qaydası göstərmə zamanı — QuranPage.jsx ilə eyni — tətbiq olunur.
//
// İşə sal (yalnız məlumatı yeniləmək lazım olanda):
//   node scripts/fetch-quran-seo.mjs
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'seo-data', 'quran')
const API = 'https://api.alquran.cloud/v1'

// QuranPage.jsx → EDITION_MAP ilə eyni nəşrlər. Ərəbcə mətn: quran-uthmani
// (tətbiqin istifadə etdiyi ar.alafasy nəşrinin mətni ilə hərfbəhərf eynidir —
// yoxlanılıb; audio sahələri olmadığı üçün yığcamdır).
const EDITIONS = ['quran-uthmani', 'az.mammadaliyev', 'en.asad', 'ru.kuliev', 'tr.diyanet', 'ar.muyassar']

async function getJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      if (d.code !== 200) throw new Error(`API code ${d.code}`)
      return d.data
    } catch (e) {
      if (i === 2) throw e
      await new Promise(res => setTimeout(res, 2000 * (i + 1)))
    }
  }
}

// "Al-Baqara" → "al-baqara", "Aal-i-Imraan" → "aal-i-imraan"
const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

fs.mkdirSync(OUT, { recursive: true })

const list = await getJSON(`${API}/surah`)
if (!Array.isArray(list) || list.length !== 114) throw new Error('surə siyahısı gözlənilən formada deyil')
const meta = list.map(s => ({
  n: s.number, name: s.name, en: s.englishName, enMeaning: s.englishNameTranslation,
  type: s.revelationType, ayahs: s.numberOfAyahs,
}))
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta))
console.log('✓ meta.json')

for (const ed of EDITIONS) {
  const d = await getJSON(`${API}/quran/${ed}`)
  if (d?.edition?.identifier !== ed || d.surahs?.length !== 114) throw new Error(`${ed}: gözlənilməz cavab`)
  const ayahs = d.surahs.map((s, i) => {
    if (s.ayahs.length !== meta[i].ayahs) throw new Error(`${ed}: surə ${i + 1} ayə sayı uyğun deyil`)
    return s.ayahs.map(a => a.text)
  })
  const edition = { identifier: ed, name: d.edition.name, englishName: d.edition.englishName, language: d.edition.language }
  fs.writeFileSync(path.join(OUT, `${ed}.json`), JSON.stringify({ edition, ayahs }))
  console.log(`✓ ${ed}.json`)
}

const slugs = meta.map(s => slugify(s.en))
const header = `// ═══════════════════════════════════════════════════════
// AVTOMATİK YARADILIR: scripts/fetch-quran-seo.mjs — əl ilə redaktə etmə.
// 114 surənin URL slug-u (alquran.cloud-dakı ingiliscə addan):
// /quran/<nömrə>-<slug>. Nömrə həqiqət mənbəyidir — slug yalnız oxunaqlılıq
// üçündür (src/seo/routes.js).
// ═══════════════════════════════════════════════════════
`
fs.writeFileSync(path.join(ROOT, 'src', 'seo', 'surahSlugs.js'),
  `${header}\nexport const SURAH_SLUGS = ${JSON.stringify(slugs, null, 0).replace(/","/g, '", "')}\n`)
console.log('✓ src/seo/surahSlugs.js')

// Surələrin ərəbcə adı, ingiliscə adı/mənası, nazil olma yeri və ayə sayı —
// detal səhifələrinin meta-sı üçün (src/seo/detail.js; tətbiqdə tənbəl chunk)
const rows = meta.map(s => `  [${JSON.stringify(s.name)}, ${JSON.stringify(s.en)}, ${JSON.stringify(s.enMeaning)}, ${JSON.stringify(s.type === 'Medinan' ? 'D' : 'M')}, ${s.ayahs}],`)
fs.writeFileSync(path.join(ROOT, 'src', 'seo', 'surahMeta.js'), `${header.replace(
  /114 surənin URL slug-u[\s\S]*?\(src\/seo\/routes\.js\)\.\n/,
  '114 surə: [ərəbcə ad, ingiliscə ad, ingiliscə məna, M|D (Məkkə/Mədinə), ayə sayı]\n// (alquran.cloud /v1/surah). İndeks = nömrə − 1.\n')}
export const SURAH_META = [
${rows.join('\n')}
]
`)
console.log('✓ src/seo/surahMeta.js')
