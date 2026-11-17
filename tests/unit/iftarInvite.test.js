// İftar dəvət kartı (src/utils/iftarInvite.js): susma tarixi, məğrib vaxtı
// saytın namaz cədvəli ilə eyni, mətnin təmizlənməsi və dəvət mətni.
import { describe, it, expect } from 'vitest'
import {
  defaultIftarDate, iftarTime, calcMethodFor, locFromCity, cleanFields, cleanPhone, inviteText,
  todayIn, NOTE_MAX, fileName, formatOf,
} from '../../src/utils/iftarInvite.js'
import { gregorianToHijri, addGDays } from '../../src/utils/hijri.js'
import { CALC_METHODS, METHOD_ABUBAKR } from '../../src/utils/prayCalc.js'
import { PRAYER_CITIES } from '../../src/data/prayerCities.js'
import { monthTable } from '../../src/seo/prayerCity.js'

const city = (id) => PRAYER_CITIES.find(c => c.id === id)

describe('defaultIftarDate', () => {
  it('Ramazandan kənarda — gələn Ramazanın 1-i', () => {
    const today = { year: 2026, month: 11, day: 17 }
    const d = defaultIftarDate(today)
    const h = gregorianToHijri(d)
    expect(h.month).toBe(9)
    expect(h.day).toBe(1)
    expect(gregorianToHijri(addGDays(d, -1)).month).toBe(8)
    expect(d.year).toBe(2027)
  })
  it('Ramazan içində — bu gün', () => {
    const first = defaultIftarDate({ year: 2026, month: 11, day: 17 })
    const mid = addGDays(first, 10)
    expect(defaultIftarDate(mid)).toEqual(mid)
  })
  it('Ramazandan sonra — növbəti ilin Ramazanı', () => {
    const first = defaultIftarDate({ year: 2026, month: 11, day: 17 })
    const after = addGDays(first, 40)
    const next = defaultIftarDate(after)
    expect(gregorianToHijri(next)).toMatchObject({ month: 9, day: 1 })
    expect(next.year === 2028 || next.year === 2027).toBe(true)
    expect(gregorianToHijri(next).year).toBe(gregorianToHijri(first).year + 1)
  })
})

describe('iftarTime — saytın namaz cədvəli ilə eyni', () => {
  it('Azərbaycan şəhəri → Əbu Bəkr metodu', () => {
    const loc = locFromCity(city('Baku'))
    expect(loc.method).toBe(METHOD_ABUBAKR)
    expect(calcMethodFor(loc)).toBe(CALC_METHODS.abubakr)
    const rows = monthTable(city('Baku'), 2027, 2)
    for (const r of rows) expect(iftarTime({ year: 2027, month: 2, day: r.d }, loc)).toBe(r.maghrib)
  })
  it('dünya şəhəri → Diyanət metodu', () => {
    const loc = locFromCity(city('Istanbul'))
    expect(calcMethodFor(loc)).toBe(CALC_METHODS.diyanet)
    const rows = monthTable(city('Istanbul'), 2027, 2)
    for (const r of rows) expect(iftarTime({ year: 2027, month: 2, day: r.d }, loc)).toBe(r.maghrib)
  })
  it('HH:MM formatı; yer yoxdursa boş', () => {
    expect(iftarTime({ year: 2027, month: 2, day: 8 }, locFromCity(city('Baku')))).toMatch(/^\d{2}:\d{2}$/)
    expect(iftarTime({ year: 2027, month: 2, day: 8 }, null)).toBe('')
  })
})

describe('mətn', () => {
  it('sahələri kəsir və təmizləyir', () => {
    const f = cleanFields({ hosts: '  Əliyev   ailəsi ', note: 'x'.repeat(300), phone: '+994 (50) 123-45-67 <b>' })
    expect(f.hosts).toBe('Əliyev ailəsi')
    expect(f.note.length).toBe(NOTE_MAX)
    expect(f.phone).toBe('+994 (50) 123-45-67')
    expect(cleanPhone('abc')).toBe('')
  })
  it('dəvət mətni vaxt, yer və tarixi saxlayır', () => {
    const s = inviteText({
      fields: { hosts: 'Əliyev ailəsi', guests: 'Əziz qonşularımız', address: 'Nizami küç. 5', phone: '+994501234567' },
      g: { year: 2027, month: 2, day: 8 }, time: '17:45', city: 'Bakı', lang: 'az',
    })
    expect(s).toContain('Əziz qonşularımız,')
    expect(s).toContain('Əliyev ailəsi sizi iftar süfrəsinə dəvət edir.')
    expect(s).toContain('İftar: 17:45')
    expect(s).toContain('Nizami küç. 5, Bakı')
    expect(s).toContain('Ramazan')
    expect(s).toContain('fevral 2027')
    expect(s).toContain('+994501234567')
    expect(s.trim().endsWith('muslims.cc')).toBe(true)
  })
  it('ev sahibi boşdursa — "dəvət edirik"', () => {
    const s = inviteText({ fields: {}, g: { year: 2027, month: 2, day: 8 }, time: '17:45', city: 'Bakı', lang: 'az' })
    expect(s).toContain('Sizi iftar süfrəsinə dəvət edirik.')
  })
  it('fayl adı və ölçülər', () => {
    expect(fileName({ year: 2027, month: 2, day: 8 }, 'post')).toBe('iftar-2027-02-08-post-muslims-cc.png')
    expect(formatOf('story')).toMatchObject({ w: 1080, h: 1920 })
    expect(formatOf('post')).toMatchObject({ w: 1080, h: 1350 })
  })
  it('todayIn saat qurşağına görə', () => {
    const now = Date.UTC(2026, 10, 17, 22, 30)   // 22:30 UTC
    expect(todayIn('Asia/Baku', now)).toEqual({ year: 2026, month: 11, day: 18 })
    expect(todayIn('America/New_York', now)).toEqual({ year: 2026, month: 11, day: 17 })
  })
})
