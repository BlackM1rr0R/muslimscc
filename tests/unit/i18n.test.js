// Dil tamlığı: brend, naviqasiya və marşrutların hər mətni 5 dildə olmalıdır.
// (Məzmunun dil təmizliyi — scripts/check-lang.mjs; burada struktur yoxlanır.)
import { describe, it, expect, vi } from 'vitest'
import { BRAND, DEFAULT_PRAYER_LOCATION, LANGS, tr, filled, siteJsonLd } from '../../src/config/brand.js'
import { NAV_GROUPS, navLabel } from '../../src/data/navigation.js'
import { PRAYER_CITIES } from '../../src/utils/prayerLocation.js'

/** Obyektdə 5 dilin hamısı dolu olmalıdır. */
function expectAllLangs(obj, where) {
  for (const l of LANGS) expect(filled(obj?.[l]), `${where}: "${l}" yoxdur`).toBe(true)
}

describe('brand.js', () => {
  it('bütün çoxdilli sahələr 5 dildədir', () => {
    for (const k of ['name', 'short', 'tagline', 'description', 'aiName', 'aiDisclaimer']) expectAllLangs(BRAND[k], `BRAND.${k}`)
    expectAllLangs(DEFAULT_PRAYER_LOCATION.city, 'DEFAULT_PRAYER_LOCATION.city')
  })

  it('ad Muslims.cc-dir, Qaraçuxur izi yoxdur', () => {
    const all = JSON.stringify(BRAND)
    expect(BRAND.name.az).toBe('Muslims.cc')
    expect(all).not.toMatch(/qara[cç]uxur|garachukhur|карачух|karaçuh|قاراچوخور/i)
  })

  it('tr() əskik dili başqa dillə SUSQUN əvəz etmir — xəbərdarlıq yazır', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    import.meta.env.DEV = true
    expect(tr({ az: 'salam', en: 'hello' }, 'az')).toBe('salam')
    expect(tr({ az: 'yalnız az' }, 'ru')).toBe('yalnız az')   // istehsalda boş qalmasın
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[i18n] "ru"'))
    warn.mockRestore()
  })

  it('siteJsonLd hər dildə düzgün WebSite + Organization verir', () => {
    for (const l of LANGS) {
      const d = siteJsonLd(l)
      const types = d['@graph'].map(n => n['@type'])
      expect(types).toEqual(['WebSite', 'Organization'])
      expect(d['@graph'][0].inLanguage).toBe(l)
    }
  })
})

describe('naviqasiya', () => {
  it('hər qrup və bənd 5 dildədir', () => {
    for (const g of NAV_GROUPS) {
      expectAllLangs(g.label, `qrup ${g.key}`)
      for (const it of g.items) expectAllLangs(it.label, `bənd ${it.key}`)
    }
  })

  it('"Məscid haqqında" bəndi yoxdur, "Əsas" qrupu var', () => {
    const keys = NAV_GROUPS.flatMap(g => g.items.map(i => i.key))
    expect(keys).not.toContain('mosque')
    expect(NAV_GROUPS[0].key).toBe('main')
    expect(navLabel('prayer', 'az')).toBe('Namaz vaxtları')
  })

  it('bir dildə iki bəndin adı eyni deyil', () => {
    for (const l of LANGS) {
      const names = NAV_GROUPS.flatMap(g => g.items.map(i => i.label[l]))
      expect(new Set(names).size, `${l}: təkrar ad`).toBe(names.length)
    }
  })
})

describe('namaz şəhərləri', () => {
  it('hər şəhərin adı 5 dildə, koordinatı və saat qurşağı düzgündür', () => {
    expect(PRAYER_CITIES.length).toBeGreaterThan(10)
    for (const c of PRAYER_CITIES) {
      expectAllLangs(c.label, `şəhər ${c.id}`)
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(c.lng)).toBeLessThanOrEqual(180)
      expect(() => new Intl.DateTimeFormat('en', { timeZone: c.tz })).not.toThrow()
    }
  })
})
