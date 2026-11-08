import { describe, it, expect } from 'vitest'
import { eidOf } from '../../src/utils/eid.js'
import { hijriToGregorian } from '../../src/utils/hijri.js'

const at = (h) => { const g = hijriToGregorian(h); return new Date(g.year, g.month - 1, g.day, 12) }

describe('eidOf', () => {
  it('1 Şəvval — Ramazan bayramı, 4 Şəvval — yox', () => {
    expect(eidOf(at({ year: 1448, month: 10, day: 1 }))).toMatchObject({ kind: 'fitr', hYear: 1448 })
    expect(eidOf(at({ year: 1448, month: 10, day: 4 }))).toBe(null)
  })
  it('10–13 Zülhiccə — Qurban bayramı, 9 Zülhiccə (Ərəfə) — yox', () => {
    expect(eidOf(at({ year: 1447, month: 12, day: 10 }))).toMatchObject({ kind: 'adha' })
    expect(eidOf(at({ year: 1447, month: 12, day: 13 }))).toMatchObject({ kind: 'adha', day: 13 })
    expect(eidOf(at({ year: 1447, month: 12, day: 9 }))).toBe(null)
  })
})
