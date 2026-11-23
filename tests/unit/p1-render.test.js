// P1: borc dəftəri, heyz/nifas təqvimi, sadə rejim və şəri ölçülər serverdə (prerender kimi) xətasız
// render olunur və ilk render yaddaşdakı şəxsi məlumatdan asılı deyil (hidratasiya uyğunsuzluğu olmasın). 5 dil.
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
let LangProvider, DebtLedgerPage, HaidCalendarPage, SimpleModePage, ShariaUnitsPage
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  DebtLedgerPage = (await import('../../src/pages/DebtLedgerPage.jsx')).default
  HaidCalendarPage = (await import('../../src/pages/HaidCalendarPage.jsx')).default
  SimpleModePage = (await import('../../src/pages/SimpleModePage.jsx')).default
  ShariaUnitsPage = (await import('../../src/pages/ShariaUnitsPage.jsx')).default
})

const render = (Page, url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
const fakeStorage = (init) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}
afterEach(() => { delete globalThis.localStorage })

describe('P1 səhifələri — SSR', () => {
  const pages = [
    ['debt-ledger', () => DebtLedgerPage, 'Debt ledger'],
    // Neytral başlıq: mount-dan əvvəl həmişə "Private calendar"
    ['private-calendar', () => HaidCalendarPage, 'Private calendar'],
    ['simple', () => SimpleModePage, 'Simple mode'],
    ['sharia-units', () => ShariaUnitsPage, 'Sharia units converter'],
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
        debt_ledger_v1: JSON.stringify({ v: 1, l: [{ id: 'dabc123', k: 'owe', p: 'Ali', a: 50, cu: 'AZN', d: '2026-11-01', du: '2026-11-02', rm: true, r: [], u: 1 }] }),
        haid_log_v1: JSON.stringify({ v: 1, l: [{ id: 'habc123', k: 'hayd', s: '2026-11-01', e: '2026-11-05', u: 1 }], p: { n: false, t: 1 } }),
        simple_mode_v1: JSON.stringify({ home: true, xl: true, s: 18, a: 10, d: 1, c: 7 }),
        quran_bookmark: JSON.stringify({ surah: 36, ayah: 3 }),
      })
      expect(render(get(), `/en/${path}`)).toBe(empty)
    })
  }
  it('heyz/nifas səhifəsi hökm vermir: məzhəb qeydi və Müslim 335 mənbəsi var', () => {
    const html = render(HaidCalendarPage, '/en/private-calendar')
    expect(html).toContain('differ between the schools of fiqh')
    expect(html).toContain('Muslim 335')
    expect(html).toContain('/en/glossary/istihadah')
    expect(html).not.toMatch(/maximum|minimum/i)
  })
  it('borc dəftəri: 2:282 ayəsinə Quran keçidi, ayə mətni səhifəyə yazılmayıb', () => {
    const html = render(DebtLedgerPage, '/en/debt-ledger')
    expect(html).toMatch(/href="\/en\/quran\/2-[a-z-]+\?a=282"/)
    expect(html).toContain('2:282')
  })
})
