import { describe, it, expect } from 'vitest'
import { computeTimes, tzOffsetHours, CALC_METHODS } from '../../src/utils/prayCalc.js'
import { prayerCity, WORLD_PAGE_CITIES, citySlug, monthTable, methodOf } from '../../src/seo/prayerCity.js'
import { locationForCitySlug } from '../../src/utils/prayerLocation.js'

const mins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }
// aladhan.com /v1/timings, method=13 (Diyanet), 2026-11-14 — 2026-11-14 tarixində API-dən götürülüb
const ALADHAN = {
  London: { d: [2026, 11, 14], t: ['05:20', '07:10', '11:50', '13:55', '16:19', '18:03'] },
  'New York': { d: [2026, 12, 21], t: ['05:38', '07:10', '11:59', '14:18', '16:39', '18:05'] },
  Jakarta: { d: [2027, 6, 21], t: ['04:46', '05:54', '11:59', '15:20', '17:54', '18:58'] },
  Paris: { d: [2027, 6, 21], t: ['03:26', '05:40', '13:57', '18:14', '22:05', '00:11'] },
}
const K = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

describe('Dünya şəhərləri — Diyanət (aladhan 13) yerli hesabı', () => {
  it('aladhan nümunə dəyərləri ilə ±1 dəqiqə', () => {
    for (const [id, { d: [y, m, d], t }] of Object.entries(ALADHAN)) {
      const c = WORLD_PAGE_CITIES.find(x => x.id === id)
      const o = computeTimes({ year: y, month: m, day: d }, c.lat, c.lng, tzOffsetHours(c.tz, y, m, d), CALC_METHODS.diyanet)
      K.forEach((k, i) => { let x = mins(o[k]) - mins(t[i]); if (x > 720) x -= 1440; if (x < -720) x += 1440; expect(Math.abs(x), `${id} ${k}`).toBeLessThanOrEqual(1) })
    }
  })
  it('19 şəhər, slug-lar, metod seçimi; şimal şəhərləri (əsr fərqi) yoxdur', () => {
    expect(WORLD_PAGE_CITIES).toHaveLength(19)
    expect(prayerCity('new-york').id).toBe('New York')
    expect(prayerCity('moscow')).toBeNull()
    expect(prayerCity('berlin')).toBeNull()
    expect(methodOf(prayerCity('baku'))).toBe(CALC_METHODS.abubakr)
    expect(methodOf(prayerCity('london'))).toBe(CALC_METHODS.diyanet)
    expect(locationForCitySlug('istanbul').id).toBe('Istanbul')
    for (const c of WORLD_PAGE_CITIES) expect(citySlug(c)).toMatch(/^[a-z-]+$/)
    expect(monthTable(prayerCity('mecca'), 2027, 2)).toHaveLength(28)
  })
})
