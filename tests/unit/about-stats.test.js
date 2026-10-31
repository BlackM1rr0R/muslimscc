// "Haqqımızda" səhifəsinin rəqəmləri (src/data/pageGuides/aboutStats.js)
// əsl məlumat fayllarına uyğun olmalıdır — uydurma/köhnəlmiş rəqəm yox.
// Bu test düşürsə: aboutStats.js-dəki rəqəmi yenilə.
import { describe, it, expect } from 'vitest'
import { LIBRARY, LESSONS_BY_CAT, SCHOLARS_BY_ERA, ERA_SHORT } from '../../src/data/pageGuides/aboutStats.js'
import { LESSONS, LESSON_CATS } from '../../src/data/lessons/index.js'
import { SCHOLARS, ERAS, ERA_SHORT as ERA_SHORT_SRC } from '../../src/data/scholars.js'
import { SAHABA } from '../../src/data/sahaba.js'
import { GLOSSARY } from '../../src/data/glossary.js'
import { NAWAWI_40 } from '../../src/data/nawawi40.js'
import { NAMES_99 } from '../../src/data/names99.js'

const countBy = (arr, key) => arr.reduce((a, x) => ((a[x[key]] = (a[x[key]] || 0) + 1), a), {})

describe('Haqqımızda — rəqəmlər', () => {
  it('kitabxana sayları məlumat fayllarına uyğundur', () => {
    expect(LIBRARY.lessons).toBe(LESSONS.length)
    expect(LIBRARY.lessonMinutes).toBe(LESSONS.reduce((s, l) => s + (l.minutes || 0), 0))
    expect(LIBRARY.scholars).toBe(SCHOLARS.length)
    expect(LIBRARY.sahaba).toBe(SAHABA.length)
    expect(LIBRARY.glossary).toBe(GLOSSARY.length)
    expect(LIBRARY.nawawi).toBe(NAWAWI_40.length)
    expect(LIBRARY.names).toBe(NAMES_99.length)
  })

  it('dərslər kateqoriyaya görə', () => {
    const real = countBy(LESSONS, 'cat')
    expect(LESSONS_BY_CAT).toEqual(real)
    expect(Object.keys(LESSONS_BY_CAT).sort()).toEqual(LESSON_CATS.map(c => c.key).sort())
  })

  it('alimlər dövrə görə; dövr adları scholars.js ilə eynidir', () => {
    expect(SCHOLARS_BY_ERA).toEqual(countBy(SCHOLARS, 'era'))
    expect(Object.keys(SCHOLARS_BY_ERA)).toEqual(ERAS)
    expect(ERA_SHORT).toEqual(ERA_SHORT_SRC)
  })
})
