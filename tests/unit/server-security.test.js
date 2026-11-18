// Server: hesab təhlükəsizliyi (server/security.js) — TOTP (RFC 6238 test vektorları, pəncərə, təkrar),
// ehtiyat kodları, giriş biletləri (şifrə + Google), passkey 2FA-nı keçir, admin 2FA, yeni cihaz
// xəbərdarlığı (mailer test qarmağı), "Bu mən deyildim" (GET dəyişmir / POST sessiyaları ləğv edir +
// bərpa məktubu), hadisələrin saxlanma müddəti, ixracda sirr yoxdur.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import crypto from 'node:crypto'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const sec = require('../../server/security.js')
const { createMailer, render } = require('../../server/mailer.js')
const personalLib = require('../../server/personal.js')
const familyLib = require('../../server/family.js')
const hifzLib = require('../../server/hifzTest.js')
const syncKeysLib = require('../../server/syncKeys.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ADMIN_PASS = 'admin-paneli-şifrəsi-123'
const ORIGIN = 'https://muslims.cc'
const GOOGLE_CLIENT = 'test-client.apps.googleusercontent.com'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'

describe('TOTP (RFC 6238 / RFC 4226)', () => {
  // RFC 6238 Əlavə B: SHA1, açar "12345678901234567890", 8 rəqəm
  const key = Buffer.from('12345678901234567890')
  const vectors = [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']]
  it('SHA1 test vektorları', () => {
    for (const [t, code] of vectors) expect(sec.totp(key, t * 1000, { digits: 8 }), String(t)).toBe(code)
  })
  it('RFC 4226 HOTP vektorları (6 rəqəm)', () => {
    const want = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489']
    want.forEach((c, i) => expect(sec.hotp(key, i)).toBe(c))
  })
  it('base32 gediş-gəliş', () => {
    const b = crypto.randomBytes(20)
    const s = sec.base32Encode(b)
    expect(s).toMatch(/^[A-Z2-7]{32}$/)
    expect(sec.base32Decode(s).equals(b)).toBe(true)
    expect(sec.base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI')
    expect(sec.base32Decode('1nvalid!')).toBeNull()
  })
  it('±1 addım pəncərəsi, kənar addım rədd; lastStep təkrarı bağlayır', () => {
    const t = 1_700_000_000_000
    const step = sec.totpStep(t)
    const prev = sec.hotp(key, step - 1), next = sec.hotp(key, step + 1), far = sec.hotp(key, step + 2)
    expect(sec.verifyTotp(key, sec.hotp(key, step), t)).toBe(step)
    expect(sec.verifyTotp(key, prev, t)).toBe(step - 1)
    expect(sec.verifyTotp(key, next, t)).toBe(step + 1)
    expect(sec.verifyTotp(key, far, t)).toBeNull()
    expect(sec.verifyTotp(key, sec.hotp(key, step), t, { lastStep: step })).toBeNull()      // eyni kod ikinci dəfə
    expect(sec.verifyTotp(key, prev, t, { lastStep: step })).toBeNull()                    // köhnə addım
    expect(sec.verifyTotp(key, '12345', t)).toBeNull()
    expect(sec.verifyTotp(key, 'abcdef', t)).toBeNull()
  })
  it('otpauth URI', () => {
    expect(sec.otpauthUri({ secret: 'ABC', account: 'a@x.az' })).toBe('otpauth://totp/Muslims.cc%3Aa%40x.az?secret=ABC&issuer=Muslims.cc&algorithm=SHA1&digits=6&period=30')
  })
  it('açar halqası: env açarı sonradan qoyulsa köhnə sirr açılır; səhv açar uzunluğu atır', () => {
    const dbKey = crypto.randomBytes(32).toString('base64')
    const a = sec.createKeyring({ dbKey })
    const sealed = a.seal(Buffer.from('sirr'), 'aad')
    expect(sealed).not.toContain('sirr')
    const b = sec.createKeyring({ envKey: crypto.randomBytes(32).toString('base64'), dbKey })
    expect(b.open(sealed, 'aad').plain.toString()).toBe('sirr')
    expect(b.open(sealed, 'başqa-aad')).toBeNull()
    expect(() => sec.createKeyring({ envKey: 'qısa', dbKey })).toThrow(/32/)
  })
  it('ehtiyat kodu formatı və normallaşdırma', () => {
    const c = sec.newBackupCode()
    expect(c).toMatch(/^[0-9a-z]{5}-[0-9a-z]{5}$/)
    expect(sec.normBackupCode(' AB0IL-xyz12 ')).toBe('ab011xyz12')
  })
})

describe('store: TOTP sirri şifrəli, ehtiyat kodları birdəfəlik, hadisələrin saxlanması', () => {
  let db, s, uid
  beforeAll(async () => {
    db = openDb(':memory:')
    const us = users.createUsersStore(db)
    s = sec.createSecurityStore(db)
    uid = us.createUser({ email: 'st@x.az', passHash: await auth.hashPassword(PASS, { min: 10 }) })
  })
  it('qurulum → təsdiq → yoxlama → təkrar qadağası; DB-də sirr açıq deyil', () => {
    const t = Date.now()
    const secret = s.totpBegin('user', uid, t)
    const key = sec.base32Decode(secret)
    const row = db.raw.prepare('SELECT secret_enc FROM user_totp WHERE user_id = ?').get(uid)
    expect(row.secret_enc).toMatch(/^v1\./)
    expect(row.secret_enc).not.toContain(secret)
    expect(s.totpConfirm('user', uid, '000000', t)).toBeNull()
    const codes = s.totpConfirm('user', uid, sec.totp(key, t), t)
    expect(codes).toHaveLength(10)
    expect(s.totpBegin('user', uid, t)).toBeNull()                     // aktivdirsə yenisi yaradılmır
    // Təsdiqdə işlənmiş kod girişdə yenidən keçmir; növbəti addımın kodu keçir, sonra o da bağlanır
    expect(s.totpVerify('user', uid, sec.totp(key, t), t)).toBe(false)
    const t2 = t + 30_000
    expect(s.totpVerify('user', uid, sec.totp(key, t2), t2)).toBe(true)
    expect(s.totpVerify('user', uid, sec.totp(key, t2), t2)).toBe(false)
    // Ehtiyat kodları: heş saxlanır, bir dəfə işləyir
    const hashes = db.raw.prepare('SELECT code_hash FROM user_backup_codes WHERE user_id = ?').all(uid).map((r) => r.code_hash)
    expect(hashes.join()).not.toContain(codes[0].replace('-', ''))
    expect(s.useBackupCode('user', uid, codes[0].toUpperCase(), t)).toBe(true)
    expect(s.useBackupCode('user', uid, codes[0], t)).toBe(false)
    expect(s.totpStatus('user', uid)).toMatchObject({ enabled: true, backupCodesLeft: 9 })
    const fresh = s.regenBackupCodes('user', uid)
    expect(s.useBackupCode('user', uid, codes[1], t)).toBe(false)     // köhnə kodlar etibarsızdır
    expect(s.useBackupCode('user', uid, fresh[0], t)).toBe(true)
    s.totpDisable('user', uid)
    expect(s.totpStatus('user', uid)).toEqual({ enabled: false, enabledAt: null, backupCodesLeft: 0 })
  })
  it('köhnə qurulum (30 dəq+) təsdiqlənmir', () => {
    const t = Date.now()
    const key = sec.base32Decode(s.totpBegin('user', uid, t - 31 * 60_000))
    expect(s.totpConfirm('user', uid, sec.totp(key, t), t)).toBeNull()
  })
  it('hadisələr: 90 gündən köhnələr silinir, istifadəçi başına 200', () => {
    const t = Date.now()
    s.addEvent(uid, { kind: 'sign_in', method: 'password', label: 'Chrome · Windows' }, t - 91 * 86400_000)
    s.addEvent(uid, { kind: 'sign_in', method: 'password' }, t - 10 * 86400_000)
    expect(() => s.addEvent(uid, { kind: 'naməlum' }, t)).toThrow()
    expect(s.events(uid)).toHaveLength(2)
    s.purge(t)
    expect(s.events(uid)).toHaveLength(1)
    for (let i = 0; i < 205; i++) s.addEvent(uid, { kind: 'sign_in' }, t + i)
    expect(s.countEvents(uid)).toBe(200)
    expect(s.events(uid)).toHaveLength(30)
  })
  it('cihaz: ilk cihaz "first" (səssiz), sonrakı yeni', () => {
    expect(s.seeDevice('user', uid, 'h1', 'A', 1)).toEqual({ isNew: true, first: true })
    expect(s.seeDevice('user', uid, 'h1', 'A', 2)).toEqual({ isNew: false, first: false })
    expect(s.seeDevice('user', uid, 'h2', 'B', 3)).toEqual({ isNew: true, first: false })
  })
})

describe('mailer: təhlükəsizlik şablonları', () => {
  it('5 dil, yer tutucular, "Bu mən deyildim" keçidi', () => {
    for (const l of ['az', 'en', 'ru', 'tr', 'ar']) {
      const m = render('newSignIn', l, { url: 'https://muslims.cc/api/security/not-me?t=x', time: '1 Jan 2026 (UTC)', device: 'Chrome · Windows', place: 'Azerbaijan' })
      expect(m.text).toContain('Chrome · Windows')
      expect(m.text).toContain('Azerbaijan')
      expect(m.html).toContain('not-me?t=x')
      expect(m.text).not.toMatch(/\{(time|device|place)\}/)
      const c = render('securityChange', l, { event: 'EVT', url: 'https://muslims.cc/x', time: 't', device: 'd', place: 'p' })
      expect(c.subject).toContain('EVT')
    }
    expect(render('newSignIn', 'de', {}).subject).toMatch(/New sign-in/)
    // köhnə şablonlar dəyişməyib
    expect(render('verify', 'az', { url: 'https://muslims.cc/x' }).text).not.toContain('Vaxt:')
  })
})

describe('HTTP', () => {
  let srv, db, store, authStore, security, mail, personal
  const ids = {}
  const fakeWebauthn = {
    async generateAuthenticationOptions(o) { return { challenge: 'auth-ch', rpId: o.rpID } },
    async verifyAuthenticationResponse(o) { return { verified: o.response.response.clientDataJSON === 'ok-' + o.expectedChallenge, authenticationInfo: { newCounter: 1 } } },
  }
  // Google: yerli RSA + saxta JWKS
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }
  const fakeFetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'max-age=3600' } })
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const googleJwt = (claims = {}) => {
    const t = Math.floor(Date.now() / 1000)
    const head = b64({ alg: 'RS256', kid: 'k1', typ: 'JWT' })
    const body = b64({ iss: 'https://accounts.google.com', aud: GOOGLE_CLIENT, sub: 'g-2fa', email: 'g2fa@example.com', email_verified: true, iat: t, exp: t + 3600, ...claims })
    return `${head}.${body}.${crypto.sign('RSA-SHA256', Buffer.from(head + '.' + body), privateKey).toString('base64url')}`
  }

  beforeAll(async () => {
    mail = []
    db = openDb(':memory:')
    authStore = auth.createAuthStore(db)
    store = users.createUsersStore(db)
    ids.admin = await authStore.createAdmin('admin@muslims.cc', ADMIN_PASS)
    store.setAdminRole('admin@muslims.cc', 'superadmin')
    const allowedOrigins = [ORIGIN]
    const mailer = createMailer({ apiKey: '', onMessage: (m) => mail.push(m) })
    personal = personalLib.createPersonalStore(db)
    security = sec.createSecurity({ db, mailer, publicOrigin: ORIGIN, prefsOf: (id) => personal.prefs(id) })
    const requireAdmin = auth.createRequireAdmin({ store: authStore, allowedOrigins })
    const app = express()
    app.set('trust proxy', 1)
    app.use('/api', auth.createAuthRouter({ store: authStore, requireAdmin, allowedOrigins, adminRoleOf: store.adminRole, security }))
    const router = users.createUsersRouter({
      db, store, requireAdmin, allowedOrigins, publicOrigin: ORIGIN, googleClientId: GOOGLE_CLIENT, mailer, security,
      webauthn: fakeWebauthn, fetchImpl: fakeFetch,
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, google: 1000, passkeyOpts: 1000, passkeyFail: 1000, userAction: 1000, resend: 1000 },
    })
    app.use('/api', router)
    const syncKeys = syncKeysLib.createSyncKeysStore(db)
    const family = familyLib.createFamilyRouter({ db, requireUser: router.requireUser })
    const hifz = hifzLib.createHifzTestRouter({ db, requireUser: router.requireUser, allowedOrigins })
    app.use('/api', sec.createSecurityRouter({
      security, usersStore: store, requireUser: router.requireUser, mailer, publicOrigin: ORIGIN,
      sources: { personal: () => personal, family, hifzTests: hifz, sync: syncKeys },
      limits: { exports: 3 },
    }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H, ua = UA_WIN } = {}) => fetch(srv.url + path, {
    method, headers: { 'user-agent': ua, ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookiesOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0])
  const cookieOf = (r, name = users.USER_COOKIE) => cookiesOf(r).find((c) => c.startsWith(name + '=')) || ''
  const lastMail = (kind) => [...mail].reverse().find((m) => m.kind === kind)
  const notMeToken = (m) => /not-me\?t=([A-Za-z0-9_-]{43})/.exec(m.text)[1]
  const codeNow = (secret, t = Date.now()) => sec.totp(sec.base32Decode(secret), t)

  let cookie, dev, uid, totpSecret, backup
  it('qeydiyyat: cihaz cookie-si (HttpOnly, Secure, Lax, 2 il) — məktub yoxdur', async () => {
    const r = await call('/api/auth/register', { body: { email: 'sec@example.com', password: PASS, lang: 'en' } })
    expect(r.status).toBe(201)
    uid = (await r.json()).user.id
    const sc = r.headers.getSetCookie().find((c) => c.startsWith(sec.DEVICE_COOKIE + '='))
    for (const f of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${2 * 365 * 24 * 3600}`]) expect(sc).toContain(f)
    dev = cookieOf(r, sec.DEVICE_COOKIE)
    cookie = cookieOf(r)
    expect(mail.filter((m) => m.kind === 'newSignIn')).toHaveLength(0)
  })
  it('eyni cihazdan giriş — məktub yoxdur; /me twoFactor + securityHold', async () => {
    const r = await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS }, cookie: dev })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j.user.twoFactor).toEqual({ enabled: false, backupCodesLeft: 0 })
    expect(j.user.securityHold).toBe(false)
    expect(mail.filter((m) => m.kind === 'newSignIn')).toHaveLength(0)
  })
  it('yeni cihazdan giriş → hadisə + məktub (vaxt istifadəçinin tz-si, ölkə CF-IPCountry-dən)', async () => {
    personal.touchPrefs(uid, { tz: 'Asia/Baku', lang: 'en' })
    const r = await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS, lang: 'ru' }, ua: UA_IOS, headers: { ...H, 'cf-ipcountry': 'TR' } })
    expect(r.status).toBe(200)
    const m = lastMail('newSignIn')
    expect(m.to).toBe('sec@example.com')
    expect(m.subject).toMatch(/нового устройства/)
    expect(m.text).toContain('Safari · iOS')
    expect(m.text).toContain('Турция')
    expect(m.text).toContain('Asia/Baku')
    expect(m.text).toMatch(/\/api\/security\/not-me\?t=[A-Za-z0-9_-]{43}/)
    cookie = cookieOf(r)
    const ev = await (await call('/api/auth/security/events', { method: 'GET', cookie, headers: {} })).json()
    expect(ev.events[0]).toMatchObject({ kind: 'sign_in_new', method: 'password', label: 'Safari · iOS', country: 'TR' })
    expect(ev.keepDays).toBe(90)
    // DB-də IP / tam UA yoxdur
    expect(JSON.stringify(db.raw.prepare('SELECT * FROM user_security_events').all())).not.toMatch(/Mozilla|127\.0\.0\.1/)
  })
  it('"Bu mən deyildim": GET heç nəyi dəyişmir (poçt skaneri)', async () => {
    const t = notMeToken(lastMail('newSignIn'))
    const before = store.listSessions(uid, '').length
    const g = await call(`/api/security/not-me?t=${t}`, { method: 'GET', headers: {} })
    expect(g.status).toBe(200)
    const html = await g.text()
    expect(html).toContain('<form method="post"')
    expect(html).toMatch(/lang="ru"/)
    expect(g.headers.get('content-security-policy')).toContain("default-src 'none'")
    await call(`/api/security/not-me?t=${t}`, { method: 'GET', headers: {} })
    expect(store.listSessions(uid, '').length).toBe(before)
    expect(security.onHold(uid)).toBe(false)
    expect((await call('/api/security/not-me?t=yanlış', { method: 'GET', headers: {} })).status).toBe(400)
  })
  it('"Bu mən deyildim": POST → bütün sessiyalar ləğv, hold, bərpa məktubu; token birdəfəlik', async () => {
    const t = notMeToken(lastMail('newSignIn'))
    const resetsBefore = mail.filter((m) => m.kind === 'reset').length
    const p = await fetch(srv.url + '/api/security/not-me', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `t=${t}` })
    expect(p.status).toBe(200)
    expect(store.listSessions(uid, '').length).toBe(0)
    expect((await call('/api/auth/me', { method: 'GET', cookie, headers: {} })).status).toBe(401)
    expect(mail.filter((m) => m.kind === 'reset').length).toBe(resetsBefore + 1)
    expect(lastMail('reset').text).toMatch(/\/ru\/account\/reset#token=/)
    expect(security.onHold(uid)).toBe(true)
    const again = await fetch(srv.url + '/api/security/not-me', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `t=${t}` })
    expect(again.status).toBe(400)
    // Hold: şifrə ilə giriş bağlıdır
    const l = await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS }, cookie: dev })
    expect(l.status).toBe(403)
    expect((await l.json()).code).toBe('security_hold')
  })
  it('şifrə bərpası hold-u açır + "şifrə bərpa edildi" məktubu', async () => {
    const token = /#token=([A-Za-z0-9_-]{43})/.exec(lastMail('reset').text)[1]
    const r = await call('/api/auth/reset', { body: { token, password: PASS + '-yeni' } })
    expect(r.status).toBe(200)
    expect(security.onHold(uid)).toBe(false)
    expect(lastMail('securityChange').subject).toMatch(/Password reset|Пароль сброшен/)
    const l = await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })
    expect(l.status).toBe(200)
    cookie = cookieOf(l)
  })

  it('2FA qurulumu: şifrə tələb olunur, kod ilə açılır, 10 ehtiyat kodu, məktub', async () => {
    const bad = await call('/api/auth/2fa/setup', { body: { password: 'səhv-şifrə-xxx' }, cookie })
    expect((await bad.json()).code).toBe('wrong_password')
    const r = await call('/api/auth/2fa/setup', { body: { password: PASS + '-yeni' }, cookie })
    const j = await r.json()
    expect(j.secret).toMatch(/^[A-Z2-7]{32}$/)
    expect(j.uri).toContain('otpauth://totp/Muslims.cc%3Asec%40example.com?secret=' + j.secret)
    totpSecret = j.secret
    expect((await call('/api/auth/2fa/enable', { body: { code: '000000' }, cookie })).status).toBe(400)
    const e = await call('/api/auth/2fa/enable', { body: { code: codeNow(totpSecret) }, cookie })
    const ej = await e.json()
    expect(ej.backupCodes).toHaveLength(10)
    backup = ej.backupCodes
    expect(lastMail('securityChange').text).toMatch(/Two-step verification turned on/)
    const me = await (await call('/api/auth/me', { method: 'GET', cookie, headers: {} })).json()
    expect(me.twoFactor).toEqual({ enabled: true, backupCodesLeft: 10 })
  })
  it('2FA açılanda { revokeOthers: true } — digər sessiyalar bağlanır, cari qalır; bayraqsız — toxunulmur', async () => {
    const reg = await call('/api/auth/register', { body: { email: 'revoke@example.com', password: PASS, lang: 'en' } })
    const c1 = cookieOf(reg)
    const c2 = cookieOf(await call('/api/auth/login', { body: { email: 'revoke@example.com', password: PASS } }))
    const c3 = cookieOf(await call('/api/auth/login', { body: { email: 'revoke@example.com', password: PASS } }))
    const me = (c) => call('/api/auth/me', { method: 'GET', cookie: c, headers: {} }).then((r) => r.status)
    expect([await me(c1), await me(c2), await me(c3)]).toEqual([200, 200, 200])
    const s = await (await call('/api/auth/2fa/setup', { body: { password: PASS }, cookie: c1 })).json()
    const e = await call('/api/auth/2fa/enable', { body: { code: codeNow(s.secret), revokeOthers: true }, cookie: c1 })
    expect(e.status).toBe(200)
    expect((await e.json()).revoked).toBe(2)
    expect([await me(c1), await me(c2), await me(c3)]).toEqual([200, 401, 401])
    // bayraq olmadan (köhnə klient) — sessiyalar qalır, cavabda revoked: 0
    const reg2 = await call('/api/auth/register', { body: { email: 'keep@example.com', password: PASS, lang: 'en' } })
    const k1 = cookieOf(reg2)
    const k2 = cookieOf(await call('/api/auth/login', { body: { email: 'keep@example.com', password: PASS } }))
    const s2 = await (await call('/api/auth/2fa/setup', { body: { password: PASS }, cookie: k1 })).json()
    const e2 = await (await call('/api/auth/2fa/enable', { body: { code: codeNow(s2.secret) }, cookie: k1 })).json()
    expect(e2.revoked).toBe(0)
    expect([await me(k1), await me(k2)]).toEqual([200, 200])
  })

  it('şifrə ilə giriş → { twoFactor, ticket } (sessiya YOX) → kod → sessiya; təkrar kod rədd', async () => {
    const r = await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })
    const j = await r.json()
    expect(j).toMatchObject({ ok: true, twoFactor: true })
    expect(j.ticket).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(j.user).toBeUndefined()
    expect(cookieOf(r)).toBe('')
    const wrong = await call('/api/auth/2fa', { body: { ticket: j.ticket, code: '000000' } })
    expect(wrong.status).toBe(401)
    expect(await wrong.json()).toMatchObject({ code: 'invalid_code', attemptsLeft: 4 })
    // Qurulumda işlənmiş addımın kodu yenidən keçməsin deyə növbəti addımın kodu
    const t = Date.now() + 30_000
    const ok = await call('/api/auth/2fa', { body: { ticket: j.ticket, code: codeNow(totpSecret, t) }, cookie: dev })
    expect(ok.status).toBe(200)
    expect(cookieOf(ok)).toMatch(/^__Host-mcc_user=/)
    expect((await ok.json()).user.email).toBe('sec@example.com')
    // bilet birdəfəlikdir; eyni kod başqa biletlə də keçmir (təkrar qadağası)
    expect((await call('/api/auth/2fa', { body: { ticket: j.ticket, code: codeNow(totpSecret, t) } })).status).toBe(401)
    const r2 = await (await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })).json()
    expect((await call('/api/auth/2fa', { body: { ticket: r2.ticket, code: codeNow(totpSecret, t) } })).status).toBe(401)
  })
  it('bilet başına 5 cəhd, sonra bilet silinir; ehtiyat kodu bir dəfə işləyir', async () => {
    const j = await (await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })).json()
    for (let i = 0; i < 4; i++) expect((await (await call('/api/auth/2fa', { body: { ticket: j.ticket, code: '111111' } })).json()).code).toBe('invalid_code')
    expect((await (await call('/api/auth/2fa', { body: { ticket: j.ticket, code: '111111' } })).json()).code).toBe('invalid_ticket')
    expect((await (await call('/api/auth/2fa', { body: { ticket: j.ticket, backupCode: backup[0] } })).json()).code).toBe('invalid_ticket')
    const evs = security.store.events(uid, 50).map((e) => e.kind)
    expect(evs).toContain('twofa_failed')
    const k = await (await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })).json()
    const b = await call('/api/auth/2fa', { body: { ticket: k.ticket, backupCode: backup[0] }, cookie: dev })
    expect(b.status).toBe(200)
    expect((await b.json()).user.twoFactor.backupCodesLeft).toBe(9)
    const k2 = await (await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })).json()
    expect((await call('/api/auth/2fa', { body: { ticket: k2.ticket, backupCode: backup[0] } })).status).toBe(401)
    expect(security.store.events(uid, 2).map((e) => e.kind)).toEqual(['backup_code_used', 'sign_in'])
    expect(security.store.events(uid, 2)[1].method).toBe('password+backup')
  })
  it('istifadəçi üzrə limit: 15 dəq-də 10 səhv kod → 429 (yeni bilet də)', async () => {
    const s2 = sec.createSecurity({ db, limits: { codeFails: 2 } })
    const t = s2.issueTicket('user', uid, {})
    expect(s2.secondFactor('user', { ticket: t, code: '000000' }).code).toBe('invalid_code')
    expect(s2.secondFactor('user', { ticket: t, code: '000000' }).code).toBe('invalid_code')
    const t2 = s2.issueTicket('user', uid, {})
    expect(s2.secondFactor('user', { ticket: t2, code: '000000' })).toMatchObject({ ok: false, status: 429 })
    expect(s2.secondFactor('admin', { ticket: s2.issueTicket('user', uid, {}), code: '000000' }).code).toBe('invalid_ticket')   // başqa sahə
  })
  it('passkey ilə giriş 2FA-nı keçir', async () => {
    const credId = 'cred-2fa-' + uid
    store.addPasskey({ id: credId, userId: uid, publicKey: new Uint8Array([1, 2, 3]), name: 'Test' })
    const o = await (await call('/api/auth/passkey/login/options', { body: {} })).json()
    const r = await call('/api/auth/passkey/login/verify', { body: { challengeId: o.challengeId, response: { id: credId, type: 'public-key', response: { clientDataJSON: 'ok-auth-ch' } } }, cookie: dev })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(j.twoFactor).toBeUndefined()
    expect(j.user.twoFactor.enabled).toBe(true)
    expect(cookieOf(r)).toMatch(/^__Host-mcc_user=/)
    expect(security.store.events(uid, 1)[0]).toMatchObject({ kind: 'sign_in', method: 'passkey' })
  })
  it('Google ilə giriş + 2FA → bilet → kod → sessiya', async () => {
    // Google hesabı (yeni) — sonra 2FA qurulur
    const c = await call('/api/auth/google', { body: { credential: googleJwt() } })
    expect(c.status).toBe(201)
    const gc = cookieOf(c)
    const g = await (await call('/api/auth/me', { method: 'GET', cookie: gc, headers: {} })).json()
    const setup = await (await call('/api/auth/2fa/setup', { body: {}, cookie: gc })).json()   // şifrəsiz hesab — şifrə soruşulmur
    const en = await call('/api/auth/2fa/enable', { body: { code: codeNow(setup.secret) }, cookie: gc })
    expect(en.status).toBe(200)
    const gBackup = (await en.json()).backupCodes
    const r = await (await call('/api/auth/google', { body: { credential: googleJwt() } })).json()
    expect(r.twoFactor).toBe(true)
    const ok = await call('/api/auth/2fa', { body: { ticket: r.ticket, code: codeNow(setup.secret, Date.now() + 30_000) } })
    expect(ok.status).toBe(200)
    expect((await ok.json()).user.id).toBe(g.id)
    // şifrəsiz hesabda 2FA-nı bağlamaq üçün kod lazımdır
    const gc2 = cookieOf(ok)
    expect((await (await call('/api/auth/2fa/disable', { body: {}, cookie: gc2 })).json()).code).toBe('code_required')
    // girişdə işlənmiş addımın kodu (və köhnələri) təkrar keçmir — ehtiyat kodu ilə
    expect((await call('/api/auth/2fa/disable', { body: { code: codeNow(setup.secret, Date.now() + 30_000) }, cookie: gc2 })).status).toBe(400)
    expect((await call('/api/auth/2fa/disable', { body: { backupCode: gBackup[0] }, cookie: gc2 })).status).toBe(200)
  })
  it('2FA bağlama: səhv şifrə → 400, düz şifrə → söndürülür + məktub', async () => {
    const l = await (await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })).json()
    const ok = await call('/api/auth/2fa', { body: { ticket: l.ticket, backupCode: backup[1] }, cookie: dev })
    cookie = cookieOf(ok)
    expect((await call('/api/auth/2fa/disable', { body: { password: 'səhv-şifrə-xxx' }, cookie })).status).toBe(400)
    expect((await call('/api/auth/2fa/disable', { body: { password: PASS + '-yeni' }, cookie })).status).toBe(200)
    expect(lastMail('securityChange').text).toMatch(/turned off/)
    expect((await (await call('/api/auth/login', { body: { email: 'sec@example.com', password: PASS + '-yeni' }, cookie: dev })).json()).twoFactor).toBeUndefined()
  })
  it('şifrə dəyişməsi və passkey silinməsi → məktub', async () => {
    const n = mail.length
    expect((await call('/api/auth/password', { body: { current: PASS + '-yeni', next: PASS }, cookie })).status).toBe(200)
    expect(lastMail('securityChange').text).toMatch(/Password changed/)
    expect((await call('/api/auth/passkey/remove', { body: { id: 'cred-2fa-' + uid }, cookie })).status).toBe(200)
    expect(lastMail('securityChange').text).toMatch(/Passkey removed/)
    expect(mail.length).toBe(n + 2)
  })
  it('hold-u açmaq yalnız hold-dan sonra yaradılmış sessiya ilə', async () => {
    security.store.setHold(uid, Date.now() + 60_000)          // "gələcək" — cari sessiya ondan köhnədir
    expect((await (await call('/api/auth/security/hold/release', { body: {}, cookie })).json()).code).toBe('reauth_required')
    security.store.setHold(uid, Date.now() - 60_000)
    expect((await call('/api/auth/security/hold/release', { body: {}, cookie })).status).toBe(200)
    expect(security.onHold(uid)).toBe(false)
  })

  it('xülasə və ixrac: sirr yoxdur; limit', async () => {
    personal.touchPrefs(uid, { tz: 'Asia/Baku', lang: 'en', consent: 'letters' })
    db.raw.prepare("INSERT INTO personal_letters (user_id, body, deliver_on, kind, tz, lang, status, created_at, updated_at) VALUES (?, 'salam', '2030-01-01', 'date', 'UTC', 'en', 'pending', 1, 1)").run(uid)
    db.raw.prepare("INSERT INTO personal_loved_shares (owner_id, token_hash, created_at) VALUES (?, 'SHAREHASHSECRET', 1)").run(uid)
    db.raw.prepare("INSERT INTO user_sync_keys (user_id, kind, cred_id, salt, wrapped, created_at) VALUES (?, 'password', '', 'SALTSECRET', 'WRAPPEDSECRET', 1)").run(uid)
    db.raw.prepare("INSERT INTO user_sync_link (user_id, sync_id, linked_at) VALUES (?, ?, 1)").run(uid, 'f'.repeat(64))
    const sum = await (await call('/api/auth/data-summary', { method: 'GET', cookie, headers: {} })).json()
    expect(sum.account.sessions).toBeGreaterThan(0)
    expect(sum.personal).toMatchObject({ letters: 1 })
    expect(sum.sync).toMatchObject({ linked: true, keys: 1 })
    expect(sum.security.events).toBeGreaterThan(0)
    const r = await call('/api/auth/export', { method: 'GET', cookie, headers: {} })
    expect(r.status).toBe(200)
    expect(r.headers.get('content-disposition')).toContain('attachment')
    const text = await r.text()
    const j = JSON.parse(text)
    expect(j.kind).toBe('muslims.cc/account-export')
    expect(j.account.email).toBe('sec@example.com')
    expect(j.personal.letters[0].body).toBe('salam')
    expect(j.security.events.length).toBeGreaterThan(0)
    expect(j.family).toBeTruthy()
    expect(Array.isArray(j.hifzTests)).toBe(true)
    for (const bad of ['scrypt$', 'pass_hash', 'SHAREHASHSECRET', 'SALTSECRET', 'WRAPPEDSECRET', 'f'.repeat(64), 'secret_enc', 'code_hash', 'token_hash', 'dev_hash', 'id_hash', 'g-2fa', 'v1.']) {
      expect(text, bad).not.toContain(bad)
    }
    for (const row of db.raw.prepare('SELECT secret_enc FROM user_totp').all()) expect(text).not.toContain(row.secret_enc)
    expect((await call('/api/auth/export', { method: 'GET', cookie, headers: {} })).status).toBe(200)
    expect((await call('/api/auth/export', { method: 'GET', cookie, headers: {} })).status).toBe(200)
    expect((await call('/api/auth/export', { method: 'GET', cookie, headers: {} })).status).toBe(429)
    expect((await call('/api/auth/export', { method: 'GET', headers: {} })).status).toBe(401)
  })

  // ── Admin paneli ──
  it('admin: 2FA qurulumu → girişdə bilet → kod → sessiya; /me twoFactor', async () => {
    const l = await call('/api/admin/login', { body: { email: 'admin@muslims.cc', password: ADMIN_PASS } })
    const ac = cookieOf(l, auth.COOKIE_NAME)
    const adev = cookieOf(l, sec.DEVICE_COOKIE)
    expect((await (await call('/api/admin/me', { method: 'GET', cookie: ac, headers: {} })).json()).twoFactor).toBe(false)
    expect((await call('/api/admin/2fa/setup', { body: { password: 'səhv' }, cookie: ac })).status).toBe(400)
    const s = await (await call('/api/admin/2fa/setup', { body: { password: ADMIN_PASS }, cookie: ac })).json()
    expect(s.uri).toContain('Muslims.cc%20Admin')
    const e = await (await call('/api/admin/2fa/enable', { body: { code: codeNow(s.secret) }, cookie: ac })).json()
    expect(e.backupCodes).toHaveLength(10)
    expect(db.raw.prepare('SELECT enabled FROM admin_totp WHERE admin_id = ?').get(ids.admin).enabled).toBe(1)
    const r = await (await call('/api/admin/login', { body: { email: 'admin@muslims.cc', password: ADMIN_PASS }, cookie: adev })).json()
    expect(r.twoFactor).toBe(true)
    expect((await call('/api/admin/2fa', { body: { ticket: r.ticket, code: '000000' } })).status).toBe(401)
    const ok = await call('/api/admin/2fa', { body: { ticket: r.ticket, code: codeNow(s.secret, Date.now() + 30_000) }, cookie: adev })
    expect(ok.status).toBe(200)
    const ac2 = cookieOf(ok, auth.COOKIE_NAME)
    expect((await (await call('/api/admin/me', { method: 'GET', cookie: ac2, headers: {} })).json()).twoFactor).toBe(true)
    // istifadəçi bileti admin girişində işləmir
    const ut = security.issueTicket('user', uid, {})
    expect((await call('/api/admin/2fa', { body: { ticket: ut, code: '000000' } })).status).toBe(401)
    // skriptlə bərpa (totp-reset ilə eyni funksiya)
    security.store.totpDisable('admin', ids.admin)
    expect((await (await call('/api/admin/login', { body: { email: 'admin@muslims.cc', password: ADMIN_PASS }, cookie: adev })).json()).twoFactor).toBeUndefined()
  })
  it('admin: yeni cihazdan giriş → məktub; mailer olmadan çökmür', async () => {
    const n = mail.filter((m) => m.kind === 'adminSignIn').length
    const r = await call('/api/admin/login', { body: { email: 'admin@muslims.cc', password: ADMIN_PASS, lang: 'en' }, ua: UA_IOS })
    expect(r.status).toBe(200)
    expect(mail.filter((m) => m.kind === 'adminSignIn').length).toBe(n + 1)
    expect(lastMail('adminSignIn')).toMatchObject({ to: 'admin@muslims.cc' })
    expect(lastMail('adminSignIn').text).toContain('Safari · iOS')
    // mailer yoxdur — xəta atmır
    const quiet = sec.createSecurity({ db })
    const res = { append() {} }
    expect(() => quiet.afterAdminLogin({ headers: { 'user-agent': UA_IOS } }, res, { id: ids.admin, email: 'admin@muslims.cc' })).not.toThrow()
    expect(() => quiet.afterUserLogin({ headers: {} }, res, { id: uid, email: 'x@x.az' }, { method: 'password' })).not.toThrow()
  })
})
