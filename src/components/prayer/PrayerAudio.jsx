// ═══════════════════════════════════════════════════════
// Zikrin səsi — "Dinlə / Dayandır" düyməsi
//
// • Səs mənbəyi yalnız prayerGuide.js-dəki zikr.audio-dur: fayl
//   (public/audio/prayer, WAV — iOS da oxuyur) və ya Quran ayələri
//   (əl-Əfasi, utils/quranAudio.js mənbələri; biri alınmasa növbəti CDN).
// • Səsi olmayan zikr üçün komponent heç nə çəkmir (null).
// • Eyni anda yalnız bir səs çalır — yenisi başlayanda köhnəsi dayanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { RECITERS } from '../../utils/quranAudio'

const ALAFASY = RECITERS.find(r => r.id === 'alafasy') || RECITERS[0]

/** Zikr → oxunacaq hissələr; hər hissə ehtiyat URL-lərin siyahısıdır */
export function zikrTracks(zikr) {
  if (!zikr || !zikr.audio) return []
  if (zikr.audio.file) return [[zikr.audio.file]]
  if (zikr.audio.quran && zikr.quran) {
    const { s, ayahs, first } = zikr.quran
    return ayahs.map((a, i) => ALAFASY.sources.map(fn => fn({ g: first + i, s, a })))
  }
  return []
}

let stopCurrent = null

export default function PrayerAudio({ zikr, t, className = '' }) {
  const tracks = zikrTracks(zikr)
  const [state, setState] = useState('idle') // idle | loading | playing | error
  const audioRef = useRef(null)
  const posRef = useRef({ track: 0, alt: 0 })
  const aliveRef = useRef(true)

  const stop = () => {
    const a = audioRef.current
    if (a) { a.onended = null; a.onerror = null; a.onplaying = null; try { a.pause() } catch { /* yox */ } }
    audioRef.current = null
    if (stopCurrent === stop) stopCurrent = null
    if (aliveRef.current) setState('idle')
  }

  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false; stop() }
  }, [])

  // Zikr dəyişəndə (növbəti addım) səs dayanır
  const key = tracks.map(x => x[0]).join('|')
  useEffect(() => () => stop(), [key])

  if (!tracks.length) return null

  const playAt = (track, alt) => {
    posRef.current = { track, alt }
    const src = tracks[track]?.[alt]
    if (!src) { if (aliveRef.current) setState('error'); audioRef.current = null; return }
    const a = audioRef.current || new Audio()
    audioRef.current = a
    a.preload = 'auto'
    a.onplaying = () => aliveRef.current && setState('playing')
    a.onended = () => {
      if (track + 1 < tracks.length) playAt(track + 1, 0)
      else stop()
    }
    a.onerror = () => playAt(track, alt + 1)
    a.src = src
    const p = a.play()
    if (p && typeof p.catch === 'function') p.catch(err => { if (err && err.name !== 'AbortError') playAt(track, alt + 1) })
  }

  const toggle = () => {
    if (state === 'playing' || state === 'loading') { stop(); return }
    if (stopCurrent) stopCurrent()
    stopCurrent = stop
    setState('loading')
    playAt(0, 0)
  }

  const busy = state === 'playing' || state === 'loading'
  return (
    <button
      type="button"
      className={`ui-btn ui-btn--secondary ui-btn--sm pg-audio ${busy ? 'is-playing' : ''} ${className}`}
      onClick={toggle}
      aria-pressed={busy}
      data-state={state}
    >
      <Icon name={busy ? 'pause' : 'volume'} size={16} className="ui-btn__icon" />
      <span>{state === 'error' ? t.audioErr : busy ? t.stop : t.listen}</span>
      {state === 'playing' && <span className="pg-audio__bars" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  )
}
