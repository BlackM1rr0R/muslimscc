// Hədislərin təkrarsızlaşdırılması (src/utils/uniqueHadiths.js)
import { describe, it, expect } from 'vitest'
import { HADITHS } from '../../src/data/hadiths.js'
import { uniqueHadithsFor, hadithAliases, normArabic, normText } from '../../src/utils/uniqueHadiths.js'

const LANGS = ['az', 'en', 'ru', 'tr']

describe('təkrarsız hədislər', () => {
  it('bütün dillərdə EYNİ id-lər qalır (sevimlilər dil dəyişəndə itmir)', () => {
    const ids = LANGS.map(l => uniqueHadithsFor(HADITHS, l).map(h => h.id).join(','))
    for (const x of ids) expect(x).toBe(ids[0])
  })

  it('təkrar yoxdur: eyni ərəb mətni iki dəfə görünmür', () => {
    const list = uniqueHadithsFor(HADITHS, 'az').filter(h => h.ar)
    const seen = new Map()
    for (const h of list) {
      const k = normArabic(h.ar)
      expect(seen.has(k), `#${h.id} təkrarlayır #${seen.get(k)}`).toBe(false)
      seen.set(k, h.id)
    }
  })

  it('hər atılan surət saxlanılan bir hədisə yönləndirilir', () => {
    const keep = new Set(uniqueHadithsFor(HADITHS, 'az').map(h => h.id))
    for (const [dup, kept] of hadithAliases(HADITHS)) {
      expect(keep.has(dup)).toBe(false)
      expect(keep.has(kept), `${dup} → ${kept}`).toBe(true)
    }
  })

  it('hər saxlanılan hədisin 4 dildə mətni var', () => {
    for (const l of LANGS) {
      for (const h of uniqueHadithsFor(HADITHS, l)) {
        expect(String(h.text || '').trim().length, `#${h.id} (${l}) boşdur`).toBeGreaterThan(0)
      }
    }
  })
})

describe('normallaşdırma', () => {
  it('ərəb: hərəkələr, əlif formaları və öndəki təkid ədatı nəzərə alınmır', () => {
    // "إِنَّمَا" yalnız 2-dən çox sözlü mətndə atılır (uniqueHadiths.js → LEAD_PARTICLES)
    expect(normArabic('إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ')).toBe(normArabic('الصبر عند الصدمة'))
    expect(normArabic('أَحَبُّ')).toBe(normArabic('احب'))
  })
  it('mətn: böyük/kiçik hərf, diakritika və durğu nəzərə alınmır', () => {
    expect(normText('Səbr, İman!')).toBe(normText('sebr iman'))
  })
})
