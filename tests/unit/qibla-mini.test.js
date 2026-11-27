// Başlıqdakı kiçik qiblə kompası — saf köməkçilər (utils/qiblaMini.js)
import { describe, it, expect } from 'vitest'
import { compassIndex, formatBearing, angleDiff, headingSpread, accuracyOf, headingOf, bearingFor } from '../../src/utils/qiblaMini.js'

const AZ = ['şimal', 'şimal-şərq', 'şərq', 'cənub-şərq', 'cənub', 'cənub-qərb', 'qərb', 'şimal-qərb']
const EN = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']

describe('formatBearing', () => {
  it.each([
    [203.4, AZ, '203° cənub-qərb'],
    [203.6, EN, '204° south-west'],
    [0, AZ, '0° şimal'],
    [359.6, AZ, '0° şimal'],
    [22.4, EN, '22° north'],
    [22.6, EN, '23° north-east'],
    [180, AZ, '180° cənub'],
    [-90, EN, '270° west'],
    [337.4, EN, '337° north-west'],
    [338, EN, '338° north'],
  ])('%s → %s', (deg, pts, out) => { expect(formatBearing(deg, pts)).toBe(out) })

  it('istiqamət adları yoxdursa yalnız dərəcə; NaN → boş', () => {
    expect(formatBearing(91, null)).toBe('91°')
    expect(formatBearing(NaN, AZ)).toBe('')
  })
  it('compassIndex: 8 sektor', () => {
    expect([0, 45, 90, 135, 180, 225, 270, 315, 360, 720].map(compassIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 0, 0])
  })
})

describe('bearingFor — saytın ortaq qiblə həndəsəsi (paperDial)', () => {
  it('Bakı: təxminən 207° (cənub-qərb)', () => {
    const b = bearingFor({ lat: 40.4093, lng: 49.8671 })
    expect(b).toBeGreaterThan(205)
    expect(b).toBeLessThan(209)
    expect(formatBearing(b, AZ)).toMatch(/^20\d° cənub-qərb$/)
  })
  it('koordinat yoxdursa null', () => { expect(bearingFor({ lat: NaN, lng: 1 })).toBeNull() })
})

describe('kompas oxunuşu və dəqiqlik', () => {
  it('angleDiff: qısa yol', () => {
    expect(angleDiff(10, 350)).toBe(20)
    expect(angleDiff(350, 10)).toBe(-20)
    expect(angleDiff(180, 0)).toBe(-180)
  })
  it('headingOf: iOS bucağı, mütləq alpha; nisbi alpha istifadə olunmur', () => {
    expect(headingOf({ webkitCompassHeading: 120 })).toBe(120)
    expect(headingOf({ absolute: true, alpha: 90 })).toBe(270)
    expect(headingOf({ absolute: false, alpha: 90 })).toBeNull()
    expect(headingOf(null)).toBeNull()
  })
  it('dəqiqlik: iOS — −1 / > 25° zəif; digərləri — səpələnmə', () => {
    expect(accuracyOf({ iosAcc: -1 })).toBe('low')
    expect(accuracyOf({ iosAcc: 40 })).toBe('low')
    expect(accuracyOf({ iosAcc: 10 })).toBe('good')
    expect(accuracyOf({ buf: [1, 2] })).toBeNull()
    const steady = Array.from({ length: 30 }, (_, i) => 200 + (i % 3))
    const noisy = Array.from({ length: 30 }, (_, i) => (i * 37) % 360)
    expect(accuracyOf({ buf: steady })).toBe('good')
    expect(accuracyOf({ buf: noisy })).toBe('low')
    expect(headingSpread(steady)).toBeLessThan(2)
  })
})
