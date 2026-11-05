import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
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
import { GLOSSARY_ROOTS } from '../data/glossaryRoots'
import { spacedRoot } from '../utils/quranRoots'
import ReaderDialog from '../components/reader/ReaderDialog'
import StarButton, { CopyStatus } from '../components/collect/StarButton'
import useStarred, { dayPick, shareLink } from '../components/collect/useStarred'
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
  az: { eyebrow:'Hədis və bilik', clear:'Filtri təmizlə', title:'İslami söz lüğəti', subtitle:'Əqidə, ibadət, fiqh, Quran və hədis elmləri, əxlaq və tarixə aid terminlər — Əhli-Sünnənin anlayışına uyğun qısa və dəqiq izahla.', search:'Termin axtar...', all:'Hamısı', noResults:'Nəticə tapılmadı', terms:'termin', letters:'Hərflər', cats:'Kateqoriyalar', related:'Əlaqəli terminlər', lesson:'Mövzu üzrə ətraflı dərs', focus:'Seçilmiş termin və əlaqəli terminlər', showAll:'Bütün terminlər', link:'Terminin linki', how:'Termini axtarın, bölmə və ya hərf seçin. Termin adına toxunsanız, onun linki və əlaqəli terminlər açılır.', statTerms:'termin', statCats:'bölmə', statLessons:'dərsə keçidli', read:'Oxu', favs:'Seçilmişlər', favAdd:'Seçilmişlərə əlavə et', favNone:'Hələ seçilmiş termin yoxdur — kartdakı ulduza toxunun.', today:'Günün termini', random:'Təsadüfi termin', share:'Paylaş', copyLink:'Linki kopyala', copied:'Link kopyalandı', close:'Bağla', prev:'Əvvəlki', next:'Növbəti' },
  en: { eyebrow:'Hadith & knowledge', clear:'Clear filter', title:'Islamic Glossary', subtitle:'Terms of creed, worship, fiqh, the Quran and hadith sciences, character and history — short, precise definitions in line with Ahl as-Sunnah.', search:'Search terms...', all:'All', noResults:'No results found', terms:'terms', letters:'Letters', cats:'Categories', related:'Related terms', lesson:'In-depth lesson on this topic', focus:'Selected term and related terms', showAll:'All terms', link:'Link to this term', how:'Search for a term or pick a section or letter. Tap a term’s name to get its link and related terms.', statTerms:'terms', statCats:'sections', statLessons:'linked to lessons', read:'Read', favs:'Saved', favAdd:'Save this term', favNone:'No saved terms yet — tap the star on a card.', today:'Term of the day', random:'Random term', share:'Share', copyLink:'Copy link', copied:'Link copied', close:'Close', prev:'Previous', next:'Next' },
  ru: { eyebrow:'Хадисы и знание', clear:'Сбросить фильтр', title:'Исламский глоссарий', subtitle:'Термины вероубеждения, поклонения, фикха, наук Корана и хадиса, нрава и истории — краткие и точные определения согласно Ахль ас-Сунна.', search:'Поиск терминов...', all:'Все', noResults:'Ничего не найдено', terms:'терминов', letters:'Буквы', cats:'Категории', related:'Связанные термины', lesson:'Подробный урок по теме', focus:'Выбранный термин и связанные с ним', showAll:'Все термины', link:'Ссылка на термин', how:'Ищите термин или выберите раздел либо букву. Нажмите на название термина — откроются ссылка на него и связанные термины.', statTerms:'терминов', statCats:'разделов', statLessons:'со ссылкой на урок', read:'Читать', favs:'Избранное', favAdd:'Добавить в избранное', favNone:'В избранном пока нет терминов — нажмите звёздочку на карточке.', today:'Термин дня', random:'Случайный термин', share:'Поделиться', copyLink:'Копировать ссылку', copied:'Ссылка скопирована', close:'Закрыть', prev:'Назад', next:'Далее' },
  ar: { eyebrow:'الحديث والعلم', clear:'مسح التصفية', title:'قاموس المصطلحات الإسلامية', subtitle:'مصطلحات العقيدة والعبادات والفقه وعلوم القرآن والحديث والأخلاق والتاريخ — بتعريفات موجزة دقيقة على فهم أهل السنة.', search:'ابحث عن مصطلح...', all:'الكل', noResults:'لم يتم العثور على نتائج', terms:'مصطلح', letters:'الحروف', cats:'الأقسام', related:'مصطلحات ذات صلة', lesson:'درس مفصّل في الموضوع', focus:'المصطلح المختار وما يتصل به', showAll:'كل المصطلحات', link:'رابط المصطلح', how:'ابحث عن مصطلح أو اختر قسمًا أو حرفًا. اضغط على اسم المصطلح ليظهر رابطه والمصطلحات المتصلة به.', statTerms:'مصطلحًا', statCats:'أقسام', statLessons:'مرتبطة بدروس', read:'اقرأ', favs:'المحفوظة', favAdd:'احفظ المصطلح', favNone:'لا توجد مصطلحات محفوظة بعد — اضغط النجمة على البطاقة.', today:'مصطلح اليوم', random:'مصطلح عشوائي', share:'مشاركة', copyLink:'نسخ الرابط', copied:'تم نسخ الرابط', close:'إغلاق', prev:'السابق', next:'التالي' },
  tr: { eyebrow:'Hadis ve ilim', clear:'Filtreyi temizle', title:'İslami Sözlük', subtitle:'Akide, ibadet, fıkıh, Kur’an ve hadis ilimleri, ahlak ve tarihe dair terimler — Ehl-i Sünnet’in anlayışına uygun kısa ve net tanımlarla.', search:'Terim ara...', all:'Tümü', noResults:'Sonuç bulunamadı', terms:'terim', letters:'Harfler', cats:'Kategoriler', related:'İlgili terimler', lesson:'Konuyla ilgili ayrıntılı ders', focus:'Seçilen terim ve ilgili terimler', showAll:'Tüm terimler', link:'Terimin bağlantısı', how:'Bir terim arayın ya da bölüm veya harf seçin. Terimin adına dokunursanız bağlantısı ve ilgili terimler açılır.', statTerms:'terim', statCats:'bölüm', statLessons:'derse bağlantılı', read:'Oku', favs:'Kaydedilenler', favAdd:'Kaydet', favNone:'Henüz kaydedilen terim yok — karttaki yıldıza dokunun.', today:'Günün terimi', random:'Rastgele terim', share:'Paylaş', copyLink:'Bağlantıyı kopyala', copied:'Bağlantı kopyalandı', close:'Kapat', prev:'Önceki', next:'Sonraki' },
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

// Ətraflı dərsə keçidi olan terminlər (yalnız saytda mövcud dərslər)
// Termin → Quran kökü (data/glossaryRoots.js, scripts/build-glossary-roots.mjs): kök, işlənmə sayı, mini zolaq
const ROOT_T = {
  az: { root: 'Kök', n: (k) => `Quranda ${k} dəfə`, open: 'Kökün bütün ayələri' },
  en: { root: 'Root', n: (k) => `${k}× in the Quran`, open: 'All verses of this root' },
  ru: { root: 'Корень', n: (k) => `${k} раз в Коране`, open: 'Все аяты этого корня' },
  tr: { root: 'Kök', n: (k) => `Kur’an’da ${k} kez`, open: 'Bu kökün bütün ayetleri' },
  ar: { root: 'الجذر', n: (k) => `${k} مرة في القرآن`, open: 'كل آيات هذا الجذر' },
}
const ROOT_MAX = Math.max(1, ...Object.values(GLOSSARY_ROOTS).map(x => x[1]))
function RootChip({ root, n, lang }) {
  const r = ROOT_T[lang] || ROOT_T.az
  const w = Math.log(1 + n) / Math.log(1 + ROOT_MAX)
  return (
    <a className="glossary-root" href={`${pathFor('quranroots', lang)}?root=${encodeURIComponent(root)}`} title={r.open}
      onClick={(e) => e.stopPropagation()} data-testid="glossary-root">
      <span className="glossary-root__k">{r.root}</span>
      <span className="glossary-root__ar ui-arabic" lang="ar" dir="rtl">{spacedRoot(root)}</span>
      <span className="glossary-root__bar" aria-hidden="true"><i style={{ '--w': w.toFixed(3) }} /></span>
      <span className="glossary-root__n ui-num">{r.n(n)}</span>
    </a>
  )
}

const LESSON_LINKED = GLOSSARY.filter(x => x.lesson && LESSON_SLUGS.includes(x.lesson)).length

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
  const [favOnly, setFavOnly] = useSessionState('glossary:favOnly', false)
  const star = useStarred('glossary:favs')
  // Oxu pəncərəsi (ReaderDialog) — açıq terminin id-si; URL dəyişmir
  const [readId, setReadId] = useState(null)
  const [status, setStatus] = useState('')

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
  const maxCat = Math.max(1, ...Object.values(catCounts))

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
    if (favOnly) list = list.filter(item => star.list.includes(item.id))
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
  }, [focused, byCat, search, activeLetter, lang, favOnly, star.list])

  const topRef = useRef(null)
  const alphaRef = useRef(null)
  const gridRef = useRef(null)
  const inf = useInfiniteList({
    total: filtered.length,
    batch: BATCH,
    resetKey: `${lang}|${activeCat || ''}|${activeLetter || ''}|${search.trim()}|${focused?.id || ''}|${favOnly ? 1 : 0}`,
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
  const resetAll = () => { setSearch(''); setActiveLetter(null); setActiveCat(null); setFavOnly(false); if (focused) clearFocus() }

  // ── Oxu pəncərəsi: əvvəlki/növbəti cari siyahı üzrə (termin siyahıda yoxdursa — bütün lüğət) ──
  const readItem = readId ? GLOSSARY_BY_ID.get(readId) : null
  const navList = readItem && filtered.some(x => x.id === readId) ? filtered : sorted
  const readIdx = readItem ? navList.findIndex(x => x.id === readId) : -1
  const openRead = useCallback((id) => { setStatus(''); setReadId(id) }, [])
  const onCardClick = (id) => (e) => {
    if (e.target.closest('a, button, input')) return
    if (window.getSelection?.().toString()) return
    openRead(id)
  }
  const termUrl = (id) => `${window.location.origin}${pathFor('glossary', lang)}#${encodeURIComponent(id)}`
  const onShare = async (item) => {
    const r = await shareLink({ title: headlineOf(item, lang), text: `${headlineOf(item, lang)} (${item.ar}) — ${item.def[lang] || item.def.en}`, url: termUrl(item.id) })
    if (r === 'copied') setStatus(t.copied)
  }
  const onCopy = async (item) => {
    try { await navigator.clipboard.writeText(termUrl(item.id)); setStatus(t.copied) } catch { /* icazə yoxdur */ }
  }
  const today = GLOSSARY[dayPick(GLOSSARY.length)]
  const randomTerm = () => {
    const pool = filtered.length > 1 ? filtered : sorted
    let x = pool[Math.floor(Math.random() * pool.length)]
    if (x.id === readId && pool.length > 1) x = pool[(pool.indexOf(x) + 1) % pool.length]
    openRead(x.id)
  }
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
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {t.how}</p>
          <ul className="ui-page-hero__stats">
            <li><b className="ui-num" data-count={GLOSSARY.length}>{GLOSSARY.length}</b><span>{t.statTerms}</span></li>
            <li><b className="ui-num" data-count={GLOSSARY_CATS.length}>{GLOSSARY_CATS.length}</b><span>{t.statCats}</span></li>
            <li><b className="ui-num" data-count={LESSON_LINKED}>{LESSON_LINKED}</b><span>{t.statLessons}</span></li>
          </ul>
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

          {/* Kateqoriyalar — kafel düymələr; alt zolaq terminlərin payını göstərir (dekorativ, say mətn kimi var) */}
          <div className="glossary-cat-bar" role="group" aria-label={t.cats}>
            <button type="button" className="glossary-cat-btn" aria-pressed={!activeCat} onClick={() => pickCat(null)}>
              <span className="glossary-cat-btn__icon" aria-hidden="true"><Icon name="books" size={18} /></span>
              <span className="glossary-cat-btn__body">
                <span className="glossary-cat-btn__label">{t.all}</span>
                <span className="glossary-cat-n ui-num">{GLOSSARY.length}</span>
              </span>
            </button>
            {GLOSSARY_CATS.map(c => (
              <button type="button" key={c} className="glossary-cat-btn" aria-pressed={activeCat === c}
                onClick={() => pickCat(activeCat === c ? null : c)}>
                <span className="glossary-cat-btn__icon" aria-hidden="true"><Icon name={CAT_ICON[c]} size={18} /></span>
                <span className="glossary-cat-btn__body">
                  <span className="glossary-cat-btn__label">{CAT_LABELS[c][lang] || CAT_LABELS[c].en}</span>
                  <span className="glossary-cat-n ui-num">{catCounts[c] || 0}</span>
                </span>
                <span className="glossary-cat-btn__share" aria-hidden="true" style={{ '--w': `${((catCounts[c] || 0) / maxCat) * 100}%` }} />
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
            <button
              type="button"
              className="ui-chip glossary-alpha-btn glossary-fav-chip"
              aria-pressed={favOnly && !focused}
              onClick={() => { setFavOnly(!favOnly); setActiveLetter(null); if (focused) clearFocus() }}
            >
              <Icon name="star" size={15} /> {t.favs} <span className="ui-num glossary-fav-chip__n">{star.count}</span>
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

          {!focused && !search.trim() && !favOnly && today && (
            <aside className="cl-spot glossary-spot" aria-label={t.today}>
              <span className="cl-spot__icon" aria-hidden="true"><Icon name="bulb" /></span>
              <div className="cl-spot__body">
                <span className="cl-spot__eyebrow">{t.today}</span>
                <span className={`cl-spot__title${isArabic ? ' ui-arabic' : ''}`}>
                  {headlineOf(today, lang)}{!isArabic && <span className="glossary-spot__ar ui-arabic" lang="ar" dir="rtl">{today.ar}</span>}
                </span>
                <p className="cl-spot__text">{today.def[lang] || today.def.en}</p>
              </div>
              <div className="cl-spot__actions">
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => openRead(today.id)} aria-haspopup="dialog">
                  <Icon name="learn" className="ui-btn__icon" /> {t.read}
                </button>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={randomTerm} aria-haspopup="dialog">
                  <Icon name="refresh" className="ui-btn__icon" /> {t.random}
                </button>
              </div>
            </aside>
          )}

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
                <article key={item.id} id={item.id} className={`ui-card glossary-card${isFocus ? ' is-focus' : ''}`} {...revealProps(idx)} onClick={onCardClick(item.id)}>
                  <div className="glossary-card-header">
                    <div className="glossary-card-names">
                      <h2 className={`glossary-term-name${isArabic ? ' ui-arabic' : ''}`}>
                        <a className="glossary-term-link" href={`#${item.id}`} onClick={openTerm(item.id)} title={t.link}>{headlineOf(item, lang)}</a>
                      </h2>
                      {(lang === 'az' || lang === 'ar') && <span className="glossary-translit" dir="ltr">{item.translit}</span>}
                    </div>
                    {!isArabic && <span className="glossary-arabic-text ui-arabic" lang="ar" dir="rtl">{item.ar}</span>}
                  </div>
                  <div className="glossary-card-meta">
                    {item.cat && CAT_LABELS[item.cat] && (
                      <span className="glossary-cat-badge">{CAT_LABELS[item.cat][lang] || CAT_LABELS[item.cat].en}</span>
                    )}
                    <span className="glossary-card-tools">
                      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm glossary-read" onClick={() => openRead(item.id)} aria-haspopup="dialog">
                        <Icon name="learn" className="ui-btn__icon" /> {t.read}<span className="ui-sr-only">: {headlineOf(item, lang)}</span>
                      </button>
                      <StarButton on={star.has(item.id)} onToggle={() => star.toggle(item.id)} label={`${t.favAdd}: ${headlineOf(item, lang)}`} />
                    </span>
                  </div>
                  <p className="glossary-definition">{item.def[lang] || item.def.en}</p>
                  {GLOSSARY_ROOTS[item.id] && <RootChip root={GLOSSARY_ROOTS[item.id][0]} n={GLOSSARY_ROOTS[item.id][1]} lang={lang} />}
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
              <p>{favOnly && star.count === 0 ? t.favNone : t.noResults}</p>
              {(search || activeLetter || activeCat || favOnly) && (
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

      <ReaderDialog
        open={!!readItem}
        onClose={() => setReadId(null)}
        onPrev={readIdx > 0 ? () => openRead(navList[readIdx - 1].id) : undefined}
        onNext={readIdx >= 0 && readIdx < navList.length - 1 ? () => openRead(navList[readIdx + 1].id) : undefined}
        labelledBy="glo-read-title"
        position={readIdx >= 0 ? `${readIdx + 1} / ${navList.length}` : null}
        labels={{ close: t.close, prev: t.prev, next: t.next }}
        contentKey={readId}
        className="glo-read"
        head={readItem && readItem.cat && CAT_LABELS[readItem.cat] ? (
          <span className="glossary-cat-badge">{CAT_LABELS[readItem.cat][lang] || CAT_LABELS[readItem.cat].en}</span>
        ) : null}
        footer={readItem && (
          <div className="cl-tools">
            <StarButton on={star.has(readItem.id)} onToggle={() => star.toggle(readItem.id)} label={t.favAdd} />
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onShare(readItem)}>
              <Icon name="share" className="ui-btn__icon" /> {t.share}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onCopy(readItem)}>
              <Icon name="link" className="ui-btn__icon" /> {t.copyLink}
            </button>
            <CopyStatus text={status} />
          </div>
        )}
      >
        {readItem && (
          <article className="glo-read__body">
            <header className="glo-read__head">
              <div>
                <h2 id="glo-read-title" className={`glo-read__title${isArabic ? ' ui-arabic' : ''}`}>{headlineOf(readItem, lang)}</h2>
                {(lang === 'az' || lang === 'ar') && <p className="glossary-translit" dir="ltr">{readItem.translit}</p>}
              </div>
              {!isArabic && <p className="glo-read__ar ui-arabic" lang="ar" dir="rtl">{readItem.ar}</p>}
            </header>
            <p className="glo-read__def">{readItem.def[lang] || readItem.def.en}</p>
            {(readItem.rel || []).length > 0 && (
              <div className="glossary-rel glo-read__rel">
                <span className="glossary-rel__label">{t.related}:</span>
                <ul className="glossary-rel__list">
                  {readItem.rel.map(id => GLOSSARY_BY_ID.get(id)).filter(Boolean).map(r => (
                    <li key={r.id}>
                      <button type="button" className="glossary-rel__chip" onClick={() => openRead(r.id)}>
                        <span className={isArabic ? 'ui-arabic' : undefined}>{headlineOf(r, lang)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {readItem.lesson && LESSON_SLUGS.includes(readItem.lesson) && (
              <a className="ui-link glossary-lesson" href={pathFor('learn', lang, readItem.lesson)} onClick={(e) => { if (!isPlainClick(e)) return; setReadId(null); onLessonClick(readItem.lesson)(e) }}>
                <Icon name="learn" size={16} /> {t.lesson}
                <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
              </a>
            )}
          </article>
        )}
      </ReaderDialog>

      <BackToTop />
    </>
  )
}
