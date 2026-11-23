// "Mənim ilim" kitabı (utils/yearBook): il aralıqları (hicri / miladi), mənbələrdən yığım, boş bölmələr,
// SSR — ilk render yaddaşdan asılı deyil (hidratasiya uyğunsuzluğu olmasın), 5 dil.
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { yearRange, yearOptions, currentYear, gatherYearBook, buildYearBook, LIST_MAX } from '../../src/utils/yearBook.js'
import { emptyLife, applyRead, serializeLife } from '../../src/utils/quranLife.js'
import { YB } from '../../src/components/yearbook/yearBookText.js'

globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
const J = JSON.stringify
const store = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k),
  }
}
const localMs = (y, m, d, hh = 10) => new Date(y, m - 1, d, hh).getTime()

describe('il aralığı', () => {
  it('miladi: 1 yanvar — 31 dekabr', () => {
    expect(yearRange('greg', 2026)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
    expect(yearRange('greg', 'x')).toBe(null)
  })
  it('hicri 1447: 1 Məhərrəm — növbəti ilin 1 Məhərrəmindən bir gün əvvəl (Ümmül-Qura)', () => {
    const r = yearRange('hijri', 1447)
    expect(r.from).toBe('2025-06-26')
    expect(r.to).toBe('2026-06-15')
  })
  it('cari il və əvvəlki 5 il', () => {
    expect(currentYear('greg', '2026-11-23')).toBe(2026)
    expect(currentYear('hijri', '2026-11-23')).toBe(1448)
    expect(yearOptions('greg', '2026-11-23')).toEqual([2026, 2025, 2024, 2023, 2022, 2021])
    expect(yearOptions('hijri', '2026-11-23')[0]).toBe(1448)
  })
})

describe('kitabın məzmunu', () => {
  const life = (() => {
    let st = emptyLife()
    st = applyRead(st, [0, 1, 2], '2026-03-01').st                     // Fatihə — 2026
    st = applyRead(st, [7], '2025-05-05').st                           // Bəqərə — yalnız 2025
    return { ...st, ks: [{ s: '2025-01-01', e: '2026-04-04' }], k: 1 }
  })()
  const s = store({
    quran_life_v1: J(serializeLife(life)),
    hifz_progress: J({ 112: 2, 113: 2, 114: 1 }),
    hifz_dates_v1: J({ 112: '2026-02-02', 113: '2025-12-30', 114: '2026-02-03' }),
    quran_notes_v1: J({ '2:255': { c: 'gold', t: 'Ayətül-kürsi qeydim', u: localMs(2026, 5, 5), d: localMs(2026, 5, 5) }, '1:1': { c: 'green', t: '', u: localMs(2025, 1, 1) } }),
    dua_journal: J({ duas: [{ id: 'a', text: 'Ailəm üçün', category: 'family', date: '2026-01-10', answered: true, answeredDate: '2026-03-03' }, { id: 'b', text: 'Köhnə', date: '2024-01-01' }] }),
    muslim_cc_ramadan_fasts_v1: J({ 1447: { 1: 1, 2: 1, 3: 0 } }),
    ramadan_album_v1: J({ v: 1, y: { 1447: { s: '2026-02-18', e: '2026-03-19', f: 2, su: 4, du: 1 } } }),
    charity_log: J([
      { id: 1, date: '2026-02-20', type: 'money', amount: '10', description: 'Məscid', to: 'Qonşu' },
      { id: 2, date: '2026-07-01', type: 'food', amount: '' },
      { id: 3, date: '2025-07-01', type: 'money', amount: '99' },
    ]),
    muslim_cc_passport_v1: J({ hifz_surah: '2026-02-02', names_99: '2024-01-01' }),
    dhikr_daily_v1: J({ '2026-01-02': 33 }),
  })

  it('miladi 2026: xətm, mozaika, əzbər, qeyd, dua, Ramazan, sədəqə, möhür — yalnız ilin içindəkilər', () => {
    const b = buildYearBook(gatherYearBook(s), yearRange('greg', 2026))
    expect(b.empty).toBe(false)
    expect(b.khatms).toEqual([{ d: '2026-04-04', n: 1 }])
    expect(b.surahs).toEqual([1])
    expect(b.hifz).toEqual([{ s: 112, d: '2026-02-02' }])           // 113 — 2025, 114 — əzbər deyil
    expect(b.notes).toHaveLength(1)
    expect(b.notes[0]).toMatchObject({ s: 2, a: 255, c: 'gold', t: 'Ayətül-kürsi qeydim' })
    expect(b.duas).toEqual([{ d: '2026-01-10', text: 'Ailəm üçün', cat: 'family', ans: true, ansD: '2026-03-03' }])
    expect(b.ramadan).toHaveLength(1)
    expect(b.ramadan[0]).toMatchObject({ y: 1447, f: 2, su: 4, du: 1 })
    expect(b.charity.count).toBe(2)
    expect(b.charity.amount).toBe(10)
    expect(b.charity.withAmount).toBe(1)
    expect(b.charity.entries[0]).toMatchObject({ d: '2026-02-20', type: 'money', to: 'Qonşu', desc: 'Məscid' })
    expect(b.stamps).toEqual([{ id: 'hifz_surah', d: '2026-02-02' }])
    expect(b.glance.find((x) => x.k === 'dhikr').v).toBe(33)
    expect(b.ayahsLife).toBe(4)
  })
  it('heç nə olmayan il — bütün bölmələr boş, empty=true', () => {
    const b = buildYearBook(gatherYearBook(s), yearRange('greg', 2021))
    expect(b.empty).toBe(true)
    expect(b.khatms).toEqual([])
    expect(b.charity.count).toBe(0)
    expect(buildYearBook(gatherYearBook(store()), yearRange('hijri', 1447)).empty).toBe(true)
  })
  it('uzun siyahı LIST_MAX ilə kəsilir', () => {
    const many = Array.from({ length: LIST_MAX + 20 }, (_, i) => ({ id: `d${i}`, text: `D${i}`, date: '2026-01-01' }))
    const b = buildYearBook(gatherYearBook(store({ dua_journal: J({ duas: many }) })), yearRange('greg', 2026))
    expect(b.duas).toHaveLength(LIST_MAX)
  })
})

describe('mətn', () => {
  it('5 dil eyni açarlara malikdir; say ifadələri bütövdür', () => {
    const keys = Object.keys(YB.en).sort()
    for (const l of ['az', 'ru', 'tr', 'ar']) expect(Object.keys(YB[l]).sort()).toEqual(keys)
    expect(YB.en.khatms(1)).toBe('1 khatm completed')
    expect(YB.en.khatms(3)).toBe('3 khatms completed')
    expect(YB.ru.hifzCount(2)).toBe('2 суры выучено')
    expect(YB.ru.hifzCount(5)).toBe('5 сур выучено')
    expect(YB.ar.khatms(2)).toBe('ختمتان مكتملتان')
  })
})

let LangProvider, YearBookPage, TravellerKitPage
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  YearBookPage = (await import('../../src/pages/YearBookPage.jsx')).default
  TravellerKitPage = (await import('../../src/pages/TravellerKitPage.jsx')).default
})
afterEach(() => { delete globalThis.localStorage })
const render = (Page, url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))

describe('SSR — /my-year-book və /traveller-kit', () => {
  const pages = [
    ['my-year-book', () => YearBookPage, 'My year — a book for you', 'This book stays on your device.'],
    ['traveller-kit', () => TravellerKitPage, 'Muslim traveller kit', 'Choose a destination to see its qibla and prayer times.'],
  ]
  for (const [path, get, title, note] of pages) {
    it(`${path}: 5 dildə render olunur, ingiliscə başlıq və qeyd`, () => {
      for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
        const html = render(get(), `${l}/${path}`)
        expect(html).toContain('<h1')
        if (l === '/en') { expect(html).toContain(title); expect(html).toContain(note) }
      }
    })
    it(`${path}: ilk render yaddaşdakı şəxsi məlumatdan asılı deyil`, () => {
      const empty = render(get(), `/en/${path}`)
      globalThis.localStorage = store({
        traveller_trips_v1: J({ v: 1, l: [{ id: 'tabcde', n: 'Istanbul', la: 41, lo: 29, tz: 'Europe/Istanbul', u: 1 }] }),
        dua_journal: J({ duas: [{ id: 'a', text: 'X', date: '2026-01-10' }] }),
        muslim_cc_madhab: 'hanafi',
        muslim_cc_selected_city: 'Sheki',
      })
      expect(render(get(), `/en/${path}`)).toBe(empty)
    })
  }
})
