import { useState } from 'react'
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

const VALID_PAGES = ['home','quran','hadith','prayer','duas','dhikr','names','zakat','qibla','calendar','about','quiz','glossary','prayerguide','hifz','kids','holyplaces','dailytracker','qurangame','charity','hajjguide','quotes','duajournal','mosques','history','sahaba','analytics']

function AppInner() {
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('muslim_cc_page')
    return VALID_PAGES.includes(saved) ? saved : 'home'
  })

  const navigate = (p) => {
    setPage(p)
    localStorage.setItem('muslim_cc_page', p)
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
      default:              return <HomePage          setPage={navigate} />
    }
  }

  return (
    <>
      <Header currentPage={page} setPage={navigate} />
      <main>{renderPage()}</main>
      <Footer setPage={navigate} />
      <InstallBanner />
      <NotificationManager />
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