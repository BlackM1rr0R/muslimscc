// ═══════════════════════════════════════════════════════
// İznik kaşısı — saf riyaziyyat (components/IznikTile.jsx üçün)
//
// • Simmetriya: kaşı mərkəzi (0.5, 0.5) ətrafında 2×2 matrislər.
//   4 — D2 (X və Y oxlarında güzgü), 8 — D4 (4 dönmə × güzgü).
//   Matris [a, b, c, d]: x' = a·x + b·y, y' = c·x + d·y (mərkəzə nisbətən).
// • Motivlər (lalə, qərənfil, saz yarpağı, rozet, bulud zolağı) — yerli
//   koordinatlarda (təxminən −1…1, «yuxarı» = −y) çoxbucaqlı hissələr:
//   { role: 'main' | 'accent' | 'leaf', pts: [x0, y0, x1, y1, …] }.
// • Bütün model koordinatları kaşının eninə nisbidir (0…1) — ixrac istənilən
//   ölçüdə yenidən, kəskin çəkilir.
// ═══════════════════════════════════════════════════════

export const SYMS = [4, 8]
export const MOTIFS = ['tulip', 'carnation', 'saz', 'rosette', 'cloud']

const D2 = [[1, 0, 0, 1], [-1, 0, 0, 1], [1, 0, 0, -1], [-1, 0, 0, -1]]
const ROT = [[1, 0, 0, 1], [0, -1, 1, 0], [-1, 0, 0, -1], [0, 1, -1, 0]]
const MIRROR_X = [-1, 0, 0, 1]

/** İki matrisin hasili: (m·n)(p) = m(n(p)) */
export function mulMat(m, n) {
  return [
    m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
  ]
}

/** Simmetriya qrupunun matrisləri (ilki həmişə eynilik) */
export function symMatrices(n) {
  if (n === 8) return [...ROT, ...ROT.map(r => mulMat(r, MIRROR_X))]
  return D2
}

/** Nöqtəni kaşı mərkəzi ətrafında matrislə çevir */
export function applyMat(m, x, y) {
  const dx = x - 0.5, dy = y - 0.5
  return [0.5 + m[0] * dx + m[1] * dy, 0.5 + m[2] * dx + m[3] * dy]
}

/** Bir nöqtənin bütün simmetrik əksləri */
export function symPoints(x, y, n) {
  return symMatrices(n).map(m => applyMat(m, x, y))
}

/** Möhür istiqaməti: motivin «yuxarısı» mərkəzdən çölə baxır (mərkəzdə — düz) */
export function stampAngle(x, y) {
  const dx = x - 0.5, dy = y - 0.5
  if (Math.hypot(dx, dy) < 0.04) return 0
  return Math.atan2(dy, dx) + Math.PI / 2
}

/** Göstərici yerini kaşı koordinatına çevir. wall — 3×3 divar görünüşü;
 *  tile — barmaq basılan kaşının indeksi (xətt kaşı sərhədindən «tullanmasın») */
export function pointerToModel(fx, fy, wall, tile = null) {
  if (!wall) return { x: fx, y: fy, tile: null }
  const t = tile || {
    ix: Math.min(2, Math.max(0, Math.floor(fx * 3))),
    iy: Math.min(2, Math.max(0, Math.floor(fy * 3))),
  }
  return { x: fx * 3 - t.ix, y: fy * 3 - t.iy, tile: t }
}

/** Telefon fonu üçün kaşı düzülüşü: sütun sayı cols, şaquli mərkəzlənmiş */
export function wallLayout(W, H, cols = 3) {
  const size = W / cols
  const rows = Math.ceil(H / size) + 1
  const oy = (H - rows * size) / 2
  const tiles = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tiles.push({ x: c * size, y: oy + r * size })
  return { size, rows, cols, tiles }
}

// ── Motiv həndəsəsi ──

/** Kub Bezye seqmentlərini nöqtələrə çevir: start + [[c1x,c1y,c2x,c2y,ex,ey], …] */
export function bezierPts(start, segs, steps = 12) {
  const out = [start[0], start[1]]
  let [px, py] = start
  for (const [ax, ay, bx, by, ex, ey] of segs) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, u = 1 - t
      const k0 = u * u * u, k1 = 3 * u * u * t, k2 = 3 * u * t * t, k3 = t * t * t
      out.push(k0 * px + k1 * ax + k2 * bx + k3 * ex, k0 * py + k1 * ay + k2 * by + k3 * ey)
    }
    px = ex; py = ey
  }
  return out
}

/** Sol yarıdan (aşağı mərkəz → yuxarı mərkəz) güzgü ilə tam simmetrik forma */
function mirrored(left) {
  const out = left.slice()
  for (let i = left.length - 4; i >= 2; i -= 2) out.push(-left[i], left[i + 1])
  return out
}

function circle(cx, cy, r, n = 28) {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  return out
}

function stem(y0, y1, w = 0.05, bend = 0.08, n = 10) {
  const left = [], back = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = bend * Math.sin(Math.PI * t)
    left.push(x - w / 2, y0 + (y1 - y0) * t)
  }
  for (let i = n; i >= 0; i--) {
    const t = i / n
    back.push(bend * Math.sin(Math.PI * t) + w / 2, y0 + (y1 - y0) * t)
  }
  return [...left, ...back]
}

function tulip() {
  const body = mirrored(bezierPts([0, 0.3], [
    [-0.42, 0.28, -0.62, -0.25, -0.46, -0.92],
    [-0.36, -0.6, -0.24, -0.5, -0.15, -0.52],
    [-0.12, -0.76, -0.06, -0.9, 0, -1],
  ]))
  const inner = mirrored(bezierPts([0, 0.14], [[-0.22, 0.06, -0.2, -0.42, 0, -0.72]]))
  const leafL = bezierPts([0, 0.92], [[-0.3, 0.86, -0.62, 0.58, -0.72, 0.24], [-0.46, 0.36, -0.2, 0.56, 0, 0.92]])
  const leafR = leafL.map((v, i) => (i % 2 ? v : -v))
  return [
    { role: 'leaf', pts: stem(0.25, 1, 0.06, 0) },
    { role: 'leaf', pts: leafL },
    { role: 'leaf', pts: leafR },
    { role: 'main', pts: body },
    { role: 'accent', pts: inner },
  ]
}

function fan(rIn, rOut, lobes, y0, half) {
  const out = [-half, y0]
  const n = lobes * 8
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI // π…2π — yuxarı yarımdairə
    const r = rIn + (rOut - rIn) * Math.abs(Math.sin((i / n) * lobes * Math.PI))
    out.push(r * Math.cos(a), y0 - 0.1 + r * Math.sin(a) * 1.05)
  }
  out.push(half, y0)
  return out
}

function carnation() {
  return [
    { role: 'leaf', pts: stem(0.5, 1, 0.06, 0) },
    { role: 'main', pts: fan(0.66, 0.9, 7, 0.12, 0.26) },
    { role: 'accent', pts: fan(0.36, 0.5, 5, 0.12, 0.2) },
    { role: 'leaf', pts: [-0.28, 0.08, 0.28, 0.08, 0.14, 0.56, -0.14, 0.56] },
  ]
}

function sazEdge(scale, serrate) {
  const n = 48
  const left = [], right = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const cx = -0.22 + 0.36 * t + 0.34 * Math.sin(Math.PI * t)
    const cy = 0.95 - 1.9 * t
    const tx = 0.36 + 0.34 * Math.PI * Math.cos(Math.PI * t), ty = -1.9
    const len = Math.hypot(tx, ty)
    const nx = -ty / len, ny = tx / len
    const w = scale * 0.3 * Math.pow(Math.sin(Math.PI * Math.min(t * 1.1, 1)), 0.75)
    // Bir tərəf mişar dişli (saz yarpağının tanınan kənarı)
    const saw = serrate ? 1 + 0.22 * ((i % 4) / 3) : 1
    left.push(cx + nx * w * saw, cy + ny * w * saw)
    right.push(cx - nx * w, cy - ny * w)
  }
  const back = []
  for (let i = right.length - 2; i >= 0; i -= 2) back.push(right[i], right[i + 1])
  return [...left, ...back]
}

function saz() {
  return [
    { role: 'main', pts: sazEdge(1, true) },
    { role: 'accent', pts: sazEdge(0.38, false) },
  ]
}

function rosette() {
  const n = 160, petals = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = 0.5 + 0.48 * Math.pow(Math.abs(Math.cos(4 * a)), 0.7)
    petals.push(r * Math.cos(a), r * Math.sin(a))
  }
  return [
    { role: 'main', pts: petals },
    { role: 'accent', pts: circle(0, 0, 0.34, 32) },
    { role: 'leaf', pts: circle(0, 0, 0.13, 20) },
  ]
}

function cloud() {
  const n = 40, top = [], bot = []
  for (let i = 0; i <= n; i++) {
    const x = -1 + (2 * i) / n
    const y = 0.32 + 0.24 * Math.sin(Math.PI * x * 1.5)
    const w = 0.2 * Math.pow(1 - x * x, 0.6) + 0.015
    top.push(x, y - w); bot.push(x, y + w)
  }
  const back = []
  for (let i = bot.length - 2; i >= 0; i -= 2) back.push(bot[i], bot[i + 1])
  const inner = []
  for (let i = 4; i <= n - 4; i++) {
    const x = -1 + (2 * i) / n
    inner.push(x, 0.32 + 0.24 * Math.sin(Math.PI * x * 1.5) - 0.05)
  }
  for (let i = n - 4; i >= 4; i--) {
    const x = -1 + (2 * i) / n
    inner.push(x, 0.32 + 0.24 * Math.sin(Math.PI * x * 1.5) + 0.05)
  }
  return [
    { role: 'main', pts: [...top, ...back] },
    { role: 'accent', pts: inner },
    // Çintamani: üç dairə
    { role: 'accent', pts: circle(-0.27, -0.42, 0.15) },
    { role: 'accent', pts: circle(0.27, -0.42, 0.15) },
    { role: 'accent', pts: circle(0, -0.78, 0.15) },
  ]
}

const BUILDERS = { tulip, carnation, saz, rosette, cloud }
const CACHE = new Map()

/** Motivin yerli hissələri (keşlənir — çağıran dəyişdirməməlidir) */
export function motifParts(name) {
  if (!BUILDERS[name]) return []
  if (!CACHE.has(name)) CACHE.set(name, BUILDERS[name]())
  return CACHE.get(name)
}

/** Motivi kaşıya yerləşdir: mərkəz (x, y), yarım ölçü size, dönmə angle */
export function placeMotif(name, x, y, size, angle = 0) {
  const c = Math.cos(angle), s = Math.sin(angle)
  return motifParts(name).map(p => {
    const pts = new Array(p.pts.length)
    for (let i = 0; i < p.pts.length; i += 2) {
      const lx = p.pts[i] * size, ly = p.pts[i + 1] * size
      pts[i] = x + lx * c - ly * s
      pts[i + 1] = y + lx * s + ly * c
    }
    return { role: p.role, pts }
  })
}
