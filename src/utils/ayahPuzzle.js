// ═══════════════════════════════════════════════════════
// Ayə tapmacası (v6.2) — components/hifz/AyahPuzzle.jsx (/hifz → məşq kartı → "Tapmaca")
// Saf məntiq: sözləri raundlara bölmək, qarışdırmaq, yoxlamaq, qiymət təklif etmək.
// tests/unit/ayah-puzzle.test.js
// ═══════════════════════════════════════════════════════

/** Sözləri ≤ size sözlük raundlara bölür (raundlar bərabərə yaxın) */
export function puzzleRounds(words, size = 8) {
  const n = words.length
  if (!n) return []
  const k = Math.ceil(n / size), per = Math.ceil(n / k)
  const out = []
  for (let i = 0; i < n; i += per) out.push({ from: i, to: Math.min(n, i + per) })
  return out
}

/** Toxumlu təsadüfi ədəd (mulberry32) */
function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/**
 * [from, to) aralığındakı indekslərin qarışıq sırası. Eyni sözlər (mətni eyni) fərqlənmir —
 * ona görə "düz sıra" yalnız mətnlərə görə yoxlanılır: 2+ fərqli söz varsa, nəticə heç vaxt düz sıra deyil.
 */
export function shuffledRound(words, { from, to }, seed = 1) {
  const idx = []
  for (let i = from; i < to; i++) idx.push(i)
  const r = rng(seed)
  const distinct = new Set(idx.map(i => words[i])).size > 1
  for (let tries = 0; tries < 20; tries++) {
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
    if (!distinct || idx.some((v, k) => words[v] !== words[from + k])) break
  }
  return idx
}

/** Növbəti yerə bu söz düşürmü (eyni mətnli sözlər bir-birini əvəz edə bilər) */
export const fitsNext = (words, placed, wordIdx) => words[wordIdx] === words[placed]

/** Səhv sayına görə hifz qiyməti təklifi (utils/hifzSrs GRADES) */
export function suggestGrade(mistakes, total) {
  if (mistakes === 0) return 'good'
  if (mistakes <= Math.max(1, Math.round(total * 0.15))) return 'hard'
  return 'again'
}
