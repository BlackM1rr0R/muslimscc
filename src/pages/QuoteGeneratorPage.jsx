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
// ═══════════════════════════════════════════════════════
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
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
import { LABELS, TEMPLATE_NAMES } from '../components/quote/labels'
import { refLabel, fetchAyah, readParams, parseAyahRef } from '../components/quote/content'
import QuotePreview from '../components/quote/QuotePreview'
import TemplatePicker from '../components/quote/TemplatePicker'
import SourcePanel from '../components/quote/SourcePanel'
import { FormatPicker, StylePanel } from '../components/quote/StylePanel'
import Icon from '../components/Icon'
import '../styles/QuoteGeneratorPage.css'

// Sitatın tərcüməsi YALNIZ cari dildə. Ərəbcədə orijinal mətn onsuz da
// göstərilir — tərcümə sətri yoxdur.
const translationOf = (q, lang) => (lang === 'ar' ? '' : pickLang(q?.text, lang))

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
  const t = LABELS[lang] || LABELS.az
  const location = useLocation()
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
  const shareText = [content.ref ? `— ${content.ref}` : '', `${BRAND.domain}`].filter(Boolean).join('\n')

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
          await navigator.share({ files: [file], title: t.title, text: shareText })
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
            />
            <figcaption className="qg-caption">
              {content.ref
                ? <span className="qg-caption__ref" data-testid="quote-ref"><Icon name="check" size={14} /> <bdi>{content.ref}</bdi></span>
                : <span className="qg-caption__ref is-empty" />}
              <span className="qg-caption__meta"><span>{tplName}</span> · <span className="ui-num">{format.w}×{format.h}</span></span>
            </figcaption>
            {overflow && !content.empty && <p className="qg-warn" role="status">{t.overflow}</p>}
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
            <div className="qg-tabs" role="tablist" aria-label={t.tabsLabel} onKeyDown={onTabKey}>
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
                </button>
              ))}
            </div>

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
              {tab === 'template' && <TemplatePicker value={tplId} onChange={chooseTemplate} lang={lang} label={t.tabTemplate} />}
              {tab === 'format' && <FormatPicker t={t} value={fmtId} onChange={setFmtId} />}
              {tab === 'style' && <StylePanel t={t} style={style} onStyle={setStyle} hasAr={hasAr} hasTr={hasTr} template={template} />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
