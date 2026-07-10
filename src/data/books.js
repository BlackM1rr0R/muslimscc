// ═══ BOOKS — Firebase Firestore ilə ═══
import { getAll, addDocument, updateDocument, deleteDocument, subscribeToCollection, COLLECTIONS } from '../firebase/firestore'
import { isFirebaseConfigured } from '../firebase/config'

// ═══ İSLAMİ SVG ÜZ QABIĞI GENERATORU ═══
// Şəkil linki olmayan kitablar üçün öz-özünə işləyən, sınmayan cover.
// Həndəsi İslam naxışı + hilal + mehrab tağı. Xarici asılılıq yoxdur.
function wrapTitle(t, max = 15) {
  const words = String(t || '').split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur.trim()); cur = w }
    else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur.trim())
  return lines.slice(0, 4)
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function makeCover({ title, author, color = '#10b981' }) {
  const lines = wrapTitle(title, 15)
  const startY = 235 - (lines.length - 1) * 17
  const titleTspans = lines.map((ln, i) =>
    `<tspan x='150' y='${startY + i * 34}'>${esc(ln)}</tspan>`
  ).join('')
  const gold = '#d4af37'

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='${color}'/>
      <stop offset='1' stop-color='#0b1220'/>
    </linearGradient>
    <radialGradient id='glow' cx='0.5' cy='0.32' r='0.7'>
      <stop offset='0' stop-color='#ffffff' stop-opacity='0.18'/>
      <stop offset='1' stop-color='#ffffff' stop-opacity='0'/>
    </radialGradient>
    <pattern id='stars' width='40' height='40' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
      <path d='M20 6 L23 17 L34 20 L23 23 L20 34 L17 23 L6 20 L17 17 Z' fill='#ffffff' fill-opacity='0.05'/>
    </pattern>
  </defs>

  <rect width='300' height='450' fill='url(#bg)'/>
  <rect width='300' height='450' fill='url(#stars)'/>
  <rect width='300' height='450' fill='url(#glow)'/>

  <rect x='10' y='10' width='280' height='430' fill='none' stroke='${gold}' stroke-opacity='0.75' stroke-width='2'/>
  <rect x='16' y='16' width='268' height='418' fill='none' stroke='${gold}' stroke-opacity='0.35' stroke-width='1'/>

  <!-- Hilal + ulduz -->
  <g transform='translate(150 82)'>
    <circle cx='0' cy='0' r='26' fill='${gold}'/>
    <circle cx='9' cy='-4' r='22' fill='#0b1220'/>
    <path d='M26 -3 L29 5 L37 5 L31 10 L33 18 L26 13 L19 18 L21 10 L15 5 L23 5 Z' fill='${gold}'/>
  </g>

  <!-- Mehrab tağı -->
  <path d='M70 150 Q70 120 100 120 L200 120 Q230 120 230 150 L230 300'
        fill='none' stroke='${gold}' stroke-opacity='0.25' stroke-width='1.5'/>

  <text text-anchor='middle' font-family='Georgia, "Times New Roman", serif' font-weight='700'
        font-size='27' fill='#ffffff' letter-spacing='0.3'>
    ${titleTspans}
  </text>

  <g transform='translate(150 ${startY + lines.length * 34 + 6})'>
    <line x1='-55' y1='0' x2='-14' y2='0' stroke='${gold}' stroke-opacity='0.7' stroke-width='1'/>
    <path d='M0 -6 L6 0 L0 6 L-6 0 Z' fill='${gold}'/>
    <line x1='14' y1='0' x2='55' y2='0' stroke='${gold}' stroke-opacity='0.7' stroke-width='1'/>
  </g>

  <text x='150' y='${startY + lines.length * 34 + 40}' text-anchor='middle'
        font-family='Georgia, serif' font-size='15' fill='${gold}' fill-opacity='0.95'>${esc(author)}</text>

  <g transform='translate(150 410)' fill='${gold}' fill-opacity='0.6'>
    <path d='M-24 0 L-18 -5 L-12 0 L-18 5 Z'/>
    <path d='M-6 0 L0 -5 L6 0 L0 5 Z'/>
    <path d='M12 0 L18 -5 L24 0 L18 5 Z'/>
  </g>
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// ═══ DEFAULT BOOKS (Firebase qoşulmadıqda fallback) ═══
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
    description: { az:'Salehlərin bağçaları — əxlaq və ibadətə dair seçilmiş hədislər.', en:'Gardens of the Righteous — selected hadiths on ethics and worship.', ru:'Сады праведных — избранные хадисы о морали и поклонении.', ar:'رياض الصالحين من كلام سيد المرسلين.', tr:'Salihlerin bahçeleri — ahlak ve ibadet hadisleri.' },
    category: 'hadith',
    coverUrl: '',
    pdfUrl: '',
    pages: 992,
    year: 1273,
  },
  {
    id: 'default-b4',
    title: { az:'Peyğəmbərin Həyatı (Sirə)', en:'The Sealed Nectar (Ar-Raheeq Al-Makhtum)', ru:'Жизнеописание Пророка', ar:'الرحيق المختوم', tr:'Peygamber Efendimizin Hayatı' },
    author: { az:'Safiyyur-Rəhman əl-Mubarakfuri', en:'Safiur-Rahman al-Mubarakpuri', ru:'Сафи ар-Рахман аль-Мубаракфури', ar:'صفي الرحمن المباركفوري', tr:'Safiyyurrahman Mübarekfuri' },
    description: { az:'Hz. Muhəmmədin (s.ə.s.) həyatının ən geniş və mötəbər təsviri.', en:'The most comprehensive biography of Prophet Muhammad (PBUH).', ru:'Самое полное жизнеописание Пророка Мухаммада.', ar:'أشمل سيرة للنبي محمد ﷺ.', tr:'Hz. Muhammed\'in en kapsamlı biyografisi.' },
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
    description: { az:'Mənəvi xəstəliklərin müalicəsi və qəlbin paklanması.', en:'Healing of spiritual diseases and purification of the heart.', ru:'Исцеление духовных болезней и очищение сердца.', ar:'علاج أمراض القلب وتزكيته.', tr:'Manevi hastalıkların tedavisi ve kalbin arınması.' },
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
    description: { az:'Hər müsəlmanın bilməli olduğu üç əsas: Rəbbini, dinini və Peyğəmbərini tanı.', en:'The three fundamentals every Muslim must know: knowing your Lord, your religion, and your Prophet.', ru:'Три основы, которые должен знать каждый мусульманин.', ar:'الأصول الثلاثة التي يجب على كل مسلم معرفتها.', tr:'Her müslümanın bilmesi gereken üç esas.' },
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

// Şəkli olmayan hər kitaba İslami SVG üz qabığı ver (Firestore + default)
function withCovers(items) {
  return items.map(b => b.coverUrl ? b : {
    ...b,
    coverUrl: makeCover({
      title: b.title?.az || b.title?.en,
      author: b.author?.az || b.author?.en,
      color: getDefaultCover(b.category),
    }),
  })
}

// ═══ ASYNC CRUD ═══
export async function getBooks() {
  if (!isFirebaseConfigured()) return withCovers(DEFAULT_BOOKS)
  const items = await getAll(COLLECTIONS.BOOKS)
  return withCovers(items.length > 0 ? items : DEFAULT_BOOKS)
}

export async function addBook(book) {
  return await addDocument(COLLECTIONS.BOOKS, book)
}

export async function updateBook(id, updates) {
  return await updateDocument(COLLECTIONS.BOOKS, id, updates)
}

export async function deleteBook(id) {
  return await deleteDocument(COLLECTIONS.BOOKS, id)
}

// Real-time subscriber
export function subscribeToBooks(callback) {
  return subscribeToCollection(COLLECTIONS.BOOKS, (items) => {
    callback(withCovers(items.length > 0 ? items : DEFAULT_BOOKS))
  })
}

// Default kitab cover (cover URL yoxdursa)
export function getDefaultCover(category) {
  const cat = BOOK_CATEGORIES.find(c => c.key === category)
  return cat?.color || '#10b981'
}

