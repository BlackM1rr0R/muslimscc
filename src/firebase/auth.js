// ═══════════════════════════════════════════════════════════
// ADMIN GİRİŞİ — Firebase Authentication (Email/Parol)
//
// • Auth SDK yalnız admin səhifələrində DİNAMİK yüklənir (import('firebase/auth')):
//   ictimai səhifələrə auth iframe-i / identitytoolkit sorğusu düşmür (bax
//   config.js-dəki performans qeydi).
// • Admin = daxil olmuş istifadəçi + ID tokenində custom claim `admin: true`.
//   Claim server tərəfdə verilir: server/scripts/set-admin.js (docs/ADMIN-SECURITY.md).
// • Firestore SDK eyni `app`-ə bağlı Auth-u özü tapır — admin yazıları
//   avtomatik istifadəçinin ID tokeni ilə gedir, qaydalar (firestore.rules)
//   `request.auth.token.admin == true` yoxlayır.
// • Köhnə mexanizm (koddakı parol + sessionStorage bayrağı) tam silinib.
// ═══════════════════════════════════════════════════════════
import app, { isFirebaseConfigured } from './config'

let authPromise = null

// getAuth() yox, initializeAuth(): popup/redirect həlledicisi qoşulmur —
// apis.google.com və auth iframe-i heç yüklənmir (e-poçt/parol girişinə lazım deyil).
function createAuth(mod) {
  try {
    return mod.initializeAuth(app, {
      persistence: [mod.indexedDBLocalPersistence, mod.browserLocalPersistence],
    })
  } catch {
    return mod.getAuth(app)   // artıq yaradılıbsa (məs. HMR)
  }
}

/** Auth modulu + instansiyası (bir dəfə yüklənir). Firebase qoşulmayıbsa null. */
function loadAuth() {
  if (!isFirebaseConfigured()) return Promise.resolve(null)
  if (!authPromise) {
    authPromise = import('firebase/auth').then((mod) => ({ mod, auth: createAuth(mod) }))
    // Yükləmə alınmasa növbəti cəhddə yenidən sınansın
    authPromise.catch(() => { authPromise = null })
  }
  return authPromise
}

/** İstifadəçinin admin claim-i varmı? force — tokeni serverdən təzələ
 *  (set-admin.js-dən sonra köhnə tokendə claim hələ olmur). */
async function hasAdminClaim(user, force = false) {
  if (!user) return false
  try {
    const res = await user.getIdTokenResult(force)
    return res.claims.admin === true
  } catch {
    return false
  }
}

/**
 * Admin vəziyyətini izlə: cb({ status, email })
 *   status: 'loading' | 'admin' | 'notAdmin' | 'signedOut' | 'unavailable'
 * Qaytarır: abunəliyi dayandıran funksiya.
 */
export function watchAdmin(cb) {
  let stopped = false
  let unsub = () => {}
  cb({ status: 'loading', email: '' })
  loadAuth().then((ctx) => {
    if (stopped) return
    if (!ctx) { cb({ status: 'unavailable', email: '' }); return }
    unsub = ctx.mod.onAuthStateChanged(ctx.auth, async (user) => {
      if (!user) { if (!stopped) cb({ status: 'signedOut', email: '' }); return }
      const ok = await hasAdminClaim(user, true)
      if (!stopped) cb({ status: ok ? 'admin' : 'notAdmin', email: user.email || '' })
    })
  }).catch(() => { if (!stopped) cb({ status: 'unavailable', email: '' }) })
  return () => { stopped = true; unsub() }
}

/**
 * E-poçt + parolla giriş. Uğurlu olsa { ok:true, admin:boolean },
 * alınmasa { ok:false, code } (Firebase xəta kodu — mətni UI seçir).
 */
export async function signInAdmin(email, password) {
  const ctx = await loadAuth().catch(() => null)
  if (!ctx) return { ok: false, code: 'unavailable' }
  try {
    const cred = await ctx.mod.signInWithEmailAndPassword(ctx.auth, email.trim(), password)
    const admin = await hasAdminClaim(cred.user, true)
    return { ok: true, admin }
  } catch (e) {
    return { ok: false, code: e?.code || 'unknown' }
  }
}

/** Parolu sıfırlama linki (e-poçta). Hesabın olub-olmadığını UI açıqlamır. */
export async function sendAdminPasswordReset(email) {
  const ctx = await loadAuth().catch(() => null)
  if (!ctx) return { ok: false, code: 'unavailable' }
  try {
    await ctx.mod.sendPasswordResetEmail(ctx.auth, email.trim())
    return { ok: true }
  } catch (e) {
    return { ok: false, code: e?.code || 'unknown' }
  }
}

export async function signOutAdmin() {
  const ctx = await loadAuth().catch(() => null)
  if (ctx) await ctx.mod.signOut(ctx.auth).catch(() => {})
}

/** Server API-ləri üçün ID token (Authorization: Bearer ...). Yoxdursa ''. */
export async function getAdminIdToken() {
  const ctx = await loadAuth().catch(() => null)
  const user = ctx?.auth.currentUser
  if (!user) return ''
  try { return await user.getIdToken() } catch { return '' }
}
