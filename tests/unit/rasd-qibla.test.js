import { describe, it, expect } from 'vitest'
import { rasdEvents, bearing, shadowAt, KAABA } from '../../src/utils/rasdQibla'

const utc = (ms) => new Date(ms).toISOString()
describe('Rəsdül-qiblə', () => {
  const ev = rasdEvents(Date.UTC(2027, 0, 1), 365)
  it('ildə 2 dəfə Kəbənin üstündə: ~28 may 09:18 UT və ~16 iyul 09:27 UT', () => {
    const over = ev.filter(e => e.kind === 'over')
    expect(over.length).toBe(2)
    const [may, jul] = over
    expect(utc(may.ms)).toMatch(/^2027-05-2[78]T09:1[2-9]/)
    expect(utc(jul.ms)).toMatch(/^2027-07-1[56]T09:(2|3)/)
    expect(may.alt).toBeGreaterThan(89.6)
  })
  it('antipod: noyabr və yanvar', () => {
    const under = ev.filter(e => e.kind === 'under').map(e => new Date(e.ms).getUTCMonth())
    expect(under.sort()).toEqual([0, 10])
  })
  it('o anda Bakıda kölgə qiblənin əksinədir (±1°)', () => {
    const may = ev.find(e => e.kind === 'over')
    const baku = { lat: 40.41, lng: 49.87 }
    const sh = shadowAt(may.ms, baku.lat, baku.lng)
    const q = bearing(baku, KAABA)
    const diff = Math.abs((((sh.dir - (q + 180)) % 360) + 540) % 360 - 180)
    expect(diff).toBeLessThan(1)
  })
  it('istiqamət: Bakıdan qiblə ~ 207°', () => {
    expect(bearing({ lat: 40.41, lng: 49.87 }, KAABA)).toBeGreaterThan(205)
    expect(bearing({ lat: 40.41, lng: 49.87 }, KAABA)).toBeLessThan(209)
  })
})
