// ═══════════════════════════════════════════════════════════════════════
// Xoş gəldin məktubu (bir dəfə) + istifadəçinin sayt dili
//
// Cədvəllər (miqrasiyasız, CREATE TABLE IF NOT EXISTS; user_version-a toxunulmur):
//   welcome_sent(user_id PK → users ON DELETE CASCADE, sent_at, lang)  — "göndərilib" qeydi
//   user_prefs(user_id PK → users ON DELETE CASCADE, lang, updated_at)  — saytın aktiv dili
//   welcome_meta(k PK, v)  — 'started_at': funksiyanın ilk işə düşdüyü an (ehtiyat göndərişi üçün)
//
// Axın:
//   • E-poçt təsdiqlənəndə (POST /api/auth/verify, Google ilə yeni hesab) — sorğunun dili saxlanır
//     və məktub həmin dildə göndərilir (users.js → hooks.emailVerified).
//   • Hər girişli açılışda klient GET /api/auth/me?lang=<sayt dili> göndərir — dil dəyişibsə yazılır
//     (users.js → hooks.seenLang). Təsdiqlənmiş, məktub almamış hesab (köhnə istifadəçilər) məktubu
//     ilk dəfə dili məlum olanda, HƏMİN dildə alır.
//   • Dili heç vaxt məlum olmayanlar: server/scripts/send-welcome.js --fallback-after-days 7 —
//     ikidilli (en + ar) variant.
// Göndəriş: əvvəl sətir "tutulur" (INSERT OR IGNORE — iki proses/sorğu eyni anda göndərməsin),
// alınmasa sətir silinir və istifadəçi 1 saat soyuma alır. Növbə: məktublar arası ≥ GAP_MS,
// saatda ən çox MAX_PER_HOUR avtomatik məktub. Heç vaxt xəta atmır və cavabı gözlətmir.
// Logda ünvan YOXDUR. IP saxlanmır.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
// Saytın 50 dili (server/analytics.js ilə eyni siyahı)
const SITE_LANGS = ['az', 'en', 'ru', 'ar', 'tr', 'id', 'ur', 'bn', 'fa', 'ms', 'fr', 'de', 'es', 'pt', 'hi', 'uz', 'sw', 'ha', 'so', 'ps', 'bs', 'sq', 'it', 'nl', 'zh',
  'ta', 'ml', 'te', 'kn', 'gu', 'pa', 'as', 'am', 'om', 'yo', 'ff', 'rw', 'ku', 'ky', 'tg', 'ug', 'th', 'vi', 'tl', 'km', 'ja', 'sv', 'ro', 'sr', 'si']
const HOUR = 3600e3
const DAY = 86400e3

/** Sayt dilini yoxla: 50 dildən biri, yoxsa null */
const siteLang = (l) => (typeof l === 'string' && SITE_LANGS.includes(l) ? l : null)
/** Məktub dili: 5 əsas dil; 44 əlavə dil → en (server/mailer.js kimi) */
const mailLangOf = (l) => (MAIL_LANGS.includes(l) ? l : 'en')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS welcome_sent (
  user_id  INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sent_at  INTEGER NOT NULL,
  lang     TEXT
);
CREATE TABLE IF NOT EXISTS user_prefs (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lang        TEXT,
  updated_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS welcome_meta (
  k  TEXT PRIMARY KEY,
  v  TEXT NOT NULL
);`

function createWelcomeStore(wrapped, { now = () => Date.now() } = {}) {
  const db = wrapped.raw || wrapped
  db.exec(SCHEMA)
  const p = (sql) => db.prepare(sql)
  const st = {
    metaGet: p('SELECT v FROM welcome_meta WHERE k = ?'),
    metaInit: p('INSERT OR IGNORE INTO welcome_meta (k, v) VALUES (?, ?)'),
    metaSet: p('INSERT INTO welcome_meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v'),
    claim: p('INSERT OR IGNORE INTO welcome_sent (user_id, sent_at, lang) VALUES (?, ?, ?)'),
    unclaim: p('DELETE FROM welcome_sent WHERE user_id = ?'),
    sent: p('SELECT sent_at, lang FROM welcome_sent WHERE user_id = ?'),
    langGet: p('SELECT lang, updated_at FROM user_prefs WHERE user_id = ?'),
    langSet: p(`INSERT INTO user_prefs (user_id, lang, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET lang = excluded.lang, updated_at = excluded.updated_at`),
    user: p('SELECT id, email, email_verified, display_name, disabled FROM users WHERE id = ?'),
    // Hələ məktub almamış, təsdiqlənmiş, bağlanmamış hesablar (+ saxlanmış dil)
    pending: p(`SELECT u.id, u.email, u.display_name, u.created_at, up.lang AS lang FROM users u
      LEFT JOIN welcome_sent w ON w.user_id = u.id
      LEFT JOIN user_prefs up ON up.user_id = u.id
      WHERE w.user_id IS NULL AND u.email_verified = 1 AND u.disabled = 0 AND u.email IS NOT NULL AND u.email <> ''
      ORDER BY u.id`),
  }
  st.metaInit.run('started_at', String(now()))
  return {
    startedAt: () => Number((st.metaGet.get('started_at') || {}).v) || 0,
    // Avtomatik göndəriş açarı — sahib sınaq məktubunu təsdiqləyənə qədər SÖNÜK
    // (skript: --enable-auto / --disable-auto). Testlər opts.autoEnabled ilə keçir.
    autoEnabled: () => (st.metaGet.get('auto') || {}).v === '1',
    setAuto: (on) => { st.metaSet.run('auto', on ? '1' : '0') },
    claim: (uid, lang, t = now()) => st.claim.run(uid, t, lang).changes > 0,
    unclaim: (uid) => { st.unclaim.run(uid) },
    sentOf: (uid) => st.sent.get(uid) || null,
    langOf: (uid) => { const r = st.langGet.get(uid); return r ? r.lang : null },
    prefsOf: (uid) => st.langGet.get(uid) || null,
    /** true — dəyişdi (yazıldı) */
    setLang(uid, lang, t = now()) {
      const l = siteLang(lang)
      if (!l) return false
      const cur = st.langGet.get(uid)
      if (cur && cur.lang === l) return false
      st.langSet.run(uid, l, t)
      return true
    },
    user: (uid) => st.user.get(uid) || null,
    pending: () => st.pending.all(),
  }
}

/**
 * opts: { db, mailer, publicOrigin?, now?, log?, gapMs?, maxPerHour?, sleep? }
 * Qaytarır: { store, onVerified(uid, lang), onSeenLang(uid, lang), sendNow(user, lang), idle(), exportUser, summaryUser }
 */
function createWelcome(opts) {
  const { db, mailer = null, publicOrigin = 'https://muslims.cc', now = () => Date.now(), log = console } = opts
  const gapMs = opts.gapMs != null ? opts.gapMs : 700
  const maxPerHour = opts.maxPerHour || 120
  const sleep = opts.sleep || ((ms) => new Promise((r) => { const h = setTimeout(r, ms); if (h.unref) h.unref() }))
  const store = opts.store || createWelcomeStore(db, { now })
  const cooldown = new Map()      // uid → bu ana qədər yenidən cəhd yoxdur (yaddaşda)
  let hourStart = 0, hourCount = 0
  let chain = Promise.resolve()

  /** Birbaşa göndər (skript və növbə üçün). Sətri tutur; alınmasa geri qaytarır. → { ok, skipped? , reason? } */
  async function sendNow(user, lang, { record = true } = {}) {
    if (!mailer || !user || !user.email) return { ok: false, reason: 'no_mailer' }
    const ml = lang === 'bi' ? 'bi' : mailLangOf(lang)
    if (record && !store.claim(user.id, ml)) return { ok: false, reason: 'already_sent' }
    let r
    try {
      r = await mailer.sendTemplate('welcome', ml, user.email, { name: user.display_name || '', origin: publicOrigin })
    } catch { r = { ok: false } }
    if (!r || !r.ok) {
      if (record) store.unclaim(user.id)
      return { ok: false, reason: r && r.skipped ? 'mail_disabled' : 'send_failed' }
    }
    return { ok: true }
  }

  /** Avtomatik göndəriş — növbəyə qoyulur, cavab gözlənmir. */
  function maybeSend(uid, lang) {
    if (!mailer || !lang) return false
    if (!(opts.autoEnabled != null ? opts.autoEnabled : store.autoEnabled())) return false
    const t = now()
    if ((cooldown.get(uid) || 0) > t) return false
    if (store.sentOf(uid)) return false
    const u = store.user(uid)
    if (!u || u.disabled || u.email_verified !== 1 || !u.email) return false
    if (t - hourStart >= HOUR) { hourStart = t; hourCount = 0 }
    if (hourCount >= maxPerHour) return false              // növbəti açılışda yenidən cəhd olunacaq
    const ml = mailLangOf(lang)
    hourCount++
    cooldown.set(uid, t + HOUR)                             // növbədə olarkən təkrar növbəyə düşməsin
    // (iki proses eyni anda növbəyə qoysa da sendNow-dakı INSERT OR IGNORE yalnız birini buraxır)
    chain = chain.then(async () => {
      const r = await sendNow(u, ml)
      if (r.ok) cooldown.delete(uid)
      else if (r.reason !== 'already_sent') log.warn && log.warn(`welcome: ${r.reason}`)
      if (gapMs) await sleep(gapMs)
    }).catch(() => {})
    if (cooldown.size > 5000) { for (const [k, v] of cooldown) if (v <= t) cooldown.delete(k) }
    return true
  }

  return {
    store,
    sendNow,
    /** E-poçt təsdiqləndi (və ya Google ilə hazır təsdiqli hesab): dili saxla, məktubu həmin dildə göndər */
    onVerified(uid, lang) {
      try {
        const l = siteLang(lang)
        if (l) store.setLang(uid, l)
        maybeSend(uid, l || store.langOf(uid))
      } catch (e) { log.error && log.error('welcome verify:', e && e.message) }
    },
    /** Girişli açılış: dil dəyişibsə yaz; təsdiqli, məktub almamış hesaba saxlanmış dildə göndər */
    onSeenLang(uid, lang) {
      try {
        const l = siteLang(lang)
        if (!l) return
        store.setLang(uid, l)
        maybeSend(uid, store.langOf(uid))
      } catch (e) { log.error && log.error('welcome lang:', e && e.message) }
    },
    /** Testlər: növbədəki göndərişlər bitsin */
    idle: () => chain,
    exportUser(uid) {
      const s = store.sentOf(uid)
      const pr = store.prefsOf(uid)
      return { siteLanguage: pr ? pr.lang : null, siteLanguageUpdatedAt: pr ? new Date(pr.updated_at).toISOString() : null, welcomeEmailSentAt: s ? new Date(s.sent_at).toISOString() : null }
    },
    summaryUser(uid) { return { siteLanguage: store.langOf(uid), welcomeEmailSent: Boolean(store.sentOf(uid)) } },
  }
}

module.exports = { createWelcome, createWelcomeStore, siteLang, mailLangOf, SITE_LANGS, DAY, SCHEMA }
