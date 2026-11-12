import { describe, it, expect } from 'vitest'
import { fastLength, fastingGrid, ramadanDays } from '../../src/utils/fastingMap'

const day = (y, m, d) => Date.UTC(y, m - 1, d)
describe('oruc müddəti', () => {
  it('Məkkə, mart 2025 — ~13.5 saat', () => {
    const f = fastLength(day(2025, 3, 10), 21.42, 39.83)
    expect(f.hours).toBeGreaterThan(13); expect(f.hours).toBeLessThan(14)
  })
  it('Bakı yayda daha uzun, qışda qısa', () => {
    const s = fastLength(day(2026, 6, 21), 40.41, 49.87).hours, w = fastLength(day(2026, 12, 21), 40.41, 49.87).hours
    expect(s).toBeGreaterThan(17); expect(w).toBeLessThan(12)
  })
  it('Oslo iyunda — sübh əlaməti yoxdur; Tromsø — qütb günü', () => {
    expect(fastLength(day(2026, 6, 21), 59.91, 10.75).kind).toBe('noFajr')
    expect(fastLength(day(2026, 6, 21), 69.65, 18.96).kind).toBe('polarDay')
  })
  it('şəbəkə ölçüsü və növləri', () => {
    const g = fastingGrid(day(2026, 6, 21), 6)
    expect(g.hours.length).toBe(g.rows * g.cols)
    expect([...g.kinds].some(k => k === 1)).toBe(true)
  })
  it('Ramazan günləri: 29–30 gün, ardıcıl', () => {
    const r = ramadanDays(new Date(2026, 10, 12))
    expect(r.year).toBe(1448)
    expect([29, 30]).toContain(r.days.length)
    expect(r.days[1].dayStart - r.days[0].dayStart).toBe(86400000)
    expect(new Date(r.days[0].dayStart).getUTCFullYear()).toBe(2027)
  })
})
