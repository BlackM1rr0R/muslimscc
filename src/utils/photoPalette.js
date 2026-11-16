// ═══════════════════════════════════════════════════════
// Fotodan rəng dəsti (components/PhotoPattern, tests/unit/photo-palette.test.js) — saf funksiyalar
//
//   extractPalette(rgba, { k, seed, maxSamples }) → [{ hex, rgb:[r,g,b], share }]  (çoxdan aza)
//   sortByLuminance(cols)                           → qaranlıqdan işığa (hex və ya {hex})
//   expandPalette(hexes, n)                         → az rəng varsa, aralıq çalarlarla n-ə çatdırır
//   luminance(hex) / contrast(a, b) / pickLineColor(palette, fills)
//
// • k-means++ (Arthur & Vassilvitskii) — başlanğıc mərkəzlər sabit toxumlu PRNG ilə (mulberry32),
//   ona görə eyni şəkil həmişə eyni rəngləri verir. Şəffaf piksellər (alfa < 128) sayılmır.
// • Bir-birinə çox yaxın mərkəzlər birləşdirilir; şəkildə cəmi 2 rəng varsa — 2 rəng qaytarılır.
// • Kontrast — WCAG 2.x nisbi parlaqlıq düsturu.
// ═══════════════════════════════════════════════════════

/** Sabit toxumlu PRNG — 0..1 */
export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)))
export const toHex = ([r, g, b]) => '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('')
export function hexToRgb(hex) {
  const h = String(hex).replace('#', '')
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16) || 0)
}
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

/** RGBA massivindən (Uint8ClampedArray / Array) piksellər — ən çox maxSamples, bərabər addımla */
function samplePixels(rgba, maxSamples) {
  const total = Math.floor(rgba.length / 4)
  const step = Math.max(1, Math.ceil(total / maxSamples))
  const px = []
  for (let i = 0; i < total; i += step) {
    const o = i * 4
    if (rgba[o + 3] < 128) continue
    px.push([rgba[o], rgba[o + 1], rgba[o + 2]])
  }
  return px
}

/**
 * Dominant rənglər (k-means). Nəticə payına görə azalan sıradadır.
 * @param {Uint8ClampedArray|number[]} rgba
 */
export function extractPalette(rgba, { k = 6, seed = 7, maxSamples = 16000, iters = 24, mergeDist = 14 } = {}) {
  const px = samplePixels(rgba, maxSamples)
  if (!px.length) return []
  const rnd = mulberry32(seed)
  // k-means++ başlanğıcı
  const cents = [px[Math.floor(rnd() * px.length)].slice()]
  const best = px.map(p => d2(p, cents[0]))
  while (cents.length < k) {
    let sum = 0
    for (const v of best) sum += v
    if (sum === 0) break // fərqli rəng qalmayıb
    let r = rnd() * sum, idx = -1
    for (let i = 0; i < px.length; i++) {
      if (!best[i]) continue // sıfır məsafəli (artıq seçilmiş rəng) — keç
      idx = i; r -= best[i]
      if (r <= 0) break
    }
    const c = px[idx].slice()
    cents.push(c)
    for (let i = 0; i < px.length; i++) { const v = d2(px[i], c); if (v < best[i]) best[i] = v }
  }
  // Lloyd iterasiyaları
  const asg = new Int32Array(px.length)
  for (let it = 0; it < iters; it++) {
    const acc = cents.map(() => [0, 0, 0, 0])
    let moved = false
    for (let i = 0; i < px.length; i++) {
      let bi = 0, bd = Infinity
      for (let j = 0; j < cents.length; j++) { const v = d2(px[i], cents[j]); if (v < bd) { bd = v; bi = j } }
      if (asg[i] !== bi) { asg[i] = bi; moved = true }
      const a = acc[bi]; a[0] += px[i][0]; a[1] += px[i][1]; a[2] += px[i][2]; a[3]++
    }
    for (let j = 0; j < cents.length; j++) {
      const a = acc[j]
      if (a[3]) cents[j] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]
    }
    if (!moved && it > 0) break
  }
  const counts = cents.map(() => 0)
  for (let i = 0; i < px.length; i++) counts[asg[i]]++
  let out = cents.map((c, j) => ({ rgb: c.map(clamp255), n: counts[j] })).filter(c => c.n > 0)
  // Çox yaxın mərkəzləri birləşdir (çəkili orta)
  out.sort((a, b) => b.n - a.n)
  const merged = []
  for (const c of out) {
    const m = merged.find(o => Math.sqrt(d2(o.rgb, c.rgb)) < mergeDist)
    if (m) {
      const n = m.n + c.n
      m.rgb = m.rgb.map((v, i) => clamp255((v * m.n + c.rgb[i] * c.n) / n))
      m.n = n
    } else merged.push({ ...c })
  }
  out = merged
  return out.map(c => ({ hex: toHex(c.rgb), rgb: c.rgb, share: c.n / px.length }))
}

/** WCAG nisbi parlaqlıq (0..1) */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Kontrast nisbəti 1..21 */
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const hexOf = (c) => (typeof c === 'string' ? c : c.hex)
/** Qaranlıqdan işığa (yeni massiv; giriş dəyişmir) */
export const sortByLuminance = (cols) => [...cols].sort((a, b) => luminance(hexOf(a)) - luminance(hexOf(b)))

/** İki rəngin qarışığı (t: 0 → a, 1 → b) */
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b)
  return toHex(A.map((v, i) => v + (B[i] - v) * t))
}

/**
 * Az rəng varsa (məs. iki rəngli şəkil) — aralıq çalarlarla n-ə çatdır.
 * Nəticə parlaqlığa görə sıralanır, təkrarsızdır.
 */
export function expandPalette(hexes, n = 5) {
  const out = sortByLuminance([...new Set(hexes.map(h => h.toLowerCase()))])
  if (!out.length) return []
  const dark = out[0], light = out[out.length - 1]
  // Namizədlər sabit sırada: dərin kölgə, açıq çalar, aralıq qarışıqlar, yumşaq çalarlar
  const cands = [
    mix(dark, '#000000', 0.55), mix(light, '#ffffff', 0.7), mix(dark, light, 0.5),
    mix(dark, '#ffffff', 0.4), mix(light, '#000000', 0.35), mix(dark, light, 0.25), mix(dark, light, 0.75),
    mix(dark, '#ffffff', 0.85), mix(light, '#000000', 0.7),
  ]
  for (const c of cands) {
    if (out.length >= n) break
    if (!out.some(o => Math.sqrt(d2(hexToRgb(o), hexToRgb(c))) < 18)) out.push(c)
  }
  return sortByLuminance(out)
}

/**
 * Xətt rəngi: dəstin ən qaranlığı və ya ən işığı — doldurma rənglərinə qarşı ən pis kontrastı
 * daha yaxşı olanı. İkisi də zəifdirsə (< 1.6), qara və ya ağ.
 */
export function pickLineColor(palette, fills) {
  const s = sortByLuminance(palette)
  const fs = fills && fills.length ? fills : palette
  const worst = (c) => Math.min(...fs.map(f => contrast(c, f)))
  const cands = [s[0], s[s.length - 1]].filter(c => !fs.includes(c))
  if (!cands.length) cands.push(s[0], s[s.length - 1])
  let bestC = cands[0], bestV = worst(cands[0])
  for (const c of cands.slice(1)) { const v = worst(c); if (v > bestV) { bestV = v; bestC = c } }
  if (bestV < 1.6) {
    const w = worst('#ffffff'), k = worst('#111111')
    return w >= k ? '#ffffff' : '#111111'
  }
  return bestC
}

/** Kilidlənməmiş mövqeləri sabit toxumla qarışdır (Fisher–Yates) */
export function shuffleUnlocked(arr, locked, seed) {
  const rnd = mulberry32(seed)
  const free = arr.map((_, i) => i).filter(i => !locked[i])
  const vals = free.map(i => arr[i])
  for (let i = vals.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [vals[i], vals[j]] = [vals[j], vals[i]]
  }
  const out = arr.slice()
  free.forEach((idx, k) => { out[idx] = vals[k] })
  return out
}

/**
 * Naxış zolağı (strapwork): { line, edge }. Fon (pal[0]) qaranlıqdırsa — zolaq dəstin ən açıq
 * rəngində, kənarları ən qaranlıqda (və əksinə). Zolaq fonla ən azı 3:1 kontrast versin deyə
 * lazım gələrsə ağa/qaraya doğru açılır və ya tündləşdirilir.
 */
export function strapColors(pal) {
  if (!pal.length) return { line: '#ffffff', edge: '#111111' }
  const s = sortByLuminance(pal)
  const ground = pal[0], dark = s[0], light = s[s.length - 1]
  const darkGround = luminance(ground) <= 0.4
  let line = darkGround ? light : dark
  const toward = darkGround ? '#ffffff' : '#000000'
  for (let t = 0.3; contrast(line, ground) < 3 && t <= 0.91; t += 0.3) line = mix(darkGround ? light : dark, toward, t)
  const edge = darkGround ? mix(dark, '#000000', 0.35) : mix(light, '#ffffff', 0.35)
  return { line, edge }
}
