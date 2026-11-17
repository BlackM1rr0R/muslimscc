import { describe, it, expect } from 'vitest'
import {
  qiblaBearing, hourLineAngle, maxHalfDay, hourLines, sunVec, tipPoint, asrHourAngle,
  asrCurve, asrMarks, gnomonSize, rayToRect, clockCorrection, hemi,
} from '../../src/utils/paperDial'
import { asrDay, shadowVec } from '../../src/utils/asrShadow'

const BAKU = { lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku' }
const SYD = { lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' }

describe('paperDial', () => {
  it('qiblə: Bakı ≈ 207°, London ≈ 119°', () => {
    expect(qiblaBearing(BAKU.lat, BAKU.lng)).toBeGreaterThan(206)
    expect(qiblaBearing(BAKU.lat, BAKU.lng)).toBeLessThan(208.5)
    expect(qiblaBearing(51.5074, -0.1278)).toBeCloseTo(118.99, 0)
  })

  it('saat xətləri: tan θ = sin φ · tan(15°·(h−12)), günorta 0, simmetrik, 6 və 18 — 90°', () => {
    expect(hourLineAngle(40, 12)).toBeCloseTo(0, 9)
    const th = hourLineAngle(40, 15)
    expect(Math.tan(th * Math.PI / 180)).toBeCloseTo(Math.sin(40 * Math.PI / 180) * Math.tan(45 * Math.PI / 180), 9)
    expect(hourLineAngle(40, 9)).toBeCloseTo(-th, 9)
    expect(hourLineAngle(40, 18)).toBeCloseTo(90, 9)
    expect(hourLineAngle(40, 5)).toBeLessThan(-90)
  })

  it('cənub yarımkürəsi güzgülənir: günortadan sonrakı saatlar solda', () => {
    expect(hemi(-30)).toBe(-1)
    expect(hourLineAngle(-30, 15)).toBeCloseTo(-hourLineAngle(30, 15), 9)
    expect(hourLineAngle(-30, 15)).toBeLessThan(0)
  })

  it('maxHalfDay: ekvator 90°, qütb dairəsindən o yana 180°', () => {
    expect(maxHalfDay(0)).toBeCloseTo(90, 6)
    expect(maxHalfDay(70)).toBe(180)
    expect(maxHalfDay(40)).toBeGreaterThan(105)
    const hs = hourLines(40).map(x => x.h)
    expect(hs).toContain(12)
    expect(hs).toContain(5)
    expect(hs).not.toContain(4)
  })

  it('qnomonun təpəsinin kölgəsi həmişə həmin saatın xəttinin üstündədir (hər iki yarımkürədə)', () => {
    for (const lat of [40, -33, 10]) {
      const g = gnomonSize(lat)
      expect(g.h / g.b).toBeCloseTo(Math.tan(Math.abs(lat) * Math.PI / 180), 9)
      for (const [dec, h] of [[0, 15], [20, 10], [-20, 14.5], [10, 16]]) {
        const p = tipPoint(lat, dec, 15 * (h - 12), g)
        if (!p) continue
        const ang = Math.atan2(p.x, p.y) * 180 / Math.PI
        expect(ang).toBeCloseTo(hourLineAngle(lat, h), 6)
      }
    }
  })

  it('günəş vektoru vahid uzunluqdadır; günorta kölgəsi qütbə tərəf, uzunluğu h·tan φ (bərabərlik günü)', () => {
    const v = sunVec(40, 10, 30)
    expect(Math.hypot(v.e, v.n, v.u)).toBeCloseTo(1, 12)
    const g = { b: 40, h: 30 }
    const p = tipPoint(40, 0, 0, g)
    expect(p.x).toBeCloseTo(0, 9)
    expect(p.y - g.b).toBeCloseTo(30 * Math.tan(40 * Math.PI / 180), 6)
    const q = tipPoint(-40, 0, 0, g)
    expect(q.y - g.b).toBeCloseTo(30 * Math.tan(40 * Math.PI / 180), 6)
  })

  it('əsr: kölgə = günorta kölgəsi + k × boy; asrShadow.js ilə ±3 dəq', () => {
    const day = asrDay(Date.UTC(2026, 5, 21), BAKU.lat, BAKU.lng)
    const sv = shadowVec(day.asr1, BAKU.lat, BAKU.lng)
    const H = asrHourAngle(BAKU.lat, 23.44, 1)
    const minutes = H * 4
    expect(Math.abs((day.asr1 - day.noon) / 60000 - minutes)).toBeLessThan(3)
    const g = { b: 1, h: 1 }
    for (const k of [1, 2]) {
      const Hk = asrHourAngle(40, 0, k)
      const p = tipPoint(40, 0, Hk, g)
      expect(Math.hypot(p.x, p.y - g.b)).toBeCloseTo(Math.tan(40 * Math.PI / 180) + k, 6)
    }
    expect(sv.len).toBeCloseTo(day.L0 + 1, 2)
    expect(asrHourAngle(40, 0, 2)).toBeGreaterThan(asrHourAngle(40, 0, 1))
  })

  it('əsr əyrisi və nişanları günortadan sonrakı tərəfdədir (şimalda sağ, cənubda sol)', () => {
    const gN = gnomonSize(40), gS = gnomonSize(-34)
    const n = asrCurve(40, 1, gN)
    expect(n.length).toBe(25)
    expect(n.every(p => p.x > 0)).toBe(true)
    expect(asrCurve(-34, 1, gS).every(p => p.x < 0)).toBe(true)
    expect(asrMarks(40, 2, gN).map(m => m.key)).toEqual(['jun', 'eq', 'dec'])
  })

  it('rayToRect: düzbucaqlının kənarına qədər', () => {
    expect(rayToRect(0, 0, 1, 0, [-5, -5, 10, 10])).toBeCloseTo(10)
    expect(rayToRect(0, 0, 0, -1, [-5, -5, 10, 10])).toBeCloseTo(5)
    expect(rayToRect(0, 0, Math.SQRT1_2, Math.SQRT1_2, [-5, -5, 10, 10])).toBeCloseTo(10 * Math.SQRT2)
  })

  it('saat düzəlişi: Bakı noyabrda ≈ +40 dəq uzunluq, vaxt tənliyi ≈ +15 dəq; cəm = uzunluq − tənlik', () => {
    const c = clockCorrection(BAKU, Date.UTC(2026, 10, 17, 8))
    expect(c.lon).toBeCloseTo(240 - BAKU.lng * 4, 6)
    expect(c.eot).toBeGreaterThan(14)
    expect(c.eot).toBeLessThan(16.5)
    expect(c.total).toBeCloseTo(c.lon - c.eot, 9)
    const s = clockCorrection(SYD, Date.UTC(2026, 1, 11, 2))
    expect(s.eot).toBeGreaterThan(-15)
    expect(s.eot).toBeLessThan(-13)
    expect(s.lon).toBeCloseTo(11 * 60 - SYD.lng * 4, 6)
  })
})
