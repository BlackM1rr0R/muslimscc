// "Məscid kolleksiyam" (utils/mosqueVisits): təkrarsızlıq (OSM id, ≤ 30 m), ziyarət sayı,
// qeyd (≤ 200), statistika, sinxronda birləşmə
import { describe, it, expect } from 'vitest'
import {
  addVisit, removeVisit, setNote, visitStats, sanitizeVisits, visitId, combineVisit, round4, NOTE_MAX,
} from '../../src/utils/mosqueVisits.js'

const E = { v: 1, l: [] }

describe('məscid kolleksiyası', () => {
  it('koordinat 4 onluğa yuvarlanır; kimlik — OSM və ya koordinat', () => {
    expect(round4(40.371234)).toBe(40.3712)
    expect(visitId({ osm: 'w5', la: 1, lo: 2 })).toBe('w5')
    expect(visitId({ la: 40.37123, lo: 49.83456 })).toBe('g40.3712,49.8346')
  })
  it('eyni OSM obyekti — yeni yazı yox; başqa gün — ziyarət sayı artır, eyni gün — artmır', () => {
    let r = addVisit(E, { osm: 'w5', n: 'Təzəpir', la: 40.37, lo: 49.83, cc: '031' }, '2026-11-01')
    expect(r.added).toBe(true)
    r = addVisit(r.data, { osm: 'w5', n: 'Təzəpir', la: 40.37, lo: 49.83 }, '2026-11-01')
    expect(r.added).toBe(false)
    expect(r.data.l).toHaveLength(1)
    expect(r.data.l[0].c).toBe(1)
    r = addVisit(r.data, { osm: 'w5', la: 40.37, lo: 49.83 }, '2026-11-05')
    expect(r.data.l[0]).toMatchObject({ c: 2, d: '2026-11-01', ld: '2026-11-05', cc: '031' })
  })
  it('koordinatla əlavə olunan nöqtə ≤ 30 m-də OSM məscidi ilə birləşir; iki fərqli OSM məscidi yox', () => {
    let r = addVisit(E, { n: 'Mənim məscidim', la: 40.3712, lo: 49.8341 }, '2026-11-01')
    r = addVisit(r.data, { osm: 'n9', n: 'X', la: 40.3713, lo: 49.8342 }, '2026-11-02')
    expect(r.added).toBe(false)
    expect(r.data.l).toHaveLength(1)
    let q = addVisit(E, { osm: 'n1', n: 'A', la: 40.3712, lo: 49.8341 }, '2026-11-01')
    q = addVisit(q.data, { osm: 'n2', n: 'B', la: 40.3713, lo: 49.8341 }, '2026-11-01')
    expect(q.added).toBe(true)
    expect(q.data.l).toHaveLength(2)
  })
  it('qeyd ≤ 200 simvol, idarəedici simvollar təmizlənir; silmə', () => {
    let r = addVisit(E, { osm: 'n1', n: 'A', la: 1, lo: 2 }, '2026-11-01')
    const d = setNote(r.data, 'n1', `a\u0000b ${'x'.repeat(300)}`)
    expect(d.l[0].no.length).toBe(NOTE_MAX)
    expect(d.l[0].no.startsWith('a b')).toBe(true)
    expect(removeVisit(d, 'n1').l).toEqual([])
  })
  it('statistika: məscid, ölkə, ziyarət', () => {
    let r = addVisit(E, { osm: 'n1', la: 40, lo: 49, cc: '031' }, '2026-01-01')
    r = addVisit(r.data, { osm: 'n2', la: 41, lo: 29, cc: '792' }, '2026-01-01')
    r = addVisit(r.data, { osm: 'n3', la: 41.1, lo: 29.1, cc: '792' }, '2026-01-01')
    r = addVisit(r.data, { osm: 'n3', la: 41.1, lo: 29.1 }, '2026-02-01')
    expect(visitStats(r.data)).toEqual({ mosques: 3, countries: 2, visits: 4 })
  })
  it('sanitize: pozuq koordinat / tarix / təkrar id atılır', () => {
    const s = sanitizeVisits({ l: [{ i: 'n1', la: 95, lo: 0, d: '2026-01-01' }, { i: 'n2', la: 1, lo: 1, d: 'x' }, { i: 'n3', la: 1, lo: 1, d: '2026-01-01' }, { i: 'n3', la: 2, lo: 2, d: '2026-01-02' }] })
    expect(s.l.map((v) => v.i)).toEqual(['n3'])
  })
  it('combineVisit: ilk — ən erkən, son — ən gec, say — max, qeyd — yenisindən', () => {
    const a = { i: 'n1', n: 'A', la: 1, lo: 1, d: '2026-01-05', ld: '2026-02-01', c: 3, no: 'köhnə' }
    const b = { i: 'n1', n: '', la: 1, lo: 1, d: '2026-01-01', ld: '2026-03-01', c: 2, no: 'yeni' }
    expect(combineVisit(a, b)).toMatchObject({ n: 'A', d: '2026-01-01', ld: '2026-03-01', c: 3, no: 'yeni' })
  })
})
