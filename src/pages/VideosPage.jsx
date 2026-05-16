import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { VIDEO_CATEGORIES, getThumbnail, getEmbedUrl, DEFAULT_VIDEOS, subscribeToVideos } from '../data/videos'
import Pagination from '../components/Pagination'
import '../styles/VideosPage.css'

const LABELS = {
  az: { title:'Video Kitabxana', subtitle:'İslami mühazirələr, Quran tilavətləri və daha çox', search:'Video axtar...', all:'Hamısı', featured:'Seçilmişlər', latest:'Ən son', allVideos:'Bütün videolar', filter:'Filtr', noResults:'Video tapılmadı', loading:'Yüklənir...', videos:'video', watchNow:'İndi izlə', share:'Paylaş', shared:'Kopyalandı!' },
  en: { title:'Video Library', subtitle:'Islamic lectures, Quran recitations and more', search:'Search videos...', all:'All', featured:'Featured', latest:'Latest', allVideos:'All Videos', filter:'Filter', noResults:'No videos found', loading:'Loading...', videos:'videos', watchNow:'Watch Now', share:'Share', shared:'Copied!' },
  ru: { title:'Видео Библиотека', subtitle:'Исламские лекции, чтение Корана и многое другое', search:'Поиск видео...', all:'Все', featured:'Избранные', latest:'Последние', allVideos:'Все видео', filter:'Фильтр', noResults:'Видео не найдены', loading:'Загрузка...', videos:'видео', watchNow:'Смотреть', share:'Поделиться', shared:'Скопировано!' },
  ar: { title:'مكتبة الفيديو', subtitle:'محاضرات إسلامية وتلاوات قرآنية والمزيد', search:'البحث عن فيديو...', all:'الكل', featured:'مميز', latest:'الأحدث', allVideos:'كل الفيديوهات', filter:'تصفية', noResults:'لا توجد فيديوهات', loading:'جارٍ التحميل...', videos:'فيديو', watchNow:'شاهد الآن', share:'مشاركة', shared:'تم النسخ!' },
  tr: { title:'Video Kütüphanesi', subtitle:'İslami konferanslar, Kuran tilavetleri ve daha fazlası', search:'Video ara...', all:'Tümü', featured:'Öne çıkanlar', latest:'En yeni', allVideos:'Tüm videolar', filter:'Filtre', noResults:'Video bulunamadı', loading:'Yükleniyor...', videos:'video', watchNow:'Şimdi izle', share:'Paylaş', shared:'Kopyalandı!' },
}

export default function VideosPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [playingVideo, setPlayingVideo] = useState(null)
  const [shareToast, setShareToast] = useState(false)
  const [page, setPageNum] = useState(1)
  const PER_PAGE = 12

  // Filter dəyişəndə pagination-u sıfırla
  useEffect(() => { setPageNum(1) }, [selectedCat, search])

  useEffect(() => {
    const unsubscribe = subscribeToVideos((items) => {
      setVideos(items.length > 0 ? items : DEFAULT_VIDEOS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  // Filter & search
  const filtered = useMemo(() => {
    let list = videos
    if (selectedCat !== 'all') {
      list = list.filter(v => v.category === selectedCat)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(v => {
        const title = (v.title?.[lang] || v.title?.en || '').toLowerCase()
        const desc = (v.description?.[lang] || v.description?.en || '').toLowerCase()
        return title.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [videos, selectedCat, search, lang])

  // Featured: ilk 3 video
  const featured = videos.slice(0, 3)

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  const goToPage = (n) => {
    setPageNum(n)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleShare = async (v) => {
    const url = `https://www.youtube.com/watch?v=${v.youtubeId}`
    const title = v.title?.[lang] || v.title?.en
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      } catch {}
    }
  }

  return (
    <div className="videos-page">

      {/* ═══ HERO ═══ */}
      <div className="vp-hero">
        <div className="vp-hero-arabic">مَكْتَبَةُ الفِيدِيُو</div>
        <h1 className="vp-hero-title">📹 {l.title}</h1>
        <p className="vp-hero-sub">{l.subtitle}</p>
        <div className="vp-hero-stats">
          <div className="vp-stat">
            <span className="vp-stat-num">{videos.length}</span>
            <span className="vp-stat-label">{l.videos}</span>
          </div>
          <div className="vp-stat">
            <span className="vp-stat-num">{VIDEO_CATEGORIES.length - 1}</span>
            <span className="vp-stat-label">{l.filter}</span>
          </div>
        </div>
      </div>

      <div className="vp-container">

        {/* ═══ SEARCH BAR ═══ */}
        <div className="vp-search-wrap">
          <span className="vp-search-icon">🔍</span>
          <input
            type="text"
            className="vp-search"
            placeholder={l.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="vp-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* ═══ FEATURED (yalnız search yoxsa və "all" seçilibsə) ═══ */}
        {!search && selectedCat === 'all' && featured.length > 0 && (
          <section className="vp-section">
            <h2 className="vp-section-title">
              <span>⭐</span> {l.featured}
            </h2>
            <div className="vp-featured-grid">
              {featured.map((v, i) => {
                const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
                return (
                  <article
                    key={v.id}
                    className={`vp-featured-card ${i === 0 ? 'large' : ''}`}
                    onClick={() => setPlayingVideo(v)}
                  >
                    <div className="vp-featured-thumb">
                      <img
                        src={getThumbnail(v.youtubeId)}
                        alt={v.title?.[lang] || v.title?.en}
                        onError={(e) => e.target.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                        loading="lazy"
                      />
                      <div className="vp-featured-overlay">
                        <div className="vp-featured-play">▶</div>
                      </div>
                      {cat && (
                        <div className="vp-featured-cat" style={{background: cat.color}}>
                          {cat.label[lang] || cat.label.en}
                        </div>
                      )}
                      {v.duration && v.duration !== '—' && (
                        <div className="vp-featured-duration">{v.duration}</div>
                      )}
                    </div>
                    <div className="vp-featured-body">
                      <h3>{v.title?.[lang] || v.title?.en}</h3>
                      {(v.description?.[lang] || v.description?.en) && (
                        <p>{v.description[lang] || v.description.en}</p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══ CATEGORY FILTER ═══ */}
        <section className="vp-section">
          <h2 className="vp-section-title">
            <span>📂</span> {l.filter}
          </h2>
          <div className="vp-cat-filter">
            {VIDEO_CATEGORIES.map(cat => {
              const active = selectedCat === cat.key
              const count = cat.key === 'all'
                ? videos.length
                : videos.filter(v => v.category === cat.key).length
              return (
                <button
                  key={cat.key}
                  className={`vp-cat-btn ${active ? 'active' : ''}`}
                  onClick={() => setSelectedCat(cat.key)}
                  style={active ? { backgroundColor: cat.color, borderColor: cat.color, color: '#fff' } : { '--cat-color': cat.color }}
                >
                  <span>{cat.label[lang] || cat.label.en}</span>
                  <span className="vp-cat-count">{count}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ═══ ALL VIDEOS ═══ */}
        <section className="vp-section">
          <h2 className="vp-section-title">
            <span>🎬</span> {selectedCat === 'all' ? l.allVideos : VIDEO_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]}
            <span className="vp-section-count">{filtered.length}</span>
          </h2>

          {loading ? (
            <div className="vp-loading">
              <div className="vp-spinner"></div>
              <p>{l.loading}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="vp-empty">
              <div className="vp-empty-icon">📹</div>
              <p>{l.noResults}</p>
            </div>
          ) : (
            <div className="vp-grid">
              {paginated.map(v => {
                const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
                return (
                  <article key={v.id} className="vp-card" onClick={() => setPlayingVideo(v)}>
                    <div className="vp-thumb">
                      <img
                        src={getThumbnail(v.youtubeId)}
                        alt={v.title?.[lang] || v.title?.en}
                        onError={(e) => e.target.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                        loading="lazy"
                      />
                      <div className="vp-play-btn">▶</div>
                      {cat && (
                        <div className="vp-cat-badge" style={{color: cat.color}}>
                          {cat.label[lang] || cat.label.en}
                        </div>
                      )}
                      {v.duration && v.duration !== '—' && (
                        <div className="vp-duration">{v.duration}</div>
                      )}
                    </div>
                    <div className="vp-body">
                      <h3 className="vp-title">{v.title?.[lang] || v.title?.en}</h3>
                      {(v.description?.[lang] || v.description?.en) && (
                        <p className="vp-desc">{v.description[lang] || v.description.en}</p>
                      )}
                      <div className="vp-actions">
                        <button className="vp-watch-btn" onClick={(e) => { e.stopPropagation(); setPlayingVideo(v) }}>
                          ▶ {l.watchNow}
                        </button>
                        <button
                          className="vp-share-btn"
                          onClick={(e) => { e.stopPropagation(); handleShare(v) }}
                          title={l.share}
                        >
                          📤
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Pagination current={currentPage} total={totalPages} onChange={goToPage} />
          )}
        </section>
      </div>

      {/* ═══ VIDEO PLAYER MODAL — Portal ilə body-yə render olunur ═══ */}
      {playingVideo && createPortal(
        <div className="vp-modal" onClick={() => setPlayingVideo(null)}>
          <div className="vp-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="vp-modal-close" onClick={() => setPlayingVideo(null)}>✕</button>
            <div className="vp-modal-video-wrap">
              <iframe
                className="vp-modal-iframe"
                src={getEmbedUrl(playingVideo.youtubeId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                playsInline
                title={playingVideo.title?.[lang] || playingVideo.title?.en}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="vp-modal-info">
              <h3>{playingVideo.title?.[lang] || playingVideo.title?.en}</h3>
              {(playingVideo.description?.[lang] || playingVideo.description?.en) && (
                <p>{playingVideo.description[lang] || playingVideo.description.en}</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ SHARE TOAST ═══ */}
      {shareToast && (
        <div className="vp-share-toast">
          ✅ {l.shared}
        </div>
      )}
    </div>
  )
}
