import { useState, useMemo, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { HADITHS } from '../data/hadiths'
import '../styles/HadithPage.css'

const CATS_AZ = ['Hamısı','İman','Əxlaq','İbadət','Namaz','Quran','Elm','Oruc','Zəkat','Zikr','Sədəqə','Səbr','Dünya','Axirət','Salavat','Müsafirlik']
const CATS_EN = ['All','Faith','Character','Worship','Prayer','Quran','Knowledge','Fasting','Zakat','Dhikr','Charity','Patience','World','Afterlife','Salawat','Travel']
const CATS_RU = ['Все','Вера','Характер','Поклонение','Намаз','Коран','Знание','Пост','Закят','Зикр','Садака','Терпение','Мир','Последняя жизнь','Салавят','Путешествие']
const CATS_AR = ['الكل','الإيمان','الأخلاق','العبادة','الصلاة','القرآن','العلم','الصيام','الزكاة','الذكر','الصدقة','الصبر','الدنيا','الآخرة','الصلاة على النبي','السفر']
const CATS_TR = ['Tümü','İman','Ahlak','İbadet','Namaz','Kuran','İlim','Oruç','Zekat','Zikir','Sadaka','Sabır','Dünya','Ahiret','Salavat','Seyahat']
const CATS_MAP = { az:CATS_AZ, en:CATS_EN, ru:CATS_RU, ar:CATS_AR, tr:CATS_TR }

const FAV_LABELS = { az:'Sevimlilər', en:'Favorites', ru:'Избранные', ar:'المفضلة', tr:'Favoriler' }

function HadithCard({ hadith, isFav, onToggleFav, onShare }) {
  return (
    <div className="hadith-card">
      <div className="hadith-top">
        <div className="hadith-num">#{hadith.id}</div>
        <div className="hadith-cat-badge">{hadith.cat}</div>
        <div className="hadith-source">{hadith.source}</div>
        <button className={`hadith-fav-btn ${isFav ? 'active' : ''}`} onClick={() => onToggleFav(hadith.id)}>
          {isFav ? '❤️' : '🤍'}
        </button>
        <button className="hadith-share-btn" onClick={(e) => { e.stopPropagation(); onShare(hadith) }}>
          📤
        </button>
      </div>
      <p className="hadith-arabic">{hadith.ar}</p>
      <div className="hadith-body">
        <p className="hadith-text">{hadith.text}</p>
      </div>
    </div>
  )
}

export default function HadithPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.hadith || T.az.hadith
  const cats = CATS_MAP[lang] || CATS_EN
  const [cat,     setCat]     = useState(cats[0])
  const [search,  setSearch]  = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [favs,    setFavs]    = useState(() => { try { return JSON.parse(localStorage.getItem('hadith_favs')) || [] } catch { return [] } })
  const [showFavs, setShowFavs] = useState(false)
  const PER = 20

  useEffect(() => localStorage.setItem('hadith_favs', JSON.stringify(favs)), [favs])

  const toggleFav = (id) => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id])

  const shareHadith = async (hadith) => {
    const text = `${hadith.ar}\n\n${hadith.text}\n\n— ${hadith.source}\n\nmuslims.cc`
    if (navigator.share) {
      try { await navigator.share({ text }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert(lang === 'az' ? 'Kopyalandı!' : lang === 'ru' ? 'Скопировано!' : lang === 'ar' ? 'تم النسخ!' : lang === 'tr' ? 'Kopyalandı!' : 'Copied!') } catch {}
    }
  }

  const list = HADITHS[lang] || HADITHS.en

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const idx = cats.indexOf(cat)
    const enCat = idx <= 0 ? null : CATS_EN[idx] || null
    return list.filter(h => {
      if (showFavs && !favs.includes(h.id)) return false
      const mq = !q || h.text.toLowerCase().includes(q) || h.ar.includes(q) || h.source.toLowerCase().includes(q)
      const mc = !enCat || h.cat === enCat
      return mq && mc
    })
  }, [list, cat, search, lang, showFavs, favs])

  const total = Math.ceil(filtered.length / PER)
  const paged = filtered.slice((pageNum - 1) * PER, pageNum * PER)

  useMemo(() => setPageNum(1), [cat, search, lang])

  const countText = lang==='az' ? `${filtered.length} hədis` : lang==='ru' ? `${filtered.length} хадисов` : lang==='ar' ? `${filtered.length} حديثاً` : lang==='tr' ? `${filtered.length} hadis` : `${filtered.length} hadiths`

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-arabic">كُتُبُ الحَدِيث</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="hadith-search">
            <div className="input-wrap">
              <span className="input-icon">🔍</span>
              <input className="input-base input-with-icon" placeholder={t.searchPh}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="tag-filters" style={{ marginBottom:20 }}>
            <button className={`tag-btn ${showFavs ? 'active' : ''}`}
              onClick={() => setShowFavs(f => !f)}>
              ❤️ {FAV_LABELS[lang] || FAV_LABELS.en}
            </button>
            {cats.map(c => (
              <button key={c} className={`tag-btn ${cat === c && !showFavs ? 'active' : ''}`}
                onClick={() => { setCat(c); setShowFavs(false) }}>{c}</button>
            ))}
          </div>

          <p className="result-count">{countText}</p>

          <div className="hadiths-list">
            {paged.length === 0
              ? <div className="empty-state"><span>📚</span><p>{t.noResult}</p></div>
              : paged.map(h => <HadithCard key={h.id} hadith={h} lang={lang} isFav={favs.includes(h.id)} onToggleFav={toggleFav} onShare={shareHadith} />)
            }
          </div>

          {total > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={pageNum <= 1} onClick={() => setPageNum(p => p-1)}>←</button>
              {Array.from({length: Math.min(total, 10)}, (_, i) => {
                // sliding window around current page
                let start = Math.max(1, pageNum - 4)
                let end   = Math.min(total, start + 9)
                start = Math.max(1, end - 9)
                return start + i
              }).map(p => (
                <button key={p} className={`page-btn ${pageNum === p ? 'active' : ''}`}
                  onClick={() => setPageNum(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={pageNum >= total} onClick={() => setPageNum(p => p+1)}>→</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}