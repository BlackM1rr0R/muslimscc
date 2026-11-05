// Hərfi barmaqla yazma (utils/traceScore) — örtük, kənara çıxma, ulduzlar
import { describe, it, expect } from 'vitest'
import { traceScore, dilate, starsFor } from '../../src/utils/traceScore.js'

const W = 10
const mask = (cells) => { const m = new Uint8Array(W * W); cells.forEach(([x, y]) => { m[y * W + x] = 1 }); return m }
const line = (y, x0, x1) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y])

describe('traceScore', () => {
  const glyph = mask(line(5, 2, 7))
  const near = dilate(glyph, W, W, 1)
  it('dəqiq üstündən yazmaq — 3 ulduz', () => {
    const r = traceScore(glyph, near, mask(line(5, 2, 7)))
    expect(r.coverage).toBe(1); expect(r.spill).toBe(0); expect(r.stars).toBe(3)
  })
  it('bütün sahəni rəngləmək — çox kənara çıxır, ulduz yoxdur', () => {
    const all = new Uint8Array(W * W).fill(1)
    const r = traceScore(glyph, near, all)
    expect(r.coverage).toBe(1); expect(r.spill).toBeGreaterThan(0.6); expect(r.stars).toBe(0)
  })
  it('yarısı — az ulduz; boş — 0', () => {
    expect(traceScore(glyph, near, mask(line(5, 2, 4))).stars).toBe(1)
    expect(traceScore(glyph, near, new Uint8Array(W * W)).stars).toBe(0)
  })
  it('dilate qonşu xanaları əhatə edir', () => {
    const d = dilate(mask([[5, 5]]), W, W, 1)
    expect(d.reduce((a, b) => a + b, 0)).toBe(9)
    expect(starsFor(0.85, 0.1)).toBe(3)
  })
})
