// Hərəkətli sitat kartı — zaman xətti (utils/quoteMotion → planTimeline)
import { describe, it, expect } from 'vitest'
import { planTimeline, recitationUrl } from '../../src/utils/quoteMotion.js'

const ITEMS = [
  { kind: 'kicker', len: 3 },
  { kind: 'ornament', len: 0 },
  { kind: 'ar', len: 40 },
  { kind: 'ar', len: 20 },
  { kind: 'tr', len: 50 },
  { kind: 'tr', len: 30 },
  { kind: 'divider', len: 0 },
  { kind: 'ref', len: 12 },
  { kind: 'watermark', len: 0 },
]

describe('planTimeline', () => {
  it('səssiz: elementlər ardıcıl açılır, sonda oxumaq üçün vaxt qalır', () => {
    const { starts, total } = planTimeline(ITEMS)
    expect(starts).toHaveLength(ITEMS.length)
    for (let i = 1; i < starts.length; i++) expect(starts[i]).toBeGreaterThanOrEqual(starts[i - 1])
    // son element açıldıqdan sonra ən azı 2.5 san oxu + sönmə
    expect(total - starts.at(-1)).toBeGreaterThan(3)
    expect(total).toBeLessThanOrEqual(60)
  })

  it('qiraətli: ərəbcə sətirlər səsin müddətinə simvol sayına görə paylanır', () => {
    const audioDur = 12
    const { starts, total } = planTimeline(ITEMS, { audioDur, audioAt: 1 })
    // 1-ci sətir səsin əvvəlində, 2-ci sətir 40/60 hissədə (bir az qabaq)
    expect(starts[2]).toBeLessThan(1.5)
    expect(starts[3]).toBeCloseTo(1 + (40 / 60) * audioDur - 0.25, 5)
    // tərcümə qiraətin yarısından tez başlamır
    expect(starts[4]).toBeGreaterThanOrEqual(1 + audioDur * 0.45)
    // video qiraət bitəndən sonra da davam edir
    expect(total).toBeGreaterThanOrEqual(1 + audioDur + 1.6)
  })

  it('uzun qiraət də 60 saniyə ilə məhdudlaşır', () => {
    expect(planTimeline(ITEMS, { audioDur: 300 }).total).toBe(60)
  })

  it('boş siyahı xəta vermir', () => {
    const { starts, total } = planTimeline([])
    expect(starts).toEqual([])
    expect(total).toBeGreaterThan(0)
  })
})

describe('recitationUrl', () => {
  it('surə və ayə 3 rəqəmlə', () => {
    expect(recitationUrl(2, 255)).toBe('https://verses.quran.com/Alafasy/mp3/002255.mp3')
    expect(recitationUrl('1', '1')).toBe('https://verses.quran.com/Alafasy/mp3/001001.mp3')
  })
})
