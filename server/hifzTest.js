// ═══════════════════════════════════════════════════════════════════════
// "Məni yoxla" — hifz yoxlama keçidi (insan yoxlayır; NİTQ TANIMA YOXDUR — qərarla çıxarılıb)
//
// • Hesab sahibi əzbərlədiyi surəni (və ayə aralığını) seçib keçid yaradır (24 saat).
// • Yoxlayan (girişsiz) keçidi açır: yalnız seçilmiş ayələri (mətn klientdə saytın Quran
//   mənbəyindən — server mətn saxlamır) və sahibin seçdiyi ADI görür; sahib qarşısında /
//   telefonda oxuyarkən səhv və tərəddüd olan ayələri (və ya sözləri) işarələyib göndərir.
// • Nəticə sahib götürənə qədər saxlanır, götürüləndən 7 gün sonra silinir. Sahibin klienti
//   onu hifz təkrar planına (src/utils/hifzSrs.js) idxal edir — səhvli ayələr tez təkrara düşür.
// • Token: 32 bayt (256 bit), bazada yalnız SHA-256; URL fraqmentindədir (#t=…), serverə
//   gövdədə gəlir — nginx loguna düşmür. Sərbəst mətn qəbul olunmur (yalnız işarələr).
//
// Cədvəl MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS), users(id) ON DELETE CASCADE.
//
//   POST   /api/hifz-tests              (girişli) { surah, from, to, name } → 201 { test, token }
//   GET    /api/hifz-tests              (girişli) → { tests:[…], max } — nəticəsi olanlar "götürülmüş" sayılır
//   DELETE /api/hifz-tests/:id          (girişli) → { ok }
//   POST   /api/hifz-tests/open         { token } → { surah, from, to, name, expiresAt, submitted }
//   POST   /api/hifz-tests/submit       { token, marks:[{ a, kind:'mistake'|'hesitation', words?:[n] }] } → { ok }
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const { csrfRejected } = require('./auth')
const { AYAHS, cleanLine } = require('./readTogether')

const TEST_TTL_MS = 24 * 3600e3
const RESULT_KEEP_MS = 7 * 24 * 3600e3        // götürüləndən sonra
const UNFETCHED_KEEP_MS = 90 * 24 * 3600e3    // heç götürülməsə də ən çox
const MAX_OPEN_TESTS = 10
const MAX_RANGE = 300
const MAX_NAME = 40
const MAX_WORDS_PER_AYAH = 40
const KINDS = ['mistake', 'hesitation']
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const LIMITS = {
  create: { max: 20, windowMs: 3600e3 },     // istifadəçi üzrə
  open: { max: 60, windowMs: 10 * 60e3 },    // IP üzrə
  submit: { max: 20, windowMs: 10 * 60e3 },  // IP üzrə
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS hifz_tests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  surah        INTEGER NOT NULL,
  from_ayah    INTEGER NOT NULL,
  to_ayah      INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  result       TEXT,
  submitted_at INTEGER,
  fetched_at   INTEGER
);
CREATE INDEX IF NOT EXISTS hifz_tests_by_user ON hifz_tests(user_id, created_at);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')

/** { surah, from, to } → normal | null */
function validRange(b) {
  const surah = Number(b && b.surah), from = Number(b && b.from), to = Number(b && b.to)
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null
  const n = AYAHS[surah - 1]
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > n || from > to || to - from + 1 > MAX_RANGE) return null
  return { surah, from, to }
}

/** İşarələr → normal massiv | null. Hər ayə bir dəfə; söz indeksləri 1…40. */
function validMarks(marks, t) {
  if (!Array.isArray(marks) || marks.length > t.to_ayah - t.from_ayah + 1) return null
  const seen = new Set()
  const out = []
  for (const m of marks) {
    if (!m || typeof m !== 'object') return null
    const a = Number(m.a)
    if (!Number.isInteger(a) || a < t.from_ayah || a > t.to_ayah || seen.has(a) || !KINDS.includes(m.kind)) return null
    seen.add(a)
    let words = []
    if (m.words != null) {
      if (!Array.isArray(m.words) || m.words.length > MAX_WORDS_PER_AYAH) return null
      words = [...new Set(m.words)]
      if (words.some((w) => !Number.isInteger(w) || w < 1 || w > 200)) return null
      words.sort((x, y) => x - y)
    }
    out.push({ a, kind: m.kind, ...(words.length ? { words } : {}) })
  }
  return out.sort((x, y) => x.a - y.a)
}

function createHifzTestRouter({ db, requireUser, allowedOrigins = [], now = () => Date.now(), limits = LIMITS }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const p = (sql) => raw.prepare(sql)
  const st = {
    insert: p(`INSERT INTO hifz_tests (user_id, token_hash, surah, from_ayah, to_ayah, display_name, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
    open: p('SELECT COUNT(*) AS n FROM hifz_tests WHERE user_id = ? AND result IS NULL AND expires_at > ?'),
    list: p('SELECT * FROM hifz_tests WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50'),
    byHash: p('SELECT * FROM hifz_tests WHERE token_hash = ?'),
    fetched: p('UPDATE hifz_tests SET fetched_at = ? WHERE user_id = ? AND result IS NOT NULL AND fetched_at IS NULL'),
    del: p('DELETE FROM hifz_tests WHERE id = ? AND user_id = ?'),
    submit: p('UPDATE hifz_tests SET result = ?, submitted_at = ? WHERE id = ? AND result IS NULL AND expires_at > ?'),
    purge: p(`DELETE FROM hifz_tests WHERE
      (result IS NULL AND expires_at <= ?) OR (fetched_at IS NOT NULL AND fetched_at <= ?) OR (submitted_at IS NOT NULL AND submitted_at <= ?)`),
  }
  const router = express.Router()
  const json = express.json({ limit: '8kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const csrf = (req, res, next) => (csrfRejected(req, allowedOrigins) ? err(res, 403, 'forbidden', 'Forbidden') : next())

  const buckets = Object.fromEntries(Object.keys(limits).map((k) => [k, new Map()]))
  function limited(kind, key) {
    const { max, windowMs } = limits[kind]
    const map = buckets[kind]
    const t = now()
    const list = (map.get(key) || []).filter((x) => t - x < windowMs)
    const over = list.length >= max
    if (!over) list.push(t)
    map.set(key, list)
    if (map.size > 20000) map.clear()
    return over
  }

  const testOut = (r) => {
    const t = now()
    const status = r.result != null ? 'done' : r.expires_at <= t ? 'expired' : 'open'
    return {
      id: r.id, surah: r.surah, from: r.from_ayah, to: r.to_ayah, name: r.display_name,
      createdAt: r.created_at, expiresAt: r.expires_at, status,
      result: r.result != null ? { marks: JSON.parse(r.result), submittedAt: r.submitted_at } : null,
    }
  }
  const byToken = (b) => (b && typeof b.token === 'string' && TOKEN_RE.test(b.token) ? st.byHash.get(sha256(b.token)) : null)

  router.use('/hifz-tests', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.post('/hifz-tests', auth, json, (req, res) => {
    const uid = req.user.id
    if (limited('create', `u${uid}`)) return err(res, 429, 'rate_limited', 'Too many requests')
    const r = validRange(req.body)
    if (!r) return err(res, 400, 'bad_range', 'Invalid surah or ayah range')
    const name = cleanLine(req.body.name, MAX_NAME) || cleanLine(req.user.display_name, MAX_NAME)
    if (!name) return err(res, 400, 'bad_name', 'Name required')
    const t = now()
    if (st.open.get(uid, t).n >= MAX_OPEN_TESTS) return err(res, 409, 'too_many', 'Too many open links')
    const token = crypto.randomBytes(32).toString('base64url')
    const id = Number(st.insert.run(uid, sha256(token), r.surah, r.from, r.to, name, t, t + TEST_TTL_MS).lastInsertRowid)
    const row = st.list.all(uid).find((x) => x.id === id)
    res.status(201).json({ test: testOut(row), token })
  })

  router.get('/hifz-tests', auth, (req, res) => {
    const uid = req.user.id
    const rows = st.list.all(uid)
    st.fetched.run(now(), uid)   // nəticə sahibə çatdı — 7 gündən sonra silinəcək
    res.json({ tests: rows.map(testOut), max: MAX_OPEN_TESTS })
  })

  router.delete('/hifz-tests/:id', auth, (req, res) => {
    const id = /^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0
    if (!id || !st.del.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  // ── Yoxlayan (girişsiz) ──
  router.post('/hifz-tests/open', csrf, json, (req, res) => {
    if (limited('open', req.ip || '')) return err(res, 429, 'rate_limited', 'Too many requests')
    const t = byToken(req.body)
    if (!t) return err(res, 404, 'invalid_token', 'Invalid link')
    const submitted = t.result != null
    if (!submitted && t.expires_at <= now()) return err(res, 410, 'expired', 'Link expired')
    res.json({ surah: t.surah, from: t.from_ayah, to: t.to_ayah, name: t.display_name, expiresAt: t.expires_at, submitted })
  })

  router.post('/hifz-tests/submit', csrf, json, (req, res) => {
    if (limited('submit', req.ip || '')) return err(res, 429, 'rate_limited', 'Too many requests')
    const t = byToken(req.body)
    if (!t) return err(res, 404, 'invalid_token', 'Invalid link')
    if (t.result != null) return err(res, 409, 'already_submitted', 'Already submitted')
    if (t.expires_at <= now()) return err(res, 410, 'expired', 'Link expired')
    const marks = validMarks(req.body.marks, t)
    if (!marks) return err(res, 400, 'bad_marks', 'Invalid marks')
    if (!st.submit.run(JSON.stringify(marks), now(), t.id, now()).changes) return err(res, 409, 'already_submitted', 'Already submitted')
    res.json({ ok: true })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/hifz-tests', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('hifz-tests error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** Vaxtı keçmiş (cavabsız, +1 gün), götürüləndən 7 gün keçmiş və 90 gündən köhnə nəticələr */
  router.purge = () => {
    const t = now()
    return st.purge.run(t - 24 * 3600e3, t - RESULT_KEEP_MS, t - UNFETCHED_KEEP_MS).changes
  }
  /** "Mənim məlumatlarım" (server/security.js): keçidlər və nəticələr (token heşi YOX); "götürüldü" işarəsi qoyulmur */
  router.exportUser = (uid) => st.list.all(uid).map(testOut)
  router.summaryUser = (uid) => ({ tests: st.list.all(uid).length })
  return router
}

module.exports = { createHifzTestRouter, validRange, validMarks, TEST_TTL_MS, RESULT_KEEP_MS, MAX_OPEN_TESTS, MAX_RANGE, LIMITS }
