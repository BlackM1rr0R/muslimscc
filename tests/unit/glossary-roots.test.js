// Lüğət → Quran kökü (data/glossaryRoots.js): bütün açarlar mövcud terminlərdir, köklər indeksdədir
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { GLOSSARY } from '../../src/data/glossary.js'
import { GLOSSARY_ROOTS } from '../../src/data/glossaryRoots.js'

describe('GLOSSARY_ROOTS', () => {
  const ids = new Set(GLOSSARY.map(g => g.id))
  const { roots } = JSON.parse(fs.readFileSync('public/data/quran-roots.json', 'utf8'))
  it('hər açar lüğətdə var, kök Quran indeksində var, say müsbətdir', () => {
    const entries = Object.entries(GLOSSARY_ROOTS)
    expect(entries.length).toBeGreaterThan(80)
    for (const [id, [root, n]] of entries) {
      expect(ids.has(id), id).toBe(true)
      expect(roots[root], root).toBeTruthy()
      expect(n).toBeGreaterThan(0)
    }
  })
  it('bilinən nümunələr: namaz → ص ل و, zəkat → ز ك و, səbr → ص ب ر', () => {
    const byTerm = (t) => GLOSSARY_ROOTS[GLOSSARY.find(g => g.term === t)?.id]?.[0]
    expect(byTerm('Namaz')).toBe('صلو')
    expect(byTerm('Zəkat')).toBe('زكو')
    expect(byTerm('Səbr')).toBe('صبر')
  })
})
