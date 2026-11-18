// ═══════════════════════════════════════════════════════════════════════
// Hesab təhlükəsizliyi (docs/ACCOUNT-SECURITY.md) — users.js və auth.js bunu çağırır
//
// • Yeni cihazdan giriş xəbərdarlığı: uzunömürlü cihaz cookie-si __Host-mcc_dev
//   (HttpOnly; Secure; SameSite=Lax; 2 il) + "Brauzer · Sistem" etiketi → SHA-256.
//   Hesabın ilk qeydə alınan cihazı (və bu funksiyadan əvvəlki hesablar) səssiz yazılır.
//   Məktub: vaxt (personal_prefs.tz, yoxdursa UTC), cihaz etiketi, ölkə (YALNIZ Cloudflare
//   CF-IPCountry başlığından — xarici geo-IP xidməti yoxdur), "Bu mən deyildim" düyməsi.
// • "Bu mən deyildim": təsadüfi 32 bayt token (DB-də SHA-256), 7 gün, birdəfəlik.
//   GET /api/security/not-me — yalnız təsdiq səhifəsi (poçt skanerləri heç nəyi dəyişmir);
//   POST — bütün sessiyalar ləğv, şifrə bərpası məktubu, hesab "security hold" (şifrə və
//   Google ilə giriş bağlıdır; passkey açıqdır) — şifrə bərpası və ya passkey ilə girib
//   "hər şey qaydasındadır" təsdiqi ilə açılır. Passkey-lər SİLİNMİR, səhifədə siyahısı göstərilir.
// • Təhlükəsizlik hadisələri (user_security_events): giriş, şifrə, 2FA, passkey dəyişiklikləri —
//   90 gün saxlanır (istifadəçi başına ən çox 200). IP saxlanmır.
// • TOTP (RFC 6238, node:crypto): HMAC-SHA1, 30 s, 6 rəqəm, ±1 addım, təkrar istifadə qadağası
//   (son istifadə olunan addım yadda saxlanır). Sirr 20 bayt, AES-256-GCM ilə şifrəli saxlanır:
//   açar env TOTP_KEY (32 bayt base64) və ya bazada bir dəfə yaradılan təsadüfi açar
//   (security_secret). Hər iki açar "açar halqası"ndadır (kid) — env sonradan qoyulsa köhnə sirlər
//   oxunur və uğurlu istifadədə yeni açarla yenidən şifrələnir. 10 birdəfəlik ehtiyat kodu (HMAC).
//   Giriş biletləri (şifrədən/Google-dan sonra) yaddaşdadır: 5 dəq, bilet başına 5 cəhd.
//   Passkey ilə giriş TOTP-ni keçir (passkey özü iki faktorludur: cihaz + biometrik/PIN).
// • Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır) — köhnə kod bu
//   cədvəllərə toxunmur, geri qaytarma pozulmur (2026-11-04 dərsi). users/admins ON DELETE CASCADE.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const auth = require('./auth')

const DEVICE_COOKIE = '__Host-mcc_dev'
const DEVICE_TTL_S = 2 * 365 * 24 * 3600
const EVENT_KEEP_MS = 90 * 24 * 3600 * 1000
const MAX_EVENTS = 200
const MAX_DEVICES = 50
const NOT_ME_TTL_MS = 7 * 24 * 3600 * 1000
const TICKET_TTL_MS = 5 * 60 * 1000
const TICKET_ATTEMPTS = 5
const BACKUP_CODES = 10
const TOTP_STEP = 30
const TOTP_DIGITS = 6
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const SCOPES = ['user', 'admin']
const EVENT_KINDS = [
  'sign_in', 'sign_in_new', 'password_changed', 'password_reset', 'twofa_enabled', 'twofa_disabled',
  'backup_codes_new', 'backup_code_used', 'twofa_failed', 'passkey_added', 'passkey_removed', 'not_me', 'hold_released',
]
// Bu hadisələrdə istifadəçiyə məktub gedir (giriş — yalnız yeni cihazdan)
const ALERT_KINDS = new Set(['sign_in_new', 'password_changed', 'password_reset', 'twofa_enabled', 'twofa_disabled', 'backup_codes_new', 'passkey_added', 'passkey_removed'])

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
const mailLang = (l) => (MAIL_LANGS.includes(l) ? l : 'en')
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

// ─── Base32 (RFC 4648, dolğusuz) ──────────────────────────────────────
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function base32Encode(buf) {
  let bits = 0, value = 0, out = ''
  for (const byte of Buffer.from(buf)) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}
function base32Decode(str) {
  const s = String(str || '').toUpperCase().replace(/[\s=-]/g, '')
  if (!/^[A-Z2-7]*$/.test(s)) return null
  let bits = 0, value = 0
  const out = []
  for (const ch of s) {
    value = (value << 5) | B32.indexOf(ch)
    bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(out)
}

// ─── HOTP / TOTP (RFC 4226 / RFC 6238) ────────────────────────────────
function hotp(key, counter, digits = TOTP_DIGITS, algo = 'sha1') {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = crypto.createHmac(algo, key).update(msg).digest()
  const off = h[h.length - 1] & 0x0f
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  return String(bin % 10 ** digits).padStart(digits, '0')
}
const totpStep = (ms) => Math.floor(ms / 1000 / TOTP_STEP)
const totp = (key, ms, { digits = TOTP_DIGITS, algo = 'sha1' } = {}) => hotp(key, totpStep(ms), digits, algo)
/** Kod yoxlaması: ±window addım; lastStep-dən köhnə/eyni addım qəbul olunmur. → uyğun addım | null */
function verifyTotp(key, code, ms, { window = 1, lastStep = -1 } = {}) {
  const c = String(code == null ? '' : code).replace(/\s+/g, '')
  if (!/^\d{6}$/.test(c)) return null
  const now = totpStep(ms)
  let hit = null
  for (let d = -window; d <= window; d++) {
    const s = now + d
    if (s <= lastStep || s < 0) continue
    if (safeEq(hotp(key, s), c) && hit === null) hit = s   // hamısı yoxlanır — vaxt fərqi olmasın
  }
  return hit
}
function otpauthUri({ secret, account, issuer = 'Muslims.cc' }) {
  const label = encodeURIComponent(`${issuer}:${account}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP}`
}

// Ehtiyat kodları: 10 simvol (50 bit), "xxxxx-xxxxx"; qarışan hərflər (i l o u) yoxdur
const CODE_ALPHA = '0123456789abcdefghjkmnpqrstvwxyz'
function newBackupCode() {
  const b = crypto.randomBytes(10)
  let s = ''
  for (let i = 0; i < 10; i++) s += CODE_ALPHA[b[i] & 31]
  return `${s.slice(0, 5)}-${s.slice(5)}`
}
const normBackupCode = (c) => String(c == null ? '' : c).toLowerCase().replace(/[\s-]/g, '').replace(/o/g, '0').replace(/[il]/g, '1')

// ─── Sxem ─────────────────────────────────────────────────────────────
const SCHEMA = `
CREATE TABLE IF NOT EXISTS security_secret (
  id     INTEGER PRIMARY KEY CHECK (id = 1),
  secret TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_security_events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL,
  method  TEXT NOT NULL DEFAULT '',
  label   TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS user_security_events_by_user ON user_security_events(user_id, at DESC);
CREATE INDEX IF NOT EXISTS user_security_events_by_at ON user_security_events(at);
CREATE TABLE IF NOT EXISTS user_devices (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dev_hash   TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  first_seen INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  PRIMARY KEY (user_id, dev_hash)
);
CREATE TABLE IF NOT EXISTS admin_devices (
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  dev_hash   TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  first_seen INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  PRIMARY KEY (admin_id, dev_hash)
);
CREATE TABLE IF NOT EXISTS user_totp (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_enc TEXT NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 0,
  last_step  INTEGER NOT NULL DEFAULT -1,
  created_at INTEGER NOT NULL,
  enabled_at INTEGER
);
CREATE TABLE IF NOT EXISTS admin_totp (
  admin_id   INTEGER PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  secret_enc TEXT NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 0,
  last_step  INTEGER NOT NULL DEFAULT -1,
  created_at INTEGER NOT NULL,
  enabled_at INTEGER
);
CREATE TABLE IF NOT EXISTS user_backup_codes (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at   INTEGER,
  PRIMARY KEY (user_id, code_hash)
);
CREATE TABLE IF NOT EXISTS admin_backup_codes (
  admin_id  INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at   INTEGER,
  PRIMARY KEY (admin_id, code_hash)
);
CREATE TABLE IF NOT EXISTS user_security_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lang       TEXT NOT NULL DEFAULT 'en',
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX IF NOT EXISTS user_security_tokens_by_user ON user_security_tokens(user_id);
CREATE TABLE IF NOT EXISTS user_security_hold (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  since   INTEGER NOT NULL
);
`
const T = {
  user: { totp: 'user_totp', codes: 'user_backup_codes', devices: 'user_devices', id: 'user_id' },
  admin: { totp: 'admin_totp', codes: 'admin_backup_codes', devices: 'admin_devices', id: 'admin_id' },
}

// ─── Sirlərin şifrələnməsi (AES-256-GCM, açar halqası) ────────────────
function parseKey(b64) {
  const k = Buffer.from(String(b64 || '').trim(), 'base64')
  if (k.length !== 32) throw new Error('TOTP_KEY 32 baytlıq base64 olmalıdır (openssl rand -base64 32)')
  return k
}
function createKeyring({ envKey, dbKey }) {
  const keys = []
  if (envKey) keys.push(parseKey(envKey))
  keys.push(parseKey(dbKey))
  const ring = keys.map((k) => ({ kid: sha(k).slice(0, 8), key: k }))
  const primary = ring[0]
  return {
    primaryKid: primary.kid,
    seal(plain, aad) {
      const iv = crypto.randomBytes(12)
      const c = crypto.createCipheriv('aes-256-gcm', primary.key, iv)
      c.setAAD(Buffer.from(aad))
      const ct = Buffer.concat([c.update(plain), c.final()])
      return ['v1', primary.kid, iv.toString('base64url'), ct.toString('base64url'), c.getAuthTag().toString('base64url')].join('.')
    },
    /** → { plain, kid } | null */
    open(sealed, aad) {
      const p = String(sealed || '').split('.')
      if (p.length !== 5 || p[0] !== 'v1') return null
      const k = ring.find((r) => r.kid === p[1])
      if (!k) return null
      try {
        const d = crypto.createDecipheriv('aes-256-gcm', k.key, Buffer.from(p[2], 'base64url'))
        d.setAAD(Buffer.from(aad))
        d.setAuthTag(Buffer.from(p[4], 'base64url'))
        return { plain: Buffer.concat([d.update(Buffer.from(p[3], 'base64url')), d.final()]), kid: k.kid }
      } catch { return null }
    },
    /** Ehtiyat kodlarının heşi üçün ayrıca törədilmiş açar */
    macKey: crypto.createHmac('sha256', primary.key).update('muslims.cc/backup-codes/v1').digest(),
    macKeys: ring.map((r) => crypto.createHmac('sha256', r.key).update('muslims.cc/backup-codes/v1').digest()),
  }
}

// ─── Saxlama ──────────────────────────────────────────────────────────
function createSecurityStore(db, { totpKey = '' } = {}) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  let dbKey = (p('SELECT secret FROM security_secret WHERE id = 1').get() || {}).secret
  if (!dbKey) {
    p('INSERT OR IGNORE INTO security_secret (id, secret) VALUES (1, ?)').run(crypto.randomBytes(32).toString('base64'))
    dbKey = p('SELECT secret FROM security_secret WHERE id = 1').get().secret
  }
  const ring = createKeyring({ envKey: totpKey, dbKey })

  const st = {
    addEvent: p('INSERT INTO user_security_events (user_id, kind, method, label, country, at) VALUES (?, ?, ?, ?, ?, ?)'),
    events: p('SELECT id, kind, method, label, country, at FROM user_security_events WHERE user_id = ? ORDER BY at DESC, id DESC LIMIT ?'),
    countEvents: p('SELECT COUNT(*) AS n FROM user_security_events WHERE user_id = ?'),
    trimEvents: p(`DELETE FROM user_security_events WHERE user_id = ? AND id NOT IN
      (SELECT id FROM user_security_events WHERE user_id = ? ORDER BY at DESC, id DESC LIMIT ?)`),
    purgeEvents: p('DELETE FROM user_security_events WHERE at < ?'),
    newToken: p('INSERT INTO user_security_tokens (token_hash, user_id, lang, expires_at) VALUES (?, ?, ?, ?)'),
    token: p('SELECT token_hash, user_id, lang, expires_at, used_at FROM user_security_tokens WHERE token_hash = ?'),
    useToken: p('UPDATE user_security_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL'),
    purgeTokens: p('DELETE FROM user_security_tokens WHERE expires_at < ?'),
    hold: p('SELECT since FROM user_security_hold WHERE user_id = ?'),
    setHold: p('INSERT INTO user_security_hold (user_id, since) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET since = excluded.since'),
    clearHold: p('DELETE FROM user_security_hold WHERE user_id = ?'),
  }
  const sc = {}
  for (const s of SCOPES) {
    const t = T[s]
    sc[s] = {
      totp: p(`SELECT secret_enc, enabled, last_step, created_at, enabled_at FROM ${t.totp} WHERE ${t.id} = ?`),
      putPending: p(`INSERT INTO ${t.totp} (${t.id}, secret_enc, enabled, last_step, created_at) VALUES (?, ?, 0, -1, ?)
        ON CONFLICT(${t.id}) DO UPDATE SET secret_enc = excluded.secret_enc, created_at = excluded.created_at, last_step = -1 WHERE enabled = 0`),
      enable: p(`UPDATE ${t.totp} SET enabled = 1, enabled_at = ?, last_step = ? WHERE ${t.id} = ? AND enabled = 0`),
      setStep: p(`UPDATE ${t.totp} SET last_step = ? WHERE ${t.id} = ? AND last_step < ?`),
      reseal: p(`UPDATE ${t.totp} SET secret_enc = ? WHERE ${t.id} = ?`),
      del: p(`DELETE FROM ${t.totp} WHERE ${t.id} = ?`),
      delCodes: p(`DELETE FROM ${t.codes} WHERE ${t.id} = ?`),
      addCode: p(`INSERT OR IGNORE INTO ${t.codes} (${t.id}, code_hash) VALUES (?, ?)`),
      useCode: p(`UPDATE ${t.codes} SET used_at = ? WHERE ${t.id} = ? AND code_hash = ? AND used_at IS NULL`),
      codesLeft: p(`SELECT COUNT(*) AS n FROM ${t.codes} WHERE ${t.id} = ? AND used_at IS NULL`),
      device: p(`SELECT 1 AS x FROM ${t.devices} WHERE ${t.id} = ? AND dev_hash = ?`),
      anyDevice: p(`SELECT COUNT(*) AS n FROM ${t.devices} WHERE ${t.id} = ?`),
      addDevice: p(`INSERT INTO ${t.devices} (${t.id}, dev_hash, label, first_seen, last_seen) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(${t.id}, dev_hash) DO UPDATE SET last_seen = excluded.last_seen`),
      trimDevices: p(`DELETE FROM ${t.devices} WHERE ${t.id} = ? AND dev_hash NOT IN
        (SELECT dev_hash FROM ${t.devices} WHERE ${t.id} = ? ORDER BY last_seen DESC LIMIT ?)`),
      devices: p(`SELECT label, first_seen, last_seen FROM ${t.devices} WHERE ${t.id} = ? ORDER BY last_seen DESC`),
    }
  }
  const scope = (s) => { if (!sc[s]) throw new Error('bad scope'); return sc[s] }
  const aad = (s, id) => `muslims.cc/totp/${s}/${id}`
  const codeHash = (s, id, code, key = ring.macKey) => crypto.createHmac('sha256', key).update(`${s}:${id}:${normBackupCode(code)}`).digest('hex')

  function secretOf(s, id) {
    const row = scope(s).totp.get(id)
    if (!row) return null
    const o = ring.open(row.secret_enc, aad(s, id))
    return o ? { row, key: o.plain, kid: o.kid } : { row, key: null, kid: null }
  }
  function newCodes(s, id) {
    const codes = Array.from({ length: BACKUP_CODES }, newBackupCode)
    tx(() => {
      scope(s).delCodes.run(id)
      for (const c of codes) scope(s).addCode.run(id, codeHash(s, id, c))
    })
    return codes
  }

  return {
    raw, ring,
    // ── TOTP ──
    totpStatus(s, id) {
      const row = scope(s).totp.get(id)
      const enabled = Boolean(row && row.enabled === 1)
      return { enabled, enabledAt: enabled ? row.enabled_at : null, backupCodesLeft: enabled ? scope(s).codesLeft.get(id).n : 0 }
    },
    totpEnabled: (s, id) => { const row = scope(s).totp.get(id); return Boolean(row && row.enabled === 1) },
    /** Yeni (gözləyən) sirr. Artıq aktivdirsə → null. → base32 sirr */
    totpBegin(s, id, now = Date.now()) {
      const cur = scope(s).totp.get(id)
      if (cur && cur.enabled === 1) return null
      const key = crypto.randomBytes(20)
      scope(s).putPending.run(id, ring.seal(key, aad(s, id)), now)
      return base32Encode(key)
    },
    /** Gözləyən sirri kodla təsdiqlə → ehtiyat kodları | null */
    totpConfirm(s, id, code, now = Date.now()) {
      const x = secretOf(s, id)
      if (!x || !x.key || x.row.enabled === 1) return null
      if (now - x.row.created_at > 30 * 60 * 1000) return null              // 30 dəq-dən köhnə qurulum — yenidən başla
      const step = verifyTotp(x.key, code, now)
      if (step === null) return null
      if (scope(s).enable.run(now, step, id).changes !== 1) return null
      return newCodes(s, id)
    },
    /** Girişdə / təsdiqdə kod → true (addım yadda qalır — eyni kod ikinci dəfə keçmir) */
    totpVerify(s, id, code, now = Date.now()) {
      const x = secretOf(s, id)
      if (!x || !x.key || x.row.enabled !== 1) return false
      const step = verifyTotp(x.key, code, now, { lastStep: x.row.last_step })
      if (step === null) return false
      if (scope(s).setStep.run(step, id, step).changes !== 1) return false   // paralel sorğu eyni kodu işlətdi
      if (x.kid !== ring.primaryKid) scope(s).reseal.run(ring.seal(x.key, aad(s, id)), id)
      return true
    },
    useBackupCode(s, id, code, now = Date.now()) {
      const n = normBackupCode(code)
      if (!/^[0-9a-z]{10}$/.test(n) || !this.totpEnabled(s, id)) return false
      for (const k of ring.macKeys) if (scope(s).useCode.run(now, id, codeHash(s, id, n, k)).changes === 1) return true
      return false
    },
    regenBackupCodes: (s, id) => newCodes(s, id),
    totpDisable(s, id) { tx(() => { scope(s).del.run(id); scope(s).delCodes.run(id) }) },

    // ── Cihazlar ──
    /** → { isNew, first } — first: bu hesabda hələ heç bir cihaz yox idi (səssiz yazılır) */
    seeDevice(s, id, devHash, label, now = Date.now()) {
      const q = scope(s)
      if (q.device.get(id, devHash)) { q.addDevice.run(id, devHash, label, now, now); return { isNew: false, first: false } }
      const first = q.anyDevice.get(id).n === 0
      tx(() => { q.addDevice.run(id, devHash, label, now, now); q.trimDevices.run(id, id, MAX_DEVICES) })
      return { isNew: true, first }
    },
    devices: (s, id) => scope(s).devices.all(id).map((d) => ({ label: d.label, firstSeen: d.first_seen, lastSeen: d.last_seen })),

    // ── Hadisələr ──
    addEvent(userId, { kind, method = '', label = '', country = '' }, now = Date.now()) {
      if (!EVENT_KINDS.includes(kind)) throw new Error('bad event kind')
      return tx(() => {
        const id = Number(st.addEvent.run(userId, kind, String(method).slice(0, 16), String(label).slice(0, 60), String(country).slice(0, 2), now).lastInsertRowid)
        st.trimEvents.run(userId, userId, MAX_EVENTS)
        return id
      })
    },
    events: (userId, limit = 30) => st.events.all(userId, Math.max(1, Math.min(MAX_EVENTS, limit))).map((e) => ({
      id: e.id, kind: e.kind, method: e.method || null, label: e.label || '', country: e.country || null, at: e.at,
    })),
    countEvents: (userId) => st.countEvents.get(userId).n,
    purge(now = Date.now()) { return st.purgeEvents.run(now - EVENT_KEEP_MS).changes + st.purgeTokens.run(now).changes },

    // ── "Bu mən deyildim" tokenləri ──
    createNotMeToken(userId, lang, now = Date.now()) {
      const token = crypto.randomBytes(32).toString('base64url')
      st.newToken.run(sha(token), userId, mailLang(lang), now + NOT_ME_TTL_MS)
      return token
    },
    /** Yoxla (dəyişmədən) → { userId, lang } | null */
    peekNotMe(token, now = Date.now()) {
      if (typeof token !== 'string' || !TOKEN_RE.test(token)) return null
      const r = st.token.get(sha(token))
      return r && r.used_at == null && r.expires_at > now ? { userId: r.user_id, lang: r.lang } : null
    },
    /** İstifadə et (birdəfəlik) → { userId, lang } | null */
    consumeNotMe(token, now = Date.now()) {
      const r = this.peekNotMe(token, now)
      if (!r) return null
      return st.useToken.run(now, sha(token)).changes === 1 ? r : null
    },

    // ── Hold ──
    holdSince: (userId) => { const r = st.hold.get(userId); return r ? r.since : null },
    setHold: (userId, now = Date.now()) => st.setHold.run(userId, now),
    clearHold: (userId) => st.clearHold.run(userId).changes > 0,

    // ── İxrac / xülasə (sirlər YOXDUR: TOTP sirri, kod/token heşləri, cihaz heşləri) ──
    exportUser(userId) {
      return {
        twoFactor: this.totpStatus('user', userId),
        securityHold: this.holdSince(userId),
        events: this.events(userId, MAX_EVENTS),
        devices: this.devices('user', userId),
      }
    },
    summaryUser(userId) {
      return { events: this.countEvents(userId), devices: scope('user').anyDevice.get(userId).n, twoFactor: this.totpEnabled('user', userId) }
    },
  }
}

// ─── Məktub köməkçiləri ───────────────────────────────────────────────
const LOCALE = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar' }
function validTz(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}
function fmtTime(ms, lang, tz) {
  const zone = validTz(tz) ? tz : 'UTC'
  try {
    return `${new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: zone }).format(new Date(ms))} (${zone})`
  } catch { return `${new Date(ms).toISOString().replace('T', ' ').slice(0, 16)} (UTC)` }
}
function countryName(code, lang) {
  if (!code) return ''
  try { return new Intl.DisplayNames([LOCALE[lang] || 'en'], { type: 'region' }).of(code) || code } catch { return code }
}
/** Cloudflare CF-IPCountry → 'AZ' | '' (XX — naməlum, T1 — Tor) */
function countryOf(req) {
  const c = String((req && req.headers && req.headers['cf-ipcountry']) || '').toUpperCase()
  return /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1' ? c : ''
}

// Məktubdakı hadisə adları (securityChange şablonu → {event})
const EVENT_NAMES = {
  az: { password_changed: 'Şifrə dəyişdirildi', password_reset: 'Şifrə bərpa edildi', twofa_enabled: 'İki addımlı yoxlama açıldı', twofa_disabled: 'İki addımlı yoxlama bağlandı', backup_codes_new: 'Yeni ehtiyat kodları yaradıldı', passkey_added: 'Yeni passkey əlavə olundu', passkey_removed: 'Passkey silindi' },
  en: { password_changed: 'Password changed', password_reset: 'Password reset', twofa_enabled: 'Two-step verification turned on', twofa_disabled: 'Two-step verification turned off', backup_codes_new: 'New backup codes created', passkey_added: 'New passkey added', passkey_removed: 'Passkey removed' },
  ru: { password_changed: 'Пароль изменён', password_reset: 'Пароль сброшен', twofa_enabled: 'Двухэтапная проверка включена', twofa_disabled: 'Двухэтапная проверка отключена', backup_codes_new: 'Созданы новые резервные коды', passkey_added: 'Добавлен новый ключ доступа', passkey_removed: 'Ключ доступа удалён' },
  tr: { password_changed: 'Şifre değiştirildi', password_reset: 'Şifre sıfırlandı', twofa_enabled: 'İki adımlı doğrulama açıldı', twofa_disabled: 'İki adımlı doğrulama kapatıldı', backup_codes_new: 'Yeni yedek kodlar oluşturuldu', passkey_added: 'Yeni geçiş anahtarı eklendi', passkey_removed: 'Geçiş anahtarı kaldırıldı' },
  ar: { password_changed: 'تم تغيير كلمة المرور', password_reset: 'تمت إعادة تعيين كلمة المرور', twofa_enabled: 'تم تفعيل التحقق بخطوتين', twofa_disabled: 'تم إيقاف التحقق بخطوتين', backup_codes_new: 'أُنشئت رموز احتياطية جديدة', passkey_added: 'أُضيف مفتاح مرور جديد', passkey_removed: 'حُذف مفتاح مرور' },
}

// "Bu mən deyildim" səhifəsinin mətnləri
const PAGE_T = {
  az: { title: 'Bu giriş siz deyildiniz?', lead: 'Təsdiq etsəniz: hesabınızdakı BÜTÜN girişlər bağlanacaq, e-poçtunuza yeni şifrə üçün keçid göndəriləcək və yeni şifrə qoyulana qədər şifrə və Google ilə giriş bağlı qalacaq.', button: 'Bəli, hesabımı qoru', passkeys: 'Hesabınızdakı passkey-lər (tanımadığınızı girişdən sonra silin):', none: 'Passkey yoxdur.', done: 'Hazırdır. Bütün girişlər bağlandı və e-poçtunuza şifrə bərpası keçidi göndərildi (1 saat etibarlıdır). Yeni şifrə qoyana qədər şifrə və Google ilə giriş bağlıdır. İki addımlı yoxlamanı da açmağı tövsiyə edirik.', bad: 'Bu keçid etibarsızdır və ya artıq istifadə olunub.' },
  en: { title: 'Was this not you?', lead: 'If you confirm: ALL sign-ins to your account will be signed out, a link to set a new password will be sent to your email, and signing in with a password or Google stays blocked until a new password is set.', button: 'Yes, secure my account', passkeys: 'Passkeys on your account (remove any you do not recognise after signing in):', none: 'No passkeys.', done: 'Done. All sessions have been signed out and a password reset link has been sent to your email (valid for 1 hour). Signing in with a password or Google is blocked until you set a new password. We also recommend turning on two-step verification.', bad: 'This link is invalid or has already been used.' },
  ru: { title: 'Это были не вы?', lead: 'Если подтвердите: ВСЕ входы в ваш аккаунт будут закрыты, на почту придёт ссылка для нового пароля, а вход по паролю и через Google будет заблокирован, пока не будет задан новый пароль.', button: 'Да, защитить аккаунт', passkeys: 'Ключи доступа в аккаунте (удалите незнакомые после входа):', none: 'Ключей доступа нет.', done: 'Готово. Все сеансы закрыты, на вашу почту отправлена ссылка для сброса пароля (действует 1 час). Вход по паролю и через Google заблокирован, пока вы не зададите новый пароль. Рекомендуем также включить двухэтапную проверку.', bad: 'Ссылка недействительна или уже использована.' },
  tr: { title: 'Bu giriş siz değil miydiniz?', lead: 'Onaylarsanız: hesabınızdaki TÜM oturumlar kapatılır, e-postanıza yeni şifre bağlantısı gönderilir ve yeni şifre belirlenene kadar şifre ve Google ile giriş engellenir.', button: 'Evet, hesabımı koru', passkeys: 'Hesabınızdaki geçiş anahtarları (tanımadıklarınızı girişten sonra kaldırın):', none: 'Geçiş anahtarı yok.', done: 'Tamam. Tüm oturumlar kapatıldı ve e-postanıza şifre sıfırlama bağlantısı gönderildi (1 saat geçerli). Yeni şifre belirleyene kadar şifre ve Google ile giriş engellidir. İki adımlı doğrulamayı da açmanızı öneririz.', bad: 'Bu bağlantı geçersiz veya zaten kullanılmış.' },
  ar: { title: 'ألم تكن أنت؟', lead: 'إن أكّدت: ستُغلق جميع جلسات حسابك، وسيُرسل إلى بريدك رابط لتعيين كلمة مرور جديدة، ويبقى الدخول بكلمة المرور أو Google موقوفًا حتى تعيين كلمة مرور جديدة.', button: 'نعم، احمِ حسابي', passkeys: 'مفاتيح المرور في حسابك (احذف ما لا تعرفه بعد الدخول):', none: 'لا توجد مفاتيح مرور.', done: 'تم. أُغلقت جميع الجلسات وأُرسل إلى بريدك رابط لإعادة تعيين كلمة المرور (صالح لساعة واحدة). الدخول بكلمة المرور أو Google موقوف حتى تعيّن كلمة مرور جديدة. ننصح أيضًا بتفعيل التحقق بخطوتين.', bad: 'هذا الرابط غير صالح أو استُخدم من قبل.' },
}

// ─── Əsas obyekt: users.js / auth.js / server.js bunu işlədir ─────────
/**
 * opts: { db, mailer?, publicOrigin?, totpKey?, prefsOf?(userId) → { tz, lang } | null, now?, log?, limits? }
 */
function createSecurity(opts) {
  const { db, mailer = null, publicOrigin = 'https://muslims.cc', now = () => Date.now(), log = console } = opts
  const store = opts.store || createSecurityStore(db, { totpKey: opts.totpKey || '' })
  const prefsOf = (id) => { try { return (opts.prefsOf && opts.prefsOf(id)) || null } catch { return null } }
  const limits = opts.limits || {}
  const codeFails = auth.createFailureLimiter({ max: limits.codeFails || 10, windowMs: limits.windowMs || 15 * 60 * 1000 })

  // ── Giriş biletləri (yaddaşda; açar — biletin SHA-256-ı) ──
  const tickets = new Map()
  function issueTicket(s, id, meta = {}) {
    const t = now()
    if (tickets.size > 5000) for (const [k, v] of tickets) if (v.exp <= t) tickets.delete(k)
    if (tickets.size > 10000) tickets.delete(tickets.keys().next().value)
    const ticket = crypto.randomBytes(32).toString('base64url')
    tickets.set(sha(ticket), { scope: s, id, meta, exp: t + TICKET_TTL_MS, attempts: 0 })
    return ticket
  }
  /**
   * İkinci addım: { ticket, code | backupCode } → { ok:true, id, meta, via } | { ok:false, status, code, retryAfter? }
   * Bilet başına 5 səhv (sonra bilet silinir), istifadəçi üzrə 10 səhv / 15 dəq.
   */
  function secondFactor(s, body = {}) {
    const ticket = body.ticket
    if (typeof ticket !== 'string' || !TOKEN_RE.test(ticket)) return { ok: false, status: 400, code: 'invalid_ticket' }
    const h = sha(ticket)
    const e = tickets.get(h)
    if (!e || e.scope !== s || e.exp <= now()) { tickets.delete(h); return { ok: false, status: 401, code: 'invalid_ticket' } }
    const k = `${s}:${e.id}`
    if (codeFails.blocked(k)) return { ok: false, status: 429, code: 'rate_limited', retryAfter: codeFails.retryAfterSec(k) }
    let via = null
    if (body.code != null && store.totpVerify(s, e.id, body.code, now())) via = 'totp'
    else if (body.backupCode != null && store.useBackupCode(s, e.id, body.backupCode, now())) via = 'backup'
    if (!via) {
      codeFails.fail(k)
      e.attempts++
      if (e.attempts >= TICKET_ATTEMPTS) {
        tickets.delete(h)
        if (s === 'user') safeEvent(e.id, { kind: 'twofa_failed', method: e.meta.method || '' })
        return { ok: false, status: 401, code: 'invalid_ticket' }
      }
      return { ok: false, status: 401, code: 'invalid_code', attemptsLeft: TICKET_ATTEMPTS - e.attempts }
    }
    tickets.delete(h)
    codeFails.reset(k)
    return { ok: true, id: e.id, meta: e.meta, via }
  }
  /** Daxil olmuş istifadəçinin kodunu yoxla (2FA bağla, kodları yenilə) — eyni limit */
  function checkCode(s, id, { code, backupCode } = {}) {
    const k = `${s}:${id}`
    if (codeFails.blocked(k)) return 'rate_limited'
    if (code != null && store.totpVerify(s, id, code, now())) { codeFails.reset(k); return 'ok' }
    if (backupCode != null && store.useBackupCode(s, id, backupCode, now())) { codeFails.reset(k); return 'ok' }
    codeFails.fail(k)
    return 'invalid_code'
  }

  // ── Cihaz cookie-si ──
  const cookieOf = (req) => auth.parseCookies(req.headers.cookie)[DEVICE_COOKIE]
  function deviceCheck(req, res, s, id, label) {
    let dev = cookieOf(req)
    if (typeof dev !== 'string' || !TOKEN_RE.test(dev)) {
      dev = crypto.randomBytes(32).toString('base64url')
      res.append('Set-Cookie', `${DEVICE_COOKIE}=${dev}; Path=/; Max-Age=${DEVICE_TTL_S}; HttpOnly; Secure; SameSite=Lax`)
    }
    return store.seeDevice(s, id, sha(`${s}|${dev}|${label}`), label, now())
  }

  function safeEvent(userId, ev) {
    try { return store.addEvent(userId, ev, now()) } catch (e) { log.error('security event:', e && e.message); return null }
  }

  function send(kind, lang, to, vars) {
    if (!mailer || !to) return
    try { Promise.resolve(mailer.sendTemplate(kind, lang, to, vars)).catch(() => {}) } catch (e) { log.error('security mail:', e && e.message) }
  }
  /** Hadisə + (lazımdırsa) məktub "Bu mən deyildim" keçidi ilə */
  function alertUser(user, kind, { label = '', country = '', lang } = {}) {
    if (!ALERT_KINDS.has(kind) || !user || !user.email || user.disabled) return
    const pr = prefsOf(user.id)
    const ml = mailLang(lang || (pr && pr.lang))
    let url = ''
    try { url = `${publicOrigin}/api/security/not-me?t=${store.createNotMeToken(user.id, ml, now())}` } catch (e) { log.error('not-me token:', e && e.message) }
    const vars = { url, time: fmtTime(now(), ml, pr && pr.tz), device: label || '—', place: countryName(country, ml) || '—' }
    if (kind === 'sign_in_new') send('newSignIn', ml, user.email, vars)
    else send('securityChange', ml, user.email, { ...vars, event: (EVENT_NAMES[ml] || EVENT_NAMES.en)[kind] || kind })
  }

  const labelOf = (req) => {
    const ua = req.headers['user-agent']
    return require('./users').uaLabel(ua)
  }

  return {
    store, DEVICE_COOKIE,
    issueTicket, secondFactor, checkCode,
    twoFactorEnabled: (s, id) => store.totpEnabled(s, id),
    onHold: (userId) => store.holdSince(userId) != null,
    clearHold: (userId) => store.clearHold(userId),
    meExtra(userId) {
      const t = store.totpStatus('user', userId)
      return { twoFactor: { enabled: t.enabled, backupCodesLeft: t.backupCodesLeft }, securityHold: store.holdSince(userId) != null }
    },
    /** Uğurlu girişdən sonra (sessiya yaradılandan sonra): cihaz, hadisə, məktub. Heç vaxt atmır. */
    afterUserLogin(req, res, user, { method = '', lang } = {}) {
      try {
        const label = labelOf(req)
        const country = countryOf(req)
        const d = deviceCheck(req, res, 'user', user.id, label)
        const alert = d.isNew && !d.first
        safeEvent(user.id, { kind: alert ? 'sign_in_new' : 'sign_in', method, label, country })
        if (alert) alertUser(user, 'sign_in_new', { label, country, lang })
      } catch (e) { log.error('afterUserLogin:', e && e.message) }
    },
    /** Qeydiyyat: bu cihaz səssiz "tanış" sayılır */
    afterRegister(req, res, user) {
      try { deviceCheck(req, res, 'user', user.id, labelOf(req)) } catch (e) { log.error('afterRegister:', e && e.message) }
    },
    /** Hesab dəyişikliyi (şifrə, 2FA, passkey): hadisə + məktub */
    userEvent(req, user, kind, { lang, method = '' } = {}) {
      try {
        const label = req ? labelOf(req) : ''
        const country = req ? countryOf(req) : ''
        safeEvent(user.id, { kind, method, label, country })
        alertUser(user, kind, { label, country, lang })
      } catch (e) { log.error('userEvent:', e && e.message) }
    },
    /** Admin paneli girişi: yeni cihazdan — adminə məktub (dil: girişdəki lang, yoxdursa az) */
    afterAdminLogin(req, res, admin, { lang } = {}) {
      try {
        const label = labelOf(req)
        const country = countryOf(req)
        const d = deviceCheck(req, res, 'admin', admin.id, label)
        if (d.isNew && !d.first && admin.email) {
          const ml = MAIL_LANGS.includes(lang) ? lang : 'az'
          send('adminSignIn', ml, admin.email, { url: `${publicOrigin}${ml === 'az' ? '' : '/' + ml}/admin`, time: fmtTime(now(), ml, 'UTC'), device: label || '—', place: countryName(country, ml) || '—' })
        }
      } catch (e) { log.error('afterAdminLogin:', e && e.message) }
    },
    purge: () => { try { return store.purge(now()) } catch (e) { log.error('security purge:', e && e.message); return 0 } },
  }
}

// ─── HTTP: /api/auth/2fa*, /api/auth/security/*, /api/security/not-me, /api/auth/export ──
/**
 * opts: { security, usersStore, requireUser, mailer?, publicOrigin?, now?, sources?, limits? }
 *  sources — { personal, family, hifzTests, sync, readTogether }: hər biri (və ya onu qaytaran funksiya)
 *            exportUser(userId) və/və ya summaryUser(userId) verə bilər (yoxdursa atlanır).
 */
function createSecurityRouter(opts) {
  const { security, usersStore, requireUser, mailer = null, publicOrigin = 'https://muslims.cc', now = () => Date.now() } = opts
  const store = security.store
  const sources = opts.sources || {}
  const limits = opts.limits || {}
  const W15 = 15 * 60 * 1000, H1 = 3600 * 1000
  const pwFails = auth.createFailureLimiter({ max: limits.passwordFails || 5, windowMs: W15 })
  const exportLim = auth.createFailureLimiter({ max: limits.exports || 5, windowMs: H1 })
  const notMeIp = auth.createFailureLimiter({ max: limits.notMe || 30, windowMs: W15 })
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const json = express.json({ limit: '4kb' })
  const router = express.Router()
  const userOf = (id) => usersStore.byId(id)

  async function passwordOk(req, res, u, password) {
    if (!u.pass_hash) return true
    const k = 'p:' + u.id
    if (pwFails.blocked(k)) { res.set('Retry-After', String(pwFails.retryAfterSec(k))); err(res, 429, 'rate_limited', 'Too many attempts'); return false }
    if (typeof password !== 'string' || password.length > auth.MAX_PASSWORD || !(await auth.verifyPassword(password, u.pass_hash))) {
      pwFails.fail(k)
      err(res, 400, 'wrong_password', 'Wrong password')
      return false
    }
    pwFails.reset(k)
    return true
  }
  const langOf = (req) => (req.body && typeof req.body.lang === 'string' ? req.body.lang : undefined)

  // ── İki addımlı yoxlama (TOTP) ──
  router.get('/auth/2fa', requireUser(), (req, res) => res.json(store.totpStatus('user', req.user.id)))
  router.post('/auth/2fa/setup', requireUser(), json, async (req, res) => {
    const u = req.user
    if (store.totpEnabled('user', u.id)) return err(res, 409, 'already_enabled', 'Already enabled')
    if (!(await passwordOk(req, res, u, req.body && req.body.password))) return
    const secret = store.totpBegin('user', u.id, now())
    if (!secret) return err(res, 409, 'already_enabled', 'Already enabled')
    res.json({ secret, uri: otpauthUri({ secret, account: u.email || `user-${u.id}` }), digits: TOTP_DIGITS, period: TOTP_STEP })
  })
  router.post('/auth/2fa/enable', requireUser(), json, (req, res) => {
    const u = req.user
    const k = 'e:' + u.id
    if (pwFails.blocked(k)) return err(res, 429, 'rate_limited', 'Too many attempts')
    const codes = store.totpConfirm('user', u.id, req.body && req.body.code, now())
    if (!codes) { pwFails.fail(k); return err(res, 400, 'invalid_code', 'Invalid code') }
    pwFails.reset(k)
    security.userEvent(req, u, 'twofa_enabled', { lang: langOf(req) })
    // İstəyə bağlı (D3): { revokeOthers: true } — bu cihazdan başqa bütün sessiyalar bağlanır
    // (2FA-dan əvvəl açılmış, ikinci addımı keçməmiş sessiyalar qalmasın). Susmaya görə — toxunulmur.
    const revoked = req.body && req.body.revokeOthers === true ? usersStore.revokeOtherSessions(u.id, req.userSessionHash) : 0
    res.json({ ok: true, backupCodes: codes, revoked })
  })
  // Bağlamaq / kodları yeniləmək: cari şifrə VƏ YA TOTP/ehtiyat kodu
  async function reauth(req, res) {
    const b = req.body || {}
    const u = req.user
    if (b.code != null || b.backupCode != null) {
      const r = security.checkCode('user', u.id, b)
      if (r === 'ok') return true
      err(res, r === 'rate_limited' ? 429 : 400, r, 'Invalid code')
      return false
    }
    if (!u.pass_hash) { err(res, 400, 'code_required', 'Code required'); return false }
    if (typeof b.password !== 'string' || !b.password) { err(res, 400, 'wrong_password', 'Wrong password'); return false }
    return passwordOk(req, res, u, b.password)
  }
  router.post('/auth/2fa/disable', requireUser(), json, async (req, res) => {
    const u = req.user
    if (!store.totpEnabled('user', u.id)) return res.json({ ok: true })
    if (!(await reauth(req, res))) return
    store.totpDisable('user', u.id)
    security.userEvent(req, u, 'twofa_disabled', { lang: langOf(req) })
    res.json({ ok: true })
  })
  router.post('/auth/2fa/backup-codes', requireUser(), json, async (req, res) => {
    const u = req.user
    if (!store.totpEnabled('user', u.id)) return err(res, 400, 'not_enabled', 'Two-step verification is off')
    if (!(await reauth(req, res))) return
    const codes = store.regenBackupCodes('user', u.id)
    security.userEvent(req, u, 'backup_codes_new', { lang: langOf(req) })
    res.json({ ok: true, backupCodes: codes })
  })

  // ── Təhlükəsizlik fəaliyyəti ──
  router.get('/auth/security/events', requireUser(), (req, res) => {
    res.json({ events: store.events(req.user.id, 30), hold: store.holdSince(req.user.id), keepDays: EVENT_KEEP_MS / 86400000 })
  })
  // Hold-u açmaq: yalnız hold-dan SONRA yaradılmış sessiya ilə (yəni passkey ilə yenidən girib)
  router.post('/auth/security/hold/release', requireUser(), json, (req, res) => {
    const since = store.holdSince(req.user.id)
    if (since == null) return res.json({ ok: true })
    const cur = usersStore.listSessions(req.user.id, req.userSessionHash, now()).find((s) => s.current)
    if (!cur || cur.createdAt < since) return err(res, 403, 'reauth_required', 'Sign in again first')
    store.clearHold(req.user.id)
    security.userEvent(req, req.user, 'hold_released')
    res.json({ ok: true })
  })

  // ── "Bu mən deyildim" — girişsiz (məktubdakı keçid). GET heç nəyi dəyişmir. ──
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const page = (l, title, body) => `<!doctype html><html lang="${l}" dir="${l === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>${esc(title)}</title></head>` +
    '<body style="margin:0;padding:24px;background:#f6f7f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2a24">' +
    '<main style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">' +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px">Muslims.cc</p><h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>${body}` +
    `<p style="margin-top:20px"><a href="${esc(publicOrigin)}/account" style="color:#0f6b4f">muslims.cc/account</a></p></main></body></html>`
  const sendPage = (res, status, html) => res.status(status).set({
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    'X-Content-Type-Options': 'nosniff',
  }).send(html)
  const ipK = (req) => 'n:' + sha(String(req.ip || '')).slice(0, 22)
  const badPage = (res) => sendPage(res, 400, page('en', 'Muslims.cc', `<p>${esc(PAGE_T.en.bad)}</p>`))

  router.get('/security/not-me', (req, res) => {
    const t = String(req.query.t || '')
    if (notMeIp.blocked(ipK(req))) return sendPage(res, 429, page('en', 'Muslims.cc', '<p>Too many attempts.</p>'))
    const v = store.peekNotMe(t, now())
    if (!v) { notMeIp.fail(ipK(req)); return badPage(res) }
    const l = mailLang(v.lang), x = PAGE_T[l]
    const pks = usersStore.listPasskeys(v.userId)
    const list = pks.length
      ? `<ul style="padding-inline-start:20px;line-height:1.6">${pks.map((k) => `<li><bdi>${esc(k.name || 'Passkey')}</bdi> — ${esc(new Date(k.createdAt).toISOString().slice(0, 10))}</li>`).join('')}</ul>`
      : `<p>${esc(x.none)}</p>`
    sendPage(res, 200, page(l, x.title, `<p style="font-size:15px;line-height:1.6">${esc(x.lead)}</p>` +
      `<p style="font-size:14px;margin:16px 0 4px">${esc(x.passkeys)}</p>${list}` +
      `<form method="post" action="/api/security/not-me"><input type="hidden" name="t" value="${esc(t)}">` +
      `<button type="submit" style="background:#b3261e;color:#fff;border:0;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer">${esc(x.button)}</button></form>`))
  })
  const form = express.urlencoded({ extended: false, limit: '2kb' })
  router.post('/security/not-me', form, (req, res) => {
    if (notMeIp.blocked(ipK(req))) return sendPage(res, 429, page('en', 'Muslims.cc', '<p>Too many attempts.</p>'))
    const v = store.consumeNotMe(String((req.body && req.body.t) || ''), now())
    if (!v) { notMeIp.fail(ipK(req)); return badPage(res) }
    const u = userOf(v.userId)
    if (!u) return badPage(res)
    const l = mailLang(v.lang)
    usersStore.revokeAllSessions(u.id)
    store.setHold(u.id, now())
    try { store.addEvent(u.id, { kind: 'not_me', label: '', country: countryOf(req) }, now()) } catch { /* */ }
    if (mailer && u.email && !u.disabled) {
      const token = usersStore.createToken(u.id, 'reset', now())
      const url = `${publicOrigin}${l === 'az' ? '' : '/' + l}/account/reset#token=${token}`
      Promise.resolve(mailer.sendTemplate('reset', l, u.email, { url })).catch(() => {})
    }
    sendPage(res, 200, page(l, PAGE_T[l].title, `<p style="font-size:15px;line-height:1.6">${esc(PAGE_T[l].done)}</p>`))
  })

  // ── Mənim məlumatlarım: xülasə + tam ixrac ──
  // Mənbə obyekt və ya onu qaytaran funksiya ola bilər (server.js-də modullar sonra yaradılır)
  const call = (source, fn, id) => {
    try {
      // express Router-in özü də funksiyadır — yalnız exportUser/summaryUser-i olmayan funksiya "qaytaran"dır
      const src = typeof source === 'function' && typeof source.exportUser !== 'function' && typeof source.summaryUser !== 'function' ? source() : source
      return src && typeof src[fn] === 'function' ? src[fn](id) : null
    } catch (e) { console.error(`export ${fn}:`, e && e.message); return null }
  }
  router.get('/auth/data-summary', requireUser(), (req, res) => {
    const id = req.user.id
    const out = {
      account: { sessions: usersStore.listSessions(id, req.userSessionHash, now()).length, passkeys: usersStore.listPasskeys(id).length, providers: usersStore.providersOf(id) },
      security: store.summaryUser(id),
    }
    for (const [name, src] of Object.entries(sources)) {
      const v = call(src, 'summaryUser', id)
      if (v != null) out[name] = v
    }
    res.json(out)
  })
  router.get('/auth/export', requireUser(), (req, res) => {
    const id = req.user.id
    const k = 'x:' + id
    if (exportLim.blocked(k)) { res.set('Retry-After', String(exportLim.retryAfterSec(k))); return err(res, 429, 'rate_limited', 'Too many exports') }
    exportLim.fail(k)
    const out = {
      kind: 'muslims.cc/account-export', version: 1, exportedAt: new Date(now()).toISOString(),
      account: usersStore.exportUser(id, req.userSessionHash, now()),
      security: store.exportUser(id),
    }
    for (const [name, src] of Object.entries(sources)) {
      const v = call(src, 'exportUser', id)
      if (v != null) out[name] = v
    }
    res.set('Content-Disposition', 'attachment; filename="muslims-cc-account.json"')
    res.json(out)
  })

  return router
}

module.exports = {
  DEVICE_COOKIE, EVENT_KINDS, ALERT_KINDS, EVENT_KEEP_MS, TICKET_TTL_MS, TICKET_ATTEMPTS, BACKUP_CODES,
  base32Encode, base32Decode, hotp, totp, totpStep, verifyTotp, otpauthUri, newBackupCode, normBackupCode,
  createKeyring, createSecurityStore, createSecurity, createSecurityRouter, countryOf, countryName, fmtTime,
}
