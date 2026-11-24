// Server: server.js-in özündə olan marşrutlar və ümumi sərtləşdirmə — əsl `node server/server.js` prosesi
// müvəqqəti bazada (server.js import olunanda dinləməyə başlayır, ona görə ayrıca prosesdə işlədilir).
//   • X-Powered-By yoxdur; pis JSON → 400 JSON (stack / fayl yolu YOX)
//   • NODE_ENV=production: localhost origin-ə CORS icazəsi yoxdur, CSRF-də də localhost qəbul olunmur
//   • /api/health sirr göstərmir; admin push marşrutları sessiyasız 401, CSRF-siz 403, 6-cı çağırış 429
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import { require } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FAKE_KEY = 'test-only-openrouter-key-not-real'
const XRW = { 'x-requested-with': 'fetch' }

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer()
  s.once('error', reject)
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)) })
})

let proc, base, dir, adminCookie
const logs = []

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-inline-'))
  const dbPath = path.join(dir, 'test.db')
  // Admin paneli hesabı + sessiya — server başlamazdan ƏVVƏL eyni bazada
  const db = openDb(dbPath)
  const store = auth.createAuthStore(db)
  const adminId = await store.createAdmin('inline-admin@example.com', 'inline-admin-şifrəsi-2026')
  adminCookie = `${auth.COOKIE_NAME}=${store.createSession(adminId)}`
  db.close()

  const port = await freePort()
  base = `http://127.0.0.1:${port}`
  // Minimal mühit: real açarlar (VAPID, RESEND, …) uşaq prosesə ötürülmür
  // LINGER_MS=0: SIGTERM-dən sonra 4 san gözləmə (kəsintisiz deploy üçün) testdə lazım deyil
  // ADMIN_LEGACY_LOGIN=1: bu test köhnə admin sessiyası cookie-si ilə işləyir (break-glass; susmaya görə sönülüdür — server-admin-sso.test.js)
  const env = { NODE_ENV: 'production', ADMIN_LEGACY_LOGIN: '1', PORT: String(port), DB_PATH: dbPath, OPENROUTER_KEY: FAKE_KEY, OPENROUTER_API_URL: 'http://127.0.0.1:9/', LINGER_MS: '0' }
  for (const k of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'HOME', 'USERPROFILE']) if (process.env[k]) env[k] = process.env[k]
  proc = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], { cwd: path.join(ROOT, 'server'), env, stdio: ['ignore', 'pipe', 'pipe'] })
  proc.stdout.on('data', (d) => logs.push(String(d)))
  proc.stderr.on('data', (d) => logs.push(String(d)))
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start:\n' + logs.join(''))), 25000)
    const check = () => { if (logs.join('').includes('API running on port')) { clearTimeout(t); resolve() } }
    proc.stdout.on('data', check)
    proc.once('exit', (code) => { clearTimeout(t); reject(new Error(`server exited (${code}):\n` + logs.join(''))) })
  })
}, 30000)

afterAll(async () => {
  if (proc && proc.exitCode === null) {
    await new Promise((r) => { proc.once('exit', r); proc.kill() })
  }
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* Windows: fayl hələ açıqdır */ }
})

const req = (p, opts = {}) => fetch(base + p, opts)

describe('server.js sərtləşdirmə', () => {
  it('/api/health: yalnız status; sirr və X-Powered-By yoxdur', async () => {
    const r = await req('/api/health')
    expect(r.status).toBe(200)
    expect(r.headers.get('x-powered-by')).toBe(null)
    const text = await r.text()
    const j = JSON.parse(text)
    expect(Object.keys(j).sort()).toEqual(['db', 'status', 'time'])
    expect(text).not.toContain(FAKE_KEY)
    expect(text).not.toMatch(/OPENROUTER|DB_PATH|test\.db|mcc-inline/i)
  })

  it('pis JSON → 400 JSON, stack və fayl yolu YOX (öz xəta emalçısı olmayan marşrutlarda da)', async () => {
    for (const p of ['/api/auth/login', '/api/ask-ai', '/api/auth/register']) {
      const r = await req(p, { method: 'POST', headers: { 'content-type': 'application/json', ...XRW }, body: '{"email": bad' })
      expect(r.status, p).toBe(400)
      expect(r.headers.get('content-type'), p).toContain('application/json')
      expect(r.headers.get('x-powered-by')).toBe(null)
      const text = await r.text()
      expect(JSON.parse(text), p).toMatchObject({ error: 'bad_request' })
      expect(text, p).not.toMatch(/at |node_modules|server[\\/]|SyntaxError/)
    }
  })

  it('NODE_ENV=production: localhost origin-ə CORS icazəsi yoxdur; icazəli origin əks olunur; CSRF localhost-u qəbul etmir', async () => {
    const local = await req('/api/health', { headers: { origin: 'http://localhost:3000' } })
    expect(local.headers.get('access-control-allow-origin')).toBe(null)
    const loop = await req('/api/health', { headers: { origin: 'http://127.0.0.1:5173' } })
    expect(loop.headers.get('access-control-allow-origin')).toBe(null)
    const ok = await req('/api/health', { headers: { origin: 'https://muslims.cc' } })
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://muslims.cc')
    const csrf = await req('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', ...XRW }, body: JSON.stringify({ email: 'a@b.co', password: 'x' }),
    })
    expect([csrf.status, (await csrf.json()).code]).toEqual([403, 'forbidden'])
  })

  it('admin abunəçi sayı və bildiriş tarixçəsi: sessiyasız 401; admin sessiyası ilə yalnız say (endpoint / açar yox)', async () => {
    for (const p of ['/api/admin/subscribers', '/api/admin/notification-history']) {
      expect((await req(p)).status, p).toBe(401)
      expect((await req(p, { headers: { cookie: '__Host-mcc_user=' + 'x'.repeat(43) } })).status, p).toBe(401)   // sayt hesabı cookie-si admin deyil
    }
    const s = await req('/api/admin/subscribers', { headers: { cookie: adminCookie } })
    expect(s.status).toBe(200)
    const sj = await s.json()
    expect(sj).toMatchObject({ count: 0, webpush: 0 })
    expect(JSON.stringify(sj)).not.toMatch(/endpoint|p256dh|auth/)
    const h = await req('/api/admin/notification-history', { headers: { cookie: adminCookie } })
    expect(await h.json()).toEqual([])
  })

  it('/api/send-notification: sessiyasız 401, CSRF-siz 403, boş gövdə 400; dəqiqədə 5 — 6-cı 429', async () => {
    const send = (headers, body = {}) => req('/api/send-notification', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
    const statuses = []
    statuses.push((await send({ ...XRW })).status)                                   // sessiya yoxdur
    statuses.push((await send({ cookie: adminCookie })).status)                      // X-Requested-With yoxdur
    statuses.push((await send({ cookie: adminCookie, ...XRW, origin: 'https://evil.example' })).status)   // yad origin
    statuses.push((await send({ cookie: adminCookie, ...XRW })).status)              // başlıq/mətn yoxdur
    statuses.push((await send({ cookie: adminCookie, ...XRW }, { title: 'x', body: 'y', url: 'https://evil.example/' })).status)
    statuses.push((await send({ cookie: adminCookie, ...XRW }, { title: 'x', body: 'y' })).status)
    expect(statuses).toEqual([401, 403, 403, 400, 400, 429])
  })
})
