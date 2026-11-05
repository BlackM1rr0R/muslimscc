// Günəşin mövqeyi və azan anları (utils/solar) — saytın namaz hesabı ilə tutuşdurulur
import { describe, it, expect } from 'vitest'
import { subsolar, sunAltitude, adhanAt } from '../../src/utils/solar.js'
import { computeTimes } from '../../src/utils/prayCalc.js'

const utc = (y, m, d, hm) => { const [h, mi] = hm.split(':').map(Number); return Date.UTC(y, m - 1, d, h, mi) }

describe('solar', () => {
  it('yay gündönümündə günəş Xərçəng tropikinin üstündədir, UTC günorta — Qrinviç yaxınlığında', () => {
    const [lng, lat] = subsolar(Date.UTC(2026, 5, 21, 12, 0))
    expect(lat).toBeCloseTo(23.44, 0)
    expect(Math.abs(lng)).toBeLessThan(2)
  })
  it('Bakı: saytın hesabladığı məğrib anında günəş üfüqdədir, adhanAt → maghrib', () => {
    const t = computeTimes({ year: 2026, month: 11, day: 5 }, 40.3953, 49.8822, 0) // UTC saatı ilə
    const ms = utc(2026, 11, 5, t.maghrib)
    expect(Math.abs(sunAltitude(ms, 40.3953, 49.8822) + 0.833)).toBeLessThan(0.5)
    expect(adhanAt(ms, 40.3953, 49.8822)).toBe('maghrib')
    expect(adhanAt(utc(2026, 11, 5, t.dhuhr), 40.3953, 49.8822)).toBe('dhuhr')
    expect(adhanAt(ms + 3 * 3600000, 40.3953, 49.8822)).toBeNull()
  })
})
