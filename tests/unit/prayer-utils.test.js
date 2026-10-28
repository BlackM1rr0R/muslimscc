// Server: namaz push planlayıcısının köməkçiləri (server/prayer-utils.js)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const u = require('../../server/prayer-utils.js')
const { DEFAULT_PRAYER_LOCATION } = await import('../../src/config/brand.js')

afterEach(() => vi.useRealTimers())

describe('normLoc', () => {
  it('düzgün yeri saxlayır, sətir rəqəmləri çevirir', () => {
    const l = u.normLoc({ lat: '41.01', lng: 28.97, tz: 'Europe/Istanbul', method: 13, city: { az: 'İstanbul' } })
    expect(l).toMatchObject({ lat: 41.01, lng: 28.97, tz: 'Europe/Istanbul', method: 13 })
  })
  it('yararsız yer → standart (Bakı)', () => {
    for (const bad of [null, {}, { lat: 999, lng: 0 }, { lat: 'x', lng: 1 }]) {
      expect(u.normLoc(bad)).toBe(u.DEFAULT_LOC)
    }
  })
  it('yanlış saat qurşağı → standart tz, koordinat qalır', () => {
    const l = u.normLoc({ lat: 51.5, lng: -0.12, tz: 'Mars/Olympus' })
    expect(l.tz).toBe('Asia/Baku')
    expect(l.lat).toBe(51.5)
  })
  it('standart yer brand.js-dəki DEFAULT_PRAYER_LOCATION ilə eynidir', () => {
    const { lat, lng, tz, method, city } = DEFAULT_PRAYER_LOCATION
    expect(u.DEFAULT_LOC).toEqual({ lat, lng, tz, method, city })
  })
})

describe('nowIn / addDay', () => {
  it('saat qurşağına görə yerli vaxt və cümə günü', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T08:30:00Z'))   // cümə
    expect(u.nowIn('Asia/Baku')).toEqual({ dateKey: '2026-10-30', ddmmyyyy: '30-10-2026', hhmm: '12:30', friday: true })
    expect(u.nowIn('America/New_York').hhmm).toBe('04:30')
  })
  it('gecə yarısı 00:xx kimi yazılır (24:xx yox)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-26T20:05:00Z'))
    expect(u.nowIn('Asia/Baku').hhmm).toBe('00:05')
  })
  it('addDay ay və il sərhədini keçir', () => {
    expect(u.addDay('31-10-2026')).toBe('01-11-2026')
    expect(u.addDay('31-12-2026')).toBe('01-01-2027')
  })
})

describe('bildiriş mətnləri', () => {
  it('5 dilin hamısında 5 namaz adı və bütün sahələr var', () => {
    for (const l of u.LANGS) {
      const T = u.PUSH_TEXTS[l]
      expect(Object.keys(T.names).sort()).toEqual(['asr', 'dhuhr', 'fajr', 'isha', 'maghrib'])
      expect(T.title(T.names.fajr, '05:32')).toContain('05:32')
      expect(T.jumuaTitle('12:29')).toContain('12:29')
      expect(T.next && T.tomorrow).toBeTruthy()
    }
  })
  it('az mətnində türkcə, tr mətnində "ə" yoxdur', () => {
    expect(JSON.stringify(u.PUSH_TEXTS.az.names) + u.PUSH_TEXTS.az.title('X', '1')).not.toMatch(/ezan|öğle|ikindi/i)
    expect(JSON.stringify(u.PUSH_TEXTS.tr.names) + u.PUSH_TEXTS.tr.title('X', '1')).not.toMatch(/ə/)
  })
})
