import { describe, it, expect } from 'vitest'
import { moonEcliptic, msOfJd, nextConjunction } from '../../src/utils/lunar'
import { crescentEvenings, crescentAt, makeEphemeris, crescentGrid, utcDay, odehV, zoneOfV } from '../../src/utils/crescentVis'

// Meeus nümunələrindəki vaxtlar TT-dir; kodumuz UT qəbul edib +69 s əlavə edir —
// ona görə 69 s çıxırıq (1992-ci ildə ΔT ≈ 59 s idi — fərq ~10 s, nəticəyə təsiri yoxdur).
const tt = (jd) => msOfJd(jd) - 69000

describe('Ay mövqeyi (Meeus 47.a)', () => {
  it('1992-04-12 0h TT: λ ≈ 133.1627°, β ≈ −3.2291°, Δ ≈ 368 410 km', () => {
    const m = moonEcliptic(tt(2448724.5))
    expect(Math.abs(m.lon - 133.162655)).toBeLessThan(0.01)
    expect(Math.abs(m.lat - -3.229126)).toBeLessThan(0.01)
    expect(Math.abs(m.dist - 368409.7)).toBeLessThan(30)
  })
})

describe('Birləşmə (Meeus 49.a)', () => {
  it('1977-02-18 03:37:42 TT təzə ay — ±3 dəq', () => {
    const want = tt(2443192.65118)
    const got = nextConjunction(want - 5 * 86400000)
    expect(Math.abs(got - want) / 60000).toBeLessThan(3)
  })
  it('2023-03-21 17:23 UT (Ramazan 1444) — ±5 dəq', () => {
    const want = Date.UTC(2023, 2, 21, 17, 23)
    expect(Math.abs(nextConjunction(Date.UTC(2023, 2, 15)) - want) / 60000).toBeLessThan(5)
  })
})

describe('Odeh meyarı', () => {
  it('zona sərhədləri', () => {
    expect(zoneOfV(6)).toBe('A'); expect(zoneOfV(3)).toBe('B'); expect(zoneOfV(0)).toBe('C'); expect(zoneOfV(-2)).toBe('D')
    expect(odehV(10, 0.5)).toBeCloseTo(10 - (-0.1018 * 0.125 + 0.7319 * 0.25 - 6.3226 * 0.5 + 7.1651), 6)
  })
  it('Ramazan 1444: 21 mart axşamı Məkkədə görünmür, 22 martda gözlə görünür', () => {
    const conj = nextConjunction(Date.UTC(2023, 2, 15))
    const d0 = utcDay(conj)
    const eph = makeEphemeris(d0 - 7200000, d0 + 3 * 86400000)
    expect(crescentAt(eph, conj, d0, 21.42, 39.83).zone).toBe('D')
    const r = crescentAt(eph, conj, d0 + 86400000, 21.42, 39.83)
    expect(r.zone).toBe('A')
    expect(r.lag).toBeGreaterThan(40)
  })
  it('qərbə getdikcə görünmə yaxşılaşır (eyni axşam)', () => {
    const conj = nextConjunction(Date.UTC(2023, 2, 15))
    const d0 = utcDay(conj)
    const eph = makeEphemeris(d0 - 7200000, d0 + 40 * 3600000)
    const east = crescentAt(eph, conj, d0, 0, 100), west = crescentAt(eph, conj, d0, 0, -100)
    expect(west.v).toBeGreaterThan(east.v ?? -99)
  })
  it('şəbəkə: 3 axşamda görünən ərazi artır', () => {
    const ev = crescentEvenings(Date.UTC(2023, 2, 19))
    const share = ev.days.map(d => { const g = crescentGrid(ev.conj, d, 6); return g.codes.filter(c => c <= 1).length / g.codes.length })
    expect(share[0]).toBeLessThan(share[1])
    expect(share[1]).toBeLessThanOrEqual(share[2])
    expect(share[2]).toBeGreaterThan(0.5)
  })
})
