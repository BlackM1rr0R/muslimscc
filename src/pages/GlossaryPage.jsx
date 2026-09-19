import { useState, useMemo, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { GLOSSARY } from '../data/glossary'
import Pagination from '../components/Pagination'
import '../styles/GlossaryPage.css'

const LABELS = {
  az: { title:'İslami Söz Lüğəti', subtitle:'İslami terminlərin izahı', search:'Termin axtar...', all:'Hamısı', noResults:'Nəticə tapılmadı', terms:'termin', definition:'Tərif', transliteration:'Transliterasiya', letters:'Hərflər' },
  en: { title:'Islamic Glossary', subtitle:'Explanation of Islamic terms', search:'Search terms...', all:'All', noResults:'No results found', terms:'terms', definition:'Definition', transliteration:'Transliteration', letters:'Letters' },
  ru: { title:'Исламский Глоссарий', subtitle:'Объяснение исламских терминов', search:'Поиск терминов...', all:'Все', noResults:'Ничего не найдено', terms:'терминов', definition:'Определение', transliteration:'Транслитерация', letters:'Буквы' },
  ar: { title:'قاموس إسلامي', subtitle:'شرح المصطلحات الإسلامية', search:'ابحث عن مصطلح...', all:'الكل', noResults:'لم يتم العثور على نتائج', terms:'مصطلح', definition:'التعريف', transliteration:'النقل الحرفي', letters:'الحروف' },
  tr: { title:'İslami Sözlük', subtitle:'İslami terimlerin açıklaması', search:'Terim ara...', all:'Tümü', noResults:'Sonuç bulunamadı', terms:'terim', definition:'Tanım', transliteration:'Transliterasyon', letters:'Harfler' },
}

const LATIN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const ARABIC_LETTERS = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي']

// Bir səhifədə neçə kart (107 kartın hamısı birdən telefonda 26 000px idi)
const PER_PAGE = 24

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// ilk ekrandakılar 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz
const revealProps = (i) => ({
  'data-reveal': '',
  ...(i > 0 && i < 6 ? { 'data-reveal-delay': String(i * 40) } : {}),
})

// Kartın başlığı: item.term yalnız azərbaycancadır — başqa dillərdə
// beynəlxalq transliterasiya (Tawhid, Salah…) göstərilir
const headlineOf = (item, lang) => (lang === 'az' ? item.term : item.translit)

// Termin bu hərflə başlayırmı? Ərəbcədə "ال" artikli nəzərə alınmır;
// az-da həm termin, həm transliterasiya; digər dillərdə başlıq (translit)
function startsWithLetter(item, letter, lang) {
  if (lang === 'ar') {
    return item.ar.replace(/^ال/, '').startsWith(letter) || item.ar.startsWith(letter)
  }
  if (lang === 'az') {
    return item.term.toUpperCase().startsWith(letter) || item.translit.toUpperCase().startsWith(letter)
  }
  return item.translit.toUpperCase().startsWith(letter)
}

export default function GlossaryPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const [search, setSearch] = useState('')
  const [activeLetter, setActiveLetter] = useState(null)
  const [pageNum, setPageNum] = useState(1)

  const isArabic = lang === 'ar'
  // Yalnız ən azı bir termini olan hərflər (boş hərf "0 termin" verirdi)
  const letters = useMemo(
    () => (isArabic ? ARABIC_LETTERS : LATIN_LETTERS)
      .filter(l => GLOSSARY.some(item => startsWithLetter(item, l, lang))),
    [isArabic, lang]
  )

  // Dil dəyişəndə seçilmiş hərf yeni siyahıda olmaya bilər
  useEffect(() => { setActiveLetter(null) }, [lang])

  const filtered = useMemo(() => {
    let list = GLOSSARY
    if (activeLetter) {
      list = list.filter(item => startsWithLetter(item, activeLetter, lang))
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(item =>
        item.term.toLowerCase().includes(q) ||
        item.translit.toLowerCase().includes(q) ||
        item.ar.includes(q) ||
        (item.def[lang] || item.def.en || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [search, activeLetter, lang])

  // Səhifələmə — axtarış, hərf və ya dil dəyişəndə 1-ci səhifə
  useEffect(() => { setPageNum(1) }, [search, activeLetter, lang])
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const current = Math.min(pageNum, Math.max(1, totalPages))
  const paged = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  // Səhifə dəyişəndə şəbəkənin əvvəlinə qalx (scroll-padding başlığı nəzərə alır)
  const topRef = useRef(null)
  const goPage = (p) => {
    setPageNum(p)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start' }))
  }

  // Telefonda hərf zolağı yapışqandır (sticky): siyahının ortasında hərf
  // seçiləndə yeni nəticələrin əvvəlinə qalx. Kompüterdə zolaq yapışmır —
  // orada bu yoxlama heç nə etmir.
  const alphaRef = useRef(null)
  const toGridTop = () => {
    requestAnimationFrame(() => {
      const bar = alphaRef.current
      if (!bar || getComputedStyle(bar).position !== 'sticky') return
      const grid = bar.nextElementSibling
      if (grid && grid.getBoundingClientRect().top < bar.getBoundingClientRect().bottom) {
        topRef.current?.scrollIntoView({ block: 'start' })
      }
    })
  }

  return (
    <>
      <div className="page-hero theme-glossary hero-compact">
        <div className="page-hero-arabic">قاموس المصطلحات الإسلامية</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          {/* Search */}
          <div className="glossary-search-wrap" ref={topRef}>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">🔍</span>
              <input
                className="input-base input-with-icon"
                aria-label={t.search}
                placeholder={t.search}
                enterKeyHint="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveLetter(null) }}
              />
            </div>
            <span className="glossary-count">{filtered.length} {t.terms}</span>
          </div>

          {/* Alphabetical filter */}
          {/* Telefonda bu zolaq başlığın altında yapışır (şüşə fon) */}
          <div className="glossary-alpha-bar" ref={alphaRef} role="group" aria-label={t.letters}>
            <button
              type="button"
              className={`glossary-alpha-btn ${!activeLetter ? 'active' : ''}`}
              aria-pressed={!activeLetter}
              onClick={() => { setActiveLetter(null); toGridTop() }}
            >
              {t.all}
            </button>
            {letters.map(letter => (
              <button
                type="button"
                key={letter}
                className={`glossary-alpha-btn ${activeLetter === letter ? 'active' : ''}`}
                aria-pressed={activeLetter === letter}
                onClick={() => { setActiveLetter(letter === activeLetter ? null : letter); setSearch(''); toGridTop() }}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Terms grid */}
          <div className="glossary-grid">
            {paged.map((item, idx) => (
              <div key={item.term} className="glossary-card" {...revealProps(idx)}>
                <div className="glossary-card-header">
                  <div className="glossary-arabic-text" lang="ar">{item.ar}</div>
                  <div className="glossary-term-name">{headlineOf(item, lang)}</div>
                  {/* Transliterasiya yalnız az-da ayrıca sətirdir (başqa dillərdə başlığın özüdür) */}
                  {lang === 'az' && <div className="glossary-translit">{item.translit}</div>}
                </div>
                <div className="glossary-card-body">
                  <p className="glossary-definition">{item.def[lang] || item.def.en}</p>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="glossary-empty">
              <span>📚</span>
              <p>{t.noResults}</p>
            </div>
          )}

          <Pagination current={current} total={totalPages} onChange={goPage} color="var(--primary)" />
        </div>
      </div>
    </>
  )
}
