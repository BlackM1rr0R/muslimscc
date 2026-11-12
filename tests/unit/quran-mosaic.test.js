import { describe, it, expect } from 'vitest'
import { TOTAL, SAJDAH, SAJDAH_IDX, JUZ_OF, wordsAt, indexOf, longestAyahs, surahWords, TOTAL_WORDS, isMadani } from '../../src/utils/quranMosaic'
import { AYAH_WORDS } from '../../src/data/ayahWords'

describe('quranMosaic', () => {
  it('6236 ayə, hər birinin söz sayı ≥ 1', () => {
    expect(TOTAL).toBe(6236)
    expect(AYAH_WORDS.length).toBe(6236)
    expect(AYAH_WORDS.every(w => w >= 1)).toBe(true)
  })
  it('məlum ayələr: Fatihə 1 = 4 söz, Bəqərə 1 = 1 (bəsmələ sayılmır), 2:282 ən uzun', () => {
    expect(wordsAt(indexOf(1, 1))).toBe(4)
    expect(wordsAt(indexOf(2, 1))).toBe(1)
    expect(wordsAt(indexOf(2, 2))).toBe(7)          // vəqf işarəsi ۛ söz sayılmır
    expect(wordsAt(indexOf(112, 1))).toBe(4)
    expect(longestAyahs(1)[0]).toMatchObject({ s: 2, a: 282 })
    expect(surahWords(112)).toBe(15)
    expect(TOTAL_WORDS).toBeGreaterThan(77000)
    expect(TOTAL_WORDS).toBeLessThan(78500)
  })
  it('15 səcdə ayəsi, hamısı fərqli indeksdə', () => {
    expect(SAJDAH).toHaveLength(15)
    expect(SAJDAH_IDX.size).toBe(15)
    expect(SAJDAH_IDX.has(indexOf(96, 19))).toBe(true)
  })
  it('cüzlər: 1-ci ayə 1-ci cüz, 2:142 — 2-ci, son ayə — 30-cu, boş yoxdur', () => {
    expect(JUZ_OF[0]).toBe(1)
    expect(JUZ_OF[indexOf(2, 142)]).toBe(2)
    expect(JUZ_OF[TOTAL - 1]).toBe(30)
    expect(JUZ_OF.every(j => j >= 1 && j <= 30)).toBe(true)
  })
  it('Məkki/Mədəni: Bəqərə Mədəni, Ələq Məkki', () => {
    expect(isMadani(indexOf(2, 5))).toBe(true)
    expect(isMadani(indexOf(96, 1))).toBe(false)
  })
})
