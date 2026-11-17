// Hilal müşahidələri (server/sightings.js) — 1°-lik xana, axşam tarixi, gündə bir qeyd, ±1 gün cəmi
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const { createSightingsRouter, eveningOf, cellOf } = require('../../server/sightings.js')

describe('sightings router', () => {
  let srv, db, t = Date.UTC(2026, 10, 21, 15) // 21 noyabr, 15:00 UTC
  beforeAll(async () => {
    db = openDb(':memory:')
    const app = express()
    app.set('trust proxy', 1)
    app.use('/api', createSightingsRouter({ db, now: () => t }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())
  let ipN = 0
  const post = (b, ip = `10.0.0.${++ipN}`) => fetch(`${srv.url}/api/sightings`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(b),
  })
  const get = async (q = '') => (await fetch(`${srv.url}/api/sightings${q}`)).json()

  it('köməkçilər: xana və axşam tarixi', () => {
    expect(cellOf(40.41, 49.87)).toEqual([40, 50])
    expect(cellOf(-6.2, 179.8)).toEqual([-6, -180])
    // Nyu-York axşamı 21:00 yerli = ertəsi gün 02:00 UTC → yenə 21-in axşamı
    expect(eveningOf(Date.UTC(2026, 10, 22, 2), -74)).toBe('2026-11-21')
    expect(eveningOf(Date.UTC(2026, 10, 21, 15), 50)).toBe('2026-11-21')
  })

  it('qeyd 1°-yə yuvarlaqlaşır, cəmlənir; pozuq — 400', async () => {
    expect((await post({ lat: 40.41, lng: 49.87, seen: true, method: 'eye' })).status).toBe(204)
    expect((await post({ lat: 39.8, lng: 50.2, seen: false, method: 'binoculars' })).status).toBe(204)
    expect((await post({ lat: 21.4, lng: 39.8, seen: true, method: 'telescope' })).status).toBe(204)
    expect((await post({ lat: 91, lng: 0, seen: true, method: 'eye' })).status).toBe(400)
    expect((await post({ lat: 10, lng: 10, seen: 'yes', method: 'eye' })).status).toBe(400)
    expect((await post({ lat: 10, lng: 10, seen: true, method: 'radar' })).status).toBe(400)
    expect((await post({ seen: true, method: 'eye' })).status).toBe(400)
    const d = await get('?date=2026-11-21')
    expect(d).toMatchObject({ date: '2026-11-21', from: '2026-11-20', to: '2026-11-22' })
    const baku = d.cells.find(c => c.lat === 40 && c.lng === 50)
    expect(baku).toEqual({ lat: 40, lng: 50, seen: 1, notSeen: 1, methods: { eye: 1, binoculars: 1, telescope: 0, camera: 0 } })
    expect(d.cells.find(c => c.lat === 21 && c.lng === 40)).toMatchObject({ seen: 1, notSeen: 0 })
  })

  it('bir IP gündə bir dəfə; ertəsi gün yenə olar', async () => {
    expect((await post({ lat: 0, lng: 0, seen: true, method: 'camera' }, '9.9.9.9')).status).toBe(204)
    expect((await post({ lat: 0, lng: 0, seen: true, method: 'camera' }, '9.9.9.9')).status).toBe(429)
    t += 86400000
    expect((await post({ lat: 0, lng: 0, seen: false, method: 'eye' }, '9.9.9.9')).status).toBe(204)
  })

  it('±1 gün pəncərəsi; tarix pozuqdursa 400; IP saxlanmır', async () => {
    const far = await get('?date=2026-11-25')
    expect(far.cells).toEqual([])
    const near = await get('?date=2026-11-22')
    expect(near.cells.length).toBeGreaterThan(0)
    expect((await fetch(`${srv.url}/api/sightings?date=21-11-2026`)).status).toBe(400)
    const cols = (db.raw || db).prepare('PRAGMA table_info(hilal_sightings)').all().map(c => c.name)
    expect(cols).toEqual(['day', 'lat', 'lng', 'seen', 'method', 'hour'])
    const row = (db.raw || db).prepare('SELECT hour FROM hilal_sightings LIMIT 1').get()
    expect(row.hour).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}$/)
  })

  it('GET 30 s keşlənir, POST keşi təmizləyir', async () => {
    const a = await get('?date=2026-11-21')
    const n0 = a.cells.reduce((s, c) => s + c.seen + c.notSeen, 0)
    t -= 86400000 // eyni axşama yeni qeyd (başqa IP)
    await post({ lat: 30, lng: 31, seen: true, method: 'eye' })
    const b = await get('?date=2026-11-21')
    expect(b.cells.reduce((s, c) => s + c.seen + c.notSeen, 0)).toBe(n0 + 1)
  })

  it('sxem versiyası dəyişmir (geri qaytarma təhlükəsizdir)', () => {
    const v = (db.raw || db).prepare('PRAGMA user_version').get().user_version
    const fresh = openDb(':memory:')
    expect(v).toBe((fresh.raw || fresh).prepare('PRAGMA user_version').get().user_version)
  })
})
