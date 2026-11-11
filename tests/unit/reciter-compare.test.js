import { describe, it, expect } from 'vitest'
import { audioUrl, parseRecitation, verseWords, peaksOf, wordDurations, wordAtTime, COMPARE_RECITERS } from '../../src/utils/reciterCompare'
import { RECITERS } from '../../src/utils/quranAudio'

describe('qiraətçiləri müqayisə', () => {
  it('səs ünvanları', () => {
    expect(audioUrl('Alafasy/mp3/001002.mp3')).toBe('https://verses.quran.com/Alafasy/mp3/001002.mp3')
    expect(audioUrl('//mirrors.quranicaudio.com/x.mp3')).toBe('https://mirrors.quranicaudio.com/x.mp3')
    expect(audioUrl('https://a.b/c.mp3')).toBe('https://a.b/c.mp3')
  })
  it('seqmentlər (Sudais — sətir rəqəmlər)', () => {
    const r = parseRecitation({ audio_files: [{ url: 'Sudais/mp3/001002.mp3', segments: [['0', '1', '420', '1000'], ['1', '2', '1010', '1860'], [1, 2]] }] })
    expect(r.url).toBe('https://verses.quran.com/Sudais/mp3/001002.mp3')
    expect(r.segs.get(2)).toEqual([1010, 1860])
    expect(r.end).toBe(1860)
    expect(parseRecitation({})).toBe(null)
  })
  it('sözlər, müddətlər, aktiv söz', () => {
    const w = verseWords({ verse: { words: [{ position: 1, char_type_name: 'word', text_uthmani: 'ٱلْحَمْدُ' }, { position: 2, char_type_name: 'end', text_uthmani: '٢' }] } })
    expect(w).toEqual([{ pos: 1, text: 'ٱلْحَمْدُ' }])
    const a = { segs: new Map([[1, [0, 500]]]) }, b = { segs: new Map([[1, [100, 1300]]]) }
    expect(wordDurations(w, [a, b, null])).toEqual([{ pos: 1, ms: [500, 1200, null] }])
    expect(wordAtTime(b.segs, 700)).toBe(1)
    expect(wordAtTime(b.segs, 1400)).toBe(null)
  })
  it('zirvələr 0…1', () => {
    const d = new Float32Array(8000).map((_, i) => Math.sin(i / 10) * (i < 4000 ? 0.2 : 0.8))
    const p = peaksOf(d, 10)
    expect(Math.max(...p)).toBeCloseTo(1, 5)
    expect(p[0]).toBeLessThan(0.4)
  })
  it('hər qarinin adı quranAudio RECITERS-də var', () => {
    for (const r of COMPARE_RECITERS) expect(RECITERS.some(x => x.id === r.id)).toBe(true)
  })
})
