import { describe, it, expect } from 'vitest'
import { buildLlmsTxt } from '../../scripts/llms-txt.mjs'
import { INDEXABLE } from '../../src/seo/routes.js'

describe('llms.txt', () => {
  const s = buildLlmsTxt()
  it('standart başlıq və xülasə', () => {
    expect(s.startsWith('# Muslims.cc\n\n> ')).toBe(true)
    expect(s).not.toMatch(/undefined|null|\[object/)
  })
  it('əsas bölmələr ingiliscə ünvanla', () => {
    for (const p of ['/en/quran', '/en/prayer', '/en/hadith', '/en/duas', '/en/qibla', '/en/zakat']) expect(s).toContain(`https://muslims.cc${p})`)
  })
  it('admin və noindex səhifələr yoxdur', () => {
    expect(s).not.toMatch(/admin/)
    expect(INDEXABLE.length).toBeGreaterThan(40)
  })
})
