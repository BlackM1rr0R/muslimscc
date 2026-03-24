import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'

const LABELS = {
  az: {
    title: 'Bildirişlər',
    enable: 'Bildirişləri aktivləşdir',
    enabled: 'Bildirişlər aktiv',
    denied: 'Bildirişlər bloklanıb',
    deniedDesc: 'Brauzer ayarlarından icazə verin',
    azan: 'Əzan bildirişi',
    azanDesc: 'Hər namaz vaxtında xəbərdar et',
    morning: 'Səhər əzkarları',
    morningDesc: 'Hər gün 06:30-da xatırlat',
    evening: 'Axşam əzkarları',
    eveningDesc: 'Hər gün 18:30-da xatırlat',
    hadith: 'Gündəlik hədis',
    hadithDesc: 'Hər gün 09:00-da hədis göndər',
    settings: 'Bildiriş ayarları',
  },
  en: {
    title: 'Notifications',
    enable: 'Enable notifications',
    enabled: 'Notifications active',
    denied: 'Notifications blocked',
    deniedDesc: 'Allow in browser settings',
    azan: 'Azan notification',
    azanDesc: 'Notify at each prayer time',
    morning: 'Morning adhkar',
    morningDesc: 'Daily reminder at 06:30',
    evening: 'Evening adhkar',
    eveningDesc: 'Daily reminder at 18:30',
    hadith: 'Daily hadith',
    hadithDesc: 'Send hadith daily at 09:00',
    settings: 'Notification settings',
  },
  ru: {
    title: 'Уведомления',
    enable: 'Включить уведомления',
    enabled: 'Уведомления активны',
    denied: 'Уведомления заблокированы',
    deniedDesc: 'Разрешите в настройках браузера',
    azan: 'Уведомление азана',
    azanDesc: 'Уведомлять при каждом намазе',
    morning: 'Утренние азкары',
    morningDesc: 'Ежедневно в 06:30',
    evening: 'Вечерние азкары',
    eveningDesc: 'Ежедневно в 18:30',
    hadith: 'Ежедневный хадис',
    hadithDesc: 'Отправлять хадис в 09:00',
    settings: 'Настройки уведомлений',
  },
  ar: {
    title: 'الإشعارات',
    enable: 'تفعيل الإشعارات',
    enabled: 'الإشعارات مفعلة',
    denied: 'الإشعارات محظورة',
    deniedDesc: 'اسمح من إعدادات المتصفح',
    azan: 'إشعار الأذان',
    azanDesc: 'تنبيه عند كل صلاة',
    morning: 'أذكار الصباح',
    morningDesc: 'تذكير يومي الساعة ٦:٣٠',
    evening: 'أذكار المساء',
    eveningDesc: 'تذكير يومي الساعة ١٨:٣٠',
    hadith: 'حديث يومي',
    hadithDesc: 'إرسال حديث الساعة ٩:٠٠',
    settings: 'إعدادات الإشعارات',
  },
  tr: {
    title: 'Bildirimler',
    enable: 'Bildirimleri etkinleştir',
    enabled: 'Bildirimler aktif',
    denied: 'Bildirimler engellendi',
    deniedDesc: 'Tarayıcı ayarlarından izin verin',
    azan: 'Ezan bildirimi',
    azanDesc: 'Her namaz vaktinde bildir',
    morning: 'Sabah ezkarları',
    morningDesc: 'Her gün 06:30\'da hatırlat',
    evening: 'Akşam ezkarları',
    eveningDesc: 'Her gün 18:30\'da hatırlat',
    hadith: 'Günlük hadis',
    hadithDesc: 'Her gün 09:00\'da hadis gönder',
    settings: 'Bildirim ayarları',
  },
}

const STORAGE_KEY = 'muslims_notif_settings'

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      enabled: false, azan: true, morning: true, evening: true, hadith: true
    }
  } catch {
    return { enabled: false, azan: true, morning: true, evening: true, hadith: true }
  }
}

function sendToSW(settings, prayerTimes) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: 'SCHEDULE_NOTIFICATIONS',
    payload: {
      enabled: settings.enabled,
      azanEnabled: settings.azan,
      morningReminder: settings.morning,
      eveningReminder: settings.evening,
      dailyHadith: settings.hadith,
      prayerTimes: prayerTimes,
      prayerNames: { Fajr: 'Sübh', Dhuhr: 'Zöhr', Asr: 'Əsr', Maghrib: 'Məğrib', Isha: 'İşa' },
      morningText: 'Səhər əzkarlarını oxumağı unutma!',
      eveningText: 'Axşam əzkarlarını oxumağı unutma!',
      hadithText: 'Bugünkü hədisi oxumaq üçün aç',
    }
  })
}

export default function NotificationManager() {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.en
  const [settings, setSettings] = useState(loadSettings)
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [open, setOpen] = useState(false)

  // Settings dəyişdikdə saxla və SW-yə göndər
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    // Prayer times-ı localStorage-dan oxu
    const cached = localStorage.getItem('cached_prayer_times')
    let prayerTimes = null
    try { prayerTimes = JSON.parse(cached) } catch {}
    sendToSW(settings, prayerTimes)
  }, [settings])

  // SW hazır olduqda göndər + periodicSync qeydiyyatı
  useEffect(() => {
    if (!navigator.serviceWorker) return
    navigator.serviceWorker.ready.then(async (reg) => {
      const cached = localStorage.getItem('cached_prayer_times')
      let pt = null
      try { pt = JSON.parse(cached) } catch {}
      sendToSW(settings, pt)

      // Periodic Background Sync qeydiyyatı (Android — ekran bağlı olsa belə)
      if (reg.periodicSync && settings.enabled) {
        try {
          await reg.periodicSync.register('check-prayer-times', { minInterval: 60 * 1000 })
        } catch {}
      }
    })
  }, [settings.enabled])

  // Əzan vaxtında audio çal (client tərəfdən, hər 30 saniyə yoxla)
  useEffect(() => {
    if (!settings.enabled || !settings.azan) return
    const playAzan = () => {
      try {
        const cached = JSON.parse(localStorage.getItem('cached_prayer_times'))
        if (!cached) return
        const now = new Date()
        const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
        const todayKey = now.toISOString().slice(0,10)
        for (const [key, time] of Object.entries(cached)) {
          if (time && time.slice(0,5) === nowStr) {
            const audioKey = `azan_audio_${todayKey}_${key}`
            if (localStorage.getItem(audioKey)) continue
            localStorage.setItem(audioKey, '1')
            // Əzan melodiyası
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const t = ctx.currentTime
            const notes = [
              {f:440,s:0,d:0.6},{f:523,s:0.7,d:0.6},{f:587,s:1.4,d:0.8},{f:523,s:2.3,d:0.6},
              {f:440,s:3.0,d:0.8},{f:392,s:3.9,d:0.6},{f:440,s:4.6,d:1.0},
              {f:523,s:5.8,d:0.6},{f:587,s:6.5,d:0.8},{f:659,s:7.4,d:0.6},
              {f:587,s:8.1,d:0.6},{f:523,s:8.8,d:0.6},{f:440,s:9.5,d:1.2},
            ]
            notes.forEach(n => {
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.type = 'sine'
              osc.frequency.value = n.f
              osc.connect(gain)
              gain.connect(ctx.destination)
              gain.gain.setValueAtTime(0, t+n.s)
              gain.gain.linearRampToValueAtTime(0.25, t+n.s+0.05)
              gain.gain.linearRampToValueAtTime(0, t+n.s+n.d)
              osc.start(t+n.s)
              osc.stop(t+n.s+n.d+0.01)
            })
          }
        }
      } catch {}
    }
    const id = setInterval(playAzan, 30000)
    playAzan()
    return () => clearInterval(id)
  }, [settings.enabled, settings.azan])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm === 'granted') {
      setSettings(s => ({ ...s, enabled: true }))
      // Test notification
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: '☽ Muslims.cc',
            body: t.enabled,
            tag: 'test',
          }
        })
      }
    }
  }, [t])

  const toggle = (key) => {
    setSettings(s => ({ ...s, [key]: !s[key] }))
  }

  if (typeof Notification === 'undefined') return null

  // Neçə toggle aktivdir
  const activeCount = permission === 'granted' && settings.enabled
    ? [settings.azan, settings.morning, settings.evening, settings.hadith].filter(Boolean).length
    : 0

  const levelClass = activeCount === 4 ? 'level-4' : activeCount === 3 ? 'level-3' : activeCount === 2 ? 'level-2' : activeCount === 1 ? 'level-1' : ''

  return (
    <>
      {/* Notification FAB */}
      <button
        className={`notif-fab ${levelClass}`}
        onClick={() => setOpen(true)}
        title={t.settings}
      >
        <div className="notif-fab-content">
          <svg className={`notif-fab-icon ${activeCount === 4 ? 'ringing' : ''}`} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div className="notif-fab-bars">
            {[0,1,2,3].map(i => (
              <span key={i} className={`notif-bar ${i < activeCount ? 'on' : ''}`} />
            ))}
          </div>
        </div>
      </button>

      {/* Settings panel */}
      {open && (
        <div className="notif-overlay" onClick={() => setOpen(false)}>
          <div className="notif-panel" onClick={e => e.stopPropagation()}>
            <div className="notif-panel-header">
              <h3>{t.title}</h3>
              <button className="notif-panel-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            {permission === 'denied' ? (
              <div className="notif-denied">
                <span>🔕</span>
                <strong>{t.denied}</strong>
                <p>{t.deniedDesc}</p>
              </div>
            ) : permission !== 'granted' ? (
              <button className="notif-enable-btn" onClick={requestPermission}>
                🔔 {t.enable}
              </button>
            ) : (
              <div className="notif-toggles">
                <label className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="notif-toggle-icon">🕌</span>
                    <div>
                      <strong>{t.azan}</strong>
                      <p>{t.azanDesc}</p>
                    </div>
                  </div>
                  <div className={`notif-switch ${settings.azan ? 'on' : ''}`} onClick={() => toggle('azan')}>
                    <div className="notif-switch-thumb" />
                  </div>
                </label>

                <label className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="notif-toggle-icon">🌅</span>
                    <div>
                      <strong>{t.morning}</strong>
                      <p>{t.morningDesc}</p>
                    </div>
                  </div>
                  <div className={`notif-switch ${settings.morning ? 'on' : ''}`} onClick={() => toggle('morning')}>
                    <div className="notif-switch-thumb" />
                  </div>
                </label>

                <label className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="notif-toggle-icon">🌆</span>
                    <div>
                      <strong>{t.evening}</strong>
                      <p>{t.eveningDesc}</p>
                    </div>
                  </div>
                  <div className={`notif-switch ${settings.evening ? 'on' : ''}`} onClick={() => toggle('evening')}>
                    <div className="notif-switch-thumb" />
                  </div>
                </label>

                <label className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="notif-toggle-icon">📚</span>
                    <div>
                      <strong>{t.hadith}</strong>
                      <p>{t.hadithDesc}</p>
                    </div>
                  </div>
                  <div className={`notif-switch ${settings.hadith ? 'on' : ''}`} onClick={() => toggle('hadith')}>
                    <div className="notif-switch-thumb" />
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
