import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { HADITH_IDS } from '../../src/seo/hadithIds.js'
import { HADITHS } from '../../src/data/hadiths.js'
import { gradeOf } from '../../src/utils/hadithGrade.js'

const require = createRequire(import.meta.url)
const dh = require('../../server/daily-hadith.js')
const { validPrefs } = require('../../server/push.js')

describe('Günün hədisi (server/daily-hadith.js)', () => {
  it('siyahı: yalnız səhih, saytda səhifəsi olan, 5 dildə mətn', () => {
    expect(dh.LIST.length).toBeGreaterThan(300)
    const ids = new Set(HADITH_IDS.map(String))
    const az = new Map(HADITHS.az.map(h => [String(h.id), h]))
    for (const h of dh.LIST) {
      expect(ids.has(String(h.id))).toBe(true)
      expect(gradeOf(az.get(String(h.id))).g).toBe('s')
      for (const l of ['az', 'en', 'ru', 'tr', 'ar']) { expect(h.t[l]).toBeTruthy(); expect(h.src[l]).toBeTruthy() }
      expect(h.t.az).toBe(az.get(String(h.id)).text)
    }
  })
  it('tarixə görə deterministik, ardıcıl günlər fərqli', () => {
    const a = dh.hadithForDate('2026-11-15'), b = dh.hadithForDate('2026-11-15'), c = dh.hadithForDate('2026-11-16')
    expect(a.id).toBe(b.id)
    expect(a.id).not.toBe(c.id)
  })
  it('bildiriş: başlıq + mənbə, keçid dilə görə; əlavə dil → ingiliscə', () => {
    const h = dh.LIST[0]
    const az = dh.buildHadithMessage('az', h)
    expect(az.title).toContain('Günün hədisi')
    expect(az.link).toBe(`/hadith/${h.id}`)
    expect(dh.buildHadithMessage('ru', h).link).toBe(`/ru/hadith/${h.id}`)
    const de = dh.buildHadithMessage('de', h)
    expect(de.link).toBe(`/en/hadith/${h.id}`)
    expect(de.body.length).toBeLessThanOrEqual(180)
  })
  it('prefs.daily.hadith qəbul olunur, yanlış tip rədd', () => {
    expect(validPrefs({ daily: { ayah: false, hadith: true, hour: 8 } })).toEqual({ daily: { ayah: false, hadith: true, hour: 8 } })
    expect(validPrefs({ daily: { hadith: 'yes' } })).toBeUndefined()
  })
})
