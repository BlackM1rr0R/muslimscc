import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { BOOK_CATEGORIES, DEFAULT_BOOKS, subscribeToBooks, getDefaultCover } from '../data/books'
import '../styles/BooksPage.css'

const LABELS = {
  az: { title:'Kitabxana', subtitle:'İslami kitablar, təfsirlər və elm əsərləri', search:'Kitab axtar...', filter:'Filtr', featured:'Seçilmiş Kitablar', allBooks:'Bütün Kitablar', noResults:'Kitab tapılmadı', loading:'Yüklənir...', books:'kitab', author:'Müəllif', read:'Oxu', preview:'Önizlə', readPdf:'PDF açın', noPdf:'PDF mövcud deyil', pages:'səhifə', year:'İl', share:'Paylaş', shared:'Kopyalandı!', close:'Bağla' },
  en: { title:'Library', subtitle:'Islamic books, tafsirs and scholarly works', search:'Search books...', filter:'Filter', featured:'Featured Books', allBooks:'All Books', noResults:'No books found', loading:'Loading...', books:'books', author:'Author', read:'Read', preview:'Preview', readPdf:'Open PDF', noPdf:'PDF not available', pages:'pages', year:'Year', share:'Share', shared:'Copied!', close:'Close' },
  ru: { title:'Библиотека', subtitle:'Исламские книги, тафсиры и научные труды', search:'Поиск книг...', filter:'Фильтр', featured:'Избранные книги', allBooks:'Все книги', noResults:'Книги не найдены', loading:'Загрузка...', books:'книг', author:'Автор', read:'Читать', preview:'Просмотр', readPdf:'Открыть PDF', noPdf:'PDF недоступен', pages:'страниц', year:'Год', share:'Поделиться', shared:'Скопировано!', close:'Закрыть' },
  ar: { title:'المكتبة', subtitle:'كتب إسلامية وتفاسير وأعمال علمية', search:'البحث عن كتاب...', filter:'تصفية', featured:'كتب مميزة', allBooks:'كل الكتب', noResults:'لا توجد كتب', loading:'جارٍ التحميل...', books:'كتاب', author:'المؤلف', read:'اقرأ', preview:'معاينة', readPdf:'فتح PDF', noPdf:'PDF غير متاح', pages:'صفحة', year:'السنة', share:'مشاركة', shared:'تم النسخ!', close:'إغلاق' },
  tr: { title:'Kütüphane', subtitle:'İslami kitaplar, tefsirler ve ilmi eserler', search:'Kitap ara...', filter:'Filtre', featured:'Öne Çıkan Kitaplar', allBooks:'Tüm Kitaplar', noResults:'Kitap bulunamadı', loading:'Yükleniyor...', books:'kitap', author:'Yazar', read:'Oku', preview:'Önizle', readPdf:'PDF aç', noPdf:'PDF mevcut değil', pages:'sayfa', year:'Yıl', share:'Paylaş', shared:'Kopyalandı!', close:'Kapat' },
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

  useEffect(() => {
    const unsubscribe = subscribeToBooks((items) => {
      setBooks(items.length > 0 ? items : DEFAULT_BOOKS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  const filtered = useMemo(() => {
    let list = books
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
  }, [books, selectedCat, search, lang])

  const featured = books.slice(0, 4)

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
        <h1 className="bp-hero-title">📚 {l.title}</h1>
        <p className="bp-hero-sub">{l.subtitle}</p>
        <div className="bp-hero-stats">
          <div className="bp-stat">
            <span className="bp-stat-num">{books.length}</span>
            <span className="bp-stat-label">{l.books}</span>
          </div>
          <div className="bp-stat">
            <span className="bp-stat-num">{BOOK_CATEGORIES.length - 1}</span>
            <span className="bp-stat-label">{l.filter}</span>
          </div>
        </div>
      </div>

      <div className="bp-container">

        {/* ═══ SEARCH BAR ═══ */}
        <div className="bp-search-wrap">
          <span className="bp-search-icon">🔍</span>
          <input
            type="text"
            className="bp-search"
            placeholder={l.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="bp-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* ═══ FEATURED (only when no search + all selected) ═══ */}
        {!search && selectedCat === 'all' && featured.length > 0 && (
          <section className="bp-section">
            <h2 className="bp-section-title">
              <span>⭐</span> {l.featured}
            </h2>
            <div className="bp-featured-row">
              {featured.map(b => {
                const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
                return (
                  <article key={b.id} className="bp-featured-card" onClick={() => setSelectedBook(b)}>
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

        {/* ═══ CATEGORY FILTER ═══ */}
        <section className="bp-section">
          <h2 className="bp-section-title">
            <span>📂</span> {l.filter}
          </h2>
          <div className="bp-cat-filter">
            {BOOK_CATEGORIES.map(cat => {
              const active = selectedCat === cat.key
              const count = cat.key === 'all'
                ? books.length
                : books.filter(b => b.category === cat.key).length
              return (
                <button
                  key={cat.key}
                  className={`bp-cat-btn ${active ? 'active' : ''}`}
                  onClick={() => setSelectedCat(cat.key)}
                  style={active ? { backgroundColor: cat.color, borderColor: cat.color, color: '#fff' } : { '--cat-color': cat.color }}
                >
                  <span>{cat.label[lang] || cat.label.en}</span>
                  <span className="bp-cat-count">{count}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ═══ ALL BOOKS ═══ */}
        <section className="bp-section">
          <h2 className="bp-section-title">
            <span>📖</span> {selectedCat === 'all' ? l.allBooks : BOOK_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]}
            <span className="bp-section-count">{filtered.length}</span>
          </h2>

          {loading ? (
            <div className="bp-loading">
              <div className="bp-spinner"></div>
              <p>{l.loading}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bp-empty">
              <div className="bp-empty-icon">📚</div>
              <p>{l.noResults}</p>
            </div>
          ) : (
            <div className="bp-grid">
              {filtered.map(b => {
                const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
                return (
                  <article key={b.id} className="bp-card" onClick={() => setSelectedBook(b)}>
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
        </section>
      </div>

      {/* ═══ BOOK DETAILS MODAL ═══ */}
      {selectedBook && (
        <div className="bp-modal" onClick={() => setSelectedBook(null)}>
          <div className="bp-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="bp-modal-close" onClick={() => setSelectedBook(null)}>✕</button>
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
      )}

      {/* ═══ SHARE TOAST ═══ */}
      {shareToast && (
        <div className="bp-share-toast">
          ✅ {l.shared}
        </div>
      )}
    </div>
  )
}
