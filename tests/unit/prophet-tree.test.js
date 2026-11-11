import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { TREE_NODES, TREE_EDGES, TREE_REL } from '../../src/data/prophetTree'
import { PROPHETS } from '../../src/data/islamicHistory'
import { normalizeArabic } from '../../src/utils/hifzSrs'

const q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
describe('prophetTree — hər əlaqənin sözü göstərilən ayədə keçir', () => {
  for (const [a, b, kind, refs] of TREE_EDGES) {
    it(`${a} → ${b} (${kind})`, () => {
      expect(TREE_NODES[a]).toBeTruthy()
      expect(TREE_NODES[b]).toBeTruthy()
      expect(TREE_REL[kind]).toBeTruthy()
      expect(refs.length).toBeGreaterThan(0)
      for (const [ref, word] of refs) {
        const [s, n] = ref.split(':').map(Number)
        expect(normalizeArabic(q.ayahs[s - 1][n - 1])).toContain(normalizeArabic(word))
      }
    })
  }
  it('peyğəmbər düyünləri PROPHETS-də var', () => {
    for (const n of Object.values(TREE_NODES)) {
      if (n.num) expect(PROPHETS.some(p => p.num === n.num)).toBe(true)
      else expect(n.name?.az && n.name?.en).toBeTruthy()
    }
  })
})
