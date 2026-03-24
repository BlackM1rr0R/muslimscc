import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/PrayerPage.css'

const CITIES = [
  { label:'Bakı',     city:'Baku',      country:'AZ' },
  { label:'Gəncə',   city:'Ganja',     country:'AZ' },
  { label:'İstanbul',city:'Istanbul',   country:'TR' },
  { label:'Ankara',  city:'Ankara',     country:'TR' },
  { label:'Moskva',  city:'Moscow',     country:'RU' },
  { label:'Qahirə',  city:'Cairo',      country:'EG' },
  { label:'Məkkə',   city:'Mecca',      country:'SA' },
  { label:'Medine',  city:'Medina',     country:'SA' },
  { label:'Dubai',   city:'Dubai',      country:'AE' },
  { label:'London',  city:'London',     country:'GB' },
  { label:'Şəki',     city:'Sheki',      country:'AZ' },
  { label:'Lənkəran', city:'Lankaran',    country:'AZ' },
  { label:'Təbriz',   city:'Tabriz',      country:'IR' },
  { label:'Berlin',   city:'Berlin',      country:'DE' },
  { label:'Paris',    city:'Paris',       country:'FR' },
  { label:'New York', city:'New York',    country:'US' },
  { label:'Toronto',  city:'Toronto',     country:'CA' },
  { label:'Kazan',    city:'Kazan',       country:'RU' },
  { label:'Jakarta',  city:'Jakarta',     country:'ID' },
  { label:'Kuala Lumpur', city:'Kuala Lumpur', country:'MY' },
]

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

function usePrayerStats() {
  const STORAGE_KEY = 'muslim_cc_prayer_stats'

  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
  }
  const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

  const [data, setData] = useState(load)

  const toggle = (prayer) => {
    const key = `${todayKey()}_${prayer}`
    setData(prev => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      save(next)
      return next
    })
  }

  const isDone = (prayer, dateStr) => !!data[`${dateStr}_${prayer}`]
  const todayDone = STAT_KEYS.filter(p => isDone(p, todayKey()))

  // Bu aydakı toplam edilən namazlar
  const prefix = monthPrefix()
  const totalDone = Object.keys(data).filter(k => k.startsWith(prefix)).length
  const totalPossible = daysInCurrentMonth() * 5
  const pct = Math.round((totalDone / totalPossible) * 100)

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

function usePrayer(city, country) {
  const [times,   setTimes]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [hijri,   setHijri]   = useState(null)
  useEffect(() => {
    setLoading(true); setError(null)
    const ts = Math.floor(Date.now()/1000)
    fetch(`https://api.aladhan.com/v1/timingsByCity/${ts}?city=${encodeURIComponent(city)}&country=${country}&method=13`)
      .then(r => r.json())
      .then(d => {
        const t = d.data?.timings || null
        setTimes(t)
        setHijri(d.data?.date?.hijri || null)
        if (t) {
          try {
            localStorage.setItem('cached_prayer_times', JSON.stringify({
              Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha
            }))
          } catch {}
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [city, country])
  return { times, loading, error, hijri }
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
  { name:{ az:'İftitah duası', en:'Opening Dua', ru:'Дуа открытия', ar:'دعاء الاستفتاح', tr:'İftitah duası' }, ar:'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلَهَ غَيْرُكَ', trans:{ az:'Allahım, Səni təsbih edir, Sənə həmd edirəm. Adın mübarəkdir, şanın ucadır, Səndən başqa ilah yoxdur.', en:'Glory be to You O Allah, and praise. Blessed is Your name, exalted is Your majesty, there is no god but You.', ru:'Пречист Ты, о Аллах, и хвала Тебе. Благословенно имя Твоё, возвышено величие Твоё, и нет бога, кроме Тебя.', ar:'سبحانك اللهم وبحمدك، تبارك اسمك وتعالى جدك، ولا إله غيرك', tr:'Seni tesbih ederim Allah\'ım ve Sana hamd ederim. Adın mübarektir, şanın yücedir, Senden başka ilah yoktur.' }},
  { name:{ az:'Rüku duası', en:'Ruku Dua', ru:'Дуа руку', ar:'دعاء الركوع', tr:'Rükû duası' }, ar:'سُبْحَانَ رَبِّيَ الْعَظِيم', trans:{ az:'Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most Great.', ru:'Пречист мой Господь Великий.', ar:'سبحان ربي العظيم', tr:'Ulu Rabbim noksansızdır.' }},
  { name:{ az:'Səcdə duası', en:'Sujud Dua', ru:'Дуа суджуд', ar:'دعاء السجود', tr:'Secde duası' }, ar:'سُبْحَانَ رَبِّيَ الأَعْلَى', trans:{ az:'Ən Uca Rəbbim nöqsansızdır.', en:'Glory be to my Lord, the Most High.', ru:'Пречист мой Господь Всевышний.', ar:'سبحان ربي الأعلى', tr:'Yüce Rabbim noksansızdır.' }},
  { name:{ az:'Təşəhhüd', en:'Tashahhud', ru:'Ташаххуд', ar:'التشهد', tr:'Tahiyyat' }, ar:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ', trans:{ az:'Bütün salamlar, namazlar və yaxşılıqlar Allaha məxsusdur. Ey Peyğəmbər, sənə Allahın salamı, rəhməti və bərəkəti olsun.', en:'All greetings, prayers and good deeds are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings.', ru:'Все приветствия, молитвы и благие дела — Аллаху. Мир тебе, о Пророк, и милость Аллаха, и Его благословения.', ar:'التحيات لله والصلوات والطيبات، السلام عليك أيها النبي ورحمة الله وبركاته', tr:'Tahiyyat, salavat ve tayyibat Allah\'a aittir. Ey Peygamber, Allah\'ın selamı, rahmeti ve bereketi senin üzerine olsun.' }},
  { name:{ az:'Salavat', en:'Salawat', ru:'Салават', ar:'الصلاة الإبراهيمية', tr:'Salli-Barik' }, ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ', trans:{ az:'Allahım, İbrahimə salavat gətirdiyin kimi, Muhammədə və ailəsinə də salavat gətir.', en:'O Allah, send blessings upon Muhammad and his family as You sent blessings upon Ibrahim.', ru:'О Аллах, благослови Мухаммада и его семью, как Ты благословил Ибрахима.', ar:'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم', tr:'Allah\'ım, İbrahim\'e salat ettiğin gibi Muhammed\'e ve ailesine de salat et.' }},
  { name:{ az:'Qunut duası', en:'Qunut Dua', ru:'Дуа Кунут', ar:'دعاء القنوت', tr:'Kunut duası' }, ar:'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ وَعَافِنِي فِيمَنْ عَافَيْتَ وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ', trans:{ az:'Allahım, hidayət etdiklərinlə birlikdə mənə də hidayət et, afiyət verdiklərinlə birlikdə mənə də afiyət ver.', en:'O Allah, guide me among those You have guided, grant me wellness among those You have granted wellness.', ru:'О Аллах, наставь меня среди тех, кого Ты наставил, и дай мне благополучие среди тех, кому Ты его дал.', ar:'اللهم اهدني فيمن هديت وعافني فيمن عافيت وتولني فيمن توليت', tr:'Allah\'ım, hidayet ettiklerin arasında bana da hidayet et, afiyet verdiklerin arasında bana da afiyet ver.' }},
]

const SUNNAH_LABELS = { az:'Sünnə Namazları', en:'Sunnah Prayers', ru:'Сунна-намазы', ar:'صلوات السنة', tr:'Sünnet Namazları' }
const DUA_LABELS = { az:'Namaz Duaları', en:'Prayer Duas', ru:'Молитвенные дуа', ar:'أدعية الصلاة', tr:'Namaz Duaları' }

export default function PrayerPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.prayer || T.az.prayer
  const [selIdx, setSelIdx] = useState(0)
  const { times, loading, error, hijri } = usePrayer(CITIES[selIdx].city, CITIES[selIdx].country)
  const { next, countdown } = useCountdown(times)
  const { toggle, isDone, todayDone, totalDone, totalPossible, pct, data } = usePrayerStats()
  const weeklyStats = useWeeklyStats(data)
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id) }, [])

  // ── Əzan bildirişi ──
  const [azanEnabled, setAzanEnabled] = useState(() => localStorage.getItem('azan_enabled') === '1')

  const toggleAzan = () => {
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
      const prayerNames = { Fajr: 'Sübh', Dhuhr: 'Zöhr', Asr: 'Əsr', Maghrib: 'Məğrib', Isha: 'İşa' }
      Object.entries(times).forEach(([key, time]) => {
        if (time && time.slice(0,5) === nowStr) {
          const lastNotif = localStorage.getItem('last_azan_notif')
          const notifKey = `${nowStr}-${key}`
          if (lastNotif !== notifKey) {
            localStorage.setItem('last_azan_notif', notifKey)
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(`🕌 ${prayerNames[key] || key}`, { body: `${time} — Namaz vaxtı gəldi!` })
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
  }, [azanEnabled, times])

  const PRAYER_KEYS = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha']
  const PRAYER_NAMES = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha]

  const STAT_NAMES = {
    Fajr:    { az:'Sübh',   ru:'Фаджр',  ar:'الفجر',   tr:'Sabah',  en:'Fajr'    },
    Dhuhr:   { az:'Zöhr',   ru:'Зухр',   ar:'الظهر',   tr:'Öğle',   en:'Dhuhr'   },
    Asr:     { az:'Əsr',    ru:'Аср',    ar:'العصر',   tr:'İkindi', en:'Asr'     },
    Maghrib: { az:'Məğrib', ru:'Магриб', ar:'المغرب',  tr:'Akşam',  en:'Maghrib' },
    Isha:    { az:'İşa',    ru:'Иша',    ar:'العشاء',  tr:'Yatsı',  en:'Isha'    },
  }
  const lk = ['az','ru','ar','tr'].includes(lang) ? lang : 'en'
  const sl = STATS_LABELS[lk]

  const timeStr = now.toLocaleTimeString(lang==='ar'?'ar-SA':lang==='ru'?'ru-RU':lang==='tr'?'tr-TR':'az-AZ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const dateStr = now.toLocaleDateString(lang==='ar'?'ar-SA':lang==='ru'?'ru-RU':lang==='tr'?'tr-TR':'az-AZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

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
      <div className="page-hero">
        <div className="page-hero-arabic">أَوْقَاتُ الصَّلاة</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner prayer-layout">

          <div className="prayer-left">
            <div className="prayer-city-label">{t.selectCity}</div>
            <div className="city-grid">
              {CITIES.map((c,i) => (
                <button key={i} className={`city-btn ${selIdx===i?'active':''}`} onClick={() => setSelIdx(i)}>
                  {c.label}
                </button>
              ))}
            </div>

            <button className={`azan-toggle ${azanEnabled ? 'active' : ''}`} onClick={toggleAzan}>
              {azanEnabled ? '🔔' : '🔕'} {azanEnabled ? (lang==='az'?'Əzan aktiv':lang==='ru'?'Азан включён':lang==='ar'?'الأذان مفعل':lang==='tr'?'Ezan aktif':'Azan active') : (lang==='az'?'Əzan bildirişi':lang==='ru'?'Уведомление азана':lang==='ar'?'إشعار الأذان':lang==='tr'?'Ezan bildirimi':'Azan notification')}
            </button>

            <div className="prayer-clock">
              <div className="clock-time">{timeStr}</div>
              <div className="clock-date">{dateStr}</div>
              {hijri && (
                <div className="clock-hijri">
                  {hijri.day} {hijri.month.en} {hijri.year} AH
                  <span className="clock-hijri-ar">{hijri.month.ar}</span>
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

            {/* ── Namaz Statistikası Kartı ── */}
            <div className="stat-card">
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
                <div className="stat-progress-fill" style={{ width: `${pct}%` }} />
              </div>

              {/* Bu günün namazları — toggle düymələri */}
              <div className="stat-today-label">
                {s('todayTitle')} — {todayDone.length}/5 {s('done')}
              </div>
              <div className="stat-today-hint">{s('tapHint')}</div>
              <div className="stat-prayers">
                {STAT_KEYS.map(p => {
                  const done = isDone(p, todayKey())
                  return (
                    <button
                      key={p}
                      className={`stat-prayer-btn ${done ? 'done' : ''}`}
                      onClick={() => toggle(p)}
                      title={STAT_NAMES[p][lk]}
                    >
                      <span className="stat-prayer-icon">{PRAYER_ICONS[p]}</span>
                      <span className="stat-prayer-name">{STAT_NAMES[p][lk]}</span>
                      <span className="stat-prayer-check">{done ? '✓' : ''}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="prayer-right">
            {loading && <div className="spinner-wrap"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>}
            {error && <div style={{color:'#dc2626',padding:16}}>{error}</div>}
            {times && !loading && (
              <div className="prayer-times-list">
                {PRAYER_KEYS.map((key,i) => {
                  const isNext = next?.name === key
                  return (
                    <div key={key} className={`prayer-time-card ${isNext?'is-next':''}`}>
                      <div className="pt-icon">{PRAYER_ICONS[key]}</div>
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
            {/* Sünnə Namazları */}
            <div className="sunnah-section">
              <h3 className="sunnah-title">{SUNNAH_LABELS[lk] || SUNNAH_LABELS.en}</h3>
              <div className="sunnah-list">
                {SUNNAH_PRAYERS.map((sp, i) => (
                  <div key={i} className="sunnah-item">
                    <div className="sunnah-icon">{sp.icon}</div>
                    <div className="sunnah-info">
                      <div className="sunnah-name">{sp.name[lk] || sp.name.en}</div>
                      <div className="sunnah-desc">{sp.desc[lk] || sp.desc.en}</div>
                    </div>
                    <div className="sunnah-rakat">{sp.rakat}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Namaz Duaları */}
            <div className="prayer-dua-section">
              <h3 className="prayer-dua-title">{DUA_LABELS[lk] || DUA_LABELS.en}</h3>
              {PRAYER_DUAS.map((d, i) => (
                <div key={i} className="prayer-dua-card">
                  <div className="prayer-dua-name">{d.name[lk] || d.name.en}</div>
                  <div className="prayer-dua-ar">{d.ar}</div>
                  <div className="prayer-dua-trans">{d.trans[lk] || d.trans.en}</div>
                </div>
              ))}
            </div>

            <div className="prayer-reminder">
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

      {/* ── Həftəlik Namaz Statistikası ── */}
      <div className="section">
        <div className="section-inner">
          <div className="prayer-stats-section">
            <h3 className="prayer-stats-title">{sl.weeklyTitle}</h3>
            <div className="prayer-week-grid">
              <div className="pw-header">
                <div className="pw-label"></div>
                {weeklyStats.map((d, i) => (
                  <div key={i} className="pw-day-label">{sl.days[d.day]}</div>
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
      </div>
    </>
  )
}