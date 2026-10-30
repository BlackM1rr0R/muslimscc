// ═══════════════════════════════════════════════════════════════════════
// Admin girişi — e-poçt + şifrə, Firebase Auth-suz (docs/FIREBASE-EXIT.md)
//
// • Şifrə: crypto.scrypt (N=2^15, r=8, p=1, 64 bayt), duz 16 bayt — asılılıqsız.
//   Saxlanma formatı: scrypt$<N>$<r>$<p>$<duz b64url>$<hash b64url>
// • Sessiya: təsadüfi 32 bayt token → cookie; DB-də YALNIZ SHA-256-sı saxlanır
//   (baza oğurlansa belə sessiyanı oğurlamaq olmur). Cookie:
//   __Host-mcc_admin; HttpOnly; Secure; SameSite=Strict; Path=/; 30 gün.
// • Login rate-limit: IP və e-poçt üzrə uğursuz cəhdlər (susmaya görə IP 10,
//   e-poçt 5 / 15 dəq). Naməlum e-poçtda da scrypt işləyir — cavab vaxtından
//   hesabın olub-olmadığı bilinmir; müqayisə timingSafeEqual ilə.
// • CSRF: cookie SameSite=Strict + vəziyyət dəyişən sorğularda Origin (varsa)
//   icazəli siyahıda olmalı VƏ "X-Requested-With" başlığı olmalıdır (bu
//   başlığı başqa sayt CORS preflight-sız göndərə bilməz, CORS isə onu rədd edir).
// • KEÇİD DÖVRÜ: requireAdmin köhnə Firebase ID tokenini də (Authorization:
//   Bearer) qəbul edir — klient (2-ci mərhələ) keçənə qədər admin paneli işləsin.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const { promisify } = require('node:util')
const express = require('express')

const scryptAsync = promisify(crypto.scrypt)

const COOKIE_NAME = '__Host-mcc_admin'
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64 }
const MIN_PASSWORD = 12
const MAX_PASSWORD = 1024
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/

const b64u = (buf) => Buffer.from(buf).toString('base64url')
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')
const scryptOpts = (N, r, p) => ({ N, r, p, maxmem: 128 * N * r * 2 })

const normEmail = (e) => (typeof e === 'string' ? e.trim().toLowerCase() : '')
const validEmail = (e) => EMAIL_RE.test(e) && e.length <= 254

/** Şifrə → saxlanma sətri. */
async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    throw new Error(`Şifrə ${MIN_PASSWORD}-${MAX_PASSWORD} simvol olmalıdır`)
  }
  const { N, r, p, keylen } = SCRYPT
  const salt = crypto.randomBytes(16)
  const hash = await scryptAsync(password.normalize('NFKC'), salt, keylen, scryptOpts(N, r, p))
  return `scrypt$${N}$${r}$${p}$${b64u(salt)}$${b64u(hash)}`
}

/** Şifrə saxlanmış hash-ə uyğundurmu? Format səhvdirsə false (atmır). */
async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > MAX_PASSWORD || typeof stored !== 'string') return false
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const N = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3])
  if (![N, r, p].every(Number.isInteger) || N < 2 || N > 2 ** 20 || r < 1 || r > 32 || p < 1 || p > 16) return false
  const salt = Buffer.from(parts[4], 'base64url')
  const expected = Buffer.from(parts[5], 'base64url')
  if (!salt.length || expected.length < 16) return false
  const got = await scryptAsync(password.normalize('NFKC'), salt, expected.length, scryptOpts(N, r, p))
  return crypto.timingSafeEqual(got, expected)
}

// Naməlum e-poçt üçün eyni dəyərdə scrypt işi (vaxt fərqi olmasın)
let dummyHashPromise = null
const dummyHash = () => (dummyHashPromise ||= hashPassword(crypto.randomBytes(24).toString('hex')))

// ─── Sadə yaddaşdaxili rate-limit (uğursuz cəhdlər) ───────────────────
function createFailureLimiter({ max, windowMs }) {
  const hits = new Map()   // key → { n, resetAt }
  const sweep = (now) => { for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k) }
  return {
    blocked(key, now = Date.now()) {
      const h = hits.get(key)
      if (!h || h.resetAt <= now) return false
      return h.n >= max
    },
    retryAfterSec(key, now = Date.now()) {
      const h = hits.get(key)
      return h ? Math.max(1, Math.ceil((h.resetAt - now) / 1000)) : 0
    },
    fail(key, now = Date.now()) {
      if (hits.size > 10000) sweep(now)
      const h = hits.get(key)
      if (!h || h.resetAt <= now) hits.set(key, { n: 1, resetAt: now + windowMs })
      else h.n++
    },
    reset(key) { hits.delete(key) },
  }
}

// ─── Cookie ───────────────────────────────────────────────────────────
function parseCookies(header) {
  const out = {}
  if (typeof header !== 'string') return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 1) continue
    const k = part.slice(0, i).trim()
    if (!(k in out)) out[k] = part.slice(i + 1).trim()
  }
  return out
}

function sessionCookie(token, maxAgeSec) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; Secure; SameSite=Strict`
}

// ─── CSRF ─────────────────────────────────────────────────────────────
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const isLocalOrigin = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)

/** Vəziyyət dəyişən cookie-li sorğu başqa saytdan gələ bilərmi? true → rədd et. */
function csrfRejected(req, allowedOrigins) {
  if (SAFE_METHODS.has(req.method)) return false
  const origin = req.headers.origin
  if (origin && !(allowedOrigins.includes(origin) || isLocalOrigin(origin))) return true
  if (!req.headers['x-requested-with']) return true
  return false
}

// ─── DB əməliyyatları ─────────────────────────────────────────────────
function createAuthStore(db) {
  const raw = db.raw
  const st = {
    byEmail: raw.prepare('SELECT id, email, pass_hash FROM admins WHERE email = ?'),
    byId: raw.prepare('SELECT id, email FROM admins WHERE id = ?'),
    insert: raw.prepare('INSERT INTO admins (email, pass_hash, created_at, updated_at) VALUES (?, ?, ?, ?)'),
    setPass: raw.prepare('UPDATE admins SET pass_hash = ?, updated_at = ? WHERE email = ?'),
    del: raw.prepare('DELETE FROM admins WHERE email = ?'),
    list: raw.prepare(`SELECT a.id, a.email, a.created_at, a.updated_at,
      (SELECT COUNT(*) FROM sessions s WHERE s.admin_id = a.id AND s.expires_at > ?) AS sessions
      FROM admins a ORDER BY a.id`),
    newSession: raw.prepare('INSERT INTO sessions (id_hash, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)'),
    session: raw.prepare(`SELECT s.admin_id, s.expires_at, a.email FROM sessions s
      JOIN admins a ON a.id = s.admin_id WHERE s.id_hash = ?`),
    delSession: raw.prepare('DELETE FROM sessions WHERE id_hash = ?'),
    delSessionsOf: raw.prepare('DELETE FROM sessions WHERE admin_id = (SELECT id FROM admins WHERE email = ?)'),
    purge: raw.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  }
  return {
    findByEmail: (email) => st.byEmail.get(normEmail(email)) || null,
    async createAdmin(email, password, now = Date.now()) {
      const e = normEmail(email)
      if (!validEmail(e)) throw new Error('E-poçt yararsızdır')
      if (st.byEmail.get(e)) throw new Error('Bu e-poçtla admin artıq var')
      const hash = await hashPassword(password)
      return Number(st.insert.run(e, hash, now, now).lastInsertRowid)
    },
    /** Şifrəni dəyiş və BÜTÜN sessiyaları ləğv et. */
    async setPassword(email, password, now = Date.now()) {
      const e = normEmail(email)
      const hash = await hashPassword(password)
      return db.tx(() => {
        const ok = st.setPass.run(hash, now, e).changes > 0
        if (ok) st.delSessionsOf.run(e)
        return ok
      })
    },
    deleteAdmin: (email) => st.del.run(normEmail(email)).changes > 0,   // sessiyalar CASCADE ilə silinir
    listAdmins: (now = Date.now()) => st.list.all(now),
    createSession(adminId, now = Date.now()) {
      const token = crypto.randomBytes(32).toString('base64url')
      st.newSession.run(sha256(token), adminId, now + SESSION_TTL_MS, now)
      return token
    },
    /** token → { id, email } | null (vaxtı keçibsə silinir). */
    sessionUser(token, now = Date.now()) {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null
      const h = sha256(token)
      const s = st.session.get(h)
      if (!s) return null
      if (s.expires_at <= now) { st.delSession.run(h); return null }
      return { id: s.admin_id, email: s.email }
    },
    destroySession: (token) => (typeof token === 'string' ? st.delSession.run(sha256(token)).changes > 0 : false),
    purgeExpired: (now = Date.now()) => st.purge.run(now).changes,
    adminById: (id) => st.byId.get(id) || null,
  }
}

/**
 * requireAdmin middleware.
 *  verifyFirebaseToken — (idToken) => Promise<{uid,email}|null> — KEÇİD DÖVRÜ
 *  üçün; verilməyibsə yalnız yeni sessiya qəbul olunur.
 */
function createRequireAdmin({ store, allowedOrigins = [], verifyFirebaseToken = null }) {
  return async function requireAdmin(req, res, next) {
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME]
    if (token) {
      const user = store.sessionUser(token)
      if (user) {
        if (csrfRejected(req, allowedOrigins)) return res.status(403).json({ error: 'Forbidden' })
        req.adminUser = { id: user.id, email: user.email, via: 'session' }
        return next()
      }
    }
    // Köhnə yol: Firebase ID tokeni (Authorization: Bearer) — CSRF riski yoxdur
    const m = /^Bearer\s+(\S{20,4096})$/i.exec(req.headers.authorization || '')
    if (m && verifyFirebaseToken) {
      try {
        const u = await verifyFirebaseToken(m[1])
        if (u) { req.adminUser = { uid: u.uid, email: u.email || '', via: 'firebase' }; return next() }
        return res.status(403).json({ error: 'Forbidden' })
      } catch {
        return res.status(401).json({ error: 'Unauthorized' })
      }
    }
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

/**
 * /api/admin/login, /logout, /me.
 *  opts.limits — { ipMax, emailMax, windowMs } (testlər üçün dəyişilə bilər)
 */
function createAuthRouter({ store, requireAdmin, allowedOrigins = [], limits = {} }) {
  const windowMs = limits.windowMs || 15 * 60 * 1000
  const ipLimiter = createFailureLimiter({ max: limits.ipMax || 10, windowMs })
  const emailLimiter = createFailureLimiter({ max: limits.emailMax || 5, windowMs })
  const router = express.Router()
  const json = express.json({ limit: '4kb' })

  router.post('/admin/login', json, async (req, res) => {
    if (csrfRejected(req, allowedOrigins)) return res.status(403).json({ error: 'Forbidden' })
    const email = normEmail(req.body && req.body.email)
    const password = req.body && req.body.password
    if (!validEmail(email) || typeof password !== 'string' || !password || password.length > MAX_PASSWORD) {
      return res.status(400).json({ error: 'Bad request' })
    }
    const ipKey = 'ip:' + (req.ip || '')
    const emKey = 'em:' + email
    if (ipLimiter.blocked(ipKey) || emailLimiter.blocked(emKey)) {
      const wait = Math.max(ipLimiter.retryAfterSec(ipKey), emailLimiter.retryAfterSec(emKey))
      res.set('Retry-After', String(wait))
      return res.status(429).json({ error: 'Too many attempts' })
    }
    try {
      const admin = store.findByEmail(email)
      const ok = await verifyPassword(password, admin ? admin.pass_hash : await dummyHash())
      if (!admin || !ok) {
        ipLimiter.fail(ipKey)
        emailLimiter.fail(emKey)
        return res.status(401).json({ error: 'Invalid credentials' })
      }
      emailLimiter.reset(emKey)
      const token = store.createSession(admin.id)
      res.set('Set-Cookie', sessionCookie(token, Math.floor(SESSION_TTL_MS / 1000)))
      res.set('Cache-Control', 'no-store')
      return res.json({ ok: true, email: admin.email })
    } catch (e) {
      console.error('login error:', e && e.message)
      return res.status(500).json({ error: 'Server error' })
    }
  })

  router.post('/admin/logout', (req, res) => {
    if (csrfRejected(req, allowedOrigins)) return res.status(403).json({ error: 'Forbidden' })
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME]
    if (token) store.destroySession(token)
    res.set('Set-Cookie', sessionCookie('', 0))
    return res.json({ ok: true })
  })

  router.get('/admin/me', requireAdmin, (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json({ email: req.adminUser.email, via: req.adminUser.via })
  })

  return router
}

module.exports = {
  COOKIE_NAME, SESSION_TTL_MS, MIN_PASSWORD,
  hashPassword, verifyPassword, normEmail, validEmail,
  createFailureLimiter, parseCookies, sessionCookie, csrfRejected,
  createAuthStore, createRequireAdmin, createAuthRouter,
}
