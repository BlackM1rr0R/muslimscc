// viz v2 — saf hesab funksiyaları (src/components/viz/scale.js) və format (format.js)
import { describe, it, expect } from 'vitest'
import {
  niceNum, niceTicks, linear, extent, sum, stackSeries, linePath, areaPath, pctDelta, bucketSum,
  quantileThresholds, levelOf, nearestIndex, relUnit, toDayKey, fromDayKey, addDayKey, dayKeys, etaFromPace,
} from '../../src/components/viz/scale.js'
import { makeFormat } from '../../src/components/viz/format.js'

describe('niceTicks', () => {
  it('0–97 → 0, 25, 50, 75, 100', () => {
    const t = niceTicks(0, 97, 4)
    expect(t.ticks).toEqual([0, 25, 50, 75, 100])
    expect(t.min).toBe(0); expect(t.max).toBe(100)
  })
  it('kiçik onluq diapazon üzən nöqtə xətasız', () => {
    expect(niceTicks(0, 0.9, 4).ticks).toEqual([0, 0.25, 0.5, 0.75, 1])
  })
  it('min = max = 0 → 0..1', () => {
    const t = niceTicks(0, 0, 4)
    expect(t.min).toBe(0); expect(t.max).toBeGreaterThan(0)
  })
  it('müsbət sabit dəyər 0-dan başlayır', () => {
    expect(niceTicks(5, 5).min).toBe(0)
  })
  it('integer: addım < 1 olmur', () => {
    const t = niceTicks(0, 3, 6, { integer: true })
    expect(t.step).toBe(1)
    expect(t.ticks).toEqual([0, 1, 2, 3])
    expect(niceTicks(0, 10, 4, { integer: true }).ticks).toEqual([0, 2, 4, 6, 8, 10])
  })
  it('mənfi diapazon və tərs sıra', () => {
    const t = niceTicks(10, -10, 4)
    expect(t.ticks[0]).toBeLessThanOrEqual(-10)
    expect(t.ticks[t.ticks.length - 1]).toBeGreaterThanOrEqual(10)
  })
  it('NaN dəyərlər çökdürmür', () => {
    expect(niceTicks(NaN, undefined).ticks.length).toBeGreaterThan(1)
  })
  it('niceNum', () => {
    expect(niceNum(87, false)).toBe(100)
    expect(niceNum(21, true)).toBe(20)
    expect(niceNum(23, true)).toBe(25)
    expect(niceNum(0, true)).toBe(1)
  })
})

describe('linear / extent / sum', () => {
  it('xətti miqyas və tərsi', () => {
    const s = linear([0, 10], [0, 200])
    expect(s(5)).toBe(100)
    expect(s.invert(50)).toBe(2.5)
  })
  it('RTL üçün tərs diapazon', () => {
    const s = linear([0, 4], [400, 0])
    expect(s(0)).toBe(400); expect(s(4)).toBe(0)
  })
  it('sıfır domen ortaya düşür', () => {
    expect(linear([3, 3], [0, 100])(3)).toBe(50)
  })
  it('extent rəqəm olmayanları atır', () => {
    expect(extent([3, null, 'x', -2, 7, NaN])).toEqual([-2, 7])
    expect(extent([])).toEqual([0, 0])
  })
  it('sum', () => { expect(sum([1, 2, NaN, 3])).toBe(6) })
})

describe('stackSeries', () => {
  it('yığma cütləri, mənfi/boş = 0', () => {
    const s = stackSeries([[1, 2, 3], [4, -1, 'x'], [1]])
    expect(s[0]).toEqual([[0, 1], [0, 2], [0, 3]])
    expect(s[1]).toEqual([[1, 5], [2, 2], [3, 3]])
    expect(s[2]).toEqual([[5, 6], [2, 2], [3, 3]])
  })
})

describe('linePath / areaPath', () => {
  it('boş və tək nöqtə', () => {
    expect(linePath([])).toBe('')
    expect(linePath([[1, 2]])).toBe('M1,2')
  })
  it('düz xətt', () => {
    expect(linePath([[0, 0], [10, 5]], 'linear')).toBe('M0,0L10,5')
  })
  it('monotone: düz (bərabər) hissədə aşma yoxdur', () => {
    const d = linePath([[0, 10], [10, 10], [20, 0], [30, 10]], 'monotone')
    const ys = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(m => Number(m[2]))
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThanOrEqual(10)
  })
  it('sahə qapalıdır', () => {
    const a = areaPath([[0, 0], [10, 0]], [[0, 10], [10, 10]], 'linear')
    expect(a.startsWith('M0,0')).toBe(true)
    expect(a.endsWith('Z')).toBe(true)
    expect(a).toContain('L10,10')
  })
})

describe('pctDelta / bucketSum', () => {
  it('faiz dəyişməsi', () => {
    expect(pctDelta(120, 100)).toBe(20)
    expect(pctDelta(50, 200)).toBe(-75)
    expect(pctDelta(1, 3)).toBe(-66.7)
  })
  it('əvvəlki 0 → null (sonsuz faiz göstərilmir)', () => {
    expect(pctDelta(5, 0)).toBeNull()
    expect(pctDelta(NaN, 4)).toBeNull()
  })
  it('qruplara yığma', () => {
    expect(bucketSum([1, 1, 1, 1, 1, 1, 1, 2, 2], 7)).toEqual([7, 4])
  })
})

describe('istilik pillələri', () => {
  it('boş → 1,2,3', () => { expect(quantileThresholds([0, 0])).toEqual([1, 2, 3]) })
  it('kvantillər artandır', () => {
    const t = quantileThresholds([1, 1, 1, 1, 1, 1])
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThan(t[i - 1])
  })
  it('levelOf', () => {
    const th = [2, 5, 8]
    expect(levelOf(0, th)).toBe(0)
    expect(levelOf(1, th)).toBe(1)
    expect(levelOf(5, th)).toBe(2)
    expect(levelOf(7, th)).toBe(3)
    expect(levelOf(99, th)).toBe(4)
  })
})

describe('nearestIndex', () => {
  it('artan və azalan (RTL)', () => {
    expect(nearestIndex(26, [0, 10, 20, 30])).toBe(3)
    expect(nearestIndex(26, [30, 20, 10, 0])).toBe(0)
    expect(nearestIndex(5, [])).toBe(-1)
  })
})

describe('relUnit', () => {
  const now = new Date(2026, 10, 9, 15, 0).getTime()
  it('dəqiqə / saat / gün', () => {
    expect(relUnit(now - 7 * 60e3, now)).toEqual({ value: -7, unit: 'minute' })
    expect(relUnit(now - 3 * 36e5, now)).toEqual({ value: -3, unit: 'hour' })
    expect(relUnit(now - 2 * 864e5, now)).toEqual({ value: -2, unit: 'day' })
    expect(relUnit(now - 20e3, now).unit).toBe('second')
  })
  it('gün dəqiqliyi: bu gün / dünən', () => {
    expect(relUnit(new Date(2026, 10, 9, 1), now, { dayOnly: true })).toEqual({ value: 0, unit: 'day' })
    expect(relUnit(new Date(2026, 10, 8, 23), now, { dayOnly: true })).toEqual({ value: -1, unit: 'day' })
    expect(relUnit(new Date(2026, 9, 9), now, { dayOnly: true }).unit).toBe('month')
  })
})

describe('gün açarları', () => {
  it('yerli tarix, ay/il keçidi', () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(addDayKey('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDayKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(fromDayKey('2026-11-09').getHours()).toBe(12)
  })
  it('dayKeys köhnədən yeniyə', () => {
    expect(dayKeys('2026-11-02', 3)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
  })
})

describe('etaFromPace', () => {
  const now = new Date(2026, 10, 9, 12)
  it('qalan / temp → gün', () => {
    const r = etaFromPace(100, 20, now)
    expect(r.days).toBe(5)
    expect(toDayKey(r.date)).toBe('2026-11-14')
  })
  it('temp yoxdur → null; bitib → 0', () => {
    expect(etaFromPace(10, 0, now)).toBeNull()
    expect(etaFromPace(0, 5, now).days).toBe(0)
  })
})

describe('makeFormat', () => {
  it('az: rəqəm, faiz, tarix, nisbi vaxt', () => {
    const f = makeFormat('az')
    expect(f.date(new Date(2026, 10, 9), { day: 'numeric', month: 'short' })).toBe('9 noy')
    expect(f.date(new Date(2026, 10, 9), { weekday: 'long', day: 'numeric', month: 'long' })).toBe('bazar ertəsi, 9 noyabr')
    expect(f.rel(Date.now() - 7 * 60e3)).toBe('7 dəq. əvvəl')
    expect(f.rel(new Date(), Date.now(), { dayOnly: true })).toBe('bu gün')
    expect(f.compact(12500)).toMatch(/12,5 min/)
    expect(f.num(NaN)).toBe('—')
    expect(f.num(2961)).toBe('2 961')
    expect(f.num(18.25)).toBe('18,3')
    expect(f.pct(12.34)).toBe('12,3%')
  })
  it('ar: latın rəqəmləri, RTL', () => {
    const f = makeFormat('ar')
    expect(f.rtl).toBe(true)
    expect(f.num(1234)).toMatch(/1.?234/)
  })
  it('en: nisbi vaxt Intl ilə', () => {
    const f = makeFormat('en')
    expect(f.rel(Date.now() - 2 * 36e5)).toMatch(/2 hr|2 hours/)
    expect(f.pct(12.34)).toBe('12.3%')
  })
})
