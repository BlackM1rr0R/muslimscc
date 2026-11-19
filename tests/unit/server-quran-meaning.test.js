// Server: "Quranda məna ilə axtar" (server/quranMeaning.js) — model çağırışı saxtadır.
// Yoxlanılır: CSRF, giriş doğrulaması, modelin cavabının təhlili (hasar, mətn içində JSON),
// istinadların yoxlanması (surə 1–114, ayə sayı), təkrarların silinməsi, 10 həddi, etiketin
// təmizlənməsi (ayə mətni etiket kimi sızmır), keş (TTL) və eyni anda gələn sorğuların birləşməsi,
// xəta kodları (upstream / timeout).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const qm = require('../../server/quranMeaning.js')

const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch', origin: ORIGIN }

describe('quranMeaning saf köməkçilər', () => {
  it('parseModelReply: düz JSON, hasar, mətn içində obyekt, massiv', () => {
    expect(qm.parseModelReply('{"results":[{"s":2,"a":153}]}')).toEqual([{ s: 2, a: 153 }])
    expect(qm.parseModelReply('```json\n{"results":[{"s":94,"a":5}]}\n```')).toEqual([{ s: 94, a: 5 }])
    expect(qm.parseModelReply('Here you go: {"results":[{"s":1,"a":1}]} hope it helps')).toEqual([{ s: 1, a: 1 }])
    expect(qm.parseModelReply('[{"s":3,"a":200}]')).toEqual([{ s: 3, a: 200 }])
    expect(qm.parseModelReply('Patience is mentioned in 2:153')).toBeNull()
    expect(qm.parseModelReply('')).toBeNull()
  })

  it('validateResults: yararsız istinadlar atılır, təkrar silinir, ən çox 10', () => {
    const list = [
      { s: 2, a: 153, t: 'model text' },
      { s: 2, a: 153, t: 'dup' },          // təkrar
      { s: 0, a: 1 }, { s: 115, a: 1 },    // surə hüdudu
      { s: 1, a: 8 },                      // Fatihədə 7 ayə var
      { s: 2, a: 286 },                    // Bəqərənin sonuncusu — düzgündür
      { s: 108, a: 4 },                    // Kövsər — 3 ayə
      { s: 1.5, a: 2 }, { s: '2', a: '255' }, { s: 'x', a: 1 }, null, 'abc',
      { ref: '94:6' },
    ]
    const out = qm.validateResults(list)
    expect(out.map((r) => `${r.s}:${r.a}`)).toEqual(['2:153', '2:286', '2:255', '94:6'])
    expect(out[0]).toEqual({ s: 2, a: 153 })   // model mətni (t) qaytarılmır
    const many = Array.from({ length: 30 }, (_, i) => ({ s: 2, a: i + 1 }))
    expect(qm.validateResults(many)).toHaveLength(qm.MAX_RESULTS)
    expect(qm.validRef(114, 6)).toBe(true)
    expect(qm.validRef(114, 7)).toBe(false)
  })

  it('normQuery: idarəetmə simvolları, boşluq, uzunluq', () => {
    expect(qm.normQuery('  about   patience ')).toBe('about patience')
    expect(qm.normQuery('a')).toBe('')
    expect(qm.normQuery('x'.repeat(qm.Q_MAX + 1))).toBe('')
    expect(qm.normQuery(123)).toBe('')
  })

  it('buildMessages: sistem promptu yalnız istinad istəyir, sorğu dırnaqlar içindədir', () => {
    const m = qm.buildMessages('comfort in hard times')
    expect(m[0].role).toBe('system')
    expect(m[0].content).toMatch(/ONLY this JSON/)
    expect(m[0].content).not.toMatch(/topic label/i)
    expect(m[0].content).toMatch(/never quote, translate, paraphrase or explain/)
    expect(m[1].content).toBe('Topic: """comfort in hard times"""')
  })
})

describe('POST /api/quran-meaning', () => {
  let srv, router, clock = 1_000_000
  const calls = []
  let reply = async () => '{"results":[{"s":2,"a":153,"t":"Patience"},{"s":94,"a":5,"t":"Ease after hardship"},{"s":200,"a":1}]}'
  beforeAll(async () => {
    const app = express()
    router = qm.createQuranMeaningRouter({
      allowedOrigins: [ORIGIN], now: () => clock, ttlMs: 60_000, timeoutMs: 200,
      callModel: async (messages, signal) => { calls.push(messages); return reply(messages, signal) },
    })
    app.use('/api', router)
    srv = await listen(app)
  })
  afterAll(async () => { await srv.close() })
  const post = (body, headers = H) => fetch(srv.url + '/api/quran-meaning', { method: 'POST', headers, body: JSON.stringify(body) })

  it('CSRF: X-Requested-With və icazəli Origin tələb olunur', async () => {
    expect((await post({ q: 'patience' }, { 'content-type': 'application/json' })).status).toBe(403)
    expect((await post({ q: 'patience' }, { ...H, origin: 'https://evil.example' })).status).toBe(403)
    expect(calls).toHaveLength(0)
  })

  it('boş / qısa / uzun sorğu və gövdəsiz sorğu → 400', async () => {
    expect((await post({ q: '' })).status).toBe(400)
    expect((await post({ q: 'x'.repeat(500) })).status).toBe(400)
    const r = await fetch(srv.url + '/api/quran-meaning', { method: 'POST', headers: { 'x-requested-with': 'fetch' } })
    expect(r.status).toBe(400)
    expect((await r.json()).code).toBe('bad_request')
  })

  it('yalnız yoxlanmış istinadlar qaytarılır; model mətni (ayə, etiket) yoxdur', async () => {
    const r = await post({ q: 'About patience', lang: 'az' })
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const j = await r.json()
    expect(j.cached).toBe(false)
    expect(j.results).toEqual([{ s: 2, a: 153}, { s: 94, a: 5 }])
    expect(calls.at(-1)[0].content).not.toMatch(/topic label|Azerbaijani/)
  })

  it('eyni sorğu (böyük-kiçik hərf, boşluq fərqli) keşdən; TTL bitəndə yenidən model', async () => {
    const n = calls.length
    const j = await (await post({ q: '  about   PATIENCE ', lang: 'az' })).json()
    expect(j.cached).toBe(true)
    expect(calls.length).toBe(n)
    // başqa dil — ayrıca açar
    await post({ q: 'about patience', lang: 'en' })
    expect(calls.length).toBe(n + 1)
    clock += 61_000
    const k = await (await post({ q: 'about patience', lang: 'az' })).json()
    expect(k.cached).toBe(false)
    expect(calls.length).toBe(n + 2)
  })

  it('eyni anda gələn eyni sorğular bir model çağırışını paylaşır', async () => {
    const n = calls.length
    reply = () => new Promise((res) => setTimeout(() => res('[{"s":13,"a":28,"t":"Hearts find rest"}]'), 50))
    const [a, b] = await Promise.all([post({ q: 'peace of heart', lang: 'en' }), post({ q: 'peace of heart', lang: 'en' })])
    expect((await a.json()).results).toEqual([{ s: 13, a: 28 }])
    expect((await b.json()).results).toHaveLength(1)
    expect(calls.length).toBe(n + 1)
  })

  it('modelin JSON-suz cavabı → boş nəticə (200)', async () => {
    reply = async () => 'I cannot help with that.'
    const j = await (await post({ q: 'weather tomorrow', lang: 'en' })).json()
    expect(j.results).toEqual([])
  })

  it('model xətası → 502 upstream (keşə düşmür); vaxt aşımı → 504', async () => {
    reply = async () => { throw new Error('AI 500') }
    const r = await post({ q: 'gratitude', lang: 'en' })
    expect(r.status).toBe(502)
    expect((await r.json()).code).toBe('upstream')
    reply = async () => '[{"s":14,"a":7}]'
    const ok = await (await post({ q: 'gratitude', lang: 'en' })).json()
    expect(ok.results).toEqual([{ s: 14, a: 7 }])

    reply = (_m, signal) => new Promise((_res, rej) => signal.addEventListener('abort', () => rej(new Error('aborted'))))
    const t = await post({ q: 'slow topic', lang: 'en' })
    expect(t.status).toBe(504)
    expect((await t.json()).code).toBe('timeout')
  })
})
