import { describe, it, expect } from 'vitest'
import { dueIds, grade, summary, addDays, INTERVALS } from '../../src/utils/hadithSrs.js'

describe('hədis əzbərləmə (Leitner)', () => {
  const T = '2026-11-15'
  it('yeni kartlar bu gün, vaxtı keçənlər əvvəl', () => {
    const st = { 2: { b: 1, due: '2026-11-10' }, 3: { b: 2, due: '2026-11-20' } }
    expect(dueIds([1, 2, 3], st, T)).toEqual([2, 1])
  })
  it('"Bildim" qutunu artırır, aralıq uzanır; "Yenə" sıfırlayır', () => {
    let st = grade({}, 1, true, T)
    expect(st[1]).toEqual({ b: 0, due: addDays(T, INTERVALS[0]) })
    st = grade(st, 1, true, T)
    expect(st[1]).toEqual({ b: 1, due: addDays(T, INTERVALS[1]) })
    st = grade(st, 1, false, T)
    expect(st[1]).toEqual({ b: 0, due: T })
    expect(dueIds([1], st, T)).toEqual([1])
  })
  it('ən yuxarı qutudan çıxmır; xülasə', () => {
    let st = {}
    for (let i = 0; i < 10; i++) st = grade(st, 7, true, T)
    expect(st[7].b).toBe(INTERVALS.length - 1)
    expect(summary([7, 8], st, T)).toEqual({ learned: 1, next: addDays(T, 60) })
  })
  it('ay/il keçidi', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
  })
})
