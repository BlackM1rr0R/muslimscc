// ═══════════════════════════════════════════════════════════════════════
// K5. Həftəlik e-poçt hesabatı — könüllü (razılıqla), SERVERDƏ OXUNAN yalnız həftənin 5 rəqəmi
//
// • Hesabın qalan məlumatı uçdan-uca şifrəlidir — server namaz/Quran qeydlərini görmür. Ona görə həftənin
//   rəqəmlərini KLİENT hesablayır (src/utils/weeklyReport.js) və saytı açanda PUT ilə göndərir:
//   qılınan namaz X/35, Quran səhifəsi (təxmini), zikr cəmi, oruc günləri, vird tamamlanma %-i.
// • Hesabat günü: istifadəçinin seçdiyi həftə günü, ÖZ saat qurşağında 09:00-dan sonra (gün bitənə qədər).
//   Hesabat dövrü — həmin gündən əvvəlki 7 gün; rəqəmlər `week_end` = hesabat günü açarı ilə saxlanır.
// • Həmin həftə üçün heç bir rəqəm gəlməyibsə — SUSMAYA GÖRƏ GÖNDƏRİLMİR ("skipped"; "sizi itirdik"
//   məktubu yoxdur — istifadəçini narahat etməmək üçün).
// • Yalnız TƏSDİQLƏNMİŞ e-poçta. Abunəlikdən çıxma — imzalı keçid (HMAC, personal.js sirri; ayrıca
//   "weekly" sahəsi; HMAC-a razılıq vaxtı consent_at da daxildir — yenidən razılıq / yenidən açma tokeni
//   dəyişir, köhnə məktubdakı keçid işləmir), RFC 8058 List-Unsubscribe-Post. İkiqat göndəriş yoxdur: göndərişdən ƏVVƏL
//   sətir atomik tutulur ("sending"); 15 dəq. ilişib qalan "sending" çatdırılmış sayılır.
//   Xəta → 5 cəhdə qədər (5/15/45/135 dəq.), sonra "failed".
//
// Cədvəllər MİQRASİYASIZ: weekly_prefs, weekly_stats, weekly_sent — users(id) ON DELETE CASCADE.
//
// Endpoint-lər (requireUser + CSRF, unsubscribe-dan başqa):
//   GET    /api/weekly                   → { prefs | null, emailVerified, stats, nextReport }
//   PUT    /api/weekly/prefs             { consent?, enabled, weekday, tz, lang } → { prefs }
//   PUT    /api/weekly/stats             { weekEnd, prayers, quranPages, dhikr, fasts, wirdPct } → { ok }
//   DELETE /api/weekly                   → { ok } (hamısı silinir)
//   GET/POST /api/weekly/unsubscribe?t=  (girişsiz)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const { validTz, localNow } = require('./personal')

const SEND_HOUR = 9
const MAX_ATTEMPTS = 5
const STALE_MS = 15 * 60 * 1000
const DAY = 86400000
const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const STAT_CAPS = { prayers: 35, quranPages: 5000, dhikr: 1000000, fasts: 7, wirdPct: 100 }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS weekly_prefs (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled    INTEGER NOT NULL DEFAULT 0,
  weekday    INTEGER NOT NULL DEFAULT 5 CHECK (weekday BETWEEN 0 AND 6),
  tz         TEXT NOT NULL DEFAULT 'UTC',
  lang       TEXT NOT NULL DEFAULT 'en',
  consent_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS weekly_prefs_enabled ON weekly_prefs(enabled);
CREATE TABLE IF NOT EXISTS weekly_stats (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_end    TEXT NOT NULL,
  prayers     INTEGER,
  quran_pages INTEGER,
  dhikr       INTEGER,
  fasts       INTEGER,
  wird_pct    INTEGER,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, week_end)
);
CREATE TABLE IF NOT EXISTS weekly_sent (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_end    TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('sending','sent','skipped','retry','failed')),
  attempts    INTEGER NOT NULL DEFAULT 0,
  next_try_at INTEGER,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, week_end)
);
`

const weekdayOf = (key) => new Date(key + 'T12:00:00Z').getUTCDay()
const addDays = (key, n) => new Date(Date.parse(key + 'T12:00:00Z') + n * DAY).toISOString().slice(0, 10)
const mailLang = (l) => (MAIL_LANGS.includes(l) ? l : 'en')
/** 'YYYY-MM-DD' → yerli dildə uzun tarix (məktub üçün) */
function longDate(key, lang) {
  try { return new Intl.DateTimeFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(key + 'T12:00:00Z')) } catch { return key }
}
const langPrefix = (lang) => (lang === 'az' ? '' : `/${MAIL_LANGS.includes(lang) ? lang : 'en'}`)

/** Bu andan sonrakı (və ya bu günkü, saat 09:00-dan əvvəlsə) hesabat günü — istifadəçinin saat qurşağında */
function nextReportDate(ms, tz, weekday) {
  const l = localNow(ms, tz)
  if (weekdayOf(l.date) === weekday && l.hour < SEND_HOUR) return l.date
  for (let i = 1; i <= 7; i++) { const d = addDays(l.date, i); if (weekdayOf(d) === weekday) return d }
  return null
}

/** Rəqəmlər → təmiz obyekt | null. Hər sahə: tam ədəd 0…hədd və ya null (məlum deyil — məktubda sətir yoxdur). */
function validStats(b) {
  if (!b || typeof b !== 'object') return null
  const out = {}
  let any = false
  for (const [k, max] of Object.entries(STAT_CAPS)) {
    const v = b[k]
    if (v == null) { out[k] = null; continue }
    if (!Number.isInteger(v) || v < 0 || v > max) return null
    out[k] = v
    any = true
  }
  return any ? out : null
}

// Bu tarixdən ƏVVƏL razılıq verənlərin artıq göndərilmiş məktublarındakı köhnə (consent_at-sız) keçid
// razılıq dəyişməyənə qədər işləyir; yeni razılıq (consent_at ≥ bu tarix) köhnə formanı qəbul etmir.
const LEGACY_UNSUB_BEFORE = Date.UTC(2026, 10, 19)

function unsubToken(secret, userId, consentAt) {
  const scope = consentAt ? `muslims.cc/weekly-unsub:${userId}:${consentAt}` : `muslims.cc/weekly-unsub:${userId}`
  const sig = crypto.createHmac('sha256', secret).update(scope).digest('base64url').slice(0, 32)
  return `${userId}.weekly.${sig}`
}
const sameSig = (x, want) => {
  const a = Buffer.from(x), b = Buffer.from(want)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
/** consentAtOf(userId) → consent_at | null (verilməyibsə — yalnız köhnə forma yoxlanır) */
function verifyUnsub(secret, token, consentAtOf = null) {
  const m = /^(\d{1,12})\.weekly\.([A-Za-z0-9_-]{32})$/.exec(String(token || ''))
  if (!m) return null
  const userId = Number(m[1])
  const consentAt = consentAtOf ? consentAtOf(userId) : null
  if (consentAt && sameSig(m[2], unsubToken(secret, userId, consentAt).split('.')[2])) return { userId }
  if ((!consentAt || consentAt < LEGACY_UNSUB_BEFORE) && sameSig(m[2], unsubToken(secret, userId).split('.')[2])) return { userId }
  return null
}

function createWeeklyRouter({ db, requireUser, mailer = null, secret, publicOrigin = 'https://muslims.cc', now = () => Date.now(), log = console }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const p = (sql) => raw.prepare(sql)
  const secretOf = typeof secret === 'function' ? secret : () => secret
  const st = {
    prefs: p('SELECT * FROM weekly_prefs WHERE user_id = ?'),
    upsertPrefs: p(`INSERT INTO weekly_prefs (user_id, enabled, weekday, tz, lang, consent_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled, weekday = excluded.weekday, tz = excluded.tz, lang = excluded.lang,
      consent_at = excluded.consent_at, updated_at = excluded.updated_at`),
    disable: p('UPDATE weekly_prefs SET enabled = 0, updated_at = ? WHERE user_id = ?'),
    upsertStats: p(`INSERT INTO weekly_stats (user_id, week_end, prayers, quran_pages, dhikr, fasts, wird_pct, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, week_end) DO UPDATE SET prayers = excluded.prayers, quran_pages = excluded.quran_pages, dhikr = excluded.dhikr,
      fasts = excluded.fasts, wird_pct = excluded.wird_pct, updated_at = excluded.updated_at`),
    stats: p('SELECT * FROM weekly_stats WHERE user_id = ? AND week_end = ?'),
    recent: p('SELECT * FROM weekly_stats WHERE user_id = ? ORDER BY week_end DESC LIMIT 8'),
    sentOf: p('SELECT * FROM weekly_sent WHERE user_id = ? ORDER BY week_end DESC LIMIT 8'),
    enabled: p(`SELECT w.*, u.email, u.email_verified, u.disabled FROM weekly_prefs w JOIN users u ON u.id = w.user_id WHERE w.enabled = 1`),
    claim: p("INSERT OR IGNORE INTO weekly_sent (user_id, week_end, status, attempts, updated_at) VALUES (?, ?, 'sending', 0, ?)"),
    retryClaim: p("UPDATE weekly_sent SET status = 'sending', updated_at = ? WHERE user_id = ? AND week_end = ? AND status = 'retry' AND next_try_at <= ?"),
    sentGet: p('SELECT * FROM weekly_sent WHERE user_id = ? AND week_end = ?'),
    mark: p('UPDATE weekly_sent SET status = ?, attempts = ?, next_try_at = ?, updated_at = ? WHERE user_id = ? AND week_end = ?'),
    stale: p("UPDATE weekly_sent SET status = 'sent' WHERE status = 'sending' AND updated_at <= ?"),
    purgeStats: p('DELETE FROM weekly_stats WHERE updated_at <= ?'),
    purgeSent: p('DELETE FROM weekly_sent WHERE updated_at <= ?'),
    wipe: [p('DELETE FROM weekly_prefs WHERE user_id = ?'), p('DELETE FROM weekly_stats WHERE user_id = ?'), p('DELETE FROM weekly_sent WHERE user_id = ?')],
  }
  const router = express.Router()
  const json = express.json({ limit: '2kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })

  const prefsOut = (r) => (r ? { enabled: r.enabled === 1, weekday: r.weekday, tz: r.tz, lang: r.lang, consentAt: r.consent_at } : null)
  const statsOut = (r) => ({ weekEnd: r.week_end, prayers: r.prayers, quranPages: r.quran_pages, dhikr: r.dhikr, fasts: r.fasts, wirdPct: r.wird_pct, updatedAt: r.updated_at })

  router.get('/weekly', auth, (req, res) => {
    const pr = st.prefs.get(req.user.id)
    res.json({
      prefs: prefsOut(pr), emailVerified: req.user.email_verified === 1,
      stats: st.recent.all(req.user.id).map(statsOut),
      nextReport: pr && pr.enabled ? nextReportDate(now(), pr.tz, pr.weekday) : null,
    })
  })

  router.put('/weekly/prefs', auth, json, (req, res) => {
    const uid = req.user.id
    const b = req.body || {}
    const cur = st.prefs.get(uid)
    if (!cur && b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    if (typeof b.enabled !== 'boolean' || !Number.isInteger(b.weekday) || b.weekday < 0 || b.weekday > 6) return err(res, 400, 'bad_request', 'Bad request')
    const tz = b.tz == null ? (cur ? cur.tz : 'UTC') : (validTz(b.tz) ? b.tz : null)
    if (!tz) return err(res, 400, 'bad_tz', 'Invalid time zone')
    const lang = typeof b.lang === 'string' && /^[a-z]{2,3}$/.test(b.lang) ? b.lang : (cur ? cur.lang : 'en')
    const t = now()
    // Yenidən razılıq və ya söndürülmüşdən yenidən açma → yeni consent_at (abunəlikdən çıxma tokeni dəyişir)
    const renew = !cur || b.consent === true || (cur.enabled !== 1 && b.enabled)
    st.upsertPrefs.run(uid, b.enabled ? 1 : 0, b.weekday, tz, lang, renew ? t : cur.consent_at, t)
    const pr = st.prefs.get(uid)
    res.json({ prefs: prefsOut(pr), nextReport: pr.enabled ? nextReportDate(t, pr.tz, pr.weekday) : null })
  })

  router.put('/weekly/stats', auth, json, (req, res) => {
    const uid = req.user.id
    const pr = st.prefs.get(uid)
    if (!pr || pr.enabled !== 1) return err(res, 409, 'not_enabled', 'Weekly report is off')
    const b = req.body || {}
    const t = now()
    const today = localNow(t, pr.tz).date
    // Yalnız qarşıdakı (və ya bu günkü) hesabat günü — seçilmiş həftə günü, bu gündən 7 günə qədər
    if (typeof b.weekEnd !== 'string' || !DATE_RE.test(b.weekEnd) || b.weekEnd < today || b.weekEnd > addDays(today, 7) || weekdayOf(b.weekEnd) !== pr.weekday) {
      return err(res, 400, 'bad_week', 'Invalid week')
    }
    const sent = st.sentGet.get(uid, b.weekEnd)
    if (sent && sent.status !== 'retry') return err(res, 409, 'already_sent', 'This week was already reported')
    const v = validStats(b)
    if (!v) return err(res, 400, 'bad_request', 'Invalid numbers')
    st.upsertStats.run(uid, b.weekEnd, v.prayers, v.quranPages, v.dhikr, v.fasts, v.wirdPct, t)
    res.json({ ok: true })
  })

  router.delete('/weekly', auth, (req, res) => {
    for (const s of st.wipe) s.run(req.user.id)
    res.json({ ok: true })
  })

  // ── Abunəlikdən çıxma (girişsiz; GET — yalnız təsdiq səhifəsi, POST — çıxış) ──
  const page = (text, form = '') => '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>Muslims.cc</title></head>' +
    '<body style="margin:0;padding:24px;background:#f6f7f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2a24">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">' +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px">Muslims.cc</p><p style="font-size:15px;line-height:1.6">${text}</p>${form}` +
    `<p style="margin-top:20px"><a href="${publicOrigin}/account" style="color:#0f6b4f">muslims.cc/account</a></p></div></body></html>`
  const sendPage = (res, status, html) => res.status(status).set({
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    'X-Content-Type-Options': 'nosniff',
  }).send(html)
  const consentAtOf = (uid) => { const r = st.prefs.get(uid); return r ? r.consent_at : null }
  router.get('/weekly/unsubscribe', (req, res) => {
    const t = String(req.query.t || '')
    if (!verifyUnsub(secretOf(), t, consentAtOf)) return sendPage(res, 400, page('This link is invalid.'))
    const esc = t.replace(/[^A-Za-z0-9._-]/g, '')
    sendPage(res, 200, page('Stop the weekly summary email?',
      `<form method="post" action="/api/weekly/unsubscribe"><input type="hidden" name="t" value="${esc}">` +
      '<button type="submit" style="background:#0f6b4f;color:#fff;border:0;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer">Unsubscribe</button></form>'))
  })
  const form = express.urlencoded({ extended: false, limit: '2kb' })
  router.post('/weekly/unsubscribe', form, json, (req, res) => {
    const t = (req.body && req.body.t) || req.query.t || ''
    const v = verifyUnsub(secretOf(), t, consentAtOf)
    if (!v) return sendPage(res, 400, page('This link is invalid.'))
    st.disable.run(now(), v.userId)
    if (req.body && req.body['List-Unsubscribe'] === 'One-Click') return res.json({ ok: true })
    sendPage(res, 200, page('Done. You will not receive the weekly summary any more. You can turn it on again in your account.'))
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/weekly', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('weekly error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  // ── Planlayıcı (server.js: dəqiqədə bir) ──
  let busy = false
  const backoff = (a) => 5 * 60 * 1000 * 3 ** Math.max(0, a - 1)
  async function sendOne(row, weekEnd, t) {
    if (!st.claim.run(row.user_id, weekEnd, t).changes && !st.retryClaim.run(t, row.user_id, weekEnd, t).changes) return null
    const s = st.stats.get(row.user_id, weekEnd)
    // Rəqəm yoxdur → SUSMAYA GÖRƏ göndərilmir (sənədləşdirilib)
    if (!s) { st.mark.run('skipped', 0, null, t, row.user_id, weekEnd); return 'skipped' }
    const lang = mailLang(row.lang)
    let ok = false
    try {
      const r = await mailer.sendTemplate('weekly', lang, row.email, {
        date: longDate(weekEnd, lang), url: `${publicOrigin}${langPrefix(row.lang)}/account#weekly`,
        prayers: s.prayers, pages: s.quran_pages, dhikr: s.dhikr, fasts: s.fasts, wird: s.wird_pct,
        unsubUrl: `${publicOrigin}/api/weekly/unsubscribe?t=${unsubToken(secretOf(), row.user_id, row.consent_at)}`,
      })
      // E-poçt sönülüdür (RESEND_API_KEY yoxdur) — təkrar cəhd mənasızdır
      if (r && r.skipped && !r.ok) { st.mark.run('skipped', 0, null, t, row.user_id, weekEnd); return 'skipped' }
      ok = Boolean(r && r.ok)
    } catch (e) { log.error('weekly mail:', e && e.message) }
    if (ok) { st.mark.run('sent', 0, null, t, row.user_id, weekEnd); return 'sent' }
    const cur = st.sentGet.get(row.user_id, weekEnd)
    const attempts = (cur ? cur.attempts : 0) + 1
    st.mark.run(attempts >= MAX_ATTEMPTS ? 'failed' : 'retry', attempts, t + backoff(attempts), t, row.user_id, weekEnd)
    return 'retry'
  }
  async function tick(t = now()) {
    if (busy || !mailer) return false
    busy = true
    try {
      st.stale.run(t - STALE_MS)
      for (const row of st.enabled.all()) {
        if (row.disabled || row.email_verified !== 1 || !row.email) continue
        let l
        try { l = localNow(t, row.tz) } catch { continue }
        if (l.hour < SEND_HOUR || weekdayOf(l.date) !== row.weekday) continue
        try { await sendOne(row, l.date, t) } catch (e) { log.error('weekly tick:', e && e.message) }
      }
      return true
    } finally { busy = false }
  }
  router.tick = tick
  router.purge = () => { const t = now() - 120 * DAY; return st.purgeStats.run(t).changes + st.purgeSent.run(t).changes }
  router.exportUser = (uid) => ({
    prefs: prefsOut(st.prefs.get(uid)), stats: st.recent.all(uid).map(statsOut),
    sent: st.sentOf.all(uid).map((r) => ({ weekEnd: r.week_end, status: r.status, at: r.updated_at })),
  })
  router.summaryUser = (uid) => { const pr = st.prefs.get(uid); return { enabled: Boolean(pr && pr.enabled === 1), weeks: st.recent.all(uid).length } }
  return router
}

module.exports = { createWeeklyRouter, nextReportDate, validStats, unsubToken, verifyUnsub, weekdayOf, SEND_HOUR, STAT_CAPS }
