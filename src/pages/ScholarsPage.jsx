import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { parsePath, pathFor } from '../seo/routes'
import useActiveSection from '../hooks/useActiveSection'
// Məlumat — src/data/scholars.js (prerender və SEO da oxuyur)
import { SCHOLARS, ERAS, ERA_LABEL, ERA_SHORT, ERA_SPAN, scholarBySlug, dateText, lifeSpan } from '../data/scholars'
import '../styles/ScholarsPage.css'

/* ══════════════════════════════════════════════════════════════════
   SƏLƏF ALİMLƏRİ — /scholars (siyahı) və /scholars/<slug> (profil)

   ŞƏKİL YOXDUR: alimin fotoşəkli/portreti göstərilmir (sahibin qərarı —
   Sələf alimlərinin çoxu öz şəklinin yayılmasını istəməyib). Əvəzinə adın
   ərəbcə XƏTTATLIQ KARTI: Amiri şrifti, xatəm naxışlı həndəsi çərçivə,
   dövrə görə rəng (Sələf — zümrüd, orta əsr — qum-qızılı, yeni dövr və
   müasir — sakit neytral/zümrüd), yer nişanı.

   Profil quruluşu SahabePage-dəki "kitab səhifəsi"nə oxşayır (hero →
   Bir baxışda → Həyatı → … → Mənbələr → Əvvəlki/Növbəti), amma kod
   ondan asılı deyil. Mətnlərin hamısı məlumatdandır — burada heç bir
   fakt əlavə olunmur.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    eyebrow: 'Hədis və bilik', title: 'Sələf alimləri',
    subtitle: 'Əhli-sünnə vəl-cəmaat yolunda olan alimlər — tabiinlərdən müasir dövrədək: həyatı, müəllimləri, əsərləri və alimlərin onlar haqqında sözləri, mənbələri ilə.',
    search: 'Alim axtar...', clear: 'Axtarışı təmizlə', filter: 'Dövr', all: 'Hamısı', noResults: 'Nəticə tapılmadı',
    read: 'Həyatını oxu', allScholars: 'Bütün alimlər', share: 'Paylaş', copied: 'Keçid kopyalandı', copyFail: 'Keçidi kopyalamaq alınmadı',
    contents: 'İçindəkilər', glance: 'Bir baxışda', fullName: 'Tam adı', born: 'Doğulub', died: 'Vəfat edib',
    birthplace: 'Doğulduğu yer', city: 'Yaşadığı yer', era: 'Dövr', life: 'Həyatı', contribution: 'Elmə töhfəsi',
    people: 'Müəllimləri və tələbələri', teachers: 'Müəllimləri', students: 'Tələbələri', works: 'Əsas əsərləri',
    praise: 'Alimlər onun haqqında', note: 'Qeyd', sources: 'Mənbələr',
    sourcesNote: 'Bu səhifədəki məlumatların götürüldüyü kitab və saytlar.', prev: 'Əvvəlki alim', next: 'Növbəti alim',
    sameEra: 'Eyni dövrdən', count: (n) => `${n} alim`, noPhoto: 'Alimlərin şəkli göstərilmir — yalnız adının ərəbcə yazılışı.',
  },
  en: {
    eyebrow: 'Hadith & knowledge', title: 'Scholars of the Salaf',
    subtitle: 'Scholars upon the way of Ahl as-Sunnah wal-Jama‘ah — from the Tabi‘un to our time: their lives, teachers, works and what other scholars said about them, with sources.',
    search: 'Search scholars...', clear: 'Clear search', filter: 'Era', all: 'All', noResults: 'No results found',
    read: 'Read biography', allScholars: 'All scholars', share: 'Share', copied: 'Link copied', copyFail: 'Could not copy the link',
    contents: 'Contents', glance: 'At a glance', fullName: 'Full name', born: 'Born', died: 'Died',
    birthplace: 'Birthplace', city: 'Lived in', era: 'Era', life: 'Biography', contribution: 'Contribution to knowledge',
    people: 'Teachers and students', teachers: 'Teachers', students: 'Students', works: 'Major works',
    praise: 'What scholars said about him', note: 'Note', sources: 'Sources',
    sourcesNote: 'Books and websites from which the information on this page is taken.', prev: 'Previous scholar', next: 'Next scholar',
    sameEra: 'From the same era', count: (n) => `${n} ${n === 1 ? 'scholar' : 'scholars'}`, noPhoto: 'No pictures of the scholars are shown — only their names in Arabic script.',
  },
  ru: {
    eyebrow: 'Хадисы и знание', title: 'Учёные саляфа',
    subtitle: 'Учёные пути ахлю-сунна валь-джамаа — от табиинов до нашего времени: их жизнь, учителя, труды и слова других учёных о них, с источниками.',
    search: 'Поиск учёных...', clear: 'Очистить поиск', filter: 'Эпоха', all: 'Все', noResults: 'Результаты не найдены',
    read: 'Читать биографию', allScholars: 'Все учёные', share: 'Поделиться', copied: 'Ссылка скопирована', copyFail: 'Не удалось скопировать ссылку',
    contents: 'Содержание', glance: 'Коротко', fullName: 'Полное имя', born: 'Родился', died: 'Скончался',
    birthplace: 'Место рождения', city: 'Жил в', era: 'Эпоха', life: 'Биография', contribution: 'Вклад в науку',
    people: 'Учителя и ученики', teachers: 'Учителя', students: 'Ученики', works: 'Основные труды',
    praise: 'Учёные о нём', note: 'Примечание', sources: 'Источники',
    sourcesNote: 'Книги и сайты, из которых взяты сведения на этой странице.', prev: 'Предыдущий учёный', next: 'Следующий учёный',
    sameEra: 'Из той же эпохи', count: (n) => `${n} ${ruPlural(n, 'учёный', 'учёных', 'учёных')}`, noPhoto: 'Изображения учёных не показываются — только их имена арабским письмом.',
  },
  ar: {
    eyebrow: 'الحديث والعلم', title: 'علماء السلف',
    subtitle: 'علماء على طريقة أهل السنة والجماعة، من التابعين إلى عصرنا: سيرهم وشيوخهم ومؤلفاتهم وثناء العلماء عليهم، مع المصادر.',
    search: 'ابحث عن عالم...', clear: 'مسح البحث', filter: 'الحقبة', all: 'الكل', noResults: 'لم يتم العثور على نتائج',
    read: 'اقرأ السيرة', allScholars: 'جميع العلماء', share: 'مشاركة', copied: 'تم نسخ الرابط', copyFail: 'تعذّر نسخ الرابط',
    contents: 'المحتويات', glance: 'لمحة سريعة', fullName: 'الاسم الكامل', born: 'المولد', died: 'الوفاة',
    birthplace: 'مكان المولد', city: 'موطنه', era: 'الحقبة', life: 'السيرة', contribution: 'أثره في العلم',
    people: 'شيوخه وتلاميذه', teachers: 'شيوخه', students: 'تلاميذه', works: 'أبرز مؤلفاته',
    praise: 'ثناء العلماء عليه', note: 'تنبيه', sources: 'المصادر',
    sourcesNote: 'الكتب والمواقع التي أُخذت منها معلومات هذه الصفحة.', prev: 'العالم السابق', next: 'العالم التالي',
    sameEra: 'من الحقبة نفسها', count: (n) => arCount(n), noPhoto: 'لا تُعرض صور العلماء، وإنما أسماؤهم بالخط العربي.',
  },
  tr: {
    eyebrow: 'Hadis ve ilim', title: 'Selef Âlimleri',
    subtitle: 'Ehl-i sünnet ve’l-cemaat yolundaki âlimler — tâbiînden günümüze: hayatları, hocaları, eserleri ve diğer âlimlerin onlar hakkındaki sözleri, kaynaklarıyla.',
    search: 'Âlim ara...', clear: 'Aramayı temizle', filter: 'Dönem', all: 'Tümü', noResults: 'Sonuç bulunamadı',
    read: 'Hayatını oku', allScholars: 'Tüm âlimler', share: 'Paylaş', copied: 'Bağlantı kopyalandı', copyFail: 'Bağlantı kopyalanamadı',
    contents: 'İçindekiler', glance: 'Bir bakışta', fullName: 'Tam adı', born: 'Doğumu', died: 'Vefatı',
    birthplace: 'Doğum yeri', city: 'Yaşadığı yer', era: 'Dönem', life: 'Hayatı', contribution: 'İlme katkısı',
    people: 'Hocaları ve talebeleri', teachers: 'Hocaları', students: 'Talebeleri', works: 'Başlıca eserleri',
    praise: 'Âlimler onun hakkında', note: 'Not', sources: 'Kaynaklar',
    sourcesNote: 'Bu sayfadaki bilgilerin alındığı kitap ve siteler.', prev: 'Önceki âlim', next: 'Sonraki âlim',
    sameEra: 'Aynı dönemden', count: (n) => `${n} âlim`, noPhoto: 'Âlimlerin resmi gösterilmez — yalnızca adlarının Arapça yazılışı.',
  },
}

function ruPlural(n, one, few, many) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}
function arCount(n) {
  if (n === 1) return 'عالم واحد'
  if (n === 2) return 'عالمان'
  if (n % 100 >= 3 && n % 100 <= 10) return `${n} علماء`
  return `${n} عالمًا`
}

// Dilə görə sahə (yoxdursa ingiliscə)
const pick = (obj, lang) => (obj && (obj[lang] || obj.en)) || ''
const prefersReduced = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return true }
}

/* ── Xəttatlıq kartı — adın ərəbcə yazılışı həndəsi çərçivədə ──
   Dekorativdir (aria-hidden): ad mətndə onsuz da var. Rəng dövrdən. */
const NameCard = ({ s, size = 'md' }) => (
  <span className={`sc-callig sc-callig--${size} sc-era--${s.era}`} aria-hidden="true">
    <span className="sc-callig__pattern" />
    <span className="sc-callig__frame">
      <span className="sc-callig__star sc-callig__star--s" />
      <span className="sc-callig__star sc-callig__star--e" />
      <span className="sc-callig__name" lang="ar" dir="rtl">{s.name.ar}</span>
    </span>
  </span>
)

const EraBadge = ({ era, lang }) => (
  <span className={`ui-badge sc-era-badge sc-era--${era}`}>{pick(ERA_SHORT[era], lang)}</span>
)

const Place = ({ s, lang }) => (
  <span className="sc-place"><Icon name="pin" size={14} /> {pick(s.city, lang)}</span>
)

export default function ScholarsPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const isAr = lang === 'ar'
  const location = useLocation()
  const routerNavigate = useNavigate()
  const { key: routeKey, param } = parsePath(location.pathname)
  const selected = routeKey === 'scholars' && param ? scholarBySlug(param) : null

  const [search, setSearch] = useState('')
  const [era, setEra] = useState('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(lang)
    return SCHOLARS.filter(s => {
      if (era !== 'all' && s.era !== era) return false
      if (!q) return true
      const hay = [pick(s.name, lang), pick(s.fullName, lang), pick(s.title, lang), pick(s.city, lang), s.name.en, s.name.ar, s.fullName.ar]
      return hay.some(v => String(v || '').toLocaleLowerCase(lang).includes(q))
    })
  }, [search, era, lang])

  /* ── Sürüşmə: profil yuxarıdan açılır, siyahıya qayıdanda əvvəlki yer ── */
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

  // Kart və qonşu linkləri <a href>-dir: adi klik SPA ilə, Ctrl/orta klik — yeni tabda
  const openProfile = (s, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    listY.current = window.scrollY
    routerNavigate(pathFor('scholars', lang, s.slug), { state: { scList: true } })
  }
  // Əvvəlki / növbəti / eyni dövrdən: girişi əvəz et — "geri" yenə siyahıya aparsın
  const goSibling = (s, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    routerNavigate(pathFor('scholars', lang, s.slug), { replace: true, state: window.history.state?.usr ?? null })
  }
  const backToList = () => {
    if (window.history.state?.usr?.scList) window.history.back()
    else routerNavigate(pathFor('scholars', lang))
  }

  if (selected) {
    return <Profile key={selected.slug} s={selected} L={L} lang={lang} isAr={isAr} onBack={backToList} onSibling={goSibling} />
  }

  const counts = Object.fromEntries(ERAS.map(k => [k, SCHOLARS.filter(s => s.era === k).length]))
  // Filtr və axtarış yoxdursa — dövr üzrə qruplar (başlıqla); varsa — düz siyahı
  const grouped = era === 'all' && !search.trim()
  const card = (s) => (
    <li key={s.slug}>
      <a className="ui-card ui-card--interactive sc-card" href={pathFor('scholars', lang, s.slug)} onClick={(e) => openProfile(s, e)}>
        <NameCard s={s} />
        <span className="sc-card__body">
          <span className="sc-card__top"><EraBadge era={s.era} lang={lang} /> <span className="sc-card__years ui-num">{lifeSpan(s, lang)}</span></span>
          <span className="sc-card__name">{pick(s.name, lang)}</span>
          <span className="sc-card__title">{pick(s.title, lang)}</span>
          <span className="sc-card__foot">
            <Place s={s} lang={lang} />
            <span className="sc-card__read">{L.read} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" /></span>
          </span>
        </span>
      </a>
    </li>
  )

  return (
    <div className="sc-page sc-list">
      <header className="ui-page-hero sc-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          {!isAr && <p className="sc-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">علماء السلف</p>}
          <p className="ui-lead">{L.subtitle}</p>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className="sc-toolbar">
            <div className="sc-search">
              <Icon name="search" size={19} className="sc-search__icon" />
              <input
                className="ui-input sc-search__input"
                type="search"
                aria-label={L.search}
                placeholder={L.search}
                enterKeyHint="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="ui-icon-btn sc-search__clear" onClick={() => setSearch('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <div className="sc-chips" role="group" aria-label={L.filter}>
              <button type="button" className="ui-chip" aria-pressed={era === 'all'} onClick={() => setEra('all')}>
                {L.all} <span className="sc-chip__n ui-num">{SCHOLARS.length}</span>
              </button>
              {ERAS.filter(k => counts[k] > 0).map(k => (
                <button key={k} type="button" className="ui-chip" aria-pressed={era === k} onClick={() => setEra(k)}>
                  <span className={`sc-dot sc-era--${k}`} aria-hidden="true" /> {pick(ERA_SHORT[k], lang)} <span className="sc-chip__n ui-num">{counts[k]}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="sc-photo-note"><Icon name="info" size={15} /> {L.noPhoto}</p>

          {filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken sc-empty">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
              <p>{L.noResults}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setEra('all') }}>
                <Icon name="close" className="ui-btn__icon" /> {L.clear}
              </button>
            </div>
          ) : grouped ? (
            ERAS.map(k => {
              const items = filtered.filter(s => s.era === k)
              if (!items.length) return null
              return (
                <section key={k} className="sc-group" aria-labelledby={`sc-era-${k}`}>
                  <div className="sc-group__head" data-reveal>
                    <span className={`sc-dot sc-dot--lg sc-era--${k}`} aria-hidden="true" />
                    <h2 id={`sc-era-${k}`} className="sc-group__title">{pick(ERA_LABEL[k], lang)}</h2>
                    <span className="sc-group__span">{pick(ERA_SPAN[k], lang)} · {L.count(items.length)}</span>
                  </div>
                  <ul className="sc-grid" data-reveal="stagger">{items.map(card)}</ul>
                </section>
              )
            })
          ) : (
            <ul className="sc-grid" data-reveal="stagger" key={`${era}|${search ? 'q' : ''}`}>{filtered.map(card)}</ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PROFİL — hero (xəttatlıq kartı, ad, tam ad, ləqəb, ömür, yer, paylaş)
   → Bir baxışda → Həyatı → Elmə töhfəsi → Müəllim/tələbə → Əsərlər →
   Alimlərin sözü → Qeyd (varsa) → Mənbələr → Əvvəlki/Növbəti + eyni dövrdən.
   ══════════════════════════════════════════════════════════════════ */
function Profile({ s, L, lang, isAr, onBack, onSibling }) {
  const n = pick(s.name, lang)
  const idx = SCHOLARS.indexOf(s)
  const prev = idx > 0 ? SCHOLARS[idx - 1] : null
  const next = idx < SCHOLARS.length - 1 ? SCHOLARS[idx + 1] : null
  const sameEra = SCHOLARS.filter(x => x.era === s.era && x !== s)
  const bio = s.bio[lang] || s.bio.en || []
  const teachers = s.teachers || []
  const students = s.students || []
  const works = s.works || []
  const praise = s.praise || []

  const sections = [
    { id: 'sc-glance', label: L.glance, icon: 'info' },
    { id: 'sc-life', label: L.life, icon: 'user' },
    { id: 'sc-contrib', label: L.contribution, icon: 'bulb' },
    teachers.length || students.length ? { id: 'sc-people', label: L.people, icon: 'jamaat' } : null,
    works.length ? { id: 'sc-works', label: L.works, icon: 'books' } : null,
    praise.length ? { id: 'sc-praise', label: L.praise, icon: 'quotes' } : null,
    s.note ? { id: 'sc-note', label: L.note, icon: 'alert' } : null,
    { id: 'sc-sources', label: L.sources, icon: 'link' },
  ].filter(Boolean)
  const [active, setActive] = useActiveSection(sections.map(x => x.id), `${s.slug}|${lang}`)

  const jump = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
    el.querySelector('h2')?.focus({ preventScroll: true })
  }

  /* ── Paylaş: Web Share API; yoxdursa keçidi kopyala + sakit toast ── */
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
      try { await navigator.share({ title: `${n} — Muslims.cc`, url }); return } catch (err) {
        if (err && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flash(L.copied, true)
    } catch {
      flash(L.copyFail, false)
    }
  }

  const glance = [
    { k: 'full', label: L.fullName, v: pick(s.fullName, lang), wide: true },
    { k: 'born', label: L.born, v: dateText(s.born, lang) },
    { k: 'died', label: L.died, v: dateText(s.died, lang) },
    { k: 'bp', label: L.birthplace, v: s.birthplace ? pick(s.birthplace, lang) : '' },
    { k: 'city', label: L.city, v: pick(s.city, lang) },
    { k: 'era', label: L.era, v: `${pick(ERA_LABEL[s.era], lang)} · ${pick(ERA_SPAN[s.era], lang)}`, wide: true },
  ].filter(r => r.v)

  const peopleList = (title, list) => (list.length > 0 && (
    <div className="sc-people__col">
      <h3 className="sc-people__title">{title}</h3>
      <ul className="sc-people__list">
        {list.map((p, i) => (
          <li key={i}>
            <span>{pick(p, lang)}</span>
            {!isAr && p.ar && <span className="sc-people__ar ui-arabic" lang="ar" dir="rtl">{p.ar}</span>}
          </li>
        ))}
      </ul>
    </div>
  ))

  const siblingCard = (x, dir) => (
    <a className={`ui-card ui-card--interactive sc-pager__card sc-pager__card--${dir}`} href={pathFor('scholars', lang, x.slug)} onClick={(e) => onSibling(x, e)}>
      <span className="sc-pager__dir">
        {dir === 'prev' ? <><Icon name="arrow" size={15} className="sc-back-ic" /> {L.prev}</> : <>{L.next} <Icon name="arrow" size={15} className="ui-flip-rtl" /></>}
      </span>
      <span className="sc-pager__who">
        <NameCard s={x} size="sm" />
        <span className="sc-pager__name">{pick(x.name, lang)}<span className="sc-pager__years ui-num">{lifeSpan(x, lang)}</span></span>
      </span>
    </a>
  )

  return (
    <div className="sc-page sc-profile">
      <header className="ui-page-hero sc-phero" data-sc-slug={s.slug}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <nav className="ui-page-hero__crumbs" aria-label={L.title}>
            <button type="button" className="sc-crumb-btn" onClick={onBack}>
              <Icon name="arrow" size={15} className="sc-back-ic" /> {L.allScholars}
            </button>
          </nav>
          <div className="sc-phero__grid">
            <NameCard s={s} size="lg" />
            <div className="sc-phero__text">
              <span className="sc-phero__eyebrow"><EraBadge era={s.era} lang={lang} /> <span className="ui-eyebrow">{pick(s.title, lang)}</span></span>
              <h1 className="ui-display sc-phero__name">{n}</h1>
              {!isAr && <p className="sc-phero__ar ui-arabic" lang="ar" dir="rtl">{s.fullName.ar}</p>}
              <p className="ui-lead sc-phero__lead">{pick(s.summary, lang)}</p>
              <div className="sc-phero__meta">
                <span className="sc-meta-chip ui-num"><Icon name="calendar" size={15} /> {lifeSpan(s, lang)}</span>
                <span className="sc-meta-chip"><Icon name="pin" size={15} /> {pick(s.city, lang)}</span>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={share}>
                  <Icon name="share" className="ui-btn__icon" /> {L.share}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="ui-section sc-body">
        <div className="ui-container sc-layout">
          <aside className="sc-toc">
            <nav aria-label={L.contents}>
              <p className="sc-toc__title">{L.contents}</p>
              <ol className="sc-toc__list">
                {sections.map(x => (
                  <li key={x.id}>
                    <a href={`#${x.id}`} className="sc-toc__link" aria-current={active === x.id ? 'true' : undefined} onClick={(e) => jump(e, x.id)}>
                      <Icon name={x.icon} size={16} /> <span>{x.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="sc-article">
            <section id="sc-glance" className="sc-sec ui-card sc-glance" aria-labelledby="sc-glance-h">
              <h2 id="sc-glance-h" className="sc-sec__title" tabIndex={-1}>{L.glance}</h2>
              <dl className="sc-glance__grid">
                {glance.map(r => (
                  <div key={r.k} className={`sc-glance__item${r.wide ? ' sc-glance__item--wide' : ''}`}>
                    <dt>{r.label}</dt>
                    <dd>{r.v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="sc-life" className="sc-sec" aria-labelledby="sc-life-h">
              <h2 id="sc-life-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.life}</h2>
              <div className="sc-prose">
                {bio.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star"></span></div>
            </section>

            <section id="sc-contrib" className="sc-sec" aria-labelledby="sc-contrib-h">
              <h2 id="sc-contrib-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.contribution}</h2>
              <p className="sc-contrib">{pick(s.contribution, lang)}</p>
            </section>

            {(teachers.length > 0 || students.length > 0) && (
              <section id="sc-people" className="sc-sec" aria-labelledby="sc-people-h">
                <h2 id="sc-people-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.people}</h2>
                <div className="sc-people">
                  {peopleList(L.teachers, teachers)}
                  {peopleList(L.students, students)}
                </div>
              </section>
            )}

            {works.length > 0 && (
              <section id="sc-works" className="sc-sec" aria-labelledby="sc-works-h">
                <h2 id="sc-works-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.works}</h2>
                <ol className="sc-works">
                  {works.map((w, i) => (
                    <li key={i} className="sc-works__item">
                      <Icon name="books" size={18} />
                      <span className="sc-works__text">
                        <span className="sc-works__name">{pick(w, lang)}</span>
                        {!isAr && w.ar && <span className="sc-works__ar ui-arabic" lang="ar" dir="rtl">{w.ar}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {praise.length > 0 && (
              <section id="sc-praise" className="sc-sec" aria-labelledby="sc-praise-h">
                <h2 id="sc-praise-h" className="sc-sec__title" tabIndex={-1} data-reveal>{L.praise}</h2>
                {praise.map((q, i) => (
                  <figure key={i} className="ui-quote sc-quote">
                    <blockquote>
                      <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{q.ar}</p>
                      {!isAr && <p className="ui-quote__text">{pick(q, lang)}</p>}
                    </blockquote>
                    <figcaption className="ui-quote__src">— {pick(q.by, lang)}, <cite>{pick(q.ref, lang)}</cite></figcaption>
                  </figure>
                ))}
              </section>
            )}

            {s.note && (
              <section id="sc-note" className="sc-sec ui-card sc-note" aria-labelledby="sc-note-h">
                <h2 id="sc-note-h" className="sc-sec__title" tabIndex={-1}><Icon name="alert" size={18} /> {L.note}</h2>
                <p>{pick(s.note, lang)}</p>
              </section>
            )}

            <section id="sc-sources" className="sc-sec ui-card ui-card--sunken sc-sources" aria-labelledby="sc-sources-h">
              <h2 id="sc-sources-h" className="sc-sec__title" tabIndex={-1}>{L.sources}</h2>
              <p className="sc-sources__note">{L.sourcesNote}</p>
              <ul className="sc-sources__list">
                {s.sources.map((r, i) => (
                  <li key={i}>
                    <Icon name="external" size={15} />
                    {/* Mənbə adı (kitab/sayt) olduğu kimi — dir="auto" ərəbcə adlar üçün */}
                    <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{r.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </div>

        <div className="ui-container sc-after">
          <nav className="sc-pager" aria-label={L.title}>
            {prev ? siblingCard(prev, 'prev') : <span aria-hidden="true"></span>}
            {next ? siblingCard(next, 'next') : <span aria-hidden="true"></span>}
          </nav>

          {sameEra.length > 0 && (
            <section className="sc-same" aria-labelledby="sc-same-h">
              <h2 id="sc-same-h" className="sc-same__title">{L.sameEra} <span className="sc-same__era">· {pick(ERA_LABEL[s.era], lang)}</span></h2>
              <ul className="sc-same__list">
                {sameEra.map(x => (
                  <li key={x.slug}>
                    <a className="ui-chip sc-same__chip" href={pathFor('scholars', lang, x.slug)} onClick={(e) => onSibling(x, e)}>
                      {pick(x.name, lang)}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="sc-all">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onBack}>
              <Icon name="scholars" className="ui-btn__icon" /> {L.allScholars}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`ui-toast sc-toast${toast.leaving ? ' is-leaving' : ''}`} role="status" style={toast.ok ? undefined : { '--toast-accent': 'var(--bad)' }}>
          <span className="ui-toast__icon"><Icon name={toast.ok ? 'check' : 'alert'} /></span>
          <div className="ui-toast__body"><strong className="ui-toast__title">{toast.text}</strong></div>
        </div>
      )}
    </div>
  )
}
