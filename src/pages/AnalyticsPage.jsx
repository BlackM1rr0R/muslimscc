import { useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/AnalyticsPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import YearReview from '../components/YearReview'
import { navGroupLabel, navLabel } from '../data/navigation'
import { pathFor } from '../seo/routes.js'
import { ChartFigure, BarChart, ColumnChart, ProgressRing, ProgressBar, StackedBar, StatTile } from '../components/viz'
import { getSurahLocal } from '../data/surahNamesAz.js'
import { SURAH_TABLE } from '../data/mushafIndex.js'
import { LESSONS } from '../data/arabicCourse.js'
import { readProgress, passedCount, percentDone } from '../components/arabic/progress.js'

// v3 — qrafiklər və bölmələr üçün əlavə mətnlər (5 dildə)
const X = {
  az: {
    how: 'Burada yalnız bu cihazda qeyd etdikləriniz sayılır: Quran oxuma, namaz və gündəlik izləyici, zikr, sədəqə gündəliyi, kvizlər. Heç nə serverə göndərilmir.',
    bestStreak: 'Ən uzun seriya', days: 'gün', achievements: 'Nailiyyət',
    actEyebrow: 'Fəaliyyət', actTitle: 'Son həftələriniz', actLead: 'Hər kvadrat bir gündür: nə qədər tünddürsə, o gün bir o qədər çox əməl qeyd olunub.',
    heatTitle: 'Son 12 həftə', heatAria: (n) => `Son 12 həftədə ${n} aktiv gün`, less: 'Az', more: 'Çox',
    last7: 'Son 7 gün', last7Sub: 'gün ərzində qeyd olunan əməllər', months: 'Aylar üzrə aktiv günlər', monthsSub: 'son 6 ay',
    worshipEyebrow: 'İbadət', worshipTitle: 'Namaz və gündəlik ibadət', worshipLead: 'Namaz vaxtları və gündəlik izləyici səhifələrində işarələdiyiniz qeydlər birlikdə sayılır.',
    perPrayer: 'Namazlar üzrə', perPrayerSub: 'neçə gün işarələnib', weekByDay: 'Bu həftə günlər üzrə', weekByDaySub: '10 əməldən neçə faizi',
    learnEyebrow: 'Quran və elm', learnTitle: 'Oxu və öyrənmə', learnLead: 'Quran oxucusunda açdığınız surələr, hifz, ərəb dili kursu və kvizlər.',
    coverage: 'Açılan surələr', ayahs: (n) => `bu surələrdə ${n} ayə var (Quranın ${Math.round(n / 62.36)}%-i)`,
    topSurahs: 'Ən çox oxunan surələr', topSurahsSub: 'neçə dəfə açılıb', hifz: 'Hifz (əzbər)',
    course: 'Ərəb dili kursu', lessons: (a, b) => `${b} dərsdən ${a}-i keçilib`, openCourse: 'Kursa keç',
    games: 'Kviz və müsabiqə', gamesSub: 'ən yaxşı nəticə, 10 sualdan', noGames: 'Hələ kviz oynanmayıb.', play: 'Kvizi aç',
    otherEyebrow: 'Hədis, dua, sədəqə', otherTitle: 'Saxladıqlarınız və xeyirləriniz', otherLead: 'Sevimli hədis və dualar, dua gündəliyi, zikr və sədəqə qeydləri.',
    dhikr: 'Zikr (cəmi)', none: 'Hələ qeyd yoxdur.',
    achEyebrow: 'Motivasiya', achLead: 'Nişanlar ardıcıllığı xatırlatmaq üçündür; əsl ölçü niyyət və ixlasdır.',
  },
  en: {
    how: 'Only what you mark on this device is counted here: Quran reading, prayer and daily trackers, dhikr, the charity log and quizzes. Nothing is sent to a server.',
    bestStreak: 'Best streak', days: 'days', achievements: 'Achievements',
    actEyebrow: 'Activity', actTitle: 'Your recent weeks', actLead: 'Each square is a day: the darker it is, the more deeds you marked that day.',
    heatTitle: 'Last 12 weeks', heatAria: (n) => `${n} active days in the last 12 weeks`, less: 'Less', more: 'More',
    last7: 'Last 7 days', last7Sub: 'deeds marked per day', months: 'Active days by month', monthsSub: 'last 6 months',
    worshipEyebrow: 'Worship', worshipTitle: 'Prayer and daily worship', worshipLead: 'Marks from the prayer times page and the daily tracker are counted together.',
    perPrayer: 'By prayer', perPrayerSub: 'days marked', weekByDay: 'This week by day', weekByDaySub: 'share of the 10 deeds',
    learnEyebrow: 'Quran and knowledge', learnTitle: 'Reading and learning', learnLead: 'Surahs you opened in the Quran reader, hifz, the Arabic course and quizzes.',
    coverage: 'Surahs opened', ayahs: (n) => `these surahs contain ${n} ayahs (${Math.round(n / 62.36)}% of the Quran)`,
    topSurahs: 'Most-read surahs', topSurahsSub: 'times opened', hifz: 'Hifz (memorisation)',
    course: 'Arabic course', lessons: (a, b) => `${a} of ${b} lessons passed`, openCourse: 'Go to the course',
    games: 'Quizzes', gamesSub: 'best result out of 10', noGames: 'No quiz played yet.', play: 'Open the quiz',
    otherEyebrow: 'Hadith, dua, charity', otherTitle: 'What you saved and gave', otherLead: 'Favourite hadiths and duas, the dua journal, dhikr and charity records.',
    dhikr: 'Dhikr (total)', none: 'No records yet.',
    achEyebrow: 'Motivation', achLead: 'Badges are a reminder to stay consistent; the real measure is intention and sincerity.',
  },
  ru: {
    how: 'Здесь учитывается только то, что вы отмечаете на этом устройстве: чтение Корана, трекеры намаза и дня, зикр, дневник садаки и викторины. Ничего не отправляется на сервер.',
    bestStreak: 'Лучшая серия', days: 'дн.', achievements: 'Достижения',
    actEyebrow: 'Активность', actTitle: 'Ваши последние недели', actLead: 'Каждый квадрат — день: чем он темнее, тем больше дел отмечено в этот день.',
    heatTitle: 'Последние 12 недель', heatAria: (n) => `Активных дней за 12 недель: ${n}`, less: 'Меньше', more: 'Больше',
    last7: 'Последние 7 дней', last7Sub: 'отмеченных дел за день', months: 'Активные дни по месяцам', monthsSub: 'последние 6 месяцев',
    worshipEyebrow: 'Поклонение', worshipTitle: 'Намаз и ежедневное поклонение', worshipLead: 'Отметки со страницы времени намаза и из ежедневного трекера считаются вместе.',
    perPrayer: 'По намазам', perPrayerSub: 'сколько дней отмечено', weekByDay: 'Эта неделя по дням', weekByDaySub: 'доля из 10 дел',
    learnEyebrow: 'Коран и знание', learnTitle: 'Чтение и учёба', learnLead: 'Суры, открытые в читалке Корана, хифз, курс арабского и викторины.',
    coverage: 'Открытые суры', ayahs: (n) => `в этих сурах ${n} аятов (${Math.round(n / 62.36)}% Корана)`,
    topSurahs: 'Чаще всего читаемые суры', topSurahsSub: 'сколько раз открыта', hifz: 'Хифз (заучивание)',
    course: 'Курс арабского', lessons: (a, b) => `пройдено уроков: ${a} из ${b}`, openCourse: 'Перейти к курсу',
    games: 'Викторины', gamesSub: 'лучший результат из 10', noGames: 'Викторины ещё не пройдены.', play: 'Открыть викторину',
    otherEyebrow: 'Хадисы, дуа, садака', otherTitle: 'Сохранённое и благие дела', otherLead: 'Избранные хадисы и дуа, дневник дуа, зикр и записи садаки.',
    dhikr: 'Зикр (всего)', none: 'Записей пока нет.',
    achEyebrow: 'Мотивация', achLead: 'Значки лишь напоминают о постоянстве; истинная мера — намерение и искренность.',
  },
  ar: {
    how: 'تُحسب هنا فقط الأعمال التي تسجّلها على هذا الجهاز: قراءة القرآن، ومتابعة الصلاة واليوم، والذكر، وسجل الصدقة، والاختبارات. لا يُرسل شيء إلى الخادم.',
    bestStreak: 'أطول سلسلة', days: 'يوم', achievements: 'الإنجازات',
    actEyebrow: 'النشاط', actTitle: 'أسابيعك الأخيرة', actLead: 'كل مربع يوم: كلما كان أغمق كانت الأعمال المسجّلة في ذلك اليوم أكثر.',
    heatTitle: 'آخر ١٢ أسبوعًا', heatAria: (n) => `أيام النشاط في آخر ١٢ أسبوعًا: ${n}`, less: 'أقل', more: 'أكثر',
    last7: 'آخر ٧ أيام', last7Sub: 'الأعمال المسجّلة في اليوم', months: 'أيام النشاط حسب الشهر', monthsSub: 'آخر ستة أشهر',
    worshipEyebrow: 'العبادة', worshipTitle: 'الصلاة والعبادة اليومية', worshipLead: 'تُجمع علامات صفحة مواقيت الصلاة مع علامات المتابعة اليومية.',
    perPrayer: 'حسب الصلاة', perPrayerSub: 'عدد الأيام المسجّلة', weekByDay: 'هذا الأسبوع يومًا بيوم', weekByDaySub: 'النسبة من الأعمال العشرة',
    learnEyebrow: 'القرآن والعلم', learnTitle: 'القراءة والتعلّم', learnLead: 'السور التي فتحتها في قارئ القرآن، والحفظ، ودورة العربية، والاختبارات.',
    coverage: 'السور المفتوحة', ayahs: (n) => `في هذه السور ${n} آية (${Math.round(n / 62.36)}٪ من القرآن)`,
    topSurahs: 'أكثر السور قراءة', topSurahsSub: 'عدد مرات الفتح', hifz: 'الحفظ',
    course: 'دورة اللغة العربية', lessons: (a, b) => `اجتزت ${a} من ${b} دروس`, openCourse: 'اذهب إلى الدورة',
    games: 'الاختبارات', gamesSub: 'أفضل نتيجة من ١٠', noGames: 'لم تُجرِ أي اختبار بعد.', play: 'افتح الاختبار',
    otherEyebrow: 'الحديث والدعاء والصدقة', otherTitle: 'ما حفظته وما قدّمته', otherLead: 'الأحاديث والأدعية المفضلة، ومذكرة الدعاء، والذكر، وسجل الصدقة.',
    dhikr: 'الذكر (المجموع)', none: 'لا سجلات بعد.',
    achEyebrow: 'التحفيز', achLead: 'الشارات تذكير بالمداومة؛ والميزان الحقيقي النية والإخلاص.',
  },
  tr: {
    how: 'Burada yalnızca bu cihazda işaretledikleriniz sayılır: Kur’an okuma, namaz ve günlük takip, zikir, sadaka günlüğü ve bilgi yarışmaları. Hiçbir şey sunucuya gönderilmez.',
    bestStreak: 'En uzun seri', days: 'gün', achievements: 'Başarılar',
    actEyebrow: 'Aktivite', actTitle: 'Son haftalarınız', actLead: 'Her kare bir gündür: ne kadar koyuysa o gün o kadar çok amel işaretlenmiştir.',
    heatTitle: 'Son 12 hafta', heatAria: (n) => `Son 12 haftada ${n} aktif gün`, less: 'Az', more: 'Çok',
    last7: 'Son 7 gün', last7Sub: 'günde işaretlenen ameller', months: 'Aylara göre aktif günler', monthsSub: 'son 6 ay',
    worshipEyebrow: 'İbadet', worshipTitle: 'Namaz ve günlük ibadet', worshipLead: 'Namaz vakitleri sayfasındaki ve günlük takipteki işaretler birlikte sayılır.',
    perPrayer: 'Namazlara göre', perPrayerSub: 'kaç gün işaretlendi', weekByDay: 'Bu hafta günlere göre', weekByDaySub: '10 amelden yüzde kaçı',
    learnEyebrow: 'Kur’an ve ilim', learnTitle: 'Okuma ve öğrenme', learnLead: 'Kur’an okuyucuda açtığınız sureler, hıfz, Arapça kursu ve bilgi yarışmaları.',
    coverage: 'Açılan sureler', ayahs: (n) => `bu surelerde ${n} ayet var (Kur’an’ın %${Math.round(n / 62.36)}’i)`,
    topSurahs: 'En çok okunan sureler', topSurahsSub: 'kaç kez açıldı', hifz: 'Hıfz (ezber)',
    course: 'Arapça kursu', lessons: (a, b) => `${b} dersten ${a} tanesi geçildi`, openCourse: 'Kursa git',
    games: 'Bilgi yarışmaları', gamesSub: '10 sorudan en iyi sonuç', noGames: 'Henüz yarışma oynanmadı.', play: 'Yarışmayı aç',
    otherEyebrow: 'Hadis, dua, sadaka', otherTitle: 'Kaydettikleriniz ve hayırlarınız', otherLead: 'Favori hadis ve dualar, dua günlüğü, zikir ve sadaka kayıtları.',
    dhikr: 'Zikir (toplam)', none: 'Henüz kayıt yok.',
    achEyebrow: 'Motivasyon', achLead: 'Rozetler düzenliliği hatırlatmak içindir; asıl ölçü niyet ve ihlastır.',
  },
}
const PRAYER_LABEL = {
  az: ['Sübh', 'Zöhr', 'Əsr', 'Məğrib', 'İşa'],
  en: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  ru: ['Фаджр', 'Зухр', 'Аср', 'Магриб', 'Иша'],
  ar: ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'],
  tr: ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'],
}
const LOCALE = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar-u-nu-latn', tr: 'tr-TR' }
// Brauzerlərin bəzisində 'az' lokalı yoxdur (Chromium "Mon", "M06" yazır) — az üçün öz qısaltmalarımız
const AZ_WD = ['Baz', 'B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən']
const AZ_MON = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']
const surahName = (n, lang) => getSurahLocal(n, lang)?.name || SURAH_TABLE[n - 1]?.[lang === 'ar' ? 4 : 5] || String(n)

// Boş vəziyyətdəki "haradan başlamaq olar" keçidləri (adlar navigation.js-dən — 5 dildə)
const START_KEYS = ['quran', 'dailytracker', 'dhikr']
const START_TITLE = {
  az: 'Buradan başlayın', en: 'Start here', ru: 'С чего начать', ar: 'ابدأ من هنا', tr: 'Buradan başlayın',
}

const LABELS = {
  az: { title:'Statistika', subtitle:'Fəaliyyətinizin ümumi icmalı', overview:'Ümumi baxış', daysActive:'Aktiv gün', prayers:'Namaz', quranSessions:'Quran', favHadiths:'Sevimli hədis', duasSaved:'Dua', charityDeeds:'Sədəqə', prayerStats:'Namaz statistikası', total:'Ümumi', thisWeek:'Bu həftə', thisMonth:'Bu ay', rate:'Tamamlanma', streak:'Ardıcıl gün', quranStats:'Quran statistikası', sessions:'Sessiya', surahs:'Surə', hifzProgress:'Hifz irəliləyişi', memorized:'Əzbər', inProgress:'Davam edir', notStarted:'Başlanmayıb', hadithDua:'Hədis və dua', favs:'Sevimlilər', duaJournal:'Dua gündəliyi', active:'Aktiv', answered:'Qəbul olunan', quizScores:'Kviz xalları', charityStats:'Sədəqə', totalAmount:'Ümumi məbləğ', byType:'Növə görə', dailyTracker:'Gündəlik izləyici', quranGame:'Quran müsabiqəsi', today:'Bu gün', weekAvg:'Həftəlik orta', achievements:'Nailiyyətlər', achieved:'Qazanıldı', locked:'Kilidli', bestScore:'Ən yaxşı', noData:'Hələ məlumat yoxdur. Tətbiqi istifadə etdikcə statistikanız burada görünəcək.' },
  en: { title:'Analytics', subtitle:'Your complete activity summary', overview:'Overview', daysActive:'Days active', prayers:'Prayers', quranSessions:'Quran', favHadiths:'Fav hadiths', duasSaved:'Duas', charityDeeds:'Charity', prayerStats:'Prayer Statistics', total:'Total', thisWeek:'This week', thisMonth:'This month', rate:'Completion', streak:'Day streak', quranStats:'Quran Statistics', sessions:'Sessions', surahs:'Surahs', hifzProgress:'Hifz Progress', memorized:'Memorized', inProgress:'In progress', notStarted:'Not started', hadithDua:'Hadith & Dua', favs:'Favorites', duaJournal:'Dua Journal', active:'Active', answered:'Answered', quizScores:'Quiz Scores', charityStats:'Charity', totalAmount:'Total amount', byType:'By type', dailyTracker:'Daily Tracker', quranGame:'Quran Quiz', today:'Today', weekAvg:'Week average', achievements:'Achievements', achieved:'Achieved', locked:'Locked', bestScore:'Best', noData:'No data yet. Your statistics will appear here as you use the app.' },
  ru: { title:'Аналитика', subtitle:'Полная сводка вашей активности', overview:'Обзор', daysActive:'Дней активности', prayers:'Намазы', quranSessions:'Коран', favHadiths:'Избранные хадисы', duasSaved:'Дуа', charityDeeds:'Садака', prayerStats:'Статистика намаза', total:'Всего', thisWeek:'Эта неделя', thisMonth:'Этот месяц', rate:'Выполнение', streak:'Дней подряд', quranStats:'Статистика Корана', sessions:'Сессии', surahs:'Суры', hifzProgress:'Прогресс хифза', memorized:'Выучено', inProgress:'В процессе', notStarted:'Не начато', hadithDua:'Хадисы и дуа', favs:'Избранное', duaJournal:'Дневник дуа', active:'Активные', answered:'Отвеченные', quizScores:'Баллы викторины', charityStats:'Садака', totalAmount:'Общая сумма', byType:'По типу', dailyTracker:'Ежедневный трекер', quranGame:'Викторина Корана', today:'Сегодня', weekAvg:'Среднее за неделю', achievements:'Достижения', achieved:'Получено', locked:'Заблокировано', bestScore:'Лучший', noData:'Пока нет данных. Статистика появится по мере использования.' },
  ar: { title:'الإحصائيات', subtitle:'ملخص نشاطك الكامل', overview:'نظرة عامة', daysActive:'أيام النشاط', prayers:'الصلوات', quranSessions:'القرآن', favHadiths:'أحاديث مفضلة', duasSaved:'أدعية', charityDeeds:'صدقات', prayerStats:'إحصائيات الصلاة', total:'الإجمالي', thisWeek:'هذا الأسبوع', thisMonth:'هذا الشهر', rate:'الإتمام', streak:'أيام متتالية', quranStats:'إحصائيات القرآن', sessions:'جلسات', surahs:'سور', hifzProgress:'تقدم الحفظ', memorized:'محفوظ', inProgress:'قيد التقدم', notStarted:'لم يبدأ', hadithDua:'الحديث والدعاء', favs:'المفضلة', duaJournal:'مذكرة الدعاء', active:'نشط', answered:'مستجاب', quizScores:'نتائج الاختبار', charityStats:'الصدقة', totalAmount:'المبلغ الإجمالي', byType:'حسب النوع', dailyTracker:'المتابعة اليومية', quranGame:'مسابقة القرآن', today:'اليوم', weekAvg:'متوسط الأسبوع', achievements:'الإنجازات', achieved:'تم', locked:'مقفل', bestScore:'الأفضل', noData:'لا بيانات بعد. ستظهر إحصائياتك هنا مع الاستخدام.' },
  tr: { title:'İstatistikler', subtitle:'Aktivite özetiniz', overview:'Genel Bakış', daysActive:'Aktif gün', prayers:'Namazlar', quranSessions:'Kuran', favHadiths:'Favori hadisler', duasSaved:'Dualar', charityDeeds:'Sadaka', prayerStats:'Namaz İstatistikleri', total:'Toplam', thisWeek:'Bu hafta', thisMonth:'Bu ay', rate:'Tamamlanma', streak:'Ardışık gün', quranStats:'Kuran İstatistikleri', sessions:'Oturum', surahs:'Sure', hifzProgress:'Hıfz İlerlemesi', memorized:'Ezber', inProgress:'Devam ediyor', notStarted:'Başlanmadı', hadithDua:'Hadis & Dua', favs:'Favoriler', duaJournal:'Dua Günlüğü', active:'Aktif', answered:'Kabul edilen', quizScores:'Bilgi Yarışması Puanları', charityStats:'Sadaka', totalAmount:'Toplam tutar', byType:'Türe göre', dailyTracker:'Günlük Takip', quranGame:'Kuran Yarışması', today:'Bugün', weekAvg:'Hafta ortalaması', achievements:'Başarılar', achieved:'Kazanıldı', locked:'Kilitli', bestScore:'En iyi', noData:'Henüz veri yok. İstatistikleriniz kullandıkça görünecek.' },
}

// localStorage-dakı daxili açarların (charity_log.type, quiz_scores,
// quran_game_scores) istifadəçiyə göstərilən adları. Əvvəl açar olduğu kimi
// ("money", "hadith", "Quran Game — complete") bütün dillərdə görünürdü.
// Sədəqə növləri CharityPage.jsx-dəki DEED_TYPES ilə eynidir.
const CHARITY_TYPES = {
  money:     { az:'Pul', en:'Money', ru:'Деньги', ar:'مال', tr:'Para' },
  food:      { az:'Yemək', en:'Food', ru:'Еда', ar:'طعام', tr:'Yemek' },
  smile:     { az:'Gülüş', en:'Smile', ru:'Улыбка', ar:'ابتسامة', tr:'Gülümseme' },
  knowledge: { az:'Elm', en:'Knowledge', ru:'Знание', ar:'علم', tr:'İlim' },
  dua:       { az:'Dua', en:'Dua', ru:'Дуа', ar:'دعاء', tr:'Dua' },
  helping:   { az:'Kömək', en:'Helping', ru:'Помощь', ar:'مساعدة', tr:'Yardım' },
  clothing:  { az:'Geyim', en:'Clothing', ru:'Одежда', ar:'ملابس', tr:'Giyim' },
  other:     { az:'Digər', en:'Other', ru:'Другое', ar:'أخرى', tr:'Diğer' },
}
// Kviz kateqoriyaları — QuizPage.jsx-dəki adlar
const QUIZ_CATEGORIES = {
  quran:  { az:'Quran', en:'Quran', ru:'Коран', ar:'القرآن', tr:'Kuran' },
  hadith: { az:'Hədis', en:'Hadith', ru:'Хадис', ar:'الحديث', tr:'Hadis' },
  names:  { az:'99 Ad', en:'99 Names', ru:'99 Имён', ar:'٩٩ اسم', tr:'99 İsim' },
  ibadah: { az:'İbadət fiqhi', en:'Fiqh of worship', ru:'Фикх поклонения', ar:'فقه العبادات', tr:'İbadet fıkhı' },
}
// Quran müsabiqəsinin rejimləri — QuranGamePage.jsx-dəki adlar
const QG_MODES = {
  complete: { az:'Ayəni tamamla', en:'Complete the verse', ru:'Завершите аят', ar:'أكمل الآية', tr:'Ayeti tamamla' },
  surah:    { az:'Surəni tap', en:'Find the surah', ru:'Найдите суру', ar:'اعثر على السورة', tr:'Sureyi bul' },
}
const labelOf = (map, key, lang) => map[key]?.[lang] || map[key]?.en || key

// localStorage oxuması: dəyər gözlənilən formada deyilsə (pozuq JSON, null,
// massiv əvəzinə obyekt …) ehtiyat dəyər qaytarılır — səhifə çökməsin
function safeJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const v = JSON.parse(raw)
    if (Array.isArray(fallback)) return Array.isArray(v) ? v : fallback
    if (fallback && typeof fallback === 'object') return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
    return v ?? fallback
  } catch { return fallback }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
// Gün açarı YERLİ tarixlə — digər səhifələr (DailyTracker, Prayer) belə yazır.
// toISOString() UTC-dir: Bakıda 00:00–03:59 arası "bu gün" dünən sayılırdı
function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayStr() { return localDate() }

function getWeekDates() {
  const d = new Date(); const dates = []
  const day = d.getDay() || 7
  const mon = new Date(d); mon.setDate(d.getDate() - day + 1)
  for (let i = 0; i < 7; i++) {
    const dd = new Date(mon); dd.setDate(mon.getDate() + i)
    dates.push(localDate(dd))
  }
  return dates
}

// Gündəlik izləyicidəki fəaliyyətlərin sayı (DailyTrackerPage.jsx → ACTIVITIES)
const TRACKER_ITEMS = 10
const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function getMonthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function calcStreak(dates) {
  if (!dates || !dates.length) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  let streak = 0; const today = new Date()
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    if (sorted[i] === localDate(expected)) streak++
    else break
  }
  return streak
}

function calcBestStreak(dates) {
  if (!dates || !dates.length) return 0
  const sorted = [...new Set(dates)].filter(d => DATE_RE.test(d)).sort()
  if (!sorted.length) return 0
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (curr - prev) / 86400000
    if (diff === 1) { cur++; if (cur > best) best = cur }
    else cur = 1
  }
  return best
}

export default function AnalyticsPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const data = useMemo(() => {
    // 1. Namaz: /prayer ('muslim_cc_prayer_stats' → { 'YYYY-MM-DD_Fajr': true })
    // və /dailytracker ('daily_tracker' → { 'YYYY-MM-DD': { fajr: true } }) birləşdirilir.
    // Əvvəl mövcud olmayan 'prayer_stats' açarı oxunurdu — namaz sayı həmişə 0 idi
    const dailyTracker = safeJSON('daily_tracker', {})
    const prayerByDate = {}
    const markPrayer = (date, p) => { (prayerByDate[date] ||= new Set()).add(p) }
    for (const [k, v] of Object.entries(safeJSON('muslim_cc_prayer_stats', {}))) {
      const m = /^(\d{4}-\d{2}-\d{2})_(Fajr|Dhuhr|Asr|Maghrib|Isha)$/.exec(k)
      if (m && v) markPrayer(m[1], m[2].toLowerCase())
    }
    for (const [date, day] of Object.entries(dailyTracker)) {
      if (!DATE_RE.test(date) || !day || typeof day !== 'object') continue
      for (const p of PRAYER_NAMES) if (day[p] === true) markPrayer(date, p)
    }
    const prayerDates = Object.keys(prayerByDate)
    let totalPrayers = 0
    let weekPrayers = 0
    let monthPrayers = 0
    const weekDates = getWeekDates()
    const monthPfx = getMonthPrefix()
    const maxDaily = 5

    for (const [date, set] of Object.entries(prayerByDate)) {
      const dayCount = set.size
      totalPrayers += dayCount
      if (weekDates.includes(date)) weekPrayers += dayCount
      if (date.startsWith(monthPfx)) monthPrayers += dayCount
    }
    const prayerRate = prayerDates.length > 0 ? Math.round((totalPrayers / (prayerDates.length * maxDaily)) * 100) : 0
    const prayerStreak = calcBestStreak(prayerDates)

    // 2. Quran stats
    const quranStats = safeJSON('quran_stats', { reads: {}, sessions: 0, dates: [] })
    const quranSessions = Number(quranStats.sessions) || 0
    const quranReads = quranStats.reads && typeof quranStats.reads === 'object' ? quranStats.reads : {}
    const uniqueSurahs = Math.min(114, Object.keys(quranReads).length)
    const quranDates = Array.isArray(quranStats.dates) ? quranStats.dates.filter(d => typeof d === 'string' && DATE_RE.test(d)) : []
    const quranStreak = calcStreak(quranDates)

    // 3. Hifz progress
    const hifzProgress = safeJSON('hifz_progress', {})
    let hifzMemorized = 0, hifzInProgress = 0, hifzNotStarted = 0
    const totalSurahs = 114
    for (const v of Object.values(hifzProgress)) {
      if (v === 2) hifzMemorized++
      else if (v === 1) hifzInProgress++
    }
    hifzMemorized = Math.min(hifzMemorized, totalSurahs)
    hifzInProgress = Math.min(hifzInProgress, totalSurahs - hifzMemorized)
    hifzNotStarted = totalSurahs - hifzMemorized - hifzInProgress

    // 4. Hadith favs
    const hadithFavs = safeJSON('hadith_favs', [])

    // 5. Dua favs
    const duaFavs = safeJSON('dua_favs', [])

    // 6. Dua journal
    const duaJournal = safeJSON('dua_journal', { duas: [] })
    const journalDuas = Array.isArray(duaJournal.duas) ? duaJournal.duas.filter(d => d && typeof d === 'object') : []
    const duaActive = journalDuas.filter(d => !d.answered).length
    const duaAnswered = journalDuas.filter(d => d.answered).length

    // 7. Charity log
    const charityLog = safeJSON('charity_log', []).filter(e => e && typeof e === 'object')
    const totalCharity = charityLog.length
    const totalAmount = charityLog.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    const charityDates = charityLog.map(e => e.date).filter(d => typeof d === 'string' && DATE_RE.test(d))
    const charityStreak = calcStreak(charityDates)
    const charityByType = {}
    for (const e of charityLog) {
      const tp = typeof e.type === 'string' && e.type ? e.type : 'other'
      charityByType[tp] = (charityByType[tp] || 0) + 1
    }
    const maxTypeCount = Math.max(1, ...Object.values(charityByType))

    // 8. Gündəlik izləyici — faiz 10 fəaliyyətə görə (əvvəl yalnız saxlanmış
    // açarlara bölünürdü: bir qeyd işarələnən kimi "100%" görünürdü).
    // /prayer-də işarələnən namazlar da sayılır (iki səhifə sinxrondur)
    const doneOn = (date) => {
      const dd = dailyTracker[date] && typeof dailyTracker[date] === 'object' ? dailyTracker[date] : {}
      const keys = new Set(Object.keys(dd).filter(k => dd[k] === true))
      prayerByDate[date]?.forEach(p => keys.add(p))
      return Math.min(TRACKER_ITEMS, keys.size)
    }
    const todayKey = todayStr()
    const todayTotal = TRACKER_ITEMS
    const todayDone = doneOn(todayKey)
    const todayPct = Math.round((todayDone / todayTotal) * 100)

    const weekAvgItems = weekDates.map(wd => doneOn(wd) / TRACKER_ITEMS)
    const weekAvg = Math.round((weekAvgItems.reduce((a, b) => a + b, 0) / 7) * 100)

    // 9. Zikr — /dhikr ömürlük sayğacı 'dhikr_count_total'-a yazır (aşağıdakı
    // 'dhikr_count*' dövrü onu oxuyur); 'dhikr_sessions' köhnə formatdır
    let dhikrTotal = 0
    const dhikrSessions = safeJSON('dhikr_sessions', null)
    if (dhikrSessions && typeof dhikrSessions === 'object') {
      if (Array.isArray(dhikrSessions)) {
        dhikrTotal = dhikrSessions.reduce((s, e) => s + (Number(e?.count) || 0), 0)
      } else {
        dhikrTotal = Object.values(dhikrSessions).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
      }
    }
    // also check common dhikr keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('dhikr_count')) {
        dhikrTotal += parseInt(localStorage.getItem(k)) || 0
      }
    }

    // 10. Quiz scores
    // Yalnız rəqəm xallar (obyekt/sətir "[object Object]" kimi görünməsin)
    const numbersOnly = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => Number.isFinite(v)))
    const quizScores = numbersOnly(safeJSON('quiz_scores', {}))
    // Quran müsabiqəsi ilk açılışda { complete: 0, surah: 0 } yazır — 0 xal göstərilmir
    const quranGameScores = Object.fromEntries(Object.entries(numbersOnly(safeJSON('quran_game_scores', {}))).filter(([, v]) => v > 0))

    // Collect all unique dates
    const allDatesSet = new Set()
    prayerDates.forEach(d => allDatesSet.add(d))
    quranDates.forEach(d => allDatesSet.add(d))
    Object.keys(dailyTracker).filter(d => DATE_RE.test(d) && doneOn(d) > 0).forEach(d => allDatesSet.add(d))
    charityDates.filter(d => typeof d === 'string' && DATE_RE.test(d)).forEach(d => allDatesSet.add(d))
    const daysActive = allDatesSet.size

    // Any streak >= 7 or 30
    const allStreaks = [prayerStreak, quranStreak, charityStreak, calcBestStreak(Object.keys(dailyTracker).filter(d => doneOn(d) > 0))]
    const maxStreak = Math.max(0, ...allStreaks)

    // ── v3 qrafikləri üçün ──
    // Namazlar üzrə: hər namaz neçə gün işarələnib
    const perPrayer = PRAYER_NAMES.map(p => Object.values(prayerByDate).filter(set => set.has(p)).length)
    // Günün "çəkisi": izləyici əməlləri (namazlar daxil) + Quran + sədəqə
    const quranDateSet = new Set(quranDates)
    const charityPerDay = {}
    for (const d of charityDates) charityPerDay[d] = (charityPerDay[d] || 0) + 1
    const dayScore = (date) => doneOn(date) + (quranDateSet.has(date) ? 1 : 0) + (charityPerDay[date] || 0)
    const weekPct = weekDates.map(wd => Math.round((doneOn(wd) / TRACKER_ITEMS) * 100))
    // Ən çox oxunan surələr (ilk 5) və açılan surələrdəki ayə sayı
    const topSurahs = Object.entries(quranReads)
      .map(([k, v]) => [Number(k), Number(v) || 0])
      .filter(([k, v]) => k >= 1 && k <= 114 && v > 0)
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 5)
    const ayahsOpened = Object.keys(quranReads).map(Number).filter(k => k >= 1 && k <= 114)
      .reduce((s, k) => s + (SURAH_TABLE[k - 1]?.[2] || 0), 0)
    const course = readProgress()

    return {
      perPrayer, dayScore, weekPct, topSurahs, ayahsOpened, weekDates,
      coursePassed: passedCount(course), coursePct: percentDone(course), courseStarted: Object.keys(course.best).length > 0 || !!course.last,
      daysActive, totalPrayers, weekPrayers, monthPrayers, prayerRate, prayerStreak,
      quranSessions, uniqueSurahs, quranStreak,
      hifzMemorized, hifzInProgress, hifzNotStarted,
      hadithFavs: Array.isArray(hadithFavs) ? hadithFavs.length : 0, duaFavs: Array.isArray(duaFavs) ? duaFavs.length : 0,
      duaActive, duaAnswered, journalTotal: journalDuas.length,
      quizScores, quranGameScores,
      totalCharity, totalAmount, charityStreak, charityByType, maxTypeCount,
      todayPct, todayDone, todayTotal, weekAvg,
      dhikrTotal, maxStreak,
    }
  }, [])

  // Hər hansı bir bölmədə məlumat varsa "məlumat yoxdur" göstərilmir
  // (əvvəl yalnız tarixli fəaliyyətə baxılırdı: sevimlilər, hifz, zikr nəzərə alınmırdı)
  const hasData = data.daysActive > 0 || data.hadithFavs > 0 || data.duaFavs > 0 || data.journalTotal > 0 ||
    data.hifzMemorized + data.hifzInProgress > 0 || data.dhikrTotal > 0 || Object.keys(data.quizScores).length > 0 ||
    Object.keys(data.quranGameScores).length > 0 || data.courseStarted

  // Achievements
  const achievements = useMemo(() => [
    // icon — Icon.jsx adı (əvvəl emoji idi); kubok/alov ikonu olmadığı üçün
    // ən yaxın xətti ikonlar: medal (sahaba), ulduz, ildırım
    { icon: 'sahaba', name: { az:'İlk addım', en:'First step', ru:'Первый шаг', ar:'الخطوة الأولى', tr:'İlk adım' }, check: data.totalPrayers >= 1 },
    { icon: 'quran', name: { az:'Quran sevər', en:'Quran lover', ru:'Любитель Корана', ar:'محب القرآن', tr:'Kuran sever' }, check: data.uniqueSurahs >= 10 },
    { icon: 'dhikr', name: { az:'Zikr ustası', en:'Dhikr master', ru:'Мастер зикра', ar:'سيد الذكر', tr:'Zikir ustası' }, check: data.dhikrTotal >= 1000 },
    { icon: 'donate', name: { az:'Əliaçıq', en:'Generous', ru:'Щедрый', ar:'كريم', tr:'Cömert' }, check: data.totalCharity >= 10 },
    { icon: 'prayerguide', name: { az:'Alim', en:'Scholar', ru:'Учёный', ar:'عالم', tr:'Âlim' }, check: Object.values(data.quizScores).some(v => v >= 10) },
    { icon: 'hifz', name: { az:'Hifz yolçusu', en:'Hifz traveler', ru:'Путник хифза', ar:'مسافر الحفظ', tr:'Hıfz yolcusu' }, check: data.hifzMemorized >= 5 },
    { icon: 'hadith', name: { az:'Hədis kolleksiyaçısı', en:'Hadith collector', ru:'Коллекционер хадисов', ar:'جامع الأحاديث', tr:'Hadis koleksiyoncusu' }, check: data.hadithFavs >= 20 },
    { icon: 'duas', name: { az:'Dua edən', en:'Supplicator', ru:'Молящийся', ar:'الداعي', tr:'Dua eden' }, check: data.journalTotal >= 10 },
    { icon: 'bolt', name: { az:'7 gün ardıcıl', en:'7 day streak', ru:'7 дней подряд', ar:'٧ أيام متتالية', tr:'7 gün ardışık' }, check: data.maxStreak >= 7 },
    { icon: 'star', name: { az:'Müntəzəm', en:'Consistent', ru:'Постоянный', ar:'مثابر', tr:'Düzenli' }, check: data.maxStreak >= 30 },
  ], [data])

  const achievedCount = achievements.filter(a => a.check).length

  // Daxili keçid: adi klikdə SPA naviqasiyası, Ctrl/orta düymə — yeni vərəq
  const go = (key) => (e) => {
    if (!setPage || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    setPage(key)
  }

  const x = X[lang] || X.az
  const locale = LOCALE[lang] || LOCALE.az
  const fmtDay = (d, opt) => {
    if (lang === 'az') {
      if (opt.weekday) return AZ_WD[d.getDay()]
      if (opt.day) return `${d.getDate()} ${AZ_MON[d.getMonth()]}`
      return AZ_MON[d.getMonth()]
    }
    try { return new Intl.DateTimeFormat(locale, opt).format(d) } catch { return '' }
  }

  // ── Fəaliyyət xəritəsi: son 12 həftə (bazar ertəsindən başlayır), gələcək günlər boş ──
  const heat = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dow = (today.getDay() + 6) % 7          // 0 = bazar ertəsi
    const start = new Date(today); start.setDate(today.getDate() - dow - 7 * 11)
    const cells = []
    let active = 0
    for (let i = 0; i < 84; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      const key = localDate(d)
      const future = d > today
      const score = future ? 0 : data.dayScore(key)
      if (score > 0) active++
      const level = score === 0 ? 0 : score <= 2 ? 1 : score <= 5 ? 2 : score <= 8 ? 3 : 4
      cells.push({ key, level, future, title: `${fmtDay(d, { day: 'numeric', month: 'short' })}: ${score}` })
    }
    return { cells, active }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang])

  const last7 = useMemo(() => {
    const out = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      out.push({ key: i, label: fmtDay(d, { weekday: 'short' }), value: data.dayScore(localDate(d)), current: i === 0 })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang])

  const months = useMemo(() => {
    const out = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const pfx = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      // Ayın çəkisi > 0 olan günlərinin sayı
      const daysIn = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      let n = 0
      for (let k = 1; k <= daysIn; k++) if (data.dayScore(`${pfx}-${String(k).padStart(2, '0')}`) > 0) n++
      out.push({ key: pfx, label: fmtDay(d, { month: 'short' }), value: n, current: i === 0 })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang])

  const quizRows = [
    ...Object.entries(data.quizScores).map(([k, v]) => ({ key: `q-${k}`, label: labelOf(QUIZ_CATEGORIES, k, lang), value: Math.min(10, v) })),
    ...Object.entries(data.quranGameScores).map(([k, v]) => ({ key: `g-${k}`, label: `${t.quranGame}: ${labelOf(QG_MODES, k, lang)}`, value: Math.min(10, v), tone: 2 })),
  ]
  const charityRows = Object.entries(data.charityByType).sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ key: type, label: labelOf(CHARITY_TYPES, type, lang), value: count }))

  const today = todayStr()

  return (
    <div className="analytics-page">
      {/* v3: kompakt split hero — solda izah və açar rəqəmlər, sağda bugünkü halqa */}
      <header className="ui-page-hero ui-page-hero--split analytics-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <div className="ui-page-hero__crumbs"><Breadcrumb setPage={setPage} current={t.title} /></div>
            <span className="ui-eyebrow">{navGroupLabel('quran', lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.subtitle}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {x.how}</p>
            <ul className="ui-page-hero__stats">
              <li><b className="ui-num" data-count={data.daysActive}>{data.daysActive}</b><span>{t.daysActive}</span></li>
              <li><b className="ui-num" data-count={data.maxStreak}>{data.maxStreak}</b><span>{x.bestStreak}</span></li>
              <li><b className="ui-num" dir="ltr">{achievedCount}/{achievements.length}</b><span>{x.achievements}</span></li>
            </ul>
          </div>
          <div className="ui-page-hero__aside analytics-hero__aside">
            <div className="ui-card analytics-today">
              <ProgressRing value={data.todayDone} max={data.todayTotal} size={96} thickness={9} label={t.today}
                sub={<bdi dir="ltr">{data.todayDone} / {data.todayTotal}</bdi>} />
              <a className="ui-link" href={pathFor('dailytracker', lang)} onClick={go('dailytracker')}>
                {navLabel('dailytracker', lang)} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Məlumat yoxdur — izah + haradan başlamaq olar */}
      {!hasData && (
        <div className="ui-container analytics-nodata-wrap">
          <div className="analytics-nodata" role="status" data-reveal="">
            <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent" aria-hidden="true"><Icon name="analytics" /></span>
            <div className="analytics-nodata-body">
              <p className="analytics-nodata-text">{t.noData}</p>
              <div className="analytics-nodata-links" aria-label={START_TITLE[lang] || START_TITLE.az} role="group">
                {START_KEYS.map(k => (
                  <a key={k} className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor(k, lang)} onClick={go(k)}>
                    <Icon name={k} className="ui-btn__icon" />{navLabel(k, lang)}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İllik icmal — cari hicri il */}
      {hasData && <YearReview />}

      {/* ── 1. Fəaliyyət ── */}
      <section className="ui-section ui-section--tight analytics-sec" aria-labelledby="an-act">
        <div className="ui-container">
          <SecHead id="an-act" eyebrow={x.actEyebrow} title={x.actTitle} lead={x.actLead} />
          <div className="ui-stats analytics-overview" data-reveal="stagger">
            <StatTile icon="calendar" label={t.daysActive} value={data.daysActive} count={data.daysActive} />
            <StatTile icon="prayer" label={t.prayers} value={data.totalPrayers} count={data.totalPrayers} />
            <StatTile icon="quran" label={t.quranSessions} value={data.quranSessions} count={data.quranSessions} />
            <StatTile icon="dhikr" label={x.dhikr} value={data.dhikrTotal} count={data.dhikrTotal} />
            <StatTile icon="hadith" label={t.favHadiths} value={data.hadithFavs} count={data.hadithFavs} />
            <StatTile icon="donate" label={t.charityDeeds} value={data.totalCharity} count={data.totalCharity} />
          </div>

          <div className="analytics-act-grid" data-reveal="stagger">
            <ChartFigure title={x.heatTitle} sub={x.heatAria(heat.active)} className="analytics-heat-fig">
              <div className="analytics-heat" role="img" aria-label={x.heatAria(heat.active)}>
                {heat.cells.map((c, i) => (
                  <span key={c.key} className={`analytics-heat__cell l${c.level}${c.future ? ' is-future' : ''}`} style={{ '--hc': Math.floor(i / 7) }} title={c.future ? undefined : c.title} />
                ))}
              </div>
              <div className="analytics-heat-legend" aria-hidden="true">
                <span>{x.less}</span>
                {[0, 1, 2, 3, 4].map(l => <span key={l} className={`analytics-heat__cell l${l}`} />)}
                <span>{x.more}</span>
              </div>
            </ChartFigure>
            <ChartFigure title={x.last7} sub={x.last7Sub}>
              <ColumnChart data={last7} height={110} label={x.last7} />
            </ChartFigure>
            <ChartFigure title={x.months} sub={x.monthsSub}>
              <ColumnChart data={months} height={110} label={x.months} tone={3} />
            </ChartFigure>
          </div>
        </div>
      </section>

      {/* ── 2. İbadət: namaz + gündəlik izləyici ── */}
      <section className="ui-section ui-section--tight analytics-sec" aria-labelledby="an-wor">
        <div className="ui-container">
          <SecHead id="an-wor" eyebrow={x.worshipEyebrow} title={x.worshipTitle} lead={x.worshipLead} />
          <div className="analytics-sections">
            <Card icon="prayer" title={t.prayerStats}>
              <Nums items={[
                { label: t.total, value: data.totalPrayers, hl: true, count: data.totalPrayers },
                { label: t.thisWeek, value: data.weekPrayers },
                { label: t.thisMonth, value: data.monthPrayers },
                { label: t.streak, value: data.prayerStreak },
              ]} />
              <div className="analytics-meter">
                <span className="analytics-meter__row"><span>{t.rate}</span><b className="ui-num">{data.prayerRate}%</b></span>
                <ProgressBar value={data.prayerRate} label={t.rate} />
              </div>
              <ChartFigure title={x.perPrayer} sub={x.perPrayerSub} plain>
                <BarChart data={(PRAYER_LABEL[lang] || PRAYER_LABEL.az).map((label, i) => ({ key: i, label, value: data.perPrayer[i] }))}
                  max={Math.max(1, ...data.perPrayer)} label={x.perPrayer} />
              </ChartFigure>
            </Card>

            <Card icon="dailytracker" title={t.dailyTracker}>
              <div className="analytics-split">
                <div className="analytics-split-col">
                  <span className="analytics-stat-label">{t.today}</span>
                  <span className="analytics-stat-value highlight ui-num">{data.todayPct}%</span>
                  <ProgressBar value={data.todayDone} max={data.todayTotal} label={t.today} />
                  <span className="analytics-split-sub ui-num" dir="ltr">{data.todayDone} / {data.todayTotal}</span>
                </div>
                <div className="analytics-split-col">
                  <span className="analytics-stat-label">{t.weekAvg}</span>
                  <span className="analytics-stat-value ui-num">{data.weekAvg}%</span>
                  <ProgressBar value={data.weekAvg} label={t.weekAvg} tone={2} />
                  <span className="analytics-split-sub">{t.thisWeek}</span>
                </div>
              </div>
              <ChartFigure title={x.weekByDay} sub={x.weekByDaySub} plain>
                <ColumnChart height={100} max={100} label={x.weekByDay} format={v => `${v}%`}
                  data={data.weekDates.map((wd, i) => {
                    const [y, m, d] = wd.split('-').map(Number)
                    return { key: wd, label: fmtDay(new Date(y, m - 1, d), { weekday: 'short' }), value: data.weekPct[i], current: wd === today }
                  })} />
              </ChartFigure>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 3. Quran və elm ── */}
      <section className="ui-section ui-section--tight analytics-sec" aria-labelledby="an-learn">
        <div className="ui-container">
          <SecHead id="an-learn" eyebrow={x.learnEyebrow} title={x.learnTitle} lead={x.learnLead} />
          <div className="analytics-sections">
            <Card icon="quran" title={t.quranStats}>
              <div className="analytics-ring-row">
                <ProgressRing value={data.uniqueSurahs} max={114} size={84} thickness={8} label={x.coverage}
                  sub={<bdi dir="ltr">{data.uniqueSurahs} / 114</bdi>} />
                <p className="analytics-note">{x.ayahs(data.ayahsOpened)}</p>
              </div>
              <Nums items={[
                { label: t.sessions, value: data.quranSessions, hl: true, count: data.quranSessions },
                { label: t.surahs, value: `${data.uniqueSurahs} / 114`, ltr: true },
                { label: t.streak, value: data.quranStreak },
              ]} />
              <ChartFigure title={x.topSurahs} sub={x.topSurahsSub} plain>
                {data.topSurahs.length
                  ? <BarChart data={data.topSurahs.map(([n, v]) => ({ key: n, label: `${n}. ${surahName(n, lang)}`, value: v }))} label={x.topSurahs} />
                  : <p className="analytics-note">{x.none}</p>}
              </ChartFigure>
            </Card>

            <div className="analytics-stack">
              <Card icon="hifz" title={x.hifz}>
                <div className="analytics-ring-row">
                  <ProgressRing value={data.hifzMemorized} max={114} size={72} thickness={7} label={t.memorized}
                    sub={<bdi dir="ltr">{data.hifzMemorized} / 114</bdi>} />
                  <a className="ui-link" href={pathFor('hifz', lang)} onClick={go('hifz')}>
                    {navLabel('hifz', lang)} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                  </a>
                </div>
                <StackedBar label={x.hifz} segments={[
                  { label: t.memorized, value: data.hifzMemorized, tone: 1 },
                  { label: t.inProgress, value: data.hifzInProgress, tone: 2 },
                  { label: t.notStarted, value: data.hifzNotStarted, tone: 'muted' },
                ]} />
              </Card>

              <Card icon="arabic" title={x.course}>
                <div className="analytics-ring-row">
                  <ProgressRing value={data.coursePct} max={100} size={72} thickness={7} label={x.course}
                    sub={x.lessons(data.coursePassed, LESSONS.length)} />
                  <a className="ui-link" href={pathFor('arabic', lang)} onClick={go('arabic')}>
                    {x.openCourse} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                  </a>
                </div>
              </Card>

              <Card icon="quiz" title={x.games}>
                {quizRows.length ? (
                  <ChartFigure sub={x.gamesSub} plain>
                    <BarChart data={quizRows} max={10} format={v => `${v}/10`} label={x.games} />
                  </ChartFigure>
                ) : (
                  <div className="analytics-empty-row">
                    <p className="analytics-note">{x.noGames}</p>
                    <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('quiz', lang)} onClick={go('quiz')}>
                      <Icon name="quiz" className="ui-btn__icon" />{x.play}
                    </a>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Hədis, dua, sədəqə ── */}
      <section className="ui-section ui-section--tight analytics-sec" aria-labelledby="an-other">
        <div className="ui-container">
          <SecHead id="an-other" eyebrow={x.otherEyebrow} title={x.otherTitle} lead={x.otherLead} />
          <div className="analytics-sections">
            <Card icon="hadith" title={t.hadithDua}>
              <Nums items={[
                { label: t.favHadiths, value: data.hadithFavs, hl: true, count: data.hadithFavs },
                { label: t.duasSaved, value: data.duaFavs },
                { label: `${t.duaJournal} — ${t.active}`, value: data.duaActive },
                { label: `${t.duaJournal} — ${t.answered}`, value: data.duaAnswered },
              ]} />
              {data.journalTotal > 0 && (
                <StackedBar label={t.duaJournal} segments={[
                  { label: t.active, value: data.duaActive, tone: 3 },
                  { label: t.answered, value: data.duaAnswered, tone: 1 },
                ]} />
              )}
            </Card>

            <Card icon="donate" title={t.charityStats}>
              <Nums items={[
                { label: t.total, value: data.totalCharity, hl: true, count: data.totalCharity },
                { label: t.totalAmount, value: data.totalAmount.toFixed(2) },
                { label: t.streak, value: data.charityStreak },
              ]} />
              {charityRows.length > 0 && (
                <ChartFigure title={t.byType} plain>
                  <BarChart data={charityRows} tone={2} label={t.byType} />
                </ChartFigure>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* ── 5. Nailiyyətlər ── */}
      <section className="ui-section ui-section--tight analytics-sec" aria-labelledby="an-ach">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{x.achEyebrow}</span>
            <h2 className="ui-title" id="an-ach">{t.achievements} <span className="analytics-count ui-num" dir="ltr">{achievedCount}/{achievements.length}</span></h2>
            <p className="ui-lead">{x.achLead}</p>
          </div>
          {/* Telefonda üfüqi sürüşən nişan zolağı. tabIndex: klaviatura ilə
              də sürüşdürmək olsun (axe "scrollable-region-focusable") */}
          <ul className="analytics-achievements" data-reveal="stagger-zoom" tabIndex={0} aria-label={t.achievements}>
            {achievements.map((a, i) => (
              <li key={i} className={`analytics-badge ${a.check ? 'achieved' : 'locked'}`}>
                <span className="analytics-badge-icon" aria-hidden="true">
                  <Icon name={a.icon} size={20} />
                  {a.check && <span className="analytics-badge-tick"><Icon name="check" size={12} strokeWidth={3} /></span>}
                </span>
                <span className="analytics-badge-name">{a.name[lang] || a.name.az}</span>
                <span className="analytics-badge-status">{a.check ? t.achieved : t.locked}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

// ── Kiçik tərtibat komponentləri (render-də yenidən yaradılmasın deyə xaricdə) ──
function SecHead({ eyebrow, title, lead, id }) {
  return (
    <div className="ui-section-head" data-reveal>
      <span className="ui-eyebrow">{eyebrow}</span>
      <h2 className="ui-title" id={id}>{title}</h2>
      {lead && <p className="ui-lead">{lead}</p>}
    </div>
  )
}
// Bölmə kartı: ikon kafeli + h3
function Card({ icon, title, tone = '', children }) {
  return (
    <section className="ui-card analytics-card" data-reveal="up">
      <div className="analytics-card-header">
        <span className={`ui-icon-tile ui-icon-tile--sm${tone ? ` ui-icon-tile--${tone}` : ''}`} aria-hidden="true"><Icon name={icon} /></span>
        <h3 className="analytics-card-title">{title}</h3>
      </div>
      <div className="analytics-card-body">{children}</div>
    </section>
  )
}
// Kartın rəqəm sırası (dt/dd). hl — vurğulu rəqəm (e2e testi bu sinfə baxır)
function Nums({ items }) {
  return (
    <dl className={`analytics-nums analytics-nums--${items.length}`}>
      {items.map((it, i) => (
        <div key={i} className="analytics-num">
          <dt className="analytics-stat-label">{it.label}</dt>
          <dd className={`analytics-stat-value ui-num${it.hl ? ' highlight' : ''}`} dir={it.ltr ? 'ltr' : undefined}
            {...(it.count != null ? { 'data-count': it.count } : {})}>{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
