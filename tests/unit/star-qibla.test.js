import { describe, it, expect } from 'vitest'
import { precess, starHorizontal, qiblaBearing, crossings, polarisTurn, bestNow, domeXY, MIN_ALT, MAX_ALT } from '../../src/utils/starQibla.js'
import { BRIGHT_STARS } from '../../src/data/brightStars.js'
import { STAR_AYAHS } from '../../src/data/starAyahs.js'
import fs from 'node:fs'

const BAKU = { lat: 40.4093, lng: 49.8671 }
const star = (id) => BRIGHT_STARS.find(s => s.id === id)

describe('Ulduzlarla qiblə', () => {
  it('presessiya — Meeus, nümunə 21.b (θ Persei, 2028-11-13.19)', () => {
    const ms = (2462088.69 - 2440587.5) * 86400000
    const p = precess(41.054063, 49.227750, ms)
    expect(p.ra).toBeCloseTo(41.547214, 4)
    expect(p.dec).toBeCloseTo(49.348483, 4)
  })
  it('Bakının qiblə bucağı ~207°', () => {
    expect(qiblaBearing(BAKU.lat, BAKU.lng)).toBeGreaterThan(206.5)
    expect(qiblaBearing(BAKU.lat, BAKU.lng)).toBeLessThan(208)
  })
  it('Qütb ulduzu: şimalda, hündürlüyü ≈ coğrafi en', () => {
    const p = starHorizontal(star('polaris'), Date.UTC(2026, 10, 13, 18), BAKU.lat, BAKU.lng)
    expect(Math.abs(p.alt - BAKU.lat)).toBeLessThan(1.2)
    expect(Math.min(p.az, 360 - p.az)).toBeLessThan(1.2)
  })
  it('Qütb ulduzu üsulu qiblə bucağını verir (arxaya al + dön)', () => {
    const ms = Date.UTC(2026, 10, 13, 18)
    const r = polarisTurn(ms, BAKU.lat, BAKU.lng)
    expect(r.visible).toBe(true)
    expect(r.face).toBe('back')
    expect(r.turn).toBe('right')
    expect(r.deg).toBeGreaterThanOrEqual(26)
    expect(r.deg).toBeLessThanOrEqual(28)
    expect(polarisTurn(ms, -33.87, 151.21).visible).toBe(false)   // Sidney
  })
  it('qiblədən keçidlər: vaxt sırası, qaranlıq və yararlı hündürlük, azimut = qiblə', () => {
    const from = Date.UTC(2026, 10, 13, 14)
    const cs = crossings(from, BAKU.lat, BAKU.lng, 15)
    expect(cs.length).toBeGreaterThan(2)
    const q = qiblaBearing(BAKU.lat, BAKU.lng)
    for (let i = 0; i < cs.length; i++) {
      if (i) expect(cs[i].ms).toBeGreaterThanOrEqual(cs[i - 1].ms)
      expect(cs[i].alt).toBeGreaterThanOrEqual(MIN_ALT)
      expect(cs[i].alt).toBeLessThanOrEqual(MAX_ALT)
      const p = starHorizontal(cs[i].star, cs[i].ms, BAKU.lat, BAKU.lng)
      expect(Math.abs(((p.az - q + 540) % 360) - 180)).toBeLessThan(0.5)
    }
    expect(cs.some(c => c.star.id === 'sirius')).toBe(true)
  })
  it('ən yaxşı ulduz — qiblədən ±20° daxilində', () => {
    const b = bestNow(Date.UTC(2026, 10, 13, 18), BAKU.lat, BAKU.lng)
    expect(b).not.toBeNull()
    expect(Math.abs(b.off)).toBeLessThanOrEqual(20)
  })
  it('qübbə: qiblə yuxarıda, zenit mərkəzdə', () => {
    const p = domeXY(0, 207, 207, 100)
    expect(p.x).toBeCloseTo(0, 6); expect(p.y).toBeCloseTo(-100, 6)
    expect(domeXY(90, 10, 207, 100).y).toBeCloseTo(0, 6)
  })
  it('kataloq: 27 ulduz, ad və koordinatlar düzgün aralıqda', () => {
    expect(BRIGHT_STARS).toHaveLength(27)
    for (const s of BRIGHT_STARS) {
      expect(s.ra).toBeGreaterThanOrEqual(0); expect(s.ra).toBeLessThan(360)
      expect(Math.abs(s.dec)).toBeLessThanOrEqual(90)
      expect(s.name.en && s.name.ru).toBeTruthy()
    }
    expect(star('sirius').ra).toBeCloseTo(101.287, 2)
    expect(star('sirius').dec).toBeCloseTo(-16.716, 2)
  })
  it('ayələr Osmani mətnindən hərfi-hərfinə (53:49 — əş-Şiʿrā)', () => {
    const uth = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
    const ar = JSON.parse(fs.readFileSync('public/data/star-ayahs/ar.json', 'utf8')).ar
    const az = JSON.parse(fs.readFileSync('public/data/star-ayahs/az.json', 'utf8')).tr
    const azEd = JSON.parse(fs.readFileSync('seo-data/quran/az.mammadaliyev.json', 'utf8'))
    for (const { ref } of STAR_AYAHS) {
      const [s, a] = ref.split(':').map(Number)
      expect(ar[ref]).toBe(uth.ayahs[s - 1][a - 1])
      expect(az[ref]).toBe(azEd.ayahs[s - 1][a - 1])
    }
    expect(ar['53:49'].replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/ٱ/g, 'ا')).toContain('الشعرى')
    expect(fs.readdirSync('public/data/star-ayahs')).toHaveLength(50)
  })
})
