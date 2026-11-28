// Rabbanā duaları (/rabbana-duas): generator (dua hissəsi ayənin öz mətnindən, hərfi-hərfinə),
// qərar cədvəli (hər namizəd qərarlı, xaric edilənlər səhifəyə düşmür), küp köməkçiləri, marşrut/meta, SSR.
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { buildRabbana, genModule, isRabbanaWord } from '../../scripts/rabbana-lib.mjs'
import { RABBANA_DECISIONS } from '../../src/data/rabbanaDuas.js'
import { RABBANA_ITEMS } from '../../src/data/rabbanaSpans.gen.js'
import { RB_T, RB_WHO } from '../../src/components/rabbana/rabbanaText.js'
import { pickNext, isShake, refLabel, splitAyah } from '../../src/components/rabbana/rabbanaJar.js'
import { PAGES, pathFor } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'
import { NAV_ITEMS } from '../../src/data/navigation.js'

const QURAN = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8')).ayahs
const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const status = Object.fromEntries(RABBANA_DECISIONS.map(d => [d.ref, d.status]))
// Kafirlərin / cəhənnəm əhlinin sözləri — heç vaxt daxil edilməməli (tapşırıqdakı nümunələr)
const MUST_EXCLUDE = ['23:106', '23:107', '14:44', '33:67', '33:68', '41:29', '7:38', '38:61', '40:11', '32:12']

describe('generator — namizədlər və qərarlar', () => {
  it('yalnız nida forması: رَبَّنَا / رَبَّنَآ / رَّبَّنَآ, رَبُّنَا və رَبِّنَا deyil', () => {
    for (const w of ['رَبَّنَا', 'رَبَّنَآ', 'رَّبَّنَآ', 'رَّبَّنَا']) expect(isRabbanaWord(w)).toBe(true)
    for (const w of ['رَبُّنَا', 'رَبِّنَا', 'رَبُّنَآ', 'رَبَّكَ', 'رَبِّ']) expect(isRabbanaWord(w)).toBe(false)
  })

  it('64 namizəd ayə, hər birinin qərarı var, problem yoxdur', () => {
    const { problems, candidates } = buildRabbana(QURAN, RABBANA_DECISIONS)
    expect(problems).toEqual([])
    expect(candidates).toHaveLength(64)
    expect(new Set(RABBANA_DECISIONS.map(d => d.ref)).size).toBe(RABBANA_DECISIONS.length)
    expect(candidates.map(c => c.ref).sort()).toEqual(RABBANA_DECISIONS.map(d => d.ref).sort())
  })

  it('kafirlərin və cəhənnəm əhlinin sözləri xaric edilib', () => {
    for (const r of MUST_EXCLUDE) expect(status[r], r).toBe('exclude')
    for (const d of RABBANA_DECISIONS) {
      expect(['include', 'exclude', 'review']).toContain(d.status)
      expect(d.reason, d.ref).toBeTruthy()
    }
  })

  it('yaradılan modul cari məlumatla eynidir (node scripts/build-rabbana.mjs)', () => {
    const { items } = buildRabbana(QURAN, RABBANA_DECISIONS)
    expect(fs.readFileSync('src/data/rabbanaSpans.gen.js', 'utf8').replace(/\r\n/g, '\n')).toBe(genModule(items))
  })
})

describe('RABBANA_ITEMS — dua hissəsi ayənin öz mətnidir', () => {
  it('yalnız "include" qərarları, cədvəl sırası ilə', () => {
    const inc = RABBANA_DECISIONS.filter(d => d.status === 'include').map(d => d.ref)
    expect(RABBANA_ITEMS.map(it => it.ref)).toEqual(inc)
    for (const it of RABBANA_ITEMS) expect(status[it.ref]).toBe('include')
    for (const r of [...MUST_EXCLUDE, '2:285', '10:88']) expect(RABBANA_ITEMS.some(it => it.ref === r)).toBe(false)
  })

  it('ayə saytın Quran mətni ilə hərfi-hərfinə eynidir, span onun alt sətridir və رَبَّنَا ilə başlayır', () => {
    for (const it of RABBANA_ITEMS) {
      const ayah = QURAN[it.s - 1][it.a - 1]
      expect(it.ayah, it.ref).toBe(ayah)
      const { pre, span, post } = splitAyah(it)
      expect(pre + span + post).toBe(ayah)
      expect(ayah.includes(span)).toBe(true)
      expect(ayah.indexOf(span, it.start)).toBe(it.start)
      expect(isRabbanaWord(span.split(' ')[0]), it.ref).toBe(true)
      expect(span.trim()).toBe(span)
    }
  })

  it('14:38 — span vəqf işarəsindən əvvəl bitir; 2:127 — ayənin sonuna qədər', () => {
    const a = RABBANA_ITEMS.find(it => it.ref === '14:38')
    expect(splitAyah(a).span.endsWith('وَمَا نُعْلِنُ')).toBe(true)
    const b = RABBANA_ITEMS.find(it => it.ref === '2:127')
    expect(b.end).toBe(b.ayah.length)
    expect(splitAyah(b).pre).toContain('إِبْرَٰهِۦمُ')
  })

  it('"who" — yalnız mətndə adı çəkilən, 5 dildə adı var; whoRef ayəsi mövcuddur', () => {
    for (const it of RABBANA_ITEMS.filter(x => x.who)) {
      expect(RB_WHO[it.who], it.ref).toBeTruthy()
      for (const l of LANGS) expect(RB_WHO[it.who][l]).toBeTruthy()
      const [s, a] = it.whoRef.split(':').map(Number)
      expect(QURAN[s - 1][a - 1]).toBeTruthy()
    }
    expect(RABBANA_ITEMS.find(it => it.ref === '2:127').who).toBe('ibrahimIsmail')
    expect(RABBANA_ITEMS.find(it => it.ref === '7:23').who).toBeUndefined()
  })

  it('tərcümə faylları hər daxil edilən ayə üçün mətn verir (az/en/ru/tr)', () => {
    for (const l of ['az', 'en', 'ru', 'tr']) {
      const d = JSON.parse(fs.readFileSync(`public/data/rabbana/${l}.json`, 'utf8'))
      expect(d.by).toBeTruthy()
      for (const it of RABBANA_ITEMS) expect(d.tr[it.ref], `${l} ${it.ref}`).toBeTruthy()
      expect(Object.keys(d.tr)).toHaveLength(RABBANA_ITEMS.length)
    }
  })
})

describe('dua küpü', () => {
  it('pickNext: ardıcıl iki dəfə eyni yox, bütün aralığı əhatə edir', () => {
    let last = -1
    const seen = new Set()
    let x = 0.1234
    const rnd = () => { x = (x * 9301 + 0.49297) % 1; return x }
    for (let i = 0; i < 500; i++) {
      const n = pickNext(38, last, rnd)
      expect(n).not.toBe(last)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(38)
      seen.add(n); last = n
    }
    expect(seen.size).toBe(38)
    // kənar hallar
    expect(pickNext(0, -1)).toBe(-1)
    expect(pickNext(1, 0)).toBe(0)
    expect(pickNext(2, 0, () => 0.99)).toBe(1)
    expect(pickNext(2, 1, () => 0)).toBe(0)
    expect(pickNext(5, 4, () => 0.9999)).toBe(3)
  })

  it('isShake: ani dəyişmə — bəli, yavaş fırlanma — yox', () => {
    expect(isShake({ x: 0, y: 9.8, z: 0 }, { x: 18, y: -6, z: 4 })).toBe(true)
    expect(isShake({ x: 0, y: 9.8, z: 0 }, { x: 1, y: 9.5, z: 0.5 })).toBe(false)
    expect(isShake(null, { x: 30, y: 0, z: 0 })).toBe(false)
  })

  it('refLabel dillərə görə', () => {
    const it = RABBANA_ITEMS.find(x => x.ref === '2:201')
    expect(refLabel(it, 'az')).toBe('Bəqərə 2:201')
    expect(refLabel(it, 'en')).toBe('Al-Baqarah 2:201')
    expect(refLabel(it, 'ar')).toBe('البقرة 2:201')
  })
})

describe('marşrut, meta, naviqasiya, mətnlər', () => {
  it('routes: rabbana → /rabbana-duas', () => {
    expect(PAGES.find(p => p.key === 'rabbana')?.path).toBe('rabbana-duas')
    expect(pathFor('rabbana', 'en')).toBe('/en/rabbana-duas')
  })
  it('meta 5 dildə, sayı siyahı ilə eynidir', () => {
    for (const l of LANGS) {
      expect(META.rabbana[l].t).toBeTruthy()
      expect(META.rabbana[l].d.length).toBeGreaterThan(60)
    }
    for (const l of ['az', 'en', 'ru', 'tr']) expect(META.rabbana[l].d).toContain(String(RABBANA_ITEMS.length))
  })
  it('naviqasiyada dua qrupunda', () => {
    expect(NAV_ITEMS.some(i => i.key === 'rabbana')).toBe(true)
  })
  it('UI mətnləri 5 dildə eyni açarlarla; say ifadələri tam cümlədir', () => {
    const keys = Object.keys(RB_T.en).sort()
    for (const l of LANGS) expect(Object.keys(RB_T[l]).sort()).toEqual(keys)
    expect(RB_T.en.nDuas(1)).toBe('1 dua')
    expect(RB_T.en.nDuas(38)).toBe('38 duas')
    expect(RB_T.ar.nDuas(2)).toBe('دعاءان')
  })
})

describe('SSR — prerender ilk render ilə eyni', () => {
  // vitest JSX-i klassik rejimdə çevirir (quran-history.test.js ilə eyni)
  beforeAll(() => { globalThis.React = React })
  it('səhifə serverdə render olunur: kartlar, küp, tərcüməsiz (mount-dan sonra yüklənir)', async () => {
    const { LangProvider } = await import('../../src/contexts/LangContext.jsx')
    const { default: RabbanaPage } = await import('../../src/pages/RabbanaPage.jsx')
    const html = renderToString(h(MemoryRouter, { initialEntries: ['/en/rabbana-duas'] },
      h(LangProvider, null, h(RabbanaPage, { setPage: () => {} }))))
    expect(html).toContain('Rabbanā duas')
    expect((html.match(/data-testid="rbn-card"/g) || []).length).toBe(RABBANA_ITEMS.length)
    expect(html).toContain('data-testid="rbn-jar"')
    expect(html).not.toContain('data-testid="rbn-slip"')
    expect(html).not.toContain('data-testid="rbn-shake"')
    expect(html).toContain(splitAyah(RABBANA_ITEMS[0]).span)
  })
})

describe('seo-body — statik blok', () => {
  it('ərəbcə dua hissələri, tərcümə, Quran linkləri; ərəbcədə tərcümə yoxdur', async () => {
    const { staticBodyFor } = await import('../../scripts/seo-body.mjs')
    const en = staticBodyFor('rabbana', 'en')
    for (const it of RABBANA_ITEMS) {
      expect(en).toContain(`id="d-${it.s}-${it.a}"`)
      expect(en).toContain(`${pathFor('quran', 'en', it.s)}?a=${it.a}`)
    }
    expect(en).toContain(splitAyah(RABBANA_ITEMS[0]).span)
    expect(en).toContain(pathFor('duas', 'en'))
    const az = staticBodyFor('rabbana', 'az')
    expect(az).toContain('Məmmədəliyev')
    const ar = staticBodyFor('rabbana', 'ar')
    expect(ar).toContain('dir="rtl"')
    expect(ar).not.toContain('Asad')
    expect(staticBodyFor('rabbana', 'en', 'x')).toBe('')
  })
})
