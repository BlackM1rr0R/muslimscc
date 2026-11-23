// Müsəlman səyyahın dəsti: saf hesab (utils/travelKit) + "Səfərlərim" yaddaşı (utils/travelTrips),
// profil açarı və sinxronizasiya birləşdiricisi.
import { describe, it, expect } from 'vitest'
import { destTimes, qiblaFor, tzDiffMin, zonedYMD, ymdKey, parseYmd, historyNear, methodKeyOf, haversineKm } from '../../src/utils/travelKit.js'
import { sanitizeTrips, readTrips, saveTrip, removeTrip, mergeTrips, tripPlace, TRIPS_KEY, TRIPS_MAX } from '../../src/utils/travelTrips.js'
import { computeTimes, CALC_METHODS, tzOffsetHours } from '../../src/utils/prayCalc.js'
import { IBN_BATTUTA_STOPS } from '../../src/data/ibnBattuta.js'
import { PROPHET_PLACES } from '../../src/data/prophetPlaces.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { MERGERS, CONFLICT } from '../../src/utils/syncMergers.js'
import { isBackupKey } from '../../src/utils/userBackup.js'

const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}
const ISTANBUL = { lat: 41.0082, lng: 28.9784, tz: 'Europe/Istanbul', label: 'Istanbul', country: 'TR' }
const BAKU = { lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku', label: 'Baku', country: 'AZ' }
const LONDON = { lat: 51.5074, lng: -0.1278, tz: 'Europe/London', label: 'London', country: 'GB' }

describe('travelKit — hesab', () => {
  it('metod: Azərbaycan — Əbu Bəkr, qalanları — Diyanət', () => {
    expect(methodKeyOf('AZ')).toBe('abubakr')
    expect(methodKeyOf('tr')).toBe('diyanet')
    expect(methodKeyOf('')).toBe('diyanet')
  })
  it('namaz vaxtları saytın hesabı ilə eynidir (Diyanət; Hənəfi əsr əmsalı 2)', () => {
    const date = { year: 2026, month: 6, day: 15 }
    const r = destTimes(ISTANBUL, date, 1)
    const tz = tzOffsetHours('Europe/Istanbul', 2026, 6, 15)
    expect(r.key).toBe('diyanet')
    expect(r.times).toEqual(computeTimes(date, ISTANBUL.lat, ISTANBUL.lng, tz, CALC_METHODS.diyanet))
    const h = destTimes(ISTANBUL, date, 2)
    expect(h.times.asr > r.times.asr).toBe(true)
    expect(h.times.dhuhr).toBe(r.times.dhuhr)
    expect(destTimes(BAKU, date, 1).key).toBe('abubakr')
  })
  it('qiblə: İstanbuldan cənub-şərq, Londondan ~119°', () => {
    const q = qiblaFor(ISTANBUL)
    expect(q.deg).toBeGreaterThan(145)
    expect(q.deg).toBeLessThan(155)
    expect(q.point).toBe(3)            // cənub-şərq
    expect(Math.round(qiblaFor(LONDON).deg)).toBe(119)
    expect(q.km).toBeGreaterThan(2300)
    expect(q.km).toBeLessThan(2500)
  })
  it('saat fərqi: Bakı → İstanbul −60 dəq, London (yay) −180 dəq, eyni qurşaq 0', () => {
    const summer = Date.UTC(2026, 6, 1, 12)
    expect(tzDiffMin('Asia/Baku', 'Europe/Istanbul', summer)).toBe(-60)
    expect(tzDiffMin('Asia/Baku', 'Europe/London', summer)).toBe(-180)
    expect(tzDiffMin('Europe/London', 'Asia/Kolkata', summer)).toBe(270)
    expect(tzDiffMin('Asia/Baku', 'Asia/Baku', summer)).toBe(0)
  })
  it('zonedYMD — təyinatın təqvim günü; parseYmd yanlış günü rədd edir', () => {
    const ms = Date.UTC(2026, 0, 1, 22, 30)   // Bakıda artıq 2 yanvar
    expect(ymdKey(zonedYMD(ms, 'Asia/Baku'))).toBe('2026-01-02')
    expect(ymdKey(zonedYMD(ms, 'Europe/London'))).toBe('2026-01-01')
    expect(parseYmd('2026-02-30')).toBe(null)
    expect(parseYmd('2026-02-28')).toEqual({ year: 2026, month: 2, day: 28 })
  })
  it('tarixi qeyd yalnız mənbəli məlumat yaxındadırsa: Məkkə — Quran yeri + İbn Bəttutə; London — heç nə', () => {
    const data = { stops: IBN_BATTUTA_STOPS, places: PROPHET_PLACES }
    const m = historyNear({ lat: 21.42, lng: 39.83 }, data)
    expect(m.quran.map((p) => p.id)).toContain('makkah')
    expect(m.battuta.length).toBeGreaterThan(0)
    expect(m.battuta.length).toBeLessThanOrEqual(3)
    for (const s of m.battuta) expect(s.km).toBeLessThanOrEqual(60)
    const l = historyNear(LONDON, data)
    expect(l.quran).toEqual([])
    expect(l.battuta).toEqual([])
    expect(haversineKm(BAKU, BAKU)).toBe(0)
  })
})

describe('travelTrips — Səfərlərim', () => {
  it('saxla, eyni nöqtə təkrarlanmır, sil', () => {
    const s = mem()
    const a = saveTrip(ISTANBUL, s, 1000)
    expect(a.ok).toBe(true)
    expect(readTrips(s).l).toHaveLength(1)
    const b = saveTrip({ ...ISTANBUL, label: 'İstanbul' }, s, 2000)
    expect(b.ok).toBe(true)
    expect(readTrips(s).l).toHaveLength(1)
    expect(readTrips(s).l[0].n).toBe('İstanbul')
    expect(tripPlace(readTrips(s).l[0])).toMatchObject({ lat: 41.0082, lng: 28.9784, tz: 'Europe/Istanbul', country: 'TR' })
    removeTrip(a.item.id, s)
    expect(s.getItem(TRIPS_KEY)).toBe(null)
  })
  it('yararsız yer (koordinat, saat qurşağı, ad) yazılmır; hədd dolanda full', () => {
    const s = mem()
    expect(saveTrip({ ...ISTANBUL, tz: 'Mars/Base' }, s).ok).toBe(false)
    expect(saveTrip({ ...ISTANBUL, lat: 99 }, s).ok).toBe(false)
    expect(saveTrip({ ...ISTANBUL, label: '   ' }, s).ok).toBe(false)
    for (let i = 0; i < TRIPS_MAX; i++) expect(saveTrip({ ...ISTANBUL, lat: 10 + i, label: `P${i}` }, s, 1000 + i).ok).toBe(true)
    const r = saveTrip({ ...ISTANBUL, lat: 60 }, s)
    expect(r.ok).toBe(false)
    expect(r.full).toBe(true)
  })
  it('sanitize: pozuq qeydlər atılır, ad kəsilir', () => {
    const v = sanitizeTrips({ l: [{ id: 'bad' }, null, { id: 'tabcde', n: 'x'.repeat(200), la: 1, lo: 2, tz: 'UTC', u: 5 }] })
    expect(v.l).toHaveLength(1)
    expect([...v.l[0].n]).toHaveLength(80)
  })
  it('profil açarıdır, ehtiyat nüsxəyə düşür, birləşdiricisi var (3 tərəfli, silinmə keçir, təzəsi qalır)', () => {
    expect(PROFILE_KEYS).toContain(TRIPS_KEY)
    expect(isBackupKey(TRIPS_KEY)).toBe(true)
    expect(typeof MERGERS[TRIPS_KEY]).toBe('function')
    const A = { id: 'taaaaa', n: 'A', la: 1, lo: 1, tz: 'UTC', u: 10 }
    const B = { id: 'tbbbbb', n: 'B', la: 2, lo: 2, tz: 'UTC', u: 10 }
    const C = { id: 'tccccc', n: 'C', la: 3, lo: 3, tz: 'UTC', u: 30 }
    const base = { v: 1, l: [A, B] }
    const local = { v: 1, l: [{ ...A, n: 'A2', u: 20 }] }        // B silinib, A dəyişib
    const remote = { v: 1, l: [{ ...A, n: 'A3', u: 25 }, B, C] } // A sonra dəyişib, C əlavə
    const out = mergeTrips(local, remote, base)
    expect(out.l.map((x) => x.id).sort()).toEqual(['taaaaa', 'tccccc'])
    expect(out.l.find((x) => x.id === 'taaaaa').n).toBe('A3')
    const raw = MERGERS[TRIPS_KEY](JSON.stringify(local), JSON.stringify(remote), JSON.stringify(base))
    expect(JSON.parse(raw).l).toHaveLength(2)
    expect(MERGERS[TRIPS_KEY]('{oops', JSON.stringify(remote), JSON.stringify(base))).toBe(CONFLICT)
  })
})
