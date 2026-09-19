import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { SURAH_AZ } from '../data/surahNamesAz'
import { haptic } from '../hooks/useHaptic'
import '../styles/QuranPage.css'

const EDITION_MAP = { az:'az.mammadaliyev', en:'en.asad', ru:'ru.kuliev', ar:'ar.muyassar', tr:'tr.diyanet' }

const SEARCH_LABELS = {
  az: { surahSearch: 'Surə axtar', verseSearch: 'Ayə axtar', searching: 'Axtarılır...', noResults: 'Nəticə tapılmadı', result: 'nəticə' },
  en: { surahSearch: 'Search surahs', verseSearch: 'Search verses', searching: 'Searching...', noResults: 'No results found', result: 'results' },
  ru: { surahSearch: 'Поиск сур', verseSearch: 'Поиск аятов', searching: 'Поиск...', noResults: 'Ничего не найдено', result: 'результатов' },
  ar: { surahSearch: 'بحث السور', verseSearch: 'بحث الآيات', searching: 'جارٍ البحث...', noResults: 'لا نتائج', result: 'نتائج' },
  tr: { surahSearch: 'Sure ara', verseSearch: 'Ayet ara', searching: 'Aranıyor...', noResults: 'Sonuç bulunamadı', result: 'sonuç' },
}

const BOOKMARK_LABELS = {
  az: 'Oxumağa davam et',
  en: 'Continue reading',
  ru: 'Продолжить чтение',
  ar: 'أكمل القراءة',
  tr: 'Okumaya devam et'
}

const TAFSIR_LABELS = {
  az: 'Təfsir',
  en: 'Tafsir',
  ru: 'Тафсир',
  ar: 'تفسير',
  tr: 'Tefsir',
}

// Ayənin səs düyməsi (ekran oxuyucusu üçün; əvvəl yalnız ▶ işarəsi idi)
const PLAY_LABELS = {
  az: { play:'Ayəni dinlə', pause:'Dayandır' },
  en: { play:'Listen to the verse', pause:'Pause' },
  ru: { play:'Слушать аят', pause:'Пауза' },
  ar: { play:'استمع إلى الآية', pause:'إيقاف مؤقت' },
  tr: { play:'Ayeti dinle', pause:'Duraklat' },
}

// Oynat / fasilə ikonları — SVG: telefonda ⏸ simvolu rəngli emoji kimi çıxırdı
function PlayIcon({ playing }) {
  return playing ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/>
      <rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4C8.9 4.3 8 4.8 8 5.6z" fill="currentColor"/>
    </svg>
  )
}

// Yüklənmə skeletləri (telefonda spinner əvəzinə — məzmunun formasını göstərir).
// Kompüterdə köhnə spinner qalır (CSS ilə seçilir).
function ReaderSkeleton({ label }) {
  return (
    <div className="q-skel q-skel-reader" role="status" aria-label={label}>
      <div className="skeleton q-skel-head" />
      <div className="skeleton q-skel-basmala" />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="q-skel-ayah">
          <span className="skeleton skeleton--circle q-skel-num" />
          <span className="skeleton skeleton--text q-skel-line" />
          <span className="skeleton skeleton--text q-skel-line q-skel-line--short" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton({ label }) {
  return (
    <div className="q-skel q-skel-list" role="status" aria-label={label}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="q-skel-row">
          <span className="skeleton q-skel-tile" />
          <span className="q-skel-body">
            <span className="skeleton skeleton--text q-skel-title" />
            <span className="skeleton skeleton--text q-skel-sub" />
          </span>
        </div>
      ))}
    </div>
  )
}

// Oxuma statistikası zolağının yazıları
const STATS_LABELS = {
  az: { reads:'Oxuma', surahs:'Surə', streak:'Gün ardıcıl', most:'Ən çox oxunan' },
  en: { reads:'Reads', surahs:'Surahs', streak:'Day streak', most:'Most read' },
  ru: { reads:'Чтений', surahs:'Сур', streak:'Дней подряд', most:'Самая читаемая' },
  ar: { reads:'قراءات', surahs:'سور', streak:'أيام متتالية', most:'الأكثر قراءة' },
  tr: { reads:'Okuma', surahs:'Sure', streak:'Gün seri', most:'En çok okunan' },
}

// Şrift düymələri (A− / A+) üçün ekran oxuyucusu yazısı
const FONT_LABELS = {
  az: { smaller:'Yazını kiçilt', larger:'Yazını böyüt' },
  en: { smaller:'Smaller text', larger:'Larger text' },
  ru: { smaller:'Уменьшить шрифт', larger:'Увеличить шрифт' },
  ar: { smaller:'تصغير الخط', larger:'تكبير الخط' },
  tr: { smaller:'Yazıyı küçült', larger:'Yazıyı büyüt' },
}

// Nazil olma yeri. i18n-dəki t.meccan / t.medinan süzgəc düymələri üçündür
// (rus dilində cəm: "Мекканские") — surənin özü üçün tək forma lazımdır.
const REVELATION = {
  az: { Meccan:'Məkki', Medinan:'Mədəni' },
  en: { Meccan:'Meccan', Medinan:'Medinan' },
  ru: { Meccan:'Мекканская', Medinan:'Мединская' },
  ar: { Meccan:'مكية', Medinan:'مدنية' },
  tr: { Meccan:'Mekki', Medinan:'Medeni' },
}
const revelationLabel = (type, lang) => (REVELATION[lang] || REVELATION.en)[type] || type

// ── Surənin adı cari dildə ──
// az: yerli yazılış (SURAH_AZ); ar: API-dəki ərəb adı, "سُورَةُ" sözü olmadan;
// qalan dillər: API-nin latın transliterasiyası.
const stripSurahWord = name => String(name || '').replace(/^سُورَةُ\s+/, '')
function surahTitle(s, lang) {
  if (!s) return ''
  if (lang === 'az' && SURAH_AZ[s.number]) return SURAH_AZ[s.number].name
  if (lang === 'ar') return stripSurahWord(s.name)
  return s.englishName
}

// i18n sətirlərində ox mətnin içindədir ("← Geri", "Növbəti →"). Oxu atıb
// ayrıca .qm-dir-arrow ilə veririk — ərəbcədə (RTL) avtomatik güzgülənir.
const stripArrows = s => String(s || '').replace(/[←→]/g, '').trim()
function DirArrow({ back = false }) {
  return <span className="qm-dir-arrow" aria-hidden="true">{back ? '←' : '→'}</span>
}

// ── Bəsmələnin təkrarlanmaması ──
// API (ar.alafasy) Fatihə və Tövbədən başqa 112 surədə 1-ci ayənin mətninin
// əvvəlinə Bəsmələni yapışdırır. Oxuyucuda Bəsmələ ayrıca kartda olduğu üçün
// 1-ci ayədə onun ilk dörd sözünü göstərmirik (mətn dəyişmir, yalnız təkrar
// gizlənir). Müqayisə hərəkələrsiz aparılır: 95 və 97-ci surələrdə yazılış
// "بِّسْمِ" kimidir.
const AR_MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g
const plainArabic = s => s.replace(AR_MARKS, '').replace(/\u0671/g, '\u0627')
const BASMALA_PLAIN = 'بسم الله الرحمن الرحيم'
function withoutLeadingBasmala(text) {
  const words = text.split(' ')
  if (words.length > 4 && plainArabic(words.slice(0, 4).join(' ')) === BASMALA_PLAIN) {
    return words.slice(4).join(' ')
  }
  return text
}

function useQuranList() {
  const [surahs,  setSurahs]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json()).then(d => setSurahs(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])
  return { surahs, loading, error }
}

function useSurah(num, lang) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const edition = EDITION_MAP[lang] || 'en.asad'
  useEffect(() => {
    if (!num) return
    // Tez-tez "Növbəti" basılanda köhnə cavab yenisinin üstünə yazılmasın
    let cancelled = false
    setLoading(true); setData(null); setError(null)
    const eds = lang === 'ar' ? 'ar.alafasy,ar.muyassar' : `ar.alafasy,${edition}`
    fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/${eds}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const [arabic, trans] = d.data
        setData({ ...arabic, verses: arabic.ayahs.map((v,i) => {
          // Fatihənin 1-ci ayəsi BOM (U+FEFF) ilə başlayır
          const text = v.text.replace(/^\uFEFF/, '')
          return {
            n: v.numberInSurah,
            ar: (i === 0 && num !== 1 && num !== 9) ? withoutLeadingBasmala(text) : text,
            audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${v.number}.mp3`,
            tr: trans?.ayahs[i]?.text || ''
          }
        }) })
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [num, lang])
  return { data, loading, error }
}

function AyahCard({ verse, showTrans, showTafsir, tafsirLabel, fontSize, playLabels }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(verse.audio)
      audioRef.current.onended = () => setPlaying(false)
      audioRef.current.onerror = () => setPlaying(false)
    }
    return audioRef.current
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [verse.audio])

  const toggle = () => {
    haptic()
    const audio = getAudio()
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }
  const playLabel = playing ? playLabels.pause : playLabels.play
  return (
    // data-reveal: sürüşdükcə ayə kartı yumşaq görünür (motion.css)
    <div className={`ayah-card${playing ? ' is-playing' : ''}`} data-reveal="">
      <div className="ayah-num">{verse.n}</div>
      <div className="ayah-body">
        <p className="ayah-arabic" lang="ar" style={{ fontSize: `${fontSize}rem` }}>{verse.ar}</p>
        {showTrans && verse.tr && !showTafsir && <p className="ayah-trans">{verse.tr}</p>}
        {showTafsir && verse.tr && (
          <div className="ayah-tafsir">
            <span className="ayah-tafsir-label">{tafsirLabel}</span>
            {verse.tr}
          </div>
        )}
      </div>
      {verse.audio && (
        <button type="button" className={`ayah-play press ${playing ? 'playing' : ''}`} onClick={toggle}
          aria-label={playLabel} title={playLabel}>
          <PlayIcon playing={playing} />
        </button>
      )}
    </div>
  )
}

function calcStreak(dates) {
  if (!dates.length) return 0
  const sorted = [...dates].sort().reverse()
  const today = new Date().toISOString().slice(0,10)
  if (sorted[0] !== today) return 0
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i-1])
    const curr = new Date(sorted[i])
    const diff = (prev - curr) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

function getMostRead(reads) {
  const entries = Object.entries(reads)
  if (!entries.length) return '-'
  const [num] = entries.sort((a,b) => b[1] - a[1])[0]
  return num
}

export default function QuranPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.quran || T.az.quran
  const { surahs, loading: listLoading } = useQuranList()
  const [bookmark, setBookmark] = useState(() => { try { return JSON.parse(localStorage.getItem('quran_bookmark')) } catch { return null } })
  const [selected, setSelected] = useState(null)
  // Siyahıdakı sürüşmə yeri — oxuyucudan qayıdanda ora dönürük
  const listScrollRef = useRef(0)

  // ── Quran oxuma statistikası ──
  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('quran_stats')) || { reads: {}, sessions: 0, dates: [] } } catch { return { reads: {}, sessions: 0, dates: [] } }
  })

  const trackRead = (surahNum) => {
    setStats(prev => {
      const today = new Date().toISOString().slice(0,10)
      const reads = { ...prev.reads }
      reads[surahNum] = (reads[surahNum] || 0) + 1
      const dates = prev.dates.includes(today) ? prev.dates : [...prev.dates, today]
      const next = { reads, sessions: prev.sessions + 1, dates }
      try { localStorage.setItem('quran_stats', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const [search,   setSearch]   = useState('')
  const [searchMode, setSearchMode] = useState('surah')
  const [verseSearch, setVerseSearch] = useState('')
  const [verseResults, setVerseResults] = useState([])
  const [verseSearching, setVerseSearching] = useState(false)
  const verseTimerRef = useRef(null)
  // Dil dəyişəndə t.all/t.meccan/t.medinan-ın label-i dəyişir; ona görə
  // filter state-i tərcüməsiz key ('all'|'meccan'|'medinan') saxlayırıq.
  const [filter,   setFilter]   = useState('all')
  const [showTrans, setShowTrans] = useState(true)
  const [showTafsir, setShowTafsir] = useState(false)
  const [fontSize,  setFontSize]  = useState(1.65)
  const { data: surah, loading: surahLoading, error: surahError } = useSurah(selected, lang)
  const sl = SEARCH_LABELS[lang] || SEARCH_LABELS.az
  const st = STATS_LABELS[lang] || STATS_LABELS.az
  const fl = FONT_LABELS[lang] || FONT_LABELS.az
  const tafsirLabel = TAFSIR_LABELS[lang] || TAFSIR_LABELS.en
  const playLabels = PLAY_LABELS[lang] || PLAY_LABELS.az
  // Real təfsir yalnız ərəbcədədir (ar.muyassar). Digər dillərin nəşri
  // tərcümədir — onu "Təfsir" adı ilə göstərmək yanıldıcı olardı.
  const hasTafsir = lang === 'ar'

  useEffect(() => {
    if (searchMode !== 'verse') return
    if (verseSearch.length < 3) { setVerseResults([]); setVerseSearching(false); return }
    setVerseSearching(true)
    if (verseTimerRef.current) clearTimeout(verseTimerRef.current)
    verseTimerRef.current = setTimeout(() => {
      const edition = EDITION_MAP[lang] || 'en.asad'
      fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(verseSearch)}/all/${edition}`)
        .then(r => r.json())
        .then(d => {
          if (d.code === 200 && d.data?.matches) {
            setVerseResults(d.data.matches)
          } else {
            setVerseResults([])
          }
        })
        .catch(() => setVerseResults([]))
        .finally(() => setVerseSearching(false))
    }, 500)
    return () => { if (verseTimerRef.current) clearTimeout(verseTimerRef.current) }
  }, [verseSearch, searchMode, lang])

  const surahByNum = n => surahs.find(s => s.number === n)

  const saveBookmark = (num) => {
    const bm = { surah: num, name: surahTitle(surahByNum(num), lang), time: Date.now() }
    try { localStorage.setItem('quran_bookmark', JSON.stringify(bm)) } catch {}
    setBookmark(bm)
  }

  const openSurah = (num) => {
    if (!num) return
    // Siyahıdan açılırsa yeri yadda saxla (əvvəlki/növbəti surədə yox)
    if (!selected) listScrollRef.current = window.scrollY
    setSelected(num)
    saveBookmark(num)
    trackRead(num)
    // Surə həmişə əvvəldən açılır — əvvəl siyahının sürüşmə yerində qalırdı
    window.scrollTo(0, 0)
  }

  const closeReader = () => {
    setSelected(null)
    const y = listScrollRef.current
    requestAnimationFrame(() => window.scrollTo(0, y))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return surahs.filter(s => {
      const az = SURAH_AZ[s.number]
      const matchQ = !q || s.englishName.toLowerCase().includes(q) ||
        s.name.includes(search) || String(s.number).includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        (az && (az.name.toLowerCase().includes(q) || az.meaning.toLowerCase().includes(q)))
      const matchF = filter === 'all' ||
        (filter === 'meccan' && s.revelationType === 'Meccan') ||
        (filter === 'medinan' && s.revelationType === 'Medinan')
      return matchQ && matchF
    })
  }, [surahs, search, filter, lang])

  // ── Oxuyucu ──
  // Surə yüklənərkən də açılır (spinner ilə) — əvvəl yüklənənə qədər
  // siyahı ekranda qalırdı və toxunuşun heç nə etmədiyi görünürdü.
  if (selected) {
    const ready = surah && surah.number === selected
    const prevS = surahByNum(selected - 1)
    const nextS = surahByNum(selected + 1)
    const prevLabel = stripArrows(t.prevSurah)
    const nextLabel = stripArrows(t.nextSurah)
    const bmLabel = BOOKMARK_LABELS[lang] || BOOKMARK_LABELS.en
    const rawMeaning = !ready ? '' : lang === 'az' && SURAH_AZ[surah.number] ? SURAH_AZ[surah.number].meaning
      : lang === 'ar' ? '' : surah.englishNameTranslation
    // Məna adla eynidirsə (məs. "Yasin") təkrarlamırıq
    const meaning = ready && rawMeaning !== surahTitle(surah, lang) ? rawMeaning : ''
    return (
      <div className="quran-reader">
        <div className="reader-toolbar">
          <button type="button" className="btn-ghost reader-back" onClick={closeReader}>
            <DirArrow back /> {stripArrows(t.backBtn)}
          </button>
          <div className="reader-controls">
            {/* dir="ltr": ərəbcədə "A−" bidi qaydası ilə "−A" kimi görünürdü */}
            <button type="button" className="ctrl-btn press" dir="ltr" aria-label={fl.smaller} title={fl.smaller}
              onClick={() => setFontSize(f => Math.max(f - .1, 1.2))}>A−</button>
            <button type="button" className="ctrl-btn press" dir="ltr" aria-label={fl.larger} title={fl.larger}
              onClick={() => setFontSize(f => Math.min(f + .1, 2.2))}>A+</button>
            {hasTafsir ? (
              <button type="button" className={`ctrl-btn press ${showTafsir ? 'active' : ''}`} aria-pressed={showTafsir}
                onClick={() => { haptic(); setShowTafsir(s => !s) }}>
                {tafsirLabel}{showTafsir && <span className="ctrl-check" aria-hidden="true"> ✓</span>}
              </button>
            ) : (
              <button type="button" className={`ctrl-btn press ${showTrans ? 'active' : ''}`} aria-pressed={showTrans}
                onClick={() => { haptic(); setShowTrans(s => !s) }}>
                {t.translationLabel}{showTrans && <span className="ctrl-check" aria-hidden="true"> ✓</span>}
              </button>
            )}
            <button type="button" className="ctrl-btn ctrl-nav press" disabled={selected <= 1}
              aria-label={prevLabel} title={prevLabel} onClick={() => openSurah(selected - 1)}>
              <DirArrow back /><span className="ctrl-label"> {prevLabel}</span>
            </button>
            <button type="button" className="ctrl-btn ctrl-nav press" disabled={selected >= 114}
              aria-label={nextLabel} title={nextLabel} onClick={() => openSurah(selected + 1)}>
              <span className="ctrl-label">{nextLabel} </span><DirArrow />
            </button>
            <button type="button" className={`ctrl-btn ctrl-bookmark press ${bookmark && bookmark.surah === selected ? 'active' : ''}`}
              onClick={() => { haptic(); saveBookmark(selected) }} title={bmLabel} aria-label={bmLabel}>
              🔖
            </button>
          </div>
        </div>
        {surahError && <div className="error-box">⚠️ {t.error}</div>}
        {!ready && !surahError && (
          <>
            <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>
            <ReaderSkeleton label={t.loading} />
          </>
        )}
        {ready && (
          <>
            <div className="reader-header">
              <div className="reader-number">{surah.number}</div>
              <div className="reader-info">
                <h1 className="reader-arabic" lang="ar">{surah.name}</h1>
                {lang !== 'ar' && <h2 className="reader-english">{surahTitle(surah, lang)}</h2>}
                <p className="reader-meta">
                  {[meaning, `${surah.numberOfAyahs} ${t.verses}`, revelationLabel(surah.revelationType, lang)].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            {/* Fatihədə Bəsmələ 1-ci ayənin özüdür, Tövbədə isə oxunmur */}
            {surah.number !== 1 && surah.number !== 9 && (
              <div className="reader-basmalah">
                <span className="basmalah-ar" lang="ar">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
                {lang !== 'ar' && <span className="basmalah-tr">{t.basmalah}</span>}
              </div>
            )}
            <div className="ayahs-list">
              {surah.verses?.map(v => (
                <AyahCard key={v.n} verse={v} fontSize={fontSize} tafsirLabel={tafsirLabel} playLabels={playLabels}
                  showTrans={!hasTafsir && showTrans} showTafsir={hasTafsir && showTafsir} />
              ))}
            </div>
            {/* Surənin sonunda: əvvəlki / növbəti surə (telefonda paneldə yalnız ox görünür) */}
            <div className="reader-pager" data-reveal="">
              {selected > 1 && (
                <button type="button" className="reader-pager-btn prev press" onClick={() => openSurah(selected - 1)}>
                  <span className="reader-pager-dir"><DirArrow back /> {prevLabel}</span>
                  <span className="reader-pager-name">{surahTitle(prevS, lang) || selected - 1}</span>
                </button>
              )}
              {selected < 114 && (
                <button type="button" className="reader-pager-btn next press" onClick={() => openSurah(selected + 1)}>
                  <span className="reader-pager-dir">{nextLabel} <DirArrow /></span>
                  <span className="reader-pager-name">{surahTitle(nextS, lang) || selected + 1}</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  const bookmarkName = bookmark ? (surahTitle(surahByNum(bookmark.surah), lang) || bookmark.name) : ''
  const mostReadName = (() => {
    const n = +getMostRead(stats.reads)
    if (!n) return '-'
    return surahTitle(surahByNum(n), lang) || (lang === 'az' && SURAH_AZ[n] ? SURAH_AZ[n].name : String(n))
  })()

  return (
    <>
      {/* hero-compact: telefonda yığcam hero (motion.css), kompüterdə dəyişmir */}
      <div className="page-hero theme-quran hero-compact">
        {/* Ərəbcədə başlığın özü "القرآن الكريم"-dir — ikinci dəfə yazmırıq */}
        {lang !== 'ar' && <div className="page-hero-arabic" lang="ar">القرآن الكريم</div>}
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="quran-list-wrap section">
        <div className="section-inner">
          {bookmark && (
            <button type="button" className="quran-bookmark-card press" onClick={() => openSurah(bookmark.surah)}>
              <span className="bookmark-icon" aria-hidden="true">🔖</span>
              <span className="bookmark-info">
                <span className="bookmark-label">{BOOKMARK_LABELS[lang] || BOOKMARK_LABELS.en}</span>
                <span className="bookmark-name">{bookmarkName}</span>
              </span>
              <span className="bookmark-arrow"><DirArrow /></span>
            </button>
          )}
          {stats.sessions > 0 && (
            <div className="quran-stats-bar">
              <div className="qs-item">
                <span className="qs-num">{stats.sessions}</span>
                <span className="qs-label">{st.reads}</span>
              </div>
              <div className="qs-item">
                <span className="qs-num">{Object.keys(stats.reads).length}</span>
                <span className="qs-label">{st.surahs}</span>
              </div>
              <div className="qs-item">
                <span className="qs-num">{calcStreak(stats.dates)}</span>
                <span className="qs-label">{st.streak}</span>
              </div>
              <div className="qs-item qs-item--name">
                <span className="qs-num qs-name">{mostReadName}</span>
                <span className="qs-label">{st.most}</span>
              </div>
            </div>
          )}
          {/* Telefonda seqment idarəsi: ağ "hap" aktiv seçimə sürüşür (data-active),
              kompüterdə əvvəlki həb düymələr */}
          <div className="quran-search-mode" role="group" data-active={searchMode}>
            <button type="button" className={`search-mode-btn press ${searchMode === 'surah' ? 'active' : ''}`}
              aria-pressed={searchMode === 'surah'} onClick={() => setSearchMode('surah')}>
              {sl.surahSearch}
            </button>
            <button type="button" className={`search-mode-btn press ${searchMode === 'verse' ? 'active' : ''}`}
              aria-pressed={searchMode === 'verse'} onClick={() => setSearchMode('verse')}>
              {sl.verseSearch}
            </button>
          </div>
          <div className="quran-search-bar">
            <div className="input-wrap" style={{ flex: 1 }}>
              <span className="input-icon" aria-hidden="true">🔍</span>
              {searchMode === 'surah' ? (
                <input className="input-base input-with-icon" placeholder={t.searchPh} aria-label={t.searchPh}
                  value={search} onChange={e => setSearch(e.target.value)} />
              ) : (
                <input className="input-base input-with-icon" placeholder={sl.verseSearch} aria-label={sl.verseSearch}
                  value={verseSearch} onChange={e => setVerseSearch(e.target.value)} />
              )}
            </div>
          </div>
          {searchMode === 'surah' && (
            <>
              <div className="tag-filters">
                {[
                  { key:'all',     label: t.all },
                  { key:'meccan',  label: t.meccan },
                  { key:'medinan', label: t.medinan },
                ].map(f => (
                  <button type="button" key={f.key} className={`tag-btn ${filter === f.key ? 'active' : ''}`}
                    aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
                ))}
              </div>
              {listLoading && (
                <>
                  <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>
                  <ListSkeleton label={t.loading} />
                </>
              )}
              {/* Telefonda: qruplaşdırılmış siyahı xanaları (QuranPage.css → mobil blok) */}
              <div className="surah-grid">
                {filtered.map((s,i) => {
                  const isAr = lang === 'ar'
                  const az = lang === 'az' ? SURAH_AZ[s.number] : null
                  const displayName = surahTitle(s, lang)
                  // ərəbcədə ingiliscə məna yox, "7 آيات · مكية"
                  const displayMeta = isAr
                    ? `${s.numberOfAyahs} ${t.verses} · ${revelationLabel(s.revelationType, lang)}`
                    : `${az ? az.meaning : s.englishNameTranslation} · ${s.numberOfAyahs} ${t.verses}`
                  return (
                    // --i: növbə indeksi. Kompüterdə əvvəlki kimi 20ms addım (≤400ms);
                    // telefonda ilk 8 xana 40ms aralıqla (QuranPage.css)
                    <button type="button" key={s.number} className="surah-card anim-fadeUp" style={{'--i': Math.min(i, 20)}}
                      onClick={() => openSurah(s.number)}>
                      <span className="surah-num">{s.number}</span>
                      <span className="surah-body">
                        <span className={`surah-name-en${isAr ? ' is-ar' : ''}`}>{displayName}</span>
                        <span className="surah-meta">{displayMeta}</span>
                      </span>
                      {!isAr && <span className="surah-name-ar" lang="ar">{s.name}</span>}
                    </button>
                  )
                })}
              </div>
              {!listLoading && filtered.length === 0 && (
                <div className="empty-state">
                  <span>📖</span><p>{t.noResult || 'Not found'}</p>
                </div>
              )}
            </>
          )}
          {searchMode === 'verse' && (
            <>
              {verseSearching && (
                <>
                  <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{sl.searching}</span></div>
                  <ListSkeleton label={sl.searching} />
                </>
              )}
              {!verseSearching && verseSearch.length >= 3 && verseResults.length === 0 && (
                <div className="empty-state">
                  <span>📖</span><p>{sl.noResults}</p>
                </div>
              )}
              {verseResults.length > 0 && (
                <div className="verse-results">
                  <p className="verse-results-count">{verseResults.length} {sl.result}</p>
                  {verseResults.map((v, i) => {
                    // Axtarış yalnız seçilmiş nəşrin mətnini qaytarır (tərcümə və ya
                    // ərəbcədə təfsir) — onu bir dəfə, adi yazı kimi göstəririk.
                    // Ərəb Quran xətti yalnız nəşr Quran mətninin özü olanda.
                    const isQuranText = v.edition?.type === 'quran'
                    return (
                      <button type="button" key={v.number} className="verse-result-card press" style={{'--i': Math.min(i, 7)}}
                        onClick={() => openSurah(v.surah.number)}>
                        <span className="vr-header">
                          <span className="vr-surah">
                            {surahTitle(v.surah, lang)}
                            {v.edition?.type === 'tafsir' && <span className="vr-kind">{tafsirLabel}</span>}
                          </span>
                          <span className="vr-ayah" dir="ltr">{v.surah.number}:{v.numberInSurah}</span>
                        </span>
                        <span className={isQuranText ? 'vr-arabic' : 'vr-trans'} lang={isQuranText ? 'ar' : undefined}>{v.text}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
