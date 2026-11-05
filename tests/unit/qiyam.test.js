// Gecə namazı (utils/qiyam) — gecənin son üçdə biri
import { describe, it, expect } from 'vitest'
import { qiyamState, hm } from '../../src/utils/qiyam.js'

// Məğrib 18:00 (1080), sübh 06:00 (360) → gecə 12 saat, son üçdə bir 02:00 (120)
describe('qiyamState', () => {
  it('gündüz və axşam — başlamasına qalan', () => {
    expect(qiyamState(12 * 60, 1080, 360)).toEqual({ phase: 'wait', start: 120, end: 360, left: 14 * 60 })
    expect(qiyamState(23 * 60, 1080, 360).left).toBe(3 * 60)
  })
  it('gecə yarısından sonra son üçdə birdən əvvəl və içində', () => {
    expect(qiyamState(60, 1080, 360)).toMatchObject({ phase: 'wait', left: 60 })
    expect(qiyamState(150, 1080, 360)).toMatchObject({ phase: 'in', left: 210 })
  })
  it('sübh keçəndən sonra — növbəti gecəyə', () => {
    expect(qiyamState(361, 1080, 360)).toMatchObject({ phase: 'wait', left: 1440 + 120 - 361 })
    expect(qiyamState(null, 1080, 360)).toBeNull()
    expect(hm(120)).toBe('02:00')
  })
})
