// ═══════════════════════════════════════════════════════════════════════
// Kukisiz, öz serverimizdə işləyən sayt statistikası (analitika)
//
// Məxfilik qaydaları (dəyişmə — docs: PrivacyPage "Ziyarət statistikası"):
//   • Kuki, localStorage ID, barmaq izi (fingerprint) YOXDUR.
//   • IP ünvanı diskə YAZILMIR. Yaddaşda yalnız iki yerdə qısa müddət olur:
//       – sorğu limiti üçün (1 dəqiqəlik pəncərə);
//       – gündəlik unikal ziyarətçi sayı üçün: sha256(duz + IP + UA + gün)
//         heşinin qısa hissəsi; duz hər gün (UTC) təsadüfi yenilənir, diskə
//         yazılmır — dünənki heşi bu günkü ilə bağlamaq mümkün deyil.
//   • Bazada yalnız cəmlər: gün × səhifə, gün × ölçü (dil, mənbə domeni,
//     cihaz növü, brauzer ailəsi). Ölkə, tam referrer URL-i, sorğu sətri yoxdur.
//   • DNT: 1 və ya Sec-GPC: 1 → sayılmır. Botlar və admin səhifələri sayılmır.
//   • Saxlama müddəti: 400 gün (köhnə günlər avtomatik silinir).
//
// API:
//   POST /api/a                    — mayak (sendBeacon), gövdə {p, r, l} → 204
//   GET  /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD  — yalnız admin
//
// İstifadə (server.js):
//   const analytics = require('./analytics')
//   analytics.migrate(db)                       // cədvəllər + bu bazaya bağlanma
//   app.post('/api/a', analytics.handleCollect)
//   app.get('/api/admin/analytics', requireAdmin, analytics.handleStats)
//
// Testlər üçün izolyasiya olunmuş nüsxə: createAnalytics({ db, now, ... }).
// Gün sərhədi UTC-dir. Server yenidən başlayanda duz da yenilənir — həmin gün
// eyni ziyarətçi iki dəfə sayıla bilər (unikal say təxminidir, bu qəbul edilir).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')

// 5 əsas dil + Quranın əlavə dilləri (src/seo/langs.js → EXTRA_LANGS ilə EYNİ;
// tests/unit/intl.test.js sinxronluğu yoxlayır) — /id/quran "id" dili sayılsın
const EXTRA_LANGS = ['id', 'ur', 'bn', 'fa', 'ms', 'fr', 'de', 'es', 'pt', 'hi', 'uz', 'sw', 'ha', 'so', 'ps', 'bs', 'sq', 'it', 'nl', 'zh']
const LANGS = ['az', 'en', 'ru', 'ar', 'tr', ...EXTRA_LANGS]
const DEFAULT_LANG = 'az'
const DAY_MS = 86400e3
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

// Botlar, önizləmə xidmətləri, avtomatlaşdırılmış brauzerlər (Playwright daxil)
const BOT_RE = /bot\b|bot\/|crawl|spider|slurp|scrap|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|quora link|whatsapp|telegram|discord|skype|vkshare|curl|wget|python|axios|node-fetch|undici|go-http|java\/|okhttp|httpclient|libwww|phantom|selenium|puppeteer|playwright|electron/i

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS analytics_days (
    day      TEXT PRIMARY KEY,
    views    INTEGER NOT NULL DEFAULT 0,
    visitors INTEGER NOT NULL DEFAULT 0
  ) WITHOUT ROWID;
  CREATE TABLE IF NOT EXISTS analytics_daily (
    day      TEXT NOT NULL,
    path     TEXT NOT NULL,
    views    INTEGER NOT NULL DEFAULT 0,
    visitors INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, path)
  ) WITHOUT ROWID;
  CREATE TABLE IF NOT EXISTS analytics_dim (
    day   TEXT NOT NULL,
    kind  TEXT NOT NULL,
    key   TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, kind, key)
  ) WITHOUT ROWID;
`

const DIM_KINDS = { referrers: 'ref', languages: 'lang', devices: 'device', browsers: 'browser' }

// ─── Saf köməkçilər (testlənir) ───────────────────────────────────────

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)
const addDays = (day, n) => dayOf(Date.parse(day + 'T00:00:00Z') + n * DAY_MS)
function validDay(s) {
  if (typeof s !== 'string' || !DAY_RE.test(s)) return false
  const t = Date.parse(s + 'T00:00:00Z')
  return Number.isFinite(t) && dayOf(t) === s
}

/** UA → bot? Boş UA da bot sayılır. */
const isBot = (ua) => !ua || ua.length < 8 || BOT_RE.test(ua)

/** UA → 'mobile' | 'tablet' | 'desktop' */
function deviceClass(ua = '') {
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Nexus (7|9|10)|SM-T\d|Android(?!.*Mobile)/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|iPod|Android|Windows Phone|IEMobile|Opera Mini/i.test(ua)) return 'mobile'
  return 'desktop'
}

/** UA → brauzer ailəsi (versiyasız) */
function browserFamily(ua = '') {
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet'
  if (/YaBrowser\//.test(ua)) return 'Yandex'
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox'
  if (/Chrome\/|CriOS\//.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari'
  return 'Other'
}

/**
 * Yolu normallaşdır: sorğu/hash atılır, kiçik hərf, təkrar və sondakı "/" silinir,
 * dil prefiksi ayrılır. Admin və API yolları, yararsız simvollar → null.
 * → { path: '/quran/2-al-baqara', lang: 'ru' } | null
 */
function normalizePath(p) {
  if (typeof p !== 'string' || !p || p.length > 300) return null
  let s = p.split(/[?#]/)[0].trim().toLowerCase()
  if (!s.startsWith('/')) return null
  if (!/^[\w\-./%~]*$/.test(s)) return null
  s = s.replace(/\/{2,}/g, '/')
  const parts = s.split('/').filter(Boolean)
  if (parts.some((x) => x === '.' || x === '..')) return null
  let lang = DEFAULT_LANG
  if (parts.length && LANGS.includes(parts[0])) lang = parts.shift()
  if (parts.length && /^(admin|adminlogin|api)$/.test(parts[0])) return null
  const path = '/' + parts.join('/')
  if (path.length > 200) return null
  return { path, lang }
}

/** Referrer → yalnız domen (www. atılır); daxili / yararsız → null */
function referrerDomain(r, ownHosts = []) {
  if (typeof r !== 'string' || !r || r.length > 1000) return null
  let u
  try { u = new URL(r) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
  if (!host || host.length > 100) return null
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) return null
  if (ownHosts.some((h) => host === h || host.endsWith('.' + h))) return null
  return host
}

/** Brauzer "izləmə" istəmirsə — DNT: 1 və ya Sec-GPC: 1 */
const optedOut = (headers = {}) => String(headers.dnt || '').trim() === '1' || String(headers['sec-gpc'] || '').trim() === '1'

const clientIp = (req) => String(req.ip || (req.socket && req.socket.remoteAddress) || '')

// ─── Kiçik HTTP köməkçiləri (Express-dən asılı deyil) ─────────────────

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Cache-Control', 'no-store')
  if (body === undefined) return res.end()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/** Gövdəni oxu: Express parser-i artıq oxuyubsa onu, yoxdursa xam axını (≤ max bayt). */
function readBody(req, max = 2048) {
  if (typeof req.body === 'string') return Promise.resolve(req.body)
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString('utf8'))
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return Promise.resolve(req.body)
  if (req.readableEnded) return Promise.resolve('')   // başqa parser artıq oxuyub (boş)
  const tooLarge = () => Object.assign(new Error('too large'), { status: 413 })
  if (Number(req.headers && req.headers['content-length']) > max) {
    req.resume()   // gövdəni oxumadan at ki, cavab normal getsin
    return Promise.reject(tooLarge())
  }
  return new Promise((resolve, reject) => {
    let size = 0
    let over = false
    const chunks = []
    req.on('data', (c) => {
      if (over) return
      size += c.length
      if (size > max) { over = true; chunks.length = 0; return }
      chunks.push(c)
    })
    req.on('end', () => (over ? reject(tooLarge()) : resolve(Buffer.concat(chunks).toString('utf8'))))
    req.on('error', reject)
  })
}

function parsePayload(raw) {
  if (raw && typeof raw === 'object') return raw
  if (typeof raw !== 'string' || !raw.trim()) return null
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null
  } catch { return null }
}

// ─── Nüsxə ────────────────────────────────────────────────────────────

/**
 * opts:
 *   db             — openDb() nəticəsi (wrap) və ya xam DatabaseSync
 *   now            — () => ms (testlər üçün)
 *   rateMax        — bir IP-dən dəqiqədə ən çox mayak (60)
 *   rateWindowMs   — 60 000
 *   retentionDays  — 400
 *   maxPathsPerDay — gündə fərqli yol limiti (zibil yollara qarşı); artığı '(other)'
 *   maxVisitorsPerDay — yaddaşdakı heş dəstinin həddi (yaddaşı qoruyur)
 *   ownHosts       — öz domenlərimiz (referrer kimi sayılmır)
 *   allowedOrigins — verilibsə, başqa Origin-dən gələn mayak sayılmır
 */
function createAnalytics(opts = {}) {
  const {
    db,
    now = () => Date.now(),
    rateMax = 60,
    rateWindowMs = 60e3,
    retentionDays = 400,
    maxPathsPerDay = 5000,
    maxVisitorsPerDay = 500000,
    ownHosts = ['muslims.cc'],
    allowedOrigins = null,
  } = opts
  if (!db) throw new Error('analytics: db lazımdır')
  const raw = db.raw || db

  raw.exec(SCHEMA)

  const st = {
    day: raw.prepare(`INSERT INTO analytics_days (day, views, visitors) VALUES (?, 1, ?)
      ON CONFLICT(day) DO UPDATE SET views = views + 1, visitors = visitors + excluded.visitors`),
    path: raw.prepare(`INSERT INTO analytics_daily (day, path, views, visitors) VALUES (?, ?, 1, ?)
      ON CONFLICT(day, path) DO UPDATE SET views = views + 1, visitors = visitors + excluded.visitors`),
    dim: raw.prepare(`INSERT INTO analytics_dim (day, kind, key, count) VALUES (?, ?, ?, 1)
      ON CONFLICT(day, kind, key) DO UPDATE SET count = count + 1`),
    pruneDays: raw.prepare('DELETE FROM analytics_days WHERE day < ?'),
    prunePaths: raw.prepare('DELETE FROM analytics_daily WHERE day < ?'),
    pruneDims: raw.prepare('DELETE FROM analytics_dim WHERE day < ?'),
    series: raw.prepare('SELECT day, views, visitors FROM analytics_days WHERE day BETWEEN ? AND ? ORDER BY day'),
    pages: raw.prepare(`SELECT path AS key, SUM(views) AS views, SUM(visitors) AS visitors FROM analytics_daily
      WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY views DESC, path ASC LIMIT ?`),
    pagesCount: raw.prepare('SELECT COUNT(DISTINCT path) AS n FROM analytics_daily WHERE day BETWEEN ? AND ?'),
    dims: raw.prepare(`SELECT key, SUM(count) AS count FROM analytics_dim
      WHERE kind = ? AND day BETWEEN ? AND ? GROUP BY key ORDER BY count DESC, key ASC LIMIT ?`),
    pathsOfDay: raw.prepare('SELECT path FROM analytics_daily WHERE day = ?'),
  }

  const tx = (fn) => {
    raw.exec('BEGIN IMMEDIATE')
    try { const r = fn(); raw.exec('COMMIT'); return r } catch (e) { raw.exec('ROLLBACK'); throw e }
  }

  // Gündəlik yaddaş vəziyyəti — heç vaxt diskə yazılmır
  const mem = { day: '', salt: null, visitors: new Set(), pathVisitors: new Set(), paths: new Set() }
  const rate = new Map()   // ip → { n, reset }

  function prune(today) {
    const cutoff = addDays(today, -(retentionDays - 1))
    tx(() => { st.pruneDays.run(cutoff); st.prunePaths.run(cutoff); st.pruneDims.run(cutoff) })
  }

  function rollover(day) {
    if (mem.day === day) return
    mem.day = day
    mem.salt = crypto.randomBytes(32)
    mem.visitors = new Set()
    mem.pathVisitors = new Set()
    // Yenidən başlamadan sonra: bu günün mövcud yolları limitdə nəzərə alınsın
    mem.paths = new Set(st.pathsOfDay.all(day).map((r) => r.path))
    try { prune(day) } catch (e) { console.error('analytics prune:', e.message) }
  }

  function limited(ip, t) {
    if (rate.size > 50000) for (const [k, v] of rate) if (v.reset <= t) rate.delete(k)
    let e = rate.get(ip)
    if (!e || e.reset <= t) { e = { n: 0, reset: t + rateWindowMs }; rate.set(ip, e) }
    e.n++
    return e.n > rateMax
  }

  const visitorHash = (ip, ua, day) => crypto.createHash('sha256')
    .update(mem.salt).update(ip).update('\0').update(ua).update('\0').update(day)
    .digest('base64url').slice(0, 16)

  /** Bir baxışı qeyd et (HTTP-dən asılı deyil; testlərdə də birbaşa çağırılır). */
  function record({ ip, ua, path, lang, ref }) {
    const t = now()
    const day = dayOf(t)
    rollover(day)

    let p = path
    if (!mem.paths.has(p)) {
      if (mem.paths.size >= maxPathsPerDay) p = '(other)'
      else mem.paths.add(p)
    }

    const h = visitorHash(ip, ua, day)
    let newVisitor = 0
    if (!mem.visitors.has(h) && mem.visitors.size < maxVisitorsPerDay) { mem.visitors.add(h); newVisitor = 1 }
    const pk = h + '\n' + p
    let newPathVisitor = 0
    if (!mem.pathVisitors.has(pk) && mem.pathVisitors.size < maxVisitorsPerDay) { mem.pathVisitors.add(pk); newPathVisitor = 1 }

    tx(() => {
      st.day.run(day, newVisitor)
      st.path.run(day, p, newPathVisitor)
      st.dim.run(day, 'lang', lang)
      st.dim.run(day, 'device', deviceClass(ua))
      st.dim.run(day, 'browser', browserFamily(ua))
      if (ref) st.dim.run(day, 'ref', ref)
    })
  }

  async function handleCollect(req, res) {
    try {
      const headers = req.headers || {}
      const ip = clientIp(req)
      if (limited(ip, now())) return send(res, 429, { error: 'Limit' })
      if (optedOut(headers)) return send(res, 204)
      const ua = String(headers['user-agent'] || '').slice(0, 512)
      if (isBot(ua)) return send(res, 204)
      if (allowedOrigins && headers.origin) {
        const o = String(headers.origin)
        const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)
        if (!allowedOrigins.includes(o) && !local) return send(res, 204)
      }

      let rawBody
      try { rawBody = await readBody(req) } catch (e) { return send(res, e.status || 400, { error: 'Bad body' }) }
      const body = parsePayload(rawBody)
      if (!body) return send(res, 400, { error: 'Bad body' })

      const norm = normalizePath(body.p)
      if (!norm) return send(res, 204)   // admin / yararsız yol — sayılmır, amma xəta da deyil
      record({ ip, ua, path: norm.path, lang: norm.lang, ref: referrerDomain(body.r, ownHosts) })
      return send(res, 204)
    } catch (e) {
      console.error('analytics collect:', e && e.message)
      if (!res.headersSent) send(res, 500, { error: 'Server error' })
    }
  }

  /** Aralıq üçün statistika. from/to — 'YYYY-MM-DD' (UTC), daxil olmaqla. */
  function stats({ from, to, limit = 10 } = {}) {
    const today = dayOf(now())
    const end = to || today
    const start = from || addDays(end, -29)
    const totalViews = { views: 0, visitors: 0 }
    const rows = new Map(st.series.all(start, end).map((r) => [r.day, r]))
    const series = []
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const r = rows.get(d)
      const views = r ? Number(r.views) : 0
      const visitors = r ? Number(r.visitors) : 0
      totalViews.views += views
      totalViews.visitors += visitors
      series.push({ day: d, views, visitors })
    }
    const dim = (kind) => st.dims.all(kind, start, end, limit).map((r) => ({ key: r.key, count: Number(r.count) }))
    const languages = dim('lang')
    return {
      from: start,
      to: end,
      days: series.length,
      totals: {
        views: totalViews.views,
        // Günlük unikalların cəmi — aralıqda təkrar gələn eyni şəxs hər gün ayrıca sayılır
        visitors: totalViews.visitors,
        viewsPerVisit: totalViews.visitors ? Math.round((totalViews.views / totalViews.visitors) * 100) / 100 : 0,
        pages: Number(st.pagesCount.get(start, end).n),
        topLanguage: languages[0] ? languages[0].key : null,
      },
      series,
      pages: st.pages.all(start, end, limit).map((r) => ({ key: r.key, views: Number(r.views), visitors: Number(r.visitors) })),
      referrers: dim(DIM_KINDS.referrers),
      languages,
      devices: dim(DIM_KINDS.devices),
      browsers: dim(DIM_KINDS.browsers),
      retentionDays,
    }
  }

  function handleStats(req, res) {
    try {
      const q = req.query || Object.fromEntries(new URL(req.url || '/', 'http://x').searchParams)
      const today = dayOf(now())
      const to = q.to === undefined || q.to === '' ? today : String(q.to)
      const from = q.from === undefined || q.from === '' ? addDays(validDay(to) ? to : today, -29) : String(q.from)
      if (!validDay(from) || !validDay(to)) return send(res, 400, { error: 'from/to: YYYY-MM-DD' })
      if (from > to) return send(res, 400, { error: 'from > to' })
      const span = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1
      if (span > retentionDays) return send(res, 400, { error: `Aralıq ${retentionDays} gündən çox ola bilməz` })
      const limit = Math.min(50, Math.max(1, Number(q.limit) || 10))
      return send(res, 200, stats({ from, to, limit }))
    } catch (e) {
      console.error('analytics stats:', e && e.message)
      return send(res, 500, { error: 'Server error' })
    }
  }

  return {
    handleCollect,
    handleStats,
    record,
    stats,
    prune: () => prune(dayOf(now())),
    /** Testlər üçün: yaddaşdakı vəziyyətin ölçüləri (məzmun yox). */
    _mem: () => ({ day: mem.day, visitors: mem.visitors.size, rateKeys: rate.size }),
  }
}

// ─── Modul səviyyəsində tək nüsxə (server.js üçün) ───────────────────
let instance = null

/** Cədvəlləri yarat (IF NOT EXISTS) və modul nüsxəsini bu bazaya bağla. */
function migrate(db, opts = {}) {
  instance = createAnalytics({ ...opts, db })
  return instance
}
const notReady = (res) => send(res, 503, { error: 'analytics not initialised' })
const handleCollect = (req, res) => (instance ? instance.handleCollect(req, res) : notReady(res))
const handleStats = (req, res) => (instance ? instance.handleStats(req, res) : notReady(res))

module.exports = {
  migrate, handleCollect, handleStats, createAnalytics,
  // saf köməkçilər — testlər üçün
  normalizePath, referrerDomain, deviceClass, browserFamily, isBot, optedOut, validDay, dayOf, addDays,
}
