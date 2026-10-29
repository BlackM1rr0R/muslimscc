import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { AdminHeader, SectionTitle, AdminEmpty, LangTabs, AdminAlert } from './AdminUi'
import { AdminText, adminPick } from './adminText'
import { addCustomQuote, updateCustomQuote, deleteCustomQuote, QUOTE_CATEGORIES, subscribeToQuotes } from '../../data/adminContent'

const LABELS = {
  az: { title:'Sitatlar', sub:'Sitat generatorunda istifadə olunur', addNew:'Yeni sitat', editItem:'Redaktə', all:'Bütün sitatlar', arabic:'Ərəbcə', text:'Mətn', source:'Mənbə', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hələ sitat yoxdur', required:'Mətn tələb olunur', sourcePh:'Quran, hədis, Həzrət Əli...' },
  en: { title:'Quotes', sub:'Used in Quote Generator', addNew:'New Quote', editItem:'Edit', all:'All Quotes', arabic:'Arabic', text:'Text', source:'Source', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No quotes yet', required:'Text required', sourcePh:'Quran, hadith, Ali ibn Abi Talib...' },
  ru: { title:'Цитаты', sub:'Используется в генераторе', addNew:'Новая цитата', editItem:'Изменить', all:'Все', arabic:'Арабский', text:'Текст', source:'Источник', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет цитат', required:'Текст обязателен', sourcePh:'Коран, хадис, Али ибн Абу Талиб...' },
  ar: { title:'الاقتباسات', sub:'تستخدم في مولد الاقتباسات', addNew:'اقتباس جديد', editItem:'تعديل', all:'الكل', arabic:'العربية', text:'النص', source:'المصدر', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'النص مطلوب', sourcePh:'القرآن، الحديث، علي بن أبي طالب...' },
  tr: { title:'Alıntılar', sub:'Alıntı oluşturucuda kullanılır', addNew:'Yeni Alıntı', editItem:'Düzenle', all:'Tümü', arabic:'Arapça', text:'Metin', source:'Kaynak', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin?', noItems:'Alıntı yok', required:'Metin gerekli', sourcePh:"Kur'an, hadis, Hz. Ali..." },
}

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
      <AdminHeader icon="quotes" title={l.title} sub={l.sub} />

      <div className="admin-section" data-reveal>
        <SectionTitle icon={editingId ? 'edit' : 'plus'}>{editingId ? l.editItem : l.addNew}</SectionTitle>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-quote-1">{l.arabic}</label>
            <textarea id="adm-quote-1"
              className="admin-input admin-textarea admin-input--arabic"
              value={form.ar}
              onChange={(e) => setForm({...form, ar:e.target.value})}
              placeholder="..."
              dir="rtl"
            />
          </div>

          <LangTabs value={formLang} onChange={setFormLang} />

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-quote-2">{l.text} ({formLang.toUpperCase()})</label>
            <textarea id="adm-quote-2" className="admin-input admin-textarea" value={form.text[formLang]} onChange={(e) => setForm({...form, text:{...form.text, [formLang]:e.target.value}})} placeholder={l.text} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-quote-3">{l.source}</label>
              <input id="adm-quote-3" type="text" className="admin-input" value={form.source} onChange={(e) => setForm({...form, source:e.target.value})} placeholder={l.sourcePh} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-quote-4">{l.category}</label>
              <select id="adm-quote-4" className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {QUOTE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label[lang]}</option>)}
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
        <SectionTitle icon="quotes">{l.all} <span className="admin-count">({items.length})</span></SectionTitle>

        {items.length === 0 ? (
          <AdminEmpty>{l.noItems}</AdminEmpty>
        ) : (
          <ul className="admin-items admin-items--grid">
            {items.map(q => {
              const cat = QUOTE_CATEGORIES.find(c => c.key === q.category)
              return (
                <li key={q.id} className="admin-item">
                  <div className="admin-item__head">
                    <span className="ui-badge">{cat?.label[lang]}</span>
                  </div>
                  {q.ar && <div className="admin-item__ar" lang="ar">{q.ar}</div>}
                  {/* Tərcümə cari dildə yoxdursa yer tutucu; ərəbcədə orijinal onsuz da göstərilir */}
                  {(lang !== 'ar' || (adminPick(q.text, lang) && adminPick(q.text, lang) !== q.ar)) && <p className="admin-item__text admin-item__text--quote">{adminPick(q.text, lang) ? `"${adminPick(q.text, lang)}"` : <AdminText value={q.text} lang={lang} />}</p>}
                  {q.source && <div className="admin-item__src">— {q.source}</div>}
                  <div className="admin-item__actions admin-item__actions--foot">
                    <button type="button" className="admin-action-btn edit" onClick={() => handleEdit(q)}><Icon name="edit" /> {l.edit}</button>
                    <button type="button" className="admin-action-btn delete" onClick={() => handleDelete(q.id)}><Icon name="trash" /> {l.delete}</button>
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
