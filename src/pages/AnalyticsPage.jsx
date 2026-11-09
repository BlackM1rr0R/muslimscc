import { useCallback, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/AnalyticsPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import YearReview from '../components/YearReview'
import { navLabel } from '../data/navigation'
import { pathFor } from '../seo/routes.js'
import {
  ChartFigure, BarChart, ProgressRing, ProgressBar, StackedBar,
  ChartCard, KpiCard, RangeTabs, AreaChart, LineChart, CalendarHeatmap, RadialBars, FunnelChart,
  SegmentBreakdown, CompareBars, GoalRing, ActivityFeed, MiniTable, InlineBar, TrendCell, Delta, makeFormat,
} from '../components/viz'
import { pctDelta, fromDayKey, addDayKey, dayKeys } from '../components/viz/scale.js'
import { getSurahLocal } from '../data/surahNamesAz.js'
import { SURAH_TABLE } from '../data/mushafIndex.js'
import { readAnalytics, todayStr } from '../utils/analyticsData.js'
import { readStore, buildDays, getDay, catValues, dayScore, rangeStats, feedEvents, CATS, PRAYER_KEYS, DEED_KEYS } from '../utils/analyticsSeries.js'
import { readProgress, passedCount, percentDone } from '../components/arabic/progress.js'
import { LESSONS } from '../data/arabicCourse.js'
import { pickUi } from '../utils/uiText'
import { badgeList, syncBadges } from '../utils/badges.js'
import '../styles/BadgeShelf.css'
import { Stagger, StaggerItem } from '../motion/Stagger'
import PresenceSwap from '../motion/PresenceSwap'

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
    achEyebrow: 'Motivasiya', bShare: 'Paylaş', bEarned: 'Nişan qazandım', bSaved: 'Şəkil yükləndi', tier: { bronze: 'Bürünc', silver: 'Gümüş', gold: 'Qızıl' }, achLead: 'Nişanlar ardıcıllığı xatırlatmaq üçündür; əsl ölçü niyyət və ixlasdır.',
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
    achEyebrow: 'Motivation', bShare: 'Share', bEarned: 'Badge earned', bSaved: 'Image saved', tier: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' }, achLead: 'Badges are a reminder to stay consistent; the real measure is intention and sincerity.',
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
    achEyebrow: 'Мотивация', bShare: 'Поделиться', bEarned: 'Значок получен', bSaved: 'Картинка сохранена', tier: { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото' }, achLead: 'Значки лишь напоминают о постоянстве; истинная мера — намерение и искренность.',
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
    achEyebrow: 'التحفيز', bShare: 'مشاركة', bEarned: 'حصلت على وسام', bSaved: 'تم حفظ الصورة', tier: { bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي' }, achLead: 'الشارات تذكير بالمداومة؛ والميزان الحقيقي النية والإخلاص.',
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
    achEyebrow: 'Motivasyon', bShare: 'Paylaş', bEarned: 'Rozet kazandım', bSaved: 'Görsel kaydedildi', tier: { bronze: 'Bronz', silver: 'Gümüş', gold: 'Altın' }, achLead: 'Rozetler düzenliliği hatırlatmak içindir; asıl ölçü niyet ve ihlastır.',
  },
}
const PRAYER_LABEL = {
  az: ['Sübh', 'Zöhr', 'Əsr', 'Məğrib', 'İşa'],
  en: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  ru: ['Фаджр', 'Зухр', 'Аср', 'Магриб', 'Иша'],
  ar: ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'],
  tr: ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'],
}
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

// v6 (bento panel, viz v2) — yeni bölmələrin yazıları (5 dildə)
const V = {
  az: {
    salam: 'Əssəlamu aleykum', period: 'Dövr', ranges: { 7: '7 gün', 30: '30 gün', 90: '90 gün', 364: 'İl' },
    vs: (n) => (n === 364 ? 'keçən ilə görə' : `əvvəlki ${n} günə görə`),
    insMore: (p) => `Bu həftə keçən həftədən ${p} çox əməl qeyd etdiniz.`,
    insLess: (p) => `Bu həftə keçən həftədən ${p} az əməl qeyd olunub — davam etmək üçün gec deyil.`,
    insSame: 'Bu həftə keçən həftə qədər əməl qeyd etdiniz.',
    insFirst: (n) => `Bu həftə ${n} əməl qeyd etdiniz.`,
    insNone: 'Bu həftə hələ qeyd yoxdur — bu gün bir əməllə başlayın.',
    kPrayer: 'Namaz', kActive: 'Aktiv gün', kQuran: 'Quran günləri', kDhikr: 'Zikr',
    sparkOf: (s) => `${s}: dövr üzrə trend`,
    chartTitle: 'Əməllər dinamikası', chartSub: 'Gündə qeyd olunan əməllər: namaz, zikr və əzkar, Quran, sədəqə',
    dhikrSub: 'Gündəlik zikr sayı; ştrixli xətt — əvvəlki dövr', modeLabel: 'Göstərici', mDeeds: 'Əməllər', mDhikr: 'Zikr',
    cats: { prayer: 'Namaz', adhkar: 'Zikr və əzkar', quran: 'Quran', charity: 'Sədəqə' },
    heatTitle: 'Fəaliyyət təqvimi', heatSub: 'Hər xana bir gündür: nə qədər tünddürsə, bir o qədər çox əməl', deedsN: (n) => `${n} əməl`,
    radTitle: 'Namazlar', radSub: (n) => `dövrün ${n} günündə neçəsi qeyd olunub`,
    fnTitle: 'Davamlılıq', fnSub: 'Aktiv gündən tam günə — hər addım əvvəlkinin bir hissəsidir',
    fnSteps: ['Aktiv gün', 'Namazlı gün', '5/5 namaz', '5/5 namaz + Quran'], fnFoot: (p) => `Aktiv günlərin ${p}-i tam gün olub`,
    segTitle: 'Əməllərin bölgüsü', segSub: 'dövrdəki pay və əvvəlki dövrə görə dəyişmə',
    tblTitle: 'Zikr və əməllər', tblSub: 'neçə gün edilib, davamlılıq və son 8 həftə',
    cols: { deed: 'Əməl', days: 'Gün', rate: 'Davamlılıq', trend: 'Trend', delta: 'Dəyişmə' },
    deeds: { quran: 'Quran oxumaq', morning: 'Səhər əzkarı', evening: 'Axşam əzkarı', dhikr: 'Zikr', sadaqah: 'Sədəqə' },
    trendOf: (s) => `${s}: son 8 həftə`,
    wdTitle: 'Həftənin günləri', wdSub: 'gündə orta əməl — bu dövr və əvvəlki dövr',
    feedTitle: 'Son fəaliyyət', feedSub: 'son 60 gündə bu cihazda qeyd etdikləriniz', feedEmpty: 'Son 60 gündə qeyd yoxdur.',
    ev: {
      charity: (x) => `Sədəqə qeyd olundu: ${x}`, dhikr: (n, c) => (n ? `${n} — ${c} dəfə` : `Zikr dövrü — ${c} dəfə`),
      duaNew: 'Dua gündəliyinə yeni dua yazıldı', duaAnswered: 'Dua «qəbul oldu» kimi işarələndi', muhasabah: (n) => `Mühasəbə: ${n} bənd`,
      badge: (x) => `Nişan qazanıldı: ${x}`, quran: 'Quran oxundu', hifz: (n) => `Hifz: ${n} ayə təkrarı`, fullDay: '5 namazın hamısı qeyd olundu', fast: 'Könüllü oruc qeyd olundu',
    },
    chips: { prayer: 'Namaz', quran: 'Quran', hifz: 'Hifz', dhikr: 'Zikr', charity: 'Sədəqə', dua: 'Dua', muhasabah: 'Mühasəbə', badge: 'Nişan', fast: 'Oruc' },
    khatmTitle: 'Xətm planı', khatmSub: (d) => `${d} günlük plan · 604 səhifə`, pages: 'səh.', read: 'oxunub', planBy: 'Plana görə',
    todayTitle: 'Bu gün', todaySub: 'gündəlik izləyicinin 10 əməlindən', todayCenter: 'bu gün', openTracker: 'Gündəlik izləyiciyə keç',
    detEyebrow: 'Ətraflı', detTitle: 'Bölmələr üzrə', detLead: 'Hər bölmənin ümumi sayları — dövrdən asılı deyil.',
  },
  en: {
    salam: 'Assalamu alaikum', period: 'Period', ranges: { 7: '7 days', 30: '30 days', 90: '90 days', 364: 'Year' },
    vs: (n) => (n === 364 ? 'vs last year' : `vs previous ${n} days`),
    insMore: (p) => `This week you logged ${p} more deeds than last week.`,
    insLess: (p) => `This week has ${p} fewer deeds than last week — it is not too late to keep going.`,
    insSame: 'This week you logged as many deeds as last week.',
    insFirst: (n) => `This week you logged ${n} deeds.`,
    insNone: 'Nothing logged this week yet — start today with one deed.',
    kPrayer: 'Prayers', kActive: 'Active days', kQuran: 'Quran days', kDhikr: 'Dhikr',
    sparkOf: (s) => `${s}: trend over the period`,
    chartTitle: 'Deeds over time', chartSub: 'Deeds logged per day: prayer, dhikr and adhkar, Quran, charity',
    dhikrSub: 'Daily dhikr count; dashed line — previous period', modeLabel: 'Metric', mDeeds: 'Deeds', mDhikr: 'Dhikr',
    cats: { prayer: 'Prayer', adhkar: 'Dhikr and adhkar', quran: 'Quran', charity: 'Charity' },
    heatTitle: 'Activity calendar', heatSub: 'Each square is a day: the darker it is, the more deeds', deedsN: (n) => `${n} deeds`,
    radTitle: 'Prayers', radSub: (n) => `how many of the period’s ${n} days were marked`,
    fnTitle: 'Consistency', fnSub: 'From an active day to a complete day — each step is a part of the previous one',
    fnSteps: ['Active day', 'Day with prayer', '5/5 prayers', '5/5 prayers + Quran'], fnFoot: (p) => `${p} of active days were complete days`,
    segTitle: 'Deeds breakdown', segSub: 'share in the period and change vs the previous period',
    tblTitle: 'Dhikr and deeds', tblSub: 'days done, consistency and the last 8 weeks',
    cols: { deed: 'Deed', days: 'Days', rate: 'Consistency', trend: 'Trend', delta: 'Change' },
    deeds: { quran: 'Reading Quran', morning: 'Morning adhkar', evening: 'Evening adhkar', dhikr: 'Dhikr', sadaqah: 'Charity' },
    trendOf: (s) => `${s}: last 8 weeks`,
    wdTitle: 'Days of the week', wdSub: 'average deeds per day — this period and the previous one',
    feedTitle: 'Recent activity', feedSub: 'what you logged on this device in the last 60 days', feedEmpty: 'Nothing logged in the last 60 days.',
    ev: {
      charity: (x) => `Charity logged: ${x}`, dhikr: (n, c) => (n ? `${n} — ${c} times` : `Dhikr round — ${c} times`),
      duaNew: 'A new dua was added to the journal', duaAnswered: 'A dua was marked as answered', muhasabah: (n) => `Self-reckoning: ${n} items`,
      badge: (x) => `Badge earned: ${x}`, quran: 'Quran read', hifz: (n) => `Hifz: ${n} ayah reviews`, fullDay: 'All 5 prayers marked', fast: 'Voluntary fast logged',
    },
    chips: { prayer: 'Prayer', quran: 'Quran', hifz: 'Hifz', dhikr: 'Dhikr', charity: 'Charity', dua: 'Dua', muhasabah: 'Muhasabah', badge: 'Badge', fast: 'Fast' },
    khatmTitle: 'Khatm plan', khatmSub: (d) => `${d}-day plan · 604 pages`, pages: 'pp.', read: 'read', planBy: 'Planned end',
    todayTitle: 'Today', todaySub: 'of the daily tracker’s 10 deeds', todayCenter: 'today', openTracker: 'Go to the daily tracker',
    detEyebrow: 'Details', detTitle: 'By section', detLead: 'All-time totals for each section — independent of the period.',
  },
  ru: {
    salam: 'Ассаляму алейкум', period: 'Период', ranges: { 7: '7 дней', 30: '30 дней', 90: '90 дней', 364: 'Год' },
    vs: (n) => (n === 364 ? 'к прошлому году' : `к предыдущим ${n} дням`),
    insMore: (p) => `На этой неделе вы отметили на ${p} больше дел, чем на прошлой.`,
    insLess: (p) => `На этой неделе на ${p} меньше дел, чем на прошлой — ещё не поздно продолжить.`,
    insSame: 'На этой неделе вы отметили столько же дел, сколько на прошлой.',
    insFirst: (n) => `На этой неделе отмечено дел: ${n}.`,
    insNone: 'На этой неделе отметок пока нет — начните сегодня с одного дела.',
    kPrayer: 'Намазы', kActive: 'Активные дни', kQuran: 'Дни с Кораном', kDhikr: 'Зикр',
    sparkOf: (s) => `${s}: динамика за период`,
    chartTitle: 'Динамика дел', chartSub: 'Дела, отмеченные за день: намаз, зикр и азкары, Коран, садака',
    dhikrSub: 'Зикр за день; пунктир — предыдущий период', modeLabel: 'Показатель', mDeeds: 'Дела', mDhikr: 'Зикр',
    cats: { prayer: 'Намаз', adhkar: 'Зикр и азкары', quran: 'Коран', charity: 'Садака' },
    heatTitle: 'Календарь активности', heatSub: 'Каждый квадрат — день: чем темнее, тем больше дел', deedsN: (n) => `дел: ${n}`,
    radTitle: 'Намазы', radSub: (n) => `сколько из ${n} дней периода отмечено`,
    fnTitle: 'Постоянство', fnSub: 'От активного дня к полному — каждый шаг входит в предыдущий',
    fnSteps: ['Активный день', 'День с намазом', '5/5 намазов', '5/5 намазов + Коран'], fnFoot: (p) => `Полными были ${p} активных дней`,
    segTitle: 'Структура дел', segSub: 'доля за период и изменение к прошлому периоду',
    tblTitle: 'Зикр и дела', tblSub: 'сколько дней, постоянство и последние 8 недель',
    cols: { deed: 'Дело', days: 'Дни', rate: 'Постоянство', trend: 'Тренд', delta: 'Изменение' },
    deeds: { quran: 'Чтение Корана', morning: 'Утренние азкары', evening: 'Вечерние азкары', dhikr: 'Зикр', sadaqah: 'Садака' },
    trendOf: (s) => `${s}: последние 8 недель`,
    wdTitle: 'Дни недели', wdSub: 'среднее число дел в день — этот и предыдущий период',
    feedTitle: 'Недавняя активность', feedSub: 'что вы отметили на этом устройстве за 60 дней', feedEmpty: 'За последние 60 дней отметок нет.',
    ev: {
      charity: (x) => `Записана садака: ${x}`, dhikr: (n, c) => (n ? `${n} — ${c} раз` : `Круг зикра — ${c} раз`),
      duaNew: 'В дневник добавлено новое дуа', duaAnswered: 'Дуа отмечено как принятое', muhasabah: (n) => `Мухасаба: пунктов — ${n}`,
      badge: (x) => `Получен значок: ${x}`, quran: 'Прочитан Коран', hifz: (n) => `Хифз: повторений аятов — ${n}`, fullDay: 'Отмечены все 5 намазов', fast: 'Отмечен добровольный пост',
    },
    chips: { prayer: 'Намаз', quran: 'Коран', hifz: 'Хифз', dhikr: 'Зикр', charity: 'Садака', dua: 'Дуа', muhasabah: 'Мухасаба', badge: 'Значок', fast: 'Пост' },
    khatmTitle: 'План хатма', khatmSub: (d) => `план на ${d} дн. · 604 страницы`, pages: 'стр.', read: 'прочитано', planBy: 'По плану',
    todayTitle: 'Сегодня', todaySub: 'из 10 дел ежедневного трекера', todayCenter: 'сегодня', openTracker: 'Открыть ежедневный трекер',
    detEyebrow: 'Подробно', detTitle: 'По разделам', detLead: 'Итоги каждого раздела за всё время — не зависят от периода.',
  },
  ar: {
    salam: 'السلام عليكم', period: 'الفترة', ranges: { 7: '7 أيام', 30: '30 يومًا', 90: '90 يومًا', 364: 'سنة' },
    vs: (n) => (n === 364 ? 'مقارنة بالسنة الماضية' : `مقارنة بالأيام الـ${n} السابقة`),
    insMore: (p) => `سجّلت هذا الأسبوع أعمالًا أكثر من الأسبوع الماضي بنسبة ${p}.`,
    insLess: (p) => `أعمال هذا الأسبوع أقل من الأسبوع الماضي بنسبة ${p} — لم يفت الأوان للمواصلة.`,
    insSame: 'سجّلت هذا الأسبوع من الأعمال مثل الأسبوع الماضي.',
    insFirst: (n) => `سجّلت هذا الأسبوع ${n} من الأعمال.`,
    insNone: 'لا تسجيلات هذا الأسبوع بعد — ابدأ اليوم بعمل واحد.',
    kPrayer: 'الصلوات', kActive: 'أيام النشاط', kQuran: 'أيام القرآن', kDhikr: 'الذكر',
    sparkOf: (s) => `${s}: الاتجاه خلال الفترة`,
    chartTitle: 'الأعمال عبر الزمن', chartSub: 'الأعمال المسجّلة في اليوم: الصلاة، والذكر والأذكار، والقرآن، والصدقة',
    dhikrSub: 'عدد الذكر اليومي؛ الخط المتقطع — الفترة السابقة', modeLabel: 'المؤشر', mDeeds: 'الأعمال', mDhikr: 'الذكر',
    cats: { prayer: 'الصلاة', adhkar: 'الذكر والأذكار', quran: 'القرآن', charity: 'الصدقة' },
    heatTitle: 'تقويم النشاط', heatSub: 'كل مربع يوم: كلما كان أغمق كانت الأعمال أكثر', deedsN: (n) => `${n} من الأعمال`,
    radTitle: 'الصلوات', radSub: (n) => `كم يومًا سُجّل من أيام الفترة الـ${n}`,
    fnTitle: 'المداومة', fnSub: 'من يوم النشاط إلى اليوم الكامل — كل خطوة جزء مما قبلها',
    fnSteps: ['يوم نشاط', 'يوم فيه صلاة', '5/5 صلوات', '5/5 صلوات + قرآن'], fnFoot: (p) => `${p} من أيام النشاط كانت أيامًا كاملة`,
    segTitle: 'توزيع الأعمال', segSub: 'النسبة في الفترة والتغير مقارنة بالفترة السابقة',
    tblTitle: 'الذكر والأعمال', tblSub: 'عدد الأيام والمداومة وآخر 8 أسابيع',
    cols: { deed: 'العمل', days: 'الأيام', rate: 'المداومة', trend: 'الاتجاه', delta: 'التغير' },
    deeds: { quran: 'قراءة القرآن', morning: 'أذكار الصباح', evening: 'أذكار المساء', dhikr: 'الذكر', sadaqah: 'الصدقة' },
    trendOf: (s) => `${s}: آخر 8 أسابيع`,
    wdTitle: 'أيام الأسبوع', wdSub: 'متوسط الأعمال في اليوم — هذه الفترة والسابقة',
    feedTitle: 'النشاط الأخير', feedSub: 'ما سجّلته على هذا الجهاز في آخر 60 يومًا', feedEmpty: 'لا تسجيلات في آخر 60 يومًا.',
    ev: {
      charity: (x) => `سُجّلت صدقة: ${x}`, dhikr: (n, c) => (n ? `${n} — ${c} مرة` : `دورة ذكر — ${c} مرة`),
      duaNew: 'أُضيف دعاء جديد إلى المذكرة', duaAnswered: 'عُلّم دعاء بأنه استُجيب', muhasabah: (n) => `المحاسبة: ${n} بنود`,
      badge: (x) => `حصلت على وسام: ${x}`, quran: 'قُرئ القرآن', hifz: (n) => `الحفظ: ${n} مراجعة للآيات`, fullDay: 'سُجّلت الصلوات الخمس كلها', fast: 'سُجّل صيام تطوع',
    },
    chips: { prayer: 'الصلاة', quran: 'القرآن', hifz: 'الحفظ', dhikr: 'الذكر', charity: 'الصدقة', dua: 'الدعاء', muhasabah: 'المحاسبة', badge: 'وسام', fast: 'الصيام' },
    khatmTitle: 'خطة الختم', khatmSub: (d) => `خطة ${d} يومًا · 604 صفحات`, pages: 'ص', read: 'مقروء', planBy: 'حسب الخطة',
    todayTitle: 'اليوم', todaySub: 'من أعمال المتابعة اليومية العشرة', todayCenter: 'اليوم', openTracker: 'اذهب إلى المتابعة اليومية',
    detEyebrow: 'تفاصيل', detTitle: 'حسب الأقسام', detLead: 'إجماليات كل قسم منذ البداية — لا تتعلق بالفترة.',
  },
  tr: {
    salam: 'Esselamu aleyküm', period: 'Dönem', ranges: { 7: '7 gün', 30: '30 gün', 90: '90 gün', 364: 'Yıl' },
    vs: (n) => (n === 364 ? 'geçen yıla göre' : `önceki ${n} güne göre`),
    insMore: (p) => `Bu hafta geçen haftadan ${p} daha fazla amel işaretlediniz.`,
    insLess: (p) => `Bu hafta geçen haftadan ${p} daha az amel var — devam etmek için geç değil.`,
    insSame: 'Bu hafta geçen hafta kadar amel işaretlediniz.',
    insFirst: (n) => `Bu hafta ${n} amel işaretlediniz.`,
    insNone: 'Bu hafta henüz kayıt yok — bugün bir amelle başlayın.',
    kPrayer: 'Namaz', kActive: 'Aktif gün', kQuran: 'Kur’an günleri', kDhikr: 'Zikir',
    sparkOf: (s) => `${s}: dönem boyunca eğilim`,
    chartTitle: 'Amellerin seyri', chartSub: 'Günde işaretlenen ameller: namaz, zikir ve ezkar, Kur’an, sadaka',
    dhikrSub: 'Günlük zikir sayısı; kesikli çizgi — önceki dönem', modeLabel: 'Gösterge', mDeeds: 'Ameller', mDhikr: 'Zikir',
    cats: { prayer: 'Namaz', adhkar: 'Zikir ve ezkar', quran: 'Kur’an', charity: 'Sadaka' },
    heatTitle: 'Etkinlik takvimi', heatSub: 'Her kare bir gündür: ne kadar koyuysa o kadar çok amel', deedsN: (n) => `${n} amel`,
    radTitle: 'Namazlar', radSub: (n) => `dönemin ${n} gününden kaçında işaretlendi`,
    fnTitle: 'Süreklilik', fnSub: 'Aktif günden tam güne — her adım bir öncekinin parçasıdır',
    fnSteps: ['Aktif gün', 'Namazlı gün', '5/5 namaz', '5/5 namaz + Kur’an'], fnFoot: (p) => `Aktif günlerin ${p} kadarı tam gündü`,
    segTitle: 'Amellerin dağılımı', segSub: 'dönemdeki pay ve önceki döneme göre değişim',
    tblTitle: 'Zikir ve ameller', tblSub: 'kaç gün yapıldı, süreklilik ve son 8 hafta',
    cols: { deed: 'Amel', days: 'Gün', rate: 'Süreklilik', trend: 'Eğilim', delta: 'Değişim' },
    deeds: { quran: 'Kur’an okumak', morning: 'Sabah ezkarı', evening: 'Akşam ezkarı', dhikr: 'Zikir', sadaqah: 'Sadaka' },
    trendOf: (s) => `${s}: son 8 hafta`,
    wdTitle: 'Haftanın günleri', wdSub: 'günde ortalama amel — bu dönem ve önceki dönem',
    feedTitle: 'Son etkinlik', feedSub: 'son 60 günde bu cihazda işaretledikleriniz', feedEmpty: 'Son 60 günde kayıt yok.',
    ev: {
      charity: (x) => `Sadaka kaydedildi: ${x}`, dhikr: (n, c) => (n ? `${n} — ${c} kez` : `Zikir turu — ${c} kez`),
      duaNew: 'Dua günlüğüne yeni dua yazıldı', duaAnswered: 'Bir dua «kabul oldu» olarak işaretlendi', muhasabah: (n) => `Muhasebe: ${n} madde`,
      badge: (x) => `Rozet kazanıldı: ${x}`, quran: 'Kur’an okundu', hifz: (n) => `Hıfz: ${n} ayet tekrarı`, fullDay: '5 vakit namazın hepsi işaretlendi', fast: 'Nafile oruç kaydedildi',
    },
    chips: { prayer: 'Namaz', quran: 'Kur’an', hifz: 'Hıfz', dhikr: 'Zikir', charity: 'Sadaka', dua: 'Dua', muhasabah: 'Muhasebe', badge: 'Rozet', fast: 'Oruç' },
    khatmTitle: 'Hatim planı', khatmSub: (d) => `${d} günlük plan · 604 sayfa`, pages: 'sf.', read: 'okundu', planBy: 'Plana göre',
    todayTitle: 'Bugün', todaySub: 'günlük takibin 10 amelinden', todayCenter: 'bugün', openTracker: 'Günlük takibe git',
    detEyebrow: 'Ayrıntılar', detTitle: 'Bölümlere göre', detLead: 'Her bölümün tüm zamanlardaki toplamları — dönemden bağımsızdır.',
  },
}
const RANGES = [7, 30, 90, 364]
const NAME_KEY = 'qm_name_v1'   // components/home/HeroGreeting.jsx ilə eyni açar

// Ardıcıl dəyərləri SONDAN size-lik qruplara yığır (son qrup həmişə tam həftədir)
function bucketEnd(values, size) {
  if (size <= 1) return values
  const out = []
  for (let end = values.length; end > 0; end -= size) out.unshift(values.slice(Math.max(0, end - size), end).reduce((a, b) => a + b, 0))
  return out
}

// Hər nöqtə — özü daxil son 7 günün cəmi
const rolling7 = (vals) => vals.map((_, i) => vals.slice(Math.max(0, i - 6), i + 1).reduce((a, b) => a + b, 0))

export default function AnalyticsPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(LABELS, lang)
  const x = pickUi(X, lang)
  const v = pickUi(V, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])

  const data = useMemo(() => {
    const d = readAnalytics()
    const course = readProgress()
    return { ...d, coursePassed: passedCount(course), coursePct: percentDone(course), courseStarted: Object.keys(course.best).length > 0 || !!course.last }
  }, [])
  // v6: gündəlik sıralar (namaz + izləyici + Quran + zikr + hifz + sədəqə + mühasəbə + oruc)
  const store = useMemo(() => readStore(), [])
  const days = useMemo(() => buildDays(store), [store])
  const today = todayStr()

  // Hər hansı bir bölmədə məlumat varsa "məlumat yoxdur" göstərilmir
  const hasData = data.daysActive > 0 || data.hadithFavs > 0 || data.duaFavs > 0 || data.journalTotal > 0 ||
    data.hifzMemorized + data.hifzInProgress > 0 || data.dhikrTotal > 0 || Object.keys(data.quizScores).length > 0 ||
    Object.keys(data.quranGameScores).length > 0 || data.courseStarted || days.size > 0

  // v5.7: nişanlar — utils/badges (medal rəfi + "yeni nişan" bildirişi)
  const achievements = useMemo(() => { syncBadges(); return badgeList() }, [])
  const achievedCount = achievements.filter(a => a.done).length
  const [shared, setShared] = useState(null)
  const shareBadge = async (e, a) => {
    const svg = e.currentTarget.closest('.bdg-card')?.querySelector('.bdg-medal svg')
    const { shareBadgeCard } = await import('../utils/badgeCard.js')
    const r = await shareBadgeCard({
      tier: a.tier, iconSvg: svg, eyebrow: x.bEarned, title: pickUi(a.name, lang), rtl: lang === 'ar', lang,
      sub: a.at ? fmtDay(new Date(`${a.at}T12:00:00`), { day: 'numeric', month: 'long', year: 'numeric' }) : '', fileName: `muslims-cc-${a.id}.png`,
    })
    if (r === 'saved') { setShared(a.id); setTimeout(() => setShared(null), 2500) }
  }

  // Daxili keçid: adi klikdə SPA naviqasiyası, Ctrl/orta düymə — yeni vərəq
  const go = (key) => (e) => {
    if (!setPage || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    setPage(key)
  }
  const fmtDay = (d, opt) => f.date(d, opt)

  // ── Dövr və göstəricilər ──
  const [range, setRange] = useState(30)
  const [mode, setMode] = useState('deeds')
  const R = useMemo(() => rangeStats(days, today, range), [days, today, range])
  const week = useMemo(() => rangeStats(days, today, 7), [days, today])
  const bucket = range === 364 ? 7 : 1
  const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0)

  const series = useMemo(() => {
    const perCat = Object.fromEntries(CATS.map(c => [c, R.keys.map(k => catValues(getDay(days, k))[c])]))
    const dhikr = R.keys.map(k => getDay(days, k).dhikr)
    const dhikrPrev = R.prevKeys.map(k => getDay(days, k).dhikr)
    const prayers = perCat.prayer
    const active = R.keys.map(k => { const d = getDay(days, k); return dayScore(d) > 0 || d.dhikr > 0 ? 1 : 0 })
    const quran = perCat.quran
    const b = (arr) => bucketEnd(arr, bucket)
    return {
      labels: bucket > 1 ? R.keys.filter((_, i) => (R.keys.length - i) % bucket === 0) : R.keys,
      cats: Object.fromEntries(CATS.map(c => [c, b(perCat[c])])),
      dhikr: b(dhikr), dhikrPrev: b(dhikrPrev),
      // 0/1 sıraları (aktiv gün, Quran günü) "daraq" kimi görünməsin — 7 günlük sürüşən cəm
      spark: { prayers: b(prayers), active: bucket > 1 ? b(active) : rolling7(active), quran: bucket > 1 ? b(quran) : rolling7(quran), dhikr: b(dhikr) },
    }
  }, [R, days, bucket])

  const tipTitle = (k) => {
    if (!k) return ''
    const d = fromDayKey(k)
    if (bucket > 1) return `${f.date(d, { day: 'numeric', month: 'short' })} – ${f.date(fromDayKey(addDayKey(k, bucket - 1)), { day: 'numeric', month: 'short', year: 'numeric' })}`
    return f.date(d, { weekday: 'short', day: 'numeric', month: 'long' })
  }
  const xTick = (k) => (k ? f.date(fromDayKey(k), range === 364 ? { month: 'short' } : { day: 'numeric', month: 'short' }) : '')

  // ── Salam + bir cümləlik nəticə (son 7 gün vs əvvəlki 7 gün) ──
  const name = useMemo(() => { try { return (localStorage.getItem(NAME_KEY) || '').slice(0, 40).trim() } catch { return '' } }, [])
  const insight = (() => {
    const cur = week.cur.score, prev = week.prev.score
    if (!cur) return v.insNone
    if (!prev) return v.insFirst(f.num(cur))
    const d = pctDelta(cur, prev)
    if (Math.abs(d) < 1) return v.insSame
    return d > 0 ? v.insMore(f.pct(d, 0)) : v.insLess(f.pct(-d, 0))
  })()

  const vs = v.vs(range)
  const delta = (a, b) => ({ value: pctDelta(a, b), vs })
  const kpis = [
    { key: 'p', icon: 'prayer', label: v.kPrayer, value: R.cur.prayers, delta: delta(R.cur.prayers, R.prev.prayers), spark: series.spark.prayers, href: 'dailytracker' },
    { key: 'a', icon: 'calendar', label: v.kActive, value: R.cur.active, unit: `/ ${R.keys.length}`, delta: delta(R.cur.active, R.prev.active), spark: series.spark.active },
    { key: 'q', icon: 'quran', label: v.kQuran, value: R.cur.quranDays, delta: delta(R.cur.quranDays, R.prev.quranDays), spark: series.spark.quran, href: 'quran', tone: 3 },
    { key: 'z', icon: 'dhikr', label: v.kDhikr, value: f.compact(R.cur.dhikr), delta: delta(R.cur.dhikr, R.prev.dhikr), spark: series.spark.dhikr, href: 'dhikr', tone: 2 },
  ]

  // ── Xətm planı (varsa) və ya bugünkü hədəf ──
  const goal = useMemo(() => {
    const p = store.khatm
    if (p && typeof p === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(p.start) && Number(p.days) > 0) {
      const done = Math.min(604, Math.max(0, Math.floor(Number(p.done) || 0)))
      const elapsed = Math.max(1, Math.round((fromDayKey(today) - fromDayKey(p.start)) / 864e5) + 1)
      return { kind: 'khatm', value: done, goal: 604, pace: Math.round((done / elapsed) * 10) / 10, days: Number(p.days), end: fromDayKey(addDayKey(p.start, Number(p.days) - 1)) }
    }
    return { kind: 'today', value: data.todayDone, goal: data.todayTotal }
  }, [store, today, data])

  // ── İstilik xəritəsi ──
  const heatData = useCallback((k) => dayScore(getDay(days, k)), [days])

  // ── Lent ──
  const feed = useMemo(() => {
    const charityName = (tp) => labelOf(CHARITY_TYPES, tp, lang)
    const badgeName = (id) => { const b = achievements.find(a => a.id === id); return b ? pickUi(b.name, lang) : id }
    const names = { ...v.ev, charity: (tp) => v.ev.charity(charityName(tp)), badge: (id) => v.ev.badge(badgeName(id)) }
    return feedEvents(store, days, names, addDayKey(today, -59)).slice(0, 8).map(e => ({ ...e, chip: { label: v.chips[e.kind], tone: e.kind === 'badge' ? 'accent' : e.kind === 'charity' || e.kind === 'dua' ? 'muted' : undefined } }))
  }, [store, days, today, lang, achievements, v])

  // ── Cədvəl: zikr və əməllər (son 8 həftə trendi) ──
  const deedRows = useMemo(() => {
    const keys56 = dayKeys(today, 56)
    return DEED_KEYS.map(k => ({
      key: k, label: v.deeds[k], days: R.cur.perDeed[k], prev: R.prev.perDeed[k],
      rate: pct(R.cur.perDeed[k], R.cur.effDays || R.keys.length),
      trend: bucketEnd(keys56.map(d => (getDay(days, d).deeds.has(k) ? 1 : 0)), 7),
    }))
  }, [R, days, today, v])

  const weekdayItems = useMemo(() => {
    const mon = fromDayKey('2026-11-02')   // bazar ertəsi — yalnız həftə günü adı üçün
    return Array.from({ length: 7 }, (_, i) => ({
      key: i, label: f.date(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i, 12), { weekday: 'short' }),
      value: R.cur.weekdayN[i] ? Math.round((R.cur.weekday[i] / R.cur.weekdayN[i]) * 10) / 10 : 0,
      prev: R.prev.weekdayN[i] ? Math.round((R.prev.weekday[i] / R.prev.weekdayN[i]) * 10) / 10 : 0,
    }))
  }, [R, f])

  const quizRows = [
    ...Object.entries(data.quizScores).map(([k, val]) => ({ key: `q-${k}`, label: labelOf(QUIZ_CATEGORIES, k, lang), value: Math.min(10, val) })),
    ...Object.entries(data.quranGameScores).map(([k, val]) => ({ key: `g-${k}`, label: `${t.quranGame}: ${labelOf(QG_MODES, k, lang)}`, value: Math.min(10, val), tone: 2 })),
  ]
  const charityRows = Object.entries(data.charityByType).sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ key: type, label: labelOf(CHARITY_TYPES, type, lang), value: count }))

  const rangeOpts = RANGES.map(n => ({ value: n, label: v.ranges[n] }))
  const eff = R.cur.effDays || R.keys.length
  const funnelSteps = [R.cur.active, R.cur.prayerDays, R.cur.fullDays, R.cur.fullQuran]
  const funnelPrev = [R.prev.active, R.prev.prayerDays, R.prev.fullDays, R.prev.fullQuran]
  const href = (k) => pathFor(k, lang)

  return (
    <div className="analytics-page">
      {/* v6: salam + tarix + bir cümləlik nəticə */}
      <header className="ui-page-hero analytics-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container an-hero">
          <div className="an-hero__text">
            <div className="ui-page-hero__crumbs"><Breadcrumb setPage={setPage} current={t.title} /></div>
            <p className="an-hero__date">
              <span>{v.salam}{name ? `, ${name}` : ''}</span>
              <span aria-hidden="true"> · </span>
              <time dateTime={today}>{f.date(fromDayKey(today), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time>
            </p>
            <h1 className="ui-display">{t.title}</h1>
            {/* v6: dövr dəyişəndə nəticə cümləsi bulanıqdan yenilənir (eyni yerdə məzmun dəyişimi) */}
            <p className="ui-lead an-hero__insight" data-testid="an-insight">
              <PresenceSwap as="span" className="an-hero__insight-t" swapKey={hasData ? insight : 'nodata'} variant="blur">{hasData ? insight : t.subtitle}</PresenceSwap>
            </p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {x.how}</p>
          </div>
          {hasData && (
            <div className="an-hero__tools">
              <span className="an-hero__tools-label" id="an-range-l">{v.period}</span>
              <RangeTabs options={rangeOpts} value={range} onChange={setRange} label={v.period} />
            </div>
          )}
        </div>
      </header>

      {/* Məlumat yoxdur — izah + haradan başlamaq olar */}
      {!hasData && (
        <div className="ui-container analytics-nodata-wrap">
          <div className="analytics-nodata" role="status" data-reveal="">
            <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent" aria-hidden="true"><Icon name="analytics" /></span>
            <div className="analytics-nodata-body">
              <p className="analytics-nodata-text">{t.noData}</p>
              <div className="analytics-nodata-links" aria-label={pickUi(START_TITLE, lang)} role="group">
                {START_KEYS.map(k => (
                  <a key={k} className="ui-btn ui-btn--secondary ui-btn--sm" href={href(k)} onClick={go(k)}>
                    <Icon name={k} className="ui-btn__icon" />{navLabel(k, lang)}
                  </a>
                ))}
              </div>
            </div>
            {/* Panelin "kölgəsi" — rəqəmsiz dekor (saxta məlumat göstərilmir) */}
            <div className="an-ghost" aria-hidden="true">
              {[0, 1, 2, 3].map(i => <span key={i} className="an-ghost__kpi"><i /><b /></span>)}
              <svg className="an-ghost__chart" viewBox="0 0 400 90" preserveAspectRatio="none">
                <path d="M0 70 C40 60 60 30 100 40 S160 75 200 50 S270 15 310 30 S370 55 400 35 V90 H0Z" />
                <path className="an-ghost__line" d="M0 70 C40 60 60 30 100 40 S160 75 200 50 S270 15 310 30 S370 55 400 35" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── Bento panel ── */}
      {hasData && (
        <section className="ui-section ui-section--tight an-dash" aria-label={t.overview}>
          <div className="ui-container">
            {/* v6: KPI kartları növbə ilə açılır (Stagger 50 ms) — panel şəbəkəsinin özü Stagger konteyneridir */}
            <Stagger as="div" className="vz-bento an-bento" step={0.05} variant="scaleIn">
              {kpis.map(k => (
                <StaggerItem key={k.key} className="an-kpi-cell" style={{ '--vz-span': 3 }}>
                <KpiCard span={3} icon={k.icon} label={k.label} value={typeof k.value === 'number' ? f.num(k.value) : k.value} unit={k.unit}
                  delta={k.delta.value != null ? k.delta : null} hint={k.delta.value == null ? vs : undefined}
                  spark={k.spark} sparkLabel={v.sparkOf(k.label)} tone={k.tone || 1}
                  href={k.href ? href(k.href) : undefined} onClick={k.href ? go(k.href) : undefined} />
                </StaggerItem>
              ))}

              <ChartCard span={8} id="an-chart" title={v.chartTitle} sub={mode === 'deeds' ? v.chartSub : v.dhikrSub}
                actions={<RangeTabs options={[{ value: 'deeds', label: v.mDeeds }, { value: 'dhikr', label: v.mDhikr }]} value={mode} onChange={setMode} label={v.modeLabel} />}>
                <PresenceSwap swapKey={mode} variant="fade" className="an-chart-swap">
                {mode === 'deeds' ? (
                  <AreaChart key={`d-${range}`} mode="stacked" height={300} integer label={v.chartTitle}
                    labels={series.labels} xFormat={xTick} tooltipTitle={tipTitle}
                    series={CATS.map((c, i) => ({ key: c, label: v.cats[c], values: series.cats[c], tone: i + 1 }))} />
                ) : (
                  <LineChart key={`z-${range}`} height={300} integer label={v.mDhikr} labels={series.labels} xFormat={xTick} tooltipTitle={tipTitle}
                    series={[{ key: 'dhikr', label: v.mDhikr, values: series.dhikr, compare: series.dhikrPrev, tone: 1 }]} />
                )}
                </PresenceSwap>
              </ChartCard>

              <ChartCard span={4} id="an-goal" icon={goal.kind === 'khatm' ? 'quran' : 'dailytracker'}
                title={goal.kind === 'khatm' ? v.khatmTitle : v.todayTitle} sub={goal.kind === 'khatm' ? v.khatmSub(goal.days) : v.todaySub}
                footer={goal.kind === 'khatm' ? { label: navLabel('quran', lang), href: href('quran'), onClick: go('quran') } : { label: v.openTracker, href: href('dailytracker'), onClick: go('dailytracker') }}>
                {goal.kind === 'khatm' ? (
                  <GoalRing value={goal.value} goal={goal.goal} pace={goal.pace} unit={v.pages} centerLabel={v.read} label={v.khatmTitle}
                    extraRows={[{ label: v.planBy, value: f.date(goal.end, { day: 'numeric', month: 'short', year: 'numeric' }) }]} />
                ) : (
                  <GoalRing value={goal.value} goal={goal.goal} centerLabel={v.todayCenter} label={v.todayTitle} />
                )}
              </ChartCard>

              <ChartCard span={8} id="an-heat" title={v.heatTitle} sub={v.heatSub}>
                <CalendarHeatmap data={heatData} end={today} maxWeeks={53} label={v.heatTitle} format={(n) => v.deedsN(f.num(n))} />
              </ChartCard>

              <ChartCard span={4} id="an-rad" icon="prayer" title={v.radTitle} sub={v.radSub(eff)}>
                <RadialBars size={56} thickness={6} label={v.radTitle} items={PRAYER_KEYS.map((p, i) => ({ key: p, label: pickUi(PRAYER_LABEL, lang)[i], value: R.cur.perPrayer[p], max: eff }))} />
              </ChartCard>

              <ChartCard span={7} id="an-funnel" title={v.fnTitle} sub={v.fnSub}
                footer={{ note: v.fnFoot(f.pct(pct(R.cur.fullDays, R.cur.active), 0)) }}>
                <FunnelChart label={v.fnTitle} steps={v.fnSteps.map((s, i) => ({ key: i, label: s, value: funnelSteps[i] }))} compare={funnelPrev} />
              </ChartCard>

              <ChartCard span={5} id="an-seg" title={v.segTitle} sub={v.segSub}>
                <SegmentBreakdown label={v.segTitle} items={CATS.map((c, i) => ({ key: c, label: v.cats[c], value: R.cur.cats[c], prev: R.prev.cats[c], tone: i + 1 }))} />
              </ChartCard>

              <ChartCard span={7} id="an-tbl" title={v.tblTitle} sub={v.tblSub} flush>
                <MiniTable caption={v.tblTitle} rows={deedRows} columns={[
                  { key: 'label', label: v.cols.deed },
                  { key: 'days', label: v.cols.days, align: 'end', render: r => <span className="ui-num">{f.num(r.days)}</span> },
                  { key: 'rate', label: v.cols.rate, render: r => <InlineBar value={Math.round(r.rate)} max={100} label={`${r.label}: ${f.pct(r.rate, 0)}`} /> },
                  { key: 'trend', label: v.cols.trend, hideSm: true, render: r => <TrendCell values={r.trend} label={v.trendOf(r.label)} /> },
                  { key: 'delta', label: v.cols.delta, align: 'end', render: r => (pctDelta(r.days, r.prev) == null ? <span className="vz-trend--none">—</span> : <Delta value={pctDelta(r.days, r.prev)} vs={false} />) },
                ]} />
              </ChartCard>

              <ChartCard span={5} id="an-feed" title={v.feedTitle} sub={v.feedSub}>
                <ActivityFeed items={feed} label={v.feedTitle} empty={<p className="vz-empty">{v.feedEmpty}</p>} />
              </ChartCard>

              <ChartCard span={12} id="an-wd" title={v.wdTitle} sub={v.wdSub} className="an-wd">
                <CompareBars label={v.wdTitle} items={weekdayItems} currentLabel={v.ranges[range]} format={(n) => f.num(n)} />
              </ChartCard>
            </Stagger>
          </div>
        </section>
      )}

      {/* İllik icmal — cari hicri il */}
      {hasData && <YearReview />}

      {/* ── Bölmələr üzrə (ümumi saylar) ── */}
      {hasData && (
        <section className="ui-section ui-section--tight analytics-sec" aria-labelledby="an-det">
          <div className="ui-container">
            <SecHead id="an-det" eyebrow={v.detEyebrow} title={v.detTitle} lead={v.detLead} />
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
              </Card>

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
                    ? <BarChart data={data.topSurahs.map(([n, val]) => ({ key: n, label: `${n}. ${surahName(n, lang)}`, value: val }))} label={x.topSurahs} />
                    : <p className="analytics-note">{x.none}</p>}
                </ChartFigure>
              </Card>

              <Card icon="hifz" title={x.hifz}>
                <div className="analytics-ring-row">
                  <ProgressRing value={data.hifzMemorized} max={114} size={72} thickness={7} label={t.memorized}
                    sub={<bdi dir="ltr">{data.hifzMemorized} / 114</bdi>} />
                  <a className="ui-link" href={href('hifz')} onClick={go('hifz')}>
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
                  <a className="ui-link" href={href('arabic')} onClick={go('arabic')}>
                    {x.openCourse} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                  </a>
                </div>
              </Card>

              <Card icon="quiz" title={x.games}>
                {quizRows.length ? (
                  <ChartFigure sub={x.gamesSub} plain>
                    <BarChart data={quizRows} max={10} format={val => `${val}/10`} label={x.games} />
                  </ChartFigure>
                ) : (
                  <div className="analytics-empty-row">
                    <p className="analytics-note">{x.noGames}</p>
                    <a className="ui-btn ui-btn--secondary ui-btn--sm" href={href('quiz')} onClick={go('quiz')}>
                      <Icon name="quiz" className="ui-btn__icon" />{x.play}
                    </a>
                  </div>
                )}
              </Card>

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
      )}

      {/* ── Nailiyyətlər ── */}
      <section className="ui-section ui-section--tight analytics-sec" aria-labelledby="an-ach">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{x.achEyebrow}</span>
            <h2 className="ui-title" id="an-ach">{t.achievements} <span className="analytics-count ui-num" dir="ltr">{achievedCount}/{achievements.length}</span></h2>
            <p className="ui-lead">{x.achLead}</p>
          </div>
          <ul className="bdg-tiers" aria-hidden="true">
            {['bronze', 'silver', 'gold'].map(k => <li key={k}><span className={`bdg-medal bdg-medal--${k}`} />{x.tier[k]}</li>)}
          </ul>
          <ul className="bdg-shelf" data-reveal="up" data-testid="badge-shelf">
            {achievements.map((a, i) => (
              <li key={a.id} className={`bdg-card${a.done ? ' is-done' : ''}`} style={{ '--i': i }} data-badge={a.id}>
                <span className={`bdg-medal bdg-medal--${a.done ? a.tier : 'locked'}`} aria-hidden="true">
                  <Icon name={a.icon} size={24} />
                </span>
                <span className="bdg-card__name">{pickUi(a.name, lang)}</span>
                {a.done
                  ? <>
                    <span className="bdg-card__meta">{a.at ? fmtDay(new Date(`${a.at}T12:00:00`), { day: 'numeric', month: 'short', year: 'numeric' }) : t.achieved}</span>
                    <button type="button" className="bdg-card__share" onClick={(e) => shareBadge(e, a)} aria-label={`${x.bShare}: ${pickUi(a.name, lang)}`} data-testid="badge-share">
                      <Icon name="share" size={14} /> {shared === a.id ? x.bSaved : x.bShare}
                    </button>
                  </>
                  : <>
                    <span className="bdg-card__bar" aria-hidden="true"><i style={{ '--p': a.value / a.goal }} /></span>
                    <span className="bdg-card__meta"><span className="ui-num" dir="ltr">{a.value.toLocaleString('en-US').replace(/,/g, ' ')} / {a.goal.toLocaleString('en-US').replace(/,/g, ' ')}</span> <span className="ui-sr-only">{t.locked}</span></span>
                  </>}
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
