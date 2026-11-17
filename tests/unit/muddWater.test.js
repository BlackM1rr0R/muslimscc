import { describe, it, expect } from 'vitest'
import {
  MUDD_L, MUDD_HADITH, FLOWS, LOG_KEY, flowLpm, lpmFromFillSeconds, litresFor, muddRatio, fmt1,
  parseSeconds, fmtClock, vesselCap, parseLog, addEntry, loadLog, saveLog, trendOf,
} from '../../src/utils/muddWater.js'
import { HADITHS } from '../../src/data/hadiths.js'

describe('muddWater — hədis surəti', () => {
  it('src/data/hadiths.js id 1602 ilə hərfi-hərfinə eynidir', () => {
    for (const l of ['az', 'en', 'ru', 'tr', 'ar']) {
      const h = HADITHS[l].find(x => x.id === MUDD_HADITH.id)
      expect(h, l).toBeTruthy()
      expect(h.source).toBe(MUDD_HADITH.source)
      expect(h.ar).toBe(MUDD_HADITH.ar)
      expect(h.text).toBe(MUDD_HADITH.text[l])
    }
  })
})

describe('muddWater — hesab', () => {
  it('mudd 0.5–0.75 L aralığının ortasıdır', () => {
    expect(MUDD_L).toBeCloseTo(0.625)
  })
  it('axın seçimi', () => {
    expect(flowLpm('low')).toBe(4)
    expect(flowLpm('normal')).toBe(8)
    expect(flowLpm('strong')).toBe(12)
    expect(flowLpm('custom', 6)).toBe(6)
    expect(flowLpm('custom', '2.5')).toBe(2.5)
    expect(flowLpm('custom', 999)).toBe(30)
    expect(flowLpm('custom', -1)).toBe(FLOWS.normal)
    expect(flowLpm('custom', 'x')).toBe(FLOWS.normal)
  })
  it('1 litri 10 san-yə doldurur → 6 L/dəq', () => {
    expect(lpmFromFillSeconds(10)).toBe(6)
    expect(Number.isNaN(lpmFromFillSeconds(0))).toBe(true)
  })
  it('litr və mudd nisbəti', () => {
    expect(litresFor(60, 8)).toBe(8)
    expect(litresFor(45, 4)).toBe(3)
    expect(litresFor(-5, 8)).toBe(0)
    expect(muddRatio(1.25)).toBeCloseTo(2)
    expect(muddRatio(0)).toBe(0)
    expect(fmt1(2.345)).toBe('2.3')
    expect(fmt1(Number.NaN)).toBe('0.0')
  })
  it('saniyə daxil etmə', () => {
    expect(parseSeconds('90')).toBe(90)
    expect(parseSeconds('1:30')).toBe(90)
    expect(parseSeconds('2m')).toBe(120)
    expect(parseSeconds('45s')).toBe(45)
    expect(parseSeconds('1,5m')).toBe(90)
    expect(Number.isNaN(parseSeconds(''))).toBe(true)
    expect(Number.isNaN(parseSeconds('abc'))).toBe(true)
    expect(Number.isNaN(parseSeconds('0'))).toBe(true)
    expect(Number.isNaN(parseSeconds('5000'))).toBe(true)
    expect(fmtClock(95)).toBe('1:35')
    expect(fmtClock(5)).toBe('0:05')
  })
  it('qabın tutumu ən azı 5 mudd, çox suda böyüyür', () => {
    expect(vesselCap(0)).toBeCloseTo(MUDD_L * 5)
    expect(vesselCap(8)).toBeGreaterThan(8)
    expect((vesselCap(8) / MUDD_L) % 1).toBeCloseTo(0)
  })
})

describe('muddWater — tarixçə', () => {
  it('son 7 qeyd saxlanılır, pis məlumat atılır', () => {
    let log = []
    for (let i = 0; i < 10; i++) log = addEntry(log, { t: i, s: 30 + i, lpm: 8 })
    expect(log).toHaveLength(7)
    expect(log[0].t).toBe(3)
    expect(parseLog('not json')).toEqual([])
    expect(parseLog('{"a":1}')).toEqual([])
    expect(parseLog(JSON.stringify([{ t: 1, s: 10, l: 1 }, { t: 'x' }, null]))).toHaveLength(1)
  })
  it('localStorage ilə yazıb oxuyur', () => {
    const mem = new Map()
    const st = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }
    const log = addEntry([], { t: 1, s: 60, lpm: 4 })
    saveLog(st, log)
    expect(mem.has(LOG_KEY)).toBe(true)
    expect(loadLog(st)).toEqual(log)
    expect(loadLog(null)).toEqual([])
    expect(loadLog({ getItem() { throw new Error('blocked') } })).toEqual([])
  })
  it('meyl', () => {
    expect(trendOf([]).change).toBeNull()
    expect(trendOf([{ l: 2 }]).change).toBeNull()
    const t = trendOf([{ l: 4 }, { l: 4 }, { l: 2 }])
    expect(t.change).toBeCloseTo(-0.5)
    expect(t.avg).toBeCloseTo(10 / 3)
  })
})
