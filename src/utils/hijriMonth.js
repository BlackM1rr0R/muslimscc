// ═══════════════════════════════════════════════════════
// Hicri ayın görünüşü — html[data-hmonth] (styles/HijriMonth.css, Header → HeaderHijriBadge)
//
//   hmonthOf(h)      → 'ramadan' | 'dhul10' | 'sacred' | ''   (saf, test olunur)
//   isSacredMonth(h) → dörd haram ay: Məhərrəm (1), Rəcəb (7), Zülqədə (11), Zülhiccə (12)
//                      — Tövbə 9:36; adları Buxari 3197 (data/guides/CalendarPage.js)
//   applyHijriMonth() — main.jsx İLK RENDER-DƏN ƏVVƏL çağırır: <html>-ə data-hmonth və
//                      data-season (utils/wow.js → seasonOf; əvvəl orada boş vaxtda hesablanırdı)
//
// • 'dhul10' — Zülhiccənin ilk on günü (1–10). Bu ay həm də haram aydır — nişan göstərilir.
//   10-cu gün eyni zamanda Qurban bayramıdır (EidMode öz qızılısını üstünə qoyur).
// • Başqa münasibət yoxdur (sahibin qərarı). Rəng yalnız bəzəkdir, mətn rənginə toxunmur.
// • Prerender HTML tarixi bilmir — atribut yalnız klientdə, render-dən əvvəl qoyulur.
// • Sınaq: ?hmonth=sacred | ramadan | dhul10
// ═══════════════════════════════════════════════════════
import { seasonOf } from './wow.js'

export const SACRED_MONTHS = [1, 7, 11, 12]
export const HMONTHS = ['sacred', 'ramadan', 'dhul10']

export const isSacredMonth = (h) => !!h && SACRED_MONTHS.includes(h.month)

export function hmonthOf(h) {
  if (!h) return ''
  if (h.month === 9) return 'ramadan'
  if (h.month === 12 && h.day >= 1 && h.day <= 10) return 'dhul10'
  return isSacredMonth(h) ? 'sacred' : ''
}

/** Nişan (Haram ay) göstərilsinmi: haram ay və ya Zülhiccənin on günü */
export const showsSacredBadge = (state) => state === 'sacred' || state === 'dhul10'

// PERFORMANS: bu fayl giriş paketindədir. utils/hijri.js-i statik idxal etmək bütün modulu
// (ay adları, çevirici …) girişə köçürürdü (+5 KB). Burada eyni mənbə — brauzerin Intl
// Ümmül-Qura təqvimi, UTC günorta (hijri.js → gregorianToHijri ilə eyni qayda; test:
// tests/unit/hijri-month.test.js iki il boyu gün-gün müqayisə edir). Intl Ümmül-Qura
// dəstəkləməyən köhnə brauzerdə bəzək sadəcə görünmür.
let fmt
/** Miladi { year, month, day } → hicri { month, day } | null (Intl Ümmül-Qura yoxdursa) */
export function hijriMonthDay(g) {
  if (fmt === undefined) {
    try {
      fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric' })
      if (!String(fmt.resolvedOptions().calendar || '').startsWith('islamic')) fmt = null
    } catch { fmt = null }
  }
  if (!fmt) return null
  const parts = fmt.formatToParts(Date.UTC(g.year, g.month - 1, g.day, 12))
  const num = (t) => Number(parts.find((p) => p.type === t)?.value)
  const h = { month: num('month'), day: num('day') }
  return h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 30 ? h : null
}

/** Miladi { year, month, day } → vəziyyət (testlər: sabit tarixlər) */
export const hmonthOfGregorian = (g) => hmonthOf(hijriMonthDay(g))

export function applyHijriMonth(root = document.documentElement, now = new Date()) {
  let forced = '', h = null
  try { forced = new URLSearchParams(window.location.search).get('hmonth') || '' } catch { /* */ }
  try { h = hijriMonthDay({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }) } catch { /* bəzəkdir */ }
  const state = HMONTHS.includes(forced) ? forced : hmonthOf(h)
  if (state) root.setAttribute('data-hmonth', state)
  else root.removeAttribute('data-hmonth')
  // ?season=… (wow.js) artıq qoyubsa — ona toxunmuruq
  const season = seasonOf(h)
  if (season && !root.hasAttribute('data-season')) root.setAttribute('data-season', season)
  return state
}
