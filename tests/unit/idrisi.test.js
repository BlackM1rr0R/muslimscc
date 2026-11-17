import { describe, it, expect } from 'vitest'
import { CLIMATES, IDRISI_CITIES, IDRISI_EXTENT, climateOf, sectionOf, sectionLines, roman } from '../../src/utils/idrisi.js'

describe('əl-İdrisi: yeddi iqlim', () => {
  it('zolaqlar ekvatordan 64°-ə qədər boşluqsuz və artan', () => {
    expect(CLIMATES).toHaveLength(7)
    expect(CLIMATES[0].south).toBe(0)
    expect(CLIMATES[6].north).toBe(IDRISI_EXTENT.north)
    for (let i = 1; i < CLIMATES.length; i++) expect(CLIMATES[i].south).toBe(CLIMATES[i - 1].north)
    for (const c of CLIMATES) {
      expect(c.centre).toBeGreaterThan(c.south)
      expect(c.centre).toBeLessThan(c.north)
    }
  })
  it('climateOf: sərhədlər və kənar qiymətlər', () => {
    expect(climateOf(0)).toBe(1)
    expect(climateOf(20.5)).toBe(2)
    expect(climateOf(36)).toBe(4)
    expect(climateOf(64)).toBe(7)
    expect(climateOf(-1)).toBeNull()
    expect(climateOf(70)).toBeNull()
    expect(climateOf(NaN)).toBeNull()
  })
  it('şəhərlər: Məkkə II, Qahirə III, Palermo IV, Konstantinopol V', () => {
    const c = (id) => climateOf(IDRISI_CITIES.find(x => x.id === id).lat)
    expect(c('mecca')).toBe(2)
    expect(c('cairo')).toBe(3)
    expect(c('palermo')).toBe(4)
    expect(c('constantinople')).toBe(5)
  })
  it('sectionOf: 10 hissə qərbdən şərqə', () => {
    expect(sectionOf(IDRISI_EXTENT.west)).toBe(1)
    expect(sectionOf(IDRISI_EXTENT.east)).toBe(10)
    expect(sectionOf(-30)).toBeNull()
    expect(sectionLines()).toHaveLength(11)
    for (const city of IDRISI_CITIES) expect(sectionOf(city.lng)).toBeGreaterThanOrEqual(1)
  })
  it('şəhər adları 5 dildə, Roma rəqəmləri', () => {
    expect(IDRISI_CITIES).toHaveLength(10)
    for (const city of IDRISI_CITIES) for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(city.name[l]).toBeTruthy()
    expect(roman(7)).toBe('VII')
  })
})
