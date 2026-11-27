// Surə atmosferi (data/surahAtmosphere + utils/quranAtmos) və ünvan çərçivəsi (UnwanFrame)
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ATMOS_SCENES, ATMOS_SCENE_KEYS, atmosSceneOf } from '../../src/data/surahAtmosphere'
import { ATMOS_KEY, readAtmosOn, writeAtmosOn } from '../../src/utils/quranAtmos'

// Vitest (node) JSX-i klassik rejimdə çevirir — komponent React qlobalını gözləyir
globalThis.React = React
const { default: SurahAtmosphere } = await import('../../src/components/quran/SurahAtmosphere.jsx')
const { default: UnwanFrame } = await import('../../src/components/quran/UnwanFrame.jsx')

// Adı təbiət / səma hadisəsi olan surələr — siyahı QƏSDƏN dəqiqdir (yeni surə əlavəsi rəydən keçsin)
const ALLOWED = [13, 18, 24, 44, 51, 52, 53, 54, 85, 86, 89, 91, 92, 93, 97, 113]
// Adı canlı varlıq olan surələr: əl-Bəqərə (inək), əl-Ənam (mal-qara), ən-Nəhl (arı), ən-Nəml (qarışqa),
// əl-Ənkəbut (hörümçək), əl-Fil (fil), əl-Ədiyat (atlar), həmçinin insan adları (Yunus, Hud, Yusif, İbrahim,
// Məryəm, Muhəmməd, Nuh, Luqman) və insanlar/cinlər (ən-Nas, əl-Cinn, əl-Müzzəmmil, əl-Müddəssir…)
const LIVING = [2, 6, 10, 11, 12, 14, 16, 19, 27, 29, 31, 47, 63, 71, 72, 73, 74, 100, 105, 106, 114]

describe('ATMOS_SCENES — yalnız siyahıdakı surələr', () => {
  it('id-lər dəqiq olaraq icazəli siyahıdır', () => {
    expect(Object.keys(ATMOS_SCENES).map(Number).sort((a, b) => a - b)).toEqual(ALLOWED)
  })
  it('canlı varlıq adlı heç bir surə yoxdur', () => {
    for (const n of LIVING) expect(atmosSceneOf(n), `surə ${n}`).toBeNull()
  })
  it('hər səhnə tanınan açardır və qısa qeydi var', () => {
    for (const [n, v] of Object.entries(ATMOS_SCENES)) {
      expect(ATMOS_SCENE_KEYS, `surə ${n}`).toContain(v.scene)
      expect(typeof v.note).toBe('string')
      expect(v.note.length).toBeGreaterThan(8)
      expect(v.note.length).toBeLessThan(140)
    }
  })
  it('istək üzrə əsas uyğunluqlar', () => {
    expect(atmosSceneOf(89)).toBe('dawn')
    expect(atmosSceneOf(92)).toBe('night')
    expect(atmosSceneOf(97)).toBe('night')
    expect(atmosSceneOf(54)).toBe('moon')
    expect(atmosSceneOf(13)).toBe('rain')
    expect(atmosSceneOf(18)).toBe('cave')
    expect(atmosSceneOf('86')).toBe('piercing')
    expect(atmosSceneOf(1)).toBeNull()
    expect(atmosSceneOf(0)).toBeNull()
    expect(atmosSceneOf(999)).toBeNull()
  })
  it('xəritə dəyişməzdir', () => {
    expect(Object.isFrozen(ATMOS_SCENES)).toBe(true)
  })
})

describe('SurahAtmosphere — hər səhnə çəkilir, səhnəsiz surə boşdur', () => {
  it('hər icazəli surə üçün dekorativ (aria-hidden) qat', () => {
    for (const n of ALLOWED) {
      const html = renderToStaticMarkup(createElement(SurahAtmosphere, { n }))
      expect(html, `surə ${n}`).toContain(`qa-atmos--${atmosSceneOf(n)}`)
      expect(html).toContain('aria-hidden="true"')
      // Ağır deyil: bir neçə yüz element yox
      expect(html.length, `surə ${n}`).toBeLessThan(12000)
    }
  })
  it('səhnəsi olmayan surə — heç nə', () => {
    expect(renderToStaticMarkup(createElement(SurahAtmosphere, { n: 2 }))).toBe('')
  })
  it('ulduzlar sabit toxumla — iki render eynidir', () => {
    const a = renderToStaticMarkup(createElement(SurahAtmosphere, { n: 92 }))
    const b = renderToStaticMarkup(createElement(SurahAtmosphere, { n: 92 }))
    expect(a).toBe(b)
  })
})

describe('UnwanFrame — ünvan çərçivəsi', () => {
  it('≤ 3 KB işarələmə, dekor aria-hidden, data-draw ilə bir dəfə çəkilir', () => {
    const html = renderToStaticMarkup(createElement(UnwanFrame, { className: 'uw--reader' }, createElement('h1', null, 'سورة الفجر')))
    expect(html.length).toBeLessThanOrEqual(3072)
    expect(html).toContain('data-draw=""')
    expect(html).toContain('<span class="uw-frame" aria-hidden="true">')
    expect(html).toContain('<h1>سورة الفجر</h1>')
    expect((html.match(/<svg/g) || []).length).toBe(5)
  })
})

describe('Fon atmosferi seçimi — yaddaşda qalır', () => {
  let store
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  beforeEach(() => {
    store = new Map()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    })
  })
  afterEach(() => {
    if (saved) Object.defineProperty(globalThis, 'localStorage', saved)
    else delete globalThis.localStorage
  })
  it('susmaya görə açıq', () => {
    expect(readAtmosOn()).toBe(true)
  })
  it('söndür → "0", yandır → "1"', () => {
    writeAtmosOn(false)
    expect(store.get(ATMOS_KEY)).toBe('0')
    expect(readAtmosOn()).toBe(false)
    writeAtmosOn(true)
    expect(store.get(ATMOS_KEY)).toBe('1')
    expect(readAtmosOn()).toBe(true)
  })
  it('yaddaş bağlıdırsa — xəta yoxdur, açıq sayılır', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError') },
    })
    expect(() => writeAtmosOn(false)).not.toThrow()
    expect(readAtmosOn()).toBe(true)
  })
})
