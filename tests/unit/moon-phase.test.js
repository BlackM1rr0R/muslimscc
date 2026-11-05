// Ayın fazası (utils/moonPhase) — real astronomik hadisələrlə yoxlama
import { describe, it, expect } from 'vitest'
import { moonPhase, phaseKey, litPath, SYNODIC } from '../../src/utils/moonPhase.js'

describe('moonPhase — məlum hadisələr (±0.6 gün)', () => {
  it.each([
    ['2024-04-08T18:21:00Z', 'new'],   // tam Günəş tutulması — təzə ay
    ['2024-04-23T23:49:00Z', 'full'],
    ['2025-03-14T06:55:00Z', 'full'],   // tam Ay tutulması
    ['2025-03-29T10:58:00Z', 'new'],
    ['2026-11-24T14:53:00Z', 'full'],
  ])('%s → %s', (iso, key) => {
    const m = moonPhase(new Date(iso))
    expect(m.key).toBe(key)
    if (key === 'full') expect(m.illumination).toBeGreaterThan(0.99)
    if (key === 'new') expect(m.illumination).toBeLessThan(0.01)
  })

  it('növbəti bədr və təzə ay gələcəkdədir və bir sinodik ay içindədir', () => {
    const now = new Date('2026-11-05T12:00:00Z')
    const m = moonPhase(now)
    for (const d of [m.nextFull, m.nextNew]) {
      expect(d.getTime()).toBeGreaterThan(now.getTime())
      expect(d.getTime() - now.getTime()).toBeLessThanOrEqual(SYNODIC * 86400000)
    }
    expect(m.waxing).toBe(false)              // 5 noyabr 2026 — kiçilən hilal
    expect(m.key).toBe('waningCrescent')
  })
})

describe('phaseKey və litPath', () => {
  it('faza sərhədləri', () => {
    expect(phaseKey(0.5)).toBe('new')
    expect(phaseKey(3)).toBe('waxingCrescent')
    expect(phaseKey(7.4)).toBe('firstQuarter')
    expect(phaseKey(14.8)).toBe('full')
    expect(phaseKey(22.1)).toBe('lastQuarter')
    expect(phaseKey(26)).toBe('waningCrescent')
    expect(phaseKey(29.4)).toBe('new')
  })
  it('böyüyən ay güzgüsüz, kiçilən ay güzgülü; hilal/qabarıq terminator istiqaməti', () => {
    expect(litPath(0.1).mirror).toBe(false)
    expect(litPath(0.9).mirror).toBe(true)
    expect(litPath(0.1).d).toMatch(/0 0 0 0 -50 Z$/)   // hilal — sweep 0
    expect(litPath(0.4).d).toMatch(/0 0 1 0 -50 Z$/)   // qabarıq — sweep 1
  })
})
