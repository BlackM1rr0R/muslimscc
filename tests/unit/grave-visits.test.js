// Qəbir ziyarəti xəritəsi (utils/graveVisits): təmizləmə, saxlama, məsafə, proyeksiya, koordinat oxuma,
// profil açarı və sinxronizasiya birləşdiricisi (utils/syncMergers → grave_visits_v1).
import { describe, it, expect } from 'vitest'
import {
  sanitizeGrave, sanitizeGraves, saveGrave, removeGrave, readGraves, distanceM, nearest, projector, parseLatLng,
  GRAVES_KEY, GRAVES_MAX, NAME_MAX,
} from '../../src/utils/graveVisits.js'
import { runMerger, CONFLICT } from '../../src/utils/syncMergers.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'

const mem = () => {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }
}
const G = (id, extra = {}) => ({ id, n: 'Nənə', la: 40.4093, lo: 49.8671, u: 1, ...extra })

describe('graveVisits', () => {
  it('sanitizeGrave: yararsız id / koordinat / boş ad → null; mətn qısaldılır, koordinat 6 onluq', () => {
    expect(sanitizeGrave(G('x1'))).toBe(null)
    expect(sanitizeGrave(G('gabcd1', { la: 91 }))).toBe(null)
    expect(sanitizeGrave(G('gabcd1', { lo: '49' }))).toBe(null)
    expect(sanitizeGrave(G('gabcd1', { n: '   ' }))).toBe(null)
    const g = sanitizeGrave(G('gabcd1', { n: 'x'.repeat(200), la: 40.123456789, no: 'sıra\u00074', u: 'z' }))
    expect([...g.n].length).toBe(NAME_MAX)
    expect(g.la).toBe(40.123457)
    expect(g.no).toBe('sıra 4')
    expect(g.u).toBe(0)
  })
  it('sanitizeGraves: təkrarsız, hədd', () => {
    const l = Array.from({ length: GRAVES_MAX + 5 }, (_, i) => G(`gid${String(i).padStart(4, '0')}`))
    expect(sanitizeGraves({ l: [...l, l[0]] }).l).toHaveLength(GRAVES_MAX)
    expect(sanitizeGraves(null)).toEqual({ v: 1, l: [] })
  })
  it('save / edit / remove; boş siyahı açarı silir', () => {
    const s = mem()
    const r = saveGrave({ n: 'Baba', la: 41, lo: 49 }, s, 1000)
    expect(r.ok).toBe(true)
    expect(readGraves(s).l).toHaveLength(1)
    const e = saveGrave({ ...r.item, n: 'Babam' }, s, 2000)
    expect(e.data.l).toEqual([{ ...r.item, n: 'Babam', u: 2000 }])
    expect(saveGrave({ n: 'Bad', la: 100, lo: 0 }, s).ok).toBe(false)
    removeGrave(r.item.id, s)
    expect(s.getItem(GRAVES_KEY)).toBe(null)
  })
  it('məsafə və ən yaxın', () => {
    const a = { la: 40.4093, lo: 49.8671 }
    expect(distanceM(a, a)).toBe(0)
    expect(distanceM(a, { la: 40.4103, lo: 49.8671 })).toBeGreaterThan(100)
    expect(distanceM(a, { la: 40.4103, lo: 49.8671 })).toBeLessThan(120)
    const list = [G('gfar01', { la: 41 }), G('gnear1', { la: 40.4094 })]
    expect(nearest(list, a)[0].g.id).toBe('gnear1')
    expect(nearest(list, null)).toEqual([])
  })
  it('proyeksiya: tək nöqtə mərkəzdə, sərhədlər içəridə', () => {
    const one = projector([{ la: 1, lo: 2 }], 320, 200)
    expect([one.x(1, 2), one.y(1, 2)]).toEqual([160, 100])
    const pr = projector([{ la: 0, lo: 0 }, { la: 1, lo: 1 }], 320, 200, 20)
    for (const [la, lo] of [[0, 0], [1, 1]]) {
      expect(pr.x(la, lo)).toBeGreaterThanOrEqual(20); expect(pr.x(la, lo)).toBeLessThanOrEqual(300)
      expect(pr.y(la, lo)).toBeGreaterThanOrEqual(20); expect(pr.y(la, lo)).toBeLessThanOrEqual(180)
    }
    expect(pr.y(1, 1)).toBeLessThan(pr.y(0, 0))   // şimal yuxarıda
  })
  it('parseLatLng', () => {
    expect(parseLatLng('40.4093, 49.8671')).toEqual({ la: 40.4093, lo: 49.8671 })
    expect(parseLatLng('-33.9 18.4')).toEqual({ la: -33.9, lo: 18.4 })
    expect(parseLatLng('91, 0')).toBe(null)
    expect(parseLatLng('abc')).toBe(null)
  })
  it('profil açarıdır və birləşdiricisi var: 3 tərəfli, silinmə keçir, eyni nöqtədə təzəsi', () => {
    expect(PROFILE_KEYS).toContain(GRAVES_KEY)
    const base = JSON.stringify({ v: 1, l: [G('gaaaa1'), G('gbbbb1')] })
    const local = JSON.stringify({ v: 1, l: [G('gaaaa1', { n: 'Yeni', u: 5 }), G('gbbbb1'), G('gcccc1')] })
    const remote = JSON.stringify({ v: 1, l: [G('gaaaa1', { n: 'Köhnə', u: 3 })] })   // b silinib
    const out = JSON.parse(runMerger(GRAVES_KEY, local, remote, base))
    expect(out.l.map((x) => x.id).sort()).toEqual(['gaaaa1', 'gcccc1'])
    expect(out.l.find((x) => x.id === 'gaaaa1').n).toBe('Yeni')
    expect(runMerger(GRAVES_KEY, '{oops', remote, base)).toBe(CONFLICT)
  })
})
