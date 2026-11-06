// ═══════════════════════════════════════════════════════════
// Kukisiz sayt statistikası — klient tərəfi (server/analytics.js)
//
// Hər SPA marşrut dəyişikliyində POST /api/a-ya kiçik mayak: { p, r, l }.
//   p — yol (sorğu sətri və hash olmadan), r — xarici referrer (yalnız
//   səhifə ilk açılanda; server ondan yalnız domeni götürür), l — dil.
// Kuki, localStorage, ID, barmaq izi YOXDUR. Göndərilmir:
//   DNT / Global Privacy Control açıqdırsa, /admin*, localhost, avtomat brauzer.
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
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local')
}

const isAdminPath = (p) => /^\/(?:(?:az|en|ru|ar|tr)\/)?admin/.test(p)

/** Bir baxış göndər. pathname — location.pathname. */
export function trackPageview(pathname) {
  if (disabled() || typeof pathname !== 'string' || isAdminPath(pathname)) return
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
