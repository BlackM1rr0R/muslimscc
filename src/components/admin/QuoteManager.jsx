import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { addCustomQuote, updateCustomQuote, deleteCustomQuote, QUOTE_CATEGORIES, subscribeToQuotes } from '../../data/adminContent'

const LABELS = {
  az: { title:'Sitatlar', sub:'Sitat generatorunda istifadə olunacaq', addNew:'Yeni Sitat', editItem:'Redaktə', all:'Bütün Sitatlar', arabic:'Ərəbcə', text:'Mətn', source:'Mənbə', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hələ sitat yoxdur', required:'Mətn tələb olunur' },
  en: { title:'Quotes', sub:'Used in Quote Generator', addNew:'New Quote', editItem:'Edit', all:'All Quotes', arabic:'Arabic', text:'Text', source:'Source', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No quotes yet', required:'Text required' },
  ru: { title:'Цитаты', sub:'Используется в генераторе', addNew:'Новая цитата', editItem:'Изменить', all:'Все', arabic:'Арабский', text:'Текст', source:'Источник', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет цитат', required:'Текст обязателен' },
  ar: { title:'الاقتباسات', sub:'تستخدم في مولد الاقتباسات', addNew:'اقتباس جديد', editItem:'تعديل', all:'الكل', arabic:'العربية', text:'النص', source:'المصدر', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'النص مطلوب' },
  tr: { title:'Alıntılar', sub:'Alıntı oluşturucuda kullanılır', addNew:'Yeni Alıntı', editItem:'Düzenle', all:'Tümü', arabic:'Arapça', text:'Metin', source:'Kaynak', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin?', noItems:'Alıntı yok', required:'Metin gerekli' },
}

const LANGS = ['az','en','ru','ar','tr']
const EMPTY = { ar:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, source:'', category:'wisdom' }

export default function QuoteManager({ onUpdate }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToQuotes((all) => setItems(all))
    return () => unsubscribe?.()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.ar && !form.text.az && !form.text.en) { setError(l.required); return }
    try {
      if (editingId) {
        await updateCustomQuote(editingId, form)
        setEditingId(null)
      } else {
        await addCustomQuote(form)
      }
      setForm(EMPTY)
      onUpdate?.()
    } catch (err) { setError(err.message) }
  }

  const handleEdit = (q) => {
    setEditingId(q.id)
    setForm({ ar:q.ar||'', text:q.text||{az:'',en:'',ru:'',ar:'',tr:''}, source:q.source||'', category:q.category||'wisdom' })
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm(l.confirmDelete)) { await deleteCustomQuote(id); onUpdate?.() }
  }

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#ec4899,#db2777)'}}>💬</div>
          <div className="admin-header-info"><h1>{l.title}</h1><p>{l.sub}</p></div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">{editingId ? '✏️' : '➕'}</span>
          {editingId ? l.editItem : l.addNew}
        </h2>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label">{l.arabic}</label>
            <textarea
              className="admin-input admin-textarea"
              value={form.ar}
              onChange={(e) => setForm({...form, ar:e.target.value})}
              placeholder="..."
              style={{textAlign:'right', fontSize:18, lineHeight:1.8, fontFamily:'Amiri, serif'}}
              dir="rtl"
            />
          </div>

          <div className="admin-lang-tabs">
            {LANGS.map(L => (
              <button key={L} type="button" className={`admin-lang-tab ${formLang === L ? 'active' : ''}`} onClick={() => setFormLang(L)}>
                {L.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.text} ({formLang.toUpperCase()})</label>
            <textarea className="admin-input admin-textarea" value={form.text[formLang]} onChange={(e) => setForm({...form, text:{...form.text, [formLang]:e.target.value}})} placeholder={l.text} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.source}</label>
              <input type="text" className="admin-input" value={form.source} onChange={(e) => setForm({...form, source:e.target.value})} placeholder="Quran, Hadith, Hz. Əli..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.category}</label>
              <select className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {QUOTE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label[lang] || c.label.en}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="admin-login-error">⚠️ {error}</div>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" style={{background:'linear-gradient(135deg,#ec4899,#db2777)'}}>
              <span>{editingId ? '💾' : '➕'}</span> {l.save}
            </button>
            {editingId && <button type="button" className="admin-cancel-btn" onClick={() => { setEditingId(null); setForm(EMPTY); }}>{l.cancel}</button>}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">💬</span>
          {l.all} ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">📭</div>{l.noItems}</div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14}}>
            {items.map(q => {
              const cat = QUOTE_CATEGORIES.find(c => c.key === q.category)
              return (
                <div key={q.id} style={{background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:18, borderLeft:`4px solid ${cat?.color}`}}>
                  <span style={{background:cat?.color+'18', color:cat?.color, padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:800, textTransform:'uppercase'}}>
                    {cat?.label[lang] || cat?.label.en}
                  </span>
                  {q.ar && <div style={{fontSize:16, lineHeight:1.8, textAlign:'right', color:'var(--text)', margin:'10px 0', fontFamily:'Amiri, serif'}}>{q.ar}</div>}
                  {(q.text?.[lang] || q.text?.en) && <div style={{fontSize:13, color:'var(--text-dim)', fontStyle:'italic', marginBottom:8}}>"{q.text[lang] || q.text.en}"</div>}
                  {q.source && <div style={{fontSize:11, color:cat?.color, fontWeight:700}}>— {q.source}</div>}
                  <div style={{display:'flex', gap:6, marginTop:10}}>
                    <button className="admin-action-btn edit" onClick={() => handleEdit(q)}>✏️ {l.edit}</button>
                    <button className="admin-action-btn delete" onClick={() => handleDelete(q.id)}>🗑️ {l.delete}</button>
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
