// Server: "Məni yoxla" hifz keçidi (server/hifzTest.js) — yaratma girişli + CSRF, token yalnız SHA-256,
// yoxlayan girişsizdir (token gövdədə), 24 saat ömür, bir dəfə göndərmə, işarələrin yoxlanması,
// nəticə götürüləndən 7 gün sonra silinmə, hədd, hesab silinəndə CASCADE.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const users = require('../../server/users.js')
const ht = require('../../server/hifzTest.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
let clock = Date.UTC(2026, 10, 17, 8, 0)

describe('hifz-tests HTTP', () => {
  let srv, db, router
  beforeAll(async () => {
    db = openDb(':memory:')
    const store = users.createUsersStore(db)
    const app = express()
    const ur = users.createUsersRouter({
      db, store, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null,
      mailer: createMailer({ apiKey: '', onMessage: () => {} }),
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
    })
    app.use('/api', ur)
    router = ht.createHifzTestRouter({ db, requireUser: ur.requireUser, allowedOrigins: [ORIGIN], now: () => clock })
    app.use('/api', router)
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  let n = 0
  const signup = async () => {
    const r = await call('/api/auth/register', { body: { email: `hz${++n}@example.com`, password: PASS, displayName: 'Hafiz', lang: 'az' } })
    return { cookie: cookieOf(r), id: (await r.json()).user.id }
  }
  const create = (cookie, body) => call('/api/hifz-tests', { cookie, body: { surah: 67, from: 1, to: 10, name: 'Yusif', ...body } })

  it('yaratma: giriş + CSRF, aralıq yoxlaması, token yalnız həş', async () => {
    expect((await create('', {})).status).toBe(401)
    const { cookie } = await signup()
    expect((await call('/api/hifz-tests', { cookie, headers: { 'content-type': 'application/json' }, body: { surah: 1, from: 1, to: 7 } })).status).toBe(403)
    for (const b of [{ surah: 0 }, { surah: 115 }, { surah: 1, to: 8 }, { from: 5, to: 4 }, { from: 1.5 }, { surah: '1', from: 1, to: '7x' }]) {
      expect((await create(cookie, b)).status).toBe(400)
    }
    const r = await create(cookie, { name: 'Yusif‮' })
    expect(r.status).toBe(201)
    const j = await r.json()
    expect(j.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(j.test).toMatchObject({ surah: 67, from: 1, to: 10, name: 'Yusif', status: 'open', result: null })
    expect(j.test.expiresAt - clock).toBe(ht.TEST_TTL_MS)
    const row = db.raw.prepare('SELECT * FROM hifz_tests WHERE id = ?').get(j.test.id)
    expect(JSON.stringify(row)).not.toContain(j.token)
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('yoxlayan: girişsiz açır, yalnız seçilmiş aralığı və adı görür, bir dəfə göndərir; sahib nəticəni alır', async () => {
    const { cookie } = await signup()
    const { token, test } = await (await create(cookie, { surah: 1, from: 2, to: 7, name: 'Məryəm' })).json()
    expect((await call('/api/hifz-tests/open', { headers: { 'content-type': 'application/json' }, body: { token } })).status).toBe(403)
    expect((await call('/api/hifz-tests/open', { body: { token: 'z'.repeat(43) } })).status).toBe(404)
    const o = await (await call('/api/hifz-tests/open', { body: { token } })).json()
    expect(o).toEqual({ surah: 1, from: 2, to: 7, name: 'Məryəm', expiresAt: test.expiresAt, submitted: false })

    const bad = (marks) => call('/api/hifz-tests/submit', { body: { token, marks } }).then((r) => r.status)
    expect(await bad([{ a: 1, kind: 'mistake' }])).toBe(400)               // aralıqdan kənar
    expect(await bad([{ a: 3, kind: 'wrong' }])).toBe(400)
    expect(await bad([{ a: 3, kind: 'mistake' }, { a: 3, kind: 'hesitation' }])).toBe(400)
    expect(await bad([{ a: 3, kind: 'mistake', words: [0] }])).toBe(400)
    expect(await bad('x')).toBe(400)
    const ok = await call('/api/hifz-tests/submit', { body: { token, marks: [{ a: 5, kind: 'hesitation' }, { a: 3, kind: 'mistake', words: [4, 2, 2] }], note: 'sərbəst mətn qəbul olunmur' } })
    expect(ok.status).toBe(200)
    expect((await call('/api/hifz-tests/submit', { body: { token, marks: [] } })).status).toBe(409)
    expect((await (await call('/api/hifz-tests/open', { body: { token } })).json()).submitted).toBe(true)

    const list = await (await call('/api/hifz-tests', { method: 'GET', cookie, headers: {} })).json()
    const t = list.tests.find((x) => x.id === test.id)
    expect(t.status).toBe('done')
    expect(t.result.marks).toEqual([{ a: 3, kind: 'mistake', words: [2, 4] }, { a: 5, kind: 'hesitation' }])
    expect(JSON.stringify(t)).not.toContain('sərbəst')

    // götürüləndən 7 gün sonra silinir
    clock += ht.RESULT_KEEP_MS - 1000
    router.purge()
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM hifz_tests WHERE id = ?').get(test.id).n).toBe(1)
    clock += 2000
    router.purge()
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM hifz_tests WHERE id = ?').get(test.id).n).toBe(0)
  })

  it('24 saatdan sonra keçid işləmir; cavabsız keçid sonra silinir; sahib silə bilər', async () => {
    const { cookie } = await signup()
    const { token, test } = await (await create(cookie, {})).json()
    clock += ht.TEST_TTL_MS + 1
    expect((await call('/api/hifz-tests/open', { body: { token } })).status).toBe(410)
    expect((await call('/api/hifz-tests/submit', { body: { token, marks: [] } })).status).toBe(410)
    const list = await (await call('/api/hifz-tests', { method: 'GET', cookie, headers: {} })).json()
    expect(list.tests.find((x) => x.id === test.id).status).toBe('expired')
    clock += 24 * 3600e3
    router.purge()
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM hifz_tests WHERE id = ?').get(test.id).n).toBe(0)

    const t2 = (await (await create(cookie, {})).json()).test
    const other = await signup()
    expect((await call(`/api/hifz-tests/${t2.id}`, { method: 'DELETE', cookie: other.cookie })).status).toBe(404)
    expect((await call(`/api/hifz-tests/${t2.id}`, { method: 'DELETE', cookie })).status).toBe(200)
  })

  it('açıq keçid həddi; hesab silinəndə CASCADE', async () => {
    const u = await signup()
    for (let i = 0; i < ht.MAX_OPEN_TESTS; i++) expect((await create(u.cookie, {})).status).toBe(201)
    expect((await create(u.cookie, {})).status).toBe(409)
    expect((await call('/api/auth/delete', { cookie: u.cookie, body: { password: PASS } })).status).toBe(200)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM hifz_tests WHERE user_id = ?').get(u.id).n).toBe(0)
  })

  it('validMarks / validRange saf funksiyaları', () => {
    expect(ht.validRange({ surah: 114, from: 1, to: 6 })).toEqual({ surah: 114, from: 1, to: 6 })
    expect(ht.validRange({ surah: 114, from: 1, to: 7 })).toBe(null)
    const t = { from_ayah: 1, to_ayah: 3 }
    expect(ht.validMarks([], t)).toEqual([])
    expect(ht.validMarks([{ a: 1, kind: 'mistake' }, { a: 2, kind: 'mistake' }, { a: 3, kind: 'mistake' }, { a: 3, kind: 'mistake' }], t)).toBe(null)
  })
})
