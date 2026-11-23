// ═══════════════════════════════════════════════════════════════════════
// P3.2 Həcc ailə izləyicisi — zəvvar (hesab) "Həcc səfəri" açır, mərhələləri özü toxunur; ailə canlı görür
//
// • Mərhələlər SABİT siyahıdır (Həcc / Ümrə) — sərbəst mətn yoxdur (yalnız istəyə bağlı qısa ad ≤ 40,
//   keçid baxanlarına göstərilir). Mərhələyə uyğun dua klientdə saytın Hisnul-Müslim məlumatından gəlir.
// • YER (koordinat, şəhər, IP) HEÇ VAXT saxlanmır və göndərilmir.
// • Paylaşma: (1) zəvvarın mövcud ailə dairəsi (server/family.js) — dairə üzvləri GET /api/hajj-journey/family;
//   (2) geri alına bilən gizli keçid — 32 bayt token, bazada yalnız SHA-256, URL fraqmentində (#h=…),
//   serverə POST gövdəsində gəlir (nginx loguna düşmür). Yeni keçid köhnəsini ləğv edir.
// • Fasilə: baxanlar yalnız "paylaşma dayandırılıb" görür (mərhələ YOX). Dayandır = səfəri sil.
// • Canlı: polling + ETag (W/"…versiya…") → 304, mosqueRep.js kimi. SSE yox (nginx konfiqi dəyişmir).
// • Ömür: açılandan 30 gün sonra avtomatik silinir (purge). Serverdə oxunan məlumatdır → açıq razılıq.
//
// Cədvəl MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS); users(id) ON DELETE CASCADE. family.js-dən SONRA qurulur.
//
// Endpoint-lər (requireUser — cookie + CSRF; /api/hajj-journey limiti):
//   GET    /api/hajj-journey               → { journey | null, stages, inCircle }
//   POST   /api/hajj-journey               { kind, consent: true, name?, family? } → 201 { journey }
//   PUT    /api/hajj-journey/stage         { stage } → { journey }
//   PUT    /api/hajj-journey/share         { family?, paused? } → { journey }
//   POST   /api/hajj-journey/link          → 201 { token, journey } (köhnə keçid ləğv olunur)
//   DELETE /api/hajj-journey/link          → { journey }
//   DELETE /api/hajj-journey               → { ok } (paylaşmanı dayandır və sil)
//   GET    /api/hajj-journey/family        → { journeys:[…] } (ETag) — dairədəki digər zəvvarlar
//   POST   /api/hajj-journey/view          { token } → { journey } (girişsiz; CSRF; IP heşi üzrə limit; If-None-Match → 304)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const kit = require('./communityKit')
const { csrfRejected } = require('./auth')
const { personLabel } = require('./family')
const { createIpKeyer } = require('./ipKey')

const STAGES = {
  hajj: ['ihram', 'arrive_makkah', 'tawaf_qudum', 'sai', 'mina_8', 'arafah', 'muzdalifah', 'jamarat', 'hady', 'halq', 'tawaf_ifadah', 'tawaf_wada'],
  umrah: ['ihram', 'arrive_makkah', 'tawaf', 'sai', 'halq'],
}
const KINDS = Object.keys(STAGES)
const TTL_MS = 30 * 86400000
const MAX_NAME = 40
const MAX_HISTORY = 40
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const VIEW_LIMIT = { max: 120, windowMs: 10 * 60e3 }   // IP heşi üzrə (30 s polling ≈ 20 / 10 dəq)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS hajj_journeys (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('hajj','umrah')),
  name         TEXT NOT NULL DEFAULT '',
  stage        TEXT,
  stage_at     INTEGER,
  history      TEXT NOT NULL DEFAULT '[]',
  share_family INTEGER NOT NULL DEFAULT 0,
  paused       INTEGER NOT NULL DEFAULT 0,
  link_hash    TEXT UNIQUE,
  version      INTEGER NOT NULL DEFAULT 1,
  consent_at   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS hajj_journeys_exp ON hajj_journeys(expires_at);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const parse = (s) => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : [] } catch { return [] } }

function createHajjJourneyRouter({ db, requireUser, allowedOrigins = [], now = () => Date.now(), viewLimit = VIEW_LIMIT, log = console }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const p = (sql) => raw.prepare(sql)
  const st = {
    mine: p('SELECT * FROM hajj_journeys WHERE user_id = ? AND expires_at > ?'),
    insert: p(`INSERT INTO hajj_journeys (user_id, kind, name, share_family, consent_at, created_at, updated_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
    delExpiredOf: p('DELETE FROM hajj_journeys WHERE user_id = ? AND expires_at <= ?'),
    setStage: p('UPDATE hajj_journeys SET stage = ?, stage_at = ?, history = ?, version = version + 1, updated_at = ? WHERE id = ?'),
    setShare: p('UPDATE hajj_journeys SET share_family = ?, paused = ?, version = version + 1, updated_at = ? WHERE id = ?'),
    setLink: p('UPDATE hajj_journeys SET link_hash = ?, version = version + 1, updated_at = ? WHERE id = ?'),
    del: p('DELETE FROM hajj_journeys WHERE user_id = ?'),
    byHash: p('SELECT * FROM hajj_journeys WHERE link_hash = ? AND expires_at > ?'),
    circleOf: p('SELECT circle_id FROM family_members WHERE user_id = ?'),
    family: p(`SELECT j.*, u.email, u.display_name FROM hajj_journeys j
      JOIN family_members m ON m.user_id = j.user_id JOIN users u ON u.id = j.user_id
      WHERE m.circle_id = ? AND j.user_id != ? AND j.share_family = 1 AND j.expires_at > ? ORDER BY j.id`),
    purge: p('DELETE FROM hajj_journeys WHERE expires_at <= ?'),
  }
  const router = express.Router()
  const json = express.json({ limit: '2kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const csrf = (req, res, next) => (csrfRejected(req, allowedOrigins) ? err(res, 403, 'forbidden', 'Forbidden') : next())
  const ipKey = createIpKeyer()
  const hits = new Map()
  function limited(key) {
    const t = now()
    const list = (hits.get(key) || []).filter((x) => t - x < viewLimit.windowMs)
    const over = list.length >= viewLimit.max
    if (!over) list.push(t)
    hits.set(key, list)
    if (hits.size > 20000) hits.clear()
    return over
  }

  const inCircle = (uid) => Boolean(st.circleOf.get(uid))
  /** Sahib üçün tam görünüş */
  const ownOut = (j) => ({
    kind: j.kind, name: j.name, stage: j.stage || null, stageAt: j.stage_at || null, history: parse(j.history),
    family: j.share_family === 1, paused: j.paused === 1, link: Boolean(j.link_hash),
    createdAt: j.created_at, expiresAt: j.expires_at,
  })
  /** Baxan üçün: fasilədə mərhələ və tarixçə YOX */
  const viewOut = (j, label) => (j.paused === 1
    ? { kind: j.kind, name: label, paused: true, expiresAt: j.expires_at }
    : { kind: j.kind, name: label, paused: false, stage: j.stage || null, stageAt: j.stage_at || null, history: parse(j.history), expiresAt: j.expires_at })
  const sendTagged = (req, res, etag, body) => {
    res.set({ ETag: etag, 'Cache-Control': 'private, no-cache' })
    if (String(req.headers['if-none-match'] || '').split(/\s*,\s*/).includes(etag)) return res.status(304).end()
    res.json(body)
  }
  const mine = (uid) => st.mine.get(uid, now())

  router.get('/hajj-journey', auth, (req, res) => {
    const j = mine(req.user.id)
    res.json({ journey: j ? ownOut(j) : null, stages: STAGES, inCircle: inCircle(req.user.id) })
  })

  router.post('/hajj-journey', auth, json, (req, res) => {
    const b = req.body || {}
    const uid = req.user.id
    if (b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    if (!KINDS.includes(b.kind)) return err(res, 400, 'bad_kind', 'Invalid kind')
    if (b.family != null && typeof b.family !== 'boolean') return err(res, 400, 'bad_request', 'Bad request')
    const name = kit.cleanLine(b.name, MAX_NAME)
    if (name === null) return err(res, 400, 'bad_name', 'Invalid name')
    const t = now()
    st.delExpiredOf.run(uid, t)
    if (mine(uid)) return err(res, 409, 'exists', 'A journey is already active')
    st.insert.run(uid, b.kind, name, b.family ? 1 : 0, t, t, t, t + TTL_MS)
    res.status(201).json({ journey: ownOut(mine(uid)) })
  })

  router.put('/hajj-journey/stage', auth, json, (req, res) => {
    const j = mine(req.user.id)
    if (!j) return err(res, 404, 'not_found', 'No active journey')
    const stage = (req.body || {}).stage
    if (typeof stage !== 'string' || !STAGES[j.kind].includes(stage)) return err(res, 400, 'bad_stage', 'Invalid stage')
    if (stage === j.stage) return res.json({ journey: ownOut(j) })
    const t = now()
    const history = [...parse(j.history), { s: stage, at: t }].slice(-MAX_HISTORY)
    st.setStage.run(stage, t, JSON.stringify(history), t, j.id)
    res.json({ journey: ownOut(mine(req.user.id)) })
  })

  router.put('/hajj-journey/share', auth, json, (req, res) => {
    const j = mine(req.user.id)
    if (!j) return err(res, 404, 'not_found', 'No active journey')
    const b = req.body || {}
    if ((b.family != null && typeof b.family !== 'boolean') || (b.paused != null && typeof b.paused !== 'boolean')) return err(res, 400, 'bad_request', 'Bad request')
    const family = b.family == null ? j.share_family : b.family ? 1 : 0
    const paused = b.paused == null ? j.paused : b.paused ? 1 : 0
    st.setShare.run(family, paused, now(), j.id)
    res.json({ journey: ownOut(mine(req.user.id)) })
  })

  router.post('/hajj-journey/link', auth, (req, res) => {
    const j = mine(req.user.id)
    if (!j) return err(res, 404, 'not_found', 'No active journey')
    const token = crypto.randomBytes(32).toString('base64url')
    st.setLink.run(sha256(token), now(), j.id)
    res.status(201).json({ token, journey: ownOut(mine(req.user.id)) })
  })

  router.delete('/hajj-journey/link', auth, (req, res) => {
    const j = mine(req.user.id)
    if (!j) return err(res, 404, 'not_found', 'No active journey')
    st.setLink.run(null, now(), j.id)
    res.json({ journey: ownOut(mine(req.user.id)) })
  })

  router.delete('/hajj-journey', auth, (req, res) => {
    st.del.run(req.user.id)
    res.json({ ok: true })
  })

  router.get('/hajj-journey/family', auth, (req, res) => {
    const uid = req.user.id
    const c = st.circleOf.get(uid)
    const rows = c ? st.family.all(c.circle_id, uid, now()) : []
    const etag = `W/"hf${c ? c.circle_id : 0}-${rows.map((r) => `${r.id}.${r.version}`).join('_')}"`
    sendTagged(req, res, etag, { inCircle: Boolean(c), journeys: rows.map((r) => ({ id: r.id, ...viewOut(r, personLabel(r)) })) })
  })

  router.post('/hajj-journey/view', csrf, json, (req, res) => {
    res.set('Cache-Control', 'no-store')
    if (limited(ipKey(req))) return err(res, 429, 'rate_limited', 'Too many requests')
    const b = req.body || {}
    const j = typeof b.token === 'string' && TOKEN_RE.test(b.token) ? st.byHash.get(sha256(b.token), now()) : null
    if (!j) return err(res, 404, 'invalid_token', 'Invalid link')
    sendTagged(req, res, `W/"hl${j.id}-${j.version}"`, { journey: viewOut(j, j.name) })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/hajj-journey', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    log.error('hajj journey error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** 30 günü keçmiş səfərlər */
  router.purge = () => st.purge.run(now()).changes
  /** "Mənim məlumatlarım" (token heşi YOX) */
  router.exportUser = (uid) => { const j = mine(uid); return j ? { journey: ownOut(j) } : { journey: null } }
  router.summaryUser = (uid) => ({ active: Boolean(mine(uid)) })
  return router
}

module.exports = { createHajjJourneyRouter, STAGES, KINDS, TTL_MS, MAX_NAME, VIEW_LIMIT }
