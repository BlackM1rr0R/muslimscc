import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { addCustomHadith, updateCustomHadith, deleteCustomHadith, CUSTOM_HADITH_CATS, subscribeToHadiths } from '../../data/adminContent'

const LABELS = {
  az: { title:'Hədislər', sub:'Hədis kontenti idarə edin', addNew:'Yeni Hədis', editItem:'Redaktə Et', all:'Bütün Hədislər', arabicText:'Ərəbcə mətn', translation:'Tərcümə', source:'Mənbə', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Bu hədisi silmək?', noItems:'Hələ hədis yoxdur', required:'Bu sahə tələb olunur' },
  en: { title:'Hadiths', sub:'Manage hadith content', addNew:'New Hadith', editItem:'Edit', all:'All Hadiths', arabicText:'Arabic text', translation:'Translation', source:'Source', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete this hadith?', noItems:'No hadiths yet', required:'Required field' },
  ru: { title:'Хадисы', sub:'Управление хадисами', addNew:'Новый Хадис', editItem:'Изменить', all:'Все хадисы', arabicText:'Арабский текст', translation:'Перевод', source:'Источник', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет хадисов', required:'Обязательно' },
  ar: { title:'الأحاديث', sub:'إدارة الأحاديث', addNew:'حديث جديد', editItem:'تعديل', all:'كل الأحاديث', arabicText:'النص العربي', translation:'الترجمة', source:'المصدر', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب' },
  tr: { title:'Hadisler', sub:'Hadis yönetimi', addNew:'Yeni Hadis', editItem:'Düzenle', all:'Tüm Hadisler', arabicText:'Arapça metin', translation:'Çeviri', source:'Kaynak', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noItems:'Hadis yok', required:'Gerekli' },
}

const LANGS = ['az','en','ru','ar','tr']
const EMPTY = {
  ar: '',
  text: { az:'', en:'', ru:'', ar:'', tr:'' },
  source: '',
  category: 'general',
}

export default function HadithManager({ onUpdate }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToHadiths((all) => setItems(all))
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
        await updateCustomHadith(editingId, form)
        setEditingId(null)
      } else {
        await addCustomHadith(form)
      }
      setForm(EMPTY)
      onUpdate?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (h) => {
    setEditingId(h.id)
    setForm({
      ar: h.ar || '',
      text: h.text || { az:'', en:'', ru:'', ar:'', tr:'' },
      source: h.source || '',
      category: h.category || 'general',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm(l.confirmDelete)) {
      await deleteCustomHadith(id)
      onUpdate?.()
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}>📚</div>
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
              placeholder="إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ..."
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
            <label className="admin-input-label">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea className="admin-input admin-textarea" value={form.text[formLang]} onChange={(e) => setForm({...form, text:{...form.text, [formLang]:e.target.value}})} placeholder={l.translation} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.source}</label>
              <input type="text" className="admin-input" value={form.source} onChange={(e) => setForm({...form, source:e.target.value})} placeholder="Buxari, Muslim..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.category}</label>
              <select className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {CUSTOM_HADITH_CATS.map(c => (
                  <option key={c.key} value={c.key}>{c.label[lang] || c.label.en}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="admin-login-error">⚠️ {error}</div>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn">
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
          <span className="admin-section-title-icon">📚</span>
          {l.all} ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">📭</div>{l.noItems}</div>
        ) : (
          <div style={{display:'grid', gap:14}}>
            {items.map(h => {
              const cat = CUSTOM_HADITH_CATS.find(c => c.key === h.category)
              return (
                <div key={h.id} style={{
                  background:'var(--bg-card2)',
                  border:'1px solid var(--border)',
                  borderRadius:'var(--radius-lg)',
                  padding:20,
                  borderLeft:`4px solid ${cat?.color || '#10b981'}`,
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
                    <span style={{background:cat?.color+'18', color:cat?.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:0.3}}>
                      {cat?.label[lang] || cat?.label.en || h.category}
                    </span>
                    <div style={{display:'flex', gap:6}}>
                      <button className="admin-action-btn edit" style={{flex:'0 0 auto', padding:'6px 12px'}} onClick={() => handleEdit(h)}>✏️</button>
                      <button className="admin-action-btn delete" style={{flex:'0 0 auto', padding:'6px 12px'}} onClick={() => handleDelete(h.id)}>🗑️</button>
                    </div>
                  </div>
                  {h.ar && <div style={{fontSize:18, lineHeight:1.8, textAlign:'right', color:'var(--text)', marginBottom:8, fontFamily:'Amiri, serif'}}>{h.ar}</div>}
                  {(h.text?.[lang] || h.text?.en) && <div style={{fontSize:14, color:'var(--text-dim)', lineHeight:1.6, marginBottom:8}}>{h.text[lang] || h.text.en}</div>}
                  {h.source && <div style={{fontSize:12, color:'var(--gold, #b8860b)', fontWeight:700}}>— {h.source}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
