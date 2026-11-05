// Hilal yolu (components/CrescentPath) — ay fazası
import { describe, it, expect } from 'vitest'
import { moonOf } from '../../src/utils/crescent.js'

describe('moonOf', () => {
  it('1-ci gün incə hilal, 15-də bədrə yaxın, 29-da yenə incə', () => {
    expect(moonOf(1).lit).toBeLessThan(0.05)
    expect(moonOf(1).waxing).toBe(true)
    expect(moonOf(15).lit).toBeGreaterThan(0.95)
    expect(moonOf(22).waxing).toBe(false)
    expect(moonOf(29).lit).toBeLessThan(0.05)
  })
})
