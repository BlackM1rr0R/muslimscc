import { describe, it, expect } from 'vitest'
import {
  greatCircle, distanceKm, trackAt, qiblaFrom, horizonDip, tzOffsetMin, zonedToUtc, utcToZoned, parseDuration, parseLatLng,
  sunAltitude, hourAngle, flightEvents, SUNSET_ALT, methodKeyFor,
} from '../../src/utils/flightPrayer'
import { computeTimes, tzOffsetHours, CALC_METHODS } from '../../src/utils/prayCalc'
import { solarNoon } from '../../src/utils/rasdQibla'

const MIN = 60000
const LONDON = { lat: 51.5074, lng: -0.1278 }
const DUBAI = { lat: 25.2048, lng: 55.2708 }
const NYC = { lat: 40.7128, lng: -74.006 }
const BAKU = { lat: 40.3953, lng: 49.8822, tz: 'Asia/Baku' }
const hm = (ms, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms))
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }

describe('flightPrayer — böyük dairə', () => {
  it('uc nöqtələr və orta nöqtə', () => {
    const r = greatCircle(LONDON, NYC)
    expect(r(0).lat).toBeCloseTo(LONDON.lat, 6)
    expect(r(1).lng).toBeCloseTo(NYC.lng, 6)
    // London–Nyu-York böyük dairəsi şimala əyilir: ortası hər iki şəhərdən şimalda
    const mid = r(0.5)
    expect(mid.lat).toBeGreaterThan(LONDON.lat)
    // Orta nöqtə iki uca bərabər məsafədə
    expect(Math.abs(distanceKm(LONDON, mid) - distanceKm(mid, NYC))).toBeLessThan(1)
    expect(distanceKm(LONDON, NYC)).toBeGreaterThan(5540)
    expect(distanceKm(LONDON, NYC)).toBeLessThan(5590)
  })
  it('ekvator boyunca: enlik 0, uzunluq xətti dəyişir; istiqamət şərq', () => {
    const r = greatCircle({ lat: 0, lng: 0 }, { lat: 0, lng: 90 })
    expect(r(0.25).lat).toBeCloseTo(0, 6)
    expect(r(0.25).lng).toBeCloseTo(22.5, 4)
    expect(trackAt(r, 0.5)).toBeCloseTo(90, 2)
  })
  it('qiblə uçuş istiqamətinə görə (sağ — müsbət)', () => {
    // Ekvatorda şərqə uçarkən Kəbə şimal-şərqdə — sola
    const q = qiblaFrom({ lat: 0, lng: 0 }, 90)
    expect(q.bearing).toBeGreaterThan(0)
    expect(q.bearing).toBeLessThan(90)
    expect(q.rel).toBeLessThan(0)
    expect(qiblaFrom({ lat: 0, lng: 0 }, 0).rel).toBeGreaterThan(0)
  })
  it('11 km-də üfüq ~3° enir', () => {
    expect(horizonDip(11)).toBeGreaterThan(3)
    expect(horizonDip(11)).toBeLessThan(3.6)
  })
})

describe('flightPrayer — saat qurşaqları', () => {
  it('divar saatı → UTC (yay vaxtı daxil)', () => {
    expect(zonedToUtc('2026-07-01T12:00', 'America/New_York')).toBe(Date.UTC(2026, 6, 1, 16, 0))
    expect(zonedToUtc('2026-01-15T12:00', 'America/New_York')).toBe(Date.UTC(2026, 0, 15, 17, 0))
    expect(zonedToUtc('2026-03-29T03:30', 'Europe/London')).toBe(Date.UTC(2026, 2, 29, 2, 30)) // BST-in ilk günü
    expect(zonedToUtc('2026-11-17T10:00', 'Asia/Baku')).toBe(Date.UTC(2026, 10, 17, 6, 0))
    expect(Number.isNaN(zonedToUtc('bad', 'Asia/Baku'))).toBe(true)
  })
  it('UTC → divar saatı və geri', () => {
    const ms = Date.UTC(2026, 10, 17, 6, 0)
    expect(utcToZoned(ms, 'Asia/Baku')).toBe('2026-11-17T10:00')
    expect(utcToZoned(ms, 'America/New_York')).toBe('2026-11-17T01:00')
    expect(zonedToUtc(utcToZoned(ms, 'Asia/Kolkata'), 'Asia/Kolkata')).toBe(ms)
    expect(tzOffsetMin(ms, 'Asia/Kolkata')).toBe(330)
  })
  it('müddət və koordinat mətni', () => {
    expect(parseDuration('7:45')).toBe(465)
    expect(parseDuration('12')).toBe(720)
    expect(parseDuration('3.05')).toBe(185)
    expect(Number.isNaN(parseDuration('7:75'))).toBe(true)
    expect(parseLatLng('40.4, 49.9')).toEqual({ lat: 40.4, lng: 49.9 })
    expect(parseLatLng('Baku')).toBe(null)
    expect(methodKeyFor(99)).toBe('abubakr')
    expect(methodKeyFor(13)).toBe('diyanet')
  })
})

describe('flightPrayer — hadisələr', () => {
  it('şərqə uçuş günəşin batmasını kəsir: məğrib Günəşin −0.833° keçdiyi yerdə', () => {
    const depMs = Date.UTC(2026, 2, 20, 12, 0)
    const durMin = 420
    const ev = flightEvents({ from: LONDON, to: DUBAI, depMs, durMin })
    const mg = ev.find(e => e.kind === 'maghrib')
    expect(mg).toBeTruthy()
    expect(sunAltitude(mg.ms, mg.lat, mg.lng)).toBeCloseTo(SUNSET_ALT, 1)
    // Müstəqil yoxlama: dəqiqəbədəqiqə marşrutda hündürlüyün −0.833°-dən aşağı düşdüyü ilk an
    const r = greatCircle(LONDON, DUBAI)
    let cross = null
    for (let m = 0; m <= durMin; m++) {
      const p = r(m / durMin), a = sunAltitude(depMs + m * MIN, p.lat, p.lng)
      if (a < SUNSET_ALT) { cross = m; break }
    }
    expect(cross).not.toBe(null)
    expect(Math.abs(mg.elapsedMin - cross)).toBeLessThanOrEqual(1)
    // Şərqə uçan təyyarədə günəş London yerdə olduğundan tez batır
    const londonSunset = (() => { for (let t = depMs; ; t += MIN) if (sunAltitude(t, LONDON.lat, LONDON.lng) < SUNSET_ALT) return t })()
    expect(mg.ms).toBeLessThan(londonSunset)
    // Əbu Bəkr metodu: işa = məğrib + 90 dəq (uçuş ərzindədirsə)
    const isha = ev.find(e => e.kind === 'isha')
    expect(isha.ms - mg.ms).toBe(90 * MIN)
  })
  it('zöhr — həqiqi günorta (meridian boyunca uçuşda rasdQibla.solarNoon ilə eyni)', () => {
    const lng = 31.2357
    const depMs = Date.UTC(2026, 5, 21, 7, 0)
    const ev = flightEvents({ from: { lat: 30, lng }, to: { lat: 50, lng }, depMs, durMin: 300 })
    const dh = ev.find(e => e.kind === 'dhuhr')
    expect(dh).toBeTruthy()
    expect(Math.abs(dh.ms - solarNoon(Date.UTC(2026, 5, 21), lng))).toBeLessThan(MIN)
    expect(Math.abs(hourAngle(dh.ms, dh.lng))).toBeLessThan(0.05)
  })
  it('yerində duran "uçuş" (Bakı, 24 saat) saytın cədvəli ilə ±2 dəq üst-üstə düşür', () => {
    for (const [key, date] of [['abubakr', [2026, 6, 21]], ['diyanet', [2026, 12, 21]], ['abubakr', [2027, 3, 20]]]) {
      const [y, m, d] = date
      const method = CALC_METHODS[key]
      const tzH = tzOffsetHours(BAKU.tz, y, m, d)
      const depMs = Date.UTC(y, m - 1, d) - tzH * 3600000 // yerli gecəyarısı
      const ev = flightEvents({ from: BAKU, to: BAKU, depMs, durMin: 24 * 60 - 1, method })
      const ref = computeTimes({ year: y, month: m, day: d }, BAKU.lat, BAKU.lng, tzH, method)
      for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
        const e = ev.find(x => x.kind === k)
        expect(e, `${key} ${k}`).toBeTruthy()
        expect(Math.abs(toMin(hm(e.ms, BAKU.tz)) - toMin(ref[k])), `${key} ${k}`).toBeLessThanOrEqual(2)
      }
    }
  })
  it('Hənəfi əsri (2×) Şafii əsrindən sonra gəlir', () => {
    const depMs = Date.UTC(2026, 5, 21, 4, 0)
    const a1 = flightEvents({ from: BAKU, to: BAKU, depMs, durMin: 900 }).find(e => e.kind === 'asr')
    const a2 = flightEvents({ from: BAKU, to: BAKU, depMs, durMin: 900, asrFactor: 2 }).find(e => e.kind === 'asr')
    expect(a2.ms - a1.ms).toBeGreaterThan(30 * MIN)
  })
  it('hadisələr zamana görə sıralıdır və uçuşun içindədir', () => {
    const depMs = Date.UTC(2026, 10, 17, 18, 0)
    const ev = flightEvents({ from: NYC, to: DUBAI, depMs, durMin: 12 * 60 + 30 })
    expect(ev.length).toBeGreaterThan(2)
    for (let i = 1; i < ev.length; i++) expect(ev[i].ms).toBeGreaterThanOrEqual(ev[i - 1].ms)
    for (const e of ev) { expect(e.elapsedMin).toBeGreaterThanOrEqual(0); expect(e.elapsedMin).toBeLessThanOrEqual(750) }
  })
})
