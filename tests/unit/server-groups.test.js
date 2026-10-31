// Server: qrup xətmi və ortaq hədəflər (server/groups.js)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const groups = require('../../server/groups.js')

const JSONH = { 'content-type': 'application/json' }
let clock = Date.UTC(2026, 9, 31, 12)
const now = () => clock
const today = (d = 0) => new Date(clock + d * 86400e3).toISOString().slice(0, 10)

async function makeServer(opts = {}) {
  const db = openDb(':memory:')
  const router = groups.createGroupsRouter({ db, now, cleanupMs: 0, ...opts })
  const app = express()
  app.use('/api', router)
  const srv = await listen(app)
  const call = (method, path, body) => fetch(srv.url + path, {
    method, headers: body !== undefined ? JSONH : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { db, router, srv, call }
}

const BIG = { create: { max: 1000, windowMs: 3600e3 }, write: { max: 10000, windowMs: 600e3 } }
let S
beforeAll(async () => { S = await makeServer({ limits: BIG }) })
afterAll(() => S.srv.close())

describe('validCreate', () => {
  const v = groups.validCreate
  it('növ, başlıq, hədəf yoxlanır', () => {
    expect(v({ type: 'khatm', title: 'Ailə xətmi' }).khatm.juz).toHaveLength(30)
    expect(v({ type: 'khatm', title: 'x' })).toBeNull()
    expect(v({ type: 'zzz', title: 'Salam' })).toBeNull()
    expect(v({ type: 'goal', title: 'Sübh', goal: { kind: 'fajr-40' } }).goal).toEqual({ kind: 'fajr-40', days: 40, label: '' })
    expect(v({ type: 'goal', title: 'Vərdiş', goal: { kind: 'custom', days: 30, label: 'Hər gün 1 səhifə' } }).goal.days).toBe(30)
    expect(v({ type: 'goal', title: 'Vərdiş', goal: { kind: 'custom', days: 0, label: 'abc' } })).toBeNull()
    expect(v({ type: 'goal', title: 'Vərdiş', goal: { kind: 'custom', days: 400, label: 'abc' } })).toBeNull()
    expect(v({ type: 'goal', title: 'Vərdiş' })).toBeNull()
    expect(v(null)).toBeNull()
  })
  it('idarəedici simvollar silinir, başlıq 80-ə kəsilir', () => {
    const d = v({ type: 'khatm', title: 'A\u0000b‮c' + 'x'.repeat(200), lang: 'qq' })
    expect(d.title.startsWith('Abc')).toBe(true)
    expect(d.title.length).toBe(80)
    expect(d.lang).toBe('az')
  })
})

describe('Xətm otağı', () => {
  let id, adminKey
  it('yaradılır; GET sirr qaytarmır', async () => {
    const r = await S.call('POST', '/api/groups', { type: 'khatm', title: 'Ramazan xətmi', lang: 'az' })
    expect(r.status).toBe(201)
    ;({ id, adminKey } = await r.json())
    expect(id).toMatch(/^[a-z0-9]{10}$/)
    expect(adminKey).toHaveLength(24)
    const g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g).toMatchObject({ id, type: 'khatm', title: 'Ramazan xətmi', closed: false })
    expect(g.khatm.juz).toHaveLength(30)
    expect(JSON.stringify(g)).not.toMatch(/adminHash|"th"|adminKey/)
    expect((await S.call('GET', '/api/groups/nonexisten')).status).toBe(404)
    expect((await S.call('GET', '/api/groups/../x')).status).toBe(404)
  })
  it('cüz götürülür, tokenlə oxunub bitir, buraxılır; başqasının tokeni 403', async () => {
    const r = await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 1, name: 'Əli' })
    expect(r.status).toBe(200)
    const { token } = await r.json()
    expect(token).toHaveLength(24)
    expect((await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 1, name: 'Vəli' })).status).toBe(409)
    expect((await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 31, name: 'Vəli' })).status).toBe(400)
    expect((await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 2, name: '  ' })).status).toBe(400)
    expect((await S.call('POST', `/api/groups/${id}/done`, { juz: 1, token: 'x'.repeat(24) })).status).toBe(403)
    expect((await S.call('POST', `/api/groups/${id}/done`, { juz: 1, token })).status).toBe(200)
    let g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.khatm.juz[0]).toEqual({ n: 1, name: 'Əli', done: true })
    expect((await S.call('POST', `/api/groups/${id}/release`, { juz: 1, token })).status).toBe(200)
    g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.khatm.juz[0].name).toBeNull()
  })
  it('30 cüz bitəndə xətm tamamlanır; admin sıfırlayır', async () => {
    for (let n = 1; n <= 30; n++) {
      const { token } = await (await S.call('PATCH', `/api/groups/${id}/claim`, { juz: n, name: `Oxucu ${n % 7}` })).json()
      const d = await (await S.call('POST', `/api/groups/${id}/done`, { juz: n, token })).json()
      expect(d.completed).toBe(n === 30)
    }
    let g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.khatm.completedAt).toBe(clock)
    expect(g.khatm.completions).toBe(1)
    expect((await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 1, name: 'X' })).status).toBe(409)
    expect((await S.call('POST', `/api/groups/${id}/admin`, { adminKey: 'yanlis', action: 'reset' })).status).toBe(403)
    expect((await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'check' })).status).toBe(200)
    expect((await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'reset' })).status).toBe(200)
    g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.khatm).toMatchObject({ round: 2, completions: 1, completedAt: null })
    expect(g.khatm.juz.every(j => j.name === null)).toBe(true)
  })
  it('admin adı silir, otağı bağlayır (yazı 423), açır və silir', async () => {
    await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 5, name: 'Spam' })
    expect((await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'remove', juz: 5 })).status).toBe(200)
    expect((await (await S.call('GET', `/api/groups/${id}`)).json()).khatm.juz[4].name).toBeNull()
    await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'close' })
    expect((await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 5, name: 'A' })).status).toBe(423)
    await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'reopen' })
    expect((await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 5, name: 'A' })).status).toBe(200)
    expect((await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'nuke' })).status).toBe(400)
    expect((await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'delete' })).status).toBe(200)
    expect((await S.call('GET', `/api/groups/${id}`)).status).toBe(404)
  })
})

describe('Hədəf otağı', () => {
  let id, adminKey, me
  it('qoşulma, gündə bir işarə, geri götürmə, tarix pəncərəsi', async () => {
    ;({ id, adminKey } = await (await S.call('POST', '/api/groups', { type: 'goal', title: 'Sübh dəstəsi', goal: { kind: 'fajr-40' } })).json())
    expect((await S.call('PATCH', `/api/groups/${id}/claim`, { juz: 1, name: 'A' })).status).toBe(400)
    const r = await S.call('POST', `/api/groups/${id}/join`, { name: 'Ayşə' })
    me = await r.json()
    expect(me.pid).toMatch(/^[a-z0-9]{8}$/)
    const tick = (body) => S.call('POST', `/api/groups/${id}/tick`, { pid: me.pid, token: me.token, ...body })
    expect((await tick({ date: today() })).status).toBe(200)
    expect((await tick({ date: today() })).status).toBe(200)          // təkrar — bir dəfə sayılır
    expect((await tick({ date: today(-1) })).status).toBe(200)        // dünən
    expect((await tick({ date: today(-5) })).status).toBe(400)
    expect((await tick({ date: today(3) })).status).toBe(400)
    expect((await tick({ date: '2026-02-30' })).status).toBe(400)
    expect((await S.call('POST', `/api/groups/${id}/tick`, { pid: me.pid, token: 'yanlis', date: today() })).status).toBe(403)
    let g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.goal.days).toBe(40)
    expect(g.participants[0]).toEqual({ pid: me.pid, name: 'Ayşə', ticks: [today(-1), today()], joinedAt: clock })
    expect(JSON.stringify(g)).not.toMatch(/"th"|token/)
    expect((await tick({ date: today(-1), on: false })).status).toBe(200)
    g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.participants[0].ticks).toEqual([today()])
  })
  it('xüsusi hədəf: N işarədən çox olmur', async () => {
    const r = await (await S.call('POST', '/api/groups', { type: 'goal', title: 'İki gün', goal: { kind: 'custom', days: 1, label: 'Quran oxu' } })).json()
    const p = await (await S.call('POST', `/api/groups/${r.id}/join`, { name: 'B' })).json()
    expect((await S.call('POST', `/api/groups/${r.id}/tick`, { ...p, date: today() })).status).toBe(200)
    expect((await S.call('POST', `/api/groups/${r.id}/tick`, { ...p, date: today(-1) })).status).toBe(409)
  })
  it('60 iştirakçı həddi; admin silir; iştirakçı özü çıxır', async () => {
    for (let i = 1; i < 60; i++) expect((await S.call('POST', `/api/groups/${id}/join`, { name: `Üzv ${i}` })).status).toBe(200)
    expect((await S.call('POST', `/api/groups/${id}/join`, { name: 'Artıq' })).status).toBe(409)
    let g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.participants).toHaveLength(60)
    expect((await S.call('POST', `/api/groups/${id}/admin`, { adminKey, action: 'remove', pid: g.participants[1].pid })).status).toBe(200)
    expect((await S.call('POST', `/api/groups/${id}/leave`, { pid: me.pid, token: me.token })).status).toBe(200)
    g = await (await S.call('GET', `/api/groups/${id}`)).json()
    expect(g.participants).toHaveLength(58)
  })
})

describe('Limit və ömür', () => {
  it('yaratma: saatda 10; yazı: 10 dəqiqədə 120', async () => {
    const T = await makeServer()
    const codes = []
    for (let i = 0; i < 11; i++) codes.push((await T.call('POST', '/api/groups', { type: 'khatm', title: `Xətm ${i}` })).status)
    expect(codes.slice(0, 10).every(c => c === 201)).toBe(true)
    expect(codes[10]).toBe(429)
    const { id } = await (await (async () => { clock += 3601e3; return T.call('POST', '/api/groups', { type: 'goal', title: 'Hədəf', goal: { kind: 'fajr-40' } }) })()).json()
    let last = 0
    for (let i = 0; i < 121; i++) last = (await T.call('POST', `/api/groups/${id}/join`, { name: `n${i}` })).status
    expect(last).toBe(429)
    await T.srv.close()
  })
  it('son fəaliyyətdən 180 gün sonra otaq görünmür və təmizlənir', async () => {
    const T = await makeServer()
    const { id } = await (await T.call('POST', '/api/groups', { type: 'khatm', title: 'Köhnə' })).json()
    clock += 179 * 86400e3
    expect((await T.call('GET', `/api/groups/${id}`)).status).toBe(200)
    expect(T.router.purgeExpired()).toBe(0)
    clock += 2 * 86400e3
    expect((await T.call('GET', `/api/groups/${id}`)).status).toBe(404)
    expect(T.router.purgeExpired()).toBe(1)
    expect(T.db.countDocs('groups')).toBe(0)
    await T.srv.close()
  })
  it('pozuq JSON — 400', async () => {
    const r = await fetch(S.srv.url + '/api/groups', { method: 'POST', headers: JSONH, body: '{x' })
    expect(r.status).toBe(400)
  })
})
