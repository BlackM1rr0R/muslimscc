import { useState, useMemo, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import {
  gregorianToHijri, hijriToGregorian, hijriMonthLength, hijriMonthGrid, shiftHijriMonth,
  parseGKey, gKey, fromLocalDate, gDiffDays, isValidGregorian, isApproximate, hasUmmAlQura, formatHijri, formatGregorian, weekdayName,
  HIJRI_MONTHS, HIJRI_MONTHS_AR, HIJRI_MONTHS_TRANSLIT, WEEKDAYS_SHORT, G_MONTHS_SHORT,
  MIN_H_YEAR, MAX_H_YEAR, MIN_G_YEAR, MAX_G_YEAR,
} from '../utils/hijri'
import { BarChart, ChartFigure, ColumnChart, ProgressRing } from '../components/viz'
import RelatedLinks from '../components/prayer/RelatedLinks'
import '../styles/HijriPage.css'
import '../styles/ToolsMotion.css'
import { ringFrom } from '../components/prayer/ringFrom'

// ═══════════════════════════════════════════════════════
// /hijri-converter — Hicri tarix çevirici
//
// Miladi ↔ hicri hər iki istiqamətdə, bugünkü hicri tarix, hicri ayın
// miladi tarixlərlə şəbəkəsi və 12 ayın adları (ərəbcə + transliterasiya).
// Hesab utils/hijri.js-dədir (Intl 'islamic-umalqura' — /calendar ilə eyni).
// Qeyd: ay başlanğıcı hilalın görülməsi ilə müəyyən olunur (Muslim 1081 —
// hadith-api ara-muslim 1081.01 ilə yoxlanılıb); Ümmül-Qura hesablanmış
// təqvimdir və yerli elandan bir gün fərqlənə bilər.
// ═══════════════════════════════════════════════════════

const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''))
// Həftənin ilk günü: ərəbcədə şənbə, qalan dillərdə bazar ertəsi
const FIRST_DOW = { ar: 6 }

const SIGHTING_AR = 'إِذَا رَأَيْتُمُ الْهِلَالَ فَصُومُوا، وَإِذَا رَأَيْتُمُوهُ فَأَفْطِرُوا، فَإِنْ غُمَّ عَلَيْكُمْ فَصُومُوا ثَلَاثِينَ يَوْمًا'

const LABELS = {
  az: {
    title: 'Hicri tarix çevirici',
    lead: 'Miladi tarixi hicriyə və hicri tarixi miladiyə çevirin, hicri ayın günlərini miladi tarixlərlə birlikdə görün.',
    todayTitle: 'Bu gün',
    convTitle: 'Çevirici', dirGroup: 'Çevirmə istiqaməti', toHijri: 'Miladi → Hicri', toGreg: 'Hicri → Miladi', swap: 'İstiqaməti dəyiş',
    gDate: 'Miladi tarix', hDay: 'Gün', hMonth: 'Ay', hYear: 'Hicri il',
    resultTitle: 'Nəticə', weekday: 'Həftənin günü', hijri: 'Hicri', gregorian: 'Miladi', monthAr: 'Ayın ərəbcə adı',
    noDay: 'Bu tarix yoxdur: {m} {y} ayı {n} gündür.', badG: 'Tarixi {a}–{b}-ci illər aralığında seçin.',
    badH: 'Hicri ili {a}–{b} aralığında yazın.', beforeHijra: 'Bu tarix hicrətdən əvvəldir.',
    approx: 'Bu il Ümmül-Qura cədvəlindən kənardadır — nəticə hesab yolu ilə (təxmini) tapılıb.',
    noIntl: 'Brauzeriniz Ümmül-Qura təqvimini dəstəkləmir — nəticə hesab yolu ilə tapılıb və 1–2 gün fərqlənə bilər.',
    julianNote: '1582-ci ildən əvvəlki tarixlər qriqorian təqvimi ilə (geriyə uzadılmış) göstərilir.',
    showMonth: 'Ayı şəbəkədə göstər',
    gridTitle: 'Hicri ay', prevMonth: 'Əvvəlki ay', nextMonth: 'Növbəti ay', thisMonth: 'Bu ay',
    monthDays: '{n} gün', range: '{a} — {b}', todayMark: 'bu gün',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'Ay başlanğıcı hilalın görülməsi ilədir',
    sightText: 'Burada göstərilən tarixlər Səudiyyə Ərəbistanının hesablanmış Ümmül-Qura təqvimidir. Şəriətdə ay hilalın görülməsi ilə başlayır, ona görə ölkənizdə Ramazan, bayram və Zülhiccə üçün elan olunan tarix bir gün fərqlənə bilər.',
    sightTr: '"Hilalı gördüyünüz zaman oruc tutun, onu gördüyünüz zaman orucu açın. Əgər hava buludlu olarsa, otuz gün tamamlayın."',
    sightSrc: 'Muslim 1081; həmçinin Buxari 1909',
    namesTitle: 'Hicri ayların adları', colNo: '№', colLocal: 'Ad', colAr: 'Ərəbcə', colTr: 'Oxunuşu',
    calendarLink: 'İslami təqvim və mübarək günlər',
  },
  en: {
    title: 'Hijri date converter',
    lead: 'Convert Gregorian dates to Hijri and Hijri dates to Gregorian, and see the days of a Hijri month alongside Gregorian dates.',
    todayTitle: 'Today',
    convTitle: 'Converter', dirGroup: 'Conversion direction', toHijri: 'Gregorian → Hijri', toGreg: 'Hijri → Gregorian', swap: 'Switch direction',
    gDate: 'Gregorian date', hDay: 'Day', hMonth: 'Month', hYear: 'Hijri year',
    resultTitle: 'Result', weekday: 'Weekday', hijri: 'Hijri', gregorian: 'Gregorian', monthAr: 'Arabic month name',
    noDay: 'This date does not exist: {m} {y} has {n} days.', badG: 'Choose a date between the years {a} and {b}.',
    badH: 'Enter a Hijri year between {a} and {b}.', beforeHijra: 'This date is before the Hijrah.',
    approx: 'This year lies outside the Umm al-Qura table — the result uses the arithmetic (approximate) calendar.',
    noIntl: 'Your browser does not support the Umm al-Qura calendar — the result uses the arithmetic calendar and may be off by 1–2 days.',
    julianNote: 'Dates before 1582 are shown in the (proleptic) Gregorian calendar.',
    showMonth: 'Show the month in the grid',
    gridTitle: 'Hijri month', prevMonth: 'Previous month', nextMonth: 'Next month', thisMonth: 'This month',
    monthDays: '{n} days', range: '{a} — {b}', todayMark: 'today',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'A month begins with the sighting of the crescent',
    sightText: 'The dates here follow Saudi Arabia’s calculated Umm al-Qura calendar. In the Shariah a month begins with the sighting of the crescent, so the date announced in your country for Ramadan, Eid or Dhul-Hijjah may differ by a day.',
    sightTr: '"When you see the crescent, fast; and when you see it, break your fast. If it is hidden from you by clouds, then fast thirty days."',
    sightSrc: 'Muslim 1081; also al-Bukhari 1909',
    namesTitle: 'Names of the Hijri months', colNo: 'No.', colLocal: 'Name', colAr: 'Arabic', colTr: 'Transliteration',
    calendarLink: 'Islamic calendar and blessed days',
  },
  ru: {
    title: 'Конвертер дат хиджры',
    lead: 'Переводите даты григорианского календаря в даты хиджры и обратно, смотрите дни месяца хиджры вместе с григорианскими датами.',
    todayTitle: 'Сегодня',
    convTitle: 'Конвертер', dirGroup: 'Направление перевода', toHijri: 'Григорианская → хиджра', toGreg: 'Хиджра → григорианская', swap: 'Сменить направление',
    gDate: 'Григорианская дата', hDay: 'День', hMonth: 'Месяц', hYear: 'Год хиджры',
    resultTitle: 'Результат', weekday: 'День недели', hijri: 'Хиджра', gregorian: 'Григорианская', monthAr: 'Название месяца по-арабски',
    noDay: 'Такой даты нет: в месяце {m} {y} года {n} дней.', badG: 'Выберите дату между {a} и {b} годами.',
    badH: 'Укажите год хиджры от {a} до {b}.', beforeHijra: 'Эта дата раньше хиджры.',
    approx: 'Этот год вне таблицы Умм аль-Кура — результат рассчитан по арифметическому (приблизительному) календарю.',
    noIntl: 'Ваш браузер не поддерживает календарь Умм аль-Кура — результат рассчитан арифметически и может отличаться на 1–2 дня.',
    julianNote: 'Даты до 1582 года показаны по григорианскому календарю, продлённому в прошлое.',
    showMonth: 'Показать месяц в сетке',
    gridTitle: 'Месяц хиджры', prevMonth: 'Предыдущий месяц', nextMonth: 'Следующий месяц', thisMonth: 'Текущий месяц',
    monthDays: 'дней: {n}', range: '{a} — {b}', todayMark: 'сегодня',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'Месяц начинается с появления молодой луны',
    sightText: 'Даты здесь — по рассчитанному календарю Умм аль-Кура (Саудовская Аравия). По шариату месяц начинается, когда увидят молодой месяц, поэтому объявленная в вашей стране дата Рамадана, праздника или Зуль-хиджи может отличаться на день.',
    sightTr: '«Когда увидите молодой месяц — поститесь, и когда увидите его — прекращайте пост. Если же его скроют от вас облака, то поститесь тридцать дней».',
    sightSrc: 'Муслим 1081; также аль-Бухари 1909',
    namesTitle: 'Названия месяцев хиджры', colNo: '№', colLocal: 'Название', colAr: 'По-арабски', colTr: 'Транслитерация',
    calendarLink: 'Исламский календарь и благословенные дни',
  },
  ar: {
    title: 'محوّل التاريخ الهجري',
    lead: 'حوّل التاريخ الميلادي إلى هجري والهجري إلى ميلادي، واعرض أيام الشهر الهجري مع ما يقابلها من التواريخ الميلادية.',
    todayTitle: 'اليوم',
    convTitle: 'المحوّل', dirGroup: 'اتجاه التحويل', toHijri: 'ميلادي ← هجري', toGreg: 'هجري ← ميلادي', swap: 'عكس الاتجاه',
    gDate: 'التاريخ الميلادي', hDay: 'اليوم', hMonth: 'الشهر', hYear: 'السنة الهجرية',
    resultTitle: 'النتيجة', weekday: 'يوم الأسبوع', hijri: 'هجري', gregorian: 'ميلادي', monthAr: 'اسم الشهر',
    noDay: 'هذا التاريخ غير موجود: شهر {m} سنة {y} عدد أيامه {n}.', badG: 'اختر تاريخًا بين سنة {a} وسنة {b}.',
    badH: 'اكتب سنة هجرية بين {a} و{b}.', beforeHijra: 'هذا التاريخ قبل الهجرة.',
    approx: 'هذه السنة خارج جدول أم القرى — حُسبت النتيجة بالتقويم الحسابي (تقريبًا).',
    noIntl: 'متصفحك لا يدعم تقويم أم القرى — حُسبت النتيجة بالتقويم الحسابي وقد تختلف بيوم أو يومين.',
    julianNote: 'التواريخ قبل سنة 1582 معروضة بالتقويم الغريغوري الممتد إلى الماضي.',
    showMonth: 'اعرض الشهر في الجدول',
    gridTitle: 'الشهر الهجري', prevMonth: 'الشهر السابق', nextMonth: 'الشهر التالي', thisMonth: 'الشهر الحالي',
    monthDays: '{n} يومًا', range: '{a} — {b}', todayMark: 'اليوم',
    cellAria: '{h} — {g}، {w}',
    sightTitle: 'يبدأ الشهر برؤية الهلال',
    sightText: 'التواريخ هنا وفق تقويم أم القرى المحسوب في المملكة العربية السعودية. والشهر في الشرع يبدأ برؤية الهلال، فقد يختلف بيوم ما يُعلن في بلدك لرمضان والعيد وذي الحجة.',
    sightTr: 'حديث رؤية الهلال',
    sightSrc: 'مسلم 1081؛ وانظر البخاري 1909',
    namesTitle: 'أسماء الشهور الهجرية', colNo: 'م', colLocal: 'الاسم', colAr: 'بالعربية', colTr: 'النطق اللاتيني',
    calendarLink: 'التقويم الإسلامي والأيام الفاضلة',
  },
  tr: {
    title: 'Hicri tarih çevirici',
    lead: 'Miladi tarihi hicriye, hicri tarihi miladiye çevirin; hicri ayın günlerini miladi tarihlerle birlikte görün.',
    todayTitle: 'Bugün',
    convTitle: 'Çevirici', dirGroup: 'Çevirme yönü', toHijri: 'Miladi → Hicri', toGreg: 'Hicri → Miladi', swap: 'Yönü değiştir',
    gDate: 'Miladi tarih', hDay: 'Gün', hMonth: 'Ay', hYear: 'Hicri yıl',
    resultTitle: 'Sonuç', weekday: 'Haftanın günü', hijri: 'Hicri', gregorian: 'Miladi', monthAr: 'Ayın Arapça adı',
    noDay: 'Bu tarih yok: {m} {y} ayı {n} gündür.', badG: 'Tarihi {a}–{b} yılları arasında seçin.',
    badH: 'Hicri yılı {a}–{b} aralığında yazın.', beforeHijra: 'Bu tarih hicretten öncedir.',
    approx: 'Bu yıl Ümmü’l-Kurâ tablosunun dışında — sonuç aritmetik (yaklaşık) takvimle hesaplandı.',
    noIntl: 'Tarayıcınız Ümmü’l-Kurâ takvimini desteklemiyor — sonuç aritmetik takvimle hesaplandı, 1–2 gün sapabilir.',
    julianNote: '1582’den önceki tarihler geriye uzatılmış Gregoryen takvimiyle gösterilir.',
    showMonth: 'Ayı tabloda göster',
    gridTitle: 'Hicri ay', prevMonth: 'Önceki ay', nextMonth: 'Sonraki ay', thisMonth: 'Bu ay',
    monthDays: '{n} gün', range: '{a} — {b}', todayMark: 'bugün',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'Ay başlangıcı hilalin görülmesiyledir',
    sightText: 'Buradaki tarihler Suudi Arabistan’ın hesaplanmış Ümmü’l-Kurâ takvimine göredir. Şeriatta ay hilalin görülmesiyle başlar; bu yüzden ülkenizde Ramazan, bayram ve Zilhicce için ilan edilen tarih bir gün farklı olabilir.',
    sightTr: '"Hilali gördüğünüzde oruç tutun, onu gördüğünüzde orucu bırakın. Eğer bulutlu olursa otuz gün tamamlayın."',
    sightSrc: 'Müslim 1081; ayrıca Buhârî 1909',
    namesTitle: 'Hicri ayların adları', colNo: 'No', colLocal: 'Adı', colAr: 'Arapça', colTr: 'Okunuşu',
    calendarLink: 'İslami takvim ve mübarek günler',
  },
}

// ── Dizayn v3: "Hicri il bir baxışda" və "Gələcək Ramazanlar" (5 dil) ──
// Bütün rəqəmlər utils/hijri.js ilə HESABLANIR (Ümmül-Qura) — əl ilə yazılmış tarix yoxdur.
// Ayə 10:5 — api.quran.com (uthmani); tərcümələr alquran.cloud: az.mammadaliyev,
// en.sahih, ru.kuliev, tr.diyanet (2026-11-01 yoxlanılıb).
const AYAH_10_5_AR = 'هُوَ ٱلَّذِى جَعَلَ ٱلشَّمْسَ ضِيَآءً وَٱلْقَمَرَ نُورًا وَقَدَّرَهُۥ مَنَازِلَ لِتَعْلَمُوا۟ عَدَدَ ٱلسِّنِينَ وَٱلْحِسَابَ'
const X = {
  az: {
    how: 'Necə işlədilir: istiqaməti seçin, tarixi daxil edin — nəticə dərhal görünür. «Ayı şəbəkədə göstər» həmin ayın bütün günlərini açır.',
    yearEy: 'Bir baxışda', yearTitle: 'Hicri il necə qurulub', yearLead: 'Hicri il ayın dövrünə əsaslanır: 12 ay, hər biri 29 və ya 30 gün.',
    ringLabel: 'Hicri {y} ili', ringSub: '{d} / {n} gün keçib',
    lenTitle: 'Ayların uzunluğu — {y}', lenSub: 'gün (Ümmül-Qura)',
    cmpTitle: 'Hicri və miladi il', cmpSub: 'gün', cmpH: 'Hicri {y}', cmpG: 'Miladi {y}',
    cmpNote: 'Fərq təxminən 11 gündür — ona görə Ramazan və bayramlar hər il miladi təqvimdə ~11 gün tez gəlir və təxminən 33 ilə bütün fəsilləri dolaşır.',
    ayahTr: 'Günəşi işıqlı (parlaq), ayı nurlu edən, illərin sayını və hesabı biləsiniz deyə, ay üçün mənzillər müəyyən edən məhz Odur.', ayahSrc: 'Yunus, 10:5',
    ramEy: 'Hesablanmış tarixlər', ramTitle: 'Gələcək Ramazanlar', ramLead: 'Ümmül-Qura təqviminə görə; ölkənizdə elan hilalın görülməsinə görə bir gün fərqlənə bilər.',
    colYear: 'Hicri il', colStart: 'Ramazanın 1-i', colDays: 'Gün', colEid: 'Ramazan bayramı', colShift: 'Ötən ilə görə',
    shift: (n) => `${n} gün tez`, caption: 'Hesab: Ümmül-Qura (brauzerin Intl təqvimi).',
  },
  en: {
    how: 'How to use: choose a direction and enter a date — the result appears instantly. “Show the month in the grid” opens all days of that month.',
    yearEy: 'At a glance', yearTitle: 'How the Hijri year works', yearLead: 'The Hijri year follows the moon: 12 months of 29 or 30 days each.',
    ringLabel: 'Hijri year {y}', ringSub: '{d} / {n} days passed',
    lenTitle: 'Month lengths — {y}', lenSub: 'days (Umm al-Qura)',
    cmpTitle: 'Hijri and Gregorian year', cmpSub: 'days', cmpH: 'Hijri {y}', cmpG: 'Gregorian {y}',
    cmpNote: 'The difference is about 11 days — so Ramadan and the Eids come about 11 days earlier each Gregorian year and move through every season in roughly 33 years.',
    ayahTr: 'It is He who made the sun a shining light and the moon a derived light and determined for it phases — that you may know the number of years and account [of time].', ayahSrc: 'Yunus 10:5',
    ramEy: 'Calculated dates', ramTitle: 'Upcoming Ramadans', ramLead: 'By the Umm al-Qura calendar; the announcement in your country may differ by a day, based on the crescent sighting.',
    colYear: 'Hijri year', colStart: '1 Ramadan', colDays: 'Days', colEid: 'Eid al-Fitr', colShift: 'vs. previous year',
    shift: (n) => `${n} days earlier`, caption: 'Calculation: Umm al-Qura (the browser’s Intl calendar).',
  },
  ru: {
    how: 'Как пользоваться: выберите направление и введите дату — результат появится сразу. «Показать месяц в сетке» открывает все дни этого месяца.',
    yearEy: 'С одного взгляда', yearTitle: 'Как устроен год хиджры', yearLead: 'Год хиджры следует за луной: 12 месяцев по 29 или 30 дней.',
    ringLabel: '{y} год хиджры', ringSub: 'прошло {d} из {n} дней',
    lenTitle: 'Длина месяцев — {y}', lenSub: 'дней (Умм аль-Кура)',
    cmpTitle: 'Год хиджры и григорианский год', cmpSub: 'дней', cmpH: 'Хиджра {y}', cmpG: 'Григ. {y}',
    cmpNote: 'Разница около 11 дней — поэтому Рамадан и праздники каждый год наступают примерно на 11 дней раньше и проходят все времена года примерно за 33 года.',
    ayahTr: 'Он — Тот, Кто даровал солнцу сияние, а луне — свет. Он установил для нее фазы, чтобы вы могли вести летосчисление и знали счет.', ayahSrc: 'Юнус, 10:5',
    ramEy: 'Расчётные даты', ramTitle: 'Ближайшие Рамаданы', ramLead: 'По календарю Умм аль-Кура; объявление в вашей стране может отличаться на день — по наблюдению молодого месяца.',
    colYear: 'Год хиджры', colStart: '1 Рамадана', colDays: 'Дней', colEid: 'Ураза-байрам', colShift: 'К прошлому году',
    shift: (n) => `на ${n} дн. раньше`, caption: 'Расчёт: Умм аль-Кура (встроенный календарь браузера).',
  },
  ar: {
    how: 'طريقة الاستعمال: اختر اتجاه التحويل وأدخل التاريخ فتظهر النتيجة فورًا، و«اعرض الشهر في الجدول» يعرض أيام ذلك الشهر كلها.',
    yearEy: 'في لمحة', yearTitle: 'كيف تتكون السنة الهجرية', yearLead: 'السنة الهجرية قمرية: اثنا عشر شهرًا، كل شهر تسعة وعشرون أو ثلاثون يومًا.',
    ringLabel: 'سنة {y}', ringSub: 'مضى {d} من {n} يومًا',
    lenTitle: 'أطوال الشهور — {y}', lenSub: 'يومًا (أم القرى)',
    cmpTitle: 'السنة الهجرية والميلادية', cmpSub: 'يومًا', cmpH: 'هجري {y}', cmpG: 'ميلادي {y}',
    cmpNote: 'الفرق نحو أحد عشر يومًا، ولذا يتقدم رمضان والعيدان كل سنة ميلادية نحو أحد عشر يومًا، ويدورون على الفصول كلها في نحو ثلاث وثلاثين سنة.',
    ayahTr: '', ayahSrc: 'يونس: 5',
    ramEy: 'تواريخ محسوبة', ramTitle: 'رمضان في السنوات القادمة', ramLead: 'وفق تقويم أم القرى، وقد يختلف الإعلان في بلدك بيوم بحسب رؤية الهلال.',
    colYear: 'السنة الهجرية', colStart: 'أول رمضان', colDays: 'الأيام', colEid: 'عيد الفطر', colShift: 'مقارنة بالسنة السابقة',
    shift: (n) => `أبكر بـ ${n} يومًا`, caption: 'الحساب: أم القرى (تقويم المتصفح المدمج).',
  },
  tr: {
    how: 'Nasıl kullanılır: yönü seçin, tarihi girin — sonuç hemen görünür. “Ayı tabloda göster” o ayın bütün günlerini açar.',
    yearEy: 'Bir bakışta', yearTitle: 'Hicri yıl nasıl kurulur', yearLead: 'Hicri yıl aya dayanır: her biri 29 veya 30 gün olan 12 ay.',
    ringLabel: 'Hicri {y} yılı', ringSub: '{n} günün {d} günü geçti',
    lenTitle: 'Ayların uzunluğu — {y}', lenSub: 'gün (Ümmü’l-Kurâ)',
    cmpTitle: 'Hicri ve miladi yıl', cmpSub: 'gün', cmpH: 'Hicri {y}', cmpG: 'Miladi {y}',
    cmpNote: 'Fark yaklaşık 11 gündür — bu yüzden Ramazan ve bayramlar her yıl miladi takvimde ~11 gün erken gelir ve yaklaşık 33 yılda bütün mevsimleri dolaşır.',
    ayahTr: 'Güneşi ışıklı ve ayı nurlu yapan; yılların sayısını ve hesabı bilmeniz için, aya konak yerleri düzenleyen O’dur.', ayahSrc: 'Yunus, 10:5',
    ramEy: 'Hesaplanmış tarihler', ramTitle: 'Gelecek Ramazanlar', ramLead: 'Ümmü’l-Kurâ takvimine göre; ülkenizdeki ilan hilalin görülmesine göre bir gün farklı olabilir.',
    colYear: 'Hicri yıl', colStart: '1 Ramazan', colDays: 'Gün', colEid: 'Ramazan Bayramı', colShift: 'Önceki yıla göre',
    shift: (n) => `${n} gün erken`, caption: 'Hesap: Ümmü’l-Kurâ (tarayıcının Intl takvimi).',
  },
}
const HJ_RELATED = [
  { key: 'calendar', title: { az: 'İslami təqvim', en: 'Islamic calendar', ru: 'Исламский календарь', ar: 'التقويم الإسلامي', tr: 'İslami takvim' }, text: { az: 'Bayramlar və mübarək günlər', en: 'Eids and blessed days', ru: 'Праздники и благословенные дни', ar: 'الأعياد والأيام الفاضلة', tr: 'Bayramlar ve mübarek günler' } },
  { key: 'ramadan', title: { az: 'İmsakiyyə', en: 'Ramadan timetable', ru: 'Расписание Рамадана', ar: 'إمساكية رمضان', tr: 'İmsakiye' }, text: { az: 'Ramazan vaxtları', en: 'Ramadan times', ru: 'Время в Рамадан', ar: 'أوقات رمضان', tr: 'Ramazan vakitleri' } },
  { key: 'history', title: { az: 'İslam tarixi', en: 'Islamic history', ru: 'История ислама', ar: 'التاريخ الإسلامي', tr: 'İslam tarihi' }, text: { az: 'Hicrət və sonrası', en: 'The Hijrah and after', ru: 'Хиджра и после', ar: 'الهجرة وما بعدها', tr: 'Hicret ve sonrası' } },
  { lesson: 'sunnah-fasts', title: { az: 'Sünnə orucları', en: 'Sunnah fasts', ru: 'Желательные посты', ar: 'صيام التطوع', tr: 'Sünnet oruçlar' }, text: { az: 'Dərs', en: 'Lesson', ru: 'Урок', ar: 'درس', tr: 'Ders' } },
]

const todayG = () => fromLocalDate(new Date())

export default function HijriPage({ setPage }) {
  const { lang } = useLang()
  const lk = LABELS[lang] ? lang : 'en'
  const t = LABELS[lk]
  const firstDow = FIRST_DOW[lk] ?? 1

  // Bugün (gecə yarısı keçəndə yenilənsin)
  const [now, setNow] = useState(todayG)
  useEffect(() => {
    const id = setInterval(() => {
      const g = todayG()
      setNow(cur => (gKey(cur) === gKey(g) ? cur : g))
    }, 60000)
    return () => clearInterval(id)
  }, [])
  const hToday = useMemo(() => gregorianToHijri(now), [now])

  // Şəbəkədə göstərilən ay
  const [view, setView] = useState(() => ({ year: hToday.year, month: hToday.month }))
  const showMonth = (ym) => {
    setView(ym)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => document.getElementById('hj-grid')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }))
  }

  return (
    <div className="hj-root">
      <header className="ui-page-hero ui-page-hero--split hj-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {(X[lk] || X.en).how}</p>
          </div>
          <div className="ui-page-hero__aside" data-reveal="zoom">
            <TodayCard t={t} lang={lk} g={now} h={hToday} />
          </div>
        </div>
      </header>

      <section className="ui-section hj-main">
        <div className="ui-container hj-layout">
          <Converter t={t} lang={lk} today={now} onShowMonth={showMonth} />
          <MonthGrid t={t} lang={lk} view={view} setView={setView} today={now} hToday={hToday} firstDow={firstDow} />
        </div>
      </section>

      <YearGlance lang={lk} g={now} h={hToday} />
      <Ramadans lang={lk} h={hToday} />

      <section className="ui-section ui-section--tight hj-more">
        <div className="ui-container hj-more-grid">
          <MonthNames t={t} lang={lk} current={view.year === hToday.year ? hToday.month : null} year={view.year} onShowMonth={showMonth} />
          <SightingNote t={t} lang={lk} setPage={setPage} />
        </div>
      </section>

      <RelatedLinks items={HJ_RELATED} lang={lk} id="hj-related" />
    </div>
  )
}

// ── Hicri il bir baxışda: ilin irəliləyişi, ayların uzunluğu, iki təqvimin müqayisəsi ──
function YearGlance({ lang, g, h }) {
  const x = X[lang] || X.en
  const lens = useMemo(() => Array.from({ length: 12 }, (_, i) => hijriMonthLength(h.year, i + 1)), [h.year])
  const yearLen = lens.reduce((a, b) => a + b, 0)
  const doy = lens.slice(0, h.month - 1).reduce((a, b) => a + b, 0) + h.day
  const gLen = (g.year % 4 === 0 && g.year % 100 !== 0) || g.year % 400 === 0 ? 366 : 365
  return (
    <section className="ui-section ui-section--tight ui-section--alt hj-year" aria-labelledby="hj-year-title">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal>
          <span className="ui-eyebrow">{x.yearEy}</span>
          <h2 id="hj-year-title" className="ui-title">{x.yearTitle}</h2>
          <p className="ui-lead">{x.yearLead}</p>
        </div>
        <div className="hj-year-grid">
          <div className="hj-year-ring ui-card tm-ring" data-reveal="zoom" style={{ '--tm-ring-from': ringFrom(doy, yearLen, 120, 12) }}>
            <ProgressRing value={doy} max={yearLen} size={120} thickness={12}
              label={fill(x.ringLabel, { y: h.year })} sub={fill(x.ringSub, { d: doy, n: yearLen })} />
          </div>
          <ChartFigure className="hj-year-fig" title={fill(x.lenTitle, { y: h.year })} sub={x.lenSub}>
            <ColumnChart height={90} label={`${fill(x.lenTitle, { y: h.year })}: ${lens.join(', ')}`}
              data={lens.map((v, i) => ({ key: i, label: String(i + 1), value: v, current: i + 1 === h.month, tone: v === 30 ? 1 : 2 }))} />
          </ChartFigure>
          <ChartFigure className="hj-year-fig" title={x.cmpTitle} sub={x.cmpSub} note={x.cmpNote}>
            <BarChart max={gLen} format={(v) => String(v)} label={x.cmpTitle}
              data={[{ label: fill(x.cmpH, { y: h.year }), value: yearLen }, { label: fill(x.cmpG, { y: g.year }), value: gLen, tone: 2 }]} />
          </ChartFigure>
        </div>
        <figure className="ui-quote hj-quote hj-ayah">
          <blockquote>
            <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{AYAH_10_5_AR}</p>
            {x.ayahTr && <p className="ui-quote__text">«{x.ayahTr}»</p>}
          </blockquote>
          <figcaption className="ui-quote__src">— {x.ayahSrc}</figcaption>
        </figure>
      </div>
    </section>
  )
}

// ── Gələcək Ramazanlar: hesablanmış başlanğıc, gün sayı, bayram, miladi sürüşmə ──
function Ramadans({ lang, h }) {
  const x = X[lang] || X.en
  const rows = useMemo(() => {
    const first = h.month <= 9 ? h.year : h.year + 1
    const out = []
    for (let y = first; y < first + 6 && y <= MAX_H_YEAR; y++) {
      const start = hijriToGregorian({ year: y, month: 9, day: 1 })
      const eid = hijriToGregorian({ year: y, month: 10, day: 1 })
      const prev = hijriToGregorian({ year: y - 1, month: 9, day: 1 })
      if (!start || !eid) continue
      let shift = null
      if (prev) {
        const same = { year: prev.year + 1, month: prev.month, day: prev.day }
        if (isValidGregorian(same)) shift = gDiffDays(start, same)
      }
      out.push({ y, start, eid, days: hijriMonthLength(y, 9), shift })
    }
    return out
  }, [h.year, h.month])
  return (
    <section className="ui-section ui-section--tight hj-ram" aria-labelledby="hj-ram-title">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal>
          <span className="ui-eyebrow">{x.ramEy}</span>
          <h2 id="hj-ram-title" className="ui-title">{x.ramTitle}</h2>
          <p className="ui-lead">{x.ramLead}</p>
        </div>
        <div className="ui-table-wrap" data-reveal="fade" tabIndex={0} role="region" aria-labelledby="hj-ram-title">
          <table className="ui-table ui-table--compact tm-cascade-rows">
            <caption>{x.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{x.colYear}</th>
                <th scope="col">{x.colStart}</th>
                <th scope="col" className="is-num">{x.colDays}</th>
                <th scope="col">{x.colEid}</th>
                <th scope="col">{x.colShift}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.y} className={i === 0 ? 'is-current' : undefined}>
                  <th scope="row" className="ui-num">{r.y}</th>
                  <td>{formatGregorian(r.start, lang)} <span className="hj-wd">· {weekdayName(r.start, lang)}</span></td>
                  <td className="is-num">{r.days}</td>
                  <td>{formatGregorian(r.eid, lang)}</td>
                  <td className="hj-shift">{r.shift != null ? x.shift(r.shift) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function TodayCard({ t, lang, g, h }) {
  return (
    <div className="hj-today ui-card ui-card--inverse">
      <span className="hj-today-label">{t.todayTitle} · {weekdayName(g, lang)}</span>
      <p className="hj-today-h" data-testid="hj-today">{formatHijri(h, lang)}</p>
      {lang !== 'ar' && <p className="hj-today-ar ui-arabic" lang="ar" dir="rtl">{h.day} {HIJRI_MONTHS_AR[h.month - 1]} {h.year} هـ</p>}
      <p className="hj-today-g">{formatGregorian(g, lang)}</p>
    </div>
  )
}

// ── Çevirici ──
function Converter({ t, lang, today, onShowMonth }) {
  const [dir, setDir] = useState('g2h')
  const [gStr, setGStr] = useState(() => gKey(today))
  const h0 = gregorianToHijri(today)
  const [hDay, setHDay] = useState(String(h0.day))
  const [hMonth, setHMonth] = useState(String(h0.month))
  const [hYear, setHYear] = useState(String(h0.year))

  const result = useMemo(() => {
    if (dir === 'g2h') {
      const g = parseGKey(gStr)
      if (!g) return { error: fill(t.badG, { a: MIN_G_YEAR, b: MAX_G_YEAR }) }
      const h = gregorianToHijri(g)
      if (h.year < 1) return { error: t.beforeHijra }
      return { g, h }
    }
    const y = Math.floor(Number(hYear)), m = Math.floor(Number(hMonth)), d = Math.floor(Number(hDay))
    if (!Number.isFinite(y) || y < MIN_H_YEAR || y > MAX_H_YEAR) return { error: fill(t.badH, { a: MIN_H_YEAR, b: MAX_H_YEAR }) }
    const h = { year: y, month: m, day: d }
    const g = hijriToGregorian(h)
    if (!g) {
      const n = hijriMonthLength(y, m)
      return { error: fill(t.noDay, { m: (HIJRI_MONTHS[lang] || HIJRI_MONTHS.en)[m - 1], y, n }) }
    }
    return { g, h }
  }, [dir, gStr, hDay, hMonth, hYear, t, lang])

  const swap = () => {
    haptic()
    if (result.g && result.h) {
      setGStr(gKey(result.g))
      setHDay(String(result.h.day)); setHMonth(String(result.h.month)); setHYear(String(result.h.year))
    }
    setDir(d => (d === 'g2h' ? 'h2g' : 'g2h'))
  }

  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  return (
    <div className="hj-conv ui-card" data-reveal>
      <div className="hj-conv-head">
        <h2 className="hj-card-title"><Icon name="refresh" size={18} /> {t.convTitle}</h2>
        <button type="button" className="ui-icon-btn" aria-label={t.swap} title={t.swap} onClick={swap}>
          <Icon name="refresh" size={18} />
        </button>
      </div>
      <div className="hj-chips" role="group" aria-label={t.dirGroup}>
        <button type="button" className="ui-chip" aria-pressed={dir === 'g2h'} onClick={() => setDir('g2h')}>{t.toHijri}</button>
        <button type="button" className="ui-chip" aria-pressed={dir === 'h2g'} onClick={() => setDir('h2g')}>{t.toGreg}</button>
      </div>

      {dir === 'g2h' ? (
        <label className="ui-field hj-field">
          <span className="ui-field__label">{t.gDate}</span>
          <input className="ui-input" type="date" value={gStr} min={`0${MIN_G_YEAR}-07-19`} max={`${MAX_G_YEAR}-12-31`}
            onChange={(e) => setGStr(e.target.value)} data-testid="hj-g-input" />
        </label>
      ) : (
        <div className="hj-h-inputs">
          <label className="ui-field">
            <span className="ui-field__label">{t.hDay}</span>
            <input className="ui-input" type="number" inputMode="numeric" min="1" max="30" value={hDay}
              onChange={(e) => setHDay(e.target.value)} data-testid="hj-h-day" />
          </label>
          <label className="ui-field hj-h-month">
            <span className="ui-field__label">{t.hMonth}</span>
            <select className="ui-select" value={hMonth} onChange={(e) => setHMonth(e.target.value)} data-testid="hj-h-month">
              {months.map((m, i) => <option key={i} value={i + 1}>{i + 1}. {m}</option>)}
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-field__label">{t.hYear}</span>
            <input className="ui-input" type="number" inputMode="numeric" min={MIN_H_YEAR} max={MAX_H_YEAR} value={hYear}
              onChange={(e) => setHYear(e.target.value)} data-testid="hj-h-year" />
          </label>
        </div>
      )}

      <div className="hj-result" aria-live="polite">
        {result.error ? (
          <p className="hj-error" role="alert"><Icon name="alert" size={18} /> <span>{result.error}</span></p>
        ) : (
          <>
            <dl className="hj-dl tm-slide" key={`${result.h.year}-${result.h.month}-${result.h.day}`}>
              <div><dt>{t.hijri}</dt><dd className="hj-big" data-testid="hj-res-hijri">{formatHijri(result.h, lang)}</dd></div>
              <div><dt>{t.gregorian}</dt><dd className="hj-big" data-testid="hj-res-greg">{formatGregorian(result.g, lang)}</dd></div>
              <div><dt>{t.weekday}</dt><dd>{weekdayName(result.g, lang)}</dd></div>
              <div>
                <dt>{t.monthAr}</dt>
                <dd>
                  <span className="ui-arabic hj-ar-inline" lang="ar" dir="rtl">{HIJRI_MONTHS_AR[result.h.month - 1]}</span>
                  {lang !== 'ar' && <span className="hj-translit"> · {HIJRI_MONTHS_TRANSLIT[result.h.month - 1]}</span>}
                </dd>
              </div>
            </dl>
            {!hasUmmAlQura()
              ? <p className="hj-note"><Icon name="info" size={15} /> {t.noIntl}</p>
              : isApproximate(result.h.year) && <p className="hj-note"><Icon name="info" size={15} /> {t.approx}</p>}
            {result.g.year < 1583 && <p className="hj-note"><Icon name="info" size={15} /> {t.julianNote}</p>}
            <button type="button" className="ui-link hj-show-month"
              onClick={() => onShowMonth({ year: result.h.year, month: result.h.month })}>
              {t.showMonth} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Hicri ayın şəbəkəsi ──
function MonthGrid({ t, lang, view, setView, today, hToday, firstDow }) {
  const grid = useMemo(() => hijriMonthGrid(view.year, view.month, firstDow), [view.year, view.month, firstDow])
  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  const shortG = G_MONTHS_SHORT[lang] || G_MONTHS_SHORT.en
  const wd = WEEKDAYS_SHORT[lang] || WEEKDAYS_SHORT.en
  const todayKey = gKey(today)
  const isCur = view.year === hToday.year && view.month === hToday.month
  const go = (n) => {
    haptic()
    const next = shiftHijriMonth(view, n)
    if (next.year >= MIN_H_YEAR && next.year <= MAX_H_YEAR) setView(next)
  }
  const headers = Array.from({ length: 7 }, (_, i) => (firstDow + i) % 7)

  return (
    <div className="hj-grid-card ui-card" id="hj-grid" data-reveal>
      <div className="hj-grid-head">
        <button type="button" className="ui-icon-btn" aria-label={t.prevMonth} onClick={() => go(-1)}>
          <Icon name="chevronLeft" size={18} className="ui-flip-rtl" />
        </button>
        <div className="hj-grid-title">
          <span className="hj-grid-eyebrow">{t.gridTitle}</span>
          <h2 className="hj-card-title hj-grid-name" aria-live="polite" data-testid="hj-grid-title">
            {months[view.month - 1]} {view.year}
            {lang !== 'ar' && <span className="ui-arabic hj-grid-ar" lang="ar" dir="rtl">{HIJRI_MONTHS_AR[view.month - 1]}</span>}
          </h2>
          {grid.start && (
            <span className="hj-grid-sub">
              {fill(t.range, { a: formatGregorian(grid.start, lang), b: formatGregorian(grid.end, lang) })} · {fill(t.monthDays, { n: grid.length })}
            </span>
          )}
        </div>
        <button type="button" className="ui-icon-btn" aria-label={t.nextMonth} onClick={() => go(1)}>
          <Icon name="chevron" size={18} className="ui-flip-rtl" />
        </button>
      </div>
      {!isCur && (
        <div className="hj-grid-back">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm"
            onClick={() => setView({ year: hToday.year, month: hToday.month })}>{t.thisMonth}</button>
        </div>
      )}

      <table className="hj-cal" key={`${view.year}-${view.month}`}>
        <caption className="ui-sr-only">{months[view.month - 1]} {view.year}</caption>
        <thead>
          <tr>{headers.map(d => <th key={d} scope="col" className="hj-cal-wd">{wd[d]}</th>)}</tr>
        </thead>
        <tbody>
          {grid.weeks.map((w, wi) => (
            <tr key={wi}>
              {w.map((c, ci) => {
                if (!c) return <td key={ci} className="hj-cal-cell is-empty" />
                const isToday = gKey(c.g) === todayKey
                const showMonth = c.hDay === 1 || c.g.day === 1
                return (
                  <td key={ci} style={{ '--i': wi * 7 + ci }} className={`hj-cal-cell${isToday ? ' is-today' : ''}${c.dow === 5 ? ' is-friday' : ''}`}
                    aria-current={isToday ? 'date' : undefined}>
                    <span className="ui-sr-only">
                      {fill(t.cellAria, { h: formatHijri({ year: view.year, month: view.month, day: c.hDay }, lang), g: formatGregorian(c.g, lang), w: weekdayName(c.g, lang) })}
                      {isToday ? ` (${t.todayMark})` : ''}
                    </span>
                    <span className="hj-cal-h ui-num" aria-hidden="true">{c.hDay}</span>
                    <span className="hj-cal-g ui-num" aria-hidden="true">{showMonth ? `${c.g.day} ${shortG[c.g.month - 1]}` : c.g.day}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SightingNote({ t, lang, setPage }) {
  return (
    <div className="hj-sight ui-card" data-reveal>
      <h2 className="hj-card-title"><Icon name="moonStar" size={18} fallback="moon" /> {t.sightTitle}</h2>
      <p className="hj-sight-text">{t.sightText}</p>
      <figure className="ui-quote hj-quote">
        <blockquote>
          <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{SIGHTING_AR}</p>
          {lang !== 'ar' && <p className="ui-quote__text">{t.sightTr}</p>}
        </blockquote>
        <figcaption className="ui-quote__src">— {t.sightSrc}</figcaption>
      </figure>
      {setPage && (
        <button type="button" className="ui-link hj-cal-link" onClick={() => setPage('calendar')}>
          {t.calendarLink} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
        </button>
      )}
    </div>
  )
}

// v3.2: ay adları — kart şəbəkəsi (əvvəl cədvəl idi). Kart → həmin ay şəbəkədə açılır.
// Haram aylar: Məhərrəm, Rəcəb, Zülqədə, Zülhiccə (Tövbə 9:36; Buxari 3197)
const SACRED = new Set([1, 7, 11, 12])
const MN_TXT = {
  sacred: { az: 'Haram ay', en: 'Sacred month', ru: 'Запретный месяц', ar: 'شهر حرام', tr: 'Haram ay' },
  current: { az: 'Cari ay', en: 'This month', ru: 'Текущий', ar: 'الشهر الحالي', tr: 'Bu ay' },
  days: { az: '{n} gün', en: '{n} days', ru: '{n} дн.', ar: '{n} يومًا', tr: '{n} gün' },
  starts: { az: 'Başlanğıc', en: 'Starts', ru: 'Начало', ar: 'يبدأ', tr: 'Başlangıç' },
  show: { az: 'Şəbəkədə göstər', en: 'Show in the grid', ru: 'Показать в сетке', ar: 'اعرض في الجدول', tr: 'Tabloda göster' },
  sacredNote: { az: 'Haram aylar — Tövbə 9:36; Buxari 3197.', en: 'Sacred months — at-Tawbah 9:36; al-Bukhari 3197.', ru: 'Запретные месяцы — ат-Тауба 9:36; аль-Бухари 3197.', ar: 'الأشهر الحرم — التوبة 9:36؛ البخاري 3197.', tr: 'Haram aylar — Tevbe 9:36; Buhârî 3197.' },
}
const mn = (k, lang) => MN_TXT[k][lang] || MN_TXT[k].en

function MonthNames({ t, lang, current, year, onShowMonth }) {
  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  const info = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    let len = null, start = null
    try { len = hijriMonthLength(year, i + 1) } catch { /* aralıqdan kənar */ }
    try { start = hijriToGregorian({ year, month: i + 1, day: 1 }) } catch { /* aralıqdan kənar */ }
    return { len, start }
  }), [year])
  return (
    <div className="hj-names" data-reveal>
      <h2 className="hj-card-title"><Icon name="calendar" size={18} /> {t.namesTitle} <span className="hj-names__y ui-num">· {year}</span></h2>
      <ol className="hj-mcards">
        {months.map((m, i) => {
          const isCur = i + 1 === current
          const { len, start } = info[i]
          return (
            <li key={i} className={`ui-card hj-mcard${isCur ? ' is-current' : ''}${SACRED.has(i + 1) ? ' is-sacred' : ''}`}
              aria-current={isCur ? 'true' : undefined}>
              <div className="hj-mcard__head">
                <span className="hj-mcard__n ui-num" aria-hidden="true">{i + 1}</span>
                <div className="hj-mcard__names">
                  <h3 className="hj-mcard__name">{lang !== 'ar' ? m : HIJRI_MONTHS_AR[i]}</h3>
                  <span className="hj-translit" lang="en" dir="ltr">{HIJRI_MONTHS_TRANSLIT[i]}</span>
                </div>
                {lang !== 'ar' && <span className="ui-arabic hj-mcard__ar" lang="ar" dir="rtl">{HIJRI_MONTHS_AR[i]}</span>}
              </div>
              <div className="hj-mcard__meta">
                {isCur && <span className="ui-badge ui-badge--solid">{mn('current', lang)}</span>}
                {SACRED.has(i + 1) && <span className="ui-badge ui-badge--accent">{mn('sacred', lang)}</span>}
                {len && <span className="ui-badge"><span className="ui-num">{mn('days', lang).replace('{n}', len)}</span></span>}
              </div>
              <div className="hj-mcard__foot">
                {start && <span className="hj-mcard__start">{mn('starts', lang)}: <b>{formatGregorian(start, lang)}</b></span>}
                <button type="button" className="ui-icon-btn hj-mcard__go" onClick={() => onShowMonth({ year, month: i + 1 })}
                  aria-label={`${mn('show', lang)}: ${m} ${year}`} title={mn('show', lang)}>
                  <Icon name="arrow" size={16} className="ui-flip-rtl" />
                </button>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="hj-names__note">{mn('sacredNote', lang)}</p>
    </div>
  )
}
