// ═══════════════════════════════════════════════════════════
// Kukisiz sayt statistikası — klient tərəfi (server/analytics.js)
//
// Hər SPA marşrut dəyişikliyində POST /api/a-ya kiçik mayak: { p, r, l }.
//   p — yol (sorğu sətri və hash olmadan), r — xarici referrer (yalnız
//   səhifə ilk açılanda; server ondan yalnız domeni götürür), l — dil.
// Kuki, localStorage, ID, barmaq izi YOXDUR. Göndərilmir:
//   DNT / Global Privacy Control açıqdırsa, /admin*, localhost, avtomat brauzer,
//   səhifə iframe içindədirsə (başqa sayt və ya /widget önizləməsi).
// İnsan yoxlaması (botlar real JS işlədir): ilk baxış yalnız ilk real hərəkətdən
//   (toxunma/klik/düymə/təkər/sürüşdürmə) və ya səhifə cəmi VISIBLE_MS görünəndən
//   sonra göndərilir; ondan sonrakı SPA keçidləri dərhal sayılır. Heç nə saxlanmır.
// ═══════════════════════════════════════════════════════════
import { useEffect } from 'react'
import { ALL_LANGS } from '../seo/routes'

const ENDPOINT = '/api/a'
// URL-in dil prefiksləri — 5 əsas dil + Quranın əlavə dilləri (src/seo/langs.js)
const LANGS = ALL_LANGS
const DELAY_MS = 300   // yönləndirmələr (Navigate replace) ara ünvanı saymasın

let firstSent = false

function disabled() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true
  const n = navigator
  if (n.doNotTrack === '1' || window.doNotTrack === '1' || n.msDoNotTrack === '1') return true
  if (n.globalPrivacyControl === true) return true
  if (n.webdriver) return true
  // Başqa saytda iframe içindəyik (məscid ekranı vidceti, WordPress plagini) — sayılmır:
  // plagin readme-si "yerləşdirildikdə statistika göndərilmir" deyir (wordpress/muslimscc-prayer-times)
  try { if (window.top !== window.self) return true } catch { return true }
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local')
}

const isAdminPath = (p) => /^\/(?:(?:az|en|ru|ar|tr)\/)?(?:admin|account\/panel)/.test(p)

// ── İnsan hərəkəti gözlənilir ──
const VISIBLE_MS = 12000   // görünən vaxt (cəmi) — hərəkətsiz oxuyan insan da sayılsın
const SCROLL_GRACE_MS = 1000   // açılışdakı proqram sürüşdürməsi "hərəkət" sayılmasın
const ENGAGE_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll']
let engaged = false
let armedAt = 0
let pending = null   // hərəkətdən əvvəlki son yol
let visibleMs = 0
let visibleSince = 0
let visTimer = 0

function onEngageEvent(e) {
  if (e.isTrusted === false) return
  if (e.type === 'scroll' && Date.now() - armedAt < SCROLL_GRACE_MS) return
  engage()
}

function onVisibility() {
  clearTimeout(visTimer)
  const t = Date.now()
  if (document.visibilityState === 'visible') {
    if (!visibleSince) visibleSince = t
    visTimer = setTimeout(engage, Math.max(0, VISIBLE_MS - visibleMs))
  } else if (visibleSince) {
    visibleMs += t - visibleSince
    visibleSince = 0
  }
}

function arm() {
  if (armedAt) return
  armedAt = Date.now()
  for (const ev of ENGAGE_EVENTS) window.addEventListener(ev, onEngageEvent, { capture: true, passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  onVisibility()
}

function engage() {
  if (engaged) return
  engaged = true
  clearTimeout(visTimer)
  for (const ev of ENGAGE_EVENTS) window.removeEventListener(ev, onEngageEvent, { capture: true })
  document.removeEventListener('visibilitychange', onVisibility)
  if (pending !== null) { const p = pending; pending = null; send(p) }
}

/** Bir baxış göndər (insan hərəkətindən sonra; o vaxta qədər son yol gözləyir). pathname — location.pathname. */
export function trackPageview(pathname) {
  if (disabled() || typeof pathname !== 'string' || isAdminPath(pathname)) return
  if (engaged) { send(pathname); return }
  pending = pathname
  arm()
}

function send(pathname) {
  const seg = pathname.split('/')[1]
  let r = ''
  if (!firstSent) {
    firstSent = true
    try {
      const ref = document.referrer
      if (ref && new URL(ref).host !== window.location.host) r = ref
    } catch { /* yararsız referrer */ }
  }
  const body = JSON.stringify({ p: pathname, r, l: LANGS.includes(seg) ? seg : 'az' })
  try {
    // Sətir → text/plain: CORS preflight yoxdur, səhifə bağlananda da çatır
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return
  } catch { /* fetch ilə yoxla */ }
  try {
    fetch(ENDPOINT, {
      method: 'POST', body, keepalive: true, credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    }).catch(() => {})
  } catch { /* səssiz */ }
}

/**
 * App.jsx-dən çağırılır: hər yeni pathname üçün bir baxış.
 * skip — admin / giriş səhifəsi (#admin hash-i ilə açılan da) üçün true.
 * notFound — 404: real yol əvəzinə '/404' göndərilir (zibil ünvanlar toplanmasın).
 */
export function usePageviews(pathname, { skip = false, notFound = false } = {}) {
  useEffect(() => {
    if (skip) return undefined
    const seg = String(pathname || '').split('/')[1]
    const p = notFound ? (LANGS.includes(seg) ? `/${seg}/404` : '/404') : pathname
    const t = setTimeout(() => trackPageview(p), DELAY_MS)
    return () => clearTimeout(t)
  }, [pathname, skip, notFound])
}
