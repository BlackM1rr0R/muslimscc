// Zikr xurma bağı (components/dhikr/PalmGarden): "Sübhanəllahil-əzimi və bihəmdihi" deyişlərinin sayı.
// Yalnız bu cihazda (localStorage). Tirmizi 3464 — hər deyiş Cənnətdə bir xurma ağacı.
export const PALM_KEY = 'dhikr_palms_v1'
export const PALM_SOURCE = 'Tirmizi 3464'
export function loadPalms() {
  try { const n = parseInt(localStorage.getItem(PALM_KEY), 10); return Number.isFinite(n) && n > 0 ? n : 0 } catch { return 0 }
}
export function bumpPalm(n = 1) {
  const v = loadPalms() + n
  try { localStorage.setItem(PALM_KEY, String(v)) } catch { /* yaddaş bağlıdır */ }
  return v
}
