// Sözbəsöz tilavət (utils/karaoke) — sözlər və vaxtlar
import { describe, it, expect } from 'vitest'
import { buildKaraoke, wordAt } from '../../src/utils/karaoke.js'

const verse = { verse: { words: [
  { position: 1, char_type_name: 'word', text_uthmani: 'ٱلْحَمْدُ' }, { position: 2, char_type_name: 'word', text_uthmani: 'لِلَّهِ' },
  { position: 3, char_type_name: 'word', text_uthmani: 'رَبِّ' }, { position: 4, char_type_name: 'word', text_uthmani: 'ٱلْعَـٰلَمِينَ' },
  { position: 5, char_type_name: 'end', text_uthmani: '٢' },
] } }
const rec = { audio_files: [{ verse_key: '1:2', segments: [[0, 1, 80, 960], [1, 2, 970, 1800], [2, 3, 1810, 2460], [3, 4, 2470, 5140]], url: 'Alafasy/mp3/001002.mp3' }] }

describe('buildKaraoke', () => {
  it('ayə sonu nişanı atılır, vaxtlar sözə bağlanır, URL tam olur', () => {
    const k = buildKaraoke(verse, rec)
    expect(k.url).toBe('https://verses.quran.com/Alafasy/mp3/001002.mp3')
    expect(k.words).toHaveLength(4)
    expect(k.words[1]).toEqual({ pos: 2, text: 'لِلَّهِ', from: 970, to: 1800 })
  })
  it('boş cavab — null', () => {
    expect(buildKaraoke({}, rec)).toBeNull()
    expect(buildKaraoke(verse, { audio_files: [] })).toBeNull()
  })
})

describe('wordAt', () => {
  const { words } = buildKaraoke(verse, rec)
  it('vaxta görə aktiv söz', () => {
    expect(wordAt(words, 0)).toBe(-1)
    expect(wordAt(words, 100)).toBe(0)
    expect(wordAt(words, 1000)).toBe(1)
    expect(wordAt(words, 9000)).toBe(3)
  })
})
