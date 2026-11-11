// ═══════════════════════════════════════════════════════
// /quotes — İslami sitat kartı generatoru (dizayn v2, 2026-10 yenidən qurulub)
//
// Sahibin şikayəti: "Telefonda nə düzəltdiyimi görə bilmirəm, hər dəfə
// yuxarı qalxıb baxmalıyam." Həll:
//  • Telefonda (<1024px) önizləmə ekranın yuxarısında YAPIŞQANDIR (~40%),
//    altında bölmə sekmələri (Mətn · Şablon · Ölçü · Üslub) də yapışqandır,
//    düymələr (Paylaş · Yüklə · Kopyala) aşağıda yapışqan zolaqdadır —
//    hansı idarəni dəyişsən, nəticə həmişə görünür.
//  • Masaüstündə iki sütun: solda yapışqan önizləmə, sağda idarələr.
//  • Önizləmə və PNG eyni kanvas funksiyası ilə çəkilir (utils/quoteCard).
//
// Məzmun: quotes.js + admin sitatları, ayə (alquran.cloud), hədis
// (utils/hadithData), istifadəçinin öz mətni. ShareCardButton başqa
// səhifələrdən ?ayah= / ?hadith= / ?text=&src= ilə bura gətirir.
//
// Hərəkətli kart və video (utils/quoteMotion): önizləmə susmaya görə
// hərəkətlidir ("hərəkəti azalt" ayarında — statik). "Video" düyməsi eyni
// animasiyanı MP4/WebM kimi yazır; ayə seçilibsə qiraət səsi ilə.
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { BRAND } from '../config/brand'
import { QUOTES as STATIC_QUOTES } from '../data/quotes'
import { subscribeToQuotes } from '../data/adminContent'
import { pickLang } from '../utils/pickLang'
import { dedupeList, hadithKeys } from '../utils/uniqueHadiths'
import { loadHadithData } from '../utils/hadithData'
import {
  TEMPLATES, FORMATS, DEFAULT_STYLE, templateById, formatById, mostlyArabic,
  renderPng, saveBlob, preopenWindow, canShareFile,
} from '../utils/quoteCard'
import { videoSupported, recordVideo, recitationUrl, createAudioContext } from '../utils/quoteMotion'
import { LABELS, TEMPLATE_NAMES } from '../components/quote/labels'
import { refLabel, fetchAyah, readParams, parseAyahRef } from '../components/quote/content'
import QuotePreview from '../components/quote/QuotePreview'
import TemplatePicker from '../components/quote/TemplatePicker'
import SourcePanel from '../components/quote/SourcePanel'
import { FormatPicker, StylePanel } from '../components/quote/StylePanel'
import { m } from 'motion/react'
import LayoutFeatures from '../motion/LayoutFeatures'
import { SPRING } from '../motion/presets'
import DeferRender from '../components/DeferRender'
// v5.9: İslam həndəsi naxışı — divar kağızı (bölməyə yaxınlaşanda)
const PatternStudio = lazy(() => import('../components/quote/PatternStudio'))
const CalligraphyComposer = lazy(() => import('../components/quote/CalligraphyComposer'))
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import '../styles/QuoteGeneratorPage.css'
import { pickUi } from '../utils/uiText'

// Sitatın tərcüməsi YALNIZ cari dildə. Ərəbcədə orijinal mətn onsuz da
// göstərilir — tərcümə sətri yoxdur.
const translationOf = (q, lang) => (lang === 'ar' ? '' : pickLang(q?.text, lang))

// ── Dizayn v3: studiyanın altında "necə işləyir" bələdçisi (yeni gələn üçün) ──
// Addım başlıqları sekmə adlarıdır (labels.js) — eyni sözlər, iki yerdə fərqli ad yox.
// Domen adı dil kontekstindən kənarda (hər dildə eyni yazılır)
const AQC = 'alquran.cloud'
const GUIDE = {
  az: { ey: 'Necə işləyir', title: 'Kart 4 addımda', lead: 'Mətni seçin, görünüşünü dəyişin və paylaşın — hamısı brauzerdə, qeydiyyatsız.',
    steps: ['Hazır sitatlar, Quran ayəsi (surə:ayə), hədis bazası və ya öz mətniniz.', 'Rəng və naxış şablonu — önizləmə dərhal dəyişir.', 'Kvadrat, hekayə və digər ölçülər — sosial şəbəkəyə uyğun.', 'Şrift ölçüsü, künclər və fonun şəffaflığı.'],
    share: 'Paylaşın', shareText: 'Şəkil kimi yükləyin, paylaşın və ya mətni kopyalayın.',
    note: `Ayələr ${AQC}-dan (Osmani yazısı və tərcümə), hədislər saytın hədis bazasından mənbəsi ilə gəlir. Öz mətninizi paylaşanda mənbəni düzgün yazın.`,
    rel: 'Mətn tapmaq üçün', quran: 'Qurani-Kərim', hadith: 'Hədislər', duas: 'Dualar' },
  en: { ey: 'How it works', title: 'A card in 4 steps', lead: 'Pick the text, change the look and share — all in the browser, no sign-up.',
    steps: ['Ready quotes, a Quran verse (surah:ayah), the hadith collection or your own text.', 'A colour and pattern template — the preview changes at once.', 'Square, story and other sizes — to fit each social network.', 'Font size, corners and background opacity.'],
    share: 'Share', shareText: 'Download it as an image, share it or copy the text.',
    note: `Verses come from ${AQC} (Uthmani script and translation); hadiths come from the site’s hadith collection with their source. When sharing your own text, cite its source correctly.`,
    rel: 'Find a text', quran: 'The Quran', hadith: 'Hadith', duas: 'Duas' },
  ru: { ey: 'Как это работает', title: 'Карточка за 4 шага', lead: 'Выберите текст, измените вид и поделитесь — всё в браузере, без регистрации.',
    steps: ['Готовые цитаты, аят Корана (сура:аят), сборник хадисов или ваш текст.', 'Шаблон цвета и узора — превью меняется сразу.', 'Квадрат, сторис и другие размеры — под каждую соцсеть.', 'Размер шрифта, углы и прозрачность фона.'],
    share: 'Поделитесь', shareText: 'Скачайте как изображение, поделитесь или скопируйте текст.',
    note: `Аяты загружаются с ${AQC} (османский шрифт и перевод), хадисы — из сборника сайта вместе с источником. Делясь своим текстом, указывайте источник правильно.`,
    rel: 'Где найти текст', quran: 'Коран', hadith: 'Хадисы', duas: 'Дуа' },
  ar: { ey: 'طريقة الاستخدام', title: 'بطاقة في ٤ خطوات', lead: 'اختر النص وغيّر المظهر ثم شارك — كل ذلك في المتصفح دون تسجيل.',
    steps: ['اقتباسات جاهزة، أو آية (السورة:الآية)، أو حديث من المجموعة، أو نصك الخاص.', 'قالب اللون والزخرفة، وتتغير المعاينة فورًا.', 'مربع وقصة ومقاسات أخرى تناسب كل منصة.', 'حجم الخط والزوايا وشفافية الخلفية.'],
    share: 'شارك', shareText: 'نزّلها صورة أو شاركها أو انسخ النص.',
    note: `تُجلب الآيات من ${AQC} (بالرسم العثماني مع الترجمة)، والأحاديث من مجموعة الموقع مع مصدرها. وإذا شاركت نصك فاذكر مصدره بدقة.`,
    rel: 'للعثور على نص', quran: 'القرآن الكريم', hadith: 'الأحاديث', duas: 'الأدعية' },
  tr: { ey: 'Nasıl çalışır', title: '4 adımda kart', lead: 'Metni seçin, görünümü değiştirin ve paylaşın — hepsi tarayıcıda, kayıtsız.',
    steps: ['Hazır alıntılar, Kur’an ayeti (sure:ayet), hadis koleksiyonu ya da kendi metniniz.', 'Renk ve desen şablonu — önizleme hemen değişir.', 'Kare, hikâye ve diğer boyutlar — her sosyal ağa uygun.', 'Yazı boyutu, köşeler ve arka plan saydamlığı.'],
    share: 'Paylaşın', shareText: 'Görsel olarak indirin, paylaşın veya metni kopyalayın.',
    note: `Ayetler ${AQC}’dan (Osmanlı hattı ve meal), hadisler sitenin hadis koleksiyonundan kaynağıyla gelir. Kendi metninizi paylaşırken kaynağını doğru yazın.`,
    rel: 'Metin bulmak için', quran: 'Kur’an-ı Kerim', hadith: 'Hadisler', duas: 'Dualar' },
}

const KIND_BY_CAT = { quran: 'kindVerse', hadith: 'kindHadith', dua: 'kindDua', wisdom: 'kindWisdom' }
const TABS = [
  { id: 'content', icon: 'type', label: 'tabContent' },
  { id: 'template', icon: 'image', label: 'tabTemplate' },
  { id: 'format', icon: 'ruler', label: 'tabFormat' },
  { id: 'style', icon: 'palette', label: 'tabStyle' },
]

// Seçilmiş şablon / ölçü / üslub yadda qalır (növbəti açılışda eyni görünüş)
const PREFS_KEY = 'qm_qcard_prefs'
function readPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null') || {}
    return {
      tpl: TEMPLATES.some(x => x.id === p.tpl) ? p.tpl : 'emerald',
      fmt: FORMATS.some(x => x.id === p.fmt) ? p.fmt : 'square',
      style: { ...DEFAULT_STYLE, ...(p.style && typeof p.style === 'object' ? p.style : {}) },
    }
  } catch {
    return { tpl: 'emerald', fmt: 'square', style: { ...DEFAULT_STYLE } }
  }
}

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { /* aşağıdakı ehtiyat yol */ }
  // Clipboard API bağlıdırsa (http, iframe, köhnə brauzer) — gizli textarea ilə
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch { return false }
}

/* ══════════════════════════════════════════════════════ */
export default function QuoteGeneratorPage() {
  const { lang } = useLang()
  const t = pickUi(LABELS, lang)
  const g = pickUi(GUIDE, lang, 'en')
  const location = useLocation()
  const navigate = useNavigate()
  // URL parametrləri yalnız ilk açılışda oxunur
  const [initial] = useState(() => readParams(location.search))
  const [prefs] = useState(readPrefs)

  const [tplId, setTplId] = useState(() => (TEMPLATES.some(x => x.id === initial.tpl) ? initial.tpl : prefs.tpl))
  const [fmtId, setFmtId] = useState(() => (FORMATS.some(x => x.id === initial.fmt) ? initial.fmt : prefs.fmt))
  const [style, setStyle] = useState(prefs.style)
  const [tab, setTab] = useState('content')
  const [source, setSource] = useState(() => (
    initial.ayah ? 'ayah' : initial.hadith != null ? 'hadith' : (initial.text || initial.ar) ? 'custom' : 'library'
  ))
  const [animKey, setAnimKey] = useState(0)
  const bump = () => setAnimKey(k => k + 1)

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ tpl: tplId, fmt: fmtId, style })) } catch { /* yaddaş bağlıdır */ }
  }, [tplId, fmtId, style])

  /* ── 1. Sitatlar kitabxanası (quotes.js + admin Firebase) ── */
  const [customQuotes, setCustomQuotes] = useState([])
  useEffect(() => {
    const unsubscribe = subscribeToQuotes((items) => {
      setCustomQuotes(items.map(q => ({
        ar: q.ar || '',
        text: q.text || { en: '', az: '', ru: '', ar: '', tr: '' },
        source: q.source || '',
        cat: q.category || 'wisdom',
        _custom: true,
      })))
    })
    return () => unsubscribe?.()
  }, [])
  // Admin paneli yerli sitatları Firebase-ə köçürə bilir — surətlər bir dəfə sayılsın
  const QUOTES = useMemo(
    () => dedupeList([...customQuotes, ...STATIC_QUOTES], q => hadithKeys(q.ar, q.text?.az, q.source), { idOf: q => q }).items
      // Cari dildə mətni olmayan admin sitatı bu dildə göstərilmir (ərəbcədə — orijinal varsa)
      .filter(q => (lang === 'ar' ? q.ar : pickLang(q.text, lang, { warn: false }))),
    [customQuotes, lang],
  )
  const [category, setCategory] = useState('all')
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * STATIC_QUOTES.length))
  const pool = useMemo(() => (category === 'all' ? QUOTES : QUOTES.filter(q => q.cat === category)), [QUOTES, category])
  const poolIdx = pool.length ? ((quoteIdx % pool.length) + pool.length) % pool.length : 0
  const quote = pool[poolIdx] || QUOTES[0]

  const shuffle = useCallback(() => {
    setQuoteIdx(i => {
      if (pool.length < 2) return i
      let n
      do { n = Math.floor(Math.random() * pool.length) } while (n === ((i % pool.length) + pool.length) % pool.length)
      return n
    })
    setSource('library')
    bump()
  }, [pool.length])
  const step = useCallback((d) => { setQuoteIdx(i => i + d); setSource('library'); bump() }, [])
  const changeCategory = useCallback((cat) => {
    setCategory(cat)
    const n = cat === 'all' ? QUOTES.length : QUOTES.filter(q => q.cat === cat).length
    setQuoteIdx(Math.floor(Math.random() * Math.max(1, n)))
    bump()
  }, [QUOTES])

  /* ── 2. Ayə (alquran.cloud) ── */
  const [ayahForm, setAyahForm] = useState(() => (initial.ayah ? { s: String(initial.ayah.s), a: String(initial.ayah.a) } : { s: '2', a: '255' }))
  const [ayahReq, setAyahReq] = useState(() => (initial.ayah ? { ref: `${initial.ayah.s}:${initial.ayah.a}`, n: 0 } : null))
  const [ayahState, setAyahState] = useState({ status: 'idle', data: null, ref: '' })
  useEffect(() => {
    if (!ayahReq) return undefined
    const [s, a] = ayahReq.ref.split(':').map(Number)
    const ctrl = new AbortController()
    setAyahState(st => ({ ...st, status: 'loading' }))
    fetchAyah(s, a, lang, ctrl.signal)
      .then(data => { if (!ctrl.signal.aborted) { setAyahState({ status: 'ok', data, ref: ayahReq.ref }); bump() } })
      .catch(() => { if (!ctrl.signal.aborted) setAyahState(st => ({ ...st, status: 'error' })) })
    return () => ctrl.abort()
  }, [ayahReq, lang])
  const submitAyah = useCallback((override) => {
    const form = override || ayahForm
    if (override) setAyahForm({ s: String(override.s), a: String(override.a) })
    const p = parseAyahRef(`${form.s}:${form.a}`)
    if (!p) { setAyahState(st => ({ ...st, status: 'error' })); return }
    setAyahReq(r => ({ ref: `${p.s}:${p.a}`, n: (r?.n || 0) + 1 }))
  }, [ayahForm])

  /* ── 3. Hədis (layihənin hədis bazası, cari dil) ── */
  const [hadithData, setHadithData] = useState(null)
  const [hadithId, setHadithId] = useState(initial.hadith)
  const needHadith = source === 'hadith'
  useEffect(() => {
    if (!needHadith) return undefined
    let alive = true
    loadHadithData(lang).then(d => {
      if (!alive) return
      setHadithData(d)
      setHadithId(id => {
        const real = id != null ? (d.aliases.get(id) ?? id) : null
        if (real != null && d.list.some(h => h.id === real)) return real
        return d.list[Math.floor(Math.random() * d.list.length)]?.id ?? null
      })
    }).catch(() => { /* şəbəkə: siyahı boş qalır, istifadəçi təkrar seçə bilər */ })
    return () => { alive = false }
  }, [needHadith, lang])
  const hadith = useMemo(() => hadithData?.list.find(h => h.id === hadithId) || null, [hadithData, hadithId])
  const pickHadith = useCallback((h) => { setHadithId(h.id); bump() }, [])
  const randomHadith = useCallback(() => {
    const list = hadithData?.list
    if (list?.length) { setHadithId(list[Math.floor(Math.random() * list.length)].id); bump() }
  }, [hadithData])

  /* ── 4. Öz mətnim ── */
  const [custom, setCustom] = useState(() => ({ text: initial.text, ar: initial.ar, src: initial.src }))

  /* ── Kartın məzmunu ── */
  const lastContent = useRef(null)
  const content = useMemo(() => {
    let c = null
    if (source === 'library' && quote) {
      c = { ar: quote.ar || '', text: translationOf(quote, lang), ref: refLabel(quote.source, lang), kicker: t[KIND_BY_CAT[quote.cat]] || '' }
    } else if (source === 'ayah' && ayahState.data) {
      c = { ar: ayahState.data.ar, text: lang === 'ar' ? '' : ayahState.data.text, ref: ayahState.data.ref, kicker: t.kindVerse }
    } else if (source === 'hadith' && hadith) {
      c = { ar: hadith.ar || '', text: lang === 'ar' ? '' : (hadith.text || ''), ref: refLabel(hadith.source, lang), kicker: t.kindHadith }
      if (c.text === c.ar) c.text = ''
    } else if (source === 'custom') {
      const txt = String(custom.text || '').trim()
      const ar = String(custom.ar || '').trim()
      if (!txt && !ar) return { ar: '', text: t.emptyCard, ref: '', kicker: '', empty: true }
      // Öz mətn: mənbə yazılmayıbsa istinad və "Ayə/Hədis" etiketi çəkilmir
      c = mostlyArabic(txt) && !ar ? { ar: txt, text: '' } : { ar, text: txt }
      c.ref = String(custom.src || '').trim()
      c.kicker = ''
    }
    if (c) { lastContent.current = c; return c }
    // Ayə/hədis hələ yüklənir — əvvəlki kart qalır
    return lastContent.current || { ar: '', text: '', ref: '', kicker: '' }
  }, [source, quote, ayahState.data, hadith, custom, lang, t])

  const template = templateById(tplId)
  const format = formatById(fmtId)
  const card = useMemo(() => ({
    template, style, lang,
    ar: content.ar, text: content.text, ref: content.ref, kicker: content.kicker,
    watermark: BRAND.domain,
  }), [template, style, lang, content])

  // Miniatürlər üçün şablonsuz kart: şablon dəyişəndə 24 miniatür yenidən çəkilməsin
  const thumbCard = useMemo(() => ({
    style, lang, ar: content.ar, text: content.text, ref: content.ref, kicker: content.kicker, watermark: BRAND.domain,
  }), [style, lang, content])

  /* ── Hərəkət və video ── */
  const [motion, setMotion] = useState(() => !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
  const [canVideo] = useState(() => (typeof window !== 'undefined' ? videoSupported() : false))
  const [withAudio, setWithAudio] = useState(true)
  // video: null | { status: 'audio' | 'rec' | 'ready' | 'error', t, total, file, url, noAudio, msg }
  const [video, setVideo] = useState(null)
  const [recAudioDur, setRecAudioDur] = useState(0)
  const recClock = useRef(null)
  const recAbort = useRef(null)
  const recUrl = useRef('')
  const recording = video?.status === 'audio' || video?.status === 'rec'
  const ayahRecitable = source === 'ayah' && ayahState.status === 'ok' && Boolean(ayahState.ref)
  useEffect(() => () => { recAbort.current?.abort(); if (recUrl.current) URL.revokeObjectURL(recUrl.current) }, [])

  const [overflow, setOverflow] = useState(false)
  const onOverflow = useCallback((v) => setOverflow(Boolean(v)), [])

  /* ── Paylaşma / yükləmə ── */
  const [busy, setBusy] = useState('')         // '' | 'share' | 'download'
  const [flash, setFlash] = useState('')       // 'copied' | 'downloaded' | 'tab'
  const flashTimer = useRef(0)
  const showFlash = (k, ms = 2200) => {
    setFlash(k)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(''), ms)
  }
  useEffect(() => () => clearTimeout(flashTimer.current), [])

  const fileName = `muslims-cc-${source === 'custom' ? 'card' : source === 'library' ? (quote?.cat || 'quote') : source}-${format.id}.png`
  // Şəkil/video yalnız FAYL kimi paylaşılır: mətn və başlıq əlavə olunmur — WhatsApp statusunda
  // şəklin altına "— ayə · muslims.cc" yazısı düşməsin (brend şəklin özündədir)

  // Telefonda paylaşma üçün fayl əvvəlcədən hazırlanır: Safari navigator.share()
  // çağırışını yalnız klikdən dərhal sonra qəbul edir — klikdən sonra uzun
  // çəkiliş "istifadəçi jesti"ni itirə bilər.
  const prepared = useRef({ card: null, format: null, file: null })
  useEffect(() => {
    if (content.empty || typeof navigator === 'undefined' || !navigator.canShare) return undefined
    // Yalnız toxunma ekranında (telefon/planşet) — masaüstündə hər dəyişiklikdə PNG çəkmək lazımsızdır
    if (!window.matchMedia?.('(pointer: coarse)').matches) return undefined
    const id = setTimeout(() => {
      renderPng(card, format).then(blob => {
        prepared.current = { card, format, file: new File([blob], fileName, { type: 'image/png' }) }
      }).catch(() => { /* klikdə yenidən cəhd olunacaq */ })
    }, 500)
    return () => clearTimeout(id)
  }, [card, format, fileName, content.empty])

  const makeFile = async () => {
    const p = prepared.current
    if (p.file && p.card === card && p.format === format) return p.file
    const blob = await renderPng(card, format)
    return new File([blob], fileName, { type: 'image/png' })
  }

  const download = async () => {
    if (busy || content.empty) return
    const win = preopenWindow()
    setBusy('download')
    try {
      const file = await makeFile()
      const how = saveBlob(file, fileName, win)
      showFlash(how === 'tab' ? 'tab' : 'downloaded', how === 'tab' ? 6000 : 2200)
    } catch {
      win?.close()
    } finally {
      setBusy('')
    }
  }

  const share = async () => {
    if (busy || content.empty) return
    setBusy('share')
    try {
      const file = await makeFile()
      if (canShareFile(file)) {
        try {
          await navigator.share({ files: [file] })
        } catch (e) {
          // İstifadəçi pəncərəni bağladı — heç nə etmə; başqa xəta — faylı yüklə
          if (e?.name !== 'AbortError') showFlash(saveBlob(file, fileName) === 'tab' ? 'tab' : 'downloaded')
        }
      } else {
        // Brauzer faylla paylaşmanı dəstəkləmir — şəkil yüklənir
        const how = saveBlob(file, fileName)
        showFlash(how === 'tab' ? 'tab' : 'downloaded', how === 'tab' ? 6000 : 2200)
      }
    } catch { /* çəkiliş alınmadı */ } finally {
      setBusy('')
    }
  }

  const closeVideo = () => {
    recAbort.current?.abort()
    if (recUrl.current) { URL.revokeObjectURL(recUrl.current); recUrl.current = '' }
    recClock.current = null
    setRecAudioDur(0)
    setVideo(null)
  }

  const makeVideo = async () => {
    if (busy || recording || content.empty) return
    if (!canVideo) { setVideo({ status: 'error', msg: t.videoUnsupported }); return }
    const useAudio = ayahRecitable && withAudio
    // AudioContext klikdə DƏRHAL yaradılır — sonra (await-dən sonra) brauzer səsi bloklayır
    const actx = useAudio ? createAudioContext() : null
    const ctrl = new AbortController()
    recAbort.current = ctrl
    if (recUrl.current) { URL.revokeObjectURL(recUrl.current); recUrl.current = '' }
    setVideo({ status: useAudio ? 'audio' : 'rec', t: 0, total: 0 })
    let last = 0
    try {
      const [s, a] = useAudio ? ayahState.ref.split(':') : []
      const r = await recordVideo(card, format, {
        audioUrl: useAudio ? recitationUrl(s, a) : '',
        actx,
        signal: ctrl.signal,
        onStart: ({ total, audioDur }) => {
          recClock.current = 0
          setRecAudioDur(audioDur)
          setVideo({ status: 'rec', t: 0, total })
        },
        onProgress: (sec, total) => {
          recClock.current = sec
          // Vəziyyət saniyədə ~5 dəfə yenilənir (hər kadrda yox)
          if (sec - last > 0.2) { last = sec; setVideo(v => (v?.status === 'rec' ? { ...v, t: sec, total } : v)) }
        },
      })
      const name = fileName.replace(/\.png$/, `.${r.ext}`)
      const file = new File([r.blob], name, { type: r.mime })
      recUrl.current = URL.createObjectURL(r.blob)
      setVideo({ status: 'ready', file, url: recUrl.current, noAudio: useAudio && !r.audio })
    } catch (e) {
      if (e?.name === 'AbortError' && e.message !== 'hidden') return
      setVideo({ status: 'error', msg: e?.message === 'hidden' ? t.videoHidden : e?.message === 'unsupported' ? t.videoUnsupported : t.videoFail })
    } finally {
      recClock.current = null
      setRecAudioDur(0)
      actx?.close?.()?.catch?.(() => {})
    }
  }

  const shareVideo = async () => {
    const file = video?.file
    if (!file) return
    if (canShareFile(file)) {
      try { await navigator.share({ files: [file] }) } catch (e) {
        if (e?.name !== 'AbortError') saveBlob(file, file.name)
      }
    } else {
      saveBlob(file, file.name)
    }
  }

  const copy = async () => {
    if (content.empty) return
    const text = [content.ar, content.text, content.ref ? `— ${content.ref}` : ''].filter(Boolean).join('\n\n')
    if (await copyToClipboard(text)) showFlash('copied')
  }

  /* ── Sekmələr (ox düymələri ilə də) ── */
  const tabRefs = useRef({})
  const onTabKey = (e) => {
    const i = TABS.findIndex(x => x.id === tab)
    const dir = document.documentElement.dir === 'rtl' ? -1 : 1
    let n = null
    if (e.key === 'ArrowRight') n = i + dir
    else if (e.key === 'ArrowLeft') n = i - dir
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = TABS.length - 1
    if (n == null) return
    e.preventDefault()
    const next = TABS[(n + TABS.length) % TABS.length]
    setTab(next.id)
    tabRefs.current[next.id]?.focus()
  }

  const chooseTemplate = (id) => { setTplId(id); setStyle(s => (s.bgColor ? { ...s, bgColor: '' } : s)) }
  const libraryPos = pool.length ? `${poolIdx + 1} / ${pool.length}` : ''
  const tplName = TEMPLATE_NAMES[tplId]?.[lang] || ''
  const ariaCard = [content.ar, content.text, content.ref].filter(Boolean).join(' — ')
  const hasAr = Boolean(content.ar)
  const hasTr = Boolean(content.text) && !content.empty

  return (
    <>
      <div className="ui-container qg-studio" data-template={tplId} data-format={fmtId} data-source={source}>
        {/* Sol: önizləmə + düymələr (telefonda display:contents — hər biri ayrıca yapışqan) */}
        <div className="qg-left">
          <figure className="qg-stage">
            <QuotePreview
              card={card}
              format={format}
              label={`${t.preview}: ${ariaCard}`}
              onOverflow={onOverflow}
              swapKey={`${tplId}-${fmtId}-${animKey}`}
              motion={(motion || recording) && !content.empty}
              clockRef={recording ? recClock : null}
              audioDur={recording ? recAudioDur : 0}
            >
              {recording && (
                <div className="qg-rec" role="status" aria-live="polite">
                  <div className="qg-rec__row">
                    <span className="qg-rec__dot" aria-hidden="true" />
                    <span className="qg-rec__label">
                      {video.status === 'audio' ? t.loadingAudio : t.videoMaking}
                      {video.status === 'rec' && video.total > 0 && (
                        <span className="ui-num"> · {Math.floor(video.t)} / {Math.ceil(video.total)} {t.sec}</span>
                      )}
                    </span>
                    <button type="button" className="qg-rec__cancel" onClick={closeVideo}>{t.cancel}</button>
                  </div>
                  <div className="qg-rec__bar" aria-hidden="true">
                    <span style={{ transform: `scaleX(${video.total ? Math.min(1, video.t / video.total) : 0})` }} />
                  </div>
                  <p className="qg-rec__note">{t.videoKeep}</p>
                </div>
              )}
              {video?.status === 'ready' && (
                <div className="qg-vid" role="dialog" aria-label={t.videoReady}>
                  <video className="qg-vid__player" src={video.url} autoPlay loop muted playsInline controls />
                  <div className="qg-vid__bar">
                    <strong className="qg-vid__title"><Icon name="check" size={16} /> {t.videoReady}</strong>
                    {video.noAudio && <p className="qg-vid__note">{t.noAudio}</p>}
                    <div className="qg-vid__acts">
                      <button type="button" className="ui-btn ui-btn--primary" onClick={shareVideo}><Icon name="share" className="ui-btn__icon" />{t.share}</button>
                      <button type="button" className="ui-btn ui-btn--secondary" onClick={() => saveBlob(video.file, video.file.name)}><Icon name="download" className="ui-btn__icon" />{t.videoDownload}</button>
                      <button type="button" className="ui-icon-btn" onClick={closeVideo} aria-label={t.close} title={t.close}><Icon name="close" /></button>
                    </div>
                  </div>
                </div>
              )}
            </QuotePreview>
            <figcaption className="qg-caption">
              {content.ref
                ? <span className="qg-caption__ref" data-testid="quote-ref"><Icon name="check" size={14} /> <bdi>{content.ref}</bdi></span>
                : <span className="qg-caption__ref is-empty" />}
              <span className="qg-caption__tools">
                {ayahRecitable && canVideo && (
                  <button type="button" className="qg-pill" aria-pressed={withAudio} onClick={() => setWithAudio(v => !v)} title={t.withRecitation}>
                    <Icon name="volume" size={14} /> {t.recitation}
                  </button>
                )}
                <button type="button" className="qg-pill" aria-pressed={motion} onClick={() => setMotion(m => !m)} disabled={recording} title={motion ? t.motionPause : t.motionPlay} aria-label={motion ? t.motionPause : t.motionPlay}>
                  <Icon name={motion ? 'pause' : 'play'} size={14} /> {t.motion}
                </button>
                <span className="qg-caption__meta"><span>{tplName}</span> · <span className="ui-num">{format.w}×{format.h}</span></span>
              </span>
            </figcaption>
            {overflow && !content.empty && <p className="qg-warn" role="status">{t.overflow}</p>}
            {video?.status === 'error' && (
              <p className="qg-warn qg-warn--video" role="alert">
                {video.msg}
                <button type="button" className="qg-warn__x" onClick={closeVideo} aria-label={t.close}><Icon name="close" size={14} /></button>
              </p>
            )}
          </figure>

          <div className="qg-actions">
            <button type="button" className="ui-btn ui-btn--primary qg-act qg-act--share" onClick={share} disabled={Boolean(busy) || content.empty}>
              {busy === 'share' ? <span className="ui-spin" aria-hidden="true" /> : <Icon name="share" className="ui-btn__icon" />}
              {t.share}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary qg-act qg-act--download" onClick={download} disabled={Boolean(busy) || content.empty} aria-label={t.download}>
              {busy === 'download' ? <span className="ui-spin" aria-hidden="true" /> : <Icon name={flash === 'downloaded' ? 'check' : 'download'} className="ui-btn__icon" />}
              <span className="qg-act__long">{t.download}</span>
              <span className="qg-act__short" aria-hidden="true">{t.downloadShort}</span>
            </button>
            <button type="button" className="ui-btn ui-btn--secondary qg-act qg-act--video" onClick={makeVideo} disabled={Boolean(busy) || recording || content.empty} aria-label={t.videoLong} title={t.videoLong}>
              {recording ? <span className="ui-spin" aria-hidden="true" /> : <Icon name="film" className="ui-btn__icon" />}
              <span>{t.video}</span>
            </button>
            <button type="button" className="ui-icon-btn qg-act qg-act--copy" onClick={copy} disabled={content.empty} aria-label={t.copy} title={t.copy}>
              <Icon name={flash === 'copied' ? 'check' : 'copy'} />
            </button>
            <p className="qg-flash" role="status" aria-live="polite">
              {flash === 'copied' ? t.copied : flash === 'downloaded' ? t.downloaded : flash === 'tab' ? t.openedTab : ''}
            </p>
          </div>
        </div>

        {/* Sağ: başlıq + sekmələr + idarələr. Başlıq bu sütundadır ki, masaüstündə
            soldakı önizləmə ilk ekranda tam görünsün (telefonda ən yuxarıda qalır) */}
        <div className="qg-right">
          <header className="qg-intro">
            <span className="ui-eyebrow">{t.eyebrow}</span>
            <h1 className="ui-display qg-title">{t.title}</h1>
            <p className="ui-lead qg-lead">{t.subtitle}</p>
          </header>
          <div className="qg-editor">
            {/* v6: aktiv sekmənin alt xətti yayla qonşu sekməyə sürüşür (layoutId — 21st.dev "animated tabs") */}
            <LayoutFeatures>
            <div className="qg-tabs qg-tabs--mo" role="tablist" aria-label={t.tabsLabel} onKeyDown={onTabKey}>
              {TABS.map(x => (
                <button
                  key={x.id}
                  ref={el => { tabRefs.current[x.id] = el }}
                  type="button"
                  role="tab"
                  id={`qg-tab-${x.id}`}
                  aria-controls={`qg-panel-${x.id}`}
                  aria-selected={tab === x.id}
                  tabIndex={tab === x.id ? 0 : -1}
                  className="qg-tab"
                  onClick={() => setTab(x.id)}
                >
                  <Icon name={x.icon} size={18} className="qg-tab__icon" />
                  <span>{t[x.label]}</span>
                  {tab === x.id && <m.span layoutId="qg-tab-line" className="qg-tab__line" transition={SPRING.snappy} aria-hidden="true" />}
                </button>
              ))}
            </div>
            </LayoutFeatures>

            <div className="qg-panel" role="tabpanel" id={`qg-panel-${tab}`} aria-labelledby={`qg-tab-${tab}`} key={tab}>
              {tab === 'content' && (
                <SourcePanel
                  t={t} lang={lang} source={source}
                  onSource={(s) => {
                    setSource(s)
                    if (s === 'ayah' && !ayahReq) submitAyah()
                    bump()
                  }}
                  category={category} onCategory={changeCategory} onShuffle={shuffle} onStep={step} libraryPos={libraryPos}
                  ayahForm={ayahForm} onAyahForm={setAyahForm} onAyahSubmit={submitAyah} ayahState={ayahState}
                  hadiths={hadithData?.list || null} hadithId={hadithId} onHadith={pickHadith} onRandomHadith={randomHadith}
                  custom={custom} onCustom={setCustom}
                />
              )}
              {tab === 'template' && <TemplatePicker value={tplId} onChange={chooseTemplate} lang={lang} label={t.tabTemplate} card={thumbCard} format={format} />}
              {tab === 'format' && <FormatPicker t={t} value={fmtId} onChange={setFmtId} />}
              {tab === 'style' && <StylePanel t={t} style={style} onStyle={setStyle} hasAr={hasAr} hasTr={hasTr} template={template} />}
            </div>
          </div>
        </div>
      </div>

      {/* ══ Necə işləyir: 4 addım (sekmə adları) + paylaşım + mənbə qeydi ══ */}
      <section className="ui-section ui-section--tight ui-section--alt qg-guide" aria-labelledby="qg-guide-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{g.ey}</span>
            <h2 className="ui-title" id="qg-guide-h">{g.title}</h2>
            <p className="ui-lead">{g.lead}</p>
          </div>
          <ol className="ui-steps ui-steps--row qg-guide__steps">
            {[...TABS.map((x, i) => [t[x.label], g.steps[i]]), [g.share, g.shareText]].map(([title, text], i) => (
              <li key={i} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{title}</h3>
                  <p className="ui-step__text">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="qg-guide__foot">
            <p className="qg-guide__note"><Icon name="info" size={16} /> {g.note}</p>
            <nav className="qg-guide__rel" aria-label={g.rel}>
              <span className="qg-guide__rel-label">{g.rel}:</span>
              {['quran', 'hadith', 'duas'].map(k => (
                <a key={k} className="ui-chip" href={pathFor(k, lang)} onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(pathFor(k, lang)); window.scrollTo(0, 0) }}><Icon name={k} size={15} /> {g[k]}</a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <DeferRender height="640px" idle={false} rootMargin="400px 0px">
        <Suspense fallback={<div style={{ minHeight: 640 }} />}>
          <PatternStudio lang={lang} />
        </Suspense>
      </DeferRender>

      <DeferRender height="720px" idle={false} rootMargin="400px 0px">
        <Suspense fallback={<div style={{ minHeight: 720 }} />}>
          <CalligraphyComposer lang={lang} />
        </Suspense>
      </DeferRender>
    </>
  )
}
