import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { addBook, updateBook, deleteBook, BOOK_CATEGORIES, subscribeToBooks, DEFAULT_BOOKS } from '../../data/books'
import { isFirebaseConfigured } from '../../firebase/config'

const LABELS = {
  az: { title:'Kitablar', sub:'Kitab kontentini idarə edin', addNew:'Yeni Kitab', editBook:'Redaktə Et', all:'Bütün Kitablar', titleField:'Başlıq', authorField:'Müəllif', descField:'Təsvir', coverUrl:'Üz qabığı (şəkil URL)', pdfUrl:'PDF linki (opsional)', pages:'Səhifə sayı', year:'İl', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Bu kitabı silmək istəyirsiniz?', noBooks:'Hələ kitab yoxdur', titleRequired:'Başlıq tələb olunur', authorRequired:'Müəllif tələb olunur', loading:'Yüklənir...', saving:'Saxlanılır...', notConfigured:'Firebase qoşulmayıb. Lütfən .env faylını yoxlayın.' },
  en: { title:'Books', sub:'Manage book content', addNew:'New Book', editBook:'Edit Book', all:'All Books', titleField:'Title', authorField:'Author', descField:'Description', coverUrl:'Cover image URL', pdfUrl:'PDF link (optional)', pages:'Pages', year:'Year', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete this book?', noBooks:'No books yet', titleRequired:'Title required', authorRequired:'Author required', loading:'Loading...', saving:'Saving...', notConfigured:'Firebase not configured. Check .env file.' },
  ru: { title:'Книги', sub:'Управление книгами', addNew:'Новая книга', editBook:'Редактировать', all:'Все книги', titleField:'Название', authorField:'Автор', descField:'Описание', coverUrl:'Обложка (URL)', pdfUrl:'PDF ссылка', pages:'Страниц', year:'Год', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noBooks:'Нет книг', titleRequired:'Название обязательно', authorRequired:'Автор обязателен', loading:'Загрузка...', saving:'Сохранение...', notConfigured:'Firebase не настроен' },
  ar: { title:'الكتب', sub:'إدارة الكتب', addNew:'كتاب جديد', editBook:'تعديل', all:'كل الكتب', titleField:'العنوان', authorField:'المؤلف', descField:'الوصف', coverUrl:'رابط الغلاف', pdfUrl:'رابط PDF', pages:'الصفحات', year:'السنة', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noBooks:'لا توجد كتب', titleRequired:'العنوان مطلوب', authorRequired:'المؤلف مطلوب', loading:'جارٍ التحميل...', saving:'جارٍ الحفظ...', notConfigured:'Firebase غير مكون' },
  tr: { title:'Kitaplar', sub:'Kitap yönetimi', addNew:'Yeni Kitap', editBook:'Düzenle', all:'Tüm Kitaplar', titleField:'Başlık', authorField:'Yazar', descField:'Açıklama', coverUrl:'Kapak resmi (URL)', pdfUrl:'PDF linki', pages:'Sayfa', year:'Yıl', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noBooks:'Kitap yok', titleRequired:'Başlık gerekli', authorRequired:'Yazar gerekli', loading:'Yükleniyor...', saving:'Kaydediliyor...', notConfigured:'Firebase yapılandırılmamış' },
}

const LANGS = ['az','en','ru','ar','tr']
const EMPTY_FORM = {
  title: { az:'', en:'', ru:'', ar:'', tr:'' },
  author: { az:'', en:'', ru:'', ar:'', tr:'' },
  description: { az:'', en:'', ru:'', ar:'', tr:'' },
  coverUrl: '',
  pdfUrl: '',
  pages: '',
  year: '',
  category: 'quran',
}

export default function BookManager({ onUpdate }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const configured = isFirebaseConfigured()

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configured) {
      setBooks(DEFAULT_BOOKS)
      setLoading(false)
      return
    }
    const unsubscribe = subscribeToBooks((items) => {
      setBooks(items)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.az && !form.title.en) { setError(l.titleRequired); return }
    if (!form.author.az && !form.author.en) { setError(l.authorRequired); return }

    const data = {
      title: form.title,
      author: form.author,
      description: form.description,
      coverUrl: form.coverUrl.trim(),
      pdfUrl: form.pdfUrl.trim(),
      pages: form.pages ? Number(form.pages) : null,
      year: form.year ? Number(form.year) : null,
      category: form.category,
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateBook(editingId, data)
        setEditingId(null)
      } else {
        await addBook(data)
      }
      setForm(EMPTY_FORM)
      onUpdate?.()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  const handleEdit = (b) => {
    setEditingId(b.id)
    setForm({
      title: b.title || { az:'', en:'', ru:'', ar:'', tr:'' },
      author: b.author || { az:'', en:'', ru:'', ar:'', tr:'' },
      description: b.description || { az:'', en:'', ru:'', ar:'', tr:'' },
      coverUrl: b.coverUrl || '',
      pdfUrl: b.pdfUrl || '',
      pages: b.pages || '',
      year: b.year || '',
      category: b.category || 'quran',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm(l.confirmDelete)) {
      await deleteBook(id)
      onUpdate?.()
    }
  }

  if (!configured) {
    return (
      <div className="admin-section">
        <div style={{padding:40, textAlign:'center'}}>
          <div style={{fontSize:48, marginBottom:12}}>⚠️</div>
          <h3 style={{color:'#ef4444'}}>{l.notConfigured}</h3>
          <p style={{color:'var(--text-muted)', marginTop:8}}>FIREBASE_SETUP.md faylına baxın</p>
        </div>
      </div>
    )
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
          {editingId ? l.editBook : l.addNew}
        </h2>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-lang-tabs">
            {LANGS.map(L => (
              <button key={L} type="button" className={`admin-lang-tab ${formLang === L ? 'active' : ''}`} onClick={() => setFormLang(L)}>
                {L.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.titleField} ({formLang.toUpperCase()})</label>
              <input type="text" className="admin-input" value={form.title[formLang]} onChange={(e) => setForm({...form, title:{...form.title, [formLang]:e.target.value}})} placeholder={l.titleField} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.authorField} ({formLang.toUpperCase()})</label>
              <input type="text" className="admin-input" value={form.author[formLang]} onChange={(e) => setForm({...form, author:{...form.author, [formLang]:e.target.value}})} placeholder={l.authorField} />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.descField} ({formLang.toUpperCase()})</label>
            <textarea className="admin-input admin-textarea" value={form.description[formLang]} onChange={(e) => setForm({...form, description:{...form.description, [formLang]:e.target.value}})} placeholder={l.descField} rows={3} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.coverUrl}</label>
              <input type="text" className="admin-input" value={form.coverUrl} onChange={(e) => setForm({...form, coverUrl:e.target.value})} placeholder="https://..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.pdfUrl}</label>
              <input type="text" className="admin-input" value={form.pdfUrl} onChange={(e) => setForm({...form, pdfUrl:e.target.value})} placeholder="https://.../book.pdf" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.category}</label>
              <select className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {BOOK_CATEGORIES.filter(c => c.key !== 'all').map(c => (
                  <option key={c.key} value={c.key}>{c.label[lang] || c.label.en}</option>
                ))}
              </select>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.pages}</label>
              <input type="number" min="1" className="admin-input" value={form.pages} onChange={(e) => setForm({...form, pages:e.target.value})} placeholder="240" />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.year}</label>
              <input type="number" className="admin-input" value={form.year} onChange={(e) => setForm({...form, year:e.target.value})} placeholder="2020" />
            </div>
          </div>

          {/* Live preview */}
          {form.coverUrl && (
            <div style={{display:'flex', gap:14, padding:12, background:'var(--bg-soft, #f8fafc)', borderRadius:12, marginTop:6}}>
              <img src={form.coverUrl} alt="preview" style={{width:90, height:130, objectFit:'cover', borderRadius:8, boxShadow:'0 4px 14px rgba(0,0,0,0.15)'}} onError={(e) => e.target.style.display='none'} />
              <div style={{flex:1, fontSize:13, color:'var(--text-muted)'}}>📖 Preview</div>
            </div>
          )}

          {error && <div className="admin-login-error">⚠️ {error}</div>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={saving}>
              <span>{editingId ? '💾' : '➕'}</span> {saving ? l.saving : l.save}
            </button>
            {editingId && (
              <button type="button" className="admin-cancel-btn" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>{l.cancel}</button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">📚</span>
          {l.all} ({books.length})
        </h2>

        {loading ? (
          <div className="admin-empty"><div className="admin-empty-icon">⏳</div>{l.loading}</div>
        ) : books.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">📭</div>{l.noBooks}</div>
        ) : (
          <div className="admin-video-list">
            {books.map(b => {
              const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
              const isDefault = String(b.id).startsWith('default-')
              return (
                <div key={b.id} className="admin-video-card">
                  <div className="admin-video-thumb" style={{aspectRatio:'2/3', background: cat?.color || '#10b981'}}>
                    {b.coverUrl ? (
                      <img src={b.coverUrl} alt={b.title?.[lang] || b.title?.en} onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:48, color:'#fff'}}>📚</div>
                    )}
                    <div className="admin-video-cat-badge" style={{color: cat?.color}}>{cat?.label[lang] || cat?.label.en || b.category}</div>
                    {b.pages && <div className="admin-video-duration">{b.pages} {lang === 'az' ? 'səh.' : lang === 'ru' ? 'стр.' : lang === 'tr' ? 'syf.' : 'p.'}</div>}
                  </div>
                  <div className="admin-video-body">
                    <h3 className="admin-video-title">{b.title?.[lang] || b.title?.en}</h3>
                    <p style={{fontSize:13, color:'var(--text-muted)', margin:'2px 0 6px', fontWeight:600}}>✍️ {b.author?.[lang] || b.author?.en}</p>
                    {(b.description?.[lang] || b.description?.en) && <p className="admin-video-desc">{b.description[lang] || b.description.en}</p>}
                    {!isDefault && (
                      <div className="admin-video-actions">
                        <button className="admin-action-btn edit" onClick={() => handleEdit(b)}>✏️ {l.edit}</button>
                        <button className="admin-action-btn delete" onClick={() => handleDelete(b.id)}>🗑️ {l.delete}</button>
                      </div>
                    )}
                    {isDefault && <div style={{fontSize:11, color:'var(--text-muted)', fontStyle:'italic', marginTop:6}}>Default (read-only)</div>}
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
