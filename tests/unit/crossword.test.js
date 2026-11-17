// Krossvord generatoru (src/utils/crossword.js) + söz mənbəyi (src/utils/kidsWordData.js):
// deterministiklik, 8–12 söz, kəsişmə, şəbəkənin düzgünlüyü (təsadüfi söz əmələ gəlmir).
import { describe, it, expect } from 'vitest'
import { generateCrossword, wordCells, CW_LEVELS, CW_MAX_SIZE, mulberry32 } from '../../src/utils/crossword.js'
import { crosswordEntries, cwLetters, cwKey, dropArticle, maskWord, WORD_THEMES } from '../../src/utils/kidsWordData.js'

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

function runs(p) {
  // Şəbəkədəki bütün ≥2 hərfli ardıcıllıqlar (üfüqi + şaquli)
  const out = []
  for (let r = 0; r < p.rows; r++) {
    let s = null
    for (let c = 0; c <= p.cols; c++) {
      const on = c < p.cols && p.cells[r][c]
      if (on && s == null) s = c
      if (!on && s != null) { if (c - s >= 2) out.push(`a:${r},${s},${c - s}`); s = null }
    }
  }
  for (let c = 0; c < p.cols; c++) {
    let s = null
    for (let r = 0; r <= p.rows; r++) {
      const on = r < p.rows && p.cells[r][c]
      if (on && s == null) s = r
      if (!on && s != null) { if (r - s >= 2) out.push(`d:${s},${c},${r - s}`); s = null }
    }
  }
  return out.sort()
}

describe('kidsWordData', () => {
  it('letters: locale upper-case, no circumflex/hyphen', () => {
    expect(cwLetters('İsmâil', 'tr').join('')).toBe('İSMAİL')
    expect(cwLetters('Zül-Kifl', 'az').join('')).toBe('ZÜLKİFL')
    expect(cwLetters('Əyyub', 'az').join('')).toBe('ƏYYUB')
    expect(cwLetters('Сулейман', 'ru').join('')).toBe('СУЛЕЙМАН')
    expect(cwLetters('ٱلرَّحۡمَٰنُ', 'ar').join('')).toBe('الرحمن')
    expect(cwLetters('Muhammad ﷺ', 'en')).toBe(null)
    expect(cwKey('i', 'tr')).toBe('İ')
    expect(cwKey('i', 'en')).toBe('I')
    expect(cwKey('ı', 'az')).toBe('I')
  })
  it('articles', () => {
    expect(dropArticle('Al-Baqarah', 'en')).toBe('Baqarah')
    expect(dropArticle('Аль-Бакара', 'ru')).toBe('Бакара')
    expect(dropArticle('البقرة', 'ar')).toBe('بقرة')
    expect(dropArticle('الله', 'ar')).toBe('الله')
  })
  it('mask', () => {
    expect(maskWord('Yunus (ə.s)', 'Yunus')).toBe('… (ə.s)')
  })
  it('every theme × language has enough words and no clue reveals its answer', () => {
    for (const lang of LANGS) {
      for (const theme of WORD_THEMES) {
        const e = crosswordEntries(theme, lang)
        expect(e.length, `${theme}/${lang}`).toBeGreaterThanOrEqual(15)
        for (const w of e) {
          expect(w.clue.length).toBeGreaterThan(0)
          if (lang !== 'ar') expect(w.clue.toLocaleUpperCase(lang).includes(w.answer.toLocaleUpperCase(lang)), `${w.answer}: ${w.clue}`).toBe(false)
        }
      }
    }
  })
})

describe('generateCrossword', () => {
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(7), b = mulberry32(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('same seed → same puzzle; another seed → different', () => {
    const e = crosswordEntries('prophets', 'az')
    const p1 = generateCrossword(e, { seed: 42, count: 10 })
    const p2 = generateCrossword(e, { seed: 42, count: 10 })
    const p3 = generateCrossword(e, { seed: 43, count: 10 })
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
    expect(JSON.stringify(p1)).not.toBe(JSON.stringify(p3))
  })

  for (const lang of LANGS) {
    for (const theme of WORD_THEMES) {
      it(`${theme}/${lang}: 8–12 intersecting words, consistent grid`, () => {
        const entries = crosswordEntries(theme, lang)
        for (const [lvl, count] of Object.entries(CW_LEVELS)) {
          for (const seed of [1, 2, 3, 2026]) {
            const p = generateCrossword(entries, { seed, count })
            expect(p.words.length, `${lvl} seed ${seed}`).toBeGreaterThanOrEqual(Math.min(count, 8))
            expect(p.words.length).toBeLessThanOrEqual(count)
            expect(p.rows).toBeLessThanOrEqual(CW_MAX_SIZE)
            expect(p.cols).toBeLessThanOrEqual(CW_MAX_SIZE)
            // Hər sözün hərfləri şəbəkədədir
            const owners = new Map()
            for (const w of p.words) {
              expect(w.num).toBeGreaterThan(0)
              expect(p.cells[w.r][w.c].num).toBe(w.num)
              wordCells(w).forEach(([r, c], i) => {
                expect(p.cells[r][c]?.ch).toBe(w.letters[i])
                owners.set(`${r},${c}`, (owners.get(`${r},${c}`) || 0) + 1)
              })
            }
            // Hər söz ən azı bir başqası ilə kəsişir
            for (const w of p.words) {
              expect(wordCells(w).some(([r, c]) => owners.get(`${r},${c}`) > 1)).toBe(true)
            }
            // Şəbəkədəki ardıcıllıqlar = yerləşdirilmiş sözlər (artıq söz yox)
            const placed = p.words.map(w => `${w.dir}:${w.r},${w.c},${w.letters.length}`).sort()
            expect(runs(p)).toEqual(placed)
          }
        }
      })
    }
  }
})
