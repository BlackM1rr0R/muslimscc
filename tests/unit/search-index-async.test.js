// INP: GlobalSearch indeksi hissə-hissə qurur (buildIndexAsync) — nəticə sinxron buildIndex ilə EYNİ olmalıdır
import { describe, it, expect } from 'vitest'
import { buildIndex, buildIndexAsync, buildSources, searchIndex, prepareQuery } from '../../src/utils/search.js'
import { DUAS_DATA } from '../../src/data/duas.js'
import { NAMES_99 } from '../../src/data/names99.js'
import { GLOSSARY } from '../../src/data/glossary.js'
import { QUOTES } from '../../src/data/quotes.js'

const pages = Array.from({ length: 150 }, (_, i) => ({ key: `p${i}`, title: `Səhifə ${i} namaz`, desc: `Təsvir ${i}`, group: 'Qrup', icon: '', keywords: i % 3 ? 'dua zikr' : '' }))

describe('buildIndexAsync', () => {
  const sources = buildSources({ quotes: QUOTES, duas: DUAS_DATA, names: NAMES_99, glossary: GLOSSARY, hadithList: [] }, 'az', pages)

  it('sinxron buildIndex ilə eyni indeksi qurur (order daxil)', async () => {
    let yields = 0
    // sliceMs: 0 — hər 64 elementdən sonra yol verir (hissələrin birləşməsi yoxlanılsın)
    const idx = await buildIndexAsync(sources, { sliceMs: 0, yieldFn: async () => { yields++ } })
    expect(idx).toEqual(buildIndex(sources))
    expect(yields).toBeGreaterThan(2)
  })

  it('axtarış nəticələri və sırası dəyişmir', async () => {
    const idx = await buildIndexAsync(sources, { sliceMs: 0, yieldFn: async () => {} })
    for (const text of ['namaz', 'səbr', 'rahman', 'dua']) {
      const q = prepareQuery(text)
      expect(searchIndex(idx, q)).toEqual(searchIndex(buildIndex(sources), q))
    }
  })
})
