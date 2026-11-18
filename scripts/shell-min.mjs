// ═══════════════════════════════════════════════════════
// Prerender şablonunun (dist/index.html) kiçildilməsi — scripts/prerender.mjs.
//
// index.html-dəki HTML şərhləri sənədləşmədir; çıxışa düşsəydi ~4 KB × 45k
// səhifə (~190 MB xam) olardı (2026-11-18 auditi). Yer tutucular (SEO:HEAD,
// PERF:PRELOAD) saxlanılır — renderPage onları sonra əvəz edir. Şərhdən qalan
// boş sətirlər də silinir. index.html-də <script> içində şərh yoxdur.
// ═══════════════════════════════════════════════════════

const KEEP = /^<!--(?:SEO:HEAD|PERF:PRELOAD)-->$/

export function stripComments(html) {
  return String(html)
    .replace(/[ \t]*<!--[\s\S]*?-->[ \t]*/g, (m) => (KEEP.test(m.trim()) ? m : ''))
    .replace(/\n(?:[ \t]*\r?\n)+/g, '\n')
}
