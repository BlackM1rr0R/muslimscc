// Server: K mərhələsi — açıq profil (publicProfile.js), ailə dua siyahısı (familyDua.js), dua divarı + moderasiya
// (duaWall.js), məscid nümayəndəsi + məscid ekranı (mosqueRep.js), həftəlik hesabat (weekly.js), ortaq süzgəclər
// (communityKit.js). Rollar: moderasiya yalnız admin PANELİ sessiyası (editor+); nümayəndə yalnız öz məscidi.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const family = require('../../server/family.js')
const kit = require('../../server/communityKit.js')
const profile = require('../../server/publicProfile.js')
const familyDua = require('../../server/familyDua.js')
const duaWall = require('../../server/duaWall.js')
const mosqueRep = require('../../server/mosqueRep.js')
const weekly = require('../../server/weekly.js')
const security = require('../../server/security.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ADMIN_PASS = 'admin-şifrəsi-çox-uzun-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const DAY = 86400000
// 2026-11-18 çərşənbə, 08:00 UTC (Bakı 12:00)
let clock = Date.UTC(2026, 10, 18, 8, 0)

describe('communityKit: süzgəclər', () => {
  it('keçid, e-poçt, telefon tanınır; adi mətn və ayə istinadı yox', () => {
    for (const s of ['visit example.com', 'http://x.y', 'www.site', 't.me/abc', 'a@b.co', 'example dot com', 'spam [.] ru']) expect(kit.hasLink(s), s).toBe(true)
    for (const s of ['Allahım, anama şəfa ver', 'help me. In sha Allah', 'Surah 2:255', 'e.g. sabr']) expect(kit.hasLink(s), s).toBe(false)
    expect(kit.hasPhone('call +994 50 123 45 67')).toBe(true)
    expect(kit.hasPhone('Bəqərə 2:255, 2026')).toBe(false)
    expect(kit.stripLinks('salam example.com dua')).toBe('salam dua')
    expect(kit.stripLinks('line1\nsee www.x.az\nline3')).toBe('line1\nsee\nline3')
  })
  it('qadağan söz: söz üzrə (alt sətir yox), ifadə', () => {
    expect(kit.bannedHit('Win at CASINO', ['casino'])).toBe(true)
    expect(kit.bannedHit('casinos', ['casino'])).toBe(false)
    expect(kit.bannedHit('free  bet!', ['free bet'])).toBe(true)
  })
  it('cleanLine/cleanText: idarə və bidi simvolları atılır, hədd', () => {
    expect(kit.cleanLine('a‮b\u0007 c ', 10)).toBe('ab c')
    expect(kit.cleanLine('x'.repeat(11), 10)).toBe(null)
    expect(kit.cleanText('a\r\n\n\n\n\nb', 20)).toBe('a\n\n\nb')
  })
})

describe('K mərhələsi HTTP', () => {
  let srv, db, store, authStore, sec
  const mail = []
  const admins = {}
  beforeAll(async () => {
    db = openDb(':memory:')
    authStore = auth.createAuthStore(db)
    store = users.createUsersStore(db)
    admins.editor = await authStore.createAdmin('editor@muslims.cc', ADMIN_PASS)
    store.setAdminRole('editor@muslims.cc', 'editor')
    const allowedOrigins = [ORIGIN]
    const requireAdmin = auth.createRequireAdmin({ store: authStore, allowedOrigins })
    const app = express()
    app.set('trust proxy', 1)
    const mailer = createMailer({ apiKey: '', onMessage: (m) => mail.push(m) })
    const ur = users.createUsersRouter({
      db, store, requireAdmin, allowedOrigins, publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null, mailer,
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
    })
    app.use('/api', ur)
    const fam = family.createFamilyRouter({ db, requireUser: ur.requireUser, now: () => clock })
    app.use('/api', fam)
    const requireEditor = kit.createRequireEditor({ requireAdmin, adminRoleOf: store.adminRole })
    const optionalUser = kit.createOptionalUser({ usersStore: store, cookieName: users.USER_COOKIE })
    const pp = profile.createPublicProfileRouter({ db, requireUser: ur.requireUser, requireEditor, now: () => clock })
    const fd = familyDua.createFamilyDuaRouter({ db, requireUser: ur.requireUser, now: () => clock })
    const dw = duaWall.createDuaWallRouter({ db, requireUser: ur.requireUser, requireEditor, optionalUser, allowedOrigins, now: () => clock, anonPrayPerHour: 5 })
    const mr = mosqueRep.createMosqueRepRouter({ db, requireUser: ur.requireUser, requireEditor, now: () => clock })
    const wk = weekly.createWeeklyRouter({ db, requireUser: ur.requireUser, mailer, secret: 'test-secret', publicOrigin: ORIGIN, now: () => clock })
    for (const r of [pp, fd, dw, mr, wk]) app.use('/api', r)
    sec = security.createSecurity({ db, totpKey: '', publicOrigin: ORIGIN, mailer })
    app.use('/api', security.createSecurityRouter({
      security: sec, usersStore: store, requireUser: ur.requireUser, mailer, publicOrigin: ORIGIN,
      sources: { publicProfile: pp, familyDuas: fd, duaWall: dw, mosqueRep: mr, weekly: wk },
    }))
    app.locals.routers = { pp, fd, dw, mr, wk }
    srv = await listen(app)
    srv.routers = app.locals.routers
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const get = (path, cookie, headers = {}) => call(path, { method: 'GET', cookie, headers })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  let n = 0
  const signup = async (displayName = '') => {
    const email = `k${++n}@example.com`
    const r = await call('/api/auth/register', { body: { email, password: PASS, displayName, lang: 'az' } })
    const j = await r.json()
    return { cookie: cookieOf(r), id: j.user.id, email }
  }
  const adminCookie = () => `${auth.COOKIE_NAME}=${authStore.createSession(admins.editor)}`
  const del = (cookie) => call('/api/auth/delete', { cookie, body: { password: PASS } })

  // ── K1 ──
  describe('açıq profil', () => {
    it('susmaya görə yoxdur; razılıqsız 400; ləqəb qaydaları, ehtiyat sözlər, unikal', async () => {
      const a = await signup('Əli'), b = await signup('Vəli')
      expect(await (await get('/api/profile/public', a.cookie)).json()).toMatchObject({ profile: null })
      const body = { handle: 'ali_k', enabled: true, fields: ['displayName', 'bio'], data: { displayName: 'Əli', bio: 'Salam' } }
      expect((await (await call('/api/profile/public', { method: 'PUT', cookie: a.cookie, body })).json()).code).toBe('consent_required')
      for (const [h, code] of [['ab', 'bad_handle'], ['Ali!', 'bad_handle'], ['admin', 'reserved'], ['_ali', 'reserved'], ['12345', 'reserved'], ['x'.repeat(25), 'bad_handle']]) {
        const r = await call('/api/profile/public', { method: 'PUT', cookie: a.cookie, body: { ...body, handle: h, consent: true } })
        expect([r.status, (await r.json()).code], h).toEqual([400, code])
      }
      const ok = await call('/api/profile/public', { method: 'PUT', cookie: a.cookie, body: { ...body, handle: 'Ali_K', consent: true } })
      expect(ok.status).toBe(200)
      expect((await ok.json()).profile).toMatchObject({ handle: 'ali_k', enabled: true, allowIndex: false })
      const taken = await call('/api/profile/public', { method: 'PUT', cookie: b.cookie, body: { ...body, handle: 'ali_k', consent: true } })
      expect([taken.status, (await taken.json()).code]).toEqual([409, 'handle_taken'])
      expect(await (await get('/api/profile/handle?h=ali_k', b.cookie)).json()).toEqual({ available: false, reason: 'taken' })
      expect(await (await get('/api/profile/handle?h=ali_k', a.cookie)).json()).toMatchObject({ available: true })
      expect((await get('/api/profile/handle?h=admin', a.cookie).then((r) => r.json())).reason).toBe('reserved')
    })

    it('yalnız seçilmiş sahələr; keçidlər silinir; hədlər; gizli → 404; noindex başlığı', async () => {
      const a = await signup()
      const put = (b2) => call('/api/profile/public', { method: 'PUT', cookie: a.cookie, body: { consent: true, handle: 'hasan', enabled: true, ...b2 } })
      expect((await put({ fields: ['bio'], data: { bio: 'x'.repeat(161) } })).status).toBe(400)
      expect((await put({ fields: ['favSurah'], data: { favSurah: 115 } })).status).toBe(400)
      expect((await put({ fields: ['stamps'], data: { stamps: ['khatm', 'nope'] } })).status).toBe(400)
      expect((await put({ fields: ['secret'], data: {} })).status).toBe(400)
      const r = await put({
        fields: ['bio', 'khatms', 'stamps', 'favSurah'],
        data: { bio: 'Quran tələbəsi — bax example.com', khatms: 3, stamps: ['kahf_4', 'khatm'], favSurah: 18, displayName: 'gizli qalmalı' },
      })
      const p = (await r.json()).profile
      expect(p.data).toEqual({ bio: 'Quran tələbəsi — bax', khatms: 3, stamps: ['khatm', 'kahf_4'], favSurah: 18 })
      const pub = await get('/api/u/hasan')
      expect(pub.status).toBe(200)
      expect(pub.headers.get('x-robots-tag')).toBe('noindex')
      const pj = await pub.json()
      expect(pj).toEqual({ handle: 'hasan', fields: ['bio', 'khatms', 'stamps', 'favSurah'], data: p.data, allowIndex: false })
      expect(JSON.stringify(pj)).not.toMatch(/example\.com|@|userId|email/)
      // axtarış sistemlərinə icazə
      await put({ fields: ['khatms'], data: { khatms: 1 }, allowIndex: true })
      const idx = await get('/api/u/hasan')
      expect(idx.headers.get('x-robots-tag')).toBe(null)
      expect((await idx.json()).allowIndex).toBe(true)
      // bağlanır → 404 (naməlum ilə eyni)
      await put({ enabled: false, fields: ['khatms'], data: { khatms: 1 } })
      expect((await get('/api/u/hasan')).status).toBe(404)
      expect((await get('/api/u/yoxdur_bele')).status).toBe(404)
      expect((await get('/api/u/BAD!')).status).toBe(404)
      // silmə ləqəbi boşaldır
      expect((await call('/api/profile/public', { method: 'DELETE', cookie: a.cookie })).status).toBe(200)
      const c = await signup()
      expect((await call('/api/profile/public', { method: 'PUT', cookie: c.cookie, body: { consent: true, handle: 'hasan', enabled: true, fields: [], data: {} } })).status).toBe(200)
    })

    it('şikayət → moderasiya (yalnız panel editor+); gizlət → mətn silinir, profil bağlanır', async () => {
      const owner = await signup(), rep = await signup()
      await call('/api/profile/public', { method: 'PUT', cookie: owner.cookie, body: { consent: true, handle: 'reported_one', enabled: true, fields: ['bio', 'khatms'], data: { bio: 'pis söz', khatms: 2 } } })
      expect((await call('/api/u/reported_one/report', { body: { reason: 'spam' }, headers: H })).status).toBe(401)
      expect((await call('/api/u/reported_one/report', { cookie: owner.cookie, body: { reason: 'spam' } })).status).toBe(400)
      expect((await call('/api/u/reported_one/report', { cookie: rep.cookie, body: { reason: 'bilmirəm' } })).status).toBe(400)
      expect((await call('/api/u/reported_one/report', { cookie: rep.cookie, body: { reason: 'offensive' } })).status).toBe(202)
      // saytın istifadəçisi (hətta rolu editor olsa) admin API-sinə girə bilmir
      store.setUserRole(rep.id, 'editor', null, { kind: 'script', id: null }, clock)
      expect((await get('/api/admin/moderation/profiles', rep.cookie)).status).toBe(401)
      const ac = adminCookie()
      const q = await (await get('/api/admin/moderation/profiles', ac)).json()
      const item = q.items.find((i) => i.handle === 'reported_one')
      expect(item).toMatchObject({ count: 1, reports: [{ reason: 'offensive' }] })
      expect(JSON.stringify(q)).not.toMatch(/@example\.com|user_id|reporter/)
      expect((await call('/api/admin/moderation/profiles/reported_one', { cookie: ac, body: { action: 'hide' }, headers: {} })).status).toBe(403)   // CSRF
      expect((await call('/api/admin/moderation/profiles/reported_one', { cookie: ac, body: { action: 'hide' } })).status).toBe(200)
      expect((await get('/api/u/reported_one')).status).toBe(404)
      const mine = (await (await get('/api/profile/public', owner.cookie)).json()).profile
      expect(mine).toMatchObject({ enabled: false, fields: ['khatms'], data: { khatms: 2 } })
      expect(mine.moderatedAt).toBe(clock)
    })
  })

  // ── K2 ──
  describe('ailə dua siyahısı', () => {
    let mom, son, kid, outsider
    beforeAll(async () => {
      mom = await signup('Ana'); son = await signup('Oğul'); kid = await signup('Qız'); outsider = await signup('Yad')
      await call('/api/family', { cookie: mom.cookie })
      for (const m of [son, kid]) {
        const inv = await (await call('/api/family/invites', { cookie: mom.cookie })).json()
        await call('/api/family/join', { cookie: m.cookie, body: { token: inv.token } })
      }
    })

    it('yalnız dairə üzvləri; ≤300; dua etdim — say, bir dəfə, özünə yox; cavablandı — yalnız müəllif', async () => {
      expect((await get('/api/family/duas', outsider.cookie)).status).toBe(404)
      expect((await call('/api/family/duas', { cookie: son.cookie, body: { body: 'x'.repeat(301) } })).status).toBe(400)
      const r = await call('/api/family/duas', { cookie: son.cookie, body: { body: 'İmtahanım üçün dua edin' } })
      expect(r.status).toBe(201)
      const { dua } = await r.json()
      expect((await call(`/api/family/duas/${dua.id}/pray`, { cookie: son.cookie })).status).toBe(400)
      expect(await (await call(`/api/family/duas/${dua.id}/pray`, { cookie: mom.cookie })).json()).toEqual({ prayed: 1, prayedByMe: true })
      expect((await (await call(`/api/family/duas/${dua.id}/pray`, { cookie: mom.cookie })).json()).prayed).toBe(1)
      expect((await (await call(`/api/family/duas/${dua.id}/pray`, { cookie: kid.cookie })).json()).prayed).toBe(2)
      expect((await call(`/api/family/duas/${dua.id}/pray`, { cookie: outsider.cookie })).status).toBe(404)
      const list = await (await get('/api/family/duas', kid.cookie)).json()
      expect(list.duas[0]).toMatchObject({ body: 'İmtahanım üçün dua edin', author: 'Oğul', prayed: 2, prayedByMe: true, self: false })
      expect(list.duas[0].reports).toBeUndefined()   // yalnız sahib görür
      expect((await call(`/api/family/duas/${dua.id}/answered`, { cookie: kid.cookie, body: { answered: true } })).status).toBe(403)
      expect((await call(`/api/family/duas/${dua.id}/answered`, { cookie: son.cookie, body: { answered: true } })).status).toBe(200)
      expect((await (await get('/api/family/duas', mom.cookie)).json()).duas[0].answered).toBe(true)
    })

    it('şikayət sahibə görünür; sahib silir; üzv başqasınınkını silə bilməz; çıxanın istəkləri gedir', async () => {
      const { dua } = await (await call('/api/family/duas', { cookie: kid.cookie, body: { body: 'uyğunsuz mətn' } })).json()
      expect((await call(`/api/family/duas/${dua.id}/report`, { cookie: son.cookie })).status).toBe(200)
      const ownerView = await (await get('/api/family/duas', mom.cookie)).json()
      expect(ownerView.owner).toBe(true)
      expect(ownerView.duas.find((d) => d.id === dua.id).reports).toBe(1)
      expect((await call(`/api/family/duas/${dua.id}`, { method: 'DELETE', cookie: son.cookie })).status).toBe(403)
      expect((await call(`/api/family/duas/${dua.id}`, { method: 'DELETE', cookie: mom.cookie })).status).toBe(200)
      await call('/api/family/duas', { cookie: kid.cookie, body: { body: 'gedəndən əvvəl' } })
      await call('/api/family', { method: 'DELETE', cookie: kid.cookie })   // dairədən çıxır
      expect((await (await get('/api/family/duas', mom.cookie)).json()).duas.some((d) => d.body === 'gedəndən əvvəl')).toBe(false)
      expect(srv.routers.fd.purge()).toBeGreaterThan(0)
    })

    it('gündə 10 istək həddi', async () => {
      const m = await signup()
      await call('/api/family', { cookie: m.cookie })
      for (let i = 0; i < 10; i++) expect((await call('/api/family/duas', { cookie: m.cookie, body: { body: `dua ${i}` } })).status).toBe(201)
      expect((await call('/api/family/duas', { cookie: m.cookie, body: { body: 'bir də' } })).status).toBe(429)
    })
  })

  // ── K3 ──
  describe('dua divarı', () => {
    it('süzgəclər: keçid, telefon, qadağan söz, uzunluq, ad; gündə 3', async () => {
      const u = await signup()
      const post = (b) => call('/api/dua-wall', { cookie: u.cookie, body: { lang: 'az', ...b } })
      expect((await (await post({ body: 'qısa' })).json()).code).toBe('too_short')
      expect((await post({ body: 'x'.repeat(301) })).status).toBe(400)
      expect((await (await post({ body: 'Dua edin, saytım example.com' })).json()).code).toBe('links_not_allowed')
      expect((await (await post({ body: 'Mənə zəng edin +994 50 123 45 67' })).json()).code).toBe('personal_info')
      expect((await (await post({ body: 'Casino ilə qazanmaq üçün dua' })).json()).code).toBe('not_allowed')
      expect((await (await post({ body: 'Anam üçün şəfa duası edin', name: 'Ali123' })).json()).code).toBe('bad_name')
      expect((await post({ body: 'Anam üçün şəfa duası edin', lang: 'AZE!' })).status).toBe(400)
      expect((await call('/api/dua-wall', { body: { body: 'Anam üçün şəfa duası edin', lang: 'az' } })).status).toBe(401)
      for (let i = 0; i < 3; i++) {
        const r = await post({ body: `Anam üçün şəfa duası edin ${i}`, name: i ? '' : 'Aynur' })
        expect(r.status).toBe(201)
        expect((await r.json()).item).toMatchObject({ status: 'pending' })
      }
      expect((await (await post({ body: 'Dördüncü dua istəyim budur' })).json()).code).toBe('daily_limit')
      // gözləyən divarda görünmür
      expect((await (await get('/api/dua-wall')).json()).items.some((i) => i.body.startsWith('Anam üçün şəfa duası edin'))).toBe(false)
    })

    it('moderasiya: yalnız panel; təsdiq → görünür (ad yalnız seçilibsə), rədd səbəbi istifadəçiyə; dua etdim — bir dəfə; şikayət → növbə; 30 gün', async () => {
      const u = await signup('Gizli Ad'), other = await signup()
      const { item } = await (await call('/api/dua-wall', { cookie: u.cookie, body: { body: 'Atam üçün dua edin, xəstədir', name: 'Kamil', lang: 'az' } })).json()
      const { item: bad } = await (await call('/api/dua-wall', { cookie: u.cookie, body: { body: 'Bu dua deyil, sadəcə mətn', lang: 'az' } })).json()
      expect((await get('/api/admin/dua-wall', u.cookie)).status).toBe(401)
      const ac = adminCookie()
      const q = await (await get('/api/admin/dua-wall?status=pending', ac)).json()
      expect(q.items.some((i) => i.id === item.id)).toBe(true)
      expect(JSON.stringify(q)).not.toMatch(/Gizli Ad|@example\.com|user_id/)
      expect((await call(`/api/admin/dua-wall/${bad.id}`, { cookie: ac, body: { action: 'reject', reason: 'bilinməyən' } })).status).toBe(400)
      expect((await call(`/api/admin/dua-wall/${bad.id}`, { cookie: ac, body: { action: 'reject', reason: 'not_dua' } })).status).toBe(200)
      expect((await call(`/api/admin/dua-wall/${item.id}`, { cookie: ac, body: { action: 'approve' } })).status).toBe(200)
      const wall = await (await get('/api/dua-wall?lang=az')).json()
      const shown = wall.items.find((i) => i.id === item.id)
      expect(shown).toEqual({ id: item.id, body: 'Atam üçün dua edin, xəstədir', name: 'Kamil', lang: 'az', prayed: 0, at: clock })
      expect(JSON.stringify(wall)).not.toMatch(/Gizli Ad|@/)
      const mine = await (await get('/api/dua-wall/mine', u.cookie)).json()
      expect(mine.items.find((i) => i.id === bad.id)).toMatchObject({ status: 'rejected', reason: 'not_dua' })

      // Dua etdim: girişli — bir dəfə; girişsiz — yaddaşda bir dəfə; CSRF
      expect((await call(`/api/dua-wall/${item.id}/pray`, { headers: {} })).status).toBe(403)
      expect(await (await call(`/api/dua-wall/${item.id}/pray`, { cookie: other.cookie })).json()).toEqual({ prayed: 1, already: false })
      expect(await (await call(`/api/dua-wall/${item.id}/pray`, { cookie: other.cookie })).json()).toEqual({ prayed: 1, already: true })
      expect(await (await call(`/api/dua-wall/${item.id}/pray`)).json()).toEqual({ prayed: 2, already: false })
      expect(await (await call(`/api/dua-wall/${item.id}/pray`)).json()).toEqual({ prayed: 2, already: true })
      // girişsiz IP limiti (testdə saatda 5)
      for (let i = 0; i < 3; i++) await call(`/api/dua-wall/${item.id}/pray`)
      expect((await call(`/api/dua-wall/${item.id}/pray`)).status).toBe(429)
      expect(JSON.stringify(db.raw.prepare('SELECT * FROM dua_wall_prayers').all())).not.toMatch(/127\.0\.0\.1/)

      // Şikayət: öz istəyinə yox; ilk şikayət → növbə; yenidən təsdiq → 3 şikayət lazımdır
      expect((await call(`/api/dua-wall/${item.id}/report`, { cookie: u.cookie, body: { reason: 'spam' } })).status).toBe(400)
      expect((await call(`/api/dua-wall/${item.id}/report`, { cookie: other.cookie, body: { reason: 'spam' } })).status).toBe(202)
      expect((await (await get('/api/dua-wall')).json()).items.some((i) => i.id === item.id)).toBe(false)
      const q2 = await (await get('/api/admin/dua-wall?status=pending', ac)).json()
      expect(q2.items[0]).toMatchObject({ id: item.id, reported: 1, reports: [{ reason: 'spam' }] })
      await call(`/api/admin/dua-wall/${item.id}`, { cookie: ac, body: { action: 'approve' } })
      const r2 = await signup(), r3 = await signup()
      await call(`/api/dua-wall/${item.id}/report`, { cookie: r2.cookie, body: { reason: 'spam' } })
      expect((await (await get('/api/dua-wall')).json()).items.some((i) => i.id === item.id)).toBe(true)   // 1 < 3
      await call(`/api/dua-wall/${item.id}/report`, { cookie: r3.cookie, body: { reason: 'other' } })
      const r4 = await signup()
      await call(`/api/dua-wall/${item.id}/report`, { cookie: r4.cookie, body: { reason: 'other' } })
      expect((await (await get('/api/dua-wall')).json()).items.some((i) => i.id === item.id)).toBe(false)
      await call(`/api/admin/dua-wall/${item.id}`, { cookie: ac, body: { action: 'approve' } })

      // 30 gün sonra gizlənir (ilk təsdiqdən), 7 gün sonra silinir
      const t0 = clock
      clock = t0 + 30 * DAY + 1000
      expect((await (await get('/api/dua-wall')).json()).items.some((i) => i.id === item.id)).toBe(false)
      expect((await (await get('/api/dua-wall/mine', u.cookie)).json()).items.find((i) => i.id === item.id).status).toBe('expired')
      clock = t0 + 38 * DAY
      srv.routers.dw.purge()
      expect(db.raw.prepare('SELECT COUNT(*) AS n FROM dua_wall WHERE id = ?').get(item.id).n).toBe(0)
      clock = t0
    })

    it('qadağan sözlər admin paneldə idarə olunur', async () => {
      const ac = adminCookie()
      const w = await (await get('/api/admin/dua-wall/banned', ac)).json()
      expect(w.words).toEqual(expect.arrayContaining(duaWall.DEFAULT_BANNED))
      await call('/api/admin/dua-wall/banned', { cookie: ac, body: { word: 'Lotereya' } })
      const u = await signup()
      expect((await (await call('/api/dua-wall', { cookie: u.cookie, body: { body: 'lotereya udmaq üçün dua edin', lang: 'az' } })).json()).code).toBe('not_allowed')
      await call('/api/admin/dua-wall/banned/lotereya', { method: 'DELETE', cookie: ac })
      expect((await call('/api/dua-wall', { cookie: u.cookie, body: { body: 'lotereya udmaq üçün dua edin', lang: 'az' } })).status).toBe(201)
    })
  })

  // ── K4 ──
  describe('məscid nümayəndəsi', () => {
    let rep, rep2, plain
    beforeAll(async () => {
      rep = await signup('Nümayəndə'); rep2 = await signup(); plain = await signup()
      store.setUserRole(rep.id, 'mosque_rep', 'n123', { kind: 'script', id: null }, clock)
      store.setUserRole(rep2.id, 'mosque_rep', 'w999', { kind: 'script', id: null }, clock)
    })
    const info = { name: 'Təzəpir məscidi', iqama: { fajr: 20, dhuhr: '13:30', asr: 10, maghrib: 5, isha: null }, jumuah: { time: '13:00', topic: 'Səbr — bax t.me/x' }, ramadanNote: 'İftar hər gün' }

    it('rol və bağlı məscid lazımdır; yalnız öz məscidi', async () => {
      expect((await get('/api/mosque-rep', plain.cookie)).status).toBe(403)
      const ed = await signup()
      store.setUserRole(ed.id, 'editor', null, { kind: 'script', id: null }, clock)
      expect((await (await get('/api/mosque-rep', ed.cookie)).json()).code).toBe('no_mosque')
      expect((await call('/api/mosque-rep', { method: 'PUT', cookie: rep.cookie, body: { ...info, iqama: { fajr: 181 } } })).status).toBe(400)
      expect((await call('/api/mosque-rep', { method: 'PUT', cookie: rep.cookie, body: { ...info, jumuah: { time: '25:00' } } })).status).toBe(400)
      const r = await (await call('/api/mosque-rep', { method: 'PUT', cookie: rep.cookie, body: { ...info, mosqueId: 'w999' } })).json()
      expect(r.info).toMatchObject({ name: 'Təzəpir məscidi', iqama: { fajr: 20, dhuhr: '13:30', asr: 10, maghrib: 5 }, jumuah: { time: '13:00', topic: 'Səbr — bax' } })
      expect((await get('/api/mosques/w999/live')).status).toBe(404)   // gövdədəki mosqueId nəzərə alınmır
      const a = await (await call('/api/mosque-rep/announcements', { cookie: rep.cookie, body: { body: 'Cümə dərsi 18:00-da', expiresOn: '2026-11-25' } })).json()
      expect((await call(`/api/mosque-rep/announcements/${a.announcement.id}`, { method: 'DELETE', cookie: rep2.cookie })).status).toBe(404)
      expect((await call('/api/mosque-rep/announcements', { cookie: rep.cookie, body: { body: 'köhnə', expiresOn: '2026-11-01' } })).status).toBe(400)
      expect((await call('/api/mosque-rep/announcements', { cookie: rep.cookie, body: { body: 'uzaq', expiresOn: '2027-06-01' } })).status).toBe(400)
      expect((await call('/api/mosque-rep/announcements', { cookie: rep.cookie, body: { body: 'x'.repeat(501), expiresOn: '2026-11-25' } })).status).toBe(400)
    })

    it('ictimai canlı məlumat: ETag/304, versiya dəyişəndə yeni; elan bitəndə görünmür; nümayəndə yoxdursa 404', async () => {
      const r1 = await get('/api/mosques/n123/live')
      expect(r1.status).toBe(200)
      const etag = r1.headers.get('etag')
      const j = await r1.json()
      expect(j).toMatchObject({ mosqueId: 'n123', verified: true, iqama: { fajr: 20, dhuhr: '13:30' }, announcements: [{ body: 'Cümə dərsi 18:00-da' }] })
      expect(JSON.stringify(j)).not.toMatch(/@example|updated_by|author/)
      expect((await get('/api/mosques/n123/live', undefined, { 'if-none-match': etag })).status).toBe(304)
      await call('/api/mosque-rep', { method: 'PUT', cookie: rep.cookie, body: { ...info, iqama: { fajr: 25 } } })
      const r2 = await get('/api/mosques/n123/live', undefined, { 'if-none-match': etag })
      expect(r2.status).toBe(200)
      expect((await r2.json()).iqama).toEqual({ fajr: 25 })
      const v = await (await get('/api/mosques/verified?ids=n123,w999,bad!id')).json()
      expect(Object.keys(v.mosques)).toEqual(['n123'])
      const t0 = clock
      clock = Date.UTC(2026, 10, 26, 8)
      expect((await (await get('/api/mosques/n123/live')).json()).announcements).toEqual([])
      clock = t0
      // admin paneli elanı silir; nümayəndə rolu alınanda məscid "təsdiqlənməmiş" olur
      const ac = adminCookie()
      const list = await (await get('/api/admin/mosques', ac)).json()
      const m = list.items.find((x) => x.mosqueId === 'n123')
      expect(m.reps).toBe(1)
      expect((await call(`/api/admin/mosques/n123/announcements/${m.announcements[0].id}`, { method: 'DELETE', cookie: ac })).status).toBe(200)
      expect((await get('/api/admin/mosques', rep.cookie)).status).toBe(401)
      store.setUserRole(rep.id, 'user', null, { kind: 'script', id: null }, clock)
      expect((await get('/api/mosques/n123/live')).status).toBe(404)
      expect((await get('/api/mosque-rep', rep.cookie)).status).toBe(403)
    })
  })

  // ── K5 ──
  describe('həftəlik hesabat', () => {
    const verified = async () => { const u = await signup(); store.markVerified(u.id); return u }

    it('razılıq; rəqəm hədləri; yalnız qarşıdakı hesabat günü', async () => {
      const u = await verified()
      expect((await call('/api/weekly/prefs', { method: 'PUT', cookie: u.cookie, body: { enabled: true, weekday: 5, tz: 'Asia/Baku' } })).status).toBe(400)
      expect((await call('/api/weekly/prefs', { method: 'PUT', cookie: u.cookie, body: { consent: true, enabled: true, weekday: 7, tz: 'Asia/Baku' } })).status).toBe(400)
      expect((await call('/api/weekly/prefs', { method: 'PUT', cookie: u.cookie, body: { consent: true, enabled: true, weekday: 5, tz: 'Mars/Base' } })).status).toBe(400)
      const p = await (await call('/api/weekly/prefs', { method: 'PUT', cookie: u.cookie, body: { consent: true, enabled: true, weekday: 5, tz: 'Asia/Baku', lang: 'az' } })).json()
      expect(p.nextReport).toBe('2026-11-20')   // cümə
      const put = (b) => call('/api/weekly/stats', { method: 'PUT', cookie: u.cookie, body: { weekEnd: '2026-11-20', ...b } })
      expect((await put({ prayers: 36 })).status).toBe(400)
      expect((await put({ prayers: 1.5 })).status).toBe(400)
      expect((await put({})).status).toBe(400)
      expect((await call('/api/weekly/stats', { method: 'PUT', cookie: u.cookie, body: { weekEnd: '2026-11-19', prayers: 3 } })).status).toBe(400)   // cümə deyil
      expect((await call('/api/weekly/stats', { method: 'PUT', cookie: u.cookie, body: { weekEnd: '2026-11-13', prayers: 3 } })).status).toBe(400)   // keçmiş
      expect((await put({ prayers: 30, quranPages: 12, dhikr: 700, fasts: 2, wirdPct: null })).status).toBe(200)
      const off = await signup()
      expect((await call('/api/weekly/stats', { method: 'PUT', cookie: off.cookie, body: { weekEnd: '2026-11-20', prayers: 3 } })).status).toBe(409)
    })

    it('planlayıcı: istifadəçinin saat qurşağında seçilmiş gün 09:00-dan sonra, bir dəfə; rəqəm yoxdursa göndərilmir; abunəlikdən çıxma', async () => {
      mail.length = 0
      const a = await verified(), b = await verified(), ny = await verified()
      for (const [u, tz] of [[a, 'Asia/Baku'], [b, 'Asia/Baku'], [ny, 'America/New_York']]) {
        await call('/api/weekly/prefs', { method: 'PUT', cookie: u.cookie, body: { consent: true, enabled: true, weekday: 5, tz, lang: 'en' } })
      }
      await call('/api/weekly/stats', { method: 'PUT', cookie: a.cookie, body: { weekEnd: '2026-11-20', prayers: 30, quranPages: 12, dhikr: 700, fasts: 2 } })
      await call('/api/weekly/stats', { method: 'PUT', cookie: ny.cookie, body: { weekEnd: '2026-11-20', prayers: 20 } })
      const t0 = clock
      const wk = srv.routers.wk
      clock = Date.UTC(2026, 10, 20, 4, 30)   // Bakı 08:30 — hələ yox
      await wk.tick(clock)
      expect(mail.filter((m) => m.kind === 'weekly' && [a.email, b.email, ny.email].includes(m.to))).toHaveLength(0)
      clock = Date.UTC(2026, 10, 20, 5, 1)    // Bakı 09:01
      await wk.tick(clock)
      await wk.tick(clock)
      const mine = (m) => m.kind === 'weekly' && [a.email, b.email, ny.email].includes(m.to)
      const sent = mail.filter(mine)
      expect(sent).toHaveLength(1)   // b — rəqəm yoxdur → atlanır; ny — hələ gecədir
      expect(sent[0].text).toContain('Prayers logged: 30 / 35')
      expect(sent[0].text).not.toContain('Wird')
      expect(sent[0].headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
      expect(db.raw.prepare("SELECT status FROM weekly_sent WHERE user_id = ?").get(b.id).status).toBe('skipped')
      clock = Date.UTC(2026, 10, 20, 14, 5)   // New York 09:05
      await wk.tick(clock)
      expect(mail.filter(mine)).toHaveLength(2)
      // göndərilmiş həftəyə yeni rəqəm qəbul olunmur
      expect((await call('/api/weekly/stats', { method: 'PUT', cookie: a.cookie, body: { weekEnd: '2026-11-20', prayers: 1 } })).status).toBe(409)
      // abunəlikdən çıxma: GET heç nə dəyişmir, POST söndürür; saxta token 400
      const url = new URL(/https:\/\/muslims\.cc(\/api\/weekly\/unsubscribe\?t=[^\s]+)/.exec(sent[0].text)[1], srv.url)
      expect((await fetch(srv.url + url.pathname + url.search)).status).toBe(200)
      expect(db.raw.prepare('SELECT enabled FROM weekly_prefs WHERE user_id = ?').get(a.id).enabled).toBe(1)
      expect((await fetch(srv.url + '/api/weekly/unsubscribe?t=1.weekly.' + 'x'.repeat(32), { method: 'POST' })).status).toBe(400)
      const r = await fetch(srv.url + url.pathname + url.search, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })
      expect(r.status).toBe(200)
      expect(db.raw.prepare('SELECT enabled FROM weekly_prefs WHERE user_id = ?').get(a.id).enabled).toBe(0)
      clock = t0
    })

    it('nextReportDate: həmin gün 09:00-dan əvvəl — bu gün, sonra — gələn həftə', () => {
      expect(weekly.nextReportDate(Date.UTC(2026, 10, 20, 4), 'Asia/Baku', 5)).toBe('2026-11-20')
      expect(weekly.nextReportDate(Date.UTC(2026, 10, 20, 6), 'Asia/Baku', 5)).toBe('2026-11-27')
      expect(weekly.nextReportDate(Date.UTC(2026, 10, 21, 2), 'America/Los_Angeles', 5)).toBe('2026-11-27')
    })
  })

  // ── İxrac, xülasə, CASCADE ──
  it('"Mənim məlumatlarım" hər modulu göstərir (token/heş yoxdur); hesab silinəndə hər şey silinir', async () => {
    const u = await signup('Silinən')
    store.markVerified(u.id)
    await call('/api/profile/public', { method: 'PUT', cookie: u.cookie, body: { consent: true, handle: 'gone_soon', enabled: true, fields: ['khatms'], data: { khatms: 1 } } })
    await call('/api/family', { cookie: u.cookie })
    await call('/api/family/duas', { cookie: u.cookie, body: { body: 'ailə duası' } })
    await call('/api/dua-wall', { cookie: u.cookie, body: { body: 'Divar üçün dua istəyim', lang: 'az' } })
    await call('/api/weekly/prefs', { method: 'PUT', cookie: u.cookie, body: { consent: true, enabled: true, weekday: 5, tz: 'Asia/Baku' } })
    store.setUserRole(u.id, 'mosque_rep', 'n555', { kind: 'script', id: null }, clock)
    await call('/api/mosque-rep', { method: 'PUT', cookie: u.cookie, body: { iqama: { fajr: 15 } } })
    await call('/api/mosque-rep/announcements', { cookie: u.cookie, body: { body: 'Elan', expiresOn: '2026-11-20' } })

    const sum = await (await get('/api/auth/data-summary', u.cookie)).json()
    expect(JSON.stringify(sum)).toMatch(/gone_soon/)
    const ex = await (await get('/api/auth/export', u.cookie)).json()
    const s = JSON.stringify(ex)
    for (const needle of ['gone_soon', 'ailə duası', 'Divar üçün dua istəyim', 'Asia/Baku', 'n555', 'Elan']) expect(s, needle).toContain(needle)
    expect(s).not.toMatch(/token_hash|reporter_key|test-secret/)

    expect((await del(u.cookie)).status).toBe(200)
    for (const t of ['public_profiles', 'family_duas', 'dua_wall', 'weekly_prefs', 'mosque_announcements']) {
      const col = t === 'family_duas' ? 'author_id' : t === 'mosque_announcements' ? 'author_id' : 'user_id'
      expect(db.raw.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE ${col} = ?`).get(u.id).n, t).toBe(0)
    }
    expect(db.raw.prepare('SELECT updated_by FROM mosque_info WHERE mosque_id = ?').get('n555').updated_by).toBe(null)
  })
})
