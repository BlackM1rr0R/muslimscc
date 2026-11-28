// Quranda peyğəmbərlər: saylar generatorun məntiqi ilə yenidən hesablanır və Osmani mətni,
// /quran-roots indeksi ilə tutuşdurulur (scripts/quran-prophets-lib.mjs, build-quran-prophets.mjs)
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { PAGES, pathFor } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'
import { NAV_ITEMS } from '../../src/data/navigation.js'
import { QURAN_GUIDE } from '../../src/data/guides/QuranPage.js'
import { QP_T } from '../../src/components/quranprophets/quranProphetsText'
import { QURAN_PROPHETS, QURAN_PROPHETS_META } from '../../src/data/quranProphets'
import { PROPHETS } from '../../src/data/islamicHistory'
import { decodeLocations, encodeLocations } from '../../src/utils/quranRoots'
import {
  PROPHET_RULES, parseMorphology, computeProphets, hudExcluded, locMatchesText, textCount, toAyahs, matchRule,
} from '../../scripts/quran-prophets-lib.mjs'
import { bubbleRadius, packBubbles, surahStrip, nearestInDirection } from '../../src/components/quranprophets/prophetBubbles'

const uthmani = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
const fixture = parseMorphology(fs.readFileSync('tests/unit/fixtures/quran-prophets-morphology.txt', 'utf8'))
const roots = JSON.parse(fs.readFileSync('public/data/quran-roots.json', 'utf8')).roots
const byId = Object.fromEntries(QURAN_PROPHETS.map(p => [p.id, p]))
const ruleOf = id => PROPHET_RULES.find(r => r.id === id)

describe('quranProphets — məlumat generatorla eynidir', () => {
  const computed = computeProphets(fixture.words)
  it('25 peyğəmbər, num 1–25, adlar islamicHistory PROPHETS-dən', () => {
    expect(QURAN_PROPHETS).toHaveLength(25)
    expect(QURAN_PROPHETS.map(p => p.num).sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
    for (const p of QURAN_PROPHETS) expect(p.name).toEqual(PROPHETS.find(x => x.num === p.num).name)
  })
  for (const c of computed) {
    it(`${c.id}: say ${c.count} və yerlər çıxarışdan yenidən hesablanır`, () => {
      const p = byId[c.id]
      expect(p.count).toBe(c.count)
      expect(p.locs).toBe(encodeLocations(c.locs))
      expect(decodeLocations(p.locs)).toHaveLength(p.count)
      for (const v of c.variants) {
        const pv = p.variants.find(x => x.id === v.id)
        expect(pv.count).toBe(v.count)
        expect(pv.locs).toBe(encodeLocations(v.locs))
      }
    })
  }
})

describe('quranProphets — Osmani mətni ilə yoxlama', () => {
  for (const p of QURAN_PROPHETS) {
    const rule = ruleOf(p.id)
    it(`${p.id}: hər yerdə həmin sözdə ad yazılıb`, () => {
      for (const l of decodeLocations(p.locs)) expect(locMatchesText(uthmani, rule, l), l.join(':')).toBe(true)
      for (const v of p.variants || []) {
        const vr = rule.variants.find(x => x.id === v.id)
        for (const l of decodeLocations(v.locs)) expect(locMatchesText(uthmani, vr, l), l.join(':')).toBe(true)
      }
    })
    if (rule.textCount) {
      it(`${p.id}: mətndəki say korpus sayına bərabərdir (${p.count})`, () => {
        expect(textCount(uthmani, rule)).toBe(p.count)
      })
    }
  }
})

describe('quranProphets — xüsusi qaydalar', () => {
  it('Hud: «yəhudilər» mənasındakı 3 yer (هُودًا أَوْ نَصَٰرَىٰ) çıxılır', () => {
    expect(encodeLocations(hudExcluded(fixture.words))).toBe('2:111:8,135:3,140:10')
    expect(QURAN_PROPHETS_META.hudExcluded).toBe('2:111:8,135:3,140:10')
    // /quran-roots indeksində lemma هُود 10 yerdədir = 7 (peyğəmbər) + 3 (yəhudilər)
    const idx = roots['هود'].find(e => e[0].normalize('NFC') === 'هُود'.normalize('NFC'))
    const all = decodeLocations(idx[3]).map(l => l.join(':'))
    const kept = decodeLocations(byId.hud.locs).map(l => l.join(':'))
    const excl = decodeLocations(QURAN_PROPHETS_META.hudExcluded).map(l => l.join(':'))
    expect([...kept, ...excl].sort()).toEqual([...all].sort())
    for (const ref of ['2:111', '2:135', '2:140']) {
      const [s, a] = ref.split(':').map(Number)
      expect(uthmani.ayahs[s - 1][a - 1]).toMatch(/هُودًا أَوْ نَصَٰرَىٰ/)
    }
  })
  it('Yəhya: yalnız xüsusi ad (PN) — «yaşayır/dirildir» feilləri sayılmır', () => {
    expect(byId.yahya.locs).toBe(roots['حيي'].find(e => e[0].normalize('NFC') === 'يَحْيَى'.normalize('NFC'))[3])
    // 8:42 «وَيَحْيَىٰ مَنْ حَىَّ» — eyni yazılış, feil
    expect(decodeLocations(byId.yahya.locs).some(([s]) => s === 8)).toBe(false)
  })
  it('Saleh: PN teqi sifət صالِح-i (eyni lemma) ayırır', () => {
    const asAdj = matchRule(fixture.words, { lemma: 'صالِح' }).length
    expect(asAdj).toBe(byId.salih.count)
    // çıxarışda PN olmayan صالِح sözləri də var (sifət) — sayılmır
    const anyLemma = [...fixture.words.values()].filter(segs => segs.some(g => g.lem === 'صالِح'.normalize('NFC'))).length
    expect(anyLemma).toBeGreaterThan(byId.salih.count)
  })
  it('Adəm, Muhəmməd, Əhməd — /quran-roots indeksi ilə eyni yerlər', () => {
    expect(byId.adam.locs).toBe(roots['أدم'].find(e => e[0].normalize('NFC') === 'آدَم'.normalize('NFC'))[3])
    expect(byId.muhammad.locs).toBe(roots['حمد'].find(e => e[0].normalize('NFC') === 'مُحَمَّد'.normalize('NFC'))[3])
    expect(byId.muhammad.variants[0].locs).toBe(roots['حمد'].find(e => e[0].normalize('NFC') === 'أَحْمَد'.normalize('NFC'))[3])
  })
  it('Zül-Kifl: ذَا + ٱلْكِفْلِ (21:85, 38:48); 4:85, 57:28 «pay» mənasında sayılmır', () => {
    expect(byId.dhulkifl.locs).toBe('21:85:4,38:48:5')
  })
  it('İlyas: 37:130 إِلْ يَاسِينَ ayrıca formadır, əsas saya qatılmır', () => {
    expect(byId.ilyas.count).toBe(2)
    expect(byId.ilyas.variants).toEqual([expect.objectContaining({ id: 'ilyasin', count: 1, locs: '37:130:3' })])
  })
  it('toAyahs: eyni ayədəki iki söz bir ayə, n=2', () => {
    expect(toAyahs([[2, 1, 1], [2, 1, 5], [3, 4, 2]])).toEqual([[2, 1, 2], [3, 4]])
  })
})

describe('prophetBubbles — yerləşdirmə', () => {
  const items = QURAN_PROPHETS.map(p => ({ id: p.id, r: bubbleRadius(p.count) }))
  const layout = packBubbles(items)
  it('radius kvadrat kök şkalası ilə artır', () => {
    expect(bubbleRadius(136)).toBeGreaterThan(bubbleRadius(69))
    expect(bubbleRadius(2)).toBeGreaterThan(0)
    expect((bubbleRadius(100) - bubbleRadius(0)) / (bubbleRadius(25) - bubbleRadius(0))).toBeCloseTo(2, 5)
  })
  it('dairələr üst-üstə düşmür, hamısı kətandadır, determinikdir', () => {
    const c = layout.circles
    for (let i = 0; i < c.length; i++) {
      for (let j = i + 1; j < c.length; j++) {
        expect(Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y)).toBeGreaterThanOrEqual(c[i].r + c[j].r - 0.01)
      }
      expect(c[i].x - c[i].r).toBeGreaterThanOrEqual(-0.01)
      expect(c[i].y - c[i].r).toBeGreaterThanOrEqual(-0.01)
      expect(c[i].x + c[i].r).toBeLessThanOrEqual(layout.w + 0.01)
      expect(c[i].y + c[i].r).toBeLessThanOrEqual(layout.h + 0.01)
    }
    expect(packBubbles(items)).toEqual(layout)
  })
  it('surahStrip: 114 surə, cəmi say = peyğəmbərin sayı', () => {
    const strip = surahStrip(decodeLocations(byId.musa.locs))
    expect(strip).toHaveLength(114)
    expect(strip.reduce((a, b) => a + b, 0)).toBe(136)
  })
  it('nearestInDirection: sağa ən yaxın dairə', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 20 }, { x: -10, y: 1 }]
    expect(nearestInDirection(pts, 0, 'right')).toBe(1)
    expect(nearestInDirection(pts, 0, 'left')).toBe(3)
    expect(nearestInDirection(pts, 0, 'down')).toBe(2)
    expect(nearestInDirection(pts, 2, 'down')).toBe(-1)
  })
})

describe('quranProphetsText — say ifadələri', () => {
  it('bütöv ifadələr, rus və ərəb cəm formaları', () => {
    expect(QP_T.en.mentioned(1)).toBe('once in the Quran')
    expect(QP_T.en.mentioned(136)).toBe('136 times in the Quran')
    expect(QP_T.ru.times(2)).toBe('2 раза')
    expect(QP_T.ru.times(25)).toBe('25 раз')
    expect(QP_T.ru.times(21)).toBe('21 раз')
    expect(QP_T.ru.inSurahs(21)).toBe('в 21 суре')
    expect(QP_T.ar.times(2)).toBe('مرتان')
    expect(QP_T.ar.times(7)).toBe('7 مرات')
    expect(QP_T.ar.times(136)).toBe('136 مرة')
    expect(QP_T.ar.inAyahs(1)).toBe('في آية واحدة')
    for (const l of ['az', 'en', 'ru', 'tr', 'ar']) {
      expect(Object.keys(QP_T[l].notes).sort()).toEqual(Object.keys(QP_T.en.notes).sort())
      expect(Object.keys(QP_T[l].names).sort()).toEqual(['ahmad', 'ilyasin', 'masih'])
    }
  })
})

describe('/quran-prophets — marşrut, meta, menyu, SSR, statik blok', () => {
  beforeAll(() => { globalThis.React = React })
  it('indekslənən marşrut, 5 dildə meta, menyuda, Quran bələdçisindən link', () => {
    const page = PAGES.find(p => p.key === 'quranprophets')
    expect(page).toBeTruthy()
    expect(page.noindex).toBeFalsy()
    expect(pathFor('quranprophets', 'az')).toBe('/quran-prophets')
    expect(pathFor('quranprophets', 'en')).toBe('/en/quran-prophets')
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) { expect(META.quranprophets[l].t).toBeTruthy(); expect(META.quranprophets[l].d.length).toBeGreaterThan(100) }
    expect(NAV_ITEMS.some(i => i.key === 'quranprophets')).toBe(true)
    expect(QURAN_GUIDE.related.items.some(i => i.key === 'quranprophets')).toBe(true)
  })
  it('5 dildə render olunur; ilk render — seçim yoxdur, 25 düymə, mənbə sətri', async () => {
    const { LangProvider } = await import('../../src/contexts/LangContext.jsx')
    const Page = (await import('../../src/pages/QuranProphetsPage.jsx')).default
    for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
      const html = renderToString(h(MemoryRouter, { initialEntries: [`${l}/quran-prophets`] }, h(LangProvider, null, h(Page, { setPage: () => {} }))))
      expect((html.match(/data-testid="qpr-b-/g) || []).length).toBe(25)
      expect(html).toContain('data-testid="qpr-hint"')
      expect(html).not.toContain('aria-pressed="true"')
      expect(html).toContain('Quranic Arabic Corpus')
      expect(html).not.toMatch(/role="alert"/)
      expect(html).toContain('data-count="136"')
    }
  })
  it('statik blok: 25 peyğəmbər (#id), saylar və ayə linkləri', async () => {
    const { staticBodyFor } = await import('../../scripts/seo-body.mjs')
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
      const html = staticBodyFor('quranprophets', l)
      for (const p of QURAN_PROPHETS) {
        expect(html, `${l}: ${p.id}`).toContain(`id="${p.id}"`)
        expect(html).toContain(QP_T[l].mentioned(p.count))
      }
      expect(html).toContain(`href="${pathFor('quran', l, 61)}?a=6"`)
      expect(html).toContain(`<h1>${QP_T[l].title}</h1>`)
    }
  })
})
