import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { getSurahLocal } from '../data/surahNamesAz'
import { SURAH_TABLE } from '../data/mushafIndex'
import { BASMALA_DISPLAY } from '../utils/quranText'
import {
  MUSHAF_PAGES, clampPage, isValidPage, surahStartPage, juzStartPage, juzForPage, surahsOnPage, surahInfo,
  hizbFromRub, layoutPage, isCenteredLine, wbwLang, readLastPage, saveLastPage,
  fetchMushafPage, getCachedPage, prefetchMushafPage,
} from '../utils/mushaf'
import { loadWordIndex, spacedRoot, ROOT_CAT_LABELS, verbFormLabel } from '../utils/quranRoots'
import { ProgressBar, StatTile } from '../components/viz'
import '../styles/MushafPage.css'
import { playSound } from '../utils/uiSound'
import SoundToggle from '../components/SoundToggle'

// v3: hero rəqəmləri və "Mushafın quruluşu" bölməsi.
// 604 səhifə / 30 cüz — src/data/mushafIndex.js; 60 hizb, 240 rübʿ — ənənəvi bölgü
// (hər cüz 2 hizb, hər hizb 4 rübʿ). Mətn və sətir düzülüşü: Quran.com API (Həfs rəvayəti).
const MP_TXT = {
  stats: [
    { v: '604', l: { az: 'səhifə', en: 'pages', ru: 'страницы', ar: 'صفحات', tr: 'sayfa' } },
    { v: '15', l: { az: 'sətir hər səhifədə', en: 'lines per page', ru: 'строк на странице', ar: 'سطرًا في الصفحة', tr: 'satır her sayfada' } },
    { v: '11', l: { az: 'təcvid rəngi', en: 'tajweed colours', ru: 'цветов таджвида', ar: 'لونًا للتجويد', tr: 'tecvit rengi' } },
  ],
  pos: { az: 'Mushafda irəliləyiş', en: 'Position in the mushaf', ru: 'Позиция в мусхафе', ar: 'موضعك في المصحف', tr: 'Mushaftaki ilerleme' },
  eyebrow: { az: 'Quruluş', en: 'Structure', ru: 'Структура', ar: 'البنية', tr: 'Yapı' },
  title: { az: 'Mushaf necə bölünür', en: 'How the mushaf is divided', ru: 'Как делится мусхаф', ar: 'كيف يُقسَّم المصحف', tr: 'Mushaf nasıl bölünür' },
  lead: {
    az: 'Bu görünüş Mədinə mushafının (Həfs rəvayəti) səhifə düzülüşünü təkrarlayır: hər səhifə çap nüsxəsindəki kimi eyni sözlə başlayıb bitir. Bu, hafizlər üçün vacibdir — səhifənin «şəkli» yadda qalır.',
    en: 'This view follows the page layout of the Madani mushaf (narration of Hafs): each page starts and ends with the same word as the printed copy. This matters to memorisers — the “shape” of the page stays in memory.',
    ru: 'Этот вид повторяет вёрстку мединского мусхафа (чтение Хафса): каждая страница начинается и заканчивается тем же словом, что и в печатном издании. Это важно для хафизов — «облик» страницы остаётся в памяти.',
    ar: 'يحاكي هذا العرض صفحات مصحف المدينة (رواية حفص)، فكل صفحة تبدأ وتنتهي بالكلمة نفسها كما في النسخة المطبوعة، وهذا مهم للحفّاظ إذ تبقى صورة الصفحة في الذاكرة.',
    tr: 'Bu görünüm Medine mushafının (Hafs rivayeti) sayfa düzenini izler: her sayfa basılı nüshadaki gibi aynı kelimeyle başlar ve biter. Bu, hafızlar için önemlidir — sayfanın “şekli” akılda kalır.',
  },
  units: [
    { v: '30', l: { az: 'cüz', en: 'juz', ru: 'джузов', ar: 'جزءًا', tr: 'cüz' }, h: { az: '≈ 20 səhifə', en: '≈ 20 pages', ru: '≈ 20 страниц', ar: '≈ ٢٠ صفحة', tr: '≈ 20 sayfa' } },
    { v: '60', l: { az: 'hizb', en: 'hizb', ru: 'хизбов', ar: 'حزبًا', tr: 'hizb' }, h: { az: 'hər cüzdə 2', en: '2 in each juz', ru: 'по 2 в джузе', ar: 'حزبان في كل جزء', tr: 'her cüzde 2' } },
    { v: '240', l: { az: 'rübʿ (dörddəbir)', en: 'rubʿ (quarters)', ru: 'рубʿ (четвертей)', ar: 'ربعًا', tr: 'rubʿ (çeyrek)' }, h: { az: 'hər hizbdə 4', en: '4 in each hizb', ru: 'по 4 в хизбе', ar: 'أربعة في كل حزب', tr: 'her hizbde 4' } },
    { v: '604', l: { az: 'səhifə', en: 'pages', ru: 'страницы', ar: 'صفحات', tr: 'sayfa' }, h: { az: 'hər birində 15 sətir', en: '15 lines each', ru: 'по 15 строк', ar: '١٥ سطرًا في كل صفحة', tr: 'her birinde 15 satır' } },
  ],
  tips: { az: 'Necə istifadə etməli', en: 'How to use it', ru: 'Как пользоваться', ar: 'كيف تستخدمه', tr: 'Nasıl kullanılır' },
  tipItems: [
    { i: 'palette', t: { az: '«Təcvid rəngləri» qaydaları rənglə göstərir — rənglərin izahı səhifənin üstündədir.', en: '“Tajweed colours” highlight the rules — the legend is above the page.', ru: '«Цвета таджвида» выделяют правила — легенда над страницей.', ar: '«ألوان التجويد» تُبرز الأحكام، ومفتاح الألوان فوق الصفحة.', tr: '“Tecvit renkleri” kuralları renkle gösterir — açıklama sayfanın üstündedir.' } },
    { i: 'touch', t: { az: '«Söz-söz» rejimində sözə toxunun: tərcümə, oxunuş və kök açılır.', en: 'In “Word by word” mode tap a word: translation, transliteration and root open.', ru: 'В режиме «Пословно» нажмите на слово: откроются перевод, транслитерация и корень.', ar: 'في وضع «كلمة كلمة» اضغط على الكلمة لترى معناها ونطقها وجذرها.', tr: '“Kelime kelime” modunda kelimeye dokunun: anlamı, okunuşu ve kökü açılır.' } },
    { i: 'hifz', t: { az: 'Son açdığınız səhifə yadda qalır — növbəti dəfə oradan davam edin.', en: 'The last page you opened is remembered — continue from there next time.', ru: 'Последняя открытая страница запоминается — в следующий раз продолжите с неё.', ar: 'تُحفظ آخر صفحة فتحتها لتكمل منها لاحقًا.', tr: 'Son açtığınız sayfa hatırlanır — bir dahaki sefere oradan devam edin.' } },
  ],
}
const pk = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] !== undefined ? o[lang] : o.az))

/* ══════════════════════════════════════════════════════════════════
   MUSHAF GÖRÜNÜŞÜ — /mushaf?p=<səhifə>
   604 səhifəlik Mədinə mushafı səhifə-səhifə: hər söz Quran.com API v4-dən
   öz sətir nömrəsi ilə gəlir və 15 sətirlik səhifə yenidən qurulur
   (utils/mushaf.js → layoutPage). Mətn saytda saxlanmır.
   • Vərəqləmə mushafdakı kimidir: NÖVBƏTİ səhifə SOLDADIR — sol ox / sola
     düymə / barmağı sağa sürüşdürmək növbəti səhifəni açır (bütün dillərdə).
   • Təcvid rəngləri: sözün text_uthmani_tajweed sahəsi (ağ siyahı ilə təmizlənir).
   • Söz-söz: sözə toxunanda tərcümə + transliterasiya (Quran.com) + kök
     (Quranic Arabic Corpus — public/data/quran-roots.json).
   • Son açılan səhifə yadda qalır (localStorage).
   ══════════════════════════════════════════════════════════════════ */

// Marşrut açarları (src/seo/routes.js-də qeydiyyat: mushaf → 'mushaf', quranroots → 'quran-roots')
const ROOTS_KEY = 'quranroots'

const LABELS = {
  az: {
    eyebrow: 'Quran', title: 'Mushaf görünüşü',
    lead: 'Mədinə mushafı — 604 səhifə, hər səhifə çap nüsxəsindəki kimi 15 sətir. Təcvid rəngləri və söz-söz tərcümə ilə.',
    page: 'Səhifə', of: 'cəmi', next: 'Növbəti səhifə', prev: 'Əvvəlki səhifə',
    goPage: 'Səhifəyə keç', go: 'Keç', surah: 'Surə', juz: 'Cüz', hizb: 'Hizb',
    pickSurah: 'Surə seçin', pickJuz: 'Cüz seçin', range: `1 ilə ${MUSHAF_PAGES} arasında rəqəm yazın`,
    tajweed: 'Təcvid rəngləri', wbw: 'Söz-söz', spread: 'İki səhifə', legend: 'Təcvid qaydalarının rəngləri',
    loading: 'Səhifə yüklənir…', error: 'Səhifə yüklənmədi. İnternet bağlantısını yoxlayın.', offline: 'İnternet bağlantısı yoxdur. Bağlantı bərpa olunanda yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    hint: 'Vərəqləmək üçün: ← → oxları, ekranda barmağı sürüşdürün və ya düymələrdən istifadə edin. Mushafdakı kimi növbəti səhifə soldadır.',
    wbwHint: 'Tərcüməsini görmək üçün sözə toxunun.',
    translation: 'Tərcümə', translit: 'Oxunuşu', root: 'Kök', lemma: 'Lüğət forması', noRoot: 'Bu sözün kökü yoxdur (ədat, əvəzlik və s.).',
    rootLoading: 'Kök yüklənir…', allWithRoot: 'Bu kökdən olan bütün sözlər', openAyah: 'Ayəni oxu', close: 'Bağla',
    wbwNote: 'Azərbaycanca söz tərcüməsi hələ yoxdur — ingiliscə göstərilir.',
    source: 'Mətn və söz tərcüməsi: Quran.com API. Köklər: Quranic Arabic Corpus (GNU GPL).',
    quarter: ['', '¼', '½', '¾'],
  },
  en: {
    eyebrow: 'Quran', title: 'Mushaf view',
    lead: 'The Madani mushaf — 604 pages, each with the same 15 lines as the printed copy. With tajweed colours and word-by-word translation.',
    page: 'Page', of: 'of', next: 'Next page', prev: 'Previous page',
    goPage: 'Go to page', go: 'Go', surah: 'Surah', juz: 'Juz', hizb: 'Hizb',
    pickSurah: 'Choose a surah', pickJuz: 'Choose a juz', range: `Enter a number from 1 to ${MUSHAF_PAGES}`,
    tajweed: 'Tajweed colours', wbw: 'Word by word', spread: 'Two pages', legend: 'Tajweed rule colours',
    loading: 'Loading the page…', error: 'The page could not be loaded. Please check your connection.', offline: 'You are offline. Try again when the connection is back.', retry: 'Try again',
    hint: 'To turn pages: use the ← → keys, swipe on the screen or use the buttons. As in a printed mushaf, the next page is on the left.',
    wbwHint: 'Tap a word to see its translation.',
    translation: 'Translation', translit: 'Transliteration', root: 'Root', lemma: 'Dictionary form', noRoot: 'This word has no root (particle, pronoun, etc.).',
    rootLoading: 'Loading the root…', allWithRoot: 'All words from this root', openAyah: 'Read the verse', close: 'Close',
    wbwNote: '',
    source: 'Text and word translation: Quran.com API. Roots: Quranic Arabic Corpus (GNU GPL).',
    quarter: ['', '¼', '½', '¾'],
  },
  ru: {
    eyebrow: 'Коран', title: 'Вид мусхафа',
    lead: 'Мединский мусхаф — 604 страницы, на каждой те же 15 строк, что и в печатном издании. С цветами таджвида и пословным переводом.',
    page: 'Страница', of: 'из', next: 'Следующая страница', prev: 'Предыдущая страница',
    goPage: 'Перейти к странице', go: 'Перейти', surah: 'Сура', juz: 'Джуз', hizb: 'Хизб',
    pickSurah: 'Выберите суру', pickJuz: 'Выберите джуз', range: `Введите число от 1 до ${MUSHAF_PAGES}`,
    tajweed: 'Цвета таджвида', wbw: 'Пословно', spread: 'Две страницы', legend: 'Цвета правил таджвида',
    loading: 'Загрузка страницы…', error: 'Не удалось загрузить страницу. Проверьте подключение к интернету.', offline: 'Нет подключения к интернету. Повторите попытку, когда связь восстановится.', retry: 'Повторить',
    hint: 'Листать: клавиши ← →, свайп по экрану или кнопки. Как в печатном мусхафе, следующая страница слева.',
    wbwHint: 'Нажмите на слово, чтобы увидеть перевод.',
    translation: 'Перевод', translit: 'Транслитерация', root: 'Корень', lemma: 'Словарная форма', noRoot: 'У этого слова нет корня (частица, местоимение и т. п.).',
    rootLoading: 'Загрузка корня…', allWithRoot: 'Все слова этого корня', openAyah: 'Читать аят', close: 'Закрыть',
    wbwNote: 'Пословного перевода на русский пока нет — показан английский.',
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    source: 'Текст и пословный перевод: API Quran.com. Корни: Quranic Arabic Corpus (GNU GPL).',
    quarter: ['', '¼', '½', '¾'],
  },
  ar: {
    eyebrow: 'القرآن', title: 'عرض المصحف',
    lead: 'مصحف المدينة النبوية — ٦٠٤ صفحات، في كل صفحة ١٥ سطرًا كما في النسخة المطبوعة، مع ألوان التجويد وترجمة الكلمات.',
    page: 'الصفحة', of: 'من', next: 'الصفحة التالية', prev: 'الصفحة السابقة',
    goPage: 'انتقل إلى صفحة', go: 'انتقل', surah: 'السورة', juz: 'الجزء', hizb: 'الحزب',
    pickSurah: 'اختر سورة', pickJuz: 'اختر جزءًا', range: `أدخل رقمًا من 1 إلى ${MUSHAF_PAGES}`,
    tajweed: 'ألوان التجويد', wbw: 'كلمة كلمة', spread: 'صفحتان', legend: 'ألوان أحكام التجويد',
    loading: 'جارٍ تحميل الصفحة…', error: 'تعذّر تحميل الصفحة. تحقّق من الاتصال بالإنترنت.', offline: 'لا يوجد اتصال بالإنترنت. أعد المحاولة عند عودة الاتصال.', retry: 'أعد المحاولة',
    hint: 'للتقليب: مفاتيح الأسهم ← →، أو السحب على الشاشة، أو الأزرار. الصفحة التالية على اليسار كما في المصحف.',
    wbwHint: 'اضغط على كلمة لترى ترجمتها.',
    translation: 'الترجمة', translit: 'النطق', root: 'الجذر', lemma: 'الأصل المعجمي', noRoot: 'ليس لهذه الكلمة جذر (حرف أو ضمير ونحوهما).',
    rootLoading: 'جارٍ تحميل الجذر…', allWithRoot: 'كل كلمات هذا الجذر', openAyah: 'اقرأ الآية', close: 'إغلاق',
    wbwNote: 'ترجمة الكلمات بالعربية غير متاحة؛ تُعرض الترجمة الإنجليزية.',
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    source: 'النص وترجمة الكلمات: Quran.com. الجذور: Quranic Arabic Corpus (رخصة GNU GPL).',
    quarter: ['', '¼', '½', '¾'],
  },
  tr: {
    eyebrow: 'Kur’an', title: 'Mushaf görünümü',
    lead: 'Medine mushafı — 604 sayfa, her sayfada basılı nüshadaki gibi 15 satır. Tecvid renkleri ve kelime kelime meal ile.',
    page: 'Sayfa', of: 'toplam', next: 'Sonraki sayfa', prev: 'Önceki sayfa',
    goPage: 'Sayfaya git', go: 'Git', surah: 'Sure', juz: 'Cüz', hizb: 'Hizb',
    pickSurah: 'Sure seçin', pickJuz: 'Cüz seçin', range: `1 ile ${MUSHAF_PAGES} arasında bir sayı yazın`,
    tajweed: 'Tecvid renkleri', wbw: 'Kelime kelime', spread: 'İki sayfa', legend: 'Tecvid kurallarının renkleri',
    loading: 'Sayfa yükleniyor…', error: 'Sayfa yüklenemedi. İnternet bağlantınızı kontrol edin.', offline: 'İnternet bağlantısı yok. Bağlantı gelince tekrar deneyin.', retry: 'Tekrar dene',
    hint: 'Sayfa çevirmek için: ← → tuşları, ekranda kaydırma ya da düğmeler. Mushafta olduğu gibi sonraki sayfa soldadır.',
    wbwHint: 'Anlamını görmek için kelimeye dokunun.',
    translation: 'Anlamı', translit: 'Okunuşu', root: 'Kök', lemma: 'Sözlük biçimi', noRoot: 'Bu kelimenin kökü yok (edat, zamir vb.).',
    rootLoading: 'Kök yükleniyor…', allWithRoot: 'Bu kökten gelen bütün kelimeler', openAyah: 'Ayeti oku', close: 'Kapat',
    wbwNote: '',
    // lang-ok[Quranic,Arabic,Corpus,Quran,Quranic Arabic Corpus,Quran.com]: məlumat bazasının və saytın rəsmi latın adı
    source: 'Metin ve kelime meali: Quran.com API. Kökler: Quranic Arabic Corpus (GNU GPL).',
    quarter: ['', '¼', '½', '¾'],
  },
}

// Təcvid legendi: bir rəng — bir qrup qayda (sinif adları utils/mushaf.js → TAJWEED_RULES)
const TAJWEED_LEGEND = [
  { id: 'silent', rules: ['ham_wasl', 'slnt', 'laam_shamsiyah'],
    label: { az: 'Oxunmayan hərf (vəsl həmzəsi, şəmsi lam)', en: 'Silent letter (hamzat al-wasl, solar lam)', ru: 'Непроизносимая буква (хамза-васль, солнечная лям)', ar: 'حرف لا يُنطق (همزة الوصل، اللام الشمسية)', tr: 'Okunmayan harf (vasl hemzesi, şemsî lam)' } },
  { id: 'madd2', rules: ['madda_normal'],
    label: { az: 'Təbii mədd (2 hərəkə)', en: 'Natural madd (2 counts)', ru: 'Естественный мадд (2 хараката)', ar: 'مدّ طبيعي (حركتان)', tr: 'Tabii med (2 hareke)' } },
  { id: 'madd246', rules: ['madda_permissible'],
    label: { az: 'Caiz mədd (2, 4 və ya 6)', en: 'Permissible madd (2, 4 or 6)', ru: 'Допустимый мадд (2, 4 или 6)', ar: 'مدّ جائز (٢ أو ٤ أو ٦)', tr: 'Caiz med (2, 4 veya 6)' } },
  { id: 'madd45', rules: ['madda_obligatory_mottasel', 'madda_obligatory_monfasel'],
    label: { az: 'Müttəsil və münfəsil mədd (4–5)', en: 'Connected and separated madd (4–5)', ru: 'Слитный и раздельный мадд (4–5)', ar: 'المدّ المتصل والمنفصل (٤–٥)', tr: 'Muttasıl ve munfasıl med (4–5)' } },
  { id: 'madd6', rules: ['madda_necessary'],
    label: { az: 'Lazım mədd (6 hərəkə)', en: 'Necessary madd (6 counts)', ru: 'Обязательный мадд (6 харакатов)', ar: 'مدّ لازم (٦ حركات)', tr: 'Lazım med (6 hareke)' } },
  { id: 'ghunnah', rules: ['ghunnah'],
    label: { az: 'Ğünnə', en: 'Ghunnah', ru: 'Гунна', ar: 'غنّة', tr: 'Gunne' } },
  { id: 'ikhfa', rules: ['ikhafa', 'ikhafa_shafawi'],
    label: { az: 'İxfa', en: 'Ikhfa', ru: 'Ихфа', ar: 'إخفاء', tr: 'İhfa' } },
  { id: 'idghamG', rules: ['idgham_ghunnah', 'idgham_shafawi', 'idgham_mutajanisayn', 'idgham_mutaqaribayn'],
    label: { az: 'Ğünnəli idğam', en: 'Idgham with ghunnah', ru: 'Идгам с гунной', ar: 'إدغام بغنّة', tr: 'Gunneli idgam' } },
  { id: 'idgham', rules: ['idgham_wo_ghunnah'],
    label: { az: 'Ğünnəsiz idğam', en: 'Idgham without ghunnah', ru: 'Идгам без гунны', ar: 'إدغام بلا غنّة', tr: 'Gunnesiz idgam' } },
  { id: 'iqlab', rules: ['iqlab'],
    label: { az: 'İqlab', en: 'Iqlab', ru: 'Икляб', ar: 'إقلاب', tr: 'İklab' } },
  { id: 'qalqalah', rules: ['qalaqah'],
    label: { az: 'Qəlqələ', en: 'Qalqalah', ru: 'Калькаля', ar: 'قلقلة', tr: 'Kalkale' } },
]

const PREFS_KEY = 'mushaf_prefs'
function readPrefs() {
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY))
    return { tajweed: !!v?.tajweed, wbw: !!v?.wbw, spread: v?.spread !== false }
  } catch { return { tajweed: false, wbw: false, spread: true } }
}
function savePrefs(p) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) } catch { /* bağlıdır */ } }

const isTyping = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const toArabicDigits = n => String(n).replace(/\d/g, d => AR_DIGITS[d])
const readPageParam = search => {
  const n = Number(new URLSearchParams(search || '').get('p'))
  return isValidPage(n) ? n : null
}

function surahName(n, lang) {
  const info = surahInfo(n)
  if (!info) return String(n)
  if (lang === 'ar') return info.ar
  return getSurahLocal(n, lang)?.name || info.latin
}

/** Sətirləri konteynerə sığdırır: daşan sətrin şrift ölçüsünü azaldır */
function useFitLines(sheetRef, deps) {
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return undefined
    const fit = () => {
      const lines = sheet.querySelectorAll('.mp-line--words')
      lines.forEach(el => { el.style.fontSize = '' })
      lines.forEach(el => {
        const over = el.scrollWidth - el.clientWidth
        if (over > 1) {
          const base = parseFloat(getComputedStyle(el).fontSize)
          el.style.fontSize = `${Math.floor(base * (el.clientWidth / el.scrollWidth) * 0.98 * 10) / 10}px`
        }
      })
    }
    fit()
    let raf = 0
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit) }) : null
    ro?.observe(sheet)
    // Şrift gec yüklənərsə yenidən ölç
    document.fonts?.ready?.then(fit).catch(() => {})
    return () => { ro?.disconnect(); cancelAnimationFrame(raf) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Bir səhifənin məlumatı (keş → şəbəkə). enabled=false — heç nə yüklənmir. */
function useMushafPage(p, wl, reload, enabled = true) {
  const [st, setSt] = useState(() => ({ p, data: enabled ? getCachedPage(p, wl) : null, error: null }))
  useEffect(() => {
    if (!enabled) return undefined
    let alive = true
    const hit = getCachedPage(p, wl)
    setSt({ p, data: hit, error: null })
    if (!hit) {
      fetchMushafPage(p, wl)
        .then(v => { if (alive) setSt({ p, data: v, error: null }) })
        .catch(e => { if (alive) setSt({ p, data: null, error: e?.kind || 'network' }) })
    }
    return () => { alive = false }
  }, [p, wl, reload, enabled])
  // Səhifə dəyişən kimi köhnə səhifənin məlumatı göstərilməsin
  return st.p === p ? st : { p, data: enabled ? getCachedPage(p, wl) : null, error: null }
}

/** Geniş ekran (iki səhifəli açıq kitab üçün) */
const SPREAD_MQ = '(min-width: 1200px)'
function useWide() {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(SPREAD_MQ).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(SPREAD_MQ)
    if (!mq) return undefined
    const on = () => setWide(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return wide
}

/**
 * Bir mushaf vərəqi: başlıq (surə, cüz/hizb), 15 sətir, səhifə nömrəsi.
 * side: 'right' | 'left' | '' — açıq kitabda vərəqin tərəfi (kölgə, kənar).
 */
function MushafSheet({ page, data, error, prefs, sel, onWordClick, L, onRetry, side = '' }) {
  const sheetRef = useRef(null)
  const lines = useMemo(() => (data ? layoutPage(data.words, page) : null), [data, page])
  useFitLines(sheetRef, [lines, prefs.tajweed])
  const juz = data?.juz || juzForPage(page)
  const hz = hizbFromRub(data?.rub)
  const headerSurah = data?.words?.[0]?.s || surahsOnPage(page)[0]
  const label = `${L.page} ${page} ${L.of} ${MUSHAF_PAGES} · ${L.juz} ${juz}`
  return (
    <article className={`mp-sheet${prefs.tajweed ? ' is-tajweed' : ''}${prefs.wbw ? ' is-wbw' : ''}${side ? ` mp-sheet--${side}` : ''}`}
      aria-label={label} aria-busy={!data && !error}>
      <div className="mp-sheet__head" dir="rtl">
        <span className="mp-sheet__surah ui-arabic" lang="ar">{headerSurah ? `سورة ${surahInfo(headerSurah)?.ar}` : ''}</span>
        <span className="mp-sheet__juz" dir="auto">
          {L.juz} <span className="ui-num">{juz}</span>
          {hz && <> · {L.hizb} <span className="ui-num">{hz.hizb}</span>{hz.quarter ? ` ${L.quarter[hz.quarter]}` : ''}</>}
        </span>
      </div>

      <div className="mp-sheet__body" ref={sheetRef} lang="ar" dir="rtl">
        {error && !data && (
          <div className="mp-error" role="alert">
            <span className="ui-icon-tile ui-icon-tile--lg" aria-hidden="true"><Icon name="quran" /></span>
            <p>{error === 'offline' ? L.offline : L.error}</p>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={onRetry}>
              <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
            </button>
          </div>
        )}
        {!data && !error && <MushafSkeleton label={L.loading} />}
        {lines && lines.map(line => {
          if (line.kind === 'header') {
            return (
              <div key={line.n} className="mp-line mp-line--header">
                <span className="mp-surah-title ui-arabic">سورة {surahInfo(line.surah)?.ar}</span>
              </div>
            )
          }
          if (line.kind === 'basmala') {
            return <div key={line.n} className="mp-line mp-line--basmala ui-arabic">{BASMALA_DISPLAY}</div>
          }
          if (line.kind === 'blank') return <div key={line.n} className="mp-line mp-line--blank" aria-hidden="true" />
          return (
            <div key={line.n} className={`mp-line mp-line--words${isCenteredLine(line, page) ? ' is-centered' : ''}`}>
              {line.words.map(w => {
                if (w.type === 'end') {
                  return <span key={`${w.key}-e`} className="mp-end" aria-label={w.key}>{toArabicDigits(w.a)}</span>
                }
                const active = sel && sel.w.key === w.key && sel.w.p === w.p
                const content = prefs.tajweed && w.tj
                  ? <span className="mp-word__t" dangerouslySetInnerHTML={{ __html: w.tj }} />
                  : <span className="mp-word__t">{w.text}</span>
                return prefs.wbw ? (
                  <button key={`${w.key}-${w.p}`} type="button" className={`mp-word${active ? ' is-active' : ''}`}
                    aria-expanded={active} aria-label={w.tr ? `${w.text} — ${w.tr}` : w.text} onClick={onWordClick(w)}>
                    {content}
                  </button>
                ) : (
                  <span key={`${w.key}-${w.p}`} className="mp-word">{content}</span>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="mp-sheet__foot" aria-hidden="true">
        <span className="mp-sheet__num ui-arabic">{toArabicDigits(page)}</span>
      </div>
    </article>
  )
}

function MushafSkeleton({ label }) {
  return (
    <div className="mp-skel" role="status" aria-label={label}>
      {Array.from({ length: 15 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--text mp-skel__line" />)}
    </div>
  )
}

function WordPopover({ sel, L, lang, onClose, stageRef, rootsHref }) {
  const ref = useRef(null)
  const [root, setRoot] = useState({ state: 'loading' })
  const { w } = sel
  useEffect(() => {
    let alive = true
    setRoot({ state: 'loading' })
    loadWordIndex()
      .then(idx => { if (alive) setRoot({ state: 'ok', info: idx.get(`${w.s}:${w.a}:${w.p}`) || null }) })
      .catch(() => { if (alive) setRoot({ state: 'error' }) })
    return () => { alive = false }
  }, [w.s, w.a, w.p])
  useEffect(() => { ref.current?.focus() }, [sel])
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    const onDown = e => {
      if (ref.current?.contains(e.target)) return
      if (e.target.closest?.('.mp-word')) return     // başqa sözə keçid — onu klik özü idarə edir
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown) }
  }, [onClose])

  // Mövqe: sözün altında, səhnənin içində sıxılmış (telefonda CSS alt vərəq edir)
  const style = useMemo(() => {
    const stage = stageRef.current
    if (!stage || !sel.rect) return undefined
    const s = stage.getBoundingClientRect()
    const width = Math.min(300, s.width - 16)
    const center = sel.rect.left + sel.rect.width / 2 - s.left
    const left = Math.max(8, Math.min(s.width - width - 8, center - width / 2))
    return { '--pop-top': `${Math.round(sel.rect.bottom - s.top + 8)}px`, '--pop-left': `${Math.round(left)}px`, '--pop-width': `${Math.round(width)}px` }
  }, [sel, stageRef])

  const cats = ROOT_CAT_LABELS[lang] || ROOT_CAT_LABELS.en
  return (
    <div ref={ref} className="mp-pop ui-enter-pop" role="dialog" aria-modal="false" aria-label={w.text} tabIndex={-1} style={style}>
      <button type="button" className="ui-icon-btn mp-pop__close" onClick={onClose} aria-label={L.close} title={L.close}>
        <Icon name="close" size={16} />
      </button>
      <p className="mp-pop__ar ui-arabic" lang="ar" dir="rtl">{w.text}</p>
      {w.tl && <p className="mp-pop__tl" lang="ar-Latn" dir="ltr">{w.tl}</p>}
      {w.tr && (
        <p className="mp-pop__tr">
          <span className="mp-pop__label">{L.translation}</span>
          <span lang={wbwLang(lang)} dir="ltr">{w.tr}</span>
        </p>
      )}
      {L.wbwNote && <p className="mp-pop__note"><Icon name="info" size={14} /> {L.wbwNote}</p>}
      <div className="mp-pop__root">
        {root.state === 'loading' && <span className="mp-pop__muted">{L.rootLoading}</span>}
        {root.state === 'ok' && !root.info && <span className="mp-pop__muted">{L.noRoot}</span>}
        {root.state === 'ok' && root.info && (
          <>
            <p>
              <span className="mp-pop__label">{L.root}</span>
              <span className="mp-pop__rootval ui-arabic" lang="ar" dir="rtl">{spacedRoot(root.info.root)}</span>
            </p>
            <p>
              <span className="mp-pop__label">{L.lemma}</span>
              <span className="ui-arabic mp-pop__lemma" lang="ar" dir="rtl">{root.info.lemma}</span>
              {cats[root.info.cat] && <span className="mp-pop__muted"> · {cats[root.info.cat]}</span>}
              {root.info.cat === 'V' && root.info.vf > 0 && <span className="mp-pop__muted"> · {verbFormLabel(root.info.vf, lang)}</span>}
            </p>
            <a className="ui-link mp-pop__link" href={rootsHref(root.info.root)}>
              {L.allWithRoot} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
            </a>
          </>
        )}
      </div>
      <a className="ui-link mp-pop__link" href={`${pathFor('quran', lang, w.s)}?a=${w.a}`}>
        {L.openAyah} <span className="ui-num" dir="ltr">({w.key})</span> <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
      </a>
    </div>
  )
}

export default function MushafPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.az
  const location = useLocation()
  const routerNavigate = useNavigate()
  const wl = wbwLang(lang)

  const [page, setPage] = useState(() => readPageParam(location.search) || readLastPage() || 1)
  const [reload, setReload] = useState(0)
  const [prefs, setPrefs] = useState(readPrefs)
  // İki səhifəli açıq kitab: geniş ekranda (≥1200px) və tərcih açıqdırsa.
  // Mədinə mushafı kimi: TƏK səhifə SAĞDA, cüt səhifə SOLDA (1–2, 3–4 … 603–604).
  const wide = useWide()
  const spread = wide && prefs.spread
  const pR = spread ? (page % 2 ? page : page - 1) : page
  const pL = spread && pR + 1 <= MUSHAF_PAGES ? pR + 1 : null
  const { data, error } = useMushafPage(pR, wl, reload)
  const left = useMushafPage(pL || pR, wl, reload, Boolean(pL))
  // Vərəqləmə istiqaməti (səhifə çevrilmə animasiyası üçün)
  const [turn, setTurn] = useState('')
  const [sel, setSel] = useState(null)
  const [pageInput, setPageInput] = useState('')
  const [inputErr, setInputErr] = useState(false)
  const stageRef = useRef(null)
  const statusRef = useRef(null)

  // URL (?p=) → səhifə (Geri/İrəli düymələri, link)
  useEffect(() => {
    const p = readPageParam(location.search)
    if (p && p !== page) setPage(p)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const goTo = useCallback((p) => {
    const n = clampPage(p)
    setSel(null)
    setTurn(n > page ? 'next' : n < page ? 'prev' : '')
    if (n !== page) playSound('page')
    setPage(n)
    const search = `?p=${n}`
    if (window.location.search !== search) {
      routerNavigate({ pathname: window.location.pathname, search }, { replace: true, state: window.history.state?.usr ?? null })
    }
  }, [routerNavigate, page])

  // Yadda saxlama + qonşu səhifələri qabaqcadan yükləmə (məlumat: useMushafPage)
  useEffect(() => {
    saveLastPage(pR)
    const step = spread ? 2 : 1
    const t = setTimeout(() => {
      prefetchMushafPage(pR + step, wl); prefetchMushafPage(pR - step, wl)
      if (spread) { prefetchMushafPage(pR + 3, wl); prefetchMushafPage(pR - 1, wl) }
    }, 600)
    return () => clearTimeout(t)
  }, [pR, spread, wl])

  const lastStart = spread ? MUSHAF_PAGES - 1 : MUSHAF_PAGES
  const next = useCallback(() => { if (pR < lastStart) goTo(pR + (spread ? 2 : 1)) }, [pR, lastStart, spread, goTo])
  const prev = useCallback(() => { if (pR > 1) goTo(pR - (spread ? 2 : 1)) }, [pR, spread, goTo])

  // Klaviatura: ← növbəti, → əvvəlki (mushafda növbəti səhifə soldadır)
  useEffect(() => {
    const onKey = e => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTyping(document.activeElement)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); next() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  // Sürüşdürmə: barmaq sağa → növbəti (səhifə soldan gəlir), sola → əvvəlki
  const touch = useRef(null)
  const onTouchStart = e => {
    const t = e.touches[0]
    touch.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, at: Date.now() } : null
  }
  const onTouchEnd = e => {
    const s = touch.current
    touch.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - s.at > 800) return
    if (dx > 0) next(); else prev()
  }

  const togglePref = key => {
    setPrefs(p => { const v = { ...p, [key]: !p[key] }; savePrefs(v); return v })
    if (key === 'wbw') setSel(null)
  }

  const juz = data?.juz || juzForPage(pR)
  const pageSurahs = surahsOnPage(pR)
  const headerSurah = data?.words?.[0]?.s || pageSurahs[0]
  const pagesText = pL ? `${pR}–${pL}` : String(pR)
  const statusText = `${L.page} ${pagesText} ${L.of} ${MUSHAF_PAGES} · ${L.juz} ${juz}`

  const rootsHref = root => `${pathFor(ROOTS_KEY, lang)}?root=${encodeURIComponent(root)}`

  const submitPage = e => {
    e.preventDefault()
    const n = Number(pageInput)
    if (!isValidPage(n)) { setInputErr(true); return }
    setInputErr(false)
    setPageInput('')
    goTo(n)
  }

  const onWordClick = (w) => (e) => {
    if (!prefs.wbw) return
    const rect = e.currentTarget.getBoundingClientRect()
    setSel(cur => (cur && cur.w.key === w.key && cur.w.p === w.p ? null : { w, rect }))
  }

  const onAyahLink = (e) => {
    const a = e.target.closest?.('a[href]')
    if (!a || !isPlainClick(e) || a.origin !== window.location.origin) return
    e.preventDefault()
    routerNavigate(a.pathname + a.search)
  }

  const legendRules = TAJWEED_LEGEND

  return (
    <div className="mp-page">
      <header className="ui-page-hero mp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          <p className="ui-lead">{L.lead}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} />{L.hint}</p>
          <ul className="ui-page-hero__stats">
            {MP_TXT.stats.map(x => <li key={x.v}><b>{x.v}</b><span>{pk(x.l, lang)}</span></li>)}
          </ul>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className={`ui-container mp-layout${spread ? ' is-spread' : ''}`}>
          {/* İdarə paneli: keçid + rejimlər */}
          <div className="ui-card mp-controls">
            <form className="mp-go" onSubmit={submitPage} noValidate>
              <label className="ui-field mp-go__field">
                <span className="ui-field__label">{L.goPage}</span>
                <span className="mp-go__row">
                  <input className="ui-input mp-go__input ui-num" type="number" inputMode="numeric" min={1} max={MUSHAF_PAGES}
                    value={pageInput} placeholder={String(page)} aria-invalid={inputErr || undefined}
                    aria-describedby={inputErr ? 'mp-go-err' : undefined}
                    onChange={e => { setPageInput(e.target.value); setInputErr(false) }} />
                  <button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm">{L.go}</button>
                </span>
                {inputErr && <span id="mp-go-err" className="ui-field__hint mp-go__err" role="alert">{L.range}</span>}
              </label>
              <label className="ui-field mp-go__field">
                <span className="ui-field__label">{L.surah}</span>
                <select className="ui-select" value={pageSurahs.includes(headerSurah) ? headerSurah : ''}
                  onChange={e => { const s = Number(e.target.value); if (s) goTo(surahStartPage(s)) }}>
                  <option value="" disabled>{L.pickSurah}</option>
                  {SURAH_TABLE.map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}. {surahName(i + 1, lang)}</option>
                  ))}
                </select>
              </label>
              <label className="ui-field mp-go__field mp-go__field--juz">
                <span className="ui-field__label">{L.juz}</span>
                <select className="ui-select" value={juz} onChange={e => goTo(juzStartPage(Number(e.target.value)))}>
                  {Array.from({ length: 30 }, (_, i) => <option key={i + 1} value={i + 1}>{L.juz} {i + 1}</option>)}
                </select>
              </label>
            </form>
            <div className="mp-modes" role="group" aria-label={L.title}>
              <button type="button" className="ui-chip" aria-pressed={prefs.tajweed} onClick={() => togglePref('tajweed')}>
                <Icon name="palette" size={16} /> {L.tajweed}
              </button>
              <button type="button" className="ui-chip" aria-pressed={prefs.wbw} onClick={() => togglePref('wbw')}>
                <Icon name="list" size={16} /> {L.wbw}
              </button>
              <SoundToggle lang={lang} />
              {wide && (
                <button type="button" className="ui-chip" aria-pressed={prefs.spread} onClick={() => togglePref('spread')}>
                  <Icon name="mushaf" size={16} /> {L.spread}
                </button>
              )}
            </div>
            {prefs.tajweed && (
              <ul className="mp-legend" aria-label={L.legend}>
                {legendRules.map(g => (
                  <li key={g.id} className="mp-legend__item">
                    <span className={`mp-legend__dot tj-g-${g.id}`} aria-hidden="true"></span>
                    {g.label[lang] || g.label.en}
                  </li>
                ))}
              </ul>
            )}
            {prefs.wbw && <p className="mp-note"><Icon name="touch" size={15} /> {L.wbwHint}{L.wbwNote ? ` ${L.wbwNote}` : ''}</p>}
          </div>

          {/* Vərəqləmə: növbəti SOLDA (mushaf qaydası) — istiqamət hər dildə eynidir */}
          <nav className="mp-pager" aria-label={L.page} dir="ltr">
            <button type="button" className="ui-btn ui-btn--secondary mp-pager__btn" onClick={next} disabled={pR >= lastStart} aria-label={L.next} title={L.next}>
              <Icon name="chevronLeft" size={18} /> <span className="mp-pager__txt">{L.next}</span>
            </button>
            <p className="mp-pager__pos" ref={statusRef} aria-live="polite" dir="auto">
              <span className="ui-num">{pagesText}</span> <span className="mp-pager__of">/ {MUSHAF_PAGES}</span>
              <span className="ui-sr-only">{statusText}</span>
            </p>
            <button type="button" className="ui-btn ui-btn--secondary mp-pager__btn" onClick={prev} disabled={pR <= 1} aria-label={L.prev} title={L.prev}>
              <span className="mp-pager__txt">{L.prev}</span> <Icon name="chevron" size={18} />
            </button>
          </nav>
          {/* Mushafda irəliləyiş: səhifə / 604 (nazik zolaq) */}
          <ProgressBar className="mp-progress" value={pL || pR} max={MUSHAF_PAGES} size="sm" label={`${pk(MP_TXT.pos, lang)}: ${pagesText} / ${MUSHAF_PAGES}`} />

          <div className="mp-stage" ref={stageRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={onAyahLink}>
            {/* Açıq kitab (iki vərəq) və ya tək vərəq; key dəyişəndə vərəq "çevrilir" */}
            <div className={`mp-book${spread ? ' is-spread' : ''}`} key={pR} data-turn={turn} dir="rtl">
              <MushafSheet page={pR} data={data} error={error} prefs={prefs} sel={sel} onWordClick={onWordClick}
                L={L} onRetry={() => setReload(n => n + 1)} side={spread ? 'right' : ''} />
              {pL && (
                <MushafSheet page={pL} data={left.data} error={left.error} prefs={prefs} sel={sel} onWordClick={onWordClick}
                  L={L} onRetry={() => setReload(n => n + 1)} side="left" />
              )}
            </div>

            {sel && prefs.wbw && (
              <WordPopover sel={sel} L={L} lang={lang} onClose={() => setSel(null)} stageRef={stageRef} rootsHref={rootsHref} />
            )}
          </div>

          <p className="mp-source">{L.source}</p>
        </div>
      </div>

      {/* Mushafın quruluşu — bölgü vahidləri bir baxışda + istifadə qeydləri */}
      <section className="ui-section ui-section--alt mp-about ui-cv" style={{ '--cv-h': '520px' }} aria-labelledby="mp-about-title">
        <div className="ui-container">
          <div className="ui-section-head">
            <span className="ui-eyebrow">{pk(MP_TXT.eyebrow, lang)}</span>
            <h2 id="mp-about-title" className="ui-title">{pk(MP_TXT.title, lang)}</h2>
            <p className="ui-lead">{pk(MP_TXT.lead, lang)}</p>
          </div>
          <div className="ui-stats mp-units">
            {MP_TXT.units.map(u => <StatTile key={u.v} value={u.v} label={pk(u.l, lang)} hint={pk(u.h, lang)} />)}
          </div>
          <h3 className="ui-title ui-title--sm mp-tips__title">{pk(MP_TXT.tips, lang)}</h3>
          <ul className="mp-tips">
            {MP_TXT.tipItems.map(x => (
              <li key={x.i}><span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={x.i} /></span><span>{pk(x.t, lang)}</span></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
