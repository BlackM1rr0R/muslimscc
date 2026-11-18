// J1: məzhəb → əsrin kölgə əmsalı (utils/madhab, prayCalc.withAsr / aladhanMethodQuery,
// prayerLocation.locationSig, server prayer-utils / push / ics) — Hənəfi 2×, qalanları 1×
import { describe, it, expect, beforeEach } from 'vitest'
import { createRequire } from 'node:module'

// Brauzer mühiti: localStorage (node mühitində)
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)) },
  removeItem: (k) => { mem.delete(k) },
  clear: () => mem.clear(),
}
const { asrFactorOf, normMadhab, readMadhab, writeMadhab, asrOfLoc, MADHAB_KEY } = await import('../../src/utils/madhab')
const { computeTimes, tzOffsetHours, CALC_METHODS, withAsr, aladhanMethodQuery, METHOD_ABUBAKR } = await import('../../src/utils/prayCalc')
const { asrDay } = await import('../../src/utils/asrShadow')
const { getPrayerLocation, locationSig, locationForCitySlug } = await import('../../src/utils/prayerLocation')
const { icsUrl } = await import('../../src/utils/icsUrl')

const require = createRequire(import.meta.url)
const srvCalc = require('../../server/prayCalc.js')
const { normLoc, locKey } = require('../../server/prayer-utils.js')
const { parseQuery } = require('../../server/ics.js')

const BAKU = { lat: 40.3953, lng: 49.8822, tz: 'Asia/Baku' }
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }
const hm = (ms, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms))

beforeEach(() => { localStorage.clear(); writeMadhab('') })

describe('məzhəb seçimi', () => {
  it('yalnız Hənəfi 2×; Şafii/Maliki/Hənbəli və seçilməyib — 1×', () => {
    expect(asrFactorOf('hanafi')).toBe(2)
    for (const m of ['shafii', 'maliki', 'hanbali', '', 'xyz', null]) expect(asrFactorOf(m)).toBe(1)
    expect(normMadhab('Hanafi')).toBe('')
  })
  it('yaddaşa yazılır, silinir; loc.asr üstündür', () => {
    writeMadhab('hanafi')
    expect(localStorage.getItem(MADHAB_KEY)).toBe('hanafi')
    expect(readMadhab()).toBe('hanafi')
    expect(asrOfLoc({})).toBe(2)
    expect(asrOfLoc({ asr: 1 })).toBe(1)
    writeMadhab('')
    expect(localStorage.getItem(MADHAB_KEY)).toBeNull()
    expect(asrOfLoc({})).toBe(1)
  })
})

describe('əsr vaxtı: Hənəfi (2×) vs Şafii (1×)', () => {
  it('Bakı: Hənəfi əsri müstəqil kölgə hesabı ilə (kölgə = 2 boy + günorta kölgəsi) ±2 dəq üst-üstə düşür', () => {
    for (const [y, m, d] of [[2026, 6, 21], [2026, 11, 18], [2027, 3, 20]]) {
      const tz = tzOffsetHours(BAKU.tz, y, m, d)
      const shafi = computeTimes({ year: y, month: m, day: d }, BAKU.lat, BAKU.lng, tz, CALC_METHODS.abubakr)
      const hanafi = computeTimes({ year: y, month: m, day: d }, BAKU.lat, BAKU.lng, tz, withAsr(CALC_METHODS.abubakr, 2))
      const ref = asrDay(Date.UTC(y, m - 1, d), BAKU.lat, BAKU.lng)
      expect(Math.abs(toMin(hanafi.asr) - toMin(hm(ref.asr2, BAKU.tz)))).toBeLessThanOrEqual(2)
      expect(Math.abs(toMin(shafi.asr) - toMin(hm(ref.asr1, BAKU.tz)))).toBeLessThanOrEqual(2)
      // Hənəfi əsri sonradır; digər vaxtlar dəyişmir
      expect(toMin(hanafi.asr) - toMin(shafi.asr)).toBeGreaterThan(30)
      for (const k of ['fajr', 'sunrise', 'dhuhr', 'maghrib', 'isha']) expect(hanafi[k]).toBe(shafi[k])
    }
  })
  it('Bakı, 18.11.2026: Şafii 15:01, Hənəfi 15:41 (sabit qiymət — reqressiya üçün)', () => {
    const tz = tzOffsetHours(BAKU.tz, 2026, 11, 18)
    const s = computeTimes({ year: 2026, month: 11, day: 18 }, BAKU.lat, BAKU.lng, tz, CALC_METHODS.abubakr)
    const h = computeTimes({ year: 2026, month: 11, day: 18 }, BAKU.lat, BAKU.lng, tz, withAsr(CALC_METHODS.abubakr, 2))
    expect(s.asr).toBe('15:01')
    expect(h.asr).toBe('15:41')
  })
  it('withAsr metodu dəyişmir (asr 1) və Diyanətin temkin dəqiqələrini saxlayır', () => {
    expect(withAsr(CALC_METHODS.abubakr, 1)).toBe(CALC_METHODS.abubakr)
    const d = withAsr(CALC_METHODS.diyanet, 2)
    expect(d.asrFactor).toBe(2)
    expect(d.offset).toEqual(CALC_METHODS.diyanet.offset)
    expect(CALC_METHODS.diyanet.asrFactor).toBe(1)
  })
  it('aladhan: Hənəfi → &school=1; əks halda əvvəlki sorğu', () => {
    expect(aladhanMethodQuery(13)).toBe('method=13')
    expect(aladhanMethodQuery(13, 1)).toBe('method=13')
    expect(aladhanMethodQuery(13, 2)).toBe('method=13&school=1')
    expect(aladhanMethodQuery(METHOD_ABUBAKR, 2)).toBe('method=99&methodSettings=18.5%2Cnull%2C90%20min&school=1')
  })
  it('server/prayCalc.js — eyni nəticə', () => {
    const a = srvCalc.computeTimes({ year: 2027, month: 6, day: 21 }, BAKU.lat, BAKU.lng, 4, srvCalc.withAsr(srvCalc.CALC_METHODS.abubakr, 2))
    expect(a).toEqual(computeTimes({ year: 2027, month: 6, day: 21 }, BAKU.lat, BAKU.lng, 4, withAsr(CALC_METHODS.abubakr, 2)))
    expect(srvCalc.aladhanMethodQuery(13, 2)).toBe(aladhanMethodQuery(13, 2))
  })
})

describe('məzhəb bütün namaz vaxtı istifadəçilərinə ötürülür', () => {
  it('getPrayerLocation / şəhər səhifəsi: asr və keş açarı (köhnə açar dəyişmir)', () => {
    const before = locationSig(getPrayerLocation())
    expect(getPrayerLocation().asr).toBe(1)
    expect(before).not.toContain('a2')
    writeMadhab('hanafi')
    expect(getPrayerLocation().asr).toBe(2)
    expect(locationSig(getPrayerLocation())).toBe(`${before},a2`)
    expect(locationForCitySlug('baku')?.asr ?? 2).toBe(2)
    // xarici yer obyekti (məs. /mosque-tv) — cari seçim
    expect(locationSig({ lat: 1, lng: 2, method: 13 })).toBe('1,2,13,a2')
    writeMadhab('shafii')
    expect(locationSig({ lat: 1, lng: 2, method: 13 })).toBe('1,2,13')
  })
  it('təqvim abunəliyi (ICS / vidcet) asr=2 ötürür, server oxuyur', () => {
    const u = icsUrl('https://x', { lat: 40.4, lng: 49.9, tz: 'Asia/Baku', method: 99, asr: 2 }, 'az')
    expect(u).toContain('asr=2')
    expect(icsUrl('https://x', { lat: 40.4, lng: 49.9, tz: 'Asia/Baku', method: 99, asr: 1 }, 'az')).not.toContain('asr=')
    const q = Object.fromEntries(new URL(u).searchParams)
    expect(parseQuery(q).asr).toBe(2)
    expect(parseQuery({ ...q, asr: undefined }).asr).toBe(1)
  })
  it('server push: abunəliyin loc.asr → normLoc / locKey (köhnə abunəliklər 1)', () => {
    const old = normLoc({ lat: 40.4, lng: 49.9, tz: 'Asia/Baku', method: 99 })
    expect(old.asr).toBe(1)
    expect(locKey(old)).not.toContain('a2')
    const h = normLoc({ lat: 40.4, lng: 49.9, tz: 'Asia/Baku', method: 99, asr: 2 })
    expect(h.asr).toBe(2)
    expect(locKey(h)).toBe(`${locKey(old)}|a2`)
  })
})
