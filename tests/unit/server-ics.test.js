// Server: namaz vaxtları təqvim abunəliyi (server/ics.js)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const ics = require('../../server/ics.js')

describe('ICS köməkçiləri', () => {
  it('icsEscape: \\ ; , və sətir sonu', () => {
    expect(ics.icsEscape('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
  })
  it('foldLine: 75 oktetdən uzun sətir bölünür, UTF-8 simvol yarıya bölünmür', () => {
    const line = 'SUMMARY:' + 'ə'.repeat(80)
    const folded = ics.foldLine(line)
    const parts = folded.split('\r\n')
    expect(parts.length).toBeGreaterThan(1)
    for (const p of parts) expect(Buffer.byteLength(p, 'utf8')).toBeLessThanOrEqual(75)
    expect(parts.slice(1).every(p => p.startsWith(' '))).toBe(true)
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe(line)
  })
  it('utcStamp: Bakı (+4), İstanbul (+3)', () => {
    expect(ics.utcStamp('2026-11-04', '05:38', 'Asia/Baku')).toBe('20261104T013800Z')
    expect(ics.utcStamp('2026-11-04', '00:10', 'Asia/Baku')).toBe('20261103T201000Z')
    expect(ics.utcStamp('2026-11-04', '06:04', 'Europe/Istanbul')).toBe('20261104T030400Z')
  })
  it('parseQuery: yoxlama və təmizləmə', () => {
    expect(ics.parseQuery({ lat: '40.40931', lng: '49.86712', tz: 'Asia/Baku', method: '99', lang: 'az', city: 'Bakı<script>' }))
      .toEqual({ lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku', method: 99, lang: 'az', city: 'Bakıscript' })
    expect(ics.parseQuery({ lat: 'x', lng: '1', tz: 'Asia/Baku', method: '99' })).toBeNull()
    expect(ics.parseQuery({ lat: '40', lng: '49', tz: 'Mars/Base', method: '99' })).toBeNull()
    expect(ics.parseQuery({ lat: '40', lng: '49', tz: 'Asia/Baku', method: '50' })).toBeNull()
    expect(ics.parseQuery({ lat: '80', lng: '49', tz: 'Asia/Baku', method: '99' })).toBeNull()   // qütb — hesab yoxdur
    expect(ics.parseQuery({ lat: '40', lng: '49', tz: 'Asia/Baku', method: '13', lang: 'xx' }).lang).toBe('az')
  })
  it('buildIcs: hadisələr, cümə başlığı, CRLF', () => {
    const loc = { lat: 40.4, lng: 49.9, tz: 'Asia/Baku', method: 99, lang: 'az', city: 'Bakı' }
    const times = { fajr: '05:38', dhuhr: '12:24', asr: '15:11', maghrib: '17:34', isha: '23:50' }
    const out = ics.buildIcs({ loc, days: [{ dateKey: '2026-11-06', friday: true, times }], now: new Date('2026-11-04T10:00:00Z') })
    expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(out.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(out.match(/BEGIN:VEVENT/g)).toHaveLength(5)
    expect(out).toContain('SUMMARY:🕌 Cümə günü — zöhr azanı 12:24')
    expect(out).toContain('X-WR-CALNAME:Namaz vaxtları — Bakı')
    expect(out).toContain('DTSTART:20261106T194900Z'.replace('194900', '195000'))   // işa 23:50 → 19:50Z
    expect(out).toContain('DTEND:20261106T200500Z')                                   // +15 dəq
    expect(out).toContain('UID:2026-11-06-fajr-40.4,49.9,99@muslims.cc')
  })
})

describe('GET /api/prayer.ics', () => {
  let srv
  // Tarix NİSBİDİR: router dünəndən 45 gün irəli götürür — sabit tarix (05-11-2026)
  // bir gün sonra aralıqdan çıxırdı və test "times unavailable" ilə yıxılırdı
  const [yy, mo, dd] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' })
    .format(new Date(Date.now() - 864e5)).split('-')
  const aladhan = { data: [{ date: { gregorian: { date: `${dd}-${mo}-${yy}` } }, timings: { Fajr: '06:04 (+03)', Dhuhr: '12:53 (+03)', Asr: '15:40 (+03)', Maghrib: '18:05 (+03)', Isha: '19:30 (+03)' } }] }
  let calls = 0
  beforeAll(async () => {
    const app = express()
    app.use('/api', ics.createIcsRouter({ fetchImpl: async () => { calls++; return { ok: true, json: async () => aladhan } } }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  it('Azərbaycan (99) — yerli hesab, 47 gün × 5', async () => {
    const r = await fetch(`${srv.url}/api/prayer.ics?lat=40.4093&lng=49.8671&tz=Asia/Baku&method=99&lang=en&city=Baku`)
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toMatch(/^text\/calendar/)
    const body = await r.text()
    expect(body.match(/BEGIN:VEVENT/g)).toHaveLength(47 * 5)
    expect(body).toContain('X-WR-CALNAME:Prayer times — Baku')
    expect(calls).toBe(0)
  })
  it('digər metod — aladhan aylıq təqvimi, keşlənir', async () => {
    const url = `${srv.url}/api/prayer.ics?lat=41.0082&lng=28.9784&tz=Europe/Istanbul&method=13&lang=tr`
    const body = await (await fetch(url)).text()
    expect(body).toContain('SUMMARY:🕌 Sabah ezanı — 06:04')
    expect(body).toContain(`DTSTART:${yy}${mo}${dd}T030400Z`)
    const first = calls
    await fetch(url)
    expect(calls).toBe(first)        // ikinci dəfə şəbəkə yoxdur
  })
  it('pis parametr — 400', async () => {
    expect((await fetch(`${srv.url}/api/prayer.ics?lat=1`)).status).toBe(400)
  })
})
