// ═══════════════════════════════════════════════════════
// "Haqqımızda" (/about) — saytdakı biliyin rəqəmləri.
//
// Rəqəmlər məlumat fayllarından SAYILIB (data faylları böyükdür —
// /about onları yükləməsin deyə burada sabit kimi saxlanılır).
// tests/unit/about-stats.test.js hər rəqəmi əsl fayla qarşı yoxlayır:
// dərs, alim, səhabə, termin əlavə olunanda test düşür → bu faylı yenilə.
// Hədis sayı — src/data/siteStats.js (HADITH_COUNT), burada təkrarlanmır.
// ═══════════════════════════════════════════════════════

export const LIBRARY = {
  lessons: 34,        // src/data/lessons/index.js → LESSONS
  lessonMinutes: 530, // LESSONS[].minutes cəmi
  scholars: 34,       // src/data/scholars.js → SCHOLARS
  sahaba: 20,         // src/data/sahaba.js → SAHABA
  glossary: 341,      // src/data/glossary.js → GLOSSARY
  nawawi: 42,         // src/data/nawawi40.js → NAWAWI_40
  names: 99,          // src/data/names99.js → NAMES_99
}

// Dərslər kateqoriyaya görə (açar — lessons/cats.js → LESSON_CATS)
export const LESSONS_BY_CAT = { aqidah: 4, tahara: 8, seasons: 5, family: 6, heart: 4, knowledge: 5, dawah: 2 }

// Alimlər dövrə görə (açar — scholars.js → ERAS)
export const SCHOLARS_BY_ERA = { salaf: 16, classical: 7, revival: 3, contemporary: 8 }

// Dövrlərin qısa adı (scholars.js → ERA_SHORT ilə eyni; o fayl alimlərin
// tam profillərini yükləyir, ona görə buradan import olunmur — test eyniliyi yoxlayır)
export const ERA_SHORT = {
  salaf: { az: 'Sələf', en: 'Salaf', ru: 'Саляф', ar: 'السلف', tr: 'Selef' },
  classical: { az: 'Orta əsr', en: 'Medieval', ru: 'Средние века', ar: 'المتأخرون', tr: 'Orta çağ' },
  revival: { az: 'Yeni dövr', en: 'Early modern', ru: 'Новое время', ar: 'العصر الحديث', tr: 'Yeni dönem' },
  contemporary: { az: 'Müasir', en: 'Contemporary', ru: 'Современность', ar: 'المعاصرون', tr: 'Çağdaş' },
}
