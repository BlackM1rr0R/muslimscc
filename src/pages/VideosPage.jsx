import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { VIDEO_CATEGORIES, getThumbnail, getEmbedUrl, DEFAULT_VIDEOS, subscribeToVideos } from '../data/videos'
import useInfiniteList, { useSessionState } from '../hooks/useInfiniteList'
import ListMore from '../components/ListMore'
import BackToTop from '../components/BackToTop'
import { useBackToClose } from '../utils/useBackToClose'
import { useSheetDrag } from '../hooks/useSheetDrag'
import Icon from '../components/Icon'
import '../styles/VideosPage.css'
// Admin məzmunu cari dildə yoxdursa başqa dilə düşmür (bax: utils/pickLang)
import { pickLang, hasLang } from '../utils/pickLang'

const LABELS = {
  az: { eyebrow:'Hədis və bilik', title:'Video kitabxana', subtitle:'İslami mühazirələr, Quran tilavətləri və daha çox', search:'Video axtar...', all:'Hamısı', featured:'Seçilmişlər', latest:'Ən son', allVideos:'Bütün videolar', moreVideos:'Digər videolar', filter:'Filtr', noResults:'Video tapılmadı', loading:'Yüklənir...', videos:'video', watchNow:'İndi izlə', share:'Paylaş', shared:'Kopyalandı!', close:'Bağla', clear:'Təmizlə' },
  en: { eyebrow:'Hadith & knowledge', title:'Video Library', subtitle:'Islamic lectures, Quran recitations and more', search:'Search videos...', all:'All', featured:'Featured', latest:'Latest', allVideos:'All Videos', moreVideos:'More videos', filter:'Filter', noResults:'No videos found', loading:'Loading...', videos:'videos', watchNow:'Watch Now', share:'Share', shared:'Copied!', close:'Close', clear:'Clear' },
  ru: { eyebrow:'Хадисы и знание', title:'Видео Библиотека', subtitle:'Исламские лекции, чтение Корана и многое другое', search:'Поиск видео...', all:'Все', featured:'Избранные', latest:'Последние', allVideos:'Все видео', moreVideos:'Другие видео', filter:'Фильтр', noResults:'Видео не найдены', loading:'Загрузка...', videos:'видео', watchNow:'Смотреть', share:'Поделиться', shared:'Скопировано!', close:'Закрыть', clear:'Очистить' },
  ar: { eyebrow:'الحديث والعلم', title:'مكتبة الفيديو', subtitle:'محاضرات إسلامية وتلاوات قرآنية والمزيد', search:'البحث عن فيديو...', all:'الكل', featured:'مميز', latest:'الأحدث', allVideos:'كل الفيديوهات', moreVideos:'فيديوهات أخرى', filter:'تصفية', noResults:'لا توجد فيديوهات', loading:'جارٍ التحميل...', videos:'فيديو', watchNow:'شاهد الآن', share:'مشاركة', shared:'تم النسخ!', close:'إغلاق', clear:'مسح' },
  tr: { eyebrow:'Hadis ve ilim', title:'Video Kütüphanesi', subtitle:'İslami konferanslar, Kuran tilavetleri ve daha fazlası', search:'Video ara...', all:'Tümü', featured:'Öne çıkanlar', latest:'En yeni', allVideos:'Tüm videolar', moreVideos:'Diğer videolar', filter:'Filtre', noResults:'Video bulunamadı', loading:'Yükleniyor...', videos:'video', watchNow:'Şimdi izle', share:'Paylaş', shared:'Kopyalandı!', close:'Kapat', clear:'Temizle' },
}

// Sonsuz sürüşmənin bir partiyası
const BATCH = 12

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// hər yeni partiyanın ilk 6 kartı 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz
const revealProps = (i) => {
  const j = i % BATCH
  return { 'data-reveal': '', ...(j > 0 && j < 6 ? { 'data-reveal-delay': String(j * 40) } : {}) }
}

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

  const [allVideos, setVideos] = useState([])
  // Başlığı cari dildə olmayan admin məzmunu bu dildə göstərilmir (başqa dilə düşmür)
  const videos = useMemo(() => allVideos.filter(v => hasLang(v.title, lang)), [allVideos, lang])
  const [loading, setLoading] = useState(true)
  // Filtrlər sessionStorage-də — geri qayıdanda siyahının mövqeyi ilə birlikdə bərpa olunur
  const [selectedCat, setSelectedCat] = useSessionState('videos:cat', 'all')
  const [search, setSearch] = useSessionState('videos:q', '')
  const [playingVideo, setPlayingVideo] = useState(null)
  const [shareToast, setShareToast] = useState(false)

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
        const title = (pickLang(v.title, lang) || '').toLowerCase()
        const desc = (pickLang(v.description, lang, { warn: false }) || '').toLowerCase()
        return title.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [videos, featured, selectedCat, search, lang])

  // Sonsuz sürüşmə — filtr/axtarış/dil dəyişəndə siyahı əvvəldən başlayır və
  // (şəbəkənin ortasında idisə) onun başlığına qalxır (hero-ya yox)
  const gridTopRef = useRef(null)
  const inf = useInfiniteList({
    total: filtered.length,
    batch: BATCH,
    resetKey: `${lang}|${selectedCat}|${search.trim()}`,
    storageKey: 'videos',
    ready: !loading,
    onReset: () => {
      const el = gridTopRef.current
      if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ block: 'start' })
    },
  })
  const paginated = filtered.slice(0, inf.count)

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
    const title = pickLang(v.title, lang)
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

  // Miniatür — YouTube şəkli; yüklənməsə hqdefault-a düşür
  const thumb = (v) => (
    <img
      src={getThumbnail(v.youtubeId)}
      alt=""
      onError={(e) => { if (!e.target.dataset.fb) { e.target.dataset.fb = '1'; e.target.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` } }}
      loading="lazy"
    />
  )
  // Miniatürün üstündəki sakit nişanlar (bölmə + müddət) və oynat düyməsi
  const thumbBadges = (v) => {
    const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
    return (
      <>
        <span className="vp-play" aria-hidden="true"><Icon name="play" size={30} strokeWidth={1.5} /></span>
        {cat && <span className="vp-cat-badge">{cat.label[lang]}</span>}
        {v.duration && v.duration !== '—' && <span className="vp-duration ui-num">{v.duration}</span>}
      </>
    )
  }

  return (
    <div className="videos-page">

      {/* ═══ HERO ═══ */}
      <header className="ui-page-hero vp-hero2">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{l.eyebrow}</span>
          <h1 className="ui-display">{l.title}</h1>
          {lang !== 'ar' && <p className="vp-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">مَكْتَبَةُ الفِيدِيُو</p>}
          <p className="ui-lead">{l.subtitle}</p>
          {/* Yalnız real məzmun sayı (yüklənəndə gizli — "0 video" görünməsin) */}
          {!loading && videos.length > 0 && (
            <div className="vp-hero-stats" data-reveal="fade">
              <div className="ui-stat">
                <span className="ui-stat__num" data-count={videos.length}>{videos.length}</span>
                <span className="ui-stat__label">{l.videos}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="ui-container vp-container">

        {/* ═══ AXTARIŞ ═══ */}
        <div className="vp-search-wrap">
          <Icon name="search" size={19} className="vp-search-icon" />
          <input
            type="search"
            className="ui-input vp-search"
            aria-label={l.search}
            placeholder={l.search}
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="ui-icon-btn vp-search-clear" onClick={() => setSearch('')} aria-label={l.clear} title={l.clear}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* ═══ SEÇİLMİŞLƏR (axtarış yox, "Hamısı" seçili və video > 6) ═══ */}
        {featured.length > 0 && (
          <section className="vp-section">
            <div className="vp-section-head" data-reveal>
              <h2 className="ui-title ui-title--sm vp-section-title">
                <Icon name="star" size={20} className="vp-section-ic" /> {l.featured}
              </h2>
            </div>
            <div className="vp-featured-grid" data-reveal="stagger-zoom">
              {featured.map((v, i) => (
                <article
                  key={v.id}
                  className={`ui-card ui-card--flush ui-card--interactive vp-featured-card${i === 0 ? ' large' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={pickLang(v.title, lang)}
                  onClick={() => setPlayingVideo(v)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPlayingVideo(v) } }}
                >
                  <div className="vp-thumb">
                    {thumb(v)}
                    {thumbBadges(v)}
                  </div>
                  <div className="vp-body">
                    <h3 className="vp-title">{pickLang(v.title, lang)}</h3>
                    {(pickLang(v.description, lang, { warn: false })) && (
                      <p className="vp-desc">{pickLang(v.description, lang, { warn: false })}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ═══ FİLTR ═══
            Yalnız bir dolu bölmə varsa filtr mənasızdır ("Hamısı" = həmin bölmə) — gizlədirik */}
        {categories.length > 2 && (
          <div className="vp-cat-filter" role="group" aria-label={l.filter} data-reveal="stagger-fade">
            {categories.map(cat => {
              const active = selectedCat === cat.key
              const count = cat.key === 'all'
                ? videos.length
                : videos.filter(v => v.category === cat.key).length
              return (
                <button
                  type="button"
                  key={cat.key}
                  className="ui-chip vp-cat-btn"
                  aria-pressed={active}
                  onClick={() => setSelectedCat(cat.key)}
                >
                  <span>{cat.label[lang]}</span>
                  <span className="vp-cat-count ui-num">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ═══ BÜTÜN VİDEOLAR ═══ */}
        <section className="vp-section">
          <div className="vp-section-head" ref={gridTopRef}>
            <h2 className="ui-title ui-title--sm vp-section-title">
              <Icon name="videos" size={20} className="vp-section-ic" /> {selectedCat !== 'all'
                ? VIDEO_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]
                : featured.length ? l.moreVideos : l.allVideos}
            </h2>
            {!loading && <span className="ui-badge vp-section-count ui-num">{filtered.length}</span>}
          </div>

          {loading ? (
            // Yüklənmə: kartların "skelet"i (motion.css → .skeleton)
            <div className="vp-grid" role="status" aria-label={l.loading}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="ui-card ui-card--flush vp-skel-card" aria-hidden="true">
                  <div className="skeleton vp-skel-thumb" />
                  <div className="vp-skel-body">
                    <span className="skeleton skeleton--text" style={{ width: '80%' }} />
                    <span className="skeleton skeleton--text" style={{ width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken vp-empty" data-reveal="scale">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="videos" /></span>
              <p className="vp-empty-title">{l.noResults}</p>
              {(search || selectedCat !== 'all') && (
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setSelectedCat('all') }}>
                  <Icon name="close" className="ui-btn__icon" /> {l.clear}
                </button>
              )}
            </div>
          ) : (
            // Açar filtr/səhifə dəyişəndə şəbəkəni yenidən qurur — kartlar yenidən növbə ilə görünür
            <div className="vp-grid" key={selectedCat}>
              {paginated.map((v, i) => (
                <article key={v.id} className="ui-card ui-card--flush ui-card--interactive vp-card" onClick={() => setPlayingVideo(v)} {...revealProps(i)}>
                  <div className="vp-thumb">
                    {thumb(v)}
                    {thumbBadges(v)}
                  </div>
                  <div className="vp-body">
                    <h3 className="vp-title">{pickLang(v.title, lang)}</h3>
                    {(pickLang(v.description, lang, { warn: false })) && (
                      <p className="vp-desc">{pickLang(v.description, lang, { warn: false })}</p>
                    )}
                    <div className="vp-actions">
                      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm vp-watch-btn" onClick={(e) => { e.stopPropagation(); setPlayingVideo(v) }}>
                        <Icon name="play" className="ui-btn__icon" /> {l.watchNow}
                      </button>
                      <button
                        type="button"
                        className="ui-icon-btn vp-share-btn"
                        onClick={(e) => { e.stopPropagation(); handleShare(v) }}
                        title={l.share}
                        aria-label={l.share}
                      >
                        <Icon name="share" size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Sonsuz sürüşmə: altda skeleton + "Daha çox göstər", sonda "Hamısı göstərildi" */}
          {!loading && (
            <ListMore {...inf} endText={`${filtered.length} ${l.videos}`} minForEnd={BATCH} skeleton={
              <div className="vp-grid" aria-hidden="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="ui-card ui-card--flush vp-skel-card">
                    <div className="skeleton vp-skel-thumb" />
                    <div className="vp-skel-body">
                      <span className="skeleton skeleton--text" style={{ width: '80%' }} />
                      <span className="skeleton skeleton--text" style={{ width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            } />
          )}
        </section>
      </div>

      {/* ═══ VİDEO PƏNCƏRƏSİ — Portal ilə body-yə render olunur ═══ */}
      {playingVideo && createPortal(
        <div className={`vp-modal${closing ? ' is-closing' : ''}`} onClick={closeVideo}>
          <div
            className="vp-modal-content"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={pickLang(playingVideo.title, lang)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Telefonda tutacaq — aşağı çəkib bağlamaq (kompüterdə gizli) */}
            <div className="m-sheet-grab vp-sheet-grab" {...sheetDrag}>
              <span className="m-sheet-handle" />
            </div>
            <button type="button" ref={closeBtnRef} className="ui-icon-btn vp-modal-close" onClick={closeVideo} aria-label={l.close} title={l.close}>
              <Icon name="close" size={18} />
            </button>
            <div className="vp-modal-video-wrap">
              <iframe
                className="vp-modal-iframe"
                src={getEmbedUrl(playingVideo.youtubeId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                title={pickLang(playingVideo.title, lang)}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="vp-modal-info">
              <h3>{pickLang(playingVideo.title, lang)}</h3>
              {(pickLang(playingVideo.description, lang, { warn: false })) && (
                <p>{pickLang(playingVideo.description, lang, { warn: false })}</p>
              )}
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm vp-modal-share" onClick={() => handleShare(playingVideo)}>
                <Icon name="share" className="ui-btn__icon" /> {l.share}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ PAYLAŞMA BİLDİRİŞİ ═══ */}
      {/* <body>-yə — açıq video vərəqinin də üstündə görünsün */}
      {shareToast && createPortal(
        <div className="vp-share-toast" role="status">
          <Icon name="check" size={18} /> {l.shared}
        </div>,
        document.body
      )}

      <BackToTop />
    </div>
  )
}
