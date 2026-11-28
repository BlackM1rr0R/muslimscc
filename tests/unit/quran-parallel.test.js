// Paralel tərcümə (src/utils/quranParallel.js): seçim, yaddaş, alquran.cloud cavabının yoxlanması
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  PAR_KEY, PAR_MAX, BASE_EDITIONS, parallelEntry, parallelGroups, sanitizeKeys, defaultKeys,
  readParallel, writeParallel, toggleKey, editionRows, isEditionKey,
} from '../../src/utils/quranParallel.js'
import { QURANENC_CATALOG } from '../../src/utils/quranEnc.js'

describe('paralel tərcümə — seçimlər', () => {
  it('yalnız saytın nəşrləri: 5 standart nəşr + QuranEnc kataloqu', () => {
    const all = parallelGroups('az').flatMap(g => g.items.map(i => i.key))
    expect(all).toHaveLength(5 + QURANENC_CATALOG.length)
    for (const e of Object.values(BASE_EDITIONS)) expect(all).toContain(e)
    for (const t of QURANENC_CATALOG) expect(all).toContain(t.key)
    expect(new Set(all).size).toBe(all.length)
  })
  it('interfeys dilinin qrupu birinci gəlir', () => {
    expect(parallelGroups('ru')[0].lang).toBe('ru')
    expect(parallelGroups('ar')[0].items[0].key).toBe('ar.muyassar')
  })
  it('naməlum açar rədd edilir, təkrar atılır, ən çox 3', () => {
    expect(parallelEntry('xx.fake')).toBeNull()
    expect(sanitizeKeys(['az.mammadaliyev', 'az.mammadaliyev', 'xx', 'en.asad', 'ru.kuliev', 'tr.diyanet'])).toEqual(['az.mammadaliyev', 'en.asad', 'ru.kuliev'])
    expect(sanitizeKeys('az.mammadaliyev')).toEqual([])
    expect(isEditionKey('en.asad')).toBe(true)
    expect(isEditionKey('english_saheeh')).toBe(false)
  })
  it('ilkin seçim: dilin standart nəşri + ikinci tərcümə', () => {
    expect(defaultKeys('az')).toEqual(['az.mammadaliyev', 'azeri_musayev'])
    expect(defaultKeys('en', { transKey: 'english_hilali_khan' })).toEqual(['en.asad', 'english_hilali_khan'])
    expect(defaultKeys('tr', { cmpKey: 'turkish_shaban' })).toEqual(['tr.diyanet', 'turkish_shaban'])
    expect(defaultKeys('id')).toHaveLength(2)
  })
  it('toggleKey: əlavə / çıxar, 3-dən sonra əlavə etmir', () => {
    let k = toggleKey([], 'en.asad')
    k = toggleKey(k, 'ru.kuliev')
    k = toggleKey(k, 'tr.diyanet')
    expect(k).toHaveLength(PAR_MAX)
    expect(toggleKey(k, 'az.mammadaliyev')).toEqual(k)
    expect(toggleKey(k, 'ru.kuliev')).toEqual(['en.asad', 'tr.diyanet'])
  })
})

describe('paralel tərcümə — yaddaş', () => {
  let store
  beforeEach(() => {
    store = {}
    globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] } }
  })
  afterEach(() => { delete globalThis.localStorage })
  it('yazılır və oxunur, pozuq dəyər — standart', () => {
    expect(readParallel()).toEqual({ on: false, keys: [] })
    writeParallel({ on: true, keys: ['az.mammadaliyev', 'bad', 'azeri_musayev'] })
    expect(JSON.parse(store[PAR_KEY])).toEqual({ on: true, keys: ['az.mammadaliyev', 'azeri_musayev'] })
    expect(readParallel()).toEqual({ on: true, keys: ['az.mammadaliyev', 'azeri_musayev'] })
    store[PAR_KEY] = '{pozuq'
    expect(readParallel()).toEqual({ on: false, keys: [] })
    store[PAR_KEY] = '[1,2]'
    expect(readParallel()).toEqual({ on: false, keys: [] })
  })
  it('yaddaş bağlıdırsa — səhv atmır', () => {
    globalThis.localStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
    expect(readParallel()).toEqual({ on: false, keys: [] })
    expect(writeParallel({ on: true, keys: ['en.asad'] })).toEqual({ on: true, keys: ['en.asad'] })
  })
})

describe('paralel tərcümə — alquran.cloud cavabı', () => {
  const ed = (id, n, t = 'x') => ({ edition: { identifier: id }, ayahs: Array.from({ length: n }, (_, i) => ({ text: `${i === 0 ? '﻿' : ''}${t} ${i + 1} ` })) })
  it('nəşrlər identifikatora görə, BOM və boşluq atılır', () => {
    const r = editionRows([ed('en.asad', 3, 'a'), ed('ru.kuliev', 3, 'r')], 3)
    expect(r['en.asad']).toEqual(['a 1', 'a 2', 'a 3'])
    expect(r['ru.kuliev'][0]).toBe('r 1')
  })
  it('ayə sayı uyğun deyilsə və ya naməlum nəşrdirsə — nəticəyə düşmür', () => {
    const r = editionRows([ed('en.asad', 2), ed('xx.fake', 3), null], 3)
    expect(r).toEqual({})
  })
  it('tək nəşr obyekt kimi gələ bilər', () => {
    expect(Object.keys(editionRows(ed('tr.diyanet', 2), 2))).toEqual(['tr.diyanet'])
  })
})
