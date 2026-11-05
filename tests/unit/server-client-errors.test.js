// Brauzer xətaları (server/clientErrors.js)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const ce = require('../../server/clientErrors.js')

describe('normalizeError', () => {
  const n = ce.normalizeError
  it('yol saxlanır, sorğu atılır, e-poçt/token maskalanır', () => {
    const e = n({ kind: 'error', message: 'x failed for ali@example.com key abcdefghijklmnopqrstuvwxyz123', source: 'https://muslims.cc/assets/a.js?v=1', line: 3, col: 9,
      stack: 'TypeError: x\n    at f (https://muslims.cc/assets/a.js?v=1:3:9)', page: 'https://muslims.cc/quran/2?a=5' })
    expect(e).toMatchObject({ kind: 'error', source: '/assets/a.js', line: 3, col: 9, page: '/quran/2' })
    expect(e.message).toBe('x failed for <email> key <token>')
    expect(e.stack).toContain('at f (/assets/a.js:3:9)')
  })
  it('səs-küy və pozuq — null; naməlum növ → error', () => {
    expect(n({ message: 'Script error.' })).toBeNull()
    expect(n({ message: 'ResizeObserver loop completed with undelivered notifications.' })).toBeNull()
    expect(n({ message: 'boom', source: 'chrome-extension://abc/x.js' })).toBeNull()
    expect(n({})).toBeNull()
    expect(n(null)).toBeNull()
    expect(n({ kind: 'weird', message: 'boom' }).kind).toBe('error')
  })
})

describe('router', () => {
  let srv
  const store = ce.createStore({ log: () => {} })
  beforeAll(async () => {
    const app = express()
    const requireAdmin = (req, res, next) => (req.headers['x-test-admin'] ? next() : res.status(401).json({ error: 'Unauthorized' }))
    app.use('/api', ce.createClientErrorRouter({ requireAdmin, store }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())
  it('text/plain (sendBeacon) və json qəbul olunur; eyni xəta birləşir; admin icmalı qorunur', async () => {
    const body = JSON.stringify({ kind: 'rejection', message: 'Failed to fetch', page: '/prayer' })
    expect((await fetch(`${srv.url}/api/client-error`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body })).status).toBe(204)
    expect((await fetch(`${srv.url}/api/client-error`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'rejection', message: 'Failed to fetch', page: '/quran' }) })).status).toBe(204)
    expect((await fetch(`${srv.url}/api/admin/errors`)).status).toBe(401)
    const snap = await (await fetch(`${srv.url}/api/admin/errors`, { headers: { 'x-test-admin': '1' } })).json()
    expect(snap.items).toEqual([expect.objectContaining({ kind: 'rejection', message: 'Failed to fetch', count: 2, pages: ['/prayer', '/quran'] })])
  })
})
