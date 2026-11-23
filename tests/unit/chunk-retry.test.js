// utils/chunkRetry — köhnə deploy chunk-ı → bir dəfə yeniləmə; şəbəkə kəsintisi → yeniləmə YOX, sonra yenidən yüklə
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const chunkErr = () => new TypeError('Failed to fetch dynamically imported module: /assets/X-abc.js')

function setup({ onLine = true } = {}) {
  const listeners = {}
  const nav = { onLine }
  const store = new Map()
  const win = {
    addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn) },
    location: { reload: vi.fn() },
  }
  vi.stubGlobal('window', win)
  vi.stubGlobal('navigator', nav)
  vi.stubGlobal('sessionStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) })
  const fire = (t) => { const l = listeners[t] || []; listeners[t] = l.filter(() => false); l.forEach(fn => fn()) }
  return { win, nav, fire }
}

describe('withChunkRetry', () => {
  beforeEach(() => { vi.resetModules() })
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

  it('onlayn, köhnə chunk → bir dəfə yeniləyir', async () => {
    const env = setup()
    const { withChunkRetry } = await import('../../src/utils/chunkRetry.js')
    const p = withChunkRetry(() => Promise.reject(chunkErr()))()
    await Promise.resolve(); await Promise.resolve()
    expect(env.win.location.reload).toHaveBeenCalledTimes(1)
    void p
  })

  it('başqa xəta yenilənmir, olduğu kimi atılır', async () => {
    const env = setup()
    const { withChunkRetry } = await import('../../src/utils/chunkRetry.js')
    await expect(withChunkRetry(() => Promise.reject(new Error('boom')))()).rejects.toThrow('boom')
    expect(env.win.location.reload).not.toHaveBeenCalled()
  })

  it('oflayn: yeniləmə yox, "online" olanda yenidən yükləyir', async () => {
    const env = setup({ onLine: false })
    const { withChunkRetry } = await import('../../src/utils/chunkRetry.js')
    const factory = vi.fn().mockRejectedValueOnce(chunkErr()).mockResolvedValueOnce({ default: 'M' })
    const p = withChunkRetry(factory)()
    await new Promise(r => setTimeout(r, 0))
    env.nav.onLine = true
    env.fire('online')
    await expect(p).resolves.toEqual({ default: 'M' })
    expect(env.win.location.reload).not.toHaveBeenCalled()
  })

  it('oflayn başlayıb, xəta bağlantı qayıdandan SONRA çatır → yeniləmə yox, yenidən yükləyir', async () => {
    const env = setup({ onLine: false })
    const { withChunkRetry } = await import('../../src/utils/chunkRetry.js')
    let rejectFirst
    const factory = vi.fn()
      .mockImplementationOnce(() => new Promise((_, rej) => { rejectFirst = rej }))
      .mockResolvedValueOnce({ default: 'M' })
    const p = withChunkRetry(factory)()
    env.nav.onLine = true          // bağlantı qayıtdı
    rejectFirst(chunkErr())        // oflayn sorğunun xətası indi çatdı
    await expect(p).resolves.toEqual({ default: 'M' })
    expect(factory).toHaveBeenCalledTimes(2)
    expect(env.win.location.reload).not.toHaveBeenCalled()
  })

  it('onlayn başlayıb, arada qısa kəsinti olub → yeniləmə yox; 10 s sonra yenə adi qayda', async () => {
    vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] })
    const env = setup()
    const { withChunkRetry } = await import('../../src/utils/chunkRetry.js')
    env.fire('offline')
    const factory = vi.fn().mockRejectedValueOnce(chunkErr()).mockResolvedValueOnce({ default: 'M' })
    await expect(withChunkRetry(factory)()).resolves.toEqual({ default: 'M' })
    expect(env.win.location.reload).not.toHaveBeenCalled()
    vi.setSystemTime(1_000_000 + 11_000)
    void withChunkRetry(() => Promise.reject(chunkErr()))()
    await Promise.resolve(); await Promise.resolve()
    expect(env.win.location.reload).toHaveBeenCalledTimes(1)
  })
})
