// Dua zaman kapsulu — saf məntiq (src/utils/duaCapsule.js)
import { describe, it, expect } from 'vitest'
import {
  STORAGE_KEY, MAX_TEXT, parseCapsules, validateCapsule, serializeCapsules, createCapsule,
  capsuleState, daysUntil, nextRamadan, nextEidAdha, inOneYear, parseCustomDate, presetOpenAt,
  resealCapsule, sortCapsules, loadCapsules, saveCapsules,
} from '../../src/utils/duaCapsule.js'
import { gregorianToHijri, fromLocalDate } from '../../src/utils/hijri.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const NOW = new Date(2026, 10, 16, 12, 0)   // 16 noyabr 2026
const ok = { id: 'a', text: 'Ya Rəbb', createdAt: '2026-01-01T10:00:00.000Z', openAt: '2026-03-01T00:00:00.000Z', opened: false }

describe('parse / validate', () => {
  it('etibarlı kapsul qalır, artıq sahə atılır', () => {
    expect(validateCapsule({ ...ok, junk: 1 })).toEqual(ok)
    expect(validateCapsule({ ...ok, answered: true }).answered).toBe(true)
  })
  it('yararsızlar atılır', () => {
    for (const bad of [null, [], 'x', { ...ok, id: '' }, { ...ok, text: '   ' }, { ...ok, text: 5 },
      { ...ok, openAt: 'sabah' }, { ...ok, createdAt: undefined }]) expect(validateCapsule(bad)).toBeNull()
  })
  it('mətn MAX_TEXT-ə qədər kəsilir', () => {
    expect(validateCapsule({ ...ok, text: 'x'.repeat(MAX_TEXT + 50) }).text).toHaveLength(MAX_TEXT)
  })
  it('xarab JSON / massiv olmayan → boş; id təkrarı atılır', () => {
    expect(parseCapsules('{oops')).toEqual([])
    expect(parseCapsules('{"a":1}')).toEqual([])
    expect(parseCapsules(null)).toEqual([])
    expect(parseCapsules(JSON.stringify([ok, ok, { bad: 1 }]))).toEqual([ok])
  })
  it('serialize → parse eynidir', () => {
    expect(parseCapsules(serializeCapsules([ok, { x: 1 }]))).toEqual([ok])
  })
  it('localStorage yükləmə / yazma', () => {
    const m = new Map()
    const st = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
    expect(saveCapsules([ok], st)).toBe(true)
    expect(m.has(STORAGE_KEY)).toBe(true)
    expect(loadCapsules(st)).toEqual([ok])
    expect(loadCapsules({ getItem: () => { throw new Error('blocked') } })).toEqual([])
  })
  it('açar ehtiyat nüsxəyə düşür', () => {
    expect(isBackupKey(STORAGE_KEY)).toBe(true)
  })
})

describe('açılış məntiqi', () => {
  it('createCapsule: boş mətn və keçmiş tarix rədd', () => {
    const future = new Date(2027, 0, 1)
    expect(createCapsule('  ', future, NOW)).toBeNull()
    expect(createCapsule('dua', new Date(2020, 0, 1), NOW)).toBeNull()
    const c = createCapsule('  dua  ', future, NOW, 'id1')
    expect(c).toEqual({ id: 'id1', text: 'dua', createdAt: NOW.toISOString(), openAt: future.toISOString(), opened: false })
  })
  it('vəziyyət: sealed → ready → opened', () => {
    const c = createCapsule('dua', new Date(2026, 10, 20), NOW, 'x')
    expect(capsuleState(c, NOW)).toBe('sealed')
    expect(daysUntil(c.openAt, NOW)).toBe(4)
    expect(capsuleState(c, new Date(2026, 10, 20))).toBe('ready')
    expect(daysUntil(c.openAt, new Date(2026, 10, 21))).toBe(0)
    expect(capsuleState({ ...c, opened: true }, NOW)).toBe('opened')
  })
  it('yenidən möhürləmə: mətn və yazılma tarixi qalır, opened sıfırlanır', () => {
    const c = { ...ok, opened: true, answered: true }
    const r = resealCapsule(c, new Date(2027, 5, 1))
    expect(r).toMatchObject({ id: 'a', text: ok.text, createdAt: ok.createdAt, opened: false })
    expect(r.answered).toBeUndefined()
    expect(capsuleState(r, NOW)).toBe('sealed')
  })
  it('rəf sırası: ready, sealed (yaxın əvvəl), opened', () => {
    const r = { ...ok, id: 'r', openAt: '2026-01-01T00:00:00.000Z' }
    const s1 = { ...ok, id: 's1', openAt: '2027-05-01T00:00:00.000Z' }
    const s2 = { ...ok, id: 's2', openAt: '2027-01-01T00:00:00.000Z' }
    const o = { ...ok, id: 'o', opened: true }
    expect(sortCapsules([o, s1, r, s2], NOW).map(x => x.id)).toEqual(['r', 's2', 's1', 'o'])
  })
  it('1 il sonra; 29 fevral → 28 fevral', () => {
    expect(inOneYear(NOW)).toEqual(new Date(2027, 10, 16))
    expect(inOneYear(new Date(2028, 1, 29, 9))).toEqual(new Date(2029, 1, 28))
  })
  it('öz tarix: yalnız gələcək və düzgün tarix', () => {
    expect(parseCustomDate('2026-11-16', NOW)).toBeNull()
    expect(parseCustomDate('2026-02-30', NOW)).toBeNull()
    expect(parseCustomDate('abc', NOW)).toBeNull()
    expect(parseCustomDate('2026-11-17', NOW)).toEqual(new Date(2026, 10, 17))
    expect(presetOpenAt('custom', NOW, '2027-01-02')).toEqual(new Date(2027, 0, 2))
    expect(presetOpenAt('nope', NOW)).toBeNull()
  })
})

describe('hicri hazır seçimlər', () => {
  it('gələn Ramazan gələcəkdədir və 1 Ramazana düşür', () => {
    const d = nextRamadan(NOW)
    expect(d.getTime()).toBeGreaterThan(NOW.getTime())
    expect(d.getTime() - NOW.getTime()).toBeLessThan(356 * 86400000)
    const h = gregorianToHijri(fromLocalDate(d))
    expect([h.month, h.day]).toEqual([9, 1])
    // 1448-ci il Ramazanı — 2027-ci ilin fevralı
    expect([d.getFullYear(), d.getMonth()]).toEqual([2027, 1])
  })
  it('Ramazanın içində → gələn ilin Ramazanı', () => {
    const inside = new Date(2027, 1, 20)
    const d = nextRamadan(inside)
    expect(d.getFullYear()).toBe(2028)
    expect(gregorianToHijri(fromLocalDate(d)).month).toBe(9)
  })
  it('gələn Qurban bayramı 10 Zilhiccədir və gələcəkdədir', () => {
    const d = nextEidAdha(NOW)
    expect(d.getTime()).toBeGreaterThan(NOW.getTime())
    const h = gregorianToHijri(fromLocalDate(d))
    expect([h.month, h.day]).toEqual([12, 10])
  })
  it('bu günün özündə deyil — sonrakı il', () => {
    const r = nextRamadan(NOW)
    const again = nextRamadan(new Date(r.getFullYear(), r.getMonth(), r.getDate(), 15))
    expect(again.getTime()).toBeGreaterThan(r.getTime() + 300 * 86400000)
  })
  it('real "indi" ilə də gələcəkdədir', () => {
    expect(nextRamadan().getTime()).toBeGreaterThan(Date.now())
  })
})
