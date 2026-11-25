// "Günün xatırlatmaları" — dil başına hovuz modulları (vite.config.js → "virtual:daily-pools/<dil>",
// utils/dailyPools.js → localizeDailyPools). Brauzerə yalnız cari dilin tərcüməsi gedir; zolağın,
// "Bu gün" panelinin və story dairələrinin göstərdiyi mətn ƏVVƏLKİ 4 dilli hovuzla eyni qalmalıdır.
import { describe, it, expect, beforeAll } from 'vitest'
import React from 'react'
import { QUOTES } from '../../src/data/quotes.js'
import { DUAS_DATA } from '../../src/data/duas.js'
import { buildDailyPools, localizeDailyPools, POOL_LANGS } from '../../src/utils/dailyPools.js'
import { pickUi, setUiDict } from '../../src/utils/uiText.js'
import { refsFromPool } from '../../src/utils/focusStore.js'

// vitest konfiqində React plagini yoxdur — JSX klassik rejimdə React.createElement-ə çevrilir
globalThis.React = React
let buildDailyItems
beforeAll(async () => { ({ buildDailyItems } = await import('../../src/components/DailyReminderBar.jsx')) })

const FULL = buildDailyPools(QUOTES, DUAS_DATA)
const pick = (pool, day, off = 0) => (pool.length ? pool[(((day + off) % pool.length) + pool.length) % pool.length] : null)
// 2026-11-25-dək (bir modulda 4 dil) buildDailyItems-in mətn qaydası
function legacy(lang, day) {
  const q = pick(FULL.AYAH_POOL, day), h = pick(FULL.HADITH_POOL, day, 1), d = pick(FULL.DUA_POOL, day, 2)
  const t = (x) => (lang === 'ar' ? '' : x)
  return [
    { type: 'ayah', ar: q.ar, text: t(pickUi(q.text, lang, 'en')), source: q.source },
    { type: 'hadith', ar: h.ar, text: t(pickUi(h.text, lang, 'en')), source: h.source },
    { type: 'dua', ar: d.ar, text: t(pickUi(d, lang, 'en')), source: d.source },
  ]
}
const first3 = (items) => items.slice(0, 3).map(({ type, ar, text, source }) => ({ type, ar, text, source }))

describe('günün xatırlatmaları — dil başına hovuzlar', () => {
  it('hər dil modulu: eyni sıra və say, yalnız ar + mənbə + həmin dilin tərcüməsi', () => {
    expect(POOL_LANGS).toEqual(['az', 'en', 'ru', 'tr', 'ar'])
    for (const lang of POOL_LANGS) {
      const p = localizeDailyPools(FULL, lang)
      for (const k of ['AYAH_POOL', 'HADITH_POOL', 'DUA_POOL']) {
        expect(p[k].length).toBe(FULL[k].length)
        expect(p[k].map(x => x.source)).toEqual(FULL[k].map(x => x.source))
        expect(p[k].map(x => x.ar)).toEqual(FULL[k].map(x => x.ar))
        for (const x of p[k]) expect(Object.keys(x).sort()).toEqual(lang === 'ar' ? ['ar', 'source'] : ['ar', 'source', 't'])
      }
    }
  })

  it('cari dilin modulu 4 dilli hovuzun yarısından kiçikdir (ana səhifənin yükü)', () => {
    const full = JSON.stringify(FULL).length
    for (const lang of POOL_LANGS) expect(JSON.stringify(localizeDailyPools(FULL, lang)).length).toBeLessThan(full / 2)
  })

  it('buildDailyItems: 5 dildə 400 gün ərzində əvvəlki seçim və mətnlə eynidir', () => {
    for (const lang of POOL_LANGS) {
      const pools = localizeDailyPools(FULL, lang)
      for (let day = 20000; day < 20400; day++) {
        expect(first3(buildDailyItems(lang, day, null, pools))).toEqual(legacy(lang, day))
      }
    }
  })

  it('əlavə dil (interfeys "en" + lüğət): tərcümə əvvəlki pickUi ilə eyni yolla gəlir', () => {
    const day = 20011
    const q = pick(FULL.AYAH_POOL, day)
    setUiDict('xx', { [q.text.en]: 'LÜĞƏTDƏN' })
    try {
      const items = buildDailyItems('en', day, null, localizeDailyPools(FULL, 'en'))
      expect(items[0].text).toBe('LÜĞƏTDƏN')
      expect(first3(items)).toEqual(legacy('en', day))
    } finally {
      setUiDict(null, null)
    }
  })

  it('hovuz yüklənməyibsə (chunk xətası) — yalnız günün zikri, çökmə yoxdur', () => {
    expect(buildDailyItems('az', 20000, null, null).map(i => i.type)).toEqual(['dhikr'])
  })

  it('/focus ayə siyahısı ərəbcə modulda da eynidir (yalnız mənbələr oxunur)', () => {
    expect(refsFromPool(localizeDailyPools(FULL, 'ar').AYAH_POOL)).toEqual(refsFromPool(FULL.AYAH_POOL))
  })
})
