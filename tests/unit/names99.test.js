// Allahın 99 adı — siyahı Şeyx İbn Useyminin "əl-Qavaid əl-Musla" kitabındakı
// siyahı ilə EYNİ olmalıdır (ardıcıllıq da kitabdakı kimi: 81 Qurandan, 18 Sünnədən).
// Mənbə mətni iki nəşrdə tutuşdurulub: shamela.ws/book/8874/19-20 və
// shamela.ws/book/12293/884-885 (Məcmu Fətava və Rəsail əl-Useymin).
import { describe, it, expect } from 'vitest'
import { NAMES_99 } from '../../src/data/names99.js'
import { NAME_SLUGS, REMOVED_NAME_SLUGS } from '../../src/seo/detailSlugs.js'

// Kitabdakı mətn (hərəkəsiz), olduğu kimi
const FROM_QURAN = 'الله الأحد الأعلى الأكرم الإله الأول الآخر الظاهر الباطن البارئ البر البصير التواب الجبار الحافظ الحسيب الحفيظ الحفي الحق المبين الحكيم الحليم الحميد الحي القيوم الخبير الخالق الخلاق الرؤوف الرحمن الرحيم الرزاق الرقيب السلام السميع الشاكر الشكور الشهيد الصمد العالم العزيز العظيم العفو العليم العلي الغفار الغفور الغني الفتاح القادر القاهر القدوس القدير القريب القوي القهار الكبير الكريم اللطيف المؤمن المتعالي المتكبر المتين المجيب المجيد المحيط المصور المقتدر المقيت الملك المليك المولى المهيمن النصير الواحد الوارث الواسع الودود الوكيل الولي الوهاب'.split(' ')
const FROM_SUNNAH = 'الجميل الجواد الحكم الحيي الرب الرفيق السبوح السيد الشافي الطيب القابض الباسط المقدم المؤخر المحسن المعطي المنان الوتر'.split(' ')

// Müqayisə açarı: hərəkələr, tətvil, alif (adi və xəncəri) atılır, həmzə formaları
// birləşir — Uthmani yazılış (ٱلرَّحۡمَٰنُ) ilə sadə yazılış (الرحمن) eyni olsun.
const key = (s) => String(s)
  .replace(/[ً-ٟۖ-ۭـ]/g, '')
  .replace(/ٱ/g, 'ا').replace(/[أإآؤ]/g, 'ء').replace(/[اٰ]/g, '')

describe('99 ad — İbn Useymin, "əl-Qavaid əl-Musla"', () => {
  it('kitabda 81 + 18 = 99 ad', () => {
    expect(FROM_QURAN).toHaveLength(81)
    expect(FROM_SUNNAH).toHaveLength(18)
    expect(NAMES_99).toHaveLength(99)
  })

  it('siyahı və ardıcıllıq kitabdakı ilə eynidir', () => {
    expect(NAMES_99.map(x => key(x.ar))).toEqual([...FROM_QURAN, ...FROM_SUNNAH].map(key))
  })

  it('ilk və son adlar', () => {
    expect(NAMES_99[0]).toMatchObject({ n: 1, tr: 'Allah' })
    expect(NAMES_99[80]).toMatchObject({ n: 81, tr: 'Al-Wahhab' })
    expect(NAMES_99[81]).toMatchObject({ n: 82, tr: 'Al-Jamil' })
    expect(NAMES_99[98]).toMatchObject({ n: 99, tr: 'Al-Witr' })
  })

  it('nömrələr ardıcıldır, adlar təkrarlanmır', () => {
    expect(NAMES_99.map(x => x.n)).toEqual(Array.from({ length: 99 }, (_, i) => i + 1))
    expect(new Set(NAMES_99.map(x => x.ar)).size).toBe(99)
    expect(new Set(NAMES_99.map(x => x.tr.toLowerCase())).size).toBe(99)
  })

  it('hər adın sübutu var: 1–81 Quran (surə:ayə), 82–99 Sünnə (kitab + nömrə)', () => {
    for (const x of NAMES_99) {
      if (x.n <= 81) {
        expect(x.proof.q, x.tr).toMatch(/^\d{1,3}:\d{1,3}$/)
        const [s, a] = x.proof.q.split(':').map(Number)
        expect(s >= 1 && s <= 114 && a >= 1, x.tr).toBe(true)
      } else {
        expect(typeof x.proof.s, x.tr).toBe('string')
        expect(x.proof.s.length, x.tr).toBeGreaterThan(3)
      }
      // köhnə "x" (Quran/Sünnədə ad kimi yoxdur) qeydi qalmamalıdır
      expect(x.proof.x, x.tr).toBeUndefined()
    }
  })

  it('hər adın 4 dildə mənası və ərəbcə yazılışı var', () => {
    for (const x of NAMES_99) {
      for (const f of ['ar', 'tr', 'az', 'en', 'ru', 'tr_meaning']) {
        expect(String(x[f] || '').trim().length, `${x.n}.${f}`).toBeGreaterThan(0)
      }
      expect(x.tr_meaning, x.tr).not.toMatch(/[əƏ]/)
      expect(x.ru, x.tr).toMatch(/[а-яё]/i)
    }
  })

  it('köhnə siyahıdan çıxarılmış slug-lar yeni slug-larla kəsişmir', () => {
    expect(REMOVED_NAME_SLUGS.filter(s => NAME_SLUGS.includes(s))).toEqual([])
    expect(new Set(REMOVED_NAME_SLUGS).size).toBe(REMOVED_NAME_SLUGS.length)
  })
})
