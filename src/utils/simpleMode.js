// ═══════════════════════════════════════════════════════
// Sadə rejim (/simple) — yaşlılar və az görənlər üçün: yalnız bu cihazın tərcihi
//
//   simple_mode_v1 { home, xl, s, a, d, c }
//     home — sayt açılanda (ana səhifəyə ilk giriş) birbaşa sadə ekran açılsın
//     xl   — daha da iri yazı
//     s / a — son dinlənən surə və ayə ("davam et"); d / c — seçilmiş zikr və onun sayı
// Hesaba / serverə GETMİR: açar ehtiyat nüsxədən və sinxronizasiyadan çıxarılıb (utils/userBackup →
// EXCLUDE_KEYS) — "başlanğıc ekranı" hər cihazın öz seçimidir. tests/unit/simple-mode.test.js
// ═══════════════════════════════════════════════════════
import { AYAH_COUNTS } from './quranMap'

export const SIMPLE_KEY = 'simple_mode_v1'
export const DEFAULT_SIMPLE = { home: false, xl: false, s: 0, a: 0, d: 0, c: 0 }

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const safe = () => { try { return globalThis.localStorage } catch { return null } }

export function sanitizeSimple(v, dhikrCount = 100) {
  const o = isObj(v) ? v : {}
  const s = Number.isInteger(o.s) && o.s >= 1 && o.s <= 114 ? o.s : 0
  const a = s && Number.isInteger(o.a) && o.a >= 1 && o.a <= AYAH_COUNTS[s - 1] ? o.a : (s ? 1 : 0)
  return {
    home: o.home === true,
    xl: o.xl === true,
    s, a,
    d: Number.isInteger(o.d) && o.d >= 0 && o.d < dhikrCount ? o.d : 0,
    c: Number.isInteger(o.c) && o.c >= 0 && o.c <= 100000 ? o.c : 0,
  }
}

export function readSimple(storage = safe()) {
  try { return sanitizeSimple(JSON.parse(storage?.getItem(SIMPLE_KEY) || 'null')) } catch { return { ...DEFAULT_SIMPLE } }
}

export function writeSimple(patch, storage = safe()) {
  const v = sanitizeSimple({ ...readSimple(storage), ...patch })
  try {
    if (JSON.stringify(v) === JSON.stringify(DEFAULT_SIMPLE)) storage?.removeItem(SIMPLE_KEY)
    else storage?.setItem(SIMPLE_KEY, JSON.stringify(v))
  } catch { /* yaddaş bağlıdır — seçim bu sessiyada qalır */ }
  return v
}

/**
 * Sayt ana səhifədən AÇILIBSA (sənədin ilk ünvanı ana səhifədir — dil yönləndirməsi olsa belə) və
 * seçim açıqdırsa → true. isHome(path) — routes.parsePath ilə yoxlama (bu fayl yüngül qalsın deyə ötürülür).
 */
export function shouldStartSimple(docPath, isHome, storage = safe()) {
  if (typeof docPath !== 'string' || !docPath || typeof isHome !== 'function') return false
  return isHome(docPath) && readSimple(storage).home
}

/** Sənədin ilk ünvanının yolu (Navigation Timing; yoxdursa — indiki ünvan) */
export function documentPath() {
  try {
    const nav = globalThis.performance?.getEntriesByType?.('navigation')?.[0]
    if (nav?.name) return new URL(nav.name).pathname
  } catch { /* köhnə brauzer */ }
  try { return globalThis.location?.pathname || '' } catch { return '' }
}
