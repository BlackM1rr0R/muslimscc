// ═══════════════════════════════════════════════════════
// /hifz → "Analitika" bölməsi üçün saf hesab (tests/unit/hifz-insights.test.js)
// Məlumat: 'hifz_srs' (log: { 'YYYY-MM-DD': { reviews, new } }, items) və
// 'hifz_progress' ({ surə: 1 | 2 }). Heç nə uydurulmur.
// ═══════════════════════════════════════════════════════
import { isDay } from './trackerInsights.js'

/** Gün açarları üzrə təkrar və yeni ayə sıraları. */
export function hifzSeries(log, keys) {
  const L = log && typeof log === 'object' ? log : {}
  const reviews = [], added = [], total = []
  for (const k of keys) {
    const d = L[k] || {}
    const r = Math.max(0, Number(d.reviews) || 0), n = Math.max(0, Number(d.new) || 0)
    reviews.push(r); added.push(n); total.push(r + n)
  }
  return { reviews, added, total }
}

/** Yalnız yeni ayələr: { gün: say } (temp hesabı üçün). */
export function newByDay(log) {
  const out = {}
  for (const [k, v] of Object.entries(log && typeof log === 'object' ? log : {})) {
    const n = Number(v?.new) || 0
    if (isDay(k) && n > 0) out[k] = n
  }
  return out
}

/**
 * Ayələr üzrə bölgü: əzbər (status 2 surənin bütün ayələri və ya SRS-dəki ayələr),
 * davam edən surələrin qalan ayələri, başlanmamış.
 * surahs: [{ num, ayahs }], progress: { num: 1|2 }, counts: { num: SRS ayə sayı }
 */
export function ayahBreakdown(surahs, progress, counts) {
  let mem = 0, prog = 0, rest = 0
  for (const s of surahs) {
    const st = progress?.[s.num] || 0
    const c = Math.min(s.ayahs, counts?.[s.num] || 0)
    if (st === 2) { mem += s.ayahs; continue }
    mem += c
    if (st === 1) prog += s.ayahs - c
    else rest += s.ayahs - c
  }
  return { memorised: mem, inProgress: prog, notStarted: rest }
}

/** Son qeyd günləri (yenidən köhnəyə), ən çox max. */
export function recentLogDays(log, max = 6) {
  return Object.entries(log && typeof log === 'object' ? log : {})
    .filter(([k, v]) => isDay(k) && ((Number(v?.reviews) || 0) + (Number(v?.new) || 0)) > 0)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, max)
    .map(([k, v]) => ({ day: k, reviews: Number(v.reviews) || 0, added: Number(v.new) || 0 }))
}
