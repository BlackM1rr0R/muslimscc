import { useState, useEffect, useMemo } from 'react'
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
import Breadcrumb from '../components/Breadcrumb'
import { showLocalNotification } from '../utils/notify'
import { playAzan } from '../utils/azanAudio'
import RamadanCard from '../components/RamadanCard'

// İmsakiyyə səhifəsi (/ramadan) marşrutlara qoşulubsa kartda ona keçid görünür
const HAS_RAMADAN_PAGE = PAGES.some(p => p.key === 'ramadan')

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
  return `${h.day} ${month} ${h.year} ${HIJRI_SUFFIX[lang] || HIJRI_SUFFIX.en}`
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

  const toggle = (prayer) => {
    const date = todayKey()
    const key = `${date}_${prayer}`
    const done = !data[key]
    const next = { ...data }
    if (done) next[key] = true
    else delete next[key]
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(next))
      const tracker = readJSON(TRACKER_KEY)
      tracker[date] = { ...(tracker[date] || {}), [prayer.toLowerCase()]: done }
      localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker))
      window.dispatchEvent(new Event(PRAYER_SYNC_EVENT))
    } catch { /* yaddaş bağlıdır — işarə yalnız bu açılışda qalır */ }
    setData(next)
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

const SUNNAH_PRAYERS = [
  { icon:'sunrise', rakat:'2', name:{ az:'Sübh sünnəsi', en:'Fajr Sunnah', ru:'Сунна Фаджр', ar:'سنة الفجر', tr:'Sabah sünneti' }, desc:{ az:'Fərz namazdan əvvəl 2 rükət', en:'2 rakat before Fajr', ru:'2 ракаата до Фаджр', ar:'ركعتان قبل الفجر', tr:'Farzdan önce 2 rekât' }},
  { icon:'sun', rakat:'4+2', name:{ az:'Zöhr sünnəsi', en:'Dhuhr Sunnah', ru:'Сунна Зухр', ar:'سنة الظهر', tr:'Öğle sünneti' }, desc:{ az:'Fərzdən əvvəl 4, sonra 2 rükət', en:'4 before, 2 after Dhuhr', ru:'4 до и 2 после Зухр', ar:'أربع قبل وركعتان بعد الظهر', tr:'Farzdan önce 4, sonra 2 rekât' }},
  { icon:'sunLow', rakat:'4', name:{ az:'Əsr sünnəsi', en:'Asr Sunnah', ru:'Сунна Аср', ar:'سنة العصر', tr:'İkindi sünneti' }, desc:{ az:'Müstəhəb — 4 rükət əvvəl', en:'Recommended — 4 rakat before', ru:'Рекомендуется — 4 ракаата до', ar:'مستحب — أربع ركعات قبل', tr:'Müstehap — farzdan önce 4 rekât' }},
  { icon:'sunset', rakat:'2', name:{ az:'Məğrib sünnəsi', en:'Maghrib Sunnah', ru:'Сунна Магриб', ar:'سنة المغرب', tr:'Akşam sünneti' }, desc:{ az:'Fərzdən sonra 2 rükət', en:'2 rakat after Maghrib', ru:'2 ракаата после Магриб', ar:'ركعتان بعد المغرب', tr:'Farzdan sonra 2 rekât' }},
  { icon:'moon', rakat:'2', name:{ az:'İşa sünnəsi', en:'Isha Sunnah', ru:'Сунна Иша', ar:'سنة العشاء', tr:'Yatsı sünneti' }, desc:{ az:'Fərzdən sonra 2 rükət', en:'2 rakat after Isha', ru:'2 ракаата после Иша', ar:'ركعتان بعد العشاء', tr:'Farzdan sonra 2 rekât' }},
  { icon:'moon', rakat:'3', name:{ az:'Vitr namazı', en:'Witr Prayer', ru:'Витр намаз', ar:'صلاة الوتر', tr:'Vitir namazı' }, desc:{ az:'İşadan sonra, yatmadan əvvəl', en:'After Isha, before sleeping', ru:'После Иша, перед сном', ar:'بعد العشاء وقبل النوم', tr:'Yatsıdan sonra, yatmadan önce' }},
  { icon:'duas', rakat:'2–8', name:{ az:'Təhəccüd', en:'Tahajjud', ru:'Тахаджуд', ar:'تهجد', tr:'Teheccüd' }, desc:{ az:'Gecə namazı — ən fəzilətli nafilə', en:'Night prayer — most virtuous voluntary prayer', ru:'Ночной намаз — самая достойная добровольная молитва', ar:'صلاة الليل — أفضل النوافل', tr:'Gece namazı — en faziletli nafile' }},
  { icon:'sun', rakat:'2', name:{ az:'Duha namazı', en:'Duha Prayer', ru:'Намаз Духа', ar:'صلاة الضحى', tr:'Kuşluk namazı' }, desc:{ az:'Günəş doğandan 15 dəq sonra — zöhrdən əvvəl', en:'15 min after sunrise until before Dhuhr', ru:'Через 15 мин после рассвета до Зухр', ar:'بعد شروق الشمس بربع ساعة حتى قبل الظهر', tr:'Güneş doğduktan 15 dk sonra — öğleye kadar' }},
]

const PRAYER_DUAS = [
  { name:{ az:'İstiftah duası', en:'Opening Dua (Istiftah)', ru:'Дуа Истифтах', ar:'دعاء الاستفتاح', tr:'İstiftah duası' }, ar:'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلَهَ غَيْرُكَ', trans:{ az:'Allahım, Səni təsbih edir, Sənə həmd edirəm. Adın mübarəkdir, şanın ucadır, Səndən başqa ilah yoxdur.', en:'Glory be to You O Allah, and praise. Blessed is Your name, exalted is Your majesty, there is no god but You.', ru:'Пречист Ты, о Аллах, и хвала Тебе. Благословенно имя Твоё, возвышено величие Твоё, и нет бога, кроме Тебя.', ar:'سبحانك اللهم وبحمدك، تبارك اسمك وتعالى جدك، ولا إله غيرك', tr:'Seni tesbih ederim Allah\'ım ve Sana hamd ederim. Adın mübarektir, şanın yücedir, Senden başka ilah yoktur.' }},
  { name:{ az:'Rüku duası', en:'Ruku Dua', ru:'Дуа руку', ar:'دعاء الركوع', tr:'Rükû duası' }, ar:'سُبْحَانَ رَبِّيَ الْعَظِيم', trans:{ az:'Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most Great.', ru:'Пречист мой Господь Великий.', ar:'سبحان ربي العظيم', tr:'Ulu Rabbim noksansızdır.' }},
  { name:{ az:'Səcdə duası', en:'Sujud Dua', ru:'Дуа суджуд', ar:'دعاء السجود', tr:'Secde duası' }, ar:'سُبْحَانَ رَبِّيَ الأَعْلَى', trans:{ az:'Ən Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most High.', ru:'Пречист мой Господь Всевышний.', ar:'سبحان ربي الأعلى', tr:'Yüce Rabbim noksansızdır.' }},
  { name:{ az:'Təşəhhüd', en:'Tashahhud', ru:'Ташаххуд', ar:'التشهد', tr:'Tahiyyat' }, ar:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ', trans:{ az:'Bütün salamlar, namazlar və yaxşılıqlar Allaha məxsusdur. Ey Peyğəmbər, sənə Allahın salamı, rəhməti və bərəkəti olsun.', en:'All greetings, prayers and good deeds are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings.', ru:'Все приветствия, молитвы и благие дела — Аллаху. Мир тебе, о Пророк, и милость Аллаха, и Его благословения.', ar:'التحيات لله والصلوات والطيبات، السلام عليك أيها النبي ورحمة الله وبركاته', tr:'Tahiyyat, salavat ve tayyibat Allah\'a aittir. Ey Peygamber, Allah\'ın selamı, rahmeti ve bereketi senin üzerine olsun.' }},
  { name:{ az:'Salavat', en:'Salawat', ru:'Салават', ar:'الصلاة الإبراهيمية', tr:'Salli-Barik' }, ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ', trans:{ az:'Allahım, İbrahimə salavat gətirdiyin kimi, Muhammədə və ailəsinə də salavat gətir.', en:'O Allah, send blessings upon Muhammad and his family as You sent blessings upon Ibrahim.', ru:'О Аллах, благослови Мухаммада и его семью, как Ты благословил Ибрахима.', ar:'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم', tr:'Allah\'ım, İbrahim\'e salat ettiğin gibi Muhammed\'e ve ailesine de salat et.' }},
  { name:{ az:'Qunut duası', en:'Qunut Dua', ru:'Дуа Кунут', ar:'دعاء القنوت', tr:'Kunut duası' }, ar:'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ وَعَافِنِي فِيمَنْ عَافَيْتَ وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ', trans:{ az:'Allahım, hidayət etdiklərinlə birlikdə mənə də hidayət et, afiyət verdiklərinlə birlikdə mənə də afiyət ver.', en:'O Allah, guide me among those You have guided, grant me wellness among those You have granted wellness.', ru:'О Аллах, наставь меня среди тех, кого Ты наставил, и дай мне благополучие среди тех, кому Ты его дал.', ar:'اللهم اهدني فيمن هديت وعافني فيمن عافيت وتولني فيمن توليت', tr:'Allah\'ım, hidayet ettiklerin arasında bana da hidayet et, afiyet verdiklerin arasında bana da afiyet ver.' }},
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
  allDone:    { az:'Bu günün beş namazı qılındı', en:'All five prayers done today', ru:'Все пять намазов сегодня выполнены', ar:'أُدِّيَت الصلوات الخمس اليوم', tr:'Bugünün beş vakit namazı kılındı' },
}

// usePrayerTimes açarları → aladhan adları (səhifənin qalanı bu adlarla işləyir)
const API_NAME = { fajr:'Fajr', sunrise:'Sunrise', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' }

/** Yeni tabda açmaq istəyən klik (Ctrl/⌘, orta düymə) SPA keçidinə çevrilməsin. */
const isPlainClick = (e) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

export default function PrayerPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.prayer || T.az.prayer
  const lk = ['az','ru','ar','tr'].includes(lang) ? lang : 'en'

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
  const { toggle, isDone, todayDone, totalDone, totalPossible, pct, data } = usePrayerStats()
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
    tapHint:    { az:'Klik edərək işarələyin', ru:'Нажмите, чтобы отметить', ar:'اضغط للتحديد', tr:'İşaretlemek için tıklayın', en:'Tap to mark' },
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

  return (
    <div className="pp-root">
      {/* v2: sakit kağız hero — çörək qırıntısı, eyebrow, bir h1, giriş */}
      <header className="ui-page-hero pp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
          {lang !== 'ar' && <p className="pp-hero-ar ui-arabic" lang="ar" aria-hidden="true">أَوْقَاتُ الصَّلَاة</p>}
          <p className="ui-lead">{TXT.lead[lk]}</p>
        </div>
      </header>

      <section className="ui-section pp-main">
        <div className="ui-container">
          {/* Ramazan rejimi: Ramazanda səhur/iftar + geri sayım; Şabanda sakit
              "Ramazana N gün"; bayram günləri təbrik. Qalan vaxt heç nə göstərmir. */}
          <RamadanCard className="pp-ramadan"
            onOpenTimetable={HAS_RAMADAN_PAGE && setPage ? () => setPage('ramadan') : undefined} />
          {/* Masaüstü: iki sütun. ≤900px: bir sütun, CSS order ilə
              saat → növbəti namaz → vaxtlar → şəhər → əzan → statistika */}
          <div className="prayer-layout">

            <div className="prayer-left">
              {/* Saat + növbəti namaz — bir tünd zümrüd panel (ana səhifənin
                  namaz kartındakı "növbəti" bloku ilə eyni dil) */}
              <div className="pp-now" data-reveal="scale">
                <div className="prayer-clock">
                  <span className="pp-now-cap">{TXT.now[lk]}</span>
                  <div className="clock-time ui-num" aria-live="off">{timeStr}</div>
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
                    <div className="next-countdown ui-num" role="timer" aria-label={`${t.remaining}: ${countdown}`}>{countdown}</div>
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
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="pin" /></span>
                  <h2 className="prayer-city-label" id="prayer-city-label">{t.selectCity}</h2>
                </div>
                {/* 100-ə yaxın şəhər — çip zolağı yerinə axtarışlı seçici (components/CityPicker) */}
                <CityPicker triggerId="prayer-city-trigger" />
              </div>

              {/* Əzan: ayarlar sətri — ikon kafeli, ad + alt yazı, sonda açar (switch).
                  role="switch" + aria-checked — ekran oxuyucusu "açıq/bağlı" desin */}
              <button type="button" className={`azan-toggle ui-card ${azanEnabled ? 'active' : ''}`} onClick={toggleAzan}
                role="switch" aria-checked={azanEnabled} data-reveal>
                <span className="azan-ico ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="bell" /></span>
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
                  <span className="ui-badge">{cityName ? <><Icon name="pin" size={12} /> {cityName} · {TXT.calc[lk]}</> : TXT.calc[lk]}</span>
                </div>

                {loading && (
                  // Yüklənir: adlar məlumdur, vaxtların yerində parıltı (hündürlük dəyişmir)
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
                  // key={sel} — şəhər dəyişəndə siyahı yumşaq yenidən görünür
                  <ol className="prayer-times-list pp-swap" key={sel || 'default'}>
                    {PRAYER_KEYS.map((key,i) => {
                      const isNext = next?.name === key && !pt.next?.tomorrow
                      const passed = i < nextIdx
                      return (
                        <li key={key} className={`prayer-time-card${isNext ? ' is-next' : ''}${passed ? ' is-passed' : ''}${key === 'Sunrise' ? ' is-aux' : ''}`}>
                          <span className="pt-icon" aria-hidden="true"><Icon name={PRAYER_ICONS[key]} /></span>
                          <span className="pt-info">
                            <span className="pt-name">{PRAYER_NAMES[i]}</span>
                            {isNext && <span className="pt-next-badge">{TXT.nextBadge[lk]}</span>}
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

              {/* ── Namaz Statistikası Kartı ── */}
              <div className={`stat-card ui-card${allDone ? ' is-complete' : ''}`} data-reveal>
                {/* Başlıq + aylıq faiz */}
                <div className="stat-card-header">
                  <div className="stat-card-head-l">
                    <h2 className="stat-card-title">
                      <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="analytics" /></span>
                      {s('statTitle')}
                    </h2>
                    <div className="stat-card-sub">
                      <span className="stat-total-num ui-num">{totalDone}</span>
                      <span className="stat-total-sep ui-num"> {s('of')} {totalPossible} </span>
                      <span className="stat-total-label">{s('monthStat')}</span>
                    </div>
                  </div>
                  <div className="stat-circle">
                    <svg viewBox="0 0 36 36" className="stat-circle-svg" aria-hidden="true">
                      <path className="stat-circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`stat-circle-fill${pct === 0 ? ' is-empty' : ''}`}
                        strokeDasharray={`${pct}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="stat-circle-pct ui-num">{pct}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="stat-progress-bar" aria-hidden="true">
                  {/* Doluluq transform ilə (scaleX) — en animasiya olunmur */}
                  <div className="stat-progress-fill" style={{ '--p': pct / 100 }} />
                </div>

                {/* Bu günün namazları — toggle düymələri */}
                <div className="stat-today-row">
                  <div className="stat-today-label">
                    {s('todayTitle')} — <span key={todayDone.length} className="stat-today-count ui-num">{todayDone.length}/5</span> {s('done')}
                  </div>
                  <div className="stat-today-hint" aria-live="polite">{allDone ? TXT.allDone[lk] : s('tapHint')}</div>
                </div>
                {/* Hər düymədə animasiyalı dairəvi işarə (.m-check): ✓ "çəkilir" */}
                <div className="stat-prayers">
                  {STAT_KEYS.map(p => {
                    const done = isDone(p, todayKey())
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`stat-prayer-btn ${done ? 'done' : ''}`}
                        onClick={() => { haptic(); toggle(p) }}
                        aria-pressed={done}
                      >
                        <span className="stat-prayer-icon" aria-hidden="true"><Icon name={PRAYER_ICONS[p]} size={18} /></span>
                        <span className="stat-prayer-name">{STAT_NAMES[p][lk]}</span>
                        <span className="m-check stat-prayer-mcheck" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><path d={CHECK_PATH} /></svg>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Əlavə blok: solda sünnə namazları + həftəlik statistika, sağda dualar,
              altında ayə. ≤900px: sütunlar "display:contents" — həftəlik kart birinci gəlir */}
          <div className="prayer-extras">
            <div className="prayer-extras-col">
              {/* Sünnə Namazları */}
              <div className="sunnah-section ui-card" data-reveal>
                <h2 className="sunnah-title pp-card-title">{SUNNAH_LABELS[lk] || SUNNAH_LABELS.en}</h2>
                <ul className="sunnah-list" data-reveal="stagger">
                  {SUNNAH_PRAYERS.map((sp, i) => (
                    <li key={i} className="sunnah-item">
                      <span className="sunnah-icon ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral" aria-hidden="true"><Icon name={sp.icon} /></span>
                      <div className="sunnah-info">
                        <div className="sunnah-name">{sp.name[lk] || sp.name.en}</div>
                        <div className="sunnah-desc">{sp.desc[lk] || sp.desc.en}</div>
                      </div>
                      <span className="sunnah-rakat ui-num">{sp.rakat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Həftəlik Namaz Statistikası ── */}
              <div className="prayer-stats-section ui-card" data-reveal>
                <h2 className="prayer-stats-title pp-card-title">{sl.weeklyTitle}</h2>
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

            <div className="prayer-extras-col">
              {/* Namaz Duaları */}
              <div className="prayer-dua-section ui-card" data-reveal>
                <h2 className="prayer-dua-title pp-card-title">{DUA_LABELS[lk] || DUA_LABELS.en}</h2>
                <div className="prayer-dua-list" data-reveal="stagger-fade">
                  {PRAYER_DUAS.map((d, i) => (
                    <div key={i} className="prayer-dua-card">
                      <div className="prayer-dua-name">{d.name[lk] || d.name.en}</div>
                      <p className="prayer-dua-ar ui-arabic" lang="ar" dir="rtl">{d.ar}</p>
                      {/* Ərəbcə saytda tərcümə sətri ərəbcə mətnin təkrarıdır — göstərilmir */}
                      {lang !== 'ar' && <p className="prayer-dua-trans">{d.trans[lk] || d.trans.en}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <figure className="prayer-reminder" data-reveal="scale">
              <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star" /></div>
              <blockquote>
                <p className="reminder-arabic ui-arabic" lang="ar" dir="rtl">حَافِظُوا عَلَى الصَّلَوَاتِ</p>
                <p className="reminder-trans">
                  {lang==='az'?'“Namazlarınızı, xüsusən orta namazı mühafizə edin.”':
                   lang==='ru'?'«Оберегайте молитвы и среднюю молитву»':
                   lang==='ar'?'«حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَى»':
                   lang==='tr'?'“Namazlara ve orta namaza devam edin.”':
                   '“Maintain with care the prayers and the middle prayer.”'}
                </p>
              </blockquote>
              <figcaption className="reminder-src">
                {lang==='az'?'Bəqərə 2:238':lang==='ru'?'Аль-Бакара 2:238':lang==='ar'?'البقرة ٢:٢٣٨':lang==='tr'?'Bakara 2:238':'Al-Baqarah 2:238'}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>
    </div>
  )
}
