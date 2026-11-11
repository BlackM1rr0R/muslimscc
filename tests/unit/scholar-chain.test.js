import { describe, it, expect } from 'vitest'
import { SCHOLARS } from '../../src/data/scholars'
import { buildChain } from '../../src/utils/scholarChain'

describe('elm zənciri', () => {
  const { edges } = buildChain(SCHOLARS)
  const has = (a, b) => edges.some(e => e.from === a && e.to === b)
  it('məşhur zəncirlər var', () => {
    expect(has('malik-ibn-anas', 'ash-shafii')).toBe(true)
    expect(has('ash-shafii', 'ahmad-ibn-hanbal')).toBe(true)
    expect(has('ahmad-ibn-hanbal', 'al-bukhari')).toBe(true)
    expect(has('al-bukhari', 'at-tirmidhi')).toBe(true)
    expect(has('ibn-taymiyyah', 'ibn-al-qayyim')).toBe(true)
    expect(has('ibn-al-qayyim', 'ibn-rajab')).toBe(true)
    expect(has('ibn-baz', 'ibn-uthaymin')).toBe(true)
  })
  it('oxşar adlı başqa şəxslər qoşulmur', () => {
    expect(has('muhammad-ibn-sirin', 'al-hasan-al-basri')).toBe(false)   // "Ənəs ibn Malik" — İbn Sirin deyil
    expect(has('at-tabari', 'ash-shafii')).toBe(false)                    // "Əbu Bəkr əş-Şafii" — imam deyil
    expect(has('salih-al-ash-shaykh', 'ibn-baz')).toBe(false)             // Məhəmməd ibn İbrahim Al əş-Şeyx
    expect(has('muqbil-al-wadii', 'muhammad-ibn-abd-al-wahhab')).toBe(false) // əl-Vəsabi
  })
  it('xronologiya: müəllim tələbədən əvvəl vəfat etmir', () => {
    const by = Object.fromEntries(SCHOLARS.map(s => [s.slug, s]))
    for (const e of edges) {
      const T = by[e.from], S = by[e.to]
      if (T.died?.h && S.born?.h) expect(T.died.h).toBeGreaterThanOrEqual(S.born.h)
    }
  })
})
