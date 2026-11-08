import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { qiyamState, hm } from '../utils/qiyam'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { subscribeToSettings } from '../data/adminContent'
import usePrayerTimes from '../hooks/usePrayerTimes'
import { usePrayerLocation, setAdminDefaultCity, locationSig } from '../utils/prayerLocation'
import CityPicker from '../components/CityPicker'
import { haptic } from '../hooks/useHaptic'
import { pathFor, PAGES } from '../seo/routes'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import '../styles/PrayerPage.css'
import DeferRender from '../components/DeferRender'
import Breadcrumb from '../components/Breadcrumb'
import { showLocalNotification } from '../utils/notify'
import { localizeSource } from '../utils/sourceNames'
import { playAzan } from '../utils/azanAudio'
import RamadanCard from '../components/RamadanCard'
import PrayerCheckinCard from '../components/PrayerCheckinCard'
import { setPrayerStatus } from '../utils/prayerTracker'
import { usePendingCheckinSync } from '../hooks/usePrayerTracker'
import usePrayerMonth from '../hooks/usePrayerMonth'
import PrayerDayline, { hmToMin } from '../components/PrayerDayline'
import PrayerSky from '../components/prayer/PrayerSky'
import SunDial from '../components/prayer/SunDial'
import RollingDigits from '../components/prayer/RollingDigits'
import Sparkle from '../components/prayer/Sparkle'
import '../styles/ToolsMotion.css'
import CalendarSubscribe from '../components/prayer/CalendarSubscribe'
import HomeScreenWidget from '../components/prayer/HomeScreenWidget'
import { ProgressRing, StatTile } from '../components/viz'
import { pickUi } from '../utils/uiText'

// İmsakiyyə səhifəsi (/ramadan) marşrutlara qoşulubsa kartda ona keçid görünür
const HAS_RAMADAN_PAGE = PAGES.some(p => p.key === 'ramadan')
// Namaz izləyicisi (/prayer-tracker) marşrutlara qoşulubsa statistika kartında keçid
const HAS_TRACKER_PAGE = PAGES.some(p => p.key === 'tracker')

// Şəhər seçimi bütün saytda ortaqdır (utils/prayerLocation.js): burada
// seçilən şəhər ana səhifənin namaz kartında, /jamaat-da və push
// bildirişlərinin saatında da istifadə olunur. Vaxtlar şəhərin koordinatı
// ilə hesablanır (usePrayerTimes) — əvvəlki "timingsByCity" sorğusu yoxdur.

// ── Tarix və saat ──
// Chrome-un yığcam ICU-sunda "az" lokalı yoxdur ("2026 M09 19" çıxırdı) —
// azərbaycanca əl ilə yazılır (JamaatPage ilə eyni). Ərəbcədə Qriqorian
// təqvim və latın rəqəmləri: vaxtlar siyahısı ilə eyni rəqəmlər.
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const AZ_WEEKDAYS = ['bazar','bazar ertəsi','çərşənbə axşamı','çərşənbə','cümə axşamı','cümə','şənbə']
const DATE_LOCALES = { en:'en-GB', ru:'ru-RU', tr:'tr-TR', ar:'ar-u-ca-gregory-nu-latn' }

const pad2 = (n) => String(n).padStart(2, '0')
const formatClockTime = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`

function formatClockDate(d, lang) {
  if (lang === 'az') return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${AZ_WEEKDAYS[d.getDay()]}`
  const opts = { weekday:'long', day:'numeric', month:'long', year:'numeric' }
  try { return d.toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', opts) } catch { return d.toLocaleDateString('en-GB', opts) }
}

// Hicri ay adları (CalendarPage / JamaatPage ilə eyni yazılış)
const HIJRI_MONTHS = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}
const HIJRI_SUFFIX = { az:'H', en:'AH', ru:'г.х.', ar:'هـ', tr:'H' }

/** aladhan-ın iki hicri formatını ({month:{number,en,ar}} və usePrayerTimes-in {month,monthEn,monthAr}) birləşdir. */
function normHijri(h) {
  if (!h) return null
  const monthObj = typeof h.month === 'object' && h.month ? h.month : null
  const month = Number(monthObj ? monthObj.number : h.month) || 0
  const day = Number(h.day) || 0
  const year = String(h.year || '')
  if (!day || !year || month < 1 || month > 12) return null
  return {
    day, month, year,
    monthEn: monthObj ? (monthObj.en || '') : (h.monthEn || ''),
    monthAr: monthObj ? (monthObj.ar || '') : (h.monthAr || ''),
  }
}

/** "8 Rəbiül-Axir 1448 H"; ərəbcədə yalnız ərəbcə ay adı: "8 ربيع الآخر 1448 هـ". */
function hijriLine(h, lang) {
  const month = lang === 'ar'
    ? (h.monthAr || HIJRI_MONTHS.ar[h.month - 1])
    : (HIJRI_MONTHS[lang]?.[h.month - 1] || h.monthEn)
  return `${h.day} ${month} ${h.year} ${pickUi(HIJRI_SUFFIX, lang, 'en')}`
}

// ── Namaz statistikası hook ──────────────────────────
const STAT_KEYS = ['Fajr','Dhuhr','Asr','Maghrib','Isha']

const STATS_LABELS = {
  az: { weeklyTitle: 'Həftəlik namaz', monthlyTitle: 'Aylıq irəliləyiş', completed: 'tamamlandı', days: ['Baz','B.e','Ç.a','Çər','C.a','Cümə','Şən'] },
  en: { weeklyTitle: 'Weekly Prayer', monthlyTitle: 'Monthly Progress', completed: 'completed', days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
  ru: { weeklyTitle: 'Молитвы за неделю', monthlyTitle: 'Прогресс за месяц', completed: 'выполнено', days: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'] },
  ar: { weeklyTitle: 'صلوات الأسبوع', monthlyTitle: 'تقدم الشهر', completed: 'مكتمل', days: ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'] },
  tr: { weeklyTitle: 'Haftalık Namaz', monthlyTitle: 'Aylık İlerleme', completed: 'tamamlandı', days: ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'] },
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function monthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function daysInCurrentMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()
}

// /dailytracker eyni 5 namazı 'daily_tracker'-də saxlayır ({ 'YYYY-MM-DD': { fajr:true } }).
// İki səhifə bir-birini görsün deyə oxuyanda birləşdirilir, işarələyəndə
// hər iki yerə yazılır. Açar adları dəyişmir.
const STATS_KEY = 'muslim_cc_prayer_stats'
const TRACKER_KEY = 'daily_tracker'
const PRAYER_SYNC_EVENT = 'qm-prayer-sync' // DailyTrackerPage.jsx ilə eyni ad

function readJSON(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch { return {} }
}

function loadStats() {
  const data = readJSON(STATS_KEY)
  const tracker = readJSON(TRACKER_KEY)
  for (const [date, day] of Object.entries(tracker)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !day || typeof day !== 'object') continue
    for (const p of STAT_KEYS) if (day[p.toLowerCase()]) data[`${date}_${p}`] = true
  }
  return data
}

function usePrayerStats() {
  const [data, setData] = useState(loadStats)

  // /dailytracker (və ya başqa tab) namazı işarələyəndə yenidən oxu
  useEffect(() => {
    const reload = () => setData(loadStats())
    const onStorage = (e) => { if (e.key === STATS_KEY || e.key === TRACKER_KEY) reload() }
    window.addEventListener(PRAYER_SYNC_EVENT, reload)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(PRAYER_SYNC_EVENT, reload)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Yazı ortaq izləyici qatı ilə (utils/prayerTracker.js): hər iki köhnə açar
  // + /prayer-tracker-in "qəza/qılmadım" qeydi ardıcıl qalır; hadisə atılır
  const toggle = (prayer) => {
    const date = todayKey()
    const done = !data[`${date}_${prayer}`]
    setPrayerStatus(date, prayer.toLowerCase(), done ? 'prayed' : null)
    setData(loadStats())
  }

  const isDone = (prayer, dateStr) => !!data[`${dateStr}_${prayer}`]
  const todayDone = STAT_KEYS.filter(p => isDone(p, todayKey()))

  // Bu aydakı toplam edilən namazlar
  const prefix = monthPrefix()
  const totalDone = Object.keys(data).filter(k => k.startsWith(prefix) && data[k]).length
  const totalPossible = daysInCurrentMonth() * 5
  const pct = Math.min(100, Math.round((totalDone / totalPossible) * 100))

  return { toggle, isDone, todayDone, totalDone, totalPossible, pct, data }
}

function useWeeklyStats(data) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const prayers = {}
    STAT_KEYS.forEach(p => {
      prayers[p] = !!data[`${key}_${p}`]
    })
    days.push({ date: key, day: d.getDay(), prayers })
  }
  return days
}
// ────────────────────────────────────────────────────

/** Hədəf ana (epoch ms) qədər qalan vaxt "HH:MM:SS" — hər saniyə yenilənir. */
function useCountdownTo(at) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!at) return undefined
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [at])
  if (!at) return '--:--:--'
  const diff = Math.max(0, at - now)
  const h = Math.floor(diff / 3.6e6), m = Math.floor((diff % 3.6e6) / 6e4), sec = Math.floor((diff % 6e4) / 1e3)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

/** Şəhərin saat qurşağında indiki "HH:MM" (əzan bildirişi şəhərin vaxtı ilə yoxlanır). */
function hhmmIn(tz) {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date())
  } catch {
    const d = new Date()
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
}

// v2: emoji və göy qurşağı kafelləri əvəzinə xətti ikonlar (Icon.jsx) —
// ana səhifənin namaz kartı ilə eyni: sübh — günəş doğur, zöhr — günəş,
// əsr — alçaq günəş, məğrib — batır, işa — ay. "Günəş" (şuruq) namaz deyil —
// sətri sakit rəngdə göstərilir; ikonu (sun) zöhrlə eynidir, Icon.jsx-də ayrıca
// "üfüqdə günəş" ikonu yoxdur.
const PRAYER_ICONS = { Fajr:'sunrise', Sunrise:'sun', Dhuhr:'sun', Asr:'sunLow', Maghrib:'sunset', Isha:'moon' }
// .m-check-in ✓ xətti (motion.css)
const CHECK_PATH = 'M6.5 12.5l3.8 3.8L17.5 8.5'

// Sünnə namazları və namaz duaları — hər birinin mənbəyi source sahəsindədir (sunnah.com ilə
// yoxlanılıb). Vitr: rükət sayı 1-dən başlayır (Muslim 752), təhəccüdün yuxarı həddi yoxdur (Buxari 990).
const SUNNAH_PRAYERS = [
  { icon:'sunrise', rakat:'2', name:{ az:'Sübh sünnəsi', en:'Fajr Sunnah', ru:'Сунна Фаджр', ar:'سنة الفجر', tr:'Sabah sünneti' }, desc:{ az:'Fərz namazdan əvvəl 2 rükət', en:'2 rakat before Fajr', ru:'2 ракаата до Фаджр', ar:'ركعتان قبل الفجر', tr:'Farzdan önce 2 rekât' }, source:'Muslim 725' },
  { icon:'sun', rakat:'4+2', name:{ az:'Zöhr sünnəsi', en:'Dhuhr Sunnah', ru:'Сунна Зухр', ar:'سنة الظهر', tr:'Öğle sünneti' }, desc:{ az:'Fərzdən əvvəl 4, sonra 2 rükət', en:'4 before, 2 after Dhuhr', ru:'4 до и 2 после Зухр', ar:'أربع قبل وركعتان بعد الظهر', tr:'Farzdan önce 4, sonra 2 rekât' }, source:'Tirmizi 415' },
  { icon:'sunLow', rakat:'4', name:{ az:'Əsr sünnəsi', en:'Asr Sunnah', ru:'Сунна Аср', ar:'سنة العصر', tr:'İkindi sünneti' }, desc:{ az:'Müstəhəb — 4 rükət əvvəl', en:'Recommended — 4 rakat before', ru:'Рекомендуется — 4 ракаата до', ar:'مستحب — أربع ركعات قبل', tr:'Müstehap — farzdan önce 4 rekât' }, source:'Əbu Davud 1271' },
  { icon:'sunset', rakat:'2', name:{ az:'Məğrib sünnəsi', en:'Maghrib Sunnah', ru:'Сунна Магриб', ar:'سنة المغرب', tr:'Akşam sünneti' }, desc:{ az:'Fərzdən sonra 2 rükət', en:'2 rakat after Maghrib', ru:'2 ракаата после Магриб', ar:'ركعتان بعد المغرب', tr:'Farzdan sonra 2 rekât' }, source:'Tirmizi 415' },
  { icon:'moon', rakat:'2', name:{ az:'İşa sünnəsi', en:'Isha Sunnah', ru:'Сунна Иша', ar:'سنة العشاء', tr:'Yatsı sünneti' }, desc:{ az:'Fərzdən sonra 2 rükət', en:'2 rakat after Isha', ru:'2 ракаата после Иша', ar:'ركعتان بعد العشاء', tr:'Farzdan sonra 2 rekât' }, source:'Tirmizi 415' },
  { icon:'moon', rakat:'1+', name:{ az:'Vitr namazı', en:'Witr Prayer', ru:'Витр намаз', ar:'صلاة الوتر', tr:'Vitir namazı' }, desc:{ az:'İşadan fəcrə qədər, ən azı 1 rükət; oyanacağına əmin olan üçün gecənin sonunda əfzəldir', en:'From Isha until Fajr, at least 1 rakat; best at the end of the night for one sure to wake', ru:'От Иша до рассвета, минимум 1 ракаат; лучше в конце ночи, если уверен, что проснётся', ar:'من العشاء إلى الفجر، أقله ركعة، وآخر الليل أفضل لمن طمع أن يقوم', tr:'Yatsıdan fecre kadar, en az 1 rekât; kalkacağından emin olan için gecenin sonunda efdaldir' }, source:'Muslim 752, 755' },
  { icon:'duas', rakat:'2+', name:{ az:'Təhəccüd', en:'Tahajjud', ru:'Тахаджуд', ar:'تهجد', tr:'Teheccüd' }, desc:{ az:'Gecə namazı — ən fəzilətli nafilə', en:'Night prayer — most virtuous voluntary prayer', ru:'Ночной намаз — самая достойная добровольная молитва', ar:'صلاة الليل — أفضل النوافل', tr:'Gece namazı — en faziletli nafile' }, source:'Muslim 1163; Buxari 990' },
  { icon:'sun', rakat:'2', name:{ az:'Duha namazı', en:'Duha Prayer', ru:'Намаз Духа', ar:'صلاة الضحى', tr:'Kuşluk namazı' }, desc:{ az:'Günəş doğandan 15 dəq sonra — zöhrdən əvvəl', en:'15 min after sunrise until before Dhuhr', ru:'Через 15 мин после рассвета до Зухр', ar:'بعد شروق الشمس بربع ساعة حتى قبل الظهر', tr:'Güneş doğduktan 15 dk sonra — öğleye kadar' }, source:'Muslim 720, 748' },
]

const PRAYER_DUAS = [
  { name:{ az:'İstiftah duası', en:'Opening Dua (Istiftah)', ru:'Дуа Истифтах', ar:'دعاء الاستفتاح', tr:'İstiftah duası' }, ar:'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلَهَ غَيْرُكَ', trans:{ az:'Allahım, Səni təsbih edir, Sənə həmd edirəm. Adın mübarəkdir, şanın ucadır, Səndən başqa ilah yoxdur.', en:'Glory be to You O Allah, and praise. Blessed is Your name, exalted is Your majesty, there is no god but You.', ru:'Пречист Ты, о Аллах, и хвала Тебе. Благословенно имя Твоё, возвышено величие Твоё, и нет бога, кроме Тебя.', ar:'سبحانك اللهم وبحمدك، تبارك اسمك وتعالى جدك، ولا إله غيرك', tr:'Seni tesbih ederim Allah\'ım ve Sana hamd ederim. Adın mübarektir, şanın yücedir, Senden başka ilah yoktur.' }, source:'Əbu Davud 775' },
  { name:{ az:'Rüku duası', en:'Ruku Dua', ru:'Дуа руку', ar:'دعاء الركوع', tr:'Rükû duası' }, ar:'سُبْحَانَ رَبِّيَ الْعَظِيم', trans:{ az:'Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most Great.', ru:'Пречист мой Господь Великий.', ar:'سبحان ربي العظيم', tr:'Ulu Rabbim noksansızdır.' }, source:'Muslim 772' },
  { name:{ az:'Səcdə duası', en:'Sujud Dua', ru:'Дуа суджуд', ar:'دعاء السجود', tr:'Secde duası' }, ar:'سُبْحَانَ رَبِّيَ الأَعْلَى', trans:{ az:'Ən Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most High.', ru:'Пречист мой Господь Всевышний.', ar:'سبحان ربي الأعلى', tr:'Yüce Rabbim noksansızdır.' }, source:'Muslim 772' },
  { name:{ az:'Təşəhhüd', en:'Tashahhud', ru:'Ташаххуд', ar:'التشهد', tr:'Tahiyyat' }, ar:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ', trans:{ az:'Bütün salamlar, namazlar və yaxşılıqlar Allaha məxsusdur. Ey Peyğəmbər, sənə Allahın salamı, rəhməti və bərəkəti olsun.', en:'All greetings, prayers and good deeds are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings.', ru:'Все приветствия, молитвы и благие дела — Аллаху. Мир тебе, о Пророк, и милость Аллаха, и Его благословения.', ar:'التحيات لله والصلوات والطيبات، السلام عليك أيها النبي ورحمة الله وبركاته', tr:'Tahiyyat, salavat ve tayyibat Allah\'a aittir. Ey Peygamber, Allah\'ın selamı, rahmeti ve bereketi senin üzerine olsun.' }, source:'Buxari 831' },
  { name:{ az:'Salavat', en:'Salawat', ru:'Салават', ar:'الصلاة الإبراهيمية', tr:'Salli-Barik' }, ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ', trans:{ az:'Allahım, İbrahimə salavat gətirdiyin kimi, Muhammədə və ailəsinə də salavat gətir.', en:'O Allah, send blessings upon Muhammad and his family as You sent blessings upon Ibrahim.', ru:'О Аллах, благослови Мухаммада и его семью, как Ты благословил Ибрахима.', ar:'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم', tr:'Allah\'ım, İbrahim\'e salat ettiğin gibi Muhammed\'e ve ailesine de salat et.' }, source:'Buxari 3370' },
]

const SUNNAH_LABELS = { az:'Sünnə namazları', en:'Sunnah Prayers', ru:'Сунна-намазы', ar:'صلوات السنة', tr:'Sünnet Namazları' }
const DUA_LABELS = { az:'Namaz duaları', en:'Prayer Duas', ru:'Молитвенные дуа', ar:'أدعية الصلاة', tr:'Namaz Duaları' }

// Səhifənin qısa mətnləri (5 dil)
const TXT = {
  jamaatLink: { az:'Camaat və cümə namazı', en:'Congregational & Friday prayer', ru:'Коллективный и пятничный намаз', ar:'صلاة الجماعة والجمعة', tr:'Cemaat ve Cuma namazı' },
  // {city} — seçilmiş şəhərin adı
  calcNote:   { az:'Vaxtlar {city} üçün hesablanıb', en:'Times calculated for {city}', ru:'Время рассчитано для города {city}', ar:'المواقيت محسوبة لمدينة {city}', tr:'Vakitler {city} için hesaplandı' },
  loadError:  { az:'Namaz vaxtları yüklənmədi. İnternet bağlantısını yoxlayın.', en:'Could not load prayer times. Check your connection.', ru:'Не удалось загрузить время намаза. Проверьте подключение.', ar:'تعذّر تحميل مواقيت الصلاة. تحقّق من الاتصال.', tr:'Namaz vakitleri yüklenemedi. Bağlantınızı kontrol edin.' },
  retry:      { az:'Yenidən yoxla', en:'Try again', ru:'Повторить', ar:'أعد المحاولة', tr:'Tekrar dene' },
  notifBody:  { az:'Namaz vaxtı gəldi!', en:'It is time for prayer', ru:'Наступило время намаза', ar:'حان وقت الصلاة', tr:'Namaz vakti geldi' },
  // Telefonda əzan sətrinin alt yazısı (masaüstündə gizlidir)
  azanSub:    { az:'Namaz vaxtı girəndə bildiriş və səs', en:'Notification and sound at prayer time', ru:'Уведомление и звук во время намаза', ar:'إشعار وصوت عند دخول وقت الصلاة', tr:'Namaz vaktinde bildirim ve ses' },
  azanOn:     { az:'Əzan aktiv', en:'Azan active', ru:'Азан включён', ar:'الأذان مفعل', tr:'Ezan aktif' },
  azanOff:    { az:'Əzan bildirişi', en:'Azan notification', ru:'Уведомление азана', ar:'إشعار الأذان', tr:'Ezan bildirimi' },
  // Bildiriş icazəsi brauzerdə bağlanıbsa — səs yenə çalınır, amma bildiriş gəlmir
  azanBlocked:{ az:'Brauzer bildirişləri bağlıdır — yalnız səs çalınacaq', en:'Browser notifications are blocked — only the sound will play', ru:'Уведомления браузера заблокированы — будет только звук', ar:'إشعارات المتصفح محظورة — سيُشغَّل الصوت فقط', tr:'Tarayıcı bildirimleri kapalı — yalnızca ses çalınacak' },
  lead:       { az:'Seçdiyiniz şəhər üçün bugünkü azan vaxtları, növbəti namaza qalan vaxt və gündəlik namaz izləyicisi.', en:'Today’s adhan times for your chosen city, a countdown to the next prayer and a daily prayer tracker.', ru:'Время азана на сегодня для выбранного города, отсчёт до следующего намаза и ежедневный трекер.', ar:'مواقيت الأذان لهذا اليوم في المدينة التي تختارها، والعدّ التنازلي للصلاة القادمة، ومتابعة الصلوات اليومية.', tr:'Seçtiğiniz şehir için bugünkü ezan vakitleri, sonraki namaza kalan süre ve günlük namaz takibi.' },
  todayTimes: { az:'Bugünkü vaxtlar', en:'Today’s times', ru:'Время на сегодня', ar:'مواقيت اليوم', tr:'Bugünkü vakitler' },
  calc:       { az:'Hesablanmış', en:'Calculated', ru:'Расчётное', ar:'محسوبة', tr:'Hesaplanmış' },
  nextBadge:  { az:'Növbəti', en:'Next', ru:'Следующий', ar:'التالي', tr:'Sonraki' },
  tomorrow:   { az:'sabah', en:'tomorrow', ru:'завтра', ar:'غدًا', tr:'yarın' },
  now:        { az:'İndi', en:'Now', ru:'Сейчас', ar:'الآن', tr:'Şu an' },
  trackerLink:{ az:'Namaz izləyicisi: hesabat və qəza sayğacı', en:'Prayer tracker: reports and qada counter', ru:'Трекер намазов: отчёты и счётчик каза', ar:'متابعة الصلاة: التقارير وعدّاد القضاء', tr:'Namaz takibi: raporlar ve kaza sayacı' },
  allDone:    { az:'Bu günün beş namazı qılındı', en:'All five prayers done today', ru:'Все пять намазов сегодня выполнены', ar:'أُدِّيَت الصلوات الخمس اليوم', tr:'Bugünün beş vakit namazı kılındı' },
}

// usePrayerTimes açarları → aladhan adları (səhifənin qalanı bu adlarla işləyir)
const API_NAME = { fajr:'Fajr', sunrise:'Sunrise', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' }

// ── Dizayn v3: yeni bölmələrin mətnləri (5 dil) ─────────
// Hədislər yoxlanılıb (fawazahmed0/hadith-api; Müslim — Əbdülbaqi nömrəsi):
//   Müslim 612 — beş namazın vaxtlarının başlanğıcı/sonu; Müslim 608 — əsrdən
//   günəş batmamış bir rükət çatdıran əsri çatdırmışdır; Müslim 831 — nafilə
//   qılınmayan üç vaxt; Buxari 586 — sübhdən və əsrdən sonra; Buxari 597 —
//   unudulan namaz xatırlananda qılınır; Buxari 527 — ən sevimli əməl vaxtında
//   qılınan namaz; Buxari 1145 — gecənin son üçdə biri; Müslim 728 — gündə 12 rükət.
const V3 = {
  how: {
    az: 'Necə işlədilir: şəhərinizi seçin — vaxtlar avtomatik hesablanır. Qıldığınız namazı aşağıda qeyd edin; əzan bildirişi vaxt girəndə səslə xəbər verir.',
    en: 'How to use: pick your city — times are calculated automatically. Tick the prayers you pray below; the adhan alert tells you with a sound when a time begins.',
    ru: 'Как пользоваться: выберите город — время рассчитывается автоматически. Отмечайте совершённые намазы ниже; уведомление азана сообщит звуком о наступлении времени.',
    ar: 'طريقة الاستخدام: اختر مدينتك فتُحسب المواقيت تلقائيًا. علِّم صلواتك أدناه، وينبّهك الأذان بصوت عند دخول الوقت.',
    tr: 'Nasıl kullanılır: şehrinizi seçin — vakitler otomatik hesaplanır. Kıldığınız namazı aşağıda işaretleyin; ezan bildirimi vakit girince sesle haber verir.',
  },
  stats: [
    { v: '5',  l: { az: 'fərz namaz', en: 'obligatory prayers', ru: 'обязательных намазов', ar: 'صلوات مفروضة', tr: 'farz namaz' } },
    { v: '17', l: { az: 'fərz rükət gündə', en: 'obligatory rak‘ahs a day', ru: 'обязательных ракаатов в день', ar: 'ركعة مفروضة في اليوم', tr: 'günde farz rekât' } },
    { v: '12', l: { az: 'sünnə rükəti', en: 'sunnah rak‘ahs', ru: 'ракаатов сунны', ar: 'ركعة من السنن الرواتب', tr: 'sünnet rekâtı' } },
  ],
  dayEyebrow: { az: 'Bir baxışda', en: 'At a glance', ru: 'С первого взгляда', ar: 'نظرة سريعة', tr: 'Bir bakışta' },
  dayTitle:   { az: 'Günün xətti', en: 'The day at a glance', ru: 'День на одной линии', ar: 'اليوم في خط واحد', tr: 'Günün çizgisi' },
  dayLead:    { az: 'Gecə, şəfəq və gündüz zolağında beş namaz və günəşin doğuşu; zümrüd nişan — indiki an.', en: 'The five prayers and sunrise on a night–twilight–day strip; the green marker is the current moment.', ru: 'Пять намазов и восход на полосе ночь–сумерки–день; зелёная метка — текущий момент.', ar: 'الصلوات الخمس والشروق على شريط الليل والشفق والنهار؛ والعلامة الخضراء هي اللحظة الحالية.', tr: 'Gece, şafak ve gündüz şeridinde beş vakit ve güneşin doğuşu; yeşil işaret şu anki zamandır.' },
  dayLabel:   { az: 'Günün namaz vaxtları', en: 'Today’s prayer times', ru: 'Время намазов сегодня', ar: 'مواقيت الصلاة اليوم', tr: 'Bugünün namaz vakitleri' },
  dayLen:     { az: 'Gündüz', en: 'Daylight', ru: 'Световой день', ar: 'النهار', tr: 'Gündüz' },
  dayLenHint: { az: 'günəşin doğuşundan batışına', en: 'from sunrise to sunset', ru: 'от восхода до заката', ar: 'من الشروق إلى الغروب', tr: 'doğuştan batışa' },
  nightLen:   { az: 'Gecə', en: 'Night', ru: 'Ночь', ar: 'الليل', tr: 'Gece' },
  nightHint:  { az: 'məğribdən sübhə', en: 'from Maghrib to Fajr', ru: 'от магриба до фаджра', ar: 'من المغرب إلى الفجر', tr: 'akşamdan sabaha' },
  midnight:   { az: 'Gecənin yarısı', en: 'Middle of the night', ru: 'Середина ночи', ar: 'منتصف الليل', tr: 'Gecenin yarısı' },
  midHint:    { az: 'işanın son vaxtı — Müslim 612', en: 'end of Isha time — Muslim 612', ru: 'конец времени иша — Муслим 612', ar: 'آخر وقت العشاء — مسلم 612', tr: 'yatsının son vakti — Müslim 612' },
  third:      { az: 'Son üçdə bir', en: 'Last third', ru: 'Последняя треть', ar: 'الثلث الأخير', tr: 'Son üçte bir' },
  thirdHint:  { az: 'dua və təhəccüd vaxtı — Buxari 1145', en: 'time for du‘a and tahajjud — Bukhari 1145', ru: 'время дуа и тахаджуда — Бухари 1145', ar: 'وقت الدعاء والتهجد — البخاري 1145', tr: 'dua ve teheccüd vakti — Buhârî 1145' },
  hoursUnit:  { az: 'saat', en: 'h', ru: 'ч', ar: 'ساعة', tr: 'saat' },

  monthEyebrow: { az: 'Aylıq cədvəl', en: 'Monthly timetable', ru: 'Расписание на месяц', ar: 'الجدول الشهري', tr: 'Aylık takvim' },
  monthTitle:   { az: '{m} ayının vaxtları', en: 'Prayer times for {m}', ru: 'Время намазов: {m}', ar: 'مواقيت شهر {m}', tr: '{m} ayının vakitleri' },
  monthLead:    { az: 'Bütün ay üçün azan vaxtları — bugünkü sətir vurğulanıb.', en: 'Adhan times for the whole month — today’s row is highlighted.', ru: 'Время азана на весь месяц — сегодняшняя строка выделена.', ar: 'مواقيت الأذان للشهر كله — وصفّ اليوم مميَّز.', tr: 'Bütün ay için ezan vakitleri — bugünün satırı vurgulandı.' },
  day:          { az: 'Gün', en: 'Day', ru: 'День', ar: 'اليوم', tr: 'Gün' },
  monthErr:     { az: 'Aylıq cədvəl yüklənmədi.', en: 'Could not load the monthly timetable.', ru: 'Не удалось загрузить месячное расписание.', ar: 'تعذّر تحميل الجدول الشهري.', tr: 'Aylık takvim yüklenemedi.' },
  monthNote:    { az: 'Vaxtlar {city} üçün hesablanıb; yerli məscidin cədvəli ilə bir-iki dəqiqə fərq ola bilər.', en: 'Calculated for {city}; your local mosque may differ by a minute or two.', ru: 'Рассчитано для города {city}; расписание местной мечети может отличаться на минуту-две.', ar: 'محسوبة لمدينة {city}؛ قد يختلف جدول المسجد المحلي بدقيقة أو اثنتين.', tr: '{city} için hesaplandı; yerel caminin takvimiyle bir iki dakika fark olabilir.' },

  boundsEyebrow: { az: 'Fiqh', en: 'Fiqh', ru: 'Фикх', ar: 'الفقه', tr: 'Fıkıh' },
  boundsTitle:   { az: 'Hər namazın vaxtı nə vaxt başlayır və bitir', en: 'When each prayer time begins and ends', ru: 'Когда начинается и заканчивается время каждого намаза', ar: 'متى يبدأ وقت كل صلاة وينتهي', tr: 'Her namazın vakti ne zaman başlar ve biter' },
  boundsLead:    { az: 'Azan vaxtın başlanğıcıdır; namaz vaxtın sonuna qədər qılına bilər. Peyğəmbər ﷺ sərhədləri belə bildirib (Müslim 612), ən sevimli əməl isə namazı vaxtında qılmaqdır (Buxari 527).', en: 'The adhan marks the start of a prayer’s time; the prayer may be prayed until its time ends. The Prophet ﷺ set the limits as below (Muslim 612), and the deed most beloved to Allah is prayer at its time (Bukhari 527).', ru: 'Азан — начало времени; намаз можно совершить до конца его времени. Пророк ﷺ определил границы так (Муслим 612), а самое любимое деяние — намаз в своё время (Бухари 527).', ar: 'الأذان أول الوقت، وتصحّ الصلاة إلى آخر وقتها. حدّد النبي ﷺ المواقيت هكذا (مسلم 612)، وأحبّ الأعمال إلى الله الصلاة على وقتها (البخاري 527).', tr: 'Ezan vaktin başlangıcıdır; namaz vaktin sonuna kadar kılınabilir. Peygamber ﷺ sınırları şöyle bildirdi (Müslim 612); Allah’a en sevimli amel vaktinde kılınan namazdır (Buhârî 527).' },
  colPrayer: { az: 'Namaz', en: 'Prayer', ru: 'Намаз', ar: 'الصلاة', tr: 'Namaz' },
  colStart:  { az: 'Başlayır', en: 'Begins', ru: 'Начало', ar: 'يبدأ', tr: 'Başlar' },
  colEnd:    { az: 'Bitir', en: 'Ends', ru: 'Конец', ar: 'ينتهي', tr: 'Biter' },
  colToday:  { az: 'Bu gün', en: 'Today', ru: 'Сегодня', ar: 'اليوم', tr: 'Bugün' },
  boundsCap: { az: 'Əsrin seçmə vaxtı günəş saralanda bitir; üzrlü şəxs üçün günəş batana qədər davam edir — günəş batmamış bir rükət çatdıran əsri çatdırmışdır (Müslim 608). İşanın sonu məğrib ilə sübh arasının yarısı kimi hesablanıb.', en: 'Asr’s preferred time ends when the sun turns yellow; for one with an excuse it lasts until sunset — whoever catches one rak‘ah of Asr before sunset has caught Asr (Muslim 608). The end of Isha is computed as the midpoint between Maghrib and Fajr.', ru: 'Избранное время аср заканчивается, когда солнце желтеет; для имеющего оправдание — до заката: кто успел один ракаат аср до заката, тот успел аср (Муслим 608). Конец иша рассчитан как середина между магрибом и фаджром.', ar: 'وقت الاختيار للعصر ينتهي باصفرار الشمس، ولصاحب العذر إلى الغروب: من أدرك ركعة من العصر قبل أن تغرب الشمس فقد أدرك العصر (مسلم 608). ونهاية العشاء محسوبة بمنتصف ما بين المغرب والفجر.', tr: 'İkindinin tercih edilen vakti güneş sararınca biter; mazereti olan için güneş batana kadar sürer — güneş batmadan bir rekâtına yetişen ikindiye yetişmiştir (Müslim 608). Yatsının sonu akşam ile sabah arasının yarısı olarak hesaplandı.' },
  forbidTitle: { az: 'Nafilə namaz qılınmayan vaxtlar', en: 'Times when voluntary prayer is not offered', ru: 'Время, когда не совершают добровольный намаз', ar: 'أوقات النهي عن صلاة التطوع', tr: 'Nafile namaz kılınmayan vakitler' },
  forbid: [
    { az: 'Sübh namazından sonra günəş doğub yüksələnə qədər', en: 'After Fajr prayer until the sun has risen and climbed', ru: 'После фаджра, пока солнце не взойдёт и не поднимется', ar: 'بعد صلاة الفجر حتى تطلع الشمس وترتفع', tr: 'Sabah namazından sonra güneş doğup yükselinceye kadar', src: 'Buxari 586; Müslim 831' },
    { az: 'Günəş zenitdə dayananda — zöhrdən bir neçə dəqiqə əvvəl', en: 'When the sun stands at its zenith — a few minutes before Dhuhr', ru: 'Когда солнце в зените — за несколько минут до зухра', ar: 'حين يقوم قائم الظهيرة — قبيل الظهر بدقائق', tr: 'Güneş tepe noktasındayken — öğleden birkaç dakika önce', src: 'Müslim 831' },
    { az: 'Əsr namazından sonra günəş batana qədər', en: 'After Asr prayer until sunset', ru: 'После аср до заката', ar: 'بعد صلاة العصر حتى تغرب الشمس', tr: 'İkindi namazından sonra güneş batıncaya kadar', src: 'Buxari 586; Müslim 831' },
  ],
  forbidNote: { az: 'Qılınmamış fərz namaz isə yada düşəndə dərhal qılınır (Buxari 597).', en: 'A missed obligatory prayer, however, is prayed as soon as it is remembered (Bukhari 597).', ru: 'Пропущенный обязательный намаз совершают сразу, как вспомнят (Бухари 597).', ar: 'أما الفريضة الفائتة فتُصلّى متى ذُكرت (البخاري 597).', tr: 'Kılınmamış farz namaz ise hatırlanınca hemen kılınır (Buhârî 597).' },

  sunnahEyebrow: { az: 'Sünnə', en: 'Sunnah', ru: 'Сунна', ar: 'السنة', tr: 'Sünnet' },
  sunnahLead:    { az: 'Fərzlərdən əvvəl və sonra qılınan nafilə namazlar. Gündə 12 rükət qılana Cənnətdə ev tikilir (Müslim 728).', en: 'Voluntary prayers before and after the obligatory ones. Whoever prays 12 rak‘ahs a day, a house is built for him in Paradise (Muslim 728).', ru: 'Добровольные намазы до и после обязательных. Кто совершает 12 ракаатов в день, тому строится дом в Раю (Муслим 728).', ar: 'نوافل قبل الفرائض وبعدها. من صلّى اثنتي عشرة ركعة في يوم بُني له بيت في الجنة (مسلم 728).', tr: 'Farzlardan önce ve sonra kılınan nafileler. Günde 12 rekât kılana Cennette bir ev yapılır (Müslim 728).' },
  colRakat:  { az: 'Rükət', en: 'Rak‘ahs', ru: 'Ракааты', ar: 'الركعات', tr: 'Rekât' },
  colWhen:   { az: 'Nə vaxt', en: 'When', ru: 'Когда', ar: 'متى', tr: 'Ne zaman' },
  colSource: { az: 'Mənbə', en: 'Source', ru: 'Источник', ar: 'المصدر', tr: 'Kaynak' },
  duasEyebrow: { az: 'Namazda', en: 'In the prayer', ru: 'В намазе', ar: 'في الصلاة', tr: 'Namazda' },
  duasLead:    { az: 'Namazın əsas zikrləri — ərəbcə mətn, tərcümə və mənbə. Namazın bütöv qaydası “Namaz qılmağı öyrən” bölməsindədir.', en: 'The core words of the prayer — Arabic, translation and source. The full method is in “Learn to pray”.', ru: 'Основные слова намаза — арабский текст, перевод и источник. Полный порядок — в разделе «Учимся молиться».', ar: 'أذكار الصلاة الأساسية بنصّها ومصدرها. وصفة الصلاة كاملةً في قسم «تعلّم الصلاة».', tr: 'Namazın temel zikirleri — Arapça metin, meal ve kaynak. Namazın tamamı “Namaz öğren” bölümündedir.' },
  weekLead:    { az: 'Son 7 gündə qeyd etdiyiniz namazlar.', en: 'Prayers you marked in the last 7 days.', ru: 'Намазы, отмеченные за последние 7 дней.', ar: 'الصلوات التي علّمتها في آخر 7 أيام.', tr: 'Son 7 günde işaretlediğiniz namazlar.' },
  // v3.2 — paylaş, aylıq cədvəl alətləri, qalan vaxt, bugünkü istinad saatları
  share:      { az: 'Paylaş', en: 'Share', ru: 'Поделиться', ar: 'مشاركة', tr: 'Paylaş' },
  copied:     { az: 'Kopyalandı', en: 'Copied', ru: 'Скопировано', ar: 'تم النسخ', tr: 'Kopyalandı' },
  shareTitle: { az: 'Namaz vaxtları', en: 'Prayer times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz vakitleri' },
  inRel:      { az: '{t} sonra', en: 'in {t}', ru: 'через {t}', ar: 'بعد {t}', tr: '{t} sonra' },
  relH:       { az: 's', en: 'h', ru: 'ч', ar: 'س', tr: 'sa' },
  relM:       { az: 'dəq', en: 'min', ru: 'мин', ar: 'د', tr: 'dk' },
  print:      { az: 'Çap / PDF', en: 'Print / PDF', ru: 'Печать / PDF', ar: 'طباعة / PDF', tr: 'Yazdır / PDF' },
  csv:        { az: 'CSV yüklə', en: 'Download CSV', ru: 'Скачать CSV', ar: 'تنزيل CSV', tr: 'CSV indir' },
  viewMonth:  { az: 'Bütün ay', en: 'Full month', ru: 'Весь месяц', ar: 'الشهر كاملًا', tr: 'Tüm ay' },
  viewWeek:   { az: 'Növbəti 7 gün', en: 'Next 7 days', ru: 'Следующие 7 дней', ar: 'الأيام السبعة القادمة', tr: 'Sonraki 7 gün' },
  viewLabel:  { az: 'Cədvəl görünüşü', en: 'Timetable view', ru: 'Вид расписания', ar: 'عرض الجدول', tr: 'Takvim görünümü' },
  prevMonth:  { az: 'Əvvəlki ay', en: 'Previous month', ru: 'Предыдущий месяц', ar: 'الشهر السابق', tr: 'Önceki ay' },
  nextMonth:  { az: 'Növbəti ay', en: 'Next month', ru: 'Следующий месяц', ar: 'الشهر التالي', tr: 'Sonraki ay' },
  thisMonth:  { az: 'Bu ay', en: 'This month', ru: 'Этот месяц', ar: 'هذا الشهر', tr: 'Bu ay' },
  friday:     { az: 'Cümə günləri vurğulanıb', en: 'Fridays are highlighted', ru: 'Пятницы выделены', ar: 'أيام الجمعة مميَّزة', tr: 'Cuma günleri vurgulandı' },
  todayAt:    { az: 'Bu gün', en: 'Today', ru: 'Сегодня', ar: 'اليوم', tr: 'Bugün' },
  rakatUnit:  { az: 'rükət', en: 'rak‘ahs', ru: 'ракаатов', ar: 'ركعات', tr: 'rekât' },
  moreEyebrow: { az: 'Davamı', en: 'Next steps', ru: 'Дальше', ar: 'للمزيد', tr: 'Devamı' },
  moreTitle:   { az: 'Namazla bağlı digər bölmələr', en: 'More about prayer', ru: 'Ещё о намазе', ar: 'المزيد عن الصلاة', tr: 'Namazla ilgili diğer bölümler' },
}

// Əlaqəli bölmələr (məzmun təkrarlanmır — keçid)
const RELATED = [
  { page: 'prayerguide', t: { az: 'Namaz qılmağı öyrən', en: 'Learn to pray', ru: 'Учимся молиться', ar: 'تعلّم الصلاة', tr: 'Namaz öğren' }, d: { az: 'Dəstəmazdan salama addım-addım', en: 'Step by step, from wudu to salam', ru: 'Шаг за шагом: от омовения до салама', ar: 'خطوة بخطوة من الوضوء إلى السلام', tr: 'Abdestten selama adım adım' } },
  { page: 'tracker', t: { az: 'Namaz izləyicisi', en: 'Prayer tracker', ru: 'Трекер намазов', ar: 'متابعة الصلاة', tr: 'Namaz takibi' }, d: { az: 'Hesabat və qəza sayğacı', en: 'Reports and qada counter', ru: 'Отчёты и счётчик каза', ar: 'تقارير وعدّاد القضاء', tr: 'Rapor ve kaza sayacı' } },
  { page: 'jamaat', t: { az: 'Camaat və cümə', en: 'Congregation & Jumu‘ah', ru: 'Джамаат и джума', ar: 'الجماعة والجمعة', tr: 'Cemaat ve Cuma' }, d: { az: 'Fəzilətlər və cümə vaxtı', en: 'Virtues and Friday time', ru: 'Достоинства и время джума', ar: 'الفضائل ووقت الجمعة', tr: 'Faziletler ve Cuma vakti' } },
  { page: 'qibla', t: { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' }, d: { az: 'Kəbəyə dəqiq istiqamət', en: 'Exact direction to the Ka‘bah', ru: 'Точное направление на Каабу', ar: 'الاتجاه الدقيق إلى الكعبة', tr: 'Kâbe’ye tam yön' } },
  { page: 'mosques', t: { az: 'Yaxın məscidlər', en: 'Nearby mosques', ru: 'Мечети рядом', ar: 'مساجد قريبة', tr: 'Yakındaki camiler' }, d: { az: 'Xəritədə və yol tarifi', en: 'On the map, with directions', ru: 'На карте, с маршрутом', ar: 'على الخريطة مع الاتجاهات', tr: 'Haritada, yol tarifiyle' } },
  { lesson: 'adhkar-after-salah', icon: 'dhikr', t: { az: 'Namazdan sonrakı zikrlər', en: 'Adhkar after prayer', ru: 'Зикры после намаза', ar: 'الأذكار بعد الصلاة', tr: 'Namazdan sonraki zikirler' }, d: { az: 'Dərs — Sünnədə gələn zikrlər', en: 'Lesson — words from the Sunnah', ru: 'Урок — зикры из Сунны', ar: 'درس — أذكار من السنة', tr: 'Ders — Sünnetteki zikirler' } },
  { lesson: 'travel-prayer', icon: 'compass', t: { az: 'Səfərdə namaz', en: 'Prayer while travelling', ru: 'Намаз в пути', ar: 'صلاة المسافر', tr: 'Yolculukta namaz' }, d: { az: 'Qəsr və cəm qaydası', en: 'Shortening and combining', ru: 'Сокращение и объединение', ar: 'القصر والجمع', tr: 'Kısaltma ve birleştirme' } },
  { page: 'ramadan', t: { az: 'İmsakiyyə', en: 'Ramadan timetable', ru: 'Расписание Рамадана', ar: 'إمساكية رمضان', tr: 'İmsakiye' }, d: { az: 'Səhur və iftar cədvəli', en: 'Suhoor and iftar table', ru: 'Таблица сухура и ифтара', ar: 'جدول السحور والإفطار', tr: 'Sahur ve iftar tablosu' } },
]

// Ay adları (aylıq cədvəlin başlığı üçün; az əl ilə — ICU-da az yoxdur)
// lang-ok: lokal kodları cədvəli
const MONTH_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar' }
function monthName(m, y, lang) {
  if (lang === 'az') return AZ_MONTHS[m - 1]
  try { return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString(MONTH_LOCALES[lang] || 'en-GB', { month: 'long', timeZone: 'UTC' }) } catch { return String(m) }
}
const DAY_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
const minToHM = (min) => { const x = ((Math.round(min) % 1440) + 1440) % 1440; return `${pad2(Math.floor(x / 60))}:${pad2(x % 60)}` }
const durHM = (min) => `${Math.floor(min / 60)}:${pad2(Math.round(min % 60))}`

/** Yeni tabda açmaq istəyən klik (Ctrl/⌘, orta düymə) SPA keçidinə çevrilməsin. */
const isPlainClick = (e) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

const QiyamMode = lazy(() => import('../components/prayer/QiyamMode'))
const AdhanWave = lazy(() => import('../components/prayer/AdhanWave'))
const YearPrayerChart = lazy(() => import('../components/prayer/YearPrayerChart'))
const QY = {
  until:  { az: 'Gecənin son üçdə biri', en: 'Last third of the night', ru: 'Последняя треть ночи', ar: 'الثلث الأخير من الليل', tr: 'Gecenin son üçte biri' },
  inNow:  { az: 'İndi gecənin son üçdə biridir', en: 'It is the last third of the night now', ru: 'Сейчас последняя треть ночи', ar: 'الآن الثلث الأخير من الليل', tr: 'Şu an gecenin son üçte biri' },
  toFajr: { az: 'sübhə qədər —', en: 'until Fajr —', ru: 'до Фаджра —', ar: 'حتى الفجر —', tr: 'sabaha kadar —' },
  open:   { az: 'Qiyam rejimi', en: 'Night prayer mode', ru: 'Режим ночного намаза', ar: 'وضع القيام', tr: 'Gece namazı modu' },
}

export default function PrayerPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang)?.prayer || T.az.prayer
  const lk = ['az','ru','ar','tr'].includes(lang) ? lang : 'en'
  const navigate = useNavigate()

  // Seçilmiş şəhər — bütün saytda ortaq (utils/prayerLocation.js)
  const loc = usePrayerLocation()
  // Siyahı açarı: şəhər dəyişəndə vaxtlar yumşaq yenidən görünsün (xüsusi yer də daxil)
  const sel = locationSig(loc)

  // Admin Settings-dəki standart şəhər — yalnız istifadəçi özü seçməyibsə
  // tətbiq olunur (setAdminDefaultCity bunu özü yoxlayır və yadda saxlayır).
  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      if (settings?.defaultCity) setAdminDefaultCity(settings.defaultCity)
    })
    return () => unsubscribe?.()
  }, [])

  const pt = usePrayerTimes()
  const [qiyamOpen, setQiyamOpen] = useState(false)

  const times = useMemo(() => {
    if (!pt.prayers.length) return null
    const o = {}
    for (const p of pt.prayers) o[API_NAME[p.key]] = p.adhan
    return o
  }, [pt.prayers])

  const loading = pt.loading
  const error   = pt.error
  const hijri   = normHijri(pt.hijri)
  const retry   = pt.reload
  const cityName = loc.city?.[lang] || loc.city?.en || ''

  // Son yüklənmiş vaxtlar (köhnə açar saxlanılır)
  useEffect(() => {
    if (!times) return
    try {
      localStorage.setItem('cached_prayer_times', JSON.stringify({
        Fajr: times.Fajr, Dhuhr: times.Dhuhr, Asr: times.Asr, Maghrib: times.Maghrib, Isha: times.Isha,
      }))
    } catch { /* yaddaş bağlıdır */ }
  }, [times])

  // Növbəti namaz və geri sayım şəhərin öz saatı ilə (usePrayerTimes → next)
  const next = pt.next ? { name: API_NAME[pt.next.key], time: pt.next.adhan } : null
  const countdown = useCountdownTo(pt.next?.at)
  const { toggle, isDone, todayDone, totalDone, totalPossible, data } = usePrayerStats()
  // Bildirişdəki "✅ Qıldım" qeydlərini (IndexedDB) izləyiciyə köçür
  usePendingCheckinSync()
  const weeklyStats = useWeeklyStats(data)
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id) }, [])


  const STAT_NAMES = {
    Fajr:    { az:'Sübh',   ru:'Фаджр',  ar:'الفجر',   tr:'Sabah',  en:'Fajr'    },
    Dhuhr:   { az:'Zöhr',   ru:'Зухр',   ar:'الظهر',   tr:'Öğle',   en:'Dhuhr'   },
    Asr:     { az:'Əsr',    ru:'Аср',    ar:'العصر',   tr:'İkindi', en:'Asr'     },
    Maghrib: { az:'Məğrib', ru:'Магриб', ar:'المغرب',  tr:'Akşam',  en:'Maghrib' },
    Isha:    { az:'İşa',    ru:'Иша',    ar:'العشاء',  tr:'Yatsı',  en:'Isha'    },
  }

  // ── Əzan bildirişi ──
  const [azanEnabled, setAzanEnabled] = useState(() => { try { return localStorage.getItem('azan_enabled') === '1' } catch { return false } })

  const toggleAzan = () => {
    haptic()
    const next = !azanEnabled
    setAzanEnabled(next)
    try { localStorage.setItem('azan_enabled', next ? '1' : '0') } catch { /* yaddaş bağlıdır */ }
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { Notification.requestPermission()?.catch?.(() => {}) } catch { /* köhnə brauzer */ }
    }
  }

  useEffect(() => {
    if (!azanEnabled || !times) return
    const check = () => {
      // Şəhərin saatı ilə — başqa saat qurşağındakı şəhər seçilibsə də düz vaxtda
      const nowStr = hhmmIn(loc.tz)
      // Yalnız 5 fərz namaz (aladhan cavabında İmsak, Gecəyarısı və s. də var)
      STAT_KEYS.forEach((key) => {
        const time = times[key]
        if (time && time.slice(0,5) === nowStr) {
          let lastNotif = null
          try { lastNotif = localStorage.getItem('last_azan_notif') } catch { /* yaddaş bağlıdır */ }
          const notifKey = `${nowStr}-${key}`
          if (lastNotif !== notifKey) {
            try { localStorage.setItem('last_azan_notif', notifKey) } catch { /* yaddaş bağlıdır */ }
            // Android-də `new Notification()` xəta atırdı və əzan səsi heç çalmırdı — utils/notify.js
            // tag push bildirişi ilə eynidir (azan-fajr …): server push-u da gəlsə
            // ekranda İKİ bildiriş yox, bir bildiriş qalır
            showLocalNotification(`🕌 ${STAT_NAMES[key][lk]}`, { body: `${time.slice(0,5)} — ${TXT.notifBody[lk]}`, tag: `azan-${key.toLowerCase()}` })
            // Həqiqi əzan səsi (əvvəl 13 notalı sintetik melodiya idi) — push
            // da gələrsə eyni namaz üçün bir dəfə oxunur (utils/azanAudio.js)
            playAzan(key.toLowerCase())
          }
        }
      })
    }
    const id = setInterval(check, 30000)
    check()
    return () => clearInterval(id)
    // STAT_NAMES hər renderdə yaranır, amma dil dəyişəndə lk ilə birlikdə yenilənir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azanEnabled, times, lk, loc.tz])

  const PRAYER_KEYS = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha']
  const PRAYER_NAMES = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha]

  const sl = STATS_LABELS[lk]

  const timeStr = formatClockTime(now)
  const dateStr = formatClockDate(now, lang)

  const L = {
    statTitle:  { az:'Bu ayın namazları', ru:'Намаз в этом месяце', ar:'صلواتي هذا الشهر', tr:'Bu ayki namazlar',      en:'This Month Prayers'   },
    todayTitle: { az:'Bu gün',           ru:'Сегодня',             ar:'اليوم',             tr:'Bugün',            en:'Today'                },
    done:       { az:'qılındı',          ru:'выполнено',           ar:'مُؤدَّاة',           tr:'kılındı',          en:'completed'            },
    of:         { az:'/',               ru:'из',                  ar:'من',               tr:'/',                en:'of'                   },
    monthStat:  { az:'bu ay',           ru:'в этом месяце',       ar:'هذا الشهر',        tr:'bu ay',            en:'this month'           },
    tapHint:    { az:'İşarələmək üçün toxunun', ru:'Нажмите, чтобы отметить', ar:'اضغط للتحديد', tr:'İşaretlemek için dokunun', en:'Tap to mark' },
  }
  const s = (k) => L[k][lk]

  // Növbəti namaza qədər ötən hissə (0…1) — əvvəlki fərz azanından bu ana.
  // Zolaq transform: scaleX ilə dolur (hər saniyə, xətti keçid).
  const nowMs = now.getTime()
  const span = pt.next?.prevAt != null ? pt.next.at - pt.next.prevAt : 0
  const frac = span > 0 && span < 86400000 ? Math.min(1, Math.max(0, (nowMs - pt.next.prevAt) / span)) : null

  // Bugünkü siyahıda keçmiş vaxtlar sakitləşir: "növbəti"dən əvvəlkilər keçib
  // (işadan sonra növbəti sabahın sübhüdür — hamısı keçib)
  const nextIdx = !pt.next ? -1 : pt.next.tomorrow ? PRAYER_KEYS.length : PRAYER_KEYS.indexOf(API_NAME[pt.next.key])
  const nextLabel = next ? (PRAYER_NAMES[PRAYER_KEYS.indexOf(next.name)] || next.name) : ''
  const allDone = todayDone.length === STAT_KEYS.length
  const notifBlocked = azanEnabled && typeof Notification !== 'undefined' && Notification.permission === 'denied'

  // ── v3: günün xətti, gecə hesabları və aylıq cədvəl ──
  const P = (o) => o[lk] || o.en
  const dayNames = {}
  DAY_KEYS.forEach((k, i) => { dayNames[k] = PRAYER_NAMES[i] })
  const dayTimes = times ? { fajr: times.Fajr, sunrise: times.Sunrise, dhuhr: times.Dhuhr, asr: times.Asr, maghrib: times.Maghrib, isha: times.Isha } : null
  const nowMin = Number.isFinite(pt.nowSecs) ? Math.floor(pt.nowSecs / 60) : null
  const M = dayTimes ? Object.fromEntries(DAY_KEYS.map(k => [k, hmToMin(dayTimes[k])])) : null
  const nightLen = M && M.fajr != null && M.maghrib != null ? M.fajr + 1440 - M.maghrib : null
  const qiyam = M && nowMin != null ? qiyamState(nowMin, M.maghrib, M.fajr) : null
  const dayLen = M && M.sunrise != null && M.maghrib != null ? M.maghrib - M.sunrise : null
  const midnight = nightLen != null ? M.maghrib + nightLen / 2 : null
  const lastThird = nightLen != null ? M.maghrib + (nightLen * 2) / 3 : null

  // Aylıq cədvəl — şəhərin təqvim günü (pt.date 'DD-MM-YYYY'); ‹ › ilə başqa ay
  const [cd, cm, cy] = String(pt.date || '').split('-').map(Number)
  const [monthOff, setMonthOff] = useState(0)
  const [monthView, setMonthView] = useState('month') // 'month' | 'week'
  const vIdx = cm && cy ? cy * 12 + (cm - 1) + monthOff : null
  const vy = vIdx != null ? Math.floor(vIdx / 12) : null
  const vm = vIdx != null ? (vIdx % 12) + 1 : null
  const isCurMonth = monthOff === 0
  const month = usePrayerMonth(loc, vy || null, vm || null)
  const monthLabel = vm ? monthName(vm, vy, lang) : ''
  // "Növbəti 7 gün" yalnız bu ayda mənalıdır (ayın sonunda 7-dən az ola bilər)
  const weekMode = monthView === 'week' && isCurMonth
  const monthRows = month.days ? (weekMode ? month.days.filter(d => d.day >= cd && d.day < cd + 7) : month.days) : null

  // Qalan vaxt: "2 s 15 dəq sonra" (yalnız bu günün gələcək vaxtları)
  const relFmt = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60
    const tt = h ? `${h} ${P(V3.relH)}${m ? ` ${m} ${P(V3.relM)}` : ''}` : `${Math.max(1, m)} ${P(V3.relM)}`
    return P(V3.inRel).replace('{t}', tt)
  }

  // Paylaş: Web Share API, yoxdursa buferə kopyala
  const [shareMsg, setShareMsg] = useState('')
  const shareTimes = async () => {
    if (!times) return
    haptic()
    const lines = PRAYER_KEYS.map((k, i) => `${PRAYER_NAMES[i]}: ${times[k]}`)
    const head = `${P(V3.shareTitle)}${cityName ? ` — ${cityName}` : ''} · ${dateStr}`
    const url = typeof location !== 'undefined' ? location.href.split('#')[0] : ''
    const text = `${head}\n${lines.join('\n')}`
    try {
      if (navigator.share) { await navigator.share({ title: head, text, url }); return }
    } catch (e) { if (e?.name === 'AbortError') return }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setShareMsg(P(V3.copied))
      setTimeout(() => setShareMsg(''), 2200)
    } catch { /* bufer bağlıdır */ }
  }

  // Aylıq cədvəl: CSV yüklə və yalnız cədvəli çap et
  const downloadCsv = () => {
    if (!month.days) return
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
    const rows = [[P(V3.day), ...PRAYER_NAMES].map(esc).join(',')]
    for (const d of month.days) rows.push([`${vy}-${pad2(vm)}-${pad2(d.day)}`, ...DAY_KEYS.map(k => d.times[k] || '')].map(esc).join(','))
    try {
      const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `prayer-times-${(loc.city?.en || 'city').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${vy}-${pad2(vm)}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    } catch { /* köhnə brauzer */ }
  }
  const printMonth = () => {
    const root = document.documentElement
    root.classList.add('pp-print-month')
    const done = () => { root.classList.remove('pp-print-month'); window.removeEventListener('afterprint', done) }
    window.addEventListener('afterprint', done)
    try { window.print() } catch { done() }
  }

  // Vaxtların sərhədləri (Müslim 612) — bu günün rəqəmləri ilə
  const BOUNDS = [
    { k: 'fajr', start: { az: 'Həqiqi fəcr — üfüqdə yayılan ağartı', en: 'True dawn — whiteness spreading on the horizon', ru: 'Истинный рассвет — белизна, разливающаяся по горизонту', ar: 'طلوع الفجر الصادق المنتشر في الأفق', tr: 'Sadık fecir — ufka yayılan aydınlık' }, end: { az: 'Günəşin doğması', en: 'Sunrise', ru: 'Восход солнца', ar: 'طلوع الشمس', tr: 'Güneşin doğması' }, from: 'fajr', to: 'sunrise' },
    { k: 'dhuhr', start: { az: 'Günəş zenitdən qərbə meyl edəndə', en: 'The sun passes its zenith', ru: 'Солнце проходит зенит', ar: 'زوال الشمس عن وسط السماء', tr: 'Güneş tepe noktasından batıya kayınca' }, end: { az: 'Əsrin girməsi', en: 'Asr begins', ru: 'Наступление аср', ar: 'دخول العصر', tr: 'İkindinin girmesi' }, from: 'dhuhr', to: 'asr' },
    { k: 'asr', start: { az: 'Əşyanın kölgəsi öz boyu qədər olanda', en: 'An object’s shadow equals its height', ru: 'Тень предмета равна его высоте', ar: 'إذا صار ظل الشيء مثله', tr: 'Bir cismin gölgesi boyu kadar olunca' }, end: { az: 'Günəş saralanda (zərurətdə — batana qədər)', en: 'The sun turns yellow (if necessary — until sunset)', ru: 'Солнце желтеет (при нужде — до заката)', ar: 'اصفرار الشمس (وللضرورة إلى الغروب)', tr: 'Güneş sararınca (zaruret hâlinde batana kadar)' }, from: 'asr', to: 'maghrib' },
    { k: 'maghrib', start: { az: 'Günəş batanda', en: 'Sunset', ru: 'Закат солнца', ar: 'غروب الشمس', tr: 'Güneş batınca' }, end: { az: 'Qırmızı şəfəq itəndə', en: 'The red twilight disappears', ru: 'Исчезает красная заря', ar: 'مغيب الشفق الأحمر', tr: 'Kızıl şafak kaybolunca' }, from: 'maghrib', to: 'isha' },
    { k: 'isha', start: { az: 'Şəfəq itəndə', en: 'Twilight has gone', ru: 'Заря исчезла', ar: 'مغيب الشفق', tr: 'Şafak kaybolunca' }, end: { az: 'Gecənin yarısı', en: 'The middle of the night', ru: 'Середина ночи', ar: 'نصف الليل', tr: 'Gecenin yarısı' }, from: 'isha', to: 'mid' },
  ]
  const boundTime = (key) => key === 'mid' ? (midnight != null ? minToHM(midnight) : '—') : (dayTimes?.[key] || '—')

  const navTo = (e, item) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    if (item.lesson) { navigate(`${pathFor('learn', lang)}/${item.lesson}`); window.scrollTo(0, 0) }
    else setPage?.(item.page)
  }

  return (
    <div className="pp-root">
      {/* v3: kompakt hero — eyebrow · h1 · bir cümlə · necə işlədilir · 3 açar rəqəm */}
      <header className="ui-page-hero pp-hero">
        {/* Namaz vaxtına görə canlı səma: sübh, günorta, qürub, gecə… */}
        <PrayerSky times={dayTimes} nowMin={nowMin} />
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{TXT.lead[lk]}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {P(V3.how)}</p>
          <ul className="ui-page-hero__stats">
            {V3.stats.map(s => <li key={s.v}><b>{s.v}</b><span>{P(s.l)}</span></li>)}
          </ul>
        </div>
      </header>

      <section className="ui-section ui-section--tight pp-main">
        <div className="ui-container">
          {/* "Qıldınızmı?" push-una toxunuşdan (?checkin=dhuhr&d=…) — Qıldım / Qılmadım */}
          <PrayerCheckinCard
            trackerHref={HAS_TRACKER_PAGE ? pathFor('tracker', lang) : null}
            onOpenTracker={HAS_TRACKER_PAGE && setPage ? () => setPage('tracker') : undefined} />
          {/* Ramazan rejimi: Ramazanda səhur/iftar + geri sayım; Şabanda "Ramazana N gün"; bayramda təbrik */}
          <RamadanCard className="pp-ramadan"
            onOpenTimetable={HAS_RAMADAN_PAGE && setPage ? () => setPage('ramadan') : undefined} />
          {/* Masaüstü: iki sütun. ≤900px: bir sütun, CSS order ilə
              saat → növbəti namaz → vaxtlar → şəhər → əzan → statistika */}
          <div className="prayer-layout">

            <div className="prayer-left">
              <div className="pp-now" data-reveal="scale">
                <div className="prayer-clock">
                  <span className="pp-now-cap">{TXT.now[lk]}</span>
                  <div className="clock-time ui-num" aria-live="off"><RollingDigits value={timeStr} /></div>
                  <div className="clock-date">{dateStr}</div>
                  {hijri && (
                    <div className="clock-hijri">
                      <span>{hijriLine(hijri, lang)}</span>
                      {lang !== 'ar' && hijri.monthAr && <span className="clock-hijri-ar" lang="ar">{hijri.monthAr}</span>}
                    </div>
                  )}
                </div>

                {next && (
                  <div className="next-prayer-card">
                    <div className="next-head">
                      <span className="next-label">{t.next}</span>
                      <span className="next-name">
                        <Icon name={PRAYER_ICONS[next.name]} size={18} />
                        {nextLabel}{pt.next?.tomorrow ? ` · ${TXT.tomorrow[lk]}` : ''}
                        <span className="next-at ui-num">{next.time}</span>
                      </span>
                    </div>
                    <div className="next-countdown ui-num" role="timer" aria-label={`${t.remaining}: ${countdown}`}><RollingDigits value={countdown} /></div>
                    <div className="next-remaining-label">{t.remaining}</div>
                    {frac != null && (
                      <span className="pp-bar" aria-hidden="true">
                        <span style={{ transform: `scaleX(${frac.toFixed(4)})` }} />
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="prayer-city-block ui-card" data-reveal>
                <div className="prayer-city-head">
                  <Icon name="pin" size={16} />
                  <h2 className="prayer-city-label" id="prayer-city-label">{t.selectCity}</h2>
                </div>
                {/* 100-ə yaxın şəhər — axtarışlı seçici (components/CityPicker) */}
                <CityPicker triggerId="prayer-city-trigger" />
              </div>

              {/* Əzan: ayarlar sətri — role="switch" + aria-checked */}
              <button type="button" className={`azan-toggle ui-card ${azanEnabled ? 'active' : ''}`} onClick={toggleAzan}
                role="switch" aria-checked={azanEnabled} data-reveal>
                <span className="azan-ico ui-icon-tile ui-icon-tile--sm ui-icon-tile--accent" aria-hidden="true"><Icon name="bell" /></span>
                <span className="azan-text">
                  <span className="azan-label">{azanEnabled ? TXT.azanOn[lk] : TXT.azanOff[lk]}</span>
                  <span className="azan-sub">{notifBlocked ? TXT.azanBlocked[lk] : TXT.azanSub[lk]}</span>
                </span>
                <span className="azan-switch" aria-hidden="true"><span className="azan-knob" /></span>
              </button>
            </div>

            <div className="prayer-right">
              <div className="pp-times ui-card ui-card--flush" data-reveal>
                <div className="pp-times-head">
                  <h2 className="pp-times-title">{TXT.todayTimes[lk]}</h2>
                  <span className="pp-times-head-r">
                    <span className="pp-times-badge">{cityName ? <><Icon name="pin" size={12} /> {cityName} · {TXT.calc[lk]}</> : TXT.calc[lk]}</span>
                    {times && !loading && (
                      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pp-share-btn" onClick={shareTimes}>
                        <Icon name={shareMsg ? 'check' : 'share'} size={16} /> <span>{shareMsg || P(V3.share)}</span>
                      </button>
                    )}
                  </span>
                  <span className="ui-sr-only" role="status" aria-live="polite">{shareMsg}</span>
                </div>

                {loading && (
                  <ol className="prayer-times-list" aria-busy="true" aria-label={t.loading}>
                    {PRAYER_KEYS.map((k, i) => (
                      <li key={k} className={`prayer-time-card is-skel${k === 'Sunrise' ? ' is-aux' : ''}`}>
                        <span className="pt-icon" aria-hidden="true"><Icon name={PRAYER_ICONS[k]} /></span>
                        <span className="pt-info"><span className="pt-name">{PRAYER_NAMES[i]}</span></span>
                        <span className="pt-time"><span className="skeleton skeleton--text pts-time" aria-hidden="true" /></span>
                      </li>
                    ))}
                  </ol>
                )}
                {error && !loading && !times && (
                  <div className="prayer-error" role="alert">
                    <span className="ui-icon-tile ui-icon-tile--neutral" aria-hidden="true"><Icon name="globe" /></span>
                    <p>{TXT.loadError[lk]}</p>
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={retry}>{TXT.retry[lk]}</button>
                  </div>
                )}
                {times && !loading && (
                  <ol className="prayer-times-list pp-swap tm-cascade" key={sel || 'default'}>
                    {PRAYER_KEYS.map((key,i) => {
                      const isNext = next?.name === key && !pt.next?.tomorrow
                      const passed = i < nextIdx
                      const km = M ? M[DAY_KEYS[i]] : null
                      const left = !passed && km != null && nowMin != null && km > nowMin ? km - nowMin : null
                      return (
                        <li key={key} className={`prayer-time-card${isNext ? ' is-next' : ''}${passed ? ' is-passed' : ''}${key === 'Sunrise' ? ' is-aux' : ''}`}>
                          <span className="pt-icon" aria-hidden="true"><Icon name={PRAYER_ICONS[key]} /></span>
                          <span className="pt-info">
                            <span className="pt-name">{PRAYER_NAMES[i]}</span>
                            {isNext && <span className="pt-next-badge">{TXT.nextBadge[lk]}</span>}
                            {left != null && <span className="pt-rel ui-num">{relFmt(left)}</span>}
                          </span>
                          <span className="pt-time ui-num">{times[key]}</span>
                          <span className="pt-indicator" aria-hidden="true">{passed ? <Icon name="check" size={14} strokeWidth={2.2} /> : null}</span>
                        </li>
                      )
                    })}
                  </ol>
                )}
                {times && !loading && (
                  <div className="prayer-times-foot">
                    {cityName && <span className="prayer-times-note">{TXT.calcNote[lk].replace('{city}', cityName)}</span>}
                    <a className="prayer-jamaat-link ui-link" href={pathFor('jamaat', lang)}
                      onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); setPage?.('jamaat') } }}>
                      {TXT.jamaatLink[lk]} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                    </a>
                  </div>
                )}
              </div>

              {/* ── Bu ayın namazları: halqa + bu günün 5 düyməsi ── */}
              <div className={`stat-card ui-card${allDone ? ' is-complete' : ''}`} data-reveal>
                {allDone && <Sparkle key={totalDone} count={10} radius={70} />}
                <div className="stat-card-header">
                  <div className="stat-card-head-l">
                    <h2 className="stat-card-title">{s('statTitle')}</h2>
                    <div className="stat-card-sub">
                      <span className="stat-total-num ui-num">{totalDone}</span>
                      <span className="stat-total-sep ui-num"> {s('of')} {totalPossible} </span>
                      <span className="stat-total-label">{s('monthStat')}</span>
                    </div>
                  </div>
                  <ProgressRing value={totalDone} max={totalPossible} size={60} thickness={6}
                    tone={allDone ? 2 : 1} label={s('statTitle')} className="stat-ring" />
                </div>

                <div className="stat-today-row">
                  <div className="stat-today-label">
                    {s('todayTitle')} — <span key={todayDone.length} className="stat-today-count ui-num">{todayDone.length}/5</span> {s('done')}
                  </div>
                  <div className="stat-today-hint" aria-live="polite">{allDone ? TXT.allDone[lk] : s('tapHint')}</div>
                </div>
                <div className="stat-prayers">
                  {STAT_KEYS.map(p => {
                    const done = isDone(p, todayKey())
                    return (
                      <button key={p} type="button" className={`stat-prayer-btn ${done ? 'done' : ''}`}
                        onClick={() => { haptic(); toggle(p) }} aria-pressed={done}>
                        <span className="stat-prayer-icon" aria-hidden="true"><Icon name={PRAYER_ICONS[p]} size={18} /></span>
                        <span className="stat-prayer-name">{STAT_NAMES[p][lk]}</span>
                        <span className="m-check stat-prayer-mcheck" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><path d={CHECK_PATH} /></svg>
                        </span>
                      </button>
                    )
                  })}
                </div>
                {HAS_TRACKER_PAGE && (
                  <a className="ui-link pp-tracker-link" href={pathFor('tracker', lang)}
                    onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); setPage?.('tracker') } }}>
                    {TXT.trackerLink[lk]} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Günün xətti (vizual) + gecə hesabları ── */}
      {dayTimes && (
        <section className="ui-section ui-section--tight pp-day" aria-labelledby="pp-day-title">
          <div className="ui-container">
            <div className="ui-section-head" data-reveal>
              <span className="ui-eyebrow">{P(V3.dayEyebrow)}</span>
              <h2 id="pp-day-title" className="ui-title">{P(V3.dayTitle)}</h2>
              <p className="ui-lead">{P(V3.dayLead)}</p>
            </div>
            {/* Dairəvi günəş saatı + üfüqi xətt yan-yana (telefonda alt-alta) */}
            <div className="ui-card pp-day-card pp-day-card--dial" data-reveal>
              <SunDial times={dayTimes} names={dayNames} nowMin={nowMin}
                nextKey={pt.next && !pt.next.tomorrow ? pt.next.key : null}
                centerTop={pt.next ? <RollingDigits value={countdown} /> : ''} centerBottom={nextLabel}
                label={P(V3.dayLabel)} />
              <div className="pp-day-line">
                <PrayerDayline times={dayTimes} names={dayNames} nowMin={nowMin} nowLabel={TXT.now[lk]}
                  nextKey={pt.next && !pt.next.tomorrow ? pt.next.key : null} label={P(V3.dayLabel)} />
              </div>
            </div>
            {nightLen != null && (
              <div className="ui-stats pp-day-stats" data-reveal="stagger">
                <StatTile icon="sun" label={P(V3.dayLen)} value={durHM(dayLen)} unit={P(V3.hoursUnit)} hint={P(V3.dayLenHint)} />
                <StatTile icon="moon" label={P(V3.nightLen)} value={durHM(nightLen)} unit={P(V3.hoursUnit)} hint={P(V3.nightHint)} />
                <StatTile icon="moonStar" label={P(V3.midnight)} value={minToHM(midnight)} hint={P(V3.midHint)} />
                <StatTile icon="duas" label={P(V3.third)} value={minToHM(lastThird)} hint={P(V3.thirdHint)} tone="brand" />
              </div>
            )}
            {/* Gecə namazı (Qiyam) — son üçdə birə / sübhə qədər; tam ekran rejim */}
            {qiyam && (
              <div className={`ui-card pp-qiyam${qiyam.phase === 'in' ? ' is-in' : ''}`} data-testid="qiyam-card">
                <span className="pp-qiyam__ic" aria-hidden="true"><Icon name="moonStar" size={22} /></span>
                <span className="pp-qiyam__txt">
                  <b>{qiyam.phase === 'in' ? P(QY.inNow) : P(QY.until)}</b>
                  <span className="ui-num">{qiyam.phase === 'in' ? `${P(QY.toFajr)} ${hm(M.fajr)}` : `${hm(qiyam.start)} · ${Math.floor(qiyam.left / 60)}:${String(qiyam.left % 60).padStart(2, '0')}`}</span>
                </span>
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setQiyamOpen(true)} data-testid="qiyam-open">
                  {P(QY.open)}
                </button>
              </div>
            )}
            {qiyamOpen && M && (
              <Suspense fallback={null}>
                <QiyamMode nowMin={nowMin} maghrib={M.maghrib} fajr={M.fajr} lang={lang} onClose={() => setQiyamOpen(false)} />
              </Suspense>
            )}
            {/* Google / Apple / Outlook təqviminə abunəlik (server/ics.js) */}
            <CalendarSubscribe location={pt.location} lang={lang} city={cityName} />
            {/* v5.7: ana ekran vidceti — iPhone (Scriptable), Android (təqvim vidceti) */}
            <HomeScreenWidget location={pt.location} lang={lang} city={cityName} times={dayTimes} names={dayNames}
              next={pt.next ? { key: pt.next.tomorrow ? 'fajr' : pt.next.key, time: pt.next.adhan, left: countdown.slice(0, 5) } : null} />
          </div>
        </section>
      )}

      {/* Dünyada azan dalğası — gecə/gündüz və azan xətləri, indi azan oxunan şəhərlər */}
      <section className="ui-section ui-section--tight pp-adhan-wave">
        <div className="ui-container">
          <Suspense fallback={<div className="ui-card aw-skel" style={{ minHeight: 360 }} />}>
            <AdhanWave lang={lang} />
          </Suspense>
        </div>
      </section>

      {/* ── Aylıq cədvəl (.ui-table) ── */}
      <section className="ui-section ui-section--tight pp-month" aria-labelledby="pp-month-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.monthEyebrow)}</span>
            <h2 id="pp-month-title" className="ui-title">{(t => t.charAt(0).toLocaleUpperCase(lang) + t.slice(1))(P(V3.monthTitle).replace('{m}', monthLabel))}</h2>
            <p className="ui-lead">{P(V3.monthLead)}</p>
          </div>
          <div className="pp-month-bar">
            <div className="pp-month-nav">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm pp-icon-btn" onClick={() => setMonthOff(o => o - 1)}
                aria-label={P(V3.prevMonth)} title={P(V3.prevMonth)}>
                <Icon name="chevronLeft" size={16} className="ui-flip-rtl" />
              </button>
              <span className="pp-month-name" aria-live="polite">{monthLabel} <span className="ui-num">{vy || ''}</span></span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm pp-icon-btn" onClick={() => setMonthOff(o => o + 1)}
                aria-label={P(V3.nextMonth)} title={P(V3.nextMonth)}>
                <Icon name="chevron" size={16} className="ui-flip-rtl" />
              </button>
              {!isCurMonth && (
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setMonthOff(0)}>{P(V3.thisMonth)}</button>
              )}
            </div>
            {isCurMonth && (
              <div className="ui-segmented pp-month-seg" role="radiogroup" aria-label={P(V3.viewLabel)}>
                {['month', 'week'].map(v => (
                  <button key={v} type="button" role="radio" aria-checked={monthView === v} onClick={() => setMonthView(v)}>
                    {P(v === 'month' ? V3.viewMonth : V3.viewWeek)}
                  </button>
                ))}
              </div>
            )}
            <div className="pp-month-tools">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={printMonth} disabled={!month.days}>
                <Icon name="list" size={16} /> {P(V3.print)}
              </button>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={downloadCsv} disabled={!month.days}>
                <Icon name="download" size={16} /> {P(V3.csv)}
              </button>
            </div>
          </div>
          {month.error ? (
            <div className="ui-callout ui-callout--note" role="status">
              <Icon name="info" />
              <div>
                <p>{P(V3.monthErr)}</p>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={month.reload}>{TXT.retry[lk]}</button>
              </div>
            </div>
          ) : !month.days ? (
            <div className="ui-card pp-month-skel" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--text" style={{ '--w': `${92 - i * 7}%` }} />)}
            </div>
          ) : (
            <div className={`ui-table-wrap pp-month-wrap tm-cascade-rows${weekMode ? ' is-week' : ''}`} data-reveal="fade" tabIndex={0} role="region" aria-labelledby="pp-month-title">
              <table className="ui-table ui-table--compact ui-table--zebra pp-month-table">
                <caption>{P(V3.monthNote).replace('{city}', cityName)} {P(V3.friday)}.</caption>
                <thead>
                  <tr>
                    <th scope="col">{P(V3.day)}</th>
                    {DAY_KEYS.map((k, i) => <th key={k} scope="col" className={`is-num${k === 'sunrise' ? ' is-aux' : ''}`}>{PRAYER_NAMES[i]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map(d => {
                    const cur = isCurMonth && d.day === cd
                    const past = monthOff < 0 || (isCurMonth && d.day < cd)
                    const cls = [cur && 'is-current', past && 'is-past', d.weekday === 5 && 'is-friday'].filter(Boolean).join(' ')
                    return (
                      <tr key={d.day} className={cls || undefined} aria-current={cur ? 'date' : undefined}>
                        <th scope="row"><span className="ui-num">{d.day}</span> <span className="pp-wd">{sl.days[d.weekday]}</span></th>
                        {DAY_KEYS.map(k => <td key={k} className={`is-num${k === 'sunrise' ? ' is-aux' : ''}`}>{d.times[k] || '—'}</td>)}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── v5.6: İl boyu namaz vaxtları (365 günlük lent, yerli hesab) ── */}
      <section className="ui-section ui-section--tight pp-year">
        <div className="ui-container">
          <DeferRender height="620px" idle={false} rootMargin="300px 0px">
            <Suspense fallback={<div className="ui-card" style={{ minHeight: 620 }} />}>
              <YearPrayerChart loc={loc} lang={lang} city={cityName} />
            </Suspense>
          </DeferRender>
        </div>
      </section>

      {/* ── Vaxtların sərhədləri (Müslim 612) + nafilə qılınmayan vaxtlar ── */}
      <section className="ui-section ui-section--tight ui-section--alt pp-bounds" aria-labelledby="pp-bounds-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.boundsEyebrow)}</span>
            <h2 id="pp-bounds-title" className="ui-title">{P(V3.boundsTitle)}</h2>
            <p className="ui-lead">{P(V3.boundsLead)}</p>
          </div>
          <div className="pp-bounds-grid">
            <div className="ui-table-wrap" tabIndex={0} role="region" aria-labelledby="pp-bounds-title">
              <table className="ui-table pp-bounds-table">
                <caption>{P(V3.boundsCap)}</caption>
                <thead>
                  <tr>
                    <th scope="col">{P(V3.colPrayer)}</th>
                    <th scope="col">{P(V3.colStart)}</th>
                    <th scope="col">{P(V3.colEnd)}</th>
                    <th scope="col" className="is-num">{P(V3.colToday)}</th>
                  </tr>
                </thead>
                <tbody>
                  {BOUNDS.map(b => (
                    <tr key={b.k}>
                      <th scope="row">{dayNames[b.k]}</th>
                      <td>{P(b.start)}</td>
                      <td>{P(b.end)}</td>
                      <td className="is-num"><span dir="ltr">{boundTime(b.from)}–{boundTime(b.to)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <aside className="ui-callout ui-callout--warn pp-forbid">
              <Icon name="alert" />
              <div>
                <strong className="ui-callout__title">{P(V3.forbidTitle)}</strong>
                <ol className="pp-forbid-list">
                  {V3.forbid.map((f, i) => {
                    // Bu günün istinad saatı (yalnız məlum vaxtlar — yeni hökm yox):
                    // 1 → günəşin doğuşu, 2 → zöhr azanı, 3 → məğrib (günəşin batışı)
                    const ak = ['sunrise', 'dhuhr', 'maghrib'][i]
                    return (
                      <li key={i}>
                        {P(f)} <span className="pp-src">{localizeSource(f.src, lang)}</span>
                        {dayTimes?.[ak] && (
                          <span className="pp-forbid-at"><Icon name={PRAYER_ICONS[API_NAME[ak]]} size={13} /> {P(V3.todayAt)}: {dayNames[ak]} <b className="ui-num">{dayTimes[ak]}</b></span>
                        )}
                      </li>
                    )
                  })}
                </ol>
                <p className="pp-forbid-note">{P(V3.forbidNote)}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Sünnə namazları (.ui-table) + həftəlik qeydlər ── */}
      <section className="ui-section ui-section--tight pp-sunnah" aria-labelledby="pp-sunnah-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.sunnahEyebrow)}</span>
            <h2 id="pp-sunnah-title" className="ui-title">{SUNNAH_LABELS[lk] || SUNNAH_LABELS.en}</h2>
            <p className="ui-lead">{P(V3.sunnahLead)}</p>
          </div>
          <div className="pp-sunnah-grid">
            {/* v3.2: cədvəl əvəzinə kart grid — ikon, rükət nişanı, izah, mənbə çipi */}
            <ul className="pp-sunnah-cards" data-reveal="stagger-blur">
              {SUNNAH_PRAYERS.map((sp, i) => (
                <li key={i} className="pp-sunnah-card">
                  <div className="pp-sunnah-top">
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={sp.icon} /></span>
                    <h3 className="pp-sunnah-name">{sp.name[lk] || sp.name.en}</h3>
                    <span className="pp-sunnah-rakat" aria-label={`${P(V3.colRakat)}: ${sp.rakat}`}>
                      <b className="ui-num">{sp.rakat}</b><small>{P(V3.rakatUnit)}</small>
                    </span>
                  </div>
                  <p className="pp-sunnah-desc">{sp.desc[lk] || sp.desc.en}</p>
                  {sp.source && <span className="pp-sunnah-src"><Icon name="hadith" size={12} /> {localizeSource(sp.source, lang)}</span>}
                </li>
              ))}
            </ul>

            <div className="prayer-stats-section ui-card" data-reveal>
              <h3 className="pp-card-title">{sl.weeklyTitle}</h3>
              <p className="pp-card-sub">{P(V3.weekLead)}</p>
              <div className="prayer-week-grid" role="table" aria-label={sl.weeklyTitle}>
                <div className="pw-header" role="row">
                  <div className="pw-label" role="columnheader"></div>
                  {weeklyStats.map((d, i) => (
                    <div key={i} role="columnheader" className={`pw-day-label${i === weeklyStats.length - 1 ? ' is-today' : ''}`}>{sl.days[d.day]}</div>
                  ))}
                </div>
                {STAT_KEYS.map(prayer => (
                  <div key={prayer} className="pw-row" role="row">
                    <div className="pw-prayer-name" role="rowheader">{STAT_NAMES[prayer][lk]}</div>
                    {weeklyStats.map((d, i) => (
                      <div key={i} role="cell" className={`pw-cell${d.prayers[prayer] ? ' done' : ''}${i === weeklyStats.length - 1 ? ' is-today' : ''}`}
                        aria-label={d.prayers[prayer] ? '✓' : '—'}>
                        {d.prayers[prayer] ? <Icon name="check" size={14} strokeWidth={2.4} /> : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Namaz duaları ── */}
      <section className="ui-section ui-section--tight ui-section--alt pp-duas" aria-labelledby="pp-duas-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.duasEyebrow)}</span>
            <h2 id="pp-duas-title" className="ui-title">{DUA_LABELS[lk] || DUA_LABELS.en}</h2>
            <p className="ui-lead">{P(V3.duasLead)}</p>
          </div>
          <div className="prayer-dua-list" data-reveal="stagger-fade">
            {PRAYER_DUAS.map((d, i) => (
              <article key={i} className="prayer-dua-card ui-card">
                <h3 className="prayer-dua-name">{d.name[lk] || d.name.en}</h3>
                <p className="prayer-dua-ar ui-arabic" lang="ar" dir="rtl">{d.ar}</p>
                {lang !== 'ar' && <p className="prayer-dua-trans">{d.trans[lk] || d.trans.en}</p>}
                {d.source && <p className="prayer-dua-source">{localizeSource(d.source, lang)}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Əlaqəli bölmələr + ayə ── */}
      <section className="ui-section ui-section--tight pp-more" aria-labelledby="pp-more-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(V3.moreEyebrow)}</span>
            <h2 id="pp-more-title" className="ui-title">{P(V3.moreTitle)}</h2>
          </div>
          <ul className="ui-tiles pp-tiles" data-reveal="stagger">
            {RELATED.filter(r => r.lesson || PAGES.some(p => p.key === r.page)).map(r => (
              <li key={r.page || r.lesson}>
                <a className="ui-tile ui-tile--row" href={r.lesson ? `${pathFor('learn', lang)}/${r.lesson}` : pathFor(r.page, lang)} onClick={(e) => navTo(e, r)}>
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={r.icon || r.page} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{P(r.t)}</span>
                    <span className="ui-tile__text">{P(r.d)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <figure className="prayer-reminder" data-reveal>
            <blockquote>
              <p className="reminder-arabic ui-arabic" lang="ar" dir="rtl">حَـٰفِظُوا۟ عَلَى ٱلصَّلَوَٰتِ وَٱلصَّلَوٰةِ ٱلْوُسْطَىٰ</p>
              {lang !== 'ar' && (
                <p className="reminder-trans">
                  {lang==='az'?'“Namazlarınızı, xüsusən orta namazı mühafizə edin.”':
                   lang==='ru'?'«Оберегайте молитвы и среднюю молитву»':
                   lang==='tr'?'“Namazlara ve orta namaza devam edin.”':
                   // lang-ok: ərəbcədə bu sətir göstərilmir (lang !== 'ar'), ingiliscə yalnız en üçündür
                   '“Maintain with care the prayers and the middle prayer.”'}
                </p>
              )}
            </blockquote>
            <figcaption className="reminder-src">
              {lang==='az'?'Bəqərə 2:238':lang==='ru'?'Аль-Бакара 2:238':lang==='ar'?'البقرة ٢:٢٣٨':lang==='tr'?'Bakara 2:238':'Al-Baqarah 2:238'}
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  )
}
