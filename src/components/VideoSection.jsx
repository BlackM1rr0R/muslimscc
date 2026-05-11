import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { VIDEO_CATEGORIES, getThumbnail, getEmbedUrl, DEFAULT_VIDEOS, subscribeToVideos } from '../data/videos'

const LABELS = {
  az: { title:'Video Kontent', sub:'Mühazirələr, tilavətlər və daha çoxu', noVideos:'Hələ video əlavə olunmayıb', loading:'Yüklənir...', viewAll:'Hamısını gör' },
  en: { title:'Video Content', sub:'Lectures, recitations and more', noVideos:'No videos added yet', loading:'Loading...', viewAll:'View all' },
  ru: { title:'Видео Контент', sub:'Лекции, чтения и многое другое', noVideos:'Видео пока не добавлены', loading:'Загрузка...', viewAll:'Все видео' },
  ar: { title:'محتوى الفيديو', sub:'محاضرات وتلاوات والمزيد', noVideos:'لم يتم إضافة فيديوهات', loading:'جارٍ التحميل...', viewAll:'عرض الكل' },
  tr: { title:'Video İçerik', sub:'Konferanslar ve daha fazlası', noVideos:'Henüz video yok', loading:'Yükleniyor...', viewAll:'Tümünü gör' },
}

export default function VideoSection({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')
  const [playingVideo, setPlayingVideo] = useState(null)

  useEffect(() => {
    // Real-time subscriber: admin video əlavə edəndə dərhal görünür
    const unsubscribe = subscribeToVideos((items) => {
      setVideos(items.length > 0 ? items : DEFAULT_VIDEOS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  const filtered = selectedCat === 'all'
    ? videos
    : videos.filter(v => v.category === selectedCat)

  if (loading) {
    return (
      <section className="section">
        <div className="section-inner">
          <div style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>
            ⏳ {l.loading}
          </div>
        </div>
      </section>
    )
  }

  if (videos.length === 0) return null

  return (
    <section className="section video-section">
      <div className="section-inner">

        <div className="video-section-header">
          <div>
            <h2 className="video-section-title">📹 {l.title}</h2>
            <p style={{color:'var(--text-dim)', fontSize:15, margin:'4px 0 0'}}>{l.sub}</p>
          </div>
          {setPage && (
            <button
              onClick={() => { setPage('videos'); window.scrollTo({top:0, behavior:'smooth'}) }}
              style={{
                background:'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color:'#fff',
                border:'none',
                padding:'12px 22px',
                borderRadius:'999px',
                fontWeight:800,
                fontSize:13,
                cursor:'pointer',
                letterSpacing:0.3,
                boxShadow:'0 4px 14px rgba(26,107,58,0.3)',
                transition:'all 0.25s',
                display:'inline-flex',
                alignItems:'center',
                gap:6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {l.viewAll} →
            </button>
          )}
        </div>

        <div className="video-cat-filter">
          {VIDEO_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`video-cat-btn ${selectedCat === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.key)}
              style={selectedCat === cat.key ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.label[lang] || cat.label.en}
            </button>
          ))}
        </div>

        <div className="video-grid">
          {filtered.map(v => {
            const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
            return (
              <div key={v.id} className="video-card anim-fadeUp" onClick={() => setPlayingVideo(v)}>
                <div className="video-card-thumb">
                  <img
                    src={getThumbnail(v.youtubeId)}
                    alt={v.title[lang] || v.title.en}
                    onError={(e) => e.target.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                    loading="lazy"
                  />
                  <div className="video-card-play">▶</div>
                  <div className="video-card-cat" style={{color: cat?.color}}>
                    {cat?.label[lang] || cat?.label.en || v.category}
                  </div>
                  {v.duration && v.duration !== '—' && (
                    <div className="video-card-duration">{v.duration}</div>
                  )}
                </div>
                <div className="video-card-body">
                  <h3 className="video-card-title">{v.title[lang] || v.title.en}</h3>
                  {(v.description?.[lang] || v.description?.en) && (
                    <p className="video-card-desc">{v.description[lang] || v.description.en}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>
            {l.noVideos}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="video-modal" onClick={() => setPlayingVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setPlayingVideo(null)}>✕</button>
            <iframe
              className="video-modal-iframe"
              src={`${getEmbedUrl(playingVideo.youtubeId)}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={playingVideo.title[lang] || playingVideo.title.en}
            />
          </div>
        </div>
      )}
    </section>
  )
}
