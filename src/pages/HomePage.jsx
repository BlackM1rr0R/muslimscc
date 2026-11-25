// ═══════════════════════════════════════════════════════
// Ana səhifə — Muslims.cc
//
// Dizayn v3 — saytın "vitrin" səhifəsi. Yuxarıdan aşağı:
//   günün xatırlatmaları zolağı → hero (bu sayt nədir + 2 əsas düymə +
//   namaz vaxtları kartı) → "Nə axtarırsınız?" (12 bölmə, ikon kafelləri) →
//   "Haradan başlamalı?" (4 addım) → Quran kafeli + rəqəmlər (StatTile) →
//   Tövhid → 99 ad → admin məzmunu / təddəbür / video / kitab → CTA.
// Ortaq komponentlər: ui.css (.ui-tiles, .ui-steps, .ui-stats) və
// components/viz (StatTile) — digər səhifələr üçün nümunədir.
// Heç bir element üzmür və məzmunun üstünə düşmür (sahibin istəyi):
// üzən hero kartları və "Günün hədisi" toast-u silinib, gündəlik məzmun
// yuxarıdakı sakit zolaqdadır.
// Brend mətnləri yalnız src/config/brand.js-dən oxunur.
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense, Fragment } from 'react'
import HeroOrnament from '../components/HeroOrnament'
import RamadanLanterns from '../components/home/RamadanLanterns'
import DeferRender from '../components/DeferRender'
import { useLang } from '../contexts/LangContext'
import { BRAND, brandName, tr } from '../config/brand'
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { DailyReminderBarSkeleton } from '../components/DailyReminderBarSkeleton'
import Icon from '../components/Icon'
import { pathFor, parsePath, uiLang } from '../seo/routes'
import { preloadDailyPools } from '../utils/dailyPoolsStore'
import CityPicker from '../components/CityPicker'
import HeroGreeting from '../components/home/HeroGreeting'
import { lazyWhenIdle } from '../utils/idle'
import { readLayout, visibleIds, LAYOUT_EVENT, LAYOUT_KEY } from '../utils/homeLayout'
// Sadə rejim başlanğıc ekran kimi seçilibsə — ilk açılışda /simple (heç nə render etmir)
import SimpleStart from '../components/simple/SimpleStart'
// Bələdçi turu (batch D) — kiçik düymə; tur özü App-dəki TourHost-dadır
import TourButton from '../components/tour/TourButton'

// PERFORMANS: hero-dan aşağıdakı statik bölmələr (Haradan başlamalı, Quran +
// rəqəmlər, Tövhid, 99 ad, CTA) ayrıca chunk-dadır (components/home/HomeSections)
// və yalnız bölməyə yaxınlaşanda (DeferRender idle={false}, NEAR) yüklənir — əvvəl
// mətnləri və NumberTicker/StatTile/KhatmPulse ilk yükləmədə endirilirdi.
// Bölmələr .ui-cv (ui.css → content-visibility: auto) alır. Rəqəmlər render
// olunmamış bölmənin təxmini hündürlüyüdür (ölçülüb: telefon / masaüstü orta
// qiyməti) — yer tutucu da eyni hündürlükdədir, sürüşdürmə zolağı "atılmır".
const NEAR = '900px 0px'
const Ph = ({ h }) => <div className="defer-ph" style={{ minHeight: h['--cv-h'] }} aria-hidden="true" />
const HS = () => import('../components/home/HomeSections')
const StartSection = lazy(() => HS().then((m) => ({ default: m.StartSection })))
const FeatsSection = lazy(() => HS().then((m) => ({ default: m.FeatsSection })))
const TawheedSection = lazy(() => HS().then((m) => ({ default: m.TawheedSection })))
const NamesSection = lazy(() => HS().then((m) => ({ default: m.NamesSection })))
const CtaSection = lazy(() => HS().then((m) => ({ default: m.CtaSection })))
const CV = {
  start: { '--cv-h': '420px' },
  feats: { '--cv-h': '560px' },
  tw:    { '--cv-h': '1500px' },
  names: { '--cv-h': '680px' },
  cta:   { '--cv-h': '420px' },
}
// Günün xatırlatmaları zolağı — tənbəl yüklənir; yer tutucu (skeleton) hündürlüyü əvvəlcədən saxlayır.
// Hovuzlar YALNIZ cari dildə (utils/dailyPoolsStore → "daily-pools-<dil>" chunk-ı, ~15 KB gzip) —
// zolağın chunk-ı ilə PARALEL başlayır (ardıcıl gediş-gəliş olmasın). Dil ünvandandır (LangContext kimi).
const pageLang = () => { try { return uiLang(parsePath(window.location.pathname).lang) } catch { return 'az' } }
const withPools = (load) => () => { preloadDailyPools(pageLang()); return load() }
// Modul yüklənəndə (ilk render-dən ƏVVƏL, main.jsx → preloadInitialPage) başlat: Vite-in preload köməkçisi
// asılılığı olmayan import()-u bir mikrotapşırıq gecikdirir — render içində çağırılanda sorğu ana səhifənin
// bütün sinxron render-i bitəndən sonra gedirdi (CPU ×4-də ~230 ms, zolağın chunk-ından SONRA; ölçülüb).
if (typeof window !== 'undefined') preloadDailyPools(pageLang())
const DailyReminderBar = lazy(withPools(() => import('../components/DailyReminderBar')))
// PERFORMANS: bu 5 bölmə admin məzmununu serverdən (/api/content) çəkir və
// ekranın ALTINDADIR — chunk-ları və sorğuları yalnız bölgəyə yaxınlaşanda
// (DeferRender idle={false}) başlayır; əvvəl boş vaxtda (sürüşdürülməsə də)
// yüklənirdi (~35 KB gzip + /api/content sorğuları). Məzmun gələndə ekranın
// altında əlavə olunur — görünən sıçrayış (CLS) yoxdur.
const VideoSection = lazy(() => import('../components/VideoSection'))
// v5.7: indiki hava + uyğun dua (Open-Meteo; yalnız yağış/külək/ildırım/qar olanda)
const WeatherDua = lazy(lazyWhenIdle(() => import('../components/home/WeatherDua')))
const BookSection = lazy(() => import('../components/BookSection'))
const DailyContentDisplay = lazy(() => import('../components/AdminContentDisplay').then(m => ({ default: m.DailyContentDisplay })))
const AnnouncementSection = lazy(() => import('../components/AnnouncementSection'))
const HeroBannerDisplay = lazy(() => import('../components/HeroBannerDisplay'))
// Günün təddəbür sualı — ekranın altında, şəbəkəsiz (məlumat faylın özündədir)
// v5.7: ~46 KB (gzip) məlumat — yalnız bölməyə yaxınlaşanda (DeferRender), boş vaxtda yox
const TadabburCard = lazy(() => import('../components/TadabburCard'))
// v5.8: "bir gün" sürüşmə hekayəsi — bölməyə yaxınlaşanda
const DayStory = lazy(() => import('../components/home/DayStory'))
// v5.9: günün ayəsi/hədisi/duası/zikri — "story" dairələri
const DayStories = lazy(withPools(() => import('../components/home/DayStories')))
// v3.2: "Bu gün" bento paneli (günün hədisi — Nəvəvi 40, günün ayəsi, davam et,
// hicri tarix). Hero-nun düz altındadır — lazy, amma idle gözləmədən; yer
// tutucu hündürlüyü saxlayır (CLS olmasın). Bax: components/home/HomeToday.jsx
const HomeToday = lazy(withPools(() => import('../components/home/HomeToday')))
// 'İndi sizin üçün' — vaxta görə 1–3 təklif (mount-dan sonra; yer tutucu eyni hündürlükdədir)
const NowForYou = lazy(() => import('../components/home/NowForYou').catch(() => ({ default: NowFallback })))
// "Davam et" — qaldığınız yerlər (yalnız tərəqqi varsa görünür; hesabla sinxronlanır)
// 'Mənim günüm' — bu cihazdakı bu günün ibadətləri (utils/myDay)
const MyDay = lazy(lazyWhenIdle(() => import('../components/home/MyDay').catch(() => ({ default: () => null }))))
// Cümə rejimi (v5.3) — chunk yalnız cümə günü (və ya ?jumuah sınağı) yüklənir
const JumuahCard = lazy(() => import('../components/home/JumuahCard').catch(() => ({ default: () => null })))
// H1: şəxsi ana səhifə — redaktor yalnız düyməyə basanda yüklənir; vird kartı (H2) — bölməyə yaxınlaşanda
const HomeLayoutEditor = lazy(() => import('../components/my/HomeLayoutEditor'))
const HomeWird = lazy(() => import('../components/my/HomeWird').catch(() => ({ default: () => null })))
const isFridayLocal = () => { try { return new Date().getDay() === 5 || new URLSearchParams(window.location.search).has('jumuah') } catch { return false } }
// .hp-now-in hündürlüyü CSS-də sabitdir — yer tutucu ilə kart eyni yeri tutur (CLS yoxdur)
function NowFallback() {
  return (
    <div className="ui-section ui-section--tight hp-now" aria-hidden="true">
      <div className="ui-container"><div className="hp-now__head"><span className="ui-skeleton hp-now__sk-h" /></div><div className="hp-now__list hp-now__list--skel"><span className="ui-skeleton hp-now__sk" /><span className="ui-skeleton hp-now__sk hp-now__sk--2" /><span className="ui-skeleton hp-now__sk hp-now__sk--3" /></div></div>
    </div>
  )
}
const HomeTodayFallback = () => (
  <div className="ui-section ui-section--tight" aria-hidden="true">
    <div className="ui-container"><div className="ui-skeleton hp-td-skel" /></div>
  </div>
)
import '../styles/HomePage.css'
// PERFORMANS: AdminPage.css (47 KB) yox — yalnız ana səhifənin istifadə etdiyi
// .video-* qaydaları (HomeVideo.css, ~1.8 KB gzip; bax faylın başlığı)
import '../styles/HomeVideo.css'
import { pickUi } from '../utils/uiText'
import { HERO_T } from '../components/home/heroText'
// Dizayn v6 (src/motion): kafellərdə kursor işığı
import SpotlightCard from '../motion/SpotlightCard'

// Görünmə animasiyaları motion.css-in data-reveal sistemi ilədir (tək qlobal
// IntersectionObserver, hooks/useReveal.js) — səhifənin öz useInView-i silinib.

const pad2 = (n) => String(n).padStart(2, '0')

// Adi sol klik — SPA naviqasiyası; Ctrl/Shift/orta klik brauzerə qalır (yeni tab)
const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

// Ana səhifədə yalnız 5 fərz namazı göstərilir (günəş — /jamaat səhifəsində)
const FARD_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// Hər namazın sətrində günün vaxtını göstərən xətti ikon (Icon.jsx):
// sübh — günəş doğur, zöhr — günəş, əsr — alçaq günəş, məğrib — batır,
// işa — ay. Emoji əvəzinə: rəngi tokendən, bütün sistemlərdə eyni görünür.
const PRAYER_ICON = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const PrayerTile = ({ k }) => (
  PRAYER_ICON[k] ? <span className="hp-pr-ic" aria-hidden="true"><Icon name={PRAYER_ICON[k]} size={18} /></span> : null
)

// ═══ Ana səhifənin mətnləri (50 dil) — pickUi(LABELS, lang, 'en') ═══
const LABELS = {
  az: {
    ...HERO_T.az,
    btnAnn: 'Elanlar',
    tomorrow: 'sabah', next: 'Növbəti',
    jumuaTag: 'Cümə', untilAdhan: 'azana qalıb',
    hm: (h, m) => (h ? `${h} saat ${m} dəqiqə` : `${m} dəqiqə`),
    error: 'Namaz vaxtlarını yükləmək alınmadı.', retry: 'Yenidən cəhd et',
    mainTitle: 'Əsas',
    customize: 'Ana səhifəni fərdiləşdir',
    featEy: 'Saytda', featTitle: 'İslami bilik və ibadət',
    featSub: 'Quran, hədis, dua və digər faydalı bölmələr — hamısı pulsuz.', featGo: 'Keçid et →',
    ctaTimes: 'Namaz vaxtları',
    free: '100% pulsuz',
    quickEy: 'Bölmələr', quickTitle: 'Nə axtarırsınız?',
    quickSub: 'Ən çox açılan bölmələr — qalanları menyudadır.',
    startEy: 'Yeni başlayanlar üçün', startTitle: 'Haradan başlamalı?',
    startSub: 'Dörd sadə addım — hər biri ayrıca bölməyə aparır.',
    statsEy: 'Rəqəmlərlə', statsTitle: 'Saytda nə var',
  },
  en: {
    ...HERO_T.en,
    btnAnn: 'Announcements',
    tomorrow: 'tomorrow', next: 'Next',
    jumuaTag: 'Jumu’ah', untilAdhan: 'until adhan',
    hm: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
    error: 'Couldn’t load prayer times.', retry: 'Try again',
    mainTitle: 'Main',
    customize: 'Customize your home page',
    featEy: 'On the site', featTitle: 'Islamic knowledge & worship',
    featSub: 'Quran, hadith, duas and other useful sections — all free.', featGo: 'Open →',
    ctaTimes: 'Prayer times',
    free: '100% Free',
    quickEy: 'Sections', quickTitle: 'What are you looking for?',
    quickSub: 'The most visited sections — everything else is in the menu.',
    startEy: 'New here?', startTitle: 'Where to start',
    startSub: 'Four simple steps — each one opens its own section.',
    statsEy: 'In numbers', statsTitle: 'What the site offers',
  },
  ru: {
    ...HERO_T.ru,
    btnAnn: 'Объявления',
    tomorrow: 'завтра', next: 'Следующий',
    jumuaTag: 'Джума', untilAdhan: 'до азана',
    hm: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
    error: 'Не удалось загрузить время намаза.', retry: 'Повторить',
    mainTitle: 'Главное',
    customize: 'Настроить главную страницу',
    featEy: 'На сайте', featTitle: 'Исламские знания и поклонение',
    featSub: 'Коран, хадисы, дуа и другие полезные разделы — всё бесплатно.', featGo: 'Перейти →',
    ctaTimes: 'Время намаза',
    free: '100% бесплатно',
    quickEy: 'Разделы', quickTitle: 'Что вы ищете?',
    quickSub: 'Самые посещаемые разделы — остальные в меню.',
    startEy: 'Для начинающих', startTitle: 'С чего начать?',
    startSub: 'Четыре простых шага — каждый ведёт в свой раздел.',
    statsEy: 'В цифрах', statsTitle: 'Что есть на сайте',
  },
  ar: {
    ...HERO_T.ar,
    btnAnn: 'الإعلانات',
    tomorrow: 'غدًا', next: 'التالية',
    jumuaTag: 'الجمعة', untilAdhan: 'حتى الأذان',
    hm: (h, m) => (h ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`),
    error: 'تعذّر تحميل مواقيت الصلاة.', retry: 'إعادة المحاولة',
    mainTitle: 'الرئيسية',
    customize: 'خصّص صفحتك الرئيسية',
    featEy: 'في الموقع', featTitle: 'المعرفة الإسلامية والعبادة',
    featSub: 'القرآن والحديث والأدعية وأقسام مفيدة أخرى — كلها مجانًا.', featGo: 'انتقل ←',
    ctaTimes: 'مواقيت الصلاة',
    free: 'مجاني 100%',
    quickEy: 'الأقسام', quickTitle: 'عمّ تبحث؟',
    quickSub: 'أكثر الأقسام زيارة — والبقية في القائمة.',
    startEy: 'للمبتدئين', startTitle: 'من أين تبدأ؟',
    startSub: 'أربع خطوات بسيطة — كل خطوة تفتح قسمها.',
    statsEy: 'بالأرقام', statsTitle: 'ماذا في الموقع',
  },
  tr: {
    ...HERO_T.tr,
    btnAnn: 'Duyurular',
    tomorrow: 'yarın', next: 'Sıradaki',
    jumuaTag: 'Cuma', untilAdhan: 'ezana kaldı',
    hm: (h, m) => (h ? `${h} saat ${m} dakika` : `${m} dakika`),
    error: 'Namaz vakitleri yüklenemedi.', retry: 'Tekrar dene',
    mainTitle: 'Ana Menü',
    customize: 'Ana sayfanı kişiselleştir',
    featEy: 'Sitede', featTitle: 'İslami bilgi ve ibadet',
    featSub: "Kur'an, hadis, dua ve diğer faydalı bölümler — hepsi ücretsiz.", featGo: 'Git →',
    ctaTimes: 'Namaz vakitleri',
    free: '%100 Ücretsiz',
    quickEy: 'Bölümler', quickTitle: 'Ne arıyorsunuz?',
    quickSub: 'En çok açılan bölümler — diğerleri menüde.',
    startEy: 'Yeni başlayanlar için', startTitle: 'Nereden başlamalı?',
    startSub: 'Dört basit adım — her biri kendi bölümüne götürür.',
    statsEy: 'Rakamlarla', statsTitle: 'Sitede neler var',
  },
}

// "Nə axtarırsınız?" — ən çox açılan 12 bölmə (ikon kafelləri, .ui-tiles).
// Adlar yan menyu ilə uyğundur (data/navigation.js); təsvir — bir qısa sətir.
// Qalan bölmələr yan paneldə / ☰ menyudadır (təkrar olmasın deyə burada yox).
const QUICK = [
  { page: 'prayer',
    title: { az: 'Namaz vaxtları', en: 'Prayer times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz vakitleri' },
    desc: { az: 'Şəhərinizin 5 vaxtı', en: 'Your city’s 5 prayers', ru: '5 намазов вашего города', ar: 'الصلوات الخمس لمدينتك', tr: 'Şehrinizin 5 vakti' } },
  { page: 'quran',
    title: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: "Kur'an" },
    desc: { az: 'Tərcümə və tilavət', en: 'Translation and recitation', ru: 'Перевод и чтение', ar: 'ترجمة وتلاوة', tr: 'Meal ve tilavet' } },
  { page: 'learn',
    title: { az: 'Dərslər', en: 'Lessons', ru: 'Уроки', ar: 'الدروس', tr: 'Dersler' },
    desc: { az: 'Əqidə, fiqh, əxlaq', en: 'Creed, fiqh, character', ru: 'Акыда, фикх, нрав', ar: 'العقيدة والفقه والأخلاق', tr: 'Akide, fıkıh, ahlak' } },
  { page: 'hadith',
    title: { az: 'Hədislər', en: 'Hadith', ru: 'Хадисы', ar: 'الأحاديث', tr: 'Hadisler' },
    desc: { az: 'Səhih mənbələrdən', en: 'From authentic collections', ru: 'Из достоверных сборников', ar: 'من المصادر الصحيحة', tr: 'Sahih kaynaklardan' } },
  { page: 'prayerguide',
    title: { az: 'Namaz öyrən', en: 'Learn prayer', ru: 'Учись молиться', ar: 'تعلّم الصلاة', tr: 'Namaz öğren' } ,
    desc: { az: 'Dəstəmazdan salama qədər', en: 'From wudu to salam', ru: 'От омовения до салама', ar: 'من الوضوء إلى التسليم', tr: 'Abdestten selama kadar' } },
  { page: 'duas',
    title: { az: 'Dualar', en: "Du'as", ru: 'Дуа', ar: 'الأدعية', tr: 'Dualar' },
    desc: { az: 'Hər məqam üçün', en: 'For every occasion', ru: 'На каждый случай', ar: 'لكل مناسبة', tr: 'Her an için' } },
  { page: 'dhikr',
    title: { az: 'Zikr sayğacı', en: 'Dhikr counter', ru: 'Счётчик зикра', ar: 'عداد الذكر', tr: 'Zikir sayacı' },
    desc: { az: 'Təsbeh hər an yanınızda', en: 'Tasbih always with you', ru: 'Тасбих всегда с вами', ar: 'التسبيح معك دائمًا', tr: 'Tesbih her an yanınızda' } },
  { page: 'names',
    title: { az: 'Allahın 99 adı', en: '99 Names of Allah', ru: '99 имён Аллаха', ar: 'الأسماء الحسنى', tr: "Allah'ın 99 ismi" },
    desc: { az: 'Mənaları ilə', en: 'With their meanings', ru: 'С их значениями', ar: 'مع معانيها', tr: 'Anlamlarıyla' } },
  { page: 'qibla',
    title: { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' },
    desc: { az: 'Kəbəyə istiqamət', en: 'Direction to the Kaaba', ru: 'Направление на Каабу', ar: 'الاتجاه نحو الكعبة', tr: 'Kâbe yönü' } },
  { page: 'calendar',
    title: { az: 'İslami təqvim', en: 'Islamic calendar', ru: 'Исламский календарь', ar: 'التقويم الهجري', tr: 'İslami takvim' },
    desc: { az: 'Hicri tarix və günlər', en: 'Hijri dates and days', ru: 'Даты хиджры и дни', ar: 'التاريخ الهجري والمناسبات', tr: 'Hicri tarih ve günler' } },
  { page: 'zakat',
    title: { az: 'Zəkat', en: 'Zakat', ru: 'Закят', ar: 'الزكاة', tr: 'Zekât' },
    desc: { az: 'Nisab və hesablama', en: 'Nisab and calculation', ru: 'Нисаб и расчёт', ar: 'النصاب والحساب', tr: 'Nisap ve hesaplama' } },
  { page: 'jamaat',
    title: { az: 'Camaat və cümə', en: 'Congregation & Friday', ru: 'Джамаат и Джума', ar: 'الجماعة والجمعة', tr: 'Cemaat ve Cuma' },
    desc: { az: 'Fəziləti və hökmləri', en: 'Virtues and rulings', ru: 'Достоинства и нормы', ar: 'الفضل والأحكام', tr: 'Fazileti ve hükümleri' } },
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
      {/* v4: hər rəqəm dəyişəndə öz yerində yuxarıdan "fırlanaraq" düşür
          (key = mövqe + rəqəm → yalnız dəyişən rəqəm yenidən qurulur) */}
      <span className="hp-pc-cd" role="timer" aria-label={label(h, m)}>
        {[...`${pad2(h)}:${pad2(m)}:${pad2(s)}`].map((ch, i) => (
          ch === ':'
            ? <span key={i} className="hp-pc-colon" aria-hidden="true">:</span>
            : <span key={`${i}-${ch}`} className={`hp-pc-d${i > 5 ? ' hp-pc-s' : ''}`} aria-hidden="true">{ch}</span>
        ))}
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

// Hero A (2026-11-24): prerender HTML-də statik ilk ekran var (scripts/seo-body.mjs → homeBody,
// [data-home-static]) — CSS animasiyaları (hərflərin qalxması, xatəmin çəkilişi, parıltı) ilk
// boyamada ORADA başlayır. React həmin bloku əvəz edəndə animasiyalar yenidən başlasaydı, mətn
// "sıçrayardı": ona görə ilk render-də hero-nun animasiyaları statik blokun başladığı ana (FCP)
// qədər irəli çəkilir — dəyişiklik görünmür (xatəmin çəkilişi və parıltı statikdə yoxdur — burada başlayır). Modul ilk render-dən ƏVVƏL yüklənir (main.jsx →
// preloadInitialPage), statik blok o anda hələ DOM-dadır. Yalnız bir dəfə (SPA ilə qayıdanda yox).
let staticHero = typeof document !== 'undefined' && Boolean(document.querySelector('[data-home-static]'))
function staticElapsed() {
  try {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    return fcp ? Math.max(0, performance.now() - fcp.startTime) : 0
  } catch { return 0 }
}

export default function HomePage({ setPage }) {
  const { lang } = useLang()
  const lk = lang
  const l = pickUi(LABELS, lang, 'en')
  // Tərcümə yoxdursa əvvəl ingiliscə — ərəb/rus/türk səhifəsində azərbaycanca mətn çıxmasın
  const L = obj => obj[lk] || obj.en || obj.az || ''

  const heroRef = useRef(null)
  // Statik ilk ekrandan keçid: hero animasiyaları statik blokun başladığı yerdən davam edir (yuxarıda)
  // PERFORMANS (2026-11-25): getAnimations() bütün sənədin stilini (konteyner sorğuları üçün layout-u da)
  // DƏRHAL hesablatdırır. Commit-in içində (useLayoutEffect) bu, React-in qoşulmasını CPU ×4-də ~240 ms
  // gecikdirirdi (trace: UpdateLayoutTree 163 ms + Layout 79 ms). İndi növbəti kadrın requestAnimationFrame-
  // ində: rAF boyamadan ƏVVƏL işləyir (stil → layout → boyama ondan sonradır) — yenidən başlamış animasiya
  // heç bir kadrda görünmür, iş isə həmin kadrın öz stil hesabı ilə birləşir. Görünüş dəyişmir.
  useLayoutEffect(() => {
    if (!staticHero) return undefined
    const el = heroRef.current
    if (!el || typeof el.getAnimations !== 'function' || typeof requestAnimationFrame !== 'function') { staticHero = false; return undefined }
    // staticHero rAF-ın içində sıfırlanır: StrictMode-da (dev) effekt təmizlənib yenidən işləyəndə də bir dəfə icra olunur
    const id = requestAnimationFrame(() => {
      staticHero = false
      const t = staticElapsed()
      if (!t || !el.isConnected) return
      for (const a of el.getAnimations({ subtree: true })) {
        // Xatəmin çəkilişi və parıltı statik blokda YOXDUR (HomePage.css → .qm-home-first) — onlar indi başlayır
        if (/^(hero-orn-draw|hero-shine|hp-orn-spin)$/.test(a.animationName || '')) continue
        try { a.currentTime = (Number(a.currentTime) || 0) + t } catch { /* animasiya sadəcə bəzəkdir */ }
      }
    })
    return () => cancelAnimationFrame(id)
  }, [])

  // App-in navigate() səhifəni özü yuxarı qaldırır
  const goTo = p => setPage(p)


  // Brend adı domen kimi iki hissədə: "Muslims" + yaşıl ".cc" (başlıqdakı loqo kimi)
  const brand = brandName(lang).trim()
  const dot = brand.lastIndexOf('.')
  const brandFirst = dot > 0 ? brand.slice(0, dot) : brand
  const brandLast = dot > 0 ? brand.slice(dot) : ''


  // H1: şəxsi sıra — ilk render-də sinxron oxunur (createRoot, hidrasiya yoxdur → yanıb-sönmə yoxdur)
  const [layout, setLayout] = useState(() => readLayout())
  const [editOpen, setEditOpen] = useState(false)
  useEffect(() => {
    const on = () => setLayout(readLayout())
    const st = (e) => { if (e.key === LAYOUT_KEY || e.key === null) on() }
    const sync = (e) => { const t = e.detail?.status || e.detail?.type; if (t === 'restored' || t === 'pulled' || t === 'linked') on() }
    window.addEventListener(LAYOUT_EVENT, on)
    window.addEventListener('storage', st)
    window.addEventListener('mcc-acctsync', sync)
    return () => { window.removeEventListener(LAYOUT_EVENT, on); window.removeEventListener('storage', st); window.removeEventListener('mcc-acctsync', sync) }
  }, [])

  // H1: hero-dan aşağıdakı bölmələr — istifadəçinin sırası ilə (utils/homeLayout; prerender-də susmaya görə)
  const SECTIONS = {
    stories: (
      <>
      {/* ═══ GÜNÜN HEKAYƏLƏRİ — story dairələri (v5.9) ═══ */}
      <Suspense fallback={<div style={{ minHeight: 98 }} />}>
        <DayStories lang={lang} />
      </Suspense>
      </>
    ),
    now: (
      <Suspense fallback={<NowFallback />}>
        <NowForYou />
      </Suspense>
    ),
    today: (
      <>
      {/* ═══ BU GÜN — bento: günün hədisi, ayəsi, davam et, tarix ═══ */}
      <Suspense fallback={<HomeTodayFallback />}>
        <HomeToday cells={visibleIds(layout.c)} />
      </Suspense>
      </>
    ),
    myday: (
      <>
      {/* ═══ MƏNİM GÜNÜM — namaz, zikr, Quran, əməllər (vau3 §15) ═══ */}
      <Suspense fallback={null}>
        <MyDay onNavigate={goTo} />
      </Suspense>
      </>
    ),
    wird: (
      <DeferRender height="1px" idle={false} rootMargin={NEAR}>
        <Suspense fallback={null}>
          <HomeWird onNavigate={goTo} />
        </Suspense>
      </DeferRender>
    ),
    quick: (
      <>
      {/* ═══ NƏ AXTARIRSINIZ? — 12 əsas bölmə, ikon kafelləri ═════════════
          Əvvəlki "Əsas" sırası + "Saytda" kafelləri BİR şəbəkədə (təkrar yox).
          <a href> — Ctrl/orta klik yeni tabda açır; adi klik SPA ilə. */}
      <section className="ui-section ui-section--tight hp-quick" aria-labelledby="hp-quick-ttl">
        <div className="ui-container">
          <div className="ui-section-head ui-section-head--row" data-anim="rise">
            <div className="hp-head-text">
              <span className="ui-eyebrow">{l.quickEy}</span>
              <h2 id="hp-quick-ttl" className="ui-title">{l.quickTitle}</h2>
              <p className="ui-lead">{l.quickSub}</p>
            </div>
          </div>
          {/* Scroll A: kafellər 70 ms fərqlə yumşaq qalxır; İkon A: qızılı xətt ikonları görünəndə
              bir dəfə özünü çəkir, üzərinə gələndə yenidən (data-draw → hooks/useReveal.js, ui.css) */}
          <ul className="ui-tiles hp-tiles" data-anim-stagger="70" data-anim="rise" data-draw="">
            {QUICK.map((q, i) => (
              <li key={q.page}>
                <SpotlightCard as="a" className="ui-tile hp-tile" style={{ '--draw-i': i }} href={pathFor(q.page, lang)} onClick={(e) => { if (plainClick(e)) { e.preventDefault(); goTo(q.page) } }}>
                  <span className="hp-tile-ic" aria-hidden="true"><Icon name={q.page} size={30} strokeWidth={1.6} draw /></span>
                  <span className="ui-tile__title">{L(q.title)}</span>
                  <span className="ui-tile__text">{L(q.desc)}</span>
                </SpotlightCard>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </>
    ),
    daystory: (
      <>
      {/* ═══ BİR GÜN — sürüşdükcə açılan hekayə (Sübh → İşa) ═══ */}
      <DeferRender height="1600px" idle={false} rootMargin="600px 0px">
        <Suspense fallback={<div style={{ minHeight: 1600 }} />}>
          <DayStory lang={lang} onNavigate={goTo} />
        </Suspense>
      </DeferRender>
      </>
    ),
    start: (
      <DeferRender height={CV.start['--cv-h']} idle={false} rootMargin={NEAR}>
        <Suspense fallback={<Ph h={CV.start} />}><StartSection lang={lang} l={l} goTo={goTo} cv={CV.start} /></Suspense>
      </DeferRender>
    ),
    feats: (
      <DeferRender height={CV.feats['--cv-h']} idle={false} rootMargin={NEAR}>
        <Suspense fallback={<Ph h={CV.feats} />}><FeatsSection lang={lang} l={l} goTo={goTo} cv={CV.feats} /></Suspense>
      </DeferRender>
    ),
    tawheed: (
      <DeferRender height={CV.tw['--cv-h']} idle={false} rootMargin={NEAR}>
        <Suspense fallback={<Ph h={CV.tw} />}><TawheedSection lang={lang} cv={CV.tw} /></Suspense>
      </DeferRender>
    ),
    names: (
      <DeferRender height={CV.names['--cv-h']} idle={false} rootMargin={NEAR}>
        <Suspense fallback={<Ph h={CV.names} />}><NamesSection lang={lang} goTo={goTo} cv={CV.names} /></Suspense>
      </DeferRender>
    ),
  }

  return (
    <div className="hp-root">
      <SimpleStart lang={lang} />

      {/* Zolaq + hero + "Əsas" sırası eyni fonda */}
      <div className="hp-top">

        {/* ═══ GÜNÜN XATIRLATMALARI — başlığın düz altında, axında (üzmür) ═══
            Öz Suspense sərhədi var: yer tutucu hündürlüyü əvvəlcədən saxlayır.
            Ziyarətçi bu gün bağlayıbsa həm zolaq, həm yer tutucu null qaytarır. */}
        <Suspense fallback={<DailyReminderBarSkeleton />}>
          <DailyReminderBar setPage={goTo} />
        </Suspense>

        {/* ═══ HERO A (2026-11-24, sahibin seçdiyi maket) ═════════════════════
            "Bu sayt nədir" bir baxışda — brend, bir cümlə, iki əsas düymə, üç qısa
            üstünlük; sağda (telefonda altda) namaz vaxtları kartı. Bir naxış, bir hərəkət:
            kartın arxasında Nur xatəmi qızılı xətlə özünü çəkir və çox yavaş fırlanır, ad
            hərf-hərf qalxır, sonra bir dəfə parıltı keçir. Aurora, axan xətlər, üzən
            ulduzlar, ulduz tozu və telefon əyilməsi götürülüb (LCP + sakitlik).
            Prerender-də eyni quruluşlu statik ilk ekran var (scripts/seo-body.mjs → homeBody) —
            sinif adları və ardıcıllıq onunla EYNİ qalmalıdır (CLS yoxdur). */}
        <section ref={heroRef} className="hp-hero" data-wow-pause="">
          <div className="hp-hero-bg" aria-hidden="true">
            <div className="ui-pattern ui-pattern--fade hp-hero-pattern" />
            <RamadanLanterns />
            {/* v5.7: hava effekti — html[data-weather] olanda (WeatherDua) */}
            <div className="hp-wx" />
          </div>

          <div className="hp-hero-inner">
            <div className="hp-hero-content">
              {/* v5.7: şəxsi salam (prerenderdə — adi nişan) */}
              <HeroGreeting fallback={l.badge} lang={lang} />

              <h1 className="hp-hero-title hp-shine" aria-label={brand}>
                {/* "Muslims" + ".cc" bir sətirdə (domen kimi oxunsun).
                    Hərflər növbə ilə yuxarı qalxır (yalnız transform — LCP
                    üçün mətn ilk kadrdan görünür), sonra qızılı işıq bir dəfə keçir. */}
                <span className="hp-ht-row" aria-hidden="true">
                  <span className="hp-ht-1">{[...brandFirst].map((ch, i) => <span key={i} className="hp-ht-ch" style={{ '--ci': i }}>{ch}</span>)}</span>
                  {brandLast && <span className="hp-ht-2">{brandLast}</span>}
                </span>
              </h1>

              <p className="hp-hero-sub">{tr(BRAND.tagline, lang)}</p>

              <div className="hp-hero-btns">
                <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={()=>goTo('prayer')}><Icon name="prayer" className="ui-btn__icon" /> {l.btnTimes}</button>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--lg" onClick={()=>goTo('quran')}><Icon name="quran" className="ui-btn__icon" /> {l.btnQuran}</button>
              </div>

              <ul className="hp-hero-trust" aria-label={l.heroTrust}>
                <li><Icon name="check" size={16} /> {l.noSignup}</li>
                <li><Icon name="shield" size={16} /> {l.adFree}</li>
                <li><Icon name="globe" size={16} /> {l.langs}</li>
              </ul>
            </div>

            <div className="hp-hero-visual">
              {/* Nur xatəmi — namaz kartının ARXASINDA (HeroOrnament.css → .hp-orn) */}
              <HeroOrnament className="hp-orn" />
              <PrayerWidget lang={lang} l={l} onMore={()=>goTo('prayer')} />
            </div>
          </div>
        </section>
      </div>

      <Suspense fallback={null}>
        <WeatherDua />
      </Suspense>

      {/* ═══ CÜMƏ — yalnız cümə günü: geri sayım, Kəhf, salavat ═══ */}
      {isFridayLocal() && (
        <Suspense fallback={null}>
          <JumuahCard />
        </Suspense>
      )}

      {/* ═══ H1: fərdiləşdirmə düyməsi + istifadəçinin sırası ilə bölmələr ═══ */}
      <div className="ui-container hp-custom">
        {/* Bələdçi turu — "fərdiləşdir" ilə eyni sırada (sırada həmişə var → sıçrayış yoxdur) */}
        <TourButton className="ui-btn ui-btn--ghost ui-btn--sm hp-custom__btn" />
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm hp-custom__btn" onClick={() => setEditOpen(true)} aria-haspopup="dialog" data-testid="home-customize">
          <Icon name="edit" className="ui-btn__icon" /> {l.customize}
        </button>
      </div>
      {editOpen && (
        <Suspense fallback={null}>
          <HomeLayoutEditor onClose={() => setEditOpen(false)} />
        </Suspense>
      )}
      <div data-testid="home-sections">
        {visibleIds(layout.s).map((id) => SECTIONS[id] ? <Fragment key={id}><div className="hp-slot" data-home-section={id}>{SECTIONS[id]}</div></Fragment> : null)}
      </div>

      {/* Quran zolağı (Hicr 9 + 114/6236/30 + "Quran oxu") yuxarıdakı bento
          şəbəkəsinin iri Quran kafelinə köçürülüb — məzmun eynidir. */}

      {/* Aşağıdakı bölmələr məzmun API-sindən (admin paneli) gəlir və ekranın altındadır —
          fallback yoxdur ki, boş yer sıçrayışı (layout shift) olmasın. */}
      <DeferRender height="1px" idle={false} rootMargin={NEAR}>
      <Suspense fallback={null}>
        {/* ═══ HERO BANNER (admin) ═══ */}
        <HeroBannerDisplay setPage={goTo} />

        {/* ═══ ANNOUNCEMENTS — Ayrı bölmə kartlarla ═══ */}
        <AnnouncementSection />

        {/* ═══ DAILY ADMIN CONTENT ═══ */}
        <DailyContentDisplay />

        {/* ═══ GÜNÜN TƏDDƏBÜR SUALI ═══ */}
        <section className="ui-section ui-section--tight hp-tadabbur">
          <div className="ui-container">
            <DeferRender height="420px" idle={false} rootMargin="500px 0px"><TadabburCard /></DeferRender>
          </div>
        </section>

        {/* ═══ VIDEO SECTION ═══ */}
        <VideoSection setPage={goTo} />

        {/* ═══ BOOK SECTION ═══ */}
        <BookSection setPage={goTo} />
      </Suspense>
      </DeferRender>

      {/* ═══ CTA B — "Azan vaxtını qaçırmayın" + növbəti namaz halqası (components/home/HomeSections) ═══ */}
      <DeferRender height={CV.cta['--cv-h']} idle={false} rootMargin={NEAR}>
        <Suspense fallback={<Ph h={CV.cta} />}><CtaSection lang={lang} l={l} goTo={goTo} cv={CV.cta} /></Suspense>
      </DeferRender>

    </div>
  )
}
