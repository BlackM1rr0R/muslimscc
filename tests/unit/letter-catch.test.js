import { describe, it, expect } from 'vitest'
import {
  WORDS, ALPHABET, LIVES, WORDS_PER_LEVEL, MAX_ITEMS, wordLength, levelSpeed, pickWord, hitTest,
  newGame, neededLetter, step, tap, letterPoints, wordBonus, isolatedForm,
} from '../../src/utils/letterCatch'
import { LETTERS } from '../../src/data/arabicCourse'

// Təkrarlanan təsadüf (mulberry32)
const seeded = (seed = 1) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296
}
const withItems = (s, letters) => ({ ...s, items: letters.map((letter, i) => ({ id: 100 + i, letter, x: 0.1 + i * 0.2, y: 0.3, hue: 0, wrong: 0 })) })
const catchWord = (s) => {
  let st = s
  let result
  for (const ch of st.word.letters) {
    st = withItems(st, [ch])
    ;({ state: st, result } = tap(st, 100))
  }
  return { state: st, result }
}

describe('Hərf tutma — söz siyahısı', () => {
  it('sözlər yalnız 28 əsas hərfdən, kursun hərfləri ilə eynidir; mənalar 4 dildə', () => {
    const course = new Set(LETTERS.map(l => l.ch))
    expect(new Set(ALPHABET)).toEqual(course)
    for (const w of WORDS) {
      for (const ch of w.letters) expect(course.has(ch)).toBe(true)
      expect(w.voc.replace(/[ً-ْ]/g, '')).toBe(w.plain) // hərəkəsiz forma eynidir
      for (const l of ['az', 'en', 'ru', 'tr']) expect(w.m[l]).toBeTruthy()
    }
    expect(new Set(WORDS.map(w => w.id)).size).toBe(WORDS.length)
  })
  it('hər səviyyənin uzunluğunda kifayət qədər söz var', () => {
    for (const len of [3, 4, 5]) expect(WORDS.filter(w => w.letters.length === len).length).toBeGreaterThanOrEqual(WORDS_PER_LEVEL * 2)
  })
  it('pickWord səviyyənin uzunluğunu verir və işlənənləri təkrarlamır', () => {
    expect(wordLength(1)).toBe(3); expect(wordLength(2)).toBe(4); expect(wordLength(3)).toBe(5); expect(wordLength(9)).toBe(5)
    const rng = seeded(7)
    const used = []
    const n3 = WORDS.filter(w => w.letters.length === 3).length
    for (let i = 0; i < n3; i++) { const w = pickWord(1, rng, used); expect(used).not.toContain(w.id); used.push(w.id) }
    expect(pickWord(1, rng, used).letters.length).toBe(3) // qurtardı — yenə də söz verir
  })
  it('isolatedForm hərfləri boşluqla ayırır', () => {
    expect(isolatedForm(WORDS.find(w => w.plain === 'كتاب'))).toBe('ك ت ا ب')
  })
})

describe('Hərf tutma — toxunuş', () => {
  it('sözün hərfləri sıra ilə tutulur, xal artır', () => {
    let s = newGame(seeded(1))
    const [a, b] = s.word.letters
    s = withItems(s, [b, a])
    const r1 = tap(s, 101) // a — birinci hərf
    expect(r1.result).toBe('hit')
    expect(r1.state.idx).toBe(1)
    expect(r1.state.score).toBe(letterPoints(1))
    expect(r1.state.items.map(i => i.id)).toEqual([100])
    expect(neededLetter(r1.state)).toBe(b)
  })
  it('səhv hərf can aparır, hərf titrəyib yox olur, sıra dəyişmir', () => {
    let s = newGame(seeded(2))
    const wrong = ALPHABET.find(c => !s.word.letters.includes(c))
    s = withItems(s, [wrong])
    const r = tap(s, 100)
    expect(r.result).toBe('wrong')
    expect(r.state.lives).toBe(LIVES - 1)
    expect(r.state.idx).toBe(0)
    expect(r.state.score).toBe(0)
    expect(r.state.items[0].wrong).toBeGreaterThan(0)
    expect(tap(r.state, 100).result).toBe('none') // ikinci toxunuş sayılmır
    let f = r.state
    for (let i = 0; i < 5; i++) f = step(f, 0.1, { rng: () => 0.99 })
    expect(f.items.some(i => i.id === 100)).toBe(false)
  })
  it('sıradan qabaq gələn hərf (sözdə olsa da) səhvdir', () => {
    let s = newGame(seeded(3))
    const [, second] = s.word.letters
    if (second === s.word.letters[0]) return
    s = withItems(s, [second])
    expect(tap(s, 100).result).toBe('wrong')
  })
  it('3 səhv — oyun bitir', () => {
    let s = newGame(seeded(4))
    const wrong = ALPHABET.find(c => !s.word.letters.includes(c))
    let result
    for (let i = 0; i < LIVES; i++) { s = withItems(s, [wrong]); ({ state: s, result } = tap(s, 100)) }
    expect(result).toBe('over')
    expect(s.status).toBe('over')
    expect(step(s, 0.05).changed).toBe(false)
  })
  it('söz tamamlananda bonus, bitişik yazılış fazası, sonra yeni söz', () => {
    const s0 = newGame(seeded(5))
    const { state, result } = catchWord(s0)
    expect(result).toBe('word')
    expect(state.phase).toBe('done')
    expect(state.wordsDone).toBe(1)
    expect(state.score).toBe(s0.word.letters.length * letterPoints(1) + wordBonus(1, LIVES))
    let s = state
    for (let i = 0; i < 40; i++) s = step(s, 0.1, { rng: seeded(i) })
    expect(s.phase).toBe('catch')
    expect(s.idx).toBe(0)
    expect(s.word.id).not.toBe(s0.word.id)
    expect(s.level).toBe(1)
  })
})

describe('Hərf tutma — səviyyə və axın', () => {
  it(`${WORDS_PER_LEVEL} sözdən sonra səviyyə artır, söz uzanır, sürət artır`, () => {
    let s = newGame(seeded(9))
    let leveled = false
    for (let k = 0; k < WORDS_PER_LEVEL; k++) {
      s = catchWord(s).state
      for (let i = 0; i < 40; i++) { s = step(s, 0.1, { rng: seeded(k * 50 + i) }); if (s.levelUp) leveled = true }
    }
    expect(leveled).toBe(true)
    expect(s.level).toBe(2)
    expect(s.word.letters.length).toBe(4)
    expect(levelSpeed(2).fall).toBeGreaterThan(levelSpeed(1).fall)
    expect(levelSpeed(5).every).toBeLessThan(levelSpeed(1).every)
    expect(levelSpeed(1, { reduced: true }).fall).toBeLessThan(levelSpeed(1).fall)
    expect(levelSpeed(5, { slow: true }).fall).toBe(0.01)
  })
  it('hərflər düşür, çıxır, ekranda MAX_ITEMS-dan çox olmur; lazım olan hərf tez-tez gəlir', () => {
    let s = newGame(seeded(11))
    const need = neededLetter(s)
    let seenNeed = 0
    let max = 0
    const seen = new Set()
    for (let i = 0; i < 600; i++) {
      s = step(s, 1 / 30, { rng: seeded(1000 + i) })
      max = Math.max(max, s.items.length)
      for (const it of s.items) if (!seen.has(it.id)) { seen.add(it.id); if (it.letter === need) seenNeed++ }
    }
    expect(seen.size).toBeGreaterThan(5)
    expect(max).toBeLessThanOrEqual(MAX_ITEMS)
    expect(seenNeed).toBeGreaterThanOrEqual(Math.floor(seen.size / 3))
    expect(s.lives).toBe(LIVES) // buraxılan hərf cəzasızdır
    expect(s.items.every(it => it.y <= 1.05)).toBe(true)
  })
  it('fasilədə vəziyyət dəyişmir', () => {
    const s = { ...withItems(newGame(seeded(12)), ['ب']), status: 'paused' }
    const n = step(s, 0.1)
    expect(n.items[0].y).toBe(0.3)
    expect(tap(s, 100).result).toBe('none')
  })
  it('hitTest yaxın hərfi tapır', () => {
    const items = [{ id: 1, x: 0.5, y: 0.5, wrong: 0 }, { id: 2, x: 0.1, y: 0.1, wrong: 0.2 }]
    expect(hitTest(items, 0.52, 0.5)?.id).toBe(1)
    expect(hitTest(items, 0.1, 0.1)).toBe(null)
    expect(hitTest(items, 0.9, 0.9)).toBe(null)
  })
})
