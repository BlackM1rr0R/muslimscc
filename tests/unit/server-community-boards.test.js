// Server: icma lövhələri — namaz otaqları (prayerRooms.js), cənazə elanı (janaza.js), məscid könüllüləri
// (volunteers.js). Yoxlanır: giriş/rol (authz), başqasının obyekti (IDOR), moderasiya (admin PANELİ, editor+),
// vaxt bitməsi / arxiv, limitlər, gizlilik (ictimai cavabda ad / əlaqə / say yoxdur), ixrac (token heşi yoxdur).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const kit = require('../../server/communityKit.js')
const rooms = require('../../server/prayerRooms.js')
const janaza = require('../../server/janaza.js')
const volunteers = require('../../server/volunteers.js')
const security = require('../../server/security.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ADMIN_PASS = 'admin-şifrəsi-çox-uzun-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const DAY = 86400000
// 2026-11-24 08:00 UTC
let clock = Date.UTC(2026, 10, 24, 8, 0)
const iso = (ms) => new Date(ms).toISOString().slice(0, 10)
const dayPlus = (n) => iso(clock + n * DAY)

describe('validRoom / validNotice / validNeed', () => {
  const room = { name: 'Heydər Əliyev hava limanı — namaz otağı', type: 'airport', city: 'Bakı', address: 'Terminal 1', lat: 40.4675, lng: 50.0467, floor: '2', notes: '', wudu: true, women: true }
  it('namaz otağı: düzgün; növ, koordinat, keçid, telefon', () => {
    expect(rooms.validRoom(room)).toMatchObject({ name: room.name, type: 'airport', lat: 40.4675, wudu: true })
    expect(rooms.validRoom({ ...room, type: 'mosque' }).error).toBe('bad_type')
    expect(rooms.validRoom({ ...room, lat: 91 }).error).toBe('bad_location')
    expect(rooms.validRoom({ ...room, lat: '40' }).error).toBe('bad_location')
    expect(rooms.validRoom({ ...room, lat: 0, lng: 0 }).error).toBe('bad_location')
    expect(rooms.validRoom({ ...room, notes: 'see example.com' }).error).toBe('links_not_allowed')
    expect(rooms.validRoom({ ...room, notes: 'zəng +994 50 123 45 67' }).error).toBe('personal_info')
    expect(rooms.validRoom({ ...room, wudu: 'yes' }).error).toBe('bad_request')
    expect(rooms.validRoom(null).error).toBe('bad_request')
    expect(rooms.validRoom({ ...room, lat: 40.1234567 }).lat).toBe(40.12346)
  })
  it('cənazə elanı: razılıq, tarix pəncərəsi, əlaqə sahəsi', () => {
    const today = iso(clock)
    const n = { deceased: 'Əli Məmmədov', date: today, time: '13:30', place: 'Təzəpir məscidi', lang: 'az', consent: true, contact: '+994 50 123 45 67' }
    expect(janaza.validNotice(n, today)).toMatchObject({ deceased: 'Əli Məmmədov', contact: '+994 50 123 45 67', wantPublic: false })
    expect(janaza.validNotice({ ...n, consent: false }, today).error).toBe('consent_required')
    expect(janaza.validNotice({ ...n, date: dayPlus(-3) }, today).error).toBe('bad_date')
    expect(janaza.validNotice({ ...n, date: dayPlus(15) }, today).error).toBe('bad_date')
    expect(janaza.validNotice({ ...n, date: '2026-02-30' }, today).error).toBe('bad_date')
    expect(janaza.validNotice({ ...n, time: '25:00' }, today).error).toBe('bad_time')
    expect(janaza.validNotice({ ...n, contact: 'https://x.y' }, today).error).toBe('bad_contact')
    expect(janaza.validNotice({ ...n, place: 'visit spam.com' }, today).error).toBe('links_not_allowed')
    expect(janaza.validNotice({ ...n, deceased: '<script>' }, today).error).toBe('bad_name')
  })
  it('könüllü ehtiyacı: yer sayı, tarix, keçid', () => {
    const today = iso(clock)
    const b = { title: 'İftar süfrəsi', description: 'Masaları qurmaq', date: today, time: '17:00', slots: 5, mosqueName: 'Əbu Bəkr' }
    expect(volunteers.validNeed(b, today)).toMatchObject({ slots: 5 })
    expect(volunteers.validNeed({ ...b, slots: 0 }, today).error).toBe('bad_slots')
    expect(volunteers.validNeed({ ...b, slots: 51 }, today).error).toBe('bad_slots')
    expect(volunteers.validNeed({ ...b, slots: '5' }, today).error).toBe('bad_slots')
    expect(volunteers.validNeed({ ...b, date: dayPlus(-2) }, today).error).toBe('bad_date')
    expect(volunteers.validNeed({ ...b, description: 'bax t.me/xyz' }, today).error).toBe('links_not_allowed')
  })
})

describe('icma lövhələri HTTP', () => {
  let srv, db, store, authStore, R
  const admins = {}
  beforeAll(async () => {
    db = openDb(':memory:')
    authStore = auth.createAuthStore(db)
    store = users.createUsersStore(db)
    admins.editor = await authStore.createAdmin('editor@muslims.cc', ADMIN_PASS)
    store.setAdminRole('editor@muslims.cc', 'editor')
    const allowedOrigins = [ORIGIN]
    const requireAdmin = auth.createRequireAdmin({ legacyLogin: true, store: authStore, allowedOrigins })
    const app = express()
    app.set('trust proxy', 1)
    const mailer = createMailer({ apiKey: '', onMessage: () => {} })
    const ur = users.createUsersRouter({
      db, store, requireAdmin, allowedOrigins, publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null, mailer, now: () => clock,
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
    })
    app.use('/api', ur)
    const requireEditor = kit.createRequireEditor({ requireAdmin, adminRoleOf: store.adminRole })
    const optionalUser = kit.createOptionalUser({ usersStore: store, cookieName: users.USER_COOKIE, now: () => clock })
    R = {
      pr: rooms.createPrayerRoomsRouter({ db, requireUser: ur.requireUser, requireEditor, now: () => clock }),
      jz: janaza.createJanazaRouter({ db, requireUser: ur.requireUser, requireEditor, optionalUser, allowedOrigins, now: () => clock, anonDuaPerHour: 3, viewLimit: { max: 6, windowMs: 60e3 } }),
      vo: volunteers.createVolunteersRouter({ db, requireUser: ur.requireUser, requireEditor, optionalUser, now: () => clock }),
    }
    for (const r of Object.values(R)) app.use('/api', r)
    const sec = security.createSecurity({ db, totpKey: '', publicOrigin: ORIGIN, mailer })
    app.use('/api', security.createSecurityRouter({
      security: sec, usersStore: store, requireUser: ur.requireUser, mailer, publicOrigin: ORIGIN,
      sources: { prayerRooms: R.pr, janaza: R.jz, volunteers: R.vo },
    }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const get = (path, cookie) => call(path, { method: 'GET', cookie, headers: {} })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  let n = 0
  const signup = async (displayName = 'Əli', { verified = true, old = true } = {}) => {
    const email = `cb${++n}@example.com`
    const r = await call('/api/auth/register', { body: { email, password: PASS, displayName, lang: 'az' } })
    const j = await r.json()
    if (verified) store.markVerified(j.user.id)
    if (old) db.raw.prepare('UPDATE users SET created_at = ? WHERE id = ?').run(clock - 2 * DAY, j.user.id)
    return { cookie: cookieOf(r), id: j.user.id, email }
  }
  const adminCookie = () => `${auth.COOKIE_NAME}=${authStore.createSession(admins.editor)}`
  const role = (u, r, mid = null) => store.setUserRole(u.id, r, mid, { kind: 'script', id: null }, clock)
  const ROOM = { name: 'Gənclik Mall namaz otağı', type: 'mall', city: 'Bakı', address: 'Fətəli Xan Xoyski 14', lat: 40.4, lng: 49.85, floor: '-1', notes: 'Kassaların yanında', wudu: true, women: false }

  // ── Namaz otaqları ──
  describe('namaz otaqları', () => {
    it('girişsiz 401; təsdiqsiz e-poçt 403; CSRF başlığı yoxdursa 403', async () => {
      expect((await call('/api/prayer-rooms', { body: ROOM })).status).toBe(401)
      const u = await signup('X', { verified: false })
      const r = await call('/api/prayer-rooms', { cookie: u.cookie, body: ROOM })
      expect([r.status, (await r.json()).code]).toEqual([403, 'verify_email'])
      const v = await signup()
      expect((await call('/api/prayer-rooms', { cookie: v.cookie, body: ROOM, headers: { 'content-type': 'application/json' } })).status).toBe(403)
    })

    it('göndər → pending (siyahıda yox) → editor təsdiqləyir → siyahıda, müəllif adı yoxdur; şəhər/növ süzgəci', async () => {
      const u = await signup('Gizli Ad')
      const r = await call('/api/prayer-rooms', { cookie: u.cookie, body: ROOM })
      expect(r.status).toBe(201)
      const { item } = await r.json()
      expect(item.status).toBe('pending')
      expect((await (await get('/api/prayer-rooms')).json()).items.some((x) => x.id === item.id)).toBe(false)
      // İstifadəçi sessiyası moderasiya edə bilməz
      expect((await call(`/api/admin/prayer-rooms/${item.id}`, { cookie: u.cookie, body: { action: 'approve' } })).status).toBe(401)
      const q = await (await get('/api/admin/prayer-rooms?status=pending', adminCookie())).json()
      expect(q.items.some((x) => x.id === item.id)).toBe(true)
      expect(JSON.stringify(q)).not.toContain(u.email)
      expect((await call(`/api/admin/prayer-rooms/${item.id}`, { cookie: adminCookie(), body: { action: 'approve' } })).status).toBe(200)
      const pub = await (await get('/api/prayer-rooms')).json()
      const it0 = pub.items.find((x) => x.id === item.id)
      expect(it0).toMatchObject({ name: ROOM.name, type: 'mall', wudu: true, women: false })
      expect(JSON.stringify(pub)).not.toContain('Gizli Ad')
      expect(JSON.stringify(pub)).not.toContain(u.email)
      expect(pub.cities.some((c) => c.name === 'Bakı')).toBe(true)
      expect((await (await get('/api/prayer-rooms?city=%20bAkı')).json()).items.some((x) => x.id === item.id)).toBe(true)
      expect((await (await get('/api/prayer-rooms?city=Gəncə')).json()).items.some((x) => x.id === item.id)).toBe(false)
      expect((await (await get('/api/prayer-rooms?type=airport')).json()).items.some((x) => x.id === item.id)).toBe(false)
    })

    it('IDOR: başqasının yerini silmək 404; öz yerini silmək olar', async () => {
      const a = await signup(), b = await signup()
      const { item } = await (await call('/api/prayer-rooms', { cookie: a.cookie, body: ROOM })).json()
      expect((await call(`/api/prayer-rooms/${item.id}`, { method: 'DELETE', cookie: b.cookie })).status).toBe(404)
      expect((await call(`/api/prayer-rooms/${item.id}`, { method: 'DELETE', cookie: a.cookie })).status).toBe(200)
    })

    it('gündəlik limit (5) → 429', async () => {
      const u = await signup()
      for (let i = 0; i < rooms.PER_DAY; i++) expect((await call('/api/prayer-rooms', { cookie: u.cookie, body: { ...ROOM, name: `Otaq ${i}` } })).status).toBe(201)
      const r = await call('/api/prayer-rooms', { cookie: u.cookie, body: ROOM })
      expect([r.status, (await r.json()).code]).toEqual([429, 'daily_limit'])
    })

    it('şikayət: öz yerinə yox; 3 fərqli sayılan şikayət → siyahıdan çıxır; təzə hesab sayılmır', async () => {
      const owner = await signup()
      const { item } = await (await call('/api/prayer-rooms', { cookie: owner.cookie, body: ROOM })).json()
      await call(`/api/admin/prayer-rooms/${item.id}`, { cookie: adminCookie(), body: { action: 'approve' } })
      expect((await call(`/api/prayer-rooms/${item.id}/report`, { cookie: owner.cookie, body: { kind: 'closed' } })).status).toBe(400)
      const fresh = await signup('Y', { old: false })
      expect((await call(`/api/prayer-rooms/${item.id}/report`, { cookie: fresh.cookie, body: { kind: 'closed' } })).status).toBe(202)
      const bad = await signup()
      expect((await call(`/api/prayer-rooms/${item.id}/report`, { cookie: bad.cookie, body: { kind: 'nope' } })).status).toBe(400)
      expect((await call(`/api/prayer-rooms/${item.id}/report`, { cookie: bad.cookie, body: { kind: 'wrong', note: 'example.com' } })).status).toBe(400)
      const flagged = await (await get('/api/admin/prayer-rooms?status=reported', adminCookie())).json()
      expect(flagged.items.find((x) => x.id === item.id).reports[0]).toMatchObject({ kind: 'closed' })
      for (let i = 0; i < 3; i++) {
        const r = await signup()
        expect((await call(`/api/prayer-rooms/${item.id}/report`, { cookie: r.cookie, body: { kind: 'closed', note: 'Otaq bağlanıb' } })).status).toBe(202)
      }
      expect((await (await get('/api/prayer-rooms')).json()).items.some((x) => x.id === item.id)).toBe(false)
      const mine = await (await get('/api/prayer-rooms/mine', owner.cookie)).json()
      expect(mine.items.find((x) => x.id === item.id).status).toBe('pending')
    })

    it('rədd səbəbi yoxlanır; bloklanmış müəllifin yeri siyahıda yoxdur', async () => {
      const u = await signup()
      const { item } = await (await call('/api/prayer-rooms', { cookie: u.cookie, body: ROOM })).json()
      expect((await call(`/api/admin/prayer-rooms/${item.id}`, { cookie: adminCookie(), body: { action: 'reject', reason: 'x' } })).status).toBe(400)
      await call(`/api/admin/prayer-rooms/${item.id}`, { cookie: adminCookie(), body: { action: 'approve' } })
      expect((await (await get('/api/prayer-rooms')).json()).items.some((x) => x.id === item.id)).toBe(true)
      store.setDisabled(u.id, true, { kind: 'script', id: null }, clock)
      expect((await (await get('/api/prayer-rooms')).json()).items.some((x) => x.id === item.id)).toBe(false)
    })

    it('gövdə yoxdur / pozulmuş JSON → 400 (500 deyil)', async () => {
      const u = await signup()
      expect((await call('/api/prayer-rooms', { cookie: u.cookie })).status).toBe(400)
      const r = await fetch(srv.url + '/api/prayer-rooms', { method: 'POST', headers: { ...H, cookie: u.cookie }, body: '{bad' })
      expect(r.status).toBe(400)
    })
  })

  // ── Cənazə elanı ──
  describe('cənazə elanı', () => {
    const NOTICE = () => ({ deceased: 'Rəhim Əliyev', date: iso(clock), time: '14:00', place: 'Təzəpir məscidi', city: 'Bakı', burial: 'Şıxlar qəbiristanlığı', contact: 'Oğlu Elvin +994 50 000 00 00', lang: 'az', consent: true })

    it('razılıqsız 400; susmaya görə gizli (ictimai siyahıda yox); keçidlə baxış — əlaqə var, say yoxdur', async () => {
      const u = await signup()
      expect((await (await call('/api/janaza', { cookie: u.cookie, body: { ...NOTICE(), consent: false } })).json()).code).toBe('consent_required')
      const r = await call('/api/janaza', { cookie: u.cookie, body: NOTICE() })
      expect(r.status).toBe(201)
      const { notice, token } = await r.json()
      expect(token).toMatch(janaza.TOKEN_RE)
      expect(notice).toMatchObject({ publicStatus: 'none', duas: 0 })
      expect((await (await get('/api/janaza/public')).json()).items.some((x) => x.id === notice.id)).toBe(false)
      const v = await call('/api/janaza/view', { body: { token } })
      expect(v.headers.get('x-robots-tag')).toBe('noindex')
      const { notice: seen } = await v.json()
      expect(seen).toMatchObject({ deceased: 'Rəhim Əliyev', contact: 'Oğlu Elvin +994 50 000 00 00', listed: false })
      expect(seen).not.toHaveProperty('duas')
      // Yanlış / CSRF-siz
      expect((await call('/api/janaza/view', { body: { token: 'A'.repeat(43) } })).status).toBe(404)
      expect((await call('/api/janaza/view', { body: { token }, headers: { 'content-type': 'application/json' } })).status).toBe(403)
    })

    it('"Dua etdim": girişsiz/girişli, təkrar sayılmır; sayı YALNIZ sahibinə; IP limiti', async () => {
      const u = await signup()
      const { notice, token } = await (await call('/api/janaza', { cookie: u.cookie, body: NOTICE() })).json()
      const a1 = await (await call('/api/janaza/dua', { body: { token } })).json()
      expect(a1).toEqual({ ok: true, already: false })
      expect((await (await call('/api/janaza/dua', { body: { token } })).json()).already).toBe(true)
      const v = await signup()
      expect((await (await call('/api/janaza/dua', { cookie: v.cookie, body: { token } })).json()).already).toBe(false)
      expect((await (await call('/api/janaza/dua', { cookie: v.cookie, body: { token } })).json()).already).toBe(true)
      const mine = await (await get('/api/janaza/mine', u.cookie)).json()
      expect(mine.items.find((x) => x.id === notice.id).duas).toBe(2)
      // Gizli elanın id ilə "dua"sı olmaz (yalnız ictimai elan id ilə)
      expect((await call('/api/janaza/dua', { body: { id: notice.id } })).status).toBe(404)
      // Girişsiz limit (testdə saatda 3)
      const { token: t2 } = await (await call('/api/janaza', { cookie: u.cookie, body: NOTICE() })).json()
      await call('/api/janaza/dua', { body: { token: t2 } })
      await call('/api/janaza/dua', { body: { token: t2 } })
      expect((await call('/api/janaza/dua', { body: { token: t2 } })).status).toBe(429)
    })

    it('baxış limiti (IP heşi üzrə) → 429', async () => {
      // Bu testə qədər view limiti (6/dəq) ilk testdə 3 dəfə işlədilib — saatı irəli çək
      clock += 120e3
      let last
      for (let i = 0; i < 7; i++) last = await call('/api/janaza/view', { body: { token: 'B'.repeat(43) } })
      expect(last.status).toBe(429)
      clock += 120e3
    })

    it('IDOR: başqasının elanı — keçid, ictimai, silmə 404; öz elanı — yeni keçid köhnəni ləğv edir', async () => {
      const a = await signup(), b = await signup()
      const { notice, token } = await (await call('/api/janaza', { cookie: a.cookie, body: NOTICE() })).json()
      expect((await call(`/api/janaza/${notice.id}/link`, { cookie: b.cookie })).status).toBe(404)
      expect((await call(`/api/janaza/${notice.id}/public`, { method: 'PUT', cookie: b.cookie, body: { public: true } })).status).toBe(404)
      expect((await call(`/api/janaza/${notice.id}`, { method: 'DELETE', cookie: b.cookie })).status).toBe(404)
      expect((await (await get('/api/janaza/mine', b.cookie)).json()).items.some((x) => x.id === notice.id)).toBe(false)
      const nl = await call(`/api/janaza/${notice.id}/link`, { cookie: a.cookie })
      expect(nl.status).toBe(201)
      const { token: t2 } = await nl.json()
      expect((await call('/api/janaza/view', { body: { token } })).status).toBe(404)
      expect((await call('/api/janaza/view', { body: { token: t2 } })).status).toBe(200)
      expect((await call(`/api/janaza/${notice.id}`, { method: 'DELETE', cookie: a.cookie })).status).toBe(200)
      expect((await call('/api/janaza/view', { body: { token: t2 } })).status).toBe(404)
    })

    it('ictimai siyahı: sahibi istəyir → pending → admin təsdiqi; siyahıda əlaqə və say YOXDUR; istəməyəni admin çıxara bilməz', async () => {
      const u = await signup()
      const { notice } = await (await call('/api/janaza', { cookie: u.cookie, body: { ...NOTICE(), public: true } })).json()
      expect(notice.publicStatus).toBe('pending')
      expect((await (await get('/api/janaza/public')).json()).items.some((x) => x.id === notice.id)).toBe(false)
      const q = await (await get('/api/admin/janaza?status=pending', adminCookie())).json()
      const qi = q.items.find((x) => x.id === notice.id)
      expect(qi).toBeTruthy()
      expect(qi).not.toHaveProperty('contact')
      expect(qi).not.toHaveProperty('duas')
      expect((await call(`/api/admin/janaza/${notice.id}`, { cookie: adminCookie(), body: { action: 'approve' } })).status).toBe(200)
      const pub = await (await get('/api/janaza/public')).json()
      const pi = pub.items.find((x) => x.id === notice.id)
      expect(pi).toMatchObject({ deceased: 'Rəhim Əliyev', place: 'Təzəpir məscidi' })
      expect(pi).not.toHaveProperty('contact')
      expect(pi).not.toHaveProperty('duas')
      expect(JSON.stringify(pub)).not.toContain('+994')
      // id ilə "dua" ictimai elanda işləyir
      expect((await call('/api/janaza/dua', { cookie: (await signup()).cookie, body: { id: notice.id } })).status).toBe(200)
      // Sahibi istəməyən (none) elanı admin təsdiqləyə bilməz
      const { notice: priv } = await (await call('/api/janaza', { cookie: u.cookie, body: NOTICE() })).json()
      expect((await call(`/api/admin/janaza/${priv.id}`, { cookie: adminCookie(), body: { action: 'approve' } })).status).toBe(409)
      // Sahibi siyahıdan çıxarır
      await call(`/api/janaza/${notice.id}/public`, { method: 'PUT', cookie: u.cookie, body: { public: false } })
      expect((await (await get('/api/janaza/public')).json()).items.some((x) => x.id === notice.id)).toBe(false)
    })

    it('vaxt: siyahıdan 7 gündən sonra çıxır, keçid 30 gün işləyir, sonra purge silir', async () => {
      const u = await signup()
      const { notice, token } = await (await call('/api/janaza', { cookie: u.cookie, body: { ...NOTICE(), public: true } })).json()
      await call(`/api/admin/janaza/${notice.id}`, { cookie: adminCookie(), body: { action: 'approve' } })
      const saved = clock
      try {
        clock = saved + 7 * DAY
        expect((await (await get('/api/janaza/public')).json()).items.some((x) => x.id === notice.id)).toBe(true)
        clock = saved + 8 * DAY
        expect((await (await get('/api/janaza/public')).json()).items.some((x) => x.id === notice.id)).toBe(false)
        expect((await (await get('/api/janaza/mine', u.cookie)).json()).items.find((x) => x.id === notice.id).expired).toBe(true)
        expect((await call('/api/janaza/view', { body: { token } })).status).toBe(200)
        clock = saved + 31 * DAY
        expect((await call('/api/janaza/view', { body: { token } })).status).toBe(404)
        expect(R.jz.purge()).toBeGreaterThan(0)
        expect(db.raw.prepare('SELECT COUNT(*) AS n FROM janaza_notices WHERE id = ?').get(notice.id).n).toBe(0)
      } finally { clock = saved }
    })

    it('şikayət: yalnız ictimai elan; 3 sayılan şikayət → siyahıdan çıxır', async () => {
      const u = await signup()
      const { notice } = await (await call('/api/janaza', { cookie: u.cookie, body: { ...NOTICE(), public: true } })).json()
      expect((await call(`/api/janaza/${notice.id}/report`, { cookie: (await signup()).cookie, body: { reason: 'false_info' } })).status).toBe(404)
      await call(`/api/admin/janaza/${notice.id}`, { cookie: adminCookie(), body: { action: 'approve' } })
      expect((await call(`/api/janaza/${notice.id}/report`, { cookie: u.cookie, body: { reason: 'false_info' } })).status).toBe(400)
      for (let i = 0; i < 3; i++) expect((await call(`/api/janaza/${notice.id}/report`, { cookie: (await signup()).cookie, body: { reason: 'false_info' } })).status).toBe(202)
      expect((await (await get('/api/janaza/public')).json()).items.some((x) => x.id === notice.id)).toBe(false)
    })

    it('gündəlik limit (3) → 429; ixracda token / heş yoxdur', async () => {
      const u = await signup()
      for (let i = 0; i < janaza.PER_DAY; i++) expect((await call('/api/janaza', { cookie: u.cookie, body: NOTICE() })).status).toBe(201)
      expect((await call('/api/janaza', { cookie: u.cookie, body: NOTICE() })).status).toBe(429)
      const ex = await (await get('/api/auth/export', u.cookie)).json()
      expect(ex.janaza.notices).toHaveLength(3)
      expect(JSON.stringify(ex)).not.toMatch(/token_hash|tokenHash|[0-9a-f]{64}/)
      const sum = await (await get('/api/auth/data-summary', u.cookie)).json()
      expect(sum.janaza.notices).toBe(3)
    })
  })

  // ── Könüllülər ──
  describe('məscid könüllüləri', () => {
    const NEED = () => ({ title: 'Cümə namazında nizam', description: 'Ayaqqabı rəfləri və yer göstərmək', date: dayPlus(2), time: '12:30', slots: 2, mosqueName: 'Əbu Bəkr məscidi' })

    it('authz: adi istifadəçi və editor yerləşdirə bilməz; nümayəndə öz məscidinə; mosqueId gövdədən götürülmür', async () => {
      const u = await signup()
      expect((await call('/api/volunteers', { cookie: u.cookie, body: NEED() })).status).toBe(403)
      const ed = await signup(); role(ed, 'editor')
      expect((await (await call('/api/volunteers', { cookie: ed.cookie, body: NEED() })).json()).code).toBe('no_mosque')
      const rep = await signup(); role(rep, 'mosque_rep', 'm111')
      const r = await call('/api/volunteers', { cookie: rep.cookie, body: { ...NEED(), mosqueId: 'other999' } })
      expect(r.status).toBe(201)
      expect((await r.json()).item.mosqueId).toBe('m111')
      const ad = await signup(); role(ad, 'admin')
      expect((await call('/api/volunteers', { cookie: ad.cookie, body: NEED() })).status).toBe(400)
      const ra = await call('/api/volunteers', { cookie: ad.cookie, body: { ...NEED(), mosqueId: 'm222' } })
      expect((await ra.json()).item.mosqueId).toBe('m222')
    })

    it('yazılış: ictimai yalnız say (ad yox); dolu → 409; ləğv; nümayəndə adları və yalnız razılıqla e-poçtu görür', async () => {
      const rep = await signup(); role(rep, 'mosque_rep', 'm333')
      const { item } = await (await call('/api/volunteers', { cookie: rep.cookie, body: NEED() })).json()
      const a = await signup('Kamal'), b = await signup('Nigar'), c = await signup('Orxan')
      // E-poçt razılıqsız → 400
      expect((await (await call(`/api/volunteers/${item.id}/signup`, { cookie: a.cookie, body: { shareEmail: true } })).json()).code).toBe('consent_required')
      const s1 = await (await call(`/api/volunteers/${item.id}/signup`, { cookie: a.cookie, body: { shareEmail: true, consent: true } })).json()
      expect(s1.item).toMatchObject({ filled: 1, slots: 2, signedUp: true })
      expect((await call(`/api/volunteers/${item.id}/signup`, { cookie: b.cookie, body: {} })).status).toBe(200)
      // Təkrar yazılış sayı artırmır
      expect((await (await call(`/api/volunteers/${item.id}/signup`, { cookie: b.cookie, body: {} })).json()).item.filled).toBe(2)
      expect((await (await call(`/api/volunteers/${item.id}/signup`, { cookie: c.cookie, body: {} })).json()).code).toBe('full')
      const pub = await (await get('/api/volunteers')).json()
      expect(pub.items.find((x) => x.id === item.id)).toMatchObject({ filled: 2, slots: 2 })
      expect(JSON.stringify(pub)).not.toMatch(/Kamal|Nigar|example\.com/)
      expect((await (await get('/api/volunteers', b.cookie)).json()).items.find((x) => x.id === item.id).signedUp).toBe(true)
      const man = await (await get('/api/volunteers/manage', rep.cookie)).json()
      const sg = man.items.find((x) => x.id === item.id).signups
      expect(sg).toEqual([expect.objectContaining({ name: 'Kamal', email: a.email }), expect.objectContaining({ name: 'Nigar', email: null })])
      // Ləğv → yer boşalır, C yazıla bilir
      expect((await (await call(`/api/volunteers/${item.id}/signup`, { method: 'DELETE', cookie: b.cookie })).json()).item.filled).toBe(1)
      expect((await call(`/api/volunteers/${item.id}/signup`, { method: 'DELETE', cookie: b.cookie })).status).toBe(404)
      expect((await call(`/api/volunteers/${item.id}/signup`, { cookie: c.cookie, body: { name: 'O.' } })).status).toBe(200)
      expect((await (await get('/api/volunteers/mine', c.cookie)).json()).items[0]).toMatchObject({ id: item.id, myName: 'O.' })
    })

    it('IDOR: başqa məscidin nümayəndəsi nə siyahını görür, nə silə bilir', async () => {
      const rep1 = await signup('R1'); role(rep1, 'mosque_rep', 'm444')
      const rep2 = await signup('R2'); role(rep2, 'mosque_rep', 'm555')
      const { item } = await (await call('/api/volunteers', { cookie: rep1.cookie, body: NEED() })).json()
      const v = await signup('Vüsal')
      await call(`/api/volunteers/${item.id}/signup`, { cookie: v.cookie, body: {} })
      const man2 = await (await get('/api/volunteers/manage', rep2.cookie)).json()
      expect(man2.items.some((x) => x.id === item.id)).toBe(false)
      expect(JSON.stringify(man2)).not.toContain('Vüsal')
      expect((await call(`/api/volunteers/${item.id}`, { method: 'DELETE', cookie: rep2.cookie })).status).toBe(404)
      expect((await call(`/api/volunteers/${item.id}`, { method: 'DELETE', cookie: v.cookie })).status).toBe(403)
      // Rolu alınan nümayəndə artıq idarə edə bilməz
      role(rep1, 'user')
      expect((await call(`/api/volunteers/${item.id}`, { method: 'DELETE', cookie: rep1.cookie })).status).toBe(403)
      // Admin paneli: adlar YOX, silmək olar
      const adm = await (await get('/api/admin/volunteers', adminCookie())).json()
      expect(JSON.stringify(adm)).not.toContain('Vüsal')
      expect((await call(`/api/admin/volunteers/${item.id}`, { method: 'DELETE', cookie: adminCookie() })).status).toBe(200)
      expect((await get('/api/admin/volunteers', v.cookie)).status).toBe(401)
    })

    it('avtomatik arxiv: tarixi keçən ehtiyac siyahıdan çıxır, yazılış 409; 30 gündən sonra purge', async () => {
      const rep = await signup(); role(rep, 'mosque_rep', 'm666')
      const { item } = await (await call('/api/volunteers', { cookie: rep.cookie, body: { ...NEED(), date: dayPlus(0) } })).json()
      const u = await signup()
      const saved = clock
      try {
        clock = saved + DAY
        expect((await (await get('/api/volunteers')).json()).items.some((x) => x.id === item.id)).toBe(false)
        expect((await (await call(`/api/volunteers/${item.id}/signup`, { cookie: u.cookie, body: {} })).json()).code).toBe('archived')
        expect((await (await get('/api/volunteers/manage', rep.cookie)).json()).items.find((x) => x.id === item.id).archived).toBe(true)
        clock = saved + 32 * DAY
        R.vo.purge()
        expect(db.raw.prepare('SELECT COUNT(*) AS n FROM volunteer_needs WHERE id = ?').get(item.id).n).toBe(0)
      } finally { clock = saved }
    })

    it('hesab silinəndə yazılışlar da silinir (CASCADE)', async () => {
      const rep = await signup(); role(rep, 'mosque_rep', 'm777')
      const { item } = await (await call('/api/volunteers', { cookie: rep.cookie, body: NEED() })).json()
      const u = await signup('Silinən')
      await call(`/api/volunteers/${item.id}/signup`, { cookie: u.cookie, body: {} })
      expect((await call('/api/auth/delete', { cookie: u.cookie, body: { password: PASS } })).status).toBe(200)
      expect((await (await get('/api/volunteers')).json()).items.find((x) => x.id === item.id).filled).toBe(0)
    })
  })
})
