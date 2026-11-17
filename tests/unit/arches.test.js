// İslam memarlığında tağlar (src/utils/arches.js): dabanlar, simmetriya,
// nal tağın > 180° qövsü, sivri təpədə künc, dördmərkəzli tağda toxunma.
import { describe, it, expect } from 'vitest'
import {
  ARCH_TYPES, buildArch, arcStart, arcEnd, arcSweep, arcPoint, joinAngle, mirrorArc,
  extradosArcs, voussoirs, foilRadius, arcPath, intradosPath,
} from '../../src/utils/arches.js'

const EPS = 1e-9
const close = (p, q, eps = EPS) => Math.hypot(p[0] - q[0], p[1] - q[1]) < eps
const SPANS = [3, 6, 7.5, 200]

describe('arches', () => {
  for (const type of ARCH_TYPES) {
    for (const span of SPANS) {
      it(`${type} (${span}): qövslər dabanlarda başlayıb bitir və ardıcıl birləşir`, () => {
        const g = buildArch(type, span)
        const a = span / 2
        expect(close(arcStart(g.arcs[0]), [a, 0], 1e-9 * span)).toBe(true)
        expect(close(arcEnd(g.arcs.at(-1)), [-a, 0], 1e-9 * span)).toBe(true)
        for (let i = 0; i + 1 < g.arcs.length; i++) {
          expect(close(arcEnd(g.arcs[i]), arcStart(g.arcs[i + 1]), 1e-9 * span)).toBe(true)
        }
        g.arcs.forEach(arc => expect(arcSweep(arc)).toBeGreaterThan(0))
      })

      it(`${type} (${span}): oxa görə simmetrikdir`, () => {
        const g = buildArch(type, span)
        const n = g.arcs.length
        for (let i = 0; i < n; i++) {
          const m = mirrorArc(g.arcs[i])
          const o = g.arcs[n - 1 - i]
          expect(Math.abs(m.cx - o.cx)).toBeLessThan(1e-9 * span)
          expect(Math.abs(m.cy - o.cy)).toBeLessThan(1e-9 * span)
          expect(Math.abs(m.r - o.r)).toBeLessThan(1e-9 * span)
          expect(Math.abs(m.a0 - o.a0)).toBeLessThan(1e-9)
          expect(Math.abs(m.a1 - o.a1)).toBeLessThan(1e-9)
        }
        // daşlar da simmetrikdir: j-ci daşın əksi (n−1−j)-ci daşın nöqtələri ilə üst-üstə düşür
        const vs = voussoirs(g)
        vs.forEach((poly, j) => {
          const other = vs[vs.length - 1 - j]
          poly.forEach(p => {
            const best = Math.min(...other.map(q => Math.hypot(-p[0] - q[0], p[1] - q[1])))
            expect(best).toBeLessThan(1e-6 * span)
          })
        })
      })
    }
  }

  it('nal tağ: qövs 180°-dən böyükdür (240°), mərkəz dabanlar xəttindən yuxarıdadır', () => {
    const g = buildArch('horseshoe', 10)
    const arc = g.arcs[0]
    expect(arcSweep(arc)).toBeGreaterThan(Math.PI)
    expect(arcSweep(arc) * 180 / Math.PI).toBeCloseTo(240, 9)
    expect(arc.cy).toBeGreaterThan(0)
    // açılış dabanlardan genişdir — nal forması
    expect(arc.r).toBeGreaterThan(g.a)
    // tağ yarımdairəni radiusun yarısı qədər aşır
    expect(arc.cy / arc.r).toBeCloseTo(0.5, 12)
  })

  it('sivri tağlar: təpə küncdür (toxunan kəsilir), hamar deyil', () => {
    for (const type of ['pointed', 'ottoman', 'persian']) {
      const g = buildArch(type, 8)
      const mid = g.arcs.length / 2
      const ang = joinAngle(g.arcs[mid - 1], g.arcs[mid])
      expect(ang).toBeGreaterThan(5 * Math.PI / 180)
      expect(close(arcEnd(g.arcs[mid - 1]), g.apex, 1e-9)).toBe(true)
      expect(Math.abs(g.apex[0])).toBeLessThan(1e-9)
    }
  })

  it('bərabərtərəfli tağ: dabanlar və təpə bərabərtərəfli üçbucaqdır', () => {
    const g = buildArch('pointed', 6)
    const A = [-3, 0], B = [3, 0]
    expect(Math.hypot(g.apex[0] - A[0], g.apex[1] - A[1])).toBeCloseTo(6, 12)
    expect(Math.hypot(g.apex[0] - B[0], g.apex[1] - B[1])).toBeCloseTo(6, 12)
  })

  it('Osmanlı pencî kemeri: mərkəzlər aşırımın 1/10-ində, r = 0,6·aşırım, bərabərtərəflidən alçaq', () => {
    const g = buildArch('ottoman', 10)
    expect(Math.abs(g.arcs[0].cx)).toBeCloseTo(1, 12)
    expect(g.arcs[0].r).toBeCloseTo(6, 12)
    expect(g.apex[1]).toBeLessThan(buildArch('pointed', 10).apex[1])
    expect(g.apex[1]).toBeGreaterThan(5) // yarımdairədən hündür — sivri
  })

  it('dördmərkəzli tağ: alt və üst qövslər bitişmədə toxunandır', () => {
    for (const span of SPANS) {
      const g = buildArch('persian', span)
      expect(joinAngle(g.arcs[0], g.arcs[1])).toBeLessThan(1e-9)
      expect(joinAngle(g.arcs[2], g.arcs[3])).toBeLessThan(1e-9)
      // bitişmə nöqtəsi və iki mərkəz bir düz xətt üzərindədir
      const E = arcEnd(g.arcs[0])
      const O1 = [g.arcs[0].cx, g.arcs[0].cy], O3 = [g.arcs[1].cx, g.arcs[1].cy]
      const cross = (O1[0] - E[0]) * (O3[1] - E[1]) - (O1[1] - E[1]) * (O3[0] - E[0])
      expect(Math.abs(cross)).toBeLessThan(1e-9 * span * span)
      // dörd fərqli mərkəz
      expect(new Set(g.arcs.map(x => `${x.cx.toFixed(6)},${x.cy.toFixed(6)}`)).size).toBe(4)
      // alt qövslər 45°
      expect(arcSweep(g.arcs[0]) * 180 / Math.PI).toBeCloseTo(45, 9)
    }
  })

  it('çoxləçəkli tağ: dişlər əsas yarımdairə üzərindədir, ləçəklər xaricə qabarır', () => {
    const g = buildArch('multifoil', 8)
    for (let i = 0; i + 1 < g.arcs.length; i++) {
      const D = arcEnd(g.arcs[i])
      expect(Math.hypot(D[0], D[1])).toBeCloseTo(4, 9)
      expect(joinAngle(g.arcs[i], g.arcs[i + 1])).toBeGreaterThan(0.1)
    }
    g.arcs.forEach(arc => {
      const mid = arcPoint(arc, (arc.a0 + arc.a1) / 2)
      expect(Math.hypot(mid[0], mid[1])).toBeGreaterThan(4)
      expect(arcSweep(arc)).toBeCloseTo(Math.PI, 12)
    })
    // radial funksiya ləçək çevrəsinin üzərindədir
    for (let f = 0.01; f < Math.PI; f += 0.05) {
      const r = foilRadius(g, f), p = [r * Math.cos(f), r * Math.sin(f)]
      const dist = Math.min(...g.arcs.map(arc => Math.abs(Math.hypot(p[0] - arc.cx, p[1] - arc.cy) - arc.r)))
      expect(dist).toBeLessThan(1e-9)
    }
  })

  it('xarici əyri sivri təpədə oxda birləşir; daşların sayı düzgündür', () => {
    for (const type of ['pointed', 'ottoman', 'persian']) {
      const g = buildArch(type, 8)
      const ext = extradosArcs(g)
      const mid = ext.length / 2
      const P = arcEnd(ext[mid - 1]), Q = arcStart(ext[mid])
      expect(close(P, Q, 1e-9)).toBe(true)
      expect(Math.abs(P[0])).toBeLessThan(1e-9)
      expect(P[1]).toBeGreaterThan(g.apex[1])
    }
    for (const type of ['horseshoe', 'pointed', 'persian', 'multifoil', 'ottoman']) {
      const g = buildArch(type, 8)
      expect(voussoirs(g)).toHaveLength(g.voussoirs)
    }
    expect(buildArch('horseshoe', 8).voussoirs % 2).toBe(1) // açar daşı ortada
  })

  it('SVG yolları sonlu ədədlərdir', () => {
    for (const type of ARCH_TYPES) {
      const g = buildArch(type, 5)
      expect(intradosPath(g)).not.toMatch(/NaN|Infinity/)
      expect(arcPath(g.arcs[0], 0.4)).toMatch(/^M[-\d.]+ [-\d.]+A/)
    }
  })
})
