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
// Element (və ya valideyni) lang="ar" daşıyırsa və cihazda ərəb səsi varsa —
// həmin hissə ərəb səsi ilə oxunur; yoxdursa səhifənin səsi ilə.
//
// Oxuma uzun mətndə Chrome-un ~15 san. kəsilməsinə qarşı cümlə hissələrinə
// bölünür. Vurğulama (highlight) qəsdən yoxdur — sadə saxlanılıb.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/ListenButton.css'
import { pickUi } from '../utils/uiText'

const BCP47 = { az: 'az-AZ', en: 'en', ru: 'ru-RU', ar: 'ar-SA', tr: 'tr-TR' }
const DEFAULT_SELECTOR = 'h1, h2, h3, h4, p, li, blockquote, figcaption, dt, dd, td, th'
const SKIP = 'button, nav, script, style, noscript, [aria-hidden="true"], [hidden], .ui-sr-only, [data-listen-skip]'
const MAX_CHUNK = 220

const T = {
  az: {
    listen: 'Səsli oxu', pause: 'Fasilə', resume: 'Davam et', stop: 'Dayandır',
    noVoice: 'Bu cihazda/brauzerdə Azərbaycan dilində səs yoxdur, ona görə səsli oxu işləmir. Səsi cihazın nitq parametrlərindən əlavə etmək olar.',
    noApi: 'Bu brauzer səsli oxunu dəstəkləmir.',
    empty: 'Oxunacaq mətn tapılmadı.',
  },
  en: {
    listen: 'Listen', pause: 'Pause', resume: 'Resume', stop: 'Stop',
    noVoice: 'There is no English voice on this device or browser, so read-aloud is unavailable. You can add one in your device’s speech settings.',
    noApi: 'This browser does not support read-aloud (speech synthesis).',
    empty: 'No text found to read.',
  },
  ru: {
    listen: 'Прослушать', pause: 'Пауза', resume: 'Продолжить', stop: 'Остановить',
    noVoice: 'На этом устройстве или в браузере нет голоса для русского языка, поэтому озвучивание недоступно. Голос можно добавить в настройках речи устройства.',
    noApi: 'Этот браузер не поддерживает озвучивание текста (синтез речи).',
    empty: 'Не найден текст для чтения.',
  },
  ar: {
    listen: 'استمع', pause: 'إيقاف مؤقت', resume: 'متابعة', stop: 'إيقاف',
    noVoice: 'لا يوجد صوت عربي على هذا الجهاز أو المتصفح، لذا فالقراءة الصوتية غير متاحة. يمكنك إضافة صوت من إعدادات النطق في جهازك.',
    noApi: 'هذا المتصفح لا يدعم القراءة الصوتية (تحويل النص إلى كلام).',
    empty: 'لم يُعثر على نص للقراءة.',
  },
  tr: {
    listen: 'Sesli dinle', pause: 'Duraklat', resume: 'Devam et', stop: 'Durdur',
    noVoice: 'Bu cihazda veya tarayıcıda Türkçe ses yok, bu yüzden sesli okuma kullanılamıyor. Cihazın konuşma ayarlarından ses ekleyebilirsiniz.',
    noApi: 'Bu tarayıcı sesli okumayı (konuşma sentezini) desteklemiyor.',
    empty: 'Okunacak metin bulunamadı.',
  },
}

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)
const norm = (l) => String(l || '').toLowerCase().replace('_', '-')

/** Dil kodu üçün ən uyğun səs: tam uyğunluq → dil prefiksi; yoxdursa null. */
export function pickVoice(voices, code) {
  if (!voices || !voices.length || !code) return null
  const want = norm(code)
  const base = want.split('-')[0]
  return voices.find(v => norm(v.lang) === want)
    || voices.find(v => norm(v.lang).split('-')[0] === base && v.localService)
    || voices.find(v => norm(v.lang).split('-')[0] === base)
    || null
}

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

function isHidden(el) {
  if (el.closest(SKIP)) return true
  try {
    const cs = window.getComputedStyle(el)
    return cs.display === 'none' || cs.visibility === 'hidden'
  } catch { return false }
}

/** Konteynerdən oxunacaq bloklar: [{ text, lang }] (iç-içə təkrar yoxdur). */
function collectBlocks(root, selector) {
  if (!root) return []
  const all = Array.from(root.querySelectorAll(selector)).filter(el => !isHidden(el))
  const set = new Set(all)
  const top = all.filter(el => {
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (set.has(p)) return false
    return true
  })
  const blocks = top.map(el => ({
    text: (el.innerText || el.textContent || '').trim(),
    lang: norm(el.closest('[lang]')?.getAttribute('lang')).split('-')[0],
  })).filter(b => b.text)
  // Seçici heç nə tapmadısa — konteynerin bütün görünən mətni
  if (!blocks.length) {
    const text = (root.innerText || root.textContent || '').trim()
    if (text) blocks.push({ text, lang: '' })
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
      if (pickVoice(list, BCP47[lang])) { done = true; setSupport('ok') }
      else if (final || list.length) setSupport('noVoice')
    }
    check(false)
    const onChange = () => check(false)
    s.addEventListener?.('voiceschanged', onChange)
    const timer = setTimeout(() => { if (!done) check(true) }, 2000)
    return () => { clearTimeout(timer); s.removeEventListener?.('voiceschanged', onChange) }
  }, [lang])

  const stop = useCallback(() => {
    sessionRef.current += 1
    const s = synth()
    if (s) s.cancel()
    setStatus('idle')
  }, [])

  // Dil dəyişəndə və ya komponent gedəndə (başqa səhifə) oxuma dayanır
  useEffect(() => () => { sessionRef.current += 1; synth()?.cancel() }, [])
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
    const pageVoice = pickVoice(voices, BCP47[lang])
    if (!pageVoice) { setSupport('noVoice'); return }
    const blocks = collectBlocks(resolveTarget(target), selector)
    if (!blocks.length) { setEmptyNote(true); return }
    setEmptyNote(false)

    s.cancel() // başqa ListenButton oxuyursa — dayansın
    const session = ++sessionRef.current
    const queue = []
    for (const b of blocks) {
      const alt = b.lang && b.lang !== lang ? pickVoice(voices, BCP47[b.lang] || b.lang) : null
      const voice = alt || pageVoice
      for (const part of chunkText(b.text)) queue.push({ part, voice })
    }
    queue.forEach(({ part, voice }, i) => {
      const u = new window.SpeechSynthesisUtterance(part)
      u.voice = voice
      u.lang = voice.lang
      if (i === queue.length - 1) {
        u.onend = () => { if (sessionRef.current === session) setStatus('idle') }
      }
      u.onerror = (e) => {
        // cancel() "interrupted/canceled" verir — bu, adi dayanmadır
        if (sessionRef.current !== session) return
        if (e && (e.error === 'interrupted' || e.error === 'canceled')) return
        sessionRef.current += 1
        s.cancel()
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
