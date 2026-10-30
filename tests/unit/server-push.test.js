// Server: standart Web Push (server/push.js) — validasiya, saxlama, payload
// formatının public/sw.js → parsePush() ilə uyğunluğu, göndərici, router.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import crypto from 'node:crypto'
import { require, express, listen } from './server-helpers.js'

const push = require('../../server/push.js')
const checkin = require('../../server/checkin.js')
const { openDb } = require('../../server/db.js')

// Həqiqi formatlı açarlar: P-256 açıq nöqtəsi (65 bayt) + 16 bayt auth
const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys()
const KEYS = { p256dh: ecdh.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') }
const EP = {
  chrome: 'https://fcm.googleapis.com/fcm/send/abc123:APA91b-xyz',
  firefox: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABk',
  safari: 'https://web.push.apple.com/QGuQyavXutnMH',
  edge: 'https://wns2-par02p.notify.windows.com/w/?token=BQYAAAB',
}

// sw.js-dəki parsePush funksiyasını faylın özündən götür (sw.js dəyişmir)
function loadParsePush() {
  const src = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8')
  const m = /function parsePush\(e\) \{[\s\S]*?\n\}\n/.exec(src)
  if (!m) throw new Error('sw.js-də parsePush tapılmadı')
  return new Function(`${m[0]}; return parsePush`)()
}
const parsePush = loadParsePush()
const pushEvent = (payload) => ({ data: { json: () => JSON.parse(payload), text: () => payload } })

describe('endpoint və açar validasiyası', () => {
  it('icazəli push xidmətləri', () => {
    for (const ep of Object.values(EP)) expect(push.validEndpoint(ep)).toBe(ep)
  })
  it('yad host, http, port, istifadəçi adı, uzunluq → rədd', () => {
    for (const bad of [
      'http://fcm.googleapis.com/fcm/send/x',
      'https://evil.example/fcm/send/x',
      'https://fcm.googleapis.com.evil.example/x',
      'https://evilnotify.windows.com/x',
      'https://notify.windows.com/x',
      'https://user:pw@fcm.googleapis.com/x',
      'https://fcm.googleapis.com:8443/x',
      'https://127.0.0.1/x',
      'https://fcm.googleapis.com/' + 'a'.repeat(1100),
      'javascript:alert(1)', '', null, 42,
    ]) expect(push.validEndpoint(bad)).toBeNull()
  })
  it('əlavə host env ilə (PUSH_EXTRA_HOSTS)', () => {
    expect(push.validEndpoint('https://push.example.org/x', ['push.example.org'])).not.toBeNull()
    expect(push.validEndpoint('https://a.push.example.org/x', ['.push.example.org'])).not.toBeNull()
  })
  it('açar uzunluqları', () => {
    expect(push.validKeys(KEYS)).toEqual(KEYS)
    expect(push.validKeys({ ...KEYS, auth: crypto.randomBytes(15).toString('base64url') })).toBeNull()
    expect(push.validKeys({ ...KEYS, p256dh: crypto.randomBytes(65).toString('base64url').replace(/^./, 'A') })).toBeNull()  // 0x04 ilə başlamır
    expect(push.validKeys({ ...KEYS, p256dh: KEYS.p256dh.slice(0, 40) })).toBeNull()
    expect(push.validKeys({ p256dh: 'və!', auth: KEYS.auth })).toBeNull()
    expect(push.validKeys(null)).toBeNull()
  })
  it('loc və prefs — firestore.rules ilə eyni qaydalar', () => {
    expect(push.validLoc({ lat: 40.41, lng: 49.87, tz: 'Asia/Baku', method: 13, city: { az: 'Bakı' } })).toBeTruthy()
    expect(push.validLoc({ lat: 91 })).toBeUndefined()
    expect(push.validLoc({ extra: 1 })).toBeUndefined()
    expect(push.validLoc({ city: { xx: 'a' } })).toBeUndefined()
    expect(push.validLoc(null)).toBeNull()
    expect(push.validPrefs({ azan: false, checkin: true, daily: { ayah: true, hour: 20 } })).toEqual({ azan: false, checkin: true, daily: { ayah: true, hour: 20 } })
    expect(push.validPrefs({ daily: { hour: 24 } })).toBeUndefined()
    expect(push.validPrefs({ azan: 'yes' })).toBeUndefined()
    expect(push.validPrefs({ admin: true })).toBeUndefined()
  })
  it('subscribe gövdəsi: həm { subscription }, həm düz PushSubscription.toJSON()', () => {
    const a = push.validateSubscribeBody({ subscription: { endpoint: EP.chrome, keys: KEYS }, lang: 'ru' })
    expect(a.ok).toBe(true)
    expect(a.value).toMatchObject({ endpoint: EP.chrome, lang: 'ru', loc: null, prefs: {} })
    const b = push.validateSubscribeBody({ endpoint: EP.safari, keys: KEYS })
    expect(b.ok && b.value.lang).toBe('az')
    expect(push.validateSubscribeBody({ endpoint: EP.chrome, keys: KEYS, lang: 'fr' }).ok).toBe(false)
  })
})

describe('payload — sw.js parsePush ilə uyğunluq', () => {
  const ICONS = push.DEFAULT_ICONS

  it('azan: başlıq, mətn, tag, ikon, url; Urgency high + TTL 1200', () => {
    const { payload, options } = push.toWebPush({
      notification: { title: '🕌 Zöhr azanı — 12:29', body: 'Növbəti: Əsr 15:24 · Bakı' },
      webpush: { headers: { Urgency: 'high', TTL: '1200' }, notification: { ...ICONS, tag: 'azan-dhuhr' }, fcmOptions: { link: '/prayer' } },
    })
    expect(options).toEqual({ TTL: 1200, urgency: 'high' })
    const m = parsePush(pushEvent(payload))
    expect(m).toMatchObject({ title: '🕌 Zöhr azanı — 12:29', body: 'Növbəti: Əsr 15:24 · Bakı', tag: 'azan-dhuhr', url: '/prayer', ...ICONS })
    expect(JSON.parse(payload)).toEqual({
      notification: { title: '🕌 Zöhr azanı — 12:29', body: 'Növbəti: Əsr 15:24 · Bakı', tag: 'azan-dhuhr', ...ICONS },
      data: { url: '/prayer', tag: 'azan-dhuhr' },
    })
  })

  it('günün ayəsi: TTL 21600, data.url', () => {
    const { payload, options } = push.toWebPush({
      notification: { title: 'Bəqərə 2:255', body: 'Allah...' },
      data: { tag: 'daily-ayah', url: '/quran/2#ayah-255' },
      webpush: { headers: { TTL: '21600' }, notification: { ...ICONS, tag: 'daily-ayah' }, fcmOptions: { link: '/quran/2#ayah-255' } },
    })
    expect(options).toEqual({ TTL: 21600, urgency: 'normal' })
    expect(parsePush(pushEvent(payload))).toMatchObject({ tag: 'daily-ayah', url: '/quran/2#ayah-255' })
  })

  it('"Qıldınızmı?": düymə mətnləri və namaz/tarix data-da qalır', () => {
    const msg = checkin.buildCheckinMessage('en', 'asr', '2026-10-31', ICONS)
    const { payload, options } = push.toWebPush(msg)
    expect(options.TTL).toBe(10800)
    const m = parsePush(pushEvent(payload))
    expect(m.tag).toBe('checkin-asr-2026-10-31')
    expect(m.url).toBe('/en/prayer?checkin=asr&d=2026-10-31')
    expect(m.data).toMatchObject({ kind: 'checkin', prayer: 'asr', date: '2026-10-31', actPrayed: '✅ I prayed', actLater: 'Later' })
  })

  it('uzun admin mətni qısaldılır (push limiti)', () => {
    const { payload } = push.toWebPush({ notification: { title: 'T', body: 'ə'.repeat(5000) } })
    expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(push.MAX_PAYLOAD_BYTES)
    const m = parsePush(pushEvent(payload))
    expect(m.body.endsWith('…')).toBe(true)
    expect(m.url).toBe('/')
    expect(m.tag).toBe('muslims-cc')
  })
})

describe('göndərici', () => {
  it('404/410 → ölü abunəlik; digər xətalar yalnız sayılır', async () => {
    const calls = []
    const sendFn = async (sub, payload, options) => {
      calls.push({ sub, options })
      if (sub.endpoint.endsWith('gone')) { const e = new Error('gone'); e.statusCode = 410; throw e }
      if (sub.endpoint.endsWith('nf')) { const e = new Error('nf'); e.statusCode = 404; throw e }
      if (sub.endpoint.endsWith('err')) { const e = new Error('5xx'); e.statusCode = 503; throw e }
    }
    const s = push.createWebPushSender({ sendFn, concurrency: 2 })
    const subs = ['ok1', 'gone', 'nf', 'err', 'ok2'].map((x) => ({ endpoint: EP.chrome + x, keys: KEYS }))
    const r = await s.sendMany(subs, { notification: { title: 'a', body: 'b' }, webpush: { headers: { Urgency: 'high', TTL: '1200' } } })
    expect(r).toEqual({ successCount: 2, failureCount: 3, dead: [EP.chrome + 'gone', EP.chrome + 'nf'] })
    expect(calls).toHaveLength(5)
    expect(calls[0].options).toMatchObject({ TTL: 1200, urgency: 'high' })
  })
  it('VAPID açarları yoxdursa sönülüdür', async () => {
    const s = push.createWebPushSender({})
    expect(s.enabled).toBe(false)
    expect(await s.sendMany([{ endpoint: EP.chrome, keys: KEYS }], { notification: {} })).toEqual({ successCount: 0, failureCount: 0, dead: [] })
  })
})

describe('HTTP: /api/push/*', () => {
  let srv, store
  const H = { 'content-type': 'application/json' }
  const post = (p, body, method = 'POST') => fetch(srv.url + p, { method, headers: H, body: JSON.stringify(body) })
  beforeAll(async () => {
    store = push.createPushStore(openDb(':memory:'))
    const app = express()
    app.use('/api', push.createPushRouter({ store, publicKey: 'BPUBLICKEY' }))
    srv = await listen(app)
  })
  afterAll(() => srv.close())

  it('açıq açar', async () => {
    expect(await (await fetch(srv.url + '/api/push/vapid-public-key')).json()).toEqual({ key: 'BPUBLICKEY' })
  })

  it('subscribe → patch → unsubscribe; təkrar subscribe dublikat yaratmır', async () => {
    const body = { subscription: { endpoint: EP.firefox, keys: KEYS }, lang: 'tr',
      loc: { lat: 41.01, lng: 28.98, tz: 'Europe/Istanbul', method: 13, city: { tr: 'İstanbul' } },
      prefs: { azan: true, daily: { ayah: true, hour: 8 } } }
    expect((await post('/api/push/subscribe', body)).status).toBe(201)
    expect((await post('/api/push/subscribe', body)).status).toBe(201)
    expect(store.count()).toBe(1)

    expect((await post('/api/push/subscription', { endpoint: EP.firefox, prefs: { checkin: true } }, 'PATCH')).status).toBe(200)
    const s = store.get(EP.firefox)
    expect(s.prefs).toEqual({ azan: true, daily: { ayah: true, hour: 8 }, checkin: true })
    expect(s.lang).toBe('tr')
    expect(s.loc.city).toEqual({ tr: 'İstanbul' })
    expect(store.all()[0]).toMatchObject({ endpoint: EP.firefox, keys: KEYS })

    expect((await post('/api/push/subscription', { endpoint: EP.chrome + 'none', lang: 'az' }, 'PATCH')).status).toBe(404)
    const un = await post('/api/push/unsubscribe', { endpoint: EP.firefox })
    expect(await un.json()).toEqual({ ok: true, removed: true })
    expect(store.count()).toBe(0)
  })

  it('yararsız gövdələr → 400', async () => {
    expect((await post('/api/push/subscribe', { endpoint: 'https://evil.example/x', keys: KEYS })).status).toBe(400)
    expect((await post('/api/push/subscribe', { endpoint: EP.chrome, keys: { p256dh: 'x', auth: 'y' } })).status).toBe(400)
    expect((await post('/api/push/subscribe', { endpoint: EP.chrome, keys: KEYS, prefs: { daily: { hour: 99 } } })).status).toBe(400)
    expect((await post('/api/push/unsubscribe', { endpoint: 'nope' })).status).toBe(400)
    const r = await fetch(srv.url + '/api/push/subscribe', { method: 'POST', headers: H, body: '{bad' })
    expect(r.status).toBe(400)
    const big = await post('/api/push/subscribe', { endpoint: EP.chrome, keys: KEYS, userAgent: 'x'.repeat(20000) })
    expect(big.status).toBe(413)
  })
})
