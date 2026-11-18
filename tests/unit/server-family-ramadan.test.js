// Server: ailə Ramazan lövhəsi (server/familyRamadan.js) — mövsüm pəncərəsi (Ümmül-Qura, 20 Şəban — 7 Şəvval),
// razılıqla paylaşılan rəqəmlər (gizlətmək silir), ailə xətmi (cüz), iftar növbəsi, Qədr gecələri siyahısı,
// dairədən çıxan üzv lövhədən düşür, keçən mövsümün təmizlənməsi, CASCADE, ixrac.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startApp, require } from './server-together-helpers.js'

const hijri = require('../../server/hijri.js')
const family = require('../../server/family.js')
const fr = require('../../server/familyRamadan.js')

const at = (y, m, d, hh = 9) => { const g = hijri.hijriToGregorian({ year: y, month: m, day: d }); return Date.UTC(g.year, g.month - 1, g.day, hh) }
const RAMADAN_5 = at(1448, 9, 5)
let clock = RAMADAN_5

describe('family ramadan HTTP', () => {
  let A, router
  beforeAll(async () => {
    A = await startApp((app, { db, requireUser }) => {
      app.use('/api', family.createFamilyRouter({ db, requireUser, now: () => clock }))
      router = fr.createFamilyRamadanRouter({ db, requireUser, now: () => clock })
      app.use('/api', router)
    })
  })
  afterAll(() => A.close())

  const json = (r) => r.json()
  const board = async (u) => json(await A.get('/api/family/ramadan', u.cookie))
  /** Sahib + üzvlər ilə dairə */
  async function circle(...names) {
    const [owner, ...rest] = await Promise.all(names.map((n) => A.signup(n)))
    await A.call('/api/family', { cookie: owner.cookie })
    for (const m of rest) {
      const { token } = await json(await A.call('/api/family/invites', { cookie: owner.cookie }))
      await A.call('/api/family/join', { cookie: m.cookie, body: { token } })
    }
    return [owner, ...rest]
  }

  it('seasonOf: Ramazan, hazırlıq (20 Şəban), bayram həftəsi, bağlı', () => {
    const k = (ms) => new Date(ms).toISOString().slice(0, 10)
    const r = fr.seasonOf(k(RAMADAN_5))
    expect(r).toMatchObject({ open: true, phase: 'ramadan', hyear: 1448, hijriDay: 5 })
    expect(r.days).toHaveLength(hijri.hijriMonthLength(1448, 9))
    expect(r.start).toBe(k(at(1448, 9, 1)))
    expect(fr.seasonOf(k(at(1448, 8, 20)))).toMatchObject({ open: true, phase: 'before', hyear: 1448 })
    expect(fr.seasonOf(k(at(1448, 8, 19))).open).toBe(false)
    expect(fr.seasonOf(k(at(1448, 10, 7)))).toMatchObject({ open: true, phase: 'after', hyear: 1448 })
    expect(fr.seasonOf(k(at(1448, 10, 8)))).toMatchObject({ open: false, hyear: 1449 })
    expect(fr.seasonOf('bad').open).toBe(false)
  })

  it('giriş tələb olunur; dairəsiz — circle:null; mövsümdən kənar yazı 409', async () => {
    expect((await A.get('/api/family/ramadan')).status).toBe(401)
    const solo = await A.signup()
    expect((await board(solo)).circle).toBe(null)
    expect((await A.call('/api/family/ramadan/qadr', { cookie: solo.cookie, body: { night: 21, on: true } })).status).toBe(404)
    const [o] = await circle('Kənar')
    clock = at(1448, 7, 10)
    const b = await board(o)
    expect(b.season.open).toBe(false)
    expect(b.season.start).toBe(new Date(at(1448, 9, 1)).toISOString().slice(0, 10))
    expect(b.members).toBeUndefined()
    expect((await json(await A.call('/api/family/ramadan/qadr', { cookie: o.cookie, body: { night: 21, on: true } }))).code).toBe('not_ramadan')
    expect((await json(await A.call('/api/family/ramadan/share', { method: 'PUT', cookie: o.cookie, body: { consent: true, fasts: 1, pages: 1 } }))).code).toBe('not_ramadan')
    clock = RAMADAN_5
  })

  it('rəqəmlər: razılıq, yoxlama, yalnız paylaşanın rəqəmi görünür, gizlətmək silir', async () => {
    const [ana, ali] = await circle('Ana', 'Ali')
    const put = (u, body) => A.call('/api/family/ramadan/share', { method: 'PUT', cookie: u.cookie, body })
    expect((await json(await put(ali, { fasts: 4, pages: 30 }))).code).toBe('consent_required')
    expect((await put(ali, { consent: true, fasts: 31, pages: 1 })).status).toBe(400)
    expect((await put(ali, { consent: true, fasts: 1.5, pages: 1 })).status).toBe(400)
    expect((await put(ali, { consent: true, fasts: 4, pages: -1 })).status).toBe(400)
    expect((await put(ali, { consent: true, fasts: 4, pages: 30 })).status).toBe(200)
    expect((await put(ali, { fasts: 5, pages: 40 })).status).toBe(200)   // ikinci dəfə razılıq lazım deyil
    const b = await board(ana)
    expect(b.members.find((m) => m.id === ali.id).share).toMatchObject({ fasts: 5, pages: 40 })
    expect(b.members.find((m) => m.id === ana.id).share).toBe(null)
    expect(b.consent).toBe(false)
    expect((await board(ali)).mine).toEqual({ fasts: 5, pages: 40 })
    const h = await json(await A.call('/api/family/ramadan/share', { method: 'DELETE', cookie: ali.cookie }))
    expect(h.consent).toBe(false)
    expect((await board(ana)).members.find((m) => m.id === ali.id).share).toBe(null)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM family_ramadan WHERE user_id = ?').get(ali.id).n).toBe(0)
  })

  it('ailə xətmi, iftar növbəsi, Qədr gecələri', async () => {
    const [o, m] = await circle('Ata', 'Qız')
    const juz = (u, j, action) => A.call('/api/family/ramadan/juz', { cookie: u.cookie, body: { juz: j, action } })
    expect((await juz(o, 1, 'take')).status).toBe(200)
    expect((await json(await juz(m, 1, 'take'))).code).toBe('taken')
    expect((await json(await juz(m, 1, 'done'))).code).toBe('not_mine')
    expect((await juz(o, 0, 'take')).status).toBe(400)
    const d = await json(await juz(o, 1, 'done'))
    expect(d.juz[0]).toEqual({ juz: 1, by: 'Ata', mine: true, done: true })
    for (let j = 2; j <= 6; j++) await juz(m, j, 'take')
    expect((await json(await juz(m, 7, 'take'))).code).toBe('too_many')
    await juz(m, 6, 'release')
    expect((await board(o)).juz[5].by).toBe(null)

    const s = fr.seasonOf(new Date(clock).toISOString().slice(0, 10))
    const iftar = (u, day, on) => A.call('/api/family/ramadan/iftar', { cookie: u.cookie, body: { day, on } })
    expect((await iftar(o, '2027-06-01', true)).status).toBe(400)
    expect((await iftar(o, s.days[2], 'y')).status).toBe(400)
    expect((await iftar(o, s.days[2], true)).status).toBe(200)
    expect((await json(await iftar(m, s.days[2], true))).code).toBe('taken')
    await iftar(m, s.days[2], false)                                 // başqasının gününü silə bilmir
    const ib = await board(m)
    expect(ib.iftar[2]).toEqual({ day: s.days[2], n: 3, by: 'Ata', mine: false })
    await iftar(o, s.days[2], false)
    expect((await board(m)).iftar[2].by).toBe(null)

    const qadr = (u, night, on) => A.call('/api/family/ramadan/qadr', { cookie: u.cookie, body: { night, on } })
    expect((await qadr(o, 22, true)).status).toBe(400)
    expect((await qadr(o, 31, true)).status).toBe(400)
    await qadr(o, 27, true); await qadr(m, 27, true); await qadr(m, 21, true); await qadr(m, 21, true)
    const q = (await board(o)).qadr
    expect(q.map((x) => x.night)).toEqual([21, 23, 25, 27, 29])
    expect(q.find((x) => x.night === 27)).toEqual({ night: 27, count: 2, mine: true })
    expect(q.find((x) => x.night === 21)).toEqual({ night: 21, count: 1, mine: false })
    await qadr(m, 27, false)
    expect((await board(o)).qadr.find((x) => x.night === 27).count).toBe(1)
  })

  it('dairədən çıxan üzv lövhədən düşür; təmizləmə; CASCADE; ixrac', async () => {
    const [o, m] = await circle('Sahib', 'Gedən')
    await A.call('/api/family/ramadan/share', { method: 'PUT', cookie: m.cookie, body: { consent: true, fasts: 3, pages: 9 } })
    await A.call('/api/family/ramadan/juz', { cookie: m.cookie, body: { juz: 10, action: 'take' } })
    await A.call('/api/family/ramadan/qadr', { cookie: m.cookie, body: { night: 23, on: true } })
    expect(router.summaryUser(m.id)).toEqual({ sharing: true, juz: 1, iftar: 0, qadr: 1 })
    expect(router.exportUser(m.id).share).toMatchObject({ hyear: 1448, fasts: 3, pages: 9 })
    expect((await A.call('/api/family', { method: 'DELETE', cookie: m.cookie })).status).toBe(200)
    const b = await board(o)
    expect(b.members.map((x) => x.id)).toEqual([o.id])
    expect(b.juz[9].by).toBe(null)
    expect(b.qadr.find((x) => x.night === 23).count).toBe(0)
    // sərbəst cüzü sahib götürə bilir
    expect((await A.call('/api/family/ramadan/juz', { cookie: o.cookie, body: { juz: 10, action: 'take' } })).status).toBe(200)
    router.purge()
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM family_ramadan WHERE user_id = ?').get(m.id).n).toBe(0)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM family_ramadan_qadr WHERE user_id = ?').get(m.id).n).toBe(0)

    // keçən il: hyear < cari → silinir
    const [o2] = await circle('Köhnə')
    await A.call('/api/family/ramadan/qadr', { cookie: o2.cookie, body: { night: 29, on: true } })
    clock = at(1449, 9, 3)
    router.purge()
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM family_ramadan_qadr WHERE user_id = ?').get(o2.id).n).toBe(0)
    expect((await board(o2)).qadr.every((x) => x.count === 0)).toBe(true)
    // hesab silinir → CASCADE
    await A.call('/api/family/ramadan/share', { method: 'PUT', cookie: o2.cookie, body: { consent: true, fasts: 1, pages: 1 } })
    expect((await A.del(o2)).status).toBe(200)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM family_ramadan WHERE user_id = ?').get(o2.id).n).toBe(0)
    clock = RAMADAN_5
  })
})
