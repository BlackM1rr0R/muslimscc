import { describe, it, expect } from 'vitest'
import { extractPalette, sortByLuminance, luminance, contrast, expandPalette, pickLineColor, shuffleUnlocked, hexToRgb, toHex, strapColors } from '../../src/utils/photoPalette'

// Sintetik şəkil: rənglər [r,g,b] və hər birinin piksel sayı
function image(parts) {
  const px = []
  for (const [rgb, n] of parts) for (let i = 0; i < n; i++) px.push(rgb[0], rgb[1], rgb[2], 255)
  return new Uint8ClampedArray(px)
}
// Səs-küylü şəkil — rənglər qarışıq sırada, ±6 titrəmə
function noisy(cols, n) {
  const px = []
  let s = 1
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < n; i++) {
    const c = cols[i % cols.length]
    px.push(...c.map(v => Math.max(0, Math.min(255, v + Math.round((r() - 0.5) * 12)))), 255)
  }
  return new Uint8ClampedArray(px)
}

describe('photoPalette', () => {
  it('iki rəngli şəkil — dəqiq həmin iki rəng (payları ilə)', () => {
    const p = extractPalette(image([[[200, 30, 40], 300], [[20, 60, 180], 100]]), { k: 6 })
    expect(p.map(c => c.hex).sort()).toEqual(['#143cb4', '#c81e28'])
    expect(p[0].hex).toBe('#c81e28') // çox olan birinci
    expect(p[0].share).toBeCloseTo(0.75, 5)
  })

  it('şəffaf piksellər sayılmır', () => {
    const px = image([[[10, 200, 10], 50]])
    const tr = new Uint8ClampedArray(200).fill(0) // 50 tam şəffaf ağ-qara
    const all = new Uint8ClampedArray([...px, ...tr])
    expect(extractPalette(all).map(c => c.hex)).toEqual(['#0ac80a'])
  })

  it('deterministikdir — eyni giriş, eyni nəticə', () => {
    const img = noisy([[240, 120, 40], [30, 40, 90], [250, 230, 200], [120, 20, 60], [40, 160, 150], [90, 90, 90]], 6000)
    const a = extractPalette(img, { k: 6, seed: 3 })
    const b = extractPalette(img, { k: 6, seed: 3 })
    expect(a).toEqual(b)
    expect(a.length).toBe(6)
    // hər mərkəz əsl rənglərdən birinə yaxındır
    for (const c of a) {
      const near = [[240, 120, 40], [30, 40, 90], [250, 230, 200], [120, 20, 60], [40, 160, 150], [90, 90, 90]]
        .some(o => Math.hypot(o[0] - c.rgb[0], o[1] - c.rgb[1], o[2] - c.rgb[2]) < 10)
      expect(near).toBe(true)
    }
  })

  it('boş və ya tam şəffaf şəkil — boş massiv', () => {
    expect(extractPalette(new Uint8ClampedArray(0))).toEqual([])
    expect(extractPalette(new Uint8ClampedArray(40))).toEqual([])
  })

  it('parlaqlığa görə sıralama — qaranlıqdan işığa', () => {
    expect(sortByLuminance(['#ffffff', '#000000', '#808080', '#ff0000'])).toEqual(['#000000', '#ff0000', '#808080', '#ffffff'])
    const objs = sortByLuminance([{ hex: '#eeeeee' }, { hex: '#111111' }])
    expect(objs[0].hex).toBe('#111111')
    expect(luminance('#000')).toBe(0)
    expect(luminance('#fff')).toBeCloseTo(1, 6)
  })

  it('kontrast — WCAG nisbəti', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 3)
    expect(contrast('#777777', '#777777')).toBeCloseTo(1, 6)
  })

  it('expandPalette — 2 rəngi 5-ə çatdırır, sıralı və təkrarsız', () => {
    const e = expandPalette(['#c81e28', '#143cb4'], 5)
    expect(e.length).toBe(5)
    expect(new Set(e).size).toBe(5)
    expect(e).toEqual(sortByLuminance(e))
    expect(e).toContain('#c81e28')
    expect(e).toContain('#143cb4')
  })

  it('xətt rəngi doldurmalarla yaxşı kontrast verir', () => {
    const pal = ['#0b1a2a', '#3a6e8f', '#7fb3c8', '#e8f1f2']
    expect(pickLineColor(pal, ['#3a6e8f', '#7fb3c8'])).toBe('#0b1a2a')
    expect(pickLineColor(pal, ['#0b1a2a', '#3a6e8f'])).toBe('#e8f1f2')
    // hamısı orta boz — qara/ağ ehtiyat
    expect(['#ffffff', '#111111']).toContain(pickLineColor(['#808080', '#858585'], ['#808080', '#858585']))
  })

  it('shuffleUnlocked kilidli mövqelərə toxunmur və deterministikdir', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f']
    const lock = [true, false, false, true, false, false]
    const s = shuffleUnlocked(arr, lock, 42)
    expect(s[0]).toBe('a'); expect(s[3]).toBe('d')
    expect([...s].sort()).toEqual(arr)
    expect(shuffleUnlocked(arr, lock, 42)).toEqual(s)
  })

  it('strapColors — zolaq fonla ən azı 3:1, kənar əks tərəfdə', () => {
    for (const pal of [['#2a1638', '#f4a259', '#e2604b', '#ffd8a0'], ['#f7e3e8', '#e8a0b4', '#c2456b', '#3b1f2b'], ['#444444', '#555555', '#666666']]) {
      const { line, edge } = strapColors(pal)
      expect(contrast(line, pal[0])).toBeGreaterThanOrEqual(3)
      expect(contrast(line, edge)).toBeGreaterThan(1.5)
    }
    expect(strapColors(['#2a1638', '#f4a259', '#ffd8a0']).line).toBe('#ffd8a0') // dəstin ən açığı
  })

  it('hex ↔ rgb', () => {
    expect(hexToRgb('#0f8')).toEqual([0, 255, 136])
    expect(toHex([300, -4, 16.4])).toBe('#ff0010')
  })
})
