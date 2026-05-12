import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getStoredToken,
  clearStoredToken,
} from '../firebase/messaging'
import { deleteDocument } from '../firebase/firestore'
import '../styles/NotificationSettingsWidget.css'

const PREFS_KEY = 'muslim_cc_notif_prefs'

const DEFAULT_PREFS = {
  prayer: true,
  daily: true,
  announcements: true,
  events: true,
}

const LABELS = {
  az: {
    open:'Bildiriş ayarları',
    close:'Bağla',
    title:'Bildirişlər',
    subtitle:'Bildiriş ayarlarınızı idarə edin',
    status:'Status',
    granted:'Aktiv',
    denied:'Bloklanıb',
    default:'Aktivləşdirilməyib',
    unsupported:'Brauzer dəstəkləmir',
    enable:'Bildirişləri aktivləşdir',
    disable:'Söndür',
    enabling:'Aktivləşdirilir...',
    blockedHelp:'Bildirişlər brauzerdə bloklanıb. Brauzer ünvan sətrində kilidə klikləyib icazə verin.',
    types:'Bildiriş növləri',
    typePrayer:'Namaz vaxtları',
    typePrayerSub:'5 vaxt namazı üçün xatırlatma',
    typeDaily:'Günün ayəsi/duası',
    typeDailySub:'Hər səhər yeni məzmun',
    typeAnnouncements:'Elanlar',
    typeAnnouncementsSub:'Yeni xəbərlər və yenilənmələr',
    typeEvents:'Hadisələr',
    typeEventsSub:'Ramazan, Eyd, mübarək günlər',
    test:'Test bildirişi göndər',
    testSub:'Sınamaq üçün lokal bildiriş',
    testSent:'Test göndərildi ✓',
    permissionNeeded:'Əvvəlcə icazə verin',
    save:'Yadda saxla',
    saved:'Yadda saxlandı ✓',
  },
  en: {
    open:'Notification settings',
    close:'Close',
    title:'Notifications',
    subtitle:'Manage your notification preferences',
    status:'Status',
    granted:'Active',
    denied:'Blocked',
    default:'Not enabled',
    unsupported:'Browser not supported',
    enable:'Enable notifications',
    disable:'Disable',
    enabling:'Enabling...',
    blockedHelp:'Notifications are blocked in your browser. Click the lock icon in the address bar to allow.',
    types:'Notification types',
    typePrayer:'Prayer times',
    typePrayerSub:'Reminders for 5 daily prayers',
    typeDaily:'Daily verse/dua',
    typeDailySub:'New content every morning',
    typeAnnouncements:'Announcements',
    typeAnnouncementsSub:'News and updates',
    typeEvents:'Events',
    typeEventsSub:'Ramadan, Eid, blessed days',
    test:'Send test notification',
    testSub:'Local test notification',
    testSent:'Test sent ✓',
    permissionNeeded:'Grant permission first',
    save:'Save',
    saved:'Saved ✓',
  },
  ru: {
    open:'Настройки уведомлений',
    close:'Закрыть',
    title:'Уведомления',
    subtitle:'Управляйте уведомлениями',
    status:'Статус',
    granted:'Активны',
    denied:'Заблокированы',
    default:'Не включены',
    unsupported:'Браузер не поддерживает',
    enable:'Включить уведомления',
    disable:'Отключить',
    enabling:'Включается...',
    blockedHelp:'Уведомления заблокированы в браузере. Нажмите на замок в адресной строке.',
    types:'Типы уведомлений',
    typePrayer:'Время намаза',
    typePrayerSub:'Напоминания для 5 намазов',
    typeDaily:'Аят/дуа дня',
    typeDailySub:'Новый контент каждое утро',
    typeAnnouncements:'Объявления',
    typeAnnouncementsSub:'Новости и обновления',
    typeEvents:'События',
    typeEventsSub:'Рамадан, Ид, благословенные дни',
    test:'Тестовое уведомление',
    testSub:'Локальный тест',
    testSent:'Отправлено ✓',
    permissionNeeded:'Сначала разрешите',
    save:'Сохранить',
    saved:'Сохранено ✓',
  },
  ar: {
    open:'إعدادات الإشعارات',
    close:'إغلاق',
    title:'الإشعارات',
    subtitle:'إدارة إعدادات الإشعارات',
    status:'الحالة',
    granted:'مفعّلة',
    denied:'محظورة',
    default:'غير مفعّلة',
    unsupported:'المتصفح غير مدعوم',
    enable:'تفعيل الإشعارات',
    disable:'إيقاف',
    enabling:'جارٍ التفعيل...',
    blockedHelp:'الإشعارات محظورة في المتصفح. انقر على القفل في شريط العنوان.',
    types:'أنواع الإشعارات',
    typePrayer:'أوقات الصلاة',
    typePrayerSub:'تذكير الصلوات الخمس',
    typeDaily:'آية/دعاء اليوم',
    typeDailySub:'محتوى جديد كل صباح',
    typeAnnouncements:'الإعلانات',
    typeAnnouncementsSub:'أخبار وتحديثات',
    typeEvents:'الأحداث',
    typeEventsSub:'رمضان والعيد والأيام المباركة',
    test:'إشعار تجريبي',
    testSub:'إشعار محلي للتجربة',
    testSent:'تم الإرسال ✓',
    permissionNeeded:'امنح الإذن أولاً',
    save:'حفظ',
    saved:'تم الحفظ ✓',
  },
  tr: {
    open:'Bildirim ayarları',
    close:'Kapat',
    title:'Bildirimler',
    subtitle:'Bildirim tercihlerinizi yönetin',
    status:'Durum',
    granted:'Aktif',
    denied:'Engellendi',
    default:'Etkin değil',
    unsupported:'Tarayıcı desteklemiyor',
    enable:'Bildirimleri etkinleştir',
    disable:'Kapat',
    enabling:'Etkinleştiriliyor...',
    blockedHelp:'Bildirimler tarayıcıda engellendi. Adres çubuğundaki kilide tıklayın.',
    types:'Bildirim türleri',
    typePrayer:'Namaz vakitleri',
    typePrayerSub:'5 vakit için hatırlatma',
    typeDaily:'Günün ayeti/duası',
    typeDailySub:'Her sabah yeni içerik',
    typeAnnouncements:'Duyurular',
    typeAnnouncementsSub:'Haberler ve güncellemeler',
    typeEvents:'Olaylar',
    typeEventsSub:'Ramazan, Bayram, mübarek günler',
    test:'Test bildirimi gönder',
    testSub:'Yerel test bildirimi',
    testSent:'Gönderildi ✓',
    permissionNeeded:'Önce izin verin',
    save:'Kaydet',
    saved:'Kaydedildi ✓',
  },
}

function BellIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C10.5 2 9.3 3.2 9.3 4.7V5.2C6.8 6 5 8.4 5 11.2V14L3.5 16.5C3.2 17 3 17.6 3 18.2C3 19 3.7 19.7 4.5 19.7H19.5C20.3 19.7 21 19 21 18.2C21 17.6 20.8 17 20.5 16.5L19 14V11.2C19 8.4 17.2 6 14.7 5.2V4.7C14.7 3.2 13.5 2 12 2Z"
        fill="currentColor"
      />
      <path
        d="M10 20.7C10 21.9 10.9 22.7 12 22.7C13.1 22.7 14 21.9 14 20.7H10Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function NotificationSettingsWidget() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [open, setOpen] = useState(false)
  const [supported, setSupported] = useState(true)
  const [permission, setPermission] = useState('default')
  const [hasToken, setHasToken] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY)
      if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT_PREFS
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const ok = await isPushSupported()
      if (alive) setSupported(ok)
    })()
    setPermission(getPermissionStatus())
    setHasToken(!!getStoredToken())
    return () => { alive = false }
  }, [open])

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch {}
  }, [prefs])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Header menyusundan açılma (custom event)
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-notifications', handler)
    return () => window.removeEventListener('open-notifications', handler)
  }, [])

  const handleEnable = async () => {
    setBusy(true)
    setFeedback(null)
    const result = await requestNotificationPermission()
    setBusy(false)
    setPermission(getPermissionStatus())
    setHasToken(!!getStoredToken())
    if (!result.ok && result.reason !== 'denied') {
      setFeedback({ ok: false, text: result.reason || 'failed' })
    }
  }

  const handleDisable = async () => {
    if (!window.confirm('Bildirişlər söndürüləcək. Davam edək?')) return
    setBusy(true)
    const token = getStoredToken()
    if (token) {
      try { await deleteDocument('fcm_tokens', token) } catch {}
      clearStoredToken()
    }
    setHasToken(false)
    setBusy(false)
  }

  const handleTest = () => {
    if (permission !== 'granted') {
      setFeedback({ ok: false, text: l.permissionNeeded })
      return
    }
    new Notification('🌙 muslims.cc', {
      body: 'Test bildirişi — hər şey işləyir!',
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
    })
    setFeedback({ ok: true, text: l.testSent })
    setTimeout(() => setFeedback(null), 2500)
  }

  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const statusInfo = (() => {
    if (!supported) return { color: '#64748b', icon: '⊘', text: l.unsupported }
    if (permission === 'granted' && hasToken) return { color: '#10b981', icon: '✓', text: l.granted }
    if (permission === 'denied') return { color: '#ef4444', icon: '⊗', text: l.denied }
    return { color: '#f59e0b', icon: '!', text: l.default }
  })()

  const needsAttention = supported && permission !== 'granted' && permission !== 'denied'

  return (
    <>
      {/* FAB silindi — indi yalnız Header > "Daha çox" menyusundan açılır */}

      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel" role="dialog" aria-label={l.title}>
            <div className="notif-header">
              <div className="notif-header-info">
                <div className="notif-header-icon"><BellIcon size={24} /></div>
                <div>
                  <div className="notif-name">{l.title}</div>
                  <div className="notif-tagline">{l.subtitle}</div>
                </div>
              </div>
              <button className="notif-close" onClick={() => setOpen(false)} aria-label={l.close}>✕</button>
            </div>

            <div className="notif-body">

              {/* Status card */}
              <div className="notif-status-card" style={{ borderColor: statusInfo.color }}>
                <div
                  className="notif-status-icon"
                  style={{ background: `linear-gradient(135deg, ${statusInfo.color}, ${statusInfo.color}cc)` }}
                >
                  {statusInfo.icon}
                </div>
                <div className="notif-status-body">
                  <div className="notif-status-label">{l.status}</div>
                  <div className="notif-status-text" style={{ color: statusInfo.color }}>
                    {statusInfo.text}
                  </div>
                </div>
              </div>

              {/* Permission actions */}
              {supported && permission === 'default' && (
                <button className="notif-primary-btn" onClick={handleEnable} disabled={busy}>
                  {busy ? l.enabling : `🔔 ${l.enable}`}
                </button>
              )}

              {supported && permission === 'granted' && !hasToken && (
                <button className="notif-primary-btn" onClick={handleEnable} disabled={busy}>
                  {busy ? l.enabling : `🔔 ${l.enable}`}
                </button>
              )}

              {supported && permission === 'granted' && hasToken && (
                <button className="notif-secondary-btn" onClick={handleDisable} disabled={busy}>
                  🔕 {l.disable}
                </button>
              )}

              {permission === 'denied' && (
                <div className="notif-help">
                  💡 {l.blockedHelp}
                </div>
              )}

              {feedback && (
                <div className={`notif-feedback ${feedback.ok ? 'ok' : 'err'}`}>
                  {feedback.ok ? '✅' : '⚠️'} {feedback.text}
                </div>
              )}

              {/* Notification type preferences */}
              <section className="notif-section">
                <div className="notif-section-title">📋 {l.types}</div>
                <div className="notif-toggles">
                  <PrefToggle icon="🕌" label={l.typePrayer} sub={l.typePrayerSub}
                    on={prefs.prayer} onClick={() => togglePref('prayer')} />
                  <PrefToggle icon="🌅" label={l.typeDaily} sub={l.typeDailySub}
                    on={prefs.daily} onClick={() => togglePref('daily')} />
                  <PrefToggle icon="📣" label={l.typeAnnouncements} sub={l.typeAnnouncementsSub}
                    on={prefs.announcements} onClick={() => togglePref('announcements')} />
                  <PrefToggle icon="📅" label={l.typeEvents} sub={l.typeEventsSub}
                    on={prefs.events} onClick={() => togglePref('events')} />
                </div>
              </section>

              {/* Test button */}
              {supported && permission === 'granted' && (
                <button className="notif-test-btn" onClick={handleTest}>
                  <span className="notif-test-icon">🧪</span>
                  <span className="notif-test-text">
                    <span>{l.test}</span>
                    <span className="notif-test-sub">{l.testSub}</span>
                  </span>
                </button>
              )}

            </div>
          </div>
        </>
      )}
    </>
  )
}

function PrefToggle({ icon, label, sub, on, onClick }) {
  return (
    <button className={`notif-toggle ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on}>
      <span className="notif-toggle-icon">{icon}</span>
      <span className="notif-toggle-text">
        <span className="notif-toggle-label">{label}</span>
        <span className="notif-toggle-sub">{sub}</span>
      </span>
      <span className="notif-toggle-switch">
        <span className="notif-toggle-knob"></span>
      </span>
    </button>
  )
}
