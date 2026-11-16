// İznik kaşısı riyaziyyatı (src/utils/iznik.js) — simmetriya qrupları, motivlər, düzülüş
import { describe, it, expect } from 'vitest'
import {
  SYMS, MOTIFS, mulMat, symMatrices, applyMat, symPoints, stampAngle,
  pointerToModel, wallLayout, bezierPts, motifParts, placeMotif,
} from '../../src/utils/iznik.js'

const key = (m) => m.join(',')
const close = (a, b) => Math.abs(a - b) < 1e-9

describe('simmetriya qrupları', () => {
  it('4 və 8 qat dəstəklənir', () => {
    expect(SYMS).toEqual([4, 8])
  })

  for (const n of [4, 8]) {
    it(`${n} qat: ${n} fərqli matris, ilki eynilik, qrup qapalıdır`, () => {
      const ms = symMatrices(n)
      expect(ms).toHaveLength(n)
      expect(ms[0]).toEqual([1, 0, 0, 1])
      const set = new Set(ms.map(key))
      expect(set.size).toBe(n)
      for (const a of ms) for (const b of ms) expect(set.has(key(mulMat(a, b)))).toBe(true)
    })

    it(`${n} qat: ixtiyari nöqtənin ${n} fərqli əksi, mərkəzdən məsafə qorunur`, () => {
      const pts = symPoints(0.71, 0.36, n)
      const d0 = Math.hypot(0.21, -0.14)
      const uniq = new Set(pts.map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`))
      expect(uniq.size).toBe(n)
      for (const [x, y] of pts) expect(close(Math.hypot(x - 0.5, y - 0.5), d0)).toBe(true)
    })
  }

  it('4 qat (D2) 8 qatın (D4) alt qrupudur', () => {
    const big = new Set(symMatrices(8).map(key))
    for (const m of symMatrices(4)) expect(big.has(key(m))).toBe(true)
  })

  it('8 qatda 90° dönmə və güzgü var', () => {
    const pts = symPoints(0.8, 0.5, 8).map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`)
    expect(pts).toContain('0.500000,0.800000') // 90° dönmə
    expect(symPoints(0.7, 0.4, 8).map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`)).toContain('0.300000,0.400000') // X güzgüsü
  })

  it('mərkəz sabit qalır', () => {
    for (const m of symMatrices(8)) expect(applyMat(m, 0.5, 0.5)).toEqual([0.5, 0.5])
  })
})

describe('möhür istiqaməti və göstərici', () => {
  it('motiv mərkəzdən çölə baxır', () => {
    expect(stampAngle(0.5, 0.5)).toBe(0)
    expect(close(stampAngle(0.5, 0.1), 0)).toBe(true) // yuxarıda — düz
    expect(close(stampAngle(0.9, 0.5), Math.PI / 2)).toBe(true) // sağda — 90°
  })

  it('tək kaşı rejimində koordinat dəyişmir', () => {
    expect(pointerToModel(0.3, 0.6, false)).toEqual({ x: 0.3, y: 0.6, tile: null })
  })

  it('divar rejimində 3×3 kaşının daxili koordinatı', () => {
    const p = pointerToModel(0.5, 0.9, true)
    expect(p.tile).toEqual({ ix: 1, iy: 2 })
    expect(close(p.x, 0.5) && close(p.y, 0.7)).toBe(true)
    // eyni xətt davam edəndə kaşı dəyişmir — koordinat kənara çıxa bilər
    const q = pointerToModel(0.7, 0.9, true, p.tile)
    expect(q.x).toBeGreaterThan(1)
    expect(pointerToModel(1, 1, true).tile).toEqual({ ix: 2, iy: 2 })
  })

  it('telefon fonu 1080×1920-ni tam örtür', () => {
    const lay = wallLayout(1080, 1920, 3)
    expect(lay.size).toBe(360)
    const ys = lay.tiles.map(t => t.y)
    expect(Math.min(...ys)).toBeLessThanOrEqual(0)
    expect(Math.max(...ys) + lay.size).toBeGreaterThanOrEqual(1920)
    expect(lay.tiles).toHaveLength(lay.rows * 3)
  })
})

describe('motivlər', () => {
  it('Bezye seqmenti uclardan keçir', () => {
    const p = bezierPts([0, 0], [[0, 1, 1, 1, 1, 0]], 10)
    expect(p).toHaveLength(22)
    expect(p.slice(-2)).toEqual([1, 0])
  })

  for (const name of MOTIFS) {
    it(`${name}: sonlu, bağlı çoxbucaqlılar, əsas hissə var, ölçü −1.1…1.1`, () => {
      const parts = motifParts(name)
      expect(parts.length).toBeGreaterThan(0)
      expect(parts.some(p => p.role === 'main')).toBe(true)
      for (const p of parts) {
        expect(['main', 'accent', 'leaf']).toContain(p.role)
        expect(p.pts.length % 2).toBe(0)
        expect(p.pts.length).toBeGreaterThanOrEqual(6)
        for (const v of p.pts) {
          expect(Number.isFinite(v)).toBe(true)
          expect(Math.abs(v)).toBeLessThanOrEqual(1.1)
        }
      }
    })
  }

  it('lalə sol-sağ simmetrikdir', () => {
    const main = motifParts('tulip').find(p => p.role === 'main').pts
    const xs = [], ys = []
    for (let i = 0; i < main.length; i += 2) { xs.push(main[i]); ys.push(main[i + 1]) }
    expect(close(Math.min(...xs), -Math.max(...xs))).toBe(true)
  })

  it('placeMotif ölçür, döndərir, yerləşdirir; keş dəyişmir', () => {
    const before = JSON.stringify(motifParts('rosette'))
    const placed = placeMotif('rosette', 0.3, 0.4, 0.1, Math.PI / 2)
    expect(JSON.stringify(motifParts('rosette'))).toBe(before)
    const center = placed.find(p => p.role === 'leaf').pts
    let cx = 0, cy = 0
    for (let i = 0; i < center.length; i += 2) { cx += center[i]; cy += center[i + 1] }
    expect(close(cx / (center.length / 2), 0.3)).toBe(true)
    expect(close(cy / (center.length / 2), 0.4)).toBe(true)
    // 90° dönmə: yerli (0, −1) → (+1, 0)
    const [x, y] = placeMotif('saz', 0, 0, 1, Math.PI / 2)[0].pts
    const [lx, ly] = motifParts('saz')[0].pts
    expect(close(x, -ly) && close(y, lx)).toBe(true)
  })

  it('naməlum motiv boş qaytarır', () => {
    expect(motifParts('nope')).toEqual([])
  })
})
