// K5: həftəlik hesabatın rəqəmləri bu cihazda (src/utils/weeklyReport.js) — dövr, namaz, zikr, oruc, vird, Quran (təxmini)
import { describe, it, expect } from 'vitest'
import {
  nextReportDate, periodDays, computeWeekly, recordSnapshot, maybeUpload, readLocalWeekly, writeLocalWeekly, WEEKLY_SNAP_KEY,
} from '../../src/utils/weeklyReport.js'
import { encodeBits, newBits, setBit } from '../../src/utils/quranLife.js'

function mem(init = {}) {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }
}
const life = (n) => { const b = newBits(); for (let i = 0; i < n; i++) setBit(b, i); return { v: 1, e: encodeBits(b), c: encodeBits(b), r: null, k: 0, ks: [], d: {} } }

describe('weeklyReport', () => {
  it('hesabat günü: həmin gün 09:00-dan əvvəl — bu gün; sonra — gələn həftə', () => {
    expect(nextReportDate(new Date(2026, 10, 20, 8, 59), 5)).toBe('2026-11-20')
    expect(nextReportDate(new Date(2026, 10, 20, 9, 0), 5)).toBe('2026-11-27')
    expect(nextReportDate(new Date(2026, 10, 18, 12), 5)).toBe('2026-11-20')
    expect(nextReportDate(new Date(2026, 10, 18, 12), 0)).toBe('2026-11-22')
  })
  it('dövr — hesabat günündən əvvəlki 7 gün, bu günə qədər', () => {
    expect(periodDays('2026-11-20', '2026-11-20')).toEqual(['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'])
    expect(periodDays('2026-11-20', '2026-11-15')).toEqual(['2026-11-13', '2026-11-14', '2026-11-15'])
  })
  it('namaz, zikr, oruc, vird; dövrdən kənar sayılmır', () => {
    const s = mem({
      muslim_cc_prayer_stats: { '2026-11-14_Fajr': true, '2026-11-14_Isha': true, '2026-11-01_Fajr': true },
      daily_tracker: { '2026-11-15': { dhuhr: true, asr: true, quran: true } },
      dhikr_daily_v1: { '2026-11-14': 100, '2026-11-19': 33, '2026-11-10': 999 },
      muslim_cc_sunnah_fasts_v1: { days: ['2026-11-16', '2026-11-12'] },
      wird_v1: { v: 1, items: [{ id: 'a' }, { id: 'b' }], log: { '2026-11-14': { d: ['a', 'b'], n: 2 }, '2026-11-15': { d: ['a'], n: 2 } } },
    })
    const r = computeWeekly(s, { weekEnd: '2026-11-20', today: '2026-11-19' })
    expect(r).toMatchObject({ prayers: 4, dhikr: 133, fasts: 1, quranPages: null })
    expect(r.wirdPct).toBe(21)   // 3 / 14
    expect(computeWeekly(mem(), { weekEnd: '2026-11-20', today: '2026-11-19' }).wirdPct).toBe(null)
  })
  it('Quran səhifəsi — gündəlik anlıq görüntüdən artım (təxmini)', () => {
    const s = mem({ quran_life_v1: life(100) })
    recordSnapshot(s, '2026-11-14')
    s.setItem('quran_life_v1', JSON.stringify(life(720)))
    recordSnapshot(s, '2026-11-15')
    const snap = JSON.parse(s.getItem(WEEKLY_SNAP_KEY))
    expect(snap).toEqual({ '2026-11-14': 100, '2026-11-15': 720 })
    expect(computeWeekly(s, { weekEnd: '2026-11-20', today: '2026-11-15' }).quranPages).toBe(60)   // 620 ayə ≈ 60 səhifə
  })
  it('maybeUpload: ipucu yoxdursa heç nə; 3 saat həddi; not_enabled → ipucu silinir', async () => {
    const s = mem()
    const sent = []
    const put = async (b) => { sent.push(b) }
    expect(await maybeUpload({ storage: s, put })).toBe(null)
    writeLocalWeekly({ enabled: true, weekday: 5 }, s)
    expect(readLocalWeekly(s)).toEqual({ on: true, wd: 5 })
    const now = new Date(2026, 10, 18, 12)
    expect((await maybeUpload({ storage: s, put, now })).weekEnd).toBe('2026-11-20')
    expect(await maybeUpload({ storage: s, put, now: new Date(2026, 10, 18, 13) })).toBe(null)
    expect(sent).toHaveLength(1)
    const off = async () => { const e = new Error('x'); e.code = 'not_enabled'; throw e }
    expect(await maybeUpload({ storage: s, put: off, now, force: true })).toBe(null)
    expect(readLocalWeekly(s)).toBe(null)
  })
})
