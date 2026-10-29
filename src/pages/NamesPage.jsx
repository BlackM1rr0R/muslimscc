import { NAMES_99 } from '../data/names99'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { useBackToClose } from '../utils/useBackToClose'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import '../styles/NamesPage.css'

const NOT_FOUND = { az:'Ad tapılmadı', en:'Not found', ru:'Ничего не найдено', ar:'لم يتم العثور على شيء', tr:'Bulunamadı' }

// Ərəb axtarışı hərəkəsiz də işləsin: "رحمن" → "ٱلرَّحۡمَٰنُ"
const normAr = (s) => String(s || '').replace(/[ً-ٰٟۖ-ۭـ\s]/g, '').replace(/[ٱأإآ]/g, 'ا')
const HAS_ARABIC = /[؀-ۿ]/

// Kartdakı məna sətri. Ərəbcədə "məna" adın özüdür — göstərilmir.
// NAMES_99-da "tr" sahəsi transliterasiyadır; türkcə məna "tr_meaning"-dədir.
// Başqa dilə (ingiliscəyə) düşmür — hər dilin öz mətni var.
const meaningOf = (name, lang) => lang === 'ar' ? '' : lang === 'tr' ? (name.tr_meaning || '') : (name[lang] || '')

// Kartın açılan pəncərəsinin kiçik mətnləri (5 dil)
const UI = {
  az: { open:'Ətraflı bax', close:'Bağla', prev:'Əvvəlki ad', next:'Növbəti ad', count:'ad', of:'/ 99' },
  en: { open:'View details', close:'Close', prev:'Previous name', next:'Next name', count:'names', of:'/ 99' },
  ru: { open:'Подробнее', close:'Закрыть', prev:'Предыдущее имя', next:'Следующее имя', count:'имён', of:'/ 99' },
  ar: { open:'عرض التفاصيل', close:'إغلاق', prev:'الاسم السابق', next:'الاسم التالي', count:'اسمًا', of:'/ 99' },
  tr: { open:'Ayrıntılı bak', close:'Kapat', prev:'Önceki isim', next:'Sonraki isim', count:'isim', of:'/ 99' },
}

export default function NamesPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.names || T.az.names
  const ui = UI[lang] || UI.en
  const [search, setSearch] = useState('')
  // Açılmış ad (kartın "açılması" — mərkəzi pəncərə); null — bağlı
  const [openIdx, setOpenIdx] = useState(null)
  const lastFocus = useRef(null)
  const closeRef = useRef(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return NAMES_99
    if (HAS_ARABIC.test(q)) {
      const nq = normAr(q)
      return NAMES_99.filter(n => normAr(n.ar).includes(nq))
    }
    return NAMES_99.filter(n =>
      n.tr.toLowerCase().includes(q) ||
      (lang === 'tr' ? (n.tr_meaning || '') : (n[lang] || '')).toLowerCase().includes(q) ||
      (n.en || '').toLowerCase().includes(q) ||
      String(n.n) === q
    )
  }, [search, lang])

  const opened = openIdx != null ? NAMES_99[openIdx] : null

  const openName = (n, el) => {
    lastFocus.current = el || null
    setOpenIdx(NAMES_99.findIndex(x => x.n === n))
  }
  const closeName = useCallback(() => {
    setOpenIdx(null)
    // Fokus açan karta qayıtsın (klaviatura ilə gəzən itməsin)
    requestAnimationFrame(() => lastFocus.current?.focus?.())
  }, [])
  const step = useCallback((d) => setOpenIdx(i => (i == null ? i : (i + d + NAMES_99.length) % NAMES_99.length)), [])

  // Pəncərə açıqdır: Esc — bağla, ←/→ — əvvəlki/növbəti (ərəbcədə güzgülənir)
  useEffect(() => {
    if (openIdx == null) return undefined
    closeRef.current?.focus()
    const rtl = document.documentElement.dir === 'rtl'
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeName() }
      // Fokus pəncərədən çıxmasın (Tab arxadakı səhifəyə keçirdi)
      else if (e.key === 'Tab') {
        const card = document.querySelector('.names-modal-card')
        const items = card ? [...card.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')] : []
        if (!items.length) return
        const first = items[0], last = items[items.length - 1]
        if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus() }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
      else if (e.key === 'ArrowRight') step(rtl ? -1 : 1)
      else if (e.key === 'ArrowLeft') step(rtl ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIdx == null, closeName, step]) // eslint-disable-line react-hooks/exhaustive-deps
  // Telefonda "Geri" (jest / düymə) pəncərəni bağlasın, səhifədən çıxarmasın
  // (kitab və video pəncərələri ilə eyni davranış)
  useBackToClose(openIdx != null, closeName)

  return (
    <div className="names-page">
      {/* Hero — dizayn v2 (sakit kağız fon + xatəm naxışı), bir <h1>.
          Ərəbcədə başlıq onsuz da ərəbcədir — təkrar sətir göstərilmir */}
      <header className="ui-page-hero names-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('names'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="names-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">أَسۡمَاءُ ٱللَّهِ ٱلۡحُسۡنَىٰ</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          {/* Hədis — ortada, qızılı ornamentlə */}
          <figure className="names-hadith-banner" data-reveal="blur">
            <div className="ui-ornament" data-reveal="" aria-hidden="true"><span className="ui-ornament__star" /></div>
            <blockquote className="names-hadith-text">{t.hadith}</blockquote>
            <figcaption className="names-hadith-ref">— {t.hadithRef}</figcaption>
          </figure>

          <div className="names-toolbar">
            <label className="names-search">
              <span className="ui-sr-only">{t.searchPh}</span>
              <Icon name="search" size={18} className="names-search-ic" />
              <input
                type="search"
                className="ui-input"
                placeholder={t.searchPh}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </label>
            <p className="names-count" aria-live="polite">
              <span className="ui-num">{filtered.length}</span> {ui.count}
            </p>
          </div>

          {/* 99 ad şəbəkəsi — kartlar ekrana girəndə yumşaq böyüyərək görünür
              (ilk 8-i növbə ilə, sonrakılar sütuna görə kiçik fərqlə). Karta
              toxunanda ad iri pəncərədə "açılır" */}
          <ol className="names-grid">
            {filtered.map((name, i) => {
              const meaning = meaningOf(name, lang)
              return (
                <li key={name.n} data-reveal="zoom" data-reveal-delay={i < 8 ? i * 40 : (i % 4) * 40}>
                  <button type="button" className="name-card"
                    onClick={(e) => openName(name.n, e.currentTarget)}
                    aria-haspopup="dialog"
                    aria-label={`${name.n}. ${name.tr}${meaning ? ' — ' + meaning : ''}. ${ui.open}`}>
                    <span className="name-num ui-num" aria-hidden="true">{name.n}</span>
                    <span className="name-arabic" lang="ar" dir="rtl" aria-hidden="true">{name.ar}</span>
                    <span className="name-translit" dir="ltr" aria-hidden="true">{name.tr}</span>
                    {meaning && <span className="name-meaning" aria-hidden="true">{meaning}</span>}
                  </button>
                </li>
              )
            })}
          </ol>

          {filtered.length === 0 && (
            <div className="names-empty" data-reveal="fade">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
              <p>{NOT_FOUND[lang] || NOT_FOUND.en}</p>
            </div>
          )}
        </div>
      </section>

      {/* Açılmış ad — mərkəzi pəncərə (arxa fona toxunanda bağlanır) */}
      {opened && createPortal(
        <div className="names-modal" onClick={(e) => { if (e.target === e.currentTarget) closeName() }}>
          <div className="names-modal-card ui-card" role="dialog" aria-modal="true" aria-labelledby="names-modal-title">
            <div className="ui-pattern" aria-hidden="true" />
            <div className="names-modal-top">
              <span className="ui-badge ui-badge--accent ui-num" dir="ltr">{opened.n} {ui.of}</span>
              <button type="button" ref={closeRef} className="ui-icon-btn" onClick={closeName} aria-label={ui.close}>
                <Icon name="close" />
              </button>
            </div>
            {/* key — ad dəyişəndə məzmun yenidən yumşaq görünür */}
            <div className="names-modal-body" key={opened.n}>
              <p className="names-modal-ar ui-arabic" lang="ar" dir="rtl">{opened.ar}</p>
              <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star" /></div>
              <h2 className="names-modal-title" id="names-modal-title" dir="ltr">{opened.tr}</h2>
              {meaningOf(opened, lang) && <p className="names-modal-meaning">{meaningOf(opened, lang)}</p>}
            </div>
            <div className="names-modal-nav">
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => step(-1)} aria-label={ui.prev}>
                <Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" />
                <span className="names-nav-label">{ui.prev}</span>
              </button>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => step(1)} aria-label={ui.next}>
                <span className="names-nav-label">{ui.next}</span>
                <Icon name="chevron" className="ui-btn__icon ui-flip-rtl" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
