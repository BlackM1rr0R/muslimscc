// Server: Firestore → SQLite köçürməsinin çevrilmələri (server/scripts/migrate-from-firestore.js)
import { describe, it, expect } from 'vitest'
import { require } from './server-helpers.js'

const m = require('../../server/scripts/migrate-from-firestore.js')
const { openDb } = require('../../server/db.js')

// Firestore Admin SDK obyektlərinin oxşarları
const ts = (ms) => ({ toMillis: () => ms, seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 })
const snap = (id, data, createMs, updateMs) => ({ id, data: () => data, createTime: ts(createMs), updateTime: ts(updateMs) })

describe('Timestamp → ms', () => {
  it('SDK Timestamp, {seconds,nanoseconds} və {_seconds,_nanoseconds}', () => {
    expect(m.timestampMillis(ts(1700000000123))).toBe(1700000000123)
    expect(m.timestampMillis({ seconds: 1700000000, nanoseconds: 456000000 })).toBe(1700000000456)
    expect(m.timestampMillis({ _seconds: 1700000000, _nanoseconds: 0 })).toBe(1700000000000)
    // əlavə sahəsi olan adi obyekt Timestamp sayılmır
    expect(m.timestampMillis({ seconds: 5, nanoseconds: 0, label: 'x' })).toBeNull()
    expect(m.timestampMillis(null)).toBeNull()
  })

  it('convertValue — iç-içə strukturlar', () => {
    const v = m.convertValue({
      createdAt: ts(1000), list: [ts(2000), { at: { seconds: 3, nanoseconds: 0 } }],
      geo: { latitude: 40.4, longitude: 49.8 }, n: 1, s: 'a', b: true, z: null, d: new Date(5000),
      ref: { path: 'books/x', firestore: {} }, inf: Infinity,
    })
    expect(v).toEqual({
      createdAt: 1000, list: [2000, { at: 3000 }], geo: { lat: 40.4, lng: 49.8 },
      n: 1, s: 'a', b: true, z: null, d: 5000, ref: 'books/x', inf: null,
    })
  })

  it('convertDoc — createdAt sahəsi üstündür, yoxdursa createTime; updatedAt = updateTime', () => {
    const a = m.convertDoc(snap('a1', { title: 'x', createdAt: ts(1500), id: 'saxta' }, 1000, 9000))
    expect(a).toEqual({ id: 'a1', data: { title: 'x', createdAt: 1500 }, createdAt: 1500, updatedAt: 9000 })
    const b = m.convertDoc(snap('b1', { title: 'y' }, 2000, 2500))
    expect(b).toMatchObject({ createdAt: 2000, updatedAt: 2500 })
  })

  it('təkrar köçürmə idempotentdir (importDoc ilə)', () => {
    const db = openDb(':memory:')
    const run = (s) => { const c = m.convertDoc(s); return db.importDoc('books', c.id, c.data, c.createdAt, c.updatedAt) }
    expect(run(snap('k1', { t: 1, createdAt: ts(100) }, 100, 200))).toBe('inserted')
    expect(run(snap('k1', { t: 1, createdAt: ts(100) }, 100, 200))).toBe('skipped')
    expect(run(snap('k1', { t: 2, createdAt: ts(100) }, 100, 300))).toBe('updated')
    expect(db.listDocs('books')).toEqual([{ id: 'k1', t: 2, createdAt: 100 }])
  })
})
