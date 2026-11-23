// P1: şəri ölçü vahidləri (data/shariaUnits) — dəyərlər saytın öz məlumatı ilə eynidir (zəkat/fitrə,
// kəffarə, "bir mudd su", fiqh və səfər dərsləri); hesab, aralıq və təxmini müqayisələr.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import {
  UNITS, UNIT_IDS, convert, comparison, fmtNum, SAA_KG, MUDD_L, NISAB_GOLD_G, NISAB_SILVER_G, MITHQAL_G, DIRHAM_G, TRAVEL_KM,
} from '../../src/data/shariaUnits.js'
import { MUDD_MIN_L, MUDD_MAX_L } from '../../src/utils/muddWater.js'

const read = (p) => fs.readFileSync(p, 'utf8')

describe('shariaUnits — saytın məlumatı ilə uyğunluq', () => {
  it('zəkat səhifəsi: nisab 85 q / 595 q, sa\' = 3 kq', () => {
    const z = read('src/pages/ZakatPage.jsx')
    expect(z).toMatch(new RegExp(`NISAB_GOLD_G\\s*=\\s*${NISAB_GOLD_G}\\b`))
    expect(z).toMatch(new RegExp(`NISAB_SILVER_G\\s*=\\s*${NISAB_SILVER_G}\\b`))
    expect(z).toMatch(new RegExp(`SAA_KG\\s*=\\s*${SAA_KG}\\b`))
  })
  it('kəffarə: yarım sa\' ≈ 1,5 kq', () => {
    expect(read('src/components/KaffarahCalc.jsx')).toMatch(new RegExp(`KG_PER_POOR\\s*=\\s*${SAA_KG / 2}\\b`))
  })
  it('mudd: 0,5–0,75 L (utils/muddWater)', () => {
    expect(MUDD_L).toEqual([MUDD_MIN_L, MUDD_MAX_L])
  })
  it('fiqh dərsi: 20 misqal ≈ 85 q, 140 misqal ≈ 595 q', () => {
    const f = read('src/data/lessons/fiqh-faq.js')
    expect(f).toContain('20 mithqals of gold (about 85 g)')
    expect(f).toContain('140 mithqals of silver (about 595 g)')
    expect(MITHQAL_G).toBe(4.25)
    expect(DIRHAM_G).toBeCloseTo(2.975, 6)
    expect(140 * MITHQAL_G).toBeCloseTo(NISAB_SILVER_G, 6)
  })
  it('səfər dərsi: 48 mil ≈ 80 km, bəzi alimlərə görə ≈ 83 km', () => {
    const t = read('src/data/lessons/travel-prayer.js')
    expect(t).toContain('48 miles')
    expect(t).toContain('about 80 km')
    expect(t).toContain('about 83 kilometres')
    expect(TRAVEL_KM).toEqual([80, 83])
  })
})

describe('shariaUnits — hesab', () => {
  it('hər vahidin ərəbcə adı, metrik çıxışı və əsas növü var', () => {
    expect(UNIT_IDS).toEqual(['saa', 'mudd', 'dinar', 'dirham', 'mithqal', 'uqiyah', 'nisabGold', 'nisabSilver', 'dhira', 'mil', 'farsakh', 'barid', 'travel'])
    for (const u of UNITS) {
      expect(u.ar).toBeTruthy()
      for (const o of u.out) {
        expect(['site', 'derived', 'estimate']).toContain(o.b)
        expect(o.lo).toBeLessThanOrEqual(o.v)
        expect(o.v).toBeLessThanOrEqual(o.hi)
      }
    }
  })
  it('saytda olmayan zira\' — aralıqlı təxmin kimi işarələnib', () => {
    expect(UNITS.find((u) => u.id === 'dhira').out[0]).toMatchObject({ b: 'estimate', lo: 46, hi: 50 })
  })
  it('nisbətlər: 4 mudd = 1 sa\', 5 üqiyyə = gümüş nisabı, 4 bərid = 16 fərsəx = 48 mil', () => {
    expect(convert('mudd', 4).find((o) => o.m === 'kg').v).toBeCloseTo(SAA_KG, 6)
    expect(convert('uqiyah', 5)[0].v).toBeCloseTo(NISAB_SILVER_G, 6)
    expect(convert('barid', 4)[0].lo).toBeCloseTo(80, 2)
    expect(convert('farsakh', 16)[0].hi).toBeCloseTo(83, 2)
    expect(convert('mil', 48)[0].lo).toBeCloseTo(80, 2)
    expect(convert('dinar', 20)[0].v).toBeCloseTo(NISAB_GOLD_G, 6)
  })
  it('yanlış miqdar → boş; müqayisələr', () => {
    expect(convert('saa', -1)).toEqual([])
    expect(convert('saa', Number.NaN)).toEqual([])
    expect(convert('nope', 1)).toEqual([])
    expect(comparison('saa', 1)).toEqual({ kind: 'rice', n: 3 })
    expect(comparison('mudd', 1).kind).toBe('bottle')
    expect(comparison('nisabGold', 1)).toEqual({ kind: 'water', n: 85 })
    expect(comparison('travel', 1).kind).toBe('car')
    expect(comparison('travel', 1).n).toBeCloseTo(80 / 90 * 60, 6)
  })
  it('rəqəm formatı deterministikdir (Intl yox)', () => {
    expect(fmtNum(2.975, 'en')).toBe('2.98')
    expect(fmtNum(2.975, 'az', 3)).toBe('2,975')
    expect(fmtNum(3, 'ru')).toBe('3')
    expect(fmtNum(1234.5, 'en')).toBe('1 234.5')
  })
})
