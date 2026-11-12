import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { QURAN_ANIMALS, plainAr } from '../../src/data/quranAnimals'

const R = JSON.parse(fs.readFileSync('public/data/quran-roots.json', 'utf8')).roots
const Q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
const META = JSON.parse(fs.readFileSync('seo-data/quran/meta.json', 'utf8'))
// "s:a:w,a:w,s:a:w" → [[s,a,w], …]
const expand = (str) => { let s = 0; return String(str).split(',').map(t => { const p = t.split(':').map(Number); if (p.length === 3) { s = p[0]; return p } return [s, p[0], p[1]] }) }
const locsOf = (a) => (R[a.root] || []).filter(e => (a.exact ? e[0].normalize('NFC') === a.exact.normalize('NFC') : a.lemmas.includes(plainAr(e[0])))).flatMap(e => expand(e[3]))

describe('Quranda heyvanlar — Quranic Arabic Corpus ilə yoxlama', () => {
  for (const a of QURAN_ANIMALS) {
    it(`${a.id}: say ${a.count}, ${a.ref} ayəsində keçir`, () => {
      const locs = locsOf(a)
      expect(locs.length).toBe(a.count)
      const [s, n] = a.ref.split(':').map(Number)
      expect(locs.some(([x, y]) => x === s && y === n)).toBe(true)
    })
  }
  it('id-lər təkrarlanmır, adlar 5 dildə var', () => {
    expect(new Set(QURAN_ANIMALS.map(a => a.id)).size).toBe(QURAN_ANIMALS.length)
    for (const a of QURAN_ANIMALS) for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(a.name[l]).toBeTruthy()
  })
  it('surə adı heyvanın adıdır (Bəqərə, Nəhl, Nəml, Ənkəbut, Fil)', () => {
    const named = QURAN_ANIMALS.filter(a => a.surah)
    expect(named.map(a => a.surah).sort((x, y) => x - y)).toEqual([2, 16, 27, 29, 105])
    for (const a of named) expect(plainAr(META[a.surah - 1].name)).toContain(a.lemmas[0])
  })
  it('public/data/quran-animals — ərəb mətni Osmani nəşri ilə hərfi-hərfinə eynidir, tərcümələr boş deyil', () => {
    const files = fs.readdirSync('public/data/quran-animals')
    expect(files.length).toBeGreaterThanOrEqual(45)
    const az = JSON.parse(fs.readFileSync('public/data/quran-animals/az.json', 'utf8'))
    for (const a of QURAN_ANIMALS) {
      const [s, n] = a.ref.split(':').map(Number)
      expect(az.ar[a.ref]).toBe(Q.ayahs[s - 1][n - 1].replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', ''))
      expect(az.tr[a.ref].length).toBeGreaterThan(10)
    }
  })
})
