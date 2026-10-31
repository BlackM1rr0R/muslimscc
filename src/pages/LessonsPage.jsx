import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { guessLang } from '../utils/textLang'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { parsePath, pathFor } from '../seo/routes'
import useActiveSection from '../hooks/useActiveSection'
import LessonBlocks, { pick } from '../components/lesson/LessonBlocks'
import ReportErrorButton from '../components/ReportErrorButton'
import ListenButton from '../components/ListenButton'
import { LESSONS, LESSON_CATS, CAT_BY_KEY, lessonBySlug } from '../data/lessons/index'
import { loadLesson } from '../data/lessons/load'
import '../styles/LessonsPage.css'

/* ══════════════════════════════════════════════════════════════════
   DƏRSLƏR — /learn (siyahı, kateqoriyalar üzrə) və /learn/<slug> (dərs)

   Məzmun src/data/lessons/*.js-dədir (format: README.md). Siyahı yalnız
   meta-nı (index.js) yükləyir; dərsin mətni açılanda ayrıca chunk kimi
   gəlir. Səhifə heç bir fakt əlavə etmir — hamısı məlumatdandır.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    eyebrow: 'Hədis və bilik', title: 'Dərslər',
    subtitle: 'Əqidə, fiqh, əxlaq və elm üzrə qısa, dəlilli dərslər — Quran, səhih Sünnə və Sələf alimlərinin sözləri əsasında.',
    search: 'Dərs axtar...', clear: 'Axtarışı təmizlə', all: 'Hamısı', noResults: 'Nəticə tapılmadı',
    read: 'Oxu', min: (n) => `${n} dəq`, contents: 'İçindəkilər', sources: 'Mənbələr', allLessons: 'Bütün dərslər',
    loading: 'Dərs yüklənir…', error: 'Dərs yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    prev: 'Əvvəlki dərs', next: 'Növbəti dərs', sameCat: 'Bu bölmədən', count: (n) => `${n} dərs`, by: 'Əsas mənbə',
    share: 'Paylaş', copied: 'Keçid kopyalandı', copyFail: 'Keçidi kopyalamaq alınmadı',
  },
  en: {
    eyebrow: 'Hadith & knowledge', title: 'Lessons',
    subtitle: 'Short lessons with evidence on creed, fiqh, character and knowledge — based on the Quran, the authentic Sunnah and the words of the scholars of the Salaf.',
    search: 'Search lessons...', clear: 'Clear search', all: 'All', noResults: 'No results found',
    read: 'Read', min: (n) => `${n} min`, contents: 'Contents', sources: 'Sources', allLessons: 'All lessons',
    loading: 'Loading the lesson…', error: 'The lesson could not be loaded. Check your connection and try again.', retry: 'Try again',
    prev: 'Previous lesson', next: 'Next lesson', sameCat: 'From this section', count: (n) => `${n} ${n === 1 ? 'lesson' : 'lessons'}`, by: 'Main source',
    share: 'Share', copied: 'Link copied', copyFail: 'Could not copy the link',
  },
  ru: {
    eyebrow: 'Хадисы и знание', title: 'Уроки',
    subtitle: 'Краткие уроки с доказательствами по вероубеждению, фикху, нравам и знанию — на основе Корана, достоверной Сунны и слов учёных саляфа.',
    search: 'Поиск уроков...', clear: 'Очистить поиск', all: 'Все', noResults: 'Результаты не найдены',
    read: 'Читать', min: (n) => `${n} мин`, contents: 'Содержание', sources: 'Источники', allLessons: 'Все уроки',
    loading: 'Урок загружается…', error: 'Не удалось загрузить урок. Проверьте подключение и повторите попытку.', retry: 'Повторить',
    prev: 'Предыдущий урок', next: 'Следующий урок', sameCat: 'Из этого раздела', count: (n) => `${n} ${ruPlural(n, 'урок', 'урока', 'уроков')}`, by: 'Основной источник',
    share: 'Поделиться', copied: 'Ссылка скопирована', copyFail: 'Не удалось скопировать ссылку',
  },
  ar: {
    eyebrow: 'الحديث والعلم', title: 'الدروس',
    subtitle: 'دروس مختصرة بالأدلة في العقيدة والفقه والأخلاق والعلم، من القرآن والسنة الصحيحة وكلام علماء السلف.',
    search: 'ابحث في الدروس...', clear: 'مسح البحث', all: 'الكل', noResults: 'لم يتم العثور على نتائج',
    read: 'اقرأ', min: (n) => `${n} د`, contents: 'المحتويات', sources: 'المصادر', allLessons: 'جميع الدروس',
    loading: 'جارٍ تحميل الدرس…', error: 'تعذّر تحميل الدرس. تحقّق من الاتصال وأعد المحاولة.', retry: 'أعد المحاولة',
    prev: 'الدرس السابق', next: 'الدرس التالي', sameCat: 'من هذا القسم', count: (n) => `${n} ${n >= 3 && n <= 10 ? 'دروس' : 'درسًا'}`, by: 'المصدر الأساسي',
    share: 'مشاركة', copied: 'تم نسخ الرابط', copyFail: 'تعذّر نسخ الرابط',
  },
  tr: {
    eyebrow: 'Hadis ve ilim', title: 'Dersler',
    subtitle: 'Akide, fıkıh, ahlak ve ilim üzerine delilli kısa dersler — Kur’an, sahih Sünnet ve Selef âlimlerinin sözlerine göre.',
    search: 'Ders ara...', clear: 'Aramayı temizle', all: 'Tümü', noResults: 'Sonuç bulunamadı',
    read: 'Oku', min: (n) => `${n} dk`, contents: 'İçindekiler', sources: 'Kaynaklar', allLessons: 'Tüm dersler',
    loading: 'Ders yükleniyor…', error: 'Ders yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    prev: 'Önceki ders', next: 'Sonraki ders', sameCat: 'Bu bölümden', count: (n) => `${n} ders`, by: 'Ana kaynak',
    share: 'Paylaş', copied: 'Bağlantı kopyalandı', copyFail: 'Bağlantı kopyalanamadı',
  },
}

function ruPlural(n, one, few, many) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}
const prefersReduced = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return true }
}

export default function LessonsPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const location = useLocation()
  const routerNavigate = useNavigate()
  const { key: routeKey, param } = parsePath(location.pathname)
  const selected = routeKey === 'learn' && param ? lessonBySlug(param) : null

  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(lang)
    return LESSONS.filter(l => {
      if (cat !== 'all' && l.cat !== cat) return false
      if (!q) return true
      return [pick(l.title, lang), pick(l.summary, lang), pick(l.author, lang), l.arTitle, l.title.en]
        .some(v => String(v || '').toLocaleLowerCase(lang).includes(q))
    })
  }, [search, cat, lang])

  // Dərs yuxarıdan açılır, siyahıya qayıdanda əvvəlki yer
  const listY = useRef(0)
  const prevSel = useRef(null)
  useLayoutEffect(() => {
    const was = prevSel.current
    prevSel.current = selected
    if (selected && selected !== was) window.scrollTo(0, 0)
    else if (!selected && was) {
      const y = listY.current
      window.scrollTo(0, y)
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
  }, [selected])

  const open = (l, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    listY.current = window.scrollY
    routerNavigate(pathFor('learn', lang, l.slug), { state: { lsList: true } })
  }
  const goSibling = (l, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    routerNavigate(pathFor('learn', lang, l.slug), { replace: true, state: window.history.state?.usr ?? null })
  }
  const backToList = () => {
    if (window.history.state?.usr?.lsList) window.history.back()
    else routerNavigate(pathFor('learn', lang))
  }

  if (selected) {
    return <Lesson key={selected.slug} m={selected} L={L} lang={lang} onBack={backToList} onSibling={goSibling} />
  }

  const counts = Object.fromEntries(LESSON_CATS.map(c => [c.key, LESSONS.filter(l => l.cat === c.key).length]))
  const grouped = cat === 'all' && !search.trim()
  const card = (l) => (
    <li key={l.slug}>
      <a className="ui-card ui-card--interactive ls-card" href={pathFor('learn', lang, l.slug)} onClick={(e) => open(l, e)}>
        <span className="ls-card__top">
          <span className="ui-icon-tile ui-icon-tile--sm"><Icon name={l.icon || CAT_BY_KEY[l.cat]?.icon || 'books'} /></span>
          <span className="ls-card__min ui-num"><Icon name="clock" size={14} /> {L.min(l.minutes || 5)}</span>
        </span>
        {lang !== 'ar' && l.arTitle && <span className="ls-card__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">{l.arTitle}</span>}
        <span className="ls-card__title">{pick(l.title, lang)}</span>
        <span className="ls-card__sum">{pick(l.summary, lang)}</span>
        <span className="ls-card__foot">
          <span className="ls-card__by">{pick(l.author, lang)}</span>
          <span className="ls-card__read">{L.read} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" /></span>
        </span>
      </a>
    </li>
  )

  return (
    <div className="ls-page ls-listing">
      <header className="ui-page-hero ls-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          <p className="ui-lead">{L.subtitle}</p>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className="ls-toolbar">
            <div className="ls-search">
              <Icon name="search" size={19} className="ls-search__icon" />
              <input className="ui-input ls-search__input" type="search" aria-label={L.search} placeholder={L.search}
                enterKeyHint="search" value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button type="button" className="ui-icon-btn ls-search__clear" onClick={() => setSearch('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <div className="ls-chips" role="group" aria-label={L.title}>
              <button type="button" className="ui-chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
                {L.all} <span className="ls-chip__n ui-num">{LESSONS.length}</span>
              </button>
              {LESSON_CATS.filter(c => counts[c.key] > 0).map(c => (
                <button key={c.key} type="button" className="ui-chip" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}>
                  {pick(c.label, lang)} <span className="ls-chip__n ui-num">{counts[c.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken ls-empty">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
              <p>{L.noResults}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setCat('all') }}>
                <Icon name="close" className="ui-btn__icon" /> {L.clear}
              </button>
            </div>
          ) : grouped ? (
            LESSON_CATS.map(c => {
              const items = filtered.filter(l => l.cat === c.key)
              if (!items.length) return null
              return (
                <section key={c.key} className="ls-group" aria-labelledby={`ls-cat-${c.key}`}>
                  <div className="ls-group__head" data-reveal>
                    <span className="ui-icon-tile"><Icon name={c.icon} /></span>
                    <div>
                      <h2 id={`ls-cat-${c.key}`} className="ls-group__title">{pick(c.label, lang)} <span className="ls-group__n">· {L.count(items.length)}</span></h2>
                      <p className="ls-group__desc">{pick(c.desc, lang)}</p>
                    </div>
                  </div>
                  <ul className="ls-grid" data-reveal="stagger">{items.map(card)}</ul>
                </section>
              )
            })
          ) : (
            <ul className="ls-grid" data-reveal="stagger" key={`${cat}|${search ? 'q' : ''}`}>{filtered.map(card)}</ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   DƏRS — hero → içindəkilər (yan panel) → bölmələr → mənbələr →
   əvvəlki/növbəti + eyni kateqoriyadan.
   ══════════════════════════════════════════════════════════════════ */
function Lesson({ m, L, lang, onBack, onSibling }) {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    const p = loadLesson(m.slug)
    if (!p) { setState({ status: 'error', data: null }); return }
    setState(s => (s.data ? s : { status: 'loading', data: null }))
    p.then(data => { if (live) setState({ status: 'ok', data }) })
      .catch(() => { if (live) setState({ status: 'error', data: null }) })
    return () => { live = false }
  }, [m.slug, attempt])

  const data = state.data
  const sections = useMemo(() => (data?.sections || []).map(s => ({ id: `ls-${s.id}`, label: pick(s.title, lang) })), [data, lang])
  const [active, setActive] = useActiveSection(sections.map(x => x.id), `${m.slug}|${lang}|${sections.length}`)

  const inCat = LESSONS.filter(x => x.cat === m.cat)
  const idx = LESSONS.indexOf(m)
  const prev = idx > 0 ? LESSONS[idx - 1] : null
  const next = idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null
  const catMeta = CAT_BY_KEY[m.cat]

  const jump = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
    el.querySelector('h2')?.focus({ preventScroll: true })
  }

  const [toast, setToast] = useState(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const flash = (text, ok) => {
    timers.current.forEach(clearTimeout)
    setToast({ text, ok, leaving: false })
    timers.current = [
      setTimeout(() => setToast(t => t && { ...t, leaving: true }), 2400),
      setTimeout(() => setToast(null), prefersReduced() ? 2400 : 2600),
    ]
  }
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: `${pick(m.title, lang)} — Muslims.cc`, url }); return } catch (err) {
        if (err && err.name === 'AbortError') return
      }
    }
    try { await navigator.clipboard.writeText(url); flash(L.copied, true) } catch { flash(L.copyFail, false) }
  }

  const siblingCard = (x, dir) => (
    <a className={`ui-card ui-card--interactive ls-pager__card ls-pager__card--${dir}`} href={pathFor('learn', lang, x.slug)} onClick={(e) => onSibling(x, e)}>
      <span className="ls-pager__dir">
        {dir === 'prev' ? <><Icon name="arrow" size={15} className="ls-back-ic" /> {L.prev}</> : <>{L.next} <Icon name="arrow" size={15} className="ui-flip-rtl" /></>}
      </span>
      <span className="ls-pager__name">{pick(x.title, lang)}</span>
    </a>
  )

  return (
    <div className="ls-page ls-lesson">
      <header className="ui-page-hero ls-lhero" data-ls-slug={m.slug}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <nav className="ui-page-hero__crumbs" aria-label={L.title}>
            <button type="button" className="ls-crumb-btn" onClick={onBack}>
              <Icon name="arrow" size={15} className="ls-back-ic" /> {L.allLessons}
            </button>
          </nav>
          <span className="ui-eyebrow">{pick(catMeta?.label, lang)}</span>
          <h1 className="ui-display ls-lhero__title">{pick(m.title, lang)}</h1>
          {lang !== 'ar' && m.arTitle && <p className="ls-lhero__ar ui-arabic" lang="ar" dir="rtl">{m.arTitle}</p>}
          <p className="ui-lead">{pick(m.summary, lang)}</p>
          <div className="ls-lhero__meta">
            {m.author && <span className="ls-meta-chip"><Icon name="books" size={15} /> {L.by}: {pick(m.author, lang)}</span>}
            <span className="ls-meta-chip ui-num"><Icon name="clock" size={15} /> {L.min(m.minutes || 5)}</span>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={share}>
              <Icon name="share" className="ui-btn__icon" /> {L.share}
            </button>
            {data && <ListenButton target=".ls-article" selector="h2, h3, p, li, blockquote" />}
          </div>
        </div>
      </header>

      <div className="ui-section ls-body">
        <div className="ui-container ls-layout">
          {sections.length > 1 && (
            <aside className="ls-toc">
              <nav aria-label={L.contents}>
                <p className="ls-toc__title">{L.contents}</p>
                <ol className="ls-toc__list">
                  {sections.map(x => (
                    <li key={x.id}>
                      <a href={`#${x.id}`} className="ls-toc__link" aria-current={active === x.id ? 'true' : undefined} onClick={(e) => jump(e, x.id)}>
                        <span>{x.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          )}

          <article className="ls-article" aria-busy={state.status === 'loading'}>
            {state.status === 'loading' && (
              <div className="ls-loading" role="status">
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '40%' }} />
                <span className="ui-skeleton ui-skeleton--text" />
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '85%' }} />
                <span className="ui-sr-only">{L.loading}</span>
              </div>
            )}
            {state.status === 'error' && (
              <div className="ui-card ui-card--sunken ls-empty" role="alert">
                <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="alert" /></span>
                <p>{L.error}</p>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(a => a + 1)}>
                  <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
                </button>
              </div>
            )}
            {data && data.sections.map(s => (
              <section key={s.id} id={`ls-${s.id}`} className="ls-sec" aria-labelledby={`ls-${s.id}-h`}>
                <h2 id={`ls-${s.id}-h`} className="ls-sec__title" tabIndex={-1}>{pick(s.title, lang)}</h2>
                <LessonBlocks blocks={s.blocks} lang={lang} />
              </section>
            ))}
            {data?.sources?.length > 0 && (
              <section className="ls-sec ui-card ui-card--sunken ls-sources" aria-labelledby="ls-sources-h">
                <h2 id="ls-sources-h" className="ls-sec__title" tabIndex={-1}>{L.sources}</h2>
                <ul className="ls-sources__list">
                  {data.sources.map((r, i) => (
                    <li key={i}>
                      <Icon name={r.url ? 'external' : 'books'} size={15} />
                      {r.url
                        ? <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto" lang={guessLang(r.label)}>{r.label}</a>
                        : <span dir="auto" lang={guessLang(r.label)}>{r.label}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data && (
              <div className="ls-report">
                <ReportErrorButton refText={`${pick(m.title, lang)} (/learn/${m.slug})`} kind="text" />
              </div>
            )}
          </article>
        </div>

        <div className="ui-container ls-after">
          <nav className="ls-pager" aria-label={L.title}>
            {prev ? siblingCard(prev, 'prev') : <span aria-hidden="true"></span>}
            {next ? siblingCard(next, 'next') : <span aria-hidden="true"></span>}
          </nav>
          {inCat.length > 1 && (
            <section className="ls-same" aria-labelledby="ls-same-h">
              <h2 id="ls-same-h" className="ls-same__title">{L.sameCat} <span className="ls-same__cat">· {pick(catMeta?.label, lang)}</span></h2>
              <ul className="ls-same__list">
                {inCat.filter(x => x !== m).map(x => (
                  <li key={x.slug}>
                    <a className="ui-chip ls-same__chip" href={pathFor('learn', lang, x.slug)} onClick={(e) => onSibling(x, e)}>{pick(x.title, lang)}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="ls-all">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onBack}>
              <Icon name="books" className="ui-btn__icon" /> {L.allLessons}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`ui-toast ls-toast${toast.leaving ? ' is-leaving' : ''}`} role="status" style={toast.ok ? undefined : { '--toast-accent': 'var(--bad)' }}>
          <span className="ui-toast__icon"><Icon name={toast.ok ? 'check' : 'alert'} /></span>
          <div className="ui-toast__body"><strong className="ui-toast__title">{toast.text}</strong></div>
        </div>
      )}
    </div>
  )
}
