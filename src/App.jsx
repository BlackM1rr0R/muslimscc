import { useState, useEffect } from 'react'
import { LangProvider } from './contexts/LangContext'
import Header from './components/Header'
import Footer from './components/Footer'
import InstallBanner from './components/InstallBanner'
import NotificationManager from './components/NotificationManager'
import HomePage from './pages/HomePage'
import QuranPage from './pages/QuranPage'
import HadithPage from './pages/HadithPage'
import PrayerPage from './pages/PrayerPage'
import DuasPage from './pages/DuasPage'
import DhikrPage from './pages/DhikrPage'
import NamesPage from './pages/NamesPage'
import ZakatPage from './pages/ZakatPage'
import QiblaPage from './pages/QiblaPage'
import { CalendarPage } from './pages/CalendarPage'
import { AboutPage } from './pages/AboutPage'
import QuizPage from './pages/QuizPage'
import GlossaryPage from './pages/GlossaryPage'
import PrayerGuidePage from './pages/PrayerGuidePage'
import HifzPage from './pages/HifzPage'
import KidsPage from './pages/KidsPage'
import { HolyPlacesPage } from './pages/HolyPlacesPage'
import DailyTrackerPage from './pages/DailyTrackerPage'
import QuranGamePage from './pages/QuranGamePage'
import CharityPage from './pages/CharityPage'
import HajjGuidePage from './pages/HajjGuidePage'
import QuoteGeneratorPage from './pages/QuoteGeneratorPage'
import DuaJournalPage from './pages/DuaJournalPage'
import MosqueFinderPage from './pages/MosqueFinderPage'
import IslamicHistoryPage from './pages/IslamicHistoryPage'
import SahabePage from './pages/SahabePage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPage from './pages/AdminPage'
import VideosPage from './pages/VideosPage'
import BooksPage from './pages/BooksPage'
import AnnouncementToast from './components/AnnouncementToast'

const VALID_PAGES = ['home','quran','hadith','prayer','duas','dhikr','names','zakat','qibla','calendar','about','quiz','glossary','prayerguide','hifz','kids','holyplaces','dailytracker','qurangame','charity','hajjguide','quotes','duajournal','mosques','history','sahaba','analytics','adminlogin','admin','videos','books']

// Hidden admin URL — type "#admin" in the address bar to access
const ADMIN_HASH = '#admin'

function readInitialPage() {
  // 1) URL hash takes priority — hidden router-style entry
  const hash = (typeof window !== 'undefined' && window.location.hash) || ''
  if (hash === ADMIN_HASH || hash === '#/admin') return 'adminlogin'

  // 2) localStorage — but never auto-restore admin pages on refresh from storage
  const saved = localStorage.getItem('muslim_cc_page')
  if (saved === 'adminlogin' || saved === 'admin') return 'home'
  return VALID_PAGES.includes(saved) ? saved : 'home'
}

function AppInner() {
  const [page, setPage] = useState(readInitialPage)

  const navigate = (p) => {
    setPage(p)
    localStorage.setItem('muslim_cc_page', p)
    // Sync URL hash for admin pages, clear it otherwise
    if (typeof window !== 'undefined') {
      if (p === 'adminlogin' || p === 'admin') {
        if (window.location.hash !== ADMIN_HASH) {
          history.replaceState(null, '', ADMIN_HASH)
        }
      } else if (window.location.hash === ADMIN_HASH || window.location.hash === '#/admin') {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
  }

  // React to manual URL changes (user pastes #admin or removes it)
  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash
      if ((h === ADMIN_HASH || h === '#/admin') && page !== 'adminlogin' && page !== 'admin') {
        setPage('adminlogin')
      } else if (!h && (page === 'adminlogin' || page === 'admin')) {
        setPage('home')
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [page])

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
      default:              return <HomePage          setPage={navigate} />
    }
  }

  // Admin pages don't show Header/Footer
  const isAdminPage = page === 'adminlogin' || page === 'admin'

  return (
    <>
      {!isAdminPage && <Header currentPage={page} setPage={navigate} />}
      <main>{renderPage()}</main>
      {!isAdminPage && <Footer setPage={navigate} />}
      {!isAdminPage && <InstallBanner />}
      {!isAdminPage && <NotificationManager />}
      {/* Pop-up announcement toast — hər səhifədə görünür */}
      {!isAdminPage && <AnnouncementToast />}
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