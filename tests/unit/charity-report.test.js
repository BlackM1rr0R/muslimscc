// Sədəqə hesabatı (utils/charityReport): illik toplama, aylar, növlər, Ramazan payı, alıcılar,
// CSV (məbləğ gizlədilə bilər, formula inyeksiyası yoxdur)
import { describe, it, expect } from 'vitest'
import { cleanEntries, reportYears, yearlyReport, reportCsv, csvCell } from '../../src/utils/charityReport.js'
import { ramadanRangesInYear } from '../../src/utils/ramadanRange.js'

const LOG = [
  { id: 1, date: '2026-01-05', type: 'money', amount: 10, to: 'Masjid' },
  { id: 2, date: '2026-02-20', type: 'food', amount: '', to: 'masjid' },
  { id: 3, date: '2026-03-01', type: 'money', amount: 25.5, to: 'Neighbour' },
  { id: 4, date: '2026-03-19', type: 'smile', amount: null },
  { id: 5, date: '2026-03-20', type: 'weird', amount: 4.5 },
  { id: 6, date: '2025-12-31', type: 'money', amount: 100 },
  { id: 7, date: 'bad', type: 'money', amount: 1 },
  null,
]
const L = {
  section: 'Section', metric: 'Metric', count: 'Count', amount: 'Amount', total: 'Total', ramadan: 'Ramadan',
  monthSec: 'Month', month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  typeSec: 'Type', type: { money: 'Money', food: 'Food', smile: 'Smile', other: 'Other' }, recipients: 'Recipient',
}

describe('sədəqə hesabatı', () => {
  const entries = cleanEntries(LOG)
  it('pozuq qeydlər atılır, illər yenidən köhnəyə', () => {
    expect(entries).toHaveLength(6)
    expect(reportYears(entries)).toEqual([2026, 2025])
  })
  it('il üzrə say, məbləğ, aylar, növlər, ən fəal ay', () => {
    const r = yearlyReport(entries, 2026, ramadanRangesInYear(2026))
    expect(r).toMatchObject({ year: 2026, count: 5, amount: 40, withAmount: 3, days: 5, best: 2 })
    expect(r.months[0]).toEqual({ count: 1, amount: 10 })
    expect(r.months[2]).toEqual({ count: 3, amount: 30 })
    expect(r.types[0]).toEqual({ key: 'money', count: 2, amount: 35.5 })
    expect(r.types.find((t) => t.key === 'other')).toEqual({ key: 'other', count: 1, amount: 4.5 })
  })
  it('Ramazan payı (1447: 18.02–19.03) — 20.03 daxil deyil', () => {
    const r = yearlyReport(entries, 2026, ramadanRangesInYear(2026))
    expect(r.ramadan).toEqual({ count: 3, amount: 25.5, share: 3 / 5 })
  })
  it('alıcılar: böyük-kiçik hərf fərqi nəzərə alınmır', () => {
    const r = yearlyReport(entries, 2026, [])
    expect(r.to[0]).toEqual({ name: 'Masjid', count: 2 })
  })
  it('boş il', () => {
    const r = yearlyReport(entries, 2024, [])
    expect(r).toMatchObject({ count: 0, amount: 0, best: null, ramadan: { share: 0 } })
  })
  it('CSV: məbləğ gizlidirsə sütun və alıcılar yoxdur; BOM; formula qorunması', () => {
    const r = yearlyReport(entries, 2026, ramadanRangesInYear(2026))
    const full = reportCsv(r, L)
    expect(full.startsWith('﻿Section,Metric,Count,Amount\r\n')).toBe(true)
    expect(full).toContain('Total,2026,5,40')
    expect(full).toContain('Recipient,Masjid,2,')
    const hidden = reportCsv(r, L, { hideAmounts: true })
    expect(hidden).toContain('Section,Metric,Count\r\n')
    expect(hidden).toContain('Total,2026,5\r\n')
    expect(hidden).not.toContain('40')
    expect(hidden).not.toContain('Masjid')
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "x"')).toBe('"say ""x"""')
  })
})
