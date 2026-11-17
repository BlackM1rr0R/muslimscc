// ═══════════════════════════════════════════════════════
// Krossvord generatoru (components/IslamicCrossword.jsx)
//
// Deterministik: eyni toxum (seed) + eyni sözlər → eyni krossvord.
// Üsul: sözlər toxumla qarışdırılır, ilki üfüqi qoyulur, sonrakılar mövcud
// hərflərlə kəsişən yerə (ən çox kəsişən, ən yığcam) yerləşdirilir. Qaydalar:
// sözün əvvəli/sonu boş qalır, kəsişməyən hərfin yanında (perpendikulyar)
// başqa hərf olmur — beləliklə şəbəkədə "təsadüfi" söz əmələ gəlmir.
// Bir neçə cəhd edilir, ən çox söz yerləşən (sonra ən kiçik sahəli) seçilir.
// Nömrələmə klassikdir: sətir-sətir, söz başlayan xanalara 1, 2, 3…
// ═══════════════════════════════════════════════════════

export const CW_MIN_LEN = 3
export const CW_MAX_LEN = 11
export const CW_MAX_SIZE = 13      // şəbəkənin ən böyük eni/hündürlüyü (telefon üçün)
export const CW_LEVELS = { easy: 8, medium: 10, hard: 12 }

/** Sadə, sürətli PRNG (mulberry32) */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mətn → 32-bit toxum (FNV-1a) */
export function hashSeed(...parts) {
  let h = 0x811c9dc5
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export function shuffle(arr, rand) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const key = (r, c) => `${r},${c}`
const DIRS = { a: [0, 1], d: [1, 0] }

/** Söz (r, c, dir) şəbəkəyə qoyula bilərmi? → kəsişmə sayı və ya -1 */
function fit(grid, letters, r, c, dir, first) {
  const [dr, dc] = DIRS[dir]
  const n = letters.length
  if (grid.has(key(r - dr, c - dc)) || grid.has(key(r + dr * n, c + dc * n))) return -1
  let cross = 0
  for (let i = 0; i < n; i++) {
    const rr = r + dr * i, cc = c + dc * i
    const cell = grid.get(key(rr, cc))
    if (cell) {
      if (cell.ch !== letters[i] || cell[dir]) return -1
      cross++
    } else if (grid.has(key(rr + dc, cc + dr)) || grid.has(key(rr - dc, cc - dr))) {
      return -1
    }
  }
  if (!first && cross === 0) return -1
  if (cross === n) return -1
  return cross
}

function place(state, entry, r, c, dir) {
  const [dr, dc] = DIRS[dir]
  entry.letters.forEach((ch, i) => {
    const k = key(r + dr * i, c + dc * i)
    const cell = state.grid.get(k) || { ch }
    cell[dir] = true
    state.grid.set(k, cell)
  })
  const b = state.box
  b.r0 = Math.min(b.r0, r); b.c0 = Math.min(b.c0, c)
  b.r1 = Math.max(b.r1, r + dr * (entry.letters.length - 1))
  b.c1 = Math.max(b.c1, c + dc * (entry.letters.length - 1))
  state.words.push({ entry, r, c, dir })
}

/** Ən yaxşı yer: çox kəsişmə, kiçik sahə, toxumla bərabərlik pozulur */
function bestSpot(state, entry, rand) {
  let best = null
  const { letters } = entry
  for (const [k, cell] of state.grid) {
    const [cr, cc] = k.split(',').map(Number)
    for (let i = 0; i < letters.length; i++) {
      if (letters[i] !== cell.ch) continue
      for (const dir of ['a', 'd']) {
        if (cell[dir]) continue
        const [dr, dc] = DIRS[dir]
        const r = cr - dr * i, c = cc - dc * i
        const r1 = r + dr * (letters.length - 1), c1 = c + dc * (letters.length - 1)
        const b = state.box
        const h = Math.max(b.r1, r1) - Math.min(b.r0, r) + 1
        const w = Math.max(b.c1, c1) - Math.min(b.c0, c) + 1
        if (h > CW_MAX_SIZE || w > CW_MAX_SIZE) continue
        const cross = fit(state.grid, letters, r, c, dir, false)
        if (cross < 0) continue
        // Kvadrata yaxın forma üstündür (telefon ekranı üçün)
        const score = cross * 40 - h * w - Math.abs(h - w) * 3 + rand() * 6
        if (!best || score > best.score) best = { r, c, dir, score }
      }
    }
  }
  return best
}

function attempt(pool, count, rand) {
  const state = { grid: new Map(), words: [], box: { r0: 0, c0: 0, r1: 0, c1: 0 } }
  const order = shuffle(pool, rand)
  // İlk söz: ilk altı arasından ən uzunu
  let fi = 0
  for (let i = 1; i < Math.min(6, order.length); i++) if (order[i].letters.length > order[fi].letters.length) fi = i
  const [first] = order.splice(fi, 1)
  place(state, first, 0, 0, 'a')
  state.box = { r0: 0, c0: 0, r1: 0, c1: first.letters.length - 1 }
  let rest = order
  for (let pass = 0; pass < 3 && state.words.length < count; pass++) {
    const left = []
    for (const e of rest) {
      if (state.words.length >= count) { left.push(e); continue }
      const s = bestSpot(state, e, rand)
      if (s) place(state, e, s.r, s.c, s.dir)
      else left.push(e)
    }
    rest = left
  }
  return state
}

/**
 * Krossvord yarat.
 * entries: [{ id, answer, letters: string[], clue }]
 * → { rows, cols, seed, cells: (null | { ch, num })[][], words: [{ id, num, dir, r, c, answer, letters, clue }] }
 */
export function generateCrossword(entries, { seed = 1, count = 10, attempts = 30 } = {}) {
  const seen = new Set()
  const pool = entries.filter(e => {
    const n = e.letters?.length || 0
    const k = (e.letters || []).join('')
    if (n < CW_MIN_LEN || n > CW_MAX_LEN || seen.has(k)) return false
    seen.add(k)
    return true
  })
  if (!pool.length) return { rows: 0, cols: 0, seed, cells: [], words: [] }
  const rand = mulberry32(seed)
  let best = null
  for (let a = 0; a < attempts; a++) {
    const st = attempt(pool, count, rand)
    const area = (st.box.r1 - st.box.r0 + 1) * (st.box.c1 - st.box.c0 + 1)
    if (!best || st.words.length > best.st.words.length || (st.words.length === best.st.words.length && area < best.area)) best = { st, area }
    if (st.words.length >= count && area <= count * 14) break
  }
  const { st } = best
  const { r0, c0, r1, c1 } = st.box
  const rows = r1 - r0 + 1, cols = c1 - c0 + 1
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null))
  for (const [k, cell] of st.grid) {
    const [r, c] = k.split(',').map(Number)
    cells[r - r0][c - c0] = { ch: cell.ch, num: 0 }
  }
  const words = st.words.map(w => ({
    id: w.entry.id, dir: w.dir, r: w.r - r0, c: w.c - c0,
    answer: w.entry.answer, letters: w.entry.letters, clue: w.entry.clue, num: 0,
  }))
  // Nömrələmə: sətir-sətir
  let num = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const starts = words.filter(w => w.r === r && w.c === c)
      if (!starts.length) continue
      num++
      cells[r][c].num = num
      starts.forEach(w => { w.num = num })
    }
  }
  words.sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === 'a' ? -1 : 1))
  return { rows, cols, seed, cells, words }
}

/** Sözün xanaları [[r, c], …] */
export function wordCells(w) {
  const [dr, dc] = DIRS[w.dir]
  return w.letters.map((_, i) => [w.r + dr * i, w.c + dc * i])
}
