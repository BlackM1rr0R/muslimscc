import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { QURAN_PLANTS, plantInAyah } from '../../src/data/quranPlants'

const Q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
const ayah = (ref) => { const [s, a] = ref.split(':').map(Number); return Q.ayahs[s - 1]?.[a - 1] }
const DIR = 'public/data/quran-plants'

describe('Quran bitkiləri bağı — data', () => {
  it('id-lər təkrarlanmır, adlar 5 dildə var, 1–3 ayə', () => {
    expect(new Set(QURAN_PLANTS.map(p => p.id)).size).toBe(QURAN_PLANTS.length)
    for (const p of QURAN_PLANTS) {
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(p.name[l]).toBeTruthy()
      expect(p.refs.length).toBeGreaterThanOrEqual(1)
      expect(p.refs.length).toBeLessThanOrEqual(3)
    }
  })
  for (const p of QURAN_PLANTS) {
    it(`${p.id}: ərəbcə adı hər ayədə ayrıca söz kimi keçir (${p.refs.join(', ')})`, () => {
      for (const r of p.refs) {
        expect(ayah(r), r).toBeTruthy()
        expect(plantInAyah(p, ayah(r)), `${p.id} ${r}`).toBe(true)
      }
    })
  }
  it('yoxlama sözün içində tapmır (بصلاتك ≠ بصل, الذين ≠ تين)', () => {
    const onion = QURAN_PLANTS.find(p => p.id === 'onion'), fig = QURAN_PLANTS.find(p => p.id === 'fig')
    expect(plantInAyah(onion, ayah('17:110'))).toBe(false)
    expect(plantInAyah(fig, ayah('2:38'))).toBe(false)
  })
  it('mənası mübahisəli sözlər yoxdur (فوم, طلح)', () => {
    const all = QURAN_PLANTS.flatMap(p => p.forms)
    for (const w of ['فوم', 'طلح']) expect(all).not.toContain(w)
  })
})

describe('public/data/quran-plants', () => {
  const files = fs.readdirSync(DIR)
  const refs = [...new Set(QURAN_PLANTS.flatMap(p => p.refs))]
  it('heyvanlarla eyni dillər', () => {
    expect(files.sort()).toEqual(fs.readdirSync('public/data/quran-animals').sort())
  })
  it('hər dildə hər ayə: ərəb mətni Osmani nəşri ilə hərfi-hərfinə, tərcümə boş deyil', () => {
    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8'))
      for (const r of refs) {
        const full = ayah(r)
        expect(d.ar[r], `${f} ${r}`).toBeTruthy()
        expect(d.ar[r]).not.toMatch(/^بِّ?سْمِ/)
        expect(full.endsWith(d.ar[r])).toBe(true)
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
  })
})
