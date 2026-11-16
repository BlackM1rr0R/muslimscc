// ═══════════════════════════════════════════════════════
// Ayə yarışı (components/hifz/AyahRace.jsx) — saf məntiq
// Səviyyə artdıqca ayə uzanır; vaxt sözlərin sayına görə; səhv vaxt aparır.
// ═══════════════════════════════════════════════════════

/** Səviyyə üçün söz sayı aralığı: 1 → 3–4, 2 → 4–5 … (ən çox 14) */
export function wordRange(level) {
  const lo = Math.min(13, 2 + level)
  return [lo, lo + 1]
}

/** Uyğun ayəni seç: aralıqda olanlardan, yoxdursa ən yaxın uzunluqda; əvvəl göstərilənlər təkrarlanmır */
export function pickAyah(pool, level, seen = new Set(), rnd = Math.random) {
  const [lo, hi] = wordRange(level)
  const fresh = pool.filter((x) => !seen.has(x.key))
  const src = fresh.length ? fresh : pool
  if (!src.length) return null
  const inRange = src.filter((x) => x.words.length >= lo && x.words.length <= hi)
  if (inRange.length) return inRange[Math.floor(rnd() * inRange.length)]
  const mid = (lo + hi) / 2
  return [...src].sort((a, b) => Math.abs(a.words.length - mid) - Math.abs(b.words.length - mid))[0]
}

/** Səviyyənin vaxtı (saniyə): 8 + söz başına 2.2, səviyyə artdıqca bir az sıxılır */
export const timeFor = (nWords, level) => Math.round(8 + nWords * Math.max(1.4, 2.4 - level * 0.08))
export const PENALTY_S = 2

/** Xal: düzülən söz × 10 + qalan saniyə × 2 (yalnız səviyyə tamamlananda) */
export const levelScore = (nWords, leftS) => nWords * 10 + Math.max(0, Math.floor(leftS)) * 2

/** Qarışdır (sırası düz qalmasın), deterministik */
export function shuffleIdx(n, seed = 1) {
  let s = seed % 2147483647 || 1
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let t = 0; t < 10; t++) {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
    if (n < 2 || idx.some((v, k) => v !== k)) break
  }
  return idx
}
