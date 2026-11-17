// Hilal müşahidələri — klient köməkçiləri (src/utils/hilalReports.js)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { hrEnabled, hrCell, hrEvening, hrTotals, sendSighting, fetchSightings } from '../../src/utils/hilalReports.js'

afterEach(() => vi.unstubAllGlobals())

describe('hilalReports', () => {
  it('yalnız muslims.cc və ya ?sightings=1', () => {
    expect(hrEnabled({ hostname: 'muslims.cc', search: '' })).toBe(true)
    expect(hrEnabled({ hostname: 'www.muslims.cc', search: '' })).toBe(true)
    expect(hrEnabled({ hostname: 'localhost', search: '' })).toBe(false)
    expect(hrEnabled({ hostname: 'localhost', search: '?a=1&sightings=1' })).toBe(true)
    expect(hrEnabled({ hostname: 'evil-muslims.cc', search: '' })).toBe(false)
  })
  it('1°-lik xana, uzunluq [−180, 179]', () => {
    expect(hrCell(40.41, 49.87)).toEqual({ lat: 40, lng: 50 })
    expect(hrCell(-33.9, 179.6)).toEqual({ lat: -34, lng: -180 })
    expect(hrCell(NaN, 1)).toBeNull()
  })
  it('axşam tarixi serverdəki qayda ilə', () => {
    expect(hrEvening(Date.UTC(2026, 10, 22, 2), -74)).toBe('2026-11-21')
    expect(hrEvening(Date.UTC(2026, 10, 21, 15), 50)).toBe('2026-11-21')
    expect(hrEvening(Date.UTC(2026, 10, 21, 6), 50)).toBe('2026-11-20')
  })
  it('cəm', () => {
    expect(hrTotals([{ seen: 2, notSeen: 1 }, { seen: 0, notSeen: 4 }])).toEqual({ seen: 2, notSeen: 5, cells: 2 })
    expect(hrTotals(null)).toEqual({ seen: 0, notSeen: 0, cells: 0 })
  })
  it('göndərmə: yalnız xana gedir; 429 → once', async () => {
    const f = vi.fn(async () => ({ ok: true, status: 204 }))
    vi.stubGlobal('fetch', f)
    expect(await sendSighting({ lat: 40.41, lng: 49.87, seen: true, method: 'eye' })).toBe('ok')
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ lat: 40, lng: 50, seen: true, method: 'eye' })
    f.mockResolvedValueOnce({ ok: false, status: 429 })
    expect(await sendSighting({ lat: 1, lng: 1, seen: false, method: 'camera' })).toBe('once')
    expect(await sendSighting({ lat: 1, lng: 1, seen: false, method: 'radar' })).toBe('error')
  })
  it('oxuma: pozuq xanalar atılır', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ cells: [{ lat: 1, lng: 2, seen: 1, notSeen: 0 }, { lat: 'x' }] }) })))
    expect(await fetchSightings('2026-11-21')).toEqual([{ lat: 1, lng: 2, seen: 1, notSeen: 0 }])
  })
})
