import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import Icon from '../Icon'
import { AdminHeader, SectionTitle, AdminEmpty, LangTabs, AdminAlert } from './AdminUi'
import { AdminText, adminPick } from './adminText'
import { addVideo, updateVideo, deleteVideo, getYouTubeId, getThumbnail, VIDEO_CATEGORIES, subscribeToVideos } from '../../data/videos'

const LABELS = {
  az: { title:'Videolar', sub:'Video məzmununu idarə edin', addNew:'Yeni video', editVideo:'Redaktə et', all:'Bütün videolar', titleField:'Başlıq', descField:'Təsvir', youtubeUrl:'YouTube linki', duration:'Müddət', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Bu videonu silmək istəyirsiniz?', noVideos:'Hələ video yoxdur', invalidUrl:'YouTube linki yanlışdır', titleRequired:'Başlıq tələb olunur', loading:'Yüklənir...', saving:'Saxlanılır...', preview:'Önbaxış', readOnly:'Standart (yalnız oxumaq üçün)' },
  en: { title:'Videos', sub:'Manage video content', addNew:'New Video', editVideo:'Edit', all:'All Videos', titleField:'Title', descField:'Description', youtubeUrl:'YouTube URL', duration:'Duration', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete this video?', noVideos:'No videos yet', invalidUrl:'Invalid YouTube URL', titleRequired:'Title required', loading:'Loading...', saving:'Saving...', preview:'Preview', readOnly:'Default (read-only)' },
  ru: { title:'Видео', sub:'Управление видео', addNew:'Новое видео', editVideo:'Изменить', all:'Все видео', titleField:'Заголовок', descField:'Описание', youtubeUrl:'Ссылка на YouTube', duration:'Длительность', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noVideos:'Нет видео', invalidUrl:'Неверная ссылка на YouTube', titleRequired:'Заголовок обязателен', loading:'Загрузка...', saving:'Сохранение...', preview:'Предпросмотр', readOnly:'Встроенная (только чтение)' },
  ar: { title:'الفيديوهات', sub:'إدارة الفيديوهات', addNew:'فيديو جديد', editVideo:'تعديل', all:'كل الفيديوهات', titleField:'العنوان', descField:'الوصف', youtubeUrl:'رابط YouTube', duration:'المدة', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noVideos:'لا توجد فيديوهات', invalidUrl:'رابط غير صحيح', titleRequired:'العنوان مطلوب', loading:'جارٍ التحميل...', saving:'جارٍ الحفظ...', preview:'معاينة', readOnly:'افتراضي (للقراءة فقط)' },
  tr: { title:'Videolar', sub:'Video yönetimi', addNew:'Yeni Video', editVideo:'Düzenle', all:'Tüm Videolar', titleField:'Başlık', descField:'Açıklama', youtubeUrl:'YouTube bağlantısı', duration:'Süre', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noVideos:'Video yok', invalidUrl:'Geçersiz YouTube bağlantısı', titleRequired:'Başlık gerekli', loading:'Yükleniyor...', saving:'Kaydediliyor...', preview:'Önizleme', readOnly:'Varsayılan (salt okunur)' },
}

const EMPTY_FORM = {
  title: { az:'', en:'', ru:'', ar:'', tr:'' },
  description: { az:'', en:'', ru:'', ar:'', tr:'' },
  youtubeUrl: '',
  duration: '',
  category: 'lecture',
}

export default function VideoManager({ onUpdate }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToVideos((items) => {
      setVideos(items)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.az && !form.title.en) { setError(l.titleRequired); return }

    const ytId = getYouTubeId(form.youtubeUrl)
    if (!ytId) { setError(l.invalidUrl); return }

    const data = {
      title: form.title,
      description: form.description,
      youtubeId: ytId,
      duration: form.duration || '—',
      category: form.category,
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateVideo(editingId, data)
        setEditingId(null)
      } else {
        await addVideo(data)
      }
      setForm(EMPTY_FORM)
      onUpdate?.()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  const handleEdit = (v) => {
    setEditingId(v.id)
    setForm({
      title: v.title,
      description: v.description || { az:'', en:'', ru:'', ar:'', tr:'' },
      youtubeUrl: `https://youtu.be/${v.youtubeId}`,
      duration: v.duration || '',
      category: v.category,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (window.confirm(l.confirmDelete)) {
      await deleteVideo(id)
      onUpdate?.()
    }
  }

  return (
    <div>
      <AdminHeader icon="videos" title={l.title} sub={l.sub} />

      <div className="admin-section" data-reveal>
        <SectionTitle icon={editingId ? 'edit' : 'plus'}>{editingId ? l.editVideo : l.addNew}</SectionTitle>

        <form onSubmit={handleSubmit} className="admin-form">
          <LangTabs value={formLang} onChange={setFormLang} />

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-video-1">{l.titleField} ({formLang.toUpperCase()})</label>
              <input id="adm-video-1" type="text" className="admin-input" value={form.title[formLang]} onChange={(e) => setForm({...form, title:{...form.title, [formLang]:e.target.value}})} placeholder={l.titleField} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-video-2">{l.duration}</label>
              <input id="adm-video-2" type="text" className="admin-input" value={form.duration} onChange={(e) => setForm({...form, duration:e.target.value})} placeholder="12:34" />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-video-3">{l.descField} ({formLang.toUpperCase()})</label>
            <textarea id="adm-video-3" className="admin-input admin-textarea" value={form.description[formLang]} onChange={(e) => setForm({...form, description:{...form.description, [formLang]:e.target.value}})} placeholder={l.descField} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-video-4">{l.youtubeUrl}</label>
              <input id="adm-video-4" type="text" className="admin-input" value={form.youtubeUrl} onChange={(e) => setForm({...form, youtubeUrl:e.target.value})} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-video-5">{l.category}</label>
              <select id="adm-video-5" className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {VIDEO_CATEGORIES.filter(c => c.key !== 'all').map(c => (
                  <option key={c.key} value={c.key}>{c.label[lang]}</option>
                ))}
              </select>
            </div>
          </div>

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
        <SectionTitle icon="videos">{l.all} <span className="admin-count">({videos.length})</span></SectionTitle>

        {loading ? (
          <AdminEmpty icon="refresh" busy>{l.loading}</AdminEmpty>
        ) : videos.length === 0 ? (
          <AdminEmpty>{l.noVideos}</AdminEmpty>
        ) : (
          <div className="admin-video-list">
            {videos.map(v => {
              const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
              const isDefault = String(v.id).startsWith('default-')
              return (
                <div key={v.id} className="admin-video-card">
                  <div className="admin-video-thumb">
                    <img src={getThumbnail(v.youtubeId)} alt={adminPick(v.title, lang)} onError={(e) => e.target.src=`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} />
                    <span className="admin-video-play" aria-hidden="true"><Icon name="play" size={20} /></span>
                    <div className="admin-video-cat-badge">{cat?.label[lang]}</div>
                    {v.duration && <div className="admin-video-duration">{v.duration}</div>}
                  </div>
                  <div className="admin-video-body">
                    <h3 className="admin-video-title"><AdminText value={v.title} lang={lang} /></h3>
                    {adminPick(v.description, lang) && <p className="admin-video-desc">{adminPick(v.description, lang)}</p>}
                    {!isDefault && (
                      <div className="admin-video-actions">
                        <button className="admin-action-btn edit" onClick={() => handleEdit(v)}><Icon name="edit" /> {l.edit}</button>
                        <button className="admin-action-btn delete" onClick={() => handleDelete(v.id)}><Icon name="trash" /> {l.delete}</button>
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
