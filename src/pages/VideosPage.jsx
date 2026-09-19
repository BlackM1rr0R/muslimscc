import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { VIDEO_CATEGORIES, getThumbnail, getEmbedUrl, DEFAULT_VIDEOS, subscribeToVideos } from '../data/videos'
import Pagination from '../components/Pagination'
import { useBackToClose } from '../utils/useBackToClose'
import { useSheetDrag } from '../hooks/useSheetDrag'
import '../styles/VideosPage.css'

const LABELS = {
  az: { title:'Video Kitabxana', subtitle:'İslami mühazirələr, Quran tilavətləri və daha çox', search:'Video axtar...', all:'Hamısı', featured:'Seçilmişlər', latest:'Ən son', allVideos:'Bütün videolar', moreVideos:'Digər videolar', filter:'Filtr', noResults:'Video tapılmadı', loading:'Yüklənir...', videos:'video', watchNow:'İndi izlə', share:'Paylaş', shared:'Kopyalandı!', close:'Bağla', clear:'Təmizlə' },
  en: { title:'Video Library', subtitle:'Islamic lectures, Quran recitations and more', search:'Search videos...', all:'All', featured:'Featured', latest:'Latest', allVideos:'All Videos', moreVideos:'More videos', filter:'Filter', noResults:'No videos found', loading:'Loading...', videos:'videos', watchNow:'Watch Now', share:'Share', shared:'Copied!', close:'Close', clear:'Clear' },
  ru: { title:'Видео Библиотека', subtitle:'Исламские лекции, чтение Корана и многое другое', search:'Поиск видео...', all:'Все', featured:'Избранные', latest:'Последние', allVideos:'Все видео', moreVideos:'Другие видео', filter:'Фильтр', noResults:'Видео не найдены', loading:'Загрузка...', videos:'видео', watchNow:'Смотреть', share:'Поделиться', shared:'Скопировано!', close:'Закрыть', clear:'Очистить' },
  ar: { title:'مكتبة الفيديو', subtitle:'محاضرات إسلامية وتلاوات قرآنية والمزيد', search:'البحث عن فيديو...', all:'الكل', featured:'مميز', latest:'الأحدث', allVideos:'كل الفيديوهات', moreVideos:'فيديوهات أخرى', filter:'تصفية', noResults:'لا توجد فيديوهات', loading:'جارٍ التحميل...', videos:'فيديو', watchNow:'شاهد الآن', share:'مشاركة', shared:'تم النسخ!', close:'إغلاق', clear:'مسح' },
  tr: { title:'Video Kütüphanesi', subtitle:'İslami konferanslar, Kuran tilavetleri ve daha fazlası', search:'Video ara...', all:'Tümü', featured:'Öne çıkanlar', latest:'En yeni', allVideos:'Tüm videolar', moreVideos:'Diğer videolar', filter:'Filtre', noResults:'Video bulunamadı', loading:'Yükleniyor...', videos:'video', watchNow:'Şimdi izle', share:'Paylaş', shared:'Kopyalandı!', close:'Kapat', clear:'Temizle' },
}

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// ilk ekrandakılar 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz
const revealProps = (i) => ({
  'data-reveal': '',
  ...(i > 0 && i < 6 ? { 'data-reveal-delay': String(i * 40) } : {}),
})

// Telefonda (<768px) video pəncərəsi aşağıdan qalxan vərəqdir (VideosPage.css):
// tutacaqdan aşağı çəkib bağlamaq olar, bağlananda aşağı sürüşüb gedir.
// Kompüterdə əvvəlki mərkəzi pəncərə dərhal bağlanır.
const SHEET_MQ = '(max-width: 767.98px)'
const SHEET_EXIT_MS = 240
function isSheetMode() {
  try { return window.matchMedia(SHEET_MQ).matches } catch { return false }
}
function sheetExitMs() {
  try {
    if (!isSheetMode()) return 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0
    return SHEET_EXIT_MS
  } catch { return 0 }
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

  // Seçilmişlər yalnız video çox olanda (>6) və yalnız "Hamısı" + axtarışsız
  // görünüşdə — o zaman onlar aşağıdakı şəbəkədə TƏKRAR göstərilmir
  const showFeatured = !search && selectedCat === 'all' && videos.length > 6
  const featured = useMemo(() => (showFeatured ? videos.slice(0, 3) : []), [videos, showFeatured])

  // Filtr çipləri: yalnız ən azı bir videosu olan bölmələr
  const categories = useMemo(
    () => VIDEO_CATEGORIES.filter(c => c.key === 'all' || videos.some(v => v.category === c.key)),
    [videos]
  )

  // Filter & search
  const filtered = useMemo(() => {
    let list = videos
    if (featured.length) {
      const ids = new Set(featured.map(v => v.id))
      list = list.filter(v => !ids.has(v.id))
    }
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
  }, [videos, featured, selectedCat, search, lang])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  // Səhifə dəyişəndə şəbəkənin başlığına qalx (hero-ya yox)
  const gridTopRef = useRef(null)
  const goToPage = (n) => {
    setPageNum(n)
    requestAnimationFrame(() => gridTopRef.current?.scrollIntoView({ block: 'start' }))
  }

  // Video pəncərəsi: telefonda "Geri" və klaviaturada Esc onu bağlasın.
  // Telefonda vərəq əvvəlcə aşağı sürüşür (is-closing), sonra silinir.
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef(0)
  const closeVideo = useCallback(() => {
    const ms = sheetExitMs()
    if (!ms) { setPlayingVideo(null); return }
    if (closeTimerRef.current) return // artıq bağlanır
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = 0
      setClosing(false)
      setPlayingVideo(null)
    }, ms)
  }, [])
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])
  useBackToClose(Boolean(playingVideo), closeVideo)
  useEffect(() => {
    if (!playingVideo) return undefined
    const onKey = (e) => { if (e.key === 'Escape') closeVideo() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playingVideo, closeVideo])

  // Pəncərə açılanda fokus "bağla" düyməsinə keçir, bağlananda əvvəlki
  // elementə qayıdır; telefonda arxadakı səhifə sürüşmür
  const sheetRef = useRef(null)
  const closeBtnRef = useRef(null)
  const sheetDrag = useSheetDrag(sheetRef, closeVideo)
  const isOpen = Boolean(playingVideo)
  useEffect(() => {
    if (!isOpen) return undefined
    const prevFocus = document.activeElement
    closeBtnRef.current?.focus({ preventScroll: true })
    const body = document.body
    const locked = isSheetMode()
    const prevOverflow = body.style.overflow
    if (locked) body.style.overflow = 'hidden'
    return () => {
      if (locked) body.style.overflow = prevOverflow
      if (prevFocus && prevFocus.isConnected && typeof prevFocus.focus === 'function') {
        prevFocus.focus({ preventScroll: true })
      }
    }
  }, [isOpen])

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
        <h1 className="vp-hero-title"><span aria-hidden="true">📹</span> {l.title}</h1>
        <p className="vp-hero-sub">{l.subtitle}</p>
        {/* Yalnız real məzmun sayı (əvvəlki "FİLTR 5" bölmə sayı idi) */}
        <div className="vp-hero-stats">
          <div className="vp-stat">
            <span className="vp-stat-num">{videos.length}</span>
            <span className="vp-stat-label">{l.videos}</span>
          </div>
        </div>
      </div>

      <div className="vp-container">

        {/* ═══ SEARCH BAR ═══ */}
        <div className="vp-search-wrap">
          <span className="vp-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="vp-search"
            aria-label={l.search}
            placeholder={l.search}
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="vp-search-clear" onClick={() => setSearch('')} aria-label={l.clear} title={l.clear}>✕</button>
          )}
        </div>

        {/* ═══ FEATURED (axtarış yox, "Hamısı" seçili və video > 6) ═══ */}
        {featured.length > 0 && (
          <section className="vp-section">
            <h2 className="vp-section-title">
              <span>⭐</span> {l.featured}
            </h2>
            <div className="vp-featured-grid" data-reveal="stagger">
              {featured.map((v, i) => {
                const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
                return (
                  <article
                    key={v.id}
                    className={`vp-featured-card ${i === 0 ? 'large' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPlayingVideo(v)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPlayingVideo(v) } }}
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

        {/* ═══ CATEGORY FILTER ═══
            Yalnız bir dolu bölmə varsa filtr mənasızdır ("Hamısı" = həmin bölmə) — gizlədirik */}
        {categories.length > 2 && (
        <section className="vp-section">
          <h2 className="vp-section-title vp-filter-title">
            <span>📂</span> {l.filter}
          </h2>
          {/* Telefonda başlıq gizlənir, çiplər bir sürüşən sətirdir */}
          <div className="vp-cat-filter" role="group" aria-label={l.filter}>
            {categories.map(cat => {
              const active = selectedCat === cat.key
              const count = cat.key === 'all'
                ? videos.length
                : videos.filter(v => v.category === cat.key).length
              // "Hamısı" saytın əsas yaşılı ilə (boz #64748b yox); digərləri bölmə rəngi
              const activeStyle = cat.key === 'all'
                ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: 'var(--on-primary)' }
                : { backgroundColor: cat.color, borderColor: cat.color, color: '#fff' }
              return (
                <button
                  type="button"
                  key={cat.key}
                  className={`vp-cat-btn ${active ? 'active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setSelectedCat(cat.key)}
                  style={active ? activeStyle : { '--cat-color': cat.key === 'all' ? 'var(--primary)' : cat.color }}
                >
                  <span>{cat.label[lang] || cat.label.en}</span>
                  <span className="vp-cat-count">{count}</span>
                </button>
              )
            })}
          </div>
        </section>
        )}

        {/* ═══ ALL VIDEOS ═══ */}
        <section className="vp-section">
          <h2 className="vp-section-title" ref={gridTopRef}>
            <span>🎬</span> {selectedCat !== 'all'
              ? VIDEO_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]
              : featured.length ? l.moreVideos : l.allVideos}
            <span className="vp-section-count">{filtered.length}</span>
          </h2>

          {loading ? (
            // Yüklənmə: fırlanan dairə əvəzinə kartların "skelet"i (motion.css → .skeleton)
            <div className="vp-grid" role="status" aria-label={l.loading}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="vp-skel-card" aria-hidden="true">
                  <div className="skeleton vp-skel-thumb" />
                  <div className="vp-skel-body">
                    <span className="skeleton skeleton--text" style={{ width: '80%' }} />
                    <span className="skeleton skeleton--text" style={{ width: '50%' }} />
                    <span className="skeleton vp-skel-btn" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="vp-empty">
              <div className="vp-empty-icon">📹</div>
              <p>{l.noResults}</p>
            </div>
          ) : (
            <div className="vp-grid">
              {paginated.map((v, i) => {
                const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
                return (
                  <article key={v.id} className="vp-card" onClick={() => setPlayingVideo(v)} {...revealProps(i)}>
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
                          aria-label={l.share}
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
            <Pagination current={currentPage} total={totalPages} onChange={goToPage} color="var(--primary)" />
          )}
        </section>
      </div>

      {/* ═══ VIDEO PLAYER MODAL — Portal ilə body-yə render olunur ═══ */}
      {playingVideo && createPortal(
        <div className={`vp-modal${closing ? ' is-closing' : ''}`} onClick={closeVideo}>
          <div
            className="vp-modal-content"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={playingVideo.title?.[lang] || playingVideo.title?.en}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Telefonda tutacaq — aşağı çəkib bağlamaq (kompüterdə gizli) */}
            <div className="m-sheet-grab vp-sheet-grab" {...sheetDrag}>
              <span className="m-sheet-handle" />
            </div>
            <button type="button" ref={closeBtnRef} className="vp-modal-close" onClick={closeVideo} aria-label={l.close} title={l.close}>✕</button>
            <div className="vp-modal-video-wrap">
              <iframe
                className="vp-modal-iframe"
                src={getEmbedUrl(playingVideo.youtubeId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
      {/* <body>-yə — açıq video vərəqinin də üstündə görünsün */}
      {shareToast && createPortal(
        <div className="vp-share-toast">
          ✅ {l.shared}
        </div>,
        document.body
      )}
    </div>
  )
}
