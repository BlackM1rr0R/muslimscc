// ═══════════════════════════════════════════════════════
// Ana səhifə — Qaraçuxur Məscidi
//
// Yuxarıdan aşağı: günün xatırlatmaları zolağı → hero (məscidin adı,
// namaz vaxtları kartı) → "Məscid" keçidləri → İslami bölmələr.
// Heç bir element üzmür və məzmunun üstünə düşmür (sahibin istəyi):
// üzən hero kartları və "Günün hədisi" toast-u silinib, gündəlik məzmun
// yuxarıdakı sakit zolaqdadır.
// Məscid məlumatları yalnız src/config/mosque.js-dən oxunur — boş sahə
// göstərilmir, heç nə uydurulmur.
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, MOSQUE, brandName, filled, tr } from '../config/mosque'
import useMosqueTimes, { PRAYER_NAMES } from '../hooks/useMosqueTimes'
import { localizeSource } from '../utils/sourceNames'
import { haptic } from '../hooks/useHaptic'
import { DailyReminderBarSkeleton } from '../components/DailyReminderBarSkeleton'
import { HADITH_COUNT } from '../data/siteStats'
// Günün xatırlatmaları zolağı quotes.js və duas.js-i (~235 KB) yükləyir —
// tənbəl yüklənir; yer tutucu (skeleton) hündürlüyü əvvəlcədən saxlayır.
const DailyReminderBar = lazy(() => import('../components/DailyReminderBar'))
// Bu bolmeler Firestore-dan melumat cekir (Firebase ~470 KB) ve hec biri
// ilk ekranda deyil. Lazy edilmesi Firebase-i ilk yuklenmeden cixarir.
const VideoSection = lazy(() => import('../components/VideoSection'))
const BookSection = lazy(() => import('../components/BookSection'))
const DailyContentDisplay = lazy(() => import('../components/AdminContentDisplay').then(m => ({ default: m.DailyContentDisplay })))
const AnnouncementSection = lazy(() => import('../components/AnnouncementSection'))
const HeroBannerDisplay = lazy(() => import('../components/HeroBannerDisplay'))
import '../styles/HomePage.css'
import '../styles/AdminPage.css'

function CountUp({ end, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setCount(Math.floor(ease * end))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration])
  // Ayırıcısız yazılır — səhifənin qalan rəqəmləri (Quran zolağı, bölmələr)
  // kimi. toLocaleString() brauzerin dilinə görə "6,236" yazırdı.
  return <span ref={ref}>{String(count)}</span>
}

// Görünmə animasiyaları motion.css-in data-reveal sistemi ilədir (tək qlobal
// IntersectionObserver, hooks/useReveal.js) — səhifənin öz useInView-i silinib.

const pad2 = (n) => String(n).padStart(2, '0')

/** "HH:MM" → gecə yarısından dəqiqə; tanınmırsa null */
const toMin = (s) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s || ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// Ana səhifədə yalnız 5 fərz namazı göstərilir (günəş — /jamaat səhifəsində)
const FARD_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// Telefonda hər namazın sətrində rəngli ikon kafeli (motion.css → .icon-tile).
// Kompüterdə kafel gizlidir, əvvəlki nöqtə qalır.
const PRAYER_TILE = {
  fajr:    { ic: '🌅', tone: 'blue' },
  dhuhr:   { ic: '☀️', tone: 'gold' },
  asr:     { ic: '🌤️', tone: 'orange' },
  maghrib: { ic: '🌇', tone: 'rose' },
  isha:    { ic: '🌙', tone: 'violet' },
}
const PrayerTile = ({ k }) => {
  const t = PRAYER_TILE[k]
  return t ? <span className={`hp-pr-ic icon-tile icon-tile--sm icon-tile--${t.tone}`} aria-hidden="true">{t.ic}</span> : null
}

// Növbəti cümənin qısa tarixi ("26 sentyabr"). Bəzi brauzerlərdə "az"
// lokalı olmadığı üçün azərbaycanca ay adları əl ilə yazılır; ərəbcədə
// Qriqorian təqvim və latın rəqəmləri (vaxtlar da latın rəqəmlərindədir).
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const DATE_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

/** 'DD-MM-YYYY' → dilə uyğun qısa tarix (gün + ay); tanınmırsa ''. */
function shortDate(dateKey, lang) {
  const [d, m, y] = String(dateKey || '').split('-').map(Number)
  if (!d || !m || !y) return ''
  if (lang === 'az') return `${d} ${AZ_MONTHS[m - 1]}`
  try {
    return new Date(Date.UTC(y, m - 1, d, 12))
      .toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  } catch {
    return `${pad2(d)}.${pad2(m)}`
  }
}

/** Camaat qaydası azana nisbidirmi ("+N")? — "azan vaxtına görə" qeydi yalnız belə olanda doğrudur. */
const isRelRule = (rule) => /^\+\d{1,3}$/.test(String(rule || '').trim())

// ═══ Ana səhifənin mətnləri (5 dil) — LABELS[lang] || LABELS.en ═══
const LABELS = {
  az: {
    btnTimes: 'Namaz vaxtları', btnAnn: 'Elanlar', btnMosque: 'Məscid haqqında',
    pcTitle: 'Namaz vaxtları', calc: 'Hesablanmış', tomorrow: 'sabah', next: 'Növbəti',
    jumuaTag: 'Cümə', adhan: 'Azan', jamaat: 'Camaat', notSet: 'təyin olunmayıb',
    untilAdhan: 'azana qalıb', untilJamaat: 'camaata qalıb', untilJumua: 'cümə namazına qalıb',
    jumuaPrayer: 'Cümə namazı', dhuhrAdhan: 'Zöhr azanı',
    rel: (n) => (n === 0 ? 'bu gün' : n === 1 ? 'sabah' : `${n} gün sonra`),
    hm: (h, m) => (h ? `${h} saat ${m} dəqiqə` : `${m} dəqiqə`),
    allTimes: 'Bütün vaxtlar →',
    calcNote: 'Azan vaxtları aladhan.com ilə hesablanıb.',
    calcNoteExact: 'Azan vaxtları məscidin koordinatına görə aladhan.com ilə hesablanıb.',
    jamaatNote: 'Camaat vaxtları azan vaxtına görə müəyyən edilir.',
    loading: 'Namaz vaxtları yüklənir...', error: 'Namaz vaxtlarını yükləmək alınmadı.', retry: 'Yenidən cəhd et',
    msqTitle: 'Məscid',
    featEy: 'Saytda', featTitle: 'İslami bilik və ibadət',
    featSub: 'Quran, hədis, dua və digər faydalı bölmələr — hamısı pulsuz.', featGo: 'Keçid et →',
    ctaTitle: 'Məscidlə əlaqədə qalın',
    ctaDesc: 'Namaz vaxtlarını izləyin, məscidin elanlarından xəbərdar olun və İslami bilikləri bir yerdə öyrənin.',
    ctaTimes: 'Namaz vaxtları', ctaNotif: 'Bildiriş ayarları',
    adFree: 'Reklamsız', free: '100% Pulsuz', langs: '5 Dil',
  },
  en: {
    btnTimes: 'Prayer times', btnAnn: 'Announcements', btnMosque: 'About the mosque',
    pcTitle: 'Prayer times', calc: 'Calculated', tomorrow: 'tomorrow', next: 'Next',
    jumuaTag: 'Jumu’ah', adhan: 'Adhan', jamaat: 'Congregation', notSet: 'not set',
    untilAdhan: 'until adhan', untilJamaat: 'until congregation', untilJumua: 'until Jumu’ah',
    jumuaPrayer: 'Friday prayer', dhuhrAdhan: 'Dhuhr adhan',
    rel: (n) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`),
    hm: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
    allTimes: 'All times →',
    calcNote: 'Adhan times are calculated via aladhan.com.',
    calcNoteExact: 'Adhan times are calculated for the mosque’s coordinates via aladhan.com.',
    jamaatNote: 'Congregation times are set from the adhan times.',
    loading: 'Loading prayer times...', error: 'Couldn’t load prayer times.', retry: 'Try again',
    msqTitle: 'Mosque',
    featEy: 'On the site', featTitle: 'Islamic knowledge & worship',
    featSub: 'Quran, hadith, duas and other useful sections — all free.', featGo: 'Open →',
    ctaTitle: 'Stay connected with the mosque',
    ctaDesc: 'Follow the prayer times, keep up with the mosque’s announcements and learn about Islam — all in one place.',
    ctaTimes: 'Prayer times', ctaNotif: 'Notification settings',
    adFree: 'Ad-free', free: '100% Free', langs: '5 Languages',
  },
  ru: {
    btnTimes: 'Время намаза', btnAnn: 'Объявления', btnMosque: 'О мечети',
    pcTitle: 'Время намаза', calc: 'Расчётное', tomorrow: 'завтра', next: 'Следующий',
    jumuaTag: 'Джума', adhan: 'Азан', jamaat: 'Джамаат', notSet: 'не указано',
    untilAdhan: 'до азана', untilJamaat: 'до джамаата', untilJumua: 'до пятничного намаза',
    jumuaPrayer: 'Пятничный намаз', dhuhrAdhan: 'Азан Зухр',
    rel: (n) => {
      if (n === 0) return 'сегодня'
      if (n === 1) return 'завтра'
      const m10 = n % 10, m100 = n % 100
      const w = m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней'
      return `через ${n} ${w}`
    },
    hm: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
    allTimes: 'Всё расписание →',
    calcNote: 'Время азана рассчитано через aladhan.com.',
    calcNoteExact: 'Время азана рассчитано по координатам мечети через aladhan.com.',
    jamaatNote: 'Время джамаата определяется по времени азана.',
    loading: 'Загрузка времени намаза...', error: 'Не удалось загрузить время намаза.', retry: 'Повторить',
    msqTitle: 'Мечеть',
    featEy: 'На сайте', featTitle: 'Исламские знания и поклонение',
    featSub: 'Коран, хадисы, дуа и другие полезные разделы — всё бесплатно.', featGo: 'Перейти →',
    ctaTitle: 'Оставайтесь на связи с мечетью',
    ctaDesc: 'Следите за временем намаза и объявлениями мечети и изучайте ислам — всё в одном месте.',
    ctaTimes: 'Время намаза', ctaNotif: 'Настройки уведомлений',
    adFree: 'Без рекламы', free: '100% бесплатно', langs: '5 языков',
  },
  ar: {
    btnTimes: 'مواقيت الصلاة', btnAnn: 'الإعلانات', btnMosque: 'عن المسجد',
    pcTitle: 'مواقيت الصلاة', calc: 'محسوبة', tomorrow: 'غدًا', next: 'التالية',
    jumuaTag: 'الجمعة', adhan: 'الأذان', jamaat: 'الجماعة', notSet: 'غير محدد',
    untilAdhan: 'حتى الأذان', untilJamaat: 'حتى الجماعة', untilJumua: 'حتى صلاة الجمعة',
    jumuaPrayer: 'صلاة الجمعة', dhuhrAdhan: 'أذان الظهر',
    rel: (n) => (n === 0 ? 'اليوم' : n === 1 ? 'غدًا' : n === 2 ? 'بعد يومين' : n <= 10 ? `بعد ${n} أيام` : `بعد ${n} يومًا`),
    hm: (h, m) => (h ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`),
    allTimes: 'جميع المواقيت ←',
    calcNote: 'أوقات الأذان محسوبة عبر aladhan.com.',
    calcNoteExact: 'أوقات الأذان محسوبة وفق إحداثيات المسجد عبر aladhan.com.',
    jamaatNote: 'تُحدَّد أوقات الجماعة بحسب وقت الأذان.',
    loading: 'جارٍ تحميل مواقيت الصلاة...', error: 'تعذّر تحميل مواقيت الصلاة.', retry: 'إعادة المحاولة',
    msqTitle: 'المسجد',
    featEy: 'في الموقع', featTitle: 'المعرفة الإسلامية والعبادة',
    featSub: 'القرآن والحديث والأدعية وأقسام مفيدة أخرى — كلها مجانًا.', featGo: 'انتقل ←',
    ctaTitle: 'ابقَ على تواصل مع المسجد',
    ctaDesc: 'تابع مواقيت الصلاة وإعلانات المسجد وتعلّم عن الإسلام — في مكان واحد.',
    ctaTimes: 'مواقيت الصلاة', ctaNotif: 'إعدادات الإشعارات',
    adFree: 'بدون إعلانات', free: 'مجاني 100%', langs: '5 لغات',
  },
  tr: {
    btnTimes: 'Namaz vakitleri', btnAnn: 'Duyurular', btnMosque: 'Cami hakkında',
    pcTitle: 'Namaz vakitleri', calc: 'Hesaplanmış', tomorrow: 'yarın', next: 'Sıradaki',
    jumuaTag: 'Cuma', adhan: 'Ezan', jamaat: 'Cemaat', notSet: 'belirtilmemiş',
    untilAdhan: 'ezana kaldı', untilJamaat: 'cemaate kaldı', untilJumua: 'cuma namazına kaldı',
    jumuaPrayer: 'Cuma namazı', dhuhrAdhan: 'Öğle ezanı',
    rel: (n) => (n === 0 ? 'bugün' : n === 1 ? 'yarın' : `${n} gün sonra`),
    hm: (h, m) => (h ? `${h} saat ${m} dakika` : `${m} dakika`),
    allTimes: 'Tüm vakitler →',
    calcNote: 'Ezan vakitleri aladhan.com ile hesaplanmıştır.',
    calcNoteExact: 'Ezan vakitleri caminin koordinatlarına göre aladhan.com ile hesaplanmıştır.',
    jamaatNote: 'Cemaat vakitleri ezan vaktine göre belirlenir.',
    loading: 'Namaz vakitleri yükleniyor...', error: 'Namaz vakitleri yüklenemedi.', retry: 'Tekrar dene',
    msqTitle: 'Cami',
    featEy: 'Sitede', featTitle: 'İslami bilgi ve ibadet',
    featSub: "Kur'an, hadis, dua ve diğer faydalı bölümler — hepsi ücretsiz.", featGo: 'Git →',
    ctaTitle: 'Camiyle bağlantıda kalın',
    ctaDesc: 'Namaz vakitlerini takip edin, caminin duyurularından haberdar olun ve İslam hakkında bilgi edinin — hepsi tek yerde.',
    ctaTimes: 'Namaz vakitleri', ctaNotif: 'Bildirim ayarları',
    adFree: 'Reklamsız', free: '%100 Ücretsiz', langs: '5 Dil',
  },
}

// Hero kartındakı hədis — src/data/quotes.js-dən (Muslim 671) olduğu kimi
// köçürülüb. quotes.js böyükdür, ona görə import edilmir. Ərəbcə tərcümə
// yoxdur: ərəb dilində yalnız əsl mətn göstərilir. Mənbə Azərbaycan
// yazılışındadır — göstərərkən localizeSource() onu dilə çevirir
// ("مسلم 671", "Муслим 671", "Müslim 671").
const HERO_HADITH = {
  ar: 'أَحَبُّ الْبِلَادِ إِلَى اللَّهِ مَسَاجِدُهَا',
  text: { az: 'Allaha ən sevimli yerlər məscidlərdir', en: 'The most beloved places to Allah are the mosques', ru: 'Самые любимые места для Аллаха — мечети', tr: 'Allah\'a en sevimli yerler mescitlerdir' },
  source: 'Muslim 671',
}

// Hero-nun altındakı "Məscid" sırası — yeni məscid bölmələrinə keçidlər.
// Təsvirlər səhifənin NƏ ÜÇÜN olduğunu deyir, məscid haqqında iddia deyil.
const MOSQUE_LINKS = [
  {
    page: 'mosque', icon: '🕌', tone: 'teal',
    title: { az: 'Məscid haqqında', en: 'About the mosque', ru: 'О мечети', ar: 'عن المسجد', tr: 'Cami hakkında' },
    desc: { az: 'Məscid haqqında məlumat və əlaqə', en: 'About the mosque and how to get in touch', ru: 'Информация о мечети и контакты', ar: 'معلومات عن المسجد وطرق التواصل', tr: 'Cami hakkında bilgi ve iletişim' },
  },
  {
    page: 'jamaat', icon: '⏰', tone: 'gold',
    title: { az: 'Namaz və camaat vaxtları', en: 'Prayer & congregation times', ru: 'Время намаза и джамаата', ar: 'مواقيت الصلاة والجماعة', tr: 'Namaz ve cemaat vakitleri' },
    desc: { az: 'Azan və camaat vaxtları, cümə namazı', en: 'Adhan and congregation times, Friday prayer', ru: 'Время азана и джамаата, пятничный намаз', ar: 'أوقات الأذان والجماعة وصلاة الجمعة', tr: 'Ezan ve cemaat vakitleri, cuma namazı' },
  },
  {
    page: 'announcements', icon: '📢', tone: 'orange',
    title: { az: 'Elanlar', en: 'Announcements', ru: 'Объявления', ar: 'الإعلانات', tr: 'Duyurular' },
    desc: { az: 'Məscidin elanları və İslami günlər', en: 'Mosque announcements and Islamic days', ru: 'Объявления мечети и исламские дни', ar: 'إعلانات المسجد والأيام الإسلامية', tr: 'Caminin duyuruları ve İslami günler' },
  },
  {
    page: 'donate', icon: '💝', tone: 'rose',
    title: { az: 'İanə', en: 'Donate', ru: 'Пожертвование', ar: 'التبرع', tr: 'Bağış' },
    desc: { az: 'Məscidə dəstək olmaq', en: 'Support the mosque', ru: 'Поддержать мечеть', ar: 'ادعم المسجد', tr: 'Camiye destek olun' },
  },
]

// "Saytda" bölməsi — saytın İslami bölmələri (əvvəl i18n açarları səhv
// kartlara düşürdü: "Namaz" kartında hədis mətni, "50+ hədis" və s.)
const FEATURES = [
  { page: 'quran', icon: '📖', clr: '#10b981',
    title: { az: 'Qurani-Kərim', en: 'Holy Quran', ru: 'Священный Коран', ar: 'القرآن الكريم', tr: "Kur'an-ı Kerim" },
    desc: { az: '114 surə, 6236 ayə — tərcümə və tilavət', en: '114 surahs, 6236 verses — translation and recitation', ru: '114 сур, 6236 аятов — перевод и чтение', ar: '114 سورة و6236 آية — ترجمة وتلاوة', tr: '114 sure, 6236 ayet — meal ve tilavet' } },
  { page: 'prayer', icon: '🕐', clr: '#f59e0b',
    title: { az: 'Namaz təqvimi', en: 'Prayer Times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz Vakitleri' },
    desc: { az: 'Digər şəhərlər üçün namaz vaxtları', en: 'Prayer times for other cities', ru: 'Время намаза в других городах', ar: 'مواقيت الصلاة في مدن أخرى', tr: 'Diğer şehirler için namaz vakitleri' } },
  { page: 'hadith', icon: '📚', clr: '#8b5cf6',
    title: { az: 'Hədislər', en: 'Hadiths', ru: 'Хадисы', ar: 'الأحاديث', tr: 'Hadisler' },
    desc: { az: 'Buxari, Müslim və digər mənbələrdən', en: 'From Bukhari, Muslim and other collections', ru: 'Из Бухари, Муслима и других сборников', ar: 'من البخاري ومسلم وغيرهما', tr: 'Buhari, Müslim ve diğer kaynaklardan' } },
  { page: 'duas', icon: '🤲', clr: '#3b82f6',
    title: { az: 'Dualar', en: "Du'as", ru: 'Дуа', ar: 'الأدعية', tr: 'Dualar' },
    desc: { az: 'Hər məqam üçün dualar', en: 'Supplications for every occasion', ru: 'Мольбы на каждый случай', ar: 'أدعية لكل مناسبة', tr: 'Her an için dualar' } },
  { page: 'names', icon: '⭐', clr: '#ec4899',
    title: { az: 'Allahın 99 adı', en: '99 Names of Allah', ru: '99 имён Аллаха', ar: 'أسماء الله الحسنى', tr: "Allah'ın 99 İsmi" },
    desc: { az: 'Əsmaül-Hüsna — mənaları ilə', en: 'Asma ul-Husna with their meanings', ru: 'Асма уль-Хусна с их значениями', ar: 'الأسماء الحسنى ومعانيها', tr: 'Esmaü’l-Hüsna — anlamlarıyla' } },
  { page: 'zakat', icon: '💰', clr: '#ef4444',
    title: { az: 'Zəkat kalkulyatoru', en: 'Zakat Calculator', ru: 'Калькулятор закята', ar: 'حاسبة الزكاة', tr: 'Zekât Hesaplayıcı' },
    desc: { az: 'Qızıl, gümüş və nağd pul üzrə hesablama', en: 'Zakat on gold, silver and cash', ru: 'Закят с золота, серебра и денег', ar: 'زكاة الذهب والفضة والنقود', tr: 'Altın, gümüş ve nakit için hesaplama' } },
  { page: 'qibla', icon: '🧭', clr: '#14b8a6',
    title: { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' },
    desc: { az: 'Kəbəyə istiqamət', en: 'Direction to the Kaaba', ru: 'Направление на Каабу', ar: 'الاتجاه نحو الكعبة', tr: 'Kâbe yönü' } },
  { page: 'dhikr', icon: '📿', clr: '#a855f7',
    title: { az: 'Zikr sayğacı', en: 'Dhikr Counter', ru: 'Счётчик зикра', ar: 'عداد الذكر', tr: 'Zikir Sayacı' },
    desc: { az: 'Sübhanallah, Əlhəmdulillah, Allahu Əkbər', en: 'SubhanAllah, Alhamdulillah, Allahu Akbar', ru: 'СубханАллах, Альхамдулиллях, Аллаху Акбар', ar: 'سبحان الله، الحمد لله، الله أكبر', tr: 'Sübhanallah, Elhamdülillah, Allahu Ekber' } },
]

// ── Canlı geri sayım — yalnız bu kiçik komponent hər saniyə yenilənir ──
// from — əvvəlki sərhədin (əvvəlki namazın camaatı/azanı) epoch ms-i:
// telefonda sayğacın altındakı nazik zolaq ötən vaxtın payını göstərir
// (yalnız transform: scaleX; kompüterdə zolaq gizlidir).
function Countdown({ at, from, label }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [at])

  const total = Math.max(0, Math.floor((at - now) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const span = from != null ? at - from : 0
  const frac = span > 0 ? Math.min(1, Math.max(0, (now - from) / span)) : null
  return (
    <>
      <span className="hp-pc-cd" role="timer" aria-label={label(h, m)}>
        {pad2(h)}:{pad2(m)}:{pad2(s)}
      </span>
      {frac != null && (
        <span className="hp-pc-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${frac.toFixed(4)})` }} />
        </span>
      )}
    </>
  )
}

// ── Namaz vaxtları kartı ──
// Ziyarətçinin yeri SORUŞULMUR (geolocation yoxdur): məscid saytı məscidin
// öz vaxtlarını göstərir (useMosqueTimes → prayerLocation()). Azan vaxtları
// hesablanmışdır və belə qeyd olunur; camaat sütunu yalnız ən azı bir camaat
// vaxtı təyin olunanda görünür — boş qayda üçün vaxt uydurulmur.
// Geri sayım növbəti namazın CAMAATINA qədərdir (camaat vaxtı yoxdursa —
// azana). Siyahının altında növbəti cümə namazının vaxtı göstərilir; cümə
// günü (namaz hələ qılınmayıbsa) bu, Zöhr sətrindəki "Cümə" nişanıdır.
function PrayerWidget({ lang, l, onMore }) {
  const { error, prayers, hasJamaat, next, isFriday, nextJumua, exact, reload } = useMosqueTimes()
  const name = (k) => PRAYER_NAMES[k]?.[lang] || PRAYER_NAMES[k]?.en || k
  const rows = prayers.filter(p => FARD_KEYS.includes(p.key))
  // İşadan sonra "növbəti" sabahın sübhüdür — bugünkü sətirlərin hamısı keçib
  const nextIdx = !next ? -1 : next.tomorrow ? rows.length : rows.findIndex(p => p.key === next.key)

  // Geri sayım: camaat vaxtı varsa ona, yoxdursa azana
  const countToJamaat = !!next && next.jamaatAt != null
  const countAt = next ? (next.jamaatAt ?? next.at) : 0
  const nextIsJumua = !!next && !next.tomorrow && !!rows[nextIdx]?.jumua
  const until = countToJamaat ? (nextIsJumua ? l.untilJumua : l.untilJamaat) : l.untilAdhan
  // Növbəti namazın azanı artıq oxunub, camaat gözlənilir
  const adhanCalled = next?.target === 'jamaat'

  // Geri sayımın başlanğıcı (irəliləyiş zolağı üçün): əvvəlki fərz namazın
  // camaatı (yoxdursa azanı). Sübhdən əvvəl — dünənki işa (bugünkü vaxtla
  // təxmini, 24 saat geri). Hesablana bilmirsə zolaq göstərilmir.
  let countFrom = null
  if (next && rows.length === FARD_KEYS.length) {
    const targetMin = toMin(countToJamaat ? next.jamaat : next.adhan)
    const prevRow = next.tomorrow || nextIdx <= 0 ? rows[rows.length - 1] : rows[nextIdx - 1]
    let prevMin = toMin(filled(prevRow?.jamaat) ? prevRow.jamaat : prevRow?.adhan)
    if (prevMin != null && !next.tomorrow && nextIdx <= 0) prevMin -= 1440
    const spanMin = targetMin != null && prevMin != null ? targetMin + (next.tomorrow ? 1440 : 0) - prevMin : 0
    if (spanMin > 0 && spanMin < 1440) countFrom = countAt - spanMin * 60000
  }

  // Növbəti cümə — hook bu sahəni verirsə və cümə qaydası təyin olunubsa.
  // Bu gün cümədirsə Zöhr sətri artıq cümə namazını göstərir (təkrar yox).
  const nj = nextJumua || null
  const showJumua = !!nj && rows.length > 0 && filled(nj.rule) && !nj.isToday
    && (filled(nj.time) || nj.loading)
  const jumuaWhen = showJumua
    // "·" əvvəlki sözə bağlıdır (qırılmaz boşluq) — dar ekranda yeni sətrin başına düşməsin
    ? [shortDate(nj.date, lang), typeof nj.inDays === 'number' ? l.rel(nj.inDays) : ''].filter(Boolean).join('\u00a0· ')
    : ''

  const anyRelative = rows.some(p => isRelRule(p.rule))
  const note = `${exact ? l.calcNoteExact : l.calcNote}${hasJamaat && anyRelative ? ` ${l.jamaatNote}` : ''}`

  return (
    <section className={`hp-pc${hasJamaat ? ' hp-pc--jm' : ''}`} aria-labelledby="hp-pc-ttl">
      <div className="hp-pc-hdr">
        <div className="hp-pc-hdr-l">
          <span className="hp-pc-ic" aria-hidden="true">🕌</span>
          <div>
            <h2 id="hp-pc-ttl" className="hp-pc-ttl">{l.pcTitle}</h2>
            <span className="hp-pc-sub">{l.calc}</span>
          </div>
        </div>
        {rows.length > 0 && next && (
          <div className="hp-pc-next">
            <span className="hp-pc-next-nm">{name(next.key)}{next.tomorrow ? ` · ${l.tomorrow}` : ''}</span>
            <span className="hp-pc-next-cap" aria-hidden="true">{until}</span>
            <Countdown at={countAt} from={countFrom} label={(h, m) => `${name(next.key)} — ${until}: ${l.hm(h, m)}`} />
          </div>
        )}
      </div>

      {rows.length > 0 ? (
        <>
          {hasJamaat && (
            <div className="hp-pr hp-pr--head" aria-hidden="true">
              <span /><span />
              <span className="hp-pr-tm">{l.adhan}</span>
              <span className="hp-pr-tm">{l.jamaat}</span>
              <span />
            </div>
          )}
          <ol className="hp-pr-list">
            {rows.map((p, i) => {
              const done = i < nextIdx
              const act = i === nextIdx
              return (
                <li key={p.key} className={`hp-pr${done ? ' hp-pr--done' : ''}${act ? ' hp-pr--act' : ''}`}>
                  <span className={`hp-pr-dot${done ? ' done' : act ? ' act' : ''}`} aria-hidden="true" />
                  <PrayerTile k={p.key} />
                  <span className="hp-pr-nm">
                    <span>{name(p.key)}</span>
                    {isFriday && p.key === 'dhuhr' && <span className="hp-pr-tag">{l.jumuaTag}</span>}
                    {act && <span className="hp-pr-badge">{l.next}</span>}
                  </span>
                  <span className={`hp-pr-tm${act && adhanCalled ? ' hp-pr-tm--past' : ''}`}>
                    {hasJamaat && <span className="hp-sr">{l.adhan}: </span>}{p.adhan}
                  </span>
                  {hasJamaat && (
                    filled(p.jamaat)
                      ? <span className="hp-pr-tm hp-pr-jm"><span className="hp-sr">{p.jumua ? l.jumuaPrayer : l.jamaat}: </span>{p.jamaat}</span>
                      : <span className="hp-pr-tm hp-pr-none"><span aria-hidden="true">—</span><span className="hp-sr">{l.jamaat}: {l.notSet}</span></span>
                  )}
                  <span className="hp-pr-chk" aria-hidden="true">{done ? '✓' : ''}</span>
                </li>
              )
            })}
          </ol>

          {/* Növbəti cümə namazı — eyni sütunlarda: zöhr azanı | cümə namazı */}
          {showJumua && (
            <div className="hp-pr hp-pr--jumua">
              <span className="hp-pr-dot hp-pr-dot--jumua" aria-hidden="true" />
              <span className="hp-pr-ic icon-tile icon-tile--sm icon-tile--gold" aria-hidden="true">🕌</span>
              <span className="hp-pr-nm hp-pr-nm--col">
                <span>{l.jumuaPrayer}</span>
                {jumuaWhen && <small className="hp-pr-when">{jumuaWhen}</small>}
              </span>
              {hasJamaat && (
                <span className="hp-pr-tm">
                  {filled(nj.adhan)
                    ? <><span className="hp-sr">{l.dhuhrAdhan}: </span>{nj.adhan}</>
                    : <span className="hp-skel skeleton" aria-hidden="true" />}
                </span>
              )}
              <span className="hp-pr-tm hp-pr-jm">
                {filled(nj.time)
                  ? <><span className="hp-sr">{l.jumuaPrayer}: </span>{nj.time}</>
                  : <span className="hp-skel skeleton" aria-hidden="true" />}
              </span>
              <span className="hp-pr-chk" aria-hidden="true" />
            </div>
          )}
        </>
      ) : error ? (
        <div className="hp-pc-err" role="alert">
          <p>{l.error}</p>
          <button type="button" className="hp-pc-retry press" onClick={reload}>{l.retry}</button>
        </div>
      ) : (
        // Yüklənir: adlar məlumdur, vaxtların yeri boz zolaqla saxlanılır
        <ol className="hp-pr-list" aria-busy="true" aria-label={l.loading}>
          {FARD_KEYS.map(k => (
            <li key={k} className="hp-pr hp-pr--skel">
              <span className="hp-pr-dot" aria-hidden="true" />
              <PrayerTile k={k} />
              <span className="hp-pr-nm"><span>{name(k)}</span></span>
              <span className="hp-pr-tm"><span className="hp-skel skeleton" aria-hidden="true" /></span>
              <span className="hp-pr-chk" aria-hidden="true" />
            </li>
          ))}
        </ol>
      )}

      <p className="hp-pc-note">{note}</p>
      <button type="button" className="hp-pc-more press" onClick={onMore}>{l.allTimes}</button>
    </section>
  )
}

const TAWHEED_PILLARS = [
  {
    icon:'☝️', key:'rub', ar:'تَوْحِيدُ الرُّبُوبِيَّة',
    az:'Rübubiyyət Tövhidi', en:'Tawhid al-Rububiyyah', ru:'Таухид ар-Рубубийя', tr:'Rububiyyet Tevhidi',
    desc:{
      az:'Allahın Rəbb olduğuna inanmaqdır — O hər şeyin yaradıcısı, ruziversi, idarəçisidir. Heç kim Onun yaratmaq, öldürmək, diriltmək, ruzi vermək, idarə etmək kimi xüsusiyyətlərində Ona şərik ola bilməz.',
      en:'Belief in Allah\'s Lordship — that He alone creates, provides sustenance, and governs all things. Nothing can share His powers of creation, life, death, and governance.',
      ru:'Вера в господство Аллаха — что Он один творит, дарует пропитание и управляет всем. Никто не может разделять с Ним творение, жизнь, смерть и управление.',
      tr:'Allah\'ın Rablığına iman — yalnız O\'nun yaratan, rızık veren ve idare edendir. Yaratmak, hayat, ölüm ve yönetim gibi özelliklerinde hiçbir şey O\'na ortak olamaz.',
      ar:'الإيمان بأن الله وحده هو الخالق الرازق المدبّر لكل شيء، لا يشاركه أحد في الخلق والإحياء والإماتة والرزق والتدبير.',
    },
    ayah:'أَلاَ لَهُ الْخَلْقُ وَالأَمْرُ تَبَارَكَ اللَّهُ رَبُّ الْعَالَمِينَ',
    ayahRef:{ az:'Əraf 54', en:'Al-A\'raf 54', ru:'Аль-Аграф 54', tr:'Araf 54', ar:'الأعراف 54' },
    color:'#10b981',
  },
  {
    icon:'🕌', key:'ulu', ar:'تَوْحِيدُ الأُلُوهِيَّة',
    az:'Uluhiyyət Tövhidi', en:'Tawhid al-Uluhiyyah', ru:'Таухид аль-Улюхийя', tr:'Uluhiyyet Tevhidi',
    desc:{
      az:'Bütün ibadətin — namaz, dua, qurban, nəzir, sevgi, qorxu, ümid, s.d.a. — yalnız Allaha edilməsidir. Bu tövhid növü peyğəmbərlərin insanlara ən çox çatdırdığı dəvətin əsasını təşkil edir.',
      en:'Dedicating all acts of worship solely to Allah: prayer, supplication, sacrifice, vows, love, fear, and hope. This is the core of every prophet\'s call to their people.',
      ru:'Посвящение всех актов поклонения исключительно Аллаху: молитва, мольба, жертвоприношение, обеты, любовь, страх, надежда. Это основа призыва каждого пророка.',
      tr:'Tüm ibadetleri yalnızca Allah\'a adamak: namaz, dua, kurban, adak, sevgi, korku, ümit. Bu, her peygamberin davetinin temelidir.',
      ar:'إفراد الله وحده بجميع أنواع العبادة: الصلاة والدعاء والذبح والنذر والمحبة والخوف والرجاء، وهو أساس دعوة جميع الأنبياء.',
    },
    ayah:'وَمَا خَلَقْتُ الجِنَّ وَالإِنسَ إِلاَّ لِيَعْبُدُونِ',
    ayahRef:{ az:'Zariyat 56', en:'Adh-Dhariyat 56', ru:'Аз-Зарийат 56', tr:'Zariyat 56', ar:'الذاريات 56' },
    color:'#f59e0b',
  },
  {
    icon:'✨', key:'asma', ar:'تَوْحِيدُ الأَسْمَاءِ وَالصِّفَاتِ',
    az:'Əsma və Sifat Tövhidi', en:'Tawhid al-Asma was-Sifat', ru:'Таухид аль-Асма уа ас-Сыфат', tr:'Esma ve Sıfat Tevhidi',
    desc:{
      az:'Allahın Özü üçün Quran və sünnədə sabit etdiyi bütün gözəl ad və sifətlərə iman etmək; onları məxluqata bənzətmədən, inkar etmədən, dəyişdirmədən, surətini soruşmadan.',
      en:'Affirming all the beautiful Names and Attributes that Allah established for Himself in the Quran and Sunnah — without likening them to creation, denying, distorting, or asking about their modality.',
      ru:'Утверждение всех прекрасных Имён и Атрибутов, которые Аллах установил для Себя в Коране и Сунне — без уподобления творениям, отрицания, искажения или вопросов об их природе.',
      tr:'Allah\'ın Kuran ve sünnette kendisi için sabit kıldığı tüm güzel isim ve sıfatları ispat etmek — mahlûkata benzetmeksizin, inkâr etmeksizin, tahrif etmeksizin ve keyfiyetini sormaksızın.',
      ar:'إثبات ما أثبته الله لنفسه في القرآن والسنة من الأسماء الحسنى والصفات العلى، من غير تشبيه ولا تعطيل ولا تحريف ولا تكييف.',
    },
    ayah:'وَلِلَّهِ الأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا',
    ayahRef:{ az:'Əraf 180', en:'Al-A\'raf 180', ru:'Аль-Аграф 180', tr:'Araf 180', ar:'الأعراف 180' },
    color:'#8b5cf6',
  },
]

// ar — kartın ərəbcə başlığıdır (kəlmə / ayə hissəsi). arExpl — ərəb dilində
// göstərilən qısa izah (digər dillərdəki izahın tərcüməsi; ayə deyil).
// Əvvəl ərəb dilində izahın yerində eyni ərəbcə sətir təkrarlanırdı.
const TAWHEED_FACTS = [
  { arExpl:'أساس الإسلام، ومفتاح الجنة، وأثقل الكلمات', ar:'لَا إِلَهَ إِلَّا اللَّهُ', az:'"La ilaha illallah" — İslamın əsası, cənnətin açarı, ən ağır kəlmə', en:'"La ilaha illallah" — foundation of Islam, key to Paradise, the weightiest word', ru:'"Ля иляха иллаллах" — основа ислама, ключ от рая', tr:'"La ilahe illallah" — İslam\'ın temeli, cennetin anahtarı' },
  { arExpl:'الله واحد — لا شريك له ولا ندّ ولا نظير', ar:'هُوَ اللَّهُ أَحَدٌ', az:'Allah birdir — heç bir şərikin, həmtayın, nəzirin yoxdur', en:'Allah is One — no partners, equals, or rivals', ru:'Аллах Один — без сотоварищей, равных или соперников', tr:'Allah birdir — ortağı, eşi, dengi yoktur' },
  { arExpl:'كل شيء مفتقر إليه، وهو لا يفتقر إلى أحد', ar:'اللَّهُ الصَّمَدُ', az:'Allah Saməd — hər şey Ona möhtac, O heç kimə möhtac deyil', en:'Allah is As-Samad — all depend on Him; He depends on none', ru:'Аллах — Самад: все нуждаются в Нём, Он ни в ком не нуждается', tr:'Allah Samed\'dir — herkes O\'na muhtaç, O kimseye değil' },
  { arExpl:'لا يشبهه شيء، ولا يساويه أحد', ar:'لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُواً أَحَدٌ', az:'O doğmadı, doğulmadı — heç bir şeye bənzəmir, heç kim Onun bənzəri deyil', en:'He neither begot nor was begotten — nothing resembles Him, none equals Him', ru:'Он не рожает и не рождён — ничто Ему не подобно', tr:'O doğurmadı ve doğulmadı — hiçbir şey O\'na benzemez' },
]

// Quran zolağı — Hicr 9 ayəsinin tərcüməsi (əvvəlki mətn olduğu kimi) və
// istinad ayrıca saxlanılır ki, istinad sətirdə bölünməsin
const QBAN_TR = {
  az: '"Biz Quranı Biz nazil etdik; onu Biz qoruyacağıq."',
  ru: '"Воистину, Мы ниспослали Коран и будем его оберегать."',
  tr: '"Şüphesiz Kur\'an\'ı biz indirdik ve onu koruyacak olan da biziz."',
  en: '"Indeed, it is We who revealed the Quran and indeed, We will be its Guardian."',
}
const QBAN_REF = { az: 'Hicr 9', ru: 'Аль-Хиджр 9', ar: 'الحجر 9', tr: 'Hicr 9', en: 'Al-Hijr 9' }

// 99 ad — translit = Az transliterasiya (YALNIZ azərbaycanca səhifədə görünür;
// en/ru/tr-də azərbaycanca yazılış "sızmasın" deyə gizlədilir),
// meaning = aktiv dilə uyğun seçilir (ərəbcədən başqa hamısında).
const ALLAH_NAMES = [
  { ar:'ٱلرَّحْمَٰن', translit:'Rəhman', color:'#10b981', meaning:{ az:'Mərhəmətli',        en:'The Most Gracious',          ru:'Всемилостивый',         ar:'الرحمن',                    tr:'Rahmân' } },
  { ar:'ٱلرَّحِيم',   translit:'Rəhim',  color:'#f59e0b', meaning:{ az:'Rəhmli',             en:'The Most Merciful',          ru:'Милосердный',           ar:'الرحيم',                    tr:'Rahîm' } },
  { ar:'ٱلْمَلِك',    translit:'Malik',  color:'#8b5cf6', meaning:{ az:'Hökmdar',            en:'The King',                   ru:'Царь',                  ar:'الملك',                     tr:'Melik' } },
  { ar:'ٱلْقُدُّوس', translit:'Quddus', color:'#3b82f6', meaning:{ az:'Pak olan',           en:'The Most Pure',              ru:'Святой',                ar:'القدوس',                    tr:'Kuddûs' } },
  { ar:'ٱلسَّلَٰم',  translit:'Salam',  color:'#ec4899', meaning:{ az:'Sülh verən',         en:'The Source of Peace',        ru:'Источник мира',         ar:'السلام',                    tr:'Selâm' } },
  { ar:'ٱلْمُؤْمِن', translit:'Mömin',  color:'#ef4444', meaning:{ az:'Güvən verən',        en:'The Granter of Security',    ru:'Дарующий веру',         ar:'المؤمن',                    tr:"Mü'min" } },
  { ar:'ٱلْعَزِيز',  translit:'Əziz',   color:'#f97316', meaning:{ az:'Qüdrətli',           en:'The Almighty',               ru:'Могущественный',        ar:'العزيز',                    tr:'Azîz' } },
  { ar:'ٱلْغَفُور',  translit:'Ğafur',  color:'#14b8a6', meaning:{ az:'Bağışlayan',         en:'The Forgiving',              ru:'Прощающий',             ar:'الغفور',                    tr:'Gafûr' } },
  { ar:'ٱلْوَدُود',  translit:'Vədud',  color:'#a855f7', meaning:{ az:'Sevən',              en:'The Loving',                 ru:'Любящий',               ar:'الودود',                    tr:'Vedûd' } },
  { ar:'ٱلْحَكِيم',  translit:'Həkim',  color:'#6366f1', meaning:{ az:'Hikmət sahibi',      en:'The Wise',                   ru:'Мудрый',                ar:'الحكيم',                    tr:'Hakîm' } },
  { ar:'ٱلتَّوَّاب', translit:'Tövvab', color:'#84cc16', meaning:{ az:'Tövbələri qəbul edən', en:'The Acceptor of Repentance', ru:'Принимающий покаяние', ar:'التواب',                    tr:'Tevvâb' } },
  { ar:'ٱلنُّور',    translit:'Nur',    color:'#fbbf24', meaning:{ az:'Nur (İşıq)',         en:'The Light',                  ru:'Свет',                  ar:'النور',                     tr:'Nûr' } },
]

export default function HomePage({ setPage }) {
  const { lang } = useLang()
  const lk = lang
  const l = LABELS[lang] || LABELS.en
  // Tərcümə yoxdursa əvvəl ingiliscə — ərəb/rus/türk səhifəsində azərbaycanca mətn çıxmasın
  const L = obj => obj[lk] || obj.en || obj.az || ''
  // Ərəb dilində "tərcümə" sətri ərəbcə orijinalın təkrarı olardı — göstərilmir
  const isAr = lk === 'ar'

  const [visible, setVisible] = useState(false)
  const [activeTW, setActiveTW] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(id)
  }, [])

  // App-in navigate() səhifəni özü yuxarı qaldırır
  const goTo = p => setPage(p)
  // Bildiriş ayarları panelini aç (FloatingDock / köhnə vidjet bu hadisəni dinləyir)
  const openNotifications = () => window.dispatchEvent(new CustomEvent('open-notifications'))

  const twPillar = TAWHEED_PILLARS[activeTW]

  // Brend adı iki sətirdə: son söz yaşıl (başlıqdakı loqo kimi)
  const brand = brandName(lang)
  const brandWords = brand.trim().split(/\s+/)
  const brandLast = brandWords.length > 1 ? brandWords.pop() : ''
  const brandFirst = brandWords.join(' ')
  const heroHadithText = lang === 'ar' ? '' : tr(HERO_HADITH.text, lang)

  const stats=[
    {num:114,  s:'',  l:{az:'Quran Surəsi',  en:'Quran Surahs',   ru:'Сур Корана',    tr:'Sure',         ar:'سورة'}},
    {num:6236, s:'',  l:{az:'Quran Ayəsi',   en:'Quran Verses',   ru:'Аятов Корана',  tr:'Ayet',         ar:'آية'}},
    // Təkrarsız 1394 hədis — "1350+" (bax: data/siteStats.js)
    {num:HADITH_COUNT, s:'+', l:{az:'Hədis',  en:'Hadiths',        ru:'Хадисов',       tr:'Hadis',        ar:'حديث'}},
    {num:99,   s:'',  l:{az:"Allahın Adı",   en:"Names of Allah", ru:'Имён Аллаха',   tr:"Allah'ın İsmi",ar:'اسمًا لله'}},
    {num:5,    s:'',  l:{az:'Dil',            en:'Languages',      ru:'Языков',        tr:'Dil',          ar:'لغات'}},
    {num:100,  s:'%', l:{az:'Pulsuz',         en:'Free',           ru:'Бесплатно',     tr:'Ücretsiz',     ar:'مجاناً'}},
  ]

  return (
    <div className="hp-root">

      {/* Zolaq + hero + "Məscid" sırası eyni fonda */}
      <div className="hp-top">

        {/* ═══ GÜNÜN XATIRLATMALARI — başlığın düz altında, axında (üzmür) ═══
            Öz Suspense sərhədi var: yer tutucu hündürlüyü əvvəlcədən saxlayır.
            Ziyarətçi bu gün bağlayıbsa həm zolaq, həm yer tutucu null qaytarır. */}
        <Suspense fallback={<DailyReminderBarSkeleton />}>
          <DailyReminderBar setPage={goTo} />
        </Suspense>

        {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
        <section className={`hp-hero ${visible?'hp-hero--vis':''}`}>
          <div className="hp-hero-bg" aria-hidden="true">
            <div className="hp-hero-mesh" />
            {[...Array(6)].map((_,i)=><div key={i} className={`hp-geo hp-geo-${i+1}`}/>)}
            <div className="hp-hero-glow hp-glow-1" />
            <div className="hp-hero-glow hp-glow-2" />
            <div className="hp-hero-glow hp-glow-3" />
          </div>

          <div className="hp-hero-inner">
            <div className="hp-hero-content">
              <div className="hp-badge">
                <span className="hp-badge-dot" aria-hidden="true"/>
                <span aria-hidden="true">☪</span>
                <span>{tr(MOSQUE.locality, lang)}</span>
              </div>

              <h1 className="hp-hero-title">
                <span className="hp-ht-1">{brandFirst}</span>
                {brandLast && <>{' '}<span className="hp-ht-2">{brandLast}</span></>}
              </h1>

              <p className="hp-hero-sub">{tr(BRAND.tagline, lang)}</p>

              <figure className="hp-hero-ayah">
                <blockquote>
                  <p className="hp-ha-ar" lang="ar" dir="rtl">{HERO_HADITH.ar}</p>
                  {heroHadithText && <p className="hp-ha-tr">{heroHadithText}</p>}
                </blockquote>
                <figcaption className="hp-ha-ref">— {localizeSource(HERO_HADITH.source, lang)}</figcaption>
              </figure>

              <div className="hp-hero-btns">
                <button type="button" className="hp-btn-primary" onClick={()=>goTo('jamaat')}><span aria-hidden="true">⏰</span> {l.btnTimes}</button>
                <button type="button" className="hp-btn-sec" onClick={()=>goTo('announcements')}><span aria-hidden="true">📢</span> {l.btnAnn}</button>
                <button type="button" className="hp-btn-sec" onClick={()=>goTo('mosque')}><span aria-hidden="true">🕌</span> {l.btnMosque}</button>
              </div>
              {/* Hero-dakı qısa rəqəmlər (2000 · 6236 · 99 · 5) silinib — eyni
                  rəqəmlər bir az aşağıdakı statistika zolağında var. */}
            </div>

            <div className="hp-hero-visual">
              <PrayerWidget lang={lang} l={l} onMore={()=>goTo('jamaat')} />
            </div>
          </div>
        </section>

        {/* ═══ MƏSCİD — yeni bölmələrə qısa keçidlər ═══════════════════════ */}
        <nav className="hp-msq" aria-labelledby="hp-msq-ttl">
          <div className="hp-msq-in">
            <h2 id="hp-msq-ttl" className="hp-msq-ttl"><span aria-hidden="true">🕌</span>{l.msqTitle}</h2>
            {/* Telefonda qruplaşdırılmış siyahı (ikon kafeli + ox), kompüterdə 4 kart */}
            <ul className="hp-msq-grid" data-reveal="stagger">
              {MOSQUE_LINKS.map(c=>(
                <li key={c.page}>
                  <button type="button" className="hp-msq-card" onClick={()=>goTo(c.page)}>
                    <span className={`hp-msq-ic icon-tile icon-tile--${c.tone}`} aria-hidden="true">{c.icon}</span>
                    <span className="hp-msq-txt">
                      <strong>{L(c.title)}</strong>
                      <small>{L(c.desc)}</small>
                    </span>
                    <span className="hp-msq-go" aria-hidden="true">→</span>
                    <span className="hp-msq-chev m-row-chev" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* ═══ BISMILLAH ══════════════════════════════════════════════════ */}
      <div className="hp-bism" data-reveal="fade">
        <span className="hp-bism-ar" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
        {!isAr && (
          <span className="hp-bism-tr">
            {lk==='az'?'Rəhman və Rəhim olan Allahın adı ilə':lk==='ru'?'Во имя Аллаха, Милостивого, Милосердного':lk==='tr'?"Rahmân ve Rahîm olan Allah'ın adıyla":'In the Name of Allah, the Most Gracious, the Most Merciful'}
          </span>
        )}
      </div>

      {/* ═══ STATS ══════════════════════════════════════════════════════ */}
      <section className="hp-stats">
        <div className="hp-stats-in" data-reveal="stagger">
          {stats.map((s,i)=>(
            <div key={i} className="hp-stat">
              <div className="hp-stat-n"><CountUp end={s.num}/>{s.s}</div>
              <div className="hp-stat-l">{L(s.l)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TAWHEED ════════════════════════════════════════════════════ */}
      <section className="hp-tw">
        <div className="hp-tw-bg" aria-hidden="true"><div className="hp-tw-bg-geo"/><div className="hp-tw-bg-glow"/></div>
        <div className="hp-sec-in">

          <div className="hp-sec-hd" data-reveal>
            <div className="hp-ey hp-ey--gold"><span>☝️</span>{lk==='az'?'İslamın Əsası':lk==='ru'?'Основа ислама':lk==='ar'?'أساس الإسلام':lk==='tr'?'İslam\'ın Temeli':'Foundation of Islam'}</div>
            <h2 className="hp-sec-ttl hp-tw-ttl">
              {lk==='az'?'Tövhid — Allahın Birliyi':lk==='ru'?'Таухид — Единство Аллаха':lk==='ar'?'التوحيد — وحدانية الله':lk==='tr'?'Tevhid — Allah\'ın Birliği':'Tawheed — The Oneness of Allah'}
            </h2>
            <p className="hp-sec-sub">
              {lk==='az'?'Tövhid İslamın qəlbi və əsasıdır. O, Allahın yalnız bir olduğunu, heç bir şərikin, mislin, nəzirin olmadığını elan edir. Bütün peyğəmbərlər bu dəvətlə gəlmişdir.':
               lk==='ru'?'Таухид — сердце и основа ислама. Он утверждает, что Аллах один, без сотоварищей, подобных или равных. Все пророки пришли с этим призывом.':
               lk==='ar'?'التوحيد هو قلب الإسلام وأساسه. يُعلن أن الله واحد لا شريك له ولا مثيل ولا نظير. جاء بهذه الدعوة جميع الأنبياء والمرسلون.':
               lk==='tr'?'Tevhid İslam\'ın kalbi ve temelidir. Allah\'ın tek olduğunu, ortağı, benzeri ve dengi olmadığını ilan eder. Tüm peygamberler bu çağrıyla geldi.':
               'Tawheed is the heart and foundation of Islam. It proclaims that Allah is One — without partners, equals, or rivals. All prophets came with this call.'}
            </p>
          </div>

          {/* Kalima */}
          <div className="hp-kalima" data-reveal="scale">
            <div className="hp-kal-ar" lang="ar" dir="rtl">لَا إِلَهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ</div>
            {!isAr && (
              <div className="hp-kal-tr">
                {lk==='az'?'"Allahdan başqa ilah yoxdur, Muhəmməd Allahın elçisidir"':
                 lk==='ru'?'"Нет бога, кроме Аллаха; Мухаммад — Посланник Аллаха"':
                 lk==='tr'?'"Allah\'tan başka ilah yoktur; Muhammed Allah\'ın elçisidir"':
                 '"There is no god but Allah; Muhammad is the Messenger of Allah"'}
              </div>
            )}
            <div className="hp-kal-glow" aria-hidden="true"/>
          </div>

          {/* Üç növ — sekmələr. Ərəb dilində ad sətri ərəbcə başlığın təkrarıdır — gizlənir.
              Telefonda şaquli seqment idarəsidir: seçilmiş sətrin altındakı ağ
              "hap" (.hp-tw-thumb) yumşaq sürüşür (yalnız transform). */}
          <div className="hp-tw-tabs" data-reveal style={{'--tw-i':activeTW}}>
            <span className="hp-tw-thumb" aria-hidden="true" />
            {TAWHEED_PILLARS.map((p,i)=>(
              <button type="button" key={p.key} className={`hp-tw-tab ${activeTW===i?'hp-tw-tab--on':''}`}
                aria-pressed={activeTW===i}
                onClick={()=>{ if (activeTW!==i) haptic(); setActiveTW(i) }} style={{'--clr':p.color}}>
                <span className="hp-twtab-num" aria-hidden="true">{i+1}</span>
                <span className="hp-twtab-text">
                  <span className="hp-twtab-ar" lang="ar" dir="rtl">{p.ar}</span>
                  {!isAr && <span className="hp-twtab-nm">{p[lk]||p.en}</span>}
                </span>
              </button>
            ))}
          </div>

          {/* Seçilmiş növün paneli */}
          <div className="hp-tw-panel" style={{'--clr':twPillar.color}}>
            <div key={twPillar.key} className="hp-twp-content">
              <div className="hp-twp-badge" style={{background:twPillar.color}} aria-hidden="true">
                {activeTW+1}
              </div>
              <h3 className="hp-twp-ar" lang="ar" dir="rtl">{twPillar.ar}</h3>
              {!isAr && <h4 className="hp-twp-nm">{twPillar[lk]||twPillar.en}</h4>}
              <p className="hp-twp-desc">{L(twPillar.desc)}</p>
              <div className="hp-twp-ayah">
                <div className="hp-twp-a-ar" lang="ar" dir="rtl">{twPillar.ayah}</div>
                <div className="hp-twp-a-ref">— {L(twPillar.ayahRef)}</div>
              </div>
            </div>
          </div>

          {/* Faktlar — telefonda üfüqi sürüşən sıra */}
          <div className="hp-tw-facts" data-reveal="stagger">
            {TAWHEED_FACTS.map((f,i)=>(
              <div key={i} className="hp-tw-fact">
                <div className="hp-twf-ar" lang="ar" dir="rtl">{f.ar}</div>
                <div className="hp-twf-tr">{isAr ? f.arExpl : L(f)}</div>
              </div>
            ))}
          </div>

          {/* Kartlar — telefonda üfüqi sürüşən sıra */}
          <div className="hp-tw-info" data-reveal="stagger">
            <div className="hp-twi-card">
              <span className="hp-twi-ic">🌟</span>
              <h4>{lk==='az'?'Niyə Tövhid?':lk==='ru'?'Почему Таухид?':lk==='ar'?'لماذا التوحيد؟':lk==='tr'?'Neden Tevhid?':'Why Tawheed?'}</h4>
              <p>{lk==='az'?'Tövhid bütün peyğəmbərlərin — Nuh, İbrahim, Musa, İsa, Muhəmməd (s.a.s) — dəvət etdiyi əsas prinsipdir. Allah buyurur: "Biz hər ümmətə: Allaha ibadət edin, tağutdan çəkinin — deyə peyğəmbər göndərdik." (Nəhl 36)':
                  lk==='ru'?'Таухид — основной принцип, к которому призывали все пророки: Нух, Ибрахим, Муса, Иса, Мухаммад (мир им). Аллах говорит: "Мы отправили к каждому народу посланника с велением: поклоняйтесь Аллаху и избегайте тагута." (Нахль 36)':
                  lk==='ar'?'التوحيد هو المبدأ الأساسي الذي دعا إليه جميع الأنبياء — نوح وإبراهيم وموسى وعيسى ومحمد ﷺ. يقول الله: "وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ." (النحل 36)':
                  lk==='tr'?'Tevhid, tüm peygamberlerin — Nuh, İbrahim, Musa, İsa, Muhammed (s.a.s) — davet ettiği temel ilkedir. Allah buyurur: "Her ümmete Allah\'a ibadet edin, tağuttan kaçının diye peygamber gönderdik." (Nahl 36)':
                  'Tawheed is the core principle all prophets called to — Noah, Abraham, Moses, Jesus, Muhammad (peace be upon them). Allah says: "We sent to every nation a messenger: worship Allah and avoid false deities." (An-Nahl 36)'}</p>
            </div>
            <div className="hp-twi-card">
              <span className="hp-twi-ic">⚠️</span>
              <h4>{lk==='az'?'Şirkdən Uzaq Ol':lk==='ru'?'Избегай ширка':lk==='ar'?'ابتعد عن الشرك':lk==='tr'?'Şirkten Uzak Dur':'Avoid Shirk'}</h4>
              <p>{lk==='az'?'Şirk — Allaha ortaq qoşmaqdır. Bu ən böyük günahdır. Allah buyurur: "Həqiqətən, Allah Özünə şərik qoşulmasını bağışlamaz, bundan başqasını istədiyinə bağışlar." (Nisa 48) Şirk ibadəti batil edir, bağışlanmaz.':
                  lk==='ru'?'Ширк — придание сотоварищей Аллаху. Это величайший грех. Аллах говорит: "Аллах не прощает придания Ему сотоварищей, но прощает всё остальное, кому пожелает." (Ниса 48) Ширк обнуляет поклонение и не прощается.':
                  lk==='ar'?'الشرك هو إشراك شيء مع الله. وهو أعظم الذنوب. قال الله تعالى: "إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَاءُ." (النساء 48) الشرك يحبط العبادة ولا يُغفر.':
                  lk==='tr'?'Şirk, Allah\'a ortak koşmaktır. En büyük günahtır. Allah buyurur: "Allah kendisine şirk koşulmasını bağışlamaz; bunun dışındakini dilediği kimse için bağışlar." (Nisa 48) Şirk ibadeti iptal eder, affedilmez.':
                  'Shirk is associating partners with Allah — the greatest sin. Allah says: "Allah does not forgive that partners be associated with Him, but He forgives all else to whom He wills." (An-Nisa 48) Shirk nullifies worship and is unforgivable.'}</p>
            </div>
            <div className="hp-twi-card">
              <span className="hp-twi-ic">💎</span>
              <h4>{lk==='az'?'Tövhidin Meyvəsi':lk==='ru'?'Плоды Таухида':lk==='ar'?'ثمار التوحيد':lk==='tr'?'Tevhidin Meyvesi':'Fruits of Tawheed'}</h4>
              <p>{lk==='az'?'Tövhid qəlbə rahatlıq, həyata mənalılıq, günahlara kəffarə, cənnətə giriş açarı verir. Allah buyurur: "Elmlərini iman ilə qarışdırmayanlar — onlar üçün əmin-amanlıq vardır, haqq yola hidayət onlara məxsusdur." (Ənam 82)':
                  lk==='ru'?'Таухид дарует покой сердцу, смысл жизни, искупление грехов и ключ к раю. Аллах говорит: "Те, кто не смешивает своей веры с несправедливостью, — для них безопасность, и они на верном пути." (Аль-Анам 82)':
                  lk==='ar'?'التوحيد يمنح الطمأنينة للقلب والمعنى للحياة وكفارة للذنوب ومفتاحاً للجنة. قال الله: "الَّذِينَ آمَنُوا وَلَمْ يَلْبِسُوا إِيمَانَهُم بِظُلْمٍ أُولَٰئِكَ لَهُمُ الْأَمْنُ وَهُم مُّهْتَدُونَ." (الأنعام 82)':
                  lk==='tr'?'Tevhid kalbe huzur, hayata anlam, günahlara kefaret ve cennete giriş anahtarı verir. Allah buyurur: "İman edip imanlarını zulümle (şirk) karıştırmayanlar — güvende olanlar onlardır ve onlar doğru yoldadırlar." (En\'am 82)':
                  'Tawheed grants peace of heart, meaning in life, expiation of sins, and the key to Paradise. Allah says: "Those who believe and do not mix their faith with wrongdoing — for them is security, and they are rightly guided." (Al-An\'am 82)'}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════════════════ */}
      <section className="hp-feats">
        <div className="hp-sec-in">
          <div className="hp-sec-hd" data-reveal>
            <div className="hp-ey"><span aria-hidden="true">🌟</span> {l.featEy}</div>
            <h2 className="hp-sec-ttl">{l.featTitle}</h2>
            <p className="hp-sec-sub">{l.featSub}</p>
          </div>
          {/* Telefonda ikon rəngli kafeldədir (--tile = bölmənin rəngi), kompüterdə sadə emoji */}
          <div className="hp-feats-grid" data-reveal="stagger">
            {FEATURES.map(f=>(
              <button type="button" key={f.page} className="hp-feat" onClick={()=>goTo(f.page)} style={{'--fc':f.clr}}>
                <span className="hp-feat-top">
                  <span className="hp-feat-ic icon-tile" style={{'--tile':f.clr}} aria-hidden="true">{f.icon}</span>
                </span>
                <span className="hp-feat-ttl">{L(f.title)}</span>
                <span className="hp-feat-desc">{L(f.desc)}</span>
                <span className="hp-feat-go" aria-hidden="true">{l.featGo}</span>
                <span className="hp-feat-bg" aria-hidden="true">{f.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 99 NAMES ════════════════════════════════════════════════════ */}
      <section className="hp-names">
        <div className="hp-names-bg" aria-hidden="true"/>
        <div className="hp-sec-in">
          <div className="hp-sec-hd" data-reveal>
            <div className="hp-ey hp-ey--purple"><span aria-hidden="true">✨</span> <span lang="ar" dir="rtl">أسماء الله الحسنى</span></div>
            <h2 className="hp-sec-ttl">{lk==='az'?"Allahın 99 Gözəl Adı":lk==='ru'?'99 Прекрасных Имён Аллаха':lk==='ar'?'أسماء الله الحسنى':lk==='tr'?"Allah'ın 99 Güzel İsmi":'99 Beautiful Names of Allah'}</h2>
            <p className="hp-sec-sub">
              {lk==='az'?'"Allahın doxsan doqquz adı var; kim onları saya bilsə, cənnətə girər." — (Buxari)':
               lk==='ru'?'"У Аллаха девяносто девять имён; кто их перечислит, войдёт в рай." — (Бухари)':
               lk==='ar'?'"إن لله تسعة وتسعين اسماً من أحصاها دخل الجنة." — (البخاري)':
               lk==='tr'?'"Allah\'ın doksan dokuz ismi vardır; bunları bilen cennete girer." — (Buhari)':
               '"Allah has ninety-nine names; whoever enumerates them will enter Paradise." — (Bukhari)'}
            </p>
          </div>
          {/* Transliterasiya azərbaycancadır — yalnız az-da; ərəb dilində yalnız
              adın özü ("məna" sahəsi orada adın hərəkəsiz təkrarıdır) */}
          <div className={`hp-names-grid${isAr ? ' hp-names-grid--ar' : ''}`} data-reveal="stagger">
            {ALLAH_NAMES.map((n,i)=>(
              <div key={i} className="hp-name" style={{'--nc':n.color}}>
                <div className="hp-name-ar" lang="ar" dir="rtl">{n.ar}</div>
                {lang === 'az' && <div className="hp-name-az">{n.translit}</div>}
                {!isAr && <div className="hp-name-en">{n.meaning?.[lk] || n.meaning?.en}</div>}
              </div>
            ))}
          </div>
          <div className="hp-names-more">
            <button type="button" className="hp-btn-primary" onClick={()=>goTo('names')}>
              ✨ {lk==='az'?'Bütün 99 Adı Gör':lk==='ru'?'Все 99 имён':lk==='ar'?'عرض جميع الأسماء':lk==='tr'?'Tüm 99 İsmi Gör':'See All 99 Names'}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ QURAN BANNER ════════════════════════════════════════════════ */}
      <section className="hp-qban">
        <div className="hp-qban-in" data-reveal>
          <div className="hp-qban-l">
            <div className="hp-qban-ar" lang="ar" dir="rtl">إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ</div>
            {/* Ərəb dilində yalnız istinad — tərcümə ayənin təkrarı olardı.
                İstinad bölünmür ("— Hicr" / "9" ayrı sətirdə qalmasın) */}
            <div className="hp-qban-tr">
              {!isAr && <>{L(QBAN_TR)}{' '}</>}
              <span className="hp-qban-ref">— {L(QBAN_REF)}</span>
            </div>
          </div>
          <div className="hp-qban-r">
            <div className="hp-qban-st">
              {[{n:'114',l:{az:'Surə',en:'Surahs',ru:'Сур',tr:'Sure',ar:'سورة'}},
                {n:'6236',l:{az:'Ayə',en:'Verses',ru:'Аятов',tr:'Ayet',ar:'آية'}},
                {n:'30',l:{az:'Cüz',en:'Juz',ru:'Джузов',tr:'Cüz',ar:'جزء'}},
              ].map((s,i)=><div key={i} className="hp-qban-s"><span>{s.n}</span>{L(s.l)}</div>)}
            </div>
            <button type="button" className="hp-btn-primary" onClick={()=>goTo('quran')}>
              📖 {lk==='az'?'Quran Oxu':lk==='ru'?'Читать Коран':lk==='ar'?'اقرأ القرآن':lk==='tr'?'Kuran Oku':'Read Quran'}
            </button>
          </div>
        </div>
      </section>

      {/* Aşağıdakı bölmələr Firestore-dan gəlir və ekranın altındadır —
          fallback yoxdur ki, boş yer sıçrayışı (layout shift) olmasın. */}
      <Suspense fallback={null}>
        {/* ═══ HERO BANNER (admin) ═══ */}
        <HeroBannerDisplay setPage={goTo} />

        {/* ═══ ANNOUNCEMENTS — Ayrı bölmə kartlarla ═══ */}
        <AnnouncementSection />

        {/* ═══ DAILY ADMIN CONTENT ═══ */}
        <DailyContentDisplay />

        {/* ═══ VIDEO SECTION ═══ */}
        <VideoSection setPage={goTo} />

        {/* ═══ BOOK SECTION ═══ */}
        <BookSection setPage={goTo} />
      </Suspense>

      {/* ═══ CTA ══════════════════════════════════════════════════════════ */}
      <section className="hp-cta">
        <div className="hp-cta-bg" aria-hidden="true">
          <div className="hp-cta-g1"/><div className="hp-cta-g2"/><div className="hp-cta-pat"/>
        </div>
        <div className="hp-cta-in" data-reveal>
          <div className="hp-cta-ar" lang="ar" dir="rtl">{BRAND.arabicMotto}</div>
          <h2>{l.ctaTitle}</h2>
          <p>{l.ctaDesc}</p>
          <div className="hp-cta-btns">
            <button type="button" className="hp-btn-primary hp-cta-main" onClick={()=>goTo('jamaat')}><span aria-hidden="true">⏰</span> {l.ctaTimes}</button>
            <button type="button" className="hp-btn-out" onClick={openNotifications}><span aria-hidden="true">🔔</span> {l.ctaNotif}</button>
          </div>
          <div className="hp-cta-trust">
            <span><span aria-hidden="true">🔒</span> {l.adFree}</span>
            <span><span aria-hidden="true">✅</span> {l.free}</span>
            <span><span aria-hidden="true">🌍</span> {l.langs}</span>
          </div>
        </div>
      </section>

    </div>
  )
}
