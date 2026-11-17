// Səhabə kartları albomu — saf məntiq (src/utils/sahabaAlbum.js)
import { describe, it, expect, beforeEach } from 'vitest'
import { SAHABA, slugOf } from '../../src/data/sahaba.js'
import {
  ALBUM_KEY, META_KEY, readAlbum, markSahabaSeen, readMeta, writeMeta, progressOf, groupOf,
  setsOf, milestonesFor, badgesOf, newBadges, pendingReveals, firstSentence, laqabOf, arabicInitial,
} from '../../src/utils/sahabaAlbum.js'

function memStorage() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    clear: () => m.clear(),
  }
}

beforeEach(() => {
  const ls = memStorage()
  globalThis.window = globalThis.window || {}
  Object.defineProperty(globalThis.window, 'localStorage', { value: ls, configurable: true })
  globalThis.window.dispatchEvent = globalThis.window.dispatchEvent || (() => true)
  if (typeof globalThis.CustomEvent === 'undefined') globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o?.detail } }
})

const slugs = SAHABA.map(slugOf)

describe('albom yaddaşı', () => {
  it('boş / səhv JSON → {}', () => {
    expect(readAlbum()).toEqual({})
    globalThis.window.localStorage.setItem(ALBUM_KEY, '{bad')
    expect(readAlbum()).toEqual({})
    globalThis.window.localStorage.setItem(ALBUM_KEY, '[1,2]')
    expect(readAlbum()).toEqual({})
  })
  it('markSahabaSeen ilk vaxtı bir dəfə yazır', () => {
    expect(markSahabaSeen('abu-hurairah', new Date('2026-01-02T03:04:05Z'))).toBe(true)
    expect(markSahabaSeen('abu-hurairah', new Date('2026-05-05T00:00:00Z'))).toBe(false)
    expect(readAlbum()).toEqual({ 'abu-hurairah': '2026-01-02T03:04:05.000Z' })
  })
  it('boş slug yazılmır, localStorage xətası atılmır', () => {
    expect(markSahabaSeen('')).toBe(false)
    expect(markSahabaSeen(null)).toBe(false)
    Object.defineProperty(globalThis.window, 'localStorage', { get() { throw new Error('denied') }, configurable: true })
    expect(markSahabaSeen('x')).toBe(false)
    expect(readAlbum()).toEqual({})
    expect(readMeta()).toEqual({ shown: [], ms: [] })
  })
  it('meta təkrarsız yazılır', () => {
    writeMeta({ shown: ['a', 'a', 'b'], ms: ['all'] })
    expect(JSON.parse(globalThis.window.localStorage.getItem(META_KEY))).toEqual({ shown: ['a', 'b'], ms: ['all'] })
    expect(readMeta()).toEqual({ shown: ['a', 'b'], ms: ['all'] })
  })
})

describe('irəliləyiş və nişanlar', () => {
  it('progressOf mövcud olmayan slug-ları saymır', () => {
    expect(progressOf({ [slugs[0]]: 't', ghost: 't' }, slugs)).toEqual({ seen: 1, total: slugs.length, pct: Math.round(100 / slugs.length) })
  })
  it('mərhələlər cəmdən asılıdır', () => {
    expect(milestonesFor(20)).toEqual([5, 10, 20])
    expect(milestonesFor(120)).toEqual([5, 10, 25, 50, 120])
    expect(milestonesFor(0)).toEqual([])
  })
  it('dəstlər məlumatdan çıxır: 4 raşid xəlifə, qadınlar, ravilər', () => {
    const sets = Object.fromEntries(setsOf(SAHABA, slugOf).map(d => [d.id, d.slugs]))
    expect(sets['set:caliphs']).toEqual(['abu-bakr-as-siddiq', 'umar-ibn-al-khattab', 'uthman-ibn-affan', 'ali-ibn-abi-talib'])
    expect(sets['set:women']).toContain('khadijah-bint-khuwaylid')
    expect(sets['set:narrators']).toContain('abu-hurairah')
    expect(Object.keys(sets)).not.toContain('set:ten')
  })
  it('badgesOf + newBadges', () => {
    const album = Object.fromEntries(slugs.slice(0, 5).map(s => [s, 't']))
    const b = badgesOf(album, SAHABA, slugOf)
    expect(b.find(x => x.id === 'n:5').done).toBe(true)
    expect(b.find(x => x.id === 'n:10').done).toBe(false)
    expect(b.find(x => x.id === 'set:caliphs').done).toBe(true)
    expect(b.find(x => x.id === 'all').have).toBe(5)
    expect(newBadges(b, ['n:5']).map(x => x.id)).toEqual(['set:caliphs'])
    const full = badgesOf(Object.fromEntries(slugs.map(s => [s, 't'])), SAHABA, slugOf)
    expect(full.every(x => x.done)).toBe(true)
  })
  it('pendingReveals', () => {
    expect(pendingReveals({ a: 't', b: 't' }, ['a'])).toEqual(['b'])
    expect(pendingReveals({ a: 't' }, [], ['a', 'c'])).toEqual(['a'])
  })
  it('groupOf', () => {
    const by = Object.fromEntries(SAHABA.map(s => [slugOf(s), groupOf(s)]))
    expect(by['umar-ibn-al-khattab']).toBe('caliph')
    expect(by['aisha-bint-abi-bakr']).toBe('woman')
    expect(by['anas-ibn-malik']).toBe('narrator')
    expect(by['bilal-ibn-rabah']).toBe('companion')
  })
})

describe('kart mətni — profildən hərfiyyən', () => {
  it('birinci cümlə bio-nun başlanğıcıdır (bütün dillər)', () => {
    for (const s of SAHABA) {
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
        const f = firstSentence(s.bio[l])
        expect(f.length).toBeGreaterThan(5)
        expect(s.bio[l].startsWith(f)).toBe(true)
      }
    }
  })
  it('"Hz." qısaltmasında bölmür', () => {
    expect(firstSentence('Hz. Peyğəmbər gəldi. Sonra getdi.')).toBe('Hz. Peyğəmbər gəldi.')
  })
  it('ləqəb faktdan götürülür, adla eynidirsə boşdur', () => {
    const by = Object.fromEntries(SAHABA.map(s => [slugOf(s), s]))
    expect(laqabOf(by['umar-ibn-al-khattab'], 'en')).toBe('Al-Faruq')
    expect(laqabOf(by['khalid-ibn-al-walid'], 'az')).toBe('Seyfullah')
    expect(laqabOf(by['abu-hurairah'], 'en')).toBe('')
    expect(laqabOf(by['bilal-ibn-rabah'], 'en')).toBe('')
    for (const s of SAHABA) {
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
        const v = laqabOf(s, l)
        if (v) expect(s.facts.some(f => String(f[l]).includes(v))).toBe(true)
      }
    }
  })
  it('ərəbcə ilk hərf', () => {
    expect(arabicInitial('أبو بكر الصديق')).toBe('أ')
    expect(arabicInitial('')).toBe('·')
  })
})
