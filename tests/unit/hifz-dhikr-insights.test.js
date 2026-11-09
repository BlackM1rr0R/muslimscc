import { describe, it, expect } from 'vitest'
import { hifzSeries, newByDay, ayahBreakdown, recentLogDays } from '../../src/utils/hifzInsights.js'
import { cleanDaily, byDhikr, topN } from '../../src/utils/dhikrInsights.js'

describe('hifzInsights', () => {
  const log = { '2026-11-01': { reviews: 3, new: 2 }, '2026-11-03': { reviews: 0, new: 5 }, bad: { reviews: 9 } }
  it('hifzSeries: gün açarları üzrə sıralar, boş gün 0', () => {
    expect(hifzSeries(log, ['2026-11-01', '2026-11-02', '2026-11-03'])).toEqual({ reviews: [3, 0, 0], added: [2, 0, 5], total: [5, 0, 5] })
    expect(hifzSeries(null, ['2026-11-01'])).toEqual({ reviews: [0], added: [0], total: [0] })
  })
  it('newByDay: yalnız tarixli və müsbət yeni ayələr', () => {
    expect(newByDay(log)).toEqual({ '2026-11-01': 2, '2026-11-03': 5 })
  })
  it('ayahBreakdown: əzbər surə tam, davam edən surənin SRS ayələri əzbərə, qalanı "davam"', () => {
    const surahs = [{ num: 1, ayahs: 7 }, { num: 2, ayahs: 10 }, { num: 3, ayahs: 5 }]
    expect(ayahBreakdown(surahs, { 1: 2, 2: 1 }, { 2: 4, 3: 1 })).toEqual({ memorised: 7 + 4 + 1, inProgress: 6, notStarted: 4 })
  })
  it('recentLogDays: yenidən köhnəyə, boş günlər atılır', () => {
    expect(recentLogDays({ ...log, '2026-11-04': { reviews: 0, new: 0 } }).map(d => d.day)).toEqual(['2026-11-03', '2026-11-01'])
  })
})

describe('dhikrInsights', () => {
  it('cleanDaily: pozuq dəyərlər süzülür', () => {
    expect(cleanDaily({ '2026-11-01': 33, '2026-11-02': -1, x: 5, '2026-11-03': 'abc' })).toEqual({ '2026-11-01': 33 })
    expect(cleanDaily([1, 2])).toEqual({})
  })
  it('byDhikr + topN: ada görə cəm, 4-dən çox — "Digər"', () => {
    const log = [{ name: 'A', count: 33 }, { name: 'B', count: 100 }, { name: 'A', count: 33 }, { name: 'C', count: 10 }, { name: 'D', count: 5 }, { name: 'E', count: 1 }, null, { name: 'F', count: 0 }]
    const all = byDhikr(log, e => e.name)
    expect(all[0]).toEqual({ label: 'B', value: 100, rounds: 1 })
    expect(all[1]).toEqual({ label: 'A', value: 66, rounds: 2 })
    const top = topN(all, 4, 'Other')
    expect(top).toHaveLength(4)
    expect(top[3]).toEqual({ label: 'Other', value: 6, rounds: 2 })
  })
})
