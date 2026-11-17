// Quranın yazı tarixi qat-qat (src/utils/scriptLayers.js, public/data/script-layers.json)
// Sübut olunmalıdır: mətnə heç bir hərf əlavə olunmur, sıra dəyişmir — qatlar yalnız gizlədir.
//   3-cü qat === mənbə mətn (hərfi-hərfinə);
//   2-ci qat === mənbədən yalnız hərəkə/işarələr çıxarılmış mətn;
//   1-ci qat — 2-ci qatın hərf-hərf skeleti: söz sayı, sırası və hər sözün uzunluğu eyni.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import {
  MARKS_RE, stripMarks, toRasm, rasmWord, rasmLetter, layerText, RASM_MAP,
  DOTLESS_BEH, DOTLESS_QAF, DOTLESS_FEH, NOON_GHUNNA, ALEF_MAKSURA,
} from '../../src/utils/scriptLayers.js'
import { displayAyah } from '../../src/utils/quranText.js'

const U = (...cps) => String.fromCodePoint(...cps)
const DATA = JSON.parse(fs.readFileSync('public/data/script-layers.json', 'utf8'))
const UTH = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))

// Nöqtəli hərflər — 1-ci qatda heç biri qalmamalıdır
const DOTTED = 'بتثجخذزشضظغفقنيئةؤأإآٱ'
// Rəsmdə icazə verilən skelet hərfləri
const SKELETON = new Set([...'اٮحدرسصطعڡٯںىهوكلم'])

describe('məlumat faylı — saytın Osmani mətni hərfi-hərfinə', () => {
  it('Fatihə 1–7 və İxlas 1–4, sırası ilə', () => {
    expect(DATA.ayahs.map(a => a.ref)).toEqual(['1:1', '1:2', '1:3', '1:4', '1:5', '1:6', '1:7', '112:1', '112:2', '112:3', '112:4'])
    expect(DATA.edition).toBe('quran-uthmani')
  })
  it('hər ayə seo-data/quran/quran-uthmani.json-dan saytın göstərmə qaydası ilə eynidir', () => {
    for (const a of DATA.ayahs) {
      const raw = UTH.ayahs[a.surah - 1][a.ayah - 1]
      expect(a.text).toBe(displayAyah(raw, a.surah, a.ayah - 1))
    }
  })
  it('displayAyah yalnız BOM-u və 112:1-də təkrar Bəsmələni gizlədir', () => {
    expect(UTH.ayahs[0][0]).toBe(U(0xFEFF) + DATA.ayahs[0].text)
    expect(UTH.ayahs[111][0].endsWith(' ' + DATA.ayahs[7].text)).toBe(true)
  })
})

describe('3-cü qat (+ hərəkələr) — mənbə olduğu kimi', () => {
  it('layerText(t, 3) === t', () => {
    for (const a of DATA.ayahs) expect(layerText(a.text, 3)).toBe(a.text)
  })
})

describe('2-ci qat (+ nöqtələr) — yalnız işarələr çıxarılır', () => {
  it('mənbədən işarələri bir-bir çıxarmaqla eynidir; qalan hər simvol hərf və ya boşluqdur', () => {
    for (const a of DATA.ayahs) {
      const l2 = layerText(a.text, 2)
      const manual = [...a.text].filter(c => !(/\p{Mn}/u.test(c) || [0x06E5, 0x06E6, 0x0640, 0xFEFF].includes(c.codePointAt(0)))).join('')
      expect(l2).toBe(manual)
      for (const c of l2) expect(c === ' ' || /\p{Lo}/u.test(c)).toBe(true)
    }
  })
  it('2-ci qat mənbənin alt-ardıcıllığıdır (heç nə əlavə olunmur, sıra eynidir)', () => {
    for (const a of DATA.ayahs) {
      const src = [...a.text], l2 = [...layerText(a.text, 2)]
      let j = 0
      for (const c of src) if (j < l2.length && c === l2[j]) j++
      expect(j).toBe(l2.length)
      // çıxarılanların hamısı işarədir
      const removed = src.length - l2.length
      expect(removed).toBe((a.text.match(MARKS_RE) || []).length)
    }
  })
  it('hərəkə, tənvin, sükun, şəddə, üstün əlif, mədd, kiçik vav/mim çıxarılır', () => {
    const marks = [0x064E, 0x064F, 0x0650, 0x064B, 0x064C, 0x064D, 0x0652, 0x0651, 0x0670, 0x0653, 0x0654, 0x0655, 0x06E5, 0x06E2, 0x0640]
    expect(stripMarks('ب' + U(...marks) + 'ت')).toBe('بت')
  })
  it('işarə daşıyan hərflər (ٱ أ إ) yerində qalır', () => {
    const l2 = DATA.ayahs.map(a => layerText(a.text, 2)).join(' ')
    expect(l2).toContain('ٱلحمد')
    expect(l2).toContain('إياك')
    expect(l2).toContain('أنعمت')
  })
  it('2-ci qatın gözlənilən mətni (Fatihə 1:1, İxlas 112:4)', () => {
    expect(layerText(DATA.ayahs[0].text, 2)).toBe('بسم ٱلله ٱلرحمن ٱلرحيم')
    expect(layerText(DATA.ayahs[10].text, 2)).toBe('ولم يكن له كفوا أحد')
  })
})

describe('1-ci qat (rəsm) — hərf-hərf nöqtəsiz skelet', () => {
  it('Unicode kod nöqtələri düzgündür', () => {
    expect(DOTLESS_BEH.codePointAt(0)).toBe(0x066E)
    expect(DOTLESS_QAF.codePointAt(0)).toBe(0x066F)
    expect(DOTLESS_FEH.codePointAt(0)).toBe(0x06A1)
    expect(NOON_GHUNNA.codePointAt(0)).toBe(0x06BA)
    expect(ALEF_MAKSURA.codePointAt(0)).toBe(0x0649)
  })
  it('söz sayı, sırası və hər sözün hərf sayı dəyişmir; hər hərf 2-ci qatdakı hərfin skeletidir', () => {
    for (const a of DATA.ayahs) {
      const w2 = layerText(a.text, 2).split(' '), w1 = layerText(a.text, 1).split(' ')
      expect(w1.length).toBe(w2.length)
      w2.forEach((w, i) => {
        const c2 = [...w], c1 = [...w1[i]]
        expect(c1.length).toBe(c2.length)
        c2.forEach((ch, k) => expect(c1[k]).toBe(rasmLetter(ch, k === c2.length - 1)))
      })
    }
  })
  it('1-ci qatda heç bir nöqtəli hərf və ya işarə yoxdur, yalnız skelet hərfləri', () => {
    for (const a of DATA.ayahs) {
      const l1 = layerText(a.text, 1)
      for (const c of l1) {
        if (c === ' ') continue
        expect(DOTTED.includes(c)).toBe(false)
        expect(SKELETON.has(c)).toBe(true)
      }
      expect(MARKS_RE.test(l1)).toBe(false)
      MARKS_RE.lastIndex = 0
    }
  })
  it('xəritə: ب ت ث → ٮ, ج خ → ح, ذ → د, ز → ر, ش → س, ض → ص, ظ → ط, غ → ع, ف → ڡ, ق → ٯ, ة → ه', () => {
    for (const c of 'بتث') expect(RASM_MAP[c]).toBe(DOTLESS_BEH)
    for (const c of 'جخ') expect(RASM_MAP[c]).toBe('ح')
    expect(RASM_MAP['ذ']).toBe('د'); expect(RASM_MAP['ز']).toBe('ر'); expect(RASM_MAP['ش']).toBe('س')
    expect(RASM_MAP['ض']).toBe('ص'); expect(RASM_MAP['ظ']).toBe('ط'); expect(RASM_MAP['غ']).toBe('ع')
    expect(RASM_MAP['ف']).toBe(DOTLESS_FEH); expect(RASM_MAP['ق']).toBe(DOTLESS_QAF); expect(RASM_MAP['ة']).toBe('ه')
  })
  it('mövqe: ن və ي sözün sonunda ں / ى, əvvəl və ortada ٮ', () => {
    expect(rasmWord('نستعين')).toBe(DOTLESS_BEH + 'س' + DOTLESS_BEH + 'ع' + DOTLESS_BEH + NOON_GHUNNA)
    expect(rasmWord('يلد')).toBe(DOTLESS_BEH + 'لد')
    expect(rasmWord('في')).toBe(DOTLESS_FEH + ALEF_MAKSURA)
    expect(rasmWord('من')).toBe('م' + NOON_GHUNNA)
    expect(rasmWord('بين')).toBe(DOTLESS_BEH + DOTLESS_BEH + NOON_GHUNNA)
  })
  it('nöqtəsiz hərflər dəyişmir', () => {
    expect(toRasm('ملك ولله كحسصطعرده')).toBe('ملك ولله كحسصطعرده')
  })
  it('gözlənilən rəsm (Fatihə 1:1, 1:5, İxlas 112:1)', () => {
    const B = DOTLESS_BEH, N = NOON_GHUNNA
    expect(layerText(DATA.ayahs[0].text, 1)).toBe(`${B}سم الله الرحم${N} الرح${B}م`)
    expect(layerText(DATA.ayahs[4].text, 1)).toBe(`ا${B}اك ${B}ع${B}د وا${B}اك ${B}س${B}ع${B}${N}`)
    expect(layerText(DATA.ayahs[7].text, 1)).toBe(`${DOTLESS_QAF}ل هو الله احد`)
  })
  it('qatlar mənbəni dəyişmir (saf funksiya)', () => {
    const t = DATA.ayahs[6].text, copy = String(t)
    layerText(t, 1); layerText(t, 2)
    expect(t).toBe(copy)
  })
})
