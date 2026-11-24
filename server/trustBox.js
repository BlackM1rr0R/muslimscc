// ═══════════════════════════════════════════════════════════════════════
// "Əmanət qutusu" (Trust box) — vəsiyyət qeydləri, borclar, sənədlərin yeri, ailəyə son sözlər
//
// • UCDAN-UCA ŞİFRƏLİ: brauzer məzmunu sahibin ayrıca "əmanət parolu"ndan PBKDF2-SHA256 (≥ 600 000 dövr)
//   ilə alınan AES-256-GCM açarı ilə şifrələyir (src/utils/trustBoxCrypto.js). Server yalnız
//   { salt, blob } saxlayır — parolu da, açıq mətni də HEÇ VAXT görmür. Gövdədə başqa sahə → 400.
// • Paylaşma: sahib bir etibarlı şəxsə (a) gizli keçid, (b) kağızda parol verir. Keçid tokeni (32 bayt)
//   BRAUZERDƏ yaranır; serverə yalnız onun SHA-256 heşi gəlir (linkHash). Etibarlı şəxs keçidi açır —
//   token URL fraqmentindədir (#t=…), serverə POST gövdəsində gedir (nginx loguna düşmür).
// • Kobud güc: token 256 bit (təxmin olunmur) + /open IP heşi üzrə limit (yaddaşda, IP saxlanmır).
//   Parol isə yalnız brauzerdə yoxlanır (GCM) — buna görə PBKDF2 yavaşdır və klient güclü parol tələb edir.
// • Ölçü: blob ≤ MAX_BLOB simvol (base64url); bir istifadəçiyə bir qutu.
// • Silmə: DELETE /api/trust-box; hesab silinəndə users(id) ON DELETE CASCADE. İxrac: ciphertext (heş YOX).
//
// Cədvəl MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS).
//
// Endpoint-lər (requireUser — cookie + CSRF; /api/trust-box limiti):
//   GET    /api/trust-box        → { box: null | { salt, blob, hasLink, version, createdAt, updatedAt, lastOpenedAt }, maxBlob }
//   PUT    /api/trust-box        { salt, blob, linkHash?: hex64|null, ifVersion?: int } → { box }
//                                (linkHash: yoxdur — dəyişmir; null — keçid ləğv; hex64 — yeni keçid)
//   DELETE /api/trust-box/link   → { box } (keçid ləğv)
//   DELETE /api/trust-box        → { ok } (hər şey silinir)
//   POST   /api/trust-box/open   { token } → { salt, blob, updatedAt } (girişsiz; CSRF; IP heşi üzrə limit)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const { csrfRejected } = require('./auth')
const { createIpKeyer } = require('./ipKey')

const MAX_BLOB = 262144                          // base64url simvol (~192 KB şifrəli mətn)
const MIN_ITER = 600000
const MAX_ITER = 10000000
const BLOB_VERSION = 1
const SALT_RE = /^pbkdf2-sha256\$(\d{6,8})\$([A-Za-z0-9_-]{22})$/
const BLOB_RE = /^[A-Za-z0-9_-]+$/
const HASH_RE = /^[0-9a-f]{64}$/
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const OPEN_LIMIT = { max: 20, windowMs: 15 * 60e3 }   // IP heşi üzrə
const BODY_KEYS = new Set(['salt', 'blob', 'linkHash', 'ifVersion'])
const DAY = 86400000

const SCHEMA = `
CREATE TABLE IF NOT EXISTS trust_boxes (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  salt           TEXT NOT NULL,
  blob           TEXT NOT NULL,
  link_hash      TEXT UNIQUE,
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  last_opened_at INTEGER
);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')

/** salt sətri düzgündür? (dövr sayı hədd daxilində, duz 16 bayt) */
function validSalt(s) {
  const m = typeof s === 'string' ? SALT_RE.exec(s) : null
  if (!m) return false
  const n = Number(m[1])
  return n >= MIN_ITER && n <= MAX_ITER
}
/** blob: base64url( 1 bayt versiya | 12 bayt IV | şifrəli mətn + 16 bayt GCM teqi ) */
function validBlob(s) {
  if (typeof s !== 'string' || s.length < 40 || s.length > MAX_BLOB || !BLOB_RE.test(s)) return false
  const head = Buffer.from(s.slice(0, 4), 'base64url')
  return head[0] === BLOB_VERSION
}

function createTrustBoxRouter({ db, requireUser, allowedOrigins = [], now = () => Date.now(), openLimit = OPEN_LIMIT, log = console }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const p = (sql) => raw.prepare(sql)
  const st = {
    mine: p('SELECT * FROM trust_boxes WHERE user_id = ?'),
    insert: p(`INSERT INTO trust_boxes (user_id, salt, blob, link_hash, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)`),
    update: p('UPDATE trust_boxes SET salt = ?, blob = ?, link_hash = ?, version = version + 1, updated_at = ? WHERE user_id = ?'),
    setLink: p('UPDATE trust_boxes SET link_hash = ?, version = version + 1, updated_at = ? WHERE user_id = ?'),
    hashOwner: p('SELECT user_id FROM trust_boxes WHERE link_hash = ?'),
    byHash: p('SELECT salt, blob, updated_at, user_id, last_opened_at FROM trust_boxes WHERE link_hash = ?'),
    opened: p('UPDATE trust_boxes SET last_opened_at = ? WHERE user_id = ?'),
    del: p('DELETE FROM trust_boxes WHERE user_id = ?'),
  }
  const router = express.Router()
  const json = express.json({ limit: '300kb' })
  const small = express.json({ limit: '1kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const csrf = (req, res, next) => (csrfRejected(req, allowedOrigins) ? err(res, 403, 'forbidden', 'Forbidden') : next())
  const ipKey = createIpKeyer()
  const hits = new Map()
  function limited(key) {
    const t = now()
    const list = (hits.get(key) || []).filter((x) => t - x < openLimit.windowMs)
    const over = list.length >= openLimit.max
    if (!over) list.push(t)
    hits.set(key, list)
    if (hits.size > 20000) hits.clear()
    return over
  }

  /** Sahib üçün görünüş (link heşi YOX — yalnız var/yox) */
  const out = (b) => (b ? {
    salt: b.salt, blob: b.blob, hasLink: Boolean(b.link_hash), version: b.version,
    createdAt: b.created_at, updatedAt: b.updated_at, lastOpenedAt: b.last_opened_at || null,
  } : null)

  router.use('/trust-box', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.get('/trust-box', auth, (req, res) => {
    res.json({ box: out(st.mine.get(req.user.id)), maxBlob: MAX_BLOB })
  })

  router.put('/trust-box', auth, json, (req, res) => {
    const b = req.body
    if (!b || typeof b !== 'object' || Array.isArray(b)) return err(res, 400, 'bad_request', 'Bad request')
    // Yalnız şifrəli forma qəbul olunur — açıq mətn sahəsi (məs. "will", "text") gəlsə rədd
    if (Object.keys(b).some((k) => !BODY_KEYS.has(k))) return err(res, 400, 'bad_request', 'Unexpected field')
    if (!validSalt(b.salt)) return err(res, 400, 'bad_salt', 'Invalid salt')
    if (typeof b.blob === 'string' && b.blob.length > MAX_BLOB) return err(res, 413, 'too_large', 'Payload too large')
    if (!validBlob(b.blob)) return err(res, 400, 'bad_blob', 'Invalid ciphertext')
    if (b.linkHash !== undefined && b.linkHash !== null && !(typeof b.linkHash === 'string' && HASH_RE.test(b.linkHash))) {
      return err(res, 400, 'bad_link', 'Invalid link')
    }
    if (b.ifVersion !== undefined && !(Number.isInteger(b.ifVersion) && b.ifVersion >= 0)) return err(res, 400, 'bad_request', 'Bad request')
    const uid = req.user.id
    const cur = st.mine.get(uid)
    if (b.ifVersion !== undefined && (cur ? cur.version : 0) !== b.ifVersion) {
      return res.status(409).json({ error: 'Changed elsewhere', code: 'conflict', box: out(cur) })
    }
    if (typeof b.linkHash === 'string') {
      const owner = st.hashOwner.get(b.linkHash)
      if (owner && owner.user_id !== uid) return err(res, 409, 'link_taken', 'Link collision')
    }
    const t = now()
    const linkHash = b.linkHash === undefined ? (cur ? cur.link_hash : null) : b.linkHash
    try {
      if (cur) st.update.run(b.salt, b.blob, linkHash, t, uid)
      else st.insert.run(uid, b.salt, b.blob, linkHash, t, t)
    } catch (e) {
      if (/UNIQUE/i.test(String(e && e.message))) return err(res, 409, 'link_taken', 'Link collision')
      throw e
    }
    res.json({ box: out(st.mine.get(uid)) })
  })

  router.delete('/trust-box/link', auth, (req, res) => {
    const uid = req.user.id
    if (!st.mine.get(uid)) return err(res, 404, 'not_found', 'No trust box')
    st.setLink.run(null, now(), uid)
    res.json({ box: out(st.mine.get(uid)) })
  })

  router.delete('/trust-box', auth, (req, res) => {
    st.del.run(req.user.id)
    res.json({ ok: true })
  })

  router.post('/trust-box/open', csrf, (req, res, next) => {
    if (limited(ipKey(req))) { res.set('Retry-After', String(Math.ceil(openLimit.windowMs / 1000))); return err(res, 429, 'rate_limited', 'Too many requests') }
    next()
  }, small, (req, res) => {
    const b = req.body || {}
    const row = typeof b.token === 'string' && TOKEN_RE.test(b.token) ? st.byHash.get(sha256(b.token)) : null
    if (!row) return err(res, 404, 'invalid_token', 'Invalid link')
    // Sahibə yalnız gün dəqiqliyi ilə "son açılış" (IP, cihaz YOX)
    const day = Math.floor(now() / DAY) * DAY
    if (row.last_opened_at !== day) { try { st.opened.run(day, row.user_id) } catch { /* */ } }
    res.json({ salt: row.salt, blob: row.blob, updatedAt: row.updated_at })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/trust-box', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    log.error('trust box error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** "Mənim məlumatlarım": şifrəli blok olduğu kimi (açmaq üçün parol lazımdır); keçid heşi YOX */
  router.exportUser = (uid) => ({ box: out(st.mine.get(uid)) })
  router.summaryUser = (uid) => { const b = st.mine.get(uid); return { exists: Boolean(b), hasLink: Boolean(b && b.link_hash) } }
  router.deleteUserData = (uid) => st.del.run(uid).changes
  return router
}

module.exports = { createTrustBoxRouter, MAX_BLOB, MIN_ITER, MAX_ITER, OPEN_LIMIT, validSalt, validBlob }
