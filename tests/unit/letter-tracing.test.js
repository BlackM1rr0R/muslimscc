// "Hərfləri barmaqla yaz" (components/trace/TracePractice) — mövqe formaları, səs, örtük qiyməti;
// /share səhifəsi serverdə (prerender kimi) render olunur və ilk render ünvandan/yaddaşdan asılı deyil.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { existsSync } from 'node:fs'
import { LETTERS } from '../../src/data/arabicCourse.js'
import { evaluate, dilate, isComplete, THRESHOLDS } from '../../src/utils/traceScore.js'

globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
let LangProvider, TracePractice, ShareTargetPage
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  TracePractice = (await import('../../src/components/trace/TracePractice.jsx')).default
  ShareTargetPage = (await import('../../src/pages/ShareTargetPage.jsx')).default
})
afterEach(() => { delete globalThis.localStorage })

const TATWEEL = 'ـ'

describe('hərflər və mövqe formaları', () => {
  it('28 hərf, hər birinin 4 forması; bitişməyənlərin "əvvəldə" forması təkdir', () => {
    expect(LETTERS).toHaveLength(28)
    for (const l of LETTERS) {
      for (const f of ['isolated', 'initial', 'medial', 'final']) expect(l.forms[f], `${l.id}.${f}`).toContain(l.ch)
      expect(l.forms.isolated).toBe(l.ch)
      expect(l.forms.final.startsWith(TATWEEL)).toBe(true)
      if (!l.joins) expect(l.forms.initial).toBe(l.ch)
      else expect(l.forms.medial).toBe(TATWEEL + l.ch + TATWEEL)
      expect(l.tl, `${l.id}: transliterasiya`).toBeTruthy()
    }
  })
  it('səs faylı göstərilən hər hərfin faylı var (public/audio/arabic)', () => {
    for (const l of LETTERS.filter((x) => x.audio)) {
      expect(existsSync(new URL(`../../public/audio/arabic/${l.audio}.wav`, import.meta.url)), l.id).toBe(true)
    }
  })
})

describe('örtük qiyməti — mövqe forması (hərf + birləşdirici xətt)', () => {
  const W = 24, H = 10
  const rect = (m, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * W + x] = 1; return m }
  // Hərfin "gövdəsi" (x 12–20, y 2–7) + sola uzanan tətvil xətti (x 1–11, y 6–7)
  const glyph = () => { const m = new Uint8Array(W * H); rect(m, 12, 2, 20, 7); rect(m, 1, 6, 11, 7); return m }
  it('yalnız gövdəni yazmaq bitirmir — birləşdirici də örtülməlidir', () => {
    const g = glyph(), near = dilate(g, W, H, 1)
    const body = rect(new Uint8Array(W * H), 12, 2, 20, 7)
    const r1 = evaluate(g, near, body, W, H, 0)
    expect(r1.spill).toBe(0)
    expect(r1.coverage).toBeLessThan(THRESHOLDS.normal.coverage)
    expect(isComplete(r1)).toBe(false)
    const r2 = evaluate(g, near, g, W, H, 0)
    expect(r2.coverage).toBe(1)
    expect(isComplete(r2)).toBe(true)
  })
  it('hərfdən kənar xətt kənara çıxma sayılır', () => {
    const g = glyph(), near = dilate(g, W, H, 1)
    const ink = Uint8Array.from(g)
    rect(ink, 0, 0, 23, 0) // yuxarıda uzun kənar xətt
    const r = evaluate(g, near, ink, W, H, 0)
    expect(r.coverage).toBe(1)
    expect(r.spill).toBeGreaterThan(0)
  })
})

const render = (el, url = '/learn-arabic') => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, el)))

describe('TracePractice — SSR', () => {
  it('böyüklər: mövqe formaları, transliterasiya, səs düyməsi', () => {
    const html = render(h(TracePractice, { lang: 'en' }), '/en/learn-arabic')
    for (const s of ['Isolated', 'Initial', 'Medial', 'Final', 'Listen', 'ʾalif']) expect(html).toContain(s)
    expect(html).toContain('aria-pressed="true"')
  })
  it('uşaq rejimi: forma seçimi yoxdur, səs var', () => {
    const html = render(h(TracePractice, { lang: 'az', kid: true, storageKey: 'kids_trace_v1' }), '/kids')
    expect(html).not.toContain('Əvvəldə')
    expect(html).toContain('Dinlə')
  })
  it('5 dildə render olunur', () => {
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) expect(render(h(TracePractice, { lang: l }))).toContain('trace-practice')
  })
})

describe('/share — SSR', () => {
  const mem = (init) => {
    const m = new Map(Object.entries(init))
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
  }
  it('5 dildə giriş izahı; sorğu və yaddaş ilk renderə təsir etmir', () => {
    for (const [p, title] of [['/share', 'Paylaşılanı aç'], ['/en/share', 'Open what you shared'], ['/ru/share', 'Открыть отправленное'], ['/ar/share', 'افتح ما شاركته'], ['/tr/share', 'Paylaşılanı aç']]) {
      const html = render(h(ShareTargetPage, { setPage: () => {} }), p)
      expect(html).toContain(title)
      expect(html).toContain('share-empty')
      expect(html).not.toContain('role="alert"')
    }
    const plain = render(h(ShareTargetPage, { setPage: () => {} }), '/en/share')
    globalThis.localStorage = mem({ dua_journal: JSON.stringify({ duas: [{ id: 'a', text: 'x' }] }) })
    const withQuery = render(h(ShareTargetPage, { setPage: () => {} }), '/en/share?text=E471')
    expect(withQuery).toBe(plain)
  })
})
