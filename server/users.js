// ═══════════════════════════════════════════════════════════════════════
// İstifadəçi hesabları + rollar — admin panelindən AYRI (docs/USER-ACCOUNTS.md)
//
// • Giriş yolları: e-poçt + şifrə (scrypt, server/auth.js), passkey (WebAuthn,
//   @simplewebauthn/server), Google ("Sign in with Google" ID tokeni — SDK-sız,
//   JWKS + node:crypto ilə yoxlanır).
// • Sessiya: təsadüfi 32 bayt → cookie __Host-mcc_user (HttpOnly; Secure;
//   SameSite=Strict); DB-də yalnız SHA-256. 30 gün, sürüşən (gündə bir uzadılır).
// • CSRF: auth.js-dəki kimi — vəziyyət dəyişən hər sorğuda Origin (varsa)
//   icazəli olmalı VƏ X-Requested-With başlığı olmalıdır.
// • Məxfilik: IP saxlanmır (rate-limit yaddaşda, duzlu heşlə); user-agent yox,
//   yalnız kobud etiket ("Chrome · Android"). Səhv mesajları e-poçtun bazada
//   olub-olmadığını açmır (forgot həmişə 200, login eyni 401, register mövcud
//   e-poçtda "poçtu yoxlayın" + sahibinə xəbərdarlıq məktubu).
// • Rollar: user < mosque_rep < editor < admin < superadmin.
//   superadmin HTTP ilə HEÇ VAXT verilmir/alınmır — yalnız server skripti
//   (scripts/admin-user.js). admin-i yalnız superadmin verir/alır. Öz rolunu
//   heç kim dəyişə bilməz. Hər dəyişiklik role_audit-ə yazılır.
// • Admin paneli hesabları (admins) ayrıdır; onların rolu admin_roles-dadır
//   (sətir yoxdursa 'admin'). İstifadəçi idarəsi yalnız admin/superadmin üçün.
// • Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır):
//   köhnə kod bu cədvəllərə toxunmur — geri qaytarma pozulmur (2026-11-04 dərsi).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const auth = require('./auth')

const USER_COOKIE = '__Host-mcc_user'
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000
const RENEW_EVERY_MS = 24 * 3600 * 1000
const MIN_PASSWORD = 10
const MAX_PASSWORD = auth.MAX_PASSWORD
const VERIFY_TTL_MS = 24 * 3600 * 1000
const RESET_TTL_MS = 3600 * 1000
const CHALLENGE_TTL_MS = 5 * 60 * 1000
const MAX_PASSKEYS = 20
const MAX_SESSIONS = 50
const MAX_NAME = 60
const PAGE_SIZE = 50

const ROLES = ['user', 'mosque_rep', 'editor', 'admin', 'superadmin']
const ADMIN_PANEL_ROLES = ['editor', 'admin', 'superadmin']
const rank = (r) => ROLES.indexOf(r)
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const B64U_RE = /^[A-Za-z0-9_-]+$/
const MOSQUE_RE = /^[A-Za-z0-9_-]{1,64}$/
const MAIL_LANGS = ['az', 'en', 'ru', 'tr', 'ar']

// Ən çox yayılmış şifrələr (kiçik hərflə). Sonundakı rəqəm/simvollar atılıb da yoxlanır
// ("password123!" → "password"), ona görə qısa kökləri də saxlayırıq.
const COMMON_PASSWORDS = new Set([
  'password', 'passw0rd', 'p@ssword', 'p@ssw0rd', 'qwerty', 'qwertyuiop', 'qwertyuiop[]', 'asdfghjkl', 'zxcvbnm', 'azerty',
  'abc', 'abcdef', 'abcdefgh', 'abcdefghij', 'abcd', 'iloveyou', 'letmein', 'welcome', 'admin', 'administrator', 'monkey',
  'dragon', 'football', 'baseball', 'superman', 'batman', 'starwars', 'sunshine', 'princess', 'shadow', 'master', 'trustno',
  'whatever', 'freedom', 'michael', 'jennifer', 'charlie', 'login', 'hello', 'secret', 'changeme', 'default', 'computer',
  'internet', 'google', 'facebook', 'instagram', 'samsung', 'iphone', 'muslims', 'muslimscc', 'muslims.cc', 'muslim',
  'islam', 'allah', 'allahuakbar', 'bismillah', 'mashallah', 'inshallah', 'alhamdulillah', 'subhanallah', 'mohammed',
  'muhammad', 'mehemmed', 'azerbaijan', 'azerbaycan', 'baku', 'baki', 'turkiye', 'istanbul', 'parol', 'sifre', 'şifre',
  'şifrə', 'пароль', 'йцукен', 'qwerty123', '1q2w3e4r', '1q2w3e4r5t', '1qaz2wsx', 'zaq12wsx', 'q1w2e3r4', 'a1b2c3d4',
  '123qwe', 'qweasdzxc', 'asdasd', 'aaaaaa', 'qazwsx', 'passport', 'test', 'testtest', 'guest', 'user', 'love', 'lovely',
])
function weakPassword(pw, email = '') {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD || pw.length > MAX_PASSWORD) return true
  const low = pw.normalize('NFKC').toLowerCase()
  if (COMMON_PASSWORDS.has(low)) return true
  const stem = low.replace(/[\d\W_]+$/u, '').replace(/^[\d\W_]+/u, '')
  if (!stem || COMMON_PASSWORDS.has(stem)) return true                     // yalnız rəqəm/simvol və ya ümumi kök
  if (/^(.)\1+$/u.test(low)) return true                                     // aaaaaaaaaa
  if ('01234567890123456789'.includes(low) || '98765432109876543210'.includes(low)) return true
  if ('qwertyuiopasdfghjklzxcvbnm'.includes(low)) return true
  if (new Set(low).size < 4) return true                                     // abababababab
  const e = auth.normEmail(email)
  if (e && (low === e || low === e.split('@')[0])) return true
  return false
}

const cleanName = (v) => {
  if (v == null) return ''
  if (typeof v !== 'string') return null
  const s = v.normalize('NFC').replace(/[\p{Cc}‪-‮⁦-⁩]/gu, '').replace(/\s+/g, ' ').trim()
  return [...s].length <= MAX_NAME ? s : null
}
const mailLang = (l) => (MAIL_LANGS.includes(l) ? l : (l == null ? 'az' : 'en'))

/** Tam user-agent saxlanmır — yalnız "Brauzer · Sistem" etiketi. */
function uaLabel(ua) {
  if (typeof ua !== 'string' || !ua) return ''
  const b = /Edg(e|A|iOS)?\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\/|FxiOS/.test(ua) ? 'Firefox' : /Chrome\/|CriOS/.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const o = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /CrOS/.test(ua) ? 'ChromeOS'
    : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return o ? `${b} · ${o}` : b
}

// ─── Sxem (miqrasiyasız, yalnız əlavə) ────────────────────────────────
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT UNIQUE COLLATE NOCASE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  pass_hash      TEXT,
  display_name   TEXT NOT NULL DEFAULT '',
  role           TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','mosque_rep','editor','admin','superadmin')),
  mosque_id      TEXT,
  disabled       INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  last_login_at  INTEGER
);
CREATE TABLE IF NOT EXISTS user_sessions (
  id_hash    TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  ua         TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS user_sessions_by_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_by_expiry ON user_sessions(expires_at);
CREATE TABLE IF NOT EXISTS user_passkeys (
  id           TEXT PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key   BLOB NOT NULL,
  counter      INTEGER NOT NULL DEFAULT 0,
  transports   TEXT NOT NULL DEFAULT '[]',
  name         TEXT NOT NULL DEFAULT '',
  created_at   INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE INDEX IF NOT EXISTS user_passkeys_by_user ON user_passkeys(user_id);
CREATE TABLE IF NOT EXISTS user_oauth (
  provider   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (provider, subject)
);
CREATE INDEX IF NOT EXISTS user_oauth_by_user ON user_oauth(user_id);
CREATE TABLE IF NOT EXISTS user_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('verify','reset')),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS user_tokens_by_user ON user_tokens(user_id);
CREATE TABLE IF NOT EXISTS role_audit (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_kind     TEXT NOT NULL CHECK (actor_kind IN ('admin','script')),
  actor_id       INTEGER,
  target_kind    TEXT NOT NULL DEFAULT 'user' CHECK (target_kind IN ('user','admin')),
  target_user_id INTEGER NOT NULL,
  action         TEXT NOT NULL DEFAULT 'role' CHECK (action IN ('role','disable','enable')),
  old_role       TEXT,
  new_role       TEXT,
  at             INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS role_audit_by_at ON role_audit(at DESC);
CREATE TABLE IF NOT EXISTS admin_roles (
  admin_id INTEGER PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  role     TEXT NOT NULL CHECK (role IN ('superadmin','admin','editor'))
);
`

/** WebAuthn "user handle" — PII deyil, istifadəçiyə sabit 16 bayt. */
const userHandle = (userId) => crypto.createHash('sha256').update(`muslims.cc/webauthn-user/${userId}`).digest().subarray(0, 16)

// ─── DB əməliyyatları ─────────────────────────────────────────────────
function createUsersStore(db) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    byEmail: p('SELECT * FROM users WHERE email = ?'),
    byId: p('SELECT * FROM users WHERE id = ?'),
    insert: p(`INSERT INTO users (email, email_verified, pass_hash, display_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', ?, ?)`),
    setPass: p('UPDATE users SET pass_hash = ?, updated_at = ? WHERE id = ?'),
    setVerified: p('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?'),
    setName: p('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?'),
    setRole: p('UPDATE users SET role = ?, mosque_id = ?, updated_at = ? WHERE id = ?'),
    setDisabled: p('UPDATE users SET disabled = ?, updated_at = ? WHERE id = ?'),
    touchLogin: p('UPDATE users SET last_login_at = ? WHERE id = ?'),
    del: p('DELETE FROM users WHERE id = ?'),
    count: p(`SELECT COUNT(*) AS n FROM users WHERE (? = '' OR email LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\')`),
    list: p(`SELECT id, email, email_verified, display_name, role, mosque_id, disabled, created_at, last_login_at FROM users
      WHERE (? = '' OR email LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\') ORDER BY id DESC LIMIT ? OFFSET ?`),

    newSession: p('INSERT INTO user_sessions (id_hash, user_id, expires_at, created_at, ua) VALUES (?, ?, ?, ?, ?)'),
    session: p(`SELECT s.id_hash, s.user_id, s.expires_at, u.* FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.id_hash = ?`),
    renew: p('UPDATE user_sessions SET expires_at = ? WHERE id_hash = ?'),
    delSession: p('DELETE FROM user_sessions WHERE id_hash = ?'),
    delSessionsOf: p('DELETE FROM user_sessions WHERE user_id = ?'),
    delOtherSessions: p('DELETE FROM user_sessions WHERE user_id = ? AND id_hash <> ?'),
    sessionsOf: p('SELECT id_hash, expires_at, created_at, ua FROM user_sessions WHERE user_id = ? AND expires_at > ? ORDER BY expires_at DESC'),
    trimSessions: p(`DELETE FROM user_sessions WHERE user_id = ? AND id_hash NOT IN
      (SELECT id_hash FROM user_sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT ?)`),
    purgeSessions: p('DELETE FROM user_sessions WHERE expires_at <= ?'),

    newToken: p('INSERT INTO user_tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, ?, ?)'),
    token: p('SELECT user_id, kind, expires_at FROM user_tokens WHERE token_hash = ?'),
    delToken: p('DELETE FROM user_tokens WHERE token_hash = ?'),
    delTokensOf: p('DELETE FROM user_tokens WHERE user_id = ? AND kind = ?'),
    purgeTokens: p('DELETE FROM user_tokens WHERE expires_at <= ?'),

    passkeysOf: p('SELECT id, name, transports, created_at, last_used_at FROM user_passkeys WHERE user_id = ? ORDER BY created_at'),
    passkey: p('SELECT * FROM user_passkeys WHERE id = ?'),
    addPasskey: p(`INSERT INTO user_passkeys (id, user_id, public_key, counter, transports, name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`),
    usePasskey: p('UPDATE user_passkeys SET counter = ?, last_used_at = ? WHERE id = ?'),
    delPasskey: p('DELETE FROM user_passkeys WHERE id = ? AND user_id = ?'),
    countPasskeys: p('SELECT COUNT(*) AS n FROM user_passkeys WHERE user_id = ?'),

    oauth: p('SELECT user_id FROM user_oauth WHERE provider = ? AND subject = ?'),
    addOauth: p('INSERT INTO user_oauth (provider, subject, user_id, created_at) VALUES (?, ?, ?, ?)'),
    providersOf: p('SELECT DISTINCT provider FROM user_oauth WHERE user_id = ? ORDER BY provider'),

    audit: p(`INSERT INTO role_audit (actor_kind, actor_id, target_kind, target_user_id, action, old_role, new_role, at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
    auditList: p(`SELECT r.id, r.actor_kind, r.actor_id, a.email AS actor_email, r.target_kind, r.target_user_id,
      CASE r.target_kind WHEN 'user' THEN u.email ELSE ta.email END AS target_email,
      r.action, r.old_role, r.new_role, r.at
      FROM role_audit r
      LEFT JOIN admins a ON r.actor_kind = 'admin' AND a.id = r.actor_id
      LEFT JOIN users u ON r.target_kind = 'user' AND u.id = r.target_user_id
      LEFT JOIN admins ta ON r.target_kind = 'admin' AND ta.id = r.target_user_id
      ORDER BY r.id DESC LIMIT ? OFFSET ?`),

    adminRole: p('SELECT role FROM admin_roles WHERE admin_id = ?'),
    setAdminRole: p('INSERT INTO admin_roles (admin_id, role) VALUES (?, ?) ON CONFLICT(admin_id) DO UPDATE SET role = excluded.role'),
    adminByEmail: p('SELECT id, email FROM admins WHERE email = ?'),
  }
  const sha = auth.sha256
  const newRandom = () => crypto.randomBytes(32).toString('base64url')
  const audit = (actorKind, actorId, targetKind, targetId, action, oldRole, newRole, now) =>
    st.audit.run(actorKind, actorId ?? null, targetKind, targetId, action, oldRole ?? null, newRole ?? null, now)

  return {
    ROLES,
    findByEmail: (email) => st.byEmail.get(auth.normEmail(email)) || null,
    byId: (id) => st.byId.get(id) || null,

    /** → user id. Mövcud e-poçtda Error('exists'). passHash — artıq hash-lənmiş (və ya null). */
    createUser({ email, passHash = null, displayName = '', emailVerified = false }, now = Date.now()) {
      const e = email == null ? null : auth.normEmail(email)
      if (e !== null && !auth.validEmail(e)) throw new Error('bad email')
      try {
        return Number(st.insert.run(e, emailVerified ? 1 : 0, passHash, displayName || '', now, now).lastInsertRowid)
      } catch (err) {
        if (/UNIQUE/i.test(String(err && err.message))) throw new Error('exists')
        throw err
      }
    },
    setPasswordHash: (id, hash, now = Date.now()) => st.setPass.run(hash, now, id).changes > 0,
    markVerified: (id, now = Date.now()) => st.setVerified.run(now, id).changes > 0,
    setDisplayName: (id, name, now = Date.now()) => st.setName.run(name, now, id).changes > 0,
    touchLogin: (id, now = Date.now()) => st.touchLogin.run(now, id),
    deleteUser: (id) => st.del.run(id).changes > 0,   // sessiyalar, passkey-lər, oauth, tokenlər — CASCADE

    // ── Sessiyalar ──
    createSession(userId, ua = '', now = Date.now()) {
      const token = newRandom()
      tx(() => {
        st.newSession.run(sha(token), userId, now + SESSION_TTL_MS, now, String(ua || '').slice(0, 60))
        st.trimSessions.run(userId, userId, MAX_SESSIONS)
      })
      return token
    },
    /** token → { user, renewed } | null. Vaxtı keçmiş və ya bloklanmış — null. Gündə bir uzadılır. */
    sessionUser(token, now = Date.now()) {
      if (typeof token !== 'string' || !TOKEN_RE.test(token)) return null
      const h = sha(token)
      const row = st.session.get(h)
      if (!row) return null
      if (row.expires_at <= now || row.disabled) { st.delSession.run(h); return null }
      let renewed = false
      if (row.expires_at - now < SESSION_TTL_MS - RENEW_EVERY_MS) { st.renew.run(now + SESSION_TTL_MS, h); renewed = true }
      const user = { ...row }
      delete user.id_hash; delete user.user_id; delete user.expires_at
      return { user, sessionHash: h, renewed }
    },
    destroySession: (token) => (typeof token === 'string' ? st.delSession.run(sha(token)).changes > 0 : false),
    revokeAllSessions: (userId) => st.delSessionsOf.run(userId).changes,
    revokeOtherSessions: (userId, keepHash) => st.delOtherSessions.run(userId, keepHash || '').changes,
    /** Sessiya siyahısı: id — id_hash-in ilk 16 simvolu (token deyil, tokenin heşinin hissəsi). */
    listSessions: (userId, currentHash, now = Date.now()) => st.sessionsOf.all(userId, now).map((s) => ({
      id: s.id_hash.slice(0, 16), label: s.ua || '', createdAt: s.created_at,
      lastSeenAt: s.expires_at - SESSION_TTL_MS, current: s.id_hash === currentHash,
    })),
    revokeSessionById(userId, id, now = Date.now()) {
      if (typeof id !== 'string' || !/^[0-9a-f]{16}$/.test(id)) return false
      const s = st.sessionsOf.all(userId, now).find((x) => x.id_hash.slice(0, 16) === id)
      return s ? st.delSession.run(s.id_hash).changes > 0 : false
    },
    purgeExpired: (now = Date.now()) => st.purgeSessions.run(now).changes + st.purgeTokens.run(now).changes,

    // ── Birdəfəlik tokenlər (verify | reset) ──
    createToken(userId, kind, now = Date.now()) {
      const token = newRandom()
      tx(() => {
        st.delTokensOf.run(userId, kind)                      // köhnə keçidlər etibarsız olsun
        st.newToken.run(sha(token), userId, kind, now + (kind === 'reset' ? RESET_TTL_MS : VERIFY_TTL_MS))
      })
      return token
    },
    /** Tokeni İSTİFADƏ ET (silinir). → user_id | null. */
    consumeToken(token, kind, now = Date.now()) {
      if (typeof token !== 'string' || !TOKEN_RE.test(token)) return null
      const h = sha(token)
      return tx(() => {
        const row = st.token.get(h)
        if (!row || row.kind !== kind) return null
        st.delToken.run(h)
        return row.expires_at > now ? row.user_id : null
      })
    },
    deleteTokensOf: (userId, kind) => st.delTokensOf.run(userId, kind).changes,

    // ── Passkey-lər ──
    listPasskeys: (userId) => st.passkeysOf.all(userId).map((k) => ({ id: k.id, name: k.name, createdAt: k.created_at, lastUsedAt: k.last_used_at ?? null })),
    passkeyRows: (userId) => st.passkeysOf.all(userId),
    getPasskey: (id) => st.passkey.get(id) || null,
    countPasskeys: (userId) => st.countPasskeys.get(userId).n,
    addPasskey({ id, userId, publicKey, counter = 0, transports = [], name = '' }, now = Date.now()) {
      st.addPasskey.run(id, userId, Buffer.from(publicKey), counter, JSON.stringify(transports || []), name, now)
    },
    usePasskey: (id, counter, now = Date.now()) => st.usePasskey.run(counter, now, id),
    removePasskey: (userId, id) => st.delPasskey.run(id, userId).changes > 0,

    // ── OAuth ──
    oauthUser: (provider, subject) => { const r = st.oauth.get(provider, subject); return r ? r.user_id : null },
    linkOauth: (provider, subject, userId, now = Date.now()) => st.addOauth.run(provider, subject, userId, now),
    /** Yeni istifadəçi (e-poçt provayder tərəfindən təsdiqlənib) + bağlantı — bir tranzaksiyada. */
    createOauthUser(provider, subject, { email, displayName = '' }, now = Date.now()) {
      return tx(() => {
        const id = Number(st.insert.run(auth.normEmail(email), 1, null, displayName, now, now).lastInsertRowid)
        st.addOauth.run(provider, subject, id, now)
        return id
      })
    },
    providersOf: (userId) => st.providersOf.all(userId).map((r) => r.provider),

    // ── Rollar ──
    /** İstifadəçi rolunu dəyiş + audit (yoxlamalar çağırandadır). */
    setUserRole(userId, role, mosqueId, actor, now = Date.now()) {
      if (!ROLES.includes(role)) throw new Error('bad role')
      return tx(() => {
        const u = st.byId.get(userId)
        if (!u) return null
        const mid = role === 'mosque_rep' ? (mosqueId || u.mosque_id || null) : null
        st.setRole.run(role, mid, now, userId)
        audit(actor.kind, actor.id, 'user', userId, 'role', u.role, role, now)
        return st.byId.get(userId)
      })
    },
    setDisabled(userId, disabled, actor, now = Date.now()) {
      return tx(() => {
        const u = st.byId.get(userId)
        if (!u) return null
        st.setDisabled.run(disabled ? 1 : 0, now, userId)
        if (disabled) st.delSessionsOf.run(userId)
        audit(actor.kind, actor.id, 'user', userId, disabled ? 'disable' : 'enable', u.role, u.role, now)
        return st.byId.get(userId)
      })
    },
    /** Admin paneli hesabının rolu; admin_roles-da sətir yoxdursa 'admin'. */
    adminRole: (adminId) => { const r = adminId == null ? null : st.adminRole.get(adminId); return r ? r.role : 'admin' },
    /** YALNIZ skript üçün (HTTP-də yoxdur). */
    setAdminRole(adminEmail, role, now = Date.now()) {
      if (!ADMIN_PANEL_ROLES.includes(role)) throw new Error('bad role')
      return tx(() => {
        const a = st.adminByEmail.get(auth.normEmail(adminEmail))
        if (!a) return null
        const old = st.adminRole.get(a.id)
        st.setAdminRole.run(a.id, role)
        audit('script', null, 'admin', a.id, 'role', old ? old.role : 'admin', role, now)
        return { id: a.id, email: a.email, role }
      })
    },
    listUsers({ q = '', page = 1 } = {}) {
      const term = typeof q === 'string' ? q.trim().slice(0, 100) : ''
      const like = '%' + term.replace(/[\\%_]/g, (c) => '\\' + c) + '%'
      const pg = Math.max(1, Math.min(10000, Math.floor(Number(page)) || 1))
      const rows = st.list.all(term, like, like, PAGE_SIZE, (pg - 1) * PAGE_SIZE)
      return {
        page: pg, pageSize: PAGE_SIZE, total: st.count.get(term, like, like).n,
        users: rows.map((u) => ({
          id: u.id, email: u.email, emailVerified: u.email_verified === 1, displayName: u.display_name,
          role: u.role, mosqueId: u.mosque_id || null, disabled: u.disabled === 1,
          createdAt: u.created_at, lastLoginAt: u.last_login_at ?? null,
        })),
      }
    },
    listAudit({ page = 1 } = {}) {
      const pg = Math.max(1, Math.min(10000, Math.floor(Number(page)) || 1))
      return {
        page: pg, pageSize: PAGE_SIZE,
        entries: st.auditList.all(PAGE_SIZE, (pg - 1) * PAGE_SIZE).map((r) => ({
          id: r.id, actorKind: r.actor_kind, actorId: r.actor_id ?? null, actorEmail: r.actor_email || null,
          targetKind: r.target_kind, targetId: r.target_user_id, targetEmail: r.target_email || null,
          action: r.action, oldRole: r.old_role, newRole: r.new_role, at: r.at,
        })),
      }
    },
  }
}

// ─── Rol qaydaları (saf funksiyalar — testlənir) ──────────────────────
/** → null (olar) | səbəb kodu. actorRole — admin panelinin rolu. */
function roleChangeError({ actorRole, actorEmail, target, newRole }) {
  if (!ROLES.includes(newRole)) return 'bad_role'
  if (rank(actorRole) < rank('admin')) return 'forbidden'
  if (actorEmail && target.email && auth.normEmail(actorEmail) === auth.normEmail(target.email)) return 'self'
  if (newRole === 'superadmin' || target.role === 'superadmin') return 'script_only'
  if ((newRole === 'admin' || target.role === 'admin') && actorRole !== 'superadmin') return 'superadmin_required'
  return null
}
function disableError({ actorRole, actorEmail, target }) {
  if (rank(actorRole) < rank('admin')) return 'forbidden'
  if (actorEmail && target.email && auth.normEmail(actorEmail) === auth.normEmail(target.email)) return 'self'
  if (target.role === 'superadmin') return 'script_only'
  if (target.role === 'admin' && actorRole !== 'superadmin') return 'superadmin_required'
  return null
}

// ─── Google ID tokeni (GIS "credential") — SDK-sız yoxlama ─────────────
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const GOOGLE_ISS = ['accounts.google.com', 'https://accounts.google.com']

function createGoogleVerifier({ clientId, fetchImpl = (...a) => fetch(...a), now = () => Date.now(), jwksUrl = GOOGLE_JWKS_URL }) {
  let keys = new Map(), expiresAt = 0, lastFetch = 0, inflight = null
  async function load(force) {
    const t = now()
    if (!force && keys.size && t < expiresAt) return
    if (force && t - lastFetch < 60 * 1000) return                    // naməlum kid ilə JWKS-i döymək olmaz
    if (inflight) return inflight
    inflight = (async () => {
      lastFetch = t
      const r = await fetchImpl(jwksUrl, { signal: AbortSignal.timeout(5000) })
      if (!r.ok) throw new Error('jwks ' + r.status)
      const j = await r.json()
      const m = new Map()
      for (const k of (j && Array.isArray(j.keys) ? j.keys : [])) {
        if (k && k.kty === 'RSA' && typeof k.kid === 'string' && (!k.alg || k.alg === 'RS256')) {
          try { m.set(k.kid, crypto.createPublicKey({ key: { kty: 'RSA', n: k.n, e: k.e }, format: 'jwk' })) } catch { /* pozuq açar */ }
        }
      }
      const cc = /max-age=(\d+)/.exec((r.headers && r.headers.get && r.headers.get('cache-control')) || '')
      const ttl = Math.min(24 * 3600, Math.max(300, cc ? Number(cc[1]) : 3600)) * 1000
      if (m.size) { keys = m; expiresAt = now() + ttl }
    })().finally(() => { inflight = null })
    return inflight
  }
  /** → payload | null (heç vaxt atmır, şəbəkə xətası istisna — o 'unavailable' üçün atır). */
  return async function verify(jwt) {
    if (!clientId) return null
    if (typeof jwt !== 'string' || jwt.length > 4096) return null
    const parts = jwt.split('.')
    if (parts.length !== 3 || !parts.every((x) => B64U_RE.test(x))) return null
    let header, payload
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    } catch { return null }
    if (!header || header.alg !== 'RS256' || typeof header.kid !== 'string') return null
    await load(false)
    let key = keys.get(header.kid)
    if (!key) { await load(true); key = keys.get(header.kid) }
    if (!key) return null
    const ok = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, Buffer.from(parts[2], 'base64url'))
    if (!ok || !payload || typeof payload !== 'object') return null
    const t = Math.floor(now() / 1000)
    const SKEW = 60
    if (!GOOGLE_ISS.includes(payload.iss)) return null
    if (payload.aud !== clientId) return null
    if (typeof payload.exp !== 'number' || payload.exp + SKEW < t) return null
    if (typeof payload.iat === 'number' && payload.iat - SKEW > t) return null
    if (typeof payload.nbf === 'number' && payload.nbf - SKEW > t) return null
    if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255) return null
    if (payload.email_verified !== true && payload.email_verified !== 'true') return null
    if (typeof payload.email !== 'string' || !auth.validEmail(auth.normEmail(payload.email))) return null
    return payload
  }
}

// ─── Router ───────────────────────────────────────────────────────────
/**
 * opts:
 *  db, store?           — createUsersStore(db) (verilməyibsə yaradılır)
 *  requireAdmin         — server/auth.js createRequireAdmin (admin endpoint-ləri üçün)
 *  allowedOrigins       — CSRF/CORS siyahısı
 *  mailer               — server/mailer.js createMailer()
 *  publicOrigin         — məktub keçidləri və WebAuthn origin (susmaya görə https://muslims.cc)
 *  rpId, expectedOrigins — WebAuthn (susmaya görə publicOrigin-in hostu)
 *  googleClientId       — yoxdursa /auth/google → 503 google_disabled
 *  webauthn             — @simplewebauthn/server (testlərdə saxta; verilməyibsə require)
 *  googleVerify, fetchImpl, limits, now
 *  hooks                — { beforeDeleteUser(id), passkeyRemoved(userId, credId), passwordReset(userId) }:
 *                         hesaba bağlı sinxronizasiya (server/syncKeys.js) — blok və açar qabları təmizlənsin
 */
function createUsersRouter(opts) {
  const {
    db, requireAdmin, allowedOrigins = [], mailer = null, limits = {}, now = () => Date.now(),
    publicOrigin = 'https://muslims.cc', googleClientId = '',
  } = opts
  const store = opts.store || createUsersStore(db)
  const hooks = opts.hooks || {}
  // Qarmaq xətası əsas əməliyyatı dayandırmır (məs. köhnə bazada cədvəl yoxdur)
  const hook = (name, ...args) => { try { if (typeof hooks[name] === 'function') hooks[name](...args) } catch (e) { console.error(`users hook ${name}:`, e && e.message) } }
  const rpId = opts.rpId || new URL(publicOrigin).hostname
  const expectedOrigins = opts.expectedOrigins || [...new Set([publicOrigin, ...allowedOrigins.filter((o) => {
    try { const h = new URL(o).hostname; return h === rpId || h.endsWith('.' + rpId) } catch { return false }
  })])]
  const webauthn = opts.webauthn || require('@simplewebauthn/server')
  const googleVerify = opts.googleVerify || createGoogleVerifier({ clientId: googleClientId, fetchImpl: opts.fetchImpl, now })

  // Limitlər (yaddaşda; açar — duzlu heş, IP saxlanmır)
  const W15 = 15 * 60 * 1000, H1 = 3600 * 1000
  const L = (name, max, windowMs) => auth.createFailureLimiter({ max: limits[name] || max, windowMs: limits.windowMs || windowMs })
  const lim = {
    loginIp: L('loginIp', 20, W15), loginEmail: L('loginEmail', 5, W15),
    register: L('register', 10, H1), forgotIp: L('forgotIp', 10, H1), forgotEmail: L('forgotEmail', 3, H1),
    token: L('token', 20, W15), google: L('google', 20, W15), passkeyOpts: L('passkeyOpts', 60, W15),
    passkeyFail: L('passkeyFail', 20, W15), userAction: L('userAction', 5, W15), resend: L('resend', 3, H1),
  }
  const salt = crypto.randomBytes(16)
  const ipKey = (req) => crypto.createHmac('sha256', salt).update(String(req.ip || '')).digest('base64url').slice(0, 22)
  const emKey = (e) => crypto.createHmac('sha256', salt).update(e).digest('base64url').slice(0, 22)
  const tooMany = (res, ...pairs) => {
    for (const [l, k] of pairs) {
      if (l.blocked(k)) { res.set('Retry-After', String(l.retryAfterSec(k))); res.status(429).json({ error: 'Too many attempts', code: 'rate_limited' }); return true }
    }
    return false
  }

  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const setCookie = (res, token, maxAgeMs) =>
    res.append('Set-Cookie', `${USER_COOKIE}=${token}; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}; HttpOnly; Secure; SameSite=Strict`)
  const startSession = (req, res, user) => {
    const token = store.createSession(user.id, uaLabel(req.headers['user-agent']), now())
    store.touchLogin(user.id, now())
    setCookie(res, token, SESSION_TTL_MS)
    return token
  }
  const meOf = (u) => ({
    id: u.id, email: u.email, emailVerified: u.email_verified === 1, displayName: u.display_name,
    role: u.role, mosqueId: u.mosque_id || null, hasPassword: Boolean(u.pass_hash),
    passkeys: store.listPasskeys(u.id), providers: store.providersOf(u.id),
  })
  const sendMail = (kind, lang, to, path, token) => {
    if (!mailer || !to) return
    const ml = mailLang(lang)
    const p = (ml === 'az' ? '' : '/' + ml) + path                       // keçid məktubun dilində açılsın
    const url = token ? `${publicOrigin}${p}#token=${token}` : `${publicOrigin}${p}`
    Promise.resolve(mailer.sendTemplate(kind, ml, to, { url })).catch(() => {})   // gözləmirik — cavab vaxtı fərqlənməsin
  }

  const requireUser = createRequireUser({ store, allowedOrigins, now, setCookie })

  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const bigJson = express.json({ limit: '64kb' })   // WebAuthn cavabları
  router.use('/auth', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (auth.csrfRejected(req, allowedOrigins)) return err(res, 403, 'forbidden', 'Forbidden')
    next()
  })

  // ── Qeydiyyat ──
  router.post('/auth/register', json, async (req, res) => {
    const b = req.body || {}
    const email = auth.normEmail(b.email)
    const name = cleanName(b.displayName)
    if (!auth.validEmail(email) || typeof b.password !== 'string' || name === null) return err(res, 400, 'bad_request', 'Bad request')
    if (weakPassword(b.password, email)) return err(res, 400, 'weak_password', 'Weak password')
    const ik = 'r:' + ipKey(req)
    if (tooMany(res, [lim.register, ik])) return
    lim.register.fail(ik)
    try {
      const hash = await auth.hashPassword(b.password, { min: MIN_PASSWORD })   // mövcud e-poçtda da (vaxt eyni olsun)
      const existing = store.findByEmail(email)
      if (existing) {
        // Hesabın varlığı açılmır: "poçtu yoxlayın" + sahibinə xəbərdarlıq
        if (!existing.disabled) sendMail('exists', b.lang, existing.email, '/account', null)
        return res.status(202).json({ ok: true, checkEmail: true })
      }
      let id
      try { id = store.createUser({ email, passHash: hash, displayName: name }, now()) } catch (e) {
        if (e.message === 'exists') return res.status(202).json({ ok: true, checkEmail: true })
        throw e
      }
      const user = store.byId(id)
      startSession(req, res, user)
      if (mailer) sendMail('verify', b.lang, email, '/account/verify', store.createToken(id, 'verify', now()))
      return res.status(201).json({ ok: true, user: meOf(user), verificationSent: Boolean(mailer && mailer.enabled) })
    } catch (e) {
      console.error('register error:', e && e.message)
      return err(res, 500, 'server_error', 'Server error')
    }
  })

  // ── Giriş / çıxış ──
  router.post('/auth/login', json, async (req, res) => {
    const b = req.body || {}
    const email = auth.normEmail(b.email)
    if (!auth.validEmail(email) || typeof b.password !== 'string' || !b.password || b.password.length > MAX_PASSWORD) {
      return err(res, 400, 'bad_request', 'Bad request')
    }
    const ik = 'l:' + ipKey(req), ek = 'l:' + emKey(email)
    if (tooMany(res, [lim.loginIp, ik], [lim.loginEmail, ek])) return
    try {
      const u = store.findByEmail(email)
      const ok = await auth.verifyPassword(b.password, u && u.pass_hash ? u.pass_hash : await auth.dummyHash())
      if (!u || !u.pass_hash || !ok || u.disabled) {
        lim.loginIp.fail(ik); lim.loginEmail.fail(ek)
        return err(res, 401, 'invalid_credentials', 'Invalid credentials')
      }
      lim.loginEmail.reset(ek)
      startSession(req, res, u)
      return res.json({ ok: true, user: meOf(store.byId(u.id)) })
    } catch (e) {
      console.error('login error:', e && e.message)
      return err(res, 500, 'server_error', 'Server error')
    }
  })

  router.post('/auth/logout', (req, res) => {
    const token = auth.parseCookies(req.headers.cookie)[USER_COOKIE]
    if (token) store.destroySession(token)
    setCookie(res, '', 0)
    res.json({ ok: true })
  })

  router.get('/auth/me', requireUser(), (req, res) => res.json(meOf(req.user)))

  // ── E-poçt təsdiqi ──
  router.post('/auth/verify', json, (req, res) => {
    const ik = 't:' + ipKey(req)
    if (tooMany(res, [lim.token, ik])) return
    const uid = store.consumeToken(req.body && req.body.token, 'verify', now())
    if (!uid) { lim.token.fail(ik); return err(res, 400, 'invalid_token', 'Invalid or expired link') }
    store.markVerified(uid, now())
    res.json({ ok: true })
  })
  router.post('/auth/verify/resend', requireUser(), json, (req, res) => {
    const u = req.user
    if (u.email_verified === 1 || !u.email) return res.json({ ok: true })
    const k = 'v:' + u.id
    if (tooMany(res, [lim.resend, k])) return
    lim.resend.fail(k)
    sendMail('verify', req.body && req.body.lang, u.email, '/account/verify', store.createToken(u.id, 'verify', now()))
    res.json({ ok: true })
  })

  // ── Şifrə bərpası ──
  router.post('/auth/forgot', json, (req, res) => {
    const b = req.body || {}
    const email = auth.normEmail(b.email)
    if (!auth.validEmail(email)) return err(res, 400, 'bad_request', 'Bad request')
    const ik = 'f:' + ipKey(req), ek = 'f:' + emKey(email)
    if (tooMany(res, [lim.forgotIp, ik])) return
    lim.forgotIp.fail(ik)
    // e-poçt limiti dolubsa da 200 (səssizcə göndərmirik) — cavab eyni qalsın
    if (!lim.forgotEmail.blocked(ek)) {
      lim.forgotEmail.fail(ek)
      const u = store.findByEmail(email)
      if (u && !u.disabled && u.email) sendMail('reset', b.lang, u.email, '/account/reset', store.createToken(u.id, 'reset', now()))
    }
    res.json({ ok: true })
  })

  router.post('/auth/reset', json, async (req, res) => {
    const b = req.body || {}
    const ik = 't:' + ipKey(req)
    if (tooMany(res, [lim.token, ik])) return
    if (typeof b.password !== 'string' || b.password.length > MAX_PASSWORD) return err(res, 400, 'bad_request', 'Bad request')
    if (typeof b.token !== 'string' || !TOKEN_RE.test(b.token)) { lim.token.fail(ik); return err(res, 400, 'invalid_token', 'Invalid or expired link') }
    if (weakPassword(b.password)) return err(res, 400, 'weak_password', 'Weak password')   // token hələ istifadə olunmayıb
    try {
      const hash = await auth.hashPassword(b.password, { min: MIN_PASSWORD })
      const uid = store.consumeToken(b.token, 'reset', now())
      const u = uid && store.byId(uid)
      if (!u || u.disabled) { lim.token.fail(ik); return err(res, 400, 'invalid_token', 'Invalid or expired link') }
      store.setPasswordHash(uid, hash, now())
      store.markVerified(uid, now())          // poçta çıxışı sübut olundu
      store.revokeAllSessions(uid)
      hook('passwordReset', uid)              // köhnə şifrə ilə şifrələnmiş sinxronizasiya açarı artıq açılmır
      res.json({ ok: true })
    } catch (e) {
      console.error('reset error:', e && e.message)
      return err(res, 500, 'server_error', 'Server error')
    }
  })

  // ── Hesab idarəsi (daxil olmuş istifadəçi) ──
  router.post('/auth/password', requireUser(), json, async (req, res) => {
    const b = req.body || {}
    const u = req.user
    if (typeof b.next !== 'string' || (b.current != null && typeof b.current !== 'string')) return err(res, 400, 'bad_request', 'Bad request')
    if (weakPassword(b.next, u.email)) return err(res, 400, 'weak_password', 'Weak password')
    const k = 'a:' + u.id
    if (tooMany(res, [lim.userAction, k])) return
    try {
      if (u.pass_hash) {
        if (!(await auth.verifyPassword(b.current || '', u.pass_hash))) { lim.userAction.fail(k); return err(res, 400, 'wrong_password', 'Wrong password') }
        if (await auth.verifyPassword(b.next, u.pass_hash)) return err(res, 400, 'same_password', 'Same password')
      }
      const hash = await auth.hashPassword(b.next, { min: MIN_PASSWORD })
      store.setPasswordHash(u.id, hash, now())
      store.revokeOtherSessions(u.id, req.userSessionHash)
      lim.userAction.reset(k)
      res.json({ ok: true })
    } catch (e) {
      console.error('password error:', e && e.message)
      return err(res, 500, 'server_error', 'Server error')
    }
  })

  router.patch('/auth/profile', requireUser(), json, (req, res) => {
    const name = cleanName(req.body && req.body.displayName)
    if (name === null || !req.body || req.body.displayName === undefined) return err(res, 400, 'bad_request', 'Bad request')
    store.setDisplayName(req.user.id, name, now())
    res.json(meOf(store.byId(req.user.id)))
  })

  router.get('/auth/sessions', requireUser(), (req, res) => {
    res.json({ sessions: store.listSessions(req.user.id, req.userSessionHash, now()) })
  })
  router.post('/auth/sessions/revoke', requireUser(), json, (req, res) => {
    const b = req.body || {}
    if (b.all === true) {
      const n = store.revokeOtherSessions(req.user.id, req.userSessionHash)   // cari qalır (çıxış — /logout)
      return res.json({ ok: true, revoked: n })
    }
    if (typeof b.id !== 'string') return err(res, 400, 'bad_request', 'Bad request')
    const ok = store.revokeSessionById(req.user.id, b.id, now())
    if (!ok) return err(res, 404, 'not_found', 'Not found')
    if (b.id === req.userSessionHash.slice(0, 16)) setCookie(res, '', 0)
    res.json({ ok: true, revoked: 1 })
  })

  router.post('/auth/delete', requireUser(), json, async (req, res) => {
    const b = req.body || {}
    const u = req.user
    const k = 'a:' + u.id
    if (tooMany(res, [lim.userAction, k])) return
    if (u.pass_hash) {
      if (typeof b.password !== 'string' || b.password.length > MAX_PASSWORD || !(await auth.verifyPassword(b.password, u.pass_hash))) {
        lim.userAction.fail(k)
        return err(res, 400, 'wrong_password', 'Wrong password')
      }
    } else if (b.confirm !== 'DELETE') {
      return err(res, 400, 'confirm_required', 'Confirmation required')
    }
    hook('beforeDeleteUser', u.id)           // hesaba bağlı şifrəli sinxronizasiya bloku da silinsin
    store.deleteUser(u.id)
    setCookie(res, '', 0)
    res.json({ ok: true })
  })

  // ── Passkey (WebAuthn) ──
  const challenges = new Map()   // challengeId → { challenge, kind, userId, exp }
  const putChallenge = (kind, challenge, userId) => {
    const t = now()
    if (challenges.size > 5000) for (const [k, v] of challenges) if (v.exp <= t) challenges.delete(k)
    if (challenges.size > 10000) challenges.delete(challenges.keys().next().value)
    const id = crypto.randomBytes(18).toString('base64url')
    challenges.set(id, { challenge, kind, userId, exp: t + CHALLENGE_TTL_MS })
    return id
  }
  const takeChallenge = (id, kind) => {
    if (typeof id !== 'string' || id.length !== 24) return null
    const c = challenges.get(id)
    if (!c) return null
    challenges.delete(id)                                   // birdəfəlik
    return c.kind === kind && c.exp > now() ? c : null
  }
  const validCred = (r) => r && typeof r === 'object' && typeof r.id === 'string' && r.id.length <= 1400 && B64U_RE.test(r.id) &&
    r.type === 'public-key' && r.response && typeof r.response === 'object'
  const passkeyLimited = (req, res) => {
    const ik = 'p:' + ipKey(req)
    if (tooMany(res, [lim.passkeyOpts, ik], [lim.passkeyFail, 'pf:' + ik])) return true
    lim.passkeyOpts.fail(ik)
    return false
  }
  const passkeyFail = (req) => lim.passkeyFail.fail('pf:p:' + ipKey(req))

  router.post('/auth/passkey/register/options', requireUser(), async (req, res) => {
    if (passkeyLimited(req, res)) return
    const u = req.user
    if (store.countPasskeys(u.id) >= MAX_PASSKEYS) return err(res, 400, 'too_many_passkeys', 'Too many passkeys')
    try {
      const options = await webauthn.generateRegistrationOptions({
        rpName: 'Muslims.cc', rpID: rpId,
        userName: u.email || `user-${u.id}`, userDisplayName: u.display_name || u.email || '',
        userID: new Uint8Array(userHandle(u.id)),
        attestationType: 'none',
        excludeCredentials: store.passkeyRows(u.id).map((k) => ({ id: k.id, transports: safeJson(k.transports, []) })),
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        timeout: CHALLENGE_TTL_MS,
      })
      res.json({ challengeId: putChallenge('reg', options.challenge, u.id), options })
    } catch (e) {
      console.error('passkey reg options error:', e && e.message)
      err(res, 500, 'server_error', 'Server error')
    }
  })

  router.post('/auth/passkey/register/verify', requireUser(), bigJson, async (req, res) => {
    const b = req.body || {}
    const u = req.user
    const c = takeChallenge(b.challengeId, 'reg')
    if (!c || c.userId !== u.id || !validCred(b.response)) { passkeyFail(req); return err(res, 400, 'passkey_failed', 'Passkey verification failed') }
    const name = cleanName(b.name)
    if (name === null) return err(res, 400, 'bad_request', 'Bad request')
    if (store.countPasskeys(u.id) >= MAX_PASSKEYS) return err(res, 400, 'too_many_passkeys', 'Too many passkeys')
    try {
      const v = await webauthn.verifyRegistrationResponse({
        response: b.response, expectedChallenge: c.challenge, expectedOrigin: expectedOrigins, expectedRPID: rpId,
        requireUserVerification: true,
      })
      const cred = v && v.verified && v.registrationInfo && v.registrationInfo.credential
      if (!cred || typeof cred.id !== 'string' || !B64U_RE.test(cred.id)) { passkeyFail(req); return err(res, 400, 'passkey_failed', 'Passkey verification failed') }
      if (store.getPasskey(cred.id)) return err(res, 409, 'passkey_exists', 'Passkey already registered')
      store.addPasskey({
        id: cred.id, userId: u.id, publicKey: cred.publicKey, counter: cred.counter || 0,
        transports: Array.isArray(cred.transports) ? cred.transports.filter((x) => typeof x === 'string').slice(0, 8) : [],
        name: name || uaLabel(req.headers['user-agent']) || 'Passkey',
      }, now())
      res.json({ ok: true, passkeys: store.listPasskeys(u.id) })
    } catch (e) {
      passkeyFail(req)
      console.error('passkey reg verify:', e && e.message)
      err(res, 400, 'passkey_failed', 'Passkey verification failed')
    }
  })

  router.post('/auth/passkey/login/options', async (req, res) => {
    if (passkeyLimited(req, res)) return
    try {
      // Usernameless: allowCredentials boşdur — brauzer saytın passkey-lərini özü təklif edir
      const options = await webauthn.generateAuthenticationOptions({ rpID: rpId, userVerification: 'required', timeout: CHALLENGE_TTL_MS })
      res.json({ challengeId: putChallenge('auth', options.challenge, null), options })
    } catch (e) {
      console.error('passkey auth options error:', e && e.message)
      err(res, 500, 'server_error', 'Server error')
    }
  })

  router.post('/auth/passkey/login/verify', bigJson, async (req, res) => {
    const b = req.body || {}
    const ik = 'pf:p:' + ipKey(req)
    if (tooMany(res, [lim.passkeyFail, ik])) return
    const c = takeChallenge(b.challengeId, 'auth')
    const fail = () => { lim.passkeyFail.fail(ik); return err(res, 401, 'passkey_failed', 'Passkey verification failed') }
    if (!c || !validCred(b.response)) return fail()
    const pk = store.getPasskey(b.response.id)
    const u = pk && store.byId(pk.user_id)
    if (!pk || !u || u.disabled) return fail()
    const uh = b.response.response.userHandle
    if (uh != null && (typeof uh !== 'string' || uh !== Buffer.from(userHandle(u.id)).toString('base64url'))) return fail()
    try {
      const v = await webauthn.verifyAuthenticationResponse({
        response: b.response, expectedChallenge: c.challenge, expectedOrigin: expectedOrigins, expectedRPID: rpId,
        credential: { id: pk.id, publicKey: new Uint8Array(pk.public_key), counter: pk.counter, transports: safeJson(pk.transports, []) },
        requireUserVerification: true,
      })
      if (!v || !v.verified) return fail()
      store.usePasskey(pk.id, Number(v.authenticationInfo && v.authenticationInfo.newCounter) || 0, now())
      startSession(req, res, u)
      res.json({ ok: true, user: meOf(store.byId(u.id)) })
    } catch (e) {
      console.error('passkey auth verify:', e && e.message)
      return fail()
    }
  })

  router.post('/auth/passkey/remove', requireUser(), json, (req, res) => {
    const id = req.body && req.body.id
    const u = req.user
    if (typeof id !== 'string' || id.length > 1400) return err(res, 400, 'bad_request', 'Bad request')
    const mine = store.passkeyRows(u.id)
    if (!mine.some((k) => k.id === id)) return err(res, 404, 'not_found', 'Not found')
    // Son giriş yolunu silmək olmaz (şifrə yox, Google yox, son passkey)
    if (!u.pass_hash && !store.providersOf(u.id).length && mine.length <= 1) return err(res, 400, 'last_method', 'Cannot remove the last sign-in method')
    store.removePasskey(u.id, id)
    hook('passkeyRemoved', u.id, id)
    res.json({ ok: true, passkeys: store.listPasskeys(u.id) })
  })

  // ── Google ──
  router.post('/auth/google', json, async (req, res) => {
    if (!googleClientId) return err(res, 503, 'google_disabled', 'Google sign-in is not configured')
    const ik = 'g:' + ipKey(req)
    if (tooMany(res, [lim.google, ik])) return
    let p
    try { p = await googleVerify(req.body && req.body.credential) } catch (e) {
      console.error('google jwks:', e && e.message)
      return err(res, 503, 'google_unavailable', 'Google sign-in is temporarily unavailable')
    }
    if (!p) { lim.google.fail(ik); return err(res, 401, 'google_invalid', 'Invalid Google credential') }
    try {
      const email = auth.normEmail(p.email)
      let uid = store.oauthUser('google', p.sub)
      let created = false
      if (!uid) {
        const existing = store.findByEmail(email)
        if (existing) {
          if (existing.disabled) { lim.google.fail(ik); return err(res, 401, 'google_invalid', 'Invalid Google credential') }
          // Əvvəlcədən ələ keçirmə hücumu: kimsə qurbanın e-poçtu ilə TƏSDİQSİZ hesab açıb.
          // Belə hesaba Google-u avtomatik bağlamırıq.
          if (existing.email_verified !== 1) return err(res, 409, 'link_requires_verification', 'Verify your email or reset your password first, then sign in with Google')
          store.linkOauth('google', p.sub, existing.id, now())
          uid = existing.id
        } else {
          const name = cleanName(typeof p.name === 'string' ? [...p.name].slice(0, MAX_NAME).join('') : '') || ''
          uid = store.createOauthUser('google', p.sub, { email, displayName: name }, now())
          created = true
        }
      }
      const u = store.byId(uid)
      if (!u || u.disabled) { lim.google.fail(ik); return err(res, 401, 'google_invalid', 'Invalid Google credential') }
      startSession(req, res, u)
      res.status(created ? 201 : 200).json({ ok: true, created, user: meOf(store.byId(uid)) })
    } catch (e) {
      console.error('google login error:', e && e.message)
      err(res, 500, 'server_error', 'Server error')
    }
  })

  // ── Admin: istifadəçi idarəsi (admin paneli sessiyası + admin_roles) ──
  if (requireAdmin) {
    const adminRole = (min) => (req, res, next) => {
      res.set('Cache-Control', 'no-store')
      if (!req.adminUser || req.adminUser.via !== 'session') return err(res, 403, 'session_required', 'Session required')
      const role = store.adminRole(req.adminUser.id)
      if (rank(role) < rank(min)) return err(res, 403, 'forbidden', 'Forbidden')
      req.adminRole = role
      next()
    }
    const userIdParam = (req) => { const n = Number(req.params.id); return Number.isSafeInteger(n) && n > 0 ? n : null }
    const adminView = (u) => ({
      id: u.id, email: u.email, emailVerified: u.email_verified === 1, displayName: u.display_name, role: u.role,
      mosqueId: u.mosque_id || null, disabled: u.disabled === 1, createdAt: u.created_at, lastLoginAt: u.last_login_at ?? null,
    })

    router.get('/admin/users', requireAdmin, adminRole('admin'), (req, res) => {
      res.json(store.listUsers({ q: req.query.q, page: req.query.page }))
    })
    router.post('/admin/users/:id/role', requireAdmin, adminRole('admin'), json, (req, res) => {
      const id = userIdParam(req)
      const b = req.body || {}
      const target = id && store.byId(id)
      if (!target) return err(res, 404, 'not_found', 'Not found')
      if (b.mosqueId != null && (typeof b.mosqueId !== 'string' || !MOSQUE_RE.test(b.mosqueId))) return err(res, 400, 'bad_request', 'Bad request')
      const why = roleChangeError({ actorRole: req.adminRole, actorEmail: req.adminUser.email, target, newRole: b.role })
      if (why) return err(res, why === 'bad_role' ? 400 : 403, why, 'Forbidden')
      const u = store.setUserRole(id, b.role, b.mosqueId || null, { kind: 'admin', id: req.adminUser.id }, now())
      res.json({ ok: true, user: adminView(u) })
    })
    router.post('/admin/users/:id/disable', requireAdmin, adminRole('admin'), json, (req, res) => {
      const id = userIdParam(req)
      const b = req.body || {}
      const target = id && store.byId(id)
      if (!target) return err(res, 404, 'not_found', 'Not found')
      if (typeof b.disabled !== 'boolean') return err(res, 400, 'bad_request', 'Bad request')
      const why = disableError({ actorRole: req.adminRole, actorEmail: req.adminUser.email, target })
      if (why) return err(res, 403, why, 'Forbidden')
      const u = store.setDisabled(id, b.disabled, { kind: 'admin', id: req.adminUser.id }, now())
      res.json({ ok: true, user: adminView(u) })
    })
    router.get('/admin/role-audit', requireAdmin, adminRole('admin'), (req, res) => {
      res.json(store.listAudit({ page: req.query.page }))
    })
  }

  router.requireUser = requireUser
  router.store = store
  return router
}

function safeJson(s, fallback) { try { const v = JSON.parse(s); return Array.isArray(v) ? v : fallback } catch { return fallback } }

/**
 * requireUser(minRole = 'user') — gələcək xüsusiyyətlər üçün middleware.
 * Uğurlu: req.user (users sətri, pass_hash daxil — cavaba QOYMAYIN), req.userSessionHash.
 * 401 { code:'unauthenticated' } | 403 { code:'forbidden' } (CSRF və ya rol).
 */
function createRequireUser({ store, allowedOrigins = [], now = () => Date.now(), setCookie = null }) {
  const set = setCookie || ((res, token, ms) => res.append('Set-Cookie',
    `${USER_COOKIE}=${token}; Path=/; Max-Age=${Math.floor(ms / 1000)}; HttpOnly; Secure; SameSite=Strict`))
  return function requireUser(minRole = 'user') {
    if (!ROLES.includes(minRole)) throw new Error('unknown role: ' + minRole)
    return function requireUserMw(req, res, next) {
      res.set('Cache-Control', 'no-store')
      const token = auth.parseCookies(req.headers.cookie)[USER_COOKIE]
      const s = token ? store.sessionUser(token, now()) : null
      if (!s) return res.status(401).json({ error: 'Unauthorized', code: 'unauthenticated' })
      if (auth.csrfRejected(req, allowedOrigins)) return res.status(403).json({ error: 'Forbidden', code: 'forbidden' })
      if (rank(s.user.role) < rank(minRole)) return res.status(403).json({ error: 'Forbidden', code: 'forbidden' })
      if (s.renewed) set(res, token, SESSION_TTL_MS)
      req.user = s.user
      req.userSessionHash = s.sessionHash
      next()
    }
  }
}

module.exports = {
  USER_COOKIE, SESSION_TTL_MS, MIN_PASSWORD, ROLES, ADMIN_PANEL_ROLES,
  createUsersStore, createUsersRouter, createRequireUser, createGoogleVerifier,
  roleChangeError, disableError, weakPassword, uaLabel, userHandle,
}
