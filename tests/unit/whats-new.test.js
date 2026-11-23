// D dəstəsi: "Yeniliklər" (/whats-new), menyuda "Yeni" nişanı (utils/whatsNewSeen) və "Kəşf et" turu (utils/tour)
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { WHATS_NEW, NEW_DAYS, recentPageKeys, isoDayMs } from '../../src/data/whatsNew.js'
import { WHATS_NEW_TEXT } from '../../src/components/whatsnew/whatsNewText.js'
import { PAGES, INDEXABLE, parsePath, pathFor } from '../../src/seo/routes.js'
import { NAV_ITEMS, navLabel } from '../../src/data/navigation.js'
import { META } from '../../src/seo/meta.js'
import { suggestFeatures, TOUR_KEY } from '../../src/utils/tour.js'
import { markSeen, unseenNewKeys, readSeen, SEEN_KEY } from '../../src/utils/whatsNewSeen.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}
const NOW = Date.UTC(2026, 10, 23, 12) // 2026-11-23
// LangProvider-in useLayoutEffect xəbərdarlığı SSR-də gözləniləndir (p1-render.test.js ilə eyni)
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }

// Icon.jsx JSX-i qlobal React gözləyir (klassik runtime) — dinamik import
let hasIcon
beforeAll(async () => {
  globalThis.React = React
  ;({ hasIcon } = await import('../../src/components/Icon.jsx'))
})

describe('data/whatsNew', () => {
  it('hər sətir: unikal id, ISO tarix, mövcud marşrut, ikon, 5 dildə mətn', () => {
    const keys = new Set(PAGES.map((p) => p.key))
    const ids = new Set()
    for (const e of WHATS_NEW) {
      expect(ids.has(e.id), `təkrar id ${e.id}`).toBe(false)
      ids.add(e.id)
      expect(Number.isFinite(isoDayMs(e.date)), `${e.id}: tarix`).toBe(true)
      expect(keys.has(e.key), `${e.id}: marşrut ${e.key}`).toBe(true)
      expect(hasIcon(e.icon), `${e.id}: ikon ${e.icon}`).toBe(true)
      const tx = WHATS_NEW_TEXT[e.id]
      expect(tx, `${e.id}: mətn yoxdur`).toBeTruthy()
      for (const l of LANGS) {
        expect(String(tx.t[l] || '').trim(), `${e.id}.t.${l}`).not.toBe('')
        expect(String(tx.d[l] || '').trim(), `${e.id}.d.${l}`).not.toBe('')
      }
    }
    // Artıq mətn yoxdur (silinmiş sətrin mətni qalmasın)
    for (const id of Object.keys(WHATS_NEW_TEXT)) expect(ids.has(id), `istifadəsiz mətn ${id}`).toBe(true)
  })

  it('tarix sırası: ən yenisi yuxarıda; 2026-11-10-dan əvvəl yoxdur', () => {
    for (let i = 1; i < WHATS_NEW.length; i++) expect(WHATS_NEW[i - 1].date >= WHATS_NEW[i].date, WHATS_NEW[i].id).toBe(true)
    for (const e of WHATS_NEW) expect(e.date >= '2026-11-10', e.id).toBe(true)
  })

  it('"page: true" sətirləri menyuda olan marşrutlardır (nişan orada görünür)', () => {
    const navKeys = new Set(NAV_ITEMS.map((i) => i.key))
    for (const e of WHATS_NEW.filter((x) => x.page)) expect(navKeys.has(e.key), `${e.key} menyuda yoxdur`).toBe(true)
  })

  it('recentPageKeys: son 30 gün, yalnız yeni səhifələr', () => {
    const k = recentPageKeys(NOW)
    expect(k.has('bedtime')).toBe(true)
    expect(k.has('whatsnew')).toBe(true)
    // Funksiya sətri (mövcud səhifəyə əlavə) nişan vermir
    expect(k.has('qibla')).toBe(false)
    expect(k.has('history')).toBe(false)
    // 30 gündən sonra hamısı düşür
    expect(recentPageKeys(NOW + (NEW_DAYS + 1) * 86400000).size).toBe(0)
    // 2026-11-13 (babynames) 2026-12-13-də artıq yeni deyil, 2026-11-23-ün sətirləri isə hələ yenidir
    const dec13 = recentPageKeys(Date.UTC(2026, 11, 13, 12))
    expect(dec13.has('babynames')).toBe(false)
    expect(dec13.has('bedtime')).toBe(true)
  })
})

describe('marşrut, menyu, SEO', () => {
  it('/whats-new indekslənir, 5 dildə ünvanı var, menyuda bir dəfə, meta 5 dildə', () => {
    expect(INDEXABLE.some((p) => p.key === 'whatsnew')).toBe(true)
    expect(pathFor('whatsnew', 'az')).toBe('/whats-new')
    expect(parsePath('/en/whats-new')).toMatchObject({ lang: 'en', key: 'whatsnew', known: true })
    expect(NAV_ITEMS.filter((i) => i.key === 'whatsnew')).toHaveLength(1)
    expect(navLabel('whatsnew', 'en')).toBe('What’s new')
    for (const l of LANGS) {
      expect(META.whatsnew[l].t.length).toBeLessThanOrEqual(65)
      expect(META.whatsnew[l].d.length).toBeLessThanOrEqual(160)
    }
    expect(hasIcon('whatsnew') && hasIcon('tour')).toBe(true)
  })
})

describe('utils/whatsNewSeen — yalnız bu cihaz', () => {
  afterEach(() => { delete globalThis.window })

  it('açılan yeni səhifə nişandan çıxır; köhnə/funksiya açarı yazılmır', () => {
    const ls = mem()
    const events = []
    globalThis.window = { localStorage: ls, dispatchEvent: (e) => events.push(e.detail) }
    expect(unseenNewKeys(NOW).has('bedtime')).toBe(true)
    expect(markSeen('bedtime', NOW)).toBe(true)
    expect(markSeen('bedtime', NOW)).toBe(false) // ikinci dəfə dəyişiklik yoxdur
    expect(markSeen('qibla', NOW)).toBe(false)   // yeni səhifə deyil
    expect(unseenNewKeys(NOW).has('bedtime')).toBe(false)
    expect(readSeen()).toEqual(new Set(['bedtime']))
    expect(events).toEqual(['bedtime'])
    expect(JSON.parse(ls.getItem(SEEN_KEY))).toEqual(['bedtime'])
  })

  it('pozulmuş yaddaş və bağlı localStorage atmır', () => {
    globalThis.window = { localStorage: mem({ [SEEN_KEY]: '{bad' }), dispatchEvent: () => {} }
    expect(readSeen().size).toBe(0)
    globalThis.window = { get localStorage() { throw new Error('blocked') }, dispatchEvent: () => {} }
    expect(readSeen().size).toBe(0)
    expect(markSeen('bedtime', NOW)).toBe(false)
  })

  it('açarlar profilə aid deyil (cihaz qeydi, sinxronlaşmır)', () => {
    expect(PROFILE_KEYS).not.toContain(SEEN_KEY)
    expect(PROFILE_KEYS).not.toContain(TOUR_KEY)
  })
})

describe('utils/tour — turun sonunda 3 təklif (yalnız yerli siqnallar)', () => {
  const g = (o) => (k) => (k in o ? o[k] : null)
  it('heç nə yoxdur → Quran, namaz vaxtları, zikr', () => {
    expect(suggestFeatures(g({}))).toEqual(['quran', 'prayer', 'dhikr'])
  })
  it('Quran açılıb, şəhər seçilib → yatma/oyanış ardıcıllığı', () => {
    expect(suggestFeatures(g({ quran_stats: '{"sessions":3}', muslim_cc_selected_city: 'Baku' }))).toEqual(['bedtime', 'waking', 'dhikr'])
  })
  it('hər şey var → hesab, sonra ehtiyat təkliflər; həmişə 3, təkrarsız', () => {
    const all = g({ quran_bookmark: '1', muslim_cc_selected_city: 'Baku', sleep_routine_v1: '{"b":{}}', dhikr_count_total: '33', mcc_logged_in: '1' })
    const out = suggestFeatures(all)
    expect(out).toHaveLength(3)
    expect(new Set(out).size).toBe(3)
    expect(out[0]).toBe('whatsnew')
    const anon = suggestFeatures(g({ quran_bookmark: '1', muslim_cc_selected_city: 'Baku', sleep_routine_v1: '{"b":{}}', dhikr_count_total: '33' }))
    expect(anon[0]).toBe('login')
  })
  it('boş JSON dəyəri siqnal sayılmır; bütün təkliflər mövcud marşrutdur', () => {
    expect(suggestFeatures(g({ quran_stats: '{}' }))[0]).toBe('quran')
    const keys = new Set(PAGES.map((p) => p.key))
    for (const k of suggestFeatures(g({ quran_stats: '1', muslim_cc_custom_city: '{"lat":1}', sleep_routine_v1: '1', dhikr_count_total: '1', mcc_logged_in: '1' }), 5)) expect(keys.has(k), k).toBe(true)
  })
})

describe('tur mətnləri və SSR', () => {
  let LangProvider, WhatsNewPage, TOUR_STEPS, TOUR_TEXT, TourButton
  beforeAll(async () => {
    ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
    WhatsNewPage = (await import('../../src/pages/WhatsNewPage.jsx')).default
    ;({ TOUR_STEPS, TOUR_TEXT } = await import('../../src/components/tour/DiscoverTour.jsx'))
    TourButton = (await import('../../src/components/tour/TourButton.jsx')).default
  })

  it('hər addımın başlığı və mətni 5 dildədir; ara addımların hədəf seçicisi var', () => {
    expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(8)
    for (const st of TOUR_STEPS) {
      for (const l of LANGS) {
        expect(String(TOUR_TEXT[l][st.id]?.t || ''), `${st.id}.t.${l}`).not.toBe('')
        expect(String(TOUR_TEXT[l][st.id]?.d || ''), `${st.id}.d.${l}`).not.toBe('')
      }
      if (st.id !== 'welcome' && st.id !== 'finish') expect(st.targets.length, st.id).toBeGreaterThan(0)
      expect(hasIcon(st.icon), st.icon).toBe(true)
    }
  })

  const render = (node, url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, node)))

  it('/whats-new serverdə (prerender) xətasız, bütün sətirlərlə və "Yeni" nişanı OLMADAN render olunur', () => {
    for (const [url, title] of [['/whats-new', 'Yeniliklər'], ['/en/whats-new', 'What’s new'], ['/ru/whats-new', 'Что нового'], ['/ar/whats-new', 'ما الجديد'], ['/tr/whats-new', 'Yenilikler']]) {
      const html = render(h(WhatsNewPage, { setPage: () => {} }), url)
      expect(html).toContain(title)
      expect(html).not.toContain('wn-item__new')
      const n = (html.match(/data-testid="wn-item-/g) || []).length
      expect(n, url).toBe(WHATS_NEW.length)
    }
    const en = render(h(WhatsNewPage, { setPage: () => {} }), '/en/whats-new')
    expect(en).toContain('href="/en/bedtime-sunnah"')
    expect(en).toMatch(/datetime="2026-11-23"/i)
  })

  it('TourButton serverdə render olunur', () => {
    expect(render(h(TourButton), '/en/')).toContain('What can I do here?')
  })
})
