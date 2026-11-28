// ═══════════════════════════════════════════════════════
// "Namaz vaxtına görə" tema — kiçik, asılılıqsız nüvə (əsas paketdədir)
//
// Rejim əlçatanlıq panelindədir (a11yPrefs → theme: 'prayer'). Qayda:
//   sübhdən (fajr) məğribə qədər — işıqlı, məğribdən sübhə qədər — tünd.
//   (Günəşin çıxması keçid DEYİL — keçid sübhdədir.)
// Vaxtlar istifadəçinin seçdiyi şəhərin yerli hesabıdır (utils/prayerTheme.js
// tənbəl modulu — prayCalc). Burada yalnız:
//   • decidePrayerTheme(now, times) — saf qərar funksiyası (test olunur);
//   • keş: localStorage 'muslim_cc_ptheme' = { f, m } (bugünkü sübh və
//     məğribin ms damğası) və ya { s: 1 } (rejim açıqdır, şəhər yoxdur →
//     sistemin rejimi). Açar YALNIZ rejim açıq olanda var.
//   • cachedPrayerDark(now) — keşdən qərar. index.html-in <head>-indəki tema
//     skripti EYNİ hesabı edir (ilk kadr düzgün olsun) — biri dəyişsə, o biri də.
// ═══════════════════════════════════════════════════════

export const PRAYER_THEME_KEY = 'muslim_cc_ptheme'
/** Tema tətbiq olunanda (keçid və ya rejim dəyişəndə) — LangContext vəziyyəti eyniləşdirir. */
export const THEME_SYNC_EVENT = 'qm-theme-sync'

const DAY = 86400000
const ok = (v) => typeof v === 'number' && Number.isFinite(v)

/**
 * Saf qərar: indiki an + bugünkü sübh/məğrib (ms) → tema və növbəti keçid anı.
 * @param {number} now
 * @param {{ fajr?: number, maghrib?: number, nextFajr?: number }} times
 * @returns {{ theme: 'light'|'dark'|null, next: number|null }} — theme null: vaxtlar məlum deyil
 */
export function decidePrayerTheme(now, times) {
  const { fajr, maghrib, nextFajr } = times || {}
  if (!ok(now) || !ok(fajr) || !ok(maghrib) || maghrib <= fajr) return { theme: null, next: null }
  if (now < fajr) return { theme: 'dark', next: fajr }
  if (now < maghrib) return { theme: 'light', next: maghrib }
  const nf = ok(nextFajr) && nextFajr > maghrib ? nextFajr : fajr + DAY
  return { theme: 'dark', next: nf > now ? nf : null }
}

/** Keşdəki { f, m } ilə qərar (gün keçibsə də — sutkanın eyni saatları): true | false | null. */
export function darkFromCache(now, c) {
  if (!c || !ok(c.f) || !ok(c.m) || c.m <= c.f || c.m - c.f >= DAY) return null
  let x = (now - c.f) % DAY
  if (x < 0) x += DAY
  return x >= c.m - c.f
}

export function readPrayerThemeCache() {
  try {
    const v = JSON.parse(localStorage.getItem(PRAYER_THEME_KEY) || 'null')
    return v && typeof v === 'object' ? v : null
  } catch { return null }
}

export function writePrayerThemeCache(v) {
  try {
    if (v) localStorage.setItem(PRAYER_THEME_KEY, JSON.stringify(v))
    else localStorage.removeItem(PRAYER_THEME_KEY)
  } catch { /* yaddaş bağlıdır */ }
}

/**
 * Rejim açıqdırsa saytın teması: true/false (vaxtlara görə), 'system' (şəhər yoxdur);
 * rejim bağlıdırsa undefined.
 */
export function cachedPrayerDark(now = Date.now()) {
  const c = readPrayerThemeCache()
  if (!c) return undefined
  const d = darkFromCache(now, c)
  return d === null ? 'system' : d
}
