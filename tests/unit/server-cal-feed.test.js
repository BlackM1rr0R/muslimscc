// Server: şəxsi təqvim axını (server/calFeed.js) — razılıq, kateqoriya yoxlaması, token (256 bit, yalnız SHA-256,
// yenilə / ləğv et), girişsiz .ics (başlıqlar, bağlı hesab), ICS düzgünlüyü (CRLF, 75 oktet qatlama, escape,
// bütün-gün hadisələri, VALARM, RRULE), yalnız seçilmiş kateqoriyalar, məktub mətni YOX, sünnə oruclarının
// saytın təqvimi ilə eyniliyi (CalSunnahFasts.jsx → fastStatus), CASCADE, ixrac.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startApp, require } from './server-together-helpers.js'
import React from 'react'
import { gregorianToHijri as clientHijri } from '../../src/utils/hijri.js'

// Vitest (node) JSX-i klassik rejimdə çevirir — komponent faylı React qlobalını gözləyir
globalThis.React = React
const { fastStatus: clientFastStatus } = await import('../../src/components/calendar/CalSunnahFasts.jsx')

const cf = require('../../server/calFeed.js')
const personal = require('../../server/personal.js')
const serverHijri = require('../../server/hijri.js')

const clock = Date.UTC(2026, 10, 18, 9, 0)   // 2026-11-18, çərşənbə
const CATS_ALL = { loved: true, friday: true, zakat: true, letters: true, fasts: true, challenges: true }
const challenges = new Map()

describe('cal feed HTTP', () => {
  let A, router
  beforeAll(async () => {
    A = await startApp((app, { db, requireUser }) => {
      personal.createPersonalStore(db)   // personal_* cədvəlləri
      router = cf.createCalFeedRouter({ db, requireUser, now: () => clock, challengesOf: (uid) => challenges.get(uid) || [] })
      app.use('/api', router)
    })
  })
  afterAll(() => A.close())

  const json = (r) => r.json()
  const enable = (u, body = {}) => A.call('/api/cal-feed', { cookie: u.cookie, body: { cats: CATS_ALL, lang: 'en', consent: true, ...body } })
  const feed = (token) => A.call(`/api/cal/${token}.ics`, { method: 'GET', headers: {} })
  const ins = (sql, ...a) => A.db.raw.prepare(sql).run(...a)

  it('giriş, CSRF, razılıq, kateqoriya yoxlaması', async () => {
    expect((await A.get('/api/cal-feed')).status).toBe(401)
    const u = await A.signup()
    expect(await json(await A.get('/api/cal-feed', u.cookie))).toEqual({ enabled: false, cats: null, lang: null, createdAt: null, available: cf.CATS })
    expect((await A.call('/api/cal-feed', { cookie: u.cookie, headers: { 'content-type': 'application/json' }, body: {} })).status).toBe(403)
    expect((await json(await enable(u, { consent: undefined }))).code).toBe('consent_required')
    expect((await enable(u, { cats: { loved: false } })).status).toBe(400)
    expect((await enable(u, { cats: { loved: true, secret: true } })).status).toBe(400)
    expect((await enable(u, { cats: { loved: 'yes' } })).status).toBe(400)
    expect((await enable(u, { lang: 'EN!' })).status).toBe(400)
    expect(cf.validCats({ fasts: true })).toEqual({ loved: false, friday: false, zakat: false, letters: false, fasts: true, challenges: false })
    expect(cf.validCats([])).toBe(null)
  })

  it('token: 43 simvol, bazada yalnız həş; .ics başlıqları; yenilə → köhnə 404; ləğv → 404; bağlı hesab → 404', async () => {
    const u = await A.signup()
    const r = await enable(u, { cats: { fasts: true } })
    expect(r.status).toBe(201)
    const { token, enabled, cats } = await json(r)
    expect(enabled).toBe(true)
    expect(cats.fasts).toBe(true)
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const row = A.db.raw.prepare('SELECT * FROM cal_feeds WHERE user_id = ?').get(u.id)
    expect(JSON.stringify(row)).not.toContain(token)
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/)
    const f = await feed(token)
    expect(f.status).toBe(200)
    expect(f.headers.get('content-type')).toMatch(/^text\/calendar; charset=utf-8/)
    expect(f.headers.get('cache-control')).toBe('private, max-age=1800')
    expect(f.headers.get('x-robots-tag')).toMatch(/noindex/)
    expect(f.headers.get('referrer-policy')).toBe('no-referrer')
    expect(f.headers.get('set-cookie')).toBe(null)
    // PATCH (razılıq artıq var) — token dəyişmir
    expect((await json(await A.call('/api/cal-feed', { method: 'PATCH', cookie: u.cookie, body: { cats: { letters: true } } }))).cats.letters).toBe(true)
    expect((await feed(token)).status).toBe(200)
    // yenilə (razılıq ikinci dəfə lazım deyil)
    const again = await json(await A.call('/api/cal-feed', { cookie: u.cookie, body: {} }))
    expect(again.token).not.toBe(token)
    expect(again.cats.letters).toBe(true)
    expect((await feed(token)).status).toBe(404)
    expect((await feed(again.token)).status).toBe(200)
    // səhv format
    expect((await A.call('/api/cal/abc.ics', { method: 'GET', headers: {} })).status).toBe(404)
    expect((await A.call(`/api/cal/${again.token}.txt`, { method: 'GET', headers: {} })).status).toBe(404)
    // bağlı hesab
    ins('UPDATE users SET disabled = 1 WHERE id = ?', u.id)
    expect((await feed(again.token)).status).toBe(404)
    ins('UPDATE users SET disabled = 0 WHERE id = ?', u.id)
    expect((await A.call('/api/cal-feed', { method: 'DELETE', cookie: u.cookie })).status).toBe(200)
    expect((await feed(again.token)).status).toBe(404)
    expect((await A.call('/api/cal-feed', { method: 'PATCH', cookie: u.cookie, body: { cats: { fasts: true } } })).status).toBe(404)
  })

  it('ICS: CRLF, qatlama ≤75 oktet, escape, bütün-gün, VALARM, RRULE, məktub mətni YOX', async () => {
    const u = await A.signup()
    const t = Date.now()
    // ayda bir, ayın 25-i (friday = 100 + 25); vəfat tarixi heç bir hadisə yaratmır
    ins(`INSERT INTO personal_loved (user_id, name, relation, passed_on, calendar, friday, note, next_on, created_at, updated_at)
      VALUES (?, ?, '', '2020-11-18', 'g', 125, 'gizli qeyd', '2026-11-25', ?, ?)`, u.id, 'Əli, oğlu; "Böyük" \\ ata\nyeni sətir', t, t)
    ins(`INSERT INTO personal_loved (user_id, name, relation, passed_on, calendar, friday, note, created_at, updated_at)
      VALUES (?, 'Ana', '', '', 'g', 1, '', ?, ?)`, u.id, t, t)
    ins(`INSERT INTO personal_zakat (user_id, hawl_start, due_on, created_at, updated_at) VALUES (?, '2025-12-01', '2026-12-01', ?, ?)`, u.id, t, t)
    ins(`INSERT INTO personal_letters (user_id, body, deliver_on, kind, tz, lang, status, created_at, updated_at)
      VALUES (?, 'ÇOX GİZLİ MƏKTUB MƏTNİ', '2027-01-05', 'date', 'UTC', 'en', 'pending', ?, ?)`, u.id, t, t)
    ins(`INSERT INTO personal_letters (user_id, body, deliver_on, kind, tz, lang, status, created_at, updated_at)
      VALUES (?, 'artıq çatdırılıb', '2026-11-01', 'date', 'UTC', 'en', 'delivered', ?, ?)`, u.id, t, t)
    challenges.set(u.id, [{ id: 7, template: 'quran_pages', n: 2, title: '', startOn: '2026-11-20', endOn: '2026-12-19' }])
    const { token } = await json(await enable(u, { cats: { ...CATS_ALL, fasts: false } }))
    const body = await (await feed(token)).text()

    expect(body.endsWith('\r\n')).toBe(true)
    expect(body.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)          // yalnız CRLF
    const lines = body.split('\r\n').slice(0, -1)
    for (const l of lines) expect(Buffer.byteLength(l, 'utf8')).toBeLessThanOrEqual(75)
    const unfolded = body.replace(/\r\n /g, '')
    const ul = unfolded.split('\r\n')
    expect(ul[0]).toBe('BEGIN:VCALENDAR')
    expect(ul.filter((l) => l === 'BEGIN:VEVENT').length).toBe(ul.filter((l) => l === 'END:VEVENT').length)
    expect(ul.filter((l) => l === 'BEGIN:VALARM').length).toBe(ul.filter((l) => l === 'END:VALARM').length)
    expect(ul).toContain('X-WR-CALNAME:Muslims.cc — my calendar')
    // escape: , ; \ və sətir sonu
    expect(unfolded).toContain('SUMMARY:Dua for Əli\\, oğlu\\; "Böyük" \\\\ ata\\nyeni sətir')
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20261025\r\nDTEND;VALUE=DATE:20261026')
    expect(unfolded).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=25')
    expect(unfolded).not.toContain('DTSTART;VALUE=DATE:20261118')        // vəfat tarixinin ildönümü YOX
    expect(unfolded).not.toMatch(/anniversary/i)
    expect(unfolded).not.toContain('gizli qeyd')
    // Cümə — həftəlik təkrar
    expect(unfolded).toMatch(/SUMMARY:Friday — remember your loved ones in dua\r\nRRULE:FREQ=WEEKLY;BYDAY=FR/)
    // zəkat — 7 gün əvvəl xatırlatma
    expect(unfolded).toMatch(/DTSTART;VALUE=DATE:20261201\r\nDTEND;VALUE=DATE:20261202\r\nSUMMARY:Zakat year completes/)
    expect(unfolded).toContain('TRIGGER:-P7D')
    // məktub: yalnız başlıq, mətn yox; çatdırılmış daxil deyil
    expect(unfolded).toContain('SUMMARY:A letter to your future self opens')
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20270105')
    expect(unfolded).not.toContain('GİZLİ')
    expect(unfolded).not.toContain('artıq')
    // çağırış: çoxgünlük (DTEND son gündən sonrakı gün)
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261220\r\nSUMMARY:Challenge: 2 pages of Quran daily')
    // oruclar söndürülüb
    expect(unfolded).not.toContain('Sunnah fast')
    // UID-lərdə daxili id / e-poçt yoxdur
    for (const l of ul.filter((x) => x.startsWith('UID:'))) expect(l).toMatch(/^UID:[0-9a-f]{24}@muslims\.cc$/)
    expect(unfolded).not.toContain(u.email)
    expect(new Set(ul.filter((x) => x.startsWith('UID:'))).size).toBe(ul.filter((x) => x.startsWith('UID:')).length)
  })

  it('yalnız seçilmiş kateqoriyalar; Cümə yalnız "hər Cümə" olanda; dil; köhnə ildönümü sətri → Cümə', async () => {
    const u = await A.signup()
    const t = Date.now()
    ins(`INSERT INTO personal_loved (user_id, name, passed_on, calendar, friday, next_on, created_at, updated_at) VALUES (?, 'Nənə', '2019-03-01', 'h', 103, '2026-12-03', ?, ?)`, u.id, t, t)
    ins(`INSERT INTO personal_loved (user_id, name, passed_on, calendar, friday, created_at, updated_at) VALUES (?, 'Baba', '2019-03-01', 'g', 0, ?, ?)`, u.id, t, t)
    ins(`INSERT INTO personal_zakat (user_id, hawl_start, due_on, created_at, updated_at) VALUES (?, '2025-12-01', '2026-12-01', ?, ?)`, u.id, t, t)
    const { token } = await json(await enable(u, { cats: { loved: true, friday: true, fasts: true }, lang: 'az' }))
    const body = (await (await feed(token)).text()).replace(/\r\n /g, '')
    expect(body).toContain('SUMMARY:Nənə üçün dua')
    expect(body).not.toContain('Baba')             // xatırlatma yoxdur
    expect(body).not.toContain('BYDAY=FR')         // "hər Cümə" olan yoxdur
    expect(body).not.toContain('Zəkat')
    expect(body).toContain('X-WR-CALNAME:Muslims.cc — şəxsi təqvim')
    expect(body).toMatch(/SUMMARY:Sünnə orucu — (bazar ertəsi|cümə axşamı|ağ günlər)/)
    // ayda bir: bir təkrarlanan hadisə, ayın 3-ü
    const ev = router.eventsFor(u.id, { loved: true }, 'en', clock)
    expect(ev).toHaveLength(1)
    expect(ev[0]).toMatchObject({ summary: 'Dua for Nənə', date: '2026-11-03', rrule: 'FREQ=MONTHLY;BYMONTHDAY=3' })
    expect(ev[0].description).toContain('A reminder to make dua for Nənə.')
    // köhnə ildönümü sətri (friday 0 + next_on) — ildönümü hadisəsi yox, "hər Cümə" sayılır
    ins(`INSERT INTO personal_loved (user_id, name, passed_on, calendar, friday, next_on, created_at, updated_at) VALUES (?, 'Köhnə', '2018-12-20', 'g', 0, '2026-12-20', ?, ?)`, u.id, t, t)
    const ev2 = router.eventsFor(u.id, { loved: true, friday: true }, 'en', clock)
    expect(ev2.map((e) => e.rrule)).toEqual(['FREQ=MONTHLY;BYMONTHDAY=3', 'FREQ=WEEKLY;BYDAY=FR'])
    expect(JSON.stringify(ev2)).not.toContain('Köhnə')
  })

  it('sünnə orucları: server surəti saytın təqviminin fastStatus-u ilə eynidir (800 gün)', () => {
    const start = Date.UTC(2026, 0, 1, 12)
    let compared = 0
    for (let i = 0; i < 800; i++) {
      const d = new Date(start + i * 86400000)
      const g = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
      const local = new Date(g.year, g.month - 1, g.day, 12)
      const want = clientFastStatus(clientHijri(g), local)
      const got = cf.fastStatus(serverHijri.gregorianToHijri(g), d.getUTCDay())
      expect(got, `${g.year}-${g.month}-${g.day}`).toEqual(want)
      compared++
    }
    expect(compared).toBe(800)
    // axında yalnız ağ siyahı
    expect(cf.FEED_FASTS).not.toContain('shawwal')
  })

  it('hesab silinəndə CASCADE; ixrac / xülasə (token heşi YOX)', async () => {
    const u = await A.signup()
    const { token } = await json(await enable(u))
    expect(router.summaryUser(u.id)).toEqual({ enabled: true })
    const ex = router.exportUser(u.id)
    expect(ex).toMatchObject({ enabled: true, lang: 'en' })
    expect(JSON.stringify(ex)).not.toMatch(/hash|token/)
    expect((await A.del(u)).status).toBe(200)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM cal_feeds WHERE user_id = ?').get(u.id).n).toBe(0)
    expect((await feed(token)).status).toBe(404)
  })

  it('buildFeedIcs: uzun ərəbcə başlıq düzgün qatlanır (UTF-8 simvolu bölünmür)', () => {
    const s = cf.buildFeedIcs({ name: 'تقويم', events: [{ uid: 'x', date: '2026-01-01', summary: 'الأيام البيض '.repeat(12) }], now: new Date(clock) })
    for (const l of s.split('\r\n')) expect(Buffer.byteLength(l, 'utf8')).toBeLessThanOrEqual(75)
    expect(s.replace(/\r\n /g, '')).toContain(`SUMMARY:${'الأيام البيض '.repeat(12)}`)
  })
})
