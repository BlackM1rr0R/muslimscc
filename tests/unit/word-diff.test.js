import { describe, it, expect } from 'vitest'
import { diffWords } from '../../src/utils/wordDiff'

describe('diffWords', () => {
  it('ortaq sözlər same, fərqli sözlər işarəli', () => {
    const r = diffWords('Rəhmli, Mərhəmətli Allahın adı ilə!', 'Mərhəmətli, Rəhmli Allahın adı ilə')
    expect(r.map(x => x.w).join('')).toBe('Mərhəmətli, Rəhmli Allahın adı ilə')
    expect(r.filter(x => !x.same).length).toBe(1)
  })
  it('eyni mətn — fərq yoxdur', () => {
    expect(diffWords('a b c', 'a b c').every(x => x.same)).toBe(true)
  })
  it('boş', () => { expect(diffWords('', 'x y')).toHaveLength(2) })
})
