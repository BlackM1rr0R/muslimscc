// ═══════════════════════════════════════════════════════
// Əlavə dillərin lüğəti üçün ingiliscə interfeys yazılarını topla
//   node scripts/extract-ui-strings.mjs            → src/i18n/_source.json
//   node scripts/extract-ui-strings.mjs --missing id → id.json-da olmayanlar (stdout)
//
// Mənbə: 5 dilli obyektlərin ({ az, en, ru, ar, tr }) "en" dəyərindəki bütün
// sətirlər — interfeys fayllarında (komponentlər, səhifələr, naviqasiya) və
// SEO meta-sında (src/seo/meta.js, detail.js → SECTION_LABEL).
// src/data/ (hədis, dua, dərs, lüğət…) QƏSDƏN YOXDUR — dini mətn AI ilə
// tərcümə olunmur (sahibin qərarı, 2026-11-06; src/utils/uiText.js).
//
// Atılanlar: identifikatora oxşayan dəyərlər ('fajr', 'ltr', URL, rəng),
// ${} ifadəli şablonlar (onlar lüğətlə tərcümə olunmur), boş sətirlər.
// txt('…') çağırışlarının arqumenti də toplanır (5 dilli obyektdən kənar en budaqları).
//
// SAY İFADƏLƏRİ (TEAM.md): `${n} ${n === 1 ? 'day' : 'days'}` QADAĞANDIR — isim ayrıca söz
// kimi heç vaxt tərcümə olunmur (isUiText kiçik hərfli tək sözü atır), 44 dildə ingiliscə qalır.
// Düzgünü — bütöv ifadə: n === 1 ? '1 day' : `${n} days` ("1 day" və "{0} days" açarları).
// findPluralTernaries() bu nümunəni tapır; check-lang.mjs (npm run check) onu xəta sayır.
//
// --missing <dil>: KEEP_ENGLISH (scripts/i18n-keep-english.json — qəsdən ingiliscə qalan
// ayə/hədis mətnləri, sahibin qərarı D4) çıxılır; hamısı lazımdırsa — --with-baseline.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const espree = require('espree')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const DIRS = ['src/components', 'src/pages', 'src/data/guides', 'src/data/pageGuides']
const FILES = ['src/App.jsx', 'src/data/navigation.js', 'src/seo/meta.js', 'src/seo/detail.js', 'src/data/i18n.js',
  // v6.5: yalnız heyvan adları (dini mətn yoxdur — ayələr public/data/quran-animals-dəndir)
  'src/data/quranAnimals.js',
  // v6.6: elm adamlarının adları, sahələri və ensiklopedik faktları (dini mətn deyil)
  'src/data/islamicScientists.js',
  // B2: "1 verse" / "{0} verses" — ayahCountText-in en ifadəsi (txt() ilə tərcümə olunur)
  'src/utils/quranText.js']
const CORE = new Set(['az', 'en', 'ru', 'ar', 'tr'])

function walkDir(d, out) {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walkDir(p, out)
    else if (/\.jsx?$/.test(e.name)) out.push(p.replace(/\\/g, '/'))
  }
}

/** Tərcümə olunmalı interfeys yazısıdırmı? */
export function isUiText(s) {
  if (typeof s !== 'string') return false
  const t = s.trim()
  if (!t || t.length < 2) return false
  if (!/\p{L}/u.test(t)) return false                         // rəqəm/simvol
  if (/^[a-z0-9_\-.:/#?=&%]+$/.test(t)) return false          // identifikator, yol
  if (/^https?:\/\//.test(t) || /^[\w.-]+@[\w.-]+$/.test(t)) return false
  if (/^#[0-9a-f]{3,8}$/i.test(t)) return false
  return true
}

const keyName = (p) => (p.key.type === 'Identifier' ? p.key.name : p.key.type === 'Literal' ? String(p.key.value) : null)

function collectStrings(node, out) {
  if (!node || typeof node !== 'object') return
  if (node.type === 'Literal' && typeof node.value === 'string') { out.push(node.value); return }
  if (node.type === 'TemplateLiteral') {
    if (node.expressions.length === 0) { out.push(node.quasis.map(q => q.value.cooked).join('')); return }
    // v6.7: dinamik yazı → şablon açarı: `${n} days left` → "{0} days left" (uiText.txt şablonla tapır).
    // Statik hissədə hərf yoxdursa (`${a} ${b}`, `${n}%`) — açar yazılmır.
    const stat = node.quasis.map(q => q.value.cooked).join('')
    if (/\p{L}{2}/u.test(stat)) out.push(node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? `{${i}}` : '')).join(''))
    node.expressions.forEach(x => collectStrings(x, out))   // içindəki sabit sözlər ('surah' / 'surahs')
    return
  }
  for (const k of Object.keys(node)) {
    if (k === 'parent' || k === 'loc' || k === 'range') continue
    const v = node[k]
    if (Array.isArray(v)) v.forEach(x => collectStrings(x, out))
    else if (v && typeof v.type === 'string') collectStrings(v, out)
  }
}

function visit(node, out) {
  if (!node || typeof node !== 'object') return
  // txt('1 fact') / txt(n === 1 ? '1 fact' : `${n} facts`) — 5 dilli obyektdən kənar en ifadəsi
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'txt' && node.arguments[0]) {
    collectStrings(node.arguments[0], out)
  }
  if (node.type === 'ObjectExpression') {
    const props = node.properties.filter(p => p.type === 'Property')
    const names = props.map(keyName)
    const langKeys = names.filter(n => CORE.has(n))
    // 5 dilli obyekt: ən azı en və daha bir əsas dil açarı
    if (names.includes('en') && langKeys.length >= 2) {
      const en = props.find(p => keyName(p) === 'en')
      collectStrings(en.value, out)
    }
  }
  for (const k of Object.keys(node)) {
    if (k === 'parent' || k === 'loc' || k === 'range') continue
    const v = node[k]
    if (Array.isArray(v)) v.forEach(x => visit(x, out))
    else if (v && typeof v.type === 'string') visit(v, out)
  }
}

// ── Say ifadəsi yoxlaması: `${n} ${n === 1 ? 'day' : 'days'}` ──
// 5 dilli obyektin en dəyərində (və txt(...) arqumentində) şablonun içində saya görə
// isim seçən ternar: test "x === 1" / "x !== 1" / "x > 1" …, hər iki budaq hərfli sətir.
const isCountTest = (t) => t && t.type === 'BinaryExpression' && ['===', '==', '!==', '!=', '>', '<', '>=', '<='].includes(t.operator) &&
  [t.left, t.right].some(x => x.type === 'Literal' && typeof x.value === 'number' && x.value <= 2)
const wordLit = (n) => n && n.type === 'Literal' && typeof n.value === 'string' && /\p{L}/u.test(n.value)

function walkAst(node, fn) {
  if (!node || typeof node !== 'object') return
  fn(node)
  for (const k of Object.keys(node)) {
    if (k === 'parent' || k === 'loc' || k === 'range') continue
    const v = node[k]
    if (Array.isArray(v)) v.forEach(x => walkAst(x, fn))
    else if (v && typeof v.type === 'string') walkAst(v, fn)
  }
}

/** Mənbə kodunda qadağan say nümunələri → [{ line, sample }] */
export function pluralTernariesIn(src) {
  const ast = espree.parse(src, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true }, loc: true })
  const hits = []
  const lines = src.split('\n')
  const scan = (root) => walkAst(root, (n) => {
    if (n.type !== 'TemplateLiteral') return
    for (const x of n.expressions) {
      if (x.type === 'ConditionalExpression' && isCountTest(x.test) && wordLit(x.consequent) && wordLit(x.alternate)) {
        hits.push({ line: x.loc.start.line, sample: lines[x.loc.start.line - 1].trim().slice(0, 140) })
      }
    }
  })
  walkAst(ast, (n) => {
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'txt' && n.arguments[0]) scan(n.arguments[0])
    if (n.type !== 'ObjectExpression') return
    const props = n.properties.filter(p => p.type === 'Property')
    const names = props.map(keyName)
    if (names.includes('en') && names.filter(k => CORE.has(k)).length >= 2) scan(props.find(p => keyName(p) === 'en').value)
  })
  return hits
}

/** Bütün interfeys fayllarında → [{ file, line, sample }] */
export function findPluralTernaries() {
  const out = new Map()
  for (const f of uiFiles()) {
    for (const h of pluralTernariesIn(fs.readFileSync(path.join(ROOT, f), 'utf8'))) out.set(`${f}:${h.line}`, { file: f, ...h })
  }
  return [...out.values()]
}

/** Qəsdən tərcümə olunmayan (ayə/hədis/dua) ingiliscə yazılar — sahibin qərarı (D4) */
export function keepEnglish() {
  const f = path.join(ROOT, 'scripts', 'i18n-keep-english.json')
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : []
}

function uiFiles() {
  const files = [...FILES]
  for (const d of DIRS) walkDir(d, files)
  return files
}

export function extractUiStrings() {
  const files = uiFiles()
  const all = new Set()
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8')
    let ast
    try {
      ast = espree.parse(src, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } })
    } catch (e) {
      throw new Error(`${f}: ${e.message}`)
    }
    const out = []
    visit(ast, out)
    for (const s of out) if (isUiText(s)) all.add(s)
  }
  return [...all].sort()
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  // SEO başlıq/təsvirləri — şablonlu olanlar (`${BRAND.aiName.en} — …`) AST-dən çıxmır, ona görə
  // META-nın HESABLANMIŞ ingiliscə dəyərləri də əlavə olunur (əvvəl AI səhifəsinin başlığı 44 dildə ingiliscə qalırdı)
  const { META } = await import('../src/seo/meta.js')
  const metaEn = Object.values(META).flatMap(e => (e?.en ? [e.en.t, e.en.d] : [])).filter(isUiText)
  const list = [...new Set([...extractUiStrings(), ...metaEn])].sort()
  const mi = process.argv.indexOf('--missing')
  if (mi > -1) {
    const lang = process.argv[mi + 1]
    const file = path.join(ROOT, 'src', 'i18n', `${lang}.json`)
    const have = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
    const keep = process.argv.includes('--with-baseline') ? new Set() : new Set(keepEnglish())
    const missAll = list.filter(s => !(s in have))
    const miss = missAll.filter(s => !keep.has(s))
    process.stdout.write(JSON.stringify(miss, null, 1) + '\n')
    console.error(`${lang}: ${list.length - missAll.length}/${list.length} var, ${miss.length} əskik` +
      (missAll.length > miss.length ? ` (+${missAll.length - miss.length} qəsdən ingiliscə — i18n-keep-english.json)` : ''))
  } else {
    fs.writeFileSync(path.join(ROOT, 'src', 'i18n', '_source.json'), JSON.stringify(list, null, 1) + '\n')
    let chars = 0
    for (const s of list) chars += s.length
    console.log(`✓ src/i18n/_source.json — ${list.length} yazı, ${chars} simvol`)
  }
}
