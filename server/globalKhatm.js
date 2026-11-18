// ═══════════════════════════════════════════════════════════════════════
// "Ümmətin Canlı Xətmi" — bitməyən, ümumdünya xətmi (Mushafın 604 səhifəsi = bir dövr)
//
// • Daxil olmuş istifadəçi "Bir səhifə götür" → cari dövrün HƏLƏ GÖTÜRÜLMƏMİŞ ən kiçik nömrəli
//   səhifəsi ona verilir. İstifadəçinin eyni anda bir aktiv səhifəsi olur; 30 dəq ərzində
//   "Oxudum" demirsə səhifə hovuza qayıdır. Götürmə ATOMİKDİR: BEGIN IMMEDIATE + (round, page)
//   üzrə PRIMARY KEY — iki nəfər heç vaxt eyni səhifəni almır.
// • "Oxudum": server sahibliyi, götürmədən ən azı 40 san keçdiyini və istifadəçi üzrə saatda
//   60 səhifə həddini yoxlayır. Oxunmanın özü YOXLANMIR — niyyət sahibinindir (UI bunu açıq deyir).
// • 604 səhifənin hamısı oxunanda dövr TƏK BİR DƏFƏ tamamlanır (UPDATE … WHERE completed_at IS NULL)
//   və eyni əməliyyatda növbəti dövr açılır. Dövrün iddiaları (claims) yekunlaşdırılıb silinir —
//   qalan yalnız toplu rəqəmlərdir (iştirakçı sayı, ölkə sayı, ithaf sayı, müddət).
// • İthaf (istəyə bağlı): mərhum yaxının adı (≤ 40 simvol). HEÇ VAXT ictimai deyil — yalnız sahibi
//   /me-də görür; dövr bitəndə hamıya yalnız SAY göstərilir. Dövr bitdikdən 30 gün sonra silinir.
//   "Sevdiklərim üçün dua" siyahısından seçim — server/personal.js lovedNamesOf (yalnız həmin istifadəçi).
// • Yer: yalnız istifadəçi razılıq verib 1°-yə yuvarlaqlaşdırılmış xana göndərsə; xana yalnız iddianın
//   ömrü boyu saxlanır və "Oxudum" anında canlı axına bir dəfə çıxır (Kəbəyə işıq), sonra silinir.
//   Ölkə: Cloudflare CF-IPCountry — dövr üzrə ÇOXLUQ (kimin hansı ölkədən olduğu saxlanmır).
// • Canlı: GET /api/khatm/live — İCTİMAİ SSE (sirr yoxdur, yalnız toplu məlumat). Bağlantı həddi:
//   cəmi 2000, IP başına 4; 25 san keepalive; X-Accel-Buffering: no (nginx: location = /api/khatm/live).
// • Reytinq / şəxsi ictimai statistika YOXDUR (riya olmasın) — yalnız ümumi rəqəmlər.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır). Hesab silinəndə:
// iştirak və ithaflar CASCADE silinir; tamamlanmış səhifənin iddiası anonimləşir (user_id → NULL,
// dövrün sayı geri düşməsin), tamamlanmamış anonim iddia təmizləmədə silinir.
//
//   POST   /api/khatm/claim     (girişli) { dedication?, cell?: { lat, lon } } → { claim, existing }
//   GET    /api/khatm/me        (girişli) → { claim, rounds, dedications, loved, minReadMs, claimMs }
//   POST   /api/khatm/complete  (girişli) { page } → { ok, page, readCount, roundCompleted? }
//   POST   /api/khatm/release   (girişli) → { ok }
//   DELETE /api/khatm/dedications/:id (girişli) → { ok }
//   GET    /api/khatm/state     → { roundNo, startedAt, bits, readCount, active, total }
//   GET    /api/khatm/stats     → { roundNo, readCount, active, rounds } (yaddaşda 15 san keş)
//   GET    /api/khatm/rounds?page=N → { rounds, page, pages, total, ramadan }
//   GET    /api/khatm/live      → text/event-stream (event: hello | page | round | active)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const hijri = require('./hijri')
const { cleanLine } = require('./readTogether')

const PAGES = 604
const BYTES = Math.ceil(PAGES / 8)
const CLAIM_MS = 30 * 60e3
const MIN_READ_MS = 40e3
const MAX_DEDICATION = 40
const DEDICATION_KEEP_MS = 30 * 86400e3
const KEEPALIVE_MS = 25e3
const SWEEP_MS = 60e3
const STATS_TTL_MS = 15e3
const ACTIVE_THROTTLE_MS = 2000
const MAX_CONN_TOTAL = 2000
const MAX_CONN_PER_IP = 4
const ROUNDS_PER_PAGE = 20
const MAX_LOVED = 50
const LIMITS = {
  complete: { max: 60, windowMs: 3600e3 },   // istifadəçi üzrə: saatda 60 səhifə
  claim: { max: 120, windowMs: 3600e3 },     // istifadəçi üzrə: götür/burax dövrəsi
}
const COUNTRY_RE = /^[A-Z]{2}$/
const NOT_COUNTRIES = new Set(['XX', 'T1', 'EU', 'AP'])   // Cloudflare: naməlum, Tor, region kodları

const SCHEMA = `
CREATE TABLE IF NOT EXISTS khatm_rounds (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  no             INTEGER NOT NULL UNIQUE,
  started_at     INTEGER NOT NULL,
  completed_at   INTEGER,
  participants   INTEGER NOT NULL DEFAULT 0,
  countries_json TEXT NOT NULL DEFAULT '[]',
  dedications    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS khatm_rounds_by_completed ON khatm_rounds(completed_at);
CREATE TABLE IF NOT EXISTS khatm_claims (
  round_id     INTEGER NOT NULL REFERENCES khatm_rounds(id) ON DELETE CASCADE,
  page         INTEGER NOT NULL CHECK (page BETWEEN 1 AND 604),
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  claimed_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  completed_at INTEGER,
  cell         TEXT,
  dedication   TEXT,
  PRIMARY KEY (round_id, page)
);
CREATE INDEX IF NOT EXISTS khatm_claims_by_user ON khatm_claims(user_id, completed_at);
CREATE TABLE IF NOT EXISTS khatm_participants (
  round_id INTEGER NOT NULL REFERENCES khatm_rounds(id) ON DELETE CASCADE,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pages    INTEGER NOT NULL DEFAULT 0,
  notified INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (round_id, user_id)
);
CREATE INDEX IF NOT EXISTS khatm_participants_by_user ON khatm_participants(user_id, round_id);
CREATE TABLE IF NOT EXISTS khatm_dedications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round_id   INTEGER NOT NULL REFERENCES khatm_rounds(id) ON DELETE CASCADE,
  page       INTEGER NOT NULL,
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS khatm_dedications_by_user ON khatm_dedications(user_id);
CREATE INDEX IF NOT EXISTS khatm_dedications_by_round ON khatm_dedications(round_id);
`

// Bildiriş mətni (Web Push) — 5 dil; digər dillər ingiliscə
const PUSH_TEXT = {
  az: { title: 'Ümmətin xətmi tamamlandı', body: (no, n, c) => `Xətm №${no} tamamlandı — ${c} ölkədən ${n} nəfər. Sizin səhifəniz də oradadır.` },
  en: { title: 'The Ummah’s khatm is complete', body: (no, n, c) => `Khatm #${no} is complete: ${n} people from ${c} countries. Your page is part of it.` },
  ru: { title: 'Хатм уммы завершён', body: (no, n, c) => `Хатм №${no} завершён: ${n} человек из ${c} стран. Ваша страница — его часть.` },
  tr: { title: 'Ümmetin hatmi tamamlandı', body: (no, n, c) => `${no}. hatim tamamlandı: ${c} ülkeden ${n} kişi. Sizin sayfanız da onda.` },
  ar: { title: 'اكتملت ختمة الأمة', body: (no, n, c) => `اكتملت الختمة رقم ${no}: ${n} مشاركًا من ${c} دولة، وصفحتك جزء منها.` },
}

/** Uint8Array(76) → base64 (səhifə p → bit p-1) */
function encodeBits(pages) {
  const b = Buffer.alloc(BYTES)
  for (const p of pages) if (p >= 1 && p <= PAGES) b[(p - 1) >> 3] |= 1 << ((p - 1) & 7)
  return b.toString('base64')
}

/** { lat, lon } → "lat,lon" (1°-yə yuvarlaq) | null */
function cellOf(v) {
  if (!v || typeof v !== 'object') return null
  const lat = Number(v.lat), lon = Number(v.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  const la = Math.max(-89, Math.min(89, Math.round(lat)))
  let lo = Math.round(lon)
  if (lo === 180) lo = -180
  return `${la},${lo}`
}
const cellOut = (s) => {
  if (!s) return null
  const [lat, lon] = s.split(',').map(Number)
  return Number.isInteger(lat) && Number.isInteger(lon) ? { lat, lon } : null
}
const countryOf = (req) => {
  const c = String(req.headers['cf-ipcountry'] || '').trim().toUpperCase()
  return COUNTRY_RE.test(c) && !NOT_COUNTRIES.has(c) ? c : null
}
const parseList = (s) => { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v.filter((x) => COUNTRY_RE.test(x)) : [] } catch { return [] } }

/** UTC gününün başlanğıcı (ms) — { year, month, day } */
const utcDay = (g) => Date.UTC(g.year, g.month - 1, g.day)

/** Son (və ya cari) Ramazanın UTC aralığı: { year, start, end, current } */
function ramadanRange(ms) {
  const d = new Date(ms)
  const h = hijri.gregorianToHijri({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() })
  const year = h.month >= 9 ? h.year : h.year - 1
  const s = hijri.hijriToGregorian({ year, month: 9, day: 1 })
  const e = hijri.hijriToGregorian({ year, month: 10, day: 1 })
  if (!s || !e) return null
  return { year, start: utcDay(s), end: utcDay(e), current: h.month === 9 }
}

/**
 * opts: { db, requireUser, now?, limits?, sweepMs?, keepaliveMs?, statsTtlMs?, minReadMs?, claimMs?,
 *         lovedNames?(uid) → [string], pushSubsOf?(uid) → [sub], langOf?(uid) → 'az'|…,
 *         pushSend?(subs, msg, label) → Promise, publicOrigin?, log? }
 */
function createGlobalKhatmRouter(opts) {
  const {
    db, requireUser, now = () => Date.now(), limits = LIMITS, sweepMs = SWEEP_MS, keepaliveMs = KEEPALIVE_MS,
    statsTtlMs = STATS_TTL_MS, minReadMs = MIN_READ_MS, claimMs = CLAIM_MS, activeThrottleMs = ACTIVE_THROTTLE_MS,
    lovedNames = () => [], pushSubsOf = () => [], langOf = () => 'en', pushSend = null,
    publicOrigin = 'https://muslims.cc', log = console,
  } = opts
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => {
    raw.exec('BEGIN IMMEDIATE')
    try { const r = fn(); raw.exec('COMMIT'); return r } catch (e) { raw.exec('ROLLBACK'); throw e }
  })
  const p = (sql) => raw.prepare(sql)
  const st = {
    current: p('SELECT * FROM khatm_rounds WHERE completed_at IS NULL ORDER BY no DESC LIMIT 1'),
    lastNo: p('SELECT MAX(no) AS n FROM khatm_rounds'),
    newRound: p('INSERT INTO khatm_rounds (no, started_at) VALUES (?, ?)'),
    roundById: p('SELECT * FROM khatm_rounds WHERE id = ?'),
    finishRound: p(`UPDATE khatm_rounds SET completed_at = ?, participants = ?, countries_json = ?, dedications = ?
      WHERE id = ? AND completed_at IS NULL`),
    setCountries: p('UPDATE khatm_rounds SET countries_json = ? WHERE id = ?'),
    expire: p('DELETE FROM khatm_claims WHERE round_id = ? AND completed_at IS NULL AND expires_at <= ?'),
    expireAll: p('DELETE FROM khatm_claims WHERE completed_at IS NULL AND (expires_at <= ? OR user_id IS NULL)'),
    activeOf: p('SELECT c.*, r.no AS round_no FROM khatm_claims c JOIN khatm_rounds r ON r.id = c.round_id WHERE c.user_id = ? AND c.completed_at IS NULL ORDER BY c.claimed_at DESC LIMIT 1'),
    pagesOf: p('SELECT page FROM khatm_claims WHERE round_id = ?'),
    donePages: p('SELECT page FROM khatm_claims WHERE round_id = ? AND completed_at IS NOT NULL'),
    doneCount: p('SELECT COUNT(*) AS n FROM khatm_claims WHERE round_id = ? AND completed_at IS NOT NULL'),
    activeCount: p('SELECT COUNT(*) AS n FROM khatm_claims WHERE round_id = ? AND completed_at IS NULL AND expires_at > ?'),
    insertClaim: p(`INSERT INTO khatm_claims (round_id, page, user_id, claimed_at, expires_at, cell, dedication)
      VALUES (?, ?, ?, ?, ?, ?, ?)`),
    completeClaim: p(`UPDATE khatm_claims SET completed_at = ?, cell = NULL, dedication = NULL
      WHERE round_id = ? AND page = ? AND user_id = ? AND completed_at IS NULL AND expires_at > ?`),
    dropClaim: p('DELETE FROM khatm_claims WHERE round_id = ? AND page = ? AND user_id = ? AND completed_at IS NULL'),
    trimClaims: p('DELETE FROM khatm_claims WHERE round_id = ?'),
    participate: p(`INSERT INTO khatm_participants (round_id, user_id, pages) VALUES (?, ?, 1)
      ON CONFLICT(round_id, user_id) DO UPDATE SET pages = pages + 1`),
    participantCount: p('SELECT COUNT(*) AS n FROM khatm_participants WHERE round_id = ?'),
    toNotify: p('SELECT user_id FROM khatm_participants WHERE round_id = ? AND notified = 0'),
    notified: p('UPDATE khatm_participants SET notified = 1 WHERE round_id = ? AND user_id = ?'),
    myRounds: p(`SELECT r.*, pt.pages AS my_pages FROM khatm_participants pt JOIN khatm_rounds r ON r.id = pt.round_id
      WHERE pt.user_id = ? ORDER BY r.no DESC LIMIT 50`),
    addDedication: p('INSERT INTO khatm_dedications (user_id, round_id, page, name, created_at) VALUES (?, ?, ?, ?, ?)'),
    dedicationCount: p('SELECT COUNT(*) AS n FROM khatm_dedications WHERE round_id = ?'),
    myDedications: p(`SELECT d.id, d.name, d.page, d.created_at, r.no AS round_no, r.completed_at FROM khatm_dedications d
      JOIN khatm_rounds r ON r.id = d.round_id WHERE d.user_id = ? ORDER BY d.id DESC LIMIT 100`),
    delDedication: p('DELETE FROM khatm_dedications WHERE id = ? AND user_id = ?'),
    purgeDedications: p(`DELETE FROM khatm_dedications WHERE round_id IN
      (SELECT id FROM khatm_rounds WHERE completed_at IS NOT NULL AND completed_at <= ?)`),
    trimDone: p(`DELETE FROM khatm_claims WHERE round_id IN (SELECT id FROM khatm_rounds WHERE completed_at IS NOT NULL)`),
    roundsTotal: p('SELECT COUNT(*) AS n FROM khatm_rounds WHERE completed_at IS NOT NULL'),
    roundsPage: p('SELECT * FROM khatm_rounds WHERE completed_at IS NOT NULL ORDER BY no DESC LIMIT ? OFFSET ?'),
    roundsBetween: p('SELECT COUNT(*) AS n FROM khatm_rounds WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at < ?'),
  }

  const router = express.Router()
  const json = express.json({ limit: '2kb' })
  const auth = requireUser()
  const err = (res, status, code, extra = {}) => res.status(status).json({ error: code, code, ...extra })
  const body = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {})

  // ── Limit sayğacları (yalnız yaddaşda) ──
  const buckets = Object.fromEntries(Object.keys(limits).map((k) => [k, new Map()]))
  function limited(kind, key, { record = true } = {}) {
    const { max, windowMs } = limits[kind]
    const map = buckets[kind]
    const t = now()
    const list = (map.get(key) || []).filter((x) => t - x < windowMs)
    const over = list.length >= max
    if (!over && record) list.push(t)
    map.set(key, list)
    if (map.size > 50000) map.clear()
    return over
  }

  // ── Cari dövr ──
  function currentRound() {
    let r = st.current.get()
    if (!r) {
      const no = (st.lastNo.get().n || 0) + 1
      st.newRound.run(no, now())
      r = st.current.get()
    }
    return r
  }
  const ensureRound = () => tx(() => currentRound())

  function snapshot() {
    const r = st.current.get() || ensureRound()
    const pages = st.donePages.all(r.id).map((x) => x.page)
    return {
      roundNo: r.no, startedAt: r.started_at, bits: encodeBits(pages), readCount: pages.length,
      active: st.activeCount.get(r.id, now()).n, total: PAGES,
    }
  }

  const roundOut = (r) => ({
    no: r.no, startedAt: r.started_at, completedAt: r.completed_at,
    durationMs: r.completed_at ? r.completed_at - r.started_at : null,
    participants: r.participants, countries: parseList(r.countries_json).length, dedications: r.dedications,
  })
  const claimOut = (c, roundNo) => (c ? {
    page: c.page, roundNo: roundNo ?? c.round_no, claimedAt: c.claimed_at, expiresAt: c.expires_at,
    readyAt: c.claimed_at + minReadMs, dedication: c.dedication || null, cell: cellOut(c.cell),
  } : null)

  // ── SSE ──
  const conns = new Set()
  const perIp = new Map()
  function send(res, event, data) {
    try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) } catch { /* bağlantı qırılıb */ }
  }
  function broadcast(event, data) { for (const res of conns) send(res, event, data) }
  let activeTimer = 0, lastActiveAt = 0
  function announceActive() {
    if (!conns.size) return
    const fire = () => {
      activeTimer = 0
      lastActiveAt = now()
      const r = st.current.get()
      if (r) broadcast('active', { roundNo: r.no, active: st.activeCount.get(r.id, now()).n, readCount: st.doneCount.get(r.id).n })
    }
    if (activeTimer) return
    const wait = Math.max(0, activeThrottleMs - (now() - lastActiveAt))
    if (!wait) fire()
    else { activeTimer = setTimeout(fire, wait); if (activeTimer.unref) activeTimer.unref() }
  }

  // ── Statistika keşi ──
  let statsCache = null
  function stats() {
    const t = now()
    if (statsCache && t - statsCache.at < statsTtlMs) return statsCache.value
    const r = st.current.get() || ensureRound()
    const value = { roundNo: r.no, readCount: st.doneCount.get(r.id).n, active: st.activeCount.get(r.id, t).n, rounds: st.roundsTotal.get().n }
    statsCache = { at: t, value }
    return value
  }

  // ── Dövrün tamamlanması (tx daxilində çağırılır) → yekun | null ──
  function finishIfFull(r, t) {
    if (st.doneCount.get(r.id).n < PAGES) return null
    const participants = st.participantCount.get(r.id).n
    const dedications = st.dedicationCount.get(r.id).n
    const fresh = st.roundById.get(r.id)
    const countries = parseList(fresh.countries_json)
    const ch = st.finishRound.run(t, participants, JSON.stringify(countries), dedications, r.id).changes
    if (ch !== 1) return null   // artıq tamamlanıb — təkrar yoxdur
    st.trimClaims.run(r.id)
    st.newRound.run(r.no + 1, t)
    return { roundId: r.id, roundNo: r.no, participants, countries: countries.length, dedications, startedAt: r.started_at, completedAt: t, durationMs: t - r.started_at, nextRoundNo: r.no + 1 }
  }

  async function notifyRound(done) {
    if (!pushSend) return
    for (const { user_id: uid } of st.toNotify.all(done.roundId)) {
      st.notified.run(done.roundId, uid)
      let subs = []
      try { subs = pushSubsOf(uid) || [] } catch { subs = [] }
      if (!subs.length) continue   // push yoxdur — növbəti girişdə /account göstərir (GET /me → rounds)
      const lang = (() => { try { return langOf(uid) } catch { return 'en' } })()
      const tx5 = PUSH_TEXT[lang] || PUSH_TEXT.en
      const link = `${publicOrigin}${lang === 'az' ? '' : `/${PUSH_TEXT[lang] ? lang : 'en'}`}/khatm`
      const msg = {
        notification: { title: tx5.title, body: tx5.body(done.roundNo, done.participants, done.countries) },
        webpush: { notification: { tag: `khatm-${done.roundNo}` }, fcmOptions: { link } },
      }
      try { await pushSend(subs, msg, `khatm ${done.roundNo}`) } catch (e) { log.error('khatm push:', e && e.message) }
    }
  }

  router.use('/khatm', (req, res, next) => { if (req.method !== 'GET' || !/^\/khatm\/(state|stats|rounds)$/.test(req.path)) res.set('Cache-Control', 'no-store'); next() })

  // ── Səhifə götür ──
  router.post('/khatm/claim', auth, json, (req, res) => {
    const uid = req.user.id
    const b = body(req)
    let dedication = null
    if (b.dedication != null) {
      if (typeof b.dedication !== 'string') return err(res, 400, 'bad_request')
      dedication = cleanLine(b.dedication, MAX_DEDICATION) || null
    }
    const cell = b.cell == null ? null : cellOf(b.cell)
    if (b.cell != null && !cell) return err(res, 400, 'bad_cell')
    const t = now()
    const out = tx(() => {
      const r = currentRound()
      st.expire.run(r.id, t)
      const mine = st.activeOf.get(uid)
      if (mine && mine.expires_at > t) return { claim: claimOut(mine), existing: true }
      if (mine) st.dropClaim.run(mine.round_id, mine.page, uid)   // köhnə dövrün/vaxtı keçmiş iddiası
      if (limited('claim', `u${uid}`)) return { rate: true }
      const taken = new Set(st.pagesOf.all(r.id).map((x) => x.page))
      let page = 0
      for (let i = 1; i <= PAGES; i++) if (!taken.has(i)) { page = i; break }
      if (!page) return { full: true }
      st.insertClaim.run(r.id, page, uid, t, t + claimMs, cell, dedication)
      return { claim: claimOut({ page, claimed_at: t, expires_at: t + claimMs, dedication, cell }, r.no), existing: false }
    })
    if (out.rate) return err(res, 429, 'rate_limited')
    if (out.full) return err(res, 409, 'all_taken')
    if (!out.existing) { statsCache = null; announceActive() }
    res.status(out.existing ? 200 : 201).json(out)
  })

  // ── Oxudum ──
  router.post('/khatm/complete', auth, json, (req, res) => {
    const uid = req.user.id
    const page = Number(body(req).page)
    if (!Number.isInteger(page) || page < 1 || page > PAGES) return err(res, 400, 'bad_page')
    const t = now()
    const country = countryOf(req)
    const out = tx(() => {
      const c = st.activeOf.get(uid)
      if (!c) return { status: 404, code: 'no_claim' }
      if (c.page !== page) return { status: 409, code: 'not_yours' }
      if (c.expires_at <= t) { st.dropClaim.run(c.round_id, c.page, uid); return { status: 410, code: 'expired' } }
      const wait = c.claimed_at + minReadMs - t
      if (wait > 0) return { status: 425, code: 'too_soon', extra: { retryAfterMs: wait } }
      if (limited('complete', `u${uid}`)) return { status: 429, code: 'rate_limited' }
      if (st.completeClaim.run(t, c.round_id, c.page, uid, t).changes !== 1) return { status: 409, code: 'not_yours' }
      if (c.dedication) st.addDedication.run(uid, c.round_id, c.page, c.dedication, t)
      st.participate.run(c.round_id, uid)
      const r = st.roundById.get(c.round_id)
      if (country) {
        const list = parseList(r.countries_json)
        if (!list.includes(country)) { list.push(country); st.setCountries.run(JSON.stringify(list.sort()), r.id) }
      }
      const readCount = st.doneCount.get(r.id).n
      const done = finishIfFull(r, t)
      return { ok: true, page, cell: cellOut(c.cell), roundNo: r.no, readCount, done }
    })
    if (!out.ok) return err(res, out.status, out.code, out.extra)
    statsCache = null
    const r = st.current.get()
    broadcast('page', { page: out.page, cell: out.cell, roundNo: out.roundNo, readCount: out.readCount, active: r ? st.activeCount.get(r.id, t).n : 0 })
    if (out.done) {
      const { roundId: _r, ...pub } = out.done
      broadcast('round', pub)
      notifyRound(out.done).catch((e) => log.error('khatm notify:', e && e.message))
    }
    res.json({ ok: true, page: out.page, roundNo: out.roundNo, readCount: out.readCount, roundCompleted: out.done ? (({ roundId: _r, ...x }) => x)(out.done) : null })
  })

  router.post('/khatm/release', auth, (req, res) => {
    const uid = req.user.id
    const c = st.activeOf.get(uid)
    if (c) { st.dropClaim.run(c.round_id, c.page, uid); statsCache = null; announceActive() }
    res.json({ ok: true, released: Boolean(c) })
  })

  router.get('/khatm/me', auth, (req, res) => {
    const uid = req.user.id
    const t = now()
    const c = st.activeOf.get(uid)
    let names = []
    try { names = (lovedNames(uid) || []).filter((n) => typeof n === 'string').map((n) => cleanLine(n, MAX_DEDICATION)).filter(Boolean).slice(0, MAX_LOVED) } catch { names = [] }
    res.json({
      claim: c && c.expires_at > t ? claimOut(c) : null,
      rounds: st.myRounds.all(uid).map((r) => ({ ...roundOut(r), myPages: r.my_pages })),
      dedications: st.myDedications.all(uid).map((d) => ({ id: d.id, name: d.name, page: d.page, roundNo: d.round_no, completed: d.completed_at != null })),
      loved: [...new Set(names)],
      minReadMs, claimMs,
    })
  })

  router.delete('/khatm/dedications/:id', auth, (req, res) => {
    const id = /^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0
    if (!id || st.delDedication.run(id, req.user.id).changes !== 1) return err(res, 404, 'not_found')
    res.json({ ok: true })
  })

  // ── İctimai toplu məlumat ──
  router.get('/khatm/state', (req, res) => {
    res.set('Cache-Control', 'public, max-age=5')
    res.json(snapshot())
  })

  router.get('/khatm/stats', (req, res) => {
    res.set('Cache-Control', `public, max-age=${Math.round(statsTtlMs / 1000)}`)
    res.json(stats())
  })

  router.get('/khatm/rounds', (req, res) => {
    const total = st.roundsTotal.get().n
    const pages = Math.max(1, Math.ceil(total / ROUNDS_PER_PAGE))
    const pg = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1))
    const rr = ramadanRange(now())
    res.set('Cache-Control', 'public, max-age=60')
    res.json({
      rounds: st.roundsPage.all(ROUNDS_PER_PAGE, (pg - 1) * ROUNDS_PER_PAGE).map(roundOut),
      page: pg, pages, total,
      ramadan: rr ? { year: rr.year, current: rr.current, count: st.roundsBetween.get(rr.start, rr.end).n } : null,
    })
  })

  router.get('/khatm/live', (req, res) => {
    const ip = req.ip || ''
    const mine = perIp.get(ip) || 0
    if (conns.size >= MAX_CONN_TOTAL || mine >= MAX_CONN_PER_IP) return err(res, 429, 'too_many_connections')
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', Connection: 'keep-alive',
    })
    res.flushHeaders?.()
    res.write('retry: 5000\n\n')
    conns.add(res)
    perIp.set(ip, mine + 1)
    send(res, 'hello', snapshot())
    const ka = setInterval(() => { try { res.write(': k\n\n') } catch { /* */ } }, keepaliveMs)
    if (ka.unref) ka.unref()
    let done = false
    const cleanup = () => {
      if (done) return
      done = true
      clearInterval(ka)
      conns.delete(res)
      const n = (perIp.get(ip) || 1) - 1
      if (n > 0) perIp.set(ip, n); else perIp.delete(ip)
    }
    req.on('close', cleanup)
    res.on('close', cleanup)
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/khatm', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large')
    if (status === 400) return err(res, 400, 'bad_request')
    console.error('khatm error:', e && e.message)
    err(res, 500, 'server_error')
  })

  // ── Təmizləmə: vaxtı keçmiş iddialar hovuza qayıdır; ithaflar dövr bitəndən 30 gün sonra silinir ──
  function sweep() {
    const t = now()
    const expired = st.expireAll.run(t).changes
    st.trimDone.run()
    if (expired) { statsCache = null; announceActive() }
    return expired
  }
  function purge() {
    const t = now()
    const dedications = st.purgeDedications.run(t - DEDICATION_KEEP_MS).changes
    return { expired: sweep(), dedications }
  }
  const timer = sweepMs > 0 ? setInterval(sweep, sweepMs) : null
  if (timer && timer.unref) timer.unref()

  ensureRound()
  router.sweep = sweep
  router.purge = purge
  router.connections = () => conns.size
  /** "Mənim məlumatlarım" ixracı üçün: yalnız bu istifadəçinin iştirakı və ithafları (açıq iddia daxil) */
  router.exportUser = (uid) => {
    const c = st.activeOf.get(uid)
    return {
      claim: c && c.expires_at > now() ? claimOut(c) : null,
      rounds: st.myRounds.all(uid).map((r) => ({ no: r.no, completedAt: r.completed_at, myPages: r.my_pages })),
      dedications: st.myDedications.all(uid).map((d) => ({ name: d.name, page: d.page, roundNo: d.round_no })),
    }
  }
  router.summaryUser = (uid) => { const e = router.exportUser(uid); return { rounds: e.rounds.length, dedications: e.dedications.length, activeClaim: Boolean(e.claim) } }
  router.snapshot = snapshot
  router.shutdown = () => {
    if (timer) clearInterval(timer)
    clearTimeout(activeTimer)
    for (const res of [...conns]) { try { res.end() } catch { /* */ } }
  }
  return router
}

module.exports = {
  createGlobalKhatmRouter, cellOf, encodeBits, ramadanRange,
  PAGES, CLAIM_MS, MIN_READ_MS, MAX_DEDICATION, DEDICATION_KEEP_MS, LIMITS, MAX_CONN_PER_IP, MAX_CONN_TOTAL,
}
