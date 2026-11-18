// ═══════════════════════════════════════════════════════
// Node üçün (scripts/prerender.mjs, scripts/seo-body.mjs, testlər): detail.js-in
// BÜTÜN məlumat mənbələrini sinxron qeyd edir və detail.js-i olduğu kimi ixrac edir.
// Brauzer bu faylı import ETMİR — orada hər növ öz məlumatını tənbəl yükləyir
// (src/seo/detailLoaders.js; səbəb: src/seo/detailSources.js).
// ═══════════════════════════════════════════════════════

import { setDetailSource } from './detailSources.js'
import { setGlossarySource } from './glossarySource.js'
import { HADITHS } from '../data/hadiths.js'
import { SUNAN_GRADES } from '../data/hadithGrades.js'
import { gradeOf } from '../utils/hadithGrade.js'
import { localizeSource } from '../utils/sourceNames.js'
import { SAHABA, slugOf } from '../data/sahaba.js'
import { scholarBySlug, lifeSpan } from '../data/scholars.js'
import { lessonBySlug, CAT_BY_KEY } from '../data/lessons/index.js'
import { GLOSSARY_BY_ID } from '../data/glossary.js'
import { glossaryName, glossaryGloss } from '../data/glossaryNames.js'

setDetailSource('hadith', { HADITHS, SUNAN_GRADES, gradeOf, localizeSource })
setDetailSource('sahaba', { SAHABA, slugOf })
setDetailSource('scholars', { scholarBySlug, lifeSpan })
setDetailSource('learn', { lessonBySlug, CAT_BY_KEY })
setGlossarySource(GLOSSARY_BY_ID)
setDetailSource('glossaryNames', { glossaryName, glossaryGloss })

export * from './detail.js'
