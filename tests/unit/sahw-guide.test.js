import { describe, it, expect } from 'vitest'
import { SAHW_TREE, SAHW_REFS, SAHW_HOW } from '../../src/data/sahwGuide'
import { BOOK_DATA } from '../../src/data/hadithLibrary'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const full = (o) => LANGS.every(l => typeof o?.[l] === 'string' && o[l].length > 1)

describe('səhv səcdəsi ağacı', () => {
  it('bütün keçidlər mövcud düyünə gedir, hər düyünə çatmaq olur', () => {
    const seen = new Set(['start'])
    const walk = (id) => {
      const n = SAHW_TREE[id]
      expect(n).toBeTruthy()
      if (n.res) return
      expect(full(n.q)).toBe(true)
      for (const [label, next] of n.opts) { expect(full(label)).toBe(true); seen.add(next); walk(next) }
    }
    walk('start')
    expect([...seen].sort()).toEqual(Object.keys(SAHW_TREE).sort())
  })
  it('hər nəticədə addımlar, salamdan əvvəl/sonra və Buxari/Müslim mənbəsi var', () => {
    for (const [id, n] of Object.entries(SAHW_TREE)) {
      if (!n.res) continue
      expect(['before', 'after'], id).toContain(n.when)
      expect(n.steps.length).toBeGreaterThan(0)
      for (const s of n.steps) expect(full(s)).toBe(true)
      expect(n.refs.length).toBeGreaterThan(0)
      for (const r of n.refs) expect(['bukhari', 'muslim']).toContain(SAHW_REFS[r]?.book)
    }
    expect(full(SAHW_HOW.text)).toBe(true)
  })
  it('kitabxana nömrələri kitabın bölmə aralığına düşür', () => {
    for (const r of Object.values(SAHW_REFS)) {
      const sec = BOOK_DATA[r.book].sections.find(s => s[1] && r.lib >= s[2] && r.lib <= s[3])
      expect(sec, `${r.book} ${r.lib}`).toBeTruthy()
    }
    // Buxari 1224–1236 — "Forgetfulness in Prayer" bölməsidir
    expect(BOOK_DATA.bukhari.sections.find(s => s[2] <= 1224 && s[3] >= 1224)[1]).toMatch(/Forgetfulness/)
  })
})
