import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { VIDEO_CATEGORIES, getThumbnail, getEmbedUrl, DEFAULT_VIDEOS, subscribeToVideos } from '../data/videos'
import Pagination from './Pagination'
import Icon from './Icon'
import '../styles/VideoSection.css'
// Admin məzmunu cari dildə yoxdursa başqa dilə düşmür (bax: utils/pickLang)
import { pickLang, hasLang } from '../utils/pickLang'

const LABELS = {
  az: { eyebrow:'Mühazirə və tilavət', filter:'Bölmələr', close:'Bağla', title:'Video məzmun', sub:'Mühazirələr, tilavətlər və daha çoxu', noVideos:'Hələ video əlavə olunmayıb', loading:'Yüklənir...', viewAll:'Hamısını gör' },
  en: { eyebrow:'Lectures & recitation', filter:'Categories', close:'Close', title:'Video content', sub:'Lectures, recitations and more', noVideos:'No videos added yet', loading:'Loading...', viewAll:'View all' },
  ru: { eyebrow:'Лекции и чтение', filter:'Разделы', close:'Закрыть', title:'Видеоматериалы', sub:'Лекции, чтения и многое другое', noVideos:'Видео пока не добавлены', loading:'Загрузка...', viewAll:'Все видео' },
  ar: { eyebrow:'محاضرات وتلاوات', filter:'الأقسام', close:'إغلاق', title:'محتوى الفيديو', sub:'محاضرات وتلاوات والمزيد', noVideos:'لم يتم إضافة فيديوهات', loading:'جارٍ التحميل...', viewAll:'عرض الكل' },
  tr: { eyebrow:'Konferans ve tilavet', filter:'Bölümler', close:'Kapat', title:'Video İçerik', sub:'Konferanslar ve daha fazlası', noVideos:'Henüz video yok', loading:'Yükleniyor...', viewAll:'Tümünü gör' },
}

export default function VideoSection({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [allVideos, setVideos] = useState([])
  // Başlığı cari dildə olmayan admin məzmunu bu dildə göstərilmir (başqa dilə düşmür)
  const videos = allVideos.filter(v => hasLang(v.title, lang))
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')
  const [playingVideo, setPlayingVideo] = useState(null)
  const [pageNum, setPageNum] = useState(1)
  const PER_PAGE = 3

  useEffect(() => {
    // Real-time subscriber: admin video əlavə edəndə dərhal görünür
    const unsubscribe = subscribeToVideos((items) => {
      setVideos(items.length > 0 ? items : DEFAULT_VIDEOS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  // Kateqoriya dəyişəndə pagination-u sıfırla
  useEffect(() => { setPageNum(1) }, [selectedCat])

  // Ana səhifədə hər səhifəyə 3 video — istifadəçi sayfalaya bilər
  const filteredAll = selectedCat === 'all'
    ? videos
    : videos.filter(v => v.category === selectedCat)
  const totalPages = Math.max(1, Math.ceil(filteredAll.length / PER_PAGE))
  const currentPage = Math.min(pageNum, totalPages)
  const filtered = filteredAll.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  // Pəncərə açıqdırsa Esc onu bağlasın
  useEffect(() => {
    if (!playingVideo) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setPlayingVideo(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playingVideo])

  const goAll = () => { setPage('videos'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (loading) {
    // Yüklənmə: 3 kartlıq skelet — bölmə hündürlüyü əvvəlcədən saxlanır
    return (
      <section className="ui-section video-section vsx" aria-busy="true">
        <div className="ui-container">
          <div className="vsx-grid" role="status" aria-label={l.loading}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="ui-card ui-card--flush vsx-skel" aria-hidden="true">
                <div className="skeleton vsx-skel-thumb" />
                <div className="vsx-body">
                  <span className="skeleton skeleton--text" style={{ width: '80%' }} />
                  <span className="skeleton skeleton--text" style={{ width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (videos.length === 0) return null

  // Filtr çipləri: yalnız ən azı bir videosu olan bölmələr
  const cats = VIDEO_CATEGORIES.filter(c => c.key === 'all' || videos.some(v => v.category === c.key))

  return (
    <section className="ui-section video-section vsx">
      <div className="ui-container">

        <div className="ui-section-head ui-section-head--row vsx-head" data-reveal>
          <div className="vsx-head-text">
            <span className="ui-eyebrow">{l.eyebrow}</span>
            <h2 className="ui-title">{l.title}</h2>
            <p className="ui-lead">{l.sub}</p>
          </div>
          {setPage && (
            <button type="button" className="ui-btn ui-btn--secondary vsx-all" onClick={goAll}>
              {l.viewAll} <Icon name="arrow" size={16} className="ui-btn__icon ui-flip-rtl" />
            </button>
          )}
        </div>

        {cats.length > 2 && (
          <div className="vsx-filter" role="group" aria-label={l.filter}>
            {cats.map(cat => (
              <button
                type="button"
                key={cat.key}
                className="ui-chip"
                aria-pressed={selectedCat === cat.key}
                onClick={() => setSelectedCat(cat.key)}
              >
                {cat.label[lang]}
              </button>
            ))}
          </div>
        )}

        {/* Açar filtr/səhifə dəyişəndə şəbəkəni yenidən qurur — kartlar növbə ilə görünür */}
        <div className="vsx-grid" data-reveal="stagger-zoom" key={`${selectedCat}|${currentPage}`}>
          {filtered.map(v => {
            const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
            return (
              <button type="button" key={v.id} className="ui-card ui-card--flush ui-card--interactive vsx-card" onClick={() => setPlayingVideo(v)}>
                <span className="vsx-thumb">
                  <img
                    src={getThumbnail(v.youtubeId)}
                    alt=""
                    onError={(e) => { if (!e.target.dataset.fb) { e.target.dataset.fb = '1'; e.target.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` } }}
                    loading="lazy"
                  />
                  <span className="vsx-play" aria-hidden="true"><Icon name="play" size={28} strokeWidth={1.5} /></span>
                  {cat && cat.key !== 'all' && <span className="vsx-cat">{cat.label[lang]}</span>}
                  {v.duration && v.duration !== '—' && <span className="vsx-dur ui-num">{v.duration}</span>}
                </span>
                <span className="vsx-body">
                  <span className="vsx-title">{pickLang(v.title, lang)}</span>
                  {(pickLang(v.description, lang, { warn: false })) && (
                    <span className="vsx-desc">{pickLang(v.description, lang, { warn: false })}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="ui-card ui-card--sunken vsx-empty">
            <Icon name="videos" size={26} />
            <p>{l.noVideos}</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            current={currentPage}
            total={totalPages}
            onChange={setPageNum}
            color="var(--brand)"
          />
        )}
      </div>

      {/* Video pəncərəsi — Portal ilə body-yə (heç bir valideyn transform-undan asılı deyil) */}
      {playingVideo && createPortal(
        <div className="vsx-modal" onClick={() => setPlayingVideo(null)}>
          <div
            className="vsx-modal-content"
            role="dialog"
            aria-modal="true"
            aria-label={pickLang(playingVideo.title, lang)}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="ui-icon-btn vsx-modal-close" onClick={() => setPlayingVideo(null)} aria-label={l.close} title={l.close} autoFocus>
              <Icon name="close" size={18} />
            </button>
            <div className="vsx-modal-video">
              <iframe
                src={getEmbedUrl(playingVideo.youtubeId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={pickLang(playingVideo.title, lang)}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="vsx-modal-title">{pickLang(playingVideo.title, lang)}</p>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
