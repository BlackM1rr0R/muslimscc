// src/motion/presets.js — hərəkət tokenləri və saf köməkçilər (dizayn v6, DESIGN.md §7.3)
import { describe, it, expect } from 'vitest'
import {
  DUR, EXIT_RATIO, exitDur, enterT, exitT, SPRING, staggerDelay, staggerContainer,
  fadeUp, blurIn, scaleIn, fadeIn, pickVariant, pageVariants, dockScale, orbitPositions, swipeDecision,
} from '../../src/motion/presets.js'

describe('müddətlər: çıxış girişdən qısa', () => {
  it('exitDur ≈ 62% və ən az 90 ms', () => {
    for (const d of Object.values(DUR)) {
      expect(exitDur(d)).toBeLessThan(d)
      expect(exitDur(d)).toBeCloseTo(Math.max(0.09, d * EXIT_RATIO), 3)
    }
    expect(exitDur(0.1)).toBe(0.09)
  })
  it('enterT ease-out, exitT ease-in və daha qısa', () => {
    const e = enterT(DUR.lg, 0.1)
    const x = exitT(DUR.lg)
    expect(e.delay).toBe(0.1)
    expect(x.duration).toBeLessThan(e.duration)
    expect(e.ease[1]).toBeGreaterThan(x.ease[1])   // giriş yavaşlayır, çıxış sürətlənir
  })
  it('yaylar: snappy ən sərt', () => {
    expect(SPRING.snappy.stiffness).toBeGreaterThan(SPRING.soft.stiffness)
    expect(SPRING.soft.stiffness).toBeGreaterThan(SPRING.gentle.stiffness)
    for (const s of Object.values(SPRING)) expect(s.type).toBe('spring')
  })
})

describe('növbə (stagger)', () => {
  it('addım × indeks, max-dan sonra sabit', () => {
    expect(staggerDelay(0, 0.05)).toBe(0)
    expect(staggerDelay(3, 0.05)).toBe(0.15)
    expect(staggerDelay(50, 0.05, 10)).toBe(0.5)
    expect(staggerDelay(2, 0.04, 10, 0.1)).toBe(0.18)
    expect(staggerDelay(-4)).toBe(0)
  })
  it('konteyner delayChildren funksiyadır', () => {
    const v = staggerContainer(0.05, 0.1, 4)
    expect(v.show.transition.delayChildren(2)).toBe(0.2)
    expect(v.show.transition.delayChildren(99)).toBe(0.3)
    expect(v.exit.transition.delayChildren(0, 3)).toBeCloseTo(0.06, 5)  // sonuncu birinci çıxır
  })
})

describe('variantlar', () => {
  it('hidden ani, show yalnız gizli açarları sıfırlayır', () => {
    expect(fadeUp.hidden.transition.duration).toBe(0)
    expect(fadeUp.show()).toMatchObject({ opacity: 1, y: 0 })
    expect(fadeUp.show()).not.toHaveProperty('filter')
    expect(blurIn.show()).toMatchObject({ opacity: 1, filter: 'blur(0px)' })
    expect(scaleIn.show({ delay: 0.2 }).transition.delay).toBe(0.2)
    expect(fadeIn.show().transition.duration).toBe(DUR.md)
  })
  it('çıxış girişdən qısa', () => {
    for (const v of [fadeUp, blurIn, scaleIn, fadeIn]) expect(v.exit.transition.duration).toBeLessThan(v.show().transition.duration)
  })
  it('telefonda blurIn → fadeUp; naməlum → fadeUp', () => {
    expect(pickVariant('blurIn', { coarse: true })).toBe(fadeUp)
    expect(pickVariant('blurIn')).toBe(blurIn)
    expect(pickVariant('yox')).toBe(fadeUp)
  })
})

describe('səhifə keçidi', () => {
  it('still (VT / azaldılmış) və leaving — ani', () => {
    const v = pageVariants({ phone: false })
    expect(v.enter({ still: true })).toMatchObject({ opacity: 1, transition: { duration: 0 } })
    expect(v.exit({ still: true }).transition.duration).toBe(0)
    expect(v.exit({ leaving: true }).transition.duration).toBe(0)
  })
  it('telefon: irəli sağdan, geri soldan; RTL güzgü', () => {
    expect(pageVariants({ phone: true }).enter({}).x).toBe(36)
    expect(pageVariants({ phone: true }).enter({ back: true }).x).toBe(-36)
    expect(pageVariants({ phone: true, rtl: true }).enter({}).x).toBe(-36)
    expect(pageVariants({ phone: false }).enter({}).y).toBe(10)
  })
  it('çıxış girişdən qısa', () => {
    const v = pageVariants({})
    expect(v.exit({}).transition.duration).toBeLessThan(v.center({}).transition.duration)
  })
})

describe('dok, orbit, sürüşdürmə', () => {
  it('dockScale: mərkəzdə max, kənarda 1, simmetrik', () => {
    expect(dockScale(0, { max: 1.3 })).toBe(1.3)
    expect(dockScale(120, { range: 120 })).toBe(1)
    expect(dockScale(500)).toBe(1)
    expect(dockScale(40)).toBe(dockScale(-40))
    expect(dockScale(30)).toBeGreaterThan(dockScale(60))
    expect(dockScale(NaN)).toBe(1)
  })
  it('orbitPositions: radiusda, 0° yuxarıda', () => {
    const p = orbitPositions(4, 100)
    expect(p).toHaveLength(4)
    expect(p[0].x).toBeCloseTo(0, 5)
    expect(p[0].y).toBe(-100)
    expect(p[0].angle).toBe(0)
    expect(p[1].x).toBeCloseTo(100, 5)
    for (const q of p) expect(Math.hypot(q.x, q.y)).toBeCloseTo(100, 1)
  })
  it('swipeDecision: sola → növbəti, sağa → əvvəlki, kiçik → 0', () => {
    expect(swipeDecision(-120, 0)).toBe(1)
    expect(swipeDecision(120, 0)).toBe(-1)
    expect(swipeDecision(-30, -900)).toBe(1)
    expect(swipeDecision(-30, 900)).toBe(0)     // əks istiqamətli sürət sayılmır
    expect(swipeDecision(8, 2000)).toBe(0)
  })
})
