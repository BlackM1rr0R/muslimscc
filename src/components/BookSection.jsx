import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { BOOK_CATEGORIES, DEFAULT_BOOKS, subscribeToBooks } from '../data/books'
import Pagination from './Pagination'
import Icon from './Icon'
import '../styles/BookSection.css'
// Admin məzmunu cari dildə yoxdursa başqa dilə düşmür (bax: utils/pickLang)
import { pickLang, hasLang } from '../utils/pickLang'

const LABELS = {
  az: { eyebrow:'Oxu üçün', title:'Kitabxana', sub:'İslami kitablar və alimlərin əsərləri', loading:'Yüklənir...', viewAll:'Hamısını gör', pdf:'PDF' },
  en: { eyebrow:'For reading', title:'Library', sub:'Islamic books and scholarly works', loading:'Loading...', viewAll:'View all', pdf:'PDF' },
  ru: { eyebrow:'Для чтения', title:'Библиотека', sub:'Исламские книги и научные труды', loading:'Загрузка...', viewAll:'Все книги', pdf:'PDF' },
  ar: { eyebrow:'للقراءة', title:'المكتبة', sub:'الكتب الإسلامية وأعمال العلماء', loading:'جارٍ التحميل...', viewAll:'عرض الكل', pdf:'PDF' },
  tr: { eyebrow:'Okumak için', title:'Kütüphane', sub:'İslami kitaplar ve âlim eserleri', loading:'Yükleniyor...', viewAll:'Tümünü gör', pdf:'PDF' },
}

export default function BookSection({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [allBooks, setBooks] = useState([])
  // Başlığı cari dildə olmayan admin məzmunu bu dildə göstərilmir (başqa dilə düşmür)
  const books = allBooks.filter(b => hasLang(b.title, lang))
  const [loading, setLoading] = useState(true)
  const [pageNum, setPageNum] = useState(1)
  const PER_PAGE = 5

  useEffect(() => {
    const unsubscribe = subscribeToBooks((items) => {
      setBooks(items.length > 0 ? items : DEFAULT_BOOKS)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  const goAll = () => { setPage?.('books'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (loading) {
    // Yüklənmə: 5 kitablıq skelet — bölmə hündürlüyü əvvəlcədən saxlanır
    return (
      <section className="ui-section book-section bsx" aria-busy="true">
        <div className="ui-container">
          <div className="bsx-grid" role="status" aria-label={l.loading}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="ui-card ui-card--flush" aria-hidden="true">
                <div className="skeleton bsx-skel-cover" />
                <div className="bsx-body">
                  <span className="skeleton skeleton--text" style={{ width: '85%' }} />
                  <span className="skeleton skeleton--text" style={{ width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (books.length === 0) return null

  // Hər səhifəyə 5 kitab — istifadəçi səhifələyə bilər
  const totalPages = Math.max(1, Math.ceil(books.length / PER_PAGE))
  const currentPage = Math.min(pageNum, totalPages)
  const preview = books.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  return (
    <section className="ui-section book-section bsx">
      <div className="ui-container">

        <div className="ui-section-head ui-section-head--row bsx-head" data-reveal>
          <div className="bsx-head-text">
            <span className="ui-eyebrow">{l.eyebrow}</span>
            <h2 className="ui-title">{l.title}</h2>
            <p className="ui-lead">{l.sub}</p>
          </div>
          {setPage && (
            <button type="button" className="ui-btn ui-btn--secondary bsx-all" onClick={goAll}>
              {l.viewAll} <Icon name="arrow" size={16} className="ui-btn__icon ui-flip-rtl" />
            </button>
          )}
        </div>

        {/* Açar səhifə dəyişəndə şəbəkəni yenidən qurur — kitablar növbə ilə görünür */}
        <div className="bsx-grid" data-reveal="stagger-zoom" key={currentPage}>
          {preview.map(b => {
            const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
            // Avtomatik üz qabığı seçilmiş dildə (coverByLang) — əvvəl hər dildə az-ca idi
            const cover = b.coverByLang?.[lang] || b.coverUrl
            return (
              <button
                type="button"
                key={b.id}
                className="ui-card ui-card--flush ui-card--interactive bsx-card"
                onClick={goAll}
              >
                <span className="bsx-cover">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : null}
                  {/* Şəkil yoxdursa (və ya yüklənməsə) — sakit tünd üz qabığı */}
                  <span className="bsx-placeholder" aria-hidden="true">
                    <Icon name="books" size={30} />
                    {cat && <span>{cat.label[lang]}</span>}
                  </span>
                  {b.pdfUrl && <span className="bsx-pdf">{l.pdf}</span>}
                </span>
                <span className="bsx-body">
                  <span className="bsx-title">{pickLang(b.title, lang)}</span>
                  <span className="bsx-author">{pickLang(b.author, lang, { warn: false })}</span>
                </span>
              </button>
            )
          })}
        </div>

        {totalPages > 1 && (
          <Pagination
            current={currentPage}
            total={totalPages}
            onChange={setPageNum}
            color="var(--brand)"
          />
        )}
      </div>
    </section>
  )
}
