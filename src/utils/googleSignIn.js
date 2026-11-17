// ═══════════════════════════════════════════════════════════
// Google ilə giriş — Google Identity Services (GIS), yalnız /login və /signup.
//
// • Skript (https://accounts.google.com/gsi/client) yalnız bu səhifələrdə, ilk
//   ehtiyacda yüklənir — başqa heç bir səhifədə Google-a sorğu getmir.
// • Rəsmi düymə (google.accounts.id.renderButton) iframe-dir; basılanda Google ID
//   tokeni (credential) verir, onu POST /api/auth/google-a göndəririk (server yoxlayır).
// • Client ID ictimaidir: VITE_GOOGLE_CLIENT_ID (.env.public). Boşdursa düymə yoxdur.
// • CSP: infra/nginx/security-headers.conf (scripts/check-csp.mjs yoxlayır).
// ═══════════════════════════════════════════════════════════

export const GIS_SRC = 'https://accounts.google.com/gsi/client'
export const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

let loading = null
let handler = null
let initializedFor = ''

const gis = () => globalThis.google?.accounts?.id || null

/** GIS skriptini bir dəfə yüklə (alınmasa növbəti çağırış yenidən sınayır). */
export function loadGis() {
  if (gis()) return Promise.resolve(gis())
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.onload = () => (gis() ? resolve(gis()) : reject(new Error('gis_unavailable')))
    s.onerror = () => { loading = null; s.remove(); reject(new Error('gis_unavailable')) }
    document.head.appendChild(s)
  })
  return loading
}

/**
 * Düyməni el-ə çək. onCredential(credential) — Google ID tokeni gələndə.
 * GIS-in initialize-ı bir dəfə çağırılır (təkrar çağırış xəbərdarlıq verir); cavab
 * isə hər dəfə cari səhifənin funksiyasına gedir.
 */
export async function renderGoogleButton(el, { onCredential, text = 'signin_with', dark = false, locale = 'en', width = 320 }) {
  if (!GOOGLE_CLIENT_ID) throw new Error('gis_disabled')
  const id = await loadGis()
  handler = onCredential
  if (initializedFor !== GOOGLE_CLIENT_ID) {
    id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => { if (resp && resp.credential && handler) handler(resp.credential) },
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    })
    initializedFor = GOOGLE_CLIENT_ID
  }
  if (!el || !el.isConnected) return
  el.textContent = ''
  id.renderButton(el, {
    type: 'standard',
    theme: dark ? 'filled_black' : 'outline',
    size: 'large',
    text,
    shape: 'pill',
    logo_alignment: 'center',
    width: Math.max(200, Math.min(400, Math.round(width))),
    locale,
  })
}

/** Səhifədən çıxanda: köhnə səhifənin funksiyası çağırılmasın. */
export function releaseGoogleButton(onCredential) {
  if (handler === onCredential) handler = null
}
