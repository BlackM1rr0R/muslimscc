// Server: sünnə orucu xatırlatmasının saf köməkçiləri (server/fasting.js)
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const f = require('../../server/fasting.js')
const { LANGS } = require('../../server/prayer-utils.js')

describe('tarix köməkçiləri', () => {
  it('addDaysKey — ay/il sərhədi, yararsız giriş', () => {
    expect(f.addDaysKey('2026-10-31')).toBe('2026-11-01')
    expect(f.addDaysKey('2026-12-31')).toBe('2027-01-01')
    expect(f.addDaysKey('2028-02-28')).toBe('2028-02-29')
    expect(f.addDaysKey('bad')).toBeNull()
    expect(f.addDaysKey(null)).toBeNull()
  })
  it('weekdayOf — 0 bazar, 1 bazar ertəsi, 4 cümə axşamı', () => {
    expect(f.weekdayOf('2026-11-01')).toBe(0)
    expect(f.weekdayOf('2026-11-02')).toBe(1)
    expect(f.weekdayOf('2026-11-05')).toBe(4)
  })
  it('hijriOf — Intl Ümmül-Qura təqvimi', () => {
    expect(f.hijriOf('2026-02-18')).toEqual({ y: 1447, m: 9, d: 1 })    // 1 Ramazan 1447
    expect(f.hijriOf('2026-03-20')).toEqual({ y: 1447, m: 10, d: 1 })   // Ramazan bayramı
    expect(f.hijriOf('2026-05-26')).toEqual({ y: 1447, m: 12, d: 9 })   // Ərəfə
    expect(f.hijriOf('2026-06-25')).toEqual({ y: 1448, m: 1, d: 10 })   // Aşura
    expect(f.hijriOf('x')).toBeNull()
  })
})

describe('fastKind — prioritet və istisnalar', () => {
  const H = (m, d) => ({ y: 1447, m, d })
  it('illik oruclar həftə günündən önədir', () => {
    expect(f.fastKind(H(12, 9), 1)).toBe('arafah')
    expect(f.fastKind(H(1, 10), 4)).toBe('ashura')
    expect(f.fastKind(H(1, 9), 1)).toBe('tasua')
    expect(f.fastKind(H(10, 2), 1)).toBe('shawwal')
  })
  it('ağ günlər (13/14/15) bazar ertəsi/cümə axşamından önədir', () => {
    for (const d of [13, 14, 15]) expect(f.fastKind(H(5, d), 1)).toBe('white')
    expect(f.fastKind(H(1, 13), 4)).toBe('white')
    expect(f.fastKind(H(12, 14), 3)).toBe('white')
    expect(f.fastKind(H(12, 15), 3)).toBe('white')
  })
  it('13 Zülhiccə ağ gün sayılmır — təşriq günüdür', () => {
    expect(f.fastKind(H(12, 13), 2)).toBeNull()
    expect(f.fastKind(H(12, 13), 1)).toBeNull()
  })
  it('bazar ertəsi və cümə axşamı; qalan günlər — heç nə', () => {
    expect(f.fastKind(H(5, 22), 1)).toBe('monday')
    expect(f.fastKind(H(5, 25), 4)).toBe('thursday')
    for (const wd of [0, 2, 3, 5, 6]) expect(f.fastKind(H(5, 20), wd)).toBeNull()
  })
  it('Ramazan, bayramlar, təşriq günləri, Şəbanın 29–30-u — heç nə', () => {
    for (let d = 1; d <= 30; d++) expect(f.fastKind(H(9, d), 1)).toBeNull()
    expect(f.fastKind(H(10, 1), 1)).toBeNull()   // Ramazan bayramı
    for (const d of [10, 11, 12, 13]) expect(f.fastKind(H(12, d), 4)).toBeNull()
    expect(f.fastKind(H(8, 29), 1)).toBeNull()
    expect(f.fastKind(H(8, 30), 4)).toBeNull()
    expect(f.fastKind(H(8, 28), 4)).toBe('thursday')
    expect(f.fastKind(H(8, 15), 2)).toBe('white')
    expect(f.fastKind(null, 1)).toBeNull()
  })
  it('Şəvvalın altı günü — yalnız 2 Şəvvalda (bir dəfə)', () => {
    expect(f.fastKind(H(10, 2), 6)).toBe('shawwal')
    expect(f.fastKind(H(10, 3), 6)).toBeNull()
    expect(f.fastKind(H(10, 3), 1)).toBe('monday')
  })
})

describe('fastingForTomorrow — yerli bugünkü tarix → sabahın orucu', () => {
  it('real tarixlər (Ümmül-Qura)', () => {
    expect(f.fastingForTomorrow('2026-05-25')).toMatchObject({ kind: 'arafah', date: '2026-05-26' })
    expect(f.fastingForTomorrow('2026-06-23')).toMatchObject({ kind: 'tasua', date: '2026-06-24' })
    expect(f.fastingForTomorrow('2026-06-24')).toMatchObject({ kind: 'ashura', date: '2026-06-25' })
    expect(f.fastingForTomorrow('2026-03-20')).toMatchObject({ kind: 'shawwal', date: '2026-03-21' })
    expect(f.fastingForTomorrow('2026-05-30')).toMatchObject({ kind: 'white', date: '2026-05-31' })
    expect(f.fastingForTomorrow('2026-11-01')).toMatchObject({ kind: 'monday', date: '2026-11-02' })
    expect(f.fastingForTomorrow('2026-11-04')).toMatchObject({ kind: 'thursday', date: '2026-11-05' })
  })
  it('Ramazan, bayram, təşriq — heç nə (həftə günü uyğun gəlsə belə)', () => {
    expect(f.fastingForTomorrow('2026-02-16')).toBeNull()   // sabah 29 Şəban
    expect(f.fastingForTomorrow('2026-02-17')).toBeNull()   // sabah 1 Ramazan
    expect(f.fastingForTomorrow('2026-03-19')).toBeNull()   // sabah Ramazan bayramı
    expect(f.fastingForTomorrow('2026-05-26')).toBeNull()   // sabah Qurban bayramı
    expect(f.fastingForTomorrow('2026-05-27')).toBeNull()   // sabah 11 Zülhiccə — cümə axşamı
    expect(f.fastingForTomorrow('2026-05-29')).toBeNull()   // sabah 13 Zülhiccə
    expect(f.fastingForTomorrow('bad')).toBeNull()
  })
})

describe('vaxt və seçim', () => {
  it('yerli 20:00-da', () => {
    expect(f.FASTING_HHMM).toBe('20:00')
    expect(f.isDueNow('20:00')).toBe(true)
    expect(f.isDueNow('20:01')).toBe(false)
  })
  it('normFasting — yalnız true', () => {
    expect(f.normFasting(true)).toBe(true)
    for (const v of [undefined, null, false, 'true', 1]) expect(f.normFasting(v)).toBe(false)
  })
})

describe('mətnlər və mesaj', () => {
  it('hər dil × hər növ üçün başlıq və mətn var', () => {
    for (const lang of LANGS) {
      for (const kind of f.KINDS) {
        const t = f.fastingTexts(lang, kind)
        expect(t, `${lang}/${kind}`).toBeTruthy()
        expect(t.title.length).toBeGreaterThan(3)
        expect(t.body.length).toBeGreaterThan(10)
        expect(t.body).toContain(f.SAHUR[lang])
      }
    }
    expect(f.fastingTexts('az', 'friday')).toBeNull()
    expect(f.fastingTexts('xx', 'monday')).toEqual(f.fastingTexts('az', 'monday'))
  })
  it('dil təmizliyi: tr-də "ə" yoxdur, ru-da latın hərfi yoxdur', () => {
    for (const kind of f.KINDS) {
      const tr = f.fastingTexts('tr', kind)
      expect(tr.title + tr.body).not.toMatch(/[əƏ]/)
      const ru = f.fastingTexts('ru', kind)
      expect(ru.title + ru.body).not.toMatch(/[A-Za-z]/)
    }
  })
  it('dəlillər mətndədir', () => {
    expect(f.fastingTexts('az', 'thursday').body).toContain('Tirmizi 747')
    expect(f.fastingTexts('az', 'white').body).toContain('Nəsai 2420')
    expect(f.fastingTexts('en', 'arafah').body).toContain('Muslim 1162')
    expect(f.fastingTexts('en', 'shawwal').body).toContain('Muslim 1164')
  })
  it('link — dil prefiksi ilə (az prefikssiz)', () => {
    expect(f.fastingLink('az')).toBe('/learn/sunnah-fasts')
    expect(f.fastingLink('en')).toBe('/en/learn/sunnah-fasts')
    expect(f.fastingLink('ar')).toBe('/ar/learn/sunnah-fasts')
    expect(f.fastingLink('xx')).toBe('/learn/sunnah-fasts')
  })
  it('buildFastingMessage — deliver üçün FCM formalı mesaj', () => {
    const icons = { icon: '/i.png', badge: '/b.png' }
    const m = f.buildFastingMessage('ru', 'monday', '2026-11-02', icons)
    expect(m.notification.title).toContain('Завтра понедельник')
    expect(m.data).toEqual({ kind: 'fasting', fast: 'monday', date: '2026-11-02', tag: 'fasting-2026-11-02', url: '/ru/learn/sunnah-fasts' })
    expect(Object.values(m.data).every(v => typeof v === 'string')).toBe(true)
    expect(m.webpush.notification).toEqual({ ...icons, tag: 'fasting-2026-11-02' })
    expect(m.webpush.fcmOptions.link).toBe('/ru/learn/sunnah-fasts')
    expect(m.webpush.headers.TTL).toBe('28800')
    expect(f.buildFastingMessage('az', 'nope', '2026-11-02')).toBeNull()
  })
})
