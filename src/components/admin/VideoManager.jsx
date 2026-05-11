import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { addVideo, updateVideo, deleteVideo, getYouTubeId, getThumbnail, VIDEO_CATEGORIES, subscribeToVideos, DEFAULT_VIDEOS } from '../../data/videos'
import { isFirebaseConfigured } from '../../firebase/config'

const LABELS = {
  az: { title:'Videolar', sub:'Video kontenti idarə edin', addNew:'Yeni Video', editVideo:'Redaktə Et', all:'Bütün Videolar', titleField:'Başlıq', descField:'Təsvir', youtubeUrl:'YouTube linki', duration:'Müddət', category:'Kateqoriya', save:'Yadda saxla', cancel:'İmtina', edit:'Redaktə', delete:'Sil', confirmDelete:'Bu videonu silmək istəyirsiniz?', noVideos:'Hələ video yoxdur', invalidUrl:'YouTube linki yanlışdır', titleRequired:'Başlıq tələb olunur', loading:'Yüklənir...', saving:'Saxlanılır...', notConfigured:'Firebase qoşulmayıb. Lütfən .env faylını yoxlayın.' },
  en: { title:'Videos', sub:'Manage video content', addNew:'New Video', editVideo:'Edit', all:'All Videos', titleField:'Title', descField:'Description', youtubeUrl:'YouTube URL', duration:'Duration', category:'Category', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', confirmDelete:'Delete this video?', noVideos:'No videos yet', invalidUrl:'Invalid URL', titleRequired:'Title required', loading:'Loading...', saving:'Saving...', notConfigured:'Firebase not configured. Check .env file.' },
  ru: { title:'Видео', sub:'Управление видео', addNew:'Новое видео', editVideo:'Изменить', all:'Все видео', titleField:'Заголовок', descField:'Описание', youtubeUrl:'YouTube ссылка', duration:'Длительность', category:'Категория', save:'Сохранить', cancel:'Отмена', edit:'Изменить', delete:'Удалить', confirmDelete:'Удалить?', noVideos:'Нет видео', invalidUrl:'Неверная ссылка', titleRequired:'Заголовок обязателен', loading:'Загрузка...', saving:'Сохранение...', notConfigured:'Firebase не настроен' },
  ar: { title:'الفيديوهات', sub:'إدارة الفيديوهات', addNew:'فيديو جديد', editVideo:'تعديل', all:'كل الفيديوهات', titleField:'العنوان', descField:'الوصف', youtubeUrl:'رابط YouTube', duration:'المدة', category:'الفئة', save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف', confirmDelete:'حذف؟', noVideos:'لا توجد فيديوهات', invalidUrl:'رابط غير صحيح', titleRequired:'العنوان مطلوب', loading:'جارٍ التحميل...', saving:'جارٍ الحفظ...', notConfigured:'Firebase غير مكون' },
  tr: { title:'Videolar', sub:'Video yönetimi', addNew:'Yeni Video', editVideo:'Düzenle', all:'Tüm Videolar', titleField:'Başlık', descField:'Açıklama', youtubeUrl:'YouTube linki', duration:'Süre', category:'Kategori', save:'Kaydet', cancel:'İptal', edit:'Düzenle', delete:'Sil', confirmDelete:'Silinsin mi?', noVideos:'Video yok', invalidUrl:'Geçersiz link', titleRequired:'Başlık gerekli', loading:'Yükleniyor...', saving:'Kaydediliyor...', notConfigured:'Firebase yapılandırılmamış' },
}

const LANGS = ['az','en','ru','ar','tr']
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
  const configured = isFirebaseConfigured()

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formLang, setFormLang] = useState(lang)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configured) {
      setVideos(DEFAULT_VIDEOS)
      setLoading(false)
      return
    }
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
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>📹</div>
          <div className="admin-header-info">
            <h1>{l.title}</h1>
            <p>{l.sub}</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">{editingId ? '✏️' : '➕'}</span>
          {editingId ? l.editVideo : l.addNew}
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
              <label className="admin-input-label">{l.duration}</label>
              <input type="text" className="admin-input" value={form.duration} onChange={(e) => setForm({...form, duration:e.target.value})} placeholder="12:34" />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.descField} ({formLang.toUpperCase()})</label>
            <textarea className="admin-input admin-textarea" value={form.description[formLang]} onChange={(e) => setForm({...form, description:{...form.description, [formLang]:e.target.value}})} placeholder={l.descField} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.youtubeUrl}</label>
              <input type="text" className="admin-input" value={form.youtubeUrl} onChange={(e) => setForm({...form, youtubeUrl:e.target.value})} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.category}</label>
              <select className="admin-input admin-select" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
                {VIDEO_CATEGORIES.filter(c => c.key !== 'all').map(c => (
                  <option key={c.key} value={c.key}>{c.label[lang] || c.label.en}</option>
                ))}
              </select>
            </div>
          </div>

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
          <span className="admin-section-title-icon">📹</span>
          {l.all} ({videos.length})
        </h2>

        {loading ? (
          <div className="admin-empty"><div className="admin-empty-icon">⏳</div>{l.loading}</div>
        ) : videos.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">📭</div>{l.noVideos}</div>
        ) : (
          <div className="admin-video-list">
            {videos.map(v => {
              const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
              const isDefault = String(v.id).startsWith('default-')
              return (
                <div key={v.id} className="admin-video-card">
                  <div className="admin-video-thumb">
                    <img src={getThumbnail(v.youtubeId)} alt={v.title[lang] || v.title.en} onError={(e) => e.target.src=`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} />
                    <div className="admin-video-cat-badge" style={{color: cat?.color}}>{cat?.label[lang] || cat?.label.en || v.category}</div>
                    {v.duration && <div className="admin-video-duration">{v.duration}</div>}
                  </div>
                  <div className="admin-video-body">
                    <h3 className="admin-video-title">{v.title[lang] || v.title.en}</h3>
                    {(v.description?.[lang] || v.description?.en) && <p className="admin-video-desc">{v.description[lang] || v.description.en}</p>}
                    {!isDefault && (
                      <div className="admin-video-actions">
                        <button className="admin-action-btn edit" onClick={() => handleEdit(v)}>✏️ {l.edit}</button>
                        <button className="admin-action-btn delete" onClick={() => handleDelete(v.id)}>🗑️ {l.delete}</button>
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
