// ═══════════════════════════════════════════════════════
// Surə vizualları — saf hesab (tests/unit/surah-viz.test.js)
//
// YALNIZ saytın öz məlumatı (heç bir uydurma rəqəm yoxdur):
//   • ayə sayı, Məkki/Mədəni — seo/surahMeta (alquran.cloud)
//   • nazil olma sırası — data/surahRevelation (Quran.com, məşhur cədvəl)
//   • cüzlər — data/juzMap, mushaf səhifələri — data/mushafIndex
//   • hər ayənin söz sayı — data/ayahWords (Tanzil, utils/quranMosaic)
//   • səcdə ayələri — utils/quranMosaic → SAJDAH (15 yer)
//   • müqəttəə hərfləri — data/muqattaat (Osmani mətnindən hərfi-hərfinə)
//
// glyphSpec(n) — surənin həndəsi rozeti; hər parametr bir faktı kodlayır:
//   guşə sayı        ← ayə sayı (log şkala, 6…16)
//   guşənin dərinliyi ← orta söz sayı (qısa ayələr — iti ulduz, uzun — dolğun)
//   qat sayı          ← surənin keçdiyi cüzlərin sayı (1…4)
//   orbitdəki nöqtə   ← nazil olma sırası (bucaq = sıra / 114 × 360°)
//   xarici halqa      ← Mədəni — bütöv, Məkki — nöqtəli (rəngdən əlavə forma ilə)
//   kiçik romblar     ← səcdə ayələrinin surədəki yeri
// Nazil olma sırası 114 surədə təkrarlanmır — rozetlər də təkrarlanmır.
// ═══════════════════════════════════════════════════════
import { SURAH_META } from '../../../seo/surahMeta'
import { REVELATION_ORDER } from '../../../data/surahRevelation'
import { juzOfSurah } from '../../../data/juzMap'
import { SURAH_TABLE } from '../../../data/mushafIndex'
import { MUQATTAAT, comboOf } from '../../../data/muqattaat'
import { SAJDAH, wordsAt } from '../../../utils/quranMosaic'
import { SURAH_START } from '../../../utils/quranMap'

const r2 = (x) => Math.round(x * 100) / 100
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))

/** Surənin hər ayəsinin söz sayı (Tanzil) */
export function surahWordList(n) {
  const m = SURAH_META[n - 1]
  if (!m) return []
  const out = new Array(m[4])
  for (let a = 0; a < m[4]; a++) out[a] = wordsAt(SURAH_START[n - 1] + a)
  return out
}

// Səcdə ayələri surə üzrə: { 7: [206], 22: [18, 77], … }
const SAJDAH_BY = SAJDAH.reduce((acc, k) => {
  const [s, a] = k.split(':').map(Number)
  ;(acc[s] ||= []).push(a)
  return acc
}, {})

const FACTS = new Map()
/** Surənin faktları (keşlə — 114 kartda bir dəfə hesablanır) */
export function surahFacts(n) {
  const k = Number(n)
  if (FACTS.has(k)) return FACTS.get(k)
  const m = SURAH_META[k - 1]
  if (!m) return null
  const words = surahWordList(k)
  const total = words.reduce((x, y) => x + y, 0)
  const juz = juzOfSurah(k)
  const row = SURAH_TABLE[k - 1]
  const mq = MUQATTAAT.find(x => x.s === k)
  const f = {
    n: k,
    ayahs: m[4],
    madani: m[3] === 'D',
    order: REVELATION_ORDER[k - 1],
    juz: juz.length ? [juz[0], juz[juz.length - 1]] : [1, 1],
    pages: row ? [row[0], row[1]] : [1, 1],
    words: total,
    avg: total / Math.max(1, m[4]),
    sajdah: SAJDAH_BY[k] || [],
    letters: mq ? comboOf(mq) : '',
  }
  FACTS.set(k, f)
  return f
}

/** Rozetin parametrləri (yuxarıdakı cədvəl) */
export function glyphSpec(n) {
  const f = surahFacts(n)
  if (!f) return null
  const folds = clamp(Math.round(4 + 1.5 * Math.log2(Math.max(2, f.ayahs))), 6, 16)
  const depth = clamp((Math.log(f.avg) - Math.log(2)) / (Math.log(30) - Math.log(2)), 0, 1)
  return {
    n: f.n,
    folds,
    ratio: r2(0.36 + 0.4 * depth),
    layers: clamp(f.juz[1] - f.juz[0] + 1, 1, 4),
    orbit: r2(((f.order - 1) / 114) * 360),
    solid: f.madani,
    sajdah: f.sajdah.map(a => r2((a / f.ayahs) * 360)),
  }
}

export function starPath(cx, cy, k, rOut, rIn, rot = -Math.PI / 2) {
  let d = ''
  for (let i = 0; i < k * 2; i++) {
    const r = i % 2 ? rIn : rOut
    const a = rot + (i * Math.PI) / k
    d += `${i ? 'L' : 'M'}${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}`
  }
  return `${d}Z`
}

const polar = (deg, r, c = 50) => {
  const a = (deg - 90) * (Math.PI / 180)
  return { x: r2(c + r * Math.cos(a)), y: r2(c + r * Math.sin(a)) }
}

const GEO = new Map()
/** Rozetin SVG həndəsəsi (viewBox 0 0 100 100) — keşlə */
export function glyphGeometry(n) {
  const k = Number(n)
  if (GEO.has(k)) return GEO.get(k)
  const s = glyphSpec(k)
  if (!s) return null
  const layers = []
  for (let i = 0; i < s.layers; i++) {
    const r = 38 - i * (20 / s.layers)
    // hər qat yarım guşə dönür — qatlar bir-birinin arasından görünür
    layers.push(starPath(50, 50, s.folds, r, r * s.ratio, -Math.PI / 2 + (i * Math.PI) / s.folds))
  }
  const g = {
    spec: s,
    layers,
    core: r2((38 - (s.layers - 1) * (20 / s.layers)) * s.ratio * 0.5),
    orbit: polar(s.orbit, 46),
    sajdah: s.sajdah.map(d => polar(d, 46)),
  }
  GEO.set(k, g)
  return g
}

/** Kartdakı kiçik "ayə dalğası": ≤ max sütun (hər sütun — ayələrin orta söz sayı) */
export function sparkBars(n, max = 40) {
  const w = surahWordList(n)
  if (!w.length) return []
  const step = Math.max(1, Math.ceil(w.length / max))
  const out = []
  for (let i = 0; i < w.length; i += step) {
    let sum = 0, c = 0
    for (let j = i; j < Math.min(w.length, i + step); j++) { sum += w[j]; c++ }
    out.push(sum / c)
  }
  return out
}

/** Dalğa sütunlarından tək SVG yolu (viewBox 0 0 100 h) — 114 kartda tək element */
export function sparkPath(bars, h = 20) {
  if (!bars.length) return ''
  const mx = Math.max(...bars) || 1
  const bw = 100 / bars.length
  const gap = Math.min(1.2, bw * 0.3)
  let d = ''
  bars.forEach((v, i) => {
    const bh = Math.max(1.5, (v / mx) * h)
    const x = r2(i * bw + gap / 2), w = r2(Math.max(0.6, bw - gap))
    d += `M${x} ${r2(h - bh)}h${w}V${h}h${-w}Z`
  })
  return d
}

/** 114 surə nazil olma sırası ilə: [{ n, madani }] (indeks = sıra − 1) */
export const REVELATION_SEQ = (() => {
  const out = new Array(114)
  REVELATION_ORDER.forEach((o, i) => { out[o - 1] = { n: i + 1, madani: SURAH_META[i][3] === 'D' } })
  return out
})()

/** Cüz halqası: 30 seqmentin yolları (viewBox 0 0 100 100), gap — dərəcə */
export function juzRing(r = 40, gap = 2.4) {
  const seg = 360 / 30
  return Array.from({ length: 30 }, (_, i) => {
    const a0 = i * seg + gap / 2, a1 = (i + 1) * seg - gap / 2
    const p0 = polar(a0, r), p1 = polar(a1, r)
    return `M${p0.x} ${p0.y}A${r} ${r} 0 0 1 ${p1.x} ${p1.y}`
  })
}

// ── "Quranın gecə səması": surənin öz bürcü ──
// Ayələr ardıcıl addımlarla düzülür: addımın uzunluğu ayənin söz sayından, dönmə
// bucağı söz sayı və ayə nömrəsindən — təsadüf yoxdur, hər açılışda eyni şəkil.
function mulberry(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Bürcün ulduzları: [{ a, x, y, r }] — x,y vahid kvadratda (0…1), r — nisbi ölçü (0.4…1).
 * words — ayələrin söz sayı (surahWordList)
 */
export function constellation(n, words = surahWordList(n)) {
  const N = words.length
  if (!N) return []
  const mx = Math.max(...words) || 1
  const pts = []
  let x = 0, y = 0
  let head = ((Number(n) || 1) * 137.508) * (Math.PI / 180)
  const stepBase = 1 / Math.sqrt(N)
  for (let i = 0; i < N; i++) {
    const w = words[i] / mx
    pts.push({ a: i + 1, x, y, r: r2(0.4 + 0.6 * Math.sqrt(w)) })
    const turn = (((words[i] * 7 + i * 3) % 11) - 5) * 0.3 + 0.12
    head += turn
    const step = stepBase * (0.35 + 1.5 * Math.pow(w, 1.15))
    x += Math.cos(head) * step
    y += Math.sin(head) * step
  }
  // vahid kvadrata sığdır (nisbət saxlanır, mərkəzdə)
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y) }
  const span = Math.max(x1 - x0, y1 - y0) || 1
  const ox = (span - (x1 - x0)) / 2, oy = (span - (y1 - y0)) / 2
  return pts.map(p => ({ ...p, x: r2((p.x - x0 + ox) / span * 1000) / 1000, y: r2((p.y - y0 + oy) / span * 1000) / 1000 }))
}

/** Fon ulduzları (qəti) — vahid kvadratda */
export function backgroundStars(count, seed) {
  const rnd = mulberry(seed)
  return Array.from({ length: count }, () => ({ x: rnd(), y: rnd(), r: 0.3 + rnd() * 0.9, o: 0.25 + rnd() * 0.55 }))
}

/** Bürcü w×h kətanına yerləşdir: pad — kənar boşluq (piksel), top/bottom — mətn üçün yer */
export function fitBox(w, h, { pad = 0.1, top = 0, bottom = 0 } = {}) {
  const ih = h - top - bottom
  const side = Math.min(w, ih) * (1 - 2 * pad)
  return { x: (w - side) / 2, y: top + (ih - side) / 2, s: side }
}

/** Divar kağızı ölçüləri (yalnız şəxsi yükləmə) */
export const WALLPAPERS = { phone: { w: 1080, h: 1920 }, desktop: { w: 2560, h: 1440 } }
