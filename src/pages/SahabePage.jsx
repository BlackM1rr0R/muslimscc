import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { localizeSource } from '../utils/sourceNames'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { parsePath, pathFor } from '../seo/routes'
// Profillər (məlumat) — src/data/sahaba.js: prerender (Node) də oxuyur
import { SAHABA, slugOf } from '../data/sahaba'
import '../styles/SahabePage.css'

/* ── Etiketlər (UI mətnləri, 5 dil) ── */
const LABELS = {
  az: {
    eyebrow:'Hədis və bilik', clear:'Axtarışı təmizlə', title:'Səhabələr', subtitle:'Peyğəmbərin ﷺ əshabı', search:'Səhabə axtar...',
    bio:'Həyatı', facts:'Əsas faktlar', hadiths:'Hədislər və rəvayətlər', noResults:'Nəticə tapılmadı', hadithLabel:'Hədis',
    all:'Bütün səhabələr', glance:'Bir baxışda', role:'Rolu', islam:'İslamı qəbulu', caliphate:'Xilafət dövrü', narrated:'Rəvayət etdiyi hədis',
    lifespan:'Ömrü', knownAs:'Ləqəbi', tidings:'Müjdə', onPage:'Bu səhifədə', nFacts:'fakt', nHadiths:'hədis', nSources:'mənbə',
    sources:'Mənbələr', sourcesNote:'Bu səhifədəki hədis və rəvayətlərin götürüldüyü əsərlər.', contents:'İçindəkilər',
    prev:'Əvvəlki səhabə', next:'Növbəti səhabə', share:'Paylaş', copied:'Keçid kopyalandı', copyFail:'Keçidi kopyalamaq alınmadı',
    filter:'Filtr', fAll:'Hamısı', fCaliphs:'Raşid xəlifələr', fWomen:'Qadın səhabələr', fNarrators:'Hədis raviləri', read:'Həyatını oxu',
    years:(n) => `${n} il`, age:(n) => `${n} yaş`, hadithN:(n) => `${n} hədis`,
  },
  en: {
    eyebrow:'Hadith & knowledge', clear:'Clear search', title:'Companions', subtitle:'Companions of the Prophet ﷺ', search:'Search companions...',
    bio:'Biography', facts:'Key facts', hadiths:'Hadiths and narrations', noResults:'No results found', hadithLabel:'Hadith',
    all:'All companions', glance:'At a glance', role:'Role', islam:'Acceptance of Islam', caliphate:'Caliphate', narrated:'Hadiths narrated',
    lifespan:'Lifespan', knownAs:'Known as', tidings:'Glad tidings', onPage:'On this page', nFacts:'facts', nHadiths:'hadiths', nSources:'sources',
    sources:'Sources', sourcesNote:'Works from which the hadiths and narrations on this page are taken.', contents:'Contents',
    prev:'Previous companion', next:'Next companion', share:'Share', copied:'Link copied', copyFail:'Could not copy the link',
    filter:'Filter', fAll:'All', fCaliphs:'Rightly guided caliphs', fWomen:'Women companions', fNarrators:'Hadith narrators', read:'Read biography',
    years:(n) => `${n} ${n === 1 ? 'year' : 'years'}`, age:(n) => `${n} years`, hadithN:(n) => `${n} ${n === 1 ? 'hadith' : 'hadiths'}`,
  },
  ru: {
    eyebrow:'Хадисы и знание', clear:'Очистить поиск', title:'Сахабы', subtitle:'Сподвижники Пророка ﷺ', search:'Поиск сахабов...',
    bio:'Биография', facts:'Ключевые факты', hadiths:'Хадисы и предания', noResults:'Результаты не найдены', hadithLabel:'Хадис',
    all:'Все сахабы', glance:'Коротко', role:'Роль', islam:'Принятие ислама', caliphate:'Халифат', narrated:'Передал хадисов',
    lifespan:'Прожил', knownAs:'Прозвище', tidings:'Благая весть', onPage:'На этой странице', nFacts:'фактов', nHadiths:'хадисов', nSources:'источников',
    sources:'Источники', sourcesNote:'Труды, из которых взяты хадисы и предания на этой странице.', contents:'Содержание',
    prev:'Предыдущий сахаба', next:'Следующий сахаба', share:'Поделиться', copied:'Ссылка скопирована', copyFail:'Не удалось скопировать ссылку',
    filter:'Фильтр', fAll:'Все', fCaliphs:'Праведные халифы', fWomen:'Сподвижницы', fNarrators:'Передатчики хадисов', read:'Читать биографию',
    years:(n) => `${n} ${ruPlural(n, 'год', 'года', 'лет')}`, age:(n) => `${n} ${ruPlural(n, 'год', 'года', 'лет')}`,
    hadithN:(n) => `${n} ${ruPlural(n, 'хадис', 'хадиса', 'хадисов')}`,
  },
  ar: {
    eyebrow:'الحديث والعلم', clear:'مسح البحث', title:'الصحابة', subtitle:'أصحاب النبي ﷺ', search:'ابحث عن صحابي...',
    bio:'السيرة', facts:'حقائق أساسية', hadiths:'الأحاديث والآثار', noResults:'لم يتم العثور على نتائج', hadithLabel:'حديث',
    all:'جميع الصحابة', glance:'لمحة سريعة', role:'المكانة', islam:'إسلامه', caliphate:'مدة الخلافة', narrated:'الأحاديث المروية',
    lifespan:'العمر', knownAs:'لقبه', tidings:'البشارة', onPage:'في هذه الصفحة', nFacts:'حقائق', nHadiths:'أحاديث', nSources:'مصادر',
    sources:'المصادر', sourcesNote:'المصادر التي نُقلت منها الأحاديث والآثار في هذه الصفحة.', contents:'المحتويات',
    prev:'الصحابي السابق', next:'الصحابي التالي', share:'مشاركة', copied:'تم نسخ الرابط', copyFail:'تعذّر نسخ الرابط',
    filter:'تصفية', fAll:'الكل', fCaliphs:'الخلفاء الراشدون', fWomen:'الصحابيات', fNarrators:'رواة الحديث', read:'اقرأ السيرة',
    years:(n) => arYears(n), age:(n) => arYears(n), hadithN:(n) => `${n} ${n % 100 >= 3 && n % 100 <= 10 ? 'أحاديث' : 'حديثًا'}`,
  },
  tr: {
    eyebrow:'Hadis ve ilim', clear:'Aramayı temizle', title:'Sahabeler', subtitle:'Peygamberimizin ﷺ ashabı', search:'Sahabe ara...',
    bio:'Hayatı', facts:'Temel bilgiler', hadiths:'Hadisler ve rivayetler', noResults:'Sonuç bulunamadı', hadithLabel:'Hadis',
    all:'Tüm sahabeler', glance:'Bir bakışta', role:'Rolü', islam:"İslam'ı kabulü", caliphate:'Halifelik dönemi', narrated:'Rivayet ettiği hadis',
    lifespan:'Ömrü', knownAs:'Lakabı', tidings:'Müjde', onPage:'Bu sayfada', nFacts:'bilgi', nHadiths:'hadis', nSources:'kaynak',
    sources:'Kaynaklar', sourcesNote:'Bu sayfadaki hadis ve rivayetlerin alındığı eserler.', contents:'İçindekiler',
    prev:'Önceki sahabe', next:'Sonraki sahabe', share:'Paylaş', copied:'Bağlantı kopyalandı', copyFail:'Bağlantı kopyalanamadı',
    filter:'Filtre', fAll:'Tümü', fCaliphs:'Raşid halifeler', fWomen:'Kadın sahabeler', fNarrators:'Hadis ravileri', read:'Hayatını oku',
    years:(n) => `${n} yıl`, age:(n) => `${n} yaş`, hadithN:(n) => `${n} hadis`,
  },
}

// Rus dilində say ilə isim uzlaşması: 1 год · 2 года · 5 лет
function ruPlural(n, one, few, many) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}
// Ərəb dilində "il" sözü saya görə: 2 → سنتان, 3–10 → سنوات, qalanları → سنة
function arYears(n) {
  if (n === 2) return 'سنتان'
  if (n % 100 >= 3 && n % 100 <= 10) return `${n} سنوات`
  return `${n} سنة`
}

/* ══════════════════════════════════════════════════════════════════
   KÖMƏKÇİLƏR — hamısı yalnız yuxarıdakı SAHABA məlumatını YENİDƏN
   TƏQDİM edir: yeni tarix, fakt və ya hədis əlavə olunmur.
   ══════════════════════════════════════════════════════════════════ */

// Dilə görə sahə (yoxdursa ingiliscə)
const pick = (obj, lang) => (obj && (obj[lang] || obj.en)) || ''

// Profilin ünvanı: /sahaba/<slug> ("Abu Bakr as-Siddiq" → abu-bakr-as-siddiq).
// Köhnə /sahaba?id=<slug|rəqəm> keçidlərini App.jsx yeni ünvana çevirir.
const BY_SLUG = new Map(SAHABA.map(s => [slugOf(s), s]))

// Kateqoriyalar — yalnız məlumatdan çıxarılır:
//   xəlifələr: dörd raşid xəlifə (id 1–4, vəzifə sahəsində "xəlifə")
//   qadınlar: adda "bint" (qızı) olanlar
//   hədis raviləri: faktlarda rəvayət etdiyi hədis sayı göstərilənlər
const isCaliph = (s) => s.id <= 4
const isWoman = (s) => /\bbint\b/i.test(s.name.en)
function narratedOf(s) {
  for (const f of s.facts) {
    const m = /Narrated (over )?([\d,]+) hadiths/i.exec(f.en || '')
    if (m) return { n: Number(m[2].replace(/,/g, '')), over: Boolean(m[1]) }
  }
  return null
}
const FILTERS = [
  { key: 'all', label: 'fAll', test: () => true },
  { key: 'caliphs', label: 'fCaliphs', test: isCaliph },
  { key: 'women', label: 'fWomen', test: isWoman },
  { key: 'narrators', label: 'fNarrators', test: (s) => Boolean(narratedOf(s)) },
]

// Mətni cümlələrə böl; "Hz." kimi qısaltmalardan sonra bölmə
function sentencesOf(text) {
  const out = []
  for (const p of String(text || '').split(/(?<=[.!?؟])\s+/)) {
    const prev = out[out.length - 1]
    if (prev && /(^|[\s(])\p{L}{1,2}\.$/u.test(prev)) out[out.length - 1] = `${prev} ${p}`
    else if (p) out.push(p)
  }
  return out
}

// Həyatı: birinci cümlə hero-da xülasədir, qalanı "kitab" mətnidir —
// iki cümləlik abzaslar; dırnaqlı (sitatlı) cümlə ayrıca çıxarış olur
function proseOf(s, lang) {
  const all = sentencesOf(pick(s.bio, lang))
  const summary = all.length >= 2 ? all[0] : ''
  const body = all.length >= 2 ? all.slice(1) : all
  const blocks = []
  let cur = []
  let pulled = false
  const flush = () => { if (cur.length) blocks.push({ p: cur.join(' ') }); cur = [] }
  body.forEach((t, i) => {
    // Çıxarış yalnız mətnin ortasında və bir dəfə (ilk abzasdan sonra)
    if (!pulled && i > 0 && /["«“„]/.test(t)) { flush(); blocks.push({ pull: t }); pulled = true; return }
    cur.push(t)
    if (cur.length >= 2) flush()
  })
  flush()
  return { summary, blocks }
}

// "Bir baxışda" — məlumatda NƏ VARSA; olmayan sətir göstərilmir
function glanceOf(s, lang, L) {
  const rows = [{ key: 'role', label: L.role, value: pick(s.title, lang) }]
  const fact = (re) => s.facts.find(f => re.test(f.en || ''))
  const match = (re) => s.facts.map(f => re.exec(f.en || '')).find(Boolean)

  const islam = fact(/accept(ed)? Islam/i)
  if (islam) rows.push({ key: 'islam', label: L.islam, value: pick(islam, lang), wide: true })

  const cal = match(/Caliph for (\d+) years? \((\d{3,4})-(\d{3,4})\)/i)
  if (cal) rows.push({ key: 'caliphate', label: L.caliphate, value: `${cal[2]}–${cal[3]}`, note: L.years(Number(cal[1])), num: true })

  const nar = narratedOf(s)
  if (nar) {
    const v = nar.n.toLocaleString(lang === 'ar' ? 'en' : lang)
    rows.push({ key: 'narrated', label: L.narrated, value: nar.over ? `${v}+` : v, count: nar.n, num: true })
  }

  const age = match(/\bage (?:of )?(\d+)/i)
  if (age) rows.push({ key: 'lifespan', label: L.lifespan, value: L.age(Number(age[1])), num: true })

  const known = fact(/title "|called him "|name "|^"/i)
  if (known) rows.push({ key: 'known', label: L.knownAs, value: pick(known, lang), wide: true })

  const tidings = fact(/promised Paradise/i)
  if (tidings) rows.push({ key: 'tidings', label: L.tidings, value: pick(tidings, lang), wide: true })
  return rows
}

// Mənbələr: hədislərin mənbəyi əsər üzrə qruplaşdırılır ("Buxari — 3654, 3093")
const sourceText = (h, lang) => (typeof h.source === 'object' ? pick(h.source, lang) : localizeSource(h.source, lang))
function sourcesOf(s, lang) {
  const map = new Map()
  for (const h of s.hadiths) {
    const label = sourceText(h, lang)
    const m = /^(.*?)[\s,]+(\d[\d/:-]*)$/.exec(label)
    const name = m ? m[1] : label
    if (!map.has(name)) map.set(name, [])
    if (m && !map.get(name).includes(m[2])) map.get(name).push(m[2])
  }
  return [...map].map(([name, nums]) => ({ name, nums }))
}

/* ── Medalyon (monoqram) ──
   Adın ilk hərfi display şriftində, arxada incə 8 guşəli ulduz; dörd
   raşid xəlifə qızılı, qalanları zümrüd — rəng yalnız tokenlərdən. */
const initialOf = (name) => {
  // "Əbu …", "Abu …" kimi künyələrdə də ilk hərf; ərəbcədə "أبو" → "أ"
  const str = String(name || '').trim()
  return str ? [...str][0].toLocaleUpperCase() : '·'
}
const Medal = ({ s, name, size = 'md' }) => (
  <span className={`sp-medal sp-medal--${size}${isCaliph(s) ? ' sp-medal--gold' : ''}`} aria-hidden="true">
    <span className="sp-medal__star" />
    <span className="sp-medal__letter">{initialOf(name)}</span>
  </span>
)

const prefersReduced = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return true }
}

/* Siyahı → profil keçidi (View Transitions API).
   Köhnə vəziyyətdə yalnız basılan kartın medalyonu "sp-medal" adını daşıyır;
   yeni vəziyyətdə hero medalyonu (html.sp-vt-in) — brauzer onu kartın yerindən
   hero-ya "uçurur". API yoxdursa və ya hərəkət azaldılıbsa — adi keçid
   (profil öz CSS girişi ilə solaraq açılır). */
let morphing = false   // keçid gedir: yeni profil medalyon girişini təkrarlamasın
function withTransition(update, fromEl, slug) {
  const root = document.documentElement
  if (prefersReduced() || typeof document.startViewTransition !== 'function') { update(); return }
  if (fromEl) fromEl.style.viewTransitionName = 'sp-medal'
  root.classList.add('sp-vt')
  const done = () => {
    root.classList.remove('sp-vt', 'sp-vt-in')
    morphing = false
    if (fromEl) fromEl.style.viewTransitionName = ''
  }
  try {
    const vt = document.startViewTransition(() => new Promise((resolve) => {
      if (fromEl) fromEl.style.viewTransitionName = ''
      root.classList.add('sp-vt-in')
      morphing = true
      update()
      // React yeni profili çəkənə qədər gözlə (ən çox ~450ms).
      // rAF yox, setTimeout: keçid zamanı kadr çəkilişi dayandırılır.
      const t0 = performance.now()
      const tick = () => {
        if (document.querySelector(`[data-sp-id="${slug}"]`) || performance.now() - t0 > 450) resolve()
        else setTimeout(tick, 16)
      }
      tick()
    }))
    vt.finished.then(done, done)
  } catch {
    done()
    update()
  }
}

export default function SahabePage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const isAr = lang === 'ar'
  const location = useLocation()
  const routerNavigate = useNavigate()
  const { key: routeKey, param } = parsePath(location.pathname)
  const selected = routeKey === 'sahaba' && param ? BY_SLUG.get(param) || null : null

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    const f = FILTERS.find(x => x.key === filter) || FILTERS[0]
    const q = search.trim().toLowerCase()
    return SAHABA.filter(s => {
      if (!f.test(s)) return false
      if (!q) return true
      return pick(s.name, lang).toLowerCase().includes(q) || s.name.ar.includes(q) ||
        pick(s.title, lang).toLowerCase().includes(q) || s.name.en.toLowerCase().includes(q)
    })
  }, [search, filter, lang])

  /* ── Sürüşmə: profil yuxarıdan açılır, siyahıya qayıdanda əvvəlki yer ── */
  const listY = useRef(0)
  const prevSel = useRef(null)
  // Dil dəyişimi profili yolda saxlayır (/en/sahaba/<slug>) — sürüşmə yerində qalır
  useLayoutEffect(() => {
    const was = prevSel.current
    prevSel.current = selected
    if (selected && selected !== was) {
      window.scrollTo(0, 0)
    } else if (!selected && was) {
      const y = listY.current
      window.scrollTo(0, y)
      // Brauzerin öz bərpası (popstate) bizi üstələməsin
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
  }, [selected])

  // Profil: /sahaba/<slug> (tarixçəyə yeni giriş) — "geri" siyahıya qaytarır.
  // Kart və qonşu profil linkləri <a href>-dir: adi klik SPA ilə (medalyon
  // keçidi ilə), Ctrl/orta klik — yeni tabda.
  const openProfile = (s, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    listY.current = window.scrollY
    const medal = e?.currentTarget?.querySelector('.sp-medal') || null
    withTransition(() => routerNavigate(pathFor('sahaba', lang, slugOf(s)), { state: { spList: true } }), medal, slugOf(s))
  }
  // Əvvəlki / növbəti: girişi əvəz et — "geri" yenə siyahıya aparsın
  const goSibling = (s, e) => {
    if (e && !isPlainClick(e)) return
    e?.preventDefault()
    const medal = e?.currentTarget?.querySelector('.sp-medal') || null
    withTransition(() => routerNavigate(pathFor('sahaba', lang, slugOf(s)), { replace: true, state: window.history.state?.usr ?? null }), medal, slugOf(s))
  }
  // "Bütün səhabələr": siyahıdan gəlmişiksə tarixçədə geri (yer bərpa olunur),
  // paylaşılan keçidlə birbaşa gəlmişiksə siyahını yeni giriş kimi aç
  const backToList = () => {
    if (window.history.state?.usr?.spList) window.history.back()
    else routerNavigate(pathFor('sahaba', lang))
  }

  if (selected) {
    return <Profile key={selected.id} s={selected} L={L} lang={lang} isAr={isAr} onBack={backToList} onSibling={goSibling} />
  }

  const counts = Object.fromEntries(FILTERS.map(f => [f.key, SAHABA.filter(f.test).length]))

  return (
    <div className="sahabe-page sp-list">
      <header className="ui-page-hero sahabe-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          {!isAr && <p className="sahabe-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الصحابة الكرام</p>}
          <p className="ui-lead">{L.subtitle}</p>
        </div>
      </header>

      <div className="ui-section ui-section--tight sahabe-list-sec">
        <div className="ui-container">
          <div className="sp-toolbar">
            <div className="sahabe-search-wrap">
              <Icon name="search" size={19} className="sahabe-search-icon" />
              <input
                className="ui-input sahabe-search"
                type="search"
                aria-label={L.search}
                placeholder={L.search}
                enterKeyHint="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="ui-icon-btn sahabe-search-clear" onClick={() => setSearch('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            {/* Filtr çipləri — yalnız məlumatda olan kateqoriyalar */}
            <div className="sp-chips" role="group" aria-label={L.filter}>
              {FILTERS.filter(f => counts[f.key] > 0).map(f => (
                <button key={f.key} type="button" className="ui-chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                  {L[f.label]} <span className="sp-chip__n ui-num">{counts[f.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="ui-card ui-card--sunken sahabe-no-results" data-reveal="scale">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
              <p>{L.noResults}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setSearch(''); setFilter('all') }}>
                <Icon name="close" className="ui-btn__icon" /> {L.clear}
              </button>
            </div>
          ) : (
            /* Bir siyahı: kompüterdə kart şəbəkəsi, telefonda (<768px) üfüqi
               sətir-kartlar (CSS). Kart əsl <button>-dur — klaviatura və ekran
               oxuyucu ilə açılır; düymənin içində yalnız <span> var. */
            <ul className="sahabe-grid" data-reveal="stagger-zoom" key={`${filter}|${search ? 'q' : 'all'}`}>
              {filtered.map(s => {
                const n = pick(s.name, lang)
                const line = sentencesOf(pick(s.bio, lang))[0]
                return (
                  <li key={s.id}>
                    <a className="ui-card ui-card--interactive sahabe-card" href={pathFor('sahaba', lang, slugOf(s))} onClick={(e) => openProfile(s, e)}>
                      <Medal s={s} name={n} />
                      <span className="sahabe-card-body">
                        {!isAr && <span className="sahabe-card-arabic ui-arabic" lang="ar" dir="rtl">{s.name.ar}</span>}
                        <span className="sahabe-card-name">{n}</span>
                        <span className="sahabe-card-title">{pick(s.title, lang)}</span>
                        <span className="sahabe-card-line">{line}</span>
                      </span>
                      <span className="sahabe-card-foot">
                        <span className="sahabe-card-meta"><Icon name="hadith" size={15} /> {L.hadithN(s.hadiths.length)}</span>
                        <span className="sahabe-card-read">{L.read} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" /></span>
                      </span>
                      <Icon name="chevron" size={18} className="sahabe-card-chev ui-flip-rtl" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PROFİL — "kitab səhifəsi": hero (medalyon, ad, ərəbcə ad, vəzifə,
   xülasə, paylaş) → Bir baxışda → Həyatı → Əsas faktlar (xətt) →
   Hədislər → Mənbələr → Əvvəlki / Növbəti. Geniş ekranda yan tərəfdə
   yapışqan "İçindəkilər" (aktiv bölmə vurğulanır).
   ══════════════════════════════════════════════════════════════════ */
function Profile({ s, L, lang, isAr, onBack, onSibling }) {
  const n = pick(s.name, lang)
  const slug = slugOf(s)
  const { summary, blocks } = proseOf(s, lang)
  const glance = glanceOf(s, lang, L)
  const sources = sourcesOf(s, lang)
  const idx = SAHABA.indexOf(s)
  const prev = idx > 0 ? SAHABA[idx - 1] : null
  const next = idx < SAHABA.length - 1 ? SAHABA[idx + 1] : null
  const [featured, ...restHadiths] = s.hadiths
  const [morph] = useState(() => morphing)

  const sections = [
    { id: 'sp-glance', label: L.glance, icon: 'info' },
    blocks.length ? { id: 'sp-life', label: L.bio, icon: 'user' } : null,
    { id: 'sp-facts', label: L.facts, icon: 'bulb' },
    { id: 'sp-hadiths', label: L.hadiths, icon: 'hadith' },
    { id: 'sp-sources', label: L.sources, icon: 'books' },
  ].filter(Boolean)

  /* ── Aktiv bölmə (İçindəkilər vurğusu) ── */
  const [active, setActive] = useState(sections[0].id)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const els = sections.map(x => document.getElementById(x.id)).filter(Boolean)
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id)
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id, lang])

  const jump = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
    // Klaviatura istifadəçisi üçün fokus bölmə başlığına keçsin (URL-ə # yazmadan)
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

  return (
    <div className={`sahabe-page sp-profile${morph ? ' sp-morph' : ''}`}>
      {/* Oxu irəliləyişi — yalnız scroll-timeline dəstəklənəndə (CSS) */}
      <div className="sp-progress" aria-hidden="true"></div>

      <header className="ui-page-hero sp-hero" data-sp-id={slug}>
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <nav className="ui-page-hero__crumbs sp-crumbs sp-in" aria-label={L.title}>
            <button type="button" className="sp-crumb-btn" onClick={onBack}>
              <Icon name="arrow" size={15} className="sp-back-ic" /> {L.all}
            </button>
          </nav>

          <div className="sp-hero__grid">
            <Medal s={s} name={n} size="lg" />
            <div className="sp-hero__text">
              <span className="ui-eyebrow sp-in" style={{ '--i': 1 }}>{pick(s.title, lang)}</span>
              <h1 className="ui-display sp-hero__name sp-in" style={{ '--i': 2 }}>{n}</h1>
              {/* Ərəbcədə h1 onsuz da ərəbcə addır — təkrar etməyək */}
              {!isAr && <p className="sp-hero__ar ui-arabic sp-in" style={{ '--i': 3 }} lang="ar" dir="rtl">{s.name.ar}</p>}
              {summary && <p className="ui-lead sp-hero__lead sp-in" style={{ '--i': 4 }}>{summary}</p>}
              <div className="sp-hero__actions sp-in" style={{ '--i': 5 }}>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={share}>
                  <Icon name="share" className="ui-btn__icon" /> {L.share}
                </button>
                <span className="sp-hero__meta ui-num">
                  {s.facts.length} {L.nFacts} · {s.hadiths.length} {L.nHadiths} · {sources.length} {L.nSources}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="ui-section sp-body">
        <div className="ui-container sp-layout">
          {/* İçindəkilər: geniş ekranda yapışqan yan siyahı, dar ekranda çip zolağı */}
          <aside className="sp-toc">
            <nav aria-label={L.contents}>
              <p className="sp-toc__title">{L.contents}</p>
              <ol className="sp-toc__list">
                {sections.map(x => (
                  <li key={x.id}>
                    <a href={`#${x.id}`} className="sp-toc__link" aria-current={active === x.id ? 'true' : undefined} onClick={(e) => jump(e, x.id)}>
                      <Icon name={x.icon} size={16} /> <span>{x.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="sp-article">
            {/* Bir baxışda */}
            <section id="sp-glance" className="sp-sec ui-card sp-glance" aria-labelledby="sp-glance-h">
              <h2 id="sp-glance-h" className="sp-sec__title" tabIndex={-1}>{L.glance}</h2>
              <dl className="sp-glance__grid" data-reveal="stagger">
                {glance.map(r => (
                  <div key={r.key} className={`sp-glance__item${r.wide ? ' sp-glance__item--wide' : ''}${r.num ? ' sp-glance__item--num' : ''}`}>
                    <dt>{r.label}</dt>
                    <dd>
                      {/* Rəqəmli dəyər ərəbcədə də soldan sağa ("632–634" tərsinə dönməsin) */}
                      {r.num
                        ? <span className="sp-glance__v" dir={r.key === 'caliphate' ? 'ltr' : undefined} data-count={r.count || undefined}>{r.value}</span>
                        : r.value}
                      {r.note && <span className="sp-glance__note">{r.note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Həyatı — oxunaqlı mətn, böyük ilk hərf, sitat çıxarışı */}
            {blocks.length > 0 && (
              <section id="sp-life" className="sp-sec" aria-labelledby="sp-life-h">
                <h2 id="sp-life-h" className="sp-sec__title" tabIndex={-1} data-reveal>{L.bio}</h2>
                <div className={`sp-prose${/^\p{L}/u.test(blocks[0].p || '') ? '' : ' sp-prose--nocap'}`} data-reveal="fade">
                  {blocks.map((b, i) => (b.pull
                    ? <blockquote key={i} className="sp-pull">{b.pull}</blockquote>
                    : <p key={i}>{b.p}</p>))}
                </div>
                <div className="ui-ornament" data-reveal aria-hidden="true"><span className="ui-ornament__star"></span></div>
              </section>
            )}

            {/* Əsas faktlar — şaquli xətt sürüşdükcə "çəkilir" */}
            <section id="sp-facts" className="sp-sec" aria-labelledby="sp-facts-h">
              <h2 id="sp-facts-h" className="sp-sec__title" tabIndex={-1} data-reveal>{L.facts}</h2>
              <ol className="sp-line" data-reveal="stagger">
                {s.facts.map((f, i) => (
                  <li key={i} className="sp-line__item">
                    <span className="sp-line__dot ui-num" aria-hidden="true">{i + 1}</span>
                    <p className="sp-line__text">{pick(f, lang)}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Hədislər — birincisi böyük, qalanları ui-quote siyahısı */}
            <section id="sp-hadiths" className="sp-sec" aria-labelledby="sp-hadiths-h">
              <h2 id="sp-hadiths-h" className="sp-sec__title" tabIndex={-1} data-reveal>{L.hadiths}</h2>
              {featured && (
                <figure className="ui-quote sp-quote sp-quote--featured" data-reveal="blur">
                  <span className="sp-quote__num ui-num">{L.hadithLabel} 1</span>
                  <blockquote>
                    <p className="ui-quote__ar ui-arabic sp-quote__ar" lang="ar" dir="rtl">{featured.ar}</p>
                    {!isAr && <p className="ui-quote__text">{pick(featured, lang)}</p>}
                  </blockquote>
                  <figcaption className="ui-quote__src">— {sourceText(featured, lang)}</figcaption>
                </figure>
              )}
              <div className="sp-quotes" data-reveal="stagger-left">
                {restHadiths.map((h, i) => (
                  <figure key={i} className="ui-quote sp-quote">
                    <span className="sp-quote__num ui-num">{L.hadithLabel} {i + 2}</span>
                    <blockquote>
                      <p className="ui-quote__ar ui-arabic sp-quote__ar" lang="ar" dir="rtl">{h.ar}</p>
                      {!isAr && <p className="sp-quote__text">{pick(h, lang)}</p>}
                    </blockquote>
                    <figcaption className="ui-quote__src">— {sourceText(h, lang)}</figcaption>
                  </figure>
                ))}
              </div>
            </section>

            {/* Mənbələr */}
            <section id="sp-sources" className="sp-sec ui-card ui-card--sunken sp-sources" aria-labelledby="sp-sources-h">
              <h2 id="sp-sources-h" className="sp-sec__title" tabIndex={-1}>{L.sources}</h2>
              <p className="sp-sources__note">{L.sourcesNote}</p>
              <ul className="sp-sources__list" data-reveal="stagger-fade">
                {sources.map(src => (
                  <li key={src.name}>
                    <Icon name="books" size={16} />
                    <span><strong>{src.name}</strong>{src.nums.length > 0 && <span className="ui-num"> — {src.nums.join(', ')}</span>}</span>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </div>

        {/* Əvvəlki / Növbəti + Bütün səhabələr */}
        <div className="ui-container sp-pager-wrap">
          <nav className="sp-pager" aria-label={L.title} data-reveal="stagger">
            {prev ? (
              <a className="ui-card ui-card--interactive sp-pager__card sp-pager__card--prev" href={pathFor('sahaba', lang, slugOf(prev))} onClick={(e) => onSibling(prev, e)}>
                <span className="sp-pager__dir"><Icon name="arrow" size={15} className="sp-back-ic" /> {L.prev}</span>
                <span className="sp-pager__who">
                  <Medal s={prev} name={pick(prev.name, lang)} size="sm" />
                  <span className="sp-pager__name">{pick(prev.name, lang)}</span>
                </span>
              </a>
            ) : <span className="sp-pager__empty" aria-hidden="true"></span>}
            {next ? (
              <a className="ui-card ui-card--interactive sp-pager__card sp-pager__card--next" href={pathFor('sahaba', lang, slugOf(next))} onClick={(e) => onSibling(next, e)}>
                <span className="sp-pager__dir">{L.next} <Icon name="arrow" size={15} className="ui-flip-rtl" /></span>
                <span className="sp-pager__who">
                  <Medal s={next} name={pick(next.name, lang)} size="sm" />
                  <span className="sp-pager__name">{pick(next.name, lang)}</span>
                </span>
              </a>
            ) : <span className="sp-pager__empty" aria-hidden="true"></span>}
          </nav>
          <div className="sp-all">
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onBack}>
              <Icon name="sahaba" className="ui-btn__icon" /> {L.all}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`ui-toast sp-toast${toast.leaving ? ' is-leaving' : ''}`} role="status" style={toast.ok ? undefined : { '--toast-accent': 'var(--bad)' }}>
          <span className="ui-toast__icon"><Icon name={toast.ok ? 'check' : 'alert'} /></span>
          <div className="ui-toast__body"><strong className="ui-toast__title">{toast.text}</strong></div>
        </div>
      )}
    </div>
  )
}
