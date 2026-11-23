// Server: P3 — gizli dua dostu (duaFriend.js: cütləmə, kimlik gizliliyi, gündə bir, push gecikməsi, çıxış,
// dövrün sonu) və Həcc ailə izləyicisi (hajjJourney.js: mərhələlər, ailə dairəsi, gizli keçid, ETag, fasilə, ömür).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startApp, require, H } from './server-together-helpers.js'

const family = require('../../server/family.js')
const duaFriend = require('../../server/duaFriend.js')
const hajj = require('../../server/hajjJourney.js')

// 2026-11-23 bazar ertəsi, 10:00 UTC
let clock = Date.UTC(2026, 10, 23, 10, 0)
const now = () => clock

describe('pairUp (saf cütləmə)', () => {
  const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length] }
  it('hamı cütlənir, ən çox biri gözləyir; heç kim iki dəfə yoxdur', () => {
    const ms = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, lang: i % 3 === 0 ? 'az' : 'en' }))
    const { pairs, waiting } = duaFriend.pairUp(ms, seq([0.1, 0.7, 0.3, 0.9, 0.5]))
    const ids = pairs.flat()
    expect(pairs.length).toBe(4)
    expect(waiting.length).toBe(1)
    expect(new Set([...ids, ...waiting]).size).toBe(9)
    for (const [a, b] of pairs) expect(a).not.toBe(b)
  })
  it('eyni dil üstündür', () => {
    const ms = [{ id: 1, lang: 'az' }, { id: 2, lang: 'en' }, { id: 3, lang: 'az' }, { id: 4, lang: 'en' }]
    const { pairs } = duaFriend.pairUp(ms, seq([0.2, 0.8]))
    const langOf = Object.fromEntries(ms.map((m) => [m.id, m.lang]))
    for (const [a, b] of pairs) expect(langOf[a]).toBe(langOf[b])
  })
  it('tək qalanlar dillər arası cütlənir', () => {
    const { pairs, waiting } = duaFriend.pairUp([{ id: 1, lang: 'az' }, { id: 2, lang: 'ru' }], Math.random)
    expect(pairs).toHaveLength(1)
    expect(waiting).toHaveLength(0)
  })
  it('əvvəlki dostla alternativ varsa təkrar cütlənmir; yoxdursa cütlənir', () => {
    for (let k = 0; k < 30; k++) {
      const ms = [{ id: 1, lang: 'en', prev: 2 }, { id: 2, lang: 'en', prev: 1 }, { id: 3, lang: 'en', prev: 4 }, { id: 4, lang: 'en', prev: 3 }]
      const { pairs } = duaFriend.pairUp(ms, Math.random)
      for (const [a, b] of pairs) expect([a, b].sort().join()).not.toMatch(/^(1,2|3,4)$/)
    }
    const { pairs } = duaFriend.pairUp([{ id: 1, lang: 'en', prev: 2 }, { id: 2, lang: 'en', prev: 1 }])
    expect(pairs).toEqual([[expect.any(Number), expect.any(Number)]])
  })
  it('təkrar və yararsız girişlər atılır', () => {
    const { pairs, waiting } = duaFriend.pairUp([{ id: 1, lang: 'en' }, { id: 1, lang: 'en' }, null, { id: 'x' }])
    expect(pairs).toHaveLength(0)
    expect(waiting).toEqual([1])
  })
})

describe('P3 HTTP', () => {
  let app
  const pushes = []
  beforeAll(async () => {
    app = await startApp((ex, { db, requireUser }) => {
      const fam = family.createFamilyRouter({ db, requireUser, now })
      ex.use('/api', fam)
      const df = duaFriend.createDuaFriendRouter({
        db, requireUser, now, rnd: Math.random,
        pushSubsOf: (uid) => [{ endpoint: `https://fcm.googleapis.com/x${uid}`, keys: {} }],
        pushSend: async (subs, msg) => { pushes.push({ subs, msg }) },
        log: { error: () => {} },
      })
      ex.use('/api', df)
      const hj = hajj.createHajjJourneyRouter({ db, requireUser, allowedOrigins: ['https://muslims.cc'], now, viewLimit: { max: 1000, windowMs: 60000 } })
      ex.use('/api', hj)
      return { df, hj }
    })
  })
  afterAll(() => app.close())
  const verify = (u) => app.db.raw.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(u.id)
  const j = (r) => r.json()

  describe('gizli dua dostu', () => {
    let a, b, c
    beforeAll(async () => {
      a = await app.signup('Ayşə'); b = await app.signup('Bilal'); c = await app.signup('Cəmilə')
    })

    it('təsdiqsiz e-poçt → verify_email; razılıqsız → consent_required; yararsız dil/qurşaq → 400', async () => {
      let r = await app.call('/api/dua-friend/join', { cookie: a.cookie, body: { consent: true } })
      expect(r.status).toBe(403)
      expect((await j(r)).code).toBe('verify_email')
      verify(a); verify(b); verify(c)
      r = await app.call('/api/dua-friend/join', { cookie: a.cookie, body: {} })
      expect((await j(r)).code).toBe('consent_required')
      r = await app.call('/api/dua-friend/join', { cookie: a.cookie, body: { consent: true, lang: 'EN<script>' } })
      expect(r.status).toBe(400)
      r = await app.call('/api/dua-friend/join', { cookie: a.cookie, body: { consent: true, tz: 'Not/AZone' } })
      expect(r.status).toBe(400)
      r = await app.call('/api/dua-friend/join', { cookie: a.cookie })   // gövdə yoxdur
      expect((await j(r)).code).toBe('consent_required')
    })

    it('CSRF başlığı olmadan rədd', async () => {
      const r = await app.call('/api/dua-friend/join', { cookie: a.cookie, body: { consent: true }, headers: { 'content-type': 'application/json' } })
      expect(r.status).toBe(403)
    })

    it('qoşulma → cütləmə tick-dədir (dərhal yox); cavabda dostun kimliyi yoxdur', async () => {
      for (const u of [a, b]) {
        const r = await app.call('/api/dua-friend/join', { cookie: u.cookie, body: { consent: true, lang: 'az', tz: 'Asia/Baku' } })
        expect(r.status).toBe(200)
      }
      let s = await j(await app.get('/api/dua-friend', a.cookie))
      expect(s).toMatchObject({ joined: true, pair: null, verified: true })
      expect(app.df.pairTick()).toEqual({ ended: 0, paired: 1 })
      s = await j(await app.get('/api/dua-friend', a.cookie))
      expect(s.pair).toMatchObject({ prayedToday: false, forMeToday: false, endsAt: clock + duaFriend.ROUND_MS })
      const text = JSON.stringify(s)
      for (const leak of [b.email, 'Bilal', 'Asia/Baku', '"id"', 'partner', 'email', 'name']) expect(text).not.toContain(leak)
      expect(Object.keys(s.pair).sort()).toEqual(['endsAt', 'forMeToday', 'prayedToday', 'startedAt'])
    })

    it('gündə bir dəfə; dostun gələn qutusu; seen; push gecikmə ilə və yerli saatda', async () => {
      let r = await j(await app.call('/api/dua-friend/pray', { cookie: a.cookie }))
      expect(r).toEqual({ ok: true, already: false })
      r = await j(await app.call('/api/dua-friend/pray', { cookie: a.cookie }))
      expect(r).toEqual({ ok: true, already: true })
      let sb = await j(await app.get('/api/dua-friend', b.cookie))
      expect(sb.pair.forMeToday).toBe(true)
      expect(sb.inbox).toEqual([{ day: '2026-11-23' }])
      const sa = await j(await app.get('/api/dua-friend', a.cookie))
      expect(sa.pair.prayedToday).toBe(true)
      expect(sa.pair.forMeToday).toBe(false)
      expect(sa.inbox).toEqual([])
      // push: 10 dəq gecikmə
      expect(await app.df.tick()).toBe(0)
      clock += 11 * 60e3
      expect(await app.df.tick()).toBe(1)
      expect(pushes).toHaveLength(1)
      expect(pushes[0].subs[0].endpoint).toContain(`x${b.id}`)
      expect(pushes[0].msg.notification.body).toBe('Bu gün kimsə sizin üçün dua etdi.')
      expect(JSON.stringify(pushes[0].msg)).not.toMatch(/Ayşə|@example/)
      expect(await app.df.tick()).toBe(0)   // təkrar yox
      await app.call('/api/dua-friend/seen', { cookie: b.cookie })
      sb = await j(await app.get('/api/dua-friend', b.cookie))
      expect(sb.inbox).toEqual([])
      expect(sb.pair.forMeToday).toBe(true)
    })

    it('gecə push göndərilmir (yerli 08–21), sonra göndərilir', async () => {
      clock = Date.UTC(2026, 10, 23, 20, 0)   // Bakı 00:00 → yeni gün
      const r = await j(await app.call('/api/dua-friend/pray', { cookie: b.cookie }))
      expect(r.already).toBe(false)
      clock += 30 * 60e3
      expect(await app.df.tick()).toBe(0)
      clock = Date.UTC(2026, 10, 24, 5, 0)    // Bakı 09:00
      expect(await app.df.tick()).toBe(1)
      expect(pushes.at(-1).subs[0].endpoint).toContain(`x${a.id}`)
    })

    it('ixrac: dostun kimliyi yoxdur', async () => {
      const x = app.df.exportUser(a.id)
      expect(x.member).toMatchObject({ lang: 'az', tz: 'Asia/Baku' })
      expect(x.myDuaDays).toEqual(['2026-11-23'])
      expect(x.duaForMeAt).toHaveLength(1)
      expect(JSON.stringify(x)).not.toContain(String(b.email))
      expect(app.df.summaryUser(a.id)).toEqual({ joined: true, paired: true })
    })

    it('çıxış: cüt silinir, dost yenidən cütlənir (növbəti tick)', async () => {
      await app.call('/api/dua-friend/join', { cookie: c.cookie, body: { consent: true, lang: 'en', tz: 'UTC' } })
      const r = await app.call('/api/dua-friend', { method: 'DELETE', cookie: a.cookie })
      expect(r.status).toBe(200)
      expect((await j(await app.get('/api/dua-friend', a.cookie))).joined).toBe(false)
      expect((await j(await app.get('/api/dua-friend', b.cookie))).pair).toBe(null)
      expect(app.db.raw.prepare('SELECT COUNT(*) AS n FROM dua_friend_marks').get().n).toBe(0)
      expect(app.df.pairTick().paired).toBe(1)   // b + c (dillər arası)
      expect((await j(await app.get('/api/dua-friend', c.cookie))).pair).not.toBe(null)
      const p = await app.call('/api/dua-friend/pray', { cookie: a.cookie })
      expect((await j(p)).code).toBe('not_joined')
    })

    it('dövr bitəndə cüt silinir və yenidən cütlənir', async () => {
      clock += duaFriend.ROUND_MS + 1000
      expect((await j(await app.get('/api/dua-friend', b.cookie))).pair).toBe(null)
      const t = app.df.pairTick()
      expect(t.ended).toBe(1)
      expect(t.paired).toBe(1)   // yalnız ikisi var — yenə cütlənir
      expect(app.db.raw.prepare('SELECT prev_id FROM dua_friend_members WHERE user_id = ?').get(b.id).prev_id).toBe(c.id)
    })

    it('hesab silinəndə hər şey CASCADE', async () => {
      await app.del(c)
      expect(app.db.raw.prepare('SELECT COUNT(*) AS n FROM dua_friend_pairs').get().n).toBe(0)
      expect(app.db.raw.prepare('SELECT COUNT(*) AS n FROM dua_friend_members WHERE user_id = ?').get(c.id).n).toBe(0)
    })
  })

  describe('Həcc ailə izləyicisi', () => {
    let p, f, o, inviteToken
    beforeAll(async () => {
      clock = Date.UTC(2026, 4, 20, 8, 0)
      p = await app.signup('Zəvvar'); f = await app.signup('Ana'); o = await app.signup('Kənar')
      await app.call('/api/family', { cookie: p.cookie })
      inviteToken = (await j(await app.call('/api/family/invites', { cookie: p.cookie }))).token
      await app.call('/api/family/join', { cookie: f.cookie, body: { token: inviteToken } })
    })

    it('başlat: razılıq, növ və ad yoxlanır; bir aktiv səfər', async () => {
      let r = await app.call('/api/hajj-journey', { cookie: p.cookie, body: { kind: 'hajj' } })
      expect((await j(r)).code).toBe('consent_required')
      r = await app.call('/api/hajj-journey', { cookie: p.cookie, body: { kind: 'tour', consent: true } })
      expect((await j(r)).code).toBe('bad_kind')
      r = await app.call('/api/hajj-journey', { cookie: p.cookie, body: { kind: 'hajj', consent: true, name: 'x'.repeat(41) } })
      expect((await j(r)).code).toBe('bad_name')
      r = await app.call('/api/hajj-journey', { cookie: p.cookie })
      expect(r.status).toBe(400)
      r = await app.call('/api/hajj-journey', { cookie: p.cookie, body: { kind: 'hajj', consent: true, name: 'Atam', family: true } })
      expect(r.status).toBe(201)
      expect((await j(r)).journey).toMatchObject({ kind: 'hajj', name: 'Atam', stage: null, family: true, paused: false, link: false, expiresAt: clock + hajj.TTL_MS })
      r = await app.call('/api/hajj-journey', { cookie: p.cookie, body: { kind: 'umrah', consent: true } })
      expect(r.status).toBe(409)
    })

    it('mərhələ: yalnız növün siyahısından; tarixçə; yer sahəsi yoxdur', async () => {
      let r = await app.call('/api/hajj-journey/stage', { method: 'PUT', cookie: p.cookie, body: { stage: 'tawaf' } })
      expect((await j(r)).code).toBe('bad_stage')     // Ümrə mərhələsi Həcdə yox
      r = await app.call('/api/hajj-journey/stage', { method: 'PUT', cookie: p.cookie, body: { stage: 'ihram', lat: 21.4 } })
      const jj = (await j(r)).journey
      expect(jj.stage).toBe('ihram')
      expect(jj.history).toEqual([{ s: 'ihram', at: clock }])
      expect(JSON.stringify(jj)).not.toMatch(/lat|lng|21\.4/)
    })

    it('ailə: dairə üzvü görür (ETag → 304), kənar görmür, sahib özünü siyahıda görmür', async () => {
      let r = await app.get('/api/hajj-journey/family', f.cookie)
      expect(r.status).toBe(200)
      const etag = r.headers.get('etag')
      const body = await j(r)
      expect(body.journeys).toHaveLength(1)
      expect(body.journeys[0]).toMatchObject({ name: 'Zəvvar', stage: 'ihram', paused: false })
      r = await app.call('/api/hajj-journey/family', { method: 'GET', cookie: f.cookie, headers: { 'if-none-match': etag } })
      expect(r.status).toBe(304)
      clock += 3600e3
      await app.call('/api/hajj-journey/stage', { method: 'PUT', cookie: p.cookie, body: { stage: 'arrive_makkah' } })
      r = await app.call('/api/hajj-journey/family', { method: 'GET', cookie: f.cookie, headers: { 'if-none-match': etag } })
      expect(r.status).toBe(200)
      expect((await j(r)).journeys[0].stage).toBe('arrive_makkah')
      expect((await j(await app.get('/api/hajj-journey/family', o.cookie))).journeys).toEqual([])
      expect((await j(await app.get('/api/hajj-journey/family', p.cookie))).journeys).toEqual([])
    })

    it('fasilə: baxan mərhələni görmür; ailə paylaşması söndürüləndə siyahıdan çıxır', async () => {
      await app.call('/api/hajj-journey/share', { method: 'PUT', cookie: p.cookie, body: { paused: true } })
      let v = (await j(await app.get('/api/hajj-journey/family', f.cookie))).journeys[0]
      expect(v.paused).toBe(true)
      expect(v.stage).toBeUndefined()
      expect(v.history).toBeUndefined()
      let r = await app.call('/api/hajj-journey/share', { method: 'PUT', cookie: p.cookie, body: { paused: 'yes' } })
      expect(r.status).toBe(400)
      await app.call('/api/hajj-journey/share', { method: 'PUT', cookie: p.cookie, body: { paused: false, family: false } })
      expect((await j(await app.get('/api/hajj-journey/family', f.cookie))).journeys).toEqual([])
      r = await app.call('/api/hajj-journey/share', { method: 'PUT', cookie: p.cookie, body: { family: true } })
      expect((await j(r)).journey).toMatchObject({ family: true, paused: false })
    })

    it('gizli keçid: girişsiz baxış, ETag, CSRF, yenisi köhnəni ləğv edir, ləğv', async () => {
      let r = await app.call('/api/hajj-journey/link', { cookie: p.cookie })
      expect(r.status).toBe(201)
      const { token } = await j(r)
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(app.db.raw.prepare('SELECT link_hash FROM hajj_journeys').get().link_hash).not.toContain(token)
      r = await app.call('/api/hajj-journey/view', { body: { token } })
      expect(r.status).toBe(200)
      const etag = r.headers.get('etag')
      expect((await j(r)).journey).toMatchObject({ name: 'Atam', stage: 'arrive_makkah' })
      r = await app.call('/api/hajj-journey/view', { body: { token }, headers: { ...H, 'if-none-match': etag } })
      expect(r.status).toBe(304)
      r = await app.call('/api/hajj-journey/view', { body: { token }, headers: { 'content-type': 'application/json' } })
      expect(r.status).toBe(403)
      r = await app.call('/api/hajj-journey/view', { body: { token: 'short' } })
      expect(r.status).toBe(404)
      r = await app.call('/api/hajj-journey/view')
      expect(r.status).toBe(404)
      const t2 = (await j(await app.call('/api/hajj-journey/link', { cookie: p.cookie }))).token
      expect((await app.call('/api/hajj-journey/view', { body: { token } })).status).toBe(404)
      expect((await app.call('/api/hajj-journey/view', { body: { token: t2 } })).status).toBe(200)
      await app.call('/api/hajj-journey/link', { method: 'DELETE', cookie: p.cookie })
      expect((await app.call('/api/hajj-journey/view', { body: { token: t2 } })).status).toBe(404)
    })

    it('ixrac token heşi daşımır; dayandır — silinir', async () => {
      await app.call('/api/hajj-journey/link', { cookie: p.cookie })
      const x = app.hj.exportUser(p.id)
      expect(x.journey.link).toBe(true)
      expect(JSON.stringify(x)).not.toMatch(/link_hash|[0-9a-f]{64}/)
      const r = await app.call('/api/hajj-journey', { method: 'DELETE', cookie: p.cookie })
      expect(r.status).toBe(200)
      expect((await j(await app.get('/api/hajj-journey', p.cookie))).journey).toBe(null)
    })

    it('30 gündən sonra vaxtı bitir və silinir; yenisi açıla bilər', async () => {
      await app.call('/api/hajj-journey', { cookie: p.cookie, body: { kind: 'umrah', consent: true } })
      const r0 = await app.call('/api/hajj-journey/stage', { method: 'PUT', cookie: p.cookie, body: { stage: 'sai' } })
      expect(r0.status).toBe(200)
      clock += hajj.TTL_MS + 1
      expect((await j(await app.get('/api/hajj-journey', p.cookie))).journey).toBe(null)
      expect((await j(await app.get('/api/hajj-journey/family', f.cookie))).journeys).toEqual([])
      expect(app.hj.purge()).toBe(1)
      const r = await app.call('/api/hajj-journey', { cookie: p.cookie, body: { kind: 'hajj', consent: true } })
      expect(r.status).toBe(201)
    })

    it('hesab silinəndə səfər CASCADE', async () => {
      await app.del(p)
      expect(app.db.raw.prepare('SELECT COUNT(*) AS n FROM hajj_journeys').get().n).toBe(0)
    })
  })
})
