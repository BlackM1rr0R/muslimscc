// Səccadə dizayneri (src/utils/rugDesign.js) — həndəsə, simmetriya, rənglər
import { describe, it, expect } from 'vitest'
import {
  ARCHES, BORDERS, FIELDS, MEDALLIONS, PALETTES, ZONES, RUG_W, EXPORTS,
  archGeometry, archCurve, nichePolygon, pointInPoly, spandrelSpot, fitTiles, zones,
  mix, contrast, inksFor, hexToRgb, rgbToHex, starPoints, steppedDiamond, lampPolygon, drawScene, paletteById,
} from '../../src/utils/rugDesign.js'

const mirrored = (pts, cx) => {
  // hər nöqtənin güzgü əksi də çoxbucaqlıda var
  for (const [x, y] of pts) {
    const hit = pts.some(([u, v]) => Math.abs(u - (2 * cx - x)) < 1e-6 && Math.abs(v - y) < 1e-6)
    if (!hit) return false
  }
  return true
}

describe('mehrab tağı', () => {
  for (const type of ARCHES) {
    it(`${type}: simmetrik, zirvə mərkəzdə və ən yuxarıda`, () => {
      const g = archGeometry(type)
      const c = archCurve(type)
      expect(mirrored(c, g.cx)).toBe(true)
      const minY = Math.min(...c.map(p => p[1]))
      const top = c.filter(p => Math.abs(p[1] - minY) < 1e-6)
      expect(top.some(p => Math.abs(p[0] - g.cx) < 1e-6)).toBe(true)
      // sahənin içində qalır
      const f = zones().field
      for (const [x, y] of c) {
        expect(x).toBeGreaterThanOrEqual(g.x0 - 1e-6)
        expect(x).toBeLessThanOrEqual(g.x1 + 1e-6)
        expect(y).toBeGreaterThan(f.y0)
        expect(y).toBeLessThanOrEqual(g.ySpring + 1e-6)
      }
      expect(c[0][0]).toBeCloseTo(g.x0, 6)
      expect(c[c.length - 1][0]).toBeCloseTo(g.x1, 6)
    })
  }
  it('taxça çoxbucaqlısı mərkəzi əhatə edir, künc sahəsini yox', () => {
    for (const type of ARCHES) {
      const P = nichePolygon(type)
      const g = archGeometry(type)
      expect(pointInPoly(g.cx, (g.ySpring + g.yBottom) / 2, P)).toBe(true)
      const f = zones().field
      expect(pointInPoly(f.x0 + 5, f.y0 + 5, P)).toBe(false)
    }
  })
  it('lansetvari tağ ən hündür, yarımdairəvi ən alçaq', () => {
    const h = (t) => archGeometry(t).ySpring - archGeometry(t).yApex
    expect(h('lancet')).toBeGreaterThan(h('pointed'))
    expect(h('pointed')).toBeGreaterThan(h('round'))
  })
})

describe('künc sahəsi (spandrel)', () => {
  it('rozet yeri tağdan kənarda və sahənin içindədir', () => {
    for (const type of ARCHES) {
      const s = spandrelSpot(type)
      const f = zones().field
      expect(s.r).toBeGreaterThan(20)
      expect(pointInPoly(s.x, s.y, nichePolygon(type))).toBe(false)
      expect(s.x - s.r).toBeGreaterThanOrEqual(f.x0 - 1e-6)
      expect(s.y - s.r).toBeGreaterThanOrEqual(f.y0 - 1e-6)
    }
  })
})

describe('haşiyə kafelləri', () => {
  it('həmişə tək say və uzunluğu tam örtür', () => {
    for (const len of [100, 333, 700, 1196, 1428]) {
      for (const ideal of [30, 116, 139]) {
        const { n, step } = fitTiles(len, ideal)
        expect(n % 2).toBe(1)
        expect(n * step).toBeCloseTo(len, 9)
        expect(step / ideal).toBeGreaterThan(0.6)
        expect(step / ideal).toBeLessThan(2.1)
      }
    }
  })
})

describe('motivlər', () => {
  it('8 guşəli ulduz: 16 nöqtə, simmetrik', () => {
    const p = starPoints(100, 100, 50)
    expect(p).toHaveLength(16)
    expect(mirrored(p.map(([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6]), 100)).toBe(true)
  })
  it('pilləli romb və qəndil simmetrikdir', () => {
    expect(mirrored(steppedDiamond(50, 50, 30, 40, 4), 50)).toBe(true)
    expect(mirrored(lampPolygon(500, 200, 300), 500)).toBe(true)
  })
})

describe('rənglər', () => {
  it('hex ↔ rgb və qarışıq', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255])
    expect(rgbToHex([18, 52, 86])).toBe('#123456')
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })
  it('rəng dəstləri bütün zonaları əhatə edir', () => {
    expect(PALETTES.map(p => p.id)).toEqual(['madder', 'gazakh', 'teal', 'night'])
    for (const p of PALETTES) for (const z of ZONES) expect(p.colors[z]).toMatch(/^#[0-9a-f]{6}$/)
    expect(paletteById('nope').id).toBe('madder')
  })
  it('naxış rəngi fonla eyni olsa da görünən rəng seçilir', () => {
    const c = { ...PALETTES[0].colors, motif: '#1f2c58' } // haşiyə ilə eyni
    const ink = inksFor(c.border, c)
    expect(contrast(ink.a, c.border)).toBeGreaterThanOrEqual(1.9)
    expect(ink.a).not.toBe(ink.b)
  })
})

describe('çəkiliş (saxta kontekst)', () => {
  const fakeCtx = () => {
    const calls = { fill: 0, stroke: 0 }
    const grad = { addColorStop() {} }
    return new Proxy({ calls }, {
      get(t, k) {
        if (k in t) return t[k]
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad
        if (k === 'measureText') return () => ({ width: 10 })
        if (k === 'fill') return () => { calls.fill++ }
        if (k === 'stroke') return () => { calls.stroke++ }
        return () => {}
      },
      set(t, k, v) { t[k] = v; return true },
    })
  }
  it('bütün seçim birləşmələri xətasız çəkilir', () => {
    for (const arch of ARCHES) for (const border of BORDERS) for (const field of FIELDS) for (const medallion of MEDALLIONS) {
      const ctx = fakeCtx()
      drawScene(ctx, 300, 500, { arch, border, field, medallion, weave: true, colors: PALETTES[1].colors }, 'preview')
      expect(ctx.calls.fill).toBeGreaterThan(50)
    }
  })
  it('ixrac ölçüləri: divar kağızı 1080×1920, çap 2:3', () => {
    expect(EXPORTS.wallpaper).toMatchObject({ w: 1080, h: 1920 })
    expect(EXPORTS.print.w * 3).toBe(EXPORTS.print.h * 2)
    expect(RUG_W).toBe(1000)
  })
})
