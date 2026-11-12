import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { MUQATTAAT, LETTERS, lettersOf, letterCounts, COMBOS, plainLetters } from '../../src/data/muqattaat'

const Q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
const strip = (a) => (a.startsWith('بِسْمِ') ? a.split(' ').slice(4).join(' ') : a)

describe('Müqəttəə hərfləri', () => {
  it('29 surə, açılış Osmani nəşri ilə hərfi-hərfinə eynidir', () => {
    expect(MUQATTAAT).toHaveLength(29)
    for (const m of MUQATTAAT) {
      expect(strip(Q.ayahs[m.s - 1][0]).split(' ')[0]).toBe(m.open[0])
      if (m.open[1]) expect(Q.ayahs[m.s - 1][1]).toBe(m.open[1])
    }
  })
  it('14 hərf, 14 müxtəlif birləşmə; bütün hərflər LETTERS siyahısındadır', () => {
    expect(LETTERS).toHaveLength(14)
    expect(COMBOS).toHaveLength(14)
    const all = new Set(MUQATTAAT.flatMap(lettersOf))
    expect(all.size).toBe(14)
    for (const ch of all) expect(LETTERS.some(l => l.ch === ch)).toBe(true)
  })
  it('sayılar: Mim 17 surədə, Əlif 13, Ha (ح) 7, Nun 1', () => {
    const c = letterCounts()
    expect(c['م']).toBe(17); expect(c['ا']).toBe(13); expect(c['ح']).toBe(7); expect(c['ن']).toBe(1)
  })
  it('plainLetters işarələri atır', () => { expect(plainLetters('كٓهيعٓصٓ')).toBe('كهيعص') })
})
