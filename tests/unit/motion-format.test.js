// src/motion/format.js — NumberTicker formatı və DottedGlobe riyaziyyatı (+ TextEffect/BackgroundPaths köməkçiləri)
import { describe, it, expect } from 'vitest'
import { formatTicker, tickerFrames, localeFor, spherePoints, projectPoint, MAKKAH, splitText, flowPath } from '../../src/motion/format.js'

describe('formatTicker', () => {
  it('Intl ilə, dilə görə; ərəbcədə latın rəqəmləri', () => {
    expect(formatTicker(6236, { lang: 'en' })).toBe('6,236')
    expect(formatTicker(6236, { lang: 'ru' })).toMatch(/^6\s236$/)
    expect(formatTicker(6236, { lang: 'ar' })).not.toMatch(/[٠-٩]/)
    expect(localeFor('ar')).toBe('ar-u-nu-latn')
    expect(localeFor('id')).toBe('id')
    expect(localeFor(undefined)).toBe('en-GB')
  })
  it('prefix/suffix, onluq sabit, qeyri-rəqəm boş', () => {
    expect(formatTicker(99.5, { lang: 'en', decimals: 1, suffix: '%' })).toBe('99.5%')
    expect(formatTicker(3, { lang: 'en', decimals: 2 })).toBe('3.00')
    expect(formatTicker(1250, { lang: 'en', prefix: '~', suffix: '+' })).toBe('~1,250+')
    expect(formatTicker('x')).toBe('')
    expect(formatTicker(12500, { lang: 'en', compact: true })).toBe('12.5K')
  })
  it('tickerFrames: monoton, son kadr dəqiq', () => {
    const f = tickerFrames(0, 114, 8)
    expect(f).toHaveLength(8)
    expect(f.at(-1)).toBe(114)
    for (let i = 1; i < f.length; i++) expect(f[i]).toBeGreaterThanOrEqual(f[i - 1])
  })
})

describe('qlobus', () => {
  it('spherePoints: n nöqtə, enlik/uzunluq hüdudda', () => {
    const p = spherePoints(200)
    expect(p).toHaveLength(200)
    for (const q of p) {
      expect(Math.abs(q.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(q.lon)).toBeLessThanOrEqual(180)
    }
  })
  it('projectPoint: mərkəzdəki nöqtə (0,0), arxa tərəf z<0, şimal yuxarı', () => {
    const c = projectPoint(MAKKAH.lat, MAKKAH.lon, MAKKAH.lon, MAKKAH.lat)
    expect(c.x).toBeCloseTo(0, 6)
    expect(c.y).toBeCloseTo(0, 6)
    expect(c.z).toBeCloseTo(1, 6)
    expect(projectPoint(0, MAKKAH.lon + 180, MAKKAH.lon, 0).z).toBeLessThan(0)
    expect(projectPoint(45, 0, 0, 0).y).toBeLessThan(0)
  })
})

describe('TextEffect və BackgroundPaths köməkçiləri', () => {
  it('splitText: sözlər boşluqla, hərflər; ərəbcə hərf-hərf bölünmür', () => {
    expect(splitText('Salam dünya', 'word')).toEqual(['Salam', ' ', 'dünya'])
    expect(splitText('ab c', 'char')).toEqual(['a', 'b', ' ', 'c'])
    expect(splitText('بسم الله', 'char')).toEqual(['بسم', ' ', 'الله'])
    expect(splitText(null)).toEqual([])
  })
  it('flowPath: sahə daxilində kubik əyri, hər xətt fərqli', () => {
    expect(flowPath(3, 10)).toMatch(/^M-80 \d+ C/)
    expect(flowPath(0, 10)).not.toBe(flowPath(1, 10))
  })
})
