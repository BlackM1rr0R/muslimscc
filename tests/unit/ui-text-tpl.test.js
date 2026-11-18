// B2 2.8: say ifadələri bütöv ifadə kimi ("1 day" / "{0} days") — əlavə dillərdə isim ingiliscə qalmır;
// şablon seçimi ən çox sabit hərfi olan şablona üstünlük verir; extract-ui-strings açarları toplayır
// və köhnə `${n} ${n === 1 ? 'day' : 'days'}` nümunəsini tapır (npm run check → check-lang.mjs).
import { describe, it, expect, afterEach } from 'vitest'
import { setUiDict, txt, pickUi } from '../../src/utils/uiText.js'
import { ayahCountText, countText } from '../../src/utils/quranText.js'
import { pluralTernariesIn, findPluralTernaries, extractUiStrings, isUiText } from '../../scripts/extract-ui-strings.mjs'

afterEach(() => setUiDict(null, null))

const DE = {
  'Mentioned 1 time in the Quran': '1-mal im Koran erwähnt',
  'Mentioned {0} times in the Quran': '{0}-mal im Koran erwähnt',
  '{0} times in the Quran': '{0}-mal im Koran',
  '1 day': '1 Tag',
  '{0} days': '{0} Tage',
  'Streak: 1 day': 'Serie: 1 Tag',
  'Streak: {0} days': 'Serie: {0} Tage',
  '1 verse': '1 Vers',
  '{0} verses': '{0} Verse',
}

describe('şablon seçimi (uiText.buildTpl)', () => {
  it('"Mentioned 5 times in the Quran" daha dəqiq şablonla tərcümə olunur', () => {
    setUiDict('de', DE)
    expect(txt('Mentioned 5 times in the Quran')).toBe('5-mal im Koran erwähnt')
    expect(txt('Mentioned 1 time in the Quran')).toBe('1-mal im Koran erwähnt')
    expect(txt('12 times in the Quran')).toBe('12-mal im Koran')
  })

  it('"1 day" və "5 days" — hər ikisi tərcümə olunur, "Streak: 5 days" öz şablonunu tapır', () => {
    setUiDict('de', DE)
    expect(txt('1 day')).toBe('1 Tag')
    expect(txt('5 days')).toBe('5 Tage')
    expect(txt('Streak: 5 days')).toBe('Serie: 5 Tage')
  })

  it('5 dilli obyektdəki bütöv ifadə funksiyası pickUi ilə tərcümə olunur', () => {
    setUiDict('de', DE)
    const T = { az: { streak: (n) => `Seriya: ${n} gün` }, en: { streak: (n) => (n === 1 ? 'Streak: 1 day' : `Streak: ${n} days`) } }
    expect(pickUi(T, 'en').streak(1)).toBe('Serie: 1 Tag')
    expect(pickUi(T, 'en').streak(7)).toBe('Serie: 7 Tage')
  })
})

describe('ayahCountText / countText (utils/quranText)', () => {
  it('en — bütöv ifadə, əlavə dildə lüğətlə', () => {
    expect(ayahCountText(1, 'en')).toBe('1 verse')
    expect(ayahCountText(286, 'en')).toBe('286 verses')
    setUiDict('de', DE)
    expect(ayahCountText(1, 'en')).toBe('1 Vers')
    expect(ayahCountText(286, 'en')).toBe('286 Verse')
  })

  it('ru / ar / az — əvvəlki kimi cəm qaydası ilə', () => {
    expect(ayahCountText(123, 'ru')).toBe('123 аята')
    expect(ayahCountText(7, 'ru')).toBe('7 аятов')
    expect(ayahCountText(7, 'ar')).toBe('7 آيات')
    expect(ayahCountText(286, 'az')).toBe('286 ayə')
    expect(countText(3, 'tr', { tr: 'gün', en: (n) => `${n} days` })).toBe('3 gün')
  })
})

describe('extract-ui-strings: say ifadələri', () => {
  it('köhnə nümunə tapılır, bütöv ifadə tapılmır', () => {
    const bad = "const T = { az: { d: (n) => `${n} gün` }, en: { d: (n) => `${n} ${n === 1 ? 'day' : 'days'}` } }"
    const good = "const T = { az: { d: (n) => `${n} gün` }, en: { d: (n) => (n === 1 ? '1 day' : `${n} days`) } }"
    const viaTxt = "const f = (n) => txt(`${n} ${n === 1 ? 'fact' : 'facts'}`)"
    expect(pluralTernariesIn(bad)).toHaveLength(1)
    expect(pluralTernariesIn(viaTxt)).toHaveLength(1)
    expect(pluralTernariesIn(good)).toHaveLength(0)
    // sinif adı ternarı (5 dilli obyektdən kənar) — xəta deyil
    expect(pluralTernariesIn("const c = `a ${x === 1 ? 'on' : 'off'}`")).toHaveLength(0)
  })

  it('saytda köhnə nümunə qalmayıb', () => {
    expect(findPluralTernaries()).toEqual([])
  }, 120000)

  it('bütöv ifadə açarları çıxarılır (5 dilli obyekt, txt(), quranText)', () => {
    const keys = new Set(extractUiStrings())
    for (const k of ['1 day', '{0} days', 'Mentioned 1 time in the Quran', 'Mentioned {0} times in the Quran',
      '1 verse', '{0} verses', '1 fact', '{0} facts', '1 step', '{0} steps', 'Streak · day', '1 ayah']) {
      expect(keys.has(k), k).toBe(true)
    }
    // tək kiçik hərfli söz hələ də identifikator sayılır (ona görə bütöv ifadə lazımdır)
    expect(isUiText('days')).toBe(false)
  }, 120000)
})
