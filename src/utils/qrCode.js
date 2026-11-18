// ═══════════════════════════════════════════════════════
// Kiçik QR kod kodlayıcısı (ISO/IEC 18004) — asılılıqsız, yalnız 2FA qurulumu üçün tənbəl yüklənir
//
//   qrMatrix(text, { ecl: 'M' | 'L', mask? }) → { size, modules: boolean[][] }  (modules[y][x], true = tünd)
//   qrSvgPath(matrix, quiet = 4) → { d, view }  — SVG <path d> (hər tünd modul 1×1 kvadrat)
//
// Yalnız bayt rejimi (UTF-8), versiya 1–40, səhv düzəltmə L / M. Alqoritm Project Nayuki
// "QR Code generator" (MIT) quruluşunu izləyir: məlumat → blok + Reed–Solomon (GF(2^8), 0x11D) →
// növbələşdirmə → funksiya naxışları → maska (cərimə balı ən kiçik olan, 0–7) → format/versiya bitləri.
// tests/unit/qr-code.test.js: struktur yoxlamaları + jsQR ilə oxunma (yerli yoxlama, asılılıq deyil).
// ═══════════════════════════════════════════════════════

const ECC_PER_BLOCK = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
}
const NUM_BLOCKS = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
}
const FORMAT_BITS = { L: 1, M: 0 }

function rawDataModules(ver) {
  let r = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2
    r -= (25 * n - 10) * n - 55
    if (ver >= 7) r -= 36
  }
  return r
}
const dataCodewords = (ver, ecl) => Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver] * NUM_BLOCKS[ecl][ver]

// ── Reed–Solomon (GF(2^8), primitiv polinom 0x11D) ──
function gfMul(x, y) {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}
function rsDivisor(degree) {
  const r = new Array(degree).fill(0)
  r[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfMul(r[j], root)
      if (j + 1 < r.length) r[j] ^= r[j + 1]
    }
    root = gfMul(root, 0x02)
  }
  return r
}
function rsRemainder(data, divisor) {
  const r = new Array(divisor.length).fill(0)
  for (const b of data) {
    const factor = b ^ r.shift()
    r.push(0)
    divisor.forEach((coef, i) => { r[i] ^= gfMul(coef, factor) })
  }
  return r
}

function alignmentPositions(ver, size) {
  if (ver === 1) return []
  const n = Math.floor(ver / 7) + 2
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2
  const out = [6]
  for (let pos = size - 7; out.length < n; pos -= step) out.splice(1, 0, pos)
  return out
}

const bit = (x, i) => ((x >>> i) & 1) !== 0

/** Matris. Mətn sığmırsa Error('too long'). */
export function qrMatrix(text, { ecl = 'M', mask = -1 } = {}) {
  if (!ECC_PER_BLOCK[ecl]) throw new Error('ecl')
  const bytes = Array.from(new TextEncoder().encode(String(text)))
  let ver = 1
  for (; ver <= 40; ver++) {
    const need = 4 + (ver < 10 ? 8 : 16) + bytes.length * 8
    if (need <= dataCodewords(ver, ecl) * 8) break
  }
  if (ver > 40) throw new Error('too long')
  const size = ver * 4 + 17
  const cap = dataCodewords(ver, ecl)

  // ── Bit axını: rejim (0100), uzunluq, baytlar, terminator, dolğu ──
  const bits = []
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1) }
  push(4, 4)
  push(bytes.length, ver < 10 ? 8 : 16)
  for (const b of bytes) push(b, 8)
  push(0, Math.min(4, cap * 8 - bits.length))
  push(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < cap * 8; pad ^= 0xec ^ 0x11) push(pad, 8)
  const data = []
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0))

  // ── Bloklar + RS + növbələşdirmə ──
  const nBlocks = NUM_BLOCKS[ecl][ver]
  const eccLen = ECC_PER_BLOCK[ecl][ver]
  const raw = Math.floor(rawDataModules(ver) / 8)
  const nShort = nBlocks - (raw % nBlocks)
  const shortLen = Math.floor(raw / nBlocks)
  const div = rsDivisor(eccLen)
  const blocks = []
  for (let i = 0, k = 0; i < nBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1))
    k += dat.length
    const ecc = rsRemainder(dat, div)
    if (i < nShort) dat.push(0)
    blocks.push(dat.concat(ecc))
  }
  const codewords = []
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) codewords.push(b[i]) })
  }

  // ── Funksiya naxışları ──
  const modules = Array.from({ length: size }, () => new Array(size).fill(false))
  const isFn = Array.from({ length: size }, () => new Array(size).fill(false))
  const setFn = (x, y, dark) => { modules[y][x] = dark; isFn[y][x] = true }
  for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0) }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy
      if (x < 0 || x >= size || y < 0 || y >= size) continue
      const d = Math.max(Math.abs(dx), Math.abs(dy))
      setFn(x, y, d !== 2 && d !== 4)
    }
  }
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4)
  const al = alignmentPositions(ver, size)
  for (let i = 0; i < al.length; i++) for (let j = 0; j < al.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) continue
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }
  const drawFormat = (m) => {
    const d = (FORMAT_BITS[ecl] << 3) | m
    let rem = d
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const b = ((d << 10) | rem) ^ 0x5412
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(b, i))
    setFn(8, 7, bit(b, 6)); setFn(8, 8, bit(b, 7)); setFn(7, 8, bit(b, 8))
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(b, i))
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(b, i))
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(b, i))
    setFn(8, size - 8, true)
  }
  drawFormat(0)   // yer tutsun (isFn) — maskadan sonra düzgün dəyər
  if (ver >= 7) {
    let rem = ver
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const b = (ver << 12) | rem
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3), c = Math.floor(i / 3)
      setFn(a, c, bit(b, i)); setFn(c, a, bit(b, i))
    }
  }

  // ── Məlumat modulları (ziqzaq) ──
  let n = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
      const x = right - j
      const y = ((right + 1) & 2) === 0 ? size - 1 - v : v
      if (!isFn[y][x] && n < codewords.length * 8) { modules[y][x] = bit(codewords[n >>> 3], 7 - (n & 7)); n++ }
    }
  }

  const applyMask = (m) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (isFn[y][x]) continue
      let inv
      switch (m) {
        case 0: inv = (x + y) % 2 === 0; break
        case 1: inv = y % 2 === 0; break
        case 2: inv = x % 3 === 0; break
        case 3: inv = (x + y) % 3 === 0; break
        case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break
        case 5: inv = ((x * y) % 2) + ((x * y) % 3) === 0; break
        case 6: inv = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break
        default: inv = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
      }
      if (inv) modules[y][x] = !modules[y][x]
    }
  }
  let best = mask
  if (best < 0 || best > 7) {
    let min = Infinity
    for (let m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m)
      const p = penalty(modules, size)
      if (p < min) { min = p; best = m }
      applyMask(m)      // XOR — geri qaytar
    }
  }
  applyMask(best)
  drawFormat(best)
  return { size, version: ver, mask: best, modules }
}

/** ISO cərimə balı (N1 ardıcıllıq, N2 2×2, N3 tapıcıya bənzər naxış, N4 balans) */
function penalty(mod, size) {
  let p = 0
  const line = (get) => {
    let run = 1
    for (let i = 1; i <= size; i++) {
      if (i < size && get(i) === get(i - 1)) run++
      else { if (run >= 5) p += 3 + (run - 5); run = 1 }
    }
    // 1:1:3:1:1 (tünd-açıq-tünd×3-açıq-tünd) + bir tərəfdə 4 açıq
    for (let i = 0; i + 7 <= size; i++) {
      if (get(i) && !get(i + 1) && get(i + 2) && get(i + 3) && get(i + 4) && !get(i + 5) && get(i + 6)) {
        const lightBefore = [1, 2, 3, 4].every((k) => i - k < 0 || !get(i - k))
        const lightAfter = [7, 8, 9, 10].every((k) => i + k >= size || !get(i + k))
        if (lightBefore || lightAfter) p += 40
      }
    }
  }
  for (let y = 0; y < size; y++) line((x) => mod[y][x])
  for (let x = 0; x < size; x++) line((y) => mod[y][x])
  let dark = 0
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (mod[y][x]) dark++
    if (x < size - 1 && y < size - 1) {
      const c = mod[y][x]
      if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3
    }
  }
  const total = size * size
  p += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10
  return p
}

/** SVG yolu: quiet — kənar boşluq (modul). view — viewBox ölçüsü. */
export function qrSvgPath({ size, modules }, quiet = 4) {
  let d = ''
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (modules[y][x]) d += `M${x + quiet} ${y + quiet}h1v1h-1z`
  }
  return { d, view: size + quiet * 2 }
}
