import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle, AdminNotice, AdminAlert, AdminEmpty } from './AdminUi'
import Icon, { BrandMark } from '../Icon'
import { brandName } from '../../config/brand'
import { getAll, addDocument, COLLECTIONS } from '../../firebase/firestore'
import { isFirebaseConfigured } from '../../firebase/config'

const API_URL = import.meta.env.VITE_API_URL || ''

// Göndərmə açarı (serverin ADMIN_TOKEN-i) sessiya yaddaşında saxlanır —
// sekmə bağlananda silinir. QƏSDƏN kodda/env-də DEYİL: VITE_* dəyərləri
// hamıya açıq JS faylına düşür; açar orada olsaydı, istənilən ziyarətçi
// onu oxuyub bütün abunəçilərə bildiriş göndərə bilərdi.
const TOKEN_KEY = 'qm_admin_push_token'
const readStoredPushToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

const LABELS = {
  az: { tokenField:'Göndərmə açarı', tokenHint:'Serverdə təyin olunmuş admin açarı. Yalnız bu sekmədə yadda qalır.', tokenRequired:'Göndərmə açarını daxil et', tokenWrong:'Açar yanlışdır — serverdəki admin açarı ilə eyni olmalıdır', title:'Anlıq bildirişlər', sub:'Bütün abunəçilərə bildiriş göndərin', send:'Bildiriş göndər', subscribers:'Abunəçi sayı', titleField:'Başlıq', bodyField:'Mesaj', urlField:'Açılacaq ünvan (istəyə bağlı)', priorityHigh:'Prioritet', normal:'Adi', high:'Yüksək', preview:'Önbaxış', now:'indi', sending:'Göndərilir...', sent:'Göndərildi:', failed:'Xəta:', sendFailed:'Göndərmək alınmadı', history:'Tarixçə', noHistory:'Hələ bildiriş göndərilməyib', titleRequired:'Başlıq tələb olunur', bodyRequired:'Mesaj tələb olunur', noBackend:'Server API-si qoşulmayıb. .env faylında VITE_API_URL təyin edin.', noFirebase:'Firebase qoşulmayıb', phTitle:'🕌 Namaz vaxtı', phBody:'Zöhr namazının vaxtı çatdı' },
  en: { tokenField:'Send key', tokenHint:'The admin key set on the server. Kept only in this tab.', tokenRequired:'Enter the send key', tokenWrong:'Wrong key — must match the admin key on the server', title:'Push notifications', sub:'Send notifications to all subscribers', send:'Send notification', subscribers:'Subscribers', titleField:'Title', bodyField:'Message', urlField:'URL to open (optional)', priorityHigh:'Priority', normal:'Normal', high:'High', preview:'Preview', now:'now', sending:'Sending...', sent:'Sent to:', failed:'Failed:', sendFailed:'Sending failed', history:'History', noHistory:'No notifications sent yet', titleRequired:'Title required', bodyRequired:'Message required', noBackend:'Server API not configured. Set VITE_API_URL in .env.', noFirebase:'Firebase is not connected', phTitle:'🕌 Prayer time', phBody:'It is time for the Dhuhr prayer' },
  ru: { tokenField:'Ключ отправки', tokenHint:'Ключ администратора, заданный на сервере. Хранится только в этой вкладке.', tokenRequired:'Введите ключ отправки', tokenWrong:'Неверный ключ — он должен совпадать с ключом администратора на сервере', title:'Мгновенные уведомления', sub:'Отправить уведомления всем подписчикам', send:'Отправить уведомление', subscribers:'Подписчики', titleField:'Заголовок', bodyField:'Сообщение', urlField:'Открываемый адрес (необязательно)', priorityHigh:'Приоритет', normal:'Обычный', high:'Высокий', preview:'Предпросмотр', now:'сейчас', sending:'Отправка...', sent:'Отправлено:', failed:'Ошибка:', sendFailed:'Не удалось отправить', history:'История', noHistory:'Уведомления ещё не отправлялись', titleRequired:'Заголовок обязателен', bodyRequired:'Сообщение обязательно', noBackend:'Адрес API сервера не настроен.', noFirebase:'Firebase не подключён', phTitle:'🕌 Время намаза', phBody:'Наступило время полуденного намаза (Зухр)' },
  ar: { tokenField:'مفتاح الإرسال', tokenHint:'مفتاح المسؤول المحدد على الخادم. يُحفظ في هذا التبويب فقط.', tokenRequired:'أدخل مفتاح الإرسال', tokenWrong:'المفتاح غير صحيح — يجب أن يطابق مفتاح المسؤول على الخادم', title:'الإشعارات الفورية', sub:'إرسال إشعارات لجميع المشتركين', send:'إرسال إشعار', subscribers:'المشتركون', titleField:'العنوان', bodyField:'الرسالة', urlField:'الرابط المراد فتحه (اختياري)', priorityHigh:'الأولوية', normal:'عادية', high:'عالية', preview:'معاينة', now:'الآن', sending:'جارٍ الإرسال...', sent:'تم الإرسال إلى:', failed:'فشل:', sendFailed:'تعذّر الإرسال', history:'السجل', noHistory:'لم تُرسل أي إشعارات بعد', titleRequired:'العنوان مطلوب', bodyRequired:'الرسالة مطلوبة', noBackend:'عنوان API للخادم غير مُعدّ.', noFirebase:'Firebase غير متصل', phTitle:'🕌 وقت الصلاة', phBody:'حان وقت صلاة الظهر' },
  tr: { tokenField:'Gönderim anahtarı', tokenHint:'Sunucuda tanımlı yönetici anahtarı. Yalnızca bu sekmede saklanır.', tokenRequired:'Gönderim anahtarını girin', tokenWrong:'Anahtar yanlış — sunucudaki yönetici anahtarıyla aynı olmalı', title:'Anlık bildirimler', sub:'Tüm abonelere bildirim gönderin', send:'Bildirim gönder', subscribers:'Aboneler', titleField:'Başlık', bodyField:'Mesaj', urlField:'Açılacak adres (isteğe bağlı)', priorityHigh:'Öncelik', normal:'Normal', high:'Yüksek', preview:'Önizleme', now:'şimdi', sending:'Gönderiliyor...', sent:'Gönderildi:', failed:'Hata:', sendFailed:'Gönderilemedi', history:'Geçmiş', noHistory:'Henüz bildirim gönderilmedi', titleRequired:'Başlık gerekli', bodyRequired:'Mesaj gerekli', noBackend:'Sunucu API adresi yapılandırılmamış. .env dosyasında VITE_API_URL tanımlayın.', noFirebase:'Firebase bağlı değil', phTitle:'🕌 Namaz vakti', phBody:'Öğle namazının vakti girdi' },
}

export default function PushNotificationManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const configured = isFirebaseConfigured()

  const [tokens, setTokens] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ title:'', body:'', url:'', priority:'normal' })
  const [adminToken, setAdminToken] = useState(readStoredPushToken)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null) // { ok, text }

  useEffect(() => {
    if (!configured) return
    refresh()
  }, [])

  const refresh = async () => {
    try {
      const tks = await getAll('fcm_tokens', 'createdAt')
      setTokens(tks)
    } catch {}
    try {
      const h = await getAll('notification_history', 'createdAt')
      setHistory(h)
    } catch {}
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setFeedback(null)
    if (!form.title.trim()) { setFeedback({ ok:false, text: l.titleRequired }); return }
    if (!form.body.trim()) { setFeedback({ ok:false, text: l.bodyRequired }); return }
    if (!adminToken.trim()) { setFeedback({ ok:false, text: l.tokenRequired }); return }
    if (!API_URL) { setFeedback({ ok:false, text: l.noBackend }); return }

    setSending(true)
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken.trim() },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          url: form.url.trim() || '/',
          priority: form.priority,
        }),
      })
      const data = await res.json()
      if (res.status === 401) throw new Error(l.tokenWrong)
      if (!res.ok) throw new Error(data.error || l.sendFailed)

      // Açar doğrudur — bu sekmədə yadda saxla ki, hər dəfə yazılmasın
      try { sessionStorage.setItem(TOKEN_KEY, adminToken.trim()) } catch { /* yaddaş bağlıdır */ }

      // Tarixçəyə əlavə et
      await addDocument('notification_history', {
        title: form.title.trim(),
        body: form.body.trim(),
        url: form.url.trim() || '/',
        priority: form.priority,
        sentTo: data.successCount || 0,
        failed: data.failureCount || 0,
      })

      setFeedback({ ok:true, text: `${l.sent} ${data.successCount || 0}` })
      setForm({ title:'', body:'', url:'', priority:'normal' })
      refresh()
    } catch (e) {
      setFeedback({ ok:false, text: `${l.failed} ${e.message}` })
    }
    setSending(false)
  }

  if (!configured) {
    return (
      <AdminNotice title={l.noFirebase} />
    )
  }

  return (
    <div>
      <AdminHeader icon="bell" title={l.title} sub={l.sub} />

      {/* Stats */}
      <div className="admin-stats" data-reveal="stagger">
        <div className="admin-stat-card">
          <span className="ui-icon-tile admin-stat-icon" aria-hidden="true"><Icon name="user" /></span>
          <div className="admin-stat-num"><span key={tokens.length} data-count={tokens.length}>{tokens.length}</span></div>
          <div className="admin-stat-label">{l.subscribers}</div>
        </div>
        <div className="admin-stat-card">
          <span className="ui-icon-tile ui-icon-tile--accent admin-stat-icon" aria-hidden="true"><Icon name="send" /></span>
          <div className="admin-stat-num"><span key={history.length} data-count={history.length}>{history.length}</span></div>
          <div className="admin-stat-label">{l.history}</div>
        </div>
      </div>

      {/* Send form */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="send">{l.send}</SectionTitle>

        <form onSubmit={handleSend} className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-pushnotification-1">{l.titleField}</label>
            <input id="adm-pushnotification-1"
              type="text"
              className="admin-input"
              value={form.title}
              onChange={(e) => setForm({...form, title:e.target.value})}
              maxLength={60}
              placeholder={l.phTitle}
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-pushnotification-2">{l.bodyField}</label>
            <textarea id="adm-pushnotification-2"
              className="admin-input admin-textarea"
              value={form.body}
              onChange={(e) => setForm({...form, body:e.target.value})}
              maxLength={200}
              rows={3}
              placeholder={l.phBody}
            />
            <div className="admin-hint admin-hint--end" aria-live="polite">{form.body.length}/200</div>
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-pushnotification-3">{l.urlField}</label>
              <input id="adm-pushnotification-3"
                type="text"
                className="admin-input"
                value={form.url}
                onChange={(e) => setForm({...form, url:e.target.value})}
                placeholder="/prayer"
              />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-pushnotification-4">{l.priorityHigh}</label>
              <select id="adm-pushnotification-4"
                className="admin-input admin-select"
                value={form.priority}
                onChange={(e) => setForm({...form, priority:e.target.value})}
              >
                <option value="normal">{l.normal}</option>
                <option value="high">{l.high}</option>
              </select>
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="push-token">{l.tokenField}</label>
            <input
              id="push-token"
              type="password"
              className="admin-input"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              autoComplete="off"
              placeholder="ADMIN_TOKEN"
            />
            <div className="admin-hint"><Icon name="shield" size={14} /> {l.tokenHint}</div>
          </div>

          {/* Live preview */}
          {(form.title || form.body) && (
            <div className="admin-notif-preview">
              <BrandMark size={38} />
              <div className="admin-notif-body">
                <div className="admin-notif-app">{brandName(lang)} · {l.now}</div>
                <div className="admin-notif-title">{form.title || l.titleField}</div>
                <div className="admin-notif-text">{form.body || l.bodyField}</div>
              </div>
            </div>
          )}

          {feedback && <AdminAlert tone={feedback.ok ? 'ok' : 'bad'}>{feedback.text}</AdminAlert>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={sending || tokens.length === 0}>
              <Icon name="send" className="ui-flip-rtl" /> {sending ? l.sending : `${l.send} (${tokens.length})`}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="admin-section">
        <SectionTitle icon="list">{l.history} <span className="admin-count">({history.length})</span></SectionTitle>

        {history.length === 0 ? (
          <AdminEmpty icon="bell">{l.noHistory}</AdminEmpty>
        ) : (
          <ul className="admin-items">
            {history.slice(0, 20).map(h => (
              <li key={h.id} className="admin-item admin-item--row">
                <div className="admin-item__body">
                  <div className="admin-item__title">{h.title}</div>
                  <div className="admin-item__text">{h.body}</div>
                </div>
                <div className="admin-history-meta">
                  <div className="is-ok"><Icon name="check" size={14} /> {h.sentTo || 0}</div>
                  {h.failed > 0 && <div className="is-bad"><Icon name="close" size={14} /> {h.failed}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
