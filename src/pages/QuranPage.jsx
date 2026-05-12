import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import SEO, { getPageMeta } from '../components/SEO'
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
    setLoading(true); setData(null); setError(null)
    const eds = lang === 'ar' ? 'ar.alafasy,ar.muyassar' : `ar.alafasy,${edition}`
    fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/${eds}`)
      .then(r => r.json())
      .then(d => {
        const [arabic, trans] = d.data
        setData({ ...arabic, verses: arabic.ayahs.map((v,i) => ({
          n: v.numberInSurah, ar: v.text,
          audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${v.number}.mp3`,
          tr: trans?.ayahs[i]?.text || ''
        })) })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [num, lang])
  return { data, loading, error }
}

function AyahCard({ verse, showTrans, showTafsir, tafsirLabel, fontSize }) {
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
    const audio = getAudio()
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }
  return (
    <div className="ayah-card">
      <div className="ayah-num">{verse.n}</div>
      <div className="ayah-body">
        <p className="ayah-arabic" style={{ fontSize: `${fontSize}rem` }}>{verse.ar}</p>
        {showTrans && verse.tr && !showTafsir && <p className="ayah-trans">{verse.tr}</p>}
        {showTafsir && verse.tr && (
          <div className="ayah-tafsir">
            <span className="ayah-tafsir-label">{tafsirLabel}</span>
            {verse.tr}
          </div>
        )}
      </div>
      {verse.audio && (
        <button className={`ayah-play ${playing ? 'playing' : ''}`} onClick={toggle}>
          {playing ? '⏸' : '▶'}
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
      localStorage.setItem('quran_stats', JSON.stringify(next))
      return next
    })
  }
  const [search,   setSearch]   = useState('')
  const [searchMode, setSearchMode] = useState('surah')
  const [verseSearch, setVerseSearch] = useState('')
  const [verseResults, setVerseResults] = useState([])
  const [verseSearching, setVerseSearching] = useState(false)
  const verseTimerRef = useRef(null)
  const [filter,   setFilter]   = useState(t.all)
  const [showTrans, setShowTrans] = useState(true)
  const [showTafsir, setShowTafsir] = useState(false)
  const [fontSize,  setFontSize]  = useState(1.65)
  const { data: surah, loading: surahLoading, error: surahError } = useSurah(selected, lang)
  const sl = SEARCH_LABELS[lang] || SEARCH_LABELS.az

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

  const openSurah = (num, name) => {
    setSelected(num)
    if (num) {
      const bm = { surah: num, name: name || '', time: Date.now() }
      localStorage.setItem('quran_bookmark', JSON.stringify(bm))
      setBookmark(bm)
      trackRead(num)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return surahs.filter(s => {
      const matchQ = !q || s.englishName.toLowerCase().includes(q) ||
        s.name.includes(search) || String(s.number).includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q)
      const matchF = filter === t.all ||
        (filter === t.meccan && s.revelationType === 'Meccan') ||
        (filter === t.medinan && s.revelationType === 'Medinan')
      return matchQ && matchF
    })
  }, [surahs, search, filter, lang])

  if (selected && surah) {
    return (
      <div className="quran-reader">
        <div className="reader-toolbar">
          <button className="btn-ghost" onClick={() => setSelected(null)}>← {t.backBtn}</button>
          <div className="reader-controls">
            <button className="ctrl-btn" onClick={() => setFontSize(f => Math.max(f - .1, 1.2))}>A−</button>
            <button className="ctrl-btn" onClick={() => setFontSize(f => Math.min(f + .1, 2.2))}>A+</button>
            <button className={`ctrl-btn ${showTrans ? 'active' : ''}`} onClick={() => setShowTrans(s => !s)}>
              {showTrans ? t.translationLabel + ' ✓' : t.translationLabel}
            </button>
            <button className={`ctrl-btn ${showTafsir ? 'active' : ''}`} onClick={() => setShowTafsir(s => !s)}>
              {TAFSIR_LABELS[lang] || TAFSIR_LABELS.en}{showTafsir ? ' ✓' : ''}
            </button>
            <button className="ctrl-btn" disabled={selected <= 1} onClick={() => openSurah(selected - 1, surahs.find(s => s.number === selected - 1)?.englishName)}>
              {t.prevSurah}
            </button>
            <button className="ctrl-btn" disabled={selected >= 114} onClick={() => openSurah(selected + 1, surahs.find(s => s.number === selected + 1)?.englishName)}>
              {t.nextSurah}
            </button>
            <button className={`ctrl-btn ${bookmark && bookmark.surah === selected ? 'active' : ''}`}
              onClick={() => openSurah(selected, surah?.englishName || '')} title={BOOKMARK_LABELS[lang] || BOOKMARK_LABELS.en}>
              🔖
            </button>
          </div>
        </div>
        <div className="reader-header">
          <div className="reader-number">{surah.number}</div>
          <div className="reader-info">
            <h1 className="reader-arabic">{surah.name}</h1>
            <h2 className="reader-english">{surah.englishName}</h2>
            <p className="reader-meta">{surah.englishNameTranslation} · {surah.numberOfAyahs} {t.verses} · {surah.revelationType}</p>
          </div>
        </div>
        {surah.number !== 9 && (
          <div className="reader-basmalah">
            <span className="basmalah-ar">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
            <span className="basmalah-tr">{t.basmalah}</span>
          </div>
        )}
        {surahLoading && <div className="spinner-wrap"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>}
        {surahError && <div className="error-box">⚠️ {t.error}</div>}
        <div className="ayahs-list">
          {surah.verses?.map(v => <AyahCard key={v.n} verse={v} showTrans={showTrans} showTafsir={showTafsir} tafsirLabel={TAFSIR_LABELS[lang] || TAFSIR_LABELS.en} fontSize={fontSize} />)}
        </div>
      </div>
    )
  }

  const meta = getPageMeta('quran', lang)

  return (
    <>
      <SEO title={meta?.title} description={meta?.description} page="/quran" />
      <div className="page-hero theme-quran">
        <div className="page-hero-arabic">القرآن الكريم</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="quran-list-wrap section">
        <div className="section-inner">
          {bookmark && !selected && (
            <div className="quran-bookmark-card" onClick={() => openSurah(bookmark.surah, bookmark.name)}>
              <div className="bookmark-icon">🔖</div>
              <div className="bookmark-info">
                <span className="bookmark-label">{BOOKMARK_LABELS[lang] || BOOKMARK_LABELS.en}</span>
                <span className="bookmark-name">{bookmark.name}</span>
              </div>
              <span className="bookmark-arrow">&rarr;</span>
            </div>
          )}
          {!selected && stats.sessions > 0 && (
            <div className="quran-stats-bar">
              <div className="qs-item">
                <span className="qs-num">{stats.sessions}</span>
                <span className="qs-label">{lang==='az'?'Oxuma':lang==='ru'?'Чтений':lang==='tr'?'Okuma':lang==='ar'?'قراءات':'Reads'}</span>
              </div>
              <div className="qs-item">
                <span className="qs-num">{Object.keys(stats.reads).length}</span>
                <span className="qs-label">{lang==='az'?'Surə':lang==='ru'?'Сур':lang==='tr'?'Sure':lang==='ar'?'سور':'Surahs'}</span>
              </div>
              <div className="qs-item">
                <span className="qs-num">{calcStreak(stats.dates)}</span>
                <span className="qs-label">{lang==='az'?'Gün ardıcıl':lang==='ru'?'Дней подряд':lang==='tr'?'Gün seri':lang==='ar'?'أيام متتالية':'Day streak'}</span>
              </div>
              <div className="qs-item">
                <span className="qs-num">{getMostRead(stats.reads)}</span>
                <span className="qs-label">{lang==='az'?'Ən çox oxunan':lang==='ru'?'Самая читаемая':lang==='tr'?'En çok okunan':lang==='ar'?'الأكثر قراءة':'Most read'}</span>
              </div>
            </div>
          )}
          <div className="quran-search-mode">
            <button className={`search-mode-btn ${searchMode === 'surah' ? 'active' : ''}`} onClick={() => setSearchMode('surah')}>
              {sl.surahSearch}
            </button>
            <button className={`search-mode-btn ${searchMode === 'verse' ? 'active' : ''}`} onClick={() => setSearchMode('verse')}>
              {sl.verseSearch}
            </button>
          </div>
          <div className="quran-search-bar">
            <div className="input-wrap" style={{ flex: 1 }}>
              <span className="input-icon">🔍</span>
              {searchMode === 'surah' ? (
                <input className="input-base input-with-icon" placeholder={t.searchPh}
                  value={search} onChange={e => setSearch(e.target.value)} />
              ) : (
                <input className="input-base input-with-icon" placeholder={sl.verseSearch}
                  value={verseSearch} onChange={e => setVerseSearch(e.target.value)} />
              )}
            </div>
          </div>
          {searchMode === 'surah' && (
            <>
              <div className="tag-filters">
                {[t.all, t.meccan, t.medinan].map(f => (
                  <button key={f} className={`tag-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
                ))}
              </div>
              {listLoading && <div className="spinner-wrap"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>}
              <div className="surah-grid">
                {filtered.map((s,i) => (
                  <div key={s.number} className="surah-card anim-fadeUp" style={{animationDelay:`${Math.min(i*20,400)}ms`}}
                    onClick={() => openSurah(s.number, s.englishName)}>
                    <div className="surah-num">{s.number}</div>
                    <div className="surah-body">
                      <div className="surah-name-en">{s.englishName}</div>
                      <div className="surah-meta">{s.englishNameTranslation} · {s.numberOfAyahs} {t.verses}</div>
                    </div>
                    <div className="surah-name-ar">{s.name}</div>
                  </div>
                ))}
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
              {verseSearching && <div className="spinner-wrap"><div className="spinner"/><span className="spinner-text">{sl.searching}</span></div>}
              {!verseSearching && verseSearch.length >= 3 && verseResults.length === 0 && (
                <div className="empty-state">
                  <span>📖</span><p>{sl.noResults}</p>
                </div>
              )}
              {verseResults.length > 0 && (
                <div className="verse-results">
                  <p className="verse-results-count">{verseResults.length} {sl.result}</p>
                  {verseResults.map((v, i) => (
                    <div key={i} className="verse-result-card" onClick={() => openSurah(v.surah.number, v.surah.englishName)}>
                      <div className="vr-header">
                        <span className="vr-surah">{v.surah.englishName} ({v.surah.name})</span>
                        <span className="vr-ayah">{v.numberInSurah}</span>
                      </div>
                      <p className="vr-arabic">{v.text}</p>
                      {v.edition?.identifier !== 'quran-simple' && <p className="vr-trans">{v.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
