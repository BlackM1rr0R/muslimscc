// ═══════════════════════════════════════════════════════
// Quranda peyğəmbərlər — dairə sahəsinin saf köməkçiləri (QuranProphetsPage)
// • bubbleRadius — kvadrat kök şkalası: sahə saya mütənasibdir (+ sabit əsas, kiçik ad da oxunsun)
// • packBubbles — determinik sıx yerləşdirmə (fizika dövrü yoxdur): böyükdən kiçiyə, hər dairə
//   ya iki yerləşmiş dairəyə toxunan, ya da birinə toxunan nöqtələrdən mərkəzə ən yaxın, kəsişməyənə.
//   Modul yüklənəndə bir dəfə işləyir (25 dairə — ~1 ms); prerender və klientdə nəticə eynidir.
// • surahStrip — 114 surə üzrə say (barkod zolağı)
// • nearestInDirection — ox düymələri ilə qonşu dairəyə keçid
// ═══════════════════════════════════════════════════════

export const R_BASE = 22
export const R_K = 7.5
export const GAP = 4
export const MARGIN = 6

export const bubbleRadius = (count) => R_BASE + R_K * Math.sqrt(Math.max(0, count))

const round = (v) => Math.round(v * 100) / 100

/** items: [{ id, r }] → { w, h, circles: [{ id, x, y, r }] } (giriş sırası ilə) */
export function packBubbles(items) {
  const order = items.map((it, i) => ({ ...it, i })).sort((a, b) => b.r - a.r || a.i - b.i)
  const placed = []
  const fits = (x, y, r) => placed.every(p => Math.hypot(p.x - x, p.y - y) >= p.r + r + GAP - 1e-6)
  for (const it of order) {
    if (!placed.length) { placed.push({ ...it, x: 0, y: 0 }); continue }
    let best = null
    const consider = (x, y) => {
      const d = Math.hypot(x, y)
      if ((!best || d < best.d - 1e-9) && fits(x, y, it.r)) best = { x, y, d }
    }
    // İki dairəyə toxunan nöqtələr (iki çevrənin kəsişməsi)
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const A = placed[a], B = placed[b]
        const ra = A.r + it.r + GAP, rb = B.r + it.r + GAP
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy)
        if (d > ra + rb || d < Math.abs(ra - rb) || d === 0) continue
        const l = (ra * ra - rb * rb + d * d) / (2 * d)
        const h = Math.sqrt(Math.max(0, ra * ra - l * l))
        const mx = A.x + (dx * l) / d, my = A.y + (dy * l) / d
        consider(mx + (dy * h) / d, my - (dx * h) / d)
        consider(mx - (dy * h) / d, my + (dx * h) / d)
      }
    }
    // Ehtiyat: bir dairəyə 12 istiqamətdə toxunan nöqtələr
    if (!best) {
      for (const p of placed) {
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2
          consider(p.x + Math.cos(ang) * (p.r + it.r + GAP), p.y + Math.sin(ang) * (p.r + it.r + GAP))
        }
      }
    }
    placed.push({ ...it, x: best.x, y: best.y })
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of placed) {
    minX = Math.min(minX, p.x - p.r); minY = Math.min(minY, p.y - p.r)
    maxX = Math.max(maxX, p.x + p.r); maxY = Math.max(maxY, p.y + p.r)
  }
  const circles = placed
    .sort((a, b) => a.i - b.i)
    .map(p => ({ id: p.id, r: p.r, x: round(p.x - minX + MARGIN), y: round(p.y - minY + MARGIN) }))
  return { w: Math.ceil(maxX - minX + 2 * MARGIN), h: Math.ceil(maxY - minY + 2 * MARGIN), circles }
}

/** [[s,a,w], …] → 114 elementli massiv: hər surədə neçə dəfə */
export function surahStrip(locs) {
  const out = new Array(114).fill(0)
  for (const [s] of locs) if (s >= 1 && s <= 114) out[s - 1] += 1
  return out
}

/** [[s,a,w], …] → [{ s, ayahs: [{ a, n }] }] (surə sırası ilə; n — ayədə neçə dəfə) */
export function groupBySurah(locs) {
  const out = []
  for (const [s, a] of locs) {
    let g = out[out.length - 1]
    if (!g || g.s !== s) { g = { s, ayahs: [] }; out.push(g) }
    const last = g.ayahs[g.ayahs.length - 1]
    if (last && last.a === a) last.n += 1
    else g.ayahs.push({ a, n: 1 })
  }
  return out
}

const DIRS = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }
/** Ox istiqamətində ən yaxın nöqtə (indeks) və ya -1. Yan sürüşmə 2 qat cəzalanır, konusdan kənar sayılmır. */
export function nearestInDirection(points, from, dir) {
  const [ux, uy] = DIRS[dir] || [0, 0]
  const o = points[from]
  let best = -1, bestScore = Infinity
  points.forEach((p, i) => {
    if (i === from) return
    const dx = p.x - o.x, dy = p.y - o.y
    const along = dx * ux + dy * uy
    const perp = Math.abs(dx * uy - dy * ux)
    if (along <= 0 || perp > 2 * along) return   // ~63° konus — yan tərəfdəki dairə sayılmır
    const score = along + 2 * perp
    if (score < bestScore) { bestScore = score; best = i }
  })
  return best
}
