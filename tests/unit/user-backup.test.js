// İstifadəçi məlumatının ehtiyat nüsxəsi (utils/userBackup)
import { describe, it, expect } from 'vitest'
import {
  isBackupKey, collectBackup, parseBackup, restoreBackup, backupFileName, BACKUP_KIND,
} from '../../src/utils/userBackup.js'

function memStorage(init = {}) {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    dump: () => Object.fromEntries(m),
  }
}

const USER = {
  muslim_cc_prayer_status: '{"2026-11-04":{"fajr":"prayed"}}',
  muslim_cc_qada_v1: '{"fajr":12}',
  hifz_srs: '{"1":{"due":1}}',
  dua_favs: '[3,7]',
  muslim_cc_lang: 'az',
}
const CACHE = {
  'qm_ptimes_04-11-2026|baku': '{}',
  'mushaf:v1:12:en': '{}',
  'tafsir:v1:x': '{}',
  'he1:list': '[]',
  muslim_cc_fcm_token: 'tok',
  muslim_cc_push_endpoint: 'https://fcm…',
  muslim_cc_session_started: '1',
  'qm-update-reload': '1',
}

describe('isBackupKey', () => {
  it('istifadəçi məlumatı daxil, keş və cihaz açarları xaric', () => {
    for (const k of Object.keys(USER)) expect(isBackupKey(k)).toBe(true)
    for (const k of Object.keys(CACHE)) expect(isBackupKey(k)).toBe(false)
    expect(isBackupKey('')).toBe(false)
    expect(isBackupKey(null)).toBe(false)
  })
})

describe('collectBackup → parseBackup → restoreBackup', () => {
  it('gediş-dönüş: yalnız istifadəçi məlumatı köçür, dəyərlər dəyişmir', () => {
    const src = memStorage({ ...USER, ...CACHE })
    const b = collectBackup(src, new Date('2026-11-04T10:00:00Z'))
    expect(b.kind).toBe(BACKUP_KIND)
    expect(b.count).toBe(Object.keys(USER).length)
    expect(b.data).toEqual(USER)

    const parsed = parseBackup(JSON.stringify(b))
    expect(parsed.ok).toBe(true)
    expect(parsed.backup.createdAt).toBe('2026-11-04T10:00:00.000Z')

    const dst = memStorage({ dua_favs: '[1]', other_local: 'x' })
    expect(restoreBackup(parsed.backup, dst)).toBe(Object.keys(USER).length)
    const out = dst.dump()
    expect(out.dua_favs).toBe('[3,7]')          // fayldakı qalib gəlir
    expect(out.other_local).toBe('x')           // faylda olmayan silinmir
    expect(out.muslim_cc_qada_v1).toBe('{"fajr":12}')
  })
})

describe('parseBackup — pis fayllar', () => {
  it.each([
    ['not json', 'json'],
    [JSON.stringify({ hello: 1 }), 'kind'],
    [JSON.stringify({ kind: BACKUP_KIND, version: 99, data: { a: '1' } }), 'version'],
    [JSON.stringify({ kind: BACKUP_KIND, version: 1, data: [] }), 'kind'],
    [JSON.stringify({ kind: BACKUP_KIND, version: 1, data: { 'qm_ptimes_x': '{}' } }), 'empty'],
  ])('%s → %s', (text, code) => {
    expect(parseBackup(text)).toEqual({ ok: false, code })
  })

  it('keş açarları, sətir olmayan dəyərlər və __proto__ süzülür', () => {
    const text = '{"kind":"' + BACKUP_KIND + '","version":1,"data":{"dua_favs":"[1]","n":5,"mushaf:v1:1":"x","__proto__":"evil"}}'
    const r = parseBackup(text)
    expect(r.ok).toBe(true)
    expect(r.backup.data).toEqual({ dua_favs: '[1]' })
    expect({}.polluted).toBeUndefined()
  })
})

it('backupFileName', () => {
  expect(backupFileName(new Date(2026, 10, 4))).toBe('muslims-cc-backup-2026-11-04.json')
})
