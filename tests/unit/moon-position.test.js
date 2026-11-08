import { describe, it, expect } from 'vitest'
import { moonPosition } from '../../src/utils/moonPosition.js'

describe('moonPosition', () => {
  // İstinad: SunCalc (eyni alqoritm) — Kiyev, 2013-03-05 00:00 UTC: azimut −0.97 rad (cənubdan), hündürlük 0.0145 rad
  it('SunCalc-ın sənədləşdirilmiş nümunəsi ilə uyğun gəlir', () => {
    const p = moonPosition(new Date('2013-03-05UTC'), 50.5, 30.5)
    const azFromSouth = (p.az - 180) * Math.PI / 180
    expect(azFromSouth).toBeCloseTo(-0.9783999522438226, 2)
    expect(p.alt * Math.PI / 180).toBeCloseTo(0.014551482243892251, 2)
  })
  it('dəyərlər aralıqdadır', () => {
    const p = moonPosition(new Date('2026-11-08T15:00:00Z'), 40.4, 49.87)
    expect(p.az).toBeGreaterThanOrEqual(0); expect(p.az).toBeLessThan(360)
    expect(Math.abs(p.alt)).toBeLessThanOrEqual(90)
  })
})
