// Server: statistikada bot süzgəci (server/analytics.js) — Client Hints uyğunluğu,
// heş başına gündəlik baxış həddi, çıxarılmış (anomal) günlər + CLI (server/scripts/analytics-exclude.js)
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const os = require('node:os')
const fs = require('node:fs')
const path = require('node:path')
const { openDb } = require('../../server/db.js')
const A = require('../../server/analytics.js')

const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const UA_EDGE = UA_DESKTOP + ' Edg/130.0.0.0'
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const UA_FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'
const UA_CHROME153_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'
const CH_153 = '"Chromium";v="153", "Google Chrome";v="153", "Not.A/Brand";v="99"'
const UA_ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36'
const UA_CRIOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/153.0.0.0 Mobile/15E148 Safari/604.1'
const UA_WEBVIEW = 'Mozilla/5.0 (Linux; Android 13; SM-A515F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/153.0.0.0 Mobile Safari/537.36'
const UA_SAMSUNG = 'Mozilla/5.0 (Linux; Android 13; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36'
const UA_OLD_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36'

describe('clientHintsBot', () => {
  const B = A.clientHintsBot
  it('HTTPS-də sec-ch-ua-sız Chromium → bot', () => {
    expect(B(UA_CHROME153_WIN, {}, true)).toBe(true)
    expect(B(UA_CHROME153_WIN, { 'sec-ch-ua': '' }, true)).toBe(true)
    expect(B(UA_EDGE, {}, true)).toBe(true)
    expect(B(UA_ANDROID_CHROME, {}, true)).toBe(true)
  })
  it('uyğun sec-ch-ua → insan', () => {
    expect(B(UA_CHROME153_WIN, { 'sec-ch-ua': CH_153 }, true)).toBe(false)
    expect(B(UA_EDGE, { 'sec-ch-ua': '"Microsoft Edge";v="130", "Chromium";v="130", "Not?A_Brand";v="24"' }, true)).toBe(false)
    // Chromium markası yoxdursa versiya müqayisə olunmur
    expect(B(UA_CHROME153_WIN, { 'sec-ch-ua': '"Brave";v="153", "Not.A/Brand";v="99"' }, true)).toBe(false)
  })
  it('HeadlessChrome və ya versiya uyğunsuzluğu → bot', () => {
    expect(B(UA_CHROME153_WIN, { 'sec-ch-ua': '"HeadlessChrome";v="153", "Chromium";v="153"' }, true)).toBe(true)
    expect(B(UA_CHROME153_WIN, { 'sec-ch-ua': '"HeadlessChrome";v="153"' }, false)).toBe(true)
    expect(B(UA_CHROME153_WIN, { 'sec-ch-ua': '"Chromium";v="131", "Google Chrome";v="131"' }, true)).toBe(true)
  })
  it('ehtiyat: HTTP, Chromium olmayan, iOS, WebView, Samsung, köhnə Chrome yoxlanmır', () => {
    expect(B(UA_CHROME153_WIN, {}, false)).toBe(false)
    expect(B(UA_IPHONE, {}, true)).toBe(false)
    expect(B(UA_FIREFOX, {}, true)).toBe(false)
    expect(B(UA_CRIOS, {}, true)).toBe(false)
    expect(B(UA_WEBVIEW, {}, true)).toBe(false)
    expect(B(UA_SAMSUNG, {}, true)).toBe(false)
    expect(B(UA_OLD_CHROME, {}, true)).toBe(false)
    expect(B('', {}, true)).toBe(false)
  })
  it('isSecure: req.secure və ya X-Forwarded-Proto', () => {
    expect(A.isSecure({ secure: true, headers: {} })).toBe(true)
    expect(A.isSecure({ headers: { 'x-forwarded-proto': 'https' } })).toBe(true)
    expect(A.isSecure({ headers: { 'x-forwarded-proto': 'http' } })).toBe(false)
    expect(A.isSecure({ headers: {} })).toBe(false)
  })
})

describe('heş başına gündəlik baxış həddi', () => {
  it('maxViewsPerVisitor-dan sonra sayılmır; başqa ziyarətçi və növbəti gün təsirlənmir', () => {
    const db = openDb(':memory:')
    let t = Date.parse('2026-10-31T10:00:00Z')
    const an = A.createAnalytics({ db, now: () => t, maxViewsPerVisitor: 3 })
    const v = { ip: '9.9.9.9', ua: UA_DESKTOP, path: '/', lang: 'az' }
    expect([1, 2, 3, 4, 5].map(() => an.record(v))).toEqual([true, true, true, false, false])
    expect(an.record({ ...v, ip: '8.8.8.8' })).toBe(true)
    let s = an.stats({ from: '2026-10-31', to: '2026-10-31' })
    expect(s.totals).toMatchObject({ views: 4, visitors: 2 })
    t += 86400e3
    expect(an.record(v)).toBe(true)
    s = an.stats({ from: '2026-11-01', to: '2026-11-01' })
    expect(s.totals.views).toBe(1)
  })
  it('susmaya görə hədd 100', () => {
    const db = openDb(':memory:')
    const an = A.createAnalytics({ db, now: () => Date.parse('2026-10-31T10:00:00Z') })
    const v = { ip: '9.9.9.9', ua: UA_DESKTOP, path: '/', lang: 'az' }
    let n = 0
    for (let i = 0; i < 130; i++) if (an.record(v)) n++
    expect(n).toBe(100)
  })
})

describe('çıxarılmış (anomal) günlər', () => {
  let db, an, t
  beforeEach(() => {
    db = openDb(':memory:')
    t = Date.parse('2026-11-22T10:00:00Z')
    an = A.createAnalytics({ db, now: () => t })
    an.record({ ip: '1.1.1.1', ua: UA_IPHONE, path: '/quran', lang: 'az', ref: 'google.com' })
    t = Date.parse('2026-11-23T10:00:00Z')
    for (let i = 0; i < 5; i++) an.record({ ip: `10.0.0.${i}`, ua: UA_CHROME153_WIN, path: '/hadith', lang: 'en' })
    t = Date.parse('2026-11-24T10:00:00Z')
    an.record({ ip: '2.2.2.2', ua: UA_IPHONE, path: '/', lang: 'az' })
  })

  it('cəmlər, seriya, səhifələr və ölçülərdən çıxarılır; xam rəqəm "excluded"-də görünür', () => {
    expect(an.stats({ from: '2026-11-22', to: '2026-11-24' }).totals.views).toBe(7)
    A.excludeDay(db, '2026-11-23', 'bot hücumu')
    const s = an.stats({ from: '2026-11-22', to: '2026-11-24', compare: true })
    expect(s.totals).toMatchObject({ views: 2, visitors: 2, pages: 2 })
    expect(s.series).toEqual([
      { day: '2026-11-22', views: 1, visitors: 1 },
      { day: '2026-11-23', views: 0, visitors: 0, excluded: true },
      { day: '2026-11-24', views: 1, visitors: 1 },
    ])
    expect(s.excluded).toEqual([{ day: '2026-11-23', reason: 'bot hücumu', views: 5, visitors: 5 }])
    expect(s.pages.map((r) => r.key).sort()).toEqual(['/', '/quran'])
    expect(s.languages).toEqual([{ key: 'az', count: 2 }])
    expect(s.devices).toEqual([{ key: 'mobile', count: 2 }])
    expect(s.browsers).toEqual([{ key: 'Safari', count: 2 }])
    expect(s.pageSeries).not.toHaveProperty('/hadith')
    // xam məlumat silinmir; geri qaytarmaq olar
    expect(db.raw.prepare("SELECT views FROM analytics_days WHERE day = '2026-11-23'").get().views).toBe(5)
    expect(A.includeDay(db, '2026-11-23')).toBe(true)
    expect(A.includeDay(db, '2026-11-23')).toBe(false)
    expect(an.stats({ from: '2026-11-22', to: '2026-11-24' }).totals.views).toBe(7)
  })

  it('aralıqdan kənar çıxarılmış gün cavaba düşmür; prev öz excluded-ini daşıyır', () => {
    A.excludeDay(db, '2026-11-23', 'x')
    expect(an.stats({ from: '2026-11-24', to: '2026-11-24' }).excluded).toEqual([])
    const s = an.stats({ from: '2026-11-24', to: '2026-11-24', compare: true })
    expect(s.prev.excluded).toEqual([{ day: '2026-11-23', reason: 'x', views: 5, visitors: 5 }])
    expect(s.prev.totals.views).toBe(0)
  })

  it('excludeDay: yararsız gün rədd edilir, səbəb təmizlənir və qısaldılır, təkrar = yenilənmə', () => {
    expect(() => A.excludeDay(db, '2026-02-30')).toThrow()
    expect(() => A.excludeDay(db, "2026-11-23'; DROP TABLE x;--")).toThrow()
    A.excludeDay(db, '2026-11-23', 'köhnə')
    A.excludeDay(db, '2026-11-23', 'yeni səbəb')
    expect(A.listExcluded(db)).toEqual([{ day: '2026-11-23', reason: 'yeni səbəb', views: 5, visitors: 5 }])
    A.excludeDay(db, '2026-11-24', 'a\nb' + 'z'.repeat(500))
    const r = A.listExcluded(db).find((x) => x.day === '2026-11-24').reason
    expect(r.startsWith('a b')).toBe(true)
    expect(r.length).toBe(200)
  })

  it('köhnə günlərlə birlikdə çıxarılma qeydi də silinir (saxlama müddəti)', () => {
    A.excludeDay(db, '2026-11-22', 'x')
    t = Date.parse('2027-12-31T10:00:00Z')
    an.record({ ip: '3.3.3.3', ua: UA_IPHONE, path: '/', lang: 'az' })
    expect(A.listExcluded(db)).toEqual([])
  })

  it('CLI: add / list / remove', () => {
    const { main } = require('../../server/scripts/analytics-exclude.js')
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'an-ex-'))
    const old = process.env.DB_PATH
    process.env.DB_PATH = path.join(dir, 'x.db')
    const log = console.log
    const err = console.error
    const out = []
    console.log = (...a) => out.push(a.join(' '))
    console.error = (...a) => out.push(a.join(' '))
    try {
      expect(main(['add', '2026-11-23', '2026-11-24', '--reason=bot hücumu'])).toBe(0)
      expect(main(['add', 'bad-day'])).toBe(2)
      expect(main(['add'])).toBe(2)
      expect(main(['nope'])).toBe(2)
      expect(main(['add', '2026-11-23', '--force'])).toBe(2)
      const d2 = openDb(process.env.DB_PATH)
      expect(A.listExcluded(d2).map((r) => [r.day, r.reason])).toEqual([['2026-11-23', 'bot hücumu'], ['2026-11-24', 'bot hücumu']])
      d2.close()
      expect(main(['remove', '2026-11-24'])).toBe(0)
      expect(main(['list'])).toBe(0)
      expect(out.some((l) => l.startsWith('2026-11-23') && l.includes('bot hücumu'))).toBe(true)
      const d3 = openDb(process.env.DB_PATH)
      expect(A.listExcluded(d3).map((r) => r.day)).toEqual(['2026-11-23'])
      d3.close()
    } finally {
      console.log = log
      console.error = err
      if (old === undefined) delete process.env.DB_PATH
      else process.env.DB_PATH = old
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('HTTP: Client Hints yoxlaması (X-Forwarded-Proto: https)', () => {
  let srv, an
  beforeAll(async () => {
    an = A.createAnalytics({ db: openDb(':memory:') })
    const app = express()
    app.post('/api/a', an.handleCollect)
    srv = await listen(app)
  })
  afterAll(() => srv.close())
  const day = () => new Date().toISOString().slice(0, 10)
  const views = () => an.stats({ from: day(), to: day() }).totals.views
  const beacon = (headers) => fetch(srv.url + '/api/a', {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=UTF-8', 'x-forwarded-proto': 'https', ...headers },
    body: JSON.stringify({ p: '/quran' }),
  })

  it('sec-ch-ua-sız Chrome/153 sayılmır, uyğun başlıqlı sayılır, iPhone yoxlanmır', async () => {
    expect((await beacon({ 'user-agent': UA_CHROME153_WIN })).status).toBe(204)
    expect(views()).toBe(0)
    expect((await beacon({ 'user-agent': UA_CHROME153_WIN, 'sec-ch-ua': '"Chromium";v="140"' })).status).toBe(204)
    expect(views()).toBe(0)
    expect((await beacon({ 'user-agent': UA_CHROME153_WIN, 'sec-ch-ua': CH_153 })).status).toBe(204)
    expect(views()).toBe(1)
    expect((await beacon({ 'user-agent': UA_IPHONE })).status).toBe(204)
    expect(views()).toBe(2)
  })
})
