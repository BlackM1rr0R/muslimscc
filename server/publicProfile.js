// ═══════════════════════════════════════════════════════════════════════
// K1. Könüllü açıq profil — /u/<handle> (docs/USER-ACCOUNTS.md → "K mərhələsi")
//
// • SUSMAYA GÖRƏ GİZLİDİR: sətir yalnız istifadəçi "Açıq profil"i açıb razılıq verəndə (consent: true)
//   yaranır. Hesabın qalan məlumatı uçdan-uca şifrəlidir — server onu oxuya bilmir; ona görə göstəriləcək
//   rəqəmləri və mətnləri KLİENT açıq şəkildə göndərir (ağ siyahı: FIELDS) və yalnız SEÇİLMİŞ sahələr saxlanır.
// • İzləyici sayı, müqayisə, reytinq YOXDUR. Səhifə susmaya görə noindex; istifadəçi ayrıca "axtarış
//   sistemlərinə icazə ver" seçə bilər (allowIndex).
// • Ləqəb (handle): [a-z0-9_]{3,24}, unikal, ehtiyat sözlər bağlıdır. Profil silinəndə ləqəb boşalır.
// • Mətnlər (ad, künyə, bio ≤160) düz mətndir; keçidlər SİLİNİR (communityKit.stripLinks).
// • Şikayət (girişli, TƏSDİQLİ e-poçt): profil moderasiya növbəsinə düşür (admin paneli, editor+): "rədd et" /
//   "gizlət" (gizlədəndə profil bağlanır və mətn sahələri silinir; istifadəçi moderatedAt görür). Gizlədilmiş
//   profili sahib YENİDƏN AÇA BİLMİR (409 moderated) — profili silib təzədən yaratsa belə (public_profile_blocks:
//   yalnız "moderasiya olunub" vaxtı, mətn yox). Yalnız editor "unhide" ilə qaldırır.
// • Açıq profili açmaq (enabled:true) və şikayət — təsdiqlənmiş e-poçt (403 verify_email).
// • İbadət sayları göstərilmir (sahibin qərarı, 2026-11-18): xətm sayları və ibadət möhürləri (Fəcr 40,
//   zikr 1000, Kəhf …) nə yazılır, nə də köhnə sətirlərdən oxunur — yalnız ad, künyə, bio, sevimli surə və
//   ÖYRƏNMƏ möhürləri. Köhnə klientin göndərdiyi bu sahələr səssizcə atılır (400 yox).
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır); users(id) ON DELETE CASCADE.
//
// Endpoint-lər:
//   GET    /api/profile/public              (girişli) → { profile | null, limits }
//   PUT    /api/profile/public              (girişli) { consent?, handle, enabled, allowIndex, fields, data } → { profile }
//   DELETE /api/profile/public              (girişli) → { ok } (ləqəb boşalır)
//   GET    /api/profile/handle?h=           (girişli) → { available, reason? }
//   GET    /api/u/:handle                   (girişsiz) → { handle, fields, data, allowIndex } | 404
//   POST   /api/u/:handle/report            (girişli) { reason } → 202
//   GET    /api/admin/moderation/profiles   (panel, editor+) → { items }
//   GET    /api/admin/moderation/profiles?status=hidden — gizlədilmiş profillər (unhide üçün)
//   POST   /api/admin/moderation/profiles/:handle { action: 'dismiss'|'hide'|'unhide' } → { ok }
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const kit = require('./communityKit')

const HANDLE_RE = /^[a-z0-9_]{3,24}$/
// Ehtiyat sözlər: sayt bölmələri, rəsmi görünən adlar, sistem sözləri
const RESERVED = new Set([
  'admin', 'administrator', 'root', 'system', 'support', 'help', 'about', 'contact', 'team', 'staff', 'official',
  'moderator', 'mod', 'mods', 'editor', 'superadmin', 'owner', 'security', 'abuse', 'privacy', 'terms', 'legal',
  'api', 'www', 'mail', 'email', 'account', 'accounts', 'login', 'logout', 'signup', 'register', 'settings', 'profile',
  'profiles', 'user', 'users', 'me', 'you', 'null', 'undefined', 'anonymous', 'guest', 'test', 'muslims', 'muslimscc',
  'muslims_cc', 'muslim', 'islam', 'allah', 'rasulullah', 'prophet', 'quran', 'hadith', 'imam', 'mosque', 'masjid',
  'dua', 'dua_wall', 'duawall', 'family', 'together', 'khatm', 'ummah', 'news', 'blog', 'static', 'assets', 'cdn',
])
const FIELDS = ['displayName', 'kunya', 'stamps', 'bio', 'favSurah']
// Köhnə klientlər (keşlənmiş bundle) bunları göndərə bilər — qəbul olunur, amma SAXLANMIR
const LEGACY_FIELDS = ['khatms', 'ummahKhatms']
// Yalnız ÖYRƏNMƏ möhürləri (src/utils/passport.js → STAMP_IDS-in alt çoxluğu)
const STAMP_IDS = ['names_99', 'hijra', 'sahaba', 'arabic', 'hifz_surah']
// İbadət möhürləri — göstərilmir (riya olmasın); köhnə klientdən gəlsə atılır
const LEGACY_STAMPS = ['khatm', 'fajr_40', 'dhikr_1000', 'kahf_4', 'ummah_khatm']
const REPORT_REASONS = ['spam', 'offensive', 'impersonation', 'personal_info', 'other']
const MAX_BIO = 160
const MAX_NAME = 60
const MAX_KUNYA = 40
const MAX_REPORTS_PER_DAY = 20
const DAY = 86400000

const SCHEMA = `
CREATE TABLE IF NOT EXISTS public_profiles (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  handle       TEXT NOT NULL UNIQUE,
  enabled      INTEGER NOT NULL DEFAULT 0,
  allow_index  INTEGER NOT NULL DEFAULT 0,
  fields       TEXT NOT NULL DEFAULT '[]',
  data         TEXT NOT NULL DEFAULT '{}',
  consent_at   INTEGER NOT NULL,
  moderated_at INTEGER,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS public_profile_reports (
  profile_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  PRIMARY KEY (profile_user_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS public_profile_reports_by_reporter ON public_profile_reports(reporter_id, created_at);
CREATE TABLE IF NOT EXISTS public_profile_blocks (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  moderated_at INTEGER NOT NULL
);
`

const parse = (s, fb) => { try { return JSON.parse(s) } catch { return fb } }
const normHandle = (h) => (typeof h === 'string' ? h.trim().toLowerCase() : '')
/** null — yararlıdır; yoxsa səbəb kodu */
function handleProblem(h) {
  if (!HANDLE_RE.test(h)) return 'bad_handle'
  if (RESERVED.has(h) || /^_|_$|__/.test(h) || /^\d+$/.test(h)) return 'reserved'
  return null
}

/** Gövdə → { fields, data } | { error }. Yalnız seçilmiş sahələr saxlanır; mətnlərdən keçidlər silinir. */
function validProfile(b) {
  if (!b || !Array.isArray(b.fields) || b.fields.length > FIELDS.length + LEGACY_FIELDS.length) return { error: 'bad_request' }
  const all = [...new Set(b.fields)]
  if (all.some((f) => !FIELDS.includes(f) && !LEGACY_FIELDS.includes(f))) return { error: 'bad_request' }
  const fields = all.filter((f) => FIELDS.includes(f))
  const src = b.data && typeof b.data === 'object' && !Array.isArray(b.data) ? b.data : {}
  const data = {}
  const text = (v, max, line = true) => {
    const s = line ? kit.cleanLine(v, max * 2) : kit.cleanText(v, max * 2)
    if (s == null) return null
    const t = kit.stripLinks(s)
    return [...t].length <= max ? t : null
  }
  for (const f of fields) {
    const v = src[f]
    if (f === 'displayName' || f === 'kunya' || f === 'bio') {
      const t = text(v, f === 'bio' ? MAX_BIO : f === 'kunya' ? MAX_KUNYA : MAX_NAME)
      if (t == null) return { error: 'bad_request' }
      if (!t) continue
      data[f] = t
    } else if (f === 'stamps') {
      const ok = (x) => STAMP_IDS.includes(x) || LEGACY_STAMPS.includes(x)
      if (!Array.isArray(v) || v.length > STAMP_IDS.length + LEGACY_STAMPS.length || !v.every(ok)) return { error: 'bad_request' }
      data.stamps = STAMP_IDS.filter((x) => v.includes(x))
    } else if (f === 'favSurah') {
      if (!Number.isInteger(v) || v < 1 || v > 114) return { error: 'bad_request' }
      data.favSurah = v
    }
  }
  return { fields: fields.filter((f) => f in data), data }
}

/** Saxlanmış sətir → yalnız icazəli sahələr (köhnə sətirlərdəki xətm sayları / ibadət möhürləri OXUNMUR) */
function cleanStored(fieldsJson, dataJson) {
  const f0 = parse(fieldsJson, [])
  const d0 = parse(dataJson, {})
  const src = d0 && typeof d0 === 'object' && !Array.isArray(d0) ? d0 : {}
  const data = {}
  for (const k of ['displayName', 'kunya', 'bio']) if (typeof src[k] === 'string' && src[k]) data[k] = src[k]
  if (Array.isArray(src.stamps)) data.stamps = STAMP_IDS.filter((x) => src.stamps.includes(x))
  if (Number.isInteger(src.favSurah) && src.favSurah >= 1 && src.favSurah <= 114) data.favSurah = src.favSurah
  const fields = (Array.isArray(f0) ? f0 : []).filter((f, i, a) => FIELDS.includes(f) && f in data && a.indexOf(f) === i)
  for (const k of Object.keys(data)) if (!fields.includes(k)) delete data[k]
  return { fields, data }
}

function createPublicProfileStore(db) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    get: p('SELECT * FROM public_profiles WHERE user_id = ?'),
    byHandle: p('SELECT * FROM public_profiles WHERE handle = ?'),
    insert: p(`INSERT INTO public_profiles (user_id, handle, enabled, allow_index, fields, data, consent_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    update: p('UPDATE public_profiles SET handle = ?, enabled = ?, allow_index = ?, fields = ?, data = ?, updated_at = ? WHERE user_id = ?'),
    del: p('DELETE FROM public_profiles WHERE user_id = ?'),
    report: p('INSERT OR IGNORE INTO public_profile_reports (profile_user_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?)'),
    reportsToday: p('SELECT COUNT(*) AS n FROM public_profile_reports WHERE reporter_id = ? AND created_at > ?'),
    reportsOf: p('SELECT reason, created_at FROM public_profile_reports WHERE profile_user_id = ? ORDER BY created_at DESC LIMIT 50'),
    reportsBy: p(`SELECT r.reason, r.created_at, p.handle FROM public_profile_reports r LEFT JOIN public_profiles p ON p.user_id = r.profile_user_id
      WHERE r.reporter_id = ? ORDER BY r.created_at DESC`),
    queue: p(`SELECT p.*, COUNT(r.reporter_id) AS n, MAX(r.created_at) AS last_at FROM public_profiles p
      JOIN public_profile_reports r ON r.profile_user_id = p.user_id GROUP BY p.user_id ORDER BY last_at DESC LIMIT 100`),
    clearReports: p('DELETE FROM public_profile_reports WHERE profile_user_id = ?'),
    hide: p("UPDATE public_profiles SET enabled = 0, allow_index = 0, fields = ?, data = ?, moderated_at = ?, updated_at = ? WHERE user_id = ?"),
    purgeReports: p('DELETE FROM public_profile_reports WHERE created_at <= ?'),
    // Gizlədilmiş: sətirdə moderated_at və ya (silinib təzədən yaradılıbsa) public_profile_blocks
    hidden: p(`SELECT p.*, COALESCE(p.moderated_at, b.moderated_at) AS mod_at FROM public_profiles p
      LEFT JOIN public_profile_blocks b ON b.user_id = p.user_id WHERE p.moderated_at IS NOT NULL OR b.user_id IS NOT NULL
      ORDER BY mod_at DESC LIMIT 100`),
    unhide: p('UPDATE public_profiles SET moderated_at = NULL, updated_at = ? WHERE user_id = ?'),
    block: p(`INSERT INTO public_profile_blocks (user_id, moderated_at) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET moderated_at = excluded.moderated_at`),
    blockOf: p('SELECT moderated_at FROM public_profile_blocks WHERE user_id = ?'),
    unblock: p('DELETE FROM public_profile_blocks WHERE user_id = ?'),
  }
  return { st, tx }
}

const profileOut = (r, blockedAt = null) => (r ? {
  handle: r.handle, enabled: r.enabled === 1, allowIndex: r.allow_index === 1, ...cleanStored(r.fields, r.data),
  consentAt: r.consent_at, moderatedAt: r.moderated_at || blockedAt || null, updatedAt: r.updated_at,
} : null)
const publicOut = (r) => ({ handle: r.handle, ...cleanStored(r.fields, r.data), allowIndex: r.allow_index === 1 })

/**
 * opts: { db, requireUser, requireEditor?, now? }
 */
function createPublicProfileRouter({ db, store: givenStore, requireUser, requireEditor = null, now = () => Date.now() }) {
  const store = givenStore || createPublicProfileStore(db)
  const { st, tx } = store
  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const limits = { fields: FIELDS, stamps: STAMP_IDS, bio: MAX_BIO, name: MAX_NAME, kunya: MAX_KUNYA, reasons: REPORT_REASONS }

  router.use(['/profile', '/u'], (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  /** Moderator gizlədibsə — vaxtı (profil silinib təzədən yaradılsa da qalır) */
  const moderatedAt = (uid, cur) => (cur && cur.moderated_at) || (st.blockOf.get(uid) || {}).moderated_at || null
  const mineOut = (uid) => profileOut(st.get.get(uid), moderatedAt(uid, null))

  router.get('/profile/public', auth, (req, res) => res.json({ profile: mineOut(req.user.id), limits }))

  router.get('/profile/handle', auth, (req, res) => {
    const h = normHandle(String(req.query.h || ''))
    const why = handleProblem(h)
    if (why) return res.json({ available: false, reason: why })
    const row = st.byHandle.get(h)
    res.json({ available: !row || row.user_id === req.user.id, reason: row && row.user_id !== req.user.id ? 'taken' : undefined })
  })

  router.put('/profile/public', auth, json, (req, res) => {
    const uid = req.user.id
    const b = req.body || {}
    const cur = st.get.get(uid)
    if (!cur && b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    const handle = normHandle(b.handle)
    const why = handleProblem(handle)
    if (why) return err(res, 400, why, 'Invalid handle')
    if (typeof b.enabled !== 'boolean' || (b.allowIndex != null && typeof b.allowIndex !== 'boolean')) return err(res, 400, 'bad_request', 'Bad request')
    // Moderator gizlədib: sahib yenidən aça / indeksə verə bilməz (yalnız editor "unhide")
    if ((b.enabled || b.allowIndex === true) && moderatedAt(uid, cur)) return err(res, 409, 'moderated', 'Hidden by a moderator')
    if (b.enabled && !kit.isVerified(req.user)) return err(res, 403, 'verify_email', 'Email not verified')
    const v = validProfile(b)
    if (v.error) return err(res, 400, v.error, 'Invalid profile')
    const t = now()
    const r = tx(() => {
      const other = st.byHandle.get(handle)
      if (other && other.user_id !== uid) return 'taken'
      const args = [handle, b.enabled ? 1 : 0, b.enabled && b.allowIndex ? 1 : 0, JSON.stringify(v.fields), JSON.stringify(v.data)]
      if (cur) st.update.run(...args, t, uid)
      else st.insert.run(uid, ...args, t, t, t)
      return 'ok'
    })
    if (r === 'taken') return err(res, 409, 'handle_taken', 'Handle is taken')
    res.json({ profile: mineOut(uid) })
  })

  router.delete('/profile/public', auth, (req, res) => {
    st.del.run(req.user.id)
    res.json({ ok: true })
  })

  // ── İctimai görünüş: naməlum, bağlı (enabled=0) və ya bloklanmış hesab — eyni 404 ──
  const visible = (handle) => {
    const h = normHandle(handle)
    if (!HANDLE_RE.test(h)) return null
    const row = st.byHandle.get(h)
    if (!row || row.enabled !== 1) return null
    const u = (db.raw || db).prepare('SELECT disabled FROM users WHERE id = ?').get(row.user_id)
    return u && !u.disabled ? row : null
  }
  router.get('/u/:handle', (req, res) => {
    const row = visible(req.params.handle)
    if (!row) return err(res, 404, 'not_found', 'Not found')
    if (row.allow_index !== 1) res.set('X-Robots-Tag', 'noindex')
    res.json(publicOut(row))
  })

  router.post('/u/:handle/report', auth, kit.requireVerified, json, (req, res) => {
    const row = visible(req.params.handle)
    if (!row) return err(res, 404, 'not_found', 'Not found')
    if (row.user_id === req.user.id) return err(res, 400, 'own', 'Cannot report yourself')
    const reason = (req.body || {}).reason
    if (!REPORT_REASONS.includes(reason)) return err(res, 400, 'bad_reason', 'Unknown reason')
    const t = now()
    if (st.reportsToday.get(req.user.id, t - DAY).n >= MAX_REPORTS_PER_DAY) return err(res, 429, 'rate_limited', 'Too many reports today')
    const added = st.report.run(row.user_id, req.user.id, reason, t).changes > 0
    res.status(202).json({ ok: true, already: !added })
  })

  // ── Moderasiya (admin paneli, editor+): yalnız profilin ictimai məzmunu — e-poçt / hesab id-si YOX ──
  if (requireEditor) {
    router.get('/admin/moderation/profiles', ...requireEditor, (req, res) => {
      if (req.query.status === 'hidden') {
        return res.json({ status: 'hidden', items: st.hidden.all().map((r) => ({
          handle: r.handle, enabled: r.enabled === 1, ...cleanStored(r.fields, r.data), moderatedAt: r.mod_at, reports: [], count: 0,
        })) })
      }
      res.json({ items: st.queue.all().map((r) => ({
        handle: r.handle, enabled: r.enabled === 1, ...cleanStored(r.fields, r.data), moderatedAt: r.moderated_at || null,
        reports: st.reportsOf.all(r.user_id).map((x) => ({ reason: x.reason, at: x.created_at })), count: r.n, lastAt: r.last_at,
      })) })
    })
    router.post('/admin/moderation/profiles/:handle', ...requireEditor, json, (req, res) => {
      const row = st.byHandle.get(normHandle(req.params.handle))
      if (!row) return err(res, 404, 'not_found', 'Not found')
      const action = (req.body || {}).action
      if (action !== 'dismiss' && action !== 'hide' && action !== 'unhide') return err(res, 400, 'bad_request', 'Unknown action')
      const t = now()
      tx(() => {
        if (action === 'hide') {
          // Mətn sahələri silinir (zərərli mətn qalmasın), möhürlər / surə qalır; profil bağlanır
          const kept = cleanStored(row.fields, row.data)
          for (const k of ['displayName', 'kunya', 'bio']) delete kept.data[k]
          const fields = kept.fields.filter((f) => f in kept.data)
          st.hide.run(JSON.stringify(fields), JSON.stringify(kept.data), t, t, row.user_id)
          st.block.run(row.user_id, t)
        } else if (action === 'unhide') {
          // Moderasiya qaldırılır — profil AÇILMIR, sahib özü yenidən aça bilər
          st.unhide.run(t, row.user_id)
          st.unblock.run(row.user_id)
        }
        st.clearReports.run(row.user_id)
      })
      res.json({ ok: true })
    })
  }

  // eslint-disable-next-line no-unused-vars
  router.use(['/profile', '/u'], (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('public profile error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** 180 gündən köhnə (baxılmamış) şikayətlər */
  router.purge = () => st.purgeReports.run(now() - 180 * DAY).changes
  /** "Mənim məlumatlarım": öz profiliniz + etdiyiniz şikayətlər (kimin şikayət etdiyi heç kimə göstərilmir) */
  router.exportUser = (uid) => ({
    profile: mineOut(uid),
    moderatedAt: moderatedAt(uid, null),
    reportsMade: st.reportsBy.all(uid).map((r) => ({ handle: r.handle || null, reason: r.reason, at: r.created_at })),
  })
  router.summaryUser = (uid) => {
    const p = st.get.get(uid)
    return { exists: Boolean(p), enabled: Boolean(p && p.enabled === 1), handle: p ? p.handle : null }
  }
  router.store = store
  return router
}

module.exports = {
  createPublicProfileRouter, createPublicProfileStore, validProfile, handleProblem, normHandle,
  cleanStored, FIELDS, STAMP_IDS, LEGACY_FIELDS, LEGACY_STAMPS, RESERVED, REPORT_REASONS, HANDLE_RE, MAX_BIO,
}
