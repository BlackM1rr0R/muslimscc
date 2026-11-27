// Siyər (/seerah): məlumatın bütövlüyü (src/data/seerah.js), il formatı, xəritə həndəsəsi, SSR render.
// Hədis nömrələri yalnız aşağıdakı YOXLANMIŞ siyahıdan ola bilər — yeni nömrə əlavə edən
// əvvəlcə onu hadith-api mətni ilə yoxlamalı və bura yazmalıdır (sayt qaydası: nömrə təxmin edilmir).
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { SEERAH_EVENTS, SEERAH_PLACES, SEERAH_BY_ID, parseSeerahSource, periodOf } from '../../src/data/seerah.js'
import { SEERAH_T, yearText, calligraphicYear, arDigits } from '../../src/components/seerah/seerahText.js'
import { projector, MAIN_BOX, MAIN_W, INSETS, EDGE_AT, HIJRA_ROUTE } from '../../src/components/seerah/seerahGeo.js'
import { PAGES, pathFor } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'
import { NAV_ITEMS } from '../../src/data/navigation.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']

// fawazahmed0/hadith-api (eng-bukhari / eng-muslim, Muslim — Əbdülbaqi nömrəsi) ilə mətn-mətn yoxlanılıb, 2026-11-27
const VERIFIED_HADITH = new Set([
  'Buxari 3', 'Buxari 7', 'Buxari 18', 'Buxari 40', 'Buxari 45', 'Buxari 428', 'Buxari 1590', 'Buxari 2048', 'Buxari 2049',
  'Buxari 2731', 'Buxari 2834', 'Buxari 2864', 'Buxari 3039', 'Buxari 3207', 'Buxari 3231', 'Buxari 3536', 'Buxari 3653',
  'Buxari 3668', 'Buxari 3876', 'Buxari 3883', 'Buxari 3884', 'Buxari 3892', 'Buxari 3896', 'Buxari 3902', 'Buxari 3905',
  'Buxari 3906', 'Buxari 3957', 'Buxari 4101', 'Buxari 4150', 'Buxari 4154', 'Buxari 4197', 'Buxari 4210', 'Buxari 4251',
  'Buxari 4252', 'Buxari 4276', 'Buxari 4287', 'Buxari 4315', 'Buxari 4325', 'Buxari 4404', 'Buxari 4418', 'Buxari 4450',
  'Buxari 4486', 'Buxari 4770', 'Buxari 5807',
  'Muslim 160', 'Muslim 162', 'Muslim 208', 'Muslim 525', 'Muslim 1162', 'Muslim 1218', 'Muslim 1763', 'Muslim 1776',
  'Muslim 1795', 'Muslim 2381', 'Muslim 2406', 'Muslim 2769',
])

// Surələrin ayə sayı — saytın öz Quran məlumatı (seo-data/quran/meta.json)
const SURAH_AYAHS = (() => {
  try { return Object.fromEntries(JSON.parse(fs.readFileSync('seo-data/quran/meta.json', 'utf8')).map(s => [s.n, s.ayahs])) } catch { return null }
})()

describe('data/seerah — bütövlük', () => {
  it('25–35 hadisə, unikal id', () => {
    expect(SEERAH_EVENTS.length).toBeGreaterThanOrEqual(25)
    expect(SEERAH_EVENTS.length).toBeLessThanOrEqual(35)
    expect(new Set(SEERAH_EVENTS.map(e => e.id)).size).toBe(SEERAH_EVENTS.length)
    for (const e of SEERAH_EVENTS) expect(e.id, e.id).toMatch(/^[a-z]+$/)
  })

  it('hər hadisədə hicri il, miladi il, 5 dildə başlıq/mətn/uşaq mətni', () => {
    for (const e of SEERAH_EVENTS) {
      expect(Number.isInteger(e.h) && e.h !== 0, `${e.id}: h`).toBe(true)
      if (e.h2 != null) expect(Number.isInteger(e.h2) && Math.sign(e.h2) === Math.sign(e.h) && e.h2 > e.h, `${e.id}: h2`).toBe(true)
      expect(e.ce >= 560 && e.ce <= 633, `${e.id}: ce`).toBe(true)
      if (e.ce2 != null) expect(e.ce2 > e.ce, `${e.id}: ce2`).toBe(true)
      for (const f of ['title', 'text', 'kids']) {
        for (const l of LANGS) expect(String(e[f]?.[l] || '').trim(), `${e.id}.${f}.${l}`).not.toBe('')
      }
      // Uşaq mətni qısadır
      for (const l of LANGS) expect(e.kids[l].length, `${e.id}.kids.${l}`).toBeLessThan(e.text[l].length)
    }
  })

  it('miladi il ilə artan sıra; hicrətdən əvvəl/sonra dövrü ilə uyğundur', () => {
    for (let i = 1; i < SEERAH_EVENTS.length; i++) expect(SEERAH_EVENTS[i].ce >= SEERAH_EVENTS[i - 1].ce, SEERAH_EVENTS[i].id).toBe(true)
    for (const e of SEERAH_EVENTS) {
      if (periodOf(e) === 'makkah') expect(e.ce <= 622, e.id).toBe(true)
      else expect(e.ce >= 622, e.id).toBe(true)
    }
  })

  it('hər hadisənin ən azı bir mənbəyi var; hədis nömrələri yoxlanmış siyahıdandır; ayə istinadı mövcuddur', () => {
    for (const e of SEERAH_EVENTS) {
      expect(e.src.length, `${e.id}: mənbə`).toBeGreaterThan(0)
      expect(new Set(e.src).size, `${e.id}: təkrar mənbə`).toBe(e.src.length)
      for (const s of e.src) {
        const r = parseSeerahSource(s)
        expect(r, `${e.id}: "${s}"`).toBeTruthy()
        if (r.kind === 'hadith') expect(VERIFIED_HADITH.has(s), `${e.id}: yoxlanmamış hədis nömrəsi ${s}`).toBe(true)
        if (r.kind === 'quran' && SURAH_AYAHS) {
          expect(SURAH_AYAHS[r.s], `${e.id}: surə ${r.s}`).toBeTruthy()
          expect(r.a >= 1 && r.a <= SURAH_AYAHS[r.s], `${e.id}: ayə ${s}`).toBe(true)
          if (r.a2 != null) expect(r.a2 > r.a && r.a2 <= SURAH_AYAHS[r.s], `${e.id}: aralıq ${s}`).toBe(true)
        }
      }
    }
  })

  it('mətndə çəkilən ayə istinadı (s:a) mənbə sətrində də var', () => {
    for (const e of SEERAH_EVENTS) {
      const refs = [...e.text.en.matchAll(/\((\d{1,3}):(\d{1,3})/g)].map(m => `${m[1]}:${m[2]}`)
      const inline = [...e.text.en.matchAll(/(?:^|\s)(\d{1,3}):(\d{1,3})(?=[\s.,)–]|$)/g)].map(m => `${m[1]}:${m[2]}`)
      for (const ref of new Set([...refs, ...inline])) {
        expect(e.src.some(s => s.startsWith(`Quran ${ref}`) || (s.startsWith(`Quran ${ref.split(':')[0]}:`) && (() => {
          const r = parseSeerahSource(s); const a = +ref.split(':')[1]
          return r.a <= a && a <= (r.a2 || r.a)
        })())), `${e.id}: mətndə ${ref} var, mənbədə yox`).toBe(true)
      }
    }
  })

  it('hər yer xəritədə var: əsas çərçivədə, Məkkə/Mədinə çərçivəsində və ya kənar oxu ilə', () => {
    const main = projector(MAIN_BOX, MAIN_W)
    for (const e of SEERAH_EVENTS) {
      for (const pid of [e.place, ...(e.also || [])]) {
        const p = SEERAH_PLACES[pid]
        expect(p, `${e.id}: yer ${pid}`).toBeTruthy()
        for (const l of LANGS) expect(String(p.name[l] || '').trim(), `${pid}.name.${l}`).not.toBe('')
        if (p.edge) { expect(EDGE_AT[pid], `${pid}: kənar oxu`).toBeTruthy(); continue }
        expect(main.inside(...p.at), `${pid}: əsas çərçivədən kənarda`).toBe(true)
        if (p.area) expect(projector(INSETS[p.area].box, INSETS[p.area].w).inside(...p.at), `${pid}: ${p.area} çərçivəsindən kənarda`).toBe(true)
      }
    }
    // Əsas yer kənar ox ola bilməz (hadisənin öz nöqtəsi olmalıdır)
    for (const e of SEERAH_EVENTS) expect(SEERAH_PLACES[e.place].edge, e.id).toBeFalsy()
  })

  it('tələb olunan yerlər və hadisələr var', () => {
    for (const p of ['makkah', 'taif', 'thawr', 'quba', 'madinah', 'badr', 'uhud', 'khandaq', 'khaybar', 'hudaybiyyah', 'tabuk', 'hunayn']) expect(SEERAH_PLACES[p], p).toBeTruthy()
    for (const id of ['birth', 'revelation', 'publiccall', 'taif', 'isra', 'aqabah', 'hijrah', 'mosque', 'qibla', 'badr', 'uhud', 'khandaq', 'hudaybiyyah', 'khaybar', 'conquest', 'hunayn', 'tabuk', 'farewell', 'passing']) expect(SEERAH_BY_ID[id], id).toBeTruthy()
    expect(SEERAH_EVENTS.filter(e => e.hijrah).map(e => e.id)).toEqual(['hijrah'])
  })

  it('Peyğəmbərin adından sonra ﷺ (az, en)', () => {
    for (const e of SEERAH_EVENTS) {
      for (const f of ['title', 'text', 'kids']) {
        // "Peyğəmbər məscidi" / "Prophet’s Mosque" — məscidin adıdır
        for (const m of e[f].az.matchAll(/Peyğəmbər\p{L}*( Muhəmməd)?(?! məscid)/gu)) {
          expect(e[f].az.slice(m.index + m[0].length, m.index + m[0].length + 2), `${e.id}.${f}.az: "${m[0]}"`).toBe(' ﷺ')
        }
        for (const m of e[f].en.matchAll(/Prophet(?!’s Mosque)(’s)?( Muhammad)?/g)) {
          expect(e[f].en.slice(m.index + m[0].length, m.index + m[0].length + 2), `${e.id}.${f}.en: "${m[0]}"`).toBe(' ﷺ')
        }
      }
    }
  })
})

describe('seerahText — il yazıları', () => {
  const ev = (o) => ({ h: 1, ce: 622, ...o })
  it('hicri və hicrətdən əvvəl', () => {
    expect(yearText(ev({ h: 2, ce: 624 }), SEERAH_T.az)).toEqual({ hijri: 'Hicri 2', ce: '624 m.' })
    expect(yearText(ev({ h: -13, ce: 610, approx: true }), SEERAH_T.en)).toEqual({ hijri: '13 years before the Hijrah', ce: 'c. 610 CE' })
    expect(yearText(ev({ h: -1, ce: 621 }), SEERAH_T.en).hijri).toBe('1 year before the Hijrah')
    expect(yearText(ev({ h: -7, h2: -4, ce: 616, ce2: 619 }), SEERAH_T.tr)).toEqual({ hijri: 'Hicretten 7–4 yıl önce', ce: 'M. 616–619' })
    expect(yearText(ev({ h: 6, h2: 7, ce: 628 }), SEERAH_T.az).hijri).toBe('Hicri 6–7')
  })
  it('rus cəmi: год / года / лет', () => {
    expect(SEERAH_T.ru.before(1)).toBe('за 1 год до хиджры')
    expect(SEERAH_T.ru.before(3)).toBe('за 3 года до хиджры')
    expect(SEERAH_T.ru.before(13)).toBe('за 13 лет до хиджры')
    expect(SEERAH_T.ru.before(53)).toBe('за 53 года до хиджры')
    expect(SEERAH_T.ru.nEvents(1)).toBe('1 событие')
    expect(SEERAH_T.ru.nEvents(5)).toBe('5 событий')
  })
  it('ərəbcə: ərəb-hind rəqəmləri, xəttat nişanı', () => {
    expect(arDigits(1446)).toBe('١٤٤٦')
    expect(yearText(ev({ h: 8, ce: 630 }), SEERAH_T.ar)).toEqual({ hijri: '٨ هـ', ce: '٦٣٠ م' })
    expect(calligraphicYear({ h: -13 })).toBe('١٣ ق.هـ')
    expect(calligraphicYear({ h: 2 })).toBe('٢ هـ')
    expect(calligraphicYear({ h: -2, h2: -1 })).toBe('٢–١ ق.هـ')
    expect(SEERAH_T.ar.nEvents(1)).toBe('حدث واحد')
    expect(SEERAH_T.ar.nEvents(2)).toBe('حدثان')
    expect(SEERAH_T.ar.nEvents(5)).toBe('٥ أحداث')
  })
  it('bütün yazılar 5 dildə', () => {
    for (const k of Object.keys(SEERAH_T.en)) for (const l of LANGS) expect(SEERAH_T[l][k], `${l}.${k}`).toBeTruthy()
  })
})

describe('seerahGeo', () => {
  it('hicrət yolu SiraMaps.jsx → HIJRA_ROUTE ilə eynidir', async () => {
    globalThis.React = React
    const m = await import('../../src/components/media/SiraMaps.jsx')
    expect(HIJRA_ROUTE).toEqual(m.HIJRA_ROUTE)
  })
  it('proyeksiya: şimal yuxarıda, şərq sağda; Məkkə/Mədinə nisbi yeri düzgündür', () => {
    const p = projector(MAIN_BOX, MAIN_W)
    const [mx, my] = p.p(...SEERAH_PLACES.makkah.at)
    const [, dy] = p.p(...SEERAH_PLACES.madinah.at)
    const [tx] = p.p(...SEERAH_PLACES.taif.at)
    expect(dy).toBeLessThan(my)       // Mədinə Məkkədən şimalda
    expect(tx).toBeGreaterThan(mx)    // Taif Məkkədən şərqdə
    expect(p.H).toBeGreaterThan(p.W)  // hündür çərçivə
  })
})

describe('/seerah — marşrut, meta, menyu, SSR', () => {
  beforeAll(() => { globalThis.React = React })
  it('indekslənən marşrut, 5 dildə meta, menyuda', () => {
    const page = PAGES.find(p => p.key === 'seerah')
    expect(page).toBeTruthy()
    expect(page.noindex).toBeFalsy()
    expect(pathFor('seerah', 'en')).toBe('/en/seerah')
    for (const l of LANGS) { expect(META.seerah[l].t).toBeTruthy(); expect(META.seerah[l].d.length).toBeGreaterThan(100) }
    expect(NAV_ITEMS.some(i => i.key === 'seerah')).toBe(true)
  })
  it('5 dildə render olunur; ilk render — birinci hadisə aktiv, uşaq rejimi söndürülü', async () => {
    const origError = console.error
    console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
    const { LangProvider } = await import('../../src/contexts/LangContext.jsx')
    const Page = (await import('../../src/pages/SeerahPage.jsx')).default
    for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
      const html = renderToString(h(MemoryRouter, { initialEntries: [`${l}/seerah`] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
      expect(html).toContain('<h1')
      expect((html.match(/data-testid="seerah-event"/g) || []).length).toBe(SEERAH_EVENTS.length)
      expect(html).toContain('id="ev-birth"')
      expect(html).toMatch(/class="srh-ev is-active"[^>]*|id="ev-birth"[^>]*class="srh-ev is-active"/)
      expect(html).toContain('aria-pressed="false"')
      expect(html).not.toMatch(/role="alert"/)
      if (l === '/en') expect(html).toContain('Seerah — the life of the Prophet ﷺ')
    }
    console.error = origError
  })
})
