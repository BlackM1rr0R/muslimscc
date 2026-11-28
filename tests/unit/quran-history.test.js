// "Quran necə toplandı" (/quran-history): sitatların hərfbəhərf doğruluğu, mənbələr, marşrut/meta, SSR.
// Hədis sitatları — fixtures/bukhari-ara-quran-compilation.json (hadith-api ara-bukhari, hərfbəhərf);
// ayələr — saytın oxuyucu mətni seo-data/quran/quran-uthmani.json. Yeni hədis nömrəsi əlavə edən
// əvvəlcə onu hadith-api mətni ilə yoxlamalı və VERIFIED-ə yazmalıdır (nömrə təxmin edilmir).
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QH_SCENES, QH_BY_ID, QH_CITIES, BUKHARI_SECTION, parseQhSource, bukhariLinks } from '../../src/data/quranCompilation.js'
import { QH_T } from '../../src/components/quranhistory/quranHistoryText.js'
import { project } from '../../src/components/quranhistory/QuranHistoryArt.jsx'
import { QURAN_GUIDE } from '../../src/data/guides/QuranPage.js'
import { BOOK_DATA } from '../../src/data/hadithLibrary.js'
import { PAGES, pathFor } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'
import { NAV_ITEMS } from '../../src/data/navigation.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const HADITH_AR = JSON.parse(fs.readFileSync('tests/unit/fixtures/bukhari-ara-quran-compilation.json', 'utf8'))
const QURAN = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8')).ayahs
// hadith-api ara-bukhari / eng-bukhari ilə mətn-mətn yoxlanılıb, 2026-11-28
const VERIFIED = new Set(['Buxari 3', 'Buxari 3851', 'Buxari 4679', 'Buxari 4953', 'Buxari 4986', 'Buxari 4987'])

describe('data/quranCompilation — mənbələr', () => {
  it('6 mərhələ, tələb olunan sırada, unikal id, 5 dildə başlıq və mətn', () => {
    expect(QH_SCENES.map(s => s.id)).toEqual(['hira', 'revelation', 'yamama', 'suhuf', 'uthman', 'today'])
    for (const s of QH_SCENES) {
      expect(s.id).toMatch(/^[a-z]+$/)
      for (const l of LANGS) {
        expect(String(s.title?.[l] || '').trim(), `${s.id}.title.${l}`).not.toBe('')
        expect(String(s.text?.[l] || '').trim(), `${s.id}.text.${l}`).not.toBe('')
        if (s.when) expect(String(s.when[l] || '').trim(), `${s.id}.when.${l}`).not.toBe('')
      }
    }
  })

  it('hər mərhələnin mənbəyi var; hədis nömrələri yalnız yoxlanmış siyahıdan', () => {
    for (const s of QH_SCENES) {
      expect(s.src.length, s.id).toBeGreaterThan(0)
      for (const src of s.src) {
        const r = parseQhSource(src)
        expect(r, `${s.id}: ${src}`).toBeTruthy()
        if (r.kind === 'bukhari') expect(VERIFIED.has(src), src).toBe(true)
      }
    }
    // Tapşırıqdakı əsas istinadlar
    expect(QH_BY_ID.yamama.src).toContain('Buxari 4986')
    expect(QH_BY_ID.suhuf.src).toContain('Buxari 4986')
    expect(QH_BY_ID.uthman.src).toContain('Buxari 4987')
  })

  it('hədis sitatları və material sözləri hədisin ərəb mətnində hərfbəhərf var', () => {
    let n = 0
    for (const s of QH_SCENES) {
      for (const q of [...(s.quotes || []), ...(s.materials || [])]) {
        const r = parseQhSource(q.src)
        const full = HADITH_AR[String(r.n)]
        expect(full, q.src).toBeTruthy()
        expect(full.includes(q.ar), `${s.id}: ${q.ar}`).toBe(true)
        expect(s.src, `${s.id}: ${q.src} mənbə sətrində`).toContain(q.src)
        n++
      }
    }
    expect(n).toBeGreaterThanOrEqual(10)
  })

  it('ayələr saytın oxuyucu mətni ilə hərfbəhərf eynidir (96:1–5, 15:9)', () => {
    const hira = QH_BY_ID.hira
    expect(hira.ayahs.map(a => a.n)).toEqual([1, 2, 3, 4, 5])
    expect(QURAN[95][0].split(' ')[0]).toMatch(/^﻿?بِسْمِ/u)
    hira.ayahs.forEach((a, i) => {
      // 96:1 — faylda surənin bəsmələsi (4 söz) ayənin əvvəlinə yapışıqdır
      const site = i === 0 ? QURAN[95][0].split(' ').slice(4).join(' ') : QURAN[95][i]
      expect(a.ar).toBe(site)
    })
    const v = QH_BY_ID.today.verse
    expect(v.ar).toBe(QURAN[14][8])
    // Məna — Quran bələdçisindəki eyni (yoxlanmış) tərcümə
    const g = QURAN_GUIDE.about.quotes.find(q => q.ref === '15:9')
    expect(v.text).toEqual(g.text)
  })

  it('hədis kitabxanası bölmələri BOOK_DATA aralıqlarına uyğundur; sunnah.com linkləri', () => {
    for (const [n, sec] of Object.entries(BUKHARI_SECTION)) {
      const row = BOOK_DATA.bukhari.sections.find(r => r[0] === sec)
      expect(row, `bölmə ${sec}`).toBeTruthy()
      expect(+n >= row[2] && +n <= row[3], `${n} ∈ ${sec}`).toBe(true)
    }
    expect(bukhariLinks(4986)).toEqual({ library: '#bukhari/66/4986', sunnah: 'https://sunnah.com/bukhari:4986' })
  })

  it('təxmini tarixlər "təxminən"/"c."/"около" ilə; tarixçilərin rəyi ayrıca deyilir', () => {
    for (const s of QH_SCENES.filter(x => x.when)) {
      expect(s.approx, s.id).toBe(true)
      expect(s.when.az).toMatch(/Təxminən/)
      expect(s.when.en).toMatch(/^c\. /)
    }
    expect(QH_BY_ID.yamama.when.az).toMatch(/tarixçilərə görə/)
    expect(QH_BY_ID.uthman.when.az).toMatch(/tarixçilərə görə/)
    for (const l of LANGS) expect(QH_T[l].citiesNote.length, l).toBeGreaterThan(40)
  })

  it('Peyğəmbərin adından sonra ﷺ (az, en)', () => {
    for (const s of QH_SCENES) {
      expect(s.text.az, s.id).not.toMatch(/Peyğəmbər\p{L}*(?! ?ﷺ)(?=[\s,.])/u)
      expect(s.text.en, s.id).not.toMatch(/Prophet(?! ?ﷺ)/)
    }
  })

  it('xəritə: şəhərlər qutunun içində, şimal yuxarıda, şərq sağda', () => {
    const P = Object.fromEntries(Object.entries(QH_CITIES).map(([k, c]) => [k, project(c.at)]))
    for (const [k, [x, y]] of Object.entries(P)) {
      expect(x > 10 && x < 390 && y > 10 && y < 390, k).toBe(true)
    }
    expect(P.sham[1]).toBeLessThan(P.madinah[1])      // Şam şimaldadır
    expect(P.makkah[1]).toBeGreaterThan(P.madinah[1]) // Məkkə cənubdadır
    expect(P.basra[0]).toBeGreaterThan(P.kufa[0])     // Bəsrə şərqdədir
    expect(QH_BY_ID.uthman.cities.every(c => QH_CITIES[c] && !QH_CITIES[c].origin)).toBe(true)
  })

  it('UI yazıları 5 dildə eyni açarlarla', () => {
    const keys = Object.keys(QH_T.az).sort()
    for (const l of LANGS) expect(Object.keys(QH_T[l]).sort(), l).toEqual(keys)
    expect(QH_T.ru.stepOf(2, 6)).toBe('Этап 2 из 6')
  })
})

describe('/quran-history — marşrut, meta, menyu, SSR', () => {
  beforeAll(() => { globalThis.React = React })
  it('indekslənən marşrut, 5 dildə meta, menyuda, Quran bələdçisindən link', () => {
    const page = PAGES.find(p => p.key === 'quranhistory')
    expect(page).toBeTruthy()
    expect(page.noindex).toBeFalsy()
    expect(pathFor('quranhistory', 'az')).toBe('/quran-history')
    expect(pathFor('quranhistory', 'en')).toBe('/en/quran-history')
    for (const l of LANGS) { expect(META.quranhistory[l].t).toBeTruthy(); expect(META.quranhistory[l].d.length).toBeGreaterThan(100) }
    expect(NAV_ITEMS.some(i => i.key === 'quranhistory')).toBe(true)
    expect(QURAN_GUIDE.related.items.some(i => i.key === 'quranhistory')).toBe(true)
  })

  it('5 dildə render olunur; ilk render — birinci mərhələ aktiv; mənbələr və sitatlar var', async () => {
    const origError = console.error
    console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }
    const { LangProvider } = await import('../../src/contexts/LangContext.jsx')
    const Page = (await import('../../src/pages/QuranHistoryPage.jsx')).default
    for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
      const html = renderToString(h(MemoryRouter, { initialEntries: [`${l}/quran-history`] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
      expect(html).toContain('<h1')
      expect((html.match(/data-testid="qh-scene"/g) || []).length).toBe(6)
      expect(html).toMatch(/id="step-hira"[^>]*class="qh-scene qh-scene--hira is-active"/)
      expect(html).toContain('data-active="hira"')
      expect(html).toContain('aria-current="step"')
      expect(html).toContain('https://sunnah.com/bukhari:4986')
      expect(html).toContain('https://sunnah.com/bukhari:4987')
      expect(html).toContain(QH_BY_ID.revelation.quotes[0].ar)
      expect(html).toContain(QH_BY_ID.hira.ayahs[4].ar)
      expect(html).not.toMatch(/role="alert"/)
      if (l === '/en') expect(html).toContain('How the Quran was compiled')
    }
    console.error = origError
  })
  it('prerender statik bloku: 6 mərhələ (#step-…), ərəbcə sitatlar və mənbə linkləri', async () => {
    const { staticBodyFor } = await import('../../scripts/seo-body.mjs')
    for (const l of LANGS) {
      const html = staticBodyFor('quranhistory', l)
      for (const s of QH_SCENES) expect(html, `${l}: ${s.id}`).toContain(`id="step-${s.id}"`)
      expect(html).toContain('https://sunnah.com/bukhari:4987')
      expect(html).toContain(QH_BY_ID.suhuf.quotes[0].ar)
      expect(html).toContain(`<h1>${QH_T[l].title}</h1>`)
    }
  })
})
