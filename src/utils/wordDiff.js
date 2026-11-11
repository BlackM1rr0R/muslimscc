// ═══════════════════════════════════════════════════════
// İki mətnin söz-söz fərqi (v6.0 — Quran "iki tərcümə yan-yana", tests/unit/word-diff.test.js)
//
//   diffWords(a, b) → [{ w: 'söz ', same: true|false }]   — b-nin sözləri, a ilə ortaq olmayanlar same:false
//
// Ən uzun ortaq söz ardıcıllığı (LCS); müqayisə kiçik hərflə, durğu işarələrisiz.
// Çox uzun mətnlərdə (> 400 söz) fərq göstərilmir (hamısı same:true) — yavaşlamasın.
// ═══════════════════════════════════════════════════════
const key = (w) => w.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
export function diffWords(a, b) {
  const A = String(a || '').split(/\s+/).filter(Boolean)
  const parts = String(b || '').split(/(\s+)/)
  const B = parts.filter((_, i) => i % 2 === 0).filter(Boolean)
  const out = B.map(w => ({ w, same: true }))
  if (!A.length || !B.length || A.length > 400 || B.length > 400) return out.map((x, i) => ({ ...x, w: x.w + (i < out.length - 1 ? ' ' : '') }))
  const ka = A.map(key), kb = B.map(key)
  const m = ka.length, n = kb.length, dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1))
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = ka[i - 1] && ka[i - 1] === kb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  const inB = new Uint8Array(n)
  for (let i = m, j = n; i > 0 && j > 0;) {
    if (ka[i - 1] && ka[i - 1] === kb[j - 1]) { inB[j - 1] = 1; i--; j-- } else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--
  }
  return B.map((w, j) => ({ w: w + (j < n - 1 ? ' ' : ''), same: !!inB[j] || !kb[j] }))
}
