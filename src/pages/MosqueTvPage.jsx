// ═══════════════════════════════════════════════════════
// Məscid ekranı — /mosque-tv (məscid televizoru üçün tam ekran görünüş)
//
// • Böyük saat (seçilmiş şəhərin saat qurşağında), Qriqorian + hicri tarix,
//   5 namaz + günəş: AZAN və İQAMƏ, növbəti namaza geri sayım, indiki və
//   növbəti namaz vurğulanır; cümə günü xütbə vaxtı.
// • Hər ~20 saniyədə dəyişən panel: qısa ayə (ərəbcə + tərcümə) və
//   namazdan sonrakı zikrlər (Müslim 591, 597).
// • Azan vaxtı gələndə 2 dəqiqə sakit tam ekran "Azan vaxtı — <namaz>",
//   sonra "İqamə: mm:ss" geri sayımı. Səs YOXDUR (ayarlarda qısa siqnal —
//   susma ilə söndürülüb).
// • Ayarlar localStorage-da VƏ URL-də: ?city=Baku&iq=20,10,10,5,10&jumua=13:00
//   &name=…&lang=az&theme=dark&hidesec=1 — televizorda sadəcə link açılır.
//   ?compact=1 — iframe üçün yığcam görünüş (/widget səhifəsi), ?kiosk=1 —
//   idarəetmə düymələri gizli (S və ya Enter düyməsi ayarları açır).
// • Vaxtlar usePrayerTimes-dəndir (Azərbaycan — prayCalc, yerli hesab).
//   Saytdakı ortaq şəhər seçimi DƏYİŞMİR — ekranın öz şəhəri var.
// • Saf hesablama utils/iqamah.js-dədir (tests/unit/iqamah.test.js).
// Canlı varlıq təsviri yoxdur — yalnız xətti ikonlar və xatəm naxışı.
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import usePrayerTimes, { PRAYER_KEYS, PRAYER_NAMES, FARD, toMinutes } from '../hooks/usePrayerTimes'
import { PRAYER_CITIES, COUNTRY_NAMES, getPrayerLocation } from '../utils/prayerLocation'
import { METHOD_ABUBAKR } from '../utils/prayCalc'
import {
  IQAMAH_PRAYERS, DEFAULT_IQAMAH, computeIqamahTimes, findPhase, formatCountdown,
  mergeConfig, parseConfig, serializeConfig, hasConfigParams, parseIqamahRule, formatTime, parseTime,
} from '../utils/iqamah'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import '../styles/MosqueTvPage.css'
import '../styles/ToolsMotion.css'
import RollingDigits from '../components/prayer/RollingDigits'
import { pickUi } from '../utils/uiText'

const STORE_KEY = 'muslim_cc_mosque_tv'
const ROTATE_MS = 20000
const IDLE_MS = 5000

const LABELS = {
  az: {
    title: 'Məscid ekranı',
    next: 'Növbəti namaz', untilAdhan: 'azana qalıb', tomorrow: 'sabah',
    now: 'İndi', nextBadge: 'Növbəti',
    prayer: 'Namaz', adhan: 'Azan', iqamah: 'İqamə',
    jumua: 'Cümə', khutbah: 'Xütbə', jumuaLine: 'Cümə xütbəsi',
    adhanNow: 'Azan vaxtı',
    straighten: 'Səfləri düz və sıx tutun',
    straightenHadith: 'Səflərinizi düzəldin, çünki səfləri düzəltmək namazı lazımınca qılmağın bir hissəsidir.',
    straightenSrc: 'Buxari 723',
    silence: 'Telefonunuzu səssiz rejimə keçirin',
    adhkarTitle: 'Namazdan sonrakı zikrlər',
    x3: '3 dəfə', x33: 'hər biri 33 dəfə', complete: 'yüzü tamamlayır',
    adhkarSrc: 'Müslim 591, 597',
    verseSrc: 'Qurani-Kərim',
    settings: 'Ayarlar', close: 'Bağla',
    fullscreen: 'Tam ekran', exitFullscreen: 'Tam ekrandan çıx',
    mosqueName: 'Məscidin adı', city: 'Şəhər', language: 'Dil', theme: 'Rəng rejimi',
    light: 'İşıqlı', dark: 'Qaranlıq',
    iqTitle: 'İqamə vaxtları', iqHint: 'Azandan neçə dəqiqə sonra və ya sabit saat.',
    modeOffset: 'Dəqiqə sonra', modeFixed: 'Sabit saat', min: 'dəq',
    jumuaField: 'Cümə xütbəsinin vaxtı', jumuaHint: 'Boş qalsa, zöhr azanı göstərilir.',
    hideSec: 'Saniyələri gizlət',
    beep: 'Azan vaxtı qısa səs siqnalı', beepHint: 'Susma ilə söndürülüb.',
    link: 'Televizor üçün link',
    linkHint: 'Bu linki televizorun brauzerində açın — bütün ayarlar linkin içindədir.',
    copy: 'Kopyala', copied: 'Kopyalandı', open: 'Aç',
    back: 'Sayta qayıt', backShort: 'Geri', reset: 'Standart ayarlar',
    keysHint: 'Ayarları açmaq üçün düymə:',
    calc: 'Vaxtlar astronomik hesablanıb',
    loading: 'Namaz vaxtları yüklənir...',
    error: 'Namaz vaxtlarını yükləmək alınmadı.', retry: 'Yenidən cəhd et',
    hijriSuffix: 'H',
  },
  en: {
    title: 'Mosque display',
    next: 'Next prayer', untilAdhan: 'until adhan', tomorrow: 'tomorrow',
    now: 'Now', nextBadge: 'Next',
    prayer: 'Prayer', adhan: 'Adhan', iqamah: 'Iqamah',
    jumua: 'Jumu’ah', khutbah: 'Khutbah', jumuaLine: 'Friday khutbah',
    adhanNow: 'Time for adhan',
    straighten: 'Straighten the rows and stand close together',
    straightenHadith: 'Straighten your rows, for straightening the rows is part of establishing the prayer properly.',
    straightenSrc: 'Bukhari 723',
    silence: 'Please switch your phone to silent',
    adhkarTitle: 'Remembrance after the prayer',
    x3: '3 times', x33: '33 times each', complete: 'completes the hundred',
    adhkarSrc: 'Sahih Muslim 591, 597',
    verseSrc: 'Quran',
    settings: 'Settings', close: 'Close',
    fullscreen: 'Full screen', exitFullscreen: 'Exit full screen',
    mosqueName: 'Mosque name', city: 'City', language: 'Language', theme: 'Colour mode',
    light: 'Light', dark: 'Dark',
    iqTitle: 'Iqamah times', iqHint: 'Minutes after the adhan, or a fixed time.',
    modeOffset: 'Minutes after', modeFixed: 'Fixed time', min: 'min',
    jumuaField: 'Friday khutbah time', jumuaHint: 'If left empty, the Dhuhr adhan is shown.',
    hideSec: 'Hide seconds',
    beep: 'Short beep at adhan time', beepHint: 'Off by default.',
    link: 'Link for the TV',
    linkHint: 'Open this link in the TV browser — all settings are inside the link.',
    copy: 'Copy', copied: 'Copied', open: 'Open',
    back: 'Back to the site', backShort: 'Back', reset: 'Default settings',
    keysHint: 'Key to open settings:',
    calc: 'Times are astronomically calculated',
    loading: 'Loading prayer times...',
    error: 'Couldn’t load prayer times.', retry: 'Try again',
    hijriSuffix: 'AH',
  },
  ru: {
    title: 'Экран мечети',
    next: 'Следующий намаз', untilAdhan: 'до азана', tomorrow: 'завтра',
    now: 'Сейчас', nextBadge: 'Следующий',
    prayer: 'Намаз', adhan: 'Азан', iqamah: 'Икама',
    jumua: 'Джума', khutbah: 'Хутба', jumuaLine: 'Пятничная хутба',
    adhanNow: 'Время азана',
    straighten: 'Выравнивайте ряды и стойте плотно',
    straightenHadith: 'Выравнивайте ваши ряды, ибо выравнивание рядов — часть надлежащего совершения намаза.',
    straightenSrc: 'Бухари 723',
    silence: 'Переключите телефон в беззвучный режим',
    adhkarTitle: 'Зикры после намаза',
    x3: '3 раза', x33: 'по 33 раза', complete: 'завершает сотню',
    adhkarSrc: 'Муслим 591, 597',
    verseSrc: 'Коран',
    settings: 'Настройки', close: 'Закрыть',
    fullscreen: 'Во весь экран', exitFullscreen: 'Выйти из полноэкранного режима',
    mosqueName: 'Название мечети', city: 'Город', language: 'Язык', theme: 'Тема',
    light: 'Светлая', dark: 'Тёмная',
    iqTitle: 'Время икамы', iqHint: 'Через сколько минут после азана или в фиксированное время.',
    modeOffset: 'Минут после', modeFixed: 'Фиксированное время', min: 'мин',
    jumuaField: 'Время пятничной хутбы', jumuaHint: 'Если пусто, показывается азан зухра.',
    hideSec: 'Скрыть секунды',
    beep: 'Короткий звуковой сигнал во время азана', beepHint: 'По умолчанию выключен.',
    link: 'Ссылка для телевизора',
    linkHint: 'Откройте эту ссылку в браузере телевизора — все настройки уже в ней.',
    copy: 'Копировать', copied: 'Скопировано', open: 'Открыть',
    back: 'Вернуться на сайт', backShort: 'Назад', reset: 'Настройки по умолчанию',
    keysHint: 'Клавиша для открытия настроек:',
    calc: 'Время рассчитано астрономически',
    loading: 'Загрузка времени намаза...',
    error: 'Не удалось загрузить время намаза.', retry: 'Повторить',
    hijriSuffix: 'г. х.',
  },
  ar: {
    title: 'شاشة المسجد',
    next: 'الصلاة القادمة', untilAdhan: 'حتى الأذان', tomorrow: 'غدًا',
    now: 'الآن', nextBadge: 'التالية',
    prayer: 'الصلاة', adhan: 'الأذان', iqamah: 'الإقامة',
    jumua: 'الجمعة', khutbah: 'الخطبة', jumuaLine: 'خطبة الجمعة',
    adhanNow: 'وقت الأذان',
    straighten: 'سوّوا صفوفكم وتراصّوا',
    straightenHadith: 'سَوُّوا صُفُوفَكُمْ، فَإِنَّ تَسْوِيَةَ الصُّفُوفِ مِنْ إِقَامَةِ الصَّلَاةِ',
    straightenSrc: 'البخاري 723',
    silence: 'يرجى إغلاق صوت الهاتف',
    adhkarTitle: 'الأذكار بعد الصلاة',
    x3: '3 مرات', x33: '33 مرة لكل منها', complete: 'تمام المئة',
    adhkarSrc: 'صحيح مسلم 591، 597',
    verseSrc: 'القرآن الكريم',
    settings: 'الإعدادات', close: 'إغلاق',
    fullscreen: 'ملء الشاشة', exitFullscreen: 'الخروج من ملء الشاشة',
    mosqueName: 'اسم المسجد', city: 'المدينة', language: 'اللغة', theme: 'المظهر',
    light: 'فاتح', dark: 'داكن',
    iqTitle: 'أوقات الإقامة', iqHint: 'بعد الأذان بعدد من الدقائق أو في وقت ثابت.',
    modeOffset: 'دقائق بعد الأذان', modeFixed: 'وقت ثابت', min: 'د',
    jumuaField: 'وقت خطبة الجمعة', jumuaHint: 'إذا تُرك فارغًا يُعرض أذان الظهر.',
    hideSec: 'إخفاء الثواني',
    beep: 'تنبيه صوتي قصير عند الأذان', beepHint: 'معطّل افتراضيًا.',
    link: 'رابط للتلفاز',
    linkHint: 'افتح هذا الرابط في متصفح التلفاز — جميع الإعدادات موجودة فيه.',
    copy: 'نسخ', copied: 'تم النسخ', open: 'فتح',
    back: 'العودة إلى الموقع', backShort: 'رجوع', reset: 'الإعدادات الافتراضية',
    keysHint: 'زر فتح الإعدادات:',
    calc: 'الأوقات محسوبة فلكيًا',
    loading: 'جارٍ تحميل مواقيت الصلاة...',
    error: 'تعذّر تحميل مواقيت الصلاة.', retry: 'إعادة المحاولة',
    hijriSuffix: 'هـ',
  },
  tr: {
    title: 'Cami ekranı',
    next: 'Sıradaki namaz', untilAdhan: 'ezana kalan', tomorrow: 'yarın',
    now: 'Şimdi', nextBadge: 'Sıradaki',
    prayer: 'Namaz', adhan: 'Ezan', iqamah: 'Kamet',
    jumua: 'Cuma', khutbah: 'Hutbe', jumuaLine: 'Cuma hutbesi',
    adhanNow: 'Ezan vakti',
    straighten: 'Safları düz ve sık tutun',
    straightenHadith: 'Saflarınızı düzeltin; çünkü safları düzeltmek namazı gereği gibi kılmanın bir parçasıdır.',
    straightenSrc: 'Buhari 723',
    silence: 'Lütfen telefonunuzu sessize alın',
    adhkarTitle: 'Namazdan sonraki zikirler',
    x3: '3 kez', x33: 'her biri 33 kez', complete: 'yüzü tamamlar',
    adhkarSrc: 'Müslim 591, 597',
    verseSrc: 'Kur’an',
    settings: 'Ayarlar', close: 'Kapat',
    fullscreen: 'Tam ekran', exitFullscreen: 'Tam ekrandan çık',
    mosqueName: 'Caminin adı', city: 'Şehir', language: 'Dil', theme: 'Renk modu',
    light: 'Açık', dark: 'Koyu',
    iqTitle: 'Kamet vakitleri', iqHint: 'Ezandan kaç dakika sonra ya da sabit saat.',
    modeOffset: 'Dakika sonra', modeFixed: 'Sabit saat', min: 'dk',
    jumuaField: 'Cuma hutbesinin saati', jumuaHint: 'Boş bırakılırsa öğle ezanı gösterilir.',
    hideSec: 'Saniyeleri gizle',
    beep: 'Ezan vaktinde kısa sesli uyarı', beepHint: 'Varsayılan olarak kapalı.',
    link: 'Televizyon için bağlantı',
    linkHint: 'Bu bağlantıyı televizyonun tarayıcısında açın; tüm ayarlar bağlantının içinde.',
    copy: 'Kopyala', copied: 'Kopyalandı', open: 'Aç',
    back: 'Siteye dön', backShort: 'Geri', reset: 'Varsayılan ayarlar',
    keysHint: 'Ayarları açma tuşu:',
    calc: 'Vakitler astronomik olarak hesaplanmıştır',
    loading: 'Namaz vakitleri yükleniyor...',
    error: 'Namaz vakitleri yüklenemedi.', retry: 'Tekrar dene',
    hijriSuffix: 'H',
  },
}

const LANG_NAMES = { az: 'Azərbaycanca', en: 'English', ru: 'Русский', ar: 'العربية', tr: 'Türkçe' }

// ── Dönən panelin ayələri (qısa, namaz və zikr mövzusunda) ──
// Ərəbcə mətn Mədinə mushafının yazılışı ilə; ref — surə:ayə.
// friday: true — yalnız cümə günü göstərilir.
const VERSES = [
  { ref: '4:103', ar: 'إِنَّ ٱلصَّلَوٰةَ كَانَتْ عَلَى ٱلْمُؤْمِنِينَ كِتَـٰبًا مَّوْقُوتًا',
    text: { az: 'Həqiqətən, namaz möminlərə müəyyən vaxtlarda fərz edilmişdir.', en: 'Indeed, prayer has been decreed upon the believers at fixed times.', ru: 'Воистину, намаз предписан верующим в определённое время.', tr: 'Şüphesiz namaz, müminler üzerine vakitleri belirlenmiş bir farzdır.' } },
  { ref: '2:43', ar: 'وَأَقِيمُوا۟ ٱلصَّلَوٰةَ وَءَاتُوا۟ ٱلزَّكَوٰةَ وَٱرْكَعُوا۟ مَعَ ٱلرَّٰكِعِينَ',
    text: { az: 'Namazı qılın, zəkatı verin və rüku edənlərlə birlikdə rüku edin.', en: 'Establish prayer, give zakah, and bow with those who bow.', ru: 'Совершайте намаз, выплачивайте закят и кланяйтесь вместе с кланяющимися.', tr: 'Namazı kılın, zekâtı verin ve rükû edenlerle birlikte rükû edin.' } },
  { ref: '23:1–2', ar: 'قَدْ أَفْلَحَ ٱلْمُؤْمِنُونَ ۝ ٱلَّذِينَ هُمْ فِى صَلَاتِهِمْ خَـٰشِعُونَ',
    text: { az: 'Möminlər, həqiqətən, nicat tapdılar — o kəslər ki, namazlarında xuşu içindədirlər.', en: 'Successful indeed are the believers — those who are humble in their prayer.', ru: 'Воистину, преуспели верующие, которые смиренны во время своего намаза.', tr: 'Müminler gerçekten kurtuluşa ermiştir; onlar ki namazlarında huşû içindedirler.' } },
  { ref: '2:238', ar: 'حَـٰفِظُوا۟ عَلَى ٱلصَّلَوَٰتِ وَٱلصَّلَوٰةِ ٱلْوُسْطَىٰ وَقُومُوا۟ لِلَّهِ قَـٰنِتِينَ',
    text: { az: 'Namazları, xüsusilə orta namazı qoruyun və Allahın hüzurunda itaətlə durun.', en: 'Guard strictly the prayers, especially the middle prayer, and stand before Allah in devout obedience.', ru: 'Оберегайте намазы, особенно средний намаз, и стойте перед Аллахом смиренно.', tr: 'Namazlara ve orta namaza devam edin; Allah’ın huzurunda boyun eğerek durun.' } },
  { ref: '29:45', ar: 'إِنَّ ٱلصَّلَوٰةَ تَنْهَىٰ عَنِ ٱلْفَحْشَآءِ وَٱلْمُنكَرِ',
    text: { az: 'Həqiqətən, namaz çirkin əməllərdən və pis işlərdən çəkindirər.', en: 'Indeed, prayer prohibits immorality and wrongdoing.', ru: 'Воистину, намаз удерживает от мерзостей и предосудительного.', tr: 'Şüphesiz namaz, hayâsızlıktan ve kötülükten alıkoyar.' } },
  { ref: '20:14', ar: 'وَأَقِمِ ٱلصَّلَوٰةَ لِذِكْرِىٓ',
    text: { az: 'Məni zikr etmək üçün namaz qıl.', en: 'And establish prayer for My remembrance.', ru: 'Совершай намаз, чтобы поминать Меня.', tr: 'Beni anmak için namaz kıl.' } },
  { ref: '2:45', ar: 'وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ',
    text: { az: 'Səbr və namazla kömək diləyin.', en: 'And seek help through patience and prayer.', ru: 'Обращайтесь за помощью к терпению и намазу.', tr: 'Sabır ve namazla yardım dileyin.' } },
  { ref: '13:28', ar: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
    text: { az: 'Bilin ki, qəlblər Allahı zikr etməklə rahatlıq tapar.', en: 'Unquestionably, by the remembrance of Allah hearts find rest.', ru: 'Воистину, при поминании Аллаха успокаиваются сердца.', tr: 'Bilin ki kalpler ancak Allah’ı anmakla huzur bulur.' } },
  { ref: '62:9', friday: true, ar: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا نُودِىَ لِلصَّلَوٰةِ مِن يَوْمِ ٱلْجُمُعَةِ فَٱسْعَوْا۟ إِلَىٰ ذِكْرِ ٱللَّهِ وَذَرُوا۟ ٱلْبَيْعَ',
    text: { az: 'Ey iman gətirənlər! Cümə günü namaza çağırıldıqda Allahın zikrinə tələsin və alış-verişi buraxın.', en: 'O you who believe, when the call is made for the prayer on Friday, hasten to the remembrance of Allah and leave off trade.', ru: 'О те, которые уверовали! Когда призывают на намаз в пятницу, устремитесь к поминанию Аллаха и оставьте торговлю.', tr: 'Ey iman edenler! Cuma günü namaza çağrıldığında Allah’ı anmaya koşun ve alışverişi bırakın.' } },
]

// Namazdan sonrakı zikrlər: istiğfar ×3 + "Allahummə əntəs-sələm…" (Müslim 591),
// təsbih/təhmid/təkbir 33-dən + təhlil yüzü tamamlayır (Müslim 597)
const ADHKAR = [
  { ar: 'أَسْتَغْفِرُ اللَّهَ', count: 'x3' },
  { ar: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ' },
  { ar: 'سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ', count: 'x33' },
  { ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', count: 'complete' },
]

const HIJRI_MONTHS = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}

// Bəzi brauzerlərdə "az" lokalı yoxdur — tarix əl ilə (JamaatPage ilə eyni)
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const AZ_WEEKDAYS = ['bazar','bazar ertəsi','çərşənbə axşamı','çərşənbə','cümə axşamı','cümə','şənbə']
const LOCALES = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

const PRAYER_ICONS = { fajr: 'sunrise', sunrise: 'sun', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }

const pad2 = (n) => String(n).padStart(2, '0')
const CITY_BY_ID = new Map(PRAYER_CITIES.map(c => [c.id, c]))

// ── Saat (şəhərin saat qurşağında) ──
const fmtCache = new Map()
function clockIn(tz, epoch) {
  try {
    if (!fmtCache.has(tz)) {
      fmtCache.set(tz, new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hourCycle: 'h23', weekday: 'short',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    }
    const p = {}
    for (const x of fmtCache.get(tz).formatToParts(new Date(epoch))) p[x.type] = x.value
    const h = Number(p.hour) % 24
    return { h, m: Number(p.minute), s: Number(p.second), y: Number(p.year), mo: Number(p.month), d: Number(p.day), friday: p.weekday === 'Fri' }
  } catch {
    const d = new Date(epoch)
    return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds(), y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), friday: d.getDay() === 5 }
  }
}

function formatGregorian(c, lang) {
  const date = new Date(Date.UTC(c.y, c.mo - 1, c.d, 12))
  if (lang === 'az') return `${c.d} ${AZ_MONTHS[c.mo - 1]} ${c.y}, ${AZ_WEEKDAYS[date.getUTCDay()]}`
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
  try { return date.toLocaleDateString(LOCALES[lang] || 'en-GB', opts) } catch { return date.toLocaleDateString('en-GB', opts) }
}

/** Hicri tarix: aladhan cavabı, yoxdursa brauzerin Ümmül-Qura təqvimi. */
function formatHijri(hijri, c, lang, suffix) {
  let day = hijri?.day, month = Number(hijri?.month), year = hijri?.year
  if (!day || !month || !year) {
    try {
      const parts = {}
      const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
      for (const x of f.formatToParts(new Date(Date.UTC(c.y, c.mo - 1, c.d, 12)))) parts[x.type] = x.value
      day = parts.day; month = Number(parts.month); year = String(parts.year || '').replace(/\D/g, '')
    } catch { return '' }
  }
  const name = HIJRI_MONTHS[lang]?.[month - 1]
  return name && day && year ? `${Number(day)} ${name} ${year} ${suffix}` : ''
}

// ── Saxlama ──
function readStored() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {} } catch { return {} }
}
function writeStored(cfg) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)) } catch { /* yaddaş bağlıdır */ }
}

function locFor(cityId) {
  const c = CITY_BY_ID.get(cityId) || CITY_BY_ID.get('Baku')
  return {
    id: c.id, lat: c.lat, lng: c.lng, tz: c.tz,
    method: c.method || (c.country === 'AZ' ? METHOD_ABUBAKR : 13),
    city: c.label, country: c.country, isDefault: false, isCustom: false,
  }
}

/** Qısa, sakit səs siqnalı (yalnız ayarda açılıbsa). Alınmasa — susur. */
function beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 660
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.06)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1)
    o.connect(g).connect(ctx.destination)
    o.onended = () => { try { ctx.close() } catch { /* */ } }
    o.start()
    o.stop(ctx.currentTime + 1.2)
  } catch { /* səs bloklanıb */ }
}

// Icon.jsx-də dişli və "genişlət" yoxdur — eyni üslubda (24×24, yalnız xətt)
const svgProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const GearIcon = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)
const ExpandIcon = () => (
  <svg {...svgProps}>
    <path d="M8 3.5H5a1.5 1.5 0 0 0-1.5 1.5v3M16 3.5h3A1.5 1.5 0 0 1 20.5 5v3M8 20.5H5A1.5 1.5 0 0 1 3.5 19v-3M16 20.5h3a1.5 1.5 0 0 0 1.5-1.5v-3" />
  </svg>
)

// ═══════════════════════════════════════════════════════

export default function MosqueTvPage({ setPage }) {
  const { lang: siteLang } = useLang()

  // ── Ayarlar: standart ← saytın dili/şəhəri ← localStorage ← URL ──
  const initial = useMemo(() => {
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const url = parseConfig(search)
    let siteCity = 'Baku'
    try { const l = getPrayerLocation(); if (l && CITY_BY_ID.has(l.id)) siteCity = l.id } catch { /* */ }
    // Yığcam (iframe) görünüş yalnız URL-ə tabedir — saxlanmış TV ayarları qarışmasın
    const cfg = mergeConfig({ lang: siteLang, city: siteCity }, url.compact ? null : readStored(), url)
    if (!CITY_BY_ID.has(cfg.city)) cfg.city = siteCity
    return { cfg, compact: !!url.compact, kiosk: !!url.kiosk, urlDriven: hasConfigParams(search) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [cfg, setCfgState] = useState(initial.cfg)
  const { compact, kiosk } = initial

  const setCfg = useCallback((patch) => {
    setCfgState(prev => {
      const next = mergeConfig(prev, typeof patch === 'function' ? patch(prev) : patch)
      if (!CITY_BY_ID.has(next.city)) next.city = prev.city
      if (!compact) writeStored(next)
      // Link ilə açılıbsa ünvan da yenilənsin — səhifə yenilənəndə köhnə URL ayarı qaytarmasın
      if (initial.urlDriven) {
        try {
          const qs = serializeConfig(next, { compact, kiosk })
          window.history.replaceState(window.history.state, '', `${window.location.pathname}?${qs}`)
        } catch { /* */ }
      }
      return next
    })
  }, [compact, kiosk, initial.urlDriven])

  const lang = cfg.lang
  const l = pickUi(LABELS, lang)
  const name = (key) => PRAYER_NAMES[key]?.[lang] || key

  // ── Vaxtlar ──
  const loc = useMemo(() => locFor(cfg.city), [cfg.city])
  const { loading, error, hijri, prayers, next: hookNext, reload } = usePrayerTimes(loc)

  // ── Saniyəlik saat ──
  const [epoch, setEpoch] = useState(() => Date.now())
  useEffect(() => {
    let id
    const tick = () => {
      setEpoch(Date.now())
      id = setTimeout(tick, 1000 - (Date.now() % 1000) + 5)
    }
    id = setTimeout(tick, 1000 - (Date.now() % 1000) + 5)
    return () => clearTimeout(id)
  }, [])
  const c = clockIn(loc.tz, epoch)
  const nowSec = c.h * 3600 + c.m * 60 + c.s
  const isFriday = c.friday

  // ── Mövzu: <html data-theme>, səhifədən çıxanda bərpa ──
  useEffect(() => {
    const html = document.documentElement
    const prev = html.getAttribute('data-theme')
    html.setAttribute('data-theme', cfg.theme)
    return () => { if (prev == null) html.removeAttribute('data-theme'); else html.setAttribute('data-theme', prev) }
  }, [cfg.theme])

  // Altdakı sayt sürüşməsin (ekran tam örtür)
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => { html.style.overflow = prev }
  }, [])

  // ── Ekran sönməsin (Wake Lock; dəstəklənmirsə səssizcə keçir) ──
  useEffect(() => {
    let lock = null
    let alive = true
    const req = async () => {
      try {
        if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
        lock = await navigator.wakeLock.request('screen')
        if (!alive) { lock.release().catch(() => {}); lock = null }
      } catch { /* icazə yoxdur */ }
    }
    const onVis = () => { if (document.visibilityState === 'visible') req() }
    req()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVis)
      if (lock) lock.release().catch(() => {})
    }
  }, [])

  // ── Tam ekran ──
  const rootRef = useRef(null)
  const [isFs, setIsFs] = useState(false)
  useEffect(() => {
    const on = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFs = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.()
      else rootRef.current?.requestFullscreen?.()?.catch?.(() => {})
    } catch { /* dəstəklənmir */ }
  }
  const fsSupported = typeof document !== 'undefined' && !!document.fullscreenEnabled

  // ── İdarəetmə düymələri: hərəkətsizlikdə gizlənir; kiosk-da yalnız düymə ilə ──
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(!kiosk)
  useEffect(() => {
    let t
    const show = () => {
      if (kiosk) return
      setControlsVisible(true)
      clearTimeout(t)
      t = setTimeout(() => setControlsVisible(false), IDLE_MS)
    }
    const onKey = (e) => {
      if (e.target?.closest?.('input, select, textarea')) return
      if (e.key === 's' || e.key === 'S' || (kiosk && e.key === 'Enter')) { setSettingsOpen(true); return }
      show()
    }
    show()
    window.addEventListener('pointermove', show)
    window.addEventListener('pointerdown', show)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointermove', show)
      window.removeEventListener('pointerdown', show)
      window.removeEventListener('keydown', onKey)
    }
  }, [kiosk])

  // ── İqamə vaxtları ──
  const adhanOf = useMemo(() => Object.fromEntries(prayers.map(p => [p.key, p.adhan])), [prayers])
  const iqamah = useMemo(() => computeIqamahTimes(adhanOf, cfg.iq), [adhanOf, cfg.iq])
  // Cümə günü zöhr sətrində iqamə əvəzinə xütbə vaxtı
  const jumuaTime = isFriday && adhanOf.dhuhr ? (cfg.jumua || adhanOf.dhuhr) : ''
  const iqamahFor = (key) => (key === 'dhuhr' && jumuaTime ? jumuaTime : iqamah[key] || '')

  const fardList = useMemo(
    () => FARD.filter(k => adhanOf[k]).map(k => ({ key: k, adhan: adhanOf[k], iqamah: k === 'dhuhr' && jumuaTime ? jumuaTime : iqamah[k] })),
    [adhanOf, iqamah, jumuaTime],
  )

  // ── Növbəti və indiki namaz (saniyə dəqiqliyi ilə) ──
  let next = null
  for (const p of fardList) {
    const a = toMinutes(p.adhan)
    if (a != null && a * 60 > nowSec) { next = { key: p.key, adhan: p.adhan, inSec: a * 60 - nowSec, tomorrow: false }; break }
  }
  if (!next && fardList.length) {
    const fajr = hookNext?.tomorrow ? hookNext.adhan : adhanOf.fajr
    const a = toMinutes(fajr)
    if (a != null) next = { key: 'fajr', adhan: fajr, inSec: 86400 - nowSec + a * 60, tomorrow: true }
  }
  let current = null
  for (const p of fardList) {
    const a = toMinutes(p.adhan)
    if (a != null && a * 60 <= nowSec) current = p.key
  }
  // Günəş çıxandan sonra sübh vaxtı bitib
  const sunriseMin = toMinutes(adhanOf.sunrise)
  if (current === 'fajr' && sunriseMin != null && nowSec >= sunriseMin * 60) current = null

  // ── Tam ekran vəziyyəti (azan → iqamə) ──
  const phase = compact ? null : findPhase(nowSec, fardList)
  const phaseSig = phase ? `${c.y}-${c.mo}-${c.d}-${phase.key}` : ''
  const beeped = useRef('')
  useEffect(() => {
    if (!phase || phase.phase !== 'adhan' || !cfg.beep) return
    if (beeped.current === phaseSig) return
    beeped.current = phaseSig
    beep()
  }, [phase, phaseSig, cfg.beep])

  // ── Dönən panel ──
  const slides = useMemo(() => {
    const verses = VERSES.filter(v => !v.friday || isFriday)
    if (isFriday) verses.sort((a, b) => (b.friday ? 1 : 0) - (a.friday ? 1 : 0))
    const out = []
    verses.forEach((v, i) => {
      out.push({ type: 'verse', v })
      if (i % 3 === 2) out.push({ type: 'adhkar' })
    })
    if (!out.some(s => s.type === 'adhkar')) out.push({ type: 'adhkar' })
    return out
  }, [isFriday])
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSlide(s => s + 1), ROTATE_MS)
    return () => clearInterval(id)
  }, [])
  const current_slide = slides[slide % slides.length]

  // ── Görünüş ──
  const gregorian = formatGregorian(c, lang)
  const hijriStr = formatHijri(hijri, c, lang, l.hijriSuffix)
  const cityName = loc.city?.[lang] || loc.city?.en || loc.id
  const timeStr = `${pad2(c.h)}:${pad2(c.m)}`
  const countdown = next ? formatCountdown(next.inSec) : ''
  // Saniyəsiz: s:dd (dəqiqə yuxarı yuvarlaqlaşdırılır)
  const countdownShown = cfg.hideSeconds && next
    ? (() => { const m = Math.ceil(next.inSec / 60); return `${Math.floor(m / 60)}:${pad2(m % 60)}` })()
    : countdown
  const hasData = prayers.length > 0

  const goBack = (e) => {
    if (setPage) { e.preventDefault(); setPage('home') }
  }
  // Yuxarıdakı "Geri": tarixçə varsa bir addım geri, yoxsa (link birbaşa
  // açılıb, iframe) ana səhifə. React Router hər girişə idx yazır.
  const navigate = useNavigate()
  const stepBack = (e) => {
    e.preventDefault()
    const idx = typeof window !== 'undefined' ? window.history.state?.idx : 0
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else if (setPage) setPage('home')
    else navigate(pathFor('home', siteLang))
  }
  // Tam ekranda və kiosk rejimində (televizor) gizlidir; iframe vidjetində (compact) yoxdur
  const showBack = !compact && !kiosk && !isFs

  // Portal: <main class="page-enter"> animasiyadan sonra da transform saxlayır və
  // saytın başlıq boşluğu (padding) var — position:fixed ekran ona görə 64px
  // aşağı sürüşüb altdan kəsilirdi. document.body-yə çıxarılır.
  const screen = (
    <div
      ref={rootRef}
      className={`mtv${compact ? ' mtv--compact' : ''}${controlsVisible || settingsOpen ? '' : ' mtv--idle'}`}
      lang={lang}
      dir={document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'}
    >
      <div className="ui-pattern mtv-pattern" aria-hidden="true" />
      <div className="mtv-ambient" aria-hidden="true"><span /><span /></div>

      {/* ── Başlıq: məscid/şəhər | tarix | düymələr ── */}
      <header className="mtv-top">
        {showBack && (
          <a className="mtv-back" href={pathFor('home', siteLang)} onClick={stepBack} aria-label={l.backShort} title={l.back}>
            <Icon name="chevronLeft" size={20} className="ui-flip-rtl" />
            <span className="mtv-back-text">{l.backShort}</span>
          </a>
        )}
        <div className="mtv-id">
          <h1 className="mtv-name">{cfg.name || l.title}</h1>
          <p className="mtv-city"><Icon name="pin" size={18} /> {cityName}</p>
        </div>
        <div className="mtv-dates">
          <span className="mtv-greg">{gregorian}</span>
          {hijriStr && <span className="mtv-hijri"><Icon name="moon" size={16} /> {hijriStr}</span>}
        </div>
        {!compact && (
          <div className="mtv-tools" aria-hidden={!controlsVisible && !settingsOpen ? 'true' : undefined}>
            {fsSupported && (
              <button type="button" className="ui-icon-btn mtv-tool" onClick={toggleFs}
                aria-label={isFs ? l.exitFullscreen : l.fullscreen} title={isFs ? l.exitFullscreen : l.fullscreen}
                tabIndex={controlsVisible ? 0 : -1}>
                {isFs ? <Icon name="close" /> : <ExpandIcon />}
              </button>
            )}
            <button type="button" className="ui-icon-btn mtv-tool" onClick={() => setSettingsOpen(true)}
              aria-label={l.settings} title={l.settings} aria-expanded={settingsOpen}
              tabIndex={controlsVisible ? 0 : -1}>
              <GearIcon />
            </button>
          </div>
        )}
      </header>

      {/* ── Saat + növbəti namaz | dönən panel ── */}
      <section className="mtv-main">
        <div className="mtv-clockbox">
          <div className="mtv-clock ui-num" aria-live="off">
            {timeStr}{!cfg.hideSeconds && <span className="mtv-sec">:<RollingDigits value={pad2(c.s)} /></span>}
          </div>
          {next && (
            <div className="mtv-next" role="timer" aria-label={`${l.next}: ${name(next.key)} ${next.adhan}`}>
              <span className="mtv-next-label">
                {l.next}{next.tomorrow && <span className="mtv-tag">{l.tomorrow}</span>}
              </span>
              <span className="mtv-next-name">
                <Icon name={PRAYER_ICONS[next.key]} size={28} /> {isFriday && next.key === 'dhuhr' && !next.tomorrow ? l.jumua : name(next.key)}
              </span>
              <span className="mtv-next-count ui-num"><RollingDigits value={countdownShown} /></span>
              <span className="mtv-next-caption">{l.untilAdhan}</span>
            </div>
          )}
          {isFriday && jumuaTime && !compact && (
            <p className="mtv-jumua"><Icon name="mic" size={20} /> {l.jumuaLine}: <strong className="ui-num">{jumuaTime}</strong></p>
          )}
        </div>

        {!compact && current_slide && (
          <div className="mtv-panel" aria-live="polite">
            <div className="mtv-slide" key={slide}>
              {current_slide.type === 'verse' ? (
                <figure className="mtv-verse">
                  <p className="mtv-ar ui-arabic" lang="ar" dir="rtl">{current_slide.v.ar}</p>
                  {lang !== 'ar' && <p className="mtv-tr">{pickUi(current_slide.v.text, lang, 'en')}</p>}
                  <figcaption className="mtv-src">{l.verseSrc}, <span className="ui-num">{current_slide.v.ref}</span></figcaption>
                </figure>
              ) : (
                <div className="mtv-adhkar">
                  <h2 className="mtv-panel-title">{l.adhkarTitle}</h2>
                  <ol className="mtv-adhkar-list">
                    {ADHKAR.map((a, i) => (
                      <li key={i}>
                        <span className="mtv-adhkar-ar ui-arabic" lang="ar" dir="rtl">{a.ar}</span>
                        {a.count && <span className="mtv-adhkar-count">{l[a.count]}</span>}
                      </li>
                    ))}
                  </ol>
                  <p className="mtv-src">{l.adhkarSrc}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── 6 vaxt: azan + iqamə ── */}
      <section className="mtv-times" aria-label={l.adhan}>
        {loading && !hasData && <p className="mtv-state" role="status">{l.loading}</p>}
        {!loading && error && !hasData && (
          <div className="mtv-state" role="alert">
            <p>{l.error}</p>
            <button type="button" className="ui-btn ui-btn--primary" onClick={reload}><Icon name="refresh" className="ui-btn__icon" /> {l.retry}</button>
          </div>
        )}
        {hasData && (
          <ol className="mtv-grid">
            {PRAYER_KEYS.map(key => {
              const isNext = next && !next.tomorrow && next.key === key
              const isCur = current === key && !isNext
              const isJumua = isFriday && key === 'dhuhr'
              const iq = key === 'sunrise' ? '' : iqamahFor(key)
              return (
                <li key={key}
                  className={`mtv-cell${isNext ? ' is-next' : ''}${isCur ? ' is-current' : ''}${key === 'sunrise' ? ' is-sunrise' : ''}`}
                  aria-current={isCur ? 'time' : undefined}>
                  <span className="mtv-cell-name">
                    <Icon name={PRAYER_ICONS[key]} size={22} />
                    {isJumua ? l.jumua : name(key)}
                  </span>
                  {(isNext || isCur) && <span className="mtv-cell-badge">{isNext ? l.nextBadge : l.now}</span>}
                  <span className="mtv-cell-adhan ui-num">{key !== 'sunrise' && <small>{l.adhan}</small>}{adhanOf[key]}</span>
                  <span className="mtv-cell-iq ui-num">
                    <small>{isJumua && jumuaTime ? l.khutbah : l.iqamah}</small>{iq || '—'}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
        {!compact && hasData && <p className="mtv-foot">{l.calc} · <span className="mtv-brand">Muslims.cc</span></p>}
        {compact && hasData && (
          <a className="mtv-foot mtv-brand" href="https://muslims.cc" target="_blank" rel="noopener noreferrer">Muslims.cc</a>
        )}
      </section>

      {/* ── Tam ekran: azan vaxtı → iqamə geri sayımı ── */}
      {phase && (
        <div className={`mtv-overlay mtv-overlay--${phase.phase}`} role="status" aria-live="assertive">
          <div className="ui-pattern ui-pattern--fade mtv-overlay-pattern" aria-hidden="true" />
          {phase.phase === 'adhan' ? (
            <>
              <p className="mtv-ov-eyebrow">{l.adhanNow}</p>
              <p className="mtv-ov-title">{isFriday && phase.key === 'dhuhr' ? l.jumua : name(phase.key)}</p>
              <p className="mtv-ov-time ui-num">{adhanOf[phase.key]}</p>
            </>
          ) : (
            <>
              <p className="mtv-ov-eyebrow">{name(phase.key)}</p>
              <p className="mtv-ov-title">
                {isFriday && phase.key === 'dhuhr' && jumuaTime ? l.khutbah : l.iqamah}:{' '}
                <span className="ui-num">{formatCountdown(phase.remaining)}</span>
              </p>
              <p className="mtv-ov-line">{l.straighten}</p>
              <figure className="mtv-ov-hadith">
                <blockquote>{l.straightenHadith}</blockquote>
                <figcaption>{l.straightenSrc}</figcaption>
              </figure>
              <p className="mtv-ov-silence"><Icon name="bellOff" size={22} /> {l.silence}</p>
            </>
          )}
        </div>
      )}

      {settingsOpen && (
        <Settings
          cfg={cfg} setCfg={setCfg} l={l} lang={lang} adhanOf={adhanOf}
          onClose={() => setSettingsOpen(false)} goBack={goBack}
        />
      )}
    </div>
  )
  return typeof document !== 'undefined' && document.body ? createPortal(screen, document.body) : screen
}

// ═══ Ayarlar paneli ═══════════════════════════════════

function Settings({ cfg, setCfg, l, lang, adhanOf, onClose, goBack }) {
  const panelRef = useRef(null)
  const [copied, setCopied] = useState(false)

  // Valideyn hər saniyə yenidən çəkilir (saat) — onClose hər dəfə yeni funksiyadır.
  // Ref ilə saxlanılır ki, fokus effekti yalnız açılanda bir dəfə işləsin.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const prevFocus = document.activeElement
    panelRef.current?.querySelector('input, select, button')?.focus()
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      try { prevFocus?.focus?.() } catch { /* */ }
    }
  }, [])

  const groups = useMemo(() => {
    const map = new Map()
    for (const c of PRAYER_CITIES) {
      if (!map.has(c.country)) map.set(c.country, [])
      map.get(c.country).push(c)
    }
    return [...map.entries()]
  }, [])

  const link = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}${window.location.pathname}?${serializeConfig(cfg)}`
  }, [cfg])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* */ }
  }

  const setRule = (i, v) => setCfg(prev => {
    const iq = prev.iq.slice()
    iq[i] = v
    return { iq }
  })
  const setMode = (i, mode) => {
    if (mode === 'fixed') {
      const key = IQAMAH_PRAYERS[i]
      const a = parseTime(adhanOf[key])
      setRule(i, a == null ? '13:00' : formatTime(a + DEFAULT_IQAMAH[i]))
    } else {
      setRule(i, DEFAULT_IQAMAH[i])
    }
  }

  return (
    <div className="mtv-settings-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mtv-settings" role="dialog" aria-modal="true" aria-labelledby="mtv-settings-title" ref={panelRef}>
        <div className="mtv-settings-head">
          <h2 id="mtv-settings-title" className="mtv-settings-title">{l.settings}</h2>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label={l.close}><Icon name="close" /></button>
        </div>

        <div className="mtv-settings-body">
          <label className="ui-field">
            <span className="ui-field__label">{l.mosqueName}</span>
            <input className="ui-input" type="text" maxLength={80} value={cfg.name}
              onChange={(e) => setCfg({ name: e.target.value })} placeholder={l.title} />
          </label>

          <label className="ui-field">
            <span className="ui-field__label">{l.city}</span>
            <select className="ui-select" value={cfg.city} onChange={(e) => setCfg({ city: e.target.value })}>
              {groups.map(([cc, list]) => (
                <optgroup key={cc} label={COUNTRY_NAMES[cc]?.[lang] || cc}>
                  {list.map(c => <option key={c.id} value={c.id}>{pickUi(c.label, lang, 'en')}</option>)}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="ui-field">
            <span className="ui-field__label" id="mtv-lang-l">{l.language}</span>
            <div className="mtv-chips" role="group" aria-labelledby="mtv-lang-l">
              {Object.keys(LANG_NAMES).map(code => (
                <button key={code} type="button" className="ui-chip" aria-pressed={cfg.lang === code}
                  lang={code} onClick={() => setCfg({ lang: code })}>{LANG_NAMES[code]}</button>
              ))}
            </div>
          </div>

          <div className="ui-field">
            <span className="ui-field__label" id="mtv-theme-l">{l.theme}</span>
            <div className="mtv-chips" role="group" aria-labelledby="mtv-theme-l">
              <button type="button" className="ui-chip" aria-pressed={cfg.theme === 'light'} onClick={() => setCfg({ theme: 'light' })}>
                <Icon name="sun" size={16} /> {l.light}
              </button>
              <button type="button" className="ui-chip" aria-pressed={cfg.theme === 'dark'} onClick={() => setCfg({ theme: 'dark' })}>
                <Icon name="moon" size={16} /> {l.dark}
              </button>
            </div>
          </div>

          <fieldset className="mtv-fieldset">
            <legend className="ui-field__label">{l.iqTitle}</legend>
            <p className="ui-field__hint">{l.iqHint}</p>
            {IQAMAH_PRAYERS.map((key, i) => {
              const rule = parseIqamahRule(cfg.iq[i])
              const fixed = typeof rule === 'string'
              const pname = PRAYER_NAMES[key]?.[lang] || key
              return (
                <div className="mtv-iq-row" key={key}>
                  <span className="mtv-iq-name">{pname}</span>
                  <select className="ui-select mtv-iq-mode" value={fixed ? 'fixed' : 'offset'}
                    aria-label={`${pname}: ${l.iqTitle}`} onChange={(e) => setMode(i, e.target.value)}>
                    <option value="offset">{l.modeOffset}</option>
                    <option value="fixed">{l.modeFixed}</option>
                  </select>
                  {fixed ? (
                    <input className="ui-input mtv-iq-val" type="time" value={rule} aria-label={`${pname}: ${l.modeFixed}`}
                      onChange={(e) => { if (parseTime(e.target.value) != null) setRule(i, e.target.value) }} />
                  ) : (
                    <span className="mtv-iq-min">
                      <input className="ui-input mtv-iq-val" type="number" min={0} max={180} step={1} inputMode="numeric"
                        value={rule ?? DEFAULT_IQAMAH[i]} aria-label={`${pname}: ${l.modeOffset}`}
                        onChange={(e) => {
                          const n = Math.max(0, Math.min(180, Math.round(Number(e.target.value) || 0)))
                          setRule(i, n)
                        }} />
                      <span>{l.min}</span>
                    </span>
                  )}
                </div>
              )
            })}
          </fieldset>

          <label className="ui-field">
            <span className="ui-field__label">{l.jumuaField}</span>
            <input className="ui-input" type="time" value={cfg.jumua}
              onChange={(e) => setCfg({ jumua: e.target.value })} />
            <span className="ui-field__hint">{l.jumuaHint}</span>
          </label>

          <label className="mtv-check">
            <input type="checkbox" checked={cfg.hideSeconds} onChange={(e) => setCfg({ hideSeconds: e.target.checked })} />
            <span>{l.hideSec}</span>
          </label>
          <label className="mtv-check">
            <input type="checkbox" checked={cfg.beep} onChange={(e) => setCfg({ beep: e.target.checked })} />
            <span>{l.beep}<small className="ui-field__hint"> — {l.beepHint}</small></span>
          </label>

          <div className="ui-field">
            <span className="ui-field__label">{l.link}</span>
            <div className="mtv-link-row">
              <input className="ui-input mtv-link" type="text" readOnly value={link} dir="ltr"
                onFocus={(e) => e.target.select()} aria-label={l.link} />
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={copy}>
                <Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" /> {copied ? l.copied : l.copy}
              </button>
            </div>
            <span className="ui-field__hint">{l.linkHint}</span>
          </div>

          <p className="ui-field__hint">{l.keysHint} <kbd className="ui-kbd">S</kbd></p>
        </div>

        <div className="mtv-settings-foot">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm"
            onClick={() => setCfg({ iq: DEFAULT_IQAMAH.slice(), jumua: '', hideSeconds: false, beep: false })}>
            <Icon name="refresh" className="ui-btn__icon" /> {l.reset}
          </button>
          <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('home', lang)} onClick={goBack}>
            <Icon name="home" className="ui-btn__icon" /> {l.back}
          </a>
        </div>
      </div>
    </div>
  )
}
