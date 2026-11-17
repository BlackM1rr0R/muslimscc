import { describe, it, expect } from 'vitest'
import {
  MEDINA, medinaDate, medinaMidnight, medinaMinutes, dateKey, parseDateKey, fmtHM,
  medinaSunDay, openFraction, phaseOf, sunAt, skyColor, lightLevels, umbrellaGrid, ribAngle, canopyPositions, canopyIndex,
} from '../../src/utils/nabawiUmbrellas'
import { computeTimes } from '../../src/utils/prayCalc'

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }
const lum = (h) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255) }

describe('nabawiUmbrellas', () => {
  it('Mədinə vaxtı UTC+3: tarix, gecəyarısı, dəqiqə', () => {
    const ms = Date.UTC(2026, 5, 20, 22, 30) // Mədinədə 21 iyun 01:30
    expect(medinaDate(ms)).toEqual({ y: 2026, m: 6, d: 21 })
    expect(medinaMinutes(ms)).toBe(90)
    expect(medinaMidnight({ y: 2026, m: 6, d: 21 })).toBe(Date.UTC(2026, 5, 20, 21))
    expect(dateKey({ y: 2026, m: 3, d: 5 })).toBe('2026-03-05')
    expect(parseDateKey('2026-03-05')).toEqual({ y: 2026, m: 3, d: 5 })
    expect(parseDateKey('x')).toBeNull()
    expect(fmtHM(0)).toBe('00:00')
    expect(fmtHM(1439.6)).toBe('00:00')
    expect(fmtHM(19 * 60 + 7)).toBe('19:07')
  })

  it('günəşin çıxışı/batışı saytın namaz cədvəli ilə (prayCalc) ±2 dəq üst-üstə düşür', () => {
    for (const [y, m, d] of [[2026, 6, 21], [2026, 12, 21], [2027, 3, 20]]) {
      const day = medinaSunDay({ y, m, d })
      const ref = computeTimes({ year: y, month: m, day: d }, MEDINA.lat, MEDINA.lng, 3)
      expect(Math.abs(day.riseMin - toMin(ref.sunrise))).toBeLessThanOrEqual(2)
      expect(Math.abs(day.setMin - toMin(ref.maghrib))).toBeLessThanOrEqual(2)
      expect(day.riseMin).toBeGreaterThan(4.5 * 60)
      expect(day.setMin).toBeLessThan(19.5 * 60)
    }
  })

  it('açılma payı: gecə 0, günorta 1, çıxışdan 10 dəq sonra ~yarı, batışda 0', () => {
    const day = medinaSunDay({ y: 2026, m: 11, d: 17 })
    expect(openFraction(120, day)).toBe(0)
    expect(openFraction(day.noonMin, day)).toBe(1)
    expect(openFraction(day.riseMin + 10, day)).toBeCloseTo(0.5, 5)
    expect(openFraction(day.riseMin + 25, day)).toBe(1)
    expect(openFraction(day.setMin, day)).toBe(0)
    expect(openFraction(day.setMin - 10, day)).toBeCloseTo(0.5, 5)
    expect(phaseOf(60, day)).toBe('closed')
    expect(phaseOf(day.riseMin + 5, day)).toBe('opening')
    expect(phaseOf(day.noonMin, day)).toBe('open')
    expect(phaseOf(day.setMin - 5, day)).toBe('closing')
    expect(openFraction(600, { riseMin: null, setMin: null })).toBe(0)
  })

  it('günəş vektoru vahid uzunluqdadır; günorta cənubda və yuxarıda', () => {
    const day = medinaSunDay({ y: 2026, m: 12, d: 21 })
    const s = sunAt(day.noon)
    expect(Math.hypot(...s.vec)).toBeCloseTo(1, 6)
    expect(s.alt).toBeGreaterThan(40)
    expect(s.vec[2]).toBeGreaterThan(0) // cənub = +z
    const morning = sunAt(day.sunrise + 3600000)
    expect(morning.vec[0]).toBeGreaterThan(0) // şərq = +x
  })

  it('göyün rəngi və işıq', () => {
    expect(skyColor(-30)).toMatch(/^#[0-9a-f]{6}$/)
    expect(lum(skyColor(-30))).toBeLessThan(lum(skyColor(50)))
    expect(lum(skyColor(-5))).toBeLessThan(lum(skyColor(2)))
    expect(lightLevels(-5).sun).toBe(0)
    expect(lightLevels(40).sun).toBeGreaterThan(2)
    expect(lightLevels(-20).ambient).toBeLessThan(lightLevels(40).ambient)
  })

  it('çətir şəbəkəsi mərkəzlənib; qabırğa bucağı açıldıqca artır', () => {
    const g = umbrellaGrid(3, 4, 10)
    expect(g).toHaveLength(12)
    expect(g.reduce((s, p) => s + p.x, 0)).toBeCloseTo(0)
    expect(g.reduce((s, p) => s + p.z, 0)).toBeCloseTo(0)
    expect(ribAngle(0)).toBeLessThan(ribAngle(0.5))
    expect(ribAngle(1)).toBeLessThan(Math.PI / 2)
    expect(ribAngle(2)).toBe(ribAngle(1))
  })
})

describe('canopyPositions', () => {
  it('açıq örtük planda kvadratdır, yığılı örtük sütun boyunca sallanır', () => {
    const S = 6, A = 3, M = 24
    const open = canopyPositions(1, 7, S, A)
    expect(open.length).toBe((1 + S * M) * 3)
    // xarici halqanın künc nöqtəsi (φ = 45°, k = A) — üfüqi məsafə ≈ 7·√2·sin(θ)
    const at = (p, j, k) => { const i = (1 + (j - 1) * M + k) * 3; return [p[i], p[i + 1], p[i + 2]] }
    const c = at(open, S, A)
    expect(Math.hypot(c[0], c[2])).toBeCloseTo(7 * Math.SQRT2 * Math.sin(ribAngle(1)), 3)
    const closed = canopyPositions(0, 7, S, A)
    const cc = at(closed, S, A)
    expect(Math.hypot(cc[0], cc[2])).toBeLessThan(1.5)
    expect(cc[1]).toBeLessThan(-9)
    const idx = canopyIndex(S, A)
    expect(idx.length).toBe(M * 3 + (S - 1) * M * 6)
    expect(Math.max(...idx)).toBe(S * M)
  })
})
