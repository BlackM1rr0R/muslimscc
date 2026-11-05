// Əməllərin səması (utils/muhasabahSky) — ulduzlar
import { describe, it, expect } from 'vitest'
import { skyStars, hash01, W, H } from '../../src/utils/muhasabahSky.js'

describe('skyStars', () => {
  const items = ['salah', 'quran']
  const entries = { '2026-11-05': { c: ['salah', 'quran'] }, '2026-11-01': { c: ['salah'] }, '2026-09-01': { c: ['salah'] } }
  it('son 30 gün: hər əməl bir ulduz; köhnə qeyd sayılmır', () => {
    const s = skyStars(entries, items, '2026-11-05')
    expect(s[0].map(x => x.date)).toEqual(['2026-11-01', '2026-11-05'])
    expect(s[1]).toHaveLength(1)
    expect(s[0][1].age).toBe(0)
  })
  it('deterministik və səma daxilində', () => {
    const a = skyStars(entries, items, '2026-11-05'), b = skyStars(entries, items, '2026-11-05')
    expect(a).toEqual(b)
    for (const st of a.flat()) { expect(st.x).toBeGreaterThan(0); expect(st.x).toBeLessThan(W); expect(st.y).toBeLessThan(H) }
    expect(hash01('x')).toBeGreaterThanOrEqual(0)
  })
})
