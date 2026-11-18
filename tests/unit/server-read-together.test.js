// Server: "Birlikdə Quran oxu" (server/readTogether.js) — giriş (yaratma), CSRF, qoşulma (hesabsız),
// dəvət tokeni yalnız həş, SSE bileti birdəfəlik, hadisələrin bütün iştirakçılara yayılması,
// aparıcı / "hər kəs çevirə bilər" hüquqları, həddlər, 24 saatlıq boşluqdan sonra silinmə.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const users = require('../../server/users.js')
const rt = require('../../server/readTogether.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
let clock = Date.UTC(2026, 10, 17, 8, 0)

/** SSE axınını oxuyan kiçik klient: hadisələr massivə yığılır */
function openStream(url) {
  const ctrl = new AbortController()
  const events = []
  const ready = fetch(url, { signal: ctrl.signal }).then(async (r) => {
    if (r.status !== 200) return r.status
    const reader = r.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    ;(async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          let i
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const chunk = buf.slice(0, i); buf = buf.slice(i + 2)
            const ev = /^event: (.+)$/m.exec(chunk)
            const data = /^data: (.+)$/m.exec(chunk)
            if (ev) events.push({ event: ev[1], data: data ? JSON.parse(data[1]) : null })
          }
        }
      } catch { /* abort */ }
      events.ended = true
    })()
    return 200
  })
  return { events, ready, close: () => ctrl.abort(), headers: null }
}
const waitFor = async (fn, ms = 2000) => {
  const t0 = Date.now()
  for (;;) {
    const v = fn()
    if (v) return v
    if (Date.now() - t0 > ms) throw new Error('timeout')
    await new Promise((r) => setTimeout(r, 10))
  }
}

describe('read-together HTTP + SSE', () => {
  let srv, router
  beforeAll(async () => {
    const db = openDb(':memory:')
    const store = users.createUsersStore(db)
    const app = express()
    app.set('trust proxy', 1)
    const ur = users.createUsersRouter({
      db, store, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null,
      mailer: createMailer({ apiKey: '', onMessage: () => {} }),
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
    })
    app.use('/api', ur)
    router = rt.createReadTogetherRouter({
      requireUser: ur.requireUser, allowedOrigins: [ORIGIN], now: () => clock, sweepMs: 0, keepaliveMs: 50,
      limits: { create: { max: 100, windowMs: 3600e3 }, join: { max: 5, windowMs: 60e3 }, ticket: { max: 1000, windowMs: 60e3 }, action: { max: 1000, windowMs: 60e3 } },
    })
    app.use('/api', router)
    srv = await listen(app)
  })
  afterAll(async () => { router.shutdown(); await srv.close() })

  let ipn = 0   // hər sorğu ayrı IP-dən (qoşulma limiti testdə kiçikdir); limit testi öz IP-sini verir
  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { 'x-forwarded-for': `10.0.${ipn++ % 250}.1`, ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  let n = 0
  const signup = async () => {
    const r = await call('/api/auth/register', { body: { email: `rt${++n}@example.com`, password: PASS, displayName: 'Aparıcı', lang: 'az' } })
    const j = await r.json()
    if (!j.user) throw new Error(JSON.stringify(j))
    return { cookie: cookieOf(r), id: j.user.id }
  }
  const ticket = async (room, me) => (await (await call(`/api/read-together/${room}/ticket`, { body: { pid: me.pid, secret: me.secret } })).json()).ticket
  const stream = async (room, me) => {
    const s = openStream(`${srv.url}/api/read-together/${room}/events?t=${await ticket(room, me)}`)
    expect(await s.ready).toBe(200)
    return s
  }
  const act = (room, me, body) => call(`/api/read-together/${room}/action`, { body: { pid: me.pid, secret: me.secret, ...body } })

  it('yaratma girişli və CSRF-li; qoşulma hesabsız, amma X-Requested-With tələb edir', async () => {
    expect((await call('/api/read-together/rooms', { body: { page: 5 } })).status).toBe(401)
    const { cookie } = await signup()
    expect((await call('/api/read-together/rooms', { cookie, headers: { 'content-type': 'application/json' }, body: { page: 5 } })).status).toBe(403)
    expect((await call('/api/read-together/rooms', { cookie, body: { page: 605 } })).status).toBe(400)
    const r = await call('/api/read-together/rooms', { cookie, body: { page: 5, title: 'Ailə‮ oxusu' } })
    expect(r.status).toBe(201)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const host = await r.json()
    expect(host.invite).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(host.state).toMatchObject({ page: 5, title: 'Ailə oxusu', anyoneTurns: false, highlight: null })
    expect(host.state.participants).toEqual([{ pid: host.pid, name: 'Aparıcı', host: true, online: false }])
    // dəvət tokeni yaddaşda da açıq saxlanmır
    const room = router.rooms.get(host.room)
    expect(JSON.stringify([...room.participants.values()].map(({ conns: _c, ...p }) => p))).not.toContain(host.secret)
    expect(room.inviteHash).not.toBe(host.invite)
    expect(room.inviteHash).toMatch(/^[0-9a-f]{64}$/)

    expect((await call('/api/read-together/join', { headers: { 'content-type': 'application/json' }, body: { invite: host.invite, name: 'Qonaq' } })).status).toBe(403)
    expect((await call('/api/read-together/join', { headers: { ...H, origin: 'https://evil.example' }, body: { invite: host.invite, name: 'Qonaq' } })).status).toBe(403)
    expect((await call('/api/read-together/join', { body: { invite: 'x'.repeat(22), name: 'Qonaq' } })).status).toBe(404)
    expect((await call('/api/read-together/join', { body: { invite: host.invite, name: '  ' } })).status).toBe(400)
    const g = await call('/api/read-together/join', { body: { invite: host.invite, name: 'Qonaq' } })
    expect(g.status).toBe(200)
    const guest = await g.json()
    expect(guest.room).toBe(host.room)
    expect(guest.state.participants.map((p) => p.name)).toEqual(['Aparıcı', 'Qonaq'])
  })

  it('SSE: bilet birdəfəlikdir; aparıcının vərəqi və işarəsi hamıya yayılır; iştirakçı çevirə bilmir', async () => {
    const { cookie } = await signup()
    const host = await (await call('/api/read-together/rooms', { cookie, body: { page: 10 } })).json()
    const guest = await (await call('/api/read-together/join', { body: { invite: host.invite, name: 'Ayşə' } })).json()
    const room = host.room

    // yanlış sirr → bilet yoxdur
    expect((await call(`/api/read-together/${room}/ticket`, { body: { pid: guest.pid, secret: host.secret } })).status).toBe(403)
    const t = await ticket(room, guest)
    const gs = openStream(`${srv.url}/api/read-together/${room}/events?t=${t}`)
    expect(await gs.ready).toBe(200)
    // eyni bilet ikinci dəfə işləmir
    expect((await fetch(`${srv.url}/api/read-together/${room}/events?t=${t}`)).status).toBe(403)
    const hs = await stream(room, host)
    // ilk mesaj — tam vəziyyət; iki onlayn iştirakçı
    await waitFor(() => gs.events.find((e) => e.event === 'state' && e.data.participants.every((p) => p.online)))

    expect((await act(room, guest, { type: 'page', page: 11 })).status).toBe(403)
    expect((await act(room, guest, { type: 'highlight', ayah: '2:255' })).status).toBe(403)
    expect((await act(room, host, { type: 'page', page: 42 })).status).toBe(200)
    await waitFor(() => gs.events.find((e) => e.event === 'state' && e.data.page === 42))
    await waitFor(() => hs.events.find((e) => e.event === 'state' && e.data.page === 42))
    expect((await act(room, host, { type: 'highlight', ayah: '2:287' })).status).toBe(400)   // Bəqərə 286 ayədir
    expect((await act(room, host, { type: 'highlight', ayah: '2:255' })).status).toBe(200)
    await waitFor(() => gs.events.find((e) => e.event === 'state' && e.data.highlight === '2:255'))
    // vərəq dəyişəndə işarə silinir
    await act(room, host, { type: 'page', page: 43 })
    await waitFor(() => gs.events.find((e) => e.event === 'state' && e.data.page === 43 && e.data.highlight === null))

    // "hər kəs çevirə bilər"
    expect((await act(room, guest, { type: 'settings', anyoneTurns: true })).status).toBe(403)
    expect((await act(room, host, { type: 'settings', anyoneTurns: true })).status).toBe(200)
    expect((await act(room, guest, { type: 'page', page: 44 })).status).toBe(200)
    await waitFor(() => hs.events.find((e) => e.event === 'state' && e.data.page === 44))

    // iştirakçı bağlantını bağlayır → hamıya "oflayn"
    gs.close()
    await waitFor(() => hs.events.find((e) => e.event === 'state' && e.data.participants.some((p) => p.pid === guest.pid && !p.online)))

    // aparıcı çıxarır → "kicked"; otaq bağlanır → "closed"
    const gs2 = await stream(room, guest)
    await waitFor(() => gs2.events.length)
    expect((await act(room, host, { type: 'kick', target: guest.pid })).status).toBe(200)
    await waitFor(() => gs2.events.find((e) => e.event === 'kicked'))
    expect((await call(`/api/read-together/${room}/ticket`, { body: { pid: guest.pid, secret: guest.secret } })).status).toBe(403)
    expect((await act(room, host, { type: 'close' })).status).toBe(200)
    await waitFor(() => hs.events.find((e) => e.event === 'closed'))
    expect(router.rooms.has(room)).toBe(false)
    expect((await call('/api/read-together/join', { body: { invite: host.invite, name: 'Gec' } })).status).toBe(404)
    hs.close()
  })

  it('dəvəti yeniləmək köhnəni ləğv edir; reclaim yalnız sahib üçün; mine siyahısı', async () => {
    const a = await signup(), b = await signup()
    const host = await (await call('/api/read-together/rooms', { cookie: a.cookie, body: {} })).json()
    const r = await (await act(host.room, host, { type: 'invite' })).json()
    expect(r.invite).not.toBe(host.invite)
    expect((await call('/api/read-together/join', { body: { invite: host.invite, name: 'X' } })).status).toBe(404)
    expect((await call(`/api/read-together/rooms/${host.room}/reclaim`, { cookie: b.cookie })).status).toBe(404)
    const rc = await (await call(`/api/read-together/rooms/${host.room}/reclaim`, { cookie: a.cookie })).json()
    expect(rc.pid).toBe(host.pid)
    expect((await act(host.room, host, { type: 'page', page: 2 })).status).toBe(403)   // köhnə sirr işləmir
    expect((await act(host.room, rc, { type: 'page', page: 2 })).status).toBe(200)
    const mine = await (await call('/api/read-together/mine', { method: 'GET', cookie: a.cookie, headers: {} })).json()
    expect(mine.rooms.map((x) => x.id)).toContain(host.room)
  })

  it('həddlər: istifadəçi başına 3 otaq, otaqda 30 iştirakçı, iştirakçı başına 3 bağlantı; IP limiti', async () => {
    const a = await signup()
    for (let i = 0; i < rt.MAX_ROOMS_PER_USER; i++) expect((await call('/api/read-together/rooms', { cookie: a.cookie, body: {} })).status).toBe(201)
    expect((await call('/api/read-together/rooms', { cookie: a.cookie, body: {} })).status).toBe(409)

    const b = await signup()
    const host = await (await call('/api/read-together/rooms', { cookie: b.cookie, body: {} })).json()
    const room = router.rooms.get(host.room)
    // 29 qonaq əl ilə (IP limiti testdə 5-dir)
    for (let i = 0; i < rt.MAX_PARTICIPANTS - 1; i++) room.participants.set(`p${String(i).padStart(7, '0')}`, { pid: 'x', name: 'x', host: false, secretHash: '0', conns: new Set() })
    expect((await call('/api/read-together/join', { body: { invite: host.invite, name: 'Son' } })).status).toBe(409)
    for (let i = 0; i < rt.MAX_PARTICIPANTS - 1; i++) room.participants.delete(`p${String(i).padStart(7, '0')}`)

    const streams = []
    for (let i = 0; i < rt.MAX_CONN_PER_PARTICIPANT; i++) streams.push(await stream(host.room, host))
    expect((await fetch(`${srv.url}/api/read-together/${host.room}/events?t=${await ticket(host.room, host)}`)).status).toBe(429)
    streams.forEach((s) => s.close())

    let last = 0
    for (let i = 0; i < 6; i++) last = (await call('/api/read-together/join', { headers: { ...H, 'x-forwarded-for': '9.9.9.9' }, body: { invite: host.invite, name: 'Q' + i } })).status
    expect(last).toBe(429)
  })

  it('otaq sahibinin (hesabın) bütün otaqlarında SSE həddi; cəmi dolanda ən köhnə bağlantı bağlanır', async () => {
    const db2 = openDb(':memory:')
    const store2 = users.createUsersStore(db2)
    const app2 = express()
    app2.set('trust proxy', 1)
    const ur2 = users.createUsersRouter({
      db: db2, store: store2, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null,
      mailer: createMailer({ apiKey: '', onMessage: () => {} }),
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
    })
    app2.use('/api', ur2)
    const r2 = rt.createReadTogetherRouter({ requireUser: ur2.requireUser, allowedOrigins: [ORIGIN], now: () => clock, sweepMs: 0, keepaliveMs: 50, maxConnPerOwner: 3, maxConnTotal: 4 })
    app2.use('/api', r2)
    const s2 = await listen(app2)
    let ip = 0
    const c2 = (path, { body, cookie } = {}) => fetch(s2.url + path, {
      method: 'POST', headers: { ...H, 'x-forwarded-for': `10.7.${ip++ % 250}.1`, ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body || {}),
    })
    const su = async (i) => { const r = await c2('/api/auth/register', { body: { email: `cap${i}@example.com`, password: PASS, displayName: 'H', lang: 'az' } }); return cookieOf(r) }
    const tk = async (room, me) => (await (await c2(`/api/read-together/${room}/ticket`, { body: { pid: me.pid, secret: me.secret } })).json()).ticket
    const sse = async (room, me) => { const s = openStream(`${s2.url}/api/read-together/${room}/events?t=${await tk(room, me)}`); return { s, status: await s.ready } }
    const all = []
    try {
      const a = await (await c2('/api/read-together/rooms', { cookie: await su(1) })).json()
      const g1 = await (await c2('/api/read-together/join', { body: { invite: a.invite, name: 'G1' } })).json()
      const g2 = await (await c2('/api/read-together/join', { body: { invite: a.invite, name: 'G2' } })).json()
      for (const me of [a, g1, g2]) { const x = await sse(a.room, me); expect(x.status).toBe(200); all.push(x.s) }
      // A hesabının otaqlarında artıq 3 bağlantı — 4-cü 429 (iştirakçı həddi 3 olsa da)
      expect((await sse(a.room, g2)).status).toBe(429)
      // B hesabı: cəmi 4-ə çatır, sonra 5-ci üçün ən köhnə (A aparıcısı) bağlanır
      const b = await (await c2('/api/read-together/rooms', { cookie: await su(2) })).json()
      const gb = await (await c2('/api/read-together/join', { body: { invite: b.invite, name: 'GB' } })).json()
      const x1 = await sse(b.room, b); expect(x1.status).toBe(200); all.push(x1.s)
      expect(r2.connections()).toBe(4)
      const x2 = await sse(b.room, gb); expect(x2.status).toBe(200); all.push(x2.s)
      await waitFor(() => all[0].events.ended)
      expect(r2.connections()).toBe(4)
    } finally {
      all.forEach((s) => s.close())
      r2.shutdown()
      await s2.close()
    }
  })

  it('24 saat fəaliyyətsiz otaq silinir və axınlara "closed" gedir', async () => {
    const a = await signup()
    const host = await (await call('/api/read-together/rooms', { cookie: a.cookie, body: {} })).json()
    const hs = await stream(host.room, host)
    clock += rt.IDLE_MS - 1000
    router.sweep()
    expect(router.rooms.has(host.room)).toBe(true)
    clock += 2000
    expect(router.sweep()).toBeGreaterThan(0)
    expect(router.rooms.has(host.room)).toBe(false)
    await waitFor(() => hs.events.find((e) => e.event === 'closed'))
    hs.close()
  })

  it('ayə açarı yoxlaması və ad təmizləmə', () => {
    expect(rt.ayahKey('1:7')).toBe('1:7')
    expect(rt.ayahKey('1:8')).toBe(null)
    expect(rt.ayahKey('115:1')).toBe(null)
    expect(rt.ayahKey('<x>')).toBe(null)
    expect(rt.cleanLine('a\u0000b‮  c', 10)).toBe('ab c')
    expect(rt.AYAHS.reduce((s, x) => s + x, 0)).toBe(6236)
  })
})
