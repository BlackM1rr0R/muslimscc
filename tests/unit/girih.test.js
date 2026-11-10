import { describe, it, expect } from 'vitest'
import { tiling, hankin, vertices } from '../../src/utils/girih'

const near = (a, b, e = 1e-6) => Math.abs(a - b) < e
// Qonşu tillərin tərəfləri üst-üstə düşməlidir: hər tərəfin ortası başqa bir tilin tərəfinin ortası ilə eynidir
function sharedEdgesOk(polys) {
  const mids = []
  for (const p of polys) {
    const v = vertices(p)
    v.forEach((a, k) => { const b = v[(k + 1) % v.length]; mids.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) })
  }
  const inner = mids.filter(([x, y]) => x > 150 && x < 250 && y > 150 && y < 250)
  return inner.length > 0 && inner.every(m => mids.filter(o => near(o[0], m[0], 1e-6) && near(o[1], m[1], 1e-6)).length === 2)
}

describe('girih', () => {
  for (const k of ['6', '8', '12']) {
    it(`${k}: tillər boşluqsuz birləşir (hər daxili tərəf iki tilə aiddir)`, () => {
      expect(sharedEdgesOk(tiling(k, 30, 400, 400))).toBe(true)
    })
    it(`${k}: Hankin seqmentləri çıxır və sonludur`, () => {
      const segs = hankin(tiling(k, 30, 200, 200), (60 * Math.PI) / 180)
      expect(segs.length).toBeGreaterThan(50)
      expect(segs.every(s => s.every(Number.isFinite))).toBe(true)
    })
  }
})
