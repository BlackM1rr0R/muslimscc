// ═══════════════════════════════════════════════════════
// E2E köməkçisi: admin paneli sessiyası API-sinin saxta cavabları
//
// 2026-11-24-dən panel YALNIZ saytın hesabı ilə açılır (server/adminSso.js) və /account/panel ünvanındadır
// (ADMIN_PANEL). /admin, /adminlogin — 404. Ayrıca admin girişi (POST /api/admin/login, 2FA bileti) yalnız
// break-glass rejimindədir (serverdə ADMIN_LEGACY_LOGIN=1): onda GET /api/admin/me-nin 401 cavabında
// legacyLogin:true olur və panel öz ünvanında ayrıca giriş formasını göstərir.
// Testdə server yoxdur — /api/admin/* page.route ilə saxtalaşdırılır, sessiya vəziyyəti burada (yaddaşda).
// Real təhlükəsizlik (scrypt, cookie, CSRF, rate-limit, SSO şərtləri) serverdədir və
// tests/unit/server-auth.test.js, server-admin-sso.test.js-də yoxlanır — bu testlər yalnız UI axınıdır.
// fixtures.js-dəki ümumi "/api/admin → 401" marşrutundan SONRA qeyd olunur.
// ═══════════════════════════════════════════════════════

/** Panelin ünvanı (src/seo/routes.js → DEFAULT_ADMIN_PATH; e2e build-i VITE_ADMIN_PATH-sizdir) */
export const ADMIN_PANEL = '/account/panel'

export const ADMIN_EMAIL = 'admin@example.com'

export const SITE_ADMIN_EMAIL = 'owner@example.com'
// Sayt hesabı ilə panel (server/adminSso.js) — 403 kodları
const SITE_GATE = { need2fa: 'need_2fa', needReauth: 'need_reauth', hold: 'security_hold' }
const LEGACY = new Set(['admin', 'temp', 'wrong'])

/**
 * Saxta admin sessiyası. mode:
 *   'site'  — saytın hesabı ilə (SSO): /me → via:'site', rol opts.role (susmaya görə superadmin), e-poçt opts.email.
 *             opts.user (fakeUserSession-un state-i) verilibsə panel sessiyası sayt girişini izləyir
 *             (user.signedIn false → /me 401; daxil olandan sonra açılır)
 *   'need2fa' | 'needReauth' | 'hold' — sayt hesabının panel rolu var, amma hər admin API-si 403 (kod ilə)
 *   BREAK-GLASS (ADMIN_LEGACY_LOGIN=1; 401 cavabında legacyLogin:true — panel ayrıca giriş formasını göstərir):
 *   'admin' — düzgün giriş, adi şifrə · 'temp' — müvəqqəti şifrə ("Şifrəni dəyiş" forması) · 'wrong' — yanlış şifrə (401)
 * Qaytarır: state ({ signedIn, mustChange, requests }) — testlər yoxlaya bilər.
 */
export async function fakeAdminSession(page, mode = 'site', opts = {}) {
  const site = mode === 'site'
  const legacy = LEGACY.has(mode)
  const state = { signedIn: site, mustChange: mode === 'temp', requests: [] }
  const signedIn = () => (site && opts.user ? Boolean(opts.user.signedIn) : state.signedIn)
  const me = () => (site
    ? { email: opts.email || SITE_ADMIN_EMAIL, via: 'site', mustChangePassword: false, role: opts.role || 'superadmin', twoFactor: true }
    : { email: ADMIN_EMAIL, via: 'session', mustChangePassword: state.mustChange })

  await page.route((u) => u.pathname.startsWith('/api/admin/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    state.requests.push(`${method} ${pathname}`)
    // CSRF qaydası (server/auth.js): vəziyyət dəyişən sorğuda X-Requested-With mütləqdir
    if (method !== 'GET' && !req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden' } })
    if (SITE_GATE[mode] && pathname !== '/api/admin/login' && pathname !== '/api/admin/logout') {
      return route.fulfill({ status: 403, json: { error: 'Forbidden', code: SITE_GATE[mode] } })
    }
    // Ayrıca admin girişi yalnız break-glass rejimində (server/auth.js → legacyGate)
    if (!legacy && (pathname === '/api/admin/login' || pathname === '/api/admin/2fa') && method === 'POST') {
      return route.fulfill({ status: 403, json: { error: 'Admin sign-in is only available through the site account', code: 'legacy_login_disabled' } })
    }
    if (site && (pathname === '/api/admin/password' || pathname.startsWith('/api/admin/2fa'))) {
      return route.fulfill({ status: 403, json: { error: 'Managed in the site account', code: 'site_account' } })
    }

    if (pathname === '/api/admin/login' && method === 'POST') {
      if (mode === 'wrong') return route.fulfill({ status: 401, json: { error: 'Invalid credentials' } })
      state.signedIn = true
      return route.fulfill({ json: { ok: true, email: ADMIN_EMAIL, mustChangePassword: state.mustChange } })
    }
    if (pathname === '/api/admin/logout') {
      state.signedIn = false
      return route.fulfill({ json: { ok: true } })
    }
    if (!signedIn()) return route.fulfill({ status: 401, json: legacy ? { error: 'Unauthorized', legacyLogin: true } : { error: 'Unauthorized' } })
    if (pathname === '/api/admin/me') return route.fulfill({ json: me() })
    if (pathname === '/api/admin/password' && method === 'POST') {
      const body = req.postDataJSON() || {}
      if (body.currentPassword !== 'test-password') return route.fulfill({ status: 400, json: { error: 'Wrong password', code: 'wrong' } })
      state.mustChange = false
      return route.fulfill({ json: { ok: true } })
    }
    if (state.mustChange) return route.fulfill({ status: 403, json: { error: 'Password change required', code: 'must_change' } })
    if (pathname === '/api/admin/subscribers') return route.fulfill({ json: { count: 0, webpush: 0 } })
    if (pathname === '/api/admin/notification-history') return route.fulfill({ json: [] })
    // Məzmun yazıları — testdə heç nə yazılmır, sadəcə uğur
    if (pathname.startsWith('/api/admin/content/') || pathname.startsWith('/api/admin/singletons/')) {
      return route.fulfill({ status: method === 'POST' ? 201 : 200, json: { id: 'test-id', ...(req.postDataJSON() || {}) } })
    }
    return route.fulfill({ status: 404, json: { error: 'Not found' } })
  })
  return state
}

/** Paneli aç (sayt hesabı ilə — fakeAdminSession(page, 'site') qeydə alınandan sonra) və yüklənməsini gözlə. */
export async function openAdminPanel(page, path = ADMIN_PANEL) {
  await page.goto(path)
  await page.locator('.admin-nav-btn').first().waitFor({ state: 'attached' })
}

/** BREAK-GLASS: panelin ünvanındakı ayrıca giriş formasını doldurub göndər. */
export async function adminSignIn(page, { email = ADMIN_EMAIL, password = 'test-password' } = {}) {
  await page.getByLabel('E-poçt').fill(email)
  await page.getByLabel('Şifrə', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Daxil ol' }).click()
}
