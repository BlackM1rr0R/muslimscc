// ═══════════════════════════════════════════════════════
// Əzbərlənən surələrin günü (J6, mənəvi zaman xətti) — hifz_progress-də tarix yoxdur
//
// Açar: hifz_dates_v1 → { '<surə>': 'YYYY-MM-DD' } — surənin "əzbər" (2) kimi İLK görüldüyü gün.
// Yazılır: HifzPage surəni "əzbər" edəndə, zaman xətti qurulanda isə hələ tarixi olmayan əzbər
// surələr üçün (bu günün tarixi ilə — "ilk dəfə qeyd olunduğu gün"; geriyə tarix uydurulmur).
// Profilə aiddir (PROFILE_KEYS); sinxronda — hər surə üçün ən erkən gün (utils/syncMergers).
// ═══════════════════════════════════════════════════════
export const HIFZ_DATES_KEY = 'hifz_dates_v1'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const today0 = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export function sanitizeHifzDates(raw) {
  const out = {}
  for (const [k, v] of Object.entries(isObj(raw) ? raw : {})) {
    const n = Number(k)
    if (Number.isInteger(n) && n >= 1 && n <= 114 && typeof v === 'string' && DATE_RE.test(v)) out[n] = v
  }
  return out
}

export function readHifzDates(storage = safeStorage()) {
  try { return sanitizeHifzDates(JSON.parse(storage?.getItem(HIFZ_DATES_KEY) || 'null')) } catch { return {} }
}

/**
 * progress — { surə: 1|2 } (hifz_progress). Tarixi olmayan "əzbər" surələrə bu günü yaz.
 * Qaytarır: yenilənmiş xəritə (dəyişməyibsə yazmır).
 */
export function recordHifzDates(progress, { storage = safeStorage(), today = today0() } = {}) {
  const dates = readHifzDates(storage)
  let changed = false
  for (const [k, v] of Object.entries(isObj(progress) ? progress : {})) {
    const n = Number(k)
    if (Number(v) === 2 && Number.isInteger(n) && n >= 1 && n <= 114 && !dates[n]) { dates[n] = today; changed = true }
  }
  if (changed) {
    try { storage?.setItem(HIFZ_DATES_KEY, JSON.stringify(dates)) } catch { /* yaddaş bağlıdır */ }
    // mənəvi zaman xətti (utils/journeyStore → JOURNEY_EVENT) yenilənsin
    try { globalThis.dispatchEvent?.(new CustomEvent('mcc-journey')) } catch { /* */ }
  }
  return dates
}
