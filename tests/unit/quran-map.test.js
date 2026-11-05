// Quranın xəritəsi (utils/quranMap) — indeks ↔ ayə və vəziyyətlər
import { describe, it, expect } from 'vitest'
import { TOTAL, refAt, mapStates, countStates, SURAH_START } from '../../src/utils/quranMap.js'

describe('quranMap', () => {
  it('6236 ayə; indeks → surə:ayə', () => {
    expect(TOTAL).toBe(6236)
    expect(refAt(0)).toEqual({ s: 1, a: 1 })
    expect(refAt(7)).toEqual({ s: 2, a: 1 })
    expect(refAt(7 + 254)).toEqual({ s: 2, a: 255 })
    expect(refAt(6235)).toEqual({ s: 114, a: 6 })
    expect(refAt(6236)).toBeNull()
    expect(SURAH_START[113]).toBe(6230)
  })
  it('köhnə izləyici (surə) + SRS (ayə) birləşir', () => {
    const st = mapStates({ 1: 2, 112: 1 }, { '2:255': {}, '999:1': {}, '2:999': {} })
    const [, learn, mem] = countStates(st)
    expect(mem).toBe(7 + 1)
    expect(learn).toBe(4)
    expect(st[7 + 254]).toBe(2)
  })
})
