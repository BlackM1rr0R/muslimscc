import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { BOOK_CATEGORIES, DEFAULT_BOOKS, subscribeToBooks } from '../data/books'

const LABELS = {
  az: { title:'Kitabxana', sub:'İslami kitablar və alimlərin əsərləri', noBooks:'Hələ kitab əlavə olunmayıb', loading:'Yüklənir...', viewAll:'Hamısını gör', read:'Oxu' },
  en: { title:'Library', sub:'Islamic books and scholarly works', noBooks:'No books added yet', loading:'Loading...', viewAll:'View all', read:'Read' },
  ru: { title:'Библиотека', sub:'Исламские книги и научные труды', noBooks:'Книги пока не добавлены', loading:'Загрузка...', viewAll:'Все книги', read:'Читать' },
  ar: { title:'المكتبة', sub:'الكتب الإسلامية وأعمال العلماء', noBooks:'لم يتم إضافة كتب', loading:'جارٍ التحميل...', viewAll:'عرض الكل', read:'اقرأ' },
  tr: { title:'Kütüphane', sub:'İslami kitaplar ve âlim eserleri', noBooks:'Henüz kitap yok', loading:'Yükleniyor...', viewAll:'Tümünü gör', read:'Oku' },
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
      <section className="section">
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

        <div className="video-section-header">
          <div>
            <h2 className="video-section-title">📚 {l.title}</h2>
            <p style={{color:'var(--text-dim)', fontSize:15, margin:'4px 0 0'}}>{l.sub}</p>
          </div>
          {setPage && (
            <button
              onClick={() => { setPage('books'); window.scrollTo({top:0, behavior:'smooth'}) }}
              style={{
                background:'linear-gradient(135deg, #f59e0b, #d97706)',
                color:'#fff',
                border:'none',
                padding:'12px 22px',
                borderRadius:'999px',
                fontWeight:800,
                fontSize:13,
                cursor:'pointer',
                letterSpacing:0.3,
                boxShadow:'0 4px 14px rgba(245,158,11,0.3)',
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

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',
          gap:18,
          marginTop:20,
        }}>
          {preview.map(b => {
            const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
            return (
              <article
                key={b.id}
                onClick={() => { setPage?.('books'); window.scrollTo({top:0, behavior:'smooth'}) }}
                style={{
                  background:'var(--bg-card, #fff)',
                  borderRadius:14,
                  overflow:'hidden',
                  cursor:'pointer',
                  border:'1px solid var(--border)',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
                  transition:'all 0.3s',
                  display:'flex',
                  flexDirection:'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(245,158,11,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{
                  position:'relative',
                  aspectRatio:'2/3',
                  overflow:'hidden',
                  background: `linear-gradient(135deg, ${cat?.color || '#f59e0b'}, ${cat?.color || '#f59e0b'}dd)`,
                }}>
                  {b.coverUrl ? (
                    <img
                      src={b.coverUrl}
                      alt={b.title?.[lang] || b.title?.en}
                      loading="lazy"
                      style={{width:'100%', height:'100%', objectFit:'cover'}}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div style={{
                      display:'flex',
                      flexDirection:'column',
                      alignItems:'center',
                      justifyContent:'center',
                      height:'100%',
                      color:'#fff',
                      padding:14,
                      textAlign:'center',
                    }}>
                      <div style={{fontSize:48, marginBottom:6}}>📖</div>
                      <div style={{fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:1, opacity:0.95}}>
                        {cat?.label[lang] || cat?.label.en}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{padding:'12px 12px 14px', display:'flex', flexDirection:'column', gap:4, flex:1}}>
                  <h3 style={{
                    margin:0,
                    fontSize:13,
                    fontWeight:800,
                    color:'var(--text)',
                    lineHeight:1.3,
                    display:'-webkit-box',
                    WebkitLineClamp:2,
                    WebkitBoxOrient:'vertical',
                    overflow:'hidden',
                  }}>{b.title?.[lang] || b.title?.en}</h3>
                  <p style={{
                    margin:0,
                    fontSize:11,
                    color:'var(--text-muted)',
                    fontWeight:600,
                    display:'-webkit-box',
                    WebkitLineClamp:1,
                    WebkitBoxOrient:'vertical',
                    overflow:'hidden',
                  }}>✍️ {b.author?.[lang] || b.author?.en}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
