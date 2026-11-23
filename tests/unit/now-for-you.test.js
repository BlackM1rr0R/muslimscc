// "İndi sizin üçün" — vaxt / hicri tarix / həftə gününə görə təklif seçimi (utils/nowForYou)
import { describe, it, expect } from 'vitest'
import { pickNowItems, hmToSecs, secsToHm } from '../../src/utils/nowForYou.js'
import { fastStatus } from '../../src/utils/fastStatus.js'

const T = { fajr: hmToSecs('05:30'), sunrise: hmToSecs('07:00'), dhuhr: hmToSecs('12:30'), asr: hmToSecs('15:30'), maghrib: hmToSecs('17:45'), isha: hmToSecs('19:15') }
const at = (hm) => hmToSecs(hm)
// Adi gün: 5 Cəmadiyəl-ula (oruc səbəbi yox), çərşənbə (3)
const PLAIN = { year: 1448, month: 5, day: 5 }
const base = (o = {}) => ({ secs: at('10:00'), times: T, weekday: 3, hijri: PLAIN, tomorrow: { weekday: 4, hijri: { year: 1448, month: 5, day: 6 } }, ...o })
const ids = (o) => pickNowItems(base(o)).map((x) => x.id)

describe('nowForYou: köməkçilər', () => {
  it('HH:MM ↔ saniyə', () => {
    expect(hmToSecs('05:07')).toBe(5 * 3600 + 7 * 60)
    expect(hmToSecs('5:07 (EET)')).toBe(5 * 3600 + 7 * 60)
    expect(hmToSecs('25:00')).toBeNull()
    expect(hmToSecs('')).toBeNull()
    expect(secsToHm(hmToSecs('19:05'))).toBe('19:05')
  })
  it('fastStatus (utils-ə köçürülüb, /calendar ilə eyni qayda)', () => {
    const d = (wd) => ({ getDay: () => wd })
    expect(fastStatus({ month: 9, day: 3 }, d(1))).toBe('ramadan')
    expect(fastStatus({ month: 12, day: 10 }, d(1))).toBe('haram')
    expect(fastStatus({ month: 12, day: 9 }, d(4))).toEqual(['arafah', 'thu'])
    expect(fastStatus({ month: 5, day: 13 }, d(3))).toEqual(['bid'])
  })
})

describe('nowForYou: günün vaxtı', () => {
  it('sübhdən sonra, səhər — səhər rejimi (/morning-routine)', () => {
    const r = pickNowItems(base({ secs: at('06:10') }))
    expect(r[0]).toMatchObject({ id: 'morning', page: 'waking', reason: { kind: 'after', prayer: 'fajr', at: T.fajr } })
  })
  it('işadan sonra və gecə yarısından sonra — yatmazdan əvvəlki sünnələr', () => {
    expect(ids({ secs: at('22:30') })).toContain('bedtime')
    expect(ids({ secs: at('01:30') })).toContain('bedtime')
    expect(ids({ secs: at('22:30') })).not.toContain('morning')
  })
  it('gündüz heç nə uyğun deyilsə — ehtiyat təklif (növbəti namazla)', () => {
    const r = pickNowItems(base({ secs: at('13:00') }))
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ id: 'focus', reason: { kind: 'next', prayer: 'asr', at: T.asr } })
  })
  it('namaz vaxtları bilinmirsə — cihaz saatı ilə kobud seçim, yenə ən azı 1 təklif', () => {
    expect(pickNowItems({ secs: at('06:00'), times: {}, weekday: 3, hijri: PLAIN }).map((x) => x.id)).toEqual(['morning'])
    expect(pickNowItems({}).length).toBeGreaterThanOrEqual(1)
  })
})

describe('nowForYou: təqvim', () => {
  it('Ramazan: məğribə qədər iftar vaxtı, sonra təravih qeydi', () => {
    const ram = { year: 1448, month: 9, day: 12 }
    const a = pickNowItems(base({ hijri: ram, secs: at('14:00') }))
    expect(a[0]).toMatchObject({ id: 'iftar', page: 'ramadan', reason: { kind: 'iftar', at: T.maghrib } })
    const b = pickNowItems(base({ hijri: ram, secs: at('20:00') }))
    expect(b[0]).toMatchObject({ id: 'taraweeh', page: 'ramadan' })
    expect(b.map((x) => x.id)).toContain('bedtime')
    // Ramazanda bazar ertəsi "sünnə orucu" təklif olunmur (oruc fərzdir)
    expect(ids({ hijri: ram, weekday: 1, secs: at('09:00') })).not.toContain('fastToday')
  })
  it('Zülhiccənin 1–9-u — dərs; 9-u Ərəfə; 8-i axşam — "sabah Ərəfə"', () => {
    expect(ids({ hijri: { year: 1447, month: 12, day: 3 } })).toContain('dhulhijjah')
    const d9 = pickNowItems(base({ hijri: { year: 1447, month: 12, day: 9 } }))
    expect(d9[0]).toMatchObject({ id: 'arafah', page: 'calendar', hash: 'cal-fasts' })
    expect(d9.find((x) => x.id === 'dhulhijjah')).toMatchObject({ page: 'learn', param: 'dhul-hijjah-ten' })
    expect(ids({ hijri: { year: 1447, month: 12, day: 8 }, secs: at('16:00') })).toContain('arafahTomorrow')
    expect(ids({ hijri: { year: 1447, month: 12, day: 8 }, secs: at('09:00') })).not.toContain('arafahTomorrow')
    // Bayram / təşriq günləri — təklif yoxdur (EidMode göstərir)
    expect(ids({ hijri: { year: 1447, month: 12, day: 11 } })).toEqual(['focus'])
  })
  it('bazar ertəsi / cümə axşamı və ağ günlər — sünnə orucu (bu gün məğribə qədər)', () => {
    const mon = pickNowItems(base({ weekday: 1, secs: at('11:00') }))
    expect(mon[0]).toMatchObject({ id: 'fastToday', reason: { kind: 'fast', r: 'mon' } })
    expect(ids({ weekday: 1, secs: at('18:30') })).not.toContain('fastToday')
    const white = pickNowItems(base({ hijri: { year: 1448, month: 5, day: 14 }, weekday: 1, secs: at('11:00') }))
    expect(white[0].reason.r).toBe('bid') // ən xüsusi səbəb birinci
  })
  it('sabah sünnə orucudursa — əsrdən sonra xəbər', () => {
    const r = pickNowItems(base({ weekday: 0, tomorrow: { weekday: 1, hijri: PLAIN }, secs: at('16:00') }))
    expect(r.find((x) => x.id === 'fastTomorrow')).toMatchObject({ reason: { kind: 'fast', r: 'mon' } })
    expect(ids({ weekday: 0, tomorrow: { weekday: 1, hijri: PLAIN }, secs: at('10:00') })).not.toContain('fastTomorrow')
  })
  it('cümə axşamı məğribdən sonra — cümə (/jamaat); cümə günü təklif yoxdur (Cümə kartı var)', () => {
    expect(ids({ weekday: 4, secs: at('18:30') })).toContain('fridayEve')
    expect(ids({ weekday: 4, secs: at('12:00') })).not.toContain('fridayEve')
    expect(ids({ weekday: 5, secs: at('12:00') })).toEqual(['focus'])
  })
  it('ən çox 3 təklif, təkrarsız, prioritetlə', () => {
    // Zülhiccə 9-u, bazar ertəsi gecəsi: arafah, dhulhijjah, bedtime, fastTomorrow…
    const r = pickNowItems(base({ hijri: { year: 1447, month: 12, day: 9 }, weekday: 4, secs: at('22:00'), tomorrow: { weekday: 5, hijri: { year: 1447, month: 12, day: 10 } } }))
    expect(r.length).toBeLessThanOrEqual(3)
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length)
    expect(r.map((x) => x.id)).toEqual(['arafah', 'dhulhijjah', 'fridayEve'])
  })
})
