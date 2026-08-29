import { Suspense, lazy } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LangProvider, useStoredLangRedirect } from './contexts/LangContext'
import { parsePath, pathFor } from './seo/routes'
import Seo from './seo/Seo'
import Header from './components/Header'
import Footer from './components/Footer'
import InstallBanner from './components/InstallBanner'
import HomePage from './pages/HomePage'

// ── Marşrut əsaslı kod bölgüsü ──
// Əvvəl 31 səhifənin hamısı tək 2.7 MB-lıq bundle-da gəlirdi; ziyarətçi
// yalnız bir səhifəyə baxsa belə hamısını yükləyirdi. İndi hər səhifə
// ayrıca chunk-dır — ilk yüklənmə kiçilir, Core Web Vitals yaxşılaşır.
// HomePage qəsdən eager saxlanılıb: ən çox açılan səhifədir və onu da
// lazy etmək ilk boyanmaya artıq bir gediş-gəliş əlavə edərdi.
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

import AccessibilityWidget from './components/AccessibilityWidget'

// Bu widget-ler her sehifede render olunur ve Firebase-i cekir (~470 KB).
// Statik import edilse, Firebase ilk yuklenme paketine dusur; halbuki
// hec biri ilk ekran ucun vacib deyil. Ona gore tex ire salinirlar.
const AnnouncementToast = lazy(() => import('./components/AnnouncementToast'))
const NotificationPrompt = lazy(() => import('./components/NotificationPrompt'))
const AIChatWidget = lazy(() => import('./components/AIChatWidget'))
const NotificationSettingsWidget = lazy(() => import('./components/NotificationSettingsWidget'))

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

function AppInner() {
  const location = useLocation()
  const routerNavigate = useNavigate()

  useStoredLangRedirect()

  // Səhifə və dil artıq URL-dən oxunur — hər səhifənin öz ünvanı var
  // (/quran, /ru/quran) ki, Google onları ayrıca indeksləyə bilsin.
  const { lang, key } = parsePath(location.pathname)
  const hash = location.hash
  const isAdminKey = key === 'admin' || key === 'adminlogin'
  // "#admin" istənilən səhifədən gizli girişi açır, amma /admin marşrutunun
  // özünü ələ keçirmir — əks halda login-dən sonra sonsuz dövrə yaranardı.
  const page = (!isAdminKey && (hash === ADMIN_HASH || hash === '#/admin')) ? 'adminlogin' : key

  // Səhifələr hələ də setPage('quran') çağırır — API dəyişmir,
  // sadəcə altında state yerinə həqiqi URL naviqasiyası var.
  const navigate = (p) => {
    routerNavigate(pathFor(p, lang))
    window.scrollTo(0, 0)
  }

  const renderPage = () => {
    switch (page) {
      case 'home':     return <HomePage     setPage={navigate} />
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
      default:              return <HomePage          setPage={navigate} />
    }
  }

  // Admin səhifələri Header/Footer göstərmir
  const isAdminPage = page === 'adminlogin' || page === 'admin'

  return (
    <>
      <Seo page={page} lang={lang} />
      {!isAdminPage && <Header currentPage={page} setPage={navigate} />}
      <main key={page} className="page-enter">
        <Suspense fallback={<PageFallback />}>{renderPage()}</Suspense>
      </main>
      {!isAdminPage && <Footer setPage={navigate} />}
      {!isAdminPage && <InstallBanner />}
      <Suspense fallback={null}>
      {/* Pop-up announcement toast — hər səhifədə görünür */}
      {!isAdminPage && <AnnouncementToast />}
      {/* Push notification permission prompt */}
      {!isAdminPage && <NotificationPrompt />}
      {/* MuslimAI floating chat widget — bottom-right */}
      {!isAdminPage && page !== 'aichat' && <AIChatWidget />}
      {/* Accessibility widget — above MuslimAI button */}
      {!isAdminPage && <AccessibilityWidget />}
      {/* Notification settings — above Accessibility button */}
      {!isAdminPage && <NotificationSettingsWidget />}
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
