import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import Icon from './Icon'
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getStoredToken,
  refreshPushToken,
} from '../firebase/messaging'
import { playAzan, stopAzan, onAzanChange, azanKeyFromTag } from '../utils/azanAudio'
import {
  usePromptSlot,
  useBottomInset,
  useAutoHide,
  engagedMs,
  visitCount,
  hasNavigated,
  wasShownThisSession,
  snoozePrompt,
  isSnoozed,
  exitDelay,
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
//   • 2-ci mərhələ: "Sonra" və ✕ → 7 gün, özü gizləndi → 3 gün göstərilmir
//     (əvvəl özü gizlənəndə heç nə yadda qalmırdı — hər sessiyada yenə çıxırdı);
//     bağlananda yumşaq çıxış animasiyası; görünüş ümumi .ui-toast (ui.css §11).
// ═══════════════════════════════════════════════════════

const LABELS = {
  az: { title:'Bildirişləri aktivləşdir', desc:'Namaz vaxtları, günün ayəsi və elanlar üçün xəbərdarlıqlar alın.', enable:'Aktivləşdir', later:'Sonra', close:'Bağla', stopAzan:'Əzanı dayandır' },
  en: { title:'Enable notifications', desc:'Get alerts for prayer times, verse of the day and announcements.', enable:'Enable', later:'Later', close:'Close', stopAzan:'Stop the adhan' },
  ru: { title:'Включить уведомления', desc:'Получайте оповещения о времени намаза, аяте дня и объявлениях.', enable:'Включить', later:'Позже', close:'Закрыть', stopAzan:'Остановить азан' },
  ar: { title:'تفعيل الإشعارات', desc:'احصل على تنبيهات لأوقات الصلاة وآية اليوم والإعلانات.', enable:'تفعيل', later:'لاحقاً', close:'إغلاق', stopAzan:'إيقاف الأذان' },
  tr: { title:'Bildirimleri etkinleştir', desc:'Namaz vakitleri, günün ayeti ve duyurular için bildirim alın.', enable:'Etkinleştir', later:'Sonra', close:'Kapat', stopAzan:'Ezanı durdur' },
}

const DISMISS_KEY = 'muslim_cc_push_prompt_dismissed' // mövcud açar: indi "bu vaxta qədər" (köhnə qeyd = bağlanma anı)
const SNOOZE_DAYS = { later: 7, auto: 3 }
const LEGACY_DAYS = 1             // köhnə qeydlər (bağlanma anı) 24 saat sayılırdı
const LEAVE_MS = 220
const FIRST_VISIT_MS = 30000      // ilk gəliş: ~30 s görünən vaxt (+ başqa səhifəyə keçid)
const RETURN_VISIT_MS = 10000     // təkrar gəliş: ~10 s
const AUTO_HIDE_MS = 30000        // toxunulmasa sakitcə gizlənir (sessiyada yenidən çıxmır)
const TOAST_MS = 6000

// VAPID açarı yoxdursa icazə istəmək mənasızdır — düymə heç nə etməzdi
const HAS_VAPID = Boolean(import.meta.env.VITE_FCM_VAPID_KEY)

function dismissedRecently() {
  return isSnoozed(DISMISS_KEY, LEGACY_DAYS)
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
  const [leaving, setLeaving] = useState(false)
  const [toast, setToast] = useState(null) // { title, body }
  const leaveTimerRef = useRef(null)
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

  /** Yumşaq çıxış + qərarı yadda saxla (days = null → yalnız bu sessiya) */
  const close = useCallback((days) => {
    if (days) snoozePrompt(DISMISS_KEY, days)
    setCanAsk(false)
    setLeaving(true)
    clearTimeout(leaveTimerRef.current)
    leaveTimerRef.current = setTimeout(() => {
      setLeaving(false)
      hide()
    }, exitDelay(LEAVE_MS))
  }, [hide])
  useEffect(() => () => clearTimeout(leaveTimerRef.current), [])

  useBottomInset(barRef, shown)
  const autoHide = useCallback(() => close(SNOOZE_DAYS.auto), [close])
  const pauseProps = useAutoHide(shown && !busy && !leaving, AUTO_HIDE_MS, autoHide)

  // Cari dili ref-də saxla — foreground callback bir dəfə qeydiyyatdan keçir,
  // dil dəyişəndə yenidən abunə olmadan aktual brend adını göstərsin
  const langRef = useRef(lang)
  useEffect(() => { langRef.current = lang }, [lang])

  // Əzan oxunurmu — toast "Əzanı dayandır" düyməsini göstərsin və
  // oxunduğu müddətdə özü gizlənməsin
  const [azanPlaying, setAzanPlaying] = useState(false)
  useEffect(() => onAzanChange(setAzanPlaying), [])

  // Ön planda gələn push (service worker → {type:'PUSH'}): bildiriş sistemdə
  // onsuz da göstərilib; burada saytın içində toast + əzan bildirişidirsə əzan səsi.
  // Brauzer push abunəliyini dəyişəndə (PUSH_RESUBSCRIBE) token təzələnir.
  useEffect(() => {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null
    if (!sw) return undefined
    const onMsg = (e) => {
      const m = e.data || {}
      if (m.type === 'PUSH_RESUBSCRIBE') { refreshPushToken(); return }
      if (m.type !== 'PUSH') return
      setToast({ title: m.title || brandName(langRef.current), body: m.body || '' })
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS)
      const key = azanKeyFromTag(m.tag)
      if (key) playAzan(key)
    }
    sw.addEventListener('message', onMsg)
    return () => {
      sw.removeEventListener('message', onMsg)
      clearTimeout(toastTimerRef.current)
    }
  }, [])

  // Əzan bildirişinə klikdən açılıb (?azan=1): əzanı oxut, parametri ünvandan sil
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('azan') !== '1') return
      url.searchParams.delete('azan')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
      playAzan('click', { force: true })
    } catch { /* köhnə brauzer */ }
  }, [])

  // Hər açılışda push tokenini təzələ (icazə varsa) — köhnəlmiş token
  // bildirişlərin səssizcə kəsilməsinin əsas səbəblərindən biri idi
  useEffect(() => { refreshPushToken() }, [])

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
    close(null)
  }

  const handleLater = useCallback(() => close(SNOOZE_DAYS.later), [close])

  return (
    <>
      {/* İcazə təklifi — üzən kart (.ui-toast), məzmunu örtmür */}
      {shown && (
        <div
          ref={barRef}
          className={`qm-notif-prompt ui-toast${leaving ? ' is-leaving' : ''}`}
          role="region"
          aria-label={l.title}
          {...pauseProps}
        >
          <span className="ui-toast__icon qm-notif-prompt-icon" aria-hidden="true"><Icon name="bell" /></span>
          <div className="ui-toast__body">
            <strong className="ui-toast__title">{l.title}</strong>
            <span className="ui-toast__text">{l.desc}</span>
          </div>
          <div className="ui-toast__actions">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={handleLater}>
              {l.later}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--sm"
              onClick={handleEnable}
              disabled={busy}
              aria-busy={busy || undefined}
            >
              {busy ? <span className="ui-spin" aria-hidden="true" /> : <Icon name="check" size={17} className="ui-btn__icon" />}
              {l.enable}
            </button>
          </div>
          <button
            type="button"
            className="ui-toast__close"
            onClick={handleLater}
            aria-label={l.close}
            title={l.close}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* Ön planda gələn push bildirişi — başlığın altında */}
      {(toast || azanPlaying) && (
        <div className="qm-push-toast ui-toast ui-toast--top" role="status" aria-live="polite" style={{ '--toast-duration': `${TOAST_MS}ms` }}>
          <span className="ui-toast__icon" aria-hidden="true"><Icon name="bell" /></span>
          <div className="ui-toast__body">
            <strong className="ui-toast__title">{toast?.title || '🕌'}</strong>
            {toast?.body && <span className="ui-toast__text">{toast.body}</span>}
          </div>
          {azanPlaying && (
            <div className="ui-toast__actions">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={stopAzan}>{l.stopAzan}</button>
            </div>
          )}
          <button
            type="button"
            className="ui-toast__close"
            onClick={() => { stopAzan(); setToast(null) }}
            aria-label={l.close}
          >
            <Icon name="close" size={18} />
          </button>
          {!azanPlaying && <span className="ui-toast__progress" aria-hidden="true" />}
        </div>
      )}
    </>
  )
}
