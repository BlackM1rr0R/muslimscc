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

describe('rmsEnvelope', async () => {
  const { rmsEnvelope } = await import('../../src/utils/audioEnvelope.js')
  it('səssiz hissə 0-a, ən uca hissə 1-ə yaxın', () => {
    const sr = 3000, d = new Float32Array(sr * 2)
    for (let i = sr; i < sr * 2; i++) d[i] = Math.sin(i / 5) * 0.8
    const e = rmsEnvelope(d, sr, 10)
    expect(e.length).toBe(20)
    expect(e[2]).toBeLessThan(0.01)
    expect(e[15]).toBeGreaterThan(0.9)
  })
})
