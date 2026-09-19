import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { subscribeToSettings } from '../data/adminContent'
import { brandName } from '../config/mosque'
import useMosqueTimes from '../hooks/useMosqueTimes'
import { haptic } from '../hooks/useHaptic'
import { pathFor } from '../seo/routes'
import '../styles/PrayerPage.css'
import Breadcrumb from '../components/Breadcrumb'

// Alternativ şəhərlər (aladhan timingsByCity). Birinci və standart seçim
// isə məscidin özüdür — onun vaxtı dəqiq koordinatla useMosqueTimes-dən gəlir.
const CITIES = [
  { city:'Baku',         country:'AZ', label:{ az:'Bakı',         en:'Baku',         ru:'Баку',         ar:'باكو',            tr:'Bakü' } },
  { city:'Ganja',        country:'AZ', label:{ az:'Gəncə',        en:'Ganja',        ru:'Гянджа',       ar:'كنجة',            tr:'Gence' } },
  { city:'Istanbul',     country:'TR', label:{ az:'İstanbul',     en:'Istanbul',     ru:'Стамбул',      ar:'إسطنبول',         tr:'İstanbul' } },
  { city:'Ankara',       country:'TR', label:{ az:'Ankara',       en:'Ankara',       ru:'Анкара',       ar:'أنقرة',           tr:'Ankara' } },
  { city:'Moscow',       country:'RU', label:{ az:'Moskva',       en:'Moscow',       ru:'Москва',       ar:'موسكو',           tr:'Moskova' } },
  { city:'Cairo',        country:'EG', label:{ az:'Qahirə',       en:'Cairo',        ru:'Каир',         ar:'القاهرة',         tr:'Kahire' } },
  { city:'Mecca',        country:'SA', label:{ az:'Məkkə',        en:'Mecca',        ru:'Мекка',        ar:'مكة المكرمة',     tr:'Mekke' } },
  { city:'Medina',       country:'SA', label:{ az:'Mədinə',       en:'Medina',       ru:'Медина',       ar:'المدينة المنورة', tr:'Medine' } },
  { city:'Dubai',        country:'AE', label:{ az:'Dubay',        en:'Dubai',        ru:'Дубай',        ar:'دبي',             tr:'Dubai' } },
  { city:'London',       country:'GB', label:{ az:'London',       en:'London',       ru:'Лондон',       ar:'لندن',            tr:'Londra' } },
  { city:'Sheki',        country:'AZ', label:{ az:'Şəki',         en:'Sheki',        ru:'Шеки',         ar:'شكي',             tr:'Şeki' } },
  { city:'Lankaran',     country:'AZ', label:{ az:'Lənkəran',     en:'Lankaran',     ru:'Ленкорань',    ar:'لنكران',          tr:'Lenkeran' } },
  { city:'Tabriz',       country:'IR', label:{ az:'Təbriz',       en:'Tabriz',       ru:'Тебриз',       ar:'تبريز',           tr:'Tebriz' } },
  { city:'Berlin',       country:'DE', label:{ az:'Berlin',       en:'Berlin',       ru:'Берлин',       ar:'برلين',           tr:'Berlin' } },
  { city:'Paris',        country:'FR', label:{ az:'Paris',        en:'Paris',        ru:'Париж',        ar:'باريس',           tr:'Paris' } },
  { city:'New York',     country:'US', label:{ az:'Nyu-York',     en:'New York',     ru:'Нью-Йорк',     ar:'نيويورك',         tr:'New York' } },
  { city:'Toronto',      country:'CA', label:{ az:'Toronto',      en:'Toronto',      ru:'Торонто',      ar:'تورونتو',         tr:'Toronto' } },
  { city:'Kazan',        country:'RU', label:{ az:'Kazan',        en:'Kazan',        ru:'Казань',       ar:'قازان',           tr:'Kazan' } },
  { city:'Jakarta',      country:'ID', label:{ az:'Cakarta',      en:'Jakarta',      ru:'Джакарта',     ar:'جاكرتا',          tr:'Cakarta' } },
  { city:'Kuala Lumpur', country:'MY', label:{ az:'Kuala-Lumpur', en:'Kuala Lumpur', ru:'Куала-Лумпур', ar:'كوالالمبور',      tr:'Kuala Lumpur' } },
]

// ── Seçilmiş yer (localStorage 'muslim_cc_selected_city') ──
// Dəyər: 'mosque' və ya şəhərin adı ('Ganja'). Köhnə versiya CITIES
// indeksini yazırdı ('3') — o da oxunur. Köhnə versiya ilk açılışda
// avtomatik '0' (Bakı) yazırdı; məscid Bakıdadır, ona görə '0' → məscid.
const CITY_KEY = 'muslim_cc_selected_city'
const MOSQUE_ID = 'mosque'

function readSelection() {
  let saved = null
  try { saved = localStorage.getItem(CITY_KEY) } catch { return null }
  if (saved === null || saved === '') return null
  if (saved === MOSQUE_ID) return MOSQUE_ID
  if (/^\d+$/.test(saved)) {
    const idx = Number(saved)
    if (idx === 0) return MOSQUE_ID
    return idx < CITIES.length ? idx : null
  }
  const idx = CITIES.findIndex(c => c.city === saved)
  return idx >= 0 ? idx : null
}

function writeSelection(sel) {
  try { localStorage.setItem(CITY_KEY, sel === MOSQUE_ID ? MOSQUE_ID : CITIES[sel].city) } catch { /* yaddaş bağlıdır */ }
}

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

/** aladhan-ın iki hicri formatını ({month:{number,en,ar}} və useMosqueTimes-in {month,monthEn,monthAr}) birləşdir. */
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
  az: { weeklyTitle: 'Həftəlik Namaz', monthlyTitle: 'Aylıq İrəliləyiş', completed: 'tamamlandı', days: ['Baz','B.e','Ç.a','Çər','C.a','Cümə','Şən'] },
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

/** Alternativ şəhərin vaxtları (city boşdursa — məscid seçilib — sorğu getmir). */
function usePrayer(city, country) {
  const [times,   setTimes]   = useState(null)
  const [loading, setLoading] = useState(!!city)
  const [error,   setError]   = useState(null)
  const [hijri,   setHijri]   = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    if (!city) { setLoading(false); return }
    let alive = true
    setLoading(true); setError(null)
    const ts = Math.floor(Date.now()/1000)
    fetch(`https://api.aladhan.com/v1/timingsByCity/${ts}?city=${encodeURIComponent(city)}&country=${country}&method=13`)
      .then(r => r.json())
      .then(d => {
        if (!alive) return
        setTimes(d.data?.timings || null)
        setHijri(d.data?.date?.hijri || null)
        if (!d.data?.timings) setError('bad response')
      })
      .catch(e => { if (alive) setError(e?.message || 'network') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [city, country, reloadKey])
  return { times, loading, error, hijri, reload: () => setReloadKey(k => k + 1) }
}

function useCountdown(times) {
  const [next,      setNext]      = useState(null)
  const [countdown, setCountdown] = useState('--:--:--')
  useEffect(() => {
    if (!times) return
    const ORDER = ['Fajr','Dhuhr','Asr','Maghrib','Isha']
    const tick = () => {
      const now = new Date()
      const parse = s => { const [h,m]=s.split(':').map(Number); const d=new Date(now); d.setHours(h,m,0,0); return d }
      let found = null
      for (const p of ORDER) {
        const t=parse(times[p]); if(t>now){found={name:p,time:times[p],date:t};break}
      }
      if(!found){const t=parse(times.Fajr);t.setDate(t.getDate()+1);found={name:'Fajr',time:times.Fajr,date:t}}
      setNext(found)
      const diff=found.date-now,h=Math.floor(diff/3.6e6),m=Math.floor((diff%3.6e6)/6e4),s=Math.floor((diff%6e4)/1e3)
      setCountdown(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id)
  }, [times])
  return { next, countdown }
}

const PRAYER_ICONS = { Fajr:'🌙', Sunrise:'🌅', Dhuhr:'☀️', Asr:'🌤️', Maghrib:'🌇', Isha:'🌃' }
// Telefonda ikon kafelinin rəngi (motion.css → .icon-tile--*; /dailytracker ilə eyni)
const PRAYER_TONES = { Fajr:'blue', Sunrise:'orange', Dhuhr:'gold', Asr:'teal', Maghrib:'rose', Isha:'violet' }
const SUNNAH_TONES = ['blue', 'gold', 'teal', 'rose', 'violet', 'gold', 'violet', 'orange']
// .m-check-in ✓ xətti (motion.css)
const CHECK_PATH = 'M6.5 12.5l3.8 3.8L17.5 8.5'

const SUNNAH_PRAYERS = [
  { icon:'🌙', rakat:'2', name:{ az:'Sübh sünnəsi', en:'Fajr Sunnah', ru:'Сунна Фаджр', ar:'سنة الفجر', tr:'Sabah sünneti' }, desc:{ az:'Fərz namazdan əvvəl 2 rükət', en:'2 rakat before Fajr', ru:'2 ракаата до Фаджр', ar:'ركعتان قبل الفجر', tr:'Farzdan önce 2 rekât' }},
  { icon:'☀️', rakat:'4+2', name:{ az:'Zöhr sünnəsi', en:'Dhuhr Sunnah', ru:'Сунна Зухр', ar:'سنة الظهر', tr:'Öğle sünneti' }, desc:{ az:'Fərzdən əvvəl 4, sonra 2 rükət', en:'4 before, 2 after Dhuhr', ru:'4 до и 2 после Зухр', ar:'أربع قبل وركعتان بعد الظهر', tr:'Farzdan önce 4, sonra 2 rekât' }},
  { icon:'🌤️', rakat:'—', name:{ az:'Əsr sünnəsi', en:'Asr Sunnah', ru:'Сунна Аср', ar:'سنة العصر', tr:'İkindi sünneti' }, desc:{ az:'Müstəhəb — 4 rükət əvvəl', en:'Recommended — 4 rakat before', ru:'Рекомендуется — 4 ракаата до', ar:'مستحب — أربع ركعات قبل', tr:'Müstehap — farzdan önce 4 rekât' }},
  { icon:'🌇', rakat:'2', name:{ az:'Məğrib sünnəsi', en:'Maghrib Sunnah', ru:'Сунна Магриб', ar:'سنة المغرب', tr:'Akşam sünneti' }, desc:{ az:'Fərzdən sonra 2 rükət', en:'2 rakat after Maghrib', ru:'2 ракаата после Магриб', ar:'ركعتان بعد المغرب', tr:'Farzdan sonra 2 rekât' }},
  { icon:'🌃', rakat:'2', name:{ az:'İşa sünnəsi', en:'Isha Sunnah', ru:'Сунна Иша', ar:'سنة العشاء', tr:'Yatsı sünneti' }, desc:{ az:'Fərzdən sonra 2 rükət', en:'2 rakat after Isha', ru:'2 ракаата после Иша', ar:'ركعتان بعد العشاء', tr:'Farzdan sonra 2 rekât' }},
  { icon:'🌟', rakat:'3', name:{ az:'Vitr namazı', en:'Witr Prayer', ru:'Витр намаз', ar:'صلاة الوتر', tr:'Vitir namazı' }, desc:{ az:'İşadan sonra, yatmadan əvvəl', en:'After Isha, before sleeping', ru:'После Иша, перед сном', ar:'بعد العشاء وقبل النوم', tr:'Yatsıdan sonra, yatmadan önce' }},
  { icon:'✨', rakat:'2-8', name:{ az:'Təhəccüd', en:'Tahajjud', ru:'Тахаджуд', ar:'تهجد', tr:'Teheccüd' }, desc:{ az:'Gecə namazı — ən fəzilətli nafilə', en:'Night prayer — most virtuous voluntary prayer', ru:'Ночной намаз — самая достойная добровольная молитва', ar:'صلاة الليل — أفضل النوافل', tr:'Gece namazı — en faziletli nafile' }},
  { icon:'🌅', rakat:'2', name:{ az:'Duha namazı', en:'Duha Prayer', ru:'Намаз Духа', ar:'صلاة الضحى', tr:'Kuşluk namazı' }, desc:{ az:'Günəş doğandan 15 dəq sonra — zöhrdən əvvəl', en:'15 min after sunrise until before Dhuhr', ru:'Через 15 мин после рассвета до Зухр', ar:'بعد شروق الشمس بربع ساعة حتى قبل الظهر', tr:'Güneş doğduktan 15 dk sonra — öğleye kadar' }},
]

const PRAYER_DUAS = [
  { name:{ az:'İstiftah duası', en:'Opening Dua (Istiftah)', ru:'Дуа Истифтах', ar:'دعاء الاستفتاح', tr:'İstiftah duası' }, ar:'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلَهَ غَيْرُكَ', trans:{ az:'Allahım, Səni təsbih edir, Sənə həmd edirəm. Adın mübarəkdir, şanın ucadır, Səndən başqa ilah yoxdur.', en:'Glory be to You O Allah, and praise. Blessed is Your name, exalted is Your majesty, there is no god but You.', ru:'Пречист Ты, о Аллах, и хвала Тебе. Благословенно имя Твоё, возвышено величие Твоё, и нет бога, кроме Тебя.', ar:'سبحانك اللهم وبحمدك، تبارك اسمك وتعالى جدك، ولا إله غيرك', tr:'Seni tesbih ederim Allah\'ım ve Sana hamd ederim. Adın mübarektir, şanın yücedir, Senden başka ilah yoktur.' }},
  { name:{ az:'Rüku duası', en:'Ruku Dua', ru:'Дуа руку', ar:'دعاء الركوع', tr:'Rükû duası' }, ar:'سُبْحَانَ رَبِّيَ الْعَظِيم', trans:{ az:'Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most Great.', ru:'Пречист мой Господь Великий.', ar:'سبحان ربي العظيم', tr:'Ulu Rabbim noksansızdır.' }},
  { name:{ az:'Səcdə duası', en:'Sujud Dua', ru:'Дуа суджуд', ar:'دعاء السجود', tr:'Secde duası' }, ar:'سُبْحَانَ رَبِّيَ الأَعْلَى', trans:{ az:'Ən Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most High.', ru:'Пречист мой Господь Всевышний.', ar:'سبحان ربي الأعلى', tr:'Yüce Rabbim noksansızdır.' }},
  { name:{ az:'Təşəhhüd', en:'Tashahhud', ru:'Ташаххуд', ar:'التشهد', tr:'Tahiyyat' }, ar:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ', trans:{ az:'Bütün salamlar, namazlar və yaxşılıqlar Allaha məxsusdur. Ey Peyğəmbər, sənə Allahın salamı, rəhməti və bərəkəti olsun.', en:'All greetings, prayers and good deeds are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings.', ru:'Все приветствия, молитвы и благие дела — Аллаху. Мир тебе, о Пророк, и милость Аллаха, и Его благословения.', ar:'التحيات لله والصلوات والطيبات، السلام عليك أيها النبي ورحمة الله وبركاته', tr:'Tahiyyat, salavat ve tayyibat Allah\'a aittir. Ey Peygamber, Allah\'ın selamı, rahmeti ve bereketi senin üzerine olsun.' }},
  { name:{ az:'Salavat', en:'Salawat', ru:'Салават', ar:'الصلاة الإبراهيمية', tr:'Salli-Barik' }, ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ', trans:{ az:'Allahım, İbrahimə salavat gətirdiyin kimi, Muhammədə və ailəsinə də salavat gətir.', en:'O Allah, send blessings upon Muhammad and his family as You sent blessings upon Ibrahim.', ru:'О Аллах, благослови Мухаммада и его семью, как Ты благословил Ибрахима.', ar:'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم', tr:'Allah\'ım, İbrahim\'e salat ettiğin gibi Muhammed\'e ve ailesine de salat et.' }},
  { name:{ az:'Qunut duası', en:'Qunut Dua', ru:'Дуа Кунут', ar:'دعاء القنوت', tr:'Kunut duası' }, ar:'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ وَعَافِنِي فِيمَنْ عَافَيْتَ وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ', trans:{ az:'Allahım, hidayət etdiklərinlə birlikdə mənə də hidayət et, afiyət verdiklərinlə birlikdə mənə də afiyət ver.', en:'O Allah, guide me among those You have guided, grant me wellness among those You have granted wellness.', ru:'О Аллах, наставь меня среди тех, кого Ты наставил, и дай мне благополучие среди тех, кому Ты его дал.', ar:'اللهم اهدني فيمن هديت وعافني فيمن عافيت وتولني فيمن توليت', tr:'Allah\'ım, hidayet ettiklerin arasında bana da hidayet et, afiyet verdiklerin arasında bana da afiyet ver.' }},
]

const SUNNAH_LABELS = { az:'Sünnə Namazları', en:'Sunnah Prayers', ru:'Сунна-намазы', ar:'صلوات السنة', tr:'Sünnet Namazları' }
const DUA_LABELS = { az:'Namaz Duaları', en:'Prayer Duas', ru:'Молитвенные дуа', ar:'أدعية الصلاة', tr:'Namaz Duaları' }

// Səhifənin qısa mətnləri (5 dil)
const TXT = {
  jamaatLink: { az:'Camaat vaxtları', en:'Congregation times', ru:'Время джамаата', ar:'أوقات الجماعة', tr:'Cemaat vakitleri' },
  calcNote:   { az:'Məscidin koordinatına görə hesablanıb', en:'Calculated for the mosque’s location', ru:'Рассчитано по координатам мечети', ar:'محسوبة وفق موقع المسجد', tr:'Caminin konumuna göre hesaplandı' },
  loadError:  { az:'Namaz vaxtları yüklənmədi. İnternet bağlantısını yoxlayın.', en:'Could not load prayer times. Check your connection.', ru:'Не удалось загрузить время намаза. Проверьте подключение.', ar:'تعذّر تحميل مواقيت الصلاة. تحقّق من الاتصال.', tr:'Namaz vakitleri yüklenemedi. Bağlantınızı kontrol edin.' },
  retry:      { az:'Yenidən yoxla', en:'Try again', ru:'Повторить', ar:'أعد المحاولة', tr:'Tekrar dene' },
  notifBody:  { az:'Namaz vaxtı gəldi!', en:'It is time for prayer', ru:'Наступило время намаза', ar:'حان وقت الصلاة', tr:'Namaz vakti geldi' },
  // Telefonda əzan sətrinin alt yazısı (masaüstündə gizlidir)
  azanSub:    { az:'Namaz vaxtı girəndə bildiriş və səs', en:'Notification and sound at prayer time', ru:'Уведомление и звук во время намаза', ar:'إشعار وصوت عند دخول وقت الصلاة', tr:'Namaz vaktinde bildirim ve ses' },
}

// useMosqueTimes açarları → aladhan adları (səhifənin qalanı bu adlarla işləyir)
const API_NAME = { fajr:'Fajr', sunrise:'Sunrise', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' }

/** Yeni tabda açmaq istəyən klik (Ctrl/⌘, orta düymə) SPA keçidinə çevrilməsin. */
const isPlainClick = (e) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

export default function PrayerPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.prayer || T.az.prayer
  const lk = ['az','ru','ar','tr'].includes(lang) ? lang : 'en'

  // Seçim: 'mosque' (standart) və ya CITIES indeksi
  const [sel, setSel] = useState(() => readSelection() ?? MOSQUE_ID)
  const isMosque = sel === MOSQUE_ID
  const city = isMosque ? null : CITIES[sel]

  const choose = (v) => { setSel(v); writeSelection(v) }

  // Admin Settings-dəki standart şəhər — yalnız istifadəçi özü seçməyibsə.
  // Admin standartı "Baku"-dur: məscid Bakıdadır, ona görə məscidin dəqiq vaxtı.
  useEffect(() => {
    if (readSelection() !== null) return
    const unsubscribe = subscribeToSettings((settings) => {
      const c = settings?.defaultCity
      if (!c || readSelection() !== null) return
      if (c === 'Baku') { setSel(MOSQUE_ID); return }
      const idx = CITIES.findIndex(x => x.city === c)
      if (idx >= 0) setSel(idx)
    })
    return () => unsubscribe?.()
  }, [])

  // Məscid: dəqiq koordinat (useMosqueTimes, /jamaat ilə eyni vaxtlar); şəhər: aladhan timingsByCity
  const mosque = useMosqueTimes()
  const cityData = usePrayer(city?.city, city?.country)

  const mosqueTimes = useMemo(() => {
    if (!mosque.prayers.length) return null
    const o = {}
    for (const p of mosque.prayers) o[API_NAME[p.key]] = p.adhan
    return o
  }, [mosque.prayers])

  const times   = isMosque ? mosqueTimes : cityData.times
  const loading = isMosque ? mosque.loading : cityData.loading
  const error   = isMosque ? mosque.error : cityData.error
  const hijri   = normHijri(isMosque ? mosque.hijri : cityData.hijri)
  const retry   = isMosque ? mosque.reload : cityData.reload

  // Son yüklənmiş vaxtlar (köhnə açar saxlanılır)
  useEffect(() => {
    if (!times) return
    try {
      localStorage.setItem('cached_prayer_times', JSON.stringify({
        Fajr: times.Fajr, Dhuhr: times.Dhuhr, Asr: times.Asr, Maghrib: times.Maghrib, Isha: times.Isha,
      }))
    } catch { /* yaddaş bağlıdır */ }
  }, [times])

  const { next, countdown } = useCountdown(times)
  const { toggle, isDone, todayDone, totalDone, totalPossible, pct, data } = usePrayerStats()
  const weeklyStats = useWeeklyStats(data)
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id) }, [])

  // Telefonda şəhərlər üfüqi zolaqdadır — seçilmiş çip görünmürsə ora sürüşdür
  // (yalnız zolağın özü sürüşür, səhifə yerində qalır)
  // Seçim dəyişəndə də: yarımçıq görünən çipə toxunulubsa zolaq onu yumşaq ortalayır
  const cityGridRef = useRef(null)
  const cityScrolled = useRef(false)
  useEffect(() => {
    const grid = cityGridRef.current
    if (!grid || grid.scrollWidth <= grid.clientWidth + 1) return
    const chip = grid.querySelector('.city-btn.active')
    if (!chip) return
    const g = grid.getBoundingClientRect()
    const c = chip.getBoundingClientRect()
    const first = !cityScrolled.current
    cityScrolled.current = true
    if (c.left >= g.left + 8 && c.right <= g.right - 8) return
    const left = grid.scrollLeft + (c.left - g.left) - (g.width - c.width) / 2
    let smooth = !first
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) smooth = false } catch { /* köhnə brauzer */ }
    if (typeof grid.scrollTo === 'function') grid.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
    else grid.scrollLeft = left
  }, [sel])

  const STAT_NAMES = {
    Fajr:    { az:'Sübh',   ru:'Фаджр',  ar:'الفجر',   tr:'Sabah',  en:'Fajr'    },
    Dhuhr:   { az:'Zöhr',   ru:'Зухр',   ar:'الظهر',   tr:'Öğle',   en:'Dhuhr'   },
    Asr:     { az:'Əsr',    ru:'Аср',    ar:'العصر',   tr:'İkindi', en:'Asr'     },
    Maghrib: { az:'Məğrib', ru:'Магриб', ar:'المغرب',  tr:'Akşam',  en:'Maghrib' },
    Isha:    { az:'İşa',    ru:'Иша',    ar:'العشاء',  tr:'Yatsı',  en:'Isha'    },
  }

  // ── Əzan bildirişi ──
  const [azanEnabled, setAzanEnabled] = useState(() => localStorage.getItem('azan_enabled') === '1')

  const toggleAzan = () => {
    haptic()
    const next = !azanEnabled
    setAzanEnabled(next)
    localStorage.setItem('azan_enabled', next ? '1' : '0')
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    if (!azanEnabled || !times) return
    const check = () => {
      const now = new Date()
      const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      // Yalnız 5 fərz namaz (aladhan cavabında İmsak, Gecəyarısı və s. də var)
      STAT_KEYS.forEach((key) => {
        const time = times[key]
        if (time && time.slice(0,5) === nowStr) {
          const lastNotif = localStorage.getItem('last_azan_notif')
          const notifKey = `${nowStr}-${key}`
          if (lastNotif !== notifKey) {
            localStorage.setItem('last_azan_notif', notifKey)
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(`🕌 ${STAT_NAMES[key][lk]}`, { body: `${time.slice(0,5)} — ${TXT.notifBody[lk]}` })
            }
            // Əzan melodiyası — Web Audio API ilə
            try {
              const ctx = new AudioContext()
              const now = ctx.currentTime
              // Əzan notaları (Allahu Akbar melodiyası)
              const notes = [
                { freq: 440, start: 0,    dur: 0.6 },  // A4
                { freq: 523, start: 0.7,  dur: 0.6 },  // C5
                { freq: 587, start: 1.4,  dur: 0.8 },  // D5
                { freq: 523, start: 2.3,  dur: 0.6 },  // C5
                { freq: 440, start: 3.0,  dur: 0.8 },  // A4
                { freq: 392, start: 3.9,  dur: 0.6 },  // G4
                { freq: 440, start: 4.6,  dur: 1.0 },  // A4
                // İkinci fraza
                { freq: 523, start: 5.8,  dur: 0.6 },  // C5
                { freq: 587, start: 6.5,  dur: 0.8 },  // D5
                { freq: 659, start: 7.4,  dur: 0.6 },  // E5
                { freq: 587, start: 8.1,  dur: 0.6 },  // D5
                { freq: 523, start: 8.8,  dur: 0.6 },  // C5
                { freq: 440, start: 9.5,  dur: 1.2 },  // A4
              ]
              notes.forEach(n => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = 'sine'
                osc.frequency.value = n.freq
                osc.connect(gain)
                gain.connect(ctx.destination)
                gain.gain.setValueAtTime(0, now + n.start)
                gain.gain.linearRampToValueAtTime(0.25, now + n.start + 0.05)
                gain.gain.linearRampToValueAtTime(0.2, now + n.start + n.dur * 0.7)
                gain.gain.linearRampToValueAtTime(0, now + n.start + n.dur)
                osc.start(now + n.start)
                osc.stop(now + n.start + n.dur + 0.01)
              })
            } catch {}
          }
        }
      })
    }
    const id = setInterval(check, 30000)
    check()
    return () => clearInterval(id)
    // STAT_NAMES hər renderdə yaranır, amma dil dəyişəndə lk ilə birlikdə yenilənir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azanEnabled, times, lk])

  const PRAYER_KEYS = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha']
  const PRAYER_NAMES = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha]

  const sl = STATS_LABELS[lk]

  const timeStr = formatClockTime(now)
  const dateStr = formatClockDate(now, lang)

  const L = {
    statTitle:  { az:'Bu Ay Namaz',      ru:'Намаз в этом месяце', ar:'صلواتي هذا الشهر', tr:'Bu Ay Namaz',      en:'This Month Prayers'   },
    todayTitle: { az:'Bu gün',           ru:'Сегодня',             ar:'اليوم',             tr:'Bugün',            en:'Today'                },
    done:       { az:'qılındı',          ru:'выполнено',           ar:'مُؤدَّاة',           tr:'kılındı',          en:'completed'            },
    of:         { az:'/',               ru:'из',                  ar:'من',               tr:'/',                en:'of'                   },
    monthStat:  { az:'bu ay',           ru:'в этом месяце',       ar:'هذا الشهر',        tr:'bu ay',            en:'this month'           },
    tapHint:    { az:'Klik edərək işarələyin', ru:'Нажмите чтобы отметить', ar:'اضغط للتحديد', tr:'İşaretlemek için tıklayın', en:'Tap to mark' },
  }
  const s = (k) => L[k][lk]

  return (
    <>
      <div className="page-hero hero-compact theme-prayer">
        <Breadcrumb setPage={setPage} current={t.title} />
        {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
        {lang !== 'ar' && <div className="page-hero-arabic">أَوْقَاتُ الصَّلاة</div>}
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          {/* Masaüstü: iki sütun. ≤900px: bir sütun, CSS order ilə
              saat → növbəti namaz → vaxtlar → şəhər → əzan → statistika */}
          <div className="prayer-layout">

            <div className="prayer-left">
              <div className="prayer-clock">
                <div className="clock-time">{timeStr}</div>
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
                  <div className="next-label">{t.next}</div>
                  <div className="next-name">{PRAYER_ICONS[next.name]} {PRAYER_NAMES[PRAYER_KEYS.indexOf(next.name)] || next.name}</div>
                  <div className="next-countdown">{countdown}</div>
                  <div className="next-remaining-label">{t.remaining}</div>
                </div>
              )}

              <div className="prayer-city-block">
                <div className="prayer-city-label" id="prayer-city-label">{t.selectCity}</div>
                <div className="city-grid" ref={cityGridRef} role="group" aria-labelledby="prayer-city-label">
                  <button className={`city-btn is-mosque ${isMosque ? 'active' : ''}`}
                    aria-pressed={isMosque} onClick={() => choose(MOSQUE_ID)}>
                    <span aria-hidden="true">🕌</span> {brandName(lang)}
                  </button>
                  {CITIES.map((c, i) => (
                    <button key={c.city} className={`city-btn ${sel === i ? 'active' : ''}`}
                      aria-pressed={sel === i} onClick={() => choose(i)}>
                      {c.label[lang] || c.label.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Masaüstündə: "🔔 Əzan aktiv" həbi. Telefonda: ayarlar sətri —
                  ikon kafeli, ad + alt yazı, sonda açar (switch) */}
              <button type="button" className={`azan-toggle ${azanEnabled ? 'active' : ''}`} onClick={toggleAzan} aria-pressed={azanEnabled}>
                <span className="azan-ico icon-tile icon-tile--gold" aria-hidden="true">{azanEnabled ? '🔔' : '🔕'}</span>
                <span className="azan-text">
                  <span className="azan-label">{azanEnabled ? (lang==='az'?'Əzan aktiv':lang==='ru'?'Азан включён':lang==='ar'?'الأذان مفعل':lang==='tr'?'Ezan aktif':'Azan active') : (lang==='az'?'Əzan bildirişi':lang==='ru'?'Уведомление азана':lang==='ar'?'إشعار الأذان':lang==='tr'?'Ezan bildirimi':'Azan notification')}</span>
                  <span className="azan-sub">{TXT.azanSub[lk]}</span>
                </span>
                <span className="azan-switch" aria-hidden="true"><span className="azan-knob" /></span>
              </button>
            </div>

            <div className="prayer-right">
              {loading && (
                <>
                  <div className="spinner-wrap"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>
                  {/* Telefonda fırlanan göstərici əvəzinə siyahı formasında parıltı */}
                  <div className="prayer-times-skeleton" role="status" aria-label={t.loading}>
                    {PRAYER_KEYS.map(k => (
                      <div key={k} className="pts-row">
                        <span className="skeleton pts-ico" />
                        <span className="skeleton skeleton--text pts-name" />
                        <span className="skeleton skeleton--text pts-time" />
                      </div>
                    ))}
                  </div>
                </>
              )}
              {error && !loading && !times && (
                <div className="prayer-error" role="alert">
                  <span>{TXT.loadError[lk]}</span>
                  <button className="btn-secondary" onClick={retry}>{TXT.retry[lk]}</button>
                </div>
              )}
              {times && !loading && (
                <div className="prayer-times-list m-list" data-reveal="stagger">
                  {PRAYER_KEYS.map((key,i) => {
                    const isNext = next?.name === key
                    return (
                      <div key={key} className={`prayer-time-card m-row ${isNext?'is-next':''}`}>
                        <div className={`pt-icon icon-tile icon-tile--${PRAYER_TONES[key]}`} aria-hidden="true">{PRAYER_ICONS[key]}</div>
                        <div className="pt-info">
                          <span className="pt-name">{PRAYER_NAMES[i]}</span>
                          {isNext && <span className="pt-next-badge">
                            {lang==='az'?'Növbəti': lang==='ru'?'Следующий': lang==='ar'?'التالي': lang==='tr'?'Sonraki':'Next'}
                          </span>}
                        </div>
                        <div className="pt-time">{times[key]}</div>
                        <div className={`pt-indicator ${isNext?'active':''}`} />
                      </div>
                    )
                  })}
                </div>
              )}
              {times && !loading && (
                <div className="prayer-times-foot">
                  {isMosque && <span className="prayer-times-note">{TXT.calcNote[lk]}</span>}
                  <a className="prayer-jamaat-link" href={pathFor('jamaat', lang)}
                    onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); setPage?.('jamaat') } }}>
                    {TXT.jamaatLink[lk]} <span className="qm-dir-arrow" aria-hidden="true">→</span>
                  </a>
                </div>
              )}

              {/* ── Namaz Statistikası Kartı ── */}
              <div className="stat-card" data-reveal>
                {/* Başlıq + aylıq faiz */}
                <div className="stat-card-header">
                  <div>
                    <div className="stat-card-title">📊 {s('statTitle')}</div>
                    <div className="stat-card-sub">
                      <span className="stat-total-num">{totalDone}</span>
                      <span className="stat-total-sep"> {s('of')} {totalPossible} </span>
                      <span className="stat-total-label">{s('monthStat')}</span>
                    </div>
                  </div>
                  <div className="stat-circle">
                    <svg viewBox="0 0 36 36" className="stat-circle-svg">
                      <path className="stat-circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="stat-circle-fill"
                        strokeDasharray={`${pct}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="stat-circle-pct">{pct}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="stat-progress-bar">
                  {/* Doluluq transform ilə (scaleX) — en animasiya olunmur */}
                  <div className="stat-progress-fill" style={{ '--p': pct / 100 }} />
                </div>

                {/* Bu günün namazları — toggle düymələri */}
                <div className="stat-today-label">
                  {s('todayTitle')} — {todayDone.length}/5 {s('done')}
                </div>
                <div className="stat-today-hint">{s('tapHint')}</div>
                {/* Telefonda: kartın içində haşiyəsiz siyahı + animasiyalı dairəvi
                    işarə (.m-check); masaüstündə əvvəlki düymələr və ✓ */}
                <div className="stat-prayers m-list">
                  {STAT_KEYS.map(p => {
                    const done = isDone(p, todayKey())
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`stat-prayer-btn m-row ${done ? 'done' : ''}`}
                        onClick={() => { haptic(); toggle(p) }}
                        aria-pressed={done}
                        title={STAT_NAMES[p][lk]}
                      >
                        <span className={`stat-prayer-icon icon-tile icon-tile--sm icon-tile--${PRAYER_TONES[p]}`} aria-hidden="true">{PRAYER_ICONS[p]}</span>
                        <span className="stat-prayer-name">{STAT_NAMES[p][lk]}</span>
                        <span className="stat-prayer-check" aria-hidden="true">{done ? '✓' : ''}</span>
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
              altında ayə. İki sütun təxminən bərabər hündürlükdə bitir.
              ≤900px: sütunlar "display:contents" — həftəlik kart birinci gəlir */}
          <div className="prayer-extras">
            <div className="prayer-extras-col">
              {/* Sünnə Namazları */}
              <div className="sunnah-section">
                <h3 className="sunnah-title">{SUNNAH_LABELS[lk] || SUNNAH_LABELS.en}</h3>
                <div className="sunnah-list m-list" data-reveal="stagger">
                  {SUNNAH_PRAYERS.map((sp, i) => (
                    <div key={i} className="sunnah-item m-row">
                      <div className={`sunnah-icon icon-tile icon-tile--${SUNNAH_TONES[i] || 'gold'}`} aria-hidden="true">{sp.icon}</div>
                      <div className="sunnah-info">
                        <div className="sunnah-name">{sp.name[lk] || sp.name.en}</div>
                        <div className="sunnah-desc">{sp.desc[lk] || sp.desc.en}</div>
                      </div>
                      <div className="sunnah-rakat">{sp.rakat}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Həftəlik Namaz Statistikası ── */}
              <div className="prayer-stats-section" data-reveal>
                <h3 className="prayer-stats-title">{sl.weeklyTitle}</h3>
                <div className="prayer-week-grid">
                  <div className="pw-header">
                    <div className="pw-label"></div>
                    {weeklyStats.map((d, i) => (
                      <div key={i} className={`pw-day-label${i === weeklyStats.length - 1 ? ' is-today' : ''}`}>{sl.days[d.day]}</div>
                    ))}
                  </div>
                  {STAT_KEYS.map(prayer => (
                    <div key={prayer} className="pw-row">
                      <div className="pw-prayer-name">{STAT_NAMES[prayer][lk]}</div>
                      {weeklyStats.map((d, i) => (
                        <div key={i} className={`pw-cell ${d.prayers[prayer] ? 'done' : ''}`}>
                          {d.prayers[prayer] ? '✓' : ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="prayer-extras-col">
              {/* Namaz Duaları */}
              <div className="prayer-dua-section" data-reveal="stagger">
                <h3 className="prayer-dua-title">{DUA_LABELS[lk] || DUA_LABELS.en}</h3>
                {PRAYER_DUAS.map((d, i) => (
                  <div key={i} className="prayer-dua-card">
                    <div className="prayer-dua-name">{d.name[lk] || d.name.en}</div>
                    <div className="prayer-dua-ar">{d.ar}</div>
                    <div className="prayer-dua-trans">{d.trans[lk] || d.trans.en}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="prayer-reminder" data-reveal="scale">
              <div className="reminder-arabic">حَافِظُوا عَلَى الصَّلَوَاتِ</div>
              <p className="reminder-trans">
                {lang==='az'?'"Namazlarınızı, xüsusən orta namazı mühafizə edin." — Bəqərə 2:238':
                 lang==='ru'?'«Оберегайте молитвы и среднюю молитву» — Аль-Бакара 2:238':
                 lang==='ar'?'«حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَى» — البقرة ٢:٢٣٨':
                 lang==='tr'?'"Namazlara ve orta namaza devam edin." — Bakara 2:238':
                 '"Maintain with care the prayers." — Al-Baqarah 2:238'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
