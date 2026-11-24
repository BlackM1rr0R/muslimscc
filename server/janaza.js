// ═══════════════════════════════════════════════════════════════════════
// Cənazə elanı — /janaza (gizli keçid; istəyə görə — admin təsdiqindən sonra ictimai siyahı)
//
// • Girişli, e-poçtu TƏSDİQLƏNMİŞ istifadəçi elan yaradır: mərhumun adı, cənazə namazının tarixi (+ istəyə
//   bağlı saat), məscid / yer, istəyə bağlı şəhər, dəfn yeri və ailənin əlaqəsi. Serverdə ŞİFRƏSİZ saxlanır və
//   keçidi olan hər kəs görür → açıq razılıq (consent: true) tələb olunur.
// • Susmaya görə YALNIZ gizli keçid (siyahıda yoxdur, indekslənmir): 32 bayt token, bazada yalnız SHA-256,
//   URL fraqmentində (#n=…), serverə POST gövdəsində gəlir (nginx loguna düşmür). Yeni keçid köhnəsini ləğv edir.
// • İstəyə görə ictimai siyahı: sahibi istəyir → "pending" → admin paneli (editor+) təsdiq / rədd / sil.
//   İctimai siyahıda ailənin əlaqəsi GÖSTƏRİLMİR (yalnız gizli keçiddə). Şikayət (girişli + təsdiqli) →
//   ≥ 3 fərqli sayılan şikayətlə siyahıdan çıxır və yenidən növbəyə düşür.
// • "Dua etdim": anonim say YALNIZ sahibinə (ailəyə) görünür — ictimai say, reytinq YOXDUR. Girişli —
//   bazada (elan başına bir dəfə), girişsiz — yaddaşda (IP-nin prosesə məxsus duzla HMAC-ı, 24 saat; bazaya
//   IP/heş YAZILMIR) + IP limiti.
// • Ömür: siyahıdan namaz tarixindən 7 gün sonra çıxır; gizli keçid 30 gün işləyir, sonra elan SİLİNİR.
// • Dualar klientdə YALNIZ saytın Hisnul-Müslim məlumatından (fəsil 56, 60 — mətn + mənbə); burada dini mətn yoxdur.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS); users(id) ON DELETE CASCADE.
//
// Endpoint-lər:
//   GET    /api/janaza/public                 (girişsiz) → { items }
//   POST   /api/janaza/view   { token }       (girişsiz + CSRF; IP heşi üzrə limit) → { notice }
//   POST   /api/janaza/dua    { token } | { id } (girişli və ya girişsiz + CSRF) → { ok, already }
//   GET    /api/janaza/mine                   (girişli) → { items, limits }
//   POST   /api/janaza                        (girişli + təsdiqli) { …, consent: true } → 201 { notice, token }
//   POST   /api/janaza/:id/link               (girişli, öz) → 201 { token } (köhnə keçid ləğv olunur)
//   PUT    /api/janaza/:id/public { public }  (girişli, öz) → { notice }
//   DELETE /api/janaza/:id                    (girişli, öz) → { ok }
//   POST   /api/janaza/:id/report { reason }  (girişli + təsdiqli; yalnız ictimai elan) → 202
//   GET    /api/admin/janaza?status=          (panel, editor+) → { items, counts, reasons }
//   POST   /api/admin/janaza/:id              { action: approve|reject|delete, reason? } → { ok, counts }
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const kit = require('./communityKit')
const { csrfRejected } = require('./auth')
const { createIpKeyer } = require('./ipKey')

const MAX_NAME = 80
const MAX_PLACE = 120
const MAX_CITY = 60
const MAX_CONTACT = 80
const PER_DAY = 3
const MAX_ACTIVE = 5
const LIST_DAYS = 7
const LINK_DAYS = 30
const PAST_DAYS = 2
const AHEAD_DAYS = 14
const MAX_REPORTS_PER_DAY = 20
const REQUEUE_REPORTS = 3
const COUNTED_REPORTS_PER_DAY = 5
const REPORTER_MIN_AGE_MS = 86400000
const ANON_MAP_CAP = 50000
const DAY = 86400000
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const LANG_RE = /^[a-z]{2,3}$/
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .,()\-‘’ʼ]*$/u
const CONTACT_RE = /^[\p{L}\p{M}\p{N} +()\-.,@_'’]*$/u
const REJECT_REASONS = ['incomplete', 'personal_info', 'inappropriate', 'duplicate', 'other']
const REPORT_REASONS = ['false_info', 'inappropriate', 'personal_info', 'other']
const PUBLIC_STATES = ['none', 'pending', 'approved', 'rejected']

const SCHEMA = `
CREATE TABLE IF NOT EXISTS janaza_notices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  deceased      TEXT NOT NULL,
  prayer_date   TEXT NOT NULL,
  prayer_time   TEXT NOT NULL DEFAULT '',
  place         TEXT NOT NULL,
  city          TEXT NOT NULL DEFAULT '',
  burial        TEXT NOT NULL DEFAULT '',
  contact       TEXT NOT NULL DEFAULT '',
  lang          TEXT NOT NULL,
  public_status TEXT NOT NULL DEFAULT 'none' CHECK (public_status IN ('none','pending','approved','rejected')),
  reason        TEXT,
  reported      INTEGER NOT NULL DEFAULT 0,
  duas          INTEGER NOT NULL DEFAULT 0,
  consent_at    INTEGER NOT NULL,
  created_at    INTEGER NOT NULL,
  decided_at    INTEGER
);
CREATE INDEX IF NOT EXISTS janaza_by_public ON janaza_notices(public_status, prayer_date);
CREATE INDEX IF NOT EXISTS janaza_by_user ON janaza_notices(user_id, created_at);
CREATE TABLE IF NOT EXISTS janaza_duas (
  notice_id  INTEGER NOT NULL REFERENCES janaza_notices(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (notice_id, user_id)
);
CREATE TABLE IF NOT EXISTS janaza_reports (
  notice_id  INTEGER NOT NULL REFERENCES janaza_notices(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (notice_id, user_id)
);
CREATE INDEX IF NOT EXISTS janaza_reports_by_user ON janaza_reports(user_id, created_at);
CREATE TABLE IF NOT EXISTS janaza_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  notice_id INTEGER NOT NULL,
  admin_id  INTEGER,
  action    TEXT NOT NULL,
  reason    TEXT,
  at        INTEGER NOT NULL
);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)
const addDays = (key, n) => isoDay(Date.parse(key + 'T12:00:00Z') + n * DAY)
const validDate = (s) => typeof s === 'string' && DATE_RE.test(s) && isoDay(Date.parse(s + 'T12:00:00Z')) === s

/** Elanın yoxlanması → { deceased, date, time, place, city, burial, contact, lang, wantPublic } | { error } */
function validNotice(b, today) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return { error: 'bad_request' }
  if (b.consent !== true) return { error: 'consent_required' }
  const deceased = kit.cleanLine(b.deceased, MAX_NAME, { required: true })
  if (!deceased || deceased.length < 2 || !NAME_RE.test(deceased)) return { error: 'bad_name' }
  if (!validDate(b.date) || b.date < addDays(today, -PAST_DAYS) || b.date > addDays(today, AHEAD_DAYS)) return { error: 'bad_date' }
  const time = b.time == null || b.time === '' ? '' : (typeof b.time === 'string' && TIME_RE.test(b.time) ? b.time : null)
  if (time == null) return { error: 'bad_time' }
  const place = kit.cleanLine(b.place, MAX_PLACE, { required: true })
  const city = kit.cleanLine(b.city, MAX_CITY)
  const burial = kit.cleanLine(b.burial, MAX_PLACE)
  const contact = kit.cleanLine(b.contact, MAX_CONTACT)
  if (!place || city == null || burial == null || contact == null) return { error: 'bad_request' }
  if (contact && (!CONTACT_RE.test(contact) || /:\/\/|www\./i.test(contact))) return { error: 'bad_contact' }
  const lang = typeof b.lang === 'string' && LANG_RE.test(b.lang) ? b.lang : null
  if (!lang) return { error: 'bad_request' }
  if (b.public != null && typeof b.public !== 'boolean') return { error: 'bad_request' }
  const text = `${deceased} ${place} ${city} ${burial}`
  if (kit.hasLink(text)) return { error: 'links_not_allowed' }
  if (kit.hasPhone(text)) return { error: 'personal_info' }
  return { deceased, date: b.date, time, place, city, burial, contact, lang, wantPublic: b.public === true }
}

function createJanazaRouter({ db, requireUser, requireEditor = null, optionalUser = () => null, allowedOrigins = [], now = () => Date.now(), anonDuaPerHour = 120, viewLimit = { max: 120, windowMs: 10 * 60e3 }, anonMapCap = ANON_MAP_CAP }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    get: p('SELECT * FROM janaza_notices WHERE id = ?'),
    byHash: p(`SELECT n.* FROM janaza_notices n JOIN users u ON u.id = n.user_id AND u.disabled = 0
      WHERE n.token_hash = ? AND n.prayer_date >= ?`),
    pub: p(`SELECT n.* FROM janaza_notices n JOIN users u ON u.id = n.user_id AND u.disabled = 0
      WHERE n.public_status = 'approved' AND n.prayer_date >= ? ORDER BY n.prayer_date ASC, n.prayer_time ASC, n.id ASC LIMIT 100`),
    author: p('SELECT disabled FROM users WHERE id = ?'),
    mine: p('SELECT * FROM janaza_notices WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'),
    today: p('SELECT COUNT(*) AS n FROM janaza_notices WHERE user_id = ? AND created_at > ?'),
    active: p('SELECT COUNT(*) AS n FROM janaza_notices WHERE user_id = ? AND prayer_date >= ?'),
    add: p(`INSERT INTO janaza_notices (user_id, token_hash, deceased, prayer_date, prayer_time, place, city, burial, contact, lang, public_status, consent_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    setLink: p('UPDATE janaza_notices SET token_hash = ? WHERE id = ? AND user_id = ?'),
    setPublic: p('UPDATE janaza_notices SET public_status = ?, reason = NULL WHERE id = ? AND user_id = ?'),
    delOwn: p('DELETE FROM janaza_notices WHERE id = ? AND user_id = ?'),
    del: p('DELETE FROM janaza_notices WHERE id = ?'),
    dua: p('INSERT OR IGNORE INTO janaza_duas (notice_id, user_id, created_at) VALUES (?, ?, ?)'),
    bump: p('UPDATE janaza_notices SET duas = duas + 1 WHERE id = ?'),
    report: p('INSERT OR IGNORE INTO janaza_reports (notice_id, user_id, reason, created_at) VALUES (?, ?, ?, ?)'),
    reportsToday: p('SELECT COUNT(*) AS n FROM janaza_reports WHERE user_id = ? AND created_at > ?'),
    reported: p('UPDATE janaza_notices SET reported = reported + 1 WHERE id = ?'),
    requeue: p("UPDATE janaza_notices SET public_status = 'pending' WHERE id = ? AND public_status = 'approved'"),
    reportsOf: p('SELECT reason, created_at FROM janaza_reports WHERE notice_id = ? ORDER BY created_at DESC LIMIT 20'),
    queue: p('SELECT * FROM janaza_notices WHERE public_status = ? AND prayer_date >= ? ORDER BY (reported > 0) DESC, created_at ASC LIMIT 50 OFFSET ?'),
    flagged: p(`SELECT n.* FROM janaza_notices n WHERE n.public_status = 'approved' AND n.prayer_date >= ?
      AND EXISTS (SELECT 1 FROM janaza_reports r WHERE r.notice_id = n.id AND r.created_at >= n.decided_at)
      ORDER BY n.reported DESC LIMIT 50 OFFSET ?`),
    flaggedCount: p(`SELECT COUNT(*) AS n FROM janaza_notices n WHERE n.public_status = 'approved' AND n.prayer_date >= ?
      AND EXISTS (SELECT 1 FROM janaza_reports r WHERE r.notice_id = n.id AND r.created_at >= n.decided_at)`),
    count: p("SELECT public_status AS s, COUNT(*) AS n FROM janaza_notices WHERE prayer_date >= ? AND public_status != 'none' GROUP BY public_status"),
    approve: p("UPDATE janaza_notices SET public_status = 'approved', reason = NULL, decided_at = ?, reported = 0 WHERE id = ? AND public_status != 'none'"),
    reject: p("UPDATE janaza_notices SET public_status = 'rejected', reason = ?, decided_at = ?, reported = 0 WHERE id = ?"),
    log: p('INSERT INTO janaza_log (notice_id, admin_id, action, reason, at) VALUES (?, ?, ?, ?, ?)'),
    purge: p('DELETE FROM janaza_notices WHERE prayer_date < ?'),
    purgeLog: p('DELETE FROM janaza_log WHERE at <= ?'),
    duasByUser: p('SELECT COUNT(*) AS n FROM janaza_duas WHERE user_id = ?'),
    reportsByUser: p('SELECT notice_id, reason, created_at FROM janaza_reports WHERE user_id = ? ORDER BY created_at DESC'),
  }

  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)
  const today = () => isoDay(now())
  // Siyahıda: prayer_date ≥ bu gün − 7; gizli keçid: prayer_date ≥ bu gün − 30
  const listFrom = () => addDays(today(), -LIST_DAYS)
  const linkFrom = () => addDays(today(), -LINK_DAYS)

  // Girişsiz baxış / "dua etdim": yalnız yaddaşda (prosesə məxsus duzla HMAC; IPv6 → /64; bazaya yazılmır)
  const ipKey = createIpKeyer({ salt: crypto.randomBytes(16) })
  const anonSeen = new Map()   // key → vaxt
  const anonRate = new Map()   // ipKey → { n, until }
  const viewRate = new Map()   // ipKey → { n, until }
  const sweep = (t) => {
    for (const [k, at] of anonSeen) if (t - at > DAY) anonSeen.delete(k)
    for (const m of [anonRate, viewRate]) for (const [k, v] of m) if (v.until <= t) m.delete(k)
  }
  const hit = (map, key, max, windowMs, t) => {
    if (map.size >= anonMapCap) { sweep(t); if (map.size >= anonMapCap) return false }
    const r = map.get(key)
    if (r && r.until > t && r.n >= max) return false
    if (!r || r.until <= t) map.set(key, { n: 1, until: t + windowMs }); else r.n++
    return true
  }

  // İctimai görünüş: əlaqə YOXDUR, say YOXDUR
  const pubOut = (n) => ({
    id: n.id, deceased: n.deceased, date: n.prayer_date, time: n.prayer_time, place: n.place, city: n.city, burial: n.burial, lang: n.lang,
  })
  // Keçid sahibi (ailənin dəvət etdiyi): əlaqə var, say yoxdur
  const linkOut = (n) => ({ ...pubOut(n), contact: n.contact, listed: n.public_status === 'approved' && n.prayer_date >= listFrom() })
  // Sahibi (ailə): hər şey + "dua etdim" sayı
  const ownOut = (n) => ({
    ...linkOut(n), publicStatus: n.public_status, reason: n.public_status === 'rejected' ? n.reason : null,
    duas: n.duas, createdAt: n.created_at, expired: n.prayer_date < listFrom(),
  })

  router.get('/janaza/public', (req, res) => {
    res.set({ 'Cache-Control': 'public, max-age=60', 'X-Robots-Tag': 'noindex' })
    res.json({ items: st.pub.all(listFrom()).map(pubOut) })
  })

  router.post('/janaza/view', json, (req, res) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' })
    if (csrfRejected(req, allowedOrigins)) return err(res, 403, 'forbidden', 'Forbidden')
    if (!hit(viewRate, ipKey(req), viewLimit.max, viewLimit.windowMs, now())) return err(res, 429, 'rate_limited', 'Too many requests')
    const b = req.body || {}
    const n = typeof b.token === 'string' && TOKEN_RE.test(b.token) ? st.byHash.get(sha256(b.token), linkFrom()) : null
    if (!n) return err(res, 404, 'invalid_token', 'Invalid link')
    res.json({ notice: linkOut(n) })
  })

  router.post('/janaza/dua', json, (req, res) => {
    res.set('Cache-Control', 'no-store')
    if (csrfRejected(req, allowedOrigins)) return err(res, 403, 'forbidden', 'Forbidden')
    const t = now()
    const b = req.body || {}
    let n = null
    if (typeof b.token === 'string' && TOKEN_RE.test(b.token)) n = st.byHash.get(sha256(b.token), linkFrom())
    else if (Number.isInteger(b.id) && b.id > 0) {
      const r = st.get.get(b.id)
      const a = r ? st.author.get(r.user_id) : null
      n = r && a && !a.disabled && r.public_status === 'approved' && r.prayer_date >= listFrom() ? r : null
    }
    if (!n) return err(res, 404, 'not_found', 'Not found')
    const user = optionalUser(req)
    let added
    if (user) {
      added = tx(() => { const a = st.dua.run(n.id, user.id, t).changes > 0; if (a) st.bump.run(n.id); return a })
    } else {
      const ik = ipKey(req)
      if (anonSeen.size >= anonMapCap) { sweep(t); if (anonSeen.size >= anonMapCap) return err(res, 429, 'rate_limited', 'Too many requests') }
      if (!hit(anonRate, ik, anonDuaPerHour, 3600e3, t)) return err(res, 429, 'rate_limited', 'Too many requests')
      const k = `${ik}:${n.id}`
      const at = anonSeen.get(k)
      added = !(at && t - at < DAY)
      if (added) { anonSeen.set(k, t); st.bump.run(n.id) }
    }
    res.json({ ok: true, already: !added })
  })

  router.get('/janaza/mine', auth, (req, res) => {
    res.json({
      items: st.mine.all(req.user.id).map(ownOut),
      today: today(),
      limits: { perDay: PER_DAY, active: MAX_ACTIVE, name: MAX_NAME, place: MAX_PLACE, city: MAX_CITY, contact: MAX_CONTACT, pastDays: PAST_DAYS, aheadDays: AHEAD_DAYS, listDays: LIST_DAYS, linkDays: LINK_DAYS },
    })
  })

  router.post('/janaza', auth, kit.requireVerified, json, (req, res) => {
    const uid = req.user.id
    const t = now()
    if (st.today.get(uid, t - DAY).n >= PER_DAY) return err(res, 429, 'daily_limit', 'Daily limit reached')
    if (st.active.get(uid, listFrom()).n >= MAX_ACTIVE) return err(res, 409, 'too_many', 'Too many active notices')
    const v = validNotice(req.body, today())
    if (v.error) return err(res, 400, v.error, 'Not accepted')
    const token = crypto.randomBytes(32).toString('base64url')
    const id = Number(st.add.run(uid, sha256(token), v.deceased, v.date, v.time, v.place, v.city, v.burial, v.contact, v.lang,
      v.wantPublic ? 'pending' : 'none', t, t).lastInsertRowid)
    res.status(201).json({ notice: ownOut(st.get.get(id)), token })
  })

  const own = (req, res) => {
    const id = idOf(req)
    const n = id ? st.get.get(id) : null
    if (!n || n.user_id !== req.user.id) { err(res, 404, 'not_found', 'Not found'); return null }
    return n
  }

  router.post('/janaza/:id/link', auth, (req, res) => {
    const n = own(req, res); if (!n) return
    const token = crypto.randomBytes(32).toString('base64url')
    st.setLink.run(sha256(token), n.id, req.user.id)
    res.status(201).json({ token })
  })

  router.put('/janaza/:id/public', auth, json, (req, res) => {
    const n = own(req, res); if (!n) return
    const want = (req.body || {}).public
    if (typeof want !== 'boolean') return err(res, 400, 'bad_request', 'Invalid value')
    if (n.prayer_date < listFrom()) return err(res, 409, 'expired', 'Notice expired')
    // Rədd edilmiş elanı yenidən göndərmək — yenə moderasiyaya; təsdiqlənmiş qalır
    const next = want ? (n.public_status === 'approved' ? 'approved' : 'pending') : 'none'
    st.setPublic.run(next, n.id, req.user.id)
    res.json({ notice: ownOut(st.get.get(n.id)) })
  })

  router.delete('/janaza/:id', auth, (req, res) => {
    const id = idOf(req)
    if (!id || !st.delOwn.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  router.post('/janaza/:id/report', auth, kit.requireVerified, json, (req, res) => {
    const t = now()
    const id = idOf(req)
    const n = id ? st.get.get(id) : null
    const a = n ? st.author.get(n.user_id) : null
    if (!n || !a || a.disabled || n.public_status !== 'approved' || n.prayer_date < listFrom()) return err(res, 404, 'not_found', 'Not found')
    if (n.user_id === req.user.id) return err(res, 400, 'own', 'Own notice')
    const reason = (req.body || {}).reason
    if (!REPORT_REASONS.includes(reason)) return err(res, 400, 'bad_reason', 'Unknown reason')
    const todayN = st.reportsToday.get(req.user.id, t - DAY).n
    if (todayN >= MAX_REPORTS_PER_DAY) return err(res, 429, 'rate_limited', 'Too many reports today')
    const age = t - (Number(req.user.created_at) || t)
    const counts = age >= REPORTER_MIN_AGE_MS && todayN < COUNTED_REPORTS_PER_DAY
    tx(() => {
      if (!st.report.run(n.id, req.user.id, reason, t).changes || !counts) return
      st.reported.run(n.id)
      if (st.get.get(n.id).reported >= REQUEUE_REPORTS) st.requeue.run(n.id)
    })
    res.status(202).json({ ok: true })
  })

  // ── Moderasiya (admin paneli, editor+) — müəllifin e-poçtu, ailənin əlaqəsi və "dua etdim" sayı GÖSTƏRİLMİR ──
  if (requireEditor) {
    const counts = () => {
      const out = { pending: 0, approved: 0, rejected: 0, flagged: st.flaggedCount.get(listFrom()).n }
      for (const c of st.count.all(listFrom())) out[c.s] = c.n
      return out
    }
    router.get('/admin/janaza', ...requireEditor, (req, res) => {
      const status = ['pending', 'approved', 'rejected', 'reported'].includes(req.query.status) ? req.query.status : 'pending'
      const page = Math.max(1, Math.min(1000, Number(req.query.page) || 1))
      const off = (page - 1) * 50
      const rows = status === 'reported' ? st.flagged.all(listFrom(), off) : st.queue.all(status, listFrom(), off)
      res.json({
        items: rows.map((n) => ({
          ...pubOut(n), publicStatus: n.public_status, reason: n.reason || null, reported: n.reported, createdAt: n.created_at,
          reports: st.reportsOf.all(n.id).map((x) => ({ reason: x.reason, at: x.created_at })),
        })),
        status, page, counts: counts(), reasons: REJECT_REASONS,
      })
    })
    router.post('/admin/janaza/:id', ...requireEditor, json, (req, res) => {
      const id = idOf(req)
      const n = id ? st.get.get(id) : null
      if (!n) return err(res, 404, 'not_found', 'Not found')
      const { action, reason } = req.body || {}
      const t = now()
      if (action === 'approve') {
        // Sahibi ictimai siyahı istəməyibsə (none) — admin onu siyahıya çıxara bilməz
        if (!st.approve.run(t, id).changes) return err(res, 409, 'not_requested', 'Owner did not request listing')
      } else if (action === 'reject') {
        if (!REJECT_REASONS.includes(reason)) return err(res, 400, 'bad_reason', 'Unknown reason')
        st.reject.run(reason, t, id)
      } else if (action === 'delete') st.del.run(id)
      else return err(res, 400, 'bad_request', 'Unknown action')
      st.log.run(id, req.adminUser ? req.adminUser.id : null, action, action === 'reject' ? reason : null, t)
      res.json({ ok: true, counts: counts() })
    })
  }

  // eslint-disable-next-line no-unused-vars
  router.use(['/janaza', '/admin/janaza'], (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('janaza error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  router.purge = () => {
    const t = now()
    sweep(t)
    return st.purge.run(linkFrom()).changes + st.purgeLog.run(t - 90 * DAY).changes
  }
  // "Mənim məlumatlarım" — token heşi YOX
  router.exportUser = (uid) => ({
    notices: st.mine.all(uid).map(ownOut),
    duasMade: st.duasByUser.get(uid).n,
    reports: st.reportsByUser.all(uid).map((r) => ({ noticeId: r.notice_id, reason: r.reason, at: r.created_at })),
  })
  router.summaryUser = (uid) => ({ notices: st.mine.all(uid).length, duasMade: st.duasByUser.get(uid).n })
  return router
}

module.exports = {
  createJanazaRouter, validNotice, TOKEN_RE, LIST_DAYS, LINK_DAYS, PER_DAY, MAX_ACTIVE, REJECT_REASONS, REPORT_REASONS, PUBLIC_STATES, REQUEUE_REPORTS,
}
