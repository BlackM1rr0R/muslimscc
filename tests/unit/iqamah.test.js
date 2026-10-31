import { describe, it, expect } from 'vitest'
import {
  parseTime, formatTime, parseIqamahRule, computeIqamah, computeIqamahTimes,
  findPhase, formatCountdown, parseIqamahList, normalizeConfig, parseConfig,
  serializeConfig, mergeConfig, hasConfigParams, DEFAULT_CONFIG, DEFAULT_IQAMAH,
} from '../../src/utils/iqamah.js'

describe('parseTime / formatTime', () => {
  it('parses valid times', () => {
    expect(parseTime('05:07')).toBe(307)
    expect(parseTime('5:07')).toBe(307)
    expect(parseTime(' 23:59 ')).toBe(1439)
    expect(parseTime('00:00')).toBe(0)
  })
  it('rejects invalid times', () => {
    for (const v of ['24:00', '12:60', '1207', '', null, undefined, 'ab:cd', '12:5']) {
      expect(parseTime(v)).toBeNull()
    }
  })
  it('formats and wraps around midnight', () => {
    expect(formatTime(307)).toBe('05:07')
    expect(formatTime(1440 + 15)).toBe('00:15')
    expect(formatTime(-5)).toBe('23:55')
    expect(formatTime(NaN)).toBe('')
  })
})

describe('parseIqamahRule', () => {
  it('accepts minute offsets 0..180', () => {
    expect(parseIqamahRule(10)).toBe(10)
    expect(parseIqamahRule('15')).toBe(15)
    expect(parseIqamahRule(0)).toBe(0)
    expect(parseIqamahRule(180)).toBe(180)
  })
  it('accepts fixed HH:MM times (normalized)', () => {
    expect(parseIqamahRule('13:30')).toBe('13:30')
    expect(parseIqamahRule('6:05')).toBe('06:05')
  })
  it('rejects junk', () => {
    for (const v of [181, -1, 2.5, 'abc', '25:00', '', null]) expect(parseIqamahRule(v)).toBeNull()
  })
})

describe('computeIqamah', () => {
  it('adds an offset to the adhan', () => {
    expect(computeIqamah('05:10', 20)).toBe('05:30')
    expect(computeIqamah('12:58', 10)).toBe('13:08')
  })
  it('wraps past midnight', () => {
    expect(computeIqamah('23:55', 10)).toBe('00:05')
  })
  it('uses a fixed time', () => {
    expect(computeIqamah('12:58', '13:30')).toBe('13:30')
  })
  it('never puts a fixed iqamah before the adhan', () => {
    expect(computeIqamah('13:05', '13:00')).toBe('13:05')
  })
  it('falls back to the adhan for an invalid rule and returns "" without adhan', () => {
    expect(computeIqamah('16:20', 'x')).toBe('16:20')
    expect(computeIqamah('', 10)).toBe('')
  })
  it('computes all five prayers', () => {
    const t = { fajr: '05:10', sunrise: '06:40', dhuhr: '12:58', asr: '16:20', maghrib: '19:05', isha: '20:35' }
    expect(computeIqamahTimes(t, [20, '13:30', 10, 5, 10])).toEqual({
      fajr: '05:30', dhuhr: '13:30', asr: '16:30', maghrib: '19:10', isha: '20:45',
    })
    expect(computeIqamahTimes(t).fajr).toBe('05:30') // standart qaydalar
  })
})

describe('findPhase', () => {
  const list = [
    { key: 'dhuhr', adhan: '12:58', iqamah: '13:08' },
    { key: 'asr', adhan: '16:20', iqamah: '16:21' },
  ]
  const at = (hhmm, s = 0) => parseTime(hhmm) * 60 + s
  it('shows the adhan screen for 2 minutes', () => {
    expect(findPhase(at('12:58'), list)).toEqual({ key: 'dhuhr', phase: 'adhan', remaining: 120 })
    expect(findPhase(at('12:59', 59), list)).toMatchObject({ phase: 'adhan', remaining: 1 })
  })
  it('then counts down to iqamah', () => {
    expect(findPhase(at('13:00'), list)).toEqual({ key: 'dhuhr', phase: 'iqamah', remaining: 480 })
    expect(findPhase(at('13:07', 59), list)).toMatchObject({ phase: 'iqamah', remaining: 1 })
  })
  it('returns null outside the window', () => {
    expect(findPhase(at('12:57', 59), list)).toBeNull()
    expect(findPhase(at('13:08'), list)).toBeNull()
  })
  it('skips the iqamah phase when iqamah is within the adhan hold', () => {
    expect(findPhase(at('16:21', 30), list)).toMatchObject({ key: 'asr', phase: 'adhan' })
    expect(findPhase(at('16:22'), list)).toBeNull()
  })
  it('accepts a custom hold', () => {
    expect(findPhase(at('12:58', 30), list, 30)).toMatchObject({ phase: 'iqamah', remaining: 570 })
  })
  it('handles bad input', () => {
    expect(findPhase(NaN, list)).toBeNull()
    expect(findPhase(100, null)).toBeNull()
  })
})

describe('formatCountdown', () => {
  it('formats mm:ss and h:mm:ss', () => {
    expect(formatCountdown(65)).toBe('01:05')
    expect(formatCountdown(3725)).toBe('1:02:05')
    expect(formatCountdown(-3)).toBe('00:00')
  })
})

describe('config', () => {
  it('parses the iqamah list with defaults for missing/invalid items', () => {
    expect(parseIqamahList('10,10,13:30,5,10')).toEqual([10, 10, '13:30', 5, 10])
    expect(parseIqamahList('15,x')).toEqual([15, DEFAULT_IQAMAH[1], ...DEFAULT_IQAMAH.slice(2)])
  })

  it('parses a TV link', () => {
    const c = parseConfig('?city=Baku&iq=10,10,10,5,10&jumua=13:00&name=Əbu%20Bəkr&lang=az&theme=dark&hidesec=1&compact=1')
    expect(c).toEqual({
      city: 'Baku', iq: [10, 10, 10, 5, 10], jumua: '13:00', name: 'Əbu Bəkr',
      lang: 'az', theme: 'dark', hideSeconds: true, compact: true,
    })
  })

  it('returns only fields present in the URL and ignores invalid enums', () => {
    expect(parseConfig('lang=xx&theme=neon')).toEqual({})
    expect(parseConfig(new URLSearchParams('city=Ganja'))).toEqual({ city: 'Ganja' })
    expect(hasConfigParams('compact=1')).toBe(false)
    expect(hasConfigParams('city=Ganja')).toBe(true)
  })

  it('strips markup from the mosque name', () => {
    expect(parseConfig('name=<b>Mosque</b>').name).toBe('bMosque/b')
  })

  it('normalizes to a full config', () => {
    expect(normalizeConfig({})).toEqual({ ...DEFAULT_CONFIG, iq: DEFAULT_IQAMAH })
    expect(normalizeConfig({ jumua: '25:00', lang: 'ar', theme: 'light', beep: 'on' }))
      .toMatchObject({ jumua: '', lang: 'ar', theme: 'light', beep: true })
  })

  it('round-trips through the URL', () => {
    const cfg = normalizeConfig({
      city: 'New York', iq: [20, '13:30', 10, 5, 15], jumua: '13:15',
      name: 'Masjid & Center', lang: 'en', theme: 'light', hideSeconds: true, beep: false,
    })
    const qs = serializeConfig(cfg)
    expect(qs).toContain('iq=20,13:30,10,5,15')
    expect(qs).toContain('jumua=13:15')
    expect(qs).not.toContain('beep')
    const back = mergeConfig(parseConfig(qs))
    expect(back).toEqual(cfg)
  })

  it('adds display flags only when asked', () => {
    expect(serializeConfig(DEFAULT_CONFIG)).not.toContain('compact')
    expect(serializeConfig(DEFAULT_CONFIG, { compact: true, kiosk: true })).toMatch(/compact=1.*kiosk=1/)
  })

  it('merges stored settings with URL (URL wins)', () => {
    const stored = { city: 'Ganja', name: 'A', theme: 'light' }
    const url = parseConfig('city=Sheki')
    expect(mergeConfig(stored, url)).toMatchObject({ city: 'Sheki', name: 'A', theme: 'light' })
  })
})
