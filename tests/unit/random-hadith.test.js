// "Təsadüfi hədis" — hovuz qaydaları və ardıcıl təkrarsızlıq
import { describe, it, expect } from 'vitest'
import { randomHadithPool, pickRandomId } from '../../src/utils/randomHadith.js'
import { gradeGroup } from '../../src/utils/hadithGrade.js'

const idOf = (h) => ((h._ids || [h.id]).find(x => typeof x === 'number' || /^\d+$/.test(String(x))) ?? null)
const opts = { idOf, groupOf: gradeGroup }
const L = [
  { id: 1, g: 's' },
  { id: 2, g: 'h' },
  { id: 3, g: 'd' },       // zəif
  { id: 4, g: 'q' },       // Quran ayəsi
  { id: 5 },               // dərəcə göstərilməyib
  { id: 'adm-x', g: 's', _custom: true },          // yalnız admin — səhifəsi yoxdur
  { id: 'adm-y', g: 's', _ids: ['adm-y', 7] },     // yerli surətlə birləşmiş admin kartı
  { id: 8, g: 'm' },       // ixtilaflı
]

describe('randomHadithPool', () => {
  it('Quran ayəsi, zəif/ixtilaflı və səhifəsiz admin kartı düşmür', () => {
    expect(randomHadithPool(L, L, opts)).toEqual(['1', '2', '5', '7'])
  })
  it('"Zəif" süzgəci seçilibsə — zəiflər də (Quran yenə yox)', () => {
    const weak = L.filter(h => gradeGroup(h.g) === 'weak')
    expect(randomHadithPool(weak, L, { ...opts, allowWeak: true })).toEqual(['3', '8'])
  })
  it('süzgəc yalnız uyğunsuz kartlar saxlayıbsa — bütün siyahıdan', () => {
    expect(randomHadithPool([L[3]], L, opts)).toEqual(['1', '2', '5', '7'])
    expect(randomHadithPool([], L, opts)).toEqual(['1', '2', '5', '7'])
  })
  it('süzülmüş siyahıya hörmət edir', () => {
    expect(randomHadithPool([L[1], L[4]], L, opts)).toEqual(['2', '5'])
  })
  it('boş siyahı — boş hovuz', () => {
    expect(randomHadithPool([], [], opts)).toEqual([])
    expect(randomHadithPool(null, undefined, opts)).toEqual([])
  })
})

describe('pickRandomId', () => {
  it('boş hovuz — null', () => {
    expect(pickRandomId([], '1')).toBe(null)
    expect(pickRandomId(null)).toBe(null)
  })
  it('ardıcıl iki dəfə eyni hədis düşmür', () => {
    const pool = ['1', '2', '3']
    let last = null
    for (let i = 0; i < 300; i++) {
      const id = pickRandomId(pool, last)
      expect(pool).toContain(id)
      expect(id).not.toBe(last)
      last = id
    }
  })
  it('avoid rəqəm də ola bilər; rand sərhədləri', () => {
    expect(pickRandomId(['1', '2'], 1, () => 0)).toBe('2')
    expect(pickRandomId(['1', '2', '3'], null, () => 0.9999999)).toBe('3')
    expect(pickRandomId(['1', '2', '3'], null, () => 1)).toBe('3')
  })
  it('hovuzda tək hədis varsa — onu qaytarır', () => {
    expect(pickRandomId(['9'], '9')).toBe('9')
  })
  it('hamısı düşə bilir', () => {
    const seen = new Set()
    for (let i = 0; i < 400; i++) seen.add(pickRandomId(['1', '2', '3', '4'], null))
    expect(seen.size).toBe(4)
  })
})
