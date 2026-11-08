// utils/badges — nişanların hesablanması, ilk açılışda səssiz qeyd, grantBadge
import { describe, it, expect, beforeEach, vi } from 'vitest'

function memStorage() {
  const m = new Map()
  return {
    get length() { return m.size },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    clear: () => m.clear(),
  }
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

let events
beforeEach(() => {
  events = []
  vi.stubGlobal('localStorage', memStorage())
  vi.stubGlobal('window', { dispatchEvent: (e) => { events.push(e.detail) } })
  vi.stubGlobal('CustomEvent', class { constructor(type, o) { this.type = type; this.detail = o?.detail } })
})

const { badgeList, syncBadges, grantBadge, loadEarned, BADGE_KEY, BADGE_IDS } = await import('../../src/utils/badges.js')

describe('badges', () => {
  it('boş cihazda heç bir nişan qazanılmayıb, irəliləyiş 0', () => {
    const list = badgeList()
    expect(list).toHaveLength(BADGE_IDS.length)
    expect(list.every(b => !b.done && b.value === 0)).toBe(true)
  })

  it('ilk sync köhnə nailiyyətləri səssiz yazır, sonrakı yeni nişanı elan edir', () => {
    localStorage.setItem('daily_tracker', JSON.stringify({ [today()]: { fajr: true } }))
    expect(syncBadges()).toEqual([])
    expect(events).toHaveLength(0)
    expect(loadEarned().first_prayer).toBe(today())

    localStorage.setItem('quran_khatm_plan', JSON.stringify({ days: 30, start: today(), done: 604, log: [] }))
    const fresh = syncBadges()
    expect(fresh.map(b => b.id)).toEqual(['khatm'])
    expect(events[0][0].id).toBe('khatm')
    // təkrar — artıq qazanılıb
    expect(syncBadges()).toEqual([])
  })

  it('qazanılan nişan məlumat silinsə də qalır', () => {
    localStorage.setItem(BADGE_KEY, JSON.stringify({ khatm: '2026-01-02' }))
    const k = badgeList().find(b => b.id === 'khatm')
    expect(k.done).toBe(true)
    expect(k.at).toBe('2026-01-02')
    expect(k.value).toBe(k.goal)
  })

  it('azkar: səhər və axşam eyni gün', () => {
    localStorage.setItem(BADGE_KEY, '{}')
    localStorage.setItem('adhkar_done_v1', JSON.stringify({ morning: today(), evening: today() }))
    const ids = syncBadges().map(b => b.id)
    expect(ids).toContain('adhkar')
    expect(ids).toContain('adhkar_both')
  })

  it('grantBadge yalnız tanınan nişan və bir dəfə', () => {
    localStorage.setItem(BADGE_KEY, '{}')
    grantBadge('nope')
    expect(loadEarned()).toEqual({})
    grantBadge('group_khatm')
    grantBadge('group_khatm')
    expect(Object.keys(loadEarned())).toEqual(['group_khatm'])
    expect(events).toHaveLength(1)
  })
})
