// Klient: kukisiz statistika mayakı (src/api/analytics.js) — insan hərəkəti gözlənilir
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

function fakeEnv({ webdriver = false, visibility = 'visible' } = {}) {
  const listeners = { window: new Map(), document: new Map() }
  const on = (where) => (type, fn) => {
    const m = listeners[where]
    if (!m.has(type)) m.set(type, new Set())
    m.get(type).add(fn)
  }
  const off = (where) => (type, fn) => { listeners[where].get(type)?.delete(fn) }
  const sent = []
  const win = {
    location: { hostname: 'muslims.cc', host: 'muslims.cc' },
    addEventListener: on('window'),
    removeEventListener: off('window'),
  }
  const doc = {
    referrer: 'https://www.google.com/',
    visibilityState: visibility,
    addEventListener: on('document'),
    removeEventListener: off('document'),
  }
  const nav = { webdriver, sendBeacon: (url, body) => { sent.push(JSON.parse(body)); return true } }
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', doc)
  vi.stubGlobal('navigator', nav)
  const fire = (where, type, ev = {}) => {
    for (const fn of [...(listeners[where].get(type) || [])]) fn({ type, isTrusted: true, ...ev })
  }
  return { sent, fire, doc, listeners }
}

async function load() {
  vi.resetModules()
  return import('../../src/api/analytics.js')
}

describe('src/api/analytics.js — insan hərəkəti', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(Date.parse('2026-11-24T10:00:00Z')) })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('hərəkətə qədər göndərilmir; ilk toxunuşda son yol + referrer gedir, sonrakılar dərhal', async () => {
    const env = fakeEnv()
    const { trackPageview } = await load()
    trackPageview('/quran')
    expect(env.sent).toEqual([])
    env.fire('window', 'touchstart')
    expect(env.sent).toEqual([{ p: '/quran', r: 'https://www.google.com/', l: 'az' }])
    trackPageview('/ru/hadith')
    expect(env.sent[1]).toEqual({ p: '/ru/hadith', r: '', l: 'ru' })
    // dinləyicilər götürülüb
    expect(env.listeners.window.get('touchstart').size).toBe(0)
  })

  it('hərəkətsiz də: səhifə ~12 san görünəndən sonra sayılır', async () => {
    const env = fakeEnv()
    const { trackPageview } = await load()
    trackPageview('/')
    vi.advanceTimersByTime(11000)
    expect(env.sent).toEqual([])
    vi.advanceTimersByTime(1500)
    expect(env.sent.map((b) => b.p)).toEqual(['/'])
  })

  it('görünməz vaxt sayılmır (gizli tab / prerender)', async () => {
    const env = fakeEnv()
    const { trackPageview } = await load()
    trackPageview('/')
    vi.advanceTimersByTime(5000)
    env.doc.visibilityState = 'hidden'
    env.fire('document', 'visibilitychange')
    vi.advanceTimersByTime(60000)
    expect(env.sent).toEqual([])
    env.doc.visibilityState = 'visible'
    env.fire('document', 'visibilitychange')
    vi.advanceTimersByTime(6000)
    expect(env.sent).toEqual([])
    vi.advanceTimersByTime(1500)
    expect(env.sent.length).toBe(1)
  })

  it('açılışdakı proqram sürüşdürməsi və saxta (isTrusted=false) hadisə sayılmır', async () => {
    const env = fakeEnv()
    const { trackPageview } = await load()
    trackPageview('/')
    env.fire('window', 'scroll')
    env.fire('window', 'pointerdown', { isTrusted: false })
    expect(env.sent).toEqual([])
    vi.advanceTimersByTime(2000)
    env.fire('window', 'scroll')
    expect(env.sent.length).toBe(1)
  })

  it('navigator.webdriver → heç vaxt göndərilmir', async () => {
    const env = fakeEnv({ webdriver: true })
    const { trackPageview } = await load()
    trackPageview('/')
    env.fire('window', 'keydown')
    vi.advanceTimersByTime(30000)
    expect(env.sent).toEqual([])
  })

  it('iframe içində (WordPress plagini / məscid ekranı vidceti) → heç vaxt göndərilmir', async () => {
    const env = fakeEnv()
    globalThis.window.self = globalThis.window
    globalThis.window.top = {}   // başqa saytın pəncərəsi
    const { trackPageview } = await load()
    trackPageview('/mosque-tv')
    env.fire('window', 'keydown')
    vi.advanceTimersByTime(30000)
    expect(env.sent).toEqual([])
  })

  it('admin yolu sayılmır', async () => {
    const env = fakeEnv()
    const { trackPageview } = await load()
    env.fire('window', 'keydown')
    trackPageview('/admin')
    trackPageview('/en/admin/x')
    vi.advanceTimersByTime(30000)
    expect(env.sent).toEqual([])
  })
})
