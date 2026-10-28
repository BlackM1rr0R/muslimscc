import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { SURAH_AZ, getSurahLocal } from '../data/surahNamesAz'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import '../styles/QuranPage.css'

// Hər dilin ÖZ tərcümə nəşri. Nəşr alınmasa başqa dilə (ingilis/türk)
// DÜŞMÜRÜK — dürüst xəta + "Yenidən cəhd et" göstərilir.
const EDITION_MAP = { az:'az.mammadaliyev', en:'en.asad', ru:'ru.kuliev', ar:'ar.muyassar', tr:'tr.diyanet' }

const RETRY_LABELS = {
  az: { msg:'Surə yüklənmədi. İnternet bağlantısını yoxlayın.', listMsg:'Surələrin siyahısı yüklənmədi. İnternet bağlantısını yoxlayın.', retry:'Yenidən cəhd et' },
  en: { msg:'The surah could not be loaded. Please check your connection.', listMsg:'The list of surahs could not be loaded. Please check your connection.', retry:'Try again' },
  ru: { msg:'Не удалось загрузить суру. Проверьте подключение к интернету.', listMsg:'Не удалось загрузить список сур. Проверьте подключение к интернету.', retry:'Повторить' },
  ar: { msg:'تعذّر تحميل السورة. تحقّق من الاتصال بالإنترنت.', listMsg:'تعذّر تحميل قائمة السور. تحقّق من الاتصال بالإنترنت.', retry:'أعد المحاولة' },
  tr: { msg:'Sure yüklenemedi. İnternet bağlantınızı kontrol edin.', listMsg:'Sure listesi yüklenemedi. İnternet bağlantınızı kontrol edin.', retry:'Tekrar dene' },
}

const SEARCH_LABELS = {
  az: { surahSearch: 'Surə axtar', verseSearch: 'Ayə axtar', searching: 'Axtarılır...', noResults: 'Nəticə tapılmadı', result: 'nəticə', minChars: 'Axtarmaq üçün ən azı 3 hərf yazın', mode: 'Axtarış növü', place: 'Nazil olma yeri' },
  en: { surahSearch: 'Search surahs', verseSearch: 'Search verses', searching: 'Searching...', noResults: 'No results found', result: 'results', minChars: 'Type at least 3 letters to search', mode: 'Search type', place: 'Place of revelation' },
  ru: { surahSearch: 'Поиск сур', verseSearch: 'Поиск аятов', searching: 'Поиск...', noResults: 'Ничего не найдено', result: 'результатов', minChars: 'Введите не менее 3 букв для поиска', mode: 'Тип поиска', place: 'Место ниспослания' },
  ar: { surahSearch: 'بحث السور', verseSearch: 'بحث الآيات', searching: 'جارٍ البحث...', noResults: 'لا نتائج', result: 'نتائج', minChars: 'اكتب ثلاثة أحرف على الأقل للبحث', mode: 'نوع البحث', place: 'مكان النزول' },
  tr: { surahSearch: 'Sure ara', verseSearch: 'Ayet ara', searching: 'Aranıyor...', noResults: 'Sonuç bulunamadı', result: 'sonuç', minChars: 'Aramak için en az 3 harf yazın', mode: 'Arama türü', place: 'İniş yeri' },
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

// Boş / xəta vəziyyəti — ikon kafeli + mətn (+ istəyə görə düymə).
// Əvvəl "📖" emojisi və boz mətn idi.
function QEmpty({ icon = 'quran', bad = false, children, action }) {
  return (
    <div className={`qp-empty${bad ? ' qp-empty--bad' : ''}`} role={bad ? 'alert' : 'status'}>
      <span className="ui-icon-tile ui-icon-tile--lg qp-empty__icon" aria-hidden="true"><Icon name={icon} /></span>
      <p className="qp-empty__text">{children}</p>
      {action}
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

// ── Surənin adı və mənası cari dildə ──
// az/ru/tr: yerli yazılış (surahNamesAz.js — SURAH_AZ/RU/TR); ar: API-dəki
// ərəb adı, "سُورَةُ" sözü olmadan; en: API-nin transliterasiyası və mənası.
// (Əvvəl ru/tr-də ingiliscə məna — "The Opening" — görünürdü.)
const stripSurahWord = name => String(name || '').replace(/^سُورَةُ\s+/, '')
function surahTitle(s, lang) {
  if (!s) return ''
  const local = getSurahLocal(s.number, lang)
  if (local) return local.name
  if (lang === 'ar') return stripSurahWord(s.name)
  return s.englishName
}
function surahMeaning(s, lang) {
  if (!s || lang === 'ar') return ''
  const local = getSurahLocal(s.number, lang)
  if (local) return local.meaning
  return lang === 'en' ? s.englishNameTranslation : ''
}

// i18n sətirlərində ox mətnin içindədir ("← Geri", "Növbəti →"). Oxu atıb
// ayrıca .qm-dir-arrow ilə veririk — ərəbcədə (RTL) avtomatik güzgülənir.
const stripArrows = s => String(s || '').replace(/[←→]/g, '').trim()
// Ox ikonu: irəli — ərəbcədə güzgülənir (ui-flip-rtl); geri — əksinə (.qp-arrow--back)
function DirArrow({ back = false }) {
  return <Icon name="arrow" size={16} className={back ? 'qp-arrow qp-arrow--back' : 'qp-arrow ui-flip-rtl'} />
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

function useQuranList(attempt = 0) {
  const [surahs,  setSurahs]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useEffect(() => {
    setLoading(true); setError(null)
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      // Cavab gözlənilən formada deyilsə — xəta (əvvəl surahs = undefined
      // olurdu və .filter səhifəni çökdürürdü)
      .then(d => { if (!Array.isArray(d?.data)) throw new Error('bad-response'); setSurahs(d.data) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [attempt])
  return { surahs, loading, error }
}

function useSurah(num, lang, attempt = 0) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const edition = EDITION_MAP[lang]
  useEffect(() => {
    if (!num) return
    if (!edition) { setError('no-edition'); return }
    // Tez-tez "Növbəti" basılanda köhnə cavab yenisinin üstünə yazılmasın
    let cancelled = false
    setLoading(true); setData(null); setError(null)
    const eds = lang === 'ar' ? 'ar.alafasy,ar.muyassar' : `ar.alafasy,${edition}`
    fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/${eds}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const [arabic, trans] = Array.isArray(d?.data) ? d.data : []
        // Tərcümə məhz seçilmiş dilin nəşrindən gəlməlidir; gəlmədisə xəta
        if (!arabic?.ayahs || trans?.edition?.identifier !== edition || trans.ayahs?.length !== arabic.ayahs.length) {
          throw new Error('edition-unavailable')
        }
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
  }, [num, lang, attempt])
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
  const [listAttempt, setListAttempt] = useState(0)
  const { surahs, loading: listLoading, error: listError } = useQuranList(listAttempt)
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
  const [attempt, setAttempt] = useState(0)
  const { data: surah, loading: surahLoading, error: surahError } = useSurah(selected, lang, attempt)
  const rl = RETRY_LABELS[lang] || RETRY_LABELS.az
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
      // Axtarış seçilmiş dilin nəşrində aparılır (başqa dilə düşmür)
      const edition = EDITION_MAP[lang]
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
      // Bütün yazılışlarda axtar (az/ru/tr adları, ingiliscə, ərəbcə, nömrə)
      const locals = ['az', 'ru', 'tr'].map(l => getSurahLocal(s.number, l)).filter(Boolean)
      const matchQ = !q || s.englishName.toLowerCase().includes(q) ||
        s.name.includes(search) || String(s.number).includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        locals.some(x => x.name.toLowerCase().includes(q) || x.meaning.toLowerCase().includes(q))
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
    const rawMeaning = !ready ? '' : surahMeaning(surah, lang)
    // Məna adla eynidirsə (məs. "Yasin") təkrarlamırıq
    const meaning = ready && rawMeaning !== surahTitle(surah, lang) ? rawMeaning : ''
    return (
      <div className="quran-reader">
        <div className="reader-toolbar">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm reader-back" onClick={closeReader}>
            <DirArrow back /> {stripArrows(t.backBtn)}
          </button>
          <div className="reader-controls">
            {/* dir="ltr": ərəbcədə "A−" bidi qaydası ilə "−A" kimi görünürdü.
                Həddə çatanda düymə söndürülür (əvvəl basılırdı, heç nə olmurdu) */}
            <button type="button" className="ctrl-btn" dir="ltr" aria-label={fl.smaller} title={fl.smaller}
              disabled={fontSize <= 1.21} onClick={() => setFontSize(f => Math.max(f - .1, 1.2))}>A−</button>
            <button type="button" className="ctrl-btn" dir="ltr" aria-label={fl.larger} title={fl.larger}
              disabled={fontSize >= 2.19} onClick={() => setFontSize(f => Math.min(f + .1, 2.2))}>A+</button>
            {hasTafsir ? (
              <button type="button" className={`ctrl-btn ${showTafsir ? 'active' : ''}`} aria-pressed={showTafsir}
                onClick={() => { haptic(); setShowTafsir(s => !s) }}>
                {showTafsir && <Icon name="check" size={16} className="ctrl-check" />}{tafsirLabel}
              </button>
            ) : (
              <button type="button" className={`ctrl-btn ${showTrans ? 'active' : ''}`} aria-pressed={showTrans}
                onClick={() => { haptic(); setShowTrans(s => !s) }}>
                {showTrans && <Icon name="check" size={16} className="ctrl-check" />}{t.translationLabel}
              </button>
            )}
            <button type="button" className="ctrl-btn ctrl-nav" disabled={selected <= 1}
              aria-label={prevLabel} title={prevLabel} onClick={() => openSurah(selected - 1)}>
              <DirArrow back /><span className="ctrl-label">{prevLabel}</span>
            </button>
            <button type="button" className="ctrl-btn ctrl-nav" disabled={selected >= 114}
              aria-label={nextLabel} title={nextLabel} onClick={() => openSurah(selected + 1)}>
              <span className="ctrl-label">{nextLabel}</span><DirArrow />
            </button>
            {/* Əlfəcin — "hifz" ikonundakı lent (Icon.jsx-də ayrıca əlfəcin ikonu yoxdur) */}
            <button type="button" className={`ctrl-btn ctrl-bookmark ${bookmark && bookmark.surah === selected ? 'active' : ''}`}
              onClick={() => { haptic(); saveBookmark(selected) }} title={bmLabel} aria-label={bmLabel}
              aria-pressed={!!bookmark && bookmark.surah === selected}>
              <Icon name="hifz" size={18} />
            </button>
          </div>
        </div>
        {surahError && (
          <QEmpty icon="alert" bad action={
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(a => a + 1)}>
              <Icon name="refresh" className="ui-btn__icon" />{rl.retry}
            </button>
          }>{rl.msg}</QEmpty>
        )}
        {!ready && !surahError && (
          <>
            <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>
            <ReaderSkeleton label={t.loading} />
          </>
        )}
        {ready && (
          <>
            <div className="reader-header" data-reveal="scale">
              <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
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
              <div className="reader-basmalah" data-reveal="fade">
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
                <button type="button" className="reader-pager-btn prev" onClick={() => openSurah(selected - 1)}>
                  <span className="reader-pager-dir"><DirArrow back /> {prevLabel}</span>
                  <span className="reader-pager-name">{surahTitle(prevS, lang) || selected - 1}</span>
                </button>
              )}
              {selected < 114 && (
                <button type="button" className="reader-pager-btn next" onClick={() => openSurah(selected + 1)}>
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
      {/* Sakit kağız hero (dizayn v2): naxış + eyebrow + bir h1 + lead.
          "Oxumağa davam et" əvvəl ayrıca kart idi — indi hero-nun əsas düyməsidir */}
      <header className="ui-page-hero qp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        {/* Dekorativ xəttatlıq (ərəbcədə başlığın özüdür — təkrarlanmır) */}
        {lang !== 'ar' && <span className="qp-hero__art" lang="ar" aria-hidden="true">القرآن الكريم</span>}
        <div className="ui-container">
          <span className="ui-eyebrow">{navGroupLabel('quran', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.subtitle}</p>
          {bookmark && (
            <div className="ui-page-hero__actions">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--lg qp-continue" onClick={() => openSurah(bookmark.surah)}>
                <Icon name="hifz" className="ui-btn__icon" />
                <span className="qp-continue__label">{BOOKMARK_LABELS[lang] || BOOKMARK_LABELS.en}</span>
                {bookmarkName && <span className="qp-continue__name">{bookmarkName}</span>}
                <DirArrow />
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="quran-list-wrap section">
        <div className="section-inner">
          {stats.sessions > 0 && (
            <div className="quran-stats-bar" data-reveal="stagger">
              <div className="qs-item">
                <span className="qs-num" data-count={stats.sessions}>{stats.sessions}</span>
                <span className="qs-label">{st.reads}</span>
              </div>
              <div className="qs-item">
                <span className="qs-num" data-count={Object.keys(stats.reads).length}>{Object.keys(stats.reads).length}</span>
                <span className="qs-label">{st.surahs}</span>
              </div>
              <div className="qs-item">
                <span className="qs-num" data-count={calcStreak(stats.dates)}>{calcStreak(stats.dates)}</span>
                <span className="qs-label">{st.streak}</span>
              </div>
              <div className="qs-item qs-item--name">
                <span className="qs-num qs-name">{mostReadName}</span>
                <span className="qs-label">{st.most}</span>
              </div>
            </div>
          )}
          {/* Axtarış paneli: seqment (surə / ayə) + sahə. Seqmentdə ağ "hap"
              aktiv seçimə sürüşür (data-active) — bütün ekranlarda */}
          <div className="qp-toolbar" data-reveal="">
            <div className="quran-search-mode" role="group" aria-label={sl.mode} data-active={searchMode}>
              <button type="button" className={`search-mode-btn ${searchMode === 'surah' ? 'active' : ''}`}
                aria-pressed={searchMode === 'surah'} onClick={() => setSearchMode('surah')}>
                {sl.surahSearch}
              </button>
              <button type="button" className={`search-mode-btn ${searchMode === 'verse' ? 'active' : ''}`}
                aria-pressed={searchMode === 'verse'} onClick={() => setSearchMode('verse')}>
                {sl.verseSearch}
              </button>
            </div>
            <div className="quran-search-bar">
              <Icon name="search" size={18} className="qp-search-icon" />
              {searchMode === 'surah' ? (
                <input type="search" className="ui-input qp-search-input" placeholder={t.searchPh} aria-label={t.searchPh}
                  value={search} onChange={e => setSearch(e.target.value)} />
              ) : (
                <input type="search" className="ui-input qp-search-input" placeholder={sl.verseSearch} aria-label={sl.verseSearch}
                  value={verseSearch} onChange={e => setVerseSearch(e.target.value)} />
              )}
            </div>
          </div>
          {searchMode === 'surah' && (
            <>
              <div className="qp-filters" data-reveal="fade">
                <div className="qp-chips" role="group" aria-label={sl.place}>
                  {[
                    { key:'all',     label: t.all },
                    { key:'meccan',  label: t.meccan },
                    { key:'medinan', label: t.medinan },
                  ].map(f => (
                    <button type="button" key={f.key} className="ui-chip"
                      aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
                  ))}
                </div>
                {!listLoading && !listError && (
                  <span className="qp-count ui-num" aria-live="polite">
                    {filtered.length} {String(st.surahs).toLocaleLowerCase(lang)}
                  </span>
                )}
              </div>
              {listLoading && (
                <>
                  <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{t.loading}</span></div>
                  <ListSkeleton label={t.loading} />
                </>
              )}
              {!listLoading && listError && (
                <QEmpty icon="alert" bad action={
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setListAttempt(a => a + 1)}>
                    <Icon name="refresh" className="ui-btn__icon" />{rl.retry}
                  </button>
                }>{rl.listMsg}</QEmpty>
              )}
              {/* Kart şəbəkəsi (telefonda qruplaşdırılmış siyahı). data-reveal="stagger":
                  ilk kartlar növbə ilə qalxır; süzgəcdən sonra yeni kartlar da */}
              <div className="surah-grid" data-reveal="stagger">
                {filtered.map((s) => {
                  const isAr = lang === 'ar'
                  const displayName = surahTitle(s, lang)
                  // ərəbcədə ingiliscə məna yox, "7 آيات · مكية"
                  const displayMeta = isAr
                    ? `${s.numberOfAyahs} ${t.verses} · ${revelationLabel(s.revelationType, lang)}`
                    : [surahMeaning(s, lang), `${s.numberOfAyahs} ${t.verses}`].filter(Boolean).join(' · ')
                  return (
                    <button type="button" key={s.number} className="surah-card"
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
              {/* Əvvəl t.noResult quran bölməsində yox idi — bütün dillərdə "Not found" görünürdü */}
              {!listLoading && !listError && filtered.length === 0 && (
                <QEmpty icon="search">{sl.noResults}</QEmpty>
              )}
            </>
          )}
          {searchMode === 'verse' && (
            <>
              {/* Hələ 3 hərf yazılmayıb — boş ekran əvəzinə ipucu */}
              {verseSearch.length < 3 && (
                <QEmpty icon="search">{sl.minChars}</QEmpty>
              )}
              {verseSearching && (
                <>
                  <div className="spinner-wrap q-spinner"><div className="spinner"/><span className="spinner-text">{sl.searching}</span></div>
                  <ListSkeleton label={sl.searching} />
                </>
              )}
              {!verseSearching && verseSearch.length >= 3 && verseResults.length === 0 && (
                <QEmpty icon="search">{sl.noResults}</QEmpty>
              )}
              {!verseSearching && verseResults.length > 0 && (
                <div className="verse-results">
                  <p className="verse-results-count ui-num">{verseResults.length} {sl.result}</p>
                  {verseResults.map((v, i) => {
                    // Axtarış yalnız seçilmiş nəşrin mətnini qaytarır (tərcümə və ya
                    // ərəbcədə təfsir) — onu bir dəfə, adi yazı kimi göstəririk.
                    // Ərəb Quran xətti yalnız nəşr Quran mətninin özü olanda.
                    const isQuranText = v.edition?.type === 'quran'
                    return (
                      <button type="button" key={v.number} className="verse-result-card" style={{'--i': Math.min(i, 7)}}
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
