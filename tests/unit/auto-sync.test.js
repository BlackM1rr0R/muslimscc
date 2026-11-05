// Avtomatik sinxronizasiya (utils/autoSync) — yerli dəyişiklik göndərilir, ziddiyyətdə heç nə yazılmır
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mem = new Map()
globalThis.localStorage = {
  get length() { return mem.size }, key: (i) => [...mem.keys()][i] ?? null,
  getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(),
}
const api = vi.hoisted(() => ({ push: vi.fn(), fetchRemote: vi.fn(), link: vi.fn() }))
vi.mock('../../src/utils/userSync.js', async (orig) => {
  const real = await orig()
  return { ...real, push: api.push, fetchRemote: api.fetchRemote, link: api.link }
})
const { autoSyncOnce, _resetAutoSync } = await import('../../src/utils/autoSync.js')
const { dataHash, SYNC_KEY } = await import('../../src/utils/userSync.js')
const { generateCode } = await import('../../src/utils/syncCrypto.js')
const CODE = generateCode()

const setSync = (v) => localStorage.setItem(SYNC_KEY, JSON.stringify({ code: CODE, version: 3, ...v }))

describe('autoSyncOnce', () => {
  beforeEach(() => { mem.clear(); _resetAutoSync(); api.push.mockReset(); api.fetchRemote.mockReset(); api.link.mockReset() })

  it('söndürülübsə — heç nə etmir', async () => {
    setSync({ auto: false })
    expect(await autoSyncOnce({ force: true })).toBe('off')
    expect(api.push).not.toHaveBeenCalled()
  })
  it('yerli dəyişiklik → push', async () => {
    localStorage.setItem('hifz_progress', '{"1":2}')
    setSync({ auto: true, hash: 'köhnə' })
    api.push.mockResolvedValue({ ok: true })
    expect(await autoSyncOnce({ force: true })).toBe('pushed')
  })
  it('yerli dəyişiklik + başqa cihaz da dəyişib (409) → conflict, gətirmə yoxdur', async () => {
    localStorage.setItem('hifz_progress', '{"1":2}')
    setSync({ auto: true, hash: 'köhnə' })
    api.push.mockResolvedValue({ conflict: true })
    expect(await autoSyncOnce({ force: true })).toBe('conflict')
    expect(api.fetchRemote).not.toHaveBeenCalled()
    expect(api.link).not.toHaveBeenCalled()
  })
  it('dəyişiklik yoxdur, serverdə yeni versiya → link (gətir)', async () => {
    localStorage.setItem('hifz_progress', '{"1":2}')
    setSync({ auto: true, hash: dataHash() })
    api.fetchRemote.mockResolvedValue({ version: 5, backup: {} })
    expect(await autoSyncOnce({ force: true })).toBe('pulled')
    expect(api.link).toHaveBeenCalled()
  })
  it('dəyişiklik yoxdur, server eyni versiyada → idle', async () => {
    setSync({ auto: true, hash: dataHash() })
    api.fetchRemote.mockResolvedValue({ version: 3, backup: {} })
    expect(await autoSyncOnce({ force: true })).toBe('idle')
    expect(api.link).not.toHaveBeenCalled()
  })
})
