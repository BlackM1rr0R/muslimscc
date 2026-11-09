// Admin icmal paneli — saf hesab (src/utils/adminOverview.js)
import { describe, it, expect } from 'vitest'
import {
  utcDayKeys, rangeFor, pct, trafficKpis, withPrev, pageRows, countByDay, feedbackStats,
  subscriberStats, notificationStats, errorStats, buildFeed, insightParts,
} from '../../src/utils/adminOverview.js'

const NOW = Date.parse('2026-11-09T15:00:00Z')
const series = (from, vals) => vals.map((v, i) => ({ day: utcDayKeys(from, vals.length)[i], views: v, visitors: Math.round(v / 2) }))

describe('günlər', () => {
  it('utcDayKeys və rangeFor', () => {
    expect(utcDayKeys('2026-11-02', 3)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
    expect(rangeFor(7, NOW)).toEqual({ from: '2026-11-03', to: '2026-11-09' })
  })
  it('pct: sıfıra bölmə → null', () => {
    expect(pct(12, 10)).toBeCloseTo(20)
    expect(pct(5, 0)).toBeNull()
  })
})

describe('trafficKpis', () => {
  it('bu gün / dünən; 7 gün vs əvvəlki 7 gün prev dövrdən', () => {
    const a = { series: series('2026-11-09', [10, 20, 30, 40, 50, 60, 70]), prev: { series: series('2026-11-02', [2, 2, 2, 2, 2, 2, 2]) } }
    const k = trafficKpis(a)
    expect(k.todayViews).toBe(70)
    expect(k.ydayViews).toBe(60)
    expect(k.visitors7).toBe(5 + 10 + 15 + 20 + 25 + 30 + 35)
    expect(k.visitors7Prev).toBe(7)
    expect(k.sparkViews).toHaveLength(14)
  })
  it('boş və ya prev-siz cavab', () => {
    expect(trafficKpis(null)).toMatchObject({ todayViews: 0, ydayViews: null, visitors7: 0, visitors7Prev: null })
    const k = trafficKpis({ series: series('2026-11-09', [1, 2, 3]) })
    expect(k.visitors7Prev).toBeNull()
    expect(k.ydayViews).toBe(2)
  })
})

describe('ölçülər və səhifələr', () => {
  it('withPrev: əvvəlki dövr dəyərləri, artığı "(other)"', () => {
    const cur = [{ key: 'az', count: 50 }, { key: 'ru', count: 30 }, { key: 'en', count: 10 }, { key: 'tr', count: 5 }]
    const prev = [{ key: 'az', count: 40 }, { key: 'en', count: 20 }, { key: 'tr', count: 1 }]
    expect(withPrev(cur, prev, { limit: 3 })).toEqual([
      { key: 'az', value: 50, prev: 40 }, { key: 'ru', value: 30, prev: 0 }, { key: '(other)', value: 15, prev: 21 },
    ])
    expect(withPrev(cur.slice(0, 1), undefined)).toEqual([{ key: 'az', value: 50, prev: null }])
  })
  it('pageRows: pay, keçən dövr, trend', () => {
    const rows = pageRows({
      totals: { views: 100 }, pages: [{ key: '/quran', views: 60, visitors: 30 }, { key: '/', views: 40, visitors: 20 }],
      prev: { pages: [{ key: '/', views: 50 }] }, pageSeries: { '/quran': [10, 50] },
    })
    expect(rows[0]).toEqual({ key: '/quran', views: 60, visitors: 30, prev: 0, share: 0.6, trend: [10, 50] })
    expect(rows[1]).toMatchObject({ prev: 50, trend: [] })
  })
})

describe('bildirişlər, abunəlik, xətalar', () => {
  const fb = [
    { id: 'a', kind: 'text', status: 'new', createdAt: Date.parse('2026-11-09T10:00:00Z'), page: '/quran' },
    { id: 'b', kind: 'ai', status: 'new', createdAt: Date.parse('2026-11-08T10:00:00Z'), page: '/ai' },
    { id: 'c', kind: 'source', status: 'done', createdAt: Date.parse('2026-11-01T10:00:00Z') },
    { id: 'd', kind: 'ai', status: 'done', createdAt: Date.parse('2026-10-30T10:00:00Z') },
    { id: 'e', kind: 'text', status: 'new' },   // tarixsiz — sayılır, gün sırasına düşmür
  ]
  it('countByDay', () => {
    expect(countByDay(fb, ['2026-11-08', '2026-11-09'])).toEqual([1, 1])
  })
  it('feedbackStats: açıq, dövr və əvvəlki dövr', () => {
    const s = feedbackStats(fb, 7, NOW)
    expect(s).toMatchObject({ total: 5, open: 3, openAi: 1, reports: 1, reportsPrev: 1, ai: 1, aiPrev: 1, aiTotal: 2 })
    expect(s.aiDaily).toHaveLength(7)
  })
  it('subscriberStats', () => {
    const s = subscriberStats({ count: 12, fcm: 2, webpush: 10, webpushNew: [{ day: '2026-11-09', count: 2 }, { day: '2026-11-01', count: 3 }] }, 7, NOW)
    expect(s).toMatchObject({ count: 12, added: 2, addedPrev: 3, hasDaily: true })
    expect(subscriberStats({ count: 1 }, 7, NOW).hasDaily).toBe(false)
  })
  it('notificationStats: yalnız dövr daxili', () => {
    const h = [{ createdAt: NOW - 3600e3, sentTo: 9, failed: 1 }, { createdAt: NOW - 30 * 86400e3, sentTo: 100, failed: 0 }]
    expect(notificationStats(h, 7, NOW)).toEqual({ count: 1, sent: 9, failed: 1, rate: 90 })
    expect(notificationStats([], 7, NOW).rate).toBeNull()
  })
  it('errorStats', () => {
    expect(errorStats({ total: 7, items: [{ count: 5 }, { count: 2 }] })).toMatchObject({ kinds: 2, total: 7 })
    expect(errorStats(null)).toMatchObject({ kinds: 0, total: 0 })
  })
  it('buildFeed: yenidən köhnəyə, max', () => {
    const names = {
      ai: 'AI', feedback: (k) => `fb:${k}`, push: (t) => `push:${t}`, pushMeta: (s, f) => `${s}/${f}`,
      error: (m) => `err:${m}`, errorMeta: (n) => `${n}x`, subs: (n) => `subs:${n}`,
    }
    const feed = buildFeed({
      feedback: fb,
      history: [{ id: 'n1', title: 'Cümə', sentTo: 5, failed: 0, createdAt: Date.parse('2026-11-09T12:00:00Z') }],
      errors: { items: [{ kind: 'error', message: 'x is undefined', count: 3, last: '2026-11-09T14:00:00.000Z' }] },
      subs: { webpushNew: [{ day: '2026-11-07', count: 2 }] },
    }, names, { max: 5 })
    expect(feed.map(e => e.title)).toEqual(['err:x is undefined', 'push:Cümə', 'fb:text', 'AI', 'subs:2'])
    expect(feed[2]).toMatchObject({ open: true, tab: 'feedback', meta: '/quran' })
  })
  it('insightParts', () => {
    expect(insightParts({ todayViews: 0 }, null).traffic).toBe('none')
    expect(insightParts({ todayViews: 10, ydayViews: 0 }, null).traffic).toBe('first')
    expect(insightParts({ todayViews: 12, ydayViews: 10 }, { open: 2, openAi: 1 })).toMatchObject({ traffic: 'up', open: 2, aiOpen: 1 })
    expect(insightParts({ todayViews: 100, ydayViews: 100.5 }, null).traffic).toBe('same')
  })
})
