// Server: cihazlar arası sinxronizasiya (server/sync.js) — şifrəli bloklar
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const sync = require('../../server/sync.js')

let srv, db
const ID = 'a'.repeat(64)
const ID2 = 'b'.repeat(64)
const JSONH = { 'content-type': 'application/json' }

beforeAll(async () => {
  db = openDb(':memory:')
  const app = express()
  app.use('/api', sync.createSyncRouter({ db }))
  srv = await listen(app)
})
afterAll(() => srv.close())

const call = (method, path, body) => fetch(srv.url + path, {
  method, headers: body !== undefined ? JSONH : {}, body: body === undefined ? undefined : JSON.stringify(body),
})

describe('sync API', () => {
  it('yoxdursa 404; yaradılır (versiya 1); oxunur', async () => {
    expect((await call('GET', `/api/sync/${ID}`)).status).toBe(404)
    const put = await call('PUT', `/api/sync/${ID}`, { blob: 'AAAA_-bb', version: 0 })
    expect(put.status).toBe(200)
    expect((await put.json()).version).toBe(1)
    const get = await call('GET', `/api/sync/${ID}`)
    expect(get.headers.get('cache-control')).toBe('no-store')
    expect(await get.json()).toMatchObject({ blob: 'AAAA_-bb', version: 1 })
  })

  it('versiya yoxlaması: köhnə versiya ilə yazmaq → 409, düzgünü ilə → +1', async () => {
    const stale = await call('PUT', `/api/sync/${ID}`, { blob: 'CCCC', version: 0 })
    expect(stale.status).toBe(409)
    expect((await stale.json()).version).toBe(1)
    const ok = await call('PUT', `/api/sync/${ID}`, { blob: 'CCCC', version: 1 })
    expect((await ok.json()).version).toBe(2)
    expect((await (await call('GET', `/api/sync/${ID}`)).json()).blob).toBe('CCCC')
  })

  it('olmayan bloka 0-dan fərqli versiya ilə yazmaq → 409', async () => {
    expect((await call('PUT', `/api/sync/${ID2}`, { blob: 'DDDD', version: 3 })).status).toBe(409)
  })

  it('pis id və pis blok rədd edilir', async () => {
    expect((await call('GET', '/api/sync/xyz')).status).toBe(400)
    expect((await call('GET', `/api/sync/${'A'.repeat(64)}`)).status).toBe(400)   // yalnız kiçik hex
    expect((await call('PUT', `/api/sync/${ID2}`, { blob: 'has spaces!' })).status).toBe(400)
    expect((await call('PUT', `/api/sync/${ID2}`, { blob: '' })).status).toBe(400)
    expect((await call('PUT', `/api/sync/${ID2}`, { blob: 'x'.repeat(sync.MAX_BLOB + 1) })).status).toBe(400)   // limitdən 1 simvol böyük
  })

  it('silinir', async () => {
    expect((await call('DELETE', `/api/sync/${ID}`)).status).toBe(200)
    expect((await call('GET', `/api/sync/${ID}`)).status).toBe(404)
  })
})

describe('sync: disk doldurma qorunması', () => {
  const hex = (n) => n.toString(16).padStart(64, '0')
  async function mk(opts = {}) {
    const d = openDb(':memory:')
    const ctx = { clock: Date.UTC(2026, 10, 18, 8, 0) }
    const app = express()
    app.set('trust proxy', 1)
    const router = sync.createSyncRouter({ db: d, now: () => ctx.clock, ...opts })
    app.use('/api', router)
    const s = await listen(app)
    const put = (id, blob, ip = '203.0.113.5', version = 0) => fetch(`${s.url}/api/sync/${id}`, {
      method: 'PUT', headers: { ...JSONH, 'x-forwarded-for': ip }, body: JSON.stringify({ blob, version }),
    })
    const get = (id, ip = '203.0.113.5') => fetch(`${s.url}/api/sync/${id}`, { headers: { 'x-forwarded-for': ip } })
    return { d, ctx, router, s, put, get }
  }

  it('bir IP (/64) gündə 20 yeni id; 21-ci → 429; mövcud blokun yenilənməsi davam edir; ertəsi gün yenə olar', async () => {
    const k = await mk()
    try {
      for (let i = 1; i <= sync.NEW_IDS_PER_DAY; i++) expect((await k.put(hex(i), 'AAAA', `2001:db8:9:9::${i}`)).status).toBe(200)
      const over = await k.put(hex(99), 'AAAA', '2001:db8:9:9:ffff::1')   // eyni /64
      expect([over.status, (await over.json()).code]).toEqual([429, 'quota'])
      expect((await k.put(hex(1), 'BBBB', '2001:db8:9:9::1', 1)).status).toBe(200)   // yeniləmə — kvotaya düşmür
      expect((await k.put(hex(98), 'AAAA', '198.51.100.9')).status).toBe(200)        // başqa IP
      k.ctx.clock += 24 * 3600e3
      expect((await k.put(hex(99), 'AAAA', '2001:db8:9:9::5')).status).toBe(200)
    } finally { await k.s.close() }
  })

  it('bir IP gündə 10 MB-dan çox yeni blok yaza bilmir', async () => {
    const k = await mk({ newBytesPerDay: 10 })
    try {
      expect((await k.put(hex(1), 'A'.repeat(6))).status).toBe(200)
      expect((await k.put(hex(2), 'A'.repeat(5))).status).toBe(429)
      expect((await k.put(hex(3), 'A'.repeat(4))).status).toBe(200)
    } finally { await k.s.close() }
  })

  it('cəmi ölçü həddi: yeni id → 507 storage_full, mövcud blokun yenilənməsi → 200', async () => {
    const k = await mk({ maxBytes: 20 })
    try {
      expect((await k.put(hex(1), 'A'.repeat(12))).status).toBe(200)
      const full = await k.put(hex(2), 'A'.repeat(12), '198.51.100.1')
      expect([full.status, (await full.json()).code]).toEqual([507, 'storage_full'])
      expect((await k.put(hex(1), 'B'.repeat(30), '203.0.113.5', 1)).status).toBe(200)
      expect((await (await k.get(hex(1))).json()).blob).toBe('B'.repeat(30))
      // silinəndə yer boşalır
      await fetch(`${k.s.url}/api/sync/${hex(1)}`, { method: 'DELETE' })
      expect((await k.put(hex(2), 'A'.repeat(12), '198.51.100.1')).status).toBe(200)
    } finally { await k.s.close() }
  })

  it('bir dəfə yazılıb heç oxunmamış blok 30 gün sonra silinir; oxunmuş / yenilənmiş / köhnə (meta-sız) qalır', async () => {
    const k = await mk()
    try {
      const [unread, read, updated, legacy] = [hex(11), hex(12), hex(13), hex(14)]
      for (const id of [unread, read, updated]) expect((await k.put(id, 'AAAA')).status).toBe(200)
      expect((await k.get(read)).status).toBe(200)
      expect((await k.put(updated, 'BBBB', '203.0.113.5', 1)).status).toBe(200)
      k.d.raw.prepare('INSERT INTO sync_blobs (id, blob, size, version, created_at, updated_at) VALUES (?, ?, 4, 1, ?, ?)').run(legacy, 'CCCC', k.ctx.clock, k.ctx.clock)
      k.ctx.clock += sync.UNREAD_TTL_MS + 1000
      k.router.gcNow()
      const ids = k.d.raw.prepare('SELECT id FROM sync_blobs ORDER BY id').all().map((r) => r.id)
      expect(ids).toEqual([read, updated, legacy])
      expect(k.d.raw.prepare('SELECT COUNT(*) AS n FROM sync_blob_meta WHERE id = ?').get(unread).n).toBe(0)
      expect(JSON.stringify(k.d.raw.prepare('SELECT * FROM sync_blob_meta').all())).not.toMatch(/203\.0\.113|2001:db8/)
    } finally { await k.s.close() }
  })
})
