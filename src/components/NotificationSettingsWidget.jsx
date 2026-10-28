import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getStoredToken,
  clearStoredToken,
} from '../firebase/messaging'
import { deleteDocument } from '../firebase/firestore'
import Icon from './Icon'
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
    status:'Vəziyyət',
    granted:'Aktiv',
    denied:'Bağlanıb',
    default:'Aktivləşdirilməyib',
    unsupported:'Brauzer dəstəkləmir',
    enable:'Bildirişləri aktivləşdir',
    disable:'Söndür',
    enabling:'Aktivləşdirilir…',
    blockedHelp:'Bildirişlər brauzerdə bağlanıb. Ünvan sətrindəki kilid işarəsinə basıb icazə verin.',
    types:'Bildiriş növləri',
    typePrayer:'Namaz vaxtları',
    typePrayerSub:'5 vaxt namazı üçün xatırlatma',
    typeDaily:'Günün ayəsi və duası',
    typeDailySub:'Hər səhər yeni məzmun',
    typeAnnouncements:'Elanlar',
    typeAnnouncementsSub:'Yeni xəbərlər və yenilənmələr',
    typeEvents:'Mübarək günlər',
    typeEventsSub:'Ramazan, bayramlar, mübarək gecələr',
    test:'Sınaq bildirişi göndər',
    testSub:'Bu cihazda yoxlama bildirişi',
    testSent:'Sınaq bildirişi göndərildi',
    permissionNeeded:'Əvvəlcə icazə verin',
    save:'Yadda saxla',
    saved:'Yadda saxlandı',
    confirmDisable:'Bildirişlər söndürüləcək. Davam edək?',
    testBody:'Sınaq bildirişi — hər şey işləyir!',
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
    enabling:'Enabling…',
    blockedHelp:'Notifications are blocked in your browser. Click the lock icon in the address bar to allow.',
    types:'Notification types',
    typePrayer:'Prayer times',
    typePrayerSub:'Reminders for 5 daily prayers',
    typeDaily:'Verse and dua of the day',
    typeDailySub:'New content every morning',
    typeAnnouncements:'Announcements',
    typeAnnouncementsSub:'News and updates',
    typeEvents:'Blessed days',
    typeEventsSub:'Ramadan, Eid, blessed days',
    test:'Send test notification',
    testSub:'Local test notification',
    testSent:'Test notification sent',
    permissionNeeded:'Grant permission first',
    save:'Save',
    saved:'Saved',
    confirmDisable:'Notifications will be turned off. Continue?',
    testBody:'Test notification — everything works!',
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
    enabling:'Включается…',
    blockedHelp:'Уведомления заблокированы в браузере. Нажмите на замок в адресной строке.',
    types:'Типы уведомлений',
    typePrayer:'Время намаза',
    typePrayerSub:'Напоминания для 5 намазов',
    typeDaily:'Аят/дуа дня',
    typeDailySub:'Новый контент каждое утро',
    typeAnnouncements:'Объявления',
    typeAnnouncementsSub:'Новости и обновления',
    typeEvents:'Благословенные дни',
    typeEventsSub:'Рамадан, праздники, благословенные ночи',
    test:'Тестовое уведомление',
    testSub:'Локальный тест',
    testSent:'Тест отправлен',
    permissionNeeded:'Сначала разрешите',
    save:'Сохранить',
    saved:'Сохранено',
    confirmDisable:'Уведомления будут отключены. Продолжить?',
    testBody:'Тестовое уведомление — всё работает!',
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
    enabling:'جارٍ التفعيل…',
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
    testSent:'تم الإرسال',
    permissionNeeded:'امنح الإذن أولاً',
    save:'حفظ',
    saved:'تم الحفظ',
    confirmDisable:'سيتم إيقاف الإشعارات. هل تريد المتابعة؟',
    testBody:'إشعار تجريبي — كل شيء يعمل!',
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
    enabling:'Etkinleştiriliyor…',
    blockedHelp:'Bildirimler tarayıcıda engellendi. Adres çubuğundaki kilide tıklayın.',
    types:'Bildirim türleri',
    typePrayer:'Namaz vakitleri',
    typePrayerSub:'5 vakit için hatırlatma',
    typeDaily:'Günün ayeti/duası',
    typeDailySub:'Her sabah yeni içerik',
    typeAnnouncements:'Duyurular',
    typeAnnouncementsSub:'Haberler ve güncellemeler',
    typeEvents:'Mübarek günler',
    typeEventsSub:'Ramazan, bayramlar, mübarek geceler',
    test:'Test bildirimi gönder',
    testSub:'Yerel test bildirimi',
    testSent:'Test bildirimi gönderildi',
    permissionNeeded:'Önce izin verin',
    save:'Kaydet',
    saved:'Kaydedildi',
    confirmDisable:'Bildirimler kapatılacak. Devam edilsin mi?',
    testBody:'Test bildirimi — her şey çalışıyor!',
  },
}

/**
 * Bildiriş ayarları paneli.
 *
 * İki rejim:
 *  • İdarə olunan — `open` prop verilir (FloatingDock). Header-in
 *    "open-notifications" hadisəsini dok özü dinləyir; bağlananda
 *    `onClose()` çağırılır.
 *  • Köhnə (müstəqil) — prop yoxdur: "open-notifications" hadisəsi ilə açılır.
 *
 * @param {{ open?: boolean, onClose?: () => void }} props
 */
export default function NotificationSettingsWidget({ open: openProp, onClose } = {}) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const controlled = openProp !== undefined
  const [openState, setOpenState] = useState(false)
  const open = controlled ? Boolean(openProp) : openState
  const setOpen = (value) => {
    if (controlled) { if (!value) onClose?.() }
    else setOpenState(value)
  }
  const closeRef = useRef(null)
  closeRef.current = () => setOpen(false)
  const closeBtnRef = useRef(null)
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

  // Escape ilə bağlama
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Açılanda fokus panelə keçsin (klaviatura istifadəçiləri üçün)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => closeBtnRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [open])

  // Header menyusundan açılma (custom event) — yalnız müstəqil rejimdə;
  // idarə olunan rejimdə bu hadisəni FloatingDock dinləyir
  useEffect(() => {
    if (controlled) return
    const handler = () => setOpenState(true)
    window.addEventListener('open-notifications', handler)
    return () => window.removeEventListener('open-notifications', handler)
  }, [controlled])

  // Açıq olduqda body-ə class əlavə et (mobil scroll kilidi, üzən düymələri gizlət).
  // Yalnız açıq ikən əlavə edib bağlananda silirik — panellər arasında
  // keçid zamanı bir panelin təmizləməsi digərinin sinfini silməsin.
  useEffect(() => {
    if (!open) return
    document.body.classList.add('panel-open')
    return () => document.body.classList.remove('panel-open')
  }, [open])

  // Başqa panel açılanda bunu bağla (yalnız müstəqil rejimdə)
  useEffect(() => {
    if (controlled) return
    const handler = (e) => {
      if (e.detail !== 'notif') setOpenState(false)
    }
    window.addEventListener('close-other-panels', handler)
    return () => window.removeEventListener('close-other-panels', handler)
  }, [controlled])

  // Bu açılanda digərlərinə xəbər ver
  useEffect(() => {
    if (open && !controlled) window.dispatchEvent(new CustomEvent('close-other-panels', { detail: 'notif' }))
  }, [open, controlled])

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
    if (!window.confirm(l.confirmDisable)) return
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
    new Notification(brandName(lang), {
      body: l.testBody,
      icon: '/android-chrome-192x192.png',
      badge: '/badge-96x96.png?v=2',   // ağ monoxrom — Android rəngli şəkli ağ kvadrat göstərir
    })
    setFeedback({ ok: true, text: l.testSent })
    setTimeout(() => setFeedback(null), 2500)
  }

  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  // Rəng burada deyil — CSS data-status-a görə seçir (NotificationSettingsWidget.css)
  const statusInfo = (() => {
    if (!supported) return { key: 'unsupported', icon: 'bellOff', text: l.unsupported }
    if (permission === 'granted' && hasToken) return { key: 'granted', icon: 'check', text: l.granted }
    if (permission === 'denied') return { key: 'denied', icon: 'bellOff', text: l.denied }
    return { key: 'default', icon: 'bell', text: l.default }
  })()

  const needsAttention = supported && permission !== 'granted' && permission !== 'denied'

  return (
    <>
      {/* Öz üzən düyməsi yoxdur — Header > "Daha çox" menyusundan və FloatingDock-dan açılır */}

      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel" role="dialog" aria-label={l.title}>
            <div className="notif-header">
              <div className="notif-header-info">
                <div className="notif-header-icon" aria-hidden="true"><Icon name="bell" size={22} /></div>
                <div>
                  <div className="notif-name">{l.title}</div>
                  <div className="notif-tagline">{l.subtitle}</div>
                </div>
              </div>
              <button ref={closeBtnRef} className="notif-close" onClick={() => setOpen(false)} aria-label={l.close}><Icon name="close" size={18} /></button>
            </div>

            <div className="notif-body">

              {/* Status card */}
              <div className="notif-status-card" data-status={statusInfo.key} role="status">
                <div className="notif-status-icon" aria-hidden="true">
                  <Icon name={statusInfo.icon} size={20} strokeWidth={2} />
                </div>
                <div className="notif-status-body">
                  <div className="notif-status-label">{l.status}</div>
                  <div className="notif-status-text">
                    {statusInfo.text}
                  </div>
                </div>
              </div>

              {/* Permission actions */}
              {supported && permission === 'default' && (
                <button className="notif-primary-btn" onClick={handleEnable} disabled={busy}>
                  {busy ? <span className="notif-spinner" aria-hidden="true" /> : <Icon name="bell" size={18} />}
                  <span>{busy ? l.enabling : l.enable}</span>
                </button>
              )}

              {supported && permission === 'granted' && !hasToken && (
                <button className="notif-primary-btn" onClick={handleEnable} disabled={busy}>
                  {busy ? <span className="notif-spinner" aria-hidden="true" /> : <Icon name="bell" size={18} />}
                  <span>{busy ? l.enabling : l.enable}</span>
                </button>
              )}

              {supported && permission === 'granted' && hasToken && (
                <button className="notif-secondary-btn" onClick={handleDisable} disabled={busy}>
                  <Icon name="bellOff" size={18} /> <span>{l.disable}</span>
                </button>
              )}

              {permission === 'denied' && (
                <div className="notif-help">
                  <Icon name="info" size={18} /> <span>{l.blockedHelp}</span>
                </div>
              )}

              {feedback && (
                <div className={`notif-feedback ${feedback.ok ? 'ok' : 'err'}`} role="status">
                  <Icon name={feedback.ok ? 'check' : 'alert'} size={17} /> <span>{feedback.text}</span>
                </div>
              )}

              {/* Notification type preferences */}
              <section className="notif-section">
                <div className="notif-section-title"><Icon name="list" size={15} /> {l.types}</div>
                <div className="notif-toggles">
                  <PrefToggle icon="prayer" label={l.typePrayer} sub={l.typePrayerSub}
                    on={prefs.prayer} onClick={() => togglePref('prayer')} />
                  <PrefToggle icon="quran" label={l.typeDaily} sub={l.typeDailySub}
                    on={prefs.daily} onClick={() => togglePref('daily')} />
                  <PrefToggle icon="megaphone" label={l.typeAnnouncements} sub={l.typeAnnouncementsSub}
                    on={prefs.announcements} onClick={() => togglePref('announcements')} />
                  <PrefToggle icon="calendar" label={l.typeEvents} sub={l.typeEventsSub}
                    on={prefs.events} onClick={() => togglePref('events')} />
                </div>
              </section>

              {/* Test button */}
              {supported && permission === 'granted' && (
                <button className="notif-test-btn" onClick={handleTest}>
                  <span className="notif-test-icon" aria-hidden="true"><Icon name="flask" size={18} /></span>
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
      <span className="notif-toggle-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
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
