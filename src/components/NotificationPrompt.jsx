import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getStoredToken,
  onForegroundMessage,
} from '../firebase/messaging'

const LABELS = {
  az: { title:'Bildirişləri aktivləşdir', desc:'Namaz vaxtları, günün ayəsi və elanlar üçün xəbərdarlıqlar alın.', enable:'Aktivləşdir', later:'Sonra', dismiss:'✕' },
  en: { title:'Enable notifications', desc:'Get alerts for prayer times, verse of the day and announcements.', enable:'Enable', later:'Later', dismiss:'✕' },
  ru: { title:'Включить уведомления', desc:'Получайте оповещения о времени намаза, аяте дня и объявлениях.', enable:'Включить', later:'Позже', dismiss:'✕' },
  ar: { title:'تفعيل الإشعارات', desc:'احصل على تنبيهات لأوقات الصلاة وآية اليوم والإعلانات.', enable:'تفعيل', later:'لاحقاً', dismiss:'✕' },
  tr: { title:'Bildirimleri etkinleştir', desc:'Namaz vakitleri, günün ayeti ve duyurular için bildirim alın.', enable:'Etkinleştir', later:'Sonra', dismiss:'✕' },
}

const DISMISS_KEY = 'muslim_cc_push_prompt_dismissed'
const DISMISS_HOURS = 24 // gizlədiləndən sonra 24 saat görünmür

export default function NotificationPrompt() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null) // { title, body }

  useEffect(() => {
    let alive = true
    ;(async () => {
      // Artıq icazə verilibsə token-i yenilə amma banner göstərmə
      const supported = await isPushSupported()
      if (!supported) return
      const status = getPermissionStatus()

      if (status === 'granted') {
        // Token yoxdursa, sakitcə yenilə
        if (!getStoredToken()) {
          requestNotificationPermission().catch(() => {})
        }
        return
      }
      if (status === 'denied') return // istifadəçi rədd edib — bezdirməyək

      // Banner-i daha əvvəl bağlayıbsa, vaxt bitməyibsə göstərmə
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_HOURS * 3600 * 1000) return

      // 5 saniyə gözlə (istifadəçi səhifə ilə tanış olsun)
      const t = setTimeout(() => { if (alive) setShow(true) }, 5000)
      return () => clearTimeout(t)
    })()
    return () => { alive = false }
  }, [])

  // Foreground mesajları gəldikdə toast göstər
  useEffect(() => {
    let unsubscribe = null
    onForegroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'muslims.cc'
      const body = payload.notification?.body || payload.data?.body || ''
      setToast({ title, body })
      setTimeout(() => setToast(null), 5000)
    }).then(u => { unsubscribe = u })
    return () => unsubscribe?.()
  }, [])

  const handleEnable = async () => {
    setBusy(true)
    const result = await requestNotificationPermission()
    setBusy(false)
    if (result.ok) {
      setShow(false)
    } else if (result.reason === 'denied') {
      setShow(false)
    } else {
      console.warn('Notification setup failed:', result)
      setShow(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  return (
    <>
      {/* Permission Banner */}
      {show && (
        <div style={{
          position:'fixed',
          bottom:20, left:20, right:20,
          maxWidth:420, margin:'0 auto',
          background:'var(--bg-card, #fff)',
          border:'1px solid var(--border)',
          borderRadius:16,
          padding:'14px 16px',
          boxShadow:'0 12px 36px rgba(0,0,0,0.18)',
          zIndex:9998,
          display:'flex',
          alignItems:'flex-start',
          gap:12,
          animation:'np-slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <div style={{
            width:42, height:42, borderRadius:12,
            background:'linear-gradient(135deg, #10b981, #059669)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, flexShrink:0,
          }}>🔔</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontWeight:800, fontSize:14, color:'var(--text)', marginBottom:3}}>{l.title}</div>
            <div style={{fontSize:13, color:'var(--text-muted)', lineHeight:1.45, marginBottom:10}}>{l.desc}</div>
            <div style={{display:'flex', gap:8}}>
              <button
                onClick={handleEnable}
                disabled={busy}
                style={{
                  background:'linear-gradient(135deg, #10b981, #059669)',
                  color:'#fff', border:'none',
                  padding:'7px 14px', borderRadius:999,
                  fontSize:12, fontWeight:800, cursor:'pointer',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? '...' : '🔔 ' + l.enable}
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  background:'var(--border)',
                  color:'var(--text-muted)', border:'none',
                  padding:'7px 14px', borderRadius:999,
                  fontSize:12, fontWeight:700, cursor:'pointer',
                }}
              >
                {l.later}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="dismiss"
            style={{
              background:'none', border:'none',
              fontSize:18, cursor:'pointer',
              color:'var(--text-muted)', padding:0,
              lineHeight:1,
            }}
          >{l.dismiss}</button>
        </div>
      )}

      {/* In-page toast for foreground messages */}
      {toast && (
        <div style={{
          position:'fixed',
          top:90, left:20, right:20,
          maxWidth:380, margin:'0 auto',
          background:'linear-gradient(135deg, #1a6b3a, #10b981)',
          color:'#fff',
          borderRadius:14,
          padding:'12px 16px',
          boxShadow:'0 10px 28px rgba(16,185,129,0.35)',
          zIndex:10000,
          display:'flex', alignItems:'flex-start', gap:10,
          animation:'np-slideUp 0.3s ease',
        }}>
          <div style={{fontSize:22}}>🔔</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontWeight:800, fontSize:14, marginBottom:2}}>{toast.title}</div>
            <div style={{fontSize:13, opacity:0.95, lineHeight:1.4}}>{toast.body}</div>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{background:'none', border:'none', color:'#fff', fontSize:16, cursor:'pointer', opacity:0.8}}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes np-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
