// Ebru riyaziyyatı (src/utils/ebru.js) — Jaffer/Lu "Mathematical Marbling" modeli
import { describe, it, expect } from 'vitest'
import {
  dropDisplace, applyDrop, makeDrop, applyTine, tineShift, resample, classify, prune,
  applyOp, presetOps, vertexCount, pointInPoly, viewRect, MAX_TOTAL_VERTS, ASPECT,
} from '../../src/utils/ebru.js'

const C = ['#26346b', '#c98f2c', '#a3312b', '#1f8f8c', '#f2e8d2', '#1e5640']
const area = (p) => {
  let s = 0
  for (let i = 0, n = p.length, j = n - 2; i < n; j = i, i += 2) s += p[j] * p[i + 1] - p[i] * p[j + 1]
  return Math.abs(s) / 2
}

describe('damcı (drop)', () => {
  it('d məsafədəki nöqtə √(d² + r²) məsafəyə keçir, istiqamət qorunur', () => {
    const cx = 0.4, cy = 0.6, r = 0.1
    for (const [d, a] of [[0.02, 0], [0.1, 1], [0.3, 2.5], [0.75, 4]]) {
      const [x, y] = dropDisplace(cx + d * Math.cos(a), cy + d * Math.sin(a), cx, cy, r)
      expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(Math.sqrt(d * d + r * r), 10)
      expect(Math.atan2(y - cy, x - cx)).toBeCloseTo(Math.atan2(Math.sin(a), Math.cos(a)), 10)
    }
  })

  it('mərkəzdəki nöqtə NaN vermir', () => {
    const [x, y] = dropDisplace(0.5, 0.5, 0.5, 0.5, 0.1)
    expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true)
  })

  it('kənardakı damcının sahəsi qorunur (təxminən)', () => {
    const d = makeDrop(0.5, 0.5, 0.08, 'x', 720)
    const before = area(d.pts)
    applyDrop([d], 0.62, 0.55, 0.05)
    expect(Math.abs(area(d.pts) - before) / before).toBeLessThan(0.01)
  })

  it('iç-içə damcılar halqa olur: köhnə damcının sahəsi dəyişmir, yeni damcı onun içində', () => {
    let drops = []
    drops = applyOp(drops, { t: 'drop', x: 0.5, y: 0.5, r: 0.1, color: 'a' })
    const before = area(drops[0].pts)
    drops = applyOp(drops, { t: 'drop', x: 0.5, y: 0.5, r: 0.06, color: 'b' })
    expect(drops).toHaveLength(2)
    // halqa: xarici sərhədin sahəsi π(r1² + r2²)
    expect(area(drops[0].pts)).toBeCloseTo(before + area(drops[1].pts), 3)
    expect(pointInPoly(0.5, 0.5, drops[0].pts)).toBe(true)
  })
})

describe('iynə xətti (tine)', () => {
  it('yerdəyişmə xətdən uzaqlaşdıqca azalır', () => {
    const z = [0, 0.01, 0.05, 0.2, 1].map(d => tineShift(d, 0.1, 0.02))
    expect(z[0]).toBeCloseTo(0.1, 12)
    for (let i = 1; i < z.length; i++) expect(z[i]).toBeLessThan(z[i - 1])
    expect(tineShift(0.02, 0.1, 0.02)).toBeCloseTo(0.05, 12) // d = λ → α/2
  })

  it('nöqtələr M istiqamətində, məsafəyə görə sürüşür', () => {
    const d = { color: 'x', pts: [0.5, 0.3, 0.5, 0.35, 0.5, 0.6] }
    applyTine([d], { bx: 0, by: 0.3, mx: 1, my: 0, alpha: 0.1, lambda: 0.02 })
    expect(d.pts[0]).toBeCloseTo(0.6, 12)
    expect(d.pts[1]).toBeCloseTo(0.3, 12)
    const s1 = d.pts[2] - 0.5, s2 = d.pts[4] - 0.5
    expect(s1).toBeLessThan(0.1)
    expect(s2).toBeLessThan(s1)
    expect(d.pts[3]).toBeCloseTo(0.35, 12)
  })

  it('seqmentli xətt (barmaq) uclardan uzaqda təsir etmir', () => {
    const d = { color: 'x', pts: [0.1, 0.5, 0.9, 0.5] }
    applyTine([d], { bx: 0.4, by: 0.5, mx: 1, my: 0, alpha: 0.02, lambda: 0.02, len: 0.05 })
    expect(Math.abs(d.pts[0] - 0.1)).toBeLessThan(1e-6)
    expect(Math.abs(d.pts[2] - 0.9)).toBeLessThan(1e-6)
  })

  it('bütöv xətt sahəni qoruyur (sürüşmə)', () => {
    const d = makeDrop(0.5, 0.5, 0.1, 'x', 600)
    const before = area(d.pts)
    applyTine([d], { bx: 0, by: 0.52, mx: 1, my: 0, alpha: 0.08, lambda: 0.01 })
    const r = resample(d.pts, { maxEdge: 0.001, maxVerts: 20000 })
    expect(Math.abs(area(r) - before) / before).toBeLessThan(0.02)
  })
})

describe('nümunələmə və büdcə', () => {
  it('uzun tillərə təpə əlavə edir', () => {
    const sq = [0.2, 0.2, 0.8, 0.2, 0.8, 0.8, 0.2, 0.8]
    const r = resample(sq, { maxEdge: 0.01, maxVerts: 10000 })
    expect(r.length / 2).toBeGreaterThan(200)
    for (let i = 0, n = r.length; i < n; i += 2) {
      const j = (i + 2) % n
      expect(Math.hypot(r[j] - r[i], r[j + 1] - r[i + 1])).toBeLessThanOrEqual(0.0100001)
    }
  })

  it('təpə sayı maxVerts-i keçmir', () => {
    const sq = [0.2, 0.2, 0.8, 0.2, 0.8, 0.8, 0.2, 0.8]
    expect(resample(sq, { maxEdge: 0.0001, maxVerts: 500 }).length / 2).toBeLessThanOrEqual(500)
  })

  it('sıx təpələr seyrəlir, amma ən az 8 qalır', () => {
    const d = makeDrop(0.5, 0.5, 0.001, 'x', 200)
    const r = resample(d.pts, { minEdge: 0.01 })
    expect(r.length / 2).toBeGreaterThanOrEqual(8)
    expect(r.length / 2).toBeLessThan(200)
  })

  it('ən ağır hazır naxışda ümumi təpə sayı büdcə daxilindədir', () => {
    let drops = []
    for (const op of presetOps('tarakli', C, 3)) drops = applyOp(drops, op)
    expect(drops.length).toBeGreaterThan(5)
    expect(vertexCount(drops)).toBeLessThan(MAX_TOTAL_VERTS * 1.2)
    for (const d of drops) for (const v of d.pts) expect(Number.isFinite(v)).toBe(true)
  })
})

describe('görünməyən damcıların təmizlənməsi', () => {
  it('bütün vərəqi örtən damcının altındakılar atılır', () => {
    const small = makeDrop(0.5, 0.5, 0.1, 'a')
    const big = makeDrop(0.5, ASPECT / 2, 3, 'b')
    expect(classify(big.pts)).toBe('cover')
    expect(classify(small.pts)).toBe('partial')
    expect(classify(makeDrop(5, 5, 0.1, 'c').pts)).toBe('out')
    const kept = prune([small, big, makeDrop(0.3, 0.3, 0.05, 'd'), makeDrop(5, 5, 0.1, 'e')])
    expect(kept.map(d => d.color)).toEqual(['b', 'd'])
  })

  it('viewRect vərəqin ölçüsünü verir', () => {
    expect(viewRect(0)).toEqual({ x0: -0, y0: -0, x1: 1, y1: ASPECT })
  })
})

describe('hazır naxışlar', () => {
  it('hər naxış əməliyyat qaytarır və təkrarlanandır (seed)', () => {
    for (const n of ['battal', 'gelgit', 'tarakli', 'flower']) {
      const a = presetOps(n, C, 42), b = presetOps(n, C, 42)
      expect(a.length).toBeGreaterThan(5)
      expect(a).toEqual(b)
    }
    expect(presetOps('nope', C, 1)).toEqual([])
  })
})
