import { describe, it, expect } from 'vitest'
import { planTrip, tripEvents, periodAt, parseNum, fracOf, SPEED_MAX } from '../../src/utils/roadTrip'
import { zonedToUtc, distanceKm } from '../../src/utils/flightPrayer'
import { computeTimes, CALC_METHODS } from '../../src/utils/prayCalc'

const MIN = 60000
const BAKU = { lat: 40.3953, lng: 49.8822, tz: 'Asia/Baku' }
const TBILISI = { lat: 41.6914, lng: 44.8341, tz: 'Asia/Tbilisi' }
const GANJA = { lat: 40.6828, lng: 46.3606, tz: 'Asia/Baku' }
const hmToMs = (dateStr, hm, tz) => zonedToUtc(`${dateStr}T${hm}`, tz)

describe('roadTrip — parseNum', () => {
  it('ədəd, vergül, boş və mənfi', () => {
    expect(parseNum('80')).toBe(80)
    expect(parseNum('92,5')).toBe(92.5)
    expect(parseNum('')).toBeNull()
    expect(parseNum('  ')).toBeNull()
    expect(parseNum('-5')).toBeNull()
    expect(parseNum('abc')).toBeNull()
  })
})

describe('roadTrip — planTrip', () => {
  const depMs = Date.UTC(2026, 5, 1, 4, 0)
  it('düz xətt, sürət və dayanacaqlarla müddət', () => {
    const p = planTrip({ from: BAKU, to: TBILISI, depMs, speedKmh: 80 })
    expect(p.ok).toBe(true)
    expect(p.km).toBeCloseTo(distanceKm(BAKU, TBILISI), 6)
    expect(p.km).toBeGreaterThan(430)
    expect(p.km).toBeLessThan(460)
    expect(p.durMin).toBe(Math.round(p.km / 80 * 60))
    const q = planTrip({ from: BAKU, to: TBILISI, depMs, speedKmh: 80, roadKm: 560, stopMin: 45 })
    expect(q.km).toBe(560)
    expect(q.durMin).toBe(Math.round(560 / 80 * 60) + 45)
    expect(q.arriveMs).toBe(depMs + q.durMin * MIN)
  })
  it('səhvlər: eyni yer, sürət, qısa yol, çox uzun səfər', () => {
    expect(planTrip({ from: BAKU, to: BAKU, depMs }).error).toBe('same')
    expect(planTrip({ from: BAKU, to: TBILISI, depMs, speedKmh: 5 }).error).toBe('speed')
    expect(planTrip({ from: BAKU, to: TBILISI, depMs, speedKmh: SPEED_MAX + 1 }).error).toBe('speed')
    expect(planTrip({ from: BAKU, to: TBILISI, depMs, roadKm: 300 }).error).toBe('road')
    expect(planTrip({ from: BAKU, to: { lat: 51.5, lng: -0.12 }, depMs, speedKmh: 10 }).error).toBe('long')
  })
})

describe('roadTrip — tripEvents', () => {
  it('Bakı → Tbilisi səhər 08:00: zöhr yolda, vaxtı yerli hesabla üst-üstə düşür', () => {
    const date = '2026-06-01'
    const depMs = hmToMs(date, '08:00', BAKU.tz)
    const p = planTrip({ from: BAKU, to: TBILISI, depMs, speedKmh: 80, roadKm: 560 })
    const ev = tripEvents({ from: BAKU, to: TBILISI, depMs, durMin: p.durMin, km: p.km, method: CALC_METHODS.abubakr })
    const dhuhr = ev.find(e => e.kind === 'dhuhr')
    expect(dhuhr).toBeTruthy()
    expect(dhuhr.km).toBeGreaterThan(0)
    expect(dhuhr.km).toBeLessThan(560)
    // Hadisənin yerində saytın günlük hesabı (computeTimes) ilə ±3 dəq
    const ref = computeTimes({ year: 2026, month: 6, day: 1 }, dhuhr.lat, dhuhr.lng, 4, CALC_METHODS.abubakr)
    expect(Math.abs(dhuhr.ms - hmToMs(date, ref.dhuhr, BAKU.tz)) / MIN).toBeLessThan(3)
    // Sıralı, hamısı səfərin içində
    for (let i = 1; i < ev.length; i++) expect(ev[i].ms).toBeGreaterThanOrEqual(ev[i - 1].ms)
    for (const e of ev) { expect(e.ms).toBeGreaterThanOrEqual(depMs); expect(e.ms).toBeLessThanOrEqual(p.arriveMs) }
  })
  it('ən yaxın şəhər (≤ 300 km) və km nisbəti', () => {
    const depMs = hmToMs('2026-06-01', '10:00', BAKU.tz)
    const p = planTrip({ from: BAKU, to: GANJA, depMs, speedKmh: 60 })
    const ev = tripEvents({ from: BAKU, to: GANJA, depMs, durMin: p.durMin, km: p.km })
    expect(ev.length).toBeGreaterThan(0)
    for (const e of ev) {
      expect(e.near).toBeTruthy()
      expect(e.near.km).toBeLessThanOrEqual(300)
      expect(e.km).toBe(Math.round(e.f * p.km))
    }
  })
  it('Hənəfi əsri Şafiidən gec girir', () => {
    const depMs = hmToMs('2026-06-01', '12:00', BAKU.tz)
    const args = { from: BAKU, to: TBILISI, depMs, durMin: 10 * 60, km: 450 }
    const s = tripEvents({ ...args, method: CALC_METHODS.abubakr, asrFactor: 1 }).find(e => e.kind === 'asr')
    const h = tripEvents({ ...args, method: CALC_METHODS.abubakr, asrFactor: 2 }).find(e => e.kind === 'asr')
    expect(h.ms - s.ms).toBeGreaterThan(30 * MIN)
  })
})

describe('roadTrip — periodAt', () => {
  it('Bakıda 14:00 — zöhr vaxtı, 22:30 — işa, 07:00 — günəş çıxıb', () => {
    const d = '2026-06-01'
    expect(periodAt(BAKU, hmToMs(d, '14:00', BAKU.tz)).kind).toBe('dhuhr')
    expect(periodAt(BAKU, hmToMs(d, '23:30', BAKU.tz)).kind).toBe('isha')
    expect(periodAt(BAKU, hmToMs(d, '07:00', BAKU.tz)).kind).toBe('sunrise')
    const ref = computeTimes({ year: 2026, month: 6, day: 1 }, BAKU.lat, BAKU.lng, 4, CALC_METHODS.abubakr)
    const pr = periodAt(BAKU, hmToMs(d, '14:00', BAKU.tz))
    expect(Math.abs(pr.ms - hmToMs(d, ref.dhuhr, BAKU.tz)) / MIN).toBeLessThan(3)
  })
  it('fracOf sərhədləri', () => {
    expect(fracOf(0, 0, 10)).toBe(0)
    expect(fracOf(5 * MIN, 0, 10)).toBeCloseTo(0.5)
    expect(fracOf(99 * MIN, 0, 10)).toBe(1)
    expect(fracOf(-5, 0, 10)).toBe(0)
  })
})
