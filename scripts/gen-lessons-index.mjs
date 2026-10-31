// ═══════════════════════════════════════════════════════
// src/data/lessons/<slug>.js fayllarının `meta` ixracından:
//   • src/data/lessons/index.js  — LESSONS (yalnız meta; siyahı + SEO üçün)
//   • src/seo/detailSlugs.js     — LESSON_SLUGS bloku (marşrut + sitemap)
// Dərs əlavə edəndən/siləndən sonra: node scripts/gen-lessons-index.mjs
// tests/unit/lessons.test.js indeksin fayllarla eyni olduğunu yoxlayır.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { LESSON_CATS } from '../src/data/lessons/cats.js'

const SKIP = ['index.js', 'cats.js', 'load.js']
const dir = path.resolve('src/data/lessons')
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !SKIP.includes(f))
const metas = []
for (const f of files) {
  const { meta } = await import(pathToFileURL(path.join(dir, f)).href)
  if (!meta || meta.slug !== f.replace(/\.js$/, '')) throw new Error(`${f}: meta.slug fayl adı ilə eyni olmalıdır`)
  if (!LESSON_CATS.some(c => c.key === meta.cat)) throw new Error(`${f}: naməlum kateqoriya ${meta.cat}`)
  metas.push(meta)
}
const catOrder = Object.fromEntries(LESSON_CATS.map((c, i) => [c.key, i]))
metas.sort((a, b) => catOrder[a.cat] - catOrder[b.cat] || (a.order ?? 0) - (b.order ?? 0) || a.slug.localeCompare(b.slug))

const out = `// AVTOMATİK YARADILIB: node scripts/gen-lessons-index.mjs — əl ilə dəyişmə.
// Dərslərin meta məlumatı (siyahı, axtarış, SEO). Mətnlər — ayrı fayllarda (load.js).
export { LESSON_CATS, CAT_BY_KEY } from './cats.js'

export const LESSONS = ${JSON.stringify(metas, null, 1)}

export const lessonBySlug = (slug) => LESSONS.find(l => l.slug === slug) || null
`
fs.writeFileSync(path.join(dir, 'index.js'), out)

const ds = path.resolve('src/seo/detailSlugs.js')
let src = fs.readFileSync(ds, 'utf8')
const RE = /\/\/ Dərslər — [^\n]*\nexport const LESSON_SLUGS = \[[^\]]*\]\n/
const block = `// Dərslər — src/data/lessons/*.js (scripts/gen-lessons-index.mjs yazır)\nexport const LESSON_SLUGS = ${JSON.stringify(metas.map(m => m.slug))}\n`
src = RE.test(src) ? src.replace(RE, block) : src.trimEnd() + '\n\n' + block
fs.writeFileSync(ds, src)
console.log(`${metas.length} dərs → index.js, LESSON_SLUGS`)
