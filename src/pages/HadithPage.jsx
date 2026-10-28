import { useState, useMemo, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import { T } from '../data/i18n'
import { HADITHS } from '../data/hadiths'
import { subscribeToHadiths } from '../data/adminContent'
import { localizeSource } from '../utils/sourceNames'
import { uniqueHadithsFor, hadithAliases, staticHadithKeys, hadithKeys, dedupeList } from '../utils/uniqueHadiths'
import Pagination from '../components/Pagination'
import { haptic } from '../hooks/useHaptic'
import Icon from '../components/Icon'
import '../styles/HadithPage.css'
import { pickLang } from '../utils/pickLang'

const CATS_AZ = ['Hamısı','İman','Əxlaq','İbadət','Namaz','Quran','Elm','Oruc','Zəkat','Zikr','Sədəqə','Səbr','Dünya','Axirət','Salavat','Müsafirlik']
const CATS_EN = ['All','Faith','Character','Worship','Prayer','Quran','Knowledge','Fasting','Zakat','Dhikr','Charity','Patience','World','Afterlife','Salawat','Travel']
const CATS_RU = ['Все','Вера','Характер','Поклонение','Намаз','Коран','Знание','Пост','Закят','Зикр','Садака','Терпение','Мир','Последняя жизнь','Салавят','Путешествие']
const CATS_AR = ['الكل','الإيمان','الأخلاق','العبادة','الصلاة','القرآن','العلم','الصيام','الزكاة','الذكر','الصدقة','الصبر','الدنيا','الآخرة','الصلاة على النبي','السفر']
const CATS_TR = ['Tümü','İman','Ahlak','İbadet','Namaz','Kuran','İlim','Oruç','Zekat','Zikir','Sadaka','Sabır','Dünya','Ahiret','Salavat','Seyahat']
const CATS_MAP = { az:CATS_AZ, en:CATS_EN, ru:CATS_RU, ar:CATS_AR, tr:CATS_TR }

// Hero eyebrow-u, boş sevimlilər ipucu və "kopyalandı" bildirişi — 5 dil
const UI_LABELS = {
  az: { eyebrow:'Hədis və bilik', favEmpty:'Bəyəndiyiniz hədisləri ürək düyməsi ilə burada saxlayın.', copied:'Kopyalandı', clear:'Axtarışı təmizlə' },
  en: { eyebrow:'Hadith & knowledge', favEmpty:'Save the hadiths you love here with the heart button.', copied:'Copied', clear:'Clear search' },
  ru: { eyebrow:'Хадисы и знание', favEmpty:'Сохраняйте понравившиеся хадисы здесь кнопкой с сердцем.', copied:'Скопировано', clear:'Очистить поиск' },
  ar: { eyebrow:'الحديث والعلم', favEmpty:'احفظ الأحاديث التي تحبها هنا بزر القلب.', copied:'تم النسخ', clear:'مسح البحث' },
  tr: { eyebrow:'Hadis ve ilim', favEmpty:'Beğendiğiniz hadisleri kalp düğmesiyle burada saklayın.', copied:'Kopyalandı', clear:'Aramayı temizle' },
}

const FAV_LABELS = { az:'Sevimlilər', en:'Favorites', ru:'Избранные', ar:'المفضلة', tr:'Favoriler' }

// Çip qrupunun ekran oxuyucu adı
const CATS_LABEL = { az:'Kateqoriyalar', en:'Categories', ru:'Категории', ar:'التصنيفات', tr:'Kategoriler' }

// İkon düymələrinin ekran oxuyucu adları (ürək / paylaş yalnız ikondur)
const BTN_LABELS = {
  az: { fav:'Sevimlilərə əlavə et', unfav:'Sevimlilərdən çıxar', share:'Paylaş' },
  en: { fav:'Add to favorites', unfav:'Remove from favorites', share:'Share' },
  ru: { fav:'Добавить в избранное', unfav:'Убрать из избранного', share:'Поделиться' },
  ar: { fav:'أضف إلى المفضلة', unfav:'أزل من المفضلة', share:'مشاركة' },
  tr: { fav:'Favorilere ekle', unfav:'Favorilerden çıkar', share:'Paylaş' },
}

// Kateqoriya İngiliscə key-i (məs. "Knowledge") aktiv dilə çevirir.
function localizeCat(cat, lang) {
  if (!cat) return ''
  const c = String(cat).toLowerCase()
  const idx = CATS_EN.findIndex(x => x.toLowerCase() === c)
  if (idx > 0) return (CATS_MAP[lang] || CATS_EN)[idx]
  return cat
}

// ── İkonlar (emoji əvəzinə SVG) ──
// 🤍 emojisi qaranlıq rejimdə ağ ləkə kimi parlayırdı. İkon indi düymənin
// rəngini (currentColor) götürür: sönük kontur, seçiləndə qırmızı dolu ürək.
function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75"strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>
    </svg>
  )
}


// Kartın bütün id-ləri (birləşdirilmiş dublikatda həm Firebase, həm yerli id)
const idsOf = (h) => h._ids || [h.id]

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir —
// ilk ekrandakılar 40ms növbə ilə, qalanları ekrana girəndə gecikməsiz.
// (Bütün uzun siyahıya bir "stagger" vermirik: müşahidəçi elementin 8%-ni
// görməlidir, 5000px-lik siyahıda bu ilk kartları gizli saxlayardı.)
const revealProps = (i) => ({
  'data-reveal': '',
  ...(i > 0 && i < 6 ? { 'data-reveal-delay': String(i * 40) } : {}),
})

function HadithCard({ hadith, displayNum, isFav, onToggleFav, onShare, lang, index }) {
  const b = BTN_LABELS[lang] || BTN_LABELS.en
  // Ərəbcədə hadith.text elə hadith.ar-ın özüdür — eyni mətni iki dəfə göstərməyək
  const text = (hadith.text || '').trim()
  const showBody = text && text !== (hadith.ar || '').trim()
  const source = localizeSource(hadith.source, lang)
  return (
    // Kart: yuxarıda nömrə + kateqoriya + əməllər, ortada ərəbcə (Amiri) və
    // tərcümə (display şrifti), aşağıda mənbə — oxu ritmi sitat kimi
    <article className="ui-card hadith-card" {...revealProps(index)}>
      <div className="hadith-top">
        <span className="hadith-num ui-num">#{displayNum}</span>
        {hadith.cat && <span className="ui-badge ui-badge--brand hadith-cat-badge">{localizeCat(hadith.cat, lang)}</span>}
        <div className="hadith-actions">
          <button
            type="button"
            className={`ui-icon-btn hadith-fav-btn ${isFav ? 'active' : ''}`}
            onClick={() => onToggleFav(hadith)}
            aria-pressed={isFav}
            aria-label={isFav ? b.unfav : b.fav}
            title={isFav ? b.unfav : b.fav}
          >
            <HeartIcon filled={isFav} />
          </button>
          <button
            type="button"
            className="ui-icon-btn hadith-share-btn"
            onClick={(e) => { e.stopPropagation(); onShare(hadith) }}
            aria-label={b.share}
            title={b.share}
          >
            <Icon name="share" size={19} />
          </button>
        </div>
      </div>
      <p className="hadith-arabic ui-arabic" lang="ar" dir="rtl">{hadith.ar}</p>
      {showBody && <p className="hadith-text">{hadith.text}</p>}
      {source && (
        <p className="hadith-source" title={source}>
          <span className="hadith-source__dash" aria-hidden="true" />
          {source}
        </p>
      )}
    </article>
  )
}

export default function HadithPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.hadith || T.az.hadith
  const cats = CATS_MAP[lang] || CATS_EN
  const [cat,     setCat]     = useState(cats[0])
  const [search,  setSearch]  = useState('')
  const [pageNum, setPageNum] = useState(1)
  // Sevimlilər id ilə saxlanılır. Təkrar (atılmış) hədisin id-si
  // saxlanılan surətin id-sinə köçürülür — köhnə sevimli itməsin.
  const [favs,    setFavs]    = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hadith_favs'))
      if (!Array.isArray(saved)) return []
      const aliases = hadithAliases(HADITHS)
      return [...new Set(saved.map(id => (aliases.has(id) ? aliases.get(id) : id)))]
    } catch { return [] }
  })
  const [showFavs, setShowFavs] = useState(false)
  const [customHadiths, setCustomHadiths] = useState([])
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef(null)
  useEffect(() => () => clearTimeout(copiedTimer.current), [])
  const u = UI_LABELS[lang] || UI_LABELS.en
  const PER = 20

  useEffect(() => {
    try { localStorage.setItem('hadith_favs', JSON.stringify(favs)) } catch { /* yaddaş bağlıdır */ }
  }, [favs])

  // Firebase real-time custom hadiths
  useEffect(() => {
    const unsubscribe = subscribeToHadiths((items) => setCustomHadiths(items))
    return () => unsubscribe?.()
  }, [])

  const isFav = (h) => idsOf(h).some(id => favs.includes(id))

  // Sevimli — əsas keçid: telefonda yüngül titrəmə ilə "hiss" olunur
  const toggleFav = (h) => {
    haptic()
    const ids = idsOf(h)
    setFavs(f => (ids.some(id => f.includes(id)) ? f.filter(x => !ids.includes(x)) : [...f, h.id]))
  }

  const shareHadith = async (hadith) => {
    // Ərəbcədə "tərcümə" elə ərəb mətnidir — iki dəfə yazılmasın
    const body = hadith.text && hadith.text !== hadith.ar ? `${hadith.text}\n\n` : ''
    const text = `${hadith.ar}\n\n${body}— ${localizeSource(hadith.source, lang)}\n\n${brandName(lang)} — muslims.cc`
    if (navigator.share) {
      try { await navigator.share({ text }) } catch {}
    } else {
      // alert() əvəzinə sakit bildiriş (2 san.) — axını kəsmir
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        clearTimeout(copiedTimer.current)
        copiedTimer.current = setTimeout(() => setCopied(false), 2000)
      } catch { /* panoya yazmaq bağlıdır */ }
    }
  }

  // Firebase custom hadithləri uyğun formata çevirək
  const customForLang = useMemo(() => {
    return customHadiths.map(h => ({
      id: h.id,
      ar: h.ar || '',
      // Tərcümə yalnız cari dildə — başqa dilə (ingiliscə daxil) düşmür
      text: pickLang(h.text, lang),
      source: h.source || '',
      cat: h.category || 'general',
      _az: h.text?.az || '',
      _custom: true,
    }))
      // Cari dildə tərcüməsi olmayan admin hədisi bu dildə göstərilmir
      .filter(h => h.text || (lang === 'ar' && h.ar))
  }, [customHadiths, lang])

  // Yerli siyahı təkrarsız (utils/uniqueHadiths): 2000 qeyddə eyni hədis
  // bir neçə id ilə təkrarlanır — hər hədis bir dəfə göstərilir
  const staticList = useMemo(() => uniqueHadithsFor(HADITHS, lang), [lang])

  // Firebase-dən gələnləri əvvəl göstər. Admin paneli yerli hədisləri
  // Firebase-ə "toxum" kimi köçürə bilir — belə surət yerli hədislə bir
  // kart olur (eyni qayda: ərəb mətni / Azərbaycanca tərcümə). Admin mətni
  // üstündür, boş sahələr yerli nüsxədən doldurulur; kateqoriya yerli
  // nüsxədən götürülür (admin panelində kateqoriyalar daha azdır).
  const list = useMemo(() => {
    const all = [...customForLang, ...staticList].map(h => ({ ...h, _ids: [h.id] }))
    const keysOf = (h) => (h._custom ? hadithKeys(h.ar, h._az, h.source) : staticHadithKeys(HADITHS, h.id))
    return dedupeList(all, keysOf, {
      onDuplicate: (kept, dup) => {
        kept._ids.push(dup.id)
        if (!kept.text && dup.text) kept.text = dup.text
        if (!kept.source && dup.source) kept.source = dup.source
        if (kept._custom && !dup._custom && dup.cat) kept.cat = dup.cat
      },
    }).items
  }, [customForLang, staticList])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const idx = cats.indexOf(cat)
    const enCat = idx <= 0 ? null : CATS_EN[idx] || null
    return list.filter(h => {
      if (showFavs && !isFav(h)) return false
      // Mənbə həm orijinal ("Buxari"), həm cari dildəki yazılışla ("Bukhari") tapılır
      const mq = !q || (h.text || '').toLowerCase().includes(q) || (h.ar || '').includes(q) ||
        (h.source || '').toLowerCase().includes(q) || localizeSource(h.source, lang).toLowerCase().includes(q)
      const mc = !enCat || h.cat === enCat?.toLowerCase() || h.cat === enCat
      return mq && mc
    })
  }, [list, cat, search, lang, showFavs, favs])

  // Sevimlilər çipindəki say — yalnız siyahıda həqiqətən olan hədislər
  const favCount = useMemo(() => list.filter(isFav).length, [list, favs]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = Math.ceil(filtered.length / PER)
  // Sevimlidən çıxarılanda son səhifə boşala bilər — mövcud səhifəyə sıxırıq
  const current = Math.min(pageNum, Math.max(1, total))
  const paged = filtered.slice((current - 1) * PER, current * PER)

  // Filtr, axtarış, dil və ya "Sevimlilər" dəyişəndə 1-ci səhifəyə qayıt
  useEffect(() => { setPageNum(1) }, [cat, search, lang, showFavs])

  // Səhifə dəyişəndə siyahının əvvəlinə qalx (əks halda ziyarətçi
  // yeni səhifənin sonunda — #40-da qalırdı)
  const countRef = useRef(null)
  const goPage = (p) => {
    setPageNum(p)
    requestAnimationFrame(() => {
      // html-in scroll-padding-top-u sabit başlığı nəzərə alır
      countRef.current?.scrollIntoView({ block: 'start' })
    })
  }

  // Telefonda çip zolağı yapışqandır (sticky): siyahının ortasında başqa
  // kateqoriya seçiləndə yeni nəticələrin əvvəlinə qalx. Kompüterdə zolaq
  // yapışmır — orada bu yoxlama heç nə etmir.
  const barRef = useRef(null)
  const toListTop = () => {
    requestAnimationFrame(() => {
      const bar = barRef.current
      const el = countRef.current
      if (!bar || !el || getComputedStyle(bar).position !== 'sticky') return
      if (el.getBoundingClientRect().top < bar.getBoundingClientRect().bottom) {
        el.scrollIntoView({ block: 'start' })
      }
    })
  }

  const countText = lang==='az' ? `${filtered.length} hədis` : lang==='ru' ? `${filtered.length} хадисов` : lang==='ar' ? `${filtered.length} حديثاً` : lang==='tr' ? `${filtered.length} hadis` : `${filtered.length} hadiths`

  return (
    <>
      <header className="ui-page-hero hadith-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{u.eyebrow}</span>
          <h1 className="ui-display">{t.title}</h1>
          {/* Ərəbcədə başlığın özü ərəbcədir — bəzək sətri təkrarlanmasın */}
          {lang !== 'ar' && <p className="hadith-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">كُتُبُ الحَدِيث</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <div className="hadith-page ui-section ui-section--tight">
        <div className="ui-container">
          <div className="hadith-search">
            <Icon name="search" size={19} className="hadith-search__icon" />
            <input className="ui-input hadith-search__input" type="search" placeholder={t.searchPh}
              aria-label={t.searchPh} enterKeyHint="search"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button type="button" className="ui-icon-btn hadith-search__clear" onClick={() => setSearch('')}
                aria-label={u.clear} title={u.clear}>
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* Telefonda bu zolaq başlığın altında yapışır (şüşə fon) */}
          <div className="hadith-filterbar" ref={barRef}>
            <div className="hadith-chips" role="group" aria-label={CATS_LABEL[lang] || CATS_LABEL.en} data-reveal="stagger-fade">
              <button type="button" className="ui-chip hadith-chip-fav"
                aria-pressed={showFavs}
                onClick={() => { setShowFavs(f => !f); toListTop() }}>
                <HeartIcon filled={showFavs} />
                {FAV_LABELS[lang] || FAV_LABELS.en}
                {favCount > 0 && <span className="hadith-chip-count ui-num">{favCount}</span>}
              </button>
              <span className="hadith-chips__sep" aria-hidden="true" />
              {cats.map(c => (
                <button type="button" key={c} className="ui-chip"
                  aria-pressed={cat === c && !showFavs}
                  onClick={() => { setCat(c); setShowFavs(false); toListTop() }}>{c}</button>
              ))}
            </div>
          </div>

          <p className="hadith-count ui-num" ref={countRef} aria-live="polite">{countText}</p>

          {/* Açar filtr/səhifə dəyişəndə siyahını yenidən qurur — kartlar
              yenidən növbə ilə görünür (siyahı keçidi) */}
          <div className="hadiths-list" key={`${cat}|${showFavs}|${current}`}>
            {paged.length === 0
              ? (
                <div className="ui-card ui-card--sunken hadith-empty" data-reveal="scale">
                  <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral">
                    {showFavs ? <HeartIcon /> : <Icon name="hadith" />}
                  </span>
                  <p className="hadith-empty__title">{t.noResult}</p>
                  {showFavs && !search && <p className="hadith-empty__text">{u.favEmpty}</p>}
                  {search && (
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setSearch('')}>
                      <Icon name="close" className="ui-btn__icon" /> {u.clear}
                    </button>
                  )}
                </div>
              )
              : paged.map((h, i) => (
                  <HadithCard
                    key={h.id}
                    hadith={h}
                    lang={lang}
                    index={i}
                    displayNum={(current - 1) * PER + i + 1}
                    isFav={isFav(h)}
                    onToggleFav={toggleFav}
                    onShare={shareHadith}
                  />
                ))
            }
          </div>

          {/* Ümumi səhifələmə (Kitablar/Videolar ilə eyni): "…" ilə qısa, 44px-ə yaxın düymələr */}
          <Pagination current={current} total={total} onChange={goPage} color="var(--brand)" />
        </div>
      </div>

      {/* "Kopyalandı" bildirişi (navigator.share olmayan brauzerlər) */}
      <div className={`hadith-toast${copied ? ' is-on' : ''}`} role="status" aria-live="polite">
        {copied && <><Icon name="check" size={18} /> {u.copied}</>}
      </div>
    </>
  )
}