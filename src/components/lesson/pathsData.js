// ═══════════════════════════════════════════════════════
// Dərs yollarının siyahısı və adları (lesson/LearningPaths, my/LearnGoalCard — H4).
// Hər yol saytdakı dərslərin ardıcıllığıdır (yeni dini mətn YOXDUR).
// ═══════════════════════════════════════════════════════
export const LEARNING_PATHS = [
  { key: 'new', icon: 'leaf', lessons: ['intro-to-islam', 'new-muslim', 'usul-ath-thalatha', 'ghusl', 'adhkar-after-salah', 'tawbah'] },
  { key: 'aqidah', icon: 'books', lessons: ['usul-ath-thalatha', 'al-qawaid-al-arba', 'nawaqid-al-islam', 'kitab-at-tawhid'] },
  { key: 'prayer', icon: 'prayer', lessons: ['ghusl', 'tayammum', 'adhkar-after-salah', 'travel-prayer', 'eid-prayer', 'kusuf-prayer', 'istisqa-prayer', 'istikhara'] },
  { key: 'seasons', icon: 'calendar', lessons: ['sunnah-fasts', 'dhul-hijjah-ten', 'udhiyah', 'kaffarah-fidyah'] },
  { key: 'family', icon: 'user', lessons: ['nikah', 'hijab', 'birr-al-walidayn', 'aqiqah', 'sick-fiqh', 'wasiyyah', 'janazah'] },
  { key: 'heart', icon: 'sparkle', lessons: ['tawbah', 'muhasabah', 'adab-al-mufrad', 'hilyat-talib-al-ilm'] },
  { key: 'knowledge', icon: 'learn', lessons: ['mustalah', 'bidah', 'doubts-youth', 'fiqh-faq'] },
]

export const P = {
  az: { new: 'Yeni müsəlman üçün', aqidah: 'Əqidənin əsasları', prayer: 'Namaz və təharət', seasons: 'İbadət mövsümləri', family: 'Ailə və həyat', heart: 'Qəlb və əxlaq', knowledge: 'Elm yolu',
    next: 'Növbəti dərs', done: 'Yolu bitirdiniz — Allah elminizi artırsın!', share: 'Kartı paylaş', saved: 'Şəkil hazırdır', of: (r, t) => `${r} / ${t} dərs`, label: 'Dərs yolları', badge: 'Dərs yolu tamamlandı' },
  en: { new: 'For new Muslims', aqidah: 'Foundations of creed', prayer: 'Prayer and purification', seasons: 'Seasons of worship', family: 'Family and life', heart: 'Heart and character', knowledge: 'The path of knowledge',
    next: 'Next lesson', done: 'Path complete — may Allah increase you in knowledge!', share: 'Share the card', saved: 'Image ready', of: (r, t) => `${r} / ${t} lessons`, label: 'Learning paths', badge: 'Learning path completed' },
  ru: { new: 'Для новых мусульман', aqidah: 'Основы вероубеждения', prayer: 'Намаз и очищение', seasons: 'Сезоны поклонения', family: 'Семья и жизнь', heart: 'Сердце и нрав', knowledge: 'Путь знания',
    next: 'Следующий урок', done: 'Путь пройден — да приумножит Аллах ваше знание!', share: 'Поделиться карточкой', saved: 'Картинка готова', of: (r, t) => `${r} / ${t} уроков`, label: 'Учебные пути', badge: 'Учебный путь пройден' },
  ar: { new: 'للمسلم الجديد', aqidah: 'أصول العقيدة', prayer: 'الصلاة والطهارة', seasons: 'مواسم العبادة', family: 'الأسرة والحياة', heart: 'القلب والأخلاق', knowledge: 'طريق العلم',
    next: 'الدرس التالي', done: 'أتممت المسار — زادك الله علمًا!', share: 'شارك البطاقة', saved: 'الصورة جاهزة', of: (r, t) => `${r} / ${t} دروس`, label: 'مسارات التعلم', badge: 'أُتمّ مسار التعلم' },
  tr: { new: 'Yeni Müslümanlar için', aqidah: 'Akidenin esasları', prayer: 'Namaz ve taharet', seasons: 'İbadet mevsimleri', family: 'Aile ve hayat', heart: 'Kalp ve ahlak', knowledge: 'İlim yolu',
    next: 'Sonraki ders', done: 'Yolu tamamladınız — Allah ilminizi artırsın!', share: 'Kartı paylaş', saved: 'Görsel hazır', of: (r, t) => `${r} / ${t} ders`, label: 'Ders yolları', badge: 'Ders yolu tamamlandı' },
}
