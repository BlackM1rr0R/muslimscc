import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { AdminHeader, SectionTitle, AdminEmpty, LangTabs, AdminAlert } from './AdminUi'
import { AdminText, adminPick } from './adminText'
import { addCustomDua, updateCustomDua, deleteCustomDua, CUSTOM_DUA_CATS, subscribeToDuas } from '../../data/adminContent'

const LABELS = {
  az: { title:'Dualar', sub:'Dua məzmununu idarə edin', addNew:'Yeni dua', editItem:'Redaktə et', all:'Bütün dualar', arabicText:'Ərəbcə', translit:'Transliterasiya', translation:'Tərcümə', source:'Mənbə', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Silmək?', noItems:'Hələ dua yoxdur', required:'Bu sahə tələb olunur', sourcePh:'Bəqərə 201...' },
  en: { title:'Duas', sub:'Manage duas', addNew:'New Dua', editItem:'Edit', all:'All Duas', arabicText:'Arabic', translit:'Transliteration', translation:'Translation', source:'Source', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete?', noItems:'No duas yet', required:'Required', sourcePh:'Al-Baqarah 201...' },
  ru: { title:'Дуа', sub:'Управление дуа', addNew:'Новая Дуа', editItem:'Изменить', all:'Все дуа', arabicText:'Арабский', translit:'Транслитерация', translation:'Перевод', source:'Источник', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noItems:'Нет дуа', required:'Обязательно', sourcePh:'Аль-Бакара 201...' },
  ar: { title:'الأدعية', sub:'إدارة الأدعية', addNew:'دعاء جديد', editItem:'تعديل', all:'كل الأدعية', arabicText:'العربية', translit:'النطق', translation:'الترجمة', source:'المصدر', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noItems:'لا توجد', required:'مطلوب', sourcePh:'البقرة 201...' },
  tr: { title:'Dualar', sub:'Dua yönetimi', addNew:'Yeni Dua', editItem:'Düzenle', all:'Tüm Dualar', arabicText:'Arapça', translit:'Okunuş', translation:'Çeviri', source:'Kaynak', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noItems:'Dua yok', required:'Gerekli', sourcePh:'Bakara 201...' },
}

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
      <AdminHeader icon="duas" title={l.title} sub={l.sub} />

      <div className="admin-section" data-reveal>
        <SectionTitle icon={editingId ? 'edit' : 'plus'}>{editingId ? l.editItem : l.addNew}</SectionTitle>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dua-1">{l.arabicText}</label>
            <textarea id="adm-dua-1"
              className="admin-input admin-textarea admin-input--arabic"
              value={form.ar}
              onChange={(e) => setForm({...form, ar:e.target.value})}
              placeholder="رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً..."
              dir="rtl"
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dua-2">{l.translit}</label>
            <input id="adm-dua-2" type="text" className="admin-input" value={form.translit} onChange={(e) => setForm({...form, translit:e.target.value})} placeholder="Rabbana atina fi'd-dunya..." />
          </div>

          <LangTabs value={formLang} onChange={setFormLang} />

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dua-3">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea id="adm-dua-3" className="admin-input admin-textarea" value={form.text[formLang]} onChange={(e) => setForm({...form, text:{...form.text, [formLang]:e.target.value}})} placeholder={l.translation} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-dua-4">{l.source}</label>
              <input id="adm-dua-4" type="text" className="admin-input" value={form.source} onChange={(e) => setForm({...form, source:e.target.value})} placeholder={l.sourcePh} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-dua-5">{l.category}</label>
              <select id="adm-dua-5" className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {CUSTOM_DUA_CATS.map(c => (
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
        <SectionTitle icon="duas">{l.all} <span className="admin-count">({items.length})</span></SectionTitle>

        {items.length === 0 ? (
          <AdminEmpty>{l.noItems}</AdminEmpty>
        ) : (
          <ul className="admin-items">
            {items.map(d => {
              const cat = CUSTOM_DUA_CATS.find(c => c.key === d.category)
              return (
                <li key={d.id} className="admin-item">
                  <div className="admin-item__head">
                    <span className="ui-badge">{cat?.label[lang]}</span>
                    <div className="admin-item__actions">
                      <button type="button" className="admin-action-btn admin-action-btn--icon edit" onClick={() => handleEdit(d)} title={l.edit} aria-label={l.edit}><Icon name="edit" /></button>
                      <button type="button" className="admin-action-btn admin-action-btn--icon delete" onClick={() => handleDelete(d.id)} title={l.delete} aria-label={l.delete}><Icon name="trash" /></button>
                    </div>
                  </div>
                  {d.ar && <div className="admin-item__ar" lang="ar">{d.ar}</div>}
                  {d.translit && <div className="admin-item__translit">{d.translit}</div>}
                  {/* Tərcümə cari dildə yoxdursa yer tutucu; ərəbcədə orijinal onsuz da göstərilir */}
                  {(lang !== 'ar' || (adminPick(d.text, lang) && adminPick(d.text, lang) !== d.ar)) && <p className="admin-item__text"><AdminText value={d.text} lang={lang} /></p>}
                  {d.source && <div className="admin-item__src">— {d.source}</div>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
