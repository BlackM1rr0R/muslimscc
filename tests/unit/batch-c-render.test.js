// C dəstəsi: üç səhifə serverdə (prerender kimi) xətasız render olunur və ilk render
// localStorage-dan asılı deyil (hidratasiya uyğunsuzluğu olmasın): yaddaşda məlumat olsa da
// HTML eynidir. 5 dil + ərəbcə.
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

// vitest konfiqində React plagini yoxdur — JSX klassik rejimdə React.createElement-ə çevrilir
globalThis.React = React
// react-router MemoryRouter serverdə useLayoutEffect xəbərdarlığı yazır — səhifələrimizə aid deyil
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
let LangProvider, QuranMeaningPage, NewMuslimPathPage, JariyahJournalPage
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  QuranMeaningPage = (await import('../../src/pages/QuranMeaningPage.jsx')).default
  NewMuslimPathPage = (await import('../../src/pages/NewMuslimPathPage.jsx')).default
  JariyahJournalPage = (await import('../../src/pages/JariyahJournalPage.jsx')).default
})

const render = (Page, url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
const fakeStorage = (init) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}
afterEach(() => { delete globalThis.localStorage })

describe('C səhifələri — SSR', () => {
  const pages = [
    ['quran-meaning', () => QuranMeaningPage, 'Search the Quran by meaning'],
    ['new-muslim', () => NewMuslimPathPage, 'New Muslim path — the first 40 days'],
    ['sadaqah-jariyah', () => JariyahJournalPage, 'Sadaqah jariyah journal'],
  ]
  for (const [path, get, enTitle] of pages) {
    it(`${path}: 5 dildə render olunur, ingiliscə başlıq düzgündür`, () => {
      for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
        const html = render(get(), `${l}/${path}`)
        expect(html).toContain('<h1')
        if (l === '/en') expect(html).toContain(enTitle)
      }
    })
    it(`${path}: ilk render yaddaşdakı şəxsi məlumatdan asılı deyil`, () => {
      const empty = render(get(), `/en/${path}`)
      globalThis.localStorage = fakeStorage({
        new_muslim_path_v1: JSON.stringify({ v: 1, d: { shahada: '2026-11-01' } }),
        sadaqah_jariyah_v1: JSON.stringify({ v: 1, l: [{ id: 'jabc123', k: 'tree', d: '2026-11-01', on: 'X', u: 1 }] }),
      })
      expect(render(get(), `/en/${path}`)).toBe(empty)
    })
  }
})
