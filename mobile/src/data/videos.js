// Default videolar (mobile-da statik, gələcəkdə API ilə yenilənə bilər)
export const VIDEOS = [
  {
    id: 1,
    title: {
      az: 'Quran Tilavəti — Sura Yasin',
      en: 'Quran Recitation — Surah Yasin',
      ru: 'Чтение Корана — Сура Ясин',
      ar: 'تلاوة القرآن — سورة يس',
      tr: 'Kuran Tilaveti — Yasin Suresi',
    },
    description: {
      az: 'Mişari Raşid əl-Əfasinin gözəl tilavətində',
      en: 'In the beautiful recitation of Mishari Rashid Alafasy',
      ru: 'В чтении Мишари Рашида аль-Афаси',
      ar: 'بصوت مشاري راشد العفاسي',
      tr: 'Mişari Raşid el-Afasi tilavetiyle',
    },
    youtubeId: '9w3vw02P77U',
    category: 'quran',
    duration: '20:15',
  },
  {
    id: 2,
    title: {
      az: 'Hz. Peyğəmbərin ﷺ Həyatı',
      en: 'Life of Prophet Muhammad ﷺ',
      ru: 'Жизнь Пророка Мухаммада ﷺ',
      ar: 'حياة النبي محمد ﷺ',
      tr: 'Hz. Muhammed ﷺ\'in Hayatı',
    },
    description: {
      az: 'Doğumundan vəfatına qədər',
      en: 'From birth to passing',
      ru: 'От рождения до смерти',
      ar: 'من المولد إلى الوفاة',
      tr: 'Doğumundan vefatına',
    },
    youtubeId: 'WcKE7nVtKxw',
    category: 'lecture',
    duration: '45:30',
  },
  {
    id: 3,
    title: {
      az: 'Namaz Necə Qılınır',
      en: 'How to Pray Salah',
      ru: 'Как совершать намаз',
      ar: 'كيفية أداء الصلاة',
      tr: 'Namaz Nasıl Kılınır',
    },
    description: {
      az: 'Addım-addım bələdçi',
      en: 'Step-by-step guide',
      ru: 'Пошаговое руководство',
      ar: 'دليل خطوة بخطوة',
      tr: 'Adım adım rehber',
    },
    youtubeId: 'kWGy_lt0vyM',
    category: 'lecture',
    duration: '12:45',
  },
  {
    id: 4,
    title: {
      az: 'Səhər və Axşam Əzkarı',
      en: 'Morning & Evening Adhkar',
      ru: 'Утренние и вечерние азкары',
      ar: 'أذكار الصباح والمساء',
      tr: 'Sabah ve Akşam Ezkarı',
    },
    description: {
      az: 'Qoruyucu dualar',
      en: 'Protective remembrances',
      ru: 'Защитные поминания',
      ar: 'الأذكار الواقية',
      tr: 'Koruyucu zikirler',
    },
    youtubeId: 'oRzwFsNm9zk',
    category: 'dua',
    duration: '15:20',
  },
  {
    id: 5,
    title: {
      az: 'İslamın 5 Şərti',
      en: 'The 5 Pillars of Islam',
      ru: '5 Столпов Ислама',
      ar: 'أركان الإسلام',
      tr: 'İslamın 5 Şartı',
    },
    description: {
      az: 'Şəhadət, namaz, oruc, zəkat, həcc',
      en: 'Shahada, Salah, Sawm, Zakat, Hajj',
      ru: 'Шахада, намаз, пост, закят, хадж',
      ar: 'الشهادة والصلاة والصوم والزكاة والحج',
      tr: 'Şehadet, namaz, oruç, zekat, hac',
    },
    youtubeId: 'Q4uZ4hgZwS4',
    category: 'lecture',
    duration: '28:10',
  },
  {
    id: 6,
    title: {
      az: 'Ramazan Ayının Fəziləti',
      en: 'Virtue of Ramadan',
      ru: 'Достоинство Рамадана',
      ar: 'فضل رمضان',
      tr: 'Ramazan Fazileti',
    },
    description: {
      az: 'Mübarək ayın əhəmiyyəti',
      en: 'Importance of the blessed month',
      ru: 'Важность благословенного месяца',
      ar: 'أهمية الشهر المبارك',
      tr: 'Mübarek ayın önemi',
    },
    youtubeId: 'YyYpbCXdaDg',
    category: 'lecture',
    duration: '32:50',
  },
];

export const VIDEO_CATEGORIES = [
  { key:'all', label:{az:'Hamısı',en:'All',ru:'Все',ar:'الكل',tr:'Tümü'}, color:'#64748b' },
  { key:'quran', label:{az:'Quran',en:'Quran',ru:'Коран',ar:'القرآن',tr:'Kuran'}, color:'#10b981' },
  { key:'hadith', label:{az:'Hədis',en:'Hadith',ru:'Хадис',ar:'الحديث',tr:'Hadis'}, color:'#f59e0b' },
  { key:'lecture', label:{az:'Mühazirə',en:'Lecture',ru:'Лекция',ar:'محاضرة',tr:'Konferans'}, color:'#3b82f6' },
  { key:'dua', label:{az:'Dua',en:'Dua',ru:'Дуа',ar:'دعاء',tr:'Dua'}, color:'#8b5cf6' },
  { key:'nasheed', label:{az:'Nəşid',en:'Nasheed',ru:'Нашид',ar:'نشيد',tr:'İlahi'}, color:'#ec4899' },
];

export function getThumbnail(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getVideoUrl(youtubeId) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
