// Server: SQLite sənəd anbarı (server/db.js) — yaddaşda (:memory:)
import { describe, it, expect, beforeEach } from 'vitest'
import { require } from './server-helpers.js'

const { openDb, newId, SCHEMA_VERSION } = require('../../server/db.js')

let db
beforeEach(() => { db = openDb(':memory:') })

describe('sxem', () => {
  it('miqrasiya user_version-u son versiyaya qaldırır, təkrar açılış zərərsizdir', () => {
    expect(db.raw.prepare('PRAGMA user_version').get().user_version).toBe(SCHEMA_VERSION)
    const tables = db.raw.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name)
    for (const t of ['docs', 'push_subs', 'admins', 'sessions', 'notification_history']) expect(tables).toContain(t)
    expect(db.ping()).toBe(true)
  })

  it('newId — 20 simvollu, URL-təhlükəsiz, unikal', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()))
    expect(ids.size).toBe(500)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9]{20}$/)
  })
})

describe('sənədlər', () => {
  it('addDoc createdAt qoyur, listDocs createdAt-a görə azalan sıradadır', () => {
    db.addDoc('books', { t: 'a' }, 1000)
    db.addDoc('books', { t: 'b' }, 3000)
    db.addDoc('books', { t: 'c' }, 2000)
    db.addDoc('videos', { t: 'x' }, 5000)
    const list = db.listDocs('books')
    expect(list.map((d) => d.t)).toEqual(['b', 'c', 'a'])
    expect(list[0]).toMatchObject({ t: 'b', createdAt: 3000 })
    expect(typeof list[0].id).toBe('string')
    expect(db.countDocs('books')).toBe(3)
  })

  it('updateDoc üst səviyyədə birləşdirir və updatedAt qoyur; olmayan sənəd → null', () => {
    const d = db.addDoc('duas', { a: 1, nested: { x: 1 } }, 1000)
    const u = db.updateDoc('duas', d.id, { b: 2, nested: { y: 2 } }, 2000)
    expect(u).toEqual({ id: d.id, a: 1, b: 2, nested: { y: 2 }, createdAt: 1000, updatedAt: 2000 })
    expect(db.getDoc('duas', d.id)).toEqual(u)
    expect(db.updateDoc('duas', 'yoxdur', { a: 1 })).toBeNull()
  })

  it('setDoc tam əvəz edir, createdAt qorunur', () => {
    db.setDoc('singletons', 'hero', { title: 'A', old: true }, 1000)
    const s = db.setDoc('singletons', 'hero', { title: 'B' }, 2000)
    expect(s).toEqual({ id: 'hero', title: 'B', createdAt: 1000, updatedAt: 2000 })
  })

  it('deleteDoc və version', () => {
    expect(db.version()).toBe(0)
    const d = db.addDoc('quotes', { q: 1 }, 1234)
    expect(db.version('quotes')).toBe(1234)
    expect(db.version('books')).toBe(0)
    expect(db.deleteDoc('quotes', d.id)).toBe(true)
    expect(db.deleteDoc('quotes', d.id)).toBe(false)
    expect(db.getDoc('quotes', d.id)).toBeNull()
  })

  it('importDoc idempotentdir — yalnız daha yeni updated_at yeniləyir', () => {
    expect(db.importDoc('events', 'e1', { v: 1 }, 100, 200)).toBe('inserted')
    expect(db.importDoc('events', 'e1', { v: 1 }, 100, 200)).toBe('skipped')
    expect(db.importDoc('events', 'e1', { v: 0 }, 100, 150)).toBe('skipped')
    expect(db.getDoc('events', 'e1').v).toBe(1)
    expect(db.importDoc('events', 'e1', { v: 2 }, 100, 300)).toBe('updated')
    expect(db.getDoc('events', 'e1').v).toBe(2)
    expect(db.countDocs('events')).toBe(1)
  })

  it('SQL inyeksiyası: kolleksiya/ID parametrdir, mətn kimi qalır', () => {
    db.setDoc("x'; DROP TABLE docs; --", "1' OR '1'='1", { a: 1 })
    expect(db.getDoc('books', "1' OR '1'='1")).toBeNull()
    expect(db.raw.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='docs'").get().n).toBe(1)
  })

  it('tx xətada geri qaytarır', () => {
    expect(() => db.tx(() => { db.addDoc('books', { a: 1 }); throw new Error('x') })).toThrow('x')
    expect(db.countDocs('books')).toBe(0)
  })
})
