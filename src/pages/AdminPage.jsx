import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import { getVideos } from '../data/videos'
import { watchAdmin, signOutAdmin } from '../api/adminAuth'
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
import AccountManager from '../components/admin/AccountManager'
import { AdminEmpty } from '../components/admin/AdminUi'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AdminPage.css'

const LABELS = {
  az: { checking:'Giriş yoxlanılır...', account:'Hesab və şifrə', dashboard:'İdarə paneli', content:'MƏZMUN', videos:'Videolar', books:'Kitablar', hadiths:'Hədislər', duas:'Dualar', quotes:'Sitatlar', announcements:'Elanlar', events:'Hadisələr', daily:'Günün məzmunu', customization:'FƏRDİLƏŞDİRMƏ', hero:'Ana səhifə lövhəsi', system:'SİSTEM', settings:'Parametrlər', stats:'Statistika', backup:'Ehtiyat nüsxə və bərpa', seed:'İlkin məlumatlar', pushNotif:'Anlıq bildirişlər', logout:'Çıxış', adminPanel:'Admin paneli', sections:'Admin bölmələri', dark:'Qaranlıq rejim', light:'İşıqlı rejim' },
  en: { checking:'Checking sign-in...', account:'Account & password', dashboard:'Dashboard', content:'CONTENT', videos:'Videos', books:'Books', hadiths:'Hadiths', duas:'Duas', quotes:'Quotes', announcements:'Announcements', events:'Events', daily:'Daily Content', customization:'CUSTOMIZATION', hero:'Hero banner', system:'SYSTEM', settings:'Settings', stats:'Statistics', backup:'Backup & Restore', seed:'Seed Data', pushNotif:'Push Notifications', logout:'Log out', adminPanel:'Admin Panel', sections:'Admin sections', dark:'Dark mode', light:'Light mode' },
  ru: { checking:'Проверка входа...', account:'Аккаунт и пароль', dashboard:'Главная', content:'КОНТЕНТ', videos:'Видео', books:'Книги', hadiths:'Хадисы', duas:'Дуа', quotes:'Цитаты', announcements:'Объявления', events:'События', daily:'Контент дня', customization:'НАСТРОЙКА', hero:'Главный баннер', system:'СИСТЕМА', settings:'Настройки', stats:'Статистика', backup:'Резервная копия', seed:'Начальные данные', pushNotif:'Мгновенные уведомления', logout:'Выход', adminPanel:'Админ-панель', sections:'Разделы админки', dark:'Тёмная тема', light:'Светлая тема' },
  ar: { checking:'جارٍ التحقق من تسجيل الدخول...', account:'الحساب وكلمة المرور', dashboard:'لوحة التحكم', content:'المحتوى', videos:'الفيديوهات', books:'الكتب', hadiths:'الأحاديث', duas:'الأدعية', quotes:'الاقتباسات', announcements:'الإعلانات', events:'الأحداث', daily:'محتوى اليوم', customization:'التخصيص', hero:'بانر رئيسي', system:'النظام', settings:'الإعدادات', stats:'الإحصائيات', backup:'النسخ الاحتياطي', seed:'البيانات الأولية', pushNotif:'الإشعارات', logout:'خروج', adminPanel:'لوحة الإدارة', sections:'أقسام الإدارة', dark:'الوضع الداكن', light:'الوضع الفاتح' },
  tr: { checking:'Giriş kontrol ediliyor...', account:'Hesap ve şifre', dashboard:'Yönetim Paneli', content:'İÇERİK', videos:'Videolar', books:'Kitaplar', hadiths:'Hadisler', duas:'Dualar', quotes:'Alıntılar', announcements:'Duyurular', events:'Olaylar', daily:'Günün İçeriği', customization:'KİŞİSELLEŞTİRME', hero:'Ana afiş', system:'SİSTEM', settings:'Ayarlar', stats:'İstatistik', backup:'Yedekleme ve geri yükleme', seed:'Başlangıç verileri', pushNotif:'Anlık bildirimler', logout:'Çıkış', adminPanel:'Yönetim paneli', sections:'Yönetim bölümleri', dark:'Karanlık mod', light:'Aydınlık mod' },
}

const NAV_GROUPS = [
  {
    items: [
      { key:'dashboard', icon:'home', labelKey:'dashboard', noCount:true },
    ],
  },
  {
    labelKey:'content',
    items: [
      { key:'videos',        icon:'videos', labelKey:'videos' },
      { key:'books',         icon:'books', labelKey:'books' },
      { key:'hadiths',       icon:'hadith', labelKey:'hadiths' },
      { key:'duas',          icon:'duas', labelKey:'duas' },
      { key:'quotes',        icon:'quotes', labelKey:'quotes' },
      { key:'announcements', icon:'announcements', labelKey:'announcements' },
      { key:'events',        icon:'calendar', labelKey:'events' },
      { key:'daily',         icon:'sparkle', labelKey:'daily', noCount:true },
      { key:'pushNotif',     icon:'bell', labelKey:'pushNotif', noCount:true },
    ],
  },
  {
    labelKey:'customization',
    items: [
      { key:'hero',     icon:'palette', labelKey:'hero', noCount:true },
      { key:'settings', icon:'list', labelKey:'settings', noCount:true },
    ],
  },
  {
    labelKey:'system',
    items: [
      { key:'stats',  icon:'analytics', labelKey:'stats', noCount:true },
      { key:'backup', icon:'download', labelKey:'backup', noCount:true },
      { key:'seed',   icon:'leaf', labelKey:'seed', noCount:true },
      { key:'account', icon:'shield', labelKey:'account', noCount:true },
    ],
  },
]

export default function AdminPage({ setPage }) {
  // Admin səhifəsində sayt başlığı yoxdur — tema açarı yan menyudadır
  const { lang, dark, toggleDark } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [activeTab, setActiveTab] = useState('dashboard')
  const [counts, setCounts] = useState({ videos:0, books:0, hadiths:0, duas:0, quotes:0, announcements:0, events:0, places:0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Server sessiyası (GET /api/admin/me, server/auth.js). Daxil olunmayıbsa
  // (və ya server əlçatmazdırsa) — giriş səhifəsinə. Müvəqqəti şifrə ilə
  // (mustChangePassword) panel açılmır — yalnız "Şifrəni dəyiş" forması.
  const [authStatus, setAuthStatus] = useState('loading')
  const [account, setAccount] = useState({ email: '', mustChangePassword: false })
  useEffect(() => watchAdmin(({ status, email, mustChangePassword }) => {
    setAuthStatus(status)
    if (status === 'admin') setAccount({ email, mustChangePassword })
    if (status === 'loading' || status === 'admin') return
    setPage('adminlogin')
  }), [])
  const isAdmin = authStatus === 'admin' && !account.mustChangePassword

  useEffect(() => {
    if (isAdmin) refreshCounts()
  }, [activeTab, isAdmin])

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

  const handleLogout = async () => { await signOutAdmin(); setPage('home') }

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
      case 'account':       return <AccountManager email={account.email} />
      default:              return <DashboardOverview counts={counts} setActiveTab={setActiveTab} />
    }
  }

  // Telefonda menyu düyməsində cari bölmə görünür
  const activeItem = NAV_GROUPS.flatMap(g => g.items).find(it => it.key === activeTab) || NAV_GROUPS[0].items[0]

  // Müvəqqəti şifrə: əvvəlcə yenisi təyin olunmalıdır (server də digər API-ləri bağlayır)
  if (authStatus === 'admin' && account.mustChangePassword) {
    return (
      <div className="admin-page">
        <div className="admin-main admin-main--solo">
          <AccountManager
            email={account.email}
            forced
            onChanged={() => setAccount(a => ({ ...a, mustChangePassword: false }))}
            onLogout={handleLogout}
          />
        </div>
      </div>
    )
  }

  // Giriş təsdiqlənənə qədər panel (və idarəedicilər) render olunmur
  if (!isAdmin) {
    return (
      <div className="admin-page">
        <AdminEmpty icon="shield" busy>{l.checking}</AdminEmpty>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* Yan menyu — geniş ekranda yapışqan; <900px-də bir düymə ilə açılır */}
        <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="admin-sidebar-header">
            <BrandMark size={36} className="admin-sidebar-logo" />
            <div className="admin-sidebar-id">
              <div className="admin-sidebar-title">{l.adminPanel}</div>
              <div className="admin-sidebar-sub">{brandName(lang)}</div>
            </div>
          </div>

          <button
            type="button"
            className="admin-menu-toggle"
            aria-expanded={sidebarOpen}
            aria-controls="admin-nav"
            onClick={() => setSidebarOpen(v => !v)}
          >
            <Icon name={activeItem.icon} className="admin-nav-icon" />
            <span className="admin-nav-text">{l[activeItem.labelKey]}</span>
            <Icon name="chevronDown" size={18} className="admin-menu-chev" />
          </button>

          <nav id="admin-nav" className="admin-nav-groups" aria-label={l.sections}>
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi} className="admin-nav-section">
                {group.labelKey && <div className="admin-nav-section-label">{l[group.labelKey]}</div>}
                {group.items.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    className={`admin-nav-btn ${activeTab === item.key ? 'active' : ''}`}
                    aria-current={activeTab === item.key ? 'page' : undefined}
                    onClick={() => { setActiveTab(item.key); setSidebarOpen(false); window.scrollTo({top:0, behavior:'smooth'}); }}
                  >
                    <Icon name={item.icon} className="admin-nav-icon" />
                    <span className="admin-nav-text">{l[item.labelKey]}</span>
                    {!item.noCount && counts[item.key] > 0 && (
                      <span className="admin-nav-badge">{counts[item.key]}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <button type="button" className="ui-btn ui-btn--ghost admin-logout-btn admin-theme-btn" onClick={toggleDark} aria-pressed={!!dark}>
              <Icon name={dark ? 'sun' : 'moon'} className="ui-btn__icon" /> {dark ? l.light : l.dark}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost admin-logout-btn" onClick={handleLogout}>
              <Icon name="enter" className="ui-btn__icon admin-back-arrow" /> {l.logout}
            </button>
          </div>
        </aside>

        {/* Əsas sahə (div — səhifənin <main>-i App.jsx-dədir); key: tab dəyişəndə məzmun yumşaq girsin */}
        <div className="admin-main" key={activeTab}>
          {renderTab()}
        </div>

      </div>
    </div>
  )
}
