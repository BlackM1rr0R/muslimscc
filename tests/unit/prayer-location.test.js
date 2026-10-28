// Namaz yeri (src/utils/prayerLocation.js): axtarış, xüsusi (siyahıda olmayan)
// şəhər, köhnə saxlanma formatları, serverin normLoc-u ilə uyğunluq və
// mobil siyahı ilə eynilik.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

// Brauzer mühiti: localStorage + window hadisələri (node mühitində)
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)) },
  removeItem: (k) => { store.delete(k) },
}
const target = new EventTarget()
globalThis.window = { addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target), dispatchEvent: target.dispatchEvent.bind(target) }

const mod = await import('../../src/utils/prayerLocation.js')
const { PRAYER_CITIES, searchCities, foldText, getPrayerLocation, setPrayerCity, getRecentPlaces, nearestCity, subscribePrayerLocation } = mod
const require = createRequire(import.meta.url)
const { normLoc, DEFAULT_LOC } = require('../../server/prayer-utils.js')

beforeEach(() => store.clear())

describe('şəhər siyahısı', () => {
  it('Azərbaycan birinci, id-lər təkrarsız, AZ koordinatları ölkə daxilində', () => {
    const ids = PRAYER_CITIES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(PRAYER_CITIES[0].id).toBe('Baku')
    const az = PRAYER_CITIES.filter(c => c.country === 'AZ')
    expect(az.length).toBeGreaterThanOrEqual(70)
    const firstWorld = PRAYER_CITIES.findIndex(c => c.country !== 'AZ')
    expect(PRAYER_CITIES.slice(firstWorld).every(c => c.country !== 'AZ')).toBe(true)
    for (const c of az) {
      expect(c.tz, c.id).toBe('Asia/Baku')
      expect(c.lat > 38.3 && c.lat < 41.95 && c.lng > 44.7 && c.lng < 50.6, `${c.id} ölkə xaricində`).toBe(true)
    }
  })

  it('köhnə 20 şəhərin id-si və koordinatı qalıb', () => {
    const old = { Baku: [40.4093, 49.8671], Ganja: [40.6828, 46.3606], Istanbul: [41.0082, 28.9784], Mecca: [21.4225, 39.8262], 'Kuala Lumpur': [3.139, 101.6869], Sheki: [41.1919, 47.1706] }
    for (const [id, [lat, lng]] of Object.entries(old)) {
      const c = PRAYER_CITIES.find(x => x.id === id)
      expect(c, id).toBeTruthy()
      expect([c.lat, c.lng]).toEqual([lat, lng])
    }
  })

  it('tr adlarında "ə" yoxdur', () => {
    for (const c of PRAYER_CITIES) expect(c.label.tr, c.id).not.toMatch(/[əƏ]/)
  })

  it('mobil siyahı eyni id və koordinatlardadır', () => {
    const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
    const rows = (s) => [...s.matchAll(/\{ id:'([^']+)', country:'(..)', lat:([-\d.]+), lng:([-\d.]+)/g)].map(m => m.slice(1).join('|'))
    const mobile = rows(src('../../mobile/src/services/prayerLocation.js'))
    expect(mobile).toEqual(PRAYER_CITIES.map(c => `${c.id}|${c.country}|${c.lat}|${c.lng}`))
  })
})

describe('axtarış', () => {
  it('diakritikasız və 5 dildə tapır', () => {
    const first = (q) => searchCities(q)[0]?.id
    expect(first('seki')).toBe('Sheki')
    expect(first('gence')).toBe('Ganja')
    expect(first('Шеки')).toBe('Sheki')
    expect(first('شكي')).toBe('Sheki')
    expect(first('Bakü')).toBe('Baku')
    expect(first('xankendi')).toBe('Khankendi')
    expect(first('devechi')).toBe('Shabran')          // köhnə ad (alt)
    expect(first('ISMAYILLI')).toBe('Ismayilli')
    expect(searchCities('').length).toBe(PRAYER_CITIES.length)
    expect(searchCities('zzzz')).toEqual([])
  })

  it('foldText', () => {
    expect(foldText('Şəki')).toBe('seki')
    expect(foldText('  Ağcabədi ')).toBe('agcabedi')
    expect(foldText('İSMAYILLI')).toBe('ismayilli')
  })

  it('ən yaxın şəhər', () => {
    expect(nearestCity(41.2, 47.18).city.id).toBe('Sheki')
  })
})

describe('seçim və xüsusi şəhər', () => {
  it('siyahıdan seçim + son seçilənlər', () => {
    const cb = vi.fn()
    const off = subscribePrayerLocation(cb)
    setPrayerCity('Sheki')
    setPrayerCity('Quba')
    off()
    expect(cb).toHaveBeenCalledTimes(2)
    expect(getPrayerLocation()).toMatchObject({ id: 'Quba', tz: 'Asia/Baku', isDefault: false, isCustom: false })
    expect(getRecentPlaces().map(r => r.id)).toEqual(['Quba', 'Sheki'])
  })

  it('xüsusi yer: koordinat + tz, adı 5 dildə doldurulur', () => {
    setPrayerCity({ lat: 48.2082, lng: 16.3738, tz: 'Europe/Vienna', label: { az: 'Vyana', en: 'Vienna' }, country: 'at' })
    const loc = getPrayerLocation()
    expect(loc).toMatchObject({ id: 'custom', lat: 48.2082, lng: 16.3738, tz: 'Europe/Vienna', isCustom: true, country: 'AT', method: 13 })
    expect(loc.city).toEqual({ az: 'Vyana', en: 'Vienna', ru: 'Vienna', ar: 'Vienna', tr: 'Vienna' })
    expect(getRecentPlaces()[0].place.label.en).toBe('Vienna')
  })

  it('yararsız xüsusi yer nəzərə alınmır; siyahıdakı nöqtə şəhərə çevrilir', () => {
    setPrayerCity('Ganja')
    setPrayerCity({ lat: 200, lng: 0, name: 'X' })
    setPrayerCity({ lat: 1, lng: 1 })               // adsız
    expect(getPrayerLocation().id).toBe('Ganja')
    setPrayerCity({ lat: 41.1919, lng: 47.1706, name: 'Sheki' })
    expect(getPrayerLocation().id).toBe('Sheki')
  })

  it('köhnə saxlanma formatları', () => {
    store.set('muslim_cc_selected_city', '2')        // köhnə siyahının indeksi → İstanbul
    expect(getPrayerLocation().id).toBe('Istanbul')
    store.set('muslim_cc_selected_city', 'mosque')
    expect(getPrayerLocation().id).toBe('Baku')
    store.set('muslim_cc_selected_city', 'custom')   // JSON yoxdur → standart yer
    expect(getPrayerLocation().isDefault).toBe(true)
  })

  it('server normLoc xüsusi yerin push payload-unu olduğu kimi qəbul edir', () => {
    setPrayerCity({ lat: 48.2082, lng: 16.3738, tz: 'Europe/Vienna', label: { en: 'Vienna' } })
    const loc = getPrayerLocation()
    // src/firebase/messaging.js → locationPayload() ilə eyni forma
    const payload = { lat: loc.lat, lng: loc.lng, tz: loc.tz, method: loc.method, city: { ...loc.city } }
    const n = normLoc(payload)
    expect(n).toEqual({ lat: 48.2082, lng: 16.3738, tz: 'Europe/Vienna', method: 13, city: payload.city })
    expect(n).not.toBe(DEFAULT_LOC)
    // Brauzerin saat qurşağı ilə "Mənim yerim" də keçərlidir
    setPrayerCity({ lat: 40.1, lng: 45.9, label: { az: 'Mənim yerim' } })
    expect(normLoc({ ...getPrayerLocation(), city: getPrayerLocation().city }).tz).toBe(getPrayerLocation().tz)
  })
})
