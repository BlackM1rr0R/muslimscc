// İz mühərriki (utils/traceScore v7) — örtük/kənar, RTL qruplar, sıra, hərfin başlanğıcı, qələm yolu
import { describe, it, expect } from 'vitest'
import {
  evaluate, isComplete, THRESHOLDS, components, groupRTL, spreadLabels, strokeGroup, strokeStartGroup, checkOrder,
  pathLength, LETTER_STROKES, checkLetterStart, penPath, strokeWidth,
} from '../../src/utils/traceScore.js'

const W = 20, H = 10
const blank = () => new Uint8Array(W * H)
const rect = (m, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * W + x] = 1; return m }
// Söz: sağda böyük hissə (x 13–18), solda böyük hissə (x 2–8), sol hissənin altında nöqtə
const word = () => { const m = blank(); rect(m, 13, 3, 18, 5); rect(m, 2, 3, 8, 5); rect(m, 5, 8, 5, 8); return m }

describe('evaluate', () => {
  it('nazik xətt genişləndirilərək hərfi örtür; kənar xam xətlə ölçülür', () => {
    const g = rect(blank(), 2, 3, 17, 5)
    const near = rect(blank(), 1, 2, 18, 6)
    const ink = rect(blank(), 2, 4, 17, 4) // ortadan bir xətt
    const r = evaluate(g, near, ink, W, H, 1)
    expect(r.coverage).toBe(1)
    expect(r.spill).toBe(0)
    expect(isComplete(r)).toBe(true)
    expect(evaluate(g, near, ink, W, H, 0).coverage).toBeCloseTo(1 / 3, 2)
  })
  it('hər yeri rəngləmək tamamlanma sayılmır; uşaq həddi daha yumşaqdır', () => {
    const g = rect(blank(), 2, 3, 17, 5), near = rect(blank(), 1, 2, 18, 6)
    expect(isComplete(evaluate(g, near, new Uint8Array(W * H).fill(1), W, H, 1))).toBe(false)
    expect(isComplete({ coverage: 0.65, spill: 0.4 }, THRESHOLDS.kid)).toBe(true)
    expect(isComplete({ coverage: 0.65, spill: 0.4 }, THRESHOLDS.normal)).toBe(false)
    expect(isComplete(null)).toBe(false)
  })
})

describe('RTL qruplar', () => {
  it('bağlı hissələr sayılır', () => {
    expect(components(word(), W, H).comps).toHaveLength(3)
  })
  it('sağdakı hissə 1-ci qrupdur, nöqtə ən yaxın böyük hissəyə qoşulur', () => {
    const { labels, groups } = groupRTL(word(), W, H)
    expect(groups).toHaveLength(2)
    expect(labels[4 * W + 15]).toBe(1)
    expect(labels[4 * W + 4]).toBe(2)
    expect(labels[8 * W + 5]).toBe(2)
    expect(groups[1].maxY).toBe(8)
  })
  it('xəttin qrupu — ən çox keçdiyi qrup (kənardan keçəndə də — spreadLabels)', () => {
    const { labels } = groupRTL(word(), W, H)
    const sp = spreadLabels(labels, W, H, 1)
    const stroke = [{ x: 18, y: 2 }, { x: 15, y: 2 }, { x: 13, y: 2 }]
    expect(strokeGroup(stroke, labels, W, H)).toBe(0)
    expect(strokeGroup(stroke, sp, W, H)).toBe(1)
    // sağdan sola bütün sözü keçən xətt — başladığı qrup 1-dir
    const across = Array.from({ length: 17 }, (_, i) => ({ x: 18 - i, y: 4 }))
    expect(strokeStartGroup(across, labels, W, H)).toBe(1)
    expect(strokeStartGroup([...across].reverse(), labels, W, H)).toBe(2)
  })
  it('sıra: sağdan sola düzgün; soldan başlamaq — səhv; geri qayıtmaq və nöqtə — icazəlidir', () => {
    expect(checkOrder([{ group: 1, len: 10 }, { group: 2, len: 10 }]).ok).toBe(true)
    expect(checkOrder([{ group: 2, len: 10 }, { group: 1, len: 10 }])).toEqual({ ok: false, wrongAt: 1 })
    expect(checkOrder([{ group: 1, len: 10 }, { group: 2, len: 10 }, { group: 1, len: 8 }]).ok).toBe(true)
    expect(checkOrder([{ group: 2, len: 1 }, { group: 1, len: 10 }, { group: 2, len: 10 }], 3).ok).toBe(true)
    expect(checkOrder([{ group: 0, len: 10 }, { group: 1, len: 10 }]).ok).toBe(true)
  })
})

describe('hərfin başlanğıcı', () => {
  const box = { minX: 0, maxX: 100, minY: 0, maxY: 100 }
  const line = (x0, y0, x1, y1, n = 10) => Array.from({ length: n + 1 }, (_, i) => ({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n }))
  it('əlif yuxarıdan aşağı', () => {
    expect(checkLetterStart(line(50, 2, 50, 98), box, LETTER_STROKES['ا']).ok).toBe(true)
    const up = checkLetterStart(line(50, 98, 50, 2), box, LETTER_STROKES['ا'])
    expect(up).toMatchObject({ checked: true, ok: false, sideOk: false, dirOk: false })
  })
  it('be sağdan sola', () => {
    expect(checkLetterStart(line(95, 30, 5, 60), box, LETTER_STROKES['ب']).ok).toBe(true)
    expect(checkLetterStart(line(5, 60, 95, 30), box, LETTER_STROKES['ب']).ok).toBe(false)
  })
  it('məlumat olmayan hərf yoxlanılmır (uydurulmur)', () => {
    expect(LETTER_STROKES['ع']).toBeUndefined()
    expect(checkLetterStart(line(0, 0, 9, 9), box, LETTER_STROKES['ع'])).toMatchObject({ checked: false, ok: true })
    expect(Object.keys(LETTER_STROKES).length).toBeLessThanOrEqual(28)
  })
})

describe('köməkçilər', () => {
  it('pathLength və penPath (sağdan sola)', () => {
    expect(pathLength([{ x: 0, y: 0 }, { x: 3, y: 4 }])).toBe(5)
    const p = penPath(rect(blank(), 2, 3, 8, 5), W, H)
    expect(p[0]).toEqual({ x: 8, y: 4 })
    expect(p.at(-1)).toEqual({ x: 2, y: 4 })
  })
  it('strokeWidth — xəttin qalınlığı təxminən düzgün', () => {
    const big = new Uint8Array(100 * 40)
    for (let y = 10; y < 16; y++) for (let x = 5; x < 95; x++) big[y * 100 + x] = 1
    expect(strokeWidth(big, 100, 40)).toBeGreaterThan(5)
    expect(strokeWidth(big, 100, 40)).toBeLessThan(7.5)
    expect(strokeWidth(new Uint8Array(4), 2, 2)).toBe(0)
  })
})
