// ═══════════════════════════════════════════════════════════════════════
// Müəllim sinfi — Quran/hifz müəllimi və şagirdləri (I2)
//
// • Daxil olmuş istifadəçi sinif yaradır (müəllim; ≤ 60 şagird); şagirdlər dəvət keçidi ilə qoşulur
//   (32 bayt token, bazada yalnız SHA-256; müəllim yeniləyə bilər). /together#kj=<token>
// • Tapşırıqlar YALNIZ ŞABLONDAN: əzbərlə (surə + ayə aralığı), oxu (Mushaf səhifələri), təkrar et
//   (surə + ayə aralığı) + son tarix. Sərbəst mətn yoxdur — yeganə istisna müəllimin qısa qeydi
//   (≤ 200 simvol, bütün sinfə görünür; müəllim hesabı ilə məsuliyyət daşıyır). Şagirdlər arası söhbət YOXDUR.
// • Şagird tapşırığı özü "etdim" kimi işarələyir. Müəllim FƏRDİ vəziyyəti (kim nəyi edib, hifz xülasəsi)
//   YALNIZ həmin şagird açıq razılıq verəndə görür (consent; istənilən vaxt geri alınır — rəqəmlər silinir).
//   Razılıq verməyən şagirdin yalnız adı siyahıdadır ("paylaşmır"). Toplu "etdi" sayı da yalnız
//   paylaşanlardan hesablanır. Şagird başqa şagirdləri görmür (yalnız sayı).
// • Hifz xülasəsi rəqəmlərini KLİENT hesablayır (src/utils/familyStats.js ilə eyni) — server oxuya bilmir.
// • "Məni yoxla" (server/hifzTest.js): müəllim sinifdəki şagird üçün yoxlama keçidi yaradır — keçid
//   ŞAGİRDİN adına (nəticə onun SRS-inə düşür), müəllim yoxlayan kimi açır. Əlaqə class_hifz_tests-də.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır); users(id) ON DELETE CASCADE.
//
// Endpoint-lər (hamısı requireUser — cookie + CSRF):
//   GET    /api/classes                              → { teaching:[…], learning:[…], limits }
//   POST   /api/classes                              { name } → 201 { class, token }
//   GET    /api/classes/:id                          → müəllim / şagird görünüşü
//   PATCH  /api/classes/:id                          { name?, note? } (müəllim)
//   DELETE /api/classes/:id                          (müəllim)
//   POST   /api/classes/:id/invite                   → { token } (müəllim; köhnə keçid ləğv)
//   POST   /api/classes/join/preview                 { token } → { class, already, teacher }
//   POST   /api/classes/join                         { token, consent? } → { id }
//   DELETE /api/classes/:id/me                       şagird çıxır
//   DELETE /api/classes/:id/students/:uid            müəllim şagirdi çıxarır
//   POST   /api/classes/:id/assignments              { kind, surah?, from, to, dueOn } → 201 (müəllim)
//   DELETE /api/classes/:id/assignments/:aid         (müəllim)
//   POST   /api/classes/:id/assignments/:aid/done    { done } (şagird)
//   PUT    /api/classes/:id/share                    { consent?, stats } (şagird) · DELETE — paylaşmanı dayandır
//   POST   /api/classes/:id/tests                    { studentId, surah, from, to } → 201 { token, test } (müəllim)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const { cleanLine, cleanText, personLabel } = require('./personal')
const { AYAHS } = require('./readTogether')

const MAX_STUDENTS = 60
const MAX_TEACHING = 10
const MAX_LEARNING = 20
const MAX_ASSIGNMENTS = 100
const MAX_NAME = 60
const MAX_NOTE = 200
const MAX_STAT = 1_000_000
const MUSHAF_PAGES = 604
const KINDS = ['memorize', 'read', 'review']
// Şagirdin müəllimlə paylaşa biləcəyi xülasə (src/utils/familyStats.js-dən)
const STAT_FIELDS = ['hifzAyahs', 'quranAyahsTotal', 'quranDaysWeek']
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY = 86400000

const SCHEMA = `
CREATE TABLE IF NOT EXISTS classes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  invite_hash TEXT UNIQUE,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS classes_by_teacher ON classes(teacher_id);
CREATE TABLE IF NOT EXISTS class_members (
  class_id   INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  INTEGER NOT NULL,
  consent_at INTEGER,
  stats      TEXT,
  stats_at   INTEGER,
  PRIMARY KEY (class_id, user_id)
);
CREATE INDEX IF NOT EXISTS class_members_by_user ON class_members(user_id);
CREATE TABLE IF NOT EXISTS class_assignments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id   INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('memorize','read','review')),
  surah      INTEGER,
  a_from     INTEGER NOT NULL,
  a_to       INTEGER NOT NULL,
  due_on     TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS class_assignments_by_class ON class_assignments(class_id, due_on);
CREATE TABLE IF NOT EXISTS class_done (
  assignment_id INTEGER NOT NULL REFERENCES class_assignments(id) ON DELETE CASCADE,
  class_id      INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  done_at       INTEGER NOT NULL,
  PRIMARY KEY (assignment_id, user_id),
  FOREIGN KEY (class_id, user_id) REFERENCES class_members(class_id, user_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS class_hifz_tests (
  test_id    INTEGER PRIMARY KEY REFERENCES hifz_tests(id) ON DELETE CASCADE,
  class_id   INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (class_id, student_id) REFERENCES class_members(class_id, user_id) ON DELETE CASCADE
);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10)
const parse = (s, fb) => { try { return JSON.parse(s) } catch { return fb } }
function validDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d, 12))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

/** Tapşırıq gövdəsi → normal | { error } */
function validAssignment(b, today) {
  if (!b || !KINDS.includes(b.kind)) return { error: 'bad_kind' }
  const from = b.from, to = b.to
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || from > to) return { error: 'bad_range' }
  let surah = null
  if (b.kind === 'read') {
    if (to > MUSHAF_PAGES) return { error: 'bad_range' }
  } else {
    surah = b.surah
    if (!Number.isInteger(surah) || surah < 1 || surah > 114 || to > AYAHS[surah - 1]) return { error: 'bad_range' }
  }
  const ms = Date.parse(`${today}T12:00:00Z`)
  if (!validDate(b.dueOn) || b.dueOn < keyOf(ms - DAY) || b.dueOn > keyOf(ms + 366 * DAY)) return { error: 'bad_date' }
  return { kind: b.kind, surah, from, to, dueOn: b.dueOn }
}

/** Paylaşma rəqəmləri → { stats } | null — yalnız ağ siyahı, tam ədədlər */
function validStats(src) {
  if (!src || typeof src !== 'object' || Array.isArray(src)) return null
  const out = {}
  for (const k of Object.keys(src)) if (!STAT_FIELDS.includes(k)) return null
  for (const f of STAT_FIELDS) {
    const v = src[f]
    if (v == null) continue
    if (!Number.isInteger(v) || v < 0 || v > MAX_STAT) return null
    out[f] = v
  }
  return out
}

function createClassesRouter({ db, requireUser, hifzTests = null, now = () => Date.now(), log = console }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    insert: p('INSERT INTO classes (teacher_id, name, note, invite_hash, created_at, updated_at) VALUES (?, ?, \'\', ?, ?, ?)'),
    one: p('SELECT * FROM classes WHERE id = ?'),
    byHash: p('SELECT * FROM classes WHERE invite_hash = ?'),
    setInvite: p('UPDATE classes SET invite_hash = ?, updated_at = ? WHERE id = ? AND teacher_id = ?'),
    update: p('UPDATE classes SET name = ?, note = ?, updated_at = ? WHERE id = ? AND teacher_id = ?'),
    del: p('DELETE FROM classes WHERE id = ? AND teacher_id = ?'),
    teaching: p('SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC, id DESC'),
    learning: p(`SELECT c.*, m.consent_at FROM class_members m JOIN classes c ON c.id = m.class_id
      WHERE m.user_id = ? ORDER BY m.joined_at DESC`),
    teachingCount: p('SELECT COUNT(*) AS n FROM classes WHERE teacher_id = ?'),
    learningCount: p('SELECT COUNT(*) AS n FROM class_members WHERE user_id = ?'),
    member: p('SELECT * FROM class_members WHERE class_id = ? AND user_id = ?'),
    members: p(`SELECT m.user_id, m.joined_at, m.consent_at, m.stats, m.stats_at, u.email, u.display_name
      FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? ORDER BY m.joined_at, m.user_id`),
    memberCount: p('SELECT COUNT(*) AS n FROM class_members WHERE class_id = ?'),
    addMember: p('INSERT INTO class_members (class_id, user_id, joined_at, consent_at) VALUES (?, ?, ?, ?)'),
    removeMember: p('DELETE FROM class_members WHERE class_id = ? AND user_id = ?'),
    share: p('UPDATE class_members SET consent_at = COALESCE(consent_at, ?), stats = ?, stats_at = ? WHERE class_id = ? AND user_id = ?'),
    unshare: p('UPDATE class_members SET consent_at = NULL, stats = NULL, stats_at = NULL WHERE class_id = ? AND user_id = ?'),
    assignments: p('SELECT * FROM class_assignments WHERE class_id = ? ORDER BY due_on DESC, id DESC'),
    assignment: p('SELECT * FROM class_assignments WHERE id = ? AND class_id = ?'),
    assignmentCount: p('SELECT COUNT(*) AS n FROM class_assignments WHERE class_id = ?'),
    addAssignment: p('INSERT INTO class_assignments (class_id, kind, surah, a_from, a_to, due_on, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    delAssignment: p('DELETE FROM class_assignments WHERE id = ? AND class_id = ?'),
    done: p('INSERT OR IGNORE INTO class_done (assignment_id, class_id, user_id, done_at) VALUES (?, ?, ?, ?)'),
    undone: p('DELETE FROM class_done WHERE assignment_id = ? AND user_id = ?'),
    doneOf: p('SELECT assignment_id FROM class_done WHERE class_id = ? AND user_id = ?'),
    doneAll: p(`SELECT d.assignment_id, d.user_id FROM class_done d JOIN class_members m ON m.class_id = d.class_id AND m.user_id = d.user_id
      WHERE d.class_id = ? AND m.consent_at IS NOT NULL`),
    addTest: p('INSERT INTO class_hifz_tests (test_id, class_id, student_id, created_at) VALUES (?, ?, ?, ?)'),
    tests: p('SELECT test_id, student_id FROM class_hifz_tests WHERE class_id = ? ORDER BY created_at DESC LIMIT 300'),
    user: p('SELECT id, email, display_name FROM users WHERE id = ?'),
  }
  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const num = (s) => (/^\d{1,12}$/.test(s || '') ? Number(s) : 0)

  const asgOut = (a) => ({ id: a.id, kind: a.kind, surah: a.surah, from: a.a_from, to: a.a_to, dueOn: a.due_on, createdAt: a.created_at })
  const head = (c) => ({ id: c.id, name: c.name, note: c.note || '', students: st.memberCount.get(c.id).n, max: MAX_STUDENTS })

  /** Müəllim görünüşü: fərdi vəziyyət YALNIZ razılıq verən şagirdlər üçün */
  function teacherView(c) {
    const done = new Map()
    for (const r of st.doneAll.all(c.id)) {
      if (!done.has(r.user_id)) done.set(r.user_id, [])
      done.get(r.user_id).push(r.assignment_id)
    }
    const tests = st.tests.all(c.id)
    const status = hifzTests && tests.length ? hifzTests.statusOf(tests.map((t) => t.test_id)) : {}
    const students = st.members.all(c.id).map((m) => {
      const shared = m.consent_at != null
      return {
        id: m.user_id, label: personLabel(m), joinedAt: m.joined_at, sharing: shared,
        ...(shared ? { done: done.get(m.user_id) || [], stats: parse(m.stats, {}), statsAt: m.stats_at } : {}),
        tests: tests.filter((t) => t.student_id === m.user_id && status[t.test_id]).map((t) => ({ id: t.test_id, ...status[t.test_id] })),
      }
    })
    const sharing = students.filter((s) => s.sharing).length
    return {
      class: { ...head(c), role: 'teacher', sharing },
      assignments: st.assignments.all(c.id).map((a) => ({ ...asgOut(a), doneCount: students.filter((s) => s.sharing && s.done.includes(a.id)).length })),
      students,
    }
  }
  /** Şagird görünüşü: öz işarələri, müəllimin adı, sinfin ümumi sayı. Başqa şagird yoxdur. */
  function studentView(c, uid) {
    const m = st.member.get(c.id, uid)
    const mine = new Set(st.doneOf.all(c.id, uid).map((r) => r.assignment_id))
    return {
      class: { ...head(c), role: 'student', teacher: personLabel(st.user.get(c.teacher_id)) },
      assignments: st.assignments.all(c.id).map((a) => ({ ...asgOut(a), done: mine.has(a.id) })),
      share: m.consent_at != null ? { stats: parse(m.stats, {}), updatedAt: m.stats_at } : null,
      consent: m.consent_at != null,
    }
  }
  const viewOf = (c, uid) => (c.teacher_id === uid ? teacherView(c) : studentView(c, uid))
  const access = (req, res, { teacher = false } = {}) => {
    const id = num(req.params.id)
    const c = id && st.one.get(id)
    const uid = req.user.id
    if (!c || (c.teacher_id !== uid && !st.member.get(c.id, uid))) { err(res, 404, 'not_found', 'Not found'); return null }
    if (teacher && c.teacher_id !== uid) { err(res, 403, 'teacher_only', 'Only the teacher can do this'); return null }
    if (!teacher && req.requireStudent && c.teacher_id === uid) { err(res, 403, 'student_only', 'Only students can do this'); return null }
    return c
  }
  const student = (req, res, next) => { req.requireStudent = true; next() }

  router.use('/classes', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.get('/classes', auth, (req, res) => {
    const uid = req.user.id
    res.json({
      teaching: st.teaching.all(uid).map((c) => ({ ...head(c), role: 'teacher', assignments: st.assignmentCount.get(c.id).n })),
      learning: st.learning.all(uid).map((c) => ({ ...head(c), role: 'student', teacher: personLabel(st.user.get(c.teacher_id)), sharing: c.consent_at != null })),
      limits: { students: MAX_STUDENTS, teaching: MAX_TEACHING, learning: MAX_LEARNING, name: MAX_NAME, note: MAX_NOTE, fields: STAT_FIELDS },
    })
  })

  router.post('/classes', auth, json, (req, res) => {
    const uid = req.user.id
    const name = cleanLine((req.body || {}).name, MAX_NAME, { required: true })
    if (!name) return err(res, 400, 'bad_name', 'Invalid name')
    const token = crypto.randomBytes(32).toString('base64url')
    const id = tx(() => {
      if (st.teachingCount.get(uid).n >= MAX_TEACHING) return null
      return Number(st.insert.run(uid, name, sha256(token), now(), now()).lastInsertRowid)
    })
    if (id == null) return err(res, 409, 'too_many', 'Too many classes')
    res.status(201).json({ ...teacherView(st.one.get(id)), token })
  })

  const byToken = (b) => (b && typeof b.token === 'string' && TOKEN_RE.test(b.token) ? st.byHash.get(sha256(b.token)) : null)
  router.post('/classes/join/preview', auth, json, (req, res) => {
    const c = byToken(req.body)
    if (!c) return err(res, 404, 'invalid_token', 'Invalid link')
    res.json({
      class: { id: c.id, name: c.name, teacher: personLabel(st.user.get(c.teacher_id)), students: st.memberCount.get(c.id).n, max: MAX_STUDENTS },
      already: Boolean(st.member.get(c.id, req.user.id)), teacher: c.teacher_id === req.user.id,
    })
  })

  router.post('/classes/join', auth, json, (req, res) => {
    const uid = req.user.id
    const b = req.body || {}
    const c = byToken(b)
    if (!c) return err(res, 404, 'invalid_token', 'Invalid link')
    if (c.teacher_id === uid) return err(res, 400, 'self', 'This is your own class')
    if (b.consent != null && typeof b.consent !== 'boolean') return err(res, 400, 'bad_request', 'Invalid consent')
    if (st.member.get(c.id, uid)) return res.json({ id: c.id, already: true })
    const r = tx(() => {
      if (st.memberCount.get(c.id).n >= MAX_STUDENTS) return 'full'
      if (st.learningCount.get(uid).n >= MAX_LEARNING) return 'too_many'
      st.addMember.run(c.id, uid, now(), b.consent === true ? now() : null)
      return 'ok'
    })
    if (r === 'full') return err(res, 409, 'full', 'Class is full')
    if (r === 'too_many') return err(res, 409, 'too_many', 'Too many classes')
    res.json({ id: c.id, already: false })
  })

  router.get('/classes/:id', auth, (req, res) => {
    const c = access(req, res); if (!c) return
    res.json(viewOf(c, req.user.id))
  })

  router.patch('/classes/:id', auth, json, (req, res) => {
    const c = access(req, res, { teacher: true }); if (!c) return
    const b = req.body || {}
    const name = b.name == null ? c.name : cleanLine(b.name, MAX_NAME, { required: true })
    if (!name) return err(res, 400, 'bad_name', 'Invalid name')
    const note = b.note == null ? c.note : cleanText(b.note, MAX_NOTE)
    if (note == null) return err(res, 400, 'bad_note', 'Invalid note')
    st.update.run(name, note, now(), c.id, req.user.id)
    res.json(teacherView(st.one.get(c.id)))
  })

  router.delete('/classes/:id', auth, (req, res) => {
    const c = access(req, res, { teacher: true }); if (!c) return
    st.del.run(c.id, req.user.id)
    res.json({ ok: true })
  })

  router.post('/classes/:id/invite', auth, (req, res) => {
    const c = access(req, res, { teacher: true }); if (!c) return
    const token = crypto.randomBytes(32).toString('base64url')
    st.setInvite.run(sha256(token), now(), c.id, req.user.id)
    res.json({ token })
  })

  router.delete('/classes/:id/me', auth, student, (req, res) => {
    const c = access(req, res); if (!c) return
    st.removeMember.run(c.id, req.user.id)
    res.json({ ok: true })
  })

  router.delete('/classes/:id/students/:uid', auth, (req, res) => {
    const c = access(req, res, { teacher: true }); if (!c) return
    const sid = num(req.params.uid)
    if (!sid || !st.removeMember.run(c.id, sid).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  router.post('/classes/:id/assignments', auth, json, (req, res) => {
    const c = access(req, res, { teacher: true }); if (!c) return
    const v = validAssignment(req.body, keyOf(now()))
    if (v.error) return err(res, 400, v.error, 'Invalid assignment')
    const id = tx(() => {
      if (st.assignmentCount.get(c.id).n >= MAX_ASSIGNMENTS) return null
      return Number(st.addAssignment.run(c.id, v.kind, v.surah, v.from, v.to, v.dueOn, now()).lastInsertRowid)
    })
    if (id == null) return err(res, 409, 'too_many', 'Too many assignments')
    res.status(201).json({ assignment: asgOut(st.assignment.get(id, c.id)), ...teacherView(c) })
  })

  router.delete('/classes/:id/assignments/:aid', auth, (req, res) => {
    const c = access(req, res, { teacher: true }); if (!c) return
    const aid = num(req.params.aid)
    if (!aid || !st.delAssignment.run(aid, c.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  router.post('/classes/:id/assignments/:aid/done', auth, student, json, (req, res) => {
    const c = access(req, res); if (!c) return
    const aid = num(req.params.aid)
    const a = aid && st.assignment.get(aid, c.id)
    if (!a) return err(res, 404, 'not_found', 'Not found')
    const { done } = req.body || {}
    if (typeof done !== 'boolean') return err(res, 400, 'bad_request', 'Invalid request')
    if (done) st.done.run(a.id, c.id, req.user.id, now())
    else st.undone.run(a.id, req.user.id)
    res.json(studentView(c, req.user.id))
  })

  router.put('/classes/:id/share', auth, student, json, (req, res) => {
    const c = access(req, res); if (!c) return
    const b = req.body || {}
    const m = st.member.get(c.id, req.user.id)
    if (m.consent_at == null && b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    const stats = validStats(b.stats == null ? {} : b.stats)
    if (!stats) return err(res, 400, 'bad_request', 'Invalid summary')
    st.share.run(now(), JSON.stringify(stats), now(), c.id, req.user.id)
    res.json(studentView(c, req.user.id))
  })

  router.delete('/classes/:id/share', auth, student, (req, res) => {
    const c = access(req, res); if (!c) return
    st.unshare.run(c.id, req.user.id)
    res.json(studentView(c, req.user.id))
  })

  router.post('/classes/:id/tests', auth, json, (req, res) => {
    const c = access(req, res, { teacher: true }); if (!c) return
    if (!hifzTests) return err(res, 503, 'unavailable', 'Unavailable')
    const b = req.body || {}
    const sid = Number(b.studentId)
    const m = Number.isInteger(sid) ? st.member.get(c.id, sid) : null
    if (!m) return err(res, 404, 'not_found', 'Unknown student')
    const s = st.user.get(sid)
    const r = hifzTests.createFor(sid, { surah: b.surah, from: b.from, to: b.to }, personLabel(s) || 'Student')
    if (r.error) return err(res, r.error === 'too_many' ? 409 : 400, r.error, 'Could not create the check')
    st.addTest.run(r.test.id, c.id, sid, now())
    res.status(201).json({ token: r.token, test: { id: r.test.id, status: r.test.status, surah: r.test.surah, from: r.test.from, to: r.test.to, expiresAt: r.test.expiresAt } })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/classes', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    log.error('classes error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** "Mənim məlumatlarım": dərs dediyim siniflər (şagirdlərin paylaşdıqları daxil — müəllimin gördüyü), öyrəndiyim siniflər (token heşi YOX) */
  router.exportUser = (uid) => ({
    teaching: st.teaching.all(uid).map((c) => teacherView(c)),
    learning: st.learning.all(uid).map((c) => studentView(c, uid)),
  })
  router.summaryUser = (uid) => ({ teaching: st.teachingCount.get(uid).n, learning: st.learningCount.get(uid).n })
  return router
}

module.exports = {
  createClassesRouter, validAssignment, validStats,
  STAT_FIELDS, MAX_STUDENTS, MAX_TEACHING, MAX_LEARNING, MAX_ASSIGNMENTS, MAX_NAME, MAX_NOTE,
}
