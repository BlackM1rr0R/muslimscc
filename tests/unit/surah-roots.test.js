// Surənin kök buludu (utils/surahRoots)
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { surahRoots } from '../../src/utils/surahRoots.js'

const { roots } = JSON.parse(fs.readFileSync('public/data/quran-roots.json', 'utf8'))

describe('surahRoots', () => {
  it('Rəhman surəsi: «فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ» (31 dəfə) — رب, آلاء, تكذيب kökləri öndə', () => {
    const top = surahRoots(roots, 55, 5)
    expect(top.slice(0, 4).map(x => x.root)).toEqual(expect.arrayContaining(['ربب', 'كذب', 'ألو']))
    expect(top.length).toBe(5)
  })
  it('köməkçi köklər çıxarılıb; sıralı; boş surə yoxdur', () => {
    const all = surahRoots(roots, 2, 50)
    expect(all.some(x => x.root === 'قول' || x.root === 'كون')).toBe(false)
    for (let i = 1; i < all.length; i++) expect(all[i - 1].n).toBeGreaterThanOrEqual(all[i].n)
    expect(surahRoots(roots, 999)).toEqual([])
  })
})
