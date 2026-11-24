// SEO/GEO (2026-11-24): səhifə sxemi, JSON-LD keçərliliyi, noindex head, llms.txt / llms-full.txt,
// IndexNow, statik bələdçi blokları, dist yoxlayıcısının saf funksiyaları.
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { pageJsonLd } from '../../src/seo/pageJsonLd.js'
import { siteSchema } from '../../src/seo/siteSchema.js'
import * as detail from '../../src/seo/detailData.js'
import { PAGES, INDEXABLE, DETAILS, detailParams, SITE, pathFor } from '../../src/seo/routes.js'
import { checkJsonLd, checkPage, parseHead } from '../../scripts/check-seo-dist.mjs'
import { internalLinks } from '../../scripts/check-links-dist.mjs'
import { buildLlmsTxt, buildLlmsFullTxt, keyFacts } from '../../scripts/llms-txt.mjs'
import { CALC_METHODS } from '../../src/utils/prayCalc.js'
import { INDEXNOW_KEY, changedPaths, payloads, seoFingerprint, BATCH, MAX_URLS } from '../../scripts/indexnow.mjs'
import { staticBodyFor, GUIDE_KEYS } from '../../scripts/seo-body.mjs'
import { HADITH_IDS } from '../../src/seo/hadithIds.js'

const LANGS5 = ['az', 'en', 'ru', 'ar', 'tr']

describe('pageJsonLd', () => {
  it('ana səhifədə breadcrumb yoxdur, digərlərində 2 addım', () => {
    const home = pageJsonLd({ key: 'home', lang: 'en', title: 'T', desc: 'D', canonical: SITE + '/en' })
    expect(home.breadcrumb).toBeUndefined()
    const q = pageJsonLd({ key: 'qibla', lang: 'en', title: 'Qibla | Muslims.cc', desc: 'D', canonical: SITE + '/en/qibla' })
    expect(q.breadcrumb.itemListElement.map(i => i.name)).toEqual(['Muslims.cc', 'Qibla'])
    expect(checkJsonLd(JSON.stringify(q))).toEqual([])
  })
  it('noindex səhifədə sxem yoxdur', () => {
    expect(pageJsonLd({ key: 'share', lang: 'en', title: 'T', desc: 'D', canonical: SITE + '/en/share', noindex: true })).toBeNull()
  })
})

describe('JSON-LD keçərliliyi (bütün növlər)', () => {
  it('sayt sxemi 5 dildə', () => {
    for (const l of LANGS5) expect(checkJsonLd(JSON.stringify(siteSchema(l)))).toEqual([])
  })
  it('hər detal növü: ilk, ikinci və son element × 5 dil', () => {
    for (const key of Object.keys(DETAILS)) {
      if (DETAILS[key].noindex) continue
      const ps = detailParams(key)
      for (const p of [ps[0], ps[1], ps[ps.length - 1]]) {
        for (const l of LANGS5) {
          const j = detail.detailJsonLd(key, l, p)
          expect(j, `${key}/${p}/${l}`).toBeTruthy()
          expect(checkJsonLd(JSON.stringify(j)), `${key}/${p}/${l}`).toEqual([])
        }
      }
    }
  })
  it('yoxlayıcı səhvləri tutur: sintaksis, saxta reytinq, tək addımlı breadcrumb', () => {
    expect(checkJsonLd('{bad')[0]).toMatch(/sintaksis/)
    expect(checkJsonLd(JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'a', url: SITE + '/', inLanguage: 'en', aggregateRating: { ratingValue: 5 } })).join()).toMatch(/aggregateRating/)
    const bc = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'x', item: SITE + '/' }] }
    expect(checkJsonLd(JSON.stringify(bc)).join()).toMatch(/ən azı 2/)
  })
})

describe('checkPage (dist yoxlayıcısı)', () => {
  const head = (canon, alts, robots, ld = []) => `<title>T</title><meta name="description" content="D" /><meta name="robots" content="${robots}" />` +
    (canon ? `<link rel="canonical" href="${canon}" data-seo="canonical" />` : '') +
    alts.map(([l, h]) => `<link rel="alternate" hreflang="${l}" href="${h}" />`).join('') +
    ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('')
  it('noindex səhifə: hreflang/sxem varsa xəta, yoxdursa təmiz', () => {
    const c = SITE + '/en/share'
    expect(checkPage(head(c, [], 'noindex, nofollow'), 'share', 'en')).toEqual([])
    expect(checkPage(head(c, [['en', c]], 'noindex, nofollow'), 'share', 'en').join()).toMatch(/hreflang/)
  })
  it('parseHead canonical/hreflang çıxarır', () => {
    const h = parseHead(head(SITE + '/en', [['en', SITE + '/en'], ['x-default', SITE + '/']], 'index, follow'))
    expect(h.canon).toEqual([SITE + '/en'])
    expect(h.alts.map(a => a.lang)).toEqual(['en', 'x-default'])
  })
  it('internalLinks: yalnız daxili, hash/query-siz, /api yox', () => {
    expect(internalLinks('<a href="/en/quran#x">a</a><a href="https://x.com/">b</a><a href="/api/x">c</a><a href="//cdn/x">d</a><a href="/q?s=2">e</a>'))
      .toEqual(['/en/quran', '/q'])
  })
})

describe('yeni səhifələr və noindex qaydası', () => {
  it('road-to-ramadan və last-ten-nights indekslənir; şəxsi/icma səhifələri noindex', () => {
    const idx = new Set(INDEXABLE.map(p => p.key))
    expect(idx.has('ramadanprep') && idx.has('lastten')).toBe(true)
    const noindex = new Set(PAGES.filter(p => p.noindex).map(p => p.key))
    for (const k of ['share', 'trustbox', 'janaza', 'prayerrooms', 'volunteers', 'admin', 'account']) expect(noindex.has(k), k).toBe(true)
  })
})

describe('llms.txt / llms-full.txt', () => {
  const s = buildLlmsTxt({ date: '2026-11-24' })
  it('Key facts saytın öz parametrlərindəndir (prayCalc CALC_METHODS)', () => {
    const f = keyFacts().join('\n')
    expect(f).toContain(`Fajr at ${CALC_METHODS.abubakr.fajr}°`)
    expect(f).toContain(`Isha ${CALC_METHODS.abubakr.ishaMin} minutes after Maghrib`)
    expect(f).toContain(`Fajr ${CALC_METHODS.diyanet.fajr}°, Isha ${CALC_METHODS.diyanet.isha}°`)
    expect(s).toContain('## Key facts')
    expect(s).toContain('Generated: 2026-11-24')
  })
  it('yeni səhifələr qrupdadır, "About" təkrarlanmır, hədis detalları var', () => {
    expect(s).toMatch(/## Calendar, fasting and Hajj[\s\S]*road-to-ramadan[\s\S]*last-ten-nights[\s\S]*## Learning/)
    expect(s.match(/\/en\/about\)/g)).toHaveLength(1)
    expect(s).toContain(`${SITE}/en/hadith/<slug>`)
    expect(s).not.toMatch(/undefined|null|\[object/)
  })
  it('llms-full.txt: hər surə, ad və hədis səhifəsi bir sətir', () => {
    const full = buildLlmsFullTxt(detail)
    expect(full).toContain(`(${SITE}/en/quran/36-yaseen)`)
    expect(full).toContain(`(${SITE}/en/hadith/${HADITH_IDS[0]})`)
    expect(full.match(/\]\(https:\/\/muslims\.cc\/en\/hadith\//g)).toHaveLength(HADITH_IDS.length)
    expect(full.match(/\]\(https:\/\/muslims\.cc\/en\/quran\/\d/g)).toHaveLength(114)
    expect(full).not.toMatch(/undefined|\[object/)
    // Ölçü: AI krauleri üçün bir fayl — 2 MB-dan kiçik
    expect(Buffer.byteLength(full)).toBeLessThan(2 * 1024 * 1024)
  })
})

describe('IndexNow', () => {
  it('açar faylı public/-dədir və açarla eynidir (açar açıqdır — protokol belədir)', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/)
    const f = path.resolve(__dirname, '../../public', `${INDEXNOW_KEY}.txt`)
    expect(fs.readFileSync(f, 'utf8').trim()).toBe(INDEXNOW_KEY)
  })
  it('yalnız dəyişən / yeni / silinən yollar; köhnə manifest yoxdursa heç nə', () => {
    const o = { v: 1, h: { '/a': '1', '/b': '2', '/c': '3' } }
    const n = { v: 1, h: { '/a': '1', '/b': 'X', '/d': '4' } }
    expect(changedPaths(o, n)).toEqual(['/b', '/d', '/c'])
    expect(changedPaths(null, n)).toEqual([])
    expect(changedPaths({}, n)).toEqual([])
    expect(changedPaths({ v: 1, h: {} }, n)).toEqual([])
  })
  it('POST ≤ 10 000 URL, deploy başına ≤ MAX_URLS', () => {
    const many = Array.from({ length: MAX_URLS + 5000 }, (_, i) => `/p${i}`)
    const b = payloads(many)
    expect(b).toHaveLength(Math.ceil(MAX_URLS / BATCH))
    expect(b.every(x => x.urlList.length <= BATCH && x.host === 'muslims.cc' && x.keyLocation.endsWith(`/${INDEXNOW_KEY}.txt`))).toBe(true)
    expect(b[0].urlList[0]).toBe('https://muslims.cc/p0')
  })
  it('barmaq izi hash-li asset adlarına həssas deyil, title/body-yə həssasdır', () => {
    const page = (asset, title, body) => `<head><title>${title}</title><link rel="modulepreload" href="/assets/${asset}.js"></head><body><div id="root">${body}</div><noscript>x</noscript>`
    expect(seoFingerprint(page('a-111', 'T', 'B'))).toBe(seoFingerprint(page('a-222', 'T', 'B')))
    expect(seoFingerprint(page('a-111', 'T', 'B'))).not.toBe(seoFingerprint(page('a-111', 'T2', 'B')))
    expect(seoFingerprint(page('a-111', 'T', 'B'))).not.toBe(seoFingerprint(page('a-111', 'T', 'B2')))
  })
})

describe('statik bələdçi blokları (GEO)', () => {
  it('alət səhifələri 5 dildə real mətn və mənbə verir', () => {
    for (const k of GUIDE_KEYS) {
      for (const l of LANGS5) {
        const b = staticBodyFor(k, l)
        expect(b.length, `${k}/${l}`).toBeGreaterThan(1500)
        expect(b, `${k}/${l}`).not.toMatch(/undefined|\[object|NaN/)
        expect((b.match(/<h1>/g) || []).length, `${k}/${l}`).toBe(1)
      }
    }
    expect(staticBodyFor('qibla', 'en')).toContain('2:144')
    expect(staticBodyFor('zakat', 'en')).toMatch(/595 g/)
  })
  it('əlavə dildə bələdçi bloku yazılmır (məzmun 5 dildədir)', () => {
    expect(staticBodyFor('qibla', 'fr')).toBe('')
  })
  it('/hadith siyahısı hər hədis səhifəsinə link verir', () => {
    const b = staticBodyFor('hadith', 'en')
    for (const id of [HADITH_IDS[0], HADITH_IDS[500], HADITH_IDS[HADITH_IDS.length - 1]]) expect(b).toContain(`href="${pathFor('hadith', 'en', id)}"`)
    expect(b.match(/href="\/en\/hadith\//g)).toHaveLength(HADITH_IDS.length)
  })
})
