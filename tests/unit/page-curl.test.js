// Mushafda vərəqi barmaqla çevirmək — qatlanma həndəsəsi və qərar məntiqi (src/utils/pageCurl.js)
import { describe, it, expect } from 'vitest'
import {
  CURL, curlZone, classifyDrag, curlPointer, turnProgress, shouldComplete, velocityFrom,
  foldGeometry, clipPolygon, applyMatrix, polygonCss, matrixCss, gradientAt, springStep,
} from '../../src/utils/pageCurl.js'

const area = pts => Math.abs(pts.reduce((s, [x, y], i) => {
  const [x2, y2] = pts[(i + 1) % pts.length]
  return s + x * y2 - x2 * y
}, 0)) / 2
const close = (a, b, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps)

describe('curlZone — harada tutmaq olar', () => {
  it('siçan: sol kənar → növbəti (+1), sağ kənar → əvvəlki (-1), orta → yox', () => {
    expect(curlZone(10, 400)).toBe(1)
    expect(curlZone(395, 400)).toBe(-1)
    expect(curlZone(200, 400)).toBe(null)
  })
  it('kənar zolağı ən azı 48px, ən çox yarım', () => {
    expect(curlZone(47, 200)).toBe(1)            // 20% = 40 < 48
    expect(curlZone(300, 1000)).toBe(null)       // 20% = 200
    expect(curlZone(190, 1000)).toBe(1)
    expect(curlZone(50, 60)).toBe(-1)
  })
  it('toxunuş/qələm: hər yer (istiqaməti hərəkət seçir); qutudan kənar — yox', () => {
    expect(curlZone(200, 400, 'touch')).toBe(0)
    expect(curlZone(200, 400, 'pen')).toBe(0)
    expect(curlZone(-1, 400, 'touch')).toBe(null)
    expect(curlZone(10, 0)).toBe(null)
  })
})

describe('classifyDrag — toxunuş, scroll və ya vərəq', () => {
  it('kiçik hərəkət — hələ toxunuşdur (söz/ayə kliki işləyir)', () => {
    expect(classifyDrag(4, 3)).toBe('pending')
    expect(classifyDrag(CURL.slop - 1, 0)).toBe('pending')
  })
  it('əsasən üfüqi → curl, əsasən şaquli → scroll', () => {
    expect(classifyDrag(30, 5)).toBe('curl')
    expect(classifyDrag(-30, 10)).toBe('curl')
    expect(classifyDrag(10, 30)).toBe('scroll')
    expect(classifyDrag(20, 20)).toBe('scroll')
  })
})

describe('curlPointer — kağızın tutulan nöqtəsi', () => {
  const o = { x: 0, y: 300 }
  it('üfüqi çəkmə ortadan tutanda düz qalır', () => {
    expect(curlPointer({ o, dx: 100, dy: 0, h: 600, dir: 1 })).toEqual({ x: 100, y: 300 })
  })
  it('geri (çölə) çəkmək olmur', () => {
    expect(curlPointer({ o, dx: -50, dy: 0, h: 600, dir: 1 })).toEqual({ x: 0, y: 300 })
    const r = curlPointer({ o: { x: 400, y: 300 }, dx: -100, dy: 0, h: 600, dir: -1 })
    expect(r).toEqual({ x: 300, y: 300 })
  })
  it('aşağı küncdən tutanda qat yuxarı əyilir; şaquli sapma |dx|/2 ilə məhduddur', () => {
    const p = curlPointer({ o: { x: 0, y: 600 }, dx: 100, dy: 0, h: 600, dir: 1 })
    expect(p.y).toBeLessThan(600)
    const q = curlPointer({ o, dx: 100, dy: 400, h: 600, dir: 1 })
    expect(q.y).toBe(350)
  })
})

describe('turnProgress / shouldComplete — buraxanda qərar', () => {
  it('irəliləyiş istiqamətə görə, mənfi olmur', () => {
    expect(turnProgress(140, 400, 1)).toBeCloseTo(0.35)
    expect(turnProgress(-140, 400, -1)).toBeCloseTo(0.35)
    expect(turnProgress(-140, 400, 1)).toBe(0)
    expect(turnProgress(10, 0, 1)).toBe(0)
  })
  it('35% və çoxu → tamamla, az → geri', () => {
    expect(shouldComplete(0.36, 0)).toBe(true)
    expect(shouldComplete(0.35, 0)).toBe(true)
    expect(shouldComplete(0.2, 0)).toBe(false)
  })
  it('sürətli atma qısa yolda da tamamlayır, geri atma uzun yolda da ləğv edir', () => {
    expect(shouldComplete(0.1, 0.8)).toBe(true)
    expect(shouldComplete(0.6, -0.8)).toBe(false)
    expect(shouldComplete(0.01, 2)).toBe(false)   // demək olar ki yerindən tərpənməyib
  })
  it('velocityFrom — son ~100ms üzrə px/ms', () => {
    expect(velocityFrom([])).toBe(0)
    expect(velocityFrom([{ x: 0, t: 0 }])).toBe(0)
    close(velocityFrom([{ x: 0, t: 0 }, { x: 50, t: 100 }, { x: 100, t: 200 }]), 0.5)
    close(velocityFrom([{ x: 0, t: 0 }, { x: 0, t: 500 }, { x: 60, t: 560 }]), 1)
  })
})

describe('foldGeometry — qatlanma xətti və əks inikas', () => {
  const W = 400, H = 600
  it('tutulmayıbsa heç nə kəsilmir', () => {
    const g = foldGeometry(W, H, { x: 0, y: 300 }, { x: 0, y: 300 })
    expect(g.cut).toEqual([])
    expect(g.len).toBe(0)
    expect(polygonCss(g.cut)).toBe('polygon(0 0, 0 0, 0 0)')
  })
  it('üfüqi çəkmə: qat şaquli, P-nin yarısında; kəsik + qalan = bütün vərəq', () => {
    const g = foldGeometry(W, H, { x: 0, y: 300 }, { x: 200, y: 300 })
    close(g.mid.x, 100)
    close(area(g.cut), 100 * H)
    close(area(g.cut) + area(g.rest), W * H)
    // O nöqtəsi P-yə düşür, qat xəttindəki nöqtələr yerində qalır
    const [ox, oy] = applyMatrix(g.matrix, [0, 300])
    close(ox, 200); close(oy, 300)
    const [fx, fy] = applyMatrix(g.matrix, [100, 37])
    close(fx, 100); close(fy, 37)
  })
  it('maili qat: əks inikas məsafəni saxlayır və involyusiyadır', () => {
    const o = { x: 0, y: 600 }
    const p = { x: 180, y: 520 }
    const g = foldGeometry(W, H, o, p)
    const [px, py] = applyMatrix(g.matrix, [o.x, o.y])
    close(px, p.x); close(py, p.y)
    const a = [30, 590], b = [90, 500]
    const ra = applyMatrix(g.matrix, a), rb = applyMatrix(g.matrix, b)
    close(Math.hypot(ra[0] - rb[0], ra[1] - rb[1]), Math.hypot(a[0] - b[0], a[1] - b[1]))
    const back = applyMatrix(g.matrix, ra)
    close(back[0], a[0]); close(back[1], a[1])
    // kəsik küncdəki üçbucaq/trapesiyadır və O-nu ehtiva edir
    expect(g.cut.some(([x, y]) => x === 0 && y === 600)).toBe(true)
    close(area(g.cut) + area(g.rest), W * H, 1e-3)
  })
  it('əvvəlki səhifə: sağ kənardan sola — kəsik sağdadır', () => {
    const g = foldGeometry(W, H, { x: W, y: 300 }, { x: W - 120, y: 300 })
    expect(Math.min(...g.cut.map(([x]) => x))).toBeCloseTo(W - 60)
    close(area(g.cut), 60 * H)
  })
  it('tam çevrilmə (P = O + 2W): qat cilddə, bütün vərəq qalxır və o biri tərəfə düşür', () => {
    const g = foldGeometry(W, H, { x: 0, y: 300 }, { x: 2 * W, y: 300 })
    close(area(g.cut), W * H)
    const [x0] = applyMatrix(g.matrix, [0, 0])
    close(x0, 2 * W)
  })
})

describe('köməkçilər', () => {
  it('clipPolygon yarımmüstəvi ilə', () => {
    const sq = [[0, 0], [10, 0], [10, 10], [0, 10]]
    close(area(clipPolygon(sq, ([x]) => 4 - x)), 40)
    expect(clipPolygon(sq, () => -1)).toEqual([])
  })
  it('CSS sətirləri', () => {
    expect(polygonCss([[0, 0], [10.04, 0], [10, 5.55]])).toBe('polygon(0px 0px, 10px 0px, 10px 5.6px)')
    expect(matrixCss([-1, 0, 0, 1, 200, 0])).toBe('matrix(-1, 0, 0, 1, 200, 0)')
  })
  it('gradientAt: 90deg — sağa, qat nöqtəsinin yeri px ilə', () => {
    const r = gradientAt(400, 600, { x: 100, y: 300 }, { x: 1, y: 0 })
    expect(r.deg).toBe(90)
    close(r.at, 100, 1e-9)
    const l = gradientAt(400, 600, { x: 100, y: 300 }, { x: -1, y: 0 })
    expect(l.deg).toBe(-90)
    close(l.at, 300, 1e-9)
  })
  it('springStep hədəfə yaxınlaşır və sakitləşir', () => {
    let s = { x: 0, v: 0 }
    for (let i = 0; i < 120; i++) s = springStep(s.x, s.v, 100, 16)
    expect(Math.abs(s.x - 100)).toBeLessThan(1)
    expect(Math.abs(s.v)).toBeLessThan(0.05)
    // böyük dt (fon tabı) partlamır
    const big = springStep(0, 0, 100, 5000)
    expect(Math.abs(big.x)).toBeLessThan(100)
  })
})
