import { describe, it, expect } from 'vitest'
import { wordRange, pickAyah, timeFor, levelScore, shuffleIdx } from '../../src/utils/ayahRace.js'

const mk = (key, n) => ({ key, words: Array.from({ length: n }, (_, i) => `w${i}`) })

describe('ayə yarışı', () => {
  it('səviyyə artdıqca ayə uzanır', () => {
    expect(wordRange(1)).toEqual([3, 4])
    expect(wordRange(5)[0]).toBeGreaterThan(wordRange(2)[0])
    expect(wordRange(50)[1]).toBe(14)
  })
  it('aralıqdakı ayə seçilir, görülən təkrarlanmır, yoxdursa ən yaxını', () => {
    const pool = [mk('a', 3), mk('b', 4), mk('c', 9)]
    expect(['a', 'b']).toContain(pickAyah(pool, 1, new Set(), () => 0.5).key)
    expect(pickAyah(pool, 1, new Set(['a']), () => 0).key).toBe('b')
    expect(pickAyah(pool, 6, new Set(), () => 0).key).toBe('c')
    expect(pickAyah([], 1)).toBeNull()
  })
  it('vaxt və xal', () => {
    expect(timeFor(10, 1)).toBeGreaterThan(timeFor(4, 1))
    expect(timeFor(10, 10)).toBeLessThan(timeFor(10, 1))
    expect(levelScore(5, 7.9)).toBe(64)
  })
  it('qarışdırma sıranı dəyişir və bütün indeksləri saxlayır', () => {
    const s = shuffleIdx(6, 7)
    expect([...s].sort()).toEqual([0, 1, 2, 3, 4, 5])
    expect(s).not.toEqual([0, 1, 2, 3, 4, 5])
  })
})
