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
//   • Disk doldurma qorunması (YENİ id-lər üçün; mövcud blokun yenilənməsi həmişə olur):
//     – IP açarı (duzlu HMAC, IPv6 /64 — server/ipKey.js, yalnız yaddaşda) üzrə gündə 20 yeni id / 10 MB → 429 quota;
//     – bütün blokların cəmi SYNC_MAX_BYTES-dan (susmaya görə 5 GB) çoxdursa → 507 storage_full;
//     – bir dəfə yazılıb HEÇ OXUNMAMIŞ blok (versiya 1) 30 gün sonra silinir. Oxunma vaxtı ayrıca
//       cədvəldədir (sync_blob_meta, miqrasiyasız); bu dəyişiklikdən ƏVVƏL yaranan bloklara toxunulmur.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const { createIpKeyer } = require('./ipKey')

const ID_RE = /^[0-9a-f]{64}$/
const BLOB_RE = /^[A-Za-z0-9_-]+$/          // base64url
const MAX_BLOB = 900 * 1024        // nginx client_max_body_size 1m — JSON qabığı ilə birlikdə altında qalsın
const TTL_MS = 400 * 24 * 60 * 60 * 1000
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 30
const DAY_MS = 24 * 60 * 60 * 1000
const NEW_IDS_PER_DAY = 20
const NEW_BYTES_PER_DAY = 10 * 1024 * 1024
const MAX_TOTAL_BYTES = 5 * 1024 * 1024 * 1024
const UNREAD_TTL_MS = 30 * DAY_MS
const TOTAL_REFRESH_MS = 5 * 60 * 1000

const META_SCHEMA = `
CREATE TABLE IF NOT EXISTS sync_blob_meta (
  id         TEXT PRIMARY KEY REFERENCES sync_blobs(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  read_at    INTEGER
);
CREATE INDEX IF NOT EXISTS sync_blob_meta_unread ON sync_blob_meta(created_at) WHERE read_at IS NULL;
`

/**
 * opts: { db, now?, maxBytes? (env SYNC_MAX_BYTES), newIdsPerDay?, newBytesPerDay?, unreadTtlMs? }
 */
function createSyncRouter({
  db, now = () => Date.now(), maxBytes = Number(process.env.SYNC_MAX_BYTES) || MAX_TOTAL_BYTES,
  newIdsPerDay = NEW_IDS_PER_DAY, newBytesPerDay = NEW_BYTES_PER_DAY, unreadTtlMs = UNREAD_TTL_MS,
}) {
  const raw = db.raw || db
  raw.exec(META_SCHEMA)
  const q = {
    get: raw.prepare('SELECT blob, version, updated_at FROM sync_blobs WHERE id = ?'),
    ins: raw.prepare('INSERT INTO sync_blobs (id, blob, size, version, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'),
    upd: raw.prepare('UPDATE sync_blobs SET blob = ?, size = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?'),
    del: raw.prepare('DELETE FROM sync_blobs WHERE id = ?'),
    gc: raw.prepare('DELETE FROM sync_blobs WHERE updated_at < ?'),
    metaIns: raw.prepare('INSERT OR IGNORE INTO sync_blob_meta (id, created_at) VALUES (?, ?)'),
    metaRead: raw.prepare('UPDATE sync_blob_meta SET read_at = ? WHERE id = ? AND read_at IS NULL'),
    metaDel: raw.prepare('DELETE FROM sync_blob_meta WHERE id = ?'),
    gcUnread: raw.prepare(`DELETE FROM sync_blobs WHERE version = 1 AND id IN
      (SELECT id FROM sync_blob_meta WHERE read_at IS NULL AND created_at < ?)`),
    gcMeta: raw.prepare('DELETE FROM sync_blob_meta WHERE id NOT IN (SELECT id FROM sync_blobs)'),
    total: raw.prepare('SELECT COALESCE(SUM(size), 0) AS n FROM sync_blobs'),
  }

  // Cəmi ölçü (bayt) — 5 dəqiqədə bir bazadan, arada yazılara görə yenilənir
  let total = 0, totalAt = -Infinity
  const totalBytes = () => {
    const t = now()
    if (t - totalAt > TOTAL_REFRESH_MS) { try { total = Number(q.total.get().n) || 0 } catch { /* köhnə dəyər */ } totalAt = t }
    return total
  }

  // Yeni id kvotası: IP açarı (HMAC, /64) → { day, ids, bytes } — yalnız yaddaşda
  const ipKey = createIpKeyer()
  const quota = new Map()
  const quotaOf = (key, t) => {
    const day = Math.floor(t / DAY_MS)
    let qv = quota.get(key)
    if (!qv || qv.day !== day) { qv = { day, ids: 0, bytes: 0 }; quota.set(key, qv) }
    return qv
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
    try { q.gc.run(t - TTL_MS); q.gcUnread.run(t - unreadTtlMs); q.gcMeta.run() } catch { /* növbəti dəfə */ }
    totalAt = -Infinity
    for (const [ip, h] of hits) if (t - h.start > WINDOW_MS) hits.delete(ip)
    const day = Math.floor(t / DAY_MS)
    for (const [k, v] of quota) if (v.day !== day) quota.delete(k)
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
    try { q.metaRead.run(now(), req.params.id) } catch { /* */ }
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
      if (totalBytes() + blob.length > maxBytes) return res.status(507).json({ error: 'storage_full', code: 'storage_full' })
      const qv = quotaOf(ipKey(req), t)
      if (qv.ids >= newIdsPerDay || qv.bytes + blob.length > newBytesPerDay) return res.status(429).json({ error: 'quota', code: 'quota' })
      q.ins.run(req.params.id, blob, blob.length, t, t)
      try { q.metaIns.run(req.params.id, t) } catch { /* */ }
      qv.ids++
      qv.bytes += blob.length
      total += blob.length
      return res.json({ version: 1, updatedAt: t })
    }
    if (row.version !== known) return res.status(409).json({ version: row.version, updatedAt: row.updated_at })
    const r = q.upd.run(blob, blob.length, t, req.params.id, known)
    if (!r.changes) {
      const cur = q.get.get(req.params.id)
      return res.status(409).json({ version: cur?.version ?? 0, updatedAt: cur?.updated_at ?? null })
    }
    total += blob.length - row.blob.length
    res.json({ version: known + 1, updatedAt: t })
  })

  router.delete('/sync/:id', checkId, (req, res) => {
    q.metaDel.run(req.params.id)
    q.del.run(req.params.id)
    totalAt = -Infinity
    res.json({ ok: true })
  })

  /** Testlər / planlayıcı üçün: köhnə və oxunmamış blokları dərhal təmizlə */
  router.gcNow = () => { lastGc = -Infinity; gc() }
  return router
}

module.exports = { createSyncRouter, ID_RE, MAX_BLOB, NEW_IDS_PER_DAY, NEW_BYTES_PER_DAY, UNREAD_TTL_MS }
