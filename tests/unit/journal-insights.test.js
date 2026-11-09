import { describe, it, expect } from 'vitest'
import {
  muhasabahIndex, muhasabahStats, duaIndex, duaAnswerLag, duaByCategory, charityIndex, charityStats, topTypes,
} from '../../src/utils/journalInsights.js'

const ITEMS = ['salah', 'quran', 'tawbah']

describe('mühasəbə', () => {
  const byDay = muhasabahIndex({
    '2026-11-01': { c: ['salah', 'quran', 'tawbah'], n: '', u: 1 },
    '2026-11-03': { c: ['quran'], n: 'qeyd', u: 2 },
    '2026-11-04': { c: [], n: 'yalnız qeyd', u: 3 },
    'pozuq': { c: ['salah'] },
  })
  it('pozuq açar atılır, yalnız qeydli gün də sayılır', () => {
    expect(Object.keys(byDay).sort()).toEqual(['2026-11-01', '2026-11-03', '2026-11-04'])
    expect(byDay['2026-11-04']).toMatchObject({ n: 0, note: true })
  })
  it('dövr göstəriciləri', () => {
    const s = muhasabahStats(byDay, ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'], ITEMS)
    expect(s.days).toBe(3)
    expect(s.marks).toBe(4)
    expect(s.avg).toBe(1.3)
    expect(s.full).toBe(1)
    expect(s.per).toEqual({ salah: 1, quran: 2, tawbah: 1 })
    expect(s.series).toEqual([3, 0, 1, 0])
  })
  it('boş', () => {
    expect(muhasabahStats({}, ['2026-11-01'], ITEMS)).toMatchObject({ days: 0, avg: 0, series: [0] })
  })
})

describe('dua gündəliyi', () => {
  const duas = [
    { date: '2026-11-01', answered: true, answeredDate: '2026-11-05', category: 'family' },
    { date: '2026-11-01', answered: false, answeredDate: null, category: 'personal' },
    { date: '2026-11-03', answered: true, answeredDate: '2026-11-04', category: 'family' },
    { date: '', answered: true, answeredDate: 'x', category: 'work' },
  ]
  it('gün üzrə yazılan / qəbul olunan', () => {
    expect(duaIndex(duas)).toEqual({ written: { '2026-11-01': 2, '2026-11-03': 1 }, answered: { '2026-11-05': 1, '2026-11-04': 1 } })
  })
  it('qəbula qədər orta gün', () => {
    expect(duaAnswerLag(duas)).toBe(2.5)
    expect(duaAnswerLag([{ answered: false }])).toBeNull()
  })
  it('kateqoriya, dövrə görə süzgəc', () => {
    expect(duaByCategory(duas, ['personal', 'family', 'work'])).toEqual({ personal: 1, family: 2, work: 1 })
    expect(duaByCategory(duas, ['personal', 'family', 'work'], (k) => k >= '2026-11-02')).toEqual({ personal: 0, family: 1, work: 0 })
  })
})

describe('sədəqə', () => {
  const byDay = charityIndex([
    { id: 1, date: '2026-11-01', type: 'money', amount: 10 },
    { id: 2, date: '2026-11-01', type: 'food', amount: null },
    { id: 3, date: '2026-11-02', type: 'zzz', amount: '2.5' },
    { id: 4, date: 'bad', type: 'money', amount: 99 },
  ])
  it('gün üzrə say və məbləğ', () => {
    expect(byDay['2026-11-01']).toEqual({ n: 2, amount: 10, types: { money: 1, food: 1 } })
    expect(byDay.bad).toBeUndefined()
  })
  it('dövr cəmləri; naməlum növ → digər', () => {
    const s = charityStats(byDay, ['2026-10-31', '2026-11-01', '2026-11-02'], ['money', 'food', 'other'])
    expect(s).toMatchObject({ n: 3, amount: 12.5, active: 2, withAmount: 2, count: [0, 2, 1], amt: [0, 10, 2.5] })
    expect(s.per).toEqual({ money: 1, food: 1, other: 1 })
  })
  it('ən çox 3 növ', () => {
    expect(topTypes({ money: 5, food: 1, smile: 0, dua: 3, other: 2 })).toEqual(['money', 'dua', 'other'])
  })
})
