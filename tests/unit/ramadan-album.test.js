// Ramazan albomu (utils/ramadanAlbum): Ramazan aralığı (Ümmül-Qura, hicri sərhədlər), fəsil
// snapshot-u (Ramazandan əvvəl / ərzində / sonra, idempotentlik, oxu sayğacı), müqayisə,
// iftar dəvəti sayğacı (utils/iftarLog).
import { describe, it, expect } from 'vitest'
import { ramadanRange, ramadanYearOf, ramadanRangesInYear, inRange } from '../../src/utils/ramadanRange.js'
import {
  chapterFrom, computeAlbum, snapshotAlbum, readAlbum, sanitizeAlbum, khatmsIn, currentValues, readingCounter,
  chapters, compareChapters, ayahsOf, ALBUM_KEY, FASTS_KEY,
} from '../../src/utils/ramadanAlbum.js'
import { emptyLife, applyRead, serializeLife, TOTAL } from '../../src/utils/quranLife.js'
import { logIftarInvite, readIftarLog, sanitizeIftarLog, IFTAR_LOG_KEY } from '../../src/utils/iftarLog.js'

const J = JSON.stringify
const store = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m,
  }
}
const R47 = () => ramadanRange(1447)
const src = (o = {}) => ({ fasts: {}, life: emptyLife(), certs: [], plan: null, dhikr: {}, duas: [], iftar: {}, ...o })

describe('ramadanRange — hicri sərhədlər', () => {
  it('1447: 18 fevral — 19 mart 2026 (30 gün); 1446 və 1448 — 29 gün', () => {
    expect(R47()).toEqual({ y: 1447, s: '2026-02-18', e: '2026-03-19', days: 30 })
    expect(ramadanRange(1446)).toMatchObject({ s: '2025-03-01', e: '2025-03-29', days: 29 })
    expect(ramadanRange(1448)).toMatchObject({ s: '2027-02-08', e: '2027-03-08', days: 29 })
  })
  it('pozuq il → null', () => {
    expect(ramadanRange('x')).toBeNull()
    expect(ramadanRange(0)).toBeNull()
  })
  it('ramadanYearOf: Şabanın son günü — əvvəlki il, 1 Ramazan — bu il, 1 Şəvval — bitmiş', () => {
    expect(ramadanYearOf('2026-02-17')).toEqual({ y: 1446, phase: 'after' })
    expect(ramadanYearOf('2026-02-18')).toEqual({ y: 1447, phase: 'during' })
    expect(ramadanYearOf('2026-03-19')).toEqual({ y: 1447, phase: 'during' })
    expect(ramadanYearOf('2026-03-20')).toEqual({ y: 1447, phase: 'after' })
    expect(ramadanYearOf('2026-11-17')).toEqual({ y: 1447, phase: 'after' })
  })
  it('miladi ilə düşən Ramazanlar; inRange sərhədləri daxil', () => {
    expect(ramadanRangesInYear(2026).map((r) => r.y)).toEqual([1447])
    expect(inRange('2026-02-18', R47())).toBe(true)
    expect(inRange('2026-03-19', R47())).toBe(true)
    expect(inRange('2026-03-20', R47())).toBe(false)
    expect(inRange('2026-02-17', R47())).toBe(false)
  })
})

describe('fəsil snapshot-u', () => {
  const r = R47()
  it('Ramazandan əvvəl — fəsil yoxdur', () => {
    expect(chapterFrom(src({ fasts: { 1447: { 1: 1 } } }), r, '2026-02-17', null)).toBeNull()
  })
  it('mənbələr: oruclar, zikr, dualar, iftar — yalnız aralıqdakılar', () => {
    const s = src({
      fasts: { 1447: { 1: 1, 2: 1, 3: 2, 31: 1, x: 1 }, 1446: { 1: 1 } },
      dhikr: { '2026-02-17': 500, '2026-02-18': 33, '2026-03-19': 100, '2026-03-20': 999 },
      duas: [
        { id: 'a', date: '2026-02-20', answered: true, answeredDate: '2026-03-01' },
        { id: 'b', date: '2026-01-10', answered: true, answeredDate: '2026-03-19' },
        { id: 'c', date: '2026-03-25', answered: false },
      ],
      iftar: { '2026-03-01': 2, '2026-04-01': 5 },
    })
    const v = currentValues(s, r)
    expect(v).toMatchObject({ f: 2, x: 1, dh: 133, du: 1, da: 2, ii: 2 })
  })
  it('xətmlər: mozaika + eyni xətmin şəhadətnaməsi bir dəfə; plan ayrıca; aralıqdan kənar — yox', () => {
    const life = { ...emptyLife(), ks: [{ s: '2026-02-18', e: '2026-03-10' }, { s: '2025-01-01', e: '2025-02-01' }], k: 2 }
    const certs = [{ id: 'life:1:2026-03-10', src: 'life', start: '2026-02-18', end: '2026-03-10' }, { id: 'plan:2026-02-18', src: 'plan', start: '2026-02-18', end: '2026-03-15' }]
    const plan = { start: '2026-02-18', done: 604, log: ['2026-03-15'] }
    expect(khatmsIn(src({ life, certs, plan }), r)).toBe(2)
  })
  it('Ramazanda: oxu sayğacının başlanğıcı ilk baxışda, sonra artır; Ramazandan sonra donur', () => {
    let life = applyRead(emptyLife(), [0, 1, 2], '2026-02-10').st
    const base = readingCounter(life)
    let c = chapterFrom(src({ life }), r, '2026-02-18', null)
    expect(c).toMatchObject({ q0: base, q1: base, b: '2026-02-18' })
    expect(c.fin).toBeUndefined()
    life = applyRead(life, [3, 4, 5, 6, 7], '2026-02-25').st
    c = chapterFrom(src({ life }), r, '2026-02-25', c)
    expect(ayahsOf(c)).toBe(5)
    // Ramazandan sonra oxunanlar fəslə düşmür
    life = applyRead(life, [100, 101, 102], '2026-04-01').st
    c = chapterFrom(src({ life }), r, '2026-04-01', c)
    expect(ayahsOf(c)).toBe(5)
    expect(c.fin).toBe(1)
  })
  it('xətm Ramazanda tamamlananda sayğac azalmır (k × 6236 + cari dövr)', () => {
    const life = { ...emptyLife(), k: 1 }
    expect(readingCounter(life)).toBe(TOTAL)
  })
  it('Ramazandan sonra: dəyərlər kiçilmir (köhnələn zikr, silinən dua); Ramazanda — düzəliş keçir', () => {
    const during = chapterFrom(src({ fasts: { 1447: { 1: 1, 2: 1 } }, dhikr: { '2026-02-20': 50 } }), r, '2026-02-21', null)
    expect(during).toMatchObject({ f: 2, dh: 50 })
    const fixed = chapterFrom(src({ fasts: { 1447: { 1: 1 } }, dhikr: { '2026-02-20': 50 } }), r, '2026-02-22', during)
    expect(fixed.f).toBe(1)
    const after = chapterFrom(src({ fasts: { 1447: { 1: 1 } }, dhikr: {} }), r, '2026-05-01', fixed)
    expect(after).toMatchObject({ f: 1, dh: 50, fin: 1 })
  })
  it('Ramazandan sonra ilk dəfə hesablananda oxu ölçülmür (null), qalanı var', () => {
    const c = chapterFrom(src({ fasts: { 1447: { 5: 1 } } }), r, '2026-11-17', null)
    expect(c).toMatchObject({ f: 1, fin: 1 })
    expect(ayahsOf(c)).toBeNull()
  })
  it('boş fəsil saxlanmır', () => {
    expect(chapterFrom(src(), r, '2026-04-01', null)).toBeNull()
  })
})

describe('albom: computeAlbum / snapshotAlbum', () => {
  it('idempotent: ikinci çağırış heç nə dəyişmir; boş albom yazılmır', () => {
    const st = store({ [FASTS_KEY]: J({ 1447: { 1: 1, 2: 1 }, 1446: { 1: 1 } }) })
    const a = snapshotAlbum(st, '2026-11-17')
    expect(Object.keys(a.y)).toEqual(['1446', '1447'])
    const raw = st.getItem(ALBUM_KEY)
    snapshotAlbum(st, '2026-11-17')
    expect(st.getItem(ALBUM_KEY)).toBe(raw)
    const empty = store()
    snapshotAlbum(empty, '2026-11-17')
    expect(empty.getItem(ALBUM_KEY)).toBeNull()
  })
  it('gələcək il və "x" açarı hesablanmır', () => {
    const a = computeAlbum({ v: 1, y: {} }, src({ fasts: { 1448: { 1: 1 }, x: { 1: 1 } } }), '2026-11-17')
    expect(Object.keys(a.y)).toEqual([])
  })
  it('Ramazan ərzində: dua jurnalı və oxu yaddaşdan', () => {
    const life = applyRead(emptyLife(), [0, 1], '2026-02-01').st
    const st = store({ quran_life_v1: J(serializeLife(life)), dua_journal: J({ duas: [{ id: 'x', text: 't', date: '2026-02-19' }] }) })
    snapshotAlbum(st, '2026-02-19')
    const a = readAlbum(st)
    expect(a.y[1447]).toMatchObject({ du: 1, q0: 2, q1: 2, b: '2026-02-19' })
  })
  it('chapters: yenidən köhnəyə, əvvəlki fəsil; müqayisə', () => {
    const al = sanitizeAlbum({ y: { 1446: { s: '2025-03-01', e: '2025-03-29', f: 20, dh: 100 }, 1447: { s: '2026-02-18', e: '2026-03-19', f: 25, dh: 80, q0: 10, q1: 40, b: '2026-02-18' } } })
    const ch = chapters(al)
    expect(ch.map((x) => x.y)).toEqual([1447, 1446])
    expect(ch[0].prev.y).toBe(1446)
    const cmp = compareChapters(ch[0].c, ch[0].prev.c)
    expect(cmp.find((x) => x.m === 'f')).toEqual({ m: 'f', cur: 25, prev: 20, delta: 5 })
    expect(cmp.find((x) => x.m === 'dh').delta).toBe(-20)
    expect(cmp.find((x) => x.m === 'q')).toBeUndefined()   // 1446-da oxu ölçülməyib
  })
  it('sanitize: pozuq fəsil / il atılır', () => {
    expect(sanitizeAlbum({ y: { 1447: { s: 'x' }, abc: {}, 1446: { s: '2025-03-01', e: '2025-03-29', f: -2, q0: 5, q1: 3, b: '2025-03-02' } } }))
      .toEqual({ v: 1, y: { 1446: { s: '2025-03-01', e: '2025-03-29', q0: 5, q1: 5, b: '2025-03-02' } } })
  })
})

describe('iftar dəvəti sayğacı', () => {
  it('gün üzrə artır, pozuq dəyər atılır', () => {
    const st = store()
    logIftarInvite('2026-03-01', st)
    logIftarInvite('2026-03-01', st)
    logIftarInvite('bad', st)
    expect(readIftarLog(st)).toEqual({ '2026-03-01': 2 })
    expect(JSON.parse(st.getItem(IFTAR_LOG_KEY))).toEqual({ '2026-03-01': 2 })
    expect(sanitizeIftarLog({ '2026-01-01': 0, x: 3, '2026-01-02': '4' })).toEqual({ '2026-01-02': 4 })
  })
})
