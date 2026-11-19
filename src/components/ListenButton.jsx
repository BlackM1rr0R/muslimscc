// ═══════════════════════════════════════════════════════
// SƏSLİ OXU — səhifənin bir hissəsini brauzerin nitq sintezi ilə oxuyur
//
// Web Speech API (window.speechSynthesis): şəbəkə, açar, kitabxana YOXDUR —
// səsləri istifadəçinin cihazı/brauzeri verir. Saytın dilinə uyğun səs
// axtarılır (az-AZ, en, ru-RU, ar-SA, tr-TR — əvvəl tam kod, sonra dil
// prefiksi). Uyğun səs YOXDURSA düymə söndürülür və dürüst izah göstərilir
// (məs. bir çox cihazda Azərbaycan dilində səs yoxdur) — başqa dilin səsi ilə
// "oxumağa" çalışmırıq.
//
// İstifadə:
//   <ListenButton target={ref} />                    — ref-in içindəki mətn
//   <ListenButton target="#lesson-body" />            — CSS seçici ilə konteyner
//   <ListenButton target={ref} selector="h2, p, li" /> — yalnız bu elementlər
// target verilməyibsə <main> oxunur. Gizli elementlər (aria-hidden, hidden,
// display:none), düymələr, nav və .ui-sr-only atlanır; iç-içə uyğun gələn
// elementlərin mətni iki dəfə oxunmur.
// QURAN MƏTNİ HEÇ VAXT MAŞIN SƏSİ İLƏ OXUNMUR (təcvidsiz TTS yersizdir; ayənin öz
// qari düyməsi var): [data-listen-quran] blokunda ərəb mətni ([data-listen-skip])
// atlanır, yalnız tərcümə oxunur və əvvəlinə "Quran 4:103" deyilir. Ərəbcə olmayan
// interfeysdə bütün ərəb blokları (.ui-arabic, [lang="ar"]) da atlanır.
// Səs bloku öz dilinə görə seçilir: hədəfin İÇİNDƏKİ ən yaxın [lang] (BCP-47) —
// yoxdursa interfeysin dili; 44 əlavə dildə də (de, fr, id …) cihaz səsi tapılır.
//
// Oxuma uzun mətndə Chrome-un ~15 san. kəsilməsinə qarşı cümlə hissələrinə
// bölünür. İndi oxunan blok .lb-reading ilə işıqlanır və ekrana gətirilir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/ListenButton.css'
import { pickUi } from '../utils/uiText'
import { bcp47, normLang, pickVoice } from '../utils/ttsVoice'

export { bcp47, pickVoice }

const DEFAULT_SELECTOR = 'h1, h2, h3, h4, p, li, blockquote, figcaption, dt, dd, td, th'
const SKIP = 'button, nav, script, style, noscript, [aria-hidden="true"], [hidden], .ui-sr-only, [data-listen-skip]'
// Ərəbcə olmayan interfeysdə əlavə atlananlar (ərəb mətni səhifənin səsi ilə oxunmasın)
const SKIP_AR = '.ui-arabic, [lang="ar"]'
const MAX_CHUNK = 220

const T = {
  az: {
    listen: 'Səsli oxu', pause: 'Fasilə', resume: 'Davam et', stop: 'Dayandır',
    noVoice: 'Bu cihazda/brauzerdə Azərbaycan dilində səs yoxdur, ona görə səsli oxu işləmir. Səsi cihazın nitq parametrlərindən əlavə etmək olar.',
    noApi: 'Bu brauzer səsli oxunu dəstəkləmir.',
    empty: 'Oxunacaq mətn tapılmadı.', quran: 'Quran',
  },
  en: {
    listen: 'Listen', pause: 'Pause', resume: 'Resume', stop: 'Stop',
    noVoice: 'There is no English voice on this device or browser, so read-aloud is unavailable. You can add one in your device’s speech settings.',
    noApi: 'This browser does not support read-aloud (speech synthesis).',
    empty: 'No text found to read.', quran: 'Quran',
  },
  ru: {
    listen: 'Прослушать', pause: 'Пауза', resume: 'Продолжить', stop: 'Остановить',
    noVoice: 'На этом устройстве или в браузере нет голоса для русского языка, поэтому озвучивание недоступно. Голос можно добавить в настройках речи устройства.',
    noApi: 'Этот браузер не поддерживает озвучивание текста (синтез речи).',
    empty: 'Не найден текст для чтения.', quran: 'Коран',
  },
  ar: {
    listen: 'استمع', pause: 'إيقاف مؤقت', resume: 'متابعة', stop: 'إيقاف',
    noVoice: 'لا يوجد صوت عربي على هذا الجهاز أو المتصفح، لذا فالقراءة الصوتية غير متاحة. يمكنك إضافة صوت من إعدادات النطق في جهازك.',
    noApi: 'هذا المتصفح لا يدعم القراءة الصوتية (تحويل النص إلى كلام).',
    empty: 'لم يُعثر على نص للقراءة.', quran: 'القرآن',
  },
  tr: {
    listen: 'Sesli dinle', pause: 'Duraklat', resume: 'Devam et', stop: 'Durdur',
    noVoice: 'Bu cihazda veya tarayıcıda Türkçe ses yok, bu yüzden sesli okuma kullanılamıyor. Cihazın konuşma ayarlarından ses ekleyebilirsiniz.',
    noApi: 'Bu tarayıcı sesli okumayı (konuşma sentezini) desteklemiyor.',
    empty: 'Okunacak metin bulunamadı.', quran: 'Kur’an',
  },
}

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)
const norm = normLang

/** Mətni cümlə sərhədində ≤ max simvolluq hissələrə böl. */
export function chunkText(text, max = MAX_CHUNK) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const sentences = clean.match(/[^.!?؟。…]+[.!?؟。…]*["»”’)]*\s*/g) || [clean]
  const out = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length <= max) { cur += s; continue }
    if (cur.trim()) out.push(cur.trim())
    if (s.length <= max) { cur = s; continue }
    // Çox uzun cümlə — vergül/boşluqda böl
    let rest = s
    while (rest.length > max) {
      let cut = Math.max(rest.lastIndexOf(', ', max), rest.lastIndexOf('، ', max), rest.lastIndexOf(' ', max))
      if (cut < max * 0.4) cut = max - 1
      out.push(rest.slice(0, cut + 1).trim())
      rest = rest.slice(cut + 1)
    }
    cur = rest
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function isHidden(el, skip) {
  if (el.closest(skip)) return true
  try {
    const cs = window.getComputedStyle(el)
    return cs.display === 'none' || cs.visibility === 'hidden'
  } catch { return false }
}

/** Elementin mətni — atlanan hissələr (Quran ərəbcəsi, düymə, gizli) çıxarılmaqla */
function textOf(el, skip) {
  if (!el.querySelector(skip)) return (el.innerText || el.textContent || '').trim()
  const c = el.cloneNode(true)
  c.querySelectorAll(skip).forEach(x => x.remove())
  return (c.textContent || '').replace(/\s+/g, ' ').trim()
}

/** Blokun dili: hədəfin İÇİNDƏKİ ən yaxın [lang] (səhifənin <html lang>-ı sayılmır) */
function langOf(el, root, fallback) {
  for (let p = el; p; p = p.parentElement) {
    const l = p.getAttribute?.('lang')
    if (l) return l
    if (p === root) break
  }
  return fallback
}

/**
 * Konteynerdən oxunacaq bloklar: [{ text, lang, el }] (iç-içə təkrar yoxdur).
 * opts.lang — interfeysin dili (blokda lang yoxdursa); opts.quran — "Quran" sözü.
 */
export function collectBlocks(root, selector, { lang = 'en', quran = 'Quran' } = {}) {
  if (!root) return []
  const skip = lang === 'ar' ? SKIP : `${SKIP}, ${SKIP_AR}`
  const all = Array.from(root.querySelectorAll(selector)).filter(el => !isHidden(el, skip))
  const set = new Set(all)
  const top = all.filter(el => {
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (set.has(p)) return false
    return true
  })
  const said = new Set()
  const blocks = top.map(el => {
    let text = textOf(el, skip)
    // Quran bloku: ərəbcə atlanıb; bir dəfə "Quran 4:103" deyilir
    const q = el.closest('[data-listen-quran]')
    if (q && !said.has(q)) {
      said.add(q)
      text = `${quran} ${q.getAttribute('data-listen-quran')}.${text ? ` ${text}` : ''}`
    }
    return { text, lang: langOf(el, root, lang), el }
  }).filter(b => b.text)
  // Seçici heç nə tapmadısa — konteynerin bütün görünən mətni (atlananlar çıxarılmaqla)
  if (!blocks.length && !root.querySelector('[data-listen-quran]')) {
    const text = textOf(root, skip)
    if (text) blocks.push({ text, lang: langOf(root, root, lang), el: null })
  }
  return blocks
}

function resolveTarget(target) {
  if (typeof document === 'undefined') return null
  if (!target) return document.querySelector('main')
  if (typeof target === 'string') return document.querySelector(target)
  return target.current || (target.nodeType === 1 ? target : null)
}

export default function ListenButton({ target, selector = DEFAULT_SELECTOR, className = '' }) {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const tipId = useId()
  // 'checking' → səslər yüklənir; 'ok' | 'noVoice' | 'noApi'
  const [support, setSupport] = useState('checking')
  const [status, setStatus] = useState('idle') // idle | playing | paused
  const [tipOpen, setTipOpen] = useState(false)
  const [emptyNote, setEmptyNote] = useState(false)
  const voicesRef = useRef([])
  const sessionRef = useRef(0)

  // Səslər asinxron gəlir (Chrome: voiceschanged); 2 san. sonra hələ yoxdursa — yoxdur
  useEffect(() => {
    const s = synth()
    if (!s || typeof window.SpeechSynthesisUtterance === 'undefined') { setSupport('noApi'); return undefined }
    let done = false
    const check = (final) => {
      const list = s.getVoices() || []
      voicesRef.current = list
      if (pickVoice(list, bcp47(lang))) { done = true; setSupport('ok') }
      else if (final || list.length) setSupport('noVoice')
    }
    check(false)
    const onChange = () => check(false)
    s.addEventListener?.('voiceschanged', onChange)
    const timer = setTimeout(() => { if (!done) check(true) }, 2000)
    return () => { clearTimeout(timer); s.removeEventListener?.('voiceschanged', onChange) }
  }, [lang])

  // "İndi oxunur" işarəsi (.lb-reading) — bir blokda
  const readingRef = useRef(null)
  const mark = useCallback((el) => {
    if (readingRef.current === el) return
    readingRef.current?.classList.remove('lb-reading')
    readingRef.current = el || null
    if (!el) return
    el.classList.add('lb-reading')
    const reduced = document.documentElement.classList.contains('a11y-motion-user')
      || (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    try { el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }) } catch { /* köhnə brauzer */ }
  }, [])

  const stop = useCallback(() => {
    sessionRef.current += 1
    const s = synth()
    if (s) s.cancel()
    mark(null)
    setStatus('idle')
  }, [mark])

  // Dil dəyişəndə və ya komponent gedəndə (başqa səhifə) oxuma dayanır
  useEffect(() => () => { sessionRef.current += 1; synth()?.cancel(); readingRef.current?.classList.remove('lb-reading') }, [])
  const langRef = useRef(lang)
  useEffect(() => {
    if (langRef.current === lang) return
    langRef.current = lang
    stop()
  }, [lang, stop])

  const play = () => {
    const s = synth()
    if (!s) return
    if (status === 'paused') { s.resume(); setStatus('playing'); return }
    const voices = voicesRef.current.length ? voicesRef.current : s.getVoices()
    const pageVoice = pickVoice(voices, bcp47(lang))
    if (!pageVoice) { setSupport('noVoice'); return }
    const blocks = collectBlocks(resolveTarget(target), selector, { lang, quran: t.quran })
    if (!blocks.length) { setEmptyNote(true); return }
    setEmptyNote(false)

    s.cancel() // başqa ListenButton oxuyursa — dayansın
    const session = ++sessionRef.current
    const queue = []
    for (const b of blocks) {
      // Blokun öz dili üçün səs yoxdursa — həmin blok atlanır (başqa dilin səsi ilə "oxumuruq")
      const same = norm(b.lang).split('-')[0] === norm(lang).split('-')[0]
      const voice = same ? pageVoice : pickVoice(voices, bcp47(b.lang))
      if (!voice) continue
      for (const part of chunkText(b.text)) queue.push({ part, voice, el: b.el })
    }
    if (!queue.length) { setEmptyNote(true); return }
    queue.forEach(({ part, voice, el }, i) => {
      const u = new window.SpeechSynthesisUtterance(part)
      // Səs obyekti brauzerin öz SpeechSynthesisVoice-u deyilsə Chrome atır — onda yalnız u.lang
      try { u.voice = voice } catch { /* bəzi brauzerlər yalnız öz səs obyektini qəbul edir */ }
      u.lang = voice.lang
      u.onstart = () => { if (sessionRef.current === session) mark(el) }
      if (i === queue.length - 1) {
        u.onend = () => { if (sessionRef.current === session) { mark(null); setStatus('idle') } }
      }
      u.onerror = (e) => {
        // cancel() "interrupted/canceled" verir — bu, adi dayanmadır
        if (sessionRef.current !== session) return
        if (e && (e.error === 'interrupted' || e.error === 'canceled')) return
        sessionRef.current += 1
        s.cancel()
        mark(null)
        setStatus('idle')
      }
      s.speak(u)
    })
    setStatus('playing')
  }

  const pause = () => {
    const s = synth()
    if (!s) return
    s.pause()
    setStatus('paused')
  }

  if (support === 'checking') return null

  if (support !== 'ok') {
    const msg = support === 'noApi' ? t.noApi : t.noVoice
    return (
      <span className={`lb-root lb-root--off ${className}`.trim()}>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm lb-btn" aria-disabled="true"
          aria-describedby={tipId} onClick={() => setTipOpen(o => !o)} onBlur={() => setTipOpen(false)}>
          <Icon name="volume" size={16} className="ui-btn__icon" /> {t.listen}
        </button>
        <span id={tipId} role="tooltip" className={`lb-tip${tipOpen ? ' is-open' : ''}`}>{msg}</span>
      </span>
    )
  }

  return (
    <span className={`lb-root ${className}`.trim()} role="group" aria-label={t.listen}>
      {status === 'playing' ? (
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm lb-btn" onClick={pause}>
          <Icon name="pause" size={16} className="ui-btn__icon" /> {t.pause}
        </button>
      ) : (
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm lb-btn" onClick={play}>
          <Icon name={status === 'paused' ? 'play' : 'volume'} size={16} className="ui-btn__icon" />
          {status === 'paused' ? t.resume : t.listen}
        </button>
      )}
      {status !== 'idle' && (
        <button type="button" className="ui-icon-btn lb-stop" onClick={stop} aria-label={t.stop} title={t.stop}>
          <Icon name="close" size={18} />
        </button>
      )}
      {emptyNote && <span className="lb-empty" role="status">{t.empty}</span>}
    </span>
  )
}
