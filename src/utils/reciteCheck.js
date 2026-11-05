// Səsli hifz yoxlaması (components/hifz/ReciteCheck.jsx) — saf tutuşdurma (tests/unit/recite-check.test.js)
//
// Quran mətni və nitq tanımanın yazdığı mətn hərəkəsiz, əlif/ya/ta-mərbuta növləri
// birləşdirilmiş formaya salınır, sonra sözlər LCS (ən uzun ortaq alt ardıcıllıq) ilə
// düzülür: hər Quran sözü — 'ok' (oxundu) və ya 'miss' (buraxıldı / səhv).
// Nitq tanıma ərəbcədə səhv edə bilər — nəticə yalnız köməkçidir, müəllimin yerini tutmur.

export function normAr(s) {
  return String(s || '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '') // hərəkə, Quran işarələri, tətvil
    .replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

export const words = (s) => normAr(s).split(' ').filter(Boolean)

/** İki söz "eynidir": tam bərabər və ya qısa sözlərdə 1, uzunlarda 2 hərf fərqi (tanıma xətası) */
export function sameWord(a, b) {
  if (a === b) return true
  const la = a.length, lb = b.length
  if (Math.abs(la - lb) > 2 || Math.min(la, lb) < 3) return false
  const tol = Math.max(la, lb) >= 6 ? 2 : 1
  // Levenshtein (kiçik sözlər üçün kifayət qədər sürətli)
  let prev = Array.from({ length: lb + 1 }, (_, j) => j)
  for (let i = 1; i <= la; i++) {
    const cur = [i]
    for (let j = 1; j <= lb; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[lb] <= tol
}

/**
 * Quran sözlərini oxunanla düzül.
 * @returns {{ marks: ('ok'|'miss')[], score: number }}  score — oxunan sözlərin payı (0…1)
 */
export function alignRecitation(quranText, spoken) {
  const q = words(quranText), s = words(spoken)
  const n = q.length, m = s.length
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    dp[i][j] = sameWord(q[i], s[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const marks = new Array(n).fill('miss')
  let i = 0, j = 0
  while (i < n && j < m) {
    if (sameWord(q[i], s[j]) && dp[i][j] === dp[i + 1][j + 1] + 1) { marks[i] = 'ok'; i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  const ok = marks.filter(x => x === 'ok').length
  return { marks, score: n ? ok / n : 0 }
}
