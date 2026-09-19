import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/mosque'
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getStoredToken,
  onForegroundMessage,
} from '../firebase/messaging'
import {
  usePromptSlot,
  useBottomInset,
  useAutoHide,
  engagedMs,
  visitCount,
  hasNavigated,
  wasShownThisSession,
} from '../utils/promptCoordinator'
import '../styles/NotificationPrompt.css'

// ═══════════════════════════════════════════════════════
// Bildiriş icazəsi üçün yumşaq təklif + ön planda gələn push toast-u
//
// Sahibinin rəyi ilə sakitləşdirildi:
//   • ilk açılışda brauzerin öz icazə pəncərəsi ARTIQ avtomatik açılmır —
//     yalnız ziyarətçi "Aktivləşdir" basanda soruşulur (istifadəçi jesti);
//   • ilk gəlişdə: başqa səhifəyə keçdikdən VƏ ~30 s görünən vaxtdan sonra;
//     təkrar gəlişdə: ~10 s sonra;
//   • quraşdırma zolağı və elan toast-u ilə eyni anda çıxmır
//     (promptCoordinator); sessiyada ən çox bir dəfə.
// ═══════════════════════════════════════════════════════

const LABELS = {
  az: { title:'Bildirişləri aktivləşdir', desc:'Namaz vaxtları, günün ayəsi və elanlar üçün xəbərdarlıqlar alın.', enable:'Aktivləşdir', later:'Sonra', close:'Bağla' },
  en: { title:'Enable notifications', desc:'Get alerts for prayer times, verse of the day and announcements.', enable:'Enable', later:'Later', close:'Close' },
  ru: { title:'Включить уведомления', desc:'Получайте оповещения о времени намаза, аяте дня и объявлениях.', enable:'Включить', later:'Позже', close:'Закрыть' },
  ar: { title:'تفعيل الإشعارات', desc:'احصل على تنبيهات لأوقات الصلاة وآية اليوم والإعلانات.', enable:'تفعيل', later:'لاحقاً', close:'إغلاق' },
  tr: { title:'Bildirimleri etkinleştir', desc:'Namaz vakitleri, günün ayeti ve duyurular için bildirim alın.', enable:'Etkinleştir', later:'Sonra', close:'Kapat' },
}

const DISMISS_KEY = 'muslim_cc_push_prompt_dismissed' // mövcud açar — dəyişmir
const DISMISS_HOURS = 24          // "Sonra"dan sonra 24 saat görünmür
const FIRST_VISIT_MS = 30000      // ilk gəliş: ~30 s görünən vaxt (+ başqa səhifəyə keçid)
const RETURN_VISIT_MS = 10000     // təkrar gəliş: ~10 s
const AUTO_HIDE_MS = 30000        // toxunulmasa sakitcə gizlənir (sessiyada yenidən çıxmır)
const TOAST_MS = 6000

// VAPID açarı yoxdursa icazə istəmək mənasızdır — düymə heç nə etməzdi
const HAS_VAPID = Boolean(import.meta.env.VITE_FCM_VAPID_KEY)

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return Boolean(at) && Date.now() - at < DISMISS_HOURS * 3600 * 1000
  } catch {
    return false
  }
}

function isEligible() {
  // İcazə bu arada başqa yerdən (bildiriş ayarları paneli) verilibsə soruşma
  if (getPermissionStatus() !== 'default') return false
  if (visitCount() >= 2) return engagedMs() >= RETURN_VISIT_MS
  return engagedMs() >= FIRST_VISIT_MS && hasNavigated()
}

export default function NotificationPrompt() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [canAsk, setCanAsk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null) // { title, body }
  const barRef = useRef(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const supported = await isPushSupported()
      if (!alive || !supported) return
      const status = getPermissionStatus()

      if (status === 'granted') {
        // Artıq icazəlidir — sakitcə FCM token-i yenilə
        if (!getStoredToken()) requestNotificationPermission().catch(() => {})
        return
      }
      if (status !== 'default') return // rədd edilib — bezdirməyək
      if (!HAS_VAPID || dismissedRecently()) return
      setCanAsk(true)
    })()
    return () => { alive = false }
  }, [])

  const enabled = canAsk && !wasShownThisSession('notif')
  const [shown, hide] = usePromptSlot('notif', isEligible, { ask: true, enabled })

  useBottomInset(barRef, shown)
  const pauseProps = useAutoHide(shown && !busy, AUTO_HIDE_MS, hide)

  // Cari dili ref-də saxla — foreground callback bir dəfə qeydiyyatdan keçir,
  // dil dəyişəndə yenidən abunə olmadan aktual brend adını göstərsin
  const langRef = useRef(lang)
  useEffect(() => { langRef.current = lang }, [lang])

  // Ön planda gələn push mesajı — qısa toast
  useEffect(() => {
    let alive = true
    let unsubscribe = null
    onForegroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || brandName(langRef.current)
      const body = payload.notification?.body || payload.data?.body || ''
      setToast({ title, body })
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS)
    })
      .then((u) => {
        if (alive) unsubscribe = u
        else u?.()
      })
      .catch(() => {})
    return () => {
      alive = false
      unsubscribe?.()
      clearTimeout(toastTimerRef.current)
    }
  }, [])

  const handleEnable = async () => {
    setBusy(true)
    try {
      const result = await requestNotificationPermission()
      if (!result?.ok && result?.reason !== 'denied') {
        console.warn('Notification setup failed:', result)
      }
    } catch (e) {
      console.warn('Notification setup failed:', e?.message || e)
    }
    setBusy(false)
    setCanAsk(false)
    hide()
  }

  const handleLater = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* yaddaş bağlıdır */ }
    setCanAsk(false)
    hide()
  }, [hide])

  return (
    <>
      {/* İcazə təklifi — aşağıda yığcam zolaq, məzmunu örtmür */}
      {shown && (
        <div
          ref={barRef}
          className="qm-notif-prompt"
          role="region"
          aria-label={l.title}
          {...pauseProps}
        >
          <div className="qm-notif-prompt-inner">
            <span className="qm-notif-prompt-icon" aria-hidden="true">🔔</span>
            <div className="qm-notif-prompt-text">
              <strong>{l.title}</strong>
              <span>{l.desc}</span>
            </div>
            <div className="qm-notif-prompt-actions">
              <button
                type="button"
                className="qm-notif-prompt-btn"
                onClick={handleEnable}
                disabled={busy}
              >
                {busy ? '…' : l.enable}
              </button>
              <button type="button" className="qm-notif-prompt-later" onClick={handleLater}>
                {l.later}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ön planda gələn push bildirişi */}
      {toast && (
        <div className="qm-push-toast" role="status" aria-live="polite">
          <span className="qm-push-toast-icon" aria-hidden="true">🔔</span>
          <div className="qm-push-toast-text">
            <strong>{toast.title}</strong>
            {toast.body && <span>{toast.body}</span>}
          </div>
          <button
            type="button"
            className="qm-push-toast-close"
            onClick={() => setToast(null)}
            aria-label={l.close}
          >✕</button>
        </div>
      )}
    </>
  )
}
