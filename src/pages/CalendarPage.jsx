import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import '../styles/CalendarPage.css'
import Breadcrumb from '../components/Breadcrumb'
import { showLocalNotification } from '../utils/notify'

// ── Gregorian → Hicri çevirmə (Kuwaiti alqoritmi) ──
// Yalnız ehtiyat üçündür: Umm al-Qura-dan 1–2 gün fərqlənə bilər.
// Əsas mənbə hijriOf() — brauzerin Intl Umm al-Qura təqvimi (/jamaat və
// /prayer səhifələri ilə eyni tarix).
function gregorianToHijri(gDate) {
  const gy = gDate.getFullYear()
  const gm = gDate.getMonth() + 1
  const gd = gDate.getDate()

  let jd = Math.floor((11 * gy + 3) / 30) + 354 * gy + 30 * gm
    - Math.floor((gm - 1) / 2) + gd + 1948440 - 385

  if (gm <= 2) {
    jd -= Math.floor((gy - 1) / 4) - Math.floor((gy - 1) / 100) + Math.floor((gy - 1) / 400)
  } else {
    jd -= Math.floor(gy / 4) - Math.floor(gy / 100) + Math.floor(gy / 400)
  }

  // Julian Day → Gregorian JD
  const a = Math.floor((14 - gm) / 12)
  const y = gy + 4800 - a
  const m = gm + 12 * a - 3
  const julianDay = gd + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  // Julian Day → Hicri
  const l = julianDay - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const hm = Math.floor((24 * l3) / 709)
  const hd = l3 - Math.floor((709 * hm) / 24)
  const hy = 30 * n + j - 30

  return { year: hy, month: hm, day: hd }
}

/** Tarixin hicri günü/ayı/ili — Intl Umm al-Qura; dəstəklənmirsə Kuwaiti alqoritmi. */
function hijriOf(date) {
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' })
    if (String(fmt.resolvedOptions().calendar || '').startsWith('islamic')) {
      const parts = fmt.formatToParts(date)
      const num = (type) => Number(parts.find(p => p.type === type)?.value)
      const day = num('day'), month = num('month'), year = num('year')
      if (month >= 1 && month <= 12 && day >= 1 && day <= 30 && year > 1300) return { year, month, day }
    }
  } catch { /* köhnə brauzer — aşağıdakı alqoritm */ }
  return gregorianToHijri(date)
}

// Hicri il şəkilçisi və hero alt başlığı (il cari tarixdən götürülür)
const HIJRI_SUFFIX = { az: 'H', en: 'AH', ru: 'г.х.', ar: 'هـ', tr: 'H' }
const HERO_SUBTITLE = {
  az: (y) => `Hicri ${y} — Müqəddəs günlər`,
  en: (y) => `Hijri ${y} — Sacred Days`,
  ru: (y) => `Хиджра ${y} — Священные дни`,
  ar: (y) => `هجري ${y} — الأيام المقدسة`,
  tr: (y) => `Hicri ${y} — Kutsal Günler`,
}

// Miladi tarix. Chrome-un yığcam ICU-sunda "az" lokalı yoxdur ("2026 M09 19"
// çıxır) — azərbaycanca əl ilə yazılır; ərəbcədə latın rəqəmləri
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const DATE_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

function formatGregorian(date, lang) {
  if (lang === 'az') return `${date.getDate()} ${AZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`
  const opts = { day: 'numeric', month: 'long', year: 'numeric' }
  try { return date.toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', opts) } catch { return date.toLocaleDateString('en-GB', opts) }
}

const HIJRI_MONTHS = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}

const EVENTS = [
  { month:0, day:1,  en:'Islamic New Year',                 az:'Hicri yeni il',                 ru:'Исламский Новый год',           ar:'رأس السنة الهجرية',        tr:'Hicri Yılbaşı',         icon:'🌙', type:'major' },
  { month:1, day:1,  en:'First of Safar',                    az:'Səfər ayının başlanğıcı',        ru:'Начало месяца Сафар',           ar:'غرة صفر',                  tr:'Safer ayı başlangıcı',  icon:'📅', type:'month' },
  { month:2, day:1,  en:'First of Rabi al-Awwal',           az:'Rəbiül-Əvvəl başlanğıcı',       ru:'Начало Раби аль-Авваль',        ar:'غرة ربيع الأول',           tr:'Rebiülevvel başlangıcı', icon:'📅', type:'month' },
  { month:5, day:1,  en:'First of Jumada al-Thani',         az:'Cəmadiyül-Axir başlanğıcı',     ru:'Начало Джумада ас-Сани',        ar:'غرة جمادى الآخرة',         tr:'Cemaziyelahir başlangıcı', icon:'📅', type:'month' },
  { month:6, day:1,  en:'First of Rajab',                    az:'Rəcəb ayının başlanğıcı',        ru:'Начало месяца Раджаб',          ar:'غرة رجب',                  tr:'Recep ayı başlangıcı',  icon:'🌙', type:'month' },
  { month:6, day:27, en:'Laylat al-Miraj',                   az:'Merac gecəsi',                   ru:'Лейлят аль-Мирадж',            ar:'ليلة الإسراء والمعراج',    tr:'Miraç Kandili',         icon:'✨', type:'night' },
  { month:7, day:1,  en:'First of Shaban',                   az:'Şaban ayının başlanğıcı',        ru:'Начало месяца Шабан',           ar:'غرة شعبان',                tr:'Şaban ayı başlangıcı',  icon:'🌙', type:'month' },
  { month:7, day:15, en:'Laylat al-Baraat',                  az:'Bərat gecəsi',                   ru:'Лейлят аль-Бараат',            ar:'ليلة البراءة',             tr:'Berat Kandili',         icon:'💫', type:'night' },
  { month:8, day:1,  en:'First Day of Ramadan',              az:'Ramazanın birinci günü',         ru:'Первый день Рамадана',          ar:'أول رمضان',                tr:'Ramazan Başlangıcı',    icon:'🌙', type:'major' },
  { month:8, day:15, en:'Mid-Ramadan',                       az:'Ramazanın ortası',               ru:'Середина Рамадана',             ar:'نصف رمضان',                tr:'Ramazan ortası',        icon:'📿', type:'minor' },
  { month:8, day:21, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:8, day:23, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:8, day:25, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:8, day:27, en:'Laylat al-Qadr (most likely)',      az:'Qədr Gecəsi (ən ehtimallı)',     ru:'Лейлят аль-Кадр (наиболее вероятно)', ar:'ليلة القدر (الأرجح)', tr:'Kadir Gecesi (en muhtemel)', icon:'💎', type:'night' },
  { month:8, day:29, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:9, day:1,  en:'Eid al-Fitr',                       az:'Ramazan bayramı',                ru:'Праздник Разговения',           ar:'عيد الفطر',                tr:'Ramazan Bayramı',       icon:'🎉', type:'major' },
  { month:9, day:2,  en:'Eid al-Fitr (Day 2)',               az:'Ramazan Bayramı (2-ci gün)',     ru:'Ид аль-Фитр (день 2)',         ar:'عيد الفطر (اليوم ٢)',      tr:'Ramazan Bayramı (2. gün)', icon:'🎉', type:'major' },
  { month:9, day:3,  en:'Eid al-Fitr (Day 3)',               az:'Ramazan Bayramı (3-cü gün)',     ru:'Ид аль-Фитр (день 3)',         ar:'عيد الفطر (اليوم ٣)',      tr:'Ramazan Bayramı (3. gün)', icon:'🎉', type:'major' },
  { month:9, day:6,  en:'Fasting 6 Days of Shawwal begins',  az:'Şəvval orucunun başlanğıcı',    ru:'Пост 6 дней Шавваля',          ar:'بدء صيام ست من شوال',      tr:'Şevval orucunun başlangıcı', icon:'📿', type:'sunnah' },
  { month:11,day:1,  en:'First of Dhu al-Hijjah',            az:'Zülhiccə ayının başlanğıcı',     ru:'Начало Зуль-Хиджа',            ar:'غرة ذو الحجة',             tr:'Zilhicce ayı başlangıcı', icon:'🕌', type:'month' },
  { month:11,day:8,  en:'Day of Tarwiyah',                   az:'Tərviyə günü',                   ru:'День Тарвия',                   ar:'يوم التروية',              tr:'Terviye Günü',          icon:'🕌', type:'hajj' },
  { month:11,day:9,  en:'Day of Arafah',                     az:'Ərəfə günü',                     ru:'День Арафа',                    ar:'يوم عرفة',                 tr:'Arefe Günü',            icon:'🕌', type:'major' },
  { month:11,day:10, en:'Eid al-Adha',                       az:'Qurban bayramı',                 ru:'Праздник Жертвоприношения',     ar:'عيد الأضحى',               tr:'Kurban Bayramı',        icon:'🐑', type:'major' },
  { month:11,day:11, en:'Days of Tashreeq (1)',              az:'Təşriq günləri (1)',              ru:'Дни Ташрика (1)',               ar:'أيام التشريق (١)',          tr:'Teşrik günleri (1)',     icon:'🐑', type:'hajj' },
  { month:11,day:12, en:'Days of Tashreeq (2)',              az:'Təşriq günləri (2)',              ru:'Дни Ташрика (2)',               ar:'أيام التشريق (٢)',          tr:'Teşrik günleri (2)',     icon:'🐑', type:'hajj' },
  { month:11,day:13, en:'Days of Tashreeq (3)',              az:'Təşriq günləri (3)',              ru:'Дни Ташрика (3)',               ar:'أيام التشريق (٣)',          tr:'Teşrik günleri (3)',     icon:'🐑', type:'hajj' },
]

// v2: hadisə ikonu növə görə — xətti ikon (Icon.jsx) və sakit ton
// (göy qurşağı kafelləri əvəzinə: əsas/gecə — qızılı, qalanları brend)
const TYPE_ICONS = { major:'star', month:'calendar', night:'moonStar', minor:'dhikr', sunnah:'dhikr', hajj:'hajjguide' }
const TYPE_ACCENT = { major:true, night:true }

// Ay şəbəkəsi: həftə günləri (bazar ertəsindən), 5 dil
const WEEKDAYS = {
  az: ['B.e','Ç.a','Çər','C.a','Cümə','Şən','Baz'],
  en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  ru: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  ar: ['إثن','ثلا','أرب','خمي','جمع','سبت','أحد'],
  tr: ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'],
}
const AZ_SHORT = ['yan','fev','mar','apr','may','iyn','iyl','avq','sen','okt','noy','dek']
/** Qısa miladi tarix ("28 okt") — ay şəbəkəsinin xanası üçün. */
function shortGregorian(date, lang) {
  if (lang === 'az') return `${date.getDate()} ${AZ_SHORT[date.getMonth()]}`
  try { return date.toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', { day: 'numeric', month: 'short' }) } catch { return `${date.getDate()}.${date.getMonth() + 1}` }
}

// Səhifənin əlavə mətnləri (5 dil)
const CAL_TXT = {
  az: { lead: 'Hicri ayların günləri miladi tarixlə yanaşı, bayramlar, mübarək gecələr və həcc günləri. Hadisəni seçib xatırladıcı qurun.', today: 'Bu gün', next: 'Növbəti hadisə', prev: 'Əvvəlki ay', nextMonth: 'Növbəti ay', dayEvents: 'Bu günün hadisələri', noDay: 'Bu gün üçün qeyd olunmuş hadisə yoxdur', all: 'Bütün hadisələr', approx: 'Hicri tarixlər Ümmül-Qura təqviminə görə hesablanır; yerli elan 1 gün fərqlənə bilər.' },
  en: { lead: 'The days of each Hijri month alongside Gregorian dates, with Eids, blessed nights and the days of Hajj. Pick an event to set a reminder.', today: 'Today', next: 'Next event', prev: 'Previous month', nextMonth: 'Next month', dayEvents: 'Events on this day', noDay: 'No events marked for this day', all: 'All events', approx: 'Hijri dates follow the Umm al-Qura calendar; local announcements may differ by a day.' },
  ru: { lead: 'Дни каждого месяца хиджры рядом с григорианскими датами, праздники, благословенные ночи и дни хаджа. Выберите событие, чтобы поставить напоминание.', today: 'Сегодня', next: 'Следующее событие', prev: 'Предыдущий месяц', nextMonth: 'Следующий месяц', dayEvents: 'События этого дня', noDay: 'На этот день событий нет', all: 'Все события', approx: 'Даты хиджры рассчитаны по календарю Умм аль-Кура; местные объявления могут отличаться на день.' },
  ar: { lead: 'أيام كل شهر هجري مع التاريخ الميلادي، والأعياد والليالي المباركة وأيام الحج. اختر حدثًا لضبط تذكير.', today: 'اليوم', next: 'الحدث التالي', prev: 'الشهر السابق', nextMonth: 'الشهر التالي', dayEvents: 'أحداث هذا اليوم', noDay: 'لا توجد أحداث مسجلة لهذا اليوم', all: 'جميع الأحداث', approx: 'التواريخ الهجرية وفق تقويم أم القرى، وقد يختلف الإعلان المحلي بيوم واحد.' },
  tr: { lead: 'Hicri ayların günleri miladi tarihle yan yana; bayramlar, mübarek geceler ve hac günleri. Bir olayı seçip hatırlatıcı kurun.', today: 'Bugün', next: 'Sonraki olay', prev: 'Önceki ay', nextMonth: 'Sonraki ay', dayEvents: 'Bu günün olayları', noDay: 'Bu gün için kayıtlı olay yok', all: 'Tüm olaylar', approx: 'Hicri tarihler Ümmü’l-Kura takvimine göre hesaplanır; yerel duyuru bir gün farklı olabilir.' },
}

/**
 * Cari hicri ilin hər ayının günləri → miladi tarix. Brauzerin hicri
 * təqvimi (hijriOf) bugündən ±400 gün aralığında yoxlanılır — tərs çevirmə
 * alqoritmi lazım deyil. Nəticə: [ay 0..11] → [{ day, date }].
 */
function buildHijriYear(hYear, base) {
  const months = Array.from({ length: 12 }, () => [])
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 400, 12)
  for (let i = 0; i <= 800; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12)
    const h = hijriOf(d)
    if (h.year === hYear && h.month >= 1 && h.month <= 12) months[h.month - 1].push({ day: h.day, date: d })
  }
  return months
}

// Növ filtri qrupunun ekran oxuyucu adı
const FILTER_LABEL = { az:'Hadisə növü', en:'Event type', ru:'Тип события', ar:'نوع الحدث', tr:'Olay türü' }

const NOTIFY_LABELS = {
  az: { remind:'Xatırlat', reminded:'Xatırladılacaq', today:'Bu gün!', upcoming:'Yaxınlaşır', removeReminder:'Ləğv et' },
  en: { remind:'Remind me', reminded:'Reminder set', today:'Today!', upcoming:'Upcoming', removeReminder:'Remove' },
  ru: { remind:'Напомнить', reminded:'Напоминание установлено', today:'Сегодня!', upcoming:'Скоро', removeReminder:'Удалить' },
  ar: { remind:'ذكرني', reminded:'تم التذكير', today:'اليوم!', upcoming:'قادم', removeReminder:'إلغاء' },
  tr: { remind:'Hatırlat', reminded:'Hatırlatma ayarlandı', today:'Bugün!', upcoming:'Yaklaşıyor', removeReminder:'Kaldır' },
}

export function CalendarPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.calendar || T.az.calendar
  // Bugünkü hicri tarix state-lərdən əvvəl hesablanır ki, seçilmiş ay
  // miladi ay nömrəsi ilə yox, cari HİCRİ ayla açılsın
  const today = new Date()
  const todayKey = today.toDateString()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hijri = useMemo(() => hijriOf(new Date()), [todayKey])
  const [selMonth, setSelMonth] = useState(() => hijri.month - 1)
  // Pozuq yaddaş ({}, "x", null element) əvvəl səhifəni ağ ekrana çevirirdi (reminders.some xətası)
  const [reminders, setReminders] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('calendar_reminders'))
      return Array.isArray(raw)
        ? raw.filter(r => r && typeof r === 'object' && typeof r.key === 'string' && Number.isInteger(r.month) && Number.isInteger(r.day))
        : []
    } catch { return [] }
  })
  const nl = NOTIFY_LABELS[lang] || NOTIFY_LABELS.en

  const toggleReminder = useCallback((e) => {
    const key = `${e.month}-${e.day}`
    setReminders(prev => {
      const exists = prev.some(r => r.key === key)
      let next
      if (exists) {
        next = prev.filter(r => r.key !== key)
      } else {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          try { Notification.requestPermission()?.catch?.(() => {}) } catch { /* köhnə brauzer */ }
        }
        next = [...prev, { key, month: e.month, day: e.day, name: e[lang] || e.en }]
      }
      try { localStorage.setItem('calendar_reminders', JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
      return next
    })
  }, [lang])

  const isReminded = useCallback((e) => {
    const key = `${e.month}-${e.day}`
    return reminders.some(r => r.key === key)
  }, [reminders])

  // Check for today's reminders and show notifications
  useEffect(() => {
    if (reminders.length === 0) return
    const hijriToday = hijriOf(new Date())
    reminders.forEach(r => {
      // month in EVENTS is 0-indexed, hijri.month is 1-indexed
      if (r.month === (hijriToday.month - 1) && r.day === hijriToday.day) {
        // icon URL olmalıdır (əvvəl emoji idi). Android-də `new Notification()` xəta atır və
        // effektdə tutulmamış xəta bütün tətbiqi söndürürdü — utils/notify.js təhlükəsizdir.
        showLocalNotification(String(r.name || ''), { body: nl.today, icon: '/android-chrome-192x192.png' })
      }
    })
  }, []) // only on mount

  // Telefonda aylar üfüqi zolaqdadır — seçilmiş ay görünmürsə zolağı ora
  // sürüşdür (yalnız zolağın özü; səhifə yerində qalır)
  const monthsRef = useRef(null)
  const monthsScrolled = useRef(false)
  useEffect(() => {
    const strip = monthsRef.current
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return
    const chip = strip.querySelector('.cal-month-btn.active')
    if (!chip) return
    const s = strip.getBoundingClientRect()
    const c = chip.getBoundingClientRect()
    // İlk açılışda animasiyasız, sonrakı seçimlərdə yumşaq sürüşmə
    let smooth = monthsScrolled.current
    monthsScrolled.current = true
    if (c.left >= s.left + 8 && c.right <= s.right - 8) return
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) smooth = false } catch { /* köhnə brauzer */ }
    const left = strip.scrollLeft + (c.left - s.left) - (s.width - c.width) / 2
    if (typeof strip.scrollTo === 'function') strip.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
    else strip.scrollLeft = left
  }, [selMonth])

  const onToggleReminder = (e) => { haptic(); toggleReminder(e) }

  const [typeFilter, setTypeFilter] = useState('all')
  const ct = CAL_TXT[lang] || CAL_TXT.en

  // ── Ay şəbəkəsi: seçilmiş hicri ayın günləri ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const yearDays = useMemo(() => buildHijriYear(hijri.year, new Date()), [hijri.year, todayKey])
  const monthDays = yearDays[selMonth] || []
  const isCurMonth = selMonth === hijri.month - 1
  // Seçilmiş gün: cari ayda — bu gün; başqa ayda — hadisəli ilk gün və ya 1
  const [selDay, setSelDay] = useState(() => hijri.day)
  const pickMonth = (i) => {
    const m = ((i % 12) + 12) % 12
    setSelMonth(m)
    const first = EVENTS.find(e => e.month === m)
    setSelDay(m === hijri.month - 1 ? hijri.day : (first ? first.day : 1))
  }
  // Ayın ilk gününün həftə günü (bazar ertəsi = 0) — şəbəkədə boş xanalar
  const lead = monthDays.length ? (monthDays[0].date.getDay() + 6) % 7 : 0
  const selDayInfo = monthDays.find(d => d.day === selDay) || null
  const dayEvents = EVENTS.filter(e => e.month === selMonth && e.day === selDay)
  const hijriMonthNames = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  const hijriStr = `${hijri.day} ${hijriMonthNames[hijri.month - 1]} ${hijri.year}`
  const yearSuffix = HIJRI_SUFFIX[lang] || HIJRI_SUFFIX.en
  // Hadisə tarixi: "1 Məhərrəm" (bütün dillərdə gün əvvəl — tarix kartı ilə eyni)
  const eventDate = (e) => `${e.day} ${hijriMonthNames[e.month]}`

  // Növbəti hadisəyə geri sayım
  const nextEvent = useMemo(() => {
    const hm = hijri.month - 1
    const hd = hijri.day
    for (const e of EVENTS) {
      if (e.month > hm || (e.month === hm && e.day > hd)) return e
    }
    return EVENTS[0] // növbəti il
  }, [hijri])

  const monthEvents = EVENTS.filter(e => e.month === selMonth && (typeFilter === 'all' || e.type === typeFilter))

  const TYPE_LABELS = {
    all:    { az:'Hamısı',     en:'All',        ru:'Все',       ar:'الكل',     tr:'Tümü' },
    major:  { az:'Əsas',       en:'Major',      ru:'Основные',  ar:'رئيسية',   tr:'Büyük' },
    night:  { az:'Gecələr',    en:'Nights',     ru:'Ночи',      ar:'ليالي',    tr:'Geceler' },
    sunnah: { az:'Sünnə',      en:'Sunnah',     ru:'Сунна',     ar:'سنة',      tr:'Sünnet' },
    hajj:   { az:'Həcc',       en:'Hajj',       ru:'Хадж',      ar:'حج',       tr:'Hac' },
  }
  const tl = lang && TYPE_LABELS.all[lang] ? lang : 'en'

  return (
    <>
      {/* v2: sakit kağız hero — iz, eyebrow (hicri il), bir h1, giriş */}
      <header className="ui-page-hero cal-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{(HERO_SUBTITLE[lang] || HERO_SUBTITLE.en)(hijri.year)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
          {lang !== 'ar' && <p className="cal-hero-ar ui-arabic" lang="ar" aria-hidden="true">التَّقۡوِيمُ ٱلۡإِسۡلَامِيّ</p>}
          <p className="ui-lead">{ct.lead}</p>
        </div>
      </header>

      <section className="ui-section cal-page">
        <div className="ui-container">
          {/* Current date card */}
          <div className="cal-top" data-reveal="stagger">
          <div className="cal-date-card ui-card">
            <div className="cal-date-item">
              <span className="cal-date-label">{t.hijriDate}</span>
              <span className="cal-date-val">{hijriStr}</span>
            </div>
            <div className="cal-date-divider" />
            <div className="cal-date-item">
              <span className="cal-date-label">{t.gregorianDate}</span>
              <span className="cal-date-val">{formatGregorian(today, lang)}</span>
            </div>
          </div>

          {/* Növbəti hadisə */}
          {nextEvent && (
            <div className="cal-next-event">
              <span className="cal-next-icon ui-icon-tile ui-icon-tile--lg" aria-hidden="true"><Icon name={TYPE_ICONS[nextEvent.type] || 'calendar'} /></span>
              <div className="cal-next-info">
                <div className="cal-next-label">{ct.next}</div>
                <div className="cal-next-name">{nextEvent[lang] || nextEvent.en}</div>
                <div className="cal-next-date">{eventDate(nextEvent)}</div>
              </div>
              {/* Təqvimdə həmin ayı və günü aç */}
              <button type="button" className="ui-icon-btn cal-next-go"
                aria-label={`${ct.next}: ${eventDate(nextEvent)}`}
                onClick={() => { pickMonth(nextEvent.month); setSelDay(nextEvent.day) }}>
                <Icon name="arrow" className="ui-flip-rtl" />
              </button>
            </div>
          )}
          </div>

          {/* Növ filtri — telefonda bir sətirlik sürüşən çiplər (.chip-scroll) */}
          {/* Aylar: masaüstündə 6 × 2 şəbəkə, telefonda üfüqi zolaq */}
          <div className="cal-months chip-scroll wrap-desktop" ref={monthsRef} data-reveal="stagger-fade">
            {hijriMonthNames.map((m, i) => {
              const hasEvent = EVENTS.some(e => e.month === i)
              const isCurrent = i === hijri.month - 1
              return (
                <button key={i} type="button"
                  className={`cal-month-btn ${selMonth===i?'active':''} ${isCurrent?'current':''}`}
                  onClick={() => pickMonth(i)}
                  aria-pressed={selMonth === i}
                  aria-current={isCurrent ? 'date' : undefined}
                  title={m}>
                  {m}
                  {hasEvent && <span className="cal-event-dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>

          <div className="cal-main ui-card" data-reveal>
            <div className="cal-selected-month">
              <button type="button" className="ui-icon-btn cal-nav-btn" onClick={() => pickMonth(selMonth - 1)} aria-label={ct.prev}>
                <Icon name="chevronLeft" className="ui-flip-rtl" />
              </button>
              <div className="cal-selected-title">
                <h2 key={selMonth} className="cal-month-name">{hijriMonthNames[selMonth]}</h2>
                <span className="cal-month-num ui-num">{selMonth + 1} / 12 · {hijri.year} {yearSuffix}</span>
              </div>
              <button type="button" className="ui-icon-btn cal-nav-btn" onClick={() => pickMonth(selMonth + 1)} aria-label={ct.nextMonth}>
                <Icon name="chevron" className="ui-flip-rtl" />
              </button>
            </div>

            {/* Ayın günləri: iri hicri gün + kiçik miladi tarix; hadisəli gün —
                qızılı nöqtə, bu gün — halqa, seçilmiş — dolğu (key: ay dəyişəndə
                şəbəkə yenidən görünür) */}
            {monthDays.length > 0 && (
              <div className="cal-grid-wrap">
                <div className="cal-weekdays" aria-hidden="true">
                  {(WEEKDAYS[lang] || WEEKDAYS.en).map((w, i) => <span key={i} className={i === 4 ? 'is-fri' : ''}>{w}</span>)}
                </div>
                <div className="cal-grid" key={selMonth} role="group" aria-label={`${hijriMonthNames[selMonth]} ${hijri.year}`}>
                  {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} className="cal-day is-blank" aria-hidden="true" />)}
                  {monthDays.map(({ day, date }) => {
                    const evs = EVENTS.filter(e => e.month === selMonth && e.day === day)
                    const isToday = isCurMonth && day === hijri.day
                    const sel = day === selDay
                    return (
                      <button key={day} type="button"
                        className={`cal-day${isToday ? ' is-today' : ''}${sel ? ' is-selected' : ''}${evs.length ? ' has-event' : ''}${evs.some(e => TYPE_ACCENT[e.type]) ? ' is-major' : ''}`}
                        aria-pressed={sel}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => { haptic(); setSelDay(day) }}>
                        {/* Ad məzmundan qurulur: görünən rəqəmlər adın içində qalır (WCAG 2.5.3),
                            ay adı, il və hadisələr yalnız ekran oxuyucusu üçündür */}
                        <span className="cal-day-h ui-num">{day}</span>
                        <span className="ui-sr-only"> {hijriMonthNames[selMonth]} — </span>
                        <span className="cal-day-g">{shortGregorian(date, lang)}</span>
                        <span className="ui-sr-only"> {date.getFullYear()}{evs.length ? ` — ${evs.map(e => e[lang] || e.en).join(', ')}` : ''}</span>
                        {evs.length > 0 && <span className="cal-day-dot" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Seçilmiş gün */}
            {selDayInfo && (
              <div className="cal-day-panel" key={`${selMonth}-${selDay}`}>
                <div className="cal-day-panel-date">
                  <span className="cal-day-panel-h">{selDay} {hijriMonthNames[selMonth]} {hijri.year}</span>
                  <span className="cal-day-panel-g">{formatGregorian(selDayInfo.date, lang)}</span>
                  {isCurMonth && selDay === hijri.day && <span className="ui-badge ui-badge--brand">{ct.today}</span>}
                </div>
                {dayEvents.length === 0 && <p className="cal-day-panel-empty">{ct.noDay}</p>}
              </div>
            )}

            {/* Növ filtri — ayın hadisələrini süzür; telefonda sürüşən çiplər */}
            <div className="cal-type-filter chip-scroll wrap-desktop" role="group" aria-label={FILTER_LABEL[lang] || FILTER_LABEL.en}>
              {Object.keys(TYPE_LABELS).map(k => (
                <button key={k} type="button" className="ui-chip"
                  aria-pressed={typeFilter === k} onClick={() => setTypeFilter(k)}>
                  {TYPE_LABELS[k][tl]}
                </button>
              ))}
            </div>

            {/* key: ay dəyişəndə hadisələr yenidən yumşaq görünür */}
            {monthEvents.length > 0 ? (
              <div className="cal-events" key={`${selMonth}-${typeFilter}`}>
                <div className="cal-events-label">{t.events}</div>
                {monthEvents.map((e, i) => {
                  const reminded = isReminded(e)
                  return (
                    <div key={i} className={`cal-event-card${e.day === selDay ? ' is-selected' : ''}`} data-type={e.type}>
                      <span className={`cal-event-icon ui-icon-tile ui-icon-tile--sm${TYPE_ACCENT[e.type] ? ' ui-icon-tile--accent' : ''}`} aria-hidden="true"><Icon name={TYPE_ICONS[e.type] || 'calendar'} /></span>
                      <div className="cal-event-body">
                        <div className="cal-event-name">{e[lang] || e.en}</div>
                        <div className="cal-event-date">{eventDate(e)}</div>
                      </div>
                      <button type="button" className={`cal-remind-btn ${reminded ? 'active' : ''}`} onClick={() => onToggleReminder(e)}
                        aria-pressed={reminded} aria-label={`${reminded ? nl.reminded : nl.remind}: ${e[lang] || e.en}`}>
                        <Icon name={reminded ? 'bell' : 'bellOff'} size={16} />
                        <span>{reminded ? nl.reminded : nl.remind}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="cal-no-events" key={`${selMonth}-${typeFilter}`}>
                {/* Telefonda boş vəziyyət ikonu (masaüstündə gizli) */}
                <span className="cal-no-events-ico ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral" aria-hidden="true"><Icon name="calendar" /></span>
                <span>{t.noEvents}</span>
              </div>
            )}
          </div>

          {/* All events list */}
          <div className="cal-all-events">
            <div className="ui-section-head cal-all-head" data-reveal>
              <span className="ui-eyebrow">{hijri.year} {yearSuffix}</span>
              <h2 className="ui-title">{ct.all}</h2>
              <p className="cal-approx">{ct.approx}</p>
            </div>
            {/* Hadisələr — sakit kartlar; keçmiş hadisələr solğun */}
            <div className="cal-timeline" data-reveal="stagger">
              {EVENTS.map((e, i) => {
                const reminded = isReminded(e)
                return (
                  <div key={i} className={`cal-timeline-item${e.month < hijri.month - 1 || (e.month === hijri.month - 1 && e.day < hijri.day) ? ' is-past' : ''}`}>
                    <button type="button" className="cal-tl-main" onClick={() => { pickMonth(e.month); setSelDay(e.day); monthsRef.current?.scrollIntoView?.({ block: 'nearest' }) }}>
                    <span className={`cal-tl-icon ui-icon-tile ui-icon-tile--sm${TYPE_ACCENT[e.type] ? ' ui-icon-tile--accent' : ''}`} aria-hidden="true"><Icon name={TYPE_ICONS[e.type] || 'calendar'} /></span>
                    <div className="cal-tl-body">
                      <div className="cal-tl-name">{e[lang] || e.en}</div>
                      <div className="cal-tl-date">{eventDate(e)} {hijri.year}</div>
                    </div>
                    </button>
                    <button type="button" className={`cal-remind-btn ${reminded ? 'active' : ''}`} onClick={() => onToggleReminder(e)}
                      aria-pressed={reminded} aria-label={`${reminded ? nl.reminded : nl.remind}: ${e[lang] || e.en}`}>
                      <Icon name={reminded ? 'bell' : 'bellOff'} size={16} />
                      <span>{reminded ? nl.reminded : nl.remind}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
