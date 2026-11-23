// P1: borc dəftəri (utils/debtLedger) — təmizləmə, qaytarmalar, bağlanma, qalıqlar, xatırlatma və sinxron birləşmə
import { describe, it, expect } from 'vitest'
import {
  sanitizeDebt, sanitizeLedger, readLedger, saveDebt, patchDebt, removeDebt, addRepayment, removeRepayment,
  remaining, paidOf, isSettled, dueState, daysUntilDue, dueReminders, openTotals, knownNames, mergeLedger, cleanMoney,
  DEBT_KEY,
} from '../../src/utils/debtLedger.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { runMerger, hasMerger } from '../../src/utils/syncMergers.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}
const base = { k: 'owe', p: 'Ali', a: 100, cu: 'AZN', d: '2026-11-01' }

describe('debtLedger — təmizləmə', () => {
  it('düzgün qeydi saxlayır, yanlışları atır', () => {
    expect(sanitizeDebt({ id: 'dabcde1', ...base, u: 5 })).toMatchObject({ id: 'dabcde1', k: 'owe', p: 'Ali', a: 100, cu: 'AZN', r: [] })
    expect(sanitizeDebt({ id: 'dabcde1', ...base, k: 'gift' })).toBeNull()
    expect(sanitizeDebt({ id: 'dabcde1', ...base, a: 0 })).toBeNull()
    expect(sanitizeDebt({ id: 'dabcde1', ...base, a: -5 })).toBeNull()
    expect(sanitizeDebt({ id: 'dabcde1', ...base, cu: 'manat' })).toBeNull()
    expect(sanitizeDebt({ id: 'dabcde1', ...base, p: '   ' })).toBeNull()
    expect(sanitizeDebt({ id: 'dabcde1', ...base, d: '2026-02-30' })).toBeNull()
    expect(sanitizeDebt({ id: 'x', ...base })).toBeNull()
  })
  it('məbləğ 2 onluğa yuvarlanır; valyuta böyük hərfə; şahidlər ən çox 4, təkrarsız', () => {
    const e = sanitizeDebt({ id: 'dabcde1', ...base, a: 10.456, cu: 'usd', w: ['A', 'B', 'A', 'C', 'D', 'E'] })
    expect(e.a).toBe(10.46)
    expect(e.cu).toBe('USD')
    expect(e.w).toEqual(['A', 'B', 'C', 'D'])
    expect(cleanMoney('abc')).toBe(0)
  })
  it('xatırlatma yalnız qaytarılma günü olanda qalır', () => {
    expect(sanitizeDebt({ id: 'dabcde1', ...base, rm: true }).rm).toBeUndefined()
    expect(sanitizeDebt({ id: 'dabcde1', ...base, rm: true, du: '2026-12-01' }).rm).toBe(true)
  })
  it('təkrar id atılır, günə görə sıralanır', () => {
    const v = sanitizeLedger({ l: [{ id: 'dbbbbb1', ...base, d: '2026-11-05' }, { id: 'daaaaa1', ...base }, { id: 'daaaaa1', ...base, p: 'X' }] })
    expect(v.l.map((x) => x.id)).toEqual(['daaaaa1', 'dbbbbb1'])
  })
})

describe('debtLedger — əməliyyatlar', () => {
  it('əlavə, qismən qaytarma, qalıq, artıq qaytarma rədd olunur, silmə', () => {
    const s = mem()
    const r = saveDebt(base, s, 1000)
    expect(r.ok).toBe(true)
    const id = r.item.id
    expect(readLedger(s).l).toHaveLength(1)
    let p = addRepayment(id, { d: '2026-11-10', a: 30 }, s, 2000)
    expect(p.ok).toBe(true)
    expect(remaining(p.item)).toBe(70)
    expect(paidOf(p.item)).toBe(30)
    expect(addRepayment(id, { d: '2026-11-11', a: 80 }, s, 3000)).toMatchObject({ ok: false, code: 'tooMuch' })
    p = addRepayment(id, { d: '2026-11-12', a: 70 }, s, 4000)
    expect(isSettled(p.item)).toBe(true)
    const rid = p.item.r[0].id
    p = removeRepayment(id, rid, s, 5000)
    expect(remaining(p.item)).toBe(30)
    expect(isSettled(p.item)).toBe(false)
    expect(removeDebt(id, s).l).toHaveLength(0)
    expect(s.getItem(DEBT_KEY)).toBeNull()
  })
  it('redaktə qaytarmaları və "bağlandı"nı saxlayır; patch undefined sahəni silir', () => {
    const s = mem()
    const { item } = saveDebt(base, s, 1000)
    addRepayment(item.id, { d: '2026-11-02', a: 10 }, s, 1100)
    patchDebt(item.id, { s: true, sd: '2026-11-03' }, s, 1200)
    const ed = saveDebt({ id: item.id, ...base, p: 'Ali Veli' }, s, 1300).item
    expect(ed.p).toBe('Ali Veli')
    expect(ed.r).toHaveLength(1)
    expect(ed.s).toBe(true)
    const re = patchDebt(item.id, { s: undefined, sd: undefined }, s, 1400).item
    expect(re.s).toBeUndefined()
    expect(re.sd).toBeUndefined()
  })
  it('qaytarılma vəziyyəti və xatırlatma siyahısı', () => {
    const e = sanitizeDebt({ id: 'dabcde1', ...base, du: '2026-11-20', rm: true })
    expect(dueState(e, '2026-11-10')).toBe('later')
    expect(dueState(e, '2026-11-18')).toBe('soon')
    expect(dueState(e, '2026-11-20')).toBe('today')
    expect(dueState(e, '2026-11-23')).toBe('overdue')
    expect(daysUntilDue(e, '2026-11-23')).toBe(-3)
    expect(dueReminders({ l: [e] }, '2026-11-19')).toHaveLength(0)
    expect(dueReminders({ l: [e] }, '2026-11-21')).toHaveLength(1)
    expect(dueReminders({ l: [{ ...e, s: true }] }, '2026-11-21')).toHaveLength(0)
  })
  it('açıq qalıqlar növ və valyuta üzrə; bağlananlar sayılmır', () => {
    const l = [
      sanitizeDebt({ id: 'da00001', ...base, a: 100 }),
      sanitizeDebt({ id: 'da00002', ...base, a: 50, cu: 'USD' }),
      sanitizeDebt({ id: 'da00003', ...base, k: 'owed', a: 20, r: [{ id: 'r00001a', d: '2026-11-02', a: 5 }] }),
      sanitizeDebt({ id: 'da00004', ...base, a: 999, s: true }),
    ]
    expect(openTotals({ l })).toEqual({ owe: { AZN: 100, USD: 50 }, owed: { AZN: 15 } })
  })
  it('tanış adlar: şəxslər və şahidlər, təkrarsız', () => {
    const l = [sanitizeDebt({ id: 'da00001', ...base, w: ['Omar'] }), sanitizeDebt({ id: 'da00002', ...base, p: 'Omar' })]
    expect(knownNames({ l })).toEqual(['Omar', 'Ali'])
  })
})

describe('debtLedger — sinxronizasiya', () => {
  const e = (over) => sanitizeDebt({ id: 'da00001', ...base, ...over })
  it('PROFILE_KEYS-dədir, birləşdiricisi var, ehtiyat nüsxəyə düşür', () => {
    expect(PROFILE_KEYS).toContain(DEBT_KEY)
    expect(hasMerger(DEBT_KEY)).toBe(true)
    expect(hasMerger(`mcc_profile:pabc123:${DEBT_KEY}`)).toBe(true)
    expect(isBackupKey(DEBT_KEY)).toBe(true)
  })
  it('iki cihazda müxtəlif qaytarmalar — ikisi də qalır; sahələr təzəsindən', () => {
    const B = { v: 1, l: [e({ u: 1 })] }
    const L = { v: 1, l: [e({ u: 5, no: 'local', r: [{ id: 'r00001a', d: '2026-11-02', a: 10 }] })] }
    const R = { v: 1, l: [e({ u: 9, no: 'remote', r: [{ id: 'r00002b', d: '2026-11-03', a: 20 }] })] }
    const out = mergeLedger(L, R, B)
    expect(out.l).toHaveLength(1)
    expect(out.l[0].no).toBe('remote')
    expect(out.l[0].r.map((x) => x.id).sort()).toEqual(['r00001a', 'r00002b'])
  })
  it('bir cihazda silinən qeyd (digərində dəyişməyib) silinir; yeni qeydlər birləşir', () => {
    const one = e({ u: 1 })
    const two = sanitizeDebt({ id: 'da00002', ...base, u: 2 })
    expect(mergeLedger({ v: 1, l: [] }, { v: 1, l: [one] }, { v: 1, l: [one] })).toBeUndefined()
    const out = mergeLedger({ v: 1, l: [one] }, { v: 1, l: [two] }, undefined)
    expect(out.l.map((x) => x.id)).toEqual(['da00001', 'da00002'])
  })
  it('runMerger JSON sətirləri ilə işləyir', () => {
    const L = JSON.stringify({ v: 1, l: [e({ u: 1 })] })
    const R = JSON.stringify({ v: 1, l: [sanitizeDebt({ id: 'da00002', ...base, u: 2 })] })
    expect(JSON.parse(runMerger(DEBT_KEY, L, R, undefined)).l).toHaveLength(2)
  })
})
