// Server: Instagram avtoposteri (server/instagram.js, server/instagramCard.js) — env-siz tam sönülü, konteyner → status →
// publish axını, iki proses arasında bir dəfə dərc, təkrar cəhd, avtorizasiya xətasında dayanma, caption, "Səhih" qaydası,
// mətnin sığdırılması, kart marşrutu (qovluq keçidi yoxdur), admin rolları. Şəbəkə yoxdur: fetch saxtadır.
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require, express, listen } from './server-helpers.js'
import { buildInstagramData } from '../../scripts/build-instagram-data.mjs'

const { openDb } = require('../../server/db.js')
const ig = require('../../server/instagram.js')
const card = require('../../server/instagramCard.js')
const { renderCard } = card
const LIST = require('../../server/daily-hadith-data.js')
const IG_DATA = require('../../server/instagram-data.js')

const TOKEN = 'IGAAtesttoken0123456789abcdefABCDEF'
const USER = '17841400000000001'
const ENV = { IG_ENABLED: '1', IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: USER }
// 2026-11-25 08:00:30 Asia/Baku (UTC+4)
const T0 = Date.parse('2026-11-25T04:00:30Z')
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9])
const silent = { error: () => {}, warn: () => {}, log: () => {} }

let dir, dbs = []
afterEach(() => {
  for (const d of dbs) { try { d.close() } catch { /* */ } }
  dbs = []
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
  dir = null
})
function setup() {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-ig-'))
  const db = openDb(path.join(dir, 'test.db'))
  dbs.push(db)
  return { db, cardDir: path.join(dir, 'ig-cards') }
}

/** Saxta Graph API + alquran.cloud. opts.publishFail: media_publish-in ilk N cavabı (status, error) */
function fakeFetch({ publishFail = [], mediaError = null, polls = 1 } = {}) {
  const calls = []
  let n = 0, pf = [...publishFail]
  const fn = async (url, opts = {}) => {
    const u = new URL(String(url))
    if (u.hostname === 'api.alquran.cloud') {
      const m = /ayah\/(\d+):(\d+)\/editions\/(.+)$/.exec(u.pathname)
      const [s, a] = [Number(m[1]), Number(m[2])]
      const data = m[3].split(',').map((id) => ({ edition: { identifier: id }, surah: { number: s, englishName: 'Al-Test', name: 'سورة' }, numberInSurah: a, text: id === 'quran-uthmani' ? 'بِسْمِ ٱللَّهِ' : `TEXT-${id}` }))
      return { ok: true, status: 200, json: async () => ({ code: 200, data }) }
    }
    calls.push({ method: opts.method, url: u, headers: opts.headers || {}, body: opts.body ? new URLSearchParams(opts.body) : null })
    const reply = (status, body) => ({ ok: status === 200, status, json: async () => body })
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media`)) {
      if (mediaError) return reply(400, { error: mediaError })
      return reply(200, { id: String(1000 + (++n)) })
    }
    if (opts.method === 'GET' && /^\/v\d+\.\d+\/\d+$/.test(u.pathname)) {
      const k = u.pathname
      fn.seen[k] = (fn.seen[k] || 0) + 1
      return reply(200, { status_code: fn.seen[k] > polls ? 'FINISHED' : 'IN_PROGRESS', id: k.split('/').pop() })
    }
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media_publish`)) {
      const f = pf.shift()
      if (f) return reply(f.status, { error: f.error })
      return reply(200, { id: String(9000 + n) })
    }
    if (u.pathname === '/refresh_access_token') return reply(200, { access_token: 'IGAArefreshed0123456789abcdefXYZ', token_type: 'bearer', expires_in: 5183944 })
    throw new Error('unexpected fetch ' + u)
  }
  fn.calls = calls
  fn.seen = {}
  return fn
}

const mk = (db, cardDir, extra = {}) => ig.createInstagram({
  db, cardDir, env: { ...ENV, ...(extra.env || {}) }, publicOrigin: 'https://muslims.cc', now: extra.now || (() => T0),
  fetchImpl: extra.fetchImpl, sleep: async () => {}, log: extra.log || silent, pollMs: 0, render: extra.render || (async () => JPEG),
})

describe('instagram — konfiqurasiya və sönülü rejim', () => {
  it('parseConfig: IG_ENABLED=1 + token + id olmadan sönülüdür', () => {
    expect(ig.parseConfig({}).enabled).toBe(false)
    expect(ig.parseConfig({}).reason).toBe('disabled')
    expect(ig.parseConfig({ IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: USER }).reason).toBe('disabled')
    expect(ig.parseConfig({ IG_ENABLED: '1', IG_USER_ID: USER }).reason).toBe('missing_credentials')
    expect(ig.parseConfig({ IG_ENABLED: '1', IG_ACCESS_TOKEN: 'bad token!', IG_USER_ID: USER }).reason).toBe('bad_format')
    expect(ig.parseConfig({ IG_ENABLED: '1', IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: 'abc' }).reason).toBe('bad_format')
    const c = ig.parseConfig(ENV)
    expect(c).toMatchObject({ enabled: true, lang: 'az', slots: ['08:00', '13:00', '20:00'], stories: true, host: 'graph.instagram.com', version: 'v27.0' })
  })

  it('parseConfig: yuvalar, dil, story, host — yalnız icazəli dəyərlər', () => {
    expect(ig.parseSlots('20:00, 7:30,20:00')).toEqual(['07:30', '20:00'])
    expect(ig.parseSlots('25:00')).toEqual(ig.DEFAULT_SLOTS)
    expect(ig.parseSlots('1:00,2:00,3:00,4:00,5:00,6:00,7:00')).toEqual(ig.DEFAULT_SLOTS)
    const c = ig.parseConfig({ ...ENV, IG_LANG: 'xx', IG_STORIES: '0', IG_API_HOST: 'evil.example.com', IG_API_VERSION: '../x' })
    expect(c).toMatchObject({ lang: 'az', stories: false, host: 'graph.instagram.com', version: 'v27.0' })
    expect(ig.parseConfig({ ...ENV, IG_LANG: 'ru', IG_API_HOST: 'graph.facebook.com' })).toMatchObject({ lang: 'ru', host: 'graph.facebook.com' })
  })

  it('env yoxdursa: şəbəkə sorğusu yoxdur, fayl yoxdur, /api/ig/* → 404', async () => {
    const { db, cardDir } = setup()
    const fetchImpl = fakeFetch()
    const m = ig.createInstagram({ db, cardDir, env: {}, fetchImpl, now: () => T0, log: silent, render: async () => JPEG })
    expect(m.enabled).toBe(false)
    expect(await m.tick()).toBe(0)
    expect(await m.refreshTick()).toBe(false)
    expect(await m.publishNow(0)).toEqual({ error: 'disabled' })
    expect(fetchImpl.calls).toHaveLength(0)
    expect(fs.existsSync(cardDir)).toBe(false)
    const app = express(); app.use('/api', m.router)
    const srv = await listen(app)
    try {
      expect((await fetch(`${srv.url}/api/ig/card/2026-11-25-0-feed.jpg`)).status).toBe(404)
    } finally { await srv.close() }
  })
})

describe('instagram — məzmun, caption, "Səhih" qaydası', () => {
  it('yuva → növ: ayə, hədis, 3-cü yuva tək/cüt günə görə ad / dua', () => {
    expect(ig.kindFor(0, '2026-11-25')).toBe('ayah')
    expect(ig.kindFor(1, '2026-11-25')).toBe('hadith')
    const a = ig.kindFor(2, '2026-11-25'), b = ig.kindFor(2, '2026-11-26')
    expect(new Set([a, b])).toEqual(new Set(['dua', 'name']))
    expect(ig.themeFor('20:00')).toBe('night')
    expect(ig.themeFor('08:00')).toBe('day')
  })

  it('"Səhih" yalnız Buxari / Müslim; Sünən rəvayətində yalnız mənbə', () => {
    expect(ig.isBukhariMuslim('Buxari 8')).toBe(true)
    expect(ig.isBukhariMuslim('Muslim 35')).toBe(true)
    expect(ig.isBukhariMuslim('Buxari, Ədəb əl-Müfrəd 12')).toBe(false)
    expect(ig.isBukhariMuslim('Tirmizi 2516')).toBe(false)
    const bm = LIST.find((h) => /^Buxari/.test(h.src.az))
    expect(ig.hadithContent('az', bm, 'https://muslims.cc').ref).toBe(`${bm.src.az} · Səhih`)
    expect(ig.hadithContent('en', bm, 'https://muslims.cc').ref).toBe(`${bm.src.en} · Sahih`)
    const other = LIST.find((h) => !ig.isBukhariMuslim(h.src.az))
    if (other) expect(ig.hadithContent('az', other, 'https://muslims.cc').ref).toBe(other.src.az)
    for (const d of IG_DATA.duas) expect(d.sahih).toBe(ig.isBukhariMuslim(d.src.az))
    const dua = IG_DATA.duas.find((d) => !d.sahih)
    expect(ig.duaContent('az', dua, 'https://muslims.cc').ref).not.toMatch(/Səhih/)
  })

  it('instagram-data.js mənbə ilə eynidir (scripts/build-instagram-data.mjs)', () => {
    expect(JSON.parse(JSON.stringify(IG_DATA))).toEqual(buildInstagramData())
    expect(IG_DATA.names).toHaveLength(99)
  })

  it('caption: mətn olduğu kimi + mənbə + dilli keçid + heşteqlər; riya dili yoxdur', () => {
    const h = LIST[0]
    const c = ig.hadithContent('az', h, 'https://muslims.cc')
    const cap = ig.buildCaption(c, 'az')
    expect(cap).toContain(h.t.az)
    expect(cap).toContain(h.t.ar)
    expect(cap).toContain(`— ${h.src.az}`)
    expect(cap).toContain(`https://muslims.cc/hadith/${h.id}`)
    expect(cap).toContain('#muslimscc')
    expect(cap).not.toMatch(/follow|like|izləyin|bəyənin|reyting|ranking/i)
    const en = ig.buildCaption(ig.hadithContent('en', h, 'https://muslims.cc'), 'en')
    expect(en).toContain(`https://muslims.cc/en/hadith/${h.id}`)
    const n = IG_DATA.names[0]
    const nc = ig.nameContent('ru', n, 'https://muslims.cc')
    expect(nc.link).toBe(`https://muslims.cc/ru/names/${n.n}-${n.slug}`)
    expect(nc.ref).toBe(`Доказательство: ${n.proof.ru}`)
    // Çox uzun: əvvəl ərəbcə çıxarılır, yenə sığmırsa null (mətn qısaldılmır)
    const long = { ...c, text: 'x '.repeat(1200) }
    expect(ig.buildCaption(long, 'az')).toBeNull()
  })

  it('IG_CAPTION_LANGS: susmaya görə az,en; yalnız 5 dil, ən çox 2', () => {
    expect(ig.parseConfig(ENV).captionLangs).toEqual(['az', 'en'])
    expect(ig.parseCaptionLangs('ru')).toEqual(['ru'])
    expect(ig.parseCaptionLangs('en,az,ru')).toEqual(['en', 'az'])
    expect(ig.parseCaptionLangs('xx,,')).toEqual(['az', 'en'])
  })

  it('ikidilli caption: az + "—" + en (eyni elementin sayt mətni), az mənbə və keçid, ≤ 6 heşteq', () => {
    const h = LIST.find((x) => /^Buxari/.test(x.src.az))
    const c = ig.hadithContent('ru', h, 'https://muslims.cc')
    c.variant = (L) => ig.hadithContent(L, h, 'https://muslims.cc')
    const cap = ig.buildCaptionMulti(c, ['az', 'en'])
    expect(cap.startsWith('Günün hədisi')).toBe(true)
    expect(cap).toContain(h.t.ar)
    expect(cap).toContain(h.t.az + '\n—\n' + h.t.en)
    expect(cap).toContain('— ' + h.src.az + ' · Səhih')
    expect(cap).toContain('https://muslims.cc/hadith/' + h.id)
    expect(cap).not.toContain('/en/hadith/')
    const tags = cap.split('\n').at(-1).split(' ')
    expect(tags.length).toBeLessThanOrEqual(6)
    expect(new Set(tags).size).toBe(tags.length)
    expect(tags).toEqual(expect.arrayContaining(['#muslimscc', '#hadith']))
    // 2-ci dil olmadan — yalnız az
    expect(ig.buildCaptionMulti(c, ['az'])).toBe(ig.buildCaption(ig.hadithContent('az', h, 'https://muslims.cc'), 'az'))
  })

  it('ikidilli caption: ingiliscə sayt mətni yoxdursa və ya 2200-ü keçirsə — yalnız az (tərcümə edilmir)', () => {
    const d = IG_DATA.duas[0]
    const az = ig.duaContent('az', d, 'https://muslims.cc')
    const noEn = { ...az }
    Object.defineProperty(noEn, 'variant', { value: (L) => (L === 'en' ? { ...az, text: '' } : az) })
    expect(ig.buildCaptionMulti(noEn, ['az', 'en'])).toBe(ig.buildCaption(az, 'az'))
    const long = { ...az }
    Object.defineProperty(long, 'variant', { value: (L) => (L === 'en' ? { ...az, text: 'word '.repeat(450) } : az) })
    const cap = ig.buildCaptionMulti(long, ['az', 'en'])
    expect(cap).toBe(ig.buildCaption(az, 'az'))
    expect(cap.length).toBeLessThanOrEqual(2200)
    // variant yoxdursa (köhnə çağırış) — content özü, monodil
    expect(ig.buildCaptionMulti(az, ['az', 'en'])).toBe(ig.buildCaption(az, 'az'))
  })

  it('xəta növləri: avtorizasiya, limit, keçici', () => {
    expect(ig.classifyError({ code: 190 }, 400)).toBe('auth')
    expect(ig.classifyError({ code: 10 }, 400)).toBe('auth')
    expect(ig.classifyError({ code: 9, error_subcode: 2207042 }, 400)).toBe('limit')
    expect(ig.classifyError({ code: 4 }, 400)).toBe('rate')
    expect(ig.classifyError({}, 503)).toBe('transient')
    expect(ig.classifyError({ code: 100, error_subcode: 2207052 }, 400)).toBe('media')
    expect(ig.classifyError({ code: 100 }, 400)).toBe('fatal')
  })

  it('token qeydi: AES-GCM, yalnız eyni env tokeni ilə açılır', () => {
    const s = ig.sealToken(TOKEN, { t: 'IGAAnewtoken0123456789abcdefgh', refreshedAt: 1 })
    expect(s).not.toContain('IGAAnew')
    expect(ig.openToken(TOKEN, s)).toMatchObject({ t: 'IGAAnewtoken0123456789abcdefgh' })
    expect(ig.openToken(TOKEN + 'x', s)).toBeNull()
    expect(ig.openToken(TOKEN, 'garbage')).toBeNull()
  })
})

describe('instagram — dərc axını', () => {
  it('konteyner → status (FINISHED) → media_publish; feed + story; token yalnız başlıqda; kart xidmət olunur', async () => {
    const { db, cardDir } = setup()
    const fetchImpl = fakeFetch({ polls: 2 })
    const m = mk(db, cardDir, { fetchImpl })
    expect(m.enabled).toBe(true)
    expect(await m.tick()).toBe(2)
    const graph = fetchImpl.calls
    const seq = graph.map((c) => `${c.method} ${c.url.pathname.replace(/\d{4,}/g, 'N')}`)
    expect(seq[0]).toBe('POST /v27.0/N/media')
    expect(seq.filter((s) => s === 'GET /v27.0/N')).toHaveLength(6)   // 2 × (IN_PROGRESS, IN_PROGRESS, FINISHED)
    expect(seq.filter((s) => s === 'POST /v27.0/N/media_publish')).toHaveLength(2)
    for (const c of graph) {
      expect(c.url.hostname).toBe('graph.instagram.com')
      expect(c.headers.Authorization).toBe(`Bearer ${TOKEN}`)
      expect(c.url.toString()).not.toContain(TOKEN)
    }
    const feed = graph[0].body, story = graph.find((c, i) => i > 0 && c.body && c.body.get('media_type') === 'STORIES').body
    expect(feed.get('image_url')).toBe('https://muslims.cc/api/ig/card/2026-11-25-0-feed.jpg')
    expect(feed.get('caption')).toMatch(/^Günün ayəsi/)
    expect(story.get('image_url')).toBe('https://muslims.cc/api/ig/card/2026-11-25-0-story.jpg')
    expect(story.get('caption')).toBeNull()
    const posts = m.status().posts
    expect(posts.map((p) => [p.format, p.status, p.kind])).toEqual(expect.arrayContaining([['feed', 'published', 'ayah'], ['story', 'published', 'ayah']]))
    expect(posts.every((p) => /^\d+$/.test(p.ig_media_id) && /^ayah:/.test(p.item))).toBe(true)

    const app = express(); app.use('/api', m.router)
    const srv = await listen(app)
    try {
      const r = await fetch(`${srv.url}/api/ig/card/2026-11-25-0-feed.jpg`)
      expect(r.status).toBe(200)
      expect(r.headers.get('content-type')).toBe('image/jpeg')
      expect(Buffer.from(await r.arrayBuffer())).toEqual(JPEG)
      for (const bad of ['..%2F..%2Ftest.db', '2026-11-25-0-feed.png', '2026-11-25-9-feed.jpg', '%2e%2e', 'x.jpg']) {
        expect((await fetch(`${srv.url}/api/ig/card/${bad}`)).status).toBe(404)
      }
    } finally { await srv.close() }
  })

  it('bir dəfə: təkrar tick və eyni bazada ikinci proses (blue/green) dərc etmir', async () => {
    const { db, cardDir } = setup()
    const f1 = fakeFetch()
    const a = mk(db, cardDir, { fetchImpl: f1 })
    const f2 = fakeFetch()
    const b = mk(db, cardDir, { fetchImpl: f2 })
    const [na, nb] = await Promise.all([a.tick(), b.tick()])
    expect(na + nb).toBe(2)
    const before = f1.calls.length + f2.calls.length
    expect(await a.tick()).toBe(0)
    expect(await b.tick()).toBe(0)
    expect(f1.calls.length + f2.calls.length).toBe(before)
    expect([...f1.calls, ...f2.calls].filter((c) => c.url.pathname.endsWith('/media_publish'))).toHaveLength(2)
  })

  it('yuva vaxtından kənar heç nə etmir; 90 dəq ərzində tutur', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => T0 - 60e3 }).tick()).toBe(0)
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => T0 + 120 * 60e3 }).tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => T0 + 60 * 60e3 }).tick()).toBe(2)
  })

  it('keçici xəta → fasilə ilə təkrar; vaxt çatanda dərc olunur', async () => {
    const { db, cardDir } = setup()
    let t = T0
    const f = fakeFetch({ publishFail: [{ status: 500, error: { code: 2, message: 'Service temporarily unavailable' } }] })
    const m = mk(db, cardDir, { fetchImpl: f, now: () => t, env: { IG_STORIES: '0' } })
    expect(await m.tick()).toBe(0)
    let row = m.status().posts[0]
    expect(row).toMatchObject({ status: 'retry', format: 'feed', attempts: 1 })
    expect(await m.tick()).toBe(0)                 // fasilə bitməyib
    t += 2 * 60e3 + 1000
    expect(await m.tick()).toBe(1)
    row = m.status().posts[0]
    expect(row).toMatchObject({ status: 'published', attempts: 2 })
  })

  it('avtorizasiya xətası (190) → dayanır, bir dəfə loglanır, token loglanmır', async () => {
    const { db, cardDir } = setup()
    const logs = []
    const log = { error: (...a) => logs.push(a.join(' ')), warn: (...a) => logs.push(a.join(' ')), log: () => {} }
    const f = fakeFetch({ mediaError: { code: 190, type: 'OAuthException', message: 'Error validating access token' } })
    const m = mk(db, cardDir, { fetchImpl: f, log })
    expect(await m.tick()).toBe(0)
    expect(f.calls).toHaveLength(1)                // story-yə keçmir
    expect(await m.tick()).toBe(0)
    expect(f.calls).toHaveLength(1)
    expect(m.status().reason).toBe('auth_error')
    expect(logs.filter((l) => /avtorizasiya/.test(l))).toHaveLength(1)
    expect(logs.join('\n')).not.toContain(TOKEN)
    expect(await m.publishNow(0)).toEqual({ error: 'auth_error' })
  })

  it('kart sığmayanda sıradakı element götürülür (mətn qısaldılmır)', async () => {
    const { db, cardDir } = setup()
    const seen = []
    const render = async (c) => { seen.push(c.key); return seen.length <= 2 ? null : JPEG }
    const m = mk(db, cardDir, { fetchImpl: fakeFetch(), render })
    const p = await m.prepare('2026-11-25', 1, { formats: ['feed'] })
    expect(p).not.toBeNull()
    expect(new Set(seen).size).toBe(3)
    expect(p.content.key).toBe(seen[2])
    const none = mk(db, cardDir, { fetchImpl: fakeFetch(), render: async () => null })
    expect(await none.prepare('2026-11-25', 1, { formats: ['feed'] })).toBeNull()
  })

  it('publishNow: gündə yuva başına bir dəfə', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, now: () => T0 + 3 * 3600e3 })
    expect(await m.publishNow(1)).toEqual({ results: { feed: 'published', story: 'published' } })
    expect(await m.publishNow(1)).toEqual({ results: { feed: 'already', story: 'already' } })
    expect(await m.publishNow(7)).toEqual({ error: 'bad_slot' })
  })

  it('token yenilənməsi: ən azı 2 gün sonra, gündə bir dəfə; yeni token bazada şifrəli, sonrakı sorğularda istifadə olunur', async () => {
    const { db, cardDir } = setup()
    let t = T0
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, now: () => t })
    expect(await m.refreshTick()).toBe(false)       // env tokeni təzə görünür
    t += 3 * 864e5
    expect(await m.refreshTick()).toBe(true)
    expect(await m.refreshTick()).toBe(false)
    const raw = db.raw || db
    const stored = raw.prepare("SELECT v FROM instagram_state WHERE k = 'token'").get().v
    expect(stored).not.toContain('IGAArefreshed')
    expect(m.status().token.source).toBe('refreshed')
    const r = f.calls.find((c) => c.url.pathname === '/refresh_access_token')
    expect(r.url.searchParams.get('grant_type')).toBe('ig_refresh_token')
    t = Date.parse('2026-11-28T09:00:10Z')          // 13:00 Bakı
    await m.tick()
    expect(f.calls.at(-1).headers.Authorization).toBe('Bearer IGAArefreshed0123456789abcdefXYZ')
  })
})

describe('instagram — admin marşrutları', () => {
  async function adminApp(m, role) {
    const app = express()
    const requireAdmin = (req, res, next) => { req.adminUser = { id: 'a1', via: 'session' }; next() }
    app.use('/api', m.adminRouter({ requireAdmin, adminRoleOf: () => role }))
    return listen(app)
  }
  it('status: admin+; önizləmə və dərc: yalnız superadmin, təsdiq tələb olunur', async () => {
    const { db, cardDir } = setup()
    const m = mk(db, cardDir, { fetchImpl: fakeFetch() })
    for (const [role, st] of [['editor', 403], ['admin', 200], ['superadmin', 200]]) {
      const srv = await adminApp(m, role)
      try { expect((await fetch(`${srv.url}/api/admin/instagram`)).status).toBe(st) } finally { await srv.close() }
    }
    const adm = await adminApp(m, 'admin')
    try {
      const r = await fetch(`${adm.url}/api/admin/instagram/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"slot":0}' })
      expect(r.status).toBe(403)
    } finally { await adm.close() }
    const sup = await adminApp(m, 'superadmin')
    try {
      const s = await (await fetch(`${sup.url}/api/admin/instagram`)).json()
      expect(s).toMatchObject({ enabled: true, lang: 'az', next: { date: '2026-11-25', time: '13:00', kind: 'hadith' } })
      expect(JSON.stringify(s)).not.toContain(TOKEN)
      const p = await fetch(`${sup.url}/api/admin/instagram/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"slot":1,"format":"story"}' })
      expect(p.status).toBe(200)
      expect(p.headers.get('content-type')).toBe('image/jpeg')
      expect(decodeURIComponent(p.headers.get('x-ig-caption'))).toMatch(/^Günün hədisi/)
      expect((await fetch(`${sup.url}/api/admin/instagram/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"slot":"x"}' })).status).toBe(400)
      expect((await fetch(`${sup.url}/api/admin/instagram/preview`, { method: 'POST' })).status).toBe(400)
      expect((await fetch(`${sup.url}/api/admin/instagram/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"slot":0}' })).status).toBe(400)
      const ok = await fetch(`${sup.url}/api/admin/instagram/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"slot":0,"confirm":true}' })
      expect(ok.status).toBe(202)
    } finally { await sup.close() }
  })
})

describe('instagram — ərəb mətninin çəkilməsi (Quran işarələri)', () => {
  it('Quran mətni (ayə, ad) — Amiri Quran; hədis / dua — Amiri', () => {
    expect(card.arabicFontFor('ayah')).toBe('quran')
    expect(card.arabicFontFor('name')).toBe('quran')
    expect(card.arabicFontFor('hadith')).toBe('ar')
    expect(card.arabicFontFor('dua')).toBe('ar')
    expect(card.FONT.quran.family).toBe('Amiri Quran')
  })

  it('Amiri Quran bütün Uthmani işarələrini əhatə edir (cmap)', () => {
    const has = card.fontCoverage('AmiriQuran.ttf')
    for (let cp = 0x06d6; cp <= 0x06ed; cp++) expect(has(cp), cp.toString(16)).toBe(true)
    for (const cp of [0x0670, 0x0671, 0x064b, 0x0652, 0x0651]) expect(has(cp)).toBe(true)
    expect(card.fontCoverage('Amiri-Regular.ttf')(0x0416)).toBe(false)   // Ж — Amiri-də yoxdur
    expect(card.fontCoverage('MccInter-Regular.ttf')(0x0259)).toBe(true)  // ə
  })

  it('displayArabic: yalnız dayanma işarəsindən əvvəlki boşluq — hərf və işarələr eynidir', () => {
    const raw = 'وَتَوَكَّلْ عَلَى ٱللَّهِ ۚ وَكَفَىٰ بِٱللَّهِ وَكِيلًۭا'
    const out = card.displayArabic(raw)
    expect(out).toBe('وَتَوَكَّلْ عَلَى ٱللَّهِۚ وَكَفَىٰ بِٱللَّهِ وَكِيلًۭا')
    expect(out.replace(/\s/g, '')).toBe(raw.replace(/\s/g, ''))
    expect(card.displayArabic('ٱلۡمُعۡطِي')).toBe('ٱلۡمُعۡطِي')
  })

  it('arabicIssues: yetim hərəkə (◌) və şriftdə olmayan simvol', () => {
    expect(card.arabicIssues('وَتَوَكَّلْ عَلَى ٱللَّهِ ۚ وَكَفَىٰ', 'quran')).toEqual([])
    expect(card.arabicIssues('َ بِسْمِ', 'ar')).toEqual(['orphan-mark:U+064E'])
    expect(card.arabicIssues('بِسْمِ ْ ٱللَّهِ', 'quran')).toEqual(['orphan-mark:U+0652'])
    expect(card.arabicIssues('بِسْمِ Ж', 'ar')).toEqual(['missing:U+0416'])
  })

  it('bütün adlar, dualar və hədislər yoxlamadan keçir (heç biri atlanmır)', () => {
    const bad = []
    for (const n of IG_DATA.names) if (card.contentIssues(ig.nameContent('az', n, '')).length) bad.push('name:' + n.n)
    for (const d of IG_DATA.duas) if (card.contentIssues(ig.duaContent('az', d, '')).length) bad.push('dua:' + d.id)
    for (const h of LIST) if (card.contentIssues(ig.hadithContent('az', h, '')).length) bad.push('hadith:' + h.id)
    expect(bad).toEqual([])
  })

  it('yoxlamadan keçməyən element atlanır, bir dəfə loglanır, sıradakı götürülür', async () => {
    const { db, cardDir } = setup()
    const warns = []
    const log = { error: () => {}, warn: (m) => warns.push(m), log: () => {} }
    let first = null
    const m = ig.createInstagram({ db, cardDir, env: ENV, now: () => T0, fetchImpl: fakeFetch(), sleep: async () => {}, log, pollMs: 0,
      render: async () => JPEG, checkArabic: (c) => { if (!first) first = c.key; return c.key === first ? ['orphan-mark:U+06DA'] : [] } })
    const p = await m.prepare('2026-11-25', 1, { formats: ['feed'] })
    expect(p.content.key).not.toBe(first)
    await m.prepare('2026-11-25', 1, { formats: ['feed'] })
    expect(warns.filter((w) => w.includes(first))).toHaveLength(1)
    expect(warns[0]).toContain('orphan-mark:U+06DA')
  })

  it('fontconfig hər ailə adına ayrı üz verir (Amiri Quran ≠ Amiri ≠ Amiri Bold, MccInter ≠ Amiri)', async () => {
    const r = await card.fontSelfTest()
    expect(r.distinct).toEqual({ quranVsAmiri: true, quranVsBold: true, amiriVsBold: true, interVsAmiri: true })
  }, 30000)
})

describe('instagram — kartın çəkilməsi (sharp)', () => {
  it('feed 1080×1350 və story 1080×1920 JPEG; ərəbcə mətn — boş deyil', async () => {
    const sharp = require('sharp')
    const h = LIST[0]
    const c = { kind: 'hadith', title: 'Günün hədisi', ar: h.t.ar, text: h.t.az, ref: `${h.src.az} · Səhih` }
    for (const [format, w, hh] of [['feed', 1080, 1350], ['story', 1080, 1920]]) {
      const buf = await renderCard(c, { format, theme: format === 'story' ? 'night' : 'day', lang: 'az' })
      expect(buf.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
      const meta = await sharp(buf).metadata()
      expect(meta).toMatchObject({ format: 'jpeg', width: w, height: hh, space: 'srgb' })
      expect(buf.length).toBeGreaterThan(50000)
      expect(buf.length).toBeLessThan(8 * 1024 * 1024)
    }
    const ar = await renderCard({ ...c, text: '' }, { format: 'feed', lang: 'ar' })
    expect((await sharp(ar).metadata()).width).toBe(1080)
  }, 30000)

  it('oxunaqlı ölçüdə sığmayan mətn → null', async () => {
    const long = 'İman yetmiş küsur şaxədir. '.repeat(23)
    const arLong = 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ '.repeat(12)
    expect(long.length).toBeLessThan(650)
    expect(await renderCard({ kind: 'hadith', title: 'T', ar: arLong, text: long, ref: 'x' }, { format: 'feed', lang: 'az' })).toBeNull()
    expect(await renderCard({ kind: 'hadith', title: 'T', ar: 'بُنِيَ', text: 'x '.repeat(400), ref: 'x' }, { format: 'story', lang: 'az' })).toBeNull()
    expect(await renderCard({ kind: 'hadith', title: 'T', ar: '', text: 'x', ref: 'x' }, { format: 'feed', lang: 'az' })).toBeNull()
  }, 30000)
})
