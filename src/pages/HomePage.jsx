// ═══════════════════════════════════════════════════════
// Ana səhifə — Muslims.cc
//
// Yuxarıdan aşağı: günün xatırlatmaları zolağı → hero (brend, seçilmiş
// şəhərin namaz vaxtları kartı) → "Əsas" sürətli keçidlər → İslami bölmələr.
// Heç bir element üzmür və məzmunun üstünə düşmür (sahibin istəyi):
// üzən hero kartları və "Günün hədisi" toast-u silinib, gündəlik məzmun
// yuxarıdakı sakit zolaqdadır.
// Brend mətnləri yalnız src/config/brand.js-dən oxunur.
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, brandName, tr } from '../config/brand'
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { localizeSource } from '../utils/sourceNames'
import { haptic } from '../hooks/useHaptic'
import { DailyReminderBarSkeleton } from '../components/DailyReminderBarSkeleton'
import Icon from '../components/Icon'
import CityPicker from '../components/CityPicker'
import { HADITH_COUNT } from '../data/siteStats'
import { lazyWhenIdle } from '../utils/idle'

// PERFORMANS: hero-dan aşağıdakı bölmələr .ui-cv (ui.css → content-visibility:
// auto) alır — ekrandan uzaq olanda brauzer onların style/layout/paint işini
// atlayır. Rəqəmlər render olunmamış bölmənin təxmini hündürlüyüdür (ölçülüb:
// telefon / masaüstü orta qiyməti) — sürüşdürmə zolağı "atılmasın"; bölmə bir
// dəfə render olunandan sonra brauzer əsl hündürlüyü yadda saxlayır ("auto").
// Əlçatanlıq: "Tövhid" bölməsinin telefonda üfüqi sürüşən iki zolağı —
// içində fokuslana bilən element yoxdur, ona görə zolağın özü fokuslanır
// (tabIndex=0) ki, klaviatura ilə ox düymələri ilə sürüşdürmək olsun
// (axe: scrollable-region-focusable). role="region" + ad — ekran oxuyucusu üçün.
const TW_REGION = {
  facts: { az: 'Tövhid haqqında faktlar', en: 'Facts about Tawheed', ru: 'Факты о Таухиде', ar: 'حقائق عن التوحيد', tr: 'Tevhid hakkında gerçekler' },
  info:  { az: 'Tövhid haqqında məlumat kartları', en: 'Information cards about Tawheed', ru: 'Карточки о Таухиде', ar: 'بطاقات معلومات عن التوحيد', tr: 'Tevhid hakkında bilgi kartları' },
}

const CV = {
  feats: { '--cv-h': '1150px' },
  stats: { '--cv-h': '240px' },
  tw:    { '--cv-h': '1500px' },
  names: { '--cv-h': '680px' },
  cta:   { '--cv-h': '560px' },
}
// Günün xatırlatmaları zolağı quotes.js və duas.js-i (~235 KB) yükləyir —
// tənbəl yüklənir; yer tutucu (skeleton) hündürlüyü əvvəlcədən saxlayır.
const DailyReminderBar = lazy(() => import('../components/DailyReminderBar'))
// Bu bolmeler Firestore-dan melumat cekir (Firebase ~470 KB) ve hec biri
// ilk ekranda deyil. Lazy edilmesi Firebase-i ilk yuklenmeden cixarir.
// PERFORMANS: bu 5 bölmə Firestore-dan gəlir (hər biri Firebase SDK-nı, ~90 KB
// gzip, statik çəkir) və ekranın ALTINDADIR — chunk-ları "load"-dan sonra,
// boş vaxtda yüklənir (utils/idle.js). Əvvəl ana səhifənin ilk render-ində
// yüklənib LCP resursları ilə yarışırdı. Məzmun gələndə CTA-dan yuxarıda
// əlavə olunur — ekranın altında olduğu üçün görünən sıçrayış (CLS) yoxdur.
const VideoSection = lazy(lazyWhenIdle(() => import('../components/VideoSection')))
const BookSection = lazy(lazyWhenIdle(() => import('../components/BookSection')))
const DailyContentDisplay = lazy(lazyWhenIdle(() => import('../components/AdminContentDisplay').then(m => ({ default: m.DailyContentDisplay }))))
const AnnouncementSection = lazy(lazyWhenIdle(() => import('../components/AnnouncementSection')))
const HeroBannerDisplay = lazy(lazyWhenIdle(() => import('../components/HeroBannerDisplay')))
import '../styles/HomePage.css'
// PERFORMANS: AdminPage.css (47 KB) yox — yalnız ana səhifənin istifadə etdiyi
// .video-* qaydaları (HomeVideo.css, ~1.8 KB gzip; bax faylın başlığı)
import '../styles/HomeVideo.css'

// "Hərəkəti azalt" seçilibsə rəqəmlər saymır — dərhal son dəyər görünür
const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

// Statistika rəqəmi: görünəndə 0-dan sona qədər sayır (ease-out, yalnız mətn
// dəyişir — layout sabitdir, rəqəmlər tabular-nums). delay — sıradakı
// rəqəmlər növbə ilə başlasın. Ekran oxuyucu yalnız son dəyəri eşidir
// (sayılan rəqəm aria-hidden, yanında gizli son dəyər).
function CountUp({ end, duration = 1600, delay = 0 }) {
  const [count, setCount] = useState(() => (typeof window !== 'undefined' && !reducedMotion() && 'IntersectionObserver' in window ? 0 : end))
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    if (reducedMotion() || !('IntersectionObserver' in window)) { setCount(end); return undefined }
    let raf = 0
    let timer = 0
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        obs.disconnect()
        timer = window.setTimeout(() => {
          const start = performance.now()
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            setCount(Math.round(ease * end))
            if (p < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        }, delay)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => { obs.disconnect(); cancelAnimationFrame(raf); window.clearTimeout(timer) }
  }, [end, duration, delay])
  // Ayırıcısız yazılır — səhifənin qalan rəqəmləri (Quran zolağı, bölmələr)
  // kimi. toLocaleString() brauzerin dilinə görə "6,236" yazırdı.
  return (
    <>
      <span ref={ref} aria-hidden="true" className={count === end ? 'hp-cu is-done' : 'hp-cu'}>{String(count)}</span>
      <span className="ui-sr-only">{String(end)}</span>
    </>
  )
}

// Görünmə animasiyaları motion.css-in data-reveal sistemi ilədir (tək qlobal
// IntersectionObserver, hooks/useReveal.js) — səhifənin öz useInView-i silinib.

const pad2 = (n) => String(n).padStart(2, '0')

// Ana səhifədə yalnız 5 fərz namazı göstərilir (günəş — /jamaat səhifəsində)
const FARD_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// Hər namazın sətrində günün vaxtını göstərən xətti ikon (Icon.jsx):
// sübh — günəş doğur, zöhr — günəş, əsr — alçaq günəş, məğrib — batır,
// işa — ay. Emoji əvəzinə: rəngi tokendən, bütün sistemlərdə eyni görünür.
const PRAYER_ICON = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const PrayerTile = ({ k }) => (
  PRAYER_ICON[k] ? <span className="hp-pr-ic" aria-hidden="true"><Icon name={PRAYER_ICON[k]} size={18} /></span> : null
)

// ═══ Ana səhifənin mətnləri (5 dil) — LABELS[lang] || LABELS.en ═══
const LABELS = {
  az: {
    badge: 'Pulsuz İslami platforma',
    btnTimes: 'Namaz vaxtları', btnQuran: 'Quran oxu', btnAnn: 'Elanlar',
    pcTitle: 'Namaz vaxtları', calc: 'Hesablanmış', tomorrow: 'sabah', next: 'Növbəti',
    jumuaTag: 'Cümə', untilAdhan: 'azana qalıb',
    hm: (h, m) => (h ? `${h} saat ${m} dəqiqə` : `${m} dəqiqə`),
    allTimes: 'Bütün vaxtlar →',
    calcNote: (c) => `Azan vaxtları ${c} üçün aladhan.com ilə hesablanıb.`,
    loading: 'Namaz vaxtları yüklənir...', error: 'Namaz vaxtlarını yükləmək alınmadı.', retry: 'Yenidən cəhd et',
    mainTitle: 'Əsas',
    featEy: 'Saytda', featTitle: 'İslami bilik və ibadət',
    featSub: 'Quran, hədis, dua və digər faydalı bölmələr — hamısı pulsuz.', featGo: 'Keçid et →',
    ctaTitle: 'Hər gün İslamla birlikdə',
    ctaDesc: 'Namaz vaxtlarını izləyin, yeni elanlardan xəbərdar olun və İslami bilikləri bir yerdə öyrənin.',
    ctaTimes: 'Namaz vaxtları', ctaNotif: 'Bildiriş ayarları',
    adFree: 'Reklamsız', free: '100% pulsuz', langs: '5 dil',
  },
  en: {
    badge: 'A free Islamic platform',
    btnTimes: 'Prayer times', btnQuran: 'Read the Quran', btnAnn: 'Announcements',
    pcTitle: 'Prayer times', calc: 'Calculated', tomorrow: 'tomorrow', next: 'Next',
    jumuaTag: 'Jumu’ah', untilAdhan: 'until adhan',
    hm: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
    allTimes: 'All times →',
    calcNote: (c) => `Adhan times for ${c} are calculated via aladhan.com.`,
    loading: 'Loading prayer times...', error: 'Couldn’t load prayer times.', retry: 'Try again',
    mainTitle: 'Main',
    featEy: 'On the site', featTitle: 'Islamic knowledge & worship',
    featSub: 'Quran, hadith, duas and other useful sections — all free.', featGo: 'Open →',
    ctaTitle: 'With Islam, every day',
    ctaDesc: 'Follow the prayer times, keep up with new announcements and learn about Islam — all in one place.',
    ctaTimes: 'Prayer times', ctaNotif: 'Notification settings',
    adFree: 'Ad-free', free: '100% Free', langs: '5 Languages',
  },
  ru: {
    badge: 'Бесплатная исламская платформа',
    btnTimes: 'Время намаза', btnQuran: 'Читать Коран', btnAnn: 'Объявления',
    pcTitle: 'Время намаза', calc: 'Расчётное', tomorrow: 'завтра', next: 'Следующий',
    jumuaTag: 'Джума', untilAdhan: 'до азана',
    hm: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
    allTimes: 'Всё расписание →',
    calcNote: (c) => `Время азана для города ${c} рассчитано через aladhan.com.`,
    loading: 'Загрузка времени намаза...', error: 'Не удалось загрузить время намаза.', retry: 'Повторить',
    mainTitle: 'Главное',
    featEy: 'На сайте', featTitle: 'Исламские знания и поклонение',
    featSub: 'Коран, хадисы, дуа и другие полезные разделы — всё бесплатно.', featGo: 'Перейти →',
    ctaTitle: 'С исламом каждый день',
    ctaDesc: 'Следите за временем намаза и новыми объявлениями и изучайте ислам — всё в одном месте.',
    ctaTimes: 'Время намаза', ctaNotif: 'Настройки уведомлений',
    adFree: 'Без рекламы', free: '100% бесплатно', langs: '5 языков',
  },
  ar: {
    badge: 'منصة إسلامية مجانية',
    btnTimes: 'مواقيت الصلاة', btnQuran: 'اقرأ القرآن', btnAnn: 'الإعلانات',
    pcTitle: 'مواقيت الصلاة', calc: 'محسوبة', tomorrow: 'غدًا', next: 'التالية',
    jumuaTag: 'الجمعة', untilAdhan: 'حتى الأذان',
    hm: (h, m) => (h ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`),
    allTimes: 'جميع المواقيت ←',
    calcNote: (c) => `أوقات الأذان لمدينة ${c} محسوبة عبر aladhan.com.`,
    loading: 'جارٍ تحميل مواقيت الصلاة...', error: 'تعذّر تحميل مواقيت الصلاة.', retry: 'إعادة المحاولة',
    mainTitle: 'الرئيسية',
    featEy: 'في الموقع', featTitle: 'المعرفة الإسلامية والعبادة',
    featSub: 'القرآن والحديث والأدعية وأقسام مفيدة أخرى — كلها مجانًا.', featGo: 'انتقل ←',
    ctaTitle: 'مع الإسلام كل يوم',
    ctaDesc: 'تابع مواقيت الصلاة والإعلانات الجديدة وتعلّم عن الإسلام — في مكان واحد.',
    ctaTimes: 'مواقيت الصلاة', ctaNotif: 'إعدادات الإشعارات',
    adFree: 'بدون إعلانات', free: 'مجاني 100%', langs: '5 لغات',
  },
  tr: {
    badge: 'Ücretsiz İslami platform',
    btnTimes: 'Namaz vakitleri', btnQuran: "Kur'an oku", btnAnn: 'Duyurular',
    pcTitle: 'Namaz vakitleri', calc: 'Hesaplanmış', tomorrow: 'yarın', next: 'Sıradaki',
    jumuaTag: 'Cuma', untilAdhan: 'ezana kaldı',
    hm: (h, m) => (h ? `${h} saat ${m} dakika` : `${m} dakika`),
    allTimes: 'Tüm vakitler →',
    calcNote: (c) => `${c} ezan vakitleri aladhan.com ile hesaplanmıştır.`,
    loading: 'Namaz vakitleri yükleniyor...', error: 'Namaz vakitleri yüklenemedi.', retry: 'Tekrar dene',
    mainTitle: 'Ana Menü',
    featEy: 'Sitede', featTitle: 'İslami bilgi ve ibadet',
    featSub: "Kur'an, hadis, dua ve diğer faydalı bölümler — hepsi ücretsiz.", featGo: 'Git →',
    ctaTitle: 'Her gün İslam ile',
    ctaDesc: 'Namaz vakitlerini takip edin, yeni duyurulardan haberdar olun ve İslam hakkında bilgi edinin — hepsi tek yerde.',
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

// Hero-nun altındakı "Əsas" sırası — gündəlik ən çox lazım olan bölmələr.
// Adlar yan menyunun "Əsas" qrupu ilə uyğundur (data/navigation.js).
const MAIN_LINKS = [
  {
    page: 'prayer', icon: '🕐', tone: 'teal',
    title: { az: 'Namaz vaxtları', en: 'Prayer times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz vakitleri' },
    desc: { az: 'Şəhərinizin azan vaxtları və geri sayım', en: 'Adhan times for your city with a countdown', ru: 'Время азана в вашем городе и обратный отсчёт', ar: 'أوقات الأذان في مدينتك مع العدّ التنازلي', tr: 'Şehrinizin ezan vakitleri ve geri sayım' },
  },
  {
    page: 'jamaat', icon: '🤝', tone: 'gold',
    title: { az: 'Camaat və cümə', en: 'Congregation & Friday', ru: 'Джамаат и Джума', ar: 'الجماعة والجمعة', tr: 'Cemaat ve Cuma' },
    desc: { az: 'Camaat və cümə namazının fəziləti', en: 'The virtue of congregational and Friday prayer', ru: 'Достоинства коллективного и пятничного намаза', ar: 'فضل صلاة الجماعة والجمعة', tr: 'Cemaat ve cuma namazının fazileti' },
  },
  {
    page: 'announcements', icon: '📢', tone: 'orange',
    title: { az: 'Elanlar', en: 'Announcements', ru: 'Объявления', ar: 'الإعلانات', tr: 'Duyurular' },
    desc: { az: 'Saytın elanları və İslami günlər', en: 'Site announcements and Islamic days', ru: 'Объявления сайта и исламские дни', ar: 'إعلانات الموقع والأيام الإسلامية', tr: 'Site duyuruları ve İslami günler' },
  },
  {
    page: 'donate', icon: '💝', tone: 'rose',
    title: { az: 'Xeyriyyə və ianə', en: 'Charity & Giving', ru: 'Благотворительность', ar: 'الصدقة والتبرع', tr: 'Hayır ve Bağış' },
    desc: { az: 'Sədəqənin fəziləti və necə vermək', en: 'The virtue of charity and how to give', ru: 'Достоинство садаки и как её давать', ar: 'فضل الصدقة وكيفية إخراجها', tr: 'Sadakanın fazileti ve nasıl verilir' },
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
    desc: { az: 'Namaz vaxtları və namaz izləyicisi', en: 'Prayer times and a prayer tracker', ru: 'Время намаза и трекер намазов', ar: 'مواقيت الصلاة ومتابعة الصلوات', tr: 'Namaz vakitleri ve namaz takibi' } },
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
// from — əvvəlki fərz namazın azanının epoch ms-i: telefonda sayğacın
// altındakı nazik zolaq ötən vaxtın payını göstərir (yalnız transform:
// scaleX; kompüterdə zolaq gizlidir).
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
  const frac = span > 0 && span < 86400000 ? Math.min(1, Math.max(0, (now - from) / span)) : null
  return (
    <>
      {/* Saniyələr hər dəyişəndə yumşaq "döyünür" (key → animasiya yenidən
          başlayır; HomePage.css → .hp-pc-s) — sayğacın canlı hissi */}
      <span className="hp-pc-cd" role="timer" aria-label={label(h, m)}>
        {pad2(h)}:{pad2(m)}:<span key={s} className="hp-pc-s">{pad2(s)}</span>
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
// Ziyarətçinin yeri SORUŞULMUR (geolocation yoxdur): istifadəçinin /prayer-də
// seçdiyi şəhər (seçməyibsə standart şəhər) göstərilir — usePrayerTimes →
// utils/prayerLocation. Vaxtlar hesablanmışdır və belə qeyd olunur; kartda
// şəhərin adı yazılır. Camaat vaxtı YOXDUR (sayt konkret məscidin deyil).
// Cümə günü Zöhr sətrində "Cümə" nişanı görünür.
function PrayerWidget({ lang, l, onMore }) {
  const { error, prayers, next, isFriday, location, reload } = usePrayerTimes()
  const name = (k) => PRAYER_NAMES[k]?.[lang] || k
  const city = location?.city?.[lang] || ''
  const rows = prayers.filter(p => FARD_KEYS.includes(p.key))
  // İşadan sonra "növbəti" sabahın sübhüdür — bugünkü sətirlərin hamısı keçib
  const nextIdx = !next ? -1 : next.tomorrow ? rows.length : rows.findIndex(p => p.key === next.key)

  return (
    // v2: kartın başında başlıq + şəhər, altında "növbəti namaz" bloku —
    // iri geri sayım (display şrifti, bərabər enli rəqəmlər) və ötən vaxt
    // zolağı; sonra 5 vaxtın siyahısı. Emoji ikonlar xətti SVG ilə əvəzlənib.
    <section className="hp-pc" aria-labelledby="hp-pc-ttl">
      <div className="hp-pc-hdr">
        <div className="hp-pc-hdr-l">
          <h2 id="hp-pc-ttl" className="hp-pc-ttl">{l.pcTitle}</h2>
          {/* Şəhər adı — seçici açan düymə (components/CityPicker; seçim bütün saytda ortaqdır) */}
          <span className="hp-pc-sub">{city ? <><Icon name="pin" size={14} /> <CityPicker variant="inline" className="hp-pc-city" /> · {l.calc}</> : l.calc}</span>
        </div>
        <span className="hp-pc-ic ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="prayer" size={18} /></span>
      </div>
      {rows.length > 0 && next && (
        <div className="hp-pc-next">
          <span className="hp-pc-next-l">
            <span className="hp-pc-next-nm">{name(next.key)}{next.tomorrow ? ` · ${l.tomorrow}` : ''}</span>
            <span className="hp-pc-next-cap" aria-hidden="true">{l.untilAdhan}</span>
          </span>
          <Countdown at={next.at} from={next.prevAt} label={(h, m) => `${name(next.key)} — ${l.untilAdhan}: ${l.hm(h, m)}`} />
        </div>
      )}

      {rows.length > 0 ? (
        <ol className="hp-pr-list">
          {rows.map((p, i) => {
            const done = i < nextIdx
            const act = i === nextIdx
            return (
              <li key={p.key} className={`hp-pr${done ? ' hp-pr--done' : ''}${act ? ' hp-pr--act' : ''}`} style={{ '--i': i }}>
                <span className={`hp-pr-dot${done ? ' done' : act ? ' act' : ''}`} aria-hidden="true" />
                <PrayerTile k={p.key} />
                <span className="hp-pr-nm">
                  <span>{name(p.key)}</span>
                  {isFriday && p.key === 'dhuhr' && <span className="hp-pr-tag">{l.jumuaTag}</span>}
                  {act && <span className="hp-pr-badge">{l.next}</span>}
                </span>
                <span className="hp-pr-tm">{p.adhan}</span>
                <span className="hp-pr-chk" aria-hidden="true">{done ? <Icon name="check" size={14} strokeWidth={2.2} /> : ''}</span>
              </li>
            )
          })}
        </ol>
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

      {city && <p className="hp-pc-note">{l.calcNote(city)}</p>}
      <button type="button" className="hp-pc-more ui-btn ui-btn--secondary ui-btn--block" onClick={onMore}>{l.allTimes}</button>
    </section>
  )
}

const TAWHEED_PILLARS = [
  {
    icon:'☝️', key:'rub', ar:'تَوْحِيدُ الرُّبُوبِيَّة',
    az:'Rübubiyyət tövhidi', en:'Tawhid al-Rububiyyah', ru:'Таухид ар-Рубубийя', tr:'Rububiyyet Tevhidi',
    desc:{
      az:'Allahın Rəbb olduğuna inanmaqdır — O hər şeyin yaradıcısı, ruzi verəni və idarəçisidir. Heç kim Onun yaratmaq, öldürmək, diriltmək, ruzi vermək, idarə etmək kimi xüsusiyyətlərində Ona şərik ola bilməz.',
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
    az:'Uluhiyyət tövhidi', en:'Tawhid al-Uluhiyyah', ru:'Таухид аль-Улюхийя', tr:'Uluhiyyet Tevhidi',
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
    az:'Əsma və sifat tövhidi', en:'Tawhid al-Asma was-Sifat', ru:'Таухид аль-Асма уа ас-Сыфат', tr:'Esma ve Sıfat Tevhidi',
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
  { arExpl:'لا يشبهه شيء، ولا يساويه أحد', ar:'لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُواً أَحَدٌ', az:'O doğmadı, doğulmadı — heç bir şeyə bənzəmir, heç kim Onun bənzəri deyil', en:'He neither begot nor was begotten — nothing resembles Him, none equals Him', ru:'Он не рожает и не рождён — ничто Ему не подобно', tr:'O doğurmadı ve doğulmadı — hiçbir şey O\'na benzemez' },
]

// Quran zolağı — Hicr 9 ayəsinin tərcüməsi (əvvəlki mətn olduğu kimi) və
// istinad ayrıca saxlanılır ki, istinad sətirdə bölünməsin
const QBAN_TR = {
  // lang-ok: ar-da tərcümə göstərilmir — ərəbcə ayənin özü göstərilir (isAr)
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

  // Brend adı domen kimi iki hissədə: "Muslims" + yaşıl ".cc" (başlıqdakı loqo kimi)
  const brand = brandName(lang).trim()
  const dot = brand.lastIndexOf('.')
  const brandFirst = dot > 0 ? brand.slice(0, dot) : brand
  const brandLast = dot > 0 ? brand.slice(dot) : ''
  const heroHadithText = lang === 'ar' ? '' : tr(HERO_HADITH.text, lang)

  const stats=[
    {num:114,  s:'',  l:{az:'Quran surəsi',  en:'Quran Surahs',   ru:'Сур Корана',    tr:'Sure',         ar:'سورة'}},
    {num:6236, s:'',  l:{az:'Quran ayəsi',   en:'Quran Verses',   ru:'Аятов Корана',  tr:'Ayet',         ar:'آية'}},
    // Təkrarsız 1394 hədis — "1350+" (bax: data/siteStats.js)
    {num:HADITH_COUNT, s:'+', l:{az:'Hədis',  en:'Hadiths',        ru:'Хадисов',       tr:'Hadis',        ar:'حديث'}},
    {num:99,   s:'',  l:{az:"Allahın adı",   en:"Names of Allah", ru:'Имён Аллаха',   tr:"Allah'ın İsmi",ar:'اسمًا لله'}},
    {num:5,    s:'',  l:{az:'Dil',            en:'Languages',      ru:'Языков',        tr:'Dil',          ar:'لغات'}},
    {num:100,  s:'%', l:{az:'Pulsuz',         en:'Free',           ru:'Бесплатно',     tr:'Ücretsiz',     ar:'مجاناً'}},
  ]

  return (
    <div className="hp-root">

      {/* Zolaq + hero + "Əsas" sırası eyni fonda */}
      <div className="hp-top">

        {/* ═══ GÜNÜN XATIRLATMALARI — başlığın düz altında, axında (üzmür) ═══
            Öz Suspense sərhədi var: yer tutucu hündürlüyü əvvəlcədən saxlayır.
            Ziyarətçi bu gün bağlayıbsa həm zolaq, həm yer tutucu null qaytarır. */}
        <Suspense fallback={<DailyReminderBarSkeleton />}>
          <DailyReminderBar setPage={goTo} />
        </Suspense>

        {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
        {/* v2: fil sümüyü fon + yalnız İNCƏ xatəm naxışı (ui.css → .ui-pattern,
            rəngi --pattern-color tokenindən) və bir yumşaq zümrüd işıq. Əvvəlki
            fırlanan ulduzlar, üzən işıqlar və nöqtə şəbəkəsi götürülüb — sakitlik. */}
        <section className={`hp-hero ${visible?'hp-hero--vis':''}`}>
          <div className="hp-hero-bg" aria-hidden="true">
            <div className="ui-pattern ui-pattern--fade hp-hero-pattern" />
            <div className="hp-hero-glow" />
          </div>

          <div className="hp-hero-inner">
            <div className="hp-hero-content">
              <span className="ui-eyebrow hp-badge">{l.badge}</span>

              <h1 className="hp-hero-title">
                {/* "Muslims" + ".cc" bir sətirdə (domen kimi oxunsun) */}
                <span className="hp-ht-row">
                  <span className="hp-ht-1">{brandFirst}</span>
                  {brandLast && <span className="hp-ht-2">{brandLast}</span>}
                </span>
              </h1>

              <p className="hp-hero-sub">{tr(BRAND.tagline, lang)}</p>

              {/* Hədis — ui.css → .ui-quote (başlanğıc kənarda qızılı xətt) */}
              <figure className="ui-quote hp-hero-ayah">
                <blockquote>
                  <p className="ui-quote__ar ui-arabic hp-ha-ar" lang="ar" dir="rtl">{HERO_HADITH.ar}</p>
                  {heroHadithText && <p className="ui-quote__text hp-ha-tr">{heroHadithText}</p>}
                </blockquote>
                <figcaption className="ui-quote__src hp-ha-ref">— {localizeSource(HERO_HADITH.source, lang)}</figcaption>
              </figure>

              <div className="hp-hero-btns">
                <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={()=>goTo('prayer')}><Icon name="prayer" className="ui-btn__icon" /> {l.btnTimes}</button>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--lg" onClick={()=>goTo('quran')}><Icon name="quran" className="ui-btn__icon" /> {l.btnQuran}</button>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--lg" onClick={()=>goTo('announcements')}><Icon name="announcements" className="ui-btn__icon" /> {l.btnAnn}</button>
              </div>
              {/* Hero-dakı qısa rəqəmlər (2000 · 6236 · 99 · 5) silinib — eyni
                  rəqəmlər bir az aşağıdakı statistika zolağında var. */}
            </div>

            <div className="hp-hero-visual">
              <PrayerWidget lang={lang} l={l} onMore={()=>goTo('prayer')} />
            </div>
          </div>
        </section>

        {/* ═══ ƏSAS — gündəlik bölmələrə qısa keçidlər ═══════════════════ */}
        <nav className="hp-msq" aria-labelledby="hp-msq-ttl">
          <div className="hp-msq-in">
            <h2 id="hp-msq-ttl" className="hp-msq-ttl ui-eyebrow">{l.mainTitle}</h2>
            {/* Telefonda qruplaşdırılmış siyahı (ikon + ox), kompüterdə 4 sakit kart.
                v2: rəngli tonlar (data-tone) götürülüb — hamısı eyni zümrüd kafel */}
            <ul className="hp-msq-grid" data-reveal="stagger">
              {MAIN_LINKS.map(c=>(
                <li key={c.page}>
                  <button type="button" className="hp-msq-card" onClick={()=>goTo(c.page)}>
                    <span className="hp-msq-ic ui-icon-tile" aria-hidden="true"><Icon name={c.page} /></span>
                    <span className="hp-msq-txt">
                      <strong>{L(c.title)}</strong>
                      <small>{L(c.desc)}</small>
                    </span>
                    <span className="hp-msq-go" aria-hidden="true"><Icon name="arrow" size={18} className="ui-flip-rtl" /></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* ═══ BÖLMƏLƏR — "bento" şəbəkəsi ═══════════════════════════════
          v2: əvvəlki "Saytda" kartları + ayrıca Quran zolağı BİR şəbəkədə.
          Böyük Quran kafeli Hicr 9 ayəsini, 114/6236/30 rəqəmlərini və
          "Quran oxu" düyməsini saxlayır (Quran zolağının məzmunu); qalan
          bölmələr kiçik kafellərdir. Rəngli emoji/rəng kodları yoxdur —
          xətti ikonlar (Icon.jsx), hamısı eyni sakit palitrada. */}
      <section className="hp-feats ui-cv" style={CV.feats} aria-labelledby="hp-feats-ttl">
        <div className="hp-sec-in">
          <div className="hp-sec-hd" data-reveal>
            <span className="ui-eyebrow">{l.featEy}</span>
            <h2 id="hp-feats-ttl" className="ui-title hp-sec-ttl">{l.featTitle}</h2>
            <p className="hp-sec-sub">{l.featSub}</p>
          </div>
          <div className="hp-bento" data-reveal="stagger">
            {/* Quran — iri kafel (2×2) */}
            <div className="hp-bento-quran">
              <div className="ui-pattern hp-bq-pattern" aria-hidden="true" />
              <div className="hp-bq-top">
                <span className="ui-icon-tile ui-icon-tile--lg hp-bq-ic" aria-hidden="true"><Icon name="quran" /></span>
                <span className="hp-bq-ttl">{L(FEATURES[0].title)}</span>
                <span className="hp-bq-desc">{L(FEATURES[0].desc)}</span>
              </div>
              <div className="hp-qban-l">
                <div className="hp-qban-ar ui-arabic" lang="ar" dir="rtl">إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ</div>
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
                <button type="button" className="ui-btn ui-btn--inverse" onClick={()=>goTo('quran')}>
                  {l.btnQuran}
                  <Icon name="arrow" size={18} className="ui-btn__icon ui-flip-rtl" />
                </button>
              </div>
            </div>
            {/* Qalan bölmələr — kiçik kafellər (<button>: klaviatura ilə də açılır) */}
            {FEATURES.slice(1).map(f=>(
              <button type="button" key={f.page} className={`hp-feat hp-feat--${f.page}`} onClick={()=>goTo(f.page)}>
                <span className="hp-feat-top">
                  <span className="hp-feat-ic ui-icon-tile" aria-hidden="true"><Icon name={f.page} /></span>
                  <span className="hp-feat-go" aria-hidden="true"><Icon name="arrow" size={18} className="ui-flip-rtl" /></span>
                </span>
                <span className="hp-feat-ttl">{L(f.title)}</span>
                <span className="hp-feat-desc">{L(f.desc)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BISMILLAH ══════════════════════════════════════════════════ */}
      <div className="hp-bism" data-reveal="fade">
        <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star" /></div>
        <span className="hp-bism-ar" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
        {!isAr && (
          <span className="hp-bism-tr">
            {lk==='az'?'Rəhman və Rəhim olan Allahın adı ilə':lk==='ru'?'Во имя Аллаха, Милостивого, Милосердного':lk==='tr'?"Rahmân ve Rahîm olan Allah'ın adıyla":'In the Name of Allah, the Most Gracious, the Most Merciful'}
          </span>
        )}
      </div>

      {/* ═══ STATS ══════════════════════════════════════════════════════ */}
      <section className="hp-stats ui-cv" style={CV.stats}>
        <div className="hp-stats-in" data-reveal="stagger">
          {stats.map((s,i)=>(
            <div key={i} className="hp-stat">
              <div className="hp-stat-n"><CountUp end={s.num} delay={i * 90} />{s.s && <span className="hp-stat-sfx">{s.s}</span>}</div>
              <div className="hp-stat-l">{L(s.l)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TAWHEED ════════════════════════════════════════════════════ */}
      <section className="hp-tw ui-cv" style={CV.tw}>
        {/* v2: tünd zümrüd "inverse" bölmə + incə xatəm naxışı (ui.css) */}
        <div className="ui-pattern hp-tw-pattern" aria-hidden="true" />
        <div className="hp-sec-in">

          <div className="hp-sec-hd" data-reveal>
            <div className="ui-eyebrow hp-tw-ey">{lk==='az'?'İslamın əsası':lk==='ru'?'Основа ислама':lk==='ar'?'أساس الإسلام':lk==='tr'?'İslam\'ın Temeli':'Foundation of Islam'}</div>
            <h2 className="ui-title hp-sec-ttl hp-tw-ttl">
              {lk==='az'?'Tövhid — Allahın birliyi':lk==='ru'?'Таухид — Единство Аллаха':lk==='ar'?'التوحيد — وحدانية الله':lk==='tr'?'Tevhid — Allah\'ın Birliği':'Tawheed — The Oneness of Allah'}
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
                onClick={()=>{ if (activeTW!==i) haptic(); setActiveTW(i) }}>
                <span className="hp-twtab-num" aria-hidden="true">{i+1}</span>
                <span className="hp-twtab-text">
                  <span className="hp-twtab-ar" lang="ar" dir="rtl">{p.ar}</span>
                  {!isAr && <span className="hp-twtab-nm">{p[lk]||p.en}</span>}
                </span>
              </button>
            ))}
          </div>

          {/* Seçilmiş növün paneli */}
          <div className="hp-tw-panel">
            <div key={twPillar.key} className="hp-twp-content">
              {/* Nişan (sıra) və ərəbcə ad bir sətirdə — əvvəl nişan tək sətirdə
                  qalıb üstdə boş yer yaradırdı */}
              <div className="hp-twp-head">
                <span className="hp-twp-badge" aria-hidden="true">{activeTW+1}</span>
                <h3 className="hp-twp-ar" lang="ar" dir="rtl">{twPillar.ar}</h3>
              </div>
              {!isAr && <h4 className="hp-twp-nm">{twPillar[lk]||twPillar.en}</h4>}
              <p className="hp-twp-desc">{L(twPillar.desc)}</p>
              <div className="hp-twp-ayah">
                <div className="hp-twp-a-ar" lang="ar" dir="rtl">{twPillar.ayah}</div>
                <div className="hp-twp-a-ref">— {L(twPillar.ayahRef)}</div>
              </div>
            </div>
          </div>

          {/* Faktlar — telefonda üfüqi sürüşən sıra */}
          <div className="hp-tw-facts" data-reveal="stagger" tabIndex={0} role="region" aria-label={L(TW_REGION.facts)}>
            {TAWHEED_FACTS.map((f,i)=>(
              <div key={i} className="hp-tw-fact">
                <div className="hp-twf-ar" lang="ar" dir="rtl">{f.ar}</div>
                <div className="hp-twf-tr">{isAr ? f.arExpl : L(f)}</div>
              </div>
            ))}
          </div>

          {/* Kartlar — telefonda üfüqi sürüşən sıra */}
          <div className="hp-tw-info" data-reveal="stagger" tabIndex={0} role="region" aria-label={L(TW_REGION.info)}>
            <div className="hp-twi-card">
              <span className="hp-twi-ic ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="names" /></span>
              <h4>{lk==='az'?'Niyə Tövhid?':lk==='ru'?'Почему Таухид?':lk==='ar'?'لماذا التوحيد؟':lk==='tr'?'Neden Tevhid?':'Why Tawheed?'}</h4>
              <p>{lk==='az'?'Tövhid bütün peyğəmbərlərin — Nuh, İbrahim, Musa, İsa, Muhəmməd (s.a.s) — dəvət etdiyi əsas prinsipdir. Allah buyurur: "Biz hər ümmətə: Allaha ibadət edin, tağutdan çəkinin — deyə peyğəmbər göndərdik." (Nəhl 36)':
                  lk==='ru'?'Таухид — основной принцип, к которому призывали все пророки: Нух, Ибрахим, Муса, Иса, Мухаммад (мир им). Аллах говорит: "Мы отправили к каждому народу посланника с велением: поклоняйтесь Аллаху и избегайте тагута." (Нахль 36)':
                  lk==='ar'?'التوحيد هو المبدأ الأساسي الذي دعا إليه جميع الأنبياء — نوح وإبراهيم وموسى وعيسى ومحمد ﷺ. يقول الله: "وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ." (النحل 36)':
                  lk==='tr'?'Tevhid, tüm peygamberlerin — Nuh, İbrahim, Musa, İsa, Muhammed (s.a.s) — davet ettiği temel ilkedir. Allah buyurur: "Her ümmete Allah\'a ibadet edin, tağuttan kaçının diye peygamber gönderdik." (Nahl 36)':
                  'Tawheed is the core principle all prophets called to — Noah, Abraham, Moses, Jesus, Muhammad (peace be upon them). Allah says: "We sent to every nation a messenger: worship Allah and avoid false deities." (An-Nahl 36)'}</p>
            </div>
            <div className="hp-twi-card">
              <span className="hp-twi-ic ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="shield" /></span>
              <h4>{lk==='az'?'Şirkdən uzaq ol':lk==='ru'?'Избегай ширка':lk==='ar'?'ابتعد عن الشرك':lk==='tr'?'Şirkten Uzak Dur':'Avoid Shirk'}</h4>
              <p>{lk==='az'?'Şirk — Allaha ortaq qoşmaqdır. Bu ən böyük günahdır. Allah buyurur: "Həqiqətən, Allah Özünə şərik qoşulmasını bağışlamaz, bundan başqasını istədiyinə bağışlar." (Nisa 48) Şirk ibadəti batil edir, bağışlanmaz.':
                  lk==='ru'?'Ширк — придание сотоварищей Аллаху. Это величайший грех. Аллах говорит: "Аллах не прощает придания Ему сотоварищей, но прощает всё остальное, кому пожелает." (Ниса 48) Ширк обнуляет поклонение и не прощается.':
                  lk==='ar'?'الشرك هو إشراك شيء مع الله. وهو أعظم الذنوب. قال الله تعالى: "إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَاءُ." (النساء 48) الشرك يحبط العبادة ولا يُغفر.':
                  lk==='tr'?'Şirk, Allah\'a ortak koşmaktır. En büyük günahtır. Allah buyurur: "Allah kendisine şirk koşulmasını bağışlamaz; bunun dışındakini dilediği kimse için bağışlar." (Nisa 48) Şirk ibadeti iptal eder, affedilmez.':
                  'Shirk is associating partners with Allah — the greatest sin. Allah says: "Allah does not forgive that partners be associated with Him, but He forgives all else to whom He wills." (An-Nisa 48) Shirk nullifies worship and is unforgivable.'}</p>
            </div>
            <div className="hp-twi-card">
              <span className="hp-twi-ic ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="donate" /></span>
              <h4>{lk==='az'?'Tövhidin meyvəsi':lk==='ru'?'Плоды Таухида':lk==='ar'?'ثمار التوحيد':lk==='tr'?'Tevhidin Meyvesi':'Fruits of Tawheed'}</h4>
              <p>{lk==='az'?'Tövhid qəlbə rahatlıq, həyata mənalılıq, günahlara kəffarə, cənnətə giriş açarı verir. Allah buyurur: "İman gətirib imanlarını zülmlə qarışdırmayanlar — əmin-amanlıq onlar üçündür və onlar doğru yoldadırlar." (Ənam 82)':
                  lk==='ru'?'Таухид дарует покой сердцу, смысл жизни, искупление грехов и ключ к раю. Аллах говорит: "Те, кто не смешивает своей веры с несправедливостью, — для них безопасность, и они на верном пути." (Аль-Анам 82)':
                  lk==='ar'?'التوحيد يمنح الطمأنينة للقلب والمعنى للحياة وكفارة للذنوب ومفتاحاً للجنة. قال الله: "الَّذِينَ آمَنُوا وَلَمْ يَلْبِسُوا إِيمَانَهُم بِظُلْمٍ أُولَٰئِكَ لَهُمُ الْأَمْنُ وَهُم مُّهْتَدُونَ." (الأنعام 82)':
                  lk==='tr'?'Tevhid kalbe huzur, hayata anlam, günahlara kefaret ve cennete giriş anahtarı verir. Allah buyurur: "İman edip imanlarını zulümle (şirk) karıştırmayanlar — güvende olanlar onlardır ve onlar doğru yoldadırlar." (En\'am 82)':
                  'Tawheed grants peace of heart, meaning in life, expiation of sins, and the key to Paradise. Allah says: "Those who believe and do not mix their faith with wrongdoing — for them is security, and they are rightly guided." (Al-An\'am 82)'}</p>
            </div>
          </div>

        </div>
      </section>


      {/* ═══ 99 NAMES ════════════════════════════════════════════════════ */}
      <section className="hp-names ui-cv" style={CV.names}>
        <div className="hp-sec-in">
          <div className="hp-sec-hd" data-reveal>
            <div className="ui-eyebrow"><span lang="ar" dir="rtl">أسماء الله الحسنى</span></div>
            <h2 className="ui-title hp-sec-ttl">{lk==='az'?"Allahın 99 gözəl adı":lk==='ru'?'99 Прекрасных Имён Аллаха':lk==='ar'?'أسماء الله الحسنى':lk==='tr'?"Allah'ın 99 Güzel İsmi":'99 Beautiful Names of Allah'}</h2>
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
              <div key={i} className="hp-name">
                <div className="hp-name-ar" lang="ar" dir="rtl">{n.ar}</div>
                {lang === 'az' && <div className="hp-name-az">{n.translit}</div>}
                {!isAr && <div className="hp-name-en">{n.meaning?.[lk] || n.meaning?.en}</div>}
              </div>
            ))}
          </div>
          <div className="hp-names-more">
            <button type="button" className="ui-btn ui-btn--secondary" onClick={()=>goTo('names')}>
              {lk==='az'?'Bütün 99 adı gör':lk==='ru'?'Все 99 имён':lk==='ar'?'عرض جميع الأسماء':lk==='tr'?'Tüm 99 İsmi Gör':'See All 99 Names'}
              <Icon name="arrow" size={18} className="ui-btn__icon ui-flip-rtl" />
            </button>
          </div>
        </div>
      </section>

      {/* Quran zolağı (Hicr 9 + 114/6236/30 + "Quran oxu") yuxarıdakı bento
          şəbəkəsinin iri Quran kafelinə köçürülüb — məzmun eynidir. */}

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
      {/* v2: tünd zümrüd panel (kənarlardan içəri, yuvarlaq künclü), incə
          xatəm naxışı; emoji əvəzinə xətti ikonlar */}
      <section className="hp-cta ui-cv" style={CV.cta}>
        <div className="hp-cta-in" data-reveal>
          <div className="ui-pattern hp-cta-pat" aria-hidden="true" />
          <div className="hp-cta-ar" lang="ar" dir="rtl">{BRAND.arabicMotto}</div>
          <h2>{l.ctaTitle}</h2>
          <p>{l.ctaDesc}</p>
          <div className="hp-cta-btns">
            <button type="button" className="ui-btn ui-btn--inverse ui-btn--lg hp-cta-main" onClick={()=>goTo('prayer')}><Icon name="prayer" className="ui-btn__icon" /> {l.ctaTimes}</button>
            <button type="button" className="ui-btn ui-btn--inverse-ghost ui-btn--lg" onClick={openNotifications}><Icon name="bell" className="ui-btn__icon" /> {l.ctaNotif}</button>
          </div>
          <div className="hp-cta-trust">
            <span><Icon name="shield" size={16} /> {l.adFree}</span>
            <span><Icon name="check" size={16} /> {l.free}</span>
            <span><Icon name="globe" size={16} /> {l.langs}</span>
          </div>
        </div>
      </section>

    </div>
  )
}
