// Nəsri "pajarita" kaşısı (src/utils/nasridTile.js): döşəmə xassəsi —
// qonşu kaşıların ortaq tərəfləri nöqtə-nöqtə üst-üstə düşür, sahə saxlanır.
import { describe, it, expect } from 'vitest'
import {
  A, B, C, H, edgeCurve, tileEdges, tileOutline, tilingPatch, tileTransform, mapPts, halfTurn,
  polyArea, tileAt, presetSlot, amplitude, DEPTH_MAX,
} from '../../src/utils/nasridTile.js'

const EPS = 1e-9
const close = (p, q, eps = EPS) => Math.hypot(p[0] - q[0], p[1] - q[1]) < eps
const sameCurveReversed = (e1, e2) => e1.length === e2.length && e1.every((p, k) => close(p, e2[e2.length - 1 - k]))

describe('nasridTile', () => {
  it('morph 0 — düz üçbucaq; tərəflər uclardan və ortadan keçir', () => {
    const e = edgeCurve(A, B, 0, 8)
    expect(e.every(p => Math.abs(p[1]) < EPS)).toBe(true)
    const s = edgeCurve(B, C, amplitude(1, 0.4), 8)
    expect(close(s[0], B)).toBe(true)
    expect(close(s[8], [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2])).toBe(true)
    expect(close(s[16], C)).toBe(true)
  })

  it('hər tərəf ortası ətrafında 180° dönmədə özünə keçir (qabarıq = çökək)', () => {
    for (const e of tileEdges(1, 0.45, 10)) {
      const M = e[10]
      const turned = mapPts(halfTurn(M), e)
      expect(sameCurveReversed(e, turned)).toBe(true)
    }
  })

  it('sahə morph və dərinlikdən asılı olmayaraq üçbucağın sahəsinə bərabərdir', () => {
    const tri = H / 2
    for (const m of [0, 0.3, 1]) for (const d of [0.1, 0.3, DEPTH_MAX]) {
      expect(polyArea(tileOutline(m, d, 40))).toBeCloseTo(tri, 9)
    }
  })

  it('döşəmə: hər daxili tərəf başqa kaşının tərəfi ilə tərs istiqamətdə tam üst-üstə düşür', () => {
    const edges = tileEdges(1, 0.4, 9)
    const patch = tilingPatch(3)
    const all = []
    for (const t of patch) for (let s = 0; s < 3; s++) all.push({ t, s, pts: mapPts(t.m, edges[s]) })
    const key = (p) => p.map(v => (Math.abs(v) < 1e-7 ? 0 : v).toFixed(6)).join(',')
    const byEnds = new Map()
    for (const e of all) byEnds.set(key(e.pts[0]) + '|' + key(e.pts[e.pts.length - 1]), e)
    let inner = 0
    for (const e of all) {
      const twin = byEnds.get(key(e.pts[e.pts.length - 1]) + '|' + key(e.pts[0]))
      if (!twin) continue
      inner++
      expect(twin.t.key).not.toBe(e.t.key)
      expect(twin.t.kind).not.toBe(e.t.kind)
      expect(sameCurveReversed(e.pts, twin.pts)).toBe(true)
    }
    // 7×7×2 kaşı × 3 tərəf; kənardakılardan başqa hamısının əkizi var
    expect(inner).toBeGreaterThan(all.length * 0.8)
  })

  it('aşağı kaşı yuxarı kaşının üç qonşusu ilə bitişir', () => {
    const edges = tileEdges(1, 0.3, 6)
    const down = edges.map(e => mapPts(tileTransform('down', 0, 0), e))
    const ups = [['up', 0, 0], ['up', 1, 0], ['up', 0, 1]].map(([k, i, j]) => edges.map(e => mapPts(tileTransform(k, i, j), e)))
    for (const de of down) {
      const hit = ups.some(u => u.some(ue => sameCurveReversed(de, ue)))
      expect(hit).toBe(true)
    }
  })

  it('boşluq/örtüşmə yoxdur: təsadüfi nöqtələr düz bir kaşıya düşür', () => {
    const outline = tileOutline(1, DEPTH_MAX, 16)
    const patch = tilingPatch(4)
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (let n = 0; n < 200; n++) {
      const p = [rnd() * 3 - 1.5, rnd() * 3 - 1.5]
      const hits = patch.filter(t => {
        const poly = mapPts(t.m, outline)
        let inside = false
        for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
          const [xa, ya] = poly[a], [xb, yb] = poly[b]
          if ((ya > p[1]) !== (yb > p[1]) && p[0] < (xb - xa) * (p[1] - ya) / (yb - ya) + xa) inside = !inside
        }
        return inside
      })
      expect(hits.length).toBe(1)
      expect(tileAt(p, outline).key).toBe(hits[0].key)
    }
  })

  it('rəngləmə hazırları: qonşu kaşılar fərqli rəngdədir', () => {
    for (const pr of ['two', 'three', 'four']) {
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const d = presetSlot(pr, 'down', i, j)
        for (const [ii, jj] of [[i, j], [i + 1, j], [i, j + 1]]) expect(presetSlot(pr, 'up', ii, jj)).not.toBe(d)
      }
    }
  })
})
