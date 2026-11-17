// Ömürlük Quran mozaikası (utils/quranLife) — bitset, oxu qeydi, xətm, yazıcı
import { describe, it, expect, beforeEach } from 'vitest'
import {
  TOTAL, BYTES, LIFE_KEY, newBits, setBit, hasBit, countBits, encodeBits, decodeBits, idxOf,
  emptyLife, sanitizeLife, serializeLife, readLife, writeLife, applyRead, lifeStats, pageAyahs,
  recordAyahs, flushLife, _resetRecorder,
} from '../../src/utils/quranLife.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const mem = () => {
  const m = new Map()
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }
}
const all = () => Array.from({ length: TOTAL }, (_, i) => i)

describe('bitset', () => {
  it('6236 bit → 780 bayt; set / has / count', () => {
    expect(TOTAL).toBe(6236)
    expect(BYTES).toBe(780)
    const b = newBits()
    setBit(b, 0); setBit(b, 7); setBit(b, 8); setBit(b, 6235)
    expect([0, 7, 8, 6235].every(i => hasBit(b, i))).toBe(true)
    expect(hasBit(b, 1)).toBe(false)
    expect(countBits(b)).toBe(4)
  })
  it('base64 gediş-dönüş; sondakı sıfırlar atılır; pozuq sətir — boş', () => {
    const b = newBits()
    expect(encodeBits(b)).toBe('')
    setBit(b, 3); setBit(b, 100)
    const s = encodeBits(b)
    expect(s.length).toBeLessThan(24)
    expect(Array.from(decodeBits(s))).toEqual(Array.from(b))
    const full = newBits(); all().forEach(i => setBit(full, i))
    const fs = encodeBits(full)
    expect(fs.length).toBe(1040)
    expect(countBits(decodeBits(fs))).toBe(TOTAL)
    expect(countBits(decodeBits('###'))).toBe(0)
    // TOTAL-dan artıq bitlər təmizlənir
    expect(countBits(decodeBits(globalThis.btoa(String.fromCharCode(...new Array(800).fill(255)))))).toBe(TOTAL)
  })
  it('ayə → indeks', () => {
    expect(idxOf(1, 1)).toBe(0)
    expect(idxOf(2, 1)).toBe(7)
    expect(idxOf(114, 6)).toBe(6235)
    expect(idxOf(1, 8)).toBe(-1)
    expect(idxOf(115, 1)).toBe(-1)
    expect(idxOf('2', '255')).toBe(7 + 254)
  })
})

describe('applyRead / lifeStats', () => {
  it('yeni ayələr həm "nə vaxtsa", həm cari dövrə düşür; surə günləri yazılır', () => {
    const r = applyRead(emptyLife(), [0, 1, 1, -5, 99999], '2026-11-10')
    expect(r.added).toBe(2)
    expect(r.changed).toBe(true)
    expect(r.st.r).toBe('2026-11-10')
    expect(r.st.d[1]).toEqual(['2026-11-10', '2026-11-10'])
    const r2 = applyRead(r.st, [1], '2026-11-12')
    expect(r2.added).toBe(0)
    expect(r2.st.d[1]).toEqual(['2026-11-10', '2026-11-12'])
    expect(applyRead(r2.st, [1], '2026-11-12').changed).toBe(false)
  })
  it('Fatihə oxunanda: 1 surə tamamlanıb', () => {
    const { st } = applyRead(emptyLife(), [0, 1, 2, 3, 4, 5, 6], '2026-11-10')
    const s = lifeStats(st)
    expect(s).toMatchObject({ ever: 7, current: 7, surahsDone: 1, khatms: 0 })
    expect(s.pct).toBeCloseTo(7 / 6236)
  })
  it('bütün ayələr → xətm: sayğac artır, dövr sıfırlanır, "nə vaxtsa" qalır', () => {
    const a = applyRead(emptyLife(), all().slice(0, 3000), '2026-01-01')
    const b = applyRead(a.st, all().slice(3000), '2026-02-15')
    expect(b.khatm).toEqual({ s: '2026-01-01', e: '2026-02-15', n: 1 })
    expect(b.st.k).toBe(1)
    expect(b.st.ks).toEqual([{ s: '2026-01-01', e: '2026-02-15' }])
    expect(countBits(b.st.c)).toBe(0)
    expect(b.st.r).toBe(null)
    const s = lifeStats(b.st)
    expect(s).toMatchObject({ ever: TOTAL, current: 0, surahsDone: 114, khatms: 1, round: 0 })
    // növbəti dövr
    const c = applyRead(b.st, [10], '2026-03-01')
    expect(c.st.r).toBe('2026-03-01')
    expect(c.khatm).toBe(null)
  })
  it('serializasiya gediş-dönüş və pozuq məlumatın təmizlənməsi', () => {
    const { st } = applyRead(emptyLife(), [5, 600, 6235], '2026-11-10')
    const back = sanitizeLife(JSON.parse(JSON.stringify(serializeLife(st))))
    expect(lifeStats(back).ever).toBe(3)
    expect(back.d).toEqual(st.d)
    const bad = sanitizeLife({ e: 5, c: 'x', r: 'dünən', k: -2, ks: [{ s: '2026-02-01', e: '2026-01-01' }, null], d: { 0: ['a', 'b'], 2: ['2026-01-02', '2026-01-01'] } })
    expect(bad.k).toBe(0)
    expect(bad.ks).toEqual([])
    expect(bad.r).toBe(null)
    expect(bad.d).toEqual({ 2: ['2026-01-01', '2026-01-02'] })
    expect(sanitizeLife(null).k).toBe(0)
  })
  it('kompakt: tam oxunmuş Quran + 114 surə günü < 6 KB', () => {
    const a = applyRead(emptyLife(), all().slice(0, 6000), '2026-01-01')
    expect(JSON.stringify(serializeLife(a.st)).length).toBeLessThan(6000)
  })
})

describe('Mushaf səhifəsi → ayələr', () => {
  it('sözlərdən unikal ayələr (yararsızlar atılır)', () => {
    const words = [{ s: 2, a: 1 }, { s: 2, a: 1 }, { s: 2, a: 2 }, { s: 0, a: 1 }, { s: 2, a: 999 }, null]
    expect(pageAyahs(words)).toEqual([7, 8])
  })
})

describe('yazıcı: recordAyahs → flushLife', () => {
  beforeEach(() => _resetRecorder())
  it('növbə bir dəfə yazılır, mövcud məlumatla birləşir', () => {
    const s = mem()
    writeLife(applyRead(emptyLife(), [0], '2026-11-01').st, s)
    recordAyahs([{ s: 1, a: 2 }, { s: 1, a: 3 }, 50, { s: 999, a: 1 }])
    const r = flushLife(s, '2026-11-02')
    expect(r.added).toBe(3)
    const st = readLife(s)
    expect(lifeStats(st).ever).toBe(4)
    expect(st.d[1]).toEqual(['2026-11-01', '2026-11-02'])
    expect(flushLife(s)).toBe(null)
  })
  it('açar ehtiyat nüsxəyə (və hesab sinxronizasiyasına) düşür', () => {
    expect(isBackupKey(LIFE_KEY)).toBe(true)
  })
})
