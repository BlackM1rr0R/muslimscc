// Server: istifadəçi hesabları (server/users.js) — qeydiyyat/giriş, CSRF, limit, bərpa, rollar,
// Google ID tokeni (yerli RSA açarı + saxta JWKS), passkey (saxta WebAuthn kitabxanası), silmə.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import crypto from 'node:crypto'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ADMIN_PASS = 'admin-paneli-şifrəsi-123'
const ORIGIN = 'https://muslims.cc'
const GOOGLE_CLIENT = 'test-client.apps.googleusercontent.com'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }

// ── Google: yerli RSA açarı + saxta JWKS ──
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }
let jwksFetches = 0
const fakeFetch = async (url) => {
  jwksFetches++
  expect(url).toBe('https://www.googleapis.com/oauth2/v3/certs')
  return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'public, max-age=3600' } })
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
function googleJwt(claims = {}, { kid = 'k1', key = privateKey, alg = 'RS256' } = {}) {
  const t = Math.floor(Date.now() / 1000)
  const head = b64({ alg, kid, typ: 'JWT' })
  const body = b64({ iss: 'https://accounts.google.com', aud: GOOGLE_CLIENT, sub: 'g-123', email: 'gu@example.com', email_verified: true, name: 'G User', iat: t, exp: t + 3600, ...claims })
  const sig = crypto.sign('RSA-SHA256', Buffer.from(head + '.' + body), key).toString('base64url')
  return `${head}.${body}.${sig}`
}

// ── Saxta WebAuthn kitabxanası (@simplewebauthn/server API-sinin forması) ──
const calls = []
const fakeWebauthn = {
  async generateRegistrationOptions(o) {
    calls.push(['regOptions', o])
    return { challenge: 'reg-challenge-' + calls.length, rp: { id: o.rpID, name: o.rpName }, user: { id: Buffer.from(o.userID).toString('base64url'), name: o.userName, displayName: o.userDisplayName },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }], excludeCredentials: o.excludeCredentials, authenticatorSelection: o.authenticatorSelection, attestation: o.attestationType }
  },
  async verifyRegistrationResponse(o) {
    calls.push(['regVerify', o])
    const ok = o.response.response.clientDataJSON === 'ok-' + o.expectedChallenge
    return ok ? { verified: true, registrationInfo: { credential: { id: o.response.id, publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal'] } } } : { verified: false }
  },
  async generateAuthenticationOptions(o) {
    calls.push(['authOptions', o])
    return { challenge: 'auth-challenge-' + calls.length, rpId: o.rpID, allowCredentials: [], userVerification: o.userVerification }
  },
  async verifyAuthenticationResponse(o) {
    calls.push(['authVerify', o])
    const ok = o.response.response.clientDataJSON === 'ok-' + o.expectedChallenge && Buffer.from(o.credential.publicKey).equals(Buffer.from([1, 2, 3]))
    return ok ? { verified: true, authenticationInfo: { newCounter: o.credential.counter + 1 } } : { verified: false }
  },
}

describe('köməkçilər', () => {
  it('zəif şifrələr rədd edilir', () => {
    for (const w of ['qisa', 'password123', 'Password2024!', '1234567890', 'qwertyuiop', 'aaaaaaaaaaaa', 'abababababab', 'bismillah786', 'ali.veli@x.az']) {
      expect(users.weakPassword(w, 'ali.veli@x.az'), w).toBe(true)
    }
    expect(users.weakPassword('ali.veli12', 'ali.veli12@x.az')).toBe(true)
    expect(users.weakPassword(PASS)).toBe(false)
    expect(users.weakPassword('kitab-oxu-sabah')).toBe(false)
  })
  it('user-agent → kobud etiket', () => {
    expect(users.uaLabel('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36')).toBe('Chrome · Android')
    expect(users.uaLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toBe('Safari · iOS')
    expect(users.uaLabel('')).toBe('')
  })
  it('rol qaydaları', () => {
    const t = (role, email = 't@x.az') => ({ role, email })
    const e = (actorRole, target, newRole, actorEmail = 'a@x.az') => users.roleChangeError({ actorRole, actorEmail, target, newRole })
    expect(e('admin', t('user'), 'editor')).toBeNull()
    expect(e('admin', t('user'), 'mosque_rep')).toBeNull()
    expect(e('admin', t('user'), 'admin')).toBe('superadmin_required')
    expect(e('admin', t('admin'), 'user')).toBe('superadmin_required')
    expect(e('admin', t('user'), 'superadmin')).toBe('script_only')
    expect(e('superadmin', t('user'), 'superadmin')).toBe('script_only')
    expect(e('superadmin', t('superadmin'), 'user')).toBe('script_only')
    expect(e('superadmin', t('user'), 'admin')).toBeNull()
    expect(e('editor', t('user'), 'mosque_rep')).toBe('forbidden')
    expect(e('superadmin', t('user', 'A@x.az'), 'editor', 'a@x.az')).toBe('self')
    expect(e('admin', t('user'), 'root')).toBe('bad_role')
  })
  it('mailer: açar yoxdursa göndərmir, test qarmağı məktubu tutur; şablonlar 5 dildə', async () => {
    const got = []
    const m = createMailer({ apiKey: '', onMessage: (x) => got.push(x) })
    expect(m.enabled).toBe(false)
    await m.sendTemplate('reset', 'ru', 'a@x.az', { url: 'https://muslims.cc/account/reset#token=abc' })
    expect(got[0]).toMatchObject({ to: 'a@x.az', kind: 'reset' })
    expect(got[0].subject).toMatch(/пароля/)
    expect(got[0].text).toContain('https://muslims.cc/account/reset#token=abc')
    // HTML-də xarici dəyişən escape olunur; javascript: keçidi atılır
    const bad = require('../../server/mailer.js').render('verify', 'xx', { url: 'javascript:alert(1)' })
    expect(bad.html).not.toContain('javascript:')
    expect(bad.subject).toMatch(/Confirm/)
  })
  it('mailer: Resend API-sinə düzgün sorğu', async () => {
    let req
    const m = createMailer({ apiKey: 're_test', fetchImpl: async (url, init) => { req = { url, init }; return new Response('{}', { status: 200 }) }, log: { warn() {}, error() {} } })
    expect((await m.sendTemplate('verify', 'az', 'a@x.az', { url: 'https://muslims.cc/x' })).ok).toBe(true)
    expect(req.url).toBe('https://api.resend.com/emails')
    expect(req.init.headers.Authorization).toBe('Bearer re_test')
    const body = JSON.parse(req.init.body)
    expect(body).toMatchObject({ from: 'Muslims.cc <noreply@muslims.cc>', to: ['a@x.az'] })
    expect(body.subject).toMatch(/təsdiqləyin/)
  })
})

describe('Google ID tokeni (SDK-sız yoxlama)', () => {
  const verify = users.createGoogleVerifier({ clientId: GOOGLE_CLIENT, fetchImpl: fakeFetch })
  it('düzgün token qəbul olunur, JWKS keşlənir', async () => {
    const before = jwksFetches
    expect(await verify(googleJwt())).toMatchObject({ sub: 'g-123', email: 'gu@example.com' })
    expect(await verify(googleJwt({ iss: 'accounts.google.com' }))).not.toBeNull()
    expect(jwksFetches - before).toBe(1)
  })
  it('pozuq tokenlər rədd edilir', async () => {
    const t = Math.floor(Date.now() / 1000)
    const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
    expect(await verify(googleJwt({ aud: 'başqa-client' }))).toBeNull()
    expect(await verify(googleJwt({ iss: 'https://evil.example' }))).toBeNull()
    expect(await verify(googleJwt({ exp: t - 3600 }))).toBeNull()
    expect(await verify(googleJwt({ email_verified: false }))).toBeNull()
    expect(await verify(googleJwt({}, { key: other }))).toBeNull()           // imza başqa açarla
    expect(await verify(googleJwt({}, { alg: 'HS256' }))).toBeNull()
    expect(await verify(googleJwt({}, { kid: 'naməlum' }))).toBeNull()
    const [h, , s] = googleJwt().split('.')
    expect(await verify(`${h}.${b64({ iss: 'https://accounts.google.com', aud: GOOGLE_CLIENT, sub: 'x', email: 'x@x.az', email_verified: true, exp: t + 99 })}.${s}`)).toBeNull()
    expect(await verify('a.b')).toBeNull()
    expect(await verify(null)).toBeNull()
  })
})

describe('HTTP', () => {
  let srv, db, store, authStore
  const mail = []
  const ids = {}
  beforeAll(async () => {
    db = openDb(':memory:')
    authStore = auth.createAuthStore(db)
    store = users.createUsersStore(db)
    for (const [k, email] of [['super', 'super@muslims.cc'], ['admin', 'admin@muslims.cc'], ['editor', 'editor@muslims.cc'], ['self', 'me@example.com']]) {
      ids[k] = await authStore.createAdmin(email, ADMIN_PASS)
    }
    store.setAdminRole('super@muslims.cc', 'superadmin')
    store.setAdminRole('editor@muslims.cc', 'editor')
    const allowedOrigins = [ORIGIN, 'https://www.muslims.cc']
    const requireAdmin = auth.createRequireAdmin({ store: authStore, allowedOrigins })
    const app = express()
    app.set('trust proxy', 1)
    app.use('/api', auth.createAuthRouter({ store: authStore, requireAdmin, allowedOrigins, adminRoleOf: store.adminRole }))
    const router = users.createUsersRouter({
      db, store, requireAdmin, allowedOrigins, publicOrigin: ORIGIN, googleClientId: GOOGLE_CLIENT,
      mailer: createMailer({ apiKey: '', onMessage: (m) => mail.push(m) }),
      webauthn: fakeWebauthn, fetchImpl: fakeFetch,
      limits: { loginEmail: 3, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, google: 1000, passkeyOpts: 1000, passkeyFail: 1000, userAction: 1000, resend: 1000 },
    })
    app.use('/api', router)
    app.get('/api/rep-only', router.requireUser('mosque_rep'), (req, res) => res.json({ ok: true, id: req.user.id }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r, name = users.USER_COOKIE) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(name + '=')) || ''
  const register = (email, password = PASS, displayName = 'Ali') => call('/api/auth/register', { body: { email, password, displayName, lang: 'az' } })
  const login = (email, password = PASS, headers = H) => call('/api/auth/login', { body: { email, password }, headers })
  const adminLogin = async (email) => cookieOf(await call('/api/admin/login', { body: { email, password: ADMIN_PASS } }), auth.COOKIE_NAME)
  const lastMail = (kind) => [...mail].reverse().find((m) => m.kind === kind)
  const tokenIn = (m) => /#token=([A-Za-z0-9_-]{43})/.exec(m.text)[1]

  it('register → cookie (bütün bayraqlar) → me → logout', async () => {
    const r = await register('Ali@Example.com')
    expect(r.status).toBe(201)
    const sc = r.headers.getSetCookie().join('\n')
    for (const f of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=2592000']) expect(sc).toContain(f)
    expect(sc).not.toMatch(/Domain=/i)
    const j = await r.json()
    expect(j.user).toMatchObject({ email: 'ali@example.com', emailVerified: false, displayName: 'Ali', role: 'user', hasPassword: true, passkeys: [], providers: [] })
    expect(JSON.stringify(j)).not.toMatch(/scrypt|pass_hash/)
    const cookie = cookieOf(r)
    const me = await call('/api/auth/me', { method: 'GET', cookie, headers: {} })
    expect(me.status).toBe(200)
    expect(me.headers.get('cache-control')).toBe('no-store')
    expect(await me.json()).toEqual({ id: j.user.id, email: 'ali@example.com', emailVerified: false, displayName: 'Ali', role: 'user', mosqueId: null, hasPassword: true, passkeys: [], providers: [] })
    // DB-də token açıq saxlanmır
    const row = db.raw.prepare('SELECT id_hash, ua FROM user_sessions').get()
    expect(row.id_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(cookie).not.toContain(row.id_hash)
    const out = await call('/api/auth/logout', { cookie })
    expect(out.headers.getSetCookie().join()).toContain('Max-Age=0')
    expect((await call('/api/auth/me', { method: 'GET', cookie, headers: {} })).status).toBe(401)
  })

  it('verify: məktubdakı token e-poçtu təsdiqləyir, təkrar istifadə olunmur', async () => {
    const m = lastMail('verify')
    expect(m.to).toBe('ali@example.com')
    expect(m.text).toContain('https://muslims.cc/account/verify#token=')
    const token = tokenIn(m)
    expect((await call('/api/auth/verify', { body: { token } })).status).toBe(200)
    expect((await call('/api/auth/verify', { body: { token } })).status).toBe(400)
    expect(store.findByEmail('ali@example.com').email_verified).toBe(1)
  })

  it('register: zəif şifrə 400; mövcud e-poçt hesabı açmır (202 + sahibinə məktub, cookie yox)', async () => {
    expect(await (await register('new@example.com', 'password123')).json()).toMatchObject({ code: 'weak_password' })
    const before = mail.length
    const r = await register('ALI@example.com', 'tamam-başqa-şifrə-1')
    expect(r.status).toBe(202)
    expect(await r.json()).toEqual({ ok: true, checkEmail: true })
    expect(cookieOf(r)).toBe('')
    expect(mail.length).toBe(before + 1)
    expect(lastMail('exists').to).toBe('ali@example.com')
  })

  it('login: düzgün / səhv şifrə / naməlum e-poçt eyni cavab', async () => {
    const ok = await login('ali@example.com')
    expect(ok.status).toBe(200)
    expect(cookieOf(ok)).toMatch(/^__Host-mcc_user=[A-Za-z0-9_-]{43}$/)
    const a = await login('ali@example.com', 'səhv-şifrə-xxxxxx')
    const b = await login('yoxdur@example.com', 'səhv-şifrə-xxxxxx')
    expect(a.status).toBe(401)
    expect(b.status).toBe(401)
    expect(await a.json()).toEqual(await b.json())
  })

  it('rate-limit: e-poçt üzrə 3 uğursuz cəhddən sonra 429 (düzgün şifrə ilə də)', async () => {
    await register('limit@example.com')
    for (let i = 0; i < 3; i++) expect((await login('limit@example.com', 'səhv-şifrə-xxxxxx')).status).toBe(401)
    const r = await login('limit@example.com')
    expect(r.status).toBe(429)
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0)
  })

  it('CSRF: X-Requested-With yoxdursa və ya yad Origin — 403', async () => {
    const cookie = cookieOf(await login('ali@example.com'))
    expect((await login('ali@example.com', PASS, { 'content-type': 'application/json' })).status).toBe(403)
    expect((await login('ali@example.com', PASS, { ...H, origin: 'https://evil.example' })).status).toBe(403)
    expect((await call('/api/auth/logout', { cookie, headers: {} })).status).toBe(403)
    expect((await call('/api/auth/profile', { method: 'PATCH', cookie, body: { displayName: 'X' }, headers: { ...H, origin: 'https://evil.example' } })).status).toBe(403)
    const ok = await call('/api/auth/profile', { method: 'PATCH', cookie, body: { displayName: '  Əli‮ ' }, headers: { ...H, origin: 'https://www.muslims.cc' } })
    expect(await ok.json()).toMatchObject({ displayName: 'Əli' })
    expect((await call('/api/auth/me', { method: 'GET', cookie, headers: { origin: 'https://evil.example' } })).status).toBe(200)   // GET — dəyişiklik yoxdur
  })

  it('forgot həmişə 200; reset şifrəni dəyişir və BÜTÜN sessiyaları ləğv edir', async () => {
    const c1 = cookieOf(await login('ali@example.com'))
    const before = mail.length
    expect((await call('/api/auth/forgot', { body: { email: 'yoxdur@example.com' } })).status).toBe(200)
    expect(mail.length).toBe(before)
    const r = await call('/api/auth/forgot', { body: { email: 'ALI@example.com', lang: 'en' } })
    expect(await r.json()).toEqual({ ok: true })
    const m = lastMail('reset')
    expect(m.subject).toMatch(/Reset/)
    const token = tokenIn(m)
    expect((await call('/api/auth/reset', { body: { token, password: 'password1234' } })).status).toBe(400)   // zəif — token yanmır
    expect((await call('/api/auth/reset', { body: { token: 'x'.repeat(43), password: 'yeni-şifrə-bərpa-77' } })).status).toBe(400)
    expect((await call('/api/auth/reset', { body: { token, password: 'yeni-şifrə-bərpa-77' } })).status).toBe(200)
    expect((await call('/api/auth/reset', { body: { token, password: 'yeni-şifrə-bərpa-78' } })).status).toBe(400)  // birdəfəlik
    expect((await call('/api/auth/me', { method: 'GET', cookie: c1, headers: {} })).status).toBe(401)
    expect((await login('ali@example.com')).status).toBe(401)
    expect((await login('ali@example.com', 'yeni-şifrə-bərpa-77')).status).toBe(200)
  })

  it('şifrə dəyişmə: cari şifrə lazımdır; digər sessiyalar ləğv olunur, cari qalır', async () => {
    const c1 = cookieOf(await login('ali@example.com', 'yeni-şifrə-bərpa-77'))
    const c2 = cookieOf(await login('ali@example.com', 'yeni-şifrə-bərpa-77'))
    expect(await (await call('/api/auth/password', { cookie: c1, body: { current: 'səhv-şifrə-xxx', next: PASS } })).json()).toMatchObject({ code: 'wrong_password' })
    expect((await call('/api/auth/password', { cookie: c1, body: { current: 'yeni-şifrə-bərpa-77', next: PASS } })).status).toBe(200)
    expect((await call('/api/auth/me', { method: 'GET', cookie: c1, headers: {} })).status).toBe(200)
    expect((await call('/api/auth/me', { method: 'GET', cookie: c2, headers: {} })).status).toBe(401)
  })

  it('sessiyalar: siyahı (kobud etiket, IP yox) və ləğv', async () => {
    const ua = { ...H, 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36' }
    const c1 = cookieOf(await login('ali@example.com', PASS, ua))
    const c2 = cookieOf(await login('ali@example.com', PASS, ua))
    const list = await (await call('/api/auth/sessions', { method: 'GET', cookie: c1, headers: {} })).json()
    expect(list.sessions.length).toBeGreaterThanOrEqual(2)
    const cur = list.sessions.find((s) => s.current)
    expect(cur.label).toBe('Chrome · Windows')
    expect(Object.keys(cur).sort()).toEqual(['createdAt', 'current', 'id', 'label', 'lastSeenAt'])
    const other = list.sessions.find((s) => !s.current)
    expect((await call('/api/auth/sessions/revoke', { cookie: c1, body: { id: other.id } })).status).toBe(200)
    expect((await call('/api/auth/sessions/revoke', { cookie: c1, body: { all: true } })).status).toBe(200)
    expect((await call('/api/auth/me', { method: 'GET', cookie: c2, headers: {} })).status).toBe(401)
    expect((await call('/api/auth/me', { method: 'GET', cookie: c1, headers: {} })).status).toBe(200)
  })

  it('requireUser(minRole): rol çatmırsa 403, girişsiz 401', async () => {
    const cookie = cookieOf(await login('ali@example.com'))
    expect((await call('/api/rep-only', { method: 'GET', cookie, headers: {} })).status).toBe(403)
    expect((await call('/api/rep-only', { method: 'GET', headers: {} })).status).toBe(401)
    expect(() => users.createRequireUser({ store })('root')).toThrow()
  })

  it('admin: rol qaydaları HTTP-də (admin ≠ admin/superadmin verə bilməz, superadmin HTTP ilə heç vaxt, öz rolu yox) + audit', async () => {
    const target = store.findByEmail('ali@example.com')
    const self = store.byId(store.createUser({ email: 'me@example.com', passHash: null }))
    const sa = await adminLogin('super@muslims.cc')
    const ad = await adminLogin('admin@muslims.cc')
    const ed = await adminLogin('editor@muslims.cc')
    const me = await adminLogin('me@example.com')
    const setRole = (cookie, id, body) => call(`/api/admin/users/${id}/role`, { cookie, body })

    expect(await (await call('/api/admin/me', { method: 'GET', cookie: sa, headers: {} })).json()).toMatchObject({ role: 'superadmin' })
    expect(await (await call('/api/admin/me', { method: 'GET', cookie: ad, headers: {} })).json()).toMatchObject({ role: 'admin' })

    const list = await (await call('/api/admin/users?q=ali', { method: 'GET', cookie: ad, headers: {} })).json()
    expect(list.users.map((u) => u.email)).toContain('ali@example.com')
    expect(JSON.stringify(list)).not.toMatch(/scrypt|pass/)
    expect((await call('/api/admin/users', { method: 'GET', cookie: ed, headers: {} })).status).toBe(403)   // editor
    expect((await call('/api/admin/users', { method: 'GET', headers: {} })).status).toBe(401)

    expect(await (await setRole(ad, target.id, { role: 'admin' })).json()).toMatchObject({ code: 'superadmin_required' })
    expect(await (await setRole(ad, target.id, { role: 'superadmin' })).json()).toMatchObject({ code: 'script_only' })
    expect(await (await setRole(sa, target.id, { role: 'superadmin' })).json()).toMatchObject({ code: 'script_only' })
    expect(await (await setRole(ed, target.id, { role: 'mosque_rep' })).json()).toMatchObject({ code: 'forbidden' })
    expect(await (await setRole(me, self.id, { role: 'editor' })).json()).toMatchObject({ code: 'self' })
    expect((await setRole(ad, target.id, { role: 'mosque_rep', mosqueId: 'bad id!' })).status).toBe(400)
    expect((await call(`/api/admin/users/${target.id}/role`, { cookie: ad, body: { role: 'editor' }, headers: { 'content-type': 'application/json' } })).status).toBe(403)  // CSRF

    expect(await (await setRole(ad, target.id, { role: 'mosque_rep', mosqueId: 'baku-taza-pir' })).json()).toMatchObject({ ok: true, user: { role: 'mosque_rep', mosqueId: 'baku-taza-pir' } })
    const uc = cookieOf(await login('ali@example.com'))
    expect((await call('/api/rep-only', { method: 'GET', cookie: uc, headers: {} })).status).toBe(200)   // rol dərhal təsir edir
    expect(await (await setRole(sa, target.id, { role: 'admin' })).json()).toMatchObject({ ok: true, user: { role: 'admin', mosqueId: null } })
    expect(await (await setRole(ad, target.id, { role: 'user' })).json()).toMatchObject({ code: 'superadmin_required' })   // admin-i yalnız superadmin alır
    expect(await (await setRole(sa, target.id, { role: 'user' })).json()).toMatchObject({ ok: true })

    const audit = await (await call('/api/admin/role-audit', { method: 'GET', cookie: sa, headers: {} })).json()
    const mine = audit.entries.filter((e) => e.targetKind === 'user' && e.targetId === target.id)
    expect(mine.map((e) => [e.oldRole, e.newRole, e.actorEmail])).toEqual([
      ['admin', 'user', 'super@muslims.cc'], ['mosque_rep', 'admin', 'super@muslims.cc'], ['user', 'mosque_rep', 'admin@muslims.cc'],
    ])
    expect(audit.entries.some((e) => e.actorKind === 'script' && e.targetKind === 'admin' && e.newRole === 'superadmin')).toBe(true)
  })

  it('bloklanmış istifadəçi daxil ola bilmir, sessiyaları ləğv olunur', async () => {
    await register('blok@example.com')
    const uc = cookieOf(await login('blok@example.com'))
    const u = store.findByEmail('blok@example.com')
    const ad = await adminLogin('admin@muslims.cc')
    const r = await call(`/api/admin/users/${u.id}/disable`, { cookie: ad, body: { disabled: true } })
    expect(await r.json()).toMatchObject({ ok: true, user: { disabled: true } })
    expect((await call('/api/auth/me', { method: 'GET', cookie: uc, headers: {} })).status).toBe(401)
    const bad = await login('blok@example.com')
    expect(bad.status).toBe(401)
    expect(await bad.json()).toMatchObject({ code: 'invalid_credentials' })   // "bloklanıb" demir
    await call(`/api/admin/users/${u.id}/disable`, { cookie: ad, body: { disabled: false } })
    expect((await login('blok@example.com')).status).toBe(200)
  })

  it('Google: yeni hesab, təkrar giriş, təsdiqsiz hesaba avtomatik bağlanmır, təsdiqliyə bağlanır', async () => {
    const g = (credential) => call('/api/auth/google', { body: { credential } })
    const r1 = await g(googleJwt())
    expect(r1.status).toBe(201)
    expect(await r1.json()).toMatchObject({ created: true, user: { email: 'gu@example.com', emailVerified: true, hasPassword: false, providers: ['google'] } })
    const r2 = await g(googleJwt())
    expect(r2.status).toBe(200)
    expect((await g(googleJwt({ aud: 'x' }))).status).toBe(401)

    await register('pre@example.com')   // təsdiqsiz (kimsə qabaqcadan açıb ola bilər)
    const r3 = await g(googleJwt({ sub: 'g-pre', email: 'pre@example.com' }))
    expect(r3.status).toBe(409)
    expect(await r3.json()).toMatchObject({ code: 'link_requires_verification' })

    const ali = store.findByEmail('ali@example.com')   // təsdiqlidir
    const r4 = await g(googleJwt({ sub: 'g-ali', email: 'ali@example.com' }))
    expect(await r4.json()).toMatchObject({ created: false, user: { id: ali.id, providers: ['google'] } })
  })

  it('Google: GOOGLE_CLIENT_ID yoxdursa 503 google_disabled', async () => {
    const app = express()
    app.use('/api', users.createUsersRouter({ db, store, allowedOrigins: [ORIGIN], webauthn: fakeWebauthn }))
    const s2 = await listen(app)
    const r = await fetch(s2.url + '/api/auth/google', { method: 'POST', headers: H, body: '{"credential":"x"}' })
    expect(r.status).toBe(503)
    expect(await r.json()).toMatchObject({ code: 'google_disabled' })
    await s2.close()
  })

  it('passkey: options forması, qeydiyyat, usernameless giriş, silmə qaydası', async () => {
    const gu = cookieOf(await call('/api/auth/google', { body: { credential: googleJwt() } }))
    const o = await (await call('/api/auth/passkey/register/options', { cookie: gu })).json()
    expect(o.challengeId).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(o.options).toMatchObject({ rp: { id: 'muslims.cc', name: 'Muslims.cc' }, user: { name: 'gu@example.com' }, authenticatorSelection: { residentKey: 'required', userVerification: 'required' }, attestation: 'none' })
    expect((await call('/api/auth/passkey/register/options', { headers: H })).status).toBe(401)
    const cred = (id, challenge, extra = {}) => ({ id, rawId: id, type: 'public-key', response: { clientDataJSON: 'ok-' + challenge, ...extra } })

    // səhv challenge → rədd; challenge birdəfəlikdir
    expect((await call('/api/auth/passkey/register/verify', { cookie: gu, body: { challengeId: o.challengeId, response: cred('cred1', 'yanlış') } })).status).toBe(400)
    expect((await call('/api/auth/passkey/register/verify', { cookie: gu, body: { challengeId: o.challengeId, response: cred('cred1', o.options.challenge) } })).status).toBe(400)
    const o2 = await (await call('/api/auth/passkey/register/options', { cookie: gu })).json()
    const v = await call('/api/auth/passkey/register/verify', { cookie: gu, body: { challengeId: o2.challengeId, response: cred('cred1', o2.options.challenge), name: 'Telefon' } })
    expect(await v.json()).toMatchObject({ ok: true, passkeys: [{ id: 'cred1', name: 'Telefon' }] })
    const regCall = calls.filter((c) => c[0] === 'regVerify').at(-1)[1]
    expect(regCall).toMatchObject({ expectedRPID: 'muslims.cc', requireUserVerification: true })
    expect(regCall.expectedOrigin).toEqual(['https://muslims.cc', 'https://www.muslims.cc'])

    // usernameless giriş
    const a = await (await call('/api/auth/passkey/login/options', { headers: H })).json()
    expect(a.options.allowCredentials).toEqual([])
    const u = store.findByEmail('gu@example.com')
    const handle = Buffer.from(users.userHandle(u.id)).toString('base64url')
    expect((await call('/api/auth/passkey/login/verify', { body: { challengeId: a.challengeId, response: cred('cred1', a.options.challenge, { userHandle: 'yanlış' }) } })).status).toBe(401)
    const a2 = await (await call('/api/auth/passkey/login/options', { headers: H })).json()
    const lv = await call('/api/auth/passkey/login/verify', { body: { challengeId: a2.challengeId, response: cred('cred1', a2.options.challenge, { userHandle: handle }) } })
    expect(lv.status).toBe(200)
    expect(cookieOf(lv)).toMatch(/^__Host-mcc_user=/)
    expect(store.getPasskey('cred1').counter).toBe(1)
    const a3 = await (await call('/api/auth/passkey/login/options', { headers: H })).json()
    expect((await call('/api/auth/passkey/login/verify', { body: { challengeId: a3.challengeId, response: cred('naməlum', a3.options.challenge) } })).status).toBe(401)
    expect((await call('/api/auth/passkey/login/verify', { body: { challengeId: a2.challengeId, response: cred('cred1', a2.options.challenge) } })).status).toBe(401)   // təkrar

    // Google bağlıdır → son passkey silinə bilər
    expect((await call('/api/auth/passkey/remove', { cookie: gu, body: { id: 'cred1' } })).status).toBe(200)
  })

  it('passkey: yeganə giriş yolu olan passkey silinmir', async () => {
    const id = store.createUser({ email: 'pk@example.com' })
    store.addPasskey({ id: 'only1', userId: id, publicKey: new Uint8Array([1, 2, 3]) })
    const a = await (await call('/api/auth/passkey/login/options', { headers: H })).json()
    const lv = await call('/api/auth/passkey/login/verify', { body: { challengeId: a.challengeId, response: { id: 'only1', type: 'public-key', response: { clientDataJSON: 'ok-' + a.options.challenge } } } })
    const c = cookieOf(lv)
    expect(await (await call('/api/auth/passkey/remove', { cookie: c, body: { id: 'only1' } })).json()).toMatchObject({ code: 'last_method' })
    expect((await call('/api/auth/passkey/remove', { cookie: c, body: { id: 'cred-başqasının' } })).status).toBe(404)
  })

  it('hesabı silmə: şifrə tələb olunur, hər şey CASCADE ilə silinir', async () => {
    await register('sil@example.com')
    const c = cookieOf(await login('sil@example.com'))
    const u = store.findByEmail('sil@example.com')
    store.addPasskey({ id: 'sil-pk', userId: u.id, publicKey: new Uint8Array([1]) })
    store.linkOauth('google', 'g-sil', u.id)
    store.createToken(u.id, 'reset')
    expect(await (await call('/api/auth/delete', { cookie: c, body: { password: 'səhv-şifrə-xxx' } })).json()).toMatchObject({ code: 'wrong_password' })
    const r = await call('/api/auth/delete', { cookie: c, body: { password: PASS } })
    expect(r.status).toBe(200)
    expect(r.headers.getSetCookie().join()).toContain('Max-Age=0')
    for (const t of ['users WHERE id', 'user_sessions WHERE user_id', 'user_passkeys WHERE user_id', 'user_oauth WHERE user_id', 'user_tokens WHERE user_id']) {
      expect(db.raw.prepare(`SELECT COUNT(*) AS n FROM ${t} = ?`).get(u.id).n, t).toBe(0)
    }
    expect((await call('/api/auth/me', { method: 'GET', cookie: c, headers: {} })).status).toBe(401)
    // şifrəsiz hesab: confirm: 'DELETE'
    const gc = cookieOf(await call('/api/auth/google', { body: { credential: googleJwt({ sub: 'g-del', email: 'gdel@example.com' }) } }))
    expect(await (await call('/api/auth/delete', { cookie: gc, body: {} })).json()).toMatchObject({ code: 'confirm_required' })
    expect((await call('/api/auth/delete', { cookie: gc, body: { confirm: 'DELETE' } })).status).toBe(200)
    expect(store.findByEmail('gdel@example.com')).toBeNull()
  })
})

describe('sxem', () => {
  it('cədvəllər miqrasiyasız yaradılır: user_version dəyişmir, təkrar çağırış təhlükəsizdir', () => {
    const { SCHEMA_VERSION } = require('../../server/db.js')
    const db = openDb(':memory:')
    users.createUsersStore(db)
    users.createUsersStore(db)
    expect(db.raw.prepare('PRAGMA user_version').get().user_version).toBe(SCHEMA_VERSION)
    const names = db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name)
    for (const t of ['users', 'user_sessions', 'user_passkeys', 'user_oauth', 'user_tokens', 'role_audit', 'admin_roles']) expect(names).toContain(t)
  })
  it('sessiya 30 gün, sürüşən: gündə bir uzadılır', () => {
    const db = openDb(':memory:')
    const s = users.createUsersStore(db)
    const id = s.createUser({ email: 'x@example.com' }, 0)
    const tok = s.createSession(id, '', 0)
    expect(s.sessionUser(tok, 1000).renewed).toBe(false)
    const day2 = 25 * 3600e3
    expect(s.sessionUser(tok, day2).renewed).toBe(true)
    expect(s.sessionUser(tok, day2 + users.SESSION_TTL_MS - 1)).not.toBeNull()   // uzadılıb (yoxsa 30 gündə bitərdi)
    const idle = s.createSession(id, '', 0)
    expect(s.sessionUser(idle, users.SESSION_TTL_MS + 1)).toBeNull()             // 30 gün toxunulmayan — bitir
  })
})

// Həqiqi @simplewebauthn/server (server/node_modules-da varsa) — options formasını yoxla.
// CI-nın "checks" işi yalnız kök npm ci edir, server asılılıqları orada yoxdur → keçilir.
let realWebauthn = null
try { realWebauthn = require('../../server/node_modules/@simplewebauthn/server') } catch { /* yoxdur */ }
describe.skipIf(!realWebauthn)('passkey: həqiqi kitabxana ilə options', () => {
  it('registration/authentication options standart formadadır', async () => {
    const db = openDb(':memory:')
    const store = users.createUsersStore(db)
    const app = express()
    const router = users.createUsersRouter({ db, store, allowedOrigins: [ORIGIN], webauthn: realWebauthn })
    app.use('/api', router)
    const s = await listen(app)
    const id = store.createUser({ email: 'real@example.com', displayName: 'R' })
    const tok = store.createSession(id)
    const cookie = `${users.USER_COOKIE}=${tok}`
    const r = await (await fetch(s.url + '/api/auth/passkey/register/options', { method: 'POST', headers: { ...H, cookie } })).json()
    expect(r.options.rp).toEqual({ id: 'muslims.cc', name: 'Muslims.cc' })
    expect(r.options.challenge).toMatch(/^[A-Za-z0-9_-]{20,}$/)
    expect(r.options.user.id).toBe(Buffer.from(users.userHandle(id)).toString('base64url'))
    expect(r.options.authenticatorSelection).toMatchObject({ residentKey: 'required', userVerification: 'required' })
    const a = await (await fetch(s.url + '/api/auth/passkey/login/options', { method: 'POST', headers: H })).json()
    expect(a.options).toMatchObject({ rpId: 'muslims.cc', userVerification: 'required' })
    // Saxta cavab həqiqi yoxlamadan keçmir
    const v = await fetch(s.url + '/api/auth/passkey/login/verify', { method: 'POST', headers: H,
      body: JSON.stringify({ challengeId: a.challengeId, response: { id: 'abc', rawId: 'abc', type: 'public-key', response: { clientDataJSON: 'x', authenticatorData: 'x', signature: 'x' } } }) })
    expect(v.status).toBe(401)
    await s.close()
  })
})
