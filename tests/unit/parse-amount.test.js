import { describe, it, expect } from 'vitest'
import { parseAmount, cleanAmountInput } from '../../src/utils/parseAmount'

describe('parseAmount', () => {
  const cases = [
    ['2500', 2500], ['1 500', 1500], ['1 500,50', 1500.5], ['1.500,50', 1500.5], ['1,500.50', 1500.5],
    ['12,5', 12.5], ['12.50', 12.5], ['1.500', 1500], ['1,500', 1500], ['1500.', 1500], [',5', 0.5],
    ['1.234.567', 1234567], ['1 234 567,8', 1234567.8], ['-5000', -5000], ['0', 0], ['00012', 12],
  ]
  for (const [s, v] of cases) it(`${JSON.stringify(s)} → ${v}`, () => expect(parseAmount(s)).toBeCloseTo(v, 6))
  it('boş və səhv → NaN', () => {
    for (const s of ['', '   ', 'abc', '1e9', '--']) expect(Number.isNaN(parseAmount(s))).toBe(true)
  })
  it('cleanAmountInput hərfləri atır', () => {
    expect(cleanAmountInput('1 500,5 AZN')).toBe('1 500,5 ')
    expect(cleanAmountInput('-12a')).toBe('-12')
  })
})
