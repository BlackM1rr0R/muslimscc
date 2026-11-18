// Ümmətin Canlı Xətmi — klient yaddaşı (src/utils/worldKhatm.js), sinxronizasiya birləşdiricisi,
// profil açarı, passport möhürü, API bitset köməkçiləri.
import { describe, it, expect } from 'vitest'
import {
  KHATM_KEY, sanitizeKhatm, mergeKhatm, readKhatm, addPage, markDone, syncRounds, markSeen, doneRounds, unseenRounds, ummahPages, dayOf,
} from '../../src/utils/worldKhatm.js'
import { runMerger } from '../../src/utils/syncMergers.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { isBackupKey } from '../../src/utils/userBackup.js'
import { syncPassport } from '../../src/utils/passport.js'
import { decodeBits, withPage, hasPage, countPages } from '../../src/api/khatm.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }
}

describe('worldKhatm yaddaşı', () => {
  it('pozuq məlumatı təmizləyir', () => {
    expect(sanitizeKhatm(null)).toEqual({ v: 1, r: {} })
    expect(sanitizeKhatm({ r: { 0: { p: [1] }, x: {}, 5: { p: [3, 3, 0, 605, 2.5, 1], d: 'bad', s: 2 }, 7: { p: [9], d: '2026-11-01', s: 1 } } }))
      .toEqual({ v: 1, r: { 5: { p: [1, 3] }, 7: { p: [9], d: '2026-11-01', s: 1 } } })
  })

  it('səhifə əlavə et → dövr tamamlandı (yalnız iştirak etdiyiniz) → möhür', () => {
    const s = mem()
    expect(markDone(3, '2026-11-18', { storage: s })).toBe(false)   // iştirak yoxdur
    addPage(3, 347, s)
    addPage(3, 347, s)
    addPage(3, 12, s)
    expect(readKhatm(s).r[3]).toEqual({ p: [12, 347] })
    expect(syncPassport({ storage: s, today: '2026-11-18', write: false }).stamps.find((x) => x.id === 'ummah_khatm').earned).toBe(false)
    expect(markDone(3, '2026-11-18', { storage: s })).toBe(true)
    expect(markDone(3, '2026-11-19', { storage: s })).toBe(false)   // ən erkən gün qalır
    expect(doneRounds(readKhatm(s))).toBe(1)
    expect([...ummahPages(readKhatm(s))]).toEqual([12, 347])
    const st = syncPassport({ storage: s, today: '2026-11-18' }).stamps.find((x) => x.id === 'ummah_khatm')
    expect(st).toMatchObject({ earned: true, at: '2026-11-18' })
  })

  it('server dövrləri ilə birləşmə (başqa cihazda iştirak) və "yeni" nişanı bir dəfə', () => {
    const s = mem()
    const at = new Date(2026, 10, 18, 15, 0).getTime()
    expect(syncRounds([{ no: 4, completedAt: at, myPages: 2 }, { no: 5, completedAt: null }, { no: 'x' }], s)).toEqual([4])
    expect(readKhatm(s).r).toEqual({ 4: { p: [], d: dayOf(at) }, 5: { p: [] } })
    expect(syncRounds([{ no: 4, completedAt: at }], s)).toEqual([])
    expect(unseenRounds(readKhatm(s))).toEqual([4])
    expect(markSeen([4], s)).toBe(true)
    expect(unseenRounds(readKhatm(s))).toEqual([])
    expect(markSeen([4], s)).toBe(false)
  })

  it('birləşdirici: səhifələr birlik, gün ən erkən, kommutativ; sinxronizasiya, profil, ehtiyat nüsxə', () => {
    const a = { v: 1, r: { 1: { p: [5], d: '2026-11-10' }, 2: { p: [7] } } }
    const b = { v: 1, r: { 1: { p: [9], d: '2026-11-09', s: 1 }, 3: { p: [1] } } }
    const ab = mergeKhatm(a, b)
    expect(ab).toEqual({ v: 1, r: { 1: { p: [5, 9], d: '2026-11-09', s: 1 }, 2: { p: [7] }, 3: { p: [1] } } })
    expect(mergeKhatm(b, a)).toEqual(ab)
    expect(JSON.parse(runMerger(KHATM_KEY, JSON.stringify(a), JSON.stringify(b)))).toEqual(ab)
    expect(JSON.parse(runMerger(`mcc_profile:p1:${KHATM_KEY}`, JSON.stringify(a), JSON.stringify(b)))).toEqual(ab)
    expect(PROFILE_KEYS).toContain(KHATM_KEY)
    expect(isBackupKey(KHATM_KEY)).toBe(true)
  })
})

describe('api/khatm bitset', () => {
  it('base64 ↔ səhifələr (server encodeBits ilə eyni düzülüş)', () => {
    const bits = decodeBits(Buffer.from([0b00000101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8]).toString('base64'))
    expect(hasPage(bits, 1)).toBe(true)
    expect(hasPage(bits, 2)).toBe(false)
    expect(hasPage(bits, 3)).toBe(true)
    expect(hasPage(bits, 604)).toBe(true)
    expect(countPages(bits)).toBe(3)
    const b2 = withPage(bits, 2)
    expect(countPages(b2)).toBe(4)
    expect(countPages(bits)).toBe(3)   // dəyişməz
    expect(countPages(decodeBits('!!pozuq'))).toBe(0)
  })
})
