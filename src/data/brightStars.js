// ═══════════════════════════════════════════════════════
// Parlaq ulduzlar (v6.6, "Ulduzlarla qiblə" — /qibla). Koordinatlar J2000.0 (Hipparcos / Yale Bright
// Star Catalogue): ra, dec — dərəcə, mag — vizual ulduz ölçüsü. utils/starQibla.js presessiya ilə
// tarixə gətirir. ar — klassik ərəbcə adı (bir çox ulduzun Avropa adı ərəbcədən gəlir:
// Aldebaran ← ad-Dabarān, Vega ← (an-Nasr) al-Wāqiʿ, Altair ← (an-Nasr) aṭ-Ṭāʾir, Rigel ← Rijl …).
// name — ulduzun beynəlxalq adı (ru — rusca yazılışı).
// ═══════════════════════════════════════════════════════
const h = (H, M, S) => (H + M / 60 + S / 3600) * 15
const d = (sign, D, M, S) => sign * (D + M / 60 + S / 3600)

// lang-ok[Sirius,Canopus,Arcturus,Vega,Capella,Rigel,Procyon,Betelgeuse,Achernar,Altair,Aldebaran,Antares,Spica,Pollux,Fomalhaut,Deneb,Regulus,Polaris,Acrux,Castor,Dubhe,Merak,Bellatrix,Alnilam,Alpha,Centauri,Hadar,Schedar]: ulduzların beynəlxalq adları
export const BRIGHT_STARS = [
  { id: 'sirius',     ra: h(6, 45, 8.9),   dec: d(-1, 16, 42, 58), mag: -1.46, ar: 'الشعرى اليمانية', name: { en: 'Sirius', ru: 'Сириус' } },
  { id: 'canopus',    ra: h(6, 23, 57.1),  dec: d(-1, 52, 41, 44), mag: -0.74, ar: 'سهيل', name: { en: 'Canopus', ru: 'Канопус' } },
  { id: 'rigilkent',  ra: h(14, 39, 36.5), dec: d(-1, 60, 50, 2),  mag: -0.27, ar: 'رجل قنطورس', name: { en: 'Alpha Centauri', ru: 'Альфа Центавра' } },
  { id: 'arcturus',   ra: h(14, 15, 39.7), dec: d(1, 19, 10, 57),  mag: -0.05, ar: 'السماك الرامح', name: { en: 'Arcturus', ru: 'Арктур' } },
  { id: 'vega',       ra: h(18, 36, 56.3), dec: d(1, 38, 47, 1),   mag: 0.03,  ar: 'النسر الواقع', name: { en: 'Vega', ru: 'Вега' } },
  { id: 'capella',    ra: h(5, 16, 41.4),  dec: d(1, 45, 59, 53),  mag: 0.08,  ar: 'العيوق', name: { en: 'Capella', ru: 'Капелла' } },
  { id: 'rigel',      ra: h(5, 14, 32.3),  dec: d(-1, 8, 12, 6),   mag: 0.13,  ar: 'رجل الجبار', name: { en: 'Rigel', ru: 'Ригель' } },
  { id: 'procyon',    ra: h(7, 39, 18.1),  dec: d(1, 5, 13, 30),   mag: 0.34,  ar: 'الشعرى الشامية', name: { en: 'Procyon', ru: 'Процион' } },
  { id: 'achernar',   ra: h(1, 37, 42.8),  dec: d(-1, 57, 14, 12), mag: 0.46,  ar: 'آخر النهر', name: { en: 'Achernar', ru: 'Ахернар' } },
  { id: 'betelgeuse', ra: h(5, 55, 10.3),  dec: d(1, 7, 24, 25),   mag: 0.50,  ar: 'يد الجوزاء', name: { en: 'Betelgeuse', ru: 'Бетельгейзе' } },
  { id: 'hadar',      ra: h(14, 3, 49.4),  dec: d(-1, 60, 22, 23), mag: 0.61,  ar: 'حضار', name: { en: 'Hadar', ru: 'Хадар' } },
  { id: 'altair',     ra: h(19, 50, 47.0), dec: d(1, 8, 52, 6),    mag: 0.76,  ar: 'النسر الطائر', name: { en: 'Altair', ru: 'Альтаир' } },
  { id: 'acrux',      ra: h(12, 26, 35.9), dec: d(-1, 63, 5, 57),  mag: 0.77,  name: { en: 'Acrux', ru: 'Акрукс' } },
  { id: 'aldebaran',  ra: h(4, 35, 55.2),  dec: d(1, 16, 30, 33),  mag: 0.86,  ar: 'الدبران', name: { en: 'Aldebaran', ru: 'Альдебаран' } },
  { id: 'antares',    ra: h(16, 29, 24.5), dec: d(-1, 26, 25, 55), mag: 0.96,  ar: 'قلب العقرب', name: { en: 'Antares', ru: 'Антарес' } },
  { id: 'spica',      ra: h(13, 25, 11.6), dec: d(-1, 11, 9, 41),  mag: 0.97,  ar: 'السماك الأعزل', name: { en: 'Spica', ru: 'Спика' } },
  { id: 'pollux',     ra: h(7, 45, 18.9),  dec: d(1, 28, 1, 34),   mag: 1.14,  ar: 'رأس التوأم المؤخر', name: { en: 'Pollux', ru: 'Поллукс' } },
  { id: 'fomalhaut',  ra: h(22, 57, 39.0), dec: d(-1, 29, 37, 20), mag: 1.16,  ar: 'فم الحوت', name: { en: 'Fomalhaut', ru: 'Фомальгаут' } },
  { id: 'deneb',      ra: h(20, 41, 25.9), dec: d(1, 45, 16, 49),  mag: 1.25,  ar: 'ذنب الدجاجة', name: { en: 'Deneb', ru: 'Денеб' } },
  { id: 'regulus',    ra: h(10, 8, 22.3),  dec: d(1, 11, 58, 2),   mag: 1.35,  ar: 'قلب الأسد', name: { en: 'Regulus', ru: 'Регул' } },
  { id: 'castor',     ra: h(7, 34, 36.0),  dec: d(1, 31, 53, 18),  mag: 1.58,  ar: 'رأس التوأم المقدم', name: { en: 'Castor', ru: 'Кастор' } },
  { id: 'bellatrix',  ra: h(5, 25, 7.9),   dec: d(1, 6, 20, 59),   mag: 1.64,  name: { en: 'Bellatrix', ru: 'Беллатрикс' } },
  { id: 'alnilam',    ra: h(5, 36, 12.8),  dec: d(-1, 1, 12, 7),   mag: 1.69,  ar: 'النظام', name: { en: 'Alnilam', ru: 'Альнилам' } },
  { id: 'dubhe',      ra: h(11, 3, 43.7),  dec: d(1, 61, 45, 3),   mag: 1.79,  ar: 'الدب', name: { en: 'Dubhe', ru: 'Дубхе' } },
  { id: 'polaris',    ra: h(2, 31, 49.1),  dec: d(1, 89, 15, 51),  mag: 1.98,  ar: 'الجدي', name: { en: 'Polaris', ru: 'Полярная звезда' } },
  { id: 'schedar',    ra: h(0, 40, 30.4),  dec: d(1, 56, 32, 14),  mag: 2.24,  ar: 'الصدر', name: { en: 'Schedar', ru: 'Шедар' } },
  { id: 'merak',      ra: h(11, 1, 50.5),  dec: d(1, 56, 22, 57),  mag: 2.37,  ar: 'المراق', name: { en: 'Merak', ru: 'Мерак' } },
]

// Qütb ulduzunu tapmaq üçün: Böyük Ayının "göstərici" ulduzları (Merak → Dubhe xətti ~5 dəfə uzadılır)
export const POINTERS = ['merak', 'dubhe']
