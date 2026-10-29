// ═══════════════════════════════════════════════════════
// Quran dinləmə: səs mühərriki (useQuranPlayer) + yapışqan mini-pleyer
//
// • İki <audio> elementi: biri oxuyur, o biri növbəti ayəni əvvəlcədən
//   yükləyir — vərəq görünəndə ayə bitən kimi hazır elementə keçilir
//   (boşluqsuz keçid). Vərəq gizlidirsə (kilid ekranı) brauzerlər yeni
//   elementin play()-ini bloklaya bilir — onda EYNİ element növbəti faylı
//   oxuyur (fayl artıq HTTP keşindədir).
// • Hər qarinin bir neçə mənbəyi var (utils/quranAudio.js): fayl yüklənmirsə
//   növbəti mənbə sınanır, hamısı alınmasa — dürüst xəta + "Yenidən cəhd et".
// • Media Session API: kilid ekranında / qulaqlıqda oynat, fasilə, növbəti, əvvəlki.
// • Təkrar: hər ayə N dəfə; A–B aralığı dövrə ilə. Sürət: 0.75× / 1× / 1.25×.
// • Klaviatura: boşluq — oynat/dayandır, ←/→ — ayə (ərəbcədə güzgülənir).
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useMemo, useRef } from 'react'
import Icon from './Icon'
import { haptic } from '../hooks/useHaptic'
import {
  RECITERS, SPEEDS, REPEATS, ayahSources, reciterName, readAudioPrefs, writeAudioPrefs,
} from '../utils/quranAudio'
import '../styles/QuranPlayer.css'

export const PLAYER_LABELS = {
  az: {
    region: 'Səs pleyeri', listen: 'Surəni dinlə', pause: 'Dayandır', resume: 'Davam et',
    prev: 'Əvvəlki ayə', next: 'Növbəti ayə', stop: 'Dinləməni bitir', settings: 'Səs ayarları',
    reciter: 'Qari', speed: 'Sürət', repeat: 'Hər ayəni təkrarla', range: 'Aralığı təkrarla (A–B)',
    from: 'Başlanğıc', to: 'Son', clearRange: 'Aralığı sil', rangeBad: 'Başlanğıc ayə son ayədən böyük ola bilməz',
    autoNext: 'Surə bitəndə növbətisinə keç', back: 'Cari ayəyə qayıt', loading: 'Yüklənir…',
    errLoad: 'Səs faylı yüklənmədi. Bir az sonra yenidən cəhd edin.',
    errOffline: 'İnternet bağlantısı yoxdur — səs yüklənə bilmir.',
    retry: 'Yenidən cəhd et', album: 'Qurani-Kərim', close: 'Bağla', times: 'dəfə',
  },
  en: {
    region: 'Audio player', listen: 'Listen to the surah', pause: 'Pause', resume: 'Resume',
    prev: 'Previous verse', next: 'Next verse', stop: 'Stop listening', settings: 'Audio settings',
    reciter: 'Reciter', speed: 'Speed', repeat: 'Repeat each verse', range: 'Loop a range (A–B)',
    from: 'From', to: 'To', clearRange: 'Clear range', rangeBad: 'The first verse cannot come after the last one',
    autoNext: 'Continue to the next surah', back: 'Back to the current verse', loading: 'Loading…',
    errLoad: 'The audio could not be loaded. Please try again a little later.',
    errOffline: 'No internet connection — the audio cannot be loaded.',
    retry: 'Try again', album: 'The Holy Quran', close: 'Close', times: 'times',
  },
  ru: {
    region: 'Аудиоплеер', listen: 'Слушать суру', pause: 'Пауза', resume: 'Продолжить',
    prev: 'Предыдущий аят', next: 'Следующий аят', stop: 'Остановить прослушивание', settings: 'Настройки звука',
    reciter: 'Чтец', speed: 'Скорость', repeat: 'Повторять каждый аят', range: 'Повтор отрезка (А–Б)',
    from: 'С аята', to: 'По аят', clearRange: 'Сбросить отрезок', rangeBad: 'Начальный аят не может быть после конечного',
    autoNext: 'Переходить к следующей суре', back: 'К текущему аяту', loading: 'Загрузка…',
    errLoad: 'Не удалось загрузить аудио. Попробуйте ещё раз чуть позже.',
    errOffline: 'Нет подключения к интернету — аудио не загружается.',
    retry: 'Повторить', album: 'Священный Коран', close: 'Закрыть', times: 'раз',
  },
  ar: {
    region: 'مشغل الصوت', listen: 'استمع إلى السورة', pause: 'إيقاف مؤقت', resume: 'استئناف',
    prev: 'الآية السابقة', next: 'الآية التالية', stop: 'إنهاء الاستماع', settings: 'إعدادات الصوت',
    reciter: 'القارئ', speed: 'السرعة', repeat: 'تكرار كل آية', range: 'تكرار مقطع (أ–ب)',
    from: 'من الآية', to: 'إلى الآية', clearRange: 'إلغاء المقطع', rangeBad: 'لا يمكن أن تكون آية البداية بعد آية النهاية',
    autoNext: 'الانتقال إلى السورة التالية', back: 'العودة إلى الآية الحالية', loading: 'جارٍ التحميل…',
    errLoad: 'تعذّر تحميل الصوت. حاول مرة أخرى بعد قليل.',
    errOffline: 'لا يوجد اتصال بالإنترنت — تعذّر تحميل الصوت.',
    retry: 'أعد المحاولة', album: 'القرآن الكريم', close: 'إغلاق', times: 'مرات',
  },
  tr: {
    region: 'Ses oynatıcı', listen: 'Sureyi dinle', pause: 'Duraklat', resume: 'Devam et',
    prev: 'Önceki ayet', next: 'Sonraki ayet', stop: 'Dinlemeyi bitir', settings: 'Ses ayarları',
    reciter: 'Kâri', speed: 'Hız', repeat: 'Her ayeti tekrarla', range: 'Aralığı tekrarla (A–B)',
    from: 'Başlangıç', to: 'Bitiş', clearRange: 'Aralığı kaldır', rangeBad: 'Başlangıç ayeti bitişten sonra olamaz',
    autoNext: 'Sure bitince sonrakine geç', back: 'Geçerli ayete dön', loading: 'Yükleniyor…',
    errLoad: 'Ses dosyası yüklenemedi. Biraz sonra tekrar deneyin.',
    errOffline: 'İnternet bağlantısı yok — ses yüklenemiyor.',
    retry: 'Tekrar dene', album: 'Kur’an-ı Kerim', close: 'Kapat', times: 'kez',
  },
}

const ARTWORK = [{ src: '/android-chrome-512x512.png?v=2', sizes: '512x512', type: 'image/png' }]
// Fayl bu müddətdə başlamasa (asılı qalan bağlantı) — növbəti mənbə sınanır
const STALL_MS = 15000
const isTyping = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
// Boşluq düymədə/linkdə öz işini görsün (düyməni basır)
const isControl = el => !!el && !!el.closest?.('button, a[href], summary, [role="button"], [role="slider"], [role="checkbox"]')

/**
 * Səs mühərriki.
 * surahNumber — açıq surə (dəyişəndə səs dayanır; "növbəti surəyə keç" istisnadır)
 * verses      — [{ n, g }] (surə yüklənməyibsə null)
 * onFollow(n) — cari ayəni ekrana gətir; onSurahEnd() — növbəti surəni aç
 * mediaTitle(n) — kilid ekranı üçün başlıq ("Fatihə, 3-cü ayə")
 */
export function useQuranPlayer({ surahNumber, verses, lang, onFollow, onSurahEnd, mediaTitle }) {
  const [prefs, setPrefs] = useState(readAudioPrefs)
  const [current, setCurrent] = useState(null)
  const [status, setStatus] = useState('idle')        // idle | loading | playing | paused | error
  const [errorKind, setErrorKind] = useState(null)     // load | offline
  const [range, setRangeState] = useState(null)        // { from, to } | null
  const [detached, setDetached] = useState(false)      // istifadəçi özü sürüşdürüb
  const [repeatNo, setRepeatNo] = useState(1)          // cari ayənin neçənci oxunuşu

  const r = useRef({}).current
  r.prefs = prefs
  r.range = range
  r.verses = verses
  r.surah = surahNumber
  r.lang = lang
  r.onFollow = onFollow
  r.onSurahEnd = onSurahEnd
  r.mediaTitle = mediaTitle
  if (r.els === undefined) { r.els = []; r.cur = 0; r.src = 0; r.rep = 1; r.current = null; r.status = 'idle'; r.detached = false }

  const api = useMemo(() => {
    const setSt = s => { r.status = s; setStatus(s) }
    const setCur = n => { r.current = n; setCurrent(n) }
    const curEl = () => r.els[r.cur]
    const otherEl = () => r.els[1 - r.cur]
    const verseOf = n => r.verses?.find(v => v.n === n)
    const keyOf = (n, i) => `${r.prefs.reciter}|${r.surah}|${n}|${i}`
    const sourcesOf = n => {
      const v = verseOf(n)
      return v ? ayahSources(r.prefs.reciter, { g: v.g, s: r.surah, a: n }) : []
    }
    const clearStall = () => { clearTimeout(r.stall); r.stall = null }
    const armStall = () => {
      clearStall()
      r.stall = setTimeout(() => { if (r.status === 'loading') onError(curEl()) }, STALL_MS)
    }

    function load(el, n, i) {
      const url = sourcesOf(n)[i]
      if (!url) return false
      el._qkey = keyOf(n, i)
      el._failed = null
      el.preload = 'auto'
      el.src = url
      el.defaultPlaybackRate = r.prefs.rate
      el.playbackRate = r.prefs.rate
      return true
    }
    function playEl(el) {
      el.playbackRate = r.prefs.rate
      let p
      try { p = el.play() } catch (e) { p = Promise.reject(e) }
      if (p?.catch) {
        p.catch(err => {
          if (el !== curEl()) return
          // Brauzer avtomatik oynatmanı bloklayıb — sadəcə fasilə vəziyyəti
          if (err?.name === 'NotAllowedError') { clearStall(); setSt('paused') }
          // AbortError — yeni fayl köhnəni əvəz etdi; NotSupportedError — "error" hadisəsi özü gələcək
        })
      }
    }
    function ensureEls() {
      if (r.els.length) return
      for (let i = 0; i < 2; i++) {
        const el = new Audio()
        el.preload = 'auto'
        el.addEventListener('ended', () => { if (el === curEl()) onEnded() })
        el.addEventListener('error', () => { if (el === curEl() && el._qkey) onError(el) })
        el.addEventListener('playing', () => {
          if (el !== curEl()) return
          clearStall(); setErrorKind(null); setSt('playing')
        })
        el.addEventListener('waiting', () => {
          if (el !== curEl() || el.paused) return
          setSt('loading'); armStall()
        })
        // Kənardan fasilə (qulaqlıq, sistem) — vəziyyət yenilənsin
        el.addEventListener('pause', () => {
          if (el !== curEl() || el.ended || r.switching) return
          if (r.status === 'playing' || r.status === 'loading') { clearStall(); setSt('paused') }
        })
        r.els.push(el)
      }
    }

    // Növbəti ayə: A–B aralığı varsa — sonda başlanğıca qayıdır
    function nextOf(n) {
      const rg = r.range
      if (rg && (n >= rg.to || n < rg.from)) return verseOf(rg.from) ? rg.from : null
      return verseOf(n + 1) ? n + 1 : null
    }
    function preloadNext(n) {
      const nx = nextOf(n)
      const o = otherEl()
      if (nx == null || !o) return
      if (o._qkey !== keyOf(nx, 0)) load(o, nx, 0)
    }
    function follow(n, prev) {
      if (r.detached) {
        // İstifadəçi sürüşdürüb, amma əvvəlki ayə hələ də ekrandadırsa — o "buradadır"
        const el = prev ? document.getElementById(`ayah-${prev}`) : null
        const rect = el?.getBoundingClientRect()
        if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return
        r.detached = false; setDetached(false)
      }
      r.onFollow?.(n)
    }

    function start(n, { followIt = true } = {}) {
      if (!verseOf(n)) return
      ensureEls()
      clearStall()
      const prev = r.current
      r.src = 0; r.rep = 1; setRepeatNo(1)
      const want = keyOf(n, 0)
      let el = curEl()
      const o = otherEl()
      if (o._qkey === want && o.readyState >= 2 && document.visibilityState === 'visible') {
        // Hazır element — boşluqsuz keçid
        r.switching = true
        el.pause()
        r.switching = false
        r.cur = 1 - r.cur
        el = o
        try { el.currentTime = 0 } catch { /* hələ metadata yoxdur */ }
      } else if (el._qkey !== want) {
        r.switching = true
        load(el, n, 0)
        r.switching = false
      } else {
        try { el.currentTime = 0 } catch { /* */ }
      }
      setCur(n)
      setErrorKind(null)
      setSt('loading')
      armStall()
      playEl(el)
      preloadNext(n)
      if (followIt) follow(n, prev)
    }

    function onEnded() {
      const n = r.current
      if (n == null) return
      if (r.rep < r.prefs.repeat) {
        r.rep += 1; setRepeatNo(r.rep)
        const el = curEl()
        try { el.currentTime = 0 } catch { /* */ }
        playEl(el)
        return
      }
      const nx = nextOf(n)
      if (nx != null) { start(nx); return }
      // Surənin sonu
      if (r.prefs.autoNext && r.surah < 114 && r.onSurahEnd) {
        r.autoContinue = true
        setSt('loading')
        r.onSurahEnd()
        return
      }
      stop()
    }

    function onError(el) {
      if (!el || el !== curEl() || el._failed === el._qkey) return
      el._failed = el._qkey
      clearStall()
      const n = r.current
      const srcs = n == null ? [] : sourcesOf(n)
      if (r.src + 1 < srcs.length) {
        // Ehtiyat mənbə
        r.src += 1
        r.switching = true
        load(el, n, r.src)
        r.switching = false
        setSt('loading'); armStall()
        playEl(el)
        return
      }
      r.switching = true
      try { el.pause() } catch { /* */ }
      r.switching = false
      setErrorKind(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'load')
      setSt('error')
    }

    function stop() {
      clearStall()
      r.autoContinue = false
      r.switching = true
      for (const el of r.els) {
        el.pause()
        el._qkey = null
        el.removeAttribute('src')
        try { el.load() } catch { /* köhnə brauzer */ }
      }
      r.switching = false
      setCur(null)
      setErrorKind(null)
      setSt('idle')
      r.detached = false; setDetached(false)
    }
    function pause() {
      const el = curEl()
      if (!el) return
      clearStall()
      r.switching = true
      el.pause()
      r.switching = false
      setSt('paused')
    }
    function resume() {
      const n = r.current
      if (n == null) { start(r.range?.from ?? 1); return }
      const el = curEl()
      // Qari dəyişib və ya xəta olub — ayə yenidən yüklənir
      if (r.status === 'error' || !el || el._qkey !== keyOf(n, r.src)) { start(n); return }
      setSt('loading'); armStall()
      playEl(el)
    }
    function toggle(n) {
      if (n != null && n !== r.current) { r.detached = false; setDetached(false); start(n, { followIt: false }); return }
      if (r.status === 'playing' || r.status === 'loading') pause()
      else resume()
    }
    const next = () => { const n = r.current; if (n != null && verseOf(n + 1)) start(n + 1) }
    const prev = () => { const n = r.current; if (n != null && verseOf(n - 1)) start(n - 1) }
    const retry = () => { const n = r.current; if (n != null) start(n) }
    const backToCurrent = () => {
      r.detached = false; setDetached(false)
      if (r.current != null) r.onFollow?.(r.current, { force: true })
    }
    const detach = () => { if (!r.detached) { r.detached = true; setDetached(true) } }

    const savePrefs = patch => {
      const p = { ...r.prefs, ...patch }
      r.prefs = p
      setPrefs(p)
      writeAudioPrefs(p)
      return p
    }
    const setReciter = id => {
      if (id === r.prefs.reciter) return
      savePrefs({ reciter: id })
      // Oxuyursa — cari ayə yeni qaridən əvvəldən; fasilədədirsə — "Davam et" yeni qarini yükləyir
      if (r.current != null && (r.status === 'playing' || r.status === 'loading')) start(r.current, { followIt: false })
      else if (r.current != null) preloadNext(r.current)
    }
    const setRate = rate => {
      savePrefs({ rate })
      for (const el of r.els) { el.defaultPlaybackRate = rate; el.playbackRate = rate }
    }
    const setRepeat = repeat => savePrefs({ repeat })
    const setAutoNext = autoNext => savePrefs({ autoNext })
    const setRange = rg => {
      r.range = rg
      setRangeState(rg)
      if (r.current != null) preloadNext(r.current)
    }
    // Yeni surə gəldi: "növbəti surəyə keç" gözləyirsə — 1-ci ayədən başla
    const surahChanged = () => {
      r.range = null; setRangeState(null)
      if (!r.autoContinue) stop()
    }
    const versesReady = () => {
      if (r.autoContinue && r.verses?.length) { r.autoContinue = false; start(1) }
    }
    const destroy = () => { stop(); r.els = [] }
    return { start, toggle, pause, resume, next, prev, stop, retry, backToCurrent, detach, setReciter, setRate, setRepeat, setAutoNext, setRange, surahChanged, versesReady, destroy }
  }, [r])

  // Surə dəyişdi / oxuyucu bağlandı → səs dayanır
  const firstRef = useRef(true)
  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return }
    api.surahChanged()
  }, [surahNumber, api])
  useEffect(() => { if (verses) api.versesReady() }, [verses, api])
  useEffect(() => () => api.destroy(), [api])

  // İstifadəçi özü sürüşdürür (təkər, toxunuş, klaviatura) → məcburi izləmə dayanır
  const active = current != null && (status === 'playing' || status === 'loading')
  useEffect(() => {
    if (!active) return undefined
    const onInput = () => api.detach()
    const onKey = e => { if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(e.key) && !isTyping(e.target)) api.detach() }
    window.addEventListener('wheel', onInput, { passive: true })
    window.addEventListener('touchmove', onInput, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onInput)
      window.removeEventListener('touchmove', onInput)
      window.removeEventListener('keydown', onKey)
    }
  }, [active, api])

  // Klaviatura: boşluq — oynat/dayandır; ←/→ — ayə (RTL-də güzgülənir)
  const enabled = !!verses
  useEffect(() => {
    if (!enabled) return undefined
    const onKey = e => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || isTyping(e.target)) return
      if (e.code === 'Space' || e.key === ' ') {
        if (isControl(e.target)) return
        e.preventDefault()
        api.toggle()
        return
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && r.current != null) {
        if (e.target?.closest?.('[role="dialog"], [role="group"]')) return
        e.preventDefault()
        const rtl = (document.documentElement.getAttribute('dir') || document.dir) === 'rtl'
        const forward = (e.key === 'ArrowRight') !== rtl
        if (forward) api.next(); else api.prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, api, r])

  // ── Media Session: kilid ekranı, qulaqlıq düymələri ──
  const reciterLabel = reciterName(prefs.reciter, lang)
  const album = (PLAYER_LABELS[lang] || PLAYER_LABELS.az).album
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : null
    if (!ms) return
    if (current == null) {
      try { ms.metadata = null; ms.playbackState = 'none' } catch { /* */ }
      return
    }
    try {
      if (typeof window.MediaMetadata === 'function') {
        ms.metadata = new window.MediaMetadata({
          title: r.mediaTitle ? r.mediaTitle(current) : String(current),
          artist: reciterLabel,
          album,
          artwork: ARTWORK,
        })
      }
      ms.playbackState = status === 'playing' || status === 'loading' ? 'playing' : 'paused'
    } catch { /* köhnə brauzer */ }
  }, [current, status, reciterLabel, album, lang, surahNumber, r])
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : null
    if (!ms) return undefined
    const handlers = {
      play: () => api.resume(),
      pause: () => api.pause(),
      nexttrack: () => api.next(),
      previoustrack: () => api.prev(),
      stop: () => api.stop(),
    }
    for (const [k, fn] of Object.entries(handlers)) { try { ms.setActionHandler(k, fn) } catch { /* dəstəklənmir */ } }
    return () => { for (const k of Object.keys(handlers)) { try { ms.setActionHandler(k, null) } catch { /* */ } } }
  }, [api])

  return { ...api, prefs, current, status, errorKind, range, detached, repeatNo, reciterLabel }
}

// ── İkonlar (yalnız stroke/fill currentColor) ──
function PlayGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4C8.9 4.3 8 4.8 8 5.6z" fill="currentColor" /></svg>
}
function PauseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
      <rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
    </svg>
  )
}
// Əvvəlki / növbəti — ərəbcədə güzgülənir (qpl-flip)
function SkipGlyph({ back }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={`qpl-flip${back ? ' qpl-flip--back' : ''}`}>
      <path d="M6 6.2v11.6c0 .7.8 1.1 1.4.7l8.6-5.8c.5-.4.5-1.1 0-1.5L7.4 5.5C6.8 5.1 6 5.5 6 6.2z" fill="currentColor" />
      <rect x="16.5" y="5.5" width="2.2" height="13" rx="1.1" fill="currentColor" />
    </svg>
  )
}
function RepeatGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2.5 20.5 6 17 9.5" /><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13" />
      <path d="M7 21.5 3.5 18 7 14.5" /><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13" />
    </svg>
  )
}

// Onluq ayırıcı: az/ru/tr — vergül (brauzerin ICU-su az dilini həmişə tanımır)
const fmtRate = (rate, lang) => `${String(rate).replace('.', /^(az|ru|tr)$/.test(lang) ? ',' : '.')}×`

/**
 * Yapışqan mini-pleyer (oxuyucunun altında).
 * player — useQuranPlayer()-in nəticəsi; total — surədəki ayə sayı;
 * verseLabel(n) — "3-cü ayə"
 */
export default function QuranPlayer({ player, lang, total, verseLabel }) {
  const L = PLAYER_LABELS[lang] || PLAYER_LABELS.az
  const { current, status, errorKind, prefs, range, detached, repeatNo, reciterLabel } = player
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const toggleBtnRef = useRef(null)
  const idle = current == null
  const busy = status === 'playing' || status === 'loading'
  const mainLabel = idle ? L.listen : busy ? L.pause : L.resume

  // Panel: kənara klik / Esc bağlayır
  useEffect(() => {
    if (!open) return undefined
    const onDown = e => {
      if (panelRef.current?.contains(e.target) || toggleBtnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); toggleBtnRef.current?.focus() } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  // A–B aralığı: iki sahə; hər ikisi düzgündürsə tətbiq olunur
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  useEffect(() => {
    setRangeFrom(range ? String(range.from) : '')
    setRangeTo(range ? String(range.to) : '')
  }, [range])
  const fromN = Number(rangeFrom); const toN = Number(rangeTo)
  const validNum = n => Number.isInteger(n) && n >= 1 && n <= total
  const rangeBad = rangeFrom !== '' && rangeTo !== '' && validNum(fromN) && validNum(toN) && fromN > toN
  const applyRange = (fStr, tStr) => {
    const f = Number(fStr); const t = Number(tStr)
    if (fStr !== '' && tStr !== '' && validNum(f) && validNum(t) && f <= t) {
      if (!range || range.from !== f || range.to !== t) player.setRange({ from: f, to: t })
    }
  }

  const cycleRate = () => {
    haptic()
    const i = SPEEDS.indexOf(prefs.rate)
    player.setRate(SPEEDS[(i + 1) % SPEEDS.length])
  }
  const onMain = () => {
    haptic()
    if (idle) player.start(range?.from ?? 1)
    else player.toggle()
  }

  const repeatInfo = prefs.repeat > 1 ? `${repeatNo}/${prefs.repeat}` : ''
  const statusText = status === 'loading' ? L.loading : reciterLabel

  return (
    <section className={`qpl ui-enter-rise${idle ? ' is-idle' : ''}${busy ? ' is-busy' : ''}`} aria-label={L.region}>
      {/* Cari ayəyə qayıt — istifadəçi özü sürüşdürəndə */}
      {detached && !idle && (
        <button type="button" className="qpl__back ui-enter-pop" onClick={() => { haptic(); player.backToCurrent() }}>
          <Icon name="target" size={16} />{L.back}
        </button>
      )}
      {status === 'error' && (
        <div className="qpl__error" role="alert">
          <Icon name="alert" size={18} />
          <span className="qpl__error-text">{errorKind === 'offline' ? L.errOffline : L.errLoad}</span>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { haptic(); player.retry() }}>
            <Icon name="refresh" className="ui-btn__icon" />{L.retry}
          </button>
        </div>
      )}
      <div className="qpl__bar">
        <div className="qpl__transport">
          {!idle && (
            <button type="button" className="qpl__btn" onClick={() => { haptic(); player.prev() }}
              disabled={current <= 1} aria-label={L.prev} title={L.prev}>
              <SkipGlyph back />
            </button>
          )}
          <button type="button" className={`qpl__main${idle ? ' qpl__main--wide' : ''}`} onClick={onMain}
            aria-label={mainLabel} title={mainLabel} aria-keyshortcuts="Space">
            <span className="qpl__main-icon" aria-hidden="true">
              <span className={`qpl__glyph${busy ? '' : ' is-on'}`}><PlayGlyph /></span>
              <span className={`qpl__glyph${busy ? ' is-on' : ''}`}><PauseGlyph /></span>
              {status === 'loading' && <span className="qpl__spin" />}
            </span>
            {idle && <span className="qpl__main-text">{L.listen}</span>}
          </button>
          {!idle && (
            <button type="button" className="qpl__btn" onClick={() => { haptic(); player.next() }}
              disabled={current >= total} aria-label={L.next} title={L.next}>
              <SkipGlyph />
            </button>
          )}
        </div>
        <div className="qpl__info" aria-live="polite">
          {!idle && (
            <span className="qpl__verse">
              <span className="qpl__verse-label">{verseLabel(current)}</span>
              <span className="qpl__verse-of ui-num" dir="ltr">{current} / {total}</span>
            </span>
          )}
          <span className="qpl__reciter">{statusText}</span>
        </div>
        <div className="qpl__extra">
          {repeatInfo && <span className="qpl__badge ui-num" dir="ltr" title={L.repeat}><RepeatGlyph />{repeatInfo}</span>}
          {range && <span className="qpl__badge qpl__badge--range ui-num" dir="ltr" title={L.range}>{range.from}–{range.to}</span>}
          <button type="button" className="qpl__btn qpl__rate ui-num" dir="ltr" onClick={cycleRate}
            aria-label={`${L.speed}: ${fmtRate(prefs.rate, lang)}`} title={L.speed}>{fmtRate(prefs.rate, lang)}</button>
          <button type="button" ref={toggleBtnRef} className={`qpl__btn${open ? ' is-active' : ''}`}
            aria-expanded={open} aria-controls="qpl-panel" aria-label={L.settings} title={L.settings}
            onClick={() => { haptic(); setOpen(o => !o) }}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" />
            </svg>
          </button>
          {!idle && (
            <button type="button" className="qpl__btn" onClick={() => { haptic(); player.stop() }} aria-label={L.stop} title={L.stop}>
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="qpl__panel ui-enter-drop" id="qpl-panel" ref={panelRef} role="dialog" aria-label={L.settings}>
          <div className="qpl__panel-head">
            <span className="qpl__panel-title">{L.settings}</span>
            <button type="button" className="qpl__btn qpl__btn--sm" onClick={() => setOpen(false)} aria-label={L.close} title={L.close}>
              <Icon name="close" size={16} />
            </button>
          </div>
          <label className="ui-field">
            <span className="ui-field__label">{L.reciter}</span>
            <select className="ui-input qpl__select" value={prefs.reciter} onChange={e => { haptic(); player.setReciter(e.target.value) }}>
              {RECITERS.map(rc => (
                <option key={rc.id} value={rc.id}>{rc.name[lang] || rc.name.en}{lang !== 'ar' ? ` · ${rc.name.ar}` : ''}</option>
              ))}
            </select>
          </label>
          <div className="qpl__row">
            <span className="ui-field__label" id="qpl-speed">{L.speed}</span>
            <div className="qpl__chips" role="group" aria-labelledby="qpl-speed">
              {SPEEDS.map(s => (
                <button type="button" key={s} className="ui-chip ui-num" dir="ltr" aria-pressed={prefs.rate === s}
                  onClick={() => { haptic(); player.setRate(s) }}>{fmtRate(s, lang)}</button>
              ))}
            </div>
          </div>
          <div className="qpl__row">
            <span className="ui-field__label" id="qpl-repeat">{L.repeat}</span>
            <div className="qpl__chips" role="group" aria-labelledby="qpl-repeat">
              {REPEATS.map(k => (
                <button type="button" key={k} className="ui-chip ui-num" dir="ltr" aria-pressed={prefs.repeat === k}
                  aria-label={`${k} ${L.times}`} onClick={() => { haptic(); player.setRepeat(k) }}>{k}×</button>
              ))}
            </div>
          </div>
          <fieldset className="qpl__range">
            <legend className="ui-field__label">{L.range}</legend>
            <div className="qpl__range-row">
              <label className="qpl__range-field">
                <span className="qpl__range-label">{L.from}</span>
                <input className="ui-input ui-num" type="number" inputMode="numeric" dir="ltr" min={1} max={total} step={1}
                  value={rangeFrom} aria-invalid={rangeBad || undefined}
                  onChange={e => { setRangeFrom(e.target.value); applyRange(e.target.value, rangeTo) }} />
              </label>
              <span className="qpl__range-dash" aria-hidden="true">–</span>
              <label className="qpl__range-field">
                <span className="qpl__range-label">{L.to}</span>
                <input className="ui-input ui-num" type="number" inputMode="numeric" dir="ltr" min={1} max={total} step={1}
                  value={rangeTo} aria-invalid={rangeBad || undefined}
                  onChange={e => { setRangeTo(e.target.value); applyRange(rangeFrom, e.target.value) }} />
              </label>
              {range && (
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { haptic(); player.setRange(null) }}>
                  {L.clearRange}
                </button>
              )}
            </div>
            {rangeBad && <span className="ui-field__hint qpl__hint-bad" role="alert">{L.rangeBad}</span>}
          </fieldset>
          <label className="qpl__switch">
            <input type="checkbox" checked={prefs.autoNext} onChange={e => { haptic(); player.setAutoNext(e.target.checked) }} />
            <span className="qpl__switch-track" aria-hidden="true"><span className="qpl__switch-thumb" /></span>
            <span>{L.autoNext}</span>
          </label>
        </div>
      )}
    </section>
  )
}
