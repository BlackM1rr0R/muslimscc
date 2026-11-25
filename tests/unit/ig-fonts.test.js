// server/fonts/MccInter*.ttf (scripts/build-ig-fonts.py) — Instagram kartı / reel başlıqlarının latın-kiril şrifti.
// • Böyük hərflər (Ə Ğ İ Ş Ç Ö Ü, kiril) öz qlifinə gedir, kiçik hərfin qlifi DEYİL, hündürlüyü böyük hərf hündürlüyüdür (H).
// • Birləşdirmə reqressiyası (2026-11-25): alt dəstlər (latin, latin-ext, az …) üst-üstə düşürdü, təkrarlanan qliflərlə
//   GSUB qarışırdı — "A" başqa alt dəstin kopyasına dəyişirdi və kerning (AV, AY) itirdi. Kerning açıq / bağlı fərqi yoxlanır.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const card = require('../../server/instagramCard.js')
const DIR = path.join(path.dirname(require.resolve('../../server/instagramCard.js')), 'fonts')
const FILES = [['MccInter-Regular.ttf', 'MccInter'], ['MccInter-SemiBold.ttf', 'MccInterSemi']]

/** Minimal TTF oxuyucu: codepoint → glyph id (cmap 4/12), glyph id → yMax (glyf başlığı). */
function ttf(file) {
  const b = fs.readFileSync(path.join(DIR, file))
  const tables = {}
  for (let i = 0, n = b.readUInt16BE(4); i < n; i++) tables[b.toString('latin1', 12 + i * 16, 16 + i * 16)] = b.readUInt32BE(12 + i * 16 + 8)
  const cmap = tables.cmap
  const subs = []
  for (let i = 0, k = b.readUInt16BE(cmap + 2); i < k; i++) {
    const o = cmap + 4 + i * 8
    subs.push({ pid: b.readUInt16BE(o), eid: b.readUInt16BE(o + 2), off: cmap + b.readUInt32BE(o + 4) })
  }
  const sub = subs.find((x) => b.readUInt16BE(x.off) === 12) || subs.find((x) => x.pid === 3 && x.eid === 1)
  const gid = (cp) => {
    if (b.readUInt16BE(sub.off) === 12) {
      for (let i = 0, g = b.readUInt32BE(sub.off + 12); i < g; i++) {
        const o = sub.off + 16 + i * 12
        const s = b.readUInt32BE(o), e = b.readUInt32BE(o + 4)
        if (cp >= s && cp <= e) return b.readUInt32BE(o + 8) + (cp - s)
      }
      return 0
    }
    const seg = b.readUInt16BE(sub.off + 6) / 2
    const ends = sub.off + 14, starts = ends + seg * 2 + 2, deltas = starts + seg * 2, ros = deltas + seg * 2
    for (let i = 0; i < seg; i++) {
      const end = b.readUInt16BE(ends + i * 2), start = b.readUInt16BE(starts + i * 2)
      if (cp < start || cp > end) continue
      const delta = b.readInt16BE(deltas + i * 2), ro = b.readUInt16BE(ros + i * 2)
      if (!ro) return (cp + delta) & 0xffff
      const g = b.readUInt16BE(ros + i * 2 + ro + (cp - start) * 2)
      return g ? (g + delta) & 0xffff : 0
    }
    return 0
  }
  const longLoca = b.readInt16BE(tables.head + 50) === 1
  const loca = (g) => (longLoca ? b.readUInt32BE(tables.loca + g * 4) : b.readUInt16BE(tables.loca + g * 2) * 2)
  const yMax = (g) => (loca(g + 1) > loca(g) ? b.readInt16BE(tables.glyf + loca(g) + 8) : 0)
  return { gid, yMax }
}

// [böyük, kiçik]
const PAIRS = [['Ə', 'ə'], ['Ğ', 'ğ'], ['İ', 'i'], ['Ş', 'ş'], ['Ç', 'ç'], ['Ö', 'ö'], ['Ü', 'ü'], ['Ё', 'ё'], ['Ж', 'ж'], ['Ю', 'ю'], ['Я', 'я'], ['Ъ', 'ъ']]

describe('MccInter (Instagram şrifti)', () => {
  for (const [file] of FILES) {
    it(`${file}: Ə (U+018F) və digər böyük hərflər — öz qlifi, böyük hərf hündürlüyü`, () => {
      const f = ttf(file)
      const cap = f.yMax(f.gid(0x48))   // H
      expect(cap).toBeGreaterThan(1000)
      expect(f.gid(0x018f)).toBeGreaterThan(0)
      expect(f.gid(0x018f)).not.toBe(f.gid(0x0259))
      expect(f.yMax(f.gid(0x018f))).toBeGreaterThanOrEqual(cap * 0.97)
      expect(f.yMax(f.gid(0x0259))).toBeLessThan(cap * 0.85)
      for (const [up, low] of PAIRS) {
        const gu = f.gid(up.codePointAt(0)), gl = f.gid(low.codePointAt(0))
        expect(gu, up).toBeGreaterThan(0)
        expect(gu, up).not.toBe(gl)
        expect(f.yMax(gu), up).toBeGreaterThanOrEqual(cap * 0.97)
      }
    })
  }

  it('kerning işləyir (birləşdirmədə GSUB / qlif kopyası yoxdur): AVAV, AYƏ — kern açıq < bağlı', async () => {
    const sharp = card.loadSharp()
    for (const [file, family] of FILES) {
      const w = async (markup) => (await sharp({ text: { text: markup, font: `${family} 60`, fontfile: path.join(DIR, file), rgba: true, dpi: 72 } })
        .raw().toBuffer({ resolveWithObject: true })).info.width
      for (const t of ['AVAVAVAV', 'AYƏ AYƏ']) {
        const on = await w(`<span>${t}</span>`)
        const off = await w(`<span font_features="kern 0">${t}</span>`)
        expect(on, `${file} ${t}`).toBeLessThan(off)
      }
    }
  }, 30000)
})
