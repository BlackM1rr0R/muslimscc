// Namaz səması (PrayerSky → skyState) və günəş saatı (SunDial → minToDeg)
import { describe, it, expect } from 'vitest'
import { skyState } from '../../src/components/prayer/PrayerSky.jsx'
import { minToDeg } from '../../src/components/prayer/SunDial.jsx'

const T = { fajr: '05:38', sunrise: '07:13', dhuhr: '12:24', asr: '15:11', maghrib: '17:34', isha: '19:04' }
const at = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m }

describe('skyState — dövrlər', () => {
  it.each([
    ['02:00', 'night'], ['05:38', 'dawn'], ['07:00', 'dawn'], ['07:13', 'morning'],
    ['12:30', 'noon'], ['15:11', 'afternoon'], ['16:53', 'afternoon'], ['16:54', 'sunset'],
    ['17:50', 'sunset'], ['17:54', 'dusk'], ['19:04', 'night'], ['23:59', 'night'],
  ])('%s → %s', (hm, period) => {
    expect(skyState(T, at(hm)).period).toBe(period)
  })

  it('günəş: çıxanda solda, günortada yuxarıda, məğribdə sağda; gecə görünmür', () => {
    expect(skyState(T, at('07:13')).sunP).toBeCloseTo(0, 5)
    expect(skyState(T, at('17:34')).sunP).toBeCloseTo(1, 5)
    expect(skyState(T, at('12:23')).sunP).toBeGreaterThan(0.45)
    expect(skyState(T, at('12:23')).sunUp).toBe(true)
    expect(skyState(T, at('23:00')).sunUp).toBe(false)
  })

  it('ay yalnız gecə; gecə yarısını keçəndə də mövqe 0..1', () => {
    expect(skyState(T, at('12:00')).moonUp).toBe(false)
    const late = skyState(T, at('01:00'))
    expect(late.moonUp).toBe(true)
    expect(late.moonP).toBeGreaterThan(0.4)
    expect(late.moonP).toBeLessThan(1)
  })

  it('vaxt və ya saat yoxdursa — null (heç nə çəkilmir)', () => {
    expect(skyState({}, 600)).toBeNull()
    expect(skyState(T, null)).toBeNull()
  })
})

describe('minToDeg — gecə yarısı aşağıda, günorta yuxarıda', () => {
  it('əsas nöqtələr', () => {
    expect(minToDeg(0)).toBe(180)
    expect(minToDeg(720)).toBe(0)
    expect(minToDeg(360)).toBe(270)   // 06:00 — solda
    expect(minToDeg(1080)).toBe(90)   // 18:00 — sağda
  })
})
