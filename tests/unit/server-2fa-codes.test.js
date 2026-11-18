// Server: POST /api/auth/2fa/backup-codes (server/security.js) — HTTP marşrutu.
//   • girişsiz → 401; 2FA bağlıdırsa → 400 not_enabled
//   • yenidən təsdiq tələb olunur (şifrə və ya cari kod): boş / səhv → 400, cavabda kod yoxdur
//   • yeni 10 kod qayıdır; KÖHNƏ kodlar girişdə rədd olunur, yeniləri bir dəfə işləyir
// (store səviyyəsində regenBackupCodes server-security.test.js-də yoxlanılır; bu fayl marşrutun özünü yoxlayır)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const sec = require('../../server/security.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'

describe('2FA ehtiyat kodlarının yenilənməsi (HTTP)', () => {
  let srv
  const mail = []
  beforeAll(async () => {
    const db = openDb(':memory:')
    const authStore = auth.createAuthStore(db)
    const store = users.createUsersStore(db)
    const allowedOrigins = [ORIGIN]
    const mailer = createMailer({ apiKey: '', onMessage: (m) => mail.push(m) })
    const security = sec.createSecurity({ db, mailer, publicOrigin: ORIGIN })
    const requireAdmin = auth.createRequireAdmin({ store: authStore, allowedOrigins })
    const app = express()
    app.set('trust proxy', 1)
    const router = users.createUsersRouter({
      db, store, requireAdmin, allowedOrigins, publicOrigin: ORIGIN, googleClientId: '', mailer, security,
      webauthn: {}, fetchImpl: async () => new Response('{}'),
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, google: 1000, passkeyOpts: 1000, passkeyFail: 1000, userAction: 1000, resend: 1000 },
    })
    app.use('/api', router)
    app.use('/api', sec.createSecurityRouter({ security, usersStore: store, requireUser: router.requireUser, mailer, publicOrigin: ORIGIN }))
    srv = await listen(app)
  })
  afterAll(() => srv && srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { 'user-agent': UA, ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r, name = users.USER_COOKIE) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(name + '=')) || ''
  const codeAt = (secret, t) => sec.totp(sec.base32Decode(secret), t)

  let cookie, dev, secret, oldCodes, newCodes
  // Hər TOTP addımı bir dəfə işləyir (təkrar qadağası) — testdə ardıcıl gələcək addımlar
  let step = 0
  const nextCode = () => codeAt(secret, Date.now() + (++step) * 30_000)

  it('girişsiz → 401', async () => {
    const r = await call('/api/auth/2fa/backup-codes', { body: { password: PASS } })
    expect(r.status).toBe(401)
  })

  it('2FA bağlıdırsa → 400 not_enabled', async () => {
    const r = await call('/api/auth/register', { body: { email: 'codes@example.com', password: PASS, lang: 'en' } })
    expect(r.status).toBe(201)
    cookie = cookieOf(r)
    dev = cookieOf(r, sec.DEVICE_COOKIE)
    const x = await call('/api/auth/2fa/backup-codes', { body: { password: PASS }, cookie })
    expect(x.status).toBe(400)
    expect(await x.json()).toMatchObject({ code: 'not_enabled' })
  })

  it('2FA açılır — 10 kod', async () => {
    secret = (await (await call('/api/auth/2fa/setup', { body: { password: PASS }, cookie })).json()).secret
    expect(secret).toMatch(/^[A-Z2-7]{32}$/)
    const e = await call('/api/auth/2fa/enable', { body: { code: codeAt(secret, Date.now()) }, cookie })
    expect(e.status).toBe(200)
    oldCodes = (await e.json()).backupCodes
    expect(oldCodes).toHaveLength(10)
  })

  it('yenidən təsdiqsiz, səhv şifrə və səhv kodla → 400, kod verilmir', async () => {
    for (const body of [{}, { password: 'səhv-şifrə-xxxx' }, { code: '000000' }, { backupCode: 'aaaaa-bbbbb' }]) {
      const r = await call('/api/auth/2fa/backup-codes', { body, cookie })
      expect(r.status, JSON.stringify(body)).toBe(400)
      const j = await r.json()
      expect(j.backupCodes, JSON.stringify(body)).toBeUndefined()
    }
  })

  it('CSRF: X-Requested-With olmadan → 403', async () => {
    const r = await call('/api/auth/2fa/backup-codes', { body: { password: PASS }, cookie, headers: { 'content-type': 'application/json' } })
    expect(r.status).toBe(403)
  })

  it('cari kodla yenilənir: 10 YENİ kod, köhnələrdən heç biri təkrarlanmır', async () => {
    const r = await call('/api/auth/2fa/backup-codes', { body: { code: nextCode() }, cookie })
    expect(r.status).toBe(200)
    newCodes = (await r.json()).backupCodes
    expect(newCodes).toHaveLength(10)
    for (const c of newCodes) expect(c).toMatch(/^[0-9a-z]{5}-[0-9a-z]{5}$/)
    expect(newCodes.filter((c) => oldCodes.includes(c))).toEqual([])
    const me = await (await call('/api/auth/me', { method: 'GET', cookie, headers: {} })).json()
    expect(me.twoFactor).toEqual({ enabled: true, backupCodesLeft: 10 })
  })

  const ticket = async () => {
    const j = await (await call('/api/auth/login', { body: { email: 'codes@example.com', password: PASS }, cookie: dev })).json()
    expect(j).toMatchObject({ ok: true, twoFactor: true })
    return j.ticket
  }

  it('girişdə köhnə ehtiyat kodu rədd olunur, yenisi bir dəfə işləyir', async () => {
    const bad = await call('/api/auth/2fa', { body: { ticket: await ticket(), backupCode: oldCodes[0] }, cookie: dev })
    expect(bad.status).toBe(401)
    expect(cookieOf(bad)).toBe('')

    const ok = await call('/api/auth/2fa', { body: { ticket: await ticket(), backupCode: newCodes[0] }, cookie: dev })
    expect(ok.status).toBe(200)
    expect(cookieOf(ok)).toMatch(/^__Host-mcc_user=/)
    expect((await ok.json()).user.twoFactor.backupCodesLeft).toBe(9)

    // eyni yeni kod ikinci dəfə keçmir
    expect((await call('/api/auth/2fa', { body: { ticket: await ticket(), backupCode: newCodes[0] }, cookie: dev })).status).toBe(401)
  })

  it('şifrə ilə də yenilənir; əvvəlki "yeni" kodlar da etibarsız olur', async () => {
    const r = await call('/api/auth/2fa/backup-codes', { body: { password: PASS }, cookie })
    expect(r.status).toBe(200)
    const third = (await r.json()).backupCodes
    expect(third).toHaveLength(10)
    expect((await call('/api/auth/2fa', { body: { ticket: await ticket(), backupCode: newCodes[1] }, cookie: dev })).status).toBe(401)
    expect((await call('/api/auth/2fa', { body: { ticket: await ticket(), backupCode: third[0] }, cookie: dev })).status).toBe(200)
  })
})
