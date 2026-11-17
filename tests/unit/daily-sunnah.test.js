// Günün sünnəsi — saf məntiq (src/utils/dailySunnah.js) və məlumatın hədis dəlilləri
import { describe, it, expect } from 'vitest'
import {
  STORAGE_KEY, dayKey, fromKey, dayNumber, itemForDate, addDays, parseLog, loadLog, saveLog,
  setDone, streakOf, doneInMonth, monthCells,
} from '../../src/utils/dailySunnah.js'
import { DAILY_SUNNAH } from '../../src/data/dailySunnah.js'
import { HADITHS } from '../../src/data/hadiths.js'
import { SUNAN_GRADES } from '../../src/data/hadithGrades.js'
import { gradeOf } from '../../src/utils/hadithGrade.js'
import { uniqueHadithsFor } from '../../src/utils/uniqueHadiths.js'
import { HADITH_IDS } from '../../src/seo/hadithIds.js'

describe('tarix', () => {
  it('dayKey / fromKey yerli gün', () => {
    expect(dayKey(new Date(2026, 10, 7, 23, 59))).toBe('2026-11-07')
    expect(dayKey(fromKey('2026-01-31'))).toBe('2026-01-31')
  })
  it('addDays ay / il sərhədini keçir', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
  })
  it('dayNumber saatdan asılı deyil', () => {
    expect(dayNumber(new Date(2026, 10, 17, 0, 1))).toBe(dayNumber(new Date(2026, 10, 17, 23, 59)))
    expect(dayNumber(new Date(2026, 10, 18, 0, 1)) - dayNumber(new Date(2026, 10, 17, 23, 59))).toBe(1)
  })
})

describe('günün əməli', () => {
  it('determinist və dövri', () => {
    const d = new Date(2026, 10, 17, 9)
    expect(itemForDate(DAILY_SUNNAH, d)).toBe(itemForDate(DAILY_SUNNAH, new Date(2026, 10, 17, 22)))
    const n = DAILY_SUNNAH.length
    const later = new Date(2026, 10, 17 + n, 9)
    expect(itemForDate(DAILY_SUNNAH, later)).toBe(itemForDate(DAILY_SUNNAH, d))
    expect(itemForDate(DAILY_SUNNAH, new Date(2026, 10, 18))).not.toBe(itemForDate(DAILY_SUNNAH, d))
  })
  it('ardıcıl n gündə hər əməl bir dəfə', () => {
    const n = DAILY_SUNNAH.length
    const seen = new Set()
    for (let i = 0; i < n; i++) seen.add(itemForDate(DAILY_SUNNAH, new Date(2026, 0, 1 + i)).id)
    expect(seen.size).toBe(n)
  })
  it('boş siyahı → null', () => {
    expect(itemForDate([], new Date())).toBeNull()
  })
})

describe('qeydlər', () => {
  it('parseLog etibarsızı atır', () => {
    expect(parseLog('{oops')).toEqual({})
    expect(parseLog('[1,2]')).toEqual({})
    expect(parseLog(null)).toEqual({})
    expect(parseLog(JSON.stringify({ '2026-11-17': 'smile', 'dünən': 'x', '2026-11-16': 5, '2026-11-15': '' })))
      .toEqual({ '2026-11-17': 'smile' })
  })
  it('localStorage yükləmə / yazma', () => {
    const m = new Map()
    const st = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
    expect(STORAGE_KEY).toBe('muslim_cc_daily_sunnah')
    expect(saveLog({ '2026-11-17': 'smile' }, st)).toBe(true)
    expect(loadLog(st)).toEqual({ '2026-11-17': 'smile' })
    expect(loadLog({ getItem: () => { throw new Error('x') } })).toEqual({})
    expect(saveLog({}, { setItem: () => { throw new Error('quota') } })).toBe(false)
  })
  it('setDone yeni obyekt qaytarır', () => {
    const a = {}
    const b = setDone(a, '2026-11-17', 'smile')
    expect(a).toEqual({})
    expect(b).toEqual({ '2026-11-17': 'smile' })
    expect(setDone(b, '2026-11-17', 'smile', false)).toEqual({})
  })
  it('streak: bu gün və ya dünəndən geriyə', () => {
    const log = { '2026-11-15': 'a', '2026-11-16': 'b', '2026-11-13': 'c' }
    expect(streakOf(log, '2026-11-17')).toBe(2)            // bu gün hələ yox — dünəndən
    expect(streakOf({ ...log, '2026-11-17': 'd' }, '2026-11-17')).toBe(3)
    expect(streakOf(log, '2026-11-19')).toBe(0)
    expect(streakOf({ '2026-12-31': 'a', '2027-01-01': 'b' }, '2027-01-01')).toBe(2)
  })
  it('ayın sayı', () => {
    expect(doneInMonth({ '2026-11-01': 'a', '2026-11-30': 'b', '2026-10-31': 'c' }, 2026, 10)).toBe(2)
  })
})

describe('ay cədvəli', () => {
  it('noyabr 2026: bazar günü başlayır → 6 boş xana (həftə B.e.-dən)', () => {
    const c = monthCells(2026, 10)
    expect(c.slice(0, 6)).toEqual(Array(6).fill(null))
    expect(c[6]).toEqual({ key: '2026-11-01', day: 1 })
    expect(c.filter(Boolean)).toHaveLength(30)
    expect(c.at(-1).key).toBe('2026-11-30')
  })
  it('fevral 2024 — 29 gün', () => {
    expect(monthCells(2024, 1).filter(Boolean)).toHaveLength(29)
  })
})

describe('məlumat — hər əməl saytdakı səhih hədisə söykənir', () => {
  const PAGE = new Set(HADITH_IDS)
  it('20–31 əməl, id-lər təkrarsız', () => {
    expect(DAILY_SUNNAH.length).toBeGreaterThanOrEqual(20)
    expect(DAILY_SUNNAH.length).toBeLessThanOrEqual(31)
    expect(new Set(DAILY_SUNNAH.map(i => i.id)).size).toBe(DAILY_SUNNAH.length)
    expect(new Set(DAILY_SUNNAH.map(i => i.hadith)).size).toBe(DAILY_SUNNAH.length)
  })
  it('5 dildə başlıq + göstəriş', () => {
    for (const it of DAILY_SUNNAH) {
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
        expect(it[l], `${it.id} ${l}`).toHaveLength(2)
        expect(it[l].every(s => typeof s === 'string' && s.trim().length > 0)).toBe(true)
      }
    }
  })
  it('hədis məlumatda var, hər dildə göstərilir, səhifəsi var, dərəcəsi səhihdir', () => {
    const lists = Object.fromEntries(['az', 'en', 'ru', 'ar', 'tr'].map(l => [l, new Set(uniqueHadithsFor(HADITHS, l).map(h => h.id))]))
    for (const it of DAILY_SUNNAH) {
      const h = HADITHS.en.find(x => x.id === it.hadith)
      expect(h, `${it.id}: hədis ${it.hadith}`).toBeTruthy()
      for (const l of Object.keys(lists)) expect(lists[l].has(it.hadith), `${it.id} ${l}`).toBe(true)
      expect(PAGE.has(String(it.hadith)), `${it.id}: /hadith/${it.hadith}`).toBe(true)
      const g = gradeOf(h, SUNAN_GRADES)
      expect(g.g, `${it.id}: ${h.source}`).toBe('s')
      expect(['bukhari', 'muslim', 'albani']).toContain(g.gb)
    }
  })
})
