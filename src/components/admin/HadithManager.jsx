import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { AdminHeader, SectionTitle, AdminEmpty, LangTabs, AdminAlert } from './AdminUi'
import { AdminText, adminPick } from './adminText'
import { addCustomHadith, updateCustomHadith, deleteCustomHadith, CUSTOM_HADITH_CATS, subscribeToHadiths } from '../../data/adminContent'

const LABELS = {
  az: { title:'Hədislər', sub:'Hədis məzmununu idarə edin', addNew:'Yeni hədis', editItem:'Redaktə et', all:'Bütün hədislər', arabicText:'Ərəbcə mətn', translation:'Tərcümə', source:'Mənbə', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Bu hədisi silmək?', noItems:'Hələ hədis yoxdur', required:'Bu sahə tələb olunur', sourcePh:'Buxari, Muslim...' },
  en: { title:'Hadiths', sub:'Manage hadith content', addNew:'New Hadith', editItem:'Edit', all:'All Hadiths', arabicText:'Arabic text', translation:'Translation', source:'Source', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete this hadith?', noItems:'No hadiths yet', required:'Required field', sourcePh:'Bukhari, Muslim...' },
  ru: { title:'Хадисы', sub:'Управление хадисами', addNew:'Новый Хадис', editItem:'Изменить', all:'Все хадисы', arabicText:'Арабский текст', translation:'Перевод', source:'Источник', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет хадисов', required:'Обязательно', sourcePh:'Бухари, Муслим...' },
  ar: { title:'الأحاديث', sub:'إدارة الأحاديث', addNew:'حديث جديد', editItem:'تعديل', all:'كل الأحاديث', arabicText:'النص العربي', translation:'الترجمة', source:'المصدر', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب', sourcePh:'البخاري، مسلم...' },
  tr: { title:'Hadisler', sub:'Hadis yönetimi', addNew:'Yeni Hadis', editItem:'Düzenle', all:'Tüm Hadisler', arabicText:'Arapça metin', translation:'Çeviri', source:'Kaynak', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noItems:'Hadis yok', required:'Gerekli', sourcePh:'Buhârî, Müslim...' },
}

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
      <AdminHeader icon="hadith" title={l.title} sub={l.sub} />

      <div className="admin-section" data-reveal>
        <SectionTitle icon={editingId ? 'edit' : 'plus'}>{editingId ? l.editItem : l.addNew}</SectionTitle>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-hadith-1">{l.arabicText}</label>
            <textarea id="adm-hadith-1"
              className="admin-input admin-textarea admin-input--arabic"
              value={form.ar}
              onChange={(e) => setForm({...form, ar:e.target.value})}
              placeholder="إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ..."
              dir="rtl"
            />
          </div>

          <LangTabs value={formLang} onChange={setFormLang} />

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-hadith-2">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea id="adm-hadith-2" className="admin-input admin-textarea" value={form.text[formLang]} onChange={(e) => setForm({...form, text:{...form.text, [formLang]:e.target.value}})} placeholder={l.translation} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-hadith-3">{l.source}</label>
              <input id="adm-hadith-3" type="text" className="admin-input" value={form.source} onChange={(e) => setForm({...form, source:e.target.value})} placeholder={l.sourcePh} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-hadith-4">{l.category}</label>
              <select id="adm-hadith-4" className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {CUSTOM_HADITH_CATS.map(c => (
                  <option key={c.key} value={c.key}>{c.label[lang]}</option>
                ))}
              </select>
            </div>
          </div>

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
        <SectionTitle icon="books">{l.all} <span className="admin-count">({items.length})</span></SectionTitle>

        {items.length === 0 ? (
          <AdminEmpty>{l.noItems}</AdminEmpty>
        ) : (
          <ul className="admin-items">
            {items.map(h => {
              const cat = CUSTOM_HADITH_CATS.find(c => c.key === h.category)
              return (
                <li key={h.id} className="admin-item">
                  <div className="admin-item__head">
                    <span className="ui-badge">{cat?.label[lang]}</span>
                    <div className="admin-item__actions">
                      <button type="button" className="admin-action-btn admin-action-btn--icon edit" onClick={() => handleEdit(h)} title={l.edit} aria-label={l.edit}><Icon name="edit" /></button>
                      <button type="button" className="admin-action-btn admin-action-btn--icon delete" onClick={() => handleDelete(h.id)} title={l.delete} aria-label={l.delete}><Icon name="trash" /></button>
                    </div>
                  </div>
                  {h.ar && <div className="admin-item__ar" lang="ar">{h.ar}</div>}
                  {/* Tərcümə cari dildə yoxdursa yer tutucu; ərəbcədə orijinal onsuz da göstərilir */}
                  {(lang !== 'ar' || (adminPick(h.text, lang) && adminPick(h.text, lang) !== h.ar)) && <p className="admin-item__text"><AdminText value={h.text} lang={lang} /></p>}
                  {h.source && <div className="admin-item__src">— {h.source}</div>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
