// ═══════════════════════════════════════════════════════════════════════
// Şəxsi xatırlatmalar — hesaba bağlı, SERVERDƏ OXUNA BİLƏN (docs/USER-ACCOUNTS.md → "Şəxsi xatırlatmalar")
//
//   C1. Gələcək özünə məktub      — mətn + çatdırılma günü → həmin gün ~09:00 (istifadəçinin saat qurşağı)
//   C2. Sevdiklərim üçün dua       — mərhumun adı, (yaxınlığı), vəfat tarixi → hər il ildönümü
//                                   (miladi və ya hicri), istəyə bağlı hər Cümə; ailə ilə paylaşma
//   C3. Zəkat ili (hövl)            — başlanğıc günü → eyni hicri tarix gələn il; 7 gün əvvəl və həmin gün
//
// NİYƏ ŞİFRƏSİZ: hesabın qalan məlumatı uçdan-uca şifrəlidir (server oxuya bilmir). Bu üç xüsusiyyətdə
// server məktubu VAXTINDA özü göndərməlidir — ona görə tarix və mətn açıq saxlanır. İstifadəçi hər
// xüsusiyyətin ilk istifadəsində bunu açıq qeyd ilə təsdiqləyir (consent: true, vaxtı saxlanır);
// istənilən vaxt silə bilər (tək-tək və ya DELETE /api/personal — hamısı). Minimum saxlanır:
//   • ad günü saxlanmır — yalnız hesablanmış çatdırılma tarixi;
//   • zəkat məbləği yalnız istifadəçi ayrıca istəsə;
//   • push üçün yalnız endpoint ↔ hesab bağlantısı (abunəliyin özü push_subs-dadır).
//
// Endpoint-lər (hamısı requireUser — cookie + CSRF: X-Requested-With, Origin; server/users.js):
//   GET/POST /api/personal/letters · PATCH/DELETE /api/personal/letters/:id
//   GET/POST /api/personal/loved   · PATCH/DELETE /api/personal/loved/:id
//   POST/DELETE /api/personal/loved/share · DELETE /api/personal/loved/followers/:id
//   POST /api/personal/follow/preview · POST /api/personal/follow · DELETE /api/personal/follow/:ownerId
//   GET/PUT/DELETE /api/personal/zakat
//   GET/PATCH /api/personal/prefs · POST /api/personal/push-link · POST /api/personal/push-link/status
//   DELETE /api/personal            — bu modulun bütün məlumatı
//   GET/POST /api/personal/unsubscribe?t=…  — GİRİŞSİZ, imzalı token (məktubdakı keçid). HMAC-a həmin
//            xüsusiyyətin razılıq vaxtı (consent_loved / consent_zakat) daxildir: e-poçt xatırlatmasını yenidən
//            açmaq (lovedEmail false → true) və ya silinmiş zəkat xatırlatmasını təzədən qurmaq vaxtı yeniləyir —
//            köhnə məktubdakı keçid işləmir. (Razılığı olmayan izləyicinin tokeni dəyişmir.)
//
// Planlayıcı (tick): dəqiqədə bir; "vaxtı çatanları" tapır, göndərir, qeyd edir. İkiqat göndəriş
// yoxdur: göndərişdən ƏVVƏL sətir "sending" kimi tutulur (atomik UPDATE/INSERT OR IGNORE);
// proses göndəriş ortasında ölsə belə həmin sətir yenidən göndərilmir. Uğursuz göndəriş —
// 5 cəhdə qədər, artan fasilə ilə (5, 15, 45, 135 dəq).
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır) — köhnə kod bu
// cədvəllərə toxunmur, geri qaytarma pozulmur (2026-11-04 dərsi). Hamısı users(id) ON DELETE
// CASCADE — hesab silinəndə hər şey silinir.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const hijri = require('./hijri')

const MAX_LETTER = 4000
const MAX_PENDING_LETTERS = 50
const MAX_DELIVERED_LETTERS = 200
const MAX_LOVED = 50
const MAX_NAME = 80
const MAX_RELATION = 40
const MAX_NOTE = 500
const MAX_FOLLOWING = 20
const MAX_FOLLOWERS = 30
const MAX_PUSH_LINKS = 10
const SEND_HOUR = 9
const MAX_ATTEMPTS = 5
const STALE_SENDING_MS = 15 * 60 * 1000
const DAY = 86400000
const LETTER_KINDS = ['date', 'year', 'ramadan', 'birthday', 'capsule']
const FEATURES = ['letters', 'loved', 'zakat']
const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

const SCHEMA = `
CREATE TABLE IF NOT EXISTS personal_prefs (
  user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tz              TEXT NOT NULL DEFAULT 'UTC',
  lang            TEXT NOT NULL DEFAULT 'en',
  consent_letters INTEGER,
  consent_loved   INTEGER,
  consent_zakat   INTEGER,
  loved_email     INTEGER NOT NULL DEFAULT 1,
  updated_at      INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS personal_letters (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  deliver_on   TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'date',
  tz           TEXT NOT NULL,
  lang         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','delivered','failed')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  next_try_at  INTEGER,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  delivered_at INTEGER
);
CREATE INDEX IF NOT EXISTS personal_letters_by_user ON personal_letters(user_id);
CREATE INDEX IF NOT EXISTS personal_letters_due ON personal_letters(status, deliver_on);
CREATE TABLE IF NOT EXISTS personal_loved (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  relation   TEXT NOT NULL DEFAULT '',
  passed_on  TEXT NOT NULL,
  calendar   TEXT NOT NULL DEFAULT 'g' CHECK (calendar IN ('g','h')),
  friday     INTEGER NOT NULL DEFAULT 0,
  note       TEXT NOT NULL DEFAULT '',
  next_on    TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS personal_loved_by_user ON personal_loved(user_id);
CREATE INDEX IF NOT EXISTS personal_loved_next ON personal_loved(next_on);
CREATE TABLE IF NOT EXISTS personal_loved_shares (
  owner_id   INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS personal_loved_followers (
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (owner_id, follower_id)
);
CREATE INDEX IF NOT EXISTS personal_loved_followers_by_follower ON personal_loved_followers(follower_id);
CREATE TABLE IF NOT EXISTS personal_zakat (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hawl_start TEXT NOT NULL,
  due_on     TEXT NOT NULL,
  amount     REAL,
  currency   TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS personal_push_links (
  endpoint   TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS personal_push_links_by_user ON personal_push_links(user_id);
CREATE TABLE IF NOT EXISTS personal_sent (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('sending','sent','retry','failed')),
  attempts    INTEGER NOT NULL DEFAULT 0,
  next_try_at INTEGER,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);
CREATE TABLE IF NOT EXISTS personal_secret (
  id     INTEGER PRIMARY KEY CHECK (id = 1),
  secret TEXT NOT NULL
);
`

// ─── Saf köməkçilər: tarix, saat qurşağı ──────────────────────────────
const fmtCache = new Map()
/** Saat qurşağı yararlıdırmı (IANA adı; Intl onu tanıyır) */
function validTz(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(tz)) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}
/** ms anında tz-dəki yerli { date:'YYYY-MM-DD', hour, friday } */
function localNow(ms, tz) {
  let f = fmtCache.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, weekday: 'short' })
    fmtCache.set(tz, f)
  }
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, friday: p.weekday === 'Fri' }
}
/** Yerli gün D-də SEND_HOUR keçibmi, yoxsa gün başqadır: 'before' | 'due' | 'after' */
function dayState(ms, tz, dateKey, hour = SEND_HOUR) {
  const l = localNow(ms, tz)
  if (l.date < dateKey) return 'before'
  if (l.date > dateKey) return 'after'
  return l.hour >= hour ? 'due' : 'before'
}
const isoUtc = (ms) => new Date(ms).toISOString().slice(0, 10)
const parseDate = (s) => (typeof s === 'string' && DATE_RE.test(s) ? hijri.parseGKey(s) : null)
const addDaysKey = (key, n) => hijri.gKey(hijri.addGDays(hijri.parseGKey(key), n))
/** D gününün ən qərb saat qurşağında da bitdiyi an (UTC−12 → D+1 12:00 UTC) — sonra keçmiş sayılır */
const dayOverEverywhere = (key) => Date.parse(key + 'T00:00:00Z') + 36 * 3600 * 1000

/** Miladi ildönümü: from-dan (daxil) sonrakı ilk; 29 fevral → uzun olmayan ildə 28 fevral. n ≥ 1 */
function nextGregorianAnniversary(passed, from) {
  for (let year = Math.max(from.year, passed.year + 1); year <= from.year + 2; year++) {
    const g = { year, month: passed.month, day: Math.min(passed.day, hijri.gDaysInMonth(year, passed.month)) }
    if (hijri.gDiffDays(from, g) >= 0) return { g, n: year - passed.year }
  }
  return null
}
/** Hicri ildönümü: vəfatın hicri tarixi hər hicri ildə; ayın 30-u 29 günlük ayda → 29 */
function nextHijriAnniversary(passed, from) {
  const hP = hijri.gregorianToHijri(passed)
  const hF = hijri.gregorianToHijri(from)
  for (let y = Math.max(hF.year - 1, hP.year + 1); y <= hF.year + 2; y++) {
    const day = Math.min(hP.day, hijri.hijriMonthLength(y, hP.month))
    const g = hijri.hijriToGregorian({ year: y, month: hP.month, day })
    if (g && hijri.gDiffDays(from, g) >= 0) return { g, n: y - hP.year, h: { year: y, month: hP.month, day } }
  }
  return null
}
function nextAnniversary(passedKey, calendar, fromKey) {
  const passed = hijri.parseGKey(passedKey), from = hijri.parseGKey(fromKey)
  if (!passed || !from) return null
  const r = calendar === 'h' ? nextHijriAnniversary(passed, from) : nextGregorianAnniversary(passed, from)
  return r ? { date: hijri.gKey(r.g), n: r.n } : null
}
/**
 * Zəkat ili (hövl): başlanğıcın hicri tarixi bir (və ya bir neçə) hicri il sonra — from-dan
 * (daxil) sonrakı ilk. 30-cu gün 29 günlük ayda → 29.
 */
function hawlDue(startKey, fromKey) {
  const start = hijri.parseGKey(startKey), from = hijri.parseGKey(fromKey)
  if (!start || !from) return null
  const hS = hijri.gregorianToHijri(start)
  for (let y = hS.year + 1; y <= hS.year + 40; y++) {
    const day = Math.min(hS.day, hijri.hijriMonthLength(y, hS.month))
    const g = hijri.hijriToGregorian({ year: y, month: hS.month, day })
    if (g && hijri.gDiffDays(from, g) >= 0) return hijri.gKey(g)
  }
  return null
}

// ─── Mətn təmizləmə / yoxlama ─────────────────────────────────────────
const CTRL_RE = /[\p{Cc}‪-‮⁦-⁩]/gu
function cleanLine(v, max, { required = false } = {}) {
  if (v == null) return required ? null : ''
  if (typeof v !== 'string') return null
  const s = v.normalize('NFC').replace(CTRL_RE, '').replace(/\s+/g, ' ').trim()
  if (required && !s) return null
  return [...s].length <= max ? s : null
}
/** Çoxsətirli mətn (məktub, qeyd): sətir sonları qalır, digər idarə simvolları atılır */
function cleanText(v, max, { required = false } = {}) {
  if (v == null) return required ? null : ''
  if (typeof v !== 'string') return null
  const s = v.normalize('NFC').replace(/\r\n?/g, '\n').replace(/[\p{Cc}‪-‮⁦-⁩]/gu, (c) => (c === '\n' || c === '\t' ? c : '')).replace(/\n{4,}/g, '\n\n\n').trim()
  if (required && !s) return null
  return [...s].length <= max ? s : null
}
const validLang = (l) => (typeof l === 'string' && /^[a-z]{2,3}$/.test(l) ? l : null)
const mailLang = (l) => (MAIL_LANGS.includes(l) ? l : 'en')
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

/** Başqasına göstəriləcək ad: display_name, yoxdursa maskalı e-poçt (a•••@g•••.com) */
function personLabel(u) {
  if (!u) return ''
  if (u.display_name) return u.display_name
  const e = String(u.email || '')
  const [a, d = ''] = e.split('@')
  const dot = d.lastIndexOf('.')
  const host = dot > 0 ? d.slice(0, dot) : d
  const tld = dot > 0 ? d.slice(dot) : ''
  return a ? `${a[0]}•••@${host ? host[0] + '•••' : ''}${tld}` : ''
}

// ─── Saxlama ──────────────────────────────────────────────────────────
function createPersonalStore(db, { secret: envSecret = '' } = {}) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)

  // Abunəlikdən çıxma tokenləri üçün sirr: env (varsa) və ya bazada bir dəfə yaradılan təsadüfi 32 bayt
  let secret = envSecret
  if (!secret) {
    const row = p('SELECT secret FROM personal_secret WHERE id = 1').get()
    if (row) secret = row.secret
    else {
      secret = crypto.randomBytes(32).toString('base64url')
      p('INSERT OR IGNORE INTO personal_secret (id, secret) VALUES (1, ?)').run(secret)
      secret = p('SELECT secret FROM personal_secret WHERE id = 1').get().secret
    }
  }

  const st = {
    user: p('SELECT id, email, email_verified, display_name, disabled FROM users WHERE id = ?'),
    prefs: p('SELECT * FROM personal_prefs WHERE user_id = ?'),
    prefsUpsert: p(`INSERT INTO personal_prefs (user_id, tz, lang, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET tz = excluded.tz, lang = excluded.lang, updated_at = excluded.updated_at`),
    setLovedEmail: p('UPDATE personal_prefs SET loved_email = ?, updated_at = ? WHERE user_id = ?'),
    // Abunəlikdən çıxma tokenini yeniləmək üçün: razılıq artıq varsa vaxtı təzələnir (yoxdursa — razılıq YARADILMIR)
    renewConsentLoved: p('UPDATE personal_prefs SET consent_loved = ? WHERE user_id = ? AND consent_loved IS NOT NULL'),
    renewConsentZakat: p('UPDATE personal_prefs SET consent_zakat = ? WHERE user_id = ? AND consent_zakat IS NOT NULL'),

    letters: p('SELECT * FROM personal_letters WHERE user_id = ? ORDER BY CASE WHEN status IN (\'pending\',\'sending\') THEN 0 ELSE 1 END, deliver_on ASC, id ASC'),
    letter: p('SELECT * FROM personal_letters WHERE id = ? AND user_id = ?'),
    countPending: p("SELECT COUNT(*) AS n FROM personal_letters WHERE user_id = ? AND status IN ('pending','sending')"),
    letterInsert: p(`INSERT INTO personal_letters (user_id, body, deliver_on, kind, tz, lang, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`),
    letterUpdate: p(`UPDATE personal_letters SET body = ?, deliver_on = ?, kind = ?, tz = ?, lang = ?, attempts = 0, next_try_at = NULL, updated_at = ?
      WHERE id = ? AND user_id = ? AND status = 'pending'`),
    letterDelete: p('DELETE FROM personal_letters WHERE id = ? AND user_id = ?'),
    trimDelivered: p(`DELETE FROM personal_letters WHERE user_id = ? AND status IN ('delivered','failed') AND id NOT IN
      (SELECT id FROM personal_letters WHERE user_id = ? AND status IN ('delivered','failed') ORDER BY delivered_at DESC, id DESC LIMIT ?)`),
    dueLetters: p(`SELECT * FROM personal_letters WHERE status = 'pending' AND deliver_on <= ? AND (next_try_at IS NULL OR next_try_at <= ?)
      ORDER BY deliver_on ASC, id ASC LIMIT 200`),
    claimLetter: p("UPDATE personal_letters SET status = 'sending', updated_at = ? WHERE id = ? AND status = 'pending'"),
    letterDelivered: p("UPDATE personal_letters SET status = 'delivered', delivered_at = ?, updated_at = ? WHERE id = ?"),
    letterRetry: p("UPDATE personal_letters SET status = 'pending', attempts = ?, next_try_at = ?, updated_at = ? WHERE id = ?"),
    letterFailed: p("UPDATE personal_letters SET status = 'failed', attempts = ?, delivered_at = ?, updated_at = ? WHERE id = ?"),
    staleLetters: p("UPDATE personal_letters SET status = 'delivered', delivered_at = updated_at WHERE status = 'sending' AND updated_at < ?"),

    loved: p('SELECT * FROM personal_loved WHERE user_id = ? ORDER BY passed_on DESC, id ASC'),
    lovedOne: p('SELECT * FROM personal_loved WHERE id = ? AND user_id = ?'),
    lovedCount: p('SELECT COUNT(*) AS n FROM personal_loved WHERE user_id = ?'),
    lovedInsert: p(`INSERT INTO personal_loved (user_id, name, relation, passed_on, calendar, friday, note, next_on, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    lovedUpdate: p(`UPDATE personal_loved SET name = ?, relation = ?, passed_on = ?, calendar = ?, friday = ?, note = ?, next_on = ?, updated_at = ?
      WHERE id = ? AND user_id = ?`),
    lovedDelete: p('DELETE FROM personal_loved WHERE id = ? AND user_id = ?'),
    lovedDue: p('SELECT * FROM personal_loved WHERE next_on IS NOT NULL AND next_on <= ? ORDER BY next_on, id LIMIT 1000'),
    lovedSetNext: p('UPDATE personal_loved SET next_on = ? WHERE id = ?'),
    lovedFridayOwners: p('SELECT DISTINCT user_id FROM personal_loved WHERE friday = 1'),
    lovedFridayOf: p('SELECT id, name FROM personal_loved WHERE user_id = ? AND friday = 1 ORDER BY id LIMIT 30'),

    share: p('SELECT owner_id, created_at FROM personal_loved_shares WHERE owner_id = ?'),
    shareByHash: p('SELECT owner_id FROM personal_loved_shares WHERE token_hash = ?'),
    shareUpsert: p(`INSERT INTO personal_loved_shares (owner_id, token_hash, created_at) VALUES (?, ?, ?)
      ON CONFLICT(owner_id) DO UPDATE SET token_hash = excluded.token_hash, created_at = excluded.created_at`),
    shareDelete: p('DELETE FROM personal_loved_shares WHERE owner_id = ?'),
    followers: p(`SELECT f.follower_id, f.created_at, u.email, u.display_name FROM personal_loved_followers f
      JOIN users u ON u.id = f.follower_id WHERE f.owner_id = ? ORDER BY f.created_at`),
    followerIds: p('SELECT follower_id FROM personal_loved_followers WHERE owner_id = ?'),
    followerCount: p('SELECT COUNT(*) AS n FROM personal_loved_followers WHERE owner_id = ?'),
    followingCount: p('SELECT COUNT(*) AS n FROM personal_loved_followers WHERE follower_id = ?'),
    following: p(`SELECT f.owner_id, f.created_at, u.email, u.display_name FROM personal_loved_followers f
      JOIN users u ON u.id = f.owner_id WHERE f.follower_id = ? ORDER BY f.created_at`),
    follow: p('INSERT OR IGNORE INTO personal_loved_followers (owner_id, follower_id, created_at) VALUES (?, ?, ?)'),
    unfollow: p('DELETE FROM personal_loved_followers WHERE owner_id = ? AND follower_id = ?'),
    dropFollowers: p('DELETE FROM personal_loved_followers WHERE owner_id = ?'),
    fridayFollowers: p(`SELECT DISTINCT f.follower_id AS user_id FROM personal_loved_followers f
      WHERE EXISTS (SELECT 1 FROM personal_loved l WHERE l.user_id = f.owner_id AND l.friday = 1)`),
    followedOwners: p('SELECT owner_id FROM personal_loved_followers WHERE follower_id = ?'),

    zakat: p('SELECT * FROM personal_zakat WHERE user_id = ?'),
    zakatUpsert: p(`INSERT INTO personal_zakat (user_id, hawl_start, due_on, amount, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET hawl_start = excluded.hawl_start, due_on = excluded.due_on, amount = excluded.amount,
        currency = excluded.currency, updated_at = excluded.updated_at`),
    zakatDelete: p('DELETE FROM personal_zakat WHERE user_id = ?'),
    zakatDue: p('SELECT * FROM personal_zakat WHERE due_on <= ? ORDER BY due_on LIMIT 1000'),
    zakatRoll: p('UPDATE personal_zakat SET hawl_start = ?, due_on = ?, updated_at = ? WHERE user_id = ? AND due_on = ?'),

    pushLink: p(`INSERT INTO personal_push_links (endpoint, user_id, created_at) VALUES (?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, created_at = excluded.created_at`),
    pushUnlink: p('DELETE FROM personal_push_links WHERE endpoint = ? AND user_id = ?'),
    pushLinked: p('SELECT 1 AS x FROM personal_push_links WHERE endpoint = ? AND user_id = ?'),
    pushCount: p('SELECT COUNT(*) AS n FROM personal_push_links WHERE user_id = ?'),
    pushSubExists: p('SELECT 1 AS x FROM push_subs WHERE endpoint = ?'),
    pushSubsOf: p(`SELECT s.endpoint, s.keys_p256dh, s.keys_auth FROM personal_push_links l
      JOIN push_subs s ON s.endpoint = l.endpoint WHERE l.user_id = ?`),

    sentClaim: p("INSERT OR IGNORE INTO personal_sent (user_id, key, status, attempts, updated_at) VALUES (?, ?, 'sending', 0, ?)"),
    sentRetryClaim: p(`UPDATE personal_sent SET status = 'sending', updated_at = ?
      WHERE user_id = ? AND key = ? AND status = 'retry' AND next_try_at <= ?`),
    sentGet: p('SELECT * FROM personal_sent WHERE user_id = ? AND key = ?'),
    sentDone: p("UPDATE personal_sent SET status = 'sent', updated_at = ? WHERE user_id = ? AND key = ?"),
    sentRetry: p('UPDATE personal_sent SET status = ?, attempts = ?, next_try_at = ?, updated_at = ? WHERE user_id = ? AND key = ?'),
    sentPurge: p('DELETE FROM personal_sent WHERE updated_at < ?'),

    wipe: [
      'DELETE FROM personal_letters WHERE user_id = ?', 'DELETE FROM personal_loved WHERE user_id = ?',
      'DELETE FROM personal_loved_shares WHERE owner_id = ?', 'DELETE FROM personal_loved_followers WHERE owner_id = ?',
      'DELETE FROM personal_loved_followers WHERE follower_id = ?', 'DELETE FROM personal_zakat WHERE user_id = ?',
      'DELETE FROM personal_push_links WHERE user_id = ?', 'DELETE FROM personal_sent WHERE user_id = ?',
      'DELETE FROM personal_prefs WHERE user_id = ?',
    ].map(p),
  }
  const consentCol = { letters: 'consent_letters', loved: 'consent_loved', zakat: 'consent_zakat' }
  const setConsent = Object.fromEntries(FEATURES.map((f) => [f,
    p(`UPDATE personal_prefs SET ${consentCol[f]} = COALESCE(${consentCol[f]}, ?), updated_at = ? WHERE user_id = ?`)]))

  const store = {
    raw, tx, st,
    user: (id) => st.user.get(id) || null,
    prefs: (userId) => st.prefs.get(userId) || null,
    hasConsent: (userId, feature) => { const r = st.prefs.get(userId); return Boolean(r && r[consentCol[feature]]) },
    /** tz/lang yenilə (və ya yarat) + istəyə bağlı razılıq qeydi */
    touchPrefs(userId, { tz, lang, consent }, now = Date.now()) {
      const cur = st.prefs.get(userId)
      st.prefsUpsert.run(userId, tz || (cur && cur.tz) || 'UTC', lang || (cur && cur.lang) || 'en', now)
      if (consent) setConsent[consent].run(now, now, userId)
    },
    setLovedEmail: (userId, on, now = Date.now()) => {
      const cur = st.prefs.get(userId)
      const ok = st.setLovedEmail.run(on ? 1 : 0, now, userId).changes > 0
      if (ok && on && cur && cur.loved_email !== 1) st.renewConsentLoved.run(now, userId)   // yenidən açıldı → yeni token
      return ok
    },
    /** Abunəlikdən çıxma tokeninə daxil olan razılıq vaxtı */
    unsubConsentAt: (userId, scope) => {
      const r = st.prefs.get(userId)
      return r ? (scope === 'zakat' ? r.consent_zakat : r.consent_loved) || null : null
    },

    secret: () => secret,
    wipeUser(userId) { tx(() => { for (const s of st.wipe) s.run(userId) }) },
    /**
     * "Mənim məlumatlarım" ixracı (server/security.js). Paylaşma tokeninin heşi və push ünvanları
     * (abunəliyə çıxış "imkanı") YOXDUR — yalnız sayı.
     */
    exportUser(userId) {
      const pr = st.prefs.get(userId)
      const share = st.share.get(userId)
      return {
        prefs: pr ? { tz: pr.tz, lang: pr.lang, consentLetters: pr.consent_letters || null, consentLoved: pr.consent_loved || null, consentZakat: pr.consent_zakat || null, lovedEmail: pr.loved_email === 1 } : null,
        letters: st.letters.all(userId).map(letterOut),
        loved: st.loved.all(userId).map((r) => lovedOut(r)),
        lovedShare: share ? { active: true, createdAt: share.created_at } : null,
        followers: st.followers.all(userId).map((f) => ({ label: personLabel(f), since: f.created_at })),
        following: st.following.all(userId).map((f) => ({ label: personLabel(f), since: f.created_at })),
        zakat: zakatOut(st.zakat.get(userId)),
        pushDevices: st.pushCount.get(userId).n,
      }
    },
    summaryUser(userId) {
      const e = this.exportUser(userId)
      return { letters: e.letters.length, loved: e.loved.length, followers: e.followers.length, following: e.following.length, zakat: Boolean(e.zakat), pushDevices: e.pushDevices }
    },
  }
  return store
}

// ─── Abunəlikdən çıxma tokeni (imzalı, girişsiz) ──────────────────────
const UNSUB_SCOPES = ['loved', 'zakat']
// Bu tarixdən ƏVVƏLki razılıqla göndərilmiş məktubların köhnə (razılıq vaxtı olmayan) keçidi razılıq
// dəyişməyənə qədər işləyir; razılıq vaxtı bu tarixdən sonradırsa köhnə forma qəbul olunmur.
const LEGACY_UNSUB_BEFORE = Date.UTC(2026, 10, 19)
function unsubToken(secret, userId, scope, consentAt = null) {
  const base = `muslims.cc/unsub:${userId}:${scope}`
  const sig = crypto.createHmac('sha256', secret).update(consentAt ? `${base}:${consentAt}` : base).digest('base64url').slice(0, 32)
  return `${userId}.${scope}.${sig}`
}
const sameSig = (x, want) => {
  const a = Buffer.from(x), b = Buffer.from(want)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
/** consentAtOf(userId, scope) → razılıq vaxtı | null (verilməyibsə — yalnız köhnə forma yoxlanır) */
function verifyUnsub(secret, token, consentAtOf = null) {
  const m = /^(\d{1,12})\.([a-z]{1,16})\.([A-Za-z0-9_-]{32})$/.exec(String(token || ''))
  if (!m || !UNSUB_SCOPES.includes(m[2])) return null
  const userId = Number(m[1]), scope = m[2]
  const consentAt = consentAtOf ? consentAtOf(userId, scope) : null
  const ok = (consentAt && sameSig(m[3], unsubToken(secret, userId, scope, consentAt).split('.')[2])) ||
    ((!consentAt || consentAt < LEGACY_UNSUB_BEFORE) && sameSig(m[3], unsubToken(secret, userId, scope).split('.')[2]))
  return ok ? { userId, scope } : null
}

// ─── Push mətnləri (5 dil, qalanları en) ──────────────────────────────
const PUSH_T = {
  az: { letter: 'Gələcək özünə məktub', letterBody: 'Keçmişdə yazdığınız məktubun açılış günüdür.',
    anniv: (name, n) => `${name} — ${n} il`, annivBody: 'Bu gün ildönümüdür. Onu dualarınızda yad edin.',
    friday: 'Cümə', fridayBody: (names) => `Sevdiklərinizi dualarınızda yad edin: ${names}`,
    zakatSoon: 'Zəkat ilinə 7 gün qalıb', zakatDue: 'Bu gün zəkat iliniz tamamlanır', zakatBody: 'Zəkatınızı hesablamaq üçün toxunun.' },
  en: { letter: 'A letter to your future self', letterBody: 'Today is the day your letter opens.',
    anniv: (name, n) => `${name} — ${n} ${n === 1 ? 'year' : 'years'}`, annivBody: 'Today is the anniversary. Remember them in your duas.',
    friday: 'Friday', fridayBody: (names) => `Remember your loved ones in your duas: ${names}`,
    zakatSoon: 'Your zakat year completes in 7 days', zakatDue: 'Your zakat year completes today', zakatBody: 'Tap to calculate your zakat.' },
  ru: { letter: 'Письмо себе в будущее', letterBody: 'Сегодня день, когда открывается ваше письмо.',
    anniv: (name, n) => `${name} — ${n}-я годовщина`, annivBody: 'Сегодня годовщина. Вспомните их в своих дуа.',
    friday: 'Пятница', fridayBody: (names) => `Вспомните своих близких в дуа: ${names}`,
    zakatSoon: 'До завершения года закята — 7 дней', zakatDue: 'Сегодня завершается ваш год закята', zakatBody: 'Нажмите, чтобы рассчитать закят.' },
  tr: { letter: 'Geleceğe mektup', letterBody: 'Bugün mektubunuzun açılış günü.',
    anniv: (name, n) => `${name} — ${n}. yıl`, annivBody: 'Bugün yıl dönümü. Onu dualarınızda anın.',
    friday: 'Cuma', fridayBody: (names) => `Sevdiklerinizi dualarınızda anın: ${names}`,
    zakatSoon: 'Zekât yılınızın dolmasına 7 gün var', zakatDue: 'Zekât yılınız bugün doluyor', zakatBody: 'Zekâtınızı hesaplamak için dokunun.' },
  ar: { letter: 'رسالة إلى نفسك في المستقبل', letterBody: 'اليوم موعد فتح رسالتك.',
    anniv: (name, n) => `${name} — ${n}`, annivBody: 'اليوم ذكرى الوفاة. اذكره في دعائك.',
    friday: 'الجمعة', fridayBody: (names) => `اذكر أحبّتك في دعائك: ${names}`,
    zakatSoon: 'بقي ٧ أيام على تمام حول زكاتك', zakatDue: 'اليوم يتمّ حول زكاتك', zakatBody: 'اضغط لحساب زكاتك.' },
}
const pushT = (lang) => PUSH_T[lang] || PUSH_T.en

/** Saytın dil prefiksi: az — kök, digər 4 dil — /<dil>, qalan dillər — /en */
const langPrefix = (lang) => (lang === 'az' ? '' : `/${MAIL_LANGS.includes(lang) ? lang : 'en'}`)

/** 'YYYY-MM-DD' → yerli dildə uzun tarix (məktub üçün) */
function longDate(key, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(key + 'T12:00:00Z'))
  } catch { return key }
}

// ─── Planlayıcı ───────────────────────────────────────────────────────
/**
 * deps: { store, mailer, pushSend(subs:[{endpoint,keys}], msg, label) → {successCount}, publicOrigin, log, icons }
 * Qaytarır: { tick(now) } — dəqiqədə bir çağırılır; eyni anda iki dəfə işləmir.
 */
function createScheduler({ store, mailer = null, pushSend = null, publicOrigin = 'https://muslims.cc', log = console, icons = {} }) {
  const { st } = store
  let busy = false
  const backoff = (attempt) => 5 * 60 * 1000 * 3 ** Math.max(0, attempt - 1)

  /** Göndəriş kanalları: e-poçt (təsdiqlənmiş) + bağlı push cihazları. */
  async function deliver(user, { mail, push, allowEmail = true }) {
    let tried = 0, ok = 0
    if (mail && allowEmail && mailer && user.email && user.email_verified === 1) {
      tried++
      try {
        const r = await mailer.sendTemplate(mail.kind, mailLang(mail.lang), user.email, mail.vars)
        if (r && r.ok) ok++
        else if (r && r.skipped) tried--     // e-poçt sönülüdür (RESEND_API_KEY yoxdur) — kanal yox sayılır
      } catch (e) { log.error('personal mail:', e && e.message) }
    }
    if (push && pushSend) {
      const subs = st.pushSubsOf.all(user.id).map((r) => ({ endpoint: r.endpoint, keys: { p256dh: r.keys_p256dh, auth: r.keys_auth } }))
      if (subs.length) {
        tried++
        try {
          const r = await pushSend(subs, push, `personal ${mail ? mail.kind : 'push'}`)
          if (r && r.successCount > 0) ok++
          else if (r && r.disabled) tried--   // Web Push sönülüdür (VAPID yoxdur)
        } catch (e) { log.error('personal push:', e && e.message) }
      }
    }
    // Heç bir kanal yoxdursa — "göndərildi" sayılır (məktub hesab səhifəsində oxunur), təkrar cəhd yoxdur
    return tried === 0 || ok > 0
  }

  const pushMsg = (title, body, link, tag) => ({
    notification: { title, body },
    webpush: { notification: { ...icons, tag }, link },
  })

  /** Təkrarlanan xatırlatmanı (ildönümü, Cümə, zəkat) bir alıcıya bir dəfə göndər. */
  async function sendOnce(userId, key, now, send) {
    if (!st.sentClaim.run(userId, key, now).changes && !st.sentRetryClaim.run(now, userId, key, now).changes) return false
    let ok = false
    try { ok = await send() } catch (e) { log.error('personal send:', e && e.message) }
    if (ok) st.sentDone.run(now, userId, key)
    else {
      const cur = st.sentGet.get(userId, key)
      const attempts = (cur ? cur.attempts : 0) + 1
      st.sentRetry.run(attempts >= MAX_ATTEMPTS ? 'failed' : 'retry', attempts, now + backoff(attempts), now, userId, key)
    }
    return ok
  }

  async function letters(now) {
    st.staleLetters.run(now - STALE_SENDING_MS)
    for (const l of st.dueLetters.all(isoUtc(now + DAY), now)) {
      if (dayState(now, l.tz, l.deliver_on) === 'before') continue
      const user = store.user(l.user_id)
      if (!user || user.disabled) continue
      if (!st.claimLetter.run(now, l.id).changes) continue
      const lang = l.lang
      const T = pushT(lang)
      const link = `${langPrefix(lang)}/account#letters`
      let ok = false
      try {
        ok = await deliver(user, {
          mail: { kind: 'letter', lang, vars: { url: `${publicOrigin}${link}`, date: longDate(isoUtc(l.created_at), mailLang(lang)), body: l.body } },
          push: pushMsg(T.letter, T.letterBody, link, `letter-${l.id}`),
        })
      } catch (e) { log.error('personal letter:', e && e.message) }
      if (ok) {
        st.letterDelivered.run(now, now, l.id)
        st.trimDelivered.run(l.user_id, l.user_id, MAX_DELIVERED_LETTERS)   // arxivdə ən çox 200 məktub
      } else {
        const attempts = l.attempts + 1
        if (attempts >= MAX_ATTEMPTS) st.letterFailed.run(attempts, now, now, l.id)
        else st.letterRetry.run(attempts, now + backoff(attempts), now, l.id)
      }
    }
  }

  /** Alıcı: sahib + izləyənlər; hər biri öz saat qurşağında 09:00-da */
  async function loved(now) {
    for (const row of st.lovedDue.all(isoUtc(now + DAY))) {
      const D = row.next_on
      if (now >= dayOverEverywhere(D)) {
        const nx = nextAnniversary(row.passed_on, row.calendar, addDaysKey(D, 1))
        st.lovedSetNext.run(nx ? nx.date : null, row.id)
        continue
      }
      const ann = nextAnniversary(row.passed_on, row.calendar, D)
      if (!ann || ann.date !== D) continue
      const recipients = [row.user_id, ...st.followerIds.all(row.user_id).map((r) => r.follower_id)]
      for (const uid of recipients) {
        const prefs = store.prefs(uid)
        if (!prefs || dayState(now, prefs.tz, D) !== 'due') continue
        const user = store.user(uid)
        if (!user || user.disabled) continue
        const lang = prefs.lang
        const T = pushT(lang)
        const pre = langPrefix(lang)
        await sendOnce(uid, `a:${row.id}:${D}`, now, () => deliver(user, {
          allowEmail: prefs.loved_email === 1,
          mail: { kind: 'anniversary', lang, vars: {
            url: `${publicOrigin}${pre}/learn/janazah#ls-prayer`, name: row.name, n: ann.n,
            unsubUrl: `${publicOrigin}/api/personal/unsubscribe?t=${unsubToken(store.secret(), uid, 'loved', prefs.consent_loved)}`,
          } },
          push: pushMsg(T.anniv(row.name, ann.n), T.annivBody, `${pre}/learn/janazah#ls-prayer`, `loved-${row.id}`),
        }))
      }
    }
  }

  async function fridays(now) {
    const wd = new Date(now).getUTCDay()
    if (![4, 5, 6].includes(wd)) return       // Cümə hansısa saat qurşağında yalnız UTC Cümə axşamı–Şənbə
    const ids = new Set([...st.lovedFridayOwners.all().map((r) => r.user_id), ...st.fridayFollowers.all().map((r) => r.user_id)])
    for (const uid of ids) {
      const prefs = store.prefs(uid)
      if (!prefs) continue
      const l = localNow(now, prefs.tz)
      if (!l.friday || l.hour < SEND_HOUR) continue
      const user = store.user(uid)
      if (!user || user.disabled) continue
      const owners = [uid, ...st.followedOwners.all(uid).map((r) => r.owner_id)]
      const names = [...new Set(owners.flatMap((o) => st.lovedFridayOf.all(o).map((r) => r.name)))].slice(0, 30)
      if (!names.length) continue
      const lang = prefs.lang
      const T = pushT(lang)
      const pre = langPrefix(lang)
      await sendOnce(uid, `f:${l.date}`, now, () => deliver(user, {
        allowEmail: prefs.loved_email === 1,
        mail: { kind: 'friday', lang, vars: {
          url: `${publicOrigin}${pre}/learn/janazah#ls-prayer`, names: names.join(', '),
          unsubUrl: `${publicOrigin}/api/personal/unsubscribe?t=${unsubToken(store.secret(), uid, 'loved', prefs.consent_loved)}`,
        } },
        push: pushMsg(T.friday, T.fridayBody(names.join(', ')), `${pre}/account#loved`, 'loved-friday'),
      }))
    }
  }

  async function zakat(now) {
    for (const z of st.zakatDue.all(isoUtc(now + 8 * DAY))) {
      if (now >= dayOverEverywhere(z.due_on)) {
        const next = hawlDue(z.due_on, addDaysKey(z.due_on, 1))
        if (next) st.zakatRoll.run(z.due_on, next, now, z.user_id, z.due_on)
        continue
      }
      const prefs = store.prefs(z.user_id)
      if (!prefs) continue
      const user = store.user(z.user_id)
      if (!user || user.disabled) continue
      const pre7 = addDaysKey(z.due_on, -7)
      const which = dayState(now, prefs.tz, pre7) === 'due' ? 'zakatSoon' : dayState(now, prefs.tz, z.due_on) === 'due' ? 'zakatDue' : null
      if (!which) continue
      const lang = prefs.lang
      const T = pushT(lang)
      const pre = langPrefix(lang)
      const amount = z.amount != null && z.currency ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(z.amount)} ${z.currency}` : ''
      await sendOnce(z.user_id, `z:${which === 'zakatSoon' ? 'pre' : 'due'}:${z.due_on}`, now, () => deliver(user, {
        mail: { kind: which, lang, vars: {
          url: `${publicOrigin}${pre}/zakat`, date: longDate(z.due_on, mailLang(lang)), amount,
          unsubUrl: `${publicOrigin}/api/personal/unsubscribe?t=${unsubToken(store.secret(), z.user_id, 'zakat', prefs.consent_zakat)}`,
        } },
        push: pushMsg(T[which], T.zakatBody, `${pre}/zakat`, 'zakat-hawl'),
      }))
    }
  }

  async function tick(now = Date.now()) {
    if (busy) return false
    busy = true
    try {
      for (const [name, fn] of [['letters', letters], ['loved', loved], ['friday', fridays], ['zakat', zakat]]) {
        try { await fn(now) } catch (e) { log.error(`personal tick ${name}:`, e && e.message) }
      }
      st.sentPurge.run(now - 400 * DAY)
      return true
    } finally { busy = false }
  }
  return { tick }
}

// ─── HTTP ─────────────────────────────────────────────────────────────
const letterOut = (r) => ({
  id: r.id, body: r.body, deliverOn: r.deliver_on, kind: r.kind,
  status: r.status === 'sending' ? 'pending' : r.status, createdAt: r.created_at, deliveredAt: r.delivered_at || null,
})
const lovedOut = (r, { withNote = true } = {}) => ({
  id: r.id, name: r.name, relation: r.relation, passedOn: r.passed_on, calendar: r.calendar,
  friday: r.friday === 1, ...(withNote ? { note: r.note } : {}), nextOn: r.next_on || null,
})
const zakatOut = (z) => (z ? { hawlStart: z.hawl_start, dueOn: z.due_on, amount: z.amount, currency: z.currency || null } : null)

/**
 * opts: { db, store?, requireUser, mailer?, pushSend?, publicOrigin?, now?, secret? }
 * Qaytarır: router (+ router.store, router.scheduler)
 */
function createPersonalRouter(opts) {
  const { requireUser, now = () => Date.now(), publicOrigin = 'https://muslims.cc' } = opts
  const store = opts.store || createPersonalStore(opts.db, { secret: opts.secret })
  const { st } = store
  const router = express.Router()
  const json = express.json({ limit: '16kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)

  /** Gövdədəki tz/lang + razılıq. Razılıq yoxdursa və əvvəl verilməyibsə → 400 consent_required. */
  function ctx(req, res, feature) {
    const b = req.body || {}
    const prefs = st.prefs.get(req.user.id)
    const tz = b.tz == null ? (prefs ? prefs.tz : null) : (validTz(b.tz) ? b.tz : null)
    if (!tz) { err(res, 400, 'bad_tz', 'Invalid time zone'); return null }
    const lang = b.lang == null ? (prefs ? prefs.lang : 'en') : validLang(b.lang)
    if (!lang) { err(res, 400, 'bad_request', 'Invalid lang'); return null }
    const consented = store.hasConsent(req.user.id, feature)
    if (!consented && b.consent !== true) { err(res, 400, 'consent_required', 'Consent required'); return null }
    store.touchPrefs(req.user.id, { tz, lang, consent: consented ? null : feature }, now())
    return { tz, lang }
  }
  const todayIn = (tz) => localNow(now(), tz).date

  router.use('/personal', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  // ── Məktublar ──
  router.get('/personal/letters', auth, (req, res) => {
    res.json({
      letters: st.letters.all(req.user.id).map(letterOut),
      consent: store.hasConsent(req.user.id, 'letters'),
      emailVerified: req.user.email_verified === 1,
      max: MAX_PENDING_LETTERS, maxLength: MAX_LETTER,
    })
  })

  function letterFields(req, res, tz) {
    const b = req.body || {}
    const body = cleanText(b.body, MAX_LETTER, { required: true })
    if (body == null) { err(res, 400, 'bad_body', 'Invalid letter'); return null }
    const d = parseDate(b.deliverOn)
    const today = todayIn(tz)
    if (!d || b.deliverOn < today || d.year > Number(today.slice(0, 4)) + 50) { err(res, 400, 'bad_date', 'Invalid date'); return null }
    const kind = b.kind == null ? 'date' : (LETTER_KINDS.includes(b.kind) ? b.kind : null)
    if (!kind) { err(res, 400, 'bad_request', 'Invalid kind'); return null }
    return { body, deliverOn: b.deliverOn, kind }
  }

  router.post('/personal/letters', auth, json, (req, res) => {
    const c = ctx(req, res, 'letters'); if (!c) return
    const f = letterFields(req, res, c.tz); if (!f) return
    const uid = req.user.id
    const r = store.tx(() => {
      if (st.countPending.get(uid).n >= MAX_PENDING_LETTERS) return null
      const t = now()
      return st.letterInsert.run(uid, f.body, f.deliverOn, f.kind, c.tz, c.lang, t, t).lastInsertRowid
    })
    if (r == null) return err(res, 409, 'too_many', 'Too many letters')
    res.status(201).json({ letter: letterOut(st.letter.get(Number(r), uid)) })
  })

  router.patch('/personal/letters/:id', auth, json, (req, res) => {
    const id = idOf(req)
    const cur = id && st.letter.get(id, req.user.id)
    if (!cur) return err(res, 404, 'not_found', 'Not found')
    if (cur.status !== 'pending') return err(res, 409, 'not_pending', 'Already delivered')
    const b = req.body || {}
    const tz = b.tz == null ? cur.tz : (validTz(b.tz) ? b.tz : null)
    if (!tz) return err(res, 400, 'bad_tz', 'Invalid time zone')
    req.body = { body: cur.body, deliverOn: cur.deliver_on, kind: cur.kind, ...b }
    const f = letterFields(req, res, tz); if (!f) return
    const lang = b.lang == null ? cur.lang : validLang(b.lang)
    if (!lang) return err(res, 400, 'bad_request', 'Invalid lang')
    if (!st.letterUpdate.run(f.body, f.deliverOn, f.kind, tz, lang, now(), id, req.user.id).changes) return err(res, 409, 'not_pending', 'Already delivered')
    res.json({ letter: letterOut(st.letter.get(id, req.user.id)) })
  })

  router.delete('/personal/letters/:id', auth, (req, res) => {
    const id = idOf(req)
    if (!id || !st.letterDelete.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  // ── Sevdiklərim üçün dua ──
  function lovedFields(req, res, tz, cur = null) {
    const b = { ...(cur ? { name: cur.name, relation: cur.relation, passedOn: cur.passed_on, calendar: cur.calendar, friday: cur.friday === 1, note: cur.note } : {}), ...(req.body || {}) }
    const name = cleanLine(b.name, MAX_NAME, { required: true })
    if (name == null) { err(res, 400, 'bad_name', 'Invalid name'); return null }
    const relation = cleanLine(b.relation, MAX_RELATION)
    if (relation == null) { err(res, 400, 'bad_request', 'Invalid relation'); return null }
    const note = cleanText(b.note, MAX_NOTE)
    if (note == null) { err(res, 400, 'bad_request', 'Invalid note'); return null }
    const d = parseDate(b.passedOn)
    if (!d || d.year < 1900 || b.passedOn > todayIn(tz)) { err(res, 400, 'bad_date', 'Invalid date'); return null }
    const calendar = b.calendar == null ? 'g' : (['g', 'h'].includes(b.calendar) ? b.calendar : null)
    if (!calendar) { err(res, 400, 'bad_request', 'Invalid calendar'); return null }
    if (b.friday != null && typeof b.friday !== 'boolean') { err(res, 400, 'bad_request', 'Invalid friday'); return null }
    // Növbəti ildönümü — bu gündən (ən şərq saat qurşağı da daxil olsun deyə dünəndən) sonra
    const nx = nextAnniversary(b.passedOn, calendar, addDaysKey(isoUtc(now()), -1))
    return { name, relation, note, passedOn: b.passedOn, calendar, friday: b.friday ? 1 : 0, nextOn: nx ? nx.date : null }
  }

  router.get('/personal/loved', auth, (req, res) => {
    const uid = req.user.id
    const share = st.share.get(uid)
    const prefs = store.prefs(uid)
    res.json({
      items: st.loved.all(uid).map((r) => lovedOut(r)),
      consent: store.hasConsent(uid, 'loved'),
      emailVerified: req.user.email_verified === 1,
      lovedEmail: prefs ? prefs.loved_email === 1 : true,
      share: { active: Boolean(share), createdAt: share ? share.created_at : null,
        followers: st.followers.all(uid).map((f) => ({ id: f.follower_id, label: personLabel(f), since: f.created_at })) },
      following: st.following.all(uid).map((o) => ({
        ownerId: o.owner_id, ownerLabel: personLabel(o), since: o.created_at,
        items: st.loved.all(o.owner_id).map((r) => lovedOut(r, { withNote: false })),
      })),
      max: MAX_LOVED,
    })
  })

  router.post('/personal/loved', auth, json, (req, res) => {
    const c = ctx(req, res, 'loved'); if (!c) return
    const f = lovedFields(req, res, c.tz); if (!f) return
    const uid = req.user.id
    const id = store.tx(() => {
      if (st.lovedCount.get(uid).n >= MAX_LOVED) return null
      const t = now()
      return st.lovedInsert.run(uid, f.name, f.relation, f.passedOn, f.calendar, f.friday, f.note, f.nextOn, t, t).lastInsertRowid
    })
    if (id == null) return err(res, 409, 'too_many', 'Too many entries')
    res.status(201).json({ item: lovedOut(st.lovedOne.get(Number(id), uid)) })
  })

  router.patch('/personal/loved/:id', auth, json, (req, res) => {
    const id = idOf(req)
    const cur = id && st.lovedOne.get(id, req.user.id)
    if (!cur) return err(res, 404, 'not_found', 'Not found')
    const prefs = store.prefs(req.user.id)
    const f = lovedFields(req, res, prefs ? prefs.tz : 'UTC', cur); if (!f) return
    st.lovedUpdate.run(f.name, f.relation, f.passedOn, f.calendar, f.friday, f.note, f.nextOn, now(), id, req.user.id)
    res.json({ item: lovedOut(st.lovedOne.get(id, req.user.id)) })
  })

  router.delete('/personal/loved/:id', auth, (req, res, next) => {
    if (!/^\d+$/.test(req.params.id)) return next()   // /loved/share — aşağıdakı marşrut
    const id = idOf(req)
    if (!id || !st.lovedDelete.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  // Paylaşma keçidi: 32 təsadüfi bayt (256 bit); bazada yalnız SHA-256. Yeni keçid köhnəni əvəz edir
  // (izləyənlər qalır); DELETE keçidi ləğv edir VƏ bütün izləyənləri çıxarır.
  router.post('/personal/loved/share', auth, json, (req, res) => {
    if (!store.hasConsent(req.user.id, 'loved')) return err(res, 400, 'consent_required', 'Consent required')
    const token = crypto.randomBytes(32).toString('base64url')
    st.shareUpsert.run(req.user.id, sha256(token), now())
    res.status(201).json({ token })
  })
  router.delete('/personal/loved/share', auth, (req, res) => {
    store.tx(() => { st.shareDelete.run(req.user.id); st.dropFollowers.run(req.user.id) })
    res.json({ ok: true })
  })
  router.delete('/personal/loved/followers/:id', auth, (req, res) => {
    const id = idOf(req)
    if (!id || !st.unfollow.run(req.user.id, id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  const ownerByToken = (t) => (typeof t === 'string' && TOKEN_RE.test(t) ? st.shareByHash.get(sha256(t)) : null)
  router.post('/personal/follow/preview', auth, json, (req, res) => {
    const s = ownerByToken((req.body || {}).token)
    if (!s) return err(res, 404, 'invalid_token', 'Invalid or revoked link')
    const owner = store.user(s.owner_id)
    res.json({ ownerLabel: personLabel(owner), count: st.lovedCount.get(s.owner_id).n, self: s.owner_id === req.user.id,
      following: Boolean(st.following.all(req.user.id).find((o) => o.owner_id === s.owner_id)) })
  })
  router.post('/personal/follow', auth, json, (req, res) => {
    const s = ownerByToken((req.body || {}).token)
    if (!s) return err(res, 404, 'invalid_token', 'Invalid or revoked link')
    if (s.owner_id === req.user.id) return err(res, 400, 'self', 'This is your own list')
    if (st.followingCount.get(req.user.id).n >= MAX_FOLLOWING) return err(res, 409, 'too_many', 'Too many lists')
    if (st.followerCount.get(s.owner_id).n >= MAX_FOLLOWERS) return err(res, 409, 'too_many', 'Too many followers')
    const c = ctx(req, res, 'loved'); if (!c) return
    st.follow.run(s.owner_id, req.user.id, now())
    res.status(201).json({ ok: true, ownerId: s.owner_id, ownerLabel: personLabel(store.user(s.owner_id)) })
  })
  router.delete('/personal/follow/:id', auth, (req, res) => {
    const id = idOf(req)
    if (!id || !st.unfollow.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  // ── Zəkat ili ──
  router.get('/personal/zakat', auth, (req, res) => {
    res.json({ reminder: zakatOut(st.zakat.get(req.user.id)), consent: store.hasConsent(req.user.id, 'zakat'), emailVerified: req.user.email_verified === 1 })
  })
  router.put('/personal/zakat', auth, json, (req, res) => {
    const c = ctx(req, res, 'zakat'); if (!c) return
    const b = req.body || {}
    const d = parseDate(b.hawlStart)
    const today = todayIn(c.tz)
    if (!d || b.hawlStart > addDaysKey(today, 366) || b.hawlStart < addDaysKey(today, -3660)) return err(res, 400, 'bad_date', 'Invalid date')
    let amount = null, currency = null
    if (b.storeAmount === true) {
      if (typeof b.amount !== 'number' || !Number.isFinite(b.amount) || b.amount < 0 || b.amount > 1e13) return err(res, 400, 'bad_request', 'Invalid amount')
      if (typeof b.currency !== 'string' || !/^[A-Z]{3}$/.test(b.currency)) return err(res, 400, 'bad_request', 'Invalid currency')
      amount = Math.round(b.amount * 100) / 100
      currency = b.currency
    }
    const due = hawlDue(b.hawlStart, today)
    if (!due) return err(res, 400, 'bad_date', 'Invalid date')
    const t = now()
    // Silinmiş (məs. məktubdakı keçidlə) xatırlatma təzədən qurulur → yeni abunəlikdən çıxma tokeni
    if (!st.zakat.get(req.user.id)) st.renewConsentZakat.run(t, req.user.id)
    st.zakatUpsert.run(req.user.id, b.hawlStart, due, amount, currency, t, t)
    res.json({ reminder: zakatOut(st.zakat.get(req.user.id)) })
  })
  router.delete('/personal/zakat', auth, (req, res) => {
    st.zakatDelete.run(req.user.id)
    res.json({ ok: true })
  })

  // ── Seçimlər, push bağlantısı, hamısını sil ──
  router.get('/personal/prefs', auth, (req, res) => {
    const p = store.prefs(req.user.id)
    res.json({
      tz: p ? p.tz : null, lang: p ? p.lang : null, lovedEmail: p ? p.loved_email === 1 : true,
      consent: Object.fromEntries(FEATURES.map((f) => [f, store.hasConsent(req.user.id, f)])),
      pushDevices: st.pushCount.get(req.user.id).n, emailVerified: req.user.email_verified === 1,
    })
  })
  router.patch('/personal/prefs', auth, json, (req, res) => {
    const b = req.body || {}
    if (!store.prefs(req.user.id)) return err(res, 404, 'not_found', 'Not found')
    if ('tz' in b || 'lang' in b) {
      if (('tz' in b && !validTz(b.tz)) || ('lang' in b && !validLang(b.lang))) return err(res, 400, 'bad_request', 'Invalid prefs')
      store.touchPrefs(req.user.id, { tz: b.tz, lang: b.lang }, now())
    }
    if ('lovedEmail' in b) {
      if (typeof b.lovedEmail !== 'boolean') return err(res, 400, 'bad_request', 'Invalid prefs')
      store.setLovedEmail(req.user.id, b.lovedEmail, now())
    }
    res.json({ ok: true })
  })

  const validEndpoint = (e) => typeof e === 'string' && e.length <= 1024 && /^https:\/\//.test(e)
  router.post('/personal/push-link', auth, json, (req, res) => {
    const { endpoint, on } = req.body || {}
    if (!validEndpoint(endpoint) || typeof on !== 'boolean') return err(res, 400, 'bad_request', 'Invalid request')
    if (!on) { st.pushUnlink.run(endpoint, req.user.id); return res.json({ linked: false }) }
    // Yalnız mövcud abunəlik (push_subs) — endpoint-i bilən öz cihazını bağlayır
    if (!st.pushSubExists.get(endpoint)) return err(res, 404, 'not_found', 'Unknown subscription')
    if (!st.pushLinked.get(endpoint, req.user.id) && st.pushCount.get(req.user.id).n >= MAX_PUSH_LINKS) return err(res, 409, 'too_many', 'Too many devices')
    st.pushLink.run(endpoint, req.user.id, now())
    res.json({ linked: true })
  })
  router.post('/personal/push-link/status', auth, json, (req, res) => {
    const { endpoint } = req.body || {}
    if (!validEndpoint(endpoint)) return err(res, 400, 'bad_request', 'Invalid request')
    res.json({ linked: Boolean(st.pushLinked.get(endpoint, req.user.id)) })
  })

  router.delete('/personal', auth, (req, res) => {
    store.wipeUser(req.user.id)
    res.json({ ok: true })
  })

  // ── Abunəlikdən çıxma (məktubdakı keçid; GİRİŞSİZ). GET — təsdiq səhifəsi (poçt skanerləri
  // keçidi açanda heç nə dəyişmir), POST — çıxış. ──
  const page = (title, text, form = '') => '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<meta name="robots" content="noindex"><title>${title}</title></head>` +
    '<body style="margin:0;padding:24px;background:#f6f7f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2a24">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">' +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px">Muslims.cc</p><p style="font-size:15px;line-height:1.6">${text}</p>${form}` +
    `<p style="margin-top:20px"><a href="${publicOrigin}/account" style="color:#0f6b4f">muslims.cc/account</a></p></div></body></html>`
  const sendPage = (res, status, html) => {
    res.status(status).set({
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      'X-Content-Type-Options': 'nosniff',
    }).send(html)
  }
  const TXT = {
    loved: 'Stop email reminders for your loved ones (anniversaries and Fridays)?',
    zakat: 'Stop your zakat year reminder?',
    done: 'Done. You will not receive these reminders any more. You can turn them on again in your account.',
    bad: 'This link is invalid.',
  }
  router.get('/personal/unsubscribe', (req, res) => {
    const t = String(req.query.t || '')
    const v = verifyUnsub(store.secret(), t, store.unsubConsentAt)
    if (!v) return sendPage(res, 400, page('Muslims.cc', TXT.bad))
    const esc = t.replace(/[^A-Za-z0-9._-]/g, '')
    sendPage(res, 200, page('Muslims.cc', TXT[v.scope],
      `<form method="post" action="/api/personal/unsubscribe"><input type="hidden" name="t" value="${esc}">` +
      '<button type="submit" style="background:#0f6b4f;color:#fff;border:0;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer">Unsubscribe</button></form>'))
  })
  const form = express.urlencoded({ extended: false, limit: '2kb' })
  router.post('/personal/unsubscribe', form, json, (req, res) => {
    const t = (req.body && req.body.t) || req.query.t || ''
    const v = verifyUnsub(store.secret(), t, store.unsubConsentAt)
    if (!v) return sendPage(res, 400, page('Muslims.cc', TXT.bad))
    if (v.scope === 'loved') store.setLovedEmail(v.userId, false, now())
    else if (v.scope === 'zakat') st.zakatDelete.run(v.userId)
    // RFC 8058 (poçt proqramının "abunəlikdən çıx" düyməsi) — HTML gözləmir
    if (req.body && req.body['List-Unsubscribe'] === 'One-Click') return res.json({ ok: true })
    sendPage(res, 200, page('Muslims.cc', TXT.done))
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/personal', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('personal error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  router.store = store
  router.scheduler = createScheduler({
    store, mailer: opts.mailer, pushSend: opts.pushSend, publicOrigin, log: opts.log || console, icons: opts.icons || {},
  })
  return router
}

// ─── Ümmətin xətmi (server/globalKhatm.js) üçün kiçik oxu funksiyaları — YALNIZ həmin istifadəçinin öz sətirləri ──
/** "Sevdiklərim üçün dua" adları (ithaf seçimi üçün). Cədvəl yoxdursa — boş. */
function lovedNamesOf(db, userId, max = MAX_LOVED) {
  try { return (db.raw || db).prepare('SELECT name FROM personal_loved WHERE user_id = ? ORDER BY id ASC LIMIT ?').all(userId, max).map((r) => r.name) } catch { return [] }
}
/** Hesaba bağlı push abunəlikləri → [{ endpoint, keys }] (personal_push_links ↔ push_subs) */
function pushSubsForUser(db, userId) {
  try {
    return (db.raw || db).prepare(`SELECT s.endpoint, s.keys_p256dh, s.keys_auth FROM personal_push_links l
      JOIN push_subs s ON s.endpoint = l.endpoint WHERE l.user_id = ?`).all(userId)
      .map((r) => ({ endpoint: r.endpoint, keys: { p256dh: r.keys_p256dh, auth: r.keys_auth } }))
  } catch { return [] }
}
/** İstifadəçinin bildiriş dili (personal_prefs.lang) | 'en' */
function prefLangOf(db, userId) {
  try { const r = (db.raw || db).prepare('SELECT lang FROM personal_prefs WHERE user_id = ?').get(userId); return (r && r.lang) || 'en' } catch { return 'en' }
}

module.exports = {
  lovedNamesOf, pushSubsForUser, prefLangOf,
  MAX_LETTER, MAX_PENDING_LETTERS, MAX_LOVED, MAX_FOLLOWERS, MAX_FOLLOWING, SEND_HOUR, MAX_ATTEMPTS,
  createPersonalStore, createPersonalRouter, createScheduler,
  validTz, localNow, dayState, nextAnniversary, nextGregorianAnniversary, nextHijriAnniversary, hawlDue,
  unsubToken, verifyUnsub, personLabel, cleanText, cleanLine,
}
