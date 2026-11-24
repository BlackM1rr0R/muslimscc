// ═══════════════════════════════════════════════════════
// Brauzer: detal növünün məlumatını TƏNBƏL yüklə və detail.js üçün qeyd et
// (src/seo/detailSources.js). Hər növ yalnız öz chunk-larını yükləyir —
// surə / ad / şəhər səhifəsi hədis, alim və səhabə məlumatını yükləmir.
// Node-da bunun əvəzinə src/seo/detailData.js işlədilir.
// ═══════════════════════════════════════════════════════

import { setDetailSource } from './detailSources.js'
import { setGlossarySource } from './glossarySource.js'

const LOADERS = {
  hadith: () => Promise.all([
    import('../data/hadiths.js'), import('../data/hadithGrades.js'),
    import('../utils/hadithGrade.js'), import('../utils/sourceNames.js'),
  ]).then(([h, g, gr, s]) => setDetailSource('hadith',
    { HADITHS: h.HADITHS, SUNAN_GRADES: g.SUNAN_GRADES, gradeOf: gr.gradeOf, localizeSource: s.localizeSource })),
  sahaba: () => import('../data/sahaba.js')
    .then(m => setDetailSource('sahaba', { SAHABA: m.SAHABA, slugOf: m.slugOf })),
  scholars: () => import('../data/scholars.js')
    .then(m => setDetailSource('scholars', { scholarBySlug: m.scholarBySlug, lifeSpan: m.lifeSpan })),
  learn: () => import('../data/lessons/index.js')
    .then(m => setDetailSource('learn', { lessonBySlug: m.lessonBySlug, CAT_BY_KEY: m.CAT_BY_KEY })),
  // Hisnul-Müslim zikri — yalnız ərəbcə fayl (HisnPage eyni faylı yükləyir; brauzer keşi)
  hisn: () => fetch('/data/hisn/ar.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(d => setDetailSource('hisn', { chapters: d.chapters })),
  // Lüğət chunk-ını GlossaryPage onsuz da yükləyib
  glossary: () => Promise.all([import('../data/glossary.js'), import('../data/glossaryNames.js')]).then(([g, n]) => {
    setGlossarySource(g.GLOSSARY_BY_ID)
    setDetailSource('glossaryNames', { glossaryName: n.glossaryName, glossaryGloss: n.glossaryGloss })
  }),
}

const done = {}

/** detail.js modulu + bu növün məlumatı (bir dəfə yüklənir). */
export function loadDetail(kind) {
  const data = LOADERS[kind] ? (done[kind] ||= LOADERS[kind]().catch((e) => { delete done[kind]; throw e })) : null
  return Promise.all([import('./detail.js'), data]).then(([detail]) => detail)
}
