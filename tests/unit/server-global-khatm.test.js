// Server: "Ümmətin Canlı Xətmi" (server/globalKhatm.js) — atomik götürmə (eyni anda çox istifadəçi),
// vaxtı keçən iddia hovuza qayıdır, "Oxudum" üçün sahiblik / minimum vaxt / saat həddi, dövrün
// TƏK BİR DƏFƏ tamamlanması + yeni dövr, SSE yayımı, statistika keşi, ithafın məxfiliyi və silinməsi,
// hesab silinəndə CASCADE, Ramazan sayı, ölkə çoxluğu, push bildirişi.
import { describe, it, expect, afterEach } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const users = require('../../server/users.js')
const auth = require('../../server/auth.js')
const gk = require('../../server/globalKhatm.js')
const personal = require('../../server/personal.js')
const hijri = require('../../server/hijri.js')
const { createMailer } = require('../../server/mailer.js')

const PASS = 'yaxşı-uzun-şifrə-2026'
const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }

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
    })()
    return 200
  })
  return { events, ready, close: () => ctrl.abort() }
}
const waitFor = async (fn, ms = 3000) => {
  const t0 = Date.now()
  for (;;) {
    const v = fn()
    if (v) return v
    if (Date.now() - t0 > ms) throw new Error('timeout')
    await new Promise((r) => setTimeout(r, 10))
  }
}

const open = []
afterEach(async () => { for (const x of open.splice(0)) await x() })

/**
 * Təmiz baza + server. opts → createGlobalKhatmRouter-ə əlavə.
 * realAuth: true — saytın əsl hesab sistemi (server/users.js: scrypt, cookie, CSRF); əks halda sürətli
 * test girişi (cookie "uid=<id>", eyni CSRF qaydası — auth.csrfRejected) — yüzlərlə sorğu üçün.
 */
async function setup({ realAuth = false, ...opts } = {}) {
  const ctx = { clock: Date.UTC(2026, 10, 18, 8, 0) }
  const db = openDb(':memory:')
  const store = users.createUsersStore(db)
  const app = express()
  app.set('trust proxy', 1)
  let requireUser
  if (realAuth) {
    const ur = users.createUsersRouter({
      db, store, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null,
      mailer: createMailer({ apiKey: '', onMessage: () => {} }),
      limits: { loginEmail: 1e5, loginIp: 1e5, register: 1e5, forgotIp: 1e5, forgotEmail: 1e5, token: 1e5, userAction: 1e5 },
    })
    app.use('/api', ur)
    requireUser = ur.requireUser
  } else {
    requireUser = () => (req, res, next) => {
      const m = /(?:^|;\s*)uid=(\d+)/.exec(req.headers.cookie || '')
      const u = m && db.raw.prepare('SELECT id, display_name FROM users WHERE id = ?').get(Number(m[1]))
      if (!u) return res.status(401).json({ error: 'Unauthorized', code: 'unauthenticated' })
      if (auth.csrfRejected(req, [ORIGIN])) return res.status(403).json({ error: 'Forbidden', code: 'forbidden' })
      req.user = u
      next()
    }
  }
  const router = gk.createGlobalKhatmRouter({
    db, requireUser, now: () => ctx.clock, sweepMs: 0, keepaliveMs: 50, activeThrottleMs: 0,
    limits: { complete: { max: 100000, windowMs: 3600e3 }, claim: { max: 100000, windowMs: 3600e3 } },
    ...opts,
  })
  app.use('/api', router)
  const srv = await listen(app)
  open.push(async () => { router.shutdown(); await srv.close() })
  let ipn = 0
  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { 'x-forwarded-for': `10.1.${ipn++ % 250}.${(ipn >> 8) % 250}`, ...headers, ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  let n = 0
  const ins = db.raw.prepare("INSERT INTO users (email, display_name, created_at, updated_at) VALUES (?, 'Oxucu', 1, 1)")
  const signup = async () => {
    if (!realAuth) {
      const id = Number(ins.run(`k${++n}@example.com`).lastInsertRowid)
      return { cookie: `uid=${id}`, id }
    }
    const r = await call('/api/auth/register', { body: { email: `k${++n}@example.com`, password: PASS, displayName: 'Oxucu', lang: 'az' } })
    const j = await r.json()
    if (!j.user) throw new Error(JSON.stringify(j))
    return { cookie: cookieOf(r), id: j.user.id }
  }
  const get = (path, cookie) => call(path, { method: 'GET', cookie, body: undefined }).then((r) => r.json())
  const claim = (u, body = {}) => call('/api/khatm/claim', { cookie: u.cookie, body })
  const complete = (u, page, headers) => call('/api/khatm/complete', { cookie: u.cookie, body: { page }, ...(headers ? { headers: { ...H, ...headers } } : {}) })
  return { ctx, db, srv, router, call, signup, get, claim, complete }
}

/** Bir istifadəçi ilə n səhifə götür + oxu (saat hər dəfə 41 san irəliləyir) */
async function readPages(k, u, n, headers) {
  let last = null
  for (let i = 0; i < n; i++) {
    const c = await (await k.claim(u)).json()
    k.ctx.clock += 41e3
    last = await (await k.complete(u, c.claim.page, headers)).json()
  }
  return last
}

describe('ümmətin xətmi — götürmə', () => {
  it('girişsiz 401; CSRF başlığı olmadan 403; ilk səhifə 1-dir (saytın əsl hesab sistemi ilə)', async () => {
    const k = await setup({ realAuth: true })
    expect((await k.call('/api/khatm/claim', { body: {} })).status).toBe(401)
    const u = await k.signup()
    expect((await k.call('/api/khatm/claim', { cookie: u.cookie, headers: { 'content-type': 'application/json' }, body: {} })).status).toBe(403)
    const r = await k.claim(u)
    expect(r.status).toBe(201)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const j = await r.json()
    expect(j).toMatchObject({ existing: false, claim: { page: 1, roundNo: 1 } })
    expect(j.claim.expiresAt - j.claim.claimedAt).toBe(gk.CLAIM_MS)
    expect(j.claim.readyAt - j.claim.claimedAt).toBe(gk.MIN_READ_MS)
    // bir istifadəçinin bir aktiv səhifəsi var — təkrar götürmə eyni səhifəni qaytarır
    const again = await k.claim(u)
    expect(again.status).toBe(200)
    expect((await again.json()).claim.page).toBe(1)
  })

  it('eyni anda 40 istifadəçi — hamısı FƏRQLİ səhifə alır (1…40)', async () => {
    const k = await setup()
    const us = await Promise.all(Array.from({ length: 40 }, () => k.signup()))
    const res = await Promise.all(us.map((u) => k.claim(u).then((r) => r.json())))
    const pages = res.map((r) => r.claim.page).sort((a, b) => a - b)
    expect(new Set(pages).size).toBe(40)
    expect(pages).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
    const s = await k.get('/api/khatm/state')
    expect(s).toMatchObject({ roundNo: 1, readCount: 0, active: 40, total: 604 })
  })

  it('30 dəqiqədən sonra iddia hovuza qayıdır; köhnə sahib onu tamamlaya bilmir', async () => {
    const k = await setup()
    const a = await k.signup(), b = await k.signup()
    expect((await (await k.claim(a)).json()).claim.page).toBe(1)
    k.ctx.clock += gk.CLAIM_MS + 1000
    expect((await (await k.claim(b)).json()).claim.page).toBe(1)
    const r = await k.complete(a, 1)
    expect(r.status).toBe(404)   // a-nın iddiası silinib (səhifə artıq b-nindir)
    // sweep: vaxtı keçmiş iddialar silinir, aktiv say düşür
    k.ctx.clock += gk.CLAIM_MS + 1000
    expect(k.router.sweep()).toBe(1)
    expect((await k.get('/api/khatm/state')).active).toBe(0)
  })

  it('ithaf 40 simvola qədər təmizlənir; yanlış xana — 400; xana 1°-yə yuvarlaqlaşır', async () => {
    const k = await setup()
    const u = await k.signup()
    expect((await k.claim(u, { cell: { lat: 'x', lon: 2 } })).status).toBe(400)
    expect((await k.claim(u, { dedication: 5 })).status).toBe(400)
    const j = await (await k.claim(u, { dedication: `  Ana‮ ${'a'.repeat(80)}`, cell: { lat: 40.41, lon: 49.87 } })).json()
    expect([...j.claim.dedication].length).toBe(40)
    expect(j.claim.dedication.startsWith('Ana a')).toBe(true)
    expect(j.claim.cell).toEqual({ lat: 40, lon: 50 })
    expect(gk.cellOf({ lat: 89.9, lon: 179.6 })).toBe('89,-180')
    expect(gk.cellOf({ lat: 91, lon: 0 })).toBe(null)
  })
})

describe('ümmətin xətmi — "Oxudum"', () => {
  it('sahiblik, minimum 40 san, iddiasız 404, buraxma', async () => {
    const k = await setup()
    const u = await k.signup(), v = await k.signup()
    expect((await k.complete(u, 1)).status).toBe(404)
    await k.claim(u)
    const early = await k.complete(u, 1)
    expect(early.status).toBe(425)
    expect((await early.json()).retryAfterMs).toBe(gk.MIN_READ_MS)
    k.ctx.clock += 41e3
    expect((await k.complete(u, 2)).status).toBe(409)     // başqa səhifə
    await k.claim(v)                                       // v → səhifə 2
    expect((await k.complete(v, 1)).status).toBe(409)     // u-nun səhifəsi
    const ok = await (await k.complete(u, 1)).json()
    expect(ok).toMatchObject({ ok: true, page: 1, readCount: 1, roundCompleted: null })
    expect((await k.complete(u, 1)).status).toBe(404)     // ikinci dəfə — iddia yoxdur
    // buraxma: səhifə hovuza qayıdır
    expect(await (await k.call('/api/khatm/release', { cookie: v.cookie })).json()).toMatchObject({ released: true })
    expect((await (await k.claim(u)).json()).claim.page).toBe(2)
    const st = await k.get('/api/khatm/state')
    expect(Buffer.from(st.bits, 'base64')[0] & 1).toBe(1)
  })

  it('istifadəçi üzrə saatda N səhifə həddi', async () => {
    const k = await setup({ limits: { complete: { max: 2, windowMs: 3600e3 }, claim: { max: 1000, windowMs: 3600e3 } } })
    const u = await k.signup()
    await readPages(k, u, 2)
    const c = await (await k.claim(u)).json()
    k.ctx.clock += 41e3
    expect((await k.complete(u, c.claim.page)).status).toBe(429)
    k.ctx.clock += 3600e3
    // saat keçdi, amma iddianın 30 dəqiqəsi də keçdi → yeni iddia
    const c2 = await (await k.claim(u)).json()
    k.ctx.clock += 41e3
    expect((await k.complete(u, c2.claim.page)).status).toBe(200)
  })
})

describe('ümmətin xətmi — dövrün tamamlanması', () => {
  it('604 səhifə → dövr TƏK BİR DƏFƏ tamamlanır, növbəti dövr açılır; SSE hamıya yayır; ithaf yalnız say', async () => {
    const pushes = []
    const k = await setup({
      pushSubsOf: (uid) => (uid === 1 ? [{ endpoint: 'https://push.example/1', keys: { p256dh: 'p', auth: 'a' } }] : []),
      langOf: () => 'az',
      pushSend: async (subs, msg) => { pushes.push({ subs, msg }); return { successCount: 1 } },
    })
    const a = await k.signup(), b = await k.signup()
    const s1 = openStream(`${k.srv.url}/api/khatm/live`)
    const s2 = openStream(`${k.srv.url}/api/khatm/live`)
    expect(await s1.ready).toBe(200)
    expect(await s2.ready).toBe(200)
    await waitFor(() => s1.events.find((e) => e.event === 'hello') && s2.events.find((e) => e.event === 'hello'))
    expect(s1.events[0].data).toMatchObject({ roundNo: 1, readCount: 0, total: 604 })

    // a: ithaflı, yerli (xana) səhifə; ölkə CF-IPCountry-dən
    const c = await (await k.claim(a, { dedication: 'Atam Əli', cell: { lat: 40.4, lon: 49.9 } })).json()
    k.ctx.clock += 41e3
    await k.complete(a, c.claim.page, { 'cf-ipcountry': 'AZ' })
    const pageEv = await waitFor(() => s2.events.find((e) => e.event === 'page'))
    expect(pageEv.data).toMatchObject({ page: 1, cell: { lat: 40, lon: 50 }, roundNo: 1, readCount: 1 })
    expect(s1.events.some((e) => e.event === 'page')).toBe(true)
    // xana yalnız iddianın ömründə — tamamlanandan sonra bazada yoxdur
    expect(k.db.raw.prepare('SELECT COUNT(*) AS n FROM khatm_claims WHERE cell IS NOT NULL OR dedication IS NOT NULL').get().n).toBe(0)

    // ithaf yalnız sahibinə görünür
    const meA = await k.get('/api/khatm/me', a.cookie)
    expect(meA.dedications).toMatchObject([{ name: 'Atam Əli', roundNo: 1, page: 1, completed: false }])
    const meB = await k.get('/api/khatm/me', b.cookie)
    expect(JSON.stringify(meB)).not.toContain('Atam')
    for (const path of ['/api/khatm/state', '/api/khatm/stats', '/api/khatm/rounds']) expect(JSON.stringify(await k.get(path))).not.toContain('Atam')

    // b: TR, XX (naməlum) — qalan səhifələr; son iki səhifəni a və b eyni anda bitirir
    await readPages(k, b, 300, { 'cf-ipcountry': 'TR' })
    await readPages(k, a, 301, { 'cf-ipcountry': 'XX' })
    const ca = await (await k.claim(a)).json()
    const cb = await (await k.claim(b)).json()
    expect([ca.claim.page, cb.claim.page].sort((x, y) => x - y)).toEqual([603, 604])
    k.ctx.clock += 41e3
    const [ra, rb] = await Promise.all([k.complete(a, ca.claim.page).then((r) => r.json()), k.complete(b, cb.claim.page).then((r) => r.json())])
    const finished = [ra, rb].filter((x) => x.roundCompleted)
    expect(finished).toHaveLength(1)
    expect(finished[0].roundCompleted).toMatchObject({ roundNo: 1, participants: 2, countries: 2, dedications: 1, nextRoundNo: 2 })

    const roundEv = await waitFor(() => s1.events.find((e) => e.event === 'round'))
    expect(roundEv.data).toMatchObject({ roundNo: 1, participants: 2, countries: 2, dedications: 1 })
    expect(roundEv.data.durationMs).toBeGreaterThan(0)
    expect(roundEv.data.roundId).toBeUndefined()
    expect(s2.events.filter((e) => e.event === 'round')).toHaveLength(1)
    expect(JSON.stringify(s1.events)).not.toContain('Atam')

    // bazada: bir tamamlanmış (no 1) + bir açıq (no 2); iddialar yekunlaşdırılıb silinib
    const rows = k.db.raw.prepare('SELECT no, completed_at FROM khatm_rounds ORDER BY no').all()
    expect(rows.map((r) => [r.no, r.completed_at != null])).toEqual([[1, true], [2, false]])
    expect(k.db.raw.prepare('SELECT COUNT(*) AS n FROM khatm_claims').get().n).toBe(0)
    expect(await k.get('/api/khatm/state')).toMatchObject({ roundNo: 2, readCount: 0 })
    expect((await (await k.claim(a)).json()).claim).toMatchObject({ page: 1, roundNo: 2 })

    // arxiv + "mənim dövrlərim"
    const arch = await k.get('/api/khatm/rounds')
    expect(arch).toMatchObject({ total: 1, page: 1, pages: 1 })
    expect(arch.rounds[0]).toMatchObject({ no: 1, participants: 2, countries: 2, dedications: 1 })
    const me2 = await k.get('/api/khatm/me', b.cookie)
    expect(me2.rounds[0]).toMatchObject({ no: 1, myPages: 301 })
    expect(me2.rounds[0].completedAt).toBeTruthy()

    // push: yalnız push-u hesaba bağlı olan iştirakçıya (a = id 1), bir dəfə
    await waitFor(() => pushes.length === 1)
    expect(pushes[0].msg.notification.body).toContain('№1')
    expect(pushes[0].msg.webpush.fcmOptions.link).toBe('https://muslims.cc/khatm')
    expect(k.db.raw.prepare('SELECT COUNT(*) AS n FROM khatm_participants WHERE notified = 1').get().n).toBe(2)

    // ithaflar dövr bitəndən 30 gün sonra silinir
    expect(k.router.purge().dedications).toBe(0)
    k.ctx.clock += gk.DEDICATION_KEEP_MS + 1000
    expect(k.router.purge().dedications).toBe(1)
    expect((await k.get('/api/khatm/me', a.cookie)).dedications).toEqual([])
    expect((await k.get('/api/khatm/rounds')).rounds[0].dedications).toBe(1)   // say qalır
    s1.close(); s2.close()
  }, 60000)
})

describe('ümmətin xətmi — canlı axın, statistika, məxfilik', () => {
  it('SSE: IP başına bağlantı həddi; "active" hadisəsi götürmədə', async () => {
    const k = await setup()
    const streams = []
    for (let i = 0; i < gk.MAX_CONN_PER_IP; i++) {
      const s = openStream(`${k.srv.url}/api/khatm/live`)
      expect(await s.ready).toBe(200)
      streams.push(s)
    }
    const over = await fetch(`${k.srv.url}/api/khatm/live`)
    expect(over.status).toBe(429)
    const res = await fetch(`${k.srv.url}/api/khatm/live`, { headers: { 'x-forwarded-for': '10.9.9.9' } }).catch(() => null)
    // trust proxy 1 — başqa IP ayrıca sayılır
    expect(res && res.status).toBe(200)
    expect(res.headers.get('x-accel-buffering')).toBe('no')
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    await res.body.cancel()
    const u = await k.signup()
    await k.claim(u)
    const ev = await waitFor(() => streams[0].events.find((e) => e.event === 'active'))
    expect(ev.data).toMatchObject({ roundNo: 1, active: 1, readCount: 0 })
    for (const s of streams) s.close()
    await waitFor(() => k.router.connections() === 0)
  })

  it('stats: qısa keş (Cache-Control) — TTL ərzində köhnə, sonra təzə', async () => {
    const k = await setup({ statsTtlMs: 15000 })
    const r = await k.call('/api/khatm/stats', { method: 'GET' })
    expect(r.headers.get('cache-control')).toBe('public, max-age=15')
    expect(await r.json()).toMatchObject({ roundNo: 1, readCount: 0, active: 0, rounds: 0 })
    const u = await k.signup()
    // keşi götürmə özü təzələyir (canlı say dəyişdi)
    await k.claim(u)
    expect((await k.get('/api/khatm/stats')).active).toBe(1)
    // başqa yolla dəyişiklik (məs. baza) TTL ərzində görünmür
    k.db.raw.prepare('DELETE FROM khatm_claims').run()
    expect((await k.get('/api/khatm/stats')).active).toBe(1)
    k.ctx.clock += 16000
    expect((await k.get('/api/khatm/stats')).active).toBe(0)
  })

  it('/me: "Sevdiklərim üçün dua" adları yalnız həmin istifadəçi üçün oxunur', async () => {
    const asked = []
    const k = await setup({ lovedNames: (uid) => { asked.push(uid); return uid === 1 ? ['Nənəm Səkinə', 'Nənəm Səkinə', 7] : [] } })
    const a = await k.signup(), b = await k.signup()
    expect((await k.get('/api/khatm/me', a.cookie)).loved).toEqual(['Nənəm Səkinə'])
    expect((await k.get('/api/khatm/me', b.cookie)).loved).toEqual([])
    expect(asked).toEqual([a.id, b.id])
    expect((await k.call('/api/khatm/me', { method: 'GET' })).status).toBe(401)
  })

  it('personal.js lovedNamesOf / pushSubsForUser — yalnız verilən istifadəçinin sətirləri', async () => {
    const k = await setup()
    const a = await k.signup(), b = await k.signup()
    personal.createPersonalStore(k.db)
    const ins = k.db.raw.prepare(`INSERT INTO personal_loved (user_id, name, passed_on, created_at, updated_at) VALUES (?, ?, '2020-01-01', 1, 1)`)
    ins.run(a.id, 'Atam'); ins.run(b.id, 'Anam')
    expect(personal.lovedNamesOf(k.db, a.id)).toEqual(['Atam'])
    expect(personal.lovedNamesOf(k.db, b.id)).toEqual(['Anam'])
    expect(personal.pushSubsForUser(k.db, a.id)).toEqual([])
    expect(personal.prefLangOf(k.db, a.id)).toBe('en')
  })

  it('hesab silinəndə iştirak və ithaflar silinir, tamamlanmış səhifə anonim qalır, açıq iddia təmizlənir', async () => {
    const k = await setup()
    const a = await k.signup(), b = await k.signup()
    const c = await (await k.claim(a, { dedication: 'Anam' })).json()
    k.ctx.clock += 41e3
    await k.complete(a, c.claim.page)
    await k.claim(a)          // açıq iddia (səhifə 2)
    await k.claim(b)          // səhifə 3
    k.db.raw.prepare('DELETE FROM users WHERE id = ?').run(a.id)
    const q = (sql) => k.db.raw.prepare(sql).get().n
    expect(q('SELECT COUNT(*) AS n FROM khatm_participants')).toBe(0)
    expect(q('SELECT COUNT(*) AS n FROM khatm_dedications')).toBe(0)
    expect(q('SELECT COUNT(*) AS n FROM khatm_claims WHERE user_id IS NULL AND completed_at IS NOT NULL')).toBe(1)
    k.router.sweep()
    expect(q('SELECT COUNT(*) AS n FROM khatm_claims WHERE user_id IS NULL')).toBe(1)   // yalnız tamamlanmış
    const st = await k.get('/api/khatm/state')
    expect(st).toMatchObject({ readCount: 1, active: 1 })
    // səhifə 2 yenidən hovuzdadır
    const d = await k.signup()
    expect((await (await k.claim(d)).json()).claim.page).toBe(2)
  })
})

describe('ümmətin xətmi — arxiv və Ramazan', () => {
  it('Ramazanda tamamlanan dövrlər sayılır; səhifələmə', async () => {
    const k = await setup()
    const rr = gk.ramadanRange(k.ctx.clock)
    // 2026-11-18 → hicri 1448 Cümadəl-ula; son Ramazan — 1447 (2026-fevral/mart)
    expect(rr.year).toBe(1447)
    expect(rr.current).toBe(false)
    const g = hijri.hijriToGregorian({ year: 1447, month: 9, day: 1 })
    expect(rr.start).toBe(Date.UTC(g.year, g.month - 1, g.day))
    const ins = k.db.raw.prepare('INSERT INTO khatm_rounds (no, started_at, completed_at, participants, countries_json, dedications) VALUES (?, ?, ?, ?, ?, ?)')
    // mövcud açıq dövr no 1 — arxivdəkiləri 100+ nömrə ilə əlavə et
    ins.run(101, rr.start, rr.start + 3600e3, 5, '["AZ","TR"]', 0)
    ins.run(102, rr.start + 86400e3, rr.start + 2 * 86400e3, 9, '["AZ"]', 2)
    ins.run(103, rr.start - 5 * 86400e3, rr.start - 86400e3, 3, '[]', 0)   // Ramazandan əvvəl
    for (let i = 0; i < 20; i++) ins.run(200 + i, rr.end + i * 1000, rr.end + i * 1000 + 500, 1, '[]', 0)
    const p1 = await k.get('/api/khatm/rounds')
    expect(p1).toMatchObject({ total: 23, pages: 2, page: 1, ramadan: { year: 1447, count: 2, current: false } })
    expect(p1.rounds).toHaveLength(20)
    expect(p1.rounds[0].no).toBe(219)
    const p2 = await k.get('/api/khatm/rounds?page=2')
    expect(p2.rounds.map((r) => r.no)).toEqual([103, 102, 101])
    expect(p2.rounds[2]).toMatchObject({ countries: 2, participants: 5, durationMs: 3600e3 })
    expect((await k.get('/api/khatm/rounds?page=99')).page).toBe(2)
    // Ramazanın içində — current: true
    k.ctx.clock = rr.start + 3 * 86400e3
    expect(gk.ramadanRange(k.ctx.clock)).toMatchObject({ year: 1447, current: true })
  })

  it('encodeBits: səhifə p → bit p-1', () => {
    const b = Buffer.from(gk.encodeBits([1, 9, 604]), 'base64')
    expect(b.length).toBe(76)
    expect(b[0]).toBe(1)
    expect(b[1]).toBe(1)
    expect(b[75]).toBe(1 << 3)
  })
})
