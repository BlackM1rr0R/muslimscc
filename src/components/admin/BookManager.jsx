import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { AdminHeader, SectionTitle, AdminEmpty, LangTabs, AdminAlert } from './AdminUi'
import { AdminText, adminPick } from './adminText'
import { addBook, updateBook, deleteBook, BOOK_CATEGORIES, subscribeToBooks } from '../../data/books'

const LABELS = {
  az: { title:'Kitablar', sub:'Kitab məzmununu idarə edin', addNew:'Yeni kitab', editBook:'Redaktə et', all:'Bütün kitablar', titleField:'Başlıq', authorField:'Müəllif', descField:'Təsvir', coverUrl:'Üz qabığı (şəkil URL)', pdfUrl:'PDF linki (istəyə bağlı)', pages:'Səhifə sayı', year:'İl', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Bu kitabı silmək istəyirsiniz?', noBooks:'Hələ kitab yoxdur', titleRequired:'Başlıq tələb olunur', authorRequired:'Müəllif tələb olunur', loading:'Yüklənir...', saving:'Saxlanılır...', preview:'Önbaxış', readOnly:'Standart (yalnız oxumaq üçün)', pagesShort:'səh.' },
  en: { title:'Books', sub:'Manage book content', addNew:'New Book', editBook:'Edit Book', all:'All Books', titleField:'Title', authorField:'Author', descField:'Description', coverUrl:'Cover image URL', pdfUrl:'PDF link (optional)', pages:'Pages', year:'Year', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete this book?', noBooks:'No books yet', titleRequired:'Title required', authorRequired:'Author required', loading:'Loading...', saving:'Saving...', preview:'Preview', readOnly:'Default (read-only)', pagesShort:'p.' },
  ru: { title:'Книги', sub:'Управление книгами', addNew:'Новая книга', editBook:'Редактировать', all:'Все книги', titleField:'Название', authorField:'Автор', descField:'Описание', coverUrl:'Обложка (URL)', pdfUrl:'Ссылка на PDF (необязательно)', pages:'Страниц', year:'Год', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noBooks:'Нет книг', titleRequired:'Название обязательно', authorRequired:'Автор обязателен', loading:'Загрузка...', saving:'Сохранение...', preview:'Предпросмотр', readOnly:'Встроенная (только чтение)', pagesShort:'стр.' },
  ar: { title:'الكتب', sub:'إدارة الكتب', addNew:'كتاب جديد', editBook:'تعديل', all:'كل الكتب', titleField:'العنوان', authorField:'المؤلف', descField:'الوصف', coverUrl:'رابط الغلاف', pdfUrl:'رابط PDF (اختياري)', pages:'الصفحات', year:'السنة', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noBooks:'لا توجد كتب', titleRequired:'العنوان مطلوب', authorRequired:'المؤلف مطلوب', loading:'جارٍ التحميل...', saving:'جارٍ الحفظ...', preview:'معاينة', readOnly:'افتراضي (للقراءة فقط)', pagesShort:'ص' },
  tr: { title:'Kitaplar', sub:'Kitap yönetimi', addNew:'Yeni Kitap', editBook:'Düzenle', all:'Tüm Kitaplar', titleField:'Başlık', authorField:'Yazar', descField:'Açıklama', coverUrl:'Kapak resmi (URL)', pdfUrl:'PDF bağlantısı (isteğe bağlı)', pages:'Sayfa', year:'Yıl', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noBooks:'Kitap yok', titleRequired:'Başlık gerekli', authorRequired:'Yazar gerekli', loading:'Yükleniyor...', saving:'Kaydediliyor...', preview:'Önizleme', readOnly:'Varsayılan (salt okunur)', pagesShort:'syf.' },
}

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

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
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

  return (
    <div>
      <AdminHeader icon="books" title={l.title} sub={l.sub} />

      <div className="admin-section" data-reveal>
        <SectionTitle icon={editingId ? 'edit' : 'plus'}>{editingId ? l.editBook : l.addNew}</SectionTitle>

        <form onSubmit={handleSubmit} className="admin-form">
          <LangTabs value={formLang} onChange={setFormLang} />

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-book-1">{l.titleField} ({formLang.toUpperCase()})</label>
              <input id="adm-book-1" type="text" className="admin-input" value={form.title[formLang]} onChange={(e) => setForm({...form, title:{...form.title, [formLang]:e.target.value}})} placeholder={l.titleField} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-book-2">{l.authorField} ({formLang.toUpperCase()})</label>
              <input id="adm-book-2" type="text" className="admin-input" value={form.author[formLang]} onChange={(e) => setForm({...form, author:{...form.author, [formLang]:e.target.value}})} placeholder={l.authorField} />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-book-3">{l.descField} ({formLang.toUpperCase()})</label>
            <textarea id="adm-book-3" className="admin-input admin-textarea" value={form.description[formLang]} onChange={(e) => setForm({...form, description:{...form.description, [formLang]:e.target.value}})} placeholder={l.descField} rows={3} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-book-4">{l.coverUrl}</label>
              <input id="adm-book-4" type="text" className="admin-input" value={form.coverUrl} onChange={(e) => setForm({...form, coverUrl:e.target.value})} placeholder="https://..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-book-5">{l.pdfUrl}</label>
              <input id="adm-book-5" type="text" className="admin-input" value={form.pdfUrl} onChange={(e) => setForm({...form, pdfUrl:e.target.value})} placeholder="https://.../book.pdf" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-book-6">{l.category}</label>
              <select id="adm-book-6" className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {BOOK_CATEGORIES.filter(c => c.key !== 'all').map(c => (
                  <option key={c.key} value={c.key}>{c.label[lang]}</option>
                ))}
              </select>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-book-7">{l.pages}</label>
              <input id="adm-book-7" type="number" min="1" className="admin-input" value={form.pages} onChange={(e) => setForm({...form, pages:e.target.value})} placeholder="240" />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-book-8">{l.year}</label>
              <input id="adm-book-8" type="number" className="admin-input" value={form.year} onChange={(e) => setForm({...form, year:e.target.value})} placeholder="2020" />
            </div>
          </div>

          {/* Live preview */}
          {form.coverUrl && (
            <div className="admin-cover-preview">
              <img src={form.coverUrl} alt={l.preview} onError={(e) => e.target.style.display='none'} />
              <div className="admin-hint"><Icon name="eye" size={16} /> {l.preview}</div>
            </div>
          )}

          {error && <AdminAlert tone="bad">{error}</AdminAlert>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={saving}>
              <Icon name={editingId ? 'check' : 'plus'} /> {saving ? l.saving : l.save}
            </button>
            {editingId && (
              <button type="button" className="admin-cancel-btn" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>{l.cancel}</button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <SectionTitle icon="books">{l.all} <span className="admin-count">({books.length})</span></SectionTitle>

        {loading ? (
          <AdminEmpty icon="refresh" busy>{l.loading}</AdminEmpty>
        ) : books.length === 0 ? (
          <AdminEmpty>{l.noBooks}</AdminEmpty>
        ) : (
          <div className="admin-video-list admin-video-list--books">
            {books.map(b => {
              const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
              const isDefault = String(b.id).startsWith('default-')
              return (
                <div key={b.id} className="admin-video-card">
                  <div className="admin-video-thumb admin-video-thumb--book">
                    {b.coverUrl ? (
                      <img src={b.coverUrl} alt={adminPick(b.title, lang)} onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className="admin-cover-fallback" aria-hidden="true"><Icon name="books" size={40} strokeWidth={1.4} /></div>
                    )}
                    <div className="admin-video-cat-badge">{cat?.label[lang]}</div>
                    {b.pages && <div className="admin-video-duration">{b.pages} {l.pagesShort}</div>}
                  </div>
                  <div className="admin-video-body">
                    <h3 className="admin-video-title"><AdminText value={b.title} lang={lang} /></h3>
                    <p className="admin-video-meta"><AdminText value={b.author} lang={lang} /></p>
                    {adminPick(b.description, lang) && <p className="admin-video-desc">{adminPick(b.description, lang)}</p>}
                    {!isDefault && (
                      <div className="admin-video-actions">
                        <button className="admin-action-btn edit" onClick={() => handleEdit(b)}><Icon name="edit" /> {l.edit}</button>
                        <button className="admin-action-btn delete" onClick={() => handleDelete(b.id)}><Icon name="trash" /> {l.delete}</button>
                      </div>
                    )}
                    {isDefault && <div className="admin-readonly"><Icon name="shield" size={14} /> {l.readOnly}</div>}
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
