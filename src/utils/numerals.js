// ═══════════════════════════════════════════════════════
// Rəqəm sistemləri (components/NumeralsJourney) — ədədi müxtəlif yazılışlarda göstər
// ═══════════════════════════════════════════════════════
const DIGITS = {
  western: '0123456789',
  arab: '٠١٢٣٤٥٦٧٨٩',      // şərqi ərəb (Məşriq)
  arabext: '۰۱۲۳۴۵۶۷۸۹',   // fars / urdu
  deva: '०१२३४५६७८९',      // Hind (devanaqari)
}
export const SYSTEMS = Object.keys(DIGITS)

/** Onluq rəqəmləri başqa sistemin işarələrinə çevir */
export function toDigits(str, system) {
  const d = DIGITS[system]
  if (!d) return String(str)
  return String(str).replace(/[0-9]/g, (c) => d[c.charCodeAt(0) - 48])
}

/** 1…3999 → Roma rəqəmi; sıfır və ya hədd xarici — null (Roma sistemində sıfır yoxdur) */
export function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return null
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, s] of map) while (n >= v) { out += s; n -= v }
  return out
}

/** İstifadəçi girişini təmizlə: yalnız rəqəmlər (istənilən sistemdə yazılsa da), ən çox 12 */
export function normalizeInput(raw) {
  let s = String(raw || '')
  for (const d of Object.values(DIGITS)) s = s.replace(new RegExp(`[${d}]`, 'g'), (c) => String(d.indexOf(c)))
  return s.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
}
