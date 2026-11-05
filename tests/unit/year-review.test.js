// İllik icmal (utils/yearReview)
import { it, expect } from 'vitest'
import { yearReview } from '../../src/utils/yearReview.js'

const P = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
function snapWith(days) {
  const stats = {}
  for (const [d, n] of Object.entries(days)) for (let i = 0; i < n; i++) stats[`${d}_${P[i]}`] = true
  return { stats, tracker: {}, status: {} }
}

it('namaz, tam günlər, seriya (üzrlü gün qırmır), Quran və sədəqə yalnız dövr daxilində', () => {
  const snap = snapWith({ '2026-01-01': 5, '2026-01-02': 5, '2026-01-04': 5, '2026-01-05': 3, '2025-12-31': 5 })
  const periods = [{ id: 'h', type: 'hayd', start: '2026-01-03', end: '2026-01-03' }]
  const r = yearReview({
    snap, periods,
    quranDates: ['2026-01-02', '2026-01-02', '2026-01-06', '2025-12-30'],
    charity: [{ date: '2026-01-05', amount: '5' }, { date: '2025-11-01' }, null],
    from: '2026-01-01', to: '2026-01-06',
  })
  expect(r).toEqual({
    days: 6, prayers: 18, fullDays: 3, excusedDays: 1,
    bestStreak: 3,                 // 1, 2, (3 üzrlü), 4 — seriya qırılmır
    quranDays: 2, charity: 1, activeDays: 5,
  })
})

it('boş məlumat — sıfırlar', () => {
  const r = yearReview({ snap: { stats: {}, tracker: {}, status: {} }, from: '2026-03-01', to: '2026-03-03' })
  expect(r).toMatchObject({ days: 3, prayers: 0, fullDays: 0, bestStreak: 0, activeDays: 0 })
})
