// Server: Instagram REEL (server/instagramReel.js + server/instagram.js) — konfiqurasiya, seçim (08:00 ayə yuvası ilə eyni),
// meta / MP4 başlığının yoxlanması, caption-da tilavət sətri, zaman cədvəli, REELS konteyneri (video_url, share_to_feed,
// thumb_offset), uzun status gözləməsi, fayl yoxdursa atlama, bir dəfə dərc, Range ilə video xidməti, köhnə faylların silinməsi.
// Şəbəkə yoxdur: fetch saxtadır.
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const ig = require('../../server/instagram.js')
const R = require('../../server/instagramReel.js')
const dailyAyah = require('../../server/daily-ayah.js')

const TOKEN = 'IGAAtesttoken0123456789abcdefABCDEF'
const USER = '17841400000000001'
// Adi yuvalar yalnız 08:00 — 18:00–20:00 arası testlərə qarışmasın
const ENV = { IG_ENABLED: '1', IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: USER, IG_REELS: '1', IG_SLOTS: '08:00' }
// 2026-11-25 18:00:30 Asia/Baku (UTC+4)
const T18 = Date.parse('2026-11-25T14:00:30Z')
const DAY = '2026-11-25'
const silent = { error: () => {}, warn: () => {}, log: () => {} }

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

/** Minimal faststart MP4: ftyp + moov(mvhd v0: timescale 1000, duration) + mdat (doldurma). */
function fakeMp4(durationMs = 21900, pad = 4096) {
  const ftyp = Buffer.alloc(16); ftyp.writeUInt32BE(16, 0); ftyp.write('ftypisom', 4, 'latin1'); ftyp.writeUInt32BE(0x200, 12)
  const mvhd = Buffer.alloc(108); mvhd.writeUInt32BE(108, 0); mvhd.write('mvhd', 4, 'latin1'); mvhd.writeUInt32BE(1000, 20); mvhd.writeUInt32BE(durationMs, 24)
  const moov = Buffer.concat([Buffer.alloc(8), mvhd]); moov.writeUInt32BE(moov.length, 0); moov.write('moov', 4, 'latin1')
  const mdat = Buffer.alloc(8 + pad, 7); mdat.writeUInt32BE(mdat.length, 0); mdat.write('mdat', 4, 'latin1')
  return Buffer.concat([ftyp, moov, mdat])
}
function putReel(cardDir, { date = DAY, ref = '33:3', audio = 'alafasy', mp4 = fakeMp4() } = {}) {
  fs.mkdirSync(cardDir, { recursive: true })
  fs.writeFileSync(path.join(cardDir, `${date}-reel.mp4`), mp4)
  fs.writeFileSync(path.join(cardDir, `${date}-reel.json`), JSON.stringify({ ref, audio }))
}

/** Saxta Graph API + alquran.cloud. statuses — konteyner statuslarının ardıcıllığı (sonuncu təkrarlanır). */
function fakeFetch({ statuses = ['IN_PROGRESS', 'IN_PROGRESS', 'FINISHED'] } = {}) {
  const calls = []
  let n = 0
  const fn = async (url, opts = {}) => {
    const u = new URL(String(url))
    if (u.hostname === 'api.alquran.cloud') {
      const m = /ayah\/(\d+):(\d+)\/editions\/(.+)$/.exec(u.pathname)
      const [s, a] = [Number(m[1]), Number(m[2])]
      const data = m[3].split(',').map((id) => ({ edition: { identifier: id }, surah: { number: s, englishName: 'Al-Ahzab', name: 'سورة' }, numberInSurah: a, text: id === 'quran-uthmani' ? 'وَتَوَكَّلْ عَلَى ٱللَّهِ' : `TEXT-${id}` }))
      return { ok: true, status: 200, json: async () => ({ code: 200, data }) }
    }
    calls.push({ method: opts.method, url: u, headers: opts.headers || {}, body: opts.body ? new URLSearchParams(opts.body) : null })
    const reply = (status, body) => ({ ok: status === 200, status, json: async () => body })
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media`)) return reply(200, { id: String(1000 + (++n)) })
    if (opts.method === 'GET' && /^\/v\d+\.\d+\/\d+$/.test(u.pathname)) {
      const k = u.pathname
      const i = fn.seen[k] = (fn.seen[k] || 0) + 1
      return reply(200, { status_code: statuses[Math.min(i, statuses.length) - 1] })
    }
    if (opts.method === 'POST' && u.pathname.endsWith(`/${USER}/media_publish`)) return reply(200, { id: String(9000 + n) })
    throw new Error('unexpected fetch ' + u)
  }
  fn.calls = calls
  fn.seen = {}
  return fn
}

const mk = (db, cardDir, extra = {}) => {
  const sleeps = []
  const m = ig.createInstagram({
    db, cardDir, env: { ...ENV, ...(extra.env || {}) }, publicOrigin: 'https://muslims.cc', now: extra.now || (() => T18),
    fetchImpl: extra.fetchImpl, sleep: async (ms) => { sleeps.push(ms) }, log: extra.log || silent, pollMs: 0, render: async () => Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  })
  m.sleeps = sleeps
  return m
}

describe('instagram reel — saf köməkçilər', () => {
  it('parseConfig: IG_REELS yalnız "1" ilə; IG_REEL_TIME susmaya görə 18:00, yararsızdırsa 18:00', () => {
    expect(ig.parseConfig({}).reels).toBe(false)
    expect(ig.parseConfig({ IG_REELS: 'true' }).reels).toBe(false)
    expect(ig.parseConfig({ IG_REELS: '1' }).reels).toBe(true)
    expect(ig.parseConfig({}).reelTime).toBe('18:00')
    expect(ig.parseConfig({ IG_REEL_TIME: '9:30' }).reelTime).toBe('09:30')
    for (const bad of ['25:00', '18:60', 'x', '18-00']) expect(ig.parseConfig({ IG_REEL_TIME: bad }).reelTime).toBe('18:00')
  })

  it('seçim: k=0 — 08:00 ayə yuvası ilə eyni ayə; k artdıqca siyahıda sıradakı', async () => {
    const { db, cardDir } = setup()
    const m = mk(db, cardDir, { fetchImpl: fakeFetch() })
    for (const d of ['2026-11-25', '2026-12-01', '2027-03-15']) {
      const prep = await m.prepare(d, 0, { formats: ['feed'] })
      expect(prep.content.key).toBe(`ayah:${R.reelRef(d, 0)}`)
    }
    const refs = dailyAyah.AYAH_REFS
    const i0 = refs.indexOf(R.reelRef(DAY, 0))
    expect(R.reelRef(DAY, 1)).toBe(refs[(i0 + 1) % refs.length])
  })

  it('səs mənbəyi saytınkı ilə eynidir (Alafasy 128 kbps, ümumi ayə nömrəsi; ehtiyat verses.quran.com)', () => {
    expect(R.globalAyah(1, 1)).toBe(1)
    expect(R.globalAyah(2, 255)).toBe(262)
    expect(R.globalAyah(114, 6)).toBe(6236)
    expect(R.audioUrls(33, 3)).toEqual([
      `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${R.globalAyah(33, 3)}.mp3`,
      'https://verses.quran.com/Alafasy/mp3/033003.mp3',
      `https://cdn.islamic.network/quran/audio/64/ar.alafasy/${R.globalAyah(33, 3)}.mp3`,
    ])
    const src = fs.readFileSync(new URL('../../src/utils/quranAudio.js', import.meta.url), 'utf8')
    expect(src).toContain("ISLAMIC(128, 'ar.alafasy'), QURANCOM('Alafasy'), ISLAMIC(64, 'ar.alafasy')")
    expect(src).toContain(R.RECITER.name.az)
  })

  it('meta: yalnız siyahıdakı ayə və icazəli səs rejimi', () => {
    expect(R.parseMeta('{"ref":"33:3","audio":"alafasy"}')).toEqual({ ref: '33:3', audio: 'alafasy' })
    expect(R.parseMeta({ ref: '103:1-2', audio: 'none' })).toEqual({ ref: '103:1-2', audio: 'none' })
    for (const bad of ['{"ref":"33:4","audio":"alafasy"}', '{"ref":"33:3","audio":"music"}', '{"ref":"33:3"}', 'not json', '[]', 'null', '{"ref":"../x","audio":"none"}']) {
      expect(R.parseMeta(bad)).toBeNull()
    }
  })

  it('MP4 müddəti mvhd-dən (faststart); ftyp / moov yoxdursa — null', () => {
    expect(R.mp4DurationMs(fakeMp4(21900))).toBe(21900)
    expect(R.mp4DurationMs(Buffer.from('not an mp4 file at all'))).toBeNull()
    const noMoov = fakeMp4().subarray(0, 16)
    expect(R.mp4DurationMs(noMoov)).toBeNull()
    // moov sonda (faststart deyil) və baş hissə kəsilib — null
    const mp4 = fakeMp4(), ftyp = mp4.subarray(0, 16), moov = mp4.subarray(16, 132), mdat = mp4.subarray(132)
    expect(R.mp4DurationMs(Buffer.concat([ftyp, mdat, moov]).subarray(0, 1000))).toBeNull()
  })

  it('caption: "Tilavət / Recitation: …" heşteqlərdən əvvəl; səssizdə əlavə edilmir; 2200-ü keçməz', () => {
    const base = 'Günün ayəsi\n\nAR\n\nAZ\n—\nEN\n\n— Əhzab 33:3\n\nSaytda oxuyun: https://muslims.cc/quran?s=33&a=3\n\n#muslimscc #quran'
    const c = R.reelCaption(base, 'alafasy', ['az', 'en'])
    expect(c).toContain('\n\nTilavət / Recitation: Mişari Raşid əl-Əfasi\n\n#muslimscc #quran')
    expect(c.endsWith('#muslimscc #quran')).toBe(true)
    expect(R.reelCaption(base, 'alafasy', ['az'])).toContain('\n\nTilavət: Mişari Raşid əl-Əfasi\n\n#muslimscc')
    expect(R.reelCaption(base, 'none', ['az', 'en'])).toBe(base)
    expect(R.reelCaption('x'.repeat(2190) + '\n\n#t', 'alafasy')).toBeNull()
    expect(R.reelCaption(null, 'alafasy')).toBeNull()
  })

  it('zaman cədvəli: ən azı 15 s; tilavət + 1.5 s; uzun tilavət → 45 s-dən uzun (ayə atlanır)', () => {
    const short = R.reelTimeline({ audioSec: 5, lines: 1, words: 10 })
    expect(short.duration).toBe(15)
    expect(short.audioStart).toBeGreaterThan(0)
    expect(short.inkEnd).toBeLessThan(short.trStart)
    expect(short.trEnd).toBeLessThan(short.footStart)
    const mid = R.reelTimeline({ audioSec: 20, lines: 2, words: 30 })
    expect(mid.duration).toBeGreaterThanOrEqual(0.8 + 20 + 1.5)                 // tilavət sonuna qədər + 1.5 s
    expect(mid.duration).toBeCloseTo(mid.footStart + 0.6 + 2.5, 1)              // istinad göründükdən sonra 2.5 s
    expect(R.reelTimeline({ audioSec: 30, lines: 2, words: 10 }).duration).toBeCloseTo(0.8 + 30 + 1.5, 1)
    expect(R.reelTimeline({ audioSec: 44, lines: 3, words: 60 }).duration).toBeGreaterThan(R.REEL_MAX_SEC)
    const quiet = R.reelTimeline({ audioSec: 0, lines: 2, words: 12 })
    expect(quiet.audioStart).toBe(0)
    expect(quiet.duration).toBe(15)
    expect(R.reelTimeline({ audioSec: 0, lines: 2, words: 12, minSec: 1 }).duration).toBeLessThan(15)
  })

  it('fayl adı regex-i: yalnız <tarix>-reel.mp4 / .json', () => {
    expect(R.REEL_MP4_RE.test('2026-11-25-reel.mp4')).toBe(true)
    for (const bad of ['2026-11-25-reel.mp4.tmp', '.2026-11-25-reel.mp4.tmp', '../2026-11-25-reel.mp4', '2026-11-25-reel.MP4', '2026-11-25-0-reel.mp4', '2026-11-25-reel.json']) {
      expect(R.REEL_MP4_RE.test(bad)).toBe(false)
    }
    expect(R.REEL_META_RE.test('2026-11-25-reel.json')).toBe(true)
  })
})

describe('instagram reel — dərc axını', () => {
  it('18:00: REELS konteyneri (video_url, caption + tilavət, share_to_feed, thumb_offset) → uzun status → media_publish; bir dəfə', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch({ statuses: ['IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'FINISHED'] })
    const m = mk(db, cardDir, { fetchImpl: f })
    expect(await m.tick()).toBe(1)
    const create = f.calls.find((c) => c.method === 'POST' && c.url.pathname.endsWith('/media'))
    const b = create.body
    expect(b.get('media_type')).toBe('REELS')
    expect(b.get('video_url')).toBe(`https://muslims.cc/api/ig/card/${DAY}-reel.mp4`)
    expect(b.get('share_to_feed')).toBe('true')
    expect(b.get('thumb_offset')).toBe('20900')
    expect(b.get('image_url')).toBeNull()
    expect(b.get('caption')).toMatch(/^Günün ayəsi/)
    expect(b.get('caption')).toContain('وَتَوَكَّلْ عَلَى ٱللَّهِ')
    expect(b.get('caption')).toContain('Tilavət / Recitation: Mişari Raşid əl-Əfasi')
    expect(b.get('caption')).toContain('— Əhzab 33:3')
    for (const c of f.calls) { expect(c.headers.Authorization).toBe(`Bearer ${TOKEN}`); expect(c.url.toString()).not.toContain(TOKEN) }
    // Video emalı: artan fasilə (5 s, 5 s, 10 s …) — şəkil postlarının 4 s-lik dövrü yox
    expect(m.sleeps).toEqual([5000, 5000, 10000])
    expect(f.calls.filter((c) => c.url.pathname.endsWith('/media_publish'))).toHaveLength(1)
    const row = m.status().posts.find((p) => p.format === 'reel')
    expect(row).toMatchObject({ day: DAY, slot: '18:00', kind: 'ayah', item: 'ayah:33:3', status: 'published' })
    const st = m.status().reel
    expect(st).toMatchObject({ enabled: true, time: '18:00', date: DAY, file: { ref: '33:3', audio: 'alafasy', durationMs: 21900 }, post: { status: 'published' }, url: `/api/ig/card/${DAY}-reel.mp4` })
    // təkrar tick və ikinci proses (blue/green) — yenidən dərc yoxdur
    const before = f.calls.length
    expect(await m.tick()).toBe(0)
    expect(await mk(db, cardDir, { fetchImpl: f }).tick()).toBe(0)
    expect(f.calls.length).toBe(before)
  })

  it('səssiz video (audio=none): caption-da tilavət sətri yoxdur', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir, { audio: 'none' })
    const f = fakeFetch({ statuses: ['FINISHED'] })
    expect(await mk(db, cardDir, { fetchImpl: f }).tick()).toBe(1)
    const b = f.calls.find((c) => c.method === 'POST' && c.url.pathname.endsWith('/media')).body
    expect(b.get('caption')).not.toContain('Tilavət')
  })

  it('MP4 yoxdursa / yararsızdırsa: Graph sorğusu yoxdur, sətir tutulmur, bir dəfə loglanır; fayl gələndə dərc olunur', async () => {
    const { db, cardDir } = setup()
    const warns = []
    const log = { ...silent, warn: (...a) => warns.push(a.join(' ')) }
    const f = fakeFetch({ statuses: ['FINISHED'] })
    let t = T18
    const m = mk(db, cardDir, { fetchImpl: f, log, now: () => t })
    expect(await m.tick()).toBe(0)
    expect(await m.tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
    expect(warns.filter((w) => /reel faylı yoxdur/.test(w))).toHaveLength(1)
    expect(m.status().reel).toMatchObject({ file: null, post: null, url: null })
    // meta yoxdur → yenə atlanır
    fs.mkdirSync(cardDir, { recursive: true })
    fs.writeFileSync(path.join(cardDir, `${DAY}-reel.mp4`), fakeMp4())
    expect(await m.tick()).toBe(0)
    // moov oxunmur (faststart deyil) → yararsız
    putReel(cardDir, { mp4: Buffer.concat([Buffer.from('xxxxftypisom'), Buffer.alloc(4000)]) })
    expect(await m.tick()).toBe(0)
    // 15 MB-dan böyük → yararsız
    putReel(cardDir, { mp4: fakeMp4(21900, 15 * 1024 * 1024) })
    expect(await m.tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
    putReel(cardDir)
    t = T18 + 30 * 60e3
    expect(await m.tick()).toBe(1)
  })

  it('IG_REELS sönülüdürsə və ya vaxtdan kənar — heç nə etmir', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch({ statuses: ['FINISHED'] })
    expect(await mk(db, cardDir, { fetchImpl: f, env: { IG_REELS: '0' } }).tick()).toBe(0)
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => T18 - 60e3 }).tick()).toBe(0)
    expect(await mk(db, cardDir, { fetchImpl: f, now: () => T18 + 120 * 60e3 }).tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
    expect(await mk(db, cardDir, { fetchImpl: f, env: { IG_REEL_TIME: '19:30' }, now: () => T18 + 90 * 60e3 }).tick()).toBe(1)
  })

  it('video emalı ERROR → "media" — fasilə ilə təkrar; status 5 dəq ərzində bitmirsə — keçici xəta, təkrar', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    let t = T18
    const f = fakeFetch({ statuses: ['IN_PROGRESS', 'ERROR'] })
    const m = mk(db, cardDir, { fetchImpl: f, now: () => t })
    expect(await m.tick()).toBe(0)
    let row = m.status().posts.find((p) => p.format === 'reel')
    expect(row.status).toBe('retry')
    const g = fakeFetch({ statuses: ['IN_PROGRESS'] })
    t += 3 * 60e3
    const m2 = mk(db, cardDir, { fetchImpl: g, now: () => t })
    expect(await m2.tick()).toBe(0)
    expect(m2.sleeps.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(5 * 60e3)
    expect(m2.sleeps.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(6 * 60e3)
    row = m2.status().posts.find((p) => p.format === 'reel')
    expect(row).toMatchObject({ status: 'retry', attempts: 2 })
    expect(g.calls.filter((c) => c.url.pathname.endsWith('/media_publish'))).toHaveLength(0)
  })
})

describe('instagram reel — video xidməti və təmizlik', () => {
  it('GET /api/ig/card/<tarix>-reel.mp4: video/mp4, Range → 206; json və yararsız adlar → 404; IG sönülüdürsə 404', async () => {
    const { db, cardDir } = setup()
    const mp4 = fakeMp4()
    putReel(cardDir, { mp4 })
    const m = mk(db, cardDir, { fetchImpl: fakeFetch() })
    const app = express(); app.use('/api', m.router)
    const srv = await listen(app)
    try {
      const full = await fetch(`${srv.url}/api/ig/card/${DAY}-reel.mp4`)
      expect(full.status).toBe(200)
      expect(full.headers.get('content-type')).toMatch(/^video\/mp4/)
      expect(full.headers.get('accept-ranges')).toBe('bytes')
      expect(full.headers.get('x-robots-tag')).toBe('noindex')
      expect(Buffer.from(await full.arrayBuffer())).toEqual(mp4)
      const part = await fetch(`${srv.url}/api/ig/card/${DAY}-reel.mp4`, { headers: { Range: 'bytes=4-11' } })
      expect(part.status).toBe(206)
      expect(part.headers.get('content-range')).toBe(`bytes 4-11/${mp4.length}`)
      expect(Buffer.from(await part.arrayBuffer()).toString('latin1')).toBe('ftypisom')
      const tail = await fetch(`${srv.url}/api/ig/card/${DAY}-reel.mp4`, { headers: { Range: `bytes=${mp4.length + 10}-` } })
      expect(tail.status).toBe(416)
      for (const bad of [`${DAY}-reel.json`, '2026-11-26-reel.mp4', `.${DAY}-reel.mp4.tmp`, '..%2Ftest.db', `${DAY}-reel.mp4%00.jpg`]) {
        const r = await fetch(`${srv.url}/api/ig/card/${bad}`)
        expect(r.status).toBe(404)
        expect(r.headers.get('cache-control')).toBe('no-store')
      }
    } finally { await srv.close() }
    const off = mk(db, cardDir, { fetchImpl: fakeFetch(), env: { IG_ENABLED: '0' } })
    const app2 = express(); app2.use('/api', off.router)
    const srv2 = await listen(app2)
    try { expect((await fetch(`${srv2.url}/api/ig/card/${DAY}-reel.mp4`)).status).toBe(404) } finally { await srv2.close() }
  })

  it('7 gündən köhnə reel faylları (mp4 + json) silinir, yeniləri qalır', () => {
    const { db, cardDir } = setup()
    putReel(cardDir, { date: '2026-11-10' })
    putReel(cardDir, { date: DAY })
    const m = mk(db, cardDir, { fetchImpl: fakeFetch() })
    expect(m.purgeCards(T18)).toBe(2)
    expect(fs.readdirSync(cardDir).sort()).toEqual([`${DAY}-reel.json`, `${DAY}-reel.mp4`])
  })
})
