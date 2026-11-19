// Şablon qoruyucusu (uiText.tplAccept): qısa şablon ("{0} of {1}") ingiliscə nəsr cümləsini
// tutmamalıdır — /de dərs başlığı "The virtue of dhikr after prayer" → "… von …" xətası.
import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { setUiDict, txt } from '../../src/utils/uiText.js'

afterEach(() => setUiDict(null, null))
const de = JSON.parse(readFileSync(new URL('../../src/i18n/de.json', import.meta.url), 'utf8'))

describe('şablon yalnız dəyərə oxşayan hissələri tutur', () => {
  it('ingiliscə dərs mətni "{0} of {1}" ilə qarışmır', () => {
    setUiDict('de', de)
    expect(txt('The virtue of dhikr after prayer')).toBe('The virtue of dhikr after prayer')
    expect(txt('Authentic hadith; rulings of Ibn Baz and al-Albani')).toBe('Authentic hadith; rulings of Ibn Baz and al-Albani')
  })
  it('say dəyərləri əvvəlki kimi tərcümə olunur', () => {
    setUiDict('de', de)
    expect(txt('3 of 10')).toBe(de['{0} of {1}'].replace('{0}', '3').replace('{1}', '10'))
  })
  it('qısa ad + lüğət sözü olan şablon işləyir', () => {
    setUiDict('tr', { '{0} is {1} the qiblah': '{1}: {0}', 'right on': 'tam üstünde' })
    expect(txt('Sirius is right on the qiblah')).toBe('tam üstünde: Sirius')
  })
  it('real lüğətdə: rəqəmlə doldurulmuş hər şablon hələ də tərcümə olunur', () => {
    setUiDict('de', de)
    const bad = []
    for (const [k, v] of Object.entries(de)) {
      if (typeof v !== 'string' || !/\{\d\}/.test(k) || /^\{\d\}$/.test(k)) continue
      const s = k.replace(/\{(\d)\}/g, (_, n) => String(10 + Number(n)))
      if (de[s]) continue
      if (txt(s) === s && v.replace(/\{(\d)\}/g, (_, n) => String(10 + Number(n))) !== s) bad.push(k)
    }
    expect(bad).toEqual([])
  })
})
