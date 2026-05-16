// ═══ BOOKS — Firebase real-time + default fallback ═══
import { getAll, subscribeToCollection, COLLECTIONS } from '../firebase/firestore'
import { isFirebaseConfigured } from '../firebase/config'

// Firebase real-time subscription
export function subscribeToBooks(callback) {
  return subscribeToCollection(COLLECTIONS.BOOKS, (items) => {
    callback(items.length > 0 ? items : DEFAULT_BOOKS)
  })
}

// Async fetch (admin əlavə etməyibsə default-lar qayıdır)
export async function getBooks() {
  if (!isFirebaseConfigured()) return DEFAULT_BOOKS
  const items = await getAll(COLLECTIONS.BOOKS)
  return items.length > 0 ? items : DEFAULT_BOOKS
}

// ═══ DEFAULT BOOKS (Firebase boşdursa fallback) ═══
export const DEFAULT_BOOKS = [
  {
    id: 'default-b1',
    title: { az:'Qurani-Kərim (Tərcümə)', en:'The Holy Quran (Translation)', ru:'Священный Коран', ar:'القرآن الكريم', tr:'Kuran-ı Kerim' },
    author: { az:'Ziya Bünyadov & Vasim Məmmədəliyev', en:'Saheeh International', ru:'Эльмир Кулиев', ar:'—', tr:'Diyanet İşleri' },
    description: { az:'Allahın kəlamı — Qurani-Kərimin tam tərcüməsi və təfsiri.', en:'The word of Allah — full translation and tafsir of the Holy Quran.', ru:'Слово Аллаха — полный перевод и тафсир Корана.', ar:'كلام الله — الترجمة الكاملة والتفسير.', tr:'Allah\'ın sözü — Kuran-ı Kerim\'in tam çevirisi ve tefsiri.' },
    category: 'quran',
    coverUrl: '',
    pdfUrl: '',
    pages: 604,
    year: 1973,
  },
  {
    id: 'default-b2',
    title: { az:'Səhih əl-Buxari', en:'Sahih al-Bukhari', ru:'Сахих аль-Бухари', ar:'صحيح البخاري', tr:'Sahih-i Buhari' },
    author: { az:'İmam Muhəmməd əl-Buxari', en:'Imam Muhammad al-Bukhari', ru:'Имам аль-Бухари', ar:'الإمام البخاري', tr:'İmam Buhari' },
    description: { az:'İslamda Qurandan sonra ən mötəbər hədis toplusu.', en:'The most authentic hadith collection after the Quran.', ru:'Самый достоверный сборник хадисов после Корана.', ar:'أصح كتب الحديث بعد القرآن.', tr:'Kuran\'dan sonra en sahih hadis kitabı.' },
    category: 'hadith',
    coverUrl: '',
    pdfUrl: '',
    pages: 1860,
    year: 846,
  },
  {
    id: 'default-b3',
    title: { az:'Riyazüs-Salihin', en:'Riyad as-Salihin', ru:'Рияд ас-Салихин', ar:'رياض الصالحين', tr:'Riyazü\'s-Salihin' },
    author: { az:'İmam Nəvəvi', en:'Imam an-Nawawi', ru:'Имам ан-Навави', ar:'الإمام النووي', tr:'İmam Nevevi' },
    description: { az:'Salehlərin bağçaları — əxlaq və ibadətə dair seçilmiş hədislər.', en:'Gardens of the Righteous — selected hadiths on ethics and worship.', ru:'Сады праведных — избранные хадисы.', ar:'رياض الصالحين من كلام سيد المرسلين.', tr:'Salihlerin bahçeleri.' },
    category: 'hadith',
    coverUrl: '',
    pdfUrl: '',
    pages: 992,
    year: 1273,
  },
  {
    id: 'default-b4',
    title: { az:'Peyğəmbərin Həyatı (Sirə)', en:'The Sealed Nectar', ru:'Жизнеописание Пророка', ar:'الرحيق المختوم', tr:'Peygamberin Hayatı' },
    author: { az:'Safiyyur-Rəhman əl-Mubarakfuri', en:'Safiur-Rahman al-Mubarakpuri', ru:'Сафи ар-Рахман аль-Мубаракфури', ar:'صفي الرحمن المباركفوري', tr:'Safiyyurrahman Mübarekfuri' },
    description: { az:'Hz. Muhəmmədin həyatının ən geniş və mötəbər təsviri.', en:'The most comprehensive biography of Prophet Muhammad.', ru:'Самое полное жизнеописание Пророка.', ar:'أشمل سيرة للنبي ﷺ.', tr:'Hz. Muhammed\'in en kapsamlı biyografisi.' },
    category: 'biography',
    coverUrl: '',
    pdfUrl: '',
    pages: 580,
    year: 1979,
  },
  {
    id: 'default-b5',
    title: { az:'Qəlblərin Həyatı', en:'The Disease and the Cure', ru:'Болезнь и исцеление', ar:'الداء والدواء', tr:'Kalplerin Hayatı' },
    author: { az:'İbn Qəyyim əl-Cövziyyə', en:'Ibn Qayyim al-Jawziyya', ru:'Ибн Каййим аль-Джаузия', ar:'ابن قيم الجوزية', tr:'İbn Kayyim el-Cevziyye' },
    description: { az:'Mənəvi xəstəliklərin müalicəsi və qəlbin paklanması.', en:'Healing of spiritual diseases and purification of the heart.', ru:'Исцеление духовных болезней.', ar:'علاج أمراض القلب.', tr:'Manevi hastalıkların tedavisi.' },
    category: 'tasawwuf',
    coverUrl: '',
    pdfUrl: '',
    pages: 432,
    year: 1340,
  },
  {
    id: 'default-b6',
    title: { az:'Üç Əsas (Üsulu Səlasə)', en:'The Three Fundamental Principles', ru:'Три основы', ar:'الأصول الثلاثة', tr:'Üç Esas' },
    author: { az:'Şeyx Muhəmməd ibn Əbdülvəhhab', en:'Sheikh Muhammad ibn Abdul-Wahhab', ru:'Шейх Мухаммад ибн Абдуль-Ваххаб', ar:'الشيخ محمد بن عبد الوهاب', tr:'Şeyh Muhammed b. Abdülvehhab' },
    description: { az:'Hər müsəlmanın bilməli olduğu üç əsas.', en:'The three fundamentals every Muslim must know.', ru:'Три основы каждого мусульманина.', ar:'الأصول الثلاثة.', tr:'Her müslümanın bilmesi gereken üç esas.' },
    category: 'aqida',
    coverUrl: '',
    pdfUrl: '',
    pages: 48,
    year: 1780,
  },
]

export const BOOK_CATEGORIES = [
  { key:'all',       label:{az:'Hamısı',en:'All',ru:'Все',ar:'الكل',tr:'Tümü'}, color:'#64748b' },
  { key:'quran',     label:{az:'Quran',en:'Quran',ru:'Коран',ar:'القرآن',tr:'Kuran'}, color:'#10b981' },
  { key:'hadith',    label:{az:'Hədis',en:'Hadith',ru:'Хадис',ar:'الحديث',tr:'Hadis'}, color:'#f59e0b' },
  { key:'fiqh',      label:{az:'Fiqh',en:'Fiqh',ru:'Фикх',ar:'الفقه',tr:'Fıkıh'}, color:'#3b82f6' },
  { key:'aqida',     label:{az:'Əqidə',en:'Aqida',ru:'Акыда',ar:'العقيدة',tr:'Akide'}, color:'#8b5cf6' },
  { key:'biography', label:{az:'Sirə',en:'Biography',ru:'Сира',ar:'السيرة',tr:'Siret'}, color:'#ec4899' },
  { key:'tasawwuf',  label:{az:'Təzkiyə',en:'Tazkiyah',ru:'Тасаввуф',ar:'التزكية',tr:'Tasavvuf'}, color:'#06b6d4' },
  { key:'history',   label:{az:'Tarix',en:'History',ru:'История',ar:'التاريخ',tr:'Tarih'}, color:'#a16207' },
  { key:'tafsir',    label:{az:'Təfsir',en:'Tafsir',ru:'Тафсир',ar:'التفسير',tr:'Tefsir'}, color:'#dc2626' },
  { key:'kids',      label:{az:'Uşaqlar',en:'Kids',ru:'Дети',ar:'الأطفال',tr:'Çocuk'}, color:'#f97316' },
]
