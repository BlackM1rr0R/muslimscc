import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { addAnnouncement, updateAnnouncement, deleteAnnouncement, ANNOUNCEMENT_TYPES, subscribeToAnnouncements } from '../../data/adminContent'

const LABELS = {
  az: { title:'Elanlar', sub:'Ana səhifədə görünəcək elanlar', addNew:'Yeni Elan', editItem:'Redaktə Et', all:'Bütün Elanlar', titleField:'Başlıq', message:'Mesaj', link:'Link (ixtiyari)', type:'Növ', active:'Aktiv', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hələ elan yoxdur', required:'Bu sahə tələb olunur', statusActive:'Aktiv', statusInactive:'Deaktiv' },
  en: { title:'Announcements', sub:'Banners shown on home page', addNew:'New Announcement', editItem:'Edit', all:'All Announcements', titleField:'Title', message:'Message', link:'Link (optional)', type:'Type', active:'Active', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No announcements yet', required:'Required', statusActive:'Active', statusInactive:'Inactive' },
  ru: { title:'Объявления', sub:'Баннеры на главной', addNew:'Новое', editItem:'Изменить', all:'Все', titleField:'Заголовок', message:'Сообщение', link:'Ссылка', type:'Тип', active:'Активный', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет объявлений', required:'Обязательно', statusActive:'Активный', statusInactive:'Неактивный' },
  ar: { title:'الإعلانات', sub:'إعلانات الصفحة الرئيسية', addNew:'إعلان جديد', editItem:'تعديل', all:'كل الإعلانات', titleField:'العنوان', message:'الرسالة', link:'رابط', type:'النوع', active:'نشط', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب', statusActive:'نشط', statusInactive:'غير نشط' },
  tr: { title:'Duyurular', sub:'Ana sayfa duyuruları', addNew:'Yeni Duyuru', editItem:'Düzenle', all:'Tüm Duyurular', titleField:'Başlık', message:'Mesaj', link:'Bağlantı', type:'Tip', active:'Aktif', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin?', noItems:'Duyuru yok', required:'Gerekli', statusActive:'Aktif', statusInactive:'Pasif' },
}

const LANGS = ['az','en','ru','ar','tr']
const EMPTY = {
  title: { az:'', en:'', ru:'', ar:'', tr:'' },
  message: { az:'', en:'', ru:'', ar:'', tr:'' },
  link: '',
  type: 'info',
  active: true,
}

export default function AnnouncementManager({ onUpdate }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((all) => setItems(all))
    return () => unsubscribe?.()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.az && !form.title.en) {
      setError(l.required)
      return
    }

    try {
      if (editingId) {
        await updateAnnouncement(editingId, form)
        setEditingId(null)
      } else {
        await addAnnouncement(form)
      }
      setForm(EMPTY)
      onUpdate?.()
    } catch (err) { setError(err.message) }
  }

  const handleEdit = (a) => {
    setEditingId(a.id)
    setForm({
      title: a.title || { az:'', en:'', ru:'', ar:'', tr:'' },
      message: a.message || { az:'', en:'', ru:'', ar:'', tr:'' },
      link: a.link || '',
      type: a.type || 'info',
      active: a.active !== false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm(l.confirmDelete)) {
      await deleteAnnouncement(id)
      onUpdate?.()
    }
  }

  const toggleActive = async (a) => {
    await updateAnnouncement(a.id, { active: !a.active })
    onUpdate?.()
  }

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>📣</div>
          <div className="admin-header-info">
            <h1>{l.title}</h1>
            <p>{l.sub}</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">{editingId ? '✏️' : '➕'}</span>
          {editingId ? l.editItem : l.addNew}
        </h2>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-lang-tabs">
            {LANGS.map(L => (
              <button key={L} type="button" className={`admin-lang-tab ${formLang === L ? 'active' : ''}`} onClick={() => setFormLang(L)}>
                {L.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.titleField} ({formLang.toUpperCase()})</label>
            <input type="text" className="admin-input" value={form.title[formLang]} onChange={(e) => setForm({...form, title:{...form.title, [formLang]:e.target.value}})} placeholder={l.titleField} />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.message} ({formLang.toUpperCase()})</label>
            <textarea className="admin-input admin-textarea" value={form.message[formLang]} onChange={(e) => setForm({...form, message:{...form.message, [formLang]:e.target.value}})} placeholder={l.message} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.link}</label>
              <input type="text" className="admin-input" value={form.link} onChange={(e) => setForm({...form, link:e.target.value})} placeholder="https://..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.type}</label>
              <select className="admin-input admin-select" value={form.type} onChange={(e) => setForm({...form, type:e.target.value})}>
                {ANNOUNCEMENT_TYPES.map(t => (
                  <option key={t.key} value={t.key}>{t.icon} {t.label[lang] || t.label.en}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <input
              type="checkbox"
              id="active-check"
              checked={form.active}
              onChange={(e) => setForm({...form, active:e.target.checked})}
              style={{width:20, height:20, accentColor:'var(--primary)'}}
            />
            <label htmlFor="active-check" style={{fontSize:14, fontWeight:600, color:'var(--text-dim)', cursor:'pointer'}}>
              {l.active}
            </label>
          </div>

          {error && <div className="admin-login-error">⚠️ {error}</div>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>
              <span>{editingId ? '💾' : '➕'}</span> {l.save}
            </button>
            {editingId && (
              <button type="button" className="admin-cancel-btn" onClick={() => { setEditingId(null); setForm(EMPTY); }}>{l.cancel}</button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">📣</span>
          {l.all} ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">📭</div>{l.noItems}</div>
        ) : (
          <div style={{display:'grid', gap:14}}>
            {items.map(a => {
              const type = ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0]
              return (
                <div key={a.id} style={{
                  background: a.active ? type.color + '08' : 'var(--bg-card2)',
                  border: `2px solid ${a.active ? type.color + '40' : 'var(--border)'}`,
                  borderRadius:'var(--radius-lg)',
                  padding:20,
                  opacity: a.active ? 1 : 0.6,
                  position:'relative',
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <span style={{fontSize:24}}>{type.icon}</span>
                      <span style={{background:type.color+'18', color:type.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:800, textTransform:'uppercase'}}>
                        {type.label[lang] || type.label.en}
                      </span>
                      <span style={{
                        background: a.active ? '#10b98118' : '#ef444418',
                        color: a.active ? '#10b981' : '#ef4444',
                        padding:'3px 10px',
                        borderRadius:999,
                        fontSize:10,
                        fontWeight:800,
                      }}>
                        {a.active ? '●' : '○'} {a.active ? l.statusActive : l.statusInactive}
                      </span>
                    </div>
                    <div style={{display:'flex', gap:6}}>
                      <button className="admin-action-btn" style={{flex:'0 0 auto', padding:'6px 12px', color: a.active ? '#10b981' : '#94a3b8'}} onClick={() => toggleActive(a)}>
                        {a.active ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button className="admin-action-btn edit" style={{flex:'0 0 auto', padding:'6px 12px'}} onClick={() => handleEdit(a)}>✏️</button>
                      <button className="admin-action-btn delete" style={{flex:'0 0 auto', padding:'6px 12px'}} onClick={() => handleDelete(a.id)}>🗑️</button>
                    </div>
                  </div>
                  <h3 style={{fontSize:17, fontWeight:800, color:'var(--text)', margin:'0 0 6px'}}>{a.title[lang] || a.title.en}</h3>
                  {(a.message?.[lang] || a.message?.en) && <p style={{fontSize:14, color:'var(--text-dim)', lineHeight:1.6, margin:0}}>{a.message[lang] || a.message.en}</p>}
                  {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" style={{fontSize:12, color:type.color, fontWeight:700, marginTop:10, display:'inline-block'}}>🔗 {a.link}</a>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
