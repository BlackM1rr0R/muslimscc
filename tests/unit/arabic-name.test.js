// Ad → ərəb yazısı (utils/arabicName) — lüğət, variantlar, təxmini transliterasiya, "Əbd" qeydi
import { describe, it, expect } from 'vitest'
import { toArabic, lookupName, foldKey, transliterate, isAbdOther, phonetic, PICKER_LETTERS } from '../../src/utils/arabicName.js'
import { NAMES, MEANINGS } from '../../src/data/arabicNames.js'

describe('lüğət', () => {
  it('az / tr / en / ru variantları eyni standart yazılışa düşür', () => {
    for (const v of ['Muhammad', 'Məhəmməd', 'Mehmet', 'Мухаммад', 'Магомед', 'MOHAMMED']) expect(toArabic(v).ar).toBe('محمد')
    expect(toArabic('Əhməd').ar).toBe('أحمد')
    expect(toArabic('Fatimə').ar).toBe('فاطمة')
    expect(toArabic('Ayşe').ar).toBe('عائشة')
    expect(toArabic('Хадиджа').ar).toBe('خديجة')
    expect(toArabic('Hüseyn').ar).toBe('حسين')
    expect(toArabic('Yusif').ar).toBe('يوسف')
    expect(toArabic('İbrahim').ar).toBe('إبراهيم')
    expect(toArabic('Leyla').ar).toBe('ليلى')
    expect(toArabic('Nur').ar).toBe('نور')
    expect(toArabic('Abdul Rahman').ar).toBe('عبد الرحمن')
    expect(toArabic('Əbdürrəhman').ar).toBe('عبد الرحمن')
  })
  it('lüğətdən gələn ad təxmini deyil; məna yalnız dəqiq olanlarda', () => {
    const r = toArabic('Muhammad')
    expect(r.approximate).toBe(false)
    expect(r.mean.en).toMatch(/praised/)
    expect(toArabic('Yusuf').mean).toBeNull()
    expect(toArabic('Maryam').mean).toBeNull()
    expect(toArabic('Abdurrahman').mean.en).toMatch(/Most Merciful/)
  })
  it('hər variant öz sətrinə düşür (toqquşma yoxdur), məna açarları mövcuddur', () => {
    for (const [ar, variants, mean] of NAMES) {
      for (const v of variants) expect(lookupName(v)?.ar, v).toBe(ar)
      if (mean) expect(MEANINGS[mean], mean).toBeTruthy()
      expect(ar).toMatch(/^[ء-ي ]+$/)
    }
    for (const m of Object.values(MEANINGS)) expect(Object.keys(m).sort()).toEqual(['ar', 'az', 'en', 'ru', 'tr'])
  })
  it('yumşaq axtarış: sait fərqi və qoşa hərf', () => {
    expect(lookupName('Mustafaa')?.ar).toBe('مصطفى')
    expect(lookupName('Omer')?.ar).toBe('عمر')
  })
})

describe('təxmini transliterasiya', () => {
  it('lüğətdə olmayan ad — təxmini, söz-söz', () => {
    const r = toArabic('Elnur Aliyev')
    expect(r.approximate).toBe(true)
    expect(r.parts.map(p => p.kind)).toEqual(['approx', 'approx'])
    expect(r.ar).toBe('إلنور أليف')
  })
  it('qarışıq: bir söz lüğətdən, biri təxmini', () => {
    const r = toArabic('Ali Nargiz')
    expect(r.parts[0]).toMatchObject({ ar: 'علي', kind: 'dict' })
    expect(r.parts[1].kind).toBe('approx')
    expect(r.approximate).toBe(true)
  })
  it('hərf qaydaları: ş, ç, x, q, ə, qoşa samit', () => {
    expect(transliterate('Şahin')).toBe('شاهين')
    expect(transliterate('Çingiz')).toBe('تشينغيز')
    expect(transliterate('Xəyyam')).toBe('خايام')
    expect(transliterate('Qurban')).toBe('قوربان')
    expect(transliterate('Anna')).toBe('أنا')
  })
  it('kiril → fonetik latın', () => {
    expect(phonetic('Шамиль')).toBe('şamil')
    expect(transliterate('Тимур')).toBe('تيمور')
    expect(foldKey('Хасан')).toBe('khasan')
  })
  it('boş və ya hərfsiz giriş', () => {
    expect(toArabic('').ar).toBe('')
    expect(toArabic('123 !!').ar).toBe('')
  })
  it('hərf seçicidə 28 hərf', () => {
    expect(PICKER_LETTERS).toHaveLength(28)
  })
})

describe('"Əbd" + Allahdan başqası', () => {
  it('Əbdünnəbi, Abdulhuseyn, Abdurrasul — qeyd göstərilir', () => {
    for (const v of ['Abdunnabi', 'Abdul Nabi', 'Abdulhuseyn', 'Abdurrasul', 'Абдулхусейн', 'Abdul-Zahra']) expect(isAbdOther(v), v).toBe(true)
    expect(toArabic('Abdunnabi').abdNote).toBe(true)
    expect(toArabic('Elnur Abdunnabi').abdNote).toBe(true)
    expect(toArabic('Abdullah Aliyev').abdNote).toBe(false)
  })
  it('Allahın adları ilə olanlar və adi adlar — qeyd yoxdur', () => {
    for (const v of ['Abdullah', 'Abdurrahman', 'Abdulaziz', 'Abdulali', 'Abdulmuttalib', 'Nabi', 'Ali']) expect(isAbdOther(v), v).toBe(false)
  })
})
