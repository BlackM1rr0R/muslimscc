import { describe, it, expect } from 'vitest'
import { wordCount } from '../../src/components/quran/SurahRhythm'

describe('SurahRhythm.wordCount', () => {
  it('ərəbcə sözləri sayır, vəqf işarələrini saymır', () => {
    expect(wordCount('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')).toBe(4)
    expect(wordCount('ٱلرَّحْمَٰنُ')).toBe(1)
    expect(wordCount('ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ')).toBe(7)
    expect(wordCount('')).toBe(0)
  })
})
