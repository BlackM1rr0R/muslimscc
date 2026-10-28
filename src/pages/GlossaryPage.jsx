import { useMemo, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { GLOSSARY } from '../data/glossary'
import useInfiniteList, { useSessionState } from '../hooks/useInfiniteList'
import ListMore from '../components/ListMore'
import BackToTop from '../components/BackToTop'
import Icon from '../components/Icon'
import '../styles/GlossaryPage.css'

const LABELS = {
  az: { eyebrow:'Hədis və bilik', clear:'Filtri təmizlə', title:'İslami söz lüğəti', subtitle:'İslami terminlərin izahı', search:'Termin axtar...', all:'Hamısı', noResults:'Nəticə tapılmadı', terms:'termin', definition:'Tərif', transliteration:'Transliterasiya', letters:'Hərflər' },
  en: { eyebrow:'Hadith & knowledge', clear:'Clear filter', title:'Islamic Glossary', subtitle:'Explanation of Islamic terms', search:'Search terms...', all:'All', noResults:'No results found', terms:'terms', definition:'Definition', transliteration:'Transliteration', letters:'Letters' },
  ru: { eyebrow:'Хадисы и знание', clear:'Сбросить фильтр', title:'Исламский Глоссарий', subtitle:'Объяснение исламских терминов', search:'Поиск терминов...', all:'Все', noResults:'Ничего не найдено', terms:'терминов', definition:'Определение', transliteration:'Транслитерация', letters:'Буквы' },
  ar: { eyebrow:'الحديث والعلم', clear:'مسح التصفية', title:'قاموس إسلامي', subtitle:'شرح المصطلحات الإسلامية', search:'ابحث عن مصطلح...', all:'الكل', noResults:'لم يتم العثور على نتائج', terms:'مصطلح', definition:'التعريف', transliteration:'النقل الحرفي', letters:'الحروف' },
  tr: { eyebrow:'Hadis ve ilim', clear:'Filtreyi temizle', title:'İslami Sözlük', subtitle:'İslami terimlerin açıklaması', search:'Terim ara...', all:'Tümü', noResults:'Sonuç bulunamadı', terms:'terim', definition:'Tanım', transliteration:'Transliterasyon', letters:'Harfler' },
}

const LATIN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const ARABIC_LETTERS = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي']

// Sonsuz sürüşmənin bir partiyası (107 kartın hamısı birdən telefonda 26 000px idi)
const BATCH = 24

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// hər yeni partiyanın ilk 6 kartı 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz
const revealProps = (i) => {
  const j = i % BATCH
  return { 'data-reveal': '', ...(j > 0 && j < 6 ? { 'data-reveal-delay': String(j * 40) } : {}) }
}

// Kartın başlığı: item.term yalnız azərbaycancadır — başqa dillərdə
// beynəlxalq transliterasiya (Tawhid, Salah…) göstərilir
// ərəbcədə başlıq ərəbcə terminin özüdür, transliterasiya altında qalır
const headlineOf = (item, lang) => (lang === 'az' ? item.term : lang === 'ar' ? item.ar : item.translit)

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

  // Filtrlər sessionStorage-də — geri qayıdanda siyahının mövqeyi ilə birlikdə bərpa olunur
  const [search, setSearch] = useSessionState('glossary:q', '')
  const [activeLetter, setActiveLetter] = useSessionState('glossary:letter', null)

  const isArabic = lang === 'ar'
  // Yalnız ən azı bir termini olan hərflər (boş hərf "0 termin" verirdi)
  const letters = useMemo(
    () => (isArabic ? ARABIC_LETTERS : LATIN_LETTERS)
      .filter(l => GLOSSARY.some(item => startsWithLetter(item, l, lang))),
    [isArabic, lang]
  )

  // Dil dəyişəndə seçilmiş hərf yeni siyahıda olmaya bilər (ilk render-də
  // toxunmuruq — əks halda geri qayıdanda bərpa olunan hərf silinərdi)
  const langRef = useRef(lang)
  useEffect(() => {
    if (langRef.current === lang) return
    langRef.current = lang
    setActiveLetter(null)
  }, [lang, setActiveLetter])

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

  // Sonsuz sürüşmə — axtarış, hərf və ya dil dəyişəndə siyahı əvvəldən başlayır
  // və (şəbəkənin ortasında idisə) onun əvvəlinə qalxır. Telefonda hərf zolağı
  // yapışqandır (sticky) — sərhəd onun altıdır, kompüterdə başlığın altı.
  const topRef = useRef(null)
  const alphaRef = useRef(null)
  const gridRef = useRef(null)
  const inf = useInfiniteList({
    total: filtered.length,
    batch: BATCH,
    resetKey: `${lang}|${activeLetter || ''}|${search.trim()}`,
    storageKey: 'glossary',
    onReset: () => {
      const bar = alphaRef.current
      const grid = gridRef.current
      if (!bar || !grid) return
      const limit = getComputedStyle(bar).position === 'sticky' ? bar.getBoundingClientRect().bottom : 80
      if (grid.getBoundingClientRect().top < limit) topRef.current?.scrollIntoView({ block: 'start' })
    },
  })
  const paged = filtered.slice(0, inf.count)

  return (
    <>
      <header className="ui-page-hero glo-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{t.eyebrow}</span>
          <h1 className="ui-display">{t.title}</h1>
          {!isArabic && <p className="glo-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">قاموس المصطلحات الإسلامية</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <div className="ui-section ui-section--tight glossary-page">
        <div className="ui-container">
          {/* Axtarış + say */}
          <div className="glossary-search-wrap" ref={topRef}>
            <div className="glossary-search">
              <Icon name="search" size={19} className="glossary-search__icon" />
              <input
                className="ui-input glossary-search__input"
                type="search"
                aria-label={t.search}
                placeholder={t.search}
                enterKeyHint="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveLetter(null) }}
              />
              {search && (
                <button type="button" className="ui-icon-btn glossary-search__clear" onClick={() => setSearch('')} aria-label={t.clear} title={t.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <span className="glossary-count ui-num" aria-live="polite">{filtered.length} {t.terms}</span>
          </div>

          {/* Əlifba filtri — telefonda başlığın altında yapışır (şüşə fon) */}
          <div className="glossary-alpha-bar" ref={alphaRef} role="group" aria-label={t.letters} data-reveal="stagger-fade">
            <button
              type="button"
              className="ui-chip glossary-alpha-btn glossary-alpha-btn--all"
              aria-pressed={!activeLetter}
              onClick={() => setActiveLetter(null)}
            >
              {t.all}
            </button>
            {letters.map(letter => (
              <button
                type="button"
                key={letter}
                className="ui-chip glossary-alpha-btn"
                aria-pressed={activeLetter === letter}
                onClick={() => { setActiveLetter(letter === activeLetter ? null : letter); setSearch('') }}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Terminlər — açar hərf dəyişəndə şəbəkəni yenidən qurur (keçid) */}
          <div className="glossary-grid" ref={gridRef} key={activeLetter || ''}>
            {paged.map((item, idx) => (
              <article key={item.term} className="ui-card glossary-card" {...revealProps(idx)}>
                <div className="glossary-card-header">
                  <div className="glossary-card-names">
                    <h2 className={`glossary-term-name${isArabic ? ' ui-arabic' : ''}`}>{headlineOf(item, lang)}</h2>
                    {/* Transliterasiya yalnız az-da ayrıca sətirdir (başqa dillərdə başlığın özüdür) */}
                    {(lang === 'az' || lang === 'ar') && <span className="glossary-translit" dir="ltr">{item.translit}</span>}
                  </div>
                  {!isArabic && <span className="glossary-arabic-text ui-arabic" lang="ar" dir="rtl">{item.ar}</span>}
                </div>
                <p className="glossary-definition">{item.def[lang] || item.def.en}</p>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="ui-card ui-card--sunken glossary-empty" data-reveal="scale">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="glossary" /></span>
              <p>{t.noResults}</p>
              {(search || activeLetter) && (
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setActiveLetter(null) }}>
                  <Icon name="close" className="ui-btn__icon" /> {t.clear}
                </button>
              )}
            </div>
          )}

          {/* Sonsuz sürüşmə: altda skeleton + "Daha çox göstər", sonda "Hamısı göstərildi" */}
          <ListMore {...inf} endText={`${filtered.length} ${t.terms}`} minForEnd={BATCH} className="glossary-more" skeleton={
            <div className="glossary-grid glossary-skel-grid">
              {[0, 1, 2].map(i => <div key={i} className="ui-skeleton ui-skeleton--card glossary-skel" />)}
            </div>
          } />
        </div>
      </div>

      <BackToTop />
    </>
  )
}
