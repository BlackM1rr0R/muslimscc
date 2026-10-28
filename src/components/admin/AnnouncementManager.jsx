import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { ANN_TONE, AdminHeader, SectionTitle, AdminEmpty, LangTabs, AdminAlert } from './AdminUi'
import { AdminText, adminPick } from './adminText'
import { addAnnouncement, updateAnnouncement, deleteAnnouncement, ANNOUNCEMENT_TYPES, subscribeToAnnouncements } from '../../data/adminContent'

const LABELS = {
  az: { title:'Elanlar', sub:'Ana səhifədə görünəcək elanlar', addNew:'Yeni elan', editItem:'Redaktə et', all:'Bütün elanlar', titleField:'Başlıq', message:'Mesaj', link:'Link (ixtiyari)', type:'Növ', active:'Aktiv', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hələ elan yoxdur', required:'Bu sahə tələb olunur', statusActive:'Aktiv', statusInactive:'Deaktiv' },
  en: { title:'Announcements', sub:'Banners shown on home page', addNew:'New Announcement', editItem:'Edit', all:'All Announcements', titleField:'Title', message:'Message', link:'Link (optional)', type:'Type', active:'Active', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No announcements yet', required:'Required', statusActive:'Active', statusInactive:'Inactive' },
  ru: { title:'Объявления', sub:'Баннеры на главной', addNew:'Новое', editItem:'Изменить', all:'Все', titleField:'Заголовок', message:'Сообщение', link:'Ссылка', type:'Тип', active:'Активный', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет объявлений', required:'Обязательно', statusActive:'Активный', statusInactive:'Неактивный' },
  ar: { title:'الإعلانات', sub:'إعلانات الصفحة الرئيسية', addNew:'إعلان جديد', editItem:'تعديل', all:'كل الإعلانات', titleField:'العنوان', message:'الرسالة', link:'رابط', type:'النوع', active:'نشط', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب', statusActive:'نشط', statusInactive:'غير نشط' },
  tr: { title:'Duyurular', sub:'Ana sayfa duyuruları', addNew:'Yeni Duyuru', editItem:'Düzenle', all:'Tüm Duyurular', titleField:'Başlık', message:'Mesaj', link:'Bağlantı', type:'Tip', active:'Aktif', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin?', noItems:'Duyuru yok', required:'Gerekli', statusActive:'Aktif', statusInactive:'Pasif' },
}

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
      <AdminHeader icon="announcements" title={l.title} sub={l.sub} />

      <div className="admin-section" data-reveal>
        <SectionTitle icon={editingId ? 'duajournal' : 'plus'}>{editingId ? l.editItem : l.addNew}</SectionTitle>

        <form onSubmit={handleSubmit} className="admin-form">
          <LangTabs value={formLang} onChange={setFormLang} />

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
                  <option key={t.key} value={t.key}>{t.label[lang]}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="admin-check" htmlFor="active-check">
            <input
              type="checkbox"
              id="active-check"
              checked={form.active}
              onChange={(e) => setForm({...form, active:e.target.checked})}
            />
            {l.active}
          </label>

          {error && <AdminAlert tone="bad">{error}</AdminAlert>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn">
              <Icon name={editingId ? 'check' : 'plus'} /> {l.save}
            </button>
            {editingId && (
              <button type="button" className="admin-cancel-btn" onClick={() => { setEditingId(null); setForm(EMPTY); }}>{l.cancel}</button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <SectionTitle icon="announcements">{l.all} <span className="admin-count">({items.length})</span></SectionTitle>

        {items.length === 0 ? (
          <AdminEmpty>{l.noItems}</AdminEmpty>
        ) : (
          <ul className="admin-items">
            {items.map(a => {
              const type = ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0]
              const tone = ANN_TONE[type.key] || ANN_TONE.info
              return (
                <li key={a.id} className={`admin-item${a.active ? '' : ' is-muted'}`}>
                  <div className="admin-item__head">
                    <div className="admin-item__tags">
                      <span className={`ui-badge admin-tone admin-tone--${tone.tone}`}><Icon name={tone.icon} /> {type.label[lang]}</span>
                      <span className={`ui-badge admin-tone ${a.active ? 'admin-tone--ok' : ''}`}>
                        <Icon name={a.active ? 'eye' : 'close'} /> {a.active ? l.statusActive : l.statusInactive}
                      </span>
                    </div>
                    <div className="admin-item__actions">
                      {/* Görünmə açarı: basılı = aktiv (ana səhifədə görünür) */}
                      <button type="button" className={`admin-action-btn admin-action-btn--icon${a.active ? ' is-on' : ''}`} onClick={() => toggleActive(a)} title={l.active} aria-label={l.active} aria-pressed={!!a.active}>
                        <Icon name={a.active ? 'eye' : 'close'} />
                      </button>
                      <button type="button" className="admin-action-btn admin-action-btn--icon edit" onClick={() => handleEdit(a)} title={l.edit} aria-label={l.edit}><Icon name="duajournal" /></button>
                      <button type="button" className="admin-action-btn admin-action-btn--icon delete" onClick={() => handleDelete(a.id)} title={l.delete} aria-label={l.delete}><Icon name="trash" /></button>
                    </div>
                  </div>
                  <h3 className="admin-item__title"><AdminText value={a.title} lang={lang} /></h3>
                  {adminPick(a.message, lang) && <p className="admin-item__text">{adminPick(a.message, lang)}</p>}
                  {a.link && <a className="admin-item__link" href={a.link} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} /> {a.link}</a>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
