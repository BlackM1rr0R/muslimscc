import { describe, it, expect } from 'vitest'
import { asrDay, shadowVec, tipPath, localDayStart } from '../../src/utils/asrShadow'
import { computeTimes, tzOffsetHours } from '../../src/utils/prayCalc'

const BAKU = { lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku' }
const hm = (ms, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms))
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }

describe('asrShadow', () => {
  it('Bakı: əsr 1× saytın cədvəli ilə (prayCalc, asrFactor 1) ±2 dəq üst-üstə düşür, 2× sonra gəlir', () => {
    for (const [y, m, d] of [[2026, 6, 21], [2026, 12, 21], [2027, 3, 20]]) {
      const day = asrDay(Date.UTC(y, m - 1, d), BAKU.lat, BAKU.lng)
      const ref = computeTimes({ year: y, month: m, day: d }, BAKU.lat, BAKU.lng, tzOffsetHours(BAKU.tz, y, m, d))
      expect(Math.abs(toMin(hm(day.asr1, BAKU.tz)) - toMin(ref.asr))).toBeLessThanOrEqual(2)
      expect(Math.abs(toMin(hm(day.sunset, BAKU.tz)) - toMin(ref.maghrib))).toBeLessThanOrEqual(2)
      expect(day.asr2).toBeGreaterThan(day.asr1)
      expect(day.asr2).toBeLessThan(day.sunset)
    }
  })
  it('kölgə əsr 1× anında günorta kölgəsi + 1 boy olur', () => {
    const day = asrDay(Date.UTC(2026, 10, 12), BAKU.lat, BAKU.lng)
    expect(shadowVec(day.asr1, BAKU.lat, BAKU.lng).len).toBeCloseTo(day.L0 + 1, 2)
    expect(shadowVec(day.asr2, BAKU.lat, BAKU.lng).len).toBeCloseTo(day.L0 + 2, 2)
  })
  it('günorta kölgəsi Bakıda qışda şimala yönəlir (y < 0, x ≈ 0)', () => {
    const day = asrDay(Date.UTC(2026, 11, 21), BAKU.lat, BAKU.lng)
    const v = shadowVec(day.noon, BAKU.lat, BAKU.lng)
    expect(v.y).toBeLessThan(0)
    expect(Math.abs(v.x)).toBeLessThan(0.02)
    expect(day.L0).toBeGreaterThan(1.5)
  })
  it('Məkkədə Günəş zenitə yaxın olanda günorta kölgəsi demək olar yoxdur', () => {
    const day = asrDay(Date.UTC(2026, 4, 27), 21.4225, 39.8262)
    expect(day.L0).toBeLessThan(0.01)
  })
  it('qütb gecəsi: Tromsø dekabrda — günəş yoxdur', () => {
    const day = asrDay(Date.UTC(2026, 11, 21), 69.65, 18.96)
    expect(day.asr1).toBeNull()
    expect(day.L0).toBeNull()
  })
  it('kölgə ucunun izi və yerli gün', () => {
    const day = asrDay(Date.UTC(2026, 5, 21), BAKU.lat, BAKU.lng)
    const p = tipPath(day, BAKU.lat, BAKU.lng)
    expect(p.length).toBeGreaterThan(40)
    expect(p.every(q => Math.hypot(q.x, q.y) <= 4.5)).toBe(true)
    // Bakıda 23:30 UTC artıq ertəsi gündür
    expect(localDayStart(Date.UTC(2026, 5, 21, 23, 30), BAKU.tz)).toBe(Date.UTC(2026, 5, 22))
  })
})
