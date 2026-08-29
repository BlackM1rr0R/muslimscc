import { NAMES_99 } from '../data/names99'
import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/NamesPage.css'

export default function NamesPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.names || T.az.names
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return NAMES_99
    return NAMES_99.filter(n =>
      n.ar.includes(q) || n.tr.toLowerCase().includes(q) ||
      (n[lang]||n.en||'').toLowerCase().includes(q) ||
      String(n.n).includes(q)
    )
  }, [search, lang])

  return (
    <>
      <div className="page-hero theme-names">
        <div className="page-hero-arabic">أَسۡمَاءُ ٱللَّهِ ٱلۡحُسۡنَىٰ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="names-hadith-banner">
            <p className="names-hadith-text">{t.hadith}</p>
            <span className="names-hadith-ref">— {t.hadithRef}</span>
          </div>

          <div className="input-wrap" style={{ maxWidth:420, marginBottom:24 }}>
            <span className="input-icon">🔍</span>
            <input className="input-base input-with-icon" placeholder={t.searchPh}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="names-grid">
            {filtered.map(name => (
              <div key={name.n}
                className={`name-card ${selected===name.n?'active':''}`}
                onClick={() => setSelected(selected===name.n?null:name.n)}>
                <div className="name-num">{name.n}</div>
                <div className="name-arabic">{name.ar}</div>
                <div className="name-translit">{name.tr}</div>
                <div className="name-meaning">{name[lang] || name.en}</div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state"><span>⭐</span><p>{lang==='az'?'Ad tapılmadı':lang==='ru'?'Ничего не найдено':lang==='ar'?'لم يتم العثور على شيء':lang==='tr'?'Bulunamadı':'Not found'}</p></div>
          )}
        </div>
      </div>
    </>
  )
}
