import { describe, it, expect } from 'vitest'
import { createSujoodDetector, rakatState } from '../../src/utils/rakatCount.js'

// Simulyasiya: [işıq, ms] ardıcıllığı — hər 100 ms
function run(d, segs) {
  let ms = 0, last
  for (const [lum, dur] of segs) for (let k = 0; k < dur; k += 100) { last = d.feed(lum + (Math.random() - 0.5) * 6, ms); ms += 100 }
  return last
}

describe('Rəkət sayğacı — səcdə detektoru', () => {
  it('iki səcdə (qaranlıq 1.5 s) — 2 sayılır', () => {
    const d = createSujoodDetector()
    const r = run(d, [[160, 3000], [30, 1500], [160, 1500], [25, 1500], [160, 2000]])
    expect(r.count).toBe(2)
  })
  it('qısa kölgə (əl keçdi, 0.3 s) sayılmır', () => {
    const d = createSujoodDetector()
    expect(run(d, [[160, 2000], [20, 300], [160, 2000]]).count).toBe(0)
  })
  it('səcdədə qısa işıq (0.3 s) səcdəni bölmür', () => {
    const d = createSujoodDetector()
    expect(run(d, [[160, 2000], [30, 1000], [160, 300], [30, 1000], [160, 1500]]).count).toBe(1)
  })
  it('işıq yavaş dəyişəndə (axşam qaralır) səcdə sayılmır', () => {
    const d = createSujoodDetector()
    let ms = 0, r
    for (let lum = 180; lum > 60; lum -= 0.5) { r = d.feed(lum, ms); ms += 100 }
    expect(r.count).toBe(0)
  })
  it('qaranlıq otaqda da nisbi düşüş tanınır', () => {
    const d = createSujoodDetector()
    expect(run(d, [[40, 2000], [8, 1200], [40, 1500]]).count).toBe(1)
  })
  it('undo', () => {
    const d = createSujoodDetector()
    run(d, [[160, 2000], [30, 1200], [160, 1500]])
    expect(d.undo()).toBe(0); expect(d.undo()).toBe(0)
  })
})

describe('rakatState', () => {
  it('4 rəkətli namaz', () => {
    expect(rakatState(0, 4)).toEqual({ done: 0, current: 1, half: false, phase: 'stand' })
    expect(rakatState(1, 4)).toMatchObject({ done: 0, current: 1, half: true })
    expect(rakatState(4, 4)).toMatchObject({ done: 2, current: 3, phase: 'middle' })
    expect(rakatState(6, 4)).toMatchObject({ done: 3, current: 4, phase: 'last' })
    expect(rakatState(8, 4)).toMatchObject({ done: 4, phase: 'end' })
    expect(rakatState(10, 4)).toMatchObject({ done: 4, phase: 'end' })
  })
  it('2 rəkətlidə orta təşəhhüd yoxdur, 3 rəkətlidə var', () => {
    expect(rakatState(2, 2)).toMatchObject({ current: 2, phase: 'last' })
    expect(rakatState(4, 3)).toMatchObject({ current: 3, phase: 'middle' })
  })
})
