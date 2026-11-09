import { describe, it, expect } from 'vitest'
import {
  periodKeys, bucketEnd, bucketLabels, rolling, weekdayAvg, deltaOf, streakBack, bestRun, earliest, paceFrom, trackerGroupsOf,
} from '../../src/utils/trackerInsights.js'

describe('trackerInsights', () => {
  it('periodKeys: cari və əvvəlki dövr bitişik', () => {
    const { keys, prevKeys } = periodKeys('2026-11-09', 7)
    expect(keys[0]).toBe('2026-11-03'); expect(keys[6]).toBe('2026-11-09')
    expect(prevKeys[6]).toBe('2026-11-02'); expect(prevKeys).toHaveLength(7)
  })
  it('bucketEnd / bucketLabels sondan qruplayır', () => {
    expect(bucketEnd([1, 1, 1, 1, 1], 2)).toEqual([1, 2, 2])
    expect(bucketLabels(['a', 'b', 'c', 'd', 'e'], 2)).toEqual(['a', 'b', 'd'])
    expect(bucketEnd([3, 4], 1)).toEqual([3, 4])
  })
  it('rolling cəm', () => { expect(rolling([1, 0, 1, 1], 2)).toEqual([1, 1, 1, 2]) })
  it('weekdayAvg: bazar ertəsi 0', () => {
    const keys = ['2026-11-02', '2026-11-03', '2026-11-09']   // B.e., Ç.a., B.e.
    const avg = weekdayAvg(keys, [2, 5, 4])
    expect(avg[0]).toBe(3); expect(avg[1]).toBe(5); expect(avg[6]).toBe(0)
  })
  it('deltaOf: əvvəlki 0 → null, əks istiqamət', () => {
    expect(deltaOf(5, 0, 'vs')).toBeNull()
    expect(deltaOf(15, 10, 'vs', false)).toEqual({ value: 50, vs: 'vs', positiveIsGood: false })
  })
  it('streakBack: bu gün boşdursa dünəndən; skip qırmır', () => {
    const ok = new Set(['2026-11-08', '2026-11-07', '2026-11-05'])
    expect(streakBack(k => ok.has(k), '2026-11-09')).toBe(2)
    expect(streakBack(k => ok.has(k), '2026-11-09', { skip: k => k === '2026-11-06' })).toBe(3)
  })
  it('bestRun', () => {
    const ok = new Set(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05'])
    expect(bestRun(k => ok.has(k), '2026-11-01', '2026-11-09')).toBe(3)
    expect(bestRun(() => true, null, '2026-11-09')).toBe(0)
  })
  it('earliest yalnız tarix açarları', () => { expect(earliest(['x', '2026-10-02', '2026-09-30'])).toBe('2026-09-30') })
  it('paceFrom: ilk qeyddən bəri (pəncərədən qısa) orta', () => {
    expect(paceFrom({ '2026-11-08': 4, '2026-11-09': 2 }, '2026-11-09', 30)).toBe(3)
    expect(paceFrom({}, '2026-11-09')).toBe(0)
    // 30 günlük pəncərə: köhnə qeyd sayılmır, amma bölən 30-dur
    expect(paceFrom({ '2026-01-01': 100, '2026-11-09': 30 }, '2026-11-09', 30)).toBe(1)
  })
  it('trackerGroupsOf', () => {
    expect(trackerGroupsOf({ fajr: true, isha: true, quran: true, morning: true, dhikr: true, sadaqah: false })).toEqual({ prayer: 2, quran: 1, adhkar: 2, sadaqah: 0 })
    expect(trackerGroupsOf(null)).toEqual({ prayer: 0, quran: 0, adhkar: 0, sadaqah: 0 })
  })
})
