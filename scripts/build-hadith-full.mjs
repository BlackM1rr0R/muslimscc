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
const heAzOk = new Set() // az tərcüməsi olan hədis id-ləri (API-nin translations siyahısı)
const useHe = !process.argv.includes('--no-he')
if (useHe) {
  for (const c of (await heGet('/categories/roots/?language=ar')) || []) {
    for (let page = 1; ; page++) {
      const l = await heGet(`/hadeeths/list/?language=ar&category_id=${c.id}&page=${page}&per_page=100`)
      for (const x of l?.data || []) { heTitles.set(x.id, norm(x.title)); if ((x.translations || []).includes('az')) heAzOk.add(x.id) }
      if (!l || page >= Number(l.meta?.last_page || 1)) break
    }
  }
}
const words = (s) => norm(s).split(' ').filter(w => w.length > 1)
function wordDice(a, b) {
  const A = words(a), B = words(b)
  if (!A.length || !B.length) return 0
  const m = new Map(); for (const w of B) m.set(w, (m.get(w) || 0) + 1)
  let i = 0; for (const w of A) if (m.get(w) > 0) { i++; m.set(w, m.get(w) - 1) }
  return 2 * i / (A.length + B.length)
}
// Mərhələ 1 (köhnə qayda, DƏYİŞMƏYİB): ifadə başlığa bütöv keçir (≥5 söz) ya da ≥8 sözdə ≥90% söz. BÜTÜN başlıqlar
// arasında ən yaxşı seçilir; ən yaxşının az nəşri yoxdursa MATÇ YOXDUR (az olan daha zəif variantına keçmək
// "قام رمضان" → "صام رمضان" kimi fərqli hədislərə səbəb olur).
// Mərhələ 2 (yeni, yalnız az nəşri OLAN hədislər arasında; birmənalı olmalıdır — bərabər uyğun 2+ id varsa BURAXILIR):
//   a) normallaşdırılmış mətn başlıqla EYNİDİR (≥2 söz); b) ifadə başlığın içindədir (≥3 söz) və başlıq ifadədən
//   çox uzun deyil (≤1.5n+1 söz); c) nömrə ilə təsdiqlənmiş hadith-api rəvayətində (at) başlığın BÜTÜN sözləri
//   var və söz Dice ≥0.85.
// Rəvayətçi (səhabə) uyğunluğu — hər iki mərhələ üçün: HadeethEnc ərəb mətninin "رضي الله عنه"-dən əvvəlki adı
// nömrə ilə təsdiqlənmiş hadith-api mətnində də keçməlidir (məs. "لا ضرر": Übadə/İbn Abbas ≠ Əbu Səid).
const NAME_STOP = new Set(['عن', 'ابن', 'بن', 'ابي', 'ابو', 'عبد', 'الله', 'ام', 'ابا', 'حدثنا', 'قال', 'ان', 'رسول'])
// at.text-in səhabə hissəsi: "…، عن X، أن رسول الله" → X (isnadın əvvəlki raviləri sayılmır)
function companionWords(atText) {
  const t = norm(atText), m = t.match(/ (?:ان رسول الله|ان النبي|قال رسول الله|قال النبي|سمعت رسول الله|سمعت النبي)/)
  if (!m) return null
  const seg = t.slice(0, m.index).split(' عن ').pop()
  return new Set(words(seg).filter(w => w.length > 2 && !NAME_STOP.has(w)))
}
// Əl ilə yoxlanmış eyni-səhabə halları (söz müqayisəsi tutmur): "kitab nömrə|HadeethEnc id" → səbəb.
//  Buxari 6488: bizdə "Abdullah", HE "İbn Məsud" (eyni səhabə, Buxari 6488 İbn Məsuddandır);
//  Buxari 574: bizdə oğul Əbu Bəkr "atam"dan, HE "Əbu Musa" (Buxari 574 Əbu Musa əl-Əşəridəndir).
const NARRATOR_SAME = new Set(['Buxari 6488|3581', 'Buxari 574|4198'])
const nameKey = (w) => w.replace(/^ال/, '').replace(/ا$/, '')
function nameMatch(a, b) {
  const x = nameKey(a), y = nameKey(b)
  return x === y || (x.length >= 4 && y.length >= 4 && (x.startsWith(y) || y.startsWith(x)))
}
async function narratorOk(id, atText, source) {
  if (NARRATOR_SAME.has(`${source}|${id}`)) return true
  const atWords = atText ? companionWords(atText) : null
  if (!atWords || !atWords.size) return true
  const one = await heGet(`/hadeeths/one/?language=ar&id=${id}`)
  const t = norm(one?.hadeeth || '')
  const i = t.indexOf(' رضي ')
  if (i < 0) return true
  const names = words(t.slice(0, i)).filter(w => w.length > 2 && !NAME_STOP.has(w))
  return !names.length || names.some(w => [...atWords].some(a => nameMatch(w, a)))
}
async function heMatch(ar, atText, source) {
  const f = norm(ar), n = wc(ar)
  const atWords = atText ? new Set(words(atText)) : null
  let best = null
  for (const [id, t] of heTitles) {
    const s = (n >= 5 && t.includes(f)) ? 1 : (n >= 8 ? score(ar, t) : 0)
    if (s >= 0.9 && (!best || s > best.s)) best = { id, s }
  }
  if (best) return heAzOk.has(best.id) && (await narratorOk(best.id, atText, source)) ? best.id : null
  const found = new Set()
  for (const id of heAzOk) {
    const t = heTitles.get(id), tw = words(t)
    if (!tw.length) continue
    const ok = (t === f && n >= 2) ||
      (n >= 3 && t.includes(f) && tw.length <= 1.5 * n + 1) ||
      (atWords && n >= 3 && tw.every(w => atWords.has(w)) && wordDice(ar, t) >= 0.85)
    if (ok) found.add(id)
  }
  if (found.size !== 1) return null
  const id = [...found][0]
  return (await narratorOk(id, atText, source)) ? id : null
}
// Tərcümə versiyası (HadeethEnc şərt 3–4): API versiya vermir, amma rəsmi yükləmə linki versiyalı fayla yönləndirir
// (https://hadeethenc.com/az/browse/download/az/csv → .../HadeethEnc.com_az-v1.31.0.csv).
let heVersion = null
if (useHe) {
  try {
    const r = await fetch('https://hadeethenc.com/az/browse/download/az/csv', { redirect: 'manual' })
    heVersion = (r.headers.get('location') || '').match(/HadeethEnc\.com_az-v(\d+(?:\.\d+)+)\.csv$/)?.[1] || null
  } catch { /* şəbəkə yoxdursa köhnə dəyəri saxla */ }
  if (!heVersion) {
    const old = fs.existsSync(path.join(ROOT, 'src/data/hadithFull.js')) && fs.readFileSync(path.join(ROOT, 'src/data/hadithFull.js'), 'utf8').match(/az: '([\d.]+)'/)
    heVersion = old ? old[1] : null
  }
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
  const heId = useHe ? await heMatch(h.ar, hit?.at?.text, h.source) : null
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
// HadeethEnc.com tərcümə versiyası (rəsmi yükləmə faylının adından) — şərtlər 3–4: mənbədə göstərilir
export const HADITH_HE_VERSION = { az: ${heVersion ? `'${heVersion}'` : 'null'} }
`)
console.log(`hadith-full: nömrə ilə ${byNum}, axtarışla ${bySearch}, HadeethEnc az ${heAz} (yalnız HE ${heOnly}), tapılmadı ${miss}; ravisi tanınmayan ${Object.values(narrators).reduce((a, b) => a + b, 0)}`)
if (process.argv.includes('--narrators')) console.log(Object.entries(narrators).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}\t${k}`).join('\n'))
