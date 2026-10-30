// Namaz izləyicisi — saf məntiq (src/utils/prayerTracker.js)
import { describe, it, expect } from 'vitest'
import {
  PRAYERS, prayerStatus, applyStatus, mergePending, computeStreak, bestStreak,
  dayState, rangeSummary, normHayd, excusedPeriod, normQada, estimateMissedDays,
  qadaTotals, ramadanDaysIn, addDays, lastNDays, monthDays,
} from '../../src/utils/prayerTracker.js'

const empty = () => ({ stats: {}, tracker: {}, status: {} })
const TODAY = '2026-10-30'
const fullDay = (snap, date, status = 'prayed') => PRAYERS.reduce((s, p) => applyStatus(s, date, p, status), snap)

describe('vəziyyət və köhnə açarlar', () => {
  it('köhnə /prayer və /dailytracker qeydləri "qıldım" sayılır (miqrasiyasız)', () => {
    const snap = { stats: { '2026-10-29_Fajr': true }, tracker: { '2026-10-29': { dhuhr: true, quran: true } }, status: {} }
    expect(prayerStatus(snap, '2026-10-29', 'fajr')).toBe('prayed')
    expect(prayerStatus(snap, '2026-10-29', 'dhuhr')).toBe('prayed')
    expect(prayerStatus(snap, '2026-10-29', 'asr')).toBeNull()
  })
  it('applyStatus köhnə açarlara da yazır, digər əməllərə toxunmur', () => {
    let s = { stats: {}, tracker: { [TODAY]: { quran: true } }, status: {} }
    s = applyStatus(s, TODAY, 'asr', 'qada')
    expect(s.stats[`${TODAY}_Asr`]).toBe(true)
    expect(s.tracker[TODAY]).toEqual({ quran: true, asr: true })
    expect(prayerStatus(s, TODAY, 'asr')).toBe('qada')
    s = applyStatus(s, TODAY, 'asr', 'missed')
    expect(s.stats[`${TODAY}_Asr`]).toBeUndefined()
    expect(s.tracker[TODAY].asr).toBe(false)
    expect(prayerStatus(s, TODAY, 'asr')).toBe('missed')
    s = applyStatus(s, TODAY, 'asr', null)
    expect(prayerStatus(s, TODAY, 'asr')).toBeNull()
    expect(s.status[TODAY]).toBeUndefined()
  })
  it('başqa səhifə işarəni silsə "qəza" üstünlüyü də düşür', () => {
    let s = applyStatus(empty(), TODAY, 'isha', 'qada')
    delete s.stats[`${TODAY}_Isha`]; s.tracker[TODAY].isha = false
    expect(prayerStatus(s, TODAY, 'isha')).toBeNull()
  })
})

describe('IndexedDB qeydlərinin birləşməsi', () => {
  it('idempotentdir və qəzanı "qıldım"a endirmir', () => {
    const rec = { id: `${TODAY}|dhuhr`, date: TODAY, prayer: 'dhuhr', status: 'prayed' }
    const a = mergePending(empty(), [rec])
    expect(a.changed).toBe(1)
    const b = mergePending(a.snap, [rec, rec])
    expect(b.changed).toBe(0)
    expect(b.snap).toEqual(a.snap)
    const q = applyStatus(empty(), TODAY, 'dhuhr', 'qada')
    expect(prayerStatus(mergePending(q, [rec]).snap, TODAY, 'dhuhr')).toBe('qada')
  })
  it('"qılmadım" qeydini sonrakı "qıldım" əvəz edir; yararsız qeyd atılır', () => {
    const m = applyStatus(empty(), TODAY, 'fajr', 'missed')
    const r = mergePending(m, [
      { date: TODAY, prayer: 'fajr', status: 'prayed' },
      { date: 'dünən', prayer: 'fajr', status: 'prayed' },
      { date: TODAY, prayer: 'witr', status: 'prayed' },
      null,
    ])
    expect(r.changed).toBe(1)
    expect(prayerStatus(r.snap, TODAY, 'fajr')).toBe('prayed')
  })
})

describe('seriya', () => {
  it('5 fərzin hamısı (qəza da) — bu gün yarımçıqdırsa dünəndən sayılır', () => {
    let s = empty()
    s = fullDay(s, addDays(TODAY, -1))
    s = fullDay(s, addDays(TODAY, -2), 'qada')
    s = fullDay(s, addDays(TODAY, -3))
    s = applyStatus(s, TODAY, 'fajr', 'prayed')
    expect(computeStreak(s, [], TODAY)).toBe(3)
    s = fullDay(s, TODAY)
    expect(computeStreak(s, [], TODAY)).toBe(4)
  })
  it('heyz günləri seriyanı qırmır (sayılmır da)', () => {
    let s = empty()
    s = fullDay(s, addDays(TODAY, -1))
    // -2…-6 — heyz; -7, -8 — tam
    s = fullDay(s, addDays(TODAY, -7))
    s = fullDay(s, addDays(TODAY, -8))
    const periods = normHayd({ periods: [{ id: 'p1', type: 'hayd', start: addDays(TODAY, -6), end: addDays(TODAY, -2) }] }).periods
    expect(computeStreak(s, [], TODAY)).toBe(1)
    expect(computeStreak(s, periods, TODAY)).toBe(3)
    expect(bestStreak(s, periods, TODAY)).toBe(3)
  })
  it('açıq dövr (end yoxdur) bu günə qədər davam edir', () => {
    const periods = normHayd({ periods: [{ id: 'n', type: 'nifas', start: addDays(TODAY, -3), end: null }] }).periods
    expect(excusedPeriod(periods, TODAY, TODAY)?.type).toBe('nifas')
    expect(excusedPeriod(periods, addDays(TODAY, -4), TODAY)).toBeNull()
    expect(dayState(empty(), periods, TODAY, TODAY).state).toBe('excused')
  })
})

describe('hesabat', () => {
  it('həftəlik xülasə: heyz günləri mümkün namaz sayına düşmür', () => {
    let s = fullDay(empty(), addDays(TODAY, -1))
    s = applyStatus(s, TODAY, 'fajr', 'qada')
    s = applyStatus(s, TODAY, 'dhuhr', 'missed')
    const periods = [{ id: 'x', type: 'hayd', start: addDays(TODAY, -6), end: addDays(TODAY, -3) }]
    const r = rangeSummary(s, periods, lastNDays(TODAY, 7), TODAY)
    expect(r.excusedDays).toBe(4)
    expect(r.possible).toBe(15)
    expect(r).toMatchObject({ prayed: 5, qada: 1, missed: 1, completeDays: 1 })
    expect(r.pct).toBe(40)
  })
  it('ayın günləri', () => {
    expect(monthDays(2026, 1)).toHaveLength(28)
    expect(monthDays(2026, 9)[0]).toBe('2026-10-01')
  })
})

describe('qəza sayğacı', () => {
  it('normallaşdırma və toplam', () => {
    const q = normQada({ prayers: { fajr: { debt: 3, done: 1 }, asr: { debt: -2, done: 'x' } }, fasts: { debt: 4.7 } })
    expect(q.prayers.fajr).toEqual({ debt: 3, done: 1 })
    expect(q.prayers.asr).toEqual({ debt: 0, done: 0 })
    expect(q.fasts).toEqual({ debt: 4, done: 0 })
    expect(qadaTotals(q)).toEqual({ debt: 3, done: 1, pct: 25 })
  })
  it('toplu təxmin: il 365, ay 30 gün', () => {
    expect(estimateMissedDays({ years: 3 })).toBe(1095)
    expect(estimateMissedDays({ years: 1, months: 2, days: 5 })).toBe(430)
    expect(estimateMissedDays({ years: -1, months: 'a' })).toBe(0)
  })
})

describe('Ramazan günləri (Ümmül-Qura)', () => {
  it('1447 Ramazanına düşən heyz günləri sayılır', () => {
    // 1 Ramazan 1447 ≈ 18.02.2026 (Ümmül-Qura)
    const days = ramadanDaysIn({ start: '2026-02-15', end: '2026-02-22' }, TODAY)
    expect(days.length).toBeGreaterThanOrEqual(4)
    expect(days.length).toBeLessThanOrEqual(6)
    expect(days).toContain('2026-02-20')
    expect(ramadanDaysIn({ start: '2026-06-01', end: '2026-06-07' }, TODAY)).toEqual([])
  })
})
