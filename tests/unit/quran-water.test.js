import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { QURAN_WATER, STAGES, expandRef, allAyahRefs, keysInText, missingKeys, keyWordIdx, nextStage } from '../../src/data/quranWater'

const Q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
const ayah = (ref) => { const [s, a] = ref.split(':').map(Number); return Q.ayahs[s - 1]?.[a - 1] }
const group = (ref) => expandRef(ref).map(ayah).join(' ')
const DIR = 'public/data/quran-water'

describe('Quranda su dövranı — data', () => {
  it('6 mərhələ, test id-ləri ilə eyni sıra', () => {
    expect(STAGES).toEqual(['sea', 'evaporation', 'wind', 'clouds', 'rain', 'rivers'])
    for (const s of QURAN_WATER) {
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(s.name[l]).toBeTruthy()
      expect(s.refs.length).toBeGreaterThanOrEqual(1)
      expect(s.refs.length).toBeLessThanOrEqual(2)
    }
  })
  it('expandRef', () => {
    expect(expandRef('55:19-20')).toEqual(['55:19', '55:20'])
    expect(expandRef('30:48')).toEqual(['30:48'])
    expect(expandRef('5:3-2')).toEqual([])
    expect(expandRef('x')).toEqual([])
    expect(allAyahRefs()).toHaveLength(12)
  })
  for (const s of QURAN_WATER) {
    it(`${s.id}: açar sözlər hər ayədə ayrıca söz kimi keçir (${s.refs.map(r => r.ref).join(', ')})`, () => {
      for (const r of s.refs) {
        const txt = group(r.ref)
        expect(txt.length, r.ref).toBeGreaterThan(10)
        expect(missingKeys(r.keys, txt), `${s.id} ${r.ref}`).toEqual([])
        expect(keyWordIdx(r.keys, txt).length, r.ref).toBeGreaterThanOrEqual(r.keys.length)
      }
    })
  }
  it('səhv ayədə tapmır (build dayanardı)', () => {
    const clouds = QURAN_WATER.find(s => s.id === 'clouds').refs[0].keys
    expect(keysInText(clouds, ayah('30:48'))).toBe(false) // سحاب var, ركام/برد yox
    expect(missingKeys(clouds, ayah('30:48'))).toHaveLength(2)
    expect(keysInText([['ينبيع']], ayah('23:18'))).toBe(false)
    expect(keysInText([['بحرين'], ['برزخ']], ayah('55:19'))).toBe(false) // برزخ 55:20-dədir
    expect(keysInText([], ayah('1:1'))).toBe(false)
  })
  it('vurğu yalnız açar sözlərə düşür (24:43: سحابا، ركاما، برد)', () => {
    const t = ayah('24:43')
    expect(keyWordIdx([['سحاب'], ['ركام'], ['برد']], t)).toHaveLength(3)
  })
  it('dövran: çaylardan yenə dənizə', () => {
    expect(nextStage('sea')).toBe('evaporation')
    expect(nextStage('rivers')).toBe('sea')
  })
})

describe('public/data/quran-water', () => {
  const files = fs.readdirSync(DIR)
  const refs = allAyahRefs()
  it('bitkilərlə eyni dillər', () => {
    expect(files.sort()).toEqual(fs.readdirSync('public/data/quran-plants').sort())
  })
  it('hər dildə hər ayə: ərəb mətni Osmani nəşri ilə hərfi-hərfinə, tərcümə boş deyil', () => {
    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8'))
      for (const r of refs) {
        expect(d.ar[r], `${f} ${r}`).toBe(ayah(r))
        if (f !== 'ar.json') expect(d.tr[r]?.length, `${f} ${r}`).toBeGreaterThan(5)
      }
      if (f !== 'ar.json') expect(d.by).toBeTruthy()
    }
  })
  it('tərcümə saytın nəşrindən hərfi-hərfinə (az, en, ru, tr)', () => {
    const ED = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }
    for (const [l, ed] of Object.entries(ED)) {
      const src = JSON.parse(fs.readFileSync(`seo-data/quran/${ed}.json`, 'utf8'))
      const d = JSON.parse(fs.readFileSync(`${DIR}/${l}.json`, 'utf8'))
      for (const r of refs) { const [s, a] = r.split(':').map(Number); expect(d.tr[r]).toBe(src.ayahs[s - 1][a - 1]) }
    }
    expect(JSON.parse(fs.readFileSync(`${DIR}/az.json`, 'utf8')).by).toBe('Məmmədəliyev & Bünyadov')
  })
})
