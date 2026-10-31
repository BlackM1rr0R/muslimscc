// Server: admin girişi (server/auth.js) — şifrə hash-i, sessiya, rate-limit, CSRF
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')

const PASS = 'düzgün-uzun-şifrə-123'

describe('şifrə hash-i', () => {
  it('scrypt formatı, duz təsadüfidir, doğrulama işləyir', async () => {
    const h1 = await auth.hashPassword(PASS)
    const h2 = await auth.hashPassword(PASS)
    expect(h1).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/)
    expect(h1).not.toBe(h2)
    expect(h1).not.toContain(PASS)
    expect(await auth.verifyPassword(PASS, h1)).toBe(true)
    expect(await auth.verifyPassword(PASS + 'x', h1)).toBe(false)
  })
  it('qısa şifrə rədd edilir; pozuq hash false qaytarır (atmır)', async () => {
    await expect(auth.hashPassword('qisa')).rejects.toThrow()
    for (const bad of ['', 'abc', 'scrypt$1$1$1$a$b', 'bcrypt$x$y$z$a$b', null]) {
      expect(await auth.verifyPassword(PASS, bad)).toBe(false)
    }
  })
})

describe('köməkçilər', () => {
  it('parseCookies', () => {
    expect(auth.parseCookies('a=1; __Host-mcc_admin=tok; b=2')).toEqual({ a: '1', '__Host-mcc_admin': 'tok', b: '2' })
    expect(auth.parseCookies(undefined)).toEqual({})
  })
  it('sessiya cookie-si — bütün təhlükəsizlik bayraqları', () => {
    const c = auth.sessionCookie('T', 100)
    expect(c).toMatch(/^__Host-mcc_admin=T;/)
    for (const f of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age=100']) expect(c).toContain(f)
    expect(c).not.toMatch(/Domain=/i)
  })
  it('CSRF: GET keçir; POST X-Requested-With və icazəli Origin istəyir', () => {
    const allowed = ['https://muslims.cc']
    const r = (method, headers) => auth.csrfRejected({ method, headers }, allowed)
    expect(r('GET', {})).toBe(false)
    expect(r('POST', {})).toBe(true)
    expect(r('POST', { 'x-requested-with': 'fetch' })).toBe(false)
    expect(r('POST', { 'x-requested-with': 'fetch', origin: 'https://muslims.cc' })).toBe(false)
    expect(r('POST', { 'x-requested-with': 'fetch', origin: 'https://evil.example' })).toBe(true)
    expect(r('DELETE', { origin: 'https://muslims.cc' })).toBe(true)
  })
  it('uğursuzluq limiti: pəncərə bitəndə sıfırlanır', () => {
    const l = auth.createFailureLimiter({ max: 2, windowMs: 1000 })
    l.fail('k', 0); expect(l.blocked('k', 10)).toBe(false)
    l.fail('k', 10); expect(l.blocked('k', 20)).toBe(true)
    expect(l.retryAfterSec('k', 20)).toBe(1)
    expect(l.blocked('k', 1001)).toBe(false)
  })
})

describe('sessiya anbarı', () => {
  it('token DB-də açıq saxlanmır; vaxtı keçən sessiya etibarsızdır; şifrə dəyişəndə sessiyalar ləğv olunur', async () => {
    const db = openDb(':memory:')
    const store = auth.createAuthStore(db)
    const id = await store.createAdmin('Admin@Example.com', PASS)
    await expect(store.createAdmin('admin@example.com', PASS)).rejects.toThrow()   // case-insensitive unikal
    const tok = store.createSession(id, 1000)
    expect(tok).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const rows = db.raw.prepare('SELECT id_hash FROM sessions').all()
    expect(rows).toHaveLength(1)
    expect(rows[0].id_hash).not.toContain(tok)
    expect(rows[0].id_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(store.sessionUser(tok, 2000)).toEqual({ id, email: 'admin@example.com', mustChange: false })
    expect(store.sessionUser(tok, 1000 + auth.SESSION_TTL_MS + 1)).toBeNull()
    const tok2 = store.createSession(id)
    expect(store.sessionUser(tok2)).not.toBeNull()
    await store.setPassword('admin@example.com', PASS + '!')
    expect(store.sessionUser(tok2)).toBeNull()
    expect(store.sessionUser('qısa')).toBeNull()
    expect(store.deleteAdmin('ADMIN@example.com')).toBe(true)
  })
})

describe('HTTP: login / me / logout / requireAdmin', () => {
  let srv, store
  const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
  beforeAll(async () => {
    const db = openDb(':memory:')
    store = auth.createAuthStore(db)
    await store.createAdmin('admin@example.com', PASS)
    const legacy = async (t) => (t === 'firebase-admin-token-xxxxxxxx' ? { uid: 'u1', email: 'fb@example.com' }
      : t === 'firebase-user-token-xxxxxxxxx' ? null : Promise.reject(new Error('bad')))
    const allowedOrigins = ['https://muslims.cc']
    const requireAdmin = auth.createRequireAdmin({ store, allowedOrigins, verifyFirebaseToken: legacy })
    const app = express()
    app.use('/api', auth.createAuthRouter({ store, requireAdmin, allowedOrigins, limits: { ipMax: 50, emailMax: 3 } }))
    app.post('/api/admin/thing', requireAdmin, (req, res) => res.json({ via: req.adminUser.via }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const login = (email, password, headers = H) => fetch(srv.url + '/api/admin/login', {
    method: 'POST', headers, body: JSON.stringify({ email, password }),
  })
  const cookieOf = (r) => (r.headers.get('set-cookie') || '').split(';')[0]

  it('uğurlu giriş → cookie; me; CSRF; logout', async () => {
    const r = await login('ADMIN@example.com', PASS)
    expect(r.status).toBe(200)
    const sc = r.headers.get('set-cookie')
    for (const f of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) expect(sc).toContain(f)
    const cookie = cookieOf(r)
    expect(cookie).toMatch(/^__Host-mcc_admin=/)

    let me = await fetch(srv.url + '/api/admin/me', { headers: { cookie } })
    expect(await me.json()).toEqual({ email: 'admin@example.com', via: 'session', mustChangePassword: false })

    // CSRF: başlıqsız və ya yad Origin-li POST rədd
    expect((await fetch(srv.url + '/api/admin/thing', { method: 'POST', headers: { cookie } })).status).toBe(403)
    expect((await fetch(srv.url + '/api/admin/thing', { method: 'POST', headers: { cookie, 'x-requested-with': 'fetch', origin: 'https://evil.example' } })).status).toBe(403)
    const ok = await fetch(srv.url + '/api/admin/thing', { method: 'POST', headers: { cookie, 'x-requested-with': 'fetch', origin: 'https://muslims.cc' } })
    expect(await ok.json()).toEqual({ via: 'session' })

    const out = await fetch(srv.url + '/api/admin/logout', { method: 'POST', headers: { cookie, 'x-requested-with': 'fetch' } })
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0')
    me = await fetch(srv.url + '/api/admin/me', { headers: { cookie } })
    expect(me.status).toBe(401)
  })

  it('login özü də CSRF-dən qorunur; səhv giriş eyni cavabı verir', async () => {
    expect((await login('admin@example.com', PASS, { 'content-type': 'application/json' })).status).toBe(403)
    const a = await login('admin@example.com', 'səhv-şifrə-xxxxxxx')
    const b = await login('yoxdur@example.com', 'səhv-şifrə-xxxxxxx')
    expect(a.status).toBe(401)
    expect(b.status).toBe(401)
    expect(await a.json()).toEqual(await b.json())
  })

  it('rate-limit: e-poçt üzrə 3 uğursuz cəhddən sonra 429 (düzgün şifrə ilə də)', async () => {
    for (let i = 0; i < 3; i++) expect((await login('limit@example.com', 'səhv-şifrə-xxxxxxx')).status).toBe(401)
    const r = await login('limit@example.com', 'səhv-şifrə-xxxxxxx')
    expect(r.status).toBe(429)
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0)
  })

  it('müvəqqəti şifrə: yalnız /me və /password; dəyişəndən sonra panel açılır, digər sessiyalar ləğv olunur', async () => {
    const TEMP = 'müvəqqəti-şifrə-12345'
    const NEW = 'yeni-güclü-şifrə-67890'
    await store.createAdmin('temp@example.com', TEMP, Date.now(), { temporary: true })
    const r1 = await login('temp@example.com', TEMP)
    expect(await r1.json()).toMatchObject({ ok: true, mustChangePassword: true })
    const c1 = cookieOf(r1)
    const c2 = cookieOf(await login('temp@example.com', TEMP))   // ikinci cihaz
    const me = await fetch(srv.url + '/api/admin/me', { headers: { cookie: c1 } })
    expect(await me.json()).toMatchObject({ mustChangePassword: true })
    const thing = await fetch(srv.url + '/api/admin/thing', { method: 'POST', headers: { cookie: c1, 'x-requested-with': 'fetch' } })
    expect(thing.status).toBe(403)
    expect(await thing.json()).toMatchObject({ code: 'must_change' })

    const change = (cookie, body, extra = { 'x-requested-with': 'fetch' }) => fetch(srv.url + '/api/admin/password', {
      method: 'POST', headers: { cookie, 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) })
    expect((await change(c1, { currentPassword: TEMP, newPassword: NEW }, {})).status).toBe(403)        // CSRF başlığı yoxdur
    expect((await change('', { currentPassword: TEMP, newPassword: NEW })).status).toBe(401)            // sessiya yoxdur
    expect(await (await change(c1, { currentPassword: TEMP, newPassword: 'qisa' })).json()).toMatchObject({ code: 'weak' })
    expect(await (await change(c1, { currentPassword: 'səhv-şifrə-xxxxxx', newPassword: NEW })).json()).toMatchObject({ code: 'wrong' })
    expect(await (await change(c1, { currentPassword: TEMP, newPassword: TEMP })).json()).toMatchObject({ code: 'same' })
    const ok = await change(c1, { currentPassword: TEMP, newPassword: NEW })
    expect(ok.status).toBe(200)

    // Cari sessiya qalır və artıq məhdud deyil; ikinci cihazın sessiyası ləğv olunub
    expect((await fetch(srv.url + '/api/admin/thing', { method: 'POST', headers: { cookie: c1, 'x-requested-with': 'fetch' } })).status).toBe(200)
    expect((await fetch(srv.url + '/api/admin/me', { headers: { cookie: c2 } })).status).toBe(401)
    expect((await login('temp@example.com', TEMP)).status).toBe(401)
    expect(await (await login('temp@example.com', NEW)).json()).toMatchObject({ ok: true, mustChangePassword: false })
  })

  it('şifrə dəyişmə köhnə Firebase tokeni ilə olmur', async () => {
    const r = await fetch(srv.url + '/api/admin/password', { method: 'POST',
      headers: { authorization: 'Bearer firebase-admin-token-xxxxxxxx', 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'a'.repeat(12), newPassword: 'b'.repeat(12) }) })
    expect(r.status).toBe(403)
  })

  it('KEÇİD DÖVRÜ: köhnə Firebase ID tokeni (Bearer) qəbul olunur', async () => {
    const post = (t) => fetch(srv.url + '/api/admin/thing', { method: 'POST', headers: { authorization: `Bearer ${t}` } })
    expect(await (await post('firebase-admin-token-xxxxxxxx')).json()).toEqual({ via: 'firebase' })
    expect((await post('firebase-user-token-xxxxxxxxx')).status).toBe(403)   // admin claim-i yoxdur
    expect((await post('invalid-token-xxxxxxxxxxxxxxxx')).status).toBe(401)
    expect((await fetch(srv.url + '/api/admin/thing', { method: 'POST' })).status).toBe(401)
  })
})
