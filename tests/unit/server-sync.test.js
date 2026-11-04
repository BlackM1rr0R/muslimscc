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
