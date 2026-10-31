// Namaz vaxtlarının yerli hesabı (src/utils/prayCalc.js) — Bakıdakı Əbu Bəkr
// məscidinin saytındakı cədvəllə (abu-bakr.com → "Namaz vaxtları", Bakı
// nöqtəsi 40.3953, 49.8822, UTC+4) dəqiqəsinədək eyni olmalıdır.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { computeTimes, tzOffsetHours, aladhanMethodQuery, METHOD_ABUBAKR } from '../../src/utils/prayCalc.js'

// Məscid cədvəlindən götürülüb: sübh, gün çıxır, zöhr, əsr, məğrib, işa
const MOSQUE = {
  '2026-10-31': '05:34 07:09 12:24 15:15 17:39 19:09',
  '2026-12-21': '06:19 08:00 12:38 14:59 17:17 18:47',
  '2027-03-15': '05:19 06:53 12:49 16:10 18:47 20:17',
  '2027-06-21': '03:01 05:10 12:42 16:42 20:14 21:44',
  '2026-08-01': '03:44 05:38 12:47 16:41 19:55 21:25',
}

describe('prayCalc — Əbu Bəkr məscidinin cədvəli', () => {
  for (const [date, expected] of Object.entries(MOSQUE)) {
    it(`Bakı ${date}`, () => {
      const [year, month, day] = date.split('-').map(Number)
      const t = computeTimes({ year, month, day }, 40.3953, 49.8822, 4)
      expect([t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].join(' ')).toBe(expected)
    })
  }

  it('işa həmişə məğribdən 90 dəqiqə sonradır', () => {
    for (let i = 0; i < 365; i += 7) {
      const d = new Date(Date.UTC(2027, 0, 1 + i))
      const t = computeTimes({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }, 40.3953, 49.8822, 4)
      const m = s => +s.slice(0, 2) * 60 + +s.slice(3)
      expect(m(t.isha) - m(t.maghrib)).toBe(90)
    }
  })

  it('Bakının saat qurşağı +4 (yay vaxtı yoxdur)', () => {
    expect(tzOffsetHours('Asia/Baku', 2027, 1, 15)).toBe(4)
    expect(tzOffsetHours('Asia/Baku', 2027, 7, 15)).toBe(4)
  })

  it('aladhan sorğusu: 99 → xüsusi parametrlər, digərləri — olduğu kimi', () => {
    expect(aladhanMethodQuery(METHOD_ABUBAKR)).toBe('method=99&methodSettings=18.5%2Cnull%2C90%20min')
    expect(aladhanMethodQuery(13)).toBe('method=13')
  })

  it('server/prayCalc.js — src/utils/prayCalc.js-in surəti ilə eyni nəticə', async () => {
    const { createRequire } = await import('node:module')
    const srv = createRequire(import.meta.url)('../../server/prayCalc.js')
    const a = srv.computeTimes({ year: 2027, month: 6, day: 21 }, 40.3953, 49.8822, 4)
    expect(a).toEqual(computeTimes({ year: 2027, month: 6, day: 21 }, 40.3953, 49.8822, 4))
    expect(readFileSync('server/prayCalc.js', 'utf8')).toContain('AVTOMATİK SURƏT')
  })
})
