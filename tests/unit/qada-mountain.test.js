// Qəza dağı (utils/qadaMountain) — cığır boyu nöqtə
import { describe, it, expect } from 'vitest'
import { TRAIL, CAMPS, pointAt, trailPath } from '../../src/utils/qadaMountain.js'

describe('qadaMountain', () => {
  it('p=0 ətək, p=1 zirvə; aralıq dəyərlər sıxılır', () => {
    expect(pointAt(TRAIL, 0)).toEqual({ x: 150, y: 290 })
    const top = pointAt(TRAIL, 1)
    expect(top.x).toBeCloseTo(330, 6); expect(top.y).toBeCloseTo(24, 6)
    expect(pointAt(TRAIL, 5).x).toBeCloseTo(330, 6)
    expect(pointAt(TRAIL, -1)).toEqual({ x: 150, y: 290 })
  })
  it('irəlilədikcə yuxarı qalxır (y azalır, monoton deyil ancaq ümumən)', () => {
    const ys = [0, 0.25, 0.5, 0.75, 1].map(p => pointAt(TRAIL, p).y)
    expect(ys[0]).toBeGreaterThan(ys[2])
    expect(ys[2]).toBeGreaterThan(ys[4])
  })
  it('10 düşərgə; yol M ilə başlayır', () => {
    expect(CAMPS).toHaveLength(10)
    expect(CAMPS.at(-1)).toBe(1)
    expect(trailPath(TRAIL).startsWith('M150,290 L360,262')).toBe(true)
  })
})
