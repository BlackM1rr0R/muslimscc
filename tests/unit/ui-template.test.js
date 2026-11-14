import { describe, it, expect, afterEach } from 'vitest'
import { setUiDict, txt, pickUi } from '../../src/utils/uiText.js'

afterEach(() => setUiDict(null, null))

describe('Şablonlu (dinamik) yazıların tərcüməsi', () => {
  it('hazır sətir şablonla tapılır, dəyər yerinə qoyulur', () => {
    setUiDict('de', { '{0} days left': 'Noch {0} Tage', '{0}% of the Sun will be covered': '{0} % der Sonne werden bedeckt', 'Close': 'Schließen' })
    expect(txt('27 days left')).toBe('Noch 27 Tage')
    expect(txt('27% of the Sun will be covered')).toBe('27 % der Sonne werden bedeckt')
    expect(txt('Close')).toBe('Schließen')
    expect(txt('Something else')).toBe('Something else')
  })
  it('çox yer tutucu, sıra dəyişə bilər, dəyər də tərcümə olunur', () => {
    setUiDict('tr', { '{0} is {1} the qiblah': '{1}: {0}', 'right on': 'tam üstünde', 'opens {0} {1}': '{0} {1} açar', 'surahs': 'sure' })
    expect(txt('Sirius is right on the qiblah')).toBe('tam üstünde: Sirius')
    expect(txt('opens 7 surahs')).toBe('7 sure açar')
  })
  it('xüsusi simvollu şablon (nöqtə, mötərizə, $) düzgün tutuşdurulur', () => {
    setUiDict('ru', { 'Total ({0}) — $ {1}.': 'Итого ({0}) — $ {1}.' })
    expect(txt('Total (5) — $ 10.')).toBe('Итого (5) — $ 10.')
    expect(txt('Total 5 — $ 10.')).toBe('Total 5 — $ 10.')
  })
  it('pickUi funksiyası nəticəsi tərcümə olunur', () => {
    setUiDict('id', { '{0} days left': '{0} hari lagi' })
    const T = { en: { days: (n) => `${n} days left` }, az: { days: (n) => `${n} gün qalıb` } }
    expect(pickUi(T, 'en').days(3)).toBe('3 hari lagi')
  })
  it('lüğət yoxdursa — dəyişmir', () => {
    expect(txt('27 days left')).toBe('27 days left')
  })
})
