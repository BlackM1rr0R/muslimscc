// Hisnul-Müslim zikrinin ərəbcə səhifələri (/ar/hisnul-muslim/<fəsil>-<bənd>, 2026-11-24):
// hisnmuslim.com ilə tutuşdurma (scripts/build-hisn-verified.mjs), marşrut (yalnız ar), meta, sxem, statik blok
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { normAr, dice, compareHisn, publishedSlugs, fingerprint, slugOf, HOLD, DICE_MIN } from '../../scripts/build-hisn-verified.mjs'
import { HISN_DUA_IDS } from '../../src/seo/hisnIds.js'
import {
  DETAILS, pathFor, parsePath, seoLangsFor, canonicalLang, xDefaultLang, detailLangs, detailInLang, detailParams,
} from '../../src/seo/routes.js'
import { detailMeta, titleForDetail, detailJsonLd, hisnInfo, TITLE_MAX } from '../../src/seo/detailData.js'
import { hisnPlain, hisnCrumb, hisnSlug, hisnItem } from '../../src/seo/hisnDua.js'
import { checkJsonLd, expected } from '../../scripts/check-seo-dist.mjs'
import { staticBodyFor } from '../../scripts/seo-body.mjs'
import { buildLlmsFullTxt } from '../../scripts/llms-txt.mjs'
import * as detail from '../../src/seo/detailData.js'

const AR = JSON.parse(fs.readFileSync(path.resolve('public/data/hisn/ar.json'), 'utf8')).chapters
const REPORT = JSON.parse(fs.readFileSync(path.resolve('seo-data/hisn-verified.json'), 'utf8'))

describe('ərəbcə mətnin tutuşdurulması (normAr + Dice)', () => {
  it('hərəkə, tətvil, durğu və əlif/ya/ta-mərbuta formaları nəzərə alınmır', () => {
    expect(normAr('بِسْمِ اللَّهِ')).toBe('بسم الله')
    expect(normAr('((أَعُوذُ بِاللَّهِ))، {قُلْ}')).toBe('اعوذ بالله قل')
    expect(normAr('رَحْمَةٌ عَلَى')).toBe(normAr('رحمه علي'))
    expect(normAr('الـلـه')).toBe('الله')
  })
  it('Dice: eyni mətn 1, fərqli mətn aşağı; hərəkəli/hərəkəsiz eynidir', () => {
    const a = normAr('اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا')
    expect(dice(a, normAr('اللهم بك أصبحنا وبك أمسينا'))).toBe(1)
    expect(dice(a, normAr('سبحان الله وبحمده'))).toBeLessThan(0.5)
    expect(dice('', '')).toBe(0)
    // Bir sözün əlavəsi hələ də yuxarıdır, yarısının itməsi isə həddin altındadır
    expect(dice(a, normAr('اللهم بك أصبحنا وبك أمسينا وبك نحيا'))).toBeGreaterThanOrEqual(DICE_MIN)
    expect(dice(a, normAr('اللهم بك أصبحنا'))).toBeLessThan(DICE_MIN)
  })
  it('compareHisn: ən yaxın qarşılıq, hədd, HOLD fəsli və təxricsiz bənd səhifə almır', () => {
    const ours = [
      { id: 1, items: [{ ar: 'بِسْمِ اللَّهِ', src: 'أبو داود 1' }, { ar: 'نص لا يوجد في المصدر أبدا', src: 'x 2' }] },
      { id: 2, items: [{ ar: 'سبحان الله وبحمده', src: 'مسلم 3' }] },
      { id: 3, items: [{ ar: 'الحمد لله رب العالمين', src: '' }] },
    ]
    const theirs = [{ id: 10, ar: 'بسم الله', repeat: 1 }, { id: 11, ar: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', repeat: 100 }, { id: 12, ar: 'الحمد لله رب العالمين', repeat: 1 }]
    const r = compareHisn(ours, theirs, { hold: { 2: 'test' } })
    expect(r.map(x => [x.slug, x.verified, x.published, x.theirId])).toEqual([
      ['1-1', true, true, 10], ['1-2', false, false, r[1].theirId], ['2-1', true, false, 11], ['3-1', true, false, 12],
    ])
    expect(r[2]).toMatchObject({ hold: 'test', theirRepeat: 100 })
    expect(publishedSlugs(r)).toEqual(['1-1'])
    expect(slugOf(27, 0)).toBe('27-1')
  })
})

describe('commit olunmuş siyahı (seo-data/hisn-verified.json → src/seo/hisnIds.js)', () => {
  it('255 bənd yoxlanıb, səhifə alanlar = HISN_DUA_IDS (fəsil 2 saxlanılır)', () => {
    expect(REPORT.total).toBe(293)
    expect(REPORT.verified).toBe(255)
    expect(HISN_DUA_IDS).toEqual(REPORT.items.filter(x => x.published).map(x => x.slug))
    expect(HISN_DUA_IDS.length).toBe(REPORT.published)
    for (const x of REPORT.items) if (x.published) expect(x.verified && x.score >= DICE_MIN, x.slug).toBe(true)
    expect(Object.keys(HOLD)).toContain('2')
    expect(HISN_DUA_IDS.some(id => id.startsWith('2-'))).toBe(false)
    // Fəsil 1 (zikrin fəziləti) hisnmuslim.com API-də yoxdur — səhifəsi də yoxdur
    expect(HISN_DUA_IDS.some(id => id.startsWith('1-'))).toBe(false)
  })
  it('ar.json dəyişməyib: hər bəndin barmaq izi yoxlama anındakı ilə eynidir (dəyişibsə: build-hisn-verified.mjs)', () => {
    const fp = new Map(REPORT.items.map(x => [x.slug, x.fp]))
    let n = 0
    for (const c of AR) c.items.forEach((it, i) => { n++; expect(fingerprint(it.ar), slugOf(c.id, i)).toBe(fp.get(slugOf(c.id, i))) })
    expect(n).toBe(REPORT.total)
  })
  it('hər səhifənin ərəb mətni və təxrici var', () => {
    for (const id of HISN_DUA_IDS) {
      const x = hisnInfo(id)
      expect(x, id).toBeTruthy()
      expect(x.ar.length).toBeGreaterThan(2)
      expect(x.src.trim().length, id).toBeGreaterThan(2)
    }
  })
})

describe('marşrut — yalnız ərəbcə', () => {
  it('ar ünvanı; başqa dildə siyahı səhifəsi və fallback', () => {
    expect(DETAILS.hisn.langs).toEqual(['ar'])
    expect(detailLangs('hisn')).toEqual(['ar'])
    expect(detailInLang('hisn', 'az')).toBe(false)
    expect(detailInLang('hadith', 'az')).toBe(true)
    expect(pathFor('hisn', 'ar', '27-1')).toBe('/ar/hisnul-muslim/27-1')
    expect(pathFor('hisn', 'az', '27-1')).toBe('/hisnul-muslim')
    expect(pathFor('hisn', 'en', '27-1')).toBe('/en/hisnul-muslim')
    expect(parsePath('/ar/hisnul-muslim/27-1')).toEqual({ lang: 'ar', key: 'hisn', known: true, param: '27-1' })
    expect(parsePath('/hisnul-muslim/27-1')).toMatchObject({ lang: 'az', key: 'hisn', known: true, fallback: true })
    expect(parsePath('/ru/hisnul-muslim/27-1')).toMatchObject({ fallback: true })
    // Yoxlanmamış / saxlanılan bənd → 404
    expect(parsePath('/ar/hisnul-muslim/1-1').known).toBe(false)
    expect(parsePath('/ar/hisnul-muslim/2-1').known).toBe(false)
    expect(parsePath('/ar/hisnul-muslim/27-99').known).toBe(false)
    // Siyahı səhifəsi əvvəlki kimi bütün dillərdə
    expect(parsePath('/hisnul-muslim')).toEqual({ lang: 'az', key: 'hisn', known: true, param: null })
  })
  it('hreflang yalnız ar + x-default → ar; canonical həmişə ar', () => {
    expect(seoLangsFor('hisn', '27-1')).toEqual(['ar'])
    expect(seoLangsFor('hisn', null).length).toBeGreaterThan(5)
    expect(canonicalLang('hisn', 'en', '27-1')).toBe('ar')
    expect(canonicalLang('hisn', 'ar', '27-1')).toBe('ar')
    expect(canonicalLang('hisn', 'en', null)).toBe('en')
    expect(xDefaultLang('hisn', '27-1')).toBe('ar')
    expect(xDefaultLang('hisn', null)).toBe('az')
    const e = expected('hisn', 'ar', '27-1')
    expect(e.canonical).toBe('https://muslims.cc/ar/hisnul-muslim/27-1')
    expect(e.hreflang).toEqual(['ar', 'x-default'])
    expect(e.hrefOf('x-default')).toBe('https://muslims.cc/ar/hisnul-muslim/27-1')
    expect(detailParams('hisn')).toEqual(HISN_DUA_IDS)
  })
})

describe('meta, sxem, statik blok', () => {
  it('başlıq ≤ 60 və description 80–170, hamısı unikal və ərəbcə', () => {
    const t = new Set()
    const d = new Set()
    for (const id of HISN_DUA_IDS) {
      const m = detailMeta('hisn', 'ar', id)
      expect(m.t.length, `${id}: ${m.t}`).toBeLessThanOrEqual(TITLE_MAX)
      expect(m.d.length, id).toBeGreaterThanOrEqual(80)
      expect(m.d.length, id).toBeLessThanOrEqual(170)
      expect(m.t, id).toMatch(/[ء-ي]/)
      expect(m.t + m.d, id).not.toMatch(/[a-zəğışçöü]{3,}/i)
      t.add(m.t)
      d.add(m.d)
    }
    expect(t.size).toBe(HISN_DUA_IDS.length)
    expect(d.size).toBe(HISN_DUA_IDS.length)
  })
  it('nümunə: istixarə duası', () => {
    const m = detailMeta('hisn', 'ar', '27-1')
    expect(m.h1).toBe('دعاء صلاة الاستخارة (1)')
    expect(m.t.startsWith('دعاء صلاة الاستخارة: ')).toBe(true)
    expect(titleForDetail('hisn', 'ar', '9-1')).toBe('الذكر قبل الوضوء: بسم الله | Muslims.cc')
    // Hərəkəsiz qısa ad; səhifədəki mətn isə olduğu kimi
    expect(hisnCrumb('بِسْمِ اللَّهِ')).toBe('بسم الله')
    expect(hisnPlain('{بسم الله}، اللهم')).toBe('بسم الله، اللهم')
    expect(hisnSlug('27-1')).toEqual({ chapter: 27, n: 1 })
    expect(hisnSlug('27')).toBeNull()
    expect(hisnItem(AR, '28-10')).toMatchObject({ chapter: 28, n: 10, index: 9, repeat: 7, ar: AR[27].items[9].ar, src: AR[27].items[9].src })
  })
  it('JSON-LD: WebPage + Quotation (isPartOf Book, müəllif) — keçərlidir', () => {
    for (const id of [HISN_DUA_IDS[0], '28-10', HISN_DUA_IDS.at(-1)]) {
      const j = detailJsonLd('hisn', 'ar', id)
      expect(checkJsonLd(JSON.stringify(j)), id).toEqual([])
      expect(j.url).toBe(`https://muslims.cc/ar/hisnul-muslim/${id}`)
      expect(j.inLanguage).toBe('ar')
      expect(j.mainEntity).toMatchObject({
        '@type': 'Quotation', text: hisnInfo(id).ar, citation: hisnInfo(id).src, inLanguage: 'ar',
        isPartOf: { '@type': 'Book', name: 'حصن المسلم من أذكار الكتاب والسنة', author: { '@type': 'Person', name: 'سعيد بن علي بن وهف القحطاني' } },
      })
      expect(j.breadcrumb.itemListElement.map(x => x.item)).toEqual([
        'https://muslims.cc/ar', 'https://muslims.cc/ar/hisnul-muslim', `https://muslims.cc/ar/hisnul-muslim/${id}`,
      ])
    }
  })
  it('statik blok: ərəbcə mətn (rtl), təkrar sayı, təxric, fəslə link; başqa dildə blok yoxdur', () => {
    const x = hisnInfo('28-10')
    const b = staticBodyFor('hisn', 'ar', '28-10')
    expect(b).toContain('<blockquote lang="ar" dir="rtl" class="seo-static__ar">')
    expect(b).toContain(x.ar.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'))
    expect(b).toContain('<dt>عدد المرات</dt><dd>7 مرات</dd>')
    expect(b).toContain('<dt>التخريج</dt>')
    expect(b).toContain('href="/ar/hisnul-muslim#hs-28"')
    expect(b).toContain('href="/ar/hisnul-muslim/28-9"')
    expect(staticBodyFor('hisn', 'az', '28-10')).toBe('')
    expect(staticBodyFor('hisn', 'az')).toBe('')
    // Ərəbcə siyahı — hər zikr səhifəsinə link
    const list = staticBodyFor('hisn', 'ar')
    for (const id of HISN_DUA_IDS) expect(list).toContain(`href="/ar/hisnul-muslim/${id}"`)
    expect(list).not.toContain('href="/ar/hisnul-muslim/2-1"')
  })
  it('llms-full.txt: hər zikr ərəbcə başlıqla, /ar ünvanı ilə', () => {
    const txt = buildLlmsFullTxt(detail, {})
    expect(txt).toContain('## Hisn al-Muslim')
    for (const id of HISN_DUA_IDS) expect(txt).toContain(`(https://muslims.cc/ar/hisnul-muslim/${id})`)
    expect(txt).not.toContain('https://muslims.cc/en/hisnul-muslim/27-1')
  })
})
