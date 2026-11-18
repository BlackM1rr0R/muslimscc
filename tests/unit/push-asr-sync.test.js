// Hənəfi əsri push abunəliyində (api/push → syncPushAsr / watchPushAsr): məzhəb hansı
// yolla dəyişirsə dəyişsin (bu cihaz, başqa vərəq / sinxronizasiya — storage hadisəsi,
// açılış) serverə son göndərilən əmsal fərqlidirsə PATCH gedir; fərq yoxdursa — yox.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const calls = []
vi.mock('../../src/api/http', () => {
  class ApiError extends Error { constructor(status) { super('api'); this.status = status } }
  return {
    ApiError,
    apiFetch: vi.fn(async (path, opts = {}) => { calls.push({ path, method: opts.method || 'GET', body: opts.body }); return { ok: true } }),
  }
})

// Brauzer mühiti (node): localStorage, window/document hadisələri
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)) },
  removeItem: (k) => { mem.delete(k) },
  clear: () => mem.clear(),
}
globalThis.window = new EventTarget()
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' })

const push = await import('../../src/api/push')
const { MADHAB_KEY, MADHAB_EVENT } = await import('../../src/utils/madhab')
const { isBackupKey } = await import('../../src/utils/userBackup')

const EP = 'https://fcm.googleapis.com/fcm/send/abc'
const patches = () => calls.filter((c) => c.method === 'PATCH')
const storageEvent = (key) => Object.assign(new Event('storage'), { key })

beforeEach(() => { mem.clear(); calls.length = 0 })
afterEach(() => { vi.useRealTimers() })

describe('syncPushAsr', () => {
  it('abunəlik yoxdursa heç nə göndərilmir', async () => {
    mem.set(MADHAB_KEY, 'hanafi')
    expect(await push.syncPushAsr()).toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('əvvəl heç göndərilməyib (köhnə abunəlik) — bir dəfə PATCH, sonra yox', async () => {
    mem.set(push.ENDPOINT_KEY, EP)
    mem.set(MADHAB_KEY, 'hanafi')
    expect(await push.syncPushAsr()).toBe(true)
    expect(patches()).toHaveLength(1)
    expect(patches()[0].body).toMatchObject({ endpoint: EP, loc: { asr: 2 } })
    expect(mem.get(push.ASR_SENT_KEY)).toBe('2')
    expect(await push.syncPushAsr()).toBe(false)
    expect(patches()).toHaveLength(1)
  })

  it('Hənəfi → Şafii: asr sahəsi getmir (server 1 sayır), açar 1 olur', async () => {
    mem.set(push.ENDPOINT_KEY, EP)
    mem.set(push.ASR_SENT_KEY, '2')
    mem.set(MADHAB_KEY, 'shafii')
    expect(await push.syncPushAsr()).toBe(true)
    expect(patches()[0].body.loc.asr).toBeUndefined()
    expect(mem.get(push.ASR_SENT_KEY)).toBe('1')
  })

  it('eyni dəyər göndərilməkdə ikən təkrar sorğu yoxdur', async () => {
    mem.set(push.ENDPOINT_KEY, EP)
    mem.set(MADHAB_KEY, 'hanafi')
    const [a, b] = await Promise.all([push.syncPushAsr(), push.syncPushAsr()])
    expect([a, b]).toEqual([true, false])
    expect(patches()).toHaveLength(1)
  })

  it('cihaz açarı ehtiyat nüsxəyə / sinxronizasiyaya düşmür', () => {
    expect(isBackupKey(push.ASR_SENT_KEY)).toBe(false)
    expect(isBackupKey(push.ENDPOINT_KEY)).toBe(false)
  })
})

describe('watchPushAsr', () => {
  it('açılışda yoxlayır; başqa cihazdan gələn məzhəb (storage) — debounce ilə bir PATCH', async () => {
    vi.useFakeTimers()
    mem.set(push.ENDPOINT_KEY, EP)
    mem.set(push.ASR_SENT_KEY, '1')
    const stop = push.watchPushAsr({ delay: 100 })
    await vi.advanceTimersByTimeAsync(150)
    expect(patches()).toHaveLength(0)            // açılış: fərq yoxdur

    // Hesab sinxronizasiyası açarı yazır + storage hadisəsi; arxasınca başqa hadisələr
    mem.set(MADHAB_KEY, 'hanafi')
    globalThis.window.dispatchEvent(storageEvent(MADHAB_KEY))
    globalThis.window.dispatchEvent(new Event('qm-autosync'))
    globalThis.window.dispatchEvent(new Event(MADHAB_EVENT))
    await vi.advanceTimersByTimeAsync(150)
    expect(patches()).toHaveLength(1)
    expect(patches()[0].body.loc.asr).toBe(2)

    // Başqa açarın storage hadisəsi — yoxlama yoxdur; vərəqə qayıdış — fərq yoxdur
    globalThis.window.dispatchEvent(storageEvent('muslim_cc_lang'))
    globalThis.document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(150)
    expect(patches()).toHaveLength(1)

    stop()
    mem.set(MADHAB_KEY, 'maliki')
    globalThis.window.dispatchEvent(storageEvent(MADHAB_KEY))
    await vi.advanceTimersByTimeAsync(150)
    expect(patches()).toHaveLength(1)            // dayandırılıb
  })

  it('abunəlik məzhəbdən əvvəl yaranıb (açar yoxdur) — açılışda yenilənir', async () => {
    vi.useFakeTimers()
    mem.set(push.ENDPOINT_KEY, EP)
    mem.set(MADHAB_KEY, 'hanafi')
    const stop = push.watchPushAsr({ delay: 50 })
    await vi.advanceTimersByTimeAsync(80)
    stop()
    expect(patches()).toHaveLength(1)
    expect(mem.get(push.ASR_SENT_KEY)).toBe('2')
  })
})

describe('köhnə bildiriş açarı', () => {
  it('açılışda silinir, abunəlik sayılmır', () => {
    mem.set(push.OLD_PUSH_KEY, 'tok')
    expect(push.getStoredToken()).toBe(null)
    push.removeOldPushKey()
    expect(mem.has(push.OLD_PUSH_KEY)).toBe(false)
  })
})
