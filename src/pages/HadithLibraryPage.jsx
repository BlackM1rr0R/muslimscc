import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReaderDialog from '../components/reader/ReaderDialog'
import StarButton from '../components/collect/StarButton'
import useStarred from '../components/collect/useStarred'
import { copyText, readJSON, shareOrCopy, writeJSON } from '../components/reader/share'
import { OVERLAY_KEY } from '../utils/useBackToClose'
import { fetchSectionPair } from '../api/hadithLibrary'
import { BOOKS, BOOK_DATA, TRANSLATION_LANGS, DEFAULT_TRANSLATION } from '../data/hadithLibrary'
import '../styles/HadithLibraryPage.css'
// Dizayn v6 (src/motion): hədis kartı → oxu pəncərəsi morph (layoutId), hero rəqəmləri sayğacla
import { m } from 'motion/react'
import { ExpandableGroup, useMorphId, morphId } from '../motion/ExpandableCard'
import { SPRING } from '../motion/presets'
import NumberTicker from '../motion/NumberTicker'
import HadithBooksChart from '../components/HadithBooksChart'
import HadithLibraryNumbers from '../components/numbers/HadithLibraryNumbers'
import HadithShelf from '../components/HadithShelf'
import { pickUi } from '../utils/uiText'

/* ══════════════════════════════════════════════════════════════════
   HƏDİS KİTABXANASI — /hadith-library
   Tam hədis kitabları (Buxari, Müslim, Əbu Davud, Tirmizi, Nəsai, İbn Macə,
   Müvətta, ən-Nəvəvinin 40-ı, 40 qüdsi hədis) — fawazahmed0/hadith-api
   (Unlicense). Kitab kartları → bölmə kartları → hədis kartları → oxu
   pəncərəsi (ReaderDialog: əvvəlki/növbəti, kopyala, paylaş, seçilmişlər).

   Ünvan (hash): #bukhari → kitab, #bukhari/1 → bölmə, #bukhari/1/5 → hədis
   açıq. Kitab/bölmə keçidləri tarixçəyə yazılır (Geri işləyir), açıq hədis
   isə ReaderDialog-un girişində saxlanılır (Nawawi40Page kimi).

   Bölmələr yalnız açılanda yüklənir (ərəbcə + seçilmiş tərcümə, 2 sorğu);
   bütöv kitab heç vaxt yüklənmir. Dərəcələr mənbədə olduğu kimi göstərilir —
   heç nə hesablanmır və dəyişmir; dərəcə yoxdursa heç nə göstərilmir.
   localStorage: hadithlib_tr_v1 (tərcümə), hadithlib_last_v1 (son açılan),
   hadithlib_starred_v1 (seçilmişlər — "kitab/bölmə/nömrə").
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    eyebrow: 'Hədis', title: 'Hədis kitabxanası',
    lead: 'Səhih əl-Buxari, Səhih Müslim, Sünən kitabları və Müvətta — bölmə-bölmə, ərəbcə mətn və tərcümə ilə. Alimlərin verdiyi dərəcələr mənbədə olduğu kimi göstərilir.',
    how: 'Kitabı, sonra bölməni seçin. Hədis kartına toxunanda ərəbcə mətn, tərcümə və dərəcələr oxu pəncərəsində açılır. Ünvanı paylaşsanız, həmin hədis açılacaq.',
    statBooks: 'kitab', statHadiths: 'hədis', statLangs: 'tərcümə dili',
    cont: 'Davam et', library: 'Kitabxana', booksTitle: 'Kitablar', booksLead: 'Kitabı seçin — bölmələri açılacaq.',
    hadiths: 'hədis', sections: 'bölmə', chapters: 'Bölmələr', open: 'Aç',
    searchSections: 'Bölmə axtar...', searchHadith: 'Bu bölmədə axtar (mətn, nömrə, dərəcə)...', clear: 'Axtarışı təmizlə',
    all: 'Hamısı', weak: 'Zəif dərəcəlilər', starredF: 'Seçilmişlər', filterLabel: 'Süzgəc',
    none: 'Heç nə tapılmadı.', reset: 'Süzgəci sıfırla', showMore: 'Daha çox göstər', shown: 'göstərilir',
    loading: 'Bölmə yüklənir...', errTitle: 'Bölmə yüklənmədi', errText: 'Mənbəyə qoşulmaq alınmadı. Bir az sonra yenidən cəhd edin.',
    offline: 'İnternet bağlantısı yoxdur. Əvvəl açdığınız bölmələr bağlantısız da açılır.', retry: 'Yenidən cəhd et',
    trLabel: 'Tərcümə', arOnly: 'Yalnız ərəbcə',
    noAz: 'Bu kitabların Azərbaycan dilinə tərcüməsi mənbədə yoxdur, ona görə ingiliscə tərcümə göstərilir. Tərcümə dilini alət zolağından dəyişə bilərsiniz.',
    noLang: 'Bu kitabın seçdiyiniz dildə tərcüməsi mənbədə yoxdur — ingiliscə tərcümə göstərilir.',
    trFailed: 'Tərcümə yüklənmədi — yalnız ərəbcə mətn göstərilir.',
    close: 'Bağla', prev: 'Əvvəlki', next: 'Növbəti', copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    star: 'Seçilmişlərə əlavə et', unstar: 'Seçilmişlərdən çıxar', favTitle: 'Seçilmiş hədislər', favLead: 'Ulduzla işarələdiyiniz hədislər (yalnız bu cihazda).',
    grades: 'Hədis alimlərinin dərəcəsi', weakMark: 'Zəif dərəcə var', fabMark: 'Uydurma dərəcəsi var',
    weakNote: 'Zəif (daif) rəvayətlər kitablarda olduğu kimi göstərilir və hədis alimlərinin verdiyi dərəcə ilə işarələnir. Dərəcələr mənbədən olduğu kimi götürülür — biz onları dəyişmir və hesablamırıq. Dərəcə göstərilməyibsə, mənbədə yoxdur.',
    weakNoteTitle: 'Zəif rəvayətlər haqqında',
    legendWeak: 'zəif (daif, münkər, şazz)', legendFab: 'uydurma (məvdu, batil)',
    aboutEyebrow: 'Mənbə', aboutTitle: 'Məlumat və lisenziya',
    dataLine: 'Məlumat', licenseNote: 'ictimai mülkiyyət — sərbəst istifadə olunur.',
    trSources: 'Tərcümə mənbəyi', translator: 'Tərcüməçi', unknownTr: 'tərcüməçi mənbədə göstərilməyib',
    enTitles: 'Bölmə adları mənbədə yalnız ingiliscədir və dəyişmədən verilir.',
    noChapter: 'Bölməsiz hədislər', noChapterHint: 'mənbədə bölməyə aid edilməyib',
    section: 'Bölmə', arNum: 'Ərəbcə nəşrdə nömrəsi', ref: 'İstinad', backBook: 'Bölmələrə qayıt',
    prevSec: 'Əvvəlki bölmə', nextSec: 'Növbəti bölmə', keys: '← → — keçid, Esc — bağla', read: 'Oxu', crumbs: 'Yol',
  },
  en: {
    eyebrow: 'Hadith', title: 'Hadith Library',
    lead: 'Sahih al-Bukhari, Sahih Muslim, the Sunan and the Muwatta — chapter by chapter, with the Arabic text and a translation. Grades given by the scholars are shown exactly as the source has them.',
    how: 'Choose a book, then a chapter. Tap a hadith card to open its Arabic text, translation and grades in the reader. Share the address and the same hadith opens.',
    statBooks: 'books', statHadiths: 'hadiths', statLangs: 'translation languages',
    cont: 'Continue', library: 'Library', booksTitle: 'Books', booksLead: 'Choose a book to see its chapters.',
    hadiths: 'hadiths', sections: 'chapters', chapters: 'Chapters', open: 'Open',
    searchSections: 'Search chapters...', searchHadith: 'Search this chapter (text, number, grade)...', clear: 'Clear search',
    all: 'All', weak: 'Graded weak', starredF: 'Favourites', filterLabel: 'Filter',
    none: 'Nothing found.', reset: 'Reset filters', showMore: 'Show more', shown: 'shown',
    loading: 'Loading the chapter...', errTitle: 'The chapter did not load', errText: 'Could not reach the source. Please try again in a moment.',
    offline: 'You are offline. Chapters you opened before still open without a connection.', retry: 'Try again',
    trLabel: 'Translation', arOnly: 'Arabic only',
    noAz: 'The source has no Azerbaijani translation of these books, so the English one is shown. You can change the translation language in the toolbar.',
    noLang: 'The source has no translation of this book in your language — the English one is shown.',
    trFailed: 'The translation did not load — only the Arabic text is shown.',
    close: 'Close', prev: 'Previous', next: 'Next', copy: 'Copy', copied: 'Copied', share: 'Share',
    star: 'Add to favourites', unstar: 'Remove from favourites', favTitle: 'Favourite hadiths', favLead: 'Hadiths you starred (on this device only).',
    grades: 'Grades by hadith scholars', weakMark: 'Has a weak grade', fabMark: 'Has a fabricated grade',
    weakNote: 'Weak (da‘if) narrations are shown as they appear in the books and are labelled with the grades given by hadith scholars. Grades are taken exactly as the source gives them — we do not change or compute them. If no grade is shown, the source has none.',
    weakNoteTitle: 'About weak narrations',
    legendWeak: 'weak (da‘if, munkar, shadh)', legendFab: 'fabricated (mawdu‘, batil)',
    aboutEyebrow: 'Source', aboutTitle: 'Data and licence',
    dataLine: 'Data', licenseNote: 'public domain — free to use.',
    trSources: 'Translation source', translator: 'Translator', unknownTr: 'translator not named in the source',
    enTitles: 'Chapter titles exist in English only in the source and are shown unchanged.',
    noChapter: 'Hadiths without a chapter', noChapterHint: 'not assigned to a chapter in the source',
    section: 'Chapter', arNum: 'Number in the Arabic edition', ref: 'Reference', backBook: 'Back to chapters',
    prevSec: 'Previous chapter', nextSec: 'Next chapter', keys: '← → to move, Esc to close', read: 'Read', crumbs: 'Path',
  },
  ru: {
    eyebrow: 'Хадисы', title: 'Библиотека хадисов',
    lead: '«Сахих» аль-Бухари, «Сахих» Муслима, сборники «Сунан» и «Муватта» — по разделам, с арабским текстом и переводом. Оценки учёных показаны в точности как в источнике.',
    how: 'Выберите книгу, затем раздел. Нажмите на карточку хадиса — откроется арабский текст, перевод и оценки. Поделитесь адресом — откроется тот же хадис.',
    statBooks: 'книг', statHadiths: 'хадисов', statLangs: 'языков перевода',
    cont: 'Продолжить', library: 'Библиотека', booksTitle: 'Книги', booksLead: 'Выберите книгу, чтобы увидеть её разделы.',
    hadiths: 'хадисов', sections: 'разделов', chapters: 'Разделы', open: 'Открыть',
    searchSections: 'Поиск раздела...', searchHadith: 'Поиск в разделе (текст, номер, оценка)...', clear: 'Очистить поиск',
    all: 'Все', weak: 'Со слабой оценкой', starredF: 'Избранное', filterLabel: 'Фильтр',
    none: 'Ничего не найдено.', reset: 'Сбросить фильтры', showMore: 'Показать ещё', shown: 'показано',
    loading: 'Раздел загружается...', errTitle: 'Раздел не загрузился', errText: 'Не удалось связаться с источником. Попробуйте ещё раз чуть позже.',
    offline: 'Нет подключения к интернету. Ранее открытые разделы открываются и без сети.', retry: 'Повторить',
    trLabel: 'Перевод', arOnly: 'Только арабский',
    noAz: 'В источнике нет перевода этих книг на азербайджанский, поэтому показан английский. Язык перевода можно сменить на панели.',
    noLang: 'В источнике нет перевода этой книги на ваш язык — показан английский.',
    trFailed: 'Перевод не загрузился — показан только арабский текст.',
    close: 'Закрыть', prev: 'Предыдущий', next: 'Следующий', copy: 'Копировать', copied: 'Скопировано', share: 'Поделиться',
    star: 'Добавить в избранное', unstar: 'Убрать из избранного', favTitle: 'Избранные хадисы', favLead: 'Хадисы, отмеченные звёздочкой (только на этом устройстве).',
    grades: 'Оценки знатоков хадисов', weakMark: 'Есть оценка «слабый»', fabMark: 'Есть оценка «выдуманный»',
    weakNote: 'Слабые (да‘иф) риваяты показаны так, как они приведены в книгах, и помечены оценками знатоков хадисов. Оценки взяты из источника без изменений — мы их не меняем и не вычисляем. Если оценки нет, её нет и в источнике.',
    weakNoteTitle: 'О слабых риваятах',
    legendWeak: 'слабый (да‘иф, мункар, шазз)', legendFab: 'выдуманный (мауду‘, батыль)',
    aboutEyebrow: 'Источник', aboutTitle: 'Данные и лицензия',
    dataLine: 'Данные', licenseNote: 'общественное достояние — можно свободно использовать.',
    trSources: 'Источник перевода', translator: 'Переводчик', unknownTr: 'переводчик в источнике не указан',
    enTitles: 'Названия разделов в источнике есть только на английском и даны без изменений.',
    noChapter: 'Хадисы вне разделов', noChapterHint: 'в источнике не отнесены к разделу',
    section: 'Раздел', arNum: 'Номер в арабском издании', ref: 'Ссылка', backBook: 'К разделам',
    // lang-ok[Esc]: klaviatura düyməsinin adı
    prevSec: 'Предыдущий раздел', nextSec: 'Следующий раздел', keys: '← → — переход, Esc — закрыть', read: 'Читать', crumbs: 'Путь',
  },
  ar: {
    eyebrow: 'الحديث', title: 'مكتبة الحديث',
    lead: 'صحيح البخاري وصحيح مسلم والسنن والموطأ — كتابًا كتابًا، بالنص العربي ومع الترجمة. وأحكام أهل العلم معروضة كما وردت في المصدر.',
    how: 'اختر الكتاب ثم الباب، واضغط على بطاقة الحديث ليُفتح نصه وأحكامه في نافذة القراءة. وإذا شاركت الرابط فُتح الحديث نفسه.',
    statBooks: 'كتب', statHadiths: 'حديثًا', statLangs: 'لغات ترجمة',
    cont: 'تابِع', library: 'المكتبة', booksTitle: 'الكتب', booksLead: 'اختر كتابًا لتظهر أبوابه.',
    hadiths: 'حديثًا', sections: 'كتابًا', chapters: 'الكتب والأبواب', open: 'فتح',
    searchSections: 'ابحث في الأبواب...', searchHadith: 'ابحث في هذا الباب (النص، الرقم، الحكم)...', clear: 'مسح البحث',
    all: 'الكل', weak: 'فيها حكم بالضعف', starredF: 'المفضلة', filterLabel: 'تصفية',
    none: 'لم يُعثر على شيء.', reset: 'إلغاء التصفية', showMore: 'عرض المزيد', shown: 'معروض',
    loading: 'جارٍ تحميل الباب...', errTitle: 'تعذّر تحميل الباب', errText: 'تعذّر الاتصال بالمصدر، حاول مرة أخرى بعد قليل.',
    offline: 'لا يوجد اتصال بالإنترنت، والأبواب التي فتحتها من قبل تُفتح دون اتصال.', retry: 'إعادة المحاولة',
    trLabel: 'الترجمة', arOnly: 'العربية فقط',
    noAz: 'لا توجد في المصدر ترجمة أذربيجانية لهذه الكتب، فتُعرض الترجمة الإنجليزية، ويمكنك تغيير لغة الترجمة من شريط الأدوات.',
    noLang: 'لا توجد في المصدر ترجمة لهذا الكتاب بلغتك، فتُعرض الترجمة الإنجليزية.',
    trFailed: 'تعذّر تحميل الترجمة، ويُعرض النص العربي وحده.',
    close: 'إغلاق', prev: 'السابق', next: 'التالي', copy: 'نسخ', copied: 'تم النسخ', share: 'مشاركة',
    star: 'أضف إلى المفضلة', unstar: 'أزل من المفضلة', favTitle: 'الأحاديث المفضلة', favLead: 'الأحاديث التي علّمتها بالنجمة (على هذا الجهاز فقط).',
    grades: 'أحكام أهل الحديث', weakMark: 'فيه حكم بالضعف', fabMark: 'فيه حكم بالوضع',
    weakNote: 'تُعرض الروايات الضعيفة كما وردت في الكتب، وتُميَّز بأحكام أهل الحديث عليها. والأحكام منقولة من المصدر كما هي دون تغيير أو استنتاج، فإن لم يظهر حكم فليس في المصدر حكم.',
    weakNoteTitle: 'عن الروايات الضعيفة',
    legendWeak: 'ضعيف (ضعيف، منكر، شاذ)', legendFab: 'موضوع (موضوع، باطل)',
    aboutEyebrow: 'المصدر', aboutTitle: 'البيانات والترخيص',
    dataLine: 'البيانات', licenseNote: 'ملك عام، يجوز استعماله بحرية.',
    trSources: 'مصدر الترجمة', translator: 'المترجم', unknownTr: 'لم يُذكر المترجم في المصدر',
    enTitles: 'أسماء الأبواب في المصدر بالإنجليزية فقط، وتُعرض دون تغيير.',
    noChapter: 'أحاديث بلا باب', noChapterHint: 'لم تُنسب إلى باب في المصدر',
    section: 'الباب', arNum: 'رقمه في الطبعة العربية', ref: 'المرجع', backBook: 'العودة إلى الأبواب',
    // lang-ok[Esc]: klaviatura düyməsinin adı
    prevSec: 'الباب السابق', nextSec: 'الباب التالي', keys: '← → للتنقل، Esc للإغلاق', read: 'اقرأ', crumbs: 'المسار',
  },
  tr: {
    eyebrow: 'Hadis', title: 'Hadis Kütüphanesi',
    lead: 'Sahîh-i Buhârî, Sahîh-i Müslim, Sünenler ve Muvatta — bölüm bölüm, Arapça metin ve tercümeyle. Âlimlerin verdiği hükümler kaynakta olduğu gibi gösterilir.',
    how: 'Bir kitap, sonra bir bölüm seçin. Hadis kartına dokununca Arapça metin, tercüme ve hükümler okuma penceresinde açılır. Adresi paylaşırsanız aynı hadis açılır.',
    statBooks: 'kitap', statHadiths: 'hadis', statLangs: 'tercüme dili',
    cont: 'Devam et', library: 'Kütüphane', booksTitle: 'Kitaplar', booksLead: 'Bölümlerini görmek için bir kitap seçin.',
    hadiths: 'hadis', sections: 'bölüm', chapters: 'Bölümler', open: 'Aç',
    searchSections: 'Bölüm ara...', searchHadith: 'Bu bölümde ara (metin, numara, hüküm)...', clear: 'Aramayı temizle',
    all: 'Tümü', weak: 'Zayıf hükümlüler', starredF: 'Favoriler', filterLabel: 'Filtre',
    none: 'Bir şey bulunamadı.', reset: 'Filtreleri sıfırla', showMore: 'Daha fazla göster', shown: 'gösteriliyor',
    loading: 'Bölüm yükleniyor...', errTitle: 'Bölüm yüklenemedi', errText: 'Kaynağa bağlanılamadı. Biraz sonra yeniden deneyin.',
    offline: 'İnternet bağlantısı yok. Daha önce açtığınız bölümler bağlantısız da açılır.', retry: 'Yeniden dene',
    trLabel: 'Tercüme', arOnly: 'Yalnızca Arapça',
    noAz: 'Kaynakta bu kitapların Azerbaycan Türkçesi tercümesi yok, bu yüzden İngilizce tercüme gösteriliyor. Tercüme dilini araç çubuğundan değiştirebilirsiniz.',
    noLang: 'Kaynakta bu kitabın sizin dilinizde tercümesi yok — İngilizce tercüme gösteriliyor.',
    trFailed: 'Tercüme yüklenemedi — yalnızca Arapça metin gösteriliyor.',
    close: 'Kapat', prev: 'Önceki', next: 'Sonraki', copy: 'Kopyala', copied: 'Kopyalandı', share: 'Paylaş',
    star: 'Favorilere ekle', unstar: 'Favorilerden çıkar', favTitle: 'Favori hadisler', favLead: 'Yıldızla işaretlediğiniz hadisler (yalnızca bu cihazda).',
    grades: 'Hadis âlimlerinin hükmü', weakMark: 'Zayıf hükmü var', fabMark: 'Uydurma hükmü var',
    weakNote: 'Zayıf (daîf) rivayetler kitaplarda geçtiği gibi gösterilir ve hadis âlimlerinin verdiği hükümle işaretlenir. Hükümler kaynaktan olduğu gibi alınır — onları değiştirmiyor ve hesaplamıyoruz. Hüküm gösterilmiyorsa kaynakta yoktur.',
    weakNoteTitle: 'Zayıf rivayetler hakkında',
    legendWeak: 'zayıf (daîf, münker, şâz)', legendFab: 'uydurma (mevzû, bâtıl)',
    aboutEyebrow: 'Kaynak', aboutTitle: 'Veri ve lisans',
    dataLine: 'Veri', licenseNote: 'kamu malı — serbestçe kullanılabilir.',
    trSources: 'Tercüme kaynağı', translator: 'Mütercim', unknownTr: 'mütercim kaynakta belirtilmemiş',
    enTitles: 'Bölüm adları kaynakta yalnızca İngilizcedir ve değiştirilmeden verilir.',
    noChapter: 'Bölümsüz hadisler', noChapterHint: 'kaynakta bir bölüme bağlanmamış',
    section: 'Bölüm', arNum: 'Arapça baskıdaki numarası', ref: 'Kaynak', backBook: 'Bölümlere dön',
    prevSec: 'Önceki bölüm', nextSec: 'Sonraki bölüm', keys: '← → geçiş, Esc kapat', read: 'Oku', crumbs: 'Yol',
  },
}

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const pick = (o, lang) => (o && (pickUi(o, lang, 'en'))) || ''
const HARAKAT = /[ً-ْٰـ]/g
const norm = (s) => String(s || '').replace(HARAKAT, '').toLowerCase()

// Dərəcə mətnindən YALNIZ vizual işarə (mətn özü dəyişmir): zəif / uydurma
const FAB_RE = /mawdu|maudu|mawdoo|batil|fabricat/i
const WEAK_RE = /da['‘’]?i?f|daeef|munkar|shadh|shaadh|matruk/i
export function gradeTone(grade) {
  const g = String(grade || '')
  if (FAB_RE.test(g)) return 'fab'
  if (WEAK_RE.test(g)) return 'weak'
  return ''
}
const hadithTone = (h) => {
  const tones = h.grades.map(g => gradeTone(g.grade))
  return tones.includes('fab') ? 'fab' : tones.includes('weak') ? 'weak' : ''
}

const BOOK_BY_KEY = new Map(BOOKS.map(b => [b.key, b]))
// Bölmələr: mənbədəki sıra; "bölməsiz" (0, adı boş) sona
function sectionsOf(book) {
  const list = BOOK_DATA[book]?.sections || []
  return [...list.filter(s => !(s[0] === 0 && !s[1])), ...list.filter(s => s[0] === 0 && !s[1])]
}
const TOTAL_HADITHS = BOOKS.reduce((a, b) => a + (BOOK_DATA[b.key]?.total || 0), 0)
const ALL_LANGS = new Set(BOOKS.flatMap(b => Object.keys(BOOK_DATA[b.key]?.editions || {})))

const TR_KEY = 'hadithlib_tr_v1'
const LAST_KEY = 'hadithlib_last_v1'
const STAR_KEY = 'hadithlib_starred_v1'
const PAGE = 60
const NATURAL = { az: 'aze', en: 'eng', ru: 'rus', tr: 'tur', ar: '' } // lang-ok: nəşr kodları

// #bukhari/1/5 ↔ { book, sec, n }
function parseHash(hash) {
  const parts = decodeURIComponent(String(hash || '').replace(/^#/, '')).split('/').filter(Boolean)
  const book = parts[0]
  if (!book || !BOOK_DATA[book]) return { book: null, sec: null, n: null }
  const secs = sectionsOf(book)
  let sec = parts[1] != null && /^\d+$/.test(parts[1]) ? Number(parts[1]) : null
  if (sec != null && !secs.some(s => s[0] === sec)) sec = null
  if (sec == null && secs.length === 1) sec = secs[0][0]       // tək bölməli kitab (40 hədis)
  const n = sec != null && parts[2] && /^\d+(\.\d+)?$/.test(parts[2]) ? parts[2] : null
  return { book, sec, n }
}
function toHash({ book, sec, n }) {
  if (!book) return ''
  const single = sectionsOf(book).length === 1
  if (sec == null || (single && n == null)) return `#${book}`
  return n != null ? `#${book}/${sec}/${n}` : `#${book}/${sec}`
}
const baseUrl = () => window.location.pathname + window.location.search
function replaceUrl(hash) {
  try { window.history.replaceState(window.history.state, '', baseUrl() + hash) } catch { /* */ }
}
function pushUrl(hash) {
  try {
    const st = { ...(window.history.state || {}) }
    delete st[OVERLAY_KEY]
    window.history.pushState(st, '', baseUrl() + hash)
  } catch { /* */ }
}

export default function HadithLibraryPage() {
  // siteLang — URL-in dili: /id/hadith-library-də hədisin tərcüməsi indoneziyaca
  // nəşrdən gəlir (hazır mənbə), interfeys isə lüğətdən (src/utils/uiText.js)
  const { lang, siteLang = lang } = useLang()
  const location = useLocation()
  const L = pickUi(LABELS, lang, 'en')
  const isAr = lang === 'ar'

  const [route, setRoute] = useState(() => (typeof window === 'undefined' ? { book: null, sec: null, n: null } : parseHash(window.location.hash)))
  const [trPref, setTrPref] = useState(() => {
    const v = readJSON(TR_KEY, null)
    return typeof v === 'string' && (v === '' || TRANSLATION_LANGS[v]) ? v : DEFAULT_TRANSLATION[siteLang] ?? DEFAULT_TRANSLATION[lang] ?? 'eng'
  })
  const [userPicked, setUserPicked] = useState(() => typeof readJSON(TR_KEY, null) === 'string')
  const [data, setData] = useState({ key: '', status: 'idle', hadiths: [], trError: false, offline: false })
  const [reload, setReload] = useState(0)
  const [q, setQ] = useState('')
  const [secQ, setSecQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [limit, setLimit] = useState(PAGE)
  const [flashKey, setFlashKey] = useState('')
  const [from, setFrom] = useState(null)      // pəncərə hansı kartdan açılıb (morph)
  const morph = useMorphId(from == null ? null : `hl-${from}`)
  const morphOn = useMorphId(0) != null
  const [last, setLast] = useState(() => readJSON(LAST_KEY, null))
  const stars = useStarred(STAR_KEY)
  const mainRef = useRef(null)

  // Sayt dili dəyişəndə (istifadəçi özü seçməyibsə) tərcümə də dəyişir
  useEffect(() => { if (!userPicked) setTrPref(DEFAULT_TRANSLATION[siteLang] ?? DEFAULT_TRANSLATION[lang] ?? 'eng') }, [lang, siteLang, userPicked])

  // Hash → vəziyyət. Açıq hədis nömrəsi cari girişdən silinir (ReaderDialog
  // öz girişini qoyur, nömrə ora yazılır) — bağlananda Geri yenidən açmasın.
  // strippedRef: nömrəsi silinmiş hash — eyni hash yenidən oxunanda (StrictMode,
  // marşrutlaşdırıcının təkrar render-i) açıq hədis itməsin
  const strippedRef = useRef('')
  const appliedRef = useRef(null)
  const applyHash = useCallback((hash, fromPop = false) => {
    appliedRef.current = hash
    const r = parseHash(hash)
    if (r.n != null) {
      strippedRef.current = toHash({ ...r, n: null })
      replaceUrl(strippedRef.current)
    }
    setRoute(prev => {
      if (prev.book === r.book && prev.sec === r.sec && prev.n === r.n) return prev
      if (!fromPop && r.n == null && hash && hash === strippedRef.current && prev.book === r.book && prev.sec === r.sec) return prev
      return r
    })
  }, [])
  // Marşrutlaşdırıcının hash-i (popstate-də artıq emal olunubsa — təkrar etmə)
  useEffect(() => { if (appliedRef.current !== location.hash) applyHash(location.hash) }, [location.hash, applyHash])
  useEffect(() => {
    const onPop = () => applyHash(window.location.hash, true)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [applyHash])

  // Səhifə daxilində keçid: kitab/bölmə tarixçəyə yazılır; n — yalnız vəziyyətdə
  const go = useCallback((r) => {
    const next = { book: r.book || null, sec: r.sec ?? null, n: r.n ?? null }
    if (next.book && next.sec == null) {
      const secs = sectionsOf(next.book)
      if (secs.length === 1) next.sec = secs[0][0]
    }
    pushUrl(toHash({ ...next, n: null }))
    setRoute(next)
    setQ(''); setFilter('all'); setLimit(PAGE)
    requestAnimationFrame(() => {
      const el = mainRef.current
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
    })
  }, [])

  const book = route.book ? BOOK_BY_KEY.get(route.book) : null
  const bookData = route.book ? BOOK_DATA[route.book] : null
  const secs = useMemo(() => (route.book ? sectionsOf(route.book) : []), [route.book])
  const secIdx = route.sec != null ? secs.findIndex(s => s[0] === route.sec) : -1
  const secRow = secIdx >= 0 ? secs[secIdx] : null
  const single = secs.length === 1

  // Tərcümə nəşri: seçilmiş dil bu kitabda yoxdursa ingiliscə
  const eds = bookData?.editions || {}
  const trCode = trPref === '' ? '' : (eds[trPref] ? trPref : (eds.eng ? 'eng' : ''))
  const natural = NATURAL[lang]
  const showNoLang = !!route.book && trCode !== '' && natural && !eds[natural] && !(userPicked && trPref === trCode)

  // Bölmə yüklənməsi (ərəbcə + tərcümə)
  const dataKey = route.book && route.sec != null ? `${route.book}/${route.sec}/${trCode}` : ''
  useEffect(() => {
    if (!dataKey) return undefined
    const ac = new AbortController()
    setData(d => (d.key === dataKey && d.status === 'ok' ? d : { key: dataKey, status: 'loading', hadiths: [], trError: false, offline: false }))
    fetchSectionPair(route.book, route.sec, trCode, ac.signal)
      .then(res => { if (!ac.signal.aborted) setData({ key: dataKey, status: 'ok', hadiths: res.hadiths, trError: res.trError, offline: false }) })
      .catch(err => {
        if (ac.signal.aborted || err?.name === 'AbortError') return
        setData({ key: dataKey, status: 'error', hadiths: [], trError: false, offline: !!err?.offline || (typeof navigator !== 'undefined' && navigator.onLine === false) })
      })
    return () => ac.abort()
  }, [dataKey, reload]) // eslint-disable-line react-hooks/exhaustive-deps

  const ready = data.key === dataKey && data.status === 'ok'
  const hadiths = useMemo(() => (ready ? data.hadiths : []), [ready, data.hadiths])
  const sid = (n) => `${route.book}/${route.sec}/${n}`

  const searched = useMemo(() => {
    const s = norm(q.trim())
    if (!s) return hadiths
    return hadiths.filter(h => h.n === s || h.an === s || norm(h.ar).includes(s) || norm(h.tr).includes(s)
      || h.grades.some(g => norm(`${g.name} ${g.grade}`).includes(s)))
  }, [hadiths, q])
  const matches = useCallback((h, f) => (f === 'all' ? true : f === 'weak' ? hadithTone(h) !== '' : stars.has(`${route.book}/${route.sec}/${h.n}`)), [stars, route.book, route.sec])
  const list = useMemo(() => searched.filter(h => matches(h, filter)), [searched, filter, matches])
  const counts = useMemo(() => ({ all: searched.length, weak: searched.filter(h => matches(h, 'weak')).length, starred: searched.filter(h => matches(h, 'starred')).length }), [searched, matches])

  // Açıq hədis
  const cur = route.n != null && ready ? hadiths.find(h => h.n === route.n) || null : null
  const nav = cur && list.some(h => h.n === cur.n) ? list : hadiths
  const idx = cur ? nav.findIndex(h => h.n === cur.n) : -1
  useEffect(() => {
    if (!cur) return
    replaceUrl(toHash({ book: route.book, sec: route.sec, n: cur.n }))
    const v = { book: route.book, sec: route.sec, n: cur.n }
    writeJSON(LAST_KEY, v); setLast(v)
    // Kart siyahının görünməyən hissəsindədirsə — göstərilən sayı artır
    const i = list.findIndex(h => h.n === cur.n)
    if (i >= limit) setLimit(Math.ceil((i + 1) / PAGE) * PAGE)
  }, [cur?.n, route.book, route.sec]) // eslint-disable-line react-hooks/exhaustive-deps

  const openHadith = (n) => setRoute(r => ({ ...r, n }))
  const close = useCallback(() => {
    setFrom(null)
    setRoute(r => {
      if (r.n == null) return r
      const nr = { ...r, n: null }
      replaceUrl(toHash(nr))
      return nr
    })
    requestAnimationFrame(() => {
      const el = route.n != null ? document.getElementById(`hl-h-${String(route.n).replace('.', '-')}`) : null
      el?.scrollIntoView?.({ block: 'nearest' })
    })
  }, [route.n])
  const step = (d) => { const h = nav[idx + d]; if (h) { setRoute(r => ({ ...r, n: h.n })); setFlashKey('') } }

  const flash = (k) => { setFlashKey(k); setTimeout(() => setFlashKey(c => (c === k ? '' : c)), 1800) }
  const bookName = book ? pick(book.name, lang) : ''
  const secTitle = (s) => (s[0] === 0 && !s[1] ? L.noChapter : s[1])
  const secIsEn = (s) => !(s[0] === 0 && !s[1])
  const trMeta = trCode ? TRANSLATION_LANGS[trCode] : null
  const shareUrl = cur ? `${window.location.origin}${baseUrl()}${toHash({ book: route.book, sec: route.sec, n: cur.n })}` : ''
  const refLine = cur && secRow ? `${bookName} ${cur.n}${single ? '' : ` — ${L.section} ${secRow[0]}${secIsEn(secRow) ? `: ${secRow[1]}` : ''}`}` : ''
  const copy = async () => {
    if (!cur) return
    const grades = cur.grades.map(g => `${g.name}: ${g.grade}`).join('; ')
    if (await copyText([cur.ar, cur.tr, `— ${refLine}`, grades, shareUrl].filter(Boolean).join('\n\n'))) flash('copy')
  }
  const share = async () => {
    if (!cur) return
    const r = await shareOrCopy({ title: `${bookName} ${cur.n}`, text: [cur.ar, cur.tr].filter(Boolean).join('\n\n').slice(0, 900), url: shareUrl })
    if (r === 'copied') flash('share')
  }
  const changeTr = (v) => { setTrPref(v); setUserPicked(true); writeJSON(TR_KEY, v) }

  const filteredSecs = useMemo(() => {
    const s = norm(secQ.trim())
    if (!s) return secs
    return secs.filter(x => String(x[0]) === s || norm(secTitle(x)).includes(s))
  }, [secs, secQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const lastBook = last && BOOK_DATA[last.book] ? BOOK_BY_KEY.get(last.book) : null
  const favs = useMemo(() => stars.list.map(id => {
    const [b, s, n] = String(id).split('/')
    const bk = BOOK_BY_KEY.get(b)
    if (!bk || !/^\d+$/.test(s || '') || !n) return null
    const row = sectionsOf(b).find(x => x[0] === Number(s))
    return row ? { id, book: b, sec: Number(s), n, bk, row } : null
  }).filter(Boolean), [stars.list])

  const view = !route.book ? 'library' : (route.sec == null ? 'book' : 'section')

  const translationSelect = route.book && (
    <label className="hl-tr">
      <span className="hl-tr__label"><Icon name="globe" size={15} /> {L.trLabel}</span>
      <select className="ui-select ui-select--sm hl-tr__select" value={trCode} onChange={e => changeTr(e.target.value)} aria-label={L.trLabel}>
        <option value="">{L.arOnly}</option>
        {Object.keys(TRANSLATION_LANGS).filter(c => eds[c]).map(c => (
          <option key={c} value={c} lang={TRANSLATION_LANGS[c].lang}>{TRANSLATION_LANGS[c].name}</option>
        ))}
      </select>
    </label>
  )


  return (
    <ExpandableGroup id="hl-xc">
    <div className="hl-page">
      <header className={`ui-page-hero ui-page-hero--split hl-hero${route.book ? ' hl-hero--compact' : ''}`}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{L.eyebrow}</span>
            <h1 className="ui-display">{L.title}</h1>
            {!isAr && <p className="hl-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">مكتبة الحديث</p>}
            <p className="ui-lead">{L.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card hl-hero__card">
              <ul className="ui-page-hero__stats hl-hero__stats">
                <li><b className="ui-num"><NumberTicker value={BOOKS.length} lang={lang} /></b><span>{L.statBooks}</span></li>
                <li><b className="ui-num"><NumberTicker value={TOTAL_HADITHS} lang={lang} delay={0.08} /></b><span>{L.statHadiths}</span></li>
                <li><b className="ui-num"><NumberTicker value={ALL_LANGS.size} lang={lang} delay={0.16} /></b><span>{L.statLangs}</span></li>
              </ul>
              {lastBook && (
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm hl-hero__btn"
                  onClick={() => go({ book: last.book, sec: last.sec, n: last.n })}>
                  <Icon name="play" className="ui-btn__icon ui-flip-rtl" /> {L.cont} · {pick(lastBook.name, lang)} <span className="ui-num" dir="ltr">{last.n}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="ui-section ui-section--tight" ref={mainRef} id="hl-main">
        <div className="ui-container hl-layout">
          {/* Yol: Kitabxana › Kitab › Bölmə */}
          {view !== 'library' && (
            <nav className="hl-crumbs" aria-label={L.crumbs}>
              <ol>
                <li><button type="button" className="hl-crumbs__btn" onClick={() => go({})}><Icon name="books" size={15} /> {L.library}</button></li>
                <li aria-hidden="true" className="hl-crumbs__sep"><Icon name="chevron" size={14} className="ui-flip-rtl" /></li>
                {view === 'section' && !single ? (
                  <>
                    <li><button type="button" className="hl-crumbs__btn" onClick={() => go({ book: route.book })}>{bookName}</button></li>
                    <li aria-hidden="true" className="hl-crumbs__sep"><Icon name="chevron" size={14} className="ui-flip-rtl" /></li>
                    <li><span className="hl-crumbs__cur" aria-current="page">{L.section} <span className="ui-num">{secRow?.[0]}</span></span></li>
                  </>
                ) : (
                  <li><span className="hl-crumbs__cur" aria-current="page">{bookName}</span></li>
                )}
              </ol>
            </nav>
          )}

          {view === 'library' && (
            <>
              <div className="ui-section-head hl-head">
                <h2 className="ui-title ui-title--sm">{L.booksTitle}</h2>
                <p className="hl-head__lead">{L.booksLead}</p>
              </div>
              {/* v6.2: 3D kitab rəfi — qalınlıq hədis sayına görə, kitab açılır, bölmələr vərəqlənir */}
              <HadithShelf books={BOOKS} data={BOOK_DATA} lang={lang} onBook={(k) => go({ book: k })} onSection={(k, sec) => go({ book: k, sec })} />
              <ul className="hl-books">
                {BOOKS.map(b => {
                  const d = BOOK_DATA[b.key]
                  const langs = Object.keys(TRANSLATION_LANGS).filter(c => d.editions[c])
                  return (
                    <li key={b.key} className="ui-card hl-book">
                      <div className="hl-book__top">
                        <span className="ui-badge ui-badge--accent">{pick(b.kind, lang)}</span>
                        <span className="hl-book__ar ui-arabic" lang="ar" dir="rtl" aria-hidden={isAr ? 'true' : undefined}>{b.ar}</span>
                      </div>
                      <h3 className="hl-book__name">
                        <button type="button" className="hl-book__open" onClick={() => go({ book: b.key })}>{pick(b.name, lang)}</button>
                      </h3>
                      <p className="hl-book__author">{pick(b.author, lang)}</p>
                      <ul className="hl-book__stats">
                        <li><b className="ui-num">{fmt(d.total)}</b> {L.hadiths}</li>
                        {d.sections.length > 1 && <li><b className="ui-num">{d.sections.length}</b> {L.sections}</li>}
                      </ul>
                      <div className="hl-book__langs" aria-label={L.trLabel}>
                        {langs.map(c => <span key={c} className="hl-lang" title={TRANSLATION_LANGS[c].name} lang={TRANSLATION_LANGS[c].lang}>{TRANSLATION_LANGS[c].lang.toUpperCase()}</span>)}
                        <span className="hl-book__go" aria-hidden="true">{L.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></span>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* v5.6: kitabların həcmi + seçilmiş kitabın bölmə zolağı */}
              <HadithBooksChart books={BOOKS} data={BOOK_DATA} lang={lang} fmt={fmt}
                onOpen={(book, sec) => go(sec ? { book, sec } : { book })} />

              {favs.length > 0 && (
                <section className="hl-favs" aria-labelledby="hl-favs-h">
                  <h2 id="hl-favs-h" className="hl-favs__title"><Icon name="star" size={18} /> {L.favTitle} <span className="ui-badge ui-num">{favs.length}</span></h2>
                  <p className="hl-favs__lead">{L.favLead}</p>
                  <ul className="hl-favs__list">
                    {favs.map(f => (
                      <li key={f.id}>
                        <button type="button" className="ui-chip hl-fav" onClick={() => go({ book: f.book, sec: f.sec, n: f.n })}>
                          <Icon name="star" size={14} /> {pick(f.bk.name, lang)} <span className="ui-num" dir="ltr">{f.n}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {view !== 'library' && book && (
            <div className="ui-card hl-bookhead">
              <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
              <div className="hl-bookhead__main">
                <span className="ui-badge ui-badge--accent">{pick(book.kind, lang)}</span>
                <h2 className="hl-bookhead__name">{view === 'section' && !single ? (
                  <><span className="hl-bookhead__book">{bookName}</span>
                    <span className="hl-bookhead__sec" lang={secIsEn(secRow) && lang !== 'en' ? 'en' : undefined} dir={secIsEn(secRow) ? 'ltr' : undefined}>
                      <span className="ui-num" dir="ltr">{secRow[0]}.</span> {secTitle(secRow)}
                    </span></>
                ) : bookName}</h2>
                <p className="hl-bookhead__author">{pick(book.author, lang)}</p>
              </div>
              <p className="hl-bookhead__ar ui-arabic" lang="ar" dir="rtl">{book.ar}</p>
              <ul className="hl-bookhead__stats">
                {view === 'section' && secRow && secRow[2] > 0 && <li><span className="ui-num" dir="ltr">№ {secRow[2]}–{secRow[3]}</span></li>}
                {view === 'section' && ready && <li><b className="ui-num">{hadiths.length}</b> {L.hadiths}</li>}
                {view === 'book' && <li><b className="ui-num">{fmt(bookData.total)}</b> {L.hadiths}</li>}
                {view === 'book' && <li><b className="ui-num">{secs.length}</b> {L.sections}</li>}
              </ul>
            </div>
          )}

          {(view === 'book' || view === 'section') && showNoLang && (
            <p className="ui-callout ui-callout--note hl-note"><Icon name="globe" /> <span>{lang === 'az' ? L.noAz : L.noLang}</span></p>
          )}

          {view === 'book' && (
            <>
              <div className="hl-toolbar">
                <div className="ui-search hl-search">
                  <Icon name="search" />
                  <input className="ui-input" type="search" value={secQ} onChange={e => setSecQ(e.target.value)} placeholder={L.searchSections} aria-label={L.searchSections} enterKeyHint="search" />
                  {secQ && <button type="button" className="ui-search__clear" onClick={() => setSecQ('')} aria-label={L.clear} title={L.clear}><Icon name="close" /></button>}
                </div>
                {translationSelect}
                <span className="hl-toolbar__count ui-num" aria-live="polite">{filteredSecs.length} {L.sections}</span>
              </div>
              {filteredSecs.length === 0 ? (
                <div className="ui-empty ui-empty--card" role="status"><Icon name="search" /><strong>{L.none}</strong>
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setSecQ('')}><Icon name="refresh" className="ui-btn__icon" /> {L.reset}</button>
                </div>
              ) : (
                <ol className="hl-secs">
                  {filteredSecs.map(s => (
                    <li key={s[0]} className={`ui-card hl-sec${s[0] === 0 && !s[1] ? ' hl-sec--none' : ''}`}>
                      <span className="hl-sec__n ui-num" aria-hidden="true">{s[0] === 0 && !s[1] ? '·' : s[0]}</span>
                      <div className="hl-sec__body">
                        <h3 className="hl-sec__title">
                          <button type="button" className="hl-sec__open" onClick={() => go({ book: route.book, sec: s[0] })}
                            lang={secIsEn(s) && lang !== 'en' ? 'en' : undefined} dir={secIsEn(s) ? 'ltr' : undefined}>
                            {secTitle(s)}
                          </button>
                        </h3>
                        <p className="hl-sec__meta">
                          {s[2] > 0
                            ? <span className="ui-num" dir="ltr">№ {s[2]}–{s[3]}</span>
                            : <span><span className="ui-num">{s[4]}</span> {L.hadiths} · {L.noChapterHint}</span>}
                        </p>
                      </div>
                      <Icon name="chevron" size={16} className="hl-sec__chev ui-flip-rtl" />
                    </li>
                  ))}
                </ol>
              )}
              <p className="hl-small"><Icon name="info" size={14} /> {L.enTitles}</p>
            </>
          )}

          {view === 'section' && (
            <>
              <div className="hl-toolbar hl-toolbar--sticky">
                <div className="hl-toolbar__row">
                  <div className="ui-search hl-search">
                    <Icon name="search" />
                    <input className="ui-input" type="search" value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE) }} placeholder={L.searchHadith} aria-label={L.searchHadith} enterKeyHint="search" />
                    {q && <button type="button" className="ui-search__clear" onClick={() => setQ('')} aria-label={L.clear} title={L.clear}><Icon name="close" /></button>}
                  </div>
                  {translationSelect}
                </div>
                <div className="hl-toolbar__row">
                  <div className="ui-chips hl-filters" role="group" aria-label={L.filterLabel}>
                    {['all', 'weak', 'starred'].map(f => (
                      <button key={f} type="button" className="ui-chip" aria-pressed={filter === f} onClick={() => { setFilter(f); setLimit(PAGE) }} disabled={!ready}>
                        {f === 'starred' && <Icon name="star" size={14} />}
                        {f === 'all' ? L.all : f === 'weak' ? L.weak : L.starredF}
                        {ready && <span className="ui-chip__count ui-num">{counts[f]}</span>}
                      </button>
                    ))}
                  </div>
                  {ready && <span className="hl-toolbar__count ui-num" aria-live="polite">{list.length} {L.hadiths}</span>}
                </div>
              </div>

              {data.key === dataKey && data.status === 'error' ? (
                <div className="ui-empty ui-empty--card ui-empty--bad" role="alert">
                  <Icon name="alert" />
                  <strong>{L.errTitle}</strong>
                  <p>{data.offline ? L.offline : L.errText}</p>
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setReload(x => x + 1)}><Icon name="refresh" className="ui-btn__icon" /> {L.retry}</button>
                </div>
              ) : !ready ? (
                <div className="hl-grid" aria-busy="true">
                  <p className="ui-sr-only" role="status">{L.loading}</p>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="ui-card hl-skel" aria-hidden="true">
                      <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '30%' }} />
                      <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '95%' }} />
                      <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '80%' }} />
                      <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '60%' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {data.trError && <p className="ui-callout ui-callout--warn hl-note"><Icon name="alert" /> <span>{L.trFailed}</span></p>}
                  {list.length === 0 ? (
                    <div className="ui-empty ui-empty--card" role="status"><Icon name="search" /><strong>{L.none}</strong>
                      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setQ(''); setFilter('all') }}><Icon name="refresh" className="ui-btn__icon" /> {L.reset}</button>
                    </div>
                  ) : (
                    <ol className="hl-grid">
                      {list.slice(0, limit).map(h => {
                        const tone = hadithTone(h)
                        const on = stars.has(sid(h.n))
                        return (
                          <m.li layoutId={morphOn ? morphId(`hl-${h.n}`) : undefined} transition={SPRING.soft} data-wow-off=""
                            key={h.n} id={`hl-h-${h.n.replace('.', '-')}`} className={`ui-card hl-card${tone ? ` hl-card--${tone}` : ''}${route.n === h.n ? ' is-current' : ''}`}>
                            <div className="hl-card__top">
                              <span className="hl-card__n ui-num" dir="ltr">{h.n}</span>
                              {tone && <span className={`hl-tone hl-tone--${tone}`}><Icon name="alert" size={12} /> {tone === 'fab' ? L.fabMark : L.weakMark}</span>}
                              <StarButton on={on} onToggle={() => stars.toggle(sid(h.n))} label={`${on ? L.unstar : L.star}: ${bookName} ${h.n}`} className="hl-card__star" size={17} />
                            </div>
                            <p className="hl-card__ar ui-arabic" lang="ar" dir="rtl">{h.ar}</p>
                            {h.tr && trMeta && <p className="hl-card__tr" lang={trMeta.lang} dir={trMeta.dir}>{h.tr}</p>}
                            {h.grades.length > 0 && (
                              <ul className="hl-grades hl-grades--card" aria-label={L.grades}>
                                {h.grades.slice(0, 2).map((g, i) => <GradeChip key={i} g={g} />)}
                                {h.grades.length > 2 && <li className="hl-grade hl-grade--more ui-num" dir="ltr">+{h.grades.length - 2}</li>}
                              </ul>
                            )}
                            <button type="button" className="hl-card__open" onClick={() => { setFrom(h.n); openHadith(h.n) }}>
                              <span className="ui-sr-only">{bookName} {h.n}</span>
                              <span aria-hidden="true">{L.read} <Icon name="chevron" size={14} className="ui-flip-rtl" /></span>
                            </button>
                          </m.li>
                        )
                      })}
                    </ol>
                  )}
                  {list.length > limit && (
                    <div className="hl-more">
                      <span className="ui-num">{limit} / {list.length}</span> {L.shown}
                      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setLimit(x => x + PAGE)}>{L.showMore}</button>
                    </div>
                  )}
                </>
              )}

              {!single && (
                <div className="hl-secnav">
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={secIdx <= 0} onClick={() => go({ book: route.book, sec: secs[secIdx - 1][0] })}>
                    <Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" /> {L.prevSec}
                  </button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => go({ book: route.book })}>{L.backBook}</button>
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={secIdx < 0 || secIdx >= secs.length - 1} onClick={() => go({ book: route.book, sec: secs[secIdx + 1][0] })}>
                    {L.nextSec} <Icon name="chevron" className="ui-btn__icon ui-flip-rtl" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* v5.9: "Kitabxana rəqəmlərlə" — viz v2 bento (yalnız kitabxana görünüşündə) */}
      {view === 'library' && <HadithLibraryNumbers books={BOOKS} data={BOOK_DATA} lang={lang} onOpen={(book) => go({ book })} />}

      {/* Mənbə, lisenziya, zəif rəvayətlər haqqında qeyd */}
      <section className="ui-section ui-section--alt hl-about" aria-labelledby="hl-about-h">
        <div className="ui-container hl-layout">
          <div className="ui-section-head">
            <span className="ui-eyebrow">{L.aboutEyebrow}</span>
            <h2 id="hl-about-h" className="ui-title ui-title--sm">{L.aboutTitle}</h2>
          </div>
          <div className="hl-about__grid">
            <div className="ui-callout ui-callout--warn hl-weaknote">
              <Icon name="alert" />
              <div>
                <strong className="ui-callout__title">{L.weakNoteTitle}</strong>
                <p>{L.weakNote}</p>
                <ul className="hl-legend">
                  <li><span className="hl-grade hl-grade--weak" aria-hidden="true">●</span> {L.legendWeak}</li>
                  <li><span className="hl-grade hl-grade--fab" aria-hidden="true">●</span> {L.legendFab}</li>
                </ul>
              </div>
            </div>
            <div className="ui-card hl-src">
              <p className="hl-src__line">
                <Icon name="books" size={16} />
                <span>{L.dataLine}: <a href="https://github.com/fawazahmed0/hadith-api" target="_blank" rel="noopener noreferrer" lang="en" dir="ltr" style={{ textDecoration: 'underline' }}>fawazahmed0/hadith-api</a> (<span lang="en">Unlicense</span>) — {L.licenseNote}</span>
              </p>
              {route.book && trCode && (
                <p className="hl-src__line">
                  <Icon name="globe" size={16} />
                  <span>{L.trSources}: <span lang={trMeta.lang}>{trMeta.name}</span> · {(eds[trCode]?.[0]) ? <>{L.translator}: <span lang="en" dir="ltr">{eds[trCode][0]}</span></> : L.unknownTr}
                    {eds[trCode]?.[1] && <> · <a href={eds[trCode][1]} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">{eds[trCode][1].replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></>}
                    {' '}(<code lang="en" dir="ltr">{trCode}-{route.book}</code>)
                  </span>
                </p>
              )}
              <p className="hl-src__line"><Icon name="info" size={16} /> <span>{L.enTitles}</span></p>
            </div>
          </div>
        </div>
      </section>

      <ReaderDialog
        open={!!cur}
        onClose={close}
        onPrev={idx > 0 ? () => step(-1) : undefined}
        onNext={idx >= 0 && idx < nav.length - 1 ? () => step(1) : undefined}
        labelledBy="hl-reader-title"
        position={idx >= 0 ? `${idx + 1} / ${nav.length}` : null}
        contentKey={cur?.n}
        layoutId={morph}
        className="hl-reader"
        labels={{ close: L.close, prev: L.prev, next: L.next }}
        head={cur && (
          <>
            <span className="hl-card__n hl-card__n--solid ui-num" dir="ltr">{cur.n}</span>
            <span className="hl-reader__book">{bookName}</span>
          </>
        )}
        footer={cur && (
          <StarButton on={stars.has(sid(cur.n))} onToggle={() => stars.toggle(sid(cur.n))} label={stars.has(sid(cur.n)) ? L.unstar : L.star} />
        )}
      >
        {cur && (
          <div className="hl-read">
            <h2 id="hl-reader-title" className="hl-read__title">
              {bookName} <span className="ui-num" dir="ltr">{cur.n}</span>
              {!single && secRow && (
                <span className="hl-read__sec" lang={secIsEn(secRow) && lang !== 'en' ? 'en' : undefined} dir={secIsEn(secRow) ? 'ltr' : undefined}>
                  {secTitle(secRow)}
                </span>
              )}
            </h2>
            <p className="hl-read__ar ui-arabic" lang="ar" dir="rtl">{cur.ar}</p>
            {cur.tr && trMeta && <p className="hl-read__tr" lang={trMeta.lang} dir={trMeta.dir}>{cur.tr}</p>}
            {cur.grades.length > 0 && (
              <div className="hl-read__grades">
                <h3 className="hl-read__h"><Icon name="shield" size={15} /> {L.grades}</h3>
                <ul className="hl-grades">
                  {cur.grades.map((g, i) => <GradeChip key={i} g={g} />)}
                </ul>
                {hadithTone(cur) && <p className="hl-read__weak"><Icon name="info" size={14} /> {L.weakNote}</p>}
              </div>
            )}
            <p className="hl-read__ref">
              <Icon name="books" size={15} />
              <span>
                <strong>{L.ref}:</strong> {bookName}, <span className="ui-num" dir="ltr">{cur.n}</span>
                {cur.an && cur.an !== cur.n && <> · {L.arNum}: <span className="ui-num" dir="ltr">{cur.an}</span></>}
                {trMeta && <> · {L.trLabel}: <span lang={trMeta.lang}>{trMeta.name}</span>{eds[trCode]?.[0] && <> (<span lang="en" dir="ltr">{eds[trCode][0]}</span>)</>}</>}
              </span>
            </p>
            <div className="hl-read__actions">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copy}>
                <Icon name={flashKey === 'copy' ? 'check' : 'copy'} className="ui-btn__icon" /> {flashKey === 'copy' ? L.copied : L.copy}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={share}>
                <Icon name={flashKey === 'share' ? 'check' : 'share'} className="ui-btn__icon" /> {flashKey === 'share' ? L.copied : L.share}
              </button>
            </div>
            <p className="hl-read__src"><span lang="en" dir="ltr">Data: fawazahmed0/hadith-api (Unlicense)</span></p>
            <p className="hl-read__keys" aria-hidden="true">{L.keys}</p>
          </div>
        )}
      </ReaderDialog>
    </div>
    </ExpandableGroup>
  )
}

// Dərəcə çipi — "Al-Albani: Sahih", mənbədəki kimi (ingiliscə transliterasiya)
function GradeChip({ g }) {
  const tone = gradeTone(g.grade)
  return (
    <li className={`hl-grade${tone ? ` hl-grade--${tone}` : ''}`} lang="en" dir="ltr">
      <span className="hl-grade__name">{g.name}:</span> <b>{g.grade}</b>
    </li>
  )
}
