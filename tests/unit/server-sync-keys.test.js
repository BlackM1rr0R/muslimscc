// Server: hesaba bağlı sinxronizasiyanın açar qabları (server/syncKeys.js) — giriş tələbi, CSRF,
// yoxlama, ölçü həddi, passkey sahibliyi, şifrə yoxlaması, hesab silinəndə blokun da silinməsi,
// passkey silinəndə / şifrə bərpasında qabların təmizlənməsi.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const users = require('../../server/users.js')
const syncKeys = require('../../server/syncKeys.js')
const { createSyncRouter } = require('../../server/sync.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const SYNC_ID = 'a'.repeat(64)
const SALT = 'pbkdf2-sha256$600000$' + 'A'.repeat(22)
const WRAPPED = 'B'.repeat(76)

describe('syncKeys HTTP', () => {
  let srv, db, store, sk
  const mail = []
  beforeAll(async () => {
    db = openDb(':memory:')
    store = users.createUsersStore(db)
    sk = syncKeys.createSyncKeysStore(db)
    const allowedOrigins = [ORIGIN]
    const app = express()
    app.set('trust proxy', 1)
    const router = users.createUsersRouter({
      db, store, allowedOrigins, publicOrigin: ORIGIN,
      mailer: createMailer({ apiKey: '', onMessage: (m) => mail.push(m) }),
      webauthn: {}, googleVerify: async () => null,
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
      hooks: {
        beforeDeleteUser: (id) => sk.deleteUserData(id),
        passkeyRemoved: (uid, credId) => sk.remove(uid, 'prf', credId),
        passwordReset: (uid) => sk.remove(uid, 'password', ''),
      },
    })
    app.use('/api', router)
    app.use('/api', syncKeys.createSyncKeysRouter({
      store: sk, requireUser: router.requireUser,
      passkeyIdsOf: (uid) => store.listPasskeys(uid).map((k) => k.id),
      limits: { writes: 40, passwordFails: 3 },
    }))
    app.use('/api', createSyncRouter({ db }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  const signup = async (email) => {
    const r = await call('/api/auth/register', { body: { email, password: PASS, lang: 'az' } })
    expect(r.status).toBe(201)
    const j = await r.json()
    return { cookie: cookieOf(r), id: j.user.id }
  }

  it('giriş tələb olunur (401), cavab keşlənmir', async () => {
    const r = await call('/api/auth/sync-keys', { method: 'GET', headers: {} })
    expect(r.status).toBe(401)
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect((await call('/api/auth/sync-keys', { method: 'PUT', body: { kind: 'password', salt: SALT, wrapped: WRAPPED } })).status).toBe(401)
    expect((await call('/api/auth/sync-link', { method: 'GET', headers: {} })).status).toBe(401)
  })

  it('CSRF: X-Requested-With yoxdursa və ya yad Origin — 403', async () => {
    const { cookie } = await signup('csrf@example.com')
    const noXrw = await call('/api/auth/sync-keys', { method: 'PUT', cookie, headers: { 'content-type': 'application/json' }, body: { kind: 'password', salt: SALT, wrapped: WRAPPED } })
    expect(noXrw.status).toBe(403)
    const evil = await call('/api/auth/sync-link', { method: 'PUT', cookie, headers: { ...H, origin: 'https://evil.example' }, body: { syncId: SYNC_ID } })
    expect(evil.status).toBe(403)
    expect(sk.list((await (await call('/api/auth/me', { method: 'GET', cookie, headers: {} })).json()).id)).toEqual([])
  })

  it('PUT/GET/DELETE: qab saxlanır, yalnız { salt, wrapped }; dəyər yenilənir', async () => {
    const { cookie, id } = await signup('keys@example.com')
    expect((await call('/api/auth/sync-keys', { method: 'PUT', cookie, body: { kind: 'password', salt: SALT, wrapped: WRAPPED } })).status).toBe(200)
    expect((await call('/api/auth/sync-link', { method: 'PUT', cookie, body: { syncId: SYNC_ID } })).status).toBe(200)
    let j = await (await call('/api/auth/sync-keys', { method: 'GET', cookie, headers: {} })).json()
    expect(j.syncId).toBe(SYNC_ID)
    expect(j.keys).toEqual([{ kind: 'password', credId: '', salt: SALT, wrapped: WRAPPED, createdAt: expect.any(Number) }])
    // Yenidən yazma (şifrə dəyişəndə) — eyni sətir
    await call('/api/auth/sync-keys', { method: 'PUT', cookie, body: { kind: 'password', salt: SALT, wrapped: 'C'.repeat(76) } })
    j = await (await call('/api/auth/sync-keys', { method: 'GET', cookie, headers: {} })).json()
    expect(j.keys).toHaveLength(1)
    expect(j.keys[0].wrapped).toBe('C'.repeat(76))
    expect((await (await call('/api/auth/sync-link', { method: 'GET', cookie, headers: {} })).json()).syncId).toBe(SYNC_ID)
    const del = await call('/api/auth/sync-keys/password', { method: 'DELETE', cookie })
    expect(await del.json()).toEqual({ ok: true, removed: 1 })
    expect(sk.list(id)).toEqual([])
  })

  it('yoxlama: növ, format, ölçü həddi, sync id', async () => {
    const { cookie } = await signup('valid@example.com')
    const put = (body) => call('/api/auth/sync-keys', { method: 'PUT', cookie, body })
    expect((await put({ kind: 'magic', salt: SALT, wrapped: WRAPPED })).status).toBe(400)
    expect((await put({ kind: 'password', salt: 'qısa', wrapped: WRAPPED })).status).toBe(400)
    expect((await put({ kind: 'password', salt: SALT, wrapped: 'x' })).status).toBe(400)
    expect((await put({ kind: 'password', salt: SALT, wrapped: 'B'.repeat(513) })).status).toBe(400)
    expect((await put({ kind: 'password', salt: SALT, wrapped: WRAPPED + '+/=' })).status).toBe(400)
    expect((await put({ kind: 'password', credId: 'x', salt: SALT, wrapped: WRAPPED })).status).toBe(400)
    expect((await put({ kind: 'password', salt: SALT, wrapped: 42 })).status).toBe(400)
    // JSON gövdə həddi (4 KB)
    expect((await put({ kind: 'password', salt: SALT, wrapped: 'B'.repeat(5000) })).status).toBe(413)
    const link = (syncId) => call('/api/auth/sync-link', { method: 'PUT', cookie, body: { syncId } })
    expect((await link('A'.repeat(64))).status).toBe(400)
    expect((await link('a'.repeat(63))).status).toBe(400)
    expect((await link(null)).status).toBe(400)
    expect((await call('/api/auth/sync-keys/other', { method: 'DELETE', cookie })).status).toBe(400)
  })

  it('PRF qabı yalnız istifadəçinin ÖZ passkey-i üçün', async () => {
    const a = await signup('prf-a@example.com')
    const b = await signup('prf-b@example.com')
    store.addPasskey({ id: 'credA', userId: a.id, publicKey: new Uint8Array([1]) })
    const salt = 'hkdf-sha256$' + 'Q'.repeat(22)
    const putA = (credId) => call('/api/auth/sync-keys', { method: 'PUT', cookie: a.cookie, body: { kind: 'prf', credId, salt, wrapped: WRAPPED } })
    expect((await putA('credA')).status).toBe(200)
    expect((await putA('credB')).status).toBe(404)                       // naməlum
    expect((await call('/api/auth/sync-keys', { method: 'PUT', cookie: b.cookie, body: { kind: 'prf', credId: 'credA', salt, wrapped: WRAPPED } })).status).toBe(404)   // başqasının
    expect((await putA('')).status).toBe(400)
    // Passkey silinəndə PRF qabı da silinir (qarmaq) — şifrə hələ var, ona görə silmək olar
    store.addPasskey({ id: 'credA2', userId: a.id, publicKey: new Uint8Array([2]) })
    const rm = await call('/api/auth/passkey/remove', { cookie: a.cookie, body: { id: 'credA' } })
    expect(rm.status).toBe(200)
    expect(sk.list(a.id)).toEqual([])
  })

  it('şifrəsiz hesab password qabı yarada bilməz; check-password: düzgün / səhv / limit', async () => {
    const uid = store.createUser({ email: 'nopw@example.com', emailVerified: true })
    const token = store.createSession(uid)
    const cookie = `${users.USER_COOKIE}=${token}`
    expect((await call('/api/auth/sync-keys', { method: 'PUT', cookie, body: { kind: 'password', salt: SALT, wrapped: WRAPPED } })).status).toBe(400)
    expect((await call('/api/auth/sync-keys/check-password', { cookie, body: { password: PASS } })).status).toBe(400)

    const { cookie: c2 } = await signup('check@example.com')
    const check = (password) => call('/api/auth/sync-keys/check-password', { cookie: c2, body: { password } })
    expect((await check(PASS)).status).toBe(200)
    const bad = await check('səhv-şifrə-123456')
    expect(bad.status).toBe(400)
    expect((await bad.json()).code).toBe('wrong_password')
    await check('səhv-şifrə-123456'); await check('səhv-şifrə-123456')
    const lim = await check(PASS)
    expect(lim.status).toBe(429)
    expect(Number(lim.headers.get('retry-after'))).toBeGreaterThan(0)
  })

  it('hesab silinəndə: qablar, bağlantı VƏ şifrəli blok silinir (başqa hesaba bağlı blok qalır)', async () => {
    const { cookie, id } = await signup('del@example.com')
    // Şifrəli blok (server/sync.js)
    const blobId = 'b'.repeat(64)
    expect((await call(`/api/sync/${blobId}`, { method: 'PUT', body: { blob: 'abc_DEF-123', version: 0 } })).status).toBe(200)
    await call('/api/auth/sync-link', { method: 'PUT', cookie, body: { syncId: blobId } })
    await call('/api/auth/sync-keys', { method: 'PUT', cookie, body: { kind: 'password', salt: SALT, wrapped: WRAPPED } })
    // Eyni bloka bağlı ikinci hesab yoxdur → silinir
    const r = await call('/api/auth/delete', { cookie, body: { password: PASS } })
    expect(r.status).toBe(200)
    expect((await call(`/api/sync/${blobId}`, { method: 'GET', headers: {} })).status).toBe(404)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM user_sync_keys WHERE user_id = ?').get(id).n).toBe(0)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM user_sync_link WHERE user_id = ?').get(id).n).toBe(0)

    // İki hesab eyni bloka bağlıdır → birinin silinməsi bloku silmir
    const shared = 'c'.repeat(64)
    await call(`/api/sync/${shared}`, { method: 'PUT', body: { blob: 'xyz', version: 0 } })
    const u1 = await signup('share1@example.com'), u2 = await signup('share2@example.com')
    await call('/api/auth/sync-link', { method: 'PUT', cookie: u1.cookie, body: { syncId: shared } })
    await call('/api/auth/sync-link', { method: 'PUT', cookie: u2.cookie, body: { syncId: shared } })
    await call('/api/auth/delete', { cookie: u1.cookie, body: { password: PASS } })
    expect((await call(`/api/sync/${shared}`, { method: 'GET', headers: {} })).status).toBe(200)
  })

  it('FK CASCADE: users sətri birbaşa silinəndə də qablar gedir', async () => {
    const { cookie, id } = await signup('cascade@example.com')
    await call('/api/auth/sync-keys', { method: 'PUT', cookie, body: { kind: 'password', salt: SALT, wrapped: WRAPPED } })
    await call('/api/auth/sync-link', { method: 'PUT', cookie, body: { syncId: SYNC_ID } })
    store.deleteUser(id)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM user_sync_keys WHERE user_id = ?').get(id).n).toBe(0)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM user_sync_link WHERE user_id = ?').get(id).n).toBe(0)
  })

  it('şifrə bərpasında password qabı silinir (köhnə şifrə ilə açılmır)', async () => {
    const { cookie, id } = await signup('reset@example.com')
    await call('/api/auth/sync-keys', { method: 'PUT', cookie, body: { kind: 'password', salt: SALT, wrapped: WRAPPED } })
    await call('/api/auth/forgot', { body: { email: 'reset@example.com', lang: 'az' } })
    const m = [...mail].reverse().find((x) => x.kind === 'reset')
    const token = /#token=([A-Za-z0-9_-]{43})/.exec(m.text)[1]
    expect((await call('/api/auth/reset', { body: { token, password: 'tamamilə-yeni-şifrə-77' } })).status).toBe(200)
    expect(sk.list(id)).toEqual([])
  })

  it('yazı limiti (istifadəçi üzrə)', async () => {
    const { cookie } = await signup('limit@example.com')
    let last
    for (let i = 0; i < 41; i++) last = await call('/api/auth/sync-link', { method: 'PUT', cookie, body: { syncId: SYNC_ID } })
    expect(last.status).toBe(429)
  })

  it('sxem miqrasiyasızdır: user_version dəyişmir, yenidən yaratmaq təhlükəsizdir', () => {
    const v = db.raw.prepare('PRAGMA user_version').get().user_version
    syncKeys.createSyncKeysStore(db)
    expect(db.raw.prepare('PRAGMA user_version').get().user_version).toBe(v)
    expect(v).toBe(3)
  })
})
