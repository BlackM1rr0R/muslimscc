import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { m } from 'motion/react'
import LayoutFeatures from '../motion/LayoutFeatures'
import HoverPill from '../motion/HoverPill'
import { SPRING } from '../motion/presets'
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
import FeedbackManager from '../components/admin/FeedbackManager'
import AnalyticsManager from '../components/admin/AnalyticsManager'
import UserManager from '../components/admin/UserManager'
// K: icma moderasiyası (dua divarı, qadağan sözlər, profil şikayətləri, məscidlər) — panel rolu editor+
const CommunityModeration = lazy(() => import('../components/admin/CommunityModeration'))
// İstifadəçilərə məktub — yalnız baş admin (server/mailCampaigns.js)
const MailComposer = lazy(() => import('../components/admin/MailComposer'))
import { AUTH_TEXT } from '../components/account/authText'
import { AdminEmpty, AdminAlert } from '../components/admin/AdminUi'
// Saytın istifadəçi hesabı ilə panel (server/adminSso.js): 2FA bələdçisi, "Hesab" bölməsinin qeydi
import { AdminSiteGate, SiteAccountNote, SITE_GATE_STATUSES, siteBackLabel } from '../components/admin/AdminSiteGate'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AdminPage.css'
import { pickUi } from '../utils/uiText'

const LABELS = {
  az: { mail:'E-poçt göndər', moderation:'Dua divarına nəzarət', users:'İstifadəçilər', roleLabel:'Panel rolu', checking:'Giriş yoxlanılır...', account:'Hesab və şifrə', dashboard:'İdarə paneli', content:'MƏZMUN', videos:'Videolar', books:'Kitablar', hadiths:'Hədislər', duas:'Dualar', quotes:'Sitatlar', announcements:'Elanlar', events:'Hadisələr', daily:'Günün məzmunu', customization:'FƏRDİLƏŞDİRMƏ', hero:'Ana səhifə lövhəsi', system:'SİSTEM', settings:'Parametrlər', analytics:'Sayt statistikası', feedback:'Səhv bildirişləri', stats:'Statistika', backup:'Ehtiyat nüsxə və bərpa', seed:'İlkin məlumatlar', pushNotif:'Anlıq bildirişlər', logout:'Çıxış', adminPanel:'Admin paneli', sections:'Admin bölmələri', dark:'Qaranlıq rejim', light:'İşıqlı rejim' },
  en: { mail:'Send email', moderation:'Dua wall moderation', users:'Users', roleLabel:'Panel role', checking:'Checking sign-in...', account:'Account & password', dashboard:'Dashboard', content:'CONTENT', videos:'Videos', books:'Books', hadiths:'Hadiths', duas:'Duas', quotes:'Quotes', announcements:'Announcements', events:'Events', daily:'Daily Content', customization:'CUSTOMIZATION', hero:'Hero banner', system:'SYSTEM', settings:'Settings', analytics:'Site analytics', feedback:'Error reports', stats:'Statistics', backup:'Backup & Restore', seed:'Seed Data', pushNotif:'Push Notifications', logout:'Log out', adminPanel:'Admin Panel', sections:'Admin sections', dark:'Dark mode', light:'Light mode' },
  ru: { mail:'Отправить письмо', moderation:'Модерация стены дуа', users:'Пользователи', roleLabel:'Роль в панели', checking:'Проверка входа...', account:'Аккаунт и пароль', dashboard:'Главная', content:'КОНТЕНТ', videos:'Видео', books:'Книги', hadiths:'Хадисы', duas:'Дуа', quotes:'Цитаты', announcements:'Объявления', events:'События', daily:'Контент дня', customization:'НАСТРОЙКА', hero:'Главный баннер', system:'СИСТЕМА', settings:'Настройки', analytics:'Статистика сайта', feedback:'Сообщения об ошибках', stats:'Статистика', backup:'Резервная копия', seed:'Начальные данные', pushNotif:'Мгновенные уведомления', logout:'Выход', adminPanel:'Админ-панель', sections:'Разделы админки', dark:'Тёмная тема', light:'Светлая тема' },
  ar: { mail:'إرسال بريد', moderation:'الإشراف على جدار الدعاء', users:'المستخدمون', roleLabel:'الدور في اللوحة', checking:'جارٍ التحقق من تسجيل الدخول...', account:'الحساب وكلمة المرور', dashboard:'لوحة التحكم', content:'المحتوى', videos:'الفيديوهات', books:'الكتب', hadiths:'الأحاديث', duas:'الأدعية', quotes:'الاقتباسات', announcements:'الإعلانات', events:'الأحداث', daily:'محتوى اليوم', customization:'التخصيص', hero:'بانر رئيسي', system:'النظام', settings:'الإعدادات', analytics:'إحصائيات الموقع', feedback:'بلاغات الأخطاء', stats:'الإحصائيات', backup:'النسخ الاحتياطي', seed:'البيانات الأولية', pushNotif:'الإشعارات', logout:'خروج', adminPanel:'لوحة الإدارة', sections:'أقسام الإدارة', dark:'الوضع الداكن', light:'الوضع الفاتح' },
  tr: { mail:'E-posta gönder', moderation:'Dua duvarı moderasyonu', users:'Kullanıcılar', roleLabel:'Panel rolü', checking:'Giriş kontrol ediliyor...', account:'Hesap ve şifre', dashboard:'Yönetim Paneli', content:'İÇERİK', videos:'Videolar', books:'Kitaplar', hadiths:'Hadisler', duas:'Dualar', quotes:'Alıntılar', announcements:'Duyurular', events:'Olaylar', daily:'Günün İçeriği', customization:'KİŞİSELLEŞTİRME', hero:'Ana afiş', system:'SİSTEM', settings:'Ayarlar', analytics:'Site istatistikleri', feedback:'Hata bildirimleri', stats:'İstatistik', backup:'Yedekleme ve geri yükleme', seed:'Başlangıç verileri', pushNotif:'Anlık bildirimler', logout:'Çıkış', adminPanel:'Yönetim paneli', sections:'Yönetim bölümleri', dark:'Karanlık mod', light:'Aydınlık mod' },
}

// Baş admin üçün güclü tövsiyə: iki addımlı yoxlama açılana qədər hər bölmənin üstündə (server/security.js)
const TF_BANNER = {
  az: { tfBanner:'Baş admin hesabında iki addımlı yoxlama bağlıdır. Şifrə oğurlansa, saytın hər şeyi təhlükədədir — onu indi açmağı qəti tövsiyə edirik.', tfBannerBtn:'İki addımlı yoxlamanı aç' },
  en: { tfBanner:'Two-step verification is off on this super administrator account. If the password is stolen, the whole site is at risk — we strongly recommend turning it on now.', tfBannerBtn:'Turn on two-step verification' },
  ru: { tfBanner:'На аккаунте суперадминистратора двухэтапная проверка отключена. Если пароль украдут, под угрозой окажется весь сайт — настоятельно рекомендуем включить её сейчас.', tfBannerBtn:'Включить двухэтапную проверку' },
  ar: { tfBanner:'التحقق بخطوتين غير مفعّل في حساب المشرف الأعلى. إن سُرقت كلمة المرور فالموقع كله في خطر — ننصح بشدة بتفعيله الآن.', tfBannerBtn:'تفعيل التحقق بخطوتين' },
  tr: { tfBanner:'Süper yönetici hesabında iki adımlı doğrulama kapalı. Şifre çalınırsa tüm site tehlikeye girer — şimdi açmanızı kesinlikle öneririz.', tfBannerBtn:'İki adımlı doğrulamayı aç' },
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
      // Dua divarı + açıq profil şikayətləri + məscid nümayəndələri — bütün panel rolları (editor+)
      { key:'moderation',    icon:'shield', labelKey:'moderation', noCount:true },
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
      { key:'analytics', icon:'analytics', labelKey:'analytics', noCount:true },
      { key:'stats',  icon:'analytics', labelKey:'stats', noCount:true },
      { key:'feedback', icon:'alert', labelKey:'feedback', noCount:true },
      { key:'backup', icon:'download', labelKey:'backup', noCount:true },
      { key:'seed',   icon:'leaf', labelKey:'seed', noCount:true },
      // Saytın istifadəçiləri və rolları — yalnız admin / superadmin (server/users.js)
      { key:'users', icon:'user', labelKey:'users', noCount:true, minRole:'admin' },
      // İstifadəçilərə məktub — yalnız baş admin (server də yoxlayır)
      { key:'mail', icon:'mail', labelKey:'mail', noCount:true, minRole:'superadmin' },
      { key:'account', icon:'shield', labelKey:'account', noCount:true },
    ],
  },
]

export default function AdminPage({ setPage }) {
  // Admin səhifəsində sayt başlığı yoxdur — tema açarı yan menyudadır
  const { lang, dark, toggleDark } = useLang()
  const l = pickUi(LABELS, lang)

  const [activeTab, setActiveTab] = useState('dashboard')
  const [counts, setCounts] = useState({ videos:0, books:0, hadiths:0, duas:0, quotes:0, announcements:0, events:0, places:0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navRef = useRef(null)

  // Server sessiyası (GET /api/admin/me, server/auth.js). Daxil olunmayıbsa
  // (və ya server əlçatmazdırsa) — giriş səhifəsinə. Müvəqqəti şifrə ilə
  // (mustChangePassword) panel açılmır — yalnız "Şifrəni dəyiş" forması.
  // Sayt hesabı ilə (via:'site'): panel rolu var, amma 2FA bağlıdır və s. — bələdçi ekranı (AdminSiteGate).
  const [authStatus, setAuthStatus] = useState('loading')
  const [account, setAccount] = useState({ email: '', mustChangePassword: false, role: '', twoFactor: undefined, via: 'session' })
  useEffect(() => watchAdmin(({ status, email, mustChangePassword, role, twoFactor, via }) => {
    setAuthStatus(status)
    if (status === 'admin') setAccount({ email, mustChangePassword, role, twoFactor, via })
    if (status === 'loading' || status === 'admin' || SITE_GATE_STATUSES.has(status)) return
    setPage('adminlogin')
  // Bir dəfəlik abunə (watchAdmin) — setPage dəyişsə belə yenidən abunə lazım deyil
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])
  const isAdmin = authStatus === 'admin' && !account.mustChangePassword
  // İstifadəçi idarəsi yalnız admin və superadmin üçün (editor görmür)
  const canUsers = account.role === 'admin' || account.role === 'superadmin'
  const canMail = account.role === 'superadmin'
  const navGroups = NAV_GROUPS.map(g => ({ ...g, items: g.items.filter(it => !it.minRole || (it.minRole === 'superadmin' ? canMail : canUsers)) }))
  // "İstifadəçilər" bölməsində seçilənlər → "E-poçt göndər" bölməsinə ötürülür ({ id, email }[])
  const [mailTargets, setMailTargets] = useState([])
  const composeTo = (list) => { setMailTargets(list); setActiveTab('mail'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const roleNames = pickUi(AUTH_TEXT, lang).roles

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

  const viaSite = account.via === 'site'
  // Sayt hesabı ilə: "Sayta qayıt" (sayt hesabından çıxış saytın öz menyusundadır)
  const handleLogout = async () => { if (!viaSite) await signOutAdmin(); setPage('home') }

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
      case 'moderation':    return <Suspense fallback={<AdminEmpty icon="shield" busy>{l.checking}</AdminEmpty>}><CommunityModeration /></Suspense>
      case 'hero':          return <HeroBannerManager />
      case 'settings':      return <SettingsManager />
      case 'stats':         return <StatsManager />
      case 'feedback':      return <FeedbackManager />
      case 'analytics':     return <AnalyticsManager />
      case 'backup':        return <BackupManager />
      case 'seed':          return <SeedManager />
      case 'users':         return canUsers ? <UserManager actorRole={account.role} actorEmail={account.email} onCompose={canMail ? composeTo : undefined} /> : <DashboardOverview counts={counts} setActiveTab={setActiveTab} />
      case 'mail':          return canMail ? <Suspense fallback={<AdminEmpty icon="mail" busy>{l.checking}</AdminEmpty>}><MailComposer targets={mailTargets} onClearTargets={() => setMailTargets([])} /></Suspense> : <DashboardOverview counts={counts} setActiveTab={setActiveTab} />
      case 'account':       return viaSite ? <SiteAccountNote email={account.email} /> : <AccountManager email={account.email} twoFactor={account.twoFactor} onTwoFactor={(on) => setAccount(a => ({ ...a, twoFactor: on }))} />
      default:              return <DashboardOverview counts={counts} setActiveTab={setActiveTab} />
    }
  }

  // Telefonda menyu düyməsində cari bölmə görünür
  const activeItem = navGroups.flatMap(g => g.items).find(it => it.key === activeTab) || NAV_GROUPS[0].items[0]

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

  // Sayt hesabının panel rolu var, amma şərt ödənməyib (2FA və s.) — yalnız bələdçi, heç bir məlumat yox
  if (SITE_GATE_STATUSES.has(authStatus)) {
    return (
      <div className="admin-page">
        <div className="admin-main admin-main--solo">
          <AdminSiteGate status={authStatus} setPage={setPage} />
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
              {account.role && (
                <span className={`ui-badge admin-role-badge${account.role === 'superadmin' ? ' admin-role-badge--super' : ''}`} data-testid="admin-role" title={l.roleLabel}>
                  <span className="ui-sr-only">{l.roleLabel}: </span>{roleNames[account.role] || account.role}
                </span>
              )}
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

          {/* v6: siçanın altında yumşaq hap (HoverPill), aktiv sətrin zümrüd zolağı yayla yeni sətrə sürüşür (layoutId) */}
          <LayoutFeatures>
          <nav id="admin-nav" ref={navRef} className="admin-nav-groups admin-nav-groups--mo" aria-label={l.sections}>
            <HoverPill containerRef={navRef} selector=".admin-nav-btn" className="admin-nav-hover" />
            {navGroups.map((group, gi) => (
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
                    {activeTab === item.key && <m.span layoutId="admin-nav-mark" className="admin-nav-mark" transition={SPRING.snappy} aria-hidden="true" />}
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
          </LayoutFeatures>

          <div className="admin-sidebar-footer">
            <button type="button" className="ui-btn ui-btn--ghost admin-logout-btn admin-theme-btn" onClick={toggleDark} aria-pressed={!!dark}>
              <Icon name={dark ? 'sun' : 'moon'} className="ui-btn__icon" /> {dark ? l.light : l.dark}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost admin-logout-btn" onClick={handleLogout}>
              <Icon name="enter" className="ui-btn__icon admin-back-arrow" /> {viaSite ? siteBackLabel(lang) : l.logout}
            </button>
          </div>
        </aside>

        {/* Əsas sahə (div — səhifənin <main>-i App.jsx-dədir); key: tab dəyişəndə məzmun yumşaq girsin */}
        <div className="admin-main" key={activeTab}>
          {account.role === 'superadmin' && account.twoFactor === false && activeTab !== 'account' && (
            <AdminAlert tone="warn" className="admin-2fa-banner">
              {pickUi(TF_BANNER, lang).tfBanner}{' '}
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setActiveTab('account')}>{pickUi(TF_BANNER, lang).tfBannerBtn}</button>
            </AdminAlert>
          )}
          {renderTab()}
        </div>

      </div>
    </div>
  )
}
