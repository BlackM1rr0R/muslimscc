// Mənəvi səyahət kitabçası (utils/passport) — möhürlərin aşkarlanması və qazanılma günü
import { describe, it, expect } from 'vitest'
import { PASSPORT_KEY, STAMP_IDS, bestFajrStreak, passportStats, stampProgress, syncPassport, readPassport } from '../../src/utils/passport.js'
import { addDays } from '../../src/utils/prayerTracker.js'
import { isBackupKey } from '../../src/utils/userBackup.js'
import { SAHABA_SLUGS } from '../../src/seo/detailSlugs.js'
import { SAHABA, slugOf } from '../../src/data/sahaba.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]))
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }
}
const days = (start, n) => Array.from({ length: n }, (_, i) => addDays(start, i))
const fajrStats = (list) => Object.fromEntries(list.map(d => [`${d}_Fajr`, true]))
const byId = (stamps) => Object.fromEntries(stamps.map(s => [s.id, s]))

describe('Sübh seriyası', () => {
  const snap = (stats, status = {}) => ({ stats, tracker: {}, status })
  it('ardıcıl günlər; boşluq seriyanı qırır; qəza sayılmır', () => {
    const d = days('2026-01-01', 45)
    expect(bestFajrStreak(snap(fajrStats(d)), [], '2026-03-01')).toBe(45)
    const gap = d.filter(x => x !== '2026-01-20')
    expect(bestFajrStreak(snap(fajrStats(gap)), [], '2026-03-01')).toBe(25)
    expect(bestFajrStreak(snap(fajrStats(d), { '2026-01-10': { fajr: 'qada' } }), [], '2026-03-01')).toBe(35)
    expect(bestFajrStreak(snap({}), [], '2026-03-01')).toBe(0)
  })
  it('heyz günləri seriyanı qırmır (sayılmır da)', () => {
    const d = days('2026-01-01', 30).filter(x => x < '2026-01-10' || x > '2026-01-15')
    const periods = [{ id: 'p', type: 'hayd', start: '2026-01-10', end: '2026-01-15' }]
    expect(bestFajrStreak(snap(fajrStats(d)), periods, '2026-03-01')).toBe(24)
  })
  it('daily_tracker-dəki qeydlər də sayılır', () => {
    const tracker = Object.fromEntries(days('2026-02-01', 5).map(x => [x, { fajr: true }]))
    expect(bestFajrStreak({ stats: {}, tracker, status: {} }, [], '2026-02-05')).toBe(5)
  })
})

describe('göstəricilər', () => {
  it('boş yaddaş — heç bir möhür', () => {
    const { stamps, fresh } = syncPassport({ storage: mem(), today: '2026-11-17' })
    expect(stamps.map(s => s.id)).toEqual(STAMP_IDS)
    expect(stamps.every(s => !s.earned)).toBe(true)
    expect(fresh).toEqual([])
  })
  it('hər mənbə öz möhürünü verir', () => {
    const s = mem({
      quran_khatm_plan: { days: 30, start: '2026-10-01', done: 604, log: [] },
      muslim_cc_prayer_stats: fajrStats(days('2026-09-01', 40)),
      names99_practice_v1: { known: Array.from({ length: 99 }, (_, i) => i + 1), best: 90 },
      muslim_cc_hijra_walk: { days: { '2026-10-01': 200, '2026-10-02': 200, '2026-10-03': 100 } },
      muslim_cc_sahaba_album: Object.fromEntries(SAHABA_SLUGS.map(x => [x, '2026-10-01T00:00:00Z'])),
      hifz_progress: { 112: 2, 113: 1 },
      dhikr_count_total: '1000',
      kahf_fridays_v1: ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23'],
      world_khatm_v1: { v: 1, r: { 3: { p: [12], d: '2026-11-10' }, 4: { p: [1] } } },
    })
    const st = passportStats(s, { hijraKm: 450, arabicPassed: 9, arabicTotal: 9 }, '2026-11-17')
    expect(st).toMatchObject({ khatms: 1, fajr: 40, names: 99, hijraKm: 500, sahaba: SAHABA_SLUGS.length, hifz: 1, dhikr: 1000, kahf: 4, ummah: 1 })
    const { stamps, fresh } = syncPassport({ storage: s, refs: { hijraKm: 450, arabicPassed: 9, arabicTotal: 9 }, today: '2026-11-17' })
    expect(fresh).toEqual(STAMP_IDS)
    expect(stamps.every(x => x.earned && x.at === '2026-11-17')).toBe(true)
    expect(readPassport(s).khatm).toBe('2026-11-17')
  })
  it('yarımçıq irəliləyiş: dəyər və hədəf', () => {
    const s = mem({ names99_practice_v1: { known: [1, 2, 3] }, dhikr_count_total: '250', kahf_fridays_v1: ['2026-10-02', '2026-10-02'] })
    const p = byId(stampProgress(passportStats(s, {}, '2026-11-17')))
    expect(p.names_99).toMatchObject({ value: 3, goal: 99, ready: true })
    expect(p.dhikr_1000).toMatchObject({ value: 250, goal: 1000 })
    expect(p.kahf_4.value).toBe(1)
    // ölçü yüklənməyib (refs yoxdur) — möhür verilmir
    expect(p.hijra.ready).toBe(false)
    expect(p.arabic.ready).toBe(false)
  })
  it('mozaika xətmi və şəhadətnamə də "ilk xətm"dir', () => {
    expect(passportStats(mem({ quran_life_v1: { k: 2, ks: [] } }), {}, '2026-11-17').khatms).toBe(2)
    expect(passportStats(mem({ quran_khatm_certs_v1: [{ id: 'x' }] }), {}, '2026-11-17').khatms).toBe(1)
  })
})

describe('qazanılma günü', () => {
  it('bir dəfə yazılır, məlumat silinsə də qalır', () => {
    const s = mem({ hifz_progress: { 1: 2 } })
    syncPassport({ storage: s, today: '2026-11-10' })
    s.removeItem('hifz_progress')
    const { stamps, fresh } = syncPassport({ storage: s, today: '2026-11-17' })
    expect(fresh).toEqual([])
    expect(byId(stamps).hifz_surah).toMatchObject({ earned: true, at: '2026-11-10' })
  })
  it('üst-üstə düşən nişanın günü götürülür', () => {
    const s = mem({ dhikr_count_total: '5000' })
    const { stamps } = syncPassport({ storage: s, badges: { dhikr_1000: '2026-05-05', khatm: '2026-04-04' }, today: '2026-11-17' })
    const b = byId(stamps)
    expect(b.dhikr_1000.at).toBe('2026-05-05')
    // nişan qazanılıbsa (plan sonra sıfırlansa da) möhür verilir
    expect(b.khatm).toMatchObject({ earned: true, at: '2026-04-04' })
  })
  it('write=false — yaddaşa yazmır; açar ehtiyat nüsxəyə düşür', () => {
    const s = mem({ hifz_progress: { 1: 2 } })
    syncPassport({ storage: s, today: '2026-11-17', write: false })
    expect(s.m.has(PASSPORT_KEY)).toBe(false)
    expect(isBackupKey(PASSPORT_KEY)).toBe(true)
  })
  it('SAHABA_SLUGS saytın səhabə məlumatı ilə eynidir (albomun meyarı)', () => {
    expect(SAHABA_SLUGS).toEqual(SAHABA.map(slugOf))
  })
})
