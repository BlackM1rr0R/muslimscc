// Ramazana hazırlıq yolu və son 10 gecə (utils/ramadanPrep): tarix (Ümmül-Qura — saytın hicri köməkçiləri),
// yolun planı, son onluğun gecələri, yaddaş, sinxron birləşdiricisi, profil açarı; mətnlərin 5 dildə olması;
// dini məzmun yalnız saytın Ramazan bələdçisindəndir (verbatim, mənbəsi ilə); marşrut, menyu, meta;
// SSR: ilk render yaddaşdan və tarixdən asılı deyil (prerender = ilk klient render).
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  ramadanStatus, roadPlan, roadPhase, roadDate, shabanOffset, lastTenStatus, nightEvening, isOddNight, lastNightOf,
  sanitizePrep, readPrep, writePrep, markRoad, markNight, roadDone, nightDone, nightCount, flatPrep, unflatPrep,
  PREP_KEY, ROAD_DAYS, MILESTONES, FILLERS, STEP_KINDS, NIGHT_ITEMS, TEN_NIGHTS, shiftDay,
} from '../../src/utils/ramadanPrep.js'
import { ramadanRange } from '../../src/utils/ramadanRange.js'
import { runMerger, hasMerger, CONFLICT } from '../../src/utils/syncMergers.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { isBackupKey } from '../../src/utils/userBackup.js'
import { T, STEP_TEXT, NIGHT_TEXT } from '../../src/components/ramadanPrep/prepText.js'
import { RAMADAN_GUIDE } from '../../src/data/ramadanGuide.js'
import { PAGES, pathFor, parsePath } from '../../src/seo/routes.js'
import { NAV_ITEMS, navLabel } from '../../src/data/navigation.js'
import { META } from '../../src/seo/meta.js'
import { WHATS_NEW } from '../../src/data/whatsNew.js'
import { WHATS_NEW_TEXT } from '../../src/components/whatsnew/whatsNewText.js'
globalThis.React = React
let hasIcon
beforeAll(async () => { ({ hasIcon } = await import('../../src/components/Icon.jsx')) })

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const J = JSON.stringify
const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size }, _m: m }
}

describe('tarix — Ramazan 1448 (Ümmül-Qura)', () => {
  it('Ramazanın aralığı saytın hicri köməkçisindən gəlir', () => {
    expect(ramadanRange(1448)).toEqual({ y: 1448, s: '2027-02-08', e: '2027-03-08', days: 29 })
  })
  it('Ramazandan əvvəl: qalan gün sayı; Ramazanda: günü; Ramazandan sonra: gələn ilin Ramazanı', () => {
    expect(ramadanStatus('2026-11-24')).toMatchObject({ phase: 'before', year: 1448, daysLeft: 76 })
    expect(ramadanStatus('2027-02-07')).toMatchObject({ phase: 'before', year: 1448, daysLeft: 1 })
    expect(ramadanStatus('2027-02-08')).toMatchObject({ phase: 'ramadan', year: 1448, day: 1 })
    expect(ramadanStatus('2027-03-08')).toMatchObject({ phase: 'ramadan', year: 1448, day: 29 })
    const after = ramadanStatus('2027-03-09')
    expect(after).toMatchObject({ phase: 'before', year: 1449 })
    expect(after.range.s).toBe(ramadanRange(1449).s)
    expect(after.daysLeft).toBeGreaterThan(300)
    expect(ramadanStatus('bad')).toBeNull()
  })
  it('yolun vəziyyəti: 90 gündən çox — "early", 1…90 — "road", Ramazanda — "ramadan"', () => {
    expect(roadPhase(ramadanStatus('2026-11-24'))).toBe('road')
    expect(roadPhase(ramadanStatus('2026-11-10'))).toBe('road') // 90 gün
    expect(ramadanStatus('2026-11-09').daysLeft).toBe(91)
    expect(roadPhase(ramadanStatus('2026-11-09'))).toBe('early')
    expect(roadPhase({ phase: 'before', daysLeft: 91 })).toBe('early')
    expect(roadPhase({ phase: 'before', daysLeft: 90 })).toBe('road')
    expect(roadPhase(ramadanStatus('2027-02-20'))).toBe('ramadan')
    expect(roadPhase(null)).toBeNull()
  })
  it('qalan günün tarixi və gün sürüşməsi', () => {
    const r = ramadanRange(1448)
    expect(roadDate(r, 76)).toBe('2026-11-24')
    expect(roadDate(r, 1)).toBe('2027-02-07')
    expect(shiftDay('2027-02-28', 1)).toBe('2027-03-01')
    expect(shiftDay('x', 1)).toBeNull()
  })
})

describe('yolun planı', () => {
  const plan = roadPlan(1448)
  it(`${ROAD_DAYS} gün, xronoloji (n ${ROAD_DAYS} → 1), hər günə bir addım`, () => {
    expect(plan).toHaveLength(ROAD_DAYS)
    expect(plan[0].n).toBe(ROAD_DAYS)
    expect(plan.at(-1).n).toBe(1)
    expect(plan.every((s, i) => s.n === ROAD_DAYS - i && typeof s.kind === 'string')).toBe(true)
  })
  it('Şaban addımı Şabanın 1-nə düşür (hicri təqvimdən), mərhələlər yerindədir', () => {
    expect(shabanOffset(1448)).toBe(30) // 1 Şaban 1448 = 2027-01-09
    expect(plan.find((s) => s.kind === 'shaban').n).toBe(30)
    for (const [n, kind] of Object.entries(MILESTONES)) {
      if (+n !== 30) expect(plan.find((s) => s.n === +n).kind).toBe(kind)
    }
    expect(plan.find((s) => s.n === 1).kind).toBe('moon')
    expect(plan.find((s) => s.n === 5).kind).toBe('iftar-dua')
  })
  it('son 10 gündə qəza orucu təklif olunmur; boş günlər gündəlik vərdişlərdir', () => {
    expect(plan.filter((s) => s.n <= 10).some((s) => s.kind === 'qada-fast')).toBe(false)
    const fill = plan.filter((s) => !MILESTONES[s.n] && s.kind !== 'shaban')
    expect(fill.every((s) => FILLERS.includes(s.kind))).toBe(true)
  })
  it('hər addımın mətni var: bələdçi bölməsi mövcuddur, digərləri 5 dildə; keçidlər həqiqi marşrutlardır', () => {
    const keys = new Set(PAGES.map((p) => p.key))
    for (const kind of STEP_KINDS) {
      if (kind.startsWith('g:')) {
        expect(RAMADAN_GUIDE.some((s) => s.id === kind.slice(2)), kind).toBe(true)
        continue
      }
      const s = STEP_TEXT[kind]
      expect(s, kind).toBeTruthy()
      for (const l of LANGS) {
        expect(s.title[l], `${kind}.title.${l}`).toBeTruthy()
        expect(s.text[l], `${kind}.text.${l}`).toBeTruthy()
      }
      expect(hasIcon(s.icon), `${kind} ikon ${s.icon}`).toBe(true)
      for (const l of s.links) expect(keys.has(l.to), `${kind} → ${l.to}`).toBe(true)
    }
  })
})

describe('dini məzmun — yalnız saytın Ramazan bələdçisindən (verbatim, mənbəsi ilə)', () => {
  const block = (sec, t) => RAMADAN_GUIDE.find((s) => s.id === sec)?.blocks.find((b) => b.t === t)
  it('addımların sitatları bələdçidəki mövcud bloklara işarə edir və mənbəsi var', () => {
    const quotes = Object.entries(STEP_TEXT).filter(([, s]) => s.quote)
    expect(quotes.map(([k]) => k).sort()).toEqual(['iftar-dua', 'iftar-invite', 'moon', 'qada-count'])
    for (const [k, { quote }] of quotes) {
      const b = block(quote.sec, quote.t)
      expect(b, k).toBeTruthy()
      if (quote.t === 'steps') expect(b.items[quote.item].text.en).toContain('Tirmidhi 807')
    }
    expect(block('exempt', 'note').text.en).toContain('Bukhari 1950')
    expect(block('suhoor-iftar', 'dua').src.en).toBe('Abu Dawud 2357 (al-Albani: hasan)')
    expect(block('eid', 'hadith').src.en).toMatch(/1909/)
  })
  it('Qədr gecəsinin duası — Tirmizi 3513 (əl-Albani: səhih), mətni dəyişməyib', () => {
    const d = block('laylat-al-qadr', 'dua')
    expect(d.ar).toBe('اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي')
    expect(d.src.en).toBe('Tirmidhi 3513 (al-Albani: sahih)')
    for (const l of ['az', 'en', 'ru', 'tr']) expect(d.text[l]).toBeTruthy()
  })
})

describe('son 10 gecə', () => {
  const r = ramadanRange(1448)
  it('N-ci gecə Ramazanın (N−1)-ci gününün axşamı başlayır; tək gecələr', () => {
    expect(nightEvening(r, 21)).toBe('2027-02-27') // Ramazanın 20-si
    expect(nightEvening(r, 30)).toBe('2027-03-08')
    expect(TEN_NIGHTS).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
    expect(TEN_NIGHTS.filter(isOddNight)).toEqual([21, 23, 25, 27, 29])
    expect(lastNightOf(r)).toBe(29)
  })
  it('vəziyyət: əvvəl / aktiv (gecəyarısından sonra hələ keçən gecə) / bitib', () => {
    expect(lastTenStatus('2026-11-24', 12)).toMatchObject({ phase: 'before', year: 1448, daysLeft: 95 })
    expect(lastTenStatus('2027-02-26', 22)).toMatchObject({ phase: 'before', daysLeft: 1 })
    expect(lastTenStatus('2027-02-27', 22)).toMatchObject({ phase: 'active', night: 21 })
    expect(lastTenStatus('2027-02-28', 2)).toMatchObject({ phase: 'active', night: 21 })
    expect(lastTenStatus('2027-02-28', 21)).toMatchObject({ phase: 'active', night: 22 })
    // 29-cu günün axşamı: hesab ayı 29 gün olsa da 30-cu gecə açıqdır (hilal görünməyə bilər)
    expect(lastTenStatus('2027-03-08', 21)).toMatchObject({ phase: 'active', night: 30 })
    // Şəvvalın 1-i gecəyarısından sonra — bu ilin son onluğu bitib
    expect(lastTenStatus('2027-03-09', 1)).toMatchObject({ phase: 'after', year: 1448 })
    // Bayram günü — növbəti ilin son onluğuna qədər
    expect(lastTenStatus('2027-03-09', 12)).toMatchObject({ phase: 'before', year: 1449 })
  })
})

describe('yaddaş (ramadan_prep_v1)', () => {
  it('təmizləmə: yalnız tanınan il, addım, gecə, iş və həqiqi gün; son 3 il', () => {
    const raw = {
      r: { 1448: { 76: '2026-11-24', 0: '2026-11-24', 500: '2026-11-24', 75: '2026-02-30' }, abc: { 1: '2026-11-24' } },
      t: { 1448: { '21.qiyam': '2027-02-27', '21.sleep': '2027-02-27', '20.dua': '2027-02-27', '21.dua.x': '2027-02-27' } },
    }
    expect(sanitizePrep(raw)).toEqual({ v: 1, r: { 1448: { 76: '2026-11-24' } }, t: { 1448: { '21.qiyam': '2027-02-27' } } })
    const many = { r: { 1445: { 1: '2024-01-01' }, 1446: { 1: '2025-01-01' }, 1447: { 1: '2026-01-01' }, 1448: { 1: '2027-01-01' } } }
    expect(Object.keys(sanitizePrep(many).r)).toEqual(['1446', '1447', '1448'])
    expect(sanitizePrep(null)).toEqual({ v: 1, r: {}, t: {} })
    expect(sanitizePrep('x')).toEqual({ v: 1, r: {}, t: {} })
  })
  it('işarələ / götür, ilk gün saxlanılır; boşalanda açar silinir', () => {
    let p = markRoad({}, 1448, 76, true, '2026-11-24')
    p = markRoad(p, 1448, 76, true, '2026-11-25')
    expect(roadDone(p, 1448)).toEqual({ 76: '2026-11-24' })
    p = markNight(p, 1448, 21, 'qiyam', true, '2027-02-27')
    p = markNight(p, 1448, 21, 'dua', true, '2027-02-27')
    expect(nightDone(p, 1448, 21, 'qiyam')).toBe(true)
    expect(nightDone(p, 1448, 22, 'qiyam')).toBe(false)
    expect(nightCount(p, 1448, 21)).toBe(2)
    expect(NIGHT_ITEMS).toEqual(['qiyam', 'quran', 'dua', 'sadaqah', 'istighfar'])
    const s = mem()
    writePrep(p, s)
    expect(readPrep(s)).toEqual(p)
    p = markRoad(p, 1448, 76, false)
    p = markNight(markNight(p, 1448, 21, 'qiyam', false), 1448, 21, 'dua', false)
    writePrep(p, s)
    expect(s.getItem(PREP_KEY)).toBeNull()
    expect(readPrep(mem({ [PREP_KEY]: '{bad' }))).toEqual({ v: 1, r: {}, t: {} })
  })
  it('düz xəritə ↔ obyekt', () => {
    const p = sanitizePrep({ r: { 1448: { 5: '2027-02-03' } }, t: { 1448: { '27.dua': '2027-03-05' } } })
    expect(flatPrep(p)).toEqual({ 'r|1448|5': '2027-02-03', 't|1448|27.dua': '2027-03-05' })
    expect(unflatPrep(flatPrep(p))).toEqual(p)
  })
  it('profilə aiddir, ehtiyat nüsxəyə düşür, sinxron birləşdiricisi 3 tərəflidir', () => {
    expect(PROFILE_KEYS).toContain(PREP_KEY)
    expect(isBackupKey(PREP_KEY)).toBe(true)
    expect(hasMerger(PREP_KEY)).toBe(true)
    const base = { v: 1, r: { 1448: { 76: '2026-11-24', 75: '2026-11-25' } }, t: {} }
    const local = { v: 1, r: { 1448: { 76: '2026-11-24' } }, t: { 1448: { '21.dua': '2027-02-27' } } }               // 75 götürülüb
    const remote = { v: 1, r: { 1448: { 76: '2026-11-23', 75: '2026-11-25', 74: '2026-11-26' } }, t: {} }            // 76 başqa gün, 74 əlavə
    const out = JSON.parse(runMerger(PREP_KEY, J(local), J(remote), J(base)))
    expect(out).toEqual({ v: 1, r: { 1448: { 76: '2026-11-23', 74: '2026-11-26' } }, t: { 1448: { '21.dua': '2027-02-27' } } })
    expect(runMerger(PREP_KEY, J({ v: 1, r: {}, t: {} }), J({ v: 1, r: {}, t: {} }), undefined)).toBeUndefined()
    expect(runMerger(PREP_KEY, '{bad', J(remote), undefined)).toBe(CONFLICT)
  })
})

describe('mətnlər, marşrut, menyu, meta, yeniliklər', () => {
  it('interfeys yazıları 5 dildə, say ifadələri bütöv cümlədir', () => {
    const keys = Object.keys(T.en)
    for (const l of LANGS) expect(Object.keys(T[l]).sort(), l).toEqual([...keys].sort())
    expect(T.en.daysLeft(1)).toBe('1 day until Ramadan')
    expect(T.en.daysLeft(76)).toBe('76 days until Ramadan')
    expect(T.ru.daysLeft(2)).toBe('До Рамадана 2 дня')
    expect(T.ru.daysLeft(5)).toBe('До Рамадана 5 дней')
    expect(T.ar.daysLeft(2)).toBe('يومان حتى رمضان')
    expect(T.ar.daysLeft(11)).toBe('11 يومًا حتى رمضان')
    expect(T.en.qadaOwed(1)).toBe('Your qada tracker shows 1 fast left.')
    for (const it of NIGHT_ITEMS) for (const l of LANGS) expect(NIGHT_TEXT[it].title[l]).toBeTruthy()
  })
  it('iki marşrut, menyuda bir dəfə, ikonları var, meta uzunluqları', () => {
    expect(pathFor('ramadanprep', 'az')).toBe('/road-to-ramadan')
    expect(pathFor('lastten', 'en')).toBe('/en/last-ten-nights')
    expect(parsePath('/ar/last-ten-nights')).toMatchObject({ lang: 'ar', key: 'lastten', known: true })
    for (const k of ['ramadanprep', 'lastten']) {
      expect(NAV_ITEMS.filter((i) => i.key === k)).toHaveLength(1)
      expect(hasIcon(k)).toBe(true)
      for (const l of LANGS) {
        expect(META[k][l].t.length, `${k}/${l}`).toBeLessThanOrEqual(65)
        expect(META[k][l].d.length, `${k}/${l}`).toBeLessThanOrEqual(160)
      }
      expect(WHATS_NEW.find((e) => e.key === k)).toMatchObject({ page: true })
      expect(WHATS_NEW_TEXT[k].t.en).toBeTruthy()
    }
    expect(navLabel('ramadanprep', 'en')).toBe('Road to Ramadan')
  })
})

// ── SSR: prerender = ilk klient render (tarix və yaddaş yalnız mount-dan sonra) ──
globalThis.React = React
let LangProvider, Page
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  Page = (await import('../../src/pages/RamadanPrepPage.jsx')).default
})
const render = (url, view) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page, { setPage: () => {}, view }))))
afterEach(() => { delete globalThis.localStorage })

describe('SSR — hazırlıq yolu və son 10 gecə', () => {
  it('5 dildə render olunur; ilk render yaddaşdan asılı deyil', () => {
    for (const [path, view, title] of [['road-to-ramadan', 'road', 'Road to Ramadan'], ['last-ten-nights', 'nights', 'Last ten nights']]) {
      for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
        const html = render(`${l}/${path}`, view)
        expect(html).toContain('<h1')
        if (l === '/en') expect(html).toContain(title)
      }
      const empty = render(`/en/${path}`, view)
      globalThis.localStorage = mem({ [PREP_KEY]: J({ v: 1, r: { 1448: { 76: '2026-11-24' } }, t: { 1448: { '21.dua': '2027-02-27' } } }) })
      expect(render(`/en/${path}`, view)).toBe(empty)
    }
  })
})
