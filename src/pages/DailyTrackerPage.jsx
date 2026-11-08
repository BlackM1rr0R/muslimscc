import { useState, useEffect, useCallback } from 'react'
import NurRosette from '../components/prayer/NurRosette'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import '../styles/DailyTrackerPage.css'
import '../styles/ToolsMotion.css'
import Sparkle from '../components/prayer/Sparkle'
import { setPrayerStatus } from '../utils/prayerTracker'
import { usePendingCheckinSync } from '../hooks/usePrayerTracker'
import Breadcrumb from '../components/Breadcrumb'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Gündəlik ibadət', subtitle:'Gündəlik ibadətlərinizi izləyin', today:'Bu gün', streak:'Ardıcıl gün', weekView:'Həftəlik baxış', completed:'Tamamlandı', reset:'Sıfırla', resetConfirm:'Bu günün məlumatlarını sıfırlamaq istəyirsiniz?', percent:'%', noData:'Məlumat yoxdur', groupPrayers:'Namazlar', groupDeeds:'Zikr və əməllər', mon:'B.e', tue:'Ç.a', wed:'Çər', thu:'C.a', fri:'Cümə', sat:'Şən', sun:'Baz' },
  en: { title:'Daily Worship', subtitle:'Track your daily worship activities', today:'Today', streak:'Day streak', weekView:'Weekly view', completed:'Completed', reset:'Reset', resetConfirm:'Reset today\'s data?', percent:'%', noData:'No data', groupPrayers:'Prayers', groupDeeds:'Dhikr & good deeds', mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' },
  ru: { title:'Ежедневные Ибадаты', subtitle:'Отслеживайте ваши ежедневные поклонения', today:'Сегодня', streak:'Дней подряд', weekView:'Неделя', completed:'Завершено', reset:'Сбросить', resetConfirm:'Сбросить данные за сегодня?', percent:'%', noData:'Нет данных', groupPrayers:'Намазы', groupDeeds:'Зикр и благие дела', mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' },
  ar: { title:'العبادات اليومية', subtitle:'تتبع عباداتك اليومية', today:'اليوم', streak:'أيام متتالية', weekView:'عرض أسبوعي', completed:'مكتمل', reset:'إعادة تعيين', resetConfirm:'إعادة تعيين بيانات اليوم؟', percent:'٪', noData:'لا توجد بيانات', groupPrayers:'الصلوات', groupDeeds:'الأذكار والأعمال', mon:'إث', tue:'ث', wed:'أر', thu:'خ', fri:'ج', sat:'س', sun:'أح' },
  tr: { title:'Günlük İbadet', subtitle:'Günlük ibadetlerinizi takip edin', today:'Bugün', streak:'Gün serisi', weekView:'Haftalık görünüm', completed:'Tamamlandı', reset:'Sıfırla', resetConfirm:'Bugünün verilerini sıfırlamak istiyor musunuz?', percent:'%', noData:'Veri yok', groupPrayers:'Namazlar', groupDeeds:'Zikir ve ameller', mon:'Pzt', tue:'Sal', wed:'Çar', thu:'Per', fri:'Cum', sat:'Cmt', sun:'Paz' },
}

// icon — xətti ikon (Icon.jsx); v2-də göy qurşağı tonları yoxdur
const ACTIVITIES = [
  { key:'fajr', icon:'sunrise', az:'Sübh namazı', en:'Fajr prayer', ru:'Фаджр', ar:'صلاة الفجر', tr:'Sabah namazı' },
  { key:'dhuhr', icon:'sun', az:'Zöhr namazı', en:'Dhuhr prayer', ru:'Зухр', ar:'صلاة الظهر', tr:'Öğle namazı' },
  { key:'asr', icon:'sunLow', az:'Əsr namazı', en:'Asr prayer', ru:'Аср', ar:'صلاة العصر', tr:'İkindi namazı' },
  { key:'maghrib', icon:'sunset', az:'Məğrib namazı', en:'Maghrib prayer', ru:'Магриб', ar:'صلاة المغرب', tr:'Akşam namazı' },
  { key:'isha', icon:'moon', az:'İşa namazı', en:'Isha prayer', ru:'Иша', ar:'صلاة العشاء', tr:'Yatsı namazı' },
  { key:'quran', icon:'quran', az:'Quran oxumaq', en:'Read Quran', ru:'Чтение Корана', ar:'قراءة القرآن', tr:'Kuran okumak' },
  { key:'morning', icon:'sun', az:'Səhər əzkarları', en:'Morning adhkar', ru:'Утренние азкары', ar:'أذكار الصباح', tr:'Sabah ezkarları' },
  { key:'evening', icon:'moonStar', az:'Axşam əzkarları', en:'Evening adhkar', ru:'Вечерние азкары', ar:'أذكار المساء', tr:'Akşam ezkarları' },
  { key:'dhikr', icon:'dhikr', az:'Zikr', en:'Dhikr', ru:'Зикр', ar:'ذكر', tr:'Zikir' },
  { key:'sadaqah', icon:'donate', az:'Sədəqə', en:'Charity', ru:'Садака', ar:'صدقة', tr:'Sadaka' },
]

// Siyahı iki qrupda göstərilir (telefonda başlıqlı "inset" siyahılar;
// masaüstündə başlıqlar gizlidir və görünüş əvvəlki kimi tək siyahıdır)
const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const GROUPS = [
  { key:'prayers', title:'groupPrayers', items: ACTIVITIES.filter(a => PRAYER_KEYS.includes(a.key)) },
  { key:'deeds',   title:'groupDeeds',   items: ACTIVITIES.filter(a => !PRAYER_KEYS.includes(a.key)) },
]

// Əlavə mətnlər (5 dil)
const EXTRA = {
  az: { lead: 'Beş vaxt namazı, Quran oxumağı, əzkarları və sədəqəni hər gün qeyd edin — irəliləyiş və ardıcıllıq bu cihazda saxlanılır.', allDone: 'Bu günün bütün ibadətləri tamamlandı. Allah qəbul etsin!', saved: 'Qeydlər yalnız bu cihazda saxlanılır və «Namaz vaxtları» səhifəsinin namaz statistikası ilə birləşir.', progress: 'Bu günün irəliləyişi' },
  en: { lead: 'Mark the five daily prayers, Quran reading, adhkar and charity every day — progress and streaks are kept on this device.', allDone: 'All of today’s acts of worship are done. May Allah accept them!', saved: 'Entries are stored only on this device and are shared with the prayer stats on the Prayer Times page.', progress: 'Today’s progress' },
  ru: { lead: 'Отмечайте пять намазов, чтение Корана, азкары и садаку каждый день — прогресс и серия сохраняются на этом устройстве.', allDone: 'Все ибадаты на сегодня выполнены. Да примет Аллах!', saved: 'Записи хранятся только на этом устройстве и объединяются со статистикой намазов на странице «Время намаза».', progress: 'Прогресс за сегодня' },
  ar: { lead: 'سجّل الصلوات الخمس وقراءة القرآن والأذكار والصدقة كل يوم — يُحفَظ التقدم والأيام المتتالية على هذا الجهاز.', allDone: 'اكتملت عبادات اليوم كلها. تقبّل الله!', saved: 'تُحفَظ السجلات على هذا الجهاز فقط وتُدمَج مع إحصاءات الصلاة في صفحة مواقيت الصلاة.', progress: 'تقدّم اليوم' },
  tr: { lead: 'Beş vakit namazı, Kuran okumayı, ezkarları ve sadakayı her gün işaretleyin — ilerleme ve seri bu cihazda saklanır.', allDone: 'Bugünün tüm ibadetleri tamamlandı. Allah kabul etsin!', saved: 'Kayıtlar yalnızca bu cihazda saklanır ve Namaz Vakitleri sayfasındaki namaz istatistiğiyle birleşir.', progress: 'Bugünün ilerlemesi' },
}

// ── v3: izah, qrafik başlıqları, "harada edim" keçidləri ──
const V3 = {
  az: { avg: 'Həftəlik orta', how: 'Hər əməli edəndə sətrə toxunun — işarə qoyulur. Namaz işarələri «Namaz izləyicisi» ilə ortaqdır. Gün bitəndə həftəlik və aylıq qrafiklərə baxın.', weekSub: 'günün tamamlanma faizi', monthTitle: 'Son 30 gündə ardıcıllıq', monthSub: 'hər əməl neçə gün edilib', monthNote: 'Ən sevimli əməl az olsa da davamlı olandır (Buxari 6464, Müslim 782).', days: 'gün', whereTitle: 'Harada edim?', whereLead: 'Hər əməl üçün saytdakı uyğun bölmə.' },
  en: { avg: 'Weekly average', how: 'Tap a row when you have done it — it gets ticked. Prayer ticks are shared with the Prayer tracker. Check the weekly and monthly charts as the days go by.', weekSub: 'share of the day completed', monthTitle: 'Consistency over the last 30 days', monthSub: 'on how many days each deed was done', monthNote: 'The most beloved deeds are the most constant, even if small (al-Bukhari 6464, Muslim 782).', days: 'days', whereTitle: 'Where do I do it?', whereLead: 'The matching section of the site for each deed.' },
  ru: { avg: 'Среднее за неделю', how: 'Сделав дело, нажмите на строку — появится отметка. Отметки намазов общие с «Учётом намазов». По мере дней смотрите недельный и месячный графики.', weekSub: 'доля выполненного за день', monthTitle: 'Постоянство за 30 дней', monthSub: 'сколько дней совершалось каждое дело', monthNote: 'Самые любимые дела — постоянные, даже если малые (аль-Бухари 6464, Муслим 782).', days: 'дн.', whereTitle: 'Где это сделать?', whereLead: 'Подходящий раздел сайта для каждого дела.' },
  ar: { avg: 'متوسط الأسبوع', how: 'اضغط على السطر عند أداء العمل لتوضع علامة. علامات الصلاة مشتركة مع «متابعة الصلاة». وتابع الرسمين الأسبوعي والشهري مع الأيام.', weekSub: 'نسبة ما أُنجز في اليوم', monthTitle: 'المداومة في آخر 30 يومًا', monthSub: 'عدد الأيام التي أُدي فيها كل عمل', monthNote: 'أحب الأعمال إلى الله أدومها وإن قلّ (البخاري 6464، مسلم 782).', days: 'يومًا', whereTitle: 'أين أؤديه؟', whereLead: 'القسم المناسب في الموقع لكل عمل.' },
  tr: { avg: 'Haftalık ortalama', how: 'Bir ameli yaptığınızda satıra dokunun — işaretlenir. Namaz işaretleri «Namaz takibi» ile ortaktır. Günler geçtikçe haftalık ve aylık grafiklere bakın.', weekSub: 'günün tamamlanma yüzdesi', monthTitle: 'Son 30 günde süreklilik', monthSub: 'her amel kaç gün yapıldı', monthNote: 'Amellerin en sevimlisi az da olsa devamlı olanıdır (Buhârî 6464, Müslim 782).', days: 'gün', whereTitle: 'Nerede yapayım?', whereLead: 'Her amel için sitedeki uygun bölüm.' },
}
const WHERE = [
  { page: 'tracker', icon: 'tracker', t: { az: 'Namaz izləyicisi', en: 'Prayer tracker', ru: 'Учёт намазов', ar: 'متابعة الصلاة', tr: 'Namaz takibi' }, s: { az: 'Təqvim, seriya, qəza qeydi', en: 'Calendar, streak, missed prayers', ru: 'Календарь, серия, пропуски', ar: 'التقويم والتتابع والفوائت', tr: 'Takvim, seri, kaza kaydı' } },
  { page: 'quran', icon: 'quran', t: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' }, s: { az: 'Tərcümə və tilavət', en: 'Translation and recitation', ru: 'Перевод и чтение', ar: 'التفسير والتلاوة', tr: 'Meal ve tilavet' } },
  { page: 'hisn', icon: 'hisn', hash: 'adhkar', t: { az: 'Səhər və axşam əzkarları', en: 'Morning and evening adhkar', ru: 'Утренние и вечерние азкары', ar: 'أذكار الصباح والمساء', tr: 'Sabah ve akşam ezkarları' }, s: { az: 'Hisnul-Müslim, 28-ci fəsil', en: 'Hisn al-Muslim, chapter 28', ru: 'Хиснуль-муслим, глава 28', ar: 'حصن المسلم، الباب 28', tr: 'Hısnu’l-Müslim, 28. bölüm' } },
  { page: 'dhikr', icon: 'dhikr', t: { az: 'Zikr sayğacı', en: 'Dhikr counter', ru: 'Счётчик зикра', ar: 'عداد الذكر', tr: 'Zikir sayacı' }, s: { az: 'Təsbeh və namazdan sonrakı zikrlər', en: 'Tasbih and after-prayer adhkar', ru: 'Тасбих и зикры после намаза', ar: 'التسبيح وأذكار ما بعد الصلاة', tr: 'Tesbih ve namaz sonrası zikirler' } },
  { page: 'charity', icon: 'charity', t: { az: 'Sədəqə qeydi', en: 'Charity log', ru: 'Учёт садаки', ar: 'سجل الصدقة', tr: 'Sadaka kaydı' }, s: { az: 'Verdiyiniz sədəqələri yazın', en: 'Record the charity you give', ru: 'Записывайте свою садаку', ar: 'سجّل ما تتصدق به', tr: 'Verdiğiniz sadakaları kaydedin' } },
  { page: 'qada', icon: 'qada', t: { az: 'Qəza izləyicisi', en: 'Qada tracker', ru: 'Учёт возмещения', ar: 'متابعة القضاء', tr: 'Kaza takibi' }, s: { az: 'Qılınmamış namaz və oruclar', en: 'Missed prayers and fasts', ru: 'Пропущенные намазы и посты', ar: 'الصلوات والصيام الفائت', tr: 'Kılınmamış namaz ve oruçlar' } },
]
const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

const STORAGE_KEY = 'daily_tracker'

// /prayer səhifəsinin "Bu Ay Namaz" kartı eyni 5 namazı öz açarında saxlayır
// ('YYYY-MM-DD_Fajr': true). İki səhifə bir-birini görsün deyə bu namazlar
// hər iki yerə yazılır, oxuyanda isə birləşdirilir. Açar adları dəyişmir.
const PRAYER_STATS_KEY = 'muslim_cc_prayer_stats'
const PRAYER_STAT_NAMES = { fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' }
const PRAYER_SYNC_EVENT = 'qm-prayer-sync' // PrayerPage.jsx ilə eyni ad

// Gün açarı YERLİ tarixlə (toISOString UTC-dir: Bakıda 00:00–03:59 arası
// işarələnən namaz dünənə düşürdü). Format dəyişmir: 'YYYY-MM-DD'.
function getDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    const v = raw ? JSON.parse(raw) : {}
    return v && typeof v === 'object' ? v : {}
  } catch { return {} }
}

/** daily_tracker + /prayer statistikasındakı qılınmış namazlar (birləşmə). */
function loadData() {
  const data = readJSON(STORAGE_KEY)
  const stats = readJSON(PRAYER_STATS_KEY)
  for (const k of Object.keys(stats)) {
    const m = k.match(/^(\d{4}-\d{2}-\d{2})_(Fajr|Dhuhr|Asr|Maghrib|Isha)$/)
    if (!m || !stats[k]) continue
    const act = m[2].toLowerCase()
    data[m[1]] = { ...(data[m[1]] || {}), [act]: true }
  }
  return data
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

/** Namaz işarəsini ortaq izləyici qatı ilə yaz (utils/prayerTracker.js):
 *  /prayer statistikası + /prayer-tracker-in "qəza/qılmadım" qeydi ardıcıl
 *  qalır və digər səhifələrə hadisə ilə xəbər verilir. */
function syncPrayerStat(dateStr, key, done) {
  if (!PRAYER_STAT_NAMES[key]) return
  setPrayerStatus(dateStr, key, done ? 'prayed' : null)
}

function getLastDays(n = 7) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(getDateStr(d))
  }
  return days
}

function getDayLabel(dateStr, t) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const labels = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat]
  return labels[day]
}

// "26.10" kimi qısa tarix (oxlar üçün; dil neytral)
function fmtShort(dateStr) {
  return `${dateStr.slice(8)}.${dateStr.slice(5, 7)}`
}

function calcStreak(data) {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = getDateStr(d)
    const dayData = data[key]
    const allDone = !!dayData && ACTIVITIES.every(a => dayData[a.key])
    if (allDone) streak++
    // Bu gün hələ yarımçıq ola bilər — seriya dünəndən sayılır
    // (əvvəl bu gün tamamlanmayanda dünənki seriya da 0 görünürdü)
    else if (i === 0) continue
    else break
  }
  return streak
}


export default function DailyTrackerPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(LABELS, lang)
  const x = pickUi(EXTRA, lang, 'en')
  const today = getDateStr()
  // Son işarələnən sətir — bir dəfəlik "tamamlandı" effekti üçün
  const [justDone, setJustDone] = useState('')

  const [data, setData] = useState(loadData)
  // Bildirişdəki "✅ Qıldım" qeydlərini (IndexedDB) izləyiciyə köçür
  usePendingCheckinSync()

  useEffect(() => { saveData(data) }, [data])

  // /prayer (və ya başqa tab) namazı işarələyəndə yenidən oxu
  useEffect(() => {
    const reload = () => setData(loadData())
    const onStorage = (e) => { if (e.key === PRAYER_STATS_KEY || e.key === STORAGE_KEY) reload() }
    window.addEventListener(PRAYER_SYNC_EVENT, reload)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(PRAYER_SYNC_EVENT, reload)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const todayData = data[today] || {}
  const doneCount = ACTIVITIES.filter(a => todayData[a.key]).length
  const totalCount = ACTIVITIES.length
  const percent = Math.round((doneCount / totalCount) * 100)
  const streak = calcStreak(data)
  const last7 = getLastDays(7)
  const last30 = getLastDays(30)
  const v = pickUi(V3, lang, 'en')
  const weekData = last7.map(d => {
    const dd = data[d] || {}
    const pct = Math.round((ACTIVITIES.filter(a => dd[a.key]).length / totalCount) * 100)
    return { key: d, dow: getDayLabel(d, t), day: Number(d.slice(8)), label: `${getDayLabel(d, t)} ${Number(d.slice(8))}`, value: pct, current: d === today }
  })
  const weekAvg = Math.round(weekData.reduce((a, d) => a + d.value, 0) / weekData.length)
  const monthData = ACTIVITIES.map(a => ({
    key: a.key, label: pickUi(a, lang, 'en'),
    value: last30.filter(d => data[d] && data[d][a.key]).length,
    days: last30.map(d => !!(data[d] && data[d][a.key])),
  }))

  const toggle = useCallback((key) => {
    haptic() // telefonda yüngül titrəmə (yalnız həqiqi toxunuşda)
    const done = !(data[today] || {})[key]
    setJustDone(done ? key : '')
    // Əvvəl /prayer statistikası (onun hadisəsi loadData ilə yenidən oxuyur),
    // sonra bu səhifənin öz vəziyyəti
    syncPrayerStat(today, key, done)
    setData(prev => ({ ...prev, [today]: { ...(prev[today] || {}), [key]: done } }))
  }, [data, today])

  const resetToday = useCallback(() => {
    if (!window.confirm(t.resetConfirm)) return
    // Bu günün namaz işarələri /prayer statistikasından da silinir
    Object.keys(PRAYER_STAT_NAMES).forEach(k => syncPrayerStat(today, k, false))
    setData(prev => {
      const next = { ...prev }
      delete next[today]
      return next
    })
  }, [today, t.resetConfirm])

  return (
    <>
      {/* v2: sakit kağız hero — iz, eyebrow, bir h1, giriş */}
      <header className="ui-page-hero tracker-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
          {lang !== 'ar' && <p className="tracker-hero-ar ui-arabic" lang="ar" aria-hidden="true">العبادات اليومية</p>}
          <p className="ui-lead">{x.lead}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> <span>{v.how}</span></p>
        </div>
      </header>

      <section className="ui-section tracker-page">
        <div className="ui-container tracker-layout">
          {/* Üst hissə: halqa kartı yalnız bu qabın içində "yapışır" — aşağıdakı
              qrafiklərin üstünə keçmir (əvvəl sticky kart həftə kartını örtürdü) */}
          <div className="tracker-top">

          {/* Faiz halqası + statistika; hamısı bitəndə qızılı halqa və təbrik */}
          <div className={`tracker-progress-section ui-card${percent === 100 ? ' is-complete' : ''}`} data-reveal="scale">
            {percent === 100 && <Sparkle count={14} radius={110} />}
            <div className="tracker-circle-wrap" role="img" aria-label={`${x.progress}: ${percent}% (${doneCount}/${totalCount})`}>
              {/* "Bugünkü nurunuz": hər əməl bir ləçək (daxildə 5 namaz, çöldə 5 əməl) */}
              <div className="tracker-circle tracker-rosette" data-testid="nur-rosette">
                <NurRosette done={todayData} inner={ACTIVITIES.slice(0, 5).map(a => a.key)} outer={ACTIVITIES.slice(5).map(a => a.key)} />
              </div>
              <div className="tracker-circle-text" aria-hidden="true">
                {/* key: faiz dəyişəndə rəqəm yüngülcə "sıçrayır" (yalnız transform) */}
                <span className="tracker-circle-pct" key={percent}>{percent}{t.percent}</span>
                <span className="tracker-circle-label">{doneCount}/{totalCount}</span>
              </div>
            </div>

            <div className="tracker-progress-side">
              <h2 className="tracker-progress-title">{x.progress}</h2>
              <div className="tracker-stats">
                <div className="tracker-stat">
                  <span className="tracker-stat-ic" aria-hidden="true"><Icon name="bolt" size={18} /></span>
                  <span className="tracker-stat-value ui-num">{streak}</span>
                  <span className="tracker-stat-label">{t.streak}</span>
                </div>
                <div className="tracker-stat">
                  <span className="tracker-stat-ic" aria-hidden="true"><Icon name="check" size={18} /></span>
                  <span className="tracker-stat-value ui-num">{doneCount}<small>/{totalCount}</small></span>
                  <span className="tracker-stat-label">{t.completed}</span>
                </div>
              </div>
              <p className="tracker-done-msg" aria-live="polite">
                {percent === 100 && <><Icon name="sparkle" size={16} /> {x.allDone}</>}
              </p>
            </div>
          </div>

          {/* Bu günün ibadətləri — telefonda iki qruplu "inset" siyahı
              (ikon kafeli + animasiyalı dairəvi işarə), masaüstündə əvvəlki
              ayrı-ayrı sətirlər. Sətirlər növbə ilə görünür (data-reveal). */}
          <div className="tracker-today">
            <div className="tracker-section-header">
              <h2>{t.today}</h2>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm tracker-reset" onClick={resetToday} disabled={doneCount === 0}>
                <Icon name="refresh" className="ui-btn__icon" /> {t.reset}
              </button>
            </div>

            <div className="tracker-groups">
              {GROUPS.map(g => (
                <div key={g.key} className="tracker-group">
                  <h3 className="tracker-group-title">
                    <span>{t[g.title]}</span>
                    <span className="tracker-group-count ui-num">{g.items.filter(a => todayData[a.key]).length}/{g.items.length}</span>
                  </h3>
                  <ul className="tracker-list ui-card ui-card--flush" data-reveal="stagger">
                    {g.items.map(act => {
                      const done = !!todayData[act.key]
                      return (
                        <li key={act.key}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={done}
                            className={`tracker-item${done ? ' done' : ''}${done && justDone === act.key ? ' just-done' : ''}`}
                            onClick={() => toggle(act.key)}
                          >
                            <span className="tracker-item-icon" aria-hidden="true"><Icon name={act.icon} /></span>
                            <span className="tracker-item-label">{pickUi(act, lang, 'en')}</span>
                            {/* Animasiyalı dairəvi işarə (motion.css .m-check): dolur, ✓ çəkilir */}
                            <span className="m-check tracker-item-check" aria-hidden="true">
                              <svg viewBox="0 0 24 24"><path d="M6.5 12.5l3.8 3.8L17.5 8.5" /></svg>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          </div>

          {/* Həftə (gün kafelləri) + son 30 gündə hər əməlin ardıcıllığı (istilik xəritəsi) */}
          <div className="tracker-week">
            <div className="tracker-charts">
              <section className="ui-card tracker-chart" data-reveal aria-labelledby="tracker-week-h">
                <h2 className="tracker-chart-title" id="tracker-week-h">{t.weekView}</h2>
                <p className="tracker-chart-sub">{v.weekSub}</p>
                <ol className="tracker-week-grid tm-cascade">
                  {weekData.map(d => (
                    <li key={d.key}
                      className={`tracker-week-day${d.current ? ' today' : ''}${d.value === 100 ? ' complete' : ''}`}
                      aria-label={`${d.label}: ${d.value}%`}>
                      <span className="tracker-week-label" aria-hidden="true">{d.dow}</span>
                      <span className="tracker-week-num ui-num" aria-hidden="true">{d.day}</span>
                      <span className="tracker-week-bar-wrap" aria-hidden="true">
                        <span className="tracker-week-bar" style={{ '--p': d.value / 100 }} />
                      </span>
                      <span className="tracker-week-pct ui-num" aria-hidden="true">{d.value > 0 ? `${d.value}%` : '—'}</span>
                    </li>
                  ))}
                </ol>
                <div className="tracker-week-avg">
                  <span>{v.avg}</span>
                  <span className="ui-num">{weekAvg}%</span>
                </div>
                <span className="tracker-week-avgbar" aria-hidden="true"><span style={{ '--p': weekAvg / 100 }} /></span>
              </section>

              <section className="ui-card tracker-chart" aria-labelledby="tracker-month-h">
                <h2 className="tracker-chart-title" id="tracker-month-h">{v.monthTitle}</h2>
                <p className="tracker-chart-sub">{v.monthSub}</p>
                <ul className="tracker-heat">
                  {monthData.map(m => (
                    <li key={m.key} className="tracker-heat-row" aria-label={`${m.label}: ${m.value} / 30`}>
                      <span className="tracker-heat-label">{m.label}</span>
                      <span className="tracker-heat-cells" aria-hidden="true">
                        {m.days.map((on, i) => (
                          <span key={i} className={`tracker-heat-cell${on ? ' on' : ''}${i === 29 ? ' is-today' : ''}`} />
                        ))}
                      </span>
                      <span className="tracker-heat-count ui-num" aria-hidden="true">{m.value}<small>/30</small></span>
                    </li>
                  ))}
                </ul>
                <div className="tracker-heat-row tracker-heat-axis" aria-hidden="true">
                  <span />
                  <span className="tracker-heat-axis-mid">
                    <span className="ui-num">{fmtShort(last30[0])}</span>
                    <span>{t.today}</span>
                  </span>
                  <span />
                </div>
                <p className="tracker-chart-note">{v.monthNote}</p>
              </section>
            </div>
            <p className="tracker-note"><Icon name="info" size={15} /> {x.saved}</p>
          </div>

        </div>
      </section>

      <section className="ui-section ui-section--tight tracker-where" aria-labelledby="tracker-where-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 className="ui-title ui-title--sm" id="tracker-where-h">{v.whereTitle}</h2>
            <p className="ui-lead">{v.whereLead}</p>
          </div>
          <ul className="ui-tiles" style={{ '--ui-tiles-min': '220px' }} data-reveal="stagger">
            {WHERE.map(w => (
              <li key={w.page}>
                <a className="ui-tile ui-tile--row" href={`${pathFor(w.page, lang)}${w.hash ? `#${w.hash}` : ''}`}
                  onClick={(e) => { if (!w.hash && setPage && plainClick(e)) { e.preventDefault(); setPage(w.page) } }}>
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={w.icon} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{pickUi(w.t, lang, 'en')}</span>
                    <span className="ui-tile__text">{pickUi(w.s, lang, 'en')}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
