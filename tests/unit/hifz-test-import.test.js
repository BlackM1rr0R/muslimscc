// "Məni yoxla" nəticəsinin hifz SRS-ə idxalı (src/utils/hifzTestImport.js)
import { describe, it, expect } from 'vitest'
import { importTestResult, pendingImports, readImported, markImported, TESTS_KEY } from '../../src/utils/hifzTestImport.js'
import { emptyState, gradeItem, dueItems, sanitizeState, MIN_EASE } from '../../src/utils/hifzSrs.js'

const today = '2026-11-17'
const test = (marks) => ({ id: 7, surah: 67, from: 1, to: 10, status: 'done', result: { marks } })

describe('importTestResult', () => {
  it('səhvli ayə bu gün təkrara düşür, tərəddüd — ən gec sabah; işarəsizlərə toxunulmur', () => {
    let st = emptyState()
    for (const a of [1, 2, 3]) {
      st = gradeItem(st, 67, a, 'good', '2026-11-10')
      st = gradeItem(st, 67, a, 'good', '2026-11-16')   // interval 6 gün → 11-22
    }
    const before = st.items['67:3']
    const { state, mistakes, hesitations } = importTestResult(st, test([{ a: 1, kind: 'mistake', words: [3] }, { a: 2, kind: 'hesitation' }]), today)
    expect([mistakes, hesitations]).toEqual([1, 1])
    expect(state.items['67:1']).toMatchObject({ interval: 0, reps: 0, lapses: 1, due: today })
    expect(state.items['67:1'].ease).toBeCloseTo(st.items['67:1'].ease - 0.2)
    expect(state.items['67:2']).toMatchObject({ interval: 1, due: '2026-11-18' })
    expect(state.items['67:3']).toEqual(before)
    expect(state.log).toEqual(st.log)                 // jurnal dəyişmir
    expect(st.items['67:1'].interval).toBe(6)         // giriş dəyişməyib
    expect(dueItems(state, today).map((x) => x.a)).toEqual([1])
    // nəticə sanitizeState-dən keçir (yaddaşa yazıla bilər)
    expect(sanitizeState(JSON.parse(JSON.stringify(state))).items['67:1'].due).toBe(today)
  })

  it('hələ siyahıda olmayan ayə əlavə olunur; asanlıq minimumdan aşağı düşmür', () => {
    let st = emptyState()
    st.items['67:5'] = { s: 67, a: 5, ease: MIN_EASE, interval: 20, reps: 4, lapses: 0, due: '2026-12-01', added: '2026-10-01', last: '2026-11-11' }
    const r = importTestResult(st, test([{ a: 4, kind: 'mistake' }, { a: 5, kind: 'mistake' }, { a: 6, kind: 'weird' }]), today)
    expect(r.state.items['67:4']).toMatchObject({ s: 67, a: 4, due: today, added: today, lapses: 1 })
    expect(r.state.items['67:5'].ease).toBe(MIN_EASE)
    expect(r.state.items['67:6']).toBeUndefined()
    expect(r.mistakes).toBe(2)
  })

  it('tərəddüd daha erkən təkrarı gecikdirmir', () => {
    const st = emptyState()
    st.items['67:2'] = { s: 67, a: 2, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: '2026-11-15', added: '2026-11-15', last: null }
    expect(importTestResult(st, test([{ a: 2, kind: 'hesitation' }]), today).state.items['67:2'].due).toBe('2026-11-15')
  })

  it('bir nəticə bir dəfə idxal olunur', () => {
    const m = new Map()
    const s = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
    const tests = [test([]), { ...test([]), id: 8, status: 'open', result: null }, { ...test([]), id: 9 }]
    expect(pendingImports(tests, readImported(s)).map((t) => t.id)).toEqual([7, 9])
    markImported(7, s)
    markImported(7, s)
    expect(JSON.parse(m.get(TESTS_KEY))).toEqual({ imported: [7] })
    expect(pendingImports(tests, readImported(s)).map((t) => t.id)).toEqual([9])
  })
})
