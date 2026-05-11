import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { BOOK_CATEGORIES, DEFAULT_BOOKS, subscribeToBooks } from '../data/books'
import '../styles/BookSection.css'

const LABELS = {
  az: { title:'Kitabxana', sub:'İslami kitablar və alimlərin əsərləri', loading:'Yüklənir...', viewAll:'Hamısını gör', pdf:'PDF' },
  en: { title:'Library', sub:'Islamic books and scholarly works', loading:'Loading...', viewAll:'View all', pdf:'PDF' },
  ru: { title:'Библиотека', sub:'Исламские книги и научные труды', loading:'Загрузка...', viewAll:'Все книги', pdf:'PDF' },
  ar: { title:'المكتبة', sub:'الكتب الإسلامية وأعمال العلماء', loading:'جارٍ التحميل...', viewAll:'عرض الكل', pdf:'PDF' },
  tr: { title:'Kütüphane', sub:'İslami kitaplar ve âlim eserleri', loading:'Yükleniyor...', viewAll:'Tümünü gör', pdf:'PDF' },
}

export default function BookSection({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToBooks((items) => {
      setBooks(items.length > 0 ? items : DEFAULT_BOOKS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  if (loading) {
    return (
      <section className="section book-section">
        <div className="section-inner">
          <div style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>
            ⏳ {l.loading}
          </div>
        </div>
      </section>
    )
  }

  if (books.length === 0) return null

  const preview = books.slice(0, 6)

  return (
    <section className="section book-section">
      <div className="section-inner">

        <div className="book-section-header">
          <div>
            <h2 className="book-section-title">📚 {l.title}</h2>
            <p className="book-section-sub">{l.sub}</p>
          </div>
          {setPage && (
            <button
              className="book-section-viewall"
              onClick={() => { setPage('books'); window.scrollTo({top:0, behavior:'smooth'}) }}
            >
              {l.viewAll} →
            </button>
          )}
        </div>

        <div className="book-section-grid">
          {preview.map(b => {
            const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
            const catColor = cat?.color || '#f59e0b'
            return (
              <article
                key={b.id}
                className="bs-card"
                onClick={() => { setPage?.('books'); window.scrollTo({top:0, behavior:'smooth'}) }}
              >
                <div
                  className="bs-cover"
                  style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}dd)` }}
                >
                  {b.coverUrl ? (
                    <img
                      src={b.coverUrl}
                      alt={b.title?.[lang] || b.title?.en}
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="bs-placeholder">
                      <div className="bs-placeholder-icon">📖</div>
                      <div className="bs-placeholder-cat">{cat?.label[lang] || cat?.label.en}</div>
                    </div>
                  )}
                  {b.pdfUrl && (
                    <span className="bs-pdf-badge">📄 {l.pdf}</span>
                  )}
                </div>
                <div className="bs-body">
                  <h3 className="bs-title">{b.title?.[lang] || b.title?.en}</h3>
                  <p className="bs-author">✍️ {b.author?.[lang] || b.author?.en}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
