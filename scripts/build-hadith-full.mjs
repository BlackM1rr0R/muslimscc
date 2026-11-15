#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Hədislərin TAM mətni + ravi — public/data/hadith-full/<id>.json yaradır
//
//   node scripts/build-hadith-full.mjs
//
// NƏ: src/data/hadiths.js-dəki hədis (Buxari / Muslim / Tirmizi / Əbu Davud /
// İbn Macə / Nəsai + nömrə) fawazahmed0/hadith-api (Unlicense) nəşrlərində
// tapılır və həmin rəvayətin TAM ərəb mətni (isnadla), ingilis, türk və rus
// (varsa) tərcümələri OLDUĞU KİMİ yazılır. Ravi (səhabə) ingilis nəşrinin
// "Narrated X:" / "X reported" başlığından götürülür.
// QAYDA (hadithGrades ilə eyni): yalnız ərəb mətni tutuşanda (nömrədəki mətn
// bizim ərəbcə hissəni ≥85% söz üzrə ehtiva edir). Fəsil+nömrə istinadları
// ("Buxari, İman 3") kitabın bütün mətnində axtarılır — ifadə BÜTÖV keçməli
// və ən az 6 söz olmalıdır; istinad (kitab + nömrə) faylda göstərilir ki,
// tam mətnin hansı rəvayətdən olduğu aydın olsun.
// Heç bir mətn tərcümə olunmur, qısaldılmır və ya dəyişdirilmir.
// Azərbaycan dilində tam tərcümə mənbəsi yoxdur — saytda türkcə/ingiliscə
// tam mətn mənbə adı ilə göstərilir.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions'
const BOOK = { 'Buxari': 'bukhari', 'Muslim': 'muslim', 'Tirmizi': 'tirmidhi', 'Əbu Davud': 'abudawud', 'İbn Macə': 'ibnmajah', 'Nəsai': 'nasai', 'Nasai': 'nasai' }
const LANGS = { bukhari: ['eng', 'tur', 'rus'], muslim: ['eng', 'tur', 'rus'], abudawud: ['eng', 'tur', 'rus'], tirmidhi: ['eng', 'tur'], ibnmajah: ['eng', 'tur'], nasai: ['eng', 'tur'] }
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'hadith-full')
const OUT = path.join(ROOT, 'public', 'data', 'hadith-full')

const norm = (s) => String(s || '')
  .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
  .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim()
function score(frag, text) {
  const t = norm(text)
  const w = norm(frag).split(' ').filter(x => x.length > 1)
  if (!w.length) return 0
  if (t.includes(norm(frag))) return 1
  return w.filter(x => t.includes(x)).length / w.length
}

async function edition(name) {
  const f = path.join(CACHE, `${name}.json`)
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')).hadiths
  const r = await fetch(`${BASE}/${name}.min.json`)
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`)
  const txt = await r.text()
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(f, txt)
  return JSON.parse(txt).hadiths
}

// İngilis nəşrinin başlığından ravi: "Narrated Abu Huraira:", "Abu Huraira reported…",
// "It was narrated from Abu Hurairah that…", "It is narrated on the authority of …"
export function narratorOf(en) {
  const s = String(en || '').replace(/\s+/g, ' ').trim()
  const pats = [
    /^Narrated ([^:]{2,60}?)\s*:/,
    /^It (?:was|is) narrated (?:from|on the authority of|that) ([A-Z][^,:]{2,50}?)(?: that| who said| said|,|:)/,
    /^([A-Z][A-Za-z'`. -]{2,50}?) (?:reported|narrated|said)\b/,
  ]
  for (const p of pats) {
    const m = s.match(p)
    if (m) {
      const n = m[1].replace(/\s*\(.*$/, '').replace(/[.,;]+$/, '').trim()
      if (n && !/^(the|a|an|he|she|it|we|they|i|allah|messenger)\b/i.test(n)) return n
    }
  }
  return null
}

// RAW (bütün sahələrlə) — hadiths.js-dən
const src = fs.readFileSync(path.join(ROOT, 'src/data/hadiths.js'), 'utf8')
const tmp = path.join(CACHE, 'raw.mjs')
fs.mkdirSync(CACHE, { recursive: true })
fs.writeFileSync(tmp, src.slice(src.indexOf('const RAW')).replace('const RAW =', 'export const RAW ='))
const { RAW } = await import(pathToFileURL(tmp).href)

const { parseIsnad } = await import(pathToFileURL(path.join(ROOT, 'src/utils/isnad.js')).href)
const { narratorIds } = await import(pathToFileURL(path.join(ROOT, 'src/data/hadithNarrators.js')).href)
const ara = {}, tr = {}
for (const b of new Set(Object.values(BOOK))) {
  // Muslim: ara-muslim1-də arabicnumber = Fuad Abdulbaqi nömrəsi (35.01) — bizim istinadlar onunladır
  ara[b] = await edition(b === 'muslim' ? 'ara-muslim1' : `ara-${b}`)
  tr[b] = {}
  for (const l of LANGS[b]) tr[b][l] = new Map((await edition(`${l}-${b}`)).map(x => [x.hadithnumber, x.text]))
}
const wc = (s) => norm(s).split(' ').filter(w => w.length > 1).length

// ── HadeethEnc.com (rəsmi Hədis Ensiklopediyası) — Azərbaycan dilində RƏSMİ tam
// tərcümə + şərh. Ərəb başlıqları (id → mətn) build-hadith-grades.mjs-in keşindən
// və ya API-dən; tutuşma qaydası hadithGrades ilə eynidir: bizim ərəbcə ifadə
// başlığın içində BÜTÖV keçir (və ən az 5 söz), ya da ≥8 sözdə ≥90% söz.
// Tutuşan hədisin az nəşri (varsa) OLDUĞU KİMİ: hədis, mənbə, dərəcə, şərh.
const HE = 'https://hadeethenc.com/api/v1'
const HE_CACHE = path.join(ROOT, 'node_modules', '.cache', 'hadith-grades', 'he')
fs.mkdirSync(HE_CACHE, { recursive: true })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function heGet(rel) {
  const f = path.join(HE_CACHE, rel.replace(/[^\w]+/g, '_') + '.json')
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  await sleep(300)
  const r = await fetch(`${HE}${rel}`)
  const j = r.ok ? await r.json() : null
  fs.writeFileSync(f, JSON.stringify(j))
  return j
}
const heTitles = new Map()
const useHe = !process.argv.includes('--no-he')
if (useHe) {
  for (const c of (await heGet('/categories/roots/?language=ar')) || []) {
    for (let page = 1; ; page++) {
      const l = await heGet(`/hadeeths/list/?language=ar&category_id=${c.id}&page=${page}&per_page=100`)
      for (const x of l?.data || []) heTitles.set(x.id, norm(x.title))
      if (!l || page >= Number(l.meta?.last_page || 1)) break
    }
  }
}
function heMatch(ar) {
  const f = norm(ar), n = wc(ar)
  let best = null
  for (const [id, t] of heTitles) {
    const s = (n >= 5 && t.includes(f)) ? 1 : (n >= 8 ? score(ar, t) : 0)
    if (s >= 0.9 && (!best || s > best.s)) best = { id, s }
  }
  return best?.id || null
}
const clean = (s) => String(s || '').split('\r').join('').trim()
let heAz = 0, heOnly = 0
const heIds = []

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
let byNum = 0, bySearch = 0, miss = 0
const index = {}
const narrators = {}
for (const h of RAW) {
  if (!/\d/.test(String(h.source || ''))) continue
  let hit = null
  // Bütün istinadlar (", " / "; " ilə ayrılmış) — ilk tutuşan
  for (const part of String(h.source).split(/[;,]\s*(?=[A-ZƏİÜÖÇŞĞ])/)) {
    const m = part.trim().match(/^(Buxari|Muslim|Tirmizi|Əbu Davud|İbn Macə|Nəsai|Nasai)\s+(\d+)\b/)
    if (!m) continue
    const book = BOOK[m[1]], num = +m[2]
    const cands = book === 'muslim' ? ara[book].filter(x => Math.floor(x.arabicnumber) === num) : ara[book].filter(x => x.hadithnumber === num)
    const at = cands.find(x => score(h.ar, x.text) >= 0.85)
    if (at) { hit = { book, at }; byNum++; break }
  }
  if (!hit) {
    // "Buxari, İman 3" kimi — kitabda bütöv ifadə axtarışı
    const m = String(h.source).match(/^(Buxari|Muslim|Tirmizi|Əbu Davud|İbn Macə|Nəsai)\b/)
    if (m && wc(h.ar) >= 6 && !/^(Buxari|Muslim|Tirmizi|Əbu Davud|İbn Macə|Nəsai)\s+\d/.test(h.source)) {
      const book = BOOK[m[1]], f = norm(h.ar)
      const at = ara[book].find(x => norm(x.text).includes(f))
      if (at) { hit = { book, at }; bySearch++ }
    }
  }
  let o = null
  if (hit) {
    const { book, at } = hit
    const n = at.hadithnumber
    // ref: [kitab, nəşr nömrəsi, göstərilən nömrə] — Muslim üçün Abdulbaqi nömrəsi
    o = { ref: [book, n, book === 'muslim' && at.arabicnumber ? String(Math.floor(at.arabicnumber)) : String(n)], ar: at.text.trim() }
    for (const l of LANGS[book]) {
      const t = tr[book][l].get(n)
      if (t && t.trim()) o[l === 'eng' ? 'en' : l === 'tur' ? 'tr' : 'ru'] = t.trim()
    }
    // İsnad zənciri (src/utils/isnad.js) — əmin olmadıqda yoxdur
    const chain = parseIsnad(o.ar)
    if (chain) o.isnad = chain
    const nar = narratorOf(o.en)
    const nids = nar ? narratorIds(nar) : []
    if (nids.length) o.nid = nids
    else if (nar) narrators[nar] = (narrators[nar] || 0) + 1
  }
  // HadeethEnc — rəsmi az tərcüməsi və şərh
  const heId = useHe ? heMatch(h.ar) : null
  if (heId) {
    const az = await heGet(`/hadeeths/one/?language=az&id=${heId}`)
    if (az?.hadeeth) {
      if (!o) {
        const arOne = await heGet(`/hadeeths/one/?language=ar&id=${heId}`)
        if (!arOne?.hadeeth) { miss++; continue }
        o = { ar: clean(arOne.hadeeth) }
        heOnly++
      }
      o.he = { id: heId, az: clean(az.hadeeth), x: clean(az.explanation), src: clean(az.attribution), g: clean(az.grade) }
      heAz++
      if (o.he.x) heIds.push(h.id)
    }
  }
  if (!o) { miss++; continue }
  fs.writeFileSync(path.join(OUT, `${h.id}.json`), JSON.stringify(o))
  index[h.id] = o.nid ? o.nid.join(',') : ''
}
fs.writeFileSync(path.join(ROOT, 'src/data/hadithFull.js'), `// AVTOMATİK YARADILIB — scripts/build-hadith-full.mjs (əl ilə dəyişməyin)
// Tam mətni olan hədislər: { id: 'ravi açarları' ('' — ravi tanınmadı). Mətn: /data/hadith-full/<id>.json
export const HADITH_FULL = {
${Object.entries(index).map(([k, v]) => `  ${k}: '${v}',`).join('\n')}
}
// Rəsmi Azərbaycan şərhi olan hədislər (HadeethEnc.com) — kartın arxa üzü
export const HADITH_HE_EXPL = new Set(${JSON.stringify(heIds)})
`)
console.log(`hadith-full: nömrə ilə ${byNum}, axtarışla ${bySearch}, HadeethEnc az ${heAz} (yalnız HE ${heOnly}), tapılmadı ${miss}; ravisi tanınmayan ${Object.values(narrators).reduce((a, b) => a + b, 0)}`)
if (process.argv.includes('--narrators')) console.log(Object.entries(narrators).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}\t${k}`).join('\n'))
