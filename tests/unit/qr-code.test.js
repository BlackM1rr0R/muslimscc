// QR kodlayıcısı (src/utils/qrCode.js) — 2FA qurulumunun QR kodu.
// Barmaq izləri (sha256) 2026-11-18-də jsQR 1.4.0 ilə oxunmuş matrislərdəndir (bütün maskalar, L/M,
// versiya 1–27 — 126/126 oxundu; yoxlama asılılıq kimi əlavə olunmayıb). Burada struktur da yoxlanır.
import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import { qrMatrix, qrSvgPath } from '../../src/utils/qrCode.js'

const OTP = 'otpauth://totp/Muslims.cc%3Atest%40example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Muslims.cc&algorithm=SHA1&digits=6&period=30'
const fp = (m) => crypto.createHash('sha256').update(m.modules.map((r) => r.map((b) => (b ? 1 : 0)).join('')).join('\n')).digest('hex')

/** Format bitlərini (sol-yuxarı nüsxə) oxu və BCH ilə yoxla → { ecl, mask } */
function readFormat(m) {
  const g = (x, y) => (m.modules[y][x] ? 1 : 0)
  const bits = []
  for (let i = 0; i <= 5; i++) bits.push(g(8, i))
  bits.push(g(8, 7), g(8, 8), g(7, 8))
  for (let i = 9; i < 15; i++) bits.push(g(14 - i, 8))
  const v = bits.reduce((a, b, i) => a | (b << i), 0) ^ 0x5412
  const data = v >>> 10
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  expect(((data << 10) | rem) & 0x7fff).toBe(v)
  return { ecl: data >>> 3, mask: data & 7 }
}

describe('QR kodlayıcısı', () => {
  it('barmaq izləri (jsQR ilə oxunmuş) dəyişməyib', () => {
    const a = qrMatrix('HELLO WORLD', { ecl: 'M' })
    expect([a.version, a.mask, a.size]).toEqual([1, 3, 21])
    expect(fp(a)).toBe('1e387bd8b7a170bfa73b461bab560d96940b4421c42ed9c4d787a62c0a0166fa')
    const b = qrMatrix(OTP, { ecl: 'M' })
    expect([b.version, b.mask, b.size]).toEqual([8, 7, 49])
    expect(fp(b)).toBe('d97641f273c223fb56080a00231a485a010a1cc51a739ecba0582c7907ec7453')
  })
  it('tapıcı naxışlar, zamanlama xətti, tünd modul, format bitləri', () => {
    for (const [t, ecl] of [['x', 'L'], [OTP, 'M'], ['y'.repeat(600), 'M']]) {
      const m = qrMatrix(t, { ecl })
      expect(m.size).toBe(m.version * 4 + 17)
      for (const [cx, cy] of [[3, 3], [m.size - 4, 3], [3, m.size - 4]]) {
        expect(m.modules[cy][cx]).toBe(true)                // mərkəz
        expect(m.modules[cy][cx + 2]).toBe(false)           // ağ halqa
        expect(m.modules[cy][cx + 3]).toBe(true)            // qara halqa
      }
      for (let i = 8; i < m.size - 8; i++) expect(m.modules[6][i]).toBe(i % 2 === 0)
      expect(m.modules[m.size - 8][8]).toBe(true)
      expect(readFormat(m)).toEqual({ ecl: ecl === 'L' ? 1 : 0, mask: m.mask })
    }
  })
  it('versiya mətnin uzunluğuna görə böyüyür; həddən uzun mətn xəta', () => {
    expect(qrMatrix('a'.repeat(14), { ecl: 'M' }).version).toBe(1)
    expect(qrMatrix('a'.repeat(15), { ecl: 'M' }).version).toBe(2)
    expect(() => qrMatrix('a'.repeat(3000), { ecl: 'M' })).toThrow(/too long/)
  })
  it('SVG yolu: kənar boşluq və modul sayı', () => {
    const m = qrMatrix('HELLO WORLD')
    const { d, view } = qrSvgPath(m, 4)
    expect(view).toBe(29)
    const dark = m.modules.flat().filter(Boolean).length
    expect(d.match(/M/g)).toHaveLength(dark)
  })
})
