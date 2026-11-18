// ═══════════════════════════════════════════════════════
// Detal səhifələrinin böyük məlumat mənbələri — src/seo/detail.js üçün.
//
// NİYƏ (2026-11-18 auditi, ölçülüb): detail.js əvvəl hədisləri (~1.1 MB xam),
// alimləri (~0.5 MB), səhabələri və dərsləri STATİK import edirdi — hər surə,
// ad və şəhər səhifəsi ~440 KB br (2 MB xam) lazımsız JS yükləyib parse edirdi.
// İndi detail.js bu məlumatı buradan oxuyur, mənbəni isə istifadəçi verir:
//   • brauzer — src/seo/detailLoaders.js: yalnız həmin növün səhifəsində
//     (hədis səhifəsində hədislər, səhabə səhifəsində səhabələr…);
//   • Node — src/seo/detailData.js (prerender, testlər) hamısını bir dəfə qeyd edir.
// Mənbə verilməyibsə həmin növün detalı tanınmır (detailMeta → null).
// Lüğət ayrıca (eyni üsul) — glossarySource.js.
// ═══════════════════════════════════════════════════════

const SRC = {}

/**
 * Növün məlumatını qeyd et:
 *   hadith   — { HADITHS, SUNAN_GRADES, gradeOf, localizeSource }
 *   sahaba   — { SAHABA, slugOf }
 *   scholars — { scholarBySlug, lifeSpan }
 *   learn    — { lessonBySlug, CAT_BY_KEY }
 *   glossaryNames — { glossaryName, glossaryGloss } (lüğətin özü: glossarySource.js)
 */
export function setDetailSource(kind, data) {
  SRC[kind] = data || null
}

/** Növün məlumatı (qeyd olunmayıbsa null). */
export const detailSource = (kind) => SRC[kind] || null
