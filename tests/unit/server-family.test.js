// Server: ailə dairəsi (server/family.js) — giriş + CSRF, dəvət tokeni (yalnız SHA-256, birdəfəlik, 7 gün),
// bir hesab — bir dairə, həddlər, paylaşmada razılıq və sahə ağ siyahısı, şablon kartlar (sərbəst mətn yox),
// sahib üzvü çıxarır / üzv çıxır / sahib dairəni silir, hesab silinəndə CASCADE.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const users = require('../../server/users.js')
const family = require('../../server/family.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
let clock = Date.UTC(2026, 10, 17, 8, 0)

describe('family HTTP', () => {
  let srv, db
  beforeAll(async () => {
    db = openDb(':memory:')
    const store = users.createUsersStore(db)
    const app = express()
    const ur = users.createUsersRouter({
      db, store, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null,
      mailer: createMailer({ apiKey: '', onMessage: () => {} }),
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
    })
    app.use('/api', ur)
    app.use('/api', family.createFamilyRouter({ db, requireUser: ur.requireUser, now: () => clock }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const get = (path, cookie) => call(path, { method: 'GET', cookie, headers: {} }).then((r) => r.json())
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  let n = 0
  const signup = async (displayName = '') => {
    const r = await call('/api/auth/register', { body: { email: `fam${++n}@example.com`, password: PASS, displayName, lang: 'az' } })
    const j = await r.json()
    return { cookie: cookieOf(r), id: j.user.id }
  }

  it('giriş tələb olunur (401); CSRF — 403', async () => {
    expect((await call('/api/family', { method: 'GET', headers: {} })).status).toBe(401)
    const { cookie } = await signup()
    expect((await call('/api/family', { cookie, headers: {} })).status).toBe(403)
    expect((await call('/api/family', { cookie, headers: { ...H, origin: 'https://evil.example' } })).status).toBe(403)
    const r = await call('/api/family', { method: 'GET', cookie, headers: {} })
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(await r.json()).toMatchObject({ circle: null, cards: [], share: null, consent: false })
  })

  it('dəvət: token yalnız həş, birdəfəlik, 7 gün; bir hesab — bir dairə; həddlər', async () => {
    const mom = await signup('Ana'), son = await signup('Əli'), other = await signup('Başqa')
    expect((await call('/api/family/invites', { cookie: mom.cookie })).status).toBe(403)   // dairə yoxdur
    expect((await call('/api/family', { cookie: mom.cookie })).status).toBe(201)
    expect((await call('/api/family', { cookie: mom.cookie })).status).toBe(409)
    const inv = await (await call('/api/family/invites', { cookie: mom.cookie })).json()
    expect(inv.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const rows = db.raw.prepare('SELECT token_hash FROM family_invites').all()
    expect(JSON.stringify(rows)).not.toContain(inv.token)
    expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/)

    const pv = await (await call('/api/family/join/preview', { cookie: son.cookie, body: { token: inv.token } })).json()
    expect(pv).toMatchObject({ ownerLabel: 'Ana', members: 1, inCircle: false })
    expect((await call('/api/family/join', { cookie: son.cookie, body: { token: 'x'.repeat(43) } })).status).toBe(404)
    const j = await (await call('/api/family/join', { cookie: son.cookie, body: { token: inv.token } })).json()
    expect(j.circle.members.map((m) => m.label)).toEqual(['Ana', 'Əli'])
    expect(j.circle.invites).toEqual([])   // üzv dəvətləri görmür
    // birdəfəlik
    expect((await call('/api/family/join', { cookie: other.cookie, body: { token: inv.token } })).status).toBe(404)
    // son başqa dairə yarada bilməz
    expect((await call('/api/family', { cookie: son.cookie })).status).toBe(409)
    expect((await call('/api/family/invites', { cookie: son.cookie })).status).toBe(403)

    // köhnəlmiş dəvət
    const old = await (await call('/api/family/invites', { cookie: mom.cookie })).json()
    clock += family.INVITE_TTL_MS + 1
    expect((await call('/api/family/join', { cookie: other.cookie, body: { token: old.token } })).status).toBe(404)
    // açıq dəvət həddi
    for (let i = 0; i < family.MAX_INVITES; i++) expect((await call('/api/family/invites', { cookie: mom.cookie })).status).toBe(201)
    expect((await call('/api/family/invites', { cookie: mom.cookie })).status).toBe(409)
    const list = (await get('/api/family', mom.cookie)).circle.invites
    expect(list).toHaveLength(family.MAX_INVITES)
    expect((await call(`/api/family/invites/${list[0].id}`, { method: 'DELETE', cookie: mom.cookie })).status).toBe(200)
    expect((await call(`/api/family/invites/${list[1].id}`, { method: 'DELETE', cookie: son.cookie })).status).toBe(403)
  })

  it('paylaşma: razılıq tələb olunur; yalnız ağ siyahıdakı sahələr və tam ədədlər; dayandırmaq silir', async () => {
    const a = await signup('Ata'), b = await signup('Zəhra')
    await call('/api/family', { cookie: a.cookie })
    const { token } = await (await call('/api/family/invites', { cookie: a.cookie })).json()
    await call('/api/family/join', { cookie: b.cookie, body: { token } })
    const share = { fields: ['quranDaysWeek', 'storybooksRead'], stats: { quranDaysWeek: 42, storybooksRead: 3, prayerStarsWeek: 99 } }
    const r1 = await call('/api/family/share', { method: 'PUT', cookie: b.cookie, body: share })
    expect((await r1.json()).code).toBe('consent_required')
    const r2 = await call('/api/family/share', { method: 'PUT', cookie: b.cookie, body: { ...share, consent: true } })
    expect(r2.status).toBe(200)
    // seçilməmiş sahə (prayerStarsWeek) saxlanmır
    expect((await r2.json()).share.stats).toEqual({ quranDaysWeek: 42, storybooksRead: 3 })
    const bad = (body) => call('/api/family/share', { method: 'PUT', cookie: b.cookie, body }).then((r) => r.status)
    expect(await bad({ fields: ['secretDiary'], stats: { secretDiary: 1 } })).toBe(400)
    expect(await bad({ fields: ['quranDaysWeek'], stats: { quranDaysWeek: 1.5 } })).toBe(400)
    expect(await bad({ fields: ['quranDaysWeek'], stats: { quranDaysWeek: -1 } })).toBe(400)
    expect(await bad({ fields: ['quranDaysWeek'], stats: { quranDaysWeek: '5' } })).toBe(400)
    expect(await bad({ fields: 'all' })).toBe(400)
    // ikinci dəfə razılıq lazım deyil
    expect(await bad({ fields: ['hifzAyahs'], stats: { hifzAyahs: 12 } })).toBe(200)
    const board = (await get('/api/family', a.cookie)).circle.members.find((m) => m.id === b.id)
    expect(board.share.stats).toEqual({ hifzAyahs: 12 })
    expect((await call('/api/family/share', { method: 'DELETE', cookie: b.cookie })).status).toBe(200)
    expect((await get('/api/family', a.cookie)).circle.members.find((m) => m.id === b.id).share).toBe(null)
  })

  it('kartlar: yalnız şablon, yalnız öz dairəsinə, gündəlik hədd; görüldü / silindi', async () => {
    const p = await signup('Ana'), kid = await signup('Ali'), stranger = await signup('Yad')
    await call('/api/family', { cookie: p.cookie })
    const { token } = await (await call('/api/family/invites', { cookie: p.cookie })).json()
    await call('/api/family/join', { cookie: kid.cookie, body: { token } })
    await call('/api/family', { cookie: stranger.cookie })
    const send = (cookie, body) => call('/api/family/cards', { cookie, body })
    expect((await send(p.cookie, { to: kid.id, template: 'free', text: 'salam' })).status).toBe(400)
    expect((await send(p.cookie, { to: stranger.id, template: 'mashallah' })).status).toBe(404)
    expect((await send(stranger.cookie, { to: kid.id, template: 'mashallah' })).status).toBe(404)
    expect((await send(p.cookie, { to: p.id, template: 'mashallah' })).status).toBe(404)
    expect((await send(p.cookie, { to: kid.id, template: 'letters', n: 0 })).status).toBe(400)
    const c = await send(p.cookie, { to: kid.id, template: 'letters', n: 3, text: 'ignored' })
    expect(c.status).toBe(201)
    const cards = (await get('/api/family', kid.cookie)).cards
    expect(cards).toEqual([expect.objectContaining({ from: 'Ana', template: 'letters', n: 3, seen: false })])
    expect(JSON.stringify(cards)).not.toContain('ignored')
    expect((await call('/api/family/cards/seen', { cookie: kid.cookie, body: { ids: [cards[0].id] } })).status).toBe(200)
    expect((await get('/api/family', kid.cookie)).cards[0].seen).toBe(true)
    // başqası silə bilmir
    expect((await call(`/api/family/cards/${cards[0].id}`, { method: 'DELETE', cookie: p.cookie })).status).toBe(404)
    expect((await call(`/api/family/cards/${cards[0].id}`, { method: 'DELETE', cookie: kid.cookie })).status).toBe(200)
    for (let i = 0; i < family.MAX_CARDS_PER_DAY; i++) await send(p.cookie, { to: kid.id, template: 'proud' })   // biri silindi — hədd cədvəldəki saya görədir
    expect((await send(p.cookie, { to: kid.id, template: 'proud' })).status).toBe(429)
  })

  it('üzvü çıxarmaq, çıxmaq, dairəni silmək; hesab silinəndə CASCADE', async () => {
    const o = await signup('Sahib'), m1 = await signup('Bir'), m2 = await signup('İki')
    await call('/api/family', { cookie: o.cookie })
    for (const m of [m1, m2]) {
      const { token } = await (await call('/api/family/invites', { cookie: o.cookie })).json()
      await call('/api/family/join', { cookie: m.cookie, body: { token } })
    }
    await call('/api/family/cards', { cookie: o.cookie, body: { to: m1.id, template: 'dua' } })
    expect((await call(`/api/family/members/${m2.id}`, { method: 'DELETE', cookie: m1.cookie })).status).toBe(403)
    expect((await call(`/api/family/members/${m1.id}`, { method: 'DELETE', cookie: o.cookie })).status).toBe(200)
    expect((await get('/api/family', m1.cookie)).circle).toBe(null)
    expect((await get('/api/family', m1.cookie)).cards).toEqual([])   // köhnə dairənin kartları silinir
    expect((await call('/api/family', { method: 'DELETE', cookie: m2.cookie })).status).toBe(200)   // üzv çıxır
    expect((await get('/api/family', o.cookie)).circle.members).toHaveLength(1)

    // hesab silinəndə — sahibin dairəsi bütövlükdə silinir
    const { token } = await (await call('/api/family/invites', { cookie: o.cookie })).json()
    await call('/api/family/join', { cookie: m2.cookie, body: { token } })
    await call('/api/family/share', { method: 'PUT', cookie: m2.cookie, body: { consent: true, fields: ['dhikrWeek'], stats: { dhikrWeek: 5 } } })
    expect((await call('/api/auth/delete', { cookie: o.cookie, body: { password: PASS } })).status).toBe(200)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM family_circles WHERE owner_id = ?').get(o.id).n).toBe(0)
    expect((await get('/api/family', m2.cookie)).circle).toBe(null)
    expect((await call('/api/auth/delete', { cookie: m2.cookie, body: { password: PASS } })).status).toBe(200)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM family_shares WHERE user_id = ?').get(m2.id).n).toBe(0)
  })

  it('validShare saf funksiyası', () => {
    expect(family.validShare({ fields: ['quranDaysWeek', 'quranDaysWeek'], stats: { quranDaysWeek: 1 } })).toEqual({ fields: ['quranDaysWeek'], stats: { quranDaysWeek: 1 } })
    expect(family.validShare({ fields: ['__proto__'], stats: {} })).toBe(null)
    expect(family.validShare({ fields: [], stats: {} })).toEqual({ fields: [], stats: {} })
  })
})
