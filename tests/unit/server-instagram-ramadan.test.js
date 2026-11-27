// Server: Instagram "Ramazana N gün qaldı" story-si (server/instagramRamadan.js, server/instagram.js → ramadanTick).
// Saytın /road-to-ramadan hesabı ilə eynilik (tarixlər, addımlar, mətnlər), aktiv pəncərə (90 … 1 gün), tək / cəm ifadə,
// Bakı vaxtı ilə gün sərhədi, bir dəfə dərc (gün, 'ramadan', 'story'), IG_RAMADAN / IG_RAMADAN_TIME, kart (sharp).
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require, express, listen } from './server-helpers.js'
import { buildRamadanData } from '../../scripts/build-instagram-data.mjs'
import * as RANGE from '../../src/utils/ramadanRange.js'
import * as PREP from '../../src/utils/ramadanPrep.js'
import * as PREP_TEXT from '../../src/components/ramadanPrep/prepText.js'
import * as GUIDE from '../../src/data/ramadanGuide.js'
import * as HIJRI from '../../src/utils/hijri.js'

const { openDb } = require('../../server/db.js')
const ig = require('../../server/instagram.js')
const R = require('../../server/instagramRamadan.js')
const DATA = require('../../server/instagram-ramadan-data.js')
const { renderRamadanCard } = require('../../server/instagramCard.js')

const TOKEN = 'IGAAtesttoken0123456789abcdefABCDEF'
const USER = '17841400000000001'
const ENV = { IG_ENABLED: '1', IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: USER, IG_LANG: 'en', IG_CAPTION_LANGS: 'en', IG_SLOTS: '08:00' }
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9])
const silent = { error: () => {}, warn: () => {}, log: () => {} }
/** Bakı (UTC+4, yay vaxtı yoxdur) yerli vaxtı → epoch ms */
const baku = (iso) => Date.parse(`${iso}+04:00`)

let dir, dbs = []
afterEach(() => {
  for (const d of dbs) { try { d.close() } catch { /* */ } }
  dbs = []
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
  dir = null
})
function setup() {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-igr-'))
  const db = openDb(path.join(dir, 'test.db'))
  dbs.push(db)
  return { db, cardDir: path.join(dir, 'ig-cards') }
}

function fakeFetch() {
  const calls = []
  let n = 0
  const fn = async (url, opts = {}) => {
    const u = new URL(String(url))
    calls.push({ method: opts.method, url: u, body: opts.body ? new URLSearchParams(opts.body) : null })
    const reply = (status, body) => ({ ok: status === 200, status, json: async () => body })
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media`)) return reply(200, { id: String(1000 + (++n)) })
    if (opts.method === 'GET' && /^\/v\d+\.\d+\/\d+$/.test(u.pathname)) return reply(200, { status_code: 'FINISHED' })
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media_publish`)) return reply(200, { id: String(9000 + n) })
    throw new Error('unexpected fetch ' + u)
  }
  fn.calls = calls
  return fn
}

const mk = (db, cardDir, { now, env = {}, fetchImpl = fakeFetch(), renderRamadan = async () => JPEG } = {}) => ig.createInstagram({
  db, cardDir, env: { ...ENV, ...env }, publicOrigin: 'https://muslims.cc', now, fetchImpl, sleep: async () => {}, log: silent, pollMs: 0,
  // Adi yuvalar bu testdə vaxtından kənardadır (08:00 yuvası 07:00-da hələ başlamayıb)
  render: async () => JPEG, renderRamadan,
})

// ── Saytın özü: utils/ramadanPrep (RamadanPrepPage ilə eyni) ──
function siteView(day) {
  const st = PREP.ramadanStatus(day)
  const phase = PREP.roadPhase(st)
  if (phase !== 'road') return { phase }
  const step = PREP.roadPlan(st.year).find((p) => p.n === st.daysLeft)
  return { phase, year: st.year, daysLeft: st.daysLeft, kind: step.kind, start: st.range.s }
}

describe('Ramazan geri sayımı — məlumat faylı saytla eynidir', () => {
  it('instagram-ramadan-data.js mənbə ilə eynidir (scripts/build-instagram-data.mjs)', () => {
    const src = { ...RANGE, ...PREP, ...PREP_TEXT, ...GUIDE, ...HIJRI }
    expect(JSON.parse(JSON.stringify(DATA))).toEqual(buildRamadanData(src))
  })

  it('fayl ən azı 10 il irəlini əhatə edir; Ramazan 1448 — 2027-02-08 (saytdakı kimi)', () => {
    expect(DATA.years.at(-1).y).toBeGreaterThanOrEqual(1458)
    const y = DATA.years.find((x) => x.y === 1448)
    expect(y.s).toBe('2027-02-08')
    expect(y.s).toBe(RANGE.ramadanRange(1448).s)
    expect(DATA.years.find((x) => x.y === 1447).s).toBe('2026-02-18')
  })

  it('hər gün (2026–2031): mərhələ, qalan gün və addım saytın yolu ilə eynidir', () => {
    let day = '2026-01-01', roadDays = 0
    while (day <= '2031-12-31') {
      const s = siteView(day), c = R.countdown(day)
      if (s.phase === 'road') {
        roadDays++
        expect(c, day).toMatchObject({ phase: 'road', active: true, year: s.year, daysLeft: s.daysLeft, n: s.daysLeft, kind: s.kind, start: s.start })
      } else {
        expect(c.active, day).toBe(false)
        expect(c.phase, day).toBe(s.phase)
      }
      day = R.shiftDay(day, 1)
    }
    expect(roadDays).toBe(48 + 6 * 90)   // 1447-nin yolunun son 48 günü (2026-01-01 … 02-17) + 1448–1453 tam
  })

  it('hicri tarix saytdakı formatHijri ilə eynidir', () => {
    for (const d of ['2026-11-27', '2027-01-09', '2027-02-07', '2027-11-01', '2030-12-31']) {
      for (const l of ['az', 'en', 'ru', 'tr', 'ar']) {
        expect(R.hijriLabel(d, l), `${d} ${l}`).toBe(HIJRI.formatHijri(HIJRI.gregorianToHijri(HIJRI.parseGKey(d)), l))
      }
    }
    expect(R.hijriLabel('2026-11-27', 'en')).toBe('17 Jumada al-Akhirah 1448 AH')
  })

  it('addımların mətni prepText.js-dən olduğu kimi; "g:<bölmə>" — bələdçinin başlığı ilə', () => {
    expect(R.stepText('moon', 'en')).toEqual({ title: PREP_TEXT.STEP_TEXT.moon.title.en, text: PREP_TEXT.STEP_TEXT.moon.text.en })
    const g = GUIDE.RAMADAN_GUIDE.find((s) => s.id === 'virtues')
    expect(R.stepText('g:virtues', 'en')).toEqual({ title: PREP_TEXT.T.en.guideStep(g.title.en), text: PREP_TEXT.T.en.guideText })
    for (const k of PREP.STEP_KINDS) expect(R.stepText(k, 'en').title, k).toBeTruthy()
  })
})

describe('Ramazan geri sayımı — pəncərə və ifadələr', () => {
  it('aktiv pəncərə: 90 … 1 gün qalan; 91 gün — gözləyir; Ramazan və sonrası — sönülü', () => {
    expect(R.countdown('2026-11-09')).toMatchObject({ phase: 'early', active: false, daysLeft: 91, opensOn: '2026-11-10' })
    expect(R.countdown('2026-11-10')).toMatchObject({ phase: 'road', active: true, daysLeft: 90, kind: 'qada-count' })
    expect(R.countdown('2027-02-07')).toMatchObject({ phase: 'road', active: true, daysLeft: 1, kind: 'moon' })
    expect(R.countdown('2027-02-08')).toMatchObject({ phase: 'ramadan', active: false, day: 1, year: 1448 })
    expect(R.countdown('2027-03-08')).toMatchObject({ phase: 'ramadan', active: false, day: 29 })
    expect(R.countdown('2027-03-09')).toMatchObject({ phase: 'early', active: false, year: 1449 })
    expect(R.countdown('2026-13-01')).toEqual({ phase: 'none', active: false })
    expect(R.countdown('9999-01-01')).toEqual({ phase: 'none', active: false })
    expect(R.storyContent('2027-02-08', 'en')).toBeNull()
  })

  it('bütöv ifadə: 1 gün — tək, qalanları — cəm (prepText T.daysLeft)', () => {
    expect(R.daysLeftPhrase(1, 'en')).toBe('1 day until Ramadan')
    expect(R.daysLeftPhrase(2, 'en')).toBe('2 days until Ramadan')
    expect(R.daysLeftPhrase(90, 'en')).toBe('90 days until Ramadan')
    expect(R.daysLeftPhrase(21, 'ru')).toBe(PREP_TEXT.T.ru.daysLeft(21))
    expect(R.daysLeftPhrase(0, 'en')).toBeNull()
    expect(R.daysLeftPhrase(91, 'en')).toBeNull()
    expect(R.storyContent('2027-02-07', 'en').headline).toBe('1 day until Ramadan')
    expect(R.storyContent('2027-02-06', 'en').headline).toBe('2 days until Ramadan')
  })

  it('story məzmunu: başlıq, hicri tarix, gözlənilən başlanğıc, addım, dil prefiksli keçid', () => {
    const c = R.storyContent('2026-11-27', 'en')
    expect(c).toMatchObject({
      kind: 'ramadan', key: 'ramadan:1448:73', headline: '73 days until Ramadan', hijri: '17 Jumada al-Akhirah 1448 AH',
      startsOn: 'Expected start: 8 February 2027', eyebrow: 'Road to Ramadan', stepLabel: 'Today’s step', link: 'muslims.cc/en/road-to-ramadan',
    })
    expect(c.stepTitle).toBe(R.stepText(siteView('2026-11-27').kind, 'en').title)
    expect(R.roadLink('az')).toBe('muslims.cc/road-to-ramadan')
    expect(R.roadLink('ru')).toBe('muslims.cc/ru/road-to-ramadan')
  })

  it('parseConfig: IG_RAMADAN susmaya görə açıq, "0" söndürür; IG_RAMADAN_TIME susmaya görə 07:00', () => {
    expect(ig.parseConfig(ENV)).toMatchObject({ ramadan: true, ramadanTime: '07:00' })
    expect(ig.parseConfig({ ...ENV, IG_RAMADAN: '0' }).ramadan).toBe(false)
    expect(ig.parseConfig({ ...ENV, IG_RAMADAN_TIME: '6:30' }).ramadanTime).toBe('06:30')
    expect(ig.parseConfig({ ...ENV, IG_RAMADAN_TIME: '25:00' }).ramadanTime).toBe('07:00')
  })
})

describe('Ramazan geri sayımı — Bakı vaxtı ilə gün', () => {
  it('UTC 20:00-dan sonra Bakıda artıq ertəsi gündür', () => {
    const { db, cardDir } = setup()
    // 2027-02-06 23:59 Bakı = 19:59 UTC → 2 gün; 2027-02-07 00:00 Bakı = 2027-02-06 20:00 UTC → 1 gün
    expect(mk(db, cardDir, { now: () => baku('2027-02-06T23:59:00') }).status().ramadan).toMatchObject({ date: '2027-02-06', daysLeft: 2, active: true })
    expect(mk(db, cardDir, { now: () => Date.parse('2027-02-06T20:00:00Z') }).status().ramadan).toMatchObject({ date: '2027-02-07', daysLeft: 1, active: true, step: { n: 1, kind: 'moon' } })
    // Ramazanın 1-i Bakıda 00:00-da başlayır (UTC-də hələ 7 fevraldır) → sönülü
    expect(mk(db, cardDir, { now: () => Date.parse('2027-02-07T20:30:00Z') }).status().ramadan).toMatchObject({ date: '2027-02-08', phase: 'ramadan', active: false })
  })
})

describe('Ramazan geri sayımı — dərc', () => {
  it('07:00 Bakı: bir story (STORIES, kartın URL-i), təkrar tick və ikinci proses dərc etmir', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    const now = () => baku('2026-11-27T07:00:30')
    const m = mk(db, cardDir, { now, fetchImpl: f })
    expect(await m.tick()).toBe(1)
    const media = f.calls.filter((c) => c.method === 'POST' && c.url.pathname.endsWith(`/${USER}/media`))
    expect(media).toHaveLength(1)
    expect(media[0].body.get('media_type')).toBe('STORIES')
    expect(media[0].body.get('image_url')).toBe('https://muslims.cc/api/ig/card/2026-11-27-ramadan-story.jpg')
    expect(media[0].body.get('caption')).toBeNull()
    expect(fs.readFileSync(path.join(cardDir, '2026-11-27-ramadan-story.jpg'))).toEqual(JPEG)
    const row = m.status().posts[0]
    expect(row).toMatchObject({ day: '2026-11-27', slot: 'ramadan', format: 'story', kind: 'ramadan', status: 'published', item: 'ramadan:1448:73' })
    expect(m.status().ramadan.post).toMatchObject({ status: 'published', item: 'ramadan:1448:73' })
    // təkrar tick və eyni bazada ikinci proses (blue/green)
    expect(await m.tick()).toBe(0)
    expect(await mk(db, cardDir, { now, fetchImpl: f }).tick()).toBe(0)
    expect(f.calls.filter((c) => c.url.pathname.endsWith('/media_publish'))).toHaveLength(1)
    // kart marşrutu
    const app = express(); app.use('/api', m.router)
    const srv = await listen(app)
    try {
      const r = await fetch(`${srv.url}/api/ig/card/2026-11-27-ramadan-story.jpg`)
      expect(r.status).toBe(200)
      expect(r.headers.get('content-type')).toBe('image/jpeg')
      expect((await fetch(`${srv.url}/api/ig/card/2026-11-27-ramadan-feed.jpg`)).status).toBe(404)
    } finally { await srv.close() }
  })

  it('vaxtından əvvəl / 90 dəqiqədən sonra, Ramazanda və IG_RAMADAN=0 ilə heç nə etmir', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    expect(await mk(db, cardDir, { now: () => baku('2026-11-27T06:59:00'), fetchImpl: f }).tick()).toBe(0)
    expect(await mk(db, cardDir, { now: () => baku('2026-11-27T08:31:00'), fetchImpl: f, env: { IG_SLOTS: '20:00' } }).tick()).toBe(0)
    expect(await mk(db, cardDir, { now: () => baku('2027-02-10T07:05:00'), fetchImpl: f }).tick()).toBe(0)
    expect(await mk(db, cardDir, { now: () => baku('2026-11-27T07:05:00'), fetchImpl: f, env: { IG_RAMADAN: '0' } }).tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
    expect(mk(db, cardDir, { now: () => baku('2027-02-10T07:05:00') }).status().posts).toHaveLength(0)
    // IG_RAMADAN_TIME: 06:00 — 06:10-da dərc
    expect(await mk(db, cardDir, { now: () => baku('2026-11-28T06:10:00'), fetchImpl: f, env: { IG_RAMADAN_TIME: '06:00' } }).tick()).toBe(1)
  })

  it('kart sığmırsa — "failed", təkrar cəhd yoxdur', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    const m = mk(db, cardDir, { now: () => baku('2026-11-27T07:01:00'), fetchImpl: f, renderRamadan: async () => null })
    expect(await m.tick()).toBe(0)
    expect(m.status().ramadan.post).toMatchObject({ status: 'failed' })
    expect(f.calls).toHaveLength(0)
  })

  it('admin önizləməsi: slot "ramadan" — JPEG; aktiv deyilsə 422', async () => {
    const { db, cardDir } = setup()
    const admin = (req, res, next) => { req.adminUser = { id: 1, via: 'session' }; next() }
    const appFor = (now) => {
      const m = mk(db, cardDir, { now })
      const app = express(); app.use('/api', m.adminRouter({ requireAdmin: admin, adminRoleOf: () => 'superadmin' }))
      return app
    }
    const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    let srv = await listen(appFor(() => baku('2026-11-27T12:00:00')))
    try {
      const r = await post(`${srv.url}/api/admin/instagram/preview`, { slot: 'ramadan' })
      expect(r.status).toBe(200)
      expect(r.headers.get('content-type')).toBe('image/jpeg')
      expect(decodeURIComponent(r.headers.get('x-ig-item'))).toBe('ramadan:1448:73')
      expect((await post(`${srv.url}/api/admin/instagram/preview`, { slot: 'ramadan', lang: 'xx' })).status).toBe(400)
      const st = await (await fetch(`${srv.url}/api/admin/instagram`)).json()
      expect(st.ramadan).toMatchObject({ enabled: true, time: '07:00', active: true, daysLeft: 73, year: 1448, start: '2027-02-08' })
    } finally { await srv.close() }
    srv = await listen(appFor(() => baku('2027-02-12T12:00:00')))
    try {
      const r = await post(`${srv.url}/api/admin/instagram/preview`, { slot: 'ramadan' })
      expect(r.status).toBe(422)
      expect((await r.json()).code).toBe('ramadan_inactive')
    } finally { await srv.close() }
  })
})

describe('Ramazan geri sayımı — kart (sharp)', () => {
  it('story 1080×1920 JPEG (dawn); yararsız məzmun → null', async () => {
    const sharp = require('sharp')
    for (const lang of ['en', 'ar']) {
      const buf = await renderRamadanCard(R.storyContent('2027-01-05', lang), { theme: 'dawn', lang })
      const meta = await sharp(buf).metadata()
      expect(meta).toMatchObject({ format: 'jpeg', width: 1080, height: 1920 })
    }
    expect(await renderRamadanCard({ headline: '', stepTitle: 'x' })).toBeNull()
    expect(await renderRamadanCard({ headline: 'x'.repeat(81), stepTitle: 'x' })).toBeNull()
  })
})
