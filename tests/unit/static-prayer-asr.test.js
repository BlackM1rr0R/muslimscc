// /prayer/<şəhər> statik cədvəli: əsr sütunu məzhəbə görə (src/seo/staticPrayerAsr.js)
import { describe, it, expect } from 'vitest'
import { asrColumn, asrNote, patchStaticPrayerAsr } from '../../src/seo/staticPrayerAsr.js'
import { monthTable, prayerCity } from '../../src/seo/prayerCity.js'
import { computeTimes, tzOffsetHours, withAsr, CALC_METHODS } from '../../src/utils/prayCalc.js'

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }

describe('asrColumn', () => {
  it('1× — prerender cədvəli ilə eyni; 2× — hər gün daha gec, usePrayerMonth ilə eyni yol', () => {
    const c = prayerCity('baku')
    const one = asrColumn('baku', 2026, 11, 1)
    expect(one).toEqual(monthTable(c, 2026, 11).map((r) => r.asr))
    const two = asrColumn('baku', 2026, 11, 2)
    expect(two).toHaveLength(30)
    two.forEach((t, i) => expect(toMin(t)).toBeGreaterThan(toMin(one[i])))
    const d15 = computeTimes({ year: 2026, month: 11, day: 15 }, c.lat, c.lng, tzOffsetHours(c.tz, 2026, 11, 15), withAsr(CALC_METHODS.abubakr, 2)).asr
    expect(two[14]).toBe(d15)
  })
  it('dünya şəhəri (Diyanət) və naməlum şəhər', () => {
    expect(asrColumn('london', 2026, 2, 2)).toHaveLength(28)
    expect(asrColumn('atlantis', 2026, 2, 2)).toBe(null)
    expect(asrColumn('baku', 2026, 13, 2)).toBe(null)
  })
})

describe('qeyd və DOM', () => {
  it('5 dildə qeyd', () => {
    expect(asrNote('az')).toBe('Əsr: Hənəfi (2×)')
    expect(asrNote('en')).toBe('Asr: Hanafi (2×)')
    expect(asrNote('tr')).toBe('İkindi: Hanefî (2×)')
  })

  it('patchStaticPrayerAsr: əsr sütunu və qeyd; 1× — toxunmur; ikinci dəfə — yox', () => {
    // Minimal DOM (node mühiti): cədvəl, başlıq hüceyrələri, sətirlər
    const el = (tag, props = {}, kids = []) => ({ tag, dataset: {}, children: kids, textContent: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v }, ...props })
    const heads = ['Gün', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k, i) => el('th', { dataset: i ? { k } : {} }))
    const rows = Array.from({ length: 30 }, (_, d) => el('tr', {}, [el('th', { textContent: String(d + 1) }), ...Array.from({ length: 6 }, () => el('td', { textContent: '00:00' }))]))
    const inserted = []
    const table = el('table', {
      dataset: { city: 'baku', ym: '2026-11' },
      parentNode: { insertBefore: (n) => inserted.push(n) },
      querySelectorAll: (s) => (s === 'thead th' ? heads : rows),
    })
    const doc = { querySelector: () => table, createElement: (t) => el(t) }
    expect(patchStaticPrayerAsr(doc, 1, 'az')).toBe(false)
    expect(patchStaticPrayerAsr(doc, 2, 'az')).toBe(true)
    const want = asrColumn('baku', 2026, 11, 2)
    expect(rows.map((r) => r.children[4].textContent)).toEqual(want)
    expect(rows[0].children[3].textContent).toBe('00:00')   // digər sütunlar dəyişmir
    expect(inserted).toHaveLength(1)
    expect(inserted[0].textContent).toBe('Əsr: Hənəfi (2×)')
    expect(patchStaticPrayerAsr(doc, 2, 'az')).toBe(false)
  })
})
