import { describe, it, expect } from 'vitest'
import { placeLabels, project, subsolarLon, moonPhase, isLit, sunAltitude, nightPath, circlePath, kmToDeg, isNearSide, fmtCoord, wrap180 } from '../../src/utils/moonCraters'
import { MOON_CRATERS, MOON_MARIA, MOON_CRATERS_SOURCE } from '../../src/data/moonCraters'

describe('moonCraters utils', () => {
  it('projects the near-side centre to the disk centre and the east limb to +x', () => {
    const c = project(0, 0, 0)
    expect(c.x).toBeCloseTo(0); expect(c.y).toBeCloseTo(0); expect(c.visible).toBe(true)
    const e = project(0, 90, 0)
    expect(e.x).toBeCloseTo(1); expect(e.z).toBeCloseTo(0)
    expect(project(90, 0, 0).y).toBeCloseTo(1)
    expect(project(0, 180, 0).visible).toBe(false)
    expect(project(0, 180, 180).visible).toBe(true)
  })

  it('subsolar longitude follows the phase', () => {
    // 2024-01-25 17:54 UTC — bədr; 2024-01-11 11:57 UTC — təzə ay
    const full = Date.UTC(2024, 0, 25, 17, 54)
    const fresh = Date.UTC(2024, 0, 11, 11, 57)
    expect(Math.abs(subsolarLon(full))).toBeLessThan(3)
    expect(Math.abs(wrap180(subsolarLon(fresh) - 180))).toBeLessThan(3)
    expect(moonPhase(full).fraction).toBeGreaterThan(0.99)
    expect(moonPhase(fresh).fraction).toBeLessThan(0.01)
    // ilk dördəbir (2024-01-18 03:53 UTC): şərq yarısı (Mare Crisium tərəfi) işıqlı
    const fq = Date.UTC(2024, 0, 18, 3, 53)
    expect(subsolarLon(fq)).toBeGreaterThan(85)
    expect(subsolarLon(fq)).toBeLessThan(95)
    expect(moonPhase(fq).waxing).toBe(true)
  })

  it('isLit / sunAltitude', () => {
    expect(isLit(0, 0, 0)).toBe(true)
    expect(isLit(0, 180, 0)).toBe(false)
    expect(isLit(0, 60, 90)).toBe(true)
    expect(isLit(0, -60, 90)).toBe(false)
    expect(sunAltitude(0, 0, 0)).toBeCloseTo(90)
    expect(sunAltitude(0, 80, 90)).toBeCloseTo(80)
  })

  it('nightPath: empty at full, full at new, path at quarter', () => {
    expect(nightPath(0, 0)).toBe('')
    expect(nightPath(180, 0)).toBe('full')
    const q = nightPath(90, 0, 0, 100)
    expect(q.startsWith('M')).toBe(true)
    expect(q.endsWith('Z')).toBe(true)
    // ilk dördəbirdə gecə sahəsi solda (x ≤ 0)
    const xs = [...q.matchAll(/[ML](-?[\d.]+) /g)].map(m => +m[1])
    expect(Math.max(...xs)).toBeLessThan(0.5)
    expect(Math.min(...xs)).toBeCloseTo(-100, 0)
  })

  it('circlePath hides back-side circles', () => {
    expect(circlePath(0, 180, 5, 0)).toBe('')
    expect(circlePath(0, 0, 5, 0, 0, 100)).toMatch(/^M.*Z$/)
  })

  it('helpers', () => {
    expect(kmToDeg(2 * 1737.4 * Math.PI / 180)).toBeCloseTo(1)
    expect(isNearSide(71.8)).toBe(true)
    expect(isNearSide(-130)).toBe(false)
    expect(fmtCoord(15.91, -71.83)).toBe('15.91° N, 71.83° W')
    expect(wrap180(270)).toBe(-90)
  })
})

describe('moonCraters data', () => {
  it('has a source with URL and retrieval date', () => {
    expect(MOON_CRATERS_SOURCE.url).toMatch(/^https:\/\/planetarynames\.wr\.usgs\.gov/)
    expect(MOON_CRATERS_SOURCE.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('every crater is complete and unique', () => {
    expect(MOON_CRATERS.length).toBeGreaterThanOrEqual(15)
    const ids = new Set()
    for (const c of MOON_CRATERS) {
      expect(ids.has(c.id)).toBe(false); ids.add(c.id)
      expect(c.featureId).toMatch(/^\d+$/)
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(c.lon)).toBeLessThanOrEqual(180)
      expect(c.diam).toBeGreaterThan(0)
      expect(c.origin.length).toBeGreaterThan(10)
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
        expect(c.person[l], `${c.id}.person.${l}`).toBeTruthy()
        expect(c.bio[l], `${c.id}.bio.${l}`).toBeTruthy()
      }
    }
  })

  it('Alhazen matches the gazetteer', () => {
    const a = MOON_CRATERS.find(c => c.id === 'alhazen')
    expect(a.lat).toBeCloseTo(15.91); expect(a.lon).toBeCloseTo(71.83); expect(a.diam).toBeCloseTo(34.65)
  })

  it('maria have centres and diameters', () => {
    expect(MOON_MARIA.length).toBeGreaterThan(5)
    for (const m of MOON_MARIA) expect(m.diam).toBeGreaterThan(0)
  })
})

describe('placeLabels', () => {
  it('avoids overlaps and drops labels that cannot fit', () => {
    const items = [{ id: 'a', x: 0, y: 0, w: 40, h: 10 }, { id: 'b', x: 2, y: 1, w: 40, h: 10 }, { id: 'c', x: 1, y: 2, w: 40, h: 10 }, { id: 'd', x: 0, y: 1, w: 40, h: 10 }, { id: 'e', x: 1, y: 1, w: 40, h: 10 }]
    const out = placeLabels(items, 200)
    expect(out.a).toBeTruthy()
    expect(Object.keys(out).length).toBeLessThan(5)
  })
  it('flips labels near the right edge to the left', () => {
    const out = placeLabels([{ id: 'r', x: 170, y: 0, w: 50, h: 10 }], 180)
    expect(out.r.anchor).toBe('end')
  })
})
