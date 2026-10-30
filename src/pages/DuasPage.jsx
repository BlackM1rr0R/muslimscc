import { useState, useMemo, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import { T } from '../data/i18n'
import { DUAS_DATA } from '../data/duas'
import { subscribeToDuas } from '../data/adminContent'
import { localizeSource } from '../utils/sourceNames'
import { normArabic, normText } from '../utils/uniqueHadiths'
import { haptic } from '../hooks/useHaptic'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import '../styles/DuasPage.css'
import { pickLang } from '../utils/pickLang'

// ── Kateqoriya tərcümələri ──────────────────────────────
const CAT_LABELS = {
  All:        { az:'Hamısı',     en:'All',          ru:'Все',           ar:'الكل',         tr:'Hepsi'        },
  Morning:    { az:'Səhər',      en:'Morning',      ru:'Утро',          ar:'الصباح',       tr:'Sabah'        },
  Evening:    { az:'Axşam',      en:'Evening',      ru:'Вечер',         ar:'المساء',       tr:'Akşam'        },
  Eating:     { az:'Yemək',      en:'Eating',       ru:'Еда',           ar:'الطعام',       tr:'Yemek'        },
  Sleeping:   { az:'Yatmaq',     en:'Sleeping',     ru:'Сон',           ar:'النوم',        tr:'Uyku'         },
  'Waking Up':{ az:'Oyanmaq',    en:'Waking Up',    ru:'Пробуждение',   ar:'الاستيقاظ',   tr:'Uyanış'       },
  Forgiveness:{ az:'Bağışlanma', en:'Forgiveness',  ru:'Прощение',      ar:'المغفرة',      tr:'Bağışlanma'   },
  Anxiety:    { az:'Narahatlıq', en:'Anxiety',      ru:'Тревога',       ar:'القلق',        tr:'Endişe'       },
  Gratitude:  { az:'Şükür',      en:'Gratitude',    ru:'Благодарность', ar:'الشكر',        tr:'Şükür'        },
  Prayer:     { az:'Namaz',      en:'Prayer',       ru:'Молитва',       ar:'الصلاة',       tr:'Namaz'        },
  Travel:     { az:'Səfər',      en:'Travel',       ru:'Путешествие',   ar:'السفر',        tr:'Seyahat'      },
  Health:     { az:'Sağlamlıq',  en:'Health',       ru:'Здоровье',      ar:'الصحة',        tr:'Sağlık'       },
  Rizq:       { az:'Ruzi',       en:'Provision',    ru:'Пропитание',    ar:'الرزق',        tr:'Rızık'        },
  Guidance:   { az:'Hidayət',    en:'Guidance',     ru:'Руководство',   ar:'الهداية',      tr:'Hidayet'      },
  Family:     { az:'Ailə',       en:'Family',       ru:'Семья',         ar:'الأسرة',       tr:'Aile'         },
  Knowledge:  { az:'Elm',        en:'Knowledge',    ru:'Знание',        ar:'العلم',        tr:'İlim'         },
  Protection: { az:'Qorunma',    en:'Protection',   ru:'Защита',        ar:'الحماية',      tr:'Korunma'      },
  Repentance: { az:'Tövbə',      en:'Repentance',   ru:'Покаяние',      ar:'التوبة',       tr:'Tövbe'        },
  Hardship:   { az:'Çətinlik',   en:'Hardship',     ru:'Трудности',     ar:'الشدة',        tr:'Zorluk'       },
  Salawat:    { az:'Salavat',    en:'Salawat',      ru:'Салават',       ar:'الصلاة على النبي', tr:'Salavat' },
  Dhikr:      { az:'Zikr',       en:'Dhikr',        ru:'Зикр',          ar:'الذكر',        tr:'Zikir'        },
  Misc:       { az:'Digər',      en:'Other',        ru:'Другое',        ar:'متنوع',        tr:'Diğer'        },
}

const EN_CATS = Object.keys(CAT_LABELS)

const FAV_LABELS = { az:'Sevimlilər', en:'Favorites', ru:'Избранные', ar:'المفضلة', tr:'Favoriler' }

// ── Səhifənin kiçik mətnləri (5 dil) ──
const UI = {
  az: { share:'Paylaş', favAdd:'Sevimlilərə əlavə et', favRemove:'Sevimlilərdən çıxar', copied:'Kopyalandı!', more:'Daha çox göstər', emptyFav:'Hələ sevimli dua yoxdur — kartdakı ürək düyməsinə toxunun', notFound:'Dua tapılmadı', search:'Dua axtar', cats:'Kateqoriyalar', clear:'Təmizlə', count:'dua' },
  en: { share:'Share', favAdd:'Add to favourites', favRemove:'Remove from favourites', copied:'Copied!', more:'Show more', emptyFav:'No favourite duas yet — tap the heart on a card', notFound:'No duas found', search:'Search duas', cats:'Categories', clear:'Clear', count:'duas' },
  ru: { share:'Поделиться', favAdd:'Добавить в избранное', favRemove:'Убрать из избранного', copied:'Скопировано!', more:'Показать ещё', emptyFav:'Пока нет избранных дуа — нажмите на сердечко на карточке', notFound:'Дуа не найдены', search:'Поиск дуа', cats:'Категории', clear:'Очистить', count:'дуа' },
  ar: { share:'مشاركة', favAdd:'أضف إلى المفضلة', favRemove:'إزالة من المفضلة', copied:'تم النسخ!', more:'عرض المزيد', emptyFav:'لا توجد أدعية مفضلة بعد — اضغط على رمز القلب في البطاقة', notFound:'لم يتم العثور على أدعية', search:'ابحث عن دعاء', cats:'الفئات', clear:'مسح', count:'دعاء' },
  tr: { share:'Paylaş', favAdd:'Favorilere ekle', favRemove:'Favorilerden çıkar', copied:'Kopyalandı!', more:'Daha fazla göster', emptyFav:'Henüz favori dua yok — karttaki kalp simgesine dokunun', notFound:'Dua bulunamadı', search:'Dua ara', cats:'Kategoriler', clear:'Temizle', count:'dua' },
}

// "Hərəkəti azalt" seçilibsə sürüşmə dərhal olsun (animasiyasız)
const scrollBehavior = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' } catch { return 'auto' }
}

// Bir dəfəyə göstərilən kart sayı ("Daha çox göstər" hər dəfə bu qədər açır)
const PAGE_SIZE = 15

const lk = (lang) => ['az','ru','ar','tr'].includes(lang) ? lang : 'en'

// Ərəbcə AXTARIŞ üçün: hərəkələr, Quran işarələri və boşluqlar atılır
// (dublikat açarı isə utils/uniqueHadiths → normArabic — hədislərlə eyni qayda)
const normAr = (s) => String(s || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\s]/g, '')

// Latın axtarışı üçün: kiçik hərf + diakritiksiz (ā → a, ṣ → s, İ → i, ə → e)
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ə/g, 'e')
const HAS_ARABIC = /[؀-ۿ]/

// Kartın bütün id-ləri (birləşdirilmiş dublikatda həm Firebase, həm yerli id)
const idsOf = (dua) => dua._ids || [dua.id]

// ── Ayə: api.alquran.cloud-dan gətirilir (mətn yaddaşdan yazılmır) ──
// Nəşrlər QuranPage.jsx-dəki xəritə ilə eynidir; ərəbcədə yalnız Osmani mətn.
const VERSE_EDITIONS = { az:'az.mammadaliyev', en:'en.asad', ru:'ru.kuliev', tr:'tr.diyanet' }
const ARABIC_EDITION = 'quran-uthmani'
// JamaatPage ilə eyni keş açarı və forması — bir səhifədə gətirilən ayə o birində də hazırdır
const VERSE_CACHE_PREFIX = 'qm_ayah_'
const BANNER_REF = '40:60'
const BANNER_SOURCE = 'Ğafir 40:60'

function readVerse(key) {
  try {
    const d = JSON.parse(sessionStorage.getItem(VERSE_CACHE_PREFIX + key) || 'null')
    return d && typeof d.ar === 'string' && d.ar ? d : null
  } catch { return null }
}

function writeVerse(key, data) {
  try { sessionStorage.setItem(VERSE_CACHE_PREFIX + key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
}

/** Ayəni ərəbcə + cari dilin tərcüməsi ilə qaytarır: { data, loading }.
 *  data — yüklənənə və ya xəta olanda null; loading — sorğu hələ gedir
 *  (skelet göstərilir). Xəta olanda hər ikisi boşdur — banner gizlənir. */
function useVerse(ref, lang) {
  const edition = lang === 'ar' ? '' : (VERSE_EDITIONS[lang] || VERSE_EDITIONS.en)
  const key = `${ref}_${edition || 'ar'}`
  const [state, setState] = useState(() => ({ key, data: readVerse(key), failed: false }))

  useEffect(() => {
    const cached = readVerse(key)
    if (cached) { setState({ key, data: cached, failed: false }); return undefined }
    setState({ key, data: null, failed: false })

    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    const eds = edition ? `${ARABIC_EDITION},${edition}` : ARABIC_EDITION
    fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : []
        const arabic = list.find(a => a?.edition?.identifier === ARABIC_EDITION)
        const trans = edition ? list.find(a => a?.edition?.identifier === edition) : null
        if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response')
        const data = {
          ar: arabic.text,
          text: trans?.text || '',
          tname: trans ? (lang === 'en' ? trans.edition?.englishName : trans.edition?.name) || '' : '',
        }
        writeVerse(key, data)
        if (alive) setState({ key, data, failed: false })
      })
      .catch(() => { if (alive) setState({ key, data: null, failed: true }) /* sorğu alınmadı — banner gizli qalır */ })
      .finally(() => clearTimeout(timer))

    return () => { alive = false; clearTimeout(timer); ctrl.abort() }
  }, [key, ref, edition, lang])

  // Dil dəyişəndə köhnə dilin ayəsi bir anlıq da görünməsin
  if (state.key === key) return { data: state.data, loading: !state.data && !state.failed }
  const cached = readVerse(key)
  return { data: cached, loading: !cached }
}

// ── Ürək ikonu: Icon.jsx-in ikonları yalnız xətlidir (fill yox), sevimli
//    vəziyyəti isə dolu ürəklə göstərilir — ona görə yerli SVG (eyni xətt qalınlığı) ──
function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>
    </svg>
  )
}

export default function DuasPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.duas || T.az.duas
  const l = lk(lang)
  const ui = UI[l]
  const [selectedCat, setSelectedCat] = useState('All')
  // Pozuq yaddaş (massiv deyilsə) sevimliləri sıfırlayır — .includes çökməsin
  const [favs, setFavs] = useState(() => { try { const v = JSON.parse(localStorage.getItem('dua_favs')); return Array.isArray(v) ? v : [] } catch { return [] } })
  const [showFavs, setShowFavs] = useState(false)
  const [customDuas, setCustomDuas] = useState([])
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE_SIZE)
  const [popId, setPopId] = useState(null)
  const { data: verse, loading: verseLoading } = useVerse(BANNER_REF, lang)
  // Telefonda kateqoriya zolağı yapışqandır (sticky) — filtr dəyişəndə
  // siyahının başı zolağın altında qalmasın deyə ona qayıdırıq
  const barRef = useRef(null)
  const listRef = useRef(null)
  const filterMounted = useRef(false)

  useEffect(() => {
    try { localStorage.setItem('dua_favs', JSON.stringify(favs)) } catch { /* yaddaş bağlıdır */ }
  }, [favs])

  // Firebase real-time custom duas
  useEffect(() => {
    const unsubscribe = subscribeToDuas((items) => setCustomDuas(items))
    return () => unsubscribe?.()
  }, [])

  // Filtr və ya axtarış dəyişəndə siyahı yenidən ilk 15 kartdan başlasın
  useEffect(() => { setShown(PAGE_SIZE) }, [selectedCat, showFavs, query])

  // Kateqoriya dəyişdi və zolaq yapışıb (siyahının ortasındayıq) — yeni
  // siyahının əvvəlinə qayıt. Yuxarı sürüşmədə başlıq yenidən görünür,
  // ona görə hədəf başlıq + zolaq hündürlüyü qədər aşağıda hesablanır.
  useEffect(() => {
    if (!filterMounted.current) { filterMounted.current = true; return }
    const bar = barRef.current
    const list = listRef.current
    if (!bar || !list) return
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56
    const listTop = list.getBoundingClientRect().top
    if (getComputedStyle(bar).position !== 'sticky') {
      // Geniş ekran: filtrlər yan sütundadır — siyahının başı yuxarıda
      // gizli qalıbsa, yeni nəticələrin əvvəlinə qayıdırıq
      if (listTop < headerH) window.scrollTo({ top: Math.max(0, window.scrollY + listTop - headerH - 72), behavior: scrollBehavior() })
      return
    }
    if (listTop >= bar.getBoundingClientRect().bottom) return
    window.scrollTo({ top: Math.max(0, window.scrollY + listTop - headerH - bar.offsetHeight - 8), behavior: scrollBehavior() })
  }, [selectedCat, showFavs])

  // Toxunulan çip zolağın kənarında yarımçıq qalıbsa — onu ortaya gətir
  const revealChip = (el) => {
    const strip = el?.parentElement
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return
    const c = el.getBoundingClientRect()
    const s = strip.getBoundingClientRect()
    if (c.left >= s.left + 24 && c.right <= s.right - 24) return
    strip.scrollBy({ left: (c.left + c.width / 2) - (s.left + s.width / 2), behavior: scrollBehavior() })
  }

  const isFav = (dua) => idsOf(dua).some(id => favs.includes(id))

  const toggleFav = (dua) => {
    haptic()
    const ids = idsOf(dua)
    if (isFav(dua)) {
      setFavs(f => f.filter(x => !ids.includes(x)))
    } else {
      setFavs(f => [...f, dua.id])
      setPopId(dua.id)
      setTimeout(() => setPopId(p => (p === dua.id ? null : p)), 450)
    }
  }

  const shareDua = async (dua) => {
    const meaning = lang === 'ar' ? '' : `${dua[lang] || ''}\n\n`
    const text = `${dua.ar}\n\n${meaning}— ${localizeSource(dua.source, lang)}\n\n${brandName(lang)} — muslims.cc`
    if (navigator.share) {
      try { await navigator.share({ text }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert(ui.copied) } catch {}
    }
  }

  // Firebase custom duaları normal formata çevirək
  const customForLang = useMemo(() => {
    const catMap = { morning:'Morning', evening:'Evening', general:'Misc', forgiveness:'Forgiveness', gratitude:'Gratitude', travel:'Travel', food:'Eating', sleep:'Sleeping' }
    return customDuas.map(d => ({
      id: d.id,
      ar: d.ar || '',
      translit: d.translit || '',
      en: d.text?.en || '',
      az: d.text?.az || '',
      ru: d.text?.ru || '',
      tr: d.text?.tr || '',
      source: d.source || '',
      cat: catMap[d.category] || 'Misc',
      _custom: true,
    }))
      // Cari dildə mətni olmayan admin duası bu dildə göstərilmir (başqa dilə düşmür)
      .filter(d => (lang === 'ar' ? d.ar : pickLang(d[lang], lang, { warn: false })))
  }, [customDuas, lang])

  // Dublikatları birləşdir: Firebase-dəki dua yerli siyahıdakının surətidirsə,
  // bir kart qalır. Admin mətni (tərcümə, mənbə) üstündür, boş sahələr yerli
  // nüsxədən doldurulur; kateqoriya yerli nüsxədən götürülür — admin panelində
  // cəmi 8 kateqoriya var, yerli siyahı daha dəqiqdir ("Narahatlıq" → "Digər" olmasın).
  const allDuas = useMemo(() => {
    const byKey = new Map()
    const out = []
    for (const d of [...customForLang, ...DUAS_DATA]) {
      // Açar: normallaşdırılmış ərəb mətni; ərəbcə yoxdursa — Azərbaycanca mətn + mənbə
      const k = normArabic(d.ar) || (d.az ? 'tx:' + normText(d.az) + '|' + normText(d.source) : '')
      const kept = k ? byKey.get(k) : null
      if (!kept) {
        const item = { ...d, _ids: [d.id] }
        if (k) byKey.set(k, item)
        out.push(item)
        continue
      }
      kept._ids.push(d.id)
      for (const f of ['translit', 'az', 'en', 'ru', 'tr', 'source']) {
        if (!kept[f] && d[f]) kept[f] = d[f]
      }
      if (kept._custom && !d._custom && d.cat) kept.cat = d.cat
    }
    return out
  }, [customForLang])

  const filtered = useMemo(() => {
    let data = allDuas
    if (showFavs) data = data.filter(d => idsOf(d).some(id => favs.includes(id)))
    else if (selectedCat !== 'All') data = data.filter(d => d.cat === selectedCat)

    const q = query.trim()
    if (q) {
      if (HAS_ARABIC.test(q)) {
        const nq = normAr(q)
        data = data.filter(d => normAr(d.ar).includes(nq))
      } else {
        const fq = fold(q)
        data = data.filter(d =>
          [d[lang], d.en, d.translit, d.source, localizeSource(d.source, lang), CAT_LABELS[d.cat]?.[l]]
            .some(v => v && fold(v).includes(fq))
        )
      }
    }
    return data
  }, [allDuas, selectedCat, showFavs, favs, query, lang, l])

  const visible = filtered.slice(0, shown)
  const rest = filtered.length - visible.length

  return (
    <div className="duas-page">
      {/* Hero — dizayn v2: sakit kağız fon + xatəm naxışı, bir <h1>.
          Ərəbcə sətir bəzəkdir: ərəb dilində başlıq onsuz da ərəbcədir */}
      <header className="ui-page-hero duas-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('duas'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="duas-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الأَدْعِيَة وَالأَذْكَار</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight duas-body">
        <div className="ui-container duas-layout">

          {/* Yan sütun (genişdə yapışqan): axtarış + kateqoriyalar */}
          <aside className="duas-side">
            {/* Brauzerin göy "×" düyməsi əvəzinə dizayn sistemindən təmizləmə düyməsi */}
            <div className="duas-search">
              <Icon name="search" size={18} className="duas-search-ic" />
              <input
                type="search"
                className="ui-input"
                aria-label={ui.search}
                enterKeyHint="search"
                placeholder={t.searchPh}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className="ui-icon-btn duas-search-clear" onClick={() => setQuery('')}
                  aria-label={ui.clear} title={ui.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>

            {/* Kateqoriya çipləri — telefonda başlığın altına yapışan, üfüqi
                sürüşən zolaq; genişdə yan sütunda sətirlərə sarınır */}
            <div className="duas-filters-bar" ref={barRef}>
              <p className="duas-side-label" aria-hidden="true">{ui.cats}</p>
              <div className="chip-scroll wrap-desktop duas-filters" role="group" aria-label={ui.cats}>
                <button type="button" className="ui-chip duas-fav-chip"
                  aria-pressed={showFavs}
                  onClick={(e) => { revealChip(e.currentTarget); setShowFavs(f => !f) }}>
                  <Icon name="donate" size={15} />
                  {FAV_LABELS[lang] || FAV_LABELS.en}
                  {favs.length > 0 && <span className="duas-chip-num ui-num">{favs.length}</span>}
                </button>
                {EN_CATS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className="ui-chip"
                    aria-pressed={selectedCat === c && !showFavs}
                    onClick={(e) => { revealChip(e.currentTarget); setSelectedCat(c); setShowFavs(false) }}
                  >
                    {CAT_LABELS[c][l]}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="duas-main">
            {/* Nəticə sayı — ekran oxuyucusu da filtr dəyişəndə eşidir */}
            <p className="duas-count" aria-live="polite">
              <span className="ui-num">{filtered.length}</span> {ui.count}
            </p>

            {/* Dualar — hər kart ekrana girəndə yumşaq qalxır (ilk 8-i növbə ilə) */}
            <div className="duas-list" ref={listRef}>
              {visible.map((dua, i) => {
                const fav = isFav(dua)
                return (
                  <article key={dua.id} className="ui-card dua-card"
                    data-reveal="" data-reveal-delay={Math.min(i % PAGE_SIZE, 7) * 40}>
                    {/* Üst sətir: kateqoriya nişanı + düymələr */}
                    <div className="dua-card-top">
                      <span className="ui-badge ui-badge--brand dua-cat-badge">
                        {CAT_LABELS[dua.cat]?.[l] || dua.cat}
                      </span>
                      <div className="dua-card-actions">
                        <button type="button" className="ui-icon-btn dua-act" onClick={() => shareDua(dua)}
                          title={ui.share} aria-label={ui.share}>
                          <Icon name="share" size={18} />
                        </button>
                        <button type="button"
                          className={`ui-icon-btn dua-act dua-fav-btn${fav ? ' active' : ''}${popId === dua.id ? ' pop' : ''}`}
                          onClick={() => toggleFav(dua)}
                          aria-pressed={fav}
                          title={fav ? ui.favRemove : ui.favAdd}
                          aria-label={fav ? ui.favRemove : ui.favAdd}>
                          <HeartIcon filled={fav} />
                        </button>
                      </div>
                    </div>
                    {/* Ərəb mətni */}
                    <p className="dua-arabic ui-arabic" lang="ar" dir="rtl">{dua.ar}</p>
                    {/* Transliterasiya (latın) */}
                    {dua.translit && <p className="dua-translit" dir="ltr">{dua.translit}</p>}
                    {/* Tərcümə — ərəbcədə mətn elə ərəb mətninin özüdür, təkrarlanmır */}
                    {lang !== 'ar' && dua[lang] && <p className="dua-meaning">{dua[lang]}</p>}
                    {/* Mənbə */}
                    {dua.source && (
                      <p className="dua-source">
                        <Icon name="books" size={15} />
                        <span>{t.sourceLabel}: {localizeSource(dua.source, lang)}</span>
                      </p>
                    )}
                  </article>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="duas-empty" data-reveal="fade">
                <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral">
                  <Icon name={showFavs && !query.trim() ? 'donate' : 'search'} />
                </span>
                <p>{showFavs && !query.trim() ? ui.emptyFav : ui.notFound}</p>
              </div>
            )}

            {rest > 0 && (
              <div className="duas-more">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setShown(s => s + PAGE_SIZE)}>
                  {ui.more} <span className="duas-more-count ui-num">({rest})</span>
                </button>
              </div>
            )}

            {/* Ğafir 40:60 — ayə API-dən gəlir; yüklənərkən skelet, xəta olanda gizlidir */}
            {verse ? (
              <figure className="duas-banner" data-reveal="scale">
                <div className="ui-pattern" aria-hidden="true" />
                <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star" /></div>
                <p className="duas-banner-arabic ui-arabic" lang="ar" dir="rtl">{verse.ar}</p>
                {lang !== 'ar' && verse.text && (
                  <blockquote className="duas-banner-trans">«{verse.text}»</blockquote>
                )}
                <figcaption className="duas-banner-ref">
                  — {localizeSource(BANNER_SOURCE, lang)}{verse.tname ? ` · ${verse.tname}` : ''}
                </figcaption>
              </figure>
            ) : verseLoading ? (
              <div className="duas-banner duas-banner-skel" aria-hidden="true">
                <span className="skeleton skeleton--text duas-skel-ar" />
                {lang !== 'ar' && <span className="skeleton skeleton--text duas-skel-line" />}
                <span className="skeleton skeleton--text duas-skel-ref" />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
