// Server: "Qıldınızmı?" push xatırlatmasının saf köməkçiləri (server/checkin.js)
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const c = require('../../server/checkin.js')
const { LANGS } = require('../../server/prayer-utils.js')

const TIMES = { fajr: '05:32', dhuhr: '12:29', asr: '15:24', maghrib: '17:51', isha: '23:45' }

describe('vaxt', () => {
  it('azandan 20 dəqiqə sonra', () => {
    expect(c.CHECKIN_DELAY_MIN).toBe(20)
    expect(c.addMinutes('12:29')).toBe('12:49')
    expect(c.addMinutes('05:45')).toBe('06:05')
    expect(c.addMinutes('09:59', 1)).toBe('10:00')
  })
  it('gecə yarısını keçən və yararsız vaxt — null', () => {
    expect(c.addMinutes('23:45')).toBeNull()
    expect(c.addMinutes('')).toBeNull()
    expect(c.addMinutes('25:00')).toBeNull()
    expect(c.addMinutes(undefined)).toBeNull()
  })
  it('dueCheckins yalnız düşən namazı qaytarır', () => {
    expect(c.dueCheckins(TIMES, '12:49')).toEqual(['dhuhr'])
    expect(c.dueCheckins(TIMES, '05:52')).toEqual(['fajr'])
    expect(c.dueCheckins(TIMES, '12:29')).toEqual([])
    expect(c.dueCheckins(TIMES, '00:05')).toEqual([])   // işa 23:45 → keçir, göndərilmir
    expect(c.dueCheckins(null, '12:49')).toEqual([])
  })
})

describe('seçim', () => {
  it('susmaya görə sönülü — yalnız true', () => {
    expect(c.normCheckin(true)).toBe(true)
    for (const v of [undefined, null, false, 'true', 1, {}]) expect(c.normCheckin(v)).toBe(false)
  })
})

describe('mesaj', () => {
  it('tag, ünvan və dil prefiksi', () => {
    expect(c.checkinTag('dhuhr', '2026-10-30')).toBe('checkin-dhuhr-2026-10-30')
    expect(c.checkinLink('az', 'dhuhr', '2026-10-30')).toBe('/prayer?checkin=dhuhr&d=2026-10-30')
    expect(c.checkinLink('ru', 'isha', '2026-10-30')).toBe('/ru/prayer?checkin=isha&d=2026-10-30')
    expect(c.checkinLink('xx', 'asr', '2026-10-30')).toBe('/prayer?checkin=asr&d=2026-10-30')
  })
  it('5 dildə başlıq, düymələr və təsdiq mətni', () => {
    expect(c.checkinTexts('az', 'dhuhr').title).toBe('🕌 Zöhr namazını qıldınızmı?')
    expect(c.checkinTexts('tr', 'dhuhr').title).toBe('🕌 Öğle namazını kıldınız mı?')
    for (const lang of LANGS) {
      const t = c.checkinTexts(lang, 'fajr')
      for (const k of ['title', 'body', 'prayed', 'later', 'done']) expect(t[k], `${lang}.${k}`).toBeTruthy()
    }
    // az-da türkcə hərf/söz, tr-də "ə" olmasın
    const az = JSON.stringify(Object.values(c.checkinTexts('az', 'asr')))
    const tr = JSON.stringify(Object.values(c.checkinTexts('tr', 'asr')))
    expect(tr).not.toMatch(/[əƏ]/)
    expect(az).not.toMatch(/\b(kıl|namazınızı|tek)\b/i)
  })
  it('FCM mesajı: data yalnız mətndir, webpush tag və link', () => {
    const m = c.buildCheckinMessage('en', 'maghrib', '2026-10-30', { icon: '/i.png' })
    expect(m.notification.title).toBe('🕌 Did you pray Maghrib?')
    expect(m.data).toMatchObject({
      kind: 'checkin', tag: 'checkin-maghrib-2026-10-30', prayer: 'maghrib', date: '2026-10-30',
      url: '/en/prayer?checkin=maghrib&d=2026-10-30',
    })
    for (const v of Object.values(m.data)) expect(typeof v).toBe('string')
    expect(m.webpush.notification).toEqual({ icon: '/i.png', tag: 'checkin-maghrib-2026-10-30' })
    expect(m.webpush.fcmOptions.link).toBe(m.data.url)
    expect(Number(m.webpush.headers.TTL)).toBeGreaterThan(0)
  })
})
