// Avtomatik sinxronizasiyanın 409 yolu: 3 tərəfli birləşmə (utils/autoSync → mergeOnConflict).
// "Server" yaddaşdadır (fetch saxtadır), kriptoqrafiya həqiqidir; iki "cihaz" = iki localStorage
// + iki baza (utils/syncBase — yaddaşda saxlayan backend).
import { describe, it, expect, beforeEach, vi } from 'vitest'

const devices = { A: new Map(), B: new Map() }
let mem = devices.A
globalThis.localStorage = {
  get length() { return mem.size }, key: (i) => [...mem.keys()][i] ?? null,
  getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(),
}
globalThis.window = new EventTarget()
const events = []
globalThis.window.addEventListener('qm-autosync', (e) => events.push(e.detail))

const server = { blobs: new Map(), puts: [], interject: null }
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
globalThis.fetch = vi.fn(async (path, init = {}) => {
  const method = init.method || 'GET'
  const body = init.body ? JSON.parse(init.body) : null
  const m = /^\/api\/sync\/([0-9a-f]{64})$/.exec(path)
  if (!m) return json(404, { error: 'not_found' })
  if (method === 'PUT' && server.interject) { const f = server.interject; server.interject = null; f(m[1]) }
  const row = server.blobs.get(m[1])
  if (method === 'GET') return row ? json(200, { blob: row.blob, version: row.version, updatedAt: row.updatedAt }) : json(404, { error: 'not_found' })
  if (method === 'PUT') {
    const cur = row ? row.version : 0
    server.puts.push({ sent: body.version, cur })
    if ((body.version || 0) !== cur) return json(409, { version: cur })
    server.blobs.set(m[1], { blob: body.blob, version: cur + 1, updatedAt: Date.now() })
    return json(200, { version: cur + 1, updatedAt: Date.now() })
  }
  return json(405, {})
})

const { autoSyncOnce, _resetAutoSync } = await import('../../src/utils/autoSync.js')
const sync = await import('../../src/utils/userSync.js')
const { _setBaseBackend, memoryBaseBackend, getBase } = await import('../../src/utils/syncBase.js')
const { applyRead, emptyLife, serializeLife, sanitizeLife, countBits, hasBit, LIFE_KEY } = await import('../../src/utils/quranLife.js')

const bases = { A: memoryBaseBackend(), B: memoryBaseBackend() }
function use(name) { mem = devices[name]; _setBaseBackend(bases[name]); _resetAutoSync() }
const readLife = () => sanitizeLife(JSON.parse(localStorage.getItem(LIFE_KEY) || 'null'))
const addAyahs = (idx) => localStorage.setItem(LIFE_KEY, JSON.stringify(serializeLife(applyRead(readLife(), idx, '2026-11-10').st)))
const tick = () => autoSyncOnce({ force: true })
const last = () => events[events.length - 1]?.type

describe('autoSync 409 → 3 tərəfli birləşmə', () => {
  beforeEach(() => { events.length = 0 })

  it('qurulma: A açır, B qoşulur (hər ikisinin bazası var)', async () => {
    use('A')
    localStorage.setItem('dua_favs', '[1,2]')
    localStorage.setItem('dhikr_count_total', '100')
    localStorage.setItem(LIFE_KEY, JSON.stringify(serializeLife(emptyLife())))
    localStorage.setItem('quran_bookmark', 'b0')
    const { code } = await sync.enable()
    expect(await getBase(code, 1)).toMatchObject({ dua_favs: '[1,2]' })
    use('B')
    const remote = await sync.fetchRemote(code)
    await sync.link(remote)
    expect(sync.readSync().auto).toBe(true)
    expect(await getBase(code, 1)).toMatchObject({ dhikr_count_total: '100' })
  })

  it('iki cihaz fərqli ayələr oxuyur → birlik, ziddiyyət yoxdur; versiya serverinkindən davam edir', async () => {
    use('B')
    addAyahs([10, 11, 12])
    localStorage.setItem('dhikr_count_total', '130')        // +30
    localStorage.setItem('dua_favs', '[1,2,3]')             // 3 əlavə
    expect(await tick()).toBe('pushed')                     // v2

    use('A')
    addAyahs([500, 501])
    localStorage.setItem('dhikr_count_total', '110')        // +10
    localStorage.setItem('dua_favs', '[2]')                 // 1 silindi
    expect(await tick()).toBe('merged')
    expect(last()).toBe('merged')
    expect(events.some((e) => e.type === 'conflict')).toBe(false)
    const st = readLife()
    expect(countBits(st.e)).toBe(5)
    expect([10, 11, 12, 500, 501].every((i) => hasBit(st.e, i))).toBe(true)
    expect(localStorage.getItem('dhikr_count_total')).toBe('140')
    expect(JSON.parse(localStorage.getItem('dua_favs'))).toEqual([2, 3])
    // 409-dan sonra serverin versiyası (2) ilə göndərildi → v3
    expect(server.puts.slice(-2)).toEqual([{ sent: 1, cur: 2 }, { sent: 2, cur: 2 }])
    expect(sync.readSync().version).toBe(3)
    expect(sync.readSync().hash).toBe(sync.dataHash())     // birləşmə göndərilib — "təmiz"

    // B gətirir → eyni nəticə
    use('B')
    expect(await tick()).toBe('pulled')
    expect(countBits(readLife().e)).toBe(5)
    expect(localStorage.getItem('dhikr_count_total')).toBe('140')
    expect(JSON.parse(localStorage.getItem('dua_favs'))).toEqual([2, 3])
  })

  it('yalnız o biri cihazın dəyişdiyi açar götürülür, bu cihazınkı saxlanılır (silinmə də)', async () => {
    use('B')
    localStorage.setItem('quran_bookmark', 'B-yer')
    expect(await tick()).toBe('pushed')
    use('A')
    localStorage.removeItem('dhikr_count_total')          // A sildi (B dəyişməyib)
    localStorage.setItem('hifz_progress', '{"1":2}')       // yeni açar
    expect(await tick()).toBe('merged')
    expect(localStorage.getItem('quran_bookmark')).toBe('B-yer')
    expect(localStorage.getItem('dhikr_count_total')).toBeNull()
    expect(localStorage.getItem('hifz_progress')).toBe('{"1":2}')
    use('B')
    expect(await tick()).toBe('pulled')
    // gətirmə (link) yerli açarları silmir — köhnə davranış; amma yeni açar gəlir
    expect(localStorage.getItem('hifz_progress')).toBe('{"1":2}')
  })

  it('birləşdiricisiz açarda həqiqi ziddiyyət → heç nə yazılmır, "conflict" (açar siyahısı ilə)', async () => {
    use('B')
    localStorage.setItem('quran_bookmark', 'B2')
    addAyahs([20])
    expect(await tick()).toBe('pushed')
    use('A')
    localStorage.setItem('quran_bookmark', 'A2')
    addAyahs([30])
    const before = localStorage.getItem(LIFE_KEY)
    const v = sync.readSync().version
    expect(await tick()).toBe('conflict')
    expect(last()).toBe('conflict')
    expect(events[events.length - 1].keys).toEqual(['quran_bookmark'])
    expect(localStorage.getItem('quran_bookmark')).toBe('A2')
    expect(localStorage.getItem(LIFE_KEY)).toBe(before)      // heç nə yazılmayıb
    expect(sync.readSync().version).toBe(v)
    // istifadəçi həll edir: serverdəkini gətirir → yenidən hər şey normal
    await sync.pull(); sync.markSynced()
    expect(localStorage.getItem('quran_bookmark')).toBe('B2')
  })

  it('birləşmədən sonra yenə 409 (üçüncü cihaz arada göndərdi) → bir dəfə də birləşib göndərir', async () => {
    use('A')
    addAyahs([40])
    const code = sync.readSync().code
    // B əvvəlcə göndərsin ki, A-nın ilk push-u 409 alsın
    use('B'); await tick(); addAyahs([41]); expect(await tick()).toBe('pushed')
    use('A')
    let injected = false
    // A-nın 2-ci PUT-undan (birləşmədən sonrakı) əvvəl "C cihazı" B-nin blokunu yenidən göndərir
    let n = 0
    const realInterject = (id) => {
      const row = server.blobs.get(id)
      server.blobs.set(id, { ...row, version: row.version + 1 })
      injected = true
    }
    server.interject = () => { n++; server.interject = realInterject }   // 1-ci PUT — keçir, 2-cini dəyiş
    expect(await tick()).toBe('merged')
    expect(injected).toBe(true)
    expect(n).toBe(1)
    expect(hasBit(readLife().e, 41)).toBe(true)
    expect(hasBit(readLife().e, 40)).toBe(true)
    expect(sync.readSync().code).toBe(code)
  })

  it('baza yoxdursa (IndexedDB yoxdur) — köhnə davranış: ziddiyyət, gətirmə yoxdur', async () => {
    use('B'); addAyahs([60]); expect(['pushed', 'merged']).toContain(await tick())
    use('A'); _setBaseBackend(null)
    addAyahs([61])
    const gets = fetch.mock.calls.length
    expect(await tick()).toBe('conflict')
    expect(fetch.mock.calls.slice(gets).filter(([, i]) => !i?.method || i.method === 'GET').length).toBe(0)
  })

  it('unlink bazanı silir', async () => {
    use('A')
    const { code, version } = sync.readSync()
    await sync.fetchRemote(code).then((r) => sync.link(r))
    expect(await getBase(code, sync.readSync().version)).not.toBeNull()
    sync.unlink()
    expect(await getBase(code, version)).toBeNull()
    expect(await getBase(code, sync.readSync()?.version ?? 0)).toBeNull()
  })
})
