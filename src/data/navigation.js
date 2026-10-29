// ═══════════════════════════════════════════════════════
// Muslims.cc — sayt naviqasiyasının YEGANƏ mənbəyi
//
// Kim oxuyur:
//   • SideNav.jsx       — soldan açılan bölmələr paneli (kateqoriyalar)
//   • Header.jsx        — geniş ekranda üst sətirdəki linklər (PRIMARY_NAV + SHORT_LABELS)
//   • GlobalSearch.jsx  — "sayt bölmələri" axtarışı (navLabel / NAV_ITEMS)
//
// Qayda: src/seo/routes.js-dəki HƏR indekslənən marşrut burada DƏQİQ BİR
// qrupda olmalıdır (admin marşrutları heç vaxt). Yeni səhifə əlavə edəndə
// routes.js-dən sonra buraya da bir sətir yaz.
//
// Etiketlər mümkün qədər Header.jsx-in köhnə menyusundan götürülüb; yalnız
// paneldə qarışıq düşə biləcək qısa adlar aydınlaşdırılıb (məs. "Namaz" →
// "Namaz təqvimi", "Məscidlər" → "Yaxınlıqdakı məscidlər", "Təqvim" →
// "İslami təqvim"), ikonlar isə panel daxilində təkrarlanmasın deyə seçilib.
// ═══════════════════════════════════════════════════════

import { BRAND } from '../config/brand.js'

// ── Qruplar ──────────────────────────────────────────
// key   — qrupun daxili adı (localStorage-da açıq qrupları yadda saxlamaq üçün)
// icon  — başlıq ikonu (emoji)
// label — 5 dildə qrup adı
// items — [{ key /* routes.js marşrut açarı */, icon, label }]
export const NAV_GROUPS = [
  {
    // "Əsas" — gündəlik ən çox lazım olan bölmələr (əvvəlki "Məscid" qrupu)
    key: 'main',
    icon: '⭐',
    label: { az: 'Əsas', en: 'Main', ru: 'Главное', ar: 'الرئيسية', tr: 'Ana Menü' },
    items: [
      { key: 'home', icon: '🏠',
        label: { az: 'Ana səhifə', en: 'Home', ru: 'Главная', ar: 'الصفحة الرئيسية', tr: 'Ana Sayfa' } },
      { key: 'prayer', icon: '🕐',
        label: { az: 'Namaz vaxtları', en: 'Prayer Times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz Vakitleri' } },
      { key: 'ramadan', icon: '🌙',
        label: { az: 'İmsakiyyə', en: 'Ramadan Timetable', ru: 'Расписание на Рамадан', ar: 'إمساكية رمضان', tr: 'İmsakiye' } },
      { key: 'jamaat', icon: '🤝',
        label: { az: 'Camaat və cümə', en: 'Congregation & Friday', ru: 'Джамаат и Джума', ar: 'الجماعة والجمعة', tr: 'Cemaat ve Cuma' } },
      { key: 'announcements', icon: '📢',
        label: { az: 'Elanlar', en: 'Announcements', ru: 'Объявления', ar: 'الإعلانات', tr: 'Duyurular' } },
      { key: 'donate', icon: '💝',
        label: { az: 'Xeyriyyə və ianə', en: 'Charity & Giving', ru: 'Благотворительность', ar: 'الصدقة والتبرع', tr: 'Hayır ve Bağış' } },
    ],
  },
  {
    key: 'quran',
    icon: '📖',
    label: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: "Kur'an" },
    items: [
      { key: 'quran', icon: '📖',
        label: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: "Kur'an" } },
      { key: 'hifz', icon: '📝',
        label: { az: 'Hifz', en: 'Hifz', ru: 'Хифз', ar: 'الحفظ', tr: 'Hıfz' } },
      { key: 'qurangame', icon: '🎮',
        label: { az: 'Quran oyunu', en: 'Quran Game', ru: 'Игра по Корану', ar: 'لعبة القرآن', tr: 'Kuran Oyunu' } },
      { key: 'analytics', icon: '📊',
        label: { az: 'Oxu statistikası', en: 'Reading Stats', ru: 'Статистика чтения', ar: 'إحصائيات القراءة', tr: 'Okuma İstatistikleri' } },
    ],
  },
  {
    key: 'knowledge',
    icon: '📚',
    label: { az: 'Hədis və bilik', en: 'Hadith & Knowledge', ru: 'Хадисы и знания', ar: 'الحديث والمعرفة', tr: 'Hadis ve Bilgi' },
    items: [
      { key: 'hadith', icon: '📚',
        label: { az: 'Hədis', en: 'Hadith', ru: 'Хадисы', ar: 'الحديث', tr: 'Hadis' } },
      { key: 'sahaba', icon: '🏅',
        label: { az: 'Səhabələr', en: 'Companions', ru: 'Сахабы', ar: 'الصحابة', tr: 'Sahabeler' } },
      { key: 'history', icon: '📜',
        label: { az: 'İslam tarixi', en: 'Islamic History', ru: 'История ислама', ar: 'التاريخ الإسلامي', tr: 'İslam Tarihi' } },
      { key: 'glossary', icon: '🔤',
        label: { az: 'Lüğət', en: 'Glossary', ru: 'Словарь', ar: 'المعجم', tr: 'Sözlük' } },
      { key: 'books', icon: '📗',
        label: { az: 'Kitablar', en: 'Books', ru: 'Книги', ar: 'الكتب', tr: 'Kitaplar' } },
      { key: 'videos', icon: '📹',
        label: { az: 'Videolar', en: 'Videos', ru: 'Видео', ar: 'الفيديوهات', tr: 'Videolar' } },
    ],
  },
  {
    key: 'worship',
    icon: '🌙',
    label: { az: 'Namaz və ibadət', en: 'Prayer & Worship', ru: 'Намаз и поклонение', ar: 'الصلاة والعبادة', tr: 'Namaz ve İbadet' },
    items: [
      { key: 'prayerguide', icon: '🎓',
        label: { az: 'Namaz öyrən', en: 'Learn Prayer', ru: 'Учись молиться', ar: 'تعلم الصلاة', tr: 'Namaz Öğren' } },
      { key: 'qibla', icon: '🧭',
        label: { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' } },
      { key: 'calendar', icon: '📅',
        label: { az: 'İslami təqvim', en: 'Islamic Calendar', ru: 'Исламский календарь', ar: 'التقويم الهجري', tr: 'İslami Takvim' } },
      { key: 'dailytracker', icon: '📋',
        label: { az: 'Gündəlik ibadət', en: 'Daily Worship', ru: 'Трекер ибадата', ar: 'العبادات اليومية', tr: 'Günlük İbadet' } },
    ],
  },
  {
    key: 'duas',
    icon: '🤲',
    label: { az: 'Dua və zikr', en: "Du'a & Dhikr", ru: 'Дуа и зикр', ar: 'الدعاء والذكر', tr: 'Dua ve Zikir' },
    items: [
      { key: 'duas', icon: '🤲',
        label: { az: 'Dualar', en: "Du'as", ru: 'Дуа', ar: 'الأدعية', tr: 'Dualar' } },
      { key: 'dhikr', icon: '📿',
        label: { az: 'Zikr', en: 'Dhikr', ru: 'Зикр', ar: 'الذكر', tr: 'Zikir' } },
      { key: 'names', icon: '⭐',
        label: { az: 'Allahın 99 adı', en: '99 Names of Allah', ru: '99 имён Аллаха', ar: 'أسماء الله الحسنى', tr: "Allah'ın 99 İsmi" } },
      { key: 'duajournal', icon: '📓',
        label: { az: 'Dua gündəliyi', en: 'Dua Journal', ru: 'Дневник дуа', ar: 'مذكرة الدعاء', tr: 'Dua Günlüğü' } },
    ],
  },
  {
    key: 'hajj',
    icon: '🕋',
    label: { az: 'Həcc və müqəddəs yerlər', en: 'Hajj & Holy Places', ru: 'Хадж и святые места', ar: 'الحج والأماكن المقدسة', tr: 'Hac ve Kutsal Yerler' },
    items: [
      { key: 'hajjguide', icon: '🕋',
        label: { az: 'Həcc və ümrə', en: 'Hajj & Umrah', ru: 'Хадж и умра', ar: 'الحج والعمرة', tr: 'Hac ve Umre' } },
      { key: 'holyplaces', icon: '🏛️',
        label: { az: 'Müqəddəs yerlər', en: 'Holy Places', ru: 'Святые места', ar: 'الأماكن المقدسة', tr: 'Kutsal Yerler' } },
      { key: 'mosques', icon: '📍',
        label: { az: 'Yaxınlıqdakı məscidlər', en: 'Mosques Near Me', ru: 'Мечети рядом', ar: 'المساجد القريبة', tr: 'Yakındaki Camiler' } },
    ],
  },
  {
    key: 'giving',
    icon: '💰',
    label: { az: 'Zəkat və sədəqə', en: 'Zakat & Charity', ru: 'Закят и садака', ar: 'الزكاة والصدقة', tr: 'Zekât ve Sadaka' },
    items: [
      { key: 'zakat', icon: '💰',
        label: { az: 'Zəkat', en: 'Zakat', ru: 'Закят', ar: 'الزكاة', tr: 'Zekât' } },
      { key: 'charity', icon: '💚',
        label: { az: 'Sədəqə gündəliyi', en: 'Sadaqah Journal', ru: 'Дневник садаки', ar: 'سجل الصدقات', tr: 'Sadaka Günlüğü' } },
    ],
  },
  {
    key: 'other',
    icon: '🧩',
    label: { az: 'Digər', en: 'More', ru: 'Другое', ar: 'أخرى', tr: 'Diğer' },
    items: [
      { key: 'aichat', icon: '🤖', label: BRAND.aiName },
      { key: 'quiz', icon: '❓',
        label: { az: 'Kviz', en: 'Quiz', ru: 'Викторина', ar: 'اختبار', tr: 'Bilgi Yarışması' } },
      { key: 'quotes', icon: '🖼️',
        label: { az: 'Sitatlar', en: 'Quotes', ru: 'Цитаты', ar: 'اقتباسات', tr: 'Alıntılar' } },
      { key: 'kids', icon: '🎈',
        label: { az: 'Uşaqlar', en: 'Kids', ru: 'Дети', ar: 'الأطفال', tr: 'Çocuklar' } },
      { key: 'about', icon: 'ℹ️',
        label: { az: 'Haqqımızda', en: 'About', ru: 'О нас', ar: 'عن الموقع', tr: 'Hakkımızda' } },
    ],
  },
]

// Başlığın ortasında (900px-dən geniş ekranda) görünən linklər — sahibin
// tələbi ilə YALNIZ bu beşi: Quran · Namaz · Hədis · AI · Haqqımızda.
// "Ana səhifə" linki yoxdur (loqo ana səhifəyə aparır); "Əsas" qrupunun
// bölmələri yan paneldə və ana səhifədədir. Qalan hər şey SideNav panelindədir.
export const PRIMARY_NAV = ['quran', 'prayer', 'hadith', 'aichat', 'about']

// Başlıq üçün QISA adlar — panel isə öz tam adlarını (NAV_GROUPS) saxlayır
export const SHORT_LABELS = {
  quran:  { az: 'Quran',      en: 'Quran',  ru: 'Коран',  tr: 'Kuran',      ar: 'القرآن' },
  prayer: { az: 'Namaz',      en: 'Prayer', ru: 'Намаз',  tr: 'Namaz',      ar: 'الصلاة' },
  hadith: { az: 'Hədis',      en: 'Hadith', ru: 'Хадисы', tr: 'Hadis',      ar: 'الحديث' },
  // ərəbcədə latın 'AI' yox — yan panel və footer ilə eyni ad (BRAND.aiName.ar)
  aichat: { az: 'AI',         en: 'AI',     ru: 'ИИ',     tr: 'AI',         ar: 'المساعد الذكي' },
  about:  { az: 'Haqqımızda', en: 'About',  ru: 'О нас',  tr: 'Hakkımızda', ar: 'من نحن' },
}

// ── Köməkçilər ───────────────────────────────────────

/** Bütün elementlərin düz siyahısı — hər birində qrup açarı ilə (axtarış üçün). */
export const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items.map(item => ({ ...item, group: g.key })))

const ITEM_BY_KEY = Object.fromEntries(NAV_ITEMS.map(item => [item.key, item]))

// Hər etiketdə 5 dilin hamısı var; əskik olsa ingiliscəyə düşür (azərbaycanca
// mətn başqa dilin səhifəsinə "sızmasın")
function pick(label, lang) {
  if (!label) return ''
  return label[lang] || label.en || label.az || ''
}

/** İstənilən marşrut açarının cari dildəki adı. */
export function navLabel(key, lang = 'az') {
  const item = ITEM_BY_KEY[key]
  return item ? pick(item.label, lang) : ''
}

/** Başlıq üçün qısa ad (SHORT_LABELS); yoxdursa panel adı. */
export function navShortLabel(key, lang = 'az') {
  return pick(SHORT_LABELS[key], lang) || navLabel(key, lang)
}

/** Marşrut açarının ikonu ('' — tanınmırsa). */
export function navIcon(key) {
  return ITEM_BY_KEY[key]?.icon || ''
}

/** Marşrut hansı qrupdadır? (qrup açarı və ya null) */
export function navGroupOf(key) {
  return ITEM_BY_KEY[key]?.group || null
}

/** Qrupun cari dildəki adı. */
export function navGroupLabel(groupKey, lang = 'az') {
  const group = NAV_GROUPS.find(g => g.key === groupKey)
  return group ? pick(group.label, lang) : ''
}
