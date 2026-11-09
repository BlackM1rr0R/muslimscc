// /analytics v2 — gündəlik sıralar və lent (src/utils/analyticsSeries.js)
import { describe, it, expect } from 'vitest'
import { buildDays, getDay, catValues, dayScore, rangeStats, feedEvents, firstDay } from '../../src/utils/analyticsSeries.js'

const store = {
  prayerStats: { '2026-11-09_Fajr': true, '2026-11-09_Dhuhr': true, 'junk': true, '2026-11-08_Isha': false },
  tracker: {
    '2026-11-09': { fajr: true, asr: true, maghrib: true, isha: true, morning: true },
    '2026-11-02': { fajr: true },
    'bad': { fajr: true }, '2026-11-01': null,
  },
  quranStats: { dates: ['2026-11-09', 'x', 5] },
  khatm: { log: ['2026-11-07'] },
  dhikrDaily: { '2026-11-09': 33, '2026-11-08': 'abc' },
  dhikrSession: { log: [{ id: new Date(2026, 10, 9, 14, 30).getTime(), name: 'SubhanAllah', count: 33 }, null] },
  hifzSrs: { log: { '2026-11-06': { reviews: 3, new: 1 } } },
  charity: [{ id: new Date(2026, 10, 8, 10).getTime(), date: '2026-11-08', type: 'money', amount: '5' }, { date: 'x' }, 'z'],
  duaJournal: { duas: [{ id: 'a', date: '2026-11-05', answered: true, answeredDate: '2026-11-07' }] },
  muhasabah: { entries: { '2026-11-08': { c: ['salah', 'quran'], u: 0 } } },
  sunnahFasts: { days: ['2026-11-03'] },
  badges: { first_prayer: '2026-11-02' },
}

describe('buildDays', () => {
  const days = buildDays(store)
  it('namazlar iki açardan birləşir (təkrar sayılmır)', () => {
    expect(getDay(days, '2026-11-09').prayers.size).toBe(5)
    expect(getDay(days, '2026-11-08').prayers.size).toBe(0)
  })
  it('kateqoriyalar', () => {
    const c = catValues(getDay(days, '2026-11-09'))
    expect(c).toEqual({ prayer: 5, adhkar: 2, quran: 1, charity: 0 })   // səhər əzkarı + zikr
    expect(catValues(getDay(days, '2026-11-08')).charity).toBe(1)
    expect(getDay(days, '2026-11-06').quran).toBe(1)                     // hifz təkrarı Quran sayılır
    expect(getDay(days, '2026-11-07').quran).toBe(1)                     // xətm planı
    expect(dayScore(getDay(days, '2026-11-09'))).toBe(8)
  })
  it('pozuq dəyərlər atılır', () => {
    expect(days.has('bad')).toBe(false)
    expect(getDay(days, '2026-11-08').dhikr).toBe(0)
  })
  it('boş görüntü çökmür', () => {
    expect(buildDays({}).size).toBe(0)
    expect(firstDay(buildDays({}))).toBeNull()
  })
  it('ilk gün', () => { expect(firstDay(days)).toBe('2026-11-02') })
})

describe('rangeStats', () => {
  const days = buildDays(store)
  it('son 7 gün və əvvəlki 7 gün', () => {
    const r = rangeStats(days, '2026-11-09', 7)
    expect(r.keys[0]).toBe('2026-11-03')
    expect(r.cur.prayers).toBe(5)
    expect(r.prev.prayers).toBe(1)
    expect(r.cur.fullDays).toBe(1)
    expect(r.cur.fullQuran).toBe(1)
    expect(r.cur.dhikr).toBe(33)
    expect(r.cur.perPrayer.fajr).toBe(1)
    expect(r.cur.effDays).toBe(7)
    expect(r.prev.effDays).toBe(1)        // ilk qeyd 2 noyabr
  })
})

describe('feedEvents', () => {
  const names = {
    charity: (t) => `c:${t}`, dhikr: (n, c) => `z:${n}:${c}`, duaNew: 'dn', duaAnswered: 'da', muhasabah: (n) => `m:${n}`,
    badge: (id) => `b:${id}`, quran: 'q', hifz: (n) => `h:${n}`, fullDay: 'p', fast: 'f',
  }
  it('yenidən köhnəyə, dəqiq vaxt saxlanılır', () => {
    const ev = feedEvents(store, buildDays(store), names, '2026-11-01')
    expect(ev[0].title).toBe('z:SubhanAllah:33')
    expect(typeof ev[0].time).toBe('number')
    const titles = ev.map(e => e.title)
    expect(titles).toContain('c:money')
    expect(titles).toContain('da')
    expect(titles).toContain('m:2')
    expect(titles).toContain('b:first_prayer')
    expect(titles).toContain('h:4')
    expect(titles).toContain('f')
  })
  it('eyni gündə dəqiq vaxtlı hadisə gün hadisəsindən əvvəl gəlir (səhər saatlarında da)', () => {
    const early = new Date(2026, 10, 10, 1, 13).getTime()   // 01:13 — günortadan əvvəl
    const s = {
      prayerStats: { '2026-11-10_Fajr': true, '2026-11-10_Dhuhr': true, '2026-11-10_Asr': true, '2026-11-10_Maghrib': true, '2026-11-10_Isha': true },
      dhikrSession: { log: [{ id: early, name: 'SubhanAllah', count: 33 }] },
    }
    const ev = feedEvents(s, buildDays(s), names, '2026-11-01')
    const i = ev.findIndex(e => e.title === 'z:SubhanAllah:33')
    const j = ev.findIndex(e => e.title === 'p')
    expect(i).toBeGreaterThanOrEqual(0)
    expect(j).toBeGreaterThanOrEqual(0)
    expect(i).toBeLessThan(j)
  })
  it('since-dən köhnələr atılır', () => {
    const ev = feedEvents(store, buildDays(store), names, '2026-11-08')
    expect(ev.every(e => typeof e.time === 'number' || e.time >= '2026-11-08')).toBe(true)
  })
})
