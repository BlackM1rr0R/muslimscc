// E mərhələsinin açarları üçün sinxronizasiya birləşdiriciləri (utils/syncMergers):
// ramadan_album_v1, dua_garden_v1, mosque_visits_v1, muslim_cc_iftar_log_v1, dua_journal, charity_log;
// profilin ad sahəsindəki açarlar da eyni birləşdiricini işlədir.
import { describe, it, expect } from 'vitest'
import { runMerger, hasMerger, CONFLICT } from '../../src/utils/syncMergers.js'
import { mergeData } from '../../src/utils/syncMerge.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const J = JSON.stringify
const P = (s) => JSON.parse(s)

describe('E açarları: ehtiyat nüsxə, profil, birləşdirici', () => {
  const KEYS = ['ramadan_album_v1', 'dua_garden_v1', 'mosque_visits_v1', 'muslim_cc_iftar_log_v1', 'dua_journal']
  it('hamısı ehtiyat nüsxədə, profilə aid və birləşdiricisi var', () => {
    for (const k of KEYS) {
      expect(isBackupKey(k)).toBe(true)
      expect(PROFILE_KEYS).toContain(k)
      expect(hasMerger(k)).toBe(true)
    }
    expect(hasMerger('charity_log')).toBe(true)
    expect(hasMerger('mcc_profile:pabcdef:mosque_visits_v1')).toBe(true)
  })
})

describe('ramadan_album_v1', () => {
  it('il üzrə birlik; saylar — max; oxu başlanğıcı daha erkən ölçən tərəfdən', () => {
    const a = { v: 1, y: { 1446: { s: '2025-03-01', e: '2025-03-29', f: 20, fin: 1 }, 1447: { s: '2026-02-18', e: '2026-03-19', f: 10, dh: 50, q0: 100, q1: 150, b: '2026-02-20' } } }
    const b = { v: 1, y: { 1447: { s: '2026-02-18', e: '2026-03-19', f: 12, dh: 40, q0: 90, q1: 120, b: '2026-02-18' } } }
    const m = P(runMerger('ramadan_album_v1', J(a), J(b)))
    expect(m.y[1446].f).toBe(20)
    expect(m.y[1447]).toMatchObject({ f: 12, dh: 50, q0: 90, b: '2026-02-18', q1: 150 })
    // kommutativ
    expect(P(runMerger('ramadan_album_v1', J(b), J(a))).y[1447]).toMatchObject({ f: 12, dh: 50, q0: 90, q1: 150 })
  })
})

describe('dua_garden_v1', () => {
  it('çiçəklər birləşir, heç biri itmir; eyni dua — ən erkən gün', () => {
    const m = P(runMerger('dua_garden_v1', J({ v: 1, b: [['a', '2025-01-02', 0], ['b', '2025-03-01', 1]] }), J({ v: 1, b: [['a', '2025-01-01', 0], ['c', '2026-01-01', 2]] }), J({ v: 1, b: [['b', '2025-03-01', 1]] })))
    expect(m.b).toEqual([['a', '2025-01-01', 0], ['b', '2025-03-01', 1], ['c', '2026-01-01', 2]])
  })
})

describe('mosque_visits_v1', () => {
  const v = (i, o = {}) => ({ i, n: i, la: 1, lo: 1, d: '2026-01-01', ld: '2026-01-01', c: 1, ...o })
  it('iki cihazda əlavə olunanlar birləşir; bir tərəfdə silinən — silinir', () => {
    const base = { v: 1, l: [v('n1'), v('n2')] }
    const L = { v: 1, l: [v('n1'), v('n3')] }               // n2 silindi, n3 əlavə
    const R = { v: 1, l: [v('n1'), v('n2'), v('n4')] }      // n4 əlavə
    const m = P(runMerger('mosque_visits_v1', J(L), J(R), J(base)))
    expect(m.l.map((x) => x.i).sort()).toEqual(['n1', 'n3', 'n4'])
  })
  it('eyni ziyarət hər iki tərəfdə dəyişib — birləşir (ziddiyyət yox)', () => {
    const base = { v: 1, l: [v('n1')] }
    const L = { v: 1, l: [v('n1', { no: 'qeyd', ld: '2026-02-01', c: 2 })] }
    const R = { v: 1, l: [v('n1', { ld: '2026-03-01', c: 2 })] }
    const m = P(runMerger('mosque_visits_v1', J(L), J(R), J(base)))
    expect(m.l[0]).toMatchObject({ ld: '2026-03-01', c: 2, no: 'qeyd' })
  })
})

describe('muslim_cc_iftar_log_v1', () => {
  it('gün üzrə sayğac: iki cihazın artımı toplanır', () => {
    const m = P(runMerger('muslim_cc_iftar_log_v1', J({ '2026-03-01': 3 }), J({ '2026-03-01': 2, '2026-03-02': 1 }), J({ '2026-03-01': 1 })))
    expect(m).toEqual({ '2026-03-01': 4, '2026-03-02': 1 })
  })
})

describe('dua_journal', () => {
  const d = (id, o = {}) => ({ id, text: id, category: 'personal', priority: 'medium', date: '2026-01-01', answered: false, answeredDate: null, ...o })
  it('iki cihazda yazılan dualar birləşir; silinən silinir', () => {
    const base = { duas: [d('a'), d('b')] }
    const L = { duas: [d('a'), d('c')] }
    const R = { duas: [d('a'), d('b'), d('e')] }
    const m = P(runMerger('dua_journal', J(L), J(R), J(base)))
    expect(m.duas.map((x) => x.id)).toEqual(['a', 'c', 'e'])
  })
  it('eyni dua: bir tərəfdə redaktə, digərində "qəbul oldu" — ikisi də qalır', () => {
    const base = { duas: [d('a')] }
    const L = { duas: [d('a', { text: 'yeni mətn' })] }
    const R = { duas: [d('a', { answered: true, answeredDate: '2026-02-01' })] }
    const m = P(runMerger('dua_journal', J(L), J(R), J(base)))
    expect(m.duas[0]).toMatchObject({ text: 'yeni mətn', answered: true, answeredDate: '2026-02-01' })
  })
  it('profil ad sahəsindəki açar da birləşir (ziddiyyət yox)', () => {
    const k = 'mcc_profile:pabcdef:dua_journal'
    const reg = J({ v: 1, list: [{ id: 'pabcdef', name: 'Ana' }] })
    const r = mergeData({ mcc_profiles: reg, [k]: J({ duas: [d('a'), d('x')] }) }, { mcc_profiles: reg, [k]: J({ duas: [d('a'), d('y')] }) }, { mcc_profiles: reg, [k]: J({ duas: [d('a')] }) })
    expect(r.conflicts).toEqual([])
    expect(P(r.data[k]).duas.map((x) => x.id)).toEqual(['a', 'x', 'y'])
  })
  it('oxunmayan JSON — ziddiyyət', () => {
    expect(runMerger('dua_journal', '{', J({ duas: [] }))).toBe(CONFLICT)
  })
})

describe('charity_log', () => {
  it('qeyd üzrə 3 tərəfli', () => {
    const e = (id, o = {}) => ({ id, date: '2026-01-01', type: 'money', amount: 1, ...o })
    const m = P(runMerger('charity_log', J([e(1), e(2, { amount: 5 })]), J([e(1), e(3)]), J([e(1)])))
    expect(m.map((x) => x.id)).toEqual([1, 2, 3])
  })
})
