// P1: heyz/nifas təqvimi (utils/haidLog, utils/haidRamadan) — təmizləmə, yoxlamalar, uzunluq,
// Ramazan günləri (Ümmül-Qura, təxmini), qəzaya əlavə və sinxron birləşmə. Hökm verilmir — test də yoxlayır.
import { describe, it, expect } from 'vitest'
import {
  sanitizeHaidEntry, sanitizeHaid, readHaid, saveHaidEntry, removeHaidEntry, markAdded, setNeutral, spanDays,
  lengthsByKind, mergeHaid, HAID_KEY,
} from '../../src/utils/haidLog.js'
import { ramadanDaysIn, makeupList } from '../../src/utils/haidRamadan.js'
import { gregorianToHijri } from '../../src/utils/hijri.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { hasMerger, runMerger } from '../../src/utils/syncMergers.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}

describe('haidLog — təmizləmə və yoxlama', () => {
  it('düzgün qeyd; yanlış növ, tarix, tərs aralıq atılır', () => {
    expect(sanitizeHaidEntry({ id: 'habcde1', k: 'hayd', s: '2026-11-01', e: '2026-11-06', u: 1 })).toMatchObject({ k: 'hayd', s: '2026-11-01', e: '2026-11-06' })
    expect(sanitizeHaidEntry({ id: 'habcde1', k: 'x', s: '2026-11-01' })).toBeNull()
    expect(sanitizeHaidEntry({ id: 'habcde1', k: 'hayd', s: '2026-11-06', e: '2026-11-01' })).toBeNull()
    expect(sanitizeHaidEntry({ id: 'habcde1', k: 'nifas', s: '2026-13-01' })).toBeNull()
  })
  it('saxlama: başlanğıc / son gün bu gündən sonra ola bilməz', () => {
    const s = mem()
    expect(saveHaidEntry({ k: 'hayd', s: '2026-11-30' }, s, 1, '2026-11-23')).toMatchObject({ ok: false, code: 'start' })
    expect(saveHaidEntry({ k: 'hayd', s: '2026-11-20', e: '2026-11-25' }, s, 1, '2026-11-23')).toMatchObject({ ok: false, code: 'end' })
    expect(saveHaidEntry({ k: 'hayd', s: '2026-11-20', e: '2026-11-19' }, s, 1, '2026-11-23')).toMatchObject({ ok: false, code: 'end' })
    const r = saveHaidEntry({ k: 'hayd', s: '2026-11-20' }, s, 1, '2026-11-23')
    expect(r.ok).toBe(true)
    expect(readHaid(s).l).toHaveLength(1)
    expect(removeHaidEntry(r.item.id, s).l).toHaveLength(0)
    expect(s.getItem(HAID_KEY)).toBeNull()
  })
  it('uzunluq — hər iki gün daxil; davam edən — bu günə qədər', () => {
    expect(spanDays({ s: '2026-11-01', e: '2026-11-07' })).toBe(7)
    expect(spanDays({ s: '2026-11-20' }, '2026-11-23')).toBe(4)
  })
  it('öz uzunluqları: yalnız bitmiş qeydlər, növ üzrə', () => {
    const d = sanitizeHaid({ l: [
      { id: 'h000001', k: 'hayd', s: '2026-09-01', e: '2026-09-05', u: 1 },
      { id: 'h000002', k: 'hayd', s: '2026-10-01', u: 2 },
      { id: 'h000003', k: 'nifas', s: '2026-06-01', e: '2026-06-30', u: 3 },
    ] })
    expect(lengthsByKind(d, 'hayd').map((x) => x.days)).toEqual([5])
    expect(lengthsByKind(d, 'nifas').map((x) => x.days)).toEqual([30])
  })
  it('neytral başlıq yadda qalır və qeyd olmasa da saxlanılır', () => {
    const s = mem()
    expect(setNeutral(true, s, 5).p).toEqual({ n: true, t: 5 })
    expect(readHaid(s).p.n).toBe(true)
    setNeutral(false, s, 6)
    expect(s.getItem(HAID_KEY)).toBeNull()
  })
})

describe('haidRamadan — Ramazan günləri və qəza siyahısı', () => {
  // Test cihazın təqvimindən asılı olmasın: Ramazanın bir gününü hicri təqvimlə tapırıq
  const findRamadanDay = () => {
    for (let d = 0; d < 400; d++) {
      const dt = new Date(Date.UTC(2026, 0, 1 + d))
      const g = { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() }
      const h = gregorianToHijri(g)
      if (h.month === 9 && h.day === 10) return g
    }
    return null
  }
  const key = (g) => `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`
  it('Ramazanın ortasında 5 günlük dövr → 5 gün; Ramazandan kənar → 0', () => {
    const g = findRamadanDay()
    expect(g).not.toBeNull()
    const s = key(g)
    const e = key({ ...g, day: g.day + 4 > 28 ? g.day : g.day + 4 })
    const n = ramadanDaysIn({ s, e }, '2027-12-31')
    expect(n).toBe(g.day + 4 > 28 ? 1 : 5)
    expect(ramadanDaysIn({ s: '2026-07-01', e: '2026-07-05' }, '2027-12-31')).toBe(0)
  })
  it('makeupList: artıq əlavə olunan çıxılır; markAdded sayı artırır', () => {
    const g = findRamadanDay()
    const s = key(g)
    const st = mem()
    const r = saveHaidEntry({ k: 'hayd', s, e: s }, st, 1, '2027-12-31')
    let rows = makeupList(readHaid(st), '2027-12-31')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ days: 1, added: 0, left: 1 })
    markAdded(r.item.id, 1, st, 2)
    rows = makeupList(readHaid(st), '2027-12-31')
    expect(rows[0]).toMatchObject({ added: 1, left: 0 })
  })
})

describe('haidLog — sinxronizasiya', () => {
  it('PROFILE_KEYS-dədir, birləşdiricisi var, ehtiyat nüsxəyə düşür', () => {
    expect(PROFILE_KEYS).toContain(HAID_KEY)
    expect(hasMerger(HAID_KEY)).toBe(true)
    expect(isBackupKey(HAID_KEY)).toBe(true)
  })
  it('qeydlər birləşir, eyni qeyd — təzəsi; neytral seçim — sonra dəyişdirilən', () => {
    const a = { id: 'h000001', k: 'hayd', s: '2026-09-01', e: '2026-09-05', u: 1 }
    const L = { v: 1, l: [{ ...a, e: '2026-09-06', u: 5 }], p: { n: true, t: 10 } }
    const R = { v: 1, l: [{ ...a, e: '2026-09-07', u: 9 }, { id: 'h000002', k: 'nifas', s: '2026-06-01', u: 3 }], p: { n: false, t: 20 } }
    const out = mergeHaid(L, R, { v: 1, l: [a] })
    expect(out.l).toHaveLength(2)
    expect(out.l.find((x) => x.id === 'h000001').e).toBe('2026-09-07')
    expect(out.p.n).toBe(false)
    expect(JSON.parse(runMerger(HAID_KEY, JSON.stringify(L), JSON.stringify(R), undefined)).l).toHaveLength(2)
  })
})
