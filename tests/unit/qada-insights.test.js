import { describe, it, expect } from 'vitest'
import { qadaSeries, qadaPeriod, qadaPace, qadaRecent, finishDate } from '../../src/utils/qadaInsights.js'
import { fastGroup, fastStats } from '../../src/utils/sunnahFastInsights.js'

const log = {
  '2026-11-01': { p: 5, f: 0 },
  '2026-11-03': { p: 3, f: 1 },
  '2026-11-04': { p: 0, f: 1 },
  'bad': { p: 9 },
  '2026-11-20': { p: 4 },           // gələcək — sayılmır
}

describe('qada insights', () => {
  it('series and period sums follow the keys', () => {
    const keys = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']
    expect(qadaSeries(log, keys)).toEqual({ p: [5, 0, 3, 0], f: [0, 0, 1, 1] })
    expect(qadaPeriod(log, keys)).toEqual({ p: 8, f: 2, active: 3 })
    expect(qadaPeriod({}, keys)).toEqual({ p: 0, f: 0, active: 0 })
  })
  it('pace averages since the first log when shorter than the window', () => {
    // 1..10 noyabr = 10 gün, cəmi 8 namaz → 0.8
    expect(qadaPace(log, '2026-11-10', 30)).toBe(0.8)
    // pəncərə 3 gün (8–10) → qeyd yoxdur
    expect(qadaPace(log, '2026-11-10', 3)).toBe(0)
    expect(qadaPace({}, '2026-11-10')).toBe(0)
  })
  it('recent days are newest first, no future, no empty', () => {
    expect(qadaRecent(log, '2026-11-10').map(e => e.key)).toEqual(['2026-11-04', '2026-11-03', '2026-11-01'])
  })
  it('finish date', () => {
    const now = new Date(2026, 10, 1, 12)
    expect(finishDate(10, 2, now).getDate()).toBe(6)
    expect(finishDate(10, 0, now)).toBeNull()
    expect(finishDate(0, 2, now)).toBeNull()
  })
})

describe('sunnah fast insights', () => {
  it('groups by the most specific reason', () => {
    expect(fastGroup(['ashura', 'mon'])).toBe('special')
    expect(fastGroup(['bid', 'thu'])).toBe('bid')
    expect(fastGroup(['mon'])).toBe('monthu')
    expect(fastGroup([])).toBe('other')
    expect(fastGroup('ramadan')).toBe('other')
  })
  it('period stats', () => {
    // 2026-11-02 bazar ertəsi, 2026-11-05 cümə axşamı
    const keys = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-09']
    const st = (k) => ({ '2026-11-02': ['mon'], '2026-11-05': ['thu'], '2026-11-09': ['mon'] }[k] || [])
    const s = fastStats(['2026-11-02', '2026-11-03', '2026-11-09'], keys, st)
    expect(s.fasts).toBe(3)
    expect(s.sunnahDays).toBe(3)
    expect(s.kept).toBe(2)
    expect(s.weeks).toBe(2)
    expect(s.groups).toEqual({ monthu: 2, bid: 0, special: 0, other: 1 })
    expect(s.perDay).toEqual([1, 1, 0, 0, 1])
    expect(s.weekday).toEqual([2, 1, 0, 0, 0, 0, 0])
  })
})
