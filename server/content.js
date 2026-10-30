// ═══════════════════════════════════════════════════════════════════════
// Məzmun API-si — Firestore-un əvəzi (docs/FIREBASE-EXIT.md)
//
// İctimai (oxuma):
//   GET  /api/content/version                 → { version, collections:{ad: ms} }
//   GET  /api/content/:collection             → [{ id, ...data }]  (createdAt desc)
//   GET  /api/content/:collection/:id         → { id, ...data } | 404
//   GET  /api/singletons/:id                  → { id, ...data } | 404  (daily|hero|settings)
// Admin (sessiya və ya keçid dövründə Firebase ID tokeni):
//   POST   /api/admin/content/:collection           addDoc   → 201 { id, ...data }
//   POST   /api/admin/content/:collection/batch     { items:[...] } (≤200) → 201 { ids }
//   PUT    /api/admin/content/:collection/:id       setDoc (tam əvəz, createdAt qorunur)
//   PATCH  /api/admin/content/:collection/:id       updateDoc (üst səviyyə birləşmə) | 404
//   DELETE /api/admin/content/:collection/:id       → { ok } | 404
//   PUT    /api/admin/singletons/:id                setSingleDoc
//
// Cavab forması Firestore klientindəki ilə eynidir: { id, ...data }; vaxtlar
// (createdAt, updatedAt) Firestore Timestamp yox, millisaniyə (rəqəm) olur —
// klient kodu (AnnouncementsPage toMillis, AnnouncementSection) rəqəmi qəbul edir.
// Realtime (onSnapshot) yoxdur: klient yükləmədə + fokusda soruşur; ETag sayəsində
// dəyişməyibsə 304 (gövdəsiz) qayıdır, /version isə ən ucuz yoxlamadır.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')

// firestore.rules ilə eyni siyahı — başqa kolleksiya adı qəbul edilmir
const PUBLIC_COLLECTIONS = ['videos', 'books', 'hadiths', 'duas', 'quotes', 'announcements', 'events', 'places']
const SINGLETONS = ['daily', 'hero', 'settings']
const SINGLETON_COLLECTION = 'singletons'

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/
const MAX_DOC_BYTES = 256 * 1024     // bir sənəd (Firestore limiti 1 MiB, bizdə məzmun kiçikdir)
const MAX_DEPTH = 12
const MAX_KEYS = 2000
const MAX_BATCH = 200
// Klientin yaza bilməyəcəyi sahələr (server özü qoyur)
const RESERVED = ['id', 'createdAt', 'updatedAt']

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null)

/**
 * Sənəd məlumatını yoxla. Uğurlu olsa { ok:true, data } (ehtiyat sahələr
 * çıxarılmış surət), əks halda { ok:false, error }.
 */
function validateDocData(input) {
  if (!isPlainObject(input)) return { ok: false, error: 'Body must be a JSON object' }
  let keys = 0
  const walk = (v, depth) => {
    if (depth > MAX_DEPTH) throw new Error('Too deeply nested')
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return
    if (typeof v === 'number') { if (!Number.isFinite(v)) throw new Error('Invalid number'); return }
    if (Array.isArray(v)) { for (const x of v) walk(x, depth + 1); return }
    if (isPlainObject(v)) {
      for (const k of Object.keys(v)) {
        if (++keys > MAX_KEYS) throw new Error('Too many fields')
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') throw new Error('Invalid field name')
        if (k.length > 200) throw new Error('Field name too long')
        walk(v[k], depth + 1)
      }
      return
    }
    throw new Error('Unsupported value')
  }
  try { walk(input, 0) } catch (e) { return { ok: false, error: e.message } }
  const data = {}
  for (const [k, v] of Object.entries(input)) if (!RESERVED.includes(k)) data[k] = v
  if (Buffer.byteLength(JSON.stringify(data)) > MAX_DOC_BYTES) return { ok: false, error: 'Document too large' }
  return { ok: true, data }
}

const etagOf = (body) => 'W/"' + crypto.createHash('sha1').update(body).digest('base64url') + '"'

/** JSON cavabı ETag ilə: If-None-Match uyğundursa 304. */
function sendCached(req, res, value) {
  const body = JSON.stringify(value)
  const tag = etagOf(body)
  // no-cache: brauzer saxlaya bilər, amma hər dəfə ETag ilə yoxlatmalıdır
  res.set({ 'Cache-Control': 'no-cache', ETag: tag, 'Content-Type': 'application/json; charset=utf-8' })
  const inm = req.headers['if-none-match']
  if (inm && inm.split(',').map((s) => s.trim()).includes(tag)) return res.status(304).end()
  return res.send(body)
}

function createContentRouter({ db, requireAdmin, onChange = () => {} }) {
  const router = express.Router()
  const json = express.json({ limit: '1mb' })

  const collectionOk = (req, res, next) => {
    if (!PUBLIC_COLLECTIONS.includes(req.params.collection)) return res.status(404).json({ error: 'Unknown collection' })
    next()
  }
  const idOk = (req, res, next) => {
    if (!ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Invalid id' })
    next()
  }
  const singletonOk = (req, res, next) => {
    if (!SINGLETONS.includes(req.params.id)) return res.status(404).json({ error: 'Unknown singleton' })
    next()
  }
  const changed = (collection, id, action, req) => {
    try { onChange({ collection, id, action, admin: req.adminUser && req.adminUser.email }) } catch { /* jurnal xətası əsas işi pozmasın */ }
  }

  // ── İctimai ──
  router.get('/content/version', (req, res) => {
    const collections = {}
    for (const c of [...PUBLIC_COLLECTIONS, SINGLETON_COLLECTION]) collections[c] = db.version(c)
    sendCached(req, res, { version: db.version(), collections })
  })

  router.get('/content/:collection', collectionOk, (req, res) => {
    sendCached(req, res, db.listDocs(req.params.collection))
  })

  router.get('/content/:collection/:id', collectionOk, idOk, (req, res) => {
    const doc = db.getDoc(req.params.collection, req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    sendCached(req, res, doc)
  })

  router.get('/singletons/:id', singletonOk, (req, res) => {
    const doc = db.getDoc(SINGLETON_COLLECTION, req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    sendCached(req, res, doc)
  })

  // ── Admin ──
  const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next() }

  router.post('/admin/content/:collection/batch', requireAdmin, noStore, collectionOk, json, (req, res) => {
    const items = req.body && req.body.items
    if (!Array.isArray(items) || !items.length || items.length > MAX_BATCH) {
      return res.status(400).json({ error: `items must be an array of 1-${MAX_BATCH}` })
    }
    const checked = []
    for (let i = 0; i < items.length; i++) {
      const v = validateDocData(items[i])
      if (!v.ok) return res.status(400).json({ error: `items[${i}]: ${v.error}` })
      checked.push(v.data)
    }
    const now = Date.now()
    const ids = db.tx(() => checked.map((d) => db.addDoc(req.params.collection, d, now).id))
    changed(req.params.collection, `${ids.length} sənəd`, 'batch', req)
    res.status(201).json({ ids })
  })

  router.post('/admin/content/:collection', requireAdmin, noStore, collectionOk, json, (req, res) => {
    const v = validateDocData(req.body)
    if (!v.ok) return res.status(400).json({ error: v.error })
    const doc = db.addDoc(req.params.collection, v.data)
    changed(req.params.collection, doc.id, 'create', req)
    res.status(201).json(doc)
  })

  router.put('/admin/content/:collection/:id', requireAdmin, noStore, collectionOk, idOk, json, (req, res) => {
    const v = validateDocData(req.body)
    if (!v.ok) return res.status(400).json({ error: v.error })
    const doc = db.setDoc(req.params.collection, req.params.id, v.data)
    changed(req.params.collection, req.params.id, 'set', req)
    res.json(doc)
  })

  router.patch('/admin/content/:collection/:id', requireAdmin, noStore, collectionOk, idOk, json, (req, res) => {
    const v = validateDocData(req.body)
    if (!v.ok) return res.status(400).json({ error: v.error })
    const doc = db.updateDoc(req.params.collection, req.params.id, v.data)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    changed(req.params.collection, req.params.id, 'update', req)
    res.json(doc)
  })

  router.delete('/admin/content/:collection/:id', requireAdmin, noStore, collectionOk, idOk, (req, res) => {
    if (!db.deleteDoc(req.params.collection, req.params.id)) return res.status(404).json({ error: 'Not found' })
    changed(req.params.collection, req.params.id, 'delete', req)
    res.json({ ok: true })
  })

  router.put('/admin/singletons/:id', requireAdmin, noStore, singletonOk, json, (req, res) => {
    const v = validateDocData(req.body)
    if (!v.ok) return res.status(400).json({ error: v.error })
    const doc = db.setDoc(SINGLETON_COLLECTION, req.params.id, v.data)
    changed(SINGLETON_COLLECTION, req.params.id, 'set', req)
    res.json(doc)
  })

  // JSON parse xətaları (və ölçü limiti) — daxili detal olmadan
  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => {
    const status = err && (err.status || err.statusCode)
    if (status === 413) return res.status(413).json({ error: 'Payload too large' })
    if (status === 400) return res.status(400).json({ error: 'Invalid JSON' })
    console.error('content error:', err && err.message)
    res.status(500).json({ error: 'Server error' })
  })

  return router
}

module.exports = {
  PUBLIC_COLLECTIONS, SINGLETONS, SINGLETON_COLLECTION, ID_RE, MAX_DOC_BYTES, MAX_BATCH,
  validateDocData, createContentRouter, etagOf,
}
