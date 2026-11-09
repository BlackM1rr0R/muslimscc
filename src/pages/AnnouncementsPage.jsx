// ═══════════════════════════════════════════════════════
// Elanlar (/announcements)
//
// Məlumat yalnız admin paneldən gəlir (Firestore, canlı):
//   • announcements — elanlar (title[lang], message[lang], type, link, active, createdAt)
//   • events        — hicri təqvim günləri (name[lang], desc[lang], month, day, type)
// Heç bir elan və ya tədbir uydurulmur: məlumat yoxdursa sakit boş vəziyyət
// göstərilir. Firebase qoşulmayıbsa da eyni boş vəziyyət — xəta yoxdur.
//
// Ən yuxarıda sabit "Xeyriyyə və ianə" kartı durur: /donate bələdçisinə
// qısa dəvət. Məbləğ, layihə və ya rekvizit yoxdur (Muslims.cc ianə qəbul etmir).
//
// DİL QAYDASI: admin mətni cari dildə yazılmayıbsa həmin elan/gün bu dildə
// GÖSTƏRİLMİR — başqa dilin mətni səhifəyə "sızmır" (bax: pickLang).
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import {
  subscribeToAnnouncements,
  subscribeToEvents,
  ANNOUNCEMENT_TYPES,
  EVENT_TYPES,
} from '../data/adminContent'
import '../styles/AnnouncementsPage.css'
import { AnimatedList, AnimatedItem } from '../motion/AnimatedList'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import PageLink from '../components/PageLink'
import { pickUi } from '../utils/uiText'

const LABELS = {
  az: {
    eyebrow: 'Platforma xəbərləri',
    title: 'Elanlar',
    subtitle: 'Muslims.cc-dən son xəbərlər və elanlar',
    latest: 'Son elanlar',
    all: 'Hamısı',
    filterLabel: 'Elan növünə görə süz',
    loading: 'Yüklənir…',
    empty: 'Hazırda aktiv elan yoxdur',
    emptySub: 'Yeni elanlar burada görünəcək.',
    enableNotif: 'Bildirişləri aktivləşdir',
    seeTimes: 'Namaz vaxtlarına bax',
    readMore: 'Ətraflı',
    isNew: 'Yeni',
    eventsEyebrow: 'Hicri təqvim',
    eventsTitle: 'Qarşıdakı İslami günlər',
    eventsNote: 'Tarixlər hesablanmış hicri təqvimə əsaslanır; ayın görünməsinə görə bir gün fərq ola bilər.',
    next: 'Növbəti',
    today: 'Bu gün',
    fullCalendar: 'Tam təqvim',
    showMore: 'Daha çox göstər',
    showLess: 'Daha az göstər',
    helpEyebrow: 'Sabitlənmiş',
    helpTitle: 'Xeyriyyə və ianə',
    helpText: 'Sədəqənin fəziləti və etibarlı xeyriyyəyə necə vermək barədə qısa bələdçi.',
    helpDonate: 'Bələdçini oxu',
  },
  en: {
    eyebrow: 'Site news',
    title: 'Announcements',
    subtitle: 'Latest news and announcements from Muslims.cc',
    latest: 'Latest announcements',
    all: 'All',
    filterLabel: 'Filter by announcement type',
    loading: 'Loading…',
    empty: 'There are no active announcements right now',
    emptySub: 'New announcements will appear here.',
    enableNotif: 'Turn on notifications',
    seeTimes: 'See prayer times',
    readMore: 'Read more',
    isNew: 'New',
    eventsEyebrow: 'Hijri calendar',
    eventsTitle: 'Upcoming Islamic dates',
    eventsNote: 'Dates follow the calculated Hijri calendar and may differ by a day depending on the moon sighting.',
    next: 'Next',
    today: 'Today',
    fullCalendar: 'Full calendar',
    showMore: 'Show more',
    showLess: 'Show less',
    helpEyebrow: 'Pinned',
    helpTitle: 'Charity & Giving',
    helpText: 'A short guide to the virtue of charity and how to give to a trustworthy cause.',
    helpDonate: 'Read the guide',
  },
  ru: {
    eyebrow: 'Новости платформы',
    title: 'Объявления',
    subtitle: 'Последние новости и объявления Muslims.cc',
    latest: 'Последние объявления',
    all: 'Все',
    filterLabel: 'Фильтр по типу объявления',
    loading: 'Загрузка…',
    empty: 'Сейчас нет активных объявлений',
    emptySub: 'Новые объявления появятся здесь.',
    enableNotif: 'Включить уведомления',
    seeTimes: 'Время намаза',
    readMore: 'Подробнее',
    isNew: 'Новое',
    eventsEyebrow: 'Календарь хиджры',
    eventsTitle: 'Ближайшие исламские даты',
    eventsNote: 'Даты рассчитаны по календарю хиджры и могут отличаться на один день в зависимости от наблюдения луны.',
    next: 'Следующее',
    today: 'Сегодня',
    fullCalendar: 'Весь календарь',
    showMore: 'Показать ещё',
    showLess: 'Свернуть',
    helpEyebrow: 'Закреплено',
    helpTitle: 'Благотворительность',
    helpText: 'Краткое руководство о достоинстве садаки и о том, как жертвовать надёжным организациям.',
    helpDonate: 'Читать руководство',
  },
  ar: {
    eyebrow: 'أخبار المنصة',
    title: 'الإعلانات',
    subtitle: 'آخر الأخبار والإعلانات من Muslims.cc',
    latest: 'أحدث الإعلانات',
    all: 'الكل',
    filterLabel: 'التصفية حسب نوع الإعلان',
    loading: 'جارٍ التحميل…',
    empty: 'لا توجد إعلانات حالياً',
    emptySub: 'ستظهر الإعلانات الجديدة هنا.',
    enableNotif: 'تفعيل الإشعارات',
    seeTimes: 'مواقيت الصلاة',
    readMore: 'المزيد',
    isNew: 'جديد',
    eventsEyebrow: 'التقويم الهجري',
    eventsTitle: 'المناسبات الإسلامية القادمة',
    eventsNote: 'التواريخ محسوبة وفق التقويم الهجري وقد تختلف بيوم واحد بحسب رؤية الهلال.',
    next: 'القادم',
    today: 'اليوم',
    fullCalendar: 'التقويم الكامل',
    showMore: 'عرض المزيد',
    showLess: 'عرض أقل',
    helpEyebrow: 'مثبّت',
    helpTitle: 'الصدقة والتبرع',
    helpText: 'دليل موجز عن فضل الصدقة وكيفية التبرع لجهة موثوقة.',
    helpDonate: 'اقرأ الدليل',
  },
  tr: {
    eyebrow: 'Platform haberleri',
    title: 'Duyurular',
    subtitle: 'Muslims.cc’den son haberler ve duyurular',
    latest: 'Son duyurular',
    all: 'Tümü',
    filterLabel: 'Duyuru türüne göre filtrele',
    loading: 'Yükleniyor…',
    empty: 'Şu anda aktif duyuru yok',
    emptySub: 'Yeni duyurular burada görünecek.',
    enableNotif: 'Bildirimleri aç',
    seeTimes: 'Namaz vakitleri',
    readMore: 'Devamı',
    isNew: 'Yeni',
    eventsEyebrow: 'Hicri takvim',
    eventsTitle: 'Yaklaşan İslami günler',
    eventsNote: 'Tarihler hesaplanmış hicri takvime göredir; hilalin görülmesine göre bir gün fark olabilir.',
    next: 'Sıradaki',
    today: 'Bugün',
    fullCalendar: 'Tüm takvim',
    showMore: 'Daha fazla göster',
    showLess: 'Daha az göster',
    helpEyebrow: 'Sabitlenmiş',
    helpTitle: 'Hayır ve Bağış',
    helpText: 'Sadakanın fazileti ve güvenilir bir hayır kurumuna nasıl bağış yapılacağı hakkında kısa bir rehber.',
    helpDonate: 'Rehberi oku',
  },
}

// v3: hero izahı, açar rəqəmlərin adları, "xəbərdar qalmaq" kafelləri
const V3 = {
  az: { how: 'Sayt rəhbərliyinin elanları və İslami günlər burada görünür. Yeni elanı qaçırmamaq üçün bildirişləri açın.', active: 'aktiv elan', dates: 'qeyd edilmiş gün', stayEyebrow: 'Xəbərdar qalın', stayTitle: 'Heç nəyi qaçırmayın', notifText: 'Yeni elan gələndə xəbər alın', calText: 'Hicri ay, oruc və bayram günləri', prayerText: 'Şəhəriniz üçün bugünkü vaxtlar' },
  en: { how: 'Announcements from the site team and Islamic dates appear here. Turn on notifications so you don’t miss a new one.', active: 'active announcements', dates: 'marked dates', stayEyebrow: 'Stay informed', stayTitle: 'Don’t miss anything', notifText: 'Get notified when a new announcement is posted', calText: 'Hijri months, fasts and Eid days', prayerText: 'Today’s times for your city' },
  ru: { how: 'Здесь появляются объявления команды сайта и исламские даты. Включите уведомления, чтобы не пропустить новое.', active: 'активных объявлений', dates: 'отмеченных дат', stayEyebrow: 'Будьте в курсе', stayTitle: 'Ничего не пропустите', notifText: 'Получайте уведомление о новом объявлении', calText: 'Месяцы хиджры, посты и праздники', prayerText: 'Время на сегодня для вашего города' },
  ar: { how: 'تظهر هنا إعلانات فريق الموقع والمناسبات الإسلامية، ففعّل الإشعارات حتى لا يفوتك جديد.', active: 'إعلانات فعّالة', dates: 'مناسبات مسجّلة', stayEyebrow: 'ابقَ على اطلاع', stayTitle: 'لا يفوتك شيء', notifText: 'تنبيه عند نشر إعلان جديد', calText: 'الأشهر الهجرية والصيام والأعياد', prayerText: 'مواقيت اليوم لمدينتك' },
  tr: { how: 'Site ekibinin duyuruları ve İslami günler burada görünür. Yeni bir duyuruyu kaçırmamak için bildirimleri açın.', active: 'aktif duyuru', dates: 'işaretli gün', stayEyebrow: 'Haberdar olun', stayTitle: 'Hiçbir şeyi kaçırmayın', notifText: 'Yeni duyuru gelince haberdar olun', calText: 'Hicri aylar, oruç ve bayram günleri', prayerText: 'Şehriniz için bugünün vakitleri' },
}

// Hicri ay adları — CalendarPage ilə eyni yazılış
const HIJRI_MONTH_NAMES = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}

// az tarixi AZ_MONTHS ilə əl ilə yazılır (bəzi brauzerlərdə az lokalı natamamdır)
const DATE_LOCALES = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }

// Bəzi brauzerlərdə az locale məlumatı yoxdur ("2026 M09 19" çıxır) — ay adları əl ilə
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000   // 3 gündən təzə elan "Yeni" nişanı alır
const LOAD_TIMEOUT_MS = 8000                      // şəbəkə cavab vermirsə skeleton sonsuz qalmasın
const EVENTS_PREVIEW = 6

// ── Köməkçilər ──────────────────────────────────────

/** createdAt → millisaniyə. Firestore Timestamp, {seconds} (backup JSON) və ISO sətri qəbul edir. */
function toMillis(ts) {
  if (!ts) return null
  try {
    if (typeof ts.toMillis === 'function') return ts.toMillis()
    if (typeof ts.toDate === 'function') return ts.toDate().getTime()
    if (typeof ts.seconds === 'number') return ts.seconds * 1000
    const t = new Date(ts).getTime()
    return Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

/**
 * Ən yeni birinci. serverTimestamp hələ yazılmayıbsa (_ms null) elan indicə
 * əlavə olunub — ən yuxarıda saxla. Heç vaxt NaN qaytarmır.
 */
function byNewest(x, y) {
  if (x._ms == null && y._ms == null) return 0
  if (x._ms == null) return -1
  if (y._ms == null) return 1
  return y._ms - x._ms
}

function formatDate(ms, lang) {
  if (ms == null) return ''
  const d = new Date(ms)
  if (lang === 'az') return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  try {
    return d.toLocaleDateString(DATE_LOCALES[lang] || undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return d.toLocaleDateString()
  }
}

/** Yalnız təhlükəsiz linklər: http(s), sayt daxili yol və ya protokolsuz domen. */
function safeHref(link) {
  if (typeof link !== 'string') return ''
  const s = link.trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('/') && !s.startsWith('//')) return s
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) return 'https://' + s
  return ''
}

/**
 * Bugünkü hicri ay və gün (Umm al-Qura, brauzerin Intl-i ilə).
 * Brauzer bu təqvimi dəstəkləmirsə null — onda hadisələr sadəcə ay/gün sırası ilə düzülür.
 */
function hijriToday() {
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric' })
    if (!String(fmt.resolvedOptions().calendar || '').startsWith('islamic')) return null
    const parts = fmt.formatToParts(new Date())
    const month = Number(parts.find(p => p.type === 'month')?.value)
    const day = Number(parts.find(p => p.type === 'day')?.value)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 30) return { month, day }
  } catch { /* köhnə brauzer */ }
  return null
}

/**
 * Admin mətnindən YALNIZ cari dili götür (tr()-dən fərqli olaraq başqa dilə
 * düşmür). Köhnə elanlarda sahə sadə sətir ola bilər — o, olduğu kimi qalır.
 */
function pickLang(v, lang) {
  if (typeof v === 'string') return v.trim()
  const x = v && typeof v === 'object' ? v[lang] : ''
  return typeof x === 'string' ? x.trim() : ''
}

// Elan və hadisə növlərinin semantik tonu + xətti ikonu (data-dakı hex rənglər
// və emojilər əvəzinə — DESIGN.md: göy qurşağı yox, vəziyyət rəngləri tokenlərdən)
const ANN_TONE = {
  info:     { tone: 'note',  icon: 'info' },
  urgent:   { tone: 'bad',   icon: 'alert' },
  event:    { tone: 'brand', icon: 'calendar' },
  success:  { tone: 'ok',    icon: 'sparkle' },
  reminder: { tone: 'warn',  icon: 'bell' },
}
const EVENT_ICON = { major: 'star', sunnah: 'dhikr', night: 'moonStar', hajj: 'hajjguide', fast: 'sunrise' }

/** Bildiriş funksiyası brauzerdə varmı və icazə hələ soruşulmayıbmı? */
function canOfferNotifications() {
  try {
    return typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default'
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════

export default function AnnouncementsPage({ setPage }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang, 'en')

  const [rawAnnouncements, setRawAnnouncements] = useState([])
  const [rawEvents, setRawEvents] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState('all')
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [offerNotif] = useState(canOfferNotifications)

  // ── Canlı abunələr (çıxanda ləğv olunur) ──
  useEffect(() => {
    let alive = true
    const timer = setTimeout(() => { if (alive) setLoaded(true) }, LOAD_TIMEOUT_MS)

    const unsubA = subscribeToAnnouncements((items) => {
      if (!alive) return
      setRawAnnouncements(Array.isArray(items) ? items : [])
      setLoaded(true)
    })
    const unsubE = subscribeToEvents((items) => {
      if (!alive) return
      setRawEvents(Array.isArray(items) ? items : [])
    })

    return () => {
      alive = false
      clearTimeout(timer)
      try { unsubA?.() } catch { /* */ }
      try { unsubE?.() } catch { /* */ }
    }
  }, [])

  // ── Aktiv elanlar, ən yenisi birinci ──
  const announcements = useMemo(() => {
    return rawAnnouncements
      .filter(a => a && a.active !== false)
      .map(a => ({
        ...a,
        _title: pickLang(a.title, lang),
        _message: pickLang(a.message, lang),
        _ms: toMillis(a.createdAt),
        _href: safeHref(a.link),
        _type: ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0],
      }))
      .filter(a => a._title || a._message)
      .sort(byNewest)
  }, [rawAnnouncements, lang])

  // ── Süzgəc çipləri: yalnız həqiqətən rast gəlinən növlər ──
  const typeCounts = useMemo(() => {
    const counts = {}
    for (const a of announcements) counts[a._type.key] = (counts[a._type.key] || 0) + 1
    return ANNOUNCEMENT_TYPES.filter(t => counts[t.key]).map(t => ({ ...t, count: counts[t.key] }))
  }, [announcements])

  // Seçilmiş növ artıq yoxdursa (elan silinib) — "Hamısı"na qayıt
  useEffect(() => {
    if (filter !== 'all' && !typeCounts.some(t => t.key === filter)) setFilter('all')
  }, [filter, typeCounts])

  const visible = filter === 'all' ? announcements : announcements.filter(a => a._type.key === filter)

  // ── Hicri günlər: bu gündən başlayaraq ilboyu sıra ──
  // Səhifə gecə yarısından sonra da açıq qalırsa "bu gün" yenilənsin
  const [dayTick, setDayTick] = useState(0)
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5)
    const t = setTimeout(() => setDayTick(n => n + 1), midnight - now)
    return () => clearTimeout(t)
  }, [dayTick])
  // dayTick — gecə yarısı tətiyi: hijriToday() parametrsizdir, yenidən hesablanma qəsdəndir
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => hijriToday(), [dayTick])
  const events = useMemo(() => {
    const list = rawEvents
      .filter(ev => ev && Number(ev.month) >= 1 && Number(ev.month) <= 12 && Number(ev.day) >= 1 && Number(ev.day) <= 30)
      .map(ev => {
        const month = Number(ev.month)
        const day = Number(ev.day)
        let order = (month - 1) * 30 + (day - 1)
        if (today) {
          order -= (today.month - 1) * 30 + (today.day - 1)
          if (order < 0) order += 360
        }
        return {
          ...ev,
          _month: month,
          _day: day,
          _order: order,
          _name: pickLang(ev.name, lang),
          _desc: pickLang(ev.desc, lang),
          _type: EVENT_TYPES.find(t => t.key === ev.type) || EVENT_TYPES[0],
        }
      })
      .filter(ev => ev._name)
    return list.sort((a, b) => a._order - b._order)
  }, [rawEvents, lang, today])

  const shownEvents = showAllEvents ? events : events.slice(0, EVENTS_PREVIEW)
  const monthNames = pickUi(HIJRI_MONTH_NAMES, lang, 'en')
  const now = Date.now()

  const openNotifications = () => {
    window.dispatchEvent(new CustomEvent('open-notifications'))
  }

  return (
    <div className="anp-page">
      {/* ── Hero ── */}
      <header className="ui-page-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container anp-container">
          <div className="ui-page-hero__crumbs"><Breadcrumb setPage={setPage} current={l.title} /></div>
          {/* Digər səhifələrlə eyni ardıcıllıq: eyebrow → h1 → ərəbcə bəzək.
              Əvvəl ərəbcə sətir h1-in ÜSTÜNDƏ idi və eyebrow yox idi.
              Ərəbcə bəzək ar dilində h1 ilə təkrar olmasın deyə gizlədilir */}
          <span className="ui-eyebrow">{l.eyebrow}</span>
          <h1 className="ui-display">{l.title}</h1>
          <p className="ui-lead">{l.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> <span>{(pickUi(V3, lang, 'en')).how}</span></p>
          {loaded && (announcements.length > 0 || events.length > 0) && (
            <ul className="ui-page-hero__stats">
              <li><b data-count={announcements.length}>{announcements.length}</b><span>{(pickUi(V3, lang, 'en')).active}</span></li>
              {events.length > 0 && <li><b data-count={events.length}>{events.length}</b><span>{(pickUi(V3, lang, 'en')).dates}</span></li>}
            </ul>
          )}
        </div>
      </header>

      <div className="anp-wrap ui-container anp-container">
        {/* ═══ SABİT KART: XEYRİYYƏ VƏ İANƏ ═══ */}
        <section className="ui-card anp-help" data-reveal aria-labelledby="anp-help-title">
          <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent anp-help-icon" aria-hidden="true">
            <Icon name="charity" />
          </span>
          <div className="anp-help-body">
            <span className="ui-badge ui-badge--accent anp-help-pin">
              <Icon name="pin" size={13} /> {l.helpEyebrow}
            </span>
            <h2 id="anp-help-title" className="anp-help-title">{l.helpTitle}</h2>
            <p className="anp-help-text">{l.helpText}</p>
          </div>
          <PageLink className="ui-btn ui-btn--primary anp-help-btn" to="donate" setPage={setPage}>
            {l.helpDonate} <Icon name="arrow" size={18} className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
          </PageLink>
        </section>

        {/* ═══ ELANLAR ═══ */}
        <section className="anp-section" aria-labelledby="anp-latest-title">
          <div className="ui-section-head anp-section-head" data-reveal>
            <h2 id="anp-latest-title" className="ui-title">{l.latest}</h2>
          </div>

          {!loaded ? (
            <div className="anp-list" aria-busy="true" aria-label={l.loading}>
              {[0, 1].map(i => (
                <div key={i} className="ui-card anp-card anp-skeleton" aria-hidden="true">
                  <span className="skeleton anp-skel-line anp-skel-short" />
                  <span className="skeleton anp-skel-line anp-skel-title" />
                  <span className="skeleton anp-skel-line" />
                  <span className="skeleton anp-skel-line anp-skel-mid" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="ui-card anp-empty" data-reveal="scale">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral anp-empty-icon" aria-hidden="true"><Icon name="announcements" /></span>
              <div className="anp-empty-body">
                <p className="anp-empty-title">{l.empty}</p>
                <p className="anp-empty-sub">{l.emptySub}</p>
              </div>
            </div>
          ) : (
            <>
              {typeCounts.length > 1 && (
                /* Telefonda çiplər bir sətirdə barmaqla sürüşür (motion.css → .chip-scroll),
                   ≥768px-də əvvəlki kimi sarınır */
                <div className="anp-chips chip-scroll wrap-desktop" role="group" aria-label={l.filterLabel} data-reveal="fade">
                  <button
                    type="button"
                    className="ui-chip anp-chip"
                    aria-pressed={filter === 'all'}
                    onClick={() => setFilter('all')}
                  >
                    {l.all}
                    <span className="anp-chip-count">{announcements.length}</span>
                  </button>
                  {typeCounts.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      className="ui-chip anp-chip"
                      aria-pressed={filter === t.key}
                      onClick={() => setFilter(t.key)}
                    >
                      <Icon name={(ANN_TONE[t.key] || ANN_TONE.info).icon} size={15} />
                      {pickUi(t.label, lang, 'en')}
                      <span className="anp-chip-count">{t.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Kartlar sürüşəndə növbə ilə görünür; süzgəc dəyişəndə yeni kartlar da yumşaq girir */}
              {/* v6: Motion AnimatedList — süzgəc dəyişəndə qalan kartlar yerinə yayla sürüşür,
                  yenilər yumşaq gəlir, gedənlər qısa çıxır (21st.dev "animated list" ideyası) */}
              <AnimatedList as="div" className="anp-list anp-list--anim anp-list--motion">
                {visible.map(a => {
                  const isNew = a._ms != null && now - a._ms < NEW_WINDOW_MS && a._ms <= now + 60000
                  const tone = ANN_TONE[a._type.key] || ANN_TONE.info
                  return (
                    <AnimatedItem as="article" key={a.id} className={`ui-card anp-card anp-tone--${tone.tone}`}>
                      <div className="anp-card-top">
                        <span className="ui-badge anp-badge">
                          <Icon name={tone.icon} size={14} />
                          {pickUi(a._type.label, lang, 'en')}
                        </span>
                        {isNew && <span className="ui-badge ui-badge--solid anp-new">{l.isNew}</span>}
                        {a._ms != null && (
                          <time className="anp-date" dateTime={new Date(a._ms).toISOString()}>
                            {formatDate(a._ms, lang)}
                          </time>
                        )}
                      </div>

                      {/* dir="auto": köhnə (tək dilli) elan mətni RTL səhifədə də düzgün axsın */}
                      {a._title && <h3 className="anp-card-title" dir="auto">{a._title}</h3>}
                      {a._message && <p className="anp-card-message" dir="auto">{a._message}</p>}

                      {a._href && (
                        <a
                          className="ui-link anp-card-link"
                          href={a._href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {l.readMore} <Icon name="external" size={15} />
                        </a>
                      )}
                    </AnimatedItem>
                  )
                })}
              </AnimatedList>
            </>
          )}
        </section>

        {/* ═══ HİCRİ GÜNLƏR (yalnız admin əlavə edibsə) ═══ */}
        {events.length > 0 && (
          <section className="anp-section" aria-labelledby="anp-events-title">
            <div className="anp-section-head anp-section-head--row" data-reveal>
              <div className="anp-events-head">
                <span className="ui-eyebrow">{l.eventsEyebrow}</span>
                <h2 id="anp-events-title" className="ui-title ui-title--sm">{l.eventsTitle}</h2>
              </div>
              <PageLink className="ui-btn ui-btn--ghost ui-btn--sm anp-link-btn" to="calendar" setPage={setPage}>
                {l.fullCalendar} <Icon name="arrow" size={16} className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
              </PageLink>
            </div>

            <ul className="anp-events" data-reveal="stagger">
              {shownEvents.map((ev, i) => (
                <li key={ev.id} className="anp-event">
                  <div className="anp-event-date" aria-hidden="true">
                    <span className="anp-event-day">{ev._day}</span>
                    <span className="anp-event-month">{monthNames[ev._month - 1]}</span>
                  </div>
                  <div className="anp-event-body">
                    <div className="anp-event-head">
                      <span className="anp-event-name" dir="auto">{ev._name}</span>
                      {today && ev._order === 0 && <span className="ui-badge ui-badge--solid anp-new">{l.today}</span>}
                      {today && i === 0 && ev._order > 0 && <span className="ui-badge ui-badge--brand anp-new">{l.next}</span>}
                    </div>
                    <span className="anp-sr">{ev._day} {monthNames[ev._month - 1]}</span>
                    <div className="anp-event-meta">
                      <span className="anp-event-type">
                        <Icon name={EVENT_ICON[ev._type.key] || 'calendar'} size={14} /> {pickUi(ev._type.label, lang, 'en')}
                      </span>
                    </div>
                    {ev._desc && <p className="anp-event-desc" dir="auto">{ev._desc}</p>}
                  </div>
                </li>
              ))}
            </ul>

            {events.length > EVENTS_PREVIEW && (
              <button
                type="button"
                className="ui-btn ui-btn--secondary anp-more"
                aria-expanded={showAllEvents}
                onClick={() => setShowAllEvents(v => !v)}
              >
                {showAllEvents ? l.showLess : l.showMore}
              </button>
            )}

            <p className="anp-note"><Icon name="info" size={16} /> <span>{l.eventsNote}</span></p>
          </section>
        )}

        {/* ═══ Xəbərdar qalmaq — bildiriş, təqvim, namaz vaxtları ═══ */}
        <section className="anp-section" aria-labelledby="anp-stay-title">
          <div className="ui-section-head anp-section-head" data-reveal>
            <span className="ui-eyebrow">{(pickUi(V3, lang, 'en')).stayEyebrow}</span>
            <h2 id="anp-stay-title" className="ui-title">{(pickUi(V3, lang, 'en')).stayTitle}</h2>
          </div>
          <ul className="ui-tiles anp-stay" data-reveal="stagger">
            {offerNotif && (
              <li>
                <button type="button" className="ui-tile ui-tile--row anp-stay-btn" onClick={openNotifications}>
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name="bell" /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{l.enableNotif}</span>
                    <span className="ui-tile__text">{(pickUi(V3, lang, 'en')).notifText}</span>
                  </span>
                </button>
              </li>
            )}
            {[
              { to: 'calendar', title: l.fullCalendar, text: (pickUi(V3, lang, 'en')).calText },
              { to: 'prayer', title: l.seeTimes, text: (pickUi(V3, lang, 'en')).prayerText },
            ].map(k => (
              <li key={k.to}>
                <PageLink className="ui-tile ui-tile--row" to={k.to} setPage={setPage}>
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name={k.to} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{k.title}</span>
                    <span className="ui-tile__text">{k.text}</span>
                  </span>
                </PageLink>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
