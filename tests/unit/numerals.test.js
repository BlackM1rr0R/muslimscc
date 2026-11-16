import { describe, it, expect } from 'vitest'
import { toDigits, toRoman, normalizeInput } from '../../src/utils/numerals.js'

describe('rəqəm sistemləri', () => {
  it('şərqi ərəb, fars, devanaqari', () => {
    expect(toDigits('2026', 'arab')).toBe('٢٠٢٦')
    expect(toDigits('456', 'arabext')).toBe('۴۵۶')
    expect(toDigits('109', 'deva')).toBe('१०९')
  })
  it('Roma: 1994 → MCMXCIV, 0 və 4000 — yoxdur', () => {
    expect(toRoman(1994)).toBe('MCMXCIV')
    expect(toRoman(3999)).toBe('MMMCMXCIX')
    expect(toRoman(0)).toBeNull()
    expect(toRoman(4000)).toBeNull()
  })
  it('giriş: ərəbcə yazılmış rəqəmlər də qəbul olunur, aparıcı sıfırlar atılır', () => {
    expect(normalizeInput('٢٠٢٦')).toBe('2026')
    expect(normalizeInput('00 12a3')).toBe('123')
    expect(normalizeInput('0')).toBe('0')
    expect(normalizeInput('1234567890123')).toHaveLength(12)
  })
})
