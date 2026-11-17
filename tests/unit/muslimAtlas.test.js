import { describe, it, expect } from 'vitest'
import { MP_COUNTRIES, MP_REGIONS, MP_SOURCE, MP_YEARS } from '../../src/data/muslimPopulation'
import {
  binIndex, shareClass, changeClass, radiusFor, changeOf, topN, worldTotals, maxMuslims,
  shapeIso3, countryByIso3, countryName, fmtPct, fmtCompact, SHARE_BINS,
} from '../../src/utils/muslimAtlas'

describe('muslimPopulation data (Pew Research Center)', () => {
  it('has the source recorded', () => {
    expect(MP_SOURCE.publisher).toBe('Pew Research Center')
    expect(MP_SOURCE.url).toMatch(/^https:\/\/www\.pewresearch\.org\//)
    expect(MP_SOURCE.tableUrl).toMatch(/religious-composition-by-country-2010-2020/)
    expect(MP_YEARS).toEqual([2010, 2020])
  })
  it('has 201 countries with unique ISO3 codes and both years', () => {
    expect(MP_COUNTRIES).toHaveLength(201)
    expect(new Set(MP_COUNTRIES.map((c) => c.iso3)).size).toBe(201)
    for (const c of MP_COUNTRIES) {
      expect(c.iso3).toMatch(/^[A-Z]{3}$/)
      for (const y of MP_YEARS) {
        expect(c[y].muslims).toBeGreaterThanOrEqual(0)
        expect(c[y].muslims).toBeLessThanOrEqual(c[y].pop)
        // Pew rounds shares to 0.1 (below 0.1% shows as 0)
        expect(Math.abs((c[y].muslims / c[y].pop) * 100 - c[y].pct)).toBeLessThan(0.1)
      }
    }
  })
  it('country Muslim counts add up to Pew world totals', () => {
    for (const y of MP_YEARS) {
      const sum = MP_COUNTRIES.reduce((a, c) => a + c[y].muslims, 0)
      expect(Math.abs(sum - MP_REGIONS.world[y][1])).toBeLessThanOrEqual(2)
    }
    expect(worldTotals(2020).pct).toBe(25.6)
    expect(worldTotals(2010).pct).toBe(23.9)
  })
})

describe('muslimAtlas utils', () => {
  it('bins shares and changes', () => {
    expect(binIndex(NaN, SHARE_BINS)).toBe(-1)
    expect(shareClass(0)).toBe(0)
    expect(shareClass(1)).toBe(1)
    expect(shareClass(49.9)).toBe(4)
    expect(shareClass(99.7)).toBe(7)
    expect(changeClass(-6)).toBe(0)
    expect(changeClass(0)).toBe(3)
    expect(changeClass(2)).toBe(5)
    expect(changeClass(10)).toBe(6)
  })
  it('sizes circles by area', () => {
    expect(radiusFor(0, 100)).toBe(0)
    expect(radiusFor(100, 100, 20)).toBe(20)
    expect(radiusFor(25, 100, 20)).toBe(10)
  })
  it('computes change 2010 → 2020', () => {
    const ch = changeOf(countryByIso3('IDN'))
    expect(ch.abs).toBe(countryByIso3('IDN')[2020].muslims - countryByIso3('IDN')[2010].muslims)
    expect(ch.pp).toBe(-0.5)
    expect(changeOf(null)).toBeNull()
  })
  it('ranks top countries', () => {
    expect(topN('muslims', 2020, 3).map((c) => c.iso3)).toEqual(['IDN', 'PAK', 'IND'])
    expect(topN('pct', 2020, 10)).toHaveLength(10)
    const g = topN('growth', 2020, 5)
    expect(changeOf(g[0]).abs).toBeGreaterThanOrEqual(changeOf(g[4]).abs)
    expect(maxMuslims(2020)).toBe(countryByIso3('IDN')[2020].muslims)
  })
  it('maps world-atlas shapes to ISO3', () => {
    expect(shapeIso3('031', 'Azerbaijan')).toBe('AZE')
    expect(shapeIso3(31, 'Azerbaijan')).toBe('AZE')
    expect(shapeIso3(undefined, 'Kosovo')).toBe('XKX')
    expect(shapeIso3(undefined, 'N. Cyprus')).toBe('CYP')
    expect(shapeIso3('010', 'Antarctica')).toBeNull()
  })
  it('localises country names with English fallback', () => {
    const aze = countryByIso3('AZE')
    expect(countryName(aze, 'en')).toBe('Azerbaijan')
    expect(countryName(countryByIso3('CHI'), 'ru')).toBe('Channel Islands')
    expect(countryName(null)).toBe('')
    expect(fmtPct(25.6, 'en')).toBe('25.6%')
    expect(fmtPct(2, 'en', true)).toBe('+2%')
    expect(fmtCompact(2022590461, 'en', 2)).toBe('2.02bn')
    expect(fmtCompact(-35700000, 'en')).toBe('-35.7m')
    expect(fmtCompact(950, 'en')).toBe('950')
  })
})
