// Ayəni dinlə düyməsi (vau3.css §13) — həqiqi qiraət (seçilmiş qari,
// utils/quranAudio: cdn.islamic.network → verses.quran.com ehtiyatı).
// Bütün saytda EYNİ ANDA bir ayə oxunur: tək paylaşılan <audio> + abunəçilər.
// Oxunarkən düymədə 4 zolaqlı səs dalğası "rəqs edir" (yalnız transform,
// yalnız oxunarkən). Ərəbcə dualar üçün yoxlanılmış səs mənbəyi olmadığından
// bu düymə YALNIZ Quran ayələrində işlədilir (mətnə TTS yox).
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { ayahSources, readAudioPrefs } from '../utils/quranAudio'
import { SURAH_START, AYAH_COUNTS } from '../utils/quranMap'
import { pickUi } from '../utils/uiText'
import Icon from './Icon'

const L = {
  az: { play: 'Ayəni dinlə', pause: 'Dayandır' },
  en: { play: 'Listen to the verse', pause: 'Pause' },
  ru: { play: 'Слушать аят', pause: 'Пауза' },
  ar: { play: 'استمع إلى الآية', pause: 'إيقاف مؤقت' },
  tr: { play: 'Ayeti dinle', pause: 'Duraklat' },
}

/** "2:255", "Quran 2:255", "Bəqərə 2:255-256" → { s, a } (ilk ayə) */
export function parseRef(ref) {
  const m = String(ref || '').match(/(\d{1,3})\s*[:：]\s*(\d{1,3})/)
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2])
  if (s < 1 || s > 114 || a < 1 || a > AYAH_COUNTS[s - 1]) return null
  return { s, a }
}

// ── Paylaşılan pleyer ──
let audio = null
let current = ''
const subs = new Set()
const emit = () => subs.forEach(fn => fn(current, !!audio && !audio.paused))

function stop() {
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() }
  current = ''
  emit()
}

function play(id, s, a) {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'none'
    audio.addEventListener('ended', () => { current = ''; emit() })
    audio.addEventListener('pause', emit)
    audio.addEventListener('playing', emit)
  }
  const { reciter } = readAudioPrefs()
  const urls = ayahSources(reciter, { g: SURAH_START[s - 1] + a, s, a })
  let i = 0
  const tryNext = () => {
    if (i >= urls.length) { stop(); return }
    audio.src = urls[i++]
    audio.play().catch(() => { /* növbəti mənbə error hadisəsində */ })
  }
  audio.onerror = () => { if (current === id) tryNext() }
  current = id
  tryNext()
  emit()
}

export default function AyahAudio({ refText, s, a, className = '', size = 'md' }) {
  const { lang } = useLang()
  const l = pickUi(L, lang)
  const parsed = s && a ? { s, a } : parseRef(refText)
  const id = parsed ? `${parsed.s}:${parsed.a}` : ''
  const [state, setState] = useState({ cur: current, playing: false })
  useEffect(() => {
    const fn = (cur, playing) => setState({ cur, playing })
    subs.add(fn)
    return () => { subs.delete(fn) }
  }, [])
  if (!parsed) return null
  const on = state.cur === id && state.playing
  const toggle = () => (state.cur === id ? stop() : play(id, parsed.s, parsed.a))
  return (
    <button
      type="button"
      className={`vx-listen vx-listen--${size}${on ? ' is-on' : ''} ${className}`}
      onClick={toggle}
      aria-label={`${on ? l.pause : l.play} — ${id}`}
      aria-pressed={on}
      title={on ? l.pause : l.play}
    >
      <span className="vx-listen__ic" aria-hidden="true"><Icon name={on ? 'pause' : 'play'} size={size === 'lg' ? 20 : 16} strokeWidth={2} /></span>
      <span className="vx-listen__wave" aria-hidden="true"><i /><i /><i /><i /></span>
      {size === 'lg' && <span className="vx-listen__txt">{on ? l.pause : l.play}</span>}
    </button>
  )
}
