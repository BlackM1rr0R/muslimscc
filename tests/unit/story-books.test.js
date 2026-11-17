// Şəkilli hekayə kitabları (src/utils/storyBooks.js): mətn səhifələrə YALNIZ
// bölünür — birləşməsi orijinalın eynisidir, heç bir söz dəyişmir.
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { STORIES } from '../../src/data/pageGuides/KidsPage.js'
import {
  splitSentences, splitClauses, paginate, pageFraction, beatAt, bookId, parseRef,
  loadProgress, saveProgress, STORAGE_KEY, rng,
} from '../../src/utils/storyBooks.js'
import { BOOK_ART } from '../../src/components/storybook/books.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']

describe('splitSentences', () => {
  it('splits at sentence ends and keeps trailing spaces', () => {
    const t = 'One. Two! Three? Four'
    expect(splitSentences(t)).toEqual(['One. ', 'Two! ', 'Three? ', 'Four'])
  })
  it('does not split inside quotes, but after a closing quote', () => {
    const t = 'He said: “Ask them. If they can speak!” They knew.'
    expect(splitSentences(t)).toEqual(['He said: “Ask them. If they can speak!” ', 'They knew.'])
  })
  it('keeps «…!» — dedi together and lowercase continuations', () => {
    const t = 'Dedi: «Sorun!» — dedi. Sonra getdi.'
    expect(splitSentences(t)).toEqual(['Dedi: «Sorun!» — dedi. ', 'Sonra getdi.'])
    expect(splitSentences('“Sorun!” dedi. Bitdi.')).toEqual(['“Sorun!” dedi. ', 'Bitdi.'])
  })
  it('handles Arabic question mark and empty input', () => {
    expect(splitSentences('كيف؟ قال.')).toEqual(['كيف؟ ', 'قال.'])
    expect(splitSentences('')).toEqual([])
    expect(splitSentences(null)).toEqual([])
  })
  it('splitClauses splits only outside quotes', () => {
    const t = 'أ، ب «ج، د» هـ؛ و'
    expect(splitClauses(t).join('')).toBe(t)
    expect(splitClauses(t)).toEqual(['أ، ', 'ب «ج، د» هـ؛ ', 'و'])
  })
})

describe('paginate — every story, every language', () => {
  for (const st of STORIES) {
    for (const l of LANGS) {
      it(`${bookId(st)} / ${l}: pages concatenate to the original text`, () => {
        const text = st.text[l]
        expect(typeof text).toBe('string')
        const pages = paginate(text)
        expect(pages.length).toBeGreaterThan(0)
        expect(pages.map(p => p.text).join('')).toBe(text)
        // mövqelər ardıcıldır və mətni tam örtür
        expect(pages[0].from).toBe(0)
        expect(pages[pages.length - 1].to).toBe(text.length)
        pages.forEach((p, i) => {
          expect(text.slice(p.from, p.to)).toBe(p.text)
          if (i) expect(p.from).toBe(pages[i - 1].to)
          expect(p.text.trim().length).toBeGreaterThan(0)
        })
      })
    }
  }
  it('is deterministic', () => {
    const t = STORIES[1].text.en
    expect(paginate(t)).toEqual(paginate(t))
  })
  it('respects maxChars when sentences allow it', () => {
    const t = 'The sea was very calm. The ship sailed far. Then night came down. The stars were bright.'
    expect(paginate(t, { maxChars: 45 }).map(p => p.text)).toEqual(['The sea was very calm. The ship sailed far. ', 'Then night came down. The stars were bright.'])
  })
  it('joins a very short last page to the previous one', () => {
    const t = 'The sea was very calm and wide. The ship sailed. End.'
    expect(paginate(t, { maxChars: 32 }).map(p => p.text)).toEqual([t])
  })
})

describe('helpers', () => {
  it('pageFraction and beatAt', () => {
    expect(pageFraction({ from: 0, to: 10 }, 100)).toBeCloseTo(0.05)
    const beats = [{ at: 0 }, { at: 0.4 }, { at: 0.8 }]
    expect(beatAt(beats, 0)).toBe(0)
    expect(beatAt(beats, 0.5)).toBe(1)
    expect(beatAt(beats, 0.99)).toBe(2)
  })
  it('bookId is stable and unique', () => {
    const ids = STORIES.map(bookId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('nuh')
    expect(ids).toContain('ibrahim-and-ismail')
  })
  it('every story has art and valid refs', () => {
    for (const st of STORIES) {
      expect(BOOK_ART[bookId(st)], bookId(st)).toBeTruthy()
      for (const r of st.refs) expect(parseRef(r), r).not.toBeNull()
    }
  })
  it('parseRef', () => {
    expect(parseRef('2:30-37')).toEqual({ s: 2, a: 30, to: 37 })
    expect(parseRef('12:4')).toEqual({ s: 12, a: 4, to: 4 })
    expect(parseRef('200:1')).toBeNull()
    expect(parseRef('x')).toBeNull()
  })
  it('rng is deterministic', () => {
    const a = rng(5), b = rng(5)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})

describe('progress storage', () => {
  let store
  beforeEach(() => {
    store = {}
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
    }
  })
  it('saves and loads per book', () => {
    saveProgress('nuh', 3)
    saveProgress('yunus', 1)
    expect(loadProgress()).toEqual({ nuh: 3, yunus: 1 })
    expect(JSON.parse(store[STORAGE_KEY]).nuh).toBe(3)
  })
  it('survives broken JSON and blocked storage', () => {
    store[STORAGE_KEY] = '{oops'
    expect(loadProgress()).toEqual({})
    globalThis.localStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
    expect(loadProgress()).toEqual({})
    expect(saveProgress('nuh', 1)).toBeNull()
  })
})

// Sahibin qərarı: uşaq bölməsində canlı təsviri yoxdur (heyvan, quş, balıq,
// həşərat da). Səhnə fayllarında belə parçalar nə ixrac, nə də istifadə olunmalıdır.
describe('no living beings in the art', () => {
  const dir = path.resolve(__dirname, '../../src/components/storybook')
  const files = fs.readdirSync(dir).filter(f => /\.(jsx?|tsx?)$/.test(f))
  const CREATURE = /(Fish|Whale|Camel|Bird|Ant|Insect|Butterfl|Bee|Horse|Sheep|Cat|Dog|Hoopoe|Dove)\b/
  it('kit and scenes have no creature components', () => {
    expect(files.length).toBeGreaterThan(3)
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8')
      const exported = [...src.matchAll(/export\s+(?:function|const)\s+(\w+)/g)].map(m => m[1])
      const used = [...src.matchAll(/<([A-Z]\w*)/g)].map(m => m[1])
      for (const name of [...exported, ...used]) expect(CREATURE.test(name), `${f}: ${name}`).toBe(false)
    }
  })
  it('no scene step is named after a creature', () => {
    for (const [id, art] of Object.entries(BOOK_ART)) {
      for (const b of art.beats) expect(/fish|ant|bird|camel/i.test(b.k), `${id}: ${b.k}`).toBe(false)
    }
  })
})
