// Server: "Səhv bildir" (server/feedback.js)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const feedback = require('../../server/feedback.js')

let srv, db
const ADMIN = { 'x-test-admin': '1' }
const JSONH = { 'content-type': 'application/json' }

beforeAll(async () => {
  db = openDb(':memory:')
  const requireAdmin = (req, res, next) => (req.headers['x-test-admin'] ? next() : res.status(401).json({ error: 'Unauthorized' }))
  const app = express()
  app.use('/api', feedback.createFeedbackRouter({ db, requireAdmin }))
  srv = await listen(app)
})
afterAll(() => srv.close())

const call = (method, path, body, headers = {}) => fetch(srv.url + path, {
  method, headers: { ...(body !== undefined ? JSONH : {}), ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
})

describe('validFeedback', () => {
  const v = feedback.validFeedback
  it('yalnız saytın öz yolu və ən azı 5 simvol mətn', () => {
    expect(v({ page: '/hadith', text: 'Mənbə səhvdir' })).toMatchObject({ page: '/hadith', kind: 'other', lang: 'az', status: 'new' })
    expect(v({ page: 'https://evil.example/x', text: 'salam salam' })).toBeNull()
    expect(v({ page: '//evil.example', text: 'salam salam' })).toBeNull()
    expect(v({ page: '/x', text: 'abc' })).toBeNull()
    expect(v(null)).toBeNull()
  })
  it('naməlum növ və dil — susmaya görə; uzun mətn kəsilir', () => {
    const d = v({ page: '/quran/2', text: 'x'.repeat(5000), kind: 'zzz', lang: 'xx' })
    expect(d.kind).toBe('other')
    expect(d.lang).toBe('az')
    expect(d.text.length).toBe(2000)
  })
})

describe('HTTP', () => {
  it('bildiriş yazılır, admin görür, statusu dəyişir və silir; adminsiz 401', async () => {
    const r = await call('POST', '/api/feedback', { page: '/learn/ghusl', ref: '2:222', kind: 'translation', text: 'Tərcümədə söz əskikdir', lang: 'az' })
    expect(r.status).toBe(201)
    expect((await call('GET', '/api/admin/feedback')).status).toBe(401)
    const list = await (await call('GET', '/api/admin/feedback', undefined, ADMIN)).json()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ page: '/learn/ghusl', ref: '2:222', kind: 'translation', status: 'new' })
    expect(list[0]).not.toHaveProperty('ip')
    expect((await call('PATCH', `/api/admin/feedback/${list[0].id}`, { status: 'done' }, ADMIN)).status).toBe(200)
    expect((await call('PATCH', `/api/admin/feedback/${list[0].id}`, { status: 'x' }, ADMIN)).status).toBe(400)
    expect((await call('DELETE', `/api/admin/feedback/${list[0].id}`, undefined, ADMIN)).status).toBe(200)
    expect((await call('DELETE', `/api/admin/feedback/${list[0].id}`, undefined, ADMIN)).status).toBe(404)
  })
  it('yararsız gövdə 400; limit — 10 dəqiqədə 5 bildiriş', async () => {
    expect((await call('POST', '/api/feedback', { page: 'x', text: 'salam' })).status).toBe(400)
    const codes = []
    for (let i = 0; i < 6; i++) codes.push((await call('POST', '/api/feedback', { page: '/', text: `bildiriş ${i}` })).status)
    expect(codes).toContain(429)
  })
})
