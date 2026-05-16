import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { isAdminLoggedIn, adminLogout, getVideos } from '../data/videos'
import { getBooks } from '../data/books'
import {
  getCustomHadiths, getCustomDuas, getAnnouncements,
  getCustomQuotes, getCustomEvents, getCustomPlaces,
} from '../data/adminContent'
import VideoManager from '../components/admin/VideoManager'
import BookManager from '../components/admin/BookManager'
import PushNotificationManager from '../components/admin/PushNotificationManager'
import HadithManager from '../components/admin/HadithManager'
import DuaManager from '../components/admin/DuaManager'
import AnnouncementManager from '../components/admin/AnnouncementManager'
import DailyContentManager from '../components/admin/DailyContentManager'
import DashboardOverview from '../components/admin/DashboardOverview'
import QuoteManager from '../components/admin/QuoteManager'
import EventManager from '../components/admin/EventManager'
import HeroBannerManager from '../components/admin/HeroBannerManager'
import SettingsManager from '../components/admin/SettingsManager'
import BackupManager from '../components/admin/BackupManager'
import StatsManager from '../components/admin/StatsManager'
import SeedManager from '../components/admin/SeedManager'
import '../styles/AdminPage.css'

const LABELS = {
  az: { dashboard:'İdarə paneli', content:'KONTENT', videos:'Videolar', books:'Kitablar', hadiths:'Hədislər', duas:'Dualar', quotes:'Sitatlar', announcements:'Elanlar', events:'Hadisələr', daily:'Günün məzmunu', customization:'FƏRDİLƏŞDİRMƏ', hero:'Hero Banner', system:'SİSTEM', settings:'Parametrlər', stats:'Statistika', backup:'Yedək & Bərpa', seed:'Default yüklə', pushNotif:'Push Bildirişlər', logout:'Çıxış', adminPanel:'Admin Panel' },
  en: { dashboard:'Dashboard', content:'CONTENT', videos:'Videos', books:'Books', hadiths:'Hadiths', duas:'Duas', quotes:'Quotes', announcements:'Announcements', events:'Events', daily:'Daily Content', customization:'CUSTOMIZATION', hero:'Hero Banner', system:'SYSTEM', settings:'Settings', stats:'Statistics', backup:'Backup & Restore', seed:'Seed Data', pushNotif:'Push Notifications', logout:'Logout', adminPanel:'Admin Panel' },
  ru: { dashboard:'Главная', content:'КОНТЕНТ', videos:'Видео', books:'Книги', hadiths:'Хадисы', duas:'Дуа', quotes:'Цитаты', announcements:'Объявления', events:'События', daily:'Контент дня', customization:'НАСТРОЙКА', hero:'Hero Баннер', system:'СИСТЕМА', settings:'Настройки', stats:'Статистика', backup:'Резерв', seed:'Загрузить', pushNotif:'Уведомления', logout:'Выход', adminPanel:'Админ' },
  ar: { dashboard:'لوحة التحكم', content:'المحتوى', videos:'الفيديوهات', books:'الكتب', hadiths:'الأحاديث', duas:'الأدعية', quotes:'الاقتباسات', announcements:'الإعلانات', events:'الأحداث', daily:'محتوى اليوم', customization:'التخصيص', hero:'بانر', system:'النظام', settings:'الإعدادات', stats:'الإحصائيات', backup:'النسخ', seed:'تحميل', pushNotif:'الإشعارات', logout:'خروج', adminPanel:'لوحة الإدارة' },
  tr: { dashboard:'Yönetim Paneli', content:'İÇERİK', videos:'Videolar', books:'Kitaplar', hadiths:'Hadisler', duas:'Dualar', quotes:'Alıntılar', announcements:'Duyurular', events:'Olaylar', daily:'Günün İçeriği', customization:'KİŞİSELLEŞTİRME', hero:'Hero Banner', system:'SİSTEM', settings:'Ayarlar', stats:'İstatistik', backup:'Yedekleme', seed:'Yükle', pushNotif:'Bildirimler', logout:'Çıkış', adminPanel:'Yönetim' },
}

const NAV_GROUPS = [
  {
    items: [
      { key:'dashboard', icon:'📊', labelKey:'dashboard', noCount:true },
    ],
  },
  {
    labelKey:'content',
    items: [
      { key:'videos',        icon:'📹', labelKey:'videos' },
      { key:'books',         icon:'📚', labelKey:'books' },
      { key:'hadiths',       icon:'📜', labelKey:'hadiths' },
      { key:'duas',          icon:'🤲', labelKey:'duas' },
      { key:'quotes',        icon:'💬', labelKey:'quotes' },
      { key:'announcements', icon:'📣', labelKey:'announcements' },
      { key:'events',        icon:'📅', labelKey:'events' },
      { key:'daily',         icon:'🌟', labelKey:'daily', noCount:true },
      { key:'pushNotif',     icon:'🔔', labelKey:'pushNotif', noCount:true },
    ],
  },
  {
    labelKey:'customization',
    items: [
      { key:'hero',     icon:'🎨', labelKey:'hero', noCount:true },
      { key:'settings', icon:'⚙️', labelKey:'settings', noCount:true },
    ],
  },
  {
    labelKey:'system',
    items: [
      { key:'stats',  icon:'📈', labelKey:'stats', noCount:true },
      { key:'backup', icon:'💾', labelKey:'backup', noCount:true },
      { key:'seed',   icon:'🌱', labelKey:'seed', noCount:true },
    ],
  },
]

export default function AdminPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [activeTab, setActiveTab] = useState('dashboard')
  const [counts, setCounts] = useState({ videos:0, books:0, hadiths:0, duas:0, quotes:0, announcements:0, events:0, places:0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAdminLoggedIn()) { setPage('adminlogin'); return }
    refreshCounts()
  }, [activeTab])

  const refreshCounts = async () => {
    const [v, b, h, d, q, a, e, p] = await Promise.all([
      getVideos(), getBooks(), getCustomHadiths(), getCustomDuas(),
      getCustomQuotes(), getAnnouncements(), getCustomEvents(), getCustomPlaces(),
    ])
    setCounts({
      videos: v.length, books: b.length, hadiths: h.length, duas: d.length,
      quotes: q.length, announcements: a.length, events: e.length, places: p.length,
    })
  }

  const handleLogout = () => { adminLogout(); setPage('home') }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':     return <DashboardOverview counts={counts} setActiveTab={setActiveTab} />
      case 'videos':        return <VideoManager onUpdate={refreshCounts} />
      case 'books':         return <BookManager onUpdate={refreshCounts} />
      case 'hadiths':       return <HadithManager onUpdate={refreshCounts} />
      case 'duas':          return <DuaManager onUpdate={refreshCounts} />
      case 'quotes':        return <QuoteManager onUpdate={refreshCounts} />
      case 'announcements': return <AnnouncementManager onUpdate={refreshCounts} />
      case 'events':        return <EventManager onUpdate={refreshCounts} />
      case 'daily':         return <DailyContentManager />
      case 'pushNotif':     return <PushNotificationManager />
      case 'hero':          return <HeroBannerManager />
      case 'settings':      return <SettingsManager />
      case 'stats':         return <StatsManager />
      case 'backup':        return <BackupManager />
      case 'seed':          return <SeedManager />
      default:              return <DashboardOverview counts={counts} setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <div className="admin-sidebar-logo">🔐</div>
            <div>
              <div className="admin-sidebar-title">{l.adminPanel}</div>
              <div className="admin-sidebar-sub">muslims.cc</div>
            </div>
          </div>

          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="admin-nav-section">
              {group.labelKey && <div className="admin-nav-section-label">{l[group.labelKey]}</div>}
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`admin-nav-btn ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.key); setSidebarOpen(false); window.scrollTo({top:0, behavior:'smooth'}); }}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span>{l[item.labelKey]}</span>
                  {!item.noCount && counts[item.key] > 0 && (
                    <span className="admin-nav-badge">{counts[item.key]}</span>
                  )}
                </button>
              ))}
            </div>
          ))}

          <div className="admin-sidebar-footer">
            <button className="admin-logout-btn" onClick={handleLogout} style={{width:'100%', justifyContent:'center'}}>
              <span>🚪</span> {l.logout}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="admin-main">
          {renderTab()}
        </main>

      </div>
    </div>
  )
}
