// Quranın mozaikası (components/quran/QuranMosaic.jsx, v6.4) — saf hesab (tests/unit/quran-mosaic.test.js)
// 6236 ayə oxu sırası ilə; hər xananın rəngi seçilmiş görünüşə görə.
import { TOTAL, MADANI, SURAH_START, AYAH_COUNTS, refAt } from './quranMap'
import { JUZ_VERSES } from '../data/juzMap'
import { AYAH_WORDS } from '../data/ayahWords'

export { TOTAL, refAt }

// Səcdə ayələri — api.alquran.cloud/v1/sajda (Tanzil məlumatı; 2026-11-12 yoxlanılıb), 15 ayə.
// 22:77 bəzi məzhəblərdə səcdə yeri sayılmır — kartda qeyd olunur.
export const SAJDAH = ['7:206', '13:15', '16:50', '17:109', '19:58', '22:18', '22:77', '25:60', '27:26', '32:15', '38:24', '41:38', '53:62', '84:21', '96:19']

export const indexOf = (s, a) => SURAH_START[s - 1] + a - 1
export const SAJDAH_IDX = new Set(SAJDAH.map(k => { const [s, a] = k.split(':').map(Number); return indexOf(s, a) }))

/** Hər ayənin cüzü (1…30) */
export const JUZ_OF = (() => {
  const out = new Uint8Array(TOTAL)
  JUZ_VERSES.forEach((parts, j) => parts.forEach(([s, a1, a2]) => out.fill(j + 1, indexOf(s, a1), indexOf(s, a2) + 1)))
  return out
})()

export const MAX_WORDS = Math.max(...AYAH_WORDS)
export const wordsAt = (idx) => AYAH_WORDS[idx]
export const isMadani = (idx) => MADANI[refAt(idx).s - 1]

// Uzunluq şkalası: 0…1 — faiz sırası (persentil). Ayələrin çoxu qısadır; xətti/loqarifmik
// şkalada şəkil "küy" kimi görünür, sırada isə uzun Mədəni və qısa Məkki hissələr seçilir.
const SORTED = [...AYAH_WORDS].sort((x, y) => x - y)
const RANK = (() => {
  const m = new Map()
  SORTED.forEach((w, i) => { if (!m.has(w)) m.set(w, [i, i]); else m.get(w)[1] = i })
  return m
})()
export const lengthT = (w) => { const r = RANK.get(w); return r ? ((r[0] + r[1]) / 2) / (SORTED.length - 1) : 0 }

/** Surə üzrə statistika: ən uzun / ən qısa ayə (söz sayı) */
export function longestAyahs(n = 5) {
  return AYAH_WORDS.map((w, i) => ({ i, w })).sort((x, y) => y.w - x.w || x.i - y.i).slice(0, n).map(({ i, w }) => ({ ...refAt(i), w }))
}

export function surahWords(s) {
  let sum = 0
  for (let a = 0; a < AYAH_COUNTS[s - 1]; a++) sum += AYAH_WORDS[SURAH_START[s - 1] + a]
  return sum
}

export const TOTAL_WORDS = AYAH_WORDS.reduce((x, y) => x + y, 0)
