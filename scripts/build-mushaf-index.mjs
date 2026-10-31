#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// MUSHAF CƏDVƏLLƏRİ — node scripts/build-mushaf-index.mjs
//
// 604 səhifəlik Mədinə mushafı üçün kiçik cədvəlləri Quran.com API v4-dən
// alır və src/data/mushafIndex.js-ə yazır:
//   • hər surənin başladığı / bitdiyi səhifə (/chapters → pages)
//   • ərəb və latın adı, ayə sayı, bəsmələnin olub-olmaması
//   • hər cüzün ilk səhifəsi (/verses/by_juz/<n> → ilk ayənin page_number-i)
// Quran mətni BURADA YOXDUR — mətn səhifədə həmişə API-dən yüklənir.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src/data/mushafIndex.js')
const API = 'https://api.quran.com/api/v4'

async function getJson(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
      return await res.json()
    } catch (e) {
      if (i >= tries) throw e
      await new Promise(r => setTimeout(r, 800 * i))
    }
  }
}

const { chapters } = await getJson(`${API}/chapters?language=en`)
if (!Array.isArray(chapters) || chapters.length !== 114) throw new Error('chapters: 114 gözlənilirdi')
chapters.sort((a, b) => a.id - b.id)

const juzStart = []
for (let n = 1; n <= 30; n++) {
  const d = await getJson(`${API}/verses/by_juz/${n}?per_page=1&page=1`)
  const p = d?.verses?.[0]?.page_number
  if (!Number.isInteger(p)) throw new Error(`juz ${n}: page_number yoxdur`)
  juzStart.push(p)
}

const rows = chapters.map(c => {
  const [start, end] = c.pages
  return `  [${start}, ${end}, ${c.verses_count}, ${c.bismillah_pre ? 1 : 0}, ${JSON.stringify(c.name_arabic)}, ${JSON.stringify(c.name_simple)}],`
})

const src = `// ═══════════════════════════════════════════════════════
// Mədinə mushafı (604 səhifə) — kiçik naviqasiya cədvəlləri.
// AVTOMATİK YARADILIB: node scripts/build-mushaf-index.mjs
// Mənbə: Quran.com API v4 (/chapters, /verses/by_juz). Quran mətni burada yoxdur.
// ═══════════════════════════════════════════════════════
// lang-ok: surə adları ərəbcə və API-nin latın transliterasiyasıdır (dil mətni deyil)

export const MUSHAF_PAGES = 604

// Hər surə: [ilk səhifə, son səhifə, ayə sayı, bəsmələ (1/0), ərəb adı, latın adı]
export const SURAH_TABLE = [
${rows.join('\n')}
]

// Hər cüzün ilk səhifəsi (1…30)
export const JUZ_START_PAGES = [${juzStart.join(', ')}]
`
fs.writeFileSync(OUT, src)
console.log(`yazıldı: ${path.relative(ROOT, OUT)} (${Buffer.byteLength(src)} bayt)`)
