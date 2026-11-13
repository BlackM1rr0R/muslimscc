import { describe, it, expect } from 'vitest'
import { BABY_NAMES, nameIn, BEST_NAMES_HADITH } from '../../src/data/babyNames.js'
import { NAME_QURAN } from '../../src/data/nameQuran.js'
import * as AQIQAH from '../../src/data/lessons/aqiqah.js'

const by = (ar) => BABY_NAMES.find(n => n.ar === ar)

describe('Müsəlman uşaq adları', () => {
  it('125 ad, unikal id, cins bölgüsü', () => {
    expect(BABY_NAMES).toHaveLength(125)
    expect(new Set(BABY_NAMES.map(n => n.id)).size).toBe(125)
    expect(by('محمد').gender).toBe('m'); expect(by('عبد القادر').gender).toBe('m')
    expect(by('فاطمة').gender).toBe('f'); expect(by('زبيدة').gender).toBe('f')
  })
  it('Quranda xüsusi ad kimi saylar (məşhur saylarla)', () => {
    const exp = { 'محمد': 4, 'أحمد': 1, 'إبراهيم': 69, 'موسى': 136, 'عيسى': 25, 'نوح': 43, 'يوسف': 27, 'مريم': 34, 'يحيى': 5, 'آدم': 25, 'سليمان': 17, 'هارون': 20 }
    for (const [ar, n] of Object.entries(exp)) expect(NAME_QURAN[ar][0], ar).toBe(n)
    expect(NAME_QURAN['محمد'][1]).toBe('3:144')
    expect(by('علي').quran).toBeNull()       // "əli" Quranda sifətdir, ad deyil — sayılmır
  })
  it('məna yalnız lüğətdə olan adlarda; peyğəmbər adlarında yoxdur', () => {
    expect(by('يوسف').meaning).toBeNull()
    expect(by('محمد').meaning.az).toBeTruthy()
  })
  it('dildə yazılış', () => {
    expect(nameIn(by('محمد'), 'az')).toBe('Məhəmməd')
    expect(nameIn(by('محمد'), 'ru')).toBe('Мухаммад')
    expect(nameIn(by('خالد'), 'tr')).toBe('Halit')
    expect(nameIn(by('محمد'), 'ar')).toBe('محمد')
  })
  it('səhabə keçidləri', () => {
    expect(by('عمر').sahaba).toEqual(['umar-ibn-al-khattab'])
    expect(by('عائشة').sahaba).toEqual(['aisha-bint-abi-bakr'])
  })
  it('hədis əqiqə dərsindəki mətnlə hərfi-hərfinə eynidir', () => {
    const blocks = JSON.stringify(AQIQAH)
    expect(blocks).toContain(JSON.stringify(BEST_NAMES_HADITH.text).slice(1, -1))
    expect(blocks).toContain(JSON.stringify(BEST_NAMES_HADITH.src).slice(1, -1))
    expect(blocks).toContain(BEST_NAMES_HADITH.ar)
  })
})
