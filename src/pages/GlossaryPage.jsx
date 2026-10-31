import { useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_CATS } from '../data/glossary'
import { LESSON_SLUGS } from '../seo/detailSlugs'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import useInfiniteList, { useSessionState } from '../hooks/useInfiniteList'
import ListMore from '../components/ListMore'
import BackToTop from '../components/BackToTop'
import Icon from '../components/Icon'
import '../styles/GlossaryPage.css'

// ═══════════════════════════════════════════════════════
// /glossary — İslami söz lüğəti (341 termin, 7 kateqoriya)
// Süzgəclər: axtarış, kateqoriya, hərf (sessionStorage-də saxlanır).
// Termin ünvanı: /glossary#<id> (məs. #istiwa) — termin və onun əlaqəli
// terminləri göstərilir; "Bütün terminlər" düyməsi hash-i silir.
// Mövzu dərsdə ətraflı izah olunursa kartda /learn/<slug> keçidi var
// (yalnız dərs saytda mövcuddursa — LESSON_SLUGS).
// ═══════════════════════════════════════════════════════

const LABELS = {
  az: { eyebrow:'Hədis və bilik', clear:'Filtri təmizlə', title:'İslami söz lüğəti', subtitle:'Əqidə, ibadət, fiqh, Quran və hədis elmləri, əxlaq və tarixə aid terminlər — Əhli-Sünnənin anlayışına uyğun qısa və dəqiq izahla.', search:'Termin axtar...', all:'Hamısı', noResults:'Nəticə tapılmadı', terms:'termin', letters:'Hərflər', cats:'Kateqoriyalar', related:'Əlaqəli terminlər', lesson:'Mövzu üzrə ətraflı dərs', focus:'Seçilmiş termin və əlaqəli terminlər', showAll:'Bütün terminlər', link:'Terminin linki' },
  en: { eyebrow:'Hadith & knowledge', clear:'Clear filter', title:'Islamic Glossary', subtitle:'Terms of creed, worship, fiqh, the Quran and hadith sciences, character and history — short, precise definitions in line with Ahl as-Sunnah.', search:'Search terms...', all:'All', noResults:'No results found', terms:'terms', letters:'Letters', cats:'Categories', related:'Related terms', lesson:'In-depth lesson on this topic', focus:'Selected term and related terms', showAll:'All terms', link:'Link to this term' },
  ru: { eyebrow:'Хадисы и знание', clear:'Сбросить фильтр', title:'Исламский глоссарий', subtitle:'Термины вероубеждения, поклонения, фикха, наук Корана и хадиса, нрава и истории — краткие и точные определения согласно Ахль ас-Сунна.', search:'Поиск терминов...', all:'Все', noResults:'Ничего не найдено', terms:'терминов', letters:'Буквы', cats:'Категории', related:'Связанные термины', lesson:'Подробный урок по теме', focus:'Выбранный термин и связанные с ним', showAll:'Все термины', link:'Ссылка на термин' },
  ar: { eyebrow:'الحديث والعلم', clear:'مسح التصفية', title:'قاموس المصطلحات الإسلامية', subtitle:'مصطلحات العقيدة والعبادات والفقه وعلوم القرآن والحديث والأخلاق والتاريخ — بتعريفات موجزة دقيقة على فهم أهل السنة.', search:'ابحث عن مصطلح...', all:'الكل', noResults:'لم يتم العثور على نتائج', terms:'مصطلح', letters:'الحروف', cats:'الأقسام', related:'مصطلحات ذات صلة', lesson:'درس مفصّل في الموضوع', focus:'المصطلح المختار وما يتصل به', showAll:'كل المصطلحات', link:'رابط المصطلح' },
  tr: { eyebrow:'Hadis ve ilim', clear:'Filtreyi temizle', title:'İslami Sözlük', subtitle:'Akide, ibadet, fıkıh, Kur’an ve hadis ilimleri, ahlak ve tarihe dair terimler — Ehl-i Sünnet’in anlayışına uygun kısa ve net tanımlarla.', search:'Terim ara...', all:'Tümü', noResults:'Sonuç bulunamadı', terms:'terim', letters:'Harfler', cats:'Kategoriler', related:'İlgili terimler', lesson:'Konuyla ilgili ayrıntılı ders', focus:'Seçilen terim ve ilgili terimler', showAll:'Tüm terimler', link:'Terimin bağlantısı' },
}

const CAT_LABELS = {
  aqidah:  { az:'Əqidə', en:'Creed', ru:'Вероубеждение', ar:'العقيدة', tr:'Akide' },
  worship: { az:'İbadət', en:'Worship', ru:'Поклонение', ar:'العبادات', tr:'İbadet' },
  fiqh:    { az:'Fiqh və üsul', en:'Fiqh & usul', ru:'Фикх и усуль', ar:'الفقه وأصوله', tr:'Fıkıh ve usul' },
  quran:   { az:'Quran elmləri', en:'Quran sciences', ru:'Науки Корана', ar:'علوم القرآن', tr:'Kur’an ilimleri' },
  hadith:  { az:'Hədis elmi', en:'Hadith science', ru:'Наука хадиса', ar:'علم الحديث', tr:'Hadis ilmi' },
  akhlaq:  { az:'Əxlaq və qəlb', en:'Character & heart', ru:'Нрав и сердце', ar:'الأخلاق والقلوب', tr:'Ahlak ve kalp' },
  history: { az:'Tarix və siyər', en:'History & sirah', ru:'История и сира', ar:'التاريخ والسيرة', tr:'Tarih ve siyer' },
}
const CAT_ICON = { aqidah:'shield', worship:'prayer', fiqh:'glossary', quran:'quran', hadith:'hadith', akhlaq:'sparkle', history:'history' }

const LATIN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const AZ_LETTERS = ['A','B','C','Ç','D','E','Ə','F','G','Ğ','H','X','I','İ','J','K','Q','L','M','N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z']
const ARABIC_LETTERS = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي']

// Sonsuz sürüşmənin bir partiyası
const BATCH = 24

const revealProps = (i) => {
  const j = i % BATCH
  return { 'data-reveal': '', ...(j > 0 && j < 6 ? { 'data-reveal-delay': String(j * 40) } : {}) }
}

// Kartın başlığı: item.term azərbaycancadır, ərəbcədə ərəbcə termin, başqa dillərdə transliterasiya
const headlineOf = (item, lang) => (lang === 'az' ? item.term : lang === 'ar' ? item.ar : item.translit)

// Sıralama və hərf açarı: artikl atılır ("Al-Masjid…" → M, "الصلاة" → ص), həmzəli əlif → ا
const stripArticle = (s) => String(s).replace(/^(?:al|an|ar|as|ash|at|ath|ad|adh|az)-/i, '')
const arKey = (s) => String(s).replace(/^ال/, '').replace(/[أإآ]/g, 'ا')
function sortKey(item, lang) {
  if (lang === 'ar') return arKey(item.ar)
  if (lang === 'az') return item.term
  return stripArticle(item.translit)
}
const LOCALE = { az: 'az', en: 'en', ru: 'en', tr: 'tr', ar: 'ar' }
function firstLetter(item, lang) {
  const k = sortKey(item, lang)
  if (lang === 'ar') return k.charAt(0)
  return k.charAt(0).toLocaleUpperCase(lang === 'az' ? 'az' : lang === 'tr' ? 'tr' : 'en')
}

export default function GlossaryPage() {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az
  const location = useLocation()
  const navigate = useNavigate()

  const [search, setSearch] = useSessionState('glossary:q', '')
  const [activeLetter, setActiveLetter] = useSessionState('glossary:letter', null)
  const [activeCat, setActiveCat] = useSessionState('glossary:cat', null)

  // Ünvandakı termin (#istiwa) — seçilmiş termin + əlaqəli terminlər
  const hashId = decodeURIComponent(location.hash.replace(/^#/, ''))
  const focused = GLOSSARY_BY_ID.get(hashId) || null

  const isArabic = lang === 'ar'

  // Dilə görə sıralanmış siyahı
  const sorted = useMemo(() => {
    const coll = new Intl.Collator(LOCALE[lang] || 'en', { sensitivity: 'base' })
    return [...GLOSSARY].sort((a, b) => coll.compare(sortKey(a, lang), sortKey(b, lang)))
  }, [lang])

  const byCat = useMemo(() => (activeCat ? sorted.filter(x => x.cat === activeCat) : sorted), [sorted, activeCat])

  const catCounts = useMemo(() => {
    const c = {}
    for (const x of GLOSSARY) c[x.cat] = (c[x.cat] || 0) + 1
    return c
  }, [])

  // Yalnız ən azı bir termini olan hərflər (seçilmiş kateqoriya daxilində)
  const letters = useMemo(() => {
    const present = new Set(byCat.map(x => firstLetter(x, lang)))
    return (isArabic ? ARABIC_LETTERS : lang === 'az' ? AZ_LETTERS : LATIN_LETTERS).filter(l => present.has(l))
  }, [byCat, isArabic, lang])

  // Dil dəyişəndə seçilmiş hərf yeni əlifbada olmaya bilər
  const langRef = useRef(lang)
  useEffect(() => {
    if (langRef.current === lang) return
    langRef.current = lang
    setActiveLetter(null)
  }, [lang, setActiveLetter])

  const filtered = useMemo(() => {
    if (focused) {
      return [focused, ...(focused.rel || []).map(id => GLOSSARY_BY_ID.get(id)).filter(Boolean)]
    }
    let list = byCat
    if (activeLetter) list = list.filter(item => firstLetter(item, lang) === activeLetter)
    if (search.trim()) {
      const q = search.toLocaleLowerCase().trim()
      list = list.filter(item =>
        item.term.toLocaleLowerCase().includes(q) ||
        item.translit.toLowerCase().includes(q) ||
        item.ar.includes(q) ||
        (item.def[lang] || item.def.en || '').toLocaleLowerCase().includes(q)
      )
    }
    return list
  }, [focused, byCat, search, activeLetter, lang])

  const topRef = useRef(null)
  const alphaRef = useRef(null)
  const gridRef = useRef(null)
  const inf = useInfiniteList({
    total: filtered.length,
    batch: BATCH,
    resetKey: `${lang}|${activeCat || ''}|${activeLetter || ''}|${search.trim()}|${focused?.id || ''}`,
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

  // Termin seçiləndə siyahının başına qalx
  useEffect(() => {
    if (!focused) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }))
  }, [focused])

  const openTerm = (id) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate({ hash: `#${id}` })
  }
  const clearFocus = () => navigate({ hash: '' }, { replace: false })
  const resetAll = () => { setSearch(''); setActiveLetter(null); setActiveCat(null); if (focused) clearFocus() }
  const pickCat = (c) => { setActiveCat(c); setActiveLetter(null); if (focused) clearFocus() }
  const onLessonClick = (slug) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(pathFor('learn', lang, slug))
  }

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
                onChange={e => { setSearch(e.target.value); setActiveLetter(null); if (focused) clearFocus() }}
              />
              {search && (
                <button type="button" className="ui-icon-btn glossary-search__clear" onClick={() => setSearch('')} aria-label={t.clear} title={t.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <span key={filtered.length} className="glossary-count ui-num ui-enter-pop" aria-live="polite">{filtered.length} {t.terms}</span>
          </div>

          {/* Kateqoriyalar */}
          <div className="glossary-cat-bar" role="group" aria-label={t.cats}>
            <button type="button" className="ui-chip glossary-cat-btn" aria-pressed={!activeCat} onClick={() => pickCat(null)}>
              {t.all} <span className="glossary-cat-n ui-num">{GLOSSARY.length}</span>
            </button>
            {GLOSSARY_CATS.map(c => (
              <button type="button" key={c} className="ui-chip glossary-cat-btn" aria-pressed={activeCat === c}
                onClick={() => pickCat(activeCat === c ? null : c)}>
                <Icon name={CAT_ICON[c]} size={16} />
                {CAT_LABELS[c][lang] || CAT_LABELS[c].en}
                <span className="glossary-cat-n ui-num">{catCounts[c] || 0}</span>
              </button>
            ))}
          </div>

          {/* Əlifba filtri — telefonda başlığın altında yapışır */}
          <div className="glossary-alpha-bar" ref={alphaRef} role="group" aria-label={t.letters} data-reveal="stagger-fade">
            <button
              type="button"
              className="ui-chip glossary-alpha-btn glossary-alpha-btn--all"
              aria-pressed={!activeLetter && !focused}
              onClick={() => { setActiveLetter(null); if (focused) clearFocus() }}
            >
              {t.all}
            </button>
            {letters.map(letter => (
              <button
                type="button"
                key={letter}
                className="ui-chip glossary-alpha-btn"
                aria-pressed={activeLetter === letter && !focused}
                onClick={() => { setActiveLetter(letter === activeLetter ? null : letter); setSearch(''); if (focused) clearFocus() }}
              >
                {letter}
              </button>
            ))}
          </div>

          {focused && (
            <div className="ui-card ui-card--sunken glossary-focus-bar" role="status">
              <span className="glossary-focus-bar__text"><Icon name="link" size={16} /> {t.focus}</span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={clearFocus}>
                <Icon name="close" className="ui-btn__icon" /> {t.showAll}
              </button>
            </div>
          )}

          <div className="glossary-grid" ref={gridRef} key={`${activeLetter || ''}|${activeCat || ''}|${focused?.id || ''}`}>
            {paged.map((item, idx) => {
              const lessonOk = item.lesson && LESSON_SLUGS.includes(item.lesson)
              const rel = (item.rel || []).map(id => GLOSSARY_BY_ID.get(id)).filter(Boolean)
              const isFocus = focused && idx === 0
              return (
                <article key={item.id} id={item.id} className={`ui-card glossary-card${isFocus ? ' is-focus' : ''}`} {...revealProps(idx)}>
                  <div className="glossary-card-header">
                    <div className="glossary-card-names">
                      <h2 className={`glossary-term-name${isArabic ? ' ui-arabic' : ''}`}>
                        <a className="glossary-term-link" href={`#${item.id}`} onClick={openTerm(item.id)} title={t.link}>{headlineOf(item, lang)}</a>
                      </h2>
                      {(lang === 'az' || lang === 'ar') && <span className="glossary-translit" dir="ltr">{item.translit}</span>}
                    </div>
                    {!isArabic && <span className="glossary-arabic-text ui-arabic" lang="ar" dir="rtl">{item.ar}</span>}
                  </div>
                  {item.cat && CAT_LABELS[item.cat] && (
                    <span className="ui-badge glossary-cat-badge">{CAT_LABELS[item.cat][lang] || CAT_LABELS[item.cat].en}</span>
                  )}
                  <p className="glossary-definition">{item.def[lang] || item.def.en}</p>
                  {(rel.length > 0 || lessonOk) && (
                    <div className="glossary-card-foot">
                      {rel.length > 0 && (
                        <div className="glossary-rel">
                          <span className="glossary-rel__label">{t.related}:</span>
                          <ul className="glossary-rel__list">
                            {rel.map(r => (
                              <li key={r.id}>
                                <a className="glossary-rel__chip" href={`#${r.id}`} onClick={openTerm(r.id)}>
                                  <span className={isArabic ? 'ui-arabic' : undefined}>{headlineOf(r, lang)}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lessonOk && (
                        <a className="ui-link glossary-lesson" href={pathFor('learn', lang, item.lesson)} onClick={onLessonClick(item.lesson)}>
                          <Icon name="learn" size={16} /> {t.lesson}
                          <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                        </a>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="ui-card ui-card--sunken glossary-empty" data-reveal="scale">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="glossary" /></span>
              <p>{t.noResults}</p>
              {(search || activeLetter || activeCat) && (
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={resetAll}>
                  <Icon name="close" className="ui-btn__icon" /> {t.clear}
                </button>
              )}
            </div>
          )}

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
