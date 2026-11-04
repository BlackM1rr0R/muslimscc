// Fiziki təsbeh (TasbihBeads → beadState) və mövsüm (wow.js → seasonOf)
import { describe, it, expect } from 'vitest'
import { beadState } from '../../src/components/TasbihBeads.jsx'
import { seasonOf } from '../../src/utils/wow.js'

describe('beadState', () => {
  it('33 hədəf: sayılan muncuqlar say qədərdir, 33-də tamamlanır', () => {
    expect(beadState(0, 33)).toMatchObject({ n: 33, counted: 0, done: false, cycles: 1 })
    expect(beadState(12, 33)).toMatchObject({ counted: 12, done: false })
    expect(beadState(33, 33)).toMatchObject({ counted: 33, done: true })
  })
  it('kiçik hədəf (məs. 10): muncuq sayı hədəf qədər', () => {
    expect(beadState(4, 10)).toMatchObject({ n: 10, counted: 4 })
  })
  it('100 hədəf: 33-lük dövrlər (1/4 … 4/4), sonda hamısı tamam', () => {
    expect(beadState(1, 100)).toMatchObject({ n: 33, counted: 1, cycle: 1, cycles: 4 })
    expect(beadState(34, 100)).toMatchObject({ counted: 1, cycle: 2 })
    expect(beadState(99, 100)).toMatchObject({ counted: 0, cycle: 4 })
    expect(beadState(100, 100)).toMatchObject({ counted: 33, done: true })
  })
})

describe('seasonOf (hicri tarix → mövsüm)', () => {
  it.each([
    [{ year: 1448, month: 9, day: 1 }, 'ramadan'],
    [{ year: 1448, month: 9, day: 30 }, 'ramadan'],
    [{ year: 1448, month: 10, day: 1 }, 'eid'],
    [{ year: 1448, month: 10, day: 3 }, 'eid'],
    [{ year: 1448, month: 10, day: 4 }, ''],
    [{ year: 1448, month: 12, day: 1 }, 'hajj'],
    [{ year: 1448, month: 12, day: 9 }, 'hajj'],
    [{ year: 1448, month: 12, day: 10 }, 'eid'],
    [{ year: 1448, month: 12, day: 13 }, 'eid'],
    [{ year: 1448, month: 12, day: 14 }, ''],
    [{ year: 1448, month: 5, day: 24 }, ''],
    [null, ''],
  ])('%o → "%s"', (h, s) => { expect(seasonOf(h)).toBe(s) })
})
