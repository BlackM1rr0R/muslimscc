// Ailə lövhəsinin xülasə rəqəmləri (src/utils/familyStats.js) — klientdə hesablanır, server siyahısı ilə eyni sahələr
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { computeFamilyStats, sharePayload, STAT_FIELDS, lastWeek } from '../../src/utils/familyStats.js'
import { applyRead, emptyLife, serializeLife, LIFE_KEY } from '../../src/utils/quranLife.js'

const require = createRequire(import.meta.url)
const store = (o) => { const m = new Map(Object.entries(o)); return { getItem: (k) => m.get(k) ?? null } }
const now = new Date(2026, 10, 17, 10)

describe('computeFamilyStats', () => {
  it('sahələr serverin ağ siyahısı ilə eynidir', () => {
    expect(STAT_FIELDS).toEqual(require('../../server/family.js').STAT_FIELDS)
  })

  it('boş yaddaş → sıfırlar', () => {
    expect(computeFamilyStats(store({}), now)).toEqual({ quranAyahsTotal: 0, quranDaysWeek: 0, storybooksRead: 0, prayerStarsWeek: 0, hifzAyahs: 0, dhikrWeek: 0 })
  })

  it('son 7 gün sayılır, köhnələr yox', () => {
    expect([...lastWeek(now)]).toContain('2026-11-11')
    expect([...lastWeek(now)]).not.toContain('2026-11-10')
    const life = serializeLife(applyRead(emptyLife(), [0, 1, 2, 3], '2026-11-17').st)
    const s = store({
      [LIFE_KEY]: JSON.stringify(life),
      quran_stats: JSON.stringify({ dates: ['2026-11-17', '2026-11-01'] }),
      daily_tracker: JSON.stringify({ '2026-11-16': { quran: true }, '2026-11-15': { quran: false } }),
      muslim_cc_storybooks: JSON.stringify({ 'b-1': 3, 'b-2': 0, __last: 'b-1' }),
      muslim_cc_prayer_stats: JSON.stringify({ '2026-11-17_Fajr': true, '2026-11-17_Dhuhr': true, '2026-11-02_Asr': true, '2026-11-16_Isha': false }),
      hifz_srs: JSON.stringify({ items: { '1:1': {}, '1:2': {} } }),
      dhikr_daily_v1: JSON.stringify({ '2026-11-17': 33, '2026-11-12': 100, '2026-10-01': 999 }),
    })
    expect(computeFamilyStats(s, now)).toEqual({ quranAyahsTotal: 4, quranDaysWeek: 2, storybooksRead: 2, prayerStarsWeek: 2, hifzAyahs: 2, dhikrWeek: 133 })
  })

  it('pozuq dəyərlər xəta atmır', () => {
    const s = store({ quran_stats: '{', hifz_srs: 'null', dhikr_daily_v1: '{"2026-11-17":"abc"}', muslim_cc_storybooks: '[]' })
    expect(computeFamilyStats(s, now).dhikrWeek).toBe(0)
  })

  it('sharePayload yalnız seçilmiş, tanınan sahələri göndərir', () => {
    expect(sharePayload(['dhikrWeek', 'evil'], { dhikrWeek: 5, hifzAyahs: 9 })).toEqual({ fields: ['dhikrWeek'], stats: { dhikrWeek: 5 } })
  })
})
