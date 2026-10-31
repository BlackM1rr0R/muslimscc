// Kök axtarışı: yerlərin sıxılması, giriş normallaşdırması (ərəbcə + Buckwalter),
// kökün tapılması, xülasə, ayə qrupları, söz indeksi və real indeks faylı.
import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  encodeLocations, decodeLocations, normalizeRootInput, buckwalterToArabic, looseKey, findRoot,
  rootDetails, groupByAyah, buildWordIndex, spacedRoot, verbFormLabel, fetchAyahWords, ROOT_CAT_LABELS,
} from '../../src/utils/quranRoots.js'

describe('yerlərin sıxılması', () => {
  it('encode / decode tərsdir', () => {
    const locs = [[1, 1, 3], [1, 3, 1], [2, 255, 3], [2, 255, 7], [114, 6, 2]]
    const enc = encodeLocations(locs)
    expect(enc).toBe('1:1:3,3:1,2:255:3,255:7,114:6:2')
    expect(decodeLocations(enc)).toEqual(locs)
  })
  it('boş və pozuq giriş', () => {
    expect(decodeLocations('')).toEqual([])
    expect(decodeLocations(null)).toEqual([])
    expect(decodeLocations('5:6')).toEqual([])      // surəsiz qısa yer atılır
  })
})

describe('giriş', () => {
  it('ərəb hərfləri: boşluq, hərəkə, tətvil atılır', () => {
    expect(normalizeRootInput('ر ح م')).toBe('رحم')
    expect(normalizeRootInput(' رَحِمَ ')).toBe('رحم')
    expect(normalizeRootInput('ر-ح-م')).toBe('رحم')
    expect(normalizeRootInput('ر، ح، م')).toBe('رحم')
    expect(normalizeRootInput('عـلـم')).toBe('علم')
    expect(normalizeRootInput('')).toBe('')
  })
  it('Buckwalter', () => {
    expect(buckwalterToArabic('rHm')).toBe('رحم')
    expect(buckwalterToArabic("s'l")).toBe('سءل')
    expect(buckwalterToArabic('>mn')).toBe('أمن')
    expect(buckwalterToArabic('r1m')).toBeNull()
    expect(normalizeRootInput('rHm')).toBe('رحم')
    expect(normalizeRootInput('r-H-m')).toBe('رحم')
    expect(normalizeRootInput('Elm')).toBe('علم')
  })
  it('looseKey həmzə/əlif fərqini silir', () => {
    expect(looseKey('أله')).toBe('اله')
    expect(looseKey('سأل')).toBe(looseKey('سال'))
    expect(looseKey('بدأ')).toBe('بدا')
    expect(looseKey('رأي')).toBe('راي')
  })
  it('spacedRoot', () => {
    expect(spacedRoot('رحم')).toBe('ر ح م')
  })
})

const ROOTS = {
  'رحم': [['رَحِيم', 'ADJ', 0, '1:1:4,3:2,2:37:11'], ['رَحِمَ', 'V', 1, '7:23:9']],
  'أله': [['اللَّه', 'PN', 0, '1:1:2,2:2']],
  'سأل': [['سَأَلَ', 'V', 1, '2:108:9']],
  'سول': [['سَوَّلَ', 'V', 2, '12:18:9']],
}

describe('findRoot', () => {
  it('dəqiq və həmzəsiz uyğunluq', () => {
    expect(findRoot(ROOTS, 'ر ح م').root).toBe('رحم')
    expect(findRoot(ROOTS, 'اله').root).toBe('أله')
    expect(findRoot(ROOTS, 'rHm').root).toBe('رحم')
  })
  it('tapılmır / boş', () => {
    expect(findRoot(ROOTS, 'كتب')).toEqual({ root: null, candidates: [] })
    expect(findRoot(ROOTS, '')).toEqual({ root: null, candidates: [] })
    expect(findRoot(null, 'رحم')).toEqual({ root: null, candidates: [] })
  })
  it('bir neçə həmzəsiz uyğunluq — namizədlər', () => {
    const roots = { 'سأل': [], 'سءل': [] }
    const r = findRoot(roots, 'سال')
    expect(r.root).toBeNull()
    expect(r.candidates.sort()).toEqual(['سأل', 'سءل'].sort())
  })
})

describe('rootDetails / groupByAyah / buildWordIndex', () => {
  it('xülasə: cəmi, formalar, sıralı yerlər', () => {
    const d = rootDetails(ROOTS['رحم'])
    expect(d.total).toBe(4)
    expect(d.forms.map(f => [f.lemma, f.count])).toEqual([['رَحِيم', 3], ['رَحِمَ', 1]])
    expect(d.locations.map(l => l.slice(0, 3))).toEqual([[1, 1, 4], [1, 3, 2], [2, 37, 11], [7, 23, 9]])
  })
  it('ayəyə görə qrup (eyni ayədə iki söz)', () => {
    const g = groupByAyah([[2, 255, 3, 'a'], [2, 255, 7, 'b'], [2, 256, 1, 'a'], [2, 255, 3, 'a']])
    expect(g).toEqual([
      { key: '2:255', s: 2, a: 255, words: [3, 7], lemmas: ['a', 'b'] },
      { key: '2:256', s: 2, a: 256, words: [1], lemmas: ['a'] },
      { key: '2:255', s: 2, a: 255, words: [3], lemmas: ['a'] },
    ])
  })
  it('söz → kök indeksi', () => {
    const idx = buildWordIndex(ROOTS)
    expect(idx.get('1:1:4')).toEqual({ root: 'رحم', lemma: 'رَحِيم', cat: 'ADJ', vf: 0 })
    expect(idx.get('7:23:9')).toMatchObject({ root: 'رحم', cat: 'V', vf: 1 })
    expect(idx.get('1:1:2').root).toBe('أله')
    expect(idx.has('1:1:1')).toBe(false)
  })
})

describe('etiketlər', () => {
  it('feil babı 5 dildə', () => {
    expect(verbFormLabel(2, 'az')).toBe('II bab')
    expect(verbFormLabel(10, 'en')).toBe('form X')
    expect(verbFormLabel(4, 'ru')).toBe('IV порода')
    expect(verbFormLabel(1, 'tr')).toBe('I. bab')
    expect(verbFormLabel(10, 'ar')).toBe('اِسْتَفْعَلَ')
    expect(verbFormLabel(0, 'az')).toBe('')
  })
  it('kateqoriyalar hər dildə tamdır', () => {
    const keys = Object.keys(ROOT_CAT_LABELS.en).sort()
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(Object.keys(ROOT_CAT_LABELS[l]).sort()).toEqual(keys)
  })
})

describe('fetchAyahWords', () => {
  it('sözləri qaytarır və keşləyir; pozuq açar rədd edilir', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ verse: { words: [
        { position: 1, char_type_name: 'word', text_uthmani: 'w1' },
        { position: 2, char_type_name: 'end', text_uthmani: '١' },
      ] } }),
    }))
    const a = await fetchAyahWords('99:1', { fetchImpl })
    expect(a).toEqual([{ p: 1, text: 'w1', type: 'word' }, { p: 2, text: '١', type: 'end' }])
    await fetchAyahWords('99:1', { fetchImpl })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await expect(fetchAyahWords('x:1', { fetchImpl })).rejects.toThrow('bad-key')
    const bad = vi.fn(async () => ({ ok: false }))
    await expect(fetchAyahWords('98:1', { fetchImpl: bad })).rejects.toThrow('network')
  })
})

describe('public/data/quran-roots.json', () => {
  const file = path.resolve(__dirname, '../../public/data/quran-roots.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  it('mənbə və lisenziya göstərilib', () => {
    expect(data.meta.license).toMatch(/General Public License v3/)
    expect(data.meta.source).toMatch(/Quranic Arabic Corpus/)
  })
  it('təxminən 1650 kök, 50 mindən çox söz', () => {
    const roots = Object.keys(data.roots)
    expect(roots.length).toBeGreaterThan(1600)
    expect(data.meta.words).toBeGreaterThan(49000)
    const total = roots.reduce((n, r) => n + rootDetails(data.roots[r]).total, 0)
    expect(total).toBe(data.meta.words)
  })
  it('məşhur köklərin sayları (Quranic Arabic Corpus ilə eyni)', () => {
    expect(rootDetails(data.roots['رحم']).total).toBe(339)
    expect(rootDetails(data.roots['أله']).forms[0].count).toBe(2699)
  })
  it('bütün yerlər düzgündür (surə 1–114, ayə ≥ 1, söz ≥ 1)', () => {
    for (const entries of Object.values(data.roots)) {
      for (const [, , , enc] of entries) {
        for (const [s, a, w] of decodeLocations(enc)) {
          if (!(s >= 1 && s <= 114 && a >= 1 && w >= 1)) throw new Error(`pozuq yer: ${s}:${a}:${w}`)
        }
      }
    }
  })
})
