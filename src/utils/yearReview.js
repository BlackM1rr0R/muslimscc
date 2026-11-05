// ═══════════════════════════════════════════════════════
// İllik icmal — hicri il (və ya istənilən dövr) üzrə şəxsi ibadət xülasəsi
// Yalnız bu cihazdakı məlumatdan (localStorage); heç nə göndərilmir.
// Saf funksiya: yearReview({ snap, periods, quranDates, charity, from, to })
// ═══════════════════════════════════════════════════════
import { dayState, addDays } from './prayerTracker'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * from/to — 'YYYY-MM-DD' (daxil). Qaytarır:
 * { days, prayers, fullDays, excusedDays, bestStreak, quranDays, charity, activeDays }
 */
export function yearReview({ snap, periods: rawPeriods, quranDates = [], charity = [], from, to }) {
  const periods = Array.isArray(rawPeriods) ? rawPeriods : (rawPeriods?.periods || [])
  let prayers = 0, fullDays = 0, excusedDays = 0, days = 0
  let streak = 0, best = 0
  const active = new Set()
  for (let d = from; d <= to; d = addDays(d, 1)) {
    days++
    const s = dayState(snap, periods, d, to)
    if (s.state === 'excused') { excusedDays++; continue }     // seriyanı qırmır
    prayers += s.performed
    if (s.performed) active.add(d)
    if (s.state === 'complete') { fullDays++; streak++; best = Math.max(best, streak) } else if (d !== to) streak = 0
    if (days > 400) break                                        // qoruyucu
  }
  const inRange = (d) => typeof d === 'string' && DATE_RE.test(d) && d >= from && d <= to
  const qd = [...new Set(quranDates.filter(inRange))]
  qd.forEach(d => active.add(d))
  const ch = charity.filter(e => e && inRange(e.date))
  ch.forEach(e => active.add(e.date))
  return { days, prayers, fullDays, excusedDays, bestStreak: best, quranDays: qd.length, charity: ch.length, activeDays: active.size }
}
