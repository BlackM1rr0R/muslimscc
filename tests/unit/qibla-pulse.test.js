import { describe, it, expect } from 'vitest'
import { pulseInterval } from '../../src/utils/qiblaPulse.js'

describe('qiblə nəbzi', () => {
  it('uzaqda sakit, tuşlananda 0, yaxınlaşdıqca tezləşir', () => {
    expect(pulseInterval(120)).toBeNull()
    expect(pulseInterval(3)).toBe(0)
    expect(pulseInterval(10)).toBeLessThan(pulseInterval(40))
    expect(pulseInterval(40)).toBeLessThan(pulseInterval(85))
    expect(pulseInterval(90)).toBe(1400)
    expect(pulseInterval(NaN)).toBeNull()
  })
})
