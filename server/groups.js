// ═══════════════════════════════════════════════════════════════════════
// Qrup xətmi və ortaq hədəflər — hesabsız "otaqlar"
//
//   POST /api/groups                       { type:'khatm'|'goal', title, lang, goal? } → 201 { id, adminKey }
//   GET  /api/groups/:id                   → ictimai görünüş (sirr YOXDUR)
//   — Xətm (30 cüz) —
//   PATCH /api/groups/:id/claim            { juz, name }            → { token }
//   POST  /api/groups/:id/done             { juz, token, done? }    → { ok, completed }
//   POST  /api/groups/:id/release          { juz, token }           → { ok }
//   — Hədəf (N gün) —
//   POST  /api/groups/:id/join             { name }                 → { pid, token }
//   POST  /api/groups/:id/tick             { pid, token, date, on? }→ { ok, ticks }
//   POST  /api/groups/:id/leave            { pid, token }           → { ok }
//   — Otağı yaradan (adminKey) —
//   POST  /api/groups/:id/admin            { adminKey, action, juz?, pid? } → { ok }
//         action: check | reset | remove | close | reopen | delete
//
// Saxlama: docs cədvəli, collection 'groups', otaq başına bir sənəd.
// Sirlər (adminKey, iştirakçı tokenləri) yalnız SHA-256 həşi ilə saxlanır.
// Məxfilik: yalnız istifadəçinin yazdığı görünən ad saxlanır; IP, cookie,
// brauzer məlumatı SAXLANMIR (limit sayğacı yalnız yaddaşdadır).
// Ömür: son fəaliyyətdən 180 gün sonra otaq silinir (dövri təmizləmə).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const crypto = require('node:crypto')

const COLLECTION = 'groups'
const TYPES = ['khatm', 'goal']
const GOAL_KINDS = ['fajr-40', 'custom']
const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const JUZ = 30
const MAX_PARTICIPANTS = 60
const MAX_TITLE = 80
const MAX_NAME = 40
const MAX_DAYS = 365
const ID_LEN = 10
const KEY_LEN = 24
const PID_LEN = 8
const MAX_ROOMS = 20000
const DAY_MS = 86400e3
const EXPIRE_MS = 180 * DAY_MS
const CLEANUP_MS = 6 * 3600e3
const LIMITS = {
  create: { max: 10, windowMs: 3600e3 },
  write: { max: 120, windowMs: 10 * 60e3 },
}

// İdarəedici simvollar + bidi istiqamət simvolları (ad saxtakarlığına qarşı)
const CTRL_RE = /[\u0000-\u001F\u007F-\u009F‎‏‪-‮⁦-⁩]/g
const str = (v, max) => (typeof v === 'string' ? v.replace(CTRL_RE, '').replace(/\s+/g, ' ').trim().slice(0, max) : '')

// ID-lər kiçik hərf + rəqəm (URL-də böyük/kiçik hərf qarışıqlığı olmasın)
const ID_ABC = 'abcdefghijklmnopqrstuvwxyz0123456789'
const KEY_ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function randStr(len, abc) {
  // Rədd seçimi: meylsiz
  const lim = 256 - (256 % abc.length)
  let s = ''
  while (s.length < len) {
    for (const b of crypto.randomBytes(len * 2)) {
      if (b < lim) s += abc[b % abc.length]
      if (s.length === len) break
    }
  }
  return s
}
const ID_RE = new RegExp(`^[a-z0-9]{${ID_LEN}}$`)
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
function sameHash(secret, h) {
  if (typeof secret !== 'string' || !secret || secret.length > 64 || typeof h !== 'string') return false
  const a = Buffer.from(hash(secret), 'hex')
  const b = Buffer.from(h, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const dayNum = (iso) => {
  if (!DATE_RE.test(iso)) return NaN
  const t = Date.parse(iso + 'T00:00:00Z')
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === iso ? Math.floor(t / DAY_MS) : NaN
}

/** Yaratma gövdəsini yoxla → saxlanacaq sənədin ictimai hissəsi | null */
function validCreate(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null
  if (!TYPES.includes(b.type)) return null
  const title = str(b.title, MAX_TITLE)
  if (title.length < 2) return null
  const out = { type: b.type, title, lang: LANGS.includes(b.lang) ? b.lang : 'az', closed: false }
  if (b.type === 'khatm') {
    out.khatm = { round: 1, completions: 0, completedAt: null, juz: Array(JUZ).fill(null) }
  } else {
    const g = b.goal && typeof b.goal === 'object' ? b.goal : null
    if (!g || !GOAL_KINDS.includes(g.kind)) return null
    if (g.kind === 'fajr-40') out.goal = { kind: 'fajr-40', days: 40, label: '' }
    else {
      const days = Number(g.days)
      const label = str(g.label, MAX_TITLE)
      if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS || label.length < 2) return null
      out.goal = { kind: 'custom', days, label }
    }
    out.participants = []
  }
  return out
}

/** Sənəd → ictimai görünüş (həşlər çıxarılır) */
function publicView(doc) {
  const v = {
    id: doc.id, type: doc.type, title: doc.title, lang: doc.lang, closed: !!doc.closed,
    createdAt: doc.createdAt, lastActivity: doc.lastActivity,
  }
  if (doc.type === 'khatm') {
    const k = doc.khatm
    v.khatm = {
      round: k.round, completions: k.completions, completedAt: k.completedAt,
      juz: k.juz.map((j, i) => ({ n: i + 1, name: j ? j.name : null, done: !!(j && j.done) })),
    }
  } else {
    v.goal = { ...doc.goal }
    v.participants = doc.participants.map(p => ({ pid: p.pid, name: p.name, ticks: p.ticks, joinedAt: p.joinedAt }))
  }
  return v
}

function createGroupsRouter({ db, now = () => Date.now(), limits = LIMITS, cleanupMs = CLEANUP_MS } = {}) {
  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const buckets = { create: new Map(), write: new Map() }   // ip → [ms, …] (yalnız yaddaşda)

  const limited = (kind, ip) => {
    const { max, windowMs } = limits[kind]
    const map = buckets[kind]
    const t = now()
    const list = (map.get(ip) || []).filter(x => t - x < windowMs)
    if (list.length >= max) { map.set(ip, list); return true }
    list.push(t)
    map.set(ip, list)
    if (map.size > 10000) map.clear()
    return false
  }
  const limit = (kind) => (req, res, next) => (limited(kind, req.ip || '') ? res.status(429).json({ error: 'Limit' }) : next())

  const expired = (doc) => now() - (doc.lastActivity || doc.createdAt || 0) > EXPIRE_MS
  const load = (id) => {
    if (!ID_RE.test(id)) return null
    const doc = db.getDoc(COLLECTION, id)
    if (!doc || expired(doc)) return null
    return doc
  }
  const save = (doc) => {
    const { id, ...data } = doc
    data.lastActivity = now()
    db.setDoc(COLLECTION, id, data, data.lastActivity)
  }

  /** Köhnəlmiş otaqları sil → silinən say */
  function purgeExpired() {
    let n = 0
    for (const doc of db.listDocs(COLLECTION)) {
      if (expired(doc) && db.deleteDoc(COLLECTION, doc.id)) n++
    }
    return n
  }
  if (cleanupMs > 0) {
    const t = setInterval(() => { try { purgeExpired() } catch { /* */ } }, cleanupMs)
    if (t.unref) t.unref()
  }

  const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next() }
  const body = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {})

  // Otağı yüklə; yazı əməliyyatları üçün bağlı otaq 423
  const room = (needOpen) => (req, res, next) => {
    const doc = load(req.params.id)
    if (!doc) return res.status(404).json({ error: 'not found' })
    if (needOpen && doc.closed) return res.status(423).json({ error: 'closed' })
    req.room = doc
    next()
  }
  const ofType = (type) => (req, res, next) => (req.room.type === type ? next() : res.status(400).json({ error: 'wrong type' }))
  const juzOf = (b) => {
    const n = Number(b.juz)
    return Number.isInteger(n) && n >= 1 && n <= JUZ ? n : 0
  }

  router.post('/groups', noStore, limit('create'), json, (req, res) => {
    const data = validCreate(req.body)
    if (!data) return res.status(400).json({ error: 'invalid' })
    if (db.countDocs(COLLECTION) >= MAX_ROOMS) return res.status(503).json({ error: 'full' })
    let id
    do { id = randStr(ID_LEN, ID_ABC) } while (db.getDoc(COLLECTION, id))
    const adminKey = randStr(KEY_LEN, KEY_ABC)
    const t = now()
    db.setDoc(COLLECTION, id, { ...data, adminHash: hash(adminKey), lastActivity: t, createdAt: t }, t)
    res.status(201).json({ id, adminKey })
  })

  router.get('/groups/:id', noStore, room(false), (req, res) => {
    res.json(publicView(req.room))
  })

  // ── Xətm ──
  router.patch('/groups/:id/claim', noStore, limit('write'), json, room(true), ofType('khatm'), (req, res) => {
    const b = body(req)
    const n = juzOf(b)
    const name = str(b.name, MAX_NAME)
    if (!n || !name) return res.status(400).json({ error: 'invalid' })
    const k = req.room.khatm
    if (k.completedAt) return res.status(409).json({ error: 'completed' })
    if (k.juz[n - 1]) return res.status(409).json({ error: 'taken' })
    const names = new Set(k.juz.filter(Boolean).map(j => j.name.toLocaleLowerCase()))
    names.add(name.toLocaleLowerCase())
    if (names.size > MAX_PARTICIPANTS) return res.status(409).json({ error: 'full' })
    const token = randStr(KEY_LEN, KEY_ABC)
    k.juz[n - 1] = { name, th: hash(token), done: false, at: now() }
    save(req.room)
    res.json({ token })
  })

  router.post('/groups/:id/done', noStore, limit('write'), json, room(true), ofType('khatm'), (req, res) => {
    const b = body(req)
    const n = juzOf(b)
    if (!n) return res.status(400).json({ error: 'invalid' })
    const k = req.room.khatm
    const j = k.juz[n - 1]
    if (!j || !sameHash(b.token, j.th)) return res.status(403).json({ error: 'forbidden' })
    if (k.completedAt) return res.status(409).json({ error: 'completed' })
    j.done = b.done !== false
    j.at = now()
    let completed = false
    if (k.juz.every(x => x && x.done)) {
      k.completedAt = now()
      k.completions = (k.completions || 0) + 1
      completed = true
    }
    save(req.room)
    res.json({ ok: true, completed })
  })

  router.post('/groups/:id/release', noStore, limit('write'), json, room(true), ofType('khatm'), (req, res) => {
    const b = body(req)
    const n = juzOf(b)
    if (!n) return res.status(400).json({ error: 'invalid' })
    const k = req.room.khatm
    const j = k.juz[n - 1]
    if (!j || !sameHash(b.token, j.th)) return res.status(403).json({ error: 'forbidden' })
    if (k.completedAt) return res.status(409).json({ error: 'completed' })
    k.juz[n - 1] = null
    save(req.room)
    res.json({ ok: true })
  })

  // ── Hədəf ──
  const member = (req, res) => {
    const b = body(req)
    const p = req.room.participants.find(x => x.pid === b.pid)
    if (!p || !sameHash(b.token, p.th)) { res.status(403).json({ error: 'forbidden' }); return null }
    return p
  }

  router.post('/groups/:id/join', noStore, limit('write'), json, room(true), ofType('goal'), (req, res) => {
    const name = str(body(req).name, MAX_NAME)
    if (!name) return res.status(400).json({ error: 'invalid' })
    const ps = req.room.participants
    if (ps.length >= MAX_PARTICIPANTS) return res.status(409).json({ error: 'full' })
    const token = randStr(KEY_LEN, KEY_ABC)
    let pid
    do { pid = randStr(PID_LEN, ID_ABC) } while (ps.some(p => p.pid === pid))
    ps.push({ pid, name, th: hash(token), ticks: [], joinedAt: now() })
    save(req.room)
    res.json({ pid, token })
  })

  router.post('/groups/:id/tick', noStore, limit('write'), json, room(true), ofType('goal'), (req, res) => {
    const p = member(req, res)
    if (!p) return
    const b = body(req)
    const d = dayNum(String(b.date || ''))
    // İstifadəçinin yerli tarixi: bu gün (saat qurşağı ±1) və ya dünən (unudubsa)
    const diff = d - Math.floor(now() / DAY_MS)
    if (!Number.isFinite(d) || diff < -2 || diff > 1) return res.status(400).json({ error: 'date' })
    const on = b.on !== false
    const has = p.ticks.includes(b.date)
    if (on && !has) {
      if (p.ticks.length >= req.room.goal.days) return res.status(409).json({ error: 'complete' })
      p.ticks.push(b.date)
      p.ticks.sort()
    } else if (!on && has) {
      p.ticks = p.ticks.filter(x => x !== b.date)
    }
    save(req.room)
    res.json({ ok: true, ticks: p.ticks })
  })

  router.post('/groups/:id/leave', noStore, limit('write'), json, room(false), ofType('goal'), (req, res) => {
    const p = member(req, res)
    if (!p) return
    req.room.participants = req.room.participants.filter(x => x !== p)
    save(req.room)
    res.json({ ok: true })
  })

  // ── Otağı yaradan ──
  router.post('/groups/:id/admin', noStore, limit('write'), json, room(false), (req, res) => {
    const b = body(req)
    const doc = req.room
    if (!sameHash(b.adminKey, doc.adminHash)) return res.status(403).json({ error: 'forbidden' })
    switch (b.action) {
      case 'check':
        return res.json({ ok: true })
      case 'delete':
        db.deleteDoc(COLLECTION, doc.id)
        return res.json({ ok: true })
      case 'close':
      case 'reopen':
        doc.closed = b.action === 'close'
        break
      case 'reset':
        if (doc.type === 'khatm') {
          doc.khatm.juz = Array(JUZ).fill(null)
          doc.khatm.completedAt = null
          doc.khatm.round = (doc.khatm.round || 1) + 1
        } else {
          for (const p of doc.participants) p.ticks = []
        }
        break
      case 'remove':
        if (doc.type === 'khatm') {
          const n = juzOf(b)
          if (!n) return res.status(400).json({ error: 'invalid' })
          if (doc.khatm.completedAt) return res.status(409).json({ error: 'completed' })
          doc.khatm.juz[n - 1] = null
        } else {
          const before = doc.participants.length
          doc.participants = doc.participants.filter(p => p.pid !== b.pid)
          if (doc.participants.length === before) return res.status(404).json({ error: 'not found' })
        }
        break
      default:
        return res.status(400).json({ error: 'invalid' })
    }
    save(doc)
    res.json({ ok: true })
  })

  // Pozuq JSON → 400 (ümumi xəta səhifəsi yox)
  router.use('/groups', (err, req, res, next) => {
    if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large')) {
      return res.status(err.status || 400).json({ error: 'invalid' })
    }
    next(err)
  })

  router.purgeExpired = purgeExpired
  return router
}

module.exports = {
  createGroupsRouter, validCreate, publicView,
  COLLECTION, MAX_PARTICIPANTS, MAX_TITLE, MAX_NAME, EXPIRE_MS, LIMITS, ID_LEN, KEY_LEN,
}
