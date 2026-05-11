import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { addCustomEvent, updateCustomEvent, deleteCustomEvent, EVENT_TYPES, HIJRI_MONTHS, subscribeToEvents } from '../../data/adminContent'

const LABELS = {
  az: { title:'İslami Hadisələr', sub:'Təqvimdə göstəriləcək tarixlər', addNew:'Yeni Hadisə', editItem:'Redaktə', all:'Bütün Hadisələr', name:'Ad', desc:'Təsvir', month:'Ay', day:'Gün', type:'Növ', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hadisə yoxdur', required:'Bu sahə tələb olunur' },
  en: { title:'Islamic Events', sub:'Dates shown in calendar', addNew:'New Event', editItem:'Edit', all:'All Events', name:'Name', desc:'Description', month:'Month', day:'Day', type:'Type', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No events yet', required:'Required' },
  ru: { title:'Исламские События', sub:'Даты в календаре', addNew:'Новое', editItem:'Изменить', all:'Все', name:'Название', desc:'Описание', month:'Месяц', day:'День', type:'Тип', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет событий', required:'Обязательно' },
  ar: { title:'الأحداث الإسلامية', sub:'التواريخ في التقويم', addNew:'حدث جديد', editItem:'تعديل', all:'الكل', name:'الاسم', desc:'الوصف', month:'الشهر', day:'اليوم', type:'النوع', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب' },
  tr: { title:'İslami Olaylar', sub:'Takvimdeki tarihler', addNew:'Yeni Olay', editItem:'Düzenle', all:'Tümü', name:'Ad', desc:'Açıklama', month:'Ay', day:'Gün', type:'Tip', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin?', noItems:'Olay yok', required:'Gerekli' },
}

const LANGS = ['az','en','ru','ar','tr']
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
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#6366f1,#4338ca)'}}>📅</div>
          <div className="admin-header-info"><h1>{l.title}</h1><p>{l.sub}</p></div>
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
            <label className="admin-input-label">{l.name} ({formLang.toUpperCase()})</label>
            <input type="text" className="admin-input" value={form.name[formLang]} onChange={(e) => setForm({...form, name:{...form.name, [formLang]:e.target.value}})} placeholder={l.name} />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.desc} ({formLang.toUpperCase()})</label>
            <textarea className="admin-input admin-textarea" value={form.desc[formLang]} onChange={(e) => setForm({...form, desc:{...form.desc, [formLang]:e.target.value}})} placeholder={l.desc} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.month}</label>
              <select className="admin-input admin-select" value={form.month} onChange={(e) => setForm({...form, month:parseInt(e.target.value)})}>
                {HIJRI_MONTHS.map(m => (
                  <option key={m.num} value={m.num}>{m.num}. {m[lang] || m.en}</option>
                ))}
              </select>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.day}</label>
              <input type="number" className="admin-input" value={form.day} onChange={(e) => setForm({...form, day:parseInt(e.target.value) || 1})} min="1" max="30" />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.type}</label>
              <select className="admin-input admin-select" value={form.type} onChange={(e) => setForm({...form, type:e.target.value})}>
                {EVENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label[lang] || t.label.en}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="admin-login-error">⚠️ {error}</div>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" style={{background:'linear-gradient(135deg,#6366f1,#4338ca)'}}>
              <span>{editingId ? '💾' : '➕'}</span> {l.save}
            </button>
            {editingId && <button type="button" className="admin-cancel-btn" onClick={() => { setEditingId(null); setForm(EMPTY); }}>{l.cancel}</button>}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">📅</span>
          {l.all} ({sorted.length})
        </h2>

        {sorted.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">📭</div>{l.noItems}</div>
        ) : (
          <div style={{display:'grid', gap:10}}>
            {sorted.map(ev => {
              const type = EVENT_TYPES.find(t => t.key === ev.type) || EVENT_TYPES[0]
              const month = HIJRI_MONTHS.find(m => m.num === ev.month)
              return (
                <div key={ev.id} style={{background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, display:'flex', alignItems:'center', gap:14, borderLeft:`4px solid ${type.color}`}}>
                  <div style={{minWidth:60, textAlign:'center', background:type.color+'18', padding:'10px', borderRadius:10}}>
                    <div style={{fontSize:11, fontWeight:800, color:type.color, textTransform:'uppercase'}}>{month?.[lang] || month?.en}</div>
                    <div style={{fontSize:24, fontWeight:800, color:type.color, lineHeight:1}}>{ev.day}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                      <span>{type.icon}</span>
                      <strong style={{fontSize:15, color:'var(--text)'}}>{ev.name[lang] || ev.name.en}</strong>
                    </div>
                    {(ev.desc?.[lang] || ev.desc?.en) && <div style={{fontSize:12, color:'var(--text-dim)'}}>{ev.desc[lang] || ev.desc.en}</div>}
                  </div>
                  <div style={{display:'flex', gap:6}}>
                    <button className="admin-action-btn edit" style={{flex:'0 0 auto', padding:'6px 10px'}} onClick={() => handleEdit(ev)}>✏️</button>
                    <button className="admin-action-btn delete" style={{flex:'0 0 auto', padding:'6px 10px'}} onClick={() => handleDelete(ev.id)}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
