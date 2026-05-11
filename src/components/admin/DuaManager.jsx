import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { addCustomDua, updateCustomDua, deleteCustomDua, CUSTOM_DUA_CATS, subscribeToDuas } from '../../data/adminContent'

const LABELS = {
  az: { title:'Dualar', sub:'Dua kontenti idarə edin', addNew:'Yeni Dua', editItem:'Redaktə Et', all:'Bütün Dualar', arabicText:'Ərəbcə', translit:'Transliterasiya', translation:'Tərcümə', source:'Mənbə', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hələ dua yoxdur', required:'Bu sahə tələb olunur' },
  en: { title:'Duas', sub:'Manage duas', addNew:'New Dua', editItem:'Edit', all:'All Duas', arabicText:'Arabic', translit:'Transliteration', translation:'Translation', source:'Source', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No duas yet', required:'Required' },
  ru: { title:'Дуа', sub:'Управление дуа', addNew:'Новая Дуа', editItem:'Изменить', all:'Все дуа', arabicText:'Арабский', translit:'Транслитерация', translation:'Перевод', source:'Источник', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет дуа', required:'Обязательно' },
  ar: { title:'الأدعية', sub:'إدارة الأدعية', addNew:'دعاء جديد', editItem:'تعديل', all:'كل الأدعية', arabicText:'العربية', translit:'النطق', translation:'الترجمة', source:'المصدر', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب' },
  tr: { title:'Dualar', sub:'Dua yönetimi', addNew:'Yeni Dua', editItem:'Düzenle', all:'Tüm Dualar', arabicText:'Arapça', translit:'Okunuş', translation:'Çeviri', source:'Kaynak', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noItems:'Dua yok', required:'Gerekli' },
}

const LANGS = ['az','en','ru','ar','tr']
const EMPTY = {
  ar: '',
  translit: '',
  text: { az:'', en:'', ru:'', ar:'', tr:'' },
  source: '',
  category: 'general',
}

export default function DuaManager({ onUpdate }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToDuas((all) => setItems(all))
    return () => unsubscribe?.()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.ar && !form.text.az && !form.text.en) {
      setError(l.required)
      return
    }

    try {
      if (editingId) {
        await updateCustomDua(editingId, form)
        setEditingId(null)
      } else {
        await addCustomDua(form)
      }
      setForm(EMPTY)
      onUpdate?.()
    } catch (err) { setError(err.message) }
  }

  const handleEdit = (d) => {
    setEditingId(d.id)
    setForm({
      ar: d.ar || '',
      translit: d.translit || '',
      text: d.text || { az:'', en:'', ru:'', ar:'', tr:'' },
      source: d.source || '',
      category: d.category || 'general',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm(l.confirmDelete)) {
      await deleteCustomDua(id)
      onUpdate?.()
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)'}}>🤲</div>
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
          <div className="admin-input-group">
            <label className="admin-input-label">{l.arabicText}</label>
            <textarea
              className="admin-input admin-textarea"
              value={form.ar}
              onChange={(e) => setForm({...form, ar:e.target.value})}
              placeholder="رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً..."
              style={{textAlign:'right', fontSize:18, lineHeight:1.8, fontFamily:'Amiri, serif'}}
              dir="rtl"
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.translit}</label>
            <input type="text" className="admin-input" value={form.translit} onChange={(e) => setForm({...form, translit:e.target.value})} placeholder="Rabbana atina fi'd-dunya..." />
          </div>

          <div className="admin-lang-tabs">
            {LANGS.map(L => (
              <button key={L} type="button" className={`admin-lang-tab ${formLang === L ? 'active' : ''}`} onClick={() => setFormLang(L)}>
                {L.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea className="admin-input admin-textarea" value={form.text[formLang]} onChange={(e) => setForm({...form, text:{...form.text, [formLang]:e.target.value}})} placeholder={l.translation} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.source}</label>
              <input type="text" className="admin-input" value={form.source} onChange={(e) => setForm({...form, source:e.target.value})} placeholder="Bəqərə 201..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.category}</label>
              <select className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {CUSTOM_DUA_CATS.map(c => (
                  <option key={c.key} value={c.key}>{c.label[lang] || c.label.en}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="admin-login-error">⚠️ {error}</div>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)'}}>
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
          <span className="admin-section-title-icon">🤲</span>
          {l.all} ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">📭</div>{l.noItems}</div>
        ) : (
          <div style={{display:'grid', gap:14}}>
            {items.map(d => {
              const cat = CUSTOM_DUA_CATS.find(c => c.key === d.category)
              return (
                <div key={d.id} style={{
                  background:'var(--bg-card2)',
                  border:'1px solid var(--border)',
                  borderRadius:'var(--radius-lg)',
                  padding:20,
                  borderLeft:`4px solid ${cat?.color || '#8b5cf6'}`,
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
                    <span style={{background:cat?.color+'18', color:cat?.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:800, textTransform:'uppercase'}}>
                      {cat?.label[lang] || cat?.label.en || d.category}
                    </span>
                    <div style={{display:'flex', gap:6}}>
                      <button className="admin-action-btn edit" style={{flex:'0 0 auto', padding:'6px 12px'}} onClick={() => handleEdit(d)}>✏️</button>
                      <button className="admin-action-btn delete" style={{flex:'0 0 auto', padding:'6px 12px'}} onClick={() => handleDelete(d.id)}>🗑️</button>
                    </div>
                  </div>
                  {d.ar && <div style={{fontSize:18, lineHeight:1.8, textAlign:'right', color:'var(--text)', marginBottom:8, fontFamily:'Amiri, serif'}}>{d.ar}</div>}
                  {d.translit && <div style={{fontSize:13, fontStyle:'italic', color:'var(--primary-dark)', marginBottom:8}}>{d.translit}</div>}
                  {(d.text?.[lang] || d.text?.en) && <div style={{fontSize:14, color:'var(--text-dim)', lineHeight:1.6, marginBottom:8}}>{d.text[lang] || d.text.en}</div>}
                  {d.source && <div style={{fontSize:12, color:'var(--gold, #b8860b)', fontWeight:700}}>— {d.source}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
