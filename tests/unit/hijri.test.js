// Hicri ↔ miladi çevirmə (src/utils/hijri.js). Gözlənilən cütlər əl ilə yazılmır:
// Node-un öz Intl Ümmül-Qura təqvimindən (brauzerlə eyni ICU məlumatı) götürülür,
// sonra köməkçilərin onunla və bir-biri ilə uyğunluğu yoxlanılır.
import { describe, it, expect } from 'vitest'
import {
  gregorianToHijri, hijriToGregorian, hijriMonthLength, hijriMonthGrid, shiftHijriMonth,
  countRamadanDays, addGDays, gDiffDays, gKey, parseGKey, weekdayOf, isValidGregorian,
  gregorianToHijriCivil, hijriToGregorianCivil, hasUmmAlQura, isApproximate,
  formatHijri, formatGregorian, weekdayName, HIJRI_MONTHS, WEEKDAYS, G_MONTHS,
} from '../../src/utils/hijri.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']

// Müstəqil istinad: birbaşa Intl (köməkçidən keçmədən)
const ref = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric',
})
function intlHijri(iso) {
  const parts = ref.formatToParts(new Date(`${iso}T12:00:00Z`))
  const n = (t) => Number(parts.find(p => p.type === t).value)
  return { year: n('year'), month: n('month'), day: n('day') }
}

describe('mühit', () => {
  it('Node Intl Ümmül-Qura təqvimini dəstəkləyir', () => {
    expect(hasUmmAlQura()).toBe(true)
    expect(ref.resolvedOptions().calendar).toBe('islamic-umalqura')
  })
})

describe('gregorianToHijri', () => {
  it('Intl ilə eyni nəticə verir (müxtəlif tarixlər)', () => {
    for (const iso of ['2026-02-18', '2026-03-20', '2025-06-26', '2026-10-31', '2000-01-01', '1980-07-15', '2050-12-31']) {
      expect(gregorianToHijri(parseGKey(iso)), iso).toEqual(intlHijri(iso))
    }
  })
  it('1 Ramazan 1447 — Ümmül-Qura üzrə 18 fevral 2026 (Node Intl ilə təsdiqlənir)', () => {
    expect(intlHijri('2026-02-18')).toEqual({ year: 1447, month: 9, day: 1 })
    expect(gregorianToHijri({ year: 2026, month: 2, day: 18 })).toEqual({ year: 1447, month: 9, day: 1 })
  })
})

describe('hijriToGregorian', () => {
  it('ayın 1-i — Intl-dəki ayın ilk günü ilə üst-üstə düşür', () => {
    const g = hijriToGregorian({ year: 1447, month: 9, day: 1 })
    expect(intlHijri(gKey(g))).toEqual({ year: 1447, month: 9, day: 1 })
    // bir gün əvvəl — əvvəlki ay
    expect(intlHijri(gKey(addGDays(g, -1))).month).toBe(8)
  })
  it('mövcud olmayan günə null qaytarır (29 günlük ayın 30-u)', () => {
    let found = false
    for (let m = 1; m <= 12; m++) {
      if (hijriMonthLength(1447, m) === 29) {
        expect(hijriToGregorian({ year: 1447, month: m, day: 30 })).toBeNull()
        found = true
      }
    }
    expect(found).toBe(true)
  })
  it('səhv girişi rədd edir', () => {
    expect(hijriToGregorian({ year: 1447, month: 13, day: 1 })).toBeNull()
    expect(hijriToGregorian({ year: 1447, month: 1, day: 31 })).toBeNull()
    expect(hijriToGregorian({ year: 1447, month: 1, day: 0 })).toBeNull()
    expect(hijriToGregorian(null)).toBeNull()
  })
})

describe('gediş-dönüş (round-trip)', () => {
  it('miladi → hicri → miladi: 1950–2076 hər 3 gündən bir', () => {
    const start = { year: 1950, month: 1, day: 1 }
    let n = 0
    for (let i = 0; i < 46000; i += 3) {
      const g = addGDays(start, i)
      expect(hijriToGregorian(gregorianToHijri(g))).toEqual(g)
      n++
    }
    expect(n).toBeGreaterThan(15000)
  })
  it('hicri → miladi → hicri: 1440–1460-ın bütün günləri', () => {
    for (let y = 1440; y <= 1460; y++) {
      for (let m = 1; m <= 12; m++) {
        const len = hijriMonthLength(y, m)
        for (let d = 1; d <= len; d++) {
          const g = hijriToGregorian({ year: y, month: m, day: d })
          expect(g, `${y}-${m}-${d}`).not.toBeNull()
          expect(gregorianToHijri(g)).toEqual({ year: y, month: m, day: d })
        }
      }
    }
  })
  it('ardıcıl aylar boşluqsuz birləşir və il 354–355 gündür', () => {
    for (let y = 1440; y <= 1460; y++) {
      let total = 0
      for (let m = 1; m <= 12; m++) {
        const len = hijriMonthLength(y, m)
        expect([29, 30]).toContain(len)
        total += len
        const next = shiftHijriMonth({ year: y, month: m }, 1)
        const end = addGDays(hijriToGregorian({ year: y, month: m, day: 1 }), len)
        expect(end).toEqual(hijriToGregorian({ ...next, day: 1 }))
      }
      expect(total).toBeGreaterThanOrEqual(354)
      expect(total).toBeLessThanOrEqual(355)
    }
  })
})

describe('arifmetik (ehtiyat) təqvim', () => {
  it('öz daxilində gediş-dönüş edir', () => {
    for (let i = 0; i < 4000; i += 13) {
      const g = addGDays({ year: 2000, month: 1, day: 1 }, i)
      expect(hijriToGregorianCivil(gregorianToHijriCivil(g))).toEqual(g)
    }
  })
  it('Ümmül-Quradan ən çox 2 gün fərqlənir (təxmin kimi yararlıdır)', () => {
    for (let i = 0; i < 9000; i += 11) {
      const g = addGDays({ year: 2000, month: 1, day: 1 }, i)
      const civil = hijriToGregorianCivil(gregorianToHijri(g))
      expect(Math.abs(gDiffDays(g, civil))).toBeLessThanOrEqual(2)
    }
  })
  it('Ümmül-Qura cədvəlindən kənar illər təxmini sayılır', () => {
    expect(isApproximate(1447)).toBe(false)
    expect(isApproximate(1200)).toBe(true)
    expect(isApproximate(1700)).toBe(true)
  })
})

describe('ay şəbəkəsi', () => {
  it('həftələr 7 xanalıdır, günlər ardıcıldır, həftə günü düzdür', () => {
    for (const first of [0, 1, 6]) {
      const grid = hijriMonthGrid(1447, 9, first)
      expect(grid.length).toBe(hijriMonthLength(1447, 9))
      expect(grid.days.length).toBe(grid.length)
      for (const w of grid.weeks) expect(w).toHaveLength(7)
      const flat = grid.weeks.flat()
      expect(flat.findIndex(Boolean)).toBe((grid.days[0].dow - first + 7) % 7)
      grid.days.forEach((d, i) => {
        expect(d.hDay).toBe(i + 1)
        expect(d.g).toEqual(addGDays(grid.start, i))
        expect(d.dow).toBe(weekdayOf(d.g))
      })
    }
  })
  it('shiftHijriMonth il sərhədini keçir', () => {
    expect(shiftHijriMonth({ year: 1447, month: 12 }, 1)).toEqual({ year: 1448, month: 1 })
    expect(shiftHijriMonth({ year: 1447, month: 1 }, -1)).toEqual({ year: 1446, month: 12 })
    expect(shiftHijriMonth({ year: 1447, month: 5 }, -17)).toEqual({ year: 1445, month: 12 })
  })
})

describe('countRamadanDays', () => {
  it('bir tam Ramazan = o ayın uzunluğu', () => {
    const s = hijriToGregorian({ year: 1447, month: 9, day: 1 })
    const len = hijriMonthLength(1447, 9)
    expect(countRamadanDays(s, addGDays(s, len - 1))).toBe(len)
    expect(countRamadanDays(addGDays(s, -40), addGDays(s, len + 40))).toBe(len)
  })
  it('qismən kəsişmə və tərs sıra', () => {
    const s = hijriToGregorian({ year: 1447, month: 9, day: 1 })
    expect(countRamadanDays(addGDays(s, 10), addGDays(s, 100))).toBe(hijriMonthLength(1447, 9) - 10)
    expect(countRamadanDays(addGDays(s, 4), addGDays(s, -5))).toBe(5)
  })
  it('Intl ilə gün-gün sayımla uyğundur (10 il)', () => {
    const a = { year: 2015, month: 1, day: 1 }, b = { year: 2024, month: 12, day: 31 }
    let n = 0
    for (let g = a; gDiffDays(g, b) >= 0; g = addGDays(g, 1)) if (intlHijri(gKey(g)).month === 9) n++
    expect(countRamadanDays(a, b)).toBe(n)
  })
  it('Ramazansız aralıq — 0', () => {
    const s = hijriToGregorian({ year: 1447, month: 1, day: 1 })
    expect(countRamadanDays(s, addGDays(s, 20))).toBe(0)
  })
})

describe('köməkçilər və adlar', () => {
  it('parseGKey / gKey / isValidGregorian', () => {
    expect(parseGKey('2026-02-18')).toEqual({ year: 2026, month: 2, day: 18 })
    expect(gKey({ year: 2026, month: 2, day: 8 })).toBe('2026-02-08')
    expect(parseGKey('2026-02-30')).toBeNull()
    expect(parseGKey('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 })
    expect(parseGKey('abc')).toBeNull()
    expect(isValidGregorian({ year: 2023, month: 2, day: 29 })).toBe(false)
  })
  it('həftə günü saat qurşağından asılı deyil', () => {
    expect(weekdayOf({ year: 2026, month: 2, day: 18 })).toBe(3)   // çərşənbə
    expect(weekdayOf({ year: 2000, month: 1, day: 1 })).toBe(6)    // şənbə
  })
  it('hər dildə 12 ay və 7 gün', () => {
    for (const l of LANGS) {
      expect(HIJRI_MONTHS[l]).toHaveLength(12)
      expect(G_MONTHS[l]).toHaveLength(12)
      expect(WEEKDAYS[l]).toHaveLength(7)
    }
  })
  it('formatlama', () => {
    expect(formatHijri({ year: 1447, month: 9, day: 1 }, 'az')).toBe('1 Ramazan 1447 h.')
    expect(formatHijri({ year: 1447, month: 9, day: 1 }, 'en')).toBe('1 Ramadan 1447 AH')
    expect(formatGregorian({ year: 2026, month: 2, day: 18 }, 'ru')).toBe('18 февраля 2026 г.')
    expect(formatGregorian({ year: 2026, month: 2, day: 18 }, 'az')).toBe('18 fevral 2026')
    expect(weekdayName({ year: 2026, month: 2, day: 18 }, 'tr')).toBe('Çarşamba')
    expect(weekdayName({ year: 2026, month: 2, day: 18 }, 'xx')).toBe('Wednesday')
  })
})
