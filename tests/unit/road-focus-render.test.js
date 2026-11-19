// /on-the-road və /focus serverdə (prerender kimi) xətasız render olunur, ilk render
// yaddaşdakı şəxsi məlumatdan asılı deyil (hidratasiya uyğunsuzluğu olmasın). 5 dil + ərəbcə.
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
let LangProvider, OnTheRoadPage, FocusPage
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  OnTheRoadPage = (await import('../../src/pages/OnTheRoadPage.jsx')).default
  FocusPage = (await import('../../src/pages/FocusPage.jsx')).default
})

const render = (Page, url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
const fakeStorage = (init) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}
afterEach(() => { delete globalThis.localStorage })

describe('Yolda rejimi və diqqət seansı — SSR', () => {
  const pages = [
    ['on-the-road', () => OnTheRoadPage, 'On the road', 'Don’t use it while driving'],
    ['focus', () => FocusPage, 'Focus session with the Quran', 'There are no streaks, points or comparisons.'],
  ]
  for (const [path, get, enTitle, enNote] of pages) {
    it(`${path}: 5 dildə render olunur, ingiliscə başlıq və qeyd`, () => {
      for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
        const html = render(get(), `${l}/${path}`)
        expect(html).toContain('<h1')
        if (l === '/en') {
          expect(html).toContain(enTitle)
          expect(html).toContain(enNote)
        }
      }
    })
    it(`${path}: ilk render yaddaşdakı şəxsi məlumatdan asılı deyil`, () => {
      const empty = render(get(), `/en/${path}`)
      globalThis.localStorage = fakeStorage({
        road_mode_v1: JSON.stringify({ remind: 5, speak: true, light: true, s: 36, a: 12, d: 2, c: 17 }),
        focus_prefs_v1: JSON.stringify({ f: 40, b: 10, m: 'surah', s: 2, p: 255, snd: false }),
        focus_done_v1: JSON.stringify({ '2026-11-19': 3 }),
        quran_bookmark: JSON.stringify({ surah: 18, ayah: 3 }),
      })
      expect(render(get(), `/en/${path}`)).toBe(empty)
    })
  }
})
