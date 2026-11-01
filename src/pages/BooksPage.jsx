import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { BOOK_CATEGORIES, DEFAULT_BOOKS, subscribeToBooks, getDefaultCover } from '../data/books'
import useInfiniteList, { useSessionState } from '../hooks/useInfiniteList'
import ListMore from '../components/ListMore'
import BackToTop from '../components/BackToTop'
import { useBackToClose } from '../utils/useBackToClose'
import { useSheetDrag } from '../hooks/useSheetDrag'
import Icon from '../components/Icon'
import { ChartFigure, BarChart } from '../components/viz'
import RelatedLinks from '../components/media/RelatedLinks'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import { useNavigate } from 'react-router-dom'
import '../styles/BooksPage.css'
import StarButton from '../components/collect/StarButton'
import useStarred from '../components/collect/useStarred'
// Admin məzmunu cari dildə yoxdursa başqa dilə düşmür (bax: utils/pickLang)
import { pickLang, hasLang } from '../utils/pickLang'

// ── v3.2: seçilmiş kitablar (ulduz, localStorage) — 5 dil ──
const BP32 = {
  az: { favs: 'Seçilmişlər', favAdd: 'Seçilmişlərə əlavə et', favNone: 'Hələ seçilmiş kitab yoxdur — kartdakı ulduza toxunun.' },
  en: { favs: 'Saved', favAdd: 'Save book', favNone: 'No saved books yet — tap the star on a card.' },
  ru: { favs: 'Избранное', favAdd: 'В избранное', favNone: 'В избранном пока нет книг — нажмите звёздочку на карточке.' },
  ar: { favs: 'المحفوظة', favAdd: 'احفظ الكتاب', favNone: 'لا توجد كتب محفوظة بعد — اضغط النجمة على البطاقة.' },
  tr: { favs: 'Kaydedilenler', favAdd: 'Kitabı kaydet', favNone: 'Henüz kaydedilen kitap yok — karttaki yıldıza dokunun.' },
}

const LABELS = {
  az: { how:'Kartı seçin — kitab haqqında qısa məlumat və (varsa) PDF açılır. Bölmə çipləri siyahını daraldır.', statCats:'bölmə', statPdf:'PDF ilə', chartTitle:'Bölmələr üzrə kitablar', chartSub:'kitab sayı', pathEyebrow:'Haradan başlamalı?', pathTitle:'Başlanğıc üçün oxu yolu', pathLead:'Alimlərin tələbəyə tövsiyə etdiyi klassik ardıcıllıq: qısa mətndən geniş əsərə. Müəllifin adına toxunsanız, həyatı açılır.', relEyebrow:'Davamı', relTitle:'Əlaqəli bölmələr', eyebrow:'Hədis və bilik', title:'Kitabxana', subtitle:'İslami kitablar, təfsirlər və elm əsərləri', search:'Kitab axtar...', filter:'Filtr', featured:'Seçilmiş kitablar', allBooks:'Bütün kitablar', moreBooks:'Digər kitablar', noResults:'Kitab tapılmadı', loading:'Yüklənir...', books:'kitab', author:'Müəllif', read:'Oxu', preview:'Önizlə', readPdf:'PDF açın', noPdf:'PDF mövcud deyil', pages:'səhifə', year:'İl', share:'Paylaş', shared:'Kopyalandı!', close:'Bağla', clear:'Təmizlə' },
  en: { how:'Pick a card to open a short description and the PDF (if available). Category chips narrow the list.', statCats:'categories', statPdf:'with PDF', chartTitle:'Books by category', chartSub:'number of books', pathEyebrow:'Where to start?', pathTitle:'A reading path for beginners', pathLead:'The classical order scholars recommend to students: from short texts to larger works. Tap an author’s name to read their biography.', relEyebrow:'Continue', relTitle:'Related sections', eyebrow:'Hadith & knowledge', title:'Library', subtitle:'Islamic books, tafsirs and scholarly works', search:'Search books...', filter:'Filter', featured:'Featured Books', allBooks:'All Books', moreBooks:'More books', noResults:'No books found', loading:'Loading...', books:'books', author:'Author', read:'Read', preview:'Preview', readPdf:'Open PDF', noPdf:'PDF not available', pages:'pages', year:'Year', share:'Share', shared:'Copied!', close:'Close', clear:'Clear' },
  ru: { how:'Выберите карточку — откроется краткое описание и PDF (если есть). Чипы разделов сужают список.', statCats:'разделов', statPdf:'с PDF', chartTitle:'Книги по разделам', chartSub:'число книг', pathEyebrow:'С чего начать?', pathTitle:'Путь чтения для начинающих', pathLead:'Классический порядок, который учёные советуют ученикам: от кратких текстов к большим трудам. Нажмите на имя автора, чтобы открыть его биографию.', relEyebrow:'Дальше', relTitle:'Связанные разделы', eyebrow:'Хадисы и знание', title:'Библиотека', subtitle:'Исламские книги, тафсиры и научные труды', search:'Поиск книг...', filter:'Фильтр', featured:'Избранные книги', allBooks:'Все книги', moreBooks:'Другие книги', noResults:'Книги не найдены', loading:'Загрузка...', books:'книг', author:'Автор', read:'Читать', preview:'Просмотр', readPdf:'Открыть PDF', noPdf:'PDF недоступен', pages:'страниц', year:'Год', share:'Поделиться', shared:'Скопировано!', close:'Закрыть', clear:'Очистить' },
  ar: { how:'اختر بطاقة لتظهر نبذة عن الكتاب وملف PDF إن وُجد. أزرار الأقسام تضيّق القائمة.', statCats:'أقسام', statPdf:'بصيغة PDF', chartTitle:'الكتب حسب الأقسام', chartSub:'عدد الكتب', pathEyebrow:'من أين تبدأ؟', pathTitle:'طريق القراءة للمبتدئ', pathLead:'الترتيب الذي يوصي به العلماء طلابهم: من المتون المختصرة إلى الكتب المطولة. اضغط على اسم المؤلف لتقرأ سيرته.', relEyebrow:'للمتابعة', relTitle:'أقسام ذات صلة', eyebrow:'الحديث والعلم', title:'المكتبة', subtitle:'كتب إسلامية وتفاسير وأعمال علمية', search:'البحث عن كتاب...', filter:'تصفية', featured:'كتب مميزة', allBooks:'كل الكتب', moreBooks:'كتب أخرى', noResults:'لا توجد كتب', loading:'جارٍ التحميل...', books:'كتاب', author:'المؤلف', read:'اقرأ', preview:'معاينة', readPdf:'فتح PDF', noPdf:'PDF غير متاح', pages:'صفحة', year:'السنة', share:'مشاركة', shared:'تم النسخ!', close:'إغلاق', clear:'مسح' },
  tr: { how:'Bir kart seçin — kitap hakkında kısa bilgi ve (varsa) PDF açılır. Bölüm çipleri listeyi daraltır.', statCats:'bölüm', statPdf:'PDF’li', chartTitle:'Bölümlere göre kitaplar', chartSub:'kitap sayısı', pathEyebrow:'Nereden başlamalı?', pathTitle:'Yeni başlayanlar için okuma yolu', pathLead:'Âlimlerin talebelere tavsiye ettiği klasik sıra: kısa metinden geniş esere. Yazarın adına dokunursanız hayatı açılır.', relEyebrow:'Devamı', relTitle:'İlgili bölümler', eyebrow:'Hadis ve ilim', title:'Kütüphane', subtitle:'İslami kitaplar, tefsirler ve ilmi eserler', search:'Kitap ara...', filter:'Filtre', featured:'Öne Çıkan Kitaplar', allBooks:'Tüm Kitaplar', moreBooks:'Diğer kitaplar', noResults:'Kitap bulunamadı', loading:'Yükleniyor...', books:'kitap', author:'Yazar', read:'Oku', preview:'Önizle', readPdf:'PDF aç', noPdf:'PDF mevcut değil', pages:'sayfa', year:'Yıl', share:'Paylaş', shared:'Kopyalandı!', close:'Kapat', clear:'Temizle' },
}


// "Başlanğıc üçün oxu yolu" — klassik mətnlər (müəllif → /scholars profili
// və ya saytdakı bölmə). Kitabların özü başqa yerdə təkrarlanmır.
const READING_PATH = [
  { title: { az: 'Üç əsas (əl-Üsulus-Səlasə)', en: 'The Three Fundamental Principles', ru: 'Три основы', ar: 'الأصول الثلاثة', tr: 'Üç Esas (el-Usûlü’s-Selâse)' },
    text: { az: 'Rəbbini, dinini və Peyğəmbərini ﷺ tanımaq — hər müsəlmanın ilk dərsi.', en: 'Knowing your Lord, your religion and your Prophet ﷺ — every Muslim’s first lesson.', ru: 'Знание своего Господа, своей религии и своего Пророка ﷺ — первый урок каждого мусульманина.', ar: 'معرفة العبد ربه ودينه ونبيه ﷺ — أول درس لكل مسلم.', tr: 'Rabbini, dinini ve Peygamberini ﷺ tanımak — her Müslümanın ilk dersi.' },
    author: { az: 'Muhəmməd ibn Əbdülvəhhab', en: 'Muhammad ibn Abd al-Wahhab', ru: 'Мухаммад ибн Абд аль-Ваххаб', ar: 'محمد بن عبد الوهاب', tr: 'Muhammed b. Abdülvehhâb' }, slug: 'muhammad-ibn-abd-al-wahhab' },
  { title: { az: 'Kitabut-Tövhid', en: 'Kitab at-Tawhid', ru: 'Книга единобожия', ar: 'كتاب التوحيد', tr: 'Kitâbü’t-Tevhîd' },
    text: { az: 'Tövhidin mənası və onu pozan şeylər — ayə və hədislərlə, fəsil-fəsil.', en: 'The meaning of tawhid and what nullifies it — chapter by chapter, with verses and hadiths.', ru: 'Смысл единобожия и то, что его нарушает, — по главам, с аятами и хадисами.', ar: 'معنى التوحيد وما ينافيه — بابًا بابًا بالآيات والأحاديث.', tr: 'Tevhidin anlamı ve onu bozan şeyler — bölüm bölüm, ayet ve hadislerle.' },
    author: { az: 'Muhəmməd ibn Əbdülvəhhab', en: 'Muhammad ibn Abd al-Wahhab', ru: 'Мухаммад ибн Абд аль-Ваххаб', ar: 'محمد بن عبد الوهاب', tr: 'Muhammed b. Abdülvehhâb' }, slug: 'muhammad-ibn-abd-al-wahhab' },
  { title: { az: 'Qırx hədis (əl-Ərbəun ən-Nəvəviyyə)', en: 'The Forty Hadith of an-Nawawi', ru: 'Сорок хадисов ан-Навави', ar: 'الأربعون النووية', tr: 'Kırk Hadis (el-Erbaûn en-Neveviyye)' },
    text: { az: 'Dinin əsaslarını toplayan 42 hədis — saytda şərhi ilə oxuya bilərsiniz.', en: '42 hadiths that gather the foundations of the religion — read them on this site with commentary.', ru: '42 хадиса, собравшие основы религии, — читайте на сайте с пояснением.', ar: 'اثنان وأربعون حديثًا جمعت أصول الدين — اقرأها في الموقع مع الشرح.', tr: 'Dinin esaslarını toplayan 42 hadis — sitede şerhiyle okuyabilirsiniz.' },
    author: { az: 'İmam ən-Nəvəvi', en: 'Imam an-Nawawi', ru: 'Имам ан-Навави', ar: 'الإمام النووي', tr: 'İmam Nevevî' }, slug: 'an-nawawi', page: 'nawawi40' },
  { title: { az: 'əl-Əqidətul-Vasitiyyə', en: 'Al-Aqidah al-Wasitiyyah', ru: 'Аль-Акыда аль-Васитыйя', ar: 'العقيدة الواسطية', tr: 'el-Akîdetü’l-Vâsıtıyye' },
    text: { az: 'Allahın isim və sifətlərinə dair Əhli-sünnənin əqidəsi — qısa və dəlilli.', en: 'The creed of Ahl as-Sunnah on Allah’s names and attributes — concise and evidence-based.', ru: 'Вероубеждение ахль ас-сунна об именах и атрибутах Аллаха — кратко и с доводами.', ar: 'عقيدة أهل السنة في أسماء الله وصفاته — مختصرة بالأدلة.', tr: 'Allah’ın isim ve sıfatlarına dair Ehl-i sünnet akidesi — kısa ve delilli.' },
    author: { az: 'İbn Teymiyyə', en: 'Ibn Taymiyyah', ru: 'Ибн Таймия', ar: 'ابن تيمية', tr: 'İbn Teymiyye' }, slug: 'ibn-taymiyyah' },
  { title: { az: 'Riyazus-Salihin', en: 'Riyad as-Salihin', ru: 'Рияд ас-Салихин', ar: 'رياض الصالحين', tr: 'Riyâzü’s-Sâlihîn' },
    text: { az: 'Əxlaq, ibadət və adaba dair seçilmiş hədislər — hər evdə olmalı kitab.', en: 'Selected hadiths on character, worship and manners — a book for every home.', ru: 'Избранные хадисы о нравственности, поклонении и этикете — книга для каждого дома.', ar: 'أحاديث مختارة في الأخلاق والعبادة والآداب — كتاب لكل بيت.', tr: 'Ahlak, ibadet ve adaba dair seçilmiş hadisler — her evde olması gereken kitap.' },
    author: { az: 'İmam ən-Nəvəvi', en: 'Imam an-Nawawi', ru: 'Имам ан-Навави', ar: 'الإمام النووي', tr: 'İmam Nevevî' }, slug: 'an-nawawi' },
]

const RELATED = [
  { page: 'scholars', title: { az: 'Alimlər', en: 'Scholars', ru: 'Учёные', ar: 'العلماء', tr: 'Âlimler' },
    text: { az: 'Kitab müəlliflərinin həyatı və əsərləri', en: 'Lives and works of the authors', ru: 'Жизнь и труды авторов книг', ar: 'سير المؤلفين ومؤلفاتهم', tr: 'Yazarların hayatı ve eserleri' } },
  { page: 'learn', title: { az: 'Dərslər', en: 'Lessons', ru: 'Уроки', ar: 'الدروس', tr: 'Dersler' },
    text: { az: 'Əqidə, fiqh və əxlaqa dair qısa dərslər', en: 'Short lessons on creed, fiqh and character', ru: 'Короткие уроки по акыде, фикху и нравственности', ar: 'دروس قصيرة في العقيدة والفقه والأخلاق', tr: 'Akide, fıkıh ve ahlaka dair kısa dersler' } },
  { page: 'videos', title: { az: 'Video kitabxana', en: 'Video library', ru: 'Видеобиблиотека', ar: 'مكتبة الفيديو', tr: 'Video kütüphanesi' },
    text: { az: 'Mühazirələr və tilavətlər', en: 'Lectures and recitations', ru: 'Лекции и чтение Корана', ar: 'محاضرات وتلاوات', tr: 'Konferanslar ve tilavetler' } },
  { page: 'glossary', title: { az: 'Lüğət', en: 'Glossary', ru: 'Словарь', ar: 'المعجم', tr: 'Sözlük' },
    text: { az: 'Kitablarda rast gəlinən İslami terminlər', en: 'Islamic terms you meet in the books', ru: 'Исламские термины, встречающиеся в книгах', ar: 'المصطلحات الإسلامية الواردة في الكتب', tr: 'Kitaplarda geçen İslami terimler' } },
]
const tr5 = (o, lang) => (o && (o[lang] || o.en)) || ''

// Sonsuz sürüşmənin bir partiyası
const BATCH = 12

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// hər yeni partiyanın ilk 6 kartı 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz
const revealProps = (i) => {
  const j = i % BATCH
  return { 'data-reveal': '', ...(j > 0 && j < 6 ? { 'data-reveal-delay': String(j * 40) } : {}) }
}

// Telefonda (<768px) kitab pəncərəsi aşağıdan qalxan vərəqdir (BooksPage.css):
// tutacaqdan aşağı çəkib bağlamaq olar, bağlananda aşağı sürüşüb gedir.
// Kompüterdə əvvəlki mərkəzi pəncərə dərhal bağlanır.
const SHEET_MQ = '(max-width: 767.98px)'
const SHEET_EXIT_MS = 240
function isSheetMode() {
  try { return window.matchMedia(SHEET_MQ).matches } catch { return false }
}
function sheetExitMs() {
  try {
    if (!isSheetMode()) return 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0
    return SHEET_EXIT_MS
  } catch { return 0 }
}

// Say + isim uzlaşması (ru: 1 книга · 3 книги · 5 книг; ar: 3–10 cəm, 11+ tək
// mənsub; en: 1 book). Digər dillərdə etiket olduğu kimi qalır.
// (az/tr-də say ilə isim dəyişmir — orada LABELS-dəki söz işlənir)
const PLURAL_FORMS = {
  books_ru: ['книга', 'книги', 'книг'], books_ar: ['كتاب', 'كتب', 'كتابًا'], books_en: ['book', 'books'],
  pages_ru: ['страница', 'страницы', 'страниц'], pages_ar: ['صفحة', 'صفحات', 'صفحةً'], pages_en: ['page', 'pages'],
}
function countWord(n, key, lang, fallback) {
  const f = PLURAL_FORMS[`${key}_${lang}`]
  const x = Number(n)
  if (!f || !Number.isFinite(x)) return fallback
  if (lang === 'en') return x === 1 ? f[0] : f[1]
  if (lang === 'ru') {
    const a = x % 100, b = x % 10
    return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b >= 2 && b <= 4 ? f[1] : f[2]
  }
  // ar
  const a = x % 100
  return a >= 3 && a <= 10 ? f[1] : x > 10 ? f[2] : f[0]
}

export default function BooksPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const bx = BP32[lang] || BP32.en
  const star = useStarred('books:favs')
  const navigate = useNavigate()
  const go = (href) => (e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(href) } }

  const [allBooks, setBooks] = useState([])
  // Başlığı cari dildə olmayan admin məzmunu bu dildə göstərilmir (başqa dilə düşmür)
  const books = useMemo(() => allBooks.filter(b => hasLang(b.title, lang)), [allBooks, lang])
  const [loading, setLoading] = useState(true)
  // Filtrlər sessionStorage-də — geri qayıdanda siyahının mövqeyi ilə birlikdə bərpa olunur
  const [selectedCat, setSelectedCat] = useSessionState('books:cat', 'all')
  const [search, setSearch] = useSessionState('books:q', '')
  const [selectedBook, setSelectedBook] = useState(null)
  const [shareToast, setShareToast] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToBooks((items) => {
      setBooks(items.length > 0 ? items : DEFAULT_BOOKS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  // Seçilmişlər yalnız kitab çox olanda (>8) və yalnız "Hamısı" + axtarışsız
  // görünüşdə — o zaman onlar aşağıdakı şəbəkədə TƏKRAR göstərilmir
  const showFeatured = !search && selectedCat === 'all' && books.length > 8
  const featured = useMemo(() => (showFeatured ? books.slice(0, 4) : []), [books, showFeatured])

  const pdfCount = useMemo(() => books.filter(b => b.pdfUrl).length, [books])
  // Filtr çipləri: yalnız ən azı bir kitabı olan bölmələr (boş çip "0" nəticə verirdi)
  const categories = useMemo(
    () => BOOK_CATEGORIES.filter(c => c.key === 'all' || books.some(b => b.category === c.key)),
    [books]
  )

  const filtered = useMemo(() => {
    let list = books
    if (selectedCat === 'fav') {
      list = list.filter(b => star.list.includes(String(b.id)))
    } else if (featured.length) {
      const ids = new Set(featured.map(b => b.id))
      list = list.filter(b => !ids.has(b.id))
    }
    if (selectedCat !== 'all' && selectedCat !== 'fav') {
      list = list.filter(b => b.category === selectedCat)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b => {
        const title = (pickLang(b.title, lang) || '').toLowerCase()
        const author = (pickLang(b.author, lang, { warn: false }) || '').toLowerCase()
        const desc = (pickLang(b.description, lang, { warn: false }) || '').toLowerCase()
        return title.includes(q) || author.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [books, featured, selectedCat, search, lang, star.list])

  // Sonsuz sürüşmə — filtr/axtarış/dil dəyişəndə siyahı əvvəldən başlayır və
  // (şəbəkənin ortasında idisə) onun başlığına qalxır (hero-ya yox)
  const gridTopRef = useRef(null)
  const inf = useInfiniteList({
    total: filtered.length,
    batch: BATCH,
    resetKey: `${lang}|${selectedCat}|${search.trim()}`,
    storageKey: 'books',
    ready: !loading,
    onReset: () => {
      const el = gridTopRef.current
      if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ block: 'start' })
    },
  })
  const paginated = filtered.slice(0, inf.count)

  // Modal: telefonda "Geri" və klaviaturada Esc onu bağlasın.
  // Telefonda vərəq əvvəlcə aşağı sürüşür (is-closing), sonra silinir.
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef(0)
  const closeBook = useCallback(() => {
    const ms = sheetExitMs()
    if (!ms) { setSelectedBook(null); return }
    if (closeTimerRef.current) return // artıq bağlanır
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = 0
      setClosing(false)
      setSelectedBook(null)
    }, ms)
  }, [])
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])
  useBackToClose(Boolean(selectedBook), closeBook)
  useEffect(() => {
    if (!selectedBook) return undefined
    const onKey = (e) => { if (e.key === 'Escape') closeBook() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedBook, closeBook])

  // Vərəq/pəncərə açılanda fokus "bağla" düyməsinə keçir, bağlananda
  // əvvəlki elementə qayıdır; telefonda arxadakı səhifə sürüşmür
  const sheetRef = useRef(null)
  const closeBtnRef = useRef(null)
  const sheetDrag = useSheetDrag(sheetRef, closeBook)
  const isOpen = Boolean(selectedBook)
  useEffect(() => {
    if (!isOpen) return undefined
    const prevFocus = document.activeElement
    closeBtnRef.current?.focus({ preventScroll: true })
    const body = document.body
    const locked = isSheetMode()
    const prevOverflow = body.style.overflow
    if (locked) body.style.overflow = 'hidden'
    return () => {
      if (locked) body.style.overflow = prevOverflow
      if (prevFocus && prevFocus.isConnected && typeof prevFocus.focus === 'function') {
        prevFocus.focus({ preventScroll: true })
      }
    }
  }, [isOpen])

  const handleShare = async (b) => {
    const title = pickLang(b.title, lang)
    const author = pickLang(b.author, lang, { warn: false })
    const text = `📚 ${title} — ${author}`
    if (navigator.share) {
      try { await navigator.share({ title, text, url: b.pdfUrl || window.location.href }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text + (b.pdfUrl ? `\n${b.pdfUrl}` : ''))
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      } catch {}
    }
  }

  const renderCover = (b, size = 'normal') => {
    const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
    // Avtomatik üz qabığı seçilmiş dildə (coverByLang), real şəkil olduğu kimi
    const cover = b.coverByLang?.[lang] || b.coverUrl
    if (cover) {
      return (
        <img
          src={cover}
          alt={pickLang(b.title, lang)}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bp-cover-fallback') }}
        />
      )
    }
    return (
      // Şəkilsiz kitab — tünd zümrüd üz qabığı + incə xatəm naxışı (tokenlərlə)
      <div className="bp-cover-placeholder">
        <div className="ui-pattern" aria-hidden="true"></div>
        <Icon name="books" size={34} className="bp-cover-icon" />
        <div className="bp-cover-cat">{cat?.label[lang]}</div>
      </div>
    )
  }

  // Kart üz qabığındakı sakit nişanlar (bölmə + PDF) — rəng yalnız tokenlərdən
  const coverBadges = (b) => {
    const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
    return (
      <>
        {cat && <span className="bp-cover-badge">{cat.label[lang]}</span>}
        {b.pdfUrl && <span className="bp-pdf-badge">PDF</span>}
      </>
    )
  }

  return (
    <div className="books-page">

      {/* ═══ HERO ═══ */}
      <header className="ui-page-hero bp-hero2">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{l.eyebrow}</span>
          <h1 className="ui-display">{l.title}</h1>
          {lang !== 'ar' && <p className="bp-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">مَكْتَبَةُ الْكُتُبِ</p>}
          <p className="ui-lead">{l.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {l.how}</p>
          {/* Yalnız real məzmun sayı (yüklənəndə gizli — "0 kitab" görünməsin) */}
          {!loading && books.length > 0 && (
            <ul className="ui-page-hero__stats bp-hero-stats">
              <li><b className="ui-num">{books.length}</b><span>{countWord(books.length, 'books', lang, l.books)}</span></li>
              <li><b className="ui-num">{categories.length - 1}</b><span>{l.statCats}</span></li>
              {pdfCount > 0 && <li><b className="ui-num">{pdfCount}</b><span>{l.statPdf}</span></li>}
            </ul>
          )}
        </div>
      </header>

      <div className="ui-container bp-container">

        {/* ═══ AXTARIŞ ═══ */}
        <div className="bp-search-wrap">
          <Icon name="search" size={19} className="bp-search-icon" />
          <input
            type="search"
            className="ui-input bp-search"
            aria-label={l.search}
            placeholder={l.search}
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="ui-icon-btn bp-search-clear" onClick={() => setSearch('')} aria-label={l.clear} title={l.clear}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* ═══ SEÇİLMİŞLƏR (axtarış yox, "Hamısı" seçili və kitab > 8) ═══ */}
        {featured.length > 0 && (
          <section className="bp-section">
            <div className="bp-section-head" data-reveal>
              <h2 className="ui-title ui-title--sm bp-section-title">
                <Icon name="star" size={20} className="bp-section-ic" /> {l.featured}
              </h2>
            </div>
            <div className="bp-featured-row" data-reveal="stagger-zoom">
              {featured.map(b => (
                <article
                  key={b.id}
                  className="ui-card ui-card--flush ui-card--interactive bp-featured-card"
                  role="button"
                  tabIndex={0}
                  aria-label={pickLang(b.title, lang)}
                  onClick={() => setSelectedBook(b)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedBook(b) } }}
                >
                  <div className="bp-cover bp-featured-cover">
                    {renderCover(b)}
                    {coverBadges(b)}
                  </div>
                  <div className="bp-featured-body">
                    <h3 className="bp-title">{pickLang(b.title, lang)}</h3>
                    <p className="bp-author">{pickLang(b.author, lang, { warn: false })}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ═══ FİLTR ═══
            Yalnız bir dolu bölmə varsa filtr mənasızdır ("Hamısı" = həmin bölmə) — gizlədirik */}
        {categories.length > 2 && (
          <div className="bp-cat-filter" role="group" aria-label={l.filter} data-reveal="stagger-fade">
            {categories.map(cat => {
              const active = selectedCat === cat.key
              const count = cat.key === 'all'
                ? books.length
                : books.filter(b => b.category === cat.key).length
              return (
                <button
                  type="button"
                  key={cat.key}
                  className="ui-chip bp-cat-btn"
                  aria-pressed={active}
                  onClick={() => setSelectedCat(cat.key)}
                >
                  <span>{cat.label[lang]}</span>
                  <span className="bp-cat-count ui-num">{count}</span>
                </button>
              )
            })}
            <button type="button" className="ui-chip bp-cat-btn bp-fav-chip" aria-pressed={selectedCat === 'fav'} onClick={() => setSelectedCat(selectedCat === 'fav' ? 'all' : 'fav')}>
              <Icon name="star" size={14} /> <span>{bx.favs}</span>
              <span className="bp-cat-count ui-num">{star.count}</span>
            </button>
          </div>
        )}

        {/* ═══ BÜTÜN KİTABLAR ═══ */}
        <section className="bp-section">
          <div className="bp-section-head" ref={gridTopRef}>
            <h2 className="ui-title ui-title--sm bp-section-title">
              <Icon name="books" size={20} className="bp-section-ic" /> {selectedCat === 'fav' ? bx.favs : selectedCat !== 'all'
                ? BOOK_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]
                : featured.length ? l.moreBooks : l.allBooks}
            </h2>
            {!loading && <span className="ui-badge bp-section-count ui-num">{filtered.length}</span>}
          </div>

          {loading ? (
            // Yüklənmə: kartların "skelet"i (motion.css → .skeleton)
            <div className="bp-grid" role="status" aria-label={l.loading}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="ui-card ui-card--flush bp-skel-card" aria-hidden="true">
                  <div className="skeleton bp-skel-cover" />
                  <div className="bp-skel-body">
                    <span className="skeleton skeleton--text" style={{ width: '85%' }} />
                    <span className="skeleton skeleton--text" style={{ width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken bp-empty" data-reveal="scale">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="books" /></span>
              <p className="bp-empty-title">{selectedCat === 'fav' && !star.count ? bx.favNone : l.noResults}</p>
              {(search || selectedCat !== 'all') && (
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setSelectedCat('all') }}>
                  <Icon name="close" className="ui-btn__icon" /> {l.clear}
                </button>
              )}
            </div>
          ) : (
            // Açar filtr/səhifə dəyişəndə şəbəkəni yenidən qurur — kartlar yenidən növbə ilə görünür
            <div className="bp-grid" key={selectedCat}>
              {paginated.map((b, i) => (
                <article key={b.id} className="ui-card ui-card--flush ui-card--interactive bp-card" onClick={() => setSelectedBook(b)} {...revealProps(i)}>
                  <div className="bp-cover">
                    {renderCover(b)}
                    {coverBadges(b)}
                  </div>
                  <div className="bp-body">
                    <h3 className="bp-title">{pickLang(b.title, lang)}</h3>
                    <p className="bp-author">{pickLang(b.author, lang, { warn: false })}</p>
                    {(b.pages || b.year) && (
                      <div className="bp-meta ui-num">
                        {b.pages && <span>{b.pages} {countWord(b.pages, 'pages', lang, l.pages)}</span>}
                        {/* İl rəqəmi tək qalanda nə olduğu bilinmirdi ("604 səhifə 1973") — ipucu + ekran oxuyucusu üçün etiket */}
                        {b.year && <span title={l.year}><span className="ui-sr-only">{l.year}: </span>{b.year}</span>}
                      </div>
                    )}
                    <div className="bp-actions">
                      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm bp-read-btn" onClick={(e) => { e.stopPropagation(); setSelectedBook(b) }}>
                        <Icon name="books" className="ui-btn__icon" /> {l.read}
                      </button>
                      <button
                        type="button"
                        className="ui-icon-btn bp-share-btn"
                        onClick={(e) => { e.stopPropagation(); handleShare(b) }}
                        title={l.share}
                        aria-label={l.share}
                      >
                        <Icon name="share" size={18} />
                      </button>
                      <StarButton className="bp-star" on={star.has(String(b.id))} onToggle={() => star.toggle(String(b.id))} label={`${bx.favAdd}: ${pickLang(b.title, lang)}`} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Sonsuz sürüşmə: altda skeleton + "Daha çox göstər", sonda "Hamısı göstərildi" */}
          {!loading && (
            <ListMore {...inf} endText={`${filtered.length} ${countWord(filtered.length, 'books', lang, l.books)}`} minForEnd={BATCH} skeleton={
              <div className="bp-grid" aria-hidden="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="ui-card ui-card--flush bp-skel-card">
                    <div className="skeleton bp-skel-cover" />
                    <div className="bp-skel-body">
                      <span className="skeleton skeleton--text" style={{ width: '85%' }} />
                      <span className="skeleton skeleton--text" style={{ width: '55%' }} />
                    </div>
                  </div>
                ))}
              </div>
            } />
          )}
        </section>
      </div>

      {/* ═══ BÖLMƏLƏR QRAFİKİ + OXU YOLU + ƏLAQƏLİ ═══ */}
      <section className="ui-section ui-section--alt bp-path" aria-labelledby="bp-path-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{l.pathEyebrow}</span>
            <h2 id="bp-path-h" className="ui-title">{l.pathTitle}</h2>
            <p className="ui-lead">{l.pathLead}</p>
          </div>
          <div className="bp-path__grid">
            <ol className="ui-steps bp-steps">
              {READING_PATH.map((st, i) => (
                <li key={i} className="ui-step">
                  <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                  <div className="ui-step__body">
                    <h3 className="ui-step__title">
                      {st.page ? <a href={pathFor(st.page, lang)} onClick={go(pathFor(st.page, lang))}>{tr5(st.title, lang)}</a> : tr5(st.title, lang)}
                    </h3>
                    <p className="ui-step__text">{tr5(st.text, lang)}</p>
                    <a className="bp-step__author" href={pathFor('scholars', lang, st.slug)} onClick={go(pathFor('scholars', lang, st.slug))}>
                      <Icon name="scholars" size={14} /> {tr5(st.author, lang)}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
            {!loading && categories.length > 2 && (
              <ChartFigure title={l.chartTitle} sub={l.chartSub} className="bp-chart">
                <BarChart
                  label={l.chartTitle}
                  data={categories.filter(c => c.key !== 'all')
                    .map(c => ({ key: c.key, label: c.label[lang], value: books.filter(b => b.category === c.key).length }))
                    .sort((a, b) => b.value - a.value)}
                />
              </ChartFigure>
            )}
          </div>
        </div>
      </section>

      <section className="ui-section ui-section--tight bp-related" aria-labelledby="bp-rel-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{l.relEyebrow}</span>
            <h2 id="bp-rel-h" className="ui-title ui-title--sm">{l.relTitle}</h2>
          </div>
          <RelatedLinks items={RELATED} />
        </div>
      </section>

      {/* ═══ BOOK DETAILS MODAL ═══
          Telefonda vərəq <body>-yə köçürülür: <main>-in keçid animasiyası ayrıca
          qat (stacking context) yaradır və sabit elementlər (başlıq, üzən
          kartlar) vərəqin üstündə qalırdı. Kompüterdə pəncərə əvvəlki yerindədir. */}
      {selectedBook && (() => {
        const modal = (
          <div className={`bp-modal${closing ? ' is-closing' : ''}`} onClick={closeBook}>
            <div
              className="bp-modal-content"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={pickLang(selectedBook.title, lang)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Telefonda tutacaq — aşağı çəkib bağlamaq (kompüterdə gizli) */}
              <div className="m-sheet-grab bp-sheet-grab" {...sheetDrag}>
                <span className="m-sheet-handle" />
              </div>
              <button type="button" ref={closeBtnRef} className="ui-icon-btn bp-modal-close" onClick={closeBook} aria-label={l.close} title={l.close}><Icon name="close" size={18} /></button>
              <div className="bp-modal-inner">
                <div className="bp-modal-cover">
                  {renderCover(selectedBook, 'large')}
                </div>
                <div className="bp-modal-info">
                  {(() => {
                    const cat = BOOK_CATEGORIES.find(c => c.key === selectedBook.category)
                    return cat && (
                      <span className="ui-badge ui-badge--accent bp-modal-cat">{cat.label[lang]}</span>
                    )
                  })()}
                  <h2>{pickLang(selectedBook.title, lang)}</h2>
                  <p className="bp-modal-author">{pickLang(selectedBook.author, lang, { warn: false })}</p>

                  {(selectedBook.pages || selectedBook.year) && (
                    <div className="bp-modal-meta ui-num">
                      {selectedBook.pages && <span className="ui-badge">{selectedBook.pages} {countWord(selectedBook.pages, 'pages', lang, l.pages)}</span>}
                      {selectedBook.year && <span className="ui-badge"><Icon name="calendar" size={13} /> {selectedBook.year}</span>}
                    </div>
                  )}

                  {(pickLang(selectedBook.description, lang, { warn: false })) && (
                    <p className="bp-modal-desc">{pickLang(selectedBook.description, lang, { warn: false })}</p>
                  )}

                  <div className="bp-modal-actions">
                    {selectedBook.pdfUrl ? (
                      <a className="ui-btn ui-btn--primary bp-modal-pdf-btn" href={selectedBook.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Icon name="books" className="ui-btn__icon" /> {l.readPdf}
                        <Icon name="external" size={15} className="bp-ext-ic" />
                      </a>
                    ) : (
                      <div className="bp-modal-pdf-disabled"><Icon name="info" size={18} /> {l.noPdf}</div>
                    )}
                    <button type="button" className="ui-btn ui-btn--secondary bp-modal-share-btn" onClick={() => handleShare(selectedBook)}>
                      <Icon name="share" className="ui-btn__icon" /> {l.share}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        return isSheetMode() ? createPortal(modal, document.body) : modal
      })()}

      {/* ═══ SHARE TOAST ═══ */}
      {/* <body>-yə — açıq vərəqin də üstündə görünsün */}
      {shareToast && createPortal(
        <div className="bp-share-toast" role="status">
          <Icon name="check" size={18} /> {l.shared}
        </div>,
        document.body
      )}

      <BackToTop />
    </div>
  )
}
