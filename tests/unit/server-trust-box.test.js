// Server: "Əmanət qutusu" (server/trustBox.js) — yalnız şifrəli forma, sahiblik (IDOR), keçid (heş), girişsiz açma,
// limit, CSRF, ixrac/xülasə (heş YOX), silmə və hesab silinəndə CASCADE.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startApp, require, H } from './server-together-helpers.js'
import { sealBox, openBox, emptyPayload, newLinkToken, linkHashOf } from '../../src/utils/trustBoxCrypto.js'

const trustBox = require('../../server/trustBox.js')
const security = require('../../server/security.js')
const PASS = 'üç alma ağacı və bir quyu'
const MARK = 'PLAINTEXT-MARKER-7731'
let clock = Date.UTC(2026, 10, 24, 10, 0)
const now = () => clock

describe('əmanət qutusu HTTP', () => {
  let app, sealed, sealed2
  beforeAll(async () => {
    app = await startApp((ex, { db, requireUser }) => {
      const tb = trustBox.createTrustBoxRouter({ db, requireUser, allowedOrigins: ['https://muslims.cc'], now, openLimit: { max: 1000, windowMs: 60000 }, log: { error: () => {} } })
      ex.use('/api', tb)
      const usersStore = require('../../server/users.js').createUsersStore(db)
      const sec = security.createSecurity({ db, totpKey: '', publicOrigin: 'https://muslims.cc', mailer: { sendTemplate: async () => {} }, prefsOf: () => ({}) })
      ex.use('/api', security.createSecurityRouter({ security: sec, usersStore, requireUser, sources: { trustBox: () => tb } }))
      return { tb }
    })
    sealed = await sealBox({ ...emptyPayload(), docs: MARK, from: 'Əli' }, PASS)
    sealed2 = await sealBox({ ...emptyPayload(), words: 'ikinci' }, PASS, { salt: sealed.salt, key: sealed.key })
  }, 20000)
  afterAll(() => app.close())
  const j = (r) => r.json()
  const put = (u, body, headers = H) => app.call('/api/trust-box', { method: 'PUT', cookie: u.cookie, body, headers })

  it('girişsiz → 401; boş qutu → null', async () => {
    expect((await app.get('/api/trust-box')).status).toBe(401)
    const u = await app.signup()
    const r = await app.get('/api/trust-box', u.cookie)
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(await j(r)).toEqual({ box: null, maxBlob: trustBox.MAX_BLOB })
  })

  it('yalnız şifrəli forma: açıq mətn sahəsi, yararsız salt/blob, böyük blok, gövdəsiz sorğu → 4xx', async () => {
    const u = await app.signup()
    let r = await put(u, { ...sealed, key: undefined, will: MARK })
    expect(r.status).toBe(400)
    expect((await j(r)).code).toBe('bad_request')
    r = await put(u, { salt: sealed.salt, blob: Buffer.from(JSON.stringify({ docs: MARK })).toString('base64url') })
    expect((await j(r)).code).toBe('bad_blob')                       // 1-ci bayt versiya deyil
    r = await put(u, { salt: 'pbkdf2-sha256$1000$AAAAAAAAAAAAAAAAAAAAAA', blob: sealed.blob })
    expect((await j(r)).code).toBe('bad_salt')                       // < 600 000 dövr
    r = await put(u, { salt: sealed.salt, blob: 'A'.repeat(trustBox.MAX_BLOB + 1) })
    expect(r.status).toBe(413)
    r = await put(u, { salt: sealed.salt, blob: sealed.blob, linkHash: 'nothex' })
    expect((await j(r)).code).toBe('bad_link')
    r = await put(u, undefined)                                       // gövdə yoxdur
    expect(r.status).toBe(400)
    expect((await j(r)).code).toBe('bad_salt')
    r = await put(u, [1, 2])
    expect((await j(r)).code).toBe('bad_request')
    r = await put(u, { salt: sealed.salt, blob: sealed.blob }, { 'content-type': 'application/json' })   // X-Requested-With yox
    expect(r.status).toBe(403)
  })

  it('server açıq mətni görmür: saxlanan sətir yalnız salt + blob; sahib parol ilə açır', async () => {
    const u = await app.signup()
    const body = { salt: sealed.salt, blob: sealed.blob }
    expect(JSON.stringify(body)).not.toContain(MARK)
    expect(JSON.stringify(body)).not.toContain(PASS)
    const r = await put(u, body)
    expect(r.status).toBe(200)
    const { box } = await j(r)
    expect(box).toMatchObject({ salt: sealed.salt, blob: sealed.blob, hasLink: false, version: 1, lastOpenedAt: null })
    const row = app.db.raw.prepare('SELECT * FROM trust_boxes WHERE user_id = ?').get(u.id)
    expect(Object.keys(row).sort()).toEqual(['blob', 'created_at', 'last_opened_at', 'link_hash', 'salt', 'updated_at', 'user_id', 'version'])
    expect(JSON.stringify(row)).not.toContain(MARK)
    const got = (await j(await app.get('/api/trust-box', u.cookie))).box
    expect((await openBox(got, PASS)).payload.docs).toBe(MARK)
  }, 20000)

  it('ifVersion: köhnə versiya ilə yazma → 409 conflict', async () => {
    const u = await app.signup()
    let r = await put(u, { salt: sealed.salt, blob: sealed.blob, ifVersion: 0 })
    expect((await j(r)).box.version).toBe(1)
    r = await put(u, { salt: sealed.salt, blob: sealed2.blob, ifVersion: 0 })
    expect(r.status).toBe(409)
    expect((await j(r)).code).toBe('conflict')
    r = await put(u, { salt: sealed.salt, blob: sealed2.blob, ifVersion: 1 })
    expect((await j(r)).box).toMatchObject({ version: 2, blob: sealed2.blob })
  })

  it('keçid: yalnız heş saxlanır; girişsiz açma; dəyişdirmə köhnəni öldürür; ləğv; son açılış gün dəqiqliyi', async () => {
    const u = await app.signup()
    const t1 = newLinkToken()
    let r = await put(u, { salt: sealed.salt, blob: sealed.blob, linkHash: await linkHashOf(t1) })
    expect((await j(r)).box.hasLink).toBe(true)
    const row = app.db.raw.prepare('SELECT link_hash FROM trust_boxes WHERE user_id = ?').get(u.id)
    expect(row.link_hash).toBe(await linkHashOf(t1))
    expect(JSON.stringify(row)).not.toContain(t1)

    r = await app.call('/api/trust-box/open', { body: { token: t1 } })
    expect(r.status).toBe(200)
    const opened = await j(r)
    expect(Object.keys(opened).sort()).toEqual(['blob', 'salt', 'updatedAt'])   // sahibin kimliyi YOX
    expect((await openBox(opened, PASS)).payload.from).toBe('Əli')
    expect((await j(await app.get('/api/trust-box', u.cookie))).box.lastOpenedAt).toBe(Date.UTC(2026, 10, 24))

    // CSRF: X-Requested-With olmadan və yad Origin ilə
    expect((await app.call('/api/trust-box/open', { body: { token: t1 }, headers: { 'content-type': 'application/json' } })).status).toBe(403)
    expect((await app.call('/api/trust-box/open', { body: { token: t1 }, headers: { ...H, origin: 'https://evil.example' } })).status).toBe(403)

    // yenidən yazmada linkHash verilməsə keçid qalır
    await put(u, { salt: sealed.salt, blob: sealed2.blob })
    expect((await app.call('/api/trust-box/open', { body: { token: t1 } })).status).toBe(200)

    // dəyişdir → köhnə 404
    const t2 = newLinkToken()
    await put(u, { salt: sealed.salt, blob: sealed2.blob, linkHash: await linkHashOf(t2) })
    expect((await app.call('/api/trust-box/open', { body: { token: t1 } })).status).toBe(404)
    // ləğv (DELETE /link) → 404
    r = await app.call('/api/trust-box/link', { method: 'DELETE', cookie: u.cookie })
    expect((await j(r)).box.hasLink).toBe(false)
    expect((await app.call('/api/trust-box/open', { body: { token: t2 } })).status).toBe(404)
  }, 20000)

  it('IDOR: başqa istifadəçi qutunu görə, silə, keçid heşini götürə bilmir', async () => {
    const a = await app.signup(), b = await app.signup()
    const t = newLinkToken()
    const h = await linkHashOf(t)
    await put(a, { salt: sealed.salt, blob: sealed.blob, linkHash: h })
    expect((await j(await app.get('/api/trust-box', b.cookie))).box).toBeNull()
    // b yalnız ÖZ qutusunu silir — a-nınkı qalır
    await app.call('/api/trust-box', { method: 'DELETE', cookie: b.cookie })
    expect((await j(await app.get('/api/trust-box', a.cookie))).box).not.toBeNull()
    expect((await app.call('/api/trust-box/link', { method: 'DELETE', cookie: b.cookie })).status).toBe(404)
    // b a-nın heşini götürə bilmir
    let r = await put(b, { salt: sealed.salt, blob: sealed2.blob, linkHash: h })
    expect(r.status).toBe(409)
    expect((await j(r)).code).toBe('link_taken')
    // gövdədə userId/id sahəsi qəbul olunmur
    r = await put(b, { salt: sealed.salt, blob: sealed2.blob, userId: a.id })
    expect(r.status).toBe(400)
    // a-nın qutusu dəyişməyib
    const box = (await j(await app.get('/api/trust-box', a.cookie))).box
    expect(box.blob).toBe(sealed.blob)
    expect((await app.call('/api/trust-box/open', { body: { token: t } })).status).toBe(200)
  })

  it('ixrac və xülasə: şifrəli blok var, keçid heşi YOX', async () => {
    const u = await app.signup()
    const t = newLinkToken()
    const h = await linkHashOf(t)
    await put(u, { salt: sealed.salt, blob: sealed.blob, linkHash: h })
    const exp = await j(await app.get('/api/auth/export', u.cookie))
    expect(exp.trustBox.box).toMatchObject({ salt: sealed.salt, blob: sealed.blob, hasLink: true })
    const s = JSON.stringify(exp)
    expect(s).not.toContain(h)
    expect(s).not.toContain(t)
    const sum = await j(await app.get('/api/auth/data-summary', u.cookie))
    expect(sum.trustBox).toEqual({ exists: true, hasLink: true })
  })

  it('silmə: DELETE hər şeyi silir; hesab silinəndə CASCADE; keçid ölür', async () => {
    const u = await app.signup(), v = await app.signup()
    const tu = newLinkToken(), tv = newLinkToken()
    await put(u, { salt: sealed.salt, blob: sealed.blob, linkHash: await linkHashOf(tu) })
    await put(v, { salt: sealed.salt, blob: sealed.blob, linkHash: await linkHashOf(tv) })
    let r = await app.call('/api/trust-box', { method: 'DELETE', cookie: u.cookie })
    expect(await j(r)).toEqual({ ok: true })
    expect((await j(await app.get('/api/trust-box', u.cookie))).box).toBeNull()
    expect((await app.call('/api/trust-box/open', { body: { token: tu } })).status).toBe(404)
    r = await app.del(v)
    expect(r.status).toBe(200)
    expect(app.db.raw.prepare('SELECT COUNT(*) AS n FROM trust_boxes WHERE user_id = ?').get(v.id).n).toBe(0)
    expect((await app.call('/api/trust-box/open', { body: { token: tv } })).status).toBe(404)
  })

  it('açma limiti: IP heşi üzrə → 429 (Retry-After); yararsız token 404', async () => {
    const lim = await startApp((ex, { db, requireUser }) => {
      ex.use('/api', trustBox.createTrustBoxRouter({ db, requireUser, allowedOrigins: [], now, openLimit: { max: 3, windowMs: 60000 } }))
    })
    try {
      for (let i = 0; i < 3; i++) {
        const r = await lim.call('/api/trust-box/open', { body: { token: newLinkToken() } })
        expect(r.status).toBe(404)
      }
      let r = await lim.call('/api/trust-box/open', { body: { token: newLinkToken() } })
      expect(r.status).toBe(429)
      expect(r.headers.get('retry-after')).toBe('60')
      clock += 61000
      r = await lim.call('/api/trust-box/open', { body: { token: 'short' } })
      expect(r.status).toBe(404)
      r = await lim.call('/api/trust-box/open')
      expect(r.status).toBe(404)
    } finally { lim.close() }
  })
})
