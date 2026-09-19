import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { BOOK_CATEGORIES, DEFAULT_BOOKS, subscribeToBooks, getDefaultCover } from '../data/books'
import Pagination from '../components/Pagination'
import { useBackToClose } from '../utils/useBackToClose'
import { useSheetDrag } from '../hooks/useSheetDrag'
import '../styles/BooksPage.css'

const LABELS = {
  az: { title:'Kitabxana', subtitle:'İslami kitablar, təfsirlər və elm əsərləri', search:'Kitab axtar...', filter:'Filtr', featured:'Seçilmiş Kitablar', allBooks:'Bütün Kitablar', moreBooks:'Digər kitablar', noResults:'Kitab tapılmadı', loading:'Yüklənir...', books:'kitab', author:'Müəllif', read:'Oxu', preview:'Önizlə', readPdf:'PDF açın', noPdf:'PDF mövcud deyil', pages:'səhifə', year:'İl', share:'Paylaş', shared:'Kopyalandı!', close:'Bağla', clear:'Təmizlə' },
  en: { title:'Library', subtitle:'Islamic books, tafsirs and scholarly works', search:'Search books...', filter:'Filter', featured:'Featured Books', allBooks:'All Books', moreBooks:'More books', noResults:'No books found', loading:'Loading...', books:'books', author:'Author', read:'Read', preview:'Preview', readPdf:'Open PDF', noPdf:'PDF not available', pages:'pages', year:'Year', share:'Share', shared:'Copied!', close:'Close', clear:'Clear' },
  ru: { title:'Библиотека', subtitle:'Исламские книги, тафсиры и научные труды', search:'Поиск книг...', filter:'Фильтр', featured:'Избранные книги', allBooks:'Все книги', moreBooks:'Другие книги', noResults:'Книги не найдены', loading:'Загрузка...', books:'книг', author:'Автор', read:'Читать', preview:'Просмотр', readPdf:'Открыть PDF', noPdf:'PDF недоступен', pages:'страниц', year:'Год', share:'Поделиться', shared:'Скопировано!', close:'Закрыть', clear:'Очистить' },
  ar: { title:'المكتبة', subtitle:'كتب إسلامية وتفاسير وأعمال علمية', search:'البحث عن كتاب...', filter:'تصفية', featured:'كتب مميزة', allBooks:'كل الكتب', moreBooks:'كتب أخرى', noResults:'لا توجد كتب', loading:'جارٍ التحميل...', books:'كتاب', author:'المؤلف', read:'اقرأ', preview:'معاينة', readPdf:'فتح PDF', noPdf:'PDF غير متاح', pages:'صفحة', year:'السنة', share:'مشاركة', shared:'تم النسخ!', close:'إغلاق', clear:'مسح' },
  tr: { title:'Kütüphane', subtitle:'İslami kitaplar, tefsirler ve ilmi eserler', search:'Kitap ara...', filter:'Filtre', featured:'Öne Çıkan Kitaplar', allBooks:'Tüm Kitaplar', moreBooks:'Diğer kitaplar', noResults:'Kitap bulunamadı', loading:'Yükleniyor...', books:'kitap', author:'Yazar', read:'Oku', preview:'Önizle', readPdf:'PDF aç', noPdf:'PDF mevcut değil', pages:'sayfa', year:'Yıl', share:'Paylaş', shared:'Kopyalandı!', close:'Kapat', clear:'Temizle' },
}

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// ilk ekrandakılar 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz
const revealProps = (i) => ({
  'data-reveal': '',
  ...(i > 0 && i < 6 ? { 'data-reveal-delay': String(i * 40) } : {}),
})

// Telefonda (<768px) kitab pəncərəsi aşağıdan qalxan vərəqdir (BooksPage.css):
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

export default function BooksPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [shareToast, setShareToast] = useState(false)
  const [pageNum, setPageNum] = useState(1)
  const PER_PAGE = 12

  // Filter dəyişəndə pagination-u sıfırla
  useEffect(() => { setPageNum(1) }, [selectedCat, search])

  useEffect(() => {
    const unsubscribe = subscribeToBooks((items) => {
      setBooks(items.length > 0 ? items : DEFAULT_BOOKS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  // Seçilmişlər yalnız kitab çox olanda (>8) və yalnız "Hamısı" + axtarışsız
  // görünüşdə — o zaman onlar aşağıdakı şəbəkədə TƏKRAR göstərilmir
  const showFeatured = !search && selectedCat === 'all' && books.length > 8
  const featured = useMemo(() => (showFeatured ? books.slice(0, 4) : []), [books, showFeatured])

  // Filtr çipləri: yalnız ən azı bir kitabı olan bölmələr (boş çip "0" nəticə verirdi)
  const categories = useMemo(
    () => BOOK_CATEGORIES.filter(c => c.key === 'all' || books.some(b => b.category === c.key)),
    [books]
  )

  const filtered = useMemo(() => {
    let list = books
    if (featured.length) {
      const ids = new Set(featured.map(b => b.id))
      list = list.filter(b => !ids.has(b.id))
    }
    if (selectedCat !== 'all') {
      list = list.filter(b => b.category === selectedCat)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b => {
        const title = (b.title?.[lang] || b.title?.en || '').toLowerCase()
        const author = (b.author?.[lang] || b.author?.en || '').toLowerCase()
        const desc = (b.description?.[lang] || b.description?.en || '').toLowerCase()
        return title.includes(q) || author.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [books, featured, selectedCat, search, lang])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(pageNum, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  // Səhifə dəyişəndə şəbəkənin başlığına qalx (səhifənin ən yuxarısına — hero-ya yox)
  const gridTopRef = useRef(null)
  const goToPage = (n) => {
    setPageNum(n)
    requestAnimationFrame(() => gridTopRef.current?.scrollIntoView({ block: 'start' }))
  }

  // Modal: telefonda "Geri" və klaviaturada Esc onu bağlasın.
  // Telefonda vərəq əvvəlcə aşağı sürüşür (is-closing), sonra silinir.
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef(0)
  const closeBook = useCallback(() => {
    const ms = sheetExitMs()
    if (!ms) { setSelectedBook(null); return }
    if (closeTimerRef.current) return // artıq bağlanır
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = 0
      setClosing(false)
      setSelectedBook(null)
    }, ms)
  }, [])
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])
  useBackToClose(Boolean(selectedBook), closeBook)
  useEffect(() => {
    if (!selectedBook) return undefined
    const onKey = (e) => { if (e.key === 'Escape') closeBook() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedBook, closeBook])

  // Vərəq/pəncərə açılanda fokus "bağla" düyməsinə keçir, bağlananda
  // əvvəlki elementə qayıdır; telefonda arxadakı səhifə sürüşmür
  const sheetRef = useRef(null)
  const closeBtnRef = useRef(null)
  const sheetDrag = useSheetDrag(sheetRef, closeBook)
  const isOpen = Boolean(selectedBook)
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

  const handleShare = async (b) => {
    const title = b.title?.[lang] || b.title?.en
    const author = b.author?.[lang] || b.author?.en
    const text = `📚 ${title} — ${author}`
    if (navigator.share) {
      try { await navigator.share({ title, text, url: b.pdfUrl || window.location.href }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text + (b.pdfUrl ? `\n${b.pdfUrl}` : ''))
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      } catch {}
    }
  }

  const renderCover = (b, size = 'normal') => {
    const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
    if (b.coverUrl) {
      return (
        <img
          src={b.coverUrl}
          alt={b.title?.[lang] || b.title?.en}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bp-cover-fallback') }}
        />
      )
    }
    return (
      <div className="bp-cover-placeholder" style={{background: `linear-gradient(135deg, ${cat?.color || '#10b981'}, ${cat?.color || '#10b981'}dd)`}}>
        <div className="bp-cover-icon">📖</div>
        <div className="bp-cover-cat">{cat?.label[lang] || cat?.label.en}</div>
      </div>
    )
  }

  return (
    <div className="books-page">

      {/* ═══ HERO ═══ */}
      <div className="bp-hero">
        <div className="bp-hero-arabic">مَكْتَبَةُ الْكُتُبِ</div>
        <h1 className="bp-hero-title"><span aria-hidden="true">📚</span> {l.title}</h1>
        <p className="bp-hero-sub">{l.subtitle}</p>
        {/* Yalnız real məzmun sayı (əvvəlki "FİLTR 9" bölmə sayı idi, məzmun deyil) */}
        <div className="bp-hero-stats">
          <div className="bp-stat">
            <span className="bp-stat-num">{books.length}</span>
            <span className="bp-stat-label">{l.books}</span>
          </div>
        </div>
      </div>

      <div className="bp-container">

        {/* ═══ SEARCH BAR ═══ */}
        <div className="bp-search-wrap">
          <span className="bp-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="bp-search"
            aria-label={l.search}
            placeholder={l.search}
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="bp-search-clear" onClick={() => setSearch('')} aria-label={l.clear} title={l.clear}>✕</button>
          )}
        </div>

        {/* ═══ FEATURED (axtarış yox, "Hamısı" seçili və kitab > 8) ═══ */}
        {featured.length > 0 && (
          <section className="bp-section">
            <h2 className="bp-section-title">
              <span>⭐</span> {l.featured}
            </h2>
            <div className="bp-featured-row" data-reveal="stagger">
              {featured.map(b => {
                const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
                return (
                  <article
                    key={b.id}
                    className="bp-featured-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedBook(b)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedBook(b) } }}
                  >
                    <div className="bp-featured-cover">
                      {renderCover(b)}
                      <div className="bp-featured-overlay">
                        <div className="bp-featured-overlay-btn">📖 {l.preview}</div>
                      </div>
                      {cat && (
                        <div className="bp-featured-badge" style={{background: cat.color}}>
                          {cat.label[lang] || cat.label.en}
                        </div>
                      )}
                      {b.pdfUrl && (
                        <span className="bp-pdf-badge">📄 PDF</span>
                      )}
                    </div>
                    <div className="bp-featured-body">
                      <h3>{b.title?.[lang] || b.title?.en}</h3>
                      <p className="bp-featured-author">✍️ {b.author?.[lang] || b.author?.en}</p>
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
        <section className="bp-section">
          <h2 className="bp-section-title bp-filter-title">
            <span>📂</span> {l.filter}
          </h2>
          {/* Telefonda başlıq gizlənir, çiplər bir sürüşən sətirdir */}
          <div className="bp-cat-filter" role="group" aria-label={l.filter}>
            {categories.map(cat => {
              const active = selectedCat === cat.key
              const count = cat.key === 'all'
                ? books.length
                : books.filter(b => b.category === cat.key).length
              // "Hamısı" saytın əsas yaşılı ilə (boz #64748b yox); digərləri bölmə rəngi
              const activeStyle = cat.key === 'all'
                ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: 'var(--on-primary)' }
                : { backgroundColor: cat.color, borderColor: cat.color, color: '#fff' }
              return (
                <button
                  type="button"
                  key={cat.key}
                  className={`bp-cat-btn ${active ? 'active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setSelectedCat(cat.key)}
                  style={active ? activeStyle : { '--cat-color': cat.key === 'all' ? 'var(--primary)' : cat.color }}
                >
                  <span>{cat.label[lang] || cat.label.en}</span>
                  <span className="bp-cat-count">{count}</span>
                </button>
              )
            })}
          </div>
        </section>
        )}

        {/* ═══ ALL BOOKS ═══ */}
        <section className="bp-section">
          <h2 className="bp-section-title" ref={gridTopRef}>
            <span>📖</span> {selectedCat !== 'all'
              ? BOOK_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]
              : featured.length ? l.moreBooks : l.allBooks}
            <span className="bp-section-count">{filtered.length}</span>
          </h2>

          {loading ? (
            // Yüklənmə: fırlanan dairə əvəzinə kartların "skelet"i (motion.css → .skeleton)
            <div className="bp-grid" role="status" aria-label={l.loading}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bp-skel-card" aria-hidden="true">
                  <div className="skeleton bp-skel-cover" />
                  <div className="bp-skel-body">
                    <span className="skeleton skeleton--text" style={{ width: '85%' }} />
                    <span className="skeleton skeleton--text" style={{ width: '55%' }} />
                    <span className="skeleton bp-skel-btn" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bp-empty">
              <div className="bp-empty-icon">📚</div>
              <p>{l.noResults}</p>
            </div>
          ) : (
            <div className="bp-grid">
              {paginated.map((b, i) => {
                const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
                return (
                  <article key={b.id} className="bp-card" onClick={() => setSelectedBook(b)} {...revealProps(i)}>
                    <div className="bp-cover">
                      {renderCover(b)}
                      <div className="bp-cover-overlay">
                        <div className="bp-cover-btn">📖</div>
                      </div>
                      {cat && (
                        <div className="bp-cover-badge" style={{color: cat.color}}>
                          {cat.label[lang] || cat.label.en}
                        </div>
                      )}
                      {b.pdfUrl && (
                        <span className="bp-pdf-badge">📄 PDF</span>
                      )}
                    </div>
                    <div className="bp-body">
                      <h3 className="bp-title">{b.title?.[lang] || b.title?.en}</h3>
                      <p className="bp-author">✍️ {b.author?.[lang] || b.author?.en}</p>
                      <div className="bp-meta">
                        {b.pages && <span>📄 {b.pages}</span>}
                        {b.year && <span>📅 {b.year}</span>}
                      </div>
                      <div className="bp-actions">
                        <button className="bp-read-btn" onClick={(e) => { e.stopPropagation(); setSelectedBook(b) }}>
                          📖 {l.read}
                        </button>
                        <button
                          className="bp-share-btn"
                          onClick={(e) => { e.stopPropagation(); handleShare(b) }}
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

      {/* ═══ BOOK DETAILS MODAL ═══
          Telefonda vərəq <body>-yə köçürülür: <main>-in keçid animasiyası ayrıca
          qat (stacking context) yaradır və sabit elementlər (başlıq, üzən
          kartlar) vərəqin üstündə qalırdı. Kompüterdə pəncərə əvvəlki yerindədir. */}
      {selectedBook && (() => {
        const modal = (
          <div className={`bp-modal${closing ? ' is-closing' : ''}`} onClick={closeBook}>
            <div
              className="bp-modal-content"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={selectedBook.title?.[lang] || selectedBook.title?.en}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Telefonda tutacaq — aşağı çəkib bağlamaq (kompüterdə gizli) */}
              <div className="m-sheet-grab bp-sheet-grab" {...sheetDrag}>
                <span className="m-sheet-handle" />
              </div>
              <button type="button" ref={closeBtnRef} className="bp-modal-close" onClick={closeBook} aria-label={l.close} title={l.close}>✕</button>
              <div className="bp-modal-inner">
                <div className="bp-modal-cover">
                  {renderCover(selectedBook, 'large')}
                </div>
                <div className="bp-modal-info">
                  {(() => {
                    const cat = BOOK_CATEGORIES.find(c => c.key === selectedBook.category)
                    return cat && (
                      <div className="bp-modal-cat" style={{background: cat.color}}>
                        {cat.label[lang] || cat.label.en}
                      </div>
                    )
                  })()}
                  <h2>{selectedBook.title?.[lang] || selectedBook.title?.en}</h2>
                  <p className="bp-modal-author">✍️ {selectedBook.author?.[lang] || selectedBook.author?.en}</p>

                  <div className="bp-modal-meta">
                    {selectedBook.pages && <span>📄 {selectedBook.pages} {l.pages}</span>}
                    {selectedBook.year && <span>📅 {selectedBook.year}</span>}
                  </div>

                  {(selectedBook.description?.[lang] || selectedBook.description?.en) && (
                    <p className="bp-modal-desc">{selectedBook.description[lang] || selectedBook.description.en}</p>
                  )}

                  <div className="bp-modal-actions">
                    {selectedBook.pdfUrl ? (
                      <a className="bp-modal-pdf-btn" href={selectedBook.pdfUrl} target="_blank" rel="noopener noreferrer">
                        📖 {l.readPdf}
                      </a>
                    ) : (
                      <div className="bp-modal-pdf-disabled">⛔ {l.noPdf}</div>
                    )}
                    <button className="bp-modal-share-btn" onClick={() => handleShare(selectedBook)}>
                      📤 {l.share}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        return isSheetMode() ? createPortal(modal, document.body) : modal
      })()}

      {/* ═══ SHARE TOAST ═══ */}
      {/* <body>-yə — açıq vərəqin də üstündə görünsün */}
      {shareToast && createPortal(
        <div className="bp-share-toast">
          ✅ {l.shared}
        </div>,
        document.body
      )}
    </div>
  )
}
