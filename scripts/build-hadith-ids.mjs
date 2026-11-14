// /hadith/<id> səhifələrinin siyahısı → src/seo/hadithIds.js (v6.8)
// Yalnız saytda göstərilən, təkrarsız (utils/uniqueHadiths) və HƏDİS olan qeydlər (mənbəyi Quran surəsi
// olanlar — isNotHadith — çıxarılır). Nömrəsiz mənbəli rəvayətlər onsuz da göstərilmir (hadiths.js).
// hadiths.js ~1.2 MB-dır — routes.js (brauzer) onu import etməsin deyə siyahı ayrıca, kiçik faylda saxlanılır.
// İstifadə: node scripts/build-hadith-ids.mjs   (hadiths.js dəyişəndə; tests/unit/hadith-pages.test.js yoxlayır)
import fs from 'node:fs'
import { HADITHS } from '../src/data/hadiths.js'
import { uniqueHadithsFor } from '../src/utils/uniqueHadiths.js'
import { isNotHadith } from '../src/utils/search.js'
import { detailMeta } from '../src/seo/detail.js'

const L = uniqueHadithsFor(HADITHS, 'az')
// Eyni hədis iki qeyddə (eyni mənbə nömrəsi, bir az fərqli tərcümə) — başlıq eyni olur: ilki saxlanılır
const seen = new Set()
const ids = (L.list || L).filter(h => !isNotHadith(h.source)).map(h => String(h.id)).filter(id => {
  const t = detailMeta('hadith', 'az', id)?.t
  if (!t || seen.has(t)) return false
  seen.add(t)
  return true
})
fs.writeFileSync('src/seo/hadithIds.js', `// Avtomatik yaradılır: node scripts/build-hadith-ids.mjs — əl ilə redaktə etmə.\n// /hadith/<id> səhifələri (${ids.length}): saytda göstərilən təkrarsız hədislərin id-ləri\nexport const HADITH_IDS = ${JSON.stringify(ids)}\n`)
console.log('ok', ids.length)
