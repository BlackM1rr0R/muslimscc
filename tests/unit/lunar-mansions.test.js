import { describe, it, expect } from 'vitest'
import {
  MANSION_COUNT, MANSION_SPAN, BETA_ARI_LON_J2000, anchorLon, precessLon, mansionAt, wrapIndex,
  mansionStartLon, moonState, nextMansionEntry, eclLonJ2000,
} from '../../src/utils/lunarMansions'
import { moonEcliptic } from '../../src/utils/lunar'
import { LUNAR_MANSIONS } from '../../src/data/lunarMansions'

const J2000 = Date.UTC(2000, 0, 1, 12)

describe('Ay mənzilləri — məlumat', () => {
  it('28 mənzil, hamısında ərəbcə ad, transliterasiya və 5 dildə məna', () => {
    expect(LUNAR_MANSIONS).toHaveLength(28)
    for (const m of LUNAR_MANSIONS) {
      expect(m.name).toMatch(/[؀-ۿ]/)
      expect(m.translit.length).toBeGreaterThan(3)
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(m.mean[l]).toBeTruthy()
    }
    expect(LUNAR_MANSIONS[0].translit).toBe('al-Sharaṭān')
    expect(LUNAR_MANSIONS[27].translit).toMatch(/Baṭn al-Ḥūt/)
  })
})

describe('Ay mənzilləri — hesab', () => {
  it('bir mənzil 12°51′26″', () => {
    expect(MANSION_SPAN * 3600).toBeCloseTo(12 * 3600 + 51 * 60 + 25.714, 2)
  })

  it('β Ari J2000 ekliptik uzunluğu ≈ 33.97°', () => {
    // Hipparcos: α = 1h54m38.41s, δ = +20°48′28.9″
    const lon = eclLonJ2000((1 + 54 / 60 + 38.41 / 3600) * 15, 20 + 48 / 60 + 28.9 / 3600)
    expect(Math.abs(lon - BETA_ARI_LON_J2000)).toBeLessThan(0.01)
  })

  it('presessiya: J2000-də lövbər = β Ari, 100 ildə ~1.397°, ildə ~50.29″', () => {
    expect(anchorLon(J2000)).toBeCloseTo(BETA_ARI_LON_J2000, 6)
    const yr = 365.25 * 86400000
    expect((anchorLon(J2000 + 100 * yr) - anchorLon(J2000)) * 3600 / 100).toBeCloseTo(50.29, 1)
    expect(precessLon(0, J2000 + 100 * yr)).toBeCloseTo(1.39697, 4)
  })

  it('indeks 0..27 aralığında, sərhədlər və dövrə', () => {
    const ms = J2000, a = anchorLon(ms)
    expect(mansionAt(a, ms).index).toBe(0)
    expect(mansionAt(a + 1e-6, ms).progress).toBeLessThan(1e-6)
    expect(mansionAt(a - 1e-6, ms).index).toBe(27)
    expect(mansionAt(a + MANSION_SPAN + 1e-6, ms).index).toBe(1)
    expect(mansionAt(a + MANSION_SPAN - 1e-6, ms).index).toBe(0)
    expect(mansionAt(a + 13.5 * MANSION_SPAN, ms)).toMatchObject({ index: 13 })
    expect(mansionAt(a + 13.5 * MANSION_SPAN, ms).progress).toBeCloseTo(0.5, 9)
    for (let lon = 0; lon < 360; lon += 0.37) {
      const { index, progress } = mansionAt(lon, ms)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(MANSION_COUNT)
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThan(1)
    }
    expect(wrapIndex(-1)).toBe(27)
    expect(wrapIndex(28)).toBe(0)
    expect(wrapIndex(57)).toBe(1)
    expect(mansionStartLon(28, ms)).toBeCloseTo(a, 9)
  })

  it('bədirdə (2024-01-25 17:54 UT) Ay Günəşdən ~180°, mənzil fərqi ~14', () => {
    const s = moonState(Date.UTC(2024, 0, 25, 17, 54))
    expect(s.illum).toBeGreaterThan(0.99)
    const d = wrapIndex(s.index - s.sun.index)
    expect(d).toBeGreaterThanOrEqual(13)
    expect(d).toBeLessThanOrEqual(15)
  })

  it('təzə ayda (2024-01-11 11:57 UT) işıqlanma ~0, mənzil Günəşinki ilə eyni və ya qonşu', () => {
    const s = moonState(Date.UTC(2024, 0, 11, 11, 57))
    expect(s.illum).toBeLessThan(0.01)
    expect([0, 1, 27]).toContain(wrapIndex(s.index - s.sun.index))
  })

  it('Spica (α Vir) öz mənzilində — əs-Simak (14-cü, indeks 13)', () => {
    // Spica J2000: α = 13h25m11.6s, δ = −11°09′41″
    const lon = precessLon(eclLonJ2000((13 + 25 / 60 + 11.6 / 3600) * 15, -(11 + 9 / 60 + 41 / 3600)), Date.UTC(2026, 10, 16))
    expect(mansionAt(lon, Date.UTC(2026, 10, 16)).index).toBe(13)
  })

  it('növbəti mənzilə giriş: 2 gündən tez, sonra indeks dəyişir', () => {
    const t0 = Date.UTC(2026, 10, 16, 0)
    const i0 = mansionAt(moonEcliptic(t0).lon, t0).index
    const t1 = nextMansionEntry(t0)
    expect(t1).toBeGreaterThan(t0)
    expect(t1 - t0).toBeLessThan(30 * 3600000)
    expect(mansionAt(moonEcliptic(t1 + 120000).lon, t1 + 120000).index).toBe(wrapIndex(i0 + 1))
    expect(mansionAt(moonEcliptic(t1 - 120000).lon, t1 - 120000).index).toBe(i0)
  })
})
