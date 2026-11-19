// Batch Q — surə vizuallarının saf hesabı (src/components/quran/viz/surahViz.js)
import { describe, it, expect } from 'vitest'
import {
  surahFacts, surahWordList, glyphSpec, glyphGeometry, sparkBars, sparkPath,
  REVELATION_SEQ, juzRing, constellation, backgroundStars, fitBox, WALLPAPERS,
} from '../../src/components/quran/viz/surahViz'
import { SURAH_META } from '../../src/seo/surahMeta'

const ALL = Array.from({ length: 114 }, (_, i) => i + 1)

describe('surahFacts — yalnız saytın məlumatı', () => {
  it('Fatihə, Bəqərə, İxlas', () => {
    const f1 = surahFacts(1)
    expect(f1).toMatchObject({ ayahs: 7, madani: false, order: 5, juz: [1, 1], pages: [1, 1], letters: '', sajdah: [] })
    const f2 = surahFacts(2)
    expect(f2).toMatchObject({ ayahs: 286, madani: true, order: 87, juz: [1, 3], pages: [2, 49], letters: 'الم' })
    expect(surahFacts(112)).toMatchObject({ ayahs: 4, madani: false, order: 22, juz: [30, 30] })
  })
  it('söz sayı Tanzil cədvəlindən: hər surədə ayə qədər rəqəm, cəmi 77 mindən çox', () => {
    let sum = 0
    for (const n of ALL) {
      const w = surahWordList(n)
      expect(w.length).toBe(SURAH_META[n - 1][4])
      expect(w.every(x => Number.isInteger(x) && x > 0)).toBe(true)
      sum += surahFacts(n).words
    }
    expect(sum).toBeGreaterThan(77000)
    expect(sum).toBeLessThan(79000)
  })
  it('səcdə ayələri: 15 yer, 22-də iki', () => {
    const all = ALL.flatMap(n => surahFacts(n).sajdah.map(a => `${n}:${a}`))
    expect(all).toHaveLength(15)
    expect(surahFacts(22).sajdah).toEqual([18, 77])
    expect(surahFacts(96).sajdah).toEqual([19])
  })
  it('müqəttəə: 29 surə; Şurada iki açılış', () => {
    expect(ALL.filter(n => surahFacts(n).letters).length).toBe(29)
    expect(surahFacts(42).letters).toBe('حم عسق')
    expect(surahFacts(36).letters).toBe('يس')
  })
  it('naməlum surə — null', () => {
    expect(surahFacts(0)).toBeNull()
    expect(glyphSpec(115)).toBeNull()
  })
})

describe('glyphSpec — həndəsə faktı kodlayır', () => {
  it('guşə sayı ayə sayı ilə artır (6…16)', () => {
    expect(glyphSpec(108).folds).toBe(6)     // 3 ayə
    expect(glyphSpec(1).folds).toBe(8)       // 7 ayə — səkkizguşəli
    expect(glyphSpec(2).folds).toBe(16)      // 286 ayə
    for (const n of ALL) {
      const s = glyphSpec(n)
      expect(s.folds).toBeGreaterThanOrEqual(6)
      expect(s.folds).toBeLessThanOrEqual(16)
      expect(s.ratio).toBeGreaterThanOrEqual(0.36)
      expect(s.ratio).toBeLessThanOrEqual(0.76)
    }
  })
  it('qatlar — cüz sayı; orbit — nazil olma sırası; Mədəni — bütöv halqa', () => {
    expect(glyphSpec(2).layers).toBe(3)
    expect(glyphSpec(1).layers).toBe(1)
    expect(glyphSpec(96).orbit).toBe(0)       // ilk nazil olan surə
    expect(glyphSpec(2).solid).toBe(true)
    expect(glyphSpec(1).solid).toBe(false)
    expect(glyphSpec(7).sajdah).toEqual([360])
  })
  it('114 rozet bir-birindən fərqlidir', () => {
    const sig = new Set(ALL.map(n => JSON.stringify({ ...glyphSpec(n), n: 0 })))
    expect(sig.size).toBe(114)
  })
  it('geometriya: qat sayı qədər yol, nöqtələr viewBox daxilində, keşlənir', () => {
    const g = glyphGeometry(2)
    expect(g.layers).toHaveLength(3)
    expect(g.layers[0]).toMatch(/^M[\d.]+ [\d.]+(L[\d.-]+ [\d.-]+){31}Z$/)
    for (const p of [g.orbit, ...g.sajdah]) {
      expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(100)
      expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(100)
    }
    expect(glyphGeometry(2)).toBe(g)
  })
})

describe('sparkBars / sparkPath', () => {
  it('qısa surədə hər ayə bir sütun, uzunda ≤ 40', () => {
    expect(sparkBars(1)).toEqual(surahWordList(1))
    const b = sparkBars(2, 40)
    expect(b.length).toBeLessThanOrEqual(40)
    expect(b.length).toBeGreaterThan(30)
  })
  it('tək yol, sütun sayı qədər alt yol', () => {
    const d = sparkPath(sparkBars(112), 20)
    expect((d.match(/M/g) || []).length).toBe(4)
    expect(sparkPath([])).toBe('')
  })
})

describe('REVELATION_SEQ və juzRing', () => {
  it('114 surə, hər biri bir dəfə; ilk — Ələq (96), son — Nasr (110)', () => {
    expect(REVELATION_SEQ).toHaveLength(114)
    expect(new Set(REVELATION_SEQ.map(x => x.n)).size).toBe(114)
    expect(REVELATION_SEQ[0].n).toBe(96)
    expect(REVELATION_SEQ[113].n).toBe(110)
  })
  it('30 qövs', () => {
    const r = juzRing()
    expect(r).toHaveLength(30)
    expect(r[0]).toMatch(/^M[\d.]+ [\d.]+A40 40 0 0 1 [\d.]+ [\d.]+$/)
  })
})

describe('constellation — qəti bürc', () => {
  it('hər ayə bir ulduz, vahid kvadratda, hər dəfə eyni', () => {
    for (const n of [1, 2, 36, 108, 112]) {
      const a = constellation(n), b = constellation(n)
      expect(a).toEqual(b)
      expect(a).toHaveLength(SURAH_META[n - 1][4])
      expect(a.map(p => p.a)).toEqual(a.map((_, i) => i + 1))
      for (const p of a) {
        expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(1)
        expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(1)
        expect(p.r).toBeGreaterThanOrEqual(0.4); expect(p.r).toBeLessThanOrEqual(1)
      }
    }
  })
  it('surələrin bürcləri fərqlidir', () => {
    expect(constellation(112)).not.toEqual(constellation(113))
  })
  it('fon ulduzları qəti; fitBox mətn üçün yer saxlayır', () => {
    expect(backgroundStars(10, 7)).toEqual(backgroundStars(10, 7))
    const { w, h } = WALLPAPERS.phone
    expect([w, h]).toEqual([1080, 1920])
    expect([WALLPAPERS.desktop.w, WALLPAPERS.desktop.h]).toEqual([2560, 1440])
    const b = fitBox(w, h, { pad: 0.1, top: 100, bottom: 500 })
    expect(b.s).toBeCloseTo(1080 * 0.8)
    expect(b.y).toBeGreaterThanOrEqual(100)
    expect(b.y + b.s).toBeLessThanOrEqual(h - 500)
  })
})
