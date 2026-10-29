// Ramazan rejiminin saf köməkçiləri (src/utils/ramadan.js) — kartın vəziyyəti,
// geri sayım, imsakiyyə cavabının normallaşdırılması, 5 dildə etiketlər
import { describe, it, expect } from 'vitest'
import {
  parseRamadanMode, normHijri, ramadanYearFor, ramadanPhase, normalizeCalendar,
  nextFastEvent, formatCountdown, fastProgress, azOrdinal, ruPlural, ramadanDayLabel,
  daysUntilLabel, daysBetween, weekdayOf, calendarUrl, toSecs, cleanTime, tzNow,
} from '../../src/utils/ramadan.js'

const hijri = (day, month, year = 1448) => ({ day: String(day), month, monthEn: '', monthAr: '', year: String(year) })

describe('parseRamadanMode', () => {
  it('sınaq rejimlərini tanıyır', () => {
    expect(parseRamadanMode('?ramadan=preview')).toEqual({ mode: 'preview', day: 1 })
    expect(parseRamadanMode('?ramadan=preview&day=12')).toEqual({ mode: 'preview', day: 12 })
    expect(parseRamadanMode('?ramadan=PREVIEW&day=99')).toEqual({ mode: 'preview', day: 30 })
    expect(parseRamadanMode('?ramadan=countdown').mode).toBe('countdown')
    expect(parseRamadanMode('?ramadan=eid').mode).toBe('eid')
  })
  it('başqa dəyərlər → null (istehsalda zərərsiz)', () => {
    for (const s of ['', '?ramadan=1', '?x=preview', '?ramadan=<script>']) expect(parseRamadanMode(s)).toBeNull()
  })
})

describe('hicri tarix → vəziyyət', () => {
  it('normHijri iki formatı qəbul edir', () => {
    expect(normHijri(hijri(5, 9))).toEqual({ day: 5, month: 9, year: 1448 })
    expect(normHijri({ day: '5', month: { number: 9 }, year: '1448' })).toEqual({ day: 5, month: 9, year: 1448 })
    expect(normHijri(null)).toBeNull()
    expect(normHijri({ day: '1', month: 13, year: '1448' })).toBeNull()
  })
  it('ramadanYearFor: Ramazan keçibsə növbəti il', () => {
    expect(ramadanYearFor(hijri(15, 5))).toBe(1448)
    expect(ramadanYearFor(hijri(29, 9))).toBe(1448)
    expect(ramadanYearFor(hijri(1, 10))).toBe(1449)
    expect(ramadanYearFor(null)).toBeNull()
  })
  it('ramadanPhase: Ramazan, Şaban, bayram, qalan vaxt', () => {
    expect(ramadanPhase(hijri(12, 9))).toEqual({ phase: 'ramadan', day: 12 })
    expect(ramadanPhase(hijri(20, 8))).toEqual({ phase: 'before' })
    expect(ramadanPhase(hijri(1, 10))).toEqual({ phase: 'eid', day: 1 })
    expect(ramadanPhase(hijri(3, 10))).toEqual({ phase: 'eid', day: 3 })
    expect(ramadanPhase(hijri(4, 10))).toEqual({ phase: 'none' })
    expect(ramadanPhase(hijri(15, 5))).toEqual({ phase: 'none' })
    expect(ramadanPhase(null)).toEqual({ phase: 'none' })
  })
  it('sınaq rejimi hicri tarixi üstələyir', () => {
    expect(ramadanPhase(hijri(15, 5), { mode: 'preview', day: 7 })).toEqual({ phase: 'ramadan', day: 7 })
    expect(ramadanPhase(hijri(15, 5), { mode: 'countdown', day: 1 })).toEqual({ phase: 'before' })
    expect(ramadanPhase(hijri(15, 5), { mode: 'eid', day: 1 }).phase).toBe('eid')
  })
})

describe('normalizeCalendar (aladhan hijriCalendar)', () => {
  const row = (d, g, extra = {}) => ({
    timings: { Imsak: '05:22 (+04)', Fajr: '05:32 (+04)', Sunrise: '07:01 (+04)', Dhuhr: '12:29 (+04)', Asr: '15:24 (+04)', Maghrib: '17:51 (+04)', Isha: '19:10 (+04)', ...extra },
    date: { gregorian: { date: g }, hijri: { day: String(d), month: { number: 9 } } },
  })
  it('saatları təmizləyir, günə görə sıralayır', () => {
    const cal = normalizeCalendar({ code: 200, data: [row(2, '09-02-2027'), row(1, '08-02-2027')] })
    expect(cal.map(e => e.day)).toEqual([1, 2])
    expect(cal[0]).toEqual({ day: 1, date: '08-02-2027', times: { imsak: '05:22', fajr: '05:32', sunrise: '07:01', dhuhr: '12:29', asr: '15:24', maghrib: '17:51', isha: '19:10' } })
  })
  it('Imsak yoxdursa boş qalır, yararsız cavab → null', () => {
    expect(normalizeCalendar({ data: [row(1, '08-02-2027', { Imsak: undefined })] })[0].times.imsak).toBe('')
    expect(normalizeCalendar({ data: [] })).toBeNull()
    expect(normalizeCalendar({})).toBeNull()
    expect(normalizeCalendar({ data: [row(1, 'bad')] })).toBeNull()
    expect(normalizeCalendar({ data: [row(1, '08-02-2027', { Maghrib: '' })] })).toBeNull()
  })
  it('endpoint: hicri il / 9-cu ay, koordinat, metod, saat qurşağı', () => {
    expect(calendarUrl(1448, { lat: 40.4093, lng: 49.8671, method: 13, tz: 'Asia/Baku' }))
      .toBe('https://api.aladhan.com/v1/hijriCalendar/1448/9?latitude=40.4093&longitude=49.8671&method=13&timezonestring=Asia%2FBaku')
  })
})

describe('geri sayım', () => {
  const today = { imsak: '05:22', fajr: '05:32', maghrib: '17:51' }
  const tomorrow = { imsak: '05:20', fajr: '05:30', maghrib: '17:53' }
  it('imsakdan əvvəl → imsak', () => {
    expect(nextFastEvent(toSecs('04:00'), today, tomorrow)).toEqual({ kind: 'imsak', time: '05:22', secsLeft: 82 * 60, tomorrow: false })
  })
  it('gündüz → iftar', () => {
    const e = nextFastEvent(toSecs('15:36') + 27, today, tomorrow)
    expect(e.kind).toBe('iftar')
    expect(formatCountdown(e.secsLeft)).toBe('02:14:33')
  })
  it('iftardan sonra → sabahın imsakı', () => {
    expect(nextFastEvent(toSecs('22:00'), today, tomorrow)).toEqual({ kind: 'imsak', time: '05:20', secsLeft: 2 * 3600 + 5 * 3600 + 20 * 60, tomorrow: true })
  })
  it('son gün iftardan sonra → null; imsak yoxdursa sübh', () => {
    expect(nextFastEvent(toSecs('22:00'), today, null)).toBeNull()
    expect(nextFastEvent(toSecs('04:00'), { imsak: '', fajr: '05:32', maghrib: '17:51' }).time).toBe('05:32')
    expect(nextFastEvent(0, null)).toBeNull()
  })
  it('formatCountdown, fastProgress', () => {
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(-5)).toBe('00:00:00')
    expect(formatCountdown(36 * 3600 + 61)).toBe('36:01:01')
    expect(fastProgress(toSecs('04:00'), today)).toBeNull()
    expect(fastProgress(toSecs('05:22'), today)).toBe(0)
    expect(fastProgress(toSecs('11:36') + 30, today)).toBeCloseTo(0.5, 5)
    expect(fastProgress(toSecs('18:00'), today)).toBeNull()
  })
  it('cleanTime / toSecs', () => {
    expect(cleanTime('5:07 (+04)')).toBe('05:07')
    expect(cleanTime('x')).toBe('')
    expect(toSecs('01:02')).toBe(3720)
    expect(toSecs('')).toBeNull()
  })
})

describe('tarix köməkçiləri', () => {
  it('daysBetween ay və il sərhədindən keçir', () => {
    expect(daysBetween('30-10-2026', '08-02-2027')).toBe(101)
    expect(daysBetween('28-02-2027', '01-03-2027')).toBe(1)
    expect(daysBetween('08-02-2027', '08-02-2027')).toBe(0)
  })
  it('weekdayOf', () => {
    expect(weekdayOf('08-02-2027')).toBe(1)   // bazar ertəsi
  })
  it('tzNow şəhərin saat qurşağında', () => {
    // 2026-10-30 20:30:15 UTC → Bakı (UTC+4) 31-10-2026 00:30:15
    expect(tzNow('Asia/Baku', Date.UTC(2026, 9, 30, 20, 30, 15))).toEqual({ dateKey: '31-10-2026', secs: 30 * 60 + 15 })
  })
})

describe('5 dildə etiketlər', () => {
  it('azOrdinal — sait ahəngi', () => {
    const cases = { 1: '1-ci', 2: '2-ci', 3: '3-cü', 4: '4-cü', 5: '5-ci', 6: '6-cı', 7: '7-ci', 8: '8-ci', 9: '9-cu',
      10: '10-cu', 12: '12-ci', 16: '16-cı', 19: '19-cu', 20: '20-ci', 23: '23-cü', 29: '29-cu', 30: '30-cu' }
    for (const [n, s] of Object.entries(cases)) expect(azOrdinal(Number(n))).toBe(s)
  })
  it('ruPlural', () => {
    expect([1, 2, 5, 11, 21, 22, 25].map(n => ruPlural(n, 'день', 'дня', 'дней'))).toEqual(['день', 'дня', 'дней', 'дней', 'день', 'дня', 'дней'])
  })
  it('ramadanDayLabel', () => {
    expect(ramadanDayLabel(12, 'az')).toBe('Ramazanın 12-ci günü')
    expect(ramadanDayLabel(12, 'en')).toBe('Day 12 of Ramadan')
    expect(ramadanDayLabel(12, 'ru')).toBe('12-й день Рамадана')
    expect(ramadanDayLabel(12, 'tr')).toBe("Ramazan'ın 12. günü")
    expect(ramadanDayLabel(12, 'ar')).toBe('اليوم 12 من رمضان')
  })
  it('daysUntilLabel', () => {
    expect(daysUntilLabel(12, 'az')).toBe('Ramazana 12 gün qaldı')
    expect(daysUntilLabel(1, 'en')).toBe('1 day until Ramadan')
    expect(daysUntilLabel(3, 'ru')).toBe('До Рамадана 3 дня')
    expect(daysUntilLabel(12, 'tr')).toBe("Ramazan'a 12 gün kaldı")
    expect(daysUntilLabel(2, 'ar')).toBe('يومان حتى رمضان')
    expect(daysUntilLabel(5, 'ar')).toBe('5 أيام حتى رمضان')
  })
})
