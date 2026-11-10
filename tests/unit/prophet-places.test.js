import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { PROPHET_PLACES, PLACE_WORDS } from '../../src/data/prophetPlaces'
import { PROPHETS } from '../../src/data/islamicHistory'
import { normalizeArabic } from '../../src/utils/hifzSrs'

const q = JSON.parse(fs.readFileSync('seo-data/quran/quran-uthmani.json', 'utf8'))
describe('prophetPlaces — hər yerin adı göstərilən ayədə keçir', () => {
  for (const p of PROPHET_PLACES) {
    for (const [ref, nums] of p.refs) {
      it(`${p.id} ${ref}`, () => {
        const [s, a] = ref.split(':').map(Number)
        const text = normalizeArabic(q.ayahs[s - 1][a - 1])
        expect(text).toContain(normalizeArabic(PLACE_WORDS[ref] || p.word))
        for (const n of nums) expect(PROPHETS.some(x => x.num === n)).toBe(true)
      })
    }
  }
})
