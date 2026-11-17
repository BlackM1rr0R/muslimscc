// ═══════════════════════════════════════════════════════════════════════
// Hesaba bağlı, UÇDAN-UCA şifrəli sinxronizasiya — açar "qabları" (server/sync.js-in üstündə)
//
// Məlumatın kök sirri — mövcud bərpa kodu (brauzerdə yaradılır, src/utils/syncCrypto.js).
// Blok əvvəlki kimi /api/sync/:id-dədir (server/sync.js). Bu modul yalnız:
//   • user_sync_keys — bərpa kodunun BRAUZERDƏ şifrələnmiş nüsxələri ("wrap"):
//       kind='password' — açar şifrədən PBKDF2-SHA256 (≥600k) ilə brauzerdə alınır;
//       kind='prf'      — açar passkey-in PRF çıxışından (HKDF) alınır, cred_id — passkey id.
//     Server nə şifrəni, nə PRF çıxışını, nə də kodu görür — yalnız { salt, wrapped }.
//   • user_sync_link — hesab ↔ blok id-si (HKDF(kod) → 64 hex). Hesab silinəndə blok da silinir.
//
//   GET    /api/auth/sync-keys              → { keys: [{ kind, credId, salt, wrapped, createdAt }], syncId }
//   PUT    /api/auth/sync-keys              { kind, credId?, salt, wrapped } → { ok }
//   DELETE /api/auth/sync-keys/:kind[/:credId] → { ok, removed }
//   GET    /api/auth/sync-link              → { syncId, linkedAt } (bağlantı yoxdursa syncId: null)
//   PUT    /api/auth/sync-link              { syncId } → { ok }
//   DELETE /api/auth/sync-link              → { ok }
//   POST   /api/auth/sync-keys/check-password { password } → { ok } | 400 wrong_password
//          Hesab səhifəsində kodu şifrə ilə qablamazdan ƏVVƏL: səhv yazılmış şifrə ilə qab
//          yaradılmasın (sonra heç bir cihaz aça bilməzdi). Limit: istifadəçi üzrə 5 səhv / 15 dəq.
// Hamısı requireUser (cookie + CSRF: X-Requested-With, Origin) — server/users.js ilə eyni qayda.
// wrapped / salt dəyərləri HEÇ VAXT loga yazılmır.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır) — köhnə kod bu
// cədvəllərə toxunmur, geri qaytarma pozulmur (2026-11-04 dərsi). Modul server.js-in
// əvvəlcədən yükləmə siyahısındadır.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const auth = require('./auth')

const KINDS = ['password', 'prf']
// salt: "pbkdf2-sha256$600000$<b64url>" və ya "hkdf-sha256$<b64url>" (klient formatı); serverə fərqi yoxdur
const SALT_RE = /^[A-Za-z0-9$_-]{8,200}$/
const WRAPPED_RE = /^[A-Za-z0-9_-]{40,512}$/
const CRED_RE = /^[A-Za-z0-9_-]{1,1400}$/
const SYNC_ID_RE = /^[0-9a-f]{64}$/
const MAX_PRF_KEYS = 20

const SCHEMA = `
CREATE TABLE IF NOT EXISTS user_sync_keys (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('password','prf')),
  cred_id    TEXT NOT NULL DEFAULT '',
  salt       TEXT NOT NULL,
  wrapped    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, cred_id)
);
CREATE TABLE IF NOT EXISTS user_sync_link (
  user_id   INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sync_id   TEXT NOT NULL,
  linked_at INTEGER NOT NULL
);
`

function createSyncKeysStore(db) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const p = (sql) => raw.prepare(sql)
  const st = {
    list: p('SELECT kind, cred_id, salt, wrapped, created_at FROM user_sync_keys WHERE user_id = ? ORDER BY kind, created_at'),
    upsert: p(`INSERT INTO user_sync_keys (user_id, kind, cred_id, salt, wrapped, created_at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, kind, cred_id) DO UPDATE SET salt = excluded.salt, wrapped = excluded.wrapped, created_at = excluded.created_at`),
    del: p('DELETE FROM user_sync_keys WHERE user_id = ? AND kind = ? AND cred_id = ?'),
    delKind: p('DELETE FROM user_sync_keys WHERE user_id = ? AND kind = ?'),
    countKind: p('SELECT COUNT(*) AS n FROM user_sync_keys WHERE user_id = ? AND kind = ?'),
    has: p('SELECT 1 AS x FROM user_sync_keys WHERE user_id = ? AND kind = ? AND cred_id = ?'),
    link: p('SELECT sync_id, linked_at FROM user_sync_link WHERE user_id = ?'),
    setLink: p(`INSERT INTO user_sync_link (user_id, sync_id, linked_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET sync_id = excluded.sync_id, linked_at = excluded.linked_at`),
    delLink: p('DELETE FROM user_sync_link WHERE user_id = ?'),
    // Blok başqa hesaba da bağlı ola bilər (eyni kod iki hesabda) — onda silinmir
    delBlob: p(`DELETE FROM sync_blobs WHERE id = ? AND NOT EXISTS
      (SELECT 1 FROM user_sync_link WHERE sync_id = ? AND user_id <> ?)`),
  }
  return {
    list: (userId) => st.list.all(userId).map((r) => ({ kind: r.kind, credId: r.cred_id, salt: r.salt, wrapped: r.wrapped, createdAt: r.created_at })),
    put: (userId, { kind, credId = '', salt, wrapped }, now = Date.now()) => { st.upsert.run(userId, kind, credId, salt, wrapped, now) },
    has: (userId, kind, credId = '') => Boolean(st.has.get(userId, kind, credId)),
    count: (userId, kind) => st.countKind.get(userId, kind).n,
    remove: (userId, kind, credId) => (credId == null ? st.delKind.run(userId, kind) : st.del.run(userId, kind, credId)).changes,
    getLink: (userId) => { const r = st.link.get(userId); return r ? { syncId: r.sync_id, linkedAt: r.linked_at } : null },
    setLink: (userId, syncId, now = Date.now()) => { st.setLink.run(userId, syncId, now) },
    removeLink: (userId) => st.delLink.run(userId).changes > 0,
    /** Hesab silinməzdən ƏVVƏL: bağlı şifrəli blok da silinsin (cədvəl sətirləri CASCADE ilə gedir). */
    deleteUserData(userId) {
      const l = st.link.get(userId)
      let blob = 0
      if (l) { try { blob = st.delBlob.run(l.sync_id, l.sync_id, userId).changes } catch { /* sync_blobs yoxdursa */ } }
      st.delLink.run(userId)
      st.delKind.run(userId, 'password'); st.delKind.run(userId, 'prf')
      return blob
    },
  }
}

/**
 * opts: store (createSyncKeysStore), requireUser (users router-in requireUser-i),
 *       passkeyIdsOf(userId) → [id] (PRF qabı yalnız istifadəçinin öz passkey-i üçün), now, limits
 */
function createSyncKeysRouter({ store, requireUser, passkeyIdsOf = () => [], now = () => Date.now(), limits = {} }) {
  if (!store || typeof requireUser !== 'function') throw new Error('syncKeys: store və requireUser lazımdır')
  // İstifadəçi üzrə yazı limiti (yaddaşda): 15 dəqiqədə 30 dəyişiklik — normal axında 1–3 olur
  const writes = auth.createFailureLimiter({ max: limits.writes || 30, windowMs: limits.windowMs || 15 * 60 * 1000 })
  const pwFails = auth.createFailureLimiter({ max: limits.passwordFails || 5, windowMs: limits.windowMs || 15 * 60 * 1000 })
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const limited = (req, res) => {
    const k = 'sk:' + req.user.id
    if (writes.blocked(k)) {
      res.set('Retry-After', String(writes.retryAfterSec(k)))
      err(res, 429, 'rate_limited', 'Too many attempts')
      return true
    }
    writes.fail(k)
    return false
  }
  const json = express.json({ limit: '4kb' })
  const router = express.Router()

  router.get('/auth/sync-keys', requireUser(), (req, res) => {
    const l = store.getLink(req.user.id)
    res.json({ keys: store.list(req.user.id), syncId: l ? l.syncId : null })
  })

  router.put('/auth/sync-keys', requireUser(), json, (req, res) => {
    const b = req.body || {}
    const u = req.user
    const kind = b.kind
    const credId = b.credId == null ? '' : b.credId
    if (!KINDS.includes(kind) || typeof credId !== 'string' || typeof b.salt !== 'string' || typeof b.wrapped !== 'string') return err(res, 400, 'bad_request', 'Bad request')
    if (!SALT_RE.test(b.salt) || !WRAPPED_RE.test(b.wrapped)) return err(res, 400, 'bad_request', 'Bad request')
    if (kind === 'password') {
      if (credId !== '') return err(res, 400, 'bad_request', 'Bad request')
      if (!u.pass_hash) return err(res, 400, 'no_password', 'Account has no password')
    } else {
      if (!CRED_RE.test(credId)) return err(res, 400, 'bad_request', 'Bad request')
      if (!passkeyIdsOf(u.id).includes(credId)) return err(res, 404, 'not_found', 'Not found')
      if (!store.has(u.id, 'prf', credId) && store.count(u.id, 'prf') >= MAX_PRF_KEYS) return err(res, 400, 'too_many', 'Too many keys')
    }
    if (limited(req, res)) return
    store.put(u.id, { kind, credId, salt: b.salt, wrapped: b.wrapped }, now())
    res.json({ ok: true })
  })

  const del = (req, res) => {
    const { kind, credId } = req.params
    if (!KINDS.includes(kind) || (credId != null && !CRED_RE.test(credId))) return err(res, 400, 'bad_request', 'Bad request')
    if (limited(req, res)) return
    res.json({ ok: true, removed: store.remove(req.user.id, kind, kind === 'password' ? '' : credId) })
  }
  router.delete('/auth/sync-keys/:kind', requireUser(), del)
  router.delete('/auth/sync-keys/:kind/:credId', requireUser(), del)

  router.post('/auth/sync-keys/check-password', requireUser(), json, async (req, res) => {
    const pw = req.body && req.body.password
    const u = req.user
    if (typeof pw !== 'string' || !pw || pw.length > auth.MAX_PASSWORD) return err(res, 400, 'bad_request', 'Bad request')
    if (!u.pass_hash) return err(res, 400, 'no_password', 'Account has no password')
    const k = 'pw:' + u.id
    if (pwFails.blocked(k)) { res.set('Retry-After', String(pwFails.retryAfterSec(k))); return err(res, 429, 'rate_limited', 'Too many attempts') }
    try {
      if (!(await auth.verifyPassword(pw, u.pass_hash))) { pwFails.fail(k); return err(res, 400, 'wrong_password', 'Wrong password') }
      pwFails.reset(k)
      res.json({ ok: true })
    } catch (e) {
      console.error('sync check-password error:', e && e.message)
      err(res, 500, 'server_error', 'Server error')
    }
  })

  router.get('/auth/sync-link', requireUser(), (req, res) => {
    const l = store.getLink(req.user.id)
    res.json(l || { syncId: null, linkedAt: null })
  })
  router.put('/auth/sync-link', requireUser(), json, (req, res) => {
    const syncId = req.body && req.body.syncId
    if (typeof syncId !== 'string' || !SYNC_ID_RE.test(syncId)) return err(res, 400, 'bad_request', 'Bad request')
    if (limited(req, res)) return
    store.setLink(req.user.id, syncId, now())
    res.json({ ok: true })
  })
  router.delete('/auth/sync-link', requireUser(), (req, res) => {
    if (limited(req, res)) return
    store.removeLink(req.user.id)
    res.json({ ok: true })
  })

  return router
}

module.exports = { createSyncKeysStore, createSyncKeysRouter, KINDS, SALT_RE, WRAPPED_RE, SYNC_ID_RE, MAX_PRF_KEYS }
