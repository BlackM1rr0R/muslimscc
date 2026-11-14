import { describe, it, expect } from 'vitest'
import { HADITH_IDS } from '../../src/seo/hadithIds.js'
import { HADITHS } from '../../src/data/hadiths.js'
import { uniqueHadithsFor } from '../../src/utils/uniqueHadiths.js'
import { isNotHadith } from '../../src/utils/search.js'
import { detailMeta, hadithInfo, hadithGradeText } from '../../src/seo/detail.js'
import { pathFor, parsePath, DETAILS } from '../../src/seo/routes.js'

describe('/hadith/<id> səhifələri', () => {
  it('id siyahısı data ilə sinxrondur (dəyişibsə: node scripts/build-hadith-ids.mjs)', () => {
    const L = uniqueHadithsFor(HADITHS, 'az')
    const all = new Set((L.list || L).filter(h => !isNotHadith(h.source)).map(h => String(h.id)))
    for (const id of HADITH_IDS) expect(all.has(id), id).toBe(true)
    expect(new Set(HADITH_IDS.map(id => detailMeta('hadith', 'az', id).t)).size).toBe(HADITH_IDS.length)
    expect(HADITH_IDS.length).toBeGreaterThan(1100)
    expect(DETAILS.hadith.coreOnly).toBe(true)
  })
  it('hər hədisin 5 dildə başlığı, təsviri və mənbəyi var; yoxlanmayan id yoxdur', () => {
    for (const id of HADITH_IDS) for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
      const m = detailMeta('hadith', l, id)
      expect(m, `${id} ${l}`).toBeTruthy()
      expect(m.t.length).toBeGreaterThan(10)
      expect(m.d.length).toBeLessThanOrEqual(160)
      expect(hadithInfo(id, l).src).toMatch(/\d/)
    }
    expect(HADITH_IDS).not.toContain('12')   // "Buxari, Muvatta" — gizlədilib
  })
  it('URL: /hadith/8 ↔ parsePath; dərəcə mətni', () => {
    expect(pathFor('hadith', 'en', '8')).toBe('/en/hadith/8')
    expect(parsePath('/ru/hadith/8')).toMatchObject({ lang: 'ru', key: 'hadith', param: '8' })
    expect(parsePath('/hadith/12').known).toBe(false)
    expect(hadithGradeText(hadithInfo('8', 'az').grade, 'az')).toBe('Səhih (Buxari)')
  })
})
