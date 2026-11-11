import { describe, it, expect } from 'vitest'
import { SCHOLARS } from '../../src/data/scholars'
import { PLACE_AT } from '../../src/data/scholarPlaces'

describe('scholarPlaces — kartdakı hər yerin koordinatı var', () => {
  for (const s of SCHOLARS) {
    it(s.slug, () => {
      for (const p of [s.birthplace?.en, s.city?.en].filter(Boolean)) {
        expect(PLACE_AT[p], p).toBeTruthy()
        const [la, lo] = PLACE_AT[p]
        expect(la).toBeGreaterThan(10); expect(la).toBeLessThan(45)
        expect(lo).toBeGreaterThan(-20); expect(lo).toBeLessThan(70)
      }
    })
  }
})
