// ═══════════════════════════════════════════════════════
// Hicri doğum günü (v5.9) — saf məntiq (components/calendar/HijriBirthday, tests/unit/hijri-birthday.test.js)
//
//   hijriBirthday({ year, month, day }, today) → { hBirth, ageH, ageG, nextH, nextG, daysUntil, daysLived, isToday, extraYears }
//
// • Hicri tarix — utils/hijri (Ümmül-Qura, brauzerdə yoxdursa arifmetik təxmin).
// • Doğum günü ayın 30-dadırsa və həmin il ay 29 gündürsə — ayın son günü (29) götürülür.
// ═══════════════════════════════════════════════════════
import { gregorianToHijri, hijriToGregorian, hijriMonthLength, gDiffDays, isValidGregorian } from './hijri'

const before = (a, b) => a.month < b.month || (a.month === b.month && a.day < b.day)

function birthdayIn(year, hBirth) {
  const day = Math.min(hBirth.day, hijriMonthLength(year, hBirth.month))
  const h = { year, month: hBirth.month, day }
  return { h, g: hijriToGregorian(h) }
}

export function hijriBirthday(gBirth, today) {
  if (!isValidGregorian(gBirth) || gDiffDays(gBirth, today) < 0) return null
  const hBirth = gregorianToHijri(gBirth)
  const hToday = gregorianToHijri(today)
  const ageH = hToday.year - hBirth.year - (before(hToday, hBirth) ? 1 : 0)
  const ageG = today.year - gBirth.year - (before(today, gBirth) ? 1 : 0)
  let next = birthdayIn(hToday.year, hBirth)
  if (!next.g || gDiffDays(today, next.g) < 0) next = birthdayIn(hToday.year + 1, hBirth)
  const daysUntil = next.g ? gDiffDays(today, next.g) : null
  return {
    hBirth, hToday, ageH, ageG,
    nextH: next.h, nextG: next.g, daysUntil,
    isToday: daysUntil === 0,
    daysLived: gDiffDays(gBirth, today),
    // hicri il ~11 gün qısadır — hicri yaş miladidən neçə il çoxdur
    extraYears: ageH - ageG,
    nextAgeH: next.h.year - hBirth.year,
  }
}
