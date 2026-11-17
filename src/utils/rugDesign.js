// ═══════════════════════════════════════════════════════
// Səccadə dizayneri — saf həndəsə və Canvas 2D çəkilişi (components/RugDesigner.jsx)
//
// • Xalçanın əsl quruluşu: xarici haşiyə zolağı (dişli), əsas haşiyə (künclərdə
//   ayrıca kvadrat — motiv hər tərəfdə tək sayda təkrarlanır, ona görə künclər
//   və mərkəz simmetrik qalır), daxili haşiyə, ara sahə: yuxarıda mehrab
//   tağı, tağ üstündə künc sahələri (spandrel), mərkəzdə qəndil və ya medalyon,
//   qısa uclarda kilim zolağı və saçaqlar.
// • Bütün motivlər vektor yollarla prosedur çəkilir: 8 guşəli ulduz, altıbucaqlı
//   tor, lalə, qərənfil, rozet, tənək budağı, gül (səkkizbucaq), qarmaqlı romb.
//   Canlı varlıq təsviri və günbəz YOXDUR — yalnız həndəsi və bitki naxışları.
// • Hər şey sol–sağ güzgü simmetriyası ilə qurulur (sol haşiyə sağın güzgü əksidir).
// • Vahid fəzası: xalçanın gövdəsi 1000 × 1500 vahid; miqyas çəkilişdə verilir.
// • Şəbəkə, şəkil faylı, kitabxana yoxdur.
// ═══════════════════════════════════════════════════════

export const RUG_W = 1000
export const RUG_H = 1500
export const END_BAND = 16
export const FRINGE = 66
export const TOTAL_H = RUG_H + 2 * (END_BAND + FRINGE)

export const ARCHES = ['pointed', 'round', 'cusped', 'stepped', 'lancet']
export const BORDERS = ['tulip', 'star', 'hooked', 'rosette']
export const FIELDS = ['tulips', 'hex', 'stars', 'guls', 'plain']
export const MEDALLIONS = ['lantern', 'gul', 'star', 'none']
export const ZONES = ['field', 'spandrel', 'border', 'guard', 'motif', 'accent', 'outline']

export const PALETTES = [
  { id: 'madder', colors: { field: '#8c1d22', spandrel: '#1f2c58', border: '#1f2c58', guard: '#ecdfbf', motif: '#efe1bf', accent: '#cf9a36', outline: '#1c1418' } },
  { id: 'gazakh', colors: { field: '#ad3f28', spandrel: '#ebdec0', border: '#ebdec0', guard: '#2b4a6f', motif: '#2b4a6f', accent: '#e0ad42', outline: '#33201a' } },
  { id: 'teal', colors: { field: '#135a5c', spandrel: '#c79536', border: '#0c3638', guard: '#d6b25a', motif: '#ebcb78', accent: '#a8392b', outline: '#091d1f' } },
  { id: 'night', colors: { field: '#172347', spandrel: '#d7962a', border: '#0e1630', guard: '#df9f33', motif: '#f2bd48', accent: '#c4573a', outline: '#060a17' } },
]
export const paletteById = (id) => PALETTES.find(p => p.id === id) || PALETTES[0]

export const DEFAULT_OPTS = Object.freeze({
  arch: 'pointed', border: 'tulip', field: 'tulips', medallion: 'lantern', weave: true,
  colors: PALETTES[0].colors,
})

// ── Zonaların sərhədləri (vahid) ──
export const LAYOUT = Object.freeze({
  og: 36, // xarici haşiyə zolağının eni
  bw: 116, // əsas haşiyənin eni
  ig: 30, // daxili haşiyənin eni
  inset: 24, // mehrab ilə ara sahənin kənarı arasındakı zolaq
})
export function zones() {
  const { og, bw, ig, inset } = LAYOUT
  const b0 = og, b1 = og + bw, f0 = b1 + ig
  const field = { x0: f0, y0: f0, x1: RUG_W - f0, y1: RUG_H - f0 }
  return {
    body: { x0: 0, y0: 0, x1: RUG_W, y1: RUG_H },
    border: { x0: b0, y0: b0, x1: RUG_W - b0, y1: RUG_H - b0 },
    inner: { x0: b1, y0: b1, x1: RUG_W - b1, y1: RUG_H - b1 },
    field,
    niche: { x0: field.x0 + inset, x1: field.x1 - inset, y1: field.y1 - inset },
  }
}

// ── Rəng köməkçiləri ──
export function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  if (h.length !== 6 || Number.isNaN(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
export function rgbToHex([r, g, b]) { return `#${toHex(r)}${toHex(g)}${toHex(b)}` }
/** a və b rənglərinin qarışığı (t=0 → a, t=1 → b) */
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b)
  return rgbToHex([0, 1, 2].map(i => A[i] + (B[i] - A[i]) * t))
}
export function luminance(hex) {
  const c = hexToRgb(hex).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
/**
 * Verilmiş fon üçün motiv mürəkkəbləri: üstünlük sırası ilə ilk kifayət qədər
 * seçilən rəng (istifadəçi «motiv» rəngini fonla eyni seçsə belə naxış görünür).
 */
export function inksFor(bg, c) {
  const pool = [c.motif, c.accent, c.field, c.spandrel, c.border, c.guard, c.outline]
  const pick = (order, min, not) => {
    const cand = order.filter(x => x && x !== not)
    return cand.find(x => contrast(x, bg) >= min) ||
      cand.reduce((best, x) => (contrast(x, bg) > contrast(best, bg) ? x : best), cand[0])
  }
  const a = pick(pool, 1.9)
  const b = pick([c.accent, c.motif, c.field, c.spandrel, c.border, c.guard], 1.45, a)
  return { a, b, line: c.outline }
}

// ── Təsadüfi (toxumlu, deterministik) ──
export function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uzunluğa sığan TƏK sayda kafel (künc–mərkəz simmetriyası üçün) */
export function fitTiles(len, ideal) {
  let n = Math.max(1, Math.round(len / ideal))
  if (n % 2 === 0) n += (len / ideal > n) ? 1 : -1
  n = Math.max(1, n)
  return { n, step: len / n }
}

// ── Mehrab tağı ──
const ARCH_H = { round: 1, pointed: 1.28, cusped: 1.2, stepped: 1.05, lancet: 1.42 }
export function archGeometry(type) {
  const z = zones()
  const { x0, x1, y1 } = z.niche
  const a = (x1 - x0) / 2
  const yApex = z.field.y0 + 64
  const h = a * (ARCH_H[type] || ARCH_H.pointed)
  const shoulder = type === 'lancet' ? 34 : 0
  return { x0, x1, cx: (x0 + x1) / 2, a, h, yApex, ySpring: yApex + h + shoulder, yBottom: y1, shoulder }
}

function pointedArc(x0, x1, ys, h, n) {
  const a = (x1 - x0) / 2, cx = (x0 + x1) / 2
  const R = (a * a + h * h) / (2 * a)
  const pa = Math.acos(Math.max(-1, Math.min(1, (R - a) / R)))
  const left = []
  for (let i = 0; i <= n; i++) {
    const p = (pa * i) / n
    left.push([x0 + R - R * Math.cos(p), ys - R * Math.sin(p)])
  }
  left[left.length - 1] = [cx, ys - h]
  const right = left.slice(0, -1).reverse().map(([x, y]) => [2 * cx - x, y])
  return left.concat(right)
}

/** Tağ əyrisi: soldan sağa nöqtələr (yaylanma xəttindən zirvəyə və geri) */
export function archCurve(type, n = 48) {
  const g = archGeometry(type)
  const { x0, x1, cx, a, h, yApex } = g
  const ys = yApex + h
  if (type === 'round') {
    const pts = []
    for (let i = 0; i <= 2 * n; i++) {
      const t = Math.PI + (Math.PI * i) / (2 * n)
      pts.push([cx + a * Math.cos(t), ys + h * Math.sin(t)])
    }
    pts[n] = [cx, yApex]
    return pts
  }
  if (type === 'stepped') {
    const k = 5, top = a * 0.2, peak = h * 0.16
    const ws = (a - top) / k, hs = (h - peak) / k
    const left = [[x0, ys]]
    for (let i = 0; i < k; i++) {
      const y = ys - hs * (i + 1)
      left.push([x0 + ws * i, y], [x0 + ws * (i + 1), y])
    }
    left.push([cx, yApex])
    const right = left.slice(0, -1).reverse().map(([x, y]) => [2 * cx - x, y])
    return left.concat(right)
  }
  if (type === 'cusped') {
    const e = a * 0.16 // yaylanma xəttində kiçik çıxıntı (sütun başlığı kimi)
    const env = pointedArc(x0 + e, x1 - e, ys, h, 240)
    // Qövs uzunluğu ilə 7 bərabər hissə → hər hissə xaricə qabarıq yarpaq (lob)
    const L = [0]
    for (let i = 1; i < env.length; i++) L.push(L[i - 1] + Math.hypot(env[i][0] - env[i - 1][0], env[i][1] - env[i - 1][1]))
    const total = L[L.length - 1], lobes = 7
    const at = (s) => {
      let i = 1
      while (i < L.length - 1 && L[i] < s) i++
      const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1)
      return [env[i - 1][0] + (env[i][0] - env[i - 1][0]) * t, env[i - 1][1] + (env[i][1] - env[i - 1][1]) * t]
    }
    const pts = []
    const per = Math.max(6, Math.round(n / 4))
    for (let j = 0; j < lobes; j++) {
      const P = at((total * j) / lobes), Q = at((total * (j + 1)) / lobes)
      const dx = Q[0] - P[0], dy = Q[1] - P[1], len = Math.hypot(dx, dy) || 1
      const nx = dy / len, ny = -dx / len // xaricə normal
      const d = len * 0.3
      for (let i = j === 0 ? 0 : 1; i <= per; i++) {
        const u = i / per, b = Math.sin(Math.PI * u) * d
        pts.push([P[0] + dx * u + nx * b, P[1] + dy * u + ny * b])
      }
    }
    // dəqiq simmetriya: sağ yarını solun güzgüsü ilə əvəz et
    const half = Math.floor(pts.length / 2)
    const left = pts.slice(0, half + 1)
    if (pts.length % 2 === 1) left[half] = [cx, left[half][1]]
    const right = left.slice(0, pts.length % 2 === 1 ? -1 : undefined).reverse().map(([x, y]) => [2 * cx - x, y])
    return [[x0, ys], ...left.concat(right), [x1, ys]]
  }
  if (type === 'lancet') {
    // Osmanlı tipli: çiyinli (pilləli) şiş tağ, zirvədə yüngül «omurğa» (ogee) ucu
    const s = g.shoulder
    const arc = pointedArc(x0 + s, x1 - s, ys, h, n)
    const k = a * 0.2, kh = h * 0.07
    const out = arc.map(([x, y]) => {
      const d = Math.abs(x - cx)
      return d < k ? [x, y - kh * (1 - d / k) ** 2] : [x, y]
    })
    return [[x0, ys + s], [x0 + s * 0.5, ys + s * 0.5], ...out, [x1 - s * 0.5, ys + s * 0.5], [x1, ys + s]]
  }
  return pointedArc(x0, x1, ys, h, n)
}

/** Mehrab (taxça) çoxbucaqlısı: sol alt → yuxarı → tağ → sağ alt */
export function nichePolygon(type) {
  const g = archGeometry(type)
  const c = archCurve(type)
  return [[g.x0, g.yBottom], ...c, [g.x1, g.yBottom]]
}

export function pointInPoly(x, y, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const l2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}
const spotCache = new Map()
/** Sol künc sahəsində (spandrel) ən böyük daxili çevrə: { x, y, r } */
export function spandrelSpot(type) {
  if (spotCache.has(type)) return spotCache.get(type)
  const poly = nichePolygon(type)
  const f = zones().field
  const g = archGeometry(type)
  let best = { x: f.x0 + 40, y: f.y0 + 40, r: 10 }
  for (let y = f.y0 + 8; y < g.ySpring; y += 5) {
    for (let x = f.x0 + 8; x < g.cx - 8; x += 5) {
      if (pointInPoly(x, y, poly)) continue
      let d = Math.min(x - f.x0, y - f.y0)
      if (d <= best.r) continue
      for (let i = 1; i < poly.length && d > best.r; i++) {
        d = Math.min(d, segDist(x, y, poly[i - 1][0], poly[i - 1][1], poly[i][0], poly[i][1]))
      }
      if (d > best.r) best = { x, y, r: d }
    }
  }
  spotCache.set(type, best)
  return best
}

// ═══════════════ Çəkiliş köməkçiləri ═══════════════
function poly(ctx, pts, close = true) {
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  if (close) ctx.closePath()
}
function fillStroke(ctx, fill, line, lw) {
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (line && lw) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke() }
}
export function starPoints(cx, cy, r, rot = 0) {
  const ri = r * 0.7654
  const pts = []
  for (let i = 0; i < 16; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 8
    const rr = i % 2 ? ri : r
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return pts
}
export function octPoints(cx, cy, r) {
  const pts = []
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}
function star(ctx, cx, cy, r, fill, line, lw, rot = 0) {
  ctx.beginPath(); poly(ctx, starPoints(cx, cy, r, rot)); fillStroke(ctx, fill, line, lw)
}
function oct(ctx, cx, cy, r, fill, line, lw) {
  ctx.beginPath(); poly(ctx, octPoints(cx, cy, r)); fillStroke(ctx, fill, line, lw)
}
function diamond(ctx, cx, cy, w, h, fill, line, lw) {
  ctx.beginPath(); poly(ctx, [[cx, cy - h], [cx + w, cy], [cx, cy + h], [cx - w, cy]]); fillStroke(ctx, fill, line, lw)
}
function dot(ctx, x, y, r, fill) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill()
}
/** Yarpaq (lens): (x,y) dibindən ang istiqamətində */
function leaf(ctx, x, y, ang, len, w, fill, line, lw) {
  const c = Math.cos(ang), s = Math.sin(ang)
  const tx = x + c * len, ty = y + s * len
  const mx = x + c * len * 0.5, my = y + s * len * 0.5
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(mx - s * w, my + c * w, tx, ty)
  ctx.quadraticCurveTo(mx + s * w, my - c * w, x, y)
  fillStroke(ctx, fill, line, lw)
  if (line) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + c * len * 0.8, y + s * len * 0.8)
    ctx.strokeStyle = line; ctx.lineWidth = lw * 0.6; ctx.stroke()
  }
}
function rosette(ctx, cx, cy, r, petals, fill, inner, line, lw) {
  const ri = r * 0.32
  ctx.beginPath()
  for (let i = 0; i < petals; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / petals
    const d = Math.PI / petals
    const p0 = [cx + ri * Math.cos(a - d), cy + ri * Math.sin(a - d)]
    const tip = [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    const c1 = [cx + r * 0.98 * Math.cos(a - d * 0.9), cy + r * 0.98 * Math.sin(a - d * 0.9)]
    const c2 = [cx + r * 0.98 * Math.cos(a + d * 0.9), cy + r * 0.98 * Math.sin(a + d * 0.9)]
    const p1 = [cx + ri * Math.cos(a + d), cy + ri * Math.sin(a + d)]
    if (i === 0) ctx.moveTo(p0[0], p0[1])
    ctx.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1])
    ctx.quadraticCurveTo(c2[0], c2[1], p1[0], p1[1])
  }
  ctx.closePath()
  fillStroke(ctx, fill, line, lw)
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.36, 0, Math.PI * 2); fillStroke(ctx, inner, line, lw)
  dot(ctx, cx, cy, r * 0.13, line || fill)
}
/** Lalə — dibi (cx, by), yuxarı (−y) baxır, ölçü s */
function tulip(ctx, cx, by, s, fill, inner, line, lw) {
  ctx.beginPath()
  ctx.moveTo(cx, by)
  ctx.quadraticCurveTo(cx - s * 0.52, by - s * 0.32, cx - s * 0.4, by - s * 0.98)
  ctx.quadraticCurveTo(cx - s * 0.24, by - s * 0.68, cx - s * 0.13, by - s * 0.62)
  ctx.quadraticCurveTo(cx - s * 0.1, by - s * 0.92, cx, by - s * 1.12)
  ctx.quadraticCurveTo(cx + s * 0.1, by - s * 0.92, cx + s * 0.13, by - s * 0.62)
  ctx.quadraticCurveTo(cx + s * 0.24, by - s * 0.68, cx + s * 0.4, by - s * 0.98)
  ctx.quadraticCurveTo(cx + s * 0.52, by - s * 0.32, cx, by)
  ctx.closePath()
  fillStroke(ctx, fill, line, lw)
  ctx.beginPath()
  ctx.moveTo(cx, by - s * 0.12)
  ctx.quadraticCurveTo(cx - s * 0.2, by - s * 0.4, cx, by - s * 0.66)
  ctx.quadraticCurveTo(cx + s * 0.2, by - s * 0.4, cx, by - s * 0.12)
  fillStroke(ctx, inner, null, 0)
}
/** Qərənfil (yelpik formalı, dişli kənar, kasacıq) */
function carnation(ctx, cx, by, s, fill, inner, line, lw) {
  const cy = by - s * 0.4
  const fan = (r1, r2, n) => {
    ctx.beginPath()
    ctx.moveTo(cx - s * 0.16, cy)
    for (let i = 0; i <= 2 * n; i++) {
      const a = Math.PI * 1.06 + (Math.PI * 0.88 * i) / (2 * n)
      const r = i % 2 ? r2 : r1
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
    }
    ctx.lineTo(cx + s * 0.16, cy)
    ctx.closePath()
  }
  fan(s * 0.64, s * 0.5, 7)
  fillStroke(ctx, fill, line, lw)
  fan(s * 0.38, s * 0.3, 5)
  fillStroke(ctx, inner, null, 0)
  // kasacıq
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.08, by)
  ctx.lineTo(cx - s * 0.2, cy + s * 0.04)
  ctx.lineTo(cx - s * 0.1, cy - s * 0.06)
  ctx.lineTo(cx, cy + s * 0.02)
  ctx.lineTo(cx + s * 0.1, cy - s * 0.06)
  ctx.lineTo(cx + s * 0.2, cy + s * 0.04)
  ctx.lineTo(cx + s * 0.08, by)
  ctx.closePath()
  fillStroke(ctx, inner, line, lw)
}
/** Pilləli romb nöqtələri (toxunuş pikselinə bənzər pillələr) */
export function steppedDiamond(cx, cy, w, h, k = 4) {
  const q = []
  for (let i = 0; i < k; i++) {
    const x0 = (w * i) / k, x1 = (w * (i + 1)) / k
    const y0 = -h + (h * i) / k, y1 = -h + (h * (i + 1)) / k
    q.push([x0, y0], [x1, y0], [x1, y1])
  }
  q.pop()
  q.push([w, 0])
  const quad = q // yuxarı-sağ dörddəbir: (0,-h) → (w,0)
  const out = []
  for (const [x, y] of quad) out.push([cx + x, cy + y])
  for (let i = quad.length - 2; i >= 0; i--) out.push([cx + quad[i][0], cy - quad[i][1]])
  for (let i = 1; i < quad.length; i++) out.push([cx - quad[i][0], cy - quad[i][1]])
  for (let i = quad.length - 2; i > 0; i--) out.push([cx - quad[i][0], cy + quad[i][1]])
  return out
}
/** Qarmaqlı romb (Qafqaz): pilləli romb, yuxarı və aşağı zirvədə qoşa qarmaq */
function hookedLozenge(ctx, cx, cy, w, h, fill, inner, line, lw) {
  const hl = Math.min(w, h) * 0.34
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
  for (const sy of [-1, 1]) {
    const ty = cy + sy * h
    ctx.beginPath()
    ctx.moveTo(cx, ty); ctx.lineTo(cx, ty + sy * hl * 0.55)
    for (const sx of [-1, 1]) {
      ctx.moveTo(cx, ty + sy * hl * 0.55)
      ctx.lineTo(cx + sx * hl, ty + sy * hl * 0.55)
      ctx.lineTo(cx + sx * hl, ty + sy * hl * 0.05)
    }
    ctx.strokeStyle = line; ctx.lineWidth = lw * 3.2; ctx.stroke()
    ctx.strokeStyle = fill; ctx.lineWidth = lw * 1.4; ctx.stroke()
  }
  ctx.beginPath(); poly(ctx, steppedDiamond(cx, cy, w, h, 4)); fillStroke(ctx, fill, line, lw)
  ctx.beginPath(); poly(ctx, steppedDiamond(cx, cy, w * 0.62, h * 0.62, 3)); fillStroke(ctx, inner, line, lw)
  diamond(ctx, cx, cy, w * 0.24, h * 0.24, fill, line, lw)
}
/** Kiçik gül (səkkizbucaq, X ilə dörd hissə) */
function miniGul(ctx, cx, cy, r, A, B, line, lw) {
  oct(ctx, cx, cy, r, A, line, lw)
  ctx.save()
  ctx.beginPath(); poly(ctx, octPoints(cx, cy, r * 0.74)); ctx.clip()
  ctx.beginPath(); poly(ctx, octPoints(cx, cy, r * 0.74)); fillStroke(ctx, B, null, 0)
  ctx.beginPath()
  ctx.moveTo(cx, cy); ctx.lineTo(cx - r, cy - r); ctx.lineTo(cx + r, cy - r); ctx.closePath()
  ctx.moveTo(cx, cy); ctx.lineTo(cx - r, cy + r); ctx.lineTo(cx + r, cy + r); ctx.closePath()
  fillStroke(ctx, A, null, 0)
  ctx.beginPath()
  ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r); ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r)
  ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke()
  ctx.restore()
  ctx.beginPath(); poly(ctx, octPoints(cx, cy, r * 0.74)); fillStroke(ctx, null, line, lw)
  star(ctx, cx, cy, r * 0.3, B, line, lw * 0.8)
}

// ═══════════════ Haşiyələr ═══════════════
/** Haşiyə kafeli lokal koordinatda: zolaq x boyunca, y=0 xarici kənar, y=bw daxili */
function borderTile(ctx, style, cx, tw, bw, i, ink, ground) {
  const m = bw / 2
  const lw = 2.6
  if (style === 'star') {
    star(ctx, cx, m, bw * 0.36, ink.a, ink.line, lw)
    star(ctx, cx, m, bw * 0.2, ink.b, ink.line, lw, Math.PI / 8)
    dot(ctx, cx, m, bw * 0.06, ground)
  } else if (style === 'hooked') {
    hookedLozenge(ctx, cx, m, tw * 0.3, bw * 0.3, ink.a, ink.b, ink.line, lw)
  } else if (style === 'rosette') {
    ctx.beginPath(); ctx.moveTo(cx - tw / 2, m); ctx.lineTo(cx + tw / 2, m)
    ctx.strokeStyle = ink.b; ctx.lineWidth = 5; ctx.stroke()
    for (const sx of [-1, 1]) {
      leaf(ctx, cx + sx * tw * 0.5, m, -Math.PI / 2 - sx * 0.7, bw * 0.3, bw * 0.09, ink.b, ink.line, 1.8)
      leaf(ctx, cx + sx * tw * 0.5, m, Math.PI / 2 + sx * 0.7, bw * 0.3, bw * 0.09, ink.b, ink.line, 1.8)
    }
    rosette(ctx, cx, m, bw * 0.34, 8, ink.a, ink.b, ink.line, lw)
  } else {
    // tənək budağı + növbəli lalə/qərənfil (tək say → simmetrik)
    const amp = bw * 0.2
    ctx.beginPath()
    for (let k = 0; k <= 24; k++) {
      const x = cx - tw / 2 + (tw * k) / 24
      const y = m + amp * Math.cos((2 * Math.PI * (x - cx)) / tw)
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = ink.line; ctx.lineWidth = 7; ctx.stroke()
    ctx.strokeStyle = ink.b; ctx.lineWidth = 3.6; ctx.stroke()
    for (const sx of [-1, 1]) {
      const ex = cx + sx * tw * 0.5
      leaf(ctx, ex - sx * 4, m - amp, -Math.PI / 2 + sx * 0.55, bw * 0.26, bw * 0.08, ink.b, ink.line, 1.6)
      leaf(ctx, cx + sx * tw * 0.28, m + amp * 0.1, Math.PI / 2 + sx * 0.9, bw * 0.2, bw * 0.065, ink.b, ink.line, 1.4)
    }
    const base = m + amp + 2
    if (i % 2 === 0) tulip(ctx, cx, base, bw * 0.6, ink.a, ink.b, ink.line, lw)
    else carnation(ctx, cx, base, bw * 0.62, ink.a, ink.b, ink.line, lw)
  }
}
function borderJoin(ctx, style, x, bw, ink) {
  const m = bw / 2
  if (style === 'star') diamond(ctx, x, m, bw * 0.1, bw * 0.2, ink.b, ink.line, 2)
  else if (style === 'hooked') {
    diamond(ctx, x, bw * 0.12, bw * 0.08, bw * 0.08, ink.b, ink.line, 1.6)
    diamond(ctx, x, bw * 0.88, bw * 0.08, bw * 0.08, ink.b, ink.line, 1.6)
  }
}
function cornerMotif(ctx, style, cx, cy, bw, ink, ground) {
  if (style === 'hooked') {
    miniGul(ctx, cx, cy, bw * 0.36, ink.a, ink.b, ink.line, 2.4)
  } else if (style === 'star') {
    star(ctx, cx, cy, bw * 0.38, ink.a, ink.line, 2.6)
    star(ctx, cx, cy, bw * 0.22, ink.b, ink.line, 2.2, Math.PI / 8)
    dot(ctx, cx, cy, bw * 0.06, ground)
  } else {
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2
      leaf(ctx, cx, cy, a, bw * 0.46, bw * 0.1, ink.b, ink.line, 1.8)
    }
    rosette(ctx, cx, cy, bw * 0.32, 8, ink.a, ink.b, ink.line, 2.4)
  }
}

/** Bir tərəf boyunca: transform artıq qurulub, x ∈ [0,len] */
function sideRun(ctx, len, ideal, draw, join) {
  const { n, step } = fitTiles(len, ideal)
  for (let i = 0; i < n; i++) draw((i + 0.5) * step, step, i)
  if (join) for (let i = 1; i < n; i++) join(i * step)
}
/**
 * Halqa zolağını 4 tərəfdə çək. r — zolağın xarici düzbucaqlısı, w — eni.
 * Sol tərəf sağın güzgü əksidir → sol–sağ simmetriya avtomatik.
 */
function ring(ctx, r, w, ideal, draw, join, corner) {
  const W = r.x1 - r.x0, H = r.y1 - r.y0
  const sides = [
    { tx: r.x0 + w, ty: r.y0, rot: 0, len: W - 2 * w },
    { tx: r.x1 - w, ty: r.y1, rot: Math.PI, len: W - 2 * w },
    { tx: r.x1, ty: r.y0 + w, rot: Math.PI / 2, len: H - 2 * w },
    { tx: r.x1, ty: r.y0 + w, rot: Math.PI / 2, len: H - 2 * w, mirror: true },
  ]
  for (const s of sides) {
    ctx.save()
    if (s.mirror) { ctx.translate(RUG_W, 0); ctx.scale(-1, 1) }
    ctx.translate(s.tx, s.ty); ctx.rotate(s.rot)
    sideRun(ctx, s.len, ideal, draw, join)
    ctx.restore()
  }
  if (corner) {
    for (const [x, y] of [[r.x0, r.y0], [r.x1 - w, r.y0], [r.x0, r.y1 - w], [r.x1 - w, r.y1 - w]]) corner(x + w / 2, y + w / 2)
  }
}
function ringPath(ctx, outer, w) {
  ctx.beginPath()
  ctx.rect(outer.x0, outer.y0, outer.x1 - outer.x0, outer.y1 - outer.y0)
  ctx.rect(outer.x0 + w, outer.y0 + w, outer.x1 - outer.x0 - 2 * w, outer.y1 - outer.y0 - 2 * w)
}

// ═══════════════ Ara sahə naxışları ═══════════════
function fieldPattern(ctx, kind, g, ink0, ground) {
  // xalçada şəffaflıq yoxdur — sakit tonlar qarışdırılmış rənglərdir
  const ink = { a: mix(ink0.a, ground, 0.42), b: mix(ink0.b, ground, 0.35), line: ink0.line }
  const cx = g.cx
  const top = g.yApex - 40, bottom = g.yBottom + 40
  const x0 = g.x0 - 60, x1 = g.x1 + 60
  ctx.save()
  if (kind === 'hex') {
    const s = 40, w = Math.sqrt(3) * s
    for (let row = 0, y = top; y < bottom; row++, y += 1.5 * s) {
      const off = row % 2 ? w / 2 : 0
      for (let i = -12; i <= 12; i++) {
        const x = cx + i * w + off
        if (x < x0 || x > x1) continue
        ctx.beginPath()
        for (let k = 0; k < 6; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 3
          const px = x + s * Math.cos(a), py = y + s * Math.sin(a)
          if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py)
        }
        ctx.closePath()
        ctx.strokeStyle = ink.a; ctx.lineWidth = 3; ctx.stroke()
        star(ctx, x, y, 11, ink.b, null, 0)
      }
    }
  } else if (kind === 'stars') {
    const dx = 78, dy = 68
    for (let row = 0, y = top; y < bottom; row++, y += dy) {
      const off = row % 2 ? dx / 2 : 0
      for (let i = -10; i <= 10; i++) {
        const x = cx + i * dx + off
        if (x < x0 || x > x1) continue
        if (row % 2) diamond(ctx, x, y, 9, 14, ink.b, null, 0)
        else { star(ctx, x, y, 20, ink.a, null, 0); dot(ctx, x, y, 5, ground) }
      }
    }
  } else if (kind === 'tulips') {
    const dx = 96, dy = 120
    ctx.strokeStyle = ink.b; ctx.lineWidth = 2.4
    for (let row = 0, y = top; y < bottom; row++, y += dy / 2) {
      const off = row % 2 ? dx / 2 : 0
      for (let i = -8; i <= 8; i++) {
        const x = cx + i * dx + off
        if (x < x0 || x > x1) continue
        ctx.beginPath(); poly(ctx, [[x, y - dy / 2], [x + dx / 2, y], [x, y + dy / 2], [x - dx / 2, y]]); ctx.stroke()
        tulip(ctx, x, y + 22, 34, ink.a, ink.b, null, 0)
        leaf(ctx, x, y + 22, -Math.PI / 2 - 1.15, 18, 5, ink.a, null, 0)
        leaf(ctx, x, y + 22, -Math.PI / 2 + 1.15, 18, 5, ink.a, null, 0)
        dot(ctx, x + dx / 2, y, 4, ink.a)
      }
    }
  } else if (kind === 'guls') {
    const dx = 112, dy = 100
    for (let row = 0, y = top; y < bottom; row++, y += dy) {
      const off = row % 2 ? dx / 2 : 0
      for (let i = -8; i <= 8; i++) {
        const x = cx + i * dx + off
        if (x < x0 || x > x1) continue
        miniGul(ctx, x, y, 28, ink.a, ground, ink.b, 2)
      }
    }
  }
  ctx.restore()
}

// ═══════════════ Medalyon / qəndil ═══════════════
const LAMP = [
  [0.05, 0], [0.05, 0.035], [0.17, 0.1], [0.19, 0.135], [0.085, 0.2], [0.085, 0.255],
  [0.25, 0.37], [0.275, 0.49], [0.225, 0.61], [0.1, 0.735], [0.06, 0.8], [0.13, 0.875], [0.13, 0.91],
]
export function lampPolygon(cx, top, H) {
  const right = LAMP.map(([x, y]) => [cx + x * H, top + y * H])
  const left = LAMP.slice().reverse().map(([x, y]) => [cx - x * H, top + y * H])
  return right.concat(left)
}
function chain(ctx, x, y0, y1, c, line) {
  ctx.save()
  ctx.lineCap = 'round'
  for (let y = y0, k = 0; y < y1; y += 11, k++) {
    ctx.beginPath()
    if (k % 2) ctx.ellipse(x, y + 5, 2.6, 6, 0, 0, Math.PI * 2)
    else ctx.ellipse(x, y + 5, 4.4, 6, 0, 0, Math.PI * 2)
    ctx.strokeStyle = line; ctx.lineWidth = 4.2; ctx.stroke()
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke()
  }
  ctx.restore()
}
function slantChain(ctx, ax, ay, bx, by, c, line) {
  ctx.save()
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by)
  ctx.setLineDash([7, 4]); ctx.lineCap = 'round'
  ctx.strokeStyle = line; ctx.lineWidth = 4.4; ctx.stroke()
  ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.stroke()
  ctx.restore()
}
function lantern(ctx, g, c, ink, field) {
  const H = Math.min(330, (g.yBottom - g.yApex) * 0.36)
  const cx = g.cx
  const top = Math.max(g.ySpring - H * 0.42, g.yApex + 150)
  const ringY = top - H * 0.2
  const P = lampPolygon(cx, top, H)
  // sakit fon yastığı (sahə naxışı qəndilə toxunmasın) və yumşaq işıq
  ctx.beginPath(); ctx.ellipse(cx, top + H * 0.5, H * 0.46, H * 0.66, 0, 0, Math.PI * 2)
  ctx.fillStyle = field; ctx.fill()
  const glow = ctx.createRadialGradient(cx, top + H * 0.48, H * 0.05, cx, top + H * 0.48, H * 0.7)
  glow.addColorStop(0, mix(field, c.motif, 0.2))
  glow.addColorStop(1, field)
  ctx.beginPath(); ctx.ellipse(cx, top + H * 0.5, H * 0.46, H * 0.66, 0, 0, Math.PI * 2)
  ctx.fillStyle = glow; ctx.fill()
  ctx.strokeStyle = mix(ink.b, field, 0.35); ctx.lineWidth = 3
  ctx.setLineDash([3, 9]); ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt'
  chain(ctx, cx, g.yApex + 10, ringY - 8, ink.a, ink.line)
  for (const sx of [-1, 1]) slantChain(ctx, cx, ringY, cx + sx * 0.235 * H, top + 0.34 * H, ink.a, ink.line)
  ctx.beginPath(); ctx.arc(cx, ringY, 9, 0, Math.PI * 2); fillStroke(ctx, ink.a, ink.line, 3)
  // gövdə
  ctx.lineJoin = 'miter'
  ctx.beginPath(); poly(ctx, P); fillStroke(ctx, ink.a, ink.line, 4)
  ctx.save()
  ctx.beginPath(); poly(ctx, P); ctx.clip()
  const band = (y0, y1, col) => { ctx.fillStyle = col; ctx.fillRect(cx - H, top + y0 * H, 2 * H, (y1 - y0) * H) }
  band(0.1, 0.135, ink.b)
  band(0.3, 0.345, ink.b)
  band(0.655, 0.69, ink.b)
  ctx.strokeStyle = ink.line; ctx.lineWidth = 2.2
  for (const y of [0.1, 0.135, 0.3, 0.345, 0.655, 0.69]) {
    ctx.beginPath(); ctx.moveTo(cx - H, top + y * H); ctx.lineTo(cx + H, top + y * H); ctx.stroke()
  }
  for (let k = -3; k <= 3; k++) dot(ctx, cx + k * H * 0.06, top + 0.3225 * H, H * 0.008, ink.line)
  // gövdədə 8 guşəli ulduz və iki kiçik romb
  star(ctx, cx, top + 0.49 * H, H * 0.13, ink.b, ink.line, 2.6)
  star(ctx, cx, top + 0.49 * H, H * 0.065, ink.a, ink.line, 2, Math.PI / 8)
  for (const sx of [-1, 1]) diamond(ctx, cx + sx * H * 0.19, top + 0.49 * H, H * 0.025, H * 0.05, ink.b, ink.line, 1.6)
  ctx.restore()
  // qulplar
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.arc(cx + sx * 0.235 * H, top + 0.34 * H, 7, 0, Math.PI * 2); fillStroke(ctx, null, ink.line, 4)
  }
  // aşağı asma: kiçik romb və damcı
  const by = top + 0.91 * H
  ctx.beginPath(); ctx.moveTo(cx, by); ctx.lineTo(cx, by + 22); ctx.strokeStyle = ink.line; ctx.lineWidth = 3; ctx.stroke()
  diamond(ctx, cx, by + 34, 10, 14, ink.b, ink.line, 2)
  ctx.beginPath(); ctx.moveTo(cx, by + 48)
  ctx.quadraticCurveTo(cx + 9, by + 62, cx, by + 72); ctx.quadraticCurveTo(cx - 9, by + 62, cx, by + 48)
  fillStroke(ctx, ink.a, ink.line, 2)
}
function pendant(ctx, g, ink) {
  chain(ctx, g.cx, g.yApex + 10, g.yApex + 76, ink.a, ink.line)
  star(ctx, g.cx, g.yApex + 98, 20, ink.a, ink.line, 2.4)
  dot(ctx, g.cx, g.yApex + 98, 6, ink.b)
}
function medallionCenter(g) {
  const R = Math.min(g.a * 0.62, (g.yBottom - g.ySpring) * 0.36)
  return { cx: g.cx, cy: g.ySpring + (g.yBottom - g.ySpring) * 0.46, R }
}
function gulMedallion(ctx, g, ink, field) {
  const { cx, cy, R } = medallionCenter(g)
  oct(ctx, cx, cy, R + 30, field, null, 0)
  // xaricdə pilləli dişlər (hər tərəfin ortasında) və zirvələrdə kiçik romblar
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4
    const ca = Math.cos(a), sa = Math.sin(a)
    const rr = R * Math.cos(Math.PI / 8)
    const t = R * 0.16
    const pts = [[-t, 0], [-t, 10], [-t * 0.5, 10], [-t * 0.5, 20], [t * 0.5, 20], [t * 0.5, 10], [t, 10], [t, 0]]
      .map(([u, v]) => [cx + ca * (rr - 2 + v) - sa * u, cy + sa * (rr - 2 + v) + ca * u])
    ctx.beginPath(); poly(ctx, pts); fillStroke(ctx, ink.b, ink.line, 2.4)
    const va = Math.PI / 8 + a
    diamond(ctx, cx + (R + 16) * Math.cos(va), cy + (R + 16) * Math.sin(va), 6, 6, ink.a, ink.line, 1.6)
  }
  oct(ctx, cx, cy, R, ink.a, ink.line, 4)
  oct(ctx, cx, cy, R * 0.86, ink.b, ink.line, 3)
  const r = R * 0.72
  ctx.save()
  ctx.beginPath(); poly(ctx, octPoints(cx, cy, r)); ctx.clip()
  ctx.fillStyle = field; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r)
  ctx.beginPath()
  ctx.moveTo(cx, cy); ctx.lineTo(cx - r * 1.2, cy - r * 1.2); ctx.lineTo(cx + r * 1.2, cy - r * 1.2); ctx.closePath()
  ctx.moveTo(cx, cy); ctx.lineTo(cx - r * 1.2, cy + r * 1.2); ctx.lineTo(cx + r * 1.2, cy + r * 1.2); ctx.closePath()
  fillStroke(ctx, ink.a, null, 0)
  ctx.beginPath()
  ctx.moveTo(cx - r * 1.2, cy - r * 1.2); ctx.lineTo(cx + r * 1.2, cy + r * 1.2)
  ctx.moveTo(cx + r * 1.2, cy - r * 1.2); ctx.lineTo(cx - r * 1.2, cy + r * 1.2)
  ctx.strokeStyle = ink.line; ctx.lineWidth = 6; ctx.stroke()
  ctx.strokeStyle = ink.b; ctx.lineWidth = 2.4; ctx.stroke()
  // dörd hissədə kiçik motivlər: yuxarı/aşağı — qarmaqlı romb, sol/sağ — lalə
  for (const sy of [-1, 1]) hookedLozenge(ctx, cx, cy + sy * r * 0.62, r * 0.2, r * 0.17, field, ink.b, ink.line, 2)
  for (const sx of [-1, 1]) {
    diamond(ctx, cx + sx * r * 0.6, cy, r * 0.13, r * 0.22, ink.b, ink.line, 2)
    dot(ctx, cx + sx * r * 0.6, cy, r * 0.05, ink.a)
  }
  ctx.restore()
  ctx.beginPath(); poly(ctx, octPoints(cx, cy, r)); fillStroke(ctx, null, ink.line, 3)
  oct(ctx, cx, cy, r * 0.32, ink.b, ink.line, 3)
  star(ctx, cx, cy, r * 0.24, ink.a, ink.line, 2.4)
  dot(ctx, cx, cy, r * 0.06, ink.line)
  // yuxarı və aşağı «baş» — kiçik pilləli romb
  for (const sy of [-1, 1]) {
    diamond(ctx, cx, cy + sy * (R + 44), 18, 22, ink.a, ink.line, 2.4)
    diamond(ctx, cx, cy + sy * (R + 44), 8, 10, ink.b, null, 0)
  }
}
function starMedallion(ctx, g, ink, field) {
  const { cx, cy, R } = medallionCenter(g)
  star(ctx, cx, cy, R * 1.08, null, field, 36)
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 4
    diamond(ctx, cx + (R + 34) * Math.cos(a), cy + (R + 34) * Math.sin(a), 9, 9, ink.b, ink.line, 2)
  }
  star(ctx, cx, cy, R, ink.a, ink.line, 4)
  star(ctx, cx, cy, R * 0.78, ink.b, ink.line, 3, Math.PI / 8)
  oct(ctx, cx, cy, R * 0.5, field, ink.line, 3)
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 4
    leaf(ctx, cx, cy, a, R * 0.44, R * 0.07, ink.a, ink.line, 1.8)
  }
  rosette(ctx, cx, cy, R * 0.22, 8, ink.b, ink.a, ink.line, 2.2)
}

// ═══════════════ Kilim zolağı və saçaqlar ═══════════════
function fringes(ctx, c) {
  const yarn = mix('#f3ead6', c.guard, 0.12)
  const shade = mix(yarn, '#5a4a36', 0.35)
  const n = 84
  const step = RUG_W / n
  for (const end of [-1, 1]) {
    const y0 = end < 0 ? -END_BAND : RUG_H + END_BAND
    // saçaqlar (hər qrup — bir düyün)
    for (let i = 0; i < n; i++) {
      const mi = Math.min(i, n - 1 - i)
      const r = rng(97 + mi * 13 + (end > 0 ? 5000 : 0))
      const side = i < n / 2 ? -1 : 1
      const x = (i + 0.5) * step
      const len = FRINGE * (0.8 + r() * 0.2)
      const sway = side * (r() * 5 + 1)
      const knotY = y0 + end * 14
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath()
        ctx.moveTo(x + s * 2.2, y0)
        ctx.lineTo(x + s * 0.8, knotY)
        ctx.quadraticCurveTo(x + s * 2.5 + sway * 0.4, knotY + end * len * 0.5, x + s * 3 + sway, y0 + end * len)
        ctx.strokeStyle = s ? shade : yarn
        ctx.lineWidth = s ? 2.4 : 3.2
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      ctx.beginPath(); ctx.ellipse(x, knotY, 4.2, 3.2, 0, 0, Math.PI * 2)
      ctx.fillStyle = yarn; ctx.fill(); ctx.strokeStyle = shade; ctx.lineWidth = 1.2; ctx.stroke()
    }
    // kilim zolağı (düz toxuma)
    const by = end < 0 ? -END_BAND : RUG_H
    ctx.fillStyle = mix(c.guard, yarn, 0.45)
    ctx.fillRect(0, by, RUG_W, END_BAND)
    ctx.strokeStyle = mix(c.outline, yarn, 0.3); ctx.lineWidth = 2
    for (const f of [0.3, 0.7]) {
      ctx.beginPath(); ctx.moveTo(0, by + END_BAND * f); ctx.lineTo(RUG_W, by + END_BAND * f); ctx.stroke()
    }
  }
}

// ═══════════════ Toxuma faktura ═══════════════
function weave(ctx, pitch) {
  ctx.save()
  ctx.beginPath(); ctx.rect(0, 0, RUG_W, RUG_H); ctx.clip()
  ctx.lineWidth = pitch * 0.18
  ctx.strokeStyle = 'rgba(0,0,0,0.11)'
  ctx.beginPath()
  for (let y = pitch; y < RUG_H; y += pitch) { ctx.moveTo(0, y); ctx.lineTo(RUG_W, y) }
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'
  ctx.lineWidth = pitch * 0.14
  ctx.setLineDash([pitch * 0.55, pitch * 0.45])
  ctx.beginPath()
  for (let x = pitch / 2; x < RUG_W; x += pitch) { ctx.moveTo(x, 0); ctx.lineTo(x, RUG_H) }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = pitch * 0.16
  ctx.beginPath()
  for (let y = pitch * 0.5; y < RUG_H; y += pitch) { ctx.moveTo(0, y); ctx.lineTo(RUG_W, y) }
  ctx.stroke()
  ctx.restore()
}
/** Abraş — boyanın partiyadan partiyaya yüngül fərqi (üfüqi zolaqlar) */
function abrash(ctx) {
  const r = rng(2010)
  for (let y = 0; y < RUG_H;) {
    const h = 40 + r() * 140
    const v = r()
    ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${(0.05 * (0.5 - v)).toFixed(3)})` : `rgba(255,255,255,${(0.05 * (v - 0.5)).toFixed(3)})`
    ctx.fillRect(0, y, RUG_W, h)
    y += h
  }
}

/** Xalçanın gövdəsini vahid fəzasında çək (0..1000 × 0..1500), saçaqlar xaricdə */
export function drawRug(ctx, opts, px = 1) {
  const o = { ...DEFAULT_OPTS, ...opts }
  const c = { ...DEFAULT_OPTS.colors, ...(o.colors || {}) }
  const z = zones()
  const { og, bw, ig } = LAYOUT
  ctx.save()
  ctx.lineJoin = 'round'
  fringes(ctx, c)
  ctx.fillStyle = c.outline
  ctx.fillRect(0, 0, RUG_W, RUG_H)

  // 1) Xarici haşiyə: diş-diş (qarşılıqlı üçbucaqlar)
  const gInk = inksFor(c.guard, c)
  const outer = { x0: 8, y0: 8, x1: RUG_W - 8, y1: RUG_H - 8 }
  const gw = og - 8
  ringPath(ctx, outer, gw); ctx.fillStyle = c.guard; ctx.fill('evenodd')
  ctx.save(); ringPath(ctx, outer, gw); ctx.clip('evenodd')
  ring(ctx, outer, gw, gw * 1.05, (x, tw) => {
    ctx.beginPath(); poly(ctx, [[x - tw / 2, gw], [x, 4], [x + tw / 2, gw]])
    fillStroke(ctx, gInk.b, c.outline, 1.4)
    dot(ctx, x, gw * 0.68, 2.4, c.outline)
  }, null, (x, y) => { diamond(ctx, x, y, gw * 0.36, gw * 0.36, gInk.b, c.outline, 1.4) })
  ctx.restore()

  // 2) Əsas haşiyə
  const bInk = inksFor(c.border, c)
  ringPath(ctx, z.border, bw); ctx.fillStyle = c.border; ctx.fill('evenodd')
  ctx.save(); ringPath(ctx, z.border, bw); ctx.clip('evenodd')
  const ideal = o.border === 'hooked' ? bw * 1.05 : o.border === 'tulip' ? bw * 1.2 : bw * 1.1
  ring(ctx, z.border, bw, ideal,
    (x, tw, i) => borderTile(ctx, o.border, x, tw, bw, i, bInk, c.border),
    (x) => borderJoin(ctx, o.border, x, bw, bInk),
    null)
  ctx.restore()
  // künc kvadratları
  for (const [x, y] of [[z.border.x0, z.border.y0], [z.border.x1 - bw, z.border.y0], [z.border.x0, z.border.y1 - bw], [z.border.x1 - bw, z.border.y1 - bw]]) {
    ctx.fillStyle = c.border; ctx.fillRect(x, y, bw, bw)
    ctx.strokeStyle = bInk.b; ctx.lineWidth = 3
    ctx.strokeRect(x + 8, y + 8, bw - 16, bw - 16)
    cornerMotif(ctx, o.border, x + bw / 2, y + bw / 2, bw, bInk, c.border)
  }

  // 3) Daxili haşiyə: növbəli kiçik çiçək və nöqtə
  const inInk = inksFor(c.guard, c)
  ringPath(ctx, z.inner, ig); ctx.fillStyle = c.guard; ctx.fill('evenodd')
  ctx.save(); ringPath(ctx, z.inner, ig); ctx.clip('evenodd')
  ring(ctx, z.inner, ig, ig * 1.25, (x, tw, i) => {
    if (i % 2 === 0) {
      for (let k = 0; k < 4; k++) leaf(ctx, x, ig / 2, (k * Math.PI) / 2, ig * 0.36, ig * 0.12, inInk.b, c.outline, 1)
      dot(ctx, x, ig / 2, ig * 0.1, c.outline)
    } else diamond(ctx, x, ig / 2, ig * 0.16, ig * 0.24, inInk.a, c.outline, 1.2)
  }, null, (x, y) => { star(ctx, x, y, ig * 0.42, inInk.b, c.outline, 1.2) })
  ctx.restore()

  // 4) Ara sahə: künc sahələri (spandrel) rəngi, mehrab
  const f = z.field
  const g = archGeometry(o.arch)
  const P = nichePolygon(o.arch)
  ctx.fillStyle = c.spandrel
  ctx.fillRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0)
  // spandrel bəzəyi: kiçik ulduz səpintisi + böyük rozet (güzgü)
  const sInk = inksFor(c.spandrel, c)
  ctx.save()
  ctx.beginPath(); ctx.rect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0); poly(ctx, P); ctx.clip('evenodd')
  const sDot = mix(sInk.b, c.spandrel, 0.4)
  for (let row = 0, y = f.y0 + 22; y < f.y1; row++, y += 34) {
    for (let i = -12; i <= 12; i++) {
      const x = g.cx + i * 40 + (row % 2 ? 20 : 0)
      diamond(ctx, x, y, 3.4, 4.6, sDot, null, 0)
    }
  }
  const sp = spandrelSpot(o.arch)
  for (const sx of [-1, 1]) {
    const x = sx < 0 ? sp.x : 2 * g.cx - sp.x
    const r = Math.max(14, sp.r - 14)
    ctx.beginPath(); ctx.arc(x, sp.y, r + 6, 0, Math.PI * 2); ctx.fillStyle = c.spandrel; ctx.fill()
    for (let k = 0; k < 4; k++) leaf(ctx, x, sp.y, Math.PI / 4 + (k * Math.PI) / 2, r * 1.15, r * 0.24, sInk.b, c.outline, 1.6)
    rosette(ctx, x, sp.y, r * 0.72, 8, sInk.a, sInk.b, c.outline, 2.2)
  }
  // tağ boyunca kiçik lalələr (spandrel kənarında, simmetrik)
  ctx.restore()

  // mehrabın içi
  ctx.beginPath(); poly(ctx, P); ctx.fillStyle = c.field; ctx.fill()
  const fInk = inksFor(c.field, c)
  ctx.save()
  ctx.beginPath(); poly(ctx, P); ctx.clip()
  fieldPattern(ctx, o.field, g, fInk, c.field)
  // mehrabın yuxarısında incə ikinci kontur (daxili)
  ctx.restore()

  // mehrab konturu: tünd — açıq — tünd
  ctx.beginPath(); poly(ctx, P)
  ctx.lineJoin = o.arch === 'stepped' ? 'miter' : 'round'
  ctx.strokeStyle = c.outline; ctx.lineWidth = 16; ctx.stroke()
  ctx.strokeStyle = sInk.a; ctx.lineWidth = 8; ctx.stroke()
  ctx.setLineDash([2, 12]); ctx.lineCap = 'round'
  ctx.strokeStyle = c.outline; ctx.lineWidth = 4; ctx.stroke()
  ctx.setLineDash([]); ctx.lineCap = 'butt'
  // zirvədə kiçik ulduz (finial)
  star(ctx, g.cx, g.yApex - 22, 16, sInk.a, c.outline, 2)

  // 5) Mərkəz
  if (o.medallion === 'lantern') lantern(ctx, g, c, fInk, c.field)
  else if (o.medallion === 'gul') { pendant(ctx, g, fInk); gulMedallion(ctx, g, fInk, c.field) }
  else if (o.medallion === 'star') { pendant(ctx, g, fInk); starMedallion(ctx, g, fInk, c.field) }

  // 6) Zona sərhəd xətləri
  ctx.strokeStyle = c.outline
  ctx.lineWidth = 4
  for (const r of [z.border, z.inner, f]) ctx.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0)
  ctx.lineWidth = 2
  ctx.strokeStyle = bInk.b
  ctx.strokeRect(z.border.x0 + 6, z.border.y0 + 6, z.border.x1 - z.border.x0 - 12, z.border.y1 - z.border.y0 - 12)
  ctx.strokeRect(z.inner.x0 - 6, z.inner.y0 - 6, z.inner.x1 - z.inner.x0 + 12, z.inner.y1 - z.inner.y0 + 12)

  // 7) Abraş və toxuma
  abrash(ctx)
  if (o.weave) weave(ctx, Math.max(5, 2.6 / px))
  ctx.restore()
}

/**
 * Səhnə: mode = 'preview' (şəffaf fon), 'print' (2:3, açıq kağız), 'wallpaper' (9:16, tünd fon).
 */
export function drawScene(ctx, W, H, opts, mode = 'preview') {
  const o = { ...DEFAULT_OPTS, ...opts }
  const c = { ...DEFAULT_OPTS.colors, ...(o.colors || {}) }
  ctx.save()
  ctx.clearRect(0, 0, W, H)
  let fitW = 0.94, fitH = 0.97, cy = 0.5
  if (mode === 'print') {
    ctx.fillStyle = '#f6f1e7'; ctx.fillRect(0, 0, W, H)
    fitW = 0.84; fitH = 0.88; cy = 0.49
  } else if (mode === 'wallpaper') {
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, mix(c.border, '#000000', 0.45))
    bg.addColorStop(1, mix(c.field, '#000000', 0.62))
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
    // fonda incə ulduz toru
    ctx.globalAlpha = 0.07
    const s = W / 9
    for (let row = 0, y = s / 2; y < H + s; row++, y += s * 0.86) {
      for (let x = (row % 2 ? s / 2 : 0); x < W + s; x += s) star(ctx, x, y, s * 0.22, c.motif, null, 0)
    }
    ctx.globalAlpha = 1
    fitW = 0.86; fitH = 0.8; cy = 0.475
  }
  const k = Math.min((W * fitW) / RUG_W, (H * fitH) / TOTAL_H)
  const ox = (W - RUG_W * k) / 2
  const oy = H * cy - (RUG_H * k) / 2
  if (mode !== 'preview' || W > 0) {
    ctx.save()
    ctx.shadowColor = mode === 'wallpaper' ? 'rgba(0,0,0,0.55)' : 'rgba(40,25,10,0.28)'
    ctx.shadowBlur = 40 * k * (mode === 'preview' ? 0.6 : 1)
    ctx.shadowOffsetY = 14 * k
    ctx.fillStyle = c.outline
    ctx.fillRect(ox, oy, RUG_W * k, RUG_H * k)
    ctx.restore()
  }
  ctx.save()
  ctx.translate(ox, oy)
  ctx.scale(k, k)
  drawRug(ctx, o, k)
  ctx.restore()
  if (mode !== 'preview') {
    const label = 'muslims.cc'
    const fs = Math.round(W * 0.026)
    ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = mode === 'wallpaper' ? 'rgba(255,248,232,0.62)' : 'rgba(60,45,30,0.55)'
    ctx.fillText(label, W / 2, H - Math.max(fs * 1.6, H * (mode === 'wallpaper' ? 0.045 : 0.025)))
  }
  ctx.restore()
}

export const EXPORTS = {
  wallpaper: { w: 1080, h: 1920, mode: 'wallpaper' },
  print: { w: 2000, h: 3000, mode: 'print' },
}
