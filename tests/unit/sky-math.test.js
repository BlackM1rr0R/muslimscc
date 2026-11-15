import { describe, it, expect } from 'vitest'
import { planetEquatorial, galacticEquator, project, bodiesNow } from '../../src/utils/skyMath.js'

const sep = (a, b) => {
  const R = Math.PI / 180
  return Math.acos(Math.sin(a.dec * R) * Math.sin(b.dec * R) + Math.cos(a.dec * R) * Math.cos(b.dec * R) * Math.cos((a.ra - b.ra) * R)) / R
}

describe('planetari riyaziyyatı', () => {
  it('planetlər JPL Horizons-a yaxın (≤ 0.5°)', () => {
    // 2024-01-01 00:00 UT, JPL Horizons (geosentrik, ICRF, RA/Dec °)
    const ms = Date.UTC(2024, 0, 1)
    const ref = { mercury: [261.43838, -20.13226], venus: [240.61023, -18.70317], mars: [266.69554, -23.95204], jupiter: [33.36146, 12.15114], saturn: [335.46343, -11.95793] }
    for (const [p, [ra, dec]] of Object.entries(ref)) expect(sep(planetEquatorial(p, ms), { ra, dec })).toBeLessThan(0.5)
  })
  it('Süd Yolu xətti Qalaktika mərkəzindən keçir (Sgr A*: 266.4°, −28.9°)', () => {
    const pts = galacticEquator(1)
    const best = Math.min(...pts.map(([ra, dec]) => sep({ ra, dec }, { ra: 266.4, dec: -28.94 })))
    expect(best).toBeLessThan(1.5)
  })
  it('proyeksiya: baxış mərkəzi ekranın ortasıdır, arxa tərəf görünmür', () => {
    const view = { az: 120, alt: 30, fov: 90 }
    const [x, y] = project(30, 120, view, 800, 600)
    expect(Math.abs(x - 400)).toBeLessThan(0.01)
    expect(Math.abs(y - 300)).toBeLessThan(0.01)
    expect(project(-30, 300, view, 800, 600)).toBeNull()
  })
  it('göy cisimləri: Günəş, Ay, 5 planet', () => {
    expect(bodiesNow(Date.UTC(2026, 10, 15, 12), 40.4, 49.9).map(b => b.id)).toEqual(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'])
  })
})
