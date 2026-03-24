import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'

const LABELS = {
  az: { install:'Tətbiqi yüklə', desc:'Offline istifadə et, sürətli giriş', iosTitle:'iOS-da yükləmək üçün:', iosStep1:'Aşağıdakı paylaş düyməsinə bas ⬆️', iosStep2:'"Ana ekrana əlavə et" seç', installed:'Yükləndi!' },
  en: { install:'Install App', desc:'Use offline, fast access', iosTitle:'To install on iOS:', iosStep1:'Tap the share button below ⬆️', iosStep2:'Select "Add to Home Screen"', installed:'Installed!' },
  ru: { install:'Установить', desc:'Работать офлайн, быстрый доступ', iosTitle:'Для установки на iOS:', iosStep1:'Нажмите кнопку "Поделиться" ⬆️', iosStep2:'Выберите "На экран Домой"', installed:'Установлено!' },
  ar: { install:'تثبيت التطبيق', desc:'استخدم بدون إنترنت، وصول سريع', iosTitle:'للتثبيت على iOS:', iosStep1:'اضغط زر المشاركة أدناه ⬆️', iosStep2:'اختر "إضافة إلى الشاشة الرئيسية"', installed:'تم التثبيت!' },
  tr: { install:'Uygulamayı Yükle', desc:'Çevrimdışı kullan, hızlı erişim', iosTitle:'iOS\'ta yüklemek için:', iosStep1:'Aşağıdaki paylaş düğmesine dokunun ⬆️', iosStep2:'"Ana Ekrana Ekle" seçin', installed:'Yüklendi!' },
}

// Prompt-u global saxla — component remount olsa belə itməsin
let savedPrompt = null

export default function InstallBanner() {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.en
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [installing, setInstalling] = useState(false)

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )

  useEffect(() => {
    if (isStandalone) return

    // Dismiss yoxla — yalnız 3 gün gözlə
    const dismissed = localStorage.getItem('install_dismissed')
    if (dismissed && (Date.now() - parseInt(dismissed)) < 3 * 86400000) return

    // Android/Desktop
    const handler = (e) => {
      e.preventDefault()
      savedPrompt = e
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Əgər artıq prompt gəlibsə (səhifə yüklənəndə)
    if (savedPrompt) setShowBanner(true)

    // iOS Safari
    const ua = navigator.userAgent
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/.test(ua)
    if (iosDevice && safari) {
      setIsIOS(true)
      setTimeout(() => setShowBanner(true), 2000)
    }

    // appinstalled event — yükləndi
    const onInstalled = () => {
      setShowBanner(false)
      savedPrompt = null
      localStorage.setItem('install_dismissed', String(Date.now()))
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [isStandalone])

  // Birbaşa yüklə — prompt.prompt() çağır
  const handleInstall = async () => {
    if (!savedPrompt) return
    setInstalling(true)
    savedPrompt.prompt()
    const { outcome } = await savedPrompt.userChoice
    setInstalling(false)
    if (outcome === 'accepted') {
      setShowBanner(false)
      savedPrompt = null
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('install_dismissed', String(Date.now()))
  }

  if (!showBanner || isStandalone) return null

  return (
    <>
      <div className="install-banner">
        <div className="install-banner-inner">
          <div className="install-banner-icon">☽</div>
          <div className="install-banner-text">
            <strong>Muslims.cc</strong>
            <span>{t.desc}</span>
          </div>
          <div className="install-banner-actions">
            {isIOS ? (
              <button className="install-banner-btn" onClick={() => setShowIOSGuide(true)}>
                {t.install}
              </button>
            ) : (
              <button className="install-banner-btn" onClick={handleInstall} disabled={installing}>
                {installing ? '...' : t.install}
              </button>
            )}
            <button className="install-banner-close" onClick={handleDismiss}>✕</button>
          </div>
        </div>
      </div>

      {/* iOS təlimat overlay */}
      {showIOSGuide && (
        <div className="ios-guide-overlay" onClick={() => setShowIOSGuide(false)}>
          <div className="ios-guide" onClick={(e) => e.stopPropagation()}>
            <button className="ios-guide-close" onClick={() => setShowIOSGuide(false)}>✕</button>
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
