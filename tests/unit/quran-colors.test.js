import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { QURAN_COLORS, colorInAyah, colorWordIdx, colorsOfRef } from '../../src/data/quranColors'

const Q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
const ayah = (ref) => { const [s, a] = ref.split(':').map(Number); return Q.ayahs[s - 1]?.[a - 1] }
const DIR = 'public/data/quran-colors'
const byId = (id) => QURAN_COLORS.find(c => c.id === id)

describe('Quranda rənglər — data', () => {
  it('id-lər təkrarlanmır, adlar 5 dildə var, 1–3 ayə', () => {
    expect(new Set(QURAN_COLORS.map(c => c.id)).size).toBe(QURAN_COLORS.length)
    for (const c of QURAN_COLORS) {
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(c.name[l]).toBeTruthy()
      expect(c.refs.length).toBeGreaterThanOrEqual(1)
      expect(c.refs.length).toBeLessThanOrEqual(3)
    }
  })
  for (const c of QURAN_COLORS) {
    it(`${c.id}: rəng sözü hər ayədə ayrıca söz kimi keçir (${c.refs.join(', ')})`, () => {
      for (const r of c.refs) {
        expect(ayah(r), r).toBeTruthy()
        expect(colorInAyah(c, ayah(r)), `${c.id} ${r}`).toBe(true)
        expect(colorWordIdx(c, ayah(r)).length, `${c.id} ${r}`).toBeGreaterThan(0)
      }
    })
  }
  it('səhv ayədə tapmır', () => {
    expect(colorInAyah(byId('red'), ayah('2:69'))).toBe(false)
    expect(colorInAyah(byId('green'), ayah('1:2'))).toBe(false)
    expect(colorInAyah(byId('yellow'), ayah('35:27'))).toBe(false)
  })
  it('35:27 — ağ, qırmızı və qara eyni ayədə', () => {
    expect(colorsOfRef('35:27').sort()).toEqual(['black', 'red', 'white'])
  })
  it('vurğu yalnız rəng sözlərinə düşür (2:187: الأبيض / الأسود)', () => {
    const words = ayah('2:187').split(' ')
    expect(colorWordIdx(byId('white'), ayah('2:187')).map(i => words[i])).toHaveLength(1)
    expect(colorWordIdx(byId('black'), ayah('2:187')).map(i => words[i])).toHaveLength(1)
  })
  it('zurq — neytral: rəng nümunəsi rəng adı vermir', () => {
    const z = byId('zurq')
    expect(z.neutral).toBe(true)
    expect(z.name.en).toBe('zurq')
  })
})

describe('public/data/quran-colors', () => {
  const files = fs.readdirSync(DIR)
  const refs = [...new Set(QURAN_COLORS.flatMap(c => c.refs))]
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
