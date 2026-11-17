// Ad tuğrası — saf həndəsə və köməkçilər (src/utils/tughra.js)
import { describe, it, expect } from 'vitest'
import {
  BOX_H, BOX_W, SCHEMES, cubic, fileName, nibWidth, placeBox, ribbon, samplePath, schemeById, splitSere, tughraGeometry,
} from '../../src/utils/tughra.js'
import { toArabic } from '../../src/utils/arabicName.js'

const P = (x, y) => ({ x, y })

describe('tughra geometry', () => {
  it('cubic hits endpoints', () => {
    const s = [P(0, 0), P(10, 0), P(20, 10), P(30, 30)]
    expect(cubic(...s, 0)).toEqual(P(0, 0))
    expect(cubic(...s, 1)).toEqual(P(30, 30))
  })

  it('samplePath joins segments without duplicate points', () => {
    const a = [P(0, 0), P(10, 0), P(20, 0), P(30, 0)]
    const b = [P(30, 0), P(40, 0), P(50, 0), P(60, 0)]
    const pts = samplePath([a, b], 5)
    expect(pts[0]).toEqual(P(0, 0))
    expect(pts[pts.length - 1]).toEqual(P(60, 0))
    for (let i = 1; i < pts.length; i++) expect(pts[i].x).toBeGreaterThan(pts[i - 1].x)
  })

  it('ribbon edges are offset by half the width', () => {
    const pts = [P(0, 0), P(10, 0), P(20, 0)]
    const { left, right } = ribbon(pts, () => 8)
    left.forEach((p, i) => expect(Math.abs(p.y - right[i].y)).toBeCloseTo(8))
  })

  it('nib width tapers at the ends and stays positive', () => {
    const w = nibWidth(20)
    expect(w(0, 0)).toBeGreaterThan(0)
    expect(w(0.5, 0)).toBeGreaterThan(w(0, 0))
    expect(w(0.5, 0)).toBeLessThanOrEqual(20)
  })

  it('composition has 3 staffs, 3 flags, two loops; all inside the box', () => {
    const g = tughraGeometry()
    expect(g.staffs).toHaveLength(3)
    expect(g.flags).toHaveLength(3)
    const all = [...g.outer, ...g.inner, ...g.flags].flat()
    for (const p of all) {
      expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(BOX_W)
      expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(BOX_H)
    }
    // ilmələr solda, kollar sağda
    expect(Math.min(...g.outer.flat().map(p => p.x))).toBeLessThan(200)
    expect(g.outer[0][0].x).toBeGreaterThan(900)
    // tuğlar yuxarı qalxır
    g.staffs.forEach(s => expect(s.y1).toBeLessThan(s.y0 - 300))
  })
})

describe('layout', () => {
  it('placeBox keeps the tughra inside the canvas', () => {
    for (const [W, H, story] of [[2048, 2048, false], [1080, 1920, true], [360, 360, false]]) {
      for (const latin of [true, false]) {
        const { x, y, s } = placeBox(W, H, { latin, story })
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(x + BOX_W * s).toBeLessThanOrEqual(W)
        expect(y + BOX_H * s).toBeLessThanOrEqual(H)
      }
    }
  })

  it('splitSere keeps short names on one line and balances long ones', () => {
    const m = (t) => t.length * 10
    expect(splitSere('يوسف', m, 300)).toEqual(['يوسف'])
    expect(splitSere('محمد علي', m, 300)).toEqual(['محمد علي'])
    const two = splitSere('عبد الرحمن بن عبد الله', m, 100)
    expect(two).toEqual(['عبد الرحمن', 'بن عبد الله'])
    expect(splitSere('', m, 100)).toEqual([''])
  })
})

describe('helpers', () => {
  it('three colour schemes, unknown id falls back', () => {
    expect(SCHEMES.map(s => s.id)).toEqual(['navy', 'ivory', 'crimson'])
    expect(schemeById('nope').id).toBe('navy')
  })

  it('fileName is ascii-safe', () => {
    expect(fileName('Məhəmməd Əliyev')).toBe('tughra-mehemmed-eliyev-muslims-cc.png')
    expect(fileName('Yusif', 'story')).toBe('tughra-yusif-story-muslims-cc.png')
    expect(fileName('')).toBe('tughra-name-muslims-cc.png')
  })

  it('reuses the site name converter (dictionary first)', () => {
    expect(toArabic('Yusif').ar).toBe('يوسف')
    expect(toArabic('Yusif').approximate).toBe(false)
  })
})
