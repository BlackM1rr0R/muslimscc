// Fil saatı (src/utils/elephantClock.js) — yarım saat hesabı yerli vaxtla
import { describe, it, expect } from 'vitest'
import { halfHourState, crossedRelease, roundLevel, splitDuration, HALF_MS } from '../../src/utils/elephantClock.js'

const at = (h, mi, s = 0, ms = 0) => new Date(2026, 10, 16, h, mi, s, ms).getTime()

describe('halfHourState', () => {
  it('qab :00 və :30-da yuxarıdadır, :15 və :45-də yarıdadır', () => {
    expect(halfHourState(at(10, 0)).level).toBe(0)
    expect(halfHourState(at(10, 30)).level).toBe(0)
    expect(halfHourState(at(10, 15)).level).toBe(0.5)
    expect(halfHourState(at(10, 45)).level).toBe(0.5)
  })
  it('dibə yaxın: 10:29:59 → ~1, növbətiyə 1 san', () => {
    const s = halfHourState(at(10, 29, 59))
    expect(s.level).toBeGreaterThan(0.99)
    expect(s.toNext).toBe(1000)
  })
  it('yarım saat indeksi 0..47', () => {
    expect(halfHourState(at(0, 5)).index).toBe(0)
    expect(halfHourState(at(0, 35)).index).toBe(1)
    expect(halfHourState(at(23, 59)).index).toBe(47)
  })
})

describe('crossedRelease', () => {
  it(':30 sərhədi keçiləndə true', () => {
    expect(crossedRelease(at(10, 29, 59), at(10, 30, 0))).toBe(true)
    expect(crossedRelease(at(10, 59, 59), at(11, 0, 1))).toBe(true)
  })
  it('eyni yarım saatda false, geri gedəndə false', () => {
    expect(crossedRelease(at(10, 1), at(10, 29))).toBe(false)
    expect(crossedRelease(at(10, 31), at(10, 29))).toBe(false)
  })
  it('yarım saatdan uzun fasilə — true', () => {
    expect(crossedRelease(at(10, 10), at(10, 10) + HALF_MS)).toBe(true)
  })
})

describe('köməkçilər', () => {
  it('roundLevel 0..1, 2 onluq', () => {
    expect(roundLevel(0.12345)).toBe(0.12)
    expect(roundLevel(-1)).toBe(0)
    expect(roundLevel(2)).toBe(1)
  })
  it('splitDuration', () => {
    expect(splitDuration(0)).toEqual({ h: 0, m: 0 })
    expect(splitDuration(59000)).toEqual({ h: 0, m: 1 })
    expect(splitDuration((2 * 60 + 5) * 60000)).toEqual({ h: 2, m: 5 })
    expect(splitDuration(-5)).toEqual({ h: 0, m: 0 })
  })
})
