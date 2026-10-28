import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { BOOK_CATEGORIES, DEFAULT_BOOKS, subscribeToBooks, getDefaultCover } from '../data/books'
import useInfiniteList, { useSessionState } from '../hooks/useInfiniteList'
import ListMore from '../components/ListMore'
import BackToTop from '../components/BackToTop'
import { useBackToClose } from '../utils/useBackToClose'
import { useSheetDrag } from '../hooks/useSheetDrag'
import Icon from '../components/Icon'
import '../styles/BooksPage.css'
// Admin məzmunu cari dildə yoxdursa başqa dilə düşmür (bax: utils/pickLang)
import { pickLang, hasLang } from '../utils/pickLang'

const LABELS = {
  az: { eyebrow:'Hədis və bilik', title:'Kitabxana', subtitle:'İslami kitablar, təfsirlər və elm əsərləri', search:'Kitab axtar...', filter:'Filtr', featured:'Seçilmiş kitablar', allBooks:'Bütün kitablar', moreBooks:'Digər kitablar', noResults:'Kitab tapılmadı', loading:'Yüklənir...', books:'kitab', author:'Müəllif', read:'Oxu', preview:'Önizlə', readPdf:'PDF açın', noPdf:'PDF mövcud deyil', pages:'səhifə', year:'İl', share:'Paylaş', shared:'Kopyalandı!', close:'Bağla', clear:'Təmizlə' },
  en: { eyebrow:'Hadith & knowledge', title:'Library', subtitle:'Islamic books, tafsirs and scholarly works', search:'Search books...', filter:'Filter', featured:'Featured Books', allBooks:'All Books', moreBooks:'More books', noResults:'No books found', loading:'Loading...', books:'books', author:'Author', read:'Read', preview:'Preview', readPdf:'Open PDF', noPdf:'PDF not available', pages:'pages', year:'Year', share:'Share', shared:'Copied!', close:'Close', clear:'Clear' },
  ru: { eyebrow:'Хадисы и знание', title:'Библиотека', subtitle:'Исламские книги, тафсиры и научные труды', search:'Поиск книг...', filter:'Фильтр', featured:'Избранные книги', allBooks:'Все книги', moreBooks:'Другие книги', noResults:'Книги не найдены', loading:'Загрузка...', books:'книг', author:'Автор', read:'Читать', preview:'Просмотр', readPdf:'Открыть PDF', noPdf:'PDF недоступен', pages:'страниц', year:'Год', share:'Поделиться', shared:'Скопировано!', close:'Закрыть', clear:'Очистить' },
  ar: { eyebrow:'الحديث والعلم', title:'المكتبة', subtitle:'كتب إسلامية وتفاسير وأعمال علمية', search:'البحث عن كتاب...', filter:'تصفية', featured:'كتب مميزة', allBooks:'كل الكتب', moreBooks:'كتب أخرى', noResults:'لا توجد كتب', loading:'جارٍ التحميل...', books:'كتاب', author:'المؤلف', read:'اقرأ', preview:'معاينة', readPdf:'فتح PDF', noPdf:'PDF غير متاح', pages:'صفحة', year:'السنة', share:'مشاركة', shared:'تم النسخ!', close:'إغلاق', clear:'مسح' },
  tr: { eyebrow:'Hadis ve ilim', title:'Kütüphane', subtitle:'İslami kitaplar, tefsirler ve ilmi eserler', search:'Kitap ara...', filter:'Filtre', featured:'Öne Çıkan Kitaplar', allBooks:'Tüm Kitaplar', moreBooks:'Diğer kitaplar', noResults:'Kitap bulunamadı', loading:'Yükleniyor...', books:'kitap', author:'Yazar', read:'Oku', preview:'Önizle', readPdf:'PDF aç', noPdf:'PDF mevcut değil', pages:'sayfa', year:'Yıl', share:'Paylaş', shared:'Kopyalandı!', close:'Kapat', clear:'Temizle' },
}

// Sonsuz sürüşmənin bir partiyası
const BATCH = 12

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// hər yeni partiyanın ilk 6 kartı 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz
const revealProps = (i) => {
  const j = i % BATCH
  return { 'data-reveal': '', ...(j > 0 && j < 6 ? { 'data-reveal-delay': String(j * 40) } : {}) }
}

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

  const [allBooks, setBooks] = useState([])
  // Başlığı cari dildə olmayan admin məzmunu bu dildə göstərilmir (başqa dilə düşmür)
  const books = useMemo(() => allBooks.filter(b => hasLang(b.title, lang)), [allBooks, lang])
  const [loading, setLoading] = useState(true)
  // Filtrlər sessionStorage-də — geri qayıdanda siyahının mövqeyi ilə birlikdə bərpa olunur
  const [selectedCat, setSelectedCat] = useSessionState('books:cat', 'all')
  const [search, setSearch] = useSessionState('books:q', '')
  const [selectedBook, setSelectedBook] = useState(null)
  const [shareToast, setShareToast] = useState(false)

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
        const title = (pickLang(b.title, lang) || '').toLowerCase()
        const author = (pickLang(b.author, lang, { warn: false }) || '').toLowerCase()
        const desc = (pickLang(b.description, lang, { warn: false }) || '').toLowerCase()
        return title.includes(q) || author.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [books, featured, selectedCat, search, lang])

  // Sonsuz sürüşmə — filtr/axtarış/dil dəyişəndə siyahı əvvəldən başlayır və
  // (şəbəkənin ortasında idisə) onun başlığına qalxır (hero-ya yox)
  const gridTopRef = useRef(null)
  const inf = useInfiniteList({
    total: filtered.length,
    batch: BATCH,
    resetKey: `${lang}|${selectedCat}|${search.trim()}`,
    storageKey: 'books',
    ready: !loading,
    onReset: () => {
      const el = gridTopRef.current
      if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ block: 'start' })
    },
  })
  const paginated = filtered.slice(0, inf.count)

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
    const title = pickLang(b.title, lang)
    const author = pickLang(b.author, lang, { warn: false })
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
    // Avtomatik üz qabığı seçilmiş dildə (coverByLang), real şəkil olduğu kimi
    const cover = b.coverByLang?.[lang] || b.coverUrl
    if (cover) {
      return (
        <img
          src={cover}
          alt={pickLang(b.title, lang)}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bp-cover-fallback') }}
        />
      )
    }
    return (
      // Şəkilsiz kitab — tünd zümrüd üz qabığı + incə xatəm naxışı (tokenlərlə)
      <div className="bp-cover-placeholder">
        <div className="ui-pattern" aria-hidden="true"></div>
        <Icon name="books" size={34} className="bp-cover-icon" />
        <div className="bp-cover-cat">{cat?.label[lang]}</div>
      </div>
    )
  }

  // Kart üz qabığındakı sakit nişanlar (bölmə + PDF) — rəng yalnız tokenlərdən
  const coverBadges = (b) => {
    const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
    return (
      <>
        {cat && <span className="bp-cover-badge">{cat.label[lang]}</span>}
        {b.pdfUrl && <span className="bp-pdf-badge">PDF</span>}
      </>
    )
  }

  return (
    <div className="books-page">

      {/* ═══ HERO ═══ */}
      <header className="ui-page-hero bp-hero2">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{l.eyebrow}</span>
          <h1 className="ui-display">{l.title}</h1>
          {lang !== 'ar' && <p className="bp-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">مَكْتَبَةُ الْكُتُبِ</p>}
          <p className="ui-lead">{l.subtitle}</p>
          {/* Yalnız real məzmun sayı (yüklənəndə gizli — "0 kitab" görünməsin) */}
          {!loading && books.length > 0 && (
            <div className="bp-hero-stats" data-reveal="fade">
              <div className="ui-stat">
                <span className="ui-stat__num" data-count={books.length}>{books.length}</span>
                <span className="ui-stat__label">{l.books}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="ui-container bp-container">

        {/* ═══ AXTARIŞ ═══ */}
        <div className="bp-search-wrap">
          <Icon name="search" size={19} className="bp-search-icon" />
          <input
            type="search"
            className="ui-input bp-search"
            aria-label={l.search}
            placeholder={l.search}
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="ui-icon-btn bp-search-clear" onClick={() => setSearch('')} aria-label={l.clear} title={l.clear}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* ═══ SEÇİLMİŞLƏR (axtarış yox, "Hamısı" seçili və kitab > 8) ═══ */}
        {featured.length > 0 && (
          <section className="bp-section">
            <div className="bp-section-head" data-reveal>
              <h2 className="ui-title ui-title--sm bp-section-title">
                <Icon name="star" size={20} className="bp-section-ic" /> {l.featured}
              </h2>
            </div>
            <div className="bp-featured-row" data-reveal="stagger-zoom">
              {featured.map(b => (
                <article
                  key={b.id}
                  className="ui-card ui-card--flush ui-card--interactive bp-featured-card"
                  role="button"
                  tabIndex={0}
                  aria-label={pickLang(b.title, lang)}
                  onClick={() => setSelectedBook(b)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedBook(b) } }}
                >
                  <div className="bp-cover bp-featured-cover">
                    {renderCover(b)}
                    {coverBadges(b)}
                  </div>
                  <div className="bp-featured-body">
                    <h3 className="bp-title">{pickLang(b.title, lang)}</h3>
                    <p className="bp-author">{pickLang(b.author, lang, { warn: false })}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ═══ FİLTR ═══
            Yalnız bir dolu bölmə varsa filtr mənasızdır ("Hamısı" = həmin bölmə) — gizlədirik */}
        {categories.length > 2 && (
          <div className="bp-cat-filter" role="group" aria-label={l.filter} data-reveal="stagger-fade">
            {categories.map(cat => {
              const active = selectedCat === cat.key
              const count = cat.key === 'all'
                ? books.length
                : books.filter(b => b.category === cat.key).length
              return (
                <button
                  type="button"
                  key={cat.key}
                  className="ui-chip bp-cat-btn"
                  aria-pressed={active}
                  onClick={() => setSelectedCat(cat.key)}
                >
                  <span>{cat.label[lang]}</span>
                  <span className="bp-cat-count ui-num">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ═══ BÜTÜN KİTABLAR ═══ */}
        <section className="bp-section">
          <div className="bp-section-head" ref={gridTopRef}>
            <h2 className="ui-title ui-title--sm bp-section-title">
              <Icon name="books" size={20} className="bp-section-ic" /> {selectedCat !== 'all'
                ? BOOK_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]
                : featured.length ? l.moreBooks : l.allBooks}
            </h2>
            {!loading && <span className="ui-badge bp-section-count ui-num">{filtered.length}</span>}
          </div>

          {loading ? (
            // Yüklənmə: kartların "skelet"i (motion.css → .skeleton)
            <div className="bp-grid" role="status" aria-label={l.loading}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="ui-card ui-card--flush bp-skel-card" aria-hidden="true">
                  <div className="skeleton bp-skel-cover" />
                  <div className="bp-skel-body">
                    <span className="skeleton skeleton--text" style={{ width: '85%' }} />
                    <span className="skeleton skeleton--text" style={{ width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken bp-empty" data-reveal="scale">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="books" /></span>
              <p className="bp-empty-title">{l.noResults}</p>
              {(search || selectedCat !== 'all') && (
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setSelectedCat('all') }}>
                  <Icon name="close" className="ui-btn__icon" /> {l.clear}
                </button>
              )}
            </div>
          ) : (
            // Açar filtr/səhifə dəyişəndə şəbəkəni yenidən qurur — kartlar yenidən növbə ilə görünür
            <div className="bp-grid" key={selectedCat}>
              {paginated.map((b, i) => (
                <article key={b.id} className="ui-card ui-card--flush ui-card--interactive bp-card" onClick={() => setSelectedBook(b)} {...revealProps(i)}>
                  <div className="bp-cover">
                    {renderCover(b)}
                    {coverBadges(b)}
                  </div>
                  <div className="bp-body">
                    <h3 className="bp-title">{pickLang(b.title, lang)}</h3>
                    <p className="bp-author">{pickLang(b.author, lang, { warn: false })}</p>
                    {(b.pages || b.year) && (
                      <div className="bp-meta ui-num">
                        {b.pages && <span>{b.pages} {l.pages}</span>}
                        {b.year && <span>{b.year}</span>}
                      </div>
                    )}
                    <div className="bp-actions">
                      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm bp-read-btn" onClick={(e) => { e.stopPropagation(); setSelectedBook(b) }}>
                        <Icon name="books" className="ui-btn__icon" /> {l.read}
                      </button>
                      <button
                        type="button"
                        className="ui-icon-btn bp-share-btn"
                        onClick={(e) => { e.stopPropagation(); handleShare(b) }}
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
            <ListMore {...inf} endText={`${filtered.length} ${l.books}`} minForEnd={BATCH} skeleton={
              <div className="bp-grid" aria-hidden="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="ui-card ui-card--flush bp-skel-card">
                    <div className="skeleton bp-skel-cover" />
                    <div className="bp-skel-body">
                      <span className="skeleton skeleton--text" style={{ width: '85%' }} />
                      <span className="skeleton skeleton--text" style={{ width: '55%' }} />
                    </div>
                  </div>
                ))}
              </div>
            } />
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
              aria-label={pickLang(selectedBook.title, lang)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Telefonda tutacaq — aşağı çəkib bağlamaq (kompüterdə gizli) */}
              <div className="m-sheet-grab bp-sheet-grab" {...sheetDrag}>
                <span className="m-sheet-handle" />
              </div>
              <button type="button" ref={closeBtnRef} className="ui-icon-btn bp-modal-close" onClick={closeBook} aria-label={l.close} title={l.close}><Icon name="close" size={18} /></button>
              <div className="bp-modal-inner">
                <div className="bp-modal-cover">
                  {renderCover(selectedBook, 'large')}
                </div>
                <div className="bp-modal-info">
                  {(() => {
                    const cat = BOOK_CATEGORIES.find(c => c.key === selectedBook.category)
                    return cat && (
                      <span className="ui-badge ui-badge--accent bp-modal-cat">{cat.label[lang]}</span>
                    )
                  })()}
                  <h2>{pickLang(selectedBook.title, lang)}</h2>
                  <p className="bp-modal-author">{pickLang(selectedBook.author, lang, { warn: false })}</p>

                  {(selectedBook.pages || selectedBook.year) && (
                    <div className="bp-modal-meta ui-num">
                      {selectedBook.pages && <span className="ui-badge">{selectedBook.pages} {l.pages}</span>}
                      {selectedBook.year && <span className="ui-badge"><Icon name="calendar" size={13} /> {selectedBook.year}</span>}
                    </div>
                  )}

                  {(pickLang(selectedBook.description, lang, { warn: false })) && (
                    <p className="bp-modal-desc">{pickLang(selectedBook.description, lang, { warn: false })}</p>
                  )}

                  <div className="bp-modal-actions">
                    {selectedBook.pdfUrl ? (
                      <a className="ui-btn ui-btn--primary bp-modal-pdf-btn" href={selectedBook.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Icon name="books" className="ui-btn__icon" /> {l.readPdf}
                        <Icon name="external" size={15} className="bp-ext-ic" />
                      </a>
                    ) : (
                      <div className="bp-modal-pdf-disabled"><Icon name="info" size={18} /> {l.noPdf}</div>
                    )}
                    <button type="button" className="ui-btn ui-btn--secondary bp-modal-share-btn" onClick={() => handleShare(selectedBook)}>
                      <Icon name="share" className="ui-btn__icon" /> {l.share}
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
        <div className="bp-share-toast" role="status">
          <Icon name="check" size={18} /> {l.shared}
        </div>,
        document.body
      )}

      <BackToTop />
    </div>
  )
}
