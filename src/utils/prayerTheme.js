// ═══════════════════════════════════════════════════════
// "Namaz vaxtına görə" tema — idarəçi (TƏNBƏL chunk: a11yPrefs.js yalnız rejim
// açıq olanda import edir)
//
//   • bugünkü sübh və məğrib istifadəçinin seçdiyi şəhər üçün yerli hesablanır
//     (prayCalc → computeTimes, şəbəkəsiz; namaz səhifəsi ilə eyni metod:
//     Azərbaycan — Əbu Bəkr məscidi, qalanı — Diyanət);
//   • nəticə keşə yazılır (prayerThemeCore → 'muslim_cc_ptheme') — növbəti
//     açılışda index.html skripti ilk kadrı düzgün boyayır;
//   • növbəti keçidə BİR setTimeout qurulur (sorğu dövrü yoxdur); vərəq yenidən
//     görünəndə və şəhər dəyişəndə yenidən hesablanır;
//   • açıq səhifədə keçid yumşaq solma ilə olur (View Transitions, yoxdursa
//     qısa CSS keçidi — vau3.css §15b); hərəkət azaldılıbsa — ani.
// Şəhər seçilməyibsə — sistemin rejimi (keşdə { s: 1 }).
// ═══════════════════════════════════════════════════════
import { getPrayerCityId, getPrayerLocation, subscribePrayerLocation } from './prayerLocation'
import { computeTimes, tzOffsetHours, CALC_METHODS, METHOD_ABUBAKR } from './prayCalc'
import { decidePrayerTheme, writePrayerThemeCache, THEME_SYNC_EVENT } from './prayerThemeCore'

const HOUR = 3600000

const toMin = (s) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(s || '')
  return m ? (+m[1]) * 60 + (+m[2]) : NaN
}

/**
 * Yerin bugünkü (şəhərin təqvim günü) sübh/məğribi və sabahkı sübh — ms damğaları.
 * Intl yalnız 2 dəfə çağırılır (saat qurşağının fərqi: bu gün və sabah).
 */
export function prayerTimesFor(loc, now = Date.now()) {
  if (!loc || !Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng))) return null
  const abubakr = Number(loc.method) === METHOD_ABUBAKR
  const method = abubakr ? CALC_METHODS.abubakr : CALC_METHODS.diyanet
  const tz = loc.tz || (abubakr ? 'Asia/Baku' : 'UTC')
  const u = new Date(now)
  let off = tzOffsetHours(tz, u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate())
  const local = new Date(now + off * HOUR)
  const day = { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate() }
  // UTC günü ilə yerli gün fərqlidirsə — fərqi yerli günə görə dəqiqləşdir
  off = tzOffsetHours(tz, day.year, day.month, day.day)
  const at = (d, o, hhmm) => {
    const mm = toMin(hhmm)
    return Number.isNaN(mm) ? NaN : Date.UTC(d.year, d.month - 1, d.day, 0, mm) - o * HOUR
  }
  const t = computeTimes(day, Number(loc.lat), Number(loc.lng), off, method)
  const tmD = new Date(Date.UTC(day.year, day.month - 1, day.day + 1))
  const tm = { year: tmD.getUTCFullYear(), month: tmD.getUTCMonth() + 1, day: tmD.getUTCDate() }
  const offT = tzOffsetHours(tz, tm.year, tm.month, tm.day)
  const t2 = computeTimes(tm, Number(loc.lat), Number(loc.lng), offT, method)
  return { fajr: at(day, off, t.fajr), maghrib: at(day, off, t.maghrib), nextFajr: at(tm, offT, t2.fajr) }
}

function systemDark() {
  try { return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches) } catch { return false }
}

function reducedMotion(root) {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      root.classList.contains('a11y-reduce-motion') || root.classList.contains('a11y-motion-user')
  } catch { return true }
}

/** Saytın temasını tətbiq et (animate — açıq səhifədə yumşaq solma). */
export function applySiteDark(dark, animate) {
  const root = document.documentElement
  const set = () => {
    if (dark) root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a1016' : '#f7f5ef')
    try { window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail: { dark } })) } catch { /* köhnə brauzer */ }
  }
  const changed = (root.getAttribute('data-theme') === 'dark') !== dark
  if (!changed || !animate || document.visibilityState !== 'visible' || reducedMotion(root)) { set(); return }
  if (typeof document.startViewTransition === 'function') {
    root.classList.add('qm-theme-fade')
    try {
      const vt = document.startViewTransition(set)
      vt.finished.catch(() => {}).finally(() => root.classList.remove('qm-theme-fade'))
      vt.ready?.catch?.(() => {})
    } catch { root.classList.remove('qm-theme-fade'); set() }
    return
  }
  root.classList.add('qm-theme-soft')
  set()
  setTimeout(() => root.classList.remove('qm-theme-soft'), 800)
}

let timer = 0
let started = false
let last = null          // son hesablanmış tema — eyni qalıbsa yenidən tətbiq olunmur
let unsubLoc = null

function onVisible() {
  if (document.visibilityState === 'visible') tick(true)
}

function tick(animate) {
  clearTimeout(timer); timer = 0
  const now = Date.now()
  let dark, next = null
  const times = getPrayerCityId() ? prayerTimesFor(getPrayerLocation(), now) : null
  const r = decidePrayerTheme(now, times || {})
  if (r.theme) {
    writePrayerThemeCache({ f: times.fajr, m: times.maghrib })
    dark = r.theme === 'dark'
    next = r.next
  } else {
    writePrayerThemeCache({ s: 1 })
    dark = systemDark()
  }
  // Başlıqdakı ay/günəş düyməsi ilə müvəqqəti seçim növbəti keçidə qədər qalsın:
  // tema yalnız hesab dəyişəndə (və ilk dəfə) tətbiq olunur
  if (dark !== last) { last = dark; applySiteDark(dark, animate) }
  if (next) timer = setTimeout(() => tick(true), Math.min(Math.max(next - now, 0) + 1000, 2147483000))
}

/** Rejimi başlat (təkrar çağırış zərərsizdir). */
export function startPrayerTheme() {
  if (typeof window === 'undefined' || started) return
  started = true
  last = null
  tick(false)
  document.addEventListener('visibilitychange', onVisible)
  try { unsubLoc = subscribePrayerLocation(() => tick(true)) } catch { unsubLoc = null }
}

/** Rejimi dayandır: taymer, dinləyicilər və keş silinir. */
export function stopPrayerTheme() {
  clearTimeout(timer); timer = 0
  if (started) {
    document.removeEventListener('visibilitychange', onVisible)
    try { unsubLoc?.() } catch { /* */ }
  }
  unsubLoc = null
  started = false
  last = null
  writePrayerThemeCache(null)
}
