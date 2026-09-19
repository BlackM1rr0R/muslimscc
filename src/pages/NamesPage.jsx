import { NAMES_99 } from '../data/names99'
import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/NamesPage.css'

const NOT_FOUND = { az:'Ad tapılmadı', en:'Not found', ru:'Ничего не найдено', ar:'لم يتم العثور على شيء', tr:'Bulunamadı' }

// Ərəb axtarışı hərəkəsiz də işləsin: "رحمن" → "ٱلرَّحۡمَٰنُ"
const normAr = (s) => String(s || '').replace(/[ً-ٰٟۖ-ۭـ\s]/g, '').replace(/[ٱأإآ]/g, 'ا')
const HAS_ARABIC = /[؀-ۿ]/

// Kartdakı məna sətri. Ərəbcədə "məna" adın özüdür, NAMES_99-da isə "tr"
// sahəsi türkcə tərcümə deyil, transliterasiyadır — hər iki halda sətir
// yuxarıdakını təkrarlayardı, ona görə göstərilmir.
const meaningOf = (name, lang) => (lang === 'ar' || lang === 'tr') ? '' : (name[lang] || name.en)

export default function NamesPage() {
  const { lang } = useLang()
  const t = T[lang]?.names || T.az.names
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return NAMES_99
    if (HAS_ARABIC.test(q)) {
      const nq = normAr(q)
      return NAMES_99.filter(n => normAr(n.ar).includes(nq))
    }
    return NAMES_99.filter(n =>
      n.tr.toLowerCase().includes(q) ||
      (n[lang] || n.en || '').toLowerCase().includes(q) ||
      (n.en || '').toLowerCase().includes(q) ||
      String(n.n) === q
    )
  }, [search, lang])

  return (
    <>
      <div className="page-hero hero-compact theme-names">
        {/* Ərəbcədə başlıq onsuz da ərəbcədir — təkrar sətir göstərilmir */}
        {lang !== 'ar' && <div className="page-hero-arabic">أَسۡمَاءُ ٱللَّهِ ٱلۡحُسۡنَىٰ</div>}
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="names-hadith-banner">
            <p className="names-hadith-text">{t.hadith}</p>
            <span className="names-hadith-ref">— {t.hadithRef}</span>
          </div>

          <div className="input-wrap names-search">
            <span className="input-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="input-base input-with-icon"
              placeholder={t.searchPh}
              aria-label={t.searchPh}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Hər kart ekrana girəndə yumşaq qalxır; ilk 8-i növbə ilə,
              sonrakılar cüt sütunda 40ms fərqlə (sətir "dalğası") */}
          <ol className="names-grid">
            {filtered.map((name, i) => {
              const meaning = meaningOf(name, lang)
              return (
                <li key={name.n} className="name-card"
                  data-reveal="" data-reveal-delay={i < 8 ? i * 40 : (i % 2) * 40}>
                  <div className="name-num">{name.n}</div>
                  <div className="name-arabic" lang="ar">{name.ar}</div>
                  <div className="name-translit" dir="ltr">{name.tr}</div>
                  {meaning && <div className="name-meaning">{meaning}</div>}
                </li>
              )
            })}
          </ol>

          {filtered.length === 0 && (
            <div className="empty-state"><span aria-hidden="true">⭐</span><p>{NOT_FOUND[lang] || NOT_FOUND.en}</p></div>
          )}
        </div>
      </div>
    </>
  )
}
