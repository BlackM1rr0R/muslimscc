// Server: kukisiz sayt statistikası (server/analytics.js)
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const A = require('../../server/analytics.js')

const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const UA_IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const UA_ANDROID_TAB = 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const UA_FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'
const UA_EDGE = UA_DESKTOP + ' Edg/130.0.0.0'
const UA_BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const UA_HEADLESS = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36'

describe('saf köməkçilər', () => {
  it('normalizePath: sorğu/hash atılır, dil prefiksi ayrılır, admin sayılmır', () => {
    expect(A.normalizePath('/')).toEqual({ path: '/', lang: 'az' })
    expect(A.normalizePath('/quran?x=1#top')).toEqual({ path: '/quran', lang: 'az' })
    expect(A.normalizePath('/ru/Quran/2-al-baqara/')).toEqual({ path: '/quran/2-al-baqara', lang: 'ru' })
    expect(A.normalizePath('/ar')).toEqual({ path: '/', lang: 'ar' })
    expect(A.normalizePath('//tr//hadith')).toEqual({ path: '/hadith', lang: 'tr' })
    expect(A.normalizePath('/admin')).toBeNull()
    expect(A.normalizePath('/en/adminlogin')).toBeNull()
    expect(A.normalizePath('/api/content/books')).toBeNull()
    expect(A.normalizePath('https://evil.com/')).toBeNull()
    expect(A.normalizePath('/<script>')).toBeNull()
    expect(A.normalizePath('/a/../b')).toBeNull()
    expect(A.normalizePath('/' + 'x'.repeat(400))).toBeNull()
    expect(A.normalizePath(42)).toBeNull()
  })

  it('referrerDomain: yalnız domen, öz sayt və localhost atılır', () => {
    expect(A.referrerDomain('https://www.google.com/search?q=quran')).toBe('google.com')
    expect(A.referrerDomain('https://t.co/abc')).toBe('t.co')
    expect(A.referrerDomain('https://muslims.cc/quran', ['muslims.cc'])).toBeNull()
    expect(A.referrerDomain('https://www.muslims.cc/', ['muslims.cc'])).toBeNull()
    expect(A.referrerDomain('http://localhost:5173/')).toBeNull()
    expect(A.referrerDomain('http://192.168.1.1/')).toBeNull()
    expect(A.referrerDomain('javascript:alert(1)')).toBeNull()
    expect(A.referrerDomain('')).toBeNull()
    expect(A.referrerDomain('not a url')).toBeNull()
  })

  it('cihaz və brauzer', () => {
    expect(A.deviceClass(UA_DESKTOP)).toBe('desktop')
    expect(A.deviceClass(UA_IPHONE)).toBe('mobile')
    expect(A.deviceClass(UA_IPAD)).toBe('tablet')
    expect(A.deviceClass(UA_ANDROID_TAB)).toBe('tablet')
    expect(A.browserFamily(UA_DESKTOP)).toBe('Chrome')
    expect(A.browserFamily(UA_IPHONE)).toBe('Safari')
    expect(A.browserFamily(UA_FIREFOX)).toBe('Firefox')
    expect(A.browserFamily(UA_EDGE)).toBe('Edge')
    expect(A.browserFamily('Something/1.0')).toBe('Other')
  })

  it('botlar', () => {
    expect(A.isBot(UA_BOT)).toBe(true)
    expect(A.isBot(UA_HEADLESS)).toBe(true)
    expect(A.isBot('curl/8.4.0')).toBe(true)
    expect(A.isBot('')).toBe(true)
    expect(A.isBot(UA_DESKTOP)).toBe(false)
    expect(A.isBot(UA_IPHONE)).toBe(false)
  })

  it('DNT / GPC', () => {
    expect(A.optedOut({ dnt: '1' })).toBe(true)
    expect(A.optedOut({ 'sec-gpc': '1' })).toBe(true)
    expect(A.optedOut({ dnt: '0' })).toBe(false)
    expect(A.optedOut({})).toBe(false)
  })

  it('validDay', () => {
    expect(A.validDay('2026-10-31')).toBe(true)
    expect(A.validDay('2026-02-30')).toBe(false)
    expect(A.validDay('2026-1-1')).toBe(false)
    expect(A.validDay(null)).toBe(false)
  })
})

describe('record + stats (birbaşa)', () => {
  let db, an, t
  beforeEach(() => {
    db = openDb(':memory:')
    t = Date.parse('2026-10-31T10:00:00Z')
    an = A.createAnalytics({ db, now: () => t })
  })

  it('baxışlar və günlük unikal ziyarətçilər', () => {
    an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: '/', lang: 'az', ref: 'google.com' })
    an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: '/quran', lang: 'az', ref: null })
    an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: '/quran', lang: 'az', ref: null })
    an.record({ ip: '2.2.2.2', ua: UA_IPHONE, path: '/quran', lang: 'ru', ref: null })
    const s = an.stats({ from: '2026-10-31', to: '2026-10-31' })
    expect(s.totals).toMatchObject({ views: 4, visitors: 2, viewsPerVisit: 2, pages: 2, topLanguage: 'az' })
    expect(s.series).toEqual([{ day: '2026-10-31', views: 4, visitors: 2 }])
    expect(s.pages[0]).toEqual({ key: '/quran', views: 3, visitors: 2 })
    expect(s.pages[1]).toEqual({ key: '/', views: 1, visitors: 1 })
    expect(s.referrers).toEqual([{ key: 'google.com', count: 1 }])
    expect(s.languages).toEqual([{ key: 'az', count: 3 }, { key: 'ru', count: 1 }])
    expect(s.devices).toEqual([{ key: 'desktop', count: 3 }, { key: 'mobile', count: 1 }])
    expect(s.browsers).toEqual([{ key: 'Chrome', count: 3 }, { key: 'Safari', count: 1 }])
  })

  it('növbəti gün: duz yenilənir, eyni şəxs yenidən sayılır; seriya sıfırla doldurulur', () => {
    an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: '/', lang: 'az' })
    t += 2 * 86400e3
    an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: '/', lang: 'az' })
    const s = an.stats({ from: '2026-10-31', to: '2026-11-02' })
    expect(s.series.map((r) => r.visitors)).toEqual([1, 0, 1])
    expect(s.days).toBe(3)
    expect(s.totals.visitors).toBe(2)
  })

  it('heç bir cədvəldə IP, UA və ya heş saxlanmır', () => {
    an.record({ ip: '203.0.113.7', ua: UA_DESKTOP, path: '/', lang: 'az', ref: 'google.com' })
    const dump = JSON.stringify([
      db.raw.prepare('SELECT * FROM analytics_days').all(),
      db.raw.prepare('SELECT * FROM analytics_daily').all(),
      db.raw.prepare('SELECT * FROM analytics_dim').all(),
    ])
    expect(dump).not.toContain('203.0.113.7')
    expect(dump).not.toContain('Mozilla')
    const cols = db.raw.prepare("SELECT name FROM pragma_table_info('analytics_daily')").all().map((r) => r.name)
    expect(cols).toEqual(['day', 'path', 'views', 'visitors'])
  })

  it('saxlama müddəti: 400 gündən köhnə günlər silinir', () => {
    t = Date.parse('2025-01-01T10:00:00Z')
    an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: '/', lang: 'az' })
    t = Date.parse('2026-10-31T10:00:00Z')
    an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: '/', lang: 'az' })   // gün dəyişdi → prune
    const days = db.raw.prepare('SELECT day FROM analytics_days').all().map((r) => r.day)
    expect(days).toEqual(['2026-10-31'])
    expect(db.raw.prepare("SELECT COUNT(*) AS n FROM analytics_dim WHERE day < '2026-01-01'").get().n).toBe(0)
  })

  it('gündəlik yol limiti: artığı (other)', () => {
    an = A.createAnalytics({ db, now: () => t, maxPathsPerDay: 2 })
    for (const p of ['/a', '/b', '/c', '/d']) an.record({ ip: '1.1.1.1', ua: UA_DESKTOP, path: p, lang: 'az' })
    const keys = an.stats({ from: '2026-10-31', to: '2026-10-31' }).pages.map((r) => r.key).sort()
    expect(keys).toEqual(['(other)', '/a', '/b'])
  })
})

describe('HTTP: POST /api/a və GET /api/admin/analytics', () => {
  let srv, db, an
  const ADMIN = { 'x-test-admin': '1' }

  beforeAll(async () => {
    db = openDb(':memory:')
    an = A.createAnalytics({ db, rateMax: 20, allowedOrigins: ['https://muslims.cc'] })
    const requireAdmin = (req, res, next) => (req.headers['x-test-admin'] ? next() : res.status(401).json({ error: 'Unauthorized' }))
    const app = express()
    app.post('/api/a', an.handleCollect)
    app.get('/api/admin/analytics', requireAdmin, an.handleStats)
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const beacon = (body, headers = {}) => fetch(srv.url + '/api/a', {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=UTF-8', 'user-agent': UA_DESKTOP, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  const today = () => new Date().toISOString().slice(0, 10)
  const statsNow = async () => (await fetch(`${srv.url}/api/admin/analytics?from=${today()}&to=${today()}`, { headers: ADMIN })).json()

  it('mayak → 204, kuki qoyulmur', async () => {
    const r = await beacon({ p: '/en/quran?utm=x', r: 'https://www.bing.com/search?q=1', l: 'en' })
    expect(r.status).toBe(204)
    expect(r.headers.get('set-cookie')).toBeNull()
    const s = await statsNow()
    expect(s.totals.views).toBe(1)
    expect(s.pages).toEqual([{ key: '/quran', views: 1, visitors: 1 }])
    expect(s.languages).toEqual([{ key: 'en', count: 1 }])
    expect(s.referrers).toEqual([{ key: 'bing.com', count: 1 }])
  })

  it('application/json gövdəsi də qəbul olunur', async () => {
    const r = await beacon({ p: '/hadith' }, { 'content-type': 'application/json' })
    expect(r.status).toBe(204)
    expect((await statsNow()).totals.views).toBe(2)
  })

  it('DNT, GPC, bot, admin yolu, yad Origin → 204, amma sayılmır', async () => {
    const before = (await statsNow()).totals.views
    expect((await beacon({ p: '/x1' }, { dnt: '1' })).status).toBe(204)
    expect((await beacon({ p: '/x2' }, { 'sec-gpc': '1' })).status).toBe(204)
    expect((await beacon({ p: '/x3' }, { 'user-agent': UA_BOT })).status).toBe(204)
    expect((await beacon({ p: '/admin' })).status).toBe(204)
    expect((await beacon({ p: '/x4' }, { origin: 'https://evil.example' })).status).toBe(204)
    expect((await statsNow()).totals.views).toBe(before)
    // icazəli Origin sayılır
    expect((await beacon({ p: '/x5' }, { origin: 'https://muslims.cc' })).status).toBe(204)
    expect((await statsNow()).totals.views).toBe(before + 1)
  })

  it('yararsız gövdə → 400', async () => {
    expect((await beacon('not json')).status).toBe(400)
    expect((await beacon('[1,2]')).status).toBe(400)
    expect((await beacon('x'.repeat(5000))).status).toBe(413)
  })

  it('statistika yalnız admin üçün; parametr yoxlaması', async () => {
    expect((await fetch(srv.url + '/api/admin/analytics')).status).toBe(401)
    const bad = (q) => fetch(`${srv.url}/api/admin/analytics?${q}`, { headers: ADMIN }).then((r) => r.status)
    expect(await bad('from=2026-13-01&to=2026-10-31')).toBe(400)
    expect(await bad('from=2026-10-31&to=2026-10-01')).toBe(400)
    expect(await bad('from=2020-01-01&to=2026-10-31')).toBe(400)
    const r = await fetch(srv.url + '/api/admin/analytics', { headers: ADMIN })
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const s = await r.json()
    expect(s.days).toBe(30)
    expect(s.series).toHaveLength(30)
    expect(s.to).toBe(today())
    for (const k of ['totals', 'pages', 'referrers', 'languages', 'devices', 'browsers']) expect(s).toHaveProperty(k)
  })

  it('sorğu limiti: IP başına dəqiqədə rateMax', async () => {
    let last = 0
    for (let i = 0; i < 25; i++) last = (await beacon({ p: '/flood' })).status
    expect(last).toBe(429)
  })
})

describe('modul nüsxəsi', () => {
  it('migrate(db) cədvəlləri yaradır və idempotentdir', () => {
    const db = openDb(':memory:')
    A.migrate(db)
    A.migrate(db)
    const names = db.raw.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'analytics_%' ORDER BY name").all().map((r) => r.name)
    expect(names).toEqual(['analytics_daily', 'analytics_days', 'analytics_dim'])
  })
})
