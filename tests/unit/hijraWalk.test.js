import { describe, it, expect } from 'vitest'
import {
  haversine, cumulative, routeLength, pointAt, stepsToKm, sanitize, addEntry, undoLast, addWalker, removeWalker,
  daysOf, totalKm, streak, estimate, addDays, dayDiff, stopKms, load, save, STORE_KEY,
} from '../../src/utils/hijraWalk.js'

// Saytın hicrət xətti (media/SiraMaps → HIJRA_ROUTE) — eyni nöqtələr
const G = { mecca: [21.4225, 39.8262], medina: [24.4672, 39.6112], quba: [24.4393, 39.6173], thawr: [21.3771, 39.8497] }
const ROUTE = [G.mecca, G.thawr, [21.55, 39.42], [22.05, 39.2], [22.7, 39.18], [23.3, 39.1], [23.85, 39.25], [24.2, 39.45], G.quba, G.medina]

describe('hijraWalk geometry', () => {
  it('haversine: 1° of latitude ≈ 111 km', () => {
    expect(haversine([0, 0], [1, 0])).toBeCloseTo(111.2, 0)
  })
  it('route length of the Hijrah polyline is ~395 km', () => {
    const L = routeLength(ROUTE)
    expect(L).toBeGreaterThan(380)
    expect(L).toBeLessThan(460)
    expect(cumulative(ROUTE)[1]).toBeCloseTo(haversine(G.mecca, G.thawr), 6)
  })
  it('pointAt clamps and interpolates', () => {
    expect(pointAt(ROUTE, -5)).toEqual(G.mecca)
    expect(pointAt(ROUTE, 9999)).toEqual(G.medina)
    const cum = cumulative(ROUTE)
    expect(pointAt(ROUTE, cum[3])[0]).toBeCloseTo(22.05, 6)
    const mid = pointAt([[0, 0], [0, 2]], routeLength([[0, 0], [0, 2]]) / 2)
    expect(mid[1]).toBeCloseTo(1, 6)
  })
  it('stopKms maps route indices to distances', () => {
    const cum = cumulative(ROUTE)
    expect(stopKms([{ at: 0 }, { at: 9 }], cum)).toEqual([0, cum[9]])
  })
})

describe('hijraWalk state', () => {
  it('stepsToKm uses stride', () => {
    expect(stepsToKm(10000)).toBe(7.5)
    expect(stepsToKm(10000, 0.8)).toBe(8)
    expect(stepsToKm(-1)).toBe(0)
    expect(stepsToKm('abc')).toBe(0)
  })
  it('sanitize drops junk', () => {
    const s = sanitize({ days: { '2026-01-01': 3, bad: 5, '2026-01-02': -1 }, stride: 9, walkers: [{ id: 'me' }, { id: 'w1', name: 'A', days: {} }] })
    expect(s.days).toEqual({ '2026-01-01': 3 })
    expect(s.stride).toBe(0.75)
    expect(s.walkers.map(w => w.id)).toEqual(['w1'])
    expect(sanitize('x').days).toEqual({})
  })
  it('addEntry accumulates per day, sets startedAt, rejects bad values', () => {
    let s = sanitize(null)
    expect(addEntry(s, '2026-11-10', 0)).toBe(s)
    expect(addEntry(s, '2026-11-10', 500)).toBe(s)
    s = addEntry(s, '2026-11-10', 4.2)
    s = addEntry(s, '2026-11-10', 1.3)
    s = addEntry(s, '2026-11-08', 2)
    expect(s.days['2026-11-10']).toBe(5.5)
    expect(totalKm(s.days)).toBe(7.5)
    expect(s.startedAt).toBe('2026-11-08')
    s = undoLast(s)
    expect(s.days['2026-11-08']).toBeUndefined()
    expect(s.startedAt).toBe('2026-11-10')
    s = undoLast(undoLast(s))
    expect(s.days).toEqual({})
    expect(s.startedAt).toBe(null)
    expect(undoLast(s)).toBe(s)
  })
  it('family walkers keep their own days', () => {
    let s = addWalker(sanitize(null), '  Ali ', 'w1')
    expect(addWalker(s, '   ')).toBe(s)
    s = addEntry(s, '2026-11-10', 3, 'w1')
    s = addEntry(s, '2026-11-10', 1)
    expect(addEntry(s, '2026-11-10', 1, 'nobody')).toBe(s)
    expect(totalKm(daysOf(s, 'w1'))).toBe(3)
    expect(totalKm(daysOf(s))).toBe(1)
    expect(s.walkers[0].name).toBe('Ali')
    s = undoLast(s) // undoes 'me'
    s = undoLast(s) // undoes w1
    expect(totalKm(daysOf(s, 'w1'))).toBe(0)
    s = addEntry(s, '2026-11-11', 2, 'w1')
    s = removeWalker(s, 'w1')
    expect(s.walkers).toEqual([])
    expect(s.log).toEqual([])
  })
  it('streak counts back from today or yesterday', () => {
    const d = { '2026-11-15': 1, '2026-11-16': 2, '2026-11-13': 1 }
    expect(streak(d, '2026-11-16')).toBe(2)
    expect(streak(d, '2026-11-17')).toBe(2)
    expect(streak(d, '2026-11-18')).toBe(0)
  })
  it('date helpers cross month ends', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(dayDiff('2026-10-30', '2026-11-02')).toBe(3)
  })
  it('estimate uses average pace over calendar days', () => {
    const e = estimate({ '2026-11-01': 10, '2026-11-10': 10 }, '2026-11-01', 400, '2026-11-10')
    expect(e.pace).toBe(2)
    expect(e.daysLeft).toBe(190)
    expect(e.finish).toBe(addDays('2026-11-10', 190))
    expect(estimate({}, null, 400, '2026-11-10')).toBe(null)
    expect(estimate({ '2026-11-01': 401 }, '2026-11-01', 400, '2026-11-10').daysLeft).toBe(0)
  })
  it('load/save round-trip', () => {
    const mem = { v: {}, getItem(k) { return this.v[k] ?? null }, setItem(k, x) { this.v[k] = x } }
    save(addEntry(sanitize(null), '2026-11-10', 3), mem)
    expect(JSON.parse(mem.v[STORE_KEY]).days).toEqual({ '2026-11-10': 3 })
    expect(load(mem).days['2026-11-10']).toBe(3)
    mem.v[STORE_KEY] = '{bad'
    expect(load(mem).days).toEqual({})
  })
})
