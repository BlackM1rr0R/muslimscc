#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// WordPress plagini → zip — node scripts/build-wp-plugin.mjs
//
// • wordpress/muslimscc-prayer-times/ qovluğunu <dist>/downloads/muslimscc-prayer-times.zip-ə
//   yığır (npm run build-in son addımı). Repoda binar fayl saxlanmır; dist/ image-ə düşür,
//   nginx onu "location /" ilə verir (/widget səhifəsindəki "Endir" düyməsi).
//   Çıxış qovluğu: --out <qovluq> və ya PRERENDER_DIST (paralel build-lər), susmaya görə dist.
// • --sync    — includes/cities.php və languages/*.pot faylını yenidən yazır
//               (şəhər siyahısı src/data/prayerCities.js-dən, tərcümə sətirləri PHP/JS/block.json-dan).
//               Unit test (tests/unit/wp-plugin.test.js) onların köhnəlmədiyini yoxlayır.
// • Asılılıq yoxdur: zip yazıcısı (deflate + CRC-32) node:zlib ilə buradadır;
//   vaxt damğası sabitdir → eyni məzmun = eyni zip (təkrarlanan build).
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PRAYER_CITIES, COUNTRY_NAMES } from '../src/data/prayerCities.js'
import { PRAYER_CITY_SLUGS } from '../src/seo/detailSlugs.js'
import { WP_PLUGIN_SLUG, citySlug } from '../src/utils/wpPlugin.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const PLUGIN_DIR = path.join(ROOT, 'wordpress', WP_PLUGIN_SLUG)
export const TEXT_DOMAIN = WP_PLUGIN_SLUG

// Zip-ə düşməyənlər: gizli fayllar, ƏS zibili, testlər
const EXCLUDE = /(^|\/)(\.[^/]*|Thumbs\.db|desktop\.ini|node_modules|tests?)(\/|$)/i

// ── CRC-32 (zip standartı, polinom 0xEDB88320) ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

// Sabit vaxt: 2026-01-01 00:00 (MS-DOS formatı) — zip təkrarlanan olsun
const DOS_TIME = 0
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1

/**
 * Zip arxivi (deflate). entries — [{ name: 'qovluq/fayl', data: Buffer }] (sıra saxlanılır).
 * Qovluq girişləri yazılmır — WordPress və bütün açıcılar yolları özü yaradır.
 */
export function createZip(entries) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8')
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data)
    const deflated = zlib.deflateRawSync(raw, { level: 9 })
    const useDeflate = deflated.length < raw.length
    const body = useDeflate ? deflated : raw
    const method = useDeflate ? 8 : 0
    const crc = crc32(raw)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)            // açmaq üçün versiya 2.0
    local.writeUInt16LE(0x0800, 6)        // bit 11: ad UTF-8-dir
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, nameBuf, body)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE((3 << 8) | 20, 4)   // Unix tərəfindən yaradılıb (icazələr üçün)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt16LE(DOS_TIME, 12)
    central.writeUInt16LE(DOS_DATE, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(body.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30)   // extra
    central.writeUInt16LE(0, 32)   // şərh
    central.writeUInt16LE(0, 34)   // disk
    central.writeUInt16LE(0, 36)   // daxili atributlar
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38)   // -rw-r--r--
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBuf)

    offset += local.length + nameBuf.length + body.length
  }
  const centralBuf = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, centralBuf, end])
}

/** Zip-i oxu (yalnız createZip-in yazdığı format üçün — testlər) → [{ name, data }]. */
export function readZip(buf) {
  const endAt = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (endAt < 0) throw new Error('zip sonu tapılmadı')
  const count = buf.readUInt16LE(endAt + 10)
  let p = buf.readUInt32LE(endAt + 16)
  const out = []
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('mərkəzi qovluq pozuqdur')
    const method = buf.readUInt16LE(p + 10)
    const crc = buf.readUInt32LE(p + 16)
    const csize = buf.readUInt32LE(p + 20)
    const nlen = buf.readUInt16LE(p + 28)
    const xlen = buf.readUInt16LE(p + 30)
    const clen = buf.readUInt16LE(p + 32)
    const lho = buf.readUInt32LE(p + 42)
    const name = buf.subarray(p + 46, p + 46 + nlen).toString('utf8')
    const lnlen = buf.readUInt16LE(lho + 26)
    const lxlen = buf.readUInt16LE(lho + 28)
    const start = lho + 30 + lnlen + lxlen
    const body = buf.subarray(start, start + csize)
    const data = method === 8 ? zlib.inflateRawSync(body) : Buffer.from(body)
    if (crc32(data) !== crc) throw new Error(`CRC səhvdir: ${name}`)
    out.push({ name, data })
    p += 46 + nlen + xlen + clen
  }
  return out
}

/** Plagin qovluğundakı fayllar (nisbi yol, '/' ilə, əlifba sırası). */
export function collectFiles(dir = PLUGIN_DIR) {
  const out = []
  const walk = (abs, rel) => {
    for (const ent of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel ? `${rel}/${ent.name}` : ent.name
      if (EXCLUDE.test(r)) continue
      if (ent.isDirectory()) walk(path.join(abs, ent.name), r)
      else if (ent.isFile()) out.push(r)
    }
  }
  walk(dir, '')
  return out
}

/** Zip-i qur: bütün fayllar "<slug>/..." altında (WordPress "Upload Plugin" bunu gözləyir). */
export function buildPluginZip(dir = PLUGIN_DIR) {
  const entries = collectFiles(dir).map(rel => ({
    name: `${WP_PLUGIN_SLUG}/${rel}`,
    data: fs.readFileSync(path.join(dir, rel)),
  }))
  return createZip(entries)
}

/** Plagin başlığındakı "Version:" sətri. */
export function readPluginVersion(dir = PLUGIN_DIR) {
  const php = fs.readFileSync(path.join(dir, `${WP_PLUGIN_SLUG}.php`), 'utf8')
  const m = /^\s*\*\s*Version:\s*([0-9][\w.-]*)\s*$/m.exec(php)
  return m ? m[1] : null
}

// ── includes/cities.php ──

const phpStr = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** Plagin üçün şəhər siyahısı: shortcode açarı → id, ingiliscə ad, ölkə, /prayer/<açar> səhifəsi varmı. */
export function pluginCities() {
  const pages = new Set(PRAYER_CITY_SLUGS)
  return PRAYER_CITIES.map(c => ({
    key: citySlug(c.id),
    id: c.id,
    label: c.label.en,
    country: COUNTRY_NAMES[c.country]?.en || c.country,
    page: pages.has(citySlug(c.id)),
  }))
}

export function renderCitiesPhp(cities = pluginCities()) {
  const keys = new Set()
  for (const c of cities) {
    if (!/^[a-z0-9_-]+$/.test(c.key) || keys.has(c.key)) throw new Error(`yanlış və ya təkrar şəhər açarı: ${c.key}`)
    keys.add(c.key)
  }
  const rows = cities.map(c =>
    `\t${phpStr(c.key)} => array( 'id' => ${phpStr(c.id)}, 'label' => ${phpStr(c.label)}, 'country' => ${phpStr(c.country)}, 'page' => ${c.page ? 'true' : 'false'} ),`)
  return [
    '<?php',
    '/**',
    ' * City list — GENERATED by scripts/build-wp-plugin.mjs --sync from src/data/prayerCities.js on muslims.cc. Do not edit.',
    ' *',
    ' * Key (as used in the shortcode) => id on muslims.cc, English label, country, has a /prayer/<key> page.',
    ' *',
    ' * @package MuslimsCC_Prayer_Times',
    ' */',
    '',
    "defined( 'ABSPATH' ) || exit;",
    '',
    'return array(',
    ...rows,
    ');',
    '',
  ].join('\n')
}

// ── languages/<domain>.pot ──

const unPhp = (q, s) => (q === "'" ? s.replace(/\\(['\\])/g, '$1') : s.replace(/\\(["\\])/g, '$1'))
const potEsc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')

/**
 * Tərcümə sətirləri: PHP __()/_e()/esc_html__()/esc_attr__()/esc_html_e()/esc_attr_e(),
 * JS __(), block.json (title/description/keywords — WordPress-in kontekstləri ilə), plagin başlığı.
 * → [{ ctx, id, refs: ['fayl:sətir'] }] (ilk rast gəlmə sırası ilə).
 */
export function extractStrings(dir = PLUGIN_DIR) {
  const map = new Map()
  const add = (ctx, id, ref, note = '') => {
    const k = `${ctx || ''}\u0004${id}`
    if (!map.has(k)) map.set(k, { ctx, id, refs: [], note: '' })
    const e = map.get(k)
    e.refs.push(ref)
    if (note && !e.note) e.note = note
  }
  const dom = TEXT_DOMAIN.replace(/[-]/g, '\\-')
  const callRe = new RegExp(String.raw`\b(?:__|_e|esc_html__|esc_attr__|esc_html_e|esc_attr_e)\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*['"]` + dom + `['"]\\s*\\)`, 'g')
  for (const rel of collectFiles(dir)) {
    const abs = path.join(dir, rel)
    if (/\.(php|js)$/.test(rel)) {
      const src = fs.readFileSync(abs, 'utf8')
      const lineAt = (i) => src.slice(0, i).split('\n').length
      if (rel === `${WP_PLUGIN_SLUG}.php`) {
        for (const field of ['Plugin Name', 'Description']) {
          const m = new RegExp(`^\\s*\\*\\s*${field}:\\s*(.+?)\\s*$`, 'm').exec(src)
          if (m) add(null, m[1], `${rel}:${lineAt(m.index)}`)
        }
      }
      for (const m of src.matchAll(callRe)) {
        // Əvvəlki 2 sətirdə "translators:" şərhi varsa — tərcüməçiyə qeyd kimi .pot-a
        const before = src.slice(0, m.index).split('\n').slice(-3).join('\n')
        const note = /translators:\s*(.+?)\s*(?:\*\/|$)/m.exec(before)
        add(null, unPhp(m[1], m[2]), `${rel}:${lineAt(m.index)}`, note ? `translators: ${note[1]}` : '')
      }
    } else if (rel.endsWith('block.json')) {
      const j = JSON.parse(fs.readFileSync(abs, 'utf8'))
      if (j.title) add('block title', j.title, rel)
      if (j.description) add('block description', j.description, rel)
      for (const k of j.keywords || []) add('block keyword', k, rel)
    }
  }
  return [...map.values()]
}

export function renderPot(strings = extractStrings(), version = readPluginVersion()) {
  const head = [
    '# Copyright (C) 2026 Muslims.cc',
    '# This file is distributed under the GPL-2.0-or-later.',
    'msgid ""',
    'msgstr ""',
    `"Project-Id-Version: Muslims.cc Prayer Times ${version}\\n"`,
    '"Report-Msgid-Bugs-To: https://wordpress.org/support/plugin/muslimscc-prayer-times\\n"',
    '"MIME-Version: 1.0\\n"',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '"Content-Transfer-Encoding: 8bit\\n"',
    '"Language-Team: LANGUAGE <LL@li.org>\\n"',
    `"X-Domain: ${TEXT_DOMAIN}\\n"`,
    '',
  ]
  const body = strings.flatMap(s => [
    ...(s.note ? [`#. ${s.note}`] : []),
    `#: ${s.refs.join(' ')}`,
    ...(/%(\d+\$)?[sd]/.test(s.id) ? ['#, php-format'] : []),
    ...(s.ctx ? [`msgctxt "${potEsc(s.ctx)}"`] : []),
    `msgid "${potEsc(s.id)}"`,
    'msgstr ""',
    '',
  ])
  return [...head, ...body].join('\n')
}

export const CITIES_PHP = path.join(PLUGIN_DIR, 'includes', 'cities.php')
export const POT_FILE = path.join(PLUGIN_DIR, 'languages', `${TEXT_DOMAIN}.pot`)

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--sync')) {
    fs.writeFileSync(CITIES_PHP, renderCitiesPhp())
    fs.writeFileSync(POT_FILE, renderPot())
    console.log(`wp-plugin: ${path.relative(ROOT, CITIES_PHP)}, ${path.relative(ROOT, POT_FILE)} yeniləndi`)
    return
  }
  const outArg = args.indexOf('--out')
  const dist = path.resolve(ROOT, outArg > -1 && args[outArg + 1] ? args[outArg + 1] : process.env.PRERENDER_DIST || 'dist')
  const file = path.join(dist, 'downloads', `${WP_PLUGIN_SLUG}.zip`)
  const zip = buildPluginZip()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, zip)
  console.log(`wp-plugin: ${path.relative(ROOT, file)} (${(zip.length / 1024).toFixed(1)} KB, v${readPluginVersion()})`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
