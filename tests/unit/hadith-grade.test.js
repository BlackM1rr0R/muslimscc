// Hədisin dərəcəsi (utils/hadithGrade.js): qayda sırası və mənbə hökmlərinin oxunması
import { describe, it, expect } from 'vitest'
import { gradeOf, toneOf, gradeGroup } from '../../src/utils/hadithGrade.js'
import { HADITHS } from '../../src/data/hadiths.js'
import { SUNAN_GRADES } from '../../src/data/hadithGrades.js'
import { buildHadithLangData } from '../../src/utils/uniqueHadiths.js'

describe('toneOf — mənbədəki hökm sözü', () => {
  it.each([
    ['Sahih', 's'], ['Hasan Sahih', 's'], ['Sahih Lighairihi', 's'], ['Hasan', 'h'], ['Isnaad Hasan', 'h'],
    ['Daif', 'd'], ['Very Daif', 'd'], ['Sanad Daif', 'd'], ['Sahih Muquf', 'mq'], ['-', null],
  ])('%s → %s', (g, t) => expect(toneOf(g)).toBe(t))
})

describe('gradeOf — qayda sırası', () => {
  it('Səhih Buxari / Müslim → səhih (icma), Ədəb əl-Müfrəd deyil', () => {
    expect(gradeOf({ source: 'Buxari 13' })).toEqual({ g: 's', gb: 'bukhari' })
    expect(gradeOf({ source: 'Muslim, İman 78' })).toEqual({ g: 's', gb: 'muslim' })
    expect(gradeOf({ source: 'Buxari, Ədəb əl-Müfrəd 594' })).toEqual({})
  })
  it('sünən: Albaninin hökmü əsasdır, digərləri yalnız zəif/ixtilafda göstərilir', () => {
    const sunan = { 7: [['Al-Albani', 'Daif'], ['Zubair Ali Zai', 'Hasan']], 8: [['Al-Albani', 'Hasan'], ['Zubair Ali Zai', 'Daif']] }
    expect(gradeOf({ id: 7, source: 'Tirmizi 1' }, sunan)).toEqual({ g: 'd', gb: 'albani', ga: [['zubair', 'h']] })
    expect(gradeOf({ id: 8, source: 'Tirmizi 2' }, sunan)).toEqual({ g: 'h', gb: 'albani' })
  })
  it('Albani yoxdursa: razılıq → o hökm, fərq → ixtilaf', () => {
    const sunan = { 1: [['Zubair Ali Zai', 'Sahih'], ['Shuaib Al Arnaut', 'Hasan']], 2: [['Zubair Ali Zai', 'Daif'], ['Shuaib Al Arnaut', 'Hasan']] }
    expect(gradeOf({ id: 1, source: 'Nəsai 1' }, sunan)).toEqual({ g: 's', gb: 'zubair' })
    expect(gradeOf({ id: 2, source: 'Nəsai 2' }, sunan).g).toBe('m')
  })
  it('əl ilə yazılmış grade, Quran surəsi, qalanı — boş', () => {
    expect(gradeOf({ source: 'Əhməd 2803', grade: 'sahih', gradedBy: 'Şueyb əl-Arnaut (Müsnəd təhqiqi)' })).toEqual({ g: 's', gb: 'arnaut' })
    expect(gradeOf({ source: 'Bəqərə 153' })).toEqual({ g: 'q' })
    expect(gradeOf({ source: 'Ali İmran 185' })).toEqual({ g: 'q' })
    expect(gradeOf({ source: 'Taberani' })).toEqual({})
  })
  it('gradeGroup', () => {
    expect(['s', 'h', 'mq', 'd', 'm', 'q', undefined].map(gradeGroup)).toEqual(['ok', 'ok', 'ok', 'weak', 'weak', 'quran', 'none'])
  })
})

describe('build məlumatı', () => {
  const list = buildHadithLangData(HADITHS, 'az', SUNAN_GRADES).list
  it('hər hədisdə ya dərəcə kodu var, ya heç nə (uydurma kod yoxdur)', () => {
    for (const h of list) expect([undefined, 's', 'h', 'mq', 'd', 'm', 'q']).toContain(h.g)
  })
  it('Buxari/Müslim hədislərinin hamısı səhih', () => {
    const bm = list.filter(h => /^(Buxari|Muslim|Müslim)\b/.test(h.source) && !/Ədəb əl-Müfrəd/.test(h.source))
    expect(bm.length).toBeGreaterThan(500)
    expect(bm.every(h => h.g === 's')).toBe(true)
  })
  it('datasetdəki bilinən xətalar düzəldilib (İbn Macə 224, 215, 4250 zəif deyil)', () => {
    for (const h of list.filter(h => /^İbn Macə (224|215|4250)\b/.test(h.source))) expect(h.g).not.toBe('d')
  })
})
