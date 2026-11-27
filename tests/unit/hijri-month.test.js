// Hicri ayın görünüşü (utils/hijriMonth.js) — sabit tarixlər, Bakı vaxtı
import { describe, it, expect, beforeEach } from 'vitest'
import { hmonthOf, hmonthOfGregorian, hijriMonthDay, isSacredMonth, showsSacredBadge, applyHijriMonth } from '../../src/utils/hijriMonth.js'
import { gregorianToHijri, addGDays } from '../../src/utils/hijri.js'

/** UTC an → Bakı (Asia/Baku) təqvim günü { year, month, day } */
function bakuDay(iso) {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
  const [year, month, day] = s.split('-').map(Number)
  return { year, month, day }
}

describe('hmonthOf (hicri tarix → vəziyyət)', () => {
  it.each([
    [{ year: 1448, month: 1, day: 1 }, 'sacred'],
    [{ year: 1448, month: 6, day: 29 }, ''],
    [{ year: 1448, month: 7, day: 1 }, 'sacred'],
    [{ year: 1448, month: 8, day: 15 }, ''],
    [{ year: 1448, month: 9, day: 1 }, 'ramadan'],
    [{ year: 1448, month: 9, day: 30 }, 'ramadan'],
    [{ year: 1448, month: 10, day: 1 }, ''],
    [{ year: 1448, month: 11, day: 5 }, 'sacred'],
    [{ year: 1448, month: 12, day: 1 }, 'dhul10'],
    [{ year: 1448, month: 12, day: 10 }, 'dhul10'],
    [{ year: 1448, month: 12, day: 11 }, 'sacred'],
    [{ year: 1448, month: 12, day: 29 }, 'sacred'],
    [null, ''],
  ])('%o → "%s"', (h, s) => { expect(hmonthOf(h)).toBe(s) })

  it('yalnız dörd haram ay (Tövbə 9:36; Buxari 3197)', () => {
    const sacred = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => isSacredMonth({ month: m }))
    expect(sacred).toEqual([1, 7, 11, 12])
  })

  it('nişan: haram ay və Zülhiccənin on günü; Ramazanda yox', () => {
    expect(showsSacredBadge('sacred')).toBe(true)
    expect(showsSacredBadge('dhul10')).toBe(true)
    expect(showsSacredBadge('ramadan')).toBe(false)
    expect(showsSacredBadge('')).toBe(false)
  })
})

describe('hmonthOfGregorian — Ümmül-Qura, Bakı günü', () => {
  it.each([
    ['2026-11-27T08:00:00Z', ''],          // 17 Cəmadiyəl-axirə 1448
    ['2026-12-09T08:00:00Z', ''],          // Cəmadiyəl-axirənin son günü
    ['2026-12-09T20:30:00Z', 'sacred'],    // UTC hələ 9-u, Bakıda artıq 10 dekabr — 1 Rəcəb
    ['2026-12-10T08:00:00Z', 'sacred'],
    ['2027-01-08T08:00:00Z', 'sacred'],    // Rəcəbin sonu
    ['2027-01-09T08:00:00Z', ''],          // 1 Şaban
    ['2027-02-08T08:00:00Z', 'ramadan'],   // 1 Ramazan
    ['2027-03-09T08:00:00Z', ''],          // 1 Şəvval
    ['2027-04-08T08:00:00Z', 'sacred'],    // 1 Zülqədə
    ['2027-05-07T08:00:00Z', 'dhul10'],    // 1 Zülhiccə
    ['2027-05-16T08:00:00Z', 'dhul10'],    // 10 Zülhiccə
    ['2027-05-17T08:00:00Z', 'sacred'],    // 11 Zülhiccə
    ['2026-06-16T08:00:00Z', 'sacred'],    // 1 Məhərrəm 1448
  ])('%s → "%s"', (iso, s) => { expect(hmonthOfGregorian(bakuDay(iso))).toBe(s) })
})

describe('hijriMonthDay — saytın hicri köməkçisi ilə eyni (utils/hijri.js)', () => {
  it('2026-01-01 … 2027-12-31 hər gün ay və gün üst-üstə düşür', () => {
    let g = { year: 2026, month: 1, day: 1 }
    const diff = []
    for (let i = 0; i < 730; i++, g = addGDays(g, 1)) {
      const a = hijriMonthDay(g), b = gregorianToHijri(g)
      if (a.month !== b.month || a.day !== b.day) diff.push(g)
    }
    expect(diff).toEqual([])
  })
})

describe('applyHijriMonth', () => {
  let root
  beforeEach(() => {
    root = { attrs: {}, setAttribute(k, v) { this.attrs[k] = String(v) }, removeAttribute(k) { delete this.attrs[k] }, hasAttribute(k) { return k in this.attrs } }
  })
  const at = (y, m, d) => new Date(y, m - 1, d, 12)

  it('haram ayda data-hmonth="sacred", mövsüm yoxdur', () => {
    expect(applyHijriMonth(root, at(2026, 12, 15))).toBe('sacred')
    expect(root.attrs['data-hmonth']).toBe('sacred')
    expect(root.attrs['data-season']).toBeUndefined()
  })
  it('Ramazanda data-season da qoyulur (wow.js → seasonOf, fənərlər)', () => {
    applyHijriMonth(root, at(2027, 2, 20))
    expect(root.attrs['data-hmonth']).toBe('ramadan')
    expect(root.attrs['data-season']).toBe('ramadan')
  })
  it('Zülhiccənin on günü: dhul10 + hajj mövsümü; adi ayda atribut silinir', () => {
    applyHijriMonth(root, at(2027, 5, 10))
    expect(root.attrs['data-hmonth']).toBe('dhul10')
    expect(root.attrs['data-season']).toBe('hajj')
    applyHijriMonth(root, at(2026, 11, 27))
    expect(root.attrs['data-hmonth']).toBeUndefined()
  })
  it('əvvəlcədən qoyulmuş mövsümə (?season=) toxunmur', () => {
    root.setAttribute('data-season', 'eid')
    applyHijriMonth(root, at(2027, 2, 20))
    expect(root.attrs['data-season']).toBe('eid')
  })
})
