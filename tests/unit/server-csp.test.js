// CSP hesabatları (server/csp.js)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const csp = require('../../server/csp.js')

describe('normalizeReport', () => {
  const n = csp.normalizeReport
  it('köhnə format: direktiv, bloklanan origin+yol (sorğu atılır), səhifə yolu', () => {
    expect(n({ 'csp-report': {
      'document-uri': 'https://muslims.cc/quran/2?x=1', 'effective-directive': 'connect-src',
      'blocked-uri': 'https://evil.example/a/b?token=secret#f', 'source-file': 'https://muslims.cc/assets/x.js?v=2',
    } })).toEqual({ directive: 'connect-src', blocked: 'https://evil.example/a/b', source: 'https://muslims.cc/assets/x.js', sample: '', page: '/quran/2' })
  })
  it('Reporting API formatı; inline; violated-directive ehtiyatı', () => {
    expect(n({ type: 'csp-violation', body: { documentURL: 'https://muslims.cc/', effectiveDirective: 'script-src-elem', blockedURL: 'inline', sample: 'alert(1)' } }))
      .toMatchObject({ directive: 'script-src-elem', blocked: 'inline', sample: 'alert(1)', page: '/' })
    expect(n({ 'csp-report': { 'violated-directive': 'img-src https:', 'blocked-uri': 'data' } })).toMatchObject({ directive: 'img-src', blocked: 'data' })
  })
  it('səs-küy süzülür: genişlənmələr, Cloudflare skripti, /cdn-cgi/; boş/naməlum — null', () => {
    expect(n({ 'csp-report': { 'effective-directive': 'script-src', 'blocked-uri': 'chrome-extension://abc/x.js' } })).toBeNull()
    expect(n({ 'csp-report': { 'effective-directive': 'script-src-elem', 'blocked-uri': 'inline', 'script-sample': '(function(){function c(){var b=a.contentDocument' } })).toBeNull()
    expect(n({ 'csp-report': { 'effective-directive': 'script-src', 'blocked-uri': 'https://muslims.cc/cdn-cgi/challenge-platform/x' } })).toBeNull()
    expect(n({ 'csp-report': {} })).toBeNull()
    expect(n({ type: 'deprecation', body: {} })).toBeNull()
    expect(n(null)).toBeNull()
  })
})

describe('createStore', () => {
  it('eyni pozuntu birləşir; yenisi bir dəfə loga düşür; ən çox olan önə', () => {
    const logs = []
    let t = 1000
    const s = csp.createStore({ log: (m) => logs.push(m), now: () => t })
    const a = { directive: 'img-src', blocked: 'https://x.test/i.png', source: '', sample: '', page: '/a' }
    const b = { directive: 'connect-src', blocked: 'https://api.test/q', source: '', sample: '', page: '/b' }
    s.add(a); t = 2000; s.add(a); s.add(b); s.add(a)
    const snap = s.snapshot()
    expect(snap.total).toBe(4)
    expect(snap.items.map(i => [i.directive, i.count])).toEqual([['img-src', 3], ['connect-src', 1]])
    expect(snap.items[0]).toMatchObject({ pages: ['/a'], first: new Date(1000).toISOString(), last: new Date(2000).toISOString() })
    expect(logs).toHaveLength(2)
  })
})

describe('router', () => {
  let srv
  const store = csp.createStore({ log: () => {} })
  beforeAll(async () => {
    const app = express()
    const requireAdmin = (req, res, next) => (req.headers['x-test-admin'] ? next() : res.status(401).json({ error: 'Unauthorized' }))
    app.use('/api', csp.createCspRouter({ requireAdmin, store }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  it('application/csp-report və reports+json qəbul olunur → 204; admin icmalı', async () => {
    const r1 = await fetch(`${srv.url}/api/csp-report`, { method: 'POST', headers: { 'content-type': 'application/csp-report' },
      body: JSON.stringify({ 'csp-report': { 'effective-directive': 'frame-src', 'blocked-uri': 'https://frames.test/e' } }) })
    expect(r1.status).toBe(204)
    const r2 = await fetch(`${srv.url}/api/csp-report`, { method: 'POST', headers: { 'content-type': 'application/reports+json' },
      body: JSON.stringify([{ type: 'csp-violation', body: { effectiveDirective: 'frame-src', blockedURL: 'https://frames.test/e' } }]) })
    expect(r2.status).toBe(204)
    expect((await fetch(`${srv.url}/api/admin/csp`)).status).toBe(401)
    const snap = await (await fetch(`${srv.url}/api/admin/csp`, { headers: { 'x-test-admin': '1' } })).json()
    expect(snap.items).toEqual([expect.objectContaining({ directive: 'frame-src', blocked: 'https://frames.test/e', count: 2 })])
  })
  it('pozuq gövdə — yenə 204, heç nə saxlanmır', async () => {
    const before = store.snapshot().total
    const r = await fetch(`${srv.url}/api/csp-report`, { method: 'POST', headers: { 'content-type': 'application/csp-report' }, body: '{"x":' })
    expect([204, 400]).toContain(r.status)
    expect(store.snapshot().total).toBe(before)
  })
})
