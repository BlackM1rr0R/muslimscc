// ═══════════════════════════════════════════════════════════════════════
// Admin panelindən istifadəçilərə məktub (kampaniya) — YALNIZ baş admin (superadmin), serverdə yoxlanır
//
// • Alıcılar: hamısı | seçilmişlər | bir nəfər — HƏMİŞƏ yalnız təsdiqlənmiş, bloklanmamış, imtina
//   etməmiş (email_optout) hesablar. Təsdiqlənməmiş ünvana heç vaxt.
// • Məzmun: mövzu + düz mətn (abzas, **qalın**, https keçidləri — server/mailer.js renderCampaign,
//   formadan HTML keçmir) + ixtiyari bir düymə (yalnız publicOrigin keçidi). Bir versiya hamıya, və ya
//   dillərə görə (az/en/ru/tr/ar): alıcı user_prefs-dəki sayt dilinin versiyasını, yoxdursa seçilmiş
//   ehtiyat dilini alır.
// • Göndəriş: yaradılanda alıcılar campaign_sends-ə "pending" kimi yazılır (snapshot). Planlayıcı
//   (tick) sətri ATOMİK tutur ('sending'), göndərir, 'sent'/'failed' yazır → təkrar cəhd və ya
//   yenidən başlatmada ikiqat göndəriş yoxdur (STALE_MS-dən çox 'sending' qalan sətir çatdırılmış
//   sayılır). Temp: məktublar arası ≥ gapMs (≥ 700 ms), saatda ≤ maxPerHour (300) — sayğac DB-dədir,
//   blue/green zamanı iki proses birlikdə də həddi aşmır. Ləğv: qalan 'pending' → 'cancelled'.
// • İmtina: hər məktubda imzalı keçid (HMAC, personal.js sirri, "news" sahəsi) + RFC 8058
//   List-Unsubscribe-Post. email_optout yalnız BU məktubları dayandırır (xoş gəldin, təhlükəsizlik,
//   təsdiq məktubları təsirlənmir).
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS; user_version-a toxunulmur):
//   campaigns, campaign_sends (→ users ON DELETE CASCADE), email_optout (→ users CASCADE),
//   campaign_audit, campaign_meta.
//
// Endpoint-lər (admin paneli sessiyası + superadmin + CSRF; unsubscribe-dan başqa):
//   POST /api/admin/mail/preview      { content, lang? }            → { subject, html, text, lang }
//   POST /api/admin/mail/test         { content }                   → { ok, sent }  (öz e-poçtunuza)
//   POST /api/admin/mail/audience     { recipients, content? }      → { count, byVersion, excluded }
//   POST /api/admin/mail/campaigns    { content, recipients, confirmCount, requestId? } → { campaign }
//   GET  /api/admin/mail/campaigns                                  → { campaigns, mailEnabled, queue }
//   GET  /api/admin/mail/campaigns/:id                              → { campaign }
//   POST /api/admin/mail/campaigns/:id/cancel                       → { campaign }
//   GET/POST /api/mail/unsubscribe?t=&l=   (girişsiz)
// Logda ünvan YOXDUR. IP saxlanmır.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const { renderCampaign } = require('./mailer')
const { SCHEMA: WELCOME_SCHEMA } = require('./welcome')

const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const DAY = 86400e3
const HOUR = 3600e3
const STALE_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 3
const MAX_IDS = 5000
const MIN_GAP_MS = 700
const LIMITS = { subject: 150, body: 10000, ctaLabel: 60, ctaUrl: 500 }

const OPTOUT_SCHEMA = `
CREATE TABLE IF NOT EXISTS email_optout (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  at      INTEGER NOT NULL
);`

const SCHEMA = OPTOUT_SCHEMA + `
CREATE TABLE IF NOT EXISTS campaigns (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject         TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_by      INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  created_at      INTEGER NOT NULL,
  recipient_count INTEGER NOT NULL,
  sent            INTEGER NOT NULL DEFAULT 0,
  failed          INTEGER NOT NULL DEFAULT 0,
  skipped         INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL CHECK (status IN ('sending','done','cancelled')),
  request_id      TEXT UNIQUE,
  updated_at      INTEGER NOT NULL,
  finished_at     INTEGER,
  cancelled_by    INTEGER REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS campaigns_by_status ON campaigns(status);
CREATE TABLE IF NOT EXISTS campaign_sends (
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lang        TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('pending','sending','sent','failed','skipped','cancelled')),
  attempts    INTEGER NOT NULL DEFAULT 0,
  next_try_at INTEGER,
  claimed_at  INTEGER,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS campaign_sends_by_status ON campaign_sends(status, campaign_id);
CREATE INDEX IF NOT EXISTS campaign_sends_by_claim ON campaign_sends(claimed_at);
CREATE INDEX IF NOT EXISTS campaign_sends_by_user ON campaign_sends(user_id);
CREATE TABLE IF NOT EXISTS campaign_audit (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id    INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  action      TEXT NOT NULL CHECK (action IN ('create','cancel','test')),
  campaign_id INTEGER,
  detail      TEXT NOT NULL DEFAULT '',
  at          INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS campaign_meta (
  k TEXT PRIMARY KEY,
  v INTEGER NOT NULL
);`

const cleanLine = (s) => String(s).replace(/[‪-‮⁦-⁩]/g, '').replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim()
const cleanBody = (s) => String(s).replace(/\r\n?/g, '\n').replace(/[‪-‮⁦-⁩]/g, '').replace(/[^\P{Cc}\n]/gu, ' ').trim()

/**
 * Formadan gələn məzmun → { content } | { error, lang? }.
 * content: { mode: 'single'|'perLang', header: 'gif'|'text', fallback, versions: { <lang>: { subject, body, ctaLabel, ctaUrl } } }
 * ctaUrl: tam https URL (yalnız publicOrigin) və ya "/yol" — yol versiyanın dil prefiksi ilə tamamlanır (az — prefikssiz).
 */
function validContent(c, publicOrigin = 'https://muslims.cc') {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return { error: 'bad_request' }
  if (c.mode !== 'single' && c.mode !== 'perLang') return { error: 'bad_mode' }
  const header = c.header == null ? 'gif' : c.header
  if (header !== 'gif' && header !== 'text') return { error: 'bad_request' }
  const v = c.versions
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { error: 'bad_request' }
  const langs = Object.keys(v)
  if (!langs.length || langs.some((l) => !MAIL_LANGS.includes(l))) return { error: 'bad_lang' }
  if (c.mode === 'single' && langs.length !== 1) return { error: 'bad_lang' }
  const fallback = c.mode === 'single' ? langs[0] : c.fallback
  if (!langs.includes(fallback)) return { error: 'bad_fallback' }
  const origin = new URL(publicOrigin).origin
  const versions = {}
  for (const l of MAIL_LANGS.filter((x) => langs.includes(x))) {
    const x = v[l]
    if (!x || typeof x !== 'object') return { error: 'bad_request', lang: l }
    if (typeof x.subject !== 'string' || typeof x.body !== 'string') return { error: 'bad_request', lang: l }
    const subject = cleanLine(x.subject)
    const body = cleanBody(x.body)
    if (!subject || x.subject.length > LIMITS.subject * 2 || subject.length > LIMITS.subject) return { error: 'bad_subject', lang: l }
    if (!body || x.body.length > LIMITS.body * 2 || body.length > LIMITS.body) return { error: 'bad_body', lang: l }
    if ((x.ctaLabel != null && typeof x.ctaLabel !== 'string') || (x.ctaUrl != null && typeof x.ctaUrl !== 'string')) return { error: 'bad_cta', lang: l }
    const ctaLabel = cleanLine(x.ctaLabel || '')
    let ctaUrl = String(x.ctaUrl || '').trim()
    if (Boolean(ctaLabel) !== Boolean(ctaUrl)) return { error: 'bad_cta', lang: l }
    if (ctaLabel.length > LIMITS.ctaLabel || ctaUrl.length > LIMITS.ctaUrl) return { error: 'bad_cta', lang: l }
    if (ctaUrl) {
      if (/^\/(?!\/)/.test(ctaUrl)) {
        const prefixed = l === 'az' || new RegExp(`^/${l}(/|$|[?#])`).test(ctaUrl)
        ctaUrl = origin + (prefixed ? '' : '/' + l) + (ctaUrl === '/' && l !== 'az' ? '' : ctaUrl)
      }
      let u
      try { u = new URL(ctaUrl) } catch { return { error: 'bad_cta', lang: l } }
      if (u.protocol !== 'https:' || u.origin !== origin || u.username || u.password) return { error: 'bad_cta', lang: l }
      ctaUrl = u.href
    }
    versions[l] = { subject, body, ctaLabel, ctaUrl }
  }
  return { content: { mode: c.mode, header, fallback, versions } }
}

/** Alıcı seçimi → { mode, ids } | null */
function validRecipients(r) {
  if (!r || typeof r !== 'object') return null
  if (r.mode === 'all') return { mode: 'all', ids: [] }
  if (r.mode !== 'selected' && r.mode !== 'one') return null
  if (!Array.isArray(r.ids) || !r.ids.length || r.ids.length > MAX_IDS) return null
  if (!r.ids.every((n) => Number.isSafeInteger(n) && n > 0)) return null
  const ids = [...new Set(r.ids)]
  if (r.mode === 'one' && ids.length !== 1) return null
  return { mode: r.mode, ids }
}

/** Alıcının versiyası: tək versiya — hamıya; dillərə görə — sayt dili (user_prefs), yoxdursa ehtiyat */
const versionFor = (content, siteLang) => (content.mode === 'single' ? content.fallback : (content.versions[siteLang] ? siteLang : content.fallback))

// ── İmtina tokeni (HMAC; ayrıca "news" sahəsi — weekly/personal tokenləri burada keçmir) ──
function unsubToken(secret, userId) {
  const sig = crypto.createHmac('sha256', secret).update(`muslims.cc/news-unsub:${userId}`).digest('base64url').slice(0, 32)
  return `${userId}.news.${sig}`
}
function verifyUnsub(secret, token) {
  const m = /^(\d{1,12})\.news\.([A-Za-z0-9_-]{32})$/.exec(String(token || ''))
  if (!m || !secret) return null
  const userId = Number(m[1])
  const want = Buffer.from(unsubToken(secret, userId).split('.')[2])
  const got = Buffer.from(m[2])
  return got.length === want.length && crypto.timingSafeEqual(got, want) ? { userId } : null
}

const PAGE = {
  az: { invalid: 'Bu keçid etibarsızdır.', ask: 'Muslims.cc-nin bu cür məktublarından imtina edirsiniz?', button: 'İmtina et', done: 'Hazırdır. Artıq bu cür məktublar almayacaqsınız. Hesab təhlükəsizliyi məktubları yenə gələcək.' },
  en: { invalid: 'This link is invalid.', ask: 'Stop receiving these emails from Muslims.cc?', button: 'Unsubscribe', done: 'Done. You will not receive these emails any more. Account security emails will still arrive.' },
  ru: { invalid: 'Эта ссылка недействительна.', ask: 'Отписаться от таких писем Muslims.cc?', button: 'Отписаться', done: 'Готово. Такие письма больше не придут. Письма о безопасности аккаунта будут приходить по-прежнему.' },
  tr: { invalid: 'Bu bağlantı geçersiz.', ask: 'Muslims.cc’nin bu tür e-postalarından çıkmak istiyor musunuz?', button: 'Abonelikten çık', done: 'Tamam. Artık bu tür e-postalar gelmeyecek. Hesap güvenliği e-postaları yine gelecek.' },
  ar: { invalid: 'هذا الرابط غير صالح.', ask: 'هل تريد إيقاف هذه الرسائل من Muslims.cc؟', button: 'إلغاء الاشتراك', done: 'تم. لن تصلك هذه الرسائل بعد الآن، وستظل رسائل أمان الحساب تصلك.' },
}

/**
 * opts: { db, requireAdmin, adminRoleOf, mailer, secret (string|fn), publicOrigin?, now?, log?, gapMs?, maxPerHour?, sleep?, limits? }
 * Qaytarır: express router + { tick, purge, exportUser, summaryUser, store }
 */
function createMailCampaignsRouter(opts) {
  const { db, requireAdmin, adminRoleOf, mailer = null, publicOrigin = 'https://muslims.cc', now = () => Date.now(), log = console } = opts
  const raw = db.raw || db
  raw.exec(WELCOME_SCHEMA)          // user_prefs (sayt dili) — server/welcome.js ilə eyni mənbə
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const secretOf = typeof opts.secret === 'function' ? opts.secret : () => opts.secret
  const gapMs = Math.max(opts.gapMs != null ? opts.gapMs : MIN_GAP_MS, opts.allowFastGap ? 0 : MIN_GAP_MS)
  const maxPerHour = Math.min(opts.maxPerHour || 300, 300)
  const maxPerTick = opts.maxPerTick || 200
  const sleep = opts.sleep || ((ms) => new Promise((r) => { const h = setTimeout(r, ms); if (h.unref) h.unref() }))
  const limits = { test: 10, create: 10, ...(opts.limits || {}) }
  const p = (sql) => raw.prepare(sql)
  const ELIGIBLE = `u.email_verified = 1 AND u.disabled = 0 AND u.email IS NOT NULL AND u.email <> '' AND o.user_id IS NULL`
  const st = {
    allEligible: p(`SELECT u.id, up.lang AS site_lang FROM users u LEFT JOIN email_optout o ON o.user_id = u.id
      LEFT JOIN user_prefs up ON up.user_id = u.id WHERE ${ELIGIBLE} ORDER BY u.id`),
    allStats: p(`SELECT SUM(u.email_verified <> 1) AS unverified, SUM(u.email_verified = 1 AND u.disabled <> 0) AS disabled,
      SUM(u.email_verified = 1 AND u.disabled = 0 AND o.user_id IS NOT NULL) AS opted_out
      FROM users u LEFT JOIN email_optout o ON o.user_id = u.id`),
    userState: p(`SELECT u.id, u.email, u.email_verified, u.disabled, o.user_id AS opted, up.lang AS site_lang FROM users u
      LEFT JOIN email_optout o ON o.user_id = u.id LEFT JOIN user_prefs up ON up.user_id = u.id WHERE u.id = ?`),
    insCampaign: p(`INSERT INTO campaigns (subject, content, created_by, created_at, recipient_count, status, request_id, updated_at)
      VALUES (?, ?, ?, ?, ?, 'sending', ?, ?)`),
    insSend: p(`INSERT OR IGNORE INTO campaign_sends (campaign_id, user_id, lang, status, updated_at) VALUES (?, ?, ?, 'pending', ?)`),
    byRequest: p('SELECT * FROM campaigns WHERE request_id = ?'),
    campaign: p(`SELECT c.*, a.email AS created_by_email FROM campaigns c LEFT JOIN admins a ON a.id = c.created_by WHERE c.id = ?`),
    list: p(`SELECT c.*, a.email AS created_by_email FROM campaigns c LEFT JOIN admins a ON a.id = c.created_by ORDER BY c.id DESC LIMIT 50`),
    progress: p(`SELECT status, COUNT(*) AS n FROM campaign_sends WHERE campaign_id = ? GROUP BY status`),
    audit: p('INSERT INTO campaign_audit (admin_id, action, campaign_id, detail, at) VALUES (?, ?, ?, ?, ?)'),
    cancel: p(`UPDATE campaigns SET status = 'cancelled', cancelled_by = ?, updated_at = ?, finished_at = ? WHERE id = ? AND status = 'sending'`),
    cancelSends: p(`UPDATE campaign_sends SET status = 'cancelled', updated_at = ? WHERE campaign_id = ? AND status = 'pending'`),
    // Temp: DB-dəki son göndəriş anı + son saatın sayı (iki proses də eyni həddi görür)
    metaInit: p('INSERT OR IGNORE INTO campaign_meta (k, v) VALUES (?, 0)'),
    // v gələcəkdədirsə (saat geri çəkilib) — köhnəlmiş sayılır, növbə ilişmir
    gate: p(`UPDATE campaign_meta SET v = ? WHERE k = 'last_send' AND (v <= ? OR v > ?)`),
    hourCount: p('SELECT COUNT(*) AS n FROM campaign_sends WHERE claimed_at > ?'),
    claim: p(`UPDATE campaign_sends SET status = 'sending', attempts = attempts + 1, claimed_at = ?, updated_at = ?
      WHERE rowid = (SELECT s.rowid FROM campaign_sends s JOIN campaigns c ON c.id = s.campaign_id
        WHERE c.status = 'sending' AND s.status = 'pending' AND (s.next_try_at IS NULL OR s.next_try_at <= ?)
        ORDER BY s.campaign_id, s.user_id LIMIT 1)
      RETURNING campaign_id, user_id, lang, attempts`),
    hasWork: p(`SELECT 1 FROM campaign_sends s JOIN campaigns c ON c.id = s.campaign_id
      WHERE c.status = 'sending' AND s.status = 'pending' AND (s.next_try_at IS NULL OR s.next_try_at <= ?) LIMIT 1`),
    mark: p('UPDATE campaign_sends SET status = ?, next_try_at = ?, updated_at = ? WHERE campaign_id = ? AND user_id = ? AND status = ?'),
    bump: {
      sent: p('UPDATE campaigns SET sent = sent + 1, updated_at = ? WHERE id = ?'),
      failed: p('UPDATE campaigns SET failed = failed + 1, updated_at = ? WHERE id = ?'),
      skipped: p('UPDATE campaigns SET skipped = skipped + 1, updated_at = ? WHERE id = ?'),
    },
    stale: p(`SELECT campaign_id, user_id FROM campaign_sends WHERE status = 'sending' AND updated_at <= ?`),
    finish: p(`UPDATE campaigns SET status = 'done', finished_at = ?, updated_at = ? WHERE status = 'sending'
      AND NOT EXISTS (SELECT 1 FROM campaign_sends s WHERE s.campaign_id = campaigns.id AND s.status IN ('pending','sending'))`),
    optout: p('INSERT OR IGNORE INTO email_optout (user_id, at) VALUES (?, ?)'),
    optoutOf: p('SELECT at FROM email_optout WHERE user_id = ?'),
    sendsOf: p(`SELECT s.campaign_id, s.status, s.updated_at, c.subject FROM campaign_sends s JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.user_id = ? ORDER BY s.campaign_id DESC LIMIT 500`),
    countSendsOf: p('SELECT COUNT(*) AS n FROM campaign_sends WHERE user_id = ?'),
    purgeSends: p(`DELETE FROM campaign_sends WHERE campaign_id IN (SELECT id FROM campaigns WHERE status <> 'sending' AND finished_at <= ?)`),
    purgeAudit: p('DELETE FROM campaign_audit WHERE at <= ?'),
  }
  st.metaInit.run('last_send')
  const contentCache = new Map()
  const contentOf = (id) => {
    if (contentCache.has(id)) return contentCache.get(id)
    const c = st.campaign.get(id)
    let v = null
    try { v = c ? JSON.parse(c.content) : null } catch { v = null }
    if (contentCache.size > 50) contentCache.clear()
    contentCache.set(id, v)
    return v
  }

  // ── Alıcılar ──
  function audience(rcp, content) {
    let rows, excluded
    if (rcp.mode === 'all') {
      rows = st.allEligible.all()
      const s = st.allStats.get() || {}
      excluded = { unverified: s.unverified || 0, disabled: s.disabled || 0, optedOut: s.opted_out || 0, missing: 0 }
    } else {
      rows = []
      excluded = { unverified: 0, disabled: 0, optedOut: 0, missing: 0 }
      for (const id of rcp.ids) {
        const u = st.userState.get(id)
        if (!u || !u.email) excluded.missing++
        else if (u.email_verified !== 1) excluded.unverified++
        else if (u.disabled) excluded.disabled++
        else if (u.opted) excluded.optedOut++
        else rows.push({ id: u.id, site_lang: u.site_lang })
      }
    }
    const byVersion = {}
    if (content) for (const r of rows) { const l = versionFor(content, r.site_lang); byVersion[l] = (byVersion[l] || 0) + 1 }
    return { rows, count: rows.length, byVersion, excluded }
  }

  const campaignOut = (c) => {
    if (!c) return null
    let content = null
    try { content = JSON.parse(c.content) } catch { /* */ }
    const prog = Object.fromEntries(st.progress.all(c.id).map((r) => [r.status, r.n]))
    return {
      id: c.id, subject: c.subject, status: c.status, createdAt: c.created_at, createdBy: c.created_by_email || null,
      recipientCount: c.recipient_count, sent: c.sent, failed: c.failed, skipped: c.skipped,
      pending: (prog.pending || 0) + (prog.sending || 0), cancelled: prog.cancelled || 0,
      finishedAt: c.finished_at || null, mode: content ? content.mode : null, langs: content ? Object.keys(content.versions) : [],
    }
  }

  // ── Göndəriş planlayıcısı ──
  function claimNext(t) {
    return tx(() => {
      if (!st.hasWork.get(t)) return null
      if (st.hourCount.get(t - HOUR).n >= maxPerHour) return null
      if (!st.gate.run(t, t - gapMs, t + 60e3).changes) return null
      return st.claim.get(t, t, t) || null
    })
  }
  function settle(job, status, t, nextTry = null) {
    tx(() => {
      if (!st.mark.run(status, nextTry, t, job.campaign_id, job.user_id, 'sending').changes) return
      if (st.bump[status]) st.bump[status].run(t, job.campaign_id)
    })
  }
  async function deliver(job) {
    const t = now()
    const content = contentOf(job.campaign_id)
    const u = st.userState.get(job.user_id)
    // Növbədə ikən təsdiq/blok/imtina dəyişibsə — göndərilmir
    if (!content || !content.versions[job.lang] || !u || !u.email || u.email_verified !== 1 || u.disabled || u.opted) return settle(job, 'skipped', t)
    const v = content.versions[job.lang]
    let r = null
    try {
      const m = renderCampaign(job.lang, {
        subject: v.subject, body: v.body, ctaLabel: v.ctaLabel, ctaUrl: v.ctaUrl, header: content.header, origin: publicOrigin,
        unsubUrl: `${publicOrigin}/api/mail/unsubscribe?t=${unsubToken(secretOf(), job.user_id)}&l=${job.lang}`,
      })
      r = await mailer.send({ to: u.email, ...m, kind: 'campaign' })
    } catch (e) { log.error && log.error('campaign mail:', e && e.name) }
    const t2 = now()
    if (r && r.ok) return settle(job, 'sent', t2)
    // E-poçt sönülüdür (açar yoxdur) — təkrar cəhd mənasızdır
    if ((r && r.skipped) || job.attempts >= MAX_ATTEMPTS) return settle(job, 'failed', t2)
    tx(() => { st.mark.run('pending', t2 + 5 * 60e3 * job.attempts, t2, job.campaign_id, job.user_id, 'sending') })
  }
  let busy = false
  async function tick() {
    if (busy || !mailer) return 0
    busy = true
    let n = 0
    try {
      const t = now()
      // Yarımçıq qalmış (proses çöküb) göndərişlər çatdırılmış sayılır — ikiqat məktub olmasın
      for (const s of st.stale.all(t - STALE_MS)) settle(s, 'sent', t)
      st.finish.run(t, t)
      for (;;) {
        const job = claimNext(now())
        if (!job) break
        await deliver(job)
        n++
        if (n >= maxPerTick) break
        if (gapMs) await sleep(gapMs)
      }
      const t3 = now()
      st.finish.run(t3, t3)
    } catch (e) {
      log.error && log.error('campaign tick:', e && e.message)
    } finally { busy = false }
    return n
  }

  // ── HTTP ──
  const router = express.Router()
  const json = express.json({ limit: '64kb' })
  const err = (res, status, code, extra = {}) => res.status(status).json({ error: 'Request failed', code, ...extra })
  const superOnly = (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (!req.adminUser || req.adminUser.via !== 'session') return err(res, 403, 'session_required')
    if (!adminRoleOf || adminRoleOf(req.adminUser.id) !== 'superadmin') return err(res, 403, 'superadmin_required')
    next()
  }
  const guard = [requireAdmin, superOnly]
  // Admin başına saatlıq sayğac (yaddaşda): sınaq məktubu, kampaniya yaratma
  const buckets = new Map()
  const allow = (kind, adminId, max) => {
    const k = `${kind}:${adminId}`, t = now()
    const b = buckets.get(k)
    if (!b || t - b.start >= HOUR) { buckets.set(k, { start: t, n: 1 }); return true }
    if (b.n >= max) return false
    b.n++
    return true
  }
  const bodyOf = (req) => (req.body && typeof req.body === 'object' ? req.body : {})
  const contentOrErr = (res, c) => {
    const v = validContent(c, publicOrigin)
    if (v.error) { err(res, 400, v.error, v.lang ? { lang: v.lang } : {}); return null }
    return v.content
  }
  const render = (content, lang, extra = {}) => {
    const v = content.versions[lang]
    return renderCampaign(lang, { subject: v.subject, body: v.body, ctaLabel: v.ctaLabel, ctaUrl: v.ctaUrl, header: content.header, origin: publicOrigin, ...extra })
  }

  router.post('/admin/mail/preview', ...guard, json, (req, res) => {
    const b = bodyOf(req)
    const content = contentOrErr(res, b.content)
    if (!content) return
    const lang = typeof b.lang === 'string' && content.versions[b.lang] ? b.lang : content.fallback
    const m = render(content, lang, { unsubUrl: `${publicOrigin}/api/mail/unsubscribe?t=preview&l=${lang}` })
    res.json({ lang, subject: m.subject, html: m.html, text: m.text })
  })

  router.post('/admin/mail/test', ...guard, json, async (req, res) => {
    if (!mailer) return err(res, 503, 'mail_disabled')
    const content = contentOrErr(res, bodyOf(req).content)
    if (!content) return
    const to = req.adminUser.email
    if (!to) return err(res, 400, 'no_email')
    if (!allow('test', req.adminUser.id, limits.test)) return err(res, 429, 'rate_limited')
    let sent = 0
    for (const l of Object.keys(content.versions)) {
      const m = render(content, l, { test: true, unsubUrl: `${publicOrigin}/api/mail/unsubscribe?t=test&l=${l}` })
      let r = null
      try { r = await mailer.send({ to, ...m, kind: 'campaign-test' }) } catch { r = null }
      if (r && r.ok) sent++
      else if (r && r.skipped) return err(res, 503, 'mail_disabled')
    }
    st.audit.run(req.adminUser.id, 'test', null, JSON.stringify({ langs: Object.keys(content.versions) }), now())
    if (!sent) return err(res, 502, 'send_failed')
    res.json({ ok: true, sent })
  })

  router.post('/admin/mail/audience', ...guard, json, (req, res) => {
    const b = bodyOf(req)
    const rcp = validRecipients(b.recipients)
    if (!rcp) return err(res, 400, 'bad_recipients')
    let content = null
    if (b.content != null) { content = contentOrErr(res, b.content); if (!content) return }
    const a = audience(rcp, content)
    res.json({ count: a.count, byVersion: a.byVersion, excluded: a.excluded })
  })

  router.get('/admin/mail/campaigns', ...guard, (req, res) => {
    const t = now()
    res.json({
      campaigns: st.list.all().map(campaignOut),
      mailEnabled: Boolean(mailer && mailer.enabled),
      queue: { sentLastHour: st.hourCount.get(t - HOUR).n, maxPerHour, gapMs },
    })
  })

  const idParam = (req) => { const n = Number(req.params.id); return Number.isSafeInteger(n) && n > 0 ? n : null }
  router.get('/admin/mail/campaigns/:id', ...guard, (req, res) => {
    const id = idParam(req)
    const c = id && st.campaign.get(id)
    if (!c) return err(res, 404, 'not_found')
    res.json({ campaign: campaignOut(c) })
  })

  router.post('/admin/mail/campaigns', ...guard, json, (req, res) => {
    // Açar yoxdursa kampaniya yaradılmır (hamısı "alınmadı" olardı); testlər onMessage qarmağı ilə keçir
    if (!mailer || (mailer.enabled === false && !opts.allowDisabledMailer)) return err(res, 503, 'mail_disabled')
    const b = bodyOf(req)
    const content = contentOrErr(res, b.content)
    if (!content) return
    const rcp = validRecipients(b.recipients)
    if (!rcp) return err(res, 400, 'bad_recipients')
    if (!Number.isSafeInteger(b.confirmCount) || b.confirmCount < 1) return err(res, 400, 'confirm_required')
    const requestId = b.requestId == null ? null : (typeof b.requestId === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(b.requestId) ? b.requestId : false)
    if (requestId === false) return err(res, 400, 'bad_request')
    // Eyni sorğu təkrar gəldisə (ikiqat klik, şəbəkə təkrarı) — yeni kampaniya yaradılmır
    if (requestId) { const ex = st.byRequest.get(requestId); if (ex) return res.json({ campaign: campaignOut(st.campaign.get(ex.id)), duplicate: true }) }
    const a = audience(rcp, content)
    if (!a.count) return err(res, 400, 'no_recipients')
    if (a.count !== b.confirmCount) return err(res, 409, 'count_changed', { count: a.count })
    if (!allow('create', req.adminUser.id, limits.create)) return err(res, 429, 'rate_limited')
    const t = now()
    const id = tx(() => {
      const r = st.insCampaign.run(content.versions[content.fallback].subject, JSON.stringify(content), req.adminUser.id, t, a.count, requestId, t)
      const cid = Number(r.lastInsertRowid)
      for (const row of a.rows) st.insSend.run(cid, row.id, versionFor(content, row.site_lang), t)
      st.audit.run(req.adminUser.id, 'create', cid, JSON.stringify({ mode: rcp.mode, count: a.count, langs: Object.keys(content.versions) }), t)
      return cid
    })
    log.info && log.info(`campaign ${id}: queued ${a.count}`)
    res.status(201).json({ campaign: campaignOut(st.campaign.get(id)) })
  })

  router.post('/admin/mail/campaigns/:id/cancel', ...guard, (req, res) => {
    const id = idParam(req)
    const c = id && st.campaign.get(id)
    if (!c) return err(res, 404, 'not_found')
    if (c.status !== 'sending') return err(res, 409, 'not_active')
    const t = now()
    tx(() => {
      if (!st.cancel.run(req.adminUser.id, t, t, id).changes) return
      st.cancelSends.run(t, id)
      st.audit.run(req.adminUser.id, 'cancel', id, '', t)
    })
    res.json({ campaign: campaignOut(st.campaign.get(id)) })
  })

  // ── İmtina (girişsiz; GET — təsdiq səhifəsi, POST — imtina; RFC 8058 bir klik) ──
  const pageLang = (req) => { const l = String((req.query && req.query.l) || (req.body && req.body.l) || ''); return MAIL_LANGS.includes(l) ? l : 'en' }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const page = (l, text, form = '') => `<!doctype html><html lang="${l}" dir="${l === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    '<meta name="robots" content="noindex"><title>Muslims.cc</title></head>' +
    '<body style="margin:0;padding:24px;background:#f6f7f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2a24">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">' +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px">Muslims.cc</p><p style="font-size:15px;line-height:1.6">${esc(text)}</p>${form}` +
    `<p style="margin-top:20px"><a href="${esc(publicOrigin)}${l === 'az' ? '' : '/' + l}/account" style="color:#0f6b4f">muslims.cc/account</a></p></div></body></html>`
  const sendPage = (res, status, html) => res.status(status).set({
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    'X-Content-Type-Options': 'nosniff',
  }).send(html)
  router.get('/mail/unsubscribe', (req, res) => {
    const l = pageLang(req)
    const t = String(req.query.t || '')
    if (!verifyUnsub(secretOf(), t)) return sendPage(res, 400, page(l, PAGE[l].invalid))
    sendPage(res, 200, page(l, PAGE[l].ask,
      `<form method="post" action="/api/mail/unsubscribe"><input type="hidden" name="t" value="${esc(t)}"><input type="hidden" name="l" value="${l}">` +
      `<button type="submit" style="background:#0f6b4f;color:#fff;border:0;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer">${esc(PAGE[l].button)}</button></form>`))
  })
  const form = express.urlencoded({ extended: false, limit: '2kb' })
  router.post('/mail/unsubscribe', form, express.json({ limit: '2kb' }), (req, res) => {
    const l = pageLang(req)
    const t = (req.body && typeof req.body.t === 'string' && req.body.t) || String(req.query.t || '')
    const v = verifyUnsub(secretOf(), t)
    if (!v) return sendPage(res, 400, page(l, PAGE[l].invalid))
    try { st.optout.run(v.userId, now()) } catch { /* hesab silinib (FK) — nəticə eynidir */ }
    if (req.body && req.body['List-Unsubscribe'] === 'One-Click') return res.json({ ok: true })
    sendPage(res, 200, page(l, PAGE[l].done))
  })

  // eslint-disable-next-line no-unused-vars
  router.use(['/admin/mail', '/mail'], (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large')
    if (status === 400) return err(res, 400, 'bad_request')
    log.error && log.error('mail campaigns error:', e && e.message)
    err(res, 500, 'server_error')
  })

  router.tick = tick
  router.idle = () => (busy ? new Promise((r) => { const i = setInterval(() => { if (!busy) { clearInterval(i); r() } }, 5) }) : Promise.resolve())
  router.purge = () => { const t = now(); return st.purgeSends.run(t - 180 * DAY).changes + st.purgeAudit.run(t - 730 * DAY).changes }
  router.exportUser = (uid) => {
    const o = st.optoutOf.get(uid)
    return {
      emailOptOutAt: o ? new Date(o.at).toISOString() : null,
      campaignEmails: st.sendsOf.all(uid).map((r) => ({ campaignId: r.campaign_id, subject: r.subject, status: r.status, at: new Date(r.updated_at).toISOString() })),
    }
  }
  router.summaryUser = (uid) => ({ optedOut: Boolean(st.optoutOf.get(uid)), campaignEmails: st.countSendsOf.get(uid).n })
  router.store = { audience, optout: (uid, t = now()) => st.optout.run(uid, t), claimNext, versionFor }
  return router
}

module.exports = { createMailCampaignsRouter, validContent, validRecipients, versionFor, unsubToken, verifyUnsub, OPTOUT_SCHEMA, SCHEMA, MIN_GAP_MS }
