// İbn Bəttutənin səyahəti (src/data/ibnBattuta.js) — məlumatın sağlamlığı
import { describe, it, expect } from 'vitest'
import { IBN_BATTUTA_STOPS as STOPS, IBN_BATTUTA_CUM_KM as CUM, IBN_BATTUTA_TOTAL_KM, greatCircleKm } from '../../src/data/ibnBattuta.js'

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

describe('İbn Bəttutə — dayanacaqlar', () => {
  it('Təncədə 1325-də başlayır, Fəsdə 1354-də bitir', () => {
    expect(STOPS[0].place).toBe('tangier')
    expect(STOPS[0].year).toBe(1325)
    expect(STOPS.at(-1).place).toBe('fez')
    expect(STOPS.at(-1).year).toBe(1354)
  })

  it('illər azalmır və 1325–1354 aralığındadır', () => {
    for (let i = 0; i < STOPS.length; i++) {
      const s = STOPS[i]
      expect(Number.isInteger(s.year)).toBe(true)
      expect(s.year).toBeGreaterThanOrEqual(1325)
      expect(s.year).toBeLessThanOrEqual(1354)
      expect(typeof s.approx).toBe('boolean')
      if (i > 0) expect(s.year).toBeGreaterThanOrEqual(STOPS[i - 1].year)
    }
  })

  it('koordinatlar düzgündür', () => {
    for (const s of STOPS) {
      expect(Number.isFinite(s.lat) && Math.abs(s.lat) <= 90).toBe(true)
      expect(Number.isFinite(s.lon) && Math.abs(s.lon) <= 180).toBe(true)
    }
    // ardıcıl dayanacaqlar eyni yer deyil
    for (let i = 1; i < STOPS.length; i++) expect(STOPS[i].place).not.toBe(STOPS[i - 1].place)
  })

  it('hər dayanacağın 5 dildə adı və qeydi var', () => {
    for (const s of STOPS) {
      for (const l of LANGS) {
        expect(s.name[l], `${s.place} name.${l}`).toBeTruthy()
        expect(s.note[l]?.length, `${s.place} note.${l}`).toBeGreaterThan(10)
      }
    }
  })

  it('mübahisəli dayanacaqlar yoxdur (Pekin, Bulqar)', () => {
    const names = STOPS.map(s => s.name.en.toLowerCase()).join('|')
    expect(names).not.toMatch(/beijing|khanbaliq|bulghar|bolghar/)
  })

  it('düz xətt üzrə yol uzunluğu inandırıcıdır', () => {
    // Təncə — Qahirə ≈ 3 400 km
    const tangier = STOPS[0], cairo = STOPS.find(s => s.place === 'cairo')
    expect(greatCircleKm(tangier, cairo)).toBeGreaterThan(3200)
    expect(greatCircleKm(tangier, cairo)).toBeLessThan(3600)
    expect(CUM).toHaveLength(STOPS.length)
    expect(CUM[0]).toBe(0)
    for (let i = 1; i < CUM.length; i++) expect(CUM[i]).toBeGreaterThan(CUM[i - 1])
    const total = CUM.at(-1)
    // düz xətt həmişə həqiqi yoldan (Dunn: ≈117 000 km) qısadır, amma yer kürəsinin bir neçə dövrəsi qədərdir
    expect(total).toBeGreaterThan(50000)
    expect(total).toBeLessThan(IBN_BATTUTA_TOTAL_KM)
  })
})
