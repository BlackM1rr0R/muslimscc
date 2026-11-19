// Server: push planlayıcılarının proseslər arası "bir dəfə göndər" qeydi (server/pushClaims.js).
// Kəsintisiz deploy zamanı köhnə və yeni api prosesi eyni bazada yanaşı işləyir — eyni azan iki dəfə getməməlidir.
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const { createPushClaims, TTL_MS } = require('../../server/pushClaims.js')

const silent = { error: () => {} }
let dir
afterEach(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); dir = null })

describe('pushClaims', () => {
  it('eyni bazada iki proses: açarı yalnız biri tutur (köhnə + yeni api yanaşı)', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-claims-'))
    const file = path.join(dir, 'c.db')
    const a = openDb(file)
    const b = openDb(file)       // ayrı bağlantı — ikinci konteynerin prosesi kimi
    const sa = createPushClaims(a, { log: silent }).set()
    const sb = createPushClaims(b, { log: silent }).set()
    const k = '40.41,49.87|2026-11-19|fajr'
    expect(sa.claim(k)).toBe(true)
    expect(sb.claim(k)).toBe(false)     // digər proses artıq göndərib
    expect(sa.claim(k)).toBe(false)     // eyni proses — yaddaşdan
    expect(sb.claim(k.replace('fajr', 'dhuhr'))).toBe(true)
    a.close(); b.close()
  })

  it('yenidən başlama (boş yaddaş) eyni dəqiqədə təkrar göndərmir', () => {
    const db = openDb(':memory:')
    const k = 'x|2026-11-19|asr'
    expect(createPushClaims(db, { log: silent }).set().claim(k)).toBe(true)
    expect(createPushClaims(db, { log: silent }).set().claim(k)).toBe(false)
  })

  it('bazada açıq açar yox, yalnız həş; köhnə qeydlər purge ilə silinir', () => {
    const db = openDb(':memory:')
    let t = 1_000_000
    const c = createPushClaims(db, { now: () => t, log: silent })
    const s = c.set()
    s.claim('40.41,49.87|2026-11-19|fajr')
    const rows = db.raw.prepare('SELECT k FROM push_claims').all()
    expect(rows).toHaveLength(1)
    expect(rows[0].k).not.toContain('40.41')
    t += TTL_MS + 1
    expect(c.purge()).toBe(1)
    expect(db.raw.prepare('SELECT COUNT(*) n FROM push_claims').get().n).toBe(0)
  })

  it('Set kimi işləyir (köhnə günlərin təmizlənməsi delete/iterasiya ilə)', () => {
    const s = createPushClaims(openDb(':memory:'), { log: silent }).set()
    s.claim('a|1|x'); s.claim('a|2|x')
    for (const k of s) if (k.startsWith('a|1')) s.delete(k)
    expect([...s]).toEqual(['a|2|x'])
  })

  it('baza xətası — göndərişi itirmir (köhnə, yalnız yaddaş davranışı)', () => {
    const db = openDb(':memory:')
    const s = createPushClaims(db, { log: silent }).set()
    db.close()
    expect(s.claim('z|1|y')).toBe(true)
    expect(s.claim('z|1|y')).toBe(false)
  })
})
