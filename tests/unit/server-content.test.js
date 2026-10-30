// Server: məzmun API-si (server/content.js) — Firestore klientinin əvəzi
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const content = require('../../server/content.js')

let srv, db
const ADMIN = { 'x-test-admin': '1' }
const JSONH = { 'content-type': 'application/json' }

beforeAll(async () => {
  db = openDb(':memory:')
  // Sadə requireAdmin əvəzi — auth ayrıca test olunur (server-auth.test.js)
  const requireAdmin = (req, res, next) => (req.headers['x-test-admin'] ? next() : res.status(401).json({ error: 'Unauthorized' }))
  const app = express()
  app.use('/api', content.createContentRouter({ db, requireAdmin }))
  srv = await listen(app)
})
afterAll(() => srv.close())

const call = (method, path, body, headers = {}) => fetch(srv.url + path, {
  method, headers: { ...(body !== undefined ? JSONH : {}), ...headers },
  body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
})

describe('validateDocData', () => {
  const v = content.validateDocData
  it('obyekt tələb edir', () => {
    for (const bad of [null, [], 'x', 1, true]) expect(v(bad).ok).toBe(false)
    expect(v({}).ok).toBe(true)
  })
  it('server sahələrini (id, createdAt, updatedAt) atır', () => {
    expect(v({ id: 'x', createdAt: 1, updatedAt: 2, a: 1 }).data).toEqual({ a: 1 })
  })
  it('ölçü, dərinlik, prototip çirklənməsi', () => {
    expect(v({ big: 'x'.repeat(content.MAX_DOC_BYTES + 1) }).ok).toBe(false)
    let deep = {}; const root = deep
    for (let i = 0; i < 20; i++) { deep.n = {}; deep = deep.n }
    expect(v(root).ok).toBe(false)
    expect(v(JSON.parse('{"__proto__":{"admin":true}}')).ok).toBe(false)
    expect(v({ a: { constructor: 1 } }).ok).toBe(false)
  })
})

describe('ictimai oxuma', () => {
  it('yalnız icazəli kolleksiyalar', async () => {
    expect((await call('GET', '/api/content/fcm_tokens')).status).toBe(404)
    expect((await call('GET', '/api/content/notification_history')).status).toBe(404)
    expect((await call('GET', '/api/content/admins')).status).toBe(404)
    const r = await call('GET', '/api/content/books')
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual([])
    expect(r.headers.get('cache-control')).toBe('no-cache')
    expect(r.headers.get('etag')).toMatch(/^W\/"/)
  })

  it('singletons — yalnız daily, hero, settings', async () => {
    expect((await call('GET', '/api/singletons/other')).status).toBe(404)
    expect((await call('GET', '/api/singletons/daily')).status).toBe(404)   // hələ yoxdur
  })

  it('yararsız ID → 400', async () => {
    expect((await call('GET', '/api/content/books/' + encodeURIComponent('a b'))).status).toBe(400)
  })
})

describe('admin yazıları', () => {
  it('icazəsiz → 401, gövdə oxunmur', async () => {
    expect((await call('POST', '/api/admin/content/books', { a: 1 })).status).toBe(401)
    expect((await call('PUT', '/api/admin/singletons/hero', { a: 1 })).status).toBe(401)
    expect((await call('DELETE', '/api/admin/content/books/x')).status).toBe(401)
  })

  it('tam CRUD dövrü — Firestore forması { id, ...data }', async () => {
    let r = await call('POST', '/api/admin/content/announcements', { title: { az: 'A' }, active: true, createdAt: 5 }, ADMIN)
    expect(r.status).toBe(201)
    const a = await r.json()
    expect(a.title).toEqual({ az: 'A' })
    expect(a.createdAt).toBeGreaterThan(1e12)          // klientin createdAt-i qəbul edilmir
    await new Promise((res) => setTimeout(res, 5))
    r = await call('POST', '/api/admin/content/announcements', { title: { az: 'B' } }, ADMIN)
    const b = await r.json()

    r = await call('GET', '/api/content/announcements')
    const list = await r.json()
    expect(list.map((x) => x.id)).toEqual([b.id, a.id])  // createdAt desc
    const etag = r.headers.get('etag')
    expect((await call('GET', '/api/content/announcements', undefined, { 'if-none-match': etag })).status).toBe(304)

    r = await call('PATCH', `/api/admin/content/announcements/${a.id}`, { active: false }, ADMIN)
    expect(await r.json()).toMatchObject({ id: a.id, title: { az: 'A' }, active: false, createdAt: a.createdAt })
    // dəyişiklikdən sonra ETag dəyişir
    expect((await call('GET', '/api/content/announcements', undefined, { 'if-none-match': etag })).status).toBe(200)

    r = await call('PUT', `/api/admin/content/announcements/${a.id}`, { title: { az: 'C' } }, ADMIN)
    expect(await r.json()).toMatchObject({ id: a.id, title: { az: 'C' }, createdAt: a.createdAt })
    expect((await (await call('GET', `/api/content/announcements/${a.id}`)).json()).active).toBeUndefined()

    expect((await call('PATCH', '/api/admin/content/announcements/yoxdur', { a: 1 }, ADMIN)).status).toBe(404)
    expect((await call('DELETE', `/api/admin/content/announcements/${a.id}`, undefined, ADMIN)).status).toBe(200)
    expect((await call('DELETE', `/api/admin/content/announcements/${a.id}`, undefined, ADMIN)).status).toBe(404)
    expect((await call('GET', `/api/content/announcements/${a.id}`)).status).toBe(404)
  })

  it('naməlum kolleksiyaya yazmaq olmur', async () => {
    expect((await call('POST', '/api/admin/content/fcm_tokens', { a: 1 }, ADMIN)).status).toBe(404)
  })

  it('pozuq JSON və massiv → 400 (daxili detal yoxdur)', async () => {
    let r = await call('POST', '/api/admin/content/books', '{bad', ADMIN)
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({ error: 'Invalid JSON' })
    r = await call('POST', '/api/admin/content/books', [1, 2], ADMIN)
    expect(r.status).toBe(400)
  })

  it('batch — toplu əlavə, limit', async () => {
    let r = await call('POST', '/api/admin/content/duas/batch', { items: [{ a: 1 }, { a: 2 }, { a: 3 }] }, ADMIN)
    expect(r.status).toBe(201)
    expect((await r.json()).ids).toHaveLength(3)
    r = await call('POST', '/api/admin/content/duas/batch', { items: Array.from({ length: content.MAX_BATCH + 1 }, () => ({})) }, ADMIN)
    expect(r.status).toBe(400)
    r = await call('POST', '/api/admin/content/duas/batch', { items: [{ a: 1 }, []] }, ADMIN)
    expect(r.status).toBe(400)
    expect(db.countDocs('duas')).toBe(3)    // yarımçıq yazı yoxdur
  })

  it('singleton yazılır və oxunur; /version dəyişir', async () => {
    const v0 = await (await call('GET', '/api/content/version')).json()
    const r = await call('PUT', '/api/admin/singletons/settings', { siteName: 'X' }, ADMIN)
    expect(r.status).toBe(200)
    const s = await (await call('GET', '/api/singletons/settings')).json()
    expect(s).toMatchObject({ id: 'settings', siteName: 'X' })
    const v1 = await (await call('GET', '/api/content/version')).json()
    expect(v1.collections.singletons).toBeGreaterThan(0)
    expect(v1.version).toBeGreaterThanOrEqual(v0.version)
  })
})
