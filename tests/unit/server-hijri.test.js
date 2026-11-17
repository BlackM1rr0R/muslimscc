// server/hijri.js — src/utils/hijri.js-in CommonJS surəti: eyni alqoritm, eyni nəticə
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as site from '../../src/utils/hijri.js'

const srv = createRequire(import.meta.url)('../../server/hijri.js')

describe('server/hijri.js ≡ src/utils/hijri.js', () => {
  it('surət qeydi var', () => {
    expect(readFileSync('server/hijri.js', 'utf8')).toContain('SURƏT (CommonJS): src/utils/hijri.js')
  })
  it('miladi → hicri: 1990–2060 arası hər 3-cü gün eynidir', () => {
    let g = { year: 1990, month: 1, day: 1 }
    let n = 0
    while (g.year < 2060) {
      expect(srv.gregorianToHijri(g)).toEqual(site.gregorianToHijri(g))
      g = site.addGDays(g, 3); n++
    }
    expect(n).toBeGreaterThan(8000)
  })
  it('hicri → miladi və ay uzunluğu: 1410–1480 hər ay', () => {
    for (let y = 1410; y <= 1480; y++) {
      for (let m = 1; m <= 12; m++) {
        expect(srv.hijriMonthLength(y, m)).toBe(site.hijriMonthLength(y, m))
        for (const d of [1, 15, 29, 30]) expect(srv.hijriToGregorian({ year: y, month: m, day: d })).toEqual(site.hijriToGregorian({ year: y, month: m, day: d }))
      }
    }
  })
  it('köməkçilər', () => {
    expect(srv.parseGKey('2026-02-29')).toBeNull()
    expect(srv.gKey(srv.addGDays({ year: 2026, month: 12, day: 31 }, 1))).toBe('2027-01-01')
    expect(srv.gDiffDays({ year: 2026, month: 1, day: 1 }, { year: 2027, month: 1, day: 1 })).toBe(365)
  })
})
