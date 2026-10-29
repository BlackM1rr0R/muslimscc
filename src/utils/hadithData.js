// ═══════════════════════════════════════════════════════
// Hədis məlumatının dil üzrə yüklənməsi (veb)
//
// NƏ: "virtual:hadiths/<dil>" modulunu (vite.config.js → hadithLangPlugin)
// dinamik yükləyir və keşləyir. Modulda həmin dilin TƏKRARSIZ siyahısı və
// alias cədvəli var; Firebase birləşməsi üçün açar həşləri (bütün dillər
// üçün eyni) ayrıca "virtual:hadiths/keys" modulundadır — hamısı build
// zamanı utils/uniqueHadiths.js ilə hesablanıb.
// NİYƏ: əvvəl HadithPage / GlobalSearch bütöv src/data/hadiths.js-i (5 dil,
// ~400 KB gzip) yükləyirdi; indi yalnız cari dil (az/en/tr ~123 KB, ru ~135 KB, ar ~67 KB gzip) və brauzerdə
// təkrarsızlaşdırma hesablanmır (mobil CPU-da ~100+ ms qənaət).
//
// Nəticə köhnə runtime funksiyaları ilə eynidir:
//   list        ≡ uniqueHadithsFor(HADITHS, lang)
//   aliases     ≡ hadithAliases(HADITHS)
//   loadHadithKeys() → keysOf(id) ≡ staticHadithKeys(HADITHS, id)
//                      (yalnız ar/az/tx açarları, həşlənmiş)
// (tests/unit/hadith-lang-data.test.js)
// ═══════════════════════════════════════════════════════

import { reviveHadithLangData, reviveHadithMergeKeys } from './uniqueHadiths.js'
import { withChunkRetry } from './chunkRetry.js'

// Statik import() çağırışları — Vite hər dil üçün ayrıca chunk yaradır.
// withChunkRetry: deploydan sonra köhnə tabda chunk yoxdursa — bir dəfə yenilə
const LOADERS = {
  az: withChunkRetry(() => import('virtual:hadiths/az')),
  en: withChunkRetry(() => import('virtual:hadiths/en')),
  ru: withChunkRetry(() => import('virtual:hadiths/ru')),
  tr: withChunkRetry(() => import('virtual:hadiths/tr')),
  ar: withChunkRetry(() => import('virtual:hadiths/ar')),
}

const cache = new Map()    // dil → hazır məlumat
const pending = new Map()  // dil → Promise
const failed = new Map()   // dil → son yükləmə xətası (useHadithData bir dəfə atır)

/** uniqueHadithsFor kimi: naməlum dil → ingiliscə. */
export const hadithLangOf = (lang) => (LOADERS[lang] ? lang : 'en')

/** Yüklənibsə — hazır məlumat, yoxsa null (sinxron). */
export function peekHadithData(lang) {
  return cache.get(hadithLangOf(lang)) || null
}

/** Dilin hədis məlumatı: { lang, list, aliases: Map, keysOf(id) }. */
export function loadHadithData(lang) {
  const l = hadithLangOf(lang)
  if (cache.has(l)) return Promise.resolve(cache.get(l))
  if (!pending.has(l)) {
    const p = LOADERS[l]().then((m) => {
      const data = { lang: l, ...reviveHadithLangData(m.default) }
      cache.set(l, data)
      pending.delete(l)
      return data
    })
    // Uğursuz olsa (şəbəkə), növbəti cəhd yenidən yükləsin
    p.catch((e) => { pending.delete(l); failed.set(l, e) })
    pending.set(l, p)
  }
  return pending.get(l)
}

/**
 * React (Suspense) üçün: məlumat hazırdırsa qaytarır, yoxsa yükləmə vədini
 * atır — Suspense gözləyir. Naviqasiya və dil dəyişməsi startTransition ilə
 * gedir (main.jsx → v7_startTransition), ona görə gözləmə zamanı köhnə ekran
 * qalır (spinner yanıb-sönmür); yalnız birbaşa açılışda — səhifə chunk-ı kimi —
 * Suspense fallback görünür. Prerender HTML-i cari dilin modulunu
 * modulepreload ilə səhifə chunk-ı ilə paralel yükləyir.
 * Yükləmə uğursuzdursa xəta BİR DƏFƏ atılır (chunk xətası kimi) — sonsuz
 * yenidən cəhd dövrəsi olmur, növbəti açılış yenidən yükləyir.
 */
export function useHadithData(lang) {
  const l = hadithLangOf(lang)
  const data = cache.get(l)
  if (data) return data
  if (failed.has(l)) {
    const e = failed.get(l)
    failed.delete(l)
    throw e
  }
  throw loadHadithData(l)
}

let keysPromise = null
/**
 * Firebase (admin) hədisləri ilə birləşmə açarları: Promise<keysOf(id)>.
 * Yalnız /hadith-də, ilk boyamadan sonra lazım olur (admin hədisləri onsuz da
 * şəbəkədən sonra gəlir) — ona görə dil modulundan ayrıdır (~31 KB gzip).
 */
export function loadHadithKeys() {
  if (!keysPromise) {
    keysPromise = import('virtual:hadiths/keys').then(m => reviveHadithMergeKeys(m.default))
    keysPromise.catch(() => { keysPromise = null })
  }
  return keysPromise
}
