import { describe, it, expect } from 'vitest'
import { fitTitle } from '../../src/seo/meta.js'

describe('fitTitle', () => {
  it('qısa başlıq dəyişmir', () => {
    expect(fitTitle('Muslims.cc — Quran, Prayer Times')).toBe('Muslims.cc — Quran, Prayer Times')
  })
  it('uzun başlıqda sonuncu " — " hissəsi atılır', () => {
    const t = 'Muslims.cc — Coran, horaires de prière, hadith et invocations — plateforme islamique'
    expect(fitTitle(t)).toBe('Muslims.cc — Coran, horaires de prière, hadith et invocations')
  })
  it('ayırıcı yoxdursa toxunulmur', () => {
    const t = 'x'.repeat(80)
    expect(fitTitle(t)).toBe(t)
  })
})
