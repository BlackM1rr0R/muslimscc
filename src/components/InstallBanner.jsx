import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/mosque'
import {
  usePromptSlot,
  useBottomInset,
  useAutoHide,
  engagedMs,
  wasShownThisSession,
} from '../utils/promptCoordinator'
import '../styles/InstallBanner.css'

// ═══════════════════════════════════════════════════════
// PWA quraşdırma zolağı
//
// Sahibinin rəyi ilə sakitləşdirildi:
//   • yalnız brauzer həqiqətən "beforeinstallprompt" göndərəndə
//     (və ya iOS Safari-də) çıxır;
//   • ilk ~20 s görünən vaxtdan əvvəl çıxmır;
//   • bildiriş icazəsi və elan toast-u ilə eyni anda çıxmır
//     (promptCoordinator — eyni anda yalnız bir prompt);
//   • yığcam zolaqdır, görünəndə səhifə aşağıdan boşluq alır
//     (--bottom-inset), heç nəyi örtmür; sessiyada ən çox bir dəfə.
// ═══════════════════════════════════════════════════════

const LABELS = {
  az: { install:'Tətbiqi yüklə', desc:'Offline istifadə et, sürətli giriş', close:'Bağla', iosTitle:'iOS-da yükləmək üçün:', iosStep1:'Aşağıdakı paylaş düyməsinə bas ⬆️', iosStep2:'"Ana ekrana əlavə et" seç', installed:'Yükləndi!' },
  en: { install:'Install App', desc:'Use offline, fast access', close:'Close', iosTitle:'To install on iOS:', iosStep1:'Tap the share button below ⬆️', iosStep2:'Select "Add to Home Screen"', installed:'Installed!' },
  ru: { install:'Установить', desc:'Работать офлайн, быстрый доступ', close:'Закрыть', iosTitle:'Для установки на iOS:', iosStep1:'Нажмите кнопку "Поделиться" ⬆️', iosStep2:'Выберите "На экран Домой"', installed:'Установлено!' },
  ar: { install:'تثبيت التطبيق', desc:'استخدم بدون إنترنت، وصول سريع', close:'إغلاق', iosTitle:'للتثبيت على iOS:', iosStep1:'اضغط زر المشاركة أدناه ⬆️', iosStep2:'اختر "إضافة إلى الشاشة الرئيسية"', installed:'تم التثبيت!' },
  tr: { install:'Uygulamayı Yükle', desc:'Çevrimdışı kullan, hızlı erişim', close:'Kapat', iosTitle:'iOS\'ta yüklemek için:', iosStep1:'Aşağıdaki paylaş düğmesine dokunun ⬆️', iosStep2:'"Ana Ekrana Ekle" seçin', installed:'Yüklendi!' },
}

const DISMISS_KEY = 'install_dismissed'   // mövcud açar — dəyişmir
const DISMISS_DAYS = 3
const SHOW_AFTER_MS = 20000               // ~20 s görünən vaxtdan sonra
const AUTO_HIDE_MS = 30000                // toxunulmasa 30 s sonra sakitcə gizlənir
const INSTALLABLE_EVENT = 'qm-installable'

// ── Prompt-u modul səviyyəsində tut ─────────────────
// Hadisə tez-tez React mount olmamışdan ƏVVƏL gəlir; burada tutulmasa itir.
let savedPrompt = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    savedPrompt = e
    window.dispatchEvent(new Event(INSTALLABLE_EVENT))
  })
  window.addEventListener('appinstalled', () => {
    savedPrompt = null
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* yaddaş bağlıdır */ }
    window.dispatchEvent(new Event(INSTALLABLE_EVENT))
  })
}

function isStandaloneNow() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIOSSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/.test(ua)
  return iosDevice && safari
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 86400000
  } catch {
    return false
  }
}

export default function InstallBanner() {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.en

  const [standalone] = useState(isStandaloneNow)
  const [isIOS] = useState(isIOSSafari)
  const [installable, setInstallable] = useState(() => Boolean(savedPrompt))
  const [dismissed, setDismissed] = useState(recentlyDismissed)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [installing, setInstalling] = useState(false)
  const barRef = useRef(null)

  // Modul səviyyəsində tutulan hadisəni izlə
  useEffect(() => {
    const sync = () => setInstallable(Boolean(savedPrompt))
    window.addEventListener(INSTALLABLE_EVENT, sync)
    sync()
    return () => window.removeEventListener(INSTALLABLE_EVENT, sync)
  }, [])

  const enabled = !standalone && !dismissed && (installable || isIOS) && !wasShownThisSession('install')

  const [shown, hide] = usePromptSlot('install', () => engagedMs() >= SHOW_AFTER_MS, { ask: true, enabled })

  useBottomInset(barRef, shown)
  const pauseProps = useAutoHide(shown && !installing && !showIOSGuide, AUTO_HIDE_MS, hide)

  // Quraşdırıldısa (və ya prompt itdisə) zolağı bağla
  useEffect(() => {
    if (shown && !installable && !isIOS) hide()
  }, [shown, installable, isIOS, hide])

  const handleDismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* yaddaş bağlıdır */ }
    setDismissed(true)
    setShowIOSGuide(false)
    hide()
  }, [hide])

  // Birbaşa yüklə — prompt.prompt() çağır (hər hadisə yalnız bir dəfə istifadə olunur)
  const handleInstall = async () => {
    const promptEvent = savedPrompt
    if (!promptEvent) return
    setInstalling(true)
    try {
      promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      savedPrompt = null
      setInstallable(false)
      if (outcome === 'accepted') hide()
      else handleDismiss()
    } catch {
      hide()
    } finally {
      setInstalling(false)
    }
  }

  if (standalone || (!shown && !showIOSGuide)) return null

  return (
    <>
      {shown && (
        <div
          ref={barRef}
          className="qm-install"
          role="region"
          aria-label={t.install}
          {...pauseProps}
        >
          <div className="qm-install-inner">
            <span className="qm-install-icon" aria-hidden="true">☽</span>
            <div className="qm-install-text">
              <strong>{brandName(lang)}</strong>
              <span>{t.desc}</span>
            </div>
            {isIOS ? (
              <button type="button" className="qm-install-btn" onClick={() => setShowIOSGuide(true)}>
                {t.install}
              </button>
            ) : (
              <button type="button" className="qm-install-btn" onClick={handleInstall} disabled={installing}>
                {installing ? '…' : t.install}
              </button>
            )}
            <button
              type="button"
              className="qm-install-close"
              onClick={handleDismiss}
              aria-label={t.close}
              title={t.close}
            >✕</button>
          </div>
        </div>
      )}

      {/* iOS təlimat pəncərəsi — yalnız istifadəçi "Yüklə" basanda */}
      {showIOSGuide && (
        <div className="ios-guide-overlay" onClick={() => setShowIOSGuide(false)}>
          <div className="ios-guide" role="dialog" aria-label={t.iosTitle} onClick={(e) => e.stopPropagation()}>
            <button className="ios-guide-close" onClick={() => setShowIOSGuide(false)} aria-label={t.close}>✕</button>
            <div className="ios-guide-icon">☽</div>
            <h3>{t.iosTitle}</h3>
            <div className="ios-guide-steps">
              <div className="ios-step">
                <span className="ios-step-num">1</span>
                <span>{t.iosStep1}</span>
              </div>
              <div className="ios-step">
                <span className="ios-step-num">2</span>
                <span>{t.iosStep2}</span>
              </div>
            </div>
            <div className="ios-guide-arrow">⬇</div>
          </div>
        </div>
      )}
    </>
  )
}
