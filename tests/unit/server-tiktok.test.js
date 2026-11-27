// Server: TikTok yükləyicisi (server/tiktok.js, docs/TIKTOK.md) — env-siz tam sönülü, OAuth state (imza, müddət, bir dəfəlik,
// kuki), token şifrələnməsi və yeniləmə (rotasiya), init → hissələr (PUT) → status axını, inbox / direct parametrləri,
// iki proses arasında bir dəfə, avtorizasiya xətasında dayanma, admin rolları. Şəbəkə yoxdur: fetch saxtadır.
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const tt = require('../../server/tiktok.js')
const REEL = require('../../server/instagramReel.js')

const KEY = 'awtestclientkey123'
const SECRET = 'TestClientSecret0123456789abcdefXYZ'
const ENV = { TIKTOK_ENABLED: '1', TIKTOK_CLIENT_KEY: KEY, TIKTOK_CLIENT_SECRET: SECRET }
const DAY = '2026-11-25'
// 2026-11-25 18:30:30 Asia/Baku (UTC+4)
const T0 = Date.parse('2026-11-25T14:30:30Z')
const MIB = 1024 * 1024
const ACCESS = 'act.access-token-0001!abc'
const REFRESH = 'rft.refresh-token-0001!abc'
const silent = () => { const l = { errors: [], warns: [], logs: [] }; return { ...l, error: (...a) => l.errors.push(a.join(' ')), warn: (...a) => l.warns.push(a.join(' ')), log: (...a) => l.logs.push(a.join(' ')), _l: l } }

let dir, dbs = []
afterEach(() => {
  for (const d of dbs) { try { d.close() } catch { /* */ } }
  dbs = []
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
  dir = null
})
function setup() {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-tt-'))
  const db = openDb(path.join(dir, 'test.db'))
  dbs.push(db)
  return { db, cardDir: path.join(dir, 'ig-cards') }
}

/** Minimal faststart MP4: ftyp + moov(mvhd v0) + mdat (doldurma) — ümumi ölçü `size` bayt. */
function fakeMp4(durationMs = 21900, size = 8192) {
  const ftyp = Buffer.alloc(16); ftyp.writeUInt32BE(16, 0); ftyp.write('ftypisom', 4, 'latin1'); ftyp.writeUInt32BE(0x200, 12)
  const mvhd = Buffer.alloc(108); mvhd.writeUInt32BE(108, 0); mvhd.write('mvhd', 4, 'latin1'); mvhd.writeUInt32BE(1000, 20); mvhd.writeUInt32BE(durationMs, 24)
  const moov = Buffer.concat([Buffer.alloc(8), mvhd]); moov.writeUInt32BE(moov.length, 0); moov.write('moov', 4, 'latin1')
  const mdat = Buffer.alloc(size - ftyp.length - moov.length, 7); mdat.writeUInt32BE(mdat.length, 0); mdat.write('mdat', 4, 'latin1')
  return Buffer.concat([ftyp, moov, mdat])
}
function putReel(cardDir, { date = DAY, ref = '33:3', audio = 'alafasy', size = 8192, durationMs = 21900 } = {}) {
  fs.mkdirSync(cardDir, { recursive: true })
  fs.writeFileSync(path.join(cardDir, `${date}-reel.mp4`), fakeMp4(durationMs, size))
  fs.writeFileSync(path.join(cardDir, `${date}-reel.json`), JSON.stringify({ ref, audio }))
}

/**
 * Saxta TikTok API + alquran.cloud.
 *  statuses — status/fetch cavablarının ardıcıllığı (sonuncu təkrarlanır)
 *  initFail — init-in ilk N cavabı: [status, code]
 *  refreshFail — refresh cavabı (status, error) — bir dəfə
 */
function fakeFetch({ longText = false, statuses = ['PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX'], initFail = [], statusFail = [], privacy = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'], refreshFail = null, maxSec = 600 } = {}) {
  const calls = []
  let st = 0, nTok = 1, pid = 0
  const ifail = [...initFail], sfail = [...statusFail]
  const json = (status, body, headers = {}) => ({ ok: status >= 200 && status < 300, status, headers: new Headers(headers), json: async () => body })
  const fn = async (url, opts = {}) => {
    const u = new URL(String(url))
    if (u.hostname === 'api.alquran.cloud') {
      const m = /ayah\/(\d+):(\d+)\/editions\/(.+)$/.exec(u.pathname)
      const [s, a] = [Number(m[1]), Number(m[2])]
      const data = m[3].split(',').map((id) => ({ edition: { identifier: id }, surah: { number: s, englishName: 'Al-Ahzab', name: 'سورة الأحزاب' }, numberInSurah: a, text: id === 'quran-uthmani' ? 'وَتَوَكَّلْ عَلَى ٱللَّهِ' : `TEXT-${id}${longText ? ' word'.repeat(150) : ''}` }))
      return json(200, { code: 200, data })
    }
    const body = opts.body
    const c = { method: opts.method, url: u, headers: opts.headers || {}, body }
    calls.push(c)
    if (u.hostname === 'open-upload.tiktokapis.com') {
      const m = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(c.headers['Content-Range'])
      c.range = m.slice(1).map(Number)
      return json(Number(m[2]) + 1 === Number(m[3]) ? 201 : 206, {})
    }
    if (u.pathname === '/v2/oauth/token/') {
      const f = new URLSearchParams(body)
      c.form = f
      if (f.get('grant_type') === 'refresh_token' && refreshFail) { const r = refreshFail; refreshFail = null; return json(r[0], { error: r[1], error_description: 'x' }) }
      nTok++
      return json(200, { access_token: `act.access-token-000${nTok}!abc`, refresh_token: `rft.refresh-token-000${nTok}!abc`, expires_in: 7200, refresh_expires_in: 15552000, open_id: 'open-1', scope: 'user.info.basic,video.upload,video.publish', token_type: 'Bearer' })
    }
    if (u.pathname === '/v2/oauth/revoke/') return json(200, {})
    if (u.pathname === '/v2/user/info/') return json(200, { data: { user: { open_id: 'open-1', display_name: 'muslims.cc' } }, error: { code: 'ok' } })
    if (u.pathname === '/v2/post/publish/creator_info/query/') {
      return json(200, { data: { creator_nickname: 'muslims.cc', creator_username: 'muslimscc', privacy_level_options: privacy, comment_disabled: false, duet_disabled: false, stitch_disabled: false, max_video_post_duration_sec: maxSec }, error: { code: 'ok' } })
    }
    if (u.pathname === '/v2/post/publish/inbox/video/init/' || u.pathname === '/v2/post/publish/video/init/') {
      c.json = JSON.parse(body)
      if (ifail.length) { const [s, code] = ifail.shift(); return json(s, { error: { code, message: '' } }) }
      pid++
      return json(200, { data: { publish_id: `v_pub_file~v2-1.${pid}`, upload_url: `https://open-upload.tiktokapis.com/video/?upload_id=${pid}&upload_token=x` }, error: { code: 'ok' } })
    }
    if (u.pathname === '/v2/post/publish/status/fetch/') {
      c.json = JSON.parse(body)
      if (sfail.length) { const [s, code] = sfail.shift(); return json(s, { error: { code } }) }
      const s = statuses[Math.min(st++, statuses.length - 1)]
      return json(200, { data: { status: s, fail_reason: s === 'FAILED' ? 'file_format_check_failed' : undefined }, error: { code: 'ok' } })
    }
    return json(404, {})
  }
  fn.calls = calls
  fn.api = () => calls.filter((c) => c.url.hostname !== 'api.alquran.cloud')
  fn.path = (p) => calls.filter((c) => c.url.pathname === p)
  return fn
}

function mk(db, cardDir, opts = {}) {
  let t = opts.t || T0
  const log = opts.log || silent()
  const m = tt.createTikTok({
    db, env: { ...ENV, ...(opts.env || {}) }, cardDir, fetchImpl: opts.fetchImpl || fakeFetch(), now: () => (opts.clock ? opts.clock() : t),
    sleep: async () => {}, log, pollMs: [1, 1, 1, 1], ...(opts.chunkSize ? { chunkSize: opts.chunkSize } : {}),
  })
  m._set = (x) => { t = x }
  m._log = log
  return m
}

/** Bir dəfəlik qoşulma (connect → callback) — HTTP-siz. */
async function connect(m, adminId = 'a1') {
  const { url, nonce } = m.connectUrl(adminId)
  const state = new URL(url).searchParams.get('state')
  return m.handleCallback({ code: 'auth-code-123', state, error: '', cookieNonce: nonce })
}

describe('tiktok — konfiqurasiya və sönülü vəziyyət', () => {
  it('env-siz / natamam / yararsız — sönülü; susmaya görə inbox, SELF_ONLY, 18:30, FILE_UPLOAD', () => {
    expect(tt.parseConfig({})).toMatchObject({ enabled: false, reason: 'disabled', configured: false })
    expect(tt.parseConfig({ TIKTOK_CLIENT_KEY: KEY, TIKTOK_CLIENT_SECRET: SECRET })).toMatchObject({ enabled: false, reason: 'disabled', configured: true })
    expect(tt.parseConfig({ TIKTOK_ENABLED: '1', TIKTOK_CLIENT_KEY: KEY })).toMatchObject({ enabled: false, reason: 'missing_credentials' })
    expect(tt.parseConfig({ TIKTOK_ENABLED: '1', TIKTOK_CLIENT_KEY: 'a b', TIKTOK_CLIENT_SECRET: SECRET })).toMatchObject({ enabled: false, reason: 'bad_format' })
    const c = tt.parseConfig(ENV)
    expect(c).toMatchObject({ enabled: true, mode: 'inbox', privacy: 'SELF_ONLY', time: '18:30', source: 'file', allow: ['comment'], redirectUri: 'https://muslims.cc/api/tiktok/callback' })
    expect(c.scopes).toEqual(['user.info.basic', 'video.upload'])
    const d = tt.parseConfig({ ...ENV, TIKTOK_MODE: 'direct', TIKTOK_PRIVACY: 'PUBLIC_TO_EVERYONE', TIKTOK_TIME: '7:05', TIKTOK_SOURCE: 'url', TIKTOK_ALLOW: 'comment,duet,bogus' })
    expect(d).toMatchObject({ mode: 'direct', privacy: 'PUBLIC_TO_EVERYONE', time: '07:05', source: 'url', allow: ['comment', 'duet'] })
    expect(d.scopes).toEqual(['user.info.basic', 'video.publish'])
    expect(tt.parseConfig({ ...ENV, TIKTOK_MODE: 'x', TIKTOK_PRIVACY: 'public', TIKTOK_TIME: '25:00' })).toMatchObject({ mode: 'inbox', privacy: 'SELF_ONLY', time: '18:30' })
  })

  it('sönülü: şəbəkə sorğusu yoxdur, /api/tiktok/* → 404, status — yalnız "sönülüdür"', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch()
    const m = tt.createTikTok({ db, env: {}, cardDir, fetchImpl: f, now: () => T0, log: silent() })
    expect(m.enabled).toBe(false)
    expect(await m.tick()).toBe(0)
    expect(await m.refreshTick()).toBe(false)
    expect(await m.postNow()).toEqual({ error: 'disabled' })
    expect(f.calls).toHaveLength(0)
    const app = express()
    app.use('/api', m.router)
    const requireAdmin = (req, res, next) => { req.adminUser = { id: 'a1', via: 'session' }; next() }
    app.use('/api', m.adminRouter({ requireAdmin, adminRoleOf: () => 'superadmin' }))
    const srv = await listen(app)
    try {
      for (const p of ['/api/tiktok/callback?code=x&state=y', '/api/tiktok/media/2026-11-25-reel.mp4', '/api/tiktok/connect']) {
        const r = await fetch(srv.url + p, { redirect: 'manual' })
        expect(r.status, p).toBe(404)
      }
      const s = await (await fetch(`${srv.url}/api/admin/tiktok`)).json()
      expect(s).toMatchObject({ enabled: false, reason: 'disabled', connected: false, today: { file: null } })
    } finally { await srv.close() }
    expect(f.calls).toHaveLength(0)
  })
})

describe('tiktok — saf köməkçilər', () => {
  it('hissələr: < 5 MB bütöv; floor(size / chunk) hissə, qalıq sonuncuya (sənəddəki nümunə)', () => {
    expect(tt.chunkPlan(4194304)).toEqual({ videoSize: 4194304, chunkSize: 4194304, count: 1, ranges: [[0, 4194303]] })
    const p = tt.chunkPlan(50000123, 10000000)
    expect(p).toMatchObject({ chunkSize: 10000000, count: 5 })
    expect(p.ranges.at(-1)).toEqual([40000000, 50000122])
    expect(p.ranges[1]).toEqual([10000000, 19999999])
    // 5 MB ≤ ölçü < hissə — bütöv (bir hissə)
    expect(tt.chunkPlan(7 * MIB)).toMatchObject({ count: 1, chunkSize: 7 * MIB })
    // 15 MB, 10 MiB hissə: floor = 1 → bir hissə (sonuncu hissə chunk_size-dan böyük ola bilər)
    expect(tt.chunkPlan(15 * MIB)).toMatchObject({ count: 1, chunkSize: 10 * MIB, ranges: [[0, 15 * MIB - 1]] })
    expect(tt.chunkPlan(0)).toBeNull()
    expect(tt.chunkPlan(-5)).toBeNull()
  })

  it('token AES-256-GCM: açılır; başqa secret və ya dəyişdirilmiş mətn — null', () => {
    const s = tt.seal(SECRET, { a: ACCESS, r: REFRESH, aExp: 1, rExp: 2, at: 0 })
    expect(s).not.toContain('access')
    expect(tt.unseal(SECRET, s)).toMatchObject({ a: ACCESS, r: REFRESH })
    expect(tt.unseal(SECRET + 'x', s)).toBeNull()
    const b = Buffer.from(s, 'base64url'); b[b.length - 1] ^= 1
    expect(tt.unseal(SECRET, b.toString('base64url'))).toBeNull()
    expect(tt.unseal(SECRET, 'garbage')).toBeNull()
  })

  it('state: imza, müddət (10 dəq), saxta imza / gələcək tarix / başqa secret — null', () => {
    const nonce = 'A'.repeat(22)
    const st = tt.signState(SECRET, nonce, T0 + 600e3, 'a1')
    expect(tt.verifyState(SECRET, st, T0)).toEqual({ nonce, exp: T0 + 600e3, adminId: 'a1' })
    expect(tt.verifyState(SECRET, st, T0 + 600e3)).toBeNull()
    expect(tt.verifyState(SECRET + 'x', st, T0)).toBeNull()
    expect(tt.verifyState(SECRET, st.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), T0)).toBeNull()
    expect(tt.verifyState(SECRET, st.replace('.a1.', '.a2.'), T0)).toBeNull()
    expect(tt.verifyState(SECRET, tt.signState(SECRET, nonce, T0 + 3600e3, 'a1'), T0)).toBeNull()
    expect(tt.verifyState(SECRET, '', T0)).toBeNull()
  })

  it('xəta növləri', () => {
    expect(tt.classify('access_token_invalid', 401)).toBe('auth')
    expect(tt.classify('scope_not_authorized', 401)).toBe('auth')
    expect(tt.classify('rate_limit_exceeded', 429)).toBe('rate')
    expect(tt.classify('spam_risk_too_many_pending_share', 403)).toBe('limit')
    expect(tt.classify('unaudited_client_can_only_post_to_private_accounts', 403)).toBe('config')
    expect(tt.classify('url_ownership_unverified', 403)).toBe('config')
    expect(tt.classify('internal_error', 500)).toBe('transient')
    expect(tt.classify('invalid_param', 400)).toBe('fatal')
  })
})

describe('tiktok — OAuth qoşulması', () => {
  async function app(m, role = 'superadmin') {
    const a = express()
    a.use('/api', m.router)
    const requireAdmin = (req, res, next) => { req.adminUser = { id: 'a1', via: 'session' }; next() }
    a.use('/api', m.adminRouter({ requireAdmin, adminRoleOf: () => role }))
    return listen(a)
  }

  it('connect → TikTok-a 302 (client_key, scope, redirect_uri, state) + Lax kuki; callback → token şifrəli saxlanır', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f })
    const srv = await app(m)
    try {
      const r = await fetch(`${srv.url}/api/tiktok/connect`, { redirect: 'manual' })
      expect(r.status).toBe(302)
      const loc = new URL(r.headers.get('location'))
      expect(loc.origin + loc.pathname).toBe('https://www.tiktok.com/v2/auth/authorize/')
      expect(Object.fromEntries(loc.searchParams)).toMatchObject({ client_key: KEY, scope: 'user.info.basic,video.upload', response_type: 'code', redirect_uri: 'https://muslims.cc/api/tiktok/callback' })
      const ck = r.headers.get('set-cookie')
      expect(ck).toMatch(/^__Host-mcc_tt=[A-Za-z0-9_-]{22}; Path=\/; Max-Age=600; HttpOnly; Secure; SameSite=Lax/)
      const nonce = /__Host-mcc_tt=([^;]+)/.exec(ck)[1]
      const state = loc.searchParams.get('state')
      expect(state.startsWith(nonce + '.')).toBe(true)

      // Kukisiz (başqa brauzer / login CSRF) — rədd
      let c = await fetch(`${srv.url}/api/tiktok/callback?code=abc123&state=${encodeURIComponent(state)}`, { redirect: 'manual' })
      expect(c.status).toBe(303)
      expect(c.headers.get('location')).toBe('/account/panel?tiktok=bad_state')
      // Nonce birinci (uğursuz) yoxlamada silindi — eyni state ikinci dəfə də keçmir (bir dəfəlik)
      c = await fetch(`${srv.url}/api/tiktok/callback?code=abc123&state=${encodeURIComponent(state)}`, { redirect: 'manual', headers: { cookie: `__Host-mcc_tt=${nonce}` } })
      expect(c.headers.get('location')).toBe('/account/panel?tiktok=bad_state')
      expect(f.path('/v2/oauth/token/')).toHaveLength(0)

      // Yeni qoşulma — düzgün kuki ilə
      const r2 = await fetch(`${srv.url}/api/tiktok/connect`, { redirect: 'manual' })
      const loc2 = new URL(r2.headers.get('location'))
      const n2 = /__Host-mcc_tt=([^;]+)/.exec(r2.headers.get('set-cookie'))[1]
      c = await fetch(`${srv.url}/api/tiktok/callback?code=abc123&scopes=video.upload&state=${encodeURIComponent(loc2.searchParams.get('state'))}`, { redirect: 'manual', headers: { cookie: `__Host-mcc_tt=${n2}` } })
      expect(c.status).toBe(303)
      expect(c.headers.get('location')).toBe('/account/panel?tiktok=connected')
      expect(c.headers.get('set-cookie')).toMatch(/__Host-mcc_tt=; Path=\/; Max-Age=0/)
      const ex = f.path('/v2/oauth/token/')[0].form
      expect(Object.fromEntries(ex)).toEqual({ client_key: KEY, client_secret: SECRET, code: 'abc123', grant_type: 'authorization_code', redirect_uri: 'https://muslims.cc/api/tiktok/callback' })
      // Bazada token açıq mətndə yoxdur
      const row = db.raw.prepare("SELECT v FROM tiktok_state WHERE k = 'token'").get()
      expect(row.v).not.toContain('act.')
      expect(row.v).not.toContain('rft.')
      expect(m._tokenRecord()).toMatchObject({ a: 'act.access-token-0002!abc', r: 'rft.refresh-token-0002!abc', aExp: T0 + 7200e3 })
      // Status: qoşulub, hesab adı; token / secret sızmır
      const s = await (await fetch(`${srv.url}/api/admin/tiktok`)).json()
      expect(s).toMatchObject({ enabled: true, connected: true, account: { name: 'muslims.cc' }, mode: 'inbox', token: { scopeOk: true } })
      const txt = JSON.stringify(s)
      for (const secret of ['act.', 'rft.', SECRET]) expect(txt).not.toContain(secret)
    } finally { await srv.close() }
  })

  it('istifadəçi rədd etdi → denied; vaxtı keçmiş state → bad_state; superadmin deyil / cross-site → 403', async () => {
    const { db, cardDir } = setup()
    let t = T0
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t })
    let { url, nonce } = m.connectUrl('a1')
    expect(await m.handleCallback({ code: '', state: new URL(url).searchParams.get('state'), error: 'access_denied', cookieNonce: nonce })).toBe('denied')
    ;({ url, nonce } = m.connectUrl('a1'))
    t += 11 * 60e3
    expect(await m.handleCallback({ code: 'abc123', state: new URL(url).searchParams.get('state'), error: '', cookieNonce: nonce })).toBe('bad_state')
    t = T0
    ;({ url, nonce } = m.connectUrl('a1'))
    expect(await m.handleCallback({ code: 'abc123', state: new URL(url).searchParams.get('state'), error: '', cookieNonce: 'B'.repeat(22) })).toBe('bad_state')
    expect(f.path('/v2/oauth/token/')).toHaveLength(0)

    for (const role of ['admin', 'editor']) {
      const srv = await app(m, role)
      try { expect((await fetch(`${srv.url}/api/tiktok/connect`, { redirect: 'manual' })).status).toBe(403) } finally { await srv.close() }
    }
    const srv = await app(m, 'superadmin')
    try {
      expect((await fetch(`${srv.url}/api/tiktok/connect`, { redirect: 'manual', headers: { 'sec-fetch-site': 'cross-site' } })).status).toBe(403)
      // post / disconnect — təsdiq tələb olunur
      expect((await fetch(`${srv.url}/api/admin/tiktok/post`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(400)
      expect((await fetch(`${srv.url}/api/admin/tiktok/post`, { method: 'POST' })).status).toBe(400)
      expect((await fetch(`${srv.url}/api/admin/tiktok/post`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"confirm":true}' })).status).toBe(409)
    } finally { await srv.close() }
    const adm = await app(m, 'admin')
    try {
      expect((await fetch(`${adm.url}/api/admin/tiktok`)).status).toBe(200)
      expect((await fetch(`${adm.url}/api/admin/tiktok/disconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"confirm":true}' })).status).toBe(403)
    } finally { await adm.close() }
  })
})

describe('tiktok — gündəlik yükləmə', () => {
  it('inbox: init (yalnız source_info) → 2 hissə PUT (Content-Range) → SEND_TO_USER_INBOX; caption saxlanılır', async () => {
    const { db, cardDir } = setup()
    const size = 11 * MIB + 123
    putReel(cardDir, { size })
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, chunkSize: 5 * MIB })
    expect(await connect(m)).toBe('connected')
    // vaxtdan əvvəl — heç nə
    m._set(T0 - 60e3)
    expect(await m.tick()).toBe(0)
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(0)
    m._set(T0)
    expect(await m.tick()).toBe(1)
    const init = f.path('/v2/post/publish/inbox/video/init/')
    expect(init).toHaveLength(1)
    expect(init[0].headers.Authorization).toBe('Bearer act.access-token-0002!abc')
    expect(init[0].json).toEqual({ source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: 5 * MIB, total_chunk_count: 2 } })
    expect(f.path('/v2/post/publish/video/init/')).toHaveLength(0)
    expect(f.path('/v2/post/publish/creator_info/query/')).toHaveLength(0)
    const puts = f.calls.filter((c) => c.method === 'PUT')
    expect(puts.map((p) => p.headers['Content-Range'])).toEqual([`bytes 0-${5 * MIB - 1}/${size}`, `bytes ${5 * MIB}-${size - 1}/${size}`])
    expect(puts.map((p) => p.body.length)).toEqual([5 * MIB, size - 5 * MIB])
    expect(puts[0].headers['Content-Type']).toBe('video/mp4')
    expect(puts[1].headers['Content-Length']).toBe(String(size - 5 * MIB))
    expect(f.path('/v2/post/publish/status/fetch/')[0].json).toEqual({ publish_id: 'v_pub_file~v2-1.1' })
    const s = m.status()
    expect(s.today.post).toMatchObject({ status: 'sent', attempts: 1 })
    const cap = s.today.post.caption
    expect(cap).toContain('TEXT-en.asad')
    expect(cap).toContain('Al-Ahzab 33:3')
    expect(cap).toContain('Recitation: Mishary Rashid Alafasy')
    expect(cap).toContain('https://muslims.cc/en/quran?s=33&a=3')
    const tags = cap.match(/#\S+/g)
    expect(tags[0]).toBe('#muslimscc')
    expect(tags.length).toBeLessThanOrEqual(5)
    // Eyni gün yenidən — göndərilmir
    expect(await m.tick()).toBe(0)
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(1)
    expect(JSON.stringify(s)).not.toContain('act.')
  })

  it('direct: creator_info → video/init (title = caption, SELF_ONLY, duet/stitch bağlı) → bütöv PUT → PUBLISH_COMPLETE', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir, { size: 9000 })
    const f = fakeFetch({ statuses: ['PROCESSING_UPLOAD', 'PUBLISH_COMPLETE'] })
    const m = mk(db, cardDir, { fetchImpl: f, env: { TIKTOK_MODE: 'direct' } })
    await connect(m)
    expect(await m.tick()).toBe(1)
    expect(f.path('/v2/post/publish/creator_info/query/')).toHaveLength(1)
    const init = f.path('/v2/post/publish/video/init/')[0].json
    expect(init.source_info).toEqual({ source: 'FILE_UPLOAD', video_size: 9000, chunk_size: 9000, total_chunk_count: 1 })
    expect(init.post_info).toMatchObject({ privacy_level: 'SELF_ONLY', disable_comment: false, disable_duet: true, disable_stitch: true, video_cover_timestamp_ms: 20900, brand_content_toggle: false, is_aigc: false })
    expect(init.post_info.title).toContain('Recitation: Mishary Rashid Alafasy')
    expect(f.calls.filter((c) => c.method === 'PUT').map((p) => p.headers['Content-Range'])).toEqual(['bytes 0-8999/9000'])
    expect(m.status()).toMatchObject({ mode: 'direct', privacy: 'SELF_ONLY', today: { post: { status: 'published' } }, account: { name: 'muslims.cc' } })
  })

  it('direct: məxfilik seçimi hesabda yoxdur / video çox uzundur — o gün atlanır, init çağırılmır', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch({ privacy: ['FOLLOWER_OF_CREATOR', 'SELF_ONLY'] })
    const m = mk(db, cardDir, { fetchImpl: f, env: { TIKTOK_MODE: 'direct', TIKTOK_PRIVACY: 'PUBLIC_TO_EVERYONE' } })
    await connect(m)
    expect(await m.tick()).toBe(0)
    expect(f.path('/v2/post/publish/video/init/')).toHaveLength(0)
    expect(m.status().today.post).toMatchObject({ status: 'failed', error: 'privacy_unavailable' })
    expect(m._log._l.errors.join('\n')).toContain('privacy_unavailable')

    const s2 = setup()
    putReel(s2.cardDir, { durationMs: 200000 })
    const f2 = fakeFetch({ maxSec: 180 })
    const m2 = mk(s2.db, s2.cardDir, { fetchImpl: f2, env: { TIKTOK_MODE: 'direct' } })
    await connect(m2)
    await m2.tick()
    expect(m2.status().today.post).toMatchObject({ status: 'failed', error: 'duration_too_long' })
  })

  it('iki proses (kəsintisiz deploy) eyni bazada — video bir dəfə göndərilir', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch()
    const a = mk(db, cardDir, { fetchImpl: f })
    const b = mk(db, cardDir, { fetchImpl: f })
    await connect(a)
    const res = await Promise.all([a.tick(), b.tick(), a.tick(), b.tick()])
    expect(res.reduce((x, y) => x + y, 0)).toBe(1)
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(1)
  })

  it('müvəqqəti xəta (500, 429) → fasilə ilə təkrar; ≤ 5 cəhd', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch({ initFail: [[500, 'internal_error'], [429, 'rate_limit_exceeded']] })
    let t = T0
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t })
    await connect(m)
    expect(await m.tick()).toBe(0)
    expect(m.status().today.post).toMatchObject({ status: 'retry', error: 'internal_error', attempts: 1 })
    expect(await m.tick()).toBe(0)                    // fasilə bitməyib
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(1)
    t += 2 * 60e3 + 1000
    expect(await m.tick()).toBe(0)
    expect(m.status().today.post).toMatchObject({ status: 'retry', error: 'rate_limit_exceeded', attempts: 2 })
    t += 5 * 60e3 + 1000
    expect(await m.tick()).toBe(1)
    expect(m.status().today.post).toMatchObject({ status: 'sent', attempts: 3 })
  })

  it('gündəlik limit (spam_risk_too_many_pending_share) — o gün dayanır, təkrar yoxdur', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch({ initFail: [[403, 'spam_risk_too_many_pending_share']] })
    let t = T0
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t })
    await connect(m)
    await m.tick()
    t += 60 * 60e3
    await m.tick()
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(1)
    expect(m.status().today.post).toMatchObject({ status: 'failed', error: 'spam_risk_too_many_pending_share' })
  })

  it('fayl yoxdur — şəbəkə sorğusu yoxdur, bir dəfə loglanır', async () => {
    const { db, cardDir } = setup()
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f })
    await connect(m)
    const before = f.calls.length
    expect(await m.tick()).toBe(0)
    expect(await m.tick()).toBe(0)
    expect(f.calls.length).toBe(before)
    expect(m._log._l.warns.filter((w) => w.includes('reel'))).toHaveLength(1)
  })
  it('passaj reel-i (67:1-5): uzun mətndə caption mətnsiz qısa variantdır (≤ 2200), istinad və tilavət qalır', async (ctx) => {
    // Passaj sidecar-ları instagramReel.js-in yeni versiyasındadır — köhnə versiyada bu test atlanır
    if (!REEL.parseMeta({ ref: '67:1-5', audio: 'alafasy' })) return ctx.skip()
    const { db, cardDir } = setup()
    putReel(cardDir, { ref: '67:1-5' })
    const f = fakeFetch({ longText: true })
    const m = mk(db, cardDir, { fetchImpl: f })
    await connect(m)
    expect(await m.tick()).toBe(1)
    const cap = m.status().today.post.caption
    expect(cap.length).toBeLessThanOrEqual(2200)
    expect(cap).toContain('67:1-5')
    expect(cap).toContain('Recitation: Mishary Rashid Alafasy')
    expect(cap).not.toContain('TEXT-en.asad')
    expect(m.status().today.post.status).toBe('sent')
  })
})

describe('tiktok — token yeniləmə və avtorizasiya xətası', () => {
  it('access token bitməyə yaxındır → refresh_token ilə yenilənir (rotasiya: yeni refresh saxlanır)', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    let t = T0 - 3 * 3600e3
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t })
    await connect(m)                                   // access 2 saat — T0-da bitib
    t = T0
    expect(await m.tick()).toBe(1)
    const rf = f.path('/v2/oauth/token/').filter((c) => c.form.get('grant_type') === 'refresh_token')
    expect(rf).toHaveLength(1)
    expect(rf[0].form.get('refresh_token')).toBe('rft.refresh-token-0002!abc')
    expect(f.path('/v2/post/publish/inbox/video/init/')[0].headers.Authorization).toBe('Bearer act.access-token-0003!abc')
    expect(m._tokenRecord()).toMatchObject({ r: 'rft.refresh-token-0003!abc', at: T0 })
    // Gündəlik yeniləmə: 20 saatdan tez deyil
    expect(await m.refreshTick()).toBe(false)
    t = T0 + 21 * 3600e3
    expect(await m.refreshTick()).toBe(true)
    expect(m._tokenRecord().r).toBe('rft.refresh-token-0004!abc')
  })

  it('401 access_token_invalid → məcburi yeniləmə və təkrar; yenə 401 → planlayıcı dayanır, bir dəfə loglanır', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch({ initFail: [[401, 'access_token_invalid'], [401, 'access_token_invalid']] })
    let t = T0
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t })
    await connect(m)
    expect(await m.tick()).toBe(0)
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(2)
    expect(f.path('/v2/oauth/token/').filter((c) => c.form.get('grant_type') === 'refresh_token')).toHaveLength(1)
    expect(m.status()).toMatchObject({ authError: 'access_token_invalid', today: { post: { status: 'failed' } } })
    expect(m.ready()).toBe(false)
    const n = f.calls.length
    t += 3600e3
    expect(await m.tick()).toBe(0)
    expect(await m.refreshTick()).toBe(false)
    expect(f.calls.length).toBe(n)
    expect(m._log._l.errors.filter((e) => e.includes('avtorizasiya'))).toHaveLength(1)
    expect(m._log._l.errors.join('\n')).not.toContain('act.')
    // Yenidən qoşulma bloku açır
    expect(await connect(m)).toBe('connected')
    expect(m.ready()).toBe(true)
  })

  it('401-dən sonra bir dəfə yeniləmə kifayətdir — dərc davam edir', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch({ initFail: [[401, 'access_token_invalid']] })
    const m = mk(db, cardDir, { fetchImpl: f })
    await connect(m)
    expect(await m.tick()).toBe(1)
    expect(m.status()).toMatchObject({ authError: null, today: { post: { status: 'sent' } } })
  })

  it('refresh invalid_grant (refresh token ləğv olunub) → blok', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    let t = T0 - 3 * 3600e3
    const f = fakeFetch({ refreshFail: [400, 'invalid_grant'] })
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t })
    await connect(m)
    t = T0
    expect(await m.tick()).toBe(0)
    expect(m.status().authError).toBe('invalid_grant')
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(0)
  })

  it('qoşulmayıbsa — tick heç nə etmir; disconnect tokeni silir (revoke)', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f })
    expect(await m.tick()).toBe(0)
    expect(f.calls).toHaveLength(0)
    await connect(m)
    await m.disconnect()
    expect(f.path('/v2/oauth/revoke/')).toHaveLength(1)
    expect(m.status().connected).toBe(false)
  })
})

describe('tiktok — PULL_FROM_URL rejimi', () => {
  it('video_url /api/tiktok/media/<tarix>-reel.mp4; marşrut yalnız sərt ad, PUT yoxdur', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, env: { TIKTOK_SOURCE: 'url' } })
    await connect(m)
    expect(await m.tick()).toBe(1)
    expect(f.path('/v2/post/publish/inbox/video/init/')[0].json).toEqual({ source_info: { source: 'PULL_FROM_URL', video_url: 'https://muslims.cc/api/tiktok/media/2026-11-25-reel.mp4' } })
    expect(f.calls.filter((c) => c.method === 'PUT')).toHaveLength(0)
    const app = express()
    app.use('/api', m.router)
    const srv = await listen(app)
    try {
      const r = await fetch(`${srv.url}/api/tiktok/media/2026-11-25-reel.mp4`)
      expect(r.status).toBe(200)
      expect(r.headers.get('content-type')).toBe('video/mp4')
      for (const p of ['2026-11-24-reel.mp4', '..%2Ftest.db', '2026-11-25-reel.json']) {
        expect((await fetch(`${srv.url}/api/tiktok/media/${p}`)).status, p).toBe(404)
      }
    } finally { await srv.close() }
  })
})

// ── Gündə 3 video (2026-11-27): hədis 09:00, dua / ad 14:00, Quran passajı 18:30 ──
const IG = require('../../server/instagram.js')
const T09 = Date.parse('2026-11-25T05:00:30Z')   // 09:00:30 Asia/Baku
const T14 = Date.parse('2026-11-25T10:00:30Z')   // 14:00:30 Asia/Baku
function putText(cardDir, kind, { date = DAY, k = 0, audio = 'ambient', durationMs = 24000 } = {}) {
  const c = IG.staticCandidate(kind, date, k, 'en')
  fs.mkdirSync(cardDir, { recursive: true })
  fs.writeFileSync(path.join(cardDir, `${REEL.videoBase(date, kind)}.mp4`), fakeMp4(durationMs, 8192))
  fs.writeFileSync(path.join(cardDir, `${REEL.videoBase(date, kind)}.json`), JSON.stringify({ kind, item: IG.itemIdOf(c.key), audio, lang: 'en' }))
  return c
}

describe('tiktok — 3 yuva', () => {
  it('TIKTOK_TIMES: susmaya görə 09:00,14:00,18:30; "off"; yararsız → susmaya görə; köhnə TIKTOK_TIME — ayə yuvası', () => {
    expect(tt.parseConfig(ENV).slots).toEqual([{ key: 'hadith', time: '09:00' }, { key: 'extra', time: '14:00' }, { key: 'ayah', time: '18:30' }])
    expect(tt.parseConfig({ ...ENV, TIKTOK_TIMES: '8:15, off ,19:00' }).slots).toEqual([{ key: 'hadith', time: '08:15' }, { key: 'extra', time: null }, { key: 'ayah', time: '19:00' }])
    expect(tt.parseConfig({ ...ENV, TIKTOK_TIMES: '8:15, off ,19:00' }).time).toBe('19:00')
    for (const bad of ['09:00,14:00', '09:00,14:00,18:30,20:00', '09:00,25:00,18:30', 'x,y,z']) expect(tt.parseConfig({ ...ENV, TIKTOK_TIMES: bad }).slots.map((s) => s.time)).toEqual(['09:00', '14:00', '18:30'])
    expect(tt.parseConfig({ ...ENV, TIKTOK_TIME: '17:45' }).slots.map((s) => s.time)).toEqual(['09:00', '14:00', '17:45'])
    expect(tt.SLOT_KEYS).toEqual(['hadith', 'extra', 'ayah'])
  })

  it('hər yuva öz vaxtında öz faylını göndərir, öz ingiliscə caption-u ilə; (gün, yuva) üzrə bir dəfə', async () => {
    const { db, cardDir } = setup()
    const hc = putText(cardDir, 'hadith')
    const xkind = IG.kindFor(2, DAY)
    const xc = putText(cardDir, xkind)
    putReel(cardDir)
    let t = T09
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t, env: { TIKTOK_SOURCE: 'url' } })
    await connect(m)
    expect(await m.tick()).toBe(1)
    expect(await m.tick()).toBe(0)
    t = T14
    expect(await m.tick()).toBe(1)
    t = T0
    expect(await m.tick()).toBe(1)
    expect(await m.tick()).toBe(0)
    const urls = f.path('/v2/post/publish/inbox/video/init/').map((c) => c.json.source_info.video_url)
    expect(urls).toEqual([
      `https://muslims.cc/api/tiktok/media/${DAY}-reel-hadith.mp4`, `https://muslims.cc/api/tiktok/media/${DAY}-reel-${xkind}.mp4`,
      `https://muslims.cc/api/tiktok/media/${DAY}-reel.mp4`,
    ])
    const s = m.status()
    expect(s.slots.map((x) => [x.key, x.time, x.kind, x.post && x.post.status])).toEqual([
      ['hadith', '09:00', 'hadith', 'sent'], ['extra', '14:00', xkind, 'sent'], ['ayah', '18:30', 'ayah', 'sent'],
    ])
    const hcap = s.slots[0].post.caption
    expect(hcap).toMatch(/^Hadith of the day/i)
    expect(hcap).toContain(hc.text)
    expect(hcap).toContain(hc.ref)
    expect(hcap).toContain('https://muslims.cc/en/hadith/')
    expect(hcap).not.toContain('Recitation')
    expect(s.slots[1].post.caption).toContain(xc.text)
    expect(s.slots[2].post.caption).toContain('Recitation: Mishary Rashid Alafasy')
    // geriyə uyğunluq: today — ayə yuvası
    expect(s.today.post.status).toBe('sent')
    expect(s.posts.map((p) => p.slot).sort()).toEqual(['ayah', 'extra', 'hadith'])
    expect(s.pending).toEqual({ count: 3, max: tt.PENDING_MAX })
    // media marşrutu yeni adları da verir
    const app = express()
    app.use('/api', m.router)
    const srv = await listen(app)
    try {
      expect((await fetch(`${srv.url}/api/tiktok/media/${DAY}-reel-hadith.mp4`)).status).toBe(200)
      for (const p of [`${DAY}-reel-ayah.mp4`, `${DAY}-reel-hadith.json`, '2026-11-24-reel-hadith.mp4']) expect((await fetch(`${srv.url}/api/tiktok/media/${p}`)).status, p).toBe(404)
    } finally { await srv.close() }
  })

  it('yuvanın faylı yoxdur — o yuva atlanır (yuva üzrə bir dəfə log), digərləri gedir; "off" yuva heç vaxt', async () => {
    const { db, cardDir } = setup()
    putText(cardDir, 'hadith')
    let t = T09
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, clock: () => t, env: { TIKTOK_TIMES: '09:00,off,18:30' } })
    await connect(m)
    expect(await m.tick()).toBe(1)
    t = T14
    expect(await m.tick()).toBe(0)
    t = T0
    expect(await m.tick()).toBe(0)
    expect(await m.tick()).toBe(0)
    expect(m._log._l.warns.filter((w) => w.includes('ayah'))).toHaveLength(1)
    expect(m._log._l.warns.filter((w) => w.includes('extra'))).toHaveLength(0)
    expect(m.status().slots[1]).toMatchObject({ key: 'extra', time: null, post: null })
  })

  it('inbox limiti: 24 saatda 5 gözləyən paylaşım → yuva atlanır (bir dəfə log), köhnələr sayılmır; direct rejimdə limit yoxlanmır', async () => {
    const { db, cardDir } = setup()
    putText(cardDir, 'hadith')
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f, t: T09 })
    await connect(m)
    const raw = db.raw || db
    const ins = raw.prepare(`INSERT INTO tiktok_slot_posts (day, slot, kind, mode, status, publish_id, attempts, created_at, updated_at) VALUES (?, ?, 'hadith', 'inbox', ?, 'p', 1, ?, ?)`)
    for (let i = 0; i < 4; i++) ins.run(`2026-11-1${i}`, 'hadith', 'sent', T09 - 3600e3, T09)
    ins.run('2026-11-01', 'hadith', 'sent', T09 - 25 * 3600e3, T09)       // 24 saatdan köhnə — sayılmır
    ins.run('2026-11-02', 'hadith', 'published', T09 - 3600e3, T09)       // dərc olunub — sayılmır
    expect(m.pendingCount()).toBe(4)
    raw.prepare(`INSERT INTO tiktok_posts (day, mode, status, publish_id, attempts, created_at, updated_at) VALUES ('2026-11-20', 'inbox', 'sent', 'p', 1, ?, ?)`).run(T09 - 3600e3, T09)
    expect(m.pendingCount()).toBe(5)
    expect(await m.tick()).toBe(0)
    expect(await m.tick()).toBe(0)
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(0)
    expect(m._log._l.warns.filter((w) => w.includes('TikTok limiti'))).toHaveLength(1)
    expect(await m.postNow('hadith')).toEqual({ error: 'pending_limit' })
    expect(m.status().pending).toEqual({ count: 5, max: 5 })

    const s2 = setup()
    putText(s2.cardDir, 'hadith')
    const f2 = fakeFetch({ statuses: ['PUBLISH_COMPLETE'] })
    const m2 = mk(s2.db, s2.cardDir, { fetchImpl: f2, t: T09, env: { TIKTOK_MODE: 'direct' } })
    await connect(m2)
    const raw2 = s2.db.raw || s2.db
    for (let i = 0; i < 6; i++) raw2.prepare(`INSERT INTO tiktok_slot_posts (day, slot, kind, mode, status, publish_id, attempts, created_at, updated_at) VALUES (?, 'hadith', 'hadith', 'inbox', 'sent', 'p', 1, ?, ?)`).run(`2026-11-0${i + 1}`, T09 - 3600e3, T09)
    expect(await m2.tick()).toBe(1)
    expect(m2.status().pending).toBeNull()
  })

  it('köhnə tiktok_posts-da bu günün sətri var — ayə yuvası ikinci dəfə getmir; postNow yuva yoxlaması', async () => {
    const { db, cardDir } = setup()
    putReel(cardDir)
    const f = fakeFetch()
    const m = mk(db, cardDir, { fetchImpl: f })
    await connect(m)
    const raw = db.raw || db
    raw.prepare(`INSERT INTO tiktok_posts (day, mode, status, attempts, created_at, updated_at) VALUES (?, 'inbox', 'published', 1, ?, ?)`).run(DAY, T0 - 1000e3, T0 - 1000e3)
    expect(await m.tick()).toBe(0)
    expect(f.path('/v2/post/publish/inbox/video/init/')).toHaveLength(0)
    expect(m.status().today.post).toMatchObject({ status: 'published' })
    expect(await m.postNow('bogus')).toEqual({ error: 'bad_slot' })
    expect(await m.postNow('ayah')).toEqual({ error: 'already' })
    expect(await m.postNow('hadith')).toEqual({ error: 'reel_missing' })
  })
})
