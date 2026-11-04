// ═══════════════════════════════════════════════════════════════════════
// Cihazlar arası sinxronizasiya — hesabsız, ŞİFRƏLİ (uçdan-uca)
//
//   GET    /api/sync/:id   → 200 { blob, version, updatedAt } | 404
//   PUT    /api/sync/:id   { blob, version? } → 200 { version, updatedAt }
//                          version — klientin bildiyi son versiya (yeni blok üçün 0
//                          və ya yoxdur). Serverdəki fərqlidirsə → 409 { version, updatedAt }
//                          (başqa cihaz yeniləyib — əvvəlcə gətir, sonra göndər).
//   DELETE /api/sync/:id   → 200 { ok }
//
// Təhlükəsizlik modeli:
//   • id — bərpa kodundan brauzerdə HKDF ilə alınan 256 bitlik hex. Kodu bilən
//     id-ni bilir; id-ni təxmin etmək mümkün deyil (2^256). id = "imkan".
//   • blob — brauzerdə AES-256-GCM ilə şifrələnmiş (açar da koddan alınır,
//     serverə heç vaxt gəlmir). Server yalnız base64url mətn saxlayır.
//   • IP, cookie, istifadəçi məlumatı saxlanmır. 400 gün toxunulmayan blok silinir.
//   • Limit: blok ≤ 900 KB (nginx 1m); IP üzrə yaddaşda sorğu limiti (dəqiqədə 30).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')

const ID_RE = /^[0-9a-f]{64}$/
const BLOB_RE = /^[A-Za-z0-9_-]+$/          // base64url
const MAX_BLOB = 900 * 1024        // nginx client_max_body_size 1m — JSON qabığı ilə birlikdə altında qalsın
const TTL_MS = 400 * 24 * 60 * 60 * 1000
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 30

function createSyncRouter({ db, now = () => Date.now() }) {
  const raw = db.raw || db
  const q = {
    get: raw.prepare('SELECT blob, version, updated_at FROM sync_blobs WHERE id = ?'),
    ins: raw.prepare('INSERT INTO sync_blobs (id, blob, size, version, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'),
    upd: raw.prepare('UPDATE sync_blobs SET blob = ?, size = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?'),
    del: raw.prepare('DELETE FROM sync_blobs WHERE id = ?'),
    gc: raw.prepare('DELETE FROM sync_blobs WHERE updated_at < ?'),
  }

  // Sadə yaddaşdaxili limit (IP üzrə)
  const hits = new Map()
  const limited = (ip) => {
    const t = now()
    const h = hits.get(ip)
    if (!h || t - h.start > WINDOW_MS) { hits.set(ip, { start: t, n: 1 }); return false }
    h.n++
    return h.n > MAX_PER_WINDOW
  }
  let lastGc = 0
  const gc = () => {
    const t = now()
    if (t - lastGc < 6 * 60 * 60 * 1000) return
    lastGc = t
    try { q.gc.run(t - TTL_MS) } catch { /* növbəti dəfə */ }
    for (const [ip, h] of hits) if (t - h.start > WINDOW_MS) hits.delete(ip)
  }

  const router = express.Router()
  router.use('/sync', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (limited(req.ip || 'x')) return res.status(429).json({ error: 'Limit' })
    gc()
    next()
  })
  const checkId = (req, res, next) => (ID_RE.test(req.params.id) ? next() : res.status(400).json({ error: 'bad_id' }))

  router.get('/sync/:id', checkId, (req, res) => {
    const row = q.get.get(req.params.id)
    if (!row) return res.status(404).json({ error: 'not_found' })
    res.json({ blob: row.blob, version: row.version, updatedAt: row.updated_at })
  })

  router.put('/sync/:id', checkId, express.json({ limit: MAX_BLOB + 4096 }), (req, res) => {
    const b = req.body
    const blob = b && typeof b.blob === 'string' ? b.blob : ''
    if (!blob || blob.length > MAX_BLOB || !BLOB_RE.test(blob)) return res.status(400).json({ error: 'bad_blob' })
    const known = Number.isInteger(b.version) && b.version >= 0 ? b.version : 0
    const t = now()
    const row = q.get.get(req.params.id)
    if (!row) {
      if (known !== 0) return res.status(409).json({ version: 0, updatedAt: null })
      q.ins.run(req.params.id, blob, blob.length, t, t)
      return res.json({ version: 1, updatedAt: t })
    }
    if (row.version !== known) return res.status(409).json({ version: row.version, updatedAt: row.updated_at })
    const r = q.upd.run(blob, blob.length, t, req.params.id, known)
    if (!r.changes) {
      const cur = q.get.get(req.params.id)
      return res.status(409).json({ version: cur?.version ?? 0, updatedAt: cur?.updated_at ?? null })
    }
    res.json({ version: known + 1, updatedAt: t })
  })

  router.delete('/sync/:id', checkId, (req, res) => {
    q.del.run(req.params.id)
    res.json({ ok: true })
  })

  return router
}

module.exports = { createSyncRouter, ID_RE, MAX_BLOB }
