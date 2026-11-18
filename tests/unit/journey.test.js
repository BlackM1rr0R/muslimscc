// J3/J5/J6/J7/J8 + J4: ildönümü / ad günü tetikləyiciləri (29 fevral daxil), illik xülasə,
// zaman xətti, yol mərhələləri, kunya, öz mərhələlər, təravih, Ramazan "Wrapped", birləşdiricilər
import { describe, it, expect } from 'vitest'
import {
  anniversaryOf, birthdayToday, observedDay, sanitizeBirthday, rangeSummary, yearSummary, gatherJourney,
  buildTimeline, journeyLevel, levelFromCounts, LEVEL_THRESHOLDS, sanitizeKunya, kunyaText, addMilestone,
  readMilestones, removeMilestone, sanitizeMilestone, readCelebrate, markCelebrated, writeBirthday, readBirthday,
  NOTE_MAX, MILESTONES_KEY, KUNYA_KEY, BIRTHDAY_KEY, CELEBRATE_KEY, gatherLevel,
} from '../../src/utils/journey.js'
import { setNight, readTaraweeh, yearStats, nightsInRange, normRakat, TARAWEEH_KEY } from '../../src/utils/taraweeh.js'
import { wrappedCards } from '../../src/utils/ramadanWrapped.js'
import { recordHifzDates, readHifzDates, HIFZ_DATES_KEY } from '../../src/utils/hifzDates.js'
import { emptyLife, applyRead, serializeLife } from '../../src/utils/quranLife.js'
import { MERGERS, runMerger } from '../../src/utils/syncMergers.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { MADHAB_KEY } from '../../src/utils/madhab.js'

const J = JSON.stringify
const store = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m,
  }
}
const localMs = (y, m, d, h = 10) => new Date(y, m - 1, d, h).getTime()

describe('ildönümü', () => {
  it('yaradılma günü + N il → { years }; başqa gün və ya 0 il → null', () => {
    const c = localMs(2025, 11, 18)
    expect(anniversaryOf(c, '2026-11-18')).toEqual({ years: 1, created: '2025-11-18', since: '2025-11-18' })
    expect(anniversaryOf(c, '2028-11-18').years).toBe(3)
    expect(anniversaryOf(c, '2026-11-17')).toBeNull()
    expect(anniversaryOf(c, '2025-11-18')).toBeNull()
    expect(anniversaryOf(null, '2026-11-18')).toBeNull()
    expect(anniversaryOf('abc', '2026-11-18')).toBeNull()
  })
  it('29 fevralda yaranan hesab: uzun olmayan ildə 28 fevral, uzun ildə 29 fevral', () => {
    const c = localMs(2024, 2, 29)
    expect(anniversaryOf(c, '2025-02-28')?.years).toBe(1)
    expect(anniversaryOf(c, '2025-03-01')).toBeNull()
    expect(anniversaryOf(c, '2028-02-29')?.years).toBe(4)
    expect(anniversaryOf(c, '2028-02-28')).toBeNull()
    expect(observedDay(2027, 2, 29)).toBe('2027-02-28')
    expect(observedDay(2028, 2, 29)).toBe('2028-02-29')
  })
})

describe('ad günü', () => {
  it('ay/gün (il istəyə bağlı); 29 fevral → 28 fevral; yanlış tarix atılır', () => {
    expect(birthdayToday({ m: 11, d: 18 }, '2026-11-18')).toEqual({ since: '2025-11-18', age: null })
    expect(birthdayToday({ m: 11, d: 18, y: 1990 }, '2026-11-18').age).toBe(36)
    expect(birthdayToday({ m: 11, d: 19 }, '2026-11-18')).toBeNull()
    expect(birthdayToday({ m: 2, d: 29 }, '2027-02-28')).not.toBeNull()
    expect(birthdayToday({ m: 2, d: 29 }, '2028-02-28')).toBeNull()
    expect(birthdayToday({ m: 2, d: 29 }, '2028-02-29')).not.toBeNull()
    expect(sanitizeBirthday({ m: 2, d: 30 })).toBeNull()
    expect(sanitizeBirthday({ m: 13, d: 1 })).toBeNull()
    expect(sanitizeBirthday({ m: 2, d: 29, y: 2023 }).y).toBeUndefined()   // 2023 uzun il deyil
    // gələcək doğum ili — kart yoxdur
    expect(birthdayToday({ m: 11, d: 18, y: 2030 }, '2026-11-18')).toBeNull()
  })
  it('yazılır, oxunur, silinir', () => {
    const s = store()
    writeBirthday({ m: 5, d: 7 }, s, 1000)
    expect(readBirthday(s)).toEqual({ m: 5, d: 7, t: 1000 })
    writeBirthday(null, s)
    expect(s.getItem(BIRTHDAY_KEY)).toBeNull()
  })
})

describe('illik xülasə', () => {
  const life = applyRead(emptyLife(), [0, 1, 2, 3, 4, 5, 6], '2026-03-01').st
  life.ks = [{ s: '2026-01-01', e: '2026-03-10' }]
  const s = store({
    quran_life_v1: J(serializeLife(life)),
    muslim_cc_passport_v1: J({ khatm: '2026-03-10', dhikr_1000: '2024-01-01' }),
    dhikr_daily_v1: J({ '2026-10-01': 33, '2026-10-02': 100 }),
    muslim_cc_ramadan_fasts_v1: J({ 1447: { 1: 1, 2: 1, 3: 2 } }),   // 1447: 18.02.2026-dan
    muslim_cc_sunnah_fasts_v1: J({ days: ['2026-06-01', '2020-01-01'] }),
    dua_journal: J({ duas: [{ id: 'a', date: '2026-05-05' }, { id: 'b', date: '2024-05-05' }] }),
    mosque_visits_v1: J({ v: 1, l: [{ i: 'n1', n: 'Təzəpir', la: 40.37, lo: 49.83, d: '2026-04-01' }] }),
    world_khatm_v1: J({ v: 1, r: { 3: { p: [5], d: '2026-07-07' } } }),
    muslim_cc_taraweeh_v1: J({ 1447: { 1: 8, 2: 0 } }),
    ramadan_album_v1: J({ v: 1, y: { 1447: { s: '2026-02-18', e: '2026-03-19', f: 2 } } }),
  })
  const src = gatherJourney(s)
  it('yalnız aralıqdakı və sıfırdan böyük göstəricilər', () => {
    const items = Object.fromEntries(yearSummary(src, '2025-11-18', '2026-11-18').map((x) => [x.k, x.v]))
    expect(items).toEqual({ khatm: 1, surahs: 1, stamps: 1, fasts: 3, taraweeh: 2, ramadan: 1, dhikr: 133, duas: 1, mosques: 1, ummah: 1, ayahsLife: 7 })
  })
  it('ölçülməyən göstərici yoxdur (boş yaddaş → boş siyahı)', () => {
    expect(rangeSummary(gatherJourney(store()), '2025-01-01', '2026-01-01')).toEqual([])
  })
  it('aralıq since günündən sonra başlayır (since daxil deyil)', () => {
    const items = Object.fromEntries(yearSummary(src, '2026-10-01', '2026-11-18').map((x) => [x.k, x.v]))
    expect(items.dhikr).toBe(100)
  })
})

describe('zaman xətti', () => {
  it('tarixli hadisələr köhnədən yeniyə; ilk xətm, Ramazan fəsli, əzbər, möhür, Ümmət xətmi, məscid, dua, öz mərhələ', () => {
    const s = store({
      quran_khatm_certs_v1: J([{ id: 'c1', src: 'life', start: '2025-01-01', end: '2025-06-01', name: 'A' }]),
      quran_life_v1: J(serializeLife({ ...emptyLife(), ks: [{ s: '2025-01-01', e: '2025-06-01' }, { s: '2025-06-02', e: '2026-01-05' }], k: 2 })),
      ramadan_album_v1: J({ v: 1, y: { 1446: { s: '2025-03-01', e: '2025-03-29', f: 5 } } }),
      hifz_progress: J({ 112: 2, 2: 1 }),
      hifz_dates_v1: J({ 112: '2025-09-09', 2: '2025-09-10' }),
      muslim_cc_passport_v1: J({ khatm: '2025-06-01' }),
      world_khatm_v1: J({ v: 1, r: { 4: { p: [1], d: '2025-12-12' } } }),
      mosque_visits_v1: J({ v: 1, l: [{ i: 'n2', n: 'B', la: 1, lo: 1, d: '2025-08-08' }, { i: 'n1', n: 'A', la: 2, lo: 2, d: '2025-07-07' }] }),
      dua_journal: J({ duas: [{ id: 'x', date: '2025-05-05' }] }),
    })
    addMilestone({ d: '2024-06-01', k: 'hajj', no: 'Ailəmlə' }, s, 5)
    const tl = buildTimeline(gatherJourney(s), { createdAt: localMs(2024, 1, 1), milestones: readMilestones(s) })
    expect(tl.map((e) => `${e.d}:${e.k}`)).toEqual([
      '2024-01-01:account', '2024-06-01:milestone', '2025-03-01:ramadan', '2025-05-05:dua', '2025-06-01:khatm', '2025-06-01:stamp',
      '2025-07-07:mosque', '2025-09-09:hifz', '2025-12-12:ummah', '2026-01-05:khatm',
    ])
    expect(tl.filter((e) => e.k === 'khatm').map((e) => e.n)).toEqual([1, 2])   // şəhadətnamə + mozaika — eyni xətm bir dəfə
    expect(tl.find((e) => e.k === 'mosque').n).toBe('A')
    expect(tl.find((e) => e.k === 'hifz').s).toBe(112)   // yalnız "əzbər" (2)
  })
  it('hifz günləri: tarixi olmayan əzbər surəyə bu gün yazılır, olan dəyişmir', () => {
    const s = store({ [HIFZ_DATES_KEY]: J({ 1: '2025-01-01' }) })
    recordHifzDates({ 1: 2, 114: 2, 3: 1 }, { storage: s, today: '2026-11-18' })
    expect(readHifzDates(s)).toEqual({ 1: '2025-01-01', 114: '2026-11-18' })
  })
})

describe('öz mərhələlər', () => {
  it('əlavə, ≤200 qeyd, "başqa" üçün ad mütləqdir, silinmə', () => {
    const s = store()
    expect(addMilestone({ d: '2025-01-01', k: 'other' }, s).ok).toBe(false)
    const r = addMilestone({ d: '2025-01-01', k: 'other', ti: 'İlk itikaf', no: 'x'.repeat(500) }, s, 10)
    expect(r.ok).toBe(true)
    expect(r.item.no.length).toBe(NOTE_MAX)
    expect(readMilestones(s).l).toHaveLength(1)
    expect(sanitizeMilestone({ id: 'abcd', d: '2025-13-01', k: 'hajj' })).toBeNull()
    removeMilestone(r.item.id, s)
    expect(s.getItem(MILESTONES_KEY)).toBeNull()
  })
})

describe('yol mərhələsi', () => {
  it('hədlər: 0 · 10 · 30 · 70 · 150', () => {
    expect(LEVEL_THRESHOLDS).toEqual([0, 10, 30, 70, 150])
    expect(levelFromCounts({}).stage).toBe(0)
    expect(levelFromCounts({ khatms: 1 })).toMatchObject({ points: 10, stage: 1, next: 30 })
    expect(levelFromCounts({ stamps: 3 }).stage).toBe(0)        // 9 xal
    expect(levelFromCounts({ stamps: 3, ayahs: 10 }).stage).toBe(1)
    expect(levelFromCounts({ khatms: 3 }).stage).toBe(2)
    expect(levelFromCounts({ khatms: 7 }).stage).toBe(3)
    expect(levelFromCounts({ khatms: 15 })).toMatchObject({ stage: 4, next: null })
  })
  it('yaddaşdan: xətm (eyni xətm bir dəfə) + möhür + Ümmət dövrü + əzbər ayələr', () => {
    const s = store({
      quran_life_v1: J({ v: 1, k: 1, ks: [{ s: '2025-01-01', e: '2025-06-01' }] }),
      quran_khatm_certs_v1: J([{ id: 'c', src: 'life', start: '2025-01-01', end: '2025-06-01' }]),
      muslim_cc_passport_v1: J({ khatm: '2025-06-01', hifz_surah: '2025-07-01' }),
      world_khatm_v1: J({ v: 1, r: { 1: { p: [1], d: '2025-08-01' }, 2: { p: [2] } } }),
      hifz_progress: J({ 1: 2, 112: 2 }),   // 7 + 4 = 11 ayə
    })
    const lv = journeyLevel(gatherLevel(s))
    expect(lv.parts).toEqual({ khatms: 1, stamps: 2, ummah: 1, ayahs: 11 })
    expect(lv.points).toBe(10 + 6 + 2 + 1)
    expect(lv.stage).toBe(1)
  })
})

describe('kunya', () => {
  it('Əbu / Ümmü + ad; boş ad və ya başqa ön söz atılır', () => {
    expect(kunyaText({ p: 'abu', n: 'Əli' }, 'az')).toBe('Əbu Əli')
    expect(kunyaText({ p: 'umm', n: 'Maryam' }, 'en')).toBe('Umm Maryam')
    expect(kunyaText({ p: 'umm', n: 'مريم' }, 'ar')).toBe('أم مريم')
    expect(sanitizeKunya({ p: 'bin', n: 'X' })).toBeNull()
    expect(sanitizeKunya({ p: 'abu', n: '   ' })).toBeNull()
    expect(sanitizeKunya({ p: 'abu', n: 'a'.repeat(80) }).n).toHaveLength(24)
  })
})

describe('ildönümü / ad günü bir dəfə', () => {
  it('il üzrə qeyd', () => {
    const s = store()
    markCelebrated('a', 2026, s)
    markCelebrated('a', 2025, s)
    expect(readCelebrate(s)).toEqual({ a: 2026 })
  })
})

describe('təravih', () => {
  it('gecə qeydi: 0 (say yoxdur), 8, 20, başqa (2…40); silinmə', () => {
    const s = store()
    let st = setNight({}, 1447, 1, 8, s)
    st = setNight(st, 1447, 2, 0, s)
    st = setNight(st, 1447, 3, 20, s)
    expect(readTaraweeh(s)).toEqual({ 1447: { 1: 8, 2: 0, 3: 20 } })
    expect(yearStats(st, 1447)).toEqual({ nights: 3, rakats: 28, counted: 2 })
    st = setNight(st, 1447, 3, null, s)
    expect(yearStats(st, 1447).nights).toBe(2)
    expect(normRakat(41)).toBeNull()
    expect(normRakat(1)).toBeNull()
    expect(normRakat(12)).toBe(12)
    setNight(st, 1447, 1, null, s); setNight(readTaraweeh(s), 1447, 2, null, s)
    expect(s.getItem(TARAWEEH_KEY)).toBeNull()
  })
  it('1-ci gecə Ramazandan əvvəlki axşamdır', () => {
    // 1447: 18.02.2026 başlayır → 1-ci gecə 17.02
    expect(nightsInRange({ 1447: { 1: 0 } }, '2026-02-17', '2026-02-17')).toBe(1)
    expect(nightsInRange({ 1447: { 1: 0 } }, '2026-02-18', '2026-03-30')).toBe(0)
  })
})

describe('Ramazan Wrapped', () => {
  it('yalnız ölçülən kartlar; "ən çox oxunan surə" yoxdur', () => {
    const ch = { s: '2026-02-18', e: '2026-03-19', f: 20, x: 1, k: 1, su: 5, dh: 330, du: 2, da: 1, q0: 100, q1: 400, b: '2026-02-20' }
    const cards = wrappedCards(ch, { y: 1447, taraweeh: { 1447: { 1: 8, 2: 8, 3: 0 } }, khatm: { r: { 1: { p: [1], d: '2026-03-01' }, 2: { p: [], d: '2026-05-01' } } } })
    expect(cards.map((c) => c.k)).toEqual(['f', 'k', 'tw', 'q', 'su', 'dh', 'du', 'um'])
    expect(cards.find((c) => c.k === 'f').sub).toEqual({ x: 1 })
    expect(cards.find((c) => c.k === 'tw')).toEqual({ k: 'tw', v: 3, sub: { rakats: 16, counted: 2 } })
    expect(cards.find((c) => c.k === 'q').v).toBe(300)
    expect(cards.find((c) => c.k === 'um').v).toBe(1)
    expect(cards.some((c) => c.k === 'surah')).toBe(false)
  })
  it('ölçülməyən ayələr (q0 yoxdur) və sıfırlar — kart yoxdur', () => {
    expect(wrappedCards({ s: '2026-02-18', e: '2026-03-19', f: 3 }, { y: 1447 }).map((c) => c.k)).toEqual(['f'])
    expect(wrappedCards(null)).toEqual([])
  })
})

describe('J açarları: profil, birləşdiricilər', () => {
  it('şəxsi açarlar profilə aiddir; məzhəb, kunya, qari — hesab səviyyəsində', () => {
    for (const k of [TARAWEEH_KEY, HIFZ_DATES_KEY, MILESTONES_KEY, BIRTHDAY_KEY]) expect(PROFILE_KEYS).toContain(k)
    for (const k of [MADHAB_KEY, KUNYA_KEY, 'quran_audio', CELEBRATE_KEY]) expect(PROFILE_KEYS).not.toContain(k)
    for (const k of [MADHAB_KEY, KUNYA_KEY, BIRTHDAY_KEY, TARAWEEH_KEY, HIFZ_DATES_KEY, MILESTONES_KEY, CELEBRATE_KEY, 'quran_audio']) expect(MERGERS[k]).toBeTypeOf('function')
  })
  it('məzhəb / qari: hər iki tərəf dəyişibsə bu cihazınkı', () => {
    expect(runMerger(MADHAB_KEY, 'hanafi', 'shafii', 'maliki')).toBe('hanafi')
    expect(runMerger(MADHAB_KEY, 'bad', 'shafii', '')).toBe('shafii')
    expect(runMerger('quran_audio', J({ reciter: 'sudais' }), J({ reciter: 'husary' }))).toBe(J({ reciter: 'sudais' }))
  })
  it('kunya / ad günü: sonra dəyişdirilən (t)', () => {
    const a = J({ p: 'abu', n: 'Əli', t: 5 }), b = J({ p: 'umm', n: 'Aişə', t: 9 })
    expect(JSON.parse(runMerger(KUNYA_KEY, a, b))).toMatchObject({ p: 'umm', n: 'Aişə' })
    expect(JSON.parse(runMerger(BIRTHDAY_KEY, J({ m: 1, d: 2, t: 9 }), J({ m: 3, d: 4, t: 1 })))).toMatchObject({ m: 1, d: 2 })
  })
  it('təravih: gecə üzrə birlik, eyni gecə — böyük say; bazada olub bir tərəfdə silinən — silinir', () => {
    const base = J({ 1447: { 1: 0, 2: 8 } })
    const l = J({ 1447: { 1: 0, 2: 8, 3: 8 } })
    const r = J({ 1447: { 1: 20, 3: 20 } })
    expect(JSON.parse(runMerger(TARAWEEH_KEY, l, r, base))).toEqual({ 1447: { 1: 20, 3: 20 } })
  })
  it('öz mərhələlər: id üzrə 3 tərəfli, eyni id — təzəsi', () => {
    const m = (id, ti, u) => ({ id, d: '2025-01-01', k: 'other', ti, u })
    const base = J({ v: 1, l: [m('aaaa', 'A', 1), m('bbbb', 'B', 1)] })
    const l = J({ v: 1, l: [m('aaaa', 'A2', 5), m('bbbb', 'B', 1), m('cccc', 'C', 3)] })
    const r = J({ v: 1, l: [m('aaaa', 'A3', 9)] })   // bbbb silinib
    const out = JSON.parse(runMerger(MILESTONES_KEY, l, r, base)).l
    expect(out.map((x) => `${x.id}:${x.ti}`).sort()).toEqual(['aaaa:A3', 'cccc:C'])
  })
  it('hifz günləri — ən erkən; "göstərildi" — ən böyük il', () => {
    expect(JSON.parse(runMerger(HIFZ_DATES_KEY, J({ 1: '2025-02-02' }), J({ 1: '2025-01-01', 2: '2025-03-03' })))).toEqual({ 1: '2025-01-01', 2: '2025-03-03' })
    expect(JSON.parse(runMerger(CELEBRATE_KEY, J({ a: 2026 }), J({ a: 2025, b: 2026 })))).toEqual({ a: 2026, b: 2026 })
  })
})
