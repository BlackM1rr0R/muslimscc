// Ağıllı hifz — aralıqlı təkrar, jurnal, qrafik sırası, ərəbcə müqayisə (src/utils/hifzSrs.js)
import { describe, it, expect } from 'vitest'
import {
  emptyState, sanitizeState, loadState, saveState, SRS_KEY, schedule, previewIntervals, gradeItem,
  newItem, dueItems, nextNewAyahs, todayStats, streak, memorisedSeries, perSurahCounts, seedItems,
  setGoal, addDays, daysBetween, dateKey, parseKey, normalizeArabic, splitAyahWords, wordsMatch,
  compareRecitation, MIN_EASE, MAX_INTERVAL,
} from '../../src/utils/hifzSrs.js'

const T = '2026-10-31'

describe('tarix köməkçiləri', () => {
  it('addDays / daysBetween ay və il sərhədini keçir', () => {
    expect(addDays(T, 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween(T, '2026-11-06')).toBe(6)
  })
  it('dateKey yerli günü qaytarır', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('parseKey yalnız etibarlı açarları qəbul edir', () => {
    expect(parseKey('2:255')).toEqual({ s: 2, a: 255 })
    for (const k of ['0:1', '115:1', '2:0', 'x', '2:300']) expect(parseKey(k)).toBeNull()
  })
})

describe('SM-2 planlama', () => {
  const it0 = newItem(1, 1, T)
  it('yeni ayə: again 0, hard 1, good 1, easy 4 gün', () => {
    expect(previewIntervals(it0)).toEqual({ again: 0, hard: 1, good: 1, easy: 4 })
  })
  it('good ardıcıllığı 1 → 6 → interval × asanlıq', () => {
    let x = schedule(it0, 'good'); expect(x.interval).toBe(1)
    x = schedule(x, 'good'); expect(x.interval).toBe(6)
    x = schedule(x, 'good'); expect(x.interval).toBe(15)
    expect(x.ease).toBe(2.5)
    expect(x.reps).toBe(3)
  })
  it('again sıfırlayır, asanlığı azaldır, səhvi sayır', () => {
    const x = schedule({ ...it0, reps: 3, interval: 15 }, 'again')
    expect(x).toMatchObject({ interval: 0, reps: 0, lapses: 1, ease: 2.3 })
  })
  it('asanlıq MIN_EASE-dən aşağı düşmür, interval MAX_INTERVAL-ı keçmir', () => {
    let x = it0
    for (let k = 0; k < 20; k++) x = schedule(x, 'again')
    expect(x.ease).toBe(MIN_EASE)
    const big = schedule({ ...it0, reps: 5, interval: 300, ease: 3 }, 'easy')
    expect(big.interval).toBe(MAX_INTERVAL)
  })
  it('qiymətlər sıralıdır: hard ≤ good ≤ easy', () => {
    const p = previewIntervals({ ...it0, reps: 2, interval: 6 })
    expect(p.hard).toBeLessThanOrEqual(p.good)
    expect(p.good).toBeLessThan(p.easy)
  })
  it('naməlum qiymət xəta verir', () => {
    expect(() => schedule(it0, 'meh')).toThrow()
  })
})

describe('gradeItem və gündəlik statistika', () => {
  it('yeni ayə "new", təkrar "reviews" sayılır; vaxt düzgün qoyulur', () => {
    let s = gradeItem(emptyState(), 112, 1, 'good', T)
    expect(s.items['112:1'].due).toBe('2026-11-01')
    expect(s.log[T]).toEqual({ reviews: 0, new: 1 })
    s = gradeItem(s, 112, 1, 'again', T)
    expect(s.items['112:1'].due).toBe(T)
    expect(s.log[T]).toEqual({ reviews: 1, new: 1 })
    const st = todayStats(s, T)
    expect(st).toMatchObject({ due: 1, learned: 1, reviewed: 1, goalLeft: 4, total: 1 })
  })
  it('dueItems: gecikmiş əvvəl, sonra Quran sırası; gələcəkdəkilər yox', () => {
    const s = { ...emptyState(), items: {
      '2:5': { ...newItem(2, 5, T), due: T },
      '1:3': { ...newItem(1, 3, T), due: T },
      '3:1': { ...newItem(3, 1, T), due: '2026-10-20' },
      '4:1': { ...newItem(4, 1, T), due: '2026-11-02' },
    } }
    expect(dueItems(s, T).map(x => `${x.s}:${x.a}`)).toEqual(['3:1', '1:3', '2:5'])
  })
  it('nextNewAyahs öyrənilmişləri buraxır', () => {
    const s = gradeItem(emptyState(), 1, 2, 'good', T)
    expect(nextNewAyahs(s, 1, 7, 1, 3)).toEqual([{ s: 1, a: 1 }, { s: 1, a: 3 }, { s: 1, a: 4 }])
    expect(nextNewAyahs(s, 1, 7, 6, 5)).toEqual([{ s: 1, a: 6 }, { s: 1, a: 7 }])
  })
  it('setGoal sərhədləri saxlayır', () => {
    expect(setGoal(emptyState(), 0).goal).toBe(1)
    expect(setGoal(emptyState(), 99).goal).toBe(50)
    expect(setGoal(emptyState(), 'x').goal).toBe(5)
  })
})

describe('streak', () => {
  const withLog = days => ({ ...emptyState(), log: Object.fromEntries(days.map(d => [d, { reviews: 1, new: 0 }])) })
  it('bu gün daxil ardıcıl günlər', () => {
    expect(streak(withLog([T, '2026-10-30', '2026-10-29', '2026-10-27']), T)).toBe(3)
  })
  it('bu gün hələ boşdursa, dünənə qədər olan zəncir qırılmır', () => {
    expect(streak(withLog(['2026-10-30', '2026-10-29']), T)).toBe(2)
  })
  it('iki gün boşluq — 0', () => {
    expect(streak(withLog(['2026-10-29']), T)).toBe(0)
  })
})

describe('qrafik və surə irəliləyişi', () => {
  it('memorisedSeries yığılan say verir', () => {
    let s = gradeItem(emptyState(), 1, 1, 'good', '2026-10-29')
    s = gradeItem(s, 1, 2, 'good', T)
    s = gradeItem(s, 2, 1, 'good', T)
    const ser = memorisedSeries(s, T, 4)
    expect(ser).toEqual([
      { date: '2026-10-28', count: 0 }, { date: '2026-10-29', count: 1 },
      { date: '2026-10-30', count: 1 }, { date: T, count: 3 },
    ])
    expect(perSurahCounts(s)).toEqual({ 1: 2, 2: 1 })
  })
  it('seedItems vaxtları günlərə yayır və mövcudlara toxunmur', () => {
    const s0 = gradeItem(emptyState(), 114, 1, 'easy', T)
    const refs = Array.from({ length: 6 }, (_, k) => ({ s: 114, a: k + 1 }))
    const s = seedItems(s0, refs, T, 2)
    expect(s.items['114:1']).toEqual(s0.items['114:1'])
    expect(s.items['114:2'].due).toBe(T)
    expect(s.items['114:4'].due).toBe('2026-11-01')
    expect(s.items['114:6'].due).toBe('2026-11-02')
  })
})

describe('yaddaş və köçürmə', () => {
  it('pozuq məlumat təhlükəsiz vəziyyətə çevrilir', () => {
    for (const raw of [null, 5, 'x', [], { items: 'x', log: [1] }]) expect(sanitizeState(raw)).toEqual(emptyState())
    const s = sanitizeState({
      goal: 7,
      items: { '1:1': { due: T, added: T, ease: 99, interval: -3 }, 'bad': { due: T, added: T }, '1:2': { due: 'x', added: T } },
      log: { [T]: { reviews: '2', new: 1 }, 'nope': { reviews: 1 } },
    })
    expect(Object.keys(s.items)).toEqual(['1:1'])
    expect(s.items['1:1']).toMatchObject({ s: 1, a: 1, ease: 3.2, interval: 0, reps: 0 })
    expect(s.log).toEqual({ [T]: { reviews: 2, new: 1 } })
    expect(s.goal).toBe(7)
  })
  it('load/save dövrü', () => {
    const mem = new Map()
    const storage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }
    const s = gradeItem(emptyState(), 2, 255, 'good', T)
    saveState(s, storage)
    expect(mem.has(SRS_KEY)).toBe(true)
    expect(loadState(storage)).toEqual(s)
    mem.set(SRS_KEY, '{oops')
    expect(loadState(storage)).toEqual(emptyState())
  })
})

describe('ərəbcə normallaşdırma və müqayisə', () => {
  it('hərəkələri silir, hərf formalarını birləşdirir', () => {
    expect(normalizeArabic('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ')).toBe('الحمد لله رب العلمين')
    expect(normalizeArabic('إِيَّاكَ')).toBe('اياك')
    expect(normalizeArabic('رَحْمَةٌ')).toBe('رحمه')
    expect(normalizeArabic('هُدًى')).toBe('هدي')
    expect(normalizeArabic('يُؤْمِنُونَ')).toBe('يومنون')
  })
  it('splitAyahWords işarə-sözləri əvvəlkinə birləşdirir', () => {
    expect(splitAyahWords('ذَٰلِكَ ٱلۡكِتَٰبُ لَا رَيۡبَۛ ۛ فِيهِ')).toEqual(['ذَٰلِكَ', 'ٱلۡكِتَٰبُ', 'لَا', 'رَيۡبَۛ ۛ', 'فِيهِ'])
  })
  it('wordsMatch kiçik yazılış fərqlərini qəbul edir', () => {
    expect(wordsMatch('الصلوه', 'الصلاه')).toBe(true)
    expect(wordsMatch('العلمين', 'العالمين')).toBe(true)
    expect(wordsMatch('رب', 'رب')).toBe(true)
    expect(wordsMatch('رب', 'من')).toBe(false)
    expect(wordsMatch('الكتاب', 'الناس')).toBe(false)
  })
  it('compareRecitation tapılan və buraxılan sözləri işarələyir', () => {
    const ayah = 'ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ'
    const full = compareRecitation(ayah, 'الحمد لله رب العالمين')
    expect(full.score).toBe(1)
    const part = compareRecitation(ayah, 'الحمد رب العالمين شيء')
    expect(part.words.map(w => w.matched)).toEqual([true, false, true, true])
    expect(part).toMatchObject({ matched: 3, total: 4, extra: 1 })
    expect(compareRecitation(ayah, '').score).toBe(0)
  })
})
