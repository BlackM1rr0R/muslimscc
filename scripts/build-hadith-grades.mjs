#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Hədis dərəcələri — src/data/hadithGrades.js yaradır
//
//   node scripts/build-hadith-grades.mjs
//
// NƏ: src/data/hadiths.js-də sünən istinadlı (Tirmizi / Əbu Davud / İbn Macə /
// Nəsai + nömrə) hədisləri fawazahmed0/hadith-api (Unlicense) ərəb nəşrləri
// ilə tutuşdurur və həmin rəvayətə hədis alimlərinin verdiyi hökmləri
// (Al-Albani, Zubair Ali Zai, Ahmad Shakir …) OLDUĞU KİMİ yazır — hədis
// kitabxanası (/hadith-library) ilə eyni mənbə.
// QAYDA: hökm yalnız ərəb mətni tutuşanda yazılır (nömrədəki mətn bizim
// ərəbcə hissəni ≥85% söz üzrə ehtiva etməlidir). Tutuşmayan (nömrə başqa
// hədisə düşür, mətn məna ilə verilib) hədisə heç nə yazılmır — saytda
// "dərəcə göstərilməyib" qalır. Heç bir hökm hesablanmır və ya uydurulmur.
// OVERRIDES: datasetin "Al-Albani" sütununda bizim yoxladığımız xətalar —
// Albaninin öz kitabındakı hökm (istinadla) yazılır.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions'
const BOOK = { 'Tirmizi': 'tirmidhi', 'Əbu Davud': 'abudawud', 'İbn Macə': 'ibnmajah', 'Nəsai': 'nasai', 'Nasai': 'nasai' }

// Albaninin datasetdə səhv düşmüş hökmləri — [kitab, nömrə] → düzgün hökm
const OVERRIDES = {
  // «طلب العلم فريضة على كل مسلم» — Səhih İbn Macə 184 (əlavəsiz), Səhih əl-Cami 3913
  'ibnmajah:224': { grade: 'Sahih', note: 'Sahih Ibn Majah 184' },
  // «أهل القرآن أهل الله وخاصته» — Səhih İbn Macə 179, Səhih əl-Cami 2165
  'ibnmajah:215': { grade: 'Sahih', note: 'Sahih Ibn Majah 179' },
  // «التائب من الذنب كمن لا ذنب له» — Səhih İbn Macə 3427, Səhih əl-Cami 3008
  'ibnmajah:4250': { grade: 'Hasan', note: 'Sahih Ibn Majah 3427' },
}

// Mətni tutuşan, amma ərəbcəmiz qısaldılmış olduğu üçün 85%-dən aşağı düşənlər —
// əl ilə yoxlanılıb (nömrədəki rəvayət eyni hədisdir)
const MANUAL_OK = new Set(['tirmidhi:2647', 'abudawud:2042'])

const norm = (s) => String(s || '')
  .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
  .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim()
function score(frag, text) {
  const t = norm(text)
  const w = norm(frag).split(' ').filter(x => x.length > 1)
  if (!w.length) return 0
  if (t.includes(norm(frag))) return 1
  return w.filter(x => t.includes(x)).length / w.length
}

async function edition(book) {
  const cache = path.join(ROOT, 'node_modules', '.cache', 'hadith-grades', `ara-${book}.json`)
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8')).hadiths
  const r = await fetch(`${BASE}/ara-${book}.min.json`)
  if (!r.ok) throw new Error(`${book}: HTTP ${r.status}`)
  const txt = await r.text()
  fs.mkdirSync(path.dirname(cache), { recursive: true })
  fs.writeFileSync(cache, txt)
  return JSON.parse(txt).hadiths
}

// RAW (bütün sahələrlə) — hadiths.js-dən çıxarılır
const src = fs.readFileSync(path.join(ROOT, 'src/data/hadiths.js'), 'utf8')
const tmp = path.join(ROOT, 'node_modules', '.cache', 'hadith-grades', 'raw.mjs')
fs.mkdirSync(path.dirname(tmp), { recursive: true })
fs.writeFileSync(tmp, src.slice(src.indexOf('const RAW'), src.indexOf('// Hər dil üçün')).replace('const RAW =', 'export default'))
const { default: RAW } = await import(pathToFileURL(tmp).href)

const books = {}
for (const b of new Set(Object.values(BOOK))) books[b] = await edition(b)

const out = {}
let matched = 0, skipped = 0
for (const h of RAW) {
  const m = String(h.source || '').match(/^(Tirmizi|Əbu Davud|İbn Macə|Nəsai|Nasai) (\d+)\b/)
  if (!m) continue
  const book = BOOK[m[1]], num = +m[2], key = `${book}:${num}`
  const at = books[book].find(x => x.hadithnumber === num)
  if (!at || (score(h.ar, at.text) < 0.85 && !MANUAL_OK.has(key))) { skipped++; continue }
  let grades = (at.grades || []).filter(g => g?.name && g?.grade && String(g.grade).trim() !== '-')
    .map(g => [g.name.trim(), String(g.grade).trim()])
  const ov = OVERRIDES[key]
  if (ov) grades = grades.map(([n, g]) => (n === 'Al-Albani' ? [n, ov.grade, ov.note] : [n, g]))
  if (!grades.length) { skipped++; continue }
  out[h.id] = grades
  matched++
}

// ── 2-ci addım (v5.4): heç bir dərəcəsi olmayan hədislər → HadeethEnc.com ──
// Rəsmi Hədis Ensiklopediyası API-si (sayt onu /hadeethenc bölməsində də
// işlədir). Kök bölmələrin siyahısı (id + ərəb mətni) bir dəfə yığılır, bizim
// ərəbcə hissə başlığın içində ≥90% söz üzrə tapılırsa həmin hədisin hökmü
// (grade) OLDUĞU KİMİ götürülür: ['HadeethEnc', 'صحيح', 'he:<id>'].
// Sorğular arası fasilə, nəticə keşdə (node_modules/.cache) — xidməti yükləmirik.
const { gradeOf } = await import(pathToFileURL(path.join(ROOT, 'src/utils/hadithGrade.js')).href)
const HE = 'https://hadeethenc.com/api/v1'
const HE_CACHE = path.join(ROOT, 'node_modules', '.cache', 'hadith-grades', 'he')
fs.mkdirSync(HE_CACHE, { recursive: true })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function heGet(rel) {
  const f = path.join(HE_CACHE, rel.replace(/[^\w]+/g, '_') + '.json')
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  await sleep(350)
  const r = await fetch(`${HE}${rel}`)
  if (!r.ok) throw new Error(`HadeethEnc ${rel}: HTTP ${r.status}`)
  const j = await r.json()
  fs.writeFileSync(f, JSON.stringify(j))
  return j
}
// Qısa parça ("رمضان شهر الله") başqa hədisin içində də tapılır — ən az 5 söz;
// 8 sözdən azdırsa ifadə BÜTÖV keçməlidir, çoxdursa ≥90% söz (yazılış fərqi)
const wc = (s) => norm(s).split(' ').filter(w => w.length > 1).length
const need = RAW.filter(h => !out[h.id] && !gradeOf(h, out).g && wc(h.ar) >= 5)
let heMatched = 0
if (need.length && !process.argv.includes('--no-he')) {
  const roots = (await heGet('/categories/roots/?language=ar')).map(c => c.id)
  const titles = new Map()
  for (const cid of roots) {
    for (let page = 1; ; page++) {
      const l = await heGet(`/hadeeths/list/?language=ar&category_id=${cid}&page=${page}&per_page=100`)
      for (const x of l.data || []) titles.set(x.id, x.title)
      if (page >= Number(l.meta?.last_page || 1)) break
    }
  }
  console.log(`HadeethEnc: ${titles.size} hədis siyahısı, ${need.length} dərəcəsiz hədis yoxlanır`)
  for (const h of need) {
    let best = null
    for (const [id, title] of titles) {
      const whole = norm(title).includes(norm(h.ar))
      const s = whole ? 1 : (wc(h.ar) >= 8 ? score(h.ar, title) : 0)
      if (s >= 0.9 && (!best || s > best.s)) best = { id, s }
    }
    if (!best) continue
    const one = await heGet(`/hadeeths/one/?language=ar&id=${best.id}`)
    const grade = String(one?.grade || '').trim()
    if (!grade) continue
    out[h.id] = [['HadeethEnc', grade, `he:${best.id}`]]
    heMatched++
  }
}

const header = `// ═══════════════════════════════════════════════════════
// AVTOMATİK YARADILIB — scripts/build-hadith-grades.mjs (əl ilə dəyişməyin)
// Sünən hədislərinə hədis alimlərinin hökmləri, fawazahmed0/hadith-api
// (Unlicense) ərəb nəşrlərindən OLDUĞU KİMİ: { hədis id: [[alim, hökm, qeyd?], …] }
// Yalnız ərəb mətni tutuşan rəvayətlər. Oxuyan: src/utils/hadithGrade.js
// Digər kitablar (Təbərani, Beyhəqi, Hakim …): HadeethEnc.com hökmü —
// [['HadeethEnc', hökm, 'he:<id>']] (2-ci addım; mənbə hadeethenc.com/ar/browse/hadith/<id>)
// ═══════════════════════════════════════════════════════
`
const body = 'export const SUNAN_GRADES = {\n' +
  Object.entries(out).map(([id, g]) => `  ${id}: ${JSON.stringify(g)},`).join('\n') + '\n}\n'
fs.writeFileSync(path.join(ROOT, 'src/data/hadithGrades.js'), header + body)
console.log(`hadithGrades.js: ${matched} sünən hədisi, ${heMatched} HadeethEnc, ${skipped} sünəndə tutuşmadı`)
