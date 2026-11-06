// Əlavə dillər (src/seo/langs.js): marşrut, SEO mətnləri, məlumat faylları
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  LANGS, ALL_LANGS, EXTRA_LANGS, EXTRA_CODES, EXTRA_PAGES, PAGES, LOCALES,
  pathFor, parsePath, langsFor, hasPageInLang, uiLang, dirOf, detailParams,
} from '../../src/seo/routes.js'
import { INTL_QURAN, INTL_BODY_UI, localDigits } from '../../src/seo/intl.js'
import { INTL_QURAN_LIST, INTL_QURAN_SECTION } from '../../src/seo/intlMeta.js'
import { detailMeta, titleForDetail, detailJsonLd, crumbsFor, surahInfo, BODY_UI } from '../../src/seo/detail.js'
import { titleFor, descFor, ogImageFor } from '../../src/seo/meta.js'
import { brandName } from '../../src/config/brand.js'
import { stripTranslationNotes } from '../../src/utils/quranText.js'
import { pickBrowserLang } from '../../src/utils/browserLang.js'

const ROOT = path.resolve(__dirname, '../..')

describe('reyestr', () => {
  it('əlavə dil kodu əsas dillə və ya səhifə yolu ilə üst-üstə düşmür', () => {
    for (const c of EXTRA_CODES) {
      expect(LANGS).not.toContain(c)
      expect(PAGES.map(p => p.path)).not.toContain(c)
      expect(c).toMatch(/^[a-z]{2}$/)
    }
    expect(new Set(ALL_LANGS).size).toBe(ALL_LANGS.length)
  })

  it('hər dilin tam metası, SEO mətni və Quran məlumat faylı var', () => {
    for (const c of EXTRA_CODES) {
      const x = EXTRA_LANGS[c]
      expect(x.name && x.en && x.by, c).toBeTruthy()
      expect(['ltr', 'rtl']).toContain(x.dir)
      expect(LOCALES[c]).toMatch(/^[a-z]{2}_[A-Z]{2}$/)
      expect(INTL_QURAN[c], c).toBeTruthy()
      expect(INTL_BODY_UI[c], c).toBeTruthy()
      expect(INTL_QURAN_LIST[c], c).toBeTruthy()
      expect(INTL_QURAN_SECTION[c], c).toBeTruthy()
      const file = path.join(ROOT, 'seo-data', 'quran', `${x.quran}.json`)
      expect(fs.existsSync(file), file).toBe(true)
    }
  })

  it('nəşr faylı tamdır: 114 surə, boş ayə yoxdur', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo-data', 'quran', 'meta.json'), 'utf8'))
    for (const c of EXTRA_CODES) {
      const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo-data', 'quran', `${EXTRA_LANGS[c].quran}.json`), 'utf8'))
      expect(d.edition.identifier).toBe(EXTRA_LANGS[c].quran)
      expect(d.ayahs).toHaveLength(114)
      d.ayahs.forEach((s, i) => {
        expect(s.length, `${c} ${i + 1}`).toBe(meta[i].ayahs)
        for (const a of s) expect(stripTranslationNotes(a).length, `${c} ${i + 1}`).toBeGreaterThan(0)
      })
    }
  })

  it('bəsmələ mətni nəşrin Fatihə 1:1 ayəsindən götürülüb (hərfbəhərf)', () => {
    for (const c of EXTRA_CODES) {
      const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo-data', 'quran', `${EXTRA_LANGS[c].quran}.json`), 'utf8'))
      expect(EXTRA_LANGS[c].basmala.length, c).toBeGreaterThan(5)
      expect(stripTranslationNotes(d.ayahs[0][0]).startsWith(EXTRA_LANGS[c].basmala), c).toBe(true)
    }
  })

  it('tərcüməçinin latın yazılışı var (lisenziyalar səhifəsi bütün dillərdə)', () => {
    for (const c of EXTRA_CODES) {
      const v = EXTRA_LANGS[c].byLatin || EXTRA_LANGS[c].by
      expect(v, c).toMatch(/^[\p{Script=Latin} .,'-]+$/u)
      expect(v, c).not.toMatch(/\b(the|and|of)\b/)
    }
  })

  it('serverin statistika dilləri reyestrlə eynidir (server/analytics.js)', () => {
    const src = fs.readFileSync(path.join(ROOT, 'server', 'analytics.js'), 'utf8')
    const m = /const EXTRA_LANGS = \[([^\]]*)\]/.exec(src)
    expect(m).toBeTruthy()
    const list = m[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean)
    expect(list).toEqual(EXTRA_CODES)
  })
})

describe('marşrut', () => {
  it('əlavə dildə yalnız EXTRA_PAGES səhifələri var; qalanı ingiliscəyə düşür', () => {
    expect(EXTRA_PAGES).toEqual(['quran'])
    expect(pathFor('quran', 'id')).toBe('/id/quran')
    expect(pathFor('quran', 'ur', 36)).toBe('/ur/quran/36-yaseen')
    expect(pathFor('prayer', 'de')).toBe('/en/prayer')
    expect(pathFor('home', 'fa')).toBe('/en')
    expect(hasPageInLang('quran', 'de')).toBe(true)
    expect(hasPageInLang('hadith', 'de')).toBe(false)
    expect(hasPageInLang('hadith', 'ru')).toBe(true)
  })

  it('parsePath: əlavə dilin Quranı tanınır, olmayan səhifə fallback alır', () => {
    expect(parsePath('/id/quran/36-yaseen')).toMatchObject({ lang: 'id', key: 'quran', known: true, param: 36 })
    expect(parsePath('/zh/quran')).toMatchObject({ lang: 'zh', key: 'quran', known: true, param: null })
    expect(parsePath('/de/prayer')).toMatchObject({ lang: 'de', key: 'prayer', known: true, fallback: true })
    // İnterfeysi tərcümə olunmuş dil (ui: true) — bütün səhifələr
    expect(parsePath('/id/prayer').fallback).toBeUndefined()
    expect(parsePath('/de')).toMatchObject({ lang: 'de', key: 'home', fallback: true })
    const sb = detailParams('sahaba')[0]
    expect(parsePath(`/de/sahaba/${sb}`)).toMatchObject({ key: 'sahaba', param: sb, fallback: true })
    expect(pathFor('sahaba', 'de', sb)).toBe(`/en/sahaba/${sb}`)
    expect(parsePath('/id/nope').known).toBe(false)
    expect(parsePath('/en/quran').fallback).toBeUndefined()
  })

  it('pathFor → parsePath hər əlavə dil və surə üçün geri dönür', () => {
    for (const c of EXTRA_CODES) {
      for (const n of [1, 2, 36, 114]) {
        expect(parsePath(pathFor('quran', c, n))).toMatchObject({ lang: c, key: 'quran', param: n })
      }
    }
  })

  it('hreflang dilləri: Quran — 25, digər səhifələr — 5 + interfeysi tərcümə olunmuş dillər', () => {
    expect(langsFor('quran')).toEqual(ALL_LANGS)
    expect(langsFor('prayer')).toEqual([...LANGS, ...EXTRA_CODES.filter(c => EXTRA_LANGS[c].ui)])
  })

  it('interfeys dili və istiqamət', () => {
    expect(uiLang('id')).toBe('en')
    expect(uiLang('ru')).toBe('ru')
    expect(dirOf('ar')).toBe('rtl')
    expect(dirOf('ur')).toBe('rtl')
    expect(dirOf('fa')).toBe('rtl')
    expect(dirOf('id')).toBe('ltr')
  })
})

describe('SEO mətnləri', () => {
  it('surə başlığı ≤ 60 simvol (brendlə), təsvir ≤ 160 və kəsilmir, boş sahə yoxdur', () => {
    for (const c of EXTRA_CODES) {
      for (const n of detailParams('quran')) {
        const m = detailMeta('quran', c, n)
        const t = titleForDetail('quran', c, n)
        expect(m.t.length, `${c} ${n}: ${m.t}`).toBeLessThanOrEqual(60)
        expect(t.length).toBeLessThanOrEqual(60 + ' | Muslims.cc'.length)
        expect(m.d.length, `${c} ${n}`).toBeLessThanOrEqual(160)
        expect(m.d.endsWith('…'), `${c} ${n}: ${m.d}`).toBe(false)
        expect(JSON.stringify(m)).not.toMatch(/\bundefined\b|\bnull\b|NaN/)
      }
    }
  })

  it('surənin ingiliscə mənası başqa dilin mətninə qatılmır', () => {
    for (const c of EXTRA_CODES) {
      const s = surahInfo(2, c)
      expect(s.meaning).toBe('')
      expect(detailMeta('quran', c, 2).d).not.toMatch(/The Cow/)
    }
  })

  it('urdu/fars/puştuda surənin adı ərəbcədir, digərlərində latınca', () => {
    expect(surahInfo(36, 'ur').name).toBe(surahInfo(36, 'ar').arName)
    expect(surahInfo(36, 'id').name).toBe('Yaseen')
    expect(detailMeta('quran', 'fa', 36).h1).toMatch(/^سوره /)
  })

  it('siyahı səhifəsinin title/description-u öz dilindədir', () => {
    for (const c of EXTRA_CODES) {
      expect(descFor('quran', c)).toBe(INTL_QURAN_LIST[c].d)
      expect(INTL_QURAN_LIST[c].t.length, c).toBeLessThanOrEqual(60)
      expect(INTL_QURAN_LIST[c].d.length, c).toBeLessThanOrEqual(160)
      expect(titleFor('quran', c)).toContain(INTL_QURAN_LIST[c].t)
    }
    // Olmayan səhifə əlavə dildə azərbaycancaya YOX, ingiliscəyə düşür
    expect(titleFor('prayer', 'de')).toBe(titleFor('prayer', 'en'))
  })

  it('sxem, iz, brend və OG kartı', () => {
    const j = detailJsonLd('quran', 'fr', 1)
    expect(JSON.stringify(j)).toContain('Le Saint Coran')
    expect(j.mainEntity?.inLanguage || JSON.stringify(j)).toBeTruthy()
    const cr = crumbsFor('quran', 'de', 2)
    expect(cr[1]).toMatchObject({ name: 'Der Koran', url: 'https://muslims.cc/de/quran' })
    expect(brandName('id')).toBe('Muslims.cc')
    expect(ogImageFor('id')).toBe(ogImageFor('en'))
    expect(BODY_UI.id.prevSurah).toBe('Surat sebelumnya')
    expect(BODY_UI.id.open).toBe(BODY_UI.en.open)
  })

  it('yerli rəqəmlər (fars, puştu, benqal)', () => {
    expect(localDigits(114, 'fa')).toBe('۱۱۴')
    expect(localDigits(36, 'bn')).toBe('৩৬')
    expect(localDigits(36, 'ur')).toBe('36')
  })
})

describe('köməkçilər', () => {
  it('stripTranslationNotes: [[…]] qeydləri ayrılır, tərcümə qalır', () => {
    expect(stripTranslationNotes('ستایش خدا را. [[«رَبِّ»: پروردگار.]]')).toBe('ستایش خدا را.')
    expect(stripTranslationNotes('A [[x]] b [[y]]')).toBe('A b')
    expect(stripTranslationNotes('Plain text')).toBe('Plain text')
  })

  it('brauzer dili: indoneziyalı ziyarətçi id alır, az qaydası üstündür', () => {
    expect(pickBrowserLang(['id-ID', 'en'], 'Asia/Jakarta', ALL_LANGS)).toBe('id')
    expect(pickBrowserLang(['ur-PK'], 'Asia/Karachi', ALL_LANGS)).toBe('ur')
    expect(pickBrowserLang(['ru-RU'], 'Asia/Baku', ALL_LANGS)).toBe('az')
    expect(pickBrowserLang(['ja-JP'], 'Asia/Tokyo', ALL_LANGS)).toBe('en')
  })
})
