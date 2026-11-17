// Yaddaş cütləri (src/utils/memoryPairs.js): göyərtə, gedişlər, qələbə, ən yaxşı nəticə.
import { describe, it, expect } from 'vitest'
import { buildDeck, newGame, flip, settle, isWon, updateBest, readBest, writeBest, bestKey, MEMORY_SIZES, MEMORY_BEST_KEY } from '../../src/utils/memoryPairs.js'
import { memoryPairs, WORD_THEMES } from '../../src/utils/kidsWordData.js'

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

describe('memoryPairs data', () => {
  it('every theme × language has ≥ 8 pairs with Arabic on side a', () => {
    for (const lang of LANGS) {
      for (const theme of WORD_THEMES) {
        const p = memoryPairs(theme, lang)
        expect(p.length, `${theme}/${lang}`).toBeGreaterThanOrEqual(8)
        for (const x of p) {
          expect(x.a.lang).toBe('ar')
          expect(/[؀-ۿ]/.test(x.a.text)).toBe(true)
          expect(x.b.text.length).toBeGreaterThan(0)
          expect(x.a.text).not.toBe(x.b.text)
        }
      }
    }
  })
})

describe('buildDeck', () => {
  const pairs = memoryPairs('names', 'az')
  it('sizes 8/12/16: every pair twice, deterministic', () => {
    for (const size of MEMORY_SIZES) {
      const d = buildDeck(pairs, size, 9)
      expect(d.length).toBe(size)
      const count = {}
      d.forEach(c => { count[c.pair] = (count[c.pair] || 0) + 1 })
      expect(Object.values(count).every(n => n === 2)).toBe(true)
      expect(new Set(d.map(c => c.text)).size).toBe(size)
      expect(buildDeck(pairs, size, 9)).toEqual(d)
    }
    expect(buildDeck(pairs, 16, 1)).not.toEqual(buildDeck(pairs, 16, 2))
  })
})

describe('game', () => {
  const deck = buildDeck(memoryPairs('surahs', 'en'), 8, 3)
  const partner = (i) => deck.findIndex((c, j) => j !== i && c.pair === deck[i].pair)
  const other = (i) => deck.findIndex(c => c.pair !== deck[i].pair)

  it('mismatch → 1 move, stays open until settle', () => {
    let s = newGame(deck)
    s = flip(s, 0)
    expect(s.moves).toBe(0)
    s = flip(s, other(0))
    expect(s.moves).toBe(1)
    expect(s.open.length).toBe(2)
    expect(flip(s, partner(0))).toBe(s) // bağlanmadan yeni kart açılmır
    s = settle(s)
    expect(s.open).toEqual([])
  })

  it('same card twice is ignored; match → matched', () => {
    let s = newGame(deck)
    s = flip(s, 0)
    expect(flip(s, 0)).toBe(s)
    s = flip(s, partner(0))
    expect(s.matched).toEqual([deck[0].pair])
    expect(s.open).toEqual([])
    expect(flip(s, 0)).toBe(s) // tapılmış kart açılmır
  })

  it('perfect game: moves = pairs, won', () => {
    let s = newGame(deck)
    const done = new Set()
    deck.forEach((c, i) => {
      if (done.has(c.pair)) return
      done.add(c.pair)
      s = flip(flip(s, i), partner(i))
    })
    expect(isWon(s)).toBe(true)
    expect(s.moves).toBe(4)
  })
})

describe('best score', () => {
  it('lower is better', () => {
    let r = updateBest({}, bestKey('names', 8), 10)
    expect(r.improved).toBe(true)
    r = updateBest(r.map, 'names-8', 12)
    expect(r.improved).toBe(false)
    expect(r.map['names-8']).toBe(10)
    r = updateBest(r.map, 'names-8', 7)
    expect(r.map['names-8']).toBe(7)
  })
  it('storage round-trip and broken JSON', () => {
    const mem = {}
    const st = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v } }
    writeBest({ 'names-8': 5 }, st)
    expect(JSON.parse(mem[MEMORY_BEST_KEY])).toEqual({ 'names-8': 5 })
    expect(readBest(st)).toEqual({ 'names-8': 5 })
    mem[MEMORY_BEST_KEY] = '{oops'
    expect(readBest(st)).toEqual({})
  })
})
