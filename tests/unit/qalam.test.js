// Qamış qələm (utils/qalam) — enli ucluq həndəsəsi, nöqtə vahidi, şablonun yerləşməsi
import { describe, it, expect } from 'vitest'
import {
  ALIF_DOTS, HAIRLINE, LETTERS, alifHeight, dirAngle, dotColumn, dotExtent, dotRhombus,
  layoutGlyph, nibQuad, nibRatio, nibVector, nibWidth, pct, pressureScale, smoothPoint,
} from '../../src/utils/qalam.js'

const close = (a, b, e = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(e)

describe('enli ucluq', () => {
  it('70° ucluq "/" kimi dayanır: sağa və yuxarı (ekranda y aşağı)', () => {
    const n = nibVector(70, 2)
    expect(n.x).toBeGreaterThan(0); expect(n.y).toBeLessThan(0)
    close(Math.hypot(n.x, n.y), 1)
  })
  it('istiqamət: sağa 0°, yuxarı 90°, aşağı −90°', () => {
    close(dirAngle({ x: 0, y: 0 }, { x: 1, y: 0 }), 0)
    close(dirAngle({ x: 0, y: 0 }, { x: 0, y: -1 }), 90)
    close(dirAngle({ x: 0, y: 0 }, { x: 0, y: 1 }), -90)
  })
  it('qalınlıq = w·|sin(istiqamət − ucluq)|, paralel hərəkətdə saç xətti', () => {
    close(nibWidth(0, 70, 1), Math.sin(70 * Math.PI / 180))
    close(nibWidth(-90, 70, 1), Math.abs(Math.sin(-160 * Math.PI / 180)))
    expect(nibWidth(70, 70, 1)).toBe(HAIRLINE)
    expect(nibWidth(250, 70, 2)).toBe(2 * HAIRLINE)
    close(nibRatio(160, 70), 1)
  })
  it('70°-də üfüqi xətt şaquli xətdən qalındır', () => {
    expect(nibWidth(180, 70, 1)).toBeGreaterThan(nibWidth(-90, 70, 1) * 2)
  })
  it('seqment izi — kəsiklər paralel, ölçüsü ucluğa bərabər', () => {
    const q = nibQuad({ x: 0, y: 0 }, { x: 10, y: 0 }, 90, 4)
    expect(q).toEqual([{ x: 0 + 2 * Math.cos(Math.PI / 2), y: -2 }, { x: 10 + 2 * Math.cos(Math.PI / 2), y: -2 }, { x: 10 - 2 * Math.cos(Math.PI / 2), y: 2 }, { x: 0 - 2 * Math.cos(Math.PI / 2), y: 2 }])
    const t = nibQuad({ x: 0, y: 0 }, { x: 0, y: 5 }, 0, 2, 4)
    close(t[0].x, 1); close(t[1].x, 2); close(t[2].x, -2); close(t[3].x, -1)
  })
})

describe('nöqtə vahidi', () => {
  it('romb — tərəfləri ucluğun eninə bərabər', () => {
    const p = dotRhombus(0, 0, 70, 3)
    for (let i = 0; i < 4; i++) {
      const a = p[i], b = p[(i + 1) % 4]
      close(Math.hypot(a.x - b.x, a.y - b.y), 3, 1e-9)
    }
  })
  it('45°-də nöqtə küncü üstündə dayanan kvadratdır: hündürlük w√2', () => {
    close(dotExtent(45, 1).h, Math.SQRT2)
    close(dotExtent(90, 1).h, 1)
    const p = dotRhombus(5, 5, 45, 1)
    const ys = p.map(v => v.y)
    close(Math.max(...ys) - Math.min(...ys), Math.SQRT2)
  })
  it('əlif = nöqtələr sütunu', () => {
    expect(ALIF_DOTS.naskh).toBe(5)
    expect(ALIF_DOTS.thuluth).toEqual([7, 8, 9])
    close(alifHeight(5, 45, 1), 5 * Math.SQRT2)
    const col = dotColumn(5, 0, 10, 45, 1)
    expect(col).toHaveLength(5)
    close(col[0].cy - Math.SQRT2 / 2, 10)
    close(col[4].cy + Math.SQRT2 / 2, 10 + alifHeight(5, 45, 1))
  })
})

describe('hamarlıq və təzyiq', () => {
  it('smoothPoint yarı yola gedir', () => {
    expect(smoothPoint(null, { x: 1, y: 2 })).toEqual({ x: 1, y: 2 })
    expect(smoothPoint({ x: 0, y: 0, w: 1 }, { x: 2, y: 4, w: 3 })).toEqual({ x: 1, y: 2, w: 2 })
  })
  it('təzyiq yalnız stylus üçün', () => {
    expect(pressureScale('mouse', 0.5)).toBe(1)
    expect(pressureScale('touch', 1)).toBe(1)
    expect(pressureScale('pen', 0)).toBe(1)
    close(pressureScale('pen', 0.5), 0.825)
    expect(pressureScale('pen', 1)).toBe(1.2)
  })
})

describe('şablon', () => {
  it('şriftdəki əlif istənilən hündürlüyə gəlir, hərf mərkəzdə', () => {
    const alif = { left: 0, right: 50, ascent: 600, descent: 0 }
    const ba = { left: 10, right: 590, ascent: 300, descent: 100 }
    const L = layoutGlyph(alif, ba, 0.3, 0.5, 0.6)
    close(L.size, 0.5)
    close((L.box.minX + L.box.maxX) / 2, 0.5)
    close((L.box.minY + L.box.maxY) / 2, 0.6)
    close(L.box.maxX - L.box.minX, 0.3)
    close(L.box.maxY - L.box.minY, 0.2)
  })
  it('hərflər və faiz', () => {
    expect(LETTERS[0]).toBe('ا')
    expect(new Set(LETTERS).size).toBe(LETTERS.length)
    expect(pct(0.456)).toBe(46); expect(pct(2)).toBe(100); expect(pct(undefined)).toBe(0)
  })
})
