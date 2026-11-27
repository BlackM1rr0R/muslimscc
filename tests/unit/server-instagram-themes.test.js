// Server: üç rəng teması (dawn / day / night — server/instagramCard.js), yuva → tema, karuselin həftəlik teması, açıq
// temanın kontrastı (WCAG ≥ 4.5:1), hədis / dua videosunun fayl adı və sidecar-ı (instagramReel.js), zaman cədvəli,
// IG_REEL_KINDS və 13:00 / 20:00 yuvasında feed şəkli əvəzinə video (reel) — fayl yoxdursa şəkil, bir dəfə dərc.
// Şəbəkə yoxdur: fetch saxtadır.
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const ig = require('../../server/instagram.js')
const card = require('../../server/instagramCard.js')
const R = require('../../server/instagramReel.js')
const dailyAyah = require('../../server/daily-ayah.js')

const TOKEN = 'IGAAtesttoken0123456789abcdefABCDEF'
const USER = '17841400000000001'
const ENV = { IG_ENABLED: '1', IG_ACCESS_TOKEN: TOKEN, IG_USER_ID: USER, IG_REELS: '1', IG_CAPTION_LANGS: 'en', IG_LANG: 'en' }
const DAY = '2026-11-25'
const T13 = Date.parse('2026-11-25T09:00:30Z')   // 13:00:30 Asia/Baku
const T20 = Date.parse('2026-11-25T16:00:30Z')   // 20:00:30 Asia/Baku
const silent = () => { const w = []; return { warns: w, error: () => {}, warn: (...a) => w.push(a.join(' ')), log: () => {} } }

let dir, dbs = []
afterEach(() => {
  for (const d of dbs) { try { d.close() } catch { /* */ } }
  dbs = []
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
  dir = null
})
function setup() {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-igt-'))
  const db = openDb(path.join(dir, 'test.db'))
  dbs.push(db)
  return { db, cardDir: path.join(dir, 'ig-cards') }
}
function fakeMp4(durationMs = 24000, pad = 4096) {
  const ftyp = Buffer.alloc(16); ftyp.writeUInt32BE(16, 0); ftyp.write('ftypisom', 4, 'latin1'); ftyp.writeUInt32BE(0x200, 12)
  const mvhd = Buffer.alloc(108); mvhd.writeUInt32BE(108, 0); mvhd.write('mvhd', 4, 'latin1'); mvhd.writeUInt32BE(1000, 20); mvhd.writeUInt32BE(durationMs, 24)
  const moov = Buffer.concat([Buffer.alloc(8), mvhd]); moov.writeUInt32BE(moov.length, 0); moov.write('moov', 4, 'latin1')
  const mdat = Buffer.alloc(8 + pad, 7); mdat.writeUInt32BE(mdat.length, 0); mdat.write('mdat', 4, 'latin1')
  return Buffer.concat([ftyp, moov, mdat])
}
function putVideo(cardDir, kind, item, { date = DAY, audio = 'ambient', mp4 = fakeMp4() } = {}) {
  fs.mkdirSync(cardDir, { recursive: true })
  fs.writeFileSync(path.join(cardDir, `${R.videoBase(date, kind)}.mp4`), mp4)
  fs.writeFileSync(path.join(cardDir, `${R.videoBase(date, kind)}.json`), JSON.stringify({ kind, item, audio, lang: 'en' }))
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
  fn.containers = () => calls.filter((c) => c.method === 'POST' && c.url.pathname.endsWith(`/${USER}/media`)).map((c) => Object.fromEntries(c.body))
  return fn
}
const mk = (db, cardDir, { env = {}, now = T13, fetchImpl = fakeFetch(), log = silent() } = {}) => {
  const themes = []
  const m = ig.createInstagram({
    db, cardDir, env: { ...ENV, ...env }, publicOrigin: 'https://muslims.cc', now: () => now, fetchImpl, sleep: async () => {}, log, pollMs: 0,
    render: async (c, o) => { themes.push(o.theme); return Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
    renderText: async (c, o) => { themes.push(o.theme); return Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
    reelPollMs: [0, 0],
  })
  m.themes = themes
  m.f = fetchImpl
  m.log = log
  return m
}

describe('temalar — palitra və kontrast', () => {
  it('üç tema var; hər birində lazımi sahələr', () => {
    expect(card.THEME_NAMES).toEqual(['dawn', 'day', 'night'])
    for (const t of Object.values(card.THEMES)) {
      for (const k of ['bg1', 'bg2', 'gold', 'goldText', 'text', 'soft', 'ar', 'fresh', 'glow']) expect(t[k], k).toMatch(/^#[0-9a-f]{6}$/i)
      expect(typeof t.light).toBe('boolean')
      expect(t.pattern).toBeGreaterThan(0)
    }
    expect(card.THEMES.dawn).toMatchObject({ text: '#0f5a47', gold: '#a57a22', light: true })
  })

  it('kontrast: dawn — tərcümə, ərəbcə, qızılı mətn, ikinci dərəcəli mətn ≥ 4.5:1; hamısında tərcümə ≥ 4.5:1 (fonun yuxarısı və aşağısı)', () => {
    // WCAG düsturunun özü: ağ / qara = 21, eyni rəng = 1
    expect(card.contrast('#ffffff', '#000000')).toBeCloseTo(21, 5)
    expect(card.contrast('#777777', '#777777')).toBeCloseTo(1, 5)
    for (const [name, t] of Object.entries(card.THEMES)) {
      for (const bg of [t.bg1, t.bg2]) {
        const fgs = name === 'dawn' ? ['text', 'ar', 'goldText', 'soft'] : ['text', 'ar', 'soft']
        for (const fg of fgs) expect(card.contrast(t[fg], bg), `${name}.${fg} / ${bg}`).toBeGreaterThanOrEqual(4.5)
        // day / night qızılı başlıq — mövcud dizayn (iri, qalın hərflər): ≥ 3:1
        expect(card.contrast(t.goldText, bg), `${name}.goldText`).toBeGreaterThanOrEqual(3)
      }
    }
    // Açıq tema: fon həqiqətən açıqdır, mətn tünd
    expect(card.luminance(card.THEMES.dawn.bg1)).toBeGreaterThan(0.8)
    expect(card.luminance(card.THEMES.dawn.text)).toBeLessThan(0.1)
    // #a57a22 (çərçivə qızılısı) mətn üçün kifayət etmir — ona görə ayrıca goldText
    expect(card.contrast('#a57a22', card.THEMES.dawn.bg2)).toBeLessThan(4.5)
  })

  it('dawn kartı (sharp): fon açıq, mətn çəkilir (feed və story)', async () => {
    const c = { kind: 'hadith', title: 'Hadith of the Day', ar: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', text: 'Actions are only by intentions.', ref: 'Bukhari 1 · Sahih' }
    const sharp = card.loadSharp()
    for (const format of ['feed', 'story']) {
      const buf = await card.renderCard(c, { format, theme: 'dawn', lang: 'en' })
      expect(buf).toBeTruthy()
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
      expect(info.width).toBe(1080)
      const px = (x, y) => [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)]
      const corner = px(20, 20)
      expect(Math.min(...corner)).toBeGreaterThan(200)
      // mərkəzdə tünd (zümrüd) mətn pikselləri var
      let dark = 0
      for (let y = Math.round(info.height * 0.35); y < info.height * 0.65; y += 3) for (let x = 100; x < 980; x += 3) { const p = px(x, y); if (p[0] < 90 && p[1] < 130) dark++ }
      expect(dark).toBeGreaterThan(50)
    }
  })
})

describe('temalar — yuva, reel, karusel', () => {
  it('yuva → tema: 08:00 ayə dawn, 13:00 hədis day, 20:00 dua / ad night; reel (ayə passajı) dawn', () => {
    for (const d of ['2026-11-25', '2026-11-26']) {
      expect(ig.themeForSlot(0, d)).toBe('dawn')
      expect(ig.themeForSlot(1, d)).toBe('day')
      expect(ig.themeForSlot(2, d)).toBe('night')
    }
    expect(R.themeForKind('ayah')).toBe('dawn')
    expect(R.themeForKind('hadith')).toBe('day')
    expect(R.themeForKind('dua')).toBe('night')
    expect(R.themeForKind('name')).toBe('night')
  })

  it('grid ardıcıllığı (08:00 → 13:00 → 18:00 reel → 20:00 → ertəsi 08:00): qonşu elementlərin teması fərqlidir', () => {
    const seq = []
    for (const d of ['2026-11-25', '2026-11-26', '2026-11-27']) seq.push(ig.themeForSlot(0, d), ig.themeForSlot(1, d), R.themeForKind('ayah'), ig.themeForSlot(2, d))
    for (let i = 1; i < seq.length; i++) expect(seq[i], `${i}: ${seq.join(',')}`).not.toBe(seq[i - 1])
    // TikTok: 09:00 hədis, 14:00 dua / ad, 18:30 ayə
    const tt = []
    for (const d of ['2026-11-25', '2026-11-26']) tt.push(R.themeForKind('hadith'), R.themeForKind(ig.kindFor(2, d)), R.themeForKind('ayah'))
    for (let i = 1; i < tt.length; i++) expect(tt[i]).not.toBe(tt[i - 1])
  })

  it('prepare: kartlar yuvanın temasında çəkilir', async () => {
    const { db, cardDir } = setup()
    const m = mk(db, cardDir)
    await m.prepare(DAY, 1, { formats: ['feed', 'story'] })
    await m.prepare(DAY, 2, { formats: ['feed'] })
    expect(m.themes).toEqual(['day', 'day', 'night'])
  })

  it('karusel: bütün dəst bir tema (üz, elementlər, bağlanış); həmişə night (qonşu dawn/day yuvalardan fərqli)', async () => {
    const { db, cardDir } = setup()
    const m = mk(db, cardDir)
    // ad həftəsini tap (şəbəkəsiz) və üç ardıcıl həftənin rəngini yoxla
    const colours = []
    let d = '2026-11-27'
    for (let w = 0; w < 6; w++) {
      colours.push(m.carouselColour(d))
      // eyni həftənin bütün günləri eyni rəng
      const wk = Math.floor(dailyAyah.dayNumber(d) / 7)
      for (let i = 0; i < 7; i++) {
        const dd = new Date(Date.UTC(1970, 0, 1 + wk * 7 + i)).toISOString().slice(0, 10)
        expect(m.carouselColour(dd)).toBe(colours[w])
      }
      d = new Date(Date.parse(`${d}T00:00:00Z`) + 7 * 864e5).toISOString().slice(0, 10)
    }
    // 2026-11-27: sahibin şəbəkəsi üçün karusel həmişə night (08:00 dawn və 13:00 day arasında)
    expect(new Set(colours)).toEqual(new Set(['night']))
    let nameDay = '2026-11-27'
    while (m.carouselTheme(nameDay) !== 'name') nameDay = new Date(Date.parse(`${nameDay}T00:00:00Z`) + 7 * 864e5).toISOString().slice(0, 10)
    const prep = await m.prepareCarousel(nameDay, { lang: 'en' })
    expect(prep).toBeTruthy()
    expect(new Set(m.themes)).toEqual(new Set([m.carouselColour(nameDay)]))
    expect(m.themes.length).toBe(prep.cards.length)
  })
})

describe('hədis / dua videoları — fayl adı, sidecar, zaman cədvəli', () => {
  it('fayl adları: köhnə ayə adı qalır, növlü adlar; yol / başqa növ rədd', () => {
    expect(R.videoBase(DAY)).toBe(`${DAY}-reel`)
    expect(R.videoBase(DAY, 'hadith')).toBe(`${DAY}-reel-hadith`)
    for (const ok of [`${DAY}-reel.mp4`, `${DAY}-reel-hadith.mp4`, `${DAY}-reel-dua.mp4`, `${DAY}-reel-name.mp4`]) expect(R.VIDEO_MP4_RE.test(ok), ok).toBe(true)
    for (const bad of [`${DAY}-reel-ayah.mp4`, `${DAY}-reel-x.mp4`, `${DAY}-reel-hadith.json`, `../${DAY}-reel.mp4`, `${DAY}-reel-hadith.mp4.tmp`, `${DAY}-reel-Hadith.mp4`]) expect(R.VIDEO_MP4_RE.test(bad), bad).toBe(false)
    expect(R.VIDEO_META_RE.exec(`${DAY}-reel-dua.json`)[2]).toBe('dua')
    expect(R.VIDEO_META_RE.exec(`${DAY}-reel.json`)[2]).toBeUndefined()
    // köhnə ad regex-i dəyişməyib (köhnə serverlər / TikTok PULL ünvanı)
    expect(R.REEL_MP4_RE.test(`${DAY}-reel-hadith.mp4`)).toBe(false)
  })

  it('parseTextMeta: növ fayl adı ilə eyni, item müsbət tam, səs ambient | none, dil allowlist', () => {
    expect(R.parseTextMeta('{"kind":"hadith","item":12,"audio":"ambient","lang":"en"}', 'hadith')).toEqual({ kind: 'hadith', item: 12, audio: 'ambient', lang: 'en' })
    expect(R.parseTextMeta({ kind: 'name', item: 99, audio: 'none' })).toEqual({ kind: 'name', item: 99, audio: 'none', lang: null })
    for (const bad of [
      ['{"kind":"dua","item":1,"audio":"ambient"}', 'hadith'], [{ kind: 'ayah', item: 1, audio: 'none' }], [{ kind: 'dua', item: 0, audio: 'none' }],
      [{ kind: 'dua', item: 1.5, audio: 'none' }], [{ kind: 'dua', item: 10000, audio: 'none' }], [{ kind: 'dua', item: 1, audio: 'alafasy' }],
      [{ kind: 'dua', item: 1, audio: 'music' }], [{ kind: 'dua', item: 1, audio: 'none', lang: 'fr' }], ['nope'], [[1]],
    ]) expect(R.parseTextMeta(...bad), JSON.stringify(bad)).toBeNull()
  })

  it('textTimeline: 20–40 s, mətn uzandıqca uzanır; mürəkkəb → tərcümə → sabit kadr', () => {
    const short = R.textTimeline({ lines: 1, words: 6 })
    const long = R.textTimeline({ lines: 5, words: 110 })
    const mid = R.textTimeline({ lines: 3, words: 50 })
    expect(short.duration).toBe(20)
    expect(long.duration).toBe(40)
    expect(mid.duration).toBeGreaterThan(20)
    expect(mid.duration).toBeLessThanOrEqual(40)
    for (const tl of [short, mid, long]) {
      const s = tl.segments[0]
      expect(tl.segments).toHaveLength(1)
      expect(tl.audioSec).toBe(0)
      expect(s.inkStart).toBeLessThan(s.inkEnd)
      expect(s.inkEnd).toBeLessThan(s.trStart)
      expect(s.trEnd).toBeLessThan(tl.duration)
      expect(s.fadeOut).toBeNull()
    }
  })

  it('staticCandidate / contentById: video sidecar-ındakı id kartdakı elementi tapır; "Sahih" yalnız qaydaya görə', () => {
    for (const kind of ['hadith', 'dua', 'name']) {
      const c = ig.staticCandidate(kind, DAY, 0, 'en')
      expect(c).toBeTruthy()
      const id = ig.itemIdOf(c.key)
      expect(Number.isInteger(id)).toBe(true)
      const back = ig.contentById(kind, id, 'en')
      expect(back.key).toBe(c.key)
      expect(back.text).toBe(c.text)
    }
    expect(ig.contentById('hadith', 999999, 'en')).toBeNull()
    expect(ig.itemIdOf('ayah:2:255')).toBeNull()
    const h = require('../../server/daily-hadith.js').LIST.find((x) => !ig.isBukhariMuslim(x.src.az) && x.t.en)
    expect(ig.contentById('hadith', h.id, 'en').ref).not.toMatch(/Sahih/)
  })
})

describe('Instagram: 13:00 / 20:00 yuvasında video (IG_REEL_KINDS)', () => {
  it('parseReelKinds: susmaya görə ayah,hadith,dua; "name" — "dua"; yararsız atılır', () => {
    expect(ig.parseConfig({}).reelKinds).toEqual(['ayah', 'hadith', 'dua'])
    expect(ig.parseReelKinds('ayah')).toEqual(['ayah'])
    expect(ig.parseReelKinds(' Hadith , name,bogus,dua ')).toEqual(['hadith', 'dua'])
    expect(ig.parseReelKinds('')).toEqual(['ayah', 'hadith', 'dua'])
    expect(ig.videoKeyForSlot(0)).toBeNull()
    expect(ig.videoKeyForSlot(1)).toBe('hadith')
    expect(ig.videoKeyForSlot(2)).toBe('dua')
  })

  it('13:00: video varsa feed — REELS (share_to_feed, thumb son saniyə, caption ingiliscə), story — şəkil; bir dəfə', async () => {
    const { db, cardDir } = setup()
    const c = ig.staticCandidate('hadith', DAY, 0, 'en')
    putVideo(cardDir, 'hadith', ig.itemIdOf(c.key), { mp4: fakeMp4(26000) })
    const m = mk(db, cardDir)
    expect(await m.tick()).toBe(2)
    const cs = m.f.containers()
    const reel = cs.find((x) => x.media_type === 'REELS')
    expect(reel).toMatchObject({ video_url: `https://muslims.cc/api/ig/card/${DAY}-reel-hadith.mp4`, share_to_feed: 'true', thumb_offset: '25000' })
    expect(reel.caption).toContain(c.text)
    expect(reel.caption).toMatch(/^Hadith of the day/i)
    expect(cs.filter((x) => x.media_type === 'STORIES')).toHaveLength(1)
    expect(cs.filter((x) => x.image_url && !x.media_type)).toHaveLength(0)
    const rows = m._q.recent.all(10)
    expect(rows.find((r) => r.format === 'feed')).toMatchObject({ status: 'published', item: `video:${c.key}`, kind: 'hadith' })
    expect(rows.find((r) => r.format === 'story')).toMatchObject({ status: 'published', item: c.key })
    // eyni yuva təkrar — heç nə
    expect(await m.tick()).toBe(0)
    expect(m.f.containers()).toHaveLength(cs.length)
    // status: bu günün video yuvaları
    const st = m.status()
    expect(st.reelKinds).toEqual(['ayah', 'hadith', 'dua'])
    expect(st.slots[1]).toMatchObject({ theme: 'day', video: { enabled: true, file: { item: c.key, durationMs: 26000 } } })
    expect(st.slots[0].video.enabled).toBe(false)
  })

  it('fayl yoxdur / sidecar yararsızdır → adi şəkil postu, xəbərdarlıq bir dəfə', async () => {
    const { db, cardDir } = setup()
    const m = mk(db, cardDir)
    expect(await m.tick()).toBe(2)
    const cs = m.f.containers()
    expect(cs.filter((x) => x.media_type === 'REELS')).toHaveLength(0)
    expect(cs.filter((x) => x.image_url && !x.media_type)).toHaveLength(1)
    expect(m.log.warns.filter((w) => w.includes('videosu yoxdur'))).toHaveLength(1)

    const s2 = setup()
    fs.mkdirSync(s2.cardDir, { recursive: true })
    fs.writeFileSync(path.join(s2.cardDir, `${DAY}-reel-hadith.mp4`), fakeMp4())
    fs.writeFileSync(path.join(s2.cardDir, `${DAY}-reel-hadith.json`), JSON.stringify({ kind: 'dua', item: 1, audio: 'ambient' }))
    const m2 = mk(s2.db, s2.cardDir)
    expect(m2.textVideoInfo(DAY, 'hadith')).toBeNull()
    await m2.tick()
    expect(m2.f.containers().filter((x) => x.media_type === 'REELS')).toHaveLength(0)
  })

  it('IG_REEL_KINDS=ayah (köhnə davranış) və ya IG_REELS söndürülüb → video olsa da şəkil postu', async () => {
    for (const env of [{ IG_REEL_KINDS: 'ayah' }, { IG_REELS: '0' }]) {
      const { db, cardDir } = setup()
      const c = ig.staticCandidate('hadith', DAY, 0, 'en')
      putVideo(cardDir, 'hadith', ig.itemIdOf(c.key))
      const m = mk(db, cardDir, { env })
      await m.tick()
      expect(m.f.containers().filter((x) => x.media_type === 'REELS')).toHaveLength(0)
      expect(m.f.containers().filter((x) => x.image_url && !x.media_type)).toHaveLength(1)
      for (const d of dbs) d.close()
      dbs = []
      fs.rmSync(dir, { recursive: true, force: true })
      dir = null
    }
  })

  it('20:00: günün növü (dua və ya ad) videosu; IG_REEL_KINDS "name" də 20:00 yuvasını açır', async () => {
    const { db, cardDir } = setup()
    const kind = ig.kindFor(2, DAY)
    const c = ig.staticCandidate(kind, DAY, 0, 'en')
    putVideo(cardDir, kind, ig.itemIdOf(c.key))
    const m = mk(db, cardDir, { now: T20, env: { IG_REEL_KINDS: 'name' } })
    await m.tick()
    const reel = m.f.containers().find((x) => x.media_type === 'REELS')
    expect(reel.video_url).toBe(`https://muslims.cc/api/ig/card/${DAY}-reel-${kind}.mp4`)
    expect(m.themes).toEqual(['night', 'night'])
  })

  it('köhnə video faylları 7 gündən sonra silinir (bütün növlər)', () => {
    const { db, cardDir } = setup()
    putVideo(cardDir, 'hadith', 1, { date: '2026-11-10' })
    putVideo(cardDir, 'dua', 1, { date: '2026-11-10' })
    putVideo(cardDir, 'hadith', 1)
    const m = mk(db, cardDir)
    expect(m.purgeCards(T13)).toBe(4)
    expect(fs.readdirSync(cardDir).sort()).toEqual([`${DAY}-reel-hadith.json`, `${DAY}-reel-hadith.mp4`])
  })
})
