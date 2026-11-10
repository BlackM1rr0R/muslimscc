// Ayənin sözləri (utils/ayahWords) — uzun basılan sözün sırası, API cavabı, səs aralığı
import { describe, it, expect } from 'vitest'
import { ayahWordTokens, wordAtOffset, parseWordInfo, wordSegment, wordLang, stripMarks, fetchWordInfo, wordInfoUrl } from '../../src/utils/ayahWords.js'

// 2:2 — alquran.cloud mətnində vəqf işarəsi (ۛ) ayrıca parça kimi gəlir
const A22 = 'ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ'

describe('ayahWordTokens', () => {
  it('vəqf işarələri söz sayılmır — sıra Quran.com ilə eynidir', () => {
    const t = ayahWordTokens(A22)
    expect(t.map(x => x.text)).toEqual(['ذَٰلِكَ', 'ٱلْكِتَٰبُ', 'لَا', 'رَيْبَ', 'فِيهِ', 'هُدًى', 'لِّلْمُتَّقِينَ'])
    expect(t.map(x => x.pos)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(A22.slice(t[4].start, t[4].end)).toBe('فِيهِ')
  })
  it('۞ (hizb nişanı) da sayılmır', () => {
    expect(ayahWordTokens('۞ إِنَّ ٱللَّهَ').map(x => x.pos)).toEqual([1, 2])
  })
  it('ərəb hərfi olmayan mətndə hər parça söz sayılır', () => {
    expect(ayahWordTokens('[test ayə 1]').length).toBe(3)
    expect(ayahWordTokens('')).toEqual([])
  })
})

describe('wordAtOffset', () => {
  const t = ayahWordTokens(A22)
  it('sözün içində', () => { expect(wordAtOffset(t, t[1].start + 2).pos).toBe(2) })
  it('sözün sonunda (kursor sərhəddə)', () => { expect(wordAtOffset(t, t[0].end).pos).toBe(1) })
  it('vəqf işarəsinin üstündə — ən yaxın söz', () => {
    const mark = A22.indexOf('ۛ')
    expect([4, 5]).toContain(wordAtOffset(t, mark).pos)
  })
  it('boş', () => { expect(wordAtOffset([], 3)).toBe(null); expect(wordAtOffset(t, NaN)).toBe(null) })
})

describe('parseWordInfo', () => {
  it('yalnız sözlər; tərcümə və transliterasiya', () => {
    const w = parseWordInfo({ verse: { words: [
      { position: 1, char_type_name: 'word', text_uthmani: 'ٱلْحَمْدُ', translation: { text: 'All praises and thanks' }, transliteration: { text: "al-ḥamdu" } },
      { position: 2, char_type_name: 'end', text_uthmani: '٢' },
    ] } })
    expect(w).toEqual([{ p: 1, ar: 'ٱلْحَمْدُ', tr: 'All praises and thanks', tl: 'al-ḥamdu' }])
    expect(parseWordInfo(null)).toEqual([])
  })
})

describe('fetchWordInfo', () => {
  it('URL və keş', async () => {
    let calls = 0
    const fetchImpl = async (url) => {
      calls++
      expect(url).toBe(wordInfoUrl('1:2', 'tr'))
      return { ok: true, json: async () => ({ verse: { words: [{ position: 1, char_type_name: 'word', text_uthmani: 'x', translation: { text: 'hamd' } }] } }) }
    }
    const a = await fetchWordInfo('1:2', 'tr', { fetchImpl })
    const b = await fetchWordInfo('1:2', 'tr', { fetchImpl })
    expect(a[0].tr).toBe('hamd'); expect(b).toBe(a); expect(calls).toBe(1)
    expect(wordInfoUrl('1:2', 'tr')).toContain('language=tr')
  })
  it('səhv açar', async () => { await expect(fetchWordInfo('abc')).rejects.toThrow('bad-key') })
})

describe('wordSegment / wordLang / stripMarks', () => {
  it('səs aralığı', () => {
    const audio = { words: [{ pos: 1, from: 80, to: 960 }, { pos: 2, from: null, to: null }] }
    expect(wordSegment(audio, 1)).toEqual({ from: 80, to: 960 })
    expect(wordSegment(audio, 2)).toBe(null)
    expect(wordSegment(null, 1)).toBe(null)
  })
  it('söz tərcüməsinin dili: en/tr, qalanları ingiliscə', () => {
    expect(wordLang('tr')).toBe('tr'); expect(wordLang('az')).toBe('en'); expect(wordLang('ru')).toBe('en')
  })
  it('hərəkələr atılır', () => { expect(stripMarks('رَيْبَ')).toBe('ريب') })
})
