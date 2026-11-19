// Hisnul-Müslim mənbələri (B2 2.1): fəsil 29 və 28-də sürüşmüş təxriclər öz bəndlərinə qaytarılıb,
// 5 dil bənd-bənd eyni istinadları daşıyır (scripts/check-hisn-sources.mjs)
import { describe, it, expect } from 'vitest'
import { loadHisn, checkHisn, refSig, LANGS, KNOWN, MISSING_REF } from '../../scripts/check-hisn-sources.mjs'

const data = loadHisn()
const ch29 = (l) => data[l].chapters.find((c) => c.id === 29).items

describe('Hisn fəsil 29 — yatmazdan əvvəl zikrlər', () => {
  it('12-ci bənd (Səcdə + Mülk) Müslimə aid edilmir, Tirmizi 2892 göstərilir', () => {
    for (const l of LANGS) {
      expect(ch29(l)[11].src).not.toMatch(/Muslim|Müslim|Муслим|مسلم/)
      expect(refSig(ch29(l)[11].src)).toBe('2892')
    }
    expect(ch29('en')[11].src).toBe('At-Tirmidhi 2892')
  })

  it('5-ci bənd (Allahumma xalaqta nafsi) — Müslim 4/2083', () => {
    expect(ch29('en')[4].src).toContain('Muslim 4/2083')
    expect(ch29('az')[4].src).toContain('Müslim 4/2083')
  })

  it('4 və 6-cı bəndlər öz hədis girişi ilə istinadını birlikdə daşıyır', () => {
    expect(ch29('en')[3].src).toMatch(/\(the hadith\) Al-Bukhari 11\/126 and Muslim 4\/2084$/)
    expect(ch29('en')[5].src).toMatch(/right hand under his cheek.*Abu Dawud with this wording 4\/311/)
  })

  it('8-ci bənd (33/33/34 təsbih) "xidmətçidən xeyirli" haşiyəsini, 13-cü bənd Buxari/Müslimi daşıyır', () => {
    expect(ch29('en')[7].src).toMatch(/better for him than a servant/)
    expect(ch29('en')[12].src).toBe('Al-Bukhari 6313 and Muslim 2710')
    expect(ch29('en')[10].src).toMatch(/^Abu Dawud 4\/317/)
  })

  it('fəsil 29-da istinadsız haşiyə qalmayıb', () => {
    for (const it of ch29('ar')) expect(refSig(it.src)).not.toBe('')
  })
})

const ch28 = (l) => data[l].chapters.find((c) => c.id === 28).items

// Fəsil 28: axşam variantları öz bəndinə birləşdirilib, istinadlar sürüşmədən qaytarılıb
describe('Hisn fəsil 28 — səhər və axşam zikrləri', () => {
  it('hər bənd öz istinadını daşıyır (ərəb faylı ilə)', () => {
    const want = {
      4: '4/2088', // Müslim — أصبحنا وأصبح الملك لله
      5: '5/466,3/142', // Tirmizi — اللهم بك أصبحنا
      6: '7/150', // Buxari — Seyyidul-istiğfar
      9: '4/324,5/42,22,69,26', // اللهم عافني في بدني
      12: '3/142', // اللهم عالم الغيب والشهادة
      15: '1/545,1/273', // يا حي يا قيوم
    }
    for (const [n, sig] of Object.entries(want)) for (const l of LANGS) expect(refSig(ch28(l)[n - 1].src)).toBe(sig)
  })

  it('10-cu bənd (Həsbiyallah 7 dəfə) Buxari 7/150 yox, "yeddi dəfə" haşiyəsini daşıyır', () => {
    expect(ch28('ar')[9].src).toMatch(/سبع مرات/)
    expect(ch28('en')[9].src).toMatch(/^Whoever says it seven times/)
    expect(ch28('en')[9].src).not.toMatch(/Bukhari 7\/150/)
  })

  it('axşam variantları öz bəndinə birləşib, istinaddan əvvəl gəlir', () => {
    expect(ch28('ar')[3].src).toMatch(/^وإذا أمسى قال : أمسينا وأمسى الملك لله.*خير ما في هذه الليلة.*مسلم 4\/ 2088$/)
    expect(ch28('en')[6].src).toMatch(/^And in the evening he says: «O Allah, I have entered the evening\.\.\.»\. Whoever says it four times/)
    expect(ch28('en')[7].src).toMatch(/whatever has come to me this evening.*gratitude due for his day/)
    expect(ch28('en')[15].src).toMatch(/Lord of the worlds».*good of this night.*Abu Dawud 4\/322/)
  })

  it('17–25-ci bəndlər kitabdakı öz istinadını daşıyır (5 dildə eyni)', () => {
    const want = {
      17: '3/406,407,34,4/209', // Əhməd — أصبحنا على فطرة الإسلام
      18: '4/2071', // Müslim — سبحان الله وبحمده (100)
      19: '24,1/272,44,146,255,4/319,4/60,1/270,3/957,2/331,2/377', // Nəsai 24 (10 dəfə) + Əbu Davud 4/319 (bir dəfə)
      20: '4/95,4/2071', // Buxari/Müslim — لا إله إلا الله … (100)
      21: '4/2090', // Müslim — سبحان الله وبحمده عدد خلقه
      22: '54,925,2/375', // İbn əs-Sunni, İbn Macə — علماً نافعاً
      23: '11/101,4/2075', // Buxari/Müslim — أستغفر الله وأتوب إليه
      24: '2/290,590,68,3/187,2/266,45', // Əhməd — أعوذ بكلمات الله التامات
      25: '10/120,1/273', // Təbərani — salavat 10 dəfə
    }
    for (const [n, sig] of Object.entries(want)) for (const l of LANGS) expect(refSig(ch28(l)[n - 1].src)).toBe(sig)
    expect(ch28('ar')[16].src).toMatch(/^وإذا أمسى قال: أمسينا على فطرة الإسلام\. أحمد 3\/ 406/)
    expect(ch28('en')[16].src).toMatch(/^And in the evening he says: «We have entered the evening upon the fitrah of Islam»\. Ahmad 3\/406/)
    expect(ch28('ar')[17].src).toMatch(/مسلم4 \/ 2071$/)
    expect(ch28('en')[20].src).toBe('Muslim 4/2090')
    expect(ch28('az')[22].src).toBe('Buxari («Fəth» ilə) 11/101 və Müslim 4/2075')
    expect(MISSING_REF).toEqual({})
    expect(KNOWN).toEqual({})
  })

  it('fəsil 28-də istinadsız bənd qalmayıb', () => {
    for (const l of LANGS) for (const it of ch28(l)) expect(refSig(it.src)).not.toBe('')
  })

  it('fəsil 28-də istinad bir bənd sürüşəndə xəta verir', () => {
    const bad = JSON.parse(JSON.stringify(data))
    const it = bad.tr.chapters.find((c) => c.id === 28).items
    it.splice(17, 0, { ar: it[17].ar, src: it[16].src }) // 18-dən sonrakılar bir bənd aşağı düşür
    it.pop()
    const { errors } = checkHisn(bad)
    expect(errors.some((e) => /fəsil 28 bənd 18: tr/.test(e))).toBe(true)
    expect(errors.some((e) => /fəsil 28 bənd 25: tr/.test(e))).toBe(true)
  })
})

describe('check-hisn-sources', () => {
  it('5 dil bənd-bənd uyğundur, skript xətasız keçir', () => {
    const { errors } = checkHisn(data)
    expect(errors).toEqual([])
  })

  it('istinad başqa bəndə sürüşəndə xəta verir', () => {
    const bad = JSON.parse(JSON.stringify(data))
    const it = bad.en.chapters.find((c) => c.id === 29).items
    ;[it[10].src, it[11].src] = [it[11].src, it[10].src]
    const { errors } = checkHisn(bad)
    expect(errors.some((e) => /fəsil 29 bənd 11: en/.test(e))).toBe(true)
  })

  it('MISSING_REF bəndinə istinad düşəndə xəta verir', () => {
    const bad = JSON.parse(JSON.stringify(data))
    const { errors } = checkHisn(bad, { missingRef: { 28: [18] } })
    expect(errors.some((e) => /fəsil 28 bənd 18: MISSING_REF/.test(e))).toBe(true)
    expect(checkHisn(bad, { missingRef: { 28: [18] } }).errors).toHaveLength(1)
  })

  it('ərəb faylında istinadsız haşiyə xəta, KNOWN-da isə xəbərdarlıq verir', () => {
    const bad = JSON.parse(JSON.stringify(data))
    for (const l of LANGS) bad[l].chapters.find((c) => c.id === 28).items[16].src = 'وإذا أمسى قال: أمسينا على فطرة الإسلام'
    expect(checkHisn(bad).errors.some((e) => /fəsil 28: bənd 17: istinadsız haşiyə/.test(e))).toBe(true)
    const r = checkHisn(bad, { known: { '28:17': 'test' } })
    expect(r.errors).toEqual([])
    expect(r.warnings.some((w) => /bənd 17: istinadsız/.test(w))).toBe(true)
  })

  it('refSig ərəb rəqəmlərini və gizli işarələri normallaşdırır', () => {
    expect(refSig('البخاري 6/‌214 والترمذي بلفظه 5/ 507')).toBe('6/214,5/507')
    expect(refSig('مسلم ٤/٢٠٨٣')).toBe('4/2083')
  })
})
