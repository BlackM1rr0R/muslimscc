// Həftəlik ailə halqası (utils/familyHalaqa, pages/FamilyHalaqaPage):
//   • ISO həftəsi, həftə sürüşməsi, URL parametrləri, deterministik dəst və variant
//   • məzmun hovuzları saytın məlumatına istinad edir: Nəvəvi hədisləri yalnız Buxari/Müslim, dərs bölmələri mövcud
//     və hədis/duaları mənbəlidir, uşaq bölmələri KidsPage-də birbaşa açılır, suallar 5 dildə
//   • yerli qeyd (yalnız bu cihaz — ehtiyat/sinxron yox), SSR (prerender = ilk render), marşrut + meta
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  isoWeek, weeksInYear, weekStart, validWeek, shiftWeek, weekRange, kitFor, readParams, shareUrl,
  sanitizeHalaqa, readHalaqa, setHalaqaDone, setHalaqaVariant, cleanVariant,
  HALAQA_KEY, HALAQA_KEEP, HALAQA_HADITH_NS, HALAQA_LESSONS, HALAQA_KIDS, PROMPT_IDS, PROMPTS_PER_WEEK,
} from '../../src/utils/familyHalaqa.js'
import { NAWAWI_40 } from '../../src/data/nawawi40.js'
import { TADABBUR } from '../../src/data/tadabbur.js'
import { isBackupKey } from '../../src/utils/userBackup.js'
import { isProfileScoped } from '../../src/utils/profileCore.js'
import { PAGES, NOINDEX_KEYS } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'

globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m,
  }
}

let Page, LangProvider
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  Page = await import('../../src/pages/FamilyHalaqaPage.jsx')
})
afterEach(() => { delete globalThis.localStorage })

describe('ISO həftəsi', () => {
  it('məlum tarixlər', () => {
    expect(isoWeek(new Date(2026, 10, 23)).key).toBe('2026-W48')   // bazar ertəsi
    expect(isoWeek(new Date(2026, 10, 29)).key).toBe('2026-W48')   // bazar
    expect(isoWeek(new Date(2021, 0, 3)).key).toBe('2020-W53')
    expect(isoWeek(new Date(2024, 11, 30)).key).toBe('2025-W01')
    expect(isoWeek(new Date(2026, 0, 1)).key).toBe('2026-W01')
    expect(weeksInYear(2020)).toBe(53)
    expect(weeksInYear(2021)).toBe(52)
  })
  it('həftənin başlanğıcı, yoxlama, sürüşmə və günlər', () => {
    expect(new Date(weekStart('2026-W48')).toISOString().slice(0, 10)).toBe('2026-11-23')
    expect(validWeek('2020-W53')).toBe(true)
    expect(validWeek('2021-W53')).toBe(false)
    expect(validWeek('2026-W00')).toBe(false)
    expect(validWeek('2026-48')).toBe(false)
    expect(validWeek('<script>')).toBe(false)
    expect(shiftWeek('2026-W52', 1)).toBe('2026-W53')
    expect(shiftWeek('2026-W53', 1)).toBe('2027-W01')
    expect(shiftWeek('2027-W01', -1)).toBe('2026-W53')
    expect(shiftWeek('bad', 1)).toBe(null)
    expect(weekRange('2026-W48')).toEqual({ from: '2026-11-23', to: '2026-11-29' })
  })
  it('URL parametrləri və paylaşma keçidi', () => {
    expect(readParams('?week=2026-W48&v=3')).toEqual({ week: '2026-W48', v: 3 })
    expect(readParams('?week=2026-W99&v=-1')).toEqual({})
    expect(readParams('?v=abc')).toEqual({})
    expect(shareUrl('https://muslims.cc', '/en/family-halaqa', '2026-W48', 0)).toBe('https://muslims.cc/en/family-halaqa?week=2026-W48')
    expect(shareUrl('https://muslims.cc', '/family-halaqa', '2026-W48', 2)).toBe('https://muslims.cc/family-halaqa?week=2026-W48&v=2')
    expect(cleanVariant('7')).toBe(7)
    expect(cleanVariant(1.5)).toBe(0)
  })
})

describe('dəst — deterministik', () => {
  it('eyni həftə + variant → eyni dəst; variant hər hissəni dəyişir', () => {
    const a = kitFor('2026-W48', 0, TADABBUR.length)
    expect(kitFor('2026-W48', 0, TADABBUR.length)).toEqual(a)
    expect(a.prompts).toHaveLength(PROMPTS_PER_WEEK)
    expect(new Set(a.prompts).size).toBe(PROMPTS_PER_WEEK)
    for (let v = 1; v <= 12; v++) {
      const b = kitFor('2026-W48', v, TADABBUR.length)
      expect(b.ayah, `v${v}`).not.toBe(a.ayah)
      expect(b.hadith, `v${v}`).not.toBe(a.hadith)
      expect(b.lesson, `v${v}`).not.toEqual(a.lesson)
    }
    expect(kitFor('bad')).toBe(null)
  })
  it('ardıcıl həftələr fərqli ayə, hədis və dərs verir; hovuzlar tam əhatə olunur', () => {
    const seenA = new Set(), seenH = new Set(), seenL = new Set()
    let w = '2026-W01', prev = null
    for (let i = 0; i < 61 * 2; i++) {
      const k = kitFor(w, 0, TADABBUR.length)
      if (prev) { expect(k.ayah).not.toBe(prev.ayah); expect(k.hadith).not.toBe(prev.hadith); expect(k.lesson).not.toEqual(prev.lesson) }
      seenA.add(k.ayah); seenH.add(k.hadith); seenL.add(`${k.lesson.s}#${k.lesson.sec}`)
      prev = k
      w = shiftWeek(w, 1)
    }
    expect(seenA.size).toBe(TADABBUR.length)
    expect(seenH.size).toBe(HALAQA_HADITH_NS.length)
    expect(seenL.size).toBe(HALAQA_LESSONS.length)
  })
})

describe('məzmun hovuzları saytın məlumatına istinad edir', () => {
  it('hədislər: Nəvəvinin 40 hədisindən, yalnız Səhih Buxari / Səhih Müslim, dərəcə qeydi olmayanlar', () => {
    for (const n of HALAQA_HADITH_NS) {
      const hd = NAWAWI_40.find((x) => x.n === n)
      expect(hd, `#${n}`).toBeTruthy()
      expect(hd.src.en, `#${n}`).toMatch(/^(al-Bukhari \d+(, Muslim \d+)?|Muslim \d+)( \(with this wording\))?$/)
      expect(hd.grade, `#${n}`).toBeUndefined()
      for (const l of LANGS) expect(hd.src[l], `#${n} ${l}`).toBeTruthy()
    }
    expect(new Set(HALAQA_HADITH_NS).size).toBe(HALAQA_HADITH_NS.length)
  })
  it('ayələr: ərəb mətni, 4 dildə tərcümə və 5 dildə düşüncə sualı', () => {
    for (const a of TADABBUR) {
      expect(a.ar).toBeTruthy()
      for (const l of ['az', 'en', 'ru', 'tr']) expect(a.t[l], `${a.ref} ${l}`).toBeTruthy()
      for (const l of LANGS) expect(a.q[l], `${a.ref} q.${l}`).toBeTruthy()
    }
  })
  it('dərs bölmələri mövcuddur, qısadır, hədis/dua blokları 5 dildə mənbəlidir', async () => {
    const seen = new Set()
    for (const { s, sec } of HALAQA_LESSONS) {
      const L = (await import(`../../src/data/lessons/${s}.js`)).default
      const x = L.sections.find((y) => y.id === sec)
      expect(x, `${s}#${sec}`).toBeTruthy()
      expect(x.blocks.length, `${s}#${sec}`).toBeLessThanOrEqual(6)
      for (const l of LANGS) expect(x.title[l], `${s}#${sec} title.${l}`).toBeTruthy()
      for (const b of x.blocks) if (b.t === 'hadith' || b.t === 'dua') for (const l of LANGS) expect(b.src?.[l], `${s}#${sec} ${l}`).toBeTruthy()
      seen.add(`${s}#${sec}`)
    }
    expect(seen.size).toBe(HALAQA_LESSONS.length)
  })
  it('uşaq fəaliyyətləri KidsPage-də ?section= ilə birbaşa açılır və mətnləri var', () => {
    const src = fs.readFileSync('src/pages/KidsPage.jsx', 'utf8')
    const deep = /const DEEP_SECTIONS = new Set\(\[([^\]]+)\]\)/.exec(src)[1]
    for (const k of HALAQA_KIDS) {
      expect(deep, k).toContain(`'${k}'`)
      expect(src, k).toContain(`key:'${k}'`)
    }
    expect(Object.keys(Page.KIDS).sort()).toEqual([...HALAQA_KIDS].sort())
    for (const k of HALAQA_KIDS) for (const l of LANGS) { expect(Page.KIDS[k].title[l]).toBeTruthy(); expect(Page.KIDS[k].how[l]).toBeTruthy() }
  })
  it('müzakirə sualları 5 dildə, bölmənin adını daşıyır', () => {
    expect(Object.keys(Page.PROMPTS).sort()).toEqual([...PROMPT_IDS].sort())
    for (const id of PROMPT_IDS) for (const l of LANGS) {
      const out = Page.PROMPTS[id][l]('XYZ')
      expect(typeof out).toBe('string')
      expect(out.length).toBeGreaterThan(10)
    }
    expect(Page.PROMPTS.new.en('Gentleness')).toContain('Gentleness')
  })
})

describe('yerli qeyd', () => {
  it('işarə və variant; boş qeyd açarı silir', () => {
    const s = mem()
    setHalaqaDone('2026-W48', true, s, '2026-11-24')
    expect(JSON.parse(s.getItem(HALAQA_KEY))).toEqual({ v: 1, d: { '2026-W48': '2026-11-24' }, s: {} })
    setHalaqaDone('2026-W48', true, s, '2026-11-25')
    expect(readHalaqa(s).d['2026-W48']).toBe('2026-11-24')
    setHalaqaVariant('2026-W48', 3, s)
    expect(readHalaqa(s).s).toEqual({ '2026-W48': 3 })
    setHalaqaDone('bad', true, s)
    setHalaqaDone('2026-W48', false, s)
    setHalaqaVariant('2026-W48', 0, s)
    expect(s.getItem(HALAQA_KEY)).toBe(null)
  })
  it('təmizləmə: səhv həftə/gün/variant atılır, son HALAQA_KEEP həftə qalır', () => {
    expect(sanitizeHalaqa({ d: { '2026-W48': '2026-11-24', '2026-W99': '2026-11-24', '2026-W47': 'x' }, s: { '2026-W48': 2, '2026-W47': -1, x: 1 } }))
      .toEqual({ v: 1, d: { '2026-W48': '2026-11-24' }, s: { '2026-W48': 2 } })
    const d = {}
    let w = '2024-W01'
    for (let i = 0; i < HALAQA_KEEP + 10; i++) { d[w] = '2024-01-01'; w = shiftWeek(w, 1) }
    const out = sanitizeHalaqa({ d })
    expect(Object.keys(out.d)).toHaveLength(HALAQA_KEEP)
    expect(out.d['2024-W01']).toBeUndefined()
    expect(sanitizeHalaqa(null)).toEqual({ v: 1, d: {}, s: {} })
  })
  it('yaddaş bağlıdırsa xəta atmır; ehtiyat/sinxrona düşmür, profilə aid deyil', () => {
    expect(() => setHalaqaDone('2026-W48', true, null)).not.toThrow()
    expect(readHalaqa(null)).toEqual({ v: 1, d: {}, s: {} })
    expect(isBackupKey(HALAQA_KEY)).toBe(false)
    expect(isProfileScoped(HALAQA_KEY)).toBe(false)
  })
})

describe('marşrut, meta və SSR', () => {
  it('routes.js (noindex) və meta.js (5 dil)', () => {
    expect(PAGES.find((p) => p.key === 'halaqa')?.path).toBe('family-halaqa')
    expect(NOINDEX_KEYS.has('halaqa')).toBe(true)
    for (const l of LANGS) {
      expect(META.halaqa[l].t.length).toBeLessThanOrEqual(60)
      expect(META.halaqa[l].d.length).toBeGreaterThan(100)
      expect(META.halaqa[l].d.length).toBeLessThanOrEqual(170)
    }
  })
  const render = (url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page.default, { setPage: () => {} }))))
  it('5 dildə render olunur; dəst klientdədir (prerender-də yalnız giriş); boş role="alert" yoxdur', () => {
    for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
      const html = render(`${l}/family-halaqa`)
      expect(html).toContain('<h1')
      expect(html).toContain('data-testid="hq-loading"')
      expect(html).not.toContain('data-testid="hq-kit"')
      expect(html).not.toContain('role="alert"')
      if (l === '/en') expect(html).toContain('Weekly family halaqa')
    }
  })
  it('ilk render yaddaşdan və URL-dən asılı deyil', () => {
    const empty = render('/en/family-halaqa')
    globalThis.localStorage = mem({ [HALAQA_KEY]: JSON.stringify({ v: 1, d: { '2026-W48': '2026-11-24' }, s: { '2026-W48': 4 } }) })
    expect(render('/en/family-halaqa?week=2026-W10&v=2')).toBe(empty)
  })
})
