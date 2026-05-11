import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { getAll, addDocument, COLLECTIONS } from '../../firebase/firestore'
import { isFirebaseConfigured } from '../../firebase/config'

const API_URL = import.meta.env.VITE_API_URL || ''

const LABELS = {
  az: { title:'Push Bildirişlər', sub:'Bütün abunəçilərə bildiriş göndərin', send:'Bildiriş Göndər', subscribers:'Abunəçi sayı', titleField:'Başlıq', bodyField:'Mesaj', urlField:'Açılacaq URL (opsional)', priorityHigh:'Yüksək prioritet', preview:'Önizləmə', sending:'Göndərilir...', sent:'Göndərildi:', failed:'Xəta:', history:'Tarixçə', noHistory:'Hələ bildiriş göndərilməyib', titleRequired:'Başlıq tələb olunur', bodyRequired:'Mesaj tələb olunur', noBackend:'Backend API qoşulmayıb. .env-də VITE_API_URL təyin edin.' },
  en: { title:'Push Notifications', sub:'Send notifications to all subscribers', send:'Send Notification', subscribers:'Subscribers', titleField:'Title', bodyField:'Message', urlField:'URL to open (optional)', priorityHigh:'High priority', preview:'Preview', sending:'Sending...', sent:'Sent to:', failed:'Failed:', history:'History', noHistory:'No notifications sent yet', titleRequired:'Title required', bodyRequired:'Message required', noBackend:'Backend API not configured. Set VITE_API_URL in .env.' },
  ru: { title:'Push уведомления', sub:'Отправить уведомления всем подписчикам', send:'Отправить', subscribers:'Подписчики', titleField:'Заголовок', bodyField:'Сообщение', urlField:'URL для открытия', priorityHigh:'Высокий приоритет', preview:'Превью', sending:'Отправка...', sent:'Отправлено:', failed:'Ошибка:', history:'История', noHistory:'Нет уведомлений', titleRequired:'Заголовок обязателен', bodyRequired:'Сообщение обязательно', noBackend:'Backend API не настроен' },
  ar: { title:'إشعارات Push', sub:'إرسال إشعارات لجميع المشتركين', send:'إرسال', subscribers:'المشتركون', titleField:'العنوان', bodyField:'الرسالة', urlField:'الرابط', priorityHigh:'أولوية عالية', preview:'معاينة', sending:'جارٍ الإرسال...', sent:'تم الإرسال إلى:', failed:'فشل:', history:'السجل', noHistory:'لا توجد إشعارات', titleRequired:'العنوان مطلوب', bodyRequired:'الرسالة مطلوبة', noBackend:'Backend API غير مكون' },
  tr: { title:'Push Bildirimler', sub:'Tüm abonelere bildirim gönder', send:'Bildirim Gönder', subscribers:'Aboneler', titleField:'Başlık', bodyField:'Mesaj', urlField:'Açılacak URL', priorityHigh:'Yüksek öncelik', preview:'Önizleme', sending:'Gönderiliyor...', sent:'Gönderildi:', failed:'Hata:', history:'Geçmiş', noHistory:'Henüz bildirim yok', titleRequired:'Başlık gerekli', bodyRequired:'Mesaj gerekli', noBackend:'Backend API yapılandırılmamış' },
}

export default function PushNotificationManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const configured = isFirebaseConfigured()

  const [tokens, setTokens] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ title:'', body:'', url:'', priority:'normal' })
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
    if (!API_URL) { setFeedback({ ok:false, text: l.noBackend }); return }

    setSending(true)
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          url: form.url.trim() || '/',
          priority: form.priority,
          adminToken: import.meta.env.VITE_ADMIN_TOKEN || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')

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
      <div className="admin-section">
        <div style={{padding:40, textAlign:'center'}}>
          <div style={{fontSize:48, marginBottom:12}}>⚠️</div>
          <h3 style={{color:'#ef4444'}}>Firebase qoşulmayıb</h3>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#f43f5e,#be123c)'}}>🔔</div>
          <div className="admin-header-info">
            <h1>{l.title}</h1>
            <p>{l.sub}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card" style={{'--accent':'#f43f5e', '--accent-bg':'#f43f5e15'}}>
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-num">{tokens.length}</div>
          <div className="admin-stat-label">{l.subscribers}</div>
        </div>
        <div className="admin-stat-card" style={{'--accent':'#3b82f6', '--accent-bg':'#3b82f615'}}>
          <div className="admin-stat-icon">📤</div>
          <div className="admin-stat-num">{history.length}</div>
          <div className="admin-stat-label">{l.history}</div>
        </div>
      </div>

      {/* Send form */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">📤</span>
          {l.send}
        </h2>

        <form onSubmit={handleSend} className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label">{l.titleField}</label>
            <input
              type="text"
              className="admin-input"
              value={form.title}
              onChange={(e) => setForm({...form, title:e.target.value})}
              maxLength={60}
              placeholder="🕌 Namaz vaxtı"
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.bodyField}</label>
            <textarea
              className="admin-input admin-textarea"
              value={form.body}
              onChange={(e) => setForm({...form, body:e.target.value})}
              maxLength={200}
              rows={3}
              placeholder="Zöhr namazının vaxtı çatdı"
            />
            <div style={{fontSize:11, color:'var(--text-muted)', marginTop:4}}>{form.body.length}/200</div>
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.urlField}</label>
              <input
                type="text"
                className="admin-input"
                value={form.url}
                onChange={(e) => setForm({...form, url:e.target.value})}
                placeholder="/prayer"
              />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.priorityHigh}</label>
              <select
                className="admin-input admin-select"
                value={form.priority}
                onChange={(e) => setForm({...form, priority:e.target.value})}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Live preview */}
          {(form.title || form.body) && (
            <div style={{
              background:'var(--bg-soft, #f8fafc)',
              border:'1px solid var(--border)',
              borderRadius:12, padding:12,
              display:'flex', gap:12, alignItems:'flex-start',
            }}>
              <div style={{
                width:38, height:38, borderRadius:10,
                background:'linear-gradient(135deg, #1a6b3a, #10b981)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, flexShrink:0,
              }}>🌙</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:2, fontWeight:700}}>muslims.cc · indi</div>
                <div style={{fontSize:14, fontWeight:800, color:'var(--text)'}}>{form.title || l.titleField}</div>
                <div style={{fontSize:13, color:'var(--text-muted)', marginTop:2, lineHeight:1.4}}>{form.body || l.bodyField}</div>
              </div>
            </div>
          )}

          {feedback && (
            <div style={{
              padding:'10px 14px', borderRadius:10,
              background: feedback.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: feedback.ok ? '#059669' : '#dc2626',
              fontSize:13, fontWeight:700,
            }}>
              {feedback.ok ? '✅' : '⚠️'} {feedback.text}
            </div>
          )}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={sending || tokens.length === 0}>
              <span>📤</span> {sending ? l.sending : `${l.send} (${tokens.length})`}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">📋</span>
          {l.history} ({history.length})
        </h2>

        {history.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📭</div>
            {l.noHistory}
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {history.slice(0, 20).map(h => (
              <div key={h.id} style={{
                background:'var(--bg-card, #fff)',
                border:'1px solid var(--border)',
                borderRadius:12, padding:'12px 14px',
              }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10}}>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:14, fontWeight:800, color:'var(--text)'}}>{h.title}</div>
                    <div style={{fontSize:13, color:'var(--text-muted)', marginTop:2}}>{h.body}</div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0}}>
                    <div style={{fontSize:12, fontWeight:700, color:'#059669'}}>✓ {h.sentTo || 0}</div>
                    {h.failed > 0 && <div style={{fontSize:11, color:'#dc2626'}}>✗ {h.failed}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
