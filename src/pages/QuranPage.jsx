import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, memo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

// "Ayəyə keç" idarəsi (oxuyucunun panelində) və ayə nömrəsinin linki
const JUMP_LABELS = {
  az: { jump:'Ayəyə keç', field:'Ayənin nömrəsi', go:'Keç', pick:'Və ya siyahıdan seçin', link:'Bu ayənin linki', range: n => `1 ilə ${n} arasında rəqəm yazın` },
  en: { jump:'Go to verse', field:'Verse number', go:'Go', pick:'Or pick from the list', link:'Link to this verse', range: n => `Enter a number from 1 to ${n}` },
  ru: { jump:'Перейти к аяту', field:'Номер аята', go:'Перейти', pick:'Или выберите из списка', link:'Ссылка на этот аят', range: n => `Введите число от 1 до ${n}` },
  ar: { jump:'انتقل إلى آية', field:'رقم الآية', go:'انتقل', pick:'أو اختر من القائمة', link:'رابط هذه الآية', range: n => `أدخل رقمًا من 1 إلى ${n}` },
  tr: { jump:'Ayete git', field:'Ayet numarası', go:'Git', pick:'Ya da listeden seçin', link:'Bu ayetin bağlantısı', range: n => `1 ile ${n} arasında bir sayı yazın` },
}

// Azərbaycan dilində sıra şəkilçisi rəqəmin oxunuşuna görədir:
// 1-ci, 3-cü, 6-cı, 9-cu, 10-cu, 40-cı, 100-cü (ayə ən çox 286-dır)
const AZ_ONES = ['', 'ci', 'ci', 'cü', 'cü', 'ci', 'cı', 'ci', 'ci', 'cu']
const AZ_TENS = ['', 'cu', 'ci', 'cu', 'cı', 'ci', 'cı', 'ci', 'ci', 'cı']
function azOrdinal(n) {
  if (n % 10) return `${n}-${AZ_ONES[n % 10]}`
  if (n % 100) return `${n}-${AZ_TENS[(n % 100) / 10]}`
  return `${n}-cü`
}
// "50-ci ayə" / "verse 50" / "аят 50" / "الآية 50" / "50. ayet"
function ayahLabel(n, lang) {
  switch (lang) {
    case 'az': return `${azOrdinal(n)} ayə`
    case 'ru': return `аят ${n}`
    case 'ar': return `الآية ${n}`
    case 'tr': return `${n}. ayet`
    default:   return `verse ${n}`
  }
}
// "Bəqərə, 50-ci ayə" (ərəbcədə ərəb vergülü)
const placeLabel = (name, n, lang) => `${name}${lang === 'ar' ? '، ' : ', '}${ayahLabel(n, lang)}`
const capFirst = s => s.charAt(0).toLocaleUpperCase() + s.slice(1)

// ── Oxuma yeri (əlfəcin) ──
// Açar köhnədir: 'quran_bookmark' = { surah, name, time }. İndi ayah da
// yazılır (oxuduqca, ekranın yuxarısındakı ilk ayə). Köhnə yazıda ayah
// yoxdursa surə əvvəldən açılır — geriyə uyğundur. Mobil tətbiq eyni formadadır.
const BOOKMARK_KEY = 'quran_bookmark'
function readBookmark() {
  try {
    const bm = JSON.parse(localStorage.getItem(BOOKMARK_KEY))
    const surah = Number(bm?.surah)
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null
    const ayah = Number(bm.ayah)
    return { ...bm, surah, ayah: Number.isInteger(ayah) && ayah > 1 ? ayah : undefined }
  } catch { return null }
}
function writeBookmark(bm) {
  try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bm)) } catch { /* yaddaş bağlıdır */ }
}

// ── Ünvan: /quran?s=2&a=90 ──
// parsePath yalnız birinci seqmentə baxır — query marşrutu, canonical-ı və
// prerender-i dəyişmir. s = surə (1–114), a = ayə (≥ 1; surə yüklənəndə sıxılır).
function readQuery(search) {
  const p = new URLSearchParams(search || '')
  const s = Number(p.get('s'))
  if (!Number.isInteger(s) || s < 1 || s > 114) return { s: null, a: null }
  const a = Number(p.get('a'))
  return { s, a: Number.isInteger(a) && a >= 1 ? a : null }
}
const queryFor = (s, a) => (s ? `?s=${s}${a ? `&a=${a}` : ''}` : '')

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}
// Yazı sahəsindədirsə qısayol işləmir (Header.jsx-dəki "/" ilə eyni qayda)
const isTyping = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

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
    // Oxuyucu bağlandı — köhnə cavab qalmasın (eyni surə təkrar açılanda
    // yenisi gələnə qədər "hazır" sayılmasın)
    if (!num) { setData(null); setError(null); setLoading(false); return }
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
        setData({ ...arabic, _key: `${num}|${lang}`, verses: arabic.ayahs.map((v,i) => {
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
  // Yalnız istənilən surənin (və dilin) cavabını qaytar: oxuyucu bağlanıb eyni
  // surə yenidən açılanda köhnə cavab bir render "hazır" görünürdü — gözləyən
  // ayəyə keçid köhnə DOM-da edilib itirdi
  return { data: data && data._key === `${num}|${lang}` ? data : null, loading, error }
}

// Səs artıq səhifə səviyyəsində tək <audio>-dadır (QuranPage): əvvəl hər kartın
// öz Audio-su var idi və iki ayə eyni anda səslənə bilirdi; ayə bitəndə növbəti
// özü başlamırdı. memo: oxuduqca yer yadda saxlananda 286 kart təkrar çəkilməsin.
// flash — "Ayəyə keç"-dən sonra kartın qısa qızılı vurğusu (0 = yoxdur).
const AyahCard = memo(function AyahCard({ verse, showTrans, showTafsir, tafsirLabel, fontSize, playLabels, playing, flash, numLabel, linkLabel, onToggle, onNumber }) {
  const playLabel = playing ? playLabels.pause : playLabels.play
  return (
    // data-reveal: sürüşdükcə ayə kartı yumşaq görünür (motion.css).
    // id + data-ayah: "Ayəyə keç" hədəfi və oxuma yerinin müşahidəçisi üçün
    <div id={`ayah-${verse.n}`} data-ayah={verse.n} tabIndex={-1}
      className={`ayah-card${playing ? ' is-playing' : ''}${flash ? ' is-target' : ''}`} data-reveal="">
      {/* Qızılı halqa solur; key — eyni ayəyə təkrar keçəndə animasiya yenidən başlasın */}
      {flash ? <span key={flash} className="ayah-flash" aria-hidden="true" /> : null}
      {/* Nömrəyə klik: ünvana ?a=N yazılır (link paylaşmaq üçün) və yer yadda qalır */}
      <button type="button" className="ayah-num" onClick={() => onNumber(verse.n)}
        aria-label={`${numLabel} — ${linkLabel}`} title={linkLabel}>{verse.n}</button>
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
        <button type="button" className={`ayah-play press ${playing ? 'playing' : ''}`} onClick={() => onToggle(verse.n)}
          aria-label={playLabel} title={playLabel} aria-pressed={playing}>
          <PlayIcon playing={playing} />
        </button>
      )}
    </div>
  )
})

// ── "Ayəyə keç" paneli ──
// Rəqəm sahəsi (Enter ilə, 1…N yoxlaması) + ayə nömrələrinin şəbəkəsi
// (uzun surədə — məs. 286 ayə — barmaqla seçmək rahat olsun). Panel
// yapışqan panelin altında açılır; Esc və ya kənara klik bağlayır.
function AyahJump({ total, current, labels, onJump, onClose, inputRef, triggerRef, lang }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const panelRef = useRef(null)
  const gridRef = useRef(null)

  // Açılanda: sahəyə fokus, şəbəkədə cari ayə görünsün
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
    const grid = gridRef.current
    const cur = grid?.querySelector('[aria-current="true"]')
    if (cur) {
      const off = cur.getBoundingClientRect().top - grid.getBoundingClientRect().top + grid.scrollTop
      grid.scrollTop = off - grid.clientHeight / 2 + cur.offsetHeight / 2
    }
  }, [inputRef])

  // Kənara klik / Esc → bağla (Esc-də fokus açan düyməyə qayıdır)
  useEffect(() => {
    const onDown = e => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return
      onClose(false)
    }
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); onClose(true) } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [onClose, triggerRef])

  const submit = e => {
    e.preventDefault()
    const n = Number(String(value).trim())
    if (!Number.isInteger(n) || n < 1 || n > total) { setError(true); inputRef.current?.focus(); return }
    onJump(n)
  }
  const nums = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total])
  const hintId = 'qp-jump-hint'
  return (
    <div className="qp-jump ui-enter-drop" ref={panelRef} id="qp-jump" role="dialog" aria-label={labels.jump}>
      <form className="qp-jump__form" onSubmit={submit} noValidate>
        <label className="ui-field qp-jump__field">
          <span className="ui-field__label">{labels.field}</span>
          <span className="qp-jump__row">
            <input ref={inputRef} className="ui-input qp-jump__input" type="number" inputMode="numeric"
              min={1} max={total} step={1} dir="ltr" placeholder={current ? String(current) : '1'}
              value={value} aria-invalid={error || undefined} aria-describedby={hintId}
              onChange={e => { setValue(e.target.value); setError(false) }} />
            <span className="qp-jump__of ui-num" dir="ltr" aria-hidden="true">/ {total}</span>
          </span>
        </label>
        <button type="submit" className="ui-btn ui-btn--primary qp-jump__go">
          {labels.go}<DirArrow />
        </button>
        <span id={hintId} className={`ui-field__hint qp-jump__hint${error ? ' is-error' : ''}`} role={error ? 'alert' : undefined}>
          {labels.range(total)}
        </span>
      </form>
      <p className="qp-jump__sub">{labels.pick}</p>
      <div className="qp-jump__grid" ref={gridRef} role="group" aria-label={labels.pick}>
        {nums.map(n => (
          <button type="button" key={n} className="qp-jump__num ui-num" aria-current={n === current ? 'true' : undefined}
            aria-label={capFirst(ayahLabel(n, lang))} onClick={() => onJump(n)}>{n}</button>
        ))}
      </div>
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
  const location = useLocation()
  const routerNavigate = useNavigate()
  const [bookmark, setBookmark] = useState(readBookmark)
  // Açıq surə ünvandan gəlir (/quran?s=2&a=90) — link paylaşmaq, yeniləmək
  // və Geri düyməsi (oxuyucu → siyahı) işləsin
  const [selected, setSelected] = useState(() => readQuery(location.search).s)
  // Surə yüklənəndən sonra keçiləcək ayə (davam et, ?a=, ayə axtarışı)
  const [pendingAyah, setPendingAyah] = useState(() => readQuery(location.search).a)
  // Siyahıdakı sürüşmə yeri — oxuyucudan qayıdanda ora dönürük
  const listScrollRef = useRef(0)
  const selectedRef = useRef(selected)
  selectedRef.current = selected

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
  const jl = JUMP_LABELS[lang] || JUMP_LABELS.az

  const surahsRef = useRef(surahs)
  surahsRef.current = surahs
  const langRef = useRef(lang)
  langRef.current = lang

  // Yeri yaz: ayah verilməyibsə və eyni surədirsə köhnə ayə saxlanılır —
  // siyahıdan təsadüfən açıb çıxmaq dünənki 50-ci ayəni silməsin
  const saveBookmark = useCallback((num, ayah, { render = true } = {}) => {
    const prev = readBookmark()
    const keep = ayah === undefined && prev?.surah === num ? prev.ayah : ayah
    const s = surahsRef.current.find(x => x.number === num)
    const bm = { surah: num, ...(keep > 1 ? { ayah: keep } : {}), name: surahTitle(s, langRef.current) || prev?.name || '', time: Date.now() }
    writeBookmark(bm)
    if (render) setBookmark(bm)
  }, [])

  // Ünvanı yenilə (s, a). Siyahıdan açılış — yeni tarixçə girişi (Geri →
  // siyahı); oxuyucunun içində (növbəti surə, ayəyə keç) — replace.
  const setQuery = useCallback((s, a, { push = false } = {}) => {
    const search = queryFor(s, a)
    if (search === window.location.search) return
    routerNavigate({ pathname: window.location.pathname, search, hash: window.location.hash },
      push ? { state: { qpReader: true } } : { replace: true, state: window.history.state?.usr ?? null })
  }, [routerNavigate])

  // ── Oxuyucunun idarəsi: ayəyə keçid, oxuma yeri, səs ──
  const ready = !!(selected && surah && surah.number === selected)
  const verses = ready ? surah.verses : null
  const readerRef = useRef(null)
  const toolbarRef = useRef(null)
  const listRef = useRef(null)
  const jumpBtnRef = useRef(null)
  const jumpInputRef = useRef(null)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [flash, setFlash] = useState({ n: 0, k: 0 })
  const currentAyahRef = useRef(null)     // ekranın yuxarısındakı ilk ayə
  const jumpingRef = useRef(false)        // proqram sürüşdürür — yer yazılmır
  const armedRef = useRef(false)          // yer yalnız istifadəçi özü sürüşdürəndən sonra yazılır
  const ignoreScrollUntilRef = useRef(0)
  const userInputAtRef = useRef(0)
  const pendingSaveRef = useRef(null)
  const saveTimerRef = useRef(null)
  const lastSaveRef = useRef(0)

  // Yazma throttle: ən çox saniyədə bir dəfə, sonuncu dəyər itmir
  const flushSave = useCallback(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
    const p = pendingSaveRef.current
    if (!p) return
    pendingSaveRef.current = null
    lastSaveRef.current = Date.now()
    saveBookmark(p.s, p.n, { render: false })
  }, [saveBookmark])
  const queueSave = useCallback((n) => {
    if (!selectedRef.current) return
    pendingSaveRef.current = { s: selectedRef.current, n }
    const wait = 1000 - (Date.now() - lastSaveRef.current)
    if (wait <= 0) flushSave()
    else if (!saveTimerRef.current) saveTimerRef.current = setTimeout(flushSave, wait)
  }, [flushSave])

  // Ayəyə keç: hamar sürüşmə (hərəkət azaldılıbsa və ya yüklənmədən sonra — dərhal),
  // scroll-margin-top yapışqan panelin altında saxlayır (CSS), kart qısa vurğulanır
  const flashTimerRef = useRef(null)
  const goToAyah = useCallback((n, { smooth = true } = {}) => {
    const el = document.getElementById(`ayah-${n}`)
    if (!el) return false
    const instant = !smooth || prefersReducedMotion()
    const startedAt = performance.now()
    jumpingRef.current = true
    const end = () => {
      if (!jumpingRef.current) return
      jumpingRef.current = false
      ignoreScrollUntilRef.current = performance.now() + 150
    }
    el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' })
    el.focus({ preventScroll: true })
    if (!instant && 'onscrollend' in window) window.addEventListener('scrollend', end, { once: true })
    setTimeout(end, instant ? 120 : 1500)
    // Şriftlər (Amiri) sonra yüklənib kartları uzadırsa — istifadəçi özü
    // sürüşdürməyibsə yerini düzəlt
    if (instant && document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(() => {
        if (userInputAtRef.current < startedAt && el.isConnected) el.scrollIntoView({ block: 'start' })
      }).catch(() => {})
    }
    currentAyahRef.current = n
    saveBookmark(selectedRef.current, n, { render: false })
    setQuery(selectedRef.current, n)
    setFlash(f => {
      const k = f.k + 1
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => setFlash(x => (x.k === k ? { n: 0, k } : x)), 2600)
      return { n, k }
    })
    return true
  }, [saveBookmark, setQuery])

  // Ayə nömrəsinə klik: ünvan ?a=N olur (link paylaşmaq üçün), yer yazılır
  const onAyahNumber = useCallback((n) => {
    haptic()
    currentAyahRef.current = n
    saveBookmark(selectedRef.current, n, { render: false })
    setQuery(selectedRef.current, n)
    setFlash(f => {
      const k = f.k + 1
      clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => setFlash(x => (x.k === k ? { n: 0, k } : x)), 2600)
      return { n, k }
    })
  }, [saveBookmark, setQuery])

  // Surə yükləndi və gözləyən ayə var (davam et, ?a=, axtarış nəticəsi) — ona keç
  useEffect(() => {
    if (!ready || !pendingAyah) return
    const n = Math.min(pendingAyah, surah.numberOfAyahs || surah.verses.length)
    jumpingRef.current = true
    requestAnimationFrame(() => {
      setPendingAyah(null)
      if (!goToAyah(n, { smooth: false })) jumpingRef.current = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pendingAyah])

  // Yapışqan panelin hündürlüyü → --qp-toolbar-h (ayənin scroll-margin-top-u)
  useLayoutEffect(() => {
    const tb = toolbarRef.current
    const root = readerRef.current
    if (!tb || !root) return undefined
    const set = () => root.style.setProperty('--qp-toolbar-h', `${Math.round(tb.offsetHeight)}px`)
    set()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(set)
    ro.observe(tb)
    return () => ro.disconnect()
  }, [selected])

  // Oxuma yeri: ekranın yuxarı zolağındakı (paneldən aşağı) ilk görünən ayə
  useEffect(() => {
    if (!ready || !listRef.current || typeof IntersectionObserver === 'undefined') return undefined
    armedRef.current = false
    const vh = window.innerHeight
    const top = Math.max(0, Math.round(toolbarRef.current?.getBoundingClientRect().bottom ?? 0))
    const band = Math.max(80, Math.round((vh - top) * 0.35))
    const bottom = Math.max(0, vh - top - band)
    const visible = new Set()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const n = Number(e.target.dataset.ayah)
        if (e.isIntersecting) visible.add(n); else visible.delete(n)
      }
      if (!visible.size) return
      // Zolaqdakı ilk ayə — amma panelin altından yalnız quyruğu (< 48px)
      // görünürsə, növbətisi "cari" sayılır. Panelin yeri canlı oxunur:
      // başlıq gizlənəndə panel yuxarı qalxır
      const barBottom = toolbarRef.current?.getBoundingClientRect().bottom ?? top
      const sorted = [...visible].sort((a, b) => a - b)
      const cur = sorted.find(n => {
        const r = document.getElementById(`ayah-${n}`)?.getBoundingClientRect()
        return r && r.bottom > barBottom + 48
      }) ?? sorted[sorted.length - 1]
      currentAyahRef.current = cur
      if (armedRef.current && !jumpingRef.current) queueSave(cur)
    }, { rootMargin: `-${top}px 0px -${bottom}px 0px` })
    listRef.current.querySelectorAll('[data-ayah]').forEach(el => io.observe(el))
    const onScroll = () => {
      if (jumpingRef.current || performance.now() < ignoreScrollUntilRef.current) return
      armedRef.current = true
      if (currentAyahRef.current) queueSave(currentAyahRef.current)
    }
    // İstifadəçinin real girişi (təkər, toxunuş, klaviatura) — yazma dərhal
    // "silahlanır", proqram sürüşməsinin gözləmə pəncərəsi ləğv olunur
    const onInput = () => {
      userInputAtRef.current = performance.now()
      ignoreScrollUntilRef.current = 0
      if (!jumpingRef.current) armedRef.current = true
    }
    // Klaviaturada yalnız sürüşdürən düymələr (Tab, hərflər sayılmır)
    const onKeyScroll = (e) => {
      if (!isTyping(e.target) && /^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key)) onInput()
    }
    const onHide =() => { if (document.visibilityState !== 'visible') flushSave() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onInput, { passive: true })
    window.addEventListener('touchmove', onInput, { passive: true })
    window.addEventListener('keydown', onKeyScroll)
    window.addEventListener('pagehide', flushSave)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onInput)
      window.removeEventListener('touchmove', onInput)
      window.removeEventListener('keydown', onKeyScroll)
      window.removeEventListener('pagehide', flushSave)
      document.removeEventListener('visibilitychange', onHide)
      flushSave()
    }
  }, [ready, surah, queueSave, flushSave])

  // ── Səs: tək <audio>, ayə bitəndə növbəti başlayır ──
  const audioRef = useRef(null)
  const audioNRef = useRef(null)
  const [playingN, setPlayingN] = useState(null)
  const playingNRef = useRef(null)
  playingNRef.current = playingN
  const versesRef = useRef(null)
  versesRef.current = verses
  const playAyahRef = useRef(null)
  // Növbəti ayə ekrandan kənardadırsa ona sürüşdür (dinləyən də "oxuyur")
  const followAyah = (n) => {
    const el = document.getElementById(`ayah-${n}`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const top = toolbarRef.current?.getBoundingClientRect().bottom ?? 0
    if (r.top < top || r.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
  }
  playAyahRef.current = (n) => {
    const v = versesRef.current?.find(x => x.n === n)
    if (!v?.audio) { setPlayingN(null); return }
    let a = audioRef.current
    if (!a) { a = new Audio(); a.preload = 'auto'; audioRef.current = a }
    if (audioNRef.current !== n) { a.src = v.audio; audioNRef.current = n }
    a.onended = () => {
      const next = n + 1
      if (versesRef.current?.some(x => x.n === next)) { playAyahRef.current(next); followAyah(next) }
      else { setPlayingN(null); audioNRef.current = null }
    }
    a.onerror = () => setPlayingN(p => (p === n ? null : p))
    setPlayingN(n)
    const p = a.play()
    if (p?.catch) p.catch(err => { if (err?.name !== 'AbortError') setPlayingN(x => (x === n ? null : x)) })
  }
  const toggleAyah = useCallback((n) => {
    haptic()
    if (playingNRef.current === n) { audioRef.current?.pause(); setPlayingN(null) }
    else playAyahRef.current(n)
  }, [])
  // Surə dəyişəndə / oxuyucu bağlananda səs dayanır
  useEffect(() => () => {
    const a = audioRef.current
    if (a) { a.onended = a.onerror = null; a.pause(); a.removeAttribute('src'); try { a.load() } catch { /* köhnə brauzer */ } }
    audioRef.current = null
    audioNRef.current = null
    setPlayingN(null)
  }, [selected])

  // ── "Ayəyə keç" paneli: G qısayolu, bağlanış ──
  useEffect(() => { setJumpOpen(false) }, [selected])
  useEffect(() => {
    if (!selected) return undefined
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || isTyping(e.target)) return
      if (e.code === 'KeyG' || (e.key || '').toLowerCase() === 'g') {
        e.preventDefault()
        setJumpOpen(true)
        jumpInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])
  const closeJump = useCallback((returnFocus) => {
    setJumpOpen(false)
    if (returnFocus) jumpBtnRef.current?.focus()
  }, [])
  const onJump = useCallback((n) => {
    setJumpOpen(false)
    goToAyah(n)
  }, [goToAyah])

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

  const openSurah = (num, ayah) => {
    if (!num) return
    // Siyahıdan açılırsa yeri yadda saxla (əvvəlki/növbəti surədə yox)
    const fromList = !selected
    if (fromList) listScrollRef.current = window.scrollY
    setSelected(num)
    setPendingAyah(ayah > 1 ? ayah : null)
    saveBookmark(num, ayah > 1 ? ayah : undefined)
    trackRead(num)
    setQuery(num, ayah > 1 ? ayah : null, { push: fromList })
    // Surə əvvəldən açılır (ayə verilibsə — yüklənəndən sonra ona keçilir).
    // Bu sürüşmə "oxuma" sayılmır — yer yazılmasın
    ignoreScrollUntilRef.current = performance.now() + 500
    window.scrollTo(0, 0)
  }

  const closeReader = () => {
    // Siyahıdan açılmışdısa — tarixçədə geri (Geri düyməsi ilə eyni nəticə)
    if (location.state?.qpReader) { routerNavigate(-1); return }
    setSelected(null)
    setQuery(null, null)
  }

  // Ünvan dəyişdi (Geri/İrəli, dil dəyişimi, ilk açılış)
  const prevLangRef = useRef(lang)
  useEffect(() => {
    const { s, a } = readQuery(location.search)
    const langChanged = prevLangRef.current !== lang
    prevLangRef.current = lang
    // Dil dəyişimi (LangContext) yalnız yolu dəyişir, query-ni atır —
    // oxuyucu açıq qalsın, ünvana surə yenidən yazılsın. Surə yeni dildə
    // təzədən yüklənir — oxunan ayəyə qayıdırıq
    if (langChanged && !s && selectedRef.current) {
      const cur = currentAyahRef.current
      if (cur > 1) setPendingAyah(cur)
      setQuery(selectedRef.current, cur > 1 ? cur : null)
      return
    }
    if (s !== selectedRef.current) {
      setSelected(s)
      if (s) { setPendingAyah(a); window.scrollTo(0, 0) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, lang])

  // Birbaşa linklə açılış (/quran?s=2&a=90) — oxuma kimi sayılsın, yer yazılsın
  const deepLinkRef = useRef(false)
  useEffect(() => {
    if (deepLinkRef.current || !selected) return
    deepLinkRef.current = true
    trackRead(selected)
    saveBookmark(selected, pendingAyah || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Oxuyucu bağlandı → siyahının əvvəlki yerinə qayıt; bəlləkdəki yeri yenilə
  const wasOpenRef = useRef(!!selected)
  useEffect(() => {
    if (selected) { wasOpenRef.current = true; return }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    setBookmark(readBookmark())
    const y = listScrollRef.current
    requestAnimationFrame(() => window.scrollTo(0, y))
  }, [selected])

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
    const prevS = surahByNum(selected - 1)
    const nextS = surahByNum(selected + 1)
    const prevLabel = stripArrows(t.prevSurah)
    const nextLabel = stripArrows(t.nextSurah)
    const bmLabel = BOOKMARK_LABELS[lang] || BOOKMARK_LABELS.en
    const rawMeaning = !ready ? '' : surahMeaning(surah, lang)
    // Məna adla eynidirsə (məs. "Yasin") təkrarlamırıq
    const meaning = ready && rawMeaning !== surahTitle(surah, lang) ? rawMeaning : ''
    return (
      <div className="quran-reader" ref={readerRef}>
        <div className="reader-toolbar" ref={toolbarRef}>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm reader-back" onClick={closeReader}>
            <DirArrow back /> {stripArrows(t.backBtn)}
          </button>
          <div className="reader-controls">
            {/* Ayəyə keç (qısayol: G) — surə yüklənənə qədər söndürülür */}
            <button type="button" ref={jumpBtnRef} className={`ctrl-btn ctrl-jump ${jumpOpen ? 'active' : ''}`}
              disabled={!ready} aria-expanded={jumpOpen} aria-controls="qp-jump" aria-keyshortcuts="G"
              title={`${jl.jump} (G)`} onClick={() => { haptic(); setJumpOpen(o => !o) }}>
              <Icon name="target" size={16} /><span className="ctrl-jump__label">{jl.jump}</span>
            </button>
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
              onClick={() => { haptic(); saveBookmark(selected, currentAyahRef.current || undefined) }} title={bmLabel} aria-label={bmLabel}
              aria-pressed={!!bookmark && bookmark.surah === selected}>
              <Icon name="hifz" size={18} />
            </button>
          </div>
          {jumpOpen && ready && (
            <AyahJump total={surah.verses.length} current={currentAyahRef.current} labels={jl} lang={lang}
              onJump={onJump} onClose={closeJump} inputRef={jumpInputRef} triggerRef={jumpBtnRef} />
          )}
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
            <div className="ayahs-list" ref={listRef}>
              {surah.verses?.map(v => (
                <AyahCard key={v.n} verse={v} fontSize={fontSize} tafsirLabel={tafsirLabel} playLabels={playLabels}
                  showTrans={!hasTafsir && showTrans} showTafsir={hasTafsir && showTafsir}
                  playing={playingN === v.n} flash={flash.n === v.n ? flash.k : 0}
                  numLabel={capFirst(ayahLabel(v.n, lang))} linkLabel={jl.link}
                  onToggle={toggleAyah} onNumber={onAyahNumber} />
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

  // "Bəqərə, 50-ci ayə" — ayə yoxdursa (köhnə əlfəcin, surənin əvvəli) yalnız ad
  const bmSurah = bookmark ? surahByNum(bookmark.surah) : null
  const bmTitle = bookmark ? (surahTitle(bmSurah, lang) || bookmark.name || String(bookmark.surah)) : ''
  const bookmarkName = bookmark?.ayah ? placeLabel(bmTitle, bookmark.ayah, lang) : bmTitle
  // Surədə irəliləyiş (düymənin altındakı nazik xətt)
  const bmProgress = bookmark?.ayah && bmSurah?.numberOfAyahs ? Math.min(1, bookmark.ayah / bmSurah.numberOfAyahs) : 0
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
              {/* Klikdə surə açılır və yüklənəndən sonra dəqiq həmin ayəyə keçilir */}
              <button type="button" className="ui-btn ui-btn--primary ui-btn--lg qp-continue" onClick={() => openSurah(bookmark.surah, bookmark.ayah)}>
                <Icon name="hifz" className="ui-btn__icon" />
                <span className="qp-continue__label">{BOOKMARK_LABELS[lang] || BOOKMARK_LABELS.en}</span>
                {bookmarkName && <span className="qp-continue__name">{bookmarkName}</span>}
                <DirArrow />
                {bmProgress > 0 && <span className="qp-continue__bar" style={{ '--p': bmProgress.toFixed(3) }} aria-hidden="true" />}
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
                        onClick={() => openSurah(v.surah.number, v.numberInSurah)}>
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
