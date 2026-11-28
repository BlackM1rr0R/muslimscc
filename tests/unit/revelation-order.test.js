// Nazil olma sırası (/quran-revelation-order): saf hesab (sıra, say, zaman xətti, FLIP), mətnlər, marşrut, SSR.
import { describe, it, expect, beforeAll } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  REV_SURAHS, MUSHAF_SEQ, REVELATION_SEQ, sequenceFor, placeCounts, timelineSegments, hijraPosition, positionPct, flipDeltas, localName,
} from '../../src/components/quran/revelation/revelationOrder.js'
import { REV_T } from '../../src/components/quran/revelation/revelationText.js'
import { getSurahLocal } from '../../src/data/surahNamesAz.js'
import { PAGES, pathFor, parsePath } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'
import { NAV_ITEMS } from '../../src/data/navigation.js'
import { QURAN_GUIDE } from '../../src/data/guides/QuranPage.js'
import { staticBodyFor } from '../../scripts/seo-body.mjs'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']

describe('nazil olma sırası — məlumat', () => {
  it('114 surə, sıra 1…114 təkrarsız', () => {
    expect(REV_SURAHS).toHaveLength(114)
    expect(new Set(REV_SURAHS.map(s => s.order)).size).toBe(114)
    expect(Math.min(...REV_SURAHS.map(s => s.order))).toBe(1)
    expect(Math.max(...REV_SURAHS.map(s => s.order))).toBe(114)
    expect(REV_SURAHS.reduce((a, s) => a + s.ayahs, 0)).toBe(6236)
  })
  it('mushaf sırası 1…114; nazil olma sırası Ələq (96) ilə başlayır, Nəsr (110) ilə bitir', () => {
    expect(MUSHAF_SEQ[0]).toBe(1)
    expect(MUSHAF_SEQ[113]).toBe(114)
    expect(REVELATION_SEQ[0]).toBe(96)
    expect(REVELATION_SEQ[1]).toBe(68)
    expect(REVELATION_SEQ[113]).toBe(110)
    expect([...REVELATION_SEQ].sort((a, b) => a - b)).toEqual(MUSHAF_SEQ)
    expect(sequenceFor('revelation')).toBe(REVELATION_SEQ)
    expect(sequenceFor('mushaf')).toBe(MUSHAF_SEQ)
    // indeks = sıra − 1
    REVELATION_SEQ.forEach((n, i) => expect(REV_SURAHS[n - 1].order).toBe(i + 1))
  })
  it('Məkki / Mədəni sayı məlumatdan: 86 / 28', () => {
    expect(placeCounts()).toEqual({ meccan: 86, medinan: 28 })
    expect(REV_SURAHS[1].medinan).toBe(true)   // Bəqərə
    expect(REV_SURAHS[95].medinan).toBe(false) // Ələq
  })
  it('zaman xətti: Məkkə 1–86, Mədinə 87–114; hicrət — 87-ci sıra', () => {
    expect(timelineSegments()).toEqual([{ medinan: false, from: 1, to: 86 }, { medinan: true, from: 87, to: 114 }])
    expect(hijraPosition()).toBe(87)
    expect(REVELATION_SEQ[86]).toBe(2)          // hicrətdən sonra ilk — Bəqərə
    // qarışıq ardıcıllıq da düzgün hissələrə bölünür
    expect(timelineSegments([1, 2, 6, 3])).toEqual([
      { medinan: false, from: 1, to: 1 }, { medinan: true, from: 2, to: 2 }, { medinan: false, from: 3, to: 3 }, { medinan: true, from: 4, to: 4 }])
    expect(hijraPosition([1, 6, 7])).toBe(null)
    expect(positionPct(1)).toBeCloseTo(0.4386, 3)
    expect(positionPct(114)).toBeCloseTo(99.56, 2)
  })
  it('FLIP: yalnız yeri dəyişən kartlar, köhnə − yeni', () => {
    const first = new Map([[1, { x: 0, y: 0 }], [2, { x: 100, y: 0 }], [3, { x: 200, y: 0 }]])
    const last = new Map([[1, { x: 200, y: 0 }], [2, { x: 100, y: 0 }], [3, { x: 0, y: 120.04 }], [4, { x: 5, y: 5 }]])
    expect(flipDeltas(first, last)).toEqual([{ n: 1, dx: -200, dy: 0 }, { n: 3, dx: 200, dy: -120 }])
  })
  it('yerli ad: az/ru/tr — surahNamesAz, en — latın, ar — boş (ərəb adı ayrıca)', () => {
    expect(localName(96, 'az', getSurahLocal)).toBe(getSurahLocal(96, 'az').name)
    expect(localName(96, 'en', getSurahLocal)).toBe(REV_SURAHS[95].latin)
    expect(localName(96, 'ar', getSurahLocal)).toBe('')
    expect(REV_SURAHS[95].ar).toBe('العلق')
  })
})

describe('mətnlər', () => {
  it('5 dildə eyni açarlar; say ifadələri bütöv cümlədir', () => {
    const keys = Object.keys(REV_T.az).sort()
    for (const l of LANGS) expect(Object.keys(REV_T[l]).sort(), l).toEqual(keys)
    expect(REV_T.en.nMeccan(86)).toBe('86 Meccan surahs')
    expect(REV_T.en.nMedinan(1)).toBe('1 Medinan surah')
    expect(REV_T.ru.nMeccan(86)).toBe('86 мекканских сур')
    expect(REV_T.ru.nMedinan(28)).toBe('28 мединских сур')
    expect(REV_T.ru.nMedinan(22)).toBe('22 мединские суры')
    expect(REV_T.ru.nMeccan(21)).toBe('21 мекканская сура')
    expect(REV_T.ar.nMeccan(86)).toBe('86 سورة مكية')
    expect(REV_T.ar.nMedinan(5)).toBe('5 سور مدنية')
    expect(REV_T.az.source).toBe('Mənbə: Quran.com API (revelation_order) — Misir/Əzhər nəşrinin cədvəli; alimlərin ictihadıdır, qəti deyil.')
  })
})

describe('/quran-revelation-order — marşrut, meta, menyu, statik blok, SSR', () => {
  beforeAll(() => { globalThis.React = React })
  it('indekslənən marşrut, 5 dildə meta, menyuda və Quran səhifəsinin keçidlərində', () => {
    const page = PAGES.find(p => p.key === 'revelationorder')
    expect(page).toBeTruthy()
    expect(page.noindex).toBeFalsy()
    expect(pathFor('revelationorder', 'az')).toBe('/quran-revelation-order')
    expect(pathFor('revelationorder', 'en')).toBe('/en/quran-revelation-order')
    expect(parsePath('/ar/quran-revelation-order')).toMatchObject({ lang: 'ar', key: 'revelationorder', known: true })
    for (const l of LANGS) { expect(META.revelationorder[l].t).toBeTruthy(); expect(META.revelationorder[l].d.length).toBeGreaterThan(100) }
    expect(NAV_ITEMS.some(i => i.key === 'revelationorder')).toBe(true)
    expect(QURAN_GUIDE.related.items.some(i => i.key === 'revelationorder')).toBe(true)
  })
  it('statik blok: 114 surə linki nazil olma sırası ilə, mənbə sətri', () => {
    for (const l of LANGS) {
      const html = staticBodyFor('revelationorder', l)
      expect(html, l).toContain('<h1>')
      expect((html.match(/<li><a href="[^"]*\/quran\/\d+-/g) || []).length, l).toBe(114)
      expect(html).toContain('<ol start="87">')
      expect(html).toContain('revelation_order')
    }
    const en = staticBodyFor('revelationorder', 'en')
    expect(en.indexOf(pathFor('quran', 'en', 96))).toBeLessThan(en.indexOf(pathFor('quran', 'en', 1)))
  })
  it('5 dildə render olunur; ilk render — mushaf sırası, saylar 86/28', async () => {
    const origError = console.error
    console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
    const { LangProvider } = await import('../../src/contexts/LangContext.jsx')
    const Page = (await import('../../src/pages/RevelationOrderPage.jsx')).default
    for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
      const html = renderToString(h(MemoryRouter, { initialEntries: [`${l}/quran-revelation-order`] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
      expect(html).toContain('<h1')
      const tiles = [...html.matchAll(/data-testid="rvo-tile"[^>]*/g)]
      expect(tiles).toHaveLength(114)
      expect(html.indexOf('data-n="1"')).toBeLessThan(html.indexOf('data-n="96"'))
      expect((html.match(/data-place="medinan"/g) || []).length).toBe(28)
      expect(html).toContain('data-mode="mushaf"')
    }
    console.error = origError
  })
})
