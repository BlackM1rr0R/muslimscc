import { Component, Suspense, lazy as reactLazy } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LangProvider, useStoredLangRedirect } from './contexts/LangContext'
import { LANGS, parsePath, pathFor, legacyDetailParam } from './seo/routes'
import Seo from './seo/Seo'
import { isOverlayEntry } from './utils/useBackToClose'
import Header from './components/Header'
// Naviqasiya:
//   ≥1024px — başlığın altında həmişə açıq yan panel (SideNav "rail", qərar #5)
//   <1024px — başlıqdakı ☰ sağdan sürüşən çəkmə menyunu açır (Header →
//             SideNav "drawer", qərar #7). Aşağı zolaq YOXDUR — aşağı hissə boşdur.
import SideNav from './components/SideNav'
import Footer from './components/Footer'
import InstallBanner from './components/InstallBanner'
// Tək üzən düymə (AI, əlçatanlıq, bildirişlər) — əvvəlki 3 ayrı dairəvi düymənin yerinə.
// Adi import: dok özü yüngüldür, ağır panelləri (AI, bildirişlər) içəridə tənbəl yükləyir,
// əlçatanlıq tərcihləri isə ilk boyamadan tətbiq olunmalıdır.
import FloatingDock from './components/FloatingDock'
import { lazyWhenIdle } from './utils/idle'
import { withChunkRetry } from './utils/chunkRetry'

// Bütün tənbəl modullar (səhifələr, widget-lər) chunk xətasında bir dəfə
// avtomatik yenilənir (utils/chunkRetry.js — deploydan sonra köhnə tabda
// hash-li fayl yoxdur). İkinci uğursuzluq xəta kimi atılır → PageErrorBoundary.
// Ad qəsdən "lazy" qalır: scripts/prerender.mjs bu faylda
// "lazy(() => import('./pages/X'))" nümunəsini oxuyur.
const lazy = (factory) => reactLazy(withChunkRetry(factory))

// ── Marşrut əsaslı kod bölgüsü ──
// Əvvəl 31 səhifənin hamısı tək 2.7 MB-lıq bundle-da gəlirdi; ziyarətçi
// yalnız bir səhifəyə baxsa belə hamısını yükləyirdi. İndi hər səhifə
// ayrıca chunk-dır — ilk yüklənmə kiçilir, Core Web Vitals yaxşılaşır.
// PERFORMANS: HomePage də artıq lazy-dir. Əvvəl eager idi ("artıq gediş-gəliş
// olmasın" deyə), amma onda HomePage.jsx (+ HomePage.css, AdminPage.css ~93 KB
// xam CSS) HƏR səhifənin əsas paketinə düşürdü. Gediş-gəliş problemi indi
// prerender-də həll olunur: scripts/prerender.mjs hər marşrutun HTML-inə öz
// səhifə chunk-ı və CSS-i üçün <link rel="modulepreload"/"preload"> yazır —
// chunk index.js ilə PARALEL yüklənir.
// Ana səhifədə ilk render isə chunk hazır olana qədər gözləyir (main.jsx →
// preloadInitialPage): spinner yanıb-sönmür, footer yuxarıdan aşağı
// "tullanmır" (CLS yoxdur) — davranış eager import-dakı kimidir.
const HomePage = lazyPage(() => import('./pages/HomePage'))

/**
 * React.lazy + preload: modul artıq yüklənibsə, komponent Suspense-siz,
 * birbaşa render olunur (React.lazy ilk render-də HƏMİŞƏ bir dəfə suspend edir).
 */
function lazyPage(factory) {
  let Loaded = null
  let promise = null
  const load = withChunkRetry(factory)
  const preload = () => {
    if (!promise) {
      promise = load().then((m) => { Loaded = m.default; return m })
      promise.catch(() => { promise = null })
    }
    return promise
  }
  const Lazy = reactLazy(preload)
  function Page(props) {
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />
  }
  Page.preload = preload
  return Page
}

/**
 * main.jsx ilk render-dən əvvəl çağırır: açılan ünvan ana səhifədirsə, onun
 * chunk-ını gözlə (prerender HTML-i onu artıq modulepreload ilə yükləyir).
 * Digər səhifələr gözlənilmir — ağır səhifə (məs. /hadith) başlığın görünməsini
 * ləngitməsin; onlarda əvvəlki kimi Suspense fallback göstərilir.
 */
export function preloadInitialPage(pathname, hash) {
  const { key, known } = parsePath(pathname)
  if (!known || key !== 'home' || hash === ADMIN_HASH || hash === '#/admin') return Promise.resolve()
  return HomePage.preload()
}
// "Əsas" bölmələri (namaz vaxtları aşağıdadır)
const JamaatPage = lazy(() => import('./pages/JamaatPage'))
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'))
const DonatePage = lazy(() => import('./pages/DonatePage'))
const QuranPage = lazy(() => import('./pages/QuranPage'))
const HadithPage = lazy(() => import('./pages/HadithPage'))
const PrayerPage = lazy(() => import('./pages/PrayerPage'))
const RamadanPage = lazy(() => import('./pages/RamadanPage'))
const DuasPage = lazy(() => import('./pages/DuasPage'))
const DhikrPage = lazy(() => import('./pages/DhikrPage'))
const NamesPage = lazy(() => import('./pages/NamesPage'))
const ZakatPage = lazy(() => import('./pages/ZakatPage'))
const QiblaPage = lazy(() => import('./pages/QiblaPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'))
const PrayerGuidePage = lazy(() => import('./pages/PrayerGuidePage'))
const HifzPage = lazy(() => import('./pages/HifzPage'))
const KidsPage = lazy(() => import('./pages/KidsPage'))
const HolyPlacesPage = lazy(() => import('./pages/HolyPlacesPage').then(m => ({ default: m.HolyPlacesPage })))
const DailyTrackerPage = lazy(() => import('./pages/DailyTrackerPage'))
const PrayerTrackerPage = lazy(() => import('./pages/PrayerTrackerPage'))
const ArabicCoursePage = lazy(() => import('./pages/ArabicCoursePage'))
const QuranGamePage = lazy(() => import('./pages/QuranGamePage'))
const CharityPage = lazy(() => import('./pages/CharityPage'))
const HajjGuidePage = lazy(() => import('./pages/HajjGuidePage'))
const QuoteGeneratorPage = lazy(() => import('./pages/QuoteGeneratorPage'))
const DuaJournalPage = lazy(() => import('./pages/DuaJournalPage'))
const MosqueFinderPage = lazy(() => import('./pages/MosqueFinderPage'))
const IslamicHistoryPage = lazy(() => import('./pages/IslamicHistoryPage'))
const SahabePage = lazy(() => import('./pages/SahabePage'))
const ScholarsPage = lazy(() => import('./pages/ScholarsPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const VideosPage = lazy(() => import('./pages/VideosPage'))
const BooksPage = lazy(() => import('./pages/BooksPage'))
const AIChatPage = lazy(() => import('./pages/AIChatPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const LicensesPage = lazy(() => import('./pages/LicensesPage'))

// Bu widget-ler her sehifede render olunur ve Firebase-i cekir (~470 KB).
// Statik import edilse, Firebase ilk yuklenme paketine dusur; halbuki
// hec biri ilk ekran ucun vacib deyil. Ona gore tex ire salinirlar.
// PERFORMANS: üstəlik chunk-ları yalnız "load"-dan sonra, boş vaxtda
// (utils/idle.js) yüklənir — əvvəl ilk render-də yüklənirdi və Firebase SDK
// (~90 KB gzip) hər səhifədə LCP resursları ilə yarışırdı. Hər ikisi
// fallback={null} ilə üzən elementdir (axında yer tutmur — CLS yoxdur);
// bildiriş onsuz da promptCoordinator ilə gecikmə ilə göstərilir.
const AnnouncementToast = lazy(lazyWhenIdle(() => import('./components/AnnouncementToast')))
const NotificationPrompt = lazy(lazyWhenIdle(() => import('./components/NotificationPrompt')))

// ── Marşrut səviyyəsində xəta sərhədi ──
// Səhifənin render xətası (və ya ikinci dəfə yüklənməyən chunk) bütün saytı
// ağ ekrana çevirməsin: başlıq, yan menyu və footer işləməyə davam edir,
// yalnız səhifə hissəsində sakit xəta kartı + "Yenidən yüklə" görünür.
// Başqa səhifəyə keçəndə (page dəyişəndə) sərhəd özü sıfırlanır.
const ERROR_TEXT = {
  az: { title: 'Bu səhifə açılmadı', text: 'Gözlənilməz xəta baş verdi. Səhifəni yenidən yükləyin — adətən bu kifayətdir.', retry: 'Yenidən yüklə' },
  en: { title: 'This page could not be opened', text: 'An unexpected error occurred. Please reload the page — that usually fixes it.', retry: 'Reload' },
  ru: { title: 'Не удалось открыть страницу', text: 'Произошла непредвиденная ошибка. Перезагрузите страницу — обычно это помогает.', retry: 'Перезагрузить' },
  ar: { title: 'تعذّر فتح هذه الصفحة', text: 'حدث خطأ غير متوقع. أعد تحميل الصفحة — عادةً ما يحل ذلك المشكلة.', retry: 'إعادة التحميل' },
  tr: { title: 'Bu sayfa açılamadı', text: 'Beklenmeyen bir hata oluştu. Sayfayı yeniden yükleyin — genellikle bu yeterlidir.', retry: 'Yeniden yükle' },
}
const ERROR_CARD_STYLE = { maxWidth: 520, margin: '48px auto', textAlign: 'center' }

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) {
    // Konsola bir dəfə (hər tutulan xəta üçün)
    console.error('[Muslims.cc] səhifə xətası:', error)
  }
  componentDidUpdate(prev) {
    if (this.state.error && prev.page !== this.props.page) this.setState({ error: null })
  }
  render() {
    if (!this.state.error) return this.props.children
    const t = ERROR_TEXT[this.props.lang] || ERROR_TEXT.az
    return (
      <main id={MAIN_ID} tabIndex={-1} style={MAIN_STYLE}>
        <div className="ui-card" role="alert" style={ERROR_CARD_STYLE} data-page-error="">
          <h1 className="ui-title ui-title--sm">{t.title}</h1>
          <p className="ui-lead">{t.text}</p>
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => window.location.reload()}>{t.retry}</button>
        </div>
      </main>
    )
  }
}

/** Chunk yüklənənədək göstərilən yüngül keçid vəziyyəti. */
function PageFallback() {
  return (
    // <main> kimi tam hündürlük — chunk yüklənərkən footer ekranda görünüb
    // sonra aşağı "tullanmasın" (CLS, bax: MAIN_STYLE)
    <div className="spinner-wrap" role="status" aria-live="polite" style={FALLBACK_STYLE}>
      <div className="spinner" />
    </div>
  )
}

// Gizli admin girişi — ünvan sətrinə "#admin" yaz
const ADMIN_HASH = '#admin'

// "Məzmuna keç" linki — klaviatura ilə başlığı və yan paneli atlamaq üçün
const SKIP_LABEL = { az: 'Məzmuna keç', en: 'Skip to content', ru: 'Перейти к содержимому', ar: 'انتقل إلى المحتوى', tr: 'İçeriğe geç' }
const MAIN_ID = 'qm-main'
// Bax: pageMain-dəki CLS şərhi (--header-h: globals.css, 64px)
const MAIN_STYLE = { minHeight: 'calc(100vh - var(--header-h, 64px))' }
// spinner əvvəlki yerində (yuxarıda) qalsın — .spinner-wrap şaquli mərkəzləyir
const FALLBACK_STYLE = { ...MAIN_STYLE, justifyContent: 'flex-start' }

// Köhnə "/mosque" (Qaraçuxur dövründəki "Məscid haqqında") səhifəsi silinib.
// Marşrut routes.js-də artıq yoxdur, ona görə yol birbaşa yoxlanır:
// /mosque, /en/mosque, /az/mosque/... → eyni dildə /about (replace — Geri
// düyməsi silinmiş ünvana qayıtmasın). Sorğu sətri və hash saxlanmır.
const LEGACY_REDIRECTS = { mosque: 'about' }

// Detal səhifələrinin köhnə query ünvanları (/quran?s=2&a=90, /sahaba?id=…)
// və səhv yazılmış slug (/quran/2-sehv) → kanonik yol, replace ilə (301 yox —
// server statik fayl verir; canonical onsuz da düzgün URL-i göstərir).
// Sorğunun qalan hissəsi (?a=90) və hash saxlanılır.
function canonicalDetail(location, key, lang, param) {
  let p = param
  const params = new URLSearchParams(location.search)
  if (p == null) {
    p = legacyDetailParam(key, params)
    if (p == null) return null
    params.delete(key === 'quran' ? 's' : 'id')
  }
  const pathname = pathFor(key, lang, p)
  const legacyQuery = param == null
  if (!legacyQuery && pathname === location.pathname) return null
  const search = params.toString()
  return { pathname, search: search ? `?${search}` : '', hash: location.hash }
}

/** Köhnə ünvandırsa { lang, to } qaytarır, yoxsa null. */
function legacyRedirect(pathname) {
  const parts = String(pathname || '/').split('/').filter(Boolean)
  let lang = 'az'
  if (parts.length && LANGS.includes(parts[0])) lang = parts.shift()
  const to = parts.length === 1 ? LEGACY_REDIRECTS[parts[0].toLowerCase()] : null
  return to ? { lang, to } : null
}

function AppInner() {
  const location = useLocation()
  const routerNavigate = useNavigate()

  useStoredLangRedirect()

  const legacy = legacyRedirect(location.pathname)

  // Səhifə və dil artıq URL-dən oxunur — hər səhifənin öz ünvanı var
  // (/quran, /ru/quran) ki, Google onları ayrıca indeksləyə bilsin.
  const { lang, key, known, param, removed } = parsePath(location.pathname)
  const hash = location.hash
  const isAdminKey = key === 'admin' || key === 'adminlogin'
  // "#admin" istənilən səhifədən gizli girişi açır, amma /admin marşrutunun
  // özünü ələ keçirmir — əks halda login-dən sonra sonsuz dövrə yaranardı.
  // Tanınmayan ünvan → 'notfound' (404 səhifəsi, noindex) — əvvəl səssizcə ana səhifə açılırdı
  const page = (!isAdminKey && (hash === ADMIN_HASH || hash === '#/admin')) ? 'adminlogin' : (known ? key : 'notfound')

  // Səhifələr hələ də setPage('quran') çağırır — API dəyişmir,
  // sadəcə altında state yerinə həqiqi URL naviqasiyası var.
  // Açıq üst qatdan (çəkmə menyu, axtarış) keçid "replace" ilə olur:
  // onların tarixçə girişi (utils/useBackToClose) yeni səhifə ilə əvəzlənir,
  // Geri düyməsi isə əvvəlki səhifəyə — təkrarsız — qayıdır.
  const navigate = (p) => {
    routerNavigate(pathFor(p, lang), { replace: isOverlayEntry() })
    window.scrollTo(0, 0)
  }

  // Skip link: <main>-ə fokus (hash dəyişmir — "#admin" məntiqinə toxunmur)
  const skipToMain = (e) => {
    e.preventDefault()
    const main = document.getElementById(MAIN_ID)
    if (main) {
      main.focus({ preventScroll: true })
      main.scrollIntoView({ block: 'start' })
    }
  }

  const renderPage = () => {
    switch (page) {
      case 'home':     return <HomePage     setPage={navigate} />
      case 'jamaat':        return <JamaatPage        setPage={navigate} />
      case 'announcements': return <AnnouncementsPage setPage={navigate} />
      case 'donate':        return <DonatePage        setPage={navigate} />
      case 'quran':    return <QuranPage    setPage={navigate} />
      case 'hadith':   return <HadithPage   setPage={navigate} />
      case 'prayer':   return <PrayerPage   setPage={navigate} />
      case 'ramadan':  return <RamadanPage  setPage={navigate} />
      case 'duas':     return <DuasPage     setPage={navigate} />
      case 'dhikr':    return <DhikrPage    setPage={navigate} />
      case 'names':    return <NamesPage    setPage={navigate} />
      case 'zakat':    return <ZakatPage    setPage={navigate} />
      case 'qibla':    return <QiblaPage    setPage={navigate} />
      case 'calendar': return <CalendarPage setPage={navigate} />
      case 'about':    return <AboutPage    setPage={navigate} />
      case 'quiz':     return <QuizPage     setPage={navigate} />
      case 'glossary':    return <GlossaryPage    setPage={navigate} />
      case 'prayerguide': return <PrayerGuidePage setPage={navigate} />
      case 'hifz':        return <HifzPage        setPage={navigate} />
      case 'kids':        return <KidsPage        setPage={navigate} />
      case 'holyplaces':    return <HolyPlacesPage    setPage={navigate} />
      case 'tracker':       return <PrayerTrackerPage setPage={navigate} />
      case 'dailytracker':  return <DailyTrackerPage  setPage={navigate} />
      case 'arabic':        return <ArabicCoursePage  setPage={navigate} />
      case 'qurangame':     return <QuranGamePage     setPage={navigate} />
      case 'charity':       return <CharityPage       setPage={navigate} />
      case 'hajjguide':     return <HajjGuidePage     setPage={navigate} />
      case 'quotes':        return <QuoteGeneratorPage setPage={navigate} />
      case 'duajournal':    return <DuaJournalPage    setPage={navigate} />
      case 'mosques':       return <MosqueFinderPage  setPage={navigate} />
      case 'history':       return <IslamicHistoryPage setPage={navigate} />
      case 'sahaba':        return <SahabePage         setPage={navigate} />
      case 'scholars':      return <ScholarsPage       setPage={navigate} />
      case 'analytics':     return <AnalyticsPage      setPage={navigate} />
      case 'adminlogin':    return <AdminLoginPage    setPage={navigate} />
      case 'admin':         return <AdminPage         setPage={navigate} />
      case 'videos':        return <VideosPage        setPage={navigate} />
      case 'books':         return <BooksPage         setPage={navigate} />
      case 'aichat':        return <AIChatPage        setPage={navigate} />
      case 'privacy':       return <PrivacyPage       setPage={navigate} />
      case 'terms':         return <TermsPage         setPage={navigate} />
      case 'licenses':      return <LicensesPage      setPage={navigate} />
      case 'notfound':      return <NotFoundPage      setPage={navigate} />
      default:              return <HomePage          setPage={navigate} />
    }
  }

  if (legacy) return <Navigate to={pathFor(legacy.to, legacy.lang)} replace />
  // Köhnə siyahıdan çıxarılmış ad (/names/23-al-khafid) → /names siyahısı (replace)
  if (removed) return <Navigate to={pathFor(key, lang)} replace />
  const detailFix = known ? canonicalDetail(location, key, lang, param) : null
  if (detailFix) return <Navigate to={detailFix} replace state={location.state} />

  // Admin səhifələri Header/Footer göstərmir — nə yan panel, nə çəkmə menyu
  const isAdminPage = page === 'adminlogin' || page === 'admin'

  // Səhifə keçidi (motion.css → .page-enter): yeni <main> 10px aşağıdan
  // yumşaq qalxır. Suspense qəsdən <main>-dən KƏNARDADIR: naviqasiya
  // startTransition ilə gedir (main.jsx → v7_startTransition), ona görə
  // artıq görünən sərhəd yeni səhifənin kodu yüklənənə qədər KÖHNƏ səhifəni
  // saxlayır — arada boş ekran / spinner "yanıb-sönməsi" olmur. Spinner
  // yalnız ilk açılışda (hələ heç nə göstərilməyibsə) görünür.
  const pageMain = (
    <PageErrorBoundary page={page} lang={lang}>
    <Suspense fallback={<PageFallback />}>
      {/* PERFORMANS (CLS): <main> ən azı görünən sahə hündürlüyündədir — footer
          ilk kadrda ekranın ALTINDAN başlayır. Əvvəl səhifə chunk-ı / məlumatı
          yüklənərkən <main> qısa olurdu, footer ekranın ortasında görünür, sonra
          məzmun gələndə aşağı itələnirdi: Lighthouse masaüstü /quran-da
          CLS 0.528 (bal 5/100). Hündür səhifələrdə heç nə dəyişmir. */}
      <main key={page} id={MAIN_ID} tabIndex={-1} className="page-enter" style={MAIN_STYLE}>
        {renderPage()}
      </main>
    </Suspense>
    </PageErrorBoundary>
  )

  if (isAdminPage) {
    return (
      <>
        <Seo page={page} lang={lang} param={page === key ? param : null} />
        {pageMain}
      </>
    )
  }

  return (
    <>
      <Seo page={page} lang={lang} param={page === key ? param : null} />
      <a className="qm-skip" href={`#${MAIN_ID}`} onClick={skipToMain}>{SKIP_LABEL[lang] || SKIP_LABEL.az}</a>
      <Header currentPage={page} setPage={navigate} />

      {/* Tətbiq qabığı (globals.css → .qm-shell): [yan panel | əsas sütun].
          Əsas sütunda <main> VƏ footer var — footer panelin altına düşmür.
          Ərəbcədə grid güzgülənir, panel sağda olur. */}
      <div className="qm-shell">
        <SideNav mode="rail" currentPage={page} setPage={navigate} />
        <div className="qm-shell-main">
          {pageMain}
          <Footer setPage={navigate} />
        </div>
      </div>

      <InstallBanner />
      {/* ≥1024px: sağ aşağıda TƏK üzən düymə — AI köməkçi, əlçatanlıq,
          bildiriş ayarları. <1024px-də düymə gizlidir (məzmunu örtürdü);
          həmin alətlər ☰ çəkmə menyusundadır, panellər isə yenə buradan
          açılır. <main key={page}>-dən kənarda — səhifə dəyişəndə yenidən
          qurulmur. AI bəndini page === 'aichat' olanda özü gizlədir. */}
      <FloatingDock page={page} />
      <Suspense fallback={null}>
        {/* Elan bildirişi, bildiriş icazəsi və quraşdırma zolağı növbə ilə
            göstərilir (src/utils/promptCoordinator.js) — üst-üstə düşmürlər */}
        <AnnouncementToast />
        <NotificationPrompt />
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  )
}
