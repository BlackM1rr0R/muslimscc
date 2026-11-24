// ═══════════════════════════════════════════════════════════════════════
// Namaz otaqları — /prayer-rooms (məscid OLMAYAN namaz yerləri: hava limanı, ticarət mərkəzi, universitet,
// xəstəxana, ofis, vağzal). Moderasiya ilə.
//
// • Girişli, e-poçtu TƏSDİQLƏNMİŞ istifadəçi yer təklif edir (ad, növ, şəhər, ünvan, koordinat, mərtəbə/qeyd,
//   dəstəmaz yeri, qadınlar üçün bölmə) → status "pending". Təklif edənin adı / e-poçtu HEÇ VAXT göstərilmir.
// • Süzgəclər: keçid 0 (URL, domen, e-poçt), telefon nömrəsi → rədd; gündə 5 təklif, eyni anda ≤ 10 gözləyən.
// • Moderasiya — ADMIN PANELİ (editor+): təsdiq / rədd (səbəb şablonu) / sil. Moderator yalnız yerin
//   məlumatını və şikayətləri görür.
// • Şikayət ("bağlanıb" / "məlumat səhvdir" / digər, ≤ 200 simvol qeyd — keçidsiz, telefonsuz): girişli + təsdiqli,
//   öz yerinə yox. Yer siyahıda qalır və editorun "şikayət olunanlar" siyahısına düşür; ≥ 3 FƏRQLİ sayılan
//   şikayətlə (hesab ≥ 24 saat, gündə ilk 5) növbəyə (pending) qayıdır və siyahıdan çıxır.
// • "Yaxınımda" — YALNIZ klientdə (brauzerin geolokasiyası); server istifadəçinin yerini almır və saxlamır.
//   Xarici geo-IP xidməti yoxdur.
// • Ömür: rədd edilən 30 gün, gözləyən 90 gün sonra silinir; jurnal 90 gün.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS); users(id) ON DELETE CASCADE.
//
// Endpoint-lər:
//   GET    /api/prayer-rooms?city=&type=       (girişsiz) → { items, cities, types }
//   GET    /api/prayer-rooms/mine              (girişli) → { items, limits, today }
//   POST   /api/prayer-rooms                   (girişli + təsdiqli) → 201 { item }
//   DELETE /api/prayer-rooms/:id               (girişli, öz) → { ok }
//   POST   /api/prayer-rooms/:id/report        (girişli + təsdiqli) { kind, note? } → 202
//   GET    /api/admin/prayer-rooms?status=     (panel, editor+) → { items, counts, reasons }
//   POST   /api/admin/prayer-rooms/:id         { action: approve|reject|delete, reason? } → { ok, counts }
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const kit = require('./communityKit')

const TYPES = ['airport', 'mall', 'university', 'hospital', 'office', 'station', 'other']
const REPORT_KINDS = ['closed', 'wrong', 'other']
const REJECT_REASONS = ['not_found', 'duplicate', 'is_mosque', 'incomplete', 'inappropriate', 'other']
const MAX_NAME = 80
const MAX_CITY = 60
const MAX_ADDRESS = 160
const MAX_FLOOR = 40
const MAX_NOTES = 300
const MAX_REPORT_NOTE = 200
const PER_DAY = 5
const MAX_PENDING = 10
const MAX_REPORTS_PER_DAY = 20
const REQUEUE_REPORTS = 3
const COUNTED_REPORTS_PER_DAY = 5
const REPORTER_MIN_AGE_MS = 86400000
const MAX_PUBLIC = 500
const DAY = 86400000
const REJECTED_TTL = 30 * DAY
const PENDING_TTL = 90 * DAY

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prayer_rooms (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,
  city       TEXT NOT NULL,
  city_key   TEXT NOT NULL,
  address    TEXT NOT NULL DEFAULT '',
  lat        REAL NOT NULL,
  lng        REAL NOT NULL,
  floor      TEXT NOT NULL DEFAULT '',
  notes      TEXT NOT NULL DEFAULT '',
  wudu       INTEGER NOT NULL DEFAULT 0,
  women      INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason     TEXT,
  reported   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE INDEX IF NOT EXISTS prayer_rooms_by_status ON prayer_rooms(status, city_key);
CREATE INDEX IF NOT EXISTS prayer_rooms_by_user ON prayer_rooms(user_id, created_at);
CREATE TABLE IF NOT EXISTS prayer_room_reports (
  room_id    INTEGER NOT NULL REFERENCES prayer_rooms(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS prayer_room_reports_by_user ON prayer_room_reports(user_id, created_at);
CREATE TABLE IF NOT EXISTS prayer_room_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id  INTEGER NOT NULL,
  admin_id INTEGER,
  action   TEXT NOT NULL,
  reason   TEXT,
  at       INTEGER NOT NULL
);
`

const cityKey = (s) => String(s || '').normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim()
const coord = (v, max) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max ? Math.round(v * 1e5) / 1e5 : null)

/** Göndərilən yerin yoxlanması → { name, type, city, address, lat, lng, floor, notes, wudu, women } | { error } */
function validRoom(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return { error: 'bad_request' }
  const name = kit.cleanLine(b.name, MAX_NAME, { required: true })
  const city = kit.cleanLine(b.city, MAX_CITY, { required: true })
  const address = kit.cleanLine(b.address, MAX_ADDRESS)
  const floor = kit.cleanLine(b.floor, MAX_FLOOR)
  const notes = kit.cleanText(b.notes, MAX_NOTES)
  if (!name || name.length < 2 || !city || address == null || floor == null || notes == null) return { error: 'bad_request' }
  if (!TYPES.includes(b.type)) return { error: 'bad_type' }
  const lat = coord(b.lat, 90), lng = coord(b.lng, 180)
  if (lat == null || lng == null || (lat === 0 && lng === 0)) return { error: 'bad_location' }
  if (b.wudu != null && typeof b.wudu !== 'boolean') return { error: 'bad_request' }
  if (b.women != null && typeof b.women !== 'boolean') return { error: 'bad_request' }
  const all = `${name} ${city} ${address} ${floor} ${notes}`
  if (kit.hasLink(all)) return { error: 'links_not_allowed' }
  if (kit.hasPhone(all)) return { error: 'personal_info' }
  return { name, type: b.type, city, address, lat, lng, floor, notes, wudu: b.wudu === true, women: b.women === true }
}

function createPrayerRoomsRouter({ db, requireUser, requireEditor = null, now = () => Date.now() }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    // Bloklanmış (disabled) müəllifin yerləri siyahıda görünmür
    pub: p(`SELECT r.* FROM prayer_rooms r JOIN users u ON u.id = r.user_id AND u.disabled = 0
      WHERE r.status = 'approved' AND (? = '' OR r.city_key = ?) AND (? = '' OR r.type = ?) ORDER BY r.city_key, r.name LIMIT ?`),
    cities: p(`SELECT r.city, r.city_key, COUNT(*) AS n FROM prayer_rooms r JOIN users u ON u.id = r.user_id AND u.disabled = 0
      WHERE r.status = 'approved' GROUP BY r.city_key ORDER BY r.city_key LIMIT 300`),
    get: p('SELECT * FROM prayer_rooms WHERE id = ?'),
    author: p('SELECT disabled FROM users WHERE id = ?'),
    mine: p('SELECT * FROM prayer_rooms WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'),
    today: p('SELECT COUNT(*) AS n FROM prayer_rooms WHERE user_id = ? AND created_at > ?'),
    pending: p("SELECT COUNT(*) AS n FROM prayer_rooms WHERE user_id = ? AND status = 'pending'"),
    add: p(`INSERT INTO prayer_rooms (user_id, name, type, city, city_key, address, lat, lng, floor, notes, wudu, women, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`),
    delOwn: p('DELETE FROM prayer_rooms WHERE id = ? AND user_id = ?'),
    del: p('DELETE FROM prayer_rooms WHERE id = ?'),
    report: p('INSERT OR IGNORE INTO prayer_room_reports (room_id, user_id, kind, note, created_at) VALUES (?, ?, ?, ?, ?)'),
    reportsToday: p('SELECT COUNT(*) AS n FROM prayer_room_reports WHERE user_id = ? AND created_at > ?'),
    reported: p('UPDATE prayer_rooms SET reported = reported + 1 WHERE id = ?'),
    requeue: p("UPDATE prayer_rooms SET status = 'pending' WHERE id = ? AND status = 'approved'"),
    reportsOf: p('SELECT kind, note, created_at FROM prayer_room_reports WHERE room_id = ? ORDER BY created_at DESC LIMIT 20'),
    queue: p('SELECT * FROM prayer_rooms WHERE status = ? ORDER BY (reported > 0) DESC, created_at ASC LIMIT 50 OFFSET ?'),
    flagged: p(`SELECT r.* FROM prayer_rooms r WHERE r.status = 'approved'
      AND EXISTS (SELECT 1 FROM prayer_room_reports x WHERE x.room_id = r.id AND x.created_at >= r.decided_at)
      ORDER BY r.reported DESC, r.decided_at ASC LIMIT 50 OFFSET ?`),
    flaggedCount: p(`SELECT COUNT(*) AS n FROM prayer_rooms r WHERE r.status = 'approved'
      AND EXISTS (SELECT 1 FROM prayer_room_reports x WHERE x.room_id = r.id AND x.created_at >= r.decided_at)`),
    count: p('SELECT status, COUNT(*) AS n FROM prayer_rooms GROUP BY status'),
    approve: p("UPDATE prayer_rooms SET status = 'approved', reason = NULL, decided_at = ?, reported = 0 WHERE id = ?"),
    reject: p("UPDATE prayer_rooms SET status = 'rejected', reason = ?, decided_at = ?, reported = 0 WHERE id = ?"),
    log: p('INSERT INTO prayer_room_log (room_id, admin_id, action, reason, at) VALUES (?, ?, ?, ?, ?)'),
    purgeRejected: p("DELETE FROM prayer_rooms WHERE status = 'rejected' AND decided_at <= ?"),
    purgePending: p("DELETE FROM prayer_rooms WHERE status = 'pending' AND COALESCE(decided_at, created_at) <= ?"),
    purgeLog: p('DELETE FROM prayer_room_log WHERE at <= ?'),
    reportsByUser: p('SELECT room_id, kind, note, created_at FROM prayer_room_reports WHERE user_id = ? ORDER BY created_at DESC'),
  }

  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)

  const pubOut = (r) => ({
    id: r.id, name: r.name, type: r.type, city: r.city, address: r.address, lat: r.lat, lng: r.lng,
    floor: r.floor, notes: r.notes, wudu: r.wudu === 1, women: r.women === 1, updatedAt: r.decided_at || r.created_at,
  })
  const mineOut = (r) => ({ ...pubOut(r), status: r.status, reason: r.status === 'rejected' ? r.reason : null, createdAt: r.created_at })

  router.get('/prayer-rooms', (req, res) => {
    const ck = typeof req.query.city === 'string' ? cityKey(req.query.city).slice(0, MAX_CITY) : ''
    const type = TYPES.includes(req.query.type) ? req.query.type : ''
    res.set({ 'Cache-Control': 'public, max-age=60', 'X-Robots-Tag': 'noindex' })
    res.json({
      items: st.pub.all(ck, ck, type, type, MAX_PUBLIC).map(pubOut),
      cities: st.cities.all().map((c) => ({ name: c.city, n: c.n })),
      types: TYPES,
    })
  })

  router.get('/prayer-rooms/mine', auth, (req, res) => {
    res.json({
      items: st.mine.all(req.user.id).map(mineOut),
      today: st.today.get(req.user.id, now() - DAY).n,
      limits: { perDay: PER_DAY, pending: MAX_PENDING, name: MAX_NAME, city: MAX_CITY, address: MAX_ADDRESS, floor: MAX_FLOOR, notes: MAX_NOTES, types: TYPES, reportKinds: REPORT_KINDS },
    })
  })

  router.post('/prayer-rooms', auth, kit.requireVerified, json, (req, res) => {
    const uid = req.user.id
    const t = now()
    if (st.today.get(uid, t - DAY).n >= PER_DAY) return err(res, 429, 'daily_limit', 'Daily limit reached')
    if (st.pending.get(uid).n >= MAX_PENDING) return err(res, 409, 'too_many', 'Too many pending')
    const v = validRoom(req.body)
    if (v.error) return err(res, 400, v.error, 'Not accepted')
    const id = Number(st.add.run(uid, v.name, v.type, v.city, cityKey(v.city), v.address, v.lat, v.lng, v.floor, v.notes, v.wudu ? 1 : 0, v.women ? 1 : 0, t).lastInsertRowid)
    res.status(201).json({ item: mineOut(st.get.get(id)) })
  })

  router.delete('/prayer-rooms/:id', auth, (req, res) => {
    const id = idOf(req)
    if (!id || !st.delOwn.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  router.post('/prayer-rooms/:id/report', auth, kit.requireVerified, json, (req, res) => {
    const t = now()
    const id = idOf(req)
    const r = id ? st.get.get(id) : null
    const a = r ? st.author.get(r.user_id) : null
    if (!r || r.status !== 'approved' || !a || a.disabled) return err(res, 404, 'not_found', 'Not found')
    if (r.user_id === req.user.id) return err(res, 400, 'own', 'Own place')
    const b = req.body || {}
    if (!REPORT_KINDS.includes(b.kind)) return err(res, 400, 'bad_reason', 'Unknown reason')
    const note = kit.cleanLine(b.note, MAX_REPORT_NOTE)
    if (note == null) return err(res, 400, 'bad_request', 'Invalid note')
    if (kit.hasLink(note)) return err(res, 400, 'links_not_allowed', 'Not accepted')
    if (kit.hasPhone(note)) return err(res, 400, 'personal_info', 'Not accepted')
    const today = st.reportsToday.get(req.user.id, t - DAY).n
    if (today >= MAX_REPORTS_PER_DAY) return err(res, 429, 'rate_limited', 'Too many reports today')
    const age = t - (Number(req.user.created_at) || t)
    const counts = age >= REPORTER_MIN_AGE_MS && today < COUNTED_REPORTS_PER_DAY
    tx(() => {
      if (!st.report.run(r.id, req.user.id, b.kind, note, t).changes) return
      if (!counts) return
      st.reported.run(r.id)
      if (st.get.get(r.id).reported >= REQUEUE_REPORTS) st.requeue.run(r.id)
    })
    res.status(202).json({ ok: true })
  })

  // ── Moderasiya (admin paneli, editor+) — təklif edənin e-poçtu / hesab id-si GÖSTƏRİLMİR ──
  if (requireEditor) {
    const counts = () => {
      const out = { pending: 0, approved: 0, rejected: 0, flagged: st.flaggedCount.get().n }
      for (const c of st.count.all()) out[c.status] = c.n
      return out
    }
    router.get('/admin/prayer-rooms', ...requireEditor, (req, res) => {
      const status = ['pending', 'approved', 'rejected', 'reported'].includes(req.query.status) ? req.query.status : 'pending'
      const page = Math.max(1, Math.min(1000, Number(req.query.page) || 1))
      const rows = status === 'reported' ? st.flagged.all((page - 1) * 50) : st.queue.all(status, (page - 1) * 50)
      res.json({
        items: rows.map((r) => ({
          ...mineOut(r), reported: r.reported, decidedAt: r.decided_at || null,
          reports: st.reportsOf.all(r.id).map((x) => ({ kind: x.kind, note: x.note, at: x.created_at })),
        })),
        status, page, counts: counts(), reasons: REJECT_REASONS,
      })
    })
    router.post('/admin/prayer-rooms/:id', ...requireEditor, json, (req, res) => {
      const id = idOf(req)
      const r = id ? st.get.get(id) : null
      if (!r) return err(res, 404, 'not_found', 'Not found')
      const { action, reason } = req.body || {}
      const t = now()
      if (action === 'approve') st.approve.run(t, id)
      else if (action === 'reject') {
        if (!REJECT_REASONS.includes(reason)) return err(res, 400, 'bad_reason', 'Unknown reason')
        st.reject.run(reason, t, id)
      } else if (action === 'delete') st.del.run(id)
      else return err(res, 400, 'bad_request', 'Unknown action')
      st.log.run(id, req.adminUser ? req.adminUser.id : null, action, action === 'reject' ? reason : null, t)
      res.json({ ok: true, counts: counts() })
    })
  }

  // eslint-disable-next-line no-unused-vars
  router.use(['/prayer-rooms', '/admin/prayer-rooms'], (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('prayer rooms error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  router.purge = () => {
    const t = now()
    return st.purgeRejected.run(t - REJECTED_TTL).changes + st.purgePending.run(t - PENDING_TTL).changes + st.purgeLog.run(t - 90 * DAY).changes
  }
  router.exportUser = (uid) => ({
    places: st.mine.all(uid).map(mineOut),
    reports: st.reportsByUser.all(uid).map((r) => ({ roomId: r.room_id, kind: r.kind, note: r.note, at: r.created_at })),
  })
  router.summaryUser = (uid) => ({ places: st.mine.all(uid).length, reports: st.reportsByUser.all(uid).length })
  return router
}

module.exports = {
  createPrayerRoomsRouter, validRoom, cityKey, TYPES, REPORT_KINDS, REJECT_REASONS, PER_DAY, MAX_PENDING, REQUEUE_REPORTS,
}
