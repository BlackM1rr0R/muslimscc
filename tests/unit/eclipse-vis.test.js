import { describe, it, expect } from 'vitest'
import { LUNAR_ECLIPSES } from '../../src/data/lunarEclipses'
import { phases, visibility, upcoming, moonAlt } from '../../src/utils/eclipseVis'
import { moonEcliptic, sunEcliptic } from '../../src/utils/lunar'

const BAKU = [40.41, 49.87]
const byDate = (d) => LUNAR_ECLIPSES.find(e => e.d === d)

describe('Ay tutulmaları (NASA cədvəli)', () => {
  it('hər tutulmada Ay Günəşin tam əksindədir (bütöv Ay, ±1.5°) və ekliptikaya yaxındır', () => {
    for (const e of LUNAR_ECLIPSES) {
      const { max } = phases(e)
      const m = moonEcliptic(max), s = sunEcliptic(max)
      const diff = Math.abs((((m.lon - s.lon) % 360) + 360) % 360 - 180)
      expect(diff).toBeLessThan(1.5)
      expect(Math.abs(m.lat)).toBeLessThan(1.2)
    }
  })
  it('tam tutulmada tam faza qismən fazanın içindədir; qismənlərdə tam faza yoxdur', () => {
    for (const e of LUNAR_ECLIPSES) {
      const p = phases(e)
      if (e.t === 'T') { expect(p.u2).toBeGreaterThan(p.u1); expect(p.u3).toBeLessThan(p.u4); expect(e.mag).toBeGreaterThan(1) }
      else { expect(p.u2).toBeNull(); expect(e.mag).toBeLessThan(1) }
    }
  })
  it('2028-12-31 (16:52 UT) Bakıda görünür, 2026-03-03 (11:34 UT) Bakıda görünmür', () => {
    expect(visibility(byDate('2028-12-31'), ...BAKU).kind).not.toBe('none')
    expect(visibility(byDate('2026-03-03'), ...BAKU).kind).toBe('none')
    // Nyu-York: 2026-03-03 səhər tezdən — görünür
    expect(visibility(byDate('2026-03-03'), 40.71, -74.0).kind).not.toBe('none')
  })
  it('gələcək siyahı: 2026-11-12-dən sonra 2026 tutulmaları yoxdur, birincisi 2028-01-12', () => {
    const u = upcoming(Date.UTC(2026, 10, 12))
    expect(u[0].d).toBe('2028-01-12')
    expect(u.length).toBe(LUNAR_ECLIPSES.length - 2)
  })
  it('Ayın hündürlüyü −90…90', () => {
    const a = moonAlt(Date.UTC(2028, 11, 31, 17), ...BAKU)
    expect(a).toBeGreaterThan(-90); expect(a).toBeLessThan(90)
  })
})
