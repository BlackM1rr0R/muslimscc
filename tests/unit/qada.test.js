// Qəza izləyicisinin saf köməkçiləri (src/utils/qada.js)
import { describe, it, expect } from 'vitest'
import {
  emptyQada, normQada, adjustOwed, setOwed, makeUp, undoMakeUp, applyEstimate, setGoal,
  qadaTotals, slotPct, lastDays, todayCount, daysToFinish, estimateDays, toBackup, fromBackup,
  fromLegacy, isEmpty, loadQada, saveQada, loadLegacy, QADA_V1_KEY, LEGACY_QADA_KEY, PRAYERS, MAX_GOAL,
} from '../../src/utils/qada.js'

const memStorage = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }
}
const T = '2026-10-31'

describe('normQada', () => {
  it('boş/zədəli girişdən etibarlı vəziyyət', () => {
    for (const raw of [null, undefined, 5, 'x', [], {}]) {
      const s = normQada(raw)
      expect(s).toEqual(emptyQada())
    }
  })
  it('mənfi, kəsr, mətn rəqəmləri təmizləyir; səhv log açarlarını atır', () => {
    const s = normQada({
      prayers: { fajr: { owed: '12.7', done: -3 }, isha: { owed: 1e12 } },
      fasts: { owed: 4 }, goal: 0,
      log: { '2026-10-30': { p: 2, f: 0 }, 'bad': { p: 1 }, '2026-10-29': { p: 0, f: 0 } },
    })
    expect(s.prayers.fajr).toEqual({ owed: 12, done: 0 })
    expect(s.prayers.isha.owed).toBe(200000)
    expect(s.fasts).toEqual({ owed: 4, done: 0 })
    expect(s.goal).toBe(5)
    expect(s.log).toEqual({ '2026-10-30': { p: 2, f: 0 } })
  })
})

describe('sayğac əməliyyatları', () => {
  it('adjustOwed 0-dan aşağı düşmür, setOwed yazır', () => {
    let s = emptyQada()
    s = adjustOwed(s, 'fajr', -1)
    expect(s.prayers.fajr.owed).toBe(0)
    s = adjustOwed(s, 'fajr', 3)
    s = setOwed(s, 'fast', 7)
    expect(s.prayers.fajr.owed).toBe(3)
    expect(s.fasts.owed).toBe(7)
    expect(adjustOwed(s, 'witr', 1)).toBe(s)   // yalnız 5 fərz
  })
  it('makeUp: borc −1, done +1, bugünkü log +1; borc yoxdursa dəyişmir', () => {
    let s = setOwed(emptyQada(), 'asr', 2)
    s = makeUp(s, 'asr', T)
    s = makeUp(s, 'asr', T)
    expect(s.prayers.asr).toEqual({ owed: 0, done: 2 })
    expect(s.log[T]).toEqual({ p: 2, f: 0 })
    expect(makeUp(s, 'asr', T)).toBe(s)
    s = makeUp(setOwed(s, 'fast', 1), 'fast', T)
    expect(s.log[T]).toEqual({ p: 2, f: 1 })
    expect(todayCount(s, T)).toBe(2)
  })
  it('undoMakeUp geri qaytarır və boş günü silir', () => {
    let s = makeUp(setOwed(emptyQada(), 'isha', 1), 'isha', T)
    s = undoMakeUp(s, 'isha', T)
    expect(s.prayers.isha).toEqual({ owed: 1, done: 0 })
    expect(s.log[T]).toBeUndefined()
    expect(undoMakeUp(s, 'isha', T)).toBe(s)
  })
  it('köhnə log qeydləri (400 gündən əvvəl) atılır', () => {
    let s = normQada({ log: { '2024-01-01': { p: 3 } } })
    s = makeUp(setOwed(s, 'fajr', 1), 'fajr', T)
    expect(s.log['2024-01-01']).toBeUndefined()
  })
  it('applyEstimate: əlavə et və yaz rejimləri, seçilmiş namazlar', () => {
    let s = setOwed(emptyQada(), 'fajr', 10)
    s = applyEstimate(s, { prayers: 100, fasts: 30 })
    expect(s.prayers.fajr.owed).toBe(110)
    expect(s.prayers.isha.owed).toBe(100)
    expect(s.fasts.owed).toBe(30)
    s = applyEstimate(s, { prayers: 5, fasts: 0, which: ['dhuhr'], mode: 'set' })
    expect(s.prayers.dhuhr.owed).toBe(5)
    expect(s.prayers.fajr.owed).toBe(110)
    expect(s.fasts.owed).toBe(0)
  })
  it('setGoal hüdudları', () => {
    expect(setGoal(emptyQada(), 12).goal).toBe(12)
    expect(setGoal(emptyQada(), 999).goal).toBe(MAX_GOAL)
    expect(setGoal(emptyQada(), 'x').goal).toBe(5)
  })
})

describe('göstəricilər', () => {
  it('qadaTotals və slotPct', () => {
    let s = applyEstimate(emptyQada(), { prayers: 2, fasts: 4 })
    s = makeUp(s, 'fajr', T)
    s = makeUp(s, 'fast', T)
    const t = qadaTotals(s)
    expect(t.owed).toBe(9)
    expect(t.done).toBe(1)
    expect(t.pct).toBe(10)
    expect(t.fastsPct).toBe(25)
    expect(slotPct(s.prayers.fajr)).toBe(50)
    expect(slotPct({ owed: 0, done: 0 })).toBe(0)
  })
  it('lastDays: 30 gün, köhnədən yeniyə, ay sərhədini keçir', () => {
    const s = normQada({ log: { [T]: { p: 4 }, '2026-10-02': { f: 1 } } })
    const d = lastDays(s, T, 30)
    expect(d).toHaveLength(30)
    expect(d[29]).toEqual({ key: T, p: 4, f: 0 })
    expect(d[0]).toEqual({ key: '2026-10-02', p: 0, f: 1 })
    expect(lastDays(s, '2026-03-01', 3).map(x => x.key)).toEqual(['2026-02-27', '2026-02-28', '2026-03-01'])
  })
  it('daysToFinish', () => {
    expect(daysToFinish(0, 5)).toBe(0)
    expect(daysToFinish(11, 5)).toBe(3)
    expect(daysToFinish(11, 0)).toBe(11)
  })
  it('estimateDays: hər iki gün daxil, çıxma, səhv sıra', () => {
    expect(estimateDays('2020-01-01', '2020-01-01')).toBe(1)
    expect(estimateDays('2020-01-01', '2020-12-31')).toBe(366)
    expect(estimateDays('2020-01-01', '2020-12-31', 66)).toBe(300)
    expect(estimateDays('2020-01-01', '2020-01-10', 99)).toBe(0)
    expect(estimateDays('2021-01-01', '2020-01-01')).toBe(0)
    expect(estimateDays('x', '2020-01-01')).toBe(0)
  })
})

describe('ehtiyat nüsxə və köçürmə', () => {
  it('toBackup → fromBackup gediş-dönüş', () => {
    const s = makeUp(applyEstimate(emptyQada(), { prayers: 3, fasts: 2 }), 'maghrib', T)
    expect(fromBackup(toBackup(s))).toEqual(normQada(s))
  })
  it('çılpaq vəziyyət obyektini də qəbul edir, tanınmayanı rədd edir', () => {
    expect(fromBackup(JSON.stringify({ prayers: { fajr: { owed: 2 } } })).prayers.fajr.owed).toBe(2)
    expect(fromBackup('not json')).toBeNull()
    expect(fromBackup('{"foo":1}')).toBeNull()
    expect(fromBackup('null')).toBeNull()
  })
  it('fromLegacy: /prayer-tracker sayğacı (debt/done)', () => {
    const s = fromLegacy({ prayers: { fajr: { debt: 4, done: 1 } }, fasts: { debt: 2, done: 0 } })
    expect(s.prayers.fajr).toEqual({ owed: 4, done: 1 })
    expect(s.fasts.owed).toBe(2)
    expect(fromLegacy({ prayers: {}, fasts: {} })).toBeNull()
    expect(fromLegacy(null)).toBeNull()
  })
  it('isEmpty', () => {
    expect(isEmpty(emptyQada())).toBe(true)
    expect(isEmpty(setOwed(emptyQada(), 'fast', 1))).toBe(false)
  })
})

describe('localStorage', () => {
  it('yaz/oxu; zədəli JSON — boş vəziyyət; yaddaş xətası — false', () => {
    const st = memStorage()
    const s = applyEstimate(emptyQada(), { prayers: 1, fasts: 0 })
    expect(saveQada(s, st)).toBe(true)
    expect(loadQada(st)).toEqual(normQada(s))
    expect(loadQada(memStorage({ [QADA_V1_KEY]: '{bad' }))).toEqual(emptyQada())
    const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('quota') } }
    expect(loadQada(broken)).toEqual(emptyQada())
    expect(saveQada(s, broken)).toBe(false)
  })
  it('köhnə açarı oxuyur', () => {
    const st = memStorage({ [LEGACY_QADA_KEY]: JSON.stringify({ prayers: { isha: { debt: 9 } } }) })
    expect(loadLegacy(st).prayers.isha.owed).toBe(9)
    expect(loadLegacy(memStorage())).toBeNull()
  })
  it('5 fərz namaz', () => expect(PRAYERS).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']))
})
