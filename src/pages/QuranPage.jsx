import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, memo, startTransition, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { SURAH_AZ, getSurahLocal } from '../data/surahNamesAz'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { parsePath, pathFor, EXTRA_LANGS, EXTRA_CODES, isExtraLang, dirOf } from '../seo/routes'
import { BASMALA_DISPLAY, displayAyah, hasSeparateBasmala, ayahCountText, stripTranslationNotes } from '../utils/quranText'
import QuranPlayer, { useQuranPlayer } from '../components/QuranPlayer'
import AyahTafsir from '../components/TafsirPanel'
import { readTafsirChoices, tafsirFor, saveTafsirChoice } from '../utils/tafsir'
import { ChartFigure, BarChart, Donut, ProgressRing, StatTile, Timeline } from '../components/viz'
import { SURAH_TABLE, JUZ_START_PAGES } from '../data/mushafIndex'
import { JUZ_VERSES, juzOfSurah } from '../data/juzMap'
import { QURAN_GUIDE } from '../data/guides/QuranPage'
import KhatmPlanner from '../components/quran/KhatmPlanner'
import QuranRadio from '../components/quran/QuranRadio'
import SurahArt from '../components/quran/SurahArt'
// Dizayn v6: seqmentlərdə seçilmiş hap yayla sürüşür (src/motion, layoutId)
import { SegGroup, SegPill } from '../components/quran/SegPill'
import SurahRootCloud from '../components/quran/SurahRootCloud'
import OfflinePack from '../components/OfflinePack'
import OfflineAudio from '../components/quran/OfflineAudio'
import DeferRender from '../components/DeferRender'
import { quranEncOptions, quranEncUrl, readTranslationChoices, translationFor, saveTranslationChoice, fetchQuranEncSura, fetchQuranEncMeta } from '../utils/quranEnc'
import '../styles/QuranPage.css'
import { pickUi } from '../utils/uiText'

// 5 dilli sahə: { az, en, … } → cari dil ('' — qəsdən boş, məs. ərəbcədə məna təkrarlanmır)
const pk = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] !== undefined ? o[lang] : o.az)) || ''
// API siyahısı hələ yoxdursa surənin adı (yerli cədvəl / mushaf indeksi)
function staticSurahName(n, lang) {
  if (lang === 'ar') return SURAH_TABLE[n - 1]?.[4] || String(n)
  return getSurahLocal(n, lang)?.name || (lang === 'az' && SURAH_AZ[n] ? SURAH_AZ[n].name : SURAH_TABLE[n - 1]?.[5]) || String(n)
}

// Hər dilin ÖZ tərcümə nəşri. Nəşr alınmasa başqa dilə (ingilis/türk)
// DÜŞMÜRÜK — dürüst xəta + "Yenidən cəhd et" göstərilir.
// Əlavə dillər (/id/quran…) — src/seo/langs.js-dəki rəsmi nəşr; interfeys
// orada ingiliscədir (lang = 'en'), tərcümə isə URL-in dilindədir (tlang)
const EDITION_MAP = { az:'az.mammadaliyev', en:'en.asad', ru:'ru.kuliev', ar:'ar.muyassar', tr:'tr.diyanet',
  // QuranEnc dilləri (qe) — əsas nəşr ingiliscədir, amma onun mətni göstərilmir:
  // tərcümə QuranEnc-dən gəlir (aşağıda transKey məcburidir)
  ...Object.fromEntries(EXTRA_CODES.map(c => [c, EXTRA_LANGS[c].quran || 'en.asad'])) }
/** Nəşrin ayə mətni göstəriş üçün (fars nəşrində [[…]] lüğət qeydləri ayrılır). */
const trText = (text, lang) => (EXTRA_LANGS[lang]?.notes ? stripTranslationNotes(text) : (text || ''))

// Standart nəşrin (EDITION_MAP) tərcüməçisi — tərcümə seçicisində və mənbə sətrində
const DEFAULT_TRANSLATOR = { az:'Vasim Məmmədəliyev və Ziya Bünyadov', en:'Muhammad Asad', ru:'Эльмир Кулиев', ar:'التفسير الميسر', tr:'Diyanet İşleri Başkanlığı' }

// QuranEnc.com tərcümə seçicisi (utils/quranEnc.js)
const QE_LABELS = {
  az: { label:'Tərcümə', def:'standart', group:'QuranEnc.com — yoxlanılmış tərcümələr', source:'Mənbə', version:'versiya', updated:'yenilənib', loading:'Tərcümə yüklənir…', failed:'QuranEnc tərcüməsi yüklənmədi — standart tərcümə göstərilir.', notes:'Haşiyələr' },
  en: { label:'Translation', def:'default', group:'QuranEnc.com — reviewed translations', source:'Source', version:'version', updated:'updated', loading:'Loading translation…', failed:'The QuranEnc translation could not be loaded — showing the default translation.', notes:'Footnotes' },
  ru: { label:'Перевод', def:'по умолчанию', group:'QuranEnc.com — проверенные переводы', source:'Источник', version:'версия', updated:'обновлено', loading:'Загрузка перевода…', failed:'Не удалось загрузить перевод QuranEnc — показан перевод по умолчанию.', notes:'Примечания' }, // lang-ok[QuranEnc]: saytın adı (brend)
  ar: { label:'التفسير', def:'الافتراضي', group:'QuranEnc.com — تراجم وتفاسير محكَّمة', source:'المصدر', version:'الإصدار', updated:'آخر تحديث', loading:'جارٍ تحميل التفسير…', failed:'تعذّر تحميل التفسير من QuranEnc — يُعرض التفسير الافتراضي.', notes:'الحواشي' }, // lang-ok[QuranEnc]: saytın adı (brend)
  tr: { label:'Meal', def:'varsayılan', group:'QuranEnc.com — incelenmiş mealler', source:'Kaynak', version:'sürüm', updated:'güncellendi', loading:'Meal yükleniyor…', failed:'QuranEnc meali yüklenemedi — varsayılan meal gösteriliyor.', notes:'Dipnotlar' }, // lang-ok[QuranEnc]: saytın adı (brend)
}

const RETRY_LABELS = {
  az: { msg:'Surə yüklənmədi. İnternet bağlantısını yoxlayın.', listMsg:'Surələrin siyahısı yüklənmədi. İnternet bağlantısını yoxlayın.', retry:'Yenidən cəhd et' },
  en: { msg:'The surah could not be loaded. Please check your connection.', listMsg:'The list of surahs could not be loaded. Please check your connection.', retry:'Try again' },
  ru: { msg:'Не удалось загрузить суру. Проверьте подключение к интернету.', listMsg:'Не удалось загрузить список сур. Проверьте подключение к интернету.', retry:'Повторить' },
  ar: { msg:'تعذّر تحميل السورة. تحقّق من الاتصال بالإنترنت.', listMsg:'تعذّر تحميل قائمة السور. تحقّق من الاتصال بالإنترنت.', retry:'أعد المحاولة' },
  tr: { msg:'Sure yüklenemedi. İnternet bağlantınızı kontrol edin.', listMsg:'Sure listesi yüklenemedi. İnternet bağlantınızı kontrol edin.', retry:'Tekrar dene' },
}

const SEARCH_LABELS = {
  az: { surahSearch: 'Surə axtar', verseSearch: 'Ayə axtar', searching: 'Axtarılır...', noResults: 'Nəticə tapılmadı', searchError: 'Axtarış alınmadı. İnternet bağlantısını yoxlayın.', result: 'nəticə', minChars: 'Axtarmaq üçün ən azı 3 hərf yazın', mode: 'Axtarış növü', place: 'Nazil olma yeri' },
  en: { surahSearch: 'Search surahs', verseSearch: 'Search verses', searching: 'Searching...', noResults: 'No results found', searchError: 'The search failed. Please check your connection.', result: 'results', minChars: 'Type at least 3 letters to search', mode: 'Search type', place: 'Place of revelation' },
  ru: { surahSearch: 'Поиск сур', verseSearch: 'Поиск аятов', searching: 'Поиск...', noResults: 'Ничего не найдено', searchError: 'Поиск не удался. Проверьте подключение к интернету.', result: 'результатов', minChars: 'Введите не менее 3 букв для поиска', mode: 'Тип поиска', place: 'Место ниспослания' },
  ar: { surahSearch: 'بحث السور', verseSearch: 'بحث الآيات', searching: 'جارٍ البحث...', noResults: 'لا نتائج', searchError: 'تعذّر البحث. تحقّق من الاتصال بالإنترنت.', result: 'نتائج', minChars: 'اكتب ثلاثة أحرف على الأقل للبحث', mode: 'نوع البحث', place: 'مكان النزول' },
  tr: { surahSearch: 'Sure ara', verseSearch: 'Ayet ara', searching: 'Aranıyor...', noResults: 'Sonuç bulunamadı', searchError: 'Arama yapılamadı. İnternet bağlantınızı kontrol edin.', result: 'sonuç', minChars: 'Aramak için en az 3 harf yazın', mode: 'Arama türü', place: 'İniş yeri' },
}

const BOOKMARK_LABELS = {
  az: 'Oxumağa davam et',
  en: 'Continue reading',
  ru: 'Продолжить чтение',
  ar: 'أكمل القراءة',
  tr: 'Okumaya devam et'
}

// v3.2: görünüş tabları (surələr / cüzlər / saxlanılan ayələr), sıralama,
// ayəni saxla / paylaş, əzbər rejimi, günün ayəsi
const V32_LABELS = {
  az: {
    views:'Görünüş', surahs:'Surələr', juz:'Cüzlər', saved:'Saxlanılanlar',
    sort:'Sıralama', sortMushaf:'Mushaf sırası', sortShort:'Əvvəlcə qısa', sortLong:'Əvvəlcə uzun',
    read:'Oxunub', save:'Ayəni saxla', unsave:'Saxlanılanlardan çıxar', remove:'Sil',
    share:'Paylaş', copied:'Kopyalandı',
    zen:'Zen', zenHint:'Tam ekranda ayə-ayə dinlə', memorize:'Əzbər rejimi', memorizeHint:'Ərəb mətni gizlədilib — yoxlamaq üçün «Göstər» düyməsini basın.', reveal:'Göstər', hide:'Gizlət',
    savedEmpty:'Hələ ayə saxlamamısınız. Oxuyucuda ayənin yanındakı əlfəcin düyməsini basın — ayə burada görünəcək.',
    savedNote:'Yalnız bu cihazda saxlanılır.',
    votd:'Günün ayəsi', votdOpen:'Surədə aç', votdNote:'Hər gün başqa ayə',
    juzFrom:'Başlayır', juzTo:'Bitir', surahsN: n => `${n} surə`, ayahsN: n => `${n} ayə`, pageN: n => `${azOrdinal(n)} səhifədən`,
    openJuz:'Cüzü oxu',
  },
  en: {
    views:'View', surahs:'Surahs', juz:'Juz', saved:'Saved',
    sort:'Sort', sortMushaf:'Mushaf order', sortShort:'Shortest first', sortLong:'Longest first',
    read:'Read', save:'Save verse', unsave:'Remove from saved', remove:'Remove',
    share:'Share', copied:'Copied',
    zen:'Zen', zenHint:'Listen verse by verse in full screen', memorize:'Memorise mode', memorizeHint:'The Arabic text is hidden — press “Show” to check yourself.', reveal:'Show', hide:'Hide',
    savedEmpty:'You have not saved any verses yet. In the reader, press the bookmark button next to a verse and it will appear here.',
    savedNote:'Stored on this device only.',
    votd:'Verse of the day', votdOpen:'Open in surah', votdNote:'A different verse every day',
    juzFrom:'Starts', juzTo:'Ends', surahsN: n => `${n} ${n === 1 ? 'surah' : 'surahs'}`, ayahsN: n => `${n} verses`, pageN: n => `from page ${n}`,
    openJuz:'Read this juz',
  },
  ru: {
    views:'Вид', surahs:'Суры', juz:'Джузы', saved:'Сохранённые',
    sort:'Сортировка', sortMushaf:'Порядок мусхафа', sortShort:'Сначала короткие', sortLong:'Сначала длинные',
    read:'Прочитано', save:'Сохранить аят', unsave:'Убрать из сохранённых', remove:'Удалить',
    share:'Поделиться', copied:'Скопировано',
    zen:'Дзен', zenHint:'Слушать по аятам на весь экран', memorize:'Режим заучивания', memorizeHint:'Арабский текст скрыт — нажмите «Показать», чтобы проверить себя.', reveal:'Показать', hide:'Скрыть',
    savedEmpty:'Вы ещё не сохранили ни одного аята. В читалке нажмите кнопку закладки рядом с аятом — он появится здесь.',
    savedNote:'Хранится только на этом устройстве.',
    votd:'Аят дня', votdOpen:'Открыть в суре', votdNote:'Каждый день новый аят',
    juzFrom:'Начало', juzTo:'Конец', surahsN: n => `сур: ${n}`, ayahsN: n => `аятов: ${n}`, pageN: n => `со страницы ${n}`,
    openJuz:'Читать джуз',
  },
  ar: {
    views:'العرض', surahs:'السور', juz:'الأجزاء', saved:'المحفوظات',
    sort:'الترتيب', sortMushaf:'ترتيب المصحف', sortShort:'الأقصر أولًا', sortLong:'الأطول أولًا',
    read:'مقروءة', save:'احفظ الآية', unsave:'أزل من المحفوظات', remove:'حذف',
    share:'مشاركة', copied:'نُسخ',
    zen:'وضع التأمل', zenHint:'استمع آية آية بملء الشاشة', memorize:'وضع الحفظ', memorizeHint:'النص العربي مخفي — اضغط «أظهر» لتختبر نفسك.', reveal:'أظهر', hide:'أخفِ',
    savedEmpty:'لم تحفظ أي آية بعد. في القارئ اضغط زر العلامة بجانب الآية فتظهر هنا.',
    savedNote:'تُحفظ على هذا الجهاز فقط.',
    votd:'آية اليوم', votdOpen:'افتح في السورة', votdNote:'آية مختلفة كل يوم',
    juzFrom:'البداية', juzTo:'النهاية', surahsN: n => `${n} سورة`, ayahsN: n => `${n} آية`, pageN: n => `من الصفحة ${n}`,
    openJuz:'اقرأ الجزء',
  },
  tr: {
    views:'Görünüm', surahs:'Sureler', juz:'Cüzler', saved:'Kaydedilenler',
    sort:'Sıralama', sortMushaf:'Mushaf sırası', sortShort:'Önce kısa', sortLong:'Önce uzun',
    read:'Okundu', save:'Ayeti kaydet', unsave:'Kaydedilenlerden çıkar', remove:'Sil',
    share:'Paylaş', copied:'Kopyalandı',
    zen:'Zen', zenHint:'Tam ekranda ayet ayet dinle', memorize:'Ezber modu', memorizeHint:'Arapça metin gizlendi — kendinizi kontrol etmek için «Göster» düğmesine basın.', reveal:'Göster', hide:'Gizle',
    savedEmpty:'Henüz ayet kaydetmediniz. Okuyucuda ayetin yanındaki yer imi düğmesine basın — ayet burada görünecek.',
    savedNote:'Yalnızca bu cihazda saklanır.',
    votd:'Günün ayeti', votdOpen:'Surede aç', votdNote:'Her gün başka bir ayet',
    juzFrom:'Başlangıç', juzTo:'Bitiş', surahsN: n => `${n} sure`, ayahsN: n => `${n} ayet`, pageN: n => `${n}. sayfadan`,
    openJuz:'Cüzü oku',
  },
}

// ── Saxlanılan ayələr: [{ s, a, t }] (ən yenisi əvvəldə) ──
const SAVED_KEY = 'quran_saved_ayahs'
function readSaved() {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY))
    if (!Array.isArray(v)) return []
    return v.filter(x => x && Number.isInteger(x.s) && x.s >= 1 && x.s <= 114 && Number.isInteger(x.a) && x.a >= 1)
  } catch { return [] }
}
function writeSaved(list) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)) } catch { /* yaddaş bağlıdır */ }
}

// Günün ayəsi: yerli tarixdən sabit seçim (bütün gün eyni ayə), 1…6236
function verseOfDayNumber() {
  const now = new Date()
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000)
  return ((day * 7919) % 6236) + 1
}
// Günün ayəsi — ərəb mətni (ar.alafasy) + cari dilin öz nəşri (ərəbcədə yalnız mətn).
// Alınmasa kart heç görünmür (sakit uğursuzluq — əsas siyahıya mane olmur)
function useVerseOfDay(lang) {
  const [v, setV] = useState(null)
  useEffect(() => {
    const edition = EDITION_MAP[lang]
    if (!edition) return undefined
    const ctrl = new AbortController()
    const g = verseOfDayNumber()
    const eds = lang === 'ar' ? 'ar.alafasy' : `ar.alafasy,${edition}`
    setV(null)
    fetchJSON(`https://api.alquran.cloud/v1/ayah/${g}/editions/${eds}`, ctrl.signal)
      .then(d => {
        if (ctrl.signal.aborted) return
        const [ar, tr] = Array.isArray(d?.data) ? d.data : []
        if (!ar?.text || !ar.surah?.number) return
        if (lang !== 'ar' && tr?.edition?.identifier !== edition) return
        // QuranEnc dilində (qe) günün ayəsi tərcüməsiz — ingiliscə nəşr başqa dilin səhifəsinə düşməsin
        setV({ s: ar.surah.number, a: ar.numberInSurah, ar: displayAyah(ar.text, ar.surah.number, ar.numberInSurah - 1), tr: lang === 'ar' || EXTRA_LANGS[lang]?.qe ? '' : trText(tr?.text, lang) })
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [lang])
  return v
}

// "Ayəyə keç" idarəsi (oxuyucunun panelində) və ayə nömrəsinin linki
const JUMP_LABELS = {
  az: { jump:'Ayəyə keç', field:'Ayənin nömrəsi', go:'Keç', pick:'Və ya siyahıdan seçin', link:'Bu ayənin linki', range: n => `1 ilə ${n} arasında rəqəm yazın` },
  en: { jump:'Go to verse', field:'Verse number', go:'Go', pick:'Or pick from the list', link:'Link to this verse', range: n => `Enter a number from 1 to ${n}` },
  ru: { jump:'Перейти к аяту', field:'Номер аята', go:'Перейти', pick:'Или выберите из списка', link:'Ссылка на этот аят', range: n => `Введите число от 1 до ${n}` },
  ar: { jump:'انتقل إلى آية', field:'رقم الآية', go:'انتقل', pick:'أو اختر من القائمة', link:'رابط هذه الآية', range: n => `أدخل رقمًا من 1 إلى ${n}` },
  tr: { jump:'Ayete git', field:'Ayet numarası', go:'Git', pick:'Ya da listeden seçin', link:'Bu ayetin bağlantısı', range: n => `1 ile ${n} arasında bir sayı yazın` },
}

// Azərbaycan dilində sıra şəkilçisi rəqəmin oxunuşuna görədir:
// 1-ci, 3-cü, 6-cı, 9-cu, 10-cu, 40-cı, 100-cü (ayə ən çox 286-dır)
const AZ_ONES = ['', 'ci', 'ci', 'cü', 'cü', 'ci', 'cı', 'ci', 'ci', 'cu']
const AZ_TENS = ['', 'cu', 'ci', 'cu', 'cı', 'ci', 'cı', 'ci', 'ci', 'cı']
function azOrdinal(n) {
  if (n % 10) return `${n}-${AZ_ONES[n % 10]}`
  if (n % 100) return `${n}-${AZ_TENS[(n % 100) / 10]}`
  return `${n}-cü`
}
// "50-ci ayə" / "verse 50" / "аят 50" / "الآية 50" / "50. ayet"
function ayahLabel(n, lang) {
  switch (lang) {
    case 'az': return `${azOrdinal(n)} ayə`
    case 'ru': return `аят ${n}`
    case 'ar': return `الآية ${n}`
    case 'tr': return `${n}. ayet`
    default:   return `verse ${n}`
  }
}
// "Bəqərə, 50-ci ayə" (ərəbcədə ərəb vergülü)
const placeLabel = (name, n, lang) => `${name}${lang === 'ar' ? '، ' : ', '}${ayahLabel(n, lang)}`
const capFirst = s => s.charAt(0).toLocaleUpperCase() + s.slice(1)

// ── Oxuma yeri (əlfəcin) ──
// Açar köhnədir: 'quran_bookmark' = { surah, name, time }. İndi ayah da
// yazılır (oxuduqca, ekranın yuxarısındakı ilk ayə). Köhnə yazıda ayah
// yoxdursa surə əvvəldən açılır — geriyə uyğundur. Mobil tətbiq eyni formadadır.
const BOOKMARK_KEY = 'quran_bookmark'
function readBookmark() {
  try {
    const bm = JSON.parse(localStorage.getItem(BOOKMARK_KEY))
    const surah = Number(bm?.surah)
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null
    const ayah = Number(bm.ayah)
    return { ...bm, surah, ayah: Number.isInteger(ayah) && ayah > 1 ? ayah : undefined }
  } catch { return null }
}
function writeBookmark(bm) {
  try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bm)) } catch { /* yaddaş bağlıdır */ }
}

// ── Ünvan: /quran/2-al-baqara?a=90 ──
// Surə yolun özündədir (src/seo/routes.js → DETAILS.quran): hər surənin
// indekslənən, prerender olunmuş öz səhifəsi var. a = ayə (≥ 1; surə
// yüklənəndə sıxılır) — query-də qalır, canonical-a təsir etmir.
// Köhnə /quran?s=2&a=90 linklərini App.jsx yeni ünvana replace ilə çevirir.
function readLoc(pathname, search) {
  const { key, param } = parsePath(pathname)
  const s = key === 'quran' && param ? param : null
  if (!s) return { s: null, a: null }
  const a = Number(new URLSearchParams(search || '').get('a'))
  return { s, a: Number.isInteger(a) && a >= 1 ? a : null }
}
const searchFor = (a) => (a ? `?a=${a}` : '')

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}
// Yazı sahəsindədirsə qısayol işləmir (Header.jsx-dəki "/" ilə eyni qayda)
const isTyping = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

// Ərəb mətninin miqyası (A− / A+): 0.8…1.5, addım 0.1 — yadda qalır
const FONT_KEY = 'quran_font_scale'
const FONT_MIN = 0.8
const FONT_MAX = 1.5
const stepFont = (f, d) => Math.round(Math.min(FONT_MAX, Math.max(FONT_MIN, f + d * 0.1)) * 10) / 10
function readFontScale() {
  try {
    const v = Number(localStorage.getItem(FONT_KEY))
    return v >= FONT_MIN && v <= FONT_MAX ? v : 1
  } catch { return 1 }
}

const TAFSIR_LABELS = {
  az: 'Təfsir',
  en: 'Tafsir',
  ru: 'Тафсир',
  ar: 'تفسير',
  tr: 'Tefsir',
}

// Ayənin səs düyməsi (ekran oxuyucusu üçün; əvvəl yalnız ▶ işarəsi idi)
const PLAY_LABELS = {
  az: { play:'Ayəni dinlə', pause:'Dayandır' },
  en: { play:'Listen to the verse', pause:'Pause' },
  ru: { play:'Слушать аят', pause:'Пауза' },
  ar: { play:'استمع إلى الآية', pause:'إيقاف مؤقت' },
  tr: { play:'Ayeti dinle', pause:'Duraklat' },
}

// Oynat / fasilə ikonları — SVG: telefonda ⏸ simvolu rəngli emoji kimi çıxırdı
function PlayIcon({ playing }) {
  return playing ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/>
      <rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4C8.9 4.3 8 4.8 8 5.6z" fill="currentColor"/>
    </svg>
  )
}

// Yüklənmə skeletləri (telefonda spinner əvəzinə — məzmunun formasını göstərir).
// Kompüterdə köhnə spinner qalır (CSS ilə seçilir).
function ReaderSkeleton({ label }) {
  return (
    <div className="q-skel q-skel-reader" role="status" aria-label={label}>
      <div className="skeleton q-skel-head" />
      <div className="skeleton q-skel-basmala" />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="q-skel-ayah">
          <span className="skeleton skeleton--circle q-skel-num" />
          <span className="skeleton skeleton--text q-skel-line" />
          <span className="skeleton skeleton--text q-skel-line q-skel-line--short" />
        </div>
      ))}
    </div>
  )
}

// Boş / xəta vəziyyəti — ikon kafeli + mətn (+ istəyə görə düymə).
// Əvvəl "📖" emojisi və boz mətn idi.
function QEmpty({ icon = 'quran', bad = false, children, action }) {
  return (
    <div className={`qp-empty${bad ? ' qp-empty--bad' : ''}`} role={bad ? 'alert' : 'status'}>
      <span className="ui-icon-tile ui-icon-tile--lg qp-empty__icon" aria-hidden="true"><Icon name={icon} /></span>
      <p className="qp-empty__text">{children}</p>
      {action}
    </div>
  )
}

function ListSkeleton({ label }) {
  return (
    <div className="q-skel q-skel-list" role="status" aria-label={label}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="q-skel-row">
          <span className="skeleton q-skel-tile" />
          <span className="q-skel-body">
            <span className="skeleton skeleton--text q-skel-title" />
            <span className="skeleton skeleton--text q-skel-sub" />
          </span>
        </div>
      ))}
    </div>
  )
}

// Oxuma statistikası zolağının yazıları
const STATS_LABELS = {
  az: { reads:'Oxuma', surahs:'Surə', streak:'Gün ardıcıl', most:'Ən çox oxunan' },
  en: { reads:'Reads', surahs:'Surahs', streak:'Day streak', most:'Most read' },
  ru: { reads:'Чтений', surahs:'Сур', streak:'Дней подряд', most:'Самая читаемая' },
  ar: { reads:'قراءات', surahs:'سور', streak:'أيام متتالية', most:'الأكثر قراءة' },
  tr: { reads:'Okuma', surahs:'Sure', streak:'Gün seri', most:'En çok okunan' },
}

// Şrift düymələri (A− / A+) üçün ekran oxuyucusu yazısı
const FONT_LABELS = {
  az: { smaller:'Yazını kiçilt', larger:'Yazını böyüt' },
  en: { smaller:'Smaller text', larger:'Larger text' },
  ru: { smaller:'Уменьшить шрифт', larger:'Увеличить шрифт' },
  ar: { smaller:'تصغير الخط', larger:'تكبير الخط' },
  tr: { smaller:'Yazıyı küçült', larger:'Yazıyı büyüt' },
}

// Nazil olma yeri. i18n-dəki t.meccan / t.medinan süzgəc düymələri üçündür
// (rus dilində cəm: "Мекканские") — surənin özü üçün tək forma lazımdır.
const REVELATION = {
  az: { Meccan:'Məkki', Medinan:'Mədəni' },
  en: { Meccan:'Meccan', Medinan:'Medinan' },
  ru: { Meccan:'Мекканская', Medinan:'Мединская' },
  ar: { Meccan:'مكية', Medinan:'مدنية' },
  tr: { Meccan:'Mekki', Medinan:'Medeni' },
}
const revelationLabel = (type, lang) => (pickUi(REVELATION, lang, 'en'))[type] || type

// ── Surənin adı və mənası cari dildə ──
// az/ru/tr: yerli yazılış (surahNamesAz.js — SURAH_AZ/RU/TR); ar: API-dəki
// ərəb adı, "سُورَةُ" sözü olmadan; en: API-nin transliterasiyası və mənası.
// (Əvvəl ru/tr-də ingiliscə məna — "The Opening" — görünürdü.)
const stripSurahWord = name => String(name || '').replace(/^سُورَةُ\s+/, '')
function surahTitle(s, lang) {
  if (!s) return ''
  const local = getSurahLocal(s.number, lang)
  if (local) return local.name
  if (lang === 'ar') return stripSurahWord(s.name)
  return s.englishName
}
function surahMeaning(s, lang) {
  if (!s || lang === 'ar') return ''
  const local = getSurahLocal(s.number, lang)
  if (local) return local.meaning
  return lang === 'en' ? s.englishNameTranslation : ''
}

// i18n sətirlərində ox mətnin içindədir ("← Geri", "Növbəti →"). Oxu atıb
// ayrıca .qm-dir-arrow ilə veririk — ərəbcədə (RTL) avtomatik güzgülənir.
const stripArrows = s => String(s || '').replace(/[←→]/g, '').trim()
// Ox ikonu: irəli — ərəbcədə güzgülənir (ui-flip-rtl); geri — əksinə (.qp-arrow--back)
function DirArrow({ back = false }) {
  return <Icon name="arrow" size={16} className={back ? 'qp-arrow qp-arrow--back' : 'qp-arrow ui-flip-rtl'} />
}

// Bəsmələ və BOM qaydası — utils/quranText.js (statik SEO səhifələri də
// eyni qaydanı işlədir: scripts/prerender.mjs)

// Şəbəkə sorğusu vaxt limiti ilə: API cavab verməsə (asılı qalan bağlantı)
// yükləmə əbədi fırlanmasın — 15 san. sonra xəta + "Yenidən cəhd et"
const FETCH_TIMEOUT = 15000
function fetchJSON(url, signal) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  return fetch(url, { signal: ctrl.signal })
    .then(r => r.json())
    .finally(() => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort) })
}

function useQuranList(attempt = 0) {
  const [surahs,  setSurahs]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useEffect(() => {
    setLoading(true); setError(null)
    fetchJSON('https://api.alquran.cloud/v1/surah')
      // Cavab gözlənilən formada deyilsə — xəta (əvvəl surahs = undefined
      // olurdu və .filter səhifəni çökdürürdü)
      .then(d => { if (!Array.isArray(d?.data)) throw new Error('bad-response'); setSurahs(d.data) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [attempt])
  return { surahs, loading, error }
}

function useSurah(num, lang, attempt = 0) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const edition = EDITION_MAP[lang]
  useEffect(() => {
    // Oxuyucu bağlandı — köhnə cavab qalmasın (eyni surə təkrar açılanda
    // yenisi gələnə qədər "hazır" sayılmasın)
    if (!num) { setData(null); setError(null); setLoading(false); return }
    if (!edition) { setError('no-edition'); return }
    // Tez-tez "Növbəti" basılanda köhnə cavab yenisinin üstünə yazılmasın
    let cancelled = false
    setLoading(true); setData(null); setError(null)
    const eds = lang === 'ar' ? 'ar.alafasy,ar.muyassar' : `ar.alafasy,${edition}`
    fetchJSON(`https://api.alquran.cloud/v1/surah/${num}/editions/${eds}`)
      .then(d => {
        if (cancelled) return
        const [arabic, trans] = Array.isArray(d?.data) ? d.data : []
        // Tərcümə məhz seçilmiş dilin nəşrindən gəlməlidir; gəlmədisə xəta
        if (!arabic?.ayahs || trans?.edition?.identifier !== edition || trans.ayahs?.length !== arabic.ayahs.length) {
          throw new Error('edition-unavailable')
        }
        // PERFORMANS (TBT): uzun surənin (Bəqərə — 286 kart) ilk render-i
        // keçid kimi — React işi ~5 ms-lik hissələrə bölür, arada brauzer
        // girişə cavab verir (əvvəl telefonda bir neçə yüz ms-lik tək tapşırıq idi)
        const verses = arabic.ayahs.map((v,i) => {
          return {
            n: v.numberInSurah,
            // BOM və 1-ci ayədəki təkrar Bəsmələ — utils/quranText.js
            ar: displayAyah(v.text, num, i),
            // Quranda ümumi ayə nömrəsi — səs faylının ünvanı ondan qurulur (utils/quranAudio.js)
            g: v.number,
            tr: trText(trans?.ayahs[i]?.text, lang),
            // v5.9: səcdə ayəsi — API-nin öz məlumatı (Mədinə mushafında 15 yer) → SajdahMoment
            sj: Boolean(v.sajda)
          }
        })
        startTransition(() => setData({ ...arabic, _key: `${num}|${lang}`, verses }))
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [num, lang, edition, attempt])
  // Yalnız istənilən surənin (və dilin) cavabını qaytar: oxuyucu bağlanıb eyni
  // surə yenidən açılanda köhnə cavab bir render "hazır" görünürdü — gözləyən
  // ayəyə keçid köhnə DOM-da edilib itirdi
  return { data: data && data._key === `${num}|${lang}` ? data : null, loading, error }
}

// QuranEnc yenilənmə tarixi (unix san.): az — "28.05.2025" (brauzerlərin çoxunda
// az lokalının ay adları yoxdur — "M05" çıxırdı), qalan dillər — qısa ay adı ilə
function qeDate(sec, lang) {
  const d = new Date(sec * 1000)
  if (lang === 'az') return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
  try { return d.toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return d.toISOString().slice(0, 10) }
}

// QuranEnc tərcüməsi (seçilibsə): surənin hər ayəsi üçün { tr, fn }. Surə
// (standart nəşr) yükləndikdən sonra sorğulanır — ayə sayı ondan götürülür.
// Xəta → oxuyucu standart tərcüməni göstərir + kiçik bildiriş.
function useQuranEnc(key, num, total, lang) {
  const [state, setState] = useState({ id: '', rows: null, meta: null, error: false })
  const id = key && num && total ? `${key}|${num}|${total}` : ''
  useEffect(() => {
    if (!id) return undefined
    const ctrl = new AbortController()
    setState(s => (s.id === id ? s : { id, rows: null, meta: s.meta?.key === key ? s.meta : null, error: false }))
    Promise.all([fetchQuranEncSura(key, num, total, ctrl.signal), fetchQuranEncMeta(key, lang, ctrl.signal)])
      .then(([rows, meta]) => { if (!ctrl.signal.aborted) startTransition(() => setState({ id, rows, meta, error: false })) })
      .catch(() => { if (!ctrl.signal.aborted) setState({ id, rows: null, meta: null, error: true }) })
    return () => ctrl.abort()
  }, [id, key, num, total, lang])
  const cur = state.id === id && id ? state : null
  return { rows: cur?.rows || null, meta: cur?.meta || null, error: !!cur?.error, loading: !!id && !cur?.rows && !cur?.error }
}

// Səs səhifə səviyyəsindədir (useQuranPlayer — components/QuranPlayer.jsx): kartın
// düyməsi həmin ayədən ardıcıl dinləməni başladır / dayandırır. active — cari
// ayə (vurğu), playing — hazırda səslənir (ikon). memo: oxuduqca yer yadda saxlananda 286 kart təkrar çəkilməsin.
// flash — "Ayəyə keç"-dən sonra kartın qısa qızılı vurğusu (0 = yoxdur).
// Neçə ilk ayə kartı sürüşəndə görünmə animasiyası alır (bax AyahCard)
const REVEAL_CARDS = 8
// Təfsir paneli (components/TafsirPanel.jsx): bağlı kartda tafsirId = 0 —
// seçim dəyişəndə yalnız açıq kartlar yenidən çəkilir; panel yalnız açılanda render olunur
const KaraokeAyah = lazy(() => import('../components/quran/KaraokeAyah'))
// v5.7: Zen — surə tam ekranda, ayə-ayə (səhifənin pleyeri ilə)
const QuranZen = lazy(() => import('../components/quran/QuranZen'))
const SajdahMoment = lazy(() => import('../components/quran/SajdahMoment'))
// Kartdakı səcdə nişanı (SajdahMoment-də də eyni sözlər)
const SAJDAH_BADGE = { az: 'Səcdə', en: 'Sajdah', ru: 'Саджда', ar: 'سجدة', tr: 'Secde' }
// v5.8: 3D Quran qalaktikası (three.js — yalnız bölməyə yaxınlaşanda)
const QuranGalaxy = lazy(() => import('../components/quran/QuranGalaxy'))
const SurahRhythm = lazy(() => import('../components/quran/SurahRhythm'))
const QuranNumbers = lazy(() => import('../components/numbers/QuranNumbers'))
const KARAOKE_LBL = { az: 'Sözbəsöz dinlə', en: 'Word by word', ru: 'Слушать по словам', tr: 'Kelime kelime dinle', ar: 'استمع كلمةً كلمة' }

// Seçib paylaş (components/SelectShare) üçün istinad: «Quran 2:255»
const CITE_Q = { az: 'Quran', en: 'Quran', ru: 'Коран', tr: 'Kur’an', ar: 'القرآن' }
const AyahCard = memo(function AyahCard({ verse, surahNum, lang, trLang = lang, showTrans, showTafsir, tafsirLabel, playLabels, active, playing, flash, numLabel, linkLabel, onToggle, onNumber, tafsirOpen, tafsirId, onTafsirToggle, onTafsirChange, saved, shared, onSave, onShare, onKaraoke, xl }) {
  const playLabel = playing ? playLabels.pause : playLabels.play
  const saveLabel = saved ? xl.unsave : xl.save
  // Əzbər rejimi: ərəb mətni CSS ilə bulanır; "Göstər" yalnız bu kartı açır.
  // Vəziyyət DOM atributundadır — 286 kart React ilə yenidən çəkilmir
  const toggleReveal = (e) => {
    const btn = e.currentTarget
    const card = btn.closest('.ayah-card')
    const open = !card.hasAttribute('data-revealed')
    card.toggleAttribute('data-revealed', open)
    btn.setAttribute('aria-pressed', String(open))
    btn.querySelector('.ayah-reveal__label').textContent = open ? xl.hide : xl.reveal
  }
  return (
    // data-reveal: ilk kartlar yumşaq görünür (motion.css). PERFORMANS: yalnız
    // ilk ekranın kartları — useReveal hər elementi izləməyə götürəndə
    // getBoundingClientRect çağırır; 286 kartda bu 286 məcburi düzülüş idi
    // (telefonda ~750 ms-lik tək tapşırıq, Bəqərə). Qalan kartlar dərhal görünür.
    // id + data-ayah: "Ayəyə keç" hədəfi və oxuma yerinin müşahidəçisi üçün
    <div id={`ayah-${verse.n}`} data-ayah={verse.n} data-sajdah={verse.sj ? '' : undefined} tabIndex={-1} data-cite={`${CITE_Q[lang] || CITE_Q.en} ${surahNum}:${verse.n}`}
      className={`ayah-card${active ? ' is-playing' : ''}${flash ? ' is-target' : ''}`} data-reveal={verse.n <= REVEAL_CARDS ? '' : undefined}
      aria-current={active ? 'true' : undefined}>
      {/* Qızılı halqa solur; key — eyni ayəyə təkrar keçəndə animasiya yenidən başlasın */}
      {flash ? <span key={flash} className="ayah-flash" aria-hidden="true" /> : null}
      {/* Nömrəyə klik: ünvana ?a=N yazılır (link paylaşmaq üçün) və yer yadda qalır */}
      <button type="button" className="ayah-num" onClick={() => onNumber(verse.n)}
        aria-label={`${numLabel} — ${linkLabel}`} title={linkLabel}>{verse.n}</button>
      <div className="ayah-body">
        <p className="ayah-arabic" lang="ar">{verse.ar}</p>
        {verse.sj && <span className="ayah-sajdah"><b aria-hidden="true">۩</b>{pickUi(SAJDAH_BADGE, lang, 'en')}</span>}
        <button type="button" className="ayah-reveal" aria-pressed="false" onClick={toggleReveal}>
          <Icon name="eye" size={16} /><span className="ayah-reveal__label">{xl.reveal}</span>
        </button>
        {showTrans && verse.tr && !showTafsir && <p className="ayah-trans" lang={trLang} dir={dirOf(trLang)}>{verse.tr}</p>}
        {showTafsir && verse.tr && (
          <div className="ayah-tafsir">
            <span className="ayah-tafsir-label">{tafsirLabel}</span>
            {verse.tr}
          </div>
        )}
        {/* QuranEnc haşiyələri — düz mətn (React özü qaçırır), sətir sonları saxlanılır */}
        {(showTrans || showTafsir) && verse.fn && (
          <details className="ayah-fn">
            <summary>{xl.notes}</summary>
            <p>{verse.fn}</p>
          </details>
        )}
        <AyahTafsir surah={surahNum} ayah={verse.n} lang={lang} open={tafsirOpen} tafsirId={tafsirId}
          onToggle={onTafsirToggle} onChangeTafsir={onTafsirChange} ayahName={numLabel} />
      </div>
      <div className="ayah-actions">
        <button type="button" className={`ayah-play press ${playing ? 'playing' : ''}`} onClick={() => onToggle(verse.n)}
          aria-label={playLabel} title={playLabel} aria-pressed={playing}>
          <PlayIcon playing={playing} />
        </button>
        {onKaraoke && (
          <button type="button" className="ayah-tool" onClick={() => onKaraoke(verse.n)}
            aria-label={`${pickUi(KARAOKE_LBL, lang, 'en')} — ${numLabel}`} title={pickUi(KARAOKE_LBL, lang, 'en')} data-testid="karaoke-open">
            <Icon name="type" size={17} />
          </button>
        )}
        <button type="button" className={`ayah-tool${saved ? ' is-on' : ''}`} onClick={() => onSave(verse.n)}
          aria-label={`${saveLabel} — ${numLabel}`} title={saveLabel} aria-pressed={!!saved}>
          <Icon name="hifz" size={17} />
        </button>
        <button type="button" className={`ayah-tool${shared ? ' is-done' : ''}`} onClick={() => onShare(verse)}
          aria-label={`${xl.share} — ${numLabel}`} title={shared ? xl.copied : xl.share}>
          <Icon name={shared ? 'check' : 'share'} size={17} />
        </button>
        {shared ? <span className="ui-sr-only" role="status">{xl.copied}</span> : null}
      </div>
    </div>
  )
})

// ── "Ayəyə keç" paneli ──
// Rəqəm sahəsi (Enter ilə, 1…N yoxlaması) + ayə nömrələrinin şəbəkəsi
// (uzun surədə — məs. 286 ayə — barmaqla seçmək rahat olsun). Panel
// yapışqan panelin altında açılır; Esc və ya kənara klik bağlayır.
function AyahJump({ total, current, labels, onJump, onClose, inputRef, triggerRef, lang }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const panelRef = useRef(null)
  const gridRef = useRef(null)

  // Açılanda: sahəyə fokus, şəbəkədə cari ayə görünsün
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
    const grid = gridRef.current
    const cur = grid?.querySelector('[aria-current="true"]')
    if (cur) {
      const off = cur.getBoundingClientRect().top - grid.getBoundingClientRect().top + grid.scrollTop
      grid.scrollTop = off - grid.clientHeight / 2 + cur.offsetHeight / 2
    }
  }, [inputRef])

  // Kənara klik / Esc → bağla (Esc-də fokus açan düyməyə qayıdır)
  useEffect(() => {
    const onDown = e => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return
      onClose(false)
    }
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); onClose(true) } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [onClose, triggerRef])

  const submit = e => {
    e.preventDefault()
    const n = Number(String(value).trim())
    if (!Number.isInteger(n) || n < 1 || n > total) { setError(true); inputRef.current?.focus(); return }
    onJump(n)
  }
  const nums = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total])
  const hintId = 'qp-jump-hint'
  return (
    <div className="qp-jump ui-enter-drop" ref={panelRef} id="qp-jump" role="dialog" aria-label={labels.jump}>
      <form className="qp-jump__form" onSubmit={submit} noValidate>
        <label className="ui-field qp-jump__field">
          <span className="ui-field__label">{labels.field}</span>
          <span className="qp-jump__row">
            <input ref={inputRef} className="ui-input qp-jump__input" type="number" inputMode="numeric"
              min={1} max={total} step={1} dir="ltr" placeholder={current ? String(current) : '1'}
              value={value} aria-invalid={error || undefined} aria-describedby={hintId}
              onChange={e => { setValue(e.target.value); setError(false) }} />
            <span className="qp-jump__of ui-num" dir="ltr" aria-hidden="true">/ {total}</span>
          </span>
        </label>
        <button type="submit" className="ui-btn ui-btn--primary qp-jump__go">
          {labels.go}<DirArrow />
        </button>
        <span id={hintId} className={`ui-field__hint qp-jump__hint${error ? ' is-error' : ''}`} role={error ? 'alert' : undefined}>
          {labels.range(total)}
        </span>
      </form>
      <p className="qp-jump__sub">{labels.pick}</p>
      <div className="qp-jump__grid" ref={gridRef} role="group" aria-label={labels.pick}>
        {nums.map(n => (
          <button type="button" key={n} className="qp-jump__num ui-num" aria-current={n === current ? 'true' : undefined}
            aria-label={capFirst(ayahLabel(n, lang))} onClick={() => onJump(n)}>{n}</button>
        ))}
      </div>
    </div>
  )
}

function calcStreak(dates) {
  if (!dates.length) return 0
  // Təkrarlar silinir; "bu gün" yerli tarixlə (trackRead də yerli tarix yazır)
  const sorted = [...new Set(dates)].sort().reverse()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (sorted[0] !== today) return 0
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i-1])
    const curr = new Date(sorted[i])
    const diff = (prev - curr) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

function getMostRead(reads) {
  const entries = Object.entries(reads)
  if (!entries.length) return '-'
  const [num] = entries.sort((a,b) => b[1] - a[1])[0]
  return num
}

export default function QuranPage() {
  // lang — interfeys; tlang — tərcümənin və ünvanın dili (/id/quran → 'id',
  // əsas dillərdə ikisi eynidir — src/seo/langs.js)
  const { lang, siteLang } = useLang()
  const tlang = siteLang || lang
  // Oflayn paketlər (mətn — OfflinePack, səs — OfflineAudio) oxuyucunun (useSurah) URL-ini keşə yazır
  const offlineSurahUrl = (n) => `https://api.alquran.cloud/v1/surah/${n}/editions/${tlang === 'ar' ? 'ar.alafasy,ar.muyassar' : `ar.alafasy,${EDITION_MAP[tlang] || EDITION_MAP.en}`}`
  const extra = isExtraLang(tlang)
  const t = pickUi(T, lang)?.quran || T.az.quran
  const [listAttempt, setListAttempt] = useState(0)
  const { surahs, loading: listLoading, error: listError } = useQuranList(listAttempt)
  const location = useLocation()
  const routerNavigate = useNavigate()
  const [bookmark, setBookmark] = useState(readBookmark)
  // Açıq surə ünvandan gəlir (/quran?s=2&a=90) — link paylaşmaq, yeniləmək
  // və Geri düyməsi (oxuyucu → siyahı) işləsin
  const [selected, setSelected] = useState(() => readLoc(location.pathname, location.search).s)
  // Surə yüklənəndən sonra keçiləcək ayə (davam et, ?a=, ayə axtarışı)
  const [pendingAyah, setPendingAyah] = useState(() => readLoc(location.pathname, location.search).a)
  // Siyahıdakı sürüşmə yeri — oxuyucudan qayıdanda ora dönürük
  const listScrollRef = useRef(0)
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  // ── Quran oxuma statistikası ──
  // Pozuq yaddaş (səhv JSON, null, massiv) oxuyucunu çökdürməsin — hər sahə yoxlanılır
  const [stats, setStats] = useState(() => {
    const empty = { reads: {}, sessions: 0, dates: [] }
    try {
      const v = JSON.parse(localStorage.getItem('quran_stats'))
      if (!v || typeof v !== 'object' || Array.isArray(v)) return empty
      return {
        reads: v.reads && typeof v.reads === 'object' && !Array.isArray(v.reads) ? v.reads : {},
        sessions: Number(v.sessions) || 0,
        dates: Array.isArray(v.dates) ? v.dates.filter(d => typeof d === 'string') : [],
      }
    } catch { return empty }
  })

  const trackRead = (surahNum) => {
    setStats(prev => {
      // Yerli tarix (toISOString UTC-dir: Bakıda gecə 00:00–04:00 oxunan surə dünənə yazılırdı)
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const reads = { ...prev.reads }
      reads[surahNum] = (reads[surahNum] || 0) + 1
      const dates = prev.dates.includes(today) ? prev.dates : [...prev.dates, today]
      const next = { reads, sessions: prev.sessions + 1, dates }
      try { localStorage.setItem('quran_stats', JSON.stringify(next)) } catch {}
      // v5.7: cümə günü Kəhf surəsi (nişan — utils/badges 'kahf'): oxunan cümələrin tarixi
      if (Number(surahNum) === 18 && now.getDay() === 5) {
        try {
          const k = JSON.parse(localStorage.getItem('kahf_fridays_v1') || '[]')
          const arr = Array.isArray(k) ? k : []
          if (!arr.includes(today)) localStorage.setItem('kahf_fridays_v1', JSON.stringify([...arr, today].slice(-60)))
        } catch { /* */ }
      }
      return next
    })
  }
  const [search,   setSearch]   = useState('')
  const [searchMode, setSearchMode] = useState('surah')
  const [verseSearch, setVerseSearch] = useState('')
  const [verseResults, setVerseResults] = useState([])
  const [verseSearching, setVerseSearching] = useState(false)
  // Ayə axtarışında şəbəkə xətası (boş nəticə ilə qarışdırılmasın) və təkrar cəhd sayğacı
  const [verseError, setVerseError] = useState(false)
  const [verseAttempt, setVerseAttempt] = useState(0)
  const verseTimerRef = useRef(null)
  // Dil dəyişəndə t.all/t.meccan/t.medinan-ın label-i dəyişir; ona görə
  // filter state-i tərcüməsiz key ('all'|'meccan'|'medinan') saxlayırıq.
  const [filter,   setFilter]   = useState('all')
  const [juz, setJuz] = useState(0)          // 0 — bütün cüzlər
  // v3.2: siyahının görünüşü (surələr / cüzlər / saxlanılanlar) və sıralama
  const [view, setView] = useState('surahs')
  const [sort, setSort] = useState('mushaf')
  const xl = pickUi(V32_LABELS, lang)
  const votd = useVerseOfDay(tlang)
  // Saxlanılan ayələr (əlfəcinlər) — açar "s:a" dəsti kartların sürətli yoxlanışı üçün
  const [savedList, setSavedList] = useState(readSaved)
  const savedKeys = useMemo(() => new Set(savedList.map(x => `${x.s}:${x.a}`)), [savedList])
  const toggleSaved = useCallback((s, a) => {
    haptic()
    setSavedList(prev => {
      const has = prev.some(x => x.s === s && x.a === a)
      const next = has ? prev.filter(x => !(x.s === s && x.a === a)) : [{ s, a, t: Date.now() }, ...prev].slice(0, 500)
      writeSaved(next)
      return next
    })
  }, [])
  // Əzbər rejimi (ərəb mətnini gizlət) — oxuyucuda
  const [memorize, setMemorize] = useState(false)
  // Paylaş: Web Share API; yoxdursa — mətn panoya kopyalanır (qısa "Kopyalandı")
  const [sharedN, setSharedN] = useState(0)
  const sharedTimerRef = useRef(null)
  const [showTrans, setShowTrans] = useState(true)
  const [showTafsir, setShowTafsir] = useState(false)
  // Ərəb mətninin miqyası (1 = baza ölçü — CSS: --qp-ar; telefonda kiçik baza).
  // Kartlara prop kimi ötürülmür — .ayahs-list-də CSS dəyişəni (286 kart yenidən çəkilmir)
  const [fontSize,  setFontSize]  = useState(readFontScale)
  useEffect(() => { try { localStorage.setItem(FONT_KEY, String(fontSize)) } catch { /* yaddaş bağlıdır */ } }, [fontSize])
  const [attempt, setAttempt] = useState(0)
  const { data: surah, error: surahError } = useSurah(selected, tlang, attempt)
  // ── Tərcümə seçimi (QuranEnc.com) — dil üzrə; boş — standart nəşr (heç nə dəyişmir) ──
  const ql = pickUi(QE_LABELS, lang, 'en')
  const [transChoices, setTransChoices] = useState(readTranslationChoices)
  // Əlavə dildə QuranEnc seçicisi yoxdur (seçim interfeys dilinə — en —
  // bağlıdır və rəsmi nəşri ingiliscə ilə əvəz edərdi)
  // QuranEnc dili (src/seo/langs.js → qe): həmin dilin yoxlanılmış QuranEnc tərcüməsi məcburidir
  const forcedQe = (extra && EXTRA_LANGS[tlang].qe) || ''
  const transKey = extra ? forcedQe : translationFor(lang, transChoices)
  const qeOptions = useMemo(() => (extra ? [] : quranEncOptions(lang)), [lang, extra])
  const surahReady = !!(selected && surah && surah.number === selected)
  const qe = useQuranEnc(transKey, surahReady ? selected : 0, surahReady ? surah.verses.length : 0, forcedQe ? tlang : lang)
  // Göstərilən ayələr: QuranEnc hazırdırsa tərcümə (və haşiyə) ondan; yoxsa standart
  const shownVerses = useMemo(() => {
    if (!surahReady) return null
    if (!qe.rows || qe.rows.length !== surah.verses.length) {
      // Məcburi QuranEnc yüklənənədək ingiliscə əsas nəşr göstərilmir (yanıb-sönməsin);
      // QuranEnc alınmasa — heç olmasa ingiliscə məna
      if (forcedQe && !qe.error) return surah.verses.map(v => ({ ...v, tr: '' }))
      return surah.verses
    }
    return surah.verses.map((v, i) => ({ ...v, tr: qe.rows[i].tr, fn: qe.rows[i].fn }))
  }, [surahReady, surah, qe.rows, qe.error, forcedQe])
  const qeShown = !!(surahReady && qe.rows && shownVerses !== surah.verses)
  const xlCard = useMemo(() => ({ ...(pickUi(V32_LABELS, lang)), notes: ql.notes }), [lang, ql])
  const rl = pickUi(RETRY_LABELS, lang)
  const sl = pickUi(SEARCH_LABELS, lang)
  const st = pickUi(STATS_LABELS, lang)
  const fl = pickUi(FONT_LABELS, lang)
  const tafsirLabel = pickUi(TAFSIR_LABELS, lang, 'en')
  const playLabels = pickUi(PLAY_LABELS, lang)
  // Real təfsir yalnız ərəbcədədir (ar.muyassar). Digər dillərin nəşri
  // tərcümədir — onu "Təfsir" adı ilə göstərmək yanıldıcı olardı.
  const hasTafsir = lang === 'ar'
  const jl = pickUi(JUMP_LABELS, lang)

  // ── Ayə təfsiri: açıq panellər (ayə nömrələri) və seçilmiş təfsir (dil üzrə, localStorage) ──
  const [tafsirOpen, setTafsirOpen] = useState(() => new Set())
  const [tafsirChoices, setTafsirChoices] = useState(readTafsirChoices)
  const tafsirId = tafsirFor(lang, tafsirChoices)
  useEffect(() => { setTafsirOpen(new Set()) }, [selected])
  const toggleTafsir = useCallback((n) => {
    haptic()
    setTafsirOpen(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n); else next.add(n)
      return next
    })
  }, [])
  const changeTafsir = useCallback((id) => {
    setTafsirChoices(saveTafsirChoice(langRef.current, id))
  }, [])

  const surahsRef = useRef(surahs)
  surahsRef.current = surahs
  const langRef = useRef(lang)
  langRef.current = lang
  // Ünvanların dili (pathFor) — əlavə dildə /id/quran/…
  const tlangRef = useRef(tlang)
  tlangRef.current = tlang

  // Yeri yaz: ayah verilməyibsə və eyni surədirsə köhnə ayə saxlanılır —
  // siyahıdan təsadüfən açıb çıxmaq dünənki 50-ci ayəni silməsin
  const saveBookmark = useCallback((num, ayah, { render = true } = {}) => {
    const prev = readBookmark()
    const keep = ayah === undefined && prev?.surah === num ? prev.ayah : ayah
    const s = surahsRef.current.find(x => x.number === num)
    const bm = { surah: num, ...(keep > 1 ? { ayah: keep } : {}), name: surahTitle(s, langRef.current) || prev?.name || '', time: Date.now() }
    writeBookmark(bm)
    if (render) setBookmark(bm)
  }, [])

  // Ünvanı yenilə (s, a): /quran/<s>-<slug>?a=N. Siyahıdan açılış — yeni
  // tarixçə girişi (Geri → siyahı); oxuyucunun içində (növbəti surə, ayəyə
  // keç) — replace. Yol dəyişəndə (başqa surə) Seo.jsx meta-nı yeniləyir.
  const setQuery = useCallback((s, a, { push = false } = {}) => {
    const pathname = pathFor('quran', tlangRef.current, s || undefined)
    const search = searchFor(s ? a : null)
    if (pathname === window.location.pathname && search === window.location.search) return
    routerNavigate({ pathname, search, hash: window.location.hash },
      push ? { state: { qpReader: true } } : { replace: true, state: window.history.state?.usr ?? null })
  }, [routerNavigate])

  // ── Oxuyucunun idarəsi: ayəyə keçid, oxuma yeri, səs ──
  const ready = !!(selected && surah && surah.number === selected)
  const verses = ready ? surah.verses : null
  const versesRef = useRef(verses)
  versesRef.current = verses
  const readerRef = useRef(null)
  const toolbarRef = useRef(null)
  const listRef = useRef(null)
  const jumpBtnRef = useRef(null)
  const jumpInputRef = useRef(null)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [flash, setFlash] = useState({ n: 0, k: 0 })
  const currentAyahRef = useRef(null)     // ekranın yuxarısındakı ilk ayə
  const progressRef = useRef(null)        // paneldəki irəliləyiş xətti
  // React state-siz: sürüşdükcə 286 kart yenidən çəkilməsin
  const paintProgress = useCallback((n) => {
    const el = progressRef.current
    const total = surahsRef.current.find(x => x.number === selectedRef.current)?.numberOfAyahs
      || document.querySelectorAll('.ayahs-list [data-ayah]').length
    if (el && total) el.style.transform = `scaleX(${Math.min(1, Math.max(0, n / total)).toFixed(4)})`
  }, [])
  const jumpingRef = useRef(false)        // proqram sürüşdürür — yer yazılmır
  const armedRef = useRef(false)          // yer yalnız istifadəçi özü sürüşdürəndən sonra yazılır
  const ignoreScrollUntilRef = useRef(0)
  const userInputAtRef = useRef(0)
  const pendingSaveRef = useRef(null)
  const saveTimerRef = useRef(null)
  const lastSaveRef = useRef(0)

  // Yazma throttle: ən çox saniyədə bir dəfə, sonuncu dəyər itmir
  const flushSave = useCallback(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
    const p = pendingSaveRef.current
    if (!p) return
    pendingSaveRef.current = null
    lastSaveRef.current = Date.now()
    saveBookmark(p.s, p.n, { render: false })
  }, [saveBookmark])
  const queueSave = useCallback((n) => {
    if (!selectedRef.current) return
    pendingSaveRef.current = { s: selectedRef.current, n }
    const wait = 1000 - (Date.now() - lastSaveRef.current)
    if (wait <= 0) flushSave()
    else if (!saveTimerRef.current) saveTimerRef.current = setTimeout(flushSave, wait)
  }, [flushSave])

  // Ayəyə keç: hamar sürüşmə (hərəkət azaldılıbsa və ya yüklənmədən sonra — dərhal),
  // scroll-margin-top yapışqan panelin altında saxlayır (CSS), kart qısa vurğulanır
  const flashTimerRef = useRef(null)
  const goToAyah = useCallback((n, { smooth = true } = {}) => {
    const el = document.getElementById(`ayah-${n}`)
    if (!el) return false
    const instant = !smooth || prefersReducedMotion()
    const startedAt = performance.now()
    jumpingRef.current = true
    // Yerini dəqiqləşdir: kartların mətni ekrana yaxınlaşanda ölçülür
    // (QuranPage.css → .ayah-body content-visibility), hədəfin yuxarısındakı
    // qonşu kartların hündürlüyü təxmindən realına keçəndə hədəf yerindən
    // sürüşə bilər. Üstəlik telefonda başlıq aşağı sürüşəndə gizlənir və panel
    // yuxarı qalxır — scroll-padding isə başlığın yerini saxlayırdı (kartla
    // panel arasında ~70px boşluq). Hər kadrda kart yapışqan panelin HAZIRKI
    // altından 8px aşağı gətirilir — iki kadr yerində qalana qədər (ən çox ~30);
    // istifadəçi özü sürüşdürsə — dayanır
    const settle = () => {
      let frames = 0, stable = 0, last = null
      const tick = () => {
        if (!el.isConnected || userInputAtRef.current > startedAt) return
        const top = el.getBoundingClientRect().top
        stable = last !== null && Math.abs(top - last) < 1 ? stable + 1 : 0
        last = top
        if (stable >= 2 || ++frames > 30) return
        const want = (toolbarRef.current?.getBoundingClientRect().bottom ?? 0) + 8
        if (Math.abs(top - want) >= 1) {
          ignoreScrollUntilRef.current = performance.now() + 150
          window.scrollBy(0, top - want)
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const end = () => {
      if (!jumpingRef.current) return
      jumpingRef.current = false
      ignoreScrollUntilRef.current = performance.now() + 150
      if (!instant) settle()
    }
    el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' })
    el.focus({ preventScroll: true })
    if (instant) settle()
    if (!instant && 'onscrollend' in window) window.addEventListener('scrollend', end, { once: true })
    setTimeout(end, instant ? 120 : 1500)
    // Şriftlər (Amiri) sonra yüklənib kartları uzadırsa — istifadəçi özü
    // sürüşdürməyibsə yerini düzəlt
    if (instant && document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(() => {
        if (userInputAtRef.current < startedAt && el.isConnected) el.scrollIntoView({ block: 'start' })
      }).catch(() => {})
    }
    currentAyahRef.current = n
    saveBookmark(selectedRef.current, n, { render: false })
    setQuery(selectedRef.current, n)
    setFlash(f => {
      const k = f.k + 1
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => setFlash(x => (x.k === k ? { n: 0, k } : x)), 2600)
      return { n, k }
    })
    return true
  }, [saveBookmark, setQuery])

  // Ayə nömrəsinə klik: ünvan ?a=N olur (link paylaşmaq üçün), yer yazılır
  const onAyahNumber = useCallback((n) => {
    haptic()
    currentAyahRef.current = n
    saveBookmark(selectedRef.current, n, { render: false })
    setQuery(selectedRef.current, n)
    setFlash(f => {
      const k = f.k + 1
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => setFlash(x => (x.k === k ? { n: 0, k } : x)), 2600)
      return { n, k }
    })
  }, [saveBookmark, setQuery])

  // Surə yükləndi və gözləyən ayə var (davam et, ?a=, axtarış nəticəsi) — ona keç
  useEffect(() => {
    if (!ready || !pendingAyah) return
    const n = Math.min(pendingAyah, surah.numberOfAyahs || surah.verses.length)
    jumpingRef.current = true
    requestAnimationFrame(() => {
      setPendingAyah(null)
      if (!goToAyah(n, { smooth: false })) jumpingRef.current = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pendingAyah])

  // Telefonda panel düymələri bir sətirdir və sığmayanda yana sürüşür — əvvəl
  // "Tərcümə" yarıda kəsilirdi, əvvəlki/növbəti oxları isə ümumiyyətlə
  // görünmürdü. Daha düymə olan tərəf yumşaq solur (data-more-start/-end,
  // CSS mask) — sürüşdürmək olduğunu göstərir. RTL-də scrollLeft mənfidir.
  const controlsRef = useRef(null)
  useLayoutEffect(() => {
    const el = controlsRef.current
    if (!el) return undefined
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      const pos = Math.abs(el.scrollLeft)
      el.toggleAttribute('data-more-start', max > 1 && pos > 1)
      el.toggleAttribute('data-more-end', max > 1 && pos < max - 1)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    // Konteynerin özü + düymələr (məs. "Tərcümə"-nin ✓ işarəsi eni dəyişir)
    if (ro) [el, ...el.children].forEach(c => ro.observe(c))
    return () => { el.removeEventListener('scroll', update); ro?.disconnect() }
  }, [selected, lang])

  // Yapışqan panelin hündürlüyü → --qp-toolbar-h (ayənin scroll-margin-top-u)
  useLayoutEffect(() => {
    const tb = toolbarRef.current
    const root = readerRef.current
    if (!tb || !root) return undefined
    const set = () => root.style.setProperty('--qp-toolbar-h', `${Math.round(tb.offsetHeight)}px`)
    set()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(set)
    ro.observe(tb)
    return () => ro.disconnect()
  }, [selected])

  // Oxuma yeri: ekranın yuxarı zolağındakı (paneldən aşağı) ilk görünən ayə
  useEffect(() => {
    if (!ready || !listRef.current || typeof IntersectionObserver === 'undefined') return undefined
    armedRef.current = false
    const vh = window.innerHeight
    const top = Math.max(0, Math.round(toolbarRef.current?.getBoundingClientRect().bottom ?? 0))
    const band = Math.max(80, Math.round((vh - top) * 0.35))
    const bottom = Math.max(0, vh - top - band)
    const visible = new Set()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const n = Number(e.target.dataset.ayah)
        if (e.isIntersecting) visible.add(n); else visible.delete(n)
      }
      if (!visible.size) return
      // Zolaqdakı ilk ayə — amma panelin altından yalnız quyruğu (< 48px)
      // görünürsə, növbətisi "cari" sayılır. Panelin yeri canlı oxunur:
      // başlıq gizlənəndə panel yuxarı qalxır
      const barBottom = toolbarRef.current?.getBoundingClientRect().bottom ?? top
      const sorted = [...visible].sort((a, b) => a - b)
      const cur = sorted.find(n => {
        const r = document.getElementById(`ayah-${n}`)?.getBoundingClientRect()
        return r && r.bottom > barBottom + 48
      }) ?? sorted[sorted.length - 1]
      currentAyahRef.current = cur
      paintProgress(cur)
      if (armedRef.current && !jumpingRef.current) queueSave(cur)
    }, { rootMargin: `-${top}px 0px -${bottom}px 0px` })
    listRef.current.querySelectorAll('[data-ayah]').forEach(el => io.observe(el))
    const onScroll = () => {
      if (jumpingRef.current || performance.now() < ignoreScrollUntilRef.current) return
      armedRef.current = true
      if (currentAyahRef.current) queueSave(currentAyahRef.current)
    }
    // İstifadəçinin real girişi (təkər, toxunuş, klaviatura) — yazma dərhal
    // "silahlanır", proqram sürüşməsinin gözləmə pəncərəsi ləğv olunur
    const onInput = () => {
      userInputAtRef.current = performance.now()
      ignoreScrollUntilRef.current = 0
      if (!jumpingRef.current) armedRef.current = true
    }
    // Klaviaturada yalnız sürüşdürən düymələr (Tab, hərflər sayılmır)
    const onKeyScroll = (e) => {
      if (!isTyping(e.target) && /^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key)) onInput()
    }
    const onHide =() => { if (document.visibilityState !== 'visible') flushSave() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onInput, { passive: true })
    window.addEventListener('touchmove', onInput, { passive: true })
    window.addEventListener('keydown', onKeyScroll)
    window.addEventListener('pagehide', flushSave)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onInput)
      window.removeEventListener('touchmove', onInput)
      window.removeEventListener('keydown', onKeyScroll)
      window.removeEventListener('pagehide', flushSave)
      document.removeEventListener('visibilitychange', onHide)
      flushSave()
    }
  }, [ready, surah, queueSave, flushSave, paintProgress])

  // ── Səs: useQuranPlayer (qari, ardıcıl dinləmə, təkrar, sürət, Media Session) ──
  // Cari ayə ekrandan kənardadırsa ona sürüşdür (dinləyən də "oxuyur" — yer yazılır).
  // Bu proqram sürüşməsidir: istifadəçinin sürüşməsi kimi sayılmır
  const followAyah = useCallback((n, { force = false } = {}) => {
    const el = document.getElementById(`ayah-${n}`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const top = toolbarRef.current?.getBoundingClientRect().bottom ?? 0
    const bottom = window.innerHeight - 120    // aşağıdakı mini-pleyer
    if (force || r.top < top || r.bottom > bottom) {
      ignoreScrollUntilRef.current = performance.now() + 900
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
    currentAyahRef.current = n
    queueSave(n)
  }, [queueSave])
  const surahEndRef = useRef(null)
  const onSurahEnd = useCallback(() => surahEndRef.current?.(), [])
  const mediaTitle = useCallback((n) => {
    const s = surahsRef.current.find(x => x.number === selectedRef.current)
    return placeLabel(surahTitle(s, langRef.current) || String(selectedRef.current), n, langRef.current)
  }, [])
  const player = useQuranPlayer({ surahNumber: selected, verses, lang, onFollow: followAyah, onSurahEnd, mediaTitle })
  const playerBusy = player.status === 'playing' || player.status === 'loading'
  // player obyekti hər render yenidir; toggle isə sabitdir — yalnız ondan asılıdır
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleAyah = useCallback((n) => { haptic(); player.toggle(n) }, [player.toggle])
  const saveAyah = useCallback((n) => toggleSaved(selectedRef.current, n), [toggleSaved])
  // Sözbəsöz tilavət (karaoke) — açılanda surənin pleyeri dayanır
  const [karaoke, setKaraoke] = useState(null)
  const openKaraoke = useCallback((n) => { player.pause(); setKaraoke({ s: selectedRef.current, a: n, tr: versesRef.current?.find(v => v.n === n)?.tr || '' }) }, [player.pause]) // eslint-disable-line react-hooks/exhaustive-deps -- player.pause sabitdir (useQuranPlayer api)
  const closeKaraoke = useCallback(() => setKaraoke(null), [])
  const [zen, setZen] = useState(false)
  const shareAyah = useCallback(async (verse) => {
    haptic()
    const sNum = selectedRef.current
    const s = surahsRef.current.find(x => x.number === sNum)
    const ref = `${placeLabel(surahTitle(s, langRef.current) || String(sNum), verse.n, langRef.current)} (${sNum}:${verse.n})`
    const url = `${window.location.origin}${pathFor('quran', tlangRef.current, sNum)}?a=${verse.n}`
    const text = [verse.ar, verse.tr, `— ${ref}`].filter(Boolean).join('\n\n')
    try {
      if (navigator.share) { await navigator.share({ title: ref, text, url }); return }
    } catch (e) { if (e?.name === 'AbortError') return }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      clearTimeout(sharedTimerRef.current)
      setSharedN(verse.n)
      sharedTimerRef.current = setTimeout(() => setSharedN(0), 2000)
    } catch { /* pano bağlıdır */ }
  }, [])
  useEffect(() => () => clearTimeout(sharedTimerRef.current), [])

  // ── "Ayəyə keç" paneli: G qısayolu, bağlanış ──
  useEffect(() => { setJumpOpen(false) }, [selected])
  useEffect(() => {
    if (!selected) return undefined
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || isTyping(e.target)) return
      if (e.code === 'KeyG' || (e.key || '').toLowerCase() === 'g') {
        e.preventDefault()
        setJumpOpen(true)
        jumpInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])
  const closeJump = useCallback((returnFocus) => {
    setJumpOpen(false)
    if (returnFocus) jumpBtnRef.current?.focus()
  }, [])
  const onJump = useCallback((n) => {
    setJumpOpen(false)
    goToAyah(n)
  }, [goToAyah])

  useEffect(() => {
    if (searchMode !== 'verse') return
    setVerseError(false)
    if (verseSearch.length < 3) { setVerseResults([]); setVerseSearching(false); return }
    setVerseSearching(true)
    if (verseTimerRef.current) clearTimeout(verseTimerRef.current)
    // Köhnə sorğunun gec gələn cavabı yeni axtarışın nəticəsini əzməsin
    const ctrl = new AbortController()
    verseTimerRef.current = setTimeout(() => {
      // Axtarış seçilmiş dilin nəşrində aparılır (başqa dilə düşmür)
      const edition = EDITION_MAP[tlang]
      fetchJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(verseSearch)}/all/${edition}`, ctrl.signal)
        .then(d => {
          if (ctrl.signal.aborted) return
          // API tapılmayanda 404 JSON qaytarır — bu "nəticə yoxdur"dur, xəta deyil
          setVerseResults(d?.code === 200 && Array.isArray(d.data?.matches) ? d.data.matches : [])
        })
        .catch(() => { if (!ctrl.signal.aborted) { setVerseResults([]); setVerseError(true) } })
        .finally(() => { if (!ctrl.signal.aborted) setVerseSearching(false) })
    }, 500)
    return () => { ctrl.abort(); if (verseTimerRef.current) clearTimeout(verseTimerRef.current) }
  }, [verseSearch, searchMode, lang, tlang, verseAttempt])

  const surahByNum = n => surahs.find(s => s.number === n)

  const openSurah = (num, ayah) => {
    if (!num) return
    // Siyahıdan açılırsa yeri yadda saxla (əvvəlki/növbəti surədə yox)
    const fromList = !selected
    if (fromList) listScrollRef.current = window.scrollY
    setSelected(num)
    setPendingAyah(ayah > 1 ? ayah : null)
    saveBookmark(num, ayah > 1 ? ayah : undefined)
    trackRead(num)
    setQuery(num, ayah > 1 ? ayah : null, { push: fromList })
    // Surə əvvəldən açılır (ayə verilibsə — yüklənəndən sonra ona keçilir).
    // Bu sürüşmə "oxuma" sayılmır — yer yazılmasın
    ignoreScrollUntilRef.current = performance.now() + 500
    window.scrollTo(0, 0)
  }
  // Surə linki (<a href>): adi klik SPA ilə açır, Ctrl/orta klik — yeni tabda
  const linkTo = (num) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    openSurah(num)
  }
  // Surə bitdi və "növbəti surəyə keç" seçilib — pleyer 1-ci ayədən davam edir
  surahEndRef.current = () => { if (selectedRef.current < 114) openSurah(selectedRef.current + 1) }

  const closeReader = () => {
    // Siyahıdan açılmışdısa — tarixçədə geri (Geri düyməsi ilə eyni nəticə)
    if (location.state?.qpReader) { routerNavigate(-1); return }
    setSelected(null)
    setQuery(null, null)
  }

  // Ünvan dəyişdi (Geri/İrəli, dil dəyişimi, ilk açılış)
  const prevLangRef = useRef(lang)
  useEffect(() => {
    const { s, a } = readLoc(location.pathname, location.search)
    const langChanged = prevLangRef.current !== lang
    prevLangRef.current = lang
    // Dil dəyişimi (LangContext) surəni yolda saxlayır, amma query-ni (?a=)
    // atır — surə yeni dildə təzədən yüklənir, oxunan ayəyə qayıdırıq
    if (langChanged && s && s === selectedRef.current && !a) {
      const cur = currentAyahRef.current
      if (cur > 1) { setPendingAyah(cur); setQuery(s, cur) }
      return
    }
    if (s !== selectedRef.current) {
      setSelected(s)
      if (s) { setPendingAyah(a); window.scrollTo(0, 0) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, lang])

  // Birbaşa linklə açılış (/quran/2-al-baqara?a=90) — oxuma kimi sayılsın, yer yazılsın
  const deepLinkRef = useRef(false)
  useEffect(() => {
    if (deepLinkRef.current || !selected) return
    deepLinkRef.current = true
    trackRead(selected)
    saveBookmark(selected, pendingAyah || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Oxuyucu bağlandı → siyahının əvvəlki yerinə qayıt; bəlləkdəki yeri yenilə
  const wasOpenRef = useRef(!!selected)
  useEffect(() => {
    if (selected) { wasOpenRef.current = true; return }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    setBookmark(readBookmark())
    const y = listScrollRef.current
    requestAnimationFrame(() => window.scrollTo(0, y))
  }, [selected])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = surahs.filter(s => {
      // Bütün yazılışlarda axtar (az/ru/tr adları, ingiliscə, ərəbcə, nömrə)
      const locals = ['az', 'ru', 'tr'].map(l => getSurahLocal(s.number, l)).filter(Boolean)
      const matchQ = !q || s.englishName.toLowerCase().includes(q) ||
        s.name.includes(search) || String(s.number).includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        locals.some(x => x.name.toLowerCase().includes(q) || x.meaning.toLowerCase().includes(q))
      const matchF = filter === 'all' ||
        (filter === 'meccan' && s.revelationType === 'Meccan') ||
        (filter === 'medinan' && s.revelationType === 'Medinan')
      const matchJ = !juz || JUZ_VERSES[juz - 1].some(p => p[0] === s.number)
      return matchQ && matchF && matchJ
    })
    if (sort === 'short') return [...list].sort((a, b) => a.numberOfAyahs - b.numberOfAyahs || a.number - b.number)
    if (sort === 'long') return [...list].sort((a, b) => b.numberOfAyahs - a.numberOfAyahs || a.number - b.number)
    return list
  }, [surahs, search, filter, juz, sort])

  // Hero-dakı "Quran haqqında" — bələdçiyə hamar keçid (ünvan dəyişmir)
  const jumpToAbout = (e) => {
    if (!isPlainClick(e)) return
    const el = document.getElementById('qp-about')
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    el.focus({ preventScroll: true })
  }

  // ── Oxuyucu ──
  // Surə yüklənərkən də açılır (spinner ilə) — əvvəl yüklənənə qədər
  // siyahı ekranda qalırdı və toxunuşun heç nə etmədiyi görünürdü.
  if (selected) {
    const prevS = surahByNum(selected - 1)
    const nextS = surahByNum(selected + 1)
    const prevLabel = stripArrows(t.prevSurah)
    const nextLabel = stripArrows(t.nextSurah)
    const bmLabel = pickUi(BOOKMARK_LABELS, lang, 'en')
    const rawMeaning = !ready ? '' : (extra ? '' : surahMeaning(surah, lang))
    // Məna adla eynidirsə (məs. "Yasin") təkrarlamırıq
    const meaning = ready && rawMeaning !== surahTitle(surah, lang) ? rawMeaning : ''
    // Mədinə mushafında səhifələr və cüzlər (yerli cədvəllər — şəbəkəsiz)
    const row = SURAH_TABLE[selected - 1]
    const surahPages = row ? (row[0] === row[1] ? String(row[0]) : `${row[0]}–${row[1]}`) : ''
    const jz = juzOfSurah(selected)
    const surahJuz = jz.length ? (jz.length === 1 ? String(jz[0]) : `${jz[0]}–${jz[jz.length - 1]}`) : ''
    return (
      <div className="quran-reader" ref={readerRef}>
        <div className="reader-toolbar" ref={toolbarRef}>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm reader-back" onClick={closeReader}>
            <DirArrow back /> {stripArrows(t.backBtn)}
          </button>
          <div className="reader-controls" ref={controlsRef}>
            {/* Ayəyə keç (qısayol: G) — surə yüklənənə qədər söndürülür */}
            <button type="button" ref={jumpBtnRef} className={`ctrl-btn ctrl-jump ${jumpOpen ? 'active' : ''}`}
              disabled={!ready} aria-expanded={jumpOpen} aria-controls="qp-jump" aria-keyshortcuts="G"
              title={`${jl.jump} (G)`} onClick={() => { haptic(); setJumpOpen(o => !o) }}>
              <Icon name="target" size={16} /><span className="ctrl-jump__label">{jl.jump}</span>
            </button>
            {/* v5.7: Zen — tam ekran dinləmə (components/quran/QuranZen) */}
            <button type="button" className="ctrl-btn ctrl-zen" disabled={!ready} title={xl.zenHint} aria-label={xl.zenHint}
              onClick={() => { haptic(); setZen(true) }} data-testid="zen-open">
              <Icon name="moonStar" size={16} /><span className="ctrl-memo__label">{xl.zen}</span>
            </button>
            {/* Əzbər rejimi: ərəb mətni bulanır, hər ayə "Göstər" ilə açılır */}
            <button type="button" className={`ctrl-btn ctrl-memo ${memorize ? 'active' : ''}`} aria-pressed={memorize}
              disabled={!ready} title={xl.memorizeHint} aria-label={xl.memorize}
              onClick={() => {
                haptic()
                listRef.current?.querySelectorAll('[data-revealed]').forEach(el => el.removeAttribute('data-revealed'))
                listRef.current?.querySelectorAll('.ayah-reveal').forEach(b => { b.setAttribute('aria-pressed', 'false'); const l = b.querySelector('.ayah-reveal__label'); if (l) l.textContent = xl.reveal })
                setMemorize(m => !m)
              }}>
              <Icon name="eye" size={16} /><span className="ctrl-memo__label">{xl.memorize}</span>
            </button>
            {/* dir="ltr": ərəbcədə "A−" bidi qaydası ilə "−A" kimi görünürdü.
                Həddə çatanda düymə söndürülür (əvvəl basılırdı, heç nə olmurdu) */}
            {/* Əlçatan ad görünən yazını da daşıyır (WCAG 2.5.3 "Label in Name" —
                səsli idarədə "A− düyməsi" deyə bilmək üçün) */}
            <button type="button" className="ctrl-btn" dir="ltr" aria-label={`A− · ${fl.smaller}`} title={fl.smaller}
              disabled={fontSize <= FONT_MIN + 0.01} onClick={() => setFontSize(f => stepFont(f, -1))}>A−</button>
            <button type="button" className="ctrl-btn" dir="ltr" aria-label={`A+ · ${fl.larger}`} title={fl.larger}
              disabled={fontSize >= FONT_MAX - 0.01} onClick={() => setFontSize(f => stepFont(f, 1))}>A+</button>
            {hasTafsir ? (
              <button type="button" className={`ctrl-btn ${showTafsir ? 'active' : ''}`} aria-pressed={showTafsir}
                onClick={() => { haptic(); setShowTafsir(s => !s) }}>
                {showTafsir && <Icon name="check" size={16} className="ctrl-check" />}{tafsirLabel}
              </button>
            ) : (
              <button type="button" className={`ctrl-btn ${showTrans ? 'active' : ''}`} aria-pressed={showTrans}
                onClick={() => { haptic(); setShowTrans(s => !s) }}>
                {showTrans && <Icon name="check" size={16} className="ctrl-check" />}{t.translationLabel}
              </button>
            )}
            <button type="button" className="ctrl-btn ctrl-nav" disabled={selected <= 1}
              aria-label={prevLabel} title={prevLabel} onClick={() => openSurah(selected - 1)}>
              <DirArrow back /><span className="ctrl-label">{prevLabel}</span>
            </button>
            <button type="button" className="ctrl-btn ctrl-nav" disabled={selected >= 114}
              aria-label={nextLabel} title={nextLabel} onClick={() => openSurah(selected + 1)}>
              <span className="ctrl-label">{nextLabel}</span><DirArrow />
            </button>
            {/* Əlfəcin — "hifz" ikonundakı lent (Icon.jsx-də ayrıca əlfəcin ikonu yoxdur) */}
            <button type="button" className={`ctrl-btn ctrl-bookmark ${bookmark && bookmark.surah === selected ? 'active' : ''}`}
              onClick={() => { haptic(); saveBookmark(selected, currentAyahRef.current || undefined) }} title={bmLabel} aria-label={bmLabel}
              aria-pressed={!!bookmark && bookmark.surah === selected}>
              <Icon name="hifz" size={18} />
            </button>
          </div>
          {/* Surədə irəliləyiş — panelin alt kənarında nazik xətt (JS birbaşa transform yazır) */}
          <span className="reader-progress" aria-hidden="true"><span ref={progressRef} /></span>
          {jumpOpen && ready && (
            <AyahJump total={surah.verses.length} current={currentAyahRef.current} labels={jl} lang={lang}
              onJump={onJump} onClose={closeJump} inputRef={jumpInputRef} triggerRef={jumpBtnRef} />
          )}
        </div>
        {surahError && (
          <QEmpty icon="alert" bad action={
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(a => a + 1)}>
              <Icon name="refresh" className="ui-btn__icon" />{rl.retry}
            </button>
          }>{rl.msg}</QEmpty>
        )}
        {!ready && !surahError && (
          <>
            <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>
            <ReaderSkeleton label={t.loading} />
          </>
        )}
        {ready && (
          <>
            <header className="reader-header" data-reveal="scale">
              <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
              <div className="reader-header__top">
                <span className="reader-number ui-num">{surah.number}</span>
                <div className="reader-info">
                  <h1 className="reader-arabic" lang="ar">{surah.name}</h1>
                  {lang !== 'ar' && (
                    <h2 className="reader-english">
                      {surahTitle(surah, lang)}
                      {meaning && <span className="reader-meaning"> · {meaning}</span>}
                    </h2>
                  )}
                </div>
              </div>
              {/* Surənin açar göstəriciləri (mono rəqəm + kiçik etiket) */}
              <dl className="reader-facts">
                <div><dt>{pk(QURAN_GUIDE.facts.items[1].label, lang)}</dt><dd className="ui-num">{surah.numberOfAyahs}</dd></div>
                <div><dt>{sl.place}</dt><dd>{revelationLabel(surah.revelationType, lang)}</dd></div>
                {surahPages && <div><dt>{pk(QURAN_GUIDE.ui.pages, lang)}</dt><dd className="ui-num" dir="ltr">{surahPages}</dd></div>}
                {surahJuz && <div><dt>{pk(QURAN_GUIDE.ui.juzLabel, lang)}</dt><dd className="ui-num" dir="ltr">{surahJuz}</dd></div>}
              </dl>
            </header>
            <SurahRootCloud key={surah.number} surah={surah.number} lang={lang} />
            {/* v5.6: surənin ritmi — hər ayə bir sütun (söz sayı); toxunuş → ayəyə keçid */}
            <Suspense fallback={null}>
              <SurahRhythm key={`rh${surah.number}`} verses={surah.verses} madani={surah.revelationType === 'Medinan'} lang={lang} onPick={(n) => goToAyah(n)} />
            </Suspense>
            {/* Tərcümə seçicisi: standart nəşr + QuranEnc.com tərcümələri (mətn dəyişmir; mənbə, versiya, tarix) */}
            {extra && (
              <p className="qp-trans-src qp-trans-src__meta">
                {ql.label}: <span lang={tlang} dir={dirOf(tlang)}>{EXTRA_LANGS[tlang].by}</span>
                {' · '}<span lang={tlang}>{EXTRA_LANGS[tlang].name}</span>
              </p>
            )}
            {qeOptions.length > 0 && (
              <div className="qp-trans-src" data-reveal="fade">
                <label className="qp-trans-src__field">
                  <span className="qp-trans-src__label">{ql.label}</span>
                  <select className="ui-select ui-select--sm qp-trans-src__select" value={transKey}
                    onChange={e => { haptic(); setTransChoices(saveTranslationChoice(lang, e.target.value)) }}>
                    <option value="">{pickUi(DEFAULT_TRANSLATOR, lang, 'en')} ({ql.def})</option>
                    <optgroup label={ql.group}>
                      {qeOptions.map(o => <option key={o.key} value={o.key}>{o.name}</option>)}
                    </optgroup>
                  </select>
                </label>
                <p className="qp-trans-src__meta" aria-live="polite">
                  {qeShown ? (
                    <>
                      {ql.source}: <a href={quranEncUrl(transKey, selected, lang)} target="_blank" rel="noopener noreferrer">QuranEnc.com</a>
                      {' · '}<span dir="ltr">{qe.meta?.title}</span>
                      {qe.meta?.version && <>{' · '}{ql.version} <span className="ui-num" dir="ltr">{qe.meta.version}</span></>}
                      {qe.meta?.updated > 0 && <>{' · '}{ql.updated} <time dateTime={new Date(qe.meta.updated * 1000).toISOString().slice(0, 10)}>{qeDate(qe.meta.updated, lang)}</time></>}
                    </>
                  ) : transKey && qe.loading ? (
                    <span className="qp-trans-src__loading">{ql.loading}</span>
                  ) : transKey && qe.error ? (
                    <span className="qp-trans-src__error" role="status"><Icon name="alert" size={14} />{ql.failed}</span>
                  ) : null}
                </p>
              </div>
            )}
            {/* Fatihədə Bəsmələ 1-ci ayənin özüdür, Tövbədə isə oxunmur */}
            {hasSeparateBasmala(surah.number) && (
              <div className="reader-basmalah" data-reveal="fade">
                <span className="basmalah-ar" lang="ar">{BASMALA_DISPLAY}</span>
                {/* Əlavə dildə — həmin nəşrin öz tərcüməsi (Fatihə 1:1, src/seo/langs.js) */}
                {lang !== 'ar' && (extra
                  ? <span className="basmalah-tr" lang={tlang} dir={dirOf(tlang)}>{EXTRA_LANGS[tlang].basmala}</span>
                  : <span className="basmalah-tr">{t.basmalah}</span>)}
              </div>
            )}
            {memorize && <p className="qp-memo-hint" role="status"><Icon name="eye" size={16} />{xl.memorizeHint}</p>}
            <div className={`ayahs-list${memorize ? ' is-memorize' : ''}`} ref={listRef} style={{ '--qp-scale': fontSize }}>
              {shownVerses?.map(v => (
                <AyahCard key={v.n} verse={v} surahNum={surah.number} lang={lang} trLang={qeShown && !forcedQe ? lang : (qe.error && forcedQe ? 'en' : tlang)} tafsirLabel={tafsirLabel} playLabels={playLabels}
                  showTrans={!hasTafsir && showTrans} showTafsir={hasTafsir && showTafsir}
                  active={player.current === v.n} playing={playerBusy && player.current === v.n}
                  flash={flash.n === v.n ? flash.k : 0}
                  numLabel={capFirst(ayahLabel(v.n, lang))} linkLabel={jl.link}
                  onToggle={toggleAyah} onNumber={onAyahNumber}
                  tafsirOpen={tafsirOpen.has(v.n)} tafsirId={tafsirOpen.has(v.n) ? tafsirId : 0}
                  onTafsirToggle={toggleTafsir} onTafsirChange={changeTafsir}
                  saved={savedKeys.has(`${surah.number}:${v.n}`)} shared={sharedN === v.n}
                  onSave={saveAyah} onShare={shareAyah} onKaraoke={openKaraoke} xl={xlCard} />
              ))}
            </div>
            {surah.verses?.some(v => v.sj) && (
              <Suspense fallback={null}>
                <SajdahMoment listRef={listRef} activeAyah={playerBusy ? player.current : null} surah={surah.number} lang={lang} />
              </Suspense>
            )}
            {zen && (
              <Suspense fallback={null}>
                <QuranZen player={player} verses={surah.verses} lang={lang} start={currentAyahRef.current || 1} surah={selected}
                  title={surahTitle(surah, lang) || String(selected)} onClose={() => setZen(false)} />
              </Suspense>
            )}
            {karaoke && (
              <Suspense fallback={null}>
                <KaraokeAyah surah={karaoke.s} ayah={karaoke.a} lang={lang} translation={karaoke.tr} onClose={closeKaraoke} />
              </Suspense>
            )}
            {/* Surənin sonunda: əvvəlki / növbəti surə (telefonda paneldə yalnız ox görünür) */}
            <div className="reader-pager" data-reveal="">
              {selected > 1 && (
                <a className="reader-pager-btn prev" href={pathFor('quran', tlang, selected - 1)} onClick={linkTo(selected - 1)}>
                  <span className="reader-pager-dir"><DirArrow back /> {prevLabel}</span>
                  <span className="reader-pager-name">{surahTitle(prevS, lang) || selected - 1}</span>
                </a>
              )}
              {selected < 114 && (
                <a className="reader-pager-btn next" href={pathFor('quran', tlang, selected + 1)} onClick={linkTo(selected + 1)}>
                  <span className="reader-pager-dir">{nextLabel} <DirArrow /></span>
                  <span className="reader-pager-name">{surahTitle(nextS, lang) || selected + 1}</span>
                </a>
              )}
            </div>
            {/* Yapışqan mini-pleyer — oxuyucunun altında, ekranın aşağısında qalır */}
            <QuranPlayer player={player} lang={lang} total={surah.verses.length}
              verseLabel={n => capFirst(ayahLabel(n, lang))} />
          </>
        )}
      </div>
    )
  }

  // "Bəqərə, 50-ci ayə" — ayə yoxdursa (köhnə əlfəcin, surənin əvvəli) yalnız ad
  const bmSurah = bookmark ? surahByNum(bookmark.surah) : null
  const bmTitle = bookmark ? (surahTitle(bmSurah, lang) || bookmark.name || String(bookmark.surah)) : ''
  const bookmarkName = bookmark?.ayah ? placeLabel(bmTitle, bookmark.ayah, lang) : bmTitle
  // Surədə irəliləyiş (düymənin altındakı nazik xətt)
  const bmProgress = bookmark?.ayah && bmSurah?.numberOfAyahs ? Math.min(1, bookmark.ayah / bmSurah.numberOfAyahs) : 0
  const mostReadName = (() => {
    const n = +getMostRead(stats.reads)
    if (!n) return '-'
    return surahTitle(surahByNum(n), lang) || staticSurahName(n, lang)
  })()
  const readCount = Object.keys(stats.reads).length
  const streakDays = calcStreak(stats.dates)
  const ui = QURAN_GUIDE.ui
  // Seçilmiş cüzün surə hissələri (qrafik): ən uzun 10 hissə, surə sırası ilə
  const juzParts = juz ? JUZ_VERSES[juz - 1] : null
  const juzBars = juzParts
    ? [...juzParts].sort((a, b) => (b[2] - b[1]) - (a[2] - a[1])).slice(0, 10).sort((a, b) => a[0] - b[0])
      .map(([s, f, l]) => ({
        key: s,
        label: `${s}. ${surahTitle(surahByNum(s), lang) || staticSurahName(s, lang)}`,
        value: l - f + 1,
        note: (f > 1 || l < (SURAH_TABLE[s - 1]?.[2] || l)) ? `${f}–${l}` : undefined,
      }))
    : null

  return (
    <>
      {/* Kompakt hero (dizayn v3): eyebrow · h1 · bir cümlə · necə işlədilir · 4 açar rəqəm.
          Sağda (≥900px) — oxuma statistikası (varsa) və ya xəttatlıq lövhəsi */}
      <header className="ui-page-hero ui-page-hero--split qp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{navGroupLabel('quran', lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{pk(QURAN_GUIDE.ui.lead, lang)}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} />{pk(ui.how, lang)}</p>
            <ul className="ui-page-hero__stats">
              {QURAN_GUIDE.facts.items.slice(0, 4).map(f => (
                <li key={f.value} title={f.hint ? pk(f.hint, lang) : undefined}><b data-count={/^\d+$/.test(f.value) ? f.value : undefined}>{f.value}</b><span>{pk(f.label, lang)}</span></li>
              ))}
            </ul>
            <div className="ui-page-hero__actions">
              {bookmark && (
                // Klikdə surə açılır və yüklənəndən sonra dəqiq həmin ayəyə keçilir
                <button type="button" className="ui-btn ui-btn--primary qp-continue" onClick={() => openSurah(bookmark.surah, bookmark.ayah)}>
                  <Icon name="hifz" className="ui-btn__icon" />
                  <span className="qp-continue__label">{pickUi(BOOKMARK_LABELS, lang, 'en')}</span>
                  {bookmarkName && <span className="qp-continue__name">{bookmarkName}</span>}
                  <DirArrow />
                  {bmProgress > 0 && <span className="qp-continue__bar" style={{ '--p': bmProgress.toFixed(3) }} aria-hidden="true" />}
                </button>
              )}
              <a className={`ui-btn ui-btn--sm ${bookmark ? 'ui-btn--ghost' : 'ui-btn--secondary'} qp-about-link`} href="#qp-about" onClick={jumpToAbout}>
                <Icon name="learn" className="ui-btn__icon" />{pk(QURAN_GUIDE.nav, lang)}
              </a>
            </div>
          </div>
          <div className="ui-page-hero__aside qp-hero__aside">
            {stats.sessions > 0 ? (
              <section className="qp-mystats" aria-label={pk(ui.yourReading, lang)}>
                <ProgressRing value={readCount} max={114} size={84} thickness={8}
                  label={pk(ui.yourReading, lang)} sub={`${readCount} / 114 ${pk(ui.surahsWord, lang)}`} />
                <dl className="ui-kv qp-mystats__kv">
                  <div><dt>{st.reads}</dt><dd className="ui-num" data-count={stats.sessions}>{stats.sessions}</dd></div>
                  <div><dt>{st.streak}</dt><dd className="ui-num" data-count={streakDays}>{streakDays}</dd></div>
                  <div><dt>{st.most}</dt><dd className="qp-mystats__name">{mostReadName}</dd></div>
                </dl>
                <p className="qp-mystats__note">{pk(ui.readingNote, lang)}</p>
              </section>
            ) : lang !== 'ar' ? (
              <div className="qp-plaque" aria-hidden="true">
                {/* v4: arxada yavaş fırlanan səkkizguşəli ulduz + ərəb yazısı "mürəkkəblə" çəkilir */}
                <svg className="qp-plaque__star" viewBox="0 0 100 100" aria-hidden="true">
                  <rect x="18" y="18" width="64" height="64" rx="2" />
                  <rect x="18" y="18" width="64" height="64" rx="2" transform="rotate(45 50 50)" />
                  <circle cx="50" cy="50" r="22" />
                </svg>
                <span className="qp-plaque__ar" lang="ar" data-anim="ink">القرآن الكريم</span>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight qp-list" aria-label={t.title}>
        <div className="ui-container">
          {/* Axtarış paneli: seqment (surə / ayə) + sahə */}
          <div className="qp-toolbar">
            <SegGroup id="qp-mode">
            <div className="ui-segmented qp-mode seg-pill-host" role="group" aria-label={sl.mode} data-wow-off="">
              <button type="button" aria-pressed={searchMode === 'surah'} onClick={() => setSearchMode('surah')}>
                <SegPill on={searchMode === 'surah'} />{sl.surahSearch}
              </button>
              <button type="button" aria-pressed={searchMode === 'verse'} onClick={() => setSearchMode('verse')}>
                <SegPill on={searchMode === 'verse'} />{sl.verseSearch}
              </button>
            </div>
            </SegGroup>
            <div className="quran-search-bar">
              <Icon name="search" size={18} className="qp-search-icon" />
              {searchMode === 'surah' ? (
                <input type="search" className="ui-input qp-search-input" placeholder={t.searchPh} aria-label={t.searchPh}
                  value={search} onChange={e => setSearch(e.target.value)} />
              ) : (
                <input type="search" className="ui-input qp-search-input" placeholder={sl.verseSearch} aria-label={sl.verseSearch}
                  value={verseSearch} onChange={e => setVerseSearch(e.target.value)} />
              )}
            </div>
          </div>
          {searchMode === 'surah' && (
            <SegGroup id="qp-views">
            <div className="ui-segmented qp-views seg-pill-host" role="group" aria-label={xl.views} data-wow-off="">
              {[
                { key: 'surahs', label: xl.surahs, icon: 'quran' },
                { key: 'juz', label: xl.juz, icon: 'mushaf' },
                { key: 'saved', label: xl.saved, icon: 'hifz', count: savedList.length },
              ].map(v => (
                <button type="button" key={v.key} aria-pressed={view === v.key} onClick={() => setView(v.key)}>
                  <SegPill on={view === v.key} />
                  <Icon name={v.icon} size={16} />{v.label}
                  {v.count ? <span className="qp-views__n ui-num">{v.count}</span> : null}
                </button>
              ))}
            </div>
            </SegGroup>
          )}
          {searchMode === 'surah' && view === 'juz' && (
            <ul className="qp-juz-grid" role="list">
              {JUZ_VERSES.map((parts, i) => {
                const n = i + 1
                const [fs, fa] = parts[0]
                const last = parts[parts.length - 1]
                const ayahs = parts.reduce((sum, p) => sum + p[2] - p[1] + 1, 0)
                const nameOf = num => surahTitle(surahByNum(num), lang) || staticSurahName(num, lang)
                const title = ui.juzN[lang] ? ui.juzN[lang](n) : ui.juzN.az(n)
                return (
                  <li key={n}>
                    <a className="qp-juz-card" href={`${pathFor('quran', tlang, fs)}${fa > 1 ? `?a=${fa}` : ''}`}
                      onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); openSurah(fs, fa) }}>
                      <span className="surah-num qp-juz-ring" style={{ '--jp': (n / 30).toFixed(4), '--jd': `${Math.min(i, 9) * 50}ms` }}>{n}</span>
                      <span className="qp-juz-card__body">
                        <span className="qp-juz-card__title">{title}</span>
                        <span className="qp-juz-card__range">
                          <span>{xl.juzFrom}: <b>{nameOf(fs)}</b> <span className="ui-num" dir="ltr">{fs}:{fa}</span></span>
                          <span>{xl.juzTo}: <b>{nameOf(last[0])}</b> <span className="ui-num" dir="ltr">{last[0]}:{last[2]}</span></span>
                        </span>
                        <span className="qp-juz-card__meta">
                          <span className="ui-badge">{xl.surahsN(parts.length)}</span>
                          <span className="ui-badge">{ayahCountText(ayahs, lang)}</span>
                          {JUZ_START_PAGES[i] ? <span className="ui-badge">{xl.pageN(JUZ_START_PAGES[i])}</span> : null}
                        </span>
                      </span>
                      <DirArrow />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
          {searchMode === 'surah' && view === 'saved' && (
            savedList.length ? (
              <>
                <p className="qp-saved-note"><Icon name="info" size={16} />{xl.savedNote}</p>
                <ul className="qp-saved-grid" role="list">
                  {savedList.map(x => {
                    const name = surahTitle(surahByNum(x.s), lang) || staticSurahName(x.s, lang)
                    const label = placeLabel(name, x.a, lang)
                    return (
                      <li key={`${x.s}:${x.a}`} className="qp-saved-card">
                        <span className="surah-num" aria-hidden="true">{x.s}</span>
                        <a className="qp-saved-card__open" href={`${pathFor('quran', tlang, x.s)}?a=${x.a}`}
                          onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); openSurah(x.s, x.a) }}>
                          <span className="qp-saved-card__title">{label}</span>
                          <span className="qp-saved-card__ref ui-num" dir="ltr">{x.s}:{x.a}</span>
                        </a>
                        {lang !== 'ar' && <span className="qp-saved-card__ar" lang="ar" aria-hidden="true">{SURAH_TABLE[x.s - 1]?.[4]}</span>}
                        <button type="button" className="qp-saved-card__del" onClick={() => toggleSaved(x.s, x.a)}
                          aria-label={`${xl.remove} — ${label}`} title={xl.remove}>
                          <Icon name="trash" size={16} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : <QEmpty icon="hifz">{xl.savedEmpty}</QEmpty>
          )}
          {searchMode === 'surah' && view === 'surahs' && (
            <>
              <div className="qp-filters">
                <div className="qp-chips" role="group" aria-label={sl.place}>
                  {[
                    { key:'all',     label: t.all },
                    { key:'meccan',  label: t.meccan },
                    { key:'medinan', label: t.medinan },
                  ].map(f => (
                    <button type="button" key={f.key} className="ui-chip"
                      aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
                  ))}
                </div>
                <label className="qp-juz">
                  <span className="ui-sr-only">{pk(ui.juz, lang)}</span>
                  <select className="ui-select qp-juz__select" value={juz} onChange={e => setJuz(Number(e.target.value))}>
                    <option value={0}>{pk(ui.allJuz, lang)}</option>
                    {JUZ_VERSES.map((_, i) => <option key={i + 1} value={i + 1}>{ui.juzN[lang] ? ui.juzN[lang](i + 1) : ui.juzN.az(i + 1)}</option>)}
                  </select>
                </label>
                <label className="qp-juz">
                  <span className="ui-sr-only">{xl.sort}</span>
                  <select className="ui-select qp-juz__select" value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="mushaf">{xl.sortMushaf}</option>
                    <option value="short">{xl.sortShort}</option>
                    <option value="long">{xl.sortLong}</option>
                  </select>
                </label>
                {!listLoading && !listError && (
                  <span className="qp-count ui-num" aria-live="polite">
                    {filtered.length} {String(st.surahs).toLocaleLowerCase(lang)}
                  </span>
                )}
              </div>
              {/* Seçilmiş cüz: hansı surədən neçə ayə düşür (bir baxışda) */}
              {juzBars && (
                <ChartFigure className="qp-juzchart" title={(pickUi(ui.juzChart, lang))(juz)}
                  sub={pk(ui.juzChartSub, lang)}
                  note={`${juzParts.length > juzBars.length ? `${(pickUi(ui.juzMore, lang))(juzParts.length - juzBars.length)} · ` : ''}${pk(ui.juzSrc, lang)}`}>
                  <BarChart data={juzBars} format={v => `${v}`} labelWidth="46%" label={(pickUi(ui.juzChart, lang))(juz)} />
                </ChartFigure>
              )}
              {listLoading && (
                <>
                  <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>
                  <ListSkeleton label={t.loading} />
                </>
              )}
              {!listLoading && listError && (
                <QEmpty icon="alert" bad action={
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setListAttempt(a => a + 1)}>
                    <Icon name="refresh" className="ui-btn__icon" />{rl.retry}
                  </button>
                }>{rl.listMsg}</QEmpty>
              )}
              {/* Kart şəbəkəsi (telefonda qruplaşdırılmış siyahı) */}
              <div className="surah-grid" data-reveal="stagger">
                {filtered.map((s) => {
                  const isAr = lang === 'ar'
                  const displayName = surahTitle(s, lang)
                  // ərəbcədə ingiliscə məna yox, "7 آيات · مكية"
                  const displayMeta = isAr
                    ? `${ayahCountText(s.numberOfAyahs, lang)} · ${revelationLabel(s.revelationType, lang)}`
                    : [extra ? '' : surahMeaning(s, lang), ayahCountText(s.numberOfAyahs, lang)].filter(Boolean).join(' · ')
                  const isMadani = s.revelationType === 'Medinan'
                  const wasRead = !!stats.reads[s.number]
                  const here = bookmark?.surah === s.number
                  return (
                    <a key={s.number} className={`surah-card${here ? ' is-here' : ''}${isMadani ? ' is-madani' : ''}`} href={pathFor('quran', tlang, s.number)}
                      onClick={linkTo(s.number)}>
                      {/* Surənin öz həndəsi rozeti (nömrədən yaranır — hər surədə fərqli) */}
                      <SurahArt n={s.number} />
                      {wasRead && (
                        <span className="surah-read" title={xl.read}>
                          <Icon name="check" size={12} /><span className="ui-sr-only">{xl.read}</span>
                        </span>
                      )}
                      {here && bmProgress > 0 && <span className="surah-here-bar" style={{ '--p': bmProgress.toFixed(3) }} aria-hidden="true" />}
                      <span className={`surah-num${isMadani ? ' is-madani' : ''}`}>{s.number}</span>
                      <span className="surah-body">
                        <span className={`surah-name-en${isAr ? ' is-ar' : ''}`}>{displayName}</span>
                        <span className="surah-meta">{displayMeta}</span>
                      </span>
                      {!isAr && <span className="surah-name-ar" lang="ar">{s.name}</span>}
                    </a>
                  )
                })}
              </div>
              {!listLoading && !listError && filtered.length === 0 && (
                <QEmpty icon="search">{sl.noResults}</QEmpty>
              )}
            </>
          )}
          {searchMode === 'verse' && (
            <>
              {verseSearch.length < 3 && (
                <QEmpty icon="search">{sl.minChars}</QEmpty>
              )}
              {verseSearching && (
                <>
                  <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{sl.searching}</span></div>
                  <ListSkeleton label={sl.searching} />
                </>
              )}
              {!verseSearching && verseSearch.length >= 3 && verseError && (
                <QEmpty icon="alert" bad action={
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setVerseAttempt(a => a + 1)}>
                    <Icon name="refresh" className="ui-btn__icon" />{rl.retry}
                  </button>
                }>{sl.searchError}</QEmpty>
              )}
              {!verseSearching && verseSearch.length >= 3 && !verseError && verseResults.length === 0 && (
                <QEmpty icon="search">{sl.noResults}</QEmpty>
              )}
              {!verseSearching && verseResults.length > 0 && (
                <div className="verse-results">
                  <p className="verse-results-count ui-num">{verseResults.length} {sl.result}</p>
                  {verseResults.map((v, i) => {
                    // Axtarış yalnız seçilmiş nəşrin mətnini qaytarır (tərcümə və ya
                    // ərəbcədə təfsir) — onu bir dəfə, adi yazı kimi göstəririk.
                    const isQuranText = v.edition?.type === 'quran'
                    return (
                      <button type="button" key={v.number} className="verse-result-card" style={{'--i': Math.min(i, 7)}}
                        onClick={() => openSurah(v.surah.number, v.numberInSurah)}>
                        <span className="vr-header">
                          <span className="vr-surah">
                            {surahTitle(v.surah, lang)}
                            {v.edition?.type === 'tafsir' && <span className="vr-kind">{tafsirLabel}</span>}
                          </span>
                          <span className="vr-ayah" dir="ltr">{v.surah.number}:{v.numberInSurah}</span>
                        </span>
                        <span className={isQuranText ? 'vr-arabic' : 'vr-trans'} lang={isQuranText ? 'ar' : undefined}>{v.text}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* v3.2: xətm planı + Quran radiosu (ruqyə siyahısı ilə) */}
      <section className="ui-section ui-section--tight qp-tools">
        <div className="ui-container qp-tools__grid">
        {/* Günün ayəsi (API-dən; alınmasa görünmür) */}
        {votd && (
          <article className="qp-votd" aria-labelledby="qp-votd-h">
            <div className="qp-votd__head">
              <span className="ui-eyebrow" id="qp-votd-h">{xl.votd}</span>
            </div>
            <p className="qp-votd__ar" lang="ar" dir="rtl">{votd.ar}</p>
            {votd.tr && <p className="qp-votd__tr" lang={tlang} dir={dirOf(tlang)}>{votd.tr}</p>}
            <div className="qp-votd__foot">
              <span className="qp-votd__src">{placeLabel(surahTitle(surahByNum(votd.s), lang) || staticSurahName(votd.s, lang), votd.a, lang)}</span>
              <a className="ui-btn ui-btn--sm ui-btn--secondary" href={`${pathFor('quran', tlang, votd.s)}?a=${votd.a}`}
                onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); openSurah(votd.s, votd.a) }}>
                {xl.votdOpen}<DirArrow />
              </a>
            </div>
          </article>
        )}
          <DeferRender height="560px" idle={false} rootMargin="300px 0px">
            <Suspense fallback={<div className="ui-card" style={{ minHeight: 520 }} />}>
              <QuranGalaxy lang={lang} surahName={n => surahTitle(surahByNum(n), lang) || staticSurahName(n, lang)} onOpen={n => openSurah(n)} />
            </Suspense>
          </DeferRender>
          <OfflinePack lang={lang} surahUrl={offlineSurahUrl} />
          <OfflineAudio lang={lang} surahUrl={offlineSurahUrl} />
          <KhatmPlanner lang={lang} surahName={n => surahTitle(surahByNum(n), lang) || staticSurahName(n, lang)} />
          <QuranRadio lang={lang} surahName={n => surahTitle(surahByNum(n), lang) || staticSurahName(n, lang)}
            placeLabel={(name, a) => placeLabel(name, a, lang)} />
        </div>
      </section>

      {/* v5.9: "Quran rəqəmlərlə" — viz v2 bento (ümumi rəqəmlər + yerli oxu statistikası) */}
      <DeferRender height="1400px" idle={false} rootMargin="300px 0px">
        <Suspense fallback={<div style={{ minHeight: 1400 }} />}>
          <QuranNumbers lang={lang} stats={stats}
            surahName={n => surahTitle(surahByNum(n), lang) || staticSurahName(n, lang)}
            hrefOf={n => pathFor('quran', lang, n)} onOpen={n => openSurah(n)} />
        </Suspense>
      </DeferRender>

      <QuranGuide lang={lang} />
    </>
  )
}

// ═══════════════════════════════════════════════════════
// Bələdçi (siyahının altında): Quran nədir · tarix · ədəb · fəzilət ·
// oxuyucunu necə işlətmək · əlaqəli bölmələr. Mətnlər: data/guides/QuranPage.js
// ═══════════════════════════════════════════════════════
function SectionHead({ eyebrow, title, lead, id }) {
  return (
    <div className="ui-section-head" data-reveal="">
      {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
      <h2 className="ui-title" id={id}>{title}</h2>
      {lead && <p className="ui-lead">{lead}</p>}
    </div>
  )
}

// Ayə və ya hədis sitatı (.ui-quote): ərəbcə + məna + mənbə
function QQuote({ q, lang, kind = 'quran' }) {
  const ui = QURAN_GUIDE.ui
  // Ərəbcədə məna ayrıca yazılmır — ərəb mətninin özü kifayətdir
  const text = lang === 'ar' ? '' : pk(q.text, lang)
  const href = q.ref ? `${pathFor('quran', lang, Number(String(q.ref).split(':')[0]))}?a=${String(q.ref).split(':')[1].split('-')[0]}` : null
  return (
    <figure className={`ui-quote qp-quote qp-quote--${kind}`}>
      <blockquote>
        <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{q.ar}</p>
        {text && <p className="ui-quote__text">{text}</p>}
      </blockquote>
      <figcaption className="ui-quote__src">
        {kind === 'quran'
          ? <>{pk(ui.quran, lang)}, <a href={href} dir="ltr" className="qp-quote__ref">{q.ref}</a></>
          : <><cite>{pk(q.src, lang)}</cite>{q.grade && <> · {pk(ui.grade, lang)}: {pk(q.grade, lang)}</>}</>}
      </figcaption>
    </figure>
  )
}

function QuranGuide({ lang }) {
  const navigate = useNavigate()
  const g = QURAN_GUIDE
  const go = href => e => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
  }
  return (
    <div id="qp-about" className="qp-guide" tabIndex={-1}>
      {/* Quran nədir + Məkki/Mədəni tərkibi */}
      <section className="ui-section ui-section--alt qp-sec" aria-labelledby="qp-about-h">
        <div className="ui-container qp-about">
          <div className="qp-about__text">
            <SectionHead eyebrow={pk(g.about.eyebrow, lang)} title={pk(g.about.title, lang)} id="qp-about-h" />
            <p className="qp-p">{pk(g.about.text, lang)}</p>
            {g.about.quotes.map(q => <QQuote key={q.ref} q={q} lang={lang} />)}
          </div>
          <div className="qp-about__aside">
            <ChartFigure title={pk(g.facts.donutTitle, lang)} sub={pk(g.facts.donutSub, lang)} note={pk(g.facts.donutNote, lang)}>
              <Donut size={148} thickness={18}
                segments={[
                  { label: revelationLabel('Meccan', lang), value: 86, tone: 1 },
                  { label: revelationLabel('Medinan', lang), value: 28, tone: 2 },
                ]}
                center={{ value: '114', label: pk(g.facts.items[0].label, lang) }} />
            </ChartFigure>
            <StatTile variant="sunken" tone="accent" value={g.facts.items[4].value}
              label={pk(g.facts.items[4].label, lang)} hint={pk(g.facts.items[4].hint, lang)} />
          </div>
        </div>
      </section>

      {/* Tarix — zaman xətti */}
      <section className="ui-section qp-sec ui-cv" style={{ '--cv-h': '760px' }} aria-labelledby="qp-history-h">
        <div className="ui-container qp-narrow qp-history">
          <SectionHead eyebrow={pk(g.history.eyebrow, lang)} title={pk(g.history.title, lang)} lead={pk(g.history.lead, lang)} id="qp-history-h" />
          <Timeline wide items={g.history.items.map((it, i) => ({
            key: i, when: it.when, title: pk(it.title, lang), text: pk(it.text, lang), highlight: it.highlight,
          }))} />
        </div>
      </section>

      {/* Ədəb — 6 kart: nə etmək + dəlil */}
      <section className="ui-section ui-section--alt qp-sec ui-cv" style={{ '--cv-h': '1400px' }} aria-labelledby="qp-adab-h">
        <div className="ui-container">
          <SectionHead eyebrow={pk(g.adab.eyebrow, lang)} title={pk(g.adab.title, lang)} lead={pk(g.adab.lead, lang)} id="qp-adab-h" />
          <ol className="qp-adab">
            {g.adab.items.map((it, i) => (
              <li key={i} className="ui-card qp-adab__item">
                <div className="qp-adab__head">
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name={it.icon} /></span>
                  <h3 className="ui-card__title"><span className="qp-adab__n ui-num" aria-hidden="true">{i + 1}</span>{pk(it.title, lang)}</h3>
                </div>
                <p className="qp-adab__how">{pk(it.how, lang)}</p>
                <QQuote q={it} lang={lang} kind={it.hadith ? 'hadith' : 'quran'} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fəzilət */}
      <section className="ui-section qp-sec ui-cv" style={{ '--cv-h': '700px' }} aria-labelledby="qp-virtue-h">
        <div className="ui-container">
          <SectionHead eyebrow={pk(g.virtues.eyebrow, lang)} title={pk(g.virtues.title, lang)} id="qp-virtue-h" />
          <div className="qp-virtues">
            {g.virtues.items.map((q, i) => <QQuote key={i} q={q} lang={lang} kind="hadith" />)}
          </div>
        </div>
      </section>

      {/* Necə işlədilir — addımlar */}
      <section className="ui-section ui-section--alt qp-sec ui-cv" style={{ '--cv-h': '520px' }} aria-labelledby="qp-howto-h">
        <div className="ui-container">
          <SectionHead eyebrow={pk(g.howto.eyebrow, lang)} title={pk(g.howto.title, lang)} id="qp-howto-h" />
          <ol className="ui-steps ui-steps--row">
            {g.howto.steps.map((s, i) => (
              <li key={i} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{pk(s.title, lang)}</h3>
                  <p className="ui-step__text">{pk(s.text, lang)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Əlaqəli bölmələr — məzmunu təkrarlamır, keçid verir */}
      <section className="ui-section qp-sec ui-cv" style={{ '--cv-h': '360px' }} aria-labelledby="qp-related-h">
        <div className="ui-container">
          <SectionHead eyebrow={pk(g.related.eyebrow, lang)} title={pk(g.related.title, lang)} id="qp-related-h" />
          <ul className="ui-tiles" style={{ '--ui-tiles-min': '168px' }}>
            {g.related.items.map(it => {
              const href = pathFor(it.key, lang)
              return (
                <li key={it.key}>
                  <a className="ui-tile" href={href} onClick={go(href)}>
                    <span className="ui-icon-tile" aria-hidden="true"><Icon name={it.icon} /></span>
                    <span className="ui-tile__title">{pk(it.title, lang)}</span>
                    <span className="ui-tile__text">{pk(it.text, lang)}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </div>
  )
}
