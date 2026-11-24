// Server: Telegram botu (server/telegramBot.js) — token yoxdursa sönülü, webhook sirri, əmrlər, /stop, planlayıcı dedupe.
// Şəbəkə yoxdur: fetch saxtadır (api.telegram.org, aladhan, alquran.cloud).
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require, express, listen } from './server-helpers.js'
import { PRAYER_CITIES as SITE_CITIES, COUNTRY_NAMES as SITE_COUNTRIES } from '../../src/data/prayerCities.js'

const { openDb } = require('../../server/db.js')
const tg = require('../../server/telegramBot.js')
const { PRAYER_CITIES, COUNTRY_NAMES } = require('../../server/prayerCities.js')
const prayCalc = require('../../server/prayCalc.js')
const { createPushClaims } = require('../../server/pushClaims.js')

const TOKEN = '123456789:AAAbbbCCCdddEEEfffGGGhhhIIIjjjKKK'
const SECRET = 'test_secret_0123456789abcdef'
const silent = { error: () => {}, warn: () => {}, log: () => {} }

/** Saxta fetch: Telegram metodlarını yazır; status/cavab dəyişdirilə bilir */
function fakeFetch({ tgStatus = 200, tgBody = null } = {}) {
  const calls = []
  const fn = async (url, opts = {}) => {
    const u = String(url)
    if (u.startsWith('https://api.telegram.org/')) {
      const method = u.split('/').pop()
      calls.push({ method, body: opts.body ? JSON.parse(opts.body) : null })
      const body = tgBody || (tgStatus === 200 ? { ok: true, result: { message_id: 1 } } : { ok: false, error_code: tgStatus, description: 'Forbidden: bot was blocked by the user' })
      return { ok: tgStatus === 200, status: tgStatus, json: async () => body }
    }
    if (u.startsWith('https://api.alquran.cloud/')) {
      const m = /ayah\/(\d+):(\d+)\/editions\/(.+)$/.exec(u)
      const [s, a] = [Number(m[1]), Number(m[2])]
      const data = m[3].split(',').map((id) => ({ edition: { identifier: id }, surah: { number: s, englishName: 'Al-Test', name: 'سورة' }, numberInSurah: a, text: `TEXT-${id}` }))
      return { ok: true, status: 200, json: async () => ({ code: 200, data }) }
    }
    if (u.startsWith('https://api.aladhan.com/')) {
      return { ok: true, status: 200, json: async () => ({ data: { timings: { Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '17:30', Isha: '19:00' } } }) }
    }
    throw new Error('unexpected fetch ' + u)
  }
  fn.calls = calls
  return fn
}

const msg = (text, { id = 1001, lang = 'az', type = 'private' } = {}) => ({
  update_id: 1, message: { message_id: 5, chat: { id, type }, from: { id, language_code: lang }, text },
})
const cb = (data, { id = 1001, lang = 'az' } = {}) => ({
  update_id: 2, callback_query: { id: 'cbq1', data, from: { id, language_code: lang }, message: { message_id: 9, chat: { id, type: 'private' } } },
})

let dir
afterEach(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); dir = null })

describe('telegramBot — saf köməkçilər', () => {
  it('parseCommand: @bot şəkilçisi, arqument, adi mətn', () => {
    expect(tg.parseCommand('/times')).toEqual({ cmd: 'times', arg: '' })
    expect(tg.parseCommand('/Times@MyBot')).toEqual({ cmd: 'times', arg: '' })
    expect(tg.parseCommand('/remind ON')).toEqual({ cmd: 'remind', arg: 'on' })
    expect(tg.parseCommand('/times@OtherBot', 'MyBot')).toBeNull()
    expect(tg.parseCommand('salam')).toBeNull()
    expect(tg.parseCommand('')).toBeNull()
    expect(tg.parseCommand(null)).toBeNull()
  })

  it('parseCallback: yalnız icazəli formatlar və mövcud şəhər/ölkə', () => {
    expect(tg.parseCallback('co')).toEqual({ type: 'countries' })
    expect(tg.parseCallback('cn:AZ:2')).toEqual({ type: 'country', country: 'AZ', page: 2 })
    expect(tg.parseCallback('cn:XX:0')).toBeNull()
    expect(tg.parseCallback('ci:Baku')).toEqual({ type: 'city', id: 'Baku' })
    expect(tg.parseCallback('ci:New York')).toEqual({ type: 'city', id: 'New York' })
    expect(tg.parseCallback('ci:Atlantis')).toBeNull()
    expect(tg.parseCallback('do:times')).toEqual({ type: 'do', cmd: 'times' })
    expect(tg.parseCallback('do:rm -rf')).toBeNull()
    expect(tg.parseCallback('x'.repeat(65))).toBeNull()
    expect(tg.parseCallback(undefined)).toBeNull()
  })

  it('langOf: 5 dil, qalanı en', () => {
    expect(tg.langOf('az')).toBe('az')
    expect(tg.langOf('ru-RU')).toBe('ru')
    expect(tg.langOf('pt-br')).toBe('en')
    expect(tg.langOf(undefined)).toBe('en')
  })

  it('nextPrayer: gün ərzində və işadan sonra (sabahkı sübh)', () => {
    const t = { fajr: '05:00', dhuhr: '12:00', asr: '15:00', maghrib: '17:30', isha: '19:00' }
    expect(tg.nextPrayer(t, '13:10', '05:01')).toEqual({ key: 'asr', time: '15:00', tomorrow: false, minutes: 110 })
    expect(tg.nextPrayer(t, '20:00', '05:01')).toEqual({ key: 'fajr', time: '05:01', tomorrow: true, minutes: 541 })
    expect(tg.nextPrayer(t, '20:00', '')).toBeNull()
  })

  it('şəhər siyahısı saytınkı ilə eynidir (src/data/prayerCities.js)', () => {
    const pick = (c) => ({ id: c.id, country: c.country, lat: c.lat, lng: c.lng, tz: c.tz, label: c.label })
    expect(PRAYER_CITIES.map(pick)).toEqual(SITE_CITIES.map(pick))
    expect(COUNTRY_NAMES).toEqual(SITE_COUNTRIES)
    for (const c of PRAYER_CITIES) expect(Buffer.byteLength(`ci:${c.id}`), c.id).toBeLessThanOrEqual(64)
  })

  it('5 dildə bütün mətnlər və əmr menyusu', () => {
    const keys = Object.keys(tg.TEXT.en)
    for (const l of tg.LANGS) {
      expect(Object.keys(tg.TEXT[l]).sort()).toEqual([...keys].sort())
      expect(Object.keys(tg.TEXT[l].b).sort()).toEqual(Object.keys(tg.TEXT.en.b).sort())
      expect(tg.COMMANDS[l].map((c) => c[0])).toEqual(tg.COMMANDS.en.map((c) => c[0]))
    }
  })
})

describe('telegramBot — sönülü (token/sirr yoxdur)', () => {
  it('/api/telegram/* → 404, planlayıcı və yeniləmə heç nə etmir, şəbəkə yoxdur', async () => {
    const db = openDb(':memory:')
    const f = fakeFetch()
    for (const opts of [{}, { token: TOKEN }, { secret: SECRET }, { token: 'bad', secret: SECRET }, { token: TOKEN, secret: 'short' }]) {
      const bot = tg.createTelegramBot({ db, fetchImpl: f, log: silent, ...opts })
      expect(bot.enabled).toBe(false)
      const app = express(); app.use('/api', bot.router)
      const s = await listen(app)
      const r = await fetch(`${s.url}/api/telegram/webhook`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': SECRET }, body: JSON.stringify(msg('/start')),
      })
      expect(r.status).toBe(404)
      await s.close()
      await bot.handleUpdate(msg('/start'))
      expect(await bot.tick()).toBe(0)
    }
    expect(f.calls).toHaveLength(0)
  })
})

describe('telegramBot — webhook', () => {
  it('sirr yalnız başlıqda (URL-də yox); düzgün sorğu → 200 və cavab mesajı', async () => {
    const db = openDb(':memory:')
    const f = fakeFetch()
    const bot = tg.createTelegramBot({ db, token: TOKEN, secret: SECRET, fetchImpl: f, log: silent })
    expect(bot.enabled).toBe(true)
    const app = express(); app.use('/api', bot.router)
    const s = await listen(app)
    const post = (p, hdr, body = msg('/start')) => fetch(`${s.url}${p}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(hdr ? { 'X-Telegram-Bot-Api-Secret-Token': hdr } : {}) }, body: JSON.stringify(body),
    })
    expect((await post('/api/telegram/webhook', 'wrong_secret_0123456789abcd')).status).toBe(404)
    expect((await post('/api/telegram/webhook', null)).status).toBe(404)
    expect((await post('/api/telegram/webhook', SECRET + 'x')).status).toBe(404)
    expect((await post('/api/telegram/webhook', SECRET.slice(0, -1))).status).toBe(404)
    expect((await fetch(`${s.url}/api/telegram/webhook`, { headers: { 'X-Telegram-Bot-Api-Secret-Token': SECRET } })).status).toBe(404)   // GET
    // Sirr URL-də qəbul olunmur (giriş jurnallarına düşərdi) — köhnə forma 404
    expect((await post(`/api/telegram/webhook/${SECRET}`, SECRET)).status).toBe(404)
    expect(f.calls).toHaveLength(0)
    const ok = await post('/api/telegram/webhook', SECRET)
    expect(ok.status).toBe(200)
    expect(f.calls.map((c) => c.method)).toEqual(['sendMessage'])
    expect(f.calls[0].body.chat_id).toBe(1001)
    expect(f.calls[0].body.reply_markup.inline_keyboard.length).toBeGreaterThan(0)
    // Gövdəsiz / pis gövdə — yenə 200 (Telegram təkrar göndərməsin), heç nə göndərilmir
    const bad = await fetch(`${s.url}/api/telegram/webhook`, { method: 'POST', headers: { 'X-Telegram-Bot-Api-Secret-Token': SECRET } })
    expect(bad.status).toBe(200)
    expect(f.calls).toHaveLength(1)
    // /start heç nə saxlamır (yalnız şəhər seçiləndə)
    expect(db.raw.prepare('SELECT COUNT(*) n FROM telegram_chats').get().n).toBe(0)
    await s.close()
  })

  it('qrup söhbətləri və uzun mətn nəzərə alınmır', async () => {
    const db = openDb(':memory:')
    const f = fakeFetch()
    const bot = tg.createTelegramBot({ db, token: TOKEN, secret: SECRET, fetchImpl: f, log: silent })
    await bot.handleUpdate(msg('/start', { type: 'group', id: -100 }))
    await bot.handleUpdate(msg('x'.repeat(5000)))
    await bot.handleUpdate({ message: { chat: { id: 'abc', type: 'private' }, text: '/start' } })
    expect(f.calls).toHaveLength(0)
  })
})

describe('telegramBot — əmrlər', () => {
  it('şəhər seçimi → yalnız {chat_id, lang, city, remind, created_at}; /remind; /times; /next; /ayah; /hadith; /stop silir', async () => {
    const db = openDb(':memory:')
    const f = fakeFetch()
    const bot = tg.createTelegramBot({ db, token: TOKEN, secret: SECRET, fetchImpl: f, log: silent, now: () => Date.UTC(2026, 10, 24, 9, 0) })
    const cols = db.raw.prepare('PRAGMA table_info(telegram_chats)').all().map((c) => c.name)
    expect(cols).toEqual(['chat_id', 'lang', 'city', 'remind', 'created_at'])

    await bot.handleUpdate(msg('/times'))
    expect(f.calls.at(-1).body.text).toContain('/city')                // şəhər yoxdur

    await bot.handleUpdate(cb('cn:AZ:0'))
    expect(f.calls.at(-1).method).toBe('editMessageText')
    expect(JSON.stringify(f.calls.at(-1).body.reply_markup)).toContain('ci:Baku')
    await bot.handleUpdate(cb('ci:Baku'))
    expect(f.calls.some((c) => c.method === 'answerCallbackQuery')).toBe(true)
    expect(db.raw.prepare('SELECT * FROM telegram_chats').all()).toEqual([
      { chat_id: 1001, lang: 'az', city: 'Baku', remind: 0, created_at: Date.UTC(2026, 10, 24, 9, 0) },
    ])
    const edited = f.calls.at(-1).body.text
    expect(edited).toContain('Bakı')
    expect(edited).toMatch(/Sübh — <b>\d{2}:\d{2}<\/b>/)

    await bot.handleUpdate(msg('/remind on'))
    expect(db.raw.prepare('SELECT remind FROM telegram_chats').get().remind).toBe(1)
    await bot.handleUpdate(msg('/remind maybe'))
    expect(f.calls.at(-1).body.text).toContain('/remind on')
    await bot.handleUpdate(cb('do:off'))
    expect(db.raw.prepare('SELECT remind FROM telegram_chats').get().remind).toBe(0)

    // Dil dəyişəndə saxlanılan dil də yenilənir (xatırlatma o dildə)
    await bot.handleUpdate(msg('/next', { lang: 'ru' }))
    expect(db.raw.prepare('SELECT lang FROM telegram_chats').get().lang).toBe('ru')
    expect(f.calls.at(-1).body.text).toContain('Следующий намаз')   // 13:00 Bakı → növbəti

    await bot.handleUpdate(msg('/ayah', { lang: 'en' }))
    const ay = f.calls.at(-1).body
    expect(ay.text).toContain('TEXT-quran-uthmani')
    expect(ay.text).toContain('TEXT-en.asad')
    expect(ay.reply_markup.inline_keyboard[0][0].url).toMatch(/^https:\/\/muslims\.cc\/en\/quran\?s=\d+&a=\d+$/)

    await bot.handleUpdate(msg('/hadith', { lang: 'en' }))
    const hd = f.calls.at(-1).body
    // Dərəcə yalnız Buxari / Müslim mənbəyində (saytın 1-ci qaydası); Sünən — yalnız mənbə
    if (/— (Bukhari|Muslim)/.test(hd.text)) expect(hd.text).toContain('· Sahih')
    else expect(hd.text).not.toContain('Sahih')
    expect(hd.reply_markup.inline_keyboard[0][0].url).toMatch(/^https:\/\/muslims\.cc\/en\/hadith\/\d+$/)

    await bot.handleUpdate(msg('/stop'))
    expect(db.raw.prepare('SELECT COUNT(*) n FROM telegram_chats').get().n).toBe(0)
    // Dünya şəhəri — aladhan (saytdakı kimi metod 13)
    await bot.handleUpdate(cb('ci:London', { lang: 'en' }))
    expect(f.calls.at(-1).body.text).toContain('Fajr — <b>05:00</b>')
  })

  it('istifadəçi botu bloklayıb (403) → qeydi silinir', async () => {
    const db = openDb(':memory:')
    const ok = fakeFetch()
    const bot = tg.createTelegramBot({ db, token: TOKEN, secret: SECRET, fetchImpl: ok, log: silent })
    await bot.handleUpdate(cb('ci:Ganja'))
    expect(db.raw.prepare('SELECT COUNT(*) n FROM telegram_chats').get().n).toBe(1)
    const blocked = tg.createTelegramBot({ db, token: TOKEN, secret: SECRET, fetchImpl: fakeFetch({ tgStatus: 403 }), log: silent })
    await blocked.handleUpdate(msg('/times'))
    expect(db.raw.prepare('SELECT COUNT(*) n FROM telegram_chats').get().n).toBe(0)
  })
})

describe('telegramBot — günün hədisi: dərəcə', () => {
  it('Buxari/Müslim → "Sahih"; Sünən → dərəcəsiz (uydurulmur)', async () => {
    const { LIST } = require('../../server/daily-hadith.js')
    const { dayNumber } = require('../../server/daily-ayah.js')
    const db = openDb(':memory:')
    const seen = { bm: false, other: false }
    // Müxtəlif günlər — hər iki növ düşənə qədər
    for (let d = 0; d < 60 && !(seen.bm && seen.other); d++) {
      const f = fakeFetch()
      const at = Date.UTC(2026, 0, 1 + d, 8)
      const bot = tg.createTelegramBot({ db, token: TOKEN, secret: SECRET, fetchImpl: f, log: silent, now: () => at })
      await bot.handleUpdate(msg('/hadith', { lang: 'en' }))
      const text = f.calls.at(-1).body.text
      const isBM = /— (Bukhari|Muslim)/.test(text)
      expect(text.includes('· Sahih')).toBe(isBM)
      seen[isBM ? 'bm' : 'other'] = true
    }
    expect(seen).toEqual({ bm: true, other: true })
    expect(LIST.length).toBeGreaterThan(0)
    expect(typeof dayNumber).toBe('function')
  })
})

describe('telegramBot — azan xatırlatması', () => {
  it('namaz dəqiqəsində bir dəfə; iki proses eyni bazada — yalnız biri göndərir', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-tg-'))
    const file = path.join(dir, 't.db')
    const a = openDb(file)
    const b = openDb(file)
    // Bakı, 2026-11-24 — sübh vaxtı saytın hesabı ilə (UTC+4)
    const t = prayCalc.computeTimes({ year: 2026, month: 11, day: 24 }, 40.3953, 49.8822, 4, prayCalc.CALC_METHODS.abubakr)
    const [hh, mm] = t.fajr.split(':').map(Number)
    const at = Date.UTC(2026, 10, 24, hh - 4, mm, 15)
    const fa = fakeFetch(), fb = fakeFetch()
    const botA = tg.createTelegramBot({ db: a, token: TOKEN, secret: SECRET, fetchImpl: fa, log: silent, now: () => at, sendGapMs: 0 })
    const botB = tg.createTelegramBot({ db: b, token: TOKEN, secret: SECRET, fetchImpl: fb, log: silent, now: () => at, sendGapMs: 0,
      claims: createPushClaims(b, { log: silent }).set() })
    a.raw.prepare('INSERT INTO telegram_chats (chat_id, lang, city, remind, created_at) VALUES (?, ?, ?, ?, ?)').run(1, 'az', 'Baku', 1, at)
    a.raw.prepare('INSERT INTO telegram_chats (chat_id, lang, city, remind, created_at) VALUES (?, ?, ?, ?, ?)').run(2, 'en', 'Baku', 1, at)
    a.raw.prepare('INSERT INTO telegram_chats (chat_id, lang, city, remind, created_at) VALUES (?, ?, ?, ?, ?)').run(3, 'en', 'Baku', 0, at)
    expect(await botA.tick()).toBe(2)
    expect(await botB.tick()).toBe(0)       // digər proses artıq göndərib
    expect(await botA.tick()).toBe(0)       // eyni proses — təkrar yox
    expect(fb.calls).toHaveLength(0)
    const texts = fa.calls.map((c) => [c.body.chat_id, c.body.text])
    expect(texts.map((x) => x[0]).sort()).toEqual([1, 2])
    expect(texts.find((x) => x[0] === 1)[1]).toContain(`Sübh azanı — ${t.fajr}`)
    expect(texts.find((x) => x[0] === 2)[1]).toContain(`Fajr adhan — ${t.fajr}`)
    a.close(); b.close()
  })

  it('namaz dəqiqəsi deyilsə heç nə getmir', async () => {
    const db = openDb(':memory:')
    const f = fakeFetch()
    const bot = tg.createTelegramBot({ db, token: TOKEN, secret: SECRET, fetchImpl: f, log: silent, now: () => Date.UTC(2026, 10, 24, 6, 1), sendGapMs: 0 })
    db.raw.prepare('INSERT INTO telegram_chats (chat_id, lang, city, remind, created_at) VALUES (1, ?, ?, 1, 0)').run('az', 'Baku')
    expect(await bot.tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
  })
})
