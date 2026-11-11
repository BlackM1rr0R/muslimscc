import { describe, it, expect } from 'vitest'
import { puzzleRounds, shuffledRound, fitsNext, suggestGrade } from '../../src/utils/ayahPuzzle'

describe('ayə tapmacası', () => {
  it('raundlar bərabərə yaxındır və hamısını əhatə edir', () => {
    const w = Array.from({ length: 19 }, (_, i) => `w${i}`)
    const r = puzzleRounds(w, 8)
    expect(r).toEqual([{ from: 0, to: 7 }, { from: 7, to: 14 }, { from: 14, to: 19 }])
    expect(puzzleRounds([], 8)).toEqual([])
    expect(puzzleRounds(['a', 'b'], 8)).toEqual([{ from: 0, to: 2 }])
  })
  it('qarışıq sıra düz sıra deyil, eyni indeksləri saxlayır', () => {
    const w = ['قُلْ', 'هُوَ', 'ٱللَّهُ', 'أَحَدٌ']
    for (let seed = 1; seed < 40; seed++) {
      const s = shuffledRound(w, { from: 0, to: 4 }, seed)
      expect([...s].sort()).toEqual([0, 1, 2, 3])
      expect(s.map(i => w[i]).join(' ')).not.toBe(w.join(' '))
    }
  })
  it('eyni mətnli sözlər bir-birini əvəz edir', () => {
    const w = ['مِن', 'شَرِّ', 'مَا', 'خَلَقَ', 'وَمِن', 'شَرِّ']
    expect(fitsNext(w, 1, 5)).toBe(true)
    expect(fitsNext(w, 1, 2)).toBe(false)
  })
  it('qiymət təklifi', () => {
    expect(suggestGrade(0, 10)).toBe('good')
    expect(suggestGrade(1, 10)).toBe('hard')
    expect(suggestGrade(2, 20)).toBe('hard')
    expect(suggestGrade(4, 10)).toBe('again')
  })
})
