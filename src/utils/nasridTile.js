// ═══════════════════════════════════════════════════════
// Nəsri "pajarita" (quşcuq) kaşısının riyaziyyatı — components/NasridTile.jsx
//
// Qurulma (Əlhəmra məktəb materiallarındakı klassik üsul):
//   • Bərabərtərəfli üçbucaq ABC (tərəf 1, saat əqrəbinin əksinə).
//   • Hər tərəf PQ orta nöqtəsi M ilə iki yarıya bölünür. Birinci yarı P→M
//     əyri ilə əvəzlənir (çölə qabarır), ikinci yarı M→Q isə HƏMİN əyrinin
//     M ətrafında 180° döndərilmiş surətidir (içəri çökür). Beləcə tərəf
//     M-ə görə mərkəzi simmetrik "S" olur: qabarıq çökəyi tam kompensasiya edir,
//     sahə dəyişmir.
//   • Üç tərəfə eyni qayda tətbiq olunur → kaşı 120° dönmə simmetriyalıdır.
//   • Qonşu kaşı = əsas kaşının həmin tərəfin ortası ətrafında 180° dönməsi.
//     "S" tərəf bu dönmədə özünə keçdiyi üçün qonşular boşluqsuz bitişir.
//   • Döşəmə: "yuxarı" kaşılar üçbucaq qəfəsinin köçürmələridir (i·u + j·v),
//     "aşağı" kaşılar — BC tərəfinin ortası ətrafında 180° dönmə + köçürmə.
// Saf funksiyalar — DOM yoxdur (tests/unit/nasridTile.test.js).
// ═══════════════════════════════════════════════════════

export const H = Math.sqrt(3) / 2
export const A = [0, 0]
export const B = [1, 0]
export const C = [0.5, H]
export const CENTROID = [0.5, H / 3]
/** Qəfəs vektorları */
export const U = [1, 0]
export const V = [0.5, H]
export const DEPTH_MIN = 0.1
export const DEPTH_MAX = 0.5

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))

/** Yarım-tərəf profili: 0 ucda, ortada 1 (hamar, uclarda sıfır) */
export const bump = (t) => Math.sin(Math.PI * t)

/**
 * P→Q tərəfinin "S" əyrisi: [P, ..., M, ..., Q], cəmi 2n+1 nöqtə.
 * amp — qabarma (tərəf uzunluğu vahidi ilə). Saat əqrəbinin əksinə gedən
 * konturda sağ normal çölə baxır, ona görə birinci yarı çölə qabarır.
 */
export function edgeCurve(P, Q, amp, n = 12) {
  const dx = Q[0] - P[0], dy = Q[1] - P[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = dy / len, ny = -dx / len // sağ normal (CCW konturda çölə)
  const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]
  const half = []
  for (let k = 0; k <= n; k++) {
    const t = k / n
    const o = amp * len * bump(t)
    half.push([P[0] + dx * t / 2 + nx * o, P[1] + dy * t / 2 + ny * o])
  }
  // İkinci yarı: birinci yarının M ətrafında 180° dönməsi, tərs sırada
  const out = half.slice()
  for (let k = n - 1; k >= 0; k--) out.push([2 * M[0] - half[k][0], 2 * M[1] - half[k][1]])
  return out
}

/** Qabarma = morph · dərinlik · ½ (yarım tərəfə nisbətdə) */
export function amplitude(morph, depth) {
  return clamp(morph, 0, 1) * clamp(depth, DEPTH_MIN, DEPTH_MAX) * 0.5
}

/** Əsas ("yuxarı") kaşının qapalı konturu (son nöqtə təkrarlanmır) */
export function tileOutline(morph, depth, n = 12) {
  const amp = amplitude(morph, depth)
  const pts = []
  for (const [P, Q] of [[A, B], [B, C], [C, A]]) {
    const e = edgeCurve(P, Q, amp, n)
    for (let k = 0; k < e.length - 1; k++) pts.push(e[k])
  }
  return pts
}

/** Əsas kaşının tərəfləri ayrıca (hər biri ucdan-uca) — testlər və çəkiliş üçün */
export function tileEdges(morph, depth, n = 12) {
  const amp = amplitude(morph, depth)
  return [[A, B], [B, C], [C, A]].map(([P, Q]) => edgeCurve(P, Q, amp, n))
}

// Afin çevirmə: [a, b, c, d, e, f] → (a·x + c·y + e, b·x + d·y + f)
export const IDENTITY = [1, 0, 0, 1, 0, 0]
export const translate = (tx, ty) => [1, 0, 0, 1, tx, ty]
export const halfTurn = (M) => [-1, 0, 0, -1, 2 * M[0], 2 * M[1]]
export const apply = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]
export const mapPts = (m, pts) => pts.map(p => apply(m, p))

const MID_BC = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]

/** (i, j) qəfəs xanasındakı kaşının çevirməsi. kind: 'up' | 'down' */
export function tileTransform(kind, i, j) {
  const ox = i * U[0] + j * V[0], oy = i * U[1] + j * V[1]
  if (kind === 'up') return translate(ox, oy)
  // köçürmə ∘ dönmə: p → 2M − p + o = M + o/2 ətrafında 180°
  return halfTurn([MID_BC[0] + ox / 2, MID_BC[1] + oy / 2])
}

export const tileKey = (kind, i, j) => `${kind}:${i},${j}`

/** Kaşının mərkəzi (dünya koordinatı) */
export const tileCenter = (kind, i, j) => apply(tileTransform(kind, i, j), CENTROID)

/** |i|,|j| ≤ r olan bütün kaşılar */
export function tilingPatch(r) {
  const out = []
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      for (const kind of ['up', 'down']) {
        out.push({ kind, i, j, key: tileKey(kind, i, j), m: tileTransform(kind, i, j) })
      }
    }
  }
  return out
}

const mod = (x, n) => ((x % n) + n) % n

export const PRESETS = ['two', 'three', 'four']

/**
 * Simmetrik rəngləmə: palitra yuvası (0 oxra, 1 kobalt, 2 zümrüd, 3 ağ).
 * "Yuxarı" kaşılar yalnız "aşağı" kaşılarla qonşudur, ona görə aşağıları
 * bir rəngə verib yuxarıları qəfəs simmetriyası ilə bölmək düzgün rəngləmədir.
 */
export function presetSlot(preset, kind, i, j) {
  if (preset === 'two') return kind === 'up' ? 1 : 3
  if (preset === 'three') return kind === 'up' ? (mod(j, 2) ? 0 : 1) : 3
  // four: yuxarılar (i − j) mod 3 → 3-qat simmetrik naxış
  return kind === 'up' ? mod(i - j, 3) : 3
}

/** Nöqtə çoxbucaqlının içindədirmi (ray casting) */
export function pointInPoly(p, poly) {
  let inside = false
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
    const [xa, ya] = poly[a], [xb, yb] = poly[b]
    if ((ya > p[1]) !== (yb > p[1]) && p[0] < (xb - xa) * (p[1] - ya) / (yb - ya) + xa) inside = !inside
  }
  return inside
}

/** Çoxbucaqlının işarəli sahəsi (CCW müsbət) */
export function polyArea(poly) {
  let s = 0
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) s += poly[b][0] * poly[a][1] - poly[a][0] * poly[b][1]
  return s / 2
}

/** Dünya nöqtəsindəki kaşı (yaxın namizədlər arasında) — tapılmasa null */
export function tileAt(p, outline) {
  // Kaşı mərkəzindən çox uzağa çıxmır — yaxın qəfəs xanalarını yoxla
  const j0 = Math.floor(p[1] / H)
  const i0 = Math.floor(p[0] - j0 * 0.5)
  for (let dj = -2; dj <= 2; dj++) {
    for (let di = -2; di <= 2; di++) {
      for (const kind of ['up', 'down']) {
        const i = i0 + di, j = j0 + dj
        const m = tileTransform(kind, i, j)
        if (pointInPoly(p, mapPts(m, outline))) return { kind, i, j, key: tileKey(kind, i, j) }
      }
    }
  }
  return null
}

export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
