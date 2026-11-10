import { describe, it, expect } from 'vitest'
import { hijriBirthday } from '../../src/utils/hijriBirthday'
import { gregorianToHijri, gDiffDays } from '../../src/utils/hijri'

describe('hijriBirthday', () => {
  const today = { year: 2026, month: 11, day: 10 }
  it('hicri doğum tarixi, yaşlar və növbəti doğum günü', () => {
    const r = hijriBirthday({ year: 1990, month: 5, day: 15 }, today)
    expect(r.hBirth).toEqual(gregorianToHijri({ year: 1990, month: 5, day: 15 }))
    expect(r.ageG).toBe(36)
    expect(r.ageH).toBeGreaterThanOrEqual(37)      // hicri il qısadır — yaş böyükdür
    expect(r.extraYears).toBe(r.ageH - r.ageG)
    expect(r.daysUntil).toBeGreaterThanOrEqual(0)
    expect(r.daysUntil).toBeLessThan(356)
    expect(gregorianToHijri(r.nextG).month).toBe(r.hBirth.month)
    expect(r.nextAgeH).toBe(r.ageH + (r.isToday ? 0 : 1))
  })
  it('bu gün doğulan — doğum günü bu gündür', () => {
    const r = hijriBirthday(today, today)
    expect(r.isToday).toBe(true)
    expect(r.ageH).toBe(0)
    expect(r.daysLived).toBe(0)
  })
  it('gələcək tarix və səhv tarix — null', () => {
    expect(hijriBirthday({ year: 2030, month: 1, day: 1 }, today)).toBeNull()
    expect(hijriBirthday({ year: 2020, month: 2, day: 31 }, today)).toBeNull()
  })
  it('daysLived — günlərin fərqi', () => {
    const b = { year: 2000, month: 1, day: 1 }
    expect(hijriBirthday(b, today).daysLived).toBe(gDiffDays(b, today))
  })
})
