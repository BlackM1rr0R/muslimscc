import { describe, it, expect } from 'vitest'
import {
  lightDir, projectToPlane, clipPoly, lightPatches, latticeOpenings, floorStats,
  sunInRoom, wallAzimuth, localMidnight, hhmmToMs, firstHit, ROOM,
} from '../../src/utils/mashrabiya'
import { asrDay, localDayStart } from '../../src/utils/asrShadow'

const RAD = Math.PI / 180
const DEEP = { w: 400, h: 3.2, d: 400 }   // döşəmə "sonsuz" — ləkə yalnız döşəməyə düşsün

describe('mashrabiya — həndəsə', () => {
  it('işığın istiqaməti: vahid vektor, aşağı və otağa doğru; yan Günəşdə x işarəsi', () => {
    const d = lightDir(40, 180, 180)
    expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 9)
    expect(d.y).toBeCloseTo(-Math.sin(40 * RAD), 9)
    expect(d.x).toBeCloseTo(0, 9)
    expect(d.z).toBeGreaterThan(0)
    // cənuba baxan divar, Günəş cənub-şərqdə → işıq qərbə (içəridən baxana sağa, x > 0)
    expect(lightDir(30, 135, 180).x).toBeGreaterThan(0)
    expect(lightDir(30, 225, 180).x).toBeLessThan(0)
  })

  it('şüa–müstəvi kəsişməsi düzgündür', () => {
    const d = lightDir(45, 180, 180)          // 45° → hündürlük qədər irəli
    const q = projectToPlane([0.3, 2, 0], d, 1, 0)
    expect(q[0]).toBeCloseTo(0.3, 9)
    expect(q[1]).toBeCloseTo(0, 9)
    expect(q[2]).toBeCloseTo(2, 9)
    // ixtiyari istiqamət: nöqtə müstəvidədir və P + t·D xəttindədir
    const d2 = lightDir(23, 150, 180)
    const p = [-0.4, 1.7, 0]
    const r = projectToPlane(p, d2, 1, 0)
    const t = (r[2] - p[2]) / d2.z
    expect(r[1]).toBeCloseTo(0, 9)
    expect(r[0]).toBeCloseTo(p[0] + t * d2.x, 9)
    expect(r[1]).toBeCloseTo(p[1] + t * d2.y, 9)
    expect(r[2]).toBeCloseTo(1.7 / Math.tan(23 * RAD) * Math.cos(30 * RAD), 9)
    // arxaya doğru (t < 0) — yoxdur
    expect(projectToPlane([0, 1, 0], d2, 1, 5)).toBeNull()
  })

  it('kəsmə: kvadrat zolağa düzgün kəsilir', () => {
    const sq = [[0, 0, 0], [2, 0, 0], [2, 0, 2], [0, 0, 2]]
    const c = clipPoly(sq, 0, 1, 5)
    expect(Math.min(...c.map(p => p[0]))).toBeCloseTo(1, 9)
    expect(c.length).toBe(4)
    expect(clipPoly(sq, 0, 3, 5)).toEqual([])
  })

  it('Günəş alçaldıqca ləkə divardan uzaqlaşır', () => {
    const open = latticeOpenings()
    let prev = -Infinity
    for (const alt of [70, 55, 40, 28, 18, 10]) {
      const s = floorStats(lightPatches(open, lightDir(alt, 180, 180), DEEP))
      expect(s.area).toBeGreaterThan(0)
      expect(s.meanZ).toBeGreaterThan(prev)
      prev = s.meanZ
    }
  })

  it('Günəş üfüqdən aşağı və ya divarın arxasındadırsa ləkə yoxdur', () => {
    const open = latticeOpenings()
    expect(lightDir(-3, 180, 180)).toBeNull()
    expect(lightDir(0, 180, 180)).toBeNull()
    expect(lightDir(30, 0, 180)).toBeNull()      // şimalda, divar cənuba baxır
    expect(lightDir(30, 270.5, 180)).toBeNull()
    expect(lightPatches(open, null)).toEqual([])
  })

  it('ləkələr otağın səthlərindən kənara çıxmır; alçaq Günəşdə arxa divara keçir', () => {
    const open = latticeOpenings()
    const ps = lightPatches(open, lightDir(12, 200, 180), ROOM)
    expect(ps.some(p => p.surface === 'back')).toBe(true)
    for (const { surface, poly } of ps) for (const [x, y, z] of poly) {
      expect(Math.abs(x)).toBeLessThanOrEqual(ROOM.w / 2 + 1e-9)
      expect(y).toBeGreaterThanOrEqual(-1e-9)
      expect(y).toBeLessThanOrEqual(ROOM.h + 1e-9)
      expect(z).toBeGreaterThanOrEqual(-1e-9)
      expect(z).toBeLessThanOrEqual(ROOM.d + 1e-9)
      if (surface === 'floor') expect(Math.abs(y)).toBeLessThan(1e-9)
    }
    const h = firstHit([0, 2, 0], lightDir(12, 200, 180), ROOM)
    expect(h[2]).toBeCloseTo(ROOM.d, 6)
  })

  it('Bakı: günortada Günəş divarın qarşısında, ləkə ən yaxın; gecə yoxdur', () => {
    const lat = 40.4093, lng = 49.8671, tz = 'Asia/Baku'
    expect(wallAzimuth(lat)).toBe(180)
    expect(wallAzimuth(-33)).toBe(0)
    const day = asrDay(localDayStart(Date.UTC(2026, 11, 21, 8), tz), lat, lng)
    const open = latticeOpenings()
    const noon = sunInRoom(day.noon, lat, lng)
    expect(Math.abs(noon.rel)).toBeLessThan(1)
    const zNoon = floorStats(lightPatches(open, noon.dir, DEEP)).meanZ
    const zAsr = floorStats(lightPatches(open, sunInRoom(day.asr1, lat, lng).dir, DEEP)).meanZ
    expect(zAsr).toBeGreaterThan(zNoon)
    expect(sunInRoom(day.noon + 12 * 3600000, lat, lng).dir).toBeNull()
  })

  it('yerli gecəyarısı və HH:MM', () => {
    const ms = Date.UTC(2026, 10, 16, 10, 30)
    const mid = localMidnight(ms, 'Asia/Baku')            // UTC+4
    expect(mid).toBe(Date.UTC(2026, 10, 15, 20, 0))
    expect(hhmmToMs('12:15', mid)).toBe(Date.UTC(2026, 10, 16, 8, 15))
    expect(hhmmToMs('', mid)).toBeNull()
  })
})
