#!/usr/bin/env node
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
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const espree = require('espree')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const DIRS = ['src/components', 'src/pages']
const FILES = ['src/App.jsx', 'src/data/navigation.js', 'src/seo/meta.js', 'src/seo/detail.js', 'src/data/i18n.js']
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
    if (node.expressions.length === 0) out.push(node.quasis.map(q => q.value.cooked).join(''))
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

export function extractUiStrings() {
  const files = [...FILES]
  for (const d of DIRS) walkDir(d, files)
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
  const list = extractUiStrings()
  const mi = process.argv.indexOf('--missing')
  if (mi > -1) {
    const lang = process.argv[mi + 1]
    const file = path.join(ROOT, 'src', 'i18n', `${lang}.json`)
    const have = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
    const miss = list.filter(s => !(s in have))
    process.stdout.write(JSON.stringify(miss, null, 1) + '\n')
    console.error(`${lang}: ${list.length - miss.length}/${list.length} var, ${miss.length} əskik`)
  } else {
    fs.writeFileSync(path.join(ROOT, 'src', 'i18n', '_source.json'), JSON.stringify(list, null, 1) + '\n')
    let chars = 0
    for (const s of list) chars += s.length
    console.log(`✓ src/i18n/_source.json — ${list.length} yazı, ${chars} simvol`)
  }
}
