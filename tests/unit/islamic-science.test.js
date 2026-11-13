import { describe, it, expect } from 'vitest'
import { SCIENTISTS, SCIENCE_FIELDS } from '../../src/data/islamicScientists.js'

describe('Elm adamları', () => {
  it('14 alim, 5 dildə ad və fakt, düzgün illər və koordinatlar', () => {
    expect(SCIENTISTS).toHaveLength(14)
    expect(new Set(SCIENTISTS.map(s => s.id)).size).toBe(14)
    for (const s of SCIENTISTS) {
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) { expect(s.name[l], s.id + l).toBeTruthy(); expect(s.fact[l], s.id + l).toBeTruthy(); expect(s.city.name[l]).toBeTruthy() }
      expect(s.born).toBeLessThan(s.died)
      expect(s.born).toBeGreaterThanOrEqual(750); expect(s.died).toBeLessThanOrEqual(1400)
      expect(SCIENCE_FIELDS[s.field]).toBeTruthy()
      expect(Math.abs(s.city.lat)).toBeLessThan(60); expect(s.city.lng).toBeGreaterThan(-20); expect(s.city.lng).toBeLessThan(80)
      expect(s.work).toMatch(/[؀-ۿ]/)
    }
  })
  it('Biruni düsturu: R = h·cosθ/(1−cosθ) həqiqi Yer üçün özünü qaytarır', () => {
    const R = 6371000, h = 320, th = Math.acos(R / (R + h))
    expect((h * Math.cos(th)) / (1 - Math.cos(th))).toBeCloseTo(R, -1)
  })
  it('Xarəzmi: x² + 10x = 39 → x = 3', () => {
    const x = Math.sqrt(39 + 25) - 5
    expect(x).toBe(3)
  })
})
