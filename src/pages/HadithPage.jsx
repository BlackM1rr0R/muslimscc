import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import { T } from '../data/i18n'
// PERFORMANS: bütöv data/hadiths.js (5 dil) əvəzinə yalnız cari dilin
// build-zamanı hazırlanmış təkrarsız siyahısı (utils/hadithData.js)
import { useHadithData, loadHadithKeys } from '../utils/hadithData'
import { whenIdle } from '../utils/idle'
import { localizeSource } from '../utils/sourceNames'
import { customHadithKeyHashes, dedupeList } from '../utils/uniqueHadiths'
import useInfiniteList, { useSessionState } from '../hooks/useInfiniteList'
import ListMore from '../components/ListMore'
import BackToTop from '../components/BackToTop'
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
  az: { eyebrow:'Hədis və bilik', favEmpty:'Bəyəndiyiniz hədisləri ürək düyməsi ilə burada saxlayın.', copied:'Kopyalandı', clear:'Axtarışı təmizlə', all:'Bütün hədislər' },
  en: { eyebrow:'Hadith & knowledge', favEmpty:'Save the hadiths you love here with the heart button.', copied:'Copied', clear:'Clear search', all:'All hadiths' },
  ru: { eyebrow:'Хадисы и знание', favEmpty:'Сохраняйте понравившиеся хадисы здесь кнопкой с сердцем.', copied:'Скопировано', clear:'Очистить поиск', all:'Все хадисы' },
  ar: { eyebrow:'الحديث والعلم', favEmpty:'احفظ الأحاديث التي تحبها هنا بزر القلب.', copied:'تم النسخ', clear:'مسح البحث', all:'كل الأحاديث' },
  tr: { eyebrow:'Hadis ve ilim', favEmpty:'Beğendiğiniz hadisleri kalp düğmesiyle burada saklayın.', copied:'Kopyalandı', clear:'Aramayı temizle', all:'Tüm hadisler' },
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

// Sonsuz sürüşmənin bir partiyası (1445 hədisin hamısı birdən DOM-a qoyulmur)
const BATCH = 24

// ── Axtarış normallaşdırması ──
// Latın/kiril: kiçik hərf, "İ"-nin nöqtəsi (U+0307) atılır, ı → i, ё → е —
// "Iman", "iman", "İman" eyni tapılır. Ərəbcə: hərəkələr (fəthə, kəsrə …),
// təṭvil və əlif formaları (أ إ آ ٱ → ا), ى → ي — istifadəçi hərəkəsiz yazır.
const fold = (s) => String(s || '').toLowerCase().replace(/̇/g, '').replace(/ı/g, 'i').replace(/ё/g, 'е')
const AR_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g
const foldAr = (s) => String(s || '').replace(AR_MARKS, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')

// Axtarış yazılarkən hər hərfdə 1445 qeydi süzməyək — 180ms sakitlikdən sonra
function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => {
    // Təmizləyəndə gözləmədən
    const t = setTimeout(() => setV(value), value ? ms : 0)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// Sürüşdükcə görünmə (motion.css → data-reveal): hər kart ayrıca izlənir.
// Hər yeni partiyanın ilk 6 kartı 40ms növbə ilə qalxır, qalanları ekrana
// girəndə gecikməsiz. (Bütün uzun siyahıya bir "stagger" vermirik: uzun
// siyahıda yalnız ilk 10 uşaq növbə alır, qalanları ekrandan kənarda oynayardı.)
const revealProps = (i) => {
  const j = i % BATCH
  return { 'data-reveal': '', ...(j > 0 && j < 6 ? { 'data-reveal-delay': String(j * 40) } : {}) }
}

// memo: yeni partiya əlavə olunanda və ya bir kart sevimliyə düşəndə
// köhnə kartlar yenidən render olunmur (callback-lar sabitdir)
const HadithCard = memo(function HadithCard({ hadith, displayNum, isFav, onToggleFav, onShare, lang, index }) {
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
})

export default function HadithPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.hadith || T.az.hadith
  const cats = CATS_MAP[lang] || CATS_EN
  // Cari dilin hədisləri (hazır deyilsə Suspense gözləyir — bax utils/hadithData.js)
  const hadithData = useHadithData(lang)
  // Kateqoriya İNDEKSLƏ saxlanılır: əvvəl adla idi və dil dəyişəndə ("Namaz" →
  // "Prayer") heç bir çip seçilmiş görünmürdü. Filtrlər sessionStorage-də —
  // geri qayıdanda (useInfiniteList-in mövqe yaddaşı ilə birlikdə) bərpa olunur.
  const [catIdx,  setCatIdx]  = useSessionState('hadith:cat', 0)
  const [search,  setSearch]  = useSessionState('hadith:q', '')
  const query = useDebounced(search, 180)
  // Sevimlilər id ilə saxlanılır. Təkrar (atılmış) hədisin id-si
  // saxlanılan surətin id-sinə köçürülür — köhnə sevimli itməsin.
  const [favs,    setFavs]    = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hadith_favs'))
      if (!Array.isArray(saved)) return []
      const aliases = hadithData.aliases
      return [...new Set(saved.map(id => (aliases.has(id) ? aliases.get(id) : id)))]
    } catch { return [] }
  })
  const [showFavs, setShowFavs] = useSessionState('hadith:fav', false)
  const [customHadiths, setCustomHadiths] = useState([])
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef(null)
  useEffect(() => () => clearTimeout(copiedTimer.current), [])
  const u = UI_LABELS[lang] || UI_LABELS.en

  useEffect(() => {
    try { localStorage.setItem('hadith_favs', JSON.stringify(favs)) } catch { /* yaddaş bağlıdır */ }
  }, [favs])

  // Firebase real-time custom hadiths.
  // PERFORMANS: adminContent (→ Firebase SDK, ~90 KB gzip) statik import
  // edilmir — "load"-dan sonra, boş vaxtda yüklənir (utils/idle.js). Əvvəl
  // /hadith-in kritik yolunda idi; admin hədisləri onsuz da şəbəkədən sonra
  // gəlirdi və siyahının əvvəlinə əlavə olunurdu (davranış eynidir).
  useEffect(() => {
    let unsubscribe = null
    let alive = true
    whenIdle()
      .then(() => import('../data/adminContent'))
      .then(({ subscribeToHadiths }) => {
        if (alive) unsubscribe = subscribeToHadiths((items) => setCustomHadiths(items))
      })
      .catch(() => { /* chunk yüklənmədi — yalnız yerli hədislər */ })
    return () => { alive = false; unsubscribe?.() }
  }, [])

  // Yerli hədislərin birləşmə açarları (utils/hadithData.js → loadHadithKeys):
  // yalnız Firebase-dən admin hədisi gələndə yüklənir (~31 KB gzip) — admin
  // hədisi yoxdursa heç vaxt. Yüklənə bilməsə, admin hədisləri birləşməsiz
  // göstərilir (itmir).
  const [staticKeysOf, setStaticKeysOf] = useState(null)
  const needKeys = customHadiths.length > 0 && !staticKeysOf
  useEffect(() => {
    if (!needKeys) return undefined
    let alive = true
    loadHadithKeys().then(
      (fn) => { if (alive) setStaticKeysOf(() => fn) },
      () => { if (alive) setStaticKeysOf(() => () => []) },
    )
    return () => { alive = false }
  }, [needKeys])

  // Set: 1445 kartın hər biri üçün massivdə axtarış etməyək
  const favSet = useMemo(() => new Set(favs), [favs])
  const isFav = useCallback((h) => idsOf(h).some(id => favSet.has(id)), [favSet])

  // Sevimli — əsas keçid: telefonda yüngül titrəmə ilə "hiss" olunur.
  // Sabit callback (memo kartlar yenidən render olunmasın)
  const toggleFav = useCallback((h) => {
    haptic()
    const ids = idsOf(h)
    setFavs(f => (ids.some(id => f.includes(id)) ? f.filter(x => !ids.includes(x)) : [...f, h.id]))
  }, [])

  const shareHadith = useCallback(async (hadith) => {
    // Ərəbcədə "tərcümə" elə ərəb mətnidir — iki dəfə yazılmasın
    const body = hadith.text && hadith.text !== hadith.ar ? `${hadith.text}\n\n` : ''
    const text = `${hadith.ar}\n\n${body}— ${localizeSource(hadith.source, lang)}\n\n${brandName(lang)} — muslims.cc`
    // alert() əvəzinə sakit bildiriş (2 san.) — axını kəsmir
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        clearTimeout(copiedTimer.current)
        copiedTimer.current = setTimeout(() => setCopied(false), 2000)
      } catch { /* panoya yazmaq bağlıdır */ }
    }
    if (navigator.share) {
      // İstifadəçi pəncərəni bağlayıbsa (AbortError) — heç nə; paylaşma
      // bağlıdırsa (NotAllowedError, iframe) — panoya köçür
      try { await navigator.share({ text }) } catch (e) { if (e?.name !== 'AbortError') await copy() }
    } else {
      await copy()
    }
  }, [lang])

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
  // (build zamanı hesablanıb: uniqueHadithsFor(HADITHS, lang) ilə eyni siyahı)
  const staticList = hadithData.list

  // Firebase-dən gələnləri əvvəl göstər. Admin paneli yerli hədisləri
  // Firebase-ə "toxum" kimi köçürə bilir — belə surət yerli hədislə bir
  // kart olur (eyni qayda: ərəb mətni / Azərbaycanca tərcümə). Admin mətni
  // üstündür, boş sahələr yerli nüsxədən doldurulur; kateqoriya yerli
  // nüsxədən götürülür (admin panelində kateqoriyalar daha azdır).
  const list = useMemo(() => {
    // Açarlar hələ yüklənməyibsə admin hədisləri bir anlıq gözləyir (yerli
    // nüsxə ilə birləşmədən ikinci kart kimi görünməsinlər)
    const all = [...(staticKeysOf ? customForLang : []), ...staticList].map(h => ({ ...h, _ids: [h.id] }))
    // Açarlar həşlənmiş formadadır (hər iki tərəf eyni hashKey ilə) — müqayisə eynidir
    const keysOf = (h) => (h._custom ? customHadithKeyHashes(h.ar, h._az, h.source) : (staticKeysOf ? staticKeysOf(h.id) : []))
    return dedupeList(all, keysOf, {
      onDuplicate: (kept, dup) => {
        kept._ids.push(dup.id)
        if (!kept.text && dup.text) kept.text = dup.text
        if (!kept.source && dup.source) kept.source = dup.source
        if (kept._custom && !dup._custom && dup.cat) kept.cat = dup.cat
      },
    }).items
  }, [customForLang, staticList, staticKeysOf])

  // Axtarış indeksi — hər hədis üçün bir dəfə (hər hərfdə yenidən yox).
  // Mənbə həm orijinal ("Buxari"), həm cari dildəki yazılışla ("Bukhari") tapılır.
  const index = useMemo(() => list.map(h => ({
    hay: fold(`${h.text || ''}\n${h.source || ''}\n${localizeSource(h.source, lang)}`),
    ar: foldAr(h.ar),
  })), [list, lang])

  // Sevimlilər filtri yalnız açıq olanda favSet-dən asılıdır — əks halda
  // ürəyə basmaq bütün siyahını yenidən süzdürməsin
  const favFilter = showFavs ? favSet : null
  const safeCat = catIdx > 0 && catIdx < cats.length ? catIdx : 0
  const filtered = useMemo(() => {
    const q = fold(query.trim())
    const qa = foldAr(query.trim())
    const enCat = safeCat > 0 ? CATS_EN[safeCat].toLowerCase() : null
    return list.filter((h, i) => {
      if (favFilter && !idsOf(h).some(id => favFilter.has(id))) return false
      if (enCat && String(h.cat || '').toLowerCase() !== enCat) return false
      return !q || index[i].hay.includes(q) || (qa && index[i].ar.includes(qa))
    })
  }, [list, index, safeCat, query, favFilter])

  // Sevimlilər çipindəki say — yalnız siyahıda həqiqətən olan hədislər
  const favCount = useMemo(() => list.filter(isFav).length, [list, isFav])

  // Telefonda çip zolağı yapışqandır (sticky) — onun altı; kompüterdə başlıq.
  const countRef = useRef(null)
  const barRef = useRef(null)

  // Sonsuz sürüşmə: filtr/axtarış/dil/"Sevimlilər" dəyişəndə siyahı əvvəldən
  // başlayır və (siyahının ortasında idisə) nəticələrin əvvəlinə qalxır
  const inf = useInfiniteList({
    total: filtered.length,
    batch: BATCH,
    resetKey: `${lang}|${safeCat}|${showFavs ? 1 : 0}|${query.trim()}`,
    storageKey: 'hadith',
    onReset: () => {
      const el = countRef.current
      if (!el) return
      const bar = barRef.current
      const sticky = bar && getComputedStyle(bar).position === 'sticky'
      const limit = sticky ? bar.getBoundingClientRect().bottom : 80
      // html-in scroll-padding-top-u / scroll-margin sabit başlığı nəzərə alır
      if (el.getBoundingClientRect().top < limit) el.scrollIntoView({ block: 'start' })
    },
  })
  const visible = filtered.slice(0, inf.count)

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
                onClick={() => setShowFavs(f => !f)}>
                <HeartIcon filled={showFavs} />
                {FAV_LABELS[lang] || FAV_LABELS.en}
                {favCount > 0 && <span className="hadith-chip-count ui-num">{favCount}</span>}
              </button>
              <span className="hadith-chips__sep" aria-hidden="true" />
              {cats.map((c, i) => (
                <button type="button" key={c} className="ui-chip"
                  aria-pressed={safeCat === i && !showFavs}
                  onClick={() => { setCatIdx(i); setShowFavs(false) }}>{c}</button>
              ))}
            </div>
          </div>

          <p className="hadith-count ui-num" ref={countRef} aria-live="polite">{countText}</p>

          {/* Açar filtr dəyişəndə siyahını yenidən qurur — kartlar yenidən
              növbə ilə görünür (siyahı keçidi). Axtarış açara daxil deyil:
              hər hərfdə bütün kartlar yenidən oynamasın. */}
          <div className="hadiths-list" key={`${safeCat}|${showFavs}`}>
            {visible.length === 0
              ? (
                <div className="ui-card ui-card--sunken hadith-empty" data-reveal="scale">
                  <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral">
                    {showFavs ? <HeartIcon /> : <Icon name="hadith" />}
                  </span>
                  <p className="hadith-empty__title">{t.noResult}</p>
                  {showFavs && !search && <p className="hadith-empty__text">{u.favEmpty}</p>}
                  {showFavs && !search && (
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setShowFavs(false)}>
                      <Icon name="hadith" className="ui-btn__icon" /> {u.all}
                    </button>
                  )}
                  {search && (
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setSearch('')}>
                      <Icon name="close" className="ui-btn__icon" /> {u.clear}
                    </button>
                  )}
                </div>
              )
              : visible.map((h, i) => (
                  <HadithCard
                    key={h.id}
                    hadith={h}
                    lang={lang}
                    index={i}
                    displayNum={i + 1}
                    isFav={isFav(h)}
                    onToggleFav={toggleFav}
                    onShare={shareHadith}
                  />
                ))
            }
          </div>

          {/* Sonsuz sürüşmə: altda skeleton + "Daha çox göstər", sonda "Hamısı göstərildi" */}
          <ListMore {...inf} endText={countText} minForEnd={BATCH} skeleton={
            <>
              <div className="ui-card hadith-card hadith-skel">
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '22%' }} />
                <span className="ui-skeleton ui-skeleton--text hadith-skel__ar" style={{ '--w': '92%' }} />
                <span className="ui-skeleton ui-skeleton--text hadith-skel__ar" style={{ '--w': '70%' }} />
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '85%' }} />
                <span className="ui-skeleton ui-skeleton--text" style={{ '--w': '40%' }} />
              </div>
            </>
          } />
        </div>
      </div>

      <BackToTop />

      {/* "Kopyalandı" bildirişi (navigator.share olmayan brauzerlər).
          <body>-yə portal: <main>-in keçid animasiyası (fill: both, transform)
          position: fixed-i özünə bağlayırdı — bildiriş ekranın yox, səhifənin
          altında (~4500px aşağıda) çıxırdı və görünmürdü. */}
      {createPortal(
        <div className={`hadith-toast${copied ? ' is-on' : ''}`} role="status" aria-live="polite">
          {copied && <><Icon name="check" size={18} /> {u.copied}</>}
        </div>,
        document.body
      )}
    </>
  )
}