import { describe, it, expect } from 'vitest'
import { HADITHS, HADITHS_UNVERIFIED, isVerifiableSource } from '../../src/data/hadiths.js'
import { HADITH_COUNT } from '../../src/data/siteStats.js'
import { isNotHadith } from '../../src/utils/search.js'
import { uniqueHadithsFor } from '../../src/utils/uniqueHadiths.js'

describe('Hədis mənbələri', () => {
  it('saytda yalnız kitab + nömrə ilə yoxlanıla bilən rəvayətlər', () => {
    for (const l of ['az', 'en', 'ru', 'tr', 'ar']) for (const h of HADITHS[l]) expect(isVerifiableSource(h.source), `${h.id} ${h.source}`).toBe(true)
    expect(HADITHS_UNVERIFIED.length).toBeGreaterThan(0)
    expect(HADITHS.az.some(h => h.id === 12)).toBe(false)     // "Buxari, Muvatta" — səhv aidiyyət
    expect(HADITHS.az.some(h => h.id === 1995)).toBe(true)    // eyni hədis, Əhməd 8952 (Arnaut)
  })
  it('mənbə adlarında kiril/latın qarışığı yoxdur', () => {
    for (const h of HADITHS.az) expect(/[A-Za-zƏəİıÖöÜüŞşÇçĞğ][А-Яа-я]|[А-Яа-я][A-Za-z]/.test(h.source), h.source).toBe(false)
  })
  it('saytdakı say iddiası şişirdilməyib (HADITH_COUNT ≤ həqiqi hədis sayı)', () => {
    const L = uniqueHadithsFor(HADITHS, 'az')
    const n = (L.list || L).filter(h => !isNotHadith(h.source)).length
    expect(HADITH_COUNT).toBeLessThanOrEqual(n)
    expect(n - HADITH_COUNT).toBeLessThan(100)
  })
})
