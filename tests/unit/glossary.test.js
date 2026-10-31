// İslami söz lüğəti — məlumatın bütövlüyü (src/data/glossary.js + kateqoriya faylları)
import { describe, it, expect } from 'vitest'
import { GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_CATS, glossaryId } from '../../src/data/glossary.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
// İstifadəçinin sadaladığı dərslər (bəziləri hələ yazılır — səhifə yalnız mövcud olanı göstərir)
const KNOWN_LESSONS = new Set(['usul-ath-thalatha', 'al-qawaid-al-arba', 'nawaqid-al-islam', 'kitab-at-tawhid', 'ghusl', 'tayammum', 'istikhara', 'eid-prayer', 'kusuf-prayer', 'istisqa-prayer', 'adhkar-after-salah', 'travel-prayer', 'sunnah-fasts', 'dhul-hijjah-ten', 'udhiyah', 'aqiqah', 'kaffarah-fidyah', 'nikah', 'hijab', 'ruqyah', 'sick-fiqh', 'wasiyyah', 'janazah', 'tawbah', 'adab-al-mufrad', 'birr-al-walidayn', 'muhasabah', 'mustalah', 'bidah', 'hilyat-talib-al-ilm', 'doubts-youth', 'fiqh-faq', 'intro-to-islam', 'new-muslim'])

describe('İslami lüğət', () => {
  it('250-dən çox termin; əvvəlki 107 termin başda qalır (axtarış indeksi)', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(250)
    expect(GLOSSARY[0].translit).toBe('Tawhid')
    expect(GLOSSARY[106].translit).toBe('Mubah')
  })

  it('id, termin və transliterasiya təkrarlanmır', () => {
    expect(new Set(GLOSSARY.map(x => x.id)).size).toBe(GLOSSARY.length)
    expect(new Set(GLOSSARY.map(x => x.term)).size).toBe(GLOSSARY.length)
    expect(glossaryId("Al-Wala' wal-Bara'")).toBe('al-wala-wal-bara')
  })

  it('hər terminin 5 dildə tərifi, ərəbcə yazılışı və kateqoriyası var', () => {
    for (const x of GLOSSARY) {
      expect(GLOSSARY_CATS, x.id).toContain(x.cat)
      expect(/[؀-ۿ]/.test(x.ar), x.id).toBe(true)
      expect(/^[A-Za-z]/.test(x.translit), x.id).toBe(true)
      for (const l of LANGS) expect(String(x.def[l] || '').trim().length, `${x.id}.${l}`).toBeGreaterThan(10)
      expect(/[ə]/i.test(x.def.tr), `${x.id}.tr`).toBe(false)
      expect(/[A-Za-z]/.test(x.def.ru), `${x.id}.ru`).toBe(false)
    }
  })

  it('əlaqəli terminlər mövcuddur, özünə istinad yoxdur; dərs keçidləri məlum dərslərdir', () => {
    for (const x of GLOSSARY) {
      for (const r of x.rel || []) {
        expect(GLOSSARY_BY_ID.has(r), `${x.id} → ${r}`).toBe(true)
        expect(r).not.toBe(x.id)
      }
      if (x.lesson) expect(KNOWN_LESSONS.has(x.lesson), `${x.id} → ${x.lesson}`).toBe(true)
    }
  })

  it('hər kateqoriyada termin var', () => {
    for (const c of GLOSSARY_CATS) expect(GLOSSARY.filter(x => x.cat === c).length, c).toBeGreaterThan(10)
  })
})
