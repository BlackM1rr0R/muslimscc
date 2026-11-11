import { describe, it, expect } from 'vitest'
import { fitDesc, DESC_MAX } from '../../src/seo/meta'
import { canonicalLang, seoLangsFor, LANGS } from '../../src/seo/routes'

describe('fitDesc', () => {
  it('qısa mətn dəyişmir', () => expect(fitDesc('Qısa təsvir.')).toBe('Qısa təsvir.'))
  it('uzun mətn ≤ 160, sözün ortasında kəsilmir', () => {
    const s = 'Söz '.repeat(80) + 'son'
    const r = fitDesc(s)
    expect([...r].length).toBeLessThanOrEqual(DESC_MAX)
    expect(r.endsWith('…')).toBe(true)
    expect(r).not.toMatch(/Sö…$/)
  })
  it('cümlə sonunda kəsir', () => {
    const s = `${'Birinci cümlə burada uzanır və uzanır'.repeat(3)}. ${'İkinci cümlə '.repeat(10)}`
    expect(fitDesc(s).endsWith('.')).toBe(true)
  })
})

describe('əlavə dildə əsas-məzmunlu detal — kanonik ingilis səhifəsi', () => {
  it('lüğət/dərs/ad detalı: de → en, hreflang yalnız 5 əsas dil', () => {
    expect(canonicalLang('glossary', 'de', 'adab')).toBe('en')
    expect(canonicalLang('names', 'ur', 2)).toBe('en')
    expect(seoLangsFor('learn', 'tawbah')).toEqual(LANGS)
  })
  it('Quran detalı və siyahı səhifələri öz dilində qalır', () => {
    expect(canonicalLang('quran', 'de', 2)).toBe('de')
    expect(canonicalLang('glossary', 'de', null)).toBe('de')
    expect(canonicalLang('glossary', 'ru', 'adab')).toBe('ru')
    expect(seoLangsFor('quran', 2).length).toBeGreaterThan(5)
  })
})
