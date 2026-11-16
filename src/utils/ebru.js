// ═══════════════════════════════════════════════════════
// Ebru riyaziyyatı — saf funksiyalar (DOM yoxdur), EbruCanvas.jsx üçün
//
// Model: A. Jaffer, S. Lu və b., «Mathematical Marbling» (IEEE CG&A, 2012).
// • Boya — damcılar siyahısı; hər damcı qapalı çoxbucaqlıdır (təpələr düz
//   massivdə: [x0, y0, x1, y1, …]). Sonra düşən damcı üstdə çəkilir.
// • Yeni damcı (mərkəz c, radius r) hər təpəni itələyir:
//     p' = c + (p − c)·√(1 + r² / |p − c|²)
//   Sahə qorunur: c-dən d məsafədəki nöqtə √(d² + r²) məsafəyə keçir.
// • İynə/daraq xətti (B nöqtəsi, M vahid istiqaməti): təpə M boyunca
//     z = α·λ / (d + λ)
//   qədər sürüşür, d — xəttə perpendikulyar məsafə. Barmaq hərəkəti üçün
//   xətt seqmentlə məhdudlaşır (uclarda yumşaq Qauss sönməsi; σ ≥ 1.2α —
//   çevirmə qarşılıqlı birqiymətli qalır, çoxbucaqlı özünü kəsmir).
// • Uzanan tillərə yeni təpə əlavə olunur (yalnız görünən sahənin yaxınında),
//   çox sıxlaşanlar atılır; ümumi təpə sayı büdcə ilə məhduddur.
// Koordinatlar: eni 1, hündürlüyü ASPECT (9:16 "story" vərəqi) — ixrac
// istənilən ölçüdə yenidən çəkilir.
// ═══════════════════════════════════════════════════════

export const ASPECT = 16 / 9
export const MAX_EDGE = 0.0045
export const MIN_EDGE = 0.0012
export const MAX_VERTS_PER_DROP = 2400
export const MAX_TOTAL_VERTS = 70000
export const MAX_DROPS = 220

const TAU = Math.PI * 2

/** Təkrarlana bilən təsadüfi ədəd (mulberry32) — hazır naxışlar və testlər üçün */
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Dairəvi damcı: n təpəli çoxbucaqlı */
export function makeDrop(cx, cy, r, color, n) {
  const N = n || Math.max(48, Math.min(360, Math.round((TAU * r) / (MAX_EDGE * 0.8))))
  const pts = new Array(N * 2)
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU
    pts[2 * i] = cx + r * Math.cos(a)
    pts[2 * i + 1] = cy + r * Math.sin(a)
  }
  return { color, pts }
}

/** Bir nöqtənin damcı ilə yerdəyişməsi (test və aydınlıq üçün) */
export function dropDisplace(px, py, cx, cy, r) {
  let dx = px - cx, dy = py - cy
  let d2 = dx * dx + dy * dy
  if (d2 < 1e-14) { dx = 1e-7; dy = 0; d2 = 1e-14 }
  const k = Math.sqrt(1 + (r * r) / d2)
  return [cx + dx * k, cy + dy * k]
}

/** Bütün damcıların təpələrini yeni damcı ilə itələ (yerində dəyişir) */
export function applyDrop(drops, cx, cy, r) {
  const r2 = r * r
  for (const d of drops) {
    const p = d.pts
    for (let i = 0; i < p.length; i += 2) {
      let dx = p[i] - cx, dy = p[i + 1] - cy
      let d2 = dx * dx + dy * dy
      if (d2 < 1e-14) { dx = 1e-7; dy = 0; d2 = 1e-14 }
      const k = Math.sqrt(1 + r2 / d2)
      p[i] = cx + dx * k
      p[i + 1] = cy + dy * k
    }
  }
  return drops
}

/** İynə xəttinin yerdəyişməsi: z = α·λ/(d + λ) */
export const tineShift = (d, alpha, lambda) => (alpha * lambda) / (Math.abs(d) + lambda)

/**
 * İynə/daraq xətti. tine = { bx, by, mx, my, alpha, lambda, len? }
 * len verilməyibsə (Infinity) — bütöv xətt (klassik daraq); verilibsə —
 * B-dən M boyunca len uzunluqlu seqment, uclarda yumşaq sönmə.
 */
export function tineWeight(t, len, sigma) {
  if (!Number.isFinite(len)) return 1
  const o = t < 0 ? -t : t > len ? t - len : 0
  return o === 0 ? 1 : Math.exp(-(o * o) / (sigma * sigma))
}

export function applyTine(drops, tine) {
  const { bx, by, alpha, lambda } = tine
  const len = tine.len ?? Infinity
  const m = Math.hypot(tine.mx, tine.my) || 1
  const mx = tine.mx / m, my = tine.my / m
  const sigma = Math.max(2 * lambda, 1.2 * Math.abs(alpha))
  for (const d of drops) {
    const p = d.pts
    for (let i = 0; i < p.length; i += 2) {
      const dx = p[i] - bx, dy = p[i + 1] - by
      const dist = Math.abs(dx * my - dy * mx)
      let z = (alpha * lambda) / (dist + lambda)
      if (len !== Infinity) z *= tineWeight(dx * mx + dy * my, len, sigma)
      p[i] += z * mx
      p[i + 1] += z * my
    }
  }
  return drops
}

// Kəsik [ax..bx] × [ay..by] düzbucaqlı ilə kəsişirmi (sərhəd qutusu ilə)
const boxHits = (x0, y0, x1, y1, R) =>
  Math.max(x0, x1) >= R.x0 && Math.min(x0, x1) <= R.x1 && Math.max(y0, y1) >= R.y0 && Math.min(y0, y1) <= R.y1

/** Görünən sahə (+ kənar boşluq) */
export function viewRect(margin = 0.06, w = 1, h = ASPECT) {
  return { x0: -margin, y0: -margin, x1: w + margin, y1: h + margin }
}

/**
 * Yenidən nümunələmə: görünən sahənin yaxınındakı uzun tillərə xətti ara
 * təpələr əlavə et, çox yaxın təpələri at; təpə sayı maxVerts-i keçmir.
 */
export function resample(pts, { maxEdge = MAX_EDGE, minEdge = MIN_EDGE, maxVerts = MAX_VERTS_PER_DROP, bounds = viewRect() } = {}) {
  const n = pts.length / 2
  if (n < 3) return pts
  const out = []
  let budget = maxVerts - n
  let lx = pts[0], ly = pts[1]
  out.push(lx, ly)
  for (let i = 1; i <= n; i++) {
    const j = i % n
    const x = pts[2 * j], y = pts[2 * j + 1]
    const near = boxHits(lx, ly, x, y, bounds)
    const len = Math.hypot(x - lx, y - ly)
    if (near && len > maxEdge && budget > 0) {
      const k = Math.min(Math.ceil(len / maxEdge) - 1, budget)
      for (let s = 1; s <= k; s++) {
        const f = s / (k + 1)
        out.push(lx + (x - lx) * f, ly + (y - ly) * f)
      }
      budget -= k
    }
    if (j === 0) break
    // Sıx təpəni at (görünəndən uzaqda daha iri addım); ən az 8 təpə qalsın
    const skip = near ? minEdge : minEdge * 12
    if (len < skip && out.length / 2 + (n - i) > 8) { budget++; continue }
    out.push(x, y)
    lx = x; ly = y
  }
  return out
}

/** Nöqtə çoxbucaqlının içindədirmi (cüt-tək qaydası) */
export function pointInPoly(px, py, pts) {
  let inside = false
  for (let i = 0, n = pts.length, j = n - 2; i < n; j = i, i += 2) {
    const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Damcı görünən sahəyə görə: 'cover' (bütün sahəni örtür) | 'out' (görünmür) | 'partial' */
export function classify(pts, R = viewRect(0.01)) {
  const n = pts.length
  for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
    if (boxHits(pts[j], pts[j + 1], pts[i], pts[i + 1], R)) return 'partial'
  }
  // Sərhəd sahəyə toxunmur: ya tam örtür, ya tam kənardadır
  return pointInPoly((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, pts) ? 'cover' : 'out'
}

/** Görünməyən damcıları at: tam örtən son damcıdan əvvəlkilər və kənardakılar */
export function prune(drops) {
  let cover = -1
  const kinds = drops.map(d => classify(d.pts))
  for (let i = kinds.length - 1; i >= 0; i--) if (kinds[i] === 'cover') { cover = i; break }
  const kept = drops.filter((d, i) => i >= Math.max(cover, 0) && kinds[i] !== 'out')
  return kept.length > MAX_DROPS ? kept.slice(kept.length - MAX_DROPS) : kept
}

export const vertexCount = (drops) => drops.reduce((s, d) => s + d.pts.length / 2, 0)

/** Hər əməliyyatdan sonra: nümunələmə (büdcəyə görə addım böyüyür) + təmizlik */
export function tidy(drops) {
  const total = vertexCount(drops)
  const f = Math.max(1, Math.sqrt(total / MAX_TOTAL_VERTS))
  const bounds = viewRect()
  for (const d of drops) d.pts = resample(d.pts, { maxEdge: MAX_EDGE * f, minEdge: MIN_EDGE * f, bounds })
  return prune(drops)
}

/** Bir əməliyyatı tətbiq et: { t: 'drop', x, y, r, color } | { t: 'tine', bx, by, mx, my, alpha, lambda, len? } */
export function applyOp(drops, op) {
  if (op.t === 'drop') {
    applyDrop(drops, op.x, op.y, op.r)
    drops.push(makeDrop(op.x, op.y, op.r, op.color))
  } else if (op.t === 'tine') {
    applyTine(drops, op)
  }
  return tidy(drops)
}

export const cloneDrops = (drops) => drops.map(d => ({ color: d.color, pts: d.pts.slice() }))

// ═══ Hazır klassik naxışlar ═══
// colors — boya rəngləri (fon xaric). Hər biri əməliyyatlar siyahısı qaytarır.

function battalOps(colors, rand, count = 64) {
  const ops = []
  for (let i = 0; i < count; i++) {
    ops.push({
      t: 'drop',
      x: rand() * 1.1 - 0.05,
      y: rand() * (ASPECT + 0.1) - 0.05,
      r: 0.05 + rand() * 0.09,
      color: colors[Math.floor(rand() * colors.length)],
    })
  }
  return ops
}

function gelgitOps(spacing = 0.085) {
  const ops = []
  let dir = 1
  for (let y = spacing / 2; y < ASPECT; y += spacing) {
    ops.push({ t: 'tine', bx: 0.5, by: y, mx: dir, my: 0, alpha: 0.11, lambda: 0.012 })
    dir = -dir
  }
  return ops
}

function combOps(spacing = 0.028) {
  const ops = []
  for (let x = spacing / 2; x < 1; x += spacing) {
    ops.push({ t: 'tine', bx: x, by: 0, mx: 0, my: 1, alpha: 0.045, lambda: 0.005 })
  }
  return ops
}

function flowerOps(colors, rand) {
  const ops = battalOps([colors[3], colors[0]], rand, 10).map(o => ({ ...o, r: o.r * 1.4 }))
  const cx = 0.5, cy = ASPECT * 0.4
  // İç-içə damcılar: hər yenisi əvvəlkini halqaya çevirir
  const rings = [[0.15, colors[2]], [0.11, colors[4]], [0.08, colors[2]], [0.05, colors[4]], [0.028, colors[1]]]
  for (const [r, color] of rings) ops.push({ t: 'drop', x: cx, y: cy, r, color })
  // 6 ləçək: kənardan mərkəzə doğru qısa iynə xətləri (qərənfil kimi kəsiklər)
  const R = 0.3, k = 6, rot = rand() * 0.3
  for (let i = 0; i < k; i++) {
    const a = rot + (i / k) * TAU - Math.PI / 2
    const ux = Math.cos(a), uy = Math.sin(a)
    ops.push({ t: 'tine', bx: cx + ux * R, by: cy + uy * R, mx: -ux, my: -uy, alpha: 0.1, lambda: 0.012, len: 0.2 })
  }
  // Saplaq: mərkəzin altından aşağı
  ops.push({ t: 'drop', x: cx - 0.1, y: cy + 0.36, r: 0.065, color: colors[5] })
  ops.push({ t: 'drop', x: cx + 0.1, y: cy + 0.46, r: 0.065, color: colors[5] })
  ops.push({ t: 'tine', bx: cx, by: cy + 0.12, mx: 0, my: 1, alpha: 0.16, lambda: 0.006, len: 0.42 })
  // Yarpaqlar: yaşıl damcıları saplağa doğru dartmaq
  ops.push({ t: 'tine', bx: cx - 0.17, by: cy + 0.31, mx: 1, my: 0.45, alpha: 0.08, lambda: 0.014, len: 0.14 })
  ops.push({ t: 'tine', bx: cx + 0.17, by: cy + 0.41, mx: -1, my: 0.45, alpha: 0.08, lambda: 0.014, len: 0.14 })
  return ops
}

/** Hazır naxış: 'battal' | 'gelgit' | 'tarakli' | 'flower' */
export function presetOps(name, colors, seed = Date.now()) {
  const rand = rng(seed)
  if (name === 'battal') return battalOps(colors, rand)
  if (name === 'gelgit') return [...battalOps(colors, rand), ...gelgitOps()]
  if (name === 'tarakli') return [...battalOps(colors, rand), ...gelgitOps(), ...combOps()]
  if (name === 'flower') return flowerOps(colors, rand)
  return []
}
