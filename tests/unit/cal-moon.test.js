// Təqvimdə hilal təxmini (components/calendar/CalMoon.jsx → crescentEvening)
import { describe, it, expect } from 'vitest'
import { crescentEvening } from '../../src/components/calendar/CalMoon.jsx'
import { moonPhase } from '../../src/utils/moonPhase.js'

const daysFrom = (y, m, d) => Array.from({ length: 30 }, (_, i) => ({ day: i + 1, date: new Date(y, m, d + i, 12) }))

describe('crescentEvening', () => {
  it('ayın 1-i ətrafında, birləşmədən 0.75–2.5 gün sonrakı axşam', () => {
    // 2026-10-12 — Cəmadiyül-Əvvəl 1448-in 1-i (Ümmül-Qura)
    const d = crescentEvening(daysFrom(2026, 9, 12))
    expect(d).toBeInstanceOf(Date)
    const diff = Math.round((d - new Date(2026, 9, 12, 12)) / 86400000)
    expect(diff).toBeGreaterThanOrEqual(-3)
    expect(diff).toBeLessThanOrEqual(1)
    const e = new Date(d); e.setHours(19, 0, 0, 0)
    const age = moonPhase(e).age
    expect(age).toBeGreaterThanOrEqual(0.75)
    expect(age).toBeLessThanOrEqual(2.5)
  })
  it('boş siyahı → null', () => expect(crescentEvening([])).toBeNull())
})
