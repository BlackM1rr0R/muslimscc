import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { SOLAR_ECLIPSES } from '../../src/data/solarEclipses.js'
import { LUNAR_ECLIPSES } from '../../src/data/lunarEclipses.js'
import { localCircumstances } from '../../src/utils/solarEclipse.js'
const require = createRequire(import.meta.url)
const ecl = require('../../server/eclipse.js')
const lib = require('../../server/eclipse-lib.js')

const BAKU = { lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku' }
const SYDNEY = { lat: -33.87, lng: 151.21, tz: 'Australia/Sydney' }

describe('Tutulma xəbərdarlığı (server)', () => {
  it('server kitabxanası src ilə sinxrondur (yenidən yığılmalıdırsa — node scripts/build-server-eclipse.mjs)', () => {
    expect(lib.SOLAR_ECLIPSES).toEqual(SOLAR_ECLIPSES)
    expect(lib.LUNAR_ECLIPSES).toEqual(LUNAR_ECLIPSES)
    const s = SOLAR_ECLIPSES.find(x => x.d === '2027-08-02')
    expect(lib.localCircumstances(s.e, BAKU.lat, BAKU.lng)).toEqual(localCircumstances(s.e, BAKU.lat, BAKU.lng))
  })
  it('2027-08-01 axşamı Bakıya: sabah Günəş tutulması, ~27% örtülür', () => {
    const now = Date.parse('2027-08-01T16:00:00Z')
    const list = ecl.eclipsesForTomorrow('2027-08-01', BAKU, now)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ type: 'solar', kind: 'P' })
    expect(list[0].pct).toBeGreaterThan(20)
    const msg = ecl.buildEclipseMessage('az', list[0], '2027-08-02')
    expect(msg.notification.title).toContain('Günəş tutulması')
    expect(msg.notification.body).toContain('qoruyucu eynəksiz')
    expect(msg.data.url).toBe('/learn/kusuf-prayer')
    expect(ecl.buildEclipseMessage('en', list[0], '2027-08-02').data.url).toBe('/en/learn/kusuf-prayer')
  })
  it('görünməyən yerə göndərilmir; tutulmasız gün — boş', () => {
    expect(ecl.eclipsesForTomorrow('2027-08-01', SYDNEY, Date.parse('2027-08-01T08:00:00Z'))).toHaveLength(0)
    expect(ecl.eclipsesForTomorrow('2027-05-10', BAKU, Date.parse('2027-05-10T16:00:00Z'))).toHaveLength(0)
  })
  it('Ay tutulması 2028-12-31 Bakıdan görünür — əvvəlki axşam xəbər', () => {
    const now = Date.parse('2028-12-30T16:00:00Z')
    const list = ecl.eclipsesForTomorrow('2028-12-30', BAKU, now)
    expect(list.some(x => x.type === 'lunar' && x.kind === 'T')).toBe(true)
  })
  it('seçim yalnız açıq-aydın true olanda', () => {
    expect(ecl.normEclipse(true)).toBe(true)
    expect(ecl.normEclipse(undefined)).toBe(false)
    expect(ecl.normEclipse('true')).toBe(false)
  })
})
