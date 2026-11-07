// ═══════════════════════════════════════════════════════
// İlk gəlişdə dil seçimi — brauzerin dili ilə (ölkəyə/IP-yə görə YOX).
//
// NİYƏ IP yox: Googlebot ABŞ-dan gəlir — ölkəyə görə məcburi yönləndirmə
// digər dil variantlarını robotdan gizlədərdi; ölkə ilə dil də üst-üstə
// düşmür (Rusiyada yaşayan azərbaycanlı). Brauzer dili istifadəçinin öz
// seçimidir. Qərar: 2026-11-06.
//
// Qayda (pickBrowserLang):
//   1. Brauzer dillərindən biri az-dırsa və ya saat qurşağı Asia/Baku-dursa —
//      az (əsas auditoriyanın brauzeri çox vaxt ingiliscə/rusca olur).
//   2. Əks halda — dillərin ilki ki, sayt onu dəstəkləyir (en, ru, ar, tr…).
//   3. Heç biri dəstəklənmirsə — ingiliscə (az-dan daha anlaşıqlı).
// Robot və avtomatlaşdırılmış brauzer (navigator.webdriver) yönləndirilmir.
// ═══════════════════════════════════════════════════════

const BOT_RE = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|embedly|whatsapp|telegram/i

/** Dil kodunun əsası: "ru-RU" → "ru", "zh-Hant-TW" → "zh". */
// Brauzerin kodu → saytın kodu: filippin dili "fil", sorani kürd dili "ckb" kimi gəlir
const ALIAS = { fil: 'tl', ckb: 'ku', kmr: 'ku' }
const base = (code) => { const b = String(code || '').toLowerCase().split(/[-_]/)[0]; return ALIAS[b] || b }

/**
 * Brauzerin dillərinə görə saytın dili.
 * @param {string[]} languages — navigator.languages
 * @param {string} timeZone — Intl…resolvedOptions().timeZone
 * @param {string[]} supported — saytın dilləri (routes.js → LANGS)
 * @param {string} fallback — heç biri uyğun deyilsə
 */
export function pickBrowserLang(languages, timeZone, supported, fallback = 'en') {
  const list = (languages || []).map(base).filter(Boolean)
  if (supported.includes('az') && (list.includes('az') || timeZone === 'Asia/Baku')) return 'az'
  const hit = list.find(l => supported.includes(l))
  if (hit) return hit
  return supported.includes(fallback) ? fallback : supported[0]
}

/** Bu ziyarətçini avtomatik yönləndirmək olarmı (robot/avtomat deyil)? */
export function canAutoRedirect(nav = typeof navigator !== 'undefined' ? navigator : null) {
  if (!nav) return false
  if (nav.webdriver) return false
  return !BOT_RE.test(String(nav.userAgent || ''))
}

/** Cari brauzerin seçimi (window/Intl yoxdursa null). */
export function browserLang(supported) {
  if (typeof navigator === 'undefined') return null
  let tz = ''
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { /* köhnə brauzer */ }
  const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]
  return pickBrowserLang(langs, tz, supported)
}
