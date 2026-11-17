// Profillər (src/utils/profiles.js): açarların dəyişdirilməsi, məlumat itməməsi, ehtiyat nüsxə /
// sinxronizasiyaya daxil olma (iş nüsxəsi YOX, ad sahələri VAR) və iki cihaz arasında qarışmama.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const devices = { A: new Map(), B: new Map() }
let mem = devices.A
const makeStorage = (m) => ({
  get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
  getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(),
})
globalThis.localStorage = {
  get length() { return mem.size }, key: (i) => [...mem.keys()][i] ?? null,
  getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(),
}
globalThis.window = new EventTarget()

const server = { blobs: new Map() }
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
globalThis.fetch = vi.fn(async (path, init = {}) => {
  const method = init.method || 'GET'
  const body = init.body ? JSON.parse(init.body) : null
  const m = /^\/api\/sync\/([0-9a-f]{64})$/.exec(path)
  if (!m) return json(404, { error: 'not_found' })
  const row = server.blobs.get(m[1])
  if (method === 'GET') return row ? json(200, { blob: row.blob, version: row.version, updatedAt: row.updatedAt }) : json(404, { error: 'not_found' })
  if (method === 'PUT') {
    const cur = row ? row.version : 0
    if ((body.version || 0) !== cur) return json(409, { version: cur })
    server.blobs.set(m[1], { blob: body.blob, version: cur + 1, updatedAt: Date.now() })
    return json(200, { version: cur + 1, updatedAt: Date.now() })
  }
  return json(405, {})
})

const P = await import('../../src/utils/profiles.js')
const { collectBackup, restoreBackup, parseBackup, isBackupKey } = await import('../../src/utils/userBackup.js')
const { mergeData } = await import('../../src/utils/syncMerge.js')
const { autoSyncOnce, _resetAutoSync } = await import('../../src/utils/autoSync.js')
const sync = await import('../../src/utils/userSync.js')
const { _setBaseBackend, memoryBaseBackend } = await import('../../src/utils/syncBase.js')

const bases = { A: memoryBaseBackend(), B: memoryBaseBackend() }
function use(name) { mem = devices[name]; _setBaseBackend(bases[name]); _resetAutoSync() }
const tick = () => autoSyncOnce({ force: true })

describe('profiles — saf məntiq', () => {
  let s
  beforeEach(() => { s = makeStorage(new Map()) })

  it('profillər bağlıdırsa heç nə dəyişmir', () => {
    s.setItem('hifz_srs', 'x')
    expect(P.profilesOn(s)).toBe(false)
    expect(P.flushActive(s)).toBe(true)
    expect(P.hydrateActive(s)).toEqual([])
    expect(s.length).toBe(1)
  })

  it('açılış: mövcud məlumat birinci profilə aid olur, ikinci profil boş başlayır; keçid açarları dəyişir', () => {
    s.setItem('hifz_srs', 'ANA-hifz')
    s.setItem('muslim_cc_storybooks', 'ANA-kitab')
    s.setItem('muslim_cc_lang', 'az')                 // ortaq açar
    const reg = P.enableProfiles({ name: 'Ana', avatar: 'star8' }, { name: 'Ali', avatar: 'crescent', kid: true }, s)
    expect(reg.list.map((p) => p.name)).toEqual(['Ana', 'Ali'])
    const [ana, ali] = reg.list
    expect(P.activeId(s)).toBe(ana.id)
    expect(s.getItem(P.nsKey(ana.id, 'hifz_srs'))).toBe('ANA-hifz')

    expect(P.switchProfile(ali.id, s)).toBe(true)
    expect(s.getItem('hifz_srs')).toBe(null)            // Alinin iş nüsxəsi boşdur
    expect(s.getItem('muslim_cc_storybooks')).toBe(null)
    expect(s.getItem('muslim_cc_lang')).toBe('az')      // ortaq qaldı
    s.setItem('muslim_cc_storybooks', 'ALI-kitab')

    expect(P.switchProfile(ana.id, s)).toBe(true)
    expect(s.getItem('hifz_srs')).toBe('ANA-hifz')
    expect(s.getItem('muslim_cc_storybooks')).toBe('ANA-kitab')
    s.removeItem('hifz_srs')                            // Ana silir — silinmə də yadda qalır

    expect(P.switchProfile(ali.id, s)).toBe(true)
    expect(s.getItem('muslim_cc_storybooks')).toBe('ALI-kitab')
    P.switchProfile(ana.id, s)
    expect(s.getItem('hifz_srs')).toBe(null)
    expect(s.getItem('muslim_cc_storybooks')).toBe('ANA-kitab')
  })

  it('yaddaş dolubsa keçid ləğv olunur — məlumat itmir', () => {
    s.setItem('hifz_srs', 'v1')
    const reg = P.enableProfiles({ name: 'Ana' }, { name: 'Ali' }, s)
    s.setItem('hifz_srs', 'v2')
    const real = s.setItem
    s.setItem = () => { throw new Error('QuotaExceededError') }
    expect(P.switchProfile(reg.list[1].id, s)).toBe(false)
    s.setItem = real
    expect(s.getItem('hifz_srs')).toBe('v2')
    expect(P.activeId(s)).toBe(reg.list[0].id)
  })

  it('aktiv profil silinmir; digəri məlumatı ilə silinir; həddlər, adların təmizlənməsi', () => {
    const reg = P.enableProfiles({ name: '  Ana‮ ' }, null, s)
    expect(reg.list[0].name).toBe('Ana')
    for (let i = 1; i < P.MAX_PROFILES; i++) P.addProfile({ name: `Uşaq ${i}` }, s)
    expect(() => P.addProfile({ name: 'Artıq' }, s)).toThrow('too_many')
    expect(() => P.addProfile({ name: '   ' }, s)).toThrow()
    const list = P.readRegistry(s).list
    expect(() => P.removeProfile(list[0].id, s)).toThrow('active')
    P.switchProfile(list[1].id, s)
    s.setItem('quran_life_v1', 'L')
    P.switchProfile(list[0].id, s)
    expect(P.profileKeys(list[1].id, s)).toHaveLength(1)
    P.removeProfile(list[1].id, s)
    expect(P.profileKeys(list[1].id, s)).toEqual([])
    expect(P.readRegistry(s).list).toHaveLength(P.MAX_PROFILES - 1)
    expect(() => P.disableProfiles(s)).toThrow('many')
    expect(P.updateProfile(list[2].id, { avatar: 'hexagon', color: 'nope' }, s)).toMatchObject({ avatar: 'hexagon', color: 'emerald' })
  })

  it('başqa cihazda silinmiş aktiv profil: iş nüsxəsi başqa profilə yazılmır ("orphan")', () => {
    const reg = P.enableProfiles({ name: 'Ana' }, { name: 'Ali' }, s)
    const [ana, ali] = reg.list
    s.setItem('hifz_srs', 'ANA')
    P.switchProfile(ali.id, s)
    s.setItem('hifz_srs', 'ALI')
    // reyestr sinxronizasiya ilə gəldi: Ali silinib
    s.setItem(P.REGISTRY_KEY, JSON.stringify({ v: 1, list: [ana] }))
    expect(P.workingOwner(s)).toBe('orphan')
    P.flushActive(s)
    expect(s.getItem(P.nsKey(ana.id, 'hifz_srs'))).toBe('ANA')
    P.hydrateActive(s)
    expect(s.getItem('hifz_srs')).toBe('ANA')
    expect(P.workingOwner(s)).toBe('ok')
  })

  it('ehtiyat nüsxə: iş nüsxəsi yox, hər profilin ad sahəsi və reyestr var; aktiv id cihazda qalır', () => {
    s.setItem('hifz_srs', 'ANA')
    const reg = P.enableProfiles({ name: 'Ana' }, { name: 'Ali' }, s)
    P.switchProfile(reg.list[1].id, s)
    s.setItem('hifz_srs', 'ALI')           // flush edilməmiş dəyişiklik
    const b = collectBackup(s)
    expect(b.data.hifz_srs).toBeUndefined()
    expect(b.data[P.nsKey(reg.list[0].id, 'hifz_srs')]).toBe('ANA')
    expect(b.data[P.nsKey(reg.list[1].id, 'hifz_srs')]).toBe('ALI')   // collect əvvəlcə flush edir
    expect(b.data[P.REGISTRY_KEY]).toBeTruthy()
    expect(b.data[P.ACTIVE_KEY]).toBeUndefined()
    expect(isBackupKey(P.ACTIVE_KEY)).toBe(false)

    // başqa (təmiz) cihazda bərpa → birinci profil aktivdir, iş nüsxəsi ondan
    const t = makeStorage(new Map())
    restoreBackup(parseBackup(JSON.stringify(b)).backup, t)
    expect(t.getItem('hifz_srs')).toBe('ANA')
    P.switchProfile(reg.list[1].id, t)
    expect(t.getItem('hifz_srs')).toBe('ALI')
  })

  it('profilsiz köhnə nüsxə profilli cihaza: şəxsi açarlar aktiv profilə yazılır', () => {
    const reg = P.enableProfiles({ name: 'Ana' }, { name: 'Ali' }, s)
    P.switchProfile(reg.list[1].id, s)
    restoreBackup({ data: { hifz_srs: 'OLD', dua_favs: '[1]' } }, s)
    expect(s.getItem('hifz_srs')).toBe('OLD')
    expect(s.getItem(P.nsKey(reg.list[1].id, 'hifz_srs'))).toBe('OLD')
    expect(s.getItem(P.nsKey(reg.list[0].id, 'hifz_srs'))).toBe(null)
  })

  it('mergeData: profillər açıqdırsa iş nüsxəsi açarları nəzərə alınmır', () => {
    const reg = JSON.stringify({ v: 1, list: [{ id: 'pabcdef', name: 'Ana' }] })
    const r = mergeData({ [P.REGISTRY_KEY]: reg, 'mcc_profile:pabcdef:hifz_srs': 'X' }, { hifz_srs: 'stale' }, null)
    expect(r.data.hifz_srs).toBeUndefined()
    expect(r.data['mcc_profile:pabcdef:hifz_srs']).toBe('X')
    expect(r.conflicts).toEqual([])
  })
})

describe('profiles — iki cihaz, avtomatik sinxronizasiya', () => {
  it('A-da Ana/Ali, B-də Ali aktiv: hər biri öz irəliləyişini yazır, heç nə qarışmır', async () => {
    use('A')
    localStorage.setItem('hifz_srs', 'ANA-1')
    localStorage.setItem('dua_favs', '[1]')
    const reg = P.enableProfiles({ name: 'Ana' }, { name: 'Ali', kid: true })
    const [ana, ali] = reg.list
    const { code } = await sync.enable()

    use('B')
    localStorage.setItem('hifz_srs', 'B-local')     // B-nin əvvəlki məlumatı (profilsiz)
    const remote = await sync.fetchRemote(code)
    await sync.link(remote)
    expect(P.readRegistry().list.map((p) => p.name)).toEqual(['Ana', 'Ali'])
    expect(localStorage.getItem('hifz_srs')).toBe('ANA-1')   // hesabdakı Ana — B-nin köhnəsi Anada boşluq olmadığı üçün əzilmir
    expect(P.switchProfile(ali.id)).toBe(true)
    localStorage.setItem('hifz_srs', 'ALI-1')
    expect(await tick()).toBe('pushed')

    use('A')                                          // A-da Ana aktivdir
    localStorage.setItem('hifz_srs', 'ANA-2')
    expect(['merged', 'pushed']).toContain(await tick())
    expect(localStorage.getItem('hifz_srs')).toBe('ANA-2')    // Ananın iş nüsxəsi toxunulmadı
    expect(localStorage.getItem(P.nsKey(ali.id, 'hifz_srs'))).toBe('ALI-1')
    P.switchProfile(ali.id)
    expect(localStorage.getItem('hifz_srs')).toBe('ALI-1')
    P.switchProfile(ana.id)

    use('B')
    expect(await tick()).toBe('pulled')
    expect(localStorage.getItem('hifz_srs')).toBe('ALI-1')    // B-də Ali aktivdir
    expect(localStorage.getItem(P.nsKey(ana.id, 'hifz_srs'))).toBe('ANA-2')
    expect(localStorage.getItem('dua_favs')).toBe('[1]')      // ortaq açar adi qaydada
  })
})
