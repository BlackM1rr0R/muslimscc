import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import Icon, { BrandMark } from './Icon'
import {
  usePromptSlot,
  useBottomInset,
  useAutoHide,
  engagedMs,
  hasNavigated,
  wasShownThisSession,
  snoozePrompt,
  isSnoozed,
  exitDelay,
} from '../utils/promptCoordinator'
import '../styles/InstallBanner.css'

// ═══════════════════════════════════════════════════════
// PWA quraşdırma dəvəti ("Ana ekrana əlavə et")
//
// Sahibinin şikayəti: "çıxır və YOX OLMUR, qalır". Səbəblər (hamısı düzəldi):
//   1. iOS-da "Tətbiqi yüklə" → bələdçi açılırdı; bələdçini bağlayanda zolaq
//      yerində QALIRDI, sonra 3 gündən bir yenidən çıxırdı (Safari ana ekrana
//      əlavə olunduğunu bilmir). İndi bələdçi bağlananda dəvət də bağlanır və
//      60 gün göstərilmir.
//   2. Avtomatik gizlətmə taymeri telefonda karta toxunan kimi əbədi
//      dayanırdı ("mouseenter" emulyasiyası) — kart ilişib qalırdı
//      (promptCoordinator → useAutoHide indi yalnız siçana baxır).
//   3. Özü gizlənəndə heç nə yadda qalmırdı — hər yeni sessiyada yenə çıxırdı.
//
// Qaydalar indi:
//   • ✕ → 14 gün; özü gizləndi → 7 gün; brauzer pəncərəsində "Ləğv et" → 30 gün;
//     iOS bələdçisi göstərildi → 60 gün; quraşdırıldı (appinstalled / "accepted" /
//     standalone) → HEÇ VAXT. Yaddaş: localStorage (try/catch), sessiyada ən çox bir dəfə.
//   • İlk gəlişdə dərhal yox: ~30 s görünən vaxt VƏ YA başqa səhifəyə keçid + ~8 s.
//   • Eyni anda yalnız BİR dəvət (promptCoordinator): bildiriş icazəsi, elan,
//     açıq panel / dok menyusu ilə üst-üstə düşmür.
//   • Üzən kart ekranın altından 16px + iPhone boşluğu (safe-area) yuxarıdadır;
//     görünəndə footer aşağıdan yer saxlayır (--bottom-inset).
// ═══════════════════════════════════════════════════════

const LABELS = {
  az: { title:'Tətbiq kimi quraşdır', desc:'Ana ekrandan bir toxunuşla açılır, internetsiz də işləyir.', install:'Quraşdır', close:'Bağla', iosTitle:'Telefonun ana ekranına əlavə et', iosStep1:'Safari-nin aşağı panelindəki "Paylaş" düyməsinə toxun', iosStep2:'Siyahıda "Ana ekrana əlavə et" bəndini seç', iosStep3:'Yuxarıda "Əlavə et" düyməsinə toxun', iosDone:'Başa düşdüm' },
  en: { title:'Install as an app', desc:'Opens from your home screen in one tap and works offline.', install:'Install', close:'Close', iosTitle:'Add to your iPhone home screen', iosStep1:'Tap the "Share" button in the Safari bottom bar', iosStep2:'Choose "Add to Home Screen" in the list', iosStep3:'Tap "Add" at the top', iosDone:'Got it' },
  ru: { title:'Установить как приложение', desc:'Открывается с главного экрана одним касанием и работает без интернета.', install:'Установить', close:'Закрыть', iosTitle:'Добавить на экран «Домой»', iosStep1:'Нажмите кнопку «Поделиться» на нижней панели браузера', iosStep2:'Выберите «На экран „Домой“» в списке', iosStep3:'Нажмите «Добавить» вверху', iosDone:'Понятно' },
  ar: { title:'ثبّت الموقع كتطبيق', desc:'يُفتح من الشاشة الرئيسية بلمسة واحدة ويعمل دون إنترنت.', install:'تثبيت', close:'إغلاق', iosTitle:'أضِف الموقع إلى الشاشة الرئيسية', iosStep1:'اضغط زر «مشاركة» في الشريط السفلي للمتصفح', iosStep2:'اختر «إضافة إلى الشاشة الرئيسية» من القائمة', iosStep3:'اضغط «إضافة» في الأعلى', iosDone:'فهمت' },
  tr: { title:'Uygulama olarak yükle', desc:'Ana ekrandan tek dokunuşla açılır, internetsiz de çalışır.', install:'Yükle', close:'Kapat', iosTitle:'iPhone ana ekranına ekle', iosStep1:'Safari alt çubuğundaki "Paylaş" düğmesine dokunun', iosStep2:'Listeden "Ana Ekrana Ekle" seçeneğini seçin', iosStep3:'Üstteki "Ekle" düğmesine dokunun', iosDone:'Anladım' },
}

const DISMISS_KEY = 'install_dismissed'              // mövcud açar: indi "bu vaxta qədər" (köhnə qeyd = bağlanma anı)
const INSTALLED_KEY = 'muslim_cc_pwa_installed'      // '1' — quraşdırılıb, bir daha təklif etmə
const SNOOZE_DAYS = { close: 14, auto: 7, cancel: 30, guide: 60 }
const LEGACY_DAYS = 3                                 // köhnə qeydlər (bağlanma anı) 3 gün sayılırdı
const SHOW_AFTER_MS = 30000                           // ~30 s görünən vaxt …
const SHOW_AFTER_NAV_MS = 8000                        // … və ya başqa səhifəyə keçid + ~8 s
const AUTO_HIDE_MS = 25000                            // toxunulmasa sakitcə gizlənir
const LEAVE_MS = 220
const INSTALLABLE_EVENT = 'qm-installable'

function markInstalled() {
  try { localStorage.setItem(INSTALLED_KEY, '1') } catch { /* yaddaş bağlıdır */ }
}

function isInstalled() {
  try { return localStorage.getItem(INSTALLED_KEY) === '1' } catch { return false }
}

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
    markInstalled()
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

/** Dəvət bu cihazda hələ göstərilə bilərmi? (quraşdırılmayıb, "yatmır") */
function blocked() {
  if (isStandaloneNow()) { markInstalled(); return true }
  return isInstalled() || isSnoozed(DISMISS_KEY, LEGACY_DAYS)
}

/** Ziyarətçi bir az gəzibmi? */
function engagedEnough() {
  const ms = engagedMs()
  return ms >= SHOW_AFTER_MS || (ms >= SHOW_AFTER_NAV_MS && hasNavigated())
}

export default function InstallBanner() {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.en

  const [standalone, setStandalone] = useState(isStandaloneNow)
  const [isIOS] = useState(isIOSSafari)
  const [installable, setInstallable] = useState(() => Boolean(savedPrompt))
  const [dismissed, setDismissed] = useState(blocked)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const barRef = useRef(null)
  const guideCloseRef = useRef(null)
  const leaveTimerRef = useRef(null)

  // Modul səviyyəsində tutulan hadisəni izlə; quraşdırılanda dərhal "bloklan"
  useEffect(() => {
    const sync = () => {
      setInstallable(Boolean(savedPrompt))
      if (isInstalled()) setDismissed(true)
    }
    window.addEventListener(INSTALLABLE_EVENT, sync)
    sync()
    // Tətbiq pəncərəsinə keçid (display-mode dəyişir) — bir daha göstərmə
    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onMode = () => { if (mq.matches) { markInstalled(); setStandalone(true) } }
    mq?.addEventListener?.('change', onMode)
    return () => {
      window.removeEventListener(INSTALLABLE_EVENT, sync)
      mq?.removeEventListener?.('change', onMode)
    }
  }, [])

  useEffect(() => () => clearTimeout(leaveTimerRef.current), [])

  const enabled = !standalone && !dismissed && (installable || isIOS) && !wasShownThisSession('install')

  const [shown, hide] = usePromptSlot('install', engagedEnough, { ask: true, enabled })

  /** Kartı yumşaq çıxışla bağla və qərarı yadda saxla (days = null → yalnız bu sessiya) */
  const close = useCallback((days) => {
    if (days === 'installed') markInstalled()
    else if (days) snoozePrompt(DISMISS_KEY, days)
    setDismissed(true)
    setShowIOSGuide(false)
    setLeaving(true)
    clearTimeout(leaveTimerRef.current)
    leaveTimerRef.current = setTimeout(() => {
      setLeaving(false)
      hide()
    }, exitDelay(LEAVE_MS))
  }, [hide])

  useBottomInset(barRef, shown)
  const autoHide = useCallback(() => close(SNOOZE_DAYS.auto), [close])
  const pauseProps = useAutoHide(shown && !leaving && !installing && !showIOSGuide, AUTO_HIDE_MS, autoHide)

  // Quraşdırıldısa (və ya prompt itdisə) kartı bağla
  useEffect(() => {
    if (shown && !leaving && !installable && !isIOS) close(isInstalled() ? 'installed' : null)
  }, [shown, leaving, installable, isIOS, close])

  // iOS bələdçisi: Esc bağlayır, fokus "Bağla" düyməsinə
  useEffect(() => {
    if (!showIOSGuide) return undefined
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(SNOOZE_DAYS.guide) } }
    document.addEventListener('keydown', onKey)
    const f = setTimeout(() => guideCloseRef.current?.focus({ preventScroll: true }), 30)
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(f) }
  }, [showIOSGuide, close])

  // Birbaşa quraşdır — prompt.prompt() (hər hadisə yalnız bir dəfə istifadə olunur)
  const handleInstall = async () => {
    const promptEvent = savedPrompt
    if (!promptEvent) return
    setInstalling(true)
    try {
      promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      savedPrompt = null
      setInstallable(false)
      close(outcome === 'accepted' ? 'installed' : SNOOZE_DAYS.cancel)
    } catch {
      close(SNOOZE_DAYS.cancel)
    } finally {
      setInstalling(false)
    }
  }

  if (standalone || (!shown && !showIOSGuide)) return null

  return (
    <>
      {shown && !showIOSGuide && (
        <div
          ref={barRef}
          className={`qm-install ui-toast${leaving ? ' is-leaving' : ''}`}
          role="region"
          aria-label={t.title}
          {...pauseProps}
        >
          <span className="ui-toast__mark" aria-hidden="true"><BrandMark size={40} /></span>
          <div className="ui-toast__body">
            <strong className="ui-toast__title">{t.title}</strong>
            <span className="ui-toast__text">{t.desc}</span>
          </div>
          <div className="ui-toast__actions">
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--sm qm-install-btn"
              onClick={isIOS ? () => setShowIOSGuide(true) : handleInstall}
              disabled={installing}
              aria-busy={installing || undefined}
            >
              <Icon name="download" size={17} className="ui-btn__icon" />
              {t.install}
            </button>
          </div>
          <button
            type="button"
            className="ui-toast__close qm-install-close"
            onClick={() => close(SNOOZE_DAYS.close)}
            aria-label={t.close}
            title={t.close}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* iOS bələdçisi — yalnız istifadəçi "Quraşdır" basanda. Bağlananda
          dəvət də bağlanır (əvvəl zolaq arxada qalırdı) */}
      {showIOSGuide && (
        <div className="ios-guide-overlay qm-ios-guide" onClick={() => close(SNOOZE_DAYS.guide)}>
          <div
            className="ios-guide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qm-ios-guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={guideCloseRef}
              type="button"
              className="ui-toast__close ios-guide-close"
              onClick={() => close(SNOOZE_DAYS.guide)}
              aria-label={t.close}
            >
              <Icon name="close" size={18} />
            </button>
            <span className="ios-guide-icon" aria-hidden="true"><BrandMark size={56} /></span>
            <h3 id="qm-ios-guide-title" className="ios-guide-title">{t.iosTitle}</h3>
            <p className="ios-guide-brand">{brandName(lang)}</p>
            <ol className="ios-guide-steps">
              <li className="ios-step">
                <span className="ios-step-num">1</span>
                <span className="ios-step-text">{t.iosStep1}</span>
                <span className="ios-step-icon" aria-hidden="true"><Icon name="share" size={20} /></span>
              </li>
              <li className="ios-step">
                <span className="ios-step-num">2</span>
                <span className="ios-step-text">{t.iosStep2}</span>
                <span className="ios-step-icon" aria-hidden="true"><Icon name="addSquare" size={20} /></span>
              </li>
              <li className="ios-step">
                <span className="ios-step-num">3</span>
                <span className="ios-step-text">{t.iosStep3}</span>
              </li>
            </ol>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={() => close(SNOOZE_DAYS.guide)}>
              {t.iosDone}
            </button>
            <span className="ios-guide-arrow" aria-hidden="true"><Icon name="arrowDown" size={22} /></span>
          </div>
        </div>
      )}
    </>
  )
}
