// Sinxronizasiyada birləşmə: açara xas birləşdiricilər (utils/syncMergers), 3 tərəfli
// mergeData / planMerge / applyMerge (utils/syncMerge), mergeLife (utils/quranLife),
// mergeNotes (utils/quranNotes)
import { describe, it, expect } from 'vitest'
import { MERGERS, CONFLICT, mergeSet3, mergeMap3, mergeCounter, runMerger } from '../../src/utils/syncMergers.js'
import { mergeData, planMerge, applyMerge, writeMerged } from '../../src/utils/syncMerge.js'
import { mergeLife, emptyLife, applyRead, sanitizeLife, serializeLife, hasBit, countBits, TOTAL, LIFE_KEY } from '../../src/utils/quranLife.js'
import { mergeNotes, mergeNote, setNote, NOTES_KEY } from '../../src/utils/quranNotes.js'

const J = JSON.stringify
const store = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m,
  }
}
const lifeWith = (indices, day = '2026-11-01', prev = emptyLife()) => applyRead(prev, indices, day).st
const lifeStr = (st) => J(serializeLife(st))

describe('mergeLife', () => {
  it('e və c — OR; d — [ən erkən, ən gec]; r — ən erkən', () => {
    const a = lifeWith([0, 1, 2], '2026-11-02')
    const b = lifeWith([2, 3, 300], '2026-11-01')
    const m = mergeLife(a, b)
    for (const i of [0, 1, 2, 3, 300]) { expect(hasBit(m.e, i)).toBe(true); expect(hasBit(m.c, i)).toBe(true) }
    expect(countBits(m.e)).toBe(5)
    expect(m.d[1]).toEqual(['2026-11-01', '2026-11-02'])
    expect(m.r).toBe('2026-11-01')
    // kommutativ
    expect(lifeStr(mergeLife(b, a))).toBe(lifeStr(m))
    // xam (serializeLife) obyektlə də işləyir
    expect(lifeStr(mergeLife(serializeLife(a), serializeLife(b)))).toBe(lifeStr(m))
  })
  it('k fərqlidirsə — böyük k-lı tərəfin dövrü; ks birləşir, k = max', () => {
    const all = Array.from({ length: TOTAL }, (_, i) => i)
    const done = lifeWith(all, '2026-10-01')                 // xətm: k=1, c boş
    const a = lifeWith([5], '2026-10-05', done)               // yeni dövr: yalnız 5
    const b = lifeWith([7, 8], '2026-09-01')                  // k=0, köhnə dövr
    const m = mergeLife(a, b)
    expect(m.k).toBe(1)
    expect(m.ks).toEqual([{ s: '2026-10-01', e: '2026-10-01' }])
    expect(countBits(m.c)).toBe(1)
    expect(hasBit(m.c, 5)).toBe(true)
    expect(m.r).toBe('2026-10-05')
    expect(countBits(m.e)).toBe(TOTAL)
  })
  it('ks — (s, e) üzrə birləşmə, sıralı, ≤ 100', () => {
    const day = (i) => new Date(Date.UTC(2000, 0, 1 + i * 3)).toISOString().slice(0, 10)
    const mk = (n, off) => Array.from({ length: n }, (_, i) => ({ s: day(i + off), e: day(i + off) }))
    const a = sanitizeLife({ ks: mk(60, 0), k: 60 })
    const b = sanitizeLife({ ks: mk(60, 30), k: 60 })
    const m = mergeLife(a, b)
    expect(m.ks.length).toBe(90)
    expect(m.k).toBe(90)
    expect(m.ks[0].s < m.ks[1].s).toBe(true)
    const big = mergeLife(sanitizeLife({ ks: mk(70, 0), k: 70 }), sanitizeLife({ ks: mk(70, 70), k: 70 }))
    expect(big.ks.length).toBe(100)
    expect(big.ks[99].e).toBe(day(139))                         // ən yeniləri qalır
    expect(big.k).toBe(100)
  })
  it('iki cihaz birlikdə dövrü tamamlayırsa — xətm sayılır', () => {
    const half = Math.floor(TOTAL / 2)
    const a = lifeWith(Array.from({ length: half }, (_, i) => i), '2026-11-01')
    const b = lifeWith(Array.from({ length: TOTAL - half }, (_, i) => half + i), '2026-11-03')
    const m = mergeLife(a, b)
    expect(m.k).toBe(1)
    expect(countBits(m.c)).toBe(0)
    expect(m.ks).toEqual([{ s: '2026-11-01', e: '2026-11-03' }])
  })
})

describe('mergeNotes', () => {
  const n1 = setNote({}, '2:255', { c: 'gold', t: 'A' }, 1000)
  it('ayə üzrə birlik; eyni ayədə — yenisi, köhnənin mətni tarixçədə', () => {
    const local = setNote(n1, '2:255', { c: 'gold', t: 'Yerli' }, 3000)
    const remote = setNote(setNote(n1, '2:255', { c: 'green', t: 'Uzaq' }, 2000), '1:1', { t: 'Fatihə' }, 2500)
    const m = mergeNotes(local, remote, n1)
    expect(m['1:1'].t).toBe('Fatihə')
    expect(m['2:255'].t).toBe('Yerli')
    expect(m['2:255'].h.map((h) => h.t)).toEqual(['Uzaq', 'A'])
    expect(m['2:255'].d).toBe(1000)
  })
  it('bir tərəfdə silinib, digərində dəyişməyib → silinir; dəyişibsə → qalır', () => {
    const base = setNote(n1, '3:1', { t: 'B' }, 1500)
    const local = { ...base }; delete local['2:255']
    expect(Object.keys(mergeNotes(local, base, base))).toEqual(['3:1'])
    const remote = setNote(base, '2:255', { t: 'dəyişdi' }, 4000)
    expect(mergeNotes(local, remote, base)['2:255'].t).toBe('dəyişdi')
  })
  it('tarixçə limiti (≤ 3) saxlanılır', () => {
    let a = n1
    for (let i = 0; i < 5; i++) a = setNote(a, '2:255', { t: `a${i}` }, 2000 + i)
    let b = n1
    for (let i = 0; i < 5; i++) b = setNote(b, '2:255', { t: `b${i}` }, 3000 + i)
    const m = mergeNote(a['2:255'], b['2:255'])
    expect(m.t).toBe('b4')
    expect(m.h.length).toBeLessThanOrEqual(3)
    expect(m.h[0].t).toBe('b3')
  })
  it('birləşdirici (sətirlə) — boş nəticə açarı silir', () => {
    const base = J(n1)
    expect(MERGERS[NOTES_KEY](J({}), base, base)).toBeUndefined()
  })
})

describe('kiçik köməkçilər', () => {
  it('mergeSet3: əlavələr hər iki tərəfdən, silinmələr hər iki tərəfdən', () => {
    expect(mergeSet3([1, 2, 4], [1, 3, 5], [1, 2, 3])).toEqual([1, 4, 5])
    expect(mergeSet3([1, 2], [2, 3])).toEqual([1, 2, 3])            // baza yoxdur → birlik
  })
  it('mergeMap3: silinmə və dəyişmə', () => {
    expect(mergeMap3({ a: 1, b: 2 }, { a: 1, c: 3 }, { a: 1, b: 2, c: 3 }, () => CONFLICT)).toEqual({ a: 1 })
    expect(mergeMap3({ a: 2 }, { a: 3 }, { a: 1 }, () => CONFLICT)).toBe(CONFLICT)
    expect(mergeMap3({ a: 2 }, {}, { a: 1 }, () => CONFLICT)).toEqual({ a: 2 })   // silinib vs dəyişib → dəyişən
  })
  it('mergeCounter: bazadan artımlar toplanır; baza yoxdursa max', () => {
    expect(mergeCounter('120', '150', '100')).toBe(170)
    expect(mergeCounter('120', '150')).toBe(150)
    expect(mergeCounter('50', '150', '100')).toBe(150)
  })
})

describe('açar birləşdiriciləri', () => {
  it('dhikr_count_total / dhikr_daily_v1', () => {
    expect(MERGERS.dhikr_count_total('120', '150', '100')).toBe('170')
    expect(JSON.parse(MERGERS.dhikr_daily_v1(J({ '2026-11-01': 5, '2026-11-02': 3 }), J({ '2026-11-01': 7 }), J({ '2026-11-01': 4 }))))
      .toEqual({ '2026-11-01': 8, '2026-11-02': 3 })
  })
  it('quran_saved_ayahs — 3 tərəfli, ən yeni əvvəldə', () => {
    const x = (s, a, t) => ({ s, a, t })
    const base = J([x(1, 1, 1)])
    const local = J([x(2, 255, 5), x(1, 1, 1)])
    const remote = J([x(36, 1, 9)])                                 // 1:1 silinib, 36:1 əlavə
    expect(JSON.parse(MERGERS.quran_saved_ayahs(local, remote, base))).toEqual([x(36, 1, 9), x(2, 255, 5)])
  })
  it('hadith_favs / dua_favs — əlavə və silinmə', () => {
    expect(JSON.parse(MERGERS.hadith_favs('[1,2,4]', '[1,3]', '[1,2,3]'))).toEqual([1, 4])
    expect(JSON.parse(MERGERS.dua_favs('[5]', '[6]'))).toEqual([5, 6])
  })
  it('passport / nişanlar — birlik, ən erkən gün', () => {
    expect(JSON.parse(MERGERS.muslim_cc_passport_v1(J({ khatm: '2026-05-02', hijra: '2026-01-01' }), J({ khatm: '2026-04-01', kahf_4: '2026-03-03' }))))
      .toEqual({ khatm: '2026-04-01', hijra: '2026-01-01', kahf_4: '2026-03-03' })
    expect(JSON.parse(MERGERS.qm_badges_v1(J({ a: '2026-01-02' }), J({ a: '2026-01-01' })))).toEqual({ a: '2026-01-01' })
  })
  it('quran_khatm_certs_v1 — id üzrə 3 tərəfli', () => {
    const c = (id, end) => ({ id, src: 'life', start: '2026-01-01', end, name: '', ded: '', made: end })
    const base = J([c('a', '2026-02-01')])
    const out = JSON.parse(MERGERS.quran_khatm_certs_v1(J([c('a', '2026-02-01'), c('b', '2026-03-01')]), J([c('z', '2026-01-15')]), base))
    expect(out.map((x) => x.id)).toEqual(['z', 'b'])
  })
  it('namaz xəritələri — gün/sahə üzrə; eyni sahə fərqli → ziddiyyət', () => {
    const base = J({ '2026-11-01': { fajr: true } })
    const local = J({ '2026-11-01': { fajr: true, dhuhr: true }, '2026-11-02': { asr: true } })
    const remote = J({ '2026-11-01': { fajr: true, quran: true } })
    expect(JSON.parse(MERGERS.daily_tracker(local, remote, base))).toEqual({ '2026-11-01': { fajr: true, dhuhr: true, quran: true }, '2026-11-02': { asr: true } })
    expect(MERGERS.muslim_cc_prayer_status(J({ d: { fajr: 'qada' } }), J({ d: { fajr: 'missed' } }), J({}))).toBe(CONFLICT)
    expect(JSON.parse(MERGERS.muslim_cc_prayer_stats(J({ '2026-11-01_Fajr': true }), J({ '2026-11-01_Asr': true }), J({})))).toEqual({ '2026-11-01_Fajr': true, '2026-11-01_Asr': true })
  })
  it('pozuq JSON → ziddiyyət; birləşdiricisiz açar → ziddiyyət', () => {
    expect(runMerger('hadith_favs', '{oops', '[1]')).toBe(CONFLICT)
    expect(runMerger('hifz_progress', '{}', '{"1":2}')).toBe(CONFLICT)
  })
})

describe('mergeData (3 tərəfli)', () => {
  const base = { hifz_progress: '{"1":2}', dua_favs: '[1]', quran_bookmark: 'b0', muslim_cc_lang: 'az' }
  it('yalnız yerli dəyişiklik → yerli; yalnız uzaq dəyişiklik → uzaq', () => {
    const r = mergeData({ ...base, hifz_progress: '{"1":2,"2":1}' }, { ...base, quran_bookmark: 'b1' }, base)
    expect(r.conflicts).toEqual([])
    expect(r.data).toEqual({ ...base, hifz_progress: '{"1":2,"2":1}', quran_bookmark: 'b1' })
  })
  it('hər iki tərəf dəyişib, birləşdirici var → birləşir', () => {
    const r = mergeData({ ...base, dua_favs: '[1,2]' }, { ...base, dua_favs: '[1,3]' }, base)
    expect(r.merged).toEqual(['dua_favs'])
    expect(JSON.parse(r.data.dua_favs)).toEqual([1, 2, 3])
  })
  it('hər iki tərəf eyni dəyəri yazıb → ziddiyyət deyil', () => {
    const r = mergeData({ ...base, quran_bookmark: 'x' }, { ...base, quran_bookmark: 'x' }, base)
    expect(r.conflicts).toEqual([])
  })
  it('hər iki tərəf dəyişib, birləşdirici yoxdur → ziddiyyət (yerli dəyər saxlanılır)', () => {
    const r = mergeData({ ...base, quran_bookmark: 'L' }, { ...base, quran_bookmark: 'R' }, base)
    expect(r.conflicts).toEqual(['quran_bookmark'])
    expect(r.data.quran_bookmark).toBe('L')
  })
  it('silinmələr: yerli silinib + uzaq dəyişməyib → silinir; uzaq silinib + yerli dəyişməyib → silinir; silinib vs dəyişib → dəyişən', () => {
    const l1 = { ...base }; delete l1.quran_bookmark
    expect('quran_bookmark' in mergeData(l1, base, base).data).toBe(false)
    const r1 = { ...base }; delete r1.dua_favs
    expect('dua_favs' in mergeData(base, r1, base).data).toBe(false)
    expect(mergeData(l1, { ...base, quran_bookmark: 'new' }, base).data.quran_bookmark).toBe('new')
  })
  it('yeni açar bir tərəfdə → saxlanılır; cihaz tərcihi (dil) — ziddiyyət deyil', () => {
    const r = mergeData({ ...base, muslim_cc_lang: 'en', a_new: '1' }, { ...base, muslim_cc_lang: 'ru', b_new: '2' }, base)
    expect(r.conflicts).toEqual([])
    expect(r.data).toMatchObject({ muslim_cc_lang: 'en', a_new: '1', b_new: '2' })
  })
  it('cihaz açarlarına toxunulmur', () => {
    const r = mergeData({ muslim_cc_sync: 'x' }, { muslim_cc_sync: 'y' }, {})
    expect(r.data).toEqual({})
  })
  it('quran_life_v1 — hər iki cihazda oxunan ayələr birləşir', () => {
    const b0 = lifeStr(emptyLife())
    const l = lifeStr(lifeWith([1, 2, 3]))
    const r = lifeStr(lifeWith([500, 501]))
    const out = mergeData({ [LIFE_KEY]: l }, { [LIFE_KEY]: r }, { [LIFE_KEY]: b0 })
    expect(out.conflicts).toEqual([])
    const st = sanitizeLife(JSON.parse(out.data[LIFE_KEY]))
    expect(countBits(st.e)).toBe(5)
  })
})

describe('planMerge / applyMerge (yeni cihaz, baza yoxdur)', () => {
  it('birləşdiricisi olan açarlar ziddiyyət sayılmır və birləşir; qalanlar — seçim', () => {
    const local = { dua_favs: '[5]', hifz_progress: '{"1":2,"2":2}', [LIFE_KEY]: lifeStr(lifeWith([1])), only_local: 'L', muslim_cc_lang: 'en' }
    const remote = { dua_favs: '[6]', hifz_progress: '{"1":2}', [LIFE_KEY]: lifeStr(lifeWith([9])), only_remote: 'R', muslim_cc_lang: 'az' }
    const p = planMerge(local, remote)
    expect(p.conflicts).toEqual(['hifz_progress'])
    expect(p.merged.sort()).toEqual(['dua_favs', LIFE_KEY].sort())
    expect(p.localOnly).toEqual(['only_local'])
    expect(p.remoteOnly).toEqual(['only_remote'])

    const st = store(local)
    const res = applyMerge({ data: remote, count: 5 }, 'remote', st)
    expect(st.getItem('hifz_progress')).toBe('{"1":2}')                    // ziddiyyət → hesabdakı
    expect(JSON.parse(st.getItem('dua_favs'))).toEqual([5, 6])              // birləşdi
    expect(countBits(sanitizeLife(JSON.parse(st.getItem(LIFE_KEY))).e)).toBe(2)
    expect(st.getItem('only_local')).toBe('L')
    expect(st.getItem('only_remote')).toBe('R')
    expect(st.getItem('muslim_cc_lang')).toBe('az')                         // tərcih — hesabdakı
    expect(res.needsPush).toBe(true)

    const st2 = store(local)
    applyMerge({ data: remote, count: 5 }, 'local', st2)
    expect(st2.getItem('hifz_progress')).toBe('{"1":2,"2":2}')
  })
  it('fərq yoxdursa — göndərmə lazım deyil', () => {
    const st = store({ a: '1' })
    expect(applyMerge({ data: { a: '1', b: '2' }, count: 2 }, 'remote', st).needsPush).toBe(false)
  })
  it('writeMerged — yalnız fərqli açarlar yazılır/silinir', () => {
    const st = store({ a: '1', b: '2', muslim_cc_sync: 'keep' })
    const changed = writeMerged({ a: '1', c: '3' }, { a: '1', b: '2' }, st)
    expect(changed.sort()).toEqual(['b', 'c'])
    expect(st.getItem('b')).toBeNull()
    expect(st.getItem('c')).toBe('3')
    expect(st.getItem('muslim_cc_sync')).toBe('keep')
  })
})
