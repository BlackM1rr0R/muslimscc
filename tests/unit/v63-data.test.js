import { describe, it, expect } from 'vitest'
import { shortMeaning } from '../../src/utils/namesMatch'
import { NARRATORS } from '../../src/data/narratorCounts'
import { SAHABA, slugOf } from '../../src/data/sahaba'
import { surahCityData } from '../../src/utils/surahCity'

describe('v6.3 məlumatları', () => {
  it('ad mənası: mötərizədəki izah götürülür', () => {
    expect(shortMeaning('Əhəd (Yeganə)')).toBe('Yeganə')
    expect(shortMeaning('Əla (Ən Uca — hər şeydən yuxarı olan)')).toBe('Ən Uca')
    expect(shortMeaning('The Unique')).toBe('The Unique')
  })
  it('rəvayət sayları: 9 səhabə, azalan sıra, mənbədəki rəqəmlər', () => {
    expect(NARRATORS.map(n => n.count)).toEqual([5374, 2630, 2286, 2210, 1660, 1540, 1170, 848, 700])
    const slugs = new Set(SAHABA.map(slugOf))
    for (const n of NARRATORS) if (n.slug) expect(slugs.has(n.slug), n.slug).toBe(true)
  })
  it('surələr şəhəri: 114 bina, nazil olma sırası 1..114 (təkrarsız)', () => {
    const d = surahCityData()
    expect(d.length).toBe(114)
    expect(new Set(d.map(x => x.order)).size).toBe(114)
    expect(d[1]).toMatchObject({ n: 2, ayahs: 286, madani: true })
    expect(d[95]).toMatchObject({ n: 96, order: 1, madani: false })
  })
})
