// Server: şəxsi xatırlatmalar (server/personal.js) — giriş, CSRF, razılıq, yoxlama, həddlər,
// paylaşma tokeni (izlə / ləğv et), abunəlikdən çıxma tokeni, hesab silinəndə CASCADE,
// planlayıcı (saat qurşağı, ikiqat göndəriş yoxdur, təkrar cəhd), sevdiklərim: hər Cümə / ayda bir — ildönümü
// xatırlatması YOXDUR (köhnə sətirlər Cüməyə çevrilir), hövl, şablonlar.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'
import * as siteHijri from '../../src/utils/hijri.js'

const { openDb } = require('../../server/db.js')
const users = require('../../server/users.js')
const personal = require('../../server/personal.js')
const { createMailer, render } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
// Saat: 2026-11-17 06:00 UTC (Bakı 10:00, Nyu-York 01:00)
let clock = Date.UTC(2026, 10, 17, 6, 0)

describe('personal HTTP', () => {
  let srv, db, router
  const mail = []
  beforeAll(async () => {
    db = openDb(':memory:')
    const store = users.createUsersStore(db)
    const app = express()
    const mailer = createMailer({ apiKey: '', onMessage: (m) => mail.push(m) })
    const ur = users.createUsersRouter({
      db, store, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, mailer, webauthn: {}, googleVerify: async () => null,
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
    })
    app.use('/api', ur)
    router = personal.createPersonalRouter({ db, requireUser: ur.requireUser, mailer, publicOrigin: ORIGIN, now: () => clock, log: { error() {} } })
    app.use('/api', router)
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  const signup = async (email, { verified = true } = {}) => {
    const r = await call('/api/auth/register', { body: { email, password: PASS, lang: 'az' } })
    expect(r.status).toBe(201)
    const j = await r.json()
    if (verified) db.raw.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(j.user.id)
    return { cookie: cookieOf(r), id: j.user.id }
  }
  const letter = (extra = {}) => ({ body: 'Özümə: namazı qoru.', deliverOn: '2027-01-01', kind: 'date', tz: 'Asia/Baku', lang: 'az', consent: true, ...extra })

  it('giriş tələb olunur (401); CSRF — 403', async () => {
    expect((await call('/api/personal/letters', { method: 'GET', headers: {} })).status).toBe(401)
    expect((await call('/api/personal/letters', { body: letter() })).status).toBe(401)
    const { cookie } = await signup('csrf@example.com')
    expect((await call('/api/personal/letters', { cookie, headers: { 'content-type': 'application/json' }, body: letter() })).status).toBe(403)
    expect((await call('/api/personal/letters', { cookie, headers: { ...H, origin: 'https://evil.example' }, body: letter() })).status).toBe(403)
    const g = await call('/api/personal/letters', { method: 'GET', cookie, headers: {} })
    expect(g.headers.get('cache-control')).toBe('no-store')
    expect((await g.json()).letters).toEqual([])
  })

  it('məktub: razılıq tələb olunur, sonra yadda qalır; yoxlama; düzəliş və silmə', async () => {
    const { cookie } = await signup('letters@example.com')
    const noConsent = await call('/api/personal/letters', { cookie, body: letter({ consent: undefined }) })
    expect(noConsent.status).toBe(400)
    expect((await noConsent.json()).code).toBe('consent_required')
    const r = await call('/api/personal/letters', { cookie, body: letter() })
    expect(r.status).toBe(201)
    const { letter: l } = await r.json()
    expect(l).toMatchObject({ body: 'Özümə: namazı qoru.', deliverOn: '2027-01-01', status: 'pending' })
    // ikinci dəfə razılıq lazım deyil
    expect((await call('/api/personal/letters', { cookie, body: letter({ consent: undefined, deliverOn: '2027-02-01' }) })).status).toBe(201)
    const bad = async (b, code) => {
      const x = await call('/api/personal/letters', { cookie, body: letter(b) })
      expect(x.status).toBe(400)
      expect((await x.json()).code).toBe(code)
    }
    await bad({ body: '   ' }, 'bad_body')
    await bad({ body: 'x'.repeat(4001) }, 'bad_body')
    await bad({ deliverOn: '2026-11-16' }, 'bad_date')            // keçmiş
    await bad({ deliverOn: '2026-02-30' }, 'bad_date')
    await bad({ deliverOn: '2090-01-01' }, 'bad_date')            // 50 ildən çox
    await bad({ tz: 'Mars/Olympus' }, 'bad_tz')
    await bad({ kind: 'evil' }, 'bad_request')
    // idarə simvolları atılır, sətir sonları qalır
    const c = await call('/api/personal/letters', { cookie, body: letter({ body: 'a\u0000b\r\nc‮d' }) })
    expect((await c.json()).letter.body).toBe('ab\ncd')

    const p = await call(`/api/personal/letters/${l.id}`, { method: 'PATCH', cookie, body: { body: 'Yeni mətn', deliverOn: '2027-03-01' } })
    expect(p.status).toBe(200)
    expect((await p.json()).letter).toMatchObject({ body: 'Yeni mətn', deliverOn: '2027-03-01' })
    // başqa istifadəçi görə/dəyişə bilməz
    const other = await signup('letters2@example.com')
    expect((await call(`/api/personal/letters/${l.id}`, { method: 'PATCH', cookie: other.cookie, body: { body: 'x' } })).status).toBe(404)
    expect((await call(`/api/personal/letters/${l.id}`, { method: 'DELETE', cookie: other.cookie })).status).toBe(404)
    expect((await call(`/api/personal/letters/${l.id}`, { method: 'DELETE', cookie })).status).toBe(200)
    const list = await (await call('/api/personal/letters', { method: 'GET', cookie, headers: {} })).json()
    expect(list.letters.map((x) => x.id)).not.toContain(l.id)
    expect(list.consent).toBe(true)
  })

  it('məktub həddi: 50 gözləyən', async () => {
    const { id, cookie } = await signup('cap@example.com')
    expect((await call('/api/personal/letters', { cookie, body: letter() })).status).toBe(201)
    const ins = db.raw.prepare(`INSERT INTO personal_letters (user_id, body, deliver_on, kind, tz, lang, created_at, updated_at) VALUES (?, 'x', '2027-01-01', 'date', 'UTC', 'en', 1, 1)`)
    for (let i = 0; i < 49; i++) ins.run(id)
    const r = await call('/api/personal/letters', { cookie, body: letter() })
    expect(r.status).toBe(409)
    expect((await r.json()).code).toBe('too_many')
  })

  it('sevdiklərim: əlavə, yoxlama, paylaşma → izləmə → ləğv; token bazada yalnız heş', async () => {
    const owner = await signup('owner@example.com')
    const fam = await signup('family@example.com')
    const add = (b, cookie = owner.cookie) => call('/api/personal/loved', { cookie, body: { name: 'Ana', relation: 'ana', passedOn: '2020-05-24', calendar: 'h', friday: true, note: 'şəxsi qeyd', tz: 'Asia/Baku', lang: 'az', consent: true, ...b } })
    const r = await add({})
    expect(r.status).toBe(201)
    const { item } = await r.json()
    // köhnə klient (calendar + friday) → "hər Cümə"; vəfat tarixi heç nəyi planlaşdırmır
    expect(item).toMatchObject({ name: 'Ana', calendar: 'h', remind: 'friday', monthDay: null, friday: true, note: 'şəxsi qeyd', nextOn: null })
    for (const [b, code] of [[{ name: '' }, 'bad_name'], [{ name: 'x'.repeat(81) }, 'bad_name'], [{ passedOn: '2027-01-01' }, 'bad_date'],
      [{ passedOn: '1800-01-01' }, 'bad_date'], [{ passedOn: 20200524 }, 'bad_date'], [{ calendar: 'x' }, 'bad_request'], [{ friday: 'yes' }, 'bad_request'],
      [{ note: 'x'.repeat(501) }, 'bad_request'], [{ remind: 'anniversary' }, 'bad_request'], [{ remind: 'monthly' }, 'bad_request'],
      [{ remind: 'monthly', monthDay: 29 }, 'bad_request'], [{ remind: 'monthly', monthDay: 0 }, 'bad_request'], [{ remind: 'monthly', monthDay: '5' }, 'bad_request'],
      [{ remind: 'monthly', monthDay: 2.5 }, 'bad_request'], [{ remind: 'friday', monthDay: 40 }, 'bad_request']]) {
      const x = await add(b)
      expect(x.status, JSON.stringify(b)).toBe(400)
      expect((await x.json()).code).toBe(code)
    }
    // paylaşma
    expect((await call('/api/personal/loved/share', { cookie: fam.cookie })).status).toBe(400)   // razılıq yoxdur
    const s = await call('/api/personal/loved/share', { cookie: owner.cookie })
    expect(s.status).toBe(201)
    const { token } = await s.json()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const dump = JSON.stringify(db.raw.prepare('SELECT * FROM personal_loved_shares').all())
    expect(dump).not.toContain(token)
    const pv = await (await call('/api/personal/follow/preview', { cookie: fam.cookie, body: { token } })).json()
    expect(pv).toMatchObject({ count: 1, self: false, following: false })
    expect(pv.ownerLabel).toBe('o•••@e•••.com')
    expect((await call('/api/personal/follow', { cookie: owner.cookie, body: { token, consent: true, tz: 'UTC' } })).status).toBe(400)  // özü
    const nf = await call('/api/personal/follow', { cookie: fam.cookie, body: { token, tz: 'Europe/Istanbul', lang: 'tr' } })
    expect((await nf.json()).code).toBe('consent_required')
    expect((await call('/api/personal/follow', { cookie: fam.cookie, body: { token, consent: true, tz: 'Europe/Istanbul', lang: 'tr' } })).status).toBe(201)
    const fv = await (await call('/api/personal/loved', { method: 'GET', cookie: fam.cookie, headers: {} })).json()
    expect(fv.following).toHaveLength(1)
    expect(fv.following[0].items[0]).toMatchObject({ name: 'Ana' })
    expect(fv.following[0].items[0].note).toBeUndefined()                 // qeyd izləyənə göstərilmir
    // izləyən redaktə edə bilməz
    expect((await call(`/api/personal/loved/${item.id}`, { method: 'PATCH', cookie: fam.cookie, body: { name: 'X' } })).status).toBe(404)
    expect((await call(`/api/personal/loved/${item.id}`, { method: 'DELETE', cookie: fam.cookie })).status).toBe(404)
    const ov = await (await call('/api/personal/loved', { method: 'GET', cookie: owner.cookie, headers: {} })).json()
    expect(ov.share).toMatchObject({ active: true })
    expect(ov.share.followers).toHaveLength(1)
    // ləğv: keçid işləmir, izləyənlər çıxarılır
    expect((await call('/api/personal/loved/share', { method: 'DELETE', cookie: owner.cookie })).status).toBe(200)
    expect((await call('/api/personal/follow/preview', { cookie: fam.cookie, body: { token } })).status).toBe(404)
    const fv2 = await (await call('/api/personal/loved', { method: 'GET', cookie: fam.cookie, headers: {} })).json()
    expect(fv2.following).toEqual([])
    // düzəliş
    const patch = async (body) => (await (await call(`/api/personal/loved/${item.id}`, { method: 'PATCH', cookie: owner.cookie, body })).json()).item
    const fridayCol = () => db.raw.prepare('SELECT friday, next_on FROM personal_loved WHERE id = ?').get(item.id)
    // köhnə klientin redaktəsi (friday: false) — rejim qalır, ildönümü planlaşdırılmır
    expect(await patch({ calendar: 'g', friday: false })).toMatchObject({ calendar: 'g', remind: 'friday', friday: true, nextOn: null })
    // ayda bir: Bakı 2026-11-17 → ayın 20-si = 2026-11-20; 5-i = 2026-12-05; 17-si = bu gün
    expect(await patch({ remind: 'monthly', monthDay: 20 })).toMatchObject({ remind: 'monthly', monthDay: 20, friday: false, nextOn: '2026-11-20' })
    expect(fridayCol()).toEqual({ friday: 120, next_on: '2026-11-20' })
    expect(await patch({ monthDay: 5 })).toMatchObject({ remind: 'monthly', monthDay: 5, nextOn: '2026-12-05' })
    expect(await patch({ monthDay: 17 })).toMatchObject({ remind: 'monthly', monthDay: 17, nextOn: '2026-11-17' })
    expect(await patch({ name: 'Anam', friday: false })).toMatchObject({ name: 'Anam', remind: 'monthly', monthDay: 17 })   // köhnə klient
    expect(await patch({ friday: true })).toMatchObject({ remind: 'friday', monthDay: null, nextOn: null })
    expect(fridayCol()).toEqual({ friday: 1, next_on: null })
    expect(await patch({ remind: 'off' })).toMatchObject({ remind: 'off', friday: false, nextOn: null })
    expect(fridayCol()).toEqual({ friday: 0, next_on: null })
    // vəfat tarixi istəyə bağlıdır və silinə bilər
    expect(await patch({ passedOn: null })).toMatchObject({ passedOn: '', remind: 'off' })
    const noDate = await add({ name: 'Baba', passedOn: undefined, calendar: undefined, friday: undefined, remind: 'monthly', monthDay: 1 })
    expect(noDate.status).toBe(201)
    expect((await noDate.json()).item).toMatchObject({ name: 'Baba', passedOn: '', remind: 'monthly', monthDay: 1, nextOn: '2026-12-01' })
    // köhnə ildönümü sətri (friday 0 + next_on) — siyahı oxunanda yerində "hər Cümə"yə çevrilir
    const legacy = Number(db.raw.prepare(`INSERT INTO personal_loved (user_id, name, relation, passed_on, calendar, friday, note, next_on, created_at, updated_at)
      VALUES (?, 'Köhnə', '', '2018-12-20', 'g', 0, '', '2026-12-20', 1, 1)`).run(owner.id).lastInsertRowid)
    const lv = await (await call('/api/personal/loved', { method: 'GET', cookie: owner.cookie, headers: {} })).json()
    expect(lv.items.find((x) => x.id === legacy)).toMatchObject({ remind: 'friday', friday: true, nextOn: null, passedOn: '2018-12-20' })
    expect(db.raw.prepare('SELECT friday, next_on FROM personal_loved WHERE id = ?').get(legacy)).toEqual({ friday: 1, next_on: null })
  })

  it('zəkat: hövl tarixi hicri ilə; məbləğ yalnız istəyə görə', async () => {
    const { cookie } = await signup('zakat@example.com')
    const put = (b) => call('/api/personal/zakat', { method: 'PUT', cookie, body: { hawlStart: '2026-11-17', tz: 'Asia/Baku', lang: 'az', consent: true, ...b } })
    const r = await put({ amount: 1234.5, currency: 'AZN' })
    const { reminder } = await r.json()
    expect(reminder).toMatchObject({ hawlStart: '2026-11-17', dueOn: '2027-11-06', amount: null, currency: null })
    const h0 = siteHijri.gregorianToHijri({ year: 2026, month: 11, day: 17 })
    const h1 = siteHijri.gregorianToHijri(siteHijri.parseGKey(reminder.dueOn))
    expect(h1).toEqual({ ...h0, year: h0.year + 1 })
    const r2 = await put({ storeAmount: true, amount: 1234.567, currency: 'AZN' })
    expect((await r2.json()).reminder).toMatchObject({ amount: 1234.57, currency: 'AZN' })
    expect((await put({ storeAmount: true, amount: -1, currency: 'AZN' })).status).toBe(400)
    expect((await put({ storeAmount: true, amount: 1, currency: 'azn' })).status).toBe(400)
    expect((await put({ hawlStart: '2030-01-01' })).status).toBe(400)
    // köhnə başlanğıc → gələcəkdəki ilk hövl
    const old = await (await put({ hawlStart: '2024-03-01' })).json()
    expect(old.reminder.dueOn >= '2026-11-17').toBe(true)
    expect((await call('/api/personal/zakat', { method: 'DELETE', cookie })).status).toBe(200)
    expect((await (await call('/api/personal/zakat', { method: 'GET', cookie, headers: {} })).json()).reminder).toBeNull()
  })

  it('push bağlantısı: yalnız mövcud abunəlik', async () => {
    const { cookie, id } = await signup('push@example.com')
    const ep = 'https://fcm.googleapis.com/fcm/send/abc'
    expect((await call('/api/personal/push-link', { cookie, body: { endpoint: ep, on: true } })).status).toBe(404)
    db.raw.prepare(`INSERT INTO push_subs (endpoint, keys_p256dh, keys_auth, lang, prefs, user_agent, created_at, updated_at) VALUES (?, 'p', 'a', 'az', '{}', '', 1, 1)`).run(ep)
    expect((await (await call('/api/personal/push-link', { cookie, body: { endpoint: ep, on: true } })).json()).linked).toBe(true)
    expect((await (await call('/api/personal/push-link/status', { cookie, body: { endpoint: ep } })).json()).linked).toBe(true)
    expect(db.raw.prepare('SELECT user_id FROM personal_push_links WHERE endpoint = ?').get(ep).user_id).toBe(id)
    expect((await (await call('/api/personal/push-link', { cookie, body: { endpoint: ep, on: false } })).json()).linked).toBe(false)
  })

  it('abunəlikdən çıxma: imzalı token, GET təsdiq səhifəsi, POST çıxış; saxta token 400', async () => {
    const { cookie, id } = await signup('unsub@example.com')
    await call('/api/personal/loved', { cookie, body: { name: 'Ata', passedOn: '2010-01-01', tz: 'UTC', lang: 'en', consent: true } })
    await call('/api/personal/zakat', { method: 'PUT', cookie, body: { hawlStart: '2026-11-01', tz: 'UTC', consent: true } })
    const secret = router.store.secret()
    const t = personal.unsubToken(secret, id, 'loved')
    expect(personal.verifyUnsub(secret, t)).toEqual({ userId: id, scope: 'loved' })
    expect(personal.verifyUnsub(secret, t.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')))).toBeNull()
    expect(personal.verifyUnsub(secret, `${id + 1}.loved.${t.split('.')[2]}`)).toBeNull()
    const g = await fetch(`${srv.url}/api/personal/unsubscribe?t=${t}`)
    expect(g.status).toBe(200)
    expect(g.headers.get('content-security-policy')).toContain("default-src 'none'")
    expect(await g.text()).toContain('<form method="post"')
    expect(router.store.prefs(id).loved_email).toBe(1)                         // GET heç nəyi dəyişmir
    const p = await fetch(`${srv.url}/api/personal/unsubscribe`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `t=${t}` })
    expect(p.status).toBe(200)
    expect(router.store.prefs(id).loved_email).toBe(0)
    // RFC 8058 bir kliklə (token URL-də)
    const z = personal.unsubToken(secret, id, 'zakat')
    const oc = await fetch(`${srv.url}/api/personal/unsubscribe?t=${z}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })
    expect(await oc.json()).toEqual({ ok: true })
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM personal_zakat WHERE user_id = ?').get(id).n).toBe(0)
    expect((await fetch(`${srv.url}/api/personal/unsubscribe?t=1.loved.xxx`)).status).toBe(400)
  })

  it('abunəlikdən çıxma tokeni razılıq vaxtına bağlıdır: e-poçtu yenidən açmaq / zəkatı təzədən qurmaq köhnə keçidi ləğv edir', async () => {
    const t0 = clock
    clock = Date.UTC(2026, 11, 1, 6, 0)   // LEGACY tarixindən sonra: köhnə forma qəbul olunmur
    try {
      const { cookie, id } = await signup('rotate@example.com')
      await call('/api/personal/loved', { cookie, body: { name: 'Ata', passedOn: '2010-01-01', tz: 'UTC', lang: 'en', consent: true } })
      await call('/api/personal/zakat', { method: 'PUT', cookie, body: { hawlStart: '2026-11-25', tz: 'UTC', consent: true } })
      const secret = router.store.secret()
      const pr = () => router.store.prefs(id)
      const post = (t) => fetch(`${srv.url}/api/personal/unsubscribe?t=${t}`, { method: 'POST' })
      const loved1 = personal.unsubToken(secret, id, 'loved', pr().consent_loved)
      expect((await post(personal.unsubToken(secret, id, 'loved'))).status).toBe(400)   // köhnə forma, yeni razılıq
      expect((await post(loved1)).status).toBe(200)
      expect(pr().loved_email).toBe(0)
      // e-poçtu yenidən açır → razılıq vaxtı yenilənir, köhnə keçid işləmir
      clock += 60e3
      expect((await call('/api/personal/prefs', { method: 'PATCH', cookie, body: { lovedEmail: true } })).status).toBe(200)
      expect(pr().consent_loved).toBe(clock)
      expect((await post(loved1)).status).toBe(400)
      expect(pr().loved_email).toBe(1)
      // eyni vəziyyəti təkrar göndərmək (true → true) tokeni dəyişmir
      const loved2 = personal.unsubToken(secret, id, 'loved', pr().consent_loved)
      clock += 60e3
      await call('/api/personal/prefs', { method: 'PATCH', cookie, body: { lovedEmail: true } })
      expect((await fetch(`${srv.url}/api/personal/unsubscribe?t=${loved2}`)).status).toBe(200)
      // zəkat: keçidlə silinir, təzədən qurulanda köhnə keçid işləmir
      const z1 = personal.unsubToken(secret, id, 'zakat', pr().consent_zakat)
      expect((await post(z1)).status).toBe(200)
      expect(db.raw.prepare('SELECT COUNT(*) AS n FROM personal_zakat WHERE user_id = ?').get(id).n).toBe(0)
      clock += 60e3
      await call('/api/personal/zakat', { method: 'PUT', cookie, body: { hawlStart: '2026-11-25', tz: 'UTC' } })
      expect(pr().consent_zakat).toBe(clock)
      expect((await post(z1)).status).toBe(400)
      expect(db.raw.prepare('SELECT COUNT(*) AS n FROM personal_zakat WHERE user_id = ?').get(id).n).toBe(1)
    } finally { clock = t0 }
  })

  it('izləyəni yalnız sahib çıxarır (IDOR): başqası → 404, sətir qalır; sahib → 200', async () => {
    const owner = await signup('idor-owner@example.com')
    const fam = await signup('idor-fam@example.com')
    const other = await signup('idor-other@example.com')
    await call('/api/personal/loved', { cookie: owner.cookie, body: { name: 'Nənə', passedOn: '2015-06-01', tz: 'UTC', consent: true } })
    await call('/api/personal/loved', { cookie: other.cookie, body: { name: 'Baba', passedOn: '2016-06-01', tz: 'UTC', consent: true } })
    const { token } = await (await call('/api/personal/loved/share', { cookie: owner.cookie })).json()
    expect((await call('/api/personal/follow', { cookie: fam.cookie, body: { token, consent: true, tz: 'UTC' } })).status).toBe(201)
    const ov = await (await call('/api/personal/loved', { method: 'GET', cookie: owner.cookie, headers: {} })).json()
    const fid = ov.share.followers[0].id
    expect(fid).toBe(fam.id)
    const rows = () => db.raw.prepare('SELECT COUNT(*) AS n FROM personal_loved_followers WHERE owner_id = ? AND follower_id = ?').get(owner.id, fam.id).n
    expect((await call(`/api/personal/loved/followers/${fid}`, { method: 'DELETE', cookie: other.cookie })).status).toBe(404)
    expect((await call(`/api/personal/loved/followers/${fid}`, { method: 'DELETE', cookie: fam.cookie })).status).toBe(404)
    expect(rows()).toBe(1)
    expect((await call('/api/personal/loved/followers/abc', { method: 'DELETE', cookie: owner.cookie })).status).toBe(404)
    expect((await call(`/api/personal/loved/followers/${fid}`, { method: 'DELETE', cookie: owner.cookie })).status).toBe(200)
    expect(rows()).toBe(0)
  })

  it('hesab silinəndə hər şey silinir (CASCADE); DELETE /api/personal — hamısı', async () => {
    const a = await signup('cascade@example.com')
    const b = await signup('cascade2@example.com')
    await call('/api/personal/letters', { cookie: a.cookie, body: letter() })
    await call('/api/personal/loved', { cookie: a.cookie, body: { name: 'Nənə', passedOn: '2015-06-01', tz: 'UTC', consent: true } })
    const { token } = await (await call('/api/personal/loved/share', { cookie: a.cookie })).json()
    await call('/api/personal/follow', { cookie: b.cookie, body: { token, consent: true, tz: 'UTC' } })
    await call('/api/personal/zakat', { method: 'PUT', cookie: a.cookie, body: { hawlStart: '2026-11-01', consent: true } })
    const count = (uid) => ['personal_letters', 'personal_loved', 'personal_zakat', 'personal_prefs', 'personal_loved_shares']
      .reduce((n, t) => n + db.raw.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE ${t === 'personal_loved_shares' ? 'owner_id' : 'user_id'} = ?`).get(uid).n, 0)
    expect(count(a.id)).toBe(5)
    expect((await call('/api/auth/delete', { cookie: a.cookie, body: { password: PASS } })).status).toBe(200)
    expect(count(a.id)).toBe(0)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM personal_loved_followers WHERE owner_id = ? OR follower_id = ?').get(a.id, a.id).n).toBe(0)
    // b-nin öz məlumatı — DELETE /api/personal
    await call('/api/personal/letters', { cookie: b.cookie, body: letter() })
    expect((await call('/api/personal', { method: 'DELETE', cookie: b.cookie })).status).toBe(200)
    expect(count(b.id)).toBe(0)
  })
})

// ─── Saf hesablar ───
describe('tarix hesabları', () => {
  it('ayda bir: növbəti seçilmiş gün (bu gün daxil), il keçidi; 1–28 xaricində null', () => {
    expect(personal.nextMonthDay(20, '2026-11-17')).toBe('2026-11-20')
    expect(personal.nextMonthDay(17, '2026-11-17')).toBe('2026-11-17')
    expect(personal.nextMonthDay(5, '2026-11-17')).toBe('2026-12-05')
    expect(personal.nextMonthDay(1, '2026-12-31')).toBe('2027-01-01')
    expect(personal.nextMonthDay(28, '2027-02-28')).toBe('2027-02-28')
    for (const d of [0, 29, 31, 1.5, '5', null]) expect(personal.nextMonthDay(d, '2026-11-17')).toBeNull()
    expect(personal.nextMonthDay(5, 'x')).toBeNull()
  })
  it('xatırlatma rejimi: 0 yox, 1 Cümə, 100+g ayda bir; köhnə ildönümü sətri → Cümə', () => {
    expect(personal.lovedMode({ friday: 0, next_on: null })).toEqual({ remind: 'off', monthDay: null })
    expect(personal.lovedMode({ friday: 1, next_on: null })).toEqual({ remind: 'friday', monthDay: null })
    expect(personal.lovedMode({ friday: 0, next_on: '2026-12-20' })).toEqual({ remind: 'friday', monthDay: null })
    expect(personal.lovedMode({ friday: 1, next_on: '2026-12-20' })).toEqual({ remind: 'friday', monthDay: null })
    expect(personal.lovedMode({ friday: 101, next_on: '2026-12-01' })).toEqual({ remind: 'monthly', monthDay: 1 })
    expect(personal.lovedMode({ friday: 128, next_on: '2026-12-28' })).toEqual({ remind: 'monthly', monthDay: 28 })
    expect(personal.lovedMode({ friday: 129, next_on: null })).toEqual({ remind: 'off', monthDay: null })
    expect(personal.nextAnniversary).toBeUndefined()
  })
  it('hövl: bir hicri il (354/355 gün)', () => {
    for (const s of ['2026-01-10', '2026-06-01', '2026-11-17']) {
      const d = personal.hawlDue(s, s)
      const days = siteHijri.gDiffDays(siteHijri.parseGKey(s), siteHijri.parseGKey(d))
      expect([354, 355]).toContain(days)
    }
  })
  it('saat qurşağı: yerli gün və saat', () => {
    const t = Date.UTC(2026, 10, 20, 5, 30)
    expect(personal.localNow(t, 'Asia/Baku')).toEqual({ date: '2026-11-20', hour: 9, friday: true })
    expect(personal.localNow(t, 'America/New_York')).toEqual({ date: '2026-11-20', hour: 0, friday: true })
    expect(personal.localNow(t, 'Pacific/Kiritimati').date).toBe('2026-11-20')
    expect(personal.dayState(t, 'Asia/Baku', '2026-11-20')).toBe('due')
    expect(personal.dayState(t, 'America/New_York', '2026-11-20')).toBe('before')
    expect(personal.dayState(t, 'America/New_York', '2026-11-19')).toBe('after')
    expect(personal.validTz('Asia/Baku')).toBe(true)
    expect(personal.validTz('UTC')).toBe(true)
    expect(personal.validTz('Nope/Zone')).toBe(false)
    expect(personal.validTz('../../etc')).toBe(false)
  })
  it('personLabel: ad, yoxdursa maskalı e-poçt', () => {
    expect(personal.personLabel({ display_name: 'Əli', email: 'a@b.c' })).toBe('Əli')
    expect(personal.personLabel({ display_name: '', email: 'ali@gmail.com' })).toBe('a•••@g•••.com')
  })
})

// ─── Planlayıcı ───
describe('planlayıcı', () => {
  let db, store, ids
  const mkUser = (email, verified = 1) => Number(db.raw.prepare(`INSERT INTO users (email, email_verified, display_name, created_at, updated_at) VALUES (?, ?, '', 1, 1)`).run(email, verified).lastInsertRowid)
  beforeAll(() => {
    db = openDb(':memory:')
    users.createUsersStore(db)
    store = personal.createPersonalStore(db)
    ids = { baku: mkUser('baku@example.com'), ny: mkUser('ny@example.com'), unv: mkUser('unv@example.com', 0) }
    store.touchPrefs(ids.baku, { tz: 'Asia/Baku', lang: 'az', consent: 'letters' })
    store.touchPrefs(ids.ny, { tz: 'America/New_York', lang: 'en', consent: 'letters' })
    store.touchPrefs(ids.unv, { tz: 'UTC', lang: 'en', consent: 'letters' })
  })
  const insLetter = (uid, tz, on, lang = 'az') => Number(db.raw.prepare(`INSERT INTO personal_letters (user_id, body, deliver_on, kind, tz, lang, created_at, updated_at) VALUES (?, 'Məktub mətni', ?, 'date', ?, ?, ?, ?)`)
    .run(uid, on, tz, lang, Date.UTC(2026, 0, 1), Date.UTC(2026, 0, 1)).lastInsertRowid)
  const letterRow = (id) => db.raw.prepare('SELECT * FROM personal_letters WHERE id = ?').get(id)

  it('məktub: yerli 09:00-da, hər saat qurşağında öz vaxtında; iki dəfə göndərilmir', async () => {
    const got = []
    const s = personal.createScheduler({ store, mailer: createMailer({ apiKey: '', onMessage: (m) => got.push(m) }), log: { error() {} } })
    const a = insLetter(ids.baku, 'Asia/Baku', '2026-12-01')
    const b = insLetter(ids.ny, 'America/New_York', '2026-12-01', 'en')
    await s.tick(Date.UTC(2026, 10, 30, 23, 0))         // Bakı 1 dek 03:00 — tez
    expect(got).toHaveLength(0)
    await s.tick(Date.UTC(2026, 11, 1, 5, 0))           // Bakı 09:00 → göndərilir; NY 00:00 — yox
    expect(got.map((m) => m.to)).toEqual(['baku@example.com'])
    expect(got[0].kind).toBe('letter')
    expect(got[0].text).toContain('Məktub mətni')
    expect(letterRow(a).status).toBe('delivered')
    expect(letterRow(b).status).toBe('pending')
    await s.tick(Date.UTC(2026, 11, 1, 5, 1))
    await Promise.all([s.tick(Date.UTC(2026, 11, 1, 14, 0)), s.tick(Date.UTC(2026, 11, 1, 14, 0))])   // NY 09:00; paralel tick
    expect(got.map((m) => m.to)).toEqual(['baku@example.com', 'ny@example.com'])
    expect(got[1].subject).toMatch(/future self/)
    // ikinci planlayıcı (yenidən başlama) — yenə göndərmir
    const s2 = personal.createScheduler({ store, mailer: createMailer({ apiKey: '', onMessage: (m) => got.push(m) }), log: { error() {} } })
    await s2.tick(Date.UTC(2026, 11, 2, 14, 0))
    expect(got).toHaveLength(2)
  })

  it('məktub: təsdiqlənməmiş e-poçta göndərilmir (oxumaq üçün hesabda qalır)', async () => {
    const got = []
    const s = personal.createScheduler({ store, mailer: createMailer({ apiKey: '', onMessage: (m) => got.push(m) }), log: { error() {} } })
    const id = insLetter(ids.unv, 'UTC', '2026-12-05', 'en')
    await s.tick(Date.UTC(2026, 11, 5, 10, 0))
    expect(got).toHaveLength(0)
    expect(letterRow(id).status).toBe('delivered')
  })

  it('xəta: artan fasilə ilə təkrar, 5 cəhddən sonra failed; ilişib qalmış "sending" yenidən göndərilmir', async () => {
    let calls = 0
    const failing = { sendTemplate: async () => { calls++; return { ok: false } } }
    const s = personal.createScheduler({ store, mailer: failing, log: { error() {} } })
    const id = insLetter(ids.baku, 'Asia/Baku', '2026-12-10')
    let t = Date.UTC(2026, 11, 10, 6, 0)
    await s.tick(t)
    expect(calls).toBe(1)
    expect(letterRow(id)).toMatchObject({ status: 'pending', attempts: 1 })
    await s.tick(t + 60000)                               // fasilə bitməyib
    expect(calls).toBe(1)
    for (let i = 0; i < 6; i++) { t += 4 * 3600e3; await s.tick(t) }
    expect(calls).toBe(5)
    expect(letterRow(id)).toMatchObject({ status: 'failed', attempts: 5 })
    // ilişib qalmış sətir
    const st = insLetter(ids.baku, 'Asia/Baku', '2026-12-11')
    db.raw.prepare("UPDATE personal_letters SET status = 'sending', updated_at = ? WHERE id = ?").run(Date.UTC(2026, 11, 11, 5, 0), st)
    await s.tick(Date.UTC(2026, 11, 11, 6, 0))
    expect(calls).toBe(5)
    expect(letterRow(st).status).toBe('delivered')
  })

  it('köhnə ildönümü sətri: ildönümündə HEÇ NƏ göndərilmir, tick-də "hər Cümə"yə çevrilir', async () => {
    const got = []
    const s = personal.createScheduler({ store, mailer: createMailer({ apiKey: '', onMessage: (m) => got.push(m) }), log: { error() {} } })
    const uid = mkUser('legacy@example.com')
    store.touchPrefs(uid, { tz: 'Asia/Baku', lang: 'az', consent: 'loved' })
    const lid = Number(db.raw.prepare(`INSERT INTO personal_loved (user_id, name, relation, passed_on, calendar, friday, note, next_on, created_at, updated_at) VALUES (?, 'Köhnə', '', '2018-12-20', 'g', 0, '', '2026-12-20', 1, 1)`).run(uid).lastInsertRowid)
    await s.tick(Date.UTC(2026, 11, 20, 5, 0))           // ildönümü günü, Bakı 09:00 (bazar)
    await s.tick(Date.UTC(2026, 11, 20, 6, 0))
    expect(got).toHaveLength(0)
    expect(db.raw.prepare('SELECT friday, next_on FROM personal_loved WHERE id = ?').get(lid)).toEqual({ friday: 1, next_on: null })
    await s.tick(Date.UTC(2026, 11, 25, 6, 0))           // Cümə, Bakı 10:00
    expect(got.map((m) => [m.to, m.kind])).toEqual([['legacy@example.com', 'friday']])
    expect(got[0].text).toContain('Köhnə')
    expect(got[0].text).not.toMatch(/ildönüm|il tamam/)
  })

  it('ayda bir: sahibə və izləyənə öz saat qurşağında seçilmiş gün bir dəfə; unsub keçidi; sonra gələn aya keçir', async () => {
    const got = []
    const pushes = []
    const ep = 'https://fcm.googleapis.com/fcm/send/p1'
    db.raw.prepare(`INSERT INTO push_subs (endpoint, keys_p256dh, keys_auth, lang, prefs, user_agent, created_at, updated_at) VALUES (?, 'p', 'a', 'en', '{}', '', 1, 1)`).run(ep)
    db.raw.prepare('INSERT INTO personal_push_links (endpoint, user_id, created_at) VALUES (?, ?, 1)').run(ep, ids.ny)
    const s = personal.createScheduler({
      store, mailer: createMailer({ apiKey: '', onMessage: (m) => got.push(m) }), log: { error() {} },
      pushSend: async (subs, msg) => { pushes.push({ subs, msg }); return { successCount: subs.length } },
    })
    // ayın 20-si (friday = 120); vəfat tarixi başqa gündür və heç nəyi planlaşdırmır
    const lid = Number(db.raw.prepare(`INSERT INTO personal_loved (user_id, name, relation, passed_on, calendar, friday, note, next_on, created_at, updated_at) VALUES (?, 'Həsən', '', '2018-12-09', 'g', 120, '', '2026-12-20', 1, 1)`).run(ids.baku).lastInsertRowid)
    db.raw.prepare('INSERT INTO personal_loved_followers (owner_id, follower_id, created_at) VALUES (?, ?, 1)').run(ids.baku, ids.ny)
    await s.tick(Date.UTC(2026, 11, 20, 5, 0))           // Bakı 09:00
    await s.tick(Date.UTC(2026, 11, 20, 6, 0))
    expect(got.map((m) => m.to)).toEqual(['baku@example.com'])
    expect(got[0].kind).toBe('lovedRemind')
    expect(got[0].text).toContain('Həsən üçün dua')
    expect(got[0].text).not.toMatch(/ildönüm|il tamam|\b8\b/)
    expect(got[0].headers['List-Unsubscribe']).toMatch(/\/api\/personal\/unsubscribe\?t=\d+\.loved\./)
    await s.tick(Date.UTC(2026, 11, 20, 14, 0))          // NY 09:00
    await s.tick(Date.UTC(2026, 11, 20, 15, 0))
    expect(got.map((m) => m.to)).toEqual(['baku@example.com', 'ny@example.com'])
    expect(got[1].subject).toBe('A reminder to make dua for Həsən')
    expect(got[1].text).toContain('A reminder to make dua for Həsən.')
    expect(got[1].text).not.toMatch(/anniversary/i)
    expect(pushes).toHaveLength(1)
    expect(pushes[0].subs[0].endpoint).toBe(ep)
    expect(pushes[0].msg.notification).toEqual({ title: 'Dua for your loved ones', body: 'A reminder to make dua for Həsən.' })
    // e-poçt sönülü (unsubscribe) — yalnız push
    await s.tick(Date.UTC(2026, 11, 22, 0, 0))           // gün hər yerdə bitib → növbəti ay
    expect(db.raw.prepare('SELECT friday, next_on FROM personal_loved WHERE id = ?').get(lid)).toEqual({ friday: 120, next_on: '2027-01-20' })
    expect(got).toHaveLength(2)
  })

  it('Cümə: siyahı bir məktubda, həftədə bir dəfə; e-poçt sönülüdürsə göndərilmir', async () => {
    const got = []
    const s = personal.createScheduler({ store, mailer: createMailer({ apiKey: '', onMessage: (m) => got.push(m) }), log: { error() {} } })
    db.raw.prepare(`INSERT INTO personal_loved (user_id, name, passed_on, calendar, friday, next_on, created_at, updated_at) VALUES (?, 'Zeynəb', '2011-01-01', 'g', 1, '2027-01-01', 1, 1)`).run(ids.baku)
    db.raw.prepare(`INSERT INTO personal_loved (user_id, name, passed_on, calendar, friday, next_on, created_at, updated_at) VALUES (?, 'Musa', '2012-01-01', 'g', 1, '2027-01-01', 1, 1)`).run(ids.baku)
    await s.tick(Date.UTC(2026, 11, 24, 6, 0))           // Cümə axşamı
    expect(got).toHaveLength(0)
    await s.tick(Date.UTC(2026, 11, 25, 6, 0))           // Cümə, Bakı 10:00
    await s.tick(Date.UTC(2026, 11, 25, 7, 0))
    const baku = got.filter((m) => m.to === 'baku@example.com')
    expect(baku).toHaveLength(1)
    expect(baku[0].kind).toBe('friday')
    expect(baku[0].text).toContain('Zeynəb, Musa')
    expect(baku[0].text).not.toContain('Həsən')                 // "ayda bir" sətri Cüməyə düşmür
    store.setLovedEmail(ids.ny, false)
    await s.tick(Date.UTC(2026, 11, 25, 15, 0))          // NY Cümə 10:00 — izləyən, amma e-poçt sönülü
    expect(got.filter((m) => m.to === 'ny@example.com')).toHaveLength(0)
  })

  it('zəkat: 7 gün əvvəl və həmin gün, sonra növbəti hicri ilə keçir', async () => {
    const got = []
    const s = personal.createScheduler({ store, mailer: createMailer({ apiKey: '', onMessage: (m) => got.push(m) }), log: { error() {} } })
    const due = personal.hawlDue('2026-01-20', '2026-11-17')
    db.raw.prepare('INSERT INTO personal_zakat (user_id, hawl_start, due_on, amount, currency, created_at, updated_at) VALUES (?, ?, ?, 250, ?, 1, 1)').run(ids.baku, '2026-01-20', due, 'AZN')
    const at = (key, h) => Date.parse(key + 'T00:00:00Z') + h * 3600e3
    const pre = new Date(Date.parse(due + 'T00:00:00Z') - 7 * 864e5).toISOString().slice(0, 10)
    await s.tick(at(pre, 3))
    await s.tick(at(pre, 4))
    await s.tick(at(pre, 12))
    expect(got.map((m) => m.kind)).toEqual(['zakatSoon'])
    expect(got[0].text).toContain('250 AZN')
    await s.tick(at(due, 6))
    await s.tick(at(due, 7))
    expect(got.map((m) => m.kind)).toEqual(['zakatSoon', 'zakatDue'])
    await s.tick(at(due, 40))
    const row = db.raw.prepare('SELECT * FROM personal_zakat WHERE user_id = ?').get(ids.baku)
    expect(row.hawl_start).toBe(due)
    expect(row.due_on).toBe(personal.hawlDue(due, new Date(Date.parse(due) + 864e5).toISOString().slice(0, 10)))
    expect(row.due_on > due).toBe(true)
  })
})

describe('e-poçt şablonları: 5 dil', () => {
  const vars = { url: 'https://muslims.cc/x', name: 'Ali <script>', n: 2, names: 'A, B', date: '1 Jan', amount: '10 USD', body: 'Mətn <b>', unsubUrl: 'https://muslims.cc/api/personal/unsubscribe?t=1.loved.abc' }
  for (const kind of ['letter', 'lovedRemind', 'friday', 'zakatSoon', 'zakatDue']) {
    it(kind, () => {
      const seen = new Set()
      for (const lang of ['az', 'en', 'ru', 'tr', 'ar']) {
        const r = render(kind, lang, vars)
        expect(r.subject).toBeTruthy()
        expect(r.html).not.toContain('<script>')
        expect(r.html).not.toMatch(/\{(name|n|names|date|amount)\}/)
        expect(r.text).not.toMatch(/\{(name|n|names|date|amount)\}/)
        if (kind === 'letter') expect(r.html).toContain('Mətn &lt;b&gt;')
        if (kind !== 'letter') expect(r.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
        if (lang === 'ar') expect(r.html).toContain('dir="rtl"')
        seen.add(r.subject)
      }
      expect(seen.size).toBe(5)
      expect(render(kind, 'id', vars).subject).toBe(render(kind, 'en', vars).subject)   // qalan dillər → en
    })
  }
})
