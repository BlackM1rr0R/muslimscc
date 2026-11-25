#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// WordPress.org readme.txt yoxlayıcısı — node scripts/check-wp-readme.mjs
//
// developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/ və wordpress.org
// readme parser-inin (class-readme-parser.php) qaydaları əsasında:
//   • "=== Ad ===" başlığı = plagin başlığındakı "Plugin Name"
//   • məcburi sahələr: Contributors, Tags, Requires at least, Tested up to, Requires PHP, Stable tag,
//     License, License URI; Contributors — wordpress.org istifadəçi adları (kiçik hərf)
//   • Tags ≤ 5 (parser artığını atır), təkrarsız; qısa təsvir ≤ 150 simvol (artığı kəsilir), Markdown yoxdur
//   • Tested up to / Requires at least — "X.Y" formatı; Requires at least / Requires PHP / Stable tag /
//     License plagin başlığı ilə eyni; Stable tag "trunk" deyil
//   • bölmələr: Description, Installation, FAQ, Screenshots, Changelog; Upgrade Notice hər biri ≤ 300 simvol
//   • Screenshots siyahısı = wordpress/assets/screenshot-N.png faylları (1..N, boşluqsuz)
//   • wordpress/assets/ — ikon/banner ölçüləri PNG başlığından yoxlanır, cəmi < 1.5 MB
// Unit test (tests/unit/wp-assets.test.js) və CI (.github/workflows/wp-plugin.yml) işlədir.
// Asılılıq yoxdur — CI-da npm ci-siz işləyir.
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SLUG = 'muslimscc-prayer-times'
export const PLUGIN_DIR = path.join(ROOT, 'wordpress', SLUG)
export const ASSETS_DIR = path.join(ROOT, 'wordpress', 'assets')

export const SHORT_DESC_MAX = 150
export const TAGS_MAX = 5
export const UPGRADE_NOTICE_MAX = 300
export const ASSETS_MAX_BYTES = 1.5 * 1024 * 1024

const HEADER_FIELDS = ['Contributors', 'Donate link', 'Tags', 'Requires at least', 'Tested up to', 'Requires PHP',
  'Stable tag', 'License', 'License URI']
const REQUIRED_FIELDS = ['Contributors', 'Tags', 'Requires at least', 'Tested up to', 'Requires PHP', 'Stable tag',
  'License', 'License URI']
const REQUIRED_SECTIONS = ['Description', 'Installation', 'Frequently Asked Questions', 'Screenshots', 'Changelog']
// wordpress.org-un qəbul etdiyi GPL-uyğun yazılışlar (tam siyahı deyil — bizə lazım olanlar)
const GPL_RE = /^(GPL-?2\.0-or-later|GPLv2 or later|GPL-?3\.0(-or-later)?|GPLv3( or later)?)$/i

/** readme.txt → { name, fields, shortDescription, sections: { ad: mətn } }. */
export function parseReadme(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  const head = /^===\s*(.+?)\s*===\s*$/.exec(lines[i] || '')
  const name = head ? head[1] : null
  if (head) i++
  const fields = {}
  for (; i < lines.length; i++) {
    const l = lines[i]
    if (!l.trim()) { i++; break }
    const m = /^([A-Za-z ]+):\s*(.*)$/.exec(l)
    if (m && HEADER_FIELDS.some(f => f.toLowerCase() === m[1].trim().toLowerCase())) {
      const key = HEADER_FIELDS.find(f => f.toLowerCase() === m[1].trim().toLowerCase())
      fields[key] = m[2].trim()
    } else break
  }
  // Qısa təsvir — başlıqdan sonrakı ilk boş olmayan, "==" ilə başlamayan abzas
  while (i < lines.length && !lines[i].trim()) i++
  const shortLines = []
  for (; i < lines.length && lines[i].trim() && !/^==/.test(lines[i]); i++) shortLines.push(lines[i].trim())
  const sections = {}
  let cur = null
  for (; i < lines.length; i++) {
    const s = /^==\s*(.+?)\s*==\s*$/.exec(lines[i])
    if (s) { cur = s[1]; sections[cur] = []; continue }
    if (cur) sections[cur].push(lines[i])
  }
  for (const k of Object.keys(sections)) sections[k] = sections[k].join('\n').trim()
  return { name, fields, shortDescription: shortLines.join(' '), sections }
}

/** Plagin PHP başlığındakı sahələr ("Plugin Name", "Version", "Requires at least", …). */
export function parsePluginHeader(php) {
  const out = {}
  const block = /\/\*\*?([\s\S]*?)\*\//.exec(php)
  for (const l of (block ? block[1] : '').split('\n')) {
    const m = /^\s*\*?\s*([A-Za-z ]+?):\s*(.+?)\s*$/.exec(l)
    if (m) out[m[1].trim()] = m[2]
  }
  return out
}

/** "== Screenshots ==" bölməsindəki nömrəli başlıqlar. */
export function screenshotCaptions(section = '') {
  return section.split('\n').map(l => /^\s*(\d+)\.\s+(.+)$/.exec(l)).filter(Boolean).map(m => ({ n: Number(m[1]), caption: m[2] }))
}

/** "= 1.0.0 =" alt başlıqlarına görə bölür. */
function subsections(section = '') {
  const out = []
  let cur = null
  for (const l of section.split('\n')) {
    const m = /^=\s*(.+?)\s*=\s*$/.exec(l)
    if (m) { cur = { title: m[1], body: [] }; out.push(cur) } else if (cur) cur.body.push(l)
  }
  return out.map(s => ({ title: s.title, body: s.body.join('\n').trim() }))
}

const verRe = /^\d+\.\d+$/
const cmpVer = (a, b) => {
  const [x, y] = [a, b].map(v => v.split('.').map(Number))
  for (let k = 0; k < Math.max(x.length, y.length); k++) if ((x[k] || 0) !== (y[k] || 0)) return (x[k] || 0) - (y[k] || 0)
  return 0
}

/**
 * Bütün qaydalar → səhvlərin siyahısı (boş = keçir).
 * readme — parseReadme nəticəsi, header — parsePluginHeader nəticəsi, screenshots — assets-dəki screenshot-N nömrələri.
 */
export function validateReadme(readme, header = {}, screenshots = null) {
  const errors = []
  const f = readme.fields
  if (!readme.name) errors.push('başlıq "=== Plugin Name ===" yoxdur')
  else if (header['Plugin Name'] && readme.name !== header['Plugin Name']) errors.push(`ad readme-də "${readme.name}", plagində "${header['Plugin Name']}"`)

  for (const k of REQUIRED_FIELDS) if (!f[k]) errors.push(`sahə yoxdur: ${k}`)

  if (f.Contributors) {
    const users = f.Contributors.split(',').map(s => s.trim()).filter(Boolean)
    if (!users.length) errors.push('Contributors boşdur')
    for (const u of users) if (!/^[a-z0-9][a-z0-9_.-]*$/.test(u)) errors.push(`Contributors: "${u}" wordpress.org istifadəçi adı deyil (kiçik hərf, rəqəm, - _ .)`)
  }
  if (f.Tags) {
    const tags = f.Tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    if (tags.length > TAGS_MAX) errors.push(`Tags: ${tags.length} etiket, ən çoxu ${TAGS_MAX} (artığı atılır)`)
    if (new Set(tags).size !== tags.length) errors.push('Tags: təkrar etiket')
    for (const t of tags) if (['plugin', 'wordpress', 'wp'].includes(t)) errors.push(`Tags: "${t}" mənasız etiketdir`)
  }
  for (const k of ['Requires at least', 'Tested up to']) if (f[k] && !verRe.test(f[k])) errors.push(`${k}: "${f[k]}" — "X.Y" formatı lazımdır`)
  if (f['Requires PHP'] && !/^\d+\.\d+$/.test(f['Requires PHP'])) errors.push(`Requires PHP: "${f['Requires PHP']}" — "X.Y" formatı lazımdır`)
  if (verRe.test(f['Requires at least'] || '') && verRe.test(f['Tested up to'] || '') && cmpVer(f['Tested up to'], f['Requires at least']) < 0) {
    errors.push('Tested up to < Requires at least')
  }
  if (f['Stable tag']) {
    if (f['Stable tag'].toLowerCase() === 'trunk') errors.push('Stable tag "trunk" olmamalıdır (tags/<versiya> işlədin)')
    else if (!/^\d+(\.\d+){1,3}$/.test(f['Stable tag'])) errors.push(`Stable tag: "${f['Stable tag']}" versiya deyil`)
  }
  if (f.License && !GPL_RE.test(f.License)) errors.push(`License: "${f.License}" GPL-uyğun yazılış deyil`)
  if (f['License URI'] && !/^https:\/\/www\.gnu\.org\/licenses\//.test(f['License URI'])) errors.push('License URI gnu.org-a getmir')

  // Plagin başlığı ilə uyğunluq
  if (header.Version && f['Stable tag'] && header.Version !== f['Stable tag']) errors.push(`Stable tag ${f['Stable tag']} ≠ plagin Version ${header.Version}`)
  if (header['Requires at least'] && f['Requires at least'] && header['Requires at least'] !== f['Requires at least']) errors.push('Requires at least readme ilə plagin başlığında fərqlidir')
  if (header['Requires PHP'] && f['Requires PHP'] && header['Requires PHP'] !== f['Requires PHP']) errors.push('Requires PHP readme ilə plagin başlığında fərqlidir')
  if (header.License && f.License && header.License !== f.License) errors.push('License readme ilə plagin başlığında fərqlidir')

  // Qısa təsvir
  const sd = readme.shortDescription
  if (!sd) errors.push('qısa təsvir yoxdur')
  else {
    if ([...sd].length > SHORT_DESC_MAX) errors.push(`qısa təsvir ${[...sd].length} simvol, ən çoxu ${SHORT_DESC_MAX}`)
    if (/[*_`[\]<>]/.test(sd)) errors.push('qısa təsvirdə Markdown/HTML olmamalıdır')
  }

  // Bölmələr
  for (const s of REQUIRED_SECTIONS) if (!readme.sections[s]) errors.push(`bölmə yoxdur və ya boşdur: == ${s} ==`)
  if (!readme.sections['External services'] && /iframe|https?:\/\//i.test(readme.sections.Description || '')) {
    errors.push('xarici xidmət işlədilir — "== External services ==" bölməsi lazımdır (qayda 6/7)')
  }
  for (const u of subsections(readme.sections['Upgrade Notice'])) {
    if ([...u.body].length > UPGRADE_NOTICE_MAX) errors.push(`Upgrade Notice ${u.title}: ${[...u.body].length} > ${UPGRADE_NOTICE_MAX} simvol`)
  }
  if (f['Stable tag'] && readme.sections.Changelog && !subsections(readme.sections.Changelog).some(c => c.title === f['Stable tag'])) {
    errors.push(`Changelog-da "= ${f['Stable tag']} =" yoxdur`)
  }

  // Ekran şəkilləri ↔ assets
  const caps = screenshotCaptions(readme.sections.Screenshots)
  caps.forEach((c, k) => { if (c.n !== k + 1) errors.push(`Screenshots: nömrələr ardıcıl deyil (${c.n})`) })
  if (screenshots) {
    const want = caps.map(c => c.n).join(',')
    const have = [...screenshots].sort((a, b) => a - b).join(',')
    if (want !== have) errors.push(`Screenshots başlıqları [${want}] ≠ assets/screenshot-N.png [${have}]`)
  }
  return errors
}

/** PNG ölçüsü (IHDR) — asılılıqsız. */
export function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47 || buf.toString('ascii', 12, 16) !== 'IHDR') return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/** wordpress/assets/ yoxlaması: adlar, ölçülər, cəmi həcm. → { errors, screenshots: [N…], total } */
export function checkAssets(dir = ASSETS_DIR) {
  const errors = []
  const screenshots = []
  let total = 0
  if (!fs.existsSync(dir)) return { errors: [`${dir} yoxdur`], screenshots, total }
  const files = fs.readdirSync(dir)
  const need = { 'icon-128x128.png': [128, 128], 'icon-256x256.png': [256, 256], 'banner-772x250.png': [772, 250], 'banner-1544x500.png': [1544, 500] }
  for (const [name, [w, h]] of Object.entries(need)) {
    if (!files.includes(name)) { errors.push(`assets: ${name} yoxdur`); continue }
    const s = pngSize(fs.readFileSync(path.join(dir, name)))
    if (!s || s.width !== w || s.height !== h) errors.push(`assets: ${name} ölçüsü ${s ? `${s.width}×${s.height}` : 'PNG deyil'}, ${w}×${h} lazımdır`)
  }
  for (const name of files) {
    const abs = path.join(dir, name)
    if (!fs.statSync(abs).isFile()) continue
    total += fs.statSync(abs).size
    const m = /^screenshot-(\d+)\.(png|jpg|gif|webp)$/.exec(name)
    if (m) screenshots.push(Number(m[1]))
    else if (!need[name] && !/^(icon\.svg|blueprints)$/.test(name)) errors.push(`assets: gözlənilməz fayl ${name}`)
  }
  if (total > ASSETS_MAX_BYTES) errors.push(`assets cəmi ${(total / 1024).toFixed(0)} KB > ${ASSETS_MAX_BYTES / 1024} KB`)
  return { errors, screenshots, total }
}

/** Hamısı birlikdə — CLI və unit test üçün. */
export function checkAll({ pluginDir = PLUGIN_DIR, assetsDir = ASSETS_DIR } = {}) {
  const readme = parseReadme(fs.readFileSync(path.join(pluginDir, 'readme.txt'), 'utf8'))
  const header = parsePluginHeader(fs.readFileSync(path.join(pluginDir, `${SLUG}.php`), 'utf8'))
  const assets = checkAssets(assetsDir)
  return { readme, header, assets, errors: [...validateReadme(readme, header, assets.screenshots), ...assets.errors] }
}

function main() {
  const { readme, assets, errors } = checkAll()
  if (errors.length) {
    for (const e of errors) console.error(`::error file=wordpress/${SLUG}/readme.txt::${e}`)
    console.error(`wp-readme: ${errors.length} səhv`)
    process.exit(1)
  }
  console.log(`wp-readme: OK — "${readme.name}" ${readme.fields['Stable tag']}, Tested up to ${readme.fields['Tested up to']}, ` +
    `qısa təsvir ${[...readme.shortDescription].length}/${SHORT_DESC_MAX}, ${assets.screenshots.length} ekran şəkli, assets ${(assets.total / 1024).toFixed(0)} KB`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
