import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getStoredToken,
  clearStoredToken,
  updateTokenDaily,
  updateTokenPrefs,
  disablePush,
} from '../api/push'
import Icon from './Icon'
import '../styles/NotificationSettingsWidget.css'
import { showLocalNotification } from '../utils/notify'

const PREFS_KEY = 'muslim_cc_notif_prefs'

// "Günün ayəsi" yeganə serverə yazılan seçimdir (token sənədi → daily) —
// icazəsiz spam olmasın deyə susmaya görə SÖNÜLÜ. Saat şəhərin yerli saatıdır.
const AYAH_HOURS = [7, 8, 9, 20]   // server/daily-ayah.js → HOURS ilə eyni

const DEFAULT_PREFS = {
  prayer: true,
  checkin: false,   // "Qıldınızmı?" — serverə yazılır (token → checkin), susmaya görə sönülü
  ayah: false,
  ayahHour: 8,
  announcements: true,
  events: true,
}

const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`

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
    typeCheckin:'Qıldınızmı? xatırlatması',
    typeCheckinSub:'Namaz vaxtından 20 dəqiqə sonra soruşur — bir toxunuşla qeyd edin',
    checkinNeedsToken:'Xatırlatma üçün əvvəlcə yuxarıdan bildirişlərə icazə verin. Seçiminiz yadda qalacaq.',
    typeAyah:'Günün ayəsi',
    typeAyahSub:'Hər gün bir ayə və tərcüməsi',
    ayahTime:'Bildiriş vaxtı',
    ayahTimeHint:'Şəhərinizin saatı ilə',
    ayahNeedsToken:'Ayə bildirişi üçün əvvəlcə yuxarıdan bildirişlərə icazə verin. Seçiminiz yadda qalacaq.',
    ayahUnsupported:'Bu brauzer veb bildirişlərini dəstəkləmir. Seçiminiz yadda qaldı, amma bildiriş gəlməyəcək.',
    ayahSaveFailed:'Seçimi saxlamaq alınmadı. Yenidən cəhd edin.',
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
    typeCheckin:'Did you pray? reminder',
    typeCheckinSub:'Asks 20 minutes after each prayer time — mark it with one tap',
    checkinNeedsToken:'To get the reminder, allow notifications above first. Your choice will be saved.',
    typeAyah:'Verse of the day',
    typeAyahSub:'One verse with its translation every day',
    ayahTime:'Notification time',
    ayahTimeHint:'Local time in your city',
    ayahNeedsToken:'To get the daily verse, allow notifications above first. Your choice will be saved.',
    ayahUnsupported:'This browser does not support push notifications. Your choice is saved, but no notifications will arrive.',
    ayahSaveFailed:'Could not save your choice. Please try again.',
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
    typeCheckin:'Напоминание «Намаз совершён?»',
    typeCheckinSub:'Спрашивает через 20 минут после времени намаза — отметка одним касанием',
    checkinNeedsToken:'Чтобы получать напоминание, сначала разрешите уведомления выше. Ваш выбор сохранится.',
    typeAyah:'Аят дня',
    typeAyahSub:'Каждый день один аят с переводом',
    ayahTime:'Время уведомления',
    ayahTimeHint:'По времени вашего города',
    ayahNeedsToken:'Чтобы получать аят дня, сначала разрешите уведомления выше. Ваш выбор сохранится.',
    ayahUnsupported:'Этот браузер не поддерживает веб-уведомления. Выбор сохранён, но уведомления приходить не будут.',
    ayahSaveFailed:'Не удалось сохранить выбор. Попробуйте ещё раз.',
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
    typeCheckin:'تذكير «هل صليت؟»',
    typeCheckinSub:'يسأل بعد ٢٠ دقيقة من دخول وقت الصلاة — سجّلها بلمسة واحدة',
    checkinNeedsToken:'لتلقي التذكير، اسمح بالإشعارات أعلاه أولاً. سيُحفظ اختيارك.',
    typeAyah:'آية اليوم',
    typeAyahSub:'آية مع ترجمتها كل يوم',
    ayahTime:'وقت الإشعار',
    ayahTimeHint:'بتوقيت مدينتك',
    ayahNeedsToken:'لتلقي آية اليوم، اسمح بالإشعارات أعلاه أولاً. سيُحفظ اختيارك.',
    ayahUnsupported:'هذا المتصفح لا يدعم إشعارات الدفع. حُفظ اختيارك، لكن الإشعارات لن تصل.',
    ayahSaveFailed:'تعذّر حفظ اختيارك. حاول مرة أخرى.',
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
    typeCheckin:'Kıldınız mı? hatırlatması',
    typeCheckinSub:'Namaz vaktinden 20 dakika sonra sorar — tek dokunuşla işaretleyin',
    checkinNeedsToken:'Hatırlatma için önce yukarıdan bildirimlere izin verin. Seçiminiz kaydedilecek.',
    typeAyah:'Günün ayeti',
    typeAyahSub:'Her gün bir ayet ve meali',
    ayahTime:'Bildirim saati',
    ayahTimeHint:'Şehrinizin saatiyle',
    ayahNeedsToken:'Günün ayeti için önce yukarıdan bildirimlere izin verin. Seçiminiz kaydedilecek.',
    ayahUnsupported:'Bu tarayıcı anlık bildirimleri desteklemiyor. Seçiminiz kaydedildi, ancak bildirim gelmeyecek.',
    ayahSaveFailed:'Seçiminiz kaydedilemedi. Lütfen tekrar deneyin.',
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
    // Token indi yarandı — icazədən əvvəl seçilmiş "Günün ayəsi" serverə də yazılsın
    if (result.ok && prefs.ayah) updateTokenDaily({ ayah: true, hour: prefs.ayahHour })
    // checkin isə abunəlik yazılanda serverPrefs() ilə artıq gedib
  }

  const handleDisable = async () => {
    if (!window.confirm(l.confirmDisable)) return
    setBusy(true)
    // Brauzer abunəliyi ləğv olunur, serverdən silinir (api/push.js)
    try { await disablePush() } catch { clearStoredToken() }
    setHasToken(false)
    setBusy(false)
  }

  const handleTest = async () => {
    if (permission !== 'granted') {
      setFeedback({ ok: false, text: l.permissionNeeded })
      return
    }
    // Android-də `new Notification()` xəta atırdı — sınaq səssiz qırılırdı (utils/notify.js)
    const shown = await showLocalNotification(brandName(lang), {
      body: l.testBody,
      icon: '/android-chrome-192x192.png',
      badge: '/badge-96x96.png?v=2',   // ağ monoxrom — Android rəngli şəkli ağ kvadrat göstərir
    })
    if (!shown) { setFeedback({ ok: false, text: l.permissionNeeded }); return }
    setFeedback({ ok: true, text: l.testSent })
    setTimeout(() => setFeedback(null), 2500)
  }

  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  // Azan bildirişi: serverə də yazılır (token sənədi → azan: false olanda göndərilmir)
  const setAzan = async () => {
    const next = !prefs.prayer
    setPrefs(p => ({ ...p, prayer: next }))
    if (!getStoredToken()) return
    const ok = await updateTokenPrefs({ azan: next })
    if (!ok) setFeedback({ ok: false, text: l.ayahSaveFailed })
  }

  // "Qıldınızmı?" xatırlatması: lokal yadda qalır; token varsa sənədə də yazılır
  // (yalnız açıq/sönülü — qıldım qeydləri serverə getmir)
  const setCheckin = async () => {
    const next = !prefs.checkin
    setPrefs(p => ({ ...p, checkin: next }))
    if (!getStoredToken()) return
    const ok = await updateTokenPrefs({ checkin: next })
    if (!ok) setFeedback({ ok: false, text: l.ayahSaveFailed })
  }

  // "Günün ayəsi": seçim həmişə lokal yadda qalır; token varsa sənədə də yazılır
  const setAyah = async (patch) => {
    const next = { ayah: prefs.ayah, hour: prefs.ayahHour, ...patch }
    setPrefs(p => ({ ...p, ayah: next.ayah, ayahHour: next.hour }))
    if (!getStoredToken()) return
    const ok = await updateTokenDaily(next)
    if (!ok) setFeedback({ ok: false, text: l.ayahSaveFailed })
  }

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
                    on={prefs.prayer} onClick={setAzan} />
                  <PrefToggle icon="check" label={l.typeCheckin} sub={l.typeCheckinSub}
                    on={prefs.checkin} onClick={setCheckin} />
                  {prefs.checkin && !hasToken && (
                    <div className="notif-ayah-note" role="note">
                      <Icon name="info" size={16} /> <span>{supported ? l.checkinNeedsToken : l.ayahUnsupported}</span>
                    </div>
                  )}
                  <PrefToggle icon="quran" label={l.typeAyah} sub={l.typeAyahSub}
                    on={prefs.ayah} onClick={() => setAyah({ ayah: !prefs.ayah })} />
                  {prefs.ayah && (
                    <div className="notif-ayah">
                      <div className="notif-ayah-head" id="notif-ayah-time">
                        <span>{l.ayahTime}</span>
                        <span className="notif-ayah-hint">{l.ayahTimeHint}</span>
                      </div>
                      <div className="notif-ayah-hours" role="radiogroup" aria-labelledby="notif-ayah-time">
                        {AYAH_HOURS.map(h => (
                          <button key={h} type="button" role="radio" aria-checked={prefs.ayahHour === h}
                            className={`notif-ayah-hour ${prefs.ayahHour === h ? 'on' : ''}`}
                            onClick={() => setAyah({ hour: h })}>
                            {hourLabel(h)}
                          </button>
                        ))}
                      </div>
                      {!hasToken && (
                        <div className="notif-ayah-note" role="note">
                          <Icon name="info" size={16} /> <span>{supported ? l.ayahNeedsToken : l.ayahUnsupported}</span>
                        </div>
                      )}
                    </div>
                  )}
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
