// "Namaz vaxtına görə" tema — qərar funksiyası, keş və index.html skripti ilə uyğunluq
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { decidePrayerTheme, darkFromCache } from '../../src/utils/prayerThemeCore.js'
import { prayerTimesFor } from '../../src/utils/prayerTheme.js'
import { computeTimes, CALC_METHODS } from '../../src/utils/prayCalc.js'

const H = 3600000
const DAY = 24 * H
// Bakı (UTC+4, yay vaxtı yoxdur): 2026-11-28 — sübh ~06:10, məğrib ~17:05 yerli
const base = Date.UTC(2026, 10, 28, 0, 0) - 4 * H        // yerli gecəyarısı
const fajr = base + 6 * H + 10 * 60000
const maghrib = base + 17 * H + 5 * 60000
const nextFajr = fajr + DAY + 60000

describe('decidePrayerTheme', () => {
  it('sübhdən əvvəl — tünd, növbəti keçid sübhdə', () => {
    expect(decidePrayerTheme(base + 3 * H, { fajr, maghrib, nextFajr })).toEqual({ theme: 'dark', next: fajr })
  })
  it('sübh anında işıqlı olur (günəşin çıxması keçid deyil)', () => {
    expect(decidePrayerTheme(fajr, { fajr, maghrib, nextFajr })).toEqual({ theme: 'light', next: maghrib })
    expect(decidePrayerTheme(fajr + 30 * 60000, { fajr, maghrib, nextFajr }).theme).toBe('light')
  })
  it('gündüz — işıqlı, növbəti keçid məğribdə', () => {
    expect(decidePrayerTheme(base + 12 * H, { fajr, maghrib, nextFajr })).toEqual({ theme: 'light', next: maghrib })
  })
  it('məğrib anında və sonra — tünd, növbəti keçid sabahkı sübhdə', () => {
    expect(decidePrayerTheme(maghrib, { fajr, maghrib, nextFajr })).toEqual({ theme: 'dark', next: nextFajr })
    expect(decidePrayerTheme(base + 23 * H, { fajr, maghrib, nextFajr })).toEqual({ theme: 'dark', next: nextFajr })
  })
  it('sabahkı sübh yoxdursa — bugünkü sübh + 24 saat', () => {
    expect(decidePrayerTheme(maghrib + H, { fajr, maghrib })).toEqual({ theme: 'dark', next: fajr + DAY })
    expect(decidePrayerTheme(maghrib + H, { fajr, maghrib, nextFajr: NaN }).next).toBe(fajr + DAY)
  })
  it('vaxtlar yoxdur / pozuqdur — null (sistem rejimi)', () => {
    const none = { theme: null, next: null }
    expect(decidePrayerTheme(base, null)).toEqual(none)
    expect(decidePrayerTheme(base, {})).toEqual(none)
    expect(decidePrayerTheme(base, { fajr })).toEqual(none)
    expect(decidePrayerTheme(base, { fajr: NaN, maghrib })).toEqual(none)
    expect(decidePrayerTheme(base, { fajr: maghrib, maghrib: fajr })).toEqual(none)
    expect(decidePrayerTheme(NaN, { fajr, maghrib })).toEqual(none)
  })
})

describe('darkFromCache (index.html skripti ilə eyni hesab)', () => {
  const c = { f: fajr, m: maghrib }
  it('bu gün', () => {
    expect(darkFromCache(base + 3 * H, c)).toBe(true)
    expect(darkFromCache(fajr, c)).toBe(false)
    expect(darkFromCache(base + 12 * H, c)).toBe(false)
    expect(darkFromCache(maghrib, c)).toBe(true)
  })
  it('keş köhnədirsə (bir neçə gün sonra) — sutkanın eyni saatları', () => {
    expect(darkFromCache(base + 3 * DAY + 12 * H, c)).toBe(false)
    expect(darkFromCache(base + 3 * DAY + 20 * H, c)).toBe(true)
    expect(darkFromCache(base - DAY + 12 * H, c)).toBe(false)
  })
  it('pozuq keş — null', () => {
    expect(darkFromCache(base, null)).toBe(null)
    expect(darkFromCache(base, { s: 1 })).toBe(null)
    expect(darkFromCache(base, { f: maghrib, m: fajr })).toBe(null)
    expect(darkFromCache(base, { f: 0, m: 2 * DAY })).toBe(null)
  })

  // index.html-in tema skripti — saxta localStorage/document ilə işə salınır
  const html = readFileSync('index.html', 'utf8')
  const src = /<script>(\(function\(\)\{var t=null[\s\S]*?\}\)\(\);)/.exec(html)?.[1]
  const runInline = (now, store, sysDark = false) => {
    const attrs = {}
    const ctx = {
      localStorage: { getItem: (k) => (k in store ? store[k] : null) },
      window: { matchMedia: () => ({ matches: sysDark }) },
      document: {
        documentElement: { setAttribute: (k, v) => { attrs[k] = v } },
        querySelector: () => null,
      },
      Date: { now: () => now },
      JSON,
    }
    vm.runInNewContext(src, ctx)
    return attrs['data-theme'] === 'dark'
  }
  it('index.html skripti tapılır', () => { expect(src).toBeTruthy() })
  it('skript keşlə eyni qərarı verir', () => {
    const store = { muslim_cc_ptheme: JSON.stringify(c), muslim_cc_theme: 'light' }
    for (let h = 0; h < 72; h += 0.5) {
      const now = base + h * H
      expect(runInline(now, store), `saat ${h}`).toBe(darkFromCache(now, c))
    }
  })
  it('rejim açıq, şəhər yoxdur ({ s: 1 }) — sistem rejimi (saxlanmış seçim yox)', () => {
    const store = { muslim_cc_ptheme: '{"s":1}', muslim_cc_theme: 'dark' }
    expect(runInline(base, store, false)).toBe(false)
    expect(runInline(base, store, true)).toBe(true)
  })
  it('rejim bağlı — əvvəlki qayda (saxlanmış seçim, yoxdursa sistem)', () => {
    expect(runInline(base, { muslim_cc_theme: 'dark' })).toBe(true)
    expect(runInline(base, { muslim_cc_theme: 'light' }, true)).toBe(false)
    expect(runInline(base, {}, true)).toBe(true)
  })
})

describe('prayerTimesFor', () => {
  const baku = { lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku', method: 99 }
  it('Bakı: namaz səhifəsinin hesabı ilə eyni (Əbu Bəkr metodu)', () => {
    const now = base + 12 * H
    const t = prayerTimesFor(baku, now)
    const ref = computeTimes({ year: 2026, month: 11, day: 28 }, baku.lat, baku.lng, 4, CALC_METHODS.abubakr)
    const hhmm = (ms) => new Date(ms + 4 * H).toISOString().slice(11, 16)
    expect(hhmm(t.fajr)).toBe(ref.fajr)
    expect(hhmm(t.maghrib)).toBe(ref.maghrib)
    expect(t.nextFajr - t.fajr).toBeGreaterThan(DAY - 10 * 60000)
    expect(t.nextFajr - t.fajr).toBeLessThan(DAY + 10 * 60000)
  })
  it('yerli gecəyarısından sonra (UTC hələ dünəndir) — yerli günün vaxtları', () => {
    const now = base + 30 * 60000           // Bakı 00:30, UTC isə 27-si 20:30
    const t = prayerTimesFor(baku, now)
    expect(t.fajr).toBeGreaterThan(now)
    expect(decidePrayerTheme(now, t).theme).toBe('dark')
    expect(decidePrayerTheme(now, t).next).toBe(t.fajr)
  })
  it('yer yoxdursa — null', () => {
    expect(prayerTimesFor(null)).toBe(null)
    expect(prayerTimesFor({ lat: 'x', lng: 1 })).toBe(null)
  })
})
