// ═══════════════════════════════════════════════════════
// Lüğət terminlərinin mənbəyi — src/seo/detail.js üçün.
//
// NİYƏ AYRICA: detail.js hər detal səhifəsində (surə, ad, səhabə…) tənbəl
// yüklənir. Lüğət məlumatı (src/data/glossary.js, 5 dildə 341 tərif) böyükdür
// (~160 KB gzip) — onu detail.js-ə statik import etsək, hər surə səhifəsi
// bu yükü boş yerə daşıyardı. Ona görə detail.js məlumatı buradan oxuyur,
// mənbəni isə istifadəçi verir:
//   • brauzer — src/seo/Seo.jsx, yalnız /glossary/<id> səhifəsində
//     (həmin chunk GlossaryPage tərəfindən onsuz da yüklənir);
//   • Node — scripts/seo-body.mjs (prerender) və testlər.
// Mənbə verilməyibsə termin tanınmır (detailMeta → null).
// ═══════════════════════════════════════════════════════

let BY_ID = null

/** Lüğəti qeyd et: GLOSSARY_BY_ID (src/data/glossary.js). */
export function setGlossarySource(byId) {
  BY_ID = byId || null
}

/** Termin id ilə (mənbə yoxdursa null). */
export function glossaryItem(id) {
  return (BY_ID && BY_ID.get(id)) || null
}
