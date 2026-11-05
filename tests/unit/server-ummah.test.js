// Ümmətin sayğacı (server/ummah.js) — anonim gündəlik cəm, limitlər, miqrasiyasız cədvəl
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const { createUmmahRouter } = require('../../server/ummah.js')

describe('ummah router', () => {
  let srv, db, t = Date.UTC(2026, 10, 5, 12)
  beforeAll(async () => {
    db = openDb(':memory:')
    const app = express()
    app.use('/api', createUmmahRouter({ db, now: () => t }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())
  const post = (b) => fetch(`${srv.url}/api/ummah`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })

  it('say toplanır; bir sorğuda ən çox 100 (cüz — 1); pozuq — 400', async () => {
    expect((await post({ kind: 'salawat', n: 3 })).status).toBe(204)
    expect((await post({ kind: 'salawat', n: 500 })).status).toBe(204)
    expect((await post({ kind: 'juz', n: 9 })).status).toBe(204)
    expect((await post({ kind: 'bad', n: 1 })).status).toBe(400)
    expect((await post({ kind: 'dhikr', n: 0 })).status).toBe(400)
    t += 20000 // keş (15 s) keçsin
    const d = await (await fetch(`${srv.url}/api/ummah`)).json()
    expect(d).toMatchObject({ day: '2026-11-05', today: { salawat: 103, dhikr: 0, juz: 1 }, total: { salawat: 103, juz: 1 } })
  })
  it('növbəti gün "bu gün" sıfırdan, ümumi qalır', async () => {
    t += 86400000
    await post({ kind: 'dhikr', n: 2 })
    t += 20000
    const d = await (await fetch(`${srv.url}/api/ummah`)).json()
    expect(d.today).toEqual({ salawat: 0, dhikr: 2, juz: 0 })
    expect(d.total.salawat).toBe(103)
  })
  it('sxem versiyası dəyişmir (geri qaytarma təhlükəsizdir)', () => {
    const v = (db.raw || db).prepare('PRAGMA user_version').get().user_version
    const fresh = openDb(':memory:')
    expect(v).toBe((fresh.raw || fresh).prepare('PRAGMA user_version').get().user_version)
  })
})
