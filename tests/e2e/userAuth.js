// ═══════════════════════════════════════════════════════
// E2E köməkçisi: saytın İSTİFADƏÇİ hesabı API-sinin (server/users.js) saxta cavabları.
// Testdə server yoxdur — /api/auth/* page.route ilə saxtalaşdırılır, sessiya burada
// (yaddaşda) saxlanır. Real təhlükəsizlik (scrypt, cookie, CSRF, limitlər) serverdədir və
// tests/unit/server-users.test.js-də yoxlanır — bu testlər yalnız UI axınıdır.
// fixtures.js-dəki ümumi "/api/auth → 401" marşrutundan SONRA qeyd olunur (birinci işləyir).
// ═══════════════════════════════════════════════════════

export const USER_EMAIL = 'user@example.com'
export const USER_PASSWORD = 'correct-horse-42'
export const RESET_TOKEN = 'R'.repeat(43)
export const VERIFY_TOKEN = 'V'.repeat(43)

/**
 * opts:
 *   signedIn  — sessiya artıq var (cookie-ni təqlid edir)
 *   user      — istifadəçi sahələrinin üstünə yazılanlar (role, hasPassword, …)
 *   google    — 'ok' | 'conflict' (409 link_requires_verification)
 *   syncKeys  — hesaba bağlı sinxronizasiyanın qabları ([{ kind, credId, salt, wrapped }], server/syncKeys.js)
 *   syncId    — hesaba bağlı blokun id-si (64 hex) və ya null
 * Qaytarır: state ({ signedIn, user, sessions, requests, bodies, syncKeys, syncId }).
 */
export async function fakeUserSession(page, opts = {}) {
  const state = {
    signedIn: Boolean(opts.signedIn),
    user: {
      id: 12, email: USER_EMAIL, emailVerified: false, displayName: 'Əli', role: 'user', mosqueId: null,
      hasPassword: true, providers: [],
      passkeys: [{ id: 'pk1', name: 'Chrome · Android', createdAt: Date.UTC(2026, 9, 1), lastUsedAt: null }],
      ...(opts.user || {}),
    },
    sessions: [
      { id: 'cur0000000000000', label: 'Chrome · Windows', createdAt: Date.UTC(2026, 10, 1), lastSeenAt: Date.UTC(2026, 10, 17), current: true },
      { id: 'oth0000000000000', label: 'Safari · iOS', createdAt: Date.UTC(2026, 9, 20), lastSeenAt: Date.UTC(2026, 10, 2), current: false },
    ],
    requests: [],
    bodies: {},
    csrfMissing: [],
    syncKeys: (opts.syncKeys || []).map((k) => ({ credId: '', createdAt: 1, ...k })),
    syncId: opts.syncId || null,
  }
  const unauth = (route) => route.fulfill({ status: 401, json: { error: 'Unauthorized', code: 'unauthenticated' } })

  await page.route((u) => u.pathname.startsWith('/api/auth/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const key = `${method} ${pathname}`
    state.requests.push(key)
    let body = {}
    try { body = req.postDataJSON() || {} } catch { /* gövdəsiz */ }
    state.bodies[key] = body
    // CSRF qaydası (server/users.js): vəziyyət dəyişən sorğuda X-Requested-With mütləqdir
    if (method !== 'GET' && !req.headers()['x-requested-with']) {
      state.csrfMissing.push(key)
      return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    }
    const me = () => state.user

    switch (pathname) {
      case '/api/auth/me':
        return state.signedIn ? route.fulfill({ json: me() }) : unauth(route)
      case '/api/auth/login':
        if (body.email === USER_EMAIL && body.password === USER_PASSWORD) { state.signedIn = true; return route.fulfill({ json: { ok: true, user: me() } }) }
        return route.fulfill({ status: 401, json: { error: 'Invalid credentials', code: 'invalid_credentials' } })
      case '/api/auth/register':
        if (body.email === USER_EMAIL) return route.fulfill({ status: 202, json: { ok: true, checkEmail: true } })
        state.signedIn = true
        state.user = { ...state.user, id: 99, email: body.email, displayName: body.displayName || '', emailVerified: false, passkeys: [] }
        return route.fulfill({ status: 201, json: { ok: true, user: me(), verificationSent: true } })
      case '/api/auth/logout':
        state.signedIn = false
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/forgot':
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/reset':
        if (body.token !== RESET_TOKEN) return route.fulfill({ status: 400, json: { error: 'Invalid or expired link', code: 'invalid_token' } })
        state.signedIn = false
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/verify':
        if (body.token !== VERIFY_TOKEN) return route.fulfill({ status: 400, json: { error: 'Invalid or expired link', code: 'invalid_token' } })
        state.user = { ...state.user, emailVerified: true }
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/google':
        if (opts.google === 'conflict') return route.fulfill({ status: 409, json: { error: 'Verify first', code: 'link_requires_verification' } })
        state.signedIn = true
        state.user = { ...state.user, providers: ['google'] }
        return route.fulfill({ json: { ok: true, created: false, user: me() } })
      case '/api/auth/passkey/login/options':
        return route.fulfill({ json: { challengeId: 'c'.repeat(24), options: { challenge: 'dGVzdC1jaGFsbGVuZ2UtMDAwMDAwMDA', rpId: 'invalid.test', timeout: 300000, userVerification: 'required', allowCredentials: [] } } })
      default:
        break
    }
    if (!state.signedIn) return unauth(route)
    switch (pathname) {
      case '/api/auth/sessions':
        return route.fulfill({ json: { sessions: state.sessions } })
      case '/api/auth/sessions/revoke': {
        const n = body.all ? state.sessions.filter(s => !s.current).length : 1
        state.sessions = body.all ? state.sessions.filter(s => s.current) : state.sessions.filter(s => s.id !== body.id)
        return route.fulfill({ json: { ok: true, revoked: n } })
      }
      case '/api/auth/profile':
        state.user = { ...state.user, displayName: body.displayName }
        return route.fulfill({ json: me() })
      case '/api/auth/password':
        if (state.user.hasPassword && body.current !== USER_PASSWORD) return route.fulfill({ status: 400, json: { error: 'Wrong password', code: 'wrong_password' } })
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/verify/resend':
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/passkey/remove':
        state.user = { ...state.user, passkeys: state.user.passkeys.filter(k => k.id !== body.id) }
        return route.fulfill({ json: { ok: true, passkeys: state.user.passkeys } })
      case '/api/auth/delete':
        if (state.user.hasPassword && body.password !== USER_PASSWORD) return route.fulfill({ status: 400, json: { error: 'Wrong password', code: 'wrong_password' } })
        state.signedIn = false
        return route.fulfill({ json: { ok: true } })
      // ── Hesaba bağlı sinxronizasiya (server/syncKeys.js) ──
      case '/api/auth/sync-keys':
        if (method === 'GET') return route.fulfill({ json: { keys: state.syncKeys, syncId: state.syncId } })
        state.syncKeys = [...state.syncKeys.filter(k => !(k.kind === body.kind && k.credId === (body.credId || ''))),
          { kind: body.kind, credId: body.credId || '', salt: body.salt, wrapped: body.wrapped, createdAt: Date.now() }]
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/sync-keys/check-password':
        return body.password === USER_PASSWORD ? route.fulfill({ json: { ok: true } }) : route.fulfill({ status: 400, json: { error: 'Wrong password', code: 'wrong_password' } })
      case '/api/auth/sync-link':
        if (method === 'GET') return route.fulfill({ json: { syncId: state.syncId, linkedAt: state.syncId ? 1 : null } })
        state.syncId = method === 'DELETE' ? null : body.syncId
        return route.fulfill({ json: { ok: true } })
      default:
        if (method === 'DELETE' && pathname.startsWith('/api/auth/sync-keys/')) {
          const [kind, credId = ''] = pathname.split('/').slice(4)
          state.syncKeys = state.syncKeys.filter(k => !(k.kind === kind && k.credId === decodeURIComponent(credId)))
          return route.fulfill({ json: { ok: true } })
        }
        return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
    }
  })
  return state
}

/** "Daxil olub" ipucu (localStorage) — başlıq /me-ni yalnız bu halda çağırır. */
export async function setLoginHint(page) {
  await page.addInitScript(() => { try { localStorage.setItem('mcc_logged_in', '1') } catch { /* */ } })
}
