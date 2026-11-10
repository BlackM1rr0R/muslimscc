// ═══════════════════════════════════════════════════════
// İslam həndəsi naxışı (v5.9) — saf həndəsə (components/PatternStudio, tests/unit/girih.test.js)
//
//   tiling(kind, s, w, h)   → düzgün çoxbucaqlılar [{ c:[x,y], n, R, rot }]   (ekranı örtən hissə)
//   hankin(polys, theta)    → xətt seqmentləri [[x1,y1,x2,y2]]                  (ulduz naxışı)
//
// • Üsul: Hankin "polygons in contact" — hər tilin tərəfinin ortasından iki şüa θ bucağı ilə
//   içəri çıxır, qonşu tərəflərin şüaları kəsişənə qədər çəkilir. Klassik nəticələr:
//     '8'  — 4.8.8 (səkkizbucaqlı + kvadrat): səkkizguşəli ulduzlar (xatəm)
//     '12' — 3.12.12 (onikibucaqlı + üçbucaq): onikiguşəli ulduzlar
//     '6'  — 6.6.6 (altıbucaqlı): altıguşəli ulduzlar
// ═══════════════════════════════════════════════════════
const TAU = Math.PI * 2

/** Tiling — s: tərəf uzunluğu; w×h sahəsini (kənarlardan bir az artıq) örtür */
export function tiling(kind, s, w, h) {
  const out = []
  if (kind === '8') {
    const R8 = s / (2 * Math.sin(Math.PI / 8)), L = s * (1 + Math.SQRT2)
    for (let y = -1; y * L < h + L; y++) for (let x = -1; x * L < w + L; x++) {
      out.push({ c: [x * L, y * L], n: 8, R: R8, rot: Math.PI / 8 })
      out.push({ c: [(x + 0.5) * L, (y + 0.5) * L], n: 4, R: s / Math.SQRT2, rot: 0 })
    }
  } else if (kind === '12') {
    const R12 = s / (2 * Math.sin(Math.PI / 12)), r12 = s / (2 * Math.tan(Math.PI / 12))
    const ax = 2 * r12, ay = Math.sqrt(3) * r12
    for (let j = -1; j * ay < h + ay; j++) for (let i = -1; i * ax < w + ax; i++) {
      const cx = i * ax + (j % 2 ? r12 : 0), cy = j * ay
      out.push({ c: [cx, cy], n: 12, R: R12, rot: Math.PI / 12 })
      // üçbucaqlar — üç qonşu onikibucaqlının arasında (yuxarı və aşağı)
      const Rt = s / Math.sqrt(3)
      out.push({ c: [cx + r12, cy + ay / 3], n: 3, R: Rt, rot: -Math.PI / 2 })
      out.push({ c: [cx + r12, cy - ay / 3], n: 3, R: Rt, rot: Math.PI / 2 })
    }
  } else {
    const R6 = s, ax = Math.sqrt(3) * s, ay = 1.5 * s
    for (let j = -1; j * ay < h + ay; j++) for (let i = -1; i * ax < w + ax; i++) {
      out.push({ c: [i * ax + (j % 2 ? ax / 2 : 0), j * ay], n: 6, R: R6, rot: Math.PI / 6 })
    }
  }
  return out
}

export const vertices = ({ c, n, R, rot }) => Array.from({ length: n }, (_, k) => [c[0] + R * Math.cos(rot + (TAU * k) / n), c[1] + R * Math.sin(rot + (TAU * k) / n)])

function intersect(p, d, q, e) {
  const den = d[0] * e[1] - d[1] * e[0]
  if (Math.abs(den) < 1e-9) return null
  const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den
  return [p[0] + d[0] * t, p[1] + d[1] * t]
}
const rotate = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]

/** Hankin seqmentləri — theta radianla (0 < θ < π/2); hər seqmentin mərkəzdən məsafəsi də (animasiya sırası) */
export function hankin(polys, theta) {
  const segs = []
  for (const poly of polys) {
    const v = vertices(poly), n = v.length
    const mids = [], dirs = []
    for (let k = 0; k < n; k++) {
      const a = v[k], b = v[(k + 1) % n]
      mids.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      dirs.push([(b[0] - a[0]) / L, (b[1] - a[1]) / L])
    }
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n
      // k tərəfinin ortasından irəli (θ içəri), k+1 tərəfinin ortasından geri (θ içəri) — v[k+1] küncündə görüşürlər
      const d1 = rotate(dirs[k], theta)
      const d2 = rotate([-dirs[k2][0], -dirs[k2][1]], -theta)
      const p = intersect(mids[k], d1, mids[k2], d2)
      if (!p) continue
      // Şüa geriyə kəsişirsə (çox böyük θ) — atla
      if ((p[0] - mids[k][0]) * d1[0] + (p[1] - mids[k][1]) * d1[1] <= 0) continue
      segs.push([mids[k][0], mids[k][1], p[0], p[1]], [mids[k2][0], mids[k2][1], p[0], p[1]])
    }
  }
  return segs
}
