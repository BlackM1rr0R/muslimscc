// ═══════════════════════════════════════════════════════
// E2E köməkçisi: hesab təhlükəsizliyi API-sinin (server/security.js) saxta cavabları —
// 2FA qurulumu/girişi, təhlükəsizlik fəaliyyəti, məlumat xülasəsi/ixracı, admin 2FA.
// fakeUserSession (userAuth.js) / fakeAdminSession (adminAuth.js) qeydə alınandan SONRA çağırılır
// (Playwright-da sonra qeyd olunan marşrut birinci işləyir). Real TOTP / limitlər serverdədir və
// tests/unit/server-security.test.js-də yoxlanır — burada yalnız UI axını.
// ═══════════════════════════════════════════════════════
import { USER_EMAIL, USER_PASSWORD } from './userAuth.js'

export const TOTP_CODE = '123456'
export const TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'
export const BACKUP = Array.from({ length: 10 }, (_, i) => `abcd${i}-ef${i}gh`)
const TICKET = 'T'.repeat(43)

/**
 * userState — fakeUserSession-in qaytardığı vəziyyət (user, signedIn).
 * opts.twoFactor — 2FA artıq açıqdır; opts.hold — hesab qorunma rejimində
 */
export async function fakeSecurityApi(page, userState, opts = {}) {
  const state = { requests: [], bodies: {}, enabled: Boolean(opts.twoFactor), hold: opts.hold ? Date.UTC(2026, 10, 17) : null }
  userState.user = { ...userState.user, twoFactor: { enabled: state.enabled, backupCodesLeft: state.enabled ? 10 : 0 }, securityHold: Boolean(state.hold) }
  const sync = () => { userState.user = { ...userState.user, twoFactor: { enabled: state.enabled, backupCodesLeft: state.enabled ? 10 : 0 }, securityHold: Boolean(state.hold) } }
  const events = [
    { id: 3, kind: 'sign_in_new', method: 'password+2fa', label: 'Safari · iOS', country: 'TR', at: Date.UTC(2026, 10, 17, 9, 30) },
    { id: 2, kind: 'password_changed', method: null, label: 'Chrome · Windows', country: 'AZ', at: Date.UTC(2026, 10, 10, 8, 0) },
    { id: 1, kind: 'sign_in', method: 'passkey', label: 'Chrome · Windows', country: null, at: Date.UTC(2026, 10, 1, 12, 0) },
  ]
  const PATHS = /^\/api\/auth\/(login|2fa(\/.*)?|security\/.*|data-summary|export)$/
  await page.route((u) => PATHS.test(u.pathname), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const key = `${method} ${pathname}`
    state.requests.push(key)
    let body = {}
    try { body = req.postDataJSON() || {} } catch { /* */ }
    state.bodies[key] = body
    if (method !== 'GET' && !req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })

    if (pathname === '/api/auth/login') {
      if (body.email !== USER_EMAIL || body.password !== USER_PASSWORD) return route.fulfill({ status: 401, json: { error: 'Invalid credentials', code: 'invalid_credentials' } })
      if (state.enabled) return route.fulfill({ json: { ok: true, twoFactor: true, ticket: TICKET } })
      userState.signedIn = true
      return route.fulfill({ json: { ok: true, user: userState.user } })
    }
    if (pathname === '/api/auth/2fa' && method === 'POST') {
      if (body.ticket !== TICKET) return route.fulfill({ status: 401, json: { error: 'x', code: 'invalid_ticket' } })
      if (body.code !== TOTP_CODE && !BACKUP.includes(body.backupCode)) return route.fulfill({ status: 401, json: { error: 'x', code: 'invalid_code', attemptsLeft: 4 } })
      userState.signedIn = true
      return route.fulfill({ json: { ok: true, user: userState.user } })
    }
    if (!userState.signedIn) return route.fulfill({ status: 401, json: { error: 'Unauthorized', code: 'unauthenticated' } })
    switch (pathname) {
      case '/api/auth/2fa':
        return route.fulfill({ json: { enabled: state.enabled, enabledAt: null, backupCodesLeft: state.enabled ? 10 : 0 } })
      case '/api/auth/2fa/setup':
        if (userState.user.hasPassword && body.password !== USER_PASSWORD) return route.fulfill({ status: 400, json: { error: 'Wrong password', code: 'wrong_password' } })
        return route.fulfill({ json: { secret: TOTP_SECRET, uri: `otpauth://totp/Muslims.cc%3A${encodeURIComponent(USER_EMAIL)}?secret=${TOTP_SECRET}&issuer=Muslims.cc&algorithm=SHA1&digits=6&period=30` } })
      case '/api/auth/2fa/enable':
        if (body.code !== TOTP_CODE) return route.fulfill({ status: 400, json: { error: 'Invalid code', code: 'invalid_code' } })
        state.enabled = true; sync()
        events.unshift({ id: 9, kind: 'twofa_enabled', method: null, label: 'Chrome · Windows', country: 'AZ', at: Date.now() })
        return route.fulfill({ json: { ok: true, backupCodes: BACKUP } })
      case '/api/auth/2fa/disable':
        if (body.password !== USER_PASSWORD && body.code !== TOTP_CODE) return route.fulfill({ status: 400, json: { error: 'Wrong password', code: 'wrong_password' } })
        state.enabled = false; sync()
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/security/events':
        return route.fulfill({ json: { events, hold: state.hold, keepDays: 90 } })
      case '/api/auth/security/hold/release':
        state.hold = null; sync()
        return route.fulfill({ json: { ok: true } })
      case '/api/auth/data-summary':
        return route.fulfill({ json: {
          account: { sessions: 2, passkeys: 1, providers: [] }, security: { events: events.length, devices: 2, twoFactor: state.enabled },
          personal: { letters: 1, loved: 2, followers: 0, following: 1, zakat: true, pushDevices: 0 },
          family: { inCircle: false, role: null, members: 0, cards: 0, sharing: false }, hifzTests: { tests: 0 },
          sync: { linked: false, blobSize: 0, updatedAt: null, keys: 0 }, readTogether: { openRooms: 0 },
        } })
      case '/api/auth/export':
        return route.fulfill({ json: { kind: 'muslims.cc/account-export', version: 1, exportedAt: new Date().toISOString(), account: { email: USER_EMAIL }, security: { events } } })
      default:
        return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
    }
  })
  return state
}

/** Admin: 2FA açıq admin girişi (fakeAdminSession-dan SONRA). */
export async function fakeAdminTwoFactor(page, adminState) {
  const state = { requests: [] }
  await page.route((u) => u.pathname === '/api/admin/login' || u.pathname === '/api/admin/2fa', async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    state.requests.push(`${req.method()} ${pathname}`)
    if (!req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden' } })
    const body = req.postDataJSON() || {}
    if (pathname === '/api/admin/login') return route.fulfill({ json: { ok: true, twoFactor: true, ticket: TICKET } })
    if (body.ticket !== TICKET || body.code !== TOTP_CODE) return route.fulfill({ status: 401, json: { error: 'x', code: 'invalid_code' } })
    adminState.signedIn = true
    return route.fulfill({ json: { ok: true, email: 'admin@example.com', mustChangePassword: false } })
  })
  return state
}
