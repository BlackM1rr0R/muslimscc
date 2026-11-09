import { describe, it, expect } from 'vitest'
import {
  surahRows, juzAyahs, quranTotals, surahSeries, readCoverage, hijriCentury, scholarsByCentury,
  lifespans, decadeBuckets, monthDurations, yearExtremes, bookSectionStats, citeCounts,
} from '../../src/utils/numbersData.js'

describe('numbersData — Quran', () => {
  it('114 surə, 6236 ayə; Məkki + Mədəni cəmi tutur', () => {
    const t = quranTotals()
    expect(surahRows()).toHaveLength(114)
    expect(t.ayahs).toBe(6236)
    expect(t.makki.surahs + t.madani.surahs).toBe(114)
    expect(t.makki.ayahs + t.madani.ayahs).toBe(6236)
    expect(t.longest[0]).toMatchObject({ n: 2, ayahs: 286 })
    expect(t.shortest[0].ayahs).toBe(3)
  })
  it('30 cüzün cəmi 6236 ayədir', () => {
    const j = juzAyahs()
    expect(j).toHaveLength(30)
    expect(j.reduce((a, b) => a + b, 0)).toBe(6236)
    expect(j[0]).toBe(148) // Fatihə 7 + Bəqərə 1–141
  })
  it('seriyalar: nazil olma sırasında ilk surə Ələqdir (96), hər nöqtədə yalnız bir yer', () => {
    const r = surahSeries('revelation')
    expect(r.nums[0]).toBe(96)
    expect(r.nums).toHaveLength(114)
    r.makki.forEach((v, i) => expect(v === 0 || r.madani[i] === 0).toBe(true))
    expect(surahSeries('mushaf').nums[0]).toBe(1)
  })
  it('oxu əhatəsi səhv açarları atır', () => {
    expect(readCoverage({ 1: 2, 112: 1, 999: 4, x: 1, 3: 0 })).toEqual({ surahs: 2, ayahs: 11 })
    expect(readCoverage(null)).toEqual({ surahs: 0, ayahs: 0 })
  })
})

describe('numbersData — insanlar', () => {
  const S = [
    { era: 'a', born: { h: 93 }, died: { h: 179 } },
    { era: 'a', born: { h: 164 }, died: { h: 241 } },
    { era: 'b', born: { h: 1330, approx: true }, died: { h: 1420 } },
    { era: 'b', born: { h: 1354 } },
  ]
  it('hicri əsr', () => {
    expect(hijriCentury(-3)).toBe(1)
    expect(hijriCentury(100)).toBe(1)
    expect(hijriCentury(101)).toBe(2)
    expect(hijriCentury(1420)).toBe(15)
  })
  it('əsrlər üzrə dövr seriyaları', () => {
    const r = scholarsByCentury(S, ['a', 'b'])
    expect(r.centuries).toHaveLength(15)
    expect(r.byEra.a[1]).toBe(1)
    expect(r.byEra.a[2]).toBe(1)
    expect(r.byEra.b[13] + r.byEra.b[14]).toBe(2)
  })
  it('ömürlər — yalnız hər iki tarix məlumdursa, uzundan qısaya', () => {
    const l = lifespans(S)
    expect(l.map(x => x.years)).toEqual([90, 86, 77])
    expect(l[0].approx).toBe(true)
  })
  it('onilliklər', () => {
    expect(decadeBuckets([-3, 11, 13, 57])).toEqual([
      { from: -10, to: -1, count: 1 }, { from: 0, to: 9, count: 0 }, { from: 10, to: 19, count: 2 },
      { from: 20, to: 29, count: 0 }, { from: 30, to: 39, count: 0 }, { from: 40, to: 49, count: 0 }, { from: 50, to: 59, count: 1 },
    ])
    expect(decadeBuckets([])).toEqual([])
  })
})

describe('numbersData — namaz və hədis', () => {
  const days = [
    { m: 1, day: 1, fajr: 360, sunrise: 480, dhuhr: 750, asr: 900, maghrib: 1020, isha: 1110 },
    { m: 1, day: 2, fajr: 358, sunrise: 478, dhuhr: 750, asr: 902, maghrib: 1022, isha: 1112 },
    { m: 6, day: 1, fajr: 200, sunrise: 330, dhuhr: 780, asr: 1000, maghrib: 1230, isha: 1350 },
  ]
  it('ay üzrə orta müddətlər', () => {
    expect(monthDurations(days, 1)).toEqual({ day: 542, fast: 662, night: 778, dawn: 120, dusk: 90 })
    expect(monthDurations(days, 3)).toBeNull()
  })
  it('il ekstremumları', () => {
    const e = yearExtremes(days)
    expect(e.long).toBe(days[2])
    expect(e.short).toBe(days[0])
    expect(e.spread).toBe(900 - 540)
    expect(yearExtremes([])).toBeNull()
  })
  it('kitab bölmələri və istinadlar', () => {
    const cnt = (s) => (s[4] != null ? s[4] : s[3] - s[2] + 1)
    const st = bookSectionStats({ sections: [[0, '', 0, 0, 5], [1, 'A', 1, 10], [2, 'B', 11, 40]] }, cnt)
    expect(st).toEqual({ sections: 2, avg: 20, top: { n: 2, name: 'B', count: 30 } })
    expect(citeCounts(['al-Bukhari 1, Muslim 2', 'Muslim 8'], { b: /Bukhari/, m: /Muslim/ })).toEqual({ b: 1, m: 2 })
  })
})
