// ═══════════════════════════════════════════════════════
// Pul məbləğini istənilən yazılışdan oxu (ZakatPage) — tests/unit/parse-amount.test.js
//
//   parseAmount('1 500,50') → 1500.5    parseAmount('1.500,50') → 1500.5    parseAmount('1,500.50') → 1500.5
//   parseAmount('2500') → 2500          parseAmount('12,5') → 12.5          parseAmount('') → NaN
//
// NİYƏ: <input type="number"> iPhone-da az/ru/tr klaviaturasında vergüllü onluğu (",") qəbul
// etmir — sahə boş qalırdı, maaş/yığım yazmaq olmurdu. İndi sahə mətndir (inputMode="decimal"),
// məbləğ isə burada oxunur: son ayırıcı (vergül və ya nöqtə) onluqdur, əgər ondan sonra 1–2
// rəqəm varsa; qalan ayırıcılar və boşluqlar minlik ayırıcısı sayılır.
// ═══════════════════════════════════════════════════════
export function parseAmount(input) {
  let s = String(input ?? '').replace(/[\s  ']/g, '')
  if (!s) return NaN
  const neg = s.startsWith('-')
  s = s.replace(/-/g, '')
  if (!/^[\d.,]+$/.test(s)) return NaN
  const last = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'))
  let int = s, frac = ''
  if (last >= 0) {
    const tail = s.slice(last + 1)
    const seps = (s.match(/[.,]/g) || []).length
    // "1.500" / "1,500" (tək ayırıcı + 3 rəqəm) — minlik; "12,5" / "12.50" — onluq
    if (tail.length > 0 && tail.length <= 2 || (seps === 1 && tail.length !== 3)) { int = s.slice(0, last); frac = tail }
  }
  int = int.replace(/[.,]/g, '')
  const v = Number(`${int || '0'}${frac ? `.${frac}` : ''}`)
  return Number.isFinite(v) ? (neg ? -v : v) : NaN
}

/** Yazılarkən sahədə yalnız rəqəm, ayırıcı, boşluq və mənfi işarəsi qalsın */
export const cleanAmountInput = (v) => String(v ?? '').replace(/[^\d.,\s -]/g, '').slice(0, 24)
