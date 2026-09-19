import { useState, useMemo, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/mosque'
import { T } from '../data/i18n'
import { HADITHS } from '../data/hadiths'
import { subscribeToHadiths } from '../data/adminContent'
import { localizeSource } from '../utils/sourceNames'
import { uniqueHadithsFor, hadithAliases, staticHadithKeys, hadithKeys, dedupeList } from '../utils/uniqueHadiths'
import Pagination from '../components/Pagination'
import { haptic } from '../hooks/useHaptic'
import '../styles/HadithPage.css'

const CATS_AZ = ['Hamısı','İman','Əxlaq','İbadət','Namaz','Quran','Elm','Oruc','Zəkat','Zikr','Sədəqə','Səbr','Dünya','Axirət','Salavat','Müsafirlik']
const CATS_EN = ['All','Faith','Character','Worship','Prayer','Quran','Knowledge','Fasting','Zakat','Dhikr','Charity','Patience','World','Afterlife','Salawat','Travel']
const CATS_RU = ['Все','Вера','Характер','Поклонение','Намаз','Коран','Знание','Пост','Закят','Зикр','Садака','Терпение','Мир','Последняя жизнь','Салавят','Путешествие']
const CATS_AR = ['الكل','الإيمان','الأخلاق','العبادة','الصلاة','القرآن','العلم','الصيام','الزكاة','الذكر','الصدقة','الصبر','الدنيا','الآخرة','الصلاة على النبي','السفر']
const CATS_TR = ['Tümü','İman','Ahlak','İbadet','Namaz','Kuran','İlim','Oruç','Zekat','Zikir','Sadaka','Sabır','Dünya','Ahiret','Salavat','Seyahat']
const CATS_MAP = { az:CATS_AZ, en:CATS_EN, ru:CATS_RU, ar:CATS_AR, tr:CATS_TR }

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
    <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
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
    <div className="hadith-card" {...revealProps(index)}>
      <div className="hadith-top">
        <div className="hadith-num">#{displayNum}</div>
        <div className="hadith-cat-badge">{localizeCat(hadith.cat, lang)}</div>
        <div className="hadith-source" title={source}>{source}</div>
        <button
          type="button"
          className={`hadith-fav-btn ${isFav ? 'active' : ''}`}
          onClick={() => onToggleFav(hadith)}
          aria-pressed={isFav}
          aria-label={isFav ? b.unfav : b.fav}
          title={isFav ? b.unfav : b.fav}
        >
          <HeartIcon filled={isFav} />
        </button>
        <button
          type="button"
          className="hadith-share-btn"
          onClick={(e) => { e.stopPropagation(); onShare(hadith) }}
          aria-label={b.share}
          title={b.share}
        >
          <ShareIcon />
        </button>
      </div>
      <p className="hadith-arabic">{hadith.ar}</p>
      {showBody && (
        <div className="hadith-body">
          <p className="hadith-text">{hadith.text}</p>
        </div>
      )}
    </div>
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
      try { await navigator.clipboard.writeText(text); alert(lang === 'az' ? 'Kopyalandı!' : lang === 'ru' ? 'Скопировано!' : lang === 'ar' ? 'تم النسخ!' : lang === 'tr' ? 'Kopyalandı!' : 'Copied!') } catch {}
    }
  }

  // Firebase custom hadithləri uyğun formata çevirək
  const customForLang = useMemo(() => {
    return customHadiths.map(h => ({
      id: h.id,
      ar: h.ar || '',
      text: h.text?.[lang] || h.text?.en || '',
      source: h.source || '',
      cat: h.category || 'general',
      _az: h.text?.az || '',
      _custom: true,
    }))
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
      <div className="page-hero theme-hadith hero-compact">
        <div className="page-hero-arabic">كُتُبُ الحَدِيث</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="hadith-search">
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">🔍</span>
              <input className="input-base input-with-icon" placeholder={t.searchPh}
                aria-label={t.searchPh} enterKeyHint="search"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Telefonda bu zolaq başlığın altında yapışır (şüşə fon) */}
          <div className="hadith-filterbar" ref={barRef}>
            <div className="tag-filters hadith-chips" role="group" aria-label={CATS_LABEL[lang] || CATS_LABEL.en}>
              <button type="button" className={`tag-btn ${showFavs ? 'active' : ''}`}
                aria-pressed={showFavs}
                onClick={() => { setShowFavs(f => !f); toListTop() }}>
                ❤️ {FAV_LABELS[lang] || FAV_LABELS.en}
              </button>
              {cats.map(c => (
                <button type="button" key={c} className={`tag-btn ${cat === c && !showFavs ? 'active' : ''}`}
                  aria-pressed={cat === c && !showFavs}
                  onClick={() => { setCat(c); setShowFavs(false); toListTop() }}>{c}</button>
              ))}
            </div>
          </div>

          <p className="result-count hadith-count" ref={countRef}>{countText}</p>

          <div className="hadiths-list">
            {paged.length === 0
              ? <div className="empty-state"><span>📚</span><p>{t.noResult}</p></div>
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
          <Pagination current={current} total={total} onChange={goPage} color="var(--primary)" />
        </div>
      </div>
    </>
  )
}