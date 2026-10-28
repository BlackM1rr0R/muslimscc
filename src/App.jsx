import { Suspense, lazy } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LangProvider, useStoredLangRedirect } from './contexts/LangContext'
import { LANGS, parsePath, pathFor } from './seo/routes'
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
import HomePage from './pages/HomePage'

// ── Marşrut əsaslı kod bölgüsü ──
// Əvvəl 31 səhifənin hamısı tək 2.7 MB-lıq bundle-da gəlirdi; ziyarətçi
// yalnız bir səhifəyə baxsa belə hamısını yükləyirdi. İndi hər səhifə
// ayrıca chunk-dır — ilk yüklənmə kiçilir, Core Web Vitals yaxşılaşır.
// HomePage qəsdən eager saxlanılıb: ən çox açılan səhifədir və onu da
// lazy etmək ilk boyanmaya artıq bir gediş-gəliş əlavə edərdi.
// "Əsas" bölmələri (namaz vaxtları aşağıdadır)
const JamaatPage = lazy(() => import('./pages/JamaatPage'))
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'))
const DonatePage = lazy(() => import('./pages/DonatePage'))
const QuranPage = lazy(() => import('./pages/QuranPage'))
const HadithPage = lazy(() => import('./pages/HadithPage'))
const PrayerPage = lazy(() => import('./pages/PrayerPage'))
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
const QuranGamePage = lazy(() => import('./pages/QuranGamePage'))
const CharityPage = lazy(() => import('./pages/CharityPage'))
const HajjGuidePage = lazy(() => import('./pages/HajjGuidePage'))
const QuoteGeneratorPage = lazy(() => import('./pages/QuoteGeneratorPage'))
const DuaJournalPage = lazy(() => import('./pages/DuaJournalPage'))
const MosqueFinderPage = lazy(() => import('./pages/MosqueFinderPage'))
const IslamicHistoryPage = lazy(() => import('./pages/IslamicHistoryPage'))
const SahabePage = lazy(() => import('./pages/SahabePage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const VideosPage = lazy(() => import('./pages/VideosPage'))
const BooksPage = lazy(() => import('./pages/BooksPage'))
const AIChatPage = lazy(() => import('./pages/AIChatPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Bu widget-ler her sehifede render olunur ve Firebase-i cekir (~470 KB).
// Statik import edilse, Firebase ilk yuklenme paketine dusur; halbuki
// hec biri ilk ekran ucun vacib deyil. Ona gore tex ire salinirlar.
const AnnouncementToast = lazy(() => import('./components/AnnouncementToast'))
const NotificationPrompt = lazy(() => import('./components/NotificationPrompt'))

/** Chunk yüklənənədək göstərilən yüngül keçid vəziyyəti. */
function PageFallback() {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
    </div>
  )
}

// Gizli admin girişi — ünvan sətrinə "#admin" yaz
const ADMIN_HASH = '#admin'

// "Məzmuna keç" linki — klaviatura ilə başlığı və yan paneli atlamaq üçün
const SKIP_LABEL = { az: 'Məzmuna keç', en: 'Skip to content', ru: 'Перейти к содержимому', ar: 'انتقل إلى المحتوى', tr: 'İçeriğe geç' }
const MAIN_ID = 'qm-main'

// Köhnə "/mosque" (Qaraçuxur dövründəki "Məscid haqqında") səhifəsi silinib.
// Marşrut routes.js-də artıq yoxdur, ona görə yol birbaşa yoxlanır:
// /mosque, /en/mosque, /az/mosque/... → eyni dildə /about (replace — Geri
// düyməsi silinmiş ünvana qayıtmasın). Sorğu sətri və hash saxlanmır.
const LEGACY_REDIRECTS = { mosque: 'about' }

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
  const { lang, key, known } = parsePath(location.pathname)
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
      case 'dailytracker':  return <DailyTrackerPage  setPage={navigate} />
      case 'qurangame':     return <QuranGamePage     setPage={navigate} />
      case 'charity':       return <CharityPage       setPage={navigate} />
      case 'hajjguide':     return <HajjGuidePage     setPage={navigate} />
      case 'quotes':        return <QuoteGeneratorPage setPage={navigate} />
      case 'duajournal':    return <DuaJournalPage    setPage={navigate} />
      case 'mosques':       return <MosqueFinderPage  setPage={navigate} />
      case 'history':       return <IslamicHistoryPage setPage={navigate} />
      case 'sahaba':        return <SahabePage         setPage={navigate} />
      case 'analytics':     return <AnalyticsPage      setPage={navigate} />
      case 'adminlogin':    return <AdminLoginPage    setPage={navigate} />
      case 'admin':         return <AdminPage         setPage={navigate} />
      case 'videos':        return <VideosPage        setPage={navigate} />
      case 'books':         return <BooksPage         setPage={navigate} />
      case 'aichat':        return <AIChatPage        setPage={navigate} />
      case 'notfound':      return <NotFoundPage      setPage={navigate} />
      default:              return <HomePage          setPage={navigate} />
    }
  }

  if (legacy) return <Navigate to={pathFor(legacy.to, legacy.lang)} replace />

  // Admin səhifələri Header/Footer göstərmir — nə yan panel, nə çəkmə menyu
  const isAdminPage = page === 'adminlogin' || page === 'admin'

  // Səhifə keçidi (motion.css → .page-enter): yeni <main> 10px aşağıdan
  // yumşaq qalxır. Suspense qəsdən <main>-dən KƏNARDADIR: naviqasiya
  // startTransition ilə gedir (main.jsx → v7_startTransition), ona görə
  // artıq görünən sərhəd yeni səhifənin kodu yüklənənə qədər KÖHNƏ səhifəni
  // saxlayır — arada boş ekran / spinner "yanıb-sönməsi" olmur. Spinner
  // yalnız ilk açılışda (hələ heç nə göstərilməyibsə) görünür.
  const pageMain = (
    <Suspense fallback={<PageFallback />}>
      <main key={page} id={MAIN_ID} tabIndex={-1} className="page-enter">
        {renderPage()}
      </main>
    </Suspense>
  )

  if (isAdminPage) {
    return (
      <>
        <Seo page={page} lang={lang} />
        {pageMain}
      </>
    )
  }

  return (
    <>
      <Seo page={page} lang={lang} />
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
