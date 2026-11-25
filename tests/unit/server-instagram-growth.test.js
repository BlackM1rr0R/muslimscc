// Server: Instagram böyümə funksiyaları (server/instagram.js, docs/INSTAGRAM.md → "Böyümə") — heşteq növbəsi və limiti,
// açar sözlü 1-ci sətir, 2200 limiti, alt_text / location_id (və Meta rədd edəndə onsuz təkrar), həftəlik karusel axını
// (uşaq konteynerlər → CAROUSEL → publish), insights (icazə yoxdursa dərc dayanmır). Şəbəkə yoxdur: fetch saxtadır.
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const ig = require('../../server/instagram.js')
const card = require('../../server/instagramCard.js')
const LIST = require('../../server/daily-hadith-data.js')
const IG_DATA = require('../../server/instagram-data.js')

const TOKEN = 'IGAAtesttoken0123456789abcdefABCDEF'
const USER = '17841400000000001'
const ENV = { IG_ENABLED: '1', IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: USER }
const T0 = Date.parse('2026-11-25T04:00:30Z')              // çərşənbə 08:00:30 Bakı
const FRI = Date.parse('2026-11-27T07:00:30Z')             // cümə 11:00:30 Bakı
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9])
const silent = { error: () => {}, warn: () => {}, log: () => {} }
const O = 'https://muslims.cc'

let dir, dbs = []
afterEach(() => {
  for (const d of dbs) { try { d.close() } catch { /* */ } }
  dbs = []
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
  dir = null
})
function setup() {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-igg-'))
  const db = openDb(path.join(dir, 'test.db'))
  dbs.push(db)
  return { db, cardDir: path.join(dir, 'ig-cards') }
}

/** Saxta Graph API + alquran.cloud. media(body) → { status, body } | null (susmaya görə uğur); insights(url) → cavab */
function fakeFetch({ media = null, insights = null } = {}) {
  const calls = []
  let n = 0
  const fn = async (url, opts = {}) => {
    const u = new URL(String(url))
    if (u.hostname === 'api.alquran.cloud') {
      const m = /ayah\/(\d+):(\d+)\/editions\/(.+)$/.exec(u.pathname)
      const [s, a] = [Number(m[1]), Number(m[2])]
      const data = m[3].split(',').map((id) => ({ edition: { identifier: id }, surah: { number: s, englishName: 'Al-Test', name: 'سورة' }, numberInSurah: a, text: id === 'quran-uthmani' ? 'بِسْمِ ٱللَّهِ' : `TEXT-${id}` }))
      return { ok: true, status: 200, json: async () => ({ code: 200, data }) }
    }
    const body = opts.body ? new URLSearchParams(opts.body) : null
    calls.push({ method: opts.method, url: u, body })
    const reply = (status, b) => ({ ok: status === 200, status, json: async () => b })
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media`)) {
      const r = media && media(body)
      if (r) return reply(r.status, r.body)
      return reply(200, { id: String(1000 + (++n)) })
    }
    if (opts.method === 'GET' && u.pathname.endsWith('/insights')) {
      const r = insights ? insights(u) : { status: 200, body: { data: [] } }
      return reply(r.status, r.body)
    }
    if (opts.method === 'GET' && /^\/v\d+\.\d+\/\d+$/.test(u.pathname)) return reply(200, { status_code: 'FINISHED' })
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media_publish`)) return reply(200, { id: String(9000 + n) })
    throw new Error('unexpected fetch ' + u)
  }
  fn.calls = calls
  return fn
}
const mk = (db, cardDir, extra = {}) => ig.createInstagram({
  db, cardDir, env: { ...ENV, ...(extra.env || {}) }, publicOrigin: O, now: extra.now || (() => T0),
  fetchImpl: extra.fetchImpl, sleep: async () => {}, log: extra.log || silent, pollMs: 0,
  render: async () => JPEG, renderText: async () => JPEG,
})
const mediaPosts = (f) => f.calls.filter((c) => c.method === 'POST' && c.url.pathname.endsWith(`/${USER}/media`))

describe('heşteqlər və caption', () => {
  it('≤ 5, təkrarsız, #muslimscc + lövbər + ərəbcə; eyni gün eyni, günlər arasında növbələşir; spam teq yoxdur', () => {
    const days = ['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01']
    for (const kind of ['ayah', 'hadith', 'dua', 'name', 'reel']) {
      const seen = new Set()
      for (const d of days) {
        for (const langs of [['az', 'en'], ['az'], ['ar', 'en'], ['ru']]) {
          const t = ig.hashtagsFor(kind, langs, d)
          expect(t.length).toBeLessThanOrEqual(ig.HASHTAG_MAX)
          expect(t.length).toBeGreaterThanOrEqual(4)
          expect(new Set(t).size).toBe(t.length)
          expect(t[0]).toBe('#muslimscc')
          expect(t).toContain(ig.HASHTAGS[langs[0]][kind][0])
          expect(t).toEqual(ig.hashtagsFor(kind, langs, d))
          for (const x of t) expect(x).toMatch(/^#[\p{L}\p{N}_]+$/u)
          expect(t.join(' ')).not.toMatch(/follow|like4like|f4f|instagood|#love\b|#viral/i)
          if (langs.length === 2 && langs[0] === 'az') expect(t).toContain(ig.HASHTAGS.en[kind][0])
          if (!langs.includes('ar')) expect(t.some((x) => /[؀-ۿ]/.test(x))).toBe(true)
          if (langs[0] === 'az' && langs.length === 2) seen.add(t.join(' '))
        }
      }
      expect(seen.size).toBeGreaterThan(1)
    }
  })

  it('1-ci sətir açar sözlüdür (başlıq: istinad | 2-ci dilin başlığı); bütün hovuz 2200-ə sığır', () => {
    const h = LIST.find((x) => /^Buxari/.test(x.src.az))
    const c = ig.hadithContent('az', h, O)
    c.variant = (L) => ig.hadithContent(L, h, O)
    const cap = ig.buildCaptionMulti(c, ['az', 'en'], { day: '2026-11-25' })
    expect(cap.split('\n')[0]).toBe(`Günün hədisi: ${h.src.az} · Səhih | Hadith of the day`)
    const n = IG_DATA.names[0]
    const nc = ig.nameContent('az', n, O)
    expect(ig.firstLine(nc)).toBe(`${nc.title}: ${n.tl}`)
    const all = [
      ...IG_DATA.names.map((x) => [ig.nameContent('az', x, O), (L) => ig.nameContent(L, x, O)]),
      ...IG_DATA.duas.map((x) => [ig.duaContent('az', x, O), (L) => ig.duaContent(L, x, O)]),
      ...LIST.map((x) => [ig.hadithContent('az', x, O), (L) => ig.hadithContent(L, x, O)]),
    ]
    for (const [base, v] of all) {
      if (!base) continue
      Object.defineProperty(base, 'variant', { value: v })
      const s = ig.buildCaptionMulti(base, ['az', 'en'], { day: '2026-11-25' })
      if (s) {
        expect(s.length).toBeLessThanOrEqual(ig.CAPTION_MAX)
        expect(s.split('\n').at(-1).split(' ').length).toBeLessThanOrEqual(ig.HASHTAG_MAX)
      }
    }
    // Uzun mətn: qısaldılmır — null
    expect(ig.buildCaption({ ...c, text: 'x '.repeat(1200) }, 'az', { day: '2026-11-25' })).toBeNull()
  })

  it('alt_text: kartın təsviri, istinadla', () => {
    const h = LIST.find((x) => /^Buxari/.test(x.src.az))
    expect(ig.altTextFor(ig.hadithContent('az', h, O), 'az')).toBe(`Günün hədisi: ${h.src.az} · Səhih — ərəb mətni və tərcüməsi`)
    const n = IG_DATA.names[0]
    expect(ig.altTextFor(ig.nameContent('en', n, O), 'en')).toMatch(/— Arabic script, transliteration and meaning$/)
  })
})

describe('alt_text və location_id parametrləri', () => {
  it('feed: alt_text (susmaya görə), location yoxdur; story: heç biri', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    expect(await mk(db, cardDir, { fetchImpl: f }).tick()).toBe(2)
    const [feed, story] = mediaPosts(f).map((c) => c.body)
    expect(feed.get('alt_text')).toMatch(/^Günün ayəsi: .+ — ərəb mətni və tərcüməsi$/)
    expect(feed.get('location_id')).toBeNull()
    expect(feed.get('caption').split('\n')[0]).toMatch(/^Günün ayəsi: .+ \| /)
    expect(story.get('media_type')).toBe('STORIES')
    expect(story.get('alt_text')).toBeNull()
    expect(story.get('location_id')).toBeNull()
  })

  it('IG_LOCATION_ID (yalnız rəqəm) feed-ə əlavə olunur; IG_ALT_TEXT=0 söndürür; yararsız id nəzərə alınmır', async () => {
    expect(ig.parseConfig({ ...ENV, IG_LOCATION_ID: 'baku' }).locationId).toBeNull()
    expect(ig.parseConfig({ ...ENV, IG_LOCATION_ID: ' 1234567890 ' }).locationId).toBe('1234567890')
    const { db, cardDir } = setup()
    const f = fakeFetch()
    await mk(db, cardDir, { fetchImpl: f, env: { IG_LOCATION_ID: '1234567890', IG_ALT_TEXT: '0', IG_STORIES: '0' } }).tick()
    const [feed] = mediaPosts(f).map((c) => c.body)
    expect(feed.get('location_id')).toBe('1234567890')
    expect(feed.get('alt_text')).toBeNull()
  })

  it('Meta parametri rədd edəndə (kod 100) əvvəl məkansız, sonra alt_text-siz təkrar; bir dəfə loglanır, dərc olunur', async () => {
    const { db, cardDir } = setup()
    const warns = []
    const log = { error: () => {}, warn: (m) => warns.push(String(m)), log: () => {} }
    const bad = { status: 400, body: { error: { code: 100, message: 'Invalid parameter' } } }
    const f = fakeFetch({ media: (b) => (b.get('location_id') || b.get('alt_text') ? bad : null) })
    const m = mk(db, cardDir, { fetchImpl: f, log, env: { IG_LOCATION_ID: '1234567890' } })
    expect(await m.tick()).toBe(2)
    const bodies = mediaPosts(f).map((c) => c.body)
    expect(bodies[0].get('location_id')).toBe('1234567890')
    expect(bodies[1].get('location_id')).toBeNull()
    expect(bodies[1].get('alt_text')).not.toBeNull()
    expect(bodies[2].get('alt_text')).toBeNull()
    expect(bodies.slice(3).every((b) => !b.get('location_id') && !b.get('alt_text'))).toBe(true)   // story + sonrakılar
    expect(warns.filter((w) => w.includes('location_id'))).toHaveLength(1)
    expect(warns.filter((w) => w.includes('alt_text'))).toHaveLength(1)
    expect(m.status().posts.every((p) => p.status === 'published')).toBe(true)
  })
})

describe('həftəlik karusel', () => {
  it('sönülü (susmaya görə) və ya cümə deyil — heç nə', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => FRI }).tick()).toBe(0)
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => FRI - 864e5, env: { IG_CAROUSEL: '1' } }).tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
    expect(ig.parseConfig(ENV)).toMatchObject({ carousel: false, carouselDay: 5, carouselTime: '11:00', insights: true, altText: true, locationId: null })
    expect(ig.parseConfig({ ...ENV, IG_CAROUSEL_DAY: '9', IG_CAROUSEL_TIME: '25:00' })).toMatchObject({ carouselDay: 5, carouselTime: '11:00' })
  })

  it('uşaq konteynerlər (is_carousel_item + alt_text) → CAROUSEL (children, caption) → publish; bir dəfə; kartlar xidmət olunur', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, now: () => FRI, env: { IG_CAROUSEL: '1', IG_LOCATION_ID: '1234567890' } })
    expect(await m.tick()).toBe(1)
    const posts = mediaPosts(f)
    expect(posts).toHaveLength(8)                                         // üz + 5 + bağlanış + ana
    const kids = posts.slice(0, 7).map((c) => c.body)
    for (const [i, b] of kids.entries()) {
      expect(b.get('is_carousel_item')).toBe('true')
      expect(b.get('image_url')).toBe(`${O}/api/ig/card/2026-11-27-carousel-${i}.jpg`)
      expect(b.get('alt_text')).toBeTruthy()
      expect(b.get('caption')).toBeNull()
      expect(b.get('location_id')).toBeNull()                             // məkan yalnız ana konteynerdə
    }
    const parent = posts[7].body
    expect(parent.get('media_type')).toBe('CAROUSEL')
    expect(parent.get('children')).toBe('1001,1002,1003,1004,1005,1006,1007')
    expect(parent.get('location_id')).toBe('1234567890')
    const cap = parent.get('caption')
    expect(cap.length).toBeLessThanOrEqual(2200)
    expect(cap.split('\n')[0]).toMatch(/^Həftənin seçməsi — /)
    expect(cap).toMatch(/\n1\. /)
    expect(cap).toContain('#muslimscc')
    const seq = f.calls.map((c) => `${c.method} ${c.url.pathname.replace(/\d{4,}/g, 'N')}`)
    expect(seq.lastIndexOf('POST /v27.0/N/media')).toBeLessThan(seq.indexOf('POST /v27.0/N/media_publish'))
    expect(seq.filter((s) => s === 'POST /v27.0/N/media_publish')).toHaveLength(1)
    const row = m.status().posts.find((p) => p.format === 'carousel')
    expect(row).toMatchObject({ status: 'published', kind: m.carouselTheme('2026-11-27') })
    expect(row.item).toMatch(/^carousel:/)
    expect(m.status().carousel).toMatchObject({ enabled: true, day: 5, time: '11:00', post: { status: 'published' } })
    // ikinci tick / ikinci proses — təkrar yoxdur
    const before = f.calls.length
    expect(await m.tick()).toBe(0)
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => FRI + 60e3, env: { IG_CAROUSEL: '1' } }).tick()).toBe(0)
    expect(f.calls.length).toBe(before)
    const app = express(); app.use('/api', m.router)
    const srv = await listen(app)
    try {
      const r = await fetch(`${srv.url}/api/ig/card/2026-11-27-carousel-0.jpg`)
      expect(r.status).toBe(200)
      expect(r.headers.get('content-type')).toBe('image/jpeg')
      expect((await fetch(`${srv.url}/api/ig/card/2026-11-27-carousel-x.jpg`)).status).toBe(404)
    } finally { await srv.close() }
  })

  it('mövzu həftəyə görə növbələşir; yalnız yoxlanmış mənbələr (adlar, Buxari/Müslim, Quran) — Hisn yoxdur', async () => {
    const { db, cardDir } = setup()
    const m = mk(db, cardDir, { fetchImpl: fakeFetch() })
    const themes = new Set(['2026-11-06', '2026-11-13', '2026-11-20', '2026-11-27'].map((d) => m.carouselTheme(d)))
    expect(themes).toEqual(new Set(['name', 'hadith', 'ayah']))
    for (const d of ['2026-11-13', '2026-11-20', '2026-11-27']) {
      const p = await m.prepareCarousel(d)
      expect(p.cards).toHaveLength(7)
      expect(p.alts).toHaveLength(7)
      for (const c of p.items) {
        expect(c.key).toMatch(/^(name|hadith|ayah):/)
        if (c.kind === 'hadith') expect(ig.isBukhariMuslim(LIST.find((h) => `hadith:${h.id}` === c.key).src.az)).toBe(true)
      }
      expect(new Set(p.items.map((c) => c.key)).size).toBe(p.items.length)
    }
  })

  it('karusel üz / bağlanış kartı (sharp): 1080×1350 JPEG; uzun başlıq → null', async () => {
    const sharp = require('sharp')
    const buf = await card.renderTextCard({ eyebrow: 'Həftənin seçməsi', headline: 'Quran ayələri', lines: ['Qaf 50:16', 'Rəhman 55:13'], footer: 'Sürüşdürün →' }, { theme: 'day', lang: 'az' })
    expect(await sharp(buf).metadata()).toMatchObject({ format: 'jpeg', width: 1080, height: 1350 })
    expect(await card.renderTextCard({ headline: 'x'.repeat(200) }, {})).toBeNull()
  }, 30000)
})

describe('insights', () => {
  async function published(db, cardDir) {
    const f = fakeFetch()
    await mk(db, cardDir, { fetchImpl: f, env: { IG_STORIES: '0' } }).tick()
    return mediaPosts(f).length
  }
  const NEXT = T0 + 864e5 + 2 * 3600e3   // ertəsi gün 10:00 Bakı

  it('reach / saved / shares toplanır, gündə bir dəfə; admin statusunda növ / vaxt üzrə orta', async () => {
    const { db, cardDir } = setup()
    expect(await published(db, cardDir)).toBe(1)
    const seen = []
    const f = fakeFetch({ insights: (u) => {
      seen.push(u.searchParams.get('metric'))
      if (u.searchParams.get('metric').includes('views')) return { status: 400, body: { error: { code: 100, message: 'metric not supported' } } }
      return { status: 200, body: { data: [{ name: 'reach', values: [{ value: 120 }] }, { name: 'saved', values: [{ value: 7 }] }, { name: 'shares', total_value: { value: 3 } }, { name: 'bogus', values: [{ value: 1 }] }] } }
    } })
    const m = mk(db, cardDir, { fetchImpl: f, now: () => NEXT })
    expect(await m.insightsTick()).toBe(1)
    expect(seen).toEqual(['reach,saved,shares,likes,comments,views', 'reach,saved,shares,likes,comments'])
    expect(await m.insightsTick()).toBe(0)
    expect(seen).toHaveLength(2)
    const s = m.status().insights
    expect(s.state).toBe('ok')
    expect(s.byKind[0]).toMatchObject({ kind: 'ayah', format: 'feed', posts: 1, reach: 120, saved: 7, shares: 3 })
    expect(s.bySlot[0]).toMatchObject({ slot: '08:00', reach: 120 })
    expect(s.best).toEqual({ kind: { kind: 'ayah', format: 'feed' }, slot: '08:00' })
  })

  it('icazə yoxdur (kod 10) → "no_permission", dərc DAYANMIR; IG_INSIGHTS=0 → sorğu yoxdur', async () => {
    const { db, cardDir } = setup()
    await published(db, cardDir)
    const f = fakeFetch({ insights: () => ({ status: 403, body: { error: { code: 10, message: '(#10) Application does not have permission for this action' } } }) })
    const m = mk(db, cardDir, { fetchImpl: f, now: () => NEXT - 2 * 3600e3 + 5 * 3600e3, env: { IG_STORIES: '0' } })
    expect(await m.insightsTick()).toBe(0)
    expect(m.status().insights.state).toBe('no_permission')
    expect(m.status().reason).toBeNull()
    // 13:00 yuvası hələ dərc olunur
    const m2 = mk(db, cardDir, { fetchImpl: f, now: () => T0 + 864e5 + 5 * 3600e3, env: { IG_STORIES: '0' } })
    expect(await m2.tick()).toBe(1)
    const f0 = fakeFetch()
    const off = mk(db, cardDir, { fetchImpl: f0, now: () => NEXT + 864e5, env: { IG_INSIGHTS: '0' } })
    expect(await off.insightsTick()).toBe(0)
    expect(f0.calls).toHaveLength(0)
    expect(off.status().insights.enabled).toBe(false)
  })
})

describe('kart mətnində şriftdə olmayan işarə yoxdur', () => {
  it('SWIPE oxsuzdur: U+2190–21FF MccInter-də yoxdur (kartda ▯ çıxırdı)', () => {
    const src = fs.readFileSync(path.join(import.meta.dirname, '../../server/instagram.js'), 'utf8')
    const line = src.split('\n').find((l) => l.startsWith('const SWIPE'))
    expect(line).toBeTruthy()
    expect(/[←-⇿]/.test(line)).toBe(false)
  })
})
