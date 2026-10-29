import { useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/AnalyticsPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navLabel } from '../data/navigation'
import { pathFor } from '../seo/routes.js'

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

    return {
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
    Object.keys(data.quranGameScores).length > 0

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

  // Bölmə kartının başlığı (ikon kafeli + h2)
  const CardHead = ({ icon, tone = '', children }) => (
    <div className="analytics-card-header">
      <span className={`ui-icon-tile ui-icon-tile--sm${tone ? ` ui-icon-tile--${tone}` : ''}`} aria-hidden="true"><Icon name={icon} /></span>
      <h2 className="analytics-card-title">{children}</h2>
    </div>
  )

  return (
    <div className="analytics-page">
      {/* Sakit kağız hero (dizayn v2): çörək qırıntısı, eyebrow, bir h1, lead */}
      <header className="ui-page-hero analytics-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__crumbs"><Breadcrumb setPage={setPage} current={t.title} /></div>
          <span className="ui-eyebrow">{navGroupLabel('quran', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <div className="section analytics-section">
        <div className="section-inner">

          {/* Məlumat yoxdur — izah + haradan başlamaq olar (əvvəl yalnız bir sətir idi) */}
          {!hasData && (
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
          )}

          {/* ── Ümumi baxış ── data-reveal="stagger": kartlar növbə ilə qalxır */}
          <div className="analytics-overview" data-reveal="stagger">
            {[
              { icon: 'calendar', value: data.daysActive, label: t.daysActive },
              { icon: 'prayer',   value: data.totalPrayers, label: t.prayers },
              { icon: 'quran',    value: data.quranSessions, label: t.quranSessions },
              { icon: 'hadith',   value: data.hadithFavs, label: t.favHadiths },
              { icon: 'duas',     value: data.duaFavs, label: t.duasSaved },
              { icon: 'donate',   value: data.totalCharity, label: t.charityDeeds },
            ].map((c, i) => (
              <div key={i} className={`analytics-ov-card${c.value > 0 ? ' has-value' : ''}`}>
                <span className="ui-icon-tile analytics-ov-icon" aria-hidden="true"><Icon name={c.icon} /></span>
                <span className="analytics-ov-value ui-num" data-count={c.value}>{c.value}</span>
                <span className="analytics-ov-label">{c.label}</span>
              </div>
            ))}
          </div>

          <div className="analytics-sections">

            {/* ── Namaz ── */}
            <section data-reveal="up" className="analytics-card">
              <CardHead icon="prayer">{t.prayerStats}</CardHead>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.total}</span>
                  <span className="analytics-stat-value highlight ui-num" data-count={data.totalPrayers}>{data.totalPrayers}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.thisWeek}</span>
                  <span className="analytics-stat-value">{data.weekPrayers}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.thisMonth}</span>
                  <span className="analytics-stat-value">{data.monthPrayers}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.streak}</span>
                  <span className="analytics-stat-value">{data.prayerStreak}</span>
                </div>
                <div className="analytics-progress-wrap">
                  <div className="analytics-progress-label">
                    <span>{t.rate}</span>
                    <span className="ui-num">{data.prayerRate}%</span>
                  </div>
                  <div className="analytics-progress-bar">
                    <div className="analytics-progress-fill" style={{ transform: `scaleX(${data.prayerRate / 100})` }} />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Quran ── */}
            <section data-reveal="up" className="analytics-card">
              <CardHead icon="quran">{t.quranStats}</CardHead>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.sessions}</span>
                  <span className="analytics-stat-value highlight ui-num" data-count={data.quranSessions}>{data.quranSessions}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.surahs}</span>
                  <span className="analytics-stat-value" dir="ltr">{data.uniqueSurahs} / 114</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.streak}</span>
                  <span className="analytics-stat-value">{data.quranStreak}</span>
                </div>

                <div className="analytics-progress-wrap">
                  <div className="analytics-progress-label">
                    <span>{t.hifzProgress}</span>
                    <span className="ui-num" dir="ltr">{data.hifzMemorized} / 114</span>
                  </div>
                  <div className="analytics-progress-bar">
                    <div className="analytics-progress-fill" style={{ transform: `scaleX(${data.hifzMemorized / 114})` }} />
                  </div>
                </div>

                <div className="analytics-hifz-bars">
                  <div className="analytics-hifz-item">
                    <span className="analytics-hifz-dot memorized" />
                    <span className="analytics-hifz-label">{t.memorized}</span>
                    <span className="analytics-hifz-count">{data.hifzMemorized}</span>
                  </div>
                  <div className="analytics-hifz-item">
                    <span className="analytics-hifz-dot in-progress" />
                    <span className="analytics-hifz-label">{t.inProgress}</span>
                    <span className="analytics-hifz-count">{data.hifzInProgress}</span>
                  </div>
                  <div className="analytics-hifz-item">
                    <span className="analytics-hifz-dot not-started" />
                    <span className="analytics-hifz-label">{t.notStarted}</span>
                    <span className="analytics-hifz-count">{data.hifzNotStarted}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Hədis və dua ── */}
            <section data-reveal="up" className="analytics-card">
              <CardHead icon="hadith">{t.hadithDua}</CardHead>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.favHadiths}</span>
                  <span className="analytics-stat-value highlight ui-num" data-count={data.hadithFavs}>{data.hadithFavs}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.duasSaved}</span>
                  <span className="analytics-stat-value">{data.duaFavs}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.duaJournal} — {t.active}</span>
                  <span className="analytics-stat-value">{data.duaActive}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.duaJournal} — {t.answered}</span>
                  <span className="analytics-stat-value">{data.duaAnswered}</span>
                </div>
                {Object.keys(data.quizScores).length > 0 && (
                  <>
                    <h3 className="analytics-subhead">{t.quizScores}</h3>
                    {Object.entries(data.quizScores).map(([k, v]) => (
                      <div className="analytics-stat-row" key={k}>
                        <span className="analytics-stat-label">{labelOf(QUIZ_CATEGORIES, k, lang)}</span>
                        <span className="analytics-stat-value">{t.bestScore}: {v}</span>
                      </div>
                    ))}
                  </>
                )}
                {Object.keys(data.quranGameScores).length > 0 && (
                  <>
                    <h3 className="analytics-subhead">{t.quranGame}</h3>
                    {Object.entries(data.quranGameScores).map(([k, v]) => (
                      <div className="analytics-stat-row" key={`qg-${k}`}>
                        <span className="analytics-stat-label">{labelOf(QG_MODES, k, lang)}</span>
                        <span className="analytics-stat-value">{t.bestScore}: {v}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </section>

            {/* ── Sədəqə ── */}
            <section data-reveal="up" className="analytics-card">
              <CardHead icon="donate">{t.charityStats}</CardHead>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.total}</span>
                  <span className="analytics-stat-value highlight ui-num" data-count={data.totalCharity}>{data.totalCharity}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.totalAmount}</span>
                  <span className="analytics-stat-value">{data.totalAmount.toFixed(2)}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.streak}</span>
                  <span className="analytics-stat-value">{data.charityStreak}</span>
                </div>

                {Object.keys(data.charityByType).length > 0 && (
                  <>
                    <h3 className="analytics-subhead">{t.byType}</h3>
                    <div className="analytics-bar-chart">
                      {Object.entries(data.charityByType).map(([type, count]) => (
                        <div className="analytics-bar-item" key={type}>
                          <span className="analytics-bar-label">{labelOf(CHARITY_TYPES, type, lang)}</span>
                          <div className="analytics-bar-track">
                            <div className="analytics-bar-fill" style={{ transform: `scaleX(${count / data.maxTypeCount})` }} />
                          </div>
                          <span className="analytics-bar-count ui-num">{count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* ── Gündəlik izləyici ── tam en; geniş ekranda iki blok yan-yana */}
            <section data-reveal="up" className="analytics-card full-width">
              <CardHead icon="dailytracker">{t.dailyTracker}</CardHead>
              <div className="analytics-card-body analytics-split">
                <div className="analytics-split-col">
                  <div className="analytics-stat-row">
                    <span className="analytics-stat-label">{t.today}</span>
                    <span className="analytics-stat-value highlight">{data.todayPct}%</span>
                  </div>
                  <div className="analytics-progress-wrap">
                    <div className="analytics-progress-label">
                      <span className="ui-num" dir="ltr">{data.todayDone} / {data.todayTotal}</span>
                      <span className="ui-num">{data.todayPct}%</span>
                    </div>
                    <div className="analytics-progress-bar">
                      <div className="analytics-progress-fill" style={{ transform: `scaleX(${data.todayPct / 100})` }} />
                    </div>
                  </div>
                </div>
                <div className="analytics-split-col">
                  <div className="analytics-stat-row">
                    <span className="analytics-stat-label">{t.weekAvg}</span>
                    <span className="analytics-stat-value">{data.weekAvg}%</span>
                  </div>
                  <div className="analytics-progress-wrap">
                    <div className="analytics-progress-label">
                      <span>{t.thisWeek}</span>
                      <span className="ui-num">{data.weekAvg}%</span>
                    </div>
                    <div className="analytics-progress-bar">
                      <div className="analytics-progress-fill" style={{ transform: `scaleX(${data.weekAvg / 100})` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Nailiyyətlər ── */}
            <section data-reveal="up" className="analytics-card full-width">
              <CardHead icon="sahaba" tone="accent">
                {t.achievements} <span className="analytics-count ui-num" dir="ltr">{achievedCount}/{achievements.length}</span>
              </CardHead>
              <div className="analytics-card-body">
                {/* Telefonda üfüqi sürüşən nişan zolağı */}
                <ul className="analytics-achievements" data-reveal="stagger-zoom">
                  {achievements.map((a, i) => (
                    <li key={i} className={`analytics-badge ${a.check ? 'achieved' : 'locked'}`}>
                      <span className="analytics-badge-icon" aria-hidden="true">
                        <Icon name={a.icon} size={22} />
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
        </div>
      </div>
    </div>
  )
}
