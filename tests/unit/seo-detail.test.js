// Detal səhifələri: /quran/<n>-<slug>, /names/<n>-<slug>, /sahaba/<slug>
// — marşrut (pathFor/parsePath), slug-ların məlumatla uyğunluğu, meta və sxem
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  LANGS, PAGES, DETAILS, pathFor, urlFor, parsePath, detailParams, detailSegment,
  parseDetailSegment, isDetailParam, legacyDetailParam,
} from '../../src/seo/routes.js'
import { SURAH_SLUGS } from '../../src/seo/surahSlugs.js'
import { NAME_SLUGS, SAHABA_SLUGS, SCHOLAR_SLUGS } from '../../src/seo/detailSlugs.js'
import { SURAH_META } from '../../src/seo/surahMeta.js'
import { NAMES_99 } from '../../src/data/names99.js'
import { SAHABA, slugOf } from '../../src/data/sahaba.js'
import { detailMeta, titleForDetail, detailJsonLd, TITLE_MAX } from '../../src/seo/detail.js'
import { displayAyah, hasSeparateBasmala } from '../../src/utils/quranText.js'

const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

describe('detal marşrutları — pathFor / parsePath', () => {
  it('nümunələr', () => {
    expect(pathFor('quran', 'az', 2)).toBe('/quran/2-al-baqara')
    expect(pathFor('quran', 'en', 36)).toBe('/en/quran/36-yaseen')
    expect(pathFor('names', 'az', 30)).toBe('/names/30-ar-rahman')
    expect(pathFor('names', 'en', 99)).toBe('/en/names/99-al-witr')
    expect(pathFor('names', 'ru', 1)).toBe('/ru/names/1-allah')
    expect(pathFor('sahaba', 'ar', 'bilal-ibn-rabah')).toBe('/ar/sahaba/bilal-ibn-rabah')
    expect(urlFor('quran', 'tr', 114)).toBe('https://muslims.cc/tr/quran/114-an-naas')
  })

  it('param verilməyəndə (və ya düzgün deyilsə) köhnə davranış — siyahı yolu', () => {
    expect(pathFor('quran', 'az')).toBe('/quran')
    expect(pathFor('quran', 'ru', null)).toBe('/ru/quran')
    expect(pathFor('quran', 'az', 0)).toBe('/quran')
    expect(pathFor('quran', 'az', 115)).toBe('/quran')
    expect(pathFor('sahaba', 'en', 'yoxdur')).toBe('/en/sahaba')
    // Detalı olmayan səhifəyə param təsir etmir
    expect(pathFor('prayer', 'en', 3)).toBe('/en/prayer')
  })

  it('hər detal × dil üçün pathFor → parsePath eyni (dil, səhifə, param) qaytarır', () => {
    for (const key of Object.keys(DETAILS)) {
      for (const param of detailParams(key)) {
        for (const l of LANGS) {
          expect(parsePath(pathFor(key, l, param)), `${key}/${param}/${l}`).toEqual({ lang: l, key, known: true, param })
        }
      }
    }
  })

  it('siyahı səhifələrində param null-dır (köhnə çağırışlar pozulmur)', () => {
    for (const p of PAGES) {
      expect(parsePath(pathFor(p.key, 'en')).param, p.key).toBeNull()
    }
  })

  it('nömrə həqiqət mənbəyidir: səhv slug da həmin surəni/adı açır', () => {
    expect(parsePath('/quran/2-al-baqarah')).toMatchObject({ key: 'quran', known: true, param: 2 })
    expect(parsePath('/en/quran/36-ya-sin')).toMatchObject({ lang: 'en', param: 36, known: true })
    expect(parsePath('/quran/2')).toMatchObject({ param: 2, known: true })
    expect(parsePath('/names/1-ar-rahmaan')).toMatchObject({ key: 'names', param: 1, known: true })
    // kanonik yol isə düzgün slug-dur
    expect(pathFor('quran', 'az', parsePath('/quran/2-al-baqarah').param)).toBe('/quran/2-al-baqara')
  })

  // 99 ad İbn Useyminin siyahısı ilə əvəz olunanda nömrələr dəyişdi:
  // köhnə ünvanlarda TANINAN slug nömrədən üstündür
  it('99 ad: köhnə nömrəli ünvan slug-a görə yeni nömrəyə düşür', () => {
    expect(parsePath('/names/2-ar-rahman')).toEqual({ lang: 'az', key: 'names', known: true, param: 30 })
    expect(parsePath('/en/names/20-al-alim')).toMatchObject({ lang: 'en', param: 44, known: true })
    expect(parsePath('/ru/names/49-al-majid')).toMatchObject({ param: 65, known: true })
    expect(parsePath('/names/1-allah')).toMatchObject({ param: 1, known: true })
    expect(pathFor('names', 'en', parsePath('/en/names/20-al-alim').param)).toBe('/en/names/44-al-alim')
    // Böyük hərf və % kodlaşdırması
    expect(parseDetailSegment('names', '2-Ar-Rahman')).toBe(30)
  })

  it('99 ad: köhnə siyahıdan çıxarılmış adın ünvanı → { removed: true } (App.jsx siyahıya keçirir)', () => {
    for (const p of ['/names/23-al-khafid', '/en/names/94-an-nur', '/ru/names/86-dhul-jalali-wal-ikram', '/names/99-ar-rashid']) {
      const r = parsePath(p)
      expect(r, p).toMatchObject({ key: 'names', known: true, param: null, removed: true })
    }
    // çıxarılmış ad nömrəyə düşmür (23 indi başqa addır)
    expect(parseDetailSegment('names', '23-al-khafid')).toBeNull()
    // yeni ünvanlarda removed yoxdur
    expect(parsePath('/names/30-ar-rahman').removed).toBeUndefined()
    // Quranda slug üstünlüyü yoxdur
    expect(parsePath('/quran/2-al-fatiha')).toMatchObject({ param: 2 })
  })

  it('naməlum nömrə / slug / artıq seqment → known:false (404)', () => {
    for (const p of ['/quran/0', '/quran/115', '/quran/abc', '/names/100', '/names/0-x', '/sahaba/yoxdur',
      '/en/sahaba/abu-bakr', '/quran/2-al-baqara/3', '/ru/names/1-allah/x']) {
      expect(parsePath(p).known, p).toBe(false)
    }
  })

  it('səhabə slug-u böyük-kiçik hərfə həssas deyil, % kodlaşdırması açılır', () => {
    expect(parseDetailSegment('sahaba', 'Bilal-Ibn-Rabah')).toBe('bilal-ibn-rabah')
    expect(parseDetailSegment('quran', '2-%C9%99')).toBe(2)
  })

  it('detailSegment / isDetailParam', () => {
    expect(detailSegment('quran', 1)).toBe('1-al-faatiha')
    expect(detailSegment('quran', '2')).toBeNull()
    expect(isDetailParam('names', 99)).toBe(true)
    expect(isDetailParam('names', 100)).toBe(false)
  })

  it('köhnə query ünvanları: /quran?s=2, /sahaba?id=<slug|id>', () => {
    const q = (s) => new URLSearchParams(s)
    expect(legacyDetailParam('quran', q('s=2&a=90'))).toBe(2)
    expect(legacyDetailParam('quran', q('s=999'))).toBeNull()
    expect(legacyDetailParam('sahaba', q('id=anas-ibn-malik'))).toBe('anas-ibn-malik')
    expect(legacyDetailParam('sahaba', q('id=3'))).toBe('uthman-ibn-affan')
    expect(legacyDetailParam('sahaba', q('id=yoxdur'))).toBeNull()
    expect(legacyDetailParam('names', q('s=2'))).toBeNull()
  })

  it('URL-lər təkrarlanmır, hamısı ASCII kiçik hərf və defisdir', () => {
    const urls = Object.keys(DETAILS).flatMap(k => detailParams(k).flatMap(p => LANGS.map(l => pathFor(k, l, p))))
    expect(new Set(urls).size).toBe(urls.length)
    expect(urls.length).toBe((114 + 99 + SAHABA.length + SCHOLAR_SLUGS.length) * LANGS.length)
    for (const u of urls) expect(u, u).toMatch(/^(\/[a-z]{2})?\/(quran|names|sahaba|scholars)\/[a-z0-9-]+$/)
  })
})

describe('slug-lar məlumatla uyğundur', () => {
  it('99 ad: NAME_SLUGS = names99.js transliterasiyası', () => {
    expect(NAMES_99.map((x, i) => x.n === i + 1)).not.toContain(false)
    expect(NAME_SLUGS).toEqual(NAMES_99.map(x => slugify(x.tr)))
  })

  it('səhabələr: SAHABA_SLUGS = sahaba.js → slugOf, id ardıcıldır', () => {
    expect(SAHABA.map((s, i) => s.id === i + 1)).not.toContain(false)
    expect(SAHABA_SLUGS).toEqual(SAHABA.map(slugOf))
    expect(new Set(SAHABA_SLUGS).size).toBe(SAHABA_SLUGS.length)
  })

  it('surələr: 114 slug və meta seo-data/quran/meta.json ilə eynidir', () => {
    const meta = JSON.parse(fs.readFileSync(path.resolve('seo-data/quran/meta.json'), 'utf8'))
    expect(SURAH_SLUGS).toHaveLength(114)
    expect(SURAH_SLUGS).toEqual(meta.map(s => slugify(s.en)))
    expect(SURAH_META.map(r => r[4])).toEqual(meta.map(s => s.ayahs))
    expect(meta.reduce((a, s) => a + s.ayahs, 0)).toBe(6236)
  })

  it('seo-data: hər nəşrdə 114 surə və düzgün ayə sayı', () => {
    const dir = path.resolve('seo-data/quran')
    for (const ed of ['quran-uthmani', 'az.mammadaliyev', 'en.asad', 'ru.kuliev', 'tr.diyanet', 'ar.muyassar']) {
      const d = JSON.parse(fs.readFileSync(path.join(dir, `${ed}.json`), 'utf8'))
      expect(d.edition.identifier).toBe(ed)
      expect(d.ayahs.map(a => a.length), ed).toEqual(SURAH_META.map(r => r[4]))
    }
  })
})

describe('detal meta-sı (5 dil)', () => {
  it('hər detal üçün title ≤ 60, description 80–170 simvol, hər ikisi unikaldır', () => {
    for (const key of Object.keys(DETAILS)) {
      for (const l of LANGS) {
        const titles = new Set()
        const descs = new Set()
        for (const p of detailParams(key)) {
          const m = detailMeta(key, l, p)
          expect(m.t.length, `${key}/${p}/${l}: ${m.t}`).toBeLessThanOrEqual(TITLE_MAX)
          expect(m.d.length, `${key}/${p}/${l}: ${m.d}`).toBeGreaterThanOrEqual(80)
          expect(m.d.length, `${key}/${p}/${l}: ${m.d}`).toBeLessThanOrEqual(170)
          expect(m.t, `${key}/${p}/${l}`).not.toMatch(/\(\s*\)|undefined|null/)
          expect(m.d, `${key}/${p}/${l}`).not.toMatch(/\(\s*\)|undefined|null/)
          titles.add(m.t)
          descs.add(m.d)
        }
        expect(titles.size, `${key}/${l}`).toBe(detailParams(key).length)
        expect(descs.size, `${key}/${l}`).toBe(detailParams(key).length)
      }
    }
  })

  it('nümunə mətnlər', () => {
    expect(titleForDetail('quran', 'az', 2)).toBe('Bəqərə surəsi — ərəbcə mətn və Azərbaycan dilində tərcümə | Muslims.cc')
    expect(detailMeta('quran', 'en', 36).t).toBe('Surah Yaseen — Arabic Text & English Translation')
    expect(detailMeta('quran', 'tr', 2).h1).toBe('Bakara Suresi')
    expect(detailMeta('names', 'az', 30).d).toContain('Rəhman (Çox Rəhimli)')
    expect(detailMeta('names', 'en', 82).h1).toBe('Al-Jamil — The Beautiful')
    expect(detailMeta('sahaba', 'en', 'bilal-ibn-rabah').h1).toBe('Bilal ibn Rabah')
  })

  it('tr mətnlərində "ə" yoxdur', () => {
    for (const key of Object.keys(DETAILS)) {
      for (const p of detailParams(key)) {
        const m = detailMeta(key, 'tr', p)
        expect(`${m.t} ${m.d}`, `${key}/${p}`).not.toMatch(/[əƏ]/)
      }
    }
  })
})

describe('detal sxemi (JSON-LD)', () => {
  it('surə — Chapter, ad — DefinedTerm, səhabə — Person; iz 3 addımdır', () => {
    const q = detailJsonLd('quran', 'en', 2)
    expect(q.mainEntity).toMatchObject({ '@type': 'Chapter', position: 2, isPartOf: { '@type': 'Book' } })
    expect(q.breadcrumb.itemListElement.map(x => x.item)).toEqual([
      'https://muslims.cc/en', 'https://muslims.cc/en/quran', 'https://muslims.cc/en/quran/2-al-baqara',
    ])
    expect(detailJsonLd('names', 'az', 1).mainEntity).toMatchObject({ '@type': 'DefinedTerm', termCode: '1' })
    const p = detailJsonLd('sahaba', 'ar', 'aisha-bint-abi-bakr').mainEntity
    expect(p['@type']).toBe('Person')
    expect(p.alternateName).toBeUndefined() // ərəbcədə ad onsuz da ərəbcədir
    expect(detailJsonLd('quran', 'az', 999)).toBeNull()
  })
})

describe('Bəsmələ qaydası (utils/quranText.js)', () => {
  it('1-ci ayədən təkrar Bəsmələ yalnız Fatihə və Tövbədən başqa surələrdə gizlənir', () => {
    const ar = JSON.parse(fs.readFileSync(path.resolve('seo-data/quran/quran-uthmani.json'), 'utf8')).ayahs
    expect(displayAyah(ar[1][0], 2, 0)).toBe('الٓمٓ')
    expect(displayAyah(ar[0][0], 1, 0)).toBe(ar[0][0].replace(/^﻿/, ''))
    expect(displayAyah(ar[8][0], 9, 0)).toBe(ar[8][0])
    expect(displayAyah(ar[1][1], 2, 1)).toBe(ar[1][1])
    expect(hasSeparateBasmala(1)).toBe(false)
    expect(hasSeparateBasmala(9)).toBe(false)
    expect(hasSeparateBasmala(2)).toBe(true)
  })
})
