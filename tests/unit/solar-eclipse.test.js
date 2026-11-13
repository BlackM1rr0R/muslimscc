import { describe, it, expect } from 'vitest'
import { SOLAR_ECLIPSES } from '../../src/data/solarEclipses.js'
import { localCircumstances, centralPoint, centralLine, obscuration, phaseAt } from '../../src/utils/solarEclipse.js'

const tdMax = (s) => Date.parse(`${s.d}T${s.td}Z`) - s.e[5] * 1000
const get = (d) => SOLAR_ECLIPSES.find(s => s.d === d)

describe('Günəş tutulmaları (Bessel elementləri)', () => {
  it('34 tutulma, 2026–2040, hər birində 28 element', () => {
    expect(SOLAR_ECLIPSES).toHaveLength(34)
    for (const s of SOLAR_ECLIPSES) expect(s.e).toHaveLength(28)
  })
  it('mərkəzi tutulmalar: ən böyük an, faza və müddət NASA cədvəli ilə eyni', () => {
    for (const s of SOLAR_ECLIPSES.filter(x => x.t !== 'P')) {
      const p = centralPoint(s.e, tdMax(s))
      expect(p, s.d).not.toBeNull()
      const lc = localCircumstances(s.e, p.lat, p.lng)
      expect(Math.abs(lc.max - tdMax(s)), s.d).toBeLessThan(3000)          // ±3 san
      expect(lc.mag * 2 - 1).toBeCloseTo(s.mag, 2)                          // Ay/Günəş diametrləri nisbəti
      expect(Math.abs((lc.c3 - lc.c2) / 1000 - s.dur), s.d).toBeLessThanOrEqual(2)
      expect(lc.kind).toBe(s.t === 'H' ? 'T' : s.t)
    }
  })
  it('2027-08-02: ən böyük tutulma Luksor yaxınlığında (NASA: 25°30.4′N 33°10.4′E), Məkkədə tam, Bakıda qismən', () => {
    const s = get('2027-08-02')
    const p = centralPoint(s.e, tdMax(s))
    expect(p.lat).toBeCloseTo(25.507, 1); expect(p.lng).toBeCloseTo(33.173, 1)
    const mk = localCircumstances(s.e, 21.4225, 39.8262)
    expect(mk.kind).toBe('T')
    expect((mk.c3 - mk.c2) / 1000).toBeGreaterThan(290)
    const baku = localCircumstances(s.e, 40.4093, 49.8671)
    expect(baku.kind).toBe('P')
    expect(baku.obsc).toBeGreaterThan(0.2); expect(baku.obsc).toBeLessThan(0.35)
    expect(baku.c1).toBeLessThan(baku.max); expect(baku.max).toBeLessThan(baku.c4)
  })
  it('görünmədiyi yerlər (gecə / kölgədən kənar); mərkəzi xətt Yer üzərindədir', () => {
    const syd = localCircumstances(get('2027-08-02').e, -33.87, 151.21)   // Sidney — gecədir
    expect(!syd || !syd.visible).toBe(true)
    expect(localCircumstances(get('2027-08-02').e, 60, -100)).toBeNull()   // Kanada — kölgədən çox uzaq
    const parts = centralLine(get('2034-03-20').e)
    expect(parts.length).toBeGreaterThan(0)
    for (const [lng, lat] of parts.flat()) { expect(Math.abs(lat)).toBeLessThanOrEqual(90); expect(Math.abs(lng)).toBeLessThanOrEqual(180) }
    expect(centralLine(get('2029-01-14').e)).toHaveLength(0)   // qismən — ox Yerdən yan keçir
  })
  it('örtülmə: kənar hallar', () => {
    expect(obscuration(1.05, 0)).toBe(1)
    expect(obscuration(0.95, 0)).toBeCloseTo(0.9025, 6)
    expect(obscuration(1, 2.1)).toBe(0)
    const o = obscuration(1, 1); expect(o).toBeGreaterThan(0.38); expect(o).toBeLessThan(0.40)
    const p = phaseAt(get('2027-08-02').e, tdMax(get('2027-08-02')), 40.4093, 49.8671)
    expect(p.obsc).toBeGreaterThan(0.2)
  })
})
