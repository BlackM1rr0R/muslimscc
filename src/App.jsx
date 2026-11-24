import { Component, Suspense, lazy as reactLazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { reportError } from './utils/errorReport'
import OfflineBadge from './components/OfflineBadge'
import AutoSyncToast from './components/AutoSyncToast'
import { Navigate, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { LangProvider, useStoredLangRedirect } from './contexts/LangContext'
import { ALL_LANGS, parsePath, pathFor, legacyDetailParam, uiLang } from './seo/routes'
import Seo from './seo/Seo'
import { isOverlayEntry } from './utils/useBackToClose'
import Header from './components/Header'
// H5: uşaq rejimi — kilid sinxron oxunur (kiçik modul); qabıq yalnız aktiv olanda tənbəl yüklənir
import { isKidLocked, kidAllowed, KIDLOCK_EVENT, KIDLOCK_KEY } from './utils/kidLock'
// Naviqasiya:
//   ≥1024px — başlığın altında həmişə açıq yan panel (SideNav "rail", qərar #5)
//   <1024px — başlıqdakı ☰ sağdan sürüşən çəkmə menyunu açır (Header →
//             SideNav "drawer", qərar #7). Aşağı zolaq YOXDUR — aşağı hissə boşdur.
import SideNav from './components/SideNav'
import useMedia from './hooks/useMedia'
import Footer from './components/Footer'
import InstallBanner from './components/InstallBanner'
// Tək üzən düymə (AI, əlçatanlıq, bildirişlər) — əvvəlki 3 ayrı dairəvi düymənin yerinə.
// Adi import: dok özü yüngüldür, ağır panelləri (AI, bildirişlər) içəridə tənbəl yükləyir,
// əlçatanlıq tərcihləri isə ilk boyamadan tətbiq olunmalıdır.
import FloatingDock from './components/FloatingDock'
// D dəstəsi: "Kəşf et" turu + menyuda "Yeni" nişanlarının "açıldı" qeydi. Host kiçikdir (adi import —
// tur düyməsinin hadisəsi itməsin); turun özü və ilk gəliş təklifi öz içində tənbəl yüklənir.
import TourHost from './components/tour/TourHost'
import { lazyWhenIdle, whenIdle } from './utils/idle'
import { usePageviews } from './api/analytics'
import { withChunkRetry } from './utils/chunkRetry'
import { markRouteLoading, withViewTransition, routeCommitted, leavePage } from './utils/wow'
// Dizayn v6: tək Motion konteksti (LazyMotion — xüsusiyyətlər boş vaxtda, ayrıca chunk)
// və <main> keçidi (AnimatePresence; View Transition ilə növbələşir — src/motion/PageTransition)
import MotionProvider from './motion/MotionProvider'
import PageTransition from './motion/PageTransition'

// Bütün tənbəl modullar (səhifələr, widget-lər) chunk xətasında bir dəfə
// avtomatik yenilənir (utils/chunkRetry.js — deploydan sonra köhnə tabda
// hash-li fayl yoxdur). İkinci uğursuzluq xəta kimi atılır → PageErrorBoundary.
// Ad qəsdən "lazy" qalır: scripts/prerender.mjs bu faylda
// "lazy(() => import('./pages/X'))" nümunəsini oxuyur.
// .preload() — naviqasiyadan əvvəl chunk-ı başlatmaq üçün (yüklənmə zolağı,
// View Transition yalnız modul hazır olanda — bax: navigate). .loaded — hazırdır.
const lazy = (factory) => {
  const load = withChunkRetry(factory)
  let promise = null
  const preload = () => {
    if (!promise) {
      promise = load().then((m) => { Comp.loaded = true; return m })
      promise.catch(() => { promise = null })
    }
    return promise
  }
  const Comp = reactLazy(preload)
  Comp.preload = preload
  return Comp
}

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
  Page.preload = () => preload().then((m) => { Page.loaded = true; return m })
  return Page
}

/**
 * main.jsx ilk render-dən əvvəl çağırır: açılan ünvan ana səhifədirsə, onun
 * chunk-ını gözlə (prerender HTML-i onu artıq modulepreload ilə yükləyir).
 * Digər səhifələr gözlənilmir — ağır səhifə (məs. /hadith) başlığın görünməsini
 * ləngitməsin; onlarda əvvəlki kimi Suspense fallback göstərilir.
 */
export function preloadInitialPage(pathname) {
  const { key, known } = parsePath(pathname)
  if (!known || key !== 'home') return Promise.resolve()
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
const NameCalligraphyPage = lazy(() => import('./pages/NameCalligraphyPage'))
const BabyNamesPage = lazy(() => import('./pages/BabyNamesPage'))
const QuranGamePage = lazy(() => import('./pages/QuranGamePage'))
const CharityPage = lazy(() => import('./pages/CharityPage'))
const HajjGuidePage = lazy(() => import('./pages/HajjGuidePage'))
const QuoteGeneratorPage = lazy(() => import('./pages/QuoteGeneratorPage'))
const DuaJournalPage = lazy(() => import('./pages/DuaJournalPage'))
const MosqueFinderPage = lazy(() => import('./pages/MosqueFinderPage'))
const IslamicHistoryPage = lazy(() => import('./pages/IslamicHistoryPage'))
const SahabePage = lazy(() => import('./pages/SahabePage'))
const ScholarsPage = lazy(() => import('./pages/ScholarsPage'))
const HalalCheckPage = lazy(() => import('./pages/HalalCheckPage'))
const MuhasabahPage = lazy(() => import('./pages/MuhasabahPage'))
const GroupPage = lazy(() => import('./pages/GroupPage'))
const WidgetPage = lazy(() => import('./pages/WidgetPage'))
const MosqueTvPage = lazy(() => import('./pages/MosqueTvPage'))
const QuranRootsPage = lazy(() => import('./pages/QuranRootsPage'))
// C dəstəsi: Quranda məna ilə axtarış, yeni müsəlmanın yolu, sədəqeyi-cariyə gündəliyi
const QuranMeaningPage = lazy(() => import('./pages/QuranMeaningPage'))
const NewMuslimPathPage = lazy(() => import('./pages/NewMuslimPathPage'))
// P2: həyat bələdçiləri (körpə, vəfat, nikah)
const NewbornGuidePage = lazy(() => import('./pages/NewbornGuidePage'))
const LovedOneGuidePage = lazy(() => import('./pages/LovedOneGuidePage'))
const NikahGuidePage = lazy(() => import('./pages/NikahGuidePage'))
const OnTheRoadPage = lazy(() => import('./pages/OnTheRoadPage'))
const BedtimeRoutinePage = lazy(() => import('./pages/BedtimeRoutinePage'))
// Ramazana hazırlıq yolu + son 10 gecə (bir səhifə, iki marşrut)
const RamadanPrepPage = lazy(() => import('./pages/RamadanPrepPage'))
const MorningRoutinePage = lazy(() => import('./pages/MorningRoutinePage'))
const FocusPage = lazy(() => import('./pages/FocusPage'))
const JariyahJournalPage = lazy(() => import('./pages/JariyahJournalPage'))
// P3: gizli dua dostu, Həcc ailə izləyicisi, qəbir ziyarəti xəritəsi
const SecretDuaFriendPage = lazy(() => import('./pages/SecretDuaFriendPage'))
const HajjTrackerPage = lazy(() => import('./pages/HajjTrackerPage'))
const GraveVisitsPage = lazy(() => import('./pages/GraveVisitsPage'))
// R2: həftəlik ailə halqası, xəstəni ziyarət bələdçisi
const FamilyHalaqaPage = lazy(() => import('./pages/FamilyHalaqaPage'))
const SickVisitPage = lazy(() => import('./pages/SickVisitPage'))
// P1: borc dəftəri, heyz/nifas təqvimi, sadə rejim, şəri ölçü vahidləri
const DebtLedgerPage = lazy(() => import('./pages/DebtLedgerPage'))
const HaidCalendarPage = lazy(() => import('./pages/HaidCalendarPage'))
// R3: müsəlman səyyahın dəsti, 'Mənim ilim' çap kitabı
const TravellerKitPage = lazy(() => import('./pages/TravellerKitPage'))
const YearBookPage = lazy(() => import('./pages/YearBookPage'))
// Əmanət qutusu — uçdan-uca şifrəli vəsiyyət qeydləri (server/trustBox.js)
const TrustBoxPage = lazy(() => import('./pages/TrustBoxPage'))
// D dəstəsi: yeniliklər (tarixli siyahı)
const WhatsNewPage = lazy(() => import('./pages/WhatsNewPage'))
// PWA paylaşma hədəfi (/share — manifest share_target)
const ShareTargetPage = lazy(() => import('./pages/ShareTargetPage'))
const SimpleModePage = lazy(() => import('./pages/SimpleModePage'))
const ShariaUnitsPage = lazy(() => import('./pages/ShariaUnitsPage'))
const MushafPage = lazy(() => import('./pages/MushafPage'))
const HijriPage = lazy(() => import('./pages/HijriPage'))
const QadaPage = lazy(() => import('./pages/QadaPage'))
const InheritancePage = lazy(() => import('./pages/InheritancePage'))
const Nawawi40Page = lazy(() => import('./pages/Nawawi40Page'))
const HadithLibraryPage = lazy(() => import('./pages/HadithLibraryPage'))
const HadeethEncPage = lazy(() => import('./pages/HadeethEncPage'))
const FatwaPage = lazy(() => import('./pages/FatwaPage'))
const HisnPage = lazy(() => import('./pages/HisnPage'))
const LessonsPage = lazy(() => import('./pages/LessonsPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const VideosPage = lazy(() => import('./pages/VideosPage'))
const BooksPage = lazy(() => import('./pages/BooksPage'))
const AIChatPage = lazy(() => import('./pages/AIChatPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const LicensesPage = lazy(() => import('./pages/LicensesPage'))
// İstifadəçi hesabı (server/users.js, docs/USER-ACCOUNTS.md) — noindex, yalnız açılanda yüklənir
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AccountTokenPage = lazy(() => import('./pages/AccountTokenPage'))
const ReadTogetherPage = lazy(() => import('./pages/ReadTogetherPage'))
const KhatmPage = lazy(() => import('./pages/KhatmPage'))
const HifzTestPage = lazy(() => import('./pages/HifzTestPage'))
const TogetherPage = lazy(() => import('./pages/TogetherPage'))
// K mərhələsi: dua divarı (moderasiyalı) və könüllü açıq profil (/u/<ləqəb>)
const DuaWallPage = lazy(() => import('./pages/DuaWallPage'))
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'))
// İcma lövhələri: namaz otaqları, cənazə elanı (gizli keçid #n=…), məscid könüllüləri
const PrayerRoomsPage = lazy(() => import('./pages/PrayerRoomsPage'))
const JanazaPage = lazy(() => import('./pages/JanazaPage'))
const VolunteersPage = lazy(() => import('./pages/VolunteersPage'))

// Bu widget-lər hər səhifədə render olunur, amma heç biri ilk ekran üçün
// vacib deyil — ona görə tənbəl yüklənir.
// PERFORMANS: chunk-ları yalnız "load"-dan sonra, boş vaxtda (utils/idle.js)
// yüklənir — ilk render-də LCP resursları ilə yarışmasın. Hər ikisi
// fallback={null} ilə üzən elementdir (axında yer tutmur — CLS yoxdur);
// bildiriş onsuz da promptCoordinator ilə gecikmə ilə göstərilir.
const AnnouncementToast = lazy(lazyWhenIdle(() => import('./components/AnnouncementToast')))
const NotificationPrompt = lazy(lazyWhenIdle(() => import('./components/NotificationPrompt')))
// v5.7: "yeni nişan" bildirişi (utils/badges) — boş vaxtda
const BadgeToast = lazy(lazyWhenIdle(() => import('./components/BadgeToast')))
// v5.7: azan oxunanda tam ekran "azan anı" (utils/azanAudio)
const AzanMoment = lazy(lazyWhenIdle(() => import('./components/AzanMoment')))
// v5.8: mətni seçəndə Kopyala · Şəkil kartı · Paylaş
const SelectShare = lazy(lazyWhenIdle(() => import('./components/SelectShare')))
// v5.8: bayram günlərində bayram görünüşü (utils/eid)
const EidMode = lazy(lazyWhenIdle(() => import('./components/EidMode')))
// P3: "Kimsə sizin üçün dua etdi" — yalnız gizli dua dostuna qoşulan cihazda serverə soruşur
const DuaFriendNotice = lazy(lazyWhenIdle(() => import('./components/p3/DuaFriendNotice')))
// "Səhv bildir" — bütün sayt üçün tək dialoq (düymələr yalnız hadisə göndərir)
const ReportErrorHost = lazy(lazyWhenIdle(() => import('./components/ReportErrorButton').then(m => ({ default: m.ReportErrorHost }))))

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
    reportError('boundary', error)
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

// "#admin" qısayolu və ayrıca admin giriş səhifəsi YOXDUR (2026-11-24): panel yalnız saytın hesabı ilə,
// /account/panel ünvanında açılır (src/seo/routes.js → ADMIN_PATH, docs/ADMIN-SECURITY.md)

// H5: uşaq rejiminin qabığı (components/kid/KidShell) — yalnız kilid açıq olanda
const KidShell = lazy(() => import('./components/kid/KidShell'))
function useKidLock() {
  const [on, setOn] = useState(() => isKidLocked())
  useEffect(() => {
    const f = () => setOn(isKidLocked())
    const st = (e) => { if (e.key === KIDLOCK_KEY || e.key === null) f() }
    window.addEventListener(KIDLOCK_EVENT, f)
    window.addEventListener('storage', st)
    return () => { window.removeEventListener(KIDLOCK_EVENT, f); window.removeEventListener('storage', st) }
  }, [])
  return on
}

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
  if (parts.length && ALL_LANGS.includes(parts[0])) lang = parts.shift()
  const to = parts.length === 1 ? LEGACY_REDIRECTS[parts[0].toLowerCase()] : null
  return to ? { lang, to } : null
}

function AppInner() {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const navSeq = useRef(0)
  // Geri/irəli düyməsi (POP) — yeni səhifə əks tərəfdən gəlir (motion.css →
  // .page-enter--back). İlk açılış da POP-dur, ona görə ilk ünvan sayılmır.
  const navType = useNavigationType()
  const firstKey = useRef(null)
  if (firstKey.current === null) firstKey.current = location.key
  const isBack = navType === 'POP' && location.key !== firstKey.current

  useStoredLangRedirect()

  // vE: Ramazan albomu — hər açılışda (boş vaxtda) cari / son Ramazanın fəsli yenilənir
  // (idempotent; ayrı kiçik chunk — ilk paketə düşmür). utils/ramadanAlbum
  useEffect(() => {
    let off = false
    whenIdle({ delay: 4000 }).then(() => (off ? null : import('./utils/ramadanAlbum')))
      .then((m) => { if (m && !off) m.snapshotAlbum() }).catch(() => {})
    return () => { off = true }
  }, [])

  // K5: həftəlik e-poçt hesabatı açıqdırsa (bu cihazın ipucu mcc_weekly) — həftənin rəqəmlərini boş vaxtda
  // hesablayıb göndər (ən çox 3 saatda bir; utils/weeklyReport). İpucu yoxdursa heç nə yüklənmir.
  useEffect(() => {
    let off = false
    let on = false
    try { on = Boolean(localStorage.getItem('mcc_weekly')) && Boolean(localStorage.getItem('mcc_logged_in')) } catch { /* */ }
    if (!on) return undefined
    whenIdle({ delay: 6000 }).then(() => (off ? null : import('./utils/weeklyReport')))
      .then((mod) => { if (mod && !off) mod.maybeUpload() }).catch(() => {})
    return () => { off = true }
  }, [])

  const legacy = legacyRedirect(location.pathname)

  // Səhifə və dil artıq URL-dən oxunur — hər səhifənin öz ünvanı var
  // (/quran, /ru/quran) ki, Google onları ayrıca indeksləyə bilsin.
  const { lang, key, known, param, removed, fallback } = parsePath(location.pathname)
  const isAdminKey = key === 'admin'
  // İdarə paneli: sayt hesabı daxil olub, amma panel rolu yoxdursa (AdminPage → onDenied) — 404 səhifəsi.
  // Yalnız həmin ünvan üçün yadda qalır (başqa səhifəyə keçəndə sıfırlanmış sayılır).
  const [panelDenied, setPanelDenied] = useState(null)
  // Tanınmayan ünvan → 'notfound' (404 səhifəsi, noindex) — əvvəl səssizcə ana səhifə açılırdı
  const page = !known || (isAdminKey && panelDenied === location.pathname) ? 'notfound' : key
  // Kukisiz statistika: hər yeni ünvan üçün bir mayak (admin sayılmır, 404 → '/404')
  usePageviews(location.pathname, { skip: isAdminKey && page !== 'notfound', notFound: page === 'notfound' })

  // Səhifələr hələ də setPage('quran') çağırır — API dəyişmir,
  // sadəcə altında state yerinə həqiqi URL naviqasiyası var.
  // Açıq üst qatdan (çəkmə menyu, axtarış) keçid "replace" ilə olur:
  // onların tarixçə girişi (utils/useBackToClose) yeni səhifə ilə əvəzlənir,
  // Geri düyməsi isə əvvəlki səhifəyə — təkrarsız — qayıdır.
  // VAU 2: modul artıq yüklənibsə keçid View Transitions API ilə (köhnə kadr
  // yumşaq solur, yeni səhifə qalxır — utils/wow.js); yüklənməyibsə yuxarıda
  // nazik yüklənmə zolağı görünür və köhnə səhifə yeni hazır olana qədər qalır.
  // Üst qatdan (overlay) keçid həmişə sinxrondur — tarixçə sırası dəyişməsin.
  // v5.5: modul yüklənməyibsə — əvvəl yüklənir (yuxarıda zolaq, köhnə səhifə
  // yerində), SONRA keçid animasiyası ilə açılır; arada başqa linkə basılıbsa
  // köhnə istək atılır (navSeq). Yükləmə alınmasa — adi keçid (xəta sərhədi).
  const navigate = (p) => {
    const replace = isOverlayEntry()
    const seq = ++navSeq.current
    const go = () => {
      routerNavigate(pathFor(p, lang), { replace })
      window.scrollTo(0, 0)
    }
    const type = p !== page ? pageElement(p)?.type : null
    if (!type) { go(); return }
    leavePage(MAIN_ID)   // telefon: köhnə səhifə dərhal yola düşür (motion.css)
    if (replace) {   // üst qatdan (menyu, axtarış) — sinxron, tarixçə sırası qorunur
      if (type.preload && !type.loaded) markRouteLoading(type.preload())
      go(); return
    }
    if (type.preload && !type.loaded) {
      markRouteLoading(type.preload()).then(
        () => { if (seq === navSeq.current) withViewTransition(go) },
        () => { if (seq === navSeq.current) go() },
      )
    } else withViewTransition(go)
  }

  // Skip link: <main>-ə fokus (hash dəyişmir)
  const skipToMain = (e) => {
    e.preventDefault()
    const main = document.getElementById(MAIN_ID)
    if (main) {
      main.focus({ preventScroll: true })
      main.scrollIntoView({ block: 'start' })
    }
  }

  // Yeni səhifə commit olunanda View Transition-a "yeni kadr hazırdır" de
  useLayoutEffect(() => { routeCommitted() }, [location.key])

  const renderPage = () => pageElement(page)
  function pageElement(pg) {
    switch (pg) {
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
      case 'namecalligraphy': return <NameCalligraphyPage setPage={navigate} />
      case 'babynames': return <BabyNamesPage setPage={navigate} />
      case 'qurangame':     return <QuranGamePage     setPage={navigate} />
      case 'charity':       return <CharityPage       setPage={navigate} />
      case 'hajjguide':     return <HajjGuidePage     setPage={navigate} />
      case 'quotes':        return <QuoteGeneratorPage setPage={navigate} />
      case 'duajournal':    return <DuaJournalPage    setPage={navigate} />
      case 'mosques':       return <MosqueFinderPage  setPage={navigate} />
      case 'history':       return <IslamicHistoryPage setPage={navigate} />
      case 'sahaba':        return <SahabePage         setPage={navigate} />
      case 'scholars':      return <ScholarsPage       setPage={navigate} />
      case 'halalcheck': return <HalalCheckPage setPage={navigate} />
      case 'muhasabah':  return <MuhasabahPage setPage={navigate} />
      case 'group':      return <GroupPage setPage={navigate} />
      case 'widget':     return <WidgetPage setPage={navigate} />
      case 'mosquetv':   return <MosqueTvPage setPage={navigate} />
      case 'quranroots': return <QuranRootsPage setPage={navigate} />
      case 'quranmeaning': return <QuranMeaningPage setPage={navigate} />
      case 'newmuslim':  return <NewMuslimPathPage setPage={navigate} />
      case 'newborn':    return <NewbornGuidePage setPage={navigate} />
      case 'bereavement': return <LovedOneGuidePage setPage={navigate} />
      case 'nikahprep':  return <NikahGuidePage setPage={navigate} />
      case 'onroad':     return <OnTheRoadPage setPage={navigate} />
      case 'bedtime':    return <BedtimeRoutinePage setPage={navigate} />
      case 'ramadanprep': return <RamadanPrepPage setPage={navigate} view="road" />
      case 'lastten':    return <RamadanPrepPage setPage={navigate} view="nights" />
      case 'waking':     return <MorningRoutinePage setPage={navigate} />
      case 'focus':      return <FocusPage setPage={navigate} />
      case 'jariyah':    return <JariyahJournalPage setPage={navigate} />
      case 'duafriend':  return <SecretDuaFriendPage />
      case 'hajjtracker': return <HajjTrackerPage />
      case 'gravevisit': return <GraveVisitsPage />
      case 'halaqa':     return <FamilyHalaqaPage setPage={navigate} />
      case 'sickvisit':  return <SickVisitPage setPage={navigate} />
      case 'debts':      return <DebtLedgerPage setPage={navigate} />
      case 'haid':       return <HaidCalendarPage setPage={navigate} />
      case 'travelkit':  return <TravellerKitPage setPage={navigate} />
      case 'yearbook':   return <YearBookPage setPage={navigate} />
      case 'trustbox':   return <TrustBoxPage />
      case 'whatsnew':   return <WhatsNewPage setPage={navigate} />
      case 'share':      return <ShareTargetPage setPage={navigate} />
      case 'simple':     return <SimpleModePage setPage={navigate} />
      case 'units':      return <ShariaUnitsPage setPage={navigate} />
      case 'mushaf':     return <MushafPage setPage={navigate} />
      case 'hijri':      return <HijriPage setPage={navigate} />
      case 'qada':       return <QadaPage setPage={navigate} />
      case 'inheritance': return <InheritancePage setPage={navigate} />
      case 'nawawi40':   return <Nawawi40Page setPage={navigate} />
      case 'hadithbooks': return <HadithLibraryPage setPage={navigate} />
      case 'hadeethenc': return <HadeethEncPage setPage={navigate} />
      case 'fatwa':      return <FatwaPage setPage={navigate} />
      case 'hisn':       return <HisnPage setPage={navigate} />
      case 'learn':         return <LessonsPage        setPage={navigate} />
      case 'analytics':     return <AnalyticsPage      setPage={navigate} />
      case 'admin':         return <AdminPage         setPage={navigate} onDenied={() => setPanelDenied(location.pathname)} />
      case 'videos':        return <VideosPage        setPage={navigate} />
      case 'books':         return <BooksPage         setPage={navigate} />
      case 'aichat':        return <AIChatPage        setPage={navigate} />
      case 'privacy':       return <PrivacyPage       setPage={navigate} />
      case 'terms':         return <TermsPage         setPage={navigate} />
      case 'licenses':      return <LicensesPage      setPage={navigate} />
      case 'login':         return <LoginPage         setPage={navigate} mode="login" />
      case 'signup':        return <LoginPage         setPage={navigate} mode="signup" />
      case 'account':       return <AccountPage       setPage={navigate} />
      case 'accountverify': return <AccountTokenPage  setPage={navigate} mode="verify" />
      case 'accountreset':  return <AccountTokenPage  setPage={navigate} mode="reset" />
      case 'readtogether':  return <ReadTogetherPage />
      case 'khatm':         return <KhatmPage />
      case 'hifztest':      return <HifzTestPage />
      case 'together':      return <TogetherPage />
      case 'duawall':       return <DuaWallPage />
      case 'publicprofile': return <PublicProfilePage setPage={navigate} />
      case 'prayerrooms':   return <PrayerRoomsPage />
      case 'janaza':        return <JanazaPage />
      case 'volunteers':    return <VolunteersPage />
      case 'notfound':      return <NotFoundPage      setPage={navigate} />
      default:              return <HomePage          setPage={navigate} />
    }
  }

  // ≥1024px — yan panel (globals.css, SideNav.css ilə eyni sərhəd); hook — ilk return-dən əvvəl
  const wide = useMedia('(min-width: 1024px)')
  const kidLock = useKidLock()
  // H5: uşaq rejimində icazəsiz səhifə (AI, hesab, admin, 404 …) → /kids (eyni dil)
  if (kidLock && !kidAllowed(page)) return <Navigate to={pathFor('kids', lang)} replace />
  if (legacy) return <Navigate to={pathFor(legacy.to, legacy.lang)} replace />
  // Köhnə siyahıdan çıxarılmış ad (/names/23-al-khafid) → /names siyahısı (replace)
  if (removed) return <Navigate to={pathFor(key, lang)} replace />
  // Əlavə dildə olmayan səhifə (/id/prayer) → ingiliscə variantı (src/seo/langs.js)
  if (fallback) return <Navigate to={`${pathFor(key, lang, param ?? undefined)}${location.search}${location.hash}`} replace />
  const detailFix = known ? canonicalDetail(location, key, lang, param) : null
  if (detailFix) return <Navigate to={detailFix} replace state={location.state} />

  // Admin səhifələri Header/Footer göstərmir — nə yan panel, nə çəkmə menyu
  const isAdminPage = page === 'admin'
  // Məscid ekranı (televizor/iframe) — başlıq, menyu və köməkçilər olmadan, tam ekran
  const isBarePage = isAdminPage || page === 'mosquetv'

  // Səhifə keçidi (v6: src/motion/PageTransition — AnimatePresence): yeni <main>
  // yumşaq qalxır (telefonda oxu istiqamətindən gəlir); View Transition gedirsə
  // Motion susur — hər naviqasiyada TƏK mexanizm. Suspense qəsdən <main>-dən KƏNARDADIR: naviqasiya
  // startTransition ilə gedir (main.jsx → v7_startTransition), ona görə
  // artıq görünən sərhəd yeni səhifənin kodu yüklənənə qədər KÖHNƏ səhifəni
  // saxlayır — arada boş ekran / spinner "yanıb-sönməsi" olmur. Spinner
  // yalnız ilk açılışda (hələ heç nə göstərilməyibsə) görünür.
  const pageMain = (
    <PageErrorBoundary page={page} lang={uiLang(lang)}>
    <Suspense fallback={<PageFallback />}>
      {/* PERFORMANS (CLS): <main> ən azı görünən sahə hündürlüyündədir — footer
          ilk kadrda ekranın ALTINDAN başlayır. Əvvəl səhifə chunk-ı / məlumatı
          yüklənərkən <main> qısa olurdu, footer ekranın ortasında görünür, sonra
          məzmun gələndə aşağı itələnirdi: Lighthouse masaüstü /quran-da
          CLS 0.528 (bal 5/100). Hündür səhifələrdə heç nə dəyişmir. */}
      <PageTransition pageKey={page} back={isBack} id={MAIN_ID} tabIndex={-1} style={MAIN_STYLE}>
        {renderPage()}
      </PageTransition>
    </Suspense>
    </PageErrorBoundary>
  )

  // H5: uşaq rejimi — sadə başlıq, footer / yan panel / üzən düymə / bildirişlər yoxdur
  if (kidLock) {
    return (
      <>
        <Seo page={page} lang={lang} param={page === key ? param : null} />
        <Suspense fallback={null}>
          <KidShell page={page} mainId={MAIN_ID}>{pageMain}</KidShell>
        </Suspense>
      </>
    )
  }

  if (isBarePage) {
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
      <a className="qm-skip" href={`#${MAIN_ID}`} onClick={skipToMain}>{SKIP_LABEL[uiLang(lang)] || SKIP_LABEL.az}</a>
      <Header currentPage={page} setPage={navigate} />

      {/* Tətbiq qabığı (globals.css → .qm-shell): [yan panel | əsas sütun].
          Əsas sütunda <main> VƏ footer var — footer panelin altına düşmür.
          Ərəbcədə grid güzgülənir, panel sağda olur. */}
      <div className="qm-shell">
        {/* Telefonda yan panel gizlidir — heç render olunmur (v5.4, ~490 DOM düyünü) */}
        {wide && <SideNav mode="rail" currentPage={page} setPage={navigate} />}
        <div className="qm-shell-main">
          {pageMain}
          <Footer setPage={navigate} />
        </div>
      </div>

      <InstallBanner />
      <OfflineBadge />
      <AutoSyncToast />
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
        <ReportErrorHost />
        <BadgeToast />
        <AzanMoment />
        <SelectShare />
        <EidMode />
        <DuaFriendNotice />
      </Suspense>
      {/* Suspense-dən KƏNARDA: yuxarıdakı qardaşlar lazyWhenIdle-dır (load + ~1.2 s + idle) — eyni
          sərhəddə olsa host o vaxta qədər mount olmur, "Turu başlat" kliki (qm-tour-open) itir və
          yeni səhifənin "Yeni" nişanı götürülmür. Host adi importdur; tur öz Suspense-i ilə yüklənir. */}
      <TourHost page={page} setPage={navigate} />
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <MotionProvider>
        <AppInner />
      </MotionProvider>
    </LangProvider>
  )
}
