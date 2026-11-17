// Ömürlük dua bağçası (utils/duaGardenLife): gündəlikdən çiçəklər, təkrarsızlıq, silinən dua
// qalır, illər üzrə pillələr
import { describe, it, expect } from 'vitest'
import { syncFromJournal, syncGarden, readGarden, sanitizeGarden, terraces, seasonOf, GARDEN_KEY } from '../../src/utils/duaGardenLife.js'

const store = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }
}

describe('dua bağçası', () => {
  it('yalnız qəbul olunan dualar çiçək açır; kateqoriya indeksi; tarix — qəbul günü', () => {
    const { garden, added } = syncFromJournal([
      { id: 'a', text: 'x', category: 'family', date: '2025-01-02', answered: true, answeredDate: '2025-06-01' },
      { id: 'b', text: 'y', category: 'health', date: '2025-01-03', answered: false },
      { id: 'c', text: 'z', category: 'bogus', date: '2026-02-01', answered: true, answeredDate: null },
    ], { v: 1, b: [] })
    expect(added).toBe(2)
    expect(garden.b).toEqual([['a', '2025-06-01', 1], ['c', '2026-02-01', 0]])
  })
  it('təkrar sinxron heç nə əlavə etmir; gündəlikdən silinən dua bağda qalır', () => {
    const st = store()
    syncGarden([{ id: 'a', category: 'work', date: '2025-01-01', answered: true, answeredDate: '2025-02-01' }], st)
    const raw = st.getItem(GARDEN_KEY)
    syncGarden([{ id: 'a', category: 'work', date: '2025-01-01', answered: true, answeredDate: '2025-02-01' }], st)
    expect(st.getItem(GARDEN_KEY)).toBe(raw)
    syncGarden([], st)
    expect(readGarden(st).b).toEqual([['a', '2025-02-01', 3]])
  })
  it('sanitize: eyni id — ən erkən gün; pozuq yazı atılır', () => {
    expect(sanitizeGarden({ b: [['a', '2025-05-01', 2], ['a', '2025-04-01', 2], ['b', 'x', 0], 'junk', ['c', '2024-01-01', 99]] }).b)
      .toEqual([['c', '2024-01-01', 0], ['a', '2025-04-01', 2]])
  })
  it('pillələr: il üzrə, ilin içində mövqe; mövsüm', () => {
    const t = terraces({ b: [['a', '2025-01-01', 0], ['b', '2025-12-31', 1], ['c', '2026-07-01', 2]] })
    expect(t.map((x) => x.year)).toEqual([2025, 2026])
    expect(t[0].flowers[0].t).toBe(0)
    expect(t[0].flowers[1].t).toBeCloseTo(364 / 365)
    expect(seasonOf('2026-01-15')).toBe(0)
    expect(seasonOf('2026-04-15')).toBe(1)
    expect(seasonOf('2026-07-15')).toBe(2)
    expect(seasonOf('2026-10-15')).toBe(3)
  })
})
