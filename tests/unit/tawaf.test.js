import { describe, it, expect } from 'vitest'
import {
  TAU, CIRCUITS, CORNERS, CORNER_OFFSET, STONE_ANGLE, wrapDelta, angleOf, createTawaf, grab, move,
  advanceBy, advanceCircuit, circuitsOf, segmentAt, lapFraction, currentCircuit, markerAngle,
} from '../../src/utils/tawaf.js'

const DEG = Math.PI / 180

/** Barmağı başlanğıc bucaqdan `turns` dövrə (müsbət — saat əqrəbinin əksinə) hərəkət etdir */
function drag(state, from, turns, stepDeg = 10) {
  let s = grab(state)
  const done = []
  let backward = false
  const n = Math.round(Math.abs(turns) * 360 / stepDeg)
  const sign = Math.sign(turns)
  for (let i = 0; i <= n; i++) {
    const r = move(s, from + sign * i * stepDeg * DEG)
    s = r.state; done.push(...r.completed); backward = backward || r.backward
  }
  return { s, done, backward }
}

describe('həndəsə', () => {
  it('künclər dünya tərəflərinə təxminən baxır: Həcərül-Əsvəd şərq/c-ş, İraqi şimal, Şami qərb, Yəmani cənub', () => {
    const deg = (k) => angleOf(CORNERS[k]) / DEG
    expect(deg('stone')).toBeGreaterThan(-30); expect(deg('stone')).toBeLessThan(0)
    expect(deg('iraqi')).toBeGreaterThan(70); expect(deg('iraqi')).toBeLessThan(100)
    expect(Math.abs(deg('shami'))).toBeGreaterThan(150)
    expect(deg('yamani')).toBeGreaterThan(-110); expect(deg('yamani')).toBeLessThan(-80)
  })
  it('saat əqrəbinin əksinə sıra: Əsvəd → İraqi → Şami → Yəmani', () => {
    expect(CORNER_OFFSET.stone).toBeCloseTo(0)
    expect(CORNER_OFFSET.iraqi).toBeLessThan(CORNER_OFFSET.shami)
    expect(CORNER_OFFSET.shami).toBeLessThan(CORNER_OFFSET.yamani)
    expect(CORNER_OFFSET.yamani).toBeLessThan(360)
  })
})

describe('wrapDelta', () => {
  it('(-π, π] aralığı', () => {
    expect(wrapDelta(0)).toBe(0)
    expect(wrapDelta(TAU + 0.1)).toBeCloseTo(0.1)
    expect(wrapDelta(-TAU - 0.1)).toBeCloseTo(-0.1)
    expect(wrapDelta(Math.PI)).toBeCloseTo(Math.PI)
    expect(wrapDelta(-Math.PI)).toBeCloseTo(Math.PI)
    expect(wrapDelta(350 * DEG)).toBeCloseTo(-10 * DEG)
    expect(wrapDelta(-350 * DEG)).toBeCloseTo(10 * DEG)
  })
})

describe('dövrə sayğacı', () => {
  it('bir tam dövrə (±π keçidi daxil) — 1 dövrə', () => {
    const { s, done } = drag(createTawaf(), 170 * DEG, 1)
    expect(done).toEqual([1])
    expect(circuitsOf(s.progress)).toBe(1)
  })
  it('dövrədən az — sayılmır; barmaq hansı bucaqdan başlasa da', () => {
    const { s, done } = drag(createTawaf(), -90 * DEG, 0.95)
    expect(done).toEqual([])
    expect(circuitsOf(s.progress)).toBe(0)
  })
  it('saat əqrəbi istiqamətində — irəliləyiş yoxdur, ipucu var', () => {
    const { s, done, backward } = drag(createTawaf(), 0, -1)
    expect(done).toEqual([])
    expect(s.progress).toBe(0)
    expect(backward).toBe(true)
  })
  it('geri-irəli yırğalanma ikiqat saymır', () => {
    let s = createTawaf()
    let r = drag(s, 0, 0.5); s = r.s
    const p = s.progress
    // 60° geri, sonra 60° irəli — irəliləyiş dəyişmir
    s = grab(s)
    for (let a = 0; a <= 60; a += 10) s = move(s, -a * DEG).state
    expect(s.progress).toBeCloseTo(p)
    for (let a = 60; a >= 0; a -= 10) s = move(s, -a * DEG).state
    expect(s.progress).toBeCloseTo(p, 5)
    r = drag(s, 0, 0.55)
    expect(r.done).toEqual([1])
  })
  it('7 dövrədən sonra dayanır', () => {
    const { s, done } = drag(createTawaf(), 0, 9)
    expect(done).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(circuitsOf(s.progress)).toBe(CIRCUITS)
    expect(segmentAt(s.progress)).toBe('done')
    expect(lapFraction(s.progress)).toBe(1)
  })
  it('böyük sıçrayış (mərkəzdən keçmək) nəzərə alınmır', () => {
    let s = grab(createTawaf())
    s = move(s, 0).state
    const r = move(s, 170 * DEG)
    expect(r.state.progress).toBe(0)
  })
  it('advanceCircuit — Həcərül-Əsvəd xəttinə qədər tam dövrə', () => {
    let s = createTawaf()
    s = advanceBy(s, 100 * DEG).state
    const r = advanceCircuit(s)
    expect(r.completed).toEqual([1])
    expect(r.state.progress).toBeCloseTo(TAU)
    expect(currentCircuit(r.state.progress)).toBe(2)
    expect(markerAngle(r.state.progress)).toBeCloseTo(STONE_ANGLE)
  })
})

describe('segmentAt', () => {
  it('Kəbənin tərəfləri', () => {
    expect(segmentAt(0)).toBe('stone')
    expect(segmentAt(40 * DEG)).toBe('door')
    expect(segmentAt((CORNER_OFFSET.iraqi + 20) * DEG)).toBe('hijr')
    expect(segmentAt((CORNER_OFFSET.shami + 30) * DEG)).toBe('west')
    expect(segmentAt((CORNER_OFFSET.yamani + 10) * DEG)).toBe('between')
    expect(segmentAt(TAU + 355 * DEG)).toBe('between')
    expect(segmentAt(2 * TAU + 5 * DEG)).toBe('stone')
  })
})
