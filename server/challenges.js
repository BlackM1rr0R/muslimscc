// ═══════════════════════════════════════════════════════════════════════
// Qrup çağırışları — "30 gün hər gün 2 səhifə Quran", "40 gün sübh vaxtında" … (I1)
//
// • Daxil olmuş istifadəçi ŞABLONDAN çağırış yaradır (sərbəst təsvir YOXDUR — moderasiya lazım
//   olmasın; yalnız "custom" şablonda ≤ 60 simvolluq başlıq). Müddət 7 / 30 / 40 gün, başlanğıc günü.
// • Dəvət keçidi: 32 bayt token, bazada yalnız SHA-256; çoxdəfəlik (qrup ≤ 50 nəfər), sahib yeniləyə
//   bilər (köhnə keçid dərhal işləmir). /together#cj=<token> — fraqment, serverə gövdədə gəlir.
// • Hər üzv öz gününü özü işarələyir (vicdan sistemi). Lövhədə YALNIZ gün üzrə toplu say var
//   ("bu gün 5 nəfərdən 4-ü") — üzvlərin adları, reytinqi, fərdi sayı HEÇ KİMƏ göstərilmir (riya olmasın);
//   hər üzv yalnız öz işarələrini görür. "khatm" şablonunda: 30 cüz üzvlər arasında bölünür
//   (lövhədə yalnız "götürülüb / oxunub" — kimin götürdüyü göstərilmir, öz cüzün "sənin" kimi görünür).
// • Yumşaq gündəlik xatırlatma (istəyə bağlı): üzvün seçdiyi yerli saatda (öz saat qurşağı) — yalnız
//   hesaba bağlanmış push cihazlarına (server/personal.js → personal_push_links). Yoxdursa — heç nə.
//   Həmin gün artıq işarələyibsə göndərilmir; gündə bir dəfə (last_reminded atomik tutulur).
//
// Razılıq: yaratmaq və qoşulmaq üçün consent: true (işarələr serverdə saxlanır — qeyd UI-da).
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır); users(id) ON DELETE CASCADE.
// Bitmiş çağırış 30 gün sonra silinir.
//
// Endpoint-lər (hamısı requireUser — cookie + CSRF):
//   GET    /api/challenges                  → { challenges:[…], limits }
//   POST   /api/challenges                  { template, n?, title?, startOn, days, tz, consent } → 201 { challenge, token }
//   GET    /api/challenges/:id              → lövhə (toplu günlər, öz işarələrim, cüzlər)
//   DELETE /api/challenges/:id              → sahib silir
//   POST   /api/challenges/:id/invite       → { token } (sahib; köhnə keçid ləğv)
//   POST   /api/challenges/join/preview     { token } → { challenge, already }
//   POST   /api/challenges/join             { token, tz, consent } → { id }
//   POST   /api/challenges/:id/tick         { day, done } → { ok, board }
//   POST   /api/challenges/:id/juz          { juz, action: take|release|done|undone } → { ok, board }
//   PATCH  /api/challenges/:id/me           { remindAt: 'HH:MM'|null, tz? } → { reminder }
//   DELETE /api/challenges/:id/me           → üzv çıxır (sahib çıxa bilməz — silir)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const { validTz, cleanLine } = require('./personal')

const MAX_MEMBERS = 50
const MAX_ACTIVE = 10          // istifadəçinin eyni anda iştirak etdiyi (bitməmiş) çağırışlar
const MAX_OWNED = 5            // sahib olduğu bitməmiş çağırışlar
const MAX_TITLE = 60
const DURATIONS = [7, 30, 40]
const KEEP_AFTER_END_DAYS = 30
const REMIND_WINDOW_MIN = 180  // seçilmiş saatdan sonra ən çox 3 saat (server dayanıbsa gecə yarısı göndərməsin)
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DAY = 86400000
// Şablonlar — mətn klientdə 5 dildə (src/components/together/togetherText.js); serverdə push/ICS üçün qısa ad
const TEMPLATES = {
  quran_pages: { n: [1, 20] },   // hər gün N səhifə Quran
  fajr: {},                      // sübh namazı vaxtında
  adhkar: {},                    // səhər və axşam zikrləri
  mulk: {},                      // hər gecə Mülk surəsi
  khatm: {},                     // qrup xətmi — 30 cüz üzvlər arasında
  custom: {},                    // öz başlığı (≤ 60)
}
const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const NAMES = {
  az: { quran_pages: (n) => `Hər gün ${n} səhifə Quran`, fajr: 'Sübh namazı vaxtında', adhkar: 'Səhər və axşam zikrləri', mulk: 'Hər gecə Mülk surəsi', khatm: 'Qrup xətmi', challenge: 'Çağırış' },
  en: { quran_pages: (n) => `${n} ${n === 1 ? 'page' : 'pages'} of Quran daily`, fajr: 'Fajr on time', adhkar: 'Morning and evening adhkar', mulk: 'Surah Al-Mulk every night', khatm: 'Group khatm', challenge: 'Challenge' },
  ru: { quran_pages: (n) => `${n} стр. Корана в день`, fajr: 'Фаджр вовремя', adhkar: 'Утренние и вечерние азкары', mulk: 'Сура «аль-Мульк» каждую ночь', khatm: 'Групповой хатм', challenge: 'Челлендж' },
  tr: { quran_pages: (n) => `Her gün ${n} sayfa Kur’an`, fajr: 'Sabah namazı vaktinde', adhkar: 'Sabah ve akşam zikirleri', mulk: 'Her gece Mülk suresi', khatm: 'Grup hatmi', challenge: 'Meydan okuma' },
  ar: { quran_pages: (n) => `${n} صفحات من القرآن يوميًا`, fajr: 'الفجر في وقته', adhkar: 'أذكار الصباح والمساء', mulk: 'سورة الملك كل ليلة', khatm: 'ختمة جماعية', challenge: 'تحدٍّ' },
}
const PUSH = {
  az: { title: 'Qrup çağırışı', body: (name) => `${name}: bu günü işarələməyi unutmayın.` },
  en: { title: 'Group challenge', body: (name) => `${name}: remember to tick today.` },
  ru: { title: 'Групповой челлендж', body: (name) => `${name}: не забудьте отметить сегодняшний день.` },
  tr: { title: 'Grup meydan okuması', body: (name) => `${name}: bugünü işaretlemeyi unutmayın.` },
  ar: { title: 'تحدٍّ جماعي', body: (name) => `${name}: لا تنسَ تعليم يوم اليوم.` },
}
const langPrefix = (lang) => (lang === 'az' ? '' : `/${MAIL_LANGS.includes(lang) ? lang : 'en'}`)

/** Şablonun göstərilən adı (push, təqvim axını) */
function templateLabel(c, lang = 'en') {
  const T = NAMES[lang] || NAMES.en
  if (c.template === 'custom') return c.title || T.challenge
  const v = T[c.template]
  return typeof v === 'function' ? v(c.n || 1) : (v || T.challenge)
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS challenges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template    TEXT NOT NULL,
  n           INTEGER,
  title       TEXT NOT NULL DEFAULT '',
  start_on    TEXT NOT NULL,
  days        INTEGER NOT NULL,
  end_on      TEXT NOT NULL,
  invite_hash TEXT UNIQUE,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS challenges_by_owner ON challenges(owner_id);
CREATE INDEX IF NOT EXISTS challenges_by_end ON challenges(end_on);
CREATE TABLE IF NOT EXISTS challenge_members (
  challenge_id  INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at     INTEGER NOT NULL,
  consent_at    INTEGER NOT NULL,
  tz            TEXT NOT NULL DEFAULT 'UTC',
  remind_at     TEXT,
  last_reminded TEXT,
  PRIMARY KEY (challenge_id, user_id)
);
CREATE INDEX IF NOT EXISTS challenge_members_by_user ON challenge_members(user_id);
CREATE TABLE IF NOT EXISTS challenge_ticks (
  challenge_id INTEGER NOT NULL,
  user_id      INTEGER NOT NULL,
  day          TEXT NOT NULL,
  at           INTEGER NOT NULL,
  PRIMARY KEY (challenge_id, user_id, day),
  FOREIGN KEY (challenge_id, user_id) REFERENCES challenge_members(challenge_id, user_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS challenge_juz (
  challenge_id INTEGER NOT NULL,
  juz          INTEGER NOT NULL CHECK (juz BETWEEN 1 AND 30),
  user_id      INTEGER NOT NULL,
  done_at      INTEGER,
  PRIMARY KEY (challenge_id, juz),
  FOREIGN KEY (challenge_id, user_id) REFERENCES challenge_members(challenge_id, user_id) ON DELETE CASCADE
);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10)
function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  return keyOf(Date.UTC(y, m - 1, d, 12) + n * DAY)
}
function validDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d, 12))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}
const fmtCache = new Map()
/** ms anında tz-dəki yerli { date: 'YYYY-MM-DD', minutes } */
function localClock(ms, tz) {
  let f = fmtCache.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    fmtCache.set(tz, f)
  }
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) }
}
const hhmmMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))

/** Yaratma gövdəsi → { template, n, title, startOn, days } | { error } */
function validChallenge(b, today) {
  if (!b || typeof b !== 'object') return { error: 'bad_request' }
  const spec = Object.prototype.hasOwnProperty.call(TEMPLATES, b.template) ? TEMPLATES[b.template] : null
  if (!spec) return { error: 'bad_template' }
  let n = null
  if (spec.n) {
    if (!Number.isInteger(b.n) || b.n < spec.n[0] || b.n > spec.n[1]) return { error: 'bad_request' }
    n = b.n
  }
  let title = ''
  if (b.template === 'custom') {
    title = cleanLine(b.title, MAX_TITLE, { required: true })
    if (!title) return { error: 'bad_title' }
  }
  const days = b.template === 'khatm' && b.days == null ? 30 : b.days
  if (!DURATIONS.includes(days)) return { error: 'bad_request' }
  if (!validDate(b.startOn) || b.startOn < addDays(today, -7) || b.startOn > addDays(today, 60)) return { error: 'bad_date' }
  return { template: b.template, n, title, startOn: b.startOn, days }
}

function createChallengesRouter({ db, requireUser, now = () => Date.now(), pushSubsOf = () => [], pushSend = null, langOf = () => 'en', icons = {}, log = console }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    insert: p('INSERT INTO challenges (owner_id, template, n, title, start_on, days, end_on, invite_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
    one: p('SELECT * FROM challenges WHERE id = ?'),
    byHash: p('SELECT * FROM challenges WHERE invite_hash = ?'),
    setInvite: p('UPDATE challenges SET invite_hash = ? WHERE id = ? AND owner_id = ?'),
    del: p('DELETE FROM challenges WHERE id = ? AND owner_id = ?'),
    mine: p(`SELECT c.*, m.tz, m.remind_at FROM challenge_members m JOIN challenges c ON c.id = m.challenge_id
      WHERE m.user_id = ? ORDER BY c.end_on < ? , c.start_on DESC, c.id DESC LIMIT 100`),
    member: p('SELECT * FROM challenge_members WHERE challenge_id = ? AND user_id = ?'),
    addMember: p('INSERT INTO challenge_members (challenge_id, user_id, joined_at, consent_at, tz) VALUES (?, ?, ?, ?, ?)'),
    leave: p('DELETE FROM challenge_members WHERE challenge_id = ? AND user_id = ?'),
    memberCount: p('SELECT COUNT(*) AS n FROM challenge_members WHERE challenge_id = ?'),
    activeCount: p('SELECT COUNT(*) AS n FROM challenge_members m JOIN challenges c ON c.id = m.challenge_id WHERE m.user_id = ? AND c.end_on >= ?'),
    ownedCount: p('SELECT COUNT(*) AS n FROM challenges WHERE owner_id = ? AND end_on >= ?'),
    dayCounts: p('SELECT day, COUNT(*) AS n FROM challenge_ticks WHERE challenge_id = ? GROUP BY day'),
    myTicks: p('SELECT day FROM challenge_ticks WHERE challenge_id = ? AND user_id = ? ORDER BY day'),
    tick: p('INSERT OR IGNORE INTO challenge_ticks (challenge_id, user_id, day, at) VALUES (?, ?, ?, ?)'),
    untick: p('DELETE FROM challenge_ticks WHERE challenge_id = ? AND user_id = ? AND day = ?'),
    tickedOn: p('SELECT 1 AS x FROM challenge_ticks WHERE challenge_id = ? AND user_id = ? AND day = ?'),
    juz: p('SELECT juz, user_id, done_at FROM challenge_juz WHERE challenge_id = ? ORDER BY juz'),
    juzOne: p('SELECT * FROM challenge_juz WHERE challenge_id = ? AND juz = ?'),
    juzTake: p('INSERT OR IGNORE INTO challenge_juz (challenge_id, juz, user_id) VALUES (?, ?, ?)'),
    juzRelease: p('DELETE FROM challenge_juz WHERE challenge_id = ? AND juz = ? AND user_id = ?'),
    juzDone: p('UPDATE challenge_juz SET done_at = ? WHERE challenge_id = ? AND juz = ? AND user_id = ?'),
    myJuzCount: p('SELECT COUNT(*) AS n FROM challenge_juz WHERE challenge_id = ? AND user_id = ? AND done_at IS NULL'),
    setReminder: p('UPDATE challenge_members SET remind_at = ?, tz = ?, last_reminded = NULL WHERE challenge_id = ? AND user_id = ?'),
    reminders: p(`SELECT m.challenge_id, m.user_id, m.tz, m.remind_at, m.last_reminded, c.template, c.n, c.title, c.start_on, c.end_on
      FROM challenge_members m JOIN challenges c ON c.id = m.challenge_id
      WHERE m.remind_at IS NOT NULL AND c.start_on <= ? AND c.end_on >= ? LIMIT 5000`),
    claimReminder: p(`UPDATE challenge_members SET last_reminded = ? WHERE challenge_id = ? AND user_id = ?
      AND (last_reminded IS NULL OR last_reminded <> ?)`),
    purge: p('DELETE FROM challenges WHERE end_on < ?'),
    userExists: p('SELECT 1 AS x FROM users WHERE id = ?'),
  }
  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)
  const utcToday = () => keyOf(now())

  const base = (c) => ({
    id: c.id, template: c.template, n: c.n, title: c.title || '', startOn: c.start_on, days: c.days, endOn: c.end_on,
  })
  /** Lövhə — YALNIZ toplu rəqəmlər + istifadəçinin öz işarələri. Başqa üzvün id/adı/sayı yoxdur. */
  function board(c, uid) {
    const m = st.member.get(c.id, uid)
    const members = st.memberCount.get(c.id).n
    const counts = Object.fromEntries(st.dayCounts.all(c.id).map((r) => [r.day, r.n]))
    const days = []
    for (let i = 0; i < c.days; i++) { const d = addDays(c.start_on, i); days.push({ day: d, done: counts[d] || 0 }) }
    const out = {
      ...base(c), owner: c.owner_id === uid, members, max: MAX_MEMBERS,
      today: localClock(now(), (m && m.tz) || 'UTC').date,
      board: days, mine: st.myTicks.all(c.id, uid).map((r) => r.day),
      reminder: { at: m ? m.remind_at : null, tz: m ? m.tz : null },
    }
    if (c.template === 'khatm') {
      const rows = new Map(st.juz.all(c.id).map((r) => [r.juz, r]))
      out.juz = Array.from({ length: 30 }, (_, i) => {
        const r = rows.get(i + 1)
        return { juz: i + 1, taken: Boolean(r), done: Boolean(r && r.done_at), mine: Boolean(r && r.user_id === uid) }
      })
    }
    return out
  }
  const summary = (c, uid) => {
    const b = board(c, uid)
    const todayRow = b.board.find((d) => d.day === b.today)
    return {
      ...base(c), owner: b.owner, members: b.members, today: b.today,
      todayDone: todayRow ? todayRow.done : null, mineToday: b.mine.includes(b.today), myDays: b.mine.length,
      ...(b.juz ? { juzDone: b.juz.filter((j) => j.done).length, juzTaken: b.juz.filter((j) => j.taken).length } : {}),
    }
  }
  const memberOf = (req, res) => {
    const id = idOf(req)
    const c = id && st.one.get(id)
    if (!c || !st.member.get(c.id, req.user.id)) { err(res, 404, 'not_found', 'Not found'); return null }
    return c
  }
  const tzOf = (v) => (v == null ? 'UTC' : validTz(v) ? v : null)

  router.use('/challenges', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.get('/challenges', auth, (req, res) => {
    const uid = req.user.id
    res.json({
      challenges: st.mine.all(uid, addDays(utcToday(), -1)).map((c) => summary(c, uid)),
      limits: { members: MAX_MEMBERS, active: MAX_ACTIVE, owned: MAX_OWNED, title: MAX_TITLE, durations: DURATIONS, templates: Object.keys(TEMPLATES) },
    })
  })

  router.post('/challenges', auth, json, (req, res) => {
    const uid = req.user.id
    const b = req.body || {}
    if (b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    const tz = tzOf(b.tz)
    if (!tz) return err(res, 400, 'bad_tz', 'Invalid time zone')
    const today = localClock(now(), tz).date
    const v = validChallenge(b, today)
    if (v.error) return err(res, 400, v.error, 'Invalid challenge')
    const token = crypto.randomBytes(32).toString('base64url')
    const t = now()
    const r = tx(() => {
      const yday = addDays(utcToday(), -1)
      if (st.ownedCount.get(uid, yday).n >= MAX_OWNED || st.activeCount.get(uid, yday).n >= MAX_ACTIVE) return null
      const id = Number(st.insert.run(uid, v.template, v.n, v.title, v.startOn, v.days, addDays(v.startOn, v.days - 1), sha256(token), t).lastInsertRowid)
      st.addMember.run(id, uid, t, t, tz)
      return id
    })
    if (r == null) return err(res, 409, 'too_many', 'Too many challenges')
    res.status(201).json({ challenge: board(st.one.get(r), uid), token })
  })

  const byToken = (b) => (b && typeof b.token === 'string' && TOKEN_RE.test(b.token) ? st.byHash.get(sha256(b.token)) : null)
  router.post('/challenges/join/preview', auth, json, (req, res) => {
    const c = byToken(req.body)
    if (!c || c.end_on < addDays(utcToday(), -1)) return err(res, 404, 'invalid_token', 'Invalid or expired link')
    res.json({ challenge: { ...base(c), members: st.memberCount.get(c.id).n, max: MAX_MEMBERS }, already: Boolean(st.member.get(c.id, req.user.id)) })
  })

  router.post('/challenges/join', auth, json, (req, res) => {
    const uid = req.user.id
    const b = req.body || {}
    const c = byToken(b)
    if (!c || c.end_on < addDays(utcToday(), -1)) return err(res, 404, 'invalid_token', 'Invalid or expired link')
    if (st.member.get(c.id, uid)) return res.json({ id: c.id, already: true })
    if (b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    const tz = tzOf(b.tz)
    if (!tz) return err(res, 400, 'bad_tz', 'Invalid time zone')
    const r = tx(() => {
      if (st.memberCount.get(c.id).n >= MAX_MEMBERS) return 'full'
      if (st.activeCount.get(uid, addDays(utcToday(), -1)).n >= MAX_ACTIVE) return 'too_many'
      st.addMember.run(c.id, uid, now(), now(), tz)
      return 'ok'
    })
    if (r === 'full') return err(res, 409, 'full', 'Challenge is full')
    if (r === 'too_many') return err(res, 409, 'too_many', 'Too many challenges')
    res.json({ id: c.id, already: false })
  })

  router.get('/challenges/:id', auth, (req, res) => {
    const c = memberOf(req, res); if (!c) return
    res.json({ challenge: board(c, req.user.id) })
  })

  router.delete('/challenges/:id', auth, (req, res) => {
    const id = idOf(req)
    const c = id && st.one.get(id)
    if (!c || !st.member.get(c.id, req.user.id)) return err(res, 404, 'not_found', 'Not found')
    if (c.owner_id !== req.user.id) return err(res, 403, 'owner_only', 'Only the creator can delete')
    st.del.run(c.id, req.user.id)
    res.json({ ok: true })
  })

  router.post('/challenges/:id/invite', auth, (req, res) => {
    const c = memberOf(req, res); if (!c) return
    if (c.owner_id !== req.user.id) return err(res, 403, 'owner_only', 'Only the creator can invite')
    if (c.end_on < utcToday()) return err(res, 409, 'ended', 'Challenge has ended')
    const token = crypto.randomBytes(32).toString('base64url')
    st.setInvite.run(sha256(token), c.id, req.user.id)
    res.json({ token })
  })

  router.post('/challenges/:id/tick', auth, json, (req, res) => {
    const c = memberOf(req, res); if (!c) return
    const uid = req.user.id
    const { day, done } = req.body || {}
    if (!validDate(day) || typeof done !== 'boolean') return err(res, 400, 'bad_request', 'Invalid day')
    const m = st.member.get(c.id, uid)
    const today = localClock(now(), m.tz || 'UTC').date
    // Yalnız çağırışın günləri və gələcək olmayan gün (vicdan sistemi — keçmiş günü də işarələmək olar)
    if (day < c.start_on || day > c.end_on || day > today) return err(res, 400, 'bad_day', 'Day not open')
    if (done) st.tick.run(c.id, uid, day, now())
    else st.untick.run(c.id, uid, day)
    res.json({ ok: true, challenge: board(c, uid) })
  })

  router.post('/challenges/:id/juz', auth, json, (req, res) => {
    const c = memberOf(req, res); if (!c) return
    if (c.template !== 'khatm') return err(res, 400, 'bad_request', 'Not a khatm challenge')
    const uid = req.user.id
    const { juz, action } = req.body || {}
    if (!Number.isInteger(juz) || juz < 1 || juz > 30 || !['take', 'release', 'done', 'undone'].includes(action)) return err(res, 400, 'bad_request', 'Invalid juz')
    if (c.end_on < utcToday() && action === 'take') return err(res, 409, 'ended', 'Challenge has ended')
    const r = tx(() => {
      const cur = st.juzOne.get(c.id, juz)
      if (action === 'take') {
        if (cur) return cur.user_id === uid ? 'ok' : 'taken'
        if (st.myJuzCount.get(c.id, uid).n >= 3) return 'too_many'   // eyni anda ən çox 3 oxunmamış cüz
        st.juzTake.run(c.id, juz, uid)
        return 'ok'
      }
      if (!cur || cur.user_id !== uid) return 'not_mine'
      if (action === 'release') st.juzRelease.run(c.id, juz, uid)
      else st.juzDone.run(action === 'done' ? now() : null, c.id, juz, uid)
      return 'ok'
    })
    if (r === 'taken') return err(res, 409, 'taken', 'Already taken')
    if (r === 'too_many') return err(res, 409, 'too_many', 'Finish your juz first')
    if (r === 'not_mine') return err(res, 403, 'not_mine', 'Not your juz')
    res.json({ ok: true, challenge: board(c, uid) })
  })

  router.patch('/challenges/:id/me', auth, json, (req, res) => {
    const c = memberOf(req, res); if (!c) return
    const b = req.body || {}
    const m = st.member.get(c.id, req.user.id)
    if (!('remindAt' in b) || (b.remindAt !== null && (typeof b.remindAt !== 'string' || !HHMM_RE.test(b.remindAt)))) return err(res, 400, 'bad_request', 'Invalid time')
    const tz = b.tz == null ? m.tz : (validTz(b.tz) ? b.tz : null)
    if (!tz) return err(res, 400, 'bad_tz', 'Invalid time zone')
    st.setReminder.run(b.remindAt, tz, c.id, req.user.id)
    res.json({ reminder: { at: b.remindAt, tz } })
  })

  router.delete('/challenges/:id/me', auth, (req, res) => {
    const c = memberOf(req, res); if (!c) return
    if (c.owner_id === req.user.id) return err(res, 409, 'owner', 'The creator deletes the challenge instead')
    st.leave.run(c.id, req.user.id)
    res.json({ ok: true })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/challenges', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    log.error('challenges error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** Gündəlik xatırlatma — dəqiqədə bir; yalnız bağlı push cihazları. Qaytarır: göndərilən sayı */
  let busy = false
  router.tick = async (ms = now()) => {
    if (busy || !pushSend) return 0
    busy = true
    let sent = 0
    try {
      const today = keyOf(ms)
      for (const r of st.reminders.all(addDays(today, 1), addDays(today, -1))) {
        const tz = validTz(r.tz) ? r.tz : 'UTC'
        const l = localClock(ms, tz)
        if (l.date < r.start_on || l.date > r.end_on || r.last_reminded === l.date) continue
        const diff = l.minutes - hhmmMin(r.remind_at)
        if (diff < 0 || diff > REMIND_WINDOW_MIN) continue
        if (st.tickedOn.get(r.challenge_id, r.user_id, l.date)) continue
        if (!st.claimReminder.run(l.date, r.challenge_id, r.user_id, l.date).changes) continue
        const subs = pushSubsOf(r.user_id) || []
        if (!subs.length) continue
        const lang = langOf(r.user_id) || 'en'
        const T = PUSH[lang] || PUSH.en
        const link = `${langPrefix(lang)}/together#c=${r.challenge_id}`
        try {
          await pushSend(subs, {
            notification: { title: T.title, body: T.body(templateLabel(r, lang)) },
            webpush: { notification: { ...icons, tag: `challenge-${r.challenge_id}` }, link },
          }, 'challenge reminder')
          sent++
        } catch (e) { log.error('challenge push:', e && e.message) }
      }
    } finally { busy = false }
    return sent
  }
  /** Bitəndən 30 gün keçmiş çağırışlar (üzvlük, işarələr, cüzlər CASCADE) */
  router.purge = () => st.purge.run(addDays(keyOf(now()), -KEEP_AFTER_END_DAYS)).changes
  /** Təqvim axını (server/calFeed.js): istifadəçinin bitməmiş çağırışları */
  router.calendarOf = (uid) => st.mine.all(uid, '').filter((c) => c.end_on >= addDays(keyOf(now()), -30))
    .map((c) => ({ id: c.id, template: c.template, n: c.n, title: c.title, startOn: c.start_on, endOn: c.end_on }))
  /** "Mənim məlumatlarım" (server/security.js): çağırışlar, öz işarələrim (token heşi YOX) */
  router.exportUser = (uid) => st.mine.all(uid, '').map((c) => ({
    ...base(c), owner: c.owner_id === uid, members: st.memberCount.get(c.id).n,
    myDays: st.myTicks.all(c.id, uid).map((r) => r.day), reminder: c.remind_at || null,
  }))
  router.summaryUser = (uid) => {
    const list = st.mine.all(uid, '')
    return { challenges: list.length, owned: list.filter((c) => c.owner_id === uid).length }
  }
  return router
}

module.exports = {
  createChallengesRouter, validChallenge, templateLabel, localClock,
  TEMPLATES, DURATIONS, MAX_MEMBERS, MAX_ACTIVE, MAX_OWNED, MAX_TITLE,
}
