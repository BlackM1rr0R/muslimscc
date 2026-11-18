// Server: POST /api/auth/verify/resend (server/users.js) — təsdiq məktubunu yenidən göndər.
//   • girişsiz → 401; CSRF başlığı olmadan → 403
//   • təsdiqlənməmiş hesab: limitə qədər 200 + yeni məktub, sonra 429 (Retry-After) və məktub yoxdur
//   • limit istifadəçi başınadır (başqa hesab bloklanmır)
//   • təsdiqlənmiş hesab: 200, məktub göndərilmir
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const RESEND_MAX = 2

describe('verify/resend', () => {
  let srv
  const mail = []
  beforeAll(async () => {
    const db = openDb(':memory:')
    const authStore = auth.createAuthStore(db)
    const store = users.createUsersStore(db)
    const allowedOrigins = [ORIGIN]
    const requireAdmin = auth.createRequireAdmin({ store: authStore, allowedOrigins })
    const app = express()
    app.set('trust proxy', 1)
    app.use('/api', users.createUsersRouter({
      db, store, requireAdmin, allowedOrigins, publicOrigin: ORIGIN, googleClientId: '',
      mailer: createMailer({ apiKey: '', onMessage: (m) => mail.push(m) }),
      webauthn: {}, fetchImpl: async () => new Response('{}'),
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, google: 1000, passkeyOpts: 1000, passkeyFail: 1000, userAction: 1000, resend: RESEND_MAX },
    }))
    srv = await listen(app)
  })
  afterAll(() => srv && srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  const register = async (email) => {
    const r = await call('/api/auth/register', { body: { email, password: PASS, lang: 'az' } })
    expect(r.status).toBe(201)
    return cookieOf(r)
  }
  const verifyMails = (to) => mail.filter((m) => m.kind === 'verify' && m.to === to).length

  it('girişsiz → 401, məktub yoxdur', async () => {
    const before = mail.length
    const r = await call('/api/auth/verify/resend', { body: { lang: 'az' } })
    expect(r.status).toBe(401)
    expect(mail.length).toBe(before)
  })

  it('CSRF başlığı olmadan → 403', async () => {
    const cookie = await register('csrf@example.com')
    const before = mail.length
    const r = await call('/api/auth/verify/resend', { body: {}, cookie, headers: { 'content-type': 'application/json' } })
    expect(r.status).toBe(403)
    expect(mail.length).toBe(before)
  })

  it(`təsdiqlənməmiş: ${RESEND_MAX} dəfə 200 + məktub, sonra 429 (Retry-After), məktub yoxdur`, async () => {
    const cookie = await register('resend@example.com')
    expect(verifyMails('resend@example.com')).toBe(1)          // qeydiyyat məktubu
    for (let i = 0; i < RESEND_MAX; i++) {
      const r = await call('/api/auth/verify/resend', { body: { lang: 'en' }, cookie })
      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({ ok: true })
    }
    expect(verifyMails('resend@example.com')).toBe(1 + RESEND_MAX)
    const last = mail.filter((m) => m.kind === 'verify' && m.to === 'resend@example.com').pop()
    // lang: 'en' → ingiliscə məktub və /en/ keçidi
    expect(last.text).toContain('https://muslims.cc/en/account/verify#token=')

    const r = await call('/api/auth/verify/resend', { body: { lang: 'en' }, cookie })
    expect(r.status).toBe(429)
    expect(await r.json()).toMatchObject({ code: 'rate_limited' })
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(verifyMails('resend@example.com')).toBe(1 + RESEND_MAX)
  })

  it('limit istifadəçi başınadır: başqa hesab göndərə bilir', async () => {
    const cookie = await register('other@example.com')
    const r = await call('/api/auth/verify/resend', { body: {}, cookie })
    expect(r.status).toBe(200)
    expect(verifyMails('other@example.com')).toBe(2)
  })

  it('təsdiqlənmiş hesab: 200, yeni məktub yoxdur (limit də işlənmir)', async () => {
    const cookie = await register('done@example.com')
    const m = mail.filter((x) => x.kind === 'verify' && x.to === 'done@example.com').pop()
    const token = /#token=([A-Za-z0-9_-]{43})/.exec(m.text)[1]
    expect((await call('/api/auth/verify', { body: { token } })).status).toBe(200)
    for (let i = 0; i < RESEND_MAX + 2; i++) {
      const r = await call('/api/auth/verify/resend', { body: {}, cookie })
      expect(r.status).toBe(200)
    }
    expect(verifyMails('done@example.com')).toBe(1)
  })
})
