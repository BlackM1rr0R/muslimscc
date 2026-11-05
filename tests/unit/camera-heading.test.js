// Kameranın kompas bucağı (utils/cameraHeading)
import { describe, it, expect } from 'vitest'
import { cameraHeading, angleDiff, smoothAngle } from '../../src/utils/cameraHeading.js'

describe('cameraHeading', () => {
  it('dik telefon (beta=90): bucaq = 360 − alpha', () => {
    expect(cameraHeading(0, 90, 0)).toBeCloseTo(0, 6)
    expect(cameraHeading(90, 90, 0)).toBeCloseTo(270, 6)
    expect(cameraHeading(270, 90, 0)).toBeCloseTo(90, 6)
  })
  it('düz uzanan telefon — null; səhv giriş — null', () => {
    expect(cameraHeading(30, 0, 0)).toBeNull()
    expect(cameraHeading(null, 90, 0)).toBeNull()
  })
  it('azca əyilmə bucağı az dəyişir', () => {
    expect(Math.abs(angleDiff(cameraHeading(90, 80, 5), 270))).toBeLessThan(6)
  })
})

describe('angleDiff / smoothAngle', () => {
  it('dairəvi fərq və yumşaltma 0°-dan keçir', () => {
    expect(angleDiff(10, 350)).toBe(20)
    expect(angleDiff(350, 10)).toBe(-20)
    expect(smoothAngle(null, 42)).toBe(42)
    const s = smoothAngle(350, 10, 0.5)
    expect(s).toBeCloseTo(0, 6)
  })
})
