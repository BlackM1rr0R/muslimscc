import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { EVENT_ICON, AdminHeader, SectionTitle, AdminEmpty, LangTabs, AdminAlert } from './AdminUi'
import { AdminText, adminPick } from './adminText'
import { addCustomEvent, updateCustomEvent, deleteCustomEvent, EVENT_TYPES, HIJRI_MONTHS, subscribeToEvents } from '../../data/adminContent'

const LABELS = {
  az: { title:'İslami hadisələr', sub:'Təqvimdə göstəriləcək tarixlər', addNew:'Yeni hadisə', editItem:'Redaktə', all:'Bütün hadisələr', name:'Ad', desc:'Təsvir', month:'Ay', day:'Gün', type:'Növ', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hadisə yoxdur', required:'Bu sahə tələb olunur' },
  en: { title:'Islamic Events', sub:'Dates shown in calendar', addNew:'New Event', editItem:'Edit', all:'All Events', name:'Name', desc:'Description', month:'Month', day:'Day', type:'Type', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No events yet', required:'Required' },
  ru: { title:'Исламские События', sub:'Даты в календаре', addNew:'Новое', editItem:'Изменить', all:'Все', name:'Название', desc:'Описание', month:'Месяц', day:'День', type:'Тип', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет событий', required:'Обязательно' },
  ar: { title:'الأحداث الإسلامية', sub:'التواريخ في التقويم', addNew:'حدث جديد', editItem:'تعديل', all:'الكل', name:'الاسم', desc:'الوصف', month:'الشهر', day:'اليوم', type:'النوع', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب' },
  tr: { title:'İslami Olaylar', sub:'Takvimdeki tarihler', addNew:'Yeni Olay', editItem:'Düzenle', all:'Tümü', name:'Ad', desc:'Açıklama', month:'Ay', day:'Gün', type:'Tip', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin?', noItems:'Olay yok', required:'Gerekli' },
}

const EMPTY = { name:{az:'',en:'',ru:'',ar:'',tr:''}, desc:{az:'',en:'',ru:'',ar:'',tr:''}, month:1, day:1, type:'major' }

export default function EventManager({ onUpdate }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToEvents((all) => setItems(all))
    return () => unsubscribe?.()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.az && !form.name.en) { setError(l.required); return }
    try {
      if (editingId) {
        await updateCustomEvent(editingId, form)
        setEditingId(null)
      } else {
        await addCustomEvent(form)
      }
      setForm(EMPTY)
      onUpdate?.()
    } catch (err) { setError(err.message) }
  }

  const handleEdit = (ev) => {
    setEditingId(ev.id)
    setForm({
      name: ev.name || {az:'',en:'',ru:'',ar:'',tr:''},
      desc: ev.desc || {az:'',en:'',ru:'',ar:'',tr:''},
      month: ev.month || 1,
      day: ev.day || 1,
      type: ev.type || 'major',
    })
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm(l.confirmDelete)) { await deleteCustomEvent(id); onUpdate?.() }
  }

  // Sort by month, then day
  const sorted = [...items].sort((a, b) => (a.month - b.month) || (a.day - b.day))

  return (
    <div>
      <AdminHeader icon="calendar" title={l.title} sub={l.sub} />

      <div className="admin-section" data-reveal>
        <SectionTitle icon={editingId ? 'edit' : 'plus'}>{editingId ? l.editItem : l.addNew}</SectionTitle>

        <form onSubmit={handleSubmit} className="admin-form">
          <LangTabs value={formLang} onChange={setFormLang} />

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-event-1">{l.name} ({formLang.toUpperCase()})</label>
            <input id="adm-event-1" type="text" className="admin-input" value={form.name[formLang]} onChange={(e) => setForm({...form, name:{...form.name, [formLang]:e.target.value}})} placeholder={l.name} />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-event-2">{l.desc} ({formLang.toUpperCase()})</label>
            <textarea id="adm-event-2" className="admin-input admin-textarea" value={form.desc[formLang]} onChange={(e) => setForm({...form, desc:{...form.desc, [formLang]:e.target.value}})} placeholder={l.desc} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-event-3">{l.month}</label>
              <select id="adm-event-3" className="admin-input admin-select" value={form.month} onChange={(e) => setForm({...form, month:parseInt(e.target.value)})}>
                {HIJRI_MONTHS.map(m => (
                  <option key={m.num} value={m.num}>{m.num}. {m[lang]}</option>
                ))}
              </select>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-event-4">{l.day}</label>
              <input id="adm-event-4" type="number" className="admin-input" value={form.day} onChange={(e) => setForm({...form, day:parseInt(e.target.value) || 1})} min="1" max="30" />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-event-5">{l.type}</label>
              <select id="adm-event-5" className="admin-input admin-select" value={form.type} onChange={(e) => setForm({...form, type:e.target.value})}>
                {EVENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label[lang]}</option>)}
              </select>
            </div>
          </div>

          {error && <AdminAlert tone="bad">{error}</AdminAlert>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn">
              <Icon name={editingId ? 'check' : 'plus'} /> {l.save}
            </button>
            {editingId && <button type="button" className="admin-cancel-btn" onClick={() => { setEditingId(null); setForm(EMPTY); }}>{l.cancel}</button>}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <SectionTitle icon="calendar">{l.all} <span className="admin-count">({sorted.length})</span></SectionTitle>

        {sorted.length === 0 ? (
          <AdminEmpty>{l.noItems}</AdminEmpty>
        ) : (
          <ul className="admin-items">
            {sorted.map(ev => {
              const type = EVENT_TYPES.find(t => t.key === ev.type) || EVENT_TYPES[0]
              const month = HIJRI_MONTHS.find(m => m.num === ev.month)
              return (
                <li key={ev.id} className="admin-item admin-item--row">
                  <div className="admin-date-tile">
                    <b>{ev.day}</b>
                    <span>{month?.[lang]}</span>
                  </div>
                  <div className="admin-item__body">
                    <strong className="admin-item__title"><AdminText value={ev.name} lang={lang} /></strong>
                    <span className="ui-badge admin-tone admin-item__type"><Icon name={EVENT_ICON[type.key] || 'calendar'} /> {type.label[lang]}</span>
                    {adminPick(ev.desc, lang) && <p className="admin-item__text">{adminPick(ev.desc, lang)}</p>}
                  </div>
                  <div className="admin-item__actions">
                    <button type="button" className="admin-action-btn admin-action-btn--icon edit" onClick={() => handleEdit(ev)} title={l.edit} aria-label={l.edit}><Icon name="edit" /></button>
                    <button type="button" className="admin-action-btn admin-action-btn--icon delete" onClick={() => handleDelete(ev.id)} title={l.delete} aria-label={l.delete}><Icon name="trash" /></button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
