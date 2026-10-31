#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// E-KODLAR — Open Food Facts əlavələr taksonomiyasından statik baza
//
// Mənbə:  https://static.openfoodfacts.org/data/taxonomies/additives.json
//         https://static.openfoodfacts.org/data/taxonomies/additives_classes.json
//         © Open Food Facts töhfəçiləri — Open Database License (ODbL 1.0);
//         ayrı-ayrı məzmun Database Contents License (DbCL 1.0).
// Əlavə (yalnız "həşərat" qrupu üçün, --no-wikidata ilə söndürülür):
//         Wikidata (CC0) — OFF-un öz "wikidata" sahəsindəki element; ingiliscə
//         təsvirində "insect" sözü və ya P1582 ("natural product of taxon")
//         takson zənciri (P171) Insecta-ya (Q1390) çıxırsa.
//
// Çıxış:  public/data/ecodes.json
//   { meta:{…mənbə, lisenziya, tarix, say…}, classes:{ id:{en,ru,…} },
//     items:{ e120:{ n:{en,ru,tr,ar,az?}, cat, vegan, vegetarian, from?, cls?, palm?, desc?, wd?, insect? } } }
//   n      — OFF adları (yalnız OLAN dillər; olmayanı səhifə ingiliscə göstərir və bunu deyir)
//   cat    — src/utils/ecodes.js → categorize() (qayda orada yazılıb)
//   from   — vegan/vegetarian özündə yoxdur, OFF "parents" valideynindən götürülüb
//
// HEÇ BİR halal/haram hökmü burada YAZILMIR — yalnız OFF faktları və onlardan qrup.
//
// İstifadə: node scripts/build-ecodes.mjs [--file additives.json] [--classes additives_classes.json] [--no-wikidata]
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { categorize, INSECT_RE } from '../src/utils/ecodes.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/data/ecodes.json')
const ADDITIVES_URL = 'https://static.openfoodfacts.org/data/taxonomies/additives.json'
const CLASSES_URL = 'https://static.openfoodfacts.org/data/taxonomies/additives_classes.json'
const LANGS = ['en', 'ru', 'tr', 'ar', 'az']
const UA = 'muslims.cc build-ecodes (https://muslims.cc)'

const argv = process.argv.slice(2)
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null }
const useWikidata = !argv.includes('--no-wikidata')

async function getJson(url, file) {
  if (file) return JSON.parse(fs.readFileSync(file, 'utf8'))
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
  return r.json()
}

const additives = await getJson(ADDITIVES_URL, arg('--file'))
const classesTax = await getJson(CLASSES_URL, arg('--classes'))

const en = (e, p) => e?.[p]?.en ?? null
const splitList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean)
// "E341iii - Trikalciumfosfat" → "Trikalciumfosfat"; yalnız "E170" olarsa → ''
const stripCode = (s) => String(s || '').replace(/^\s*E\s?\d{3,4}[a-z()]*\s*(?:[-–:]\s*)?/i, '').replace(/^food additive$/i, '').trim()
// Dil–əlifba uyğunluğu: OFF-da bəzən ad səhv dilin sahəsinə düşür (məs. az sahəsində ərəb hərfləri).
// Belə adlar atılır və meta.dropped-da sayılır; səhifə həmin dili ingiliscə göstərir.
const SCRIPT_OK = {
  en: (s) => !/[\p{Script=Arabic}\p{Script=Cyrillic}]/u.test(s),
  az: (s) => !/[\p{Script=Arabic}\p{Script=Cyrillic}]/u.test(s),
  tr: (s) => !/[\p{Script=Arabic}\p{Script=Cyrillic}ə]/iu.test(s),
  ru: (s) => /\p{Script=Cyrillic}/u.test(s) && !/\p{Script=Arabic}/u.test(s),
  ar: (s) => /\p{Script=Arabic}/u.test(s) && !/\p{Script=Cyrillic}/u.test(s),
}
const dropped = Object.fromEntries(LANGS.map((l) => [l, 0]))

/** vegan/vegetarian özündə yoxdursa — OFF "parents" zənciri ilə (OFF analizi də belə edir). */
function inherited(key, prop, seen = new Set()) {
  const e = additives[key]
  if (!e || seen.has(key)) return null
  seen.add(key)
  if (e[prop]?.en) return { value: e[prop].en, from: key }
  for (const p of e.parents || []) {
    const r = inherited(p, prop, seen)
    if (r) return r
  }
  return null
}

// ── Wikidata: yalnız heyvan / "ola bilər" qruplarında həşərat sübutu ──
const wdCache = new Map()
async function wdEntity(q) {
  if (wdCache.has(q)) return wdCache.get(q)
  const p = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`, { headers: { 'User-Agent': UA } })
        if (r.ok) return Object.values((await r.json()).entities)[0]
      } catch { /* yenidən */ }
      await new Promise((ok) => setTimeout(ok, 800 * (attempt + 1)))
    }
    return null
  })()
  wdCache.set(q, p)
  return p
}
const claimIds = (e, p) => (e?.claims?.[p] || []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean)
/** Takson P171 zənciri ilə Insecta-ya (Q1390) çıxırmı? (ən çox 40 addım) */
async function isInsectTaxon(q) {
  let cur = q
  for (let i = 0; i < 40 && cur; i++) {
    if (cur === 'Q1390') return true
    const e = await wdEntity(cur)
    cur = claimIds(e, 'P171')[0]
  }
  return false
}
async function insectEvidence(q) {
  const e = await wdEntity(q)
  if (!e) return null
  const desc = e.descriptions?.en?.value || ''
  if (INSECT_RE.test(desc)) return { wd: q, via: 'description', text: desc }
  for (const t of claimIds(e, 'P1582')) {
    if (await isInsectTaxon(t)) {
      const te = await wdEntity(t)
      return { wd: q, via: 'P1582', taxon: t, text: te?.labels?.en?.value || t }
    }
  }
  return null
}

// ── Qurma ──
const items = {}
const usedClasses = new Set()
const nameStats = Object.fromEntries(LANGS.map((l) => [l, 0]))
const keys = Object.keys(additives).filter((k) => /^en:e\d{3,4}[a-z]*$/.test(k)).sort((a, b) => {
  const na = Number(a.match(/\d+/)[0]), nb = Number(b.match(/\d+/)[0])
  return na - nb || a.localeCompare(b)
})

for (const key of keys) {
  const e = additives[key]
  const code = key.slice(3)
  const n = {}
  for (const l of LANGS) {
    const v = stripCode(e.name?.[l])
    if (!v) continue
    if (!SCRIPT_OK[l](v)) { dropped[l]++; continue }
    n[l] = v; nameStats[l]++
  }
  // OFF-da ingiliscə ad yoxdursa, "xx" (dildən asılı olmayan) ad — o da yalnız kod deyilsə
  if (!n.en) { const xx = stripCode(e.name?.xx); if (xx && SCRIPT_OK.en(xx)) n.en = xx }
  const parent = (e.parents || []).map((p) => p.slice(3)).find((p) => /^e\d/.test(p))
  const vg = inherited(key, 'vegan')
  const vt = inherited(key, 'vegetarian')
  const from = [vg?.from, vt?.from].find((f) => f && f !== key)
  const cls = [...new Set([...splitList(en(e, 'additives_classes')), ...splitList(en(e, 'mandatory_additive_class'))])]
    .map((c) => c.replace(/^en:/, ''))
  cls.forEach((c) => usedClasses.add(c))
  const desc = en(e, 'description')
  const item = {
    n,
    vegan: vg?.value || null,
    vegetarian: vt?.value || null,
    ...(parent ? { p: parent } : {}),
    ...(from ? { from: from.slice(3) } : {}),
    ...(cls.length ? { cls } : {}),
    ...(en(e, 'from_palm_oil') ? { palm: en(e, 'from_palm_oil') } : {}),
    ...(desc ? { desc } : {}),
    ...(en(e, 'wikidata') ? { wd: en(e, 'wikidata') } : {}),
  }
  items[code] = item
}

let wdChecked = 0
if (useWikidata) {
  for (const [code, it] of Object.entries(items)) {
    if (!it.wd || !(it.vegan === 'no' || it.vegetarian === 'no' || it.vegan === 'maybe' || it.vegetarian === 'maybe')) continue
    wdChecked++
    const ev = await insectEvidence(it.wd)
    if (ev) { it.insect = ev; console.log(`  həşərat sübutu: ${code} ← Wikidata ${ev.wd} (${ev.via}: ${ev.text})`) }
  }
}

const counts = {}
for (const it of Object.values(items)) {
  it.cat = categorize({
    vegan: it.vegan, vegetarian: it.vegetarian,
    name: it.n.en, desc: it.desc,
    insectEvidence: !!it.insect,
  })
  counts[it.cat] = (counts[it.cat] || 0) + 1
}

const classes = {}
for (const c of [...usedClasses].sort()) {
  const t = classesTax[`en:${c}`]?.name || {}
  classes[c] = Object.fromEntries(LANGS.filter((l) => t[l]).map((l) => [l, t[l]]))
  if (!classes[c].en) classes[c].en = c.replace(/-/g, ' ')
}

const data = {
  meta: {
    source: 'Open Food Facts — additives taxonomy',
    sourceUrl: ADDITIVES_URL,
    classesUrl: CLASSES_URL,
    license: 'Open Database License (ODbL) 1.0; individual contents: Database Contents License (DbCL) 1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    attribution: '© Open Food Facts contributors — https://world.openfoodfacts.org',
    wikidata: useWikidata ? { license: 'CC0 1.0', checked: wdChecked, usedFor: 'insect evidence only (English description or P1582 taxon → Insecta Q1390)' } : null,
    built: new Date().toISOString().slice(0, 10),
    count: Object.keys(items).length,
    counts,
    names: nameStats,
    namesDropped: dropped,
    fields: ['name', 'vegan', 'vegetarian', 'parents', 'additives_classes', 'mandatory_additive_class', 'from_palm_oil', 'description', 'wikidata'],
  },
  classes,
  items,
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(data))
console.log(`${data.meta.count} E-kod → ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`)
console.log('kateqoriyalar:', counts)
console.log('adlar (dil üzrə):', nameStats, 'atılan (əlifba uyğunsuz):', dropped)
