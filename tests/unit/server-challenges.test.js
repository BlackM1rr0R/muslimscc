// Server: qrup çağırışları (server/challenges.js) — giriş + CSRF, razılıq, şablon yoxlaması, dəvət tokeni
// (yalnız SHA-256, yenilənəndə köhnə ölür), həddlər, YALNIZ TOPLU lövhə (başqa üzvün kimliyi yoxdur),
// cüz bölgüsü, xatırlatma planlayıcısı (gündə bir dəfə, yalnız push cihazı varsa), təmizləmə, CASCADE, ixrac.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startApp, require } from './server-together-helpers.js'

const ch = require('../../server/challenges.js')

const DAY = 86400000
let clock = Date.UTC(2026, 10, 18, 8, 0)   // UTC: 2026-11-18 08:00
const pushes = []
let subsFor = () => [{ endpoint: 'https://push.example/1', keys: {} }]

describe('challenges HTTP', () => {
  let A, router
  beforeAll(async () => {
    A = await startApp((app, { db, requireUser }) => {
      router = ch.createChallengesRouter({
        db, requireUser, now: () => clock,
        pushSubsOf: (uid) => subsFor(uid), langOf: () => 'az',
        pushSend: async (subs, msg) => { pushes.push({ subs, msg }); return { successCount: 1 } },
      })
      app.use('/api', router)
    })
  })
  afterAll(() => A.close())

  const json = (r) => r.json()
  const create = (u, body) => A.call('/api/challenges', { cookie: u.cookie, body: { template: 'quran_pages', n: 2, startOn: '2026-11-18', days: 30, tz: 'UTC', consent: true, ...body } })
  const join = (u, token, extra = {}) => A.call('/api/challenges/join', { cookie: u.cookie, body: { token, tz: 'UTC', consent: true, ...extra } })
  const tick = (u, id, day, done = true) => A.call(`/api/challenges/${id}/tick`, { cookie: u.cookie, body: { day, done } })

  it('giriş tələb olunur (401); CSRF — 403; razılıq olmadan yaratmaq olmur', async () => {
    expect((await A.get('/api/challenges')).status).toBe(401)
    const u = await A.signup('Ali')
    expect((await A.call('/api/challenges', { cookie: u.cookie, headers: { 'content-type': 'application/json' }, body: {} })).status).toBe(403)
    expect((await A.call('/api/challenges', { cookie: u.cookie, headers: { 'content-type': 'application/json', 'x-requested-with': 'f', origin: 'https://evil.example' }, body: {} })).status).toBe(403)
    const r = await A.get('/api/challenges', u.cookie)
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(await json(r)).toMatchObject({ challenges: [], limits: { members: 50 } })
    expect((await json(await create(u, { consent: undefined }))).code).toBe('consent_required')
  })

  it('yoxlama: şablon, n, başlıq, müddət, başlanğıc pəncərəsi', async () => {
    const u = await A.signup()
    const code = async (body) => (await json(await create(u, body))).code
    expect(await code({ template: 'free_text' })).toBe('bad_template')
    expect(await code({ template: '__proto__' })).toBe('bad_template')
    expect(await code({ n: 0 })).toBe('bad_request')
    expect(await code({ n: 21 })).toBe('bad_request')
    expect(await code({ n: 1.5 })).toBe('bad_request')
    expect(await code({ template: 'custom', title: '' })).toBe('bad_title')
    expect(await code({ template: 'custom', title: 'x'.repeat(61) })).toBe('bad_title')
    expect(await code({ days: 10 })).toBe('bad_request')
    expect(await code({ startOn: '2026-11-10' })).toBe('bad_date')      // 8 gün əvvəl
    expect(await code({ startOn: '2027-01-18' })).toBe('bad_date')      // 61 gün sonra
    expect(await code({ startOn: '2026-02-30' })).toBe('bad_date')
    expect(await code({ tz: 'Mars/Base' })).toBe('bad_tz')
    const ok = await create(u, { template: 'custom', title: '  Hər gün   salavat ', days: 7, startOn: '2026-11-11' })
    expect(ok.status).toBe(201)
    const j = await json(ok)
    expect(j.challenge).toMatchObject({ template: 'custom', title: 'Hər gün salavat', days: 7, startOn: '2026-11-11', endOn: '2026-11-17', owner: true, members: 1 })
    expect(j.challenge.board).toHaveLength(7)
    const k = await json(await create(u, { template: 'khatm', days: undefined, n: undefined }))
    expect(k.challenge.days).toBe(30)
    expect(k.challenge.juz).toHaveLength(30)
  })

  it('dəvət: token yalnız həş; yeniləmə köhnəni öldürür; önizləmə; qoşulma razılıqla', async () => {
    const o = await A.signup('Sahib'), b = await A.signup('Bəxtiyar'), c = await A.signup('Cavid')
    const { challenge, token } = await json(await create(o))
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const rows = A.db.raw.prepare('SELECT * FROM challenges WHERE id = ?').all(challenge.id)
    expect(JSON.stringify(rows)).not.toContain(token)
    expect(rows[0].invite_hash).toMatch(/^[0-9a-f]{64}$/)
    const pv = await json(await A.call('/api/challenges/join/preview', { cookie: b.cookie, body: { token } }))
    expect(pv).toMatchObject({ challenge: { id: challenge.id, members: 1 }, already: false })
    expect((await A.call('/api/challenges/join/preview', { cookie: b.cookie, body: { token: 'x'.repeat(43) } })).status).toBe(404)
    expect((await json(await join(b, token, { consent: false }))).code).toBe('consent_required')
    expect(await json(await join(b, token))).toEqual({ id: challenge.id, already: false })
    expect(await json(await join(b, token))).toEqual({ id: challenge.id, already: true })
    // yalnız sahib yeniləyir
    expect((await A.call(`/api/challenges/${challenge.id}/invite`, { cookie: b.cookie })).status).toBe(403)
    const fresh = await json(await A.call(`/api/challenges/${challenge.id}/invite`, { cookie: o.cookie }))
    expect(fresh.token).not.toBe(token)
    expect((await join(c, token)).status).toBe(404)
    expect((await join(c, fresh.token)).status).toBe(200)
    // üzv olmayan lövhəni görmür
    const x = await A.signup()
    expect((await A.get(`/api/challenges/${challenge.id}`, x.cookie)).status).toBe(404)
  })

  it('lövhə YALNIZ toplu: gün üzrə say, öz işarələrim; başqa üzvün kimliyi yoxdur', async () => {
    const a = await A.signup('Aynur Gizli'), b = await A.signup('Bəhruz'), c = await A.signup('Cəmilə')
    const { challenge, token } = await json(await create(a, { startOn: '2026-11-16', days: 7 }))
    await join(b, token); await join(c, token)
    const id = challenge.id
    expect((await tick(a, id, '2026-11-18')).status).toBe(200)
    expect((await tick(b, id, '2026-11-18')).status).toBe(200)
    await tick(a, id, '2026-11-16')
    // gələcək gün, pəncərədən kənar, səhv format
    expect((await json(await tick(a, id, '2026-11-19'))).code).toBe('bad_day')
    expect((await json(await tick(a, id, '2026-11-15'))).code).toBe('bad_day')
    expect((await tick(a, id, '18.11.2026')).status).toBe(400)
    expect((await A.call(`/api/challenges/${id}/tick`, { cookie: a.cookie, body: { day: '2026-11-18', done: 'yes' } })).status).toBe(400)

    const res = await A.get(`/api/challenges/${id}`, c.cookie)
    const text = await res.text()
    const board = JSON.parse(text).challenge
    expect(board.members).toBe(3)
    expect(board.today).toBe('2026-11-18')
    expect(board.board.find((d) => d.day === '2026-11-18').done).toBe(2)   // "bu gün 3 nəfərdən 2-si"
    expect(board.board.find((d) => d.day === '2026-11-16').done).toBe(1)
    expect(board.mine).toEqual([])
    for (const leak of [a.email, 'Aynur', b.email, 'Bəhruz', `"userId"`, `"user_id"`, `"owner_id"`, 'invite']) expect(text).not.toContain(leak)
    expect(text).not.toMatch(new RegExp(`"id":${a.id}[,}]`))
    const mineA = (await json(await A.get(`/api/challenges/${id}`, a.cookie))).challenge
    expect(mineA.mine).toEqual(['2026-11-16', '2026-11-18'])
    // işarəni geri götürmək
    await tick(a, id, '2026-11-16', false)
    expect((await json(await A.get(`/api/challenges/${id}`, a.cookie))).challenge.mine).toEqual(['2026-11-18'])
    // siyahı xülasəsi
    const list = (await json(await A.get('/api/challenges', b.cookie))).challenges.find((x) => x.id === id)
    expect(list).toMatchObject({ todayDone: 2, mineToday: true, myDays: 1, members: 3, owner: false })
  })

  it('qrup xətmi: cüz götür / tutulub / burax / oxudum / sənin deyil / ən çox 3 açıq; kimlik yoxdur', async () => {
    const a = await A.signup('Xətmçi A'), b = await A.signup('Xətmçi B')
    const { challenge, token } = await json(await create(a, { template: 'khatm', n: undefined }))
    await join(b, token)
    const juz = (u, j, action) => A.call(`/api/challenges/${challenge.id}/juz`, { cookie: u.cookie, body: { juz: j, action } })
    expect((await juz(a, 1, 'take')).status).toBe(200)
    expect((await json(await juz(b, 1, 'take'))).code).toBe('taken')
    expect((await json(await juz(b, 1, 'done'))).code).toBe('not_mine')
    expect((await juz(a, 31, 'take')).status).toBe(400)
    expect((await juz(a, 2, 'steal')).status).toBe(400)
    await juz(a, 2, 'take'); await juz(a, 3, 'take')
    expect((await json(await juz(a, 4, 'take'))).code).toBe('too_many')
    expect((await juz(a, 1, 'done')).status).toBe(200)
    expect((await juz(a, 4, 'take')).status).toBe(200)
    await juz(a, 3, 'release')
    const text = await (await A.get(`/api/challenges/${challenge.id}`, b.cookie)).text()
    const j = JSON.parse(text).challenge.juz
    expect(j[0]).toEqual({ juz: 1, taken: true, done: true, mine: false })
    expect(j[2]).toEqual({ juz: 3, taken: false, done: false, mine: false })
    expect(text).not.toContain('Xətmçi A')
    // adi çağırışda cüz yoxdur
    const plain = await json(await create(a))
    expect((await A.call(`/api/challenges/${plain.challenge.id}/juz`, { cookie: a.cookie, body: { juz: 1, action: 'take' } })).status).toBe(400)
  })

  it('həddlər: ən çox 5 sahiblik, 10 aktiv, 50 üzv', async () => {
    const o = await A.signup()
    for (let i = 0; i < ch.MAX_OWNED; i++) expect((await create(o)).status).toBe(201)
    expect((await json(await create(o))).code).toBe('too_many')
    // aktiv hədd: başqalarının 10 çağırışına qoşulmaq
    const joiner = await A.signup()
    const owners = []
    for (let i = 0; i < 3; i++) owners.push(await A.signup())
    let joined = 0, last
    for (const ow of owners) {
      for (let i = 0; i < 4; i++) {
        const { token } = await json(await create(ow))
        last = await join(joiner, token)
        if (last.status === 200) joined++
      }
    }
    expect(joined).toBe(ch.MAX_ACTIVE)
    expect((await json(last)).code).toBe('too_many')
    // üzv həddi
    const big = await A.signup()
    const { challenge, token } = await json(await create(big))
    A.db.raw.exec('BEGIN')
    const add = A.db.raw.prepare('INSERT INTO challenge_members (challenge_id, user_id, joined_at, consent_at, tz) VALUES (?, ?, 0, 0, ?)')
    const mk = A.db.raw.prepare("INSERT INTO users (email, created_at, updated_at) VALUES (?, 0, 0)")
    for (let i = 0; i < ch.MAX_MEMBERS - 1; i++) {
      const uid = Number(mk.run(`bulk${i}-${challenge.id}@x.test`).lastInsertRowid)
      add.run(challenge.id, uid, 'UTC')
    }
    A.db.raw.exec('COMMIT')
    const late = await A.signup()
    expect((await json(await join(late, token))).code).toBe('full')
  })

  it('çıxmaq, sahibin silməsi, xatırlatma ayarı', async () => {
    const o = await A.signup(), m = await A.signup()
    const { challenge, token } = await json(await create(o))
    await join(m, token)
    const me = (u, body) => A.call(`/api/challenges/${challenge.id}/me`, { method: 'PATCH', cookie: u.cookie, body })
    expect((await me(m, { remindAt: '25:00' })).status).toBe(400)
    expect((await me(m, {})).status).toBe(400)
    expect((await me(m, { remindAt: '20:30', tz: 'Nowhere/X' })).status).toBe(400)
    expect(await json(await me(m, { remindAt: '20:30', tz: 'Asia/Baku' }))).toEqual({ reminder: { at: '20:30', tz: 'Asia/Baku' } })
    expect(await json(await me(m, { remindAt: null }))).toEqual({ reminder: { at: null, tz: 'Asia/Baku' } })
    expect((await json(await A.call(`/api/challenges/${challenge.id}/me`, { method: 'DELETE', cookie: o.cookie }))).code).toBe('owner')
    expect((await A.call(`/api/challenges/${challenge.id}`, { method: 'DELETE', cookie: m.cookie })).status).toBe(403)
    expect((await A.call(`/api/challenges/${challenge.id}/me`, { method: 'DELETE', cookie: m.cookie })).status).toBe(200)
    expect((await A.get(`/api/challenges/${challenge.id}`, m.cookie)).status).toBe(404)
    expect((await A.call(`/api/challenges/${challenge.id}`, { method: 'DELETE', cookie: o.cookie })).status).toBe(200)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM challenges WHERE id = ?').get(challenge.id).n).toBe(0)
  })

  it('xatırlatma: seçilmiş saatdan sonra, işarələməyibsə, push cihazı varsa, gündə bir dəfə', async () => {
    const o = await A.signup(), m = await A.signup()
    const { challenge, token } = await json(await create(o, { startOn: '2026-11-18', days: 7 }))
    await join(m, token)
    await A.call(`/api/challenges/${challenge.id}/me`, { method: 'PATCH', cookie: o.cookie, body: { remindAt: '12:00', tz: 'Asia/Baku' } })   // UTC+4
    await A.call(`/api/challenges/${challenge.id}/me`, { method: 'PATCH', cookie: m.cookie, body: { remindAt: '12:00', tz: 'Asia/Baku' } })
    const mine = () => pushes.filter((p) => p.msg.webpush.link.endsWith(`#c=${challenge.id}`))
    const base = Date.UTC(2026, 10, 18, 7, 59)   // Bakı 11:59
    await router.tick(base)
    expect(mine()).toHaveLength(0)
    // o bu günü işarələyib — ona getmir; m-ə gedir
    clock = Date.UTC(2026, 10, 18, 8, 0)
    await tick(o, challenge.id, '2026-11-18')
    await router.tick(Date.UTC(2026, 10, 18, 8, 5))
    expect(mine()).toHaveLength(1)
    expect(mine()[0].msg.notification.title).toBe('Qrup çağırışı')
    expect(mine()[0].msg.notification.body).toContain('Hər gün 2 səhifə Quran')
    expect(mine()[0].msg.webpush.link).toBe(`/together#c=${challenge.id}`)
    await router.tick(Date.UTC(2026, 10, 18, 9, 0))
    expect(mine()).toHaveLength(1)                 // gündə bir dəfə
    // pəncərədən (3 saat) sonra — növbəti gün gecikmiş tick göndərmir
    await router.tick(Date.UTC(2026, 10, 19, 12, 0))   // Bakı 16:00 > 12:00 + 180 dəq
    expect(mine()).toHaveLength(1)
    // push cihazı yoxdursa — heç nə
    subsFor = () => []
    await router.tick(Date.UTC(2026, 10, 20, 8, 1))
    expect(mine()).toHaveLength(1)
    subsFor = () => [{ endpoint: 'https://push.example/1', keys: {} }]
    // çağırış bitəndən sonra — yox
    await router.tick(Date.UTC(2026, 10, 25, 8, 1))
    expect(mine()).toHaveLength(1)
    clock = Date.UTC(2026, 10, 18, 8, 0)
  })

  it('təmizləmə: bitəndən 30 gün sonra; hesab silinəndə CASCADE; ixrac / xülasə', async () => {
    const o = await A.signup(), m = await A.signup()
    const { challenge, token } = await json(await create(o, { startOn: '2026-11-12', days: 7 }))   // bitir: 11-18
    await join(m, token)
    await tick(m, challenge.id, '2026-11-17')
    const ex = router.exportUser(m.id).find((x) => x.id === challenge.id)
    expect(ex).toMatchObject({ owner: false, myDays: ['2026-11-17'], members: 2 })
    expect(JSON.stringify(router.exportUser(o.id))).not.toMatch(/invite|hash/)
    expect(router.summaryUser(o.id).owned).toBeGreaterThanOrEqual(1)
    expect(router.calendarOf(m.id).find((c) => c.id === challenge.id)).toMatchObject({ startOn: '2026-11-12', endOn: '2026-11-18' })

    // üzvün hesabı silinir → üzvlük və işarələr gedir
    expect((await A.del(m)).status).toBe(200)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM challenge_ticks WHERE user_id = ?').get(m.id).n).toBe(0)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM challenge_members WHERE user_id = ?').get(m.id).n).toBe(0)

    const keep = clock
    clock = Date.UTC(2026, 11, 18, 12)    // 11-18 + 30 gün = 12-18: hələ qalır
    router.purge()
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM challenges WHERE id = ?').get(challenge.id).n).toBe(1)
    clock += DAY
    router.purge()
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM challenges WHERE id = ?').get(challenge.id).n).toBe(0)
    clock = keep

    // sahibin hesabı silinir → çağırış bütövlükdə
    const { challenge: c2 } = await json(await create(o))
    expect((await A.del(o)).status).toBe(200)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM challenges WHERE id = ?').get(c2.id).n).toBe(0)
  })

  it('templateLabel saf funksiyası', () => {
    expect(ch.templateLabel({ template: 'quran_pages', n: 1 }, 'en')).toBe('1 page of Quran daily')
    expect(ch.templateLabel({ template: 'custom', title: 'Salavat' }, 'ru')).toBe('Salavat')
    expect(ch.templateLabel({ template: 'fajr' }, 'xx')).toBe('Fajr on time')
  })
})
