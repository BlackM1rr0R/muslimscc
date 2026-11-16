// Quran şəhəri (utils/quranCity.js) — tərtibat və oxunan surələrin sayı
import { describe, it, expect } from 'vitest'
import { SURAH_TABLE } from '../../src/data/mushafIndex.js'
import { REVELATION_PLACE } from '../../src/data/surahRevelation.js'
import { buildCity, bodyHeight, crownOf, readLitSurahs, splitRows, makeStars, CROWNS, GROUND, STATS_KEY } from '../../src/utils/quranCity.js'

const fakeStorage = (obj) => ({ getItem: (k) => (k in obj ? obj[k] : null) })

describe('Quran şəhəri — tərtibat', () => {
  const city = buildCity(SURAH_TABLE, REVELATION_PLACE)
  it('114 bina, 1-dən 114-ə sıra ilə, üst-üstə düşmür', () => {
    expect(city.towers).toHaveLength(114)
    city.towers.forEach((t, i) => {
      expect(t.n).toBe(i + 1)
      expect(t.ayahs).toBe(SURAH_TABLE[i][2])
      expect(t.medinan).toBe(REVELATION_PLACE[i] === 1)
      if (i) expect(t.x).toBeGreaterThan(city.towers[i - 1].x + city.towers[i - 1].w)
    })
    expect(city.width).toBeGreaterThan(city.towers[113].x + city.towers[113].w)
    expect(city.top).toBeGreaterThan(0)
    expect(city.top).toBeLessThan(GROUND)
  })
  it('hündürlük ayə sayı ilə monoton artır', () => {
    const byAyah = [...city.towers].sort((a, b) => a.ayahs - b.ayahs)
    for (let i = 1; i < byAyah.length; i++) {
      if (byAyah[i].ayahs > byAyah[i - 1].ayahs) expect(byAyah[i].h).toBeGreaterThan(byAyah[i - 1].h)
      else expect(byAyah[i].h).toBe(byAyah[i - 1].h)
    }
    for (let a = 1; a < 300; a++) expect(bodyHeight(a + 1)).toBeGreaterThan(bodyHeight(a))
    // Bəqərə ən uca, 3 ayəli surələr ən alçaq
    const max = Math.max(...city.towers.map(t => t.h))
    expect(city.towers[1].h).toBe(max)
    expect(city.towers[107].h).toBe(Math.min(...city.towers.map(t => t.h)))
  })
  it('tac qəti qaydadır, 5 növün hamısı var; path-lər sonludur', () => {
    const seen = new Set(city.towers.map(t => t.crown))
    expect([...seen].sort()).toEqual([...CROWNS].sort())
    for (const t of city.towers) {
      expect(t.crown).toBe(crownOf(t.n, t.ayahs))
      expect(t.d).not.toMatch(/NaN|undefined/)
      expect(t.win).not.toMatch(/NaN|undefined/)
      expect(t.windows).toBeGreaterThan(0)
    }
    expect(buildCity(SURAH_TABLE, REVELATION_PLACE).towers.map(t => t.d)).toEqual(city.towers.map(t => t.d))
  })
  it('ixrac sıraları 114 surəni bir dəfə əhatə edir', () => {
    const rows = splitRows()
    expect(rows.flat()).toEqual(Array.from({ length: 114 }, (_, i) => i + 1))
    const sub = buildCity(SURAH_TABLE, REVELATION_PLACE, rows[2])
    expect(sub.towers[0].n).toBe(rows[2][0])
  })
  it('ulduzlar qətidir', () => {
    expect(makeStars(20, 100, 50)).toEqual(makeStars(20, 100, 50))
    for (const s of makeStars(50, 100, 50)) { expect(s.x).toBeLessThanOrEqual(100); expect(s.y).toBeLessThanOrEqual(50) }
  })
})

describe('Quran şəhəri — işıqlı pəncərələr (quran_stats)', () => {
  it('reads açarlarından sayılır', () => {
    const st = fakeStorage({ [STATS_KEY]: JSON.stringify({ reads: { 1: 3, 18: 1, 36: 2, 114: 1 }, sessions: 7, dates: [] }) })
    const lit = readLitSurahs(st)
    expect(lit.size).toBe(4)
    expect([...lit].sort((a, b) => a - b)).toEqual([1, 18, 36, 114])
  })
  it('səhv açarlar, sıfır və pozuq yaddaş nəzərə alınmır', () => {
    expect(readLitSurahs(fakeStorage({ [STATS_KEY]: JSON.stringify({ reads: { 0: 1, 115: 1, x: 1, 2: 0, 5: 1 } }) })).size).toBe(1)
    expect(readLitSurahs(fakeStorage({ [STATS_KEY]: '{bad' })).size).toBe(0)
    expect(readLitSurahs(fakeStorage({ [STATS_KEY]: '[1,2]' })).size).toBe(0)
    expect(readLitSurahs(fakeStorage({})).size).toBe(0)
    expect(readLitSurahs({ getItem: () => { throw new Error('blocked') } }).size).toBe(0)
  })
})
