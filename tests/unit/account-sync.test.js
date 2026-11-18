// Hesaba bağlı sinxronizasiya axını (src/utils/accountSync.js) — "server" yaddaşda (fetch saxtadır),
// kriptoqrafiya həqiqidir. Bir neçə "cihaz" = localStorage-in təmizlənməsi + modul yaddaşının sıfırlanması.
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Brauzer mühiti: localStorage + window hadisələri ──
const mem = new Map()
globalThis.localStorage = {
  get length() { return mem.size }, key: (i) => [...mem.keys()][i] ?? null,
  getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(),
}
globalThis.window = new EventTarget()
const events = []
globalThis.window.addEventListener('mcc-acctsync', (e) => events.push(e.detail.status))

// ── Saxta server: /api/sync/:id (server/sync.js) + /api/auth/sync-keys|sync-link (server/syncKeys.js) ──
const PASSWORD = 'yaxşı-uzun-şifrə-2026'
const server = { blobs: new Map(), keys: new Map(), link: null, password: PASSWORD, requests: [] }
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
globalThis.fetch = vi.fn(async (path, init = {}) => {
  const method = init.method || 'GET'
  const body = init.body ? JSON.parse(init.body) : null
  server.requests.push(`${method} ${path}`)
  let m
  if ((m = /^\/api\/sync\/([0-9a-f]{64})$/.exec(path))) {
    const row = server.blobs.get(m[1])
    if (method === 'GET') return row ? json(200, { blob: row.blob, version: row.version, updatedAt: row.updatedAt }) : json(404, { error: 'not_found' })
    if (method === 'PUT') {
      const cur = row ? row.version : 0
      if ((body.version || 0) !== cur) return json(409, { version: cur })
      server.blobs.set(m[1], { blob: body.blob, version: cur + 1, updatedAt: Date.now() })
      return json(200, { version: cur + 1, updatedAt: Date.now() })
    }
  }
  if (path.startsWith('/api/auth/') && method !== 'GET' && !init.headers?.['X-Requested-With']) return json(403, { code: 'forbidden' })
  if (path === '/api/auth/sync-keys' && method === 'GET') return json(200, { keys: [...server.keys.values()], syncId: server.link })
  if (path === '/api/auth/sync-keys' && method === 'PUT') { server.keys.set(`${body.kind}/${body.credId || ''}`, { kind: body.kind, credId: body.credId || '', salt: body.salt, wrapped: body.wrapped, createdAt: 1 }); return json(200, { ok: true }) }
  if ((m = /^\/api\/auth\/sync-keys\/(password|prf)(?:\/(.+))?$/.exec(path)) && method === 'DELETE') { server.keys.delete(`${m[1]}/${m[2] || ''}`); return json(200, { ok: true }) }
  if (path === '/api/auth/sync-keys/check-password') return body.password === server.password ? json(200, { ok: true }) : json(400, { code: 'wrong_password' })
  if (path === '/api/auth/sync-link' && method === 'PUT') { server.link = body.syncId; return json(200, { ok: true }) }
  return json(404, { error: 'not_found' })
})

const acc = await import('../../src/utils/accountSync.js')
const { readSync, SYNC_KEY } = await import('../../src/utils/userSync.js')
const { deriveKeys } = await import('../../src/utils/syncCrypto.js')

const USER = { id: 12, email: 'user@example.com', hasPassword: true }
const GOOGLE_USER = { id: 12, email: 'user@example.com', hasPassword: false }

/** Yeni "cihaz": boş yaddaş, modul yaddaşı (şifrə açarı) sıfır */
function newDevice(data = {}) {
  mem.clear()
  acc._resetAccountSync()
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
}
const blobCount = () => server.blobs.size

describe('hesaba bağlı sinxronizasiya', () => {
  beforeEach(() => { events.length = 0 })

  it('A: şifrə ilə ilk giriş, hesabda sinxronizasiya yoxdur → avtomatik açılır (blok + şifrə qabı + bağlantı)', async () => {
    newDevice({ quran_bookmark: '{"surah":18,"ayah":10,"name":"Kəhf","time":5}', muslim_cc_hadith_last: '{"src":"site","id":42,"lang":"az","at":7}', hifz_progress: '{"1":2}' })
    expect(await acc.afterLogin(USER, { password: PASSWORD })).toBe('linked')
    const s = readSync()
    expect(s.acct).toBe(12)
    expect(s.auto).toBe(true)
    expect(blobCount()).toBe(1)
    expect(server.link).toBe((await deriveKeys(s.code)).id)
    const w = server.keys.get('password/')
    expect(w.salt).toMatch(/^pbkdf2-sha256\$600000\$/)
    // Server nə kodu, nə şifrəni, nə də məlumatı görür
    const all = JSON.stringify([...server.keys.values(), ...server.blobs.values()])
    expect(all).not.toContain(s.code)
    expect(all).not.toContain(PASSWORD)
    expect(all).not.toContain('Kəhf')
    expect(acc.readState()).toMatchObject({ uid: 12, status: 'linked' })
  }, 30000)

  it('B: yeni cihazda şifrə ilə giriş → kod açılır, məlumat bərpa olunur ("restored")', async () => {
    newDevice()
    expect(await acc.afterLogin(USER, { password: PASSWORD })).toBe('linked')
    expect(localStorage.getItem('quran_bookmark')).toContain('"surah":18')
    expect(localStorage.getItem('muslim_cc_hadith_last')).toContain('"id":42')
    expect(readSync().acct).toBe(12)
    expect(events).toContain('restored')
    expect(blobCount()).toBe(1)                       // ikinci blok yaradılmayıb
  }, 30000)

  it('C: bu cihazda fərqli məlumat → "choose"; "bu cihazdakı" seçimi birləşdirir və göndərir', async () => {
    newDevice({ hifz_progress: '{"1":2,"2":2}', dua_favs: '[5]', muslim_cc_lang: 'en' })
    expect(await acc.afterLogin(USER, { password: PASSWORD })).toBe('choose')
    expect(acc.readState()).toMatchObject({ status: 'choose', conflicts: 1 })   // dil ziddiyyət sayılmır
    expect(readSync()).toBeNull()                                                 // hələ heç nə yazılmayıb
    expect(localStorage.getItem('quran_bookmark')).toBeNull()
    expect(await acc.resolveChoice(USER, 'local')).toBe('linked')
    expect(localStorage.getItem('hifz_progress')).toBe('{"1":2,"2":2}')         // bu cihazdakı qaldı
    expect(localStorage.getItem('quran_bookmark')).toContain('"surah":18')       // hesabdakı gəldi
    expect(localStorage.getItem('dua_favs')).toBe('[5]')                          // yalnız yerli — qaldı
    // Birləşmə serverə göndərilib: D cihazı hamısını alır
    newDevice()
    await acc.afterLogin(USER, { password: PASSWORD })
    expect(localStorage.getItem('dua_favs')).toBe('[5]')
    expect(localStorage.getItem('hifz_progress')).toBe('{"1":2,"2":2}')
  }, 60000)

  it('C2: fərqlər yalnız birləşdiricisi olan açarlardadır → seçim soruşulmur, birləşir və göndərilir', async () => {
    newDevice({ dua_favs: '[7]', dhikr_count_total: '40' })
    expect(await acc.afterLogin(USER, { password: PASSWORD })).toBe('linked')
    expect(events).not.toContain('choose')
    expect(JSON.parse(localStorage.getItem('dua_favs')).sort()).toEqual([5, 7])
    newDevice()
    await acc.afterLogin(USER, { password: PASSWORD })
    expect(JSON.parse(localStorage.getItem('dua_favs')).sort()).toEqual([5, 7])
    expect(localStorage.getItem('dhikr_count_total')).toBe('40')
  }, 60000)

  it('Google ilə (şifrəsiz) yeni cihaz → "needCode"; kod daxil edilir → bərpa', async () => {
    const code = readSync().code
    newDevice()
    expect(await acc.afterLogin(GOOGLE_USER)).toBe('needCode')
    expect(events).toContain('needCode')
    await expect(acc.enterCode(GOOGLE_USER, 'XXXX')).rejects.toThrow('bad_code')
    expect(await acc.enterCode(GOOGLE_USER, code.toLowerCase())).toBe('linked')
    expect(localStorage.getItem('quran_bookmark')).toContain('"surah":18')
  }, 30000)

  it('səhv şifrə (köhnə qab) → kod açılmır, "needCode" — heç nə silinmir', async () => {
    newDevice({ dua_favs: '[9]' })
    expect(await acc.afterLogin(USER, { password: 'başqa-şifrə-123456' })).toBe('needCode')
    expect(localStorage.getItem('dua_favs')).toBe('[9]')
  }, 30000)

  it('şifrə dəyişəndə kod yeni şifrə ilə yenidən qablanır (kod bu cihazda olmasa da)', async () => {
    newDevice()
    const NEW = 'tamamilə-yeni-şifrə-77'
    expect(await acc.rewrapAfterPasswordChange(USER, { current: PASSWORD, next: NEW })).toBe(true)
    server.password = NEW
    newDevice()
    expect(await acc.afterLogin(USER, { password: NEW })).toBe('linked')
    expect(localStorage.getItem('quran_bookmark')).toContain('"surah":18')
  }, 60000)

  it('hesabsız sinxronizasiyası olan cihaz, hesab boşdur → "offerLink"; bağlananda İKİNCİ blok yaranmır', async () => {
    server.keys.clear(); server.link = null
    newDevice({ dua_favs: '[1]' })
    const { enable } = await import('../../src/utils/userSync.js')
    const { code } = await enable()
    const before = blobCount()
    expect(await acc.afterLogin(GOOGLE_USER)).toBe('offerLink')
    await expect(acc.linkExisting(USER, { password: 'səhv-şifrə-1234' })).rejects.toThrow()   // server şifrəni rədd edir
    expect(await acc.linkExisting(USER, { password: server.password })).toBe('linked')
    expect(blobCount()).toBe(before)
    expect(server.link).toBe((await deriveKeys(code)).id)
    expect(server.keys.get('password/')).toBeTruthy()
  }, 30000)

  it('şifrəsiz hesab, heç yerdə sinxronizasiya yoxdur → "offerEnable"; açılanda kod qaytarılır', async () => {
    server.keys.clear(); server.link = null
    newDevice()
    expect(await acc.afterLogin(GOOGLE_USER)).toBe('offerEnable')
    const { code } = await acc.enableForAccount(GOOGLE_USER)
    expect(code).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){5}$/)
    expect(server.link).toBe((await deriveKeys(code)).id)
    expect(server.keys.size).toBe(0)                  // şifrə yoxdur — yalnız kod açır
    await expect(acc.enableForAccount(GOOGLE_USER)).rejects.toThrow('exists')
  }, 30000)

  it('passkey PRF: qab əlavə olunur, növbəti passkey girişində kod avtomatik açılır', async () => {
    const prf = crypto.getRandomValues(new Uint8Array(32))
    await acc.addPrfWrap(GOOGLE_USER, { credId: 'cred1', bytes: prf })
    expect(server.keys.get('prf/cred1').salt).toMatch(/^hkdf-sha256\$/)
    newDevice()
    expect(await acc.afterLogin(GOOGLE_USER, { prf: { credId: 'cred1', bytes: prf } })).toBe('linked')
    newDevice()
    expect(await acc.afterLogin(GOOGLE_USER, { prf: { credId: 'cred1', bytes: crypto.getRandomValues(new Uint8Array(32)) } })).toBe('needCode')
  }, 30000)

  it('çıxışda "sil": kod unudulur; wipe — sinxronlanan məlumat da (cihaz açarları qalır)', () => {
    newDevice({ dua_favs: '[1]', muslim_cc_motion: 'full', [SYNC_KEY]: JSON.stringify({ code: '0000-1111-2222-3333-4444-5555', version: 1, acct: 12 }) })
    expect(acc.forgetOnThisDevice({ wipe: false })).toBe(0)
    expect(localStorage.getItem(SYNC_KEY)).toBeNull()
    expect(localStorage.getItem('dua_favs')).toBe('[1]')
    expect(acc.forgetOnThisDevice({ wipe: true })).toBe(1)
    expect(localStorage.getItem('dua_favs')).toBeNull()
    expect(localStorage.getItem('muslim_cc_motion')).toBe('full')
  })

  it('vəziyyət açarları ehtiyat nüsxəyə düşmür', async () => {
    const { isBackupKey } = await import('../../src/utils/userBackup.js')
    expect(isBackupKey('mcc_acct_sync')).toBe(false)
    expect(isBackupKey('mcc_logged_in')).toBe(false)
    expect(isBackupKey(SYNC_KEY)).toBe(false)
    // İstifadəçi məlumatı daxildir (AI söhbəti, namaz ayarları, bildiriş tərcihləri)
    // (real açar adları: AI söhbəti, şəhər/metod — utils/prayerLocation, iqamə — MosqueTvPage, bildiriş tərcihləri)
    for (const k of ['muslim_cc_ai_chat', 'muslim_cc_aichat_v2', 'muslim_cc_selected_city', 'muslim_cc_custom_city', 'muslim_cc_recent_cities',
      'muslim_cc_mosque_tv', 'muslim_cc_notif_prefs', 'azan_enabled', 'calendar_reminders', 'muslim_cc_hadith_last']) expect(isBackupKey(k), k).toBe(true)
    // Cihaza aid: push ünvanı, AI limiti
    for (const k of ['muslim_cc_push_endpoint', 'muslim_cc_push_asr', 'muslim_cc_aichat_rate']) expect(isBackupKey(k), k).toBe(false)
  })
})
