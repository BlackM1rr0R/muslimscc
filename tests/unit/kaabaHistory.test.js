import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { KAABA_STAGES, CUBIT_NOTE, allKaabaSources } from '../../src/data/kaabaHistory'
import { BOOK_DATA } from '../../src/data/hadithLibrary'

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

describe('Kəbənin tarixi — məlumat', () => {
  it('altı mərhələ, xronoloji sıra', () => {
    expect(KAABA_STAGES.map(s => s.id)).toEqual(['ibrahim', 'quraysh', 'zubayr', 'hajjaj', 'ottoman', 'modern'])
  })
  it('hər mərhələ və fakt 5 dildə, hər faktın mənbəsi var', () => {
    for (const s of KAABA_STAGES) {
      for (const k of ['era', 'title']) for (const l of LANGS) expect(s[k][l], `${s.id}.${k}.${l}`).toBeTruthy()
      for (const l of LANGS) expect(s.shape.hLabel[l]).toBeTruthy()
      expect(s.facts.length).toBeGreaterThan(0)
      for (const f of s.facts) {
        for (const l of LANGS) expect(f.text[l], `${s.id}: ${f.text.en}`).toBeTruthy()
        expect(Array.isArray(f.source) && f.source.length > 0, f.text.en).toBe(true)
      }
    }
    for (const l of LANGS) expect(CUBIT_NOTE.text[l]).toBeTruthy()
  })
  it('hədis keçidləri hədis kitabxanasının bölmə aralığına düşür', () => {
    const hs = allKaabaSources().filter(s => s.kind === 'hadith')
    expect(hs.length).toBeGreaterThan(5)
    for (const h of hs) {
      const sec = BOOK_DATA[h.book].sections.find(x => x[0] === h.sec)
      expect(sec, `${h.book}/${h.sec}`).toBeTruthy()
      expect(h.n).toBeGreaterThanOrEqual(sec[2])
      expect(h.n).toBeLessThanOrEqual(sec[3])
    }
  })
  it('kitab mənbələri 5 dildə adlanır', () => {
    for (const s of allKaabaSources().filter(x => x.kind === 'book')) for (const l of LANGS) expect(s.label[l]).toBeTruthy()
  })
  it('rəqəmlər mənbə ilə uyğun: Qüreyş 18, İbn əz-Zubeyr 18 + 10 (Müslim 1333)', () => {
    const by = Object.fromEntries(KAABA_STAGES.map(s => [s.id, s]))
    expect(by.ibrahim.shape.h).toBe(9)
    expect(by.quraysh.shape.h).toBe(18)
    expect(by.zubayr.shape.h).toBe(28)
    expect(by.hajjaj.shape.h).toBe(by.zubayr.shape.h) // hündürlükdəki əlavə saxlanılıb
    expect(by.ibrahim.shape.hijr && by.zubayr.shape.hijr).toBe(true)
    expect(by.quraysh.shape.hijr || by.hajjaj.shape.hijr || by.modern.shape.hijr).toBe(false)
    expect(by.zubayr.shape.doors).toBe('two-ground')
  })
  it('Bəqərə 2:127 saytın Quran nəşrindən (public/data/kaaba-ayah)', () => {
    const dir = path.resolve('public/data/kaaba-ayah')
    const ar = JSON.parse(fs.readFileSync(path.join(dir, 'ar.json'), 'utf8'))
    expect(ar.ar['2:127']).toMatch(/^وَإِذْ يَرْفَعُ إِبْرَٰهِۦمُ ٱلْقَوَاعِدَ مِنَ ٱلْبَيْتِ/)
    for (const l of ['az', 'en', 'ru', 'tr']) {
      const d = JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'))
      expect(d.tr['2:127'].length).toBeGreaterThan(40)
      expect(d.by).toBeTruthy()
    }
  })
})
