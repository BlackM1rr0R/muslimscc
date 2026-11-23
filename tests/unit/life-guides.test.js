// P2 həyat bələdçiləri: körpənin Sünnə planı, vəfat bələdçisi, nikaha hazırlıq.
//   • utils/lifeGuides — təmizləmə, işarə/qeyd yazılışı, 7-ci günün hesablanması (dərsdəki nümunə), .ics
//   • dərs istinadları: hər addımın göstərdiyi dərs blokları mövcuddur və mənbəlidir (dərs dəyişəndə test düşür)
//   • Hisnul-Müslim fəsilləri mövcuddur və mövzusu uyğundur
//   • sinxronizasiya birləşdiricisi (newborn_plan_v1); vəfat/nikah qeydləri ehtiyat/sinxrona düşmür
//   • SSR: 5 dildə render, ilk render yaddaşdan asılı deyil (hidratasiya)
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  NEWBORN_KEY, LOVED_KEY, NIKAH_KEY, NEWBORN_STEP_IDS, LOVED_STEP_IDS, NIKAH_STEP_IDS, NIKAH_QUESTION_IDS,
  sanitizeNewborn, sanitizeLoved, sanitizeNikah, readGuide, writeGuide, setGuideStep, clearGuide,
  newbornDates, daysSince, day7Ics, cleanNote, NOTE_MAX,
} from '../../src/utils/lifeGuides.js'
import { MERGERS } from '../../src/utils/syncMergers.js'
import { isBackupKey } from '../../src/utils/userBackup.js'
import { isProfileScoped } from '../../src/utils/profileCore.js'
import { localizeSource } from '../../src/utils/sourceNames.js'
import { weekdayOf, parseGKey } from '../../src/utils/hijri.js'
import { PAGES } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'

globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }

const J = JSON.stringify
const store = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m,
  }
}

let Newborn, Loved, Nikah, LangProvider
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  Newborn = await import('../../src/pages/NewbornGuidePage.jsx')
  Loved = await import('../../src/pages/LovedOneGuidePage.jsx')
  Nikah = await import('../../src/pages/NikahGuidePage.jsx')
})
afterEach(() => { delete globalThis.localStorage })

describe('utils/lifeGuides — yaddaş', () => {
  it('təmizləmə: tanınmayan addım, səhv gün, artıq sahə atılır', () => {
    expect(sanitizeNewborn({ b: '2026-02-30', n: 'yes', d: { tahnik: '2026-11-01', x: '2026-11-01', name: 'bad' } }))
      .toEqual({ v: 1, d: { tahnik: '2026-11-01' } })
    expect(sanitizeNewborn({ b: '2026-11-20', n: true, d: {} })).toEqual({ v: 1, b: '2026-11-20', n: true, d: {} })
    expect(sanitizeLoved({ d: { ghusl: '2026-11-01', hack: '2026-11-01' } })).toEqual({ v: 1, d: { ghusl: '2026-11-01' } })
    const nk = sanitizeNikah({ q: { mahr: 'a\u0000b', other: 'x', rights: '   ' }, w: { date: '2026-13-01', note: 'hall' } })
    expect(nk).toEqual({ v: 1, d: {}, q: { mahr: 'ab' }, w: { note: 'hall' } })
    expect([...cleanNote('ə'.repeat(NOTE_MAX + 50))].length).toBe(NOTE_MAX)
    expect(sanitizeNikah(null)).toEqual({ v: 1, d: {}, q: {}, w: {} })
  })
  it('işarə qoyulur, götürülür; boş qeyd açarı silir', () => {
    const s = store()
    setGuideStep(LOVED_KEY, 'ghusl', true, s, '2026-11-20')
    expect(JSON.parse(s.getItem(LOVED_KEY))).toEqual({ v: 1, d: { ghusl: '2026-11-20' } })
    // təkrar işarə günü dəyişmir
    setGuideStep(LOVED_KEY, 'ghusl', true, s, '2026-11-21')
    expect(readGuide(LOVED_KEY, s).d.ghusl).toBe('2026-11-20')
    // tanınmayan addım
    setGuideStep(LOVED_KEY, 'nope', true, s)
    expect(Object.keys(readGuide(LOVED_KEY, s).d)).toEqual(['ghusl'])
    setGuideStep(LOVED_KEY, 'ghusl', false, s)
    expect(s.getItem(LOVED_KEY)).toBeNull()
    writeGuide(NIKAH_KEY, { q: { mahr: 'gold' } }, s)
    expect(readGuide(NIKAH_KEY, s).q).toEqual({ mahr: 'gold' })
    clearGuide(NIKAH_KEY, s)
    expect(s.getItem(NIKAH_KEY)).toBeNull()
    // yalnız doğum günü də saxlanılır
    writeGuide(NEWBORN_KEY, { b: '2026-11-20' }, s)
    expect(readGuide(NEWBORN_KEY, s)).toEqual({ v: 1, b: '2026-11-20', d: {} })
  })
  it('yaddaş bağlıdırsa (null) xəta atmır', () => {
    expect(readGuide(NEWBORN_KEY, null)).toEqual({ v: 1, d: {} })
    expect(() => setGuideStep(NEWBORN_KEY, 'tahnik', true, null)).not.toThrow()
  })
})

describe('utils/lifeGuides — 7-ci gün (dərs: doğum günü daxildir; gecə — ertəsi gündən)', () => {
  it('dərsdəki nümunə: cümə doğulan — əqiqə gələn cümə axşamı', () => {
    const r = newbornDates('2026-11-20') // cümə
    expect(weekdayOf(parseGKey('2026-11-20'))).toBe(5)
    expect(r).toEqual({ birth: '2026-11-20', start: '2026-11-20', day7: '2026-11-26' })
    expect(weekdayOf(parseGKey(r.day7))).toBe(4) // cümə axşamı
  })
  it('gecə doğulub — sayma ertəsi gündən; ay və il keçidi', () => {
    expect(newbornDates('2026-11-20', true).day7).toBe('2026-11-27')
    expect(newbornDates('2026-12-28').day7).toBe('2027-01-03')
    expect(newbornDates('2028-02-25').day7).toBe('2028-03-02')
    expect(newbornDates('bad')).toBeNull()
  })
  it('daysSince və .ics', () => {
    expect(daysSince('2026-11-20', '2026-11-26')).toBe(6)
    expect(daysSince('2026-11-26', '2026-11-20')).toBe(-6)
    const ics = day7Ics({ day7: '2026-11-26', title: 'Day 7; aqiqah', now: 0 })
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('UID:newborn-2026-11-26@muslims.cc')
    expect(ics).toContain('SUMMARY:Day 7\\; aqiqah')
    expect(ics).toContain('TRIGGER:-PT1440M')
    expect(day7Ics({ day7: 'x', title: 't' })).toBe('')
  })
})

// ── Dərs istinadları ──
const ALLOWED = new Set(['p', 'list', 'steps', 'hadith', 'dua', 'note', 'table', 'ayah', 'qa'])
// Göstərilən hədis/dua bloklarının mənbələri (ingiliscə) — content-review üçün sabit siyahı
const EXPECT_SOURCES = {
  'aqiqah/customs': [], 'aqiqah/tahnik': ['al-Bukhari 5467, Muslim 2145'], 'aqiqah/naming': ['Muslim 2132 (Ibn Umar)'],
  'aqiqah/ruling': ['al-Bukhari 5472 (Salman ibn Amir ad-Dabbi)', 'Abu Dawud 2838 (Samurah ibn Jundub)'], 'aqiqah/number': ['Abu Dawud 2834 (Umm Kurz); also at-Tirmidhi 1513 (Aishah)'],
  'aqiqah/day-seven': [], 'aqiqah/shaving': ['at-Tirmidhi 1519 (Ali)'],
  'janazah/after-death': ['Muslim 920', 'Muslim 920', 'Muslim 918', 'Muslim 918', 'Bukhari 1303'], 'janazah/washing': ['Bukhari 1253, 1254; Muslim 939'],
  'janazah/shroud': ['Bukhari 1264, Muslim 941', 'Tirmidhi 994, Abu Dawud 3878'],
  'janazah/prayer': ['Bukhari 1325, Muslim 945', 'Bukhari 3370', 'Muslim 963'],
  'janazah/burial': ['Bukhari 1315, Muslim 944', 'Abu Dawud 3213, Tirmidhi 1046 (sahih — al-Albani)', 'Muslim 970'],
  'janazah/after-burial': ['Abu Dawud 3221', 'Muslim 975'], 'janazah/condolence': ['Bukhari 1284, Muslim 923', 'Bukhari 1280', 'Bukhari 1294, Muslim 103'],
  'janazah/innovations': [], 'wasiyyah/debts': ['Tirmidhi 1078'], 'wasiyyah/third': ['Bukhari 2742, Muslim 1628'],
  'wasiyyah/heir': ['Abu Dawud 2870, Tirmidhi 2120, Ibn Majah 2713'],
  'nikah/intro': ['al-Bukhari 5066, Muslim 1400', 'al-Bukhari 5090, Muslim 1466'],
  'nikah/pillars': ['al-Bukhari 5136, Muslim 1419', 'at-Tabarani; al-Albani, Sahih al-Jami‘ 7558'],
  'nikah/wali': ['at-Tirmidhi 1101, Abu Dawud 2085, Ibn Majah 1881'], 'nikah/mahr': ['al-Bukhari 5150', 'al-Bukhari 2721, Muslim 1418'],
  'nikah/khutbah': ['Abu Dawud 2118 (Ibn Mas‘ud)', 'Abu Dawud 2130, at-Tirmidhi 1091 — sahih'],
  'nikah/wedding': ['al-Bukhari 5167', 'al-Bukhari 5173, Muslim 1429', 'al-Bukhari 5177, Muslim 1432', 'at-Tirmidhi 1088, an-Nasa’i 3369, Ibn Majah 1896'],
  'nikah/forbidden': [],
}
const lessonCache = {}
const lesson = async (slug) => (lessonCache[slug] ||= (await import(`../../src/data/lessons/${slug}.js`)).default)

describe('bələdçilər — dərs istinadları', () => {
  const guides = () => [
    ['newborn', Newborn.NEWBORN_PHASES, NEWBORN_STEP_IDS, true],
    ['loved', Loved.LOVED_PHASES, LOVED_STEP_IDS, false],
    ['nikah', Nikah.NIKAH_PHASES, NIKAH_STEP_IDS, false],
  ]
  it('addım id-ləri yaddaş açarları ilə eynidir', () => {
    for (const [, phases, ids, skipInfo] of guides()) {
      const list = phases.flatMap((p) => p.steps).filter((s) => !skipInfo || s.check !== false).map((s) => s.id)
      expect(list).toEqual(ids)
    }
    expect(Nikah.NIKAH_QUESTIONS.map((q) => q.id)).toEqual(NIKAH_QUESTION_IDS)
  })
  it('hər blok mövcuddur, növü icazəlidir, hədis/dua mənbəlidir; mənbələr gözlənilən siyahıdadır', async () => {
    const seen = {}
    for (const [, phases] of guides()) {
      for (const s of phases.flatMap((p) => p.steps)) {
        for (const e of s.ex || []) {
          const L = await lesson(e.s)
          const sec = L.sections.find((x) => x.id === e.sec)
          expect(sec, `${e.s}#${e.sec}`).toBeTruthy()
          for (const i of e.b) {
            const b = sec.blocks[i]
            expect(b, `${e.s}#${e.sec}[${i}]`).toBeTruthy()
            expect(ALLOWED.has(b.t), `${e.s}#${e.sec}[${i}] ${b.t}`).toBe(true)
            const k = `${e.s}/${e.sec}`
            seen[k] ||= []
            if (b.t === 'hadith' || b.t === 'dua') {
              for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(b.src?.[l], `${k}[${i}] src.${l}`).toBeTruthy()
              seen[k].push(b.src.en)
            }
          }
        }
      }
    }
    for (const k of Object.keys(seen)) expect(seen[k], k).toEqual(EXPECT_SOURCES[k])
    expect(Object.keys(seen).sort()).toEqual(Object.keys(EXPECT_SOURCES).sort())
  })
  it('qulağa azan: yalnız dərsin "zəif/uydurma" qeydi göstərilir, işarələnən addım deyil', async () => {
    const step = Newborn.NEWBORN_PHASES[0].steps.find((s) => s.id === 'adhan')
    expect(step.check).toBe(false)
    const L = await lesson('aqiqah')
    const b = L.sections.find((x) => x.id === 'customs').blocks[step.ex[0].b[0]]
    expect(b.t).toBe('note')
    expect(b.text.en).toMatch(/weak or fabricated/)
  })
  it('nikah sualları mövcud dərs bölmələrinə istinad edir', async () => {
    const L = await lesson('nikah')
    for (const q of Nikah.NIKAH_QUESTIONS) expect(L.sections.some((s) => s.id === q.sec), q.sec).toBe(true)
  })
  it('Hisnul-Müslim fəsilləri mövcuddur və mövzusu uyğundur (5 dil)', () => {
    const want = { 48: /birth of a child/, 49: /protection for children/, 54: /calamity/, 58: /condolence/, 80: /newly married/, 81: /newly married/ }
    const used = new Set([Newborn.NEWBORN_PHASES, Loved.LOVED_PHASES, Nikah.NIKAH_PHASES].flatMap((ph) => ph.flatMap((p) => p.steps.flatMap((s) => s.hisn || []))))
    expect([...used].sort((a, b) => a - b)).toEqual(Object.keys(want).map(Number))
    for (const lang of ['az', 'en', 'ru', 'ar', 'tr']) {
      const d = JSON.parse(fs.readFileSync(`public/data/hisn/${lang}.json`, 'utf8'))
      for (const id of used) {
        const c = d.chapters.find((x) => x.id === id)
        expect(c, `${lang} ${id}`).toBeTruthy()
        expect(c.items.length).toBeGreaterThan(0)
        for (const it of c.items) expect(it.src, `${lang} ${id}`).toBeTruthy()
        if (lang === 'en') expect(c.title).toMatch(want[id])
      }
    }
  })
  it('localizeSource Hisn mənbəsini korlamır (en)', () => {
    expect(localizeSource('al-Bukhari 2/80, Muslim 2/636', 'en')).toMatch(/Bukhari 2\/80, Muslim 2\/636/)
    expect(localizeSource('Muslim 2/632', 'en')).toBe('Muslim 2/632')
  })
})

describe('sinxronizasiya və ehtiyat nüsxə', () => {
  it('newborn_plan_v1: profilə aid, sinxronlanır; vəfat və nikah qeydləri yalnız bu cihazda', () => {
    expect(isProfileScoped(NEWBORN_KEY)).toBe(true)
    expect(isBackupKey(NEWBORN_KEY)).toBe(true)
    expect(isBackupKey(LOVED_KEY)).toBe(false)
    expect(isBackupKey(NIKAH_KEY)).toBe(false)
    expect(isProfileScoped(LOVED_KEY)).toBe(false)
    expect(isProfileScoped(NIKAH_KEY)).toBe(false)
  })
  it('birləşdirici: addım üzrə 3 tərəfli, ən erkən gün; doğum günü — dəyişən tərəf', () => {
    const m = MERGERS[NEWBORN_KEY]
    const base = J({ v: 1, b: '2026-11-20', d: { tahnik: '2026-11-20' } })
    const local = J({ v: 1, b: '2026-11-20', d: { tahnik: '2026-11-20', name: '2026-11-22' } })
    const remote = J({ v: 1, b: '2026-11-19', n: true, d: {} }) // tahnik götürülüb, tarix dəyişib
    expect(JSON.parse(m(local, remote, base))).toEqual({ v: 1, b: '2026-11-19', n: true, d: { name: '2026-11-22' } })
    // bazasız: birlik, eyni addım — ən erkən gün
    const a = J({ v: 1, d: { aqiqah: '2026-11-27' } }), b = J({ v: 1, d: { aqiqah: '2026-11-26', shaving: '2026-11-26' } })
    expect(JSON.parse(m(a, b, undefined)).d).toEqual({ aqiqah: '2026-11-26', shaving: '2026-11-26' })
    // hamısı silinib → açar silinir
    expect(m(J({ v: 1, d: {} }), J({ v: 1, d: {} }), base)).toBeUndefined()
  })
})

describe('marşrutlar və SEO', () => {
  it('üç səhifə routes.js və meta.js-də (5 dil, başlıq ≤ 60)', () => {
    for (const [key, path] of [['newborn', 'newborn-sunnah'], ['bereavement', 'when-a-loved-one-dies'], ['nikahprep', 'nikah-preparation']]) {
      expect(PAGES.find((p) => p.key === key)?.path).toBe(path)
      for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
        expect(META[key][l].t.length, `${key} ${l}`).toBeLessThanOrEqual(60)
        expect(META[key][l].d.length, `${key} ${l}`).toBeGreaterThan(100)
        expect(META[key][l].d.length, `${key} ${l}`).toBeLessThanOrEqual(170)
      }
    }
  })
})

describe('SSR — prerender = ilk render', () => {
  const render = (Page, url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
  const pages = () => [
    ['newborn-sunnah', Newborn.default, 'Newborn Sunnah plan'],
    ['when-a-loved-one-dies', Loved.default, 'When a loved one passes away: a family guide'],
    ['nikah-preparation', Nikah.default, 'Preparing for nikah'],
  ]
  it('5 dildə render olunur, ingiliscə başlıq düzgündür, ərəbcə də işləyir', () => {
    for (const [path, Page, enTitle] of pages()) {
      for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
        const html = render(Page, `${l}/${path}`)
        expect(html).toContain('<h1')
        expect(html).not.toContain('role="alert"')
        if (l === '/en') expect(html).toContain(enTitle)
      }
    }
  })
  it('ilk render yaddaşdakı şəxsi məlumatdan asılı deyil', () => {
    for (const [path, Page] of pages()) {
      const empty = render(Page, `/en/${path}`)
      globalThis.localStorage = store({
        [NEWBORN_KEY]: J({ v: 1, b: '2026-11-20', d: { tahnik: '2026-11-20' } }),
        [LOVED_KEY]: J({ v: 1, d: { ghusl: '2026-11-20' } }),
        [NIKAH_KEY]: J({ v: 1, d: { mahr: '2026-11-20' }, q: { mahr: 'gold' }, w: { note: 'hall' } }),
      })
      expect(render(Page, `/en/${path}`), path).toBe(empty)
      delete globalThis.localStorage
    }
  })
})
