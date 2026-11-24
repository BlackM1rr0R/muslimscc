// ═══════════════════════════════════════════════════════════════════════
// Məscid könüllüləri lövhəsi — /volunteers
//
// • Ehtiyacı yalnız (a) rolu mosque_rep olan hesab — ÖZ məscidi üçün (mosque_id HƏMİŞƏ req.user.mosque_id,
//   sorğudan götürülmür), (b) saytın admini (rol admin / superadmin) — istənilən məscid üçün (mosqueId gövdədə)
//   yerləşdirir: başlıq, tarix + saat, lazım olan yer sayı (1–50), təsvir.
// • Girişli istifadəçi yazılır / yazılışı ləğv edir. Nümayəndə yalnız ÖZ məscidinin ehtiyaclarında yazılanların
//   adını və (könüllü SEÇİBSƏ — "e-poçtumu göstər" + razılıq) e-poçtunu görür. İctimai görünüş YALNIZ
//   "M yerdən N-i dolub" — ad yoxdur, reytinq / lövhə yoxdur.
// • Avtomatik arxiv: tarixi keçmiş ehtiyac siyahıdan çıxır və yazılış qəbul olunmur; 30 gün sonra silinir.
// • Admin paneli (editor+): bütün ehtiyacların siyahısı (yazılanların adı YOX, yalnız say) + silmək.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS); users(id) ON DELETE CASCADE.
//
// Endpoint-lər:
//   GET    /api/volunteers?mosque=            (girişsiz; girişli olanda "signedUp" işarəsi) → { items, mosques }
//   GET    /api/volunteers/mine               (girişli) → { items } — mənim yazılışlarım
//   GET    /api/volunteers/manage             (mosque_rep / admin) → { items (yazılanlarla), mosqueId, canPickMosque, limits }
//   POST   /api/volunteers                    (mosque_rep / admin) → 201 { item }
//   DELETE /api/volunteers/:id                (mosque_rep — öz məscidi / admin) → { ok }
//   POST   /api/volunteers/:id/signup         (girişli) { name?, shareEmail?, consent? } → { item }
//   DELETE /api/volunteers/:id/signup         (girişli) → { item }
//   GET    /api/admin/volunteers              (panel, editor+) → { items }
//   DELETE /api/admin/volunteers/:id          (panel, editor+) → { ok }
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const kit = require('./communityKit')

const MOSQUE_RE = /^[A-Za-z0-9_-]{1,64}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u
const MAX_TITLE = 100
const MAX_DESC = 600
const MAX_MOSQUE_NAME = 80
const MAX_VOL_NAME = 40
const MAX_SLOTS = 50
const MAX_DAYS_AHEAD = 90
const MAX_OPEN_PER_MOSQUE = 20
const MAX_PER_DAY = 10
const MAX_SIGNUPS = 10
const KEEP_DAYS = 30
const DAY = 86400000
const ADMIN_ROLES = ['admin', 'superadmin']

const SCHEMA = `
CREATE TABLE IF NOT EXISTS volunteer_needs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mosque_id   TEXT NOT NULL,
  mosque_name TEXT NOT NULL,
  author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  need_date   TEXT NOT NULL,
  need_time   TEXT NOT NULL DEFAULT '',
  slots       INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS volunteer_needs_by_date ON volunteer_needs(need_date);
CREATE INDEX IF NOT EXISTS volunteer_needs_by_mosque ON volunteer_needs(mosque_id, need_date);
CREATE INDEX IF NOT EXISTS volunteer_needs_by_author ON volunteer_needs(author_id, created_at);
CREATE TABLE IF NOT EXISTS volunteer_signups (
  need_id     INTEGER NOT NULL REFERENCES volunteer_needs(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  share_email INTEGER NOT NULL DEFAULT 0,
  consent_at  INTEGER,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (need_id, user_id)
);
CREATE INDEX IF NOT EXISTS volunteer_signups_by_user ON volunteer_signups(user_id, created_at);
`

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)
const addDays = (key, n) => isoDay(Date.parse(key + 'T12:00:00Z') + n * DAY)
const validDate = (s) => typeof s === 'string' && DATE_RE.test(s) && isoDay(Date.parse(s + 'T12:00:00Z')) === s

/** Ehtiyacın yoxlanması → { title, description, date, time, slots, mosqueName } | { error } */
function validNeed(b, today) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return { error: 'bad_request' }
  const title = kit.cleanLine(b.title, MAX_TITLE, { required: true })
  const description = kit.cleanText(b.description, MAX_DESC)
  const mosqueName = kit.cleanLine(b.mosqueName, MAX_MOSQUE_NAME, { required: true })
  if (!title || title.length < 3 || description == null || !mosqueName) return { error: 'bad_request' }
  // Bir gün geriyə dözümlü: brauzerin yerli "bu gün"ü UTC-dən geri ola bilər (Amerika)
  if (!validDate(b.date) || b.date < addDays(today, -1) || b.date > addDays(today, MAX_DAYS_AHEAD)) return { error: 'bad_date' }
  const time = b.time == null || b.time === '' ? '' : (typeof b.time === 'string' && TIME_RE.test(b.time) ? b.time : null)
  if (time == null) return { error: 'bad_time' }
  if (!Number.isInteger(b.slots) || b.slots < 1 || b.slots > MAX_SLOTS) return { error: 'bad_slots' }
  const all = `${title} ${description} ${mosqueName}`
  if (kit.hasLink(all)) return { error: 'links_not_allowed' }
  if (kit.hasPhone(all)) return { error: 'personal_info' }
  return { title, description, date: b.date, time, slots: b.slots, mosqueName }
}

function createVolunteersRouter({ db, requireUser, requireEditor = null, optionalUser = () => null, now = () => Date.now() }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const FILLED = '(SELECT COUNT(*) FROM volunteer_signups s JOIN users su ON su.id = s.user_id AND su.disabled = 0 WHERE s.need_id = n.id)'
  const st = {
    // Bloklanmış müəllifin ehtiyacı siyahıda görünmür
    pub: p(`SELECT n.*, ${FILLED} AS filled FROM volunteer_needs n JOIN users u ON u.id = n.author_id AND u.disabled = 0
      WHERE n.need_date >= ? AND (? = '' OR n.mosque_id = ?) ORDER BY n.need_date, n.need_time, n.id LIMIT 200`),
    mosques: p(`SELECT n.mosque_id, n.mosque_name, COUNT(*) AS c FROM volunteer_needs n JOIN users u ON u.id = n.author_id AND u.disabled = 0
      WHERE n.need_date >= ? GROUP BY n.mosque_id ORDER BY n.mosque_name LIMIT 200`),
    get: p(`SELECT n.*, ${FILLED} AS filled FROM volunteer_needs n WHERE n.id = ?`),
    author: p('SELECT disabled FROM users WHERE id = ?'),
    byMosque: p(`SELECT n.*, ${FILLED} AS filled FROM volunteer_needs n WHERE n.mosque_id = ? ORDER BY n.need_date DESC, n.id DESC LIMIT 100`),
    byAuthor: p(`SELECT n.*, ${FILLED} AS filled FROM volunteer_needs n WHERE n.author_id = ? ORDER BY n.need_date DESC, n.id DESC LIMIT 100`),
    all: p(`SELECT n.*, ${FILLED} AS filled FROM volunteer_needs n ORDER BY n.need_date DESC, n.id DESC LIMIT 300`),
    openOf: p('SELECT COUNT(*) AS n FROM volunteer_needs WHERE mosque_id = ? AND need_date >= ?'),
    todayBy: p('SELECT COUNT(*) AS n FROM volunteer_needs WHERE author_id = ? AND created_at > ?'),
    add: p(`INSERT INTO volunteer_needs (mosque_id, mosque_name, author_id, title, description, need_date, need_time, slots, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    del: p('DELETE FROM volunteer_needs WHERE id = ?'),
    signupsOf: p(`SELECT s.name, s.share_email, s.created_at, u.email FROM volunteer_signups s JOIN users u ON u.id = s.user_id AND u.disabled = 0
      WHERE s.need_id = ? ORDER BY s.created_at`),
    mySignup: p('SELECT 1 FROM volunteer_signups WHERE need_id = ? AND user_id = ?'),
    mySignupIds: p('SELECT need_id FROM volunteer_signups WHERE user_id = ?'),
    myActive: p(`SELECT COUNT(*) AS n FROM volunteer_signups s JOIN volunteer_needs n ON n.id = s.need_id WHERE s.user_id = ? AND n.need_date >= ?`),
    signup: p('INSERT OR IGNORE INTO volunteer_signups (need_id, user_id, name, share_email, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
    cancel: p('DELETE FROM volunteer_signups WHERE need_id = ? AND user_id = ?'),
    mine: p(`SELECT n.*, ${FILLED} AS filled, s.name AS my_name, s.share_email AS my_share, s.created_at AS signed_at FROM volunteer_signups s
      JOIN volunteer_needs n ON n.id = s.need_id WHERE s.user_id = ? ORDER BY n.need_date DESC LIMIT 100`),
    purge: p('DELETE FROM volunteer_needs WHERE need_date < ?'),
    needsBy: p('SELECT id, mosque_id, mosque_name, title, need_date, created_at FROM volunteer_needs WHERE author_id = ? ORDER BY created_at DESC'),
  }

  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const manager = requireUser('mosque_rep')
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)
  const today = () => isoDay(now())

  // İctimai: yalnız say ("M yerdən N-i dolub"), heç bir ad yoxdur
  const pubOut = (n, t = today()) => ({
    id: n.id, mosqueId: n.mosque_id, mosqueName: n.mosque_name, title: n.title, description: n.description,
    date: n.need_date, time: n.need_time, slots: n.slots, filled: Math.min(n.filled, n.slots), archived: n.need_date < t,
  })

  /** Kim idarə edir: nümayəndə → yalnız öz məscidi; admin → hamısı; editor və s. → 403 */
  const managerOf = (req, res) => {
    const u = req.user
    if (ADMIN_ROLES.includes(u.role)) return { admin: true, mosqueId: null }
    if (u.role === 'mosque_rep' && u.mosque_id && MOSQUE_RE.test(u.mosque_id)) return { admin: false, mosqueId: u.mosque_id }
    err(res, 403, 'no_mosque', 'No mosque is linked to this account')
    return null
  }
  const mayManage = (m, n) => m.admin || n.mosque_id === m.mosqueId

  router.get('/volunteers', (req, res) => {
    const t = today()
    const mosque = typeof req.query.mosque === 'string' && MOSQUE_RE.test(req.query.mosque) ? req.query.mosque : ''
    const user = optionalUser(req)
    const mineIds = user ? new Set(st.mySignupIds.all(user.id).map((r) => r.need_id)) : null
    res.set({ 'Cache-Control': user ? 'private, no-store' : 'public, max-age=30', 'X-Robots-Tag': 'noindex' })
    res.json({
      items: st.pub.all(t, mosque, mosque).map((n) => ({ ...pubOut(n, t), ...(mineIds ? { signedUp: mineIds.has(n.id) } : {}) })),
      mosques: st.mosques.all(t).map((m) => ({ id: m.mosque_id, name: m.mosque_name, open: m.c })),
    })
  })

  router.get('/volunteers/mine', auth, (req, res) => {
    const t = today()
    res.json({ items: st.mine.all(req.user.id).map((n) => ({ ...pubOut(n, t), myName: n.my_name, shareEmail: n.my_share === 1, signedAt: n.signed_at })) })
  })

  router.get('/volunteers/manage', manager, (req, res) => {
    const m = managerOf(req, res); if (!m) return
    const t = today()
    const rows = m.admin ? st.byAuthor.all(req.user.id) : st.byMosque.all(m.mosqueId)
    res.json({
      mosqueId: m.mosqueId, canPickMosque: m.admin, today: t,
      items: rows.map((n) => ({
        ...pubOut(n, t), createdAt: n.created_at,
        // Ad həmişə; e-poçt YALNIZ könüllü seçibsə
        signups: st.signupsOf.all(n.id).map((s) => ({ name: s.name, email: s.share_email === 1 ? s.email : null, at: s.created_at })),
      })),
      limits: { title: MAX_TITLE, description: MAX_DESC, mosqueName: MAX_MOSQUE_NAME, slots: MAX_SLOTS, daysAhead: MAX_DAYS_AHEAD, open: MAX_OPEN_PER_MOSQUE },
    })
  })

  router.post('/volunteers', manager, json, (req, res) => {
    const m = managerOf(req, res); if (!m) return
    const b = req.body || {}
    let mosqueId = m.mosqueId
    if (m.admin) {
      if (typeof b.mosqueId !== 'string' || !MOSQUE_RE.test(b.mosqueId)) return err(res, 400, 'bad_mosque', 'Invalid mosque')
      mosqueId = b.mosqueId
    }
    const t = now()
    const v = validNeed(b, today())
    if (v.error) return err(res, 400, v.error, 'Not accepted')
    if (st.todayBy.get(req.user.id, t - DAY).n >= MAX_PER_DAY) return err(res, 429, 'daily_limit', 'Daily limit reached')
    if (st.openOf.get(mosqueId, today()).n >= MAX_OPEN_PER_MOSQUE) return err(res, 409, 'too_many', 'Too many open needs')
    const id = Number(st.add.run(mosqueId, v.mosqueName, req.user.id, v.title, v.description, v.date, v.time, v.slots, t).lastInsertRowid)
    res.status(201).json({ item: { ...pubOut(st.get.get(id)), signups: [] } })
  })

  router.delete('/volunteers/:id', manager, (req, res) => {
    const m = managerOf(req, res); if (!m) return
    const id = idOf(req)
    const n = id ? st.get.get(id) : null
    // Başqa məscidin ehtiyacı — 404 (mövcudluğu açılmır)
    if (!n || !mayManage(m, n)) return err(res, 404, 'not_found', 'Not found')
    st.del.run(id)
    res.json({ ok: true })
  })

  router.post('/volunteers/:id/signup', auth, json, (req, res) => {
    const id = idOf(req)
    const t = today()
    const b = req.body || {}
    const r = tx(() => {
      const n = id ? st.get.get(id) : null
      const a = n ? st.author.get(n.author_id) : null
      if (!n || !a || a.disabled) return { status: 404, code: 'not_found' }
      if (n.need_date < t) return { status: 409, code: 'archived' }
      if (st.mySignup.get(id, req.user.id)) return { ok: true, n }
      let name = kit.cleanLine(b.name, MAX_VOL_NAME)
      if (name == null) return { status: 400, code: 'bad_name' }
      if (!name) name = kit.cleanLine(req.user.display_name, MAX_VOL_NAME) || ''
      if (!name || !NAME_RE.test(name)) return { status: 400, code: 'bad_name' }
      if (b.shareEmail != null && typeof b.shareEmail !== 'boolean') return { status: 400, code: 'bad_request' }
      const share = b.shareEmail === true
      // E-poçtu nümayəndəyə göstərmək — açıq razılıq
      if (share && b.consent !== true) return { status: 400, code: 'consent_required' }
      if (n.filled >= n.slots) return { status: 409, code: 'full' }
      if (st.myActive.get(req.user.id, t).n >= MAX_SIGNUPS) return { status: 429, code: 'too_many' }
      st.signup.run(id, req.user.id, name, share ? 1 : 0, share ? now() : null, now())
      return { ok: true }
    })
    if (!r.ok) return err(res, r.status, r.code, 'Not accepted')
    res.json({ item: { ...pubOut(st.get.get(id), t), signedUp: true } })
  })

  router.delete('/volunteers/:id/signup', auth, (req, res) => {
    const id = idOf(req)
    const n = id ? st.get.get(id) : null
    if (!n || !st.cancel.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ item: { ...pubOut(st.get.get(id)), signedUp: false } })
  })

  // ── Admin paneli (editor+): siyahı (adlar YOX, yalnız say) + silmək ──
  if (requireEditor) {
    router.get('/admin/volunteers', ...requireEditor, (req, res) => {
      const t = today()
      res.json({ items: st.all.all().map((n) => ({ ...pubOut(n, t), createdAt: n.created_at })) })
    })
    router.delete('/admin/volunteers/:id', ...requireEditor, (req, res) => {
      const id = idOf(req)
      if (!id || !st.del.run(id).changes) return err(res, 404, 'not_found', 'Not found')
      res.json({ ok: true })
    })
  }

  // eslint-disable-next-line no-unused-vars
  router.use(['/volunteers', '/admin/volunteers'], (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('volunteers error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** Tarixi 30 gündən çox keçmiş ehtiyaclar (yazılışlar CASCADE ilə) */
  router.purge = () => st.purge.run(addDays(today(), -KEEP_DAYS)).changes
  router.exportUser = (uid) => ({
    signups: st.mine.all(uid).map((n) => ({ needId: n.id, mosqueName: n.mosque_name, title: n.title, date: n.need_date, name: n.my_name, shareEmail: n.my_share === 1, at: n.signed_at })),
    needsPosted: st.needsBy.all(uid).map((n) => ({ id: n.id, mosqueId: n.mosque_id, mosqueName: n.mosque_name, title: n.title, date: n.need_date, createdAt: n.created_at })),
  })
  router.summaryUser = (uid) => ({ signups: st.mine.all(uid).length, needsPosted: st.needsBy.all(uid).length })
  return router
}

module.exports = { createVolunteersRouter, validNeed, MAX_SLOTS, MAX_SIGNUPS, MAX_OPEN_PER_MOSQUE, KEEP_DAYS }
