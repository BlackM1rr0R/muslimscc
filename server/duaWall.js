// ═══════════════════════════════════════════════════════════════════════
// K3. İctimai dua divarı — /dua-wall (moderasiya ilə)
//
// • Girişli, e-poçtu TƏSDİQLƏNMİŞ istifadəçi (403 verify_email) dua istəyi göndərir (10–300 simvol, istəyə bağlı ad — yalnız ad, ≤30; susmaya görə
//   anonim; dil etiketi) → status "pending". Divarda hesab adı / e-poçt HEÇ VAXT göstərilmir.
// • Avtomatik süzgəclər: keçid 0 (URL, domen, e-poçt → rədd), telefon nömrəsi → rədd, uzunluq, gündə 3
//   istək (istifadəçi üzrə), qadağan sözlər (admin paneldə idarə olunur, bazada). Süzgəcdən keçən istək
//   yenə də moderatorun təsdiqini gözləyir.
// • Moderasiya — ADMIN PANELİ (server/auth.js, admin_roles: editor / admin / superadmin): təsdiq / rədd
//   (səbəb şablonu) / sil. Moderator yalnız istəyin mətnini, adını, dilini və şikayətləri görür.
// • Təsdiqlənən istək 30 gün görünür (expires_at), sonra gizlənir və 7 gün sonra silinir. Gözləyən
//   və rədd edilən istəklər 30 gün sonra silinir.
// • "Dua etdim": say (istək üzrə bir dəfə) — girişli istifadəçi bazada (dua_wall_prayers), girişsiz
//   ziyarətçi yaddaşda (IP-nin prosesə məxsus duzla HMAC-ı, IPv6 üçün /64 — server/ipKey.js; 24 saat; bazaya
//   IP/heş YAZILMIR) + IP limiti. Yaddaş həddi dolubsa (təmizləmədən sonra da) girişsiz "Dua etdim" → 429.
// • Şikayət (girişli, TƏSDİQLİ e-poçt, öz istəyinə yox). İstək divarda QALIR və editorun "şikayət olunanlar"
//   siyahısına düşür (GET /api/admin/dua-wall?status=reported). Növbəyə (pending) yalnız ≥ 3 FƏRQLİ "sayılan"
//   şikayətlə qayıdır: hesab ≥ 24 saatlıq olmalıdır və istifadəçinin gündə ilk 5 şikayəti sayılır
//   (dua_wall.reported = sayılan şikayətlər; təsdiqdə sıfırlanır).
//
// Cədvəllər MİQRASİYASIZ; users(id) ON DELETE CASCADE (hesab silinəndə istəkləri, səsləri, şikayətləri).
//
// Endpoint-lər:
//   GET    /api/dua-wall?lang=&before=     (girişsiz) → { items, next }
//   GET    /api/dua-wall/mine              (girişli) → { items, limits, today }
//   POST   /api/dua-wall                   (girişli) { body, name?, lang } → 201 { item }
//   DELETE /api/dua-wall/:id               (girişli, öz) → { ok }
//   POST   /api/dua-wall/:id/pray          (girişli və ya girişsiz + CSRF) → { prayed, already }
//   POST   /api/dua-wall/:id/report        (girişli) { reason } → 202
//   GET    /api/admin/dua-wall?status=     (panel, editor+) → { items, counts }
//   POST   /api/admin/dua-wall/:id         { action: approve|reject|delete, reason? } → { ok }
//   GET/POST /api/admin/dua-wall/banned, DELETE /api/admin/dua-wall/banned/:word
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const kit = require('./communityKit')
const { csrfRejected } = require('./auth')
const { createIpKeyer } = require('./ipKey')

const MIN_BODY = 10
const MAX_BODY = 300
const MAX_NAME = 30
const PER_DAY = 3
const MAX_REPORTS_PER_DAY = 20
const REQUEUE_REPORTS = 3                // fərqli, sayılan şikayət → növbəyə qayıdır
const COUNTED_REPORTS_PER_DAY = 5        // istifadəçinin gündə ən çox neçə şikayəti sayılır
const REPORTER_MIN_AGE_MS = 86400000     // şikayətin sayılması üçün hesabın minimal yaşı
const ANON_MAP_CAP = 50000
const SHOW_MS = 30 * 86400000
const KEEP_AFTER_MS = 7 * 86400000
const PENDING_TTL = 30 * 86400000
const PAGE = 30
const DAY = 86400000
const REJECT_REASONS = ['personal_info', 'not_dua', 'inappropriate', 'duplicate', 'commercial', 'other']
const REPORT_REASONS = ['inappropriate', 'personal_info', 'spam', 'other']
// İlk dəfə (cədvəl yaradılanda) qoyulan kiçik siyahı — admin paneldən dəyişdirilir
const DEFAULT_BANNED = ['casino', 'betting', 'viagra', 'porn', 'xxx', 'forex', 'bitcoin', 'crypto', 'onlyfans', 'loan']
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u
const LANG_RE = /^[a-z]{2,3}$/

const SCHEMA = `
CREATE TABLE IF NOT EXISTS dua_wall (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  lang       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason     TEXT,
  reported   INTEGER NOT NULL DEFAULT 0,
  reviewed   INTEGER NOT NULL DEFAULT 0,
  prayed     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  expires_at INTEGER
);
CREATE INDEX IF NOT EXISTS dua_wall_by_status ON dua_wall(status, decided_at);
CREATE INDEX IF NOT EXISTS dua_wall_by_user ON dua_wall(user_id, created_at);
CREATE TABLE IF NOT EXISTS dua_wall_prayers (
  dua_id     INTEGER NOT NULL REFERENCES dua_wall(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (dua_id, user_id)
);
CREATE TABLE IF NOT EXISTS dua_wall_reports (
  dua_id     INTEGER NOT NULL REFERENCES dua_wall(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (dua_id, user_id)
);
CREATE INDEX IF NOT EXISTS dua_wall_reports_by_user ON dua_wall_reports(user_id, created_at);
CREATE TABLE IF NOT EXISTS dua_wall_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  dua_id   INTEGER NOT NULL,
  admin_id INTEGER,
  action   TEXT NOT NULL,
  reason   TEXT,
  at       INTEGER NOT NULL
);
`
const BANNED_SCHEMA = `CREATE TABLE IF NOT EXISTS dua_wall_banned (word TEXT PRIMARY KEY, created_at INTEGER NOT NULL);`

/** Göndərilən istəyin yoxlanması → { body, name, lang } | { error } */
function validSubmission(b, banned = []) {
  if (!b || typeof b !== 'object') return { error: 'bad_request' }
  const body = kit.cleanText(b.body, MAX_BODY, { required: true })
  if (body == null) return { error: 'bad_request' }
  if ([...body].length < MIN_BODY) return { error: 'too_short' }
  let name = ''
  if (b.name != null && b.name !== '') {
    name = kit.cleanLine(b.name, MAX_NAME)
    if (name == null || (name && !NAME_RE.test(name))) return { error: 'bad_name' }
  }
  const lang = typeof b.lang === 'string' && LANG_RE.test(b.lang) ? b.lang : null
  if (!lang) return { error: 'bad_request' }
  if (kit.hasLink(body) || kit.hasLink(name)) return { error: 'links_not_allowed' }
  if (kit.hasPhone(body)) return { error: 'personal_info' }
  if (kit.bannedHit(`${body} ${name}`, banned)) return { error: 'not_allowed' }
  return { body, name, lang }
}

function createDuaWallRouter({ db, requireUser, requireEditor = null, optionalUser = () => null, allowedOrigins = [], now = () => Date.now(), anonPrayPerHour = 120, anonMapCap = ANON_MAP_CAP }) {
  const raw = db.raw || db
  const fresh = !raw.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'dua_wall_banned'").get()
  raw.exec(SCHEMA + BANNED_SCHEMA)
  const p = (sql) => raw.prepare(sql)
  if (fresh) { const ins = p('INSERT OR IGNORE INTO dua_wall_banned (word, created_at) VALUES (?, ?)'); for (const w of DEFAULT_BANNED) ins.run(w, now()) }
  const tx = db.tx || ((fn) => fn())
  const st = {
    // Bloklanmış (disabled) müəllifin istəkləri divarda görünmür
    pub: p(`SELECT d.id, d.body, d.name, d.lang, d.prayed, d.decided_at FROM dua_wall d JOIN users u ON u.id = d.user_id AND u.disabled = 0
      WHERE d.status = 'approved' AND d.expires_at > ? AND (? = '' OR d.lang = ?) AND d.decided_at < ? ORDER BY d.decided_at DESC, d.id DESC LIMIT ?`),
    authorActive: p('SELECT disabled FROM users WHERE id = ?'),
    get: p('SELECT * FROM dua_wall WHERE id = ?'),
    mine: p('SELECT * FROM dua_wall WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'),
    today: p('SELECT COUNT(*) AS n FROM dua_wall WHERE user_id = ? AND created_at > ?'),
    add: p("INSERT INTO dua_wall (user_id, body, name, lang, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)"),
    delOwn: p('DELETE FROM dua_wall WHERE id = ? AND user_id = ?'),
    del: p('DELETE FROM dua_wall WHERE id = ?'),
    pray: p('INSERT OR IGNORE INTO dua_wall_prayers (dua_id, user_id, created_at) VALUES (?, ?, ?)'),
    bump: p('UPDATE dua_wall SET prayed = prayed + 1 WHERE id = ?'),
    report: p('INSERT OR IGNORE INTO dua_wall_reports (dua_id, user_id, reason, created_at) VALUES (?, ?, ?, ?)'),
    reportsToday: p('SELECT COUNT(*) AS n FROM dua_wall_reports WHERE user_id = ? AND created_at > ?'),
    reported: p('UPDATE dua_wall SET reported = reported + 1 WHERE id = ?'),
    // Divarda qalan, amma son təsdiqdən sonra şikayət olunmuş istəklər (editor üçün)
    flagged: p(`SELECT d.*, (SELECT COUNT(*) FROM dua_wall_reports r WHERE r.dua_id = d.id AND r.created_at >= d.decided_at) AS n
      FROM dua_wall d WHERE d.status = 'approved' AND d.expires_at > ?
      AND EXISTS (SELECT 1 FROM dua_wall_reports r WHERE r.dua_id = d.id AND r.created_at >= d.decided_at)
      ORDER BY d.reported DESC, d.decided_at ASC LIMIT ? OFFSET ?`),
    flaggedCount: p(`SELECT COUNT(*) AS n FROM dua_wall d WHERE d.status = 'approved' AND d.expires_at > ?
      AND EXISTS (SELECT 1 FROM dua_wall_reports r WHERE r.dua_id = d.id AND r.created_at >= d.decided_at)`),
    requeue: p("UPDATE dua_wall SET status = 'pending' WHERE id = ? AND status = 'approved'"),
    reportsOf: p('SELECT reason, created_at FROM dua_wall_reports WHERE dua_id = ? ORDER BY created_at DESC LIMIT 20'),
    queue: p(`SELECT * FROM dua_wall WHERE status = ? ORDER BY (reported > 0) DESC, created_at ASC LIMIT ? OFFSET ?`),
    count: p("SELECT status, COUNT(*) AS n, SUM(reported > 0) AS r FROM dua_wall GROUP BY status"),
    approve: p(`UPDATE dua_wall SET status = 'approved', reason = NULL, decided_at = ?, expires_at = COALESCE(expires_at, ?),
      reviewed = reviewed + (reported > 0), reported = 0 WHERE id = ?`),
    reject: p("UPDATE dua_wall SET status = 'rejected', reason = ?, decided_at = ?, reported = 0 WHERE id = ?"),
    log: p('INSERT INTO dua_wall_log (dua_id, admin_id, action, reason, at) VALUES (?, ?, ?, ?, ?)'),
    banned: p('SELECT word FROM dua_wall_banned ORDER BY word'),
    addBanned: p('INSERT OR IGNORE INTO dua_wall_banned (word, created_at) VALUES (?, ?)'),
    delBanned: p('DELETE FROM dua_wall_banned WHERE word = ?'),
    purgeShown: p("DELETE FROM dua_wall WHERE status = 'approved' AND expires_at <= ?"),
    purgeOther: p("DELETE FROM dua_wall WHERE status IN ('pending','rejected') AND COALESCE(decided_at, created_at) <= ?"),
    purgeLog: p('DELETE FROM dua_wall_log WHERE at <= ?'),
    prayedByUser: p('SELECT COUNT(*) AS n FROM dua_wall_prayers WHERE user_id = ?'),
    reportsByUser: p('SELECT dua_id, reason, created_at FROM dua_wall_reports WHERE user_id = ? ORDER BY created_at DESC'),
  }
  const bannedList = () => st.banned.all().map((r) => r.word)

  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)

  // Girişsiz "dua etdim": yaddaşda, prosesə məxsus duzla HMAC (IPv6 → /64; bazaya yazılmır; restart → sıfırlanır)
  const anonSeen = new Map()    // key → vaxt
  const anonRate = new Map()    // ipKey → { n, until }
  const ipKey = createIpKeyer({ salt: crypto.randomBytes(16) })
  const sweep = (t) => {
    for (const [k, at] of anonSeen) if (t - at > DAY) anonSeen.delete(k)
    for (const [k, v] of anonRate) if (v.until <= t) anonRate.delete(k)
  }

  const pubOut = (r) => ({ id: r.id, body: r.body, name: r.name || '', lang: r.lang, prayed: r.prayed, at: r.decided_at })
  const mineOut = (r, t) => ({
    id: r.id, body: r.body, name: r.name || '', lang: r.lang,
    status: r.status === 'approved' && r.expires_at <= t ? 'expired' : r.status,
    reason: r.status === 'rejected' ? r.reason : null, prayed: r.prayed, createdAt: r.created_at, expiresAt: r.expires_at || null,
  })

  router.get('/dua-wall', (req, res) => {
    const t = now()
    const lang = typeof req.query.lang === 'string' && LANG_RE.test(req.query.lang) ? req.query.lang : ''
    const before = /^\d{1,15}$/.test(String(req.query.before || '')) ? Number(req.query.before) : Number.MAX_SAFE_INTEGER
    const rows = st.pub.all(t, lang, lang, before, PAGE + 1)
    res.set({ 'Cache-Control': 'public, max-age=15', 'X-Robots-Tag': 'noindex' })
    res.json({ items: rows.slice(0, PAGE).map(pubOut), next: rows.length > PAGE ? rows[PAGE - 1].decided_at : null })
  })

  router.get('/dua-wall/mine', auth, (req, res) => {
    const t = now()
    res.json({
      items: st.mine.all(req.user.id).map((r) => mineOut(r, t)),
      today: st.today.get(req.user.id, t - DAY).n,
      limits: { perDay: PER_DAY, body: MAX_BODY, minBody: MIN_BODY, name: MAX_NAME, showDays: SHOW_MS / DAY, reasons: REPORT_REASONS },
    })
  })

  router.post('/dua-wall', auth, kit.requireVerified, json, (req, res) => {
    const uid = req.user.id
    const t = now()
    if (st.today.get(uid, t - DAY).n >= PER_DAY) return err(res, 429, 'daily_limit', 'Daily limit reached')
    const v = validSubmission(req.body, bannedList())
    if (v.error) return err(res, 400, v.error, 'Not accepted')
    const id = Number(st.add.run(uid, v.body, v.name, v.lang, t).lastInsertRowid)
    res.status(201).json({ item: mineOut(st.get.get(id), t) })
  })

  router.delete('/dua-wall/:id', auth, (req, res) => {
    const id = idOf(req)
    if (!id || !st.delOwn.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  const visible = (id, t) => {
    const d = id ? st.get.get(id) : null
    if (!d || d.status !== 'approved' || d.expires_at <= t) return null
    const a = st.authorActive.get(d.user_id)
    return a && !a.disabled ? d : null
  }

  router.post('/dua-wall/:id/pray', (req, res) => {
    res.set('Cache-Control', 'no-store')
    if (csrfRejected(req, allowedOrigins)) return err(res, 403, 'forbidden', 'Forbidden')
    const t = now()
    const d = visible(idOf(req), t)
    if (!d) return err(res, 404, 'not_found', 'Not found')
    const user = optionalUser(req)
    let added
    if (user) {
      added = tx(() => {
        const a = st.pray.run(d.id, user.id, t).changes > 0
        if (a) st.bump.run(d.id)
        return a
      })
    } else {
      if (anonSeen.size >= anonMapCap || anonRate.size >= anonMapCap) {
        sweep(t)
        // Təmizləmədən sonra da doludursa — yeni girişsiz qeyd qəbul olunmur (yaddaş həddi)
        if (anonSeen.size >= anonMapCap || anonRate.size >= anonMapCap) return err(res, 429, 'rate_limited', 'Too many requests')
      }
      const ik = ipKey(req)
      const r = anonRate.get(ik)
      if (r && r.until > t && r.n >= anonPrayPerHour) return err(res, 429, 'rate_limited', 'Too many requests')
      if (!r || r.until <= t) anonRate.set(ik, { n: 1, until: t + 3600e3 }); else r.n++
      const k = `${ik}:${d.id}`
      const at = anonSeen.get(k)
      added = !(at && t - at < DAY)
      if (added) { anonSeen.set(k, t); st.bump.run(d.id) }
    }
    res.json({ prayed: st.get.get(d.id).prayed, already: !added })
  })

  router.post('/dua-wall/:id/report', auth, kit.requireVerified, json, (req, res) => {
    const t = now()
    const d = visible(idOf(req), t)
    if (!d) return err(res, 404, 'not_found', 'Not found')
    if (d.user_id === req.user.id) return err(res, 400, 'own', 'Own request')
    const reason = (req.body || {}).reason
    if (!REPORT_REASONS.includes(reason)) return err(res, 400, 'bad_reason', 'Unknown reason')
    const today = st.reportsToday.get(req.user.id, t - DAY).n
    if (today >= MAX_REPORTS_PER_DAY) return err(res, 429, 'rate_limited', 'Too many reports today')
    // Sayılan şikayət: hesab ≥ 24 saat + gündə ilk 5 şikayət. Sayılmayan da qeyd olunur (editor görür).
    const age = t - (Number(req.user.created_at) || t)
    const counts = age >= REPORTER_MIN_AGE_MS && today < COUNTED_REPORTS_PER_DAY
    tx(() => {
      if (!st.report.run(d.id, req.user.id, reason, t).changes) return
      if (!counts) return
      st.reported.run(d.id)
      if (st.get.get(d.id).reported >= REQUEUE_REPORTS) st.requeue.run(d.id)
    })
    res.status(202).json({ ok: true })
  })

  // ── Moderasiya (admin paneli, editor+) — müəllifin e-poçtu / hesab id-si GÖSTƏRİLMİR ──
  if (requireEditor) {
    // counts.reported — növbədə (pending) şikayətli; counts.flagged — divarda qalan, şikayət olunmuş
    const counts = () => {
      const out = { pending: 0, approved: 0, rejected: 0, reported: 0, flagged: st.flaggedCount.get(now()).n }
      for (const r of st.count.all()) { out[r.status] = r.n; if (r.status === 'pending') out.reported = r.r || 0 }
      return out
    }
    router.get('/admin/dua-wall', ...requireEditor, (req, res) => {
      const status = ['pending', 'approved', 'rejected', 'reported'].includes(req.query.status) ? req.query.status : 'pending'
      const page = Math.max(1, Math.min(1000, Number(req.query.page) || 1))
      const t = now()
      const rows = status === 'reported' ? st.flagged.all(t, 50, (page - 1) * 50) : st.queue.all(status, 50, (page - 1) * 50)
      res.json({
        items: rows.map((r) => ({
          id: r.id, body: r.body, name: r.name || '', lang: r.lang, status: r.status, reason: r.reason || null,
          reported: r.reported, prayed: r.prayed, createdAt: r.created_at, decidedAt: r.decided_at || null,
          expired: r.status === 'approved' && r.expires_at <= t, reports: st.reportsOf.all(r.id).map((x) => ({ reason: x.reason, at: x.created_at })),
          ...(status === 'reported' ? { flagged: true, reportsSinceApproval: r.n } : {}),
        })),
        status, counts: counts(), page, reasons: REJECT_REASONS,
      })
    })
    // /banned — :id-dən ƏVVƏL (yoxsa 'banned' id kimi tutulur)
    router.get('/admin/dua-wall/banned', ...requireEditor, (req, res) => res.json({ words: bannedList() }))
    router.post('/admin/dua-wall/banned', ...requireEditor, json, (req, res) => {
      const w = kit.cleanLine((req.body || {}).word, 40, { required: true })
      if (!w || w.length < 2) return err(res, 400, 'bad_request', 'Invalid word')
      if (st.banned.all().length >= 500) return err(res, 409, 'too_many', 'Too many words')
      st.addBanned.run(w.normalize('NFKC').toLowerCase(), now())
      res.json({ words: bannedList() })
    })
    router.delete('/admin/dua-wall/banned/:word', ...requireEditor, (req, res) => {
      st.delBanned.run(String(req.params.word || '').slice(0, 40).normalize('NFKC').toLowerCase())
      res.json({ words: bannedList() })
    })
    router.post('/admin/dua-wall/:id', ...requireEditor, json, (req, res) => {
      const id = idOf(req)
      const d = id ? st.get.get(id) : null
      if (!d) return err(res, 404, 'not_found', 'Not found')
      const { action, reason } = req.body || {}
      const t = now()
      const adminId = req.adminUser ? req.adminUser.id : null
      if (action === 'approve') st.approve.run(t, t + SHOW_MS, id)
      else if (action === 'reject') {
        if (!REJECT_REASONS.includes(reason)) return err(res, 400, 'bad_reason', 'Unknown reason')
        st.reject.run(reason, t, id)
      } else if (action === 'delete') st.del.run(id)
      else return err(res, 400, 'bad_request', 'Unknown action')
      st.log.run(id, adminId, action, action === 'reject' ? reason : null, t)
      res.json({ ok: true, counts: counts() })
    })
  }

  // eslint-disable-next-line no-unused-vars
  router.use(['/dua-wall', '/admin/dua-wall'], (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('dua wall error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  router.purge = () => {
    const t = now()
    sweep(t)
    return st.purgeShown.run(t - KEEP_AFTER_MS).changes + st.purgeOther.run(t - PENDING_TTL).changes + st.purgeLog.run(t - 90 * DAY).changes
  }
  router.exportUser = (uid) => {
    const t = now()
    return {
      requests: st.mine.all(uid).map((r) => mineOut(r, t)),
      prayedFor: st.prayedByUser.get(uid).n,
      reports: st.reportsByUser.all(uid).map((r) => ({ duaId: r.dua_id, reason: r.reason, at: r.created_at })),
    }
  }
  router.summaryUser = (uid) => ({ requests: st.mine.all(uid).length, prayedFor: st.prayedByUser.get(uid).n })
  return router
}

module.exports = {
  createDuaWallRouter, validSubmission, MIN_BODY, MAX_BODY, MAX_NAME, PER_DAY, SHOW_MS, REJECT_REASONS, REPORT_REASONS, DEFAULT_BANNED,
  REQUEUE_REPORTS, COUNTED_REPORTS_PER_DAY, REPORTER_MIN_AGE_MS,
}
