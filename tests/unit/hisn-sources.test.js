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

  it('istinadı faylda olmayan bəndlər (17–25) uydurma istinad daşımır', () => {
    expect(MISSING_REF[28]).toEqual([17, 18, 19, 20, 21, 22, 23, 24, 25])
    for (const l of LANGS) for (const n of MISSING_REF[28]) expect(refSig(ch28(l)[n - 1].src)).toBe('')
    for (const l of LANGS) for (let n = 18; n <= 25; n++) expect(ch28(l)[n - 1].src).toBeUndefined()
    expect(Object.keys(KNOWN)).toEqual(['28:17'])
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
    bad.ar.chapters.find((c) => c.id === 28).items[17].src = 'مسلم 4/ 2071'
    const { errors } = checkHisn(bad)
    expect(errors.some((e) => /fəsil 28 bənd 18: MISSING_REF/.test(e))).toBe(true)
  })

  it('refSig ərəb rəqəmlərini və gizli işarələri normallaşdırır', () => {
    expect(refSig('البخاري 6/‌214 والترمذي بلفظه 5/ 507')).toBe('6/214,5/507')
    expect(refSig('مسلم ٤/٢٠٨٣')).toBe('4/2083')
  })
})
