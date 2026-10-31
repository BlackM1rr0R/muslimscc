// ═══════════════════════════════════════════════════════
// E2E köməkçisi: admin sessiyası API-sinin saxta cavabları
//
// Admin girişi öz serverimizdədir (server/auth.js): POST /api/admin/login →
// HttpOnly cookie, GET /api/admin/me, POST /api/admin/logout,
// POST /api/admin/password. Testdə server yoxdur — bu marşrutlar page.route
// ilə saxtalaşdırılır, sessiya vəziyyəti isə burada (yaddaşda) saxlanılır.
// Real təhlükəsizlik (scrypt, cookie, CSRF, rate-limit) serverdədir və
// tests/unit/server-auth.test.js-də yoxlanır — bu testlər yalnız UI axınıdır.
// fixtures.js-dəki ümumi "/api/admin → 401" marşrutundan SONRA qeyd olunur.
// ═══════════════════════════════════════════════════════

export const ADMIN_EMAIL = 'admin@example.com'

/**
 * Saxta admin sessiyası. mode:
 *   'admin' — düzgün giriş, adi şifrə
 *   'temp'  — düzgün giriş, müvəqqəti şifrə (əvvəlcə "Şifrəni dəyiş" forması)
 *   'wrong' — yanlış şifrə (401)
 * Qaytarır: state ({ signedIn, mustChange, requests }) — testlər yoxlaya bilər.
 */
export async function fakeAdminSession(page, mode = 'admin') {
  const state = { signedIn: false, mustChange: mode === 'temp', requests: [] }
  const me = () => ({ email: ADMIN_EMAIL, via: 'session', mustChangePassword: state.mustChange })

  await page.route((u) => u.pathname.startsWith('/api/admin/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    state.requests.push(`${method} ${pathname}`)
    // CSRF qaydası (server/auth.js): vəziyyət dəyişən sorğuda X-Requested-With mütləqdir
    if (method !== 'GET' && !req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden' } })

    if (pathname === '/api/admin/login' && method === 'POST') {
      if (mode === 'wrong') return route.fulfill({ status: 401, json: { error: 'Invalid credentials' } })
      state.signedIn = true
      return route.fulfill({ json: { ok: true, email: ADMIN_EMAIL, mustChangePassword: state.mustChange } })
    }
    if (pathname === '/api/admin/logout') {
      state.signedIn = false
      return route.fulfill({ json: { ok: true } })
    }
    if (!state.signedIn) return route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    if (pathname === '/api/admin/me') return route.fulfill({ json: me() })
    if (pathname === '/api/admin/password' && method === 'POST') {
      const body = req.postDataJSON() || {}
      if (body.currentPassword !== 'test-password') return route.fulfill({ status: 400, json: { error: 'Wrong password', code: 'wrong' } })
      state.mustChange = false
      return route.fulfill({ json: { ok: true } })
    }
    if (state.mustChange) return route.fulfill({ status: 403, json: { error: 'Password change required', code: 'must_change' } })
    if (pathname === '/api/admin/subscribers') return route.fulfill({ json: { count: 0, fcm: 0, webpush: 0 } })
    if (pathname === '/api/admin/notification-history') return route.fulfill({ json: [] })
    // Məzmun yazıları — testdə heç nə yazılmır, sadəcə uğur
    if (pathname.startsWith('/api/admin/content/') || pathname.startsWith('/api/admin/singletons/')) {
      return route.fulfill({ status: method === 'POST' ? 201 : 200, json: { id: 'test-id', ...(req.postDataJSON() || {}) } })
    }
    return route.fulfill({ status: 404, json: { error: 'Not found' } })
  })
  return state
}

/** Giriş formunu doldurub göndər (giriş səhifəsində olmalısan). */
export async function adminSignIn(page, { email = ADMIN_EMAIL, password = 'test-password' } = {}) {
  await page.getByLabel('E-poçt').fill(email)
  await page.getByLabel('Şifrə', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Daxil ol' }).click()
}
