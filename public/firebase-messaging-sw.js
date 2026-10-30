// ═══════════════════════════════════════════════════════
// KÖHNƏ ÜNVAN — yalnız uyğunluq üçün saxlanılır.
//
// Push bildirişlərini artıq saytın yeganə service worker-i (/sw.js) göstərir.
// Əvvəl bu fayl ayrıca SW kimi "/" əhatəsində qeyd olunurdu və /sw.js ilə
// bir-birini əvəz edirdilər (bildirişlər gah gəlir, gah gəlmirdi).
//
// Köhnə versiyanı keşdə saxlayan səhifə hələ bu ünvanı qeyd edə bilər —
// onda da eyni kod işləsin deyə burada sadəcə /sw.js yüklənir.
// ═══════════════════════════════════════════════════════
importScripts('/sw.js')
