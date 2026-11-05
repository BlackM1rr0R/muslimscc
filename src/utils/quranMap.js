// Quranın bütöv xəritəsi (components/QuranMap.jsx) — saf hesab (tests/unit/quran-map.test.js)
// 6236 ayə oxu sırası ilə bir şəbəkədə; hər xananın vəziyyəti hifz yaddaşından.
import { SURAH_META } from '../seo/surahMeta'

export const AYAH_COUNTS = SURAH_META.map(m => m[4])
export const MADANI = SURAH_META.map(m => m[3] === 'D')
export const TOTAL = AYAH_COUNTS.reduce((a, b) => a + b, 0) // 6236

// Surənin ilk ayəsinin ümumi indeksi (0-dan)
export const SURAH_START = AYAH_COUNTS.reduce((acc, n, i) => { acc.push(i ? acc[i - 1] + AYAH_COUNTS[i - 1] : 0); return acc }, [])

/** Ümumi indeks (0…6235) → { s, a } */
export function refAt(idx) {
  if (!(idx >= 0 && idx < TOTAL)) return null
  let lo = 0, hi = SURAH_START.length - 1
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SURAH_START[m] <= idx) lo = m; else hi = m - 1 }
  return { s: lo + 1, a: idx - SURAH_START[lo] + 1 }
}

/**
 * Vəziyyət massivi: 0 — yox, 1 — öyrənilir (surə "öyrənirəm"), 2 — əzbər
 * progress: { [surə]: 0|1|2 } (köhnə izləyici), srsItems: { 's:a': {...} }
 */
export function mapStates(progress = {}, srsItems = {}) {
  const st = new Uint8Array(TOTAL)
  for (let s = 1; s <= AYAH_COUNTS.length; s++) {
    const v = progress[s]
    if (v === 2 || v === 1) st.fill(v, SURAH_START[s - 1], SURAH_START[s - 1] + AYAH_COUNTS[s - 1])
  }
  for (const k of Object.keys(srsItems)) {
    const [s, a] = k.split(':').map(Number)
    if (s >= 1 && s <= 114 && a >= 1 && a <= AYAH_COUNTS[s - 1]) st[SURAH_START[s - 1] + a - 1] = 2
  }
  return st
}

export const countStates = (st) => st.reduce((c, v) => { c[v]++; return c }, [0, 0, 0])
