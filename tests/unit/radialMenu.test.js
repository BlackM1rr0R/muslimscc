// Dairəvi menyu (utils/radialMenu) — qövs, ekrana sığma, seçim, info pəncərəsi
import { describe, it, expect } from 'vitest'
import { RADIAL, arcAngles, layoutRadial, pickIndex, movedBeyond, placePopover, cycleIndex } from '../../src/utils/radialMenu.js'

const VW = 390, VH = 844
const inside = (items, vw = VW, vh = VH) => items.every(p =>
  p.x - RADIAL.item / 2 >= RADIAL.margin - 0.2 && p.x + RADIAL.item / 2 <= vw - RADIAL.margin + 0.2 &&
  p.y - RADIAL.item / 2 >= RADIAL.margin - 0.2 && p.y + RADIAL.item / 2 <= vh - RADIAL.margin + 0.2)

describe('arcAngles', () => {
  it('5 düymə yuxarı qövsdə, soldan sağa bərabər addımla', () => {
    expect(arcAngles(5)).toEqual([-165, -127.5, -90, -52.5, -15])
  })
  it('RTL — sıra tərsinədir (birinci düymə sağda)', () => {
    expect(arcAngles(5, { rtl: true })).toEqual([-15, -52.5, -90, -127.5, -165])
  })
  it('aşağı qövs də soldan sağa düzülür', () => {
    const a = arcAngles(3, { center: 90, up: false })
    expect(a).toEqual([165, 90, 15])
    expect(Math.cos(a[0] * Math.PI / 180)).toBeLessThan(0)   // birinci — solda
  })
  it('kənar hallar', () => {
    expect(arcAngles(0)).toEqual([])
    expect(arcAngles(1, { center: -45 })).toEqual([-45])
  })
})

describe('layoutRadial', () => {
  it('ekranın ortasında — barmağın üstündə, sürüşmə yoxdur, hamısı radius məsafəsində', () => {
    const r = layoutRadial({ x: 195, y: 400, count: 5, vw: VW, vh: VH })
    expect(r.up).toBe(true)
    expect(r.dx).toBe(0); expect(r.dy).toBe(0)
    for (const p of r.items) {
      expect(p.y).toBeLessThan(400)
      expect(Math.hypot(p.x - 195, p.y - 400)).toBeCloseTo(RADIAL.radius, 0)
    }
    expect(r.items[0].x).toBeLessThan(r.items[4].x)
  })
  it('yuxarıda yer yoxdursa — altına açılır', () => {
    const r = layoutRadial({ x: 195, y: 40, count: 5, vw: VW, vh: VH })
    expect(r.up).toBe(false)
    expect(r.items.every(p => p.y > 40)).toBe(true)
    expect(inside(r.items)).toBe(true)
  })
  it('sol kənarda qövs sağa dönür və ekrandan çıxmır', () => {
    const r = layoutRadial({ x: 8, y: 300, count: 5, vw: VW, vh: VH })
    expect(inside(r.items)).toBe(true)
    expect(r.items[2].angle).toBe(-55)
  })
  it('sağ aşağı küncdə də ekrana sığır', () => {
    const r = layoutRadial({ x: VW - 4, y: VH - 4, count: 5, vw: VW, vh: VH })
    expect(inside(r.items)).toBe(true)
  })
  it('360px ekranda istənilən nöqtədə sığır', () => {
    for (const x of [0, 30, 180, 330, 360]) for (const y of [0, 60, 320, 640]) {
      expect(inside(layoutRadial({ x, y, count: 5, vw: 360, vh: 640 }).items, 360, 640)).toBe(true)
    }
  })
  it('RTL — birinci düymə sağda', () => {
    const r = layoutRadial({ x: 195, y: 400, count: 5, vw: VW, vh: VH, rtl: true })
    expect(r.items[0].x).toBeGreaterThan(r.items[4].x)
  })
})

describe('pickIndex', () => {
  const origin = { x: 195, y: 400 }
  const { items } = layoutRadial({ ...origin, count: 5, vw: VW, vh: VH })
  it('düymənin üstündə — həmin düymə', () => {
    items.forEach((p, i) => expect(pickIndex(items, p.x + 5, p.y - 5, { origin })).toBe(i))
  })
  it('mərkəzdə — heç biri', () => {
    expect(pickIndex(items, 197, 402, { origin })).toBe(-1)
  })
  it('istiqamətə görə — yarı yolda da seçilir', () => {
    expect(pickIndex(items, 195, 400 - RADIAL.radius * 0.6, { origin })).toBe(2)
  })
  it('qövsün əks tərəfi (aşağı) — heç biri', () => {
    expect(pickIndex(items, 195, 400 + RADIAL.radius, { origin })).toBe(-1)
  })
  it('boş siyahı', () => { expect(pickIndex([], 0, 0)).toBe(-1) })
})

describe('movedBeyond', () => {
  it('8px-ə qədər — yerində sayılır', () => {
    expect(movedBeyond({ x: 0, y: 0 }, { x: 5, y: 6 })).toBe(false)
    expect(movedBeyond({ x: 0, y: 0 }, { x: 6, y: 6 })).toBe(true)
    expect(movedBeyond(null, { x: 9, y: 9 })).toBe(false)
  })
})

describe('placePopover', () => {
  it('sözün altında, ortalanmış', () => {
    expect(placePopover({ left: 150, right: 250, top: 100, bottom: 130 }, { w: 300, h: 200 }, VW, VH)).toEqual({ left: 50, top: 140, side: 'below' })
  })
  it('altda yer yoxdursa — üstündə', () => {
    const p = placePopover({ left: 150, right: 250, top: 700, bottom: 730 }, { w: 300, h: 200 }, VW, VH)
    expect(p.side).toBe('above'); expect(p.top).toBe(490)
  })
  it('kənarda — ekrana sığdırılır', () => {
    expect(placePopover({ left: 0, right: 20, top: 100, bottom: 120 }, { w: 300, h: 100 }, VW, VH).left).toBe(12)
    expect(placePopover({ left: 370, right: 390, top: 100, bottom: 120 }, { w: 300, h: 100 }, VW, VH).left).toBe(78)
  })
})

describe('cycleIndex', () => {
  it('dövr edir', () => {
    expect(cycleIndex(4, 1, 5)).toBe(0)
    expect(cycleIndex(0, -1, 5)).toBe(4)
    expect(cycleIndex(0, 1, 0)).toBe(-1)
  })
})
