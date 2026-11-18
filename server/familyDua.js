// ═══════════════════════════════════════════════════════════════════════
// K2. Ailə dua siyahısı — ailə dairəsinin içində (server/family.js), YALNIZ dairə üzvlərinə görünür
//
// • Üzv dua istəyi yazır (≤300 simvol, düz mətn — ailə etibarlı, özəl məkandır; sərbəst mətnə icazə var).
// • Digər üzvlər "Sizin üçün dua etdim" toxunur — YALNIZ say (kim etdiyi göstərilmir), hər üzv bir dəfə.
// • İstəyin sahibi "qəbul olundu" işarələyir və ya silir. Dairənin sahibi istənilən istəyi silə bilər;
//   üzvlər uyğunsuz istəyi dairə sahibinə bildirə bilər (sahib bayraq sayını görür).
// • Dairədən çıxan üzvün istəkləri görünmür və saatlıq təmizlikdə silinir (family.js-ə toxunmadan).
// • Ömür: qəbul olunan — 30 gün, qalanı — 90 gün sonra silinir.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS); family_circles / users ON DELETE CASCADE —
// dairə silinəndə (və ya hesab) hamısı silinir. Modul family.js-dən SONRA qurulur.
//
// Endpoint-lər (hamısı requireUser — cookie + CSRF; /api/family limiti altında):
//   GET    /api/family/duas                 → { duas, owner, limits }
//   POST   /api/family/duas                 { body } → 201 { dua }
//   POST   /api/family/duas/:id/pray        → { prayed, prayedByMe }
//   POST   /api/family/duas/:id/answered    { answered } → { ok } (yalnız müəllif)
//   POST   /api/family/duas/:id/report      → { ok } (müəllif olmayan üzv; sahib görür)
//   DELETE /api/family/duas/:id             → { ok } (müəllif və ya dairə sahibi)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const kit = require('./communityKit')
const { personLabel } = require('./family')

const MAX_BODY = 300
const MAX_OPEN_PER_AUTHOR = 20
const MAX_PER_DAY = 10
const MAX_PER_CIRCLE = 100
const ANSWERED_TTL = 30 * 86400000
const OPEN_TTL = 90 * 86400000
const DAY = 86400000

const SCHEMA = `
CREATE TABLE IF NOT EXISTS family_duas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id   INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  answered_at INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS family_duas_by_circle ON family_duas(circle_id, created_at);
CREATE INDEX IF NOT EXISTS family_duas_by_author ON family_duas(author_id, created_at);
CREATE TABLE IF NOT EXISTS family_dua_prayers (
  dua_id     INTEGER NOT NULL REFERENCES family_duas(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (dua_id, user_id)
);
CREATE TABLE IF NOT EXISTS family_dua_reports (
  dua_id     INTEGER NOT NULL REFERENCES family_duas(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (dua_id, user_id)
);
`

function createFamilyDuaRouter({ db, requireUser, now = () => Date.now() }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    membership: p('SELECT m.circle_id, m.role FROM family_members m WHERE m.user_id = ?'),
    // Yalnız müəllifi HƏLƏ dairədə olan istəklər
    list: p(`SELECT d.id, d.author_id, d.body, d.answered_at, d.created_at, u.email, u.display_name,
        (SELECT COUNT(*) FROM family_dua_prayers x WHERE x.dua_id = d.id) AS prayed,
        (SELECT COUNT(*) FROM family_dua_prayers x WHERE x.dua_id = d.id AND x.user_id = ?) AS mine,
        (SELECT COUNT(*) FROM family_dua_reports r WHERE r.dua_id = d.id) AS reports
      FROM family_duas d JOIN users u ON u.id = d.author_id
      JOIN family_members m ON m.user_id = d.author_id AND m.circle_id = d.circle_id
      WHERE d.circle_id = ? ORDER BY (d.answered_at IS NOT NULL), d.created_at DESC LIMIT ?`),
    get: p(`SELECT d.* FROM family_duas d JOIN family_members m ON m.user_id = d.author_id AND m.circle_id = d.circle_id WHERE d.id = ?`),
    add: p('INSERT INTO family_duas (circle_id, author_id, body, created_at) VALUES (?, ?, ?, ?)'),
    todayBy: p('SELECT COUNT(*) AS n FROM family_duas WHERE author_id = ? AND created_at > ?'),
    openBy: p('SELECT COUNT(*) AS n FROM family_duas WHERE author_id = ? AND circle_id = ? AND answered_at IS NULL'),
    trim: p(`DELETE FROM family_duas WHERE circle_id = ? AND id NOT IN
      (SELECT id FROM family_duas WHERE circle_id = ? ORDER BY (answered_at IS NOT NULL), created_at DESC LIMIT ?)`),
    pray: p('INSERT OR IGNORE INTO family_dua_prayers (dua_id, user_id, created_at) VALUES (?, ?, ?)'),
    prayedN: p('SELECT COUNT(*) AS n FROM family_dua_prayers WHERE dua_id = ?'),
    answer: p('UPDATE family_duas SET answered_at = ? WHERE id = ? AND author_id = ?'),
    report: p('INSERT OR IGNORE INTO family_dua_reports (dua_id, user_id, created_at) VALUES (?, ?, ?)'),
    del: p('DELETE FROM family_duas WHERE id = ?'),
    purgeOld: p('DELETE FROM family_duas WHERE (answered_at IS NOT NULL AND answered_at <= ?) OR created_at <= ?'),
    // Dairədən çıxanların (və ya başqa dairəyə keçənlərin) istəkləri
    purgeLeft: p(`DELETE FROM family_duas WHERE NOT EXISTS
      (SELECT 1 FROM family_members m WHERE m.user_id = family_duas.author_id AND m.circle_id = family_duas.circle_id)`),
    mine: p('SELECT id, body, answered_at, created_at, (SELECT COUNT(*) FROM family_dua_prayers x WHERE x.dua_id = family_duas.id) AS prayed FROM family_duas WHERE author_id = ? ORDER BY created_at DESC'),
    prayedByUser: p('SELECT COUNT(*) AS n FROM family_dua_prayers WHERE user_id = ?'),
    reportedByUser: p('SELECT COUNT(*) AS n FROM family_dua_reports WHERE user_id = ?'),
  }
  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)

  /** Üzvlük + istək (eyni dairədə) — yoxsa 404 */
  function scoped(req, res) {
    const m = st.membership.get(req.user.id)
    if (!m) { err(res, 404, 'not_found', 'Not in a family circle'); return null }
    const id = idOf(req)
    const d = id ? st.get.get(id) : null
    if (!d || d.circle_id !== m.circle_id) { err(res, 404, 'not_found', 'Not found'); return null }
    return { m, d }
  }

  router.get('/family/duas', auth, (req, res) => {
    const uid = req.user.id
    const m = st.membership.get(uid)
    if (!m) return err(res, 404, 'not_found', 'Not in a family circle')
    const owner = m.role === 'owner'
    res.json({
      owner,
      duas: st.list.all(uid, m.circle_id, MAX_PER_CIRCLE).map((r) => ({
        id: r.id, author: personLabel(r), self: r.author_id === uid, body: r.body,
        answered: r.answered_at != null, answeredAt: r.answered_at || null, createdAt: r.created_at,
        prayed: r.prayed, prayedByMe: r.mine > 0, ...(owner ? { reports: r.reports } : {}),
      })),
      limits: { body: MAX_BODY, perDay: MAX_PER_DAY },
    })
  })

  router.post('/family/duas', auth, json, (req, res) => {
    const uid = req.user.id
    const m = st.membership.get(uid)
    if (!m) return err(res, 404, 'not_found', 'Not in a family circle')
    const body = kit.cleanText((req.body || {}).body, MAX_BODY, { required: true })
    if (!body) return err(res, 400, 'bad_request', 'Invalid text')
    const t = now()
    if (st.todayBy.get(uid, t - DAY).n >= MAX_PER_DAY) return err(res, 429, 'rate_limited', 'Too many today')
    if (st.openBy.get(uid, m.circle_id).n >= MAX_OPEN_PER_AUTHOR) return err(res, 409, 'too_many', 'Too many open requests')
    const id = tx(() => {
      const r = Number(st.add.run(m.circle_id, uid, body, t).lastInsertRowid)
      st.trim.run(m.circle_id, m.circle_id, MAX_PER_CIRCLE)
      return r
    })
    res.status(201).json({ dua: { id, body, self: true, answered: false, createdAt: t, prayed: 0, prayedByMe: false } })
  })

  router.post('/family/duas/:id/pray', auth, (req, res) => {
    const s = scoped(req, res); if (!s) return
    if (s.d.author_id === req.user.id) return err(res, 400, 'own', 'Own request')
    st.pray.run(s.d.id, req.user.id, now())
    res.json({ prayed: st.prayedN.get(s.d.id).n, prayedByMe: true })
  })

  router.post('/family/duas/:id/answered', auth, json, (req, res) => {
    const s = scoped(req, res); if (!s) return
    if (s.d.author_id !== req.user.id) return err(res, 403, 'author_only', 'Only the author can do this')
    const on = (req.body || {}).answered
    if (typeof on !== 'boolean') return err(res, 400, 'bad_request', 'Bad request')
    st.answer.run(on ? now() : null, s.d.id, req.user.id)
    res.json({ ok: true })
  })

  router.post('/family/duas/:id/report', auth, (req, res) => {
    const s = scoped(req, res); if (!s) return
    if (s.d.author_id === req.user.id) return err(res, 400, 'own', 'Own request')
    st.report.run(s.d.id, req.user.id, now())
    res.json({ ok: true })
  })

  router.delete('/family/duas/:id', auth, (req, res) => {
    const s = scoped(req, res); if (!s) return
    if (s.d.author_id !== req.user.id && s.m.role !== 'owner') return err(res, 403, 'forbidden', 'Forbidden')
    st.del.run(s.d.id)
    res.json({ ok: true })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/family/duas', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('family dua error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  router.purge = () => {
    const t = now()
    return st.purgeOld.run(t - ANSWERED_TTL, t - OPEN_TTL).changes + st.purgeLeft.run().changes
  }
  /** "Mənim məlumatlarım": yazdığınız istəklər (başqalarının istəkləri — onların məlumatıdır) */
  router.exportUser = (uid) => ({
    requests: st.mine.all(uid).map((r) => ({ id: r.id, body: r.body, answeredAt: r.answered_at || null, createdAt: r.created_at, prayed: r.prayed })),
    prayedFor: st.prayedByUser.get(uid).n, reported: st.reportedByUser.get(uid).n,
  })
  router.summaryUser = (uid) => ({ requests: st.mine.all(uid).length, prayedFor: st.prayedByUser.get(uid).n })
  return router
}

module.exports = { createFamilyDuaRouter, MAX_BODY, MAX_PER_DAY, MAX_OPEN_PER_AUTHOR, ANSWERED_TTL, OPEN_TTL }
