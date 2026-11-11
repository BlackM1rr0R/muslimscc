import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { SKY_BODIES, siriusNow } from '../../src/data/quranSky'
import { horizontal } from '../../src/utils/lunar'

const q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ '
describe('Quranın səması — ayə mətnləri Osmani nəşri ilə eynidir', () => {
  for (const b of SKY_BODIES) {
    for (const [ref, ar] of b.ayahs) {
      it(`${b.id} ${ref}`, () => {
        const [s, n] = ref.split(':').map(Number)
        expect(q.ayahs[s - 1][n - 1].replace(BASMALA, '').normalize('NFC')).toBe(ar.normalize('NFC'))
        expect(ar).toContain(b.ar.replace('ال', 'ٱل').slice(0, 2))
      })
    }
  }
  it('hər cismin adı ayədə keçir', () => {
    const plain = (x) => x.replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/ٱ/g, 'ا')
    for (const b of SKY_BODIES) expect(b.ayahs.some(([, ar]) => plain(ar).includes(b.ar))).toBe(true)
  })
})
describe('Sirius mövqeyi', () => {
  it('Bakı, 2026-01-15 22:00 UT — meridiandan ~2 saat sonra: cənub-qərbdə (~216°), ~28° hündürlükdə', () => {
    const ms = Date.UTC(2026, 0, 15, 22, 0)
    const s = siriusNow(new Date(ms))
    const h = horizontal(s.ra, s.dec, ms, 40.41, 49.87)
    expect(h.alt).toBeGreaterThan(20); expect(h.alt).toBeLessThan(36)
    expect(h.az).toBeGreaterThan(175); expect(h.az).toBeLessThan(225)
  })
})
