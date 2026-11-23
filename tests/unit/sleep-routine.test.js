// Yatma / oyanış ardıcıllıqları (utils/sleepRoutine): gün açarı, təmizləmə, addım qeydi, xatırlatma pəncərəsi,
// təsbih mərhələləri, profil açarı və sinxron birləşdiricisi; mənbə məlumatının yerində olması (Hisn fəsilləri
// və hədis 1063 — səhifələr bu indekslərə istinad edir); SSR: 5 dildə render, ilk render yaddaşdan asılı deyil.
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  routineDay, sanitizeRoutine, readRoutine, setRoutineStep, stepsToday, clearRoutineToday, writeRoutinePrefs,
  routineReminderDue, tasbihPhase, mergeRoutine, ROUTINE_KEY, BED_STEPS, WAKE_STEPS, TASBIH_TOTAL,
} from '../../src/utils/sleepRoutine.js'
import { runMerger, hasMerger } from '../../src/utils/syncMergers.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { PAGES, pathFor } from '../../src/seo/routes.js'
import { HADITHS } from '../../src/data/hadiths.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size }, _m: m }
}
const at = (y, mo, d, hh, mm = 0) => new Date(y, mo - 1, d, hh, mm)

describe('sleepRoutine — saf köməkçilər', () => {
  it('routineDay: yatma günü gecə 04:00-a qədər əvvəlki gündür, oyanış — təqvim günü', () => {
    expect(routineDay('b', at(2026, 11, 23, 22))).toBe('2026-11-23')
    expect(routineDay('b', at(2026, 11, 24, 1, 30))).toBe('2026-11-23')
    expect(routineDay('b', at(2026, 11, 24, 4, 0))).toBe('2026-11-24')
    expect(routineDay('w', at(2026, 11, 24, 1, 30))).toBe('2026-11-24')
  })
  it('sanitizeRoutine: naməlum addım, səhv tarix və saat atılır', () => {
    const v = sanitizeRoutine({ b: { d: '2026-11-23', s: ['mulk', 'x', 'wudu', 'wudu'] }, w: { d: 'dünən', s: ['wake'] }, rb: '25:00', rw: '06:30', bl: 'yes' })
    expect(v.b).toEqual({ d: '2026-11-23', s: ['wudu', 'mulk'] })
    expect(v.w).toEqual({ d: '', s: [] })
    expect(v.rb).toBe('')
    expect(v.rw).toBe('06:30')
    expect(v.bl).toBe(false)
    expect(sanitizeRoutine('pozuq')).toEqual(sanitizeRoutine(null))
  })
  it('setRoutineStep / stepsToday: yalnız bu gün; başqa günün qeydi boş sayılır və yenisi onu əvəz edir', () => {
    const s = mem()
    const night = at(2026, 11, 23, 23)
    setRoutineStep('b', 'wudu', true, s, night)
    setRoutineStep('b', 'quls', true, s, at(2026, 11, 24, 0, 40))
    setRoutineStep('b', 'nope', true, s, night)
    let st = readRoutine(s)
    expect(stepsToday(st, 'b', night)).toEqual(['wudu', 'quls'])
    expect(stepsToday(st, 'b', at(2026, 11, 24, 22))).toEqual([])
    setRoutineStep('b', 'quls', false, s, night)
    expect(stepsToday(readRoutine(s), 'b', night)).toEqual(['wudu'])
    setRoutineStep('b', 'mulk', true, s, at(2026, 11, 24, 22))
    st = readRoutine(s)
    expect(st.b).toEqual({ d: '2026-11-24', s: ['mulk'] })
    setRoutineStep('w', 'wake', true, s, at(2026, 11, 25, 6))
    clearRoutineToday('b', s)
    st = readRoutine(s)
    expect(st.b).toEqual({ d: '', s: [] })
    expect(st.w.s).toEqual(['wake'])
  })
  it('writeRoutinePrefs: saat və rəng yazılır, irəliləyiş toxunulmur', () => {
    const s = mem()
    setRoutineStep('w', 'adhkar', true, s, at(2026, 11, 25, 6))
    const v = writeRoutinePrefs({ rb: '22:30', bl: true, w: { d: '2000-01-01', s: [] } }, s)
    expect(v.rb).toBe('22:30')
    expect(v.bl).toBe(true)
    expect(v.w.s).toEqual(['adhkar'])
    expect(JSON.parse(s.getItem(ROUTINE_KEY)).rb).toBe('22:30')
  })
  it('localStorage bağlıdırsa — xəta atılmır', () => {
    const bad = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') } }
    expect(readRoutine(bad)).toEqual(sanitizeRoutine(null))
    expect(() => setRoutineStep('b', 'wudu', true, bad)).not.toThrow()
  })
  it('routineReminderDue: saatdan sonra 60 dəq ərzində, gündə bir dəfə', () => {
    expect(routineReminderDue('22:30', at(2026, 11, 23, 22, 29))).toBe(null)
    const k = routineReminderDue('22:30', at(2026, 11, 23, 22, 30))
    expect(k).toBe('2026-11-23@22:30')
    expect(routineReminderDue('22:30', at(2026, 11, 23, 22, 45), k)).toBe(null)
    expect(routineReminderDue('22:30', at(2026, 11, 23, 23, 30))).toBe(null)
    expect(routineReminderDue('', at(2026, 11, 23, 22, 30))).toBe(null)
    expect(routineReminderDue('7:5', at(2026, 11, 23, 7, 5))).toBe(null)
  })
  it('tasbihPhase: 33 / 33 / 34', () => {
    expect(TASBIH_TOTAL).toBe(100)
    expect(tasbihPhase(0)).toEqual({ phase: 0, inPhase: 0, target: 33 })
    expect(tasbihPhase(32)).toEqual({ phase: 0, inPhase: 32, target: 33 })
    expect(tasbihPhase(33)).toEqual({ phase: 1, inPhase: 0, target: 33 })
    expect(tasbihPhase(66)).toEqual({ phase: 2, inPhase: 0, target: 34 })
    expect(tasbihPhase(99)).toEqual({ phase: 2, inPhase: 33, target: 34 })
    expect(tasbihPhase(100).phase).toBe(3)
    expect(tasbihPhase(500).phase).toBe(3)
  })
})

describe('sleepRoutine — profil və sinxron', () => {
  it('profil açarıdır və birləşdiricisi var', () => {
    expect(PROFILE_KEYS).toContain(ROUTINE_KEY)
    expect(hasMerger(ROUTINE_KEY)).toBe(true)
    expect(hasMerger(`mcc_profile:pabc123:${ROUTINE_KEY}`)).toBe(true)
  })
  it('mergeRoutine: eyni gün — birlik, fərqli gün — təzəsi, tərcihlər — bu cihazınkı', () => {
    const L = { b: { d: '2026-11-23', s: ['wudu'] }, w: { d: '2026-11-22', s: ['wake'] }, rb: '22:00', rw: '', bl: true }
    const R = { b: { d: '2026-11-23', s: ['quls'] }, w: { d: '2026-11-23', s: ['adhkar'] }, rb: '23:00', rw: '05:30', bl: false }
    const m = mergeRoutine(L, R)
    expect(m.b).toEqual({ d: '2026-11-23', s: ['wudu', 'quls'] })
    expect(m.w).toEqual({ d: '2026-11-23', s: ['adhkar'] })
    expect([m.rb, m.rw, m.bl]).toEqual(['22:00', '', true])
    const out = JSON.parse(runMerger(ROUTINE_KEY, JSON.stringify(L), JSON.stringify(R)))
    expect(out).toEqual(m)
    expect(mergeRoutine(undefined, R).rb).toBe('23:00')
  })
})

describe('mənbə məlumatı — səhifələrin istinad etdiyi indekslər', () => {
  const hisn = (l) => JSON.parse(fs.readFileSync(`public/data/hisn/${l}.json`, 'utf8'))
  it.each(['az', 'en', 'ru', 'tr', 'ar'])('%s: Hisn fəsil 29 (yatma), 2 (oyanış), 28 (səhər-axşam)', (l) => {
    const d = hisn(l)
    const ch = (id) => d.chapters.find((c) => c.id === id)
    const sleep = ch(29)
    expect(sleep.items.length).toBe(13)
    for (const it of sleep.items) { expect(it.ar).toBeTruthy(); expect(it.src).toBeTruthy() }
    expect(sleep.items[0].repeat).toBe(3)              // İxlas, Fələq, Nas — 3 dəfə
    expect(sleep.items[0].src).toMatch(/9\/62/)
    expect(sleep.items[1].src).toMatch(/4\/487/)       // Ayətül-Kürsi
    expect(sleep.items[3].src).toMatch(/2084/)         // yatağı silkələmək
    expect(sleep.items[5].src).toMatch(/4\/311/)       // sağ əl yanağın altında
    expect(sleep.items[7].src).toMatch(/7\/71/)        // 33 / 33 / 34
    expect(sleep.items[11].src).toMatch(/2892/)        // Səcdə və Mülk
    expect(ch(2).items.length).toBe(4)
    expect(ch(28).items.length).toBeGreaterThan(20)
  })
  it('hədis 1063 — Buxari 247 (dəstəmaz və sağ tərəf), 5 dildə', () => {
    for (const l of ['az', 'en', 'ru', 'tr', 'ar']) {
      const x = HADITHS[l].find((v) => v.id === 1063)
      expect(x.source).toBe('Buxari 247')
      expect(x.ar).toContain('شِقِّكَ الأَيْمَنِ')
      expect(x.text).toBeTruthy()
    }
  })
  it('marşrutlar', () => {
    expect(PAGES.find((p) => p.key === 'bedtime')?.path).toBe('bedtime-sunnah')
    expect(PAGES.find((p) => p.key === 'waking')?.path).toBe('morning-routine')
    expect(pathFor('bedtime', 'en')).toBe('/en/bedtime-sunnah')
    expect(BED_STEPS.length).toBe(8)
    expect(WAKE_STEPS.length).toBe(4)
  })
})

// ── SSR ──
globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
let LangProvider, Bedtime, Morning
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  Bedtime = (await import('../../src/pages/BedtimeRoutinePage.jsx')).default
  Morning = (await import('../../src/pages/MorningRoutinePage.jsx')).default
})
const render = (Page, url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
afterEach(() => { delete globalThis.localStorage })

describe('SSR — yatma və oyanış səhifələri', () => {
  const pages = [
    ['bedtime-sunnah', () => Bedtime, 'Bedtime Sunnah routine', 'slr--dark'],
    ['morning-routine', () => Morning, 'Morning waking routine', 'slr--site'],
  ]
  for (const [path, get, enTitle, cls] of pages) {
    it(`${path}: 5 dildə render olunur`, () => {
      for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
        const html = render(get(), `${l}/${path}`)
        expect(html).toContain('<h1')
        expect(html).toContain(cls)
        if (l === '/en') {
          expect(html).toContain(enTitle)
          expect(html).toContain('There are no streaks, points or comparisons.')
        }
      }
    })
    it(`${path}: ilk render yaddaşdakı şəxsi məlumatdan asılı deyil`, () => {
      const empty = render(get(), `/en/${path}`)
      const day = routineDay('b')
      globalThis.localStorage = mem({
        [ROUTINE_KEY]: JSON.stringify({ b: { d: day, s: ['wudu', 'quls'] }, w: { d: routineDay('w'), s: ['wake'] }, rb: '22:00', rw: '05:00', bl: true }),
      })
      expect(render(get(), `/en/${path}`)).toBe(empty)
    })
  }
})
