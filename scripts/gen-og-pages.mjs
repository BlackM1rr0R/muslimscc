#!/usr/bin/env node
// v5.9: hər surə və hər ad üçün paylaşma kartının məlumatı → scripts/gen-og-pages.py
//   node scripts/gen-og-pages.mjs && python scripts/gen-og-pages.py   (bir dəfəlik, nəticə public/og/-ə commit olunur)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SURAH_TABLE } from '../src/data/mushafIndex.js'
import { NAMES_99 } from '../src/data/names99.js'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = {
  quran: SURAH_TABLE.map(([, , ayahs, , ar, en], i) => ({ n: i + 1, ar, en, ayahs })),
  names: NAMES_99.map(x => ({ n: x.n, ar: x.ar, en: x.tr })),
}
fs.writeFileSync(path.join(ROOT, 'scripts', '.og-pages.json'), JSON.stringify(out))
console.log('✓', out.quran.length, 'surə,', out.names.length, 'ad')
