import { describe, it, expect } from 'vitest'
import { buildPageTimings, pageVerses, wordAtMs, startOf } from '../../src/utils/mushafRecite'

const json = { audio_files: [
  { verse_key: '2:6', url: 'Alafasy/mp3/002006.mp3', segments: [[1, 2, 1270, 2150], [0, 1, 30, 1260], [2, 3, 2160, 2880]] },
  { verse_key: '2:7', url: 'https://x.test/a.mp3', segments: [[0, 1, 140, 660], 'bad'] },
  { url: 'nokey.mp3' },
] }

describe('mushafRecite', () => {
  it('buildPageTimings: url tam, seqmentlər sözə görə sıralı, pis sətirlər atılır', () => {
    const m = buildPageTimings(json)
    expect(m.size).toBe(2)
    expect(m.get('2:6').url).toBe('https://verses.quran.com/Alafasy/mp3/002006.mp3')
    expect(m.get('2:6').segs.map(s => s[0])).toEqual([1, 2, 3])
    expect(m.get('2:7').url).toBe('https://x.test/a.mp3')
    expect(m.get('2:7').segs).toEqual([[1, 140, 660]])
    expect(buildPageTimings(null).size).toBe(0)
  })
  it('pageVerses: ayələr səhifədəki sırası ilə, ayə sonu nişanı sayılmır', () => {
    const v = pageVerses([
      { key: '2:6', p: 1, type: 'word' }, { key: '2:6', p: 2, type: 'word' }, { key: '2:6', p: 3, type: 'end' },
      { key: '2:7', p: 1, type: 'word' },
    ])
    expect(v).toEqual([{ key: '2:6', words: [1, 2] }, { key: '2:7', words: [1] }])
  })
  it('wordAtMs / startOf', () => {
    const segs = buildPageTimings(json).get('2:6').segs
    expect(wordAtMs(segs, 0)).toBe(null)
    expect(wordAtMs(segs, 30)).toBe(1)
    expect(wordAtMs(segs, 1300)).toBe(2)
    expect(wordAtMs(segs, 99999)).toBe(3)
    expect(startOf(segs, 3)).toBe(2160)
    expect(startOf(segs, 9)).toBe(0)
  })
})
