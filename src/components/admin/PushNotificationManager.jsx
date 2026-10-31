import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle, AdminAlert, AdminEmpty } from './AdminUi'
import Icon, { BrandMark } from '../Icon'
import { brandName } from '../../config/brand'
import { getAll } from '../../api/content'
import { apiFetch, ApiError } from '../../api/http'

// Server API-si admini sessiya cookie-si ilə tanıyır (eyni origin, /api/...).
// Tarixçəni server özü yazır (notification_history) — klient yazmır.

const LABELS = {
  az: { authWrong:'Sessiya bitib və ya admin icazəsi yoxdur — çıxıb yenidən daxil olun', title:'Anlıq bildirişlər', sub:'Bütün abunəçilərə bildiriş göndərin', send:'Bildiriş göndər', subscribers:'Abunəçi sayı', titleField:'Başlıq', bodyField:'Mesaj', urlField:'Açılacaq ünvan (istəyə bağlı)', priorityHigh:'Prioritet', normal:'Adi', high:'Yüksək', preview:'Önbaxış', now:'indi', sending:'Göndərilir...', sent:'Göndərildi:', failed:'Xəta:', sendFailed:'Göndərmək alınmadı', history:'Tarixçə', noHistory:'Hələ bildiriş göndərilməyib', titleRequired:'Başlıq tələb olunur', bodyRequired:'Mesaj tələb olunur', phTitle:'🕌 Namaz vaxtı', phBody:'Zöhr namazının vaxtı çatdı' },
  en: { authWrong:'Session expired or no admin access — sign out and sign in again', title:'Push notifications', sub:'Send notifications to all subscribers', send:'Send notification', subscribers:'Subscribers', titleField:'Title', bodyField:'Message', urlField:'URL to open (optional)', priorityHigh:'Priority', normal:'Normal', high:'High', preview:'Preview', now:'now', sending:'Sending...', sent:'Sent to:', failed:'Failed:', sendFailed:'Sending failed', history:'History', noHistory:'No notifications sent yet', titleRequired:'Title required', bodyRequired:'Message required', phTitle:'🕌 Prayer time', phBody:'It is time for the Dhuhr prayer' },
  ru: { authWrong:'Сессия истекла или нет прав администратора — выйдите и войдите снова', title:'Мгновенные уведомления', sub:'Отправить уведомления всем подписчикам', send:'Отправить уведомление', subscribers:'Подписчики', titleField:'Заголовок', bodyField:'Сообщение', urlField:'Открываемый адрес (необязательно)', priorityHigh:'Приоритет', normal:'Обычный', high:'Высокий', preview:'Предпросмотр', now:'сейчас', sending:'Отправка...', sent:'Отправлено:', failed:'Ошибка:', sendFailed:'Не удалось отправить', history:'История', noHistory:'Уведомления ещё не отправлялись', titleRequired:'Заголовок обязателен', bodyRequired:'Сообщение обязательно', phTitle:'🕌 Время намаза', phBody:'Наступило время полуденного намаза (Зухр)' },
  ar: { authWrong:'انتهت الجلسة أو لا توجد صلاحية إدارة — سجّل الخروج ثم ادخل مجددًا', title:'الإشعارات الفورية', sub:'إرسال إشعارات لجميع المشتركين', send:'إرسال إشعار', subscribers:'المشتركون', titleField:'العنوان', bodyField:'الرسالة', urlField:'الرابط المراد فتحه (اختياري)', priorityHigh:'الأولوية', normal:'عادية', high:'عالية', preview:'معاينة', now:'الآن', sending:'جارٍ الإرسال...', sent:'تم الإرسال إلى:', failed:'فشل:', sendFailed:'تعذّر الإرسال', history:'السجل', noHistory:'لم تُرسل أي إشعارات بعد', titleRequired:'العنوان مطلوب', bodyRequired:'الرسالة مطلوبة', phTitle:'🕌 وقت الصلاة', phBody:'حان وقت صلاة الظهر' },
  tr: { authWrong:'Oturum sona erdi veya yönetici yetkisi yok — çıkış yapıp yeniden giriş yapın', title:'Anlık bildirimler', sub:'Tüm abonelere bildirim gönderin', send:'Bildirim gönder', subscribers:'Aboneler', titleField:'Başlık', bodyField:'Mesaj', urlField:'Açılacak adres (isteğe bağlı)', priorityHigh:'Öncelik', normal:'Normal', high:'Yüksek', preview:'Önizleme', now:'şimdi', sending:'Gönderiliyor...', sent:'Gönderildi:', failed:'Hata:', sendFailed:'Gönderilemedi', history:'Geçmiş', noHistory:'Henüz bildirim gönderilmedi', titleRequired:'Başlık gerekli', bodyRequired:'Mesaj gerekli', phTitle:'🕌 Namaz vakti', phBody:'Öğle namazının vakti girdi' },
}

export default function PushNotificationManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ title:'', body:'', url:'', priority:'normal' })
  const [subscribers, setSubscribers] = useState(null)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null) // { ok, text }

  useEffect(() => {
    refresh()
  }, [])

  const refresh = async () => {
    // Abunəçi sayı serverdən (Web Push + keçid dövründə FCM)
    try {
      const data = await apiFetch('/api/admin/subscribers', { admin: true })
      setSubscribers(Number(data?.count) || 0)
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

    setSending(true)
    try {
      let data
      try {
        data = await apiFetch('/api/send-notification', {
          method: 'POST',
          admin: true,
          body: {
            title: form.title.trim(),
            body: form.body.trim(),
            url: form.url.trim() || '/',
            priority: form.priority,
          },
        })
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) throw new Error(l.authWrong)
        throw new Error(err instanceof ApiError ? (err.body?.error || l.sendFailed) : l.sendFailed)
      }

      setFeedback({ ok:true, text: `${l.sent} ${data.successCount || 0}` })
      setForm({ title:'', body:'', url:'', priority:'normal' })
      refresh()
    } catch (e) {
      setFeedback({ ok:false, text: `${l.failed} ${e.message}` })
    }
    setSending(false)
  }

  return (
    <div>
      <AdminHeader icon="bell" title={l.title} sub={l.sub} />

      {/* Stats */}
      <div className="admin-stats" data-reveal="stagger">
        <div className="admin-stat-card">
          <span className="ui-icon-tile admin-stat-icon" aria-hidden="true"><Icon name="user" /></span>
          <div className="admin-stat-num">{subscribers == null ? '—' : <span key={subscribers} data-count={subscribers}>{subscribers}</span>}</div>
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
            <button type="submit" className="admin-submit-btn" disabled={sending || subscribers === 0}>
              <Icon name="send" className="ui-flip-rtl" /> {sending ? l.sending : (subscribers == null ? l.send : `${l.send} (${subscribers})`)}
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
