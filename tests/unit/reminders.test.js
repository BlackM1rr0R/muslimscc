// Server: səhər/axşam zikri və Cümə xatırlatmasının saf köməkçiləri (server/reminders.js)
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const r = require('../../server/reminders.js')
const { LANGS } = require('../../server/prayer-utils.js')

const TIMES = { fajr: '05:12', dhuhr: '12:20', asr: '14:58', maghrib: '17:10', isha: '18:40' }

describe('vaxt', () => {
  it('addMinutes — saat keçidi və gecə yarısı sərhədi', () => {
    expect(r.addMinutes('05:45', 30)).toBe('06:15')
    expect(r.addMinutes('23:50', 30)).toBeNull()
    expect(r.addMinutes('xx', 30)).toBeNull()
  })
  it('səhər — sübhdən 30 dəq sonra, axşam — əsrdən 30 dəq sonra', () => {
    expect(r.dueReminders(TIMES, '05:42')).toEqual(['morning'])
    expect(r.dueReminders(TIMES, '15:28')).toEqual(['evening'])
    expect(r.dueReminders(TIMES, '05:12')).toEqual([])
  })
  it('cümə — yalnız cümə günü 09:00', () => {
    expect(r.dueReminders(TIMES, '09:00', { friday: true })).toEqual(['jumuah'])
    expect(r.dueReminders(TIMES, '09:00', { friday: false })).toEqual([])
    expect(r.dueReminders(TIMES, '09:00', { friday: true, jumuah: false })).toEqual([])
  })
  it('normFlag — yalnız true', () => {
    expect([true, 'true', 1, undefined].map(r.normFlag)).toEqual([true, false, false, false])
  })
})

describe('mesaj', () => {
  it('hər dil və növ üçün mətn var; link dil prefiksi ilə', () => {
    for (const l of LANGS) for (const k of r.KINDS) {
      const m = r.buildReminderMessage(l, k, '2026-11-13')
      expect(m.notification.title.length).toBeGreaterThan(3)
      expect(m.data.url).toBe(k === 'jumuah' ? `${l === 'az' ? '' : '/' + l}/quran/18` : `${l === 'az' ? '' : '/' + l}/hisnul-muslim#adhkar`)
    }
  })
  it('naməlum dil → az; naməlum növ → null', () => {
    expect(r.buildReminderMessage('xx', 'morning', '2026-11-13').data.url).toBe('/hisnul-muslim#adhkar')
    expect(r.buildReminderMessage('az', 'nope', '2026-11-13')).toBeNull()
  })
})
